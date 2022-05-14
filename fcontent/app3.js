
es6_module_define('ui_theme', ["../path-controller/util/vectormath.js", "../path-controller/util/struct.js", "../config/const.js", "../path-controller/util/util.js"], function _ui_theme_module(_es6_module) {
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var Vector3=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector4');
  var nstructjs=es6_import_item(_es6_module, '../path-controller/util/struct.js', 'default');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  let compatMap={BoxMargin: "padding", 
   BoxBG: "background", 
   BoxRadius: "border-radius", 
   background: "background-color", 
   defaultWidth: "width", 
   defaultHeight: "height", 
   DefaultWidth: "width", 
   DefaultHeight: "height", 
   BoxBorder: "border-color", 
   BoxLineWidth: "border-width", 
   BoxSubBG: "background-color", 
   BoxSub2BG: "background-color", 
   DefaultPanelBG: "background-color", 
   InnerPanelBG: "background-color", 
   Background: "background-color", 
   numslider_width: "width", 
   numslider_height: "height"}
  compatMap = _es6_module.add_export('compatMap', compatMap);
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
    if (c.length===3&&alpha_override===undefined) {
        return `rgb(${r},${g},${b})`;
    }
    else {
      return `rgba(${r},${g},${b}, ${a})`;
    }
  }
  color2css = _es6_module.add_export('color2css', color2css);
  window.color2css = color2css;
  let css2color_rets=util.cachering.fromConstructor(Vector4, 64);
  let basic_colors={'white': [1, 1, 1], 
   'grey': [0.5, 0.5, 0.5], 
   'gray': [0.5, 0.5, 0.5], 
   'black': [0, 0, 0], 
   'red': [1, 0, 0], 
   'yellow': [1, 1, 0], 
   'green': [0, 1, 0], 
   'teal': [0, 1, 1], 
   'cyan': [0, 1, 1], 
   'blue': [0, 0, 1], 
   'orange': [1, 0.5, 0.25], 
   'brown': [0.5, 0.4, 0.3], 
   'purple': [1, 0, 1], 
   'pink': [1, 0.5, 0.5]}
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
    if (color in basic_colors) {
        ret.load(basic_colors[color]);
        ret[3] = 1.0;
        return ret;
    }
    color = color.replace("rgba", "").replace("rgb", "").replace(/[\(\)]/g, "").trim().split(",");
    for (let i=0; i<color.length; i++) {
        ret[i] = parseFloat(color[i]);
        if (i<3) {
            ret[i]/=255;
        }
    }
    if (color.length===3) {
        color.push(1.0);
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
  let num="(([0-9]+\.[0-9]+)|[0-9a-f]+)";
  let validate_rgba=new RegExp(`rgba\\(${num},${num},${num},${num}\\)$`);
  let validate_rgb=new RegExp(`rgb\\(${num},${num},${num}\\)$`);
  function validateCSSColor(color) {
    if (color.toLowerCase() in basic_colors) {
        return true;
    }
    let rgba=color.toLowerCase().replace(/[ \t]/g, "");
    rgba = rgba.trim();
    if (validate_rgba.test(rgba)||validate_rgb.exec(rgba)) {
        return true;
    }
    return validateWebColor(color);
  }
  validateCSSColor = _es6_module.add_export('validateCSSColor', validateCSSColor);
  window.validateCSSColor = validateCSSColor;
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
                iscolor = iscolor||v in basic_colors;
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
  let _digest=new util.HashDigest();
  class CSSFont  {
     constructor(args={}) {
      this._size = args.size ? args.size : 12;
      this.font = args.font;
      this.style = args.style!==undefined ? args.style : "normal";
      this.weight = args.weight!==undefined ? args.weight : "normal";
      this.variant = args.variant!==undefined ? args.variant : "normal";
      this.color = args.color;
    }
     calcHashUpdate(digest=_digest.reset()) {
      digest.add(this._size||0);
      digest.add(this.font);
      digest.add(this.style);
      digest.add(this.weight);
      digest.add(this.variant);
      digest.add(this.color);
      return digest.get();
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
      return this.genKey();
    }
     genKey() {
      let color=this.color;
      if (typeof this.color==="object"||typeof this.color==="function") {
          color = JSON.stringify(color);
      }
      return this.genCSS()+":"+this.size+":"+color;
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
  function exportTheme(theme1, addVarDecl) {
    if (theme1===undefined) {
        theme1 = theme;
    }
    if (addVarDecl===undefined) {
        addVarDecl = true;
    }
    let sortkeys=(obj) =>      {
      let keys=[];
      for (let k in obj) {
          keys.push(k);
      }
      keys.sort();
      return keys;
    }
    let s=addVarDecl ? "var theme = {\n" : "{\n";
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


es6_module_define('units', ["../path-controller/util/util.js", "../path-controller/util/vectormath.js"], function _units_module(_es6_module) {
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var Vector2=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Quat');
  var Matrix4=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Matrix4');
  const FLT_EPSILONE=1.192092895507812e-07;
  function myfloor(f) {
    return Math.floor(f+FLT_EPSILONE*2.0);
  }
  function normString(s) {
    s = s.replace(/ /g, "").replace(/\t/g, "");
    return s.toLowerCase();
  }
  function myToFixed(f, decimals) {
    if (typeof f!=="number") {
        return "(error)";
    }
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
      if (name==="none"||name===undefined) {
          return undefined;
      }
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
      let vft=myfloor(value);
      let vin=((value+FLT_EPSILONE*2)*12)%12;
      if (vft===0.0) {
          return myToFixed(vin, decimals)+" in";
      }
      let s=""+vft+" ft";
      if (vin!==0.0) {
          s+=" "+myToFixed(vin, decimals)+" in";
      }
      return s;
    }
  }
  _ESClass.register(FootUnit);
  _es6_module.add_class(FootUnit);
  FootUnit = _es6_module.add_export('FootUnit', FootUnit);
  Unit.register(FootUnit);
  let square_foot_re=/((-?\d+(\.\d*)?ft(\u00b2)?)(-?\d+(\.\d*)?(in|inch)(\u00b2)?)?)|(-?\d+(\.\d*)?(in|inch)(\u00b2)?)$/;
  class SquareFootUnit extends FootUnit {
    static  unitDefine() {
      return {name: "square_foot", 
     uiname: "Square Feet", 
     type: "area", 
     icon: -1, 
     pattern: square_foot_re}
    }
    static  parse(string) {
      string = string.replace(/\u00b2/g, "");
      return super.parse(string);
    }
    static  buildString(value, decimals=2) {
      let vft=myfloor(value);
      let vin=((value+FLT_EPSILONE*2)*12)%12;
      if (vft===0.0) {
          return myToFixed(vin, decimals)+" in\u00b2";
      }
      let s=""+vft+" ft\u00b2";
      if (vin!==0.0) {
          s+=" "+myToFixed(vin, decimals)+" in\u00b2";
      }
      return s;
    }
  }
  _ESClass.register(SquareFootUnit);
  _es6_module.add_class(SquareFootUnit);
  SquareFootUnit = _es6_module.add_export('SquareFootUnit', SquareFootUnit);
  Unit.register(SquareFootUnit);
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
     pattern: /-?\d+(\.\d+)?(\u00B0|degree|deg|d|degree|degrees)$/}
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
  window._getBaseUnit = () =>    {
    return Unit.baseUnit;
  }
  function setMetric(val) {
    Unit.isMetric = val;
  }
  setMetric = _es6_module.add_export('setMetric', setMetric);
  Unit.isMetric = true;
  Unit.baseUnit = "meter";
  let numre1=/[+\-]?[0-9]+(\.[0-9]*)?$/;
  let numre2=/[+\-]?[0-9]?(\.[0-9]*)+$/;
  let hexre1=/[+\-]?[0-9a-fA-F]+h$/;
  let hexre2=/[+\-]?0x[0-9a-fA-F]+$/;
  let binre=/[+\-]?0b[01]+$/;
  let expre=/[+\-]?[0-9]+(\.[0-9]*)?[eE]\-?[0-9]+$/;
  let intre=/[+\-]?[0-9]+$/;
  function isnumber(s) {
    s = (""+s).trim();
    function test(re) {
      return s.search(re)===0;
    }
    return test(intre)||test(numre1)||test(numre2)||test(hexre1)||test(hexre2)||test(binre)||test(expre);
  }
  function parseValueIntern(string, baseUnit) {
    if (baseUnit===undefined) {
        baseUnit = undefined;
    }
    string = string.trim();
    if (string[0]===".") {
        string = "0"+string;
    }
    if (typeof baseUnit==="string") {
        let base=Unit.getUnit(baseUnit);
        if (base===undefined&&baseUnit!=="none") {
            console.warn("Unknown unit "+baseUnit);
            return NaN;
        }
        baseUnit = base;
    }
    if (isnumber(string)) {
        let f=parseFloat(string);
        return f;
    }
    if (baseUnit===undefined) {
        console.warn("No base unit in units.js:parseValueIntern");
    }
    for (let unit of Units) {
        let def=unit.unitDefine();
        if (unit.validate(string)) {
            console.log(unit);
            let value=unit.parse(string);
            if (baseUnit) {
                value = unit.toInternal(value);
                return baseUnit.fromInternal(value);
            }
            else {
              return value;
            }
        }
    }
    return NaN;
  }
  parseValueIntern = _es6_module.add_export('parseValueIntern', parseValueIntern);
  function parseValue(string, baseUnit, displayUnit) {
    if (baseUnit===undefined) {
        baseUnit = undefined;
    }
    if (displayUnit===undefined) {
        displayUnit = undefined;
    }
    displayUnit = Unit.getUnit(displayUnit);
    baseUnit = Unit.getUnit(baseUnit);
    let f=parseValueIntern(string, displayUnit||baseUnit);
    if (baseUnit) {
        if (displayUnit) {
            f = displayUnit.toInternal(f);
        }
        f = baseUnit.fromInternal(f);
    }
    return f;
  }
  parseValue = _es6_module.add_export('parseValue', parseValue);
  function isNumber(string) {
    if (isnumber(string)) {
        return true;
    }
    for (let unit of Units) {
        let def=unit.unitDefine();
        if (unit.validate(string)) {
            return true;
        }
    }
    return false;
  }
  isNumber = _es6_module.add_export('isNumber', isNumber);
  class PixelUnit extends Unit {
    static  unitDefine() {
      return {name: "pixel", 
     uiname: "Pixel", 
     type: "distance", 
     icon: -1, 
     pattern: /-?\d+(\.\d*)?px$/}
    }
    static  parse(string) {
      string = normString(string);
      if (string.endsWith("px")) {
          string = string.slice(0, string.length-2).trim();
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
      return ""+myToFixed(value, decimals)+"px";
    }
  }
  _ESClass.register(PixelUnit);
  _es6_module.add_class(PixelUnit);
  PixelUnit = _es6_module.add_export('PixelUnit', PixelUnit);
  Unit.register(PixelUnit);
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


es6_module_define('docbrowser', ["../path-controller/util/struct.js", "../util/util.js", "../config/const.js", "../platforms/platform.js", "../core/ui_base.js", "../util/vectormath.js", "../path-controller/util/simple_events.js"], function _docbrowser_module(_es6_module) {
  var pushModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'popModalLight');
  var cconst=es6_import(_es6_module, '../config/const.js');
  var nstructjs=es6_import_item(_es6_module, '../path-controller/util/struct.js', 'default');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var Icons=es6_import_item(_es6_module, '../core/ui_base.js', 'Icons');
  var platform=es6_import_item(_es6_module, '../platforms/platform.js', 'platform');
  let tinymceLoaded=false;
  _es_dynamic_import(_es6_module, '../lib/tinymce/tinymce.js').then((mod) =>    {
    tinymceLoaded = true;
  });
  var util=es6_import(_es6_module, '../util/util.js');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var Matrix4=es6_import_item(_es6_module, '../util/vectormath.js', 'Matrix4');
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
  window.PATHUX_DOCPATH = "../../simple_docsys/docsys_base.js";
  window.PATHUX_DOC_CONFIG = "../simple_docsys/docs.config.js";
  window.PATHUX_DOCPATH_PREFIX = "../simple_docsys/doc_build";
  class ElectronAPI extends DocsAPI {
     constructor() {
      super();
      this.first = true;
      this.ready = false;
    }
     _doinit() {
      if (!this.first) {
          return this.ready;
      }
      this.first = false;
      _es_dynamic_import(_es6_module, PATHUX_DOCPATH).then((docsys) =>        {
        let fs=require('fs');
        let marked=require('marked');
        let parse5=require('parse5');
        let pathmod=require('path');
        let jsdiff=require('diff');
        docsys = docsys.default(fs, marked, parse5, pathmod, jsdiff);
        this.config = docsys.readConfig(PATHUX_DOC_CONFIG);
        this.ready = true;
      });
      return this.ready;
    }
     start() {
      this._doinit();
    }
     checkInit() {
      if (!this.ready) {
          this._doinit();
      }
      if (!this.ready) {
          console.warn("Could not connect to docs server");
      }
      return this.ready;
    }
     uploadImage(relpath, blobInfo, success, onError) {
      return new Promise((accept, reject) =>        {
        if (!this.checkInit()) {
            return ;
        }
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
      if (!this.checkInit()) {
          return ;
      }
      return new Promise((accept, reject) =>        {
        accept(this.config.hasDoc(relpath));
      });
    }
     updateDoc(relpath, data) {
      if (!this.checkInit()) {
          return ;
      }
      return new Promise((accept, reject) =>        {
        accept(this.config.updateDoc(relpath, data));
      });
    }
     newDoc(relpath, data) {
      if (!this.checkInit()) {
          return ;
      }
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
     start() {

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
      this.pathuxBaseURL = location.href;
      this.editMode = false;
      this.history = new DocHistory();
      this._prefix = cconst.docManualPath||PATHUX_DOCPATH_PREFIX;
      this.saveReq = 0;
      this.saveReqStart = util.time_ms();
      this._last_save = util.time_ms();
      this.header = document.createElement("rowframe-x");
      this.shadow.appendChild(this.header);
      this.doOnce(this.makeHeader);
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
      this.serverapi.start();
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
      if (!tinymceLoaded) {
          this.doOnce(this.initDoc);
          return ;
      }
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
          let base=this.pathuxBaseURL;
          let base_url=platform.resolveURL("scripts/lib/tinymce", base);
          console.warn(window.haveElectron, "haveElectron", base_url);
          let tinymce=this.tinymce = globals.tinymce = window.tinymce = _tinymce(globals);
          let fixletter=() =>            {
            if (window.haveElectron) {
                if (process.platform==="win32") {
                    console.warn("Fixing drive letter", tinymce.baseURI);
                    tinymce.baseURI.host+=":";
                    tinymce.baseURL = tinymce.baseURI.source = tinymce.baseURI.toAbsolute();
                }
            }
          };
          let _baseuri=tinymce.baseURI;
          Object.defineProperty(tinymce, "baseURI", {get: function get() {
              return _baseuri;
            }, 
       set: function set(v) {
              _baseuri = v;
              if (v) {
                  fixletter();
              }
            }});
          fixletter();
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
            fixletter();
            this.tinymce = arg[0];
            if (!this.editMode) {
                this.tinymce.hide();
            }
            else {
              this.disableLinks();
            }
          });
          fixletter();
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
      let path=relative(dirname(document.location.href), href).trim();
      while (path.startsWith("/")) {
        path = path.slice(1, path.length);
      }
      console.log("PATH", path, this._prefix);
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
      if (!this.root) {
          return ;
      }
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
  UIBase.internalRegister(DocsBrowser);
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
  let a=0;
  let Icons={FOLDER: a++, 
   FILE: a++, 
   TINY_X: a++, 
   SMALL_PLUS: a++, 
   SMALL_MINUS: a++, 
   UNDO: a++, 
   REDO: a++, 
   HELP: a++, 
   UNCHECKED: a++, 
   CHECKED: a++, 
   LARGE_CHECK: a++, 
   CURSOR_ARROW: a++, 
   NOTE_EXCL: a++, 
   SCROLL_DOWN: a++, 
   SCROLL_UP: a++, 
   BACKSPACE: a++, 
   LEFT_ARROW: a++, 
   RIGHT_ARROW: a++, 
   UI_EXPAND: a++, 
   UI_COLLAPSE: a++, 
   BOLD: a++, 
   ITALIC: a++, 
   UNDERLINE: a++, 
   STRIKETHRU: a++, 
   TREE_EXPAND: a++, 
   TREE_COLLAPSE: a++, 
   ZOOM_OUT: a++, 
   ZOOM_IN: a++}
  Icons = _es6_module.add_export('Icons', Icons);
  Icons.ENUM_CHECKED = Icons.CHECKED;
  Icons.ENUM_UNCHECKED = Icons.UNCHECKED;
}, '/dev/fairmotion/src/path.ux/scripts/icon_enum.js');


es6_module_define('context', ["../util/util.js", "../config/config.js"], function _context_module(_es6_module) {
  var util=es6_import(_es6_module, '../util/util.js');
  var cconst=es6_import_item(_es6_module, '../config/config.js', 'default');
  let notifier=undefined;
  function setNotifier(cls) {
    notifier = cls;
  }
  setNotifier = _es6_module.add_export('setNotifier', setNotifier);
  const ContextFlags={IS_VIEW: 1}
  _es6_module.add_export('ContextFlags', ContextFlags);
  class InheritFlag  {
     constructor(data) {
      this.data = data;
    }
  }
  _ESClass.register(InheritFlag);
  _es6_module.add_class(InheritFlag);
  let __idgen=1;
  if (Symbol.ContextID===undefined) {
      Symbol.ContextID = Symbol("ContextID");
  }
  if (Symbol.CachedDef===undefined) {
      Symbol.CachedDef = Symbol("CachedDef");
  }
  const _ret_tmp=[undefined];
  const OverlayClasses=[];
  _es6_module.add_export('OverlayClasses', OverlayClasses);
  function makeDerivedOverlay(parent) {
    return class ContextOverlay extends parent {
       constructor(appstate) {
        super(appstate);
        this.ctx = undefined;
        this._state = appstate;
      }
      get  state() {
        return this._state;
      }
      set  state(state) {
        this._state = state;
      }
      get  last_tool() {
        return this.state._last_tool;
      }
       onRemove(have_new_file=false) {

      }
       copy() {
        return new this.constructor(this._state);
      }
       validate() {
        throw new Error("Implement me!");
      }
      static  contextDefine() {
        throw new Error("implement me!");
        return {name: "", 
      flag: 0}
      }
      static  resolveDef() {
        if (this.hasOwnProperty(Symbol.CachedDef)) {
            return this[Symbol.CachedDef];
        }
        let def2=Symbol.CachedDef = {};
        let def=this.contextDefine();
        if (def===undefined) {
            def = {};
        }
        for (let k in def) {
            def2[k] = def[k];
        }
        if (!("flag") in def) {
            def2.flag = Context.inherit(0);
        }
        let parents=[];
        let p=util.getClassParent(this);
        while (p&&p!==ContextOverlay) {
          parents.push(p);
          p = util.getClassParent(p);
        }
        if (__instance_of(def2.flag, InheritFlag)) {
            let flag=def2.flag.data;
            for (let p of parents) {
                let def=p.contextDefine();
                if (!def.flag) {
                    continue;
                }
                else 
                  if (__instance_of(def.flag, InheritFlag)) {
                    flag|=def.flag.data;
                }
                else {
                  flag|=def.flag;
                  break;
                }
            }
            def2.flag = flag;
        }
        return def2;
      }
    }
    _ESClass.register(ContextOverlay);
    _es6_module.add_class(ContextOverlay);
  }
  makeDerivedOverlay = _es6_module.add_export('makeDerivedOverlay', makeDerivedOverlay);
  const ContextOverlay=makeDerivedOverlay(Object);
  _es6_module.add_export('ContextOverlay', ContextOverlay);
  const excludedKeys=new Set(["onRemove", "reset", "toString", "_fix", "valueOf", "copy", "next", "save", "load", "clear", "hasOwnProperty", "toLocaleString", "constructor", "propertyIsEnumerable", "isPrototypeOf", "state", "saveProperty", "loadProperty", "getOwningOverlay", "_props"]);
  _es6_module.add_export('excludedKeys', excludedKeys);
  class LockedContext  {
     constructor(ctx, noWarnings) {
      this.props = {};
      this.state = ctx.state;
      this.api = ctx.api;
      this.toolstack = ctx.toolstack;
      this.noWarnings = noWarnings;
      this.load(ctx);
    }
     toLocked() {
      return this;
    }
     error() {
      return this.ctx.error(...arguments);
    }
     warning() {
      return this.ctx.warning(...arguments);
    }
     message() {
      return this.ctx.message(...arguments);
    }
     progbar() {
      return this.ctx.progbar(...arguments);
    }
     load(ctx) {
      let keys=ctx._props;
      function wrapget(name) {
        return function (ctx2, data) {
          return ctx.loadProperty(ctx2, name, data);
        }
      }
      for (let k of keys) {
          let v;
          if (k==="state"||k==="toolstack"||k==="api") {
              continue;
          }
          if (typeof k==="string"&&(k.endsWith("_save")||k.endsWith("_load"))) {
              continue;
          }
          try {
            v = ctx[k];
          }
          catch (error) {
              if (cconst.DEBUG.contextSystem) {
                  console.warn("failed to look up property in context: ", k);
              }
              continue;
          }
          let data, getter;
          let overlay=ctx.getOwningOverlay(k);
          if (overlay===undefined) {
              continue;
          }
          try {
            if (typeof k==="string"&&(overlay[k+"_save"]&&overlay[k+"_load"])) {
                data = overlay[k+"_save"]();
                getter = overlay[k+"_load"];
            }
            else {
              data = ctx.saveProperty(k);
              getter = wrapget(k);
            }
          }
          catch (error) {
              console.warn("Failed to save context property", k);
              continue;
          }
          this.props[k] = {data: data, 
       get: getter};
      }
      let defineProp=(name) =>        {
        Object.defineProperty(this, name, {get: function () {
            let def=this.props[name];
            return def.get(this.ctx, def.data);
          }});
      };
      for (let k in this.props) {
          defineProp(k);
      }
      this.ctx = ctx;
    }
     setContext(ctx) {
      this.ctx = ctx;
      this.state = ctx.state;
      this.api = ctx.api;
      this.toolstack = ctx.toolstack;
    }
  }
  _ESClass.register(LockedContext);
  _es6_module.add_class(LockedContext);
  LockedContext = _es6_module.add_export('LockedContext', LockedContext);
  let next_key={}
  let idgen=1;
  class Context  {
     constructor(appstate) {
      this.state = appstate;
      this._props = new Set();
      this._stack = [];
      this._inside_map = {};
    }
     _fix() {
      this._inside_map = {};
    }
     fix() {
      this._fix();
    }
     error(message, timeout=1500) {
      let state=this.state;
      console.warn(message);
      if (state&&state.screen) {
          return notifier.error(state.screen, message, timeout);
      }
    }
     warning(message, timeout=1500) {
      let state=this.state;
      console.warn(message);
      if (state&&state.screen) {
          return notifier.warning(state.screen, message, timeout);
      }
    }
     message(msg, timeout=1500) {
      let state=this.state;
      console.warn(msg);
      if (state&&state.screen) {
          return notifier.message(state.screen, msg, timeout);
      }
    }
     progbar(msg, perc=0.0, timeout=1500, id=msg) {
      let state=this.state;
      if (state&&state.screen) {
          return notifier.progbarNote(state.screen, msg, perc, "green", timeout, id);
      }
    }
     validateOverlays() {
      let stack=this._stack;
      let stack2=[];
      for (let i=0; i<stack.length; i++) {
          if (stack[i].validate()) {
              stack2.push(stack[i]);
          }
      }
      this._stack = stack2;
    }
     hasOverlay(cls) {
      return this.getOverlay(cls)!==undefined;
    }
     getOverlay(cls) {
      for (let overlay of this._stack) {
          if (overlay.constructor===cls) {
              return overlay;
          }
      }
    }
     clear(have_new_file=false) {
      for (let overlay of this._stack) {
          overlay.onRemove(have_new_file);
      }
      this._stack = [];
    }
     reset(have_new_file=false) {
      this.clear(have_new_file);
    }
     override(overrides) {
      if (overrides.copy===undefined) {
          overrides.copy = function () {
            return Object.assign({}, this);
          };
      }
      let ctx=this.copy();
      ctx.pushOverlay(overrides);
      return ctx;
    }
     copy() {
      let ret=new this.constructor(this.state);
      for (let item of this._stack) {
          ret.pushOverlay(item.copy());
      }
      return ret;
    }
    static  super() {
      return next_key;
    }
     saveProperty(key) {
      return this[key];
    }
     loadProperty(ctx, key, data) {
      return data;
    }
     getOwningOverlay(name, _val_out) {
      let inside_map=this._inside_map;
      let stack=this._stack;
      if (cconst.DEBUG.contextSystem) {
          console.log(name, inside_map);
      }
      for (let i=stack.length-1; i>=0; i--) {
          let overlay=stack[i];
          let ret=next_key;
          if (overlay[Symbol.ContextID]===undefined) {
              throw new Error("context corruption");
          }
          let ikey=overlay[Symbol.ContextID];
          if (cconst.DEBUG.contextSystem) {
              console.log(ikey, overlay);
          }
          if (inside_map[ikey]) {
              continue;
          }
          if (overlay.__allKeys.has(name)) {
              if (cconst.DEBUG.contextSystem) {
                  console.log("getting value");
              }
              inside_map[ikey] = 1;
              try {
                ret = overlay[name];
              }
              catch (error) {
                  inside_map[ikey] = 0;
                  throw error;
              }
              inside_map[ikey] = 0;
          }
          if (ret!==next_key) {
              if (_val_out!==undefined) {
                  _val_out[0] = ret;
              }
              return overlay;
          }
      }
      if (_val_out!==undefined) {
          _val_out[0] = undefined;
      }
      return undefined;
    }
     ensureProperty(name) {
      if (this.hasOwnProperty(name)) {
          return ;
      }
      this._props.add(name);
      Object.defineProperty(this, name, {get: function () {
          let ret=_ret_tmp;
          _ret_tmp[0] = undefined;
          this.getOwningOverlay(name, ret);
          return ret[0];
        }, 
     set: function () {
          throw new Error("Cannot set ctx properties");
        }});
    }
     toLocked() {
      return new LockedContext(this);
    }
     pushOverlay(overlay) {
      if (!overlay.hasOwnProperty(Symbol.ContextID)) {
          overlay[Symbol.ContextID] = idgen++;
      }
      let keys=new Set();
      for (let key of util.getAllKeys(overlay)) {
          if (!excludedKeys.has(key)&&!(typeof key==="string"&&key[0]==="_")) {
              keys.add(key);
          }
      }
      overlay.ctx = this;
      if (overlay.__allKeys===undefined) {
          overlay.__allKeys = keys;
      }
      for (let k of keys) {
          let bad=typeof k==="symbol"||excludedKeys.has(k);
          bad = bad||(typeof k==="string"&&k[0]==="_");
          bad = bad||(typeof k==="string"&&k.endsWith("_save"));
          bad = bad||(typeof k==="string"&&k.endsWith("_load"));
          if (bad) {
              continue;
          }
          this.ensureProperty(k);
      }
      if (this._stack.indexOf(overlay)>=0) {
          console.warn("Overlay already added once");
          if (this._stack[this._stack.length-1]===overlay) {
              console.warn("  Definitely an error, overlay is already at top of stack");
              return ;
          }
      }
      this._stack.push(overlay);
    }
     popOverlay(overlay) {
      if (overlay!==this._stack[this._stack.length-1]) {
          console.warn("Context.popOverlay called in error", overlay);
          return ;
      }
      overlay.onRemove();
      this._stack.pop();
    }
     removeOverlay(overlay) {
      if (this._stack.indexOf(overlay)<0) {
          console.warn("Context.removeOverlay called in error", overlay);
          return ;
      }
      overlay.onRemove();
      this._stack.remove(overlay);
    }
    static  inherit(data) {
      return new InheritFlag(data);
    }
    static  register(cls) {
      if (cls[Symbol.ContextID]) {
          console.warn("Tried to register same class twice:", cls);
          return ;
      }
      cls[Symbol.ContextID] = __idgen++;
      OverlayClasses.push(cls);
    }
  }
  _ESClass.register(Context);
  _es6_module.add_class(Context);
  Context = _es6_module.add_export('Context', Context);
  function test() {
    function testInheritance() {
      class Test0 extends ContextOverlay {
        static  contextDefine() {
          return {flag: 1}
        }
      }
      _ESClass.register(Test0);
      _es6_module.add_class(Test0);
      class Test1 extends Test0 {
        static  contextDefine() {
          return {flag: 2}
        }
      }
      _ESClass.register(Test1);
      _es6_module.add_class(Test1);
      class Test2 extends Test1 {
        static  contextDefine() {
          return {flag: Context.inherit(4)}
        }
      }
      _ESClass.register(Test2);
      _es6_module.add_class(Test2);
      class Test3 extends Test2 {
        static  contextDefine() {
          return {flag: Context.inherit(8)}
        }
      }
      _ESClass.register(Test3);
      _es6_module.add_class(Test3);
      class Test4 extends Test3 {
        static  contextDefine() {
          return {flag: Context.inherit(16)}
        }
      }
      _ESClass.register(Test4);
      _es6_module.add_class(Test4);
      return Test4.resolveDef().flag===30;
    }
    return testInheritance();
  }
  test = _es6_module.add_export('test', test);
  if (!test()) {
      throw new Error("Context test failed");
  }
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/controller/context.js');


es6_module_define('controller', ["../toolsys/toolprop.js", "./controller_base.js", "../toolsys/toolpath.js", "./controller_abstract.js", "./controller_ops.js", "../util/util.js", "../util/parseutil.js", "../toolsys/toolsys.js", "../toolsys/toolprop_abstract.js"], function _controller_module(_es6_module) {
  var toolprop=es6_import(_es6_module, '../toolsys/toolprop.js');
  var parseutil=es6_import(_es6_module, '../util/parseutil.js');
  var print_stack=es6_import_item(_es6_module, '../util/util.js', 'print_stack');
  var ToolOp=es6_import_item(_es6_module, '../toolsys/toolsys.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../toolsys/toolsys.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../toolsys/toolsys.js', 'ToolFlags');
  var Vec2Property=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'Vec2Property');
  var Vec3Property=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'Vec4Property');
  var PropTypes=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropTypes');
  var PropFlags=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropFlags');
  var toolprop_abstract=es6_import(_es6_module, '../toolsys/toolprop_abstract.js');
  var util=es6_import(_es6_module, '../util/util.js');
  var DataPath=es6_import_item(_es6_module, './controller_base.js', 'DataPath');
  var DataFlags=es6_import_item(_es6_module, './controller_base.js', 'DataFlags');
  var DataTypes=es6_import_item(_es6_module, './controller_base.js', 'DataTypes');
  var DataPathError=es6_import_item(_es6_module, './controller_base.js', 'DataPathError');
  var StructFlags=es6_import_item(_es6_module, './controller_base.js', 'StructFlags');
  var getTempProp=es6_import_item(_es6_module, './controller_base.js', 'getTempProp');
  var ___controller_base_js=es6_import(_es6_module, './controller_base.js');
  for (let k in ___controller_base_js) {
      _es6_module.add_export(k, ___controller_base_js[k], true);
  }
  let PUTLParseError=parseutil.PUTLParseError;
  let tk=(name, re, func) =>    {
    return new parseutil.tokdef(name, re, func);
  }
  let tokens=[tk("ID", /[a-zA-Z_$]+[a-zA-Z_$0-9]*/), tk("NUM", /-?[0-9]+/, (t) =>    {
    t.value = parseInt(t.value);
    return t;
  }), tk('NUMBER', /-?[0-9]+\.[0-9]*/, (t) =>    {
    t.value = parseFloat(t.value);
    return t;
  }), tk("STRLIT", /'.*?'/, (t) =>    {
    t.value = t.value.slice(1, t.value.length-1);
    return t;
  }), tk("STRLIT", /".*?"/, (t) =>    {
    t.value = t.value.slice(1, t.value.length-1);
    return t;
  }), tk("DOT", /\./), tk("EQUALS", /(\=)|(\=\=)/), tk("LSBRACKET", /\[/), tk("RSBRACKET", /\]/), tk("AND", /\&/), tk("WS", /[ \t\n\r]+/, (t) =>    {
    return undefined;
  })];
  let lexer=new parseutil.lexer(tokens, (t) =>    {
    console.warn("Parse error", t);
    throw new DataPathError();
  });
  let pathParser=new parseutil.parser(lexer);
  pathParser = _es6_module.add_export('pathParser', pathParser);
  let parserStack=new Array(32);
  for (let i=0; i<parserStack.length; i++) {
      parserStack[i] = pathParser.copy();
  }
  parserStack.cur = 0;
  var setImplementationClass=es6_import_item(_es6_module, './controller_base.js', 'setImplementationClass');
  var isVecProperty=es6_import_item(_es6_module, './controller_base.js', 'isVecProperty');
  var ListIface=es6_import_item(_es6_module, './controller_base.js', 'ListIface');
  var initToolPaths=es6_import_item(_es6_module, '../toolsys/toolpath.js', 'initToolPaths');
  var parseToolPath=es6_import_item(_es6_module, '../toolsys/toolpath.js', 'parseToolPath');
  var ModelInterface=es6_import_item(_es6_module, './controller_abstract.js', 'ModelInterface');
  let _ex_DataPathError=es6_import_item(_es6_module, './controller_base.js', 'DataPathError');
  _es6_module.add_export('DataPathError', _ex_DataPathError, true);
  let _ex_DataFlags=es6_import_item(_es6_module, './controller_base.js', 'DataFlags');
  _es6_module.add_export('DataFlags', _ex_DataFlags, true);
  var ToolClasses=es6_import_item(_es6_module, '../toolsys/toolsys.js', 'ToolClasses');
  var ToolProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'ToolProperty');
  var IntProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'IntProperty');
  let tool_classes=ToolClasses;
  let tool_idgen=1;
  Symbol.ToolID = Symbol("toolid");
  function toolkey(cls) {
    if (!(Symbol.ToolID in cls)) {
        cls[Symbol.ToolID] = tool_idgen++;
    }
    return cls[Symbol.ToolID];
  }
  let lt=util.time_ms();
  let lastmsg=undefined;
  let lcount=0;
  let reportstack=["api"];
  function pushReportName(name) {
    if (reportstack.length>1024) {
        console.trace("eerk, reportstack overflowed");
        reportstack.length = 0;
        reportstack.push("api");
    }
    reportstack.push(name);
  }
  pushReportName = _es6_module.add_export('pushReportName', pushReportName);
  function report(msg) {
    let name=reportstack.length===0 ? "api" : reportstack[reportstack.length-1];
    util.console.context(name).warn(msg);
  }
  function popReportName() {
    reportstack.pop();
  }
  popReportName = _es6_module.add_export('popReportName', popReportName);
  class DataList extends ListIface {
     constructor(callbacks) {
      super();
      if (callbacks===undefined) {
          throw new DataPathError("missing callbacks argument to DataList");
      }
      this.cb = {};
      if (typeof callbacks==="object"&&!Array.isArray(callbacks)) {
          for (let k in callbacks) {
              this.cb[k] = callbacks[k];
          }
      }
      else {
        for (let cb of callbacks) {
            this.cb[cb.name] = cb;
        }
      }
      let check=(key) =>        {
        if (!(key in this.cbs)) {
            throw new DataPathError(`Missing ${key} callback in DataList`);
        }
      };
    }
     copy() {
      let ret=new DataList([this.cb.get]);
      for (let k in this.cb) {
          ret.cb[k] = this.cb[k];
      }
      return ret;
    }
     get(api, list, key) {
      return this.cb.get(api, list, key);
    }
     getLength(api, list) {
      this._check("getLength");
      return this.cb.getLength(api, list);
    }
     _check(cb) {
      if (!(cb in this.cb)) {
          throw new DataPathError(cb+" not supported by this list");
      }
    }
     set(api, list, key, val) {
      if (this.cb.set===undefined) {
          list[key] = val;
      }
      else {
        this.cb.set(api, list, key, val);
      }
    }
     getIter(api, list) {
      this._check("getIter");
      return this.cb.getIter(api, list);
    }
     filter(api, list, bitmask) {
      this._check("filter");
      return this.cb.filter(api, list, bitmask);
    }
     getActive(api, list) {
      this._check("getActive");
      return this.cb.getActive(api, list);
    }
     setActive(api, list, key) {
      this._check("setActive");
      this.cb.setActive(api, list, key);
    }
     getKey(api, list, obj) {
      this._check("getKey");
      return this.cb.getKey(api, list, obj);
    }
     getStruct(api, list, key) {
      if (this.cb.getStruct!==undefined) {
          return this.cb.getStruct(api, list, key);
      }
      let obj=this.get(api, list, key);
      if (obj===undefined)
        return undefined;
      return api.getStruct(obj.constructor);
    }
  }
  _ESClass.register(DataList);
  _es6_module.add_class(DataList);
  DataList = _es6_module.add_export('DataList', DataList);
  class DataStruct  {
     constructor(members=[], name="unnamed") {
      this.members = [];
      this.name = name;
      this.pathmap = {};
      this.flag = 0;
      this.dpath = undefined;
      this.inheritFlag = 0;
      for (let m of members) {
          this.add(m);
      }
    }
     clear() {
      this.pathmap = {};
      this.members = [];
      return this;
    }
     copy() {
      let ret=new DataStruct();
      ret.name = this.name;
      ret.flag = this.flag;
      ret.inheritFlag = this.inheritFlag;
      for (let m of this.members) {
          let m2=m.copy();
          if (m2.type===DataTypes.PROP) {
              m2.data = m2.data.copy();
          }
          ret.add(m2);
      }
      return ret;
    }
     dynamicStruct(path, apiname, uiname, default_struct=undefined) {
      let ret=default_struct ? default_struct : new DataStruct();
      let dpath=new DataPath(path, apiname, ret, DataTypes.DYNAMIC_STRUCT);
      ret.inheritFlag|=this.inheritFlag;
      ret.dpath = dpath;
      this.add(dpath);
      return ret;
    }
     struct(path, apiname, uiname, existing_struct=undefined) {
      let ret=existing_struct ? existing_struct : new DataStruct();
      let dpath=new DataPath(path, apiname, ret, DataTypes.STRUCT);
      ret.inheritFlag|=this.inheritFlag;
      ret.dpath = dpath;
      this.add(dpath);
      return ret;
    }
     customGet(getter) {
      this.dpath.customGet(getter);
      return this;
    }
     customGetSet(getter, setter) {
      this.dpath.customGetSet(getter, setter);
      return this;
    }
     color3(path, apiname, uiname, description) {
      let ret=this.vec3(path, apiname, uiname, description);
      ret.data.subtype = toolprop.PropSubTypes.COLOR;
      ret.range(0, 1);
      ret.simpleSlider();
      ret.noUnits();
      return ret;
    }
     color4(path, apiname, uiname, description=uiname) {
      let ret=this.vec4(path, apiname, uiname, description);
      ret.data.subtype = toolprop.PropSubTypes.COLOR;
      ret.range(0, 1);
      ret.simpleSlider();
      ret.noUnits();
      return ret;
    }
     arrayList(path, apiname, structdef, uiname, description) {
      let ret=this.list(path, apiname, [function getIter(api, list) {
        return list[Symbol.iterator]();
      }, function getLength(api, list) {
        return list.length;
      }, function get(api, list, key) {
        return list[key];
      }, function set(api, list, key, val) {
        if (typeof key==="string") {
            key = parseInt(key);
        }
        if (key<0||key>=list.length) {
            throw new DataPathError("Invalid index "+key);
        }
        list[key] = val;
      }, function getKey(api, list, obj) {
        return list.indexOf(obj);
      }, function getStruct(api, list, key) {
        return structdef;
      }]);
      return ret;
    }
     color3List(path, apiname, uiname, description) {
      return this.vectorList(3, path, apiname, uiname, description, toolprop.PropSubTypes.COLOR);
    }
     color4List(path, apiname, uiname, description) {
      return this.vectorList(4, path, apiname, uiname, description, toolprop.PropSubTypes.COLOR);
    }
     vectorList(size, path, apiname, uiname, description, subtype) {
      let type;
      switch (size) {
        case 2:
          type = toolprop.Vec2Property;
          break;
        case 3:
          type = toolprop.Vec3Property;
        case 4:
          type = toolprop.Vec4Property;
      }
      if (type===undefined) {
          throw new DataPathError("Invalid size for vectorList; expected 2 3 or 4");
      }
      let prop=new type(undefined, apiname, uiname, description);
      let pstruct=new DataStruct(undefined, "Vector");
      pstruct.vec3("", "co", "Coords", "Coordinates");
      let ret=this.list(path, apiname, [function getIter(api, list) {
        return list[Symbol.iterator]();
      }, function getLength(api, list) {
        return list.length;
      }, function get(api, list, key) {
        return list[key];
      }, function set(api, list, key, val) {
        if (typeof key=="string") {
            key = parseInt(key);
        }
        if (key<0||key>=list.length) {
            throw new DataPathError("Invalid index "+key);
        }
        list[key] = val;
      }, function getKey(api, list, obj) {
        return list.indexOf(obj);
      }, function getStruct(api, list, key) {
        return pstruct;
      }]);
      return ret;
    }
     bool(path, apiname, uiname, description) {
      let prop=new toolprop.BoolProperty(undefined, apiname, uiname, description);
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     vec2(path, apiname, uiname, description) {
      let prop=new toolprop.Vec2Property(undefined, apiname, uiname, description);
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     vec3(path, apiname, uiname, description) {
      let prop=new toolprop.Vec3Property(undefined, apiname, uiname, description);
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     vec4(path, apiname, uiname, description) {
      let prop=new toolprop.Vec4Property(undefined, apiname, uiname, description);
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     float(path, apiname, uiname, description) {
      let prop=new toolprop.FloatProperty(0, apiname, uiname, description);
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     textblock(path, apiname, uiname, description) {
      let prop=new toolprop.StringProperty(undefined, apiname, uiname, description);
      prop.multiLine = true;
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     report(path, apiname, uiname, description) {
      let prop=new toolprop.ReportProperty(undefined, apiname, uiname, description);
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     string(path, apiname, uiname, description) {
      let prop=new toolprop.StringProperty(undefined, apiname, uiname, description);
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     int(path, apiname, uiname, description, prop=undefined) {
      if (!prop) {
          prop = new toolprop.IntProperty(0, apiname, uiname, description);
      }
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     curve1d(path, apiname, uiname, description) {
      let prop=new toolprop.Curve1DProperty(undefined);
      prop.apiname = apiname;
      prop.uiname = uiname;
      prop.description = description;
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     enum(path, apiname, enumdef, uiname, description) {
      let prop;
      if (__instance_of(enumdef, toolprop.EnumProperty)) {
          prop = enumdef;
      }
      else {
        prop = new toolprop.EnumProperty(undefined, enumdef, apiname, uiname, description);
      }
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     list(path, apiname, funcs) {
      let array=new DataList(funcs);
      let dpath=new DataPath(path, apiname, array);
      dpath.type = DataTypes.ARRAY;
      this.add(dpath);
      return dpath;
    }
     flags(path, apiname, enumdef, uiname, description) {
      let prop;
      if (enumdef===undefined||!(__instance_of(enumdef, toolprop.ToolProperty))) {
          prop = new toolprop.FlagProperty(undefined, enumdef, apiname, uiname, description);
      }
      else {
        prop = enumdef;
      }
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     remove(m) {
      if (typeof m==="string") {
          m = this.pathmap[m];
      }
      if (!(m.apiname in this.pathmap)) {
          throw new Error("Member not in struct "+m.apiname);
      }
      delete this.pathmap[m.apiname];
      this.members.remove(m);
    }
     fromToolProp(path, prop, apiname) {
      if (apiname===undefined) {
          apiname = prop.apiname!==undefined&&prop.apiname.length>0 ? prop.apiname : k;
      }
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     add(m) {
      if (m.apiname in this.pathmap) {
          if (window.DEBUG.datapaths) {
              console.warn("Overriding existing member '"+m.apiname+"' in datapath struct", this.name);
          }
          this.remove(this.pathmap[m.apiname]);
      }
      m.flag|=this.inheritFlag;
      this.members.push(m);
      m.parent = this;
      this.pathmap[m.apiname] = m;
      return this;
    }
  }
  _ESClass.register(DataStruct);
  _es6_module.add_class(DataStruct);
  DataStruct = _es6_module.add_export('DataStruct', DataStruct);
  let _map_struct_idgen=1;
  let _map_structs={}
  window._debug__map_structs = _map_structs;
  let _dummypath=new DataPath();
  let DummyIntProperty=new IntProperty();
  const CLS_API_KEY=Symbol("dp_map_id");
  const CLS_API_KEY_CUSTOM=Symbol("dp_map_custom");
  class DataAPI extends ModelInterface {
     constructor() {
      super();
      this.rootContextStruct = undefined;
      this.structs = [];
    }
    get  list() {
      return undefined;
    }
    static  toolRegistered(cls) {
      return ToolOp.isRegistered(cls);
    }
    static  registerTool(cls) {
      console.warn("Outdated function simple_controller.DataAPI.registerTool called");
      return ToolOp.register(cls);
    }
     getStructs() {
      return this.structs;
    }
     setRoot(sdef) {
      this.rootContextStruct = sdef;
    }
     hasStruct(cls) {
      return cls.hasOwnProperty(CLS_API_KEY);
    }
     getStruct(cls) {
      return this.mapStruct(cls, false);
    }
     mergeStructs(dest, src) {
      for (let m of src.members) {
          dest.add(m.copy());
      }
    }
     inheritStruct(cls, parent, auto_create_parent=false) {
      let st=this.mapStruct(parent, auto_create_parent);
      if (st===undefined) {
          throw new Error("parent has no struct definition");
      }
      st = st.copy();
      st.name = cls.name;
      this._addClass(cls, st);
      return st;
    }
     _addClass(cls, dstruct) {
      let key=_map_struct_idgen++;
      cls[CLS_API_KEY] = key;
      this.structs.push(dstruct);
      _map_structs[key] = dstruct;
    }
     mapStructCustom(cls, callback) {
      this.mapStruct(cls, true);
      cls[CLS_API_KEY_CUSTOM] = callback;
    }
     mapStruct(cls, auto_create=true, name=cls.name) {
      let key;
      if (!cls.hasOwnProperty(CLS_API_KEY)) {
          key = undefined;
      }
      else {
        key = cls[CLS_API_KEY];
      }
      if (key===undefined&&auto_create) {
          let dstruct=new DataStruct(undefined, name);
          this._addClass(cls, dstruct);
          return dstruct;
      }
      else 
        if (key===undefined) {
          throw new Error("class does not have a struct definition: "+name);
      }
      return _map_structs[key];
    }
     pushReportContext(name) {
      pushReportName(name);
    }
     popReportContext() {
      popReportName();
    }
     massSetProp(ctx, massSetPath, value) {
      for (let path of this.resolveMassSetPaths(ctx, massSetPath)) {
          this.setValue(ctx, path, value);
      }
    }
     resolveMassSetPaths(ctx, massSetPath) {
      if (massSetPath.startsWith("/")) {
          massSetPath = massSetPath.slice(1, massSetPath.length);
      }
      let start=massSetPath.search("{");
      let end=massSetPath.search("}");
      if (start<0||end<0) {
          throw new DataPathError("Invalid mass set datapath: "+massSetPath);
          return ;
      }
      let prefix=massSetPath.slice(0, start-1);
      let filter=massSetPath.slice(start+1, end);
      let suffix=massSetPath.slice(end+2, massSetPath.length);
      let rdef=this.resolvePath(ctx, prefix);
      if (!(__instance_of(rdef.prop, DataList))) {
          throw new DataPathError("massSetPath expected a path resolving to a DataList: "+massSetPath);
      }
      let paths=[];
      let list=rdef.prop;
      let api=ctx.api;
      function applyFilter(obj) {
        if (obj===undefined) {
            return undefined;
        }
        else 
          if (typeof obj==="object"||typeof obj==="function") {
            let st=api.mapStruct(obj.constructor, false);
            let path=filter;
            if (path.startsWith("$")) {
                path = path.slice(1, filter.length).trim();
            }
            if (path.startsWith(".")) {
                path = path.slice(1, filter.length).trim();
            }
            try {
              return api.getValue(obj, path, st);
            }
            catch (error) {
                if (!(__instance_of(error, DataPathError))) {
                    util.print_stack(error);
                    console.error("Error in datapath callback");
                }
                return false;
            }
        }
        else {
          let $=obj;
          return eval(filter);
        }
      }
      for (let obj of list.getIter(this, rdef.value)) {
          if (!applyFilter(obj)) {
              continue;
          }
          let key=""+list.getKey(this, rdef.value, obj);
          let path=`${prefix}[${key}]${suffix}`;
          try {
            this.getValue(ctx, path);
          }
          catch (error) {
              if (!(__instance_of(error, DataPathError))) {
                  util.print_stack(error);
                  console.error(path+": Error in datapath API");
              }
              continue;
          }
          paths.push(path);
      }
      return paths;
    }
     resolvePath(ctx, inpath, ignoreExistence=false, dstruct=undefined) {
      let parser=parserStack[parserStack.cur++];
      let ret=undefined;
      if (inpath[0]==="/") {
          inpath = inpath.slice(1, inpath.length).trim();
      }
      try {
        ret = this.resolvePath_intern(ctx, inpath, ignoreExistence, parser, dstruct);
      }
      catch (error) {
          if (!(__instance_of(error, DataPathError))) {
              util.print_stack(error);
              report("error while evaluating path "+inpath);
          }
          if (window.DEBUG&&window.DEBUG.datapaths) {
              util.print_stack(error);
          }
          ret = undefined;
      }
      parserStack.cur--;
      if (ret!==undefined&&ret.prop&&ret.dpath&&(ret.dpath.flag&DataFlags.USE_CUSTOM_PROP_GETTER)) {
          let prop=ret.prop;
          prop.ctx = ctx;
          prop.datapath = inpath;
          prop.dataref = ret.obj;
          let newprop=getTempProp(prop.type);
          prop.copyTo(newprop);
          ret.dpath.propGetter.call(prop, newprop);
          ret.prop = newprop;
          prop.ctx = prop.datapath = prop.dataref = undefined;
      }
      if (ret!==undefined&&ret.prop&&ret.dpath&&ret.dpath.ui_name_get) {
          let dummy={datactx: ctx, 
       datapath: inpath, 
       dataref: ret.obj};
          let name=ret.dpath.ui_name_get.call(dummy);
          ret.prop.uiname = ""+name;
      }
      return ret;
    }
     resolvePath_intern(ctx, inpath, ignoreExistence=false, p=pathParser, dstruct=undefined) {
      inpath = inpath.replace("==", "=");
      p.input(inpath);
      dstruct = dstruct||this.rootContextStruct;
      let obj=ctx;
      let lastobj=ctx;
      let subkey;
      let lastobj2=undefined;
      let lastkey=undefined;
      let prop=undefined;
      let lastdpath=undefined;
      function p_key() {
        let t=p.peeknext();
        if (t.type==="NUM"||t.type==="STRLIT") {
            p.next();
            return t.value;
        }
        else {
          throw new PUTLParseError("Expected list key");
        }
      }
      let _i=0;
      while (!p.at_end()) {
        let key=p.expect("ID");
        let dpath=dstruct.pathmap[key];
        lastdpath = dpath;
        if (dpath===undefined) {
            if (key==="length"&&prop!==undefined&&__instance_of(prop, DataList)) {
                prop.getLength(this, obj);
                key = "length";
                prop = DummyIntProperty;
                prop.name = "length";
                prop.flag = PropFlags.READ_ONLY;
                dpath = _dummypath;
                dpath.type = DataTypes.PROP;
                dpath.data = prop;
                dpath.struct = dpath.parent = dstruct;
                dpath.flag = DataFlags.READ_ONLY;
                dpath.path = "length";
            }
            else 
              if (key==="active"&&prop!==undefined&&__instance_of(prop, DataList)) {
                let act=prop.getActive(this, obj);
                if (act===undefined&&!ignoreExistence) {
                    throw new DataPathError("no active elem ent for list");
                }
                let actkey=obj!==undefined&&act!==undefined ? prop.getKey(this, obj, act) : undefined;
                dstruct = prop.getStruct(this, obj, actkey);
                if (dstruct===undefined) {
                    throw new DataPathError("couldn't get data type for "+inpath+"'s element '"+key+"'");
                }
                _dummypath.parent = dpath;
                dpath = _dummypath;
                lastobj = obj;
                obj = act;
                dpath.type = DataTypes.STRUCT;
                dpath.data = dstruct;
                dpath.path = key;
                p.optional("DOT");
                continue;
            }
            else {
              throw new DataPathError(inpath+": unknown property "+key);
            }
        }
        let dynstructobj=undefined;
        if (dpath.type===DataTypes.STRUCT) {
            dstruct = dpath.data;
        }
        else 
          if (dpath.type===DataTypes.DYNAMIC_STRUCT) {
            let ok=false;
            if (obj!==undefined) {
                let obj2;
                if (dpath.flag&DataFlags.USE_CUSTOM_GETSET) {
                    let fakeprop=dpath.getSet;
                    fakeprop.ctx = ctx;
                    fakeprop.dataref = obj;
                    fakeprop.datapath = inpath;
                    obj2 = fakeprop.get();
                    fakeprop.ctx = fakeprop.datapath = fakeprop.dataref = undefined;
                }
                else {
                  obj2 = obj[dpath.path];
                }
                dynstructobj = obj2;
                if (obj2!==undefined) {
                    if (CLS_API_KEY_CUSTOM in obj2.constructor) {
                        dstruct = obj2.constructor[CLS_API_KEY_CUSTOM](obj2);
                    }
                    else {
                      dstruct = this.mapStruct(obj2.constructor, false);
                    }
                }
                else {
                  dstruct = dpath.data;
                }
                if (dstruct===undefined) {
                    dstruct = dpath.data;
                }
                ok = dstruct!==undefined;
            }
            if (!ok) {
                throw new DataPathError("dynamic struct error for path: "+inpath);
            }
        }
        else {
          prop = dpath.data;
        }
        if (dpath.path.search(/\./)>=0) {
            let keys=dpath.path.split(/\./);
            for (let key of keys) {
                lastobj2 = lastobj;
                lastobj = obj;
                lastkey = key;
                if (obj===undefined&&!ignoreExistence) {
                    throw new DataPathError("no data for "+inpath);
                }
                else 
                  if (obj!==undefined) {
                    obj = obj[key.trim()];
                }
            }
        }
        else {
          lastobj2 = lastobj;
          lastobj = obj;
          lastkey = dpath.path;
          if (dpath.flag&DataFlags.USE_CUSTOM_GETSET) {
              let fakeprop=dpath.getSet;
              if (!fakeprop&&dpath.type===DataTypes.PROP) {
                  let prop=dpath.data;
                  prop.ctx = ctx;
                  prop.dataref = obj;
                  prop.datapath = inpath;
                  try {
                    obj = prop.getValue();
                  }
                  catch (error) {
                      util.print_stack(error);
                      obj = undefined;
                  }
                  if (typeof obj==="string"&&(prop.type&(PropTypes.ENUM|PropTypes.FLAG))) {
                      obj = prop.values[obj];
                  }
                  prop.ctx = prop.dataref = prop.datapath = undefined;
              }
              else {
                fakeprop.ctx = ctx;
                fakeprop.dataref = obj;
                fakeprop.datapath = inpath;
                obj = fakeprop.get();
                fakeprop.ctx = fakeprop.datapath = fakeprop.dataref = undefined;
              }
          }
          else 
            if (obj===undefined&&!ignoreExistence) {
              throw new DataPathError("no data for "+inpath);
          }
          else 
            if (dpath.type===DataTypes.DYNAMIC_STRUCT) {
              obj = dynstructobj;
          }
          else 
            if (obj!==undefined&&dpath.path!=="") {
              obj = obj[dpath.path];
          }
        }
        let t=p.peeknext();
        if (t===undefined) {
            break;
        }
        if (t.type==="DOT") {
            p.next();
        }
        else 
          if (t.type==="EQUALS"&&prop!==undefined&&(prop.type&(PropTypes.ENUM|PropTypes.FLAG))) {
            p.expect("EQUALS");
            let t2=p.peeknext();
            let type=t2&&t2.type==="ID" ? "ID" : "NUM";
            let val=p.expect(type);
            let val1=val;
            if (typeof val=="string") {
                val = prop.values[val];
            }
            if (val===undefined) {
                throw new DataPathError("unknown value "+val1);
            }
            if (val in prop.keys) {
                subkey = prop.keys[val];
            }
            key = dpath.path;
            obj = !!(lastobj[key]==val);
        }
        else 
          if (t.type==="AND"&&prop!==undefined&&(prop.type&(PropTypes.ENUM|PropTypes.FLAG))) {
            p.expect("AND");
            let t2=p.peeknext();
            let type=t2&&t2.type==="ID" ? "ID" : "NUM";
            let val=p.expect(type);
            let val1=val;
            if (typeof val=="string") {
                val = prop.values[val];
            }
            if (val===undefined) {
                throw new DataPathError("unknown value "+val1);
            }
            if (val in prop.keys) {
                subkey = prop.keys[val];
            }
            key = dpath.path;
            obj = !!(lastobj[key]&val);
        }
        else 
          if (t.type==="LSBRACKET"&&prop!==undefined&&(prop.type&(PropTypes.ENUM|PropTypes.FLAG))) {
            p.expect("LSBRACKET");
            let t2=p.peeknext();
            let type=t2&&t2.type==="ID" ? "ID" : "NUM";
            let val=p.expect(type);
            let val1=val;
            if (typeof val=="string") {
                val = prop.values[val];
            }
            if (val===undefined) {
                console.warn(inpath, prop.values, val1, prop);
                throw new DataPathError("unknown value "+val1);
            }
            if (val in prop.keys) {
                subkey = prop.keys[val];
            }
            let bitfield;
            key = dpath.path;
            if (!(prop.flag&PropFlags.USE_CUSTOM_GETSET)) {
                bitfield = lastobj ? lastobj[key] : 0;
            }
            else {
              prop.dataref = lastobj;
              prop.datapath = inpath;
              prop.ctx = ctx;
              try {
                bitfield = prop.getValue();
              }
              catch (error) {
                  util.print_stack(error);
                  bitfield = NaN;
              }
            }
            if (lastobj===undefined&&!ignoreExistence) {
                throw new DataPathError("no data for path "+inpath);
            }
            else 
              if (lastobj!==undefined) {
                if (prop.type===PropTypes.ENUM) {
                    obj = !!(bitfield===val);
                }
                else {
                  obj = !!(bitfield&val);
                }
            }
            p.expect("RSBRACKET");
        }
        else 
          if (t.type==="LSBRACKET"&&prop!==undefined&&isVecProperty(prop)) {
            p.expect("LSBRACKET");
            let num=p.expect("NUM");
            p.expect("RSBRACKET");
            subkey = num;
            if (prop!==undefined&&!(prop.type&(PropTypes.VEC2|PropTypes.VEC3|PropTypes.VEC4|PropTypes.QUAT))) {
                lastobj = obj;
            }
            obj = obj[num];
        }
        else 
          if (t.type==="LSBRACKET") {
            p.expect("LSBRACKET");
            if (lastobj&&lastkey&&typeof lastkey==="string"&&lastkey.length>0) {
                lastobj = lastobj[lastkey];
            }
            lastkey = p_key();
            p.expect("RSBRACKET");
            if (!(__instance_of(prop, DataList))) {
                throw new DataPathError("bad property, not a list");
            }
            obj = prop.get(this, lastobj, lastkey);
            dstruct = prop.getStruct(this, lastobj, lastkey);
            if (!dstruct) {
                throw new DataPathError(inpath+": list has no entry "+lastkey);
            }
            if (p.peeknext()!==undefined&&p.peeknext().type==="DOT") {
                p.next();
            }
        }
        if (_i++>1000) {
            console.warn("infinite loop in resolvePath parser");
            break;
        }
      }
      return {dpath: lastdpath, 
     parent: lastobj2, 
     obj: lastobj, 
     value: obj, 
     key: lastkey, 
     dstruct: dstruct, 
     prop: prop, 
     subkey: subkey}
    }
     resolvePathOld2(ctx, path) {
      let splitchars=new Set([".", "[", "]", "=", "&"]);
      let subkey=undefined;
      path = path.replace(/\=\=/g, "=");
      path = "."+this.prefix+path;
      let p=[""];
      for (let i=0; i<path.length; i++) {
          let s=path[i];
          if (splitchars.has(s)) {
              if (s!=="]") {
                  p.push(s);
              }
              p.push("");
              continue;
          }
          p[p.length-1]+=s;
      }
      for (let i=0; i<p.length; i++) {
          p[i] = p[i].trim();
          if (p[i].length===0) {
              p.remove(p[i]);
              i--;
          }
          let c=parseInt(p[i]);
          if (!isNaN(c)) {
              p[i] = c;
          }
      }
      let i=0;
      let parent1, obj=ctx, parent2;
      let key=undefined;
      let dstruct=undefined;
      let arg=undefined;
      let type="normal";
      let retpath=p;
      let prop;
      let lastkey=key, a;
      let apiname=key;
      while (i<p.length-1) {
        lastkey = key;
        apiname = key;
        if (dstruct!==undefined&&dstruct.pathmap[lastkey]) {
            let dpath=dstruct.pathmap[lastkey];
            apiname = dpath.apiname;
        }
        let a=p[i];
        let b=p[i+1];
        if (a==="[") {
            let ok=false;
            key = b;
            prop = undefined;
            if (dstruct!==undefined&&dstruct.pathmap[lastkey]) {
                let dpath=dstruct.pathmap[lastkey];
                if (dpath.type===DataTypes.PROP) {
                    prop = dpath.data;
                }
            }
            if (prop!==undefined&&(prop.type===PropTypes.ENUM||prop.type===PropTypes.FLAG)) {
                util.console.context("api").log("found flag/enum property");
                ok = true;
            }
            if (ok) {
                if (isNaN(parseInt(key))) {
                    key = prop.values[key];
                }
                else 
                  if (typeof key=="int") {
                    key = parseInt(key);
                }
                let value=obj;
                if (typeof value=="string") {
                    value = prop.values[key];
                }
                if (prop.type===PropTypes.ENUM) {
                    value = !!(value==key);
                }
                else {
                  value = !!(value&key);
                }
                if (key in prop.keys) {
                    subkey = prop.keys[key];
                }
                obj = value;
                i++;
                continue;
            }
        }
        if (dstruct!==undefined&&dstruct.pathmap[lastkey]) {
            let dpath=dstruct.pathmap[lastkey];
            if (dpath.type==DataTypes.PROP) {
                prop = dpath.data;
            }
        }
        if (a==="."||a==="[") {
            key = b;
            parent2 = parent1;
            parent1 = obj;
            obj = obj[b];
            if (obj===undefined||obj===null) {
                break;
            }
            if (typeof obj=="object") {
                dstruct = this.mapStruct(obj.constructor, false);
            }
            i+=2;
            continue;
        }
        else 
          if (a==="&") {
            obj&=b;
            arg = b;
            if (b in prop.keys) {
                subkey = prop.keys[b];
            }
            i+=2;
            type = "flag";
            continue;
        }
        else 
          if (a==="=") {
            obj = obj==b;
            arg = b;
            if (b in prop.keys) {
                subkey = prop.keys[b];
            }
            i+=2;
            type = "enum";
            continue;
        }
        else {
          throw new DataPathError("bad path "+path);
        }
        i++;
      }
      if (lastkey!==undefined&&dstruct!==undefined&&dstruct.pathmap[lastkey]) {
          let dpath=dstruct.pathmap[key];
          apiname = dpath.apiname;
      }
      if (dstruct!==undefined&&dstruct.pathmap[key]) {
          let dpath=dstruct.pathmap[key];
          if (dpath.type==DataTypes.PROP) {
              prop = dpath.data;
          }
      }
      return {parent: parent2, 
     obj: parent1, 
     value: obj, 
     key: key, 
     dstruct: dstruct, 
     subkey: subkey, 
     prop: prop, 
     arg: arg, 
     type: type, 
     _path: retpath}
    }
     resolvePathold(ctx, path) {
      path = this.prefix+path;
      path = path.replace(/\[/g, ".").replace(/\]/g, "").trim().split(".");
      let parent1, obj=ctx, parent2;
      let key=undefined;
      let dstruct=undefined;
      for (let c of path) {
          let c2=parseInt(c);
          if (!isNaN(c2)) {
              c = c2;
          }
          parent2 = parent1;
          parent1 = obj;
          key = c;
          if (typeof obj=="number") {
              obj = obj&c;
              break;
          }
          obj = obj[c];
          if (typeof obj=="object") {
              dstruct = this.mapStruct(obj.constructor, false);
          }
      }
      let prop;
      if (dstruct!==undefined&&dstruct.pathmap[key]) {
          let dpath=dstruct.pathmap[key];
          if (dpath.type==DataTypes.PROP) {
              prop = dpath.data;
          }
      }
      return {parent: parent2, 
     obj: parent1, 
     value: obj, 
     key: key, 
     dstruct: dstruct, 
     prop: prop}
    }
     _stripToolUIName(path, uiNameOut=undefined) {
      if (path.search(/\|/)>=0) {
          if (uiNameOut) {
              uiNameOut[0] = path.slice(path.search(/\|/)+1, path.length).trim();
          }
          path = path.slice(0, path.search(/\|/)).trim();
      }
      return path.trim();
    }
     getToolDef(path) {
      let uiname=[undefined];
      path = this._stripToolUIName(path, uiname);
      uiname = uiname[0];
      let cls=this.parseToolPath(path);
      if (cls===undefined) {
          throw new DataPathError("unknown path \""+path+"\"");
      }
      let def=cls.tooldef();
      if (uiname) {
          def.uiname = uiname;
      }
      return def;
    }
     getToolPathHotkey(ctx, path) {
      path = this._stripToolUIName(path);
      try {
        return this.getToolPathHotkey_intern(ctx, path);
      }
      catch (error) {
          print_stack(error);
          util.console.context("api").log("failed to fetch tool path: "+path);
          return undefined;
      }
    }
     getToolPathHotkey_intern(ctx, path) {
      let screen=ctx.screen;
      let this2=this;
      function searchKeymap(keymap) {
        if (keymap===undefined) {
            return undefined;
        }
        for (let hk of keymap) {
            if (typeof hk.action!=="string") {
                continue;
            }
            let tool=this2._stripToolUIName(hk.action);
            if (tool===path) {
                return hk.buildString();
            }
        }
      }
      if (screen.sareas.length===0) {
          return searchKeymap(screen.keymap);
      }
      let areacls=screen.sareas[0].area.constructor;
      let area=areacls.getActiveArea();
      if (area) {
          for (let keymap of area.getKeyMaps()) {
              let ret=searchKeymap(keymap);
              if (ret!==undefined) {
                  return ret;
              }
          }
      }
      for (let sarea of screen.sareas) {
          if (!sarea.area)
            continue;
          for (let keymap of sarea.area.getKeyMaps()) {
              let ret=searchKeymap(keymap);
              if (ret) {
                  return ret;
              }
          }
      }
      return this.keymap ? searchKeymap(this.keymap) : false;
    }
     parseToolPath(path) {
      try {
        return parseToolPath(path).toolclass;
      }
      catch (error) {
          if (__instance_of(error, DataPathError)) {
              console.warn("warning, bad tool path "+path);
              return undefined;
          }
          else {
            throw error;
          }
      }
    }
     parseToolArgs(path) {
      return parseToolPath(path).args;
    }
     createTool(ctx, path, inputs={}) {
      let cls;
      let args;
      if (typeof path=="string"||__instance_of(path, String)) {
          let tpath=parseToolPath(path);
          cls = tpath.toolclass;
          args = tpath.args;
      }
      else {
        cls = path;
        args = {};
      }
      if (!cls) {
          debugger;
          console.error("Unknown tool "+path);
      }
      let tool=cls.invoke(ctx, args);
      if (inputs!==undefined) {
          for (let k in inputs) {
              if (!(k in tool.inputs)) {
                  console.warn(cls.tooldef().uiname+": Unknown tool property \""+k+"\"");
                  continue;
              }
              tool.inputs[k].setValue(inputs[k]);
          }
      }
      return tool;
    }
  }
  _ESClass.register(DataAPI);
  _es6_module.add_class(DataAPI);
  DataAPI = _es6_module.add_export('DataAPI', DataAPI);
  function initSimpleController() {
    initToolPaths();
  }
  initSimpleController = _es6_module.add_export('initSimpleController', initSimpleController);
  var DataPathSetOp=es6_import_item(_es6_module, './controller_ops.js', 'DataPathSetOp');
  let dpt=DataPathSetOp;
  function getDataPathToolOp() {
    return dpt;
  }
  getDataPathToolOp = _es6_module.add_export('getDataPathToolOp', getDataPathToolOp);
  function setDataPathToolOp(cls) {
    ToolOp.unregister(DataPathSetOp);
    if (!ToolOp.isRegistered(cls)) {
        ToolOp.register(cls);
    }
    dpt = cls;
  }
  setDataPathToolOp = _es6_module.add_export('setDataPathToolOp', setDataPathToolOp);
  setImplementationClass(DataAPI);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/controller/controller.js');


es6_module_define('controller_abstract', ["../toolsys/toolprop_abstract.js", "../util/util.js", "./controller_base.js", "../toolsys/toolsys.js", "../toolsys/toolprop.js"], function _controller_abstract_module(_es6_module) {
  var ToolOp=es6_import_item(_es6_module, '../toolsys/toolsys.js', 'ToolOp');
  var print_stack=es6_import_item(_es6_module, '../util/util.js', 'print_stack');
  var PropFlags=es6_import_item(_es6_module, '../toolsys/toolprop_abstract.js', 'PropFlags');
  var PropTypes=es6_import_item(_es6_module, '../toolsys/toolprop_abstract.js', 'PropTypes');
  var ToolProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'ToolProperty');
  var DataPathError=es6_import_item(_es6_module, './controller_base.js', 'DataPathError');
  var isVecProperty=es6_import_item(_es6_module, './controller_base.js', 'isVecProperty');
  var ListIface=es6_import_item(_es6_module, './controller_base.js', 'ListIface');
  class ModelInterface  {
     constructor() {
      this.prefix = "";
    }
     getToolDef(path) {
      throw new Error("implement me");
    }
     getToolPathHotkey(ctx, path) {
      return undefined;
    }
    get  list() {
      throw new Error("implement me");
      return ListIface;
    }
     createTool(path, inputs={}, constructor_argument=undefined) {
      throw new Error("implement me");
    }
     parseToolPath(path) {
      throw new Error("implement me");
    }
     execOrRedo(ctx, toolop, compareInputs=false) {
      return ctx.toolstack.execOrRedo(ctx, toolop, compareInputs);
    }
     execTool(ctx, path, inputs={}, constructor_argument=undefined) {
      return new Promise((accept, reject) =>        {
        let tool=path;
        try {
          if (typeof tool=="string"||!(__instance_of(tool, ToolOp))) {
              tool = this.createTool(ctx, path, inputs, constructor_argument);
          }
        }
        catch (error) {
            print_stack(error);
            reject(error);
            return ;
        }
        accept(tool);
        try {
          ctx.toolstack.execTool(ctx, tool);
        }
        catch (error) {
            print_stack(error);
            throw error;
        }
      });
    }
     pushReportContext(name) {

    }
     popReportContext() {

    }
    static  toolRegistered(tool) {
      throw new Error("implement me");
    }
    static  registerTool(tool) {
      throw new Error("implement me");
    }
     massSetProp(ctx, mass_set_path, value) {
      throw new Error("implement me");
    }
     resolveMassSetPaths(ctx, mass_set_path) {
      throw new Error("implement me");
    }
     resolvePath(ctx, path, ignoreExistence, rootStruct) {

    }
     setValue(ctx, path, val, rootStruct) {
      let res=this.resolvePath(ctx, path, undefined, rootStruct);
      let prop=res.prop;
      if (prop!==undefined&&(prop.flag&PropFlags.READ_ONLY)) {
          throw new DataPathError("Tried to set read only property");
      }
      if (prop!==undefined&&(prop.flag&PropFlags.USE_CUSTOM_GETSET)) {
          prop.dataref = res.obj;
          prop.ctx = ctx;
          prop.datapath = path;
          if (res.subkey!==undefined) {
              let val2=prop.getValue();
              if (typeof val2==="object") {
                  val2 = val2.copy();
              }
              if (prop.type===PropTypes.FLAG) {
                  if (val) {
                      val2|=prop.values[res.subkey];
                  }
                  else {
                    val2&=~prop.values[res.subkey];
                  }
                  val = val2;
              }
              else 
                if (prop.type===PropTypes.ENUM) {
                  val = prop.values[res.subkey];
              }
              else {
                val2[res.subkey] = val;
                val = val2;
              }
          }
          prop.setValue(val);
          return ;
      }
      if (prop!==undefined) {
          if (prop.type===PropTypes.CURVE&&!val) {
              throw new DataPathError("can't set curve data to nothing");
          }
          let use_range=(prop.type&(PropTypes.INT|PropTypes.FLOAT));
          use_range = use_range||(res.subkey&&(prop.type&(PropTypes.VEC2|PropTypes.VEC3|PropTypes.VEC4)));
          use_range = use_range&&prop.range;
          use_range = use_range&&!(prop.range[0]===0.0&&prop.range[1]===0.0);
          use_range = use_range&&typeof val==="number";
          if (use_range) {
              val = Math.min(Math.max(val, prop.range[0]), prop.range[1]);
          }
      }
      let old=res.obj[res.key];
      if (res.subkey!==undefined&&res.prop!==undefined&&res.prop.type===PropTypes.ENUM) {
          let ival=res.prop.values[res.subkey];
          if (val) {
              res.obj[res.key] = ival;
          }
      }
      else 
        if (res.prop!==undefined&&res.prop.type===PropTypes.FLAG) {
          if (res.subkey!==undefined) {
              let ival=res.prop.values[res.subkey];
              if (val) {
                  res.obj[res.key]|=ival;
              }
              else {
                res.obj[res.key]&=~ival;
              }
          }
          else 
            if (typeof val==="number"||typeof val==="boolean") {
              val = typeof val==="boolean" ? (val&1) : val;
              res.obj[res.key] = val;
          }
          else {
            throw new DataPathError("Expected a number for a bitmask property");
          }
      }
      else 
        if (res.subkey!==undefined&&isVecProperty(res.prop)) {
          if (res.key!=="") {
              res.obj[res.key][res.subkey] = val;
          }
          else {
            res.obj[res.subkey] = val;
          }
      }
      else 
        if (res.key===""&&isVecProperty(res.prop)) {
          for (let i=0; i<res.obj.length; i++) {
              res.obj[i] = val[i];
          }
      }
      else 
        if (!(prop!==undefined&&__instance_of(prop, ListIface))) {
          res.obj[res.key] = val;
      }
      if (prop!==undefined&&__instance_of(prop, ListIface)) {
          prop.set(this, res.obj, res.key, val);
      }
      else 
        if (prop!==undefined) {
          prop.dataref = res.obj;
          prop.datapath = path;
          prop.ctx = ctx;
          prop._fire("change", res.obj[res.key], old);
      }
    }
     getDescription(ctx, path) {
      let rdef=this.resolvePath(ctx, path);
      if (rdef===undefined) {
          throw new DataPathError("invalid path "+path);
      }
      if (!rdef.prop||!(__instance_of(rdef.prop, ToolProperty))) {
          return "";
      }
      let type=rdef.prop.type;
      let prop=rdef.prop;
      if (rdef.subkey!==undefined) {
          let subkey=rdef.subkey;
          if (type&(PropTypes.VEC2|PropTypes.VEC3|PropTypes.VEC4)) {
              if (prop.descriptions&&subkey in prop.descriptions) {
                  return prop.descriptions[subkey];
              }
          }
          else 
            if (type&(PropTypes.ENUM|PropTypes.FLAG)) {
              if (!(subkey in prop.values)&&subkey in prop.keys) {
                  subkey = prop.keys[subkey];
              }
              
              if (prop.descriptions&&subkey in prop.descriptions) {
                  return prop.descriptions[subkey];
              }
          }
          else 
            if (type===PropTypes.PROPLIST) {
              let val=tdef.value;
              if (typeof val==="object"&&__instance_of(val, ToolProperty)) {
                  return val.description;
              }
          }
      }
      return rdef.prop.description ? rdef.prop.description : rdef.prop.uiname;
    }
     validPath(ctx, path, rootStruct) {
      try {
        this.getValue(ctx, path, rootStruct);
        return true;
      }
      catch (error) {
          if (!(__instance_of(error, DataPathError))) {
              throw error;
          }
      }
      return false;
    }
     getPropName(ctx, path) {
      let i=path.length-1;
      while (i>=0&&path[i]!==".") {
        i--;
      }
      path = path.slice(i+1, path.length).trim();
      if (path.endsWith("]")) {
          i = path.length-1;
          while (i>=0&&path[i]!=="[") {
            i--;
          }
          path = path.slice(0, i).trim();
          return this.getPropName(ctx, path);
      }
      return path;
    }
     getValue(ctx, path, rootStruct=undefined) {
      if (typeof ctx=="string") {
          throw new Error("You forgot to pass context to getValue");
      }
      let ret=this.resolvePath(ctx, path, undefined, rootStruct);
      if (ret===undefined) {
          throw new DataPathError("invalid path "+path);
      }
      let exec=ret.prop!==undefined&&(ret.prop.flag&PropFlags.USE_CUSTOM_GETSET);
      exec = exec&&!(ret.prop!==undefined&&(ret.prop.type&(PropTypes.VEC2|PropTypes.VEC3|PropTypes.VEC4|PropTypes.QUAT)));
      if (exec) {
          ret.prop.dataref = ret.obj;
          ret.prop.datapath = path;
          ret.prop.ctx = ctx;
          let val=ret.prop.getValue();
          if (typeof val==="string"&&(ret.prop.type&(PropTypes.FLAG|PropTypes.ENUM))) {
              val = ret.prop.values[val];
          }
          if (ret.subkey&&ret.prop.type===PropTypes.ENUM) {
              val = val===ret.prop.values[ret.subkey];
          }
          else 
            if (ret.subkey&&ret.prop.type===PropTypes.FLAG) {
              val = val&ret.prop.values[ret.subkey];
          }
          return val;
      }
      return ret.value;
    }
  }
  _ESClass.register(ModelInterface);
  _es6_module.add_class(ModelInterface);
  ModelInterface = _es6_module.add_export('ModelInterface', ModelInterface);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/controller/controller_abstract.js');


es6_module_define('controller_base', ["../toolsys/toolprop.js", "../util/util.js", "../util/vectormath.js", "../toolsys/toolprop_abstract.js"], function _controller_base_module(_es6_module) {
  var PropFlags=es6_import_item(_es6_module, '../toolsys/toolprop_abstract.js', 'PropFlags');
  var PropTypes=es6_import_item(_es6_module, '../toolsys/toolprop_abstract.js', 'PropTypes');
  var Quat=es6_import_item(_es6_module, '../util/vectormath.js', 'Quat');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector4');
  var toolprop_abstract=es6_import(_es6_module, '../toolsys/toolprop_abstract.js');
  var toolprop=es6_import(_es6_module, '../toolsys/toolprop.js');
  var print_stack=es6_import_item(_es6_module, '../util/util.js', 'print_stack');
  var cachering=es6_import_item(_es6_module, '../util/util.js', 'cachering');
  const DataFlags={READ_ONLY: 1, 
   USE_CUSTOM_GETSET: 2, 
   USE_FULL_UNDO: 4, 
   USE_CUSTOM_PROP_GETTER: 8}
  _es6_module.add_export('DataFlags', DataFlags);
  const DataTypes={STRUCT: 0, 
   DYNAMIC_STRUCT: 1, 
   PROP: 2, 
   ARRAY: 3}
  _es6_module.add_export('DataTypes', DataTypes);
  let propCacheRings={}
  function getTempProp(type) {
    if (!(type in propCacheRings)) {
        propCacheRings[type] = cachering.fromConstructor(ToolProperty.getClass(type), 32);
    }
    return propCacheRings[type].next();
  }
  getTempProp = _es6_module.add_export('getTempProp', getTempProp);
  class DataPathError extends Error {
  }
  _ESClass.register(DataPathError);
  _es6_module.add_class(DataPathError);
  DataPathError = _es6_module.add_export('DataPathError', DataPathError);
  
  function getVecClass(proptype) {
    switch (proptype) {
      case PropTypes.VEC2:
        return Vector2;
      case PropTypes.VEC3:
        return Vector3;
      case PropTypes.VEC4:
        return Vector4;
      case PropTypes.QUAT:
        return Quat;
      default:
        throw new Error("bad prop type "+proptype);
    }
  }
  getVecClass = _es6_module.add_export('getVecClass', getVecClass);
  function isVecProperty(prop) {
    if (!prop||typeof prop!=="object"||prop===null)
      return false;
    let ok=false;
    ok = ok||__instance_of(prop, toolprop_abstract.Vec2PropertyIF);
    ok = ok||__instance_of(prop, toolprop_abstract.Vec3PropertyIF);
    ok = ok||__instance_of(prop, toolprop_abstract.Vec4PropertyIF);
    ok = ok||__instance_of(prop, toolprop.Vec2Property);
    ok = ok||__instance_of(prop, toolprop.Vec3Property);
    ok = ok||__instance_of(prop, toolprop.Vec4Property);
    ok = ok||prop.type===PropTypes.VEC2;
    ok = ok||prop.type===PropTypes.VEC3;
    ok = ok||prop.type===PropTypes.VEC4;
    ok = ok||prop.type===PropTypes.QUAT;
    return ok;
  }
  isVecProperty = _es6_module.add_export('isVecProperty', isVecProperty);
  class DataPath  {
     constructor(path, apiname, prop, type=DataTypes.PROP) {
      this.type = type;
      this.data = prop;
      this.apiname = apiname;
      this.path = path;
      this.flag = 0;
      this.struct = undefined;
    }
     copy() {
      let ret=new DataPath();
      ret.flag = this.flag;
      ret.type = this.type;
      ret.data = this.data;
      ret.apiname = this.apiname;
      ret.path = this.path;
      ret.struct = this.struct;
      return ret;
    }
     noUndo() {
      this.data.flag|=PropFlags.NO_UNDO;
      return this;
    }
     setProp(prop) {
      this.data = prop;
    }
     readOnly() {
      this.flag|=DataFlags.READ_ONLY;
      if (this.type===DataTypes.PROP) {
          this.data.flag|=PropFlags.READ_ONLY;
      }
      return this;
    }
     read_only() {
      console.warn("DataPath.read_only is deprecated; use readOnly");
      return this.readOnly();
    }
     customPropCallback(callback) {
      this.flag|=DataFlags.USE_CUSTOM_PROP_GETTER;
      this.data.flag|=PropFlags.USE_CUSTOM_PROP_GETTER;
      this.propGetter = callback;
      return this;
    }
     customGetSet(get, set) {
      this.flag|=DataFlags.USE_CUSTOM_GETSET;
      if (this.type!==DataTypes.DYNAMIC_STRUCT&&this.type!==DataTypes.STRUCT) {
          this.data.flag|=PropFlags.USE_CUSTOM_GETSET;
          this.data._getValue = this.data.getValue;
          this.data._setValue = this.data.setValue;
          if (get)
            this.data.getValue = get;
          if (set)
            this.data.setValue = set;
      }
      else {
        this.getSet = {get: get, 
      set: set};
        this.getSet.dataref = undefined;
        this.getSet.datapath = undefined;
        this.getSet.ctx = undefined;
      }
      return this;
    }
     customSet(set) {
      this.customGetSet(undefined, set);
      return this;
    }
     customGet(get) {
      this.customGetSet(get, undefined);
      return this;
    }
     on(type, cb) {
      if (this.type==DataTypes.PROP) {
          this.data.on(type, cb);
      }
      else {
        throw new Error("invalid call to DataPath.on");
      }
      return this;
    }
     off(type, cb) {
      if (this.type===DataTypes.PROP) {
          this.data.off(type, cb);
      }
    }
     simpleSlider() {
      this.data.flag|=PropFlags.SIMPLE_SLIDER;
      this.data.flag&=~PropFlags.FORCE_ROLLER_SLIDER;
      return this;
    }
     rollerSlider() {
      this.data.flag&=~PropFlags.SIMPLE_SLIDER;
      this.data.flag|=PropFlags.FORCE_ROLLER_SLIDER;
      return this;
    }
     noUnits() {
      this.baseUnit("none");
      this.displayUnit("none");
      return this;
    }
     baseUnit(unit) {
      this.data.setBaseUnit(unit);
      return this;
    }
     displayUnit(unit) {
      this.data.setDisplayUnit(unit);
      return this;
    }
     unit(unit) {
      return this.baseUnit(unit).displayUnit(unit);
    }
     editAsBaseUnit() {
      this.data.flag|=PropFlags.EDIT_AS_BASE_UNIT;
      return this;
    }
     range(min, max) {
      this.data.setRange(min, max);
      return this;
    }
     uiRange(min, max) {
      this.data.setUIRange(min, max);
      return this;
    }
     decimalPlaces(n) {
      this.data.setDecimalPlaces(n);
      return this;
    }
     uiNameGetter(func) {
      this.ui_name_get = func;
      return this;
    }
     expRate(exp) {
      this.data.setExpRate(exp);
      return this;
    }
     slideSpeed(speed) {
      this.data.setSlideSpeed(speed);
      return this;
    }
     uniformSlider(state=true) {
      this.data.uniformSlider(state);
      return this;
    }
     radix(r) {
      this.data.setRadix(r);
      return this;
    }
     relativeStep(s) {
      this.data.setRelativeStep(s);
      return this;
    }
     step(s) {
      this.data.setStep(s);
      return this;
    }
     fullSaveUndo() {
      this.flag|=DataFlags.USE_FULL_UNDO;
      this.data.flag|=PropFlags.USE_BASE_UNDO;
      return this;
    }
     icon(i) {
      this.data.setIcon(i);
      return this;
    }
     icon2(i) {
      this.data.setIcon2(i);
      return this;
    }
     icons(icons) {
      this.data.addIcons(icons);
      return this;
    }
     icons2(icons) {
      this.data.addIcons2(icons);
      return this;
    }
     descriptions(description_map) {
      this.data.addDescriptions(description_map);
      return this;
    }
     uiNames(uinames) {
      this.data.addUINames(uinames);
      return this;
    }
     description(d) {
      this.data.description = d;
      return this;
    }
  }
  _ESClass.register(DataPath);
  _es6_module.add_class(DataPath);
  DataPath = _es6_module.add_export('DataPath', DataPath);
  const StructFlags={NO_UNDO: 1}
  _es6_module.add_export('StructFlags', StructFlags);
  class ListIface  {
     getStruct(api, list, key) {

    }
     get(api, list, key) {

    }
     getKey(api, list, obj) {

    }
     getActive(api, list) {

    }
     setActive(api, list, val) {

    }
     set(api, list, key, val) {
      list[key] = val;
    }
     getIter() {

    }
     filter(api, list, filter) {

    }
  }
  _ESClass.register(ListIface);
  _es6_module.add_class(ListIface);
  ListIface = _es6_module.add_export('ListIface', ListIface);
  class ToolOpIface  {
     constructor() {

    }
    static  tooldef() {
      return {uiname: "!untitled tool", 
     icon: -1, 
     toolpath: "logical_module.tool", 
     description: undefined, 
     is_modal: false, 
     inputs: {}, 
     outputs: {}}
    }
  }
  _ESClass.register(ToolOpIface);
  _es6_module.add_class(ToolOpIface);
  ToolOpIface = _es6_module.add_export('ToolOpIface', ToolOpIface);
  
  let DataAPIClass=undefined;
  function setImplementationClass(cls) {
    DataAPIClass = cls;
  }
  setImplementationClass = _es6_module.add_export('setImplementationClass', setImplementationClass);
  function registerTool(cls) {
    if (DataAPIClass===undefined) {
        throw new Error("data api not initialized properly; call setImplementationClass");
    }
    return DataAPIClass.registerTool(cls);
  }
  registerTool = _es6_module.add_export('registerTool', registerTool);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/controller/controller_base.js');


es6_module_define('controller_ops', ["../util/util.js", "../toolsys/toolsys.js", "./controller_base.js", "../toolsys/toolprop.js"], function _controller_ops_module(_es6_module) {
  var ToolOp=es6_import_item(_es6_module, '../toolsys/toolsys.js', 'ToolOp');
  var ToolFlags=es6_import_item(_es6_module, '../toolsys/toolsys.js', 'ToolFlags');
  var PropTypes=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropTypes');
  var PropFlags=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropFlags');
  var BoolProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'BoolProperty');
  var IntProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'FloatProperty');
  var FlagProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'FlagProperty');
  var EnumProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'EnumProperty');
  var StringProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'StringProperty');
  var Vec3Property=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'Vec3Property');
  var Vec2Property=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'Vec2Property');
  var Vec4Property=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'Vec4Property');
  var QuatProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'QuatProperty');
  var Mat4Property=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'Mat4Property');
  var util=es6_import(_es6_module, '../util/util.js');
  var isVecProperty=es6_import_item(_es6_module, './controller_base.js', 'isVecProperty');
  var getVecClass=es6_import_item(_es6_module, './controller_base.js', 'getVecClass');
  class DataPathSetOp extends ToolOp {
     constructor() {
      super();
      this.propType = -1;
      this._undo = undefined;
    }
     setValue(ctx, val, object) {
      let prop=this.inputs.prop;
      let path=this.inputs.dataPath.getValue();
      if (prop.type&(PropTypes.ENUM|PropTypes.FLAG)) {
          let rdef=ctx.api.resolvePath(ctx, path);
          if (rdef.subkey!==undefined) {
              let subkey=rdef.subkey;
              if (typeof subkey==="string") {
                  subkey = rdef.prop.values[subkey];
              }
              this.inputs.flagBit.setValue(subkey);
              this.inputs.useFlagBit.setValue(true);
          }
      }
      prop.dataref = object;
      prop.ctx = ctx;
      prop.datapath = path;
      try {
        prop.setValue(val);
        this.hadError = false;
      }
      catch (error) {
          console.error("Error setting datapath", path);
          this.hadError = true;
      }
    }
    static  create(ctx, datapath, value, id, massSetPath) {
      let rdef=ctx.api.resolvePath(ctx, datapath);
      if (rdef===undefined||rdef.prop===undefined) {
          console.warn("DataPathSetOp failed", rdef, rdef.prop);
          return ;
      }
      let prop=rdef.prop;
      let tool=new DataPathSetOp();
      tool.propType = prop.type;
      tool.inputs.destType.setValue(prop.type);
      if (prop&&(prop.flag&PropFlags.USE_BASE_UNDO)) {
          tool.inputs.fullSaveUndo.setValue(true);
      }
      let mask=PropTypes.FLAG|PropTypes.ENUM;
      mask|=PropTypes.VEC2|PropTypes.VEC3|PropTypes.VEC4|PropTypes.QUAT;
      if (rdef.subkey!==undefined&&(prop.type&mask)) {
          if (prop.type&(PropTypes.ENUM|PropTypes.FLAG)) {
              let i=datapath.length-1;
              while (i>=0&&datapath[i]!=='[') {
                i--;
              }
              if (i>=0) {
                  datapath = datapath.slice(0, i);
              }
              tool.inputs.prop = new IntProperty();
          }
          else {
            tool.inputs.prop = new FloatProperty();
          }
          let subkey=rdef.subkey;
          if (typeof subkey!=="number") {
              subkey = rdef.prop.values[subkey];
          }
          if (prop.type===PropTypes.FLAG) {
              tool.inputs.flagBit.setValue(subkey);
              tool.inputs.useFlagBit.setValue(true);
          }
          if (prop.type===PropTypes.ENUM) {
              value = subkey;
          }
          else 
            if (prop.type===PropTypes.FLAG) {
              let value2=ctx.api.getValue(ctx, datapath);
              if (typeof value2!=="number") {
                  value2 = typeof value2==="boolean" ? (value&1) : 0;
              }
              if (value) {
                  value2|=subkey;
              }
              else {
                value2&=~subkey;
              }
              value = value2;
          }
      }
      else {
        tool.inputs.prop = prop.copy();
      }
      tool.inputs.dataPath.setValue(datapath);
      if (massSetPath) {
          tool.inputs.massSetPath.setValue(massSetPath);
      }
      else {
        tool.inputs.massSetPath.setValue("");
      }
      tool.id = id;
      tool.setValue(ctx, value, rdef.obj);
      return tool;
    }
     hash(massSetPath, dataPath, prop, id) {
      massSetPath = massSetPath===undefined ? "" : massSetPath;
      massSetPath = massSetPath===null ? "" : massSetPath;
      let ret=""+massSetPath+":"+dataPath+":"+prop+":"+id;
      return ret;
    }
     hashThis() {
      return this.hash(this.inputs.massSetPath.getValue(), this.inputs.dataPath.getValue(), this.propType, this.id);
    }
     undoPre(ctx) {
      if (this.inputs.fullSaveUndo.getValue()) {
          return super.undoPre(ctx);
      }
      if (this.__ctx)
        ctx = this.__ctx;
      this._undo = {};
      let paths=new Set();
      if (this.inputs.massSetPath.getValue().trim()) {
          let massSetPath=this.inputs.massSetPath.getValue().trim();
          paths = new Set(ctx.api.resolveMassSetPaths(ctx, massSetPath));
      }
      paths.add(this.inputs.dataPath.getValue());
      for (let path of paths) {
          let val=ctx.api.getValue(ctx, path);
          if (typeof val==="object") {
              val = val.copy();
          }
          this._undo[path] = val;
      }
    }
     undo(ctx) {
      if (this.__ctx)
        ctx = this.__ctx;
      if (this.inputs.fullSaveUndo.getValue()) {
          return super.undo(ctx);
      }
      for (let path in this._undo) {
          let rdef=ctx.api.resolvePath(ctx, path);
          if (rdef.prop!==undefined&&(rdef.prop.type&(PropTypes.ENUM|PropTypes.FLAG))) {
              let old=rdef.obj[rdef.key];
              if (rdef.subkey) {
                  let key=rdef.subkey;
                  if (typeof key!=="number") {
                      key = rdef.prop.values[key];
                  }
                  if (rdef.prop.type===PropTypes.FLAG) {
                      if (this._undo[path]) {
                          rdef.obj[rdef.key]|=key;
                      }
                      else {
                        rdef.obj[rdef.key]&=~key;
                      }
                  }
                  else {
                    rdef.obj[rdef.key] = key;
                  }
              }
              else {
                rdef.obj[rdef.key] = this._undo[path];
              }
              rdef.prop.dataref = rdef.obj;
              rdef.prop.datapath = path;
              rdef.prop.ctx = ctx;
              rdef.prop._fire("change", rdef.obj[rdef.key], old);
          }
          else {
            try {
              ctx.api.setValue(ctx, path, this._undo[path]);
            }
            catch (error) {
                util.print_stack(error);
                console.warn("Failed to set property in undo for DataPathSetOp");
            }
          }
      }
    }
     exec(ctx) {
      if (this.__ctx) {
          ctx = this.__ctx;
      }
      let path=this.inputs.dataPath.getValue();
      let massSetPath=this.inputs.massSetPath.getValue().trim();
      try {
        ctx.api.setValue(ctx, path, this.inputs.prop.getValue());
        this.hadError = false;
      }
      catch (error) {
          console.log(error.stack);
          console.log(error.message);
          console.log("error setting "+path);
          this.hadError = true;
      }
      if (massSetPath) {
          let value=this.inputs.prop.getValue();
          let useFlagBit=this.inputs.useFlagBit.getValue();
          if (useFlagBit&&this.inputs.destType.getValue()===PropTypes.FLAG) {
              let bit=this.inputs.flagBit.getValue();
              value = !!(value&bit);
          }
          try {
            ctx.api.massSetProp(ctx, massSetPath, value);
          }
          catch (error) {
              console.log(error.stack);
              console.log(error.message);
              console.log("error setting "+path);
              this.hadError = true;
          }
      }
    }
     modalStart(ctx) {
      this.__ctx = ctx.toLocked();
      super.modalStart(this.__ctx);
      this.exec(this.__ctx);
      this.modalEnd(false);
    }
    static  tooldef() {
      return {uiname: "Property Set", 
     toolpath: "app.prop_set", 
     icon: -1, 
     flag: ToolFlags.PRIVATE, 
     is_modal: true, 
     inputs: {dataPath: new StringProperty(), 
      massSetPath: new StringProperty(), 
      fullSaveUndo: new BoolProperty(false), 
      flagBit: new IntProperty(), 
      useFlagBit: new BoolProperty(), 
      destType: new EnumProperty(PropTypes.INT, PropTypes)}}
    }
  }
  _ESClass.register(DataPathSetOp);
  _es6_module.add_class(DataPathSetOp);
  DataPathSetOp = _es6_module.add_export('DataPathSetOp', DataPathSetOp);
  ToolOp.register(DataPathSetOp);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/controller/controller_ops.js');


es6_module_define('controller', ["./controller/controller_abstract.js", "./curve/curve1d_base.js", "./util/graphpack.js", "./extern/lz-string/lz-string.js", "./util/math.js", "./curve/curve1d_bspline.js", "./util/simple_events.js", "./util/html5_fileapi.js", "./config/config.js", "./util/colorutils.js", "./toolsys/toolprop.js", "./util/util.js", "./toolsys/toolpath.js", "./util/vectormath.js", "./toolsys/toolprop_abstract.js", "./controller/context.js", "./toolsys/toolsys.js", "./util/struct.js", "./controller/controller_ops.js", "./controller/controller_base.js", "./util/parseutil.js", "./util/solver.js", "./controller/controller.js", "./curve/curve1d.js"], function _controller_module(_es6_module) {
  var ___controller_context_js=es6_import(_es6_module, './controller/context.js');
  for (let k in ___controller_context_js) {
      _es6_module.add_export(k, ___controller_context_js[k], true);
  }
  var ___controller_controller_js=es6_import(_es6_module, './controller/controller.js');
  for (let k in ___controller_controller_js) {
      _es6_module.add_export(k, ___controller_controller_js[k], true);
  }
  var ___controller_controller_abstract_js=es6_import(_es6_module, './controller/controller_abstract.js');
  for (let k in ___controller_controller_abstract_js) {
      _es6_module.add_export(k, ___controller_controller_abstract_js[k], true);
  }
  var ___controller_controller_ops_js=es6_import(_es6_module, './controller/controller_ops.js');
  for (let k in ___controller_controller_ops_js) {
      _es6_module.add_export(k, ___controller_controller_ops_js[k], true);
  }
  var ___controller_controller_abstract_js=es6_import(_es6_module, './controller/controller_abstract.js');
  for (let k in ___controller_controller_abstract_js) {
      _es6_module.add_export(k, ___controller_controller_abstract_js[k], true);
  }
  var ___controller_controller_base_js=es6_import(_es6_module, './controller/controller_base.js');
  for (let k in ___controller_controller_base_js) {
      _es6_module.add_export(k, ___controller_controller_base_js[k], true);
  }
  var ___toolsys_toolsys_js=es6_import(_es6_module, './toolsys/toolsys.js');
  for (let k in ___toolsys_toolsys_js) {
      _es6_module.add_export(k, ___toolsys_toolsys_js[k], true);
  }
  var ___toolsys_toolprop_js=es6_import(_es6_module, './toolsys/toolprop.js');
  for (let k in ___toolsys_toolprop_js) {
      _es6_module.add_export(k, ___toolsys_toolprop_js[k], true);
  }
  var ___toolsys_toolpath_js=es6_import(_es6_module, './toolsys/toolpath.js');
  for (let k in ___toolsys_toolpath_js) {
      _es6_module.add_export(k, ___toolsys_toolpath_js[k], true);
  }
  var ___curve_curve1d_base_js=es6_import(_es6_module, './curve/curve1d_base.js');
  for (let k in ___curve_curve1d_base_js) {
      _es6_module.add_export(k, ___curve_curve1d_base_js[k], true);
  }
  var ___curve_curve1d_js=es6_import(_es6_module, './curve/curve1d.js');
  for (let k in ___curve_curve1d_js) {
      _es6_module.add_export(k, ___curve_curve1d_js[k], true);
  }
  var solver=es6_import(_es6_module, './util/solver.js');
  solver = _es6_module.add_export('solver', solver);
  var util=es6_import(_es6_module, './util/util.js');
  util = _es6_module.add_export('util', util);
  var vectormath=es6_import(_es6_module, './util/vectormath.js');
  vectormath = _es6_module.add_export('vectormath', vectormath);
  var math=es6_import(_es6_module, './util/math.js');
  math = _es6_module.add_export('math', math);
  var toolprop_abstract=es6_import(_es6_module, './toolsys/toolprop_abstract.js');
  toolprop_abstract = _es6_module.add_export('toolprop_abstract', toolprop_abstract);
  var html5_fileapi=es6_import(_es6_module, './util/html5_fileapi.js');
  html5_fileapi = _es6_module.add_export('html5_fileapi', html5_fileapi);
  var parseutil=es6_import(_es6_module, './util/parseutil.js');
  parseutil = _es6_module.add_export('parseutil', parseutil);
  var config=es6_import(_es6_module, './config/config.js');
  config = _es6_module.add_export('config', config);
  var nstructjs=es6_import_item(_es6_module, './util/struct.js', 'default');
  nstructjs = _es6_module.add_export('nstructjs', nstructjs);
  var lzstring=es6_import_item(_es6_module, './extern/lz-string/lz-string.js', 'default');
  lzstring = _es6_module.add_export('lzstring', lzstring);
  var ___util_vectormath_js=es6_import(_es6_module, './util/vectormath.js');
  for (let k in ___util_vectormath_js) {
      _es6_module.add_export(k, ___util_vectormath_js[k], true);
  }
  var ___util_math_js=es6_import(_es6_module, './util/math.js');
  for (let k in ___util_math_js) {
      _es6_module.add_export(k, ___util_math_js[k], true);
  }
  var ___util_colorutils_js=es6_import(_es6_module, './util/colorutils.js');
  for (let k in ___util_colorutils_js) {
      _es6_module.add_export(k, ___util_colorutils_js[k], true);
  }
  var ___util_graphpack_js=es6_import(_es6_module, './util/graphpack.js');
  for (let k in ___util_graphpack_js) {
      _es6_module.add_export(k, ___util_graphpack_js[k], true);
  }
  var ___util_solver_js=es6_import(_es6_module, './util/solver.js');
  for (let k in ___util_solver_js) {
      _es6_module.add_export(k, ___util_solver_js[k], true);
  }
  var ___util_simple_events_js=es6_import(_es6_module, './util/simple_events.js');
  for (let k in ___util_simple_events_js) {
      _es6_module.add_export(k, ___util_simple_events_js[k], true);
  }
  let _ex_binomial=es6_import_item(_es6_module, './curve/curve1d_bspline.js', 'binomial');
  _es6_module.add_export('binomial', _ex_binomial, true);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/controller.js');


es6_module_define('curve1d', ["../util/vectormath.js", "./curve1d_base.js", "./curve1d_anim.js", "./curve1d_basic.js", "../util/struct.js", "./curve1d_bspline.js", "../util/util.js", "../util/events.js"], function _curve1d_module(_es6_module) {
  "use strict";
  var nstructjs=es6_import_item(_es6_module, '../util/struct.js', 'default');
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var EventDispatcher=es6_import_item(_es6_module, '../util/events.js', 'EventDispatcher');
  let _ex_getCurve=es6_import_item(_es6_module, './curve1d_base.js', 'getCurve');
  _es6_module.add_export('getCurve', _ex_getCurve, true);
  let _ex_SplineTemplates=es6_import_item(_es6_module, './curve1d_bspline.js', 'SplineTemplates');
  _es6_module.add_export('SplineTemplates', _ex_SplineTemplates, true);
  let _ex_SplineTemplateIcons=es6_import_item(_es6_module, './curve1d_bspline.js', 'SplineTemplateIcons');
  _es6_module.add_export('SplineTemplateIcons', _ex_SplineTemplateIcons, true);
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
  let _udigest=new util.HashDigest();
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
      this.setGenerator("bspline");
    }
    get  generatorType() {
      return this.generators.active ? this.generators.active.type : undefined;
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
     calcHashKey(digest=_udigest.reset()) {
      let d=digest;
      for (let g of this.generators) {
          g.calcHashKey(d);
      }
      return d.get();
    }
     equals(b) {
      let gen1=this.generators.active;
      let gen2=b.generators.active;
      if (!gen1||!gen2||gen1.constructor!==gen2.constructor) {
          return false;
      }
      return gen1.equals(gen2);
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
          if (gen.constructor.define().name===type||gen.type===type||gen.constructor.define().typeName===type||gen.constructor===type) {
              if (this.generators.active) {
                  this.generators.active.onInactive();
              }
              this.generators.active = gen;
              gen.onActive();
              return ;
          }
      }
      throw new Error("unknown curve type "+type);
    }
     toJSON() {
      let ret={generators: [], 
     uiZoom: this.uiZoom, 
     VERSION: this.VERSION, 
     active_generator: this.generatorType};
      for (let gen of this.generators) {
          ret.generators.push(gen.toJSON());
      }
      ret.generators.sort((a, b) =>        {
        return a.type.localeCompare(b.type);
      });
      return ret;
    }
     getGenerator(type, throw_on_error=true) {
      for (let gen of this.generators) {
          if (gen.type===type) {
              return gen;
          }
      }
      for (let cls of CurveConstructors) {
          if (cls.define().typeName===type) {
              let gen=new cls();
              gen.type = type;
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
     integrate(s, quadSteps) {
      return this.generators.active.integrate(s, quadSteps);
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
      let w=canvas.width, h=canvas.height;
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
      let f=0, steps=64;
      let df=1/(steps-1);
      w = 6.0/sz;
      let curve=this.generators.active;
      g.beginPath();
      for (let i=0; i<steps; i++, f+=df) {
          let val=curve.evaluate(f);
          (i===0 ? g.moveTo : g.lineTo).call(g, f, val, w, w);
      }
      g.strokeStyle = "grey";
      g.stroke();
      if (this.overlay_curvefunc!==undefined) {
          g.beginPath();
          f = 0.0;
          for (let i=0; i<steps; i++, f+=df) {
              let val=this.overlay_curvefunc(f);
              (i===0 ? g.moveTo : g.lineTo).call(g, f, val, w, w);
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
      if (this.VERSION<=0.75) {
          this.generators = [];
          for (let cls of CurveConstructors) {
              this.generators.push(new cls());
          }
          this.generators.active = this.getGenerator("BSplineCurve");
      }
      for (let gen of this.generators.concat([])) {
          if (!(__instance_of(gen, CurveTypeData))) {
              console.warn("Bad generator data found:", gen);
              this.generators.remove(gen);
              continue;
          }
          if (gen.type===this._active) {
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
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/curve/curve1d.js');


es6_module_define('curve1d_anim', ["../util/struct.js", "./ease.js", "./curve1d_base.js", "../util/util.js"], function _curve1d_anim_module(_es6_module) {
  var nstructjs=es6_import_item(_es6_module, '../util/struct.js', 'default');
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
  let _udigest=new util.HashDigest();
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
    get  hasGUI() {
      return true;
    }
     calcHashKey(digest=_udigest.reset()) {
      let d=digest;
      super.calcHashKey(d);
      for (let k in this.params) {
          digest.add(k);
          digest.add(this.params[k]);
      }
      return d.get();
    }
     equals(b) {
      if (this.type!==b.type) {
          return false;
      }
      for (let k in this.params) {
          if (Math.abs(this.params[k]-b.params[k])>1e-06) {
              return false;
          }
      }
      return true;
    }
     redraw() {
      if (this.parent)
        this.parent.redraw();
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
    static  define() {
      return {params: {decay: ["Decay", 1.0, 0.1, 5.0], 
      scale: ["Scale", 1.0, 0.01, 10.0], 
      freq: ["Freq", 1.0, 0.01, 50.0], 
      phase: ["Phase", 0.0, -Math.PI*2.0, Math.PI*2.0], 
      offset: ["Offset", 0.0, -2.0, 2.0]}, 
     name: "bounce", 
     uiname: "Bounce", 
     typeName: "BounceCurve"}
    }
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
    static  define() {
      return {params: {mode: ["Out Mode", false, BOOL_FLAG, BOOL_FLAG], 
      amplitude: ["Amplitude", 1.0, 0.01, 10.0], 
      period: ["Period", 1.0, 0.01, 5.0]}, 
     name: "elastic", 
     uiname: "Elastic", 
     typeName: "ElasticCurve"}
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
    static  define() {
      return {params: {mode_in: ["in", true, BOOL_FLAG, BOOL_FLAG], 
      mode_out: ["out", true, BOOL_FLAG, BOOL_FLAG], 
      amplitude: ["Amplitude", 1.0, 0.01, 4.0]}, 
     name: "ease", 
     uiname: "Ease", 
     typeName: "EaseCurve"}
    }
     evaluate(t) {
      let amp=this.params.amplitude;
      let a1=this.params.mode_in ? 1.0-amp : 1.0/3.0;
      let a2=this.params.mode_out ? amp : 2.0/3.0;
      return bez4(0.0, a1, a2, 1.0, t);
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
    get  seed() {
      return this._seed;
    }
    set  seed(v) {
      this.random.seed(v);
      this._seed = v;
    }
    static  define() {
      return {params: {amplitude: ["Amplitude", 1.0, 0.01, 4.0], 
      decay: ["Decay", 1.0, 0.0, 5.0], 
      in_mode: ["In", true, BOOL_FLAG, BOOL_FLAG]}, 
     name: "random", 
     uiname: "Random", 
     typeName: "RandCurve"}
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
  }
  _ESClass.register(RandCurve);
  _es6_module.add_class(RandCurve);
  RandCurve = _es6_module.add_export('RandCurve', RandCurve);
  CurveTypeData.register(RandCurve);
  RandCurve.STRUCT = nstructjs.inherit(RandCurve, SimpleCurveBase)+`
}`;
  nstructjs.register(RandCurve);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/curve/curve1d_anim.js');


es6_module_define('curve1d_base', ["../util/struct.js", "../util/util.js"], function _curve1d_base_module(_es6_module) {
  var nstructjs=es6_import_item(_es6_module, '../util/struct.js', 'default');
  var util=es6_import(_es6_module, '../util/util.js');
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
  let _udigest=new util.HashDigest();
  class CurveTypeData  {
     constructor() {
      this.type = this.constructor.define().typeName;
    }
    get  hasGUI() {
      throw new Error("get hasGUI(): implement me!");
    }
    static  register(cls) {
      if (cls.define===CurveTypeData.define) {
          throw new Error("missing define() static method");
      }
      let def=cls.define();
      if (!def.name) {
          throw new Error(cls.name+".define() result is missing 'name' field");
      }
      if (!def.typeName) {
          throw new Error(cls.name+".define() is missing .typeName, which should equal class name; needed for minificaiton");
      }
      CurveConstructors.push(cls);
    }
    static  define() {
      return {uiname: "Some Curve", 
     name: "somecurve", 
     typeName: CurveTypeData}
    }
     calcHashKey(digest=_udigest.reset()) {
      let d=digest;
      d.add(this.type);
      return d.get();
    }
     toJSON() {
      return {type: this.type}
    }
     equals(b) {
      return this.type===b.type;
    }
     loadJSON(obj) {
      this.type = obj.type;
      return this;
    }
     redraw() {
      if (this.parent)
        this.parent.redraw();
    }
     makeGUI(container) {

    }
     killGUI(container) {
      container.clear();
    }
     evaluate(s) {
      throw new Error("implement me!");
    }
     integrate(s1, quadSteps=64) {
      let ret=0.0, ds=s1/quadSteps;
      for (let i=0, s=0; i<quadSteps; i++, s+=ds) {
          ret+=this.evaluate(s)*ds;
      }
      return ret;
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
  function evalHermiteTable(table, t) {
    let s=t*(table.length/4);
    let i=Math.floor(s);
    s-=i;
    i*=4;
    let a=table[i]+(table[i+1]-table[i])*s;
    let b=table[i+2]+(table[i+3]-table[i+2])*s;
    return a+(b-a)*s;
  }
  evalHermiteTable = _es6_module.add_export('evalHermiteTable', evalHermiteTable);
  function genHermiteTable(evaluate, steps) {
    let table=new Array(steps);
    let eps=1e-05;
    let dt=(1.0-eps*4.001)/(steps-1);
    let t=eps*4;
    let lastdv1, lastf3;
    for (let j=0; j<steps; j++, t+=dt) {
        let f2=evaluate(t-eps);
        let f3=evaluate(t);
        let f4=evaluate(t+eps);
        let dv1=(f4-f2)/(eps*2);
        dv1/=steps;
        if (j>0) {
            let j2=j-1;
            table[j2*4] = lastf3;
            table[j2*4+1] = lastf3+lastdv1/3.0;
            table[j2*4+2] = f3-dv1/3.0;
            table[j2*4+3] = f3;
        }
        lastdv1 = dv1;
        lastf3 = f3;
    }
    return table;
  }
  genHermiteTable = _es6_module.add_export('genHermiteTable', genHermiteTable);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/curve/curve1d_base.js');


es6_module_define('curve1d_basic', ["../util/struct.js", "../util/util.js", "./curve1d_base.js", "../util/vectormath.js"], function _curve1d_basic_module(_es6_module) {
  var nstructjs=es6_import_item(_es6_module, '../util/struct.js', 'default');
  var CurveFlags=es6_import_item(_es6_module, './curve1d_base.js', 'CurveFlags');
  var TangentModes=es6_import_item(_es6_module, './curve1d_base.js', 'TangentModes');
  var CurveTypeData=es6_import_item(_es6_module, './curve1d_base.js', 'CurveTypeData');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../util/vectormath.js', 'Quat');
  var Matrix4=es6_import_item(_es6_module, '../util/vectormath.js', 'Matrix4');
  var genHermiteTable=es6_import_item(_es6_module, './curve1d_base.js', 'genHermiteTable');
  var evalHermiteTable=es6_import_item(_es6_module, './curve1d_base.js', 'evalHermiteTable');
  var util=es6_import(_es6_module, '../util/util.js');
  let _udigest=new util.HashDigest();
  function feq(a, b) {
    return Math.abs(a-b)<1e-05;
  }
  class EquationCurve extends CurveTypeData {
     constructor(type) {
      super();
      this.equation = "x";
      this._last_equation = "";
      this.hermite = undefined;
    }
    get  hasGUI() {
      return this.uidata!==undefined;
    }
    static  define() {
      return {uiname: "Equation", 
     name: "equation", 
     typeName: "EquationCurve"}
    }
     calcHashKey(digest=_udigest.reset()) {
      let d=digest;
      super.calcHashKey(d);
      d.add(this.equation);
      return d.get();
    }
     equals(b) {
      return super.equals(b)&&this.equation===b.equation;
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
     makeGUI(container, canvas, drawTransform) {
      this.uidata = {canvas: canvas, 
     g: canvas.g, 
     draw_trans: drawTransform};
      let row=container.row();
      let text=this.uidata.textbox = row.textbox(undefined, ""+this.equation);
      text.onchange = (val) =>        {
        console.log(val);
        this.equation = val;
        this.update();
        this.redraw();
      };
      container.label("Equation");
    }
     killGUI(dom, gui, canvas, g, draw_transform) {
      if (this.uidata!==undefined) {
          this.uidata.textbox.remove();
      }
      this.uidata = undefined;
    }
     updateTextBox() {
      if (this.uidata&&this.uidata.textbox) {
          this.uidata.textbox.text = this.equation;
      }
    }
     evaluate(s) {
      if (!this.hermite||this._last_equation!==this.equation) {
          this._last_equation = this.equation;
          this.updateTextBox();
          this._evaluate(0.0);
          if (this._haserror) {
              console.warn("ERROR!");
              return 0.0;
          }
          let steps=32;
          this.hermite = genHermiteTable((s) =>            {
            return this._evaluate(s);
          }, steps);
      }
      return evalHermiteTable(this.hermite, s);
    }
     _evaluate(s) {
      let sin=Math.sin, cos=Math.cos, pi=Math.PI, PI=Math.PI, e=Math.E, E=Math.E, tan=Math.tan, abs=Math.abs, floor=Math.floor, ceil=Math.ceil, acos=Math.acos, asin=Math.asin, atan=Math.atan, cosh=Math.cos, sinh=Math.sinh, log=Math.log, pow=Math.pow, exp=Math.exp, sqrt=Math.sqrt, cbrt=Math.cbrt, min=Math.min, max=Math.max;
      try {
        let x=s;
        let ret=eval(this.equation);
        this._haserror = false;
        return ret;
      }
      catch (error) {
          this._haserror = true;
          console.warn("ERROR!");
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
    get  hasGUI() {
      return this.uidata!==undefined;
    }
    static  define() {
      return {uiname: "Guassian", 
     name: "guassian", 
     typeName: "GuassianCurve"}
    }
     calcHashKey(digest=_udigest.reset()) {
      super.calcHashKey(digest);
      let d=digest;
      d.add(this.height);
      d.add(this.offset);
      d.add(this.deviation);
      return d.get();
    }
     equals(b) {
      let r=super.equals(b);
      r = r&&feq(this.height, b.height);
      r = r&&feq(this.offset, b.offset);
      r = r&&feq(this.deviation, b.deviation);
      return r;
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
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/curve/curve1d_basic.js');


es6_module_define('curve1d_bspline', ["./curve1d_base.js", "../config/config.js", "../util/util.js", "../util/vectormath.js", "../util/struct.js"], function _curve1d_bspline_module(_es6_module) {
  "use strict";
  var nstructjs=es6_import_item(_es6_module, '../util/struct.js', 'default');
  var config=es6_import_item(_es6_module, '../config/config.js', 'default');
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  let Vector2=vectormath.Vector2;
  const SplineTemplates={CONSTANT: 0, 
   LINEAR: 1, 
   SHARP: 2, 
   SQRT: 3, 
   SMOOTH: 4, 
   SMOOTHER: 5, 
   SHARPER: 6, 
   SPHERE: 7, 
   REVERSE_LINEAR: 8, 
   GUASSIAN: 9}
  _es6_module.add_export('SplineTemplates', SplineTemplates);
  const templates={[SplineTemplates.CONSTANT]: [[1, 1], [1, 1]], 
   [SplineTemplates.LINEAR]: [[0, 0], [1, 1]], 
   [SplineTemplates.SHARP]: [[0, 0], [0.9999, 0.0001], [1, 1]], 
   [SplineTemplates.SQRT]: [[0, 0], [0.05, 0.25], [0.33, 0.65], [1, 1]], 
   [SplineTemplates.SMOOTH]: ["DEG", 2, [0, 0], [1.0/3.0, 0], [2.0/3.0, 1.0], [1, 1]], 
   [SplineTemplates.SMOOTHER]: ["DEG", 6, [0, 0], [1.0/2.25, 0], [2.0/3.0, 1.0], [1, 1]], 
   [SplineTemplates.SHARPER]: [[0, 0], [0.3, 0.03], [0.7, 0.065], [0.9, 0.16], [1, 1]], 
   [SplineTemplates.SPHERE]: [[0, 0], [0.01953, 0.23438], [0.08203, 0.43359], [0.18359, 0.625], [0.35938, 0.81641], [0.625, 0.97656], [1, 1]], 
   [SplineTemplates.REVERSE_LINEAR]: [[0, 1], [1, 0]], 
   [SplineTemplates.GUASSIAN]: ["DEG", 5, [0, 0], [0.17969, 0.007], [0.48958, 0.01172], [0.77995, 0.99609], [1, 1]]}
  const SplineTemplateIcons={}
  _es6_module.add_export('SplineTemplateIcons', SplineTemplateIcons);
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
  let bin_cache={}
  window._bin_cache = bin_cache;
  let eval2_rets=util.cachering.fromConstructor(Vector2, 32);
  function bez3(a, b, c, t) {
    let r1=a+(b-a)*t;
    let r2=b+(c-b)*t;
    return r1+(r2-r1)*t;
  }
  function bez4(a, b, c, d, t) {
    let r1=bez3(a, b, c, t);
    let r2=bez3(b, c, d, t);
    return r1+(r2-r1)*t;
  }
  function binomial(n, i) {
    if (i>n) {
        throw new Error("Bad call to binomial(n, i), i was > than n");
    }
    if (i===0||i===n) {
        return 1;
    }
    let key=""+n+","+i;
    if (key in bin_cache)
      return bin_cache[key];
    let ret=binomial(n-1, i-1)+bin(n-1, i);
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
      Object.seal(this);
    }
    set  deg(v) {
      console.warn("old file data detected");
    }
    static  fromJSON(obj) {
      let ret=new Curve1DPoint(obj);
      ret.eid = obj.eid;
      ret.flag = obj.flag;
      ret.tangent = obj.tangent;
      ret.rco.load(obj.rco);
      return ret;
    }
     copy() {
      let ret=new Curve1DPoint(this);
      ret.tangent = this.tangent;
      ret.flag = this.flag;
      ret.eid = this.eid;
      ret.startco.load(this.startco);
      ret.rco.load(this.rco);
      ret.sco.load(this.sco);
      return ret;
    }
     toJSON() {
      return {0: this[0], 
     1: this[1], 
     eid: this.eid, 
     flag: this.flag, 
     tangent: this.tangent, 
     rco: this.rco}
    }
     loadSTRUCT(reader) {
      reader(this);
      this.sco.load(this);
      this.rco.load(this);
      splineCache.update(this);
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
  tangent : int;
  rco     : vec2;
}
`;
  nstructjs.register(Curve1DPoint);
  let _udigest=new util.HashDigest();
  class BSplineCache  {
     constructor() {
      this.curves = [];
      this.map = new Map();
      this.maxCurves = 32;
      this.gen = 0;
    }
     limit() {
      if (this.curves.length<=this.maxCurves) {
          return ;
      }
      this.curves.sort((a, b) =>        {
        return b.cache_w-a.cache_w;
      });
      while (this.curves.length>this.maxCurves) {
        let curve=this.curves.pop();
        this.map.delete(curve.calcHashKey());
      }
    }
     has(curve) {
      let curve2=this.map.get(curve.calcHashKey());
      return curve2&&curve2.equals(curve);
    }
     get(curve) {
      let key=curve.calcHashKey();
      curve._last_cache_key = key;
      let curve2=this.map.get(key);
      if (curve2&&curve2.equals(curve)) {
          curve2.cache_w = this.gen++;
          return curve2;
      }
      curve2 = curve.copy();
      curve2._last_cache_key = key;
      curve2.updateKnots();
      curve2.regen_basis();
      curve2.regen_hermite();
      this.map.set(curve2);
      this.curves.push(curve2);
      curve2.cache_w = this.gen++;
      this.limit();
      return curve2;
    }
     _remove(key) {
      let curve=this.map.get(key);
      this.map.delete(key);
      this.curves.remove(curve);
    }
     update(curve) {
      let key=curve._last_cache_key;
      if (this.map.has(key)) {
          this._remove(curve);
          this.get(curve);
      }
    }
  }
  _ESClass.register(BSplineCache);
  _es6_module.add_class(BSplineCache);
  let splineCache=new BSplineCache();
  window._splineCache = splineCache;
  class BSplineCurve extends CurveTypeData {
     constructor() {
      super();
      this.cache_w = 0;
      this._last_cache_key = 0;
      this._last_update_key = "";
      this.fastmode = false;
      this.points = [];
      this.length = 0;
      this.interpolating = false;
      this.range = [new Vector2([0, 1]), new Vector2([0, 1])];
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
    get  hasGUI() {
      return this.uidata!==undefined;
    }
    static  define() {
      return {uiname: "B-Spline", 
     name: "bspline", 
     typeName: "BSplineCurve"}
    }
     calcHashKey(digest=_udigest.reset()) {
      let d=digest;
      super.calcHashKey(d);
      d.add(this.deg);
      d.add(this.interpolating);
      for (let p of this.points) {
          let x=~~(p[0]*1024);
          let y=~~(p[1]*1024);
          d.add(x);
          d.add(y);
          d.add(p.tangent);
      }
      d.add(this.range[0][0]);
      d.add(this.range[0][1]);
      d.add(this.range[1][0]);
      d.add(this.range[1][1]);
      return d.get();
    }
     copyTo(b) {
      b.deg = this.deg;
      b.interpolating = this.interpolating;
      b.fastmode = this.fastmode;
      for (let p of this.points) {
          let p2=p.copy();
          b.points.push(p2);
      }
      return b;
    }
     copy() {
      let curve=new BSplineCurve();
      this.copyTo(curve);
      return curve;
    }
     equals(b) {
      if (b.type!==this.type) {
          return false;
      }
      let bad=this.points.length!==b.points.length;
      bad = bad||this.deg!==b.deg;
      bad = bad||this.interpolating!==b.interpolating;
      if (bad) {
          return false;
      }
      for (let i=0; i<this.points.length; i++) {
          let p1=this.points[i];
          let p2=b.points[i];
          let dist=p1.vectorDistance(p2);
          if (p1.vectorDistance(p2)>1e-05) {
              return false;
          }
          if (p1.tangent!==p2.tangent) {
              return false;
          }
      }
      return true;
    }
     remove(p) {
      let ret=this.points.remove(p);
      this.length = this.points.length;
      return ret;
    }
     add(x, y, no_update=false) {
      let p=new Curve1DPoint();
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
     _sortPoints() {
      if (!this.interpolating) {
          for (let i=0; i<this.points.length; i++) {
              this.points[i].rco.load(this.points[i]);
          }
      }
      this.points.sort(function (a, b) {
        return a[0]-b[0];
      });
      return this;
    }
     updateKnots(recalc=true, points=this.points) {
      if (recalc) {
          this.recalc = RecalcFlags.ALL;
      }
      this._sortPoints();
      this._ps = [];
      if (points.length<2) {
          return ;
      }
      let a=points[0][0], b=points[points.length-1][0];
      for (let i=0; i<points.length-1; i++) {
          this._ps.push(points[i]);
      }
      if (points.length<3) {
          return ;
      }
      let l1=points[points.length-1];
      let l2=points[points.length-2];
      let p=l1.copy();
      p.rco[0] = l1.rco[0]-4e-05;
      p.rco[1] = l2.rco[1]+(l1.rco[1]-l2.rco[1])/3.0;
      p = l1.copy();
      p.rco[0] = l1.rco[0]-3e-05;
      p.rco[1] = l2.rco[1]+(l1.rco[1]-l2.rco[1])/3.0;
      p = l1.copy();
      p.rco[0] = l1.rco[0]-1e-05;
      p.rco[1] = l2.rco[1]+(l1.rco[1]-l2.rco[1])/3.0;
      this._ps.push(p);
      p = l1.copy();
      p.rco[0] = l1.rco[0]-1e-05;
      p.rco[1] = l2.rco[1]+(l1.rco[1]-l2.rco[1])*2.0/3.0;
      this._ps.push(p);
      this._ps.push(l1);
      if (!this.interpolating) {
          for (let i=0; i<this._ps.length; i++) {
              this._ps[i].rco.load(this._ps[i]);
          }
      }
      for (let i=0; i<points.length; i++) {
          let p=points[i];
          let x=p[0], y=p[1];
          p.sco[0] = x;
          p.sco[1] = y;
      }
    }
     toJSON() {
      this._sortPoints();
      let ret=super.toJSON();
      ret = Object.assign(ret, {points: this.points.map((p) =>          {
          return p.toJSON();
        }), 
     deg: this.deg, 
     interpolating: this.interpolating, 
     eidgen: this.eidgen.toJSON(), 
     range: this.range});
      return ret;
    }
     loadJSON(obj) {
      super.loadJSON(obj);
      this.interpolating = obj.interpolating;
      this.deg = obj.deg;
      this.length = 0;
      this.points = [];
      this._ps = [];
      if (obj.range) {
          this.range = [new Vector2(obj.range[0]), new Vector2(obj.range[1])];
      }
      this.hightlight = undefined;
      this.eidgen = util.IDGen.fromJSON(obj.eidgen);
      this.recalc = RecalcFlags.ALL;
      this.mpos = [0, 0];
      for (let i=0; i<obj.points.length; i++) {
          this.points.push(Curve1DPoint.fromJSON(obj.points[i]));
      }
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
      let table=this.basis_tables[i];
      let s=t*(table.length/4)*0.99999;
      let j=~~s;
      s-=j;
      j*=4;
      return table[j]+(table[j+3]-table[j])*s;
      return bez4(table[j], table[j+1], table[j+2], table[j+3], s);
    }
     reset(empty=false) {
      this.length = 0;
      this.points = [];
      this._ps = [];
      if (!empty) {
          this.add(0, 0, true);
          this.add(1, 1, true);
      }
      this.recalc = 1;
      this.updateKnots();
      this.update();
      return this;
    }
     regen_hermite(steps) {
      if (splineCache.has(this)) {
          console.log("loading spline approx from cached bspline data");
          this.hermite = splineCache.get(this).hermite;
          return ;
      }
      if (steps===undefined) {
          steps = this.fastmode ? 120 : 340;
      }
      if (this.interpolating) {
          steps*=2;
      }
      this.hermite = new Array(steps);
      let table=this.hermite;
      let eps=1e-05;
      let dt=(1.0-eps*4.001)/(steps-1);
      let t=eps*4;
      let lastdv1, lastf3;
      for (let j=0; j<steps; j++, t+=dt) {
          let f1=this._evaluate(t-eps*2);
          let f2=this._evaluate(t-eps);
          let f3=this._evaluate(t);
          let f4=this._evaluate(t+eps);
          let f5=this._evaluate(t+eps*2);
          let dv1=(f4-f2)/(eps*2);
          dv1/=steps;
          if (j>0) {
              let j2=j-1;
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
      let points=this.points.concat(this.points);
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
              const df=1e-06;
              err+=Math.abs(r1);
              if (p===this._ps[this._ps.length-1]) {
                  continue;
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
          let th=this.fastmode ? 0.001 : 5e-05;
          if (err<th) {
              break;
          }
      }
    }
     regen_basis() {
      if (splineCache.has(this)) {
          console.log("loading from cached bspline data");
          this.basis_tables = splineCache.get(this).basis_tables;
          return ;
      }
      let steps=this.fastmode ? 64 : 128;
      if (this.interpolating) {
          steps*=2;
      }
      this.basis_tables = new Array(this._ps.length);
      for (let i=0; i<this._ps.length; i++) {
          let table=this.basis_tables[i] = new Array((steps-1)*4);
          let eps=1e-05;
          let dt=(1.0-eps*8)/(steps-1);
          let t=eps*4;
          let lastdv1=0.0, lastf3=0.0;
          for (let j=0; j<steps; j++, t+=dt) {
              let f2=this._basis(t-eps, i);
              let f3=this._basis(t, i);
              let f4=this._basis(t+eps, i);
              let dv1=(f4-f2)/(eps*2);
              dv1/=steps;
              if (j>0) {
                  let j2=j-1;
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
      let len=this._ps.length;
      let ps=this._ps;
      function safe_inv(n) {
        return n===0 ? 0 : 1.0/n;
      }
      function bas(s, i, n) {
        let kp=Math.min(Math.max(i-1, 0), len-1);
        let kn=Math.min(Math.max(i+1, 0), len-1);
        let knn=Math.min(Math.max(i+n, 0), len-1);
        let knn1=Math.min(Math.max(i+n+1, 0), len-1);
        let ki=Math.min(Math.max(i, 0), len-1);
        if (n===0) {
            return s>=ps[ki].rco[0]&&s<ps[kn].rco[0] ? 1 : 0;
        }
        else {
          let a=(s-ps[ki].rco[0])*safe_inv(ps[knn].rco[0]-ps[ki].rco[0]+0.0001);
          let b=(ps[knn1].rco[0]-s)*safe_inv(ps[knn1].rco[0]-ps[kn].rco[0]+0.0001);
          return a*bas(s, i, n-1)+b*bas(s, i+1, n-1);
        }
      }
      let p=this._ps[i].rco, nk, pk;
      let deg=this.deg;
      let b=bas(t, i-deg, deg);
      return b;
    }
     evaluate(t) {
      let a=this.points[0].rco, b=this.points[this.points.length-1].rco;
      if (t<a[0])
        return a[1];
      if (t>b[0])
        return b[1];
      if (this.points.length===2) {
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
      let table=this.hermite;
      let s=t*(table.length/4);
      let i=Math.floor(s);
      s-=i;
      i*=4;
      return table[i]+(table[i+3]-table[i])*s;
    }
     _evaluate(t) {
      let start_t=t;
      if (this.points.length>1) {
          let a=this.points[0], b=this.points[this.points.length-1];
      }
      for (let i=0; i<35; i++) {
          let df=0.0001;
          let ret1=this._evaluate2(t<0.5 ? t : t-df);
          let ret2=this._evaluate2(t<0.5 ? t+df : t);
          let f1=Math.abs(ret1[0]-start_t);
          let f2=Math.abs(ret2[0]-start_t);
          let g=(f2-f1)/df;
          if (f1===f2)
            break;
          if (f1===0.0||g===0.0)
            return this._evaluate2(t)[1];
          let fac=-(f1/g)*0.5;
          if (fac===0.0) {
              fac = 0.01;
          }
          else 
            if (Math.abs(fac)>0.1) {
              fac = 0.1*Math.sign(fac);
          }
          t+=fac;
          let eps=1e-05;
          t = Math.min(Math.max(t, eps), 1.0-eps);
      }
      return this._evaluate2(t)[1];
    }
     _evaluate2(t) {
      let ret=eval2_rets.next();
      t*=0.9999999;
      let totbasis=0;
      let sumx=0;
      let sumy=0;
      for (let i=0; i<this._ps.length; i++) {
          let p=this._ps[i].rco;
          let b=this.basis(t, i);
          sumx+=b*p[0];
          sumy+=b*p[1];
          totbasis+=b;
      }
      if (totbasis!==0.0) {
          sumx/=totbasis;
          sumy/=totbasis;
      }
      ret[0] = sumx;
      ret[1] = sumy;
      return ret;
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
     stopPropagation: () =>          {
          return e.stopPropagation();
        }, 
     preventDefault: () =>          {
          return e.preventDefault();
        }}
    }
     on_touchstart(e) {
      this.mpos[0] = e.touches[0].pageX;
      this.mpos[1] = e.touches[0].pageY;
      let e2=this._wrapTouchEvent(e);
      this.on_mousemove(e2);
      this.on_mousedown(e2);
    }
     loadTemplate(templ) {
      if (templ===undefined||!templates[templ]) {
          console.warn("Unknown bspline template", templ);
          return ;
      }
      templ = templates[templ];
      this.reset(true);
      this.deg = 3.0;
      for (let i=0; i<templ.length; i++) {
          let p=templ[i];
          if (p==="DEG") {
              this.deg = templ[i+1];
              i++;
              continue;
          }
          this.add(p[0], p[1], true);
      }
      this.recalc = 1;
      this.updateKnots();
      this.update();
      this.redraw();
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
      let bstrip=container.row().strip();
      let makebutton=(strip, k) =>        {
        let uiname=k[0]+k.slice(1, k.length).toLowerCase();
        uiname = uiname.replace(/_/g, " ");
        let icon=strip.iconbutton(-1, uiname, () =>          {
          this.loadTemplate(SplineTemplates[k]);
        });
        icon.iconsheet = 0;
        icon.customIcon = SplineTemplateIcons[k];
      };
      for (let k in SplineTemplates) {
          makebutton(bstrip, k);
      }
      let row=container.row();
      let fullUpdate=() =>        {
        this.updateKnots();
        this.update();
        this.regen_basis();
        this.recalc = RecalcFlags.ALL;
        this.redraw();
      };
      let Icons=row.constructor.getIconEnum();
      row.iconbutton(Icons.TINY_X, "Delete Point", () =>        {
        for (let i=0; i<this.points.length; i++) {
            let p=this.points[i];
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
      let slider=row.simpleslider(undefined, "Degree", this.deg, 1, 6, 1, true, true, (slider) =>        {
        this.deg = Math.floor(slider.value);
        fullUpdate();
      });
      slider.baseUnit = "none";
      slider.displayUnit = "none";
      row = container.row();
      let check=row.check(undefined, "Interpolating");
      check.checked = this.interpolating;
      check.onchange = () =>        {
        this.interpolating = check.value;
        fullUpdate();
      };
      let panel=container.panel("Range");
      let xmin=panel.slider(undefined, "X Min", this.range[0][0], -10, 10, 0.1, false, undefined, (val) =>        {
        this.range[0][0] = val.value;
      });
      let xmax=panel.slider(undefined, "X Max", this.range[0][1], -10, 10, 0.1, false, undefined, (val) =>        {
        this.range[0][1] = val.value;
      });
      let ymin=panel.slider(undefined, "Y Min", this.range[1][0], -10, 10, 0.1, false, undefined, (val) =>        {
        this.range[1][0] = val.value;
      });
      let ymax=panel.slider(undefined, "Y Max", this.range[1][1], -10, 10, 0.1, false, undefined, (val) =>        {
        this.range[1][1] = val.value;
      });
      xmin.displayUnit = xmin.baseUnit = "none";
      ymin.displayUnit = ymin.baseUnit = "none";
      xmax.displayUnit = xmax.baseUnit = "none";
      ymax.displayUnit = ymax.baseUnit = "none";
      panel.closed = true;
      container.update.after(() =>        {
        let key=this.calcHashKey();
        if (key!==this._last_update_key) {
            this._last_update_key = key;
            slider.setValue(this.deg);
            xmin.setValue(this.range[0][0]);
            xmax.setValue(this.range[0][1]);
            ymin.setValue(this.range[1][0]);
            ymax.setValue(this.range[1][1]);
        }
      });
      return this;
    }
     killGUI(container, canvas) {
      if (this.uidata!==undefined) {
          let ud=this.uidata;
          this.uidata = undefined;
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
      this.uidata.start_mpos.load(this.transform_mpos(e.x, e.y));
      this.fastmode = true;
      let mpos=this.transform_mpos(e.x, e.y);
      let x=mpos[0], y=mpos[1];
      this.do_highlight(x, y);
      if (this.points.highlight!==undefined) {
          if (!e.shiftKey) {
              for (let i=0; i<this.points.length; i++) {
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
      else {
        let p=this.add(this.uidata.start_mpos[0], this.uidata.start_mpos[1]);
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
      let trans=this.uidata.draw_trans;
      let mindis=1e+17, minp=undefined;
      let limit=19/trans[0], limitsqr=limit*limit;
      for (let i=0; i<this.points.length; i++) {
          let p=this.points[i];
          let dx=x-p.sco[0], dy=y-p.sco[1], dis=dx*dx+dy*dy;
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
      let off=new Vector2([x, y]).sub(this.uidata.start_mpos);
      for (let i=0; i<this.uidata.transpoints.length; i++) {
          let p=this.uidata.transpoints[i];
          p.load(p.startco).add(off);
          p[0] = Math.min(Math.max(p[0], this.range[0][0]), this.range[0][1]);
          p[1] = Math.min(Math.max(p[1], this.range[1][0]), this.range[1][1]);
      }
      this.updateKnots();
      this.update();
      this.redraw();
    }
     transform_mpos(x, y) {
      let r=this.uidata.canvas.getClientRects()[0];
      let dpi=devicePixelRatio;
      x-=parseInt(r.left);
      y-=parseInt(r.top);
      x*=dpi;
      y*=dpi;
      let trans=this.uidata.draw_trans;
      x = x/trans[0]-trans[1][0];
      y = -y/trans[0]-trans[1][1];
      return [x, y];
    }
     on_mousemove(e) {
      if (e.isTouch&&this.uidata.transforming) {
          e.preventDefault();
      }
      let mpos=this.transform_mpos(e.x, e.y);
      let x=mpos[0], y=mpos[1];
      if (this.uidata.transforming) {
          this.do_transform(x, y);
          this.evaluate(0.5);
      }
      else {
        this.do_highlight(x, y);
      }
    }
     end_transform() {
      this.uidata.transforming = false;
      this.fastmode = false;
      this.updateKnots();
      this.update();
      splineCache.update(this);
    }
     on_mouseup(e) {
      this.end_transform();
    }
     on_keydown(e) {
      switch (e.keyCode) {
        case 88:
        case 46:
          if (this.points.highlight!==undefined) {
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
      for (let ssi=0; ssi<2; ssi++) {
          break;
          for (let si=0; si<this.points.length; si++) {
              g.beginPath();
              let f=0;
              for (let i=0; i<steps; i++, f+=df) {
                  let totbasis=0;
                  for (let j=0; j<this.points.length; j++) {
                      totbasis+=this.basis(f, j);
                  }
                  let val=this.basis(f, si);
                  if (ssi)
                    val/=(totbasis===0 ? 1 : totbasis);
                  (i===0 ? g.moveTo : g.lineTo).call(g, f, ssi ? val : val*0.5, w, w);
              }
              let color, alpha=this.points[si]===this.points.highlight ? 1.0 : 0.7;
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
  range         : array(vec2);
}
`;
  nstructjs.register(BSplineCurve);
  CurveTypeData.register(BSplineCurve);
  function makeSplineTemplateIcons(size) {
    if (size===undefined) {
        size = 64;
    }
    let dpi=devicePixelRatio;
    size = ~~(size*dpi);
    for (let k in SplineTemplates) {
        let curve=new BSplineCurve();
        curve.loadTemplate(SplineTemplates[k]);
        curve.fastmode = true;
        let canvas=document.createElement("canvas");
        canvas.width = canvas.height = size;
        let g=canvas.getContext("2d");
        let steps=64;
        curve.update();
        let scale=0.5;
        g.translate(-0.5, -0.5);
        g.scale(size*scale, size*scale);
        g.translate(0.5, 0.5);
        let m=0.0;
        let tent=(f) =>          {
          return 1.0-Math.abs(Math.fract(f)-0.5)*2.0;
        };
        for (let i=0; i<steps; i++) {
            let s=i/(steps-1);
            let f=1.0-curve.evaluate(tent(s));
            s = s*(1.0-m*2.0)+m;
            f = f*(1.0-m*2.0)+m;
            if (i===0) {
                g.moveTo(s, f);
            }
            else {
              g.lineTo(s, f);
            }
        }
        const ls=7.0;
        g.lineCap = "round";
        g.strokeStyle = "black";
        g.lineWidth = ls*3*dpi/(size*scale);
        g.stroke();
        g.strokeStyle = "white";
        g.lineWidth = ls*dpi/(size*scale);
        g.stroke();
        let url=canvas.toDataURL();
        let img=document.createElement("img");
        img.src = url;
        SplineTemplateIcons[k] = img;
        SplineTemplateIcons[SplineTemplates[k]] = img;
    }
  }
  let splineTemplatesLoaded=false;
  function initSplineTemplates() {
    if (splineTemplatesLoaded) {
        return ;
    }
    splineTemplatesLoaded = true;
    for (let k in SplineTemplates) {
        let curve=new BSplineCurve();
        curve.loadTemplate(SplineTemplates[k]);
        splineCache.get(curve);
    }
    makeSplineTemplateIcons();
    window._SplineTemplateIcons = SplineTemplateIcons;
  }
  initSplineTemplates = _es6_module.add_export('initSplineTemplates', initSplineTemplates);
  window.setTimeout(() =>    {
    if (config.autoLoadSplineTemplates) {
        initSplineTemplates();
    }
  }, 0);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/curve/curve1d_bspline.js');


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
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/curve/curve1d_utils.js');


es6_module_define('ease', [], function _ease_module(_es6_module) {
  function Ease() {
    throw "Ease cannot be instantiated.";
  }
  Ease;
  _es6_module.set_default_export('Ease', Ease);
  
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
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/curve/ease.js');


es6_module_define('lz-string', [], function _lz_string_module(_es6_module) {
  let f=String.fromCharCode;
  let keyStrBase64="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let keyStrUriSafe="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
  let baseReverseDic={}
  function getBaseValue(alphabet, character) {
    if (!baseReverseDic[alphabet]) {
        baseReverseDic[alphabet] = {};
        for (let i=0; i<alphabet.length; i++) {
            baseReverseDic[alphabet][alphabet.charAt(i)] = i;
        }
    }
    return baseReverseDic[alphabet][character];
  }
  function getInput(input) {
    if (input===null) {
        return '';
    }
    else 
      if (input==='') {
        return null;
    }
    if (typeof input==="string") {
        return input;
    }
    if (__instance_of(input, ArrayBuffer)) {
        input = new Uint8Array(input);
    }
    let s='';
    for (let i=0; i<input.length; i++) {
        s+=String.fromCharCode(input[i]);
    }
    return s;
  }
  _es6_module.set_default_export(undefined, {compressToBase64: function (input) {
      input = getInput(input);
      if (!input)
        return "";
      let res=this._compress(input, 6, function (a) {
        return keyStrBase64.charAt(a);
      });
      switch (res.length%4) {
        default:
        case 0:
          return res;
        case 1:
          return res+"===";
        case 2:
          return res+"==";
        case 3:
          return res+"=";
      }
    }, 
   decompressFromBase64: function (input) {
      if (input===null)
        return "";
      if (input==="")
        return null;
      input = getInput(input);
      return this._decompress(input.length, 32, function (index) {
        return getBaseValue(keyStrBase64, input.charAt(index));
      });
    }, 
   compressToUTF16: function (input) {
      if (input===null)
        return "";
      input = getInput(input);
      return this._compress(input, 15, function (a) {
        return f(a+32);
      })+" ";
    }, 
   decompressFromUTF16: function (compressed) {
      if (compressed===null)
        return "";
      if (compressed==="")
        return null;
      compressed = getInput(compressed);
      return this._decompress(compressed.length, 16384, function (index) {
        return compressed.charCodeAt(index)-32;
      });
    }, 
   compressToUint8Array: function (uncompressed) {
      uncompressed = getInput(uncompressed);
      let compressed=this.compress(uncompressed);
      let buf=new Uint8Array(compressed.length*2);
      for (let i=0, TotalLen = compressed.length; i<TotalLen; i++) {
          let current_value=compressed.charCodeAt(i);
          buf[i*2] = current_value>>>8;
          buf[i*2+1] = current_value%256;
      }
      return buf;
    }, 
   decompressFromUint8Array: function (compressed) {
      if (compressed===null||compressed===undefined) {
          return this.decompress(compressed);
      }
      else {
        compressed = getInput(compressed);
        let buf=new Array(compressed.length/2);
        for (let i=0, TotalLen = buf.length; i<TotalLen; i++) {
            buf[i] = compressed[i*2]*256+compressed[i*2+1];
        }
        let result=[];
        buf.forEach(function (c) {
          result.push(f(c));
        });
        return this.decompress(result.join(''));
      }
    }, 
   compressToEncodedURIComponent: function (input) {
      if (input===null)
        return "";
      return this._compress(input, 6, function (a) {
        return keyStrUriSafe.charAt(a);
      });
    }, 
   decompressFromEncodedURIComponent: function (input) {
      if (input===null)
        return "";
      if (input==="")
        return null;
      input = input.replace(/ /g, "+");
      return this._decompress(input.length, 32, function (index) {
        return getBaseValue(keyStrUriSafe, input.charAt(index));
      });
    }, 
   compress: function (uncompressed) {
      return this._compress(uncompressed, 16, function (a) {
        return f(a);
      });
    }, 
   _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
      uncompressed = getInput(uncompressed);
      if (uncompressed===null)
        return "";
      let i, value, context_dictionary={}, context_dictionaryToCreate={}, context_c="", context_wc="", context_w="", context_enlargeIn=2, context_dictSize=3, context_numBits=2, context_data=[], context_data_val=0, context_data_position=0, ii;
      for (ii = 0; ii<uncompressed.length; ii+=1) {
          context_c = uncompressed.charAt(ii);
          if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
              context_dictionary[context_c] = context_dictSize++;
              context_dictionaryToCreate[context_c] = true;
          }
          context_wc = context_w+context_c;
          if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
              context_w = context_wc;
          }
          else {
            if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                if (context_w.charCodeAt(0)<256) {
                    for (i = 0; i<context_numBits; i++) {
                        context_data_val = (context_data_val<<1);
                        if (context_data_position===bitsPerChar-1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        }
                        else {
                          context_data_position++;
                        }
                    }
                    value = context_w.charCodeAt(0);
                    for (i = 0; i<8; i++) {
                        context_data_val = (context_data_val<<1)|(value&1);
                        if (context_data_position===bitsPerChar-1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        }
                        else {
                          context_data_position++;
                        }
                        value = value>>1;
                    }
                }
                else {
                  value = 1;
                  for (i = 0; i<context_numBits; i++) {
                      context_data_val = (context_data_val<<1)|value;
                      if (context_data_position==bitsPerChar-1) {
                          context_data_position = 0;
                          context_data.push(getCharFromInt(context_data_val));
                          context_data_val = 0;
                      }
                      else {
                        context_data_position++;
                      }
                      value = 0;
                  }
                  value = context_w.charCodeAt(0);
                  for (i = 0; i<16; i++) {
                      context_data_val = (context_data_val<<1)|(value&1);
                      if (context_data_position===bitsPerChar-1) {
                          context_data_position = 0;
                          context_data.push(getCharFromInt(context_data_val));
                          context_data_val = 0;
                      }
                      else {
                        context_data_position++;
                      }
                      value = value>>1;
                  }
                }
                context_enlargeIn--;
                if (context_enlargeIn===0) {
                    context_enlargeIn = Math.pow(2, context_numBits);
                    context_numBits++;
                }
                delete context_dictionaryToCreate[context_w];
            }
            else {
              value = context_dictionary[context_w];
              for (i = 0; i<context_numBits; i++) {
                  context_data_val = (context_data_val<<1)|(value&1);
                  if (context_data_position===bitsPerChar-1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                  }
                  else {
                    context_data_position++;
                  }
                  value = value>>1;
              }
            }
            context_enlargeIn--;
            if (context_enlargeIn===0) {
                context_enlargeIn = Math.pow(2, context_numBits);
                context_numBits++;
            }
            context_dictionary[context_wc] = context_dictSize++;
            context_w = String(context_c);
          }
      }
      if (context_w!=="") {
          if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
              if (context_w.charCodeAt(0)<256) {
                  for (i = 0; i<context_numBits; i++) {
                      context_data_val = (context_data_val<<1);
                      if (context_data_position===bitsPerChar-1) {
                          context_data_position = 0;
                          context_data.push(getCharFromInt(context_data_val));
                          context_data_val = 0;
                      }
                      else {
                        context_data_position++;
                      }
                  }
                  value = context_w.charCodeAt(0);
                  for (i = 0; i<8; i++) {
                      context_data_val = (context_data_val<<1)|(value&1);
                      if (context_data_position===bitsPerChar-1) {
                          context_data_position = 0;
                          context_data.push(getCharFromInt(context_data_val));
                          context_data_val = 0;
                      }
                      else {
                        context_data_position++;
                      }
                      value = value>>1;
                  }
              }
              else {
                value = 1;
                for (i = 0; i<context_numBits; i++) {
                    context_data_val = (context_data_val<<1)|value;
                    if (context_data_position===bitsPerChar-1) {
                        context_data_position = 0;
                        context_data.push(getCharFromInt(context_data_val));
                        context_data_val = 0;
                    }
                    else {
                      context_data_position++;
                    }
                    value = 0;
                }
                value = context_w.charCodeAt(0);
                for (i = 0; i<16; i++) {
                    context_data_val = (context_data_val<<1)|(value&1);
                    if (context_data_position===bitsPerChar-1) {
                        context_data_position = 0;
                        context_data.push(getCharFromInt(context_data_val));
                        context_data_val = 0;
                    }
                    else {
                      context_data_position++;
                    }
                    value = value>>1;
                }
              }
              context_enlargeIn--;
              if (context_enlargeIn===0) {
                  context_enlargeIn = Math.pow(2, context_numBits);
                  context_numBits++;
              }
              delete context_dictionaryToCreate[context_w];
          }
          else {
            value = context_dictionary[context_w];
            for (i = 0; i<context_numBits; i++) {
                context_data_val = (context_data_val<<1)|(value&1);
                if (context_data_position===bitsPerChar-1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                }
                else {
                  context_data_position++;
                }
                value = value>>1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn===0) {
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
          }
      }
      value = 2;
      for (i = 0; i<context_numBits; i++) {
          context_data_val = (context_data_val<<1)|(value&1);
          if (context_data_position===bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
          }
          else {
            context_data_position++;
          }
          value = value>>1;
      }
      while (true) {
        context_data_val = (context_data_val<<1);
        if (context_data_position===bitsPerChar-1) {
            context_data.push(getCharFromInt(context_data_val));
            break;
        }
        else 
          context_data_position++;
      }
      return context_data.join('');
    }, 
   decompress: function (compressed) {
      if (compressed===null)
        return "";
      if (compressed==="")
        return null;
      compressed = getInput(compressed);
      return this._decompress(compressed.length, 32768, function (index) {
        return compressed.charCodeAt(index);
      });
    }, 
   _decompress: function (length, resetValue, getNextValue) {
      let dictionary=[], next, enlargeIn=4, dictSize=4, numBits=3, entry="", result=[], i, w, bits, resb, maxpower, power, c, data={val: getNextValue(0), 
     position: resetValue, 
     index: 1}
      for (i = 0; i<3; i+=1) {
          dictionary[i] = i;
      }
      bits = 0;
      maxpower = Math.pow(2, 2);
      power = 1;
      while (power!==maxpower) {
        resb = data.val&data.position;
        data.position>>=1;
        if (data.position===0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
        }
        bits|=(resb>0 ? 1 : 0)*power;
        power<<=1;
      }
      switch (next = bits) {
        case 0:
          bits = 0;
          maxpower = Math.pow(2, 8);
          power = 1;
          while (power!==maxpower) {
            resb = data.val&data.position;
            data.position>>=1;
            if (data.position===0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
            }
            bits|=(resb>0 ? 1 : 0)*power;
            power<<=1;
          }
          c = f(bits);
          break;
        case 1:
          bits = 0;
          maxpower = Math.pow(2, 16);
          power = 1;
          while (power!==maxpower) {
            resb = data.val&data.position;
            data.position>>=1;
            if (data.position===0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
            }
            bits|=(resb>0 ? 1 : 0)*power;
            power<<=1;
          }
          c = f(bits);
          break;
        case 2:
          return "";
      }
      dictionary[3] = c;
      w = c;
      result.push(c);
      while (true) {
        if (data.index>length) {
            return "";
        }
        bits = 0;
        maxpower = Math.pow(2, numBits);
        power = 1;
        while (power!==maxpower) {
          resb = data.val&data.position;
          data.position>>=1;
          if (data.position===0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
          }
          bits|=(resb>0 ? 1 : 0)*power;
          power<<=1;
        }
        switch (c = bits) {
          case 0:
            bits = 0;
            maxpower = Math.pow(2, 8);
            power = 1;
            while (power!==maxpower) {
              resb = data.val&data.position;
              data.position>>=1;
              if (data.position===0) {
                  data.position = resetValue;
                  data.val = getNextValue(data.index++);
              }
              bits|=(resb>0 ? 1 : 0)*power;
              power<<=1;
            }
            dictionary[dictSize++] = f(bits);
            c = dictSize-1;
            enlargeIn--;
            break;
          case 1:
            bits = 0;
            maxpower = Math.pow(2, 16);
            power = 1;
            while (power!==maxpower) {
              resb = data.val&data.position;
              data.position>>=1;
              if (data.position===0) {
                  data.position = resetValue;
                  data.val = getNextValue(data.index++);
              }
              bits|=(resb>0 ? 1 : 0)*power;
              power<<=1;
            }
            dictionary[dictSize++] = f(bits);
            c = dictSize-1;
            enlargeIn--;
            break;
          case 2:
            return result.join('');
        }
        if (enlargeIn===0) {
            enlargeIn = Math.pow(2, numBits);
            numBits++;
        }
        if (dictionary[c]) {
            entry = dictionary[c];
        }
        else {
          if (c===dictSize) {
              entry = w+w.charAt(0);
          }
          else {
            return null;
          }
        }
        result.push(entry);
        dictionary[dictSize++] = w+entry.charAt(0);
        enlargeIn--;
        w = entry;
        if (enlargeIn===0) {
            enlargeIn = Math.pow(2, numBits);
            numBits++;
        }
      }
    }});
  
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/extern/lz-string/lz-string.js');


es6_module_define('test', [], function _test_module(_es6_module) {
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/extern/lz-string/test.js');


es6_module_define('toolpath', ["../controller/controller_base.js", "../util/parseutil.js", "./toolsys.js", "../util/util.js"], function _toolpath_module(_es6_module) {
  var ToolClasses=es6_import_item(_es6_module, './toolsys.js', 'ToolClasses');
  var ToolOp=es6_import_item(_es6_module, './toolsys.js', 'ToolOp');
  var ToolFlags=es6_import_item(_es6_module, './toolsys.js', 'ToolFlags');
  var UndoFlags=es6_import_item(_es6_module, './toolsys.js', 'UndoFlags');
  var ToolMacro=es6_import_item(_es6_module, './toolsys.js', 'ToolMacro');
  var tokdef=es6_import_item(_es6_module, '../util/parseutil.js', 'tokdef');
  var lexer=es6_import_item(_es6_module, '../util/parseutil.js', 'lexer');
  var parser=es6_import_item(_es6_module, '../util/parseutil.js', 'parser');
  var PUTLParseError=es6_import_item(_es6_module, '../util/parseutil.js', 'PUTLParseError');
  var DataPathError=es6_import_item(_es6_module, '../controller/controller_base.js', 'DataPathError');
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
    }), t('NUMBER', /-?[0-9]+\.[0-9]*/, (t) =>      {
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
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/toolsys/toolpath.js');


es6_module_define('toolprop', ["../util/util.js", "./toolprop_abstract.js", "../util/struct.js", "../../core/units.js", "../curve/curve1d.js", "../util/vectormath.js"], function _toolprop_module(_es6_module) {
  var util=es6_import(_es6_module, '../util/util.js');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../util/vectormath.js', 'Quat');
  var Matrix4=es6_import_item(_es6_module, '../util/vectormath.js', 'Matrix4');
  var ToolPropertyIF=es6_import_item(_es6_module, './toolprop_abstract.js', 'ToolPropertyIF');
  var PropTypes=es6_import_item(_es6_module, './toolprop_abstract.js', 'PropTypes');
  var PropFlags=es6_import_item(_es6_module, './toolprop_abstract.js', 'PropFlags');
  var nstructjs=es6_import_item(_es6_module, '../util/struct.js', 'default');
  let _ex_PropTypes=es6_import_item(_es6_module, './toolprop_abstract.js', 'PropTypes');
  _es6_module.add_export('PropTypes', _ex_PropTypes, true);
  let _ex_PropFlags=es6_import_item(_es6_module, './toolprop_abstract.js', 'PropFlags');
  _es6_module.add_export('PropFlags', _ex_PropFlags, true);
  const NumberConstraintsBase=new Set(['range', 'expRate', 'step', 'uiRange', 'baseUnit', 'displayUnit', 'stepIsRelative', 'slideSpeed']);
  _es6_module.add_export('NumberConstraintsBase', NumberConstraintsBase);
  const IntegerConstraints=new Set(['radix'].concat(util.list(NumberConstraintsBase)));
  _es6_module.add_export('IntegerConstraints', IntegerConstraints);
  const FloatConstrinats=new Set(['decimalPlaces'].concat(util.list(NumberConstraintsBase)));
  _es6_module.add_export('FloatConstrinats', FloatConstrinats);
  const NumberConstraints=new Set(util.list(IntegerConstraints).concat(util.list(FloatConstrinats)));
  _es6_module.add_export('NumberConstraints', NumberConstraints);
  const PropSubTypes={COLOR: 1}
  _es6_module.add_export('PropSubTypes', PropSubTypes);
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
  let customPropertyTypes=[];
  customPropertyTypes = _es6_module.add_export('customPropertyTypes', customPropertyTypes);
  let PropClasses={}
  PropClasses = _es6_module.add_export('PropClasses', PropClasses);
  let customPropTypeBase=17;
  let wordmap={sel: "select", 
   unsel: "deselect", 
   eid: "id", 
   props: "properties", 
   res: "resource"}
  var defaultRadix=10;
  defaultRadix = _es6_module.add_export('defaultRadix', defaultRadix);
  var defaultDecimalPlaces=4;
  defaultDecimalPlaces = _es6_module.add_export('defaultDecimalPlaces', defaultDecimalPlaces);
  class OnceTag  {
     constructor(cb) {
      this.cb = cb;
    }
  }
  _ESClass.register(OnceTag);
  _es6_module.add_class(OnceTag);
  class ToolProperty extends ToolPropertyIF {
     constructor(type, subtype, apiname, uiname="", description="", flag=0, icon=-1) {
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
      this.icon2 = icon;
      this.decimalPlaces = defaultDecimalPlaces;
      this.radix = defaultRadix;
      this.step = 0.05;
      this.callbacks = {};
    }
    static  internalRegister(cls) {
      PropClasses[new cls().type] = cls;
    }
    static  getClass(type) {
      return PropClasses[type];
    }
    static  setDefaultRadix(n) {
      defaultRadix = n;
    }
    static  setDefaultDecimalPlaces(n) {
      defaultDecimalPlaces = n;
    }
    static  makeUIName(name) {
      let parts=[""];
      let lastc=undefined;
      let ischar=(c) =>        {
        c = c.charCodeAt(0);
        let upper=c>="A".charCodeAt(0);
        upper = upper&&c<="Z".charCodeAt(0);
        let lower=c>="a".charCodeAt(0);
        lower = lower&&c<="z".charCodeAt(0);
        return upper||lower;
      };
      for (let i=0; i<name.length; i++) {
          let c=name[i];
          if (c==='_'||c==='-'||c==='$') {
              lastc = c;
              c = ' ';
              parts.push('');
              continue;
          }
          if (i>0&&c===c.toUpperCase()&&lastc!==lastc.toUpperCase()) {
              if (ischar(c)&&ischar(lastc)) {
                  parts.push('');
              }
          }
          parts[parts.length-1]+=c;
          lastc = c;
      }
      let subst=(word) =>        {
        if (word in wordmap) {
            return wordmap[word];
        }
        else {
          return word;
        }
      };
      parts = parts.filter((f) =>        {
        return f.trim().length>0;
      }).map((f) =>        {
        return subst(f);
      }).map((f) =>        {
        return f[0].toUpperCase()+f.slice(1, f.length).toLowerCase();
      }).join(" ").trim();
      return parts;
    }
    static  register(cls) {
      cls.PROP_TYPE_ID = (1<<customPropTypeBase);
      PropTypes[cls.name] = cls.PROP_TYPE_ID;
      customPropTypeBase++;
      customPropertyTypes.push(cls);
      PropClasses[new cls().type] = cls;
      return cls.PROP_TYPE_ID;
    }
    static  calcRelativeStep(step, value, logBase=1.5) {
      value = Math.log(Math.abs(value)+1.0)/Math.log(logBase);
      value = Math.max(value, step);
      this.report(util.termColor("STEP", "red"), value);
      return value;
    }
     setDescription(s) {
      this.description = s;
      return this;
    }
     setUIName(s) {
      this.uiname = s;
      return this;
    }
     calcMemSize() {
      function strlen(s) {
        return s!==undefined ? s.length+8 : 8;
      }
      let tot=0;
      tot+=strlen(this.apiname)+strlen(this.uiname);
      tot+=strlen(this.description);
      tot+=11*8;
      for (let k in this.callbacks) {
          tot+=24;
      }
      return tot;
    }
     equals(b) {
      throw new Error("implement me");
    }
     private() {
      this.flag|=PropFlags.PRIVATE;
      return this;
    }
     saveLastValue() {
      this.flag|=PropFlags.SAVE_LAST_VALUE;
      return this;
    }
     report() {
      console.warn(...arguments);
    }
     _fire(type, arg1, arg2) {
      if (this.callbacks[type]===undefined) {
          return ;
      }
      let stack=this.callbacks[type];
      stack = stack.concat([]);
      for (let i=0; i<stack.length; i++) {
          let cb=stack[i];
          if (__instance_of(cb, OnceTag)) {
              let j=i;
              while (j<stack.length-1) {
                stack[j] = stack[j+1];
                j++;
              }
              stack[j] = undefined;
              stack.length--;
              i--;
              cb.cb.call(this, arg1, arg2);
          }
          else {
            cb.call(this, arg1, arg2);
          }
      }
      return this;
    }
     clearEventCallbacks() {
      this.callbacks = {};
      return this;
    }
     once(type, cb) {
      if (this.callbacks[type]===undefined) {
          this.callbacks[type] = [];
      }
      for (let cb2 of this.callbacks[type]) {
          if (__instance_of(cb2, OnceTag)&&cb2.cb===cb) {
              return ;
          }
      }
      cb = new OnceTag(cb);
      this.callbacks[type].push(cb);
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
      b.icon = this.icon;
      b.icon2 = this.icon2;
      b.baseUnit = this.baseUnit;
      b.subtype = this.subtype;
      b.displayUnit = this.displayUnit;
      b.flag = this.flag;
      for (let k in this.callbacks) {
          b.callbacks[k] = this.callbacks[k];
      }
    }
     copy() {
      let ret=new this.constructor();
      this.copyTo(ret);
      return ret;
    }
     setStep(step) {
      this.step = step;
      return this;
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
     setFlag(f, combine=false) {
      this.flag = combine ? this.flag|f : f;
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
     setIcon2(icon) {
      this.icon2 = icon;
      return this;
    }
     loadSTRUCT(reader) {
      reader(this);
      if (this.uiRange[0]===-1e+17&&this.uiRange[1]===1e+17) {
          this.uiRange = undefined;
      }
      if (this.baseUnit==="undefined") {
          this.baseUnit = undefined;
      }
      if (this.displayUnit==="undefined") {
          this.displayUnit = undefined;
      }
    }
  }
  _ESClass.register(ToolProperty);
  _es6_module.add_class(ToolProperty);
  ToolProperty = _es6_module.add_export('ToolProperty', ToolProperty);
  ToolProperty.STRUCT = `
ToolProperty { 
  apiname        : string | ""+this.apiname;
  type           : int;
  flag           : int;
  subtype        : int;
  icon           : int;
  icon2          : int;
  baseUnit       : string | ""+this.baseUnit;
  displayUnit    : string | ""+this.displayUnit;
  range          : array(float) | this.range ? this.range : [-1e17, 1e17];
  uiRange        : array(float) | this.uiRange ? this.uiRange : [-1e17, 1e17];
  description    : string;
  stepIsRelative : bool;
  step           : float;
  expRate        : float;
  radix          : float;
  decimalPlaces  : int;
  uiname         : string | this.uiname || this.apiname || "";
}
`;
  nstructjs.register(ToolProperty);
  window.ToolProperty = ToolProperty;
  class FloatArrayProperty extends ToolProperty {
     constructor(value, apiname, uiname, description, flag, icon) {
      super(PropTypes.FLOAT_ARRAY, undefined, apiname, uiname, description, flag, icon);
      this.value = [];
      if (value!==undefined) {
          this.setValue(value);
      }
    }
     [Symbol.iterator]() {
      return this.value[Symbol.iterator]();
    }
     setValue(value) {
      super.setValue();
      if (value===undefined) {
          throw new Error("value was undefined in FloatArrayProperty's setValue method");
      }
      this.value.length = 0;
      for (let item of value) {
          if (typeof item!=="number"&&typeof item!=="boolean") {
              console.log(value);
              throw new Error("bad item for FloatArrayProperty "+item);
          }
          this.value.push(item);
      }
    }
     push(item) {
      if (typeof item!=="number"&&typeof item!=="boolean") {
          console.log(value);
          throw new Error("bad item for FloatArrayProperty "+item);
      }
      this.value.push(item);
    }
     getValue() {
      return this.value;
    }
     clear() {
      this.value.length = 0;
      return this;
    }
  }
  _ESClass.register(FloatArrayProperty);
  _es6_module.add_class(FloatArrayProperty);
  FloatArrayProperty = _es6_module.add_export('FloatArrayProperty', FloatArrayProperty);
  FloatArrayProperty.STRUCT = nstructjs.inherit(FloatArrayProperty, ToolProperty)+`
  value : array(float);
}`;
  nstructjs.register(FloatArrayProperty);
  class StringProperty extends ToolProperty {
     constructor(value, apiname, uiname, description, flag, icon) {
      super(PropTypes.STRING, undefined, apiname, uiname, description, flag, icon);
      this.multiLine = false;
      if (value) {
          this.setValue(value);
      }
      else {
        this.setValue("");
      }
      this.wasSet = false;
    }
     calcMemSize() {
      return super.calcMemSize()+(this.data!==undefined ? this.data.length*4 : 0)+8;
    }
     equals(b) {
      return this.data===b.data;
    }
     copyTo(b) {
      super.copyTo(b);
      b.data = this.data;
      b.multiLine = this.multiLine;
      return this;
    }
     getValue() {
      return this.data;
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
  ToolProperty.internalRegister(StringProperty);
  let _ex_isNumber=es6_import_item(_es6_module, '../../core/units.js', 'isNumber');
  _es6_module.add_export('isNumber', _ex_isNumber, true);
  class NumProperty extends ToolProperty {
     constructor(type, value, apiname, uiname, description, flag, icon) {
      super(type, undefined, apiname, uiname, description, flag, icon);
      this.data = 0;
      this.range = [0, 0];
    }
     equals(b) {
      return this.data==b.data;
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
      super(type, null, apiname, uiname, description, flag, icon);
      this.data = 0.0;
      this.slideSpeed = 1.0;
      this.expRate = 1.33;
      this.step = 0.1;
      this.stepIsRelative = false;
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
    set  ui_range(val) {
      this.report("NumberProperty.ui_range is deprecated");
      this.uiRange = val;
    }
     calcMemSize() {
      return super.calcMemSize()+8*8;
    }
     equals(b) {
      return this.data===b.data;
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
     copyTo(b) {
      super.copyTo(b);
      b.displayUnit = this.displayUnit;
      b.baseUnit = this.baseUnit;
      b.expRate = this.expRate;
      b.step = this.step;
      b.range = this.range ? [this.range[0], this.range[1]] : undefined;
      b.uiRange = this.uiRange ? [this.uiRange[0], this.uiRange[1]] : undefined;
      b.slideSpeed = this.slideSpeed;
      b.data = this.data;
    }
     setSlideSpeed(f) {
      this.slideSpeed = f;
      return this;
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
  range      : array(float);
  expRate    : float;
  data       : float;
  step       : float;
  slideSpeed : float;
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
  ToolProperty.internalRegister(IntProperty);
  class ReportProperty extends StringProperty {
     constructor(value, apiname, uiname, description, flag, icon) {
      super(value, apiname, uiname, description, flag, icon);
      this.type = PropTypes.REPORT;
    }
  }
  _ESClass.register(ReportProperty);
  _es6_module.add_class(ReportProperty);
  ReportProperty = _es6_module.add_export('ReportProperty', ReportProperty);
  ReportProperty.STRUCT = nstructjs.inherit(ReportProperty, StringProperty)+`
}
`;
  nstructjs.register(ReportProperty);
  ToolProperty.internalRegister(ReportProperty);
  class BoolProperty extends ToolProperty {
     constructor(value, apiname, uiname, description, flag, icon) {
      super(PropTypes.BOOL, undefined, apiname, uiname, description, flag, icon);
      this.data = !!value;
    }
     equals(b) {
      return this.data==b.data;
    }
     copyTo(b) {
      super.copyTo(b);
      b.data = this.data;
      return this;
    }
     setValue(val) {
      this.data = !!val;
      super.setValue(val);
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
  ToolProperty.internalRegister(BoolProperty);
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
  ToolProperty.internalRegister(FloatProperty);
  FloatProperty.STRUCT = nstructjs.inherit(FloatProperty, _NumberPropertyBase)+`
  decimalPlaces : int;
  data          : float;
}
`;
  nstructjs.register(FloatProperty);
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
  EnumKeyPair = _es6_module.add_export('EnumKeyPair', EnumKeyPair);
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
     constructor(string_or_int, valid_values, apiname, uiname, description, flag, icon) {
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
      if (string_or_int===undefined) {
          this.data = first(valid_values);
      }
      else {
        this.setValue(string_or_int);
      }
      for (var k in this.values) {
          let uin=k.replace(/[_-]/g, " ").trim();
          uin = uin.split(" ");
          let uiname=ToolProperty.makeUIName(k);
          this.ui_value_names[k] = uiname;
          this.descriptions[k] = uiname;
      }
      this.iconmap = {};
      this.iconmap2 = {};
      this.wasSet = false;
    }
     calcHash(digest=new util.HashDigest()) {
      for (let key in this.keys) {
          digest.add(key);
          digest.add(this.keys[key]);
      }
      return digest.get();
    }
     updateDefinition(enumdef_or_prop) {
      let descriptions=this.descriptions;
      let ui_value_names=this.ui_value_names;
      this.values = {};
      this.keys = {};
      this.ui_value_names = {};
      this.descriptions = {};
      let enumdef;
      if (__instance_of(enumdef_or_prop, EnumProperty)) {
          enumdef = enumdef_or_prop.values;
      }
      else {
        enumdef = enumdef_or_prop;
      }
      for (let k in enumdef) {
          let v=enumdef[k];
          this.values[k] = v;
          this.keys[v] = k;
      }
      if (__instance_of(enumdef_or_prop, EnumProperty)) {
          let prop=enumdef_or_prop;
          this.iconmap = Object.assign({}, prop.iconmap);
          this.iconmap2 = Object.assign({}, prop.iconmap2);
          this.ui_value_names = Object.assign({}, prop.ui_value_names);
          this.descriptions = Object.assign({}, prop.descriptions);
      }
      else {
        for (let k in this.values) {
            if (k in ui_value_names) {
                this.ui_value_names[k] = ui_value_names[k];
            }
            else {
              this.ui_value_names[k] = ToolProperty.makeUIName(k);
            }
            if (k in descriptions) {
                this.descriptions[k] = descriptions[k];
            }
            else {
              this.descriptions[k] = ToolProperty.makeUIName(k);
            }
        }
      }
      this._fire('metaChange', this);
      return this;
    }
     calcMemSize() {
      let tot=super.calcMemSize();
      for (let k in this.values) {
          tot+=(k.length*4+16)*4;
      }
      if (this.descriptions) {
          for (let k in this.descriptions) {
              tot+=(k.length+this.descriptions[k].length)*4;
          }
      }
      return tot+64;
    }
     equals(b) {
      return this.getValue()===b.getValue();
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
     addIcons2(iconmap2) {
      if (this.iconmap2===undefined) {
          this.iconmap2 = {};
      }
      for (let k in iconmap2) {
          this.iconmap2[k] = iconmap2[k];
      }
      return this;
    }
     addIcons(iconmap) {
      if (this.iconmap===undefined) {
          this.iconmap = {};
      }
      for (let k in iconmap) {
          this.iconmap[k] = iconmap[k];
      }
      return this;
    }
     copyTo(p) {
      super.copyTo(p);
      p.data = this.data;
      p.keys = Object.assign({}, this.keys);
      p.values = Object.assign({}, this.values);
      p.ui_value_names = this.ui_value_names;
      p.update = this.update;
      p.api_update = this.api_update;
      p.iconmap = this.iconmap;
      p.iconmap2 = this.iconmap2;
      p.descriptions = this.descriptions;
      return p;
    }
     copy() {
      var p=new this.constructor("dummy", {"dummy": 0}, this.apiname, this.uiname, this.description, this.flag);
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
          return {}
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
      this.keys = this._loadMap(this._keys);
      this.values = this._loadMap(this._values);
      this.ui_value_names = this._loadMap(this._ui_value_names);
      this.iconmap = this._loadMap(this._iconmap);
      this.iconmap2 = this._loadMap(this._iconmap2);
      this.descriptions = this._loadMap(this._descriptions);
      if (this.data_is_int) {
          this.data = parseInt(this.data);
          delete this.data_is_int;
      }
      else 
        if (this.data in this.keys) {
          this.data = this.keys[this.data];
      }
    }
     _is_data_int() {
      return typeof this.data==="number";
    }
  }
  _ESClass.register(EnumProperty);
  _es6_module.add_class(EnumProperty);
  EnumProperty = _es6_module.add_export('EnumProperty', EnumProperty);
  ToolProperty.internalRegister(EnumProperty);
  EnumProperty.STRUCT = nstructjs.inherit(EnumProperty, ToolProperty)+`
  data            : string             | ""+this.data;
  data_is_int     : bool               | this._is_data_int();
  _keys           : array(EnumKeyPair) | this._saveMap(this.keys) ;
  _values         : array(EnumKeyPair) | this._saveMap(this.values) ;
  _ui_value_names : array(EnumKeyPair) | this._saveMap(this.ui_value_names) ;
  _iconmap        : array(EnumKeyPair) | this._saveMap(this.iconmap) ;
  _iconmap2       : array(EnumKeyPair) | this._saveMap(this.iconmap2) ;
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
  }
  _ESClass.register(FlagProperty);
  _es6_module.add_class(FlagProperty);
  FlagProperty = _es6_module.add_export('FlagProperty', FlagProperty);
  ToolProperty.internalRegister(FlagProperty);
  FlagProperty.STRUCT = nstructjs.inherit(FlagProperty, EnumProperty)+`
}
`;
  nstructjs.register(FlagProperty);
  class VecPropertyBase extends FloatProperty {
     constructor(data, apiname, uiname, description) {
      super(undefined, apiname, uiname, description);
      this.hasUniformSlider = false;
    }
     calcMemSize() {
      return super.calcMemSize()+this.data.length*8;
    }
     equals(b) {
      return this.data.vectorDistance(b.data)<1e-05;
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
  hasUniformSlider : bool | this.hasUniformSlider || false;
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
  }
  _ESClass.register(Vec2Property);
  _es6_module.add_class(Vec2Property);
  Vec2Property = _es6_module.add_export('Vec2Property', Vec2Property);
  Vec2Property.STRUCT = nstructjs.inherit(Vec2Property, VecPropertyBase)+`
  data : vec2;
}
`;
  nstructjs.register(Vec2Property);
  ToolProperty.internalRegister(Vec2Property);
  class Vec3Property extends VecPropertyBase {
     constructor(data, apiname, uiname, description) {
      super(undefined, apiname, uiname, description);
      this.type = PropTypes.VEC3;
      this.data = new Vector3(data);
    }
     isColor() {
      this.subtype = PropSubTypes.COLOR;
      return this;
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
  }
  _ESClass.register(Vec3Property);
  _es6_module.add_class(Vec3Property);
  Vec3Property = _es6_module.add_export('Vec3Property', Vec3Property);
  Vec3Property.STRUCT = nstructjs.inherit(Vec3Property, VecPropertyBase)+`
  data : vec3;
}
`;
  nstructjs.register(Vec3Property);
  ToolProperty.internalRegister(Vec3Property);
  class Vec4Property extends FloatProperty {
     constructor(data, apiname, uiname, description) {
      super(undefined, apiname, uiname, description);
      this.type = PropTypes.VEC4;
      this.data = new Vector4(data);
    }
     setValue(v, w=1.0) {
      this.data.load(v);
      ToolProperty.prototype.setValue.call(this, v);
      if (v.length<3) {
          this.data[2] = 0.0;
      }
      if (v.length<4) {
          this.data[3] = w;
      }
      return this;
    }
     isColor() {
      this.subtype = PropSubTypes.COLOR;
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
  }
  _ESClass.register(Vec4Property);
  _es6_module.add_class(Vec4Property);
  Vec4Property = _es6_module.add_export('Vec4Property', Vec4Property);
  Vec4Property.STRUCT = nstructjs.inherit(Vec4Property, VecPropertyBase)+`
  data : vec4;
}
`;
  nstructjs.register(Vec4Property);
  ToolProperty.internalRegister(Vec4Property);
  class QuatProperty extends ToolProperty {
     constructor(data, apiname, uiname, description) {
      super(PropTypes.QUAT, undefined, apiname, uiname, description);
      this.data = new Quat(data);
    }
     equals(b) {
      return this.data.vectorDistance(b.data)<1e-05;
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
      let data=b.data;
      super.copyTo(b);
      b.data = data;
      b.data.load(this.data);
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
  ToolProperty.internalRegister(QuatProperty);
  class Mat4Property extends ToolProperty {
     constructor(data, apiname, uiname, description) {
      super(PropTypes.MATRIX4, undefined, apiname, uiname, description);
      this.data = new Matrix4(data);
    }
     calcMemSize() {
      return super.calcMemSize()+16*8+32;
    }
     equals(b) {
      let m1=this.data.$matrix;
      let m2=b.data.$matrix;
      for (let i=1; i<=4; i++) {
          for (let j=1; j<=4; j++) {
              let key=`m${i}${j}`;
              if (Math.abs(m1[key]-m2[key])>1e-05) {
                  return false;
              }
          }
      }
      return true;
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
      let data=b.data;
      super.copyTo(b);
      b.data = data;
      b.data.load(this.data);
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
  ToolProperty.internalRegister(Mat4Property);
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
      if (list) {
          for (let val of list) {
              this.push(val);
          }
      }
      this.wasSet = false;
    }
    get  length() {
      return this.value.length;
    }
    set  length(val) {
      this.value.length = val;
    }
     calcMemSize() {
      let tot=super.calcMemSize();
      let psize=this.prop ? this.prop.calcMemSize()+8 : 8;
      if (!this.prop&&this.value.length>0) {
          psize = this.value[0].calcMemSize();
      }
      tot+=psize*this.value.length+8;
      tot+=16;
      return tot;
    }
     equals(b) {
      let l1=this.value ? this.value.length : 0;
      let l2=b.value ? b.value.length : 0;
      if (l1!==l2) {
          return false;
      }
      for (let i=0; i<l1; i++) {
          let prop1=this.value[i];
          let prop2=b.value[i];
          let bad=prop1.constructor!==prop2.constructor;
          bad = bad||!prop1.equals(prop2);
          if (bad) {
              return false;
          }
      }
      return true;
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
      return this.copyTo(new ListProperty(this.prop.copy()));
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
     getListItem(i) {
      return this.value[i].getValue();
    }
     setListItem(i, val) {
      this.value[i].setValue(val);
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
  }
  _ESClass.register(ListProperty);
  _es6_module.add_class(ListProperty);
  ListProperty = _es6_module.add_export('ListProperty', ListProperty);
  ListProperty.STRUCT = nstructjs.inherit(ListProperty, ToolProperty)+`
  prop  : abstract(ToolProperty);
  value : array(abstract(ToolProperty));
}`;
  nstructjs.register(ListProperty);
  ToolProperty.internalRegister(ListProperty);
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
      this.iconmap2 = {};
      for (let v of values) {
          this.values[v] = v;
          let uiname=ToolProperty.makeUIName(v);
          this.ui_value_names[v] = uiname;
      }
      if (value!==undefined) {
          this.setValue(value);
      }
      this.wasSet = false;
    }
     calcMemSize() {
      let tot=super.calcMemSize();
      for (let k in this.values) {
          tot+=(k.length+16)*5;
      }
      if (this.descriptions) {
          for (let k in this.descriptions) {
              tot+=(k.length+this.descriptions[k].length+8)*4;
          }
      }
      return tot+64;
    }
     equals(b) {
      return this.value.equals(b.value);
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
     addIcons2(iconmap2) {
      if (iconmap2===undefined)
        return ;
      for (let k in iconmap2) {
          this.iconmap2[k] = iconmap2[k];
      }
      return this;
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
      b.ui_value_names = {};
      for (let k in this.ui_value_names) {
          b.ui_value_names[k] = this.ui_value_names[k];
      }
      b.iconmap = {};
      b.iconmap2 = {};
      for (let k in this.iconmap) {
          b.iconmap[k] = this.iconmap[k];
      }
      for (let k in this.iconmap2) {
          b.iconmap2[k] = this.iconmap2[k];
      }
      b.descriptions = {};
      for (let k in this.descriptions) {
          b.descriptions[k] = this.descriptions[k];
      }
    }
     loadSTRUCT(reader) {
      reader(this);
      let values=this.values;
      this.values = {};
      for (let s of values) {
          this.values[s] = s;
      }
      this.value = new util.set(this.value);
    }
  }
  _ESClass.register(StringSetProperty);
  _es6_module.add_class(StringSetProperty);
  StringSetProperty = _es6_module.add_export('StringSetProperty', StringSetProperty);
  StringSetProperty.STRUCT = nstructjs.inherit(StringSetProperty, ToolProperty)+`
  value  : iter(string);
  values : iterkeys(string);  
}`;
  nstructjs.register(StringSetProperty);
  ToolProperty.internalRegister(StringSetProperty);
  var Curve1D=es6_import_item(_es6_module, '../curve/curve1d.js', 'Curve1D');
  class Curve1DProperty extends ToolProperty {
     constructor(curve, apiname, uiname, description, flag, icon) {
      super(PropTypes.CURVE, undefined, apiname, uiname, description, flag, icon);
      this.data = new Curve1D();
      if (curve!==undefined) {
          this.setValue(curve);
      }
      this.wasSet = false;
    }
     calcMemSize() {
      return 1024;
    }
     equals(b) {

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
      super.setValue(curve);
    }
     copyTo(b) {
      super.copyTo(b);
      b.setValue(this.data);
    }
  }
  _ESClass.register(Curve1DProperty);
  _es6_module.add_class(Curve1DProperty);
  Curve1DProperty = _es6_module.add_export('Curve1DProperty', Curve1DProperty);
  Curve1DProperty.STRUCT = nstructjs.inherit(Curve1DProperty, ToolProperty)+`
  data : Curve1D;
}
`;
  nstructjs.register(Curve1DProperty);
  ToolProperty.internalRegister(Curve1DProperty);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/toolsys/toolprop.js');


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
   CURVE: 8192<<1, 
   FLOAT_ARRAY: 8192<<2, 
   REPORT: 8192<<3}
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
   SIMPLE_SLIDER: 1<<10, 
   FORCE_ROLLER_SLIDER: 1<<11, 
   USE_BASE_UNDO: 1<<12, 
   EDIT_AS_BASE_UNIT: 1<<13, 
   NO_UNDO: 1<<14, 
   USE_CUSTOM_PROP_GETTER: 1<<15, 
   FORCE_ENUM_CHECKBOXES: 1<<16, 
   NO_DEFAULT: 1<<17}
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
     equals(b) {
      throw new Error("implement me");
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
    get  length() {

    }
    set  length(val) {

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
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/toolsys/toolprop_abstract.js');


es6_module_define('toolsys', ["../controller/controller_base.js", "../util/simple_events.js", "../util/events.js", "./toolprop.js", "../util/struct.js", "../util/util.js"], function _toolsys_module(_es6_module) {
  "use strict";
  var nstructjs=es6_import_item(_es6_module, '../util/struct.js', 'default');
  var events=es6_import(_es6_module, '../util/events.js');
  var keymap=es6_import_item(_es6_module, '../util/simple_events.js', 'keymap');
  var PropFlags=es6_import_item(_es6_module, './toolprop.js', 'PropFlags');
  var PropTypes=es6_import_item(_es6_module, './toolprop.js', 'PropTypes');
  var DataPath=es6_import_item(_es6_module, '../controller/controller_base.js', 'DataPath');
  var util=es6_import(_es6_module, '../util/util.js');
  let ToolClasses=[];
  ToolClasses = _es6_module.add_export('ToolClasses', ToolClasses);
  window._ToolClasses = ToolClasses;
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
  let defaultUndoHandlers={undoPre: function undoPre(ctx) {
      throw new Error("implement me");
    }, 
   undo: function undo(ctx) {
      throw new Error("implement me");
    }}
  function setDefaultUndoHandlers(undoPre, undo) {
    if (!undoPre||!undo) {
        throw new Error("invalid parameters to setDefaultUndoHandlers");
    }
    defaultUndoHandlers.undoPre = undoPre;
    defaultUndoHandlers.undo = undo;
  }
  setDefaultUndoHandlers = _es6_module.add_export('setDefaultUndoHandlers', setDefaultUndoHandlers);
  class ToolPropertyCache  {
     constructor() {
      this.map = new Map();
      this.pathmap = new Map();
      this.accessors = {};
      this.userSetMap = new Set();
      this.api = undefined;
      this.dstruct = undefined;
    }
    static  getPropKey(cls, key, prop) {
      return prop.apiname&&prop.apiname.length>0 ? prop.apiname : key;
    }
     _buildAccessors(cls, key, prop, dstruct, api) {
      let tdef=cls._getFinalToolDef();
      this.api = api;
      this.dstruct = dstruct;
      if (!tdef.toolpath) {
          console.warn("Bad tool property", cls, "it's tooldef was missing a toolpath field");
          return ;
      }
      let path=tdef.toolpath.trim().split(".").filter((f) =>        {
        return f.trim().length>0;
      });
      let obj=this.accessors;
      let st=dstruct;
      let partial="";
      for (let i=0; i<path.length; i++) {
          let k=path[i];
          let pathk=k;
          if (i===0) {
              pathk = "accessors."+k;
          }
          if (i>0) {
              partial+=".";
          }
          partial+=k;
          if (!(k in obj)) {
              obj[k] = {};
          }
          let st2=api.mapStruct(obj[k], true, k);
          if (!(k in st.pathmap)) {
              st.struct(pathk, k, k, st2);
          }
          st = st2;
          this.pathmap.set(partial, obj[k]);
          obj = obj[k];
      }
      let name=prop.apiname!==undefined&&prop.apiname.length>0 ? prop.apiname : key;
      let prop2=prop.copy();
      let dpath=new DataPath(name, name, prop2);
      let uiname=prop.uiname;
      if (!uiname||uiname.trim().length===0) {
          uiname = prop.apiname;
      }
      if (!uiname||uiname.trim().length===0) {
          uiname = key;
      }
      uiname = ToolProperty.makeUIName(uiname);
      prop2.uiname = uiname;
      prop2.description = prop2.description||prop2.uiname;
      st.add(dpath);
      obj[name] = prop2.getValue();
    }
     _getAccessor(cls) {
      let toolpath=cls.tooldef().toolpath.trim();
      return this.pathmap.get(toolpath);
    }
     useDefault(cls, key, prop) {
      key = this.userSetMap.has(cls.tooldef().trim()+"."+this.constructor.getPropKey(key));
      key = key.trim();
      return key;
    }
     has(cls, key, prop) {
      if (prop.flag&PropFlags.NO_DEFAULT) {
          return false;
      }
      let obj=this._getAccessor(cls);
      key = this.constructor.getPropKey(cls, key, prop);
      return obj&&key in obj;
    }
     get(cls, key, prop) {
      if (cls===ToolMacro) {
          return ;
      }
      let obj=this._getAccessor(cls);
      key = this.constructor.getPropKey(cls, key, prop);
      if (obj) {
          return obj[key];
      }
      return undefined;
    }
     set(cls, key, prop) {
      if (cls===ToolMacro) {
          return ;
      }
      let toolpath=cls.tooldef().toolpath.trim();
      let obj=this._getAccessor(cls);
      if (!obj) {
          console.warn("Warning, toolop "+cls.name+" was not in the default map; unregistered?");
          this._buildAccessors(cls, key, prop, this.dstruct, this.api);
          obj = this.pathmap.get(toolpath);
      }
      if (!obj) {
          console.error("Malformed toolpath in toolop definition: "+toolpath);
          return ;
      }
      key = this.constructor.getPropKey(cls, key, prop);
      obj[key] = prop.copy().getValue();
      let path=toolpath+"."+key;
      this.userSetMap.add(path);
      return this;
    }
  }
  _ESClass.register(ToolPropertyCache);
  _es6_module.add_class(ToolPropertyCache);
  ToolPropertyCache = _es6_module.add_export('ToolPropertyCache', ToolPropertyCache);
  const SavedToolDefaults=new ToolPropertyCache();
  _es6_module.add_export('SavedToolDefaults', SavedToolDefaults);
  class ToolOp extends events.EventHandler {
     constructor() {
      super();
      this._overdraw = undefined;
      this.__memsize = undefined;
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
        let lastp=undefined;
        while (p!==undefined&&p!==Object&&p!==ToolOp&&p!==lastp) {
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
          lastp = p;
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
              let prop=dinputs[k].copy();
              prop.apiname = prop.apiname&&prop.apiname.length>0 ? prop.apiname : k;
              if (!this.hasDefault(prop, k)) {
                  this.inputs[k] = prop;
                  continue;
              }
              try {
                prop.setValue(this.getDefault(prop, k));
              }
              catch (error) {
                  console.log(error.stack);
                  console.log(error.message);
              }
              prop.wasSet = false;
              this.inputs[k] = prop;
          }
      }
      if (doutputs) {
          for (let k in doutputs) {
              let prop=doutputs[k].copy();
              prop.apiname = prop.apiname&&prop.apiname.length>0 ? prop.apiname : k;
              this.outputs[k] = prop;
          }
      }
      this.drawlines = [];
    }
    static  tooldef() {
      if (this===ToolOp) {
          throw new Error("Tools must implemented static tooldef() methods!");
      }
      return {}
    }
     getInputs() {
      let ret={};
      for (let k in this.inputs) {
          ret[k] = this.inputs[k].getValue();
      }
      return ret;
    }
    static  Equals(a, b) {
      if (!a||!b)
        return false;
      if (a.constructor!==b.constructor)
        return false;
      let bad=false;
      for (let k in a.inputs) {
          bad = bad||!(k in b.inputs);
          bad = bad||a.inputs[k].constructor!==b.inputs[k];
          bad = bad||!a.inputs[k].equals(b.inputs[k]);
          if (bad) {
              break;
          }
      }
      return !bad;
    }
    static  inherit(slots={}) {
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
    static  register(cls) {
      if (ToolClasses.indexOf(cls)>=0) {
          console.warn("Tried to register same ToolOp class twice:", cls.name, cls);
          return ;
      }
      ToolClasses.push(cls);
    }
    static  _regWithNstructjs(cls, structName=cls.name) {
      if (nstructjs.isRegistered(cls)) {
          return ;
      }
      let parent=cls.prototype.__proto__.constructor;
      if (!cls.hasOwnProperty("STRUCT")) {
          if (parent!==ToolOp&&parent!==ToolMacro&&parent!==Object) {
              this._regWithNstructjs(parent);
          }
          cls.STRUCT = nstructjs.inherit(cls, parent)+'}\n';
      }
      nstructjs.register(cls);
    }
    static  isRegistered(cls) {
      return ToolClasses.indexOf(cls)>=0;
    }
    static  unregister(cls) {
      if (ToolClasses.indexOf(cls)>=0) {
          ToolClasses.remove(cls);
      }
    }
    static  _getFinalToolDef() {
      let def=this.tooldef();
      let getSlots=(slots, key) =>        {
        if (slots===undefined)
          return {}
        if (!(__instance_of(slots, InheritFlag))) {
            return slots;
        }
        slots = {}
        let p=this;
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
      def.inputs = dinputs;
      def.outputs = doutputs;
      return def;
    }
    static  onTick() {
      for (let toolop of modalstack) {
          toolop.on_tick();
      }
    }
    static  searchBoxOk(ctx) {
      let flag=this.tooldef().flag;
      let ret=!(flag&&(flag&ToolFlags.PRIVATE));
      ret = ret&&this.canRun(ctx);
      return ret;
    }
    static  canRun(ctx, toolop=undefined) {
      return true;
    }
     onUndoDestroy() {

    }
     calcMemSize(ctx) {
      if (this.__memsize!==undefined) {
          return this.__memsize;
      }
      let tot=0;
      for (let step=0; step<2; step++) {
          let props=step ? this.outputs : this.inputs;
          for (let k in props) {
              let prop=props[k];
              let size=prop.calcMemSize();
              if (isNaN(size)||!isFinite(size)) {
                  console.warn("Got NaN when calculating mem size for property", prop);
                  continue;
              }
              tot+=size;
          }
      }
      let size=this.calcUndoMem(ctx);
      if (isNaN(size)||!isFinite(size)) {
          console.warn("Got NaN in calcMemSize", this);
      }
      else {
        tot+=size;
      }
      this.__memsize = tot;
      return tot;
    }
     loadDefaults(force=true) {
      for (let k in this.inputs) {
          let prop=this.inputs[k];
          if (!force&&prop.wasSet) {
              continue;
          }
          if (this.hasDefault(prop, k)) {
              prop.setValue(this.getDefault(prop, k));
              prop.wasSet = false;
          }
      }
      return this;
    }
     hasDefault(toolprop, key=toolprop.apiname) {
      return SavedToolDefaults.has(this.constructor, key, toolprop);
    }
     getDefault(toolprop, key=toolprop.apiname) {
      let cls=this.constructor;
      if (SavedToolDefaults.has(cls, key, toolprop)) {
          return SavedToolDefaults.get(cls, key, toolprop);
      }
      else {
        return toolprop.getValue();
      }
    }
     saveDefaultInputs() {
      for (let k in this.inputs) {
          let prop=this.inputs[k];
          if (prop.flag&PropFlags.SAVE_LAST_VALUE) {
              SavedToolDefaults.set(this.constructor, k, prop);
          }
      }
      return this;
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
     calcUndoMem(ctx) {
      console.warn("ToolOp.prototype.calcUndoMem: implement me!");
      return 0;
    }
     undoPre(ctx) {
      throw new Error("implement me!");
    }
     undo(ctx) {
      throw new Error("implement me!");
    }
     redo(ctx) {
      this._was_redo = true;
      this.undoPre(ctx);
      this.execPre(ctx);
      this.exec(ctx);
      this.execPost(ctx);
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
     resetTempGeom() {
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
     makeTempLine(v1, v2, style) {
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
          if (this._accept) {
              this._accept(this.modal_ctx, true);
          }
          this._on_cancel(this);
          this._on_cancel = undefined;
      }
      this.resetTempGeom();
      var ctx=this.modal_ctx;
      this.modal_ctx = undefined;
      this.modalRunning = false;
      this.is_modal = false;
      super.popModal();
      this._promise = undefined;
      if (this._accept) {
          this._accept(ctx, false);
          this._accept = this._reject = undefined;
      }
      this.saveDefaultInputs();
    }
     loadSTRUCT(reader) {
      reader(this);
      let outs=this.outputs;
      let ins=this.inputs;
      this.inputs = {};
      this.outputs = {};
      for (let pair of ins) {
          this.inputs[pair.key] = pair.val;
      }
      for (let pair of outs) {
          this.outputs[pair.key] = pair.val;
      }
    }
     _save_inputs() {
      let ret=[];
      for (let k in this.inputs) {
          ret.push(new PropKey(k, this.inputs[k]));
      }
      return ret;
    }
     _save_outputs() {
      let ret=[];
      for (let k in this.outputs) {
          ret.push(new PropKey(k, this.outputs[k]));
      }
      return ret;
    }
  }
  _ESClass.register(ToolOp);
  _es6_module.add_class(ToolOp);
  ToolOp = _es6_module.add_export('ToolOp', ToolOp);
  ToolOp.STRUCT = `
toolsys.ToolOp {
  inputs  : array(toolsys.PropKey) | this._save_inputs();
  outputs : array(toolsys.PropKey) | this._save_outputs();
}
`;
  nstructjs.register(ToolOp);
  class PropKey  {
     constructor(key, val) {
      this.key = key;
      this.val = val;
    }
  }
  _ESClass.register(PropKey);
  _es6_module.add_class(PropKey);
  PropKey.STRUCT = `
toolsys.PropKey {
  key : string;
  val : abstract(ToolProperty);
}
`;
  nstructjs.register(PropKey);
  class MacroLink  {
     constructor(sourcetool_idx, srckey, srcprops="outputs", desttool_idx, dstkey, dstprops="inputs") {
      this.source = sourcetool_idx;
      this.dest = desttool_idx;
      this.sourceProps = srcprops;
      this.destProps = dstprops;
      this.sourcePropKey = srckey;
      this.destPropKey = dstkey;
    }
  }
  _ESClass.register(MacroLink);
  _es6_module.add_class(MacroLink);
  MacroLink = _es6_module.add_export('MacroLink', MacroLink);
  MacroLink.STRUCT = `
toolsys.MacroLink {
  source         : int;
  dest           : int;
  sourcePropKey  : string;
  destPropKey    : string;
  sourceProps    : string;
  destProps      : string; 
}
`;
  nstructjs.register(MacroLink);
  const MacroClasses={}
  _es6_module.add_export('MacroClasses', MacroClasses);
  window._MacroClasses = MacroClasses;
  let macroidgen=0;
  class ToolMacro extends ToolOp {
     constructor() {
      super();
      this.tools = [];
      this.curtool = 0;
      this.has_modal = false;
      this.connects = [];
      this.connectLinks = [];
      this._macro_class = undefined;
    }
    static  tooldef() {
      return {uiname: "Tool Macro"}
    }
    static  canRun(ctx, toolop=undefined) {
      return true;
    }
     _getTypeClass() {
      if (this._macro_class&&this._macro_class.ready) {
          return this._macro_class;
      }
      if (!this._macro_class) {
          this._macro_class = class MacroTypeClass extends ToolOp {
            static  tooldef() {
              return this.__tooldef;
            }
          };
          _ESClass.register(this._macro_class);
          this._macro_class.__tooldef = {toolpath: this.constructor.tooldef().toolpath||''};
          this._macro_class.ready = false;
      }
      if (!this.tools||this.tools.length===0) {
          return this._macro_class;
      }
      let key="";
      for (let tool of this.tools) {
          key = tool.constructor.name+":";
      }
      if (this.constructor!==ToolMacro) {
          key+=":"+this.constructor.tooldef().toolpath;
      }
      for (let k in this.inputs) {
          key+=k+":";
      }
      if (key in MacroClasses) {
          this._macro_class = MacroClasses[key];
          return this._macro_class;
      }
      let name="Macro(";
      let i=0;
      let is_modal;
      for (let tool of this.tools) {
          let def=tool.constructor.tooldef();
          if (i>0) {
              name+=", ";
          }
          else {
            is_modal = def.is_modal;
          }
          if (def.uiname) {
              name+=def.uiname;
          }
          else 
            if (def.toolpath) {
              name+=def.toolpath;
          }
          else {
            name+=tool.constructor.name;
          }
          i++;
      }
      let inputs={};
      for (let k in this.inputs) {
          inputs[k] = this.inputs[k].copy().clearEventCallbacks();
          inputs[k].wasSet = false;
      }
      let tdef={uiname: name, 
     toolpath: key, 
     inputs: inputs, 
     outputs: {}, 
     is_modal: is_modal};
      let cls=this._macro_class;
      cls.__tooldef = tdef;
      cls._macroTypeId = macroidgen++;
      cls.ready = true;
      MacroClasses[key] = cls;
      return cls;
    }
     saveDefaultInputs() {
      for (let k in this.inputs) {
          let prop=this.inputs[k];
          if (prop.flag&PropFlags.SAVE_LAST_VALUE) {
              SavedToolDefaults.set(this._getTypeClass(), k, prop);
          }
      }
      return this;
    }
     hasDefault(toolprop, key=toolprop.apiname) {
      return SavedToolDefaults.has(this._getTypeClass(), key, toolprop);
    }
     getDefault(toolprop, key=toolprop.apiname) {
      let cls=this._getTypeClass();
      if (SavedToolDefaults.has(cls, key, toolprop)) {
          return SavedToolDefaults.get(cls, key, toolprop);
      }
      else {
        return toolprop.getValue();
      }
    }
     connect(srctool, srcoutput, dsttool, dstinput, srcprops="outputs", dstprops="inputs") {
      if (typeof dsttool==="function") {
          return this.connectCB(...arguments);
      }
      let i1=this.tools.indexOf(srctool);
      let i2=this.tools.indexOf(dsttool);
      if (i1<0||i2<0) {
          throw new Error("tool not in macro");
      }
      if (srcprops==="inputs") {
          let tool=this.tools[i1];
          let prop=tool.inputs[srcoutput];
          if (prop===this.inputs[srcoutput]) {
              delete this.inputs[srcoutput];
          }
      }
      if (dstprops==="inputs") {
          let tool=this.tools[i2];
          let prop=tool.inputs[dstinput];
          if (this.inputs[dstinput]===prop) {
              delete this.inputs[dstinput];
          }
      }
      this.connectLinks.push(new MacroLink(i1, srcoutput, srcprops, i2, dstinput, dstprops));
      return this;
    }
     connectCB(srctool, dsttool, callback, thisvar) {
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
      for (let k in tool.inputs) {
          let prop=tool.inputs[k];
          if (!(prop.flag&PropFlags.PRIVATE)) {
              this.inputs[k] = prop;
          }
      }
      this.tools.push(tool);
      return this;
    }
     _do_connections(tool) {
      let i=this.tools.indexOf(tool);
      for (let c of this.connectLinks) {
          if (c.source===i) {
              let tool2=this.tools[c.dest];
              tool2[c.destProps][c.destPropKey].setValue(tool[c.sourceProps][c.sourcePropKey].getValue());
          }
      }
      for (var c of this.connects) {
          if (c.srctool===tool) {
              c.callback.call(c.thisvar, c.srctool, c.dsttool);
          }
      }
    }
     modalStart(ctx) {
      this.loadDefaults(false);
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
     loadDefaults(force=true) {
      return super.loadDefaults(force);
    }
     exec(ctx) {
      this.loadDefaults(false);
      for (var i=0; i<this.tools.length; i++) {
          this.tools[i].undoPre(ctx);
          this.tools[i].execPre(ctx);
          this.tools[i].exec(ctx);
          this.tools[i].execPost(ctx);
          this._do_connections(this.tools[i]);
      }
    }
     calcUndoMem(ctx) {
      let tot=0;
      for (let tool of this.tools) {
          tot+=tool.calcUndoMem(ctx);
      }
      return tot;
    }
     calcMemSize(ctx) {
      let tot=0;
      for (let tool of this.tools) {
          tot+=tool.calcMemSize(ctx);
      }
      return tot;
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
  ToolMacro.STRUCT = nstructjs.inherit(ToolMacro, ToolOp, "toolsys.ToolMacro")+`
  tools        : array(abstract(toolsys.ToolOp));
  connectLinks : array(toolsys.MacroLink);
}
`;
  nstructjs.register(ToolMacro);
  class ToolStack extends Array {
     constructor(ctx) {
      super();
      this.memLimit = 512*1024*1024;
      this.enforceMemLimit = false;
      this.cur = -1;
      this.ctx = ctx;
      this.modalRunning = 0;
      this._undo_branch = undefined;
    }
    get  head() {
      return this[this.cur];
    }
     limitMemory(maxmem=this.memLimit, ctx=this.ctx) {
      if (maxmem===undefined) {
          throw new Error("maxmem cannot be undefined");
      }
      let size=this.calcMemSize();
      let start=0;
      while (start<this.cur-2&&size>maxmem) {
        size-=this[start].calcMemSize(ctx);
        start++;
      }
      if (start===0) {
          return size;
      }
      for (let i=0; i<start; i++) {
          this[i].onUndoDestroy();
      }
      this.cur-=start;
      for (let i=0; i<this.length-start; i++) {
          this[i] = this[i+start];
      }
      this.length-=start;
      return this.calcMemSize(ctx);
    }
     calcMemSize(ctx=this.ctx) {
      let tot=0;
      for (let tool of this) {
          try {
            tot+=tool.calcMemSize();
          }
          catch (error) {
              util.print_stack(error);
              console.error("Failed to execute a calcMemSize method");
          }
      }
      return tot;
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
     execOrRedo(ctx, tool, compareInputs=false) {
      let head=this.head;
      let ok=compareInputs ? ToolOp.Equals(head, tool) : head&&head.constructor===tool.constructor;
      tool.__memsize = undefined;
      if (ok) {
          this.undo();
          if (!compareInputs) {
              this.execTool(ctx, tool);
          }
          else {
            this.rerun();
          }
          return false;
      }
      else {
        this.execTool(ctx, tool);
        return true;
      }
    }
     execTool(ctx, toolop) {
      if (this.enforceMemLimit) {
          this.limitMemory(this.memLimit, ctx);
      }
      if (!toolop.constructor.canRun(ctx, toolop)) {
          console.log("toolop.constructor.canRun returned false");
          return ;
      }
      let tctx=ctx.toLocked();
      let undoflag=toolop.constructor.tooldef().undoflag;
      if (toolop.undoflag!==undefined) {
          undoflag = toolop.undoflag;
      }
      undoflag = undoflag===undefined ? 0 : undoflag;
      toolop.execCtx = tctx;
      if (!(undoflag&UndoFlags.NO_UNDO)) {
          this.cur++;
          this._undo_branch = this.slice(this.cur+1, this.length);
          this.length = this.cur+1;
          this[this.cur] = toolop;
          toolop.undoPre(tctx);
      }
      if (toolop.is_modal) {
          ctx = toolop.modal_ctx = ctx;
          this.modal_running = true;
          toolop._on_cancel = (function (toolop) {
            if (!(toolop.undoflag&UndoFlags.NO_UNDO)) {
                this[this.cur].undo(ctx);
                this.pop_i(this.cur);
                this.cur--;
            }
          }).bind(this);
          toolop.modalStart(ctx);
      }
      else {
        toolop.execPre(tctx);
        toolop.exec(tctx);
        toolop.execPost(tctx);
        toolop.saveDefaultInputs();
      }
    }
     toolCancel(ctx, tool) {
      if (tool._was_redo) {
          return ;
      }
      if (tool!==this[this.cur]) {
          console.warn("toolCancel called in error", this, tool);
          return ;
      }
      this.undo();
      this.length = this.cur+1;
      if (this._undo_branch!==undefined) {
          for (let item of this._undo_branch) {
              this.push(item);
          }
      }
    }
     undo() {
      if (this.enforceMemLimit) {
          this.limitMemory(this.memLimit);
      }
      if (this.cur>=0&&!(this[this.cur].undoflag&UndoFlags.IS_UNDO_ROOT)) {
          let tool=this[this.cur];
          tool.undo(tool.execCtx);
          this.cur--;
      }
    }
     rerun(tool) {
      if (this.enforceMemLimit) {
          this.limitMemory(this.memLimit);
      }
      if (tool===this[this.cur]) {
          tool._was_redo = false;
          if (!tool.execCtx) {
              tool.execCtx = this.ctx;
          }
          tool.undo(tool.execCtx);
          tool._was_redo = true;
          tool.undoPre(tool.execCtx);
          tool.execPre(tool.execCtx);
          tool.exec(tool.execCtx);
          tool.execPost(tool.execCtx);
      }
      else {
        console.warn("Tool wasn't at head of stack", tool);
      }
    }
     redo() {
      if (this.enforceMemLimit) {
          this.limitMemory(this.memLimit);
      }
      if (this.cur>=-1&&this.cur+1<this.length) {
          this.cur++;
          let tool=this[this.cur];
          if (!tool.execCtx) {
              tool.execCtx = this.ctx;
          }
          tool._was_redo = true;
          tool.redo(tool.execCtx);
          tool.saveDefaultInputs();
      }
    }
     save() {
      let data=[];
      nstructjs.writeObject(data, this);
      return data;
    }
     rewind() {
      while (this.cur>=0) {
        let last=this.cur;
        this.undo();
        if (last===this.cur) {
            break;
        }
      }
      return this;
    }
     replay(cb, onStep) {
      let cur=this.cur;
      this.rewind();
      let last=this.cur;
      let start=util.time_ms();
      return new Promise((accept, reject) =>        {
        let next=() =>          {
          last = this.cur;
          if (cb&&cb(ctx)===false) {
              accept();
              return ;
          }
          if (this.cur<this.length) {
              this.cur++;
              this.rerun();
          }
          if (last===this.cur) {
              console.warn("time:", (util.time_ms()-start)/1000.0);
              accept(this);
          }
          else {
            if (onStep) {
                let ret=onStep();
                if (ret&&__instance_of(ret, Promise)) {
                    ret.then(() =>                      {
                      next();
                    });
                }
                else {
                  window.setTimeout(() =>                    {
                    next();
                  });
                }
            }
          }
        }
        next();
      });
    }
     loadSTRUCT(reader) {
      reader(this);
      for (let item of this._stack) {
          this.push(item);
      }
      delete this._stack;
    }
     _save() {
      for (let tool of this) {
          let cls=tool.constructor;
          if (!nstructjs.isRegistered(cls)) {
              cls._regWithNstructjs(cls);
          }
      }
      return this;
    }
  }
  _ESClass.register(ToolStack);
  _es6_module.add_class(ToolStack);
  ToolStack = _es6_module.add_export('ToolStack', ToolStack);
  ToolStack.STRUCT = `
toolsys.ToolStack {
  cur    : int;
  _stack : array(abstract(toolsys.ToolOp)) | this._save();
}
`;
  nstructjs.register(ToolStack);
  window._testToolStackIO = function () {
    let data=[];
    let cls=_appstate.toolstack.constructor;
    nstructjs.writeObject(data, _appstate.toolstack);
    data = new DataView(new Uint8Array(data).buffer);
    let toolstack=nstructjs.readObject(data, cls);
    _appstate.toolstack.rewind();
    toolstack.cur = -1;
    toolstack.ctx = _appstate.toolstack.ctx;
    _appstate.toolstack = toolstack;
    return toolstack;
  }
  function buildToolSysAPI(api, registerWithNStructjs, rootCtxStruct) {
    if (registerWithNStructjs===undefined) {
        registerWithNStructjs = true;
    }
    if (rootCtxStruct===undefined) {
        rootCtxStruct = undefined;
    }
    let datastruct=api.mapStruct(ToolPropertyCache, true);
    for (let cls of ToolClasses) {
        let def=cls._getFinalToolDef();
        for (let k in def.inputs) {
            let prop=def.inputs[k];
            if (!(prop.flag&(PropFlags.PRIVATE|PropFlags.READ_ONLY))) {
                SavedToolDefaults._buildAccessors(cls, k, prop, datastruct, api);
            }
        }
    }
    if (rootCtxStruct) {
        rootCtxStruct.struct("toolDefaults", "toolDefaults", "Tool Defaults", api.mapStruct(ToolPropertyCache));
    }
    if (!registerWithNStructjs) {
        return ;
    }
    for (let cls of ToolClasses) {
        try {
          if (!nstructjs.isRegistered(cls)) {
              ToolOp._regWithNstructjs(cls);
          }
        }
        catch (error) {
            console.log(error.stack);
            console.error("Failed to register a tool with nstructjs");
        }
    }
  }
  buildToolSysAPI = _es6_module.add_export('buildToolSysAPI', buildToolSysAPI);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/toolsys/toolsys.js');


es6_module_define('colorutils', ["../util/vectormath.js", "../util/util.js"], function _colorutils_module(_es6_module) {
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var Vector3=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector4');
  let rgb_to_hsv_rets=new util.cachering(() =>    {
    return [0, 0, 0];
  }, 64);
  function rgb_to_hsv(r, g, b) {
    let computedH=0;
    let computedS=0;
    let computedV=0;
    if (r==null||g==null||b==null||isNaN(r)||isNaN(g)||isNaN(b)) {
        throw new Error(`Please enter numeric RGB values! r: ${r} g: ${g} b: ${b}`);
    }
    let minRGB=Math.min(r, Math.min(g, b));
    let maxRGB=Math.max(r, Math.max(g, b));
    if (minRGB===maxRGB) {
        computedV = minRGB;
        let ret=rgb_to_hsv_rets.next();
        ret[0] = 0, ret[1] = 0, ret[2] = computedV;
        return ret;
    }
    let d=(r===minRGB) ? g-b : ((b===minRGB) ? r-g : b-r);
    let h=(r===minRGB) ? 3 : ((b===minRGB) ? 1 : 5);
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
  let rgb_to_cmyk_rets=util.cachering.fromConstructor(Vector4, 512);
  let cmyk_to_rgb_rets=util.cachering.fromConstructor(Vector3, 512);
  function cmyk_to_rgb(c, m, y, k) {
    let ret=cmyk_to_rgb_rets.next();
    if (k===1.0) {
        ret.zero();
        return ret;
    }
    c = c-c*k+k;
    m = m-m*k+k;
    y = y-y*k+k;
    ret[0] = 1.0-c;
    ret[1] = 1.0-m;
    ret[2] = 1.0-y;
    return ret;
  }
  cmyk_to_rgb = _es6_module.add_export('cmyk_to_rgb', cmyk_to_rgb);
  function rgb_to_cmyk(r, g, b) {
    let ret=rgb_to_cmyk_rets.next();
    let C=1.0-r;
    let M=1.0-g;
    let Y=1.0-b;
    let var_K=1;
    if (C<var_K)
      var_K = C;
    if (M<var_K)
      var_K = M;
    if (Y<var_K)
      var_K = Y;
    if (var_K===1) {
        C = 0;
        M = 0;
        Y = 0;
    }
    else {
      C = (C-var_K)/(1-var_K);
      M = (M-var_K)/(1-var_K);
      Y = (Y-var_K)/(1-var_K);
    }
    let K=var_K;
    ret[0] = C;
    ret[1] = M;
    ret[2] = Y;
    ret[3] = K;
    return ret;
  }
  rgb_to_cmyk = _es6_module.add_export('rgb_to_cmyk', rgb_to_cmyk);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/colorutils.js');


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
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/cssutils.js');


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
    ret.ctrlKey = e.ctrlKey;
    ret.shiftKey = e.shiftKey;
    ret.altKey = e.altKey;
    for (let i=0; i<2; i++) {
        let key=i ? "targetTouches" : "touches";
        if (e[key]) {
            ret[key] = [];
            for (let t of e[key]) {
                let t2={};
                ret[key].push(t2);
                for (let k in t) {
                    t2[k] = t[k];
                }
            }
        }
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
    return modalStack.length===0||modalStack[modalStack.length-1]===owner;
  }
  isModalHead = _es6_module.add_export('isModalHead', isModalHead);
  class EventHandler  {
     pushPointerModal(dom, pointerId) {
      if (this._modalstate) {
          console.warn("pushPointerModal called twiced!");
          return ;
      }
      this._modalstate = simple_events.pushPointerModal(this, dom, pointerId);
    }
     pushModal(dom, _is_root) {
      if (this._modalstate) {
          console.warn("pushModal called twiced!");
          return ;
      }
      this._modalstate = simple_events.pushModalLight(this);
    }
     popModal() {
      if (this._modalstate!==undefined) {
          let modalstate=this._modalstate;
          simple_events.popModalLight(modalstate);
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
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/events.js');


es6_module_define('expr', ["./parseutil.js", "./vectormath.js"], function _expr_module(_es6_module) {
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
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/expr.js');


es6_module_define('graphpack', ["./vectormath.js", "./solver.js", "./util.js", "./math.js"], function _graphpack_module(_es6_module) {
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
  function graphPack(nodes, margin_or_args, steps, updateCb) {
    if (margin_or_args===undefined) {
        margin_or_args = 15;
    }
    if (steps===undefined) {
        steps = 10;
    }
    if (updateCb===undefined) {
        updateCb = undefined;
    }
    let margin=margin_or_args;
    let speed=1.0;
    if (typeof margin==="object") {
        let args=margin;
        margin = args.margin??15;
        steps = args.steps??10;
        updateCb = args.updateCb;
        speed = args.speed??1.0;
    }
    let orignodes=nodes;
    nodes = copyGraph(nodes);
    let decay=1.0;
    let decayi=0;
    let min=new Vector2().addScalar(1e+17);
    let max=new Vector2().addScalar(-1e+17);
    let tmp=new Vector2();
    for (let n of nodes) {
        min.min(n.pos);
        tmp.load(n.pos).add(n.size);
        max.max(tmp);
    }
    let size=new Vector2(max).sub(min);
    for (let n of nodes) {
        n.pos[0]+=(Math.random()-0.5)*5.0/size[0]*speed;
        n.pos[1]+=(Math.random()-0.5)*5.0/size[1]*speed;
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
      let $_t0qkuo=params, v1=$_t0qkuo[0], v2=$_t0qkuo[1], restlen=$_t0qkuo[2];
      if (disableEdges)
        return 0;
      return Math.abs(v1.absPos.vectorDistance(v2.absPos)-restlen);
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
      let $_t1jjfv=params, n1=$_t1jjfv[0], n2=$_t1jjfv[1];
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
              let rlen=1.0;
              let con=new Constraint("edge_c", edge_c, [v1.node.pos, v2.node.pos], [v1, v2, rlen]);
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
                  let rlen=n1.size.vectorLength()*0.0;
                  let con=new Constraint("edge_c", edge_c, [v.node.pos, v2.node.pos], [v, v2, rlen]);
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
                  let size=decay*(n1.size.vectorLength()+n2.size.vectorLength())*speed;
                  n1.pos[0]+=(Math.random()-0.5)*size;
                  n1.pos[1]+=(Math.random()-0.5)*size;
                  n2.pos[0]+=(Math.random()-0.5)*size;
                  n2.pos[1]+=(Math.random()-0.5)*size;
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
              n.pos[0]+=(Math.random()-0.5)*rfac*speed;
              n.pos[1]+=(Math.random()-0.5)*rfac*speed;
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
          err = solver.solve(10, gk*speed);
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
        decayi++;
        decay = Math.exp(-decayi*0.1);
    }
    min.zero().addScalar(1e+17);
    max.zero().addScalar(-1e+17);
    for (let node of (best ? best : nodes)) {
        min.min(node.pos);
        p2.load(node.pos).add(node.size);
        max.max(p2);
    }
    for (let node of (best ? best : nodes)) {
        node.pos.sub(min);
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
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/graphpack.js');


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
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/html5_fileapi.js');


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
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/image.js');

