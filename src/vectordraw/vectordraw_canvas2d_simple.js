"use strict";

import * as config from '../config/config.js';

import {
  MinMax
} from '../util/mathlib.js';

import {
  VectorFlags, VectorVertex, QuadBezPath,
  VectorDraw
} from './vectordraw_base.js';

var debug = 0;
window._setDebug = (d) => {debug = d;};

var canvaspath_draw_mat_tmps = new cachering(_ => new Matrix4(), 16);

var canvaspath_draw_args_tmps = new Array(8);
for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
  canvaspath_draw_args_tmps[i] = new Array(i);
}
var canvaspath_draw_vs = new cachering(function() {
  return new Vector2();
}, 32);

var CCMD=0, CARGLEN=1;

var MOVETO = 0, BEZIERTO=1, LINETO=2, BEGINPATH=3, CUBICTO=4, STROKE=5, STROKECOLOR=6, STROKEWIDTH=7, NOFILL=8, FILL=9;

var NS = "http://www.w3.org/2000/svg";
var XLS = "http://www.w3.org/1999/xlink"

export function makeElement(type, attrs={}) {
  var ret = document.createElementNS(NS, type);
  for (var k in attrs) {
    ret.setAttributeNS(null, k, attrs[k]);
  }
  
  return ret;
}

//use by debug reporting    
let lasttime = performance.now();

export class SimpleCanvasPath extends QuadBezPath {
  recalc : number
  lastx : number
  lasty : number
  _last_off : Vector2
  clip_users : set
  path_start_i : number
  first : boolean
  _mm : MinMax;

  constructor(matrix) {
    super();
    
    this.commands = [];
    this.recalc = 1;
    this.matrix = matrix;
    
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
      
      if (fast_mode && prev !== BEGINPATH) {
        prev = cmd;
        i += arglen;
        continue;
      }

      if (cmd !== LINETO && cmd !== MOVETO && cmd !== CUBICTO && cmd !== BEZIERTO) {
        prev = cmd;
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

  pushFill() {
    this._pushCmd(FILL);
  }

  pushStroke(color, width) {
    if (color) {
      let a = color[3] || 1.0;
      this._pushCmd(STROKECOLOR, color[0], color[1], color[2], a, 0.5);
    }

    if (width) {
      this._pushCmd(STROKEWIDTH, width);
    }

    this._pushCmd(STROKE);
  }

  noAutoFill() {
    this._pushCmd(NOFILL);
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
  
  draw(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g, clipMode=false) {
    var zoom = draw.matrix.$matrix.m11; //scale should always be uniform, I think

    offx += this.off[0], offy += this.off[1];
    
    if (isNaN(offx) || isNaN(offy)) {
      throw new Error("nan!");
    }

    this._last_z = this.z;
    var g = draw.g;
    var tmp = new Vector3();
    
    let debuglog = function() {
      if (debug > 1) {
        let time = performance.now();

        if (time - lasttime > 5) {
          console.log(...arguments);
          lasttime = time;
        }
      }
    }

    let debuglog2 = function() {
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
    g.lineCap = "butt";
    g.miterLimit = 2.5;

    let cmds = this.commands;
    let i;

    let mat2 = new Matrix4(draw.matrix);
    mat2.invert();

    function loadtemp(off) {
      tmp[0] = cmds[i+2 + off*2];
      tmp[1] = cmds[i+3 + off*2];
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

    var doff = 2500;
    var do_blur = this.blur > 1 && !clipMode;

    if (do_blur) {
      g.filter = "blur(" + (this.blur*0.25*zoom) + "px)";
    } else {
      g.filter = "none";
    }

    let no_fill = false;

    for (i=0; i<cmds.length; i += cmds[i+1] + 2) {
      var cmd = cmds[i];
      
      switch (cmd) {
        case BEGINPATH:
          debuglog("BEGINPATH");
          g.beginPath();
          break;
        case LINETO:
          debuglog("LINETO");
          loadtemp(0);
          
          g.lineTo(tmp[0], tmp[1]);
          break;
        case BEZIERTO:
          debuglog("BEZIERTO");
          loadtemp(0);
          
          var x1 = tmp[0], y1 = tmp[1];

          loadtemp(1);
          
          g.quadraticCurveTo(x1, y1, tmp[0], tmp[1]);
          break;
        case CUBICTO:
          debuglog("CUBICTO");

          loadtemp(0);
          var x1 = tmp[0], y1 = tmp[1];

          loadtemp(1);
          var x2 = tmp[0], y2 = tmp[1];
          
          loadtemp(2);

          g.bezierCurveTo(x1, y1, x2, y2, tmp[0], tmp[1]);
          break;
        case MOVETO:
          debuglog("MOVETO");
          loadtemp(0);

          g.moveTo(tmp[0], tmp[1]);
          break;
        case STROKECOLOR:
          let r = cmds[i+2], g1 = cmds[i+3], b = cmds[i+4], a = cmd[i+5];

          r = ~~(r*255);
          g1 = ~~(g1*255);
          b = ~~(b*255);

          //console.log(a);

          a = a || 1.0;

          g.strokeStyle = `rgba(${r},${g1},${b},${a})`;
          break;
        case STROKEWIDTH:
          //let mat = g.getTransform();
          let zoom = draw.matrix.$matrix.m11;

          g.lineWidth = cmds[i+2]*zoom;
          break;
        case STROKE:
          g.stroke();
          break;
        case FILL:
          g.fill();
          break;
        case NOFILL:
          no_fill = true;
          break;
      }
    }

    if (clipMode) {
      return;
    }

    if (no_fill && this.clip_paths.length > 0) {
      g.restore();
      return;
    }

    var r = ~~(this.color[0]*255),
        g1= ~~(this.color[1]*255),
        b = ~~(this.color[2]*255),
        a =    this.color[3];
    
    let fstyle = "rgba("+r+","+g1+","+b+","+a+")";
    g.fillStyle = fstyle;
    
    debuglog2("g.fillStyle", g.fillStyle);

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

export class SimpleCanvasDraw2D extends VectorDraw {
  path_idmap : Object
  dosort : boolean
  matstack : Array
  matrix : Matrix4;

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
  
  has_path(id, z, check_z=true) {
    if (z === undefined) {
      throw new Error("z cannot be undefined");
    }

    if (!(id in this.path_idmap)) {
      return false;
    }
    
    var path = this.path_idmap[id];
    return check_z ? path.z === z : true;
  }
  
  //creates new path if necessary.  z is required
  get_path(id, z, check_z=true) {
    if (z === undefined) {
      throw new Error("z cannot be undefined");
    }
    
    if (!(id in this.path_idmap)) {
      this.path_idmap[id] = new SimpleCanvasPath(this.matrix);
      this.path_idmap[id].index = this.paths.length;
      this.path_idmap[id].id = id;
      this.dosort = 1;

      this.paths.push(this.path_idmap[id]);
    }
    
    var ret = this.path_idmap[id];
    ret.matrix.load(this.matrix);
    
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
    var canvas = g.canvas;
    
    
    //canvas.style["background"] = "rgba(0,0,0,0)";

    this.canvas = canvas;
    this.g = g;

    /*
    g.beginPath()
    g.rect(0, 0, canvas.width, canvas.height);
    g.fillStyle = "orange";
    g.fill();
    //*/

    g.save();
    g.resetTransform();

    for (var p of this.paths) {
      p.draw(this);
    }

    g.restore();

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
