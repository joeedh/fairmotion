"use strict";

import {
  MinMax
} from 'mathlib';

import {
  VectorFlags, VectorVertex, QuadBezPath,
  VectorDraw
} from 'vectordraw_base';

var canvaspath_draw_mat_tmps = new cachering(function() {
  return new Matrix4();
}, 16);
var canvaspath_draw_args_tmps = new Array(8);
for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
  canvaspath_draw_args_tmps[i] = new Array(i);
}
var canvaspath_draw_vs = new cachering(function() {
  return new Vector2();
}, 32);

var CCMD=0, CARGLEN=1;

var MOVETO = 0, BEZIERTO=1, LINETO=2;

export class CanvasPath extends QuadBezPath {
  constructor() {
    super();
    
    this.commands = [];
    this.recalc = 1;
    
    this.lastx = 0;
    this.lasty = 0;
    
    this.canvas = undefined;
    this.g = undefined;
    
    this.first = true;
    this._mm = new MinMax(2);
  }
  
  update_aabb(draw) {
    var tmp = new Vector2();
    var mm = this._mm;
    var pad = this.pad = this.blur > 0 ? this.blur + 15 : 0;
    
    mm.reset();
    
    var cs = this.commands, i = 0;
    while (i < cs.length) {
      var cmd = cs[i++];
      var arglen = cs[i++];
      
      for (var j=0; j<arglen; j += 2) {
        tmp[0] = cs[i++], tmp[1] = cs[i++];
        tmp.multVecMatrix(draw.matrix);
        
        mm.minmax(tmp);
      }
    }
    
    this.aabb[0].load(mm.min).subScalar(pad);
    this.aabb[1].load(mm.max).addScalar(pad);
  }
  
  _pushCmd() {
    this.commands.push(arguments[0]);
    var arglen = arguments.length - 1;
    
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
    this.canvas = this.g = undefined;
  }
  
  gen(draw, _check_tag=0) {
    if (_check_tag && !this.recalc) {
      console.log("infinite loop in clip stack");
      return;
    }
    
    this.recalc = 0;
    
    var do_clip = this.clip_paths.length > 0;
    var do_blur = this.blur > 0.0;
    
    //var zoom = draw.matrix.$matrix.m11; //scale should always be uniform, I think
    
    this.update_aabb(draw);
    var w = this.size[0] = Math.ceil(this.aabb[1][0]-this.aabb[0][0]);
    var h = this.size[1] = Math.ceil(this.aabb[1][1]-this.aabb[0][1]);
    
    if (this.canvas == undefined) {
      this.canvas = document.createElement("canvas");
      this.canvas.style.background = "rgba(0.0, 0.0, 0.0, 0.0)";
      this.g = this.canvas.getContext("2d");
    }
    
    if (this.canvas.width != w || this.canvas.height != h) {
      //console.log("resetting canvas:", this.canvas.width, this.canvas.height, w, h);
      
      this.canvas.width = w;
      this.canvas.height = h;
    } else {
      this.g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    this.g.globalCompositeOperation = "source-over";
    
    for (var path of this.clip_paths) {
      //console.log("CLIPPING!", path);
      
      if (path.recalc) {
        console.log("  clipping subgen!");
        path.gen(draw, 1);
      }
      
      path.draw(draw, -this.aabb[0][0], -this.aabb[0][1], this.canvas, this.g);
    }
    
    if (do_clip) {
      this.g.globalCompositeOperation = "source-atop";
    }
    
    var mat1 = canvaspath_draw_mat_tmps.next();
    var mat = canvaspath_draw_mat_tmps.next();
    mat1.makeIdentity(), mat.makeIdentity();
    
    mat1.translate(-this.aabb[0][0], -this.aabb[0][1]);
    
    mat.makeIdentity();
    mat.load(draw.matrix);
    
    mat.preMultiply(mat1);
    
    var co = canvaspath_draw_vs.next().zero();
    
    var r = ~~(this.color[0]*255),
        g = ~~(this.color[1]*255),
        b = ~~(this.color[2]*255),
        a = this.color[3];
    
    this.g.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
    
    if (do_blur) {
      var doff = 25000;
      this.g.translate(-doff, -doff);
      this.g.shadowOffsetX = doff;
      this.g.shadowOffsetY = doff;
      this.g.shadowColor = "rgba("+r+","+g+","+b+","+a+")";
      this.g.shadowBlur = this.blur;
    }
    this.g.beginPath();
    
    var cs = this.commands, i = 0;
    while (i < cs.length) {
      var cmd = cs[i++];
      var arglen = cs[i++];
      
      //console.log(cmd, arglen);
      
      var tmp = canvaspath_draw_args_tmps[arglen];
      
      for (var j=0; j<arglen; j += 2) {
        co[0] = cs[i++], co[1] = cs[i++];
        co.multVecMatrix(mat);
        tmp[j] = co[0], tmp[j+1] = co[1];
      }

      switch (cmd) {
        case MOVETO:
          this.g.moveTo(tmp[0], tmp[1]);
          break;
        case LINETO:
          this.g.lineTo(tmp[0], tmp[1]);
          break;
        case BEZIERTO:
          this.g.quadraticCurveTo(tmp[0], tmp[1], tmp[2], tmp[3]);
          break;
      }
    }
    
    this.g.fill();
    
    if (do_blur) {
      this.g.translate(doff, doff);
      this.g.shadowOffsetX = this.g.shadowOffsetY = 0.0;
      this.g.shadowBlur = 0.0;
    }
  }
  
  reset(draw) {
    this.commands.length = 0;
    this.off.zero();
    this.first = true;
  }
  
  draw(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g) {
    offx += this.off[0], offy += this.off[1];
    
    if (this.recalc) {
      this.recalc = 0;
      
      this.gen(draw);
    }
    
    g.imageSmoothingEnabled = false;
    //console.log(this.aabb[0][0], this.aabb[0][1], offx, offy, this.off, this.commands, draw.matrix);
    
    //XXX bypass patch methods
    if (g._drawImage != undefined) {
      g._drawImage(this.canvas, this.aabb[0][0]+offx, this.aabb[0][1]+offy);
    } else {
      g.drawImage(this.canvas, this.aabb[0][0]+offx, this.aabb[0][1]+offy);
    }
  }
  
  update() {
    this.recalc = 1;
  }
}

export class CanvasDraw2D extends VectorDraw {
  constructor() {
    this.paths = [];
    this.path_idmap = {};
    this.dosort = true;
    
    this.matstack = new Array(256);
    this.matrix = new Matrix4();

    for (var i=0; i<this.matstack.length; i++) {
      this.matstack[i] = new Matrix4();
    }
    this.matstack.cur = 0;
    
    this.canvas = undefined;
    this.g = undefined;
  }
  
  has_path(id, z) {
    if (z === undefined) {
      throw new Error("z cannot be undefined");
    }

    if (!(id in this.path_idmap)) {
      return false;
    }
    
    var path = this.path_idmap[id];
    return path.z == z;
  }
  
  //creates new path if necessary.  z is required
  get_path(id, z) {
    if (z === undefined) {
      throw new Error("z cannot be undefined");
    }
    
    if (!(id in this.path_idmap)) {
      this.path_idmap[id] = new CanvasPath();
      this.path_idmap[id].index = this.paths.length;
      this.path_idmap[id].id = id;

      this.paths.push(this.path_idmap[id]);
    }
    
    var ret = this.path_idmap[id];
    
    if (ret.z != z) {
      this.dosort = 1;
      ret.z = z;
    }
    
    return ret;
  }
  
  update() {
    for (var path of this.paths) {
      path.update(this);
    }
  }
  
  destroy() {
    for (var path of this.paths) {
      path.destroy(this);
    }
  }
  
  draw(canvas, g) {
    this.canvas = canvas;
    this.g = g;
    
    if (this.dosort) {
      this.dosort = 0;
      this.paths.sort(function(a, b) {
        return a.z - b.z;
      });
    }
    
    for (var path of this.paths) {
      path.draw(this);
    }
  }
  
  //set draw matrix
  set_matrix(matrix) {
    super.set_matrix(matrix);
  }
}
