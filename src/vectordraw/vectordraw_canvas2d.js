"use strict";

import * as config from 'config';

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

var MOVETO = 0, BEZIERTO=1, LINETO=2, BEGINPATH=3;

export class CanvasPath extends QuadBezPath {
  constructor() {
    super();
    
    this.commands = [];
    this.recalc = 1;
    
    this.lastx = 0;
    this.lasty = 0;
    
    this.canvas = undefined;
    this.g = undefined;
    
    this.path_start_i = 0;
    this.first = true;
    this._mm = new MinMax(2);
  }
  
  update_aabb(draw, fast_mode=false) {
    var tmp = new Vector2();
    var mm = this._mm;
    var pad = this.pad = this.blur > 0 ? this.blur + 15 : 0;
    
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
        tmp.add(draw.pan);
        
        mm.minmax(tmp);
      }
      
      prev = cmd;
    }
    
    this.aabb[0].load(mm.min).subScalar(pad);
    this.aabb[1].load(mm.max).addScalar(pad);
    
    this.aabb[0].floor();
    this.aabb[1].ceil();
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
  
  //renders into another path's canvas
  genInto(draw, path, clip_mode=false) {
    let oldc = this.canvas, oldg = this.g, oldaabb = this.aabb, oldsize = this.size;
    
    this.canvas = path.canvas;
    this.g = path.g;
    this.aabb = path.aabb;
    this.size = path.size;
    
    this.gen(draw, undefined, clip_mode);
    
    this.canvas = oldc;
    this.g = oldg;
    this.aabb = oldaabb;
    this.size = oldsize;
  }
  
  gen(draw, _check_tag=0, clip_mode=false) {
    if (_check_tag && !this.recalc) {
      console.log("infinite loop in clip stack");
      return;
    }
    
    this.recalc = 0;
    
    var do_clip = this.clip_paths.length > 0;
    var do_blur = this.blur > 0.0;
    
    //var zoom = draw.matrix.$matrix.m11; //scale should always be uniform, I think
    
    this.update_aabb(draw);
    
    var w = this.size[0] = Math.ceil(this.aabb[1][0] - this.aabb[0][0]);
    var h = this.size[1] = Math.ceil(this.aabb[1][1] - this.aabb[0][1]);
    
    if (w > config.MAX_CANVAS2D_VECTOR_CACHE_SIZE || h > config.MAX_CANVAS2D_VECTOR_CACHE_SIZE) {
      var w2 = Math.min(w, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
      var h2 = Math.min(h, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
      var dw = w - w2, dh = h - h2;
      
      this.aabb[0][0] += dw*0.5;
      this.aabb[0][1] += dh*0.5;
      this.aabb[1][0] -= dw*0.5;
      this.aabb[1][1] -= dh*0.5;
      
      this.size[0] = w2;
      this.size[1] = h2;
      w = w2, h = h2;
    }
    
    if (this.canvas == undefined) {
      //console.warn("creating canvas. . .");
      
      this.canvas = document.createElement("canvas");
      this.canvas.style.background = "rgba(0.0, 0.0, 0.0, 0.0)";
      this.g = this.canvas.getContext("2d");
    }
    
    if (this.g == undefined) { //presumably a degenerate path
      console.log("render error!", this.id, this.size[0], this.size[1], this.canvas, this);
      return;
    }
    
    if (this.canvas.width != w || this.canvas.height != h) {
      //console.log("resetting canvas:", this.canvas.width, this.canvas.height, w, h);
      
      this.canvas.width = w;
      this.canvas.height = h;
    }

    this.g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.g.globalCompositeOperation = "source-over";

    for (var path of this.clip_paths) {
      //console.log("CLIPPING!", path);
      
      if (path.recalc) {
        console.log("   clipping subgen!");
        path.gen(draw, 1);
      }
      
      let oldc = path.canvas, oldg = path.g, oldaabb = path.aabb, oldsize = path.size;
      
      path.genInto(draw, this, true);
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
        co.add(draw.pan);
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
        case BEGINPATH:
          this.g.beginPath();
          break;
      }
    }
    
    if (!clip_mode) {
      this.g.fill();
    } else {
      this.g.clip();
    }
    
    if (do_blur) {
      this.g.translate(doff, doff);
      this.g.shadowOffsetX = this.g.shadowOffsetY = 0.0;
      this.g.shadowBlur = 0.0;
    }
  }
  
  reset(draw) {
    this.commands.length = 0;
    this.path_start_i = 0;
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
    super();
    
    this.paths = [];
    this.path_idmap = {};
    this.dosort = true;
    
    this.matstack = new Array(256);
    this.matrix = new Matrix4();
    this._last_pan = new Vector2();
    
    for (var i=0; i<this.matstack.length; i++) {
      this.matstack[i] = new Matrix4();
    }
    this.matstack.cur = 0;
    
    this.canvas = undefined;
    this.g = undefined;
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
      this.path_idmap[id] = new CanvasPath();
      this.path_idmap[id].index = this.paths.length;
      this.path_idmap[id].id = id;

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
    for (var path of this.paths) {
      path.update(this);
    }
  }
  
  destroy() {
    for (var path of this.paths) {
      path.destroy(this);
    }
  }
  
  draw(g) {
    var canvas = g.canvas;
    var off = canvaspath_draw_vs.next();
    
    off.load(this.pan).sub(this._last_pan);
    this._last_pan.load(this.pan);
    
    //propagate clip users (once)
    for (var path of this.paths) {
      if (!path.recalc) {
        continue;
      }
      
      for (var path2 of path.clip_users) {
        path2.recalc = 1;
      }
    }
    
    for (var path of this.paths) {
      if (!path.recalc) {
        path.off.add(off);
      }
    }
    
    this.canvas = canvas;
    this.g = g;
    
    if (this.dosort) {
      console.log("SORT");
      
      this.dosort = 0;
      this.paths.sort(function(a, b) {
        return a.z - b.z;
      });
    }
    
    for (var path of this.paths) {
      if (path.hidden) {
        continue;
      }
      
      path.draw(this);
    }
  }
  
  //set draw matrix
  set_matrix(matrix) {
    super.set_matrix(matrix);
  }
}
