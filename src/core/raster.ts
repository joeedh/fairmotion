"use strict";

//XXX really ancient file, delete

import { IconManager } from "./icon.js";
import * as config from "../config/config.js";

/* A stack of fixed-length number arrays that recycles what it pops, so
   push/pop cycles do not allocate. */
class CacheStack<T extends unknown[] = number[]> extends Array<T> {
  /* Up to 64 popped arrays held for reuse by gen(). */
  dellist: T[];
  /* Length of each array gen() hands out. */
  ilen: number;

  constructor(itemlen: number) {
    super();

    this.dellist = [];
    this.ilen = itemlen;
  }

  pop(): T | undefined {
    var ret = super.pop();

    if (ret !== undefined && this.dellist.length < 64) {
      this.dellist.push(ret);
    }

    return ret;
  }

  clear() {
    var len = this.length;

    /* NOTE: this passed `len` to pop(), which never took an argument. */
    for (var i = 0; i < len; i++) {
      this.pop();
    }
  }

  gen(): T {
    var ret = this.dellist.pop();

    return ret === undefined ? (new Array(this.ilen) as T) : ret;
  }
}

/*this function stores 2d render state *only*.  
  3d transformation stacks and the like should
  be handled where they are needed.*/
/* Was `static` inside RasterState's viewport getter. */
const _viewport_ret = [
  [0, 0],
  [0, 0],
];

export class RasterState {
  pos!: Array<number>;
  iconsheet!: IconManager;
  iconsheet16!: IconManager;
  /* Each viewport entry is a [pos, size] pair; each scissor entry is a flat
     [x, y, w, h] rect. */
  viewport_stack!: CacheStack<number[][]>;
  scissor_stack!: CacheStack<number[]>;
  /* AppState hands this the screen's Vector2 straight through. */
  size!: Array<number> | Vector2;
  gl!: WebGLRenderingContext;
  /* [x, y, w, h] of the innermost scissor, or undefined outside one. */
  cur_scissor: Array<number> | undefined;

  /* The body is unreachable, so `gl` is never touched; AppState builds one of
     these before it has a context. */
  constructor(gl: WebGLRenderingContext | undefined, size: Array<number> | Vector2) {
    return;

    this.size = size;

    this.pos = [0, 0];

    this.iconsheet = new IconManager(gl, config.ICONPATH + "iconsheet.png", [512, 512], [32, 32]);
    this.iconsheet16 = new IconManager(
      gl,
      config.ICONPATH + "iconsheet16.png",
      [256, 256],
      [16, 16]
    );

    this.viewport_stack = new CacheStack<number[][]>(2);
    this.scissor_stack = new CacheStack<number[]>(4);
  }

  on_gl_lost(gl: WebGLRenderingContext) {
    this.pos = [0, 0];

    this.iconsheet = new IconManager(gl, config.ICONPATH + "iconsheet.png", [512, 512], [32, 32]);
    this.iconsheet16 = new IconManager(
      gl,
      config.ICONPATH + "iconsheet16.png",
      [256, 256],
      [16, 16]
    );
  }

  begin_draw(gl: WebGLRenderingContext, pos: Array<number>, size: Array<number>) {
    this.gl = gl;
    this.pos = pos;
    this.size = size;

    this.viewport_stack.clear();
    this.scissor_stack.clear();
    this.cur_scissor = undefined;
  }

  get viewport() {
    const ret = _viewport_ret;

    //check if we're inside a viewport
    if (this.viewport_stack.length > 0) {
      return this.viewport_stack[this.viewport_stack.length - 1];
    } else {
      //eek! no current viewport.  fallback on global screen size in this case.
      ret[0][0] = ret[0][1] = 0.0;
      ret[1][0] = g_app_state.screen.size[0];
      ret[1][1] = g_app_state.screen.size[1];

      return ret;
    }
  }

  push_viewport(pos: Array<number>, size: Array<number>) {
    var arr = this.viewport_stack.gen();
    arr[0] = pos;
    arr[1] = size;

    this.viewport_stack.push(arr);
    this.pos = pos;
    this.size = size;
  }

  pop_viewport() {
    /* NOTE: this passed an index to pop(), which never took one. */
    var ret = this.viewport_stack.pop();

    if (ret === undefined) {
      /* Popping an empty stack used to throw on the next line. */
      return undefined;
    }

    this.pos = ret[0];
    this.size = ret[1];

    return ret;
  }

  push_scissor(pos: Array<number>, size: Array<number>) {
    var rect;
    var gl = this.gl;

    if (this.cur_scissor == undefined) {
      rect = this.scissor_stack.gen();
      var size2 = g_app_state.screen.size;

      rect[0] = 0;
      rect[1] = 0;
      rect[2] = size2[0];
      rect[3] = size2[1];
    } else {
      rect = this.scissor_stack.gen();
      for (var i = 0; i < 4; i++) {
        rect[i] = this.cur_scissor[i];
      }
    }

    this.scissor_stack.push(rect);

    if (this.cur_scissor == undefined) {
      this.cur_scissor = [pos[0], pos[1], size[0], size[1]];
    } else {
      var cur = this.cur_scissor;
      cur[0] = pos[0];
      cur[1] = pos[1];
      cur[2] = size[0];
      cur[3] = size[1];
    }
  }

  pop_scissor() {
    var rect = this.scissor_stack.pop();

    if (rect === undefined) {
      /* Popping an empty stack used to throw below. */
      return;
    }

    var cur = this.cur_scissor;

    if (cur == undefined) {
      cur = [rect[0], rect[1], rect[2], rect[3]];
    } else {
      cur[0] = rect[0];
      cur[1] = rect[1];
      cur[2] = rect[2];
      cur[3] = rect[3];
    }

    this.cur_scissor = cur;
  }

  reset_scissor_stack() {
    this.scissor_stack.clear();
    this.cur_scissor = undefined;
  }
}
