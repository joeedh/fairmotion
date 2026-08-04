import {PathBase, VectorDraw} from './vectordraw_base.js';
import type {DrawCanvas} from './vectordraw_base.js';

let MOVETO = 0, LINETO = 1, CUBICTO = 2, QUADTO = 3, RECT = 4, SETLINEWIDTH = 5, STROKE = 6, FILL = 7, CLIP = 8;
const goodCommands = new Set([MOVETO, LINETO, CUBICTO, QUADTO]);

import {Vector3, Matrix4} from '../path.ux/scripts/pathux.js';

let ptmp = new Vector3();
let mtmp = new Matrix4();

export class PathCommand {
  /* One of the MOVETO..CLIP opcodes at the top of this file. */
  cmd : number | undefined;
  r : number | undefined;
  g : number | undefined;
  b : number | undefined;
  a : number | undefined;
  lineWidth : number | undefined;
  /* Set only on the geometry-carrying commands. */
  path : Path2D | undefined;

  constructor(cmd? : number, r? : number, g? : number, b? : number,
              a? : number, lineWidth? : number) {
    this.cmd = cmd;
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
    this.lineWidth = lineWidth;
    this.path = undefined;
  }
}

/* uses pure html canvas2d but with canvas.prototype.path2d objects*/
export class Path2DPath extends PathBase {
  draw: CanvasPath2D;
  autoFill: boolean;
  commands: Array<number>;
  id: number;
  z: number;
  clip_paths: Array<Path2DPath>;

  g : Canvas2D;
  /* Cleared by _pushPath(); update_aabb() rebuilds the box. */
  need_aabb : boolean;
  /* The Path2D currently being appended to, and the full command list. */
  actpath : Path2D | undefined;
  paths : PathCommand[];

  /* NOTE: get_path() passes the CanvasPath2D as the first argument, so
     `this.matrix` ends up holding the draw object rather than a Matrix4
     until the first update_aabb() overwrites it. */
  constructor(matrix : CanvasPath2D, g : Canvas2D, id : number, z : number) {
    super();

    this.matrix = matrix;

    this.g = g;
    this.z = z;

    this.id = id;
    this.need_aabb = true;

    //actual command list that's basically just a list of Path2D's
    this.actpath = undefined;
    this.paths = [];

    //store all commands with points to keep aabb up to date
    this.commands = [];

    this.autoFill = true;
    this._pushPath();
  }

  pushCmd(cmd : number, ...args : number[]) {
    this.commands.push(cmd);
    this.commands.push(arguments.length - 1);

    for (let i = 1; i < arguments.length; i++) {
      this.commands.push(arguments[i]);
    }

    return this;
  }

  noAutoFill() {
    this.autoFill = false;
    return this;
  }

  _pushPath() {
    this.need_aabb = true;

    let path = new Path2D();
    let cmd = new PathCommand();
    cmd.path = path;
    this.paths.push(cmd);
    this.actpath = path;

    return this;
  }

  /* NOTE: BEGINPATH is not defined in this file, and Path2D has no
     beginPath() -- both throw the moment a path is begun. */
  beginPath() {
    this.pushCmd(BEGINPATH);
    this._pushPath();
    this.actpath.beginPath();

    return this;
  }

  cubicTo(x2 : number, y2 : number, x3 : number, y3 : number, x4 : number,
          y4 : number, subdiv = 1) {
    this.pushCmd(CUBICTO, x2, y2, x3, y3, x4, y4);
    this.actpath.bezierCurveTo(x2, y2, x3, y3, x4, y4);
    return this;
  }

  bezierTo(x2 : number, y2 : number, x3 : number, y3 : number) {
    this.pushCmd(QUADTO, x2, y2, x3, y3);
    this.actpath.quadraticCurveTo(x2, y2, x3, y3);
    return this;
  }

  moveTo(x : number, y : number) {
    this.pushCmd(MOVETO, x, y);
    this.actpath.moveTo(x, y);

    return this;
  }

  lineTo(x : number, y : number) {
    this.pushCmd(LINETO, x, y);
    this.actpath.lineTo(x, y);
    return this;
  }

  /* NOTE: unlike pushFill/pushClip, the PathCommand built here is never
     pushed onto this.paths -- only the numeric command list gets the stroke. */
  pushStroke(color? : number[], width? : number) {
    let cmd = new PathCommand(STROKE);

    if (color && width !== undefined) {
      cmd.r = color[0];
      cmd.g = color[1];
      cmd.b = color[2];
      cmd.a = color[3];
      cmd.lineWidth = width;

      this.pushCmd(STROKE, color[0], color[1], color[2], color[3], width);
    } else if (color) {
      cmd.r = color[0];
      cmd.g = color[1];
      cmd.b = color[2];
      cmd.a = color[3];

      this.pushCmd(STROKE, color[0], color[1], color[2], color[3]);
    } else if (width !== undefined) {
      cmd.lineWidth = width;

      this.pushCmd(STROKE, width);
    }

    this._pushPath();

    return this;
  }

  pushFill() {
    this.paths.push(new PathCommand(FILL));
    this._pushPath();
    this.pushCmd(FILL);
    return this;
  }

  pushClip() {
    this.paths.push(new PathCommand(CLIP));
    this._pushPath();
    this.pushCmd(CLIP);
    return this;
  }

  update_aabb(draw : CanvasPath2D, fast_mode = false) {
    let cs = this.commands;
    let i = 0;

    this.need_aabb = false;
    this.matrix = draw ? draw.matrix || this.matrix : this.matrix;

    let matrix = this.matrix;

    let [min, max] = this.aabb;

    min.zero().addScalar(1e17);
    max.zero().addScalar(-1e17);

    let ok = false;

    while (i < cs.length) {
      let cmd = cs[i], totarg = cs[i + 1];

      if (goodCommands.has(cmd)) {
        let totpoint = totarg>>1;

        for (let j = 0; j < totpoint; j++) {
          let x = cs[i + 1 + j*2];
          let y = cs[i + 1 + j*2 + 1];

          ptmp[0] = x;
          ptmp[1] = y;
          ptmp[2] = 0.0;

          ptmp.multVecMatrix(matrix);

          x = ptmp[0];
          y = ptmp[1];

          min[0] = Math.min(min[0], x);
          min[1] = Math.min(min[1], y);

          max[0] = Math.max(max[0], x);
          max[1] = Math.max(max[1], y);

          ok = true;
        }
      }

      i += totarg;
    }

    if (!ok) {
      min.zero();
      max.zero();
    }
  }

  draw(matrix : Matrix4, clipMode = false) {
    let g = this.g;

    this.matrix = matrix;

    if (this.need_aabb) {
      this.update_aabb();
    }

    let needRestore = false;

    if (!clipMode && this.clip_paths.length > 0) {
      needRestore = true;

      g.save();
      for (let path of this.clip_paths) {
        path.draw(matrix, true);
      }
    }

    let mat = matrix.$matrix;
    let [offx, offy] = this.off;

    g.setTransform(mat.m11, mat.m12, mat.m21, mat.m22, mat.m41+offx, mat.m42+offy);

    let curi = 0
    let paths = this.paths;

    let do_blur = this.blur > 1 && !clipMode;
    let zoom = mat.m11;

    if (do_blur) {
      g.filter = "blur(" + (this.blur*0.25*zoom) + "px)";
    } else {
      g.filter = "none";
    }

    for (let i=0; i<paths.length; i++) {
      let cmd = paths[i];

      if (!cmd.path) {
        for (; curi < i; curi++) {
          let path1 = paths[curi].path;

          if (!path1) {
            continue;
          }

          let path = new Path2D();
          path.addPath(path1, matrix);

          switch (cmd) {
            case FILL:
              console.log("FILL!", path);

              if (clipMode) {
                g.clip();
              } else {
                g.fill(path);
              }
              break;
            case CLIP:
              g.clip(path);
              break;
            case STROKE:
              if (clipMode) {
                continue;
              }

              if (cmd.r !== undefined) {
                let cr = ~~(cmd.r*255);
                let cg = ~~(cmd.g*255);
                let cb = ~~(cmd.b*255);
                let ca = cmd.a;

                g.strokeStyle = `rgba(${cr},${cg},${cb},${ca})`;
              }

              if (cmd.lineWidth !== undefined) {
                g.lineWidth = cmd.lineWidth * matrix.m11;
              }

              g.stroke(path);
              break;
          }
        }
      }
    }

    if (clipMode) {
      g.clip();
    } else if (this.autoFill) {
      let r  = ~~(this.color[0]*255),
          g1 = ~~(this.color[1]*255),
          b  = ~~(this.color[2]*255),
          a  = this.color[3];

      let fstyle = "rgba(" + r + "," + g1 + "," + b + "," + a + ")";
      g.fillStyle = fstyle;

      for (; curi < paths.length; curi++) {
        let path1 = paths[curi].path;
        let path = new Path2D();

        path.addPath(path1, matrix);

        if (path) {
          g.fill(path);
        }
      }
    }

    if (needRestore) {
      g.restore();
    }
  }

  reset() {
    this.autoFill = true;
    this.need_aabb = true;
    this.commands.length = 0;
    this.paths.length = 0;
    this.actpath = undefined;

    this._pushPath();

    return this;
  }

  update() {

  }
}

export class CanvasPath2D extends VectorDraw {
  paths : Path2DPath[];
  path_idmap : {[id : number] : Path2DPath};
  canvas : DrawCanvas;
  g : Canvas2D;
  /* Set when a path's z changed and the draw order is stale. */
  resort : boolean;

  constructor() {
    super();

    this.matrix.$matrix = new DOMMatrix();

    this.paths = [];
    this.path_idmap = {};

    this.canvas = document.createElement("canvas");
    this.g = this.canvas.getContext("2d");

    this.resort = true;
    this.zoom = 1.0;
  }

  set_matrix(matrix : Matrix4) {
    super.set_matrix(matrix);

    for (let p of this.paths) {
      p.matrix = this.matrix;
    }

    this.zoom = matrix.$matrix.m11;
  }

  draw(finalg : Canvas2D) {
    this.zoom = this.matrix.$matrix.m11;

    if (this.resort) {
      this.resort = false;
      this.paths.sort((a, b) => a.z - b.z);
    }

    let canvas = this.canvas;
    let g = this.g;
    let finalcanvas = finalg.canvas;

    canvas.width = finalcanvas.width;
    canvas.height = finalcanvas.height;
    g.clearRect(0, 0, canvas.width, canvas.height);

    g.save();

    for (let p of this.paths) {
      p.draw(this.matrix, false);
    }

    g.restore();

    finalg.drawImage(canvas, 0, 0);
  }


  has_path(id : number, z : number, check_z = true) : boolean {
    if (!(id in this.path_idmap)) {
      return false;
    }

    let path = this.path_idmap[id];
    return check_z ? path.z === z : true;
  }

  get_path(id : number, z : number, check_z = true) : Path2DPath {
    let path;

    if (id in this.path_idmap) {
      path = this.path_idmap[id];

      if (path.z !== z && check_z) {
        this.resort = true;
      }
    } else {
      path = new Path2DPath(this, this.g, id, z);
      this.paths.push(path);
      this.path_idmap[id] = path;

      this.resort = true;
    }

    return path;
  }

  update() {
    for (let p of this.paths) {
      p.update();
    }
  }
}