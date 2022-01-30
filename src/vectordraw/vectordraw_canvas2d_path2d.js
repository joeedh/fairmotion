import {PathBase, VectorDraw} from './vectordraw_base.js';

let MOVETO = 0, LINETO = 1, CUBICTO = 2, QUADTO = 3, RECT = 4, SETLINEWIDTH = 5, STROKE = 6, FILL = 7, CLIP = 8;
const goodCommands = new Set([MOVETO, LINETO, CUBICTO, QUADTO]);

import {Vector3, Matrix4} from '../path.ux/scripts/pathux.js';

let ptmp = new Vector3();
let mtmp = new Matrix4();

export class PathCommand {
  constructor(cmd, r, g, b, a, lineWidth) {
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

  constructor(matrix, g, id, z) {
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

  pushCmd(cmd) {
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

  beginPath() {
    this.pushCmd(BEGINPATH);
    this._pushPath();
    this.actpath.beginPath();

    return this;
  }

  cubicTo(x2, y2, x3, y3, x4, y4, subdiv = 1) {
    this.pushCmd(CUBICTO, x2, y2, x3, y3, x4, y4);
    this.actpath.bezierCurveTo(x2, y2, x3, y3, x4, y4);
    return this;
  }

  bezierTo(x2, y2, x3, y3) {
    this.pushCmd(QUADTO, x2, y2, x3, y3);
    this.actpath.quadraticCurveTo(x2, y2, x3, y3);
    return this;
  }

  moveTo(x, y) {
    this.pushCmd(MOVETO, x, y);
    this.actpath.moveTo(x, y);

    return this;
  }

  lineTo(x, y) {
    this.pushCmd(LINETO, x, y);
    this.actpath.lineTo(x, y);
    return this;
  }

  pushStroke(color, width) {
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

  update_aabb(draw, fast_mode = false) {
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

  draw(matrix, clipMode = false) {
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

  set_matrix(matrix) {
    super.set_matrix(matrix);

    for (let p of this.paths) {
      p.matrix = this.matrix;
    }

    this.zoom = matrix.$matrix.m11;
  }

  draw(finalg) {
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


  has_path(id, z, check_z = true): never {
    if (!(id in this.path_idmap)) {
      return false;
    }

    let path = this.path_idmap[id];
    return check_z ? path.z === z : true;
  }

  get_path(id, z, check_z = true): never {
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