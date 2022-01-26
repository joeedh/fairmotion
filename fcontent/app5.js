
es6_module_define('FrameManager', ["../path-controller/util/vectormath.js", "./FrameManager_mesh.js", "../path-controller/util/simple_events.js", "../widgets/ui_widgets.js", "../widgets/ui_widgets2.js", "../widgets/dragbox.js", "./ScreenArea.js", "../widgets/ui_colorpicker2.js", "../widgets/ui_table.js", "../widgets/ui_treeview.js", "../util/ScreenOverdraw.js", "./AreaDocker.js", "../widgets/ui_menu.js", "../widgets/ui_textbox.js", "../widgets/ui_tabs.js", "../path-controller/controller.js", "../config/const.js", "../widgets/ui_panel.js", "../widgets/ui_dialog.js", "../widgets/ui_listbox.js", "../path-controller/util/util.js", "../core/ui_base.js", "../path-controller/util/math.js", "../path-controller/util/struct.js", "./FrameManager_ops.js", "../widgets/ui_noteframe.js", "../widgets/ui_curvewidget.js"], function _FrameManager_module(_es6_module) {
  var ToolTipViewer=es6_import_item(_es6_module, './FrameManager_ops.js', 'ToolTipViewer');
  let _FrameManager=undefined;
  es6_import(_es6_module, '../widgets/dragbox.js');
  es6_import(_es6_module, '../widgets/ui_widgets2.js');
  es6_import(_es6_module, '../widgets/ui_panel.js');
  es6_import(_es6_module, '../widgets/ui_treeview.js');
  var nstructjs=es6_import_item(_es6_module, '../path-controller/controller.js', 'nstructjs');
  es6_import(_es6_module, '../util/ScreenOverdraw.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var haveModal=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'haveModal');
  var pushModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'popModalLight');
  var _setScreenClass=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', '_setScreenClass');
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  es6_import(_es6_module, '../widgets/ui_curvewidget.js');
  var vectormath=es6_import(_es6_module, '../path-controller/util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var ScreenArea=es6_import(_es6_module, './ScreenArea.js');
  var FrameManager_ops=es6_import(_es6_module, './FrameManager_ops.js');
  var math=es6_import(_es6_module, '../path-controller/util/math.js');
  var ui_menu=es6_import(_es6_module, '../widgets/ui_menu.js');
  es6_import(_es6_module, '../path-controller/util/struct.js');
  var KeyMap=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'KeyMap');
  var HotKey=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'HotKey');
  var keymap=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'keymap');
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
  var PackFlags=es6_import_item(_es6_module, '../core/ui_base.js', 'PackFlags');
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
  var checkForTextBox=es6_import_item(_es6_module, '../widgets/ui_textbox.js', 'checkForTextBox');
  var startMenu=es6_import_item(_es6_module, '../widgets/ui_menu.js', 'startMenu');
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
  let Vector2=vectormath.Vector2, UIBase=ui_base.UIBase, styleScrollBars=ui_base.styleScrollBars;
  let update_stack=new Array(8192);
  update_stack.cur = 0;
  let screen_idgen=0;
  function purgeUpdateStack() {
    for (let i=0; i<update_stack.length; i++) {
        update_stack[i] = undefined;
    }
  }
  purgeUpdateStack = _es6_module.add_export('purgeUpdateStack', purgeUpdateStack);
  class Screen extends ui_base.UIBase {
     constructor() {
      super();
      this.fullScreen = true;
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
      this.oldpos = new Vector2();
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
      let on_mousemove=(e, x, y) =>        {
        let dragging=e.type==="mousemove"||e.type==="touchmove"||e.type==="pointermove";
        dragging = dragging&&(e.buttons||(e.touches&&e.touches.length>0));
        if (!dragging&&Math.random()>0.9) {
            let elem=this.pickElement(x, y, {sx: 1, 
        sy: 1, 
        nodeclass: ScreenArea.ScreenArea, 
        mouseEvent: e});
            if (0) {
                let elem2=this.pickElement(x, y, 1, 1);
                console.log(""+this.sareas.active, elem2 ? elem2.tagName : undefined, elem!==undefined);
            }
            if (elem!==undefined) {
                if (elem.area) {
                    elem.area.push_ctx_active();
                    elem.area.pop_ctx_active();
                }
                this.sareas.active = elem;
            }
        }
        this.mpos[0] = x;
        this.mpos[1] = y;
      };
      this.shadow.addEventListener("mousemove", (e) =>        {
        return on_mousemove(e, e.x, e.y);
      }, {passive: true});
    }
    get  borders() {
      let this2=this;
      return (function* () {
        for (let k in this2._edgemap) {
            yield this2._edgemap[k];
        }
      })();
    }
    get  listening() {
      return this.listen_timer!==undefined;
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
    static  fromJSON(obj, schedule_resize=false) {
      let ret=UIBase.createElement(this.define().tagname);
      return ret.loadJSON(obj, schedule_resize);
    }
    static  define() {
      return {tagname: "pathux-screen-x"}
    }
    static  newSTRUCT() {
      return UIBase.createElement(this.define().tagname);
    }
     init() {
      super.init();
      if (this.hasAttribute("listen")) {
          this.listen();
      }
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
      let ret=UIBase.createElement("screenarea-x");
      ret.ctx = this.ctx;
      if (ret.ctx) {
          ret.init();
      }
      return ret;
    }
     copy() {
      let ret=UIBase.createElement(this.constructor.define().tagname);
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
      startMenu(menu, x, y);
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
      let ret=UIBase.createElement("drag-box-x");
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
      let container=UIBase.createElement("container-x");
      container.ctx = this.ctx;
      container._init();
      let remove=container.remove;
      container.remove = () =>        {
        if (this._popups.indexOf(container)>=0) {
            this._popups.remove(container);
        }
        return remove.apply(container, arguments);
      };
      container.overrideClass("popup");
      container.background = container.getDefault("background-color");
      container.style["border-radius"] = container.getDefault("border-radius")+"px";
      container.style["border-color"] = container.getDefault("border-color");
      container.style["border-style"] = container.getDefault("border-style");
      container.style["border-width"] = container.getDefault("border-width")+"px";
      container.style["box-shadow"] = container.getDefault("box-shadow");
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
        this.ctx.screen.removeEventListener("mousedown", mousepick, true);
        this.ctx.screen.removeEventListener("mousemove", mousepick, {passive: true});
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
        let elem=this.pickElement(x, y, {sx: 2, 
      sy: 2, 
      excluded_classes: [ScreenBorder], 
      mouseEvent: e});
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
        if (!container.isConnected) {
            window.removeEventListener("keydown", keydown);
            return ;
        }
        console.log(e.keyCode);
        switch (e.keyCode) {
          case keymap["Escape"]:
            end();
            break;
        }
      };
      this.ctx.screen.addEventListener("mousemove", mousepick, {passive: true});
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
     checkCSSSize() {
      let w=this.style.width.toLowerCase().trim();
      let h=this.style.height.toLowerCase().trim();
      if (w.endsWith("px")&&h.endsWith("px")) {
          w = parseFloat(w.slice(0, w.length-2).trim());
          h = parseFloat(h.slice(0, h.length-2).trim());
          if (w!==this.size[0]||h!==this.size[1]) {
              this.on_resize([this.size[0], this.size[1]], [w, h]);
              this.size[0] = w;
              this.size[1] = h;
          }
      }
    }
     getBoolAttribute(attr, defaultval=false) {
      if (!this.hasAttribute(attr)) {
          return defaultval;
      }
      let ret=this.getAttribute(attr);
      if (typeof ret==="number") {
          return !!ret;
      }
      else 
        if (typeof ret==="string") {
          ret = ret.toLowerCase().trim();
          ret = ret==="true"||ret==="1"||ret==="yes";
      }
      return !!ret;
    }
     updateSize() {
      if (this.getBoolAttribute("inherit-scale")||!this.fullScreen||!cconst.autoSizeUpdate) {
          this.checkCSSSize();
          return ;
      }
      let width=window.innerWidth;
      let height=window.innerHeight;
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
          let sarea2=UIBase.createElement("screenarea-x");
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
      if (window.DEBUG&&window.DEBUG.keymap) {
          console.warn("execKeyMap called", e.keyCode, document.activeElement.tagName);
      }
      if (this.sareas.active) {
          let area=this.sareas.active.area;
          if (!area) {
              return ;
          }
          area.push_ctx_active();
          for (let keymap of area.getKeyMaps()) {
              if (keymap===undefined) {
                  continue;
              }
              if (keymap.handle(this.ctx, e)) {
                  handled = true;
                  break;
              }
          }
          area.pop_ctx_active();
      }
      handled = handled||this.keymap.handle(this.ctx, e);
      if (!handled&&this.testAllKeyMaps) {
          for (let sarea of this.sareas) {
              if (handled) {
                  break;
              }
              sarea.area.push_ctx_active();
              for (let keymap of sarea.area.getKeyMaps()) {
                  if (keymap.handle(this.ctx, e)) {
                      handled = true;
                      break;
                  }
              }
              sarea.area.pop_ctx_active();
          }
      }
      return handled;
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
     purgeUpdateStack() {
      this._update_gen = undefined;
      purgeUpdateStack();
    }
     completeSetCSS() {
      let rec=(n) =>        {
        n.setCSS();
        if (n.packflag&PackFlags.NO_UPDATE) {
            return ;
        }
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
      if (!s||!s.color)
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
              if (!(__instance_of(n2, UIBase))||!(n2.packflag&PackFlags.NO_UPDATE)) {
                  push(n2);
              }
          }
          if (n.shadow===undefined) {
              continue;
          }
          for (let n2 of n.shadow.childNodes) {
              if (!(__instance_of(n2, UIBase))||!(n2.packflag&PackFlags.NO_UPDATE)) {
                  push(n2);
              }
          }
          if (__instance_of(n, UIBase)) {
              if (!(n.packflag&PackFlags.NO_UPDATE)) {
                  scopestack.push(n);
                  push(SCOPE_POP);
              }
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
     collapseArea(sarea) {
      sarea.remove();
      this.regenBorders();
      this.snapScreenVerts(true);
      this.solveAreaConstraints();
      this.completeSetCSS();
      this.completeUpdate();
      return this;
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
      if (!this.getBoolAttribute("inherit-scale")) {
          this.style["width"] = this.size[0]+"px";
          this.style["height"] = this.size[1]+"px";
      }
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
          this._debug_overlay = UIBase.createElement("overdraw-x");
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
            let ret=UIBase.createElement("div");
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
                ret = UIBase.createElement("div");
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
          for (let v of screenverts()) {
              v[0]+=this.pos[0];
              v[1]+=this.pos[1];
          }
      }
      else {
        for (let v of screenverts()) {

        }
        [min, max] = this._recalcAABB();
        this.size.load(max).sub(min);
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
      if (_set_key) {
          this._last_ckey1 = this._calcSizeKey(newsize[0], newsize[1], this.pos[0], this.pos[1], devicePixelRatio, visualViewport.scale);
      }
      let ratio=[newsize[0]/oldsize[0], newsize[1]/oldsize[1]];
      let offx=this.pos[0]-this.oldpos[0];
      let offy=this.pos[1]-this.oldpos[1];
      this.oldpos.load(this.pos);
      for (let v of this.screenverts) {
          v[0]*=ratio[0];
          v[1]*=ratio[1];
          v[0]+=offx;
          v[1]+=offy;
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
          let sb=this._edgemap[hash] = UIBase.createElement("screenborder-x");
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
              let onblur=(e) =>                {              };
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
      if (checkForTextBox(this, this.mpos[0], this.mpos[1])) {
          console.log("textbox detected");
          return ;
      }
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
     afterSTRUCT() {
      for (let sarea of this.sareas) {
          sarea._ctx = this.ctx;
          sarea.afterSTRUCT();
      }
    }
     loadSTRUCT(reader) {
      this.clear();
      reader(this);
      console.log("SAREAS", this.sareas.concat([]));
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
     test_struct(appstate=_appstate) {
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
      appstate.screen = screen2;
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
  nstructjs.register(Screen);
  ui_base.UIBase.internalRegister(Screen);
  ScreenArea.setScreenClass(Screen);
  _setScreenClass(Screen);
  let get_screen_cb;
  let _on_keydown;
  let start_cbs=[];
  let stop_cbs=[];
  let keyboardDom=window;
  let key_event_opts=undefined;
  function startEvents(getScreenFunc) {
    get_screen_cb = getScreenFunc;
    if (_events_started) {
        return ;
    }
    _events_started = true;
    _on_keydown = (e) =>      {
      let screen=get_screen_cb();
      return screen.on_keydown(e);
    }
    window.addEventListener("keydown", _on_keydown, key_event_opts);
    for (let cb of start_cbs) {
        cb();
    }
  }
  startEvents = _es6_module.add_export('startEvents', startEvents);
  function stopEvents() {
    window.removeEventListener("keydown", _on_keydown, key_event_opts);
    _on_keydown = undefined;
    _events_started = false;
    for (let cb of stop_cbs) {
        try {
          cb();
        }
        catch (error) {
            util.print_stack(error);
        }
    }
    return get_screen_cb;
  }
  stopEvents = _es6_module.add_export('stopEvents', stopEvents);
  function setKeyboardDom(dom) {
    let started=_events_started;
    if (started) {
        stopEvents();
    }
    keyboardDom = dom;
    if (started) {
        startEvents(get_screen_cb);
    }
  }
  setKeyboardDom = _es6_module.add_export('setKeyboardDom', setKeyboardDom);
  function setKeyboardOpts(opts) {
    key_event_opts = opts;
  }
  setKeyboardOpts = _es6_module.add_export('setKeyboardOpts', setKeyboardOpts);
  function _onEventsStart(cb) {
    start_cbs.push(cb);
  }
  _onEventsStart = _es6_module.add_export('_onEventsStart', _onEventsStart);
  function _onEventsStop(cb) {
    stop_cbs.push(cb);
  }
  _onEventsStop = _es6_module.add_export('_onEventsStop', _onEventsStop);
}, '/dev/fairmotion/src/path.ux/scripts/screen/FrameManager.js');


es6_module_define('FrameManager_mesh', ["../path-controller/util/struct.js", "../core/ui_base.js", "../config/const.js", "./FrameManager_ops.js", "../path-controller/util/vectormath.js"], function _FrameManager_mesh_module(_es6_module) {
  var nstructjs=es6_import_item(_es6_module, '../path-controller/util/struct.js', 'default');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var FrameManager_ops=es6_import(_es6_module, './FrameManager_ops.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var Vector2=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector2');
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
      let pad=this.getDefault("mouse-threshold");
      let wid=this.getDefault("border-width");
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
      let color=this.getDefault("border-outer");
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
          
          background-color : ${this.getDefault("border-inner")};
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
      this.style["position"] = "fixed";
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
      return {tagname: "screenborder-x", 
     style: "screenborder"}
    }
  }
  _ESClass.register(ScreenBorder);
  _es6_module.add_class(ScreenBorder);
  ScreenBorder = _es6_module.add_export('ScreenBorder', ScreenBorder);
  ui_base.UIBase.internalRegister(ScreenBorder);
}, '/dev/fairmotion/src/path.ux/scripts/screen/FrameManager_mesh.js');


es6_module_define('FrameManager_ops', ["../path-controller/util/util.js", "../util/simple_events.js", "../path-controller/util/vectormath.js", "../path-controller/toolsys/toolsys.js", "../widgets/ui_widgets2.js", "../core/ui_base.js", "../config/const.js"], function _FrameManager_ops_module(_es6_module) {
  "use strict";
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var vectormath=es6_import(_es6_module, '../path-controller/util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var simple_toolsys=es6_import(_es6_module, '../path-controller/toolsys/toolsys.js');
  var ToolTip=es6_import_item(_es6_module, '../widgets/ui_widgets2.js', 'ToolTip');
  let toolstack_getter=function () {
    throw new Error("must pass a toolstack getter to registerToolStackGetter");
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
      this.overdraw = ui_base.UIBase.createElement("overdraw-x");
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
      this.overdraw = ui_base.UIBase.createElement("overdraw-x");
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
        b.style["border-radius"] = "14px";
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


es6_module_define('ScreenArea', ["../config/const.js", "./area_wrangler.js", "../path-controller/util/simple_events.js", "../path-controller/toolsys/toolprop.js", "./FrameManager_mesh.js", "../core/ui_base.js", "../core/ui.js", "../widgets/ui_noteframe.js", "../path-controller/util/struct.js", "../path-controller/util/util.js", "../path-controller/util/vectormath.js"], function _ScreenArea_module(_es6_module) {
  let _ScreenArea=undefined;
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var vectormath=es6_import(_es6_module, '../path-controller/util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var ui=es6_import(_es6_module, '../core/ui.js');
  var ui_noteframe=es6_import(_es6_module, '../widgets/ui_noteframe.js');
  var haveModal=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'haveModal');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var nstructjs=es6_import_item(_es6_module, '../path-controller/util/struct.js', 'default');
  let UIBase=ui_base.UIBase;
  var EnumProperty=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'EnumProperty');
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
  contextWrangler = _es6_module.add_export('contextWrangler', contextWrangler);
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
      let ret=UIBase.createElement(this.constructor.define().tagname);
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
    static  unregister(cls) {
      let def=cls.define();
      if (!def.areaname) {
          throw new Error("Missing areaname key in define()");
      }
      if (def.areaname in areaclasses) {
          delete areaclasses[def.areaname];
      }
    }
    static  register(cls) {
      let def=cls.define();
      if (!def.areaname) {
          throw new Error("Missing areaname key in define()");
      }
      areaclasses[def.areaname] = cls;
      ui_base.UIBase.internalRegister(cls);
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
          let ret=UIBase.createElement("area-docker-x");
          container.add(ret);
          return ret;
      }
      let prop=Area.makeAreasEnum();
      let dropbox=container.listenum(undefined, {name: this.constructor.define().uiname, 
     enumDef: prop, 
     callback: (id) =>          {
          let cls=areaclasses[id];
          this.owning_sarea.switch_editor(cls);
        }});
      dropbox.update.after(() =>        {
        let name=this.constructor.define().uiname;
        let val=prop.values[name];
        if (dropbox.value!==val&&val in prop.keys) {
            val = prop.keys[val];
        }
        if (dropbox.value!==val) {
            dropbox.setValue(prop.values[name], true);
        }
      });
      return dropbox;
    }
     makeHeader(container, add_note_area=true, make_draggable=true) {
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
        if (haveModal()||!make_draggable) {
            return ;
        }
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
          let notef=UIBase.createElement("noteframe-x");
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
      return {tagname: "pathux-editor-x", 
     areaname: undefined, 
     flag: 0, 
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
    static  newSTRUCT() {
      return UIBase.createElement(this.define().tagname);
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
  nstructjs.register(Area);
  ui_base.UIBase.internalRegister(Area);
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
          let area=UIBase.createElement(tagname);
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
      let ret=UIBase.createElement("screenarea-x");
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
      this.style["position"] = "fixed";
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
          if (this.area===undefined) {
              this.area = child;
          }
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
          this.editormap[name] = UIBase.createElement(def.tagname);
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
      return UIBase.createElement("screenarea-x");
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
          if (!area.constructor||!area.constructor.define||area.constructor===Area) {
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
                  area = UIBase.createElement(area);
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
          this.area.owning_sarea = this;
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
  nstructjs.register(ScreenArea);
  ui_base.UIBase.internalRegister(ScreenArea);
  ui_base._setAreaClass(Area);
}, '/dev/fairmotion/src/path.ux/scripts/screen/ScreenArea.js');


es6_module_define('simple_toolsys', ["../path-controller/toolsys/toolsys.js"], function _simple_toolsys_module(_es6_module) {
  var ____path_controller_toolsys_toolsys_js=es6_import(_es6_module, '../path-controller/toolsys/toolsys.js');
  for (let k in ____path_controller_toolsys_toolsys_js) {
      _es6_module.add_export(k, ____path_controller_toolsys_toolsys_js[k], true);
  }
}, '/dev/fairmotion/src/path.ux/scripts/toolsys/simple_toolsys.js');


es6_module_define('toolpath', ["../path-controller/toolsys/toolsys.js"], function _toolpath_module(_es6_module) {
  var ____path_controller_toolsys_toolsys_js=es6_import(_es6_module, '../path-controller/toolsys/toolsys.js');
  for (let k in ____path_controller_toolsys_toolsys_js) {
      _es6_module.add_export(k, ____path_controller_toolsys_toolsys_js[k], true);
  }
}, '/dev/fairmotion/src/path.ux/scripts/toolsys/toolpath.js');


es6_module_define('toolprop', ["../path-controller/toolsys/toolprop.js"], function _toolprop_module(_es6_module) {
  var ____path_controller_toolsys_toolprop_js=es6_import(_es6_module, '../path-controller/toolsys/toolprop.js');
  for (let k in ____path_controller_toolsys_toolprop_js) {
      _es6_module.add_export(k, ____path_controller_toolsys_toolprop_js[k], true);
  }
}, '/dev/fairmotion/src/path.ux/scripts/toolsys/toolprop.js');


es6_module_define('colorutils', ["../path-controller/util/colorutils.js"], function _colorutils_module(_es6_module) {
  var ____path_controller_util_colorutils_js=es6_import(_es6_module, '../path-controller/util/colorutils.js');
  for (let k in ____path_controller_util_colorutils_js) {
      _es6_module.add_export(k, ____path_controller_util_colorutils_js[k], true);
  }
}, '/dev/fairmotion/src/path.ux/scripts/util/colorutils.js');


es6_module_define('events', ["../path-controller/util/events.js"], function _events_module(_es6_module) {
  var ____path_controller_util_events_js=es6_import(_es6_module, '../path-controller/util/events.js');
  for (let k in ____path_controller_util_events_js) {
      _es6_module.add_export(k, ____path_controller_util_events_js[k], true);
  }
}, '/dev/fairmotion/src/path.ux/scripts/util/events.js');


es6_module_define('graphpack', ["./math.js", "./solver.js", "./vectormath.js", "./util.js"], function _graphpack_module(_es6_module) {
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
      let $_t0urre=params, v1=$_t0urre[0], v2=$_t0urre[1];
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
      let $_t1rmpv=params, n1=$_t1rmpv[0], n2=$_t1rmpv[1];
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


es6_module_define('html5_fileapi', ["../path-controller/util/html5_fileapi.js"], function _html5_fileapi_module(_es6_module) {
  var ____path_controller_util_html5_fileapi_js=es6_import(_es6_module, '../path-controller/util/html5_fileapi.js');
  for (let k in ____path_controller_util_html5_fileapi_js) {
      _es6_module.add_export(k, ____path_controller_util_html5_fileapi_js[k], true);
  }
}, '/dev/fairmotion/src/path.ux/scripts/util/html5_fileapi.js');


es6_module_define('math', ["../path-controller/util/math.js"], function _math_module(_es6_module) {
  var ____path_controller_util_math_js=es6_import(_es6_module, '../path-controller/util/math.js');
  for (let k in ____path_controller_util_math_js) {
      _es6_module.add_export(k, ____path_controller_util_math_js[k], true);
  }
}, '/dev/fairmotion/src/path.ux/scripts/util/math.js');


es6_module_define('nstructjs', ["../path-controller/util/nstructjs.js"], function _nstructjs_module(_es6_module) {
  var ____path_controller_util_nstructjs_js=es6_import(_es6_module, '../path-controller/util/nstructjs.js');
  for (let k in ____path_controller_util_nstructjs_js) {
      _es6_module.add_export(k, ____path_controller_util_nstructjs_js[k], true);
  }
}, '/dev/fairmotion/src/path.ux/scripts/util/nstructjs.js');


es6_module_define('ScreenOverdraw', ["../core/ui_base.js", "./math.js", "../core/ui.js", "./util.js", "./vectormath.js"], function _ScreenOverdraw_module(_es6_module) {
  "use strict";
  const SVG_URL='http://www.w3.org/2000/svg';
  _es6_module.add_export('SVG_URL', SVG_URL);
  var util=es6_import(_es6_module, './util.js');
  var vectormath=es6_import(_es6_module, './vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var ui=es6_import(_es6_module, '../core/ui.js');
  var math=es6_import(_es6_module, './math.js');
  const Vector2=vectormath.Vector2;
  class CanvasOverdraw extends ui_base.UIBase {
     constructor() {
      super();
      this.canvas = document.createElement("canvas");
      this.shadow.appendChild(this.canvas);
      this.g = this.canvas.getContext("2d");
      this.screen = undefined;
      this.shapes = [];
      this.otherChildren = [];
      this.font = undefined;
      let style=document.createElement("style");
      style.textContent = `
      .overdrawx {
        pointer-events : none;
      }
    `;
      this.shadow.appendChild(style);
    }
    static  define() {
      return {tagname: 'screen-overdraw-canvas-x'}
    }
     startNode(node, screen) {
      if (screen) {
          this.screen = screen;
          this.ctx = screen.ctx;
      }
      if (!this.parentNode) {
          node.appendChild(this);
      }
      this.style["display"] = "float";
      this.style["z-index"] = this.zindex_base;
      this.style["position"] = "absolute";
      this.style["left"] = "0px";
      this.style["top"] = "0px";
      this.style["width"] = "100%";
      this.style["height"] = "100%";
      this.style["pointer-events"] = "none";
      this.svg = document.createElementNS(SVG_URL, "svg");
      this.svg.style["width"] = "100%";
      this.svg.style["height"] = "100%";
      this.svg.style["pointer-events"] = "none";
      this.shadow.appendChild(this.svg);
    }
     start(screen) {
      this.screen = screen;
      this.ctx = screen.ctx;
      screen.parentNode.appendChild(this);
      this.style["display"] = "float";
      this.style["z-index"] = this.zindex_base;
      this.style["position"] = "absolute";
      this.style["left"] = "0px";
      this.style["top"] = "0px";
      this.style["width"] = screen.size[0]+"px";
      this.style["height"] = screen.size[1]+"px";
      this.style["pointer-events"] = "none";
      this.svg = document.createElementNS(SVG_URL, "svg");
      this.svg.style["width"] = "100%";
      this.svg.style["height"] = "100%";
      this.shadow.appendChild(this.svg);
    }
  }
  _ESClass.register(CanvasOverdraw);
  _es6_module.add_class(CanvasOverdraw);
  CanvasOverdraw = _es6_module.add_export('CanvasOverdraw', CanvasOverdraw);
  class Overdraw extends ui_base.UIBase {
     constructor() {
      super();
      this.visibleToPick = false;
      this.screen = undefined;
      this.shapes = [];
      this.otherChildren = [];
      this.font = undefined;
      let style=document.createElement("style");
      style.textContent = `
      .overdrawx {
        pointer-events : none;
      }
    `;
      this.shadow.appendChild(style);
      this.zindex_base = 1000;
    }
     startNode(node, screen) {
      if (screen) {
          this.screen = screen;
          this.ctx = screen.ctx;
      }
      if (!this.parentNode) {
          node.appendChild(this);
      }
      this.style["display"] = "float";
      this.style["z-index"] = this.zindex_base;
      this.style["position"] = "absolute";
      this.style["left"] = "0px";
      this.style["top"] = "0px";
      this.style["width"] = "100%";
      this.style["height"] = "100%";
      this.style["pointer-events"] = "none";
      this.svg = document.createElementNS(SVG_URL, "svg");
      this.svg.style["width"] = "100%";
      this.svg.style["height"] = "100%";
      this.svg.style["pointer-events"] = "none";
      this.shadow.appendChild(this.svg);
    }
     start(screen) {
      this.screen = screen;
      this.ctx = screen.ctx;
      screen.parentNode.appendChild(this);
      this.style["display"] = "float";
      this.style["z-index"] = this.zindex_base;
      this.style["position"] = "absolute";
      this.style["left"] = "0px";
      this.style["top"] = "0px";
      this.style["width"] = screen.size[0]+"px";
      this.style["height"] = screen.size[1]+"px";
      this.style["pointer-events"] = "none";
      this.svg = document.createElementNS(SVG_URL, "svg");
      this.svg.style["width"] = "100%";
      this.svg.style["height"] = "100%";
      this.shadow.appendChild(this.svg);
    }
     clear() {
      for (let child of list(this.svg.childNodes)) {
          child.remove();
      }
      for (let child of this.otherChildren) {
          child.remove();
      }
      this.otherChildren.length = 0;
    }
     drawTextBubbles(texts, cos, colors) {
      let boxes=[];
      let elems=[];
      let cent=new Vector2();
      for (let i=0; i<texts.length; i++) {
          let co=cos[i];
          let text=texts[i];
          let color;
          if (colors!==undefined) {
              color = colors[i];
          }
          cent.add(co);
          let box=this.text(texts[i], co[0], co[1], {color: color});
          boxes.push(box);
          let font=box.style["font"];
          let pat=/[0-9]+px/;
          let size=font.match(pat)[0];
          if (size===undefined) {
              size = this.getDefault("DefaultText").size;
          }
          else {
            size = ui_base.parsepx(size);
          }
          let tsize=ui_base.measureTextBlock(this, text, undefined, undefined, size, font);
          box.minsize = [~~tsize.width, ~~tsize.height];
          let pad=ui_base.parsepx(box.style["padding"]);
          box.minsize[0]+=pad*2;
          box.minsize[1]+=pad*2;
          let x=ui_base.parsepx(box.style["left"]);
          let y=ui_base.parsepx(box.style["top"]);
          box.grads = new Array(4);
          box.params = [x, y, box.minsize[0], box.minsize[1]];
          box.startpos = new Vector2([x, y]);
          box.setCSS = function () {
            this.style["padding"] = "0px";
            this.style["margin"] = "0px";
            this.style["left"] = ~~this.params[0]+"px";
            this.style["top"] = ~~this.params[1]+"px";
            this.style["width"] = ~~this.params[2]+"px";
            this.style["height"] = ~~this.params[3]+"px";
          };
          box.setCSS();
          elems.push(box);
      }
      if (boxes.length===0) {
          return ;
      }
      cent.mulScalar(1.0/boxes.length);
      function error() {
        let p1=[0, 0], p2=[0, 0];
        let s1=[0, 0], s2=[0, 0];
        let ret=0.0;
        for (let box1 of boxes) {
            for (let box2 of boxes) {
                if (box2===box1) {
                    continue;
                }
                s1[0] = box1.params[2];
                s1[1] = box1.params[3];
                s2[0] = box2.params[2];
                s2[1] = box2.params[3];
                let overlap=math.aabb_overlap_area(box1.params, s1, box2.params, s2);
                ret+=overlap;
            }
            ret+=box1.startpos.vectorDistance(box1.params)*0.25;
        }
        return ret;
      }
      function solve() {
        let r1=error();
        if (r1===0.0) {
            return ;
        }
        let df=0.0001;
        let totgs=0.0;
        for (let box of boxes) {
            for (let i=0; i<box.params.length; i++) {
                let orig=box.params[i];
                box.params[i]+=df;
                let r2=error();
                box.params[i] = orig;
                box.grads[i] = (r2-r1)/df;
                totgs+=box.grads[i]**2;
            }
        }
        if (totgs===0.0) {
            return ;
        }
        r1/=totgs;
        let k=0.4;
        for (let box of boxes) {
            for (let i=0; i<box.params.length; i++) {
                box.params[i]+=-r1*box.grads[i]*k;
            }
            box.params[2] = Math.max(box.params[2], box.minsize[0]);
            box.params[3] = Math.max(box.params[3], box.minsize[1]);
            box.setCSS();
        }
      }
      for (let i=0; i<15; i++) {
          solve();
      }
      for (let box of boxes) {
          elems.push(this.line(box.startpos, box.params));
      }
      return elems;
    }
     text(text, x, y, args={}) {
      args = Object.assign({}, args);
      if (args.font===undefined) {
          if (this.font!==undefined)
            args.font = this.font;
          else 
            args.font = this.getDefault("DefaultText").genCSS();
      }
      if (!args["background-color"]) {
          args["background-color"] = "rgba(75, 75, 75, 0.75)";
      }
      args.color = args.color ? args.color : "white";
      if (typeof args.color==="object") {
          args.color = ui_base.color2css(args.color);
      }
      args["padding"] = args["padding"]===undefined ? "5px" : args["padding"];
      args["border-color"] = args["border-color"] ? args["border-color"] : "grey";
      args["border-radius"] = args["border-radius"] ? args["border-radius"] : "25px";
      args["border-width"] = args["border-width"]!==undefined ? args["border-width"] : "2px";
      if (typeof args["border-width"]==="number") {
          args["border-width"] = ""+args["border-width"]+"px";
      }
      if (typeof args["border-radius"]==="number") {
          args["border-radius"] = ""+args["border-radius"]+"px";
      }
      let box=document.createElement("div");
      box.setAttribute("class", "overdrawx");
      box.style["position"] = "absolute";
      box.style["width"] = "min-contents";
      box.style["height"] = "min-contents";
      box.style["border-width"] = args["border-width"];
      box.style["border-radius"] = "25px";
      box.style["pointer-events"] = "none";
      box.style["z-index"] = this.zindex_base+1;
      box.style["background-color"] = args["background-color"];
      box.style["padding"] = args["padding"];
      box.style["left"] = x+"px";
      box.style["top"] = y+"px";
      box.style["display"] = "flex";
      box.style["justify-content"] = "center";
      box.style["align-items"] = "center";
      box.innerText = text;
      box.style["font"] = args.font;
      box.style["color"] = args.color;
      this.otherChildren.push(box);
      this.shadow.appendChild(box);
      return box;
    }
     circle(p, r, stroke="black", fill="none") {
      let circle=document.createElementNS(SVG_URL, "circle");
      circle.setAttribute("cx", p[0]);
      circle.setAttribute("cy", p[1]);
      circle.setAttribute("r", r);
      if (fill) {
          circle.setAttribute("style", `stroke:${stroke};stroke-width:2;fill:${fill}`);
      }
      else {
        circle.setAttribute("style", `stroke:${stroke};stroke-width:2`);
      }
      this.svg.appendChild(circle);
      return circle;
    }
     line(v1, v2, color="black") {
      let line=document.createElementNS(SVG_URL, "line");
      line.setAttribute("x1", v1[0]);
      line.setAttribute("y1", v1[1]);
      line.setAttribute("x2", v2[0]);
      line.setAttribute("y2", v2[1]);
      line.setAttribute("style", `stroke:${color};stroke-width:2`);
      this.svg.appendChild(line);
      return line;
    }
     rect(p, size, color="black") {
      let line=document.createElementNS(SVG_URL, "rect");
      line.setAttribute("x", p[0]);
      line.setAttribute("y", p[1]);
      line.setAttribute("width", size[0]);
      line.setAttribute("height", size[1]);
      line.setAttribute("style", `fill:${color};stroke-width:2`);
      line.setColor = (color) =>        {
        line.setAttribute("style", `fill:${color};stroke-width:2`);
      };
      this.svg.appendChild(line);
      return line;
    }
     end() {
      this.clear();
      this.remove();
    }
    static  define() {
      return {tagname: "overdraw-x", 
     style: "overdraw"}
    }
  }
  _ESClass.register(Overdraw);
  _es6_module.add_class(Overdraw);
  Overdraw = _es6_module.add_export('Overdraw', Overdraw);
  ui_base.UIBase.internalRegister(Overdraw);
}, '/dev/fairmotion/src/path.ux/scripts/util/ScreenOverdraw.js');


es6_module_define('simple_events', ["../path-controller/util/simple_events.js"], function _simple_events_module(_es6_module) {
  var ____path_controller_util_simple_events_js=es6_import(_es6_module, '../path-controller/util/simple_events.js');
  for (let k in ____path_controller_util_simple_events_js) {
      _es6_module.add_export(k, ____path_controller_util_simple_events_js[k], true);
  }
}, '/dev/fairmotion/src/path.ux/scripts/util/simple_events.js');


es6_module_define('solver', ["../path-controller/util/solver.js"], function _solver_module(_es6_module) {
  var ____path_controller_util_solver_js=es6_import(_es6_module, '../path-controller/util/solver.js');
  for (let k in ____path_controller_util_solver_js) {
      _es6_module.add_export(k, ____path_controller_util_solver_js[k], true);
  }
}, '/dev/fairmotion/src/path.ux/scripts/util/solver.js');


es6_module_define('startup_report', ["./util.js"], function _startup_report_module(_es6_module) {
  var util=es6_import(_es6_module, './util.js');
  function startupReport() {
    let s='';
    for (let i=0; i<arguments.length; i++) {
        s+=arguments[i]+' ';
    }
    console.log(util.termColor(s, "green"));
  }
  startupReport = _es6_module.add_export('startupReport', startupReport);
}, '/dev/fairmotion/src/path.ux/scripts/util/startup_report.js');


es6_module_define('struct', ["../path-controller/util/struct.js"], function _struct_module(_es6_module) {
  var ____path_controller_util_struct_js=es6_import(_es6_module, '../path-controller/util/struct.js');
  for (let k in ____path_controller_util_struct_js) {
      _es6_module.add_export(k, ____path_controller_util_struct_js[k], true);
  }
}, '/dev/fairmotion/src/path.ux/scripts/util/struct.js');


es6_module_define('vectormath', ["../path-controller/util/vectormath.js"], function _vectormath_module(_es6_module) {
  var ____path_controller_util_vectormath_js=es6_import(_es6_module, '../path-controller/util/vectormath.js');
  for (let k in ____path_controller_util_vectormath_js) {
      _es6_module.add_export(k, ____path_controller_util_vectormath_js[k], true);
  }
}, '/dev/fairmotion/src/path.ux/scripts/util/vectormath.js');


es6_module_define('dragbox', ["../core/ui_theme.js", "../path-controller/util/simple_events.js", "../core/ui_base.js", "../core/ui.js"], function _dragbox_module(_es6_module) {
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var Icons=es6_import_item(_es6_module, '../core/ui_base.js', 'Icons');
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  var pushModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'popModalLight');
  var keymap=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'keymap');
  var parsepx=es6_import_item(_es6_module, '../core/ui_theme.js', 'parsepx');
  function startDrag(box) {
    if (box._modal) {
        popModalLight(box._modal);
        box._modal = undefined;
        return ;
    }
    let first=true;
    let lastx=0;
    let lasty=0;
    let handlers={on_mousemove: function on_mousemove(e) {
        let x=e.x, y=e.y;
        if (first) {
            lastx = x;
            lasty = y;
            first = false;
            return ;
        }
        let dx=x-lastx;
        let dy=y-lasty;
        let hx=parsepx(box.style["left"]);
        let hy=parsepx(box.style["top"]);
        hx+=dx;
        hy+=dy;
        console.log(hx, hy);
        box.style["left"] = hx+"px";
        box.style["top"] = hy+"px";
        lastx = x;
        lasty = y;
      }, 
    end: function end() {
        if (box._modal) {
            popModalLight(box._modal);
            box._modal = undefined;
        }
      }, 
    on_mouseup: function on_mouseup(e) {
        this.end();
      }, 
    on_keydown: function on_keydown(e) {
        switch (e.keyCode) {
          case keymap["Escape"]:
          case keymap["Return"]:
            this.end();
            break;
        }
      }}
    box._modal = pushModalLight(handlers);
  }
  class DragBox extends Container {
     constructor() {
      super();
      this._done = false;
      this.header = UIBase.createElement("rowframe-x");
      this.contents = UIBase.createElement("container-x");
      this.header.style["border-radius"] = "20px";
      this.header.parentWidget = this;
      this.contents.parentWidget = this;
      this.shadow.appendChild(this.header);
      this.shadow.appendChild(this.contents);
    }
     init() {
      super.init();
      let header=this.header;
      header.ctx = this.ctx;
      this.contents.ctx = this.ctx;
      header._init();
      this.contents._init();
      this.style["min-width"] = "350px";
      header.style["height"] = "35px";
      let icon=header.iconbutton(Icons.DELETE, "Hide", () =>        {
        this.end();
      });
      icon.iconsheet = 0;
      this.addEventListener("mousedown", (e) =>        {
        console.log("start drag");
        startDrag(this);
        e.preventDefault();
      }, {capture: false});
      header.background = this.getDefault("background-color");
      this.setCSS();
    }
     add() {
      return this.contents.add(...arguments);
    }
     prepend(n) {
      return this.contents.prepend(n);
    }
     appendChild(n) {
      return this.contents.appendChild(n);
    }
     col() {
      return this.contents.col(...arguments);
    }
     row() {
      return this.contents.row(...arguments);
    }
     strip() {
      return this.contents.strip(...arguments);
    }
     button() {
      return this.contents.button(...arguments);
    }
     iconbutton() {
      return this.contents.iconbutton(...arguments);
    }
     iconcheck() {
      return this.contents.iconcheck(...arguments);
    }
     tool() {
      return this.contents.tool(...arguments);
    }
     menu() {
      return this.contents.menu(...arguments);
    }
     prop() {
      return this.contents.prop(...arguments);
    }
     listenum() {
      return this.contents.listenum(...arguments);
    }
     check() {
      return this.contents.check(...arguments);
    }
     iconenum() {
      return this.contents.iconenum(...arguments);
    }
     slider() {
      return this.contents.slider(...arguments);
    }
     simpleslider() {
      return this.contents.simpleslider(...arguments);
    }
     curve() {
      return this.contents.curve(...arguments);
    }
     textbox() {
      return this.contents.textbox(...arguments);
    }
     textarea() {
      return this.contents.textarea(...arguments);
    }
     viewer() {
      return this.contents.viewer(...arguments);
    }
     panel() {
      return this.contents.panel(...arguments);
    }
     tabs() {
      return this.contents.tabs(...arguments);
    }
     table() {
      return this.contents.table(...arguments);
    }
     end() {
      if (this._done) {
          return ;
      }
      this.remove();
      if (this._onend) {
          this._onend();
      }
      if (this.onend) {
          this.onend();
      }
    }
     setCSS() {
      super.setCSS();
      this.background = this.getDefault("background-color");
    }
    static  define() {
      return {tagname: "drag-box-x", 
     style: "panel"}
    }
  }
  _ESClass.register(DragBox);
  _es6_module.add_class(DragBox);
  DragBox = _es6_module.add_export('DragBox', DragBox);
  UIBase.internalRegister(DragBox);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/dragbox.js');


es6_module_define('theme_editor', ["../core/ui.js", "../core/ui_base.js", "../core/ui_theme.js", "../path-controller/util/struct.js", "../screen/ScreenArea.js"], function _theme_editor_module(_es6_module) {
  var Area=es6_import_item(_es6_module, '../screen/ScreenArea.js', 'Area');
  var nstructjs=es6_import(_es6_module, '../path-controller/util/struct.js');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var theme=es6_import_item(_es6_module, '../core/ui_base.js', 'theme');
  var flagThemeUpdate=es6_import_item(_es6_module, '../core/ui_base.js', 'flagThemeUpdate');
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  var validateCSSColor=es6_import_item(_es6_module, '../core/ui_theme.js', 'validateCSSColor');
  var color2css=es6_import_item(_es6_module, '../core/ui_theme.js', 'color2css');
  var css2color=es6_import_item(_es6_module, '../core/ui_theme.js', 'css2color');
  var CSSFont=es6_import_item(_es6_module, '../core/ui_theme.js', 'CSSFont');
  class ThemeEditor extends Container {
     constructor() {
      super();
      this.categoryMap = {};
    }
    static  define() {
      return {tagname: "theme-editor-x", 
     style: "theme-editor"}
    }
     init() {
      super.init();
      this.build();
    }
     doFolder(catkey, obj, container=this) {
      let key=catkey.key;
      let panel=container.panel(key, undefined, undefined, catkey.help);
      panel.style["margin-left"] = "15px";
      let row=panel.row();
      let col1=row.col();
      let col2=row.col();
      let do_onchange=(key, k, obj) =>        {
        flagThemeUpdate();
        if (this.onchange) {
            this.onchange(key, k, obj);
        }
        this.ctx.screen.completeSetCSS();
        this.ctx.screen.completeUpdate();
      };
      let getpath=(path) =>        {
        let obj=theme;
        for (let i=0; i<path.length; i++) {
            obj = obj[path[i]];
        }
        return obj;
      };
      let ok=false;
      let _i=0;
      let dokey=(k, v, path) =>        {
        let col=_i%2===0 ? col1 : col2;
        if (k.toLowerCase().search("flag")>=0) {
            return ;
        }
        if (typeof v==="string") {
            let v2=v.toLowerCase().trim();
            let iscolor=validateCSSColor(v2);
            if (iscolor) {
                let cw=col.colorbutton();
                ok = true;
                _i++;
                let color=css2color(v2);
                if (color.length<3) {
                    color = [color[0], color[1], color[2], 1.0];
                }
                try {
                  cw.setRGBA(color);
                }
                catch (error) {
                    console.warn("Failed to set color "+k, v2);
                }
                cw.onchange = () =>                  {
                  console.log("setting '"+k+"' to "+color2css(cw.rgba), key);
                  getpath(path)[k] = color2css(cw.rgba);
                  do_onchange(key, k);
                };
                cw.label = k;
            }
            else {
              col.label(k);
              let box=col.textbox();
              box.onchange = () =>                {
                getpath(path)[k] = box.text;
                do_onchange(key, k);
              };
              box.text = v;
            }
        }
        else 
          if (typeof v==="number") {
            let slider=col.slider(undefined, k, v, 0, 256, 0.01, false);
            slider.baseUnit = slider.displayUnit = "none";
            ok = true;
            _i++;
            slider.onchange = () =>              {
              getpath(path)[k] = slider.value;
              do_onchange(key, k);
            };
        }
        else 
          if (typeof v==="boolean") {
            let check=col.check(undefined, k);
            check.value = getpath(path)[k];
            check.onchange = () =>              {
              getpath(path)[k] = !!check.value;
              do_onchange(key, k);
            };
        }
        else 
          if (typeof v==="object"&&__instance_of(v, CSSFont)) {
            let panel2=col.panel(k);
            ok = true;
            _i++;
            let textbox=(key) =>              {
              panel2.label(key);
              let tbox=panel2.textbox(undefined, v[key]);
              tbox.width = tbox.getDefault("width");
              tbox.onchange = function () {
                v[key] = this.text;
                do_onchange(key, k);
              }
            };
            textbox("font");
            textbox("variant");
            textbox("weight");
            textbox("style");
            let cw=panel2.colorbutton();
            cw.label = "color";
            cw.setRGBA(css2color(v.color));
            cw.onchange = () =>              {
              v.color = color2css(cw.rgba);
              do_onchange(key, k);
            };
            let slider=panel2.slider(undefined, "size", v.size);
            slider.onchange = () =>              {
              v.size = slider.value;
              do_onchange(key, k);
            };
            slider.setAttribute("min", 1);
            slider.setAttribute("max", 100);
            slider.baseUnit = slider.displayUnit = "none";
            panel2.closed = true;
        }
        else 
          if (typeof v==="object") {
            let old={panel: panel, 
        row: row, 
        col1: col1, 
        col2: col2};
            let path2=path.slice(0, path.length);
            path2.push(k);
            panel = panel.panel(k);
            row = panel.row();
            col1 = row.col();
            col2 = row.col();
            for (let k2 in v) {
                let v2=v[k2];
                dokey(k2, v2, path2);
            }
            panel = old.panel;
            row = old.row;
            col1 = old.col1;
            col2 = old.col2;
        }
      };
      for (let k in obj) {
          let v=obj[k];
          dokey(k, v, [key]);
      }
      if (!ok) {
          panel.remove();
      }
      else {
        panel.closed = true;
      }
    }
     build() {
      let categories={};
      for (let k of Object.keys(theme)) {
          let catkey;
          if (k in this.categoryMap) {
              let cat=this.categoryMap[k];
              if (typeof cat==="string") {
                  cat = {category: cat, 
           help: "", 
           key: k};
              }
              catkey = cat;
          }
          else {
            catkey = {category: k, 
        help: '', 
        key: k};
          }
          if (!catkey.key) {
              catkey.key = k;
          }
          if (!(catkey.category in categories)) {
              categories[catkey.category] = [];
          }
          categories[catkey.category].push(catkey);
      }
      function strcmp(a, b) {
        a = a.trim().toLowerCase();
        b = b.trim().toLowerCase();
        return a<b ? -1 : (a===b ? 0 : 1);
      }
      let keys=Object.keys(categories);
      keys.sort(strcmp);
      for (let k of keys) {
          let list=categories[k];
          list.sort((a, b) =>            {
            return strcmp(a.key, b.key);
          });
          let panel=this;
          if (list.length>1) {
              panel = this.panel(k);
          }
          for (let cat of list) {
              let k2=cat.key;
              let v=theme[k2];
              if (typeof v==="object") {
                  this.doFolder(cat, v, panel);
              }
          }
          if (list.length>1) {
              panel.closed = true;
          }
      }
    }
  }
  _ESClass.register(ThemeEditor);
  _es6_module.add_class(ThemeEditor);
  ThemeEditor = _es6_module.add_export('ThemeEditor', ThemeEditor);
  UIBase.internalRegister(ThemeEditor);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/theme_editor.js');


es6_module_define('ui_button', ["../config/const.js", "../path-controller/util/vectormath.js", "../path-controller/toolsys/toolprop.js", "../path-controller/util/simple_events.js", "../path-controller/util/util.js", "../path-controller/util/events.js", "../path-controller/controller/controller.js", "../path-controller/toolsys/toolsys.js", "../core/ui_base.js"], function _ui_button_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var vectormath=es6_import(_es6_module, '../path-controller/util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../path-controller/util/events.js');
  var simple_toolsys=es6_import(_es6_module, '../path-controller/toolsys/toolsys.js');
  var toolprop=es6_import(_es6_module, '../path-controller/toolsys/toolprop.js');
  var DataPathError=es6_import_item(_es6_module, '../path-controller/controller/controller.js', 'DataPathError');
  var Vector3=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Quat');
  var Matrix4=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Matrix4');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var _themeUpdateKey=es6_import_item(_es6_module, '../core/ui_base.js', '_themeUpdateKey');
  var CSSFont=es6_import_item(_es6_module, '../core/ui_base.js', 'CSSFont');
  var pushModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'popModalLight');
  var eventWasTouch=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'eventWasTouch');
  let keymap=events.keymap;
  let EnumProperty=toolprop.EnumProperty, PropTypes=toolprop.PropTypes;
  let UIBase=ui_base.UIBase, PackFlags=ui_base.PackFlags, IconSheets=ui_base.IconSheets;
  let parsepx=ui_base.parsepx;
  cconst.DEBUG.buttonEvents = true;
  class Button extends UIBase {
     constructor() {
      super();
      this.label = document.createElement("span");
      this.label.innerText = "button";
      this.shadow.appendChild(this.label);
      this.label.style["pointer-events"] = "none";
      this._pressed = false;
      this._highlight = false;
      this._auto_depress = true;
      this._modalstate = undefined;
      this._last_name = undefined;
      this._last_disabled = undefined;
    }
     init() {
      super.init();
      this.tabIndex = 0;
      this.bindEvents();
      this.setCSS();
    }
    get  name() {
      return ""+this.getAttribute("name");
    }
    set  name(val) {
      this.setAttribute("name", val);
    }
     setCSS() {
      super.setCSS();
      let subkey=undefined;
      if (this.disabled) {
          subkey = "disabled";
      }
      else 
        if (this._pressed&&this._highlight) {
          subkey = "highlight-pressed";
      }
      else 
        if (this._pressed) {
          subkey = "pressed";
      }
      else 
        if (this._highlight) {
          subkey = "highlight";
      }
      let h=this.getDefault("height");
      this.setBoxCSS(subkey);
      this.label.style["padding"] = this.label.style["margin"] = "0px";
      this.style["background-color"] = this.getSubDefault(subkey, "background-color");
      let font=this.getSubDefault(subkey, "DefaultText");
      this.label.style["font"] = font.genCSS();
      this.label.style["color"] = font.color;
      this.style["display"] = "flex";
      this.style["align-items"] = "center";
      this.style["width"] = "max-content";
      this.style["height"] = h+"px";
      this.style["user-select"] = "none";
      this.label.style["user-select"] = "none";
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
     bindEvents() {
      let press_gen=0;
      let depress;
      let press=(e) =>        {
        e.stopPropagation();
        if (!this._modalstate) {
            let this2=this;
            this._modalstate = pushModalLight({on_mousedown: function on_mousedown(e) {
                this.end(e);
              }, 
        on_mouseup: function on_mouseup(e) {
                this.end(e);
              }, 
        end: function end(e) {
                if (!this2._modalstate) {
                    return ;
                }
                popModalLight(this2._modalstate);
                this2._modalstate = undefined;
                depress(e);
              }});
        }
        if (cconst.DEBUG.buttonEvents) {
            console.log("button press", this._pressed, this.disabled, e.button);
        }
        if (this.disabled)
          return ;
        this._pressed = true;
        if (util.isMobile()&&this.onclick&&e.button===0) {
            this.onclick();
        }
        if (this._onpress) {
            this._onpress(this);
        }
        this._redraw();
        e.preventDefault();
      };
      depress = (e) =>        {
        if (cconst.DEBUG.buttonEvents)
          console.log("button depress", e.button, e.was_touch);
        if (this._auto_depress) {
            this._pressed = false;
            if (this.disabled)
              return ;
            this._redraw();
        }
        e.preventDefault();
        e.stopPropagation();
        if (util.isMobile()||e.type==="mouseup"&&e.button) {
            return ;
        }
        this._redraw();
        if (cconst.DEBUG.buttonEvents)
          console.log("button click callback:", this.onclick, this._onpress, this.onpress);
        if (this.onclick&&e.touches!==undefined) {
            this.onclick(this);
        }
        this.undoBreakPoint();
      };
      this.addEventListener("click", () =>        {
        this._pressed = false;
        this._highlight = false;
        this._redraw();
      });
      this.addEventListener("mousedown", press, {captured: true, 
     passive: false});
      this.addEventListener("mouseup", depress, {captured: true, 
     passive: false});
      this.addEventListener("mouseover", (e) =>        {
        if (this.disabled)
          return ;
        this._highlight = true;
        this._redraw();
      });
      this.addEventListener("mouseout", (e) =>        {
        if (this.disabled)
          return ;
        this._highlight = false;
        this._redraw();
      });
      this.addEventListener("keydown", (e) =>        {
        if (this.disabled)
          return ;
        if (cconst.DEBUG.buttonEvents)
          console.log(e.keyCode);
        switch (e.keyCode) {
          case 27:
            this.blur();
            e.preventDefault();
            e.stopPropagation();
            break;
          case 32:
          case 13:
            this.click();
            e.preventDefault();
            e.stopPropagation();
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
      this.addEventListener("blur", () =>        {
        if (this.disabled)
          return ;
        this._focus = 0;
        this._redraw();
      });
    }
     _redraw() {
      this.setCSS();
    }
     updateDisabled() {
      if (this._last_disabled!==this.disabled) {
          this._last_disabled = this.disabled;
          this._redraw();
          if (cconst.DEBUG.buttonEvents)
            console.log("disabled update!", this.disabled, this.style["background-color"]);
      }
    }
     update() {
      if (this._last_name!==this.name) {
          this.label.innerHTML = this.name;
          this._last_name = this.name;
      }
    }
    static  define() {
      return {tagname: "button-x", 
     style: "button"}
    }
  }
  _ESClass.register(Button);
  _es6_module.add_class(Button);
  Button = _es6_module.add_export('Button', Button);
  UIBase.register(Button);
  class OldButton extends UIBase {
     constructor() {
      super();
      let dpi=this.getDPI();
      this._last_but_update_key = "";
      this._name = "";
      this._namePad = undefined;
      this._leftPad = 5;
      this._rightPad = 5;
      this._last_w = 0;
      this._last_h = 0;
      this._last_dpi = dpi;
      this._lastw = undefined;
      this._lasth = undefined;
      this.dom = document.createElement("canvas");
      this.g = this.dom.getContext("2d");
      this.dom.setAttribute("class", "canvas1");
      this.dom.tabIndex = 0;
      this._last_bg = undefined;
      this.addEventListener("keydown", (e) =>        {
        if (this.disabled)
          return ;
        if (cconst.DEBUG.buttonEvents)
          console.log(e.keyCode);
        switch (e.keyCode) {
          case 27:
            this.blur();
            e.preventDefault();
            e.stopPropagation();
            break;
          case 32:
          case 13:
            this.click();
            e.preventDefault();
            e.stopPropagation();
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
      this.addEventListener("blur", () =>        {
        if (this.disabled)
          return ;
        this._focus = 0;
        this._redraw();
      });
      this._last_disabled = false;
      this._auto_depress = true;
      this.shadow.appendChild(this.dom);
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
     init() {
      let dpi=this.getDPI();
      let width=~~(this.getDefault("width"));
      let height=~~(this.getDefault("height"));
      this.dom.style["width"] = width+"px";
      this.dom.style["height"] = height+"px";
      this.dom.style["padding"] = this.dom.style["margin"] = "0px";
      this.dom.width = Math.ceil(width*dpi);
      this.dom.height = Math.ceil(parsepx(this.dom.style["height"])*dpi);
      this._name = undefined;
      this.updateName();
      this.bindEvents();
      this._redraw();
    }
     setAttribute(key, val) {
      super.setAttribute(key, val);
      if (key==="name") {
          this.updateName();
          this.updateWidth();
      }
    }
    get  r() {
      return this.getDefault("border-radius");
    }
    set  r(val) {
      this.overrideDefault("border-radius", val);
    }
     bindEvents() {
      let press_gen=0;
      let press=(e) =>        {
        e.stopPropagation();
        if (cconst.DEBUG.buttonEvents) {
            console.log("button press", this._pressed, this.disabled, e.button);
        }
        if (this.disabled)
          return ;
        this._pressed = true;
        if (util.isMobile()&&this.onclick&&e.button===0) {
            this.onclick();
        }
        if (this._onpress) {
            this._onpress(this);
        }
        this._redraw();
        e.preventDefault();
      };
      let depress=(e) =>        {
        if (cconst.DEBUG.buttonEvents)
          console.log("button depress", e.button, e.was_touch);
        if (this._auto_depress) {
            this._pressed = false;
            if (this.disabled)
              return ;
            this._redraw();
        }
        e.preventDefault();
        e.stopPropagation();
        if (util.isMobile()||e.type==="mouseup"&&e.button) {
            return ;
        }
        this._redraw();
        if (cconst.DEBUG.buttonEvents)
          console.log("button click callback:", this.onclick, this._onpress, this.onpress);
        if (this.onclick&&e.touches!==undefined) {
            this.onclick(this);
        }
        this.undoBreakPoint();
      };
      this.addEventListener("mousedown", press, {captured: true, 
     passive: false});
      this.addEventListener("mouseup", depress, {captured: true, 
     passive: false});
      this.addEventListener("mouseover", (e) =>        {
        if (this.disabled)
          return ;
        this._highlight = true;
        this._repos_canvas();
        this._redraw();
      });
      this.addEventListener("mouseout", (e) =>        {
        if (this.disabled)
          return ;
        this._highlight = false;
        this._repos_canvas();
        this._redraw();
      });
    }
     updateDisabled() {
      if (this._last_disabled!==this.disabled) {
          this._last_disabled = this.disabled;
          this.dom._background = this.getDefault("background-color");
          this._repos_canvas();
          this._redraw();
          if (cconst.DEBUG.buttonEvents)
            console.log("disabled update!", this.disabled, this.style["background-color"]);
      }
    }
     updateDefaultSize() {
      let height=~~(this.getDefault("height"))+this.getDefault("padding");
      let size=this.getDefault("DefaultText").size*1.33;
      if (height===undefined||size===undefined||isNaN(height)||isNaN(size)) {
          return ;
      }
      height = ~~Math.max(height, size);
      height = height+"px";
      if (height!==this.style["height"]) {
          this.style["height"] = height;
          this.dom.style["height"] = height;
          this._repos_canvas();
          this._redraw();
      }
    }
     _calcUpdateKey() {
      return _themeUpdateKey;
    }
     update() {
      super.update();
      this.style["user-select"] = "none";
      this.dom.style["user-select"] = "none";
      this.updateDefaultSize();
      this.updateWidth();
      this.updateDPI();
      this.updateName();
      this.updateDisabled();
      if (this.background!==this._last_bg) {
          this._last_bg = this.background;
          this._repos_canvas();
          this._redraw();
      }
      let key=this._calcUpdateKey();
      if (key!==this._last_but_update_key) {
          this._last_but_update_key = key;
          this.setCSS();
          this._repos_canvas();
          this._redraw();
      }
    }
     setCSS() {
      super.setCSS();
      this.dom.style["margin"] = this.getDefault("margin", undefined, 0)+"px";
      this.dom.style["margin-left"] = this.getDefault("margin-left", undefined, 0)+"px";
      this.dom.style["margin-right"] = this.getDefault("margin-right", undefined, 0)+"px";
      this.dom.style["margin-top"] = this.getDefault("margin-top", undefined, 0)+"px";
      this.dom.style["margin-bottom"] = this.getDefault("margin-bottom", undefined, 0)+"px";
      let name=this._name;
      if (name===undefined) {
          return ;
      }
      let dpi=this.getDPI();
      let pad=this.getDefault("padding");
      let ts=this.getDefault("DefaultText").size;
      let tw=ui_base.measureText(this, this._genLabel(), {size: ts, 
     font: this.getDefault("DefaultText")}).width+2.0*pad+this._leftPad+this._rightPad;
      if (this._namePad!==undefined) {
          tw+=this._namePad;
      }
      let w=this.getDefault("width");
      w = Math.max(w, tw);
      w = ~~w;
      this.dom.style["width"] = w+"px";
      this.updateBorders();
    }
     updateBorders() {
      let lwid=this.getDefault("border-width");
      if (lwid) {
          this.dom.style["border-color"] = this.getDefault("border-color");
          this.dom.style["border-width"] = lwid+"px";
          this.dom.style["border-style"] = "solid";
          this.dom.style["border-radius"] = this.getDefault("border-radius")+"px";
      }
      else {
        this.dom.style["border-color"] = "none";
        this.dom.style["border-width"] = "0px";
        this.dom.style["border-radius"] = this.getDefault("border-radius")+"px";
      }
    }
     updateName() {
      if (!this.hasAttribute("name")) {
          return ;
      }
      let name=this.getAttribute("name");
      if (name!==this._name) {
          this._name = name;
          this.setCSS();
          this._repos_canvas();
          this._redraw();
      }
    }
     updateWidth(w_add=0) {

    }
     _repos_canvas() {
      let dpi=this.getDPI();
      let w=parsepx(this.dom.style["width"]);
      let h=parsepx(this.dom.style["height"]);
      let w2=~~(w*dpi);
      let h2=~~(h*dpi);
      w = w2/dpi;
      h = h2/dpi;
      this.dom.width = w2;
      this.dom.style["width"] = w+"px";
      this.dom.height = h2;
      this.dom.style["height"] = h+"px";
    }
     updateDPI() {
      let dpi=this.getDPI();
      if (this._last_dpi!==dpi) {
          this._last_dpi = dpi;
          this.g.font = undefined;
          this.setCSS();
          this._repos_canvas();
          this._redraw();
      }
      if (this.style["background-color"]) {
          this.dom._background = this.style["background-color"];
          this.style["background-color"] = "";
      }
    }
     _genLabel() {
      return ""+this._name;
    }
     _getSubKey() {
      if (this._pressed) {
          return 'depressed';
      }
      else 
        if (this._highlight) {
          return 'highlight';
      }
      else {
        return undefined;
      }
    }
     _redraw(draw_text=true) {
      let dpi=this.getDPI();
      let subkey=this._getSubKey();
      if (this._pressed&&this._highlight) {
          this.dom._background = this.getSubDefault(subkey, "highlight-pressed", "BoxHighlight");
      }
      else 
        if (this._pressed) {
          this.dom._background = this.getSubDefault(subkey, "pressed", "BoxDepressed");
      }
      else 
        if (this._highlight) {
          this.dom._background = this.getSubDefault(subkey, "highlight", "BoxHighlight");
      }
      else {
        this.dom._background = this.getSubDefault(subkey, "background-color", "background-color");
      }
      ui_base.drawRoundBox(this, this.dom, this.g);
      this.updateBorders();
      if (this._focus) {
          let w=this.dom.width, h=this.dom.height;
          let p=1/dpi;
          this.g.translate(p, p);
          let lw=this.g.lineWidth;
          this.g.lineWidth = this.getDefault("focus-border-width", undefined, 1.0)*dpi;
          ui_base.drawRoundBox(this, this.dom, this.g, w-p*2, h-p*2, this.r, "stroke", this.getDefault("BoxHighlight"));
          this.g.lineWidth = lw;
          this.g.translate(-p, -p);
      }
      if (draw_text) {
          this._draw_text();
      }
    }
     _draw_text() {
      let dpi=this.getDPI();
      let subkey=this._getSubKey();
      let font=this.getSubDefault(subkey, "DefaultText");
      let pad=this.getDefault("padding")*dpi;
      let ts=font.size*dpi;
      let text=this._genLabel();
      let w=this.dom.width, h=this.dom.height;
      let tw=ui_base.measureText(this, text, undefined, undefined, ts, font).width;
      let cx=pad*0.5+this._leftPad*dpi;
      let cy=ts+(h-ts)/3.0;
      let g=this.g;
      ui_base.drawText(this, ~~cx, ~~cy, text, {canvas: this.dom, 
     g: this.g, 
     size: ts/dpi, 
     font: font});
    }
    static  define() {
      return {tagname: "old-button-x", 
     style: "button"}
    }
  }
  _ESClass.register(OldButton);
  _es6_module.add_class(OldButton);
  OldButton = _es6_module.add_export('OldButton', OldButton);
  UIBase.internalRegister(OldButton);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_button.js');


es6_module_define('ui_colorpicker', ["../path-controller/toolsys/toolprop.js", "../core/ui.js", "../path-controller/util/vectormath.js", "../path-controller/util/events.js", "../path-controller/util/util.js", "../core/ui_base.js"], function _ui_colorpicker_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var vectormath=es6_import(_es6_module, '../path-controller/util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../path-controller/util/events.js');
  var ui=es6_import(_es6_module, '../core/ui.js');
  var PropTypes=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'PropTypes');
  let rgb_to_hsv_rets=new util.cachering(() =>    {
    return [0, 0, 0];
  }, 64);
  let Vector2=vectormath.Vector2, Vector3=vectormath.Vector3, Vector4=vectormath.Vector4, Matrix4=vectormath.Matrix4;
  function rgb_to_hsv(r, g, b) {
    var computedH=0;
    var computedS=0;
    var computedV=0;
    if (r==null||g==null||b==null||isNaN(r)||isNaN(g)||isNaN(b)) {
        throw new Error('Please enter numeric RGB values!');
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
      if (h>=300.0&&h<360.0) {
        color = RgbF_Create(c+m, m, x+m);
    }
    else {
      color = RgbF_Create(m, m, m);
    }
    return color;
  }
  hsv_to_rgb = _es6_module.add_export('hsv_to_rgb', hsv_to_rgb);
  let UIBase=ui_base.UIBase, PackFlags=ui_base.PackFlags, IconSheets=ui_base.IconSheets;
  let UPW=1.25, VPW=0.75;
  let sample_rets=new util.cachering(() =>    {
    return [0, 0];
  }, 64);
  function inv_sample(u, v) {
    let ret=sample_rets.next();
    ret[0] = Math.pow(u, UPW);
    ret[1] = Math.pow(v, VPW);
    return ret;
  }
  inv_sample = _es6_module.add_export('inv_sample', inv_sample);
  function sample(u, v) {
    let ret=sample_rets.next();
    ret[0] = Math.pow(u, 1.0/UPW);
    ret[1] = Math.pow(v, 1.0/VPW);
    return ret;
  }
  sample = _es6_module.add_export('sample', sample);
  let fieldrand=new util.MersenneRandom(0);
  let fields={}
  function getFieldImage(size, hsva) {
    fieldrand.seed(0);
    let hue=hsva[0];
    let hue_rgb=hsv_to_rgb(hue, 1.0, 1.0);
    let key=size+":"+hue.toFixed(4);
    if (key in fields)
      return fields[key];
    let size2=128;
    let image={width: size, 
    height: size, 
    image: new ImageData(size2, size2)}
    let scale=size2/size;
    let idata=image.image.data;
    let dpi=this.getDPI();
    let band=ui_base.IsMobile() ? 35 : 20;
    let r2=Math.ceil(size*0.5), r1=r2-band*dpi;
    let pad=5*dpi;
    let px1=size*0.5-r1/Math.sqrt(2.0)+pad;
    let py1=size*0.5-r1/Math.sqrt(2.0)+pad;
    let pw=r1/Math.sqrt(2)*2-pad*2, ph=pw;
    image.params = {r1: r1, 
    r2: r2, 
    box: {x: px1, 
     y: py1, 
     width: pw, 
     height: ph}}
    for (let i=0; i<size2*size2; i++) {
        let x=i%size2, y = ~~(i/size2);
        let idx=i*4;
        let alpha=0.0;
        let r=Math.sqrt((x-size2*0.5)**2+(y-size2*0.5)**2);
        if (r<r2*scale&&r>r1*scale) {
            let th=Math.atan2(y-size2*0.5, x-size2*0.5)/(2*Math.PI)+0.5;
            let eps=0.001;
            th = th*(1.0-eps*2)+eps;
            let r=0, g=0, b=0;
            if (th<1.0/6.0) {
                r = 1.0;
                g = th*6.0;
            }
            else 
              if (th<2.0/6.0) {
                th-=1.0/6.0;
                r = 1.0-th*6.0;
                g = 1.0;
            }
            else 
              if (th<3.0/6.0) {
                th-=2.0/6.0;
                g = 1.0;
                b = th*6.0;
            }
            else 
              if (th<4.0/6.0) {
                th-=3.0/6.0;
                b = 1.0;
                g = 1.0-th*6.0;
            }
            else 
              if (th<5.0/6.0) {
                th-=4.0/6.0;
                r = th*6.0;
                b = 1.0;
            }
            else 
              if (th<6.0/6.0) {
                th-=5.0/6.0;
                r = 1.0;
                b = 1.0-th*6.0;
            }
            r = r*255+(fieldrand.random()-0.5);
            g = g*255+(fieldrand.random()-0.5);
            b = b*255+(fieldrand.random()-0.5);
            idata[idx] = r;
            idata[idx+1] = g;
            idata[idx+2] = b;
            alpha = 1.0;
        }
        let px2=(px1+pw)*scale, py2=(py1+ph)*scale;
        if (x>px1*scale&&y>py1*scale&&x<px2&&y<py2) {
            let u=1.0-(x-px1*scale)/(px2-px1*scale);
            let v=1.0-(y-py1*scale)/(py2-py1*scale);
            u = Math.pow(u, UPW);
            v = Math.pow(v, VPW);
            let r=0, g=0, b=0;
            r = hue_rgb[0]*(1.0-u)+u;
            g = hue_rgb[1]*(1.0-u)+u;
            b = hue_rgb[2]*(1.0-u)+u;
            let fac=1.0;
            idata[idx+0] = r*v*255+(fieldrand.random()-0.5)*fac;
            idata[idx+1] = g*v*255+(fieldrand.random()-0.5)*fac;
            idata[idx+2] = b*v*255+(fieldrand.random()-0.5)*fac;
            alpha = 1.0;
        }
        idata[idx+3] = alpha*255;
    }
    let image2=document.createElement("canvas");
    image2.width = size2;
    image2.height = size2;
    let g=image2.getContext("2d");
    g.putImageData(image.image, 0, 0);
    image.canvas = image2;
    image.scale = size/size2;
    fields[key] = image;
    return image;
  }
  getFieldImage = _es6_module.add_export('getFieldImage', getFieldImage);
  let _update_temp=new Vector4();
  class SimpleBox  {
     constructor(pos=[0, 0], size=[1, 1]) {
      this.pos = new Vector2(pos);
      this.size = new Vector2(size);
      this.r = 0;
    }
  }
  _ESClass.register(SimpleBox);
  _es6_module.add_class(SimpleBox);
  SimpleBox = _es6_module.add_export('SimpleBox', SimpleBox);
  class ColorField extends UIBase {
     constructor() {
      super();
      this.hsva = [0.05, 0.6, 0.15, 1.0];
      this.rgba = new Vector4([0, 0, 0, 0]);
      this._recalcRGBA();
      this._last_dpi = undefined;
      let canvas=this.canvas = document.createElement("canvas");
      let g=this.g = canvas.getContext("2d");
      this.shadow.appendChild(canvas);
      let mx, my;
      let do_mouse=(e) =>        {
        let r=this.canvas.getClientRects()[0];
        let dpi=this.getDPI();
        mx = (e.pageX-r.x)*dpi;
        my = (e.pageY-r.y)*dpi;
      };
      let do_touch=(e) =>        {
        if (e.touches.length==0) {
            mx = my = undefined;
            return ;
        }
        let r=this.canvas.getClientRects()[0];
        let dpi=this.getDPI();
        let t=e.touches[0];
        mx = (t.pageX-r.x)*dpi;
        my = (t.pageY-r.y)*dpi;
      };
      this.canvas.addEventListener("mousedown", (e) =>        {
        do_mouse(e);
        return this.on_mousedown(e, mx, my, e.button);
      });
      this.canvas.addEventListener("mousemove", (e) =>        {
        do_mouse(e);
        return this.on_mousemove(e, mx, my, e.button);
      });
      this.canvas.addEventListener("mouseup", (e) =>        {
        do_mouse(e);
        return this.on_mouseup(e, mx, my, e.button);
      });
      this.canvas.addEventListener("touchstart", (e) =>        {
        e.preventDefault();
        do_touch(e);
        if (mx!==undefined)
          return this.on_mousedown(e, mx, my, 0);
      });
      this.canvas.addEventListener("touchmove", (e) =>        {
        do_touch(e);
        if (mx!==undefined)
          return this.on_mousemove(e, mx, my, 0);
      });
      this.canvas.addEventListener("touchend", (e) =>        {
        do_touch(e);
        if (mx!==undefined)
          return this.on_mouseup(e, mx, my, 0);
      });
      this.canvas.addEventListener("touchcancel", (e) =>        {
        do_touch(e);
        if (mx!==undefined)
          return this.on_mouseup(e, mx, my, 0);
      });
      this.updateCanvas(true);
    }
     pick_h(x, y) {
      let field=this._field;
      let size=field.width;
      let dpi=this.getDPI();
      if (field===undefined) {
          console.error("no field in colorpicker");
          return ;
      }
      let th=Math.atan2(y-size/2, x-size/2)/(2*Math.PI)+0.5;
      this.hsva[0] = th;
      this.update(true);
      this._recalcRGBA();
      if (this.onchange) {
          this.onchange(this.hsva, this.rgba);
      }
    }
     setHSVA(h, s, v, a=1.0, fire_onchange=true) {
      this.hsva[0] = h;
      this.hsva[1] = s;
      this.hsva[2] = v;
      this.hsva[3] = a;
      this._recalcRGBA();
      this.update(true);
      if (this.onchange&&fire_onchange) {
          this.onchange(this.hsva, this.rgba);
      }
    }
     setRGBA(r, g, b, a=1.0, fire_onchange=true) {
      let ret=rgb_to_hsv(r, g, b);
      this.hsva[0] = ret[0];
      this.hsva[1] = ret[1];
      this.hsva[2] = ret[2];
      this.hsva[3] = a;
      this._recalcRGBA();
      this.update(true);
      if (this.onchange&&fire_onchange) {
          this.onchange(this.hsva, this.rgba);
      }
    }
     _recalcRGBA() {
      let ret=hsv_to_rgb(this.hsva[0], this.hsva[1], this.hsva[2]);
      this.rgba[0] = ret[0];
      this.rgba[1] = ret[1];
      this.rgba[2] = ret[2];
      this.rgba[3] = this.hsva[3];
      return this;
    }
     on_mousedown(e, x, y, button) {
      if (button!=0)
        return ;
      let field=this._field;
      if (field===undefined)
        return ;
      let size=field.width;
      let dpi=this.getDPI();
      let r=Math.sqrt((x-size/2)**2+(y-size/2)**2);
      let pad=5*dpi;
      let px1=field.params.box.x, py1=field.params.box.y, px2=px1+field.params.box.width, py2=py1+field.params.box.height;
      px1-=pad*0.5;
      py1-=pad*0.5;
      px2+=pad*0.5;
      py2+=pad*0.5;
      if (r>field.params.r1-pad&&r<field.params.r2+pad) {
          this.pick_h(x, y);
          this._mode = "h";
      }
      else 
        if (x>=px1&&x<=px2&&y>=py1&&y<=py2) {
          this.pick_sv(x, y);
          console.log("in box");
          this._mode = "sv";
      }
      e.preventDefault();
      e.stopPropagation();
      console.log(x, y);
    }
     pick_sv(x, y) {
      let sv=this._sample_box(x, y);
      this.hsva[1] = sv[0];
      this.hsva[2] = sv[1];
      this._recalcRGBA();
      this.update(true);
      if (this.onchange) {
          this.onchange(this.hsva, this.rgba);
      }
    }
     _sample_box(x, y) {
      let field=this._field;
      if (field===undefined) {
          return [-1, -1];
      }
      let px=field.params.box.x, py=field.params.box.y, pw=field.params.box.width, ph=field.params.box.height;
      let u=(x-px)/pw;
      let v=1.0-(y-py)/ph;
      u = Math.min(Math.max(u, 0.0), 1.0);
      v = Math.min(Math.max(v, 0.0), 1.0);
      let ret=sample(u, 1.0-v);
      u = ret[0], v = 1.0-ret[1];
      return [u, v];
    }
     on_mousemove(e, x, y, button) {
      if (this._mode=="h") {
          this.pick_h(x, y);
      }
      else 
        if (this._mode=="sv") {
          this.pick_sv(x, y);
      }
      e.preventDefault();
      e.stopPropagation();
    }
     on_mouseup(e, x, y, button) {
      this._mode = undefined;
      e.preventDefault();
      e.stopPropagation();
      console.log(x, y);
    }
     updateCanvas(force_update=false, _in_update=false) {
      let canvas=this.canvas;
      let update=force_update;
      if (update) {
          let size=this.getDefault("fieldsize");
          let dpi=this.getDPI();
          canvas.style["width"] = size+"px";
          canvas.style["height"] = size+"px";
          canvas.width = canvas.height = Math.ceil(size*dpi);
          if (!_in_update)
            this._redraw();
          return true;
      }
    }
     _redraw() {
      let canvas=this.canvas, g=this.g;
      let dpi=this.getDPI();
      let size=canvas.width;
      let field=this._field = getFieldImage(size, this.hsva);
      let w=size, h=size*field.height/field.width;
      g.clearRect(0, 0, w, h);
      g.drawImage(field.canvas, 0, 0, field.width, field.height);
      g.lineWidth = 2.0;
      function circle(x, y, r) {
        g.strokeStyle = "white";
        g.beginPath();
        g.arc(x, y, r, -Math.PI, Math.PI);
        g.stroke();
        g.strokeStyle = "grey";
        g.beginPath();
        g.arc(x, y, r-1, -Math.PI, Math.PI);
        g.stroke();
        g.fillStyle = "black";
        g.beginPath();
        g.arc(x, y, 2*dpi, -Math.PI, Math.PI);
        g.fill();
      }
      let hsva=this.hsva;
      let r=(field.params.r2-field.params.r1)*0.7;
      let bandr=(field.params.r2+field.params.r1)*0.5;
      let th=Math.fract(1.0-hsva[0]-0.25);
      let x=Math.sin(th*Math.PI*2)*bandr+size/2;
      let y=Math.cos(th*Math.PI*2)*bandr+size/2;
      circle(x, y, r);
      let u=this.hsva[1], v=1.0-this.hsva[2];
      let ret=inv_sample(u, v);
      u = ret[0], v = ret[1];
      x = field.params.box.x+u*field.params.box.width;
      y = field.params.box.y+v*field.params.box.height;
      circle(x, y, r);
    }
     updateDPI(force_update=false, _in_update=false) {
      let dpi=this.getDPI();
      let update=force_update;
      update = update||dpi!=this._last_dpi;
      if (update) {
          this._last_dpi = dpi;
          this.updateCanvas(true);
          if (!_in_update)
            this._redraw();
          return true;
      }
    }
     update(force_update=false) {
      super.update();
      let redraw=false;
      redraw = redraw||this.updateCanvas(force_update, true);
      redraw = redraw||this.updateDPI(force_update, true);
      if (redraw) {
          this._redraw();
      }
    }
    static  define() {
      return {tagname: "colorfield0-x", 
     style: "colorfield"}
    }
  }
  _ESClass.register(ColorField);
  _es6_module.add_class(ColorField);
  ColorField = _es6_module.add_export('ColorField', ColorField);
  UIBase.internalRegister(ColorField);
  class ColorPicker extends ui.ColumnFrame {
     constructor() {
      super();
      this.field = UIBase.createElement("colorfield-x");
      this.field.setAttribute("class", "colorpicker");
      this.field.onchange = (hsva, rgba) =>        {
        if (this.onchange) {
            this.onchange(hsva, rgba);
        }
        this._setDataPath();
        this._setSliders();
      };
      let style=document.createElement("style");
      style.textContent = `
      .colorpicker {
        background-color : ${ui_base.getDefault("InnerPanelBG")};
      }
    `;
      this._style = style;
      this.shadow.appendChild(style);
      this.field.ctx = this.ctx;
      this.shadow.appendChild(this.field);
    }
    static  setDefault(node) {
      let tabs=node.tabs();
      let tab=tabs.tab("HSV");
      node.h = tab.slider(undefined, "Hue", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let hsva=node.hsva;
        node.setHSVA(e.value, hsva[1], hsva[2], hsva[3]);
      });
      node.s = tab.slider(undefined, "Saturation", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let hsva=node.hsva;
        node.setHSVA(hsva[0], e.value, hsva[2], hsva[3]);
      });
      node.v = tab.slider(undefined, "Value", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let hsva=node.hsva;
        node.setHSVA(hsva[0], hsva[1], e.value, hsva[3]);
      });
      node.a = tab.slider(undefined, "Alpha", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let hsva=node.hsva;
        node.setHSVA(hsva[0], hsva[1], hsva[2], e.value);
      });
      tab = tabs.tab("RGB");
      node.r = tab.slider(undefined, "R", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let rgba=node.rgba;
        node.setRGBA(e.value, rgba[1], rgba[2], rgba[3]);
      });
      node.g = tab.slider(undefined, "G", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let rgba=node.rgba;
        node.setRGBA(rgba[0], e.value, rgba[2], rgba[3]);
      });
      node.b = tab.slider(undefined, "B", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let rgba=node.rgba;
        node.setRGBA(rgba[0], rgba[1], e.value, rgba[3]);
      });
      node.a2 = tab.slider(undefined, "Alpha", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let rgba=node.rgba;
        node.setRGBA(rgba[0], rgba[1], rgba[2], e.value);
      });
      node._setSliders();
    }
     _setSliders() {
      if (this.h===undefined) {
          console.warn("colorpicker ERROR");
          return ;
      }
      let hsva=this.hsva;
      this.h.setValue(hsva[0], false);
      this.s.setValue(hsva[1], false);
      this.v.setValue(hsva[2], false);
      this.a.setValue(hsva[3], false);
      let rgba=this.rgba;
      this.r.setValue(rgba[0], false);
      this.g.setValue(rgba[1], false);
      this.b.setValue(rgba[2], false);
      this.a2.setValue(rgba[3], false);
    }
    get  hsva() {
      return this.field.hsva;
    }
    get  rgba() {
      return this.field.rgba;
    }
     updateDataPath() {
      if (!this.hasAttribute("datapath")) {
          return ;
      }
      let prop=this.getPathMeta(this.ctx, this.getAttribute("datapath"));
      let val=this.getPathValue(this.ctx, this.getAttribute("datapath"));
      if (val===undefined) {
          this.internalDisabled = true;
          return ;
      }
      this.internalDisabled = false;
      _update_temp.load(val);
      if (prop.type==PropTypes.VEC3) {
          _update_temp[3] = 1.0;
      }
      if (_update_temp.vectorDistance(this.field.rgba)>0.01) {
          console.log("VAL", val);
          console.log("color changed!");
          this.setRGBA(_update_temp[0], _update_temp[1], _update_temp[2], _update_temp[3]);
      }
    }
     update() {
      if (this.hasAttribute("datapath")) {
          this.updateDataPath();
      }
      super.update();
    }
     _setDataPath() {
      if (this.hasAttribute("datapath")) {
          this.setPathValue(this.ctx, this.getAttribute("datapath"), this.field.rgba);
      }
    }
     setHSVA(h, s, v, a) {
      this.field.setHSVA(h, s, v, a);
      this._setDataPath();
    }
     setRGBA(r, g, b, a) {
      this.field.setRGBA(r, g, b, a);
      this._setDataPath();
    }
    static  define() {
      return {tagname: "colorpicker0-x"}
    }
  }
  _ESClass.register(ColorPicker);
  _es6_module.add_class(ColorPicker);
  ColorPicker = _es6_module.add_export('ColorPicker', ColorPicker);
  UIBase.internalRegister(ColorPicker);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_colorpicker.js');


es6_module_define('ui_colorpicker2', ["../path-controller/util/simple_events.js", "../path-controller/toolsys/toolprop.js", "../core/ui.js", "../core/ui_base.js", "../path-controller/util/vectormath.js", "../path-controller/util/events.js", "../config/const.js", "../path-controller/util/util.js", "../path-controller/util/colorutils.js"], function _ui_colorpicker2_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var vectormath=es6_import(_es6_module, '../path-controller/util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../path-controller/util/events.js');
  var ui=es6_import(_es6_module, '../core/ui.js');
  var PropTypes=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'PropTypes');
  var keymap=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'keymap');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var color2web=es6_import_item(_es6_module, '../core/ui_base.js', 'color2web');
  var web2color=es6_import_item(_es6_module, '../core/ui_base.js', 'web2color');
  var validateWebColor=es6_import_item(_es6_module, '../core/ui_base.js', 'validateWebColor');
  let Vector2=vectormath.Vector2, Vector3=vectormath.Vector3, Vector4=vectormath.Vector4, Matrix4=vectormath.Matrix4;
  let _ex_rgb_to_hsv=es6_import_item(_es6_module, '../path-controller/util/colorutils.js', 'rgb_to_hsv');
  _es6_module.add_export('rgb_to_hsv', _ex_rgb_to_hsv, true);
  let _ex_hsv_to_rgb=es6_import_item(_es6_module, '../path-controller/util/colorutils.js', 'hsv_to_rgb');
  _es6_module.add_export('hsv_to_rgb', _ex_hsv_to_rgb, true);
  var rgb_to_hsv=es6_import_item(_es6_module, '../path-controller/util/colorutils.js', 'rgb_to_hsv');
  var hsv_to_rgb=es6_import_item(_es6_module, '../path-controller/util/colorutils.js', 'hsv_to_rgb');
  let UIBase=ui_base.UIBase, PackFlags=ui_base.PackFlags, IconSheets=ui_base.IconSheets;
  let UPW=1.25, VPW=0.75;
  let sample_rets=new util.cachering(() =>    {
    return [0, 0];
  }, 64);
  function inv_sample(u, v) {
    let ret=sample_rets.next();
    ret[0] = Math.pow(u, UPW);
    ret[1] = Math.pow(v, VPW);
    return ret;
  }
  inv_sample = _es6_module.add_export('inv_sample', inv_sample);
  function sample(u, v) {
    let ret=sample_rets.next();
    ret[0] = Math.pow(u, 1.0/UPW);
    ret[1] = Math.pow(v, 1.0/VPW);
    return ret;
  }
  sample = _es6_module.add_export('sample', sample);
  let fieldrand=new util.MersenneRandom(0);
  let huefields={}
  function getHueField(width, height, dpi) {
    let key=width+":"+height+":"+dpi.toFixed(4);
    if (key in huefields) {
        return huefields[key];
    }
    let field=new ImageData(width, height);
    let idata=field.data;
    for (let i=0; i<width*height; i++) {
        let ix=i%width, iy = ~~(i/width);
        let idx=i*4;
        let rgb=hsv_to_rgb(ix/width, 1, 1);
        idata[idx] = rgb[0]*255;
        idata[idx+1] = rgb[1]*255;
        idata[idx+2] = rgb[2]*255;
        idata[idx+3] = 255;
    }
    let canvas=document.createElement("canvas");
    canvas.width = field.width;
    canvas.height = field.height;
    let g=canvas.getContext("2d");
    g.putImageData(field, 0, 0);
    field = canvas;
    huefields[key] = field;
    return field;
  }
  getHueField = _es6_module.add_export('getHueField', getHueField);
  let fields={}
  function getFieldImage(fieldsize, width, height, hsva) {
    fieldrand.seed(0);
    let hue=hsva[0];
    let hue_rgb=hsv_to_rgb(hue, 1.0, 1.0);
    let key=fieldsize+":"+width+":"+height+":"+hue.toFixed(5);
    if (key in fields)
      return fields[key];
    let size2=fieldsize;
    let valpow=0.75;
    let image={width: width, 
    height: height, 
    image: new ImageData(fieldsize, fieldsize), 
    x2sat: (x) =>        {
        return Math.min(Math.max(x/width, 0), 1);
      }, 
    y2val: (y) =>        {
        y = 1.0-Math.min(Math.max(y/height, 0), 1);
        return y===0.0 ? 0.0 : y**valpow;
      }, 
    sat2x: (s) =>        {
        return s*width;
      }, 
    val2y: (v) =>        {
        if (v==0)
          return height;
        v = v**(1.0/valpow);
        return (1.0-v)*height;
      }}
    image.params = {box: {x: 0, 
     y: 0, 
     width: width, 
     height: height}}
    let idata=image.image.data;
    for (let i=0; i<idata.length; i+=4) {
        let i2=i/4;
        let x=i2%size2, y = ~~(i2/size2);
        let v=1.0-(y/size2);
        let s=(x/size2);
        let rgb=hsv_to_rgb(hsva[0], s, v**valpow);
        idata[i] = rgb[0]*255;
        idata[i+1] = rgb[1]*255;
        idata[i+2] = rgb[2]*255;
        idata[i+3] = 255;
    }
    let image2=document.createElement("canvas");
    image2.width = size2;
    image2.height = size2;
    let g=image2.getContext("2d");
    g.putImageData(image.image, 0, 0);
    image.canvas = image2;
    image.scale = width/size2;
    fields[key] = image;
    return image;
  }
  getFieldImage = _es6_module.add_export('getFieldImage', getFieldImage);
  let _update_temp=new Vector4();
  class SimpleBox  {
     constructor(pos=[0, 0], size=[1, 1]) {
      this.pos = new Vector2(pos);
      this.size = new Vector2(size);
      this.r = 0;
    }
  }
  _ESClass.register(SimpleBox);
  _es6_module.add_class(SimpleBox);
  SimpleBox = _es6_module.add_export('SimpleBox', SimpleBox);
  class HueField extends UIBase {
     constructor() {
      super();
      this.canvas = document.createElement("canvas");
      this.g = this.canvas.getContext("2d");
      this.shadow.appendChild(this.canvas);
      let setFromXY=(x, y) =>        {
        let dpi=this.getDPI();
        let r=this.getDefault("circleSize");
        let h=x/((this.canvas.width-r*4)/dpi);
        h = Math.min(Math.max(h, 0.0), 1.0);
        this.hsva[0] = h;
        if (this.onchange!==undefined) {
            this.onchange(this.hsva);
        }
        this._redraw();
      };
      this.addEventListener("mousedown", (e) =>        {
        e.preventDefault();
        let rect=this.canvas.getClientRects()[0];
        let x=e.clientX-rect.x, y=e.clientY-rect.y;
        setFromXY(x, y);
        setTimeout(() =>          {
          this.pushModal({on_mousemove: (e) =>              {
              let rect=this.canvas.getClientRects()[0];
              let x=e.clientX-rect.x, y=e.clientY-rect.y;
              setFromXY(x, y);
            }, 
       on_mousedown: (e) =>              {
              this.popModal();
            }, 
       on_mouseup: (e) =>              {
              this.popModal();
            }, 
       on_keydown: (e) =>              {
              if (e.keyCode===keymap["Enter"]||e.keyCode===keymap["Escape"]||e.keyCode===keymap["Space"]) {
                  this.popModal();
              }
            }});
        }, 1);
      });
    }
     _redraw() {
      let g=this.g, canvas=this.canvas;
      let dpi=this.getDPI();
      let w=this.getDefault("width");
      let h=this.getDefault("hueHeight");
      canvas.width = ~~(w*dpi);
      canvas.height = ~~(h*dpi);
      canvas.style["width"] = w+"px";
      canvas.style["height"] = h+"px";
      let rselector=~~(this.getDefault("circleSize")*dpi);
      let w2=canvas.width-rselector*4, h2=canvas.height;
      g.drawImage(getHueField(w2, h2, dpi), 0, 0, w2, h2, rselector*2, 0, w2, h2);
      let x=this.hsva[0]*(canvas.width-rselector*4)+rselector*2;
      let y=canvas.height*0.5;
      g.beginPath();
      g.arc(x, y, rselector, -Math.PI, Math.PI);
      g.closePath();
      g.strokeStyle = "white";
      g.lineWidth = 3*dpi;
      g.stroke();
      g.strokeStyle = "grey";
      g.lineWidth = 1*dpi;
      g.stroke();
      if (this.disabled) {
          g.beginPath();
          g.fillStyle = "rgba(25,25,25,0.75)";
          g.rect(0, 0, this.canvas.width, this.canvas.height);
          g.fill();
      }
    }
     on_disabled() {
      this._redraw();
    }
     on_enabled() {
      this._redraw();
    }
    static  define() {
      return {tagname: "huefield-x", 
     style: "colorfield"}
    }
  }
  _ESClass.register(HueField);
  _es6_module.add_class(HueField);
  HueField = _es6_module.add_export('HueField', HueField);
  UIBase.internalRegister(HueField);
  class SatValField extends UIBase {
     constructor() {
      super();
      this.hsva = [0, 0, 0, 1];
      this.canvas = document.createElement("canvas");
      this.g = this.canvas.getContext("2d");
      this.shadow.appendChild(this.canvas);
      this.onchange = undefined;
      let setFromXY=(x, y) =>        {
        let field=this._getField();
        let r=~~(this.getDefault("circleSize")*this.getDPI());
        let sat=field.x2sat(x-r);
        let val=field.y2val(y-r);
        this.hsva[1] = sat;
        this.hsva[2] = val;
        if (this.onchange) {
            this.onchange(this.hsva);
        }
        this._redraw();
      };
      this.canvas.addEventListener("mousedown", (e) =>        {
        e.preventDefault();
        let rect=this.canvas.getClientRects()[0];
        let x=e.clientX-rect.x, y=e.clientY-rect.y;
        setFromXY(x, y);
        setTimeout(() =>          {
          this.pushModal({on_mousemove: (e) =>              {
              let rect=this.canvas.getClientRects()[0];
              if (rect===undefined) {
                  return ;
              }
              let x=e.clientX-rect.x, y=e.clientY-rect.y;
              setFromXY(x, y);
            }, 
       on_mousedown: (e) =>              {
              this.popModal();
            }, 
       on_mouseup: (e) =>              {
              this.popModal();
            }, 
       on_keydown: (e) =>              {
              if (e.keyCode===keymap["Enter"]||e.keyCode===keymap["Escape"]||e.keyCode===keymap["Space"]) {
                  this.popModal();
              }
            }});
        }, 1);
      });
      this.canvas.addEventListener("touchstart", (e) =>        {
        e.preventDefault();
        let rect=this.canvas.getClientRects()[0];
        let x=e.touches[0].clientX-rect.x, y=e.touches[0].clientY-rect.y;
        setFromXY(x, y);
        setTimeout(() =>          {
          this.pushModal({on_mousemove: (e) =>              {
              let rect=this.canvas.getClientRects()[0];
              let x, y;
              if (e.touches&&e.touches.length) {
                  x = e.touches[0].clientX-rect.x;
                  y = e.touches[0].clientY-rect.y;
              }
              else {
                x = e.x;
                y = e.y;
              }
              setFromXY(x, y);
            }, 
       on_touchmove: (e) =>              {
              let rect=this.canvas.getClientRects()[0];
              let x=e.touches[0].clientX-rect.x, y=e.touches[0].clientY-rect.y;
              setFromXY(x, y);
            }, 
       on_mousedown: (e) =>              {
              this.popModal();
            }, 
       on_touchcancel: (e) =>              {
              this.popModal();
            }, 
       on_touchend: (e) =>              {
              this.popModal();
            }, 
       on_mouseup: (e) =>              {
              this.popModal();
            }, 
       on_keydown: (e) =>              {
              if (e.keyCode==keymap["Enter"]||e.keyCode==keymap["Escape"]||e.keyCode==keymap["Space"]) {
                  this.popModal();
              }
            }});
        }, 1);
      });
    }
     _getField() {
      let dpi=this.getDPI();
      let canvas=this.canvas;
      let r=this.getDefault("circleSize");
      let w=this.getDefault("width");
      let h=this.getDefault("height");
      return getFieldImage(this.getDefault("fieldSize"), w-r*2, h-r*2, this.hsva);
    }
     update(force_update=false) {
      super.update();
      if (force_update) {
          this._redraw();
      }
    }
     _redraw() {
      let g=this.g, canvas=this.canvas;
      let dpi=this.getDPI();
      let w=this.getDefault("width");
      let h=this.getDefault("height");
      canvas.width = ~~(w*dpi);
      canvas.height = ~~(h*dpi);
      canvas.style["width"] = w+"px";
      canvas.style["height"] = h+"px";
      let rselector=~~(this.getDefault("circleSize")*dpi);
      let field=this._getField();
      let image=field.canvas;
      g.globalAlpha = 1.0;
      g.beginPath();
      g.rect(0, 0, canvas.width, canvas.height);
      g.fillStyle = "rgb(200, 200, 200)";
      g.fill();
      g.beginPath();
      let steps=17;
      let dx=canvas.width/steps;
      let dy=canvas.height/steps;
      for (let i=0; i<steps*steps; i++) {
          let x=(i%steps)*dx, y=(~~(i/steps))*dy;
          if (i%2==0) {
              continue;
          }
          g.rect(x, y, dx, dy);
      }
      g.fillStyle = "rgb(110, 110, 110)";
      g.fill();
      g.globalAlpha = this.hsva[3];
      g.drawImage(image, 0, 0, image.width, image.height, rselector, rselector, canvas.width-rselector*2, canvas.height-rselector*2);
      let hsva=this.hsva;
      let x=field.sat2x(hsva[1])*dpi+rselector;
      let y=field.val2y(hsva[2])*dpi+rselector;
      let r=rselector;
      g.beginPath();
      g.arc(x, y, r, -Math.PI, Math.PI);
      g.closePath();
      g.strokeStyle = "white";
      g.lineWidth = 3*dpi;
      g.stroke();
      g.strokeStyle = "grey";
      g.lineWidth = 1*dpi;
      g.stroke();
      if (this.disabled) {
          g.beginPath();
          g.fillStyle = "rgba(25,25,25,0.75)";
          g.rect(0, 0, this.canvas.width, this.canvas.height);
          g.fill();
      }
    }
     on_disabled() {
      this._redraw();
    }
     on_enabled() {
      this._redraw();
    }
    static  define() {
      return {tagname: "satvalfield-x", 
     style: "colorfield"}
    }
  }
  _ESClass.register(SatValField);
  _es6_module.add_class(SatValField);
  SatValField = _es6_module.add_export('SatValField', SatValField);
  UIBase.internalRegister(SatValField);
  class ColorField extends ui.ColumnFrame {
     constructor() {
      super();
      this.hsva = new Vector4([0.05, 0.6, 0.15, 1.0]);
      this.rgba = new Vector4([0, 0, 0, 0]);
      this._recalcRGBA();
      this._last_dpi = undefined;
      let satvalfield=this.satvalfield = UIBase.createElement("satvalfield-x");
      satvalfield.hsva = this.hsva;
      let huefield=this.huefield = UIBase.createElement("huefield-x");
      huefield.hsva = this.hsva;
      huefield.onchange = (e) =>        {
        this.satvalfield._redraw();
        this._recalcRGBA();
        if (this.onchange) {
            this.onchange(this.rgba);
        }
      };
      satvalfield.onchange = (e) =>        {
        this._recalcRGBA();
        if (this.onchange) {
            this.onchange(this.rgba);
        }
      };
      this._add(satvalfield);
      this._add(huefield);
    }
     setHSVA(h, s, v, a=1.0, fire_onchange=true) {
      this.hsva[0] = h;
      this.hsva[1] = s;
      this.hsva[2] = v;
      this.hsva[3] = a;
      this._recalcRGBA();
      this.update(true);
      if (this.onchange&&fire_onchange) {
          this.onchange(this.hsva, this.rgba);
      }
    }
     setRGBA(r, g, b, a=1.0, fire_onchange=true) {
      let hsv=rgb_to_hsv(r, g, b);
      this.hsva[0] = hsv[0];
      this.hsva[1] = hsv[1];
      this.hsva[2] = hsv[2];
      this.hsva[3] = a;
      this._recalcRGBA();
      this.update(true);
      if (this.onchange&&fire_onchange) {
          this.onchange(this.hsva, this.rgba);
      }
    }
     _recalcRGBA() {
      let ret=hsv_to_rgb(this.hsva[0], this.hsva[1], this.hsva[2]);
      this.rgba[0] = ret[0];
      this.rgba[1] = ret[1];
      this.rgba[2] = ret[2];
      this.rgba[3] = this.hsva[3];
      return this;
    }
     updateDPI(force_update=false, _in_update=false) {
      let dpi=this.getDPI();
      let update=force_update;
      update = update||dpi!=this._last_dpi;
      if (update) {
          this._last_dpi = dpi;
          if (!_in_update)
            this._redraw();
          return true;
      }
    }
     setRGBA(r, g, b, a=1.0, fire_onchange=true) {
      if (bad(r)||bad(g)||bad(b)||bad(a)) {
          console.warn("Invalid value!");
          return ;
      }
      let ret=rgb_to_hsv(r, g, b);
      function bad(f) {
        return typeof f!=="number"||isNaN(f);
      }
      this.hsva[0] = ret[0];
      this.hsva[1] = ret[1];
      this.hsva[2] = ret[2];
      this.hsva[3] = a;
      this._recalcRGBA();
      this.update(true);
      if (this.onchange&&fire_onchange) {
          this.onchange(this.hsva, this.rgba);
      }
    }
     update(force_update=false) {
      super.update();
      let redraw=false;
      redraw = redraw||this.updateDPI(force_update, true);
      if (redraw) {
          this.satvalfield.update(true);
          this._redraw();
      }
    }
    static  define() {
      return {tagname: "colorfield-x", 
     style: "colorfield"}
    }
     _redraw() {
      this.satvalfield._redraw();
      this.huefield._redraw();
    }
  }
  _ESClass.register(ColorField);
  _es6_module.add_class(ColorField);
  ColorField = _es6_module.add_export('ColorField', ColorField);
  UIBase.internalRegister(ColorField);
  class ColorPicker extends ui.ColumnFrame {
     constructor() {
      super();
    }
     init() {
      super.init();
      this.field = UIBase.createElement("colorfield-x");
      this.field.setAttribute("class", "colorpicker");
      this.field.packflag|=this.inherit_packflag;
      this.field.packflag|=this.packflag;
      this.field.onchange = () =>        {
        this._setDataPath();
        this._setSliders();
        if (this.onchange) {
            this.onchange(this.field.rgba);
        }
      };
      let style=document.createElement("style");
      style.textContent = `
      .colorpicker {
        background-color : ${this.getDefault("background-color")};
      }
    `;
      this._style = style;
      let cb=this.colorbox = document.createElement("div");
      cb.style["width"] = "100%";
      cb.style["height"] = this.getDefault("colorBoxHeight")+"px";
      cb.style["background-color"] = "black";
      this.shadow.appendChild(style);
      this.field.ctx = this.ctx;
      this.add(this.colorbox);
      this.add(this.field);
      this.style["width"] = this.getDefault("width")+"px";
    }
     updateColorBox() {
      let r=this.field.rgba[0], g=this.field.rgba[1], b=this.field.rgba[2];
      r = ~~(r*255);
      g = ~~(g*255);
      b = ~~(b*255);
      let css=`rgb(${r},${g},${b})`;
      this.colorbox.style["background-color"] = css;
    }
    static  setDefault(node) {
      let tabs=node.tabs();
      node.cssText = node.textbox();
      node.cssText.onchange = (val) =>        {
        let ok=validateWebColor(val);
        if (!ok) {
            node.cssText.flash("red");
            return ;
        }
        else {
          node.cssText.flash("green");
        }
        val = val.trim();
        let color=web2color(val);
        node._no_update_textbox = true;
        node.field.setRGBA(color[0], color[1], color[2], color[3]);
        node._setSliders();
        node._no_update_textbox = false;
      };
      let tab=tabs.tab("HSV");
      node.h = tab.slider(undefined, "Hue", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let hsva=node.hsva;
        node.setHSVA(e.value, hsva[1], hsva[2], hsva[3]);
      });
      node.s = tab.slider(undefined, "Saturation", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let hsva=node.hsva;
        node.setHSVA(hsva[0], e.value, hsva[2], hsva[3]);
      });
      node.v = tab.slider(undefined, "Value", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let hsva=node.hsva;
        node.setHSVA(hsva[0], hsva[1], e.value, hsva[3]);
      });
      node.a = tab.slider(undefined, "Alpha", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let hsva=node.hsva;
        node.setHSVA(hsva[0], hsva[1], hsva[2], e.value);
      });
      tab = tabs.tab("RGB");
      node.r = tab.slider(undefined, "R", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let rgba=node.rgba;
        node.setRGBA(e.value, rgba[1], rgba[2], rgba[3]);
      });
      node.g = tab.slider(undefined, "G", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let rgba=node.rgba;
        node.setRGBA(rgba[0], e.value, rgba[2], rgba[3]);
      });
      node.b = tab.slider(undefined, "B", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let rgba=node.rgba;
        node.setRGBA(rgba[0], rgba[1], e.value, rgba[3]);
      });
      node.a2 = tab.slider(undefined, "Alpha", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let rgba=node.rgba;
        node.setRGBA(rgba[0], rgba[1], rgba[2], e.value);
      });
      node._setSliders();
    }
     _setSliders() {
      if (this.h===undefined) {
          console.warn("colorpicker ERROR");
          return ;
      }
      let hsva=this.field.hsva;
      this.h.setValue(hsva[0], false);
      this.s.setValue(hsva[1], false);
      this.v.setValue(hsva[2], false);
      this.a.setValue(hsva[3], false);
      let rgba=this.field.rgba;
      this.r.setValue(rgba[0], false);
      this.g.setValue(rgba[1], false);
      this.b.setValue(rgba[2], false);
      this.a2.setValue(rgba[3], false);
      this.updateColorBox();
      if (!this._no_update_textbox) {
          this.cssText.text = color2web(this.field.rgba);
      }
    }
    get  hsva() {
      return this.field.hsva;
    }
    get  rgba() {
      return this.field.rgba;
    }
     updateDataPath() {
      if (!this.hasAttribute("datapath")) {
          return ;
      }
      let prop=this.getPathMeta(this.ctx, this.getAttribute("datapath"));
      let val=this.getPathValue(this.ctx, this.getAttribute("datapath"));
      if (val===undefined) {
          this.internalDisabled = true;
          return ;
      }
      this.internalDisabled = false;
      _update_temp.load(val);
      if (prop.type===PropTypes.VEC3) {
          _update_temp[3] = 1.0;
      }
      if (_update_temp.vectorDistance(this.field.rgba)>0.01) {
          this.field.setRGBA(_update_temp[0], _update_temp[1], _update_temp[2], _update_temp[3], false);
          this._setSliders();
          this.field.update(true);
      }
    }
     update() {
      if (this.hasAttribute("datapath")) {
          this.updateDataPath();
      }
      super.update();
    }
     _setDataPath() {
      if (this.hasAttribute("datapath")) {
          let prop=this.getPathMeta(this.ctx, this.getAttribute("datapath"));
          if (prop===undefined) {
              console.warn("Bad data path for color field:", this.getAttribute("datapath"));
          }
          let val=this.field.rgba;
          if (prop!==undefined&&prop.type===PropTypes.VEC3) {
              val = new Vector3();
              val.load(this.field.rgba);
          }
          this.setPathValue(this.ctx, this.getAttribute("datapath"), val);
      }
    }
     setHSVA(h, s, v, a) {
      this.field.setHSVA(h, s, v, a);
      this._setSliders();
      this._setDataPath();
    }
     setRGBA(r, g, b, a) {
      this.field.setRGBA(r, g, b, a);
      this._setSliders();
      this._setDataPath();
    }
    static  define() {
      return {tagname: "colorpicker-x", 
     style: "colorfield"}
    }
  }
  _ESClass.register(ColorPicker);
  _es6_module.add_class(ColorPicker);
  ColorPicker = _es6_module.add_export('ColorPicker', ColorPicker);
  UIBase.internalRegister(ColorPicker);
  class ColorPickerButton extends UIBase {
     constructor() {
      super();
      this._highlight = false;
      this._depress = false;
      this._label = "";
      this.customLabel = undefined;
      this.rgba = new Vector4([1, 1, 1, 1]);
      this.labelDom = document.createElement("span");
      this.labelDom.textContent = "error";
      this.dom = document.createElement("canvas");
      this.g = this.dom.getContext("2d");
      this.shadow.appendChild(this.labelDom);
      this.shadow.appendChild(this.dom);
    }
    set  label(val) {
      this._label = val;
      this.labelDom.textContent = val;
    }
    get  label() {
      return this._label;
    }
     init() {
      super.init();
      this._font = "DefaultText";
      let enter=(e) =>        {
        this._keyhandler_add();
        this._highlight = true;
        this._redraw();
      };
      let leave=(e) =>        {
        this._keyhandler_remove();
        this._highlight = false;
        this._redraw();
      };
      this.tabIndex = 0;
      this._has_keyhandler = false;
      this._keyhandler_timeout = -1;
      this._last_keyevt = undefined;
      this._keydown = this._keydown.bind(this);
      this.addEventListener("keydown", (e) =>        {
        return this._keydown(e, true);
      });
      this.addEventListener("mousedown", (e) =>        {
        e.preventDefault();
        this.click(e);
      });
      this.addEventListener("mouseover", enter);
      this.addEventListener("mouseleave", leave);
      this.addEventListener("mousein", enter);
      this.addEventListener("mouseout", leave);
      this.addEventListener("focus", enter);
      this.addEventListener("blur", leave);
      this.setCSS();
    }
     _keyhandler_remove() {
      if (this._has_keyhandler) {
          window.removeEventListener("keydown", this._keydown, {capture: true, 
       passive: false});
          this._has_keyhandler = false;
      }
    }
     _keyhandler_add() {
      if (!this._has_keyhandler) {
          window.addEventListener("keydown", this._keydown, {capture: true, 
       passive: false});
          this._has_keyhandler = true;
      }
      this._keyhandler_timeout = util.time_ms();
    }
     _keydown(e, internal_mode=false) {
      if (internal_mode&&!this._highlight) {
          return ;
      }
      if (e===this._last_keyevt) {
          return ;
      }
      this._last_keyevt = e;
      if (e.keyCode===67&&(e.ctrlKey||e.commandKey)&&!e.shiftKey&&!e.altKey) {
          this.clipboardCopy();
          e.preventDefault();
          e.stopPropagation();
      }
      if (e.keyCode===86&&(e.ctrlKey||e.commandKey)&&!e.shiftKey&&!e.altKey) {
          this.clipboardPaste();
          e.preventDefault();
          e.stopPropagation();
      }
    }
     clipboardCopy() {
      if (!cconst.setClipboardData) {
          console.log("no clipboard api");
          return ;
      }
      let r=this.rgba[0]*255;
      let g=this.rgba[1]*255;
      let b=this.rgba[2]*255;
      let a=this.rgba[3];
      let data=`rgba(${r.toFixed(4)}, ${g.toFixed(4)}, ${b.toFixed(4)}, ${a.toFixed(4)})`;
      cconst.setClipboardData("color", "text/plain", data);
    }
     clipboardPaste() {
      if (!cconst.getClipboardData) {
          return ;
      }
      let data=cconst.getClipboardData("text/plain");
      if (!data||!validateCSSColor(""+data.data)) {
          return ;
      }
      let color;
      try {
        color = css2color(data.data);
      }
      catch (error) {
          console.log(error.stack);
          console.log(error.message);
      }
      if (color) {
          if (color.length<4) {
              color.push(1.0);
          }
          this.setRGBA(color);
      }
    }
     click(e) {
      if (this.onclick) {
          this.onclick(e);
      }
      let colorpicker=this.ctx.screen.popup(this, this);
      colorpicker.useDataPathUndo = this.useDataPathUndo;
      let path=this.hasAttribute("datapath") ? this.getAttribute("datapath") : undefined;
      let widget=colorpicker.colorPicker(path, undefined, this.getAttribute("mass_set_path"));
      widget._init();
      widget.setRGBA(this.rgba[0], this.rgba[1], this.rgba[2], this.rgba[3]);
      widget.style["padding"] = "20px";
      let onchange=() =>        {
        this.rgba.load(widget.rgba);
        this.redraw();
        if (this.onchange) {
            this.onchange(this);
        }
      };
      widget.onchange = onchange;
      colorpicker.style["background-color"] = widget.getDefault("background-color");
      colorpicker.style["border-width"] = widget.getDefault("border-width");
    }
     setRGBA(val) {
      let a=this.rgba[3];
      let old=new Vector4(this.rgba);
      this.rgba.load(val);
      if (val.length<4) {
          this.rgba[3] = a;
      }
      if (this.rgba.vectorDistance(old)<0.001) {
          return ;
      }
      if (this.hasAttribute("datapath")) {
          this.setPathValue(this.ctx, this.getAttribute("datapath"), this.rgba);
      }
      if (this.onchange) {
          this.onchange();
      }
      this._redraw();
      return this;
    }
    get  font() {
      return this._font;
    }
    set  font(val) {
      this._font = val;
      this.setCSS();
    }
     on_disabled() {
      this.setCSS();
      this._redraw();
    }
     _redraw() {
      let canvas=this.dom, g=this.g;
      g.clearRect(0, 0, canvas.width, canvas.height);
      if (this.disabled) {
          let color="rgb(55, 55, 55)";
          g.save();
          ui_base.drawRoundBox(this, canvas, g, canvas.width, canvas.height, undefined, "fill", color);
          ui_base.drawRoundBox(this, canvas, g, canvas.width, canvas.height, undefined, "clip");
          let steps=5;
          let dt=canvas.width/steps, t=0;
          g.beginPath();
          g.lineWidth = 2;
          g.strokeStyle = "black";
          for (let i=0; i<steps; i++, t+=dt) {
              g.moveTo(t, 0);
              g.lineTo(t+dt, canvas.height);
              g.moveTo(t+dt, 0);
              g.lineTo(t, canvas.height);
          }
          g.stroke();
          g.restore();
          return ;
      }
      g.save();
      let grid1="rgb(100, 100, 100)";
      let grid2="rgb(175, 175, 175)";
      ui_base.drawRoundBox(this, canvas, g, canvas.width, canvas.height, undefined, "clip");
      ui_base.drawRoundBox(this, canvas, g, canvas.width, canvas.height, undefined, "fill", grid1);
      let cellsize=10;
      let totx=Math.ceil(canvas.width/cellsize), toty=Math.ceil(canvas.height/cellsize);
      ui_base.drawRoundBox(this, canvas, g, canvas.width, canvas.height, undefined, "clip", undefined, undefined, true);
      g.clip();
      g.beginPath();
      for (let x=0; x<totx; x++) {
          for (let y=0; y<toty; y++) {
              if ((x+y)&1) {
                  continue;
              }
              g.rect(x*cellsize, y*cellsize, cellsize, cellsize);
          }
      }
      g.fillStyle = grid2;
      g.fill();
      let color=color2css(this.rgba);
      ui_base.drawRoundBox(this, canvas, g, canvas.width, canvas.height, undefined, "fill", color, undefined, true);
      if (this._highlight) {
          let color=this.getDefault("BoxHighlight");
          ui_base.drawRoundBox(this, canvas, g, canvas.width, canvas.height, undefined, "fill", color);
      }
      g.restore();
    }
     setCSS() {
      super.setCSS();
      let w=this.getDefault("width");
      let h=this.getDefault("height");
      let dpi=this.getDPI();
      this.style["width"] = "min-contents"+"px";
      this.style["height"] = h+"px";
      this.style["flex-direction"] = "row";
      this.style["display"] = "flex";
      this.labelDom.style["color"] = this.getDefault(this._font).color;
      this.labelDom.style["font"] = ui_base.getFont(this, undefined, this._font, false);
      let canvas=this.dom;
      canvas.style["width"] = w+"px";
      canvas.style["height"] = h+"px";
      canvas.width = ~~(w*dpi);
      canvas.height = ~~(h*dpi);
      this.style["background-color"] = "rgba(0,0,0,0)";
      this._redraw();
    }
    static  define() {
      return {tagname: "color-picker-button-x", 
     style: "colorpickerbutton"}
    }
     updateDataPath() {
      if (!(this.hasAttribute("datapath"))) {
          return ;
      }
      let path=this.getAttribute("datapath");
      let prop=this.getPathMeta(this.ctx, path);
      if ((prop===undefined||prop.data===undefined)&&cconst.DEBUG.verboseDataPath) {
          console.log("bad path", path);
          return ;
      }
      else 
        if (prop===undefined) {
          let redraw=!this.disabled;
          this.internalDisabled = true;
          if (redraw) {
              this._redraw();
          }
          return ;
      }
      let redraw=this.disabled;
      this.internalDisabled = false;
      if (this.customLabel===undefined&&prop.uiname!==this._label) {
          this.label = prop.uiname;
      }
      let val=this.getPathValue(this.ctx, path);
      if (val===undefined) {
          redraw = redraw||this.disabled!==true;
          this.internalDisabled = true;
          if (redraw) {
              this._redraw();
          }
      }
      else {
        this.internalDisabled = false;
        let dis;
        if (val.length===3) {
            dis = Vector3.prototype.vectorDistance.call(val, this.rgba);
        }
        else {
          dis = this.rgba.vectorDistance(val);
        }
        if (dis>0.0001) {
            if (prop.type===PropTypes.VEC3) {
                this.rgba.load(val);
                this.rgba[3] = 1.0;
            }
            else {
              this.rgba.load(val);
            }
            redraw = true;
        }
        if (redraw) {
            this._redraw();
        }
      }
    }
     update() {
      super.update();
      if (this.customLabel!==undefined&&this.customLabel!==this._label) {
          this.label = this.customLabel;
      }
      if (this._has_keyhandler&&util.time_ms()-this._keyhandler_timeout>3500) {
          console.log("keyhandler auto remove");
          this._keyhandler_remove();
      }
      for (let i=0; i<this.rgba.length; i++) {
          if (this.rgba[i]==undefined) {
              console.warn("corrupted color or alpha detected", this.rgba);
              this.rgba[i] = 1.0;
          }
      }
      let key=""+this.rgba[0].toFixed(4)+" "+this.rgba[1].toFixed(4)+" "+this.rgba[2].toFixed(4)+" "+this.rgba[3].toFixed(4);
      key+=this.disabled;
      if (key!==this._last_key) {
          this._last_key = key;
          this.redraw();
      }
      if (this.hasAttribute("datapath")) {
          this.updateDataPath();
      }
    }
     redraw() {
      this._redraw();
    }
  }
  _ESClass.register(ColorPickerButton);
  _es6_module.add_class(ColorPickerButton);
  ColorPickerButton = _es6_module.add_export('ColorPickerButton', ColorPickerButton);
  
  UIBase.internalRegister(ColorPickerButton);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_colorpicker2.js');


es6_module_define('ui_container', ["../path-controller/controller/controller.js", "../core/ui.js", "../core/ui_base.js"], function _ui_container_module(_es6_module) {
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var DataAPI=es6_import_item(_es6_module, '../path-controller/controller/controller.js', 'DataAPI');
  let api=new DataAPI();
  api = _es6_module.add_export('api', api);
  function setRootStruct(val) {
    return api.setRoot(val);
  }
  setRootStruct = _es6_module.add_export('setRootStruct', setRootStruct);
  class ContainerIF  {
     beginPath(path, cls) {

    }
     endPath() {

    }
     prop(path, args) {

    }
     tool(path, args) {

    }
     menu(title, definition, args) {

    }
     slider(path, args) {

    }
     simpleslider(path, args) {

    }
     textbox(path, args) {

    }
     vector(path, args) {

    }
     colorpicker(path, args) {

    }
     colorbutton(path, args) {

    }
     iconenum(path, args) {

    }
     iconcheck(path, args) {

    }
     button(name, tooltip, args) {

    }
     iconbutton(icon, tooltip, args) {

    }
     listenum(path, args) {

    }
     table() {

    }
     row() {

    }
     col() {

    }
     strip() {

    }
     useIcons() {

    }
     useSimpleSliders() {

    }
  }
  _ESClass.register(ContainerIF);
  _es6_module.add_class(ContainerIF);
  ContainerIF = _es6_module.add_export('ContainerIF', ContainerIF);
  class BuilderContainer extends Container {
     constructor() {
      super();
      this.pathPrefix = "";
      this.pathstack = [];
      this._class = undefined;
      this._struct = undefined;
    }
     init() {
      super.init();
    }
     _buildPath() {
      let path="";
      for (let p of this.pathstack) {
          if (p[0].trim()==="") {
              continue;
          }
          if (path.length>0)
            path+=".";
          path+=p[0];
      }
      if (this.pathstack.length>0) {
          this._class = this.pathstack[this.pathstack.length-1][1];
          this._struct = this.pathstack[this.pathstack.length-1][2];
      }
      else {
        this._class = undefined;
        this._struct = undefined;
      }
      this.pathPrefix = path;
      return path;
    }
     beginPath(path, cls) {
      this.pathstack.push([path, cls, api.mapStruct(cls, true)]);
      this._buildPath();
    }
     popPath(path, cls) {
      this.pathstack.pop();
      this._buildPath();
    }
     joinPath(path) {
      if (this.pathPrefix.trim().length>0) {
          return this.pathPrefix+"."+path;
      }
      else {
        return path.trim();
      }
    }
     _makeAPI(path) {
      if (!path) {
          return false;
      }
      if (!this._struct) {
          console.warn("No struct");
          return false;
      }
      return !(path in this._struct.pathmap);
    }
    static  define() {
      return {tagname: "container-builder-x"}
    }
     _args(args={}) {
      if (args.packflag===undefined)
        args.packflag = 0;
      args.packflag|=this.inherit_packflag;
      return args;
    }
     prop(path, args) {
      args = this._args(args);
      return super.prop(path, args.packflag, args.mass_set_path);
    }
     tool(path, args) {
      args = this._args(args);
      return super.tool(path, args.packflag, args.create_cb);
    }
     menu(title, definition, args) {
      args = this._args(args);
      return super.menu(title, definition, args.packflag);
    }
     _wrapElem(e, dpath) {
      return {widget: e, 
     range: (min, max) =>          {
          return dpath.range(min, max);
        }, 
     description: (d) =>          {
          return dpath.description(d);
        }, 
     on: () =>          {
          return dpath.on(...arguments);
        }, 
     off: () =>          {
          return dpath.off(...arguments);
        }, 
     simpleSlider: () =>          {
          return dpath.simpleSlider();
        }, 
     rollerSlider: () =>          {
          return dpath.rollerSlider();
        }, 
     uiRange: (min, max) =>          {
          return dpath.uiRange();
        }, 
     decimalPlaces: (p) =>          {
          return dpath.decimalPlaces();
        }, 
     expRate: (p) =>          {
          return dpath.expRate(p);
        }, 
     radix: (p) =>          {
          return dpath.radix(p);
        }, 
     step: (p) =>          {
          return dpath.step(p);
        }, 
     icon: (icon) =>          {
          return dpath.icon(icon);
        }, 
     icons: (iconmap) =>          {
          return dpath.icons(iconmap);
        }, 
     descriptions: (ds) =>          {
          return dpath.descriptions(ds);
        }, 
     customGetSet: () =>          {
          return dpath.customGetSet.apply(...arguments);
        }}
    }
     slider(path, args) {
      args = this._args(args);
      let dopatch=false, dpath;
      if (this._makeAPI(path)) {
          let path2=args.apiname ? args.apiname : path;
          let uiname=args.uiName ? args.uiName : path2;
          if (args.is_int||args.isInt) {
              dpath = this._struct.int(path, path2, uiname, args.description);
          }
          else {
            dpath = this._struct.float(path, path2, uiname, args.description);
          }
          if (args.min&&args.max) {
              dpath.range(args.min, args.max);
          }
      }
      let ret=super.slider(this.joinPath(path), args.name, args.defaultval, args.min, args.max, args.step, args.is_int, args.do_redraw, args.callback, args.packflag);
      if (dopatch) {
          this._wrapElem(ret, dpath);
      }
      return ret;
    }
     simpleslider(path, args) {
      args = this._args(args);
      args.packflag|=PackFlags.SIMPLE_NUMSLIDERS;
      return this.slider(path, args);
    }
     textbox(path, args) {
      args = this._args(args);
      let dopatch=false, dpath;
      if (this._makeAPI(path)) {
          let path2=args.apiname ? args.apiname : path;
          let uiname=args.uiName ? args.uiName : path2;
          if (args.type==="int") {
              dpath = this._struct.int(path, path2, uiname, args.description);
          }
          else 
            if (args.type==="float") {
              dpath = this._struct.float(path, path2, uiname, args.description);
          }
          else {
            dpath = this._struct.string(path, path2, uiname, args.description);
          }
          if ((args.type==="int"||args.type==="float")&&args.min&&args.max) {
              dpath.range(args.min, args.max);
          }
      }
      let ret=super.textbox(this.joinPath(path), args.text, args.callback, args.packflag);
      if (dopatch) {
          this._wrapElem(ret, dpath);
      }
      return ret;
    }
     vector(path, args) {

    }
     colorpicker(path, args) {

    }
     colorbutton(path, args) {

    }
     iconenum(path, args) {

    }
     iconcheck(path, args) {

    }
     button(name, tooltip, args) {

    }
     iconbutton(icon, tooltip, args) {

    }
     listenum(path, args) {

    }
     table() {

    }
     row() {

    }
     col() {

    }
     strip() {

    }
     useIcons() {

    }
     useSimpleSliderS() {

    }
  }
  _ESClass.register(BuilderContainer);
  _es6_module.add_class(BuilderContainer);
  BuilderContainer = _es6_module.add_export('BuilderContainer', BuilderContainer);
  class BuilderRow extends BuilderContainer {
     init() {
      super.init();
      this.style["flex-direction"] = "row";
    }
    static  define() {
      return {tagname: "row-builder-x"}
    }
  }
  _ESClass.register(BuilderRow);
  _es6_module.add_class(BuilderRow);
  BuilderRow = _es6_module.add_export('BuilderRow', BuilderRow);
  UIBase.internalRegister(BuilderRow);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_container.js');


es6_module_define('ui_curvewidget', ["../path-controller/util/util.js", "../path-controller/curve/curve1d.js", "../core/ui_base.js", "../path-controller/curve/curve1d_utils.js", "../core/ui.js", "../path-controller/toolsys/toolprop.js", "../path-controller/util/vectormath.js"], function _ui_curvewidget_module(_es6_module) {
  var Curve1DProperty=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'Curve1DProperty');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var Icons=es6_import_item(_es6_module, '../core/ui_base.js', 'Icons');
  var ColumnFrame=es6_import_item(_es6_module, '../core/ui.js', 'ColumnFrame');
  var RowFrame=es6_import_item(_es6_module, '../core/ui.js', 'RowFrame');
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var Vector2=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector3');
  var Curve1D=es6_import_item(_es6_module, '../path-controller/curve/curve1d.js', 'Curve1D');
  var mySafeJSONStringify=es6_import_item(_es6_module, '../path-controller/curve/curve1d.js', 'mySafeJSONStringify');
  var makeGenEnum=es6_import_item(_es6_module, '../path-controller/curve/curve1d_utils.js', 'makeGenEnum');
  class Curve1DWidget extends ColumnFrame {
     constructor() {
      super();
      this.useDataPathUndo = false;
      this._on_draw = this._on_draw.bind(this);
      this.drawTransform = [1.0, [0, 0]];
      this._value = new Curve1D();
      this._value.on("draw", this._on_draw);
      this._value._on_change = (msg) =>        {
        if (this.onchange) {
            this.onchange(this._value);
        }
        if (this.hasAttribute("datapath")) {
            let path=this.getAttribute("datapath");
            if (this._value!==undefined) {
                let val=this.getPathValue(this.ctx, path);
                if (val) {
                    val.load(this._value);
                    this.setPathValue(this.ctx, path, val);
                }
                else {
                  val = this._value.copy();
                  this.setPathValue(this.ctx, path, val);
                }
            }
        }
      };
      this._gen_type = undefined;
      this._lastGen = undefined;
      this._last_dpi = undefined;
      this.canvas = document.createElement("canvas");
      this.g = this.canvas.getContext("2d");
      this.canvas.g = this.g;
      window.cw = this;
      this.shadow.appendChild(this.canvas);
    }
    get  value() {
      return this._value;
    }
     _on_draw(e) {
      let curve=e.data;
      this._redraw();
    }
    set  value(val) {
      this._value.load(val);
      this.update();
      this._redraw();
    }
     _on_change() {
      if (this.onchange) {
          this.onchange(this);
      }
    }
     init() {
      super.init();
      this.useDataPathUndo = false;
      let row=this.row();
      let prop=makeGenEnum();
      prop.setValue(this.value.generatorType);
      this.dropbox = row.listenum(undefined, "Type", prop, this.value.generatorType, (id) =>        {
        console.warn("SELECT", id, prop.keys[id]);
        this.value.setGenerator(id);
        this.value._on_change("curve type change");
      });
      this.dropbox._init();
      row.iconbutton(Icons.ZOOM_OUT, "Zoom Out", () =>        {
        let curve=this._value;
        if (!curve)
          return ;
        curve.uiZoom*=0.9;
        if (this.getAttribute("datapath")) {
            this.setPathValue(this.ctx, this.getAttribute("datapath"), curve);
        }
        this._redraw();
      }).iconsheet = 0;
      row.iconbutton(Icons.ZOOM_IN, "Zoom In", () =>        {
        let curve=this._value;
        if (!curve)
          return ;
        curve.uiZoom*=1.1;
        if (this.getAttribute("datapath")) {
            this.setPathValue(this.ctx, this.getAttribute("datapath"), curve);
        }
        this._redraw();
      }).iconsheet = 0;
      this.container = this.col();
    }
     setCSS() {
      super.setCSS();
      this.style["width"] = "min-contents";
      this.style["height"] = "min-contents";
      this.updateSize();
    }
     updateSize() {
      let dpi=UIBase.getDPI();
      let w=~~(this.getDefault("CanvasWidth")*dpi);
      let h=~~(this.getDefault("CanvasHeight")*dpi);
      let bad=w!==this.canvas.width||h!==this.canvas.height;
      bad = bad||dpi!==this._last_dpi;
      if (!bad) {
          return ;
      }
      this._last_dpi = dpi;
      this.canvas.width = w;
      this.canvas.height = h;
      this.canvas.style["width"] = (w/dpi)+"px";
      this.canvas.style["height"] = (h/dpi)+"px";
      this._redraw();
    }
     _redraw() {
      this.canvas.width = this.canvas.width;
      this.canvas.height = this.canvas.height;
      let canvas=this.canvas, g=this.g;
      g.beginPath();
      g.rect(0, 0, canvas.width, canvas.height);
      g.fillStyle = this.getDefault("CanvasBG");
      g.fill();
      g.save();
      let zoom=this._value.uiZoom;
      let scale=Math.max(canvas.width, canvas.height);
      g.lineWidth/=scale;
      this.drawTransform[0] = scale*zoom;
      this.drawTransform[1][0] = 0.0;
      this.drawTransform[1][1] = -1.0;
      this.drawTransform[1][0]-=0.5-0.5/zoom;
      this.drawTransform[1][1]+=0.5-0.5/zoom;
      g.scale(this.drawTransform[0], -this.drawTransform[0]);
      g.translate(this.drawTransform[1][0], this.drawTransform[1][1]);
      g.lineWidth/=zoom;
      this._value.draw(this.canvas, this.g, this.drawTransform);
      g.restore();
    }
     rebuild() {
      let ctx=this.ctx;
      if (ctx===undefined||this.container===undefined) {
          return ;
      }
      this._gen_type = this.value.generatorType;
      let col=this.container;
      if (this._lastGen!==undefined) {
          this._lastGen.killGUI(col, this.canvas);
      }
      let onchange=this.dropbox.onchange;
      this.dropbox.onchange = undefined;
      this.dropbox.setValue(this.value.generatorType);
      this.dropbox.onchange = onchange;
      col.clear();
      let gen=this.value.generators.active;
      gen.makeGUI(col, this.canvas);
      this._lastGen = gen;
      this._redraw();
    }
     updateDataPath() {
      if (!this.hasAttribute("datapath")) {
          return ;
      }
      let path=this.getAttribute("datapath");
      let val=this.getPathValue(this.ctx, path);
      if (this._lastu===undefined) {
          this._lastu = 0;
      }
      if (val&&!val.equals(this._value)&&util.time_ms()-this._lastu>200) {
          this._lastu = util.time_ms();
          this._value.load(val);
          this.update();
          this._redraw();
      }
    }
     updateGenUI() {
      let bad=this._lastGen!==this.value.generators.active;
      if (bad) {
          this.rebuild();
          this._redraw();
      }
    }
     update() {
      super.update();
      this.updateDataPath();
      this.updateSize();
      this.updateGenUI();
    }
    static  define() {
      return {tagname: "curve-widget-x", 
     style: "curvewidget"}
    }
  }
  _ESClass.register(Curve1DWidget);
  _es6_module.add_class(Curve1DWidget);
  Curve1DWidget = _es6_module.add_export('Curve1DWidget', Curve1DWidget);
  UIBase.internalRegister(Curve1DWidget);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_curvewidget.js');


es6_module_define('ui_dialog', ["../screen/ScreenArea.js", "../path-controller/util/simple_events.js"], function _ui_dialog_module(_es6_module) {
  var AreaFlags=es6_import_item(_es6_module, '../screen/ScreenArea.js', 'AreaFlags');
  var keymap=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'keymap');
  function makePopupArea(area_class, screen, args) {
    if (args===undefined) {
        args = {};
    }
    let sarea=UIBase.createElement("screenarea-x");
    let width=args.width||(screen.size[0]*0.7);
    let height=args.height||(screen.size[1]*0.7);
    let addEscapeKeyHandler=args.addEscapeKeyHandler!==undefined ? args.addEscapeKeyHandler : true;
    sarea.ctx = screen.ctx;
    sarea.size[0] = width;
    sarea.size[1] = height;
    sarea.pos[0] = 100;
    sarea.pos[1] = 100;
    sarea.pos[0] = Math.min(sarea.pos[0], screen.size[0]-sarea.size[0]-2);
    sarea.pos[1] = Math.min(sarea.pos[1], screen.size[1]-sarea.size[1]-2);
    sarea.switch_editor(area_class);
    sarea.overrideClass("popup");
    sarea.style["background-color"] = sarea.getDefault("background-color");
    sarea.style["border-radius"] = sarea.getDefault("border-radius")+"px";
    sarea.style["border-color"] = sarea.getDefault("border-color");
    sarea.style["border-style"] = sarea.getDefault("border-style");
    sarea.style["border-width"] = sarea.getDefault("border-width")+"px";
    sarea.area.flag|=AreaFlags.FLOATING|AreaFlags.INDEPENDENT;
    screen.appendChild(sarea);
    sarea.setCSS();
    if (addEscapeKeyHandler) {
        sarea.on_keydown = (e) =>          {
          if (e.keyCode===keymap.Escape) {
              screen.removeArea(sarea);
          }
        };
    }
    sarea.bringToFront();
    return sarea;
  }
  makePopupArea = _es6_module.add_export('makePopupArea', makePopupArea);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_dialog.js');


es6_module_define('ui_lasttool', ["../path-controller/util/util.js", "../core/ui_base.js", "../path-controller/toolsys/toolprop.js", "../core/ui.js", "../path-controller/controller/controller.js", "../config/const.js", "../path-controller/toolsys/toolsys.js"], function _ui_lasttool_module(_es6_module) {
  var PackFlags=es6_import_item(_es6_module, '../core/ui_base.js', 'PackFlags');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var ColumnFrame=es6_import_item(_es6_module, '../core/ui.js', 'ColumnFrame');
  var PropTypes=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'PropTypes');
  var PropFlags=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'PropFlags');
  var UndoFlags=es6_import_item(_es6_module, '../path-controller/toolsys/toolsys.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../path-controller/toolsys/toolsys.js', 'ToolFlags');
  var DataPath=es6_import_item(_es6_module, '../path-controller/controller/controller.js', 'DataPath');
  var DataTypes=es6_import_item(_es6_module, '../path-controller/controller/controller.js', 'DataTypes');
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  const LastKey=Symbol("LastToolPanelId");
  let tool_idgen=0;
  function getLastToolStruct(ctx) {
    let ret=ctx.state._last_tool;
    if (!ret) {
        ret = ctx.toolstack.head;
    }
    else {
      let msg="Passing the last tool to last-tool-panel via appstate._last_tool is deprecated;";
      msg+="\nctx.toolstack.head is now used instead.";
      console.warn(msg);
    }
    return ret;
  }
  getLastToolStruct = _es6_module.add_export('getLastToolStruct', getLastToolStruct);
  class LastToolPanel extends ColumnFrame {
     constructor() {
      super();
      this._tool_id = undefined;
      this.useDataPathUndo = false;
    }
     init() {
      super.init();
      this.useDataPathUndo = false;
      this.rebuild();
    }
     getToolStackHead(ctx) {
      let bad=ctx.toolstack.length===0||ctx.toolstack.cur>=ctx.toolstack.length;
      bad = bad||ctx.toolstack.cur<0;
      bad = bad||ctx.toolstack[ctx.toolstack.cur].undoflag&UndoFlags.IS_UNDO_ROOT;
      if (bad) {
          return undefined;
      }
      return ctx.toolstack[ctx.toolstack.cur];
    }
     rebuild() {
      let ctx=this.ctx;
      if (ctx===undefined) {
          this._tool_id = -1;
          return ;
      }
      this.clear();
      this.label("Recent Command Settings");
      let tool=this.getToolStackHead(ctx);
      if (!tool) {
          this.setCSS();
          return ;
      }
      let def=tool.constructor.tooldef();
      let name=def.uiname!==undefined ? def.uiname : def.name;
      let panel=this.panel(def.uiname);
      this.buildTool(ctx, tool, panel);
      this.flushUpdate();
    }
     buildTool(ctx, tool, panel) {
      let fakecls={};
      fakecls.constructor = fakecls;
      this.ctx.state._last_tool = fakecls;
      let lastkey=tool[LastKey];
      let getTool=() =>        {
        let tool=this.ctx.toolstack[this.ctx.toolstack.cur];
        if (!tool||tool[LastKey]!==lastkey) {
            return undefined;
        }
        return tool;
      };
      if (tool.flag&ToolFlags.PRIVATE) {
          return ;
      }
      let st=this.ctx.api.mapStruct(fakecls, true);
      let paths=[];
      function defineProp(k, key) {
        Object.defineProperty(fakecls, key, {get: function () {
            let tool=getTool();
            if (tool) {
                if (!tool.inputs[k]) {
                    console.error("Missing property "+k, tool);
                }
                return tool.inputs[k].getValue();
            }
          }, 
      set: function (val) {
            let tool=getTool();
            if (tool) {
                tool.inputs[k].setValue(val);
                ctx.toolstack.rerun(tool);
            }
          }});
      }
      for (let k in tool.inputs) {
          let prop=tool.inputs[k];
          if (prop.flag&(PropFlags.PRIVATE|PropFlags.READ_ONLY)) {
              continue;
          }
          let uiname=prop.uiname!==undefined ? prop.uiname : k;
          prop.uiname = uiname;
          let apikey=k.replace(/[\t ]/g, "_");
          let dpath=new DataPath(apikey, apikey, prop, DataTypes.PROP);
          st.add(dpath);
          paths.push(dpath);
          defineProp(k, apikey);
      }
      panel.useDataPathUndo = false;
      for (let dpath of paths) {
          let path="last_tool."+dpath.path;
          panel.label(dpath.data.uiname);
          let ret=panel.prop(path, PackFlags.FORCE_ROLLER_SLIDER);
          if (ret) {
              ret.useDataPathUndo = false;
          }
      }
      this.setCSS();
    }
     update() {
      super.update();
      let ctx=this.ctx;
      if (!ctx) {
          return ;
      }
      let tool=this.getToolStackHead(ctx);
      if (tool&&(!(LastKey in tool)||tool[LastKey]!==this._tool_id)) {
          tool[LastKey] = tool_idgen++;
          this._tool_id = tool[LastKey];
          this.rebuild();
      }
    }
    static  define() {
      return {tagname: "last-tool-panel-x"}
    }
  }
  _ESClass.register(LastToolPanel);
  _es6_module.add_class(LastToolPanel);
  LastToolPanel = _es6_module.add_export('LastToolPanel', LastToolPanel);
  UIBase.internalRegister(LastToolPanel);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_lasttool.js');


es6_module_define('ui_listbox', ["../path-controller/toolsys/toolprop.js", "../core/ui_base.js", "./ui_table.js", "../path-controller/util/events.js", "../path-controller/toolsys/toolsys.js", "../core/ui.js", "../path-controller/util/util.js", "../path-controller/util/vectormath.js"], function _ui_listbox_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var vectormath=es6_import(_es6_module, '../path-controller/util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../path-controller/util/events.js');
  var simple_toolsys=es6_import(_es6_module, '../path-controller/toolsys/toolsys.js');
  var toolprop=es6_import(_es6_module, '../path-controller/toolsys/toolprop.js');
  var TableFrame=es6_import_item(_es6_module, './ui_table.js', 'TableFrame');
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  var ColumnFrame=es6_import_item(_es6_module, '../core/ui.js', 'ColumnFrame');
  var RowFrame=es6_import_item(_es6_module, '../core/ui.js', 'RowFrame');
  var keymap=es6_import_item(_es6_module, '../path-controller/util/events.js', 'keymap');
  let EnumProperty=toolprop.EnumProperty, PropTypes=toolprop.PropTypes;
  let UIBase=ui_base.UIBase, PackFlags=ui_base.PackFlags, IconSheets=ui_base.IconSheets;
  function getpx(css) {
    return parseFloat(css.trim().replace("px", ""));
  }
  class ListItem extends RowFrame {
     constructor() {
      super();
      let highlight=() =>        {
        this.highlight = true;
        this.setBackground();
      };
      let unhighlight=() =>        {
        this.highlight = false;
        this.setBackground();
      };
      this.addEventListener("mouseover", highlight);
      this.addEventListener("mousein", highlight);
      this.addEventListener("mouseleave", unhighlight);
      this.addEventListener("mouseout", unhighlight);
      this.addEventListener("blur", unhighlight);
      this.addEventListener("click", (e) =>        {
        if (this.onclick) {
            this.onclick();
        }
      });
      let style=document.createElement("style");
      style.textContent = `
      .listitem {
        -moz-user-focus: normal;
        moz-user-focus: normal;
        user-focus: normal;
      }
    `;
      this.shadowRoot.prepend(style);
    }
    static  define() {
      return {tagname: "listitem-x", 
     style: "listbox"}
    }
     init() {
      super.init();
      this.setAttribute("class", "listitem");
      this.style["width"] = "100%";
      this.style["height"] = this.getDefault("ItemHeight")+"px";
      this.style["flex-grow"] = "unset";
      this.setCSS();
    }
     setBackground() {
      if (this.highlight&&this.is_active) {
          this.background = this.getDefault("ListActiveHighlight");
      }
      else 
        if (this.highlight) {
          this.background = this.getDefault("ListHighlight");
      }
      else 
        if (this.is_active) {
          this.background = this.getDefault("ListActive");
      }
      else {
        this.background = this.getDefault("background-color");
      }
    }
  }
  _ESClass.register(ListItem);
  _es6_module.add_class(ListItem);
  UIBase.internalRegister(ListItem);
  class ListBox extends Container {
     constructor() {
      super();
      this.items = [];
      this.idmap = {};
      this.items.active = undefined;
      this.highlight = false;
      this.is_active = false;
      let style=document.createElement("style");
      style.textContent = `
      .listbox {
        -moz-user-focus: normal;
        moz-user-focus: normal;
        user-focus: normal;
      }
    `;
      this.shadow.prepend(style);
      this.onkeydown = (e) =>        {
        switch (e.keyCode) {
          case keymap["Up"]:
          case keymap["Down"]:
            if (this.items.length==0)
              return ;
            if (this.items.active===undefined) {
                this.setActive(this.items[0]);
                return ;
            }
            let i=this.items.indexOf(this.items.active);
            let dir=e.keyCode==keymap["Up"] ? -1 : 1;
            i = Math.max(Math.min(i+dir, this.items.length-1), 0);
            this.setActive(this.items[i]);
            break;
        }
      };
    }
    static  define() {
      return {tagname: "listbox-x", 
     style: "listbox"}
    }
     setCSS() {
      super.setCSS();
    }
     init() {
      super.init();
      this.setCSS();
      this.style["width"] = this.getDefault("width")+"px";
      this.style["height"] = this.getDefault("height")+"px";
      this.style["overflow"] = "scroll";
    }
     addItem(name, id) {
      let item=UIBase.createElement("listitem-x");
      item._id = id===undefined ? this.items.length : id;
      this.idmap[item._id] = item;
      this.tabIndex = 1;
      this.setAttribute("tabindex", 1);
      this.add(item);
      this.items.push(item);
      item.label(name);
      let this2=this;
      item.onclick = function () {
        this2.setActive(this);
        this.setBackground();
      };
      return item;
    }
     removeItem(item) {
      if (typeof item=="number") {
          item = this.idmap[item];
      }
      item.remove();
      delete this.idmap[item._id];
      this.items.remove(item);
    }
     setActive(item) {
      if (typeof item=="number") {
          item = this.idmap[item];
      }
      if (item===this.items.active) {
          return ;
      }
      if (this.items.active!==undefined) {
          this.items.active.highlight = false;
          this.items.active.is_active = false;
          this.items.active.setBackground();
      }
      this.items.active = item;
      if (item) {
          item.is_active = true;
          item.setBackground();
          item.scrollIntoViewIfNeeded();
      }
      if (this.onchange) {
          this.onchange(item ? item._id : undefined, item);
      }
    }
     clear() {

    }
  }
  _ESClass.register(ListBox);
  _es6_module.add_class(ListBox);
  UIBase.internalRegister(ListBox);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_listbox.js');


es6_module_define('ui_menu', ["../path-controller/util/util.js", "../config/const.js", "../path-controller/toolsys/toolprop.js", "../path-controller/util/events.js", "../core/ui_base.js", "../path-controller/util/simple_events.js", "./ui_button.js"], function _ui_menu_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var toolprop=es6_import(_es6_module, '../path-controller/toolsys/toolprop.js');
  var OldButton=es6_import_item(_es6_module, './ui_button.js', 'OldButton');
  var DomEventTypes=es6_import_item(_es6_module, '../path-controller/util/events.js', 'DomEventTypes');
  var HotKey=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'HotKey');
  var keymap=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'keymap');
  let EnumProperty=toolprop.EnumProperty, PropTypes=toolprop.PropTypes;
  let UIBase=ui_base.UIBase, PackFlags=ui_base.PackFlags, IconSheets=ui_base.IconSheets;
  function getpx(css) {
    return parseFloat(css.trim().replace("px", ""));
  }
  class Menu extends UIBase {
     constructor() {
      super();
      this.items = [];
      this.autoSearchMode = true;
      this._ignoreFocusEvents = false;
      this.closeOnMouseUp = true;
      this._submenu = undefined;
      this.itemindex = 0;
      this.closed = false;
      this.started = false;
      this.activeItem = undefined;
      this.overrideDefault("DefaultText", this.getDefault("MenuText"));
      this.container = document.createElement("span");
      this.container.style["display"] = "flex";
      this.container.style["color"] = this.getDefault("MenuText").color;
      this.container.setAttribute("class", "menucon");
      this.dom = document.createElement("ul");
      this.dom.setAttribute("class", "menu");
      let style=this.menustyle = document.createElement("style");
      this.buildStyle();
      this.dom.setAttribute("tabindex", -1);
      this.shadow.appendChild(style);
      this.shadow.appendChild(this.container);
    }
     float(x, y, zindex=undefined) {
      let dpi=this.getDPI();
      let rect=this.dom.getClientRects();
      let maxx=this.getWinWidth()-10;
      let maxy=this.getWinHeight()-10;
      if (rect.length>0) {
          rect = rect[0];
          if (y+rect.height>maxy) {
              y = maxy-rect.height-1;
          }
          if (x+rect.width>maxx) {
              x = maxx-rect.width-1;
          }
      }
      super.float(x, y, 50);
    }
     click() {
      if (!this.activeItem||this.activeItem._isMenu) {
          return ;
      }
      if (this.onselect) {
          try {
            this.onselect(this.activeItem._id);
          }
          catch (error) {
              util.print_stack(error);
              console.log("Error in menu callback");
          }
      }
      this.close();
    }
     _ondestroy() {
      if (this.started) {
          menuWrangler.popMenu(this);
          if (this.onclose) {
              this.onclose();
          }
      }
    }
     init() {
      super.init();
      this.setCSS();
    }
     close() {
      if (this.closed) {
          return ;
      }
      this.closed = true;
      if (this.started) {
          menuWrangler.popMenu(this);
      }
      this.started = false;
      if (this._popup) {
          this._popup.end();
          this._popup = undefined;
      }
      this.remove();
      this.dom.remove();
      if (this.onclose) {
          this.onclose(this);
      }
    }
     _select(dir, focus=true) {
      if (this.activeItem===undefined) {
          for (let item of this.items) {
              if (!item.hidden) {
                  this.setActive(item, focus);
                  break;
              }
          }
      }
      else {
        let i=this.items.indexOf(this.activeItem);
        let item=this.activeItem;
        do {
          i = (i+dir+this.items.length)%this.items.length;
          item = this.items[i];
          if (!item.hidden) {
              break;
          }
        } while (item!==this.activeItem);
        
        this.setActive(item, focus);
      }
      if (this.hasSearchBox) {
          this.activeItem.scrollIntoView();
      }
    }
     selectPrev(focus=true) {
      return this._select(-1, focus);
    }
     selectNext(focus=true) {
      return this._select(1, focus);
    }
    static  define() {
      return {tagname: "menu-x", 
     style: "menu"}
    }
     start_fancy(prepend, setActive=true) {
      return this.startFancy(prepend, setActive);
    }
     setActive(item, focus=true) {
      if (this.activeItem===item) {
          return ;
      }
      if (this.activeItem) {
          this.activeItem.style["background-color"] = this.getDefault("MenuBG");
          if (focus) {
              this.activeItem.blur();
          }
      }
      if (item) {
          item.style["background-color"] = this.getDefault("MenuHighlight");
          if (focus) {
              item.focus();
          }
      }
      this.activeItem = item;
    }
     startFancy(prepend, setActive=true) {
      this.hasSearchBox = true;
      this.started = true;
      menuWrangler.pushMenu(this);
      let dom2=document.createElement("div");
      this.dom.setAttribute("class", "menu");
      dom2.setAttribute("class", "menu");
      let sbox=this.textbox = UIBase.createElement("textbox-x");
      this.textbox.parentWidget = this;
      dom2.appendChild(sbox);
      dom2.appendChild(this.dom);
      dom2.style["height"] = "300px";
      this.dom.style["height"] = "300px";
      this.dom.style["overflow"] = "scroll";
      if (prepend) {
          this.container.prepend(dom2);
      }
      else {
        this.container.appendChild(dom2);
      }
      dom2.parentWidget = this.container;
      sbox.focus();
      sbox.onchange = () =>        {
        let t=sbox.text.trim().toLowerCase();
        for (let item of this.items) {
            item.hidden = true;
            item.remove();
        }
        for (let item of this.items) {
            let ok=t=="";
            ok = ok||item.innerHTML.toLowerCase().search(t)>=0;
            if (ok) {
                item.hidden = false;
                this.dom.appendChild(item);
            }
            else 
              if (item===this.activeItem) {
                this.selectNext(false);
            }
        }
      };
      sbox.addEventListener("keydown", (e) =>        {
        switch (e.keyCode) {
          case 27:
            this.close();
            break;
          case 13:
            this.click(this.activeItem);
            this.close();
            break;
        }
      });
    }
     start(prepend=false, setActive=true) {
      this.closed = false;
      this.started = true;
      this.focus();
      menuWrangler.pushMenu(this);
      if (this.items.length>15&&this.autoSearchMode) {
          return this.start_fancy(prepend, setActive);
      }
      if (prepend) {
          this.container.prepend(this.dom);
      }
      else {
        this.container.appendChild(this.dom);
      }
      if (!setActive)
        return ;
      this.setCSS();
      this.flushUpdate();
      window.setTimeout(() =>        {
        this.flushUpdate();
        if (this.activeItem===undefined) {
            this.activeItem = this.dom.childNodes[0];
        }
        if (this.activeItem===undefined) {
            return ;
        }
        this.activeItem.focus();
      }, 0);
    }
     addItemExtra(text, id=undefined, hotkey, icon=-1, add=true, tooltip=undefined) {
      let dom=document.createElement("span");
      dom.style["display"] = "inline-flex";
      dom.hotkey = hotkey;
      dom.icon = icon;
      let icon_div;
      if (1) {
          icon_div = ui_base.makeIconDiv(icon, IconSheets.SMALL);
      }
      else {
        let tilesize=ui_base.iconmanager.getTileSize(IconSheets.SMALL);
        icon_div = document.createElement("span");
        icon_div.style["padding"] = icon_div.style["margin"] = "0px";
        icon_div.style["width"] = tilesize+"px";
        icon_div.style["height"] = tilesize+"px";
      }
      icon_div.style["display"] = "inline-flex";
      icon_div.style["margin-right"] = "1px";
      icon_div.style["align"] = "left";
      let span=document.createElement("span");
      span.style["font"] = ui_base.getFont(this, undefined, "MenuText");
      let dpi=this.getDPI();
      let tsize=this.getDefault("MenuText").size;
      let canvas=document.createElement("canvas");
      let g=canvas.getContext("2d");
      g.font = span.style["font"];
      let rect=span.getClientRects();
      let twid=Math.ceil(g.measureText(text).width);
      let hwid;
      if (hotkey) {
          dom.hotkey = hotkey;
          g.font = ui_base.getFont(this, undefined, "HotkeyText");
          hwid = Math.ceil(g.measureText(hotkey).width/UIBase.getDPI());
          twid+=hwid+8;
      }
      span.innerText = text;
      span.style["word-wrap"] = "none";
      span.style["white-space"] = "pre";
      span.style["overflow"] = "hidden";
      span.style["text-overflow"] = "clip";
      span.style["width"] = ~~(twid)+"px";
      span.style["padding"] = "0px";
      span.style["margin"] = "0px";
      dom.style["width"] = "100%";
      dom.appendChild(icon_div);
      dom.appendChild(span);
      if (hotkey) {
          let hotkey_span=document.createElement("span");
          hotkey_span.innerText = hotkey;
          hotkey_span.style["display"] = "inline-flex";
          hotkey_span.style["margin"] = "0px";
          hotkey_span.style["margin-left"] = "auto";
          hotkey_span.style["margin-right"] = "0px";
          hotkey_span.style["padding"] = "0px";
          hotkey_span.style["font"] = ui_base.getFont(this, undefined, "HotkeyText");
          hotkey_span.style["color"] = this.getDefault("HotkeyTextColor");
          hotkey_span.style["width"] = "max-content";
          hotkey_span.style["text-align"] = "right";
          hotkey_span.style["justify-content"] = "right";
          hotkey_span["flex-wrap"] = "nowrap";
          hotkey_span["text-wrap"] = "nowrap";
          dom.appendChild(hotkey_span);
      }
      let ret=this.addItem(dom, id, add);
      ret.hotkey = hotkey;
      ret.icon = icon;
      ret.label = text ? text : ret.innerText;
      if (tooltip) {
          ret.title = tooltip;
      }
      return ret;
    }
     addItem(item, id, add=true, tooltip=undefined) {
      id = id===undefined ? item : id;
      let text=item;
      if (typeof item==="string"||__instance_of(item, String)) {
          let dom=document.createElement("dom");
          dom.textContent = item;
          item = dom;
      }
      else {
        text = item.textContent;
      }
      let li=document.createElement("li");
      li.setAttribute("tabindex", this.itemindex++);
      li.setAttribute("class", "menuitem");
      if (tooltip!==undefined) {
          li.title = tooltip;
      }
      if (__instance_of(item, Menu)) {
          let dom=document.createElement("span");
          dom.innerHTML = ""+item.title;
          dom._id = dom.id = id;
          dom.setAttribute("class", "menu");
          li.style["width"] = "100%";
          li.appendChild(dom);
          li._isMenu = true;
          li._menu = item;
          item.hidden = false;
          item.container = this.container;
      }
      else {
        li._isMenu = false;
        li.appendChild(item);
      }
      li._id = id;
      this.items.push(li);
      li.label = text ? text : li.innerText.trim();
      if (add) {
          li.addEventListener("click", (e) =>            {
            if (this.activeItem!==undefined&&this.activeItem._isMenu) {
                return ;
            }
            this.click();
          });
          li.addEventListener("blur", (e) =>            {
            if (this._ignoreFocusEvents) {
                return ;
            }
            if (this.activeItem&&!this.activeItem._isMenu) {
                this.setActive(undefined, false);
            }
          });
          let onfocus=(e) =>            {
            if (this._ignoreFocusEvents) {
                return ;
            }
            let active=this.activeItem;
            if (this._submenu) {
                this._submenu.close();
                this._submenu = undefined;
            }
            if (li._isMenu) {
                li._menu.onselect = (item) =>                  {
                  this.onselect(item);
                  li._menu.close();
                  this.close();
                };
                li._menu.start(false, false);
                this._submenu = li._menu;
            }
            this.setActive(li, false);
          };
          li.addEventListener("touchend", (e) =>            {
            onfocus(e);
            if (this.activeItem!==undefined&&this.activeItem._isMenu) {
                return ;
            }
            this.click();
          });
          li.addEventListener("focus", (e) =>            {
            onfocus(e);
          });
          li.addEventListener("touchmove", (e) =>            {
            onfocus(e);
            li.focus();
          });
          li.addEventListener("mouseenter", (e) =>            {
            li.focus();
          });
          this.dom.appendChild(li);
      }
      return li;
    }
     _getBorderStyle() {
      let r=this.getDefault("border-width");
      let s=this.getDefault("border-style");
      let c=this.getDefault("border-color");
      return `${r}px ${s} ${c}`;
    }
     buildStyle() {
      let pad1=util.isMobile() ? 2 : 0;
      pad1+=this.getDefault("MenuSpacing");
      let boxShadow="";
      if (this.hasDefault("box-shadow")) {
          boxShadow = "box-shadow: "+this.getDefault("box-shadow")+';';
      }
      this.menustyle.textContent = `
        .menucon {
          position:absolute;
          float:left;
          
          border-radius : ${this.getDefault("border-radius")}px;

          display: block;
          -moz-user-focus: normal;
          ${boxShadow}
        }
        
        ul.menu {
          display        : flex;
          flex-direction : column;
          flex-wrap      : nowrap;
          width          : max-content;
          
          margin : 0px;
          padding : 0px;
          border : ${this._getBorderStyle()};
          border-radius : ${this.getDefault("border-radius")}px;
          -moz-user-focus: normal;
          background-color: ${this.getDefault("MenuBG")};
          color : ${this.getDefault("MenuText").color};
        }
        
        .menuitem {
          display : flex;
          flex-wrap : nowrap;
          flex-direction : row;          
          
          list-style-type:none;
          -moz-user-focus: normal;
          
          margin : 0;
          padding : 0px;
          padding-right: 16px;
          padding-left: 16px;
          padding-top : ${pad1}px;
          padding-bottom : ${pad1}px;
          
          border-radius : ${this.getDefault("border-radius")}px;
          
          color : ${this.getDefault("MenuText").color};
          font : ${this.getDefault("MenuText").genCSS()};
          background-color: ${this.getDefault("MenuBG")};
        }
        
        .menuseparator {
          ${this.getDefault("MenuSeparator")}
        }
        
        .menuitem:focus {
          display : flex;
          flex-wrap : nowrap;
          
          border : none;
          outline : none;
          border-radius : ${this.getDefault("border-radius")}px;
          
          background-color: ${this.getDefault("MenuHighlight")};
          color : ${this.getDefault("MenuText").color};
          -moz-user-focus: normal;
        }
      `;
    }
     setCSS() {
      super.setCSS();
      this.buildStyle();
      this.container.style["color"] = this.getDefault("MenuText").color;
      this.style["color"] = this.getDefault("MenuText").color;
    }
     seperator() {
      let bar=document.createElement("div");
      bar.setAttribute("class", "menuseparator");
      this.dom.appendChild(bar);
      return this;
    }
     menu(title) {
      let ret=UIBase.createElement("menu-x");
      ret.setAttribute("name", title);
      this.addItem(ret);
      return ret;
    }
     calcSize() {

    }
  }
  _ESClass.register(Menu);
  _es6_module.add_class(Menu);
  Menu = _es6_module.add_export('Menu', Menu);
  Menu.SEP = Symbol("menu seperator");
  UIBase.internalRegister(Menu);
  class DropBox extends OldButton {
     constructor() {
      super();
      this._template = undefined;
      this._searchMenuMode = false;
      this.altKey = undefined;
      this._value = 0;
      this._last_datapath = undefined;
      this.r = 5;
      this._menu = undefined;
      this._auto_depress = false;
      this._onpress = this._onpress.bind(this);
    }
     init() {
      super.init();
      this.updateWidth();
    }
    get  searchMenuMode() {
      return this._searchMenuMode;
    }
    set  searchMenuMode(v) {
      this._searchMenuMode = v;
    }
     setCSS() {
      this.style["user-select"] = "none";
      this.dom.style["user-select"] = "none";
      let keys;
      if (this.getAttribute("simple")) {
          keys = ["margin-left", "margin-right", "padding-left", "padding-right"];
      }
      else {
        keys = ["margin", "margin-left", "margin-right", "margin-top", "margin-bottom", "padding", "padding-left", "padding-right", "padding-top", "padding-bottom"];
      }
      let setDefault=(key) =>        {
        if (this.hasDefault(key)) {
            this.dom.style[key] = this.getDefault(key, undefined, 0)+"px";
        }
      };
      for (let k of keys) {
          setDefault(k);
      }
    }
     _genLabel() {
      let s=super._genLabel();
      let ret="";
      if (s.length===0) {
          s = "(error)";
      }
      this.altKey = s[0].toUpperCase().charCodeAt(0);
      for (let i=0; i<s.length; i++) {
          if (s[i]==="&"&&i<s.length-1&&s[i+1]!=="&") {
              this.altKey = s[i+1].toUpperCase().charCodeAt(0);
          }
          else 
            if (s[i]==="&"&&i<s.length-1&&s[i+1]==="&") {
              continue;
          }
          else {
            ret+=s[i];
          }
      }
      return ret;
    }
     updateWidth() {
      let dpi=this.getDPI();
      let ts=this.getDefault("DefaultText").size;
      let tw=this.g.measureText(this._genLabel()).width/dpi;
      tw = ~~tw;
      tw+=15;
      if (!this.getAttribute("simple")) {
          tw+=35;
      }
      if (tw!==this._last_w) {
          this._last_w = tw;
          this.dom.style["width"] = tw+"px";
          this.style["width"] = tw+"px";
          this.width = tw;
          this.overrideDefault("width", tw);
          this._repos_canvas();
          this._redraw();
      }
      return 0;
    }
     updateDataPath() {
      if (!this.ctx||!this.hasAttribute("datapath")) {
          return ;
      }
      let prop=this.getPathMeta(this.ctx, this.getAttribute("datapath"));
      let val=this.getPathValue(this.ctx, this.getAttribute("datapath"));
      if (!prop) {
          return ;
      }
      if (this.prop===undefined) {
          this.prop = prop;
      }
      if (val===undefined) {
          this.internalDisabled = true;
          return ;
      }
      else {
        this.internalDisabled = false;
      }
      prop = this.prop;
      let name=this.getAttribute("name");
      if (prop.type&(PropTypes.ENUM|PropTypes.FLAG)) {
          name = prop.ui_value_names[prop.keys[val]];
      }
      else {
        name = ""+val;
      }
      if (name!==this.getAttribute("name")) {
          this.setAttribute("name", name);
          this.updateName();
      }
    }
     update() {
      let path=this.getAttribute("datapath");
      if (path&&path!==this._last_datapath) {
          this._last_datapath = path;
          this.prop = undefined;
          this.updateDataPath();
      }
      super.update();
      let key=this.getDefault("dropTextBG");
      if (key!==this._last_dbox_key) {
          this._last_dbox_key = key;
          this.setCSS();
          this._redraw();
      }
      if (this.hasAttribute("datapath")) {
          this.updateDataPath();
      }
    }
    set  template(v) {
      this._template = v;
    }
    get  template() {
      return this._template;
    }
     _build_menu_template() {
      if (this._menu!==undefined&&this._menu.parentNode!==undefined) {
          this._menu.remove();
      }
      let template=this._template;
      if (typeof template==="function") {
          template = template();
      }
      this._menu = createMenu(this.ctx, "", template);
      return this._menu;
    }
     _build_menu() {
      if (this._template) {
          this._build_menu_template();
          return ;
      }
      let prop=this.prop;
      if (this.prop===undefined) {
          return ;
      }
      if (this._menu!==undefined&&this._menu.parentNode!==undefined) {
          this._menu.remove();
      }
      let menu=this._menu = UIBase.createElement("menu-x");
      menu.setAttribute("name", "");
      menu._dropbox = this;
      let valmap={};
      let enummap=prop.values;
      let iconmap=prop.iconmap;
      let uimap=prop.ui_value_names;
      let desr=prop.descriptions||{};
      for (let k in enummap) {
          let uk=k;
          valmap[enummap[k]] = k;
          if (uimap!==undefined&&k in uimap) {
              uk = uimap[k];
          }
          let tooltip=desr[k];
          if (iconmap&&iconmap[k]) {
              menu.addItemExtra(uk, enummap[k], undefined, iconmap[k], undefined, tooltip);
          }
          else {
            menu.addItem(uk, enummap[k], undefined, tooltip);
          }
      }
      menu.onselect = (id) =>        {
        this._pressed = false;
        this._pressed = false;
        this._redraw();
        this._menu = undefined;
        let callProp=true;
        if (this.hasAttribute("datapath")) {
            let prop=this.getPathMeta(this.ctx, this.getAttribute("datapath"));
            callProp = !prop||prop!==this.prop;
        }
        this._value = this._convertVal(id);
        if (callProp) {
            this.prop.setValue(id);
        }
        this.setAttribute("name", this.prop.ui_value_names[valmap[id]]);
        if (this.onselect) {
            this.onselect(id);
        }
        if (this.hasAttribute("datapath")&&this.ctx) {
            this.setPathValue(this.ctx, this.getAttribute("datapath"), id);
        }
      };
    }
     _onpress(e) {
      if (this._menu!==undefined) {
          this._pressed = false;
          this._redraw();
          let menu=this._menu;
          this._menu = undefined;
          menu.close();
          return ;
      }
      this._build_menu();
      if (this._menu===undefined) {
          return ;
      }
      this._menu.autoSearchMode = false;
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
      };
      let menu=this._menu;
      let screen=this.getScreen();
      let dpi=this.getDPI();
      let x=e.x, y=e.y;
      let rects=this.dom.getBoundingClientRect();
      x = rects.x-window.scrollX;
      y = rects.y+rects.height-window.scrollY;
      if (!window.haveElectron) {
      }
      let con=this._popup = menu._popup = screen.popup(this, x, y, false, 0);
      con.noMarginsOrPadding();
      con.add(menu);
      if (this.searchMenuMode) {
          menu.startFancy();
      }
      else {
        menu.start();
      }
    }
     _redraw() {
      if (this.getAttribute("simple")) {
          let color;
          if (this._highlight) {
              ui_base.drawRoundBox2(this, {canvas: this.dom, 
         g: this.g, 
         color: this.getDefault("BoxHighlight")});
          }
          if (this._focus) {
              ui_base.drawRoundBox2(this, {canvas: this.dom, 
         g: this.g, 
         color: this.getDefault("BoxHighlight"), 
         op: "stroke", 
         no_clear: true});
              ui_base.drawRoundBox(this, this.dom, this.g, undefined, undefined, 2, "stroke");
          }
          this._draw_text();
          return ;
      }
      super._redraw(false);
      let g=this.g;
      let w=this.dom.width, h=this.dom.height;
      let dpi=this.getDPI();
      let p=10*dpi;
      let p2=dpi;
      let bg=this.getDefault("dropTextBG");
      if (bg!==undefined) {
          g.fillStyle = bg;
          g.beginPath();
          g.rect(p2, p2, this.dom.width-p2-h, this.dom.height-p2*2);
          g.fill();
      }
      g.fillStyle = "rgba(50, 50, 50, 0.2)";
      g.strokeStyle = "rgba(50, 50, 50, 0.8)";
      g.beginPath();
      let sz=0.3;
      g.moveTo(w-h*0.5-p, p);
      g.lineTo(w-p, p);
      g.moveTo(w-h*0.5-p, p+sz*h/3);
      g.lineTo(w-p, p+sz*h/3);
      g.moveTo(w-h*0.5-p, p+sz*h*2/3);
      g.lineTo(w-p, p+sz*h*2/3);
      g.lineWidth = 1;
      g.stroke();
      this._draw_text();
    }
    set  menu(val) {
      this._menu = val;
      if (val!==undefined) {
          this._name = val.title;
          this.updateName();
      }
    }
     _convertVal(val) {
      if (typeof val==="string"&&this.prop) {
          if (val in this.prop.values) {
              return this.prop.values[val];
          }
          else 
            if (val in this.prop.keys) {
              return this.prop.keys[val];
          }
          else {
            return undefined;
          }
      }
      return val;
    }
    get  value() {
      return this._value;
    }
    set  value(v) {
      this.setValue(v);
    }
     setValue(val, setLabelOnly=false) {
      if (val===undefined||val===this._value) {
          return ;
      }
      val = this._convertVal(val);
      if (val===undefined) {
          console.warn("Bad val", arguments[0]);
          return ;
      }
      this._value = val;
      if (this.prop!==undefined&&!setLabelOnly) {
          this.prop.setValue(val);
          let val2=val;
          if (val2 in this.prop.keys)
            val2 = this.prop.keys[val2];
          val2 = this.prop.ui_value_names[val2];
          this.setAttribute("name", ""+val2);
          this._name = ""+val2;
      }
      else {
        this.setAttribute("name", ""+val);
        this._name = ""+val;
      }
      if (this.onchange&&!setLabelOnly) {
          this.onchange(val);
      }
      this.setCSS();
      this.updateDataPath();
      this._redraw();
    }
    get  menu() {
      return this._menu;
    }
    static  define() {
      return {tagname: "dropbox-x", 
     style: "dropbox"}
    }
  }
  _ESClass.register(DropBox);
  _es6_module.add_class(DropBox);
  DropBox = _es6_module.add_export('DropBox', DropBox);
  UIBase.internalRegister(DropBox);
  class MenuWrangler  {
     constructor() {
      this.screen = undefined;
      this.menustack = [];
      this.closetimer = 0;
      this.closeOnMouseUp = undefined;
      this.closereq = undefined;
      this.timer = undefined;
    }
    get  menu() {
      return this.menustack.length>0 ? this.menustack[this.menustack.length-1] : undefined;
    }
     pushMenu(menu) {
      this.spawnreq = undefined;
      if (this.menustack.length===0&&menu.closeOnMouseUp) {
          this.closeOnMouseUp = true;
      }
      this.menustack.push(menu);
    }
     popMenu(menu) {
      return this.menustack.pop();
    }
     endMenus() {
      for (let menu of this.menustack) {
          menu.close();
      }
      this.menustack = [];
    }
     searchKeyDown(e) {
      let menu=this.menu;
      e.stopPropagation();
      menu._ignoreFocusEvents = true;
      menu.textbox.focus();
      menu._ignoreFocusEvents = false;
      switch (e.keyCode) {
        case keymap["Enter"]:
          menu.click(menu.activeItem);
          break;
        case keymap["Escape"]:
          menu.close();
          break;
        case keymap["Up"]:
          menu.selectPrev(false);
          break;
        case keymap["Down"]:
          menu.selectNext(false);
          break;
      }
    }
     on_keydown(e) {
      window.menu = this.menu;
      if (this.menu===undefined) {
          return ;
      }
      if (this.menu.hasSearchBox) {
          return this.searchKeyDown(e);
      }
      let menu=this.menu;
      switch (e.keyCode) {
        case keymap["Left"]:
        case keymap["Right"]:
          if (menu._dropbox) {
              let dropbox=menu._dropbox;
              if (e.keyCode===keymap["Left"]) {
                  dropbox = dropbox.previousElementSibling;
              }
              else {
                dropbox = dropbox.nextElementSibling;
              }
              if (dropbox!==undefined&&__instance_of(dropbox, DropBox)) {
                  this.endMenus();
                  dropbox._onpress(e);
              }
          }
          break;
        case keymap["Up"]:
          menu.selectPrev();
          break;
        case keymap["Down"]:
          menu.selectNext();
          break;
        case 13:
        case 32:
          menu.click(menu.activeItem);
          break;
        case 27:
          menu.close();
          break;
      }
    }
     on_mousedown(e) {
      if (this.menu===undefined||this.screen===undefined) {
          this.closetimer = util.time_ms();
          return ;
      }
      let screen=this.screen;
      let x=e.pageX, y=e.pageY;
      let element=screen.pickElement(x, y);
      if (element!==undefined&&(__instance_of(element, DropBox)||util.isMobile())) {
          this.endMenus();
          e.preventDefault();
          e.stopPropagation();
      }
    }
     on_mouseup(e) {
      if (this.menu===undefined||this.screen===undefined) {
          this.closetimer = util.time_ms();
          return ;
      }
      let screen=this.screen;
      let x=e.pageX, y=e.pageY;
      let element=screen.pickElement(x, y, undefined, undefined, DropBox);
      if (element!==undefined) {
          this.closeOnMouseUp = false;
      }
      else {
        element = screen.pickElement(x, y, undefined, undefined, Menu);
        if (element&&this.closeOnMouseUp) {
            element.click();
        }
      }
    }
     findMenu(x, y) {
      let screen=this.screen;
      let element=screen.pickElement(x, y);
      if (element===undefined) {
          return ;
      }
      if (__instance_of(element, Menu)) {
          return element;
      }
      let w=element;
      while (w) {
        if (__instance_of(w, Menu)) {
            return w;
            break;
        }
        w = w.parentWidget;
      }
      return undefined;
    }
     on_mousemove(e) {
      if (this.menu&&this.menu.hasSearchBox) {
          this.closetimer = util.time_ms();
          this.closereq = undefined;
          return ;
      }
      if (this.menu===undefined||this.screen===undefined) {
          this.closetimer = util.time_ms();
          this.closereq = undefined;
          return ;
      }
      let screen=this.screen;
      let x=e.pageX, y=e.pageY;
      let element;
      let menu=this.menu;
      if (menu) {
          let r=menu.getBoundingClientRect();
          let pad=15;
          if (r&&x>=r.x-pad&&y>=r.y-pad&&x<=r.x+r.width+pad*2&&y<=r.y+r.height+pad*2) {
              element = menu;
          }
      }
      if (!element) {
          element = screen.pickElement(x, y);
      }
      if (element===undefined) {
          return ;
      }
      if (__instance_of(element, Menu)) {
          this.closetimer = util.time_ms();
          this.closereq = undefined;
          return ;
      }
      if (__instance_of(element, DropBox)&&element.menu!==this.menu&&element.getAttribute("simple")) {
          this.endMenus();
          this.closetimer = util.time_ms();
          this.closereq = undefined;
          element._onpress(e);
          return ;
      }
      let ok=false;
      let w=element;
      while (w) {
        if (__instance_of(w, Menu)) {
            ok = true;
            break;
        }
        if (__instance_of(w, DropBox)&&w._menu===this.menu) {
            ok = true;
            break;
        }
        w = w.parentWidget;
      }
      if (!ok) {
          this.closereq = this.menu;
      }
      else {
        this.closetimer = util.time_ms();
        this.closereq = undefined;
      }
    }
     update() {
      let closetime=cconst.menu_close_time;
      closetime = closetime===undefined ? 50 : closetime;
      let close=this.closereq&&this.closereq===this.menu;
      close = close&&util.time_ms()-this.closetimer>closetime;
      if (close) {
          this.closereq = undefined;
          this.endMenus();
      }
    }
     startTimer() {
      if (this.timer) {
          this.stopTimer();
      }
      this.timer = setInterval(() =>        {
        this.update();
      }, 150);
    }
     stopTimer() {
      if (this.timer) {
          clearInterval(this.timer);
          this.timer = undefined;
      }
    }
  }
  _ESClass.register(MenuWrangler);
  _es6_module.add_class(MenuWrangler);
  MenuWrangler = _es6_module.add_export('MenuWrangler', MenuWrangler);
  let menuWrangler=new MenuWrangler();
  menuWrangler = _es6_module.add_export('menuWrangler', menuWrangler);
  let wrangerStarted=false;
  function startMenuEventWrangling(screen) {
    menuWrangler.screen = screen;
    if (wrangerStarted) {
        return ;
    }
    wrangerStarted = true;
    for (let k in DomEventTypes) {
        if (menuWrangler[k]===undefined) {
            continue;
        }
        let dom=k.search("key")>=0 ? window : document.body;
        dom = window;
        dom.addEventListener(DomEventTypes[k], menuWrangler[k].bind(menuWrangler), {passive: false, 
      capture: true});
    }
    menuWrangler.screen = screen;
    menuWrangler.startTimer();
  }
  startMenuEventWrangling = _es6_module.add_export('startMenuEventWrangling', startMenuEventWrangling);
  function setWranglerScreen(screen) {
    startMenuEventWrangling(screen);
  }
  setWranglerScreen = _es6_module.add_export('setWranglerScreen', setWranglerScreen);
  function getWranglerScreen() {
    return menuWrangler.screen;
  }
  getWranglerScreen = _es6_module.add_export('getWranglerScreen', getWranglerScreen);
  function createMenu(ctx, title, templ) {
    let menu=UIBase.createElement("menu-x");
    menu.ctx = ctx;
    menu.setAttribute("name", title);
    let SEP=menu.constructor.SEP;
    let id=0;
    let cbs={}
    let doItem=(item) =>      {
      if (item!==undefined&&__instance_of(item, Menu)) {
          menu.addItem(item);
      }
      else 
        if (typeof item=="string") {
          let def, hotkey;
          try {
            def = ctx.api.getToolDef(item);
          }
          catch (error) {
              menu.addItem("(tool path error)", id++);
              return ;
          }
          if (!def.hotkey) {
              try {
                hotkey = ctx.api.getToolPathHotkey(ctx, item);
              }
              catch (error) {
                  util.print_stack(error);
                  console.warn("error getting hotkey for tool "+item);
                  hotkey = undefined;
              }
          }
          else {
            hotkey = def.hotkey;
          }
          menu.addItemExtra(def.uiname, id, hotkey, def.icon);
          cbs[id] = (function (toolpath) {
            return function () {
              ctx.api.execTool(ctx, toolpath);
            }
          })(item);
          id++;
      }
      else 
        if (item===SEP) {
          menu.seperator();
      }
      else 
        if (typeof item==="function"||__instance_of(item, Function)) {
          doItem(item());
      }
      else 
        if (__instance_of(item, Array)) {
          let hotkey=item.length>2 ? item[2] : undefined;
          let icon=item.length>3 ? item[3] : undefined;
          let tooltip=item.length>4 ? item[4] : undefined;
          let id2=item.length>5 ? item[5] : id++;
          if (hotkey!==undefined&&__instance_of(hotkey, HotKey)) {
              hotkey = hotkey.buildString();
          }
          menu.addItemExtra(item[0], id2, hotkey, icon, undefined, tooltip);
          cbs[id2] = (function (cbfunc, arg) {
            return function () {
              cbfunc(arg);
            }
          })(item[1], id2);
      }
      else 
        if (typeof item==="object") {
          let $_t0fotj=item, name=$_t0fotj.name, callback=$_t0fotj.callback, hotkey=$_t0fotj.hotkey, icon=$_t0fotj.icon, tooltip=$_t0fotj.tooltip;
          let id2=item.id!==undefined ? item.id : id++;
          if (hotkey!==undefined&&__instance_of(hotkey, HotKey)) {
              hotkey = hotkey.buildString();
          }
          menu.addItemExtra(name, id2, hotkey, icon, undefined, tooltip);
          cbs[id2] = (function (cbfunc, arg) {
            return function () {
              cbfunc(arg);
            }
          })(callback, id2);
      }
    }
    for (let item of templ) {
        doItem(item);
    }
    menu.onselect = (id) =>      {
      cbs[id]();
    }
    return menu;
  }
  createMenu = _es6_module.add_export('createMenu', createMenu);
  function startMenu(menu, x, y, searchMenuMode, safetyDelay) {
    if (searchMenuMode===undefined) {
        searchMenuMode = false;
    }
    if (safetyDelay===undefined) {
        safetyDelay = 55;
    }
    let screen=menu.ctx.screen;
    let con=menu._popup = screen.popup(undefined, x, y, false, safetyDelay);
    con.noMarginsOrPadding();
    con.add(menu);
    if (searchMenuMode) {
        menu.startFancy();
    }
    else {
      menu.start();
    }
  }
  startMenu = _es6_module.add_export('startMenu', startMenu);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_menu.js');


es6_module_define('ui_noteframe', ["../core/ui_base.js", "../core/ui.js", "../path-controller/util/util.js"], function _ui_noteframe_module(_es6_module) {
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var ui=es6_import(_es6_module, '../core/ui.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var Icons=es6_import_item(_es6_module, '../core/ui_base.js', 'Icons');
  var css2color=es6_import_item(_es6_module, '../core/ui_base.js', 'css2color');
  var color2css=es6_import_item(_es6_module, '../core/ui_base.js', 'color2css');
  let UIBase=ui_base.UIBase;
  class Note extends ui_base.UIBase {
     constructor() {
      super();
      let style=document.createElement("style");
      this._noteid = undefined;
      this.height = 20;
      this.showExclMark = true;
      style.textContent = `
    .notex {
      display : flex;
      flex-direction : row;
      flex-wrap : nowrap;
      height : {this.height}px;
      padding : 0px;
      margin : 0px;
    }
    `;
      this.dom = document.createElement("div");
      this.dom.setAttribute("class", "notex");
      this.color = "red";
      this.shadow.appendChild(style);
      this.shadow.append(this.dom);
      this.setLabel("");
    }
    static  define() {
      return {tagname: "note-x", 
     style: 'notification'}
    }
     setLabel(s) {
      let color=this.color;
      if (this.showExclMark&&this.mark===undefined) {
          this.mark = document.createElement("div");
          this.mark.style["display"] = "flex";
          this.mark.style["flex-direction"] = "row";
          this.mark.style["flex-wrap"] = "nowrap";
          let sheet=0;
          let size=ui_base.iconmanager.getTileSize(sheet);
          this.mark.style["width"] = ""+size+"px";
          this.mark.style["height"] = ""+size+"px";
          this.dom.appendChild(this.mark);
          this.ntext = document.createElement("div");
          this.ntext.style["display"] = "inline-flex";
          this.ntext.style["flex-wrap"] = "nowrap";
          this.dom.appendChild(this.ntext);
          ui_base.iconmanager.setCSS(Icons.NOTE_EXCL, this.mark, sheet);
      }
      else 
        if (!this.showExclMark&&this.mark) {
          this.mark.remove();
          this.mark = undefined;
      }
      let ntext=this.ntext;
      ntext.innerText = " "+s;
    }
     init() {
      super.init();
      this.setAttribute("class", "notex");
      this.style["display"] = "flex";
      this.style["flex-wrap"] = "nowrap";
      this.style["flex-direction"] = "row";
      this.style["border-radius"] = "7px";
      this.style["padding"] = "2px";
      this.style["color"] = this.getDefault("DefaultText").color;
      let clr=css2color(this.color);
      clr = color2css([clr[0], clr[1], clr[2], 0.25]);
      this.style["background-color"] = clr;
      this.setCSS();
    }
  }
  _ESClass.register(Note);
  _es6_module.add_class(Note);
  Note = _es6_module.add_export('Note', Note);
  UIBase.internalRegister(Note);
  class ProgBarNote extends Note {
     constructor() {
      super();
      this._percent = 0.0;
      this.barWidth = 100;
      let bar=this.bar = document.createElement("div");
      bar.style["display"] = "flex";
      bar.style["flex-direction"] = "row";
      bar.style["width"] = this.barWidth+"px";
      bar.style["height"] = this.height+"px";
      bar.style["background-color"] = this.getDefault("ProgressBarBG");
      bar.style["border-radius"] = "12px";
      bar.style["align-items"] = "center";
      bar.style["padding"] = bar.style["margin"] = "0px";
      let bar2=this.bar2 = document.createElement("div");
      let w=50.0;
      bar2.style["display"] = "flex";
      bar2.style["flex-direction"] = "row";
      bar2.style["height"] = this.height+"px";
      bar2.style["background-color"] = this.getDefault("ProgressBar");
      bar2.style["border-radius"] = "12px";
      bar2.style["align-items"] = "center";
      bar2.style["padding"] = bar2.style["margin"] = "0px";
      this.bar.appendChild(bar2);
      this.dom.appendChild(this.bar);
    }
    get  percent() {
      return this._percent;
    }
    set  percent(val) {
      this._percent = val;
      this.setCSS();
    }
    static  define() {
      return {tagname: "note-progress-x", 
     style: 'notification'}
    }
     setCSS() {
      super.setCSS();
      let w=~~(this.percent*this.barWidth+0.5);
      this.bar2.style["width"] = w+"px";
    }
     init() {
      super.init();
    }
  }
  _ESClass.register(ProgBarNote);
  _es6_module.add_class(ProgBarNote);
  ProgBarNote = _es6_module.add_export('ProgBarNote', ProgBarNote);
  UIBase.internalRegister(ProgBarNote);
  class NoteFrame extends ui.RowFrame {
     constructor() {
      super();
      this._h = 20;
    }
    static  define() {
      return {tagname: "noteframe-x", 
     style: 'noteframe'}
    }
     init() {
      super.init();
      this.noMarginsOrPadding();
      noteframes.push(this);
      this.background = this.getDefault("background-color");
      this.style['flex-grow'] = 'unset';
    }
     setCSS() {
      super.setCSS();
      this.style["width"] = "min-contents";
      this.style["height"] = this._h+"px";
    }
     _ondestroy() {
      if (noteframes.indexOf(this)>=0) {
          noteframes.remove(this);
      }
      super._ondestroy();
    }
     progbarNote(msg, percent, color="rgba(255,0,0,0.2)", timeout=700, id=msg) {
      let note;
      for (let child of this.children) {
          if (child._noteid===id) {
              note = child;
              break;
          }
      }
      let f=(100.0*Math.min(percent, 1.0)).toFixed(1);
      if (note===undefined) {
          note = this.addNote(msg, color, -1, "note-progress-x");
          note._noteid = id;
      }
      note.percent = percent;
      if (percent>=1.0) {
          window.setTimeout(() =>            {
            note.remove();
          }, timeout);
      }
      return note;
    }
     addNote(msg, color="rgba(255,0,0,0.2)", timeout=1200, tagname="note-x", showExclMark=true) {
      let note=UIBase.createElement(tagname);
      note.color = color;
      note.setLabel(msg);
      note.style["text-align"] = "center";
      note.style["font"] = ui_base.getFont(note, "DefaultText");
      note.style["color"] = this.getDefault("DefaultText").color;
      note.showExclMark = showExclMark;
      this.add(note);
      this.noMarginsOrPadding();
      note.noMarginsOrPadding();
      note.style["height"] = this._h+"px";
      note.height = this._h;
      if (timeout!==-1) {
          window.setTimeout(() =>            {
            note.remove();
          }, timeout);
      }
      return note;
    }
  }
  _ESClass.register(NoteFrame);
  _es6_module.add_class(NoteFrame);
  NoteFrame = _es6_module.add_export('NoteFrame', NoteFrame);
  UIBase.internalRegister(NoteFrame);
  function getNoteFrames(screen) {
    let ret=[];
    let rec=(n) =>      {
      if (__instance_of(n, NoteFrame)) {
          ret.push(n);
      }
      if (n.childNodes!==undefined) {
          for (let node of n.childNodes) {
              rec(node);
          }
      }
      if (__instance_of(n, ui_base.UIBase)&&n.shadow!==undefined&&n.shadow.childNodes) {
          for (let node of n.shadow.childNodes) {
              rec(node);
          }
      }
    }
    rec(screen);
    return ret;
  }
  getNoteFrames = _es6_module.add_export('getNoteFrames', getNoteFrames);
  let noteframes=[];
  noteframes = _es6_module.add_export('noteframes', noteframes);
  function progbarNote(screen, msg, percent, color, timeout) {
    noteframes = getNoteFrames(screen);
    for (let frame of noteframes) {
        try {
          frame.progbarNote(msg, percent, color, timeout);
        }
        catch (error) {
            print_stack(error);
            console.log(error.stack, error.message);
            console.log("bad notification frame");
        }
    }
  }
  progbarNote = _es6_module.add_export('progbarNote', progbarNote);
  function sendNote(screen, msg, color, timeout, showExclMark) {
    if (timeout===undefined) {
        timeout = 3000;
    }
    if (showExclMark===undefined) {
        showExclMark = true;
    }
    noteframes = getNoteFrames(screen);
    for (let frame of noteframes) {
        try {
          frame.addNote(msg, color, timeout, undefined, showExclMark);
        }
        catch (error) {
            print_stack(error);
            console.log(error.stack, error.message);
            console.log("bad notification frame");
        }
    }
  }
  sendNote = _es6_module.add_export('sendNote', sendNote);
  window._sendNote = sendNote;
  function error(screen, msg, timeout) {
    return sendNote(screen, msg, ui_base.color2css([1.0, 0.0, 0.0, 1.0]), timeout);
  }
  error = _es6_module.add_export('error', error);
  function warning(screen, msg, timeout) {
    return sendNote(screen, msg, ui_base.color2css([0.78, 0.78, 0.2, 1.0]), timeout);
  }
  warning = _es6_module.add_export('warning', warning);
  function message(screen, msg, timeout) {
    return sendNote(screen, msg, ui_base.color2css([0.2, 0.9, 0.1, 1.0]), timeout, false);
  }
  message = _es6_module.add_export('message', message);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_noteframe.js');


es6_module_define('ui_numsliders', ["../path-controller/util/vectormath.js", "../path-controller/toolsys/toolprop.js", "../core/ui.js", "../core/ui_base.js", "../core/units.js", "../path-controller/util/simple_events.js", "./ui_widgets.js", "../config/const.js", "../path-controller/util/util.js"], function _ui_numsliders_module(_es6_module) {
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var drawText=es6_import_item(_es6_module, '../core/ui_base.js', 'drawText');
  var ValueButtonBase=es6_import_item(_es6_module, './ui_widgets.js', 'ValueButtonBase');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var units=es6_import(_es6_module, '../core/units.js');
  var Vector2=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector2');
  var ColumnFrame=es6_import_item(_es6_module, '../core/ui.js', 'ColumnFrame');
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var PropTypes=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'PropTypes');
  var isNumber=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'isNumber');
  var PropSubTypes=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'PropSubTypes');
  var PropFlags=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'PropFlags');
  var pushModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'popModalLight');
  var KeyMap=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'KeyMap');
  var keymap=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'keymap');
  const sliderDomAttributes=new Set(["min", "max", "integer", "displayUnit", "baseUnit", "labelOnTop", "radix", "step", "expRate", "stepIsRelative", "decimalPlaces"]);
  _es6_module.add_export('sliderDomAttributes', sliderDomAttributes);
  function updateSliderFromDom(dom, slider) {
    if (slider===undefined) {
        slider = dom;
    }
    let redraw=false;
    function getbool(attr, prop) {
      if (prop===undefined) {
          prop = attr;
      }
      if (!dom.hasAttribute(attr)) {
          return ;
      }
      let v=dom.getAttribute(attr);
      let ret=v===null||v.toLowerCase()==="true"||v.toLowerCase==="yes";
      let old=slider[prop];
      if (old!==undefined&&old!==ret) {
          redraw = true;
      }
      slider[prop] = ret;
      return ret;
    }
    function getfloat(attr, prop) {
      if (prop===undefined) {
          prop = attr;
      }
      if (!dom.hasAttribute(attr)) {
          return ;
      }
      let v=dom.getAttribute(attr);
      let ret=parseFloat(v);
      let old=slider[prop];
      if (old!==undefined&&Math.abs(old-v)<1e-05) {
          redraw = true;
      }
      slider[prop] = ret;
      return ret;
    }
    function getint(attr, prop) {
      if (prop===undefined) {
          prop = attr;
      }
      if (!dom.hasAttribute(attr)) {
          return ;
      }
      let v=(""+dom.getAttribute(attr)).toLowerCase();
      let ret;
      if (v==="true") {
          ret = true;
      }
      else 
        if (v==="false") {
          ret = false;
      }
      else {
        ret = parseInt(v);
      }
      if (isNaN(ret)) {
          console.error("bad value "+v);
          return 0.0;
      }
      let old=slider[prop];
      if (old!==undefined&&Math.abs(old-v)<1e-05) {
          redraw = true;
      }
      slider[prop] = ret;
      return ret;
    }
    if (dom.hasAttribute("min")) {
        slider.range = slider.range||[-1e+17, 1e+17];
        let r=slider.range[0];
        slider.range[0] = parseFloat(dom.getAttribute("min"));
        redraw = Math.abs(slider.range[0]-r)>0.0001;
    }
    if (dom.hasAttribute("max")) {
        slider.range = slider.range||[-1e+17, 1e+17];
        let r=slider.range[1];
        slider.range[1] = parseFloat(dom.getAttribute("max"));
        redraw = redraw||Math.abs(slider.range[1]-r)>0.0001;
    }
    if (dom.hasAttribute("displayUnit")) {
        let old=slider.displayUnit;
        slider.displayUnit = dom.getAttribute("displayUnit").trim();
        redraw = redraw||old!==slider.displayUnit;
    }
    getint("integer", "isInt");
    getint("radix");
    getint("decimalPlaces");
    getbool("labelOnTop");
    getbool("stepIsRelative");
    getfloat("expRate");
    getfloat("step");
    return redraw;
  }
  class NumSlider extends ValueButtonBase {
     constructor() {
      super();
      this._last_label = undefined;
      this.mdown = false;
      this._name = "";
      this._step = 0.1;
      this._value = 0.0;
      this._expRate = 1.333;
      this.decimalPlaces = 4;
      this.radix = 10;
      this.vertical = false;
      this._last_disabled = false;
      this.range = [-1e+17, 1e+17];
      this.isInt = false;
      this.editAsBaseUnit = undefined;
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
    get  value() {
      return this._value;
    }
    set  value(val) {
      this.setValue(val, true, false);
    }
    static  define() {
      return {tagname: "numslider-x", 
     style: "numslider", 
     parentStyle: "button"}
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
      this.isInt = prop.type===PropTypes.INT;
      if (prop.step) {
          this._step = prop.getStep(rdef.value);
      }
      if (prop.decimalPlaces!==undefined) {
          this.decimalPlaces = prop.decimalPlaces;
      }
      if (prop.baseUnit!==undefined) {
          this.baseUnit = prop.baseUnit;
      }
      if (this.editAsBaseUnit===undefined) {
          if (prop.flag&PropFlags.EDIT_AS_BASE_UNIT) {
              this.editAsBaseUnit = true;
          }
          else {
            this.editAsBaseUnit = false;
          }
      }
      if (prop.displayUnit!==undefined) {
          this.displayUnit = prop.displayUnit;
      }
      super.updateDataPath();
    }
     update() {
      if (!!this._last_disabled!==!!this.disabled) {
          this._last_disabled = !!this.disabled;
          this._redraw();
          this.setCSS();
      }
      super.update();
      this.updateDataPath();
      updateSliderFromDom(this);
    }
     swapWithTextbox() {
      let tbox=UIBase.createElement("textbox-x");
      tbox.ctx = this.ctx;
      tbox._init();
      tbox.decimalPlaces = this.decimalPlaces;
      tbox.isInt = this.isInt;
      tbox.editAsBaseUnit = this.editAsBaseUnit;
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
              let displayUnit=this.editAsBaseUnit ? undefined : this.displayUnit;
              val = units.parseValue(val, this.baseUnit, displayUnit);
            }
            if (isNaN(val)) {
                console.log("Text input error", val, tbox.text.trim(), this.isInt);
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
        if (e.button===0&&e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            this.swapWithTextbox();
        }
        else 
          if (!e.button) {
            this.dragStart(e);
            this.mdown = true;
            e.preventDefault();
            e.stopPropagation();
        }
      };
      let onmouseup=this._on_click = (e) =>        {
        this.mdown = false;
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
            let szmargin=Math.min(sz*8.0, r.width*0.4);
            if (x<szmargin) {
                this.setValue(v-step);
            }
            else 
              if (x>r.width-szmargin) {
                this.setValue(v+step);
            }
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
      this.addEventListener("blur", (e) =>        {
        this.mdown = false;
      });
      this.addEventListener("mouseout", (e) =>        {
        if (this.disabled)
          return ;
        this.dom._background = this.getDefault("background-color");
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
      let sumdelta=0;
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
          sumdelta+=Math.abs(dx);
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
          let dpi=UIBase.getDPI();
          let limit=cconst.numSliderArrowLimit;
          limit = limit===undefined ? 6 : limit;
          limit*=dpi;
          let dv=this.vertical ? starty-e.y : startx-e.x;
          this.undoBreakPoint();
          cancel(false);
          if (sumdelta<limit) {
              this._on_click(e);
          }
          e.preventDefault();
          e.stopPropagation();
        }, 
     on_mouseout: (e) =>          {
          last_background = this.getDefault("background-color");
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
        this.popModal();
      };
    }
     setCSS() {
      let dpi=this.getDPI();
      let ts=this.getDefault("DefaultText").size*UIBase.getDPI();
      let dd=this.isInt ? 5 : this.decimalPlaces+8;
      let label=this._genLabel();
      let tw=ui_base.measureText(this, label, {size: ts, 
     font: this.getDefault("DefaultText")}).width/dpi;
      tw = Math.max(tw+this._getArrowSize()*0, this.getDefault("width"));
      tw+=ts;
      tw = ~~tw;
      if (this.vertical) {
          this.style["width"] = this.dom.style["width"] = this.getDefault("height")+"px";
          this.style["height"] = tw+"px";
          this.dom.style["height"] = tw+"px";
      }
      else {
        this.style["height"] = this.dom.style["height"] = this.getDefault("height")+"px";
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
        if (this.isInt) {
            val = Math.floor(val);
        }
        val = units.buildString(val, this.baseUnit, this.decimalPlaces, this.displayUnit);
        text = val;
        if (this._name) {
            text = this._name+": "+text;
        }
      }
      return text;
    }
     _redraw() {
      let g=this.g;
      let canvas=this.dom;
      let dpi=this.getDPI();
      let disabled=this.disabled;
      let r=this.getDefault("border-radius");
      if (this.isInt) {
          r*=0.25;
      }
      let boxbg=this.getDefault("background-color");
      ui_base.drawRoundBox(this, this.dom, this.g, undefined, undefined, r, "fill", disabled ? this.getDefault("DisabledBG") : boxbg);
      ui_base.drawRoundBox(this, this.dom, this.g, undefined, undefined, r, "stroke", disabled ? this.getDefault("DisabledBG") : this.getDefault("border-color"));
      r*=dpi;
      let pad=this.getDefault("padding");
      let ts=this.getDefault("DefaultText").size;
      let text=this._genLabel();
      let tw=ui_base.measureText(this, text, this.dom, this.g).width;
      let cx=ts+this._getArrowSize();
      let cy=this.dom.height/2;
      this.dom.font = undefined;
      g.save();
      let th=Math.PI*0.5;
      if (this.vertical) {
          g.rotate(th);
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
      let arrowcolor=this.getDefault("arrow-color")||"33%";
      arrowcolor = arrowcolor.trim();
      if (arrowcolor.endsWith("%")) {
          arrowcolor = arrowcolor.slice(0, arrowcolor.length-1).trim();
          let perc=parseFloat(arrowcolor)/100.0;
          let c=css2color(this.getDefault("arrow-color"));
          let f=1.0-(c[0]+c[1]+c[2])*perc;
          f = ~~(f*255);
          g.fillStyle = `rgba(${f},${f},${f},0.95)`;
      }
      else {
        g.fillStyle = arrowcolor;
      }
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
  }
  _ESClass.register(NumSlider);
  _es6_module.add_class(NumSlider);
  NumSlider = _es6_module.add_export('NumSlider', NumSlider);
  UIBase.internalRegister(NumSlider);
  class NumSliderSimpleBase extends UIBase {
     constructor() {
      super();
      this.baseUnit = undefined;
      this.displayUnit = undefined;
      this.editAsBaseUnit = undefined;
      this.canvas = document.createElement("canvas");
      this.g = this.canvas.getContext("2d");
      this.canvas.style["width"] = this.getDefault("width")+"px";
      this.canvas.style["height"] = this.getDefault("height")+"px";
      this.canvas.style["pointer-events"] = "none";
      this.highlight = false;
      this.isInt = false;
      this.shadow.appendChild(this.canvas);
      this.range = [0, 1];
      this.step = 0.1;
      this._value = 0.5;
      this._focus = false;
      this.modal = undefined;
      this._last_slider_key = '';
    }
    get  value() {
      return this._value;
    }
    set  value(val) {
      this.setValue(val);
    }
    static  define() {
      return {tagname: "numslider-simple-base-x", 
     style: "numslider_simple", 
     parentStyle: "button"}
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
      if (this.disabled) {
          return ;
      }
      if (e!==undefined) {
          this._setFromMouse(e);
      }
      let dom=window;
      let evtargs={capture: false};
      if (this.modal) {
          console.warn("Double call to _startModal!");
          return ;
      }
      let end=() =>        {
        if (this._modal===undefined) {
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
          this.undoBreakPoint();
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
        if (this.disabled) {
            return ;
        }
        e.preventDefault();
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
      let color=this.getDefault("background-color");
      let sh=~~(this.getDefault("SlideHeight")*dpi+0.5);
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.fillStyle = color;
      let y=(h-sh)*0.5;
      let r=this.getDefault("border-radius");
      r = 3;
      g.translate(0, y);
      ui_base.drawRoundBox(this, this.canvas, g, w, sh, r, "fill", color, undefined, true);
      let bcolor=this.getDefault('border-color');
      ui_base.drawRoundBox(this, this.canvas, g, w, sh, r, "stroke", bcolor, undefined, true);
      g.translate(0, -y);
      if (this.highlight===1) {
          color = this.getDefault("BoxHighlight");
      }
      else {
        color = this.getDefault("border-color");
      }
      g.strokeStyle = color;
      g.stroke();
      let co=this._getButtonPos();
      g.beginPath();
      if (this.highlight===2) {
          color = this.getDefault("BoxHighlight");
      }
      else {
        color = this.getDefault("border-color");
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
      this.canvas.style["width"] = "min-contents";
      this.canvas.style["min-width"] = this.getDefault("width")+"px";
      this.canvas.style["height"] = this.getDefault("height")+"px";
      this.canvas.height = this.getDefault("height")*UIBase.getDPI();
      this.style["min-width"] = this.getDefault("width")+"px";
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
      let key=this.getDefault("width")+this.getDefault("height")+this.getDefault("SlideHeight");
      if (key!==this._last_slider_key) {
          this._last_slider_key = key;
          this.flushUpdate();
          this.setCSS();
          this._redraw();
      }
      if (this.getAttribute("tab-index")!==this.tabIndex) {
          this.tabIndex = this.getAttribute("tab-index");
      }
      this.updateSize();
      this.updateDataPath();
      updateSliderFromDom(this);
    }
  }
  _ESClass.register(NumSliderSimpleBase);
  _es6_module.add_class(NumSliderSimpleBase);
  NumSliderSimpleBase = _es6_module.add_export('NumSliderSimpleBase', NumSliderSimpleBase);
  UIBase.internalRegister(NumSliderSimpleBase);
  class SliderWithTextbox extends ColumnFrame {
     constructor() {
      super();
      this._value = 0;
      this._name = undefined;
      this._lock_textbox = false;
      this._labelOnTop = undefined;
      this._last_label_on_top = undefined;
      this.container = this;
      this.textbox = UIBase.createElement("textbox-x");
      this.textbox.width = 55;
      this._numslider = undefined;
      this.textbox.overrideDefault("width", this.getDefault("TextBoxWidth"));
      this.textbox.setAttribute("class", "numslider_simple_textbox");
      this._last_value = undefined;
    }
    get  labelOnTop() {
      let ret=this._labelOnTop;
      if (ret===undefined&&this.hasAttribute("labelOnTop")) {
          let val=this.getAttribute("labelOnTop");
          if (typeof val==="string") {
              val = val.toLowerCase();
              ret = val==="true"||val==="yes";
          }
          else {
            ret = !!val;
          }
      }
      if (ret===undefined) {
          ret = this.getDefault("labelOnTop");
      }
      return !!ret;
    }
    set  labelOnTop(v) {
      this._labelOnTop = v;
    }
    get  numslider() {
      return this._numslider;
    }
    set  numslider(v) {
      this._numslider = v;
      this.textbox.range = this._numslider.range;
    }
    get  range() {
      return this.numslider.range;
    }
    set  range(v) {
      this.numslider.range = v;
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
          this.updateTextBox();
      }
    }
    get  realTimeTextBox() {
      let ret=this.getAttribute("realtime");
      if (!ret) {
          return false;
      }
      ret = ret.toLowerCase().trim();
      return ret==='true'||ret==='on'||ret==='yes';
    }
    set  realTimeTextBox(val) {
      this.setAttribute("realtime", val ? "true" : "false");
    }
    get  value() {
      return this._value;
    }
    set  value(val) {
      this.setValue(val);
    }
     init() {
      super.init();
      this.rebuild();
      window.setTimeout(() =>        {
        return this.updateTextBox();
      }, 500);
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
      this.l.overrideClass("numslider_textbox");
      this.l.font = "TitleText";
      this.l.style["display"] = "float";
      this.l.style["position"] = "relative";
      let strip=this.container.row();
      strip.add(this.numslider);
      let path=this.hasAttribute("datapath") ? this.getAttribute("datapath") : undefined;
      let textbox=this.textbox;
      this.textbox.overrideDefault("width", this.getDefault("TextBoxWidth"));
      let apply_textbox=() =>        {
        let text=textbox.text;
        if (!units.isNumber(text)) {
            textbox.flash("red");
            return ;
        }
        else {
          textbox.flash("green");
          let displayUnit=this.editAsBaseUnit ? undefined : this.displayUnit;
          let f=units.parseValue(text, this.baseUnit, displayUnit);
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
      if (this.realTimeTextBox) {
          textbox.onchange = apply_textbox;
      }
      textbox.onend = apply_textbox;
      textbox.ctx = this.ctx;
      textbox.packflag|=this.inherit_packflag;
      textbox.overrideDefault("width", this.getDefault("TextBoxWidth"));
      textbox.style["height"] = (this.getDefault("height")-2)+"px";
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
      updateSliderFromDom(this, this.numslider);
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
      if (!prop) {
          return ;
      }
      let val=this.getPathValue(this.ctx, this.getAttribute("datapath"));
      if (val!==this._last_value) {
          this._last_value = this._value = val;
          this.updateTextBox();
      }
      if (!this.baseUnit&&prop.baseUnit) {
          this.baseUnit = prop.baseUnit;
      }
      if (prop.decimalPlaces!==undefined) {
          this.decimalPlaces = prop.decimalPlaces;
      }
      if (this.editAsBaseUnit===undefined) {
          if (prop.flag&PropFlags.EDIT_AS_BASE_UNIT) {
              this.editAsBaseUnit = true;
          }
          else {
            this.editAsBaseUnit = false;
          }
      }
      if (!this.displayUnit&&prop.displayUnit) {
          this.displayUnit = prop.displayUnit;
      }
    }
     update() {
      this.updateLabelOnTop();
      super.update();
      this.updateDataPath();
      let redraw=false;
      updateSliderFromDom(this.numslider, this);
      updateSliderFromDom(this.textbox, this);
      if (redraw) {
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
      this.numslider = UIBase.createElement("numslider-simple-base-x");
    }
    static  define() {
      return {tagname: "numslider-simple-x", 
     style: "numslider_simple"}
    }
     _redraw() {
      this.numslider._redraw();
    }
  }
  _ESClass.register(NumSliderSimple);
  _es6_module.add_class(NumSliderSimple);
  NumSliderSimple = _es6_module.add_export('NumSliderSimple', NumSliderSimple);
  UIBase.internalRegister(NumSliderSimple);
  class NumSliderWithTextBox extends SliderWithTextbox {
     constructor() {
      super();
      this.numslider = UIBase.createElement("numslider-x");
    }
    static  define() {
      return {tagname: "numslider-textbox-x", 
     style: "numslider_textbox"}
    }
     _redraw() {
      this.numslider._redraw();
    }
  }
  _ESClass.register(NumSliderWithTextBox);
  _es6_module.add_class(NumSliderWithTextBox);
  NumSliderWithTextBox = _es6_module.add_export('NumSliderWithTextBox', NumSliderWithTextBox);
  UIBase.internalRegister(NumSliderWithTextBox);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_numsliders.js');


es6_module_define('ui_panel', ["./ui_widgets.js", "../core/ui.js", "../path-controller/util/vectormath.js", "../path-controller/util/html5_fileapi.js", "../path-controller/util/util.js", "../core/ui_base.js", "../path-controller/toolsys/toolprop.js"], function _ui_panel_module(_es6_module) {
  var CSSFont=es6_import_item(_es6_module, '../core/ui_base.js', 'CSSFont');
  var _ui=undefined;
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var vectormath=es6_import(_es6_module, '../path-controller/util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var ui_widgets=es6_import(_es6_module, './ui_widgets.js');
  var toolprop=es6_import(_es6_module, '../path-controller/toolsys/toolprop.js');
  es6_import(_es6_module, '../path-controller/util/html5_fileapi.js');
  var ColumnFrame=es6_import_item(_es6_module, '../core/ui.js', 'ColumnFrame');
  var RowFrame=es6_import_item(_es6_module, '../core/ui.js', 'RowFrame');
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  let PropFlags=toolprop.PropFlags;
  let PropSubTypes=toolprop.PropSubTypes;
  let EnumProperty=toolprop.EnumProperty;
  let Vector2=vectormath.Vector2, UIBase=ui_base.UIBase, PackFlags=ui_base.PackFlags, PropTypes=toolprop.PropTypes;
  let forward_keys=new Set(["row", "col", "strip", "noteframe", "helppicker", "vecpopup", "tabs", "table", "menu", "listbox", "panel", "pathlabel", "label", "listenum", "check", "iconcheck", "button", "iconbutton", "colorPicker", "twocol", "treeview", "slider", "simpleslider", "curve1d", "noteframe", "vecpopup", "prop", "tool", "toolPanel", "textbox", "dynamicMenu", "add", "prepend", "useIcons", "noMarginsOrPadding", "wrap"]);
  class PanelFrame extends ColumnFrame {
     constructor() {
      super();
      this.titleframe = super.row();
      this.contents = super.col();
      this.contents._remove = this.contents.remove;
      this.contents.remove = () =>        {
        this.remove();
      };
      this._panel = this;
      this.contents._panel = this;
      this.iconcheck = UIBase.createElement("iconcheck-x");
      this.iconcheck.noEmboss = true;
      Object.defineProperty(this.contents, "closed", {get: () =>          {
          return this.closed;
        }, 
     set: (v) =>          {
          this.closed = v;
        }});
      Object.defineProperty(this.contents, "title", {get: () =>          {
          return this.titleframe.getAttribute("title");
        }, 
     set: (v) =>          {
          return this.setHeaderToolTip(v);
        }});
      this.packflag = this.inherit_packflag = 0;
      this._closed = false;
      this.makeHeader();
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
     appendChild(child) {
      return this.contents.shadow.appendChild(child);
    }
    get  headerLabel() {
      return this.__label.text;
    }
    set  headerLabel(v) {
      this.__label.text = v;
      this.__label._updateFont();
      if (this.ctx) {
          this.setCSS();
      }
    }
    get  dataPrefix() {
      return this.contents ? this.contents.dataPrefix : "";
    }
    set  dataPrefix(v) {
      if (this.contents) {
          this.contents.dataPrefix = v;
      }
    }
    get  closed() {
      return this._closed;
    }
    set  closed(val) {
      let update=!!val!==!!this.closed;
      this._closed = val;
      if (update) {
          this._updateClosed(true);
      }
    }
    static  define() {
      return {tagname: "panelframe-x", 
     style: "panel", 
     subclassChecksTheme: true}
    }
     setHeaderToolTip(tooltip) {
      this.titleframe.setAttribute("title", tooltip);
      this.titleframe._forEachChildWidget((child) =>        {
        child.setAttribute("title", tooltip);
      });
    }
     saveData() {
      let ret={closed: this._closed};
      return Object.assign(super.saveData(), ret);
    }
     loadData(obj) {
      if (!("closed" in obj)) {
          this.closed = obj._closed;
      }
      else {
        this.closed = obj.closed;
      }
    }
     clear() {
      super.clear();
      super.add(this.titleframe);
    }
     makeHeader() {
      let row=this.titleframe;
      let iconcheck=this.iconcheck;
      if (!iconcheck) {
          return ;
      }
      iconcheck.overrideDefault("padding", 0);
      iconcheck.noMarginsOrPadding();
      iconcheck.overrideDefault("background-color", "rgba(0,0,0,0)");
      iconcheck.overrideDefault("BoxDepressed", "rgba(0,0,0,0)");
      iconcheck.overrideDefault("border-color", "rgba(0,0,0,0)");
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
        iconcheck.checked = !iconcheck.checked;
        e.preventDefault();
      };
      let label=this.__label = row.label(this.getAttribute("label"));
      this.__label.overrideClass("panel");
      this.__label.font = "TitleText";
      label._updateFont();
      label.noMarginsOrPadding();
      label.addEventListener("mousedown", onclick);
      label.addEventListener("touchdown", onclick);
      let bs=this.getDefault("border-style");
      row.background = this.getDefault("TitleBackground");
      row.style["border-radius"] = this.getDefault("border-radius")+"px";
      row.style["border"] = `${this.getDefault("border-width")}px ${bs} ${this.getDefault("border-color")}`;
      row.style["padding-right"] = "20px";
      row.style["padding-left"] = "5px";
      row.style["padding-top"] = this.getDefault("padding-top")+"px";
      row.style["padding-bottom"] = this.getDefault("padding-bottom")+"px";
    }
     init() {
      super.init();
      this.background = this.getDefault("background-color");
      this.style["width"] = "100%";
      this.contents.ctx = this.ctx;
      if (!this._closed) {
          super.add(this.contents);
          this.contents.flushUpdate();
      }
      this.contents.dataPrefix = this.dataPrefix;
      this.setCSS();
    }
     setCSS() {
      super.setCSS();
      if (!this.titleframe||!this.__label) {
          return ;
      }
      let getDefault=(key, defval) =>        {
        let val=this.getDefault(key);
        return val!==undefined ? val : defval;
      };
      let bs=this.getDefault("border-style");
      let header_radius=this.getDefault("HeaderRadius");
      if (header_radius===undefined) {
          header_radius = this.getDefault("border-radius");
      }
      let boxmargin=getDefault("padding", 0);
      let paddingleft=getDefault("padding-left", 0);
      let paddingright=getDefault("padding-right", 0);
      paddingleft+=boxmargin;
      paddingright+=boxmargin;
      this.titleframe.background = this.getDefault("TitleBackground");
      this.titleframe.style["border-radius"] = header_radius+"px";
      this.titleframe.style["border"] = `${this.getDefault("border-width")}px ${bs} ${this.getDefault("TitleBorder")}`;
      this.style["border"] = `${this.getDefault("border-width")}px ${bs} ${this.getDefault("border-color")}`;
      this.style["border-radius"] = this.getDefault("border-radius")+"px";
      this.titleframe.style["padding-top"] = this.getDefault("padding-top")+"px";
      this.titleframe.style["padding-bottom"] = this.getDefault("padding-bottom")+"px";
      this.titleframe.style["padding-left"] = paddingleft+"px";
      this.titleframe.style["padding-right"] = paddingright+"px";
      this.titleframe.style["margin-bottom"] = "0px";
      this.titleframe.style["margin-top"] = "0px";
      this.__label.style["border"] = "unset";
      this.__label.style["border-radius"] = "unset";
      let bg=this.getDefault("background-color");
      this.background = bg;
      this.contents.background = bg;
      this.contents.parentWidget = this;
      this.contents.style["background-color"] = bg;
      this.style["background-color"] = bg;
      let margintop, marginbottom;
      if (this._closed) {
          margintop = getDefault('margin-top-closed', 0);
          marginbottom = getDefault('margin-bottom-closed', 5);
      }
      else {
        margintop = getDefault('margin-top', 0);
        marginbottom = getDefault('margin-bottom', 0);
      }
      let marginleft=getDefault('margin-left', 0);
      let marginright=getDefault('margin-right', 0);
      this.style['margin-left'] = marginleft+"px";
      this.style['margin-right'] = marginright+"px";
      this.style['margin-top'] = margintop+"px";
      this.style['margin-bottom'] = marginbottom+"px";
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
     update() {
      let text=this.getAttribute("label");
      let update=text!==this.__label.text;
      if (this.checkThemeUpdate()) {
          update = true;
          this._setVisible(this.closed, true);
          this.setCSS();
          this.flushSetCSS();
      }
      if (update) {
          this.headerLabel = this.getAttribute("label");
          this.__label._updateFont();
          this.setCSS();
      }
      super.update();
    }
     _onchange(isClosed) {
      if (this.onchange) {
          this.onchange(isClosed);
      }
      if (this.contents.onchange) {
          this.contents.onchange(isClosed);
      }
    }
     setAttribute(key, value) {
      let ret=super.setAttribute(key, value);
      if (this.ctx) {
          this.update();
          this.flushUpdate();
      }
      return ret;
    }
    get  noUpdateClosedContents() {
      if (!this.hasAttribute("update-closed-contents")) {
          return false;
      }
      let ret=this.getAttribute("update-closed-contents");
      return ret==="true"||ret==="on";
    }
    set  noUpdateClosedContents(v) {
      this.setAttribute("update-closed-contents", v ? "true" : "false");
    }
     _setVisible(isClosed, changed) {
      changed = changed||!!isClosed!==!!this._closed;
      this._state = isClosed;
      if (isClosed) {
          this.contents.style.display = "none";
          if (!this.noUpdateClosedContents) {
              this.contents.packflag|=PackFlags.NO_UPDATE;
          }
      }
      else {
        this.contents.style.display = "flex";
        this.contents.packflag&=~PackFlags.NO_UPDATE;
        this.contents.flushUpdate();
      }
      this.contents.hidden = isClosed;
      if (this.parentWidget) {
          this.parentWidget.flushUpdate();
      }
      else {
        this.flushUpdate();
      }
      if (changed) {
          this._onchange(isClosed);
      }
    }
     _updateClosed(changed) {
      this._setVisible(this._closed, changed);
      if (this.iconcheck) {
          this.iconcheck.checked = this._closed;
      }
    }
  }
  _ESClass.register(PanelFrame);
  _es6_module.add_class(PanelFrame);
  PanelFrame = _es6_module.add_export('PanelFrame', PanelFrame);
  let makeForward=(k) =>    {
    return function () {
      return this.contents[k](...arguments);
    }
  }
  for (let k of forward_keys) {
      PanelFrame.prototype[k] = makeForward(k);
  }
  UIBase.internalRegister(PanelFrame);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_panel.js');


es6_module_define('ui_progress', ["../path-controller/util/simple_events.js", "../core/ui_base.js", "../path-controller/util/util.js"], function _ui_progress_module(_es6_module) {
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var keymap=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'keymap');
  class ProgressCircle extends UIBase {
     constructor() {
      super();
      this.canvas = document.createElement("canvas");
      this.g = this.canvas.getContext("2d");
      this.shadow.appendChild(this.canvas);
      this.size = 150;
      this.animreq = undefined;
      this._value = 0.0;
      this.startTime = util.time_ms();
    }
     init() {
      super.init();
      this.flagRedraw();
      this.update();
      this.tabIndex = 0;
      this.setAttribute("tab-index", 0);
      this.setAttribute("tabindex", 0);
      let onkey=(e) =>        {
        switch (e.keyCode) {
          case keymap["Escape"]:
            if (this.oncancel) {
                this.oncancel(this);
            }
            break;
        }
      };
      this.addEventListener("keydown", onkey);
      this.canvas.addEventListener("keydown", onkey);
    }
     flagRedraw() {
      if (this.animreq!==undefined) {
          return ;
      }
      this.animreq = requestAnimationFrame(() =>        {
        this.animreq = undefined;
        this.draw();
      });
    }
     draw() {
      let c=this.canvas, g=this.g;
      let clr1="rgb(68,69,83)";
      let clr2="rgb(141,154,196)";
      let clr3="rgb(214,110,54)";
      let t=(util.time_ms()-this.startTime)/1000.0;
      g.save();
      g.clearRect(0, 0, c.width, c.height);
      g.lineWidth/=c.width*0.5;
      g.scale(c.width, c.height);
      g.translate(0.5, 0.5);
      g.fillStyle = clr2;
      g.strokeStyle = clr1;
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, 0.45, Math.PI, -Math.PI);
      g.moveTo(0, 0);
      g.arc(0, 0, 0.2, Math.PI, -Math.PI);
      g.clip("evenodd");
      g.beginPath();
      g.arc(0, 0, 0.45, -Math.PI, Math.PI);
      g.fill();
      g.stroke();
      g.beginPath();
      g.arc(0, 0, 0.2, Math.PI, -Math.PI);
      g.stroke();
      g.beginPath();
      let th=this._value*Math.PI*2.0;
      let steps=12;
      let dth=(Math.PI*2.0)/steps;
      let lwid=g.lineWidth;
      g.lineWidth*=3;
      for (let i=0; i<steps; i++) {
          let th1=i*dth;
          th1+=t;
          let r1=0.2;
          let r2=0.45;
          let th2=th1+dth*0.5;
          g.beginPath();
          g.moveTo(Math.cos(th1)*r1, Math.sin(th1)*r1);
          g.lineTo(Math.cos(th2)*r2, Math.sin(th2)*r2);
          g.strokeStyle = "rgba(255,255,255,0.5)";
          g.stroke();
      }
      g.lineWidth = lwid;
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, 0.4, Math.PI, -Math.PI);
      g.clip("evenodd");
      g.beginPath();
      g.fillStyle = clr3;
      g.moveTo(0, 0);
      g.arc(0, 0, 0.45, 0, th);
      g.lineTo(0, 0);
      g.fill();
      g.strokeStyle = "rgb(141,154,196)";
      g.stroke();
      g.restore();
    }
    set  value(percent) {
      this._value = percent;
      this.flagRedraw();
    }
    get  value() {
      return this._value;
    }
     startTimer() {
      if (this.timer!==undefined) {
          return ;
      }
      this.focus();
      window.setInterval(() =>        {
        if (!this.isConnected) {
            this.endTimer();
            return ;
        }
        this.flagRedraw();
      }, 50);
    }
     endTimer() {
      if (this.timer!==undefined) {
          window.clearInterval(this.timer);
      }
      this.timer = undefined;
    }
     update() {
      if (!this.isConnected&&this.timer) {
          this.endTimer();
      }
      let size=~~(this.size*UIBase.getDPI());
      if (size!==this.canvas.width) {
          this.setCSS();
      }
    }
     setCSS() {
      let c=this.canvas;
      let size=~~(this.size*UIBase.getDPI());
      if (c.width!==size) {
          c.width = c.height = size;
          size/=UIBase.getDPI();
          c.style["width"] = size+"px";
          c.style["height"] = size+"px";
          c.style["display"] = "flex";
          this.style["width"] = size+"px";
          this.style["height"] = size+"px";
          this.draw();
      }
      this.style["display"] = "flex";
      this.style["align-items"] = "center";
      this.style["justify-content"] = "center";
      this.style["width"] = "100%";
      this.style["height"] = "100%";
    }
    static  define() {
      return {tagname: "progress-circle-x"}
    }
  }
  _ESClass.register(ProgressCircle);
  _es6_module.add_class(ProgressCircle);
  ProgressCircle = _es6_module.add_export('ProgressCircle', ProgressCircle);
  UIBase.register(ProgressCircle);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_progress.js');


es6_module_define('ui_richedit', ["../core/ui_base.js", "../path-controller/util/util.js", "./ui_textbox.js", "../path-controller/util/simple_events.js", "../core/ui.js"], function _ui_richedit_module(_es6_module) {
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var ColumnFrame=es6_import_item(_es6_module, '../core/ui.js', 'ColumnFrame');
  var RowFrame=es6_import_item(_es6_module, '../core/ui.js', 'RowFrame');
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  let UIBase=ui_base.UIBase, Icons=ui_base.Icons;
  var TextBoxBase=es6_import_item(_es6_module, './ui_textbox.js', 'TextBoxBase');
  var keymap=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'keymap');
  class RichEditor extends TextBoxBase {
     constructor() {
      super();
      this._internalDisabled = false;
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
      let controls=this.controls = UIBase.createElement("rowframe-x");
      let makeicon=(icon, description, cb) =>        {
        icon = controls.iconbutton(icon, description, cb);
        icon.iconsheet = 1;
        icon.overrideDefault("padding", 3);
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
      controls.background = this.getDefault("background-color");
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
        if (this.internalDisabled) {
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
    get  internalDisabled() {
      return this._internalDisabled;
    }
    set  internalDisabled(val) {
      let changed=!!this._internalDisabled!==!!val;
      if (changed||1) {
          this._internalDisabled = !!val;
          super.internalDisabled = val;
          this.textarea.internalDisabled = val;
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
      this.controls.background = this.getDefault("background-color");
      if (this._focus) {
          this.textarea.style["border"] = `2px dashed ${this.getDefault('focus-border-color')}`;
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
          this.internalDisabled = true;
          return ;
      }
      this.internalDisabled = false;
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
     style: "richtext", 
     modalKeyEvents: true}
    }
  }
  _ESClass.register(RichEditor);
  _es6_module.add_class(RichEditor);
  RichEditor = _es6_module.add_export('RichEditor', RichEditor);
  UIBase.internalRegister(RichEditor);
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
          this.internalDisabled = true;
          return ;
      }
      this.internalDisabled = false;
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
  UIBase.internalRegister(RichViewer);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_richedit.js');


es6_module_define('ui_table', ["../path-controller/util/util.js", "./ui_widgets.js", "../path-controller/toolsys/toolprop.js", "../path-controller/util/vectormath.js", "../core/ui.js", "../core/ui_base.js", "./ui_curvewidget.js"], function _ui_table_module(_es6_module) {
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  var _ui=undefined;
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var vectormath=es6_import(_es6_module, '../path-controller/util/vectormath.js');
  var ui_curvewidget=es6_import(_es6_module, './ui_curvewidget.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var ui_widgets=es6_import(_es6_module, './ui_widgets.js');
  var toolprop=es6_import(_es6_module, '../path-controller/toolsys/toolprop.js');
  let PropFlags=toolprop.PropFlags;
  let PropSubTypes=toolprop.PropSubTypes;
  let EnumProperty=toolprop.EnumProperty;
  let Vector2=vectormath.Vector2, UIBase=ui_base.UIBase, PackFlags=ui_base.PackFlags, PropTypes=toolprop.PropTypes;
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
  
  UIBase.internalRegister(TableRow);
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
     add(child) {
      this._add(child);
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
        let container=UIBase.createElement("rowframe-x");
        container.ctx = this2.ctx;
        container.parentWidget = this2;
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
  UIBase.internalRegister(TableFrame);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_table.js');


es6_module_define('ui_tabs', ["../core/ui_base.js", "../path-controller/util/vectormath.js", "../path-controller/util/util.js", "../core/ui.js", "../path-controller/util/events.js"], function _ui_tabs_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var vectormath=es6_import(_es6_module, '../path-controller/util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../path-controller/util/events.js');
  var ui=es6_import(_es6_module, '../core/ui.js');
  var loadUIData=es6_import_item(_es6_module, '../core/ui_base.js', 'loadUIData');
  var saveUIData=es6_import_item(_es6_module, '../core/ui_base.js', 'saveUIData');
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
      this.movableTabs = true;
      this.tabFontScale = 1.0;
      this.tabs = [];
      this.tabs.active = undefined;
      this.tabs.highlight = undefined;
      this._last_style_key = undefined;
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
      this.onchange = null;
      this.onselect = null;
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
        const is_mdown=e.type==="mousedown";
        if (is_mdown&&this.onselect&&this._fireOnSelect().defaultPrevented) {
            e.preventDefault();
        }
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
        const is_mdown=e.type==="touchstart";
        if (is_mdown&&this.onselect&&this._fireOnSelect().defaultPrevented) {
            e.preventDefault();
        }
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
        if (e.touches.length===0) {
            return ;
        }
        do_touch(e);
        if (e.defaultPrevented) {
            return ;
        }
        let ht=this.tabs.highlight;
        if (ht!==undefined&&this.tool===undefined) {
            this.setActive(ht);
            if (this.movableTabs) {
                let edom=this.getScreen();
                let tool=new ModalTabMove(ht, this, edom);
                this.tool = tool;
                tool.pushModal(edom, false);
            }
        }
        e.preventDefault();
        e.stopPropagation();
      }, false);
      this.canvas.addEventListener("mousedown", (e) =>        {
        do_mouse(e);
        if (e.defaultPrevented) {
            return ;
        }
        if (debug)
          console.log("mdown");
        if (e.button!==0) {
            e.preventDefault();
            return ;
        }
        let ht=this.tabs.highlight;
        if (ht!==undefined&&this.tool===undefined) {
            this.setActive(ht);
            if (this.ctx===undefined) {
                e.preventDefault();
                return ;
            }
            if (this.movableTabs) {
                let edom=this.getScreen();
                let tool=new ModalTabMove(ht, this, edom);
                this.tool = tool;
                tool.pushModal(edom, false);
            }
        }
        e.preventDefault();
        e.stopPropagation();
      }, false);
    }
    static  setDefault(e) {
      e.setAttribute("bar_pos", "top");
      e.updatePos(true);
      return e;
    }
    static  define() {
      return {tagname: "tabbar-x", 
     style: "tabs"}
    }
     _fireOnSelect() {
      let e=this._makeOnSelectEvt();
      if (this.onselect) {
          this.onselect(e);
      }
      return e;
    }
     _makeOnSelectEvt() {
      return {tab: this.tabs.highlight, 
     defaultPrevented: false, 
     preventDefault: function preventDefault() {
          this.defaultPrevented = true;
        }}
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
      if (this.tabs.length===1) {
          this.setActive(this.tabs[0]);
      }
      return tab;
    }
     updatePos(force_update=false) {
      let pos=this.getAttribute("bar_pos");
      if (pos!==this._last_pos||force_update) {
          this._last_pos = pos;
          this.horiz = pos==="top"||pos==="bottom";
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
      let width=~~(rwidth*dpi);
      let height=~~(rheight*dpi);
      let update=force_update;
      update = update||canvas.width!==width||canvas.height!==height;
      if (update) {
          canvas.width = width;
          canvas.height = height;
          this._redraw();
      }
    }
     _getFont(tsize) {
      let font=this.getDefault("TabText");
      if (this.tabFontScale!==1.0) {
          font = font.copy();
          font.size*=this.tabFontScale;
      }
      return font;
    }
     _layout() {
      if ((!this.ctx||!this.ctx.screen)&&!this.isDead()) {
          this.doOnce(this._layout);
      }
      let g=this.g;
      if (debug)
        console.log("tab layout");
      let dpi=this.getDPI();
      let font=this._getFont();
      let tsize=(font.size*dpi);
      g.font = font.genCSS(tsize);
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
              let font=this._getFont();
              tab.dom.style["font"] = font.genCSS();
              tab.dom.style["color"] = font.color;
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
      x = (~~(x+pad))/dpi;
      h = (~~h)/dpi;
      if (this.horiz) {
          this.canvas.style["width"] = x+"px";
          this.canvas.style["height"] = h+"px";
      }
      else {
        this.canvas.style["height"] = x+"px";
        this.canvas.style["width"] = h+"px";
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
      let activecolor=this.getDefault("TabActive")||"rgba(0,0,0,0)";
      if (debug)
        console.log("tab draw");
      g.clearRect(0, 0, this.canvas.width, this.canvas.height);
      let dpi=this.getDPI();
      let font=this._getFont();
      let tsize=font.size;
      let iconsize=iconmanager.getTileSize(this.iconsheet);
      tsize = (tsize*dpi);
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
          let tw=ui_base.measureText(this, tab.name, this.canvas, g, tsize, font).width;
          let x2=x+(tab.size[this.horiz^1]-tw)*0.5;
          let y2=y+tsize;
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
          let tw=ui_base.measureText(this, tab.name, this.canvas, g, tsize, font).width;
          if (this.horiz) {
              h+=2;
          }
          else {
            w+=2;
          }
          let x2=x+(tab.size[this.horiz^1]-tw)*0.5;
          let y2=y+tsize;
          if (tab===this.tabs.active) {
              g.beginPath();
              let ypad=2;
              g.strokeStyle = this.getDefault("TabStrokeStyle2");
              g.fillStyle = activecolor;
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
     setCSS() {
      super.setCSS(false);
      let r=this.getDefault("TabBarRadius");
      r = r!==undefined ? r : 3;
      this.canvas.style["background-color"] = this.getDefault("TabInactive");
      this.canvas.style["border-radius"] = r+"px";
    }
     updateStyle() {
      let key=""+this.getDefault("background-color");
      key+=this.getDefault("TabActive");
      key+=this.getDefault("TabInactive");
      key+=this.getDefault("TabBarRadius");
      key+=this.getDefault("TabStrokeStyle1");
      key+=this.getDefault("TabStrokeStyle2");
      key+=this.getDefault("TabHighlight");
      key+=JSON.stringify(this.getDefault("TabText"));
      key+=this.tabFontScale;
      if (key!==this._last_style_key) {
          this._last_style_key = key;
          this._layout();
          this.setCSS();
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
  }
  _ESClass.register(TabBar);
  _es6_module.add_class(TabBar);
  TabBar = _es6_module.add_export('TabBar', TabBar);
  UIBase.internalRegister(TabBar);
  class TabContainer extends UIBase {
     constructor() {
      super();
      this._last_style_key = "";
      this.dataPrefix = "";
      this.inherit_packflag = 0;
      this.packflag = 0;
      this.tabFontScale = 1.0;
      this.tbar = UIBase.createElement("tabbar-x");
      this.tbar.parentWidget = this;
      this.tbar.setAttribute("class", "_tbar_"+this._id);
      this.tbar.constructor.setDefault(this.tbar);
      this.tbar.tabFontScale = this.tabFontScale;
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
      this.tbar.onselect = (e) =>        {
        if (this.onselect) {
            this.onselect(e);
        }
      };
      this.tbar.onchange = (tab) =>        {
        if (this._tab) {
            HTMLElement.prototype.remove.call(this._tab);
        }
        this._tab = this.tabs[tab.id];
        this._tab.parentWidget = this;
        for (let i=0; i<2; i++) {
            this._tab.flushUpdate();
        }
        let div=document.createElement("div");
        this.tbar.setCSS.once(() =>          {
          return div.style["background-color"] = this.getDefault("background-color");
        }, div);
        div.setAttribute("class", `_tab_${this._id}`);
        div.appendChild(this._tab);
        this.shadow.appendChild(div);
        if (this.onchange) {
            this.onchange(tab);
        }
      };
    }
    get  movableTabs() {
      let attr;
      if (!this.hasAttribute("movable-tabs")) {
          attr = this.getDefault("movable-tabs");
          if (attr===undefined||attr===null) {
              attr = "true";
          }
          if (typeof attr==="boolean"||typeof attr==="number") {
              attr = attr ? "true" : "false";
          }
      }
      else {
        attr = ""+this.getAttribute("movable-tabs");
      }
      attr = attr.toLowerCase();
      return attr==="true";
    }
    set  movableTabs(val) {
      val = !!val;
      this.setAttribute("movable-tabs", val ? "true" : "false");
      this.tbar.movableTabs = this.movableTabs;
    }
    static  setDefault(e) {
      e.setAttribute("bar_pos", "top");
      return e;
    }
    static  define() {
      return {tagname: "tabcontainer-x", 
     style: "tabs"}
    }
     saveData() {
      let json=super.saveData()||{};
      json.tabs = {};
      for (let k in this.tabs) {
          let tab=this.tabs[k];
          if (k===this.tbar.tabs.active.id) {
              continue;
          }
          try {
            json.tabs[tab.id] = JSON.parse(saveUIData(tab, "tab"));
          }
          catch (error) {
              console.error("Failed to save tab UI layout", tab.id);
          }
      }
      return json;
    }
     loadData(json) {
      if (!json.tabs) {
          return ;
      }
      for (let k in json.tabs) {
          if (!(k in this.tabs)) {
              continue;
          }
          let uidata=JSON.stringify(json.tabs[k]);
          loadUIData(this.tabs[k], uidata);
      }
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
      this.background = this.getDefault("background-color");
    }
     setCSS() {
      super.setCSS();
      this.background = this.getDefault("background-color");
      this._remakeStyle();
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
      let col=UIBase.createElement("colframe-x");
      this.tabs[id] = col;
      col.dataPrefix = this.dataPrefix;
      col.ctx = this.ctx;
      col._tab = this.tbar.addTab(name, id, tooltip, movable);
      col.inherit_packflag|=this.inherit_packflag;
      col.packflag|=this.packflag;
      col.parentWidget = this;
      if (col.ctx) {
          col._init();
      }
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
          this.horiz = barpos==="top"||barpos==="bottom";
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
     updateStyle() {
      let key=""+this.getDefault("background-color");
      if (key!==this._last_style_key) {
          this._last_style_key = key;
          this.setCSS();
      }
    }
     update() {
      super.update();
      this.tbar.movableTabs = this.movableTabs;
      if (this._tab!==undefined) {
          this._tab.update();
      }
      this.style["display"] = "flex";
      this.style["flex-direction"] = !this.horiz ? "row" : "column";
      this.tbar.tabFontScale = this.tabFontScale;
      this.updateStyle();
      this.updateHoriz();
      this.updateBarPos();
      this.tbar.update();
    }
  }
  _ESClass.register(TabContainer);
  _es6_module.add_class(TabContainer);
  TabContainer = _es6_module.add_export('TabContainer', TabContainer);
  UIBase.internalRegister(TabContainer);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_tabs.js');

