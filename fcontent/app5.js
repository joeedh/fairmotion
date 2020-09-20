es6_module_define('ui_colorpicker', ["../util/events.js", "../toolsys/toolprop.js", "../util/vectormath.js", "../core/ui.js", "../core/ui_base.js", "../util/util.js"], function _ui_colorpicker_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../util/events.js');
  var ui=es6_import(_es6_module, '../core/ui.js');
  var PropTypes=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropTypes');
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
  UIBase.register(ColorField);
  class ColorPicker extends ui.ColumnFrame {
     constructor() {
      super();
      this.field = document.createElement("colorfield-x");
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
          this.disabled = true;
          return ;
      }
      this.disabled = false;
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
  UIBase.register(ColorPicker);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_colorpicker.js');
es6_module_define('ui_colorpicker2', ["../toolsys/toolprop.js", "../util/util.js", "../util/colorutils.js", "../core/ui_base.js", "../util/vectormath.js", "../util/events.js", "../core/ui.js", "../util/simple_events.js", "../config/const.js"], function _ui_colorpicker2_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../util/events.js');
  var ui=es6_import(_es6_module, '../core/ui.js');
  var PropTypes=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropTypes');
  var keymap=es6_import_item(_es6_module, '../util/simple_events.js', 'keymap');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var color2web=es6_import_item(_es6_module, '../core/ui_base.js', 'color2web');
  var web2color=es6_import_item(_es6_module, '../core/ui_base.js', 'web2color');
  var validateWebColor=es6_import_item(_es6_module, '../core/ui_base.js', 'validateWebColor');
  let Vector2=vectormath.Vector2, Vector3=vectormath.Vector3, Vector4=vectormath.Vector4, Matrix4=vectormath.Matrix4;
  let _ex_rgb_to_hsv=es6_import_item(_es6_module, '../util/colorutils.js', 'rgb_to_hsv');
  _es6_module.add_export('rgb_to_hsv', _ex_rgb_to_hsv, true);
  let _ex_hsv_to_rgb=es6_import_item(_es6_module, '../util/colorutils.js', 'hsv_to_rgb');
  _es6_module.add_export('hsv_to_rgb', _ex_hsv_to_rgb, true);
  var rgb_to_hsv=es6_import_item(_es6_module, '../util/colorutils.js', 'rgb_to_hsv');
  var hsv_to_rgb=es6_import_item(_es6_module, '../util/colorutils.js', 'hsv_to_rgb');
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
              if (e.keyCode==keymap["Enter"]||e.keyCode==keymap["Escape"]||e.keyCode==keymap["Space"]) {
                  this.popModal();
              }
            }});
        }, 1);
      });
    }
     _redraw() {
      let g=this.g, canvas=this.canvas;
      let dpi=this.getDPI();
      let w=this.getDefault("defaultWidth");
      let h=this.getDefault("hueheight");
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
  UIBase.register(HueField);
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
              if (e.keyCode==keymap["Enter"]||e.keyCode==keymap["Escape"]||e.keyCode==keymap["Space"]) {
                  this.popModal();
              }
            }});
        }, 1);
      });
      this.canvas.addEventListener("touchstart", (e) =>        {
        console.log("touch start");
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
      let w=this.getDefault("defaultWidth");
      let h=this.getDefault("defaultHeight");
      return getFieldImage(this.getDefault("fieldsize"), w-r*2, h-r*2, this.hsva);
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
      let w=this.getDefault("defaultWidth");
      let h=this.getDefault("defaultHeight");
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
  UIBase.register(SatValField);
  class ColorField extends ui.ColumnFrame {
     constructor() {
      super();
      this.hsva = new Vector4([0.05, 0.6, 0.15, 1.0]);
      this.rgba = new Vector4([0, 0, 0, 0]);
      this._recalcRGBA();
      this._last_dpi = undefined;
      let satvalfield=this.satvalfield = document.createElement("satvalfield-x");
      satvalfield.hsva = this.hsva;
      let huefield=this.huefield = document.createElement("huefield-x");
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
  UIBase.register(ColorField);
  class ColorPicker extends ui.ColumnFrame {
     constructor() {
      super();
    }
     init() {
      super.init();
      this.field = document.createElement("colorfield-x");
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
        background-color : ${this.getDefault("BoxBG")};
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
      this.style["width"] = this.getDefault("defaultWidth")+"px";
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
        console.log(color);
        node._no_update_textbox = true;
        console.log(color);
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
          this.disabled = true;
          return ;
      }
      this.disabled = false;
      _update_temp.load(val);
      if (prop.type==PropTypes.VEC3) {
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
  UIBase.register(ColorPicker);
  class ColorPickerButton extends UIBase {
     constructor() {
      super();
      this._highlight = false;
      this._depress = false;
      this._label = "";
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
        console.log(e.type, this._id);
        this._keyhandler_add();
        this._highlight = true;
        this._redraw();
      };
      let leave=(e) =>        {
        console.log(e.type, this._id);
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
      console.log(this._id);
      if (internal_mode&&!this._highlight) {
          return ;
      }
      console.warn(this._id, "COLOR", e.keyCode);
      if (e===this._last_keyevt) {
          return ;
      }
      this._last_keyevt = e;
      if (e.keyCode===67&&(e.ctrlKey||e.commandKey)&&!e.shiftKey&&!e.altKey) {
          console.log("yay copy");
          console.log(document.activeElement);
          this.clipboardCopy();
          e.preventDefault();
          e.stopPropagation();
      }
      if (e.keyCode===86&&(e.ctrlKey||e.commandKey)&&!e.shiftKey&&!e.altKey) {
          console.log("yay paste");
          this.clipboardPaste();
          e.preventDefault();
          e.stopPropagation();
      }
    }
     clipboardCopy() {
      console.log("color copy");
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
      console.log("color paste");
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
      colorpicker.style["background-color"] = widget.getDefault("DefaultPanelBG");
      colorpicker.style["border-radius"] = "25px";
      colorpicker.style["border"] = widget.getDefault("border");
    }
     setRGBA(val) {
      let a=this.rgba[3];
      this.rgba.load(val);
      if (val.length<4) {
          this.rgba[3] = a;
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
      let w=this.getDefault("defaultWidth");
      let h=this.getDefault("defaultHeight");
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
          this.disabled = true;
          return ;
      }
      this.disabled = false;
      prop = prop;
      if (prop.uiname!==this._label) {
          this.label = prop.uiname;
      }
      let val=this.getPathValue(this.ctx, path);
      if (val===undefined) {
          let redraw=this.disabled!==true;
          this.disabled = true;
          if (redraw) {
              this._redraw();
          }
          return ;
      }
      else {
        let redraw=this.disabled;
        this.disabled = false;
        if (redraw) {
            this._redraw();
        }
      }
      if (this.rgba.vectorDistance(val)>0.0001) {
          if (prop.type===PropTypes.VEC3) {
              this.rgba.load(val);
              this.rgba[3] = 1.0;
          }
          else {
            this.rgba.load(val);
          }
          this._redraw();
      }
    }
     update() {
      super.update();
      if (this._has_keyhandler&&util.time_ms()-this._keyhandler_timeout>3500) {
          console.log("keyhandler auto remove");
          this._keyhandler_remove();
      }
      let key=""+this.rgba[0].toFixed(4)+" "+this.rgba[1].toFixed(4)+" "+this.rgba[2].toFixed(4)+" "+this.rgba[3].toFixed(4);
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
  
  UIBase.register(ColorPickerButton);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_colorpicker2.js');
es6_module_define('ui_container', ["../core/ui.js", "../controller/simple_controller.js", "../core/ui_base.js"], function _ui_container_module(_es6_module) {
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var DataAPI=es6_import_item(_es6_module, '../controller/simple_controller.js', 'DataAPI');
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
  UIBase.register(BuilderRow);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_container.js');
es6_module_define('ui_curvewidget', ["../util/util.js", "../curve/curve1d.js", "../util/vectormath.js", "../toolsys/toolprop.js", "../curve/curve1d_utils.js", "../core/ui_base.js", "../core/ui.js"], function _ui_curvewidget_module(_es6_module) {
  var Curve1DProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'Curve1DProperty');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var Icons=es6_import_item(_es6_module, '../core/ui_base.js', 'Icons');
  var ColumnFrame=es6_import_item(_es6_module, '../core/ui.js', 'ColumnFrame');
  var RowFrame=es6_import_item(_es6_module, '../core/ui.js', 'RowFrame');
  var util=es6_import(_es6_module, '../util/util.js');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector3');
  var Curve1D=es6_import_item(_es6_module, '../curve/curve1d.js', 'Curve1D');
  var mySafeJSONStringify=es6_import_item(_es6_module, '../curve/curve1d.js', 'mySafeJSONStringify');
  var makeGenEnum=es6_import_item(_es6_module, '../curve/curve1d_utils.js', 'makeGenEnum');
  class Curve1DWidget extends ColumnFrame {
     constructor() {
      super();
      this.useDataPathUndo = false;
      this._on_draw = this._on_draw.bind(this);
      this.drawTransform = [1.0, [0, 0]];
      this._value = new Curve1D();
      this._value.on("draw", this._on_draw);
      this._value._on_change = (msg) =>        {
        console.warn("value on change");
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
      this.style["heizght"] = "min-contents";
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
      this._last_dpi = true;
      this.canvas.width = w;
      this.canvas.height = h;
      this.canvas.style["width"] = (w/dpi)+"px";
      this.canvas.style["height"] = (h/dpi)+"px";
      this._redraw();
    }
     _redraw() {
      let canvas=this.canvas, g=this.g;
      g.clearRect(0, 0, canvas.width, canvas.height);
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
      console.log("new curve type", this.value.generatorType, this._gen_type);
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
  UIBase.register(Curve1DWidget);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_curvewidget.js');
es6_module_define('ui_dialog', ["../util/simple_events.js", "../screen/ScreenArea.js"], function _ui_dialog_module(_es6_module) {
  var AreaFlags=es6_import_item(_es6_module, '../screen/ScreenArea.js', 'AreaFlags');
  var keymap=es6_import_item(_es6_module, '../util/simple_events.js', 'keymap');
  function makePopupArea(area_class, screen, args) {
    if (args===undefined) {
        args = {};
    }
    let sarea=document.createElement("screenarea-x");
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
    sarea.style["background-color"] = sarea.getDefault("DefaultPanelBG");
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
es6_module_define('ui_lasttool', ["../toolsys/simple_toolsys.js", "../config/const.js", "../util/util.js", "../core/ui_base.js", "../core/ui.js", "../controller/simple_controller.js", "../toolsys/toolprop.js"], function _ui_lasttool_module(_es6_module) {
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var ColumnFrame=es6_import_item(_es6_module, '../core/ui.js', 'ColumnFrame');
  var PropTypes=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropTypes');
  var PropFlags=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropFlags');
  var UndoFlags=es6_import_item(_es6_module, '../toolsys/simple_toolsys.js', 'UndoFlags');
  var DataPath=es6_import_item(_es6_module, '../controller/simple_controller.js', 'DataPath');
  var DataTypes=es6_import_item(_es6_module, '../controller/simple_controller.js', 'DataTypes');
  var util=es6_import(_es6_module, '../util/util.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  const LastKey=Symbol("LastToolPanelId");
  let tool_idgen=0;
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
      let st=this.ctx.api.mapStruct(fakecls, true);
      let paths=[];
      function defineProp(k, key) {
        Object.defineProperty(fakecls, key, {get: function () {
            let tool=getTool();
            if (tool) {
                return tool.inputs[k].getValue();
            }
          }, 
      set: function (val) {
            let tool=getTool();
            if (tool) {
                tool.inputs[k].setValue(val);
                ctx.toolstack.rerun(tool);
                window.redraw_viewport();
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
      for (let dpath of paths) {
          let path="last_tool."+dpath.path;
          panel.label(dpath.data.uiname);
          panel.prop(path);
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
  UIBase.register(LastToolPanel);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_lasttool.js');
es6_module_define('ui_listbox', ["../util/util.js", "./ui_table.js", "../toolsys/simple_toolsys.js", "../toolsys/toolprop.js", "../core/ui.js", "../util/vectormath.js", "../core/ui_base.js", "../util/events.js"], function _ui_listbox_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../util/events.js');
  var simple_toolsys=es6_import(_es6_module, '../toolsys/simple_toolsys.js');
  var toolprop=es6_import(_es6_module, '../toolsys/toolprop.js');
  var TableFrame=es6_import_item(_es6_module, './ui_table.js', 'TableFrame');
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  var ColumnFrame=es6_import_item(_es6_module, '../core/ui.js', 'ColumnFrame');
  var RowFrame=es6_import_item(_es6_module, '../core/ui.js', 'RowFrame');
  var keymap=es6_import_item(_es6_module, '../util/events.js', 'keymap');
  let EnumProperty=toolprop.EnumProperty, PropTypes=toolprop.PropTypes;
  let UIBase=ui_base.UIBase, PackFlags=ui_base.PackFlags, IconSheets=ui_base.IconSheets;
  function getpx(css) {
    return parseFloat(css.trim().replace("px", ""));
  }
  class ListItem extends RowFrame {
     constructor() {
      super();
      let highlight=() =>        {
        console.log("listitem mouseover");
        this.highlight = true;
        this.setBackground();
      };
      let unhighlight=() =>        {
        console.log("listitem mouseleave");
        this.highlight = false;
        this.setBackground();
      };
      this.addEventListener("mouseover", highlight);
      this.addEventListener("mousein", highlight);
      this.addEventListener("mouseleave", unhighlight);
      this.addEventListener("mouseout", unhighlight);
      this.addEventListener("blur", unhighlight);
      this.addEventListener("click", (e) =>        {
        console.log("click!");
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
     init() {
      super.init();
      this.setAttribute("class", "listitem");
      this.style["width"] = "100%";
      this.setCSS();
    }
     setBackground() {
      if (this.highlight) {
          this.background = this.getDefault("ListHighlight");
      }
      else 
        if (this.is_active) {
          this.background = this.getDefault("ListActive");
      }
      else {
        this.background = this.getDefault("DefaultPanelBG");
      }
    }
    static  define() {
      return {tagname: "listitem-x", 
     style: "listbox"}
    }
  }
  _ESClass.register(ListItem);
  _es6_module.add_class(ListItem);
  UIBase.register(ListItem);
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
        console.log("yay", e.keyCode);
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
      let item=document.createElement("listitem-x");
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
      console.log("set active!");
      if (item===this.items.active) {
          return ;
      }
      if (this.items.active!==undefined) {
          this.items.active.highlight = false;
          this.items.active.is_active = false;
          this.items.active.setBackground();
      }
      item.is_active = true;
      this.items.active = item;
      if (item!==undefined) {
          item.setBackground();
          item.scrollIntoViewIfNeeded();
      }
      if (this.onchange) {
          this.onchange(item._id, item);
      }
    }
     clear() {

    }
    static  define() {
      return {tagname: "listbox-x", 
     style: "listbox"}
    }
  }
  _ESClass.register(ListBox);
  _es6_module.add_class(ListBox);
  UIBase.register(ListBox);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_listbox.js');
es6_module_define('ui_menu', ["../util/events.js", "../toolsys/simple_toolsys.js", "../config/const.js", "./ui_button.js", "../util/simple_events.js", "../toolsys/toolprop.js", "../util/util.js", "../util/vectormath.js", "../core/ui_base.js"], function _ui_menu_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, '../util/util.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../util/events.js');
  var simple_toolsys=es6_import(_es6_module, '../toolsys/simple_toolsys.js');
  var toolprop=es6_import(_es6_module, '../toolsys/toolprop.js');
  var Button=es6_import_item(_es6_module, './ui_button.js', 'Button');
  var DomEventTypes=es6_import_item(_es6_module, '../util/events.js', 'DomEventTypes');
  var HotKey=es6_import_item(_es6_module, '../util/simple_events.js', 'HotKey');
  var keymap=es6_import_item(_es6_module, '../util/simple_events.js', 'keymap');
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
      this.container.addEventListener("mouseleave", (e) =>        {
        console.log("menu out");
        this.close();
      }, false);
      this.shadow.appendChild(style);
      this.shadow.appendChild(this.container);
    }
     float(x, y, zindex=undefined) {
      console.log("menu test!");
      let dpi=this.getDPI();
      let rect=this.dom.getClientRects();
      let maxx=this.getWinWidth()-10;
      let maxy=this.getWinHeight()-10;
      console.log(rect.length>0 ? rect[0] : undefined);
      if (rect.length>0) {
          rect = rect[0];
          console.log(y+rect.height);
          if (y+rect.height>maxy) {
              console.log("greater");
              y = maxy-rect.height-1;
          }
          if (x+rect.width>maxx) {
              console.log("greater");
              x = maxx-rect.width-1;
          }
      }
      super.float(x, y, 50);
    }
     click() {
      if (this.activeItem==undefined)
        return ;
      if (this.activeItem!==undefined&&this.activeItem._isMenu)
        return ;
      if (this.onselect) {
          try {
            console.log(this.activeItem._id, "-----");
            this.onselect(this.activeItem._id);
          }
          catch (error) {
              util.print_stack(error);
              console.log("Error in menu callback");
          }
      }
      console.log("menu select");
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
      console.warn("menu searchbox mode start");
      this.hasSearchBox = true;
      this.started = true;
      menuWrangler.pushMenu(this);
      let dom2=document.createElement("div");
      this.dom.setAttribute("class", "menu");
      dom2.setAttribute("class", "menu");
      let sbox=this.textbox = document.createElement("textbox-x");
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
        console.log("applying search", t);
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
        console.log(e.keyCode);
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
      console.log(this.container, "container?");
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
     addItem(item, id, add=true) {
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
      if (__instance_of(item, Menu)) {
          console.log("submenu!");
          let dom=this.addItemExtra(""+item.title, id, "", -1, false);
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
                return n;
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
            if (this.activeItem!==undefined&&this.activeItem._isMenu) {
                let active=this.activeItem;
                window.setTimeout(() =>                  {
                  if (this.activeItem&&this.activeItem!==active) {
                      active._menu.close();
                  }
                }, 10);
            }
            if (li._isMenu) {
                li._menu.onselect = (item) =>                  {
                  this.onselect(item);
                  this.close();
                };
                li._menu.start(false, false);
            }
            this.setActive(li, false);
          };
          li.addEventListener("touchend", (e) =>            {
            onfocus(e);
            if (this.activeItem!==undefined&&this.activeItem._isMenu) {
                console.log("menu ignore");
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
     buildStyle() {
      let pad1=util.isMobile() ? 2 : 0;
      pad1+=this.getDefault("MenuSpacing");
      this.menustyle.textContent = `
        .menucon {
          position:absolute;
          float:left;
          
          display: block;
          -moz-user-focus: normal;
        }
        
        ul.menu {
          display        : flex;
          flex-direction : column;
          flex-wrap      : nowrap;
          width          : max-content;
          
          margin : 0px;
          padding : 0px;
          border : ${this.getDefault("MenuBorder")};
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
      let ret=document.createElement("menu-x");
      ret.setAttribute("title", title);
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
  UIBase.register(Menu);
  class DropBox extends Button {
     constructor() {
      super();
      this._searchMenuMode = false;
      this.altKey = undefined;
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
          this.overrideDefault("defaultWidth", tw);
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
      if (val===undefined) {
          this.disabled = true;
          return ;
      }
      else {
        this.disabled = false;
      }
      if (this.prop!==undefined) {
          prop = this.prop;
      }
      let name=this.getAttribute("name");
      if (prop.type&(PropTypes.ENUM|PropTypes.FLAG)) {
          name = prop.ui_value_names[prop.keys[val]];
      }
      else {
        name = ""+val;
      }
      if (name!=this.getAttribute("name")) {
          this.setAttribute("name", name);
          this.updateName();
      }
    }
     update() {
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
     _build_menu() {
      let prop=this.prop;
      if (this.prop===undefined) {
          return ;
      }
      if (this._menu!==undefined&&this._menu.parentNode!==undefined) {
          this._menu.remove();
      }
      let menu=this._menu = document.createElement("menu-x");
      menu.setAttribute("title", name);
      menu._dropbox = this;
      let valmap={};
      let enummap=prop.values;
      let iconmap=prop.iconmap;
      let uimap=prop.ui_value_names;
      for (let k in enummap) {
          let uk=k;
          valmap[enummap[k]] = k;
          if (uimap!==undefined&&k in uimap) {
              uk = uimap[k];
          }
          if (iconmap&&iconmap[k]) {
              menu.addItemExtra(uk, enummap[k], undefined, iconmap[k]);
          }
          else {
            menu.addItem(uk, enummap[k]);
          }
      }
      menu.onselect = (id) =>        {
        this._pressed = false;
        this._pressed = false;
        this._redraw();
        this._menu = undefined;
        this.prop.setValue(id);
        this.setAttribute("name", this.prop.ui_value_names[valmap[id]]);
        if (this.onselect) {
            this.onselect(id);
        }
        if (this.hasAttribute("datapath")&&this.ctx) {
            console.log("setting data api value", id, this.getAttribute("datapath"));
            this.setPathValue(this.ctx, this.getAttribute("datapath"), id);
        }
      };
    }
     _onpress(e) {
      console.warn("menu dropbox click", this._menu, e);
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
        console.log("menu onclose");
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
      let p2=4*dpi;
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
     setValue(val) {
      if (this.prop!==undefined) {
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
      if (this.onchange) {
          this.onchange(val);
      }
      this.setCSS();
      this.update();
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
  UIBase.register(DropBox);
  class MenuWrangler  {
     constructor() {
      this.screen = undefined;
      this.menustack = [];
      this.closetimer = 0;
      this.closeOnMouseUp = undefined;
    }
    get  menu() {
      return this.menustack.length>0 ? this.menustack[this.menustack.length-1] : undefined;
    }
     pushMenu(menu) {
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
      console.log("s", e.keyCode);
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
          console.log("Up");
          menu.selectPrev(false);
          break;
        case keymap["Down"]:
          console.log("Down");
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
      console.log("key", e.keyCode);
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
      console.log("wrangler mousedown", element);
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
     on_mousemove(e) {
      if (this.menu&&this.menu.hasSearchBox) {
          this.closetimer = util.time_ms();
          return ;
      }
      if (this.menu===undefined||this.screen===undefined) {
          this.closetimer = util.time_ms();
          return ;
      }
      let screen=this.screen;
      let x=e.pageX, y=e.pageY;
      let element=screen.pickElement(x, y);
      if (element===undefined) {
          return ;
      }
      if (__instance_of(element, DropBox)&&element.menu!==this.menu&&element.getAttribute("simple")) {
          this.endMenus();
          this.closetimer = util.time_ms();
          element._onpress(e);
          return ;
      }
      let ok=false;
      let w=element;
      while (w) {
        if (w===this.menu) {
            ok = true;
            break;
        }
        if (__instance_of(w, DropBox)&&w.menu===this.menu) {
            ok = true;
            break;
        }
        w = w.parentWidget;
      }
      if (!ok&&(util.time_ms()-this.closetimer>cconst.menu_close_time)) {
          this.endMenus();
      }
      else 
        if (ok) {
          this.closetimer = util.time_ms();
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
    let menu=document.createElement("menu-x");
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
          if (hotkey!==undefined&&__instance_of(hotkey, HotKey)) {
              hotkey = hotkey.buildString();
          }
          menu.addItemExtra(item[0], id, hotkey, icon, undefined, tooltip);
          cbs[id] = (function (cbfunc, arg) {
            return function () {
              cbfunc(arg);
            }
          })(item[1], item[2]);
          id++;
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
es6_module_define('ui_noteframe', ["../core/ui.js", "../util/util.js", "../core/ui_base.js"], function _ui_noteframe_module(_es6_module) {
  var util=es6_import(_es6_module, '../util/util.js');
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
     setLabel(s) {
      let color=this.color;
      if (this.mark===undefined) {
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
      let mark=this.mark, ntext=this.ntext;
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
      this.style["color"] = this.getDefault("NoteText").color;
      let clr=css2color(this.color);
      clr = color2css([clr[0], clr[1], clr[2], 0.25]);
      this.style["background-color"] = clr;
      this.setCSS();
    }
    static  define() {
      return {tagname: "note-x"}
    }
  }
  _ESClass.register(Note);
  _es6_module.add_class(Note);
  Note = _es6_module.add_export('Note', Note);
  UIBase.register(Note);
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
     setCSS() {
      super.setCSS();
      let w=~~(this.percent*this.barWidth+0.5);
      this.bar2.style["width"] = w+"px";
    }
    set  percent(val) {
      this._percent = val;
      this.setCSS();
    }
    get  percent() {
      return this._percent;
    }
     init() {
      super.init();
    }
    static  define() {
      return {tagname: "note-progress-x"}
    }
  }
  _ESClass.register(ProgBarNote);
  _es6_module.add_class(ProgBarNote);
  ProgBarNote = _es6_module.add_export('ProgBarNote', ProgBarNote);
  UIBase.register(ProgBarNote);
  class NoteFrame extends ui.RowFrame {
     constructor() {
      super();
      this._h = 20;
    }
     init() {
      super.init();
      this.noMarginsOrPadding();
      noteframes.push(this);
      this.background = this.getDefault("NoteBG");
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
     addNote(msg, color="rgba(255,0,0,0.2)", timeout=1200, tagname="note-x") {
      let note=document.createElement(tagname);
      note.color = color;
      note.setLabel(msg);
      note.style["text-align"] = "center";
      note.style["font"] = ui_base.getFont(note, "NoteText");
      note.style["color"] = this.getDefault("NoteText").color;
      this.add(note);
      this.noMarginsOrPadding();
      note.noMarginsOrPadding();
      note.style["height"] = this._h+"px";
      note.height = this._h;
      if (timeout!=-1) {
          window.setTimeout(() =>            {
            note.remove();
          }, timeout);
      }
      return note;
    }
    static  define() {
      return {tagname: "noteframe-x"}
    }
  }
  _ESClass.register(NoteFrame);
  _es6_module.add_class(NoteFrame);
  NoteFrame = _es6_module.add_export('NoteFrame', NoteFrame);
  UIBase.register(NoteFrame);
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
            console.log("bad notification frame");
        }
    }
  }
  progbarNote = _es6_module.add_export('progbarNote', progbarNote);
  function sendNote(screen, msg, color, timeout) {
    if (timeout===undefined) {
        timeout = 3000;
    }
    noteframes = getNoteFrames(screen);
    for (let frame of noteframes) {
        try {
          frame.addNote(msg, color, timeout);
        }
        catch (error) {
            print_stack(error);
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
    return sendNote(screen, msg, ui_base.color2css([0.4, 1.0, 0.5, 1.0]), timeout);
  }
  message = _es6_module.add_export('message', message);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_noteframe.js');
es6_module_define('ui_numsliders', ["../core/units.js", "../util/util.js", "./ui_widgets.js", "../util/simple_events.js", "../core/ui_base.js", "../util/vectormath.js", "../toolsys/toolprop.js", "../core/ui.js"], function _ui_numsliders_module(_es6_module) {
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
          console.warn("MOUSEUP");
          this.undoBreakPoint();
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
     font: this.getDefault("DefaultText")}).width/dpi;
      tw = Math.max(tw+this._getArrowSize()*0, this.getDefault("defaultWidth"));
      tw+=ts;
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
es6_module_define('ui_panel', ["../util/vectormath.js", "../core/ui_base.js", "../core/ui.js", "../toolsys/toolprop.js", "../util/util.js", "./ui_widgets.js", "../util/html5_fileapi.js"], function _ui_panel_module(_es6_module) {
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
      this.titleframe = this.row();
      this.contents = document.createElement("colframe-x");
      this.iconcheck = document.createElement("iconcheck-x");
      Object.defineProperty(this.contents, "closed", {get: () =>          {
          return this.closed;
        }, 
     set: (v) =>          {
          this.closed = v;
        }});
      Object.defineProperty(this.contents, "title", {get: () =>          {
          return this.getAttribute("title");
        }, 
     set: (v) =>          {
          return this.setAttribute("title", v);
        }});
      this.packflag = this.inherit_packflag = 0;
      this._closed = false;
      this.makeHeader();
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
     makeHeader() {
      let row=this.titleframe;
      let iconcheck=this.iconcheck;
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
      row.style["padding-right"] = "20px";
      row.style["padding-left"] = "5px";
      row.style["padding-top"] = this.getDefault("padding-top")+"px";
      row.style["padding-bottom"] = this.getDefault("padding-bottom")+"px";
    }
     init() {
      super.init();
      this.background = this.getDefault("Background");
      this.style["width"] = "100%";
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
      key+=this.getAttribute("title");
      if (key!==this._last_key) {
          if (this.getAttribute("title")) {
              this.label = this.getAttribute("title");
          }
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
es6_module_define('ui_table', ["../core/ui.js", "../core/ui_base.js", "../toolsys/toolprop.js", "./ui_widgets.js", "../util/util.js", "../util/vectormath.js", "./ui_curvewidget.js"], function _ui_table_module(_es6_module) {
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
        let container=document.createElement("rowframe-x");
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
es6_module_define('ui_widgets2', ["../core/ui.js", "../util/util.js", "../util/vectormath.js", "../core/ui_base.js", "./ui_richedit.js", "../core/units.js", "../toolsys/toolprop.js", "../util/events.js", "./ui_widgets.js"], function _ui_widgets2_module(_es6_module) {
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
      this.packflag|=PackFlags.FORCE_ROLLER_SLIDER|PackFlags.NO_NUMSLIDER_TEXTBOX;
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
          let slider=frame.slider(undefined, {name: this.axes[i], 
       defaultval: this.value[i], 
       min: this.range[0], 
       max: this.range[1], 
       step: this.step||0.001, 
       is_int: this.isInt, 
       packflag: this.packflag});
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
es6_module_define('all', ["./splinetool.js", "./pentool.js"], function _all_module(_es6_module) {
  es6_import(_es6_module, './splinetool.js');
  es6_import(_es6_module, './pentool.js');
}, '/dev/fairmotion/src/editors/viewport/toolmodes/all.js');
es6_module_define('pentool', ["../spline_selectops.js", "../view2d_editor.js", "../../../core/toolops_api.js", "../../../path.ux/scripts/core/ui_base.js", "../../../path.ux/scripts/util/util.js", "../../../path.ux/scripts/pathux.js", "../view2d_ops.js", "../spline_createops.js", "../transform_ops.js", "../../../core/context.js", "../spline_editops.js", "../transform.js", "../selectmode.js", "../../../curve/spline_types.js", "../../events.js", "../../../curve/spline_draw.js", "./toolmode.js"], function _pentool_module(_es6_module) {
  "use strict";
  var UIBase=es6_import_item(_es6_module, '../../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var FullContext=es6_import_item(_es6_module, '../../../core/context.js', 'FullContext');
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
  var util=es6_import(_es6_module, '../../../path.ux/scripts/util/util.js');
  var ToolMode=es6_import_item(_es6_module, './toolmode.js', 'ToolMode');
  var nstructjs=es6_import_item(_es6_module, '../../../path.ux/scripts/pathux.js', 'nstructjs');
  var WidgetResizeOp=es6_import_item(_es6_module, '../transform_ops.js', 'WidgetResizeOp');
  var WidgetRotateOp=es6_import_item(_es6_module, '../transform_ops.js', 'WidgetRotateOp');
  var ToolModes=es6_import_item(_es6_module, '../selectmode.js', 'ToolModes');
  var PanOp=es6_import_item(_es6_module, '../view2d_ops.js', 'PanOp');
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
      this._start = 0;
      this._verts = [];
    }
    static  tooldef() {
      return {uiname: "Add Stroke", 
     toolpath: "pen.stroke", 
     inputs: {points: new ListProperty(Vec3Property), 
      lineWidth: new FloatProperty(), 
      strokeColor: new Vec4Property([0, 0, 0, 1])}}
    }
     exec(ctx) {
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
      this.limit = 10;
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
    static  defineAPI() {
      let st=super.defineAPI();
      let def=st.Float("limit", "limit", "Limit", "Minimum distance between points");
      def.Range(0, 300);
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
      this.start_mpos[0] = event.x;
      this.start_mpos[1] = event.y;
      let mpos=this.getMouse(event);
      this.tool = new StrokeOp();
      this.tool.inputs.lineWidth.setValue(this.ctx.view2d.default_linewidth);
      this.tool.inputs.strokeColor.setValue(this.ctx.view2d.default_stroke);
      this.ctx.toolstack.execTool(this.ctx, this.tool);
      this.addPoint(mpos);
      this.mdown = true;
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
     updateHighlight(x, y, was_touch) {

    }
     on_mousemove(event) {
      if (!this.mdown) {
          return ;
      }
      let mpos=this.getMouse(event);
      if (this.last_mpos.vectorDistance(mpos)>this.limit) {
          this.last_mpos.load(mpos);
          this.addPoint(mpos);
      }
    }
     on_mouseup(event) {
      this.mdown = false;
      console.log("%cMOUSE UP", "color : yellow;");
      this.tool = undefined;
      this._cancel_on_touch = false;
      this.start_mpos[0] = event.x;
      this.start_mpos[1] = event.y;
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
es6_module_define('splinetool', ["../../../path.ux/scripts/pathux.js", "../selectmode.js", "../../../curve/spline_types.js", "../../../core/context.js", "../spline_selectops.js", "../../../curve/spline_draw.js", "../../../path.ux/scripts/core/ui_base.js", "./toolmode.js", "../spline_editops.js", "../view2d_ops.js", "../../events.js", "../../../core/toolops_api.js", "../transform.js", "../spline_createops.js", "../transform_ops.js", "../view2d_editor.js", "../../../path.ux/scripts/util/util.js"], function _splinetool_module(_es6_module) {
  "use strict";
  var UIBase=es6_import_item(_es6_module, '../../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var FullContext=es6_import_item(_es6_module, '../../../core/context.js', 'FullContext');
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
      let k=this.keymap = new KeyMap("view2d:splinetool");
      k.add_tool(new HotKey("PageUp", [], "Send Face Up"), "spline.change_face_z(offset=1, selmode=selectmode)");
      k.add_tool(new HotKey("PageDown", [], "Send Face Down"), "spline.change_face_z(offset=-1, selmode=selectmode)");
      k.add_tool(new HotKey("G", [], "Translate"), "spline.translate(datamode=selectmode)");
      k.add_tool(new HotKey("S", [], "Scale"), "spline.scale(datamode=selectmode)");
      k.add_tool(new HotKey("S", ["SHIFT"], "Scale Time"), "spline.shift_time()");
      k.add_tool(new HotKey("R", [], "Rotate"), "spline.rotate(datamode=selectmode)");
      k.add_tool(new HotKey("A", [], "Select All"), "spline.toggle_select_all()");
      k.add_tool(new HotKey("H", [], "Hide Selection"), "spline.hide(selmode=selectmode)");
      k.add_tool(new HotKey("H", ["ALT"], "Reveal Selection"), "spline.unhide(selmode=selectmode)");
      k.add_tool(new HotKey("G", ["CTRL"], "Ghost Selection"), "spline.hide(selmode=selectmode, ghost=1)");
      k.add_tool(new HotKey("G", ["ALT"], "Unghost Selection"), "spline.unhide(selmode=selectmode, ghost=1)");
      k.add(new HotKey("L", [], "Select Linked"), new FuncKeyHandler(function (ctx) {
        var mpos=ctx.keymap_mpos;
        mpos = ctx.view2d.getLocalMouse(mpos[0], mpos[1]);
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
      let ops=["spline.flip_segments()", "spline.key_edges()", "spline.key_current_frame()", "spline.connect_handles()", "spline.disconnect_handles()", "spline.toggle_step_mode()", "spline.toggle_manual_handles()", "editor.paste_pose()", "editor.copy_pose()"];
      var menu=view2d.toolop_menu(ctx, "Tools", ops);
      view2d.call_menu(menu, view2d, mpos);
    }
     _get_spline() {
      return this.ctx.spline;
    }
     on_mousedown(event, localX, localY) {
      if (this._do_touch_undo(event)) {
          return true;
      }
      var spline=this.ctx.spline;
      var toolmode=this.ctx.view2d.toolmode;
      this.start_mpos[0] = event.x;
      this.start_mpos[1] = event.y;
      this.updateHighlight(event.x, event.y, !!event.touches);
      if (this.highlight_spline!==undefined&&this.highlight_spline!==spline) {
          this._cancel_on_touch = false;
          console.log("spline switch!");
          var newpath;
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
          var can_append=toolmode===ToolModes.APPEND;
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
              this._cancel_on_touch = true;
              g_app_state.toolstack.exec_tool(op);
              redraw_viewport();
              ret = true;
          }
          else {
            this._cancel_on_touch = false;
            for (var i=0; i<spline.elists.length; i++) {
                var list=spline.elists[i];
                if (!(this.selectmode&list.type))
                  continue;
                
                if (list.highlight===undefined)
                  continue;
                var op=new SelectOneOp(list.highlight, !event.shiftKey, !(list.highlight.flag&SplineFlags.SELECT), this.selectmode, true);
                g_app_state.toolstack.exec_tool(op);
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
      let toolmode=this.ctx.view2d.toolmode;
      let limit;
      if (this.ctx.view2d.selectmode&SelMask.SEGMENT) {
          limit = 55;
      }
      else {
        limit = (util.isMobile()||was_touch) ? 55 : 15;
      }
      limit/=UIBase.getDPI();
      if (toolmode===ToolModes.SELECT)
        limit*=3;
      let ret=this.findnearest([x, y], this.ctx.view2d.selectmode, limit, this.ctx.view2d.edit_all_layers);
      if (ret!==undefined) {
          if (ret[0]!==this.highlight_spline&&this.highlight_spline!==undefined) {
              this.highlight_spline.clear_highlight();
          }
          this.highlight_spline = ret[0];
          this.highlight_spline.clear_highlight();
          window.redraw_viewport();
      }
      else {
        if (this.highlight_spline!==undefined) {
            this.highlight_spline.clear_highlight();
            window.redraw_viewport();
        }
        this.highlight_spline = undefined;
      }
      if (this.highlight_spline&&ret&&ret[1]) {
          let list=this.highlight_spline.get_elist(ret[1].type);
          let redraw=list.highlight!==ret[1];
          list.highlight = ret[1];
          if (redraw) {
              window.redraw_viewport();
          }
      }
    }
     _do_touch_undo(event) {
      console.log(event.touches&&event.touches.length>1, this._cancel_on_touch, "<---");
      if (event.touches&&event.touches.length>1&&this._cancel_on_touch) {
          console.log("touch undo!");
          this.ctx.toolstack.undo();
          this._cancel_on_touch = false;
          this.ctx.toolstack.execTool(this.ctx, new PanOp());
          window.redraw_viewport();
          return true;
      }
    }
     on_mousemove(event) {
      if (this.ctx===undefined)
        return ;
      this.mpos[0] = event.x, this.mpos[1] = event.y, this.mpos[2] = 0.0;
      var selectmode=this.selectmode;
      if (this._do_touch_undo(event)) {
          return ;
      }
      this.updateHighlight(event.x, event.y, !!event.touches);
      let translate=(this.mdown&&this.start_mpos.vectorDistance(this.mpos)>15/UIBase.getDPI());
      if (translate) {
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
          let _cancel_on_touch=this._cancel_on_touch;
          this._cancel_on_touch = false;
          op.touchCancelable(() =>            {
            console.log("touch-induced cancel!");
            this.ctx.toolstack.execTool(this.ctx, new PanOp());
            if (_cancel_on_touch) {
                this.ctx.toolstack.undo();
            }
          });
          g_app_state.toolstack.exec_tool(op);
      }
    }
     on_mouseup(event) {
      this._cancel_on_touch = false;
      this.start_mpos[0] = event.x;
      this.start_mpos[1] = event.y;
      this.mdown = true;
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
es6_module_define('toolmode', ["../../../core/data_api/data_api_types.js", "../../../path.ux/scripts/pathux.js", "../../../core/eventdag.js", "../../events.js"], function _toolmode_module(_es6_module) {
  var NodeBase=es6_import_item(_es6_module, '../../../core/eventdag.js', 'NodeBase');
  var KeyMap=es6_import_item(_es6_module, '../../events.js', 'KeyMap');
  var nstructjs=es6_import_item(_es6_module, '../../../path.ux/scripts/pathux.js', 'nstructjs');
  var DataStruct=es6_import_item(_es6_module, '../../../core/data_api/data_api_types.js', 'DataStruct');
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
    static  defineAPI() {
      let st=new DataStruct(undefined, this);
      st.String("name", "constructor.name", "Name", "Name");
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
  function defineAPI(api) {
    for (let tool of ToolModes) {
        tool._apiStruct = tool.defineAPI(api);
    }
  }
  defineAPI = _es6_module.add_export('defineAPI', defineAPI);
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
  _data : array(byte) | this ? this : [];
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
es6_module_define('bspline', [], function _bspline_module(_es6_module) {
  var _bspline=undefined;
  var _i=0;
  var IW=_i++;
  var IDV1=_i++;
  var IDV2=_i++;
  var IDV3=_i++;
  var IDV4=_i++;
  var ITOT=_i;
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
  var cache={}
  window.NO_CACHE = false;
  var uniform_vec=new Array(1024);
  for (var i=0; i<uniform_vec.length; i++) {
      uniform_vec[i] = i;
  }
  class BasisCache  {
     constructor(knots) {
      this.size = undefined;
      this.recalc = 1;
      this.tables = [];
      this.dpad = 1;
      if (knots!=undefined) {
          this.gen(knots);
      }
    }
     gen(ks, degree) {
      if (NO_CACHE) {
          this.recalc = 1;
          return ;
      }
      this.tables = [];
      var start_time=time_ms();
      console.log("start generating tables");
      var sz=14;
      if (degree<3)
        sz = 128;
      else 
        if (degree<4)
        sz = 40;
      this.size = sz;
      this.degree = degree;
      var dpad=this.dpad;
      for (var i=-degree-dpad; i<ks.length+degree+dpad; i++) {
          var j1=Math.max(0, i-degree-dpad);
          var j2=Math.min(ks.length-1, i+degree+dpad);
          if (i==-degree-dpad)
            j1 = 0;
          var tstart=ks[j1];
          var tend=ks[j2];
          var ds=(tend-tstart)/(this.size-1.0);
          var table=new Table(this.size, tstart, tend, ds);
          this.tables.push(table);
      }
      this.recalc = 0;
      if (ks.length==0)
        return ;
      var start=ks[0], end=ks[ks.length-1];
      var s=start, steps=this.size, ds=(end-start)/(steps-1.0);
      this.start = start;
      this.end = end;
      var df=1e-05;
      var lastk=ks[ks.length-1];
      var dpad=this.dpad;
      for (var j=-degree-dpad; j<ks.length+degree+dpad; j++) {
          var j1=Math.min(Math.max(j+degree+dpad, 0), this.tables.length-1);
          var table=this.tables[j1];
          start = table.start, end = table.end, ds = table.ds;
          var ac=0.0;
          for (var i=0, s2=start; i<steps; i++, s2+=ds) {
              var s=s2;
              s = min(lastk-1e-08, s);
              var table=this.tables[j+degree+dpad];
              var dv, dv2, dv3, dv4;
              dv = dv2 = dv3 = dv4 = 0.0;
              var w=table.w[i] = basis(s, j, degree, ks);
              table.t[ac++] = w;
              var s2=s;
              var dv=basis_dv(s2, j, degree, ks, 1);
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
      var origs=s;
      if (NO_CACHE||(no_cache!==undefined&&no_cache)) {
          return basis(s, j, n, ks, true);
      }
      if (this.recalc) {
          this.gen(ks, n);
      }
      j = min(max(j+n+this.dpad, 0), this.tables.length-1);
      var table=this.tables[j];
      var start=table.start, end=table.end, ds=table.ds;
      if (s<start||s>=end)
        return 0.0;
      var div=(end-start);
      var tsize=this.size;
      s = (s-start)/div;
      s = min(max(s, 0.0), 1.0)*(tsize-1.0);
      var t=s;
      s = floor(s);
      s = min(max(s, 0.0), tsize-1);
      t-=s;
      var s2=min(s+1, tsize);
      var ac1=s*ITOT;
      var ac2=s2*ITOT;
      var tb=table.t;
      var w1, w2, dv1a, dv2a, dv3a, dv4a, dv1b, dv2b, dv3b, dv4b;
      var w1=table.w[s], dv1a=table.dv[s], dv2a=table.dv2[s], dv3a=table.dv3[s], dv4a=table.dv4[s];
      var w2=table.w[s2], dv1b=table.dv[s2], dv2b=table.dv2[s2], dv3b=table.dv3[s2], dv4b=table.dv4[s2];
      var t2=1.0-t;
      var t3=t;
      t*=ds;
      t2*=-ds;
      var eps=1e-06;
      t3 = (t3*(1.0-eps*2.0))+eps;
      s = t3*ds;
      var s2=s*s, s3=s*s*s, s4=s2*s2, s5=s4*s, s6=s3*s3, s7=s6*s, s8=s7*s;
      var ds2=ds*ds, ds3=ds*ds*ds, ds4=ds3*ds, ds5=ds4*ds, ds6=ds5*ds, ds7=ds6*ds, ds8=ds7*ds;
      var polynomial=((((dv3a*s3+6*w1+3*dv2a*s2+6*dv1a*s)*ds5+3*(2*ds3*dv3a+ds3*dv3b+20*ds2*dv2a-14*ds2*dv2b+90*ds*dv1a+78*ds*dv1b+168*w1-168*w2)*s5)*ds-(4*ds3*dv3a+3*ds3*dv3b+45*ds2*dv2a-39*ds2*dv2b+216*ds*dv1a+204*ds*dv1b+420*w1-420*w2)*s6)*ds+((dv3a+dv3b)*ds3+120*(w1-w2)+12*(dv2a-dv2b)*ds2+60*(dv1a+dv1b)*ds)*s7-((4*dv3a+dv3b)*ds3+210*(w1-w2)+15*(2*dv2a-dv2b)*ds2+30*(4*dv1a+3*dv1b)*ds)*ds3*s4)/(6*ds7);
      if (isNaN(polynomial)) {
          return 0;
      }
      return polynomial;
    }
  }
  _ESClass.register(BasisCache);
  _es6_module.add_class(BasisCache);
  BasisCache = _es6_module.add_export('BasisCache', BasisCache);
  var basis_dv_cache=new cachering(function () {
    var ret=new Array(32);
    for (var i=0; i<ret.length; i++) {
        ret[i] = 0.0;
    }
    ret.j = undefined;
    ret.n = undefined;
    ret.init = function (j, n) {
      this.j = j;
      this.n = n;
      for (var i=0; i<this.length; i++) {
          this[i] = 0;
      }
    }
    return ret;
  }, 64);
  function basis_dv(s, j, n, ks, dvn) {
    if (dvn==undefined)
      dvn = 1;
    return compiled_basis_dv(s, j, n, ks, dvn);
    if (dvn==0) {
        return basis(s, j, n, ks);
    }
    var klen=ks.length;
    var j1=j, j2=j+1, jn=j+n, jn1=j+n+1;
    j1 = min(max(j1, 0.0), klen-1);
    j2 = min(max(j2, 0.0), klen-1);
    jn = min(max(jn, 0.0), klen-1);
    jn1 = min(max(jn1, 0.0), klen-1);
    if (n<1) {
        return 0;
    }
    else 
      if (0&&n<=1) {
        var j3=min(max(j+2, 0.0), klen-1);
        var j4=min(max(j+3, 0.0), klen-1);
        var ret=0.0;
        if (s>=ks[j1]&&s<ks[j2])
          ret = 1.0/(ks[j2]-ks[j1]);
        else 
          if (s>=ks[j2]&&s<ks[j3])
          ret = -1.0/(ks[j3]-ks[j2]);
        return ret;
    }
    else {
      var kj1=ks[j1];
      var kj2=ks[j2];
      var kjn=ks[jn]+1e-10;
      var kjn1=ks[jn1]+1e-10;
      var div=((kj1-kjn)*(kj2-kjn1));
      if (div==0.0) {
          div = 0.0;
      }
      var lastdv=basis_dv(s, j, n-1, ks, dvn-1);
      var ret=((kj1-s)*basis_dv(s, j, n-1, ks, dvn)-dvn*basis_dv(s, j, n-1, ks, dvn-1))*(kj2-kjn1);
      ret-=((kjn1-s)*basis_dv(s, j+1, n-1, ks, dvn)-dvn*basis_dv(s, j+1, n-1, ks, dvn-1))*(kj1-kjn);
      if (div!=0.0)
        ret/=div;
      else 
        ret/=0.0001;
      return ret;
    }
  }
  basis_dv = _es6_module.add_export('basis_dv', basis_dv);
  var min=Math.min, max=Math.max;
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
    var klen=ks.length;
    var j1=j, j2=j+1, jn=j+n, jn1=j+n+1;
    j1 = min(max(j1, 0.0), klen-1);
    j2 = min(max(j2, 0.0), klen-1);
    jn = min(max(jn, 0.0), klen-1);
    jn1 = min(max(jn1, 0.0), klen-1);
    if (n===0) {
        return s>=ks[j1]&&s<ks[j2];
    }
    else {
      var A=s-ks[j1];
      var div=ks[jn]-ks[j1];
      div+=1e-05;
      A = (A/div)*basis(s, j, n-1, ks);
      var B=ks[jn1]-s;
      div = ks[jn1]-ks[j2];
      div+=1e-05;
      B = (B/div)*basis(s, j+1, n-1, ks);
      return A+B;
    }
  }
  basis = _es6_module.add_export('basis', basis);
  function uniform_basis_intern(s, j, n) {
    var ret=basis(s, j, n, uniform_vec);
    if (n==0) {
        return (s>=j&&s<j+1) ? 1.0 : 0.0;
    }
    else {
      var A=(s-j)/n;
      var B=(n+j+1-s)/n;
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
    var hash=s+j*100.0+n*10000.0;
    var ret=get_hash(hash);
    if (ret==undefined) {
        ret = uniform_basis_intern(s, j, n);
        set_hash(hash, ret);
    }
    return ret;
  }
  uniform_basis = _es6_module.add_export('uniform_basis', uniform_basis);
  var toHash2_stack=new Array(4096);
  var toHash2_stack_2=new Float64Array(4096);
  var toHash2_stack_3=new Float64Array(4096);
  var _str_prejit=new Array(4096);
  var strpre=8;
  var RNDLEN=1024;
  var rndtab=new Float64Array(RNDLEN);
  for (var i=0; i<rndtab.length; i++) {
      rndtab[i] = Math.random()*0.99999999;
  }
  function precheck(key) {
    var s1="";
    var seed=key.length%RNDLEN;
    seed = floor(rndtab[seed]*RNDLEN);
    var klen=key.length;
    for (var i=0; i<strpre; i++) {
        s1+=key[floor(rndtab[seed]*klen)];
        seed = (seed+1)%RNDLEN;
    }
    return s1;
  }
  var _vbuf=new Uint8Array(8);
  var _view=new DataView(_vbuf.buffer);
  var _fview=new Float32Array(_vbuf.buffer);
  var _iview=new Int32Array(_vbuf.buffer);
  var _sview=new Int16Array(_vbuf.buffer);
  function pack_float(f) {
    var s="";
    _fview[0] = f;
    for (var i=0; i<4; i++) {
        s+=String.fromCharCode(_vbuf[i]);
    }
    return s;
  }
  function pack_int(f) {
    var s="";
    _iview[0] = f;
    for (var i=0; i<4; i++) {
        s+=String.fromCharCode(_vbuf[i]);
    }
    return s;
  }
  function pack_short(f) {
    var s="";
    _sview[0] = f;
    for (var i=0; i<2; i++) {
        s+=String.fromCharCode(_vbuf[i]);
    }
    return s;
  }
  function pack_byte(f) {
    return String.fromCharCode(f);
  }
  var tiny_strpool={}
  var tiny_strpool_idgen=1;
  function pack_str(f) {
    var ret="";
    if (!(f in tiny_strpool)) {
        tiny_strpool[f] = tiny_strpool_idgen++;
    }
    return pack_short(tiny_strpool[f]);
  }
  var tiny_strpool2={}
  var tiny_strpool_idgen2=1;
  function pack_op(f) {
    var ret="";
    if (!(f in tiny_strpool2)) {
        tiny_strpool2[f] = tiny_strpool_idgen2++;
    }
    return pack_byte(tiny_strpool2[f]);
  }
  window.pack_float = pack_float;
  window.precheck = precheck;
  var _str_prehash={}
  var _str_idhash=window._str_idhash = {}
  var _str_idhash_rev=window._str_idhash_rev = {}
  var _str_idgen=0;
  function spool(hash) {
    if (hash in _str_idhash) {
        return _str_idhash[hash];
    }
    else {
      var ret=_str_idgen++;
      _str_idhash[hash] = ret;
      _str_idhash_rev[ret] = hash;
      return ret;
    }
  }
  function spool_len(id) {
    return _str_idhash_rev[id].length;
  }
  window.tot_symcls = 0.0;
  var KILL_ZEROS=true;
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
      if (typeof name_or_value=="number"||typeof name_or_value=="boolean") {
          this.value = name_or_value;
      }
      else 
        if (typeof name_or_value=="string"||__instance_of(name_or_value, String)) {
          this.name = name_or_value;
      }
    }
     binop(b, op) {
      if (typeof b=="string"||typeof b=="number"||typeof b=="boolean") {
          b = new symcls(b);
      }
      var ret=new symcls();
      var a=this;
      if (a.value!=undefined&&b.value!=undefined&&a.a==undefined&&b.a==undefined) {
          ret.value = eval(a.value+" "+op+" "+b.value);
          return ret;
      }
      ret.use_parens = true;
      ret.op = op;
      if (KILL_ZEROS&&a.value!=undefined&&a.value==0.0&&(op=="*"||op=="/")) {
          return sym(0);
      }
      else 
        if (KILL_ZEROS&&b.value!=undefined&&b.value==0.0&&(op=="*")) {
          return sym(0);
      }
      else 
        if (KILL_ZEROS&&this.a==undefined&&this.value==0.0&&op=="+") {
          return b.copy();
      }
      else 
        if (KILL_ZEROS&&b.a==undefined&&b.value==0.0&&(op=="+"||op=="-")) {
          return this.copy();
      }
      else 
        if (this.value==1.0&&op=="*"&&this.a==undefined) {
          return b.copy();
      }
      else 
        if (b.value==1.0&&(op=="*"||op=="/")&&b.a==undefined) {
          return this.copy();
      }
      if (this.b!=undefined&&this.b.value!=undefined&&b.value!=undefined&&op=="+") {
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
      if (this._hash==undefined) {
          this._hash = spool(this.toHash());
      }
      return this._hash;
    }
     index(arg1) {
      if (typeof arg1=="string"||__instance_of(arg1, String)||typeof arg1=="number"||typeof arg1=="boolean") {
          arg1 = sym(arg1);
      }
      else {
        arg1 = arg1.copy();
      }
      var ret=sym();
      ret.op = "i";
      ret.a = this.copy();
      ret.b = arg1;
      return ret;
    }
     func(fname, arg1) {
      if (typeof fname=="string"||__instance_of(fname, String)) {
          fname = sym(fname);
      }
      var ret=sym();
      if (arg1==undefined) {
          ret.a = fname.copy();
          ret.b = this.copy();
          ret.op = "c";
      }
      else {
        if (typeof arg1=="string"||__instance_of(arg1, String)||typeof arg1=="number"||typeof arg1=="boolean") {
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
      var ret=new symcls();
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
      if (this.a!=undefined) {
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
      if (this.a!=undefined) {
      }
    }
     toHash2() {
      var stack=toHash2_stack, stack2=toHash2_stack_2, top=0;
      var stack3=toHash2_stack_3;
      stack[top] = this;
      stack2[top] = 0;
      stack3[top] = 0;
      var ret="";
      var _i=0;
      while (top>=0) {
        if (_i>100000) {
            console.log("infinite loop!");
            break;
        }
        var item=stack[top];
        var stage=stack2[top];
        var start=stack3[top];
        top--;
        if (stage==0) {
            ret+=item.name+"|";
            ret+=(item.value!=undefined ? item.value : "")+"|";
            ret+=item.is_func+"|";
        }
        if (item.a!=undefined&&stage==0) {
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
          if (item.b!=undefined&&stage==1) {
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
      var ret="";
      if (this._last_h!=undefined) {
          return this._last_h;
      }
      ret+=pack_str(this.name);
      ret+=this.value!=undefined ? pack_short(this.value*15000) : "";
      ret+=pack_byte(this.is_func);
      if (this.a!=undefined) {
          ret+=pack_op(this.op);
          ret+=this.a.toHash3();
          ret+=this.b.toHash3();
      }
      this._last_h = ret;
      return ret;
    }
     toHash() {
      return this.toHash3();
      var ret="";
      if (this._last_h!=undefined) {
      }
      ret+=this.name+"|";
      ret+=(this.value!=undefined ? this.value : "")+"|";
      ret+=this.is_func+"|";
      if (this.a!=undefined) {
          ret+=this.op+"$";
          ret+=this.a.toHash()+"$";
          ret+=this.b.toHash()+"$";
      }
      this._last_h = ret;
      return ret;
    }
     toString() {
      if (this._toString!=undefined) {
          return this._toString;
      }
      var use_parens=this.use_parens;
      var use_parens=use_parens&&!(this.parent!=undefined&&(this.parent.op=="i"||this.parent.op=="c"||this.parent.op.length>2));
      use_parens = use_parens&&!(this.value!=undefined&&this.a==undefined);
      use_parens = use_parens&&!(this.name!=undefined&&this.name!=""&&this.a==undefined);
      var s=use_parens ? "(" : "";
      if (this.a!=undefined&&this.op=="i") {
          return ""+this.a+"["+this.b+"]";
      }
      else 
        if (this.a!=undefined&&this.is_func&&this.op!="c") {
          s+=""+this.op+"("+this.a+", "+this.b+")";
      }
      else 
        if (this.a!=undefined&&this.is_func&&this.op=="c") {
          s+=""+this.a+"("+this.b+")";
      }
      else 
        if (this.a!=undefined&&this.op!="p") {
          s+=""+this.a+" "+this.op+" "+this.b;
      }
      else 
        if (this.a!=undefined&&this.op=="p") {
          return "pow("+this.a+", "+this.b+")";
      }
      else 
        if (this.value!=undefined&&this.a==undefined) {
          s+=""+this.value;
      }
      else 
        if (this.name!=undefined&&this.name!="") {
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
      var key=n.hash();
      if (map.has(key)) {
          n.tag = symtags.get(map2.get(key));
          n.tag.key = key;
          n.tag.is_tag = true;
          n.key = key;
          if (root!=undefined&&n!==root) {
              if (!haskeys.has(root.key)) {
                  haskeys.set(root.key, new hashtable());
              }
              haskeys.get(root.key).set(key, 1);
          }
      }
      if (n.a!=undefined) {
          recurse2(n.a, root);
          recurse2(n.b, root);
      }
      return n;
    }
    return recurse2(n, root);
  }
  function optimize(tree) {
    tot_symcls = 0;
    var start_tree=tree.copy(true);
    function output() {
      console.log.apply(console, arguments);
    }
    function optimize_pass(tree, subpart_start_i) {
      if (subpart_start_i==undefined)
        subpart_start_i = 0;
      var subpart_i=subpart_start_i;
      var totstep=8;
      var curstage=1;
      output("begin optimization stage "+(curstage++)+" of "+totstep+". . .");
      var symtags=new hashtable();
      var map=new hashtable();
      var mapcount=new hashtable();
      function recurse(n, depth) {
        if (depth==undefined)
          depth = 0;
        if (n.a==undefined)
          return ;
        var hash;
        if (n.a!=undefined) {
            var str=n.toHash();
            if (str.length<25) {
                return ;
            }
        }
        if (depth>3) {
            hash = hash==undefined ? n.hash() : hash;
            map.set(hash, n.copy());
            if (!mapcount.has(hash)) {
                mapcount.set(hash, 0);
            }
            mapcount.set(hash, mapcount.get(hash)+1);
        }
        if (n.a!=undefined) {
            recurse(n.a, depth+1);
        }
        if (n.b!=undefined) {
            recurse(n.b, depth+1);
        }
      }
      recurse(tree);
      var keys=map.keys();
      keys.sort(function (a, b) {
        return -spool_len(a)*mapcount.get(a)+spool_len(b)*mapcount.get(b);
      });
      var map2=new hashtable();
      output("begin optimization stage "+(curstage++)+" of "+totstep+". . .");
      var keys3=[];
      var i2=0;
      var max_si=0;
      function next() {
        for (var i=0; i<keys.length; i++) {
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
      var haskeys=new hashtable();
      tree = recurse2_a(tree, undefined, map, haskeys, map2, subpart_i, symtags);
      var keys3=map2.keys();
      keys3.sort(function (a, b) {
        return -spool_len(a)*mapcount.get(a)+spool_len(b)*mapcount.get(b);
      });
      function recurse3(n, key) {
        if (n.a!=undefined) {
            if (n.a.tag!=undefined&&!n.a.is_tag&&n.a.key==key) {
                n.a.parent = undefined;
                n.a = n.a.tag;
                n.clear_toString();
            }
            else {
              recurse3(n.a, key);
            }
            if (n.b.tag!=undefined&&!n.b.is_tag&&n.b.key==key) {
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
      for (var i=0; i<keys3.length; i++) {
          tree = recurse3(tree, keys3[i]);
      }
      var exists=new hashtable();
      function recurse4(n, key) {
        if (n.is_tag) {
            exists.set(n.key, true);
        }
        if (n.is_tag&&n.key!=undefined&&n.key==key)
          return true;
        if (n.a!=undefined) {
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
      var last_time2=time_ms();
      var haskeys=new hashtable();
      window.haskeys = haskeys;
      for (var i=0; i<keys3.length; i++) {
          if (time_ms()-last_time2>500) {
              output("optimizing key", i+1, "of", keys3.length);
              last_time2 = time_ms();
          }
          var n=map.get(keys3[i]);
          var last_time=time_ms();
          for (var j=0; j<keys3.length; j++) {
              if (i==j)
                continue;
              if (time_ms()-last_time>500) {
                  output("  subkey part 1:", j+1, "of", keys3.length+", for", i+1);
                  last_time = time_ms();
              }
              recurse2_a(n, n, map, haskeys, map2, subpart_i, symtags);
          }
          for (var j=0; j<keys3.length; j++) {
              var key=keys3[j];
              if (i==j)
                continue;
              if (time_ms()-last_time>500) {
                  output("  subkey part 2", j+1, "of", keys3.length+", for", i+1);
                  last_time = time_ms();
              }
              if (haskeys.get(n.key)==undefined||!(haskeys.get(n.key).has(key)))
                continue;
              recurse3(n, keys3[j]);
              recurse4(n, keys3[j]);
              n.clear_toString();
          }
      }
      output("begin optimization stage "+(curstage++)+" of "+totstep+". . .");
      function tag(n, root) {
        if (n!=root&&n.is_tag) {
            var k=n.key;
            if (k==root.key) {
                output("Cycle!", k, root.key);
                throw RuntimeError("Cycle! "+k+", "+root.key);
                return ;
            }
            root.ins.set(n.key, 1);
            var id=map2.get(n.key);
            root.ins_ids.set(id, id);
        }
        if (n.a!=undefined) {
            tag(n.a, root);
            tag(n.b, root);
        }
      }
      output("begin optimization stage "+(curstage++)+" of "+totstep+". . .");
      var dag=[];
      window.dag = dag;
      function visit_n(k) {
        var n2=map.get(k);
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
        if (n.a!=undefined) {
            dagsort(n.a);
            dagsort(n.b);
        }
      }
      for (var i=0; i<keys3.length; i++) {
          var n=map.get(keys3[i]);
          n.is_root = true;
          n.ins = new hashtable();
          n.ins_ids = new hashtable();
          n.id = map2.get(keys3[i]);
      }
      for (var i=0; i<keys3.length; i++) {
          var n=map.get(keys3[i]);
          n._visit = n._done = false;
          n.key = keys3[i];
          tag(n, n);
      }
      for (var i=0; i<keys3.length; i++) {
          var n=map.get(keys3[i]);
          if (!n._done) {
              dagsort(n);
          }
      }
      var i1=0;
      var header="";
      for (var i=0; i<dag.length; i++) {
          var n=dag[i];
          var key=n.key;
          if (subpart_i>0||i>0)
            header+=", ";
          n.clear_toString();
          header+="\n    ";
          header+="SUBPART"+map2.get(key)+" = "+""+n;
      }
      header+="\n";
      var finals=header+""+tree;
      output("finished!");
      return [tree, finals, header, max_si];
    }
    var si=0;
    var header2="";
    var r=optimize_pass(tree, si);
    if (i>0&&header2.trim()!=""&&header2.trim()[header2.length-1]!=",")
      header2+=", ";
    header2+=r[2];
    tree = r[0].copy();
    si+=r[3]+1;
    header2 = header2.trim();
    if (header2.trim()!="")
      header2 = "var "+header2+";\n";
    var final2=header2+"\n  return "+tree+";\n";
    var ret=undefined, func;
    var code1="ret = function(s, j, n, ks, dvn) {"+final2+"};";
    code1 = splitline(code1);
    eval(code1);
    func = ret;
    var func2=undefined;
    var code2="ret = function(s, j, n, ks, dvn) {return "+(""+start_tree)+";};";
    code2 = splitline(code2);
    func = ret;
    eval(code2);
    return [func, func2, code1, code2, tree];
  }
  optimize = _es6_module.add_export('optimize', optimize);
  function get_cache(k, v) {
    var ret;
    try {
      ret = JSON.parse(myLocalStorage["_store_"+k]);
    }
    catch (error) {
        print_stack(error);
        return undefined;
    }
    if (ret=="undefined") {
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
    var x=sym("x");
    x = x.binop(2, "*");
    var degree=2, klen=10, j=2;
    var dvn=1;
    KILL_ZEROS = false;
    var tree=gen_basis_dv_code(j, degree, klen, dvn);
    var start_tree=tree.copy();
    KILL_ZEROS = true;
    tree = gen_basis_dv_code(j, degree, klen, dvn);
    window.tree_func = optimize(tree);
    var skey=""+j+"|"+degree+"|"+klen+"|"+dvn;
    store_cache(skey, tree_func[2]);
    var tst=new Float32Array(10);
    for (var i=0; i<tst.length; i++) {
        tst[i] = i;
    }
    var finals=tree_func[2];
    console.log("ratio: ", finals.replace(" ", "").replace("\n", "").length/(""+start_tree).replace(" ", "").replace("\n", "").length);
    window.test = function (s, j) {
      console.log("testing...");
      if (j==undefined)
        j = 3.0;
      var func=window.tree_func[0];
      var func2=basis_dv;
      var time1=0;
      var time2=0;
      var steps=250, steps2=10;
      for (var si=0; si<steps2; si++) {
          var start_time=time_ms();
          for (var i=0; i<steps; i++) {
              var r1=func(s+i*0.0001, j, degree, tst);
          }
          time1+=(time_ms()-start_time);
          var start_time=time_ms();
          for (var i=0; i<steps; i++) {
              var r2=func2(s+i*0.0001, j, degree, tst, dvn);
          }
          time2+=(time_ms()-start_time);
      }
      time1 = time1.toFixed(2)+"ms";
      time2 = time2.toFixed(2)+"ms";
      console.log(r1, r2, time1, time2);
      
    }
    var dv_test=""+tree;
    var dv_test2="";
    var ci=0;
    var set={"(": 0, 
    ")": 0, 
    "+": 0, 
    "/": 0, 
    "*": 0}
    for (var i=0; i<dv_test.length; i++, ci++) {
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
    var dv_test2="";
    var ci=0;
    var set={"(": 0, 
    ")": 0, 
    "+": 0, 
    "/": 0, 
    "*": 0}
    for (var i=0; i<dv_test.length; i++, ci++) {
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
    var s=sym("s");
    j = sym("j");
    var ks=sym("ks");
    return basis_sym_general(s, j, n, ks, gen_reduce);
  }
  gen_basis_code = _es6_module.add_export('gen_basis_code', gen_basis_code);
  function make_cache_table(maxknotsize, make_dvs) {
    var basis_caches1=new Array(12);
    for (var i=0; i<basis_caches1.length; i++) {
        var arr=new Array(maxknotsize);
        basis_caches1[i] = arr;
        for (var j=1; j<arr.length; j++) {
            arr[j] = new Array(j);
            if (make_dvs) {
                var arr2=arr[j];
                for (var k=0; k<arr2.length; k++) {
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
    for (var k in basis_json) {
        var k1=k;
        k = k.split("|");
        if (k.length<4)
          continue;
        console.log(k);
        if (k[1]==="7") {
            console.log("found!", k);
            var hash=""+0+"|"+7+"|"+2+"|"+k[3];
            myLocalStorage[hash] = basis_json[k1];
            var ret;
            console.log(hash, eval(basis_json[k1]));
        }
    }
  }
  window.save_local_storage = function () {
    var ret=JSON.stringify(myLocalStorage);
    var blob=new Blob([ret], {type: "application/binary"});
    var url=URL.createObjectURL(blob);
    console.log(url);
    window.open(url);
    return url;
  }
  function add_to_table_dv(j, n, klen, dvn, table) {
    var hash=""+0+"|"+n+"|"+2+"|"+dvn;
    var s=myLocalStorage[hash];
    if (s==undefined||s=="undefined") {
        var tree=gen_basis_dv_code(j, n, klen, dvn);
        s = optimize(tree)[2];
        console.log("storing basis function. . .");
        myLocalStorage[hash] = s;
    }
    var ret;
    eval(s);
    table[n][2][0][dvn] = ret;
    return ret;
  }
  var zero=function (a, b, c, d, e) {
    return 0.0;
  }
  function get_basis_dv_func(j, n, klen, dvn) {
    if (dvn<=0) {
        return zero;
    }
    var ret=basis_caches_dv[n][2][0][dvn];
    if (ret==undefined) {
        ret = add_to_table_dv(0, n, klen, dvn, basis_caches_dv);
    }
    return ret;
  }
  get_basis_dv_func = _es6_module.add_export('get_basis_dv_func', get_basis_dv_func);
  window.get_basis_dv_func = get_basis_dv_func;
  function compiled_basis_dv(s, j, n, ks, dvn) {
    var func=get_basis_dv_func(j, n, ks.length, dvn);
    return func(s, j, n, ks, dvn);
  }
  compiled_basis_dv = _es6_module.add_export('compiled_basis_dv', compiled_basis_dv);
  function gen_basis_dv_code(j, degree, klen, dv, gen_reduce) {
    var s=sym("s");
    var n=degree;
    j = sym("j");
    var ks=new Array(klen);
    for (var i=0; i<klen; i++) {
        ks[i] = gen_reduce ? sym("k"+(i+1)) : sym("ks").index(j);
    }
    ks = sym("ks");
    return basis_dv_sym(s, j, degree, ks, dv, gen_reduce);
  }
  gen_basis_dv_code = _es6_module.add_export('gen_basis_dv_code', gen_basis_dv_code);
  function get_basis_func(j, n, klen) {
    var KLEN=5;
    var ret=basis_caches[n][KLEN][j];
    if (ret===undefined) {
        var hash="bs:"+n;
        var s=myLocalStorage[hash];
        if (s===undefined||s==="undefined") {
            console.log("storing basis function. . .");
            var tree=gen_basis_code(j, n, klen);
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
    var func=get_basis_func(j, n, ks.length);
    return func(s, j, n, ks);
  }
  compiled_basis = _es6_module.add_export('compiled_basis', compiled_basis);
  window._sym_eps1 = 1e-09;
  window._sym_eps2 = 1e-06;
  window._sym_do_clamping = true;
  window._sym_more_symbolic = false;
  function basis_sym(s, j, n, ks, gen_reduce) {
    var klen=ks.length;
    var j1=j, j2=j+1, jn=j+n, jn1=j+n+1;
    j1 = _sym_do_clamping ? min(max(j1, 0.0), klen-1) : j1;
    j2 = _sym_do_clamping ? min(max(j2, 0.0), klen-1) : j2;
    jn = _sym_do_clamping ? min(max(jn, 0.0), klen-1) : jn;
    jn1 = _sym_do_clamping ? min(max(jn1, 0.0), klen-1) : jn1;
    if (n==0) {
        return sym("(s >= ks["+j1+"] && s < ks["+j2+"])");
    }
    else {
      var A=s.sub(ks[j1]);
      var div=ks[jn].sub(ks[j1]);
      var cancelA=div.binop(0.0, "!=");
      if (_sym_eps1!=0.0)
        div = div.add(_sym_eps1);
      A = A.mul(basis_sym(s, j, n-1, ks, gen_reduce)).div(div).mul(cancelA);
      var B=ks[jn1].sub(s);
      div = ks[jn1].sub(ks[j2]);
      var cancelB=div.binop(0.0, "!=");
      if (_sym_eps1!=0.0)
        div = div.add(_sym_eps1);
      B = B.mul(basis_sym(s, j+1, n-1, ks, gen_reduce)).div(div).mul(cancelB);
      return A.add(B);
    }
  }
  basis_sym = _es6_module.add_export('basis_sym', basis_sym);
  function basis_sym_general(s, j, n, ks, gen_reduce) {
    var j1, j2, jn1, kn2;
    if (_sym_do_clamping) {
        var j1=j.add(0).func("max", 0.0).func("min", sym("(ks.length-1)"));
        var j2=j.add(1).func("max", 0.0).func("min", sym("(ks.length-1)"));
        var jn=j.add(n).func("max", 0.0).func("min", sym("(ks.length-1)"));
        var jn1=j.add(n+1).func("max", 0.0).func("min", sym("(ks.length-1)"));
    }
    else {
      j1 = j, j2 = j.add(1), jn = j.add(n), jn1 = j.add(n+1);
    }
    if (_sym_more_symbolic&&n==1) {
        return sym("lin("+j1+","+j2+","+jn1+")");
    }
    else 
      if (_sym_more_symbolic&&n==0) {
        return j1.func("step", j2);
    }
    if (n==0) {
        var r1=s.binop(ks.index(j1), ">=");
        var r2=s.binop(ks.index(j2), "<");
        return r1.binop(r2, "&&");
        var r1=s.sub(ks.index(j1));
        var r2=ks.index(j2).sub(s);
        var r1=s.sub(ks.index(j1));
        var r2=ks.index(j2).sub(s);
        var eps1=1e-06;
        r1 = r1.add(eps1);
        r2 = r2.add(eps1);
        r1 = r1.div(r1.func("abs")).mul(0.5).add(0.5-eps1);
        r2 = r2.div(r2.func("abs")).mul(0.5).add(0.5+eps1);
    }
    else {
      var A=s.sub(ks.index(j1));
      var div=ks.index(jn).sub(ks.index(j1));
      var cancelA=div.binop(0.0, "!=");
      if (_sym_eps1!=undefined)
        div = div.add(_sym_eps1);
      A = A.mul(basis_sym_general(s, j, n-1, ks, gen_reduce)).div(div).mul(cancelA);
      var B=ks.index(jn1).sub(s);
      div = ks.index(jn1).sub(ks.index(j2));
      var cancelB=div.binop(0.0, "!=");
      if (_sym_eps1!=undefined)
        div = div.add(_sym_eps1);
      B = B.mul(basis_sym_general(s, j.add(1), n-1, ks, gen_reduce)).div(div).mul(cancelB);
      return A.add(B);
    }
  }
  basis_sym_general = _es6_module.add_export('basis_sym_general', basis_sym_general);
  function basis_dv_sym(s, j, n, ks, dvn, gen_reduce) {
    if (dvn==0) {
        return basis_sym_general(s, j, n, ks, gen_reduce);
    }
    var j1, j2, jn, jn1, j3, j4;
    if (_sym_do_clamping) {
        var j1=j.add(0).func("max", 0.0).func("min", sym("(ks.length-1)"));
        var j2=j.add(1).func("max", 0.0).func("min", sym("(ks.length-1)"));
        var jn=j.add(n).func("max", 0.0).func("min", sym("(ks.length-1)"));
        var jn1=j.add(n+1).func("max", 0.0).func("min", sym("(ks.length-1)"));
        var j3=j.add(2).func("max", 0.0).func("min", sym("(ks.length-1)"));
        var j4=j.add(3).func("max", 0.0).func("min", sym("(ks.length-1)"));
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
        var div1="(0.000+(ks["+j3+"])-(ks["+j2+"]))";
        var div2="(0.000+(ks["+j2+"])-(ks["+j1+"]))";
        var b="(s >= ks["+j2+"] && s < ks["+j3+"]) ? (-1.0/"+div1+") : 0.0";
        var s="(s >= ks["+j1+"] && s < ks["+j2+"]) ? (1.0/"+div2+") : ("+b+")";
        return sym("("+s+")");
        var r1=s.binop(ks.index(j1), ">=").binop(s.binop(ks.index(j2), "<"), "&&");
        var r2=s.binop(ks.index(j2), ">=").binop(s.binop(ks.index(j3), "<"), "&&");
        var ret=r1.sub(r2);
        var div1=ks.index(j2).sub(ks.index(j1));
        var div3=div1.add(div1.binop("0.0", "=="));
        var div2=ks.index(j3).sub(ks.index(j2));
        var div4=div2.add(div2.binop("0.0", "=="));
        var cancel=div2.binop("0.0", "==").mul(div1.binop("0.0", "=="));
        var r1=sym(1.0).div(div3).mul(div1.binop("0.0", "!="));
        var r2=sym(-1.0).div(div4).mul(div2.binop("0.0", "!="));
        var a=s.binop(ks.index(j1), ">=").binop(s.binop(ks.index(j2), "<"), "&&");
        var b=s.binop(ks.index(j2), ">=").binop(s.binop(ks.index(j3), "<"), "&&");
        return r1.mul(a).add(r2.mul(b));
        var ret=0.0;
        if (s>=ks[j1]&&s<ks[j2])
          ret = 1.0/(ks[j2]-ks[j1]);
        else 
          if (s>=ks[j2]&&s<ks[j3])
          ret = -1.0/(ks[j3]-ks[j2]);
    }
    else {
      var kj1=ks.index(j1);
      var kj2=ks.index(j2);
      var kjn=ks.index(jn);
      var kjn1=ks.index(jn1);
      kjn.add(_sym_eps2);
      if (!_sym_more_symbolic) {
          kj1 = kj1.sub(_sym_eps2);
          kj2 = kj2.sub(_sym_eps2);
          kjn = kjn.add(_sym_eps2);
          kjn1 = kjn1.add(_sym_eps2);
      }
      var div=kj1.sub(kjn).mul(kj2.sub(kjn1));
      var cancel=div.func("abs").binop(0.0001, ">=");
      if (!_sym_more_symbolic) {
          div = div.add(0.0);
      }
      var ret=(kj1.sub(s).mul(basis_dv_sym(s, j, n-1, ks, dvn, gen_reduce)).sub(basis_dv_sym(s, j, n-1, ks, dvn-1, gen_reduce).mul(dvn)));
      ret = ret.mul(kj2.sub(kjn1));
      var ret2=(kjn1.sub(s).mul(basis_dv_sym(s, j.add(1.0), n-1, ks, dvn)).sub(basis_dv_sym(s, j.add(1.0), n-1, ks, dvn-1, gen_reduce).mul(dvn)));
      ret2 = ret2.mul(kj1.sub(kjn));
      ret = ret.sub(ret2).div(div);
      return ret;
    }
  }
  basis_dv_sym = _es6_module.add_export('basis_dv_sym', basis_dv_sym);
  var _jit=[0.529914898565039, 0.36828512651845813, 0.06964468420483172, 0.7305932911112905, 0.5716458782553673, 0.8704596017487347, 0.4227079786360264, 0.5019868116360158, 0.8813679129816592, 0.1114522460848093, 0.6895110581535846, 0.6958548363763839, 0.3031193600036204, 0.37011902872473, 0.2962806692812592, 0.028554908465594053, 0.823489741422236, 0.46635359339416027, 0.32072878000326455, 0.790815538726747, 0.24832243379205465, 0.4548102973494679, 0.17482145293615758, 0.12876217160373926, 0.47663668682798743, 0.5577574144117534, 0.44505770644173026, 0.4608486376237124, 0.17487138183787465, 0.9557673167437315, 0.48691147728823125, 0.21344363503158092, 0.4561011800542474, 0.5500841496977955, 0.056078286841511726, 0.2025157359894365, 0.3545380241703242, 0.37520054122433066, 0.9240472037345171, 0.5759296049363911, 0.23126523662358522, 0.8160425815731287, 0.2655198322609067, 0.5174507955089211, 0.5305957165546715, 0.7498655256349593, 0.16992988483980298, 0.8977103955112398, 0.6693002553656697, 0.6586289645638317, 0.014608860714361072, 0.46719147730618715, 0.22958142310380936, 0.2482534891460091, 0.9248246876522899, 0.5719250738620758, 0.8759879691060632, 0.014760041143745184, 0.27814899617806077, 0.8179157497361302, 0.8425747095607221, 0.5784667218104005, 0.8781018694862723, 0.25768745923414826, 0.12491370760835707, 0.17019980889745057, 0.6778648062609136, 0.7985234088264406, 0.5552649961318821, 0.4146097879856825, 0.3286898732185364, 0.3871084579732269, 0.5073949920479208, 0.26263241469860077, 0.16050022304989398, 0.7419972626958042, 0.10826557059772313, 0.15192136517725885, 0.08435141341760755, 0.8828735174611211, 0.9579186830669641, 0.4730489938519895, 0.13362190243788064, 0.3206780105829239, 0.5988038030918688, 0.4641053748782724, 0.8168729823082685, 0.18584533245302737, 0.862093557137996, 0.5530180907808244, 0.9900481395889074, 0.5014054768253118, 0.5830419992562383, 0.31904217251576483, 0.285037521738559, 0.25403662770986557, 0.20903456234373152, 0.8835178036242723, 0.8222054259385914, 0.5918245937209576];
  window._jit = _jit;
  window._jit_cur = 0;
}, '/dev/fairmotion/src/curve/bspline.js');
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
    if (window.common!==undefined&&window.common.naclModule!==undefined) {
        var draw_id=window.push_solve(spline);
        return window.nacl_do_solve(sflags, spline, steps, gk, return_promise, draw_id);
    }
    else {
      return math.do_solve.apply(this, arguments);
    }
  }
  var native_api=es6_import(_es6_module, '../wasm/native_api.js');
  function do_solve() {
    if (DISABLE_SOLVE) {
        return ;
    }
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
    }
    else {
      ang = ks[KANGLE];
      scale = ks[KSCALE];
      start[0] = ks[KSTARTX];
      start[1] = ks[KSTARTY];
    }
    if (!angle_only) {
        var co=approx(s, ks, order);
        co.sub(start).rot2d(-ang).mulScalar(scale).add(v1);
        return eval_ret_vs.next().load(co);
    }
  }
  eval_curve = _es6_module.add_export('eval_curve', eval_curve);
  
}, '/dev/fairmotion/src/curve/spline_math.js');
es6_module_define('spline_math_hermite', ["./spline_base.js", "../path.ux/scripts/util/vectormath.js", "../core/toolops_api.js", "./solver.js"], function _spline_math_hermite_module(_es6_module) {
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
  var eval_curve_vs=cachering.fromConstructor(Vector2, 64);
  var _eval_start=new Vector2();
  function approx(s1, ks, order, dis, steps) {
    s1*=1.0-1e-07;
    if (steps==undefined)
      steps = INT_STEPS;
    var s=0, ds=s1/steps;
    var ds2=ds*ds, ds3=ds2*ds, ds4=ds3*ds;
    var ret=approx_ret_cache.next();
    ret[0] = ret[1] = 0.0;
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
