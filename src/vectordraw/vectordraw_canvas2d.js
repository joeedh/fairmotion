"use strict";

import * as config from '../config/config.js';
import * as util from '../path.ux/scripts/util/util.js';

import {
  MinMax
} from '../util/mathlib.js';
import * as math from '../path.ux/scripts/util/math.js'

import {
  VectorFlags, VectorVertex, QuadBezPath,
  VectorDraw
} from './vectordraw_base.js';

import {OPCODES} from './vectordraw_jobs_base.js';
import * as vectordraw_jobs from './vectordraw_jobs.js';

let debug = 0;

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
  generation : number
  path_idmap : Object
  isBlurBatch : boolean
  regen : number
  gen_req : number
  _last_pan : Vector2
  viewport : Object
  realViewport : Object
  patharea : number;
  dpi_scale : number;

  constructor() {
    this._batch_id = batch_iden++;

    this.generation = 0;
    this.isBlurBatch = false;
    this.dpi_scale = 1.0;

    this.paths = [];
    this.path_idmap = {};
    this.regen = 1;
    this.gen_req = 0;

    this._last_pan = new Vector2();

    this.viewport = {
      pos : [0, 0],
      size : [1, 1]
    };

    this.realViewport = {
      pos : [0, 0],
      size : [1, 1]
    }

    this.patharea = 0;
  }

  set regen(v) {
    this._regen = v;

    if (debug && v) {
      console.warn("Regen called");
    }
  }

  get regen() {
    return this._regen;
  }

  add(p : CanvasPath) {
    if (this.has(p)) {
      return;
    }

    this.generation = 0;

    let draw = {
      matrix : new Matrix4()
    }
    p.update_aabb(draw);

    let min = p.aabb[0], max = p.aabb[1];
    if (p.blur > 0) {
      min.addScalar(-p.blur*0.5);
      max.addScalar(p.blur*0.5);
    }
    let w = max[0] - min[0];
    let h = max[1] - min[1];

    this.patharea += w*h;

    p._batch = this;

    this.regen = 1;

    if (!p._batch_id) {
      p._batch_id = batch_iden++;
    }

    this.path_idmap[p._batch_id] = p;
    this.paths.push(p);
  }

  remove(p : CanvasPath) {
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
    this.patharea = 0;
    console.warn("destroying batch", this.length);

    for (let p of this.paths) {
      p._batch = undefined;
    }

    this.paths.length = 0;
    this.path_idmap = {};

    this.regen = 1;
    this.gen_req = 0;
  }

  has(p : CanvasPath) {
    if (!p._batch_id)
      return false;

    return p._batch_id in this.path_idmap;
  }

  checkViewport(draw : CanvasDraw2D) {
    let canvas = draw.canvas;
    //let cv = this._getPaddedViewport(canvas);

    let p = new Vector2(draw.pan);

    p[1] = draw.canvas.height - p[1];
    p.sub(this._last_pan);

    let cv = {
      pos  : new Vector2(),
      size : new Vector2([canvas.width, canvas.height])
    };

    cv.pos[0] -= p[0];
    cv.pos[1] -= p[1];
    
    let clip1 = math.aabb_intersect_2d(this.viewport.pos, this.viewport.size, cv.pos, cv.size);
    let clip2 = math.aabb_intersect_2d(this.realViewport.pos, this.realViewport.size, cv.pos, cv.size);

    const debug = 0;

    if (debug) {
      console.log("\n===\n");
      console.log("dpan:", p);
      console.log(cv.pos, cv.size);

      if (clip1) console.log("clip1", clip1.pos, clip1.size);
      if (clip2) console.log("clip2", clip2.pos, clip2.size);
    }

    if (!clip1 || !clip2) {
      if (debug) {
        console.log("clip is bad 1:", clip1, clip2, !!clip1 !== !!clip2);
      }
      return !!clip1 !== !!clip2;
    }
    
    clip1.pos.floor();
    clip1.size.floor();
    clip2.pos.floor();
    clip2.size.floor();

    let bad = clip1.pos.vectorDistance(clip2.pos) > 2;
    bad = bad || clip1.size.vectorDistance(clip2.size) > 2;

    if (debug) {
      console.log("clip is bad 2:", bad);
    }

    return bad;
  }

  _getPaddedViewport(canvas, cpad=512) {
    let dpi_scale = canvas.dpi_scale * this.dpi_scale;
    cpad /= dpi_scale;

    return {
      pos  : new Vector2([-cpad, -cpad]),
      size : new Vector2([canvas.width*canvas.dpi_scale + cpad*2, canvas.height*canvas.dpi_scale + cpad*2])
    }
  }

  gen(draw) {
    if (this.gen_req-- > 0) {
      return
    }


    this.gen_req = 10;
    this.regen = false;

    if (this.isBlurBatch) {
      let matrix = new Matrix4(draw.matrix);

      matrix.scale(this.dpi_scale, this.dpi_scale);
      draw.push_transform(matrix, false);
    }

    let canvas = draw.canvas, g = draw.g;
    if (debug) console.warn("generating batch of size " + this.paths.length);

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

      let m = new Matrix4(draw.matrix);
      mat.multiply(m);

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

    this.realViewport = {
      pos : new Vector2(min),
      size : new Vector2(max).sub(min)
    }

    //clip to something reasonably close to the viewport
    let min2 = new Vector2(min);
    let size2 = new Vector2(max);
    size2.sub(min2);
    //min2.add(draw.pan);

    let cpad = 512;

    let cv = this._getPaddedViewport(canvas, cpad);
    let box = math.aabb_intersect_2d(min2, size2, cv.pos, cv.size);

    min2 = min2.floor();
    size2 = size2.floor();
    //console.log(min2, size2, canvas.width, canvas.height);
    //console.log("ISECT", box);

    if (!box) {
      if (this.isBlurBatch) {
        draw.pop_transform();
      }
      return;
    }

    //box.pos.sub(draw.pan);

    //console.warn("CV", cv.pos, cv.size, "=>", min2, size2, "=>", box.pos, box.size);

    min.load(box.pos);
    max.load(min).add(box.size);

    this.viewport = {
      pos  : new Vector2(box.pos),
      size : new Vector2(box.size)
    }

    let width = ~~(max[0] - min[0]);
    let height = ~~(max[1] - min[1]);
    
    //console.log("width/height", width, height);

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

    if (this.isBlurBatch) {
      draw.pop_transform();
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

    min = new Vector2(min);

    let last_pan = new Vector2(draw.pan);
    last_pan[1] = draw.canvas.height - last_pan[1];

    this.pending = true;

    vectordraw_jobs.manager.postRenderJob(renderid, commands).then((data) => {
      this.pending = false;

      if (this.onRenderDone) {
        this.onRenderDone(this);
      }

      if (debug) console.warn("Got render result!");
      this.gen_req = 0;

      this._last_pan.load(last_pan);

      //this.__image = undefined;
      this._image = data;
      this._image_off = min;
      this._draw_zoom = zoom;
      window.redraw_viewport();
    });
  }

  draw(draw) {
    if (!this.regen && this.checkViewport(draw) && !this.gen_req) {
      this.regen = 1;
      console.log("bad viewport");
    }

    let canvas = draw.canvas, g = draw.g;
    var zoom = draw.matrix.$matrix.m11; //scale should always be uniform, I think
    let offx = 0, offy = 0;

    let scale = zoom / this._draw_zoom;

    //let viewport = this.realViewport;

    offx = draw.pan[0] - this._last_pan[0]*scale;
    offy = (draw.canvas.height - draw.pan[1]) - this._last_pan[1]*scale;
    offx /= scale;
    offy /= scale;

    //window.pan = [draw.pan[0], draw.pan[1]]

    if (this.regen) {
      this.pending = true;
      this.gen(draw);
    }

    if (this._image === undefined) {
      return;
    }
    
    g.imageSmoothingEnabled = !!this.isBlurBatch;

    //console.log(this.aabb[0][0], this.aabb[0][1], offx, offy, this.off, this.commands, draw.matrix);

    if (this.paths.length === 0 && this.generation > 2) {
      this._image = undefined;
      return;
    }

    if (this.generation > 0) {
      this.generation++;
    }

    //scale = 1.2;
    //XXX bypass patch methods
    g.save();

    g.scale(scale, scale);

    g.translate(offx, offy);

    g.translate(this._image_off[0], this._image_off[1]);
    g.drawImage(this._image, 0, 0);

    /*
    g.beginPath();
    g.rect(0, 0, this._image.width, this._image.height);
    g.fillStyle = "rgba(0,255,0,0.4)";
    g.fill();
    //*/

    g.restore();
    /*
    if (g.resetTransform)
      g.resetTransform();
    else
      g.resetTransform();
    //*/
  }
}

let canvaspath_temp_vs = util.cachering.fromConstructor(Vector2, 512);
let canvaspath_temp_mats = util.cachering.fromConstructor(Matrix4, 128);

export class CanvasPath extends QuadBezPath {
  dead : boolean
  recalc : number
  _image_off : Array<number>
  lastx : number
  lasty : number
  _size2 : Vector2
  path_start_i : number
  first : boolean
  _mm : MinMax;

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

    this._aabb2 = [new Vector2(), new Vector2()];
    this._size2 = new Vector2();

    this.canvas = undefined;
    this.g = undefined;
    
    this.path_start_i = 2;
    this.first = true;
    this._mm = new MinMax(2);
  }
  
  update_aabb(draw, fast_mode=false) {
    var tmp = canvaspath_temp_vs.next().zero();
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
      
      if (fast_mode && prev !== BEGINPATH) {
        prev = cmd;
        i += arglen;
        continue;
      }
      
      for (var j=0; j<arglen; j += 2) {
        tmp[0] = cs[i++]; tmp[1] = cs[i++];

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

    this.aabb = this._aabb2;
    this.aabb[0].load(path.aabb[0]);
    this.aabb[1].load(path.aabb[1]);

    this.size = this._size2;
    this.size.load(path.size);
    
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
        if (debug) console.log("   clipping subgen!");
        path.gen(draw, 1);
      }
      
      let oldc = path.canvas, oldg = path.g, oldaabb = path.aabb, oldsize = path.size;
      
      path.genInto(draw, this, commands2, true);
    }
    
    this.gen_commands(draw, commands2, _check_tag, clip_mode);
    this._commands = commands2;
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
    
    g.drawImage(this._image, this._image_off[0]+offx, this._image_off[1]+offy);

    g.beginPath();
    g.rect(this._image_off[0]+offx, this._image_off[1]+offy, this._image.width, this._image.height);
    g.rect(this._image_off[0]+offx, this._image_off[1]+offy, this._image.width, this._image.height);
    g.fillStyle = "rgba(0,255,0,0.4)";
    g.fill();
  }
  
  update() {
    this.recalc = 1;
  }
}

export class Batches extends Array {
  cur : number;

  constructor() {
    super();

    this.cur = 0;
    this.drawlist = [];
  }

  getHead(onBatchDone) {
    if (this.drawlist.length > 0) {
      return this.drawlist[this.drawlist.length-1];
    }

    return this.requestBatch(onBatchDone);
  }

  requestBatch(onrenderdone) {
    let ret;

    if (this.cur < this.length) {
      this.drawlist.push(this[this.cur]);

      ret = this[this.cur++];
    } else {
      let b = new Batch();
      b.onRenderDone = onrenderdone;

      this.cur++;
      this.push(b);

      this.drawlist.push(this[this.length-1]);
      ret = this[this.length-1];
    }

    ret.isBlurBatch = false;
    return ret;
  }

  remove(batch) {
    let i = this.indexOf(batch);

    this.drawlist.remove(batch);

    if (this.cur > 0 && this.cur < this.length-1) {
      let j = this.cur-1;

      this[i] = this[j];
      this.cur--;
    }
  }


  destroy() {
    this.drawlist.length = 0;
    this.cur = 0;

    if (debug) console.log("destroy batches");

    for (let b of list(this)) {
      if (b.generation > 1) {
        super.remove(b);
      }

      b.generation++;
      b.destroy();
    }
  }
}

export class CanvasDraw2D extends VectorDraw {
  path_idmap : Object
  dosort : boolean
  matstack : Array
  matrix : Matrix4
  _last_pan : Vector2
  batches : Batches;

  constructor() {
    super();

    this.promise = undefined;
    this.on_batches_finish = undefined;

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
    this.onBatchDone = this.onBatchDone.bind(this);
  }

  onBatchDone(batch) {
    let ok = true;
    for (let b of this.batches.drawlist) {
      if (b.pending) {
        ok = false;
      }
    }

    if (ok && this.promise) {
      this.promise = undefined;
      console.log("Draw finished!");
      this.on_batches_finish();
    }
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
    
    if (check_z && ret.z !== z) {
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

  set regen(v) {
    this.__regen = v;
    console.warn("regen");
  }

  get regen() {
    return this.__regen;
  }

  draw(g) {
    if (!!this.do_blur !== this._last_do_blur) {
      this._last_do_blur = !!this.do_blur;
      this.regen = 1;

      window.setTimeout(() => {
        window.redraw_viewport();
      }, 200);
    }

    if (this.regen) {
      this.__regen = 0;

      this.batches.destroy();
      this.update();
    }

    let batch;

    let blimit = this.paths.length < 15 ? 15 : Math.ceil(this.paths.length / vectordraw_jobs.manager.max_threads);
    //console.log("batch limit", blimit);

    batch = this.batches.getHead(this.onBatchDone);

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
      if (debug) console.log("SORT");

      this.batches.destroy();
      batch = this.batches.requestBatch(this.onBatchDone);

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

      let blurlimit = 25;
      let needsblur = this.do_blur && (path.blur*zoom >= blurlimit);
      needsblur = needsblur && path.clip_paths.length === 0;

      if (needsblur && path._batch && !path._batch.isBlurBatch) {
        this.regen = 1;
      }

      if (!needsblur && path._batch && path._batch.isBlurBatch) {
        this.regen = 1;
      }

      if (!path._batch) {
        let w1 = batch.patharea / (canvas.width*canvas.height);
        let w2 = this.batches.length > 10 ? 1.0 / (this.batches.length - 9) : 0.0;

        if (needsblur) {
          if (!batch.isBlurBatch) {
            batch = this.batches.requestBatch(this.onBatchDone);
            batch.isBlurBatch = true;
            batch.dpi_scale = path.blur*zoom > 50 ? 0.1 : 0.25;
          } else {
            let scale =path.blur*zoom > 50 ? 0.1 : 0.25;
            batch.dpi_scale = Math.min(batch.dpi_scale, scale);
          }
        } else if (batch.isBlurBatch || (batch.paths.length * (1.0 + w1 * 4.0) > blimit)) {
          batch = this.batches.requestBatch(this.onBatchDone);
        }

        batch.add(path);
      }

      if (path.recalc && path._batch) {
        path._batch.regen = 1;
        path.recalc = 0;
      }
      
      window.path1 = path;
      //path.draw(this);
    }

    window.batch = batch;
    window.batches = this.batches;

    //console.log(batch.paths.length, batch._batch_id);
    
    for (let batch of this.batches.drawlist) {
      batch.draw(this);
    }

    if (!this.promise) {
      this.promise = new Promise((accept, reject) => {
        this.on_batches_finish = accept;
      });
    }

    let ok = true;
    for (let b of this.batches) {
      if (b.pending) {
        ok = false;
      }
    }

    if (ok) {
      window.setTimeout(() => {
        this.onBatchDone();
      });
    }

    return this.promise;
  }
  
  //set draw matrix
  set_matrix(matrix) {
    super.set_matrix(matrix);
  }
}
