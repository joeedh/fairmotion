"use strict";

import * as config from '../config/config.js';

import {
  MinMax
} from '../util/mathlib.js';

import {
  VectorFlags, VectorVertex, QuadBezPath,
  VectorDraw
} from './vectordraw_base.js';

var canvaspath_draw_mat_tmps = new cachering(_ => new Matrix4(), 16);

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

export function makeElement(type, attrs={}) {
  var ret = document.createElementNS(NS, type);
  for (var k in attrs) {
    ret.setAttributeNS(null, k, attrs[k]);
  }
  
  return ret;
}

export class StubCanvasPath extends QuadBezPath {
recalc : number
lastx : number
lasty : number
_last_off : Vector2
clip_users : set
path_start_i : number
first : boolean
_mm : MinMax;

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
  
  update_aabb(draw, fast_mode=false) {
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
  
  _pushCmd() {
    var arglen = arguments.length - 1;
    
    this.commands.push(arguments[0]);
    this.commands.push(arglen);
    
    for (var i=0; i<arglen; i++) {
      this.commands.push(arguments[i+1]);
    }
    
    this.recalc = 1;
    this.first = false;
  }
  
  moveTo(x, y) {
    this._pushCmd(MOVETO, x, y);
    this.lastx = x;
    this.lasty = y;
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
  
  gen(draw, _check_tag=0) {
  }
  
  reset(draw) {
    //this.recalc = 1;
    this.commands.length = 0;
    this.path_start_i = 0;
    this.off.zero();
    this._last_off[0] = this._last_off[1] = 1e17;
    this.first = true;
  }
  
  draw(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g) {
  }
  
  update() {
    this.recalc = 1;
  }
}

export class StubCanvasDraw2D extends VectorDraw {
  constructor() {
    super();
    
    this.paths = [];
    this.path_idmap = {};
    this.dosort = true;
    
    this.matstack = new Array(256);
    this.matrix = new Matrix4();
    
    for (var i=0; i<this.matstack.length; i++) {
      this.matstack[i] = new Matrix4();
    }
    this.matstack.cur = 0;
  }
  
  static get_canvas(id, width, height, zindex) {
    var ret = document.getElementById(id);
    
    if (ret == undefined) {
      ret = document.createElement("canvas");
      ret.id = id;
    }
    
    ret.width = width;
    ret.height = height;
    
    if (ret.style != undefined) {
      ret.style["z-index"] = zindex;
    }
    
    return ret;
  }
  
  has_path(id, z, check_z=true) {
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
  get_path(id, z, check_z=true) {
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
  
  static kill_canvas(svg) {
  }
  
  destroy() {
  }
  
  draw(g) {
    var canvas = g.canvas;
    
    canvas.style["background"] = "rgba(0,0,0,0)";
    
    this.canvas = canvas;
    this.g = g;
  }
  
  //set draw matrix
  set_matrix(matrix) {
    super.set_matrix(matrix);
    
    this.zoom = matrix.$matrix.m11;
  }
}
