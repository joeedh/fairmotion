"use strict";

/* Was `static` inside IconManager.enum_to_xy(); hoisted to module scope, which
   is what the transpiler did with it. */
const _enum_to_xy_ret = [0, 0];

export class IconManager {
  /* Where the sheet image is fetched from. */
  path: string;
  /* Size of the whole sheet, and of one icon cell within it, in pixels. */
  size: Vector2;
  cellsize: Vector2;
  /* Set once the sheet image has decoded. */
  ready: boolean;
  /* Holds the <img> the sheet decodes into. */
  tex!: { image: HTMLImageElement };
  /* Written once and never read. */
  te!: Object;

  constructor(sheet_path: string, imgsize: Array<number>, iconsize: Array<number>) {
    this.path = sheet_path;
    this.size = new Vector2(imgsize);
    this.cellsize = new Vector2(iconsize);

    this.load();
    this.ready = false;
  }

  load() {
    this.tex = { image: new Image() };
    this.tex.image.src = this.path;

    this.te = {};
    var this2 = this;
    this.tex.image.onload = function () {
      this2.ready = true;
    };
  }

  get_tile(tile: number): Array<float> {
    var ret: float[] = [];
    this.gen_tile(tile, ret);

    return ret;
  }

  enum_to_xy(tile: number) {
    const ret = _enum_to_xy_ret;

    var size = this.size;
    var cellsize = this.cellsize;

    var fx = Math.floor(size[0] / cellsize[0]);

    var y = Math.floor(tile / fx);
    var x = tile % fx;

    x *= cellsize[0];
    y *= cellsize[1];

    ret[0] = x;
    ret[1] = y;

    return ret;
  }

  gen_tile(tile: number, texcos: float[]) {
    var size = this.size;
    var cellsize = this.cellsize;

    var fx = Math.floor(size[0] / cellsize[0]);

    var y = Math.floor(tile / fx);
    var x = tile % fx;

    x = (x * cellsize[0]) / size[0];
    y = (y * cellsize[1]) / size[1];

    /*
    for (var i=0; i<3*2; i++) {
      texcos.push(y);
    }
    return;
    */

    var u = 1.0 / size[0],
      v = 1.0 / size[1];
    u *= cellsize[0];
    v *= cellsize[1];
    /*
    x = 0.0;
    y = 0.0;
    u = 1.0;
    v = -1.0;
    // */
    y += v;
    texcos.push(x);
    texcos.push(y); //0
    texcos.push(x);
    texcos.push(y - v); //1
    texcos.push(x + u);
    texcos.push(y - v); //2

    texcos.push(x);
    texcos.push(y); //0
    texcos.push(x + u);
    texcos.push(y - v); //2
    texcos.push(x + u);
    texcos.push(y); //3
  }
}
