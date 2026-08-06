"use strict";

//multitouch
import { ToolOp, UndoFlags, ToolFlags } from "../../core/toolops_api.js";

import {
  Vec2Property,
  Vec3Property,
  IntProperty,
  StringProperty,
  TPropFlags,
} from "../../core/toolprops.js";
import { b64decode } from "../../util/strutils.js";
import { Vector2, Vector3, Matrix4, Vector4, Quat } from "../../path.ux/scripts/pathux.js";

import type { FullContext } from "../../core/context.js";
import type { drawline } from "./view2d.js";

let exec_pan_v1 = new Vector3(),
  exec_pan_v2 = new Vector3();

export class View2dOp extends ToolOp {
  /* NOTE: filled by nothing -- makeTempLine pushes onto `drawlines` (the base
     class list) via new_drawline, and resetTempGeom clears that same list. */
  tempLines: drawline[];

  constructor() {
    super();

    this.tempLines = [];
  }

  makeTempLine(v1: Vector2, v2: Vector2, color: number[]) {
    return this.new_drawline(v1, v2, color);
  }

  resetTempGeom() {
    return super.reset_drawlines();
  }
}

export class PanOp extends ToolOp {
  is_modal: boolean;
  cameramat: Matrix4;

  mpos!: Vector2;
  start_mpos: Vector2;
  first: boolean;
  /* view2d.cameramat as of the drag start; every move re-derives from it. */
  start_cameramat: Matrix4;

  constructor(start_mpos?: Vector2 | number[]) {
    super();

    this.is_modal = true;
    this.undoflag |= UndoFlags.NO_UNDO;

    if (start_mpos !== undefined) {
      this.start_mpos = new Vector2(start_mpos);
      this.start_mpos[2] = 0.0;

      this.first = false;
    } else {
      this.start_mpos = new Vector2();

      this.first = true;
    }

    this.start_cameramat = new Matrix4();
    this.cameramat = new Matrix4();
  }

  static tooldef() {
    return {
      uiname  : "Pan",
      toolpath: "view2d.pan",

      undoflag: UndoFlags.NO_UNDO,

      inputs : {},
      outputs: {},

      is_modal: true,
    };
  }

  /* NOTE: `event.touches` below is a TouchEvent property; on a PointerEvent
     it is undefined, so the velpan reset always runs. */
  on_mousemove(event: PointerEvent) {
    let mpos = new Vector2([event.x, event.y, 0]);
    let ctx = this.modal_ctx;

    mpos = new Vector2(ctx.view2d.getLocalMouse(event.x, event.y));
    //console.log("mousemove!");

    if (this.first) {
      this.first = false;
      this.start_cameramat.load(ctx.view2d.cameramat);
      this.start_mpos.load(mpos);

      return;
    }

    mpos.sub(this.start_mpos).mulScalar(1.0 / ctx.view2d.zoom);
    mpos[1] = -mpos[1];

    this.cameramat.load(this.start_cameramat).translate(mpos[0], -mpos[1], 0.0);
    ctx.view2d.set_cameramat(this.cameramat);

    if (!event.touches) {
      ctx.view2d.resetVelPan();
    }
    //console.log("panning");
    window.force_viewport_redraw();
    window.redraw_viewport();
  }

  on_mouseup(event: PointerEvent) {
    this.end_modal();
  }
}

/* NOTE: ViewRotateZoomPanOp, ViewRotateOp and ViewPanOp lived here.  None
   was exported, referenced or registered, and all three drove a 3D viewport
   through view2d.drawmats, view2d.zoomwheel and ctx.mesh, none of which
   exist -- every entry point threw.  Removed. */

/* NOTE: b64decode was not imported here, so exec() threw ReferenceError; the
   import is now at the top of the file.  SavedContext is fine -- AppState puts
   it on window. */
export class BasicFileDataOp extends ToolOp<{ data: StringProperty }> {
  is_modal: boolean;

  constructor(data: string) {
    super();

    this.is_modal = false;
    this.undoflag = UndoFlags.NO_UNDO | UndoFlags.IS_UNDO_ROOT | UndoFlags.UNDO_BARRIER;

    if (data) this.inputs.data.setValue(data);

    //make empty saved_context
    this.saved_context = new SavedContext();
  }

  static tooldef() {
    return {
      uiname  : "internal file load op",
      toolpath: "app.basic_file_with_data",
      undoflag: UndoFlags.NO_UNDO | UndoFlags.IS_UNDO_ROOT | UndoFlags.UNDO_BARRIER,

      inputs: {
        /* NOTE: TPropFlags.PRIVATE used to sit in the description slot, so the
           property never actually got the flag.  Left unset rather than moved --
           granting it would change what the tool API exposes. */
        data: new StringProperty("", "filedata", "file data in base64", ""),
      },
    };
  }

  exec(ctx: FullContext) {
    let data = new DataView(b64decode(this.inputs.data.data).buffer);

    console.log(this.inputs.data.data.length, data.byteLength);
    g_app_state.load_scene_file(data);
  }
}

import { Spline } from "../../curve/spline.js";
import { SplineFrameSet } from "../../core/frameset.js";
import { Scene } from "../../scene/scene.js";

export class BasicFileOp extends ToolOp {
  constructor() {
    super();
  }

  static tooldef() {
    return {
      toolpath   : "app.basic_file",
      uiname     : "Make Basic File (internal)",
      undoflag   : UndoFlags.IS_UNDO_ROOT | UndoFlags.UNDO_BARRIER,
      description: "Internal tool op; makes basic file",
    };
  }

  exec(ctx: FullContext) {
    let datalib = ctx.datalib;

    let splineset = new SplineFrameSet();
    splineset.set_fake_user();

    datalib.add(splineset);

    let scene = new Scene();
    datalib.add(scene);

    scene._initCollection(datalib);

    scene.set_fake_user();
    let ob = scene.addFrameset(datalib, splineset);
    scene.setActiveObject(ob);
  }
}

import { FloatProperty } from "../../core/toolprops.js";

export class FrameChangeOp extends ToolOp<{ frame: FloatProperty }> {
  /* scene.time before the change; undefined until undo_pre runs. */
  _undo: number | undefined;

  constructor(frame?: number) {
    super();

    this._undo = undefined;

    if (frame !== undefined) this.inputs.frame.setValue(frame);
  }

  static tooldef() {
    return {
      toolpath: "scene.change_frame",
      uiname  : "Change Frame",

      inputs: {
        frame: new FloatProperty(0, "frame", "frame", "frame"),
      },
    };
  }

  undo_pre(ctx: FullContext) {
    this._undo = ctx.scene.time;
  }

  undo(ctx: FullContext) {
    ctx.scene.change_time(ctx, this._undo!);
  }

  exec(ctx: FullContext) {
    ctx.scene.change_time(ctx, this.inputs.frame.data);
  }
}

import { SimpleCanvasDraw2D } from "../../vectordraw/vectordraw_canvas2d_simple.js";
import { draw_spline } from "../../curve/spline_draw.js";
import { save_file } from "../../core/fileapi/fileapi.js";
import { SplineDrawer } from "../../curve/spline_draw_new.js";

export class ExportCanvasImage extends ToolOp {
  static tooldef() {
    return {
      toolpath   : "view2d.export_image",
      uiname     : "Save Canvas Image",
      description: "Export visible canvas",
      undoflag   : UndoFlags.NO_UNDO,
    };
  }

  exec(ctx: FullContext) {
    /* the export path only runs from the viewport's own menu. */
    let view2d = g_app_state.active_view2d!;
    let spline = ctx.frameset.spline;

    /* NOTE: the canvas used to be handed over bare, but spline_draw reads
       g.canvas.dpi_scale when sizing vertices, so every one of them came out
       NaN in the exported image.  Built the way Editor.getCanvas does it. */
    let canvas = Object.assign(document.createElement("canvas"), { dpi_scale: 1.0 });
    canvas.width = view2d.size[0];
    canvas.height = view2d.size[1];

    //add in custom matrix code
    /* NOTE: `canvas` was in this list.  CanvasRenderingContext2D.canvas is a
       getter with no setter, so Object.assign threw a TypeError here; it is
       already the canvas the context came from. */
    let g = Object.assign(canvas.getContext("2d")!, {
      dpi_scale   : 1.0,
      width       : canvas.width,
      height      : canvas.height,
      _irender_mat: new Matrix4(),
    });

    let vecdrawer = new SimpleCanvasDraw2D();
    vecdrawer.canvas = canvas;
    vecdrawer.g = g;

    let drawer = new SplineDrawer(spline, vecdrawer);

    //temporarily override spline.drawer
    let old = spline.drawer;
    spline.drawer = drawer;

    console.log("saving image. . .");

    //force full update
    drawer.recalc_all = true;
    drawer.update(
      spline,
      spline.drawlist,
      spline.draw_layerlist,
      view2d.genMatrix(),
      [],
      view2d.only_render,
      view2d.selectmode,
      g,
      view2d.zoom,
      view2d
    );

    try {
      draw_spline(
        spline,
        [],
        g,
        view2d,
        view2d.genMatrix(),
        view2d.selectmode,
        view2d.only_render,
        view2d.draw_normals,
        1.0,
        true,
        ctx.frameset.time
      );
    } catch (error) {
      print_stack(error);
      console.trace("Draw error");

      g_app_state.notes.label("Error drawing canvas");
      return;
    }

    //restore old spline.drawer
    spline.drawer = old;

    //make data url
    let url = canvas.toDataURL();

    //turn data url into binary
    url = atob(url.slice(url.search("base64,") + 7, url.length));

    let data = new Uint8Array(url.length);
    for (let i = 0; i < data.length; i++) {
      data[i] = url.charCodeAt(i);
    }

    /* NOTE: this is the html5/chrome save_file signature
       (data, save_as_mode, set_current_file, extslabel, exts, error_cb); the
       electron backend exports a 4-argument (data, path, errCb, okCb) form
       instead, so one of the two builds mis-passes these arguments. */
    save_file(data, true, false, "PNG", ["png"], function () {
      console.trace("ERROR ERROR!!\n");
      g_app_state.notes.label("Error drawing canvas");
      return;
    });
  }
}
