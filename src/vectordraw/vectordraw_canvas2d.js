"use strict";

import * as config from '../config/config.js';

import {
  MinMax
} from '../util/mathlib.js';

import {
  VectorFlags, VectorVertex, QuadBezPath,
  VectorDraw
} from './vectordraw_base.js';

import {OPCODES} from './vectordraw_jobs_base.js';
import * as vectordraw_jobs from './vectordraw_jobs.js';

var canvaspath_draw_mat_tmps = new cachering(function() {
  return new Matrix4();
}, 16);
var canvaspath_draw_args_tmps = new Array(16);
for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
  canvaspath_draw_args_tmps[i] = new Array(i);
}
var canvaspath_draw_vs = new cachering(function() {
  return new Vector2();
}, 32);

let MOVETO = OPCODES.MOVETO, BEZIERTO=OPCODES.QUADRATIC, LINETO=OPCODES.LINETO, BEGINPATH=OPCODES.BEGINPATH,
    CUBICTO=OPCODES.CUBIC, CLOSEPATH = OPCODES.CLOSEPATH;

let arglens = {};

arglens[BEGINPATH] = 0;
arglens[CLOSEPATH] = 0;
arglens[MOVETO] = 2;
arglens[LINETO] = 2;
arglens[BEZIERTO] = 4;
arglens[CUBICTO] = 6;

let render_idgen = 1;
let batch_iden = 1;

export class Batch {
  constructor() {
    this._batch_id = batch_iden++;
    
    this.paths = [];
    this.path_idmap = {};
    this.regen = 1;
    this.gen_req = 0;
  }

  add(p) {
    if (this.has(p)) {
      return;
    }

    p._batch = this;

    this.regen = 1;

    if (!p._batch_id) {
      p._batch_id = batch_iden++;
    }

    this.path_idmap[p._batch_id] = p;
    this.paths.push(p);
  }

  remove(p) {
    p._batch = undefined;

    if (!this.has(p)) {
      //console.warn("path not in batch", path, this);
      return;
    }

    this.regen = 1;

    p._batch = undefined;

    this.paths.remove(p);
    delete this.path_idmap[p._batch_id];

    return this;
  }

  destroy() {
    console.warn("destroying batch", this.length);

    for (let p of this.paths) {
      p._batch = undefined;
    }

    this.paths.length = 0;
    this.path_idmap = {};
  }

  has(p) {
    if (!p._batch_id)
      return false;

    return p._batch_id in this.path_idmap;
  }

  gen(draw) {
    console.log(this.gen_req);
    if (this.gen_req-- > 0) {
      return
    }

    this.gen_req = 10;
    this.regen = false;

    let canvas = draw.canvas, g = draw.g;
    console.log("generating batch of size " + this.paths.length);

    let ok = false;
    let min = new Vector2([1e17, 1e17]);
    let max = new Vector2([-1e17, -1e17]);

    let startmat = new Matrix4(draw.matrix);

    let zoom = draw.matrix.$matrix.m11;

    function setMat(p, set_off=false) {
      let mat = new Matrix4();

      if (set_off) {
        mat.translate(-min[0], -min[1], 0.0);
      }
      mat.scale(zoom, -zoom, 1.0);

      draw.push_transform(mat, false);
      return mat;
    }

    for (let p of this.paths) {
      setMat(p);
      p.update_aabb(draw);
      draw.pop_transform();

      min.min(p.aabb[0]);
      max.max(p.aabb[1]);
    }

    let width = ~~(max[0] - min[0]);
    let height = ~~(max[1] - min[1]);
    
    console.log("width/height", width, height);

    let commands = [width, height];

    for (let p of this.paths) {
      setMat(p, true);

      p.gen(draw);
      let c2 = p._commands;

      draw.pop_transform();

      for (let i=0; i<c2.length; i++) {
        commands.push(c2[i]);
      }
    }

    //this._image = undefined;
    //this._image_off = undefined;
    
    let renderid = render_idgen++;
    
    if (commands.length === 0) {
      this.gen_req = 0;
      return;
    }

    //console.log(commands, commands[0], commands[1], commands.length);
    commands = new Float64Array(commands);

    vectordraw_jobs.manager.postRenderJob(renderid, commands).then((data) => {
      console.log("Got render result!", data);
      this.gen_req = 0;

      //this.__image = undefined;
      this._image = data;
      this._image_off = min;
      this._draw_zoom = zoom;
      window.redraw_viewport();
    });
  }

  draw(draw) {
    let canvas = draw.canvas, g = draw.g;
    var zoom = draw.matrix.$matrix.m11; //scale should always be uniform, I think
    let offx = draw.pan[0], offy = draw.pan[1];

    let scale = zoom / this._draw_zoom;
    
    //offx *= scale;
    //offy *= scale;
    //offx = offy = 0.0;
    
    if (this.regen) {
      this.gen(draw);
    }

    if (this._image === undefined) {
      return;
    }
    
    g.imageSmoothingEnabled = false;
    //console.log(this.aabb[0][0], this.aabb[0][1], offx, offy, this.off, this.commands, draw.matrix);
    
    //scale = 1.2;
    //XXX bypass patch methods
    if (g._drawImage != undefined) {
      g.save();

      g._scale(scale, scale);

      g._translate(this._image_off[0], this._image_off[1]);
      g._translate(offx/scale, offy/scale);

      g._drawImage(this._image, 0, 0);

      /*
      g.beginPath();
      g._rect(0, 0, this._image.width, this._image.height);
      g.fillStyle = "rgba(0,255,0,0.4)";
      g.fill();
      //*/
      if (g._resetTransform)
        g._resetTransform();
      else
        g.resetTransform();
    } else {
      g.save();

      g.scale(scale, scale);

      g.translate(this._image_off[0], this._image_off[1]);
      g.translate(offx/scale, offy/scale);

      g.drawImage(this._image, 0, 0);

      /*
      g.beginPath();
      g.rect(0, 0, this._image.width, this._image.height);
      g.fillStyle = "rgba(0,255,0,0.4)";
      g.fill();
      //*/
      g.resetTransform();
    }
  }
}

export class CanvasPath extends QuadBezPath {
  constructor() {
    super();
    
    this.dead = false;
    this.commands = [];
    this.recalc = 1;
    
    this._render_id = render_idgen++;
    this._image = undefined;
    this._image_off = [0, 0];
    
    this.lastx = 0;
    this.lasty = 0;
    
    this.canvas = undefined;
    this.g = undefined;
    
    this.path_start_i = 2;
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
      var arglen = arglens[cmd];
      
      if (fast_mode && prev != BEGINPATH) {
        prev = cmd;
        i += arglen;
        continue;
      }
      
      for (var j=0; j<arglen; j += 2) {
        tmp[0] = cs[i++], tmp[1] = cs[i++];

        if (isNaN(tmp.dot(tmp))) {
          console.warn("NaN!");
          continue;
        }

        tmp.multVecMatrix(draw.matrix);
        
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
  
  closePath() {
    this.path_start_i = this.commands.length;
    this._pushCmd(CLOSEPATH);
  }
  
  undo() { //remove last added path
    //hrm, wonder if I should update the aabb.  I'm thinking not.
    this.commands.length = this.path_start_i;
  }

  _pushCmd() {
    let arglen = arguments.length;
    
    for (let i=0; i<arglen; i++) {
      if (isNaN(arguments[i])) {
        console.warn("NaN!");
      }
      this.commands.push(arguments[i]);
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
    if (this._batch) {
      this._batch.remove(this);
    }

    this.canvas = this.g = undefined;
    this._image = this.commands = undefined;
  }
  
  //renders into another path's canvas
  genInto(draw, path, commands, clip_mode=false) {
    let oldc = this.canvas, oldg = this.g, oldaabb = this.aabb, oldsize = this.size;
    
    //this.canvas = path.canvas;
    //this.g = path.g;
    
    this.aabb = [new Vector2(path.aabb[0]), new Vector2(path.aabb[1])];
    this.size = [path.size[0], path.size[1]];
    
    this.gen_commands(draw, commands, undefined, true);
    //this.gen(draw, undefined, clip_mode);
    
    this.canvas = oldc;
    this.g = oldg;
    this.aabb = oldaabb;
    this.size = oldsize;
  }
  
  gen_commands(draw, commands, _check_tag=0, clip_mode=false) {
    let m = this.matrix.$matrix;
    
    let r = ~~(this.color[0]*255),
      g = ~~(this.color[1]*255),
      b = ~~(this.color[2]*255),
      a = this.color[3];
    
    let commands2 = [];
  
    //commands2 = commands2.concat([OPCODES.SETTRANSFORM, m.m11, m.m12, m.m21, m.m22, m.m41, m.m42]);
    if (!clip_mode) {
      commands2 = commands2.concat([OPCODES.FILLSTYLE, r, g, b, a]);
      commands2 = commands2.concat([OPCODES.SETBLUR, this.blur]);
    }
    
    commands2.push(OPCODES.BEGINPATH);
  
    commands2 = commands2.concat(this.commands);
    commands2.push(clip_mode ? OPCODES.CLIP : OPCODES.FILL);
  
    for (let c of commands2) {
      commands.push(c);
    }
    
    return commands;
  }
  
  gen(draw, _check_tag=0, clip_mode=false, independent=false) {
    if (_check_tag && !this.recalc) {
      console.log("infinite loop in clip stack");
      return;
    }
    
    this.recalc = 0;
    
    var do_clip = this.clip_paths.length > 0;
    var do_blur = this.blur > 0.0;
    
    var zoom = draw.matrix.$matrix.m11; //scale should always be uniform, I think
    
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
    
    if (1) {
      var mat = canvaspath_draw_mat_tmps.next();
      mat.load(draw.matrix);
      this.matrix = mat;
    }

    if (isNaN(w) || isNaN(h)) {
      console.log("NaN path size", w, h, this);
      if (isNaN(w)) w = 4.0;
      if (isNaN(h)) h = 4.0;
    }

    let commands2 = independent ? [w, h] : [];
    let m = this.matrix.$matrix;
    commands2 = commands2.concat([OPCODES.SETTRANSFORM, m.m11, m.m12, m.m21, m.m22, m.m41, m.m42]);
  
    for (var path of this.clip_paths) {
      //console.log("CLIPPING!", path);
      
      if (path.recalc) {
        console.log("   clipping subgen!");
        path.gen(draw, 1);
      }
      
      let oldc = path.canvas, oldg = path.g, oldaabb = path.aabb, oldsize = path.size;
      
      path.genInto(draw, this, commands2, true);
    }
    
    this.gen_commands(draw, commands2, _check_tag, clip_mode);
    commands2 = new Float64Array(commands2);
    
    let renderid = clip_mode ? render_idgen++ : this._render_id;
    
    let imageoff = [this.aabb[0][0], this.aabb[0][1]];
    
    this._commands = commands2;
    commands2.renderid = renderid;
    
    if (independent) {
    //cancel any outstanding jobs
    vectordraw_jobs.manager.cancelRenderJob(renderid);

    //post job
    vectordraw_jobs.manager.postRenderJob(renderid, commands2).then((data) => {
        //console.log("Got render result!", data);

        //this.__image = undefined;
        this._image = data;
        this._image_off = imageoff;
        window.redraw_viewport();
      });
    }
    
    /*
    this.g.save();
    this.g.setTransform(m.m11, m.m12, m.m21, m.m22, m.m41, m.m42);
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
    
    this._image = this.canvas;
    var cs = this.commands, i = 2;
    while (i < cs.length) {
      var cmd = cs[i++];
      var arglen = arglens[cmd];
      
      //console.log(cmd, arglen);
      
      var tmp = canvaspath_draw_args_tmps[arglen];
      
      for (var j=0; j<arglen; j += 2) {
        co[0] = cs[i++], co[1] = cs[i++];
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
        case CUBICTO:
          this.g.bezierCurveTo(tmp[0], tmp[1], tmp[2], tmp[3], tmp[4], tmp[5]);
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
    this.g.restore();

    //*/
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
    
    if (this._image === undefined) {
      return;
    }
    
    g.imageSmoothingEnabled = false;
    //console.log(this.aabb[0][0], this.aabb[0][1], offx, offy, this.off, this.commands, draw.matrix);
    
    //XXX bypass patch methods
    if (g._drawImage != undefined) {
      g._drawImage(this._image, this._image_off[0]+offx, this._image_off[1]+offy);

      g.beginPath();
      g._rect(this._image_off[0]+offx, this._image_off[1]+offy, this._image.width, this._image.height);
      g.rect(this._image_off[0]+offx, this._image_off[1]+offy, this._image.width, this._image.height);
      g.fillStyle = "rgba(0,255,0,0.4)";
      g.fill();
    } else {
      g.drawImage(this._image, this._image_off[0]+offx, this._image_off[1]+offy);

      g.beginPath();
      g.rect(this._image_off[0]+offx, this._image_off[1]+offy, this._image.width, this._image.height);
      g.fillStyle = "rgba(0,255,255,0.4)";
      g.fill();
    }
  }
  
  update() {
    this.recalc = 1;
  }
}

export class Batches extends Array {
  destroy() {
    console.log("destroy batches");

    for (let b of this) {
      b.destroy();
    }

    this.length = 0;
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
    this.batches = new Batches();
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
    this.batches.destroy();

    for (var path of this.paths) {
      path.destroy(this);
    }
  }
  
  draw(g) {
    let batch;

    let blimit = this.paths.length < 15 ? 15 : Math.ceil(this.paths.length / vectordraw_jobs.manager.max_threads);
    console.log("batch limit", blimit);

    if (this.batches.length > 0) {
      batch = this.batches[this.batches.length-1];
    } else {
      batch = new Batch();
      this.batches.push(batch);
    }

    var canvas = g.canvas;
    var off = canvaspath_draw_vs.next();
    
    let zoom = this.matrix.$matrix.m11;

    off.zero(); //load(this.pan).sub(this._last_pan);
    this._last_pan.load(this.pan);

    if (this._last_zoom !== zoom) {
      this._last_zoom = zoom;

      for (let p of this.paths) {
        p.recalc = 1;
      }
    }
    
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

      this.batches.destroy();
      batch = new Batch();
      this.batches.push(batch);
      
      this.dosort = 0;
      this.paths.sort(function(a, b) {
        return a.z - b.z;
      });
    }
    
    for (var path of this.paths) {      
      if (path.hidden) {
        if (path._batch) {
          path._batch.remove(path);
        }

        continue;
      }
      
      if (!path._batch) {
        if (batch.paths.length > blimit) {
          batch = new Batch();
          this.batches.push(batch);
        }

        batch.add(path);
      }

      if (path.recalc && path._batch) {
        path._batch.regen = 1;
      }
      
      window.path1 = path;
      //path.draw(this);
    }

    window.batch = batch;
    window.batches = this.batches;

    console.log(batch.paths.length, batch._batch_id);
    
    for (let batch of this.batches) {
      batch.draw(this);
    }
  }
  
  //set draw matrix
  set_matrix(matrix) {
    super.set_matrix(matrix);
  }
}
