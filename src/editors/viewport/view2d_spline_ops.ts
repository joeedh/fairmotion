"use strict";

/*** THIS FILE IS OUTDATED AND NO LONGER USED, see ./toolmodes/splinetool.js****/

import { ExtrudeVertOp } from "./spline_createops.js";
import * as spline_selectops from "./spline_selectops.js";
import { WidgetResizeOp, WidgetRotateOp } from "./transform_ops.js";

import { DataTypes } from "../../core/lib_api.js";
import { EditModes } from "./view2d_editor.js";
let EditModes2 = EditModes;

import { KeyMap, HotKey } from "../../core/keymap.js";

import { charmap } from "../events.js";

import { SelectLinkedOp, SelectOneOp } from "./spline_selectops.js";
import { TranslateOp } from "./transform.js";

import { SelMask, ToolModes } from "./selectmode.js";
import { SplineTypes, SplineFlags } from "../../curve/spline_types.js";

import { View2DEditor, SessionFlags } from "./view2d_editor.js";
import { DataBlock } from "../../core/lib_api.js";
import { redraw_element } from "../../curve/spline_draw.js";
import { UndoFlags, ToolFlags, ModalStates, ToolOp, ToolMacro } from "../../core/toolops_api.js";

import { get_vtime } from "../../core/animdata.js";

import {
  DeleteVertOp,
  DeleteSegmentOp,
  DeleteFaceOp,
  ChangeFaceZ,
  SplitEdgeOp,
  DuplicateOp,
  DisconnectHandlesOp,
  SplitEdgePickOp,
} from "./spline_editops.js";
import type { FullContext } from "../../core/context.js";
import type { View2DHandler } from "./view2d.js";
import type { Spline } from "../../curve/spline.js";
import type { ToolModeHit } from "./toolmodes/toolmode.js";
import type { RowFrame } from "../../path.ux/scripts/core/ui.js";
/* PackFlags is used bare throughout buildEditMenu(); it was never imported. */
import { PackFlags } from "../../path.ux/scripts/core/ui_base.js";

/* One captured animation frame: the scene time it was taken at and the raw
   pixels of the viewport. */
export type PlaybackFrame = { time: number; data: ImageData };

/* The rectangle of the page the playback code grabs and blits back. */
export type PlaybackViewport = { pos: number[]; size: number[] };

window.anim_to_playback = Object.assign([], { filesize: 0 });

export class DuplicateTransformMacro extends ToolMacro<FullContext> {
  constructor() {
    /* NOTE: ToolMacro's constructor takes no arguments; the name and uiname
       passed here were ignored, and tooldef() supplies both anyway. */
    super();
  }

  static invoke(ctx: FullContext, args: { [k: string]: unknown }) {
    let tool = new DuplicateOp();
    let macro = new DuplicateTransformMacro();

    macro.add(tool);

    /* mpos is a Vector3; TransformOp only ever feeds it to new Vector2(). */
    let mpos = ctx.view2d.mpos;
    let transop = new TranslateOp([mpos[0], mpos[1]], 1 | 2);
    macro.add(transop);

    return macro;
  }

  static tooldef() {
    return {
      uiname     : "Duplicate",
      toolpath   : "spline.duplicate_transform",
      is_modal   : true,
      icon       : Icons.DUPLICATE,
      description: "Duplicate geometry",
    };
  }
}

export class RenderAnimOp extends ToolOp {
  viewport!: PlaybackViewport;
  /* Bounds of the path spline's keys, in frames. */
  min_time!: number;
  max_time!: number;
  /* setInterval handle for the capture loop. */
  timer!: number;

  constructor() {
    super();
  }

  static tooldef() {
    return {
      uiname  : "Render",
      toolpath: "view2d.render_anim",
      is_modal: true,
      inputs  : {},
      outputs : {},
      undoflag: UndoFlags.NO_UNDO,
    };
  }

  start_modal(ctx: FullContext) {
    super.start_modal(ctx);
    console.log("Anim render start!");

    window.anim_to_playback = Object.assign([], { filesize: 0 });

    this.viewport = {
      pos : [ctx.view2d.pos[0], window.innerHeight - (ctx.view2d.pos[1] + ctx.view2d.size[1])],
      size: [ctx.view2d.size[0], ctx.view2d.size[1]],
    };

    window.anim_to_playback.viewport = this.viewport;

    let this2 = this;
    let pathspline = ctx.frameset.pathspline;

    let min_time = 1e17,
      max_time = 0;

    for (let v of pathspline.verts) {
      let time = get_vtime(v);
      min_time = Math.min(min_time, time);
      max_time = Math.max(max_time, time);
    }

    if (min_time < 0) {
      this.end(ctx);
      return;
    }

    ctx.scene.change_time(ctx, min_time);
    this.min_time = min_time;
    this.max_time = max_time;

    this.timer = window.setInterval(function () {
      this2.render_frame();
    }, 10);
  }

  render_frame() {
    let ctx = this.modal_ctx;
    if (ctx === undefined || !this.modalRunning) {
      console.log("Timer end");
      window.clearInterval(this.timer);
      this.end();
      return;
    }

    let scene = ctx.scene;
    if (scene.time >= this.max_time + 25) {
      this.end(ctx);
      return;
    }

    console.log("rendering frame", scene.time);

    let vd = this.viewport;
    let canvas = document.createElement("canvas");
    (canvas.width = vd.size[0]), (canvas.height = vd.size[1]);

    /* NOTE: was ctx.view2d.draw_canvas_ctx, which no View2DHandler has, so
       every render frame threw TypeError on the getImageData below.  The
       foreground canvas is what the viewport actually draws into. */
    let g1 = ctx.view2d.get_fg_canvas().g;
    let idata = g1.getImageData(vd.pos[0], vd.pos[1], vd.size[0], vd.size[1]);

    let g2 = canvas.getContext("2d")!;
    g2.putImageData(idata, 0, 0);

    let image = canvas.toDataURL();

    let frame = {
      time: scene.time,
      data: idata,
    };

    window.anim_to_playback.push(frame);
    window.anim_to_playback.filesize += image.length;

    scene.change_time(ctx, scene.time + 1);
    window.redraw_viewport();
  }

  end(ctx?: FullContext) {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.end_modal();
  }

  on_keydown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case charmap["Escape"]:
        this.end(this.modal_ctx);
    }
  }
}

export class PlayAnimOp extends ToolOp {
  viewport!: PlaybackViewport;
  /* time_ms() when playback started; playback position is derived from it. */
  start_time!: number;
  timer!: number;
  /* Set while a blit is queued, so the interval skips a beat. */
  doing_draw!: boolean;

  constructor() {
    super();
  }

  static tooldef() {
    return {
      uiname  : "Play",
      toolpath: "view2d.play_anim",
      is_modal: true,
      inputs  : {},
      outputs : {},
      undoflag: UndoFlags.NO_UNDO,
    };
  }

  start_modal(ctx: FullContext) {
    super.start_modal(ctx);
    console.log("Anim render start!");

    this.viewport = {
      pos : [ctx.view2d.pos[0], window.innerHeight - (ctx.view2d.pos[1] + ctx.view2d.size[1])],
      size: [ctx.view2d.size[0], ctx.view2d.size[1]],
    };

    let this2 = this;
    let pathspline = ctx.frameset.pathspline;

    this.start_time = time_ms();

    this.timer = window.setInterval(function () {
      if (this2.doing_draw) return;
      this2.render_frame();
    }, 10);
  }

  render_frame() {
    let ctx = this.modal_ctx;
    if (ctx === undefined || !this.modalRunning) {
      console.log("Timer end");
      window.clearInterval(this.timer);
      this.end();
      return;
    }

    let vd = window.anim_to_playback.viewport!;
    /* NOTE: same nonexistent draw_canvas_ctx as in RenderAnimOp above. */
    let g1 = ctx.view2d.get_fg_canvas().g;

    let time = time_ms() - this.start_time;

    time = (time / 1000.0) * 24.0;
    let fi = Math.floor(time);

    vd = window.anim_to_playback.viewport!;

    let pos = ctx.view2d.pos;
    let this2 = this;

    if (fi >= window.anim_to_playback.length) {
      console.log("end");
      this.end();
      window.redraw_viewport();

      return;
    }

    let frame = window.anim_to_playback[fi];

    this.doing_draw = true;
    let draw = function draw() {
      this2.doing_draw = false;

      //g1.beginPath();
      //g1._rect(pos[0], window.innerHeight-(pos[1]+vd.size[1]), vd.size[0], vd.size[1]);
      //g1.fillStyle = "red";
      //g1.fill();
      //g1.stroke();

      /* the `g1._putImageData !== undefined` branch that used to sit here was
         dead: nothing in the codebase ever stamps _putImageData on a context. */
      if (frame !== undefined) {
        g1.putImageData(frame.data, pos[0], window.innerHeight - (pos[1] + vd.size[1]));
      }
    };

    requestAnimationFrame(draw);
  }

  end(ctx?: FullContext) {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.end_modal();
  }

  on_keydown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case charmap["Escape"]:
        this.end(this.modal_ctx);
    }
  }
}

/* The SplineEditor class that used to close this file has been deleted.  It
   was the dead predecessor of toolmodes/splinetool.ts (see the header), was
   never constructed -- view2d.ts's only `new SplineEditor(this)` is commented
   out -- was never registered with nstructjs despite carrying a STRUCT, and
   reached for eight names the module never imported. */
