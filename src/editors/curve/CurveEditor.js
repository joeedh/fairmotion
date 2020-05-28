import {Area} from '../../path.ux/scripts/screen/ScreenArea.js';
import {STRUCT} from '../../core/struct.js';
import {UIBase} from '../../path.ux/scripts/core/ui_base.js';
import {Editor} from '../editor_base.js';
import {Vector2} from '../../path.ux/scripts/util/vectormath.js';
import { DropBox } from '../../path.ux/scripts/pathux.js';
import {pushModalLight, popModalLight} from '../../path.ux/scripts/util/simple_events.js';

function startPan(edit : CurveEdit, x, y) {
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

  edit._modaldata = pushModalLight({
    on_mousedown(e) {
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
      this.stop();
    },

    stop() {
      if (edit._modaldata) {
        popModalLight(edit._modaldata);
        edit._modaldata = undefined;
      }
    },

    on_keydown(e) {
      if (e.keyCode === 27) {
        this.stop();
      }
    }
  });
}

export class CurveEdit extends UIBase {
  constructor() {
    super();
    this.curvePaths = [];
    this._drawreq = false;

    this.size = new Vector2([512, 512]);
    this.canvas = document.createElement("canvas");
    this.g = this.canvas.getContext("2d");
    this.shadow.appendChild(this.canvas);

    this.pan = new Vector2();
    this.zoom = new Vector2([1, 1]);

    this.addEventListener("mousedown", this.on_mousedown.bind(this));
    this.addEventListener("mousemove", this.on_mousemove.bind(this));
    this.addEventListener("mouseup", this.on_mouseup.bind(this));
  }

  on_mousedown(e : MouseEvent) {
    this.mdown = true;

    startPan(this);
    console.log("mdown");
  }

  on_mousemove(e : MouseEvent) {
    console.log("mmove");
  }

  on_mouseup(e) { 
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

    g.fillStyle = "rgb(240, 240, 240)";
    g.rect(0, 0, canvas.width, canvas.height);
    g.fill();

    let fsize = 10;
    g.font = "" + fsize + "px sans-serif";

    let pad = fsize*3.0;
    let csize = 32;
    let steps = ~~(this.size[0]  / csize + 1.0);
    
    g.fillStyle = "grey";
    g.beginPath();
    g.rect(0, 0, pad, this.size[1]);
    g.rect(0, this.size[1] - pad, this.size[0], pad);
    g.rect(0, 0, this.size[0], pad);
    g.rect(this.size[0]-pad, 0, pad, this.size[1]);
    //g.rect(
    g.fill();

    g.fillStyle = "orange";

    for (let step=0; step<2; step++) {
      let off = this.pan[step] % csize;
      let x = off - csize;

      for (let i=0; i<steps; i++) {
        let val = i- ~~(this.pan[step] / csize);
        val = val.toFixed(1);
        
        if (x >= this.size[step] - pad) {
          break;
        }

        let v1 = [0, 0];
        let v2 = [0, 0];
        
        v1[step] = v2[step] = x;
        v1[step^1] = pad;
        v2[step^1] = this.size[step^1]-pad;

        if (x >= pad) {
          g.beginPath();
          g.moveTo(v1[0], v1[1]);
          g.lineTo(v2[0], v2[1]);
          g.stroke();

          v1[step] = v2[step] = x;
          v1[step^1] = 0;
          v2[step^1] = this.size[step^1];

          if (!step) {
            v1[1] += fsize*1.45;
          }

          g.fillText(""+val, 10+v1[0], v1[1]);
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
