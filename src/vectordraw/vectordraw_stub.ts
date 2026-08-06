"use strict";

import * as config from '../config/config.js';

import {
  MinMax
} from '../util/mathlib.js';

import {
  VectorFlags, VectorVertex, PathBase,
  VectorDraw
} from './vectordraw_base.js';
import type {DrawCanvas} from './vectordraw_base.js';

var canvaspath_draw_mat_tmps = new cachering(() => new Matrix4(), 16);

var canvaspath_draw_args_tmps = new Array(8);
for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
  canvaspath_draw_args_tmps[i] = new Array(i);
}
var canvaspath_draw_vs = new cachering(function() {
  return new Vector2();
}, 32);

var CCMD=0, CARGLEN=1;

var MOVETO = 0, BEZIERTO=1, LINETO=2, BEGINPATH=3;
var NS = "http://www.w3.org/2000/svg";
var XLS = "http://www.w3.org/1999/xlink"

export function makeElement(type : string,
                            attrs : {[k : string] : string} = {}) {
  var ret = document.createElementNS(NS, type);
  for (var k in attrs) {
    ret.setAttributeNS(null, k, attrs[k]);
  }

  return ret;
}

export class StubCanvasPath extends PathBase {
  _last_off : Vector2
  path_start_i : number
  first : boolean
  _mm : MinMax;

  /* Flat opcode stream: [cmd, arglen, ...args] repeated. */
  commands : number[];
  /* Never read back; the stub keeps no per-z state. */
  _last_z : number | undefined;
  domnode : Element | undefined;
  filternode : Element | undefined;

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

  update_aabb(draw : VectorDraw, fast_mode = false) {
    var tmp = new Vector2();
    var mm = this._mm;
    var pad = this.pad = this.blur > 0 ? this.blur*draw.zoom + 15 : 0;

    mm.reset();

    if (fast_mode) {
      console.trace("FAST MODE!");
    }

    var prev = -1;
    var cs = this.commands, i = 0;
    while (i < cs.length) {
      var cmd = cs[i++];
      var arglen = cs[i++];

      if (fast_mode && prev != BEGINPATH) {
        prev = cmd;
        i += arglen;
        continue;
      }

      for (var j=0; j<arglen; j += 2) {
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

  undo() { //remove last added path
    //hrm, wonder if I should update the aabb.  I'm thinking not.
    this.commands.length = this.path_start_i;
  }

  _pushCmd(...args : number[]) {
    var arglen = arguments.length - 1;

    this.commands.push(arguments[0]);
    this.commands.push(arglen);

    for (var i=0; i<arglen; i++) {
      this.commands.push(arguments[i+1]);
    }

    this.recalc = 1;
    this.first = false;
  }

  moveTo(x : number, y : number) {
    this._pushCmd(MOVETO, x, y);
    this.lastx = x;
    this.lasty = y;
  }

  bezierTo(x2 : number, y2 : number, x3 : number, y3 : number) {
    this._pushCmd(BEZIERTO, x2, y2, x3, y3);
    this.lastx = x3;
    this.lasty = y3;
  }

  lineTo(x2 : number, y2 : number) {
    if (this.first) {
      this.moveTo(x2, y2);
      return;
    }

    this._pushCmd(LINETO, x2, y2);
    this.lastx = x2;
    this.lasty = y2;
  }

  destroy(draw : VectorDraw) {
  }

  gen(draw : StubCanvasDraw2D, _check_tag = 0) {
  }

  reset(draw? : VectorDraw) {
    //this.recalc = 1;
    this.commands.length = 0;
    this.path_start_i = 0;
    this.off.zero();
    this._last_off[0] = this._last_off[1] = 1e17;
    this.first = true;
  }

  draw(draw : StubCanvasDraw2D, offx = 0, offy = 0,
       canvas = draw.canvas, g = draw.g) {
  }

  update() {
    this.recalc = 1;
  }
}

export class StubCanvasDraw2D extends VectorDraw {
  paths : StubCanvasPath[]
  path_idmap : {[id : number] : StubCanvasPath}

  constructor() {
    super();

    this.paths = [];
    this.path_idmap = {};
    this.dosort = true;

    this.matstack = Object.assign(new Array<Matrix4>(256), {cur : 0});
    this.matrix = new Matrix4();

    for (var i=0; i<this.matstack.length; i++) {
      this.matstack[i] = new Matrix4();
    }
    this.matstack.cur = 0;
  }

  static get_canvas(id : string, width : number, height : number,
                    zindex : number) {
    let ret = document.getElementById(id) as HTMLCanvasElement | null;

    /* the loose `== undefined` also matched the null getElementById returns. */
    if (ret === null) {
      ret = document.createElement("canvas");
      ret.id = id;
    }

    ret.width = width;
    ret.height = height;

    /* the `ret.style != undefined` guard around this was always true. */
    ret.style.zIndex = "" + zindex;

    return ret;
  }

  has_path(id : number, z : number, check_z = true) {
    if (z === undefined) {
      throw new Error("z cannot be undefined");
    }

    if (!(id in this.path_idmap)) {
      return false;
    }

    var path = this.path_idmap[id];
    return check_z ? path.z == z : true;
  }

  //creates new path if necessary.  z is required
  get_path(id : number, z : number, check_z = true) {
    if (z === undefined) {
      throw new Error("z cannot be undefined");
    }

    if (!(id in this.path_idmap)) {
      this.path_idmap[id] = new StubCanvasPath();
      this.path_idmap[id].index = this.paths.length;
      this.path_idmap[id].id = id;
      this.dosort = 1;

      this.paths.push(this.path_idmap[id]);
    }

    var ret = this.path_idmap[id];

    if (check_z && ret.z != z) {
      this.dosort = 1;
      ret.z = z;
    }

    return ret;
  }

  update() {
  }

  static kill_canvas(svg : Element) {
  }

  destroy() {
  }

  draw(g : Canvas2D) {
    var canvas = g.canvas;

    canvas.style["background"] = "rgba(0,0,0,0)";

    this.canvas = canvas;
    this.g = g;
  }

  //set draw matrix
  set_matrix(matrix : Matrix4) {
    super.set_matrix(matrix);

    this.zoom = matrix.$matrix.m11;
  }
}
