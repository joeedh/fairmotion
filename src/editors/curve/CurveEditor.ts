import type {FullContext} from "../../core/context.js";
import {Area} from '../../path.ux/scripts/screen/ScreenArea.js';
import {STRUCT} from '../../core/struct.js';
import {UIBase} from '../../path.ux/scripts/core/ui_base.js';
import {Editor} from '../editor_base.js';
import {Vector2} from '../../path.ux/scripts/util/vectormath.js';
import { DropBox } from '../../path.ux/scripts/pathux.js';
import {pushModalLight, popModalLight} from '../../path.ux/scripts/util/simple_events.js';
import type {ModalState} from '../../path.ux/scripts/path-controller/util/simple_events.js';
import {IndexRange} from '../../path.ux/scripts/path-controller/util/indexRange.js';

/* NOTE: CurveEdit.on_mousedown called this with only `edit`, so x and y came
   through undefined and startmpos/lastmpos were NaN.  Nothing read either
   before the first mousemove overwrote them, so this only ever looked wrong. */
function startPan(edit : CurveEdit, x : number, y : number) {
  if (edit._modaldata) {
    popModalLight(edit._modaldata);
    edit._modaldata = undefined;
    return;
  }

  let startmpos = new Vector2([x, y]);
  let lastmpos = new Vector2([x, y]);
  let mpos = new Vector2();
  let dv = new Vector2();
  let first = true;

  /* Hoisted out of the pushModalLight() call so the handlers can reach stop();
     path.ux types the argument as a bare property bag, which leaves `this`
     unknown inside it. */
  let handlers = {
    on_mousedown(e : MouseEvent) {
    },

    on_mousemove(e : MouseEvent) {
      lastmpos.load(mpos);

      mpos[0] = e.x;
      mpos[1] = e.y;

      if (first) {
        first = false;
        return;
      }

      dv.load(mpos).sub(lastmpos);
      edit.pan.add(dv);
      edit.redraw();

      //console.log(dv, edit.pan);
    },

    on_mouseup(e : MouseEvent) {
      handlers.stop();
    },

    stop() {
      if (edit._modaldata) {
        popModalLight(edit._modaldata);
        edit._modaldata = undefined;
      }
    },

    on_keydown(e : KeyboardEvent) {
      if (e.keyCode === 27) {
        handlers.stop();
      }
    }
  };

  edit._modaldata = pushModalLight(handlers);
}

export class CurveEdit extends UIBase<FullContext> {
  /* Set while a pan is running; the token popModalLight() needs. */
  declare _modaldata : ModalState | undefined;
  curvePaths : Path2D[];
  /* True between redraw() and the queued draw(). */
  _drawreq : boolean;
  size : Vector2;
  canvas : HTMLCanvasElement;
  /* A plain 2d context; draw() uses nothing the app's Canvas2D adds. */
  g : CanvasRenderingContext2D;
  pan : Vector2;
  zoom : Vector2;
  mdown! : boolean;

  constructor() {
    super();
    this.curvePaths = [];
    this._drawreq = false;

    this.size = new Vector2([512, 512]);
    this.canvas = document.createElement("canvas");
    this.g = this.canvas.getContext("2d")!;
    this.shadow.appendChild(this.canvas);

    this.pan = new Vector2();
    this.zoom = new Vector2([1, 1]);

    this.addEventListener("mousedown", this.on_mousedown.bind(this));
    this.addEventListener("mousemove", this.on_mousemove.bind(this));
    this.addEventListener("mouseup", this.on_mouseup.bind(this));
  }

  on_mousedown(e : MouseEvent) {
    this.mdown = true;

    startPan(this, e.x, e.y);
    console.log("mdown");
  }

  on_mousemove(e : MouseEvent) {
    console.log("mmove");
  }

  on_mouseup(e : MouseEvent) {
    console.log("mup");
    this.mdown = false;
  }

  init() {
    super.init();
  }

  redraw() {
    if (this._drawreq) {
      return;
    }

    this.doOnce(this.draw);
  }

  draw() {
    this._drawreq = false;
    let g = this.g;
    let canvas = this.canvas;

    g.fillStyle = "rgb(75, 75, 75)";
    g.rect(0, 0, canvas.width, canvas.height);
    g.fill();

    let fsize = 10;
    g.font = "" + fsize + "px sans-serif";

    let pad = fsize*3.0;
    let csize = 32;

    g.fillStyle = "grey";
    g.beginPath();
    g.rect(0, 0, pad, this.size[1]);
    g.rect(0, this.size[1] - pad, this.size[0], pad);
    g.rect(0, 0, this.size[0], pad);
    g.rect(this.size[0]-pad, 0, pad, this.size[1]);
    //g.rect(
    g.fill();

    g.fillStyle = "orange";

    /* IndexRange() yields 0|1, which is what indexing a Vector2 wants. */
    for (const step of IndexRange(2)) {
      const step2 = step === 0 ? 1 : 0;

      let steps = Math.floor(this.size[step]  / csize + 1.0);

      let off = this.pan[step] % csize;
      let x = off - csize;

      for (let i=0; i<steps; i++) {
        let val = i - Math.floor(this.pan[step] / csize);
        let valstr = val.toFixed(1);

        if (x >= this.size[step] - pad) {
          break;
        }

        let v1 = [0, 0];
        let v2 = [0, 0];

        v1[step] = v2[step] = x;
        v1[step2] = pad;
        v2[step2] = this.size[step2]-pad;

        if (x >= pad) {
          let a = 1.0;

          let ix = Math.floor(i - this.pan[step]/csize);
          if (ix % 4 === 0) {
            a = 0.95;
          } else if (ix % 2 === 0) {
            a = 0.678;
          } else {
            a = 0.42;
          }

          a = ~~(a*255);
          g.strokeStyle = `rgb(${a},${a},${a})`;

          g.beginPath();
          g.moveTo(v1[0], v1[1]);
          g.lineTo(v2[0], v2[1]);
          g.stroke();

          v1[step] = v2[step] = x;
          v1[step2] = 0;
          v2[step2] = this.size[step2];

          if (!step) {
            v1[1] += fsize*1.45;
          }

          g.fillText(valstr, 10+v1[0], v1[1]);
        }
        x += csize;
      }
    }
  }

  updateSize() {
    let rect = this.getBoundingClientRect();
    if (!rect)
      return;

    let dpi = UIBase.getDPI();
    let w = ~~(this.size[0]*dpi);
    let h = ~~((this.size[1]-22.5)*dpi);
    let c = this.canvas;

    if (w !== c.width || h !== c.height) {
      console.log("size update");
      c.width = w;
      c.height = h;

      c.style["width"] = (w/dpi) + "px";
      c.style["height"] = (h/dpi) + "px";
      this.redraw();
    }
  }

  update() {
    super.update();

    this.updateSize();
  }

  static define() {return {
    tagname : "curve-edit-x",
    style   : "curve-edit"
  }}
}
UIBase.register(CurveEdit);

export class CurveEditor extends Editor {
  static STRUCT : string;

  pan : Vector2
  zoom : Vector2;
  edit! : CurveEdit;

  constructor() {
    super();

    this.pan = new Vector2();
    this.zoom = new Vector2([1, 1]);
  }

  init() {
    super.init();

    let edit = this.edit = document.createElement("curve-edit-x");

    edit.pan.load(this.pan);
    edit.zoom.load(this.zoom);

    this.pan = edit.pan;
    this.zoom = edit.zoom;

    this.container.add(edit);
  }

  update() {
    this.edit.size[0] = this.size[0];
    this.edit.size[1] = this.size[1];
    super.update();
  }

  static define() { return {
    tagname : "curve-editor-x",
    areaname : "curve_editor",
    uiname : "Curve Editor",
    icon : Icons.CURVE_EDITOR
  }}

  copy() {
    return document.createElement("curve-editor-x");
  }
}

CurveEditor.STRUCT = STRUCT.inherit(CurveEditor, Area) + `
  pan  : vec2;
  zoom : vec2;
}
`;
Editor.register(CurveEditor);
