"use strict";

import { STRUCT } from "../core/struct.js";

export function darken(c: number[], m: number) {
  for (var i = 0; i < 3; i++) {
    c[i] *= m;
  }

  return c;
}

export class BoxColor {
  static STRUCT: string;

  /* Backing store for the colors accessor.  NOTE: BoxWColor overrides the
     accessor pair, so the assignment below runs through its setter and trips
     the "undefined was passed" warning on every construction. */
  _colors: number[][] | undefined;

  constructor() {
    this.colors = undefined; //[clr1, clr2, clr3, clr4, can be a getter
  }

  get colors(): number[][] | undefined {
    return this._colors;
  }

  set colors(c: number[][] | undefined) {
    this._colors = c;
  }

  copy() {
    var ret = new BoxColor();
    ret.colors = JSON.parse(JSON.stringify(this.colors));
    return ret;
  }

  /* NOTE: hands back a bare object rather than a BoxColor, and never calls
     the reader -- BoxColor is only ever read through its subclasses. */
  static fromSTRUCT(reader: StructReader<BoxColor>) {
    return {};
  }
}

BoxColor.STRUCT = `
  BoxColor {
  }
`;

export class BoxColor4 extends BoxColor {
  static STRUCT: string;

  constructor(colors?: number[][]) {
    super();

    var clrs: number[][] = (this.colors = [[], [], [], []]);

    if (colors == undefined) return this;

    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        clrs[i].push(colors[i][j]);
      }
    }
  }

  copy() {
    return new BoxColor4(this.colors);
  }

  static fromSTRUCT(reader: StructReader<BoxColor4>) {
    var ret = new BoxColor4();
    reader(ret);
    return ret;
  }
}
BoxColor4.STRUCT = `
  BoxColor4 {
    colors : array(vec4);
  }
`;

//box colors are colors applied to boxes, i.e. four colors
//weighted box color
export class BoxWColor extends BoxColor {
  static STRUCT: string;

  /* One RGBA color plus a per-corner multiplier; the four corners are
     derived on demand by the colors getter. */
  color!: number[];
  weights!: number[];

  constructor(color?: number[], weights?: number[]) {
    super();

    if (color == undefined || weights == undefined) {
      return this;
    }
    this.color = [color[0], color[1], color[2], color[3]];
    this.weights = [weights[0], weights[1], weights[2], weights[3]];
  }

  /* NOTE: an `else this.color = c` branch handled a flat RGBA here.  Nothing
     assigns colors on a BoxWColor -- the base constructor's
     `this.colors = undefined` is the only call this setter ever sees. */
  set colors(c: number[][] | undefined) {
    if (c === undefined) {
      if (DEBUG.theme) console.warn("undefined was passed to BoxWColor.colors setter");
      return;
    }

    this.color = c[0];
  }

  get colors(): number[][] {
    var ret: number[][] = [[], [], [], []];
    var clr = this.color;
    var w = this.weights;

    if (clr == undefined) clr = [1, 1, 1, 1];

    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 3; j++) {
        ret[i].push(clr[j] * w[i]);
      }
      ret[i].push(clr[3]);
    }

    return ret;
  }

  copy() {
    return new BoxWColor(this.color, this.weights);
  }

  static fromSTRUCT(reader: StructReader<BoxWColor>) {
    var ret = new BoxWColor();
    reader(ret);
    return ret;
  }
}
BoxWColor.STRUCT = `
  BoxWColor {
    color   : vec4;
    weights : vec4;
  }
`;

export class ThemePair {
  key: string;
  val: number[] | BoxColor;

  constructor(key: string, value: number[] | BoxColor) {
    this.key = key;
    this.val = value;
  }
}

/* Either a flat RGBA or one of the BoxColor shapes. */
export type ThemeColor = number[] | BoxColor;

export class ColorTheme {
  static STRUCT: string;

  colors: hashtable<string, number[]>;
  boxcolors: hashtable<string, BoxColor>;
  /* [key, color] pairs, rebuilt by gen_colors() for the data api. */
  flat_colors: GArray<[string, ThemeColor]>;

  /* Set once by init_theme(); reload_default_theme() copies it back. */
  original?: ColorTheme;

  /* Written by nstructjs, folded into colors/boxcolors and deleted by
     fromSTRUCT. */
  colorkeys?: string[];
  colorvals?: number[][];
  boxkeys?: string[];
  boxvals?: BoxColor[];

  constructor(defobj?: { [key: string]: ThemeColor }) {
    this.colors = new hashtable();
    this.boxcolors = new hashtable();

    if (defobj !== undefined) {
      for (var k in defobj) {
        if (this.colors.has(k) || this.boxcolors.has(k)) continue;

        var c = defobj[k];
        if (c instanceof BoxColor) {
          this.boxcolors.set(k, c);
        } else {
          this.colors.set(k, c);
        }
      }
    }

    this.flat_colors = new GArray();
  }

  copy() {
    var ret = new ColorTheme({});

    function cpy(c: ThemeColor) {
      if (c instanceof BoxColor) {
        return c.copy();
      } else {
        return JSON.parse(JSON.stringify(c));
      }
    }

    for (var k of this.boxcolors) {
      let c = this.boxcolors.get(k);

      ret.boxcolors.set(k, cpy(c));
    }

    for (var k of this.colors) {
      let c = this.colors.get(k);

      ret.colors.set(k, cpy(c));
    }

    ret.gen_colors();
    return ret;
  }

  patch(newtheme: ColorTheme) {
    if (newtheme == undefined) return;

    /* hashtable.keys() hands back keystrs, and union() wants a set; passing
       the GArray straight in worked only because union() just iterates it. */
    var ks = new set<KeyStr>(newtheme.colors.keys()).union(
      new set<KeyStr>(newtheme.boxcolors.keys())
    );

    for (var k of this.colors) {
      if (!ks.has(k)) {
        newtheme.colors.set(k, this.colors.get(k));
      }
    }

    for (var k of this.boxcolors) {
      if (!ks.has(k)) {
        newtheme.boxcolors.set(k, this.boxcolors.get(k));
      }
    }

    newtheme.gen_colors();
  }

  gen_code(): string {
    var s = "new ColorTheme({\n";
    var arr = this.flat_colors;

    for (var i = 0; i < arr.length; i++) {
      var item = arr[i];

      if (i > 0) s += ",";
      s += "\n";

      if (item[1] instanceof BoxWColor) {
        s += '  "' + item[0] + '" : ui_weight_clr(';
        s += JSON.stringify(item[1].color);
        s += ",";
        s += JSON.stringify(item[1].weights);
        s += ")";
      } else if (item[1] instanceof BoxColor4) {
        s += '  "' + item[0] + '" : new BoxColor4(';
        s += JSON.stringify(item[1].colors);
        s += ")";
      } else {
        s += '  "' + item[0] + '" : ' + JSON.stringify(item[1]);
      }
    }

    s += "});";

    return s;
  }

  /* Box colors contribute their four corners, so the values are not all flat
     RGBA.  Nothing reads window.uicolors back. */
  gen_colors(): { [key: string]: number[] | number[][] } {
    var ret: { [key: string]: number[] | number[][] } = {};

    //used to communicate with the data api
    this.flat_colors = new GArray();

    for (var k of this.colors) {
      var c1 = this.colors.get(k),
        c2: number[] = [0, 0, 0, 0];

      for (var i = 0; i < 4; i++) {
        c2[i] = c1[i];
      }

      ret[k] = c2;
      this.flat_colors.push([k, c1]);
    }

    for (var k of this.boxcolors) {
      ret[k] = this.boxcolors.get(k).colors ?? [];
      this.flat_colors.push([k, this.boxcolors.get(k)]);
    }

    return ret;
  }

  static fromSTRUCT(reader: StructReader<ColorTheme>) {
    var c = new ColorTheme({});
    reader(c);

    let colorkeys = c.colorkeys ?? [],
      colorvals = c.colorvals ?? [];
    for (var i = 0; i < colorkeys.length; i++) {
      c.colors.set(colorkeys[i], colorvals[i]);
    }

    let boxkeys = c.boxkeys ?? [],
      boxvals = c.boxvals ?? [];
    for (var i = 0; i < boxkeys.length; i++) {
      c.boxcolors.set(boxkeys[i], boxvals[i]);
    }

    delete c.colorkeys;
    delete c.boxkeys;
    delete c.colorvals;
    delete c.boxvals;

    return c;
  }
}
ColorTheme.STRUCT = `
  ColorTheme {
    colorkeys : array(string) | obj.colors.keys();
    colorvals : array(vec4) | obj.colors.values();
    boxkeys : array(string) | obj.boxcolors.keys();
    boxvals : array(abstract(BoxColor)) | obj.boxcolors.values();
  }
`;

window.menu_text_size = 14;
window.default_ui_font_size = 16;
window.ui_hover_time = 800;
//var view2d_bg = [0.6, 0.6, 0.9, 1.0];

export function ui_weight_clr(clr: number[], weights: number[]) {
  return new BoxWColor(clr, weights);
}

//globals
window.uicolors = {};
window.colors3d = {};

export class Theme {
  static STRUCT: string;

  /* Both are optional so fromSTRUCT can `new Theme()`; the reader fills them. */
  ui!: ColorTheme;
  view2d!: ColorTheme;

  constructor(ui?: ColorTheme, view2d?: ColorTheme) {
    if (ui !== undefined) {
      this.ui = ui;
    }

    if (view2d !== undefined) {
      this.view2d = view2d;
    }
  }

  patch(theme: Theme) {
    this.ui.patch(theme.ui);
    //this.view2d.patch(theme.view2d);
  }

  gen_code() {
    var s = '"use strict";\n/*auto-generated file*/\nvar UITheme = ' + this.ui.gen_code() + "\n";
    //s += "var View2DTheme = " + this.view2d.gen_code() + "\n";

    return s;
  }

  static fromSTRUCT(reader: StructReader<Theme>) {
    var ret = new Theme();
    reader(ret);

    return ret;
  }

  //gen_globals_from_flat() {
  //uicolors = this.ui.gen_colors();
  //colors3d = this.view2d.gen_colors();
  //}

  gen_globals() {
    window.uicolors = this.ui.gen_colors();
    //colors3d = this.view2d.gen_colors();
  }
}
Theme.STRUCT = `
  Theme {
    ui     : ColorTheme;
    view2d : ColorTheme;
  }
`;

//globals
window.init_theme = function () {
  window.UITheme.original = window.UITheme.copy();
  window.View2DTheme.original = window.View2DTheme.copy();

  window.g_theme = new Theme(window.UITheme, window.View2DTheme);
  window.g_theme.gen_globals();
};

export function reload_default_theme() {
  //UITheme.original
  window.g_theme = new Theme(window.UITheme.original?.copy(), window.View2DTheme.original?.copy());
  window.g_theme.gen_globals();
}
