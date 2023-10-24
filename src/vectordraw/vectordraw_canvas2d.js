"use strict";

/* advanced batch based system with caching */

import * as config from '../config/config.js';
import * as util from '../path.ux/scripts/util/util.js';

import {
  MinMax
} from '../util/mathlib.js';
import * as math from '../path.ux/scripts/util/math.js'

import {
  VectorFlags, VectorVertex, PathBase,
  VectorDraw
} from './vectordraw_base.js';

import {OPCODES} from './vectordraw_jobs_base.js';
import * as vectordraw_jobs from './vectordraw_jobs.js';

let debug = 0;

const canvaspath_draw_mat_tmps = util.cachering.fromConstructor(Matrix4, 16);
const canvaspath_draw_args_tmps = new Array(16);
for (let i = 1; i < canvaspath_draw_args_tmps.length; i++) {
  canvaspath_draw_args_tmps[i] = new Array(i);
}
const canvaspath_draw_vs = util.cachering.fromConstructor(Vector2, 32);

const MOVETO = OPCODES.MOVETO, BEZIERTO = OPCODES.QUADRATIC, LINETO = OPCODES.LINETO, BEGINPATH = OPCODES.BEGINPATH,
      CUBICTO                                                                                   = OPCODES.CUBIC, CLOSEPATH                                                        = OPCODES.CLOSEPATH, LINEWIDTH = OPCODES.LINEWIDTH,
      LINESTYLE                                                                                 = OPCODES.LINESTYLE, STROKE                                                     = OPCODES.STROKE, FILL = OPCODES.FILL;

let arglens = {};

arglens[FILL] = 0;
arglens[STROKE] = 0;
arglens[LINEWIDTH] = 1;
arglens[LINESTYLE] = 4;
arglens[BEGINPATH] = 0;
arglens[CLOSEPATH] = 0;
arglens[MOVETO] = 2;
arglens[LINETO] = 2;
arglens[BEZIERTO] = 4;
arglens[CUBICTO] = 6;

let render_idgen = 1;
let batch_iden = 1;

export class CachedF64Array {
  array = [];
  f64array = undefined;

  constructor() {
    this.array = [];
    this.f64array;
  }

  reset() {
    this.array.length = 0;
    return this.array;
  }

  finish() {
    if (!this.f64array || this.f64array.length < this.array.length) {
      this.f64array = new Float64Array(this.array.length);
    }

    const f64array = this.f64array;
    const array = this.array;
    for (let i = 0; i < this.array.length; i++) {
      this.f64array[i] = array[i];
    }

    if (this.f64array.length === this.array.length) {
      return this.f64array;
    }

    return new Float64Array(this.f64array.buffer, 0, this.array.length);
  }
}

export class Batch {
  generation: number
  path_idmap: Object
  isBlurBatch: boolean
  regen: number
  gen_req: number
  _last_pan: Vector2
  viewport: Object
  realViewport: Object
  patharea: number;
  dpi_scale: number;
  _commands: CachedF64Array;

  constructor() {
    this._batch_id = batch_iden++;

    this._commands = new CachedF64Array();
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
      size: [1, 1]
    };

    this.realViewport = {
      pos : [0, 0],
      size: [1, 1]
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

  add(p: CanvasPath) {
    if (this.has(p)) {
      return;
    }

    this.generation = 0;

    let draw = {
      matrix: new Matrix4()
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

  remove(p: CanvasPath) {
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

    if (window._DEBUG.drawbatches) {
      console.warn("destroying batch", this.length);
    }

    for (let p of this.paths) {
      p._batch = undefined;
    }

    this.paths.length = 0;
    this.path_idmap = {};

    this.regen = 1;
    this.gen_req = 0;
  }

  has(p: CanvasPath) {
    if (!p._batch_id)
      return false;

    return p._batch_id in this.path_idmap;
  }

  checkViewport(draw: CanvasDraw2D) {
    let canvas = draw.canvas;
    //let cv = this._getPaddedViewport(canvas);

    let p = new Vector2(draw.pan);

    p[1] = draw.canvas.height - p[1];
    p.sub(this._last_pan);

    let cv = {
      pos : new Vector2(),
      size: new Vector2([canvas.width, canvas.height])
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

  _getPaddedViewport(canvas, cpad = 512) {
    let dpi_scale = canvas.dpi_scale*this.dpi_scale;
    cpad /= dpi_scale;

    return {
      pos : new Vector2([-cpad, -cpad]),
      size: new Vector2([canvas.width*canvas.dpi_scale + cpad*2, canvas.height*canvas.dpi_scale + cpad*2])
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

    let min = new Vector2([1e17, 1e17]);
    let max = new Vector2([-1e17, -1e17]);

    let zoom = draw.matrix.$matrix.m11;

    function setMat(p, set_off = false) {
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
      let mat = setMat(p);

      //p.round(draw.matrix);

      p.update_aabb(draw);
      draw.pop_transform();

      min.min(p.aabb[0]);
      max.max(p.aabb[1]);
    }

    this.realViewport = {
      pos : new Vector2(min),
      size: new Vector2(max).sub(min)
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
      pos : new Vector2(box.pos),
      size: new Vector2(box.size)
    }

    let width = ~~(max[0] - min[0]);
    let height = ~~(max[1] - min[1]);

    //console.log("width/height", width, height);

    let commands = this._commands.reset();
    commands.push(width);
    commands.push(height);

    for (let p of this.paths) {
      setMat(p, true);

      if (1 || !p._commands || p.recalc) {
        p.genSmart(draw);
      }

      let c2 = p._commands;

      draw.pop_transform();

      for (let i = 0; i < c2.length; i++) {
        commands.push(c2[i]);
      }
    }

    if (this.isBlurBatch) {
      draw.pop_transform();
    }

    //this._image = undefined;
    //this._image_off = undefined;

    let renderid = render_idgen++;

    if (commands.length < 3) {
      this.gen_req = 0;
      return;
    }

    //console.log(commands, commands[0], commands[1], commands.length);
    commands = this._commands.finish();

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
    if (this.paths.length === 0) {
      return;
    }

    if (!this.regen && this.checkViewport(draw) && !this.gen_req) {
      this.regen = 1;
      console.log("bad viewport");
    }

    let canvas = draw.canvas, g = draw.g;
    let zoom = draw.matrix.$matrix.m11; //scale should always be uniform, I think
    let offx = 0, offy = 0;

    let scale = zoom/this._draw_zoom;

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
let last_print_time = util.time_ms();

export class CanvasPath extends PathBase {
  dead: boolean
  recalc: number
  _image_off: Array<number>
  lastx: number
  lasty: number
  _size2: Vector2
  path_start_i: number
  first: boolean
  z: number
  nofill: boolean;
  _mm: MinMax;
  matrix: Matrix4;

  constructor() {
    super();

    this.z = 0;

    this.nofill = false;

    this.dead = false;
    this.commands = [];
    this.recalc = 1;
    this.stroke_extra = 0;

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
    this.matrix = new Matrix4();
  }

  pushFill() {
    this._pushCmd(FILL);
  }

  pushStroke(color, width) {
    if (color) {
      let a = color.length > 3 ? color[3] : 1.0;
      this._pushCmd(LINESTYLE, ~~(color[0]*255), ~~(color[1]*255), ~~(color[2]*255), a);
    }

    if (width !== undefined) {
      this.stroke_extra = Math.max(this.stroke_extra, width);
      this._pushCmd(LINEWIDTH, width);
    }

    this._pushCmd(STROKE);
  }

  noAutoFill() {
    this.nofill = true;
  }

  update_aabb(draw, fast_mode = false) {
    let tmp = canvaspath_temp_vs.next().zero();
    let mm = this._mm;
    let pad = this.pad = this.blur > 0 ? this.blur + 15 : 0;
    pad += this.stroke_extra*3;

    mm.reset();

    if (fast_mode) {
      //console.trace("FAST MODE!");
    }

    let prev = -1;
    let cs = this.commands, i = 0;
    while (i < cs.length) {
      let cmd = cs[i++];
      let arglen = arglens[cmd];

      if (fast_mode && prev !== BEGINPATH) {
        prev = cmd;
        i += arglen;
        continue;
      }

      if (cmd !== OPCODES.LINETO && cmd !== OPCODES.MOVETO && cmd !== OPCODES.CUBIC && cmd !== OPCODES.QUADRATIC && cmd !== OPCODES.ARC) {
        i += arglen;
        continue;
      }

      for (let j = 0; j < arglen; j += 2) {
        tmp[0] = cs[i++];
        tmp[1] = cs[i++];

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

    for (let i = 0; i < arglen; i++) {
      if (isNaN(arguments[i])) {
        console.warn("NaN!");
      }

      let arg = arguments[i];
      this.commands.push(arg);
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
  genInto(draw, path, commands, clip_mode = false) {
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

  gen_commands(draw, commands, _check_tag = 0, clip_mode = false) {
    let r = ~~(this.color[0]*255),
        g = ~~(this.color[1]*255),
        b = ~~(this.color[2]*255),
        a = this.color[3];

    if (!clip_mode) {
      commands.push(OPCODES.FILLSTYLE);
      commands.push(r);
      commands.push(g);
      commands.push(b);
      commands.push(a);
      commands.push(OPCODES.SETBLUR);
      commands.push(this.blur);
    }

    commands.push(OPCODES.BEGINPATH);

    for (let cmd of this.commands) {
      commands.push(cmd);
    }

    if (clip_mode) {
      commands.push(OPCODES.CLIP);
    } else if (!this.nofill) {
      commands.push(OPCODES.FILL);
    }

    return commands;
  }

  round(matrix) {
    let co = new Vector2();
    let imat = new Matrix4(matrix);
    imat.invert();

    //*
    let cs = this.commands;

    for (let i = 0; i < cs.length; i += cs[i + 1]) {
      let cmd = cs[i];

      if (cmd !== LINETO && cmd !== MOVETO && cmd !== CUBICTO && cmd !== BEZIERTO) {
        continue;
      }

      let arglen = arglens[cmd];

      for (let j = 0; j < arglen; j += 2) {
        let j2 = i + 1 + j;
        let d = 1.0;

        if (j2 >= cs.length - 1 || j + 1 >= arglen) {
          break;
        }

        co[0] = cs[j2];
        co[1] = cs[j2 + 1];

        co.multVecMatrix(matrix);
        co.mulScalar(d);
        co.addScalar(0.5);
        co.floor();
        co.mulScalar(1.0/d);
        co.multVecMatrix(imat);

        cs[j2] = co[0];
        cs[j2 + 1] = co[1];
      }
    }
    //*/
  }

  get recalc() {
    return this.__recalc;
  }

  set recalc(v) {
    if (v) {
      this._commands = undefined;
    }

    if (0) {
      if (util.time_ms() - last_print_time > 150) {
        last_print_time = util.time_ms();
        console.warn("recalc", v);
      }
    }

    this.__recalc = v;
  }

  /* Attempts to avoid regenerating the final command list.*/
  genSmart(draw) {
    if (!this._commands || this.recalc) {
      return this.gen(draw);
    }

    this.matrix.load(draw.matrix);

    /* Find initial matrix opcode. */

    let trans_i = -1;
    let cmds = this._commands;
    for (let i = 0; i < cmds.length; i++) {
      if (cmds[i] === OPCODES.SETTRANSFORM) {
        trans_i = i;
        break;
      }
    }

    if (trans_i === -1) {
      console.error("Failed to find SETTRANSFORM");
      return this.gen(draw);
    }

    /* Update matrix data. */

    let m = this.matrix.$matrix;
    let i = trans_i + 1;
    cmds[i++] = m.m11;
    cmds[i++] = m.m12;
    cmds[i++] = m.m21;
    cmds[i++] = m.m22;
    cmds[i++] = m.m41;
    cmds[i++] = m.m42;
  }

  gen(draw, _check_tag = 0, clip_mode = false, independent = false) {
    if (_check_tag && !this.recalc) {
      console.log("infinite loop in clip stack");
      return;
    }

    this.recalc = 0;

    this.update_aabb(draw);

    let w = this.size[0] = Math.ceil(this.aabb[1][0] - this.aabb[0][0]);
    let h = this.size[1] = Math.ceil(this.aabb[1][1] - this.aabb[0][1]);

    if (w > config.MAX_CANVAS2D_VECTOR_CACHE_SIZE || h > config.MAX_CANVAS2D_VECTOR_CACHE_SIZE) {
      let w2 = Math.min(w, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
      let h2 = Math.min(h, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
      let dw = w - w2, dh = h - h2;

      this.aabb[0][0] += dw*0.5;
      this.aabb[0][1] += dh*0.5;
      this.aabb[1][0] -= dw*0.5;
      this.aabb[1][1] -= dh*0.5;

      this.size[0] = w2;
      this.size[1] = h2;

      w = w2, h = h2;
    }

    this.matrix.load(draw.matrix);

    if (isNaN(w) || isNaN(h)) {
      console.log("NaN path size", w, h, this);
      if (isNaN(w)) w = 4.0;
      if (isNaN(h)) h = 4.0;
    }

    let commands2 = independent ? [w, h] : [];
    let m = this.matrix.$matrix;
    //commands2 = commands2.concat([OPCODES.SETTRANSFORM, m.m11, m.m12, m.m21, m.m22, m.m41, m.m42]);
    commands2.push(OPCODES.SETTRANSFORM);
    commands2.push(m.m11);
    commands2.push(m.m12);
    commands2.push(m.m21);
    commands2.push(m.m22);
    commands2.push(m.m41);
    commands2.push(m.m42);

    commands2.push(OPCODES.SAVE);

    for (let path of this.clip_paths) {
      //console.log("CLIPPING!", path);

      if (path.recalc) {
        if (debug) console.log("   clipping subgen!");
        path.gen(draw, 1);
      }

      let oldc = path.canvas, oldg = path.g, oldaabb = path.aabb, oldsize = path.size;

      path.genInto(draw, this, commands2, true);
    }

    this.gen_commands(draw, commands2, _check_tag, clip_mode);
    commands2.push(OPCODES.RESTORE);

    this._commands = commands2;
  }

  reset(draw) {
    this.stroke_extra = 0;
    this.commands.length = 0;
    this.path_start_i = 0;
    this.off.zero();
    this.first = true;
  }

  draw(draw, offx = 0, offy = 0, canvas = draw.canvas, g = draw.g) {
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

    g.drawImage(this._image, this._image_off[0] + offx, this._image_off[1] + offy);

    g.beginPath();
    g.rect(this._image_off[0] + offx, this._image_off[1] + offy, this._image.width, this._image.height);
    g.rect(this._image_off[0] + offx, this._image_off[1] + offy, this._image.width, this._image.height);
    g.fillStyle = "rgba(0,255,0,0.4)";
    g.fill();
  }

  update() {
    this.recalc = 1;
  }
}

export class Batches extends Array {
  cur: number;

  constructor() {
    super();

    this.cur = 0;
    this.drawlist = [];
  }

  getHead(onBatchDone) {
    if (this.drawlist.length > 0) {
      return this.drawlist[this.drawlist.length - 1];
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

      this.drawlist.push(this[this.length - 1]);
      ret = this[this.length - 1];
    }

    ret.isBlurBatch = false;
    return ret;
  }

  remove(batch) {
    let i = this.indexOf(batch);

    this.drawlist.remove(batch);

    if (this.cur > 0 && this.cur < this.length - 1) {
      let j = this.cur - 1;

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
  path_idmap: Object
  dosort: boolean
  matstack: Array
  matrix: Matrix4
  _last_pan: Vector2
  batches: Batches;

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

    for (let i = 0; i < this.matstack.length; i++) {
      this.matstack[i] = new Matrix4();
    }
    this.matstack.cur = 0;

    this.canvas = undefined;
    this.g = undefined;
    this.batches = new Batches();
    this.onBatchDone = this.onBatchDone.bind(this);
  }

  onBatchDone(batch: Batch) {
    let ok = true;
    for (let b of this.batches.drawlist) {
      if (b.pending) {
        ok = false;
      }
    }

    if (ok && this.promise) {
      this.promise = undefined;
      //console.log("Draw finished!");
      this.on_batches_finish();
    }
  }

  has_path(id: number, z: number, check_z: boolean = true): boolean {
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
  get_path(id: number, z: number, check_z: boolean = true): CanvasPath {
    if (z === undefined) {
      throw new Error("z cannot be undefined");
    }

    if (!(id in this.path_idmap)) {
      this.path_idmap[id] = new CanvasPath();
      this.path_idmap[id].index = this.paths.length;
      this.path_idmap[id].id = id;

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
    for (let path of this.paths) {
      path.update(this);
    }
  }

  destroy() {
    this.batches.destroy();

    for (let path of this.paths) {
      path.destroy(this);
    }
  }

  set regen(v) {
    this.__regen = v;
    //console.warn("regen");
  }

  get regen() {
    return this.__regen;
  }

  clear() {
    this.recalcAll();
  }

  draw(g) {
    if (!!this.do_blur !== !!this._last_do_blur) {
      this._last_do_blur = !!this.do_blur;
      this.regen = 1;

      window.setTimeout(() => {
        window.redraw_viewport();
      }, 200);
    }

    if (this.regen) {
      if (window._DEBUG.trace_recalc_all) {
        console.log("RECALC ALL");
      }

      this.__regen = 0;

      this.batches.destroy();
      //this.update();
    }

    let batch;

    let blimit = this.paths.length < 15 ? 15 : Math.ceil(this.paths.length/vectordraw_jobs.manager.max_threads);
    //console.log("batch limit", blimit);

    batch = this.batches.getHead(this.onBatchDone);

    let canvas = g.canvas;
    let off = canvaspath_draw_vs.next();

    let zoom = this.matrix.$matrix.m11;

    off.zero(); //load(this.pan).sub(this._last_pan);
    this._last_pan.load(this.pan);

    if (this._last_zoom !== zoom) {
      this._last_zoom = zoom;

      for (let p of this.paths) {
        //XXX p.recalc = 1;
      }
    }

    //propagate clip users (once)
    for (let path of this.paths) {
      if (!path.recalc) {
        continue;
      }

      for (let path2 of path.clip_users) {
        path2.recalc = 1;
      }
    }

    for (let path of this.paths) {
      if (!path.recalc) {
        path.off.add(off);
      }
    }

    this.canvas = canvas;
    this.g = g;

    if (this.dosort) {
      if (debug) console.log("SORT");

      this.batches.destroy();

      this.dosort = 0;
      for (let p of this.paths) {
        p._batch = undefined;
      }

      this.paths.sort(function (a, b) {
        return a.z - b.z;
      });

      batch = this.batches.getHead(this.onBatchDone);
    }

    for (let path of this.paths) {
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
        let w1 = batch.patharea/(canvas.width*canvas.height);
        let w2 = this.batches.length > 10 ? 1.0/(this.batches.length - 9) : 0.0;

        if (needsblur) {
          if (!batch.isBlurBatch) {
            batch = this.batches.requestBatch(this.onBatchDone);
            batch.isBlurBatch = true;
            batch.dpi_scale = path.blur*zoom > 50 ? 0.1 : 0.25;
          } else {
            let scale = path.blur*zoom > 50 ? 0.1 : 0.25;
            batch.dpi_scale = Math.min(batch.dpi_scale, scale);
          }
        } else if (batch.isBlurBatch || (batch.paths.length*(1.0 + w1*4.0) > blimit)) {
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
