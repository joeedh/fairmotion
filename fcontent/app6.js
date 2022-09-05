
es6_module_define('ui_colorpicker', ["../path-controller/util/util.js", "../path-controller/util/events.js", "../core/ui.js", "../path-controller/util/vectormath.js", "../path-controller/toolsys/toolprop.js", "../core/ui_base.js"], function _ui_colorpicker_module(_es6_module) {
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


es6_module_define('ui_colorpicker2', ["../path-controller/util/events.js", "../config/const.js", "../path-controller/util/simple_events.js", "../path-controller/util/vectormath.js", "../core/ui.js", "../path-controller/toolsys/toolprop.js", "../core/ui_base.js", "../path-controller/util/colorutils.js", "../path-controller/util/util.js", "../screen/area_wrangler.js"], function _ui_colorpicker2_module(_es6_module) {
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
  var cmyk_to_rgb=es6_import_item(_es6_module, '../path-controller/util/colorutils.js', 'cmyk_to_rgb');
  var rgb_to_cmyk=es6_import_item(_es6_module, '../path-controller/util/colorutils.js', 'rgb_to_cmyk');
  var contextWrangler=es6_import_item(_es6_module, '../screen/area_wrangler.js', 'contextWrangler');
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
  function colorClipboardCopy() {
    let rgba=this.getRGBA();
    let r=rgba[0]*255;
    let g=rgba[1]*255;
    let b=rgba[2]*255;
    let a=rgba[3];
    let data=`rgba(${r.toFixed(4)}, ${g.toFixed(4)}, ${b.toFixed(4)}, ${a.toFixed(4)})`;
    cconst.setClipboardData("color", "text/plain", data);
  }
  function colorClipboardPaste() {
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
    let width2=width>>1;
    let height2=height>>1;
    let fieldsize2=fieldsize>>1;
    let hue=hsva[0];
    let hue_rgb=hsv_to_rgb(hue, 1.0, 1.0);
    let key=fieldsize+":"+width2+":"+height2+":"+hue.toFixed(5);
    if (key in fields)
      return fields[key];
    let size2=fieldsize2;
    let valpow=0.75;
    let image={width: width, 
    height: height, 
    image: new ImageData(fieldsize2, fieldsize2), 
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
        if (v===0)
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
        let pad=this._getPad();
        let w=this.canvas.width/dpi-pad*2.0;
        x-=pad;
        let h=x/w;
        h = Math.min(Math.max(h, 0.0), 1.0);
        this.hsva[0] = h;
        if (this.onchange) {
            this.onchange(this.hsva);
        }
        this._redraw();
      };
      this.addEventListener("keydown", (e) =>        {
        switch (e.keyCode) {
          case keymap["Left"]:
          case keymap["Right"]:
            let sign=e.keyCode===keymap["Left"] ? -1 : 1;
            this.hsva[0] = Math.min(Math.max(this.hsva[0]+0.05*sign, 0.0), 1.0);
            this._redraw();
            if (this.onchange) {
                this.onchange();
            }
            break;
        }
      });
      this.addEventListener("mousedown", (e) =>        {
        if (this.modalRunning) {
            return ;
        }
        e.preventDefault();
        let rect=this.canvas.getClientRects()[0];
        let x=e.clientX-rect.x, y=e.clientY-rect.y;
        setFromXY(x, y);
        this.pushModal({on_mousemove: (e) =>            {
            let rect=this.canvas.getClientRects()[0];
            let x=e.clientX-rect.x, y=e.clientY-rect.y;
            setFromXY(x, y);
          }, 
      on_mousedown: (e) =>            {
            this.popModal();
          }, 
      on_mouseup: (e) =>            {
            this.popModal();
          }, 
      on_keydown: (e) =>            {
            if (e.keyCode===keymap["Enter"]||e.keyCode===keymap["Escape"]||e.keyCode===keymap["Space"]) {
                this.popModal();
            }
          }});
      });
    }
    static  define() {
      return {tagname: "huefield-x", 
     style: "colorfield", 
     havePickClipboard: true}
    }
     getRGBA() {
      let rgb=hsv_to_rgb(this.hsva[0], this.hsva[1], this.hsva[2]);
      return new Vector4().loadXYZW(rgb[0], rgb[1], rgb[2], this.hsva[3]);
    }
     setRGBA(rgba) {
      let hsv=rgb_to_hsv(rgba[0], rgba[1], rgba[2]);
      this.hsva.loadXYZW(hsv[0], hsv[1], hsv[2], rgba[3]);
      this._redraw();
      if (this.onchange) {
          this.onchange(this.hsva);
      }
    }
     clipboardCopy() {
      colorClipboardCopy.apply(this, arguments);
    }
     clipboardPaste() {
      colorClipboardPaste.apply(this, arguments);
    }
     _getPad() {
      return Math.max(this.getDefault("circleSize"), 15);
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
      let rselector=~~(this._getPad()*dpi);
      let r_circle=this.getDefault("circleSize")*dpi;
      let w2=canvas.width, h2=canvas.height;
      w2-=rselector*2.0;
      g.drawImage(getHueField(w2, h2, dpi), 0, 0, w2, h2, rselector, 0, w2, h2);
      let x=this.hsva[0]*w2+rselector;
      let y=canvas.height*0.5;
      g.beginPath();
      g.arc(x, y, r_circle, -Math.PI, Math.PI);
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
      this.addEventListener("keydown", (e) =>        {
        switch (e.keyCode) {
          case keymap["Left"]:
          case keymap["Right"]:
{            let sign=e.keyCode===keymap["Left"] ? -1 : 1;
            this.hsva[1] = Math.min(Math.max(this.hsva[1]+0.05*sign, 0.0), 1.0);
            this._redraw();
            if (this.onchange) {
                this.onchange(this.hsva);
            }
            break;
}
          case keymap["Up"]:
          case keymap["Down"]:
{            let sign=e.keyCode===keymap["Down"] ? -1 : 1;
            this.hsva[2] = Math.min(Math.max(this.hsva[2]+0.05*sign, 0.0), 1.0);
            this._redraw();
            if (this.onchange) {
                this.onchange(this.hsva);
            }
            break;
}
        }
      });
      this.canvas.addEventListener("mousedown", (e) =>        {
        if (this.modalRunning) {
            return ;
        }
        e.preventDefault();
        let rect=this.canvas.getClientRects()[0];
        let x=e.clientX-rect.x, y=e.clientY-rect.y;
        setFromXY(x, y);
        this.pushModal({on_pointermove: function on_pointermove(e) {
            this.on_mousemove(e);
          }, 
      on_mousemove: (e) =>            {
            let rect=this.canvas.getClientRects()[0];
            if (rect===undefined) {
                return ;
            }
            let x=e.clientX-rect.x, y=e.clientY-rect.y;
            setFromXY(x, y);
          }, 
      on_mousedown: (e) =>            {
            this.popModal();
          }, 
      on_mouseup: (e) =>            {
            this.popModal();
          }, 
      on_keydown: (e) =>            {
            if (e.keyCode===keymap["Enter"]||e.keyCode===keymap["Escape"]||e.keyCode===keymap["Space"]) {
                this.popModal();
            }
          }});
      });
      this.canvas.addEventListener("touchstart", (e) =>        {
        if (this.modalRunning) {
            return ;
        }
        e.preventDefault();
        let rect=this.canvas.getClientRects()[0];
        let x=e.touches[0].clientX-rect.x, y=e.touches[0].clientY-rect.y;
        setFromXY(x, y);
        this.pushModal({on_mousemove: (e) =>            {
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
      on_touchmove: (e) =>            {
            let rect=this.canvas.getClientRects()[0];
            let x=e.touches[0].clientX-rect.x, y=e.touches[0].clientY-rect.y;
            setFromXY(x, y);
          }, 
      on_mousedown: (e) =>            {
            this.popModal();
          }, 
      on_touchcancel: (e) =>            {
            this.popModal();
          }, 
      on_touchend: (e) =>            {
            this.popModal();
          }, 
      on_mouseup: (e) =>            {
            this.popModal();
          }, 
      on_keydown: (e) =>            {
            if (e.keyCode===keymap["Enter"]||e.keyCode===keymap["Escape"]||e.keyCode===keymap["Space"]) {
                this.popModal();
            }
          }});
      });
    }
    static  define() {
      return {tagname: "satvalfield-x", 
     style: "colorfield", 
     havePickClipboard: true}
    }
     getRGBA() {
      let rgb=hsv_to_rgb(this.hsva[0], this.hsva[1], this.hsva[2]);
      return new Vector4().loadXYZW(rgb[0], rgb[1], rgb[2], this.hsva[3]);
    }
     setRGBA(rgba) {
      let hsv=rgb_to_hsv(rgba[0], rgba[1], rgba[2]);
      this.hsva.loadXYZW(hsv[0], hsv[1], hsv[2], rgba[3]);
      this.update(true);
      this._redraw();
      if (this.onchange) {
          this.onchange(this.hsva);
      }
    }
     clipboardCopy() {
      colorClipboardCopy.apply(this, arguments);
    }
     clipboardPaste() {
      colorClipboardPaste.apply(this, arguments);
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
          if (i%2===0) {
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
      this._lastThemeStyle = this.constructor.define().style;
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
    static  define() {
      return {tagname: "colorfield-x", 
     style: "colorfield"}
    }
     setCMYK(c, m, y, k) {
      let rgb=cmyk_to_rgb(c, m, y, k);
      let hsv=rgb_to_hsv(rgb[0], rgb[1], rgb[2]);
      this.setHSVA(hsv[0], hsv[1], hsv[2], this.hsva[3]);
    }
     getCMYK() {
      let rgb=hsv_to_rgb(this.hsva[0], this.hsva[1], this.hsva[2]);
      return rgb_to_cmyk(rgb[0], rgb[1], rgb[2]);
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
     getRGBA() {
      let rgb=hsv_to_rgb(this.hsva[0], this.hsva[1], this.hsva[2]);
      return new Vector4().loadXYZW(rgb[0], rgb[1], rgb[2], this.hsva[3]);
    }
     setRGBA(r, g, b, a=1.0, fire_onchange=true) {
      if (typeof r==="object") {
          g = r[1];
          b = r[2];
          a = r[3];
          r = r[0];
      }
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
     updateThemeOverride() {
      let theme=this.getStyleClass();
      if (theme===this._lastThemeStyle) {
          return false;
      }
      this._lastThemeStyle = theme;
      this.huefield.overrideClass(theme);
      this.satvalfield.overrideClass(theme);
      for (let i=0; i<3; i++) {
          this.flushSetCSS();
          this.flushUpdate();
      }
      return true;
    }
     update(force_update=false) {
      super.update();
      this.updateThemeOverride();
      let redraw=this.updateDPI(force_update, true);
      redraw = redraw||force_update;
      if (redraw) {
          this.satvalfield.update(true);
          this._redraw();
      }
    }
     setCSS() {
      super.setCSS();
      this.style["flex-grow"] = this.getDefault("flex-grow");
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
      this._lastThemeStyle = this.constructor.define().style;
    }
    get  hsva() {
      return this.field.hsva;
    }
    get  rgba() {
      return this.field.rgba;
    }
    set  description(val) {

    }
    static  setDefault(node) {
      let tabs, colorsPanel=node;
      if (node.getClassDefault("usePanels")) {
          let panel=colorsPanel = node.panel("Color");
          tabs = panel.tabs();
          panel.closed = true;
          panel.style["flex-grow"] = "unset";
          panel.titleframe.style["flex-grow"] = "unset";
      }
      else {
        tabs = node.tabs();
      }
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
      node.h.baseUnit = node.h.displayUnit = "none";
      node.s.baseUnit = node.s.displayUnit = "none";
      node.v.baseUnit = node.v.displayUnit = "none";
      node.a.baseUnit = node.a.displayUnit = "none";
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
      node.r.baseUnit = node.r.displayUnit = "none";
      node.g.baseUnit = node.g.displayUnit = "none";
      node.b.baseUnit = node.b.displayUnit = "none";
      node.a2.baseUnit = node.a2.displayUnit = "none";
      if (!node.getDefault("noCMYK")) {
          tab = tabs.tab("CMYK");
          let cmyk=node.getCMYK();
          let makeCMYKSlider=(label, idx) =>            {
            let slider=tab.slider(undefined, {name: label, 
        min: 0.0, 
        max: 1.0, 
        is_int: false, 
        defaultval: cmyk[idx], 
        callback: (e) =>                {
                let cmyk=node.getCMYK();
                cmyk[idx] = e.value;
                node.setCMYK(cmyk[0], cmyk[1], cmyk[2], cmyk[3]);
              }, 
        step: 0.001});
            slider.baseUnit = slider.displayUnit = "none";
            return slider;
          };
          node.cmyk = [makeCMYKSlider("C", 0), makeCMYKSlider("M", 1), makeCMYKSlider("Y", 2), makeCMYKSlider("K", 3)];
      }
      node._setSliders();
    }
    static  define() {
      return {tagname: "colorpicker-x", 
     style: "colorfield", 
     havePickClipboard: true, 
     copyForAllChildren: true, 
     pasteForAllChildren: true}
    }
     clipboardCopy() {
      colorClipboardCopy.apply(this, arguments);
    }
     clipboardPaste() {
      colorClipboardPaste.apply(this, arguments);
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
      if (this.cmyk) {
          let cmyk=this.field.getCMYK();
          for (let i=0; i<4; i++) {
              this.cmyk[i].setValue(cmyk[i], false);
          }
      }
      this.updateColorBox();
      if (!this._no_update_textbox) {
          this.cssText.text = color2web(this.field.rgba);
      }
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
     updateThemeOverride() {
      let theme=this.getStyleClass();
      if (theme===this._lastThemeStyle) {
          return false;
      }
      this._lastThemeStyle = theme;
      this.field.overrideClass(theme);
      this.flushSetCSS();
      this.flushUpdate();
      return true;
    }
     update() {
      this.updateThemeOverride();
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
     getCMYK() {
      return this.field.getCMYK();
    }
     setCMYK(c, m, y, k) {
      this.field.setCMYK(c, m, y, k);
      this._setSliders();
      this._setDataPath();
    }
     setHSVA(h, s, v, a) {
      this.field.setHSVA(h, s, v, a);
      this._setSliders();
      this._setDataPath();
    }
     getRGBA() {
      return this.field.getRGBA();
    }
     setRGBA(r, g, b, a) {
      this.field.setRGBA(r, g, b, a);
      this._setSliders();
      this._setDataPath();
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
      this._label = "error";
      this.customLabel = undefined;
      this.rgba = new Vector4([1, 1, 1, 1]);
      this.labelDom = document.createElement("span");
      this.labelDom.textContent = this._label;
      this.dom = document.createElement("canvas");
      this.g = this.dom.getContext("2d");
      this.shadow.appendChild(this.labelDom);
      this.shadow.appendChild(this.dom);
    }
    get  label() {
      return this._label;
    }
    set  label(val) {
      this._label = val;
      this.labelDom.textContent = val;
    }
    get  font() {
      return this._font;
    }
    set  font(val) {
      this._font = val;
      this.setCSS();
    }
    get  noLabel() {
      let ret=""+this.getAttribute("no-label");
      ret = ret.toLowerCase();
      return ret==="true"||ret==="yes"||ret==="on";
    }
    set  noLabel(v) {
      if (this.labelDom) {
          this.labelDom.hidden = true;
      }
      this.setAttribute("no-label", v ? "true" : "false");
    }
    static  define() {
      return {tagname: "color-picker-button-x", 
     style: "colorpickerbutton", 
     havePickClipboard: true}
    }
     init() {
      super.init();
      this._font = "DefaultText";
      let enter=(e) =>        {
        this._highlight = true;
        this._redraw();
      };
      let leave=(e) =>        {
        this._highlight = false;
        this._redraw();
      };
      this.addEventListener("pointerover", enter, {capture: true, 
     passive: true});
      this.addEventListener("pointerout", leave, {capture: true, 
     passive: true});
      this.addEventListener("focus", leave, {capture: true, 
     passive: true});
      this.addEventListener("mousedown", (e) =>        {
        e.preventDefault();
        this.click(e);
      });
      this.setCSS();
    }
     clipboardCopy() {
      colorClipboardCopy.apply(this, arguments);
    }
     clipboardPaste() {
      colorClipboardPaste.apply(this, arguments);
    }
     getRGBA() {
      return this.rgba;
    }
     click(e) {
      this.abortToolTips(4000);
      console.warn("CLICK COLORPICKER");
      this.blur();
      if (this.onclick) {
          this.onclick(e);
      }
      let colorpicker=this.ctx.screen.popup(this, this);
      let ctx=contextWrangler.makeSafeContext(this.ctx);
      colorpicker.ctx = ctx;
      colorpicker.useDataPathUndo = this.useDataPathUndo;
      let path=this.hasAttribute("datapath") ? this.getAttribute("datapath") : undefined;
      let widget=colorpicker.colorPicker(path, undefined, this.getAttribute("mass_set_path"));
      widget.ctx = ctx;
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
      if (this.noLabel&&this.labelDom.isConnected) {
          this.labelDom.remove();
      }
      if (this.customLabel!==undefined&&this.customLabel!==this._label) {
          this.label = this.customLabel;
      }
      for (let i=0; i<this.rgba.length; i++) {
          if (this.rgba[i]===undefined) {
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


es6_module_define('ui_container', ["../core/ui_base.js", "../path-controller/controller/controller.js", "../core/ui.js"], function _ui_container_module(_es6_module) {
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


es6_module_define('ui_curvewidget', ["../core/ui.js", "../path-controller/curve/curve1d.js", "../path-controller/util/vectormath.js", "../path-controller/toolsys/toolprop.js", "../core/ui_base.js", "../path-controller/curve/curve1d_utils.js", "../path-controller/util/util.js"], function _ui_curvewidget_module(_es6_module) {
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


es6_module_define('ui_dialog', ["../path-controller/util/simple_events.js", "../screen/ScreenArea.js"], function _ui_dialog_module(_es6_module) {
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
    sarea.flag|=AreaFlags.FLOATING|AreaFlags.INDEPENDENT;
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


es6_module_define('ui_lasttool', ["../path-controller/toolsys/toolprop.js", "../path-controller/util/util.js", "../config/const.js", "../core/ui.js", "../core/ui_base.js", "../path-controller/controller/controller.js", "../path-controller/toolsys/toolsys.js"], function _ui_lasttool_module(_es6_module) {
  var PackFlags=es6_import_item(_es6_module, '../core/ui_base.js', 'PackFlags');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var ColumnFrame=es6_import_item(_es6_module, '../core/ui.js', 'ColumnFrame');
  var PropTypes=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'PropTypes');
  var PropFlags=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'PropFlags');
  var UndoFlags=es6_import_item(_es6_module, '../path-controller/toolsys/toolsys.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../path-controller/toolsys/toolsys.js', 'ToolFlags');
  var DataPath=es6_import_item(_es6_module, '../path-controller/controller/controller.js', 'DataPath');
  var DataTypes=es6_import_item(_es6_module, '../path-controller/controller/controller.js', 'DataTypes');
  var ToolProperty=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'ToolProperty');
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
                tool.saveDefaultInputs();
                ctx.toolstack.rerun(tool);
            }
          }});
      }
      for (let k in tool.inputs) {
          let prop=tool.inputs[k];
          if (prop.flag&(PropFlags.PRIVATE|PropFlags.READ_ONLY)) {
              continue;
          }
          let uiname=prop.uiname;
          if (!uiname) {
              uiname = ToolProperty.makeUIName(k);
          }
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


es6_module_define('ui_listbox', ["../path-controller/toolsys/toolprop.js", "../path-controller/toolsys/toolsys.js", "../path-controller/util/util.js", "../core/ui_base.js", "../core/ui.js", "./ui_table.js", "../path-controller/util/vectormath.js", "../path-controller/util/events.js"], function _ui_listbox_module(_es6_module) {
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
     setCSS() {
      super.setCSS();
      this.setBackground();
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


es6_module_define('ui_menu', ["../path-controller/util/events.js", "../path-controller/util/simple_events.js", "./ui_button.js", "../path-controller/util/util.js", "../path-controller/toolsys/toolprop.js", "../core/ui_base.js", "../config/const.js"], function _ui_menu_module(_es6_module) {
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
  function debugmenu() {
    if (window.DEBUG&&window.DEBUG.menu) {
        console.warn("%cmenu:", "color:blue", ...arguments);
    }
  }
  class Menu extends UIBase {
     constructor() {
      super();
      this.parentMenu = undefined;
      this._was_clicked = false;
      this.items = [];
      this.autoSearchMode = true;
      this._ignoreFocusEvents = false;
      this.closeOnMouseUp = true;
      this._submenu = undefined;
      this.ignoreFirstClick = false;
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
    static  define() {
      return {tagname: "menu-x", 
     style: "menu"}
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
      if (this._was_clicked) {
          return ;
      }
      if (this.ignoreFirstClick) {
          this.ignoreFirstClick = Math.max(this.ignoreFirstClick-1, 0);
          return ;
      }
      if (!this.activeItem||this.activeItem._isMenu) {
          return ;
      }
      this._was_clicked = true;
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
      let dokey=(key) =>        {
        let val=this.getDefault(key);
        if (typeof val==="number") {
            val = ""+val+"px";
        }
        if (val!==undefined) {
            this.dom.style[key] = val;
        }
      };
      dokey("padding");
      dokey("padding-top");
      dokey("padding-left");
      dokey("padding-right");
      dokey("padding-bottom");
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
          dom.style["text-align"] = "left";
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
          item.parentMenu = this;
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
          let onclick=(e) =>            {
            onfocus(e);
            e.stopPropagation();
            e.preventDefault();
            if (this.activeItem!==undefined&&this.activeItem._isMenu) {
                return ;
            }
            this.click();
          };
          li.addEventListener("contextmenu", (e) =>            {
            return e.preventDefault();
          });
          this.addEventListener("contextmenu", (e) =>            {
            return e.preventDefault();
          });
          li.addEventListener("pointerup", onclick, {capture: true});
          li.addEventListener("click", onclick, {capture: true});
          li.addEventListener("pointerdown", onclick, {capture: true});
          li.addEventListener("focus", (e) =>            {
            onfocus(e);
            onfocus(e);
          });
          li.addEventListener("pointermove", (e) =>            {
            onfocus(e);
            li.focus();
          });
          li.addEventListener("mouseover", (e) =>            {
            onfocus(e);
            li.focus();
          });
          li.addEventListener("mouseenter", (e) =>            {
            onfocus(e);
            li.focus();
          });
          li.addEventListener("pointerover", (e) =>            {
            onfocus(e);
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
      let sepcss=this.getDefault("MenuSeparator");
      if (typeof sepcss==="object") {
          let s='';
          for (let k in sepcss) {
              let v=sepcss[k];
              if (typeof v==="number") {
                  v = v.toFixed(4)+"px";
              }
              s+=`    ${k}: ${v};\n`;
          }
          sepcss = s;
      }
      let itemRadius=0;
      if (this.hasDefault("item-radius")) {
          itemRadius = this.getDefault("item-radius");
      }
      else {
        itemRadius = this.getDefault("border-radius");
      }
      this.menustyle.textContent = `
        .menucon {
          position:fixed;
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
          
          border-radius : ${itemRadius}px;
          
          color : ${this.getDefault("MenuText").color};
          font : ${this.getDefault("MenuText").genCSS()};
          background-color: ${this.getDefault("MenuBG")};
        }
        
        .menuseparator {
          ${sepcss}
        }
        
        .menuitem:focus {
          display : flex;
          text-align: left;
          
          border : none;
          outline : none;
          border-radius : ${itemRadius}px;
          
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
      this.lockTimer = 0;
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
    get  searchMenuMode() {
      return this._searchMenuMode;
    }
    set  searchMenuMode(v) {
      this._searchMenuMode = v;
    }
    get  template() {
      return this._template;
    }
    set  template(v) {
      this._template = v;
    }
    get  value() {
      return this._value;
    }
    set  value(v) {
      this.setValue(v);
    }
    get  menu() {
      return this._menu;
    }
    set  menu(val) {
      this._menu = val;
      if (val!==undefined) {
          this._name = val.title;
          this.updateName();
      }
    }
    static  define() {
      return {tagname: "dropbox-x", 
     style: "dropbox"}
    }
     init() {
      super.init();
      this.setAttribute("menu-button", "true");
      this.updateWidth();
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
      let wasError=false;
      let prop, val;
      try {
        this.pushReportContext(this._reportCtxName);
        prop = this.ctx.api.resolvePath(this.ctx, this.getAttribute("datapath")).prop;
        val = this.ctx.api.getValue(this.ctx, this.getAttribute("datapath"));
        prop = prop ? prop.prop : undefined;
        this.popReportContext();
      }
      catch (error) {
          util.print_stack(error);
          wasError = true;
      }
      if (wasError) {
          this.disabled = true;
          this.setCSS();
          this._redraw();
          return ;
      }
      else {
        this.disabled = false;
        this.setCSS();
        this._redraw();
      }
      if (!prop) {
          return ;
      }
      if (this.prop===undefined) {
          this.prop = prop;
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
            let rdef=this.ctx.api.resolvePath(this.ctx, this.getAttribute("datapath"));
            let prop=rdef.dpath.data;
            callProp = !rdef||!rdef.dpath||!(__instance_of(rdef.dpath.data, ToolProperty));
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
      this.abortToolTips(1000);
      if (this._menu!==undefined) {
          this.lockTimer = util.time_ms();
          this._pressed = false;
          this._redraw();
          let menu=this._menu;
          this._menu = undefined;
          menu.close();
          return ;
      }
      if (util.time_ms()-this.lockTimer<200) {
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
        this.lockTimer = util.time_ms();
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
      let rheight=rects.height;
      x = rects.x-window.scrollX;
      y = rects.y+rheight-window.scrollY;
      if (!window.haveElectron) {
      }
      if (cconst.menusCanPopupAbove&&y>screen.size[1]*0.5&&!this.searchMenuMode) {
          let con=screen.popup(this, 500, 400, false, 0);
          con.style["z-index"] = "-10000";
          con.style["position"] = UIBase.PositionKey;
          document.body.appendChild(con);
          con.style["visibility"] = "hidden";
          con.add(menu);
          menu.start();
          let time=util.time_ms();
          let timer=window.setInterval(() =>            {
            if (util.time_ms()-time>1500) {
                window.clearInterval(timer);
                return ;
            }
            let r=menu.dom.getBoundingClientRect();
            if (!r||r.height<55) {
                return ;
            }
            window.clearInterval(timer);
            y-=r.height+rheight;
            menu.dom.remove();
            con.remove();
            let popup=this._popup = menu._popup = screen.popup(this, x, y, false, 0);
            popup.noMarginsOrPadding();
            popup.add(menu);
            menu.start();
            popup.style["left"] = x+"px";
            popup.style["top"] = y+"px";
          }, 1);
          return ;
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
          this.g.clearRect(0, 0, this.dom.width, this.dom.height);
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
  }
  _ESClass.register(DropBox);
  _es6_module.add_class(DropBox);
  DropBox = _es6_module.add_export('DropBox', DropBox);
  UIBase.internalRegister(DropBox);
  class MenuWrangler  {
     constructor() {
      this.screen = undefined;
      this.menustack = [];
      this.lastPickElemTime = util.time_ms();
      this._closetimer = 0;
      this.closeOnMouseUp = undefined;
      this.closereq = undefined;
      this.timer = undefined;
    }
    get  closetimer() {
      return this._closetimer;
    }
    set  closetimer(v) {
      debugmenu("set closertime", v);
      this._closetimer = v;
    }
    get  menu() {
      return this.menustack.length>0 ? this.menustack[this.menustack.length-1] : undefined;
    }
     pushMenu(menu) {
      debugmenu("pushMenu");
      this.spawnreq = undefined;
      if (this.menustack.length===0&&menu.closeOnMouseUp) {
          this.closeOnMouseUp = true;
      }
      this.menustack.push(menu);
    }
     popMenu(menu) {
      debugmenu("popMenu");
      return this.menustack.pop();
    }
     endMenus() {
      debugmenu("endMenus");
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
     on_pointerdown(e) {
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
     on_pointerup(e) {
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
     on_pointermove(e) {
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
      if (!element&&util.time_ms()-this.lastPickElemTime>250) {
          element = screen.pickElement(x, y);
          this.lastPickElemTime = util.time_ms();
      }
      if (element===undefined) {
          return ;
      }
      if (__instance_of(element, Menu)) {
          this.closetimer = util.time_ms();
          this.closereq = undefined;
          return ;
      }
      let destroy=element.hasAttribute("menu-button")&&element.hasAttribute("simple");
      destroy = destroy&&element.menu!==this.menu;
      if (destroy) {
          let menu2=this.menu;
          while (menu2!==element.menu) {
            menu2 = menu2.parentMenu;
            destroy = destroy&&(menu2===undefined||menu2!==element.menu);
          }
      }
      if (destroy) {
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
        if (w.hasAttribute("menu-button")&&w.menu===this.menu) {
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
        debugmenu("start menu wrangler interval");
        this.update();
      }, 150);
    }
     stopTimer() {
      if (this.timer) {
          debugmenu("stop menu wrangler interval");
          clearInterval(this.timer);
          this.timer = undefined;
      }
    }
  }
  _ESClass.register(MenuWrangler);
  _es6_module.add_class(MenuWrangler);
  MenuWrangler = _es6_module.add_export('MenuWrangler', MenuWrangler);
  let menuWrangler=window._menuWrangler = new MenuWrangler();
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
  window._startMenuEventWrangling = startMenuEventWrangling;
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
          let $_t0uboq=item, name=$_t0uboq.name, callback=$_t0uboq.callback, hotkey=$_t0uboq.hotkey, icon=$_t0uboq.icon, tooltip=$_t0uboq.tooltip;
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
    menuWrangler.endMenus();
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
    menu.flushUpdate();
    menu.flushSetCSS();
    menu._popup.flushUpdate();
    menu._popup.flushSetCSS();
  }
  startMenu = _es6_module.add_export('startMenu', startMenu);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_menu.js');


es6_module_define('ui_noteframe', ["../core/ui.js", "../core/ui_base.js", "../path-controller/util/util.js"], function _ui_noteframe_module(_es6_module) {
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
     setCSS() {
      super.setCSS(false);
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
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_noteframe.js');


es6_module_define('ui_numsliders', ["../core/ui.js", "../path-controller/util/simple_events.js", "../config/const.js", "../core/units.js", "../path-controller/util/vectormath.js", "../core/ui_theme.js", "../core/ui_base.js", "../path-controller/util/util.js", "./theme_editor.js", "./ui_widgets.js", "../path-controller/toolsys/toolprop.js"], function _ui_numsliders_module(_es6_module) {
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
  var NumberConstraints=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'NumberConstraints');
  var IntProperty=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'IntProperty');
  var eventWasTouch=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'eventWasTouch');
  var KeyMap=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'KeyMap');
  var keymap=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'keymap');
  var color2css=es6_import_item(_es6_module, '../core/ui_theme.js', 'color2css');
  var css2color=es6_import_item(_es6_module, '../core/ui_theme.js', 'css2color');
  var ThemeEditor=es6_import_item(_es6_module, './theme_editor.js', 'ThemeEditor');
  var Unit=es6_import_item(_es6_module, '../core/units.js', 'Unit');
  const sliderDomAttributes=new Set(["min", "max", "integer", "displayUnit", "baseUnit", "labelOnTop", "radix", "step", "expRate", "stepIsRelative", "decimalPlaces", "slideSpeed"]);
  _es6_module.add_export('sliderDomAttributes', sliderDomAttributes);
  function updateSliderFromDom(dom, slider) {
    if (slider===undefined) {
        slider = dom;
    }
    slider.loadNumConstraints(undefined, dom);
  }
  const SliderDefaults={stepIsRelative: false, 
   expRate: 1.0+1.0/3.0, 
   radix: 10, 
   decimalPlaces: 4, 
   baseUnit: "none", 
   displayUnit: "none", 
   slideSpeed: 1.0, 
   step: 0.1}
  _es6_module.add_export('SliderDefaults', SliderDefaults);
  function NumberSliderBase(cls, skip, defaults) {
    if (cls===undefined) {
        cls = UIBase;
    }
    if (skip===undefined) {
        skip = new Set();
    }
    if (defaults===undefined) {
        defaults = SliderDefaults;
    }
    skip = new Set(skip);
    return class NumberSliderBase extends cls {
       constructor() {
        super();
        for (let key of NumberConstraints) {
            if (skip.has(key)) {
                continue;
            }
            if (key in defaults) {
                this[key] = defaults[key];
            }
            else {
              this[key] = undefined;
            }
        }
      }
       loadNumConstraints(prop, dom) {
        return super.loadNumConstraints(prop, dom, this._redraw);
      }
    }
    _ESClass.register(NumberSliderBase);
    _es6_module.add_class(NumberSliderBase);
  }
  NumberSliderBase = _es6_module.add_export('NumberSliderBase', NumberSliderBase);
  class NumSlider extends NumberSliderBase(ValueButtonBase) {
     constructor() {
      super();
      this._highlight = undefined;
      this._last_label = undefined;
      this.mdown = false;
      this.ma = undefined;
      this.mpos = new Vector2();
      this.start_mpos = new Vector2();
      this._last_overarrow = false;
      this._name = "";
      this._value = 0.0;
      this.expRate = SliderDefaults.expRate;
      this.vertical = false;
      this._last_disabled = false;
      this.range = [-1e+17, 1e+17];
      this.isInt = false;
      this.editAsBaseUnit = undefined;
      this._redraw();
    }
    get  value() {
      return this._value;
    }
    set  value(val) {
      this.setValue(val);
    }
    get  name() {
      return this.getAttribute("name")||this._name;
    }
    set  name(name) {
      if (name===undefined||name===null) {
          this.removeAttribute("name");
      }
      else {
        this.setAttribute("name", name);
      }
    }
    static  define() {
      return {tagname: "numslider-x", 
     style: "numslider", 
     parentStyle: "button", 
     havePickClipboard: true}
    }
     updateDataPath() {
      if (!this.hasAttribute("datapath")) {
          return ;
      }
      let prop=this.getPathMeta(this.ctx, this.getAttribute("datapath"));
      if (!prop) {
          return ;
      }
      let name;
      if (this.hasAttribute("name")) {
          name = this.getAttribute("name");
      }
      else {
        name = ""+prop.uiname;
      }
      let updateConstraints=false;
      if (name!==this._name) {
          this._name = name;
          this.setCSS();
          updateConstraints = true;
      }
      let val=this.getPathValue(this.ctx, this.getAttribute("datapath"));
      if (val!==this._value) {
          updateConstraints = true;
      }
      if (updateConstraints) {
          this.loadNumConstraints(prop);
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
      updateSliderFromDom(this);
    }
     clipboardCopy() {
      console.log("Copy", ""+this.value);
      cconst.setClipboardData("value", "text/plain", ""+this.value);
    }
     clipboardPaste() {
      let data=cconst.getClipboardData("text/plain");
      console.log("Paste", data);
      if (typeof data=="object") {
          data = data.data;
      }
      let displayUnit=this.editAsBaseUnit ? undefined : this.displayUnit;
      let val=units.parseValue(data, this.baseUnit, displayUnit);
      if (typeof val==="number"&&!isNaN(val)) {
          this.setValue(val);
      }
    }
     swapWithTextbox() {
      let tbox=UIBase.createElement("textbox-x");
      if (this.modalRunning) {
          this.popModal();
      }
      this.mdown = false;
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
        e.preventDefault();
        if (this.disabled) {
            this.mdown = false;
            e.stopPropagation();
            return ;
        }
        if (e.button) {
            return ;
        }
        this.mdown = true;
        if (e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            this.swapWithTextbox();
        }
        else 
          if (this.overArrow(e.x, e.y)) {
            this._on_click(e);
        }
        else {
          this.dragStart(e);
          e.stopPropagation();
        }
      };
      this._on_click = (e) =>        {
        this.setMpos(e);
        if (this.disabled) {
            e.preventDefault();
            e.stopPropagation();
            return ;
        }
        let step;
        if (step = this.overArrow(e.x, e.y)) {
            if (e.shiftKey) {
                step*=0.1;
            }
            this.setValue(this.value+step);
        }
      };
      this.addEventListener("pointermove", (e) =>        {
        this.setMpos(e);
        if (this.mdown&&!this._modaldata&&this.mpos.vectorDistance(this.start_mpos)>13) {
            this.dragStart(e);
        }
      });
      this.addEventListener("dblclick", (e) =>        {
        this.setMpos(e);
        this.mdown = false;
        if (this.disabled||this.overArrow(e.x, e.y)) {
            e.preventDefault();
            e.stopPropagation();
            return ;
        }
        e.preventDefault();
        e.stopPropagation();
        this.swapWithTextbox();
      });
      this.addEventListener("pointerdown", (e) =>        {
        this.setMpos(e);
        if (this.disabled)
          return ;
        onmousedown(e);
      }, {capture: true});
      this.addEventListener("pointerup", (e) =>        {
        this.mdown = false;
      });
      this.addEventListener("pointerover", (e) =>        {
        this.setMpos(e);
        if (this.disabled)
          return ;
        if (!this._highlight) {
            this._highlight = true;
            this._repos_canvas();
            this._redraw();
        }
      });
      this.addEventListener("blur", (e) =>        {
        this._highlight = false;
        this.mdown = false;
      });
      this.addEventListener("pointerout", (e) =>        {
        this.setMpos(e);
        if (this.disabled)
          return ;
        this._highlight = false;
        this.dom._background = this.getDefault("background-color");
        this._repos_canvas();
        this._redraw();
      });
    }
     overArrow(x, y) {
      let r=this.getBoundingClientRect();
      let rwidth, rx;
      if (this.vertical) {
          rwidth = r.height;
          rx = r.y;
          x = y;
      }
      else {
        rwidth = r.width;
        rx = r.x;
      }
      x-=rx;
      let sz=this._getArrowSize();
      let szmargin=sz+cconst.numSliderArrowLimit;
      let step=this.step||0.01;
      if (this.isInt) {
          step = Math.max(step, 1);
      }
      if (isNaN(step)) {
          console.error("NaN step size", "step:", this.step, "numslider:", this._id);
          this.flash("red");
          step = this.isInt ? 1 : 0.1;
      }
      if (x<szmargin) {
          return -step;
      }
      else 
        if (x>rwidth-szmargin) {
          return step;
      }
      return 0;
    }
     doRange() {
      console.warn("Deprecated: NumSlider.prototype.doRange, use loadNumConstraints instead!");
      this.loadNumConstraints();
    }
     setValue(value, fire_onchange=true, setDataPath=true, checkConstraints=true) {
      value = Math.min(Math.max(value, this.range[0]), this.range[1]);
      this._value = value;
      if (this.hasAttribute("integer")) {
          this.isInt = true;
      }
      if (this.isInt) {
          this._value = Math.floor(this._value);
      }
      if (checkConstraints) {
          this.loadNumConstraints();
      }
      if (setDataPath&&this.ctx&&this.hasAttribute("datapath")) {
          this.setPathValue(this.ctx, this.getAttribute("datapath"), this._value);
      }
      if (fire_onchange&&this.onchange) {
          this.onchange(this.value);
      }
      this._redraw();
    }
     setMpos(e) {
      this.mpos[0] = e.x;
      this.mpos[1] = e.y;
      if (!this.mdown) {
          this.start_mpos[0] = e.x;
          this.start_mpos[1] = e.y;
      }
      let over=this.overArrow(e.x, e.y);
      if (over!==this._last_overarrow) {
          this._last_overarrow = over;
          this._redraw();
      }
    }
     dragStart(e) {
      this.mdown = false;
      if (this.disabled)
        return ;
      if (this.modalRunning) {
          console.log("modal already running for numslider", this);
          return ;
      }
      this.last_time = util.time_ms();
      let last_background=this.dom._background;
      let cancel;
      this.ma = new util.MovingAvg(eventWasTouch(e) ? 8 : 2);
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
     on_pointermove: (e) =>          {
          if (this.disabled)
            return ;
          e.preventDefault();
          e.stopPropagation();
          let x=this.ma.add(this.vertical ? e.y : e.x);
          let dx=x-startx;
          startx = x;
          if (util.time_ms()-this.last_time<35) {
              return ;
          }
          this.last_time = util.time_ms();
          if (e.shiftKey) {
              dx*=0.1;
          }
          dx*=this.vertical ? -1 : 1;
          sumdelta+=Math.abs(dx);
          value+=dx*this.step*0.1*this.slideSpeed;
          let dvalue=value-startvalue;
          let dsign=Math.sign(dvalue);
          let expRate=this.expRate;
          if (!this.hasAttribute("linear")) {
              dvalue = Math.pow(Math.abs(dvalue), expRate)*dsign;
          }
          this.value = startvalue+dvalue;
          this.updateWidth();
          this._redraw();
          fire();
        }, 
     on_pointerup: (e) =>          {
          this.setMpos(e);
          this.undoBreakPoint();
          cancel(false);
          e.preventDefault();
          e.stopPropagation();
        }, 
     on_pointerout: (e) =>          {
          last_background = this.getDefault("background-color");
          e.preventDefault();
          e.stopPropagation();
        }, 
     on_pointerover: (e) =>          {
          last_background = this.getDefault("BoxHighlight");
          e.preventDefault();
          e.stopPropagation();
        }, 
     on_pointerdown: (e) =>          {
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
      if (!this.hasAttribute("name")) {
          return ;
      }
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
      let boxbg=this.getDefault(this._highlight ? "BoxHighlight" : "background-color");
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
          arrowcolor = `rgba(${f},${f},${f},0.95)`;
      }
      arrowcolor = css2color(arrowcolor);
      let higharrow=css2color(this.getDefault("BoxHighlight"));
      higharrow.interp(arrowcolor, 0.5);
      arrowcolor = color2css(arrowcolor);
      higharrow = color2css(higharrow);
      let over=this._highlight ? this.overArrow(this.mpos[0], this.mpos[1]) : 0;
      let d=7, w=canvas.width, h=canvas.height;
      let sz=this._getArrowSize();
      if (this.vertical) {
          g.beginPath();
          g.moveTo(w*0.5, d);
          g.lineTo(w*0.5+sz*0.5, d+sz);
          g.lineTo(w*0.5-sz*0.5, d+sz);
          g.fillStyle = over<0 ? higharrow : arrowcolor;
          g.fill();
          g.beginPath();
          g.moveTo(w*0.5, h-d);
          g.lineTo(w*0.5+sz*0.5, h-sz-d);
          g.lineTo(w*0.5-sz*0.5, h-sz-d);
          g.fillStyle = over>0 ? higharrow : arrowcolor;
          g.fill();
      }
      else {
        g.beginPath();
        g.moveTo(d, h*0.5);
        g.lineTo(d+sz, h*0.5+sz*0.5);
        g.lineTo(d+sz, h*0.5-sz*0.5);
        g.fillStyle = over<0 ? higharrow : arrowcolor;
        g.fill();
        g.beginPath();
        g.moveTo(w-d, h*0.5);
        g.lineTo(w-sz-d, h*0.5+sz*0.5);
        g.lineTo(w-sz-d, h*0.5-sz*0.5);
        g.fillStyle = over>0 ? higharrow : arrowcolor;
        g.fill();
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
  class NumSliderSimpleBase extends NumberSliderBase(UIBase) {
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
      this.uiRange = undefined;
      this.step = 0.1;
      this._value = 0.5;
      this.ma = undefined;
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
     setValue(val, fire_onchange=true, setDataPath=true) {
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
          if (setDataPath&&this.getAttribute("datapath")) {
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
          this.loadNumConstraints(prop);
          this.setValue(val, true, false);
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
      this.ma = new util.MovingAvg(eventWasTouch(e) ? 4 : 2);
      let handlers;
      let end=() =>        {
        if (handlers===undefined) {
            return ;
        }
        this.popModal();
        handlers = undefined;
      };
      handlers = {pointermove: (e) =>          {
          let x=e.x, y=e.y;
          x = this.ma.add(x);
          let e2=new MouseEvent(e, {x: x, 
       y: y});
          this._setFromMouse(e);
        }, 
     pointerover: (e) =>          {        }, 
     pointerout: (e) =>          {        }, 
     pointerleave: (e) =>          {        }, 
     pointerenter: (e) =>          {        }, 
     blur: (e) =>          {        }, 
     focus: (e) =>          {        }, 
     pointerup: (e) =>          {
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
      for (let k in handlers) {
          handlers[k] = makefunc(handlers[k]);
      }
      this.pushModal(handlers);
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
      this.addEventListener("pointerdown", (e) =>        {
        if (this.disabled) {
            return ;
        }
        e.preventDefault();
        this._startModal(e);
      });
      this.addEventListener("pointerin", (e) =>        {
        this.setHighlight(e);
        this._redraw();
      });
      this.addEventListener("pointerout", (e) =>        {
        this.highlight = false;
        this._redraw();
      });
      this.addEventListener("pointerover", (e) =>        {
        this.setHighlight(e);
        this._redraw();
      });
      this.addEventListener("pointermove", (e) =>        {
        this.setHighlight(e);
        this._redraw();
      });
      this.addEventListener("pointerleave", (e) =>        {
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
      let range=this.uiRange||this.range;
      x = (x-boxw*0.5)/w2;
      x = x*(range[1]-range[0])+range[0];
      return x;
    }
     _getButtonPos() {
      let w=this.canvas.width;
      let dpi=UIBase.getDPI();
      let sh=~~(this.getDefault("SlideHeight")*dpi+0.5);
      let x=this._value;
      let range=this.uiRange||this.range;
      x = (x-range[0])/(range[1]-range[0]);
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
      if (this.modalRunning) {
          this.popModal();
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
    get  editAsBaseUnit() {
      return this.numslider.editAsBaseUnit;
    }
    set  editAsBaseUnit(v) {
      this.numslider.editAsBaseUnit = v;
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
    get  slideSpeed() {
      return this.numslider.slideSpeed;
    }
    set  slideSpeed(v) {
      this.numslider.slideSpeed = v;
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
      return this.numslider.displayUnit;
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
    }
     update() {
      this.updateLabelOnTop();
      super.update();
      this.updateDataPath();
      let redraw=false;
      updateSliderFromDom(this, this.numslider);
      updateSliderFromDom(this, this.textbox);
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
          this.textbox.setAttribute("datapath", this.getAttribute("datapath"));
      }
      if (this.hasAttribute("mass_set_path")) {
          this.numslider.setAttribute("mass_set_path", this.getAttribute("mass_set_path"));
          this.textbox.setAttribute("mass_set_path", this.getAttribute("mass_set_path"));
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


es6_module_define('ui_panel', ["../path-controller/util/util.js", "../path-controller/toolsys/toolprop.js", "../core/ui_base.js", "../path-controller/util/vectormath.js", "../path-controller/util/html5_fileapi.js", "./ui_widgets.js", "../core/ui.js"], function _ui_panel_module(_es6_module) {
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
      if (this.hasAttribute("label")) {
          this.setAttribute("label", v);
      }
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
      this.contents.clear();
      return this;
    }
     makeHeader() {
      let row=this.titleframe;
      let iconcheck=this.iconcheck;
      if (!iconcheck) {
          return ;
      }
      iconcheck.overrideDefault("padding", 0);
      iconcheck.noMarginsOrPadding();
      iconcheck.overrideDefault("highlight", {"background-color": iconcheck.getSubDefault("highlight", "background-color")});
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


es6_module_define('ui_progress', ["../path-controller/util/util.js", "../core/ui_base.js", "../path-controller/util/simple_events.js"], function _ui_progress_module(_es6_module) {
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


es6_module_define('ui_richedit', ["../path-controller/util/util.js", "../core/ui.js", "../core/ui_base.js", "../path-controller/util/simple_events.js", "./ui_textbox.js"], function _ui_richedit_module(_es6_module) {
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


es6_module_define('ui_table', ["./ui_curvewidget.js", "../core/ui.js", "../path-controller/util/util.js", "../path-controller/util/vectormath.js", "./ui_widgets.js", "../core/ui_base.js", "../path-controller/toolsys/toolprop.js"], function _ui_table_module(_es6_module) {
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
  const list=util.list;
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


es6_module_define('ui_tabs', ["../core/ui.js", "../path-controller/util/util.js", "../core/ui_base.js", "../path-controller/util/events.js", "../path-controller/util/vectormath.js"], function _ui_tabs_module(_es6_module) {
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
  class TabDragEvent extends PointerEvent {
  }
  _ESClass.register(TabDragEvent);
  _es6_module.add_class(TabDragEvent);
  class TabItem extends UIBase {
     constructor() {
      super();
      this.name = name;
      this.icon = undefined;
      this.tooltip = "";
      this.movable = true;
      this.tbar = undefined;
      this.ontabclick = null;
      this.ontabdragstart = null;
      this.ontabdragmove = null;
      this.ontabdragend = null;
      let helper=(key) =>        {
        let key2="on"+key;
        this.addEventListener(key, (e) =>          {
          if (this[key2]) {
              return this[key2](e);
          }
        });
      };
      helper("tabclick");
      helper("tabdragstart");
      helper("tabdragmove");
      helper("tabdragend");
      this.dom = undefined;
      this.extra = undefined;
      this.extraSize = undefined;
      this.size = new Vector2();
      this.pos = new Vector2();
      this.abssize = new Vector2();
      this.abspos = new Vector2();
      this.addEventListener("pointerdown", (e) =>        {
        this.parentWidget.on_pointerdown(e);
      });
      this.addEventListener("pointermove", (e) =>        {
        this.parentWidget.on_pointermove(e);
      });
      this.addEventListener("pointerup", (e) =>        {
        this.parentWidget.on_pointerup(e);
      });
    }
    static  define() {
      return {tagname: "tab-item-x"}
    }
     sendEvent(type, forwardEvent) {
      let cls;
      if (type==="tabdragstart"||type==="tabdragend") {
          cls = TabDragEvent;
      }
      else 
        if (forwardEvent&&__instance_of(forwardEvent, Event)) {
          cls = forwardEvent.constructor;
      }
      else {
        cls = PointerEvent;
      }
      let e2={};
      if (forwardEvent) {
          for (let k in forwardEvent) {
              if (k==="defaultPrevented"||k==="cancelBubble") {
                  continue;
              }
              e2[k] = forwardEvent[k];
          }
      }
      e2.target = this;
      e2 = new cls(type, e2);
      this.dispatchEvent(e2);
      return e2;
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
     setCSS() {
      let dpi=UIBase.getDPI();
      let x=this.pos[0]/dpi;
      let y=this.pos[1]/dpi;
      let w=this.size[0]/dpi;
      let h=this.size[1]/dpi;
      this.style["background-color"] = "transparent";
      this.style["margin"] = this.style["padding"] = "0px";
      this.style["position"] = "absolute";
      this.style["pointer-events"] = "auto";
      this.style["left"] = x+"px";
      this.style["top"] = y+"px";
      this.style["width"] = w+"px";
      this.style["height"] = h+"px";
    }
  }
  _ESClass.register(TabItem);
  _es6_module.add_class(TabItem);
  TabItem = _es6_module.add_export('TabItem', TabItem);
  UIBase.internalRegister(TabItem);
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
      this.finished = false;
    }
     finish() {
      if (debug)
        if (debug)
        console.log("finish");
      if (this.finished) {
          return ;
      }
      this.finished = true;
      if (this.tbar.tool===this) {
          this.tbar.tool = undefined;
      }
      this.popModal(this.dom);
      this.tbar.update(true);
    }
     popModal() {
      if (this.dragcanvas!==undefined) {
          this.dragcanvas.remove();
      }
      let ret=super.popModal(...arguments);
      this.tab.sendEvent("tabdragend");
      return ret;
    }
     on_pointerleave(e) {

    }
     on_pointerenter(e) {

    }
     on_pointerenter(e) {

    }
     on_pointerstart(e) {

    }
     on_pointerend(e) {

    }
     on_pointerdown(e) {
      this.finish();
    }
     on_pointercancel(e) {
      this.finish();
    }
     on_pointerup(e) {
      this.finish();
    }
     on_pointermove(e) {
      return this._on_move(e, e.x, e.y);
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
          this.dragcanvas.style["position"] = UIBase.PositionKey;
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
      if (next!==undefined&&next.movable&&tab.pos[axis]>next.pos[axis]) {
          tbar.swapTabs(tab, next);
      }
      else 
        if (prev!==undefined&&prev.movable&&tab.pos[axis]<prev.pos[axis]+prev.size[axis]*0.5) {
          tbar.swapTabs(tab, prev);
      }
      tbar.update(true);
      this.mpos[0] = x;
      this.mpos[1] = y;
      let e2=tab.sendEvent("tabdragmove", e);
      if (e2.defaultPrevented) {
          this.finish();
      }
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
      this.r = this.getDefault("TabBarRadius", undefined, 8);
      this.canvas = canvas;
      this.g = canvas.getContext("2d");
      this.canvas.style["touch-action"] = "none";
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
      this.canvas.addEventListener("pointermove", (e) =>        {
        this.on_pointermove(e);
      }, false);
      this.canvas.addEventListener("pointerdown", (e) =>        {
        this.on_pointerdown(e);
      });
    }
     _doelement(e, mx, my) {
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
    }
     _domouse(e) {
      let r=this.canvas.getClientRects()[0];
      let mx=e.x-r.x;
      let my=e.y-r.y;
      let dpi=this.getDPI();
      mx*=dpi;
      my*=dpi;
      this._doelement(e, mx, my);
      const is_mdown=e.type==="mousedown";
      if (is_mdown&&this.onselect&&this._fireOnSelect().defaultPrevented) {
          e.preventDefault();
      }
    }
     _doclick(e) {
      this._domouse(e);
      if (e.defaultPrevented) {
          return ;
      }
      if (debug)
        console.log("mdown");
      if (e.button!==0) {
          return ;
      }
      let ht=this.tabs.highlight;
      let acte={};
      for (let k in e) {
          if (k==="defaultPrevented"||k==="cancelBubble") {
              continue;
          }
          acte[k] = e[k];
      }
      acte.target = ht;
      acte.pointerId = e.pointerId;
      acte = new PointerEvent("tabactive", acte);
      let e2=ht.sendEvent("tabclick", e);
      if (e2.defaultPrevented) {
          acte.preventDefault();
      }
      if (ht!==undefined&&this.tool===undefined) {
          this.setActive(ht, acte);
          if (this.movableTabs&&!acte.defaultPrevented) {
              this._startMove(ht, e);
          }
          e.preventDefault();
          e.stopPropagation();
      }
    }
     on_pointerdown(e) {
      this._doclick(e);
    }
     on_pointermove(e) {
      let r=this.canvas.getClientRects()[0];
      this._domouse(e);
      e.preventDefault();
      e.stopPropagation();
    }
     on_pointerup(e) {

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
     _ensureNoModal() {
      if (this.tool) {
          this.tool.finish();
          this.tool = undefined;
      }
    }
    get  tool() {
      return this._tool;
    }
    set  tool(v) {
      this._tool = v;
    }
     _startMove(tab=this.tabs.active, event, pointerId=event ? event.pointerId : undefined, pointerElem=tab) {
      if (this.movableTabs) {
          let e2=tab.sendEvent("tabdragstart", event);
          if (e2.defaultPrevented) {
              return ;
          }
          if (this.tool) {
              this.tool.finish();
          }
          let edom=this.getScreen();
          let tool=this.tool = new ModalTabMove(tab, this, edom);
          if (event&&pointerElem&&pointerId!==undefined) {
              tool.pushPointerModal(pointerElem, pointerId);
          }
          else {
            tool.pushModal(edom, false);
          }
      }
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
          }
          t.remove();
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
      try {
        if (active!==undefined) {
            this.setActive(active);
        }
        else 
          if (this.tabs.length>0) {
            this.setActive(this.tabs[0]);
        }
      }
      catch (error) {
          util.print_stack(error);
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
      let tab=UIBase.createElement("tab-item-x", true);
      this.shadow.appendChild(tab);
      tab.parentWidget = this;
      tab.name = name;
      tab.id = id;
      tab.tooltip = tooltip;
      tab.movable = movable;
      tab.tbar = this;
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
              tab.dom.style["position"] = UIBase.PositionKey;
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
      for (let tab of this.tabs) {
          tab.setCSS();
      }
    }
     setActive(tab, event) {
      if (tab.noSwitch) {
          return ;
      }
      let update=tab!==this.tabs.active;
      this.tabs.active = tab;
      if (update) {
          if (this.onchange)
            this.onchange(tab, event);
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
      this.style["contain"] = "layout";
      this.r = this.getDefault("TabBarRadius", undefined, 8);
      let r=this.r!==undefined ? this.r : 3;
      this.style["touch-action"] = "none";
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
      this.tbar.onchange = (tab, event) =>        {
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
            this.onchange(tab, event);
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
    get  hideScrollBars() {
      let attr=(""+this.getAttribute("hide-scrollbars")).toLowerCase();
      return attr==="true"||attr==="yes";
    }
    set  hideScrollBars(val) {
      val = !!val;
      this.setAttribute("hide-scrollbars", ""+val);
    }
    static  setDefault(e) {
      e.setAttribute("bar_pos", "top");
      return e;
    }
    static  define() {
      return {tagname: "tabcontainer-x", 
     style: "tabs"}
    }
     _startMove(tab=this.tbar.tabs.active, event) {
      return this.tbar._startMove(tab, event);
    }
     _ensureNoModal() {
      return this.tbar._ensureNoModal();
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
      col.noSwitch = function () {
        this._tab.noSwitch = true;
        return this;
      };
      function defineTabEvent(key) {
        key = "on"+key;
        Object.defineProperty(col, key, {get: function get() {
            return this._tab[key];
          }, 
      set: function set(v) {
            this._tab[key] = v;
          }});
      }
      defineTabEvent("tabclick");
      defineTabEvent("tabdragmove");
      defineTabEvent("tabdragstart");
      defineTabEvent("tabdragend");
      return col;
    }
     setActive(tab) {
      if (typeof tab==="string") {
          tab = this.getTab(tab);
      }
      if (!tab) {
          return ;
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
      throw new Error("Unknown tab "+name_or_id);
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
     getActive() {
      return this.tbar.tabs.active;
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
      let act=this.tbar.tabs.active;
      if (act&&!this.hideScrollBars) {
          let container=this.tabs[act.id];
          if (container.hasAttribute("overflow-y")&&this.style["overflow-y"]!==container.getAttribute("overflow-y")) {
              this.style["overflow-y"] = container.getAttribute("overflow-y");
          }
          else 
            if (!container.hasAttribute("overflow-y")) {
              this.style["overflow-y"] = this.getDefault("overflow-y")||"unset";
          }
          if (container.hasAttribute("overflow")&&this.style["overflow"]!==container.getAttribute("overflow")) {
              this.style["overflow"] = container.getAttribute("overflow");
          }
          else 
            if (!container.hasAttribute("overflow")) {
              this.style["overflow"] = this.getDefault("overflow")||"unset";
          }
      }
      else 
        if (this.hideScrollBars) {
          this.style["overflow"] = this.style["overflow-y"] = "unset";
      }
    }
  }
  _ESClass.register(TabContainer);
  _es6_module.add_class(TabContainer);
  TabContainer = _es6_module.add_export('TabContainer', TabContainer);
  UIBase.internalRegister(TabContainer);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_tabs.js');


es6_module_define('ui_textbox', ["../path-controller/util/events.js", "../path-controller/util/util.js", "./ui_button.js", "../path-controller/util/vectormath.js", "../config/const.js", "../core/units.js", "../path-controller/toolsys/toolprop.js", "../core/ui_base.js"], function _ui_textbox_module(_es6_module) {
  "use strict";
  var units=es6_import(_es6_module, '../core/units.js');
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var Vector2=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector4');
  var Matrix4=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Matrix4');
  var Quat=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Quat');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../path-controller/util/events.js');
  var toolprop=es6_import(_es6_module, '../path-controller/toolsys/toolprop.js');
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
  var _setTextboxClass=es6_import_item(_es6_module, '../core/ui_base.js', '_setTextboxClass');
  class TextBoxBase extends UIBase {
    static  define() {
      return {modalKeyEvents: true}
    }
  }
  _ESClass.register(TextBoxBase);
  _es6_module.add_class(TextBoxBase);
  TextBoxBase = _es6_module.add_export('TextBoxBase', TextBoxBase);
  class TextBox extends TextBoxBase {
     constructor() {
      super();
      this._width = this.getDefault("width")+"px";
      this._textBoxEvents = true;
      let margin=Math.ceil(3*this.getDPI());
      this._had_error = false;
      this.decimalPlaces = undefined;
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
        console.log("Textbox focus", this.isModal);
        this._focus = 1;
        if (this.isModal) {
            this._startModal();
            this.setCSS();
        }
      });
      this.dom.addEventListener("blur", (e) =>        {
        console.log("Textbox blur");
        this._focus = 0;
        if (this._modal) {
            this._endModal(true);
            this.setCSS();
        }
      });
    }
    get  realtime() {
      let ret=this.getAttribute("realtime");
      if (!ret) {
          return true;
      }
      ret = ret.toLowerCase().trim();
      return ret==='yes'||ret==='true'||ret==='on';
    }
    set  realtime(val) {
      this.setAttribute('realtime', val ? 'true' : 'false');
    }
    get  isModal() {
      let ret=this.getAttribute("modal");
      if (!ret) {
          return false;
      }
      ret = ret.toLowerCase().trim();
      return ret==='yes'||ret==='true'||ret==='on';
    }
    set  isModal(val) {
      this.setAttribute('modal', val ? 'true' : 'false');
    }
     _startModal() {
      console.warn("textbox modal");
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
          e.stopPropagation();
        }, 
     on_keydown: keydown, 
     on_keypress: keydown, 
     on_keyup: keydown, 
     on_mousedown: (e) =>          {
          e.stopPropagation();
          console.log("mouse down", e, e.x, e.y);
        }}, false);
    }
     _flash_focus() {

    }
     _endModal(ok) {
      console.log("textbox end modal");
      this._modal = false;
      this.popModal();
      this.blur();
      if (this.onend) {
          this.onend(ok);
      }
      else {
        this._updatePathVal(this.dom.value);
      }
      this.blur();
    }
    get  tabIndex() {
      return this.dom.tabIndex;
    }
    set  tabIndex(val) {
      this.dom.tabIndex = val;
    }
     init() {
      super.init();
      if (!this.hasAttribute('modal')) {
          this.isModal = true;
      }
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
      this.overrideDefault("background-color", this.getDefault("background-color"));
      this.background = this.getDefault("background-color");
      this.dom.style["margin"] = this.dom.style["padding"] = "0px";
      if (this.getDefault("background-color")) {
          this.dom.style["background-color"] = this.getDefault("background-color");
      }
      if (this._focus) {
          this.dom.style["border"] = `2px dashed ${this.getDefault('focus-border-color')}`;
      }
      else {
        this.dom.style["border"] = "none";
      }
      if (this.style["font"]) {
          this.dom.style["font"] = this.style["font"];
      }
      else {
        this.dom.style["font"] = this.getDefault("DefaultText").genCSS();
        this.dom.style["color"] = this.getDefault("DefaultText").color;
      }
      this.dom.style["width"] = "100%";
      this.dom.style["height"] = "100%";
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
          this.internalDisabled = true;
          return ;
      }
      else {
        this.internalDisabled = false;
      }
      let prop=this.getPathMeta(this.ctx, this.getAttribute("datapath"));
      let text=this.text;
      if (!prop) {
          console.error("datapath error "+this.getAttribute("datapath"), val);
          return ;
      }
      let is_num=prop.type&(PropTypes.FLOAT|PropTypes.INT);
      if (typeof val==="number"&&(prop.type&(PropTypes.VEC2|PropTypes.VEC3|PropTypes.VEC4|PropTypes.QUAT))) {
          is_num = true;
      }
      if (is_num) {
          let is_int=prop.type===PropTypes.INT;
          this.radix = prop.radix;
          let decimalPlaces=this.decimalPlaces!==undefined ? this.decimalPlaces : prop.decimalPlaces;
          if (this.hasAttribute("decimalPlaces")) {
              decimalPlaces = parseInt(this.getAttribute("decimalPlaces"));
          }
          let baseUnit=this.baseUnit??prop.baseUnit;
          if (this.hasAttribute("baseUnit")) {
              baseUnit = this.getAttribute("baseUnit");
          }
          let displayUnit=this.displayUnit??prop.displayUnit;
          if (this.hasAttribute("displayUnit")) {
              displayUnit = this.getAttribute("displayUnit");
          }
          if (is_int&&this.radix===2) {
              text = val.toString(this.radix);
              text = "0b"+text;
          }
          else 
            if (is_int&&this.radix===16) {
              text+="h";
          }
          else {
            text = units.buildString(val, baseUnit, decimalPlaces, displayUnit);
          }
      }
      else 
        if (prop!==undefined&&prop.type===PropTypes.STRING) {
          text = val;
      }
      if (this.text!==text) {
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
     style: "textbox", 
     modalKeyEvents: true}
    }
    get  text() {
      return this.dom.value;
    }
    set  text(value) {
      this.dom.value = value;
    }
     _prop_update(prop, text) {
      let is_num=prop.type&(PropTypes.FLOAT|PropTypes.INT);
      let val=this.getPathValue(this.ctx, this.getAttribute("datapath"));
      if (typeof val==="number"&&(prop.type&(PropTypes.VEC2|PropTypes.VEC3|PropTypes.VEC4|PropTypes.QUAT))) {
          is_num = true;
      }
      if (is_num) {
          let is_int=prop.type===PropTypes.INT;
          this.radix = prop.radix;
          let decimalPlaces=this.decimalPlaces!==undefined ? this.decimalPlaces : prop.decimalPlaces;
          if (this.hasAttribute("decimalPlaces")) {
              decimalPlaces = parseInt(this.getAttribute("decimalPlaces"));
          }
          let baseUnit=this.baseUnit??prop.baseUnit;
          if (this.hasAttribute("baseUnit")) {
              baseUnit = this.getAttribute("baseUnit");
          }
          let displayUnit=this.displayUnit??prop.displayUnit;
          if (this.hasAttribute("displayUnit")) {
              displayUnit = this.getAttribute("displayUnit");
          }
          if (!units.isNumber(text.trim())) {
              this.flash(ui_base.ErrorColors.ERROR, this.dom, undefined, false);
              this.focus();
              this.dom.focus();
              this._had_error = true;
          }
          else {
            let val=units.parseValue(text, baseUnit, displayUnit);
            if (this._had_error) {
                this.flash(ui_base.ErrorColors.OK, this.dom, undefined, false);
            }
            this._had_error = false;
            this.setPathValue(this.ctx, this.getAttribute("datapath"), val);
          }
      }
      else 
        if (prop.type===PropTypes.STRING) {
          try {
            this.setPathValue(this.ctx, this.getAttribute("datapath"), this.text);
            if (this._had_error) {
                this.flash(ui_base.ErrorColors.OK, this.dom, undefined, false);
                this.dom.focus();
            }
            this._had_error = false;
          }
          catch (error) {
              console.log(error.stack);
              console.log(error.message);
              console.warn("textbox error!");
              this.flash(ui_base.ErrorColors.ERROR, this.dom, undefined, false);
              this.dom.focus();
          }
      }
    }
     _updatePathVal(text) {
      if (this.hasAttribute("datapath")&&this.ctx!==undefined) {
          let prop=this.getPathMeta(this.ctx, this.getAttribute("datapath"));
          console.log(prop);
          if (prop) {
              this._prop_update(prop, text);
          }
      }
    }
     _change(text) {
      if (this.realtime) {
          this._updatePathVal(text);
      }
      if (this.onchange) {
          this.onchange(text);
      }
    }
  }
  _ESClass.register(TextBox);
  _es6_module.add_class(TextBox);
  TextBox = _es6_module.add_export('TextBox', TextBox);
  UIBase.internalRegister(TextBox);
  function checkForTextBox(screen, x, y) {
    let p=screen.pickElement(x, y);
    while (p) {
      if (p.draggable) {
          return true;
      }
      if (__instance_of(p, UIBase)) {
          for (let i=0; i<2; i++) {
              let nodes=i ? p.childNodes : p.shadow.childNodes;
              for (let child of nodes) {
                  if (child.draggable) {
                      return true;
                  }
              }
          }
      }
      let ok=__instance_of(p, TextBoxBase);
      ok = ok||p.constructor.define&&p.constructor.define().modalKeyEvents;
      if (ok) {
          return true;
      }
      p = p.parentWidget ? p.parentWidget : p.parentNode;
    }
    return false;
  }
  checkForTextBox = _es6_module.add_export('checkForTextBox', checkForTextBox);
  ui_base._setTextboxClass(TextBox);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_textbox.js');


es6_module_define('ui_treeview', ["../core/ui.js", "../core/ui_base.js", "../path-controller/util/vectormath.js", "../path-controller/util/simple_events.js", "../path-controller/util/math.js", "../core/ui_theme.js", "../util/ScreenOverdraw.js"], function _ui_treeview_module(_es6_module) {
  es6_import(_es6_module, '../util/ScreenOverdraw.js');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var Icons=es6_import_item(_es6_module, '../core/ui_base.js', 'Icons');
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  var pushModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'popModalLight');
  var keymap=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'keymap');
  var parsepx=es6_import_item(_es6_module, '../core/ui_theme.js', 'parsepx');
  var Vector2=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector2');
  var math=es6_import(_es6_module, '../path-controller/util/math.js');
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
        this._icon2 = UIBase.createElement("icon-label-x");
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
  UIBase.internalRegister(TreeItem);
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
      this.overdraw = UIBase.createElement("overdraw-x");
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
      od.style["position"] = UIBase.PositionKey;
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
      let ret=UIBase.createElement("tree-item-x");
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
  UIBase.internalRegister(TreeView);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_treeview.js');


es6_module_define('ui_widgets', ["../path-controller/util/events.js", "./ui_button.js", "../path-controller/util/vectormath.js", "../path-controller/toolsys/toolsys.js", "../path-controller/toolsys/toolprop.js", "../path-controller/controller/controller.js", "./ui_textbox.js", "../config/const.js", "../core/ui_base.js", "../path-controller/util/simple_events.js", "../core/units.js", "../path-controller/util/util.js"], function _ui_widgets_module(_es6_module) {
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
                  if (title===undefined&&rdef.subkey.length>0) {
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
              if (title!==undefined)
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


es6_module_define('ui_widgets2', ["./ui_richedit.js", "../core/ui_base.js", "../core/ui.js", "./ui_widgets.js", "./ui_button.js", "../path-controller/util/vectormath.js", "../path-controller/util/events.js", "../util/util.js", "../path-controller/toolsys/toolprop.js", "../core/units.js"], function _ui_widgets2_module(_es6_module) {
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
          let uslider=this.uslider = UIBase.createElement("numslider-x");
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


es6_module_define('xmlpage', ["../util/util.js", "../core/ui_base.js", "../widgets/ui_menu.js", "../widgets/ui_numsliders.js", "../core/ui.js", "../path-controller/toolsys/toolprop.js"], function _xmlpage_module(_es6_module) {
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


es6_module_define('pentool', ["../../../core/keymap.js", "../../../path.ux/scripts/pathux.js", "../../../core/toolops_api.js", "../../../curve/spline_types.js", "../../../path.ux/scripts/util/util.js", "./toolmode.js"], function _pentool_module(_es6_module) {
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


es6_module_define('splinetool', ["../transform.js", "../selectmode.js", "../transform_ops.js", "../../../path.ux/scripts/core/ui_base.js", "../view2d_editor.js", "../view2d_ops.js", "../spline_selectops.js", "../../../path.ux/scripts/pathux.js", "../../../curve/spline_draw.js", "../spline_editops.js", "./toolmode.js", "../../../curve/spline_types.js", "../spline_createops.js", "../../../core/toolops_api.js", "../../../path.ux/scripts/util/util.js", "../../../core/keymap.js"], function _splinetool_module(_es6_module) {
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
      var this2=this;
      function del_tool(ctx) {
        console.log("delete");
        if (this2.selectmode&SelMask.SEGMENT) {
            console.log("kill segments");
            let op=new DeleteSegmentOp();
            g_app_state.toolstack.exec_tool(op);
        }
        else 
          if (this2.selectmode&SelMask.FACE) {
            console.log("kill faces");
            let op=new DeleteFaceOp();
            g_app_state.toolstack.exec_tool(op);
        }
        else {
          console.log("kill verts");
          let op=new DeleteVertOp();
          g_app_state.toolstack.exec_tool(op);
        }
      }
      this.keymap = new KeyMap("view2d:spline", [new HotKey("PageUp", [], "spline.change_face_z(offset=1 selmode='selectmode')|Move Up"), new HotKey("PageDown", [], "spline.change_face_z(offset=-1 selmode='selectmode')|Move Down"), new HotKey("G", [], "spline.translate(datamode='selectmode')"), new HotKey("S", [], "spline.scale(datamode='selectmode')"), new HotKey("R", [], "spline.rotate(datamode='selectmode')"), new HotKey("S", ["SHIFT"], "spline.shift_time()"), new HotKey("A", [], "spline.toggle_select_all(mode='SELECT')|Select All"), new HotKey("A", ["ALT"], "spline.toggle_select_all(mode='DESELECT')|Select None"), new HotKey("H", [], "spline.hide(selmode='selectmode')|Hide Selection"), new HotKey("H", ["ALT"], "spline.unhide(selmode='selectmode')|Reveal Selection"), new HotKey("G", [], "spline.hide(selmode='selectmode' ghost=1)|Ghost Selection"), new HotKey("G", [], "spline.unhide(selmode='selectmode' ghost=1)|Unghost Selection"), new HotKey("L", [], "spline.select_linked_pick(mode='SELECT')|Select Linked"), new HotKey("L", [], "spline.select_linked_pick(mode='SELECT')|Select Linked"), new HotKey("L", ["SHIFT"], "spline.select_linked_pick(mode='DESELECT')|Deselect Linked"), new HotKey("B", [], "spline.toggle_break_tangents()|Toggle Break-Tangents"), new HotKey("B", ["SHIFT"], "spline.toggle_break_curvature()|Toggle Break-Curvature"), new HotKey("X", [], del_tool, "Delete"), new HotKey("Delete", [], del_tool, "Delete"), new HotKey("Backspace", [], del_tool, "Delete"), new HotKey("D", [], "spline.dissolve_verts()|Dissolve Vertices"), new HotKey("D", ["SHIFT"], "spline.duplicate_transform()|Duplicate"), new HotKey("F", [], "spline.make_edge_face()|Create Face/Edge"), new HotKey("E", [], "spline.split_edges()|Split Segments"), new HotKey("M", [], "spline.mirror_verts()|Mirror Verts"), new HotKey("C", [], "view2d.circle_select()|Circle Select"), new HotKey("Z", [], function (ctx) {
        console.warn("ZKEY", arguments, this);
        ctx.view2d.only_render^=1;
        window.redraw_viewport();
      }, "Toggle Only Render"), new HotKey("W", [], function (ctx) {
        var mpos=ctx.keymap_mpos;
        mpos = ctx.screen.mpos;
        ctx.view2d.tools_menu(ctx, mpos);
      }, "Tools Menu")]);
      return ;
      let k=this.keymap = new KeyMap("view2d:splinetool");
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
      var ops=["spline.toggle_manual_handles()", "spline.split_edges()", "spline.delete_faces()", "spline.delete_segments()", "spline.delete_verts()", "spline.dissolve_verts()", "spline.make_edge_face()", "spline.split_edges()", "spline.mirror_verts()", "spline.duplicate_transform()", "spline.disconnect_handles()", "spline.connect_handles()", "spline.unhide()", "spline.hide()", "spline.toggle_select_all(mode='SELECT')|Select All|A", "spline.toggle_select_all(mode='DESELECT')|Deselect All|Alt-A", "view2d.circle_select()", "spline.select_linked(vertex_eid='active_vertex' mode='SELECT')|Select Linked|L", "spline.select_linked(vertex_eid='active_vertex' mode='DESELECT')|Deselect Linked|Shift+L"];
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

