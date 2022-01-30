"use strict";

import {
  MinMax
} from '../util/mathlib.js';

import {
  VectorFlags, VectorVertex, QuadBezPath,
  VectorDraw
} from './vectordraw_base.js';

export function loadCanvasKit() {
  let script = document.createElement("script");
  script.setAttribute("type", "application/javascript");
  script.setAttribute("src", "node_modules/canvaskit-wasm/bin/canvaskit.js");

  script.addEventListener("load", () => {
    console.log("%cInitializing Skia. . .", "color: blue;");

    CanvasKitInit({
      locateFile: (file) => 'node_modules/canvaskit-wasm/bin/' + file,
    }).ready().then((CanvasKit) => {
      console.log("%c CanvasKit initialized", "color: blue");
      window.CanvasKit = CanvasKit;
    });
  });
  document.body.appendChild(script);
}

window.loadCanvasKit = loadCanvasKit;

let debug = 0;
window._setDebug = (d) => {
  debug = d;
};

let canvaspath_draw_args_tmps = new Array(8);
for (let i = 1; i < canvaspath_draw_args_tmps.length; i++) {
  canvaspath_draw_args_tmps[i] = new Array(i);
}

let MOVETO = 0, BEZIERTO = 1, LINETO = 2, BEGINPATH = 3, CUBICTO = 4, LINEWIDTH = 5, LINESTYLE = 6, STROKE = 7;

let NS = "http://www.w3.org/2000/svg";
//let XLS = "http://www.w3.org/1999/xlink"

export function makeElement(type, attrs = {}) {
  let ret = document.createElementNS(NS, type);
  for (let k in attrs) {
    ret.setAttributeNS(null, k, attrs[k]);
  }

  return ret;
}

//use by debug reporting
let lasttime = performance.now();

export class SimpleSkiaPath extends QuadBezPath {
  recalc: number
  lastx: number
  lasty: number
  _last_off: Vector2
  clip_users: set
  path_start_i: number
  first: boolean
  _mm: MinMax;

  constructor() {
    super();

    this.commands = [];
    this.recalc = 1;

    this.lastx = 0;
    this.lasty = 0;
    this._last_z = undefined;

    this._last_off = new Vector2();
    this._last_off[0] = this._last_off[1] = 1e17;

    this.domnode = undefined;
    this.filternode = undefined;

    this.clip_users = new set();

    this.path_start_i = 0;
    this.first = true;
    this._mm = new MinMax(2);
  }

  update_aabb(draw, fast_mode = false) {
    let tmp = new Vector2();
    let mm = this._mm;
    let pad = this.pad = this.blur > 0 ? this.blur*draw.zoom + 15 : 0;

    mm.reset();

    if (fast_mode) {
      console.trace("FAST MODE!");
    }

    let prev = -1;
    let cs = this.commands, i = 0;
    while (i < cs.length) {
      let cmd = cs[i++];
      let arglen = cs[i++];

      if (fast_mode && prev !== BEGINPATH) {
        prev = cmd;
        i += arglen;
        continue;
      }

      for (let j = 0; j < arglen; j += 2) {
        tmp[0] = cs[i++], tmp[1] = cs[i++];
        tmp.multVecMatrix(draw.matrix);

        mm.minmax(tmp);
      }

      prev = cmd;
    }

    this.aabb[0].load(mm.min).subScalar(pad);
    this.aabb[1].load(mm.max).addScalar(pad);
  }

  beginPath() {
    this.path_start_i = this.commands.length;
    this._pushCmd(BEGINPATH);
  }

  pushStroke(color, width) {
    if (color) {
      let a = color.length > 3 ? color[3] : 1.0;
      this._pushCmd(LINESTYLE, ~~(color[0]*255), ~~(color[1]*255), ~~(color[2]*255), a);
    }

    if (width !== undefined) {
      this._pushCmd(LINEWIDTH, width);
    }
    this._pushCmd(STROKE);
  }

  undo() { //remove last added path
    //hrm, wonder if I should update the aabb.  I'm thinking not.
    this.commands.length = this.path_start_i;
  }

  _pushCmd() {
    let arglen = arguments.length - 1;

    this.commands.push(arguments[0]);
    this.commands.push(arglen);

    for (let i = 0; i < arglen; i++) {
      this.commands.push(arguments[i + 1]);
    }

    this.recalc = 1;
    this.first = false;
  }

  moveTo(x, y) {
    this._pushCmd(MOVETO, x, y);
    this.lastx = x;
    this.lasty = y;
  }

  cubicTo(x2, y2, x3, y3, x4, y4) {
    this._pushCmd(CUBICTO, x2, y2, x3, y3, x4, y4);
    this.lastx = x4;
    this.lasty = y4;
  }

  bezierTo(x2, y2, x3, y3) {
    this._pushCmd(BEZIERTO, x2, y2, x3, y3);
    this.lastx = x3;
    this.lasty = y3;
  }

  lineTo(x2, y2) {
    if (this.first) {
      this.moveTo(x2, y2);
      return;
    }

    this._pushCmd(LINETO, x2, y2);
    this.lastx = x2;
    this.lasty = y2;
  }

  destroy(draw) {
  }

  gen(draw, _check_tag = 0) {
  }

  reset(draw) {
    //this.recalc = 1;
    this.commands.length = 0;
    this.path_start_i = 0;
    this.off.zero();
    this._last_off[0] = this._last_off[1] = 1e17;
    this.first = true;
  }

  draw(draw, offx, offy, canvas = draw.canvsa, g = draw.g, clipMode = false) {
    return this.drawCanvas(...arguments);
  }

  drawCanvas(draw, offx = 0, offy = 0, canvas = draw.canvas, g = draw.g, clipMode = false) {
    let zoom = draw.matrix.$matrix.m11; //scale should always be uniform, I think

    offx += this.off[0], offy += this.off[1];

    if (isNaN(offx) || isNaN(offy)) {
      throw new Error("nan!");
    }

    this._last_z = this.z;
    g = draw.g;
    let tmp = new Vector3();

    let debuglog = function () {
      if (debug > 1) {
        let time = performance.now();

        if (time - lasttime > 5) {
          console.log(...arguments);
          lasttime = time;
        }
      }
    }

    let debuglog2 = function () {
      if (debug > 0) {
        let time = performance.now();

        if (time - lasttime > 5) {
          console.log(...arguments);
          lasttime = time;
        }
      }
    }

    debuglog2("start " + this.id);

    let matrix = draw.matrix;

    g.beginPath();
    let cmds = this.commands;
    let i;

    let mat2 = new Matrix4(draw.matrix);
    mat2.invert();

    function loadtemp(off) {
      tmp[0] = cmds[i + 2 + off*2];
      tmp[1] = cmds[i + 3 + off*2];
      tmp[2] = 0.0;

      tmp.multVecMatrix(draw.matrix);
      //tmp[0] += draw.pan[0];
      //tmp[1] += draw.pan[1];

      if (isNaN(tmp.dot(tmp))) {
        throw new Error("NaN");
      }
    }

    if (!clipMode && this.clip_paths.length > 0) {
      g.beginPath();
      g.save();

      for (let path of this.clip_paths) {
        path.draw(draw, offx, offy, canvas, g, true);
      }
      g.clip();
    }

    let x1, y1, x2, y2;

    for (i = 0; i < cmds.length; i += cmds[i + 1] + 2) {
      let cmd = cmds[i];

      switch (cmd) {
        case BEGINPATH:
          debuglog("BEGINPATH");
          g.beginPath();
          break;
        case LINEWIDTH:
          let mat = g.getTransform();
          g.lineWidth = cmd[i + 2]*mat.m11;
          break;
        case LINESTYLE:
          let r = cmd[i + 2], g1 = cmd[i + 3], b = cmd[i + 4], a = cmd[i + 5];
          let style = "rgba(" + r + "," + g1 + "," + b + "," + a + ")";

          if (cmd === LINESTYLE) {
            g.strokeStyle = style;
          }
          break;
        case STROKE:
          g.stroke();
          break;
        case LINETO:
          debuglog("LINETO");
          loadtemp(0);

          g.lineTo(tmp[0], tmp[1]);
          break;
        case BEZIERTO: {
          debuglog("BEZIERTO");
          loadtemp(0);

          x1 = tmp[0], y1 = tmp[1];
          loadtemp(1);

          g.quadraticCurveTo(x1, y1, tmp[0], tmp[1]);
          break;
        }
        case CUBICTO: {
          debuglog("CUBICTO");

          loadtemp(0);
          x1 = tmp[0], y1 = tmp[1];

          loadtemp(1);
          x2 = tmp[0], y2 = tmp[1];

          loadtemp(2);

          g.bezierCurveTo(x1, y1, x2, y2, tmp[0], tmp[1]);
          break;
        }
        case MOVETO: {
          debuglog("MOVETO");
          loadtemp(0);

          g.moveTo(tmp[0], tmp[1]);
          break;
        }
      }
    }

    if (clipMode) {
      return;
    }

    let r  = ~~(this.color[0]*255),
        g1 = ~~(this.color[1]*255),
        b  = ~~(this.color[2]*255),
        a  = this.color[3];

    let fstyle = "rgba(" + r + "," + g1 + "," + b + "," + a + ")";
    g.fillStyle = fstyle;

    debuglog2("g.fillStyle", g.fillStyle);

    let doff = 2500;
    let do_blur = this.blur > 1 && !clipMode;

    if (do_blur) {
      g.filter = "blur(" + (this.blur*0.25*zoom) + "px)";
    } else {
      g.filter = "none";
    }

    debuglog2("fill");

    g.fill();

    if (this.clip_paths.length > 0) {
      g.restore();
    }
  }

  update() {
    this.recalc = 1;
  }
}

export class SimpleSkiaDraw2D extends VectorDraw {
  path_idmap: Object
  dosort: boolean
  matstack: Array
  matrix: Matrix4;

  constructor() {
    super();

    this.paths = [];
    this.path_idmap = {};
    this.dosort = true;

    this.matstack = new Array(256);
    this.matrix = new Matrix4();

    for (let i = 0; i < this.matstack.length; i++) {
      this.matstack[i] = new Matrix4();
    }
    this.matstack.cur = 0;
  }

  static get_canvas(id, width, height, zindex) {
    let ret = document.getElementById(id);

    if (ret === undefined) {
      ret = document.createElement("canvas");
      ret.id = id;
    }

    ret.width = width;
    ret.height = height;

    if (ret.style !== undefined) {
      ret.style["z-index"] = zindex;
    }

    return ret;
  }

  has_path(id, z, check_z = true) {
    if (z === undefined) {
      throw new Error("z cannot be undefined");
    }

    if (!(id in this.path_idmap)) {
      return false;
    }

    let path = this.path_idmap[id];
    return check_z ? path.z === z : true;
  }

  //creates new path if necessary.  z is required
  get_path(id, z, check_z = true) {
    if (z === undefined) {
      throw new Error("z cannot be undefined");
    }

    if (!(id in this.path_idmap)) {
      this.path_idmap[id] = new SimpleSkiaPath();
      this.path_idmap[id].index = this.paths.length;
      this.path_idmap[id].id = id;
      this.dosort = 1;

      this.paths.push(this.path_idmap[id]);
    }

    let ret = this.path_idmap[id];

    if (check_z && ret.z !== z) {
      this.dosort = 1;
      ret.z = z;
    }

    return ret;
  }

  update() {
    console.warn("update called");

    for (let p of this.paths) {
      p.update();
    }
  }

  static kill_canvas(svg) {
  }

  destroy() {
  }

  draw(g) {
    let canvas = g.canvas;


    //canvas.style["background"] = "rgba(0,0,0,0)";

    this.canvas = canvas;
    this.g = g;

    let canvas0, g0;

    if (0) { //window.skcanvas !== undefined) {
      this.canvas = canvas = window.skcanvas;
      this.g = g = window.skg;
    } else if (window.CanvasKit !== undefined) {
      canvas0 = canvas;
      g0 = g;

      canvas = CanvasKit.MakeCanvas(canvas.width, canvas.height);
      canvas.width = canvas0.width;
      canvas.height = canvas0.height;

      let mat = g0.getTransform();

      let g2 = canvas.getContext("2d");

      if (!g2.getTransform) {
        let matrixKey = undefined;

        for (let k in g2) {
          let v = g2[k];
          let ok = typeof v === "object" && Array.isArray(v);
          ok = ok && (v.length === 9 || v.length === 16);

          if (ok) {
            for (let item of v) {
              if (typeof item !== "number") {
                ok = false;
                break;
              }
            }
          }

          if (ok) {
            matrixKey = k;
            break;
          }
        }

        if (matrixKey) {
          g2.getTransform = function () {
            return this[matrixKey];
          }
        }
        console.error("MATRIX_KEY", matrixKey);
      }
      g2.globalAlpha = 1.0;
      g2.globalCompositeOperation = "source-over";

      //g2.clearRect(0, 0, ~~canvas.width, ~~canvas.height);
      //g2.setTransform(mat.m11, mat.m12, mat.m21, mat.m22, mat.m41, mat.m42);

      this.canvas = canvas;
      this.g = g2;
      g = g2;
    }
    /*
    g.beginPath()
    g.rect(0, 0, canvas.width, canvas.height);
    g.fillStyle = "orange";
    g.fill();
    //*/

    g.save();
    g.resetTransform();

    for (let p of this.paths) {
      p.draw(this, undefined, undefined, this.canvas, this.g);
    }

    g.restore();

    if (canvas0) {
      this.g.beginPath();
      this.g.rect(0, 0, 500, 500);
      this.g.fillStyle = "rgb(255, 200, 200)";
      this.g.fill();

      this.canvas.Il.flush();

      let image = this.g.getImageData(0, 0, canvas0.width, canvas0.height);
      let image2 = new ImageData(canvas0.width, canvas0.height);
      image2.data.set(image.data);

      console.log(image2);
      for (let i = 0; i < image2.data.length; i += 4) {
        image2.data[i] = image.data[i];
        image2.data[i + 1] = image.data[i + 1];
        image2.data[i + 2] = image.data[i + 2];
        image2.data[i + 3] = 255;
      }

      g0.putImageData(image2, 0, 0);

      window.skcanvas = this.canvas;
      window.skg = this.g;

      //canvas.Lk = canvas.mm.Lk = canvas0;
      //canvas.mm.flush();
      canvas.dispose();
    }

    //console.log(this.matrix);
    //console.log(this.g);
    return new Promise((accept, reject) => {
      accept();
    });
  }

  //set draw matrix
  set_matrix(matrix) {
    super.set_matrix(matrix);

    this.zoom = matrix.$matrix.m11;
  }
}
