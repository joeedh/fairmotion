
es6_module_define('vectordraw_canvas2d_path2d', ["./vectordraw_base.js", "../path.ux/scripts/pathux.js"], function _vectordraw_canvas2d_path2d_module(_es6_module) {
  var PathBase=es6_import_item(_es6_module, './vectordraw_base.js', 'PathBase');
  var VectorDraw=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorDraw');
  let MOVETO=0, LINETO=1, CUBICTO=2, QUADTO=3, RECT=4, SETLINEWIDTH=5, STROKE=6, FILL=7, CLIP=8;
  const goodCommands=new Set([MOVETO, LINETO, CUBICTO, QUADTO]);
  var Vector3=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector3');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Matrix4');
  let ptmp=new Vector3();
  let mtmp=new Matrix4();
  class PathCommand  {
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
  _ESClass.register(PathCommand);
  _es6_module.add_class(PathCommand);
  PathCommand = _es6_module.add_export('PathCommand', PathCommand);
  class Path2DPath extends PathBase {
    
    
    
    
    
    
     constructor(matrix, g, id, z) {
      super();
      this.matrix = matrix;
      this.g = g;
      this.z = z;
      this.id = id;
      this.need_aabb = true;
      this.actpath = undefined;
      this.paths = [];
      this.commands = [];
      this.autoFill = true;
      this._pushPath();
    }
     pushCmd(cmd) {
      this.commands.push(cmd);
      this.commands.push(arguments.length-1);
      for (let i=1; i<arguments.length; i++) {
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
      let path=new Path2D();
      let cmd=new PathCommand();
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
     cubicTo(x2, y2, x3, y3, x4, y4, subdiv=1) {
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
      let cmd=new PathCommand(STROKE);
      if (color&&width!==undefined) {
          cmd.r = color[0];
          cmd.g = color[1];
          cmd.b = color[2];
          cmd.a = color[3];
          cmd.lineWidth = width;
          this.pushCmd(STROKE, color[0], color[1], color[2], color[3], width);
      }
      else 
        if (color) {
          cmd.r = color[0];
          cmd.g = color[1];
          cmd.b = color[2];
          cmd.a = color[3];
          this.pushCmd(STROKE, color[0], color[1], color[2], color[3]);
      }
      else 
        if (width!==undefined) {
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
     update_aabb(draw, fast_mode=false) {
      let cs=this.commands;
      let i=0;
      this.need_aabb = false;
      this.matrix = draw ? draw.matrix||this.matrix : this.matrix;
      let matrix=this.matrix;
      let $_t0mqbr=this.aabb, min=$_t0mqbr[0], max=$_t0mqbr[1];
      min.zero().addScalar(1e+17);
      max.zero().addScalar(-1e+17);
      let ok=false;
      while (i<cs.length) {
        let cmd=cs[i], totarg=cs[i+1];
        if (goodCommands.has(cmd)) {
            let totpoint=totarg>>1;
            for (let j=0; j<totpoint; j++) {
                let x=cs[i+1+j*2];
                let y=cs[i+1+j*2+1];
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
        i+=totarg;
      }
      if (!ok) {
          min.zero();
          max.zero();
      }
    }
     draw(matrix, clipMode=false) {
      let g=this.g;
      this.matrix = matrix;
      if (this.need_aabb) {
          this.update_aabb();
      }
      let needRestore=false;
      if (!clipMode&&this.clip_paths.length>0) {
          needRestore = true;
          g.save();
          for (let path of this.clip_paths) {
              path.draw(matrix, true);
          }
      }
      let mat=matrix.$matrix;
      let $_t1mrsk=this.off, offx=$_t1mrsk[0], offy=$_t1mrsk[1];
      g.setTransform(mat.m11, mat.m12, mat.m21, mat.m22, mat.m41+offx, mat.m42+offy);
      let curi=0;
      let paths=this.paths;
      let do_blur=this.blur>1&&!clipMode;
      let zoom=mat.m11;
      if (do_blur) {
          g.filter = "blur("+(this.blur*0.25*zoom)+"px)";
      }
      else {
        g.filter = "none";
      }
      for (let i=0; i<paths.length; i++) {
          let cmd=paths[i];
          if (!cmd.path) {
              for (; curi<i; curi++) {
                  let path1=paths[curi].path;
                  if (!path1) {
                      continue;
                  }
                  let path=new Path2D();
                  path.addPath(path1, matrix);
                  switch (cmd) {
                    case FILL:
                      console.log("FILL!", path);
                      if (clipMode) {
                          g.clip();
                      }
                      else {
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
                      if (cmd.r!==undefined) {
                          let cr=~~(cmd.r*255);
                          let cg=~~(cmd.g*255);
                          let cb=~~(cmd.b*255);
                          let ca=cmd.a;
                          g.strokeStyle = `rgba(${cr},${cg},${cb},${ca})`;
                      }
                      if (cmd.lineWidth!==undefined) {
                          g.lineWidth = cmd.lineWidth*matrix.m11;
                      }
                      g.stroke(path);
                      break;
                  }
              }
          }
      }
      if (clipMode) {
          g.clip();
      }
      else 
        if (this.autoFill) {
          let r=~~(this.color[0]*255), g1=~~(this.color[1]*255), b=~~(this.color[2]*255), a=this.color[3];
          let fstyle="rgba("+r+","+g1+","+b+","+a+")";
          g.fillStyle = fstyle;
          for (; curi<paths.length; curi++) {
              let path1=paths[curi].path;
              let path=new Path2D();
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
  _ESClass.register(Path2DPath);
  _es6_module.add_class(Path2DPath);
  Path2DPath = _es6_module.add_export('Path2DPath', Path2DPath);
  class CanvasPath2D extends VectorDraw {
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
          this.paths.sort((a, b) =>            {
            return a.z-b.z;
          });
      }
      let canvas=this.canvas;
      let g=this.g;
      let finalcanvas=finalg.canvas;
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
     has_path(id, z, check_z=true) {
      if (!(id in this.path_idmap)) {
          return false;
      }
      let path=this.path_idmap[id];
      return check_z ? path.z===z : true;
    }
     get_path(id, z, check_z=true) {
      let path;
      if (id in this.path_idmap) {
          path = this.path_idmap[id];
          if (path.z!==z&&check_z) {
              this.resort = true;
          }
      }
      else {
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
  _ESClass.register(CanvasPath2D);
  _es6_module.add_class(CanvasPath2D);
  CanvasPath2D = _es6_module.add_export('CanvasPath2D', CanvasPath2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_canvas2d_path2d.js');


es6_module_define('vectordraw_stub', ["./vectordraw_base.js", "../config/config.js", "../util/mathlib.js"], function _vectordraw_stub_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorVertex');
  var PathBase=es6_import_item(_es6_module, './vectordraw_base.js', 'PathBase');
  var VectorDraw=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorDraw');
  var canvaspath_draw_mat_tmps=new cachering((_) =>    {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(8);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function () {
    return new Vector2();
  }, 32);
  var CCMD=0, CARGLEN=1;
  var MOVETO=0, BEZIERTO=1, LINETO=2, BEGINPATH=3;
  var NS="http://www.w3.org/2000/svg";
  var XLS="http://www.w3.org/1999/xlink";
  function makeElement(type, attrs) {
    if (attrs===undefined) {
        attrs = {};
    }
    var ret=document.createElementNS(NS, type);
    for (var k in attrs) {
        ret.setAttributeNS(null, k, attrs[k]);
    }
    return ret;
  }
  makeElement = _es6_module.add_export('makeElement', makeElement);
  class StubCanvasPath extends PathBase {
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.commands = [];
      this.recalc = 1;
      this.lastx = 0;
      this.lasty = 0;
      this._last_z = undefined;
      this._last_off = new Vector2();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.domnode = undefined;
      this.filternode = undefined;
      this.clip_users = new set();
      this.path_start_i = 0;
      this.first = true;
      this._mm = new MinMax(2);
    }
     update_aabb(draw, fast_mode=false) {
      var tmp=new Vector2();
      var mm=this._mm;
      var pad=this.pad = this.blur>0 ? this.blur*draw.zoom+15 : 0;
      mm.reset();
      if (fast_mode) {
          console.trace("FAST MODE!");
      }
      var prev=-1;
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=cs[i++];
        if (fast_mode&&prev!=BEGINPATH) {
            prev = cmd;
            i+=arglen;
            continue;
        }
        for (var j=0; j<arglen; j+=2) {
            tmp[0] = cs[i++], tmp[1] = cs[i++];
            tmp.multVecMatrix(draw.matrix);
            mm.minmax(tmp);
        }
        prev = cmd;
      }
      this.aabb[0].load(mm.min).subScalar(pad);
      this.aabb[1].load(mm.max).addScalar(pad);
    }
     beginPath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(BEGINPATH);
    }
     undo() {
      this.commands.length = this.path_start_i;
    }
     _pushCmd() {
      var arglen=arguments.length-1;
      this.commands.push(arguments[0]);
      this.commands.push(arglen);
      for (var i=0; i<arglen; i++) {
          this.commands.push(arguments[i+1]);
      }
      this.recalc = 1;
      this.first = false;
    }
     moveTo(x, y) {
      this._pushCmd(MOVETO, x, y);
      this.lastx = x;
      this.lasty = y;
    }
     bezierTo(x2, y2, x3, y3) {
      this._pushCmd(BEZIERTO, x2, y2, x3, y3);
      this.lastx = x3;
      this.lasty = y3;
    }
     lineTo(x2, y2) {
      if (this.first) {
          this.moveTo(x2, y2);
          return ;
      }
      this._pushCmd(LINETO, x2, y2);
      this.lastx = x2;
      this.lasty = y2;
    }
     destroy(draw) {

    }
     gen(draw, _check_tag=0) {

    }
     reset(draw) {
      this.commands.length = 0;
      this.path_start_i = 0;
      this.off.zero();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.first = true;
    }
     draw(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g) {

    }
     update() {
      this.recalc = 1;
    }
  }
  _ESClass.register(StubCanvasPath);
  _es6_module.add_class(StubCanvasPath);
  StubCanvasPath = _es6_module.add_export('StubCanvasPath', StubCanvasPath);
  class StubCanvasDraw2D extends VectorDraw {
    
    
    
    
     constructor() {
      super();
      this.paths = [];
      this.path_idmap = {};
      this.dosort = true;
      this.matstack = new Array(256);
      this.matrix = new Matrix4();
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
    }
    static  get_canvas(id, width, height, zindex) {
      var ret=document.getElementById(id);
      if (ret==undefined) {
          ret = document.createElement("canvas");
          ret.id = id;
      }
      ret.width = width;
      ret.height = height;
      if (ret.style!=undefined) {
          ret.style["z-index"] = zindex;
      }
      return ret;
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          return false;
      }
      var path=this.path_idmap[id];
      return check_z ? path.z==z : true;
    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          this.path_idmap[id] = new StubCanvasPath();
          this.path_idmap[id].index = this.paths.length;
          this.path_idmap[id].id = id;
          this.dosort = 1;
          this.paths.push(this.path_idmap[id]);
      }
      var ret=this.path_idmap[id];
      if (check_z&&ret.z!=z) {
          this.dosort = 1;
          ret.z = z;
      }
      return ret;
    }
     update() {

    }
    static  kill_canvas(svg) {

    }
     destroy() {

    }
     draw(g) {
      var canvas=g.canvas;
      canvas.style["background"] = "rgba(0,0,0,0)";
      this.canvas = canvas;
      this.g = g;
    }
     set_matrix(matrix) {
      super.set_matrix(matrix);
      this.zoom = matrix.$matrix.m11;
    }
  }
  _ESClass.register(StubCanvasDraw2D);
  _es6_module.add_class(StubCanvasDraw2D);
  StubCanvasDraw2D = _es6_module.add_export('StubCanvasDraw2D', StubCanvasDraw2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_stub.js');


es6_module_define('vectordraw_canvas2d_simple', ["./vectordraw_base.js", "../util/mathlib.js", "../config/config.js"], function _vectordraw_canvas2d_simple_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorVertex');
  var PathBase=es6_import_item(_es6_module, './vectordraw_base.js', 'PathBase');
  var VectorDraw=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorDraw');
  var debug=0;
  window._setDebug = (d) =>    {
    debug = d;
  }
  var canvaspath_draw_mat_tmps=new cachering((_) =>    {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(8);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function () {
    return new Vector2();
  }, 32);
  var CCMD=0, CARGLEN=1;
  var MOVETO=0, BEZIERTO=1, LINETO=2, BEGINPATH=3, CUBICTO=4, STROKE=5, STROKECOLOR=6, STROKEWIDTH=7, NOFILL=8, FILL=9;
  var NS="http://www.w3.org/2000/svg";
  var XLS="http://www.w3.org/1999/xlink";
  function makeElement(type, attrs) {
    if (attrs===undefined) {
        attrs = {};
    }
    var ret=document.createElementNS(NS, type);
    for (var k in attrs) {
        ret.setAttributeNS(null, k, attrs[k]);
    }
    return ret;
  }
  makeElement = _es6_module.add_export('makeElement', makeElement);
  let lasttime=performance.now();
  class SimpleCanvasPath extends PathBase {
    
    
    
    
    
    
    
    
     constructor(matrix) {
      super();
      this.commands = [];
      this.recalc = 1;
      this.matrix = matrix;
      this.lastx = 0;
      this.lasty = 0;
      this._last_z = undefined;
      this._last_off = new Vector2();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.domnode = undefined;
      this.filternode = undefined;
      this.clip_users = new set();
      this.path_start_i = 0;
      this.first = true;
      this._mm = new MinMax(2);
    }
     update_aabb(draw, fast_mode=false) {
      var tmp=new Vector2();
      var mm=this._mm;
      var pad=this.pad = this.blur>0 ? this.blur*draw.zoom+15 : 0;
      mm.reset();
      if (fast_mode) {
          console.trace("FAST MODE!");
      }
      var prev=-1;
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=cs[i++];
        if (fast_mode&&prev!==BEGINPATH) {
            prev = cmd;
            i+=arglen;
            continue;
        }
        if (cmd!==LINETO&&cmd!==MOVETO&&cmd!==CUBICTO&&cmd!==BEZIERTO) {
            prev = cmd;
            continue;
        }
        for (var j=0; j<arglen; j+=2) {
            tmp[0] = cs[i++], tmp[1] = cs[i++];
            tmp.multVecMatrix(draw.matrix);
            mm.minmax(tmp);
        }
        prev = cmd;
      }
      this.aabb[0].load(mm.min).subScalar(pad);
      this.aabb[1].load(mm.max).addScalar(pad);
    }
     beginPath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(BEGINPATH);
    }
     undo() {
      this.commands.length = this.path_start_i;
    }
     _pushCmd() {
      var arglen=arguments.length-1;
      this.commands.push(arguments[0]);
      this.commands.push(arglen);
      for (var i=0; i<arglen; i++) {
          this.commands.push(arguments[i+1]);
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
          return ;
      }
      this._pushCmd(LINETO, x2, y2);
      this.lastx = x2;
      this.lasty = y2;
    }
     pushFill() {
      this._pushCmd(FILL);
    }
     pushStroke(color, width) {
      if (color) {
          let a=color[3]||1.0;
          this._pushCmd(STROKECOLOR, color[0], color[1], color[2], a, 0.5);
      }
      if (width) {
          this._pushCmd(STROKEWIDTH, width);
      }
      this._pushCmd(STROKE);
    }
     noAutoFill() {
      this._pushCmd(NOFILL);
    }
     destroy(draw) {

    }
     gen(draw, _check_tag=0) {

    }
     reset(draw) {
      this.commands.length = 0;
      this.path_start_i = 0;
      this.off.zero();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.first = true;
    }
     draw(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g, clipMode=false) {
      var zoom=draw.matrix.$matrix.m11;
      offx+=this.off[0], offy+=this.off[1];
      if (isNaN(offx)||isNaN(offy)) {
          throw new Error("nan!");
      }
      this._last_z = this.z;
      var g=draw.g;
      var tmp=new Vector3();
      let debuglog=function () {
        if (debug>1) {
            let time=performance.now();
            if (time-lasttime>5) {
                console.log(...arguments);
                lasttime = time;
            }
        }
      };
      let debuglog2=function () {
        if (debug>0) {
            let time=performance.now();
            if (time-lasttime>5) {
                console.log(...arguments);
                lasttime = time;
            }
        }
      };
      debuglog2("start "+this.id);
      let matrix=draw.matrix;
      g.beginPath();
      g.lineCap = "butt";
      g.miterLimit = 2.5;
      let cmds=this.commands;
      let i;
      let mat2=new Matrix4(draw.matrix);
      mat2.invert();
      function loadtemp(off) {
        tmp[0] = cmds[i+2+off*2];
        tmp[1] = cmds[i+3+off*2];
        tmp[2] = 0.0;
        tmp.multVecMatrix(draw.matrix);
        if (isNaN(tmp.dot(tmp))) {
            console.error("NaN", off);
        }
      }
      if (!clipMode&&this.clip_paths.length>0) {
          g.beginPath();
          g.save();
          for (let path of this.clip_paths) {
              path.draw(draw, offx, offy, canvas, g, true);
          }
          g.clip();
      }
      var doff=2500;
      var do_blur=this.blur>1&&!clipMode;
      if (do_blur) {
          g.filter = "blur("+(this.blur*0.25*zoom)+"px)";
      }
      else {
        g.filter = "none";
      }
      let no_fill=false;
      for (i = 0; i<cmds.length; i+=cmds[i+1]+2) {
          var cmd=cmds[i];
          switch (cmd) {
            case BEGINPATH:
              debuglog("BEGINPATH");
              g.beginPath();
              break;
            case LINETO:
              debuglog("LINETO");
              loadtemp(0);
              g.lineTo(tmp[0], tmp[1]);
              break;
            case BEZIERTO:
              debuglog("BEZIERTO");
              loadtemp(0);
              var x1=tmp[0], y1=tmp[1];
              loadtemp(1);
              g.quadraticCurveTo(x1, y1, tmp[0], tmp[1]);
              break;
            case CUBICTO:
              debuglog("CUBICTO");
              loadtemp(0);
              var x1=tmp[0], y1=tmp[1];
              loadtemp(1);
              var x2=tmp[0], y2=tmp[1];
              loadtemp(2);
              g.bezierCurveTo(x1, y1, x2, y2, tmp[0], tmp[1]);
              break;
            case MOVETO:
              debuglog("MOVETO");
              loadtemp(0);
              g.moveTo(tmp[0], tmp[1]);
              break;
            case STROKECOLOR:
              let r=cmds[i+2], g1=cmds[i+3], b=cmds[i+4], a=cmd[i+5];
              r = ~~(r*255);
              g1 = ~~(g1*255);
              b = ~~(b*255);
              a = a||1.0;
              g.strokeStyle = `rgba(${r},${g1},${b},${a})`;
              break;
            case STROKEWIDTH:
              let zoom=draw.matrix.$matrix.m11;
              g.lineWidth = cmds[i+2]*zoom;
              break;
            case STROKE:
              g.stroke();
              break;
            case FILL:
              g.fill();
              break;
            case NOFILL:
              no_fill = true;
              break;
          }
      }
      if (clipMode) {
          return ;
      }
      if (no_fill&&this.clip_paths.length>0) {
          g.restore();
          return ;
      }
      var r=~~(this.color[0]*255), g1=~~(this.color[1]*255), b=~~(this.color[2]*255), a=this.color[3];
      let fstyle="rgba("+r+","+g1+","+b+","+a+")";
      g.fillStyle = fstyle;
      debuglog2("g.fillStyle", g.fillStyle);
      debuglog2("fill");
      g.fill();
      if (this.clip_paths.length>0) {
          g.restore();
      }
    }
     update() {
      this.recalc = 1;
    }
  }
  _ESClass.register(SimpleCanvasPath);
  _es6_module.add_class(SimpleCanvasPath);
  SimpleCanvasPath = _es6_module.add_export('SimpleCanvasPath', SimpleCanvasPath);
  class SimpleCanvasDraw2D extends VectorDraw {
    
    
    
    
     constructor() {
      super();
      this.paths = [];
      this.path_idmap = {};
      this.dosort = true;
      this.matstack = new Array(256);
      this.matrix = new Matrix4();
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
    }
    static  get_canvas(id, width, height, zindex) {
      var ret=document.getElementById(id);
      if (ret===undefined) {
          ret = document.createElement("canvas");
          ret.id = id;
      }
      ret.width = width;
      ret.height = height;
      if (ret.style!==undefined) {
          ret.style["z-index"] = zindex;
      }
      return ret;
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          return false;
      }
      var path=this.path_idmap[id];
      return check_z ? path.z===z : true;
    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          this.path_idmap[id] = new SimpleCanvasPath(this.matrix);
          this.path_idmap[id].index = this.paths.length;
          this.path_idmap[id].id = id;
          this.dosort = 1;
          this.paths.push(this.path_idmap[id]);
      }
      var ret=this.path_idmap[id];
      ret.matrix.load(this.matrix);
      if (check_z&&ret.z!==z) {
          this.dosort = 1;
          ret.z = z;
      }
      return ret;
    }
     update() {
      console.warn("update called");
      for (let p of this.paths) {
          p.update();
      }
    }
    static  kill_canvas(svg) {

    }
     destroy() {

    }
     draw(g) {
      var canvas=g.canvas;
      this.canvas = canvas;
      this.g = g;
      g.save();
      g.resetTransform();
      for (var p of this.paths) {
          p.draw(this);
      }
      g.restore();
      return new Promise((accept, reject) =>        {
        accept();
      });
    }
     set_matrix(matrix) {
      super.set_matrix(matrix);
      this.zoom = matrix.$matrix.m11;
    }
  }
  _ESClass.register(SimpleCanvasDraw2D);
  _es6_module.add_class(SimpleCanvasDraw2D);
  SimpleCanvasDraw2D = _es6_module.add_export('SimpleCanvasDraw2D', SimpleCanvasDraw2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_canvas2d_simple.js');


es6_module_define('vectordraw_skia_simple', ["../util/mathlib.js", "./vectordraw_base.js"], function _vectordraw_skia_simple_module(_es6_module) {
  "use strict";
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorVertex');
  var PathBase=es6_import_item(_es6_module, './vectordraw_base.js', 'PathBase');
  var VectorDraw=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorDraw');
  function loadCanvasKit() {
    let script=document.createElement("script");
    script.setAttribute("type", "application/javascript");
    script.setAttribute("src", "node_modules/canvaskit-wasm/bin/canvaskit.js");
    script.addEventListener("load", () =>      {
      console.log("%cInitializing Skia. . .", "color: blue;");
      CanvasKitInit({locateFile: (file) =>          {
          return 'node_modules/canvaskit-wasm/bin/'+file;
        }}).then((CanvasKit) =>        {
        console.log("%c CanvasKit initialized", "color: blue");
        window.CanvasKit = CanvasKit;
      });
    });
    document.body.appendChild(script);
  }
  loadCanvasKit = _es6_module.add_export('loadCanvasKit', loadCanvasKit);
  window.loadCanvasKit = loadCanvasKit;
  let debug=0;
  window._setDebug = (d) =>    {
    debug = d;
  }
  let canvaspath_draw_args_tmps=new Array(8);
  for (let i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  let MOVETO=0, BEZIERTO=1, LINETO=2, BEGINPATH=3;
  let CUBICTO=4, LINEWIDTH=5, LINESTYLE=6, STROKE=7, FILL=8;
  let NS="http://www.w3.org/2000/svg";
  function makeElement(type, attrs) {
    if (attrs===undefined) {
        attrs = {};
    }
    let ret=document.createElementNS(NS, type);
    for (let k in attrs) {
        ret.setAttributeNS(null, k, attrs[k]);
    }
    return ret;
  }
  makeElement = _es6_module.add_export('makeElement', makeElement);
  let lasttime=performance.now();
  class SimpleSkiaPath extends PathBase {
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.autoFill = false;
      this.commands = [];
      this.recalc = 1;
      this.lastx = 0;
      this.lasty = 0;
      this._last_z = undefined;
      this._last_off = new Vector2();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.domnode = undefined;
      this.filternode = undefined;
      this.clip_users = new set();
      this.path_start_i = 0;
      this.first = true;
      this._mm = new MinMax(2);
    }
     update_aabb(draw, fast_mode=false) {
      let tmp=new Vector2();
      let mm=this._mm;
      let pad=this.pad = this.blur>0 ? this.blur*draw.zoom+15 : 0;
      mm.reset();
      if (fast_mode) {
          console.trace("FAST MODE!");
      }
      let prev=-1;
      let cs=this.commands, i=0;
      while (i<cs.length) {
        let cmd=cs[i++];
        let arglen=cs[i++];
        if (fast_mode&&prev!==BEGINPATH) {
            prev = cmd;
            i+=arglen;
            continue;
        }
        for (let j=0; j<arglen; j+=2) {
            tmp[0] = cs[i++], tmp[1] = cs[i++];
            tmp.multVecMatrix(draw.matrix);
            mm.minmax(tmp);
        }
        prev = cmd;
      }
      this.aabb[0].load(mm.min).subScalar(pad);
      this.aabb[1].load(mm.max).addScalar(pad);
    }
     beginPath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(BEGINPATH);
      return this;
    }
     pushStroke(color, width) {
      if (color) {
          let a=color.length>3 ? color[3] : 1.0;
          this._pushCmd(LINESTYLE, ~~(color[0]*255), ~~(color[1]*255), ~~(color[2]*255), a);
      }
      if (width!==undefined) {
          this._pushCmd(LINEWIDTH, width);
      }
      this._pushCmd(STROKE);
      return this;
    }
     pushFill() {
      this._pushCmd(FILL);
      return this;
    }
     noAutoFill() {
      this.autoFill = false;
      return this;
    }
     undo() {
      this.commands.length = this.path_start_i;
    }
     _pushCmd() {
      let arglen=arguments.length-1;
      this.commands.push(arguments[0]);
      this.commands.push(arglen);
      for (let i=0; i<arglen; i++) {
          this.commands.push(arguments[i+1]);
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
          return ;
      }
      this._pushCmd(LINETO, x2, y2);
      this.lastx = x2;
      this.lasty = y2;
    }
     destroy(draw) {

    }
     gen(draw, _check_tag=0) {

    }
     reset(draw) {
      this.commands.length = 0;
      this.path_start_i = 0;
      this.off.zero();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.first = true;
    }
     draw(draw, offx, offy, canvas=draw.canvsa, g=draw.g, clipMode=false) {
      return this.drawCanvas(...arguments);
    }
     drawCanvas(draw, offx=0, offy=0, canvas=draw.canvas, drawg=draw.g, clipMode=false) {
      let g=draw.g;
      let zoom=draw.matrix.$matrix.m11;
      offx+=this.off[0], offy+=this.off[1];
      if (isNaN(offx)||isNaN(offy)) {
          throw new Error("nan!");
      }
      this._last_z = this.z;
      let tmp=new Vector3();
      let debuglog=function () {
        if (debug>1) {
            let time=performance.now();
            if (time-lasttime>5) {
                console.log(...arguments);
                lasttime = time;
            }
        }
      };
      let debuglog2=function () {
        if (debug>0) {
            let time=performance.now();
            if (time-lasttime>5) {
                console.log(...arguments);
                lasttime = time;
            }
        }
      };
      debuglog2("start "+this.id);
      let matrix=draw.matrix;
      g.beginPath();
      let cmds=this.commands;
      let i;
      let mat2=new Matrix4(draw.matrix);
      mat2.invert();
      function loadtemp(off) {
        tmp[0] = cmds[i+2+off*2];
        tmp[1] = cmds[i+3+off*2];
        tmp[2] = 0.0;
        tmp.multVecMatrix(draw.matrix);
        if (isNaN(tmp.dot(tmp))) {
            throw new Error("NaN");
        }
      }
      let needRestore=false;
      if (!clipMode&&this.clip_paths.length>0) {
          needRestore = true;
          g.beginPath();
          g.save();
          for (let path of this.clip_paths) {
              path.draw(draw, offx, offy, canvas, g, true);
          }
      }
      let x1, y1, x2, y2;
      for (i = 0; i<cmds.length; i+=cmds[i+1]+2) {
          let cmd=cmds[i];
          switch (cmd) {
            case BEGINPATH:
              debuglog("BEGINPATH");
              g.beginPath();
              break;
            case LINEWIDTH:
              let mat=g.getTransform();
              g.lineWidth = cmd[i+2]*mat.m11;
              break;
            case LINESTYLE:
              let r=cmd[i+2], g1=cmd[i+3], b=cmd[i+4], a=cmd[i+5];
              let style="rgba("+r+","+g1+","+b+","+a+")";
              if (cmd===LINESTYLE) {
                  g.strokeStyle = style;
              }
              break;
            case FILL:
              if (!clipMode) {
                  g.fill();
              }
              else {
                g.clip();
              }
              break;
            case STROKE:
              g.stroke();
              break;
            case LINETO:
              debuglog("LINETO");
              loadtemp(0);
              g.lineTo(tmp[0], tmp[1]);
              break;
            case BEZIERTO:
{              debuglog("BEZIERTO");
              loadtemp(0);
              x1 = tmp[0], y1 = tmp[1];
              loadtemp(1);
              g.quadraticCurveTo(x1, y1, tmp[0], tmp[1]);
              break;
}
            case CUBICTO:
{              debuglog("CUBICTO");
              loadtemp(0);
              x1 = tmp[0], y1 = tmp[1];
              loadtemp(1);
              x2 = tmp[0], y2 = tmp[1];
              loadtemp(2);
              g.bezierCurveTo(x1, y1, x2, y2, tmp[0], tmp[1]);
              break;
}
            case MOVETO:
{              debuglog("MOVETO");
              loadtemp(0);
              g.moveTo(tmp[0], tmp[1]);
              break;
}
          }
      }
      let r=~~(this.color[0]*255), g1=~~(this.color[1]*255), b=~~(this.color[2]*255), a=this.color[3];
      let fstyle="rgba("+r+","+g1+","+b+","+a+")";
      g.fillStyle = fstyle;
      debuglog2("g.fillStyle", g.fillStyle);
      let doff=2500;
      let do_blur=Math.abs(this.blur)>1&&!clipMode;
      if (do_blur) {
          g.filter = "blur("+(Math.abs(this.blur)*0.25*zoom)+"px)";
      }
      else {
        g.filter = "none";
      }
      debuglog2("fill");
      if (clipMode) {
          g.clip();
      }
      else 
        if (!this.autoFill) {
          g.fill();
      }
      if (needRestore) {
          g.restore();
      }
    }
     update() {
      this.recalc = 1;
    }
  }
  _ESClass.register(SimpleSkiaPath);
  _es6_module.add_class(SimpleSkiaPath);
  SimpleSkiaPath = _es6_module.add_export('SimpleSkiaPath', SimpleSkiaPath);
  class SimpleSkiaDraw2D extends VectorDraw {
    
    
    
    
     constructor() {
      super();
      this.paths = [];
      this.path_idmap = {};
      this.dosort = true;
      this.matstack = new Array(256);
      this.matrix = new Matrix4();
      for (let i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
    }
    static  get_canvas(id, width, height, zindex) {
      let ret=document.getElementById(id);
      if (ret===undefined) {
          ret = document.createElement("canvas");
          ret.id = id;
      }
      ret.width = width;
      ret.height = height;
      if (ret.style!==undefined) {
          ret.style["z-index"] = zindex;
      }
      return ret;
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          return false;
      }
      let path=this.path_idmap[id];
      return check_z ? path.z===z : true;
    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          this.path_idmap[id] = new SimpleSkiaPath();
          this.path_idmap[id].index = this.paths.length;
          this.path_idmap[id].id = id;
          this.dosort = 1;
          this.paths.push(this.path_idmap[id]);
      }
      let ret=this.path_idmap[id];
      if (check_z&&ret.z!==z) {
          this.dosort = 1;
          ret.z = z;
      }
      return ret;
    }
     update() {
      console.warn("update called");
      for (let p of this.paths) {
          p.update();
      }
    }
    static  kill_canvas(svg) {

    }
     destroy() {

    }
     draw(finalg) {
      let canvas, g;
      let finalcanvas=finalg.canvas;
      if (0) {
          this.canvas = canvas = window.skcanvas;
          this.g = g = window.skg;
      }
      else 
        if (window.CanvasKit!==undefined) {
          canvas = CanvasKit.MakeCanvas(finalcanvas.width, finalcanvas.height);
          let g2=canvas.getContext("2d");
          g2.imageSmoothingEnabled = false;
          g2.lineWidth = 2;
          if (!g2.getTransform) {
              let matrixKey=undefined;
              for (let k in g2) {
                  let v=g2[k];
                  let ok=typeof v==="object"&&Array.isArray(v);
                  ok = ok&&(v.length===9||v.length===16);
                  if (ok) {
                      for (let item of v) {
                          if (typeof item!=="number") {
                              ok = false;
                              break;
                          }
                      }
                  }
                  if (ok) {
                      matrixKey = k;
                      break;
                  }
              }
              if (matrixKey) {
                  let d=new DOMMatrix();
                  g2.getTransform = function () {
                    let t=this[matrixKey];
                    d.m11 = t[0];
                    d.m12 = t[1];
                    d.m13 = t[2];
                    d.m21 = t[3];
                    d.m22 = t[4];
                    d.m23 = t[5];
                    d.m31 = t[6];
                    d.m32 = t[7];
                    d.m33 = t[8];
                    return d;
                  };
              }
              console.error("MATRIX_KEY", matrixKey);
          }
          this.canvas = canvas;
          this.g = g2;
          g = g2;
      }
      else {
        console.error("No Skia loaded!");
        g = this.g = finalg;
        canvas = this.canvas = finalcanvas;
      }
      g.resetTransform();
      g.clearRect(0, 0, this.canvas.width, this.canvas.height);
      g.fillStyle = "#EEE";
      g.beginPath();
      g.rect(0, 0, this.canvas.width, this.canvas.height);
      g.fillRect(0, 0, this.canvas.width, this.canvas.height);
      g.fill();
      g.save();
      g.resetTransform();
      for (let p of this.paths) {
          p.draw(this, undefined, undefined, this.canvas, this.g);
      }
      g.restore();
      if (g!==finalg) {
          window.CC = this.canvas;
          window.GG = this.g;
          this.canvas.cf.flush();
          let image=g.getImageData(0, 0, finalcanvas.width, finalcanvas.height);
          let image2=new ImageData(finalcanvas.width, finalcanvas.height);
          for (let i=0; i<image2.data.length; i+=4) {
              image2.data[i] = image.data[i];
              image2.data[i+1] = image.data[i+1];
              image2.data[i+2] = image.data[i+2];
              image2.data[i+3] = 255;
          }
          console.log(image, image2.data);
          let img=document.createElement("img");
          img.src = this.canvas.toDataURL();
          img.onload = () =>            {
            finalg.drawImage(img, 0, 0);
          };
          console.log(img.src);
          finalg.putImageData(image2, 0, 0);
          window.skcanvas = this.canvas;
          window.skg = this.g;
      }
      return new Promise((accept, reject) =>        {
        accept();
      });
    }
     set_matrix(matrix) {
      super.set_matrix(matrix);
      this.zoom = matrix.$matrix.m11;
    }
  }
  _ESClass.register(SimpleSkiaDraw2D);
  _es6_module.add_class(SimpleSkiaDraw2D);
  SimpleSkiaDraw2D = _es6_module.add_export('SimpleSkiaDraw2D', SimpleSkiaDraw2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_skia_simple.js');


es6_module_define('vectordraw_svg', ["../config/config.js", "./vectordraw_base.js", "../util/mathlib.js"], function _vectordraw_svg_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorVertex');
  var PathBase=es6_import_item(_es6_module, './vectordraw_base.js', 'PathBase');
  var VectorDraw=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorDraw');
  var canvaspath_draw_mat_tmps=new cachering((_) =>    {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(32);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function () {
    return new Vector2();
  }, 32);
  var CCMD=0, CARGLEN=1;
  var MOVETO=0, BEZIERTO=1, LINETO=2, BEGINPATH=3, CUBICTO=4, STROKE=5, STROKECOLOR=6, STROKEWIDTH=7, NOAUTOFILL=8, FILL=9;
  var NS="http://www.w3.org/2000/svg";
  var XLS="http://www.w3.org/1999/xlink";
  function makeElement(type, attrs) {
    if (attrs===undefined) {
        attrs = {};
    }
    var ret=document.createElementNS(NS, type);
    for (var k in attrs) {
        ret.setAttributeNS(null, k, attrs[k]);
    }
    return ret;
  }
  makeElement = _es6_module.add_export('makeElement', makeElement);
  class SVGPath extends PathBase {
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.commands = [];
      this.recalc = 1;
      this.lastx = 0;
      this.lasty = 0;
      this._last_z = undefined;
      this._last_off = new Vector2();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.domnode = undefined;
      this.filternode = undefined;
      this.clip_users = new set();
      this.path_start_i = 0;
      this.first = true;
      this._mm = new MinMax(2);
    }
     update_aabb(draw, fast_mode=false) {
      var tmp=new Vector2();
      var mm=this._mm;
      var pad=this.pad = this.blur>0 ? this.blur*draw.zoom+15 : 0;
      mm.reset();
      if (fast_mode) {
          console.trace("FAST MODE!");
      }
      var prev=-1;
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=cs[i++];
        if (fast_mode&&prev!==BEGINPATH) {
            prev = cmd;
            i+=arglen;
            continue;
        }
        if (cmd!==LINETO&&cmd!==CUBICTO&&cmd!==BEZIERTO&&cmd!==MOVETO) {
            continue;
        }
        for (var j=0; j<arglen; j+=2) {
            tmp[0] = cs[i++], tmp[1] = cs[i++];
            tmp.multVecMatrix(draw.matrix);
            mm.minmax(tmp);
        }
        prev = cmd;
      }
      this.aabb[0].load(mm.min).subScalar(pad);
      this.aabb[1].load(mm.max).addScalar(pad);
    }
     beginPath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(BEGINPATH);
    }
     undo() {
      this.commands.length = this.path_start_i;
    }
     pushFill() {
      this._pushCmd(FILL);
    }
     pushStroke(color, width) {
      if (color) {
          let a=color[3]||1.0;
          this._pushCmd(STROKECOLOR, color[0], color[1], color[2], a, 0.5);
      }
      if (width) {
          this._pushCmd(STROKEWIDTH, width);
      }
      this._pushCmd(STROKE);
    }
     noAutoFill() {
      this._pushCmd(NOAUTOFILL);
    }
     _pushCmd() {
      var arglen=arguments.length-1;
      this.commands.push(arguments[0]);
      this.commands.push(arglen);
      for (var i=0; i<arglen; i++) {
          this.commands.push(arguments[i+1]);
      }
      this.recalc = 1;
      this.first = false;
    }
     moveTo(x, y) {
      this._pushCmd(MOVETO, x, y);
      this.lastx = x;
      this.lasty = y;
    }
     bezierTo(x2, y2, x3, y3) {
      this._pushCmd(BEZIERTO, x2, y2, x3, y3);
      this.lastx = x3;
      this.lasty = y3;
    }
     cubicTo(x2, y2, x3, y3, x4, y4) {
      this._pushCmd(CUBICTO, x2, y2, x3, y3, x4, y4);
      this.lastx = x4;
      this.lasty = y4;
    }
     lineTo(x2, y2) {
      if (this.first) {
          this.moveTo(x2, y2);
          return ;
      }
      this._pushCmd(LINETO, x2, y2);
      this.lastx = x2;
      this.lasty = y2;
    }
     destroy(draw) {
      if (this.domnode) {
          this.domnode.remove();
          this.domnode = undefined;
      }
      if (this.filternode) {
          this.filternode.remove();
          this.filternode = undefined;
      }
      if (this.usenode) {
          this.usenode.remove();
          this.usenode = undefined;
      }
    }
     get_dom_id(draw, id2=0) {
      return draw.svg.id+"_path_"+this.id+"_"+id2;
    }
     gen(draw, _check_tag=0) {
      if (_check_tag&&!this.recalc) {
          console.log("infinite loop in clip stack");
          return ;
      }
      this.recalc = 0;
      var do_clip=this.clip_paths.length>0;
      var do_blur=this.blur>0.0;
      this.update_aabb(draw);
      var w=this.size[0] = Math.ceil(this.aabb[1][0]-this.aabb[0][0]);
      var h=this.size[1] = Math.ceil(this.aabb[1][1]-this.aabb[0][1]);
      if (w>config.MAX_CANVAS2D_VECTOR_CACHE_SIZE||h>config.MAX_CANVAS2D_VECTOR_CACHE_SIZE) {
          var w2=Math.min(w, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
          var h2=Math.min(h, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
          var dw=w-w2, dh=h-h2;
          this.aabb[0][0]+=dw*0.5;
          this.aabb[0][1]+=dh*0.5;
          this.aabb[1][0]-=dw*0.5;
          this.aabb[1][1]-=dh*0.5;
          this.size[0] = w2;
          this.size[1] = h2;
          w = w2, h = h2;
      }
      var domid=this.get_dom_id(draw);
      var node=this.domnode;
      if (!node) {
          node = this.domnode = document.getElementById(domid);
          if (!node) {
              node = this.domnode = makeElement("path");
              node.id = domid;
              node.setAttributeNS(null, "id", domid);
              draw.defs.appendChild(node);
              var useid=domid+"_use";
              var usenode=document.getElementById(useid);
              if (usenode) {
                  usenode.remove();
              }
              usenode = makeElement("use", {"id": useid});
              usenode.setAttributeNS(XLS, "xlink:href", "#"+domid);
              draw.group.appendChild(usenode);
              this.usenode = usenode;
          }
      }
      if (!this.usenode) {
          this.usenode = document.getElementById(domid+"_use");
      }
      for (var i=0; i<draw.group.childNodes.length; i++) {
          if (draw.group.childNodes[i]===this.usenode) {
              this._last_z = i;
              break;
          }
      }
      var fid=draw.svg.id+"_"+this.id+"_blur";
      var blur, filter;
      if (this.blur*draw.zoom>1) {
          if (!this.filternode) {
              filter = this.filternode = document.getElementById(fid);
          }
          else {
            filter = this.filternode;
          }
          var w2=w-this.pad*2, h2=h-this.pad*2;
          var wratio=2.0*(w/w2)*100.0, hratio=2.0*(h/h2)*100.0;
          var fx=""+(-wratio/4)+"%", fy=""+(-hratio/4)+"%", fwidth=""+wratio+"%", fheight=""+hratio+"%";
          if (!filter) {
              var defs=draw.defs;
              var filter=this.filternode = makeElement("filter", {id: fid, 
         x: fx, 
         y: fy, 
         width: fwidth, 
         height: fheight});
              var blur=makeElement("feGaussianBlur", {stdDeviation: ~~(Math.abs(this.blur*draw.zoom*0.25)), 
         "in": "SourceGraphic"});
              filter.appendChild(blur);
              defs.appendChild(filter);
              node.setAttributeNS(null, "filter", "url(#"+fid+")");
          }
          else {
            if (filter.getAttributeNS(null, "x")!==fx)
              filter.setAttributeNS(null, "x", fx);
            if (filter.getAttributeNS(null, "y")!==fy)
              filter.setAttributeNS(null, "y", fy);
            if (filter.getAttributeNS(null, "width")!==fwidth)
              filter.setAttributeNS(null, "width", fwidth);
            if (filter.getAttributeNS(null, "height")!==fheight)
              filter.setAttributeNS(null, "hratio", fheight);
            blur = filter.childNodes[0];
            if (!blur.hasAttributeNS(null, "stdDeviation")||parseFloat(blur.getAttributeNS(null, "stdDeviation"))!==~~(this.blur*draw.zoom*0.5)) {
                blur.setAttributeNS(null, "stdDeviation", ~~(this.blur*draw.zoom*0.5));
            }
          }
      }
      else 
        if (this.filternode) {
          node.removeAttributeNS(null, "filter");
          this.filternode.remove();
          this.filternode = undefined;
      }
      var clipid=draw.svg.id+"_"+this.id+"_clip";
      if (this.clip_paths.length>0) {
          var clip=this.clipnode;
          if (!clip) {
              clip = this.clipnode = document.getElementById(clipid);
          }
          if (!clip) {
              clip = this.clipnode = makeElement("clipPath", {id: clipid});
              draw.defs.appendChild(clip);
              for (var path of this.clip_paths) {
                  if (path.recalc) {
                      console.log("  clipping subgen!");
                      path.gen(draw, 1);
                  }
                  var usenode=makeElement("use");
                  usenode.setAttributeNS(XLS, "xlink:href", "#"+path.domnode.getAttributeNS(null, "id"));
                  clip.appendChild(usenode);
              }
          }
          node.setAttributeNS(null, "clip-path", "url(#"+clipid+")");
      }
      else 
        if (this.clipnode) {
          node.removeAttributeNS(null, "clip-path");
          this.clipnode.remove();
          this.clipnode = undefined;
      }
      var mat=canvaspath_draw_mat_tmps.next();
      mat.load(draw.matrix);
      var co=canvaspath_draw_vs.next().zero();
      if (!node) {
          node = document.getElementById(domid);
          console.log("undefined node!", this.domnode, document.getElementById(domid), domid);
          return ;
      }
      var r=~~(this.color[0]*255), g=~~(this.color[1]*255), b=~~(this.color[2]*255), a=this.color[3];
      node.setAttributeNS(null, "fill", "rgba("+r+","+g+","+b+","+a+")");
      var d="";
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=cs[i++];
        var tmp=canvaspath_draw_args_tmps[arglen];
        var h=parseFloat(draw.svg.getAttributeNS(null, "height"));
        switch (cmd) {
          case STROKE:
            break;
          case STROKECOLOR:
            let r=cs[i++], g2=cs[i++], b=cs[i++], a=cs[i++];
            r = ~~(r*255);
            g2 = ~~(g2*255);
            b = ~~(b*255);
            a = a||1.0;
            node.setAttributeNS(null, "fill", "rgba("+r+","+g2+","+b+","+a+")");
            break;
          case STROKEWIDTH:
            let w=cs[i++];
            break;
          case MOVETO:
          case LINETO:
          case CUBICTO:
          case BEZIERTO:
          case BEGINPATH:
{            for (var j=0; j<arglen; j+=2) {
                co[0] = cs[i++], co[1] = cs[i++];
                co.multVecMatrix(mat);
                if (isNaN(co[0])) {
                    co[0] = 0;
                }
                if (isNaN(co[1])) {
                    co[1] = 0;
                }
                tmp[j] = co[0], tmp[j+1] = co[1];
            }
            switch (cmd) {
              case MOVETO:
                d+="M"+tmp[0]+" "+tmp[1];
                break;
              case LINETO:
                d+="L"+tmp[0]+" "+tmp[1];
                break;
              case BEZIERTO:
                d+="Q"+tmp[0]+" "+tmp[1]+" "+tmp[2]+" "+tmp[3];
                break;
              case CUBICTO:
                d+="C"+tmp[0]+" "+tmp[1]+" "+tmp[2]+" "+tmp[3]+" "+tmp[4]+" "+tmp[5];
                break;
              case BEGINPATH:
                break;
            }
            break;
}
          default:
            i+=arglen;
            break;
        }
      }
      node.setAttributeNS(null, "d", d);
    }
     reset(draw) {
      this.commands.length = 0;
      this.path_start_i = 0;
      this.off.zero();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.first = true;
    }
     draw(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g) {
      offx+=this.off[0], offy+=this.off[1];
      this._last_z = this.z;
      if (this.recalc) {
          this.recalc = 0;
          this.gen(draw);
      }
      if (this._last_off[0]!==offx||this._last_off[1]!==offy) {
          this._last_off[0] = offx;
          this._last_off[1] = offy;
          var transform="translate("+offx+","+offy+")";
          this.usenode.setAttributeNS(null, "transform", transform);
      }
    }
     update() {
      this.recalc = 1;
    }
  }
  _ESClass.register(SVGPath);
  _es6_module.add_class(SVGPath);
  SVGPath = _es6_module.add_export('SVGPath', SVGPath);
  class SVGDraw2D extends VectorDraw {
    
    
    
    
     constructor() {
      super();
      this.paths = [];
      this.path_idmap = {};
      this.dosort = true;
      this.matstack = new Array(256);
      this.matrix = new Matrix4();
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
    }
    static  get_canvas(id, width, height, zindex) {
      var ret=document.getElementById(id);
      if (!ret) {
          ret = makeElement("svg", {width: width, 
       height: height});
          ret.id = id;
          ret.setAttributeNS(null, "id", id);
          ret.style["position"] = "absolute";
          ret.style["z-index"] = zindex;
          console.trace("\tZINDEX: ", zindex);
          document.body.appendChild(ret);
      }
      if (ret.width!==width) {
          ret.setAttributeNS(null, "width", width);
      }
      if (ret.height!==height) {
          ret.setAttributeNS(null, "height", height);
      }
      return ret;
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          return false;
      }
      var path=this.path_idmap[id];
      return check_z ? path.z===z : true;
    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          this.path_idmap[id] = new SVGPath();
          this.path_idmap[id].index = this.paths.length;
          this.path_idmap[id].id = id;
          this.paths.push(this.path_idmap[id]);
      }
      var ret=this.path_idmap[id];
      if (check_z&&ret.z!==z) {
          this.dosort = 1;
          ret.z = z;
      }
      return ret;
    }
     update() {
      for (var path of this.paths) {

      }
    }
    static  kill_canvas(svg) {
      if (svg) {
          svg.remove();
      }
    }
     destroy() {
      console.log("DESTROY!");
      for (var path of this.paths) {
          path.destroy(this);
      }
      this.paths.length = 0;
      this.path_idmap = {};
      if (this.svg) {
          this.svg.remove();
          this.svg = this.defs = undefined;
      }
    }
     draw(g) {
      var canvas=g.canvas;
      let updateKey=""+this.matrix.$matrix.m11.toFixed(4)+":"+this.matrix.$matrix.m41.toFixed(2)+":"+this.matrix.$matrix.m42.toFixed(2);
      let recalc_all=false;
      if (updateKey!==this._last_update_key) {
          recalc_all = true;
          this._last_update_key = updateKey;
      }
      if (canvas.style["background"]!=="rgba(0,0,0,0)") {
          canvas.style["background"] = "rgba(0,0,0,0)";
      }
      let dpi=devicePixelRatio;
      this.svg = SVGDraw2D.get_canvas(canvas.id+"_svg", canvas.width, canvas.height, 1);
      this.svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      this.svg.setAttribute(`xmlns:xlink`, "http://www.w3.org/1999/xlink");
      this.svg.style["pointer-events"] = "none";
      var this2=this;
      function onkillscreen() {
        window.removeEventListener(onkillscreen);
        SVGDraw2D.kill_canvas(this2.svg);
        this2.svg = undefined;
      }
      window.addEventListener("killscreen", onkillscreen);
      var defsid=this.svg.id+"_defs";
      var defs=document.getElementById(defsid);
      if (!defs) {
          defs = makeElement("defs", {id: defsid});
          defs.id = defsid;
          this.svg.appendChild(defs);
      }
      this.defs = defs;
      var groupid=this.svg.id+"_maingroup";
      var group=document.getElementById(groupid);
      if (!group) {
          group = makeElement("g", {id: groupid});
          this.svg.appendChild(group);
      }
      this.group = group;
      if (this.svg.style["width"]!==canvas.style["width"])
        this.svg.style["width"] = canvas.style["width"];
      if (this.svg.style["height"]!==canvas.style["height"])
        this.svg.style["height"] = canvas.style["height"];
      if (this.svg.style["left"]!==canvas.style["left"])
        this.svg.style["left"] = canvas.style["left"];
      if (this.svg.style["top"]!==canvas.style["top"])
        this.svg.style["top"] = canvas.style["top"];
      for (let path of this.paths) {
          if (path.z!==path._last_z) {
              this.dosort = 1;
              path.recalc = 1;
              path._last_z = path.z;
          }
      }
      for (let path of this.paths) {
          if (path.recalc||recalc_all) {
              path.gen(this);
          }
      }
      if (this.dosort) {
          console.log("SVG sort!");
          this.dosort = 0;
          this.paths.sort(function (a, b) {
            return a.z-b.z;
          });
          var cs=this.group.childNodes;
          for (var i=0; i<cs.length; i++) {
              var n=cs[i];
              if (n.tagName.toUpperCase()==="USE") {
                  n.remove();
                  i--;
              }
          }
          for (var path of this.paths) {
              if (path.hidden) {
                  path.usenode = undefined;
                  continue;
              }
              var useid=path.get_dom_id(this)+"_use";
              var usenode=path.usenode = makeElement("use", {"id": useid});
              usenode.setAttributeNS(XLS, "xlink:href", "#"+path.get_dom_id(this));
              path._last_off[0] = path._last_off[1] = 1e+17;
              this.group.appendChild(usenode);
          }
      }
      for (let path of this.paths) {
          if (!path.hidden)
            path.draw(this);
      }
    }
     set_matrix(matrix) {
      super.set_matrix(matrix);
      this.zoom = matrix.$matrix.m11;
    }
  }
  _ESClass.register(SVGDraw2D);
  _es6_module.add_class(SVGDraw2D);
  SVGDraw2D = _es6_module.add_export('SVGDraw2D', SVGDraw2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_svg.js');


es6_module_define('vectordraw_canvas2d_jobs', [], function _vectordraw_canvas2d_jobs_module(_es6_module) {
}, '/dev/fairmotion/src/vectordraw/vectordraw_canvas2d_jobs.js');


es6_module_define('vectordraw_jobs', ["./vectordraw_jobs_base.js", "../config/config.js", "../../platforms/platform.js", "../path.ux/scripts/util/simple_events.js"], function _vectordraw_jobs_module(_es6_module) {
  "use strict";
  var MESSAGES=es6_import_item(_es6_module, './vectordraw_jobs_base.js', 'MESSAGES');
  let MS=MESSAGES;
  let Debug=0;
  let freeze_while_drawing=false;
  var platform=es6_import(_es6_module, '../../platforms/platform.js');
  var config=es6_import(_es6_module, '../config/config.js');
  var pushModalLight=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'popModalLight');
  var keymap=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'keymap');
  let MAX_THREADS=platform.app.numberOfCPUs()+1;
  MAX_THREADS = Math.max(MAX_THREADS, 2);
  if (config.HTML5_APP_MODE||config.NO_RENDER_WORKERS) {
      MAX_THREADS = 1;
  }
  window.MAX_THREADS = MAX_THREADS;
  class Thread  {
    
    
    
    
    
    
    
    
     constructor(worker, id, manager) {
      this.id = id;
      this.manager = manager;
      this.worker = worker;
      this.dead = false;
      this.queue = [];
      this.ready = false;
      this.lock = 0;
      this.owner = undefined;
      this.msgstate = undefined;
      worker.onmessage = this.onmessage.bind(this);
      this.ondone = null;
      this.callbacks = {};
      this.ownerid_msgid_map = {};
      this.msgid_ownerid_map = {};
      this.cancelset = new Set();
      this.freezelvl = 0;
    }
     cancelRenderJob(ownerid) {
      if (this.cancelset.has(ownerid)) {
          return ;
      }
      if (ownerid in this.ownerid_msgid_map) {
          if (Debug)
            console.log("cancelling job ", ownerid, "in thread", this.manager.threads.indexOf(this), "freezelvl:", this.freezelvl);
          this.freezelvl--;
          let oldid=this.msgid_ownerid_map[ownerid];
          this.postMessage(MS.CANCEL_JOB, oldid);
          delete this.ownerid_msgid_map[ownerid];
          delete this.msgid_ownerid_map[oldid];
      }
      else {
        if (Debug)
          console.log("Bad owner id", ownerid);
      }
    }
     postRenderJob(ownerid, commands, datablocks) {
      let id=this.manager._rthread_idgen++;
      if (Debug)
        console.log("thread", this.manager.threads.indexOf(this), "freezelvl:", this.freezelvl);
      this.freezelvl++;
      this.ownerid_msgid_map[ownerid] = id;
      this.msgid_ownerid_map[id] = ownerid;
      this.postMessage(MS.NEW_JOB, id, undefined);
      this.postMessage(MS.SET_COMMANDS, id, [commands.buffer]);
      if (datablocks!==undefined) {
          for (let block of datablocks) {
              this.postMessage(MS.ADD_DATABLOCK, id, [block]);
          }
      }
      return new Promise((accept, reject) =>        {
        let callback=(data) =>          {
          accept(data);
        }
        this.callbacks[id] = callback;
        this.postMessage(MS.RUN, id);
      });
    }
     clearOutstandingJobs() {
      this.freezelvl = 0;
      this.postMessage(MS.CLEAR_QUEUE, 0);
      this.callback = {};
      this.msgid_ownerid_map = {};
      this.ownerid_msgid_map = {};
    }
     onmessage(e) {
      switch (e.data.type) {
        case MS.WORKER_READY:
          console.log("%c Vectordraw worker ready", "color: blue");
          this.ready = true;
          this.manager.has_ready_thread = true;
          break;
        case MS.RESULT:
          let id=e.data.msgid;
          if (!(id in this.callbacks)) {
              if (Debug)
                console.warn("Renderthread callback not found for: ", id);
              return ;
          }
          let ownerid=this.msgid_ownerid_map[id];
          if (ownerid===undefined) {
              if (Debug)
                console.log("failed to find owner for", id, this);
              return ;
          }
          delete this.ownerid_msgid_map[ownerid];
          delete this.msgid_ownerid_map[id];
          let cb=this.callbacks[id];
          delete this.callbacks[id];
          this.freezelvl--;
          if (Debug)
            console.log("thread", this.manager.threads.indexOf(this), "freezelvl:", this.freezelvl);
          if (Debug)
            console.log(cb, e.data.data[0]);
          cb(e.data.data[0]);
          if (this.freezelvl<=0) {
              this.manager.on_thread_done(this);
              this.freezelvl = 0;
          }
          break;
      }
      if (Debug)
        console.log("event message in main thread", e);
    }
     tryLock(owner) {
      if (this.lock===0||this.owner===owner) {
          return true;
      }
      return false;
    }
     tryUnlock(owner) {
      if (this.lock===0||this.owner!==owner) {
          return false;
      }
      this.owner = undefined;
      this.lock = 0;
      return true;
    }
     postMessage(type, msgid, transfers) {
      this.worker.postMessage({type: type, 
     msgid: msgid, 
     data: transfers}, transfers);
    }
     close() {
      if (this.worker!==undefined) {
          this.worker.terminate();
          this.worker = undefined;
      }
      else {
        console.warn("Worker already killed once", this.id);
      }
    }
  }
  _ESClass.register(Thread);
  _es6_module.add_class(Thread);
  Thread = _es6_module.add_export('Thread', Thread);
  class ThreadManager  {
    
    
    
    
     constructor() {
      this.threads = [];
      this.drawing = false;
      this.thread_idmap = {};
      this._idgen = 0;
      this._rthread_idgen = 0;
      this.max_threads = MAX_THREADS;
      this.start_time = undefined;
      window.setInterval(() =>        {
        if (this.drawing&&time_ms()-this.start_time>750) {
            console.log("Draw timed out; aborting draw freeze");
            this.endDrawing();
        }
        return ;
      }, 750);
    }
     setMaxThreads(n) {
      if (n===undefined||typeof n!="number"||n<0) {
          throw new Error("n must be a number");
      }
      this.max_threads = n;
      while (this.threads.length>n) {
        let thread=this.threads.pop();
        thread.worker.terminate();
      }
      while (this.threads.length<n) {
        if (config.HAVE_SKIA) {
            this.spawnThread("vectordraw_skia_worker.js");
        }
        else {
          this.spawnThread("vectordraw_canvas2d_worker.js");
        }
      }
    }
     startDrawing() {
      this.drawing = true;
      this.start_time = time_ms();
      if (freeze_while_drawing) {
          console.log("%cFreeze Drawing", "color : orange;");
          window._block_drawing = true;
      }
    }
     endDrawing() {
      this.drawing = false;
      if (freeze_while_drawing) {
          console.log("%cUnfreeze Drawing", "color : orange;");
          window._block_drawing = false;
      }
    }
     spawnThread(source) {
      let worker=new Worker(source);
      let thread=new Thread(worker, this._idgen++, this);
      this.thread_idmap[thread.id] = thread;
      this.threads.push(thread);
      return thread;
    }
     endThread(thread) {
      if (thread.worker===undefined) {
          console.warn("Double call to ThreadManager.endThread()");
          return ;
      }
      this.threads.remove(thread);
      delete this.thread_idmap[thread.id];
      thread.close();
    }
     getRandomThread() {
      while (1) {
        let ri=~~(Math.random()*this.threads.length*0.99999);
        if (this.threads[ri].ready)
          return this.threads[ri];
      }
    }
     postRenderJob(ownerid, commands, datablocks) {
      if (!this.drawing&&freeze_while_drawing) {
          this.startDrawing();
      }
      let thread;
      if (this.threads.length===0) {
          thread = this.spawnThread("vectordraw_canvas2d_worker.js");
          thread.ready = true;
          for (let i=0; i<this.max_threads-1; i++) {
              if (config.HAVE_SKIA) {
                  this.spawnThread("vectordraw_skia_worker.js");
              }
              else {
                this.spawnThread("vectordraw_canvas2d_worker.js");
              }
          }
      }
      else {
        thread = this.getRandomThread();
      }
      let ret=thread.postRenderJob(ownerid, commands, datablocks);
      return ret;
    }
     on_thread_done(thread) {
      let ok=true;
      for (let thread2 of this.threads) {
          if (thread2.freezelvl>0) {
              ok = false;
              break;
          }
      }
      if (ok) {
          if (Debug)
            console.warn("thread done");
          window._all_draw_jobs_done();
          if (this.drawing&&freeze_while_drawing) {
              this.endDrawing();
          }
          this.checkMemory();
      }
    }
     checkMemory() {
      let promise=platform.app.getProcessMemoryPromise();
      if (!promise)
        return ;
      promise.then((memory) =>        {      });
    }
     cancelAllJobs() {
      for (let thread of this.threads) {
          thread.clearOutstandingJobs();
          this.on_thread_done(thread);
      }
    }
     cancelRenderJob(ownerid) {
      for (let thread of this.threads) {
          if (ownerid in thread.ownerid_msgid_map) {
              thread.cancelRenderJob(ownerid);
          }
      }
    }
  }
  _ESClass.register(ThreadManager);
  _es6_module.add_class(ThreadManager);
  ThreadManager = _es6_module.add_export('ThreadManager', ThreadManager);
  var manager=new ThreadManager();
  manager = _es6_module.add_export('manager', manager);
  function test() {
    let thread=manager.spawnThread("vectordraw_canvas2d_worker.js");
    thread.postMessage("yay", [new ArrayBuffer(512)]);
    return thread;
  }
  test = _es6_module.add_export('test', test);
}, '/dev/fairmotion/src/vectordraw/vectordraw_jobs.js');


es6_module_define('vectordraw_jobs_base', [], function _vectordraw_jobs_base_module(_es6_module) {
  var OPCODES={LINESTYLE: 0, 
   LINEWIDTH: 1, 
   FILLSTYLE: 2, 
   BEGINPATH: 3, 
   CLOSEPATH: 4, 
   MOVETO: 5, 
   LINETO: 6, 
   RECT: 7, 
   ARC: 8, 
   CUBIC: 9, 
   QUADRATIC: 10, 
   STROKE: 11, 
   FILL: 12, 
   SAVE: 13, 
   RESTORE: 14, 
   TRANSLATE: 15, 
   ROTATE: 16, 
   SCALE: 17, 
   SETBLUR: 18, 
   SETCOMPOSITE: 19, 
   CLIP: 20, 
   DRAWIMAGE: 21, 
   PUTIMAGE: 22, 
   SETTRANSFORM: 23}
  OPCODES = _es6_module.add_export('OPCODES', OPCODES);
  var MESSAGES={NEW_JOB: 0, 
   ADD_DATABLOCK: 1, 
   SET_COMMANDS: 2, 
   RUN: 3, 
   ERROR: 10, 
   RESULT: 11, 
   ACK: 12, 
   CLEAR_QUEUE: 13, 
   CANCEL_JOB: 14, 
   WORKER_READY: 15}
  MESSAGES = _es6_module.add_export('MESSAGES', MESSAGES);
  var CompositeModes={"source-over": 0, 
   "source-atop": 1}
  CompositeModes = _es6_module.add_export('CompositeModes', CompositeModes);
}, '/dev/fairmotion/src/vectordraw/vectordraw_jobs_base.js');


es6_module_define('vectordraw', ["./vectordraw_stub.js", "./vectordraw_canvas2d_simple.js", "./vectordraw_svg.js", "./vectordraw_skia_simple.js", "./vectordraw_canvas2d_path2d.js", "./vectordraw_base.js", "./vectordraw_canvas2d.js"], function _vectordraw_module(_es6_module) {
  "use strict";
  var CanvasDraw2D=es6_import_item(_es6_module, './vectordraw_canvas2d.js', 'CanvasDraw2D');
  var CanvasPath=es6_import_item(_es6_module, './vectordraw_canvas2d.js', 'CanvasPath');
  var StubCanvasDraw2D=es6_import_item(_es6_module, './vectordraw_stub.js', 'StubCanvasDraw2D');
  var StubCanvasPath=es6_import_item(_es6_module, './vectordraw_stub.js', 'StubCanvasPath');
  var SVGDraw2D=es6_import_item(_es6_module, './vectordraw_svg.js', 'SVGDraw2D');
  var SVGPath=es6_import_item(_es6_module, './vectordraw_svg.js', 'SVGPath');
  let _ex_VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  _es6_module.add_export('VectorFlags', _ex_VectorFlags, true);
  var SimpleCanvasPath=es6_import_item(_es6_module, './vectordraw_canvas2d_simple.js', 'SimpleCanvasPath');
  var SimpleCanvasDraw2D=es6_import_item(_es6_module, './vectordraw_canvas2d_simple.js', 'SimpleCanvasDraw2D');
  var Path2DPath=es6_import_item(_es6_module, './vectordraw_canvas2d_path2d.js', 'Path2DPath');
  var CanvasPath2D=es6_import_item(_es6_module, './vectordraw_canvas2d_path2d.js', 'CanvasPath2D');
  var SimpleSkiaDraw2D=es6_import_item(_es6_module, './vectordraw_skia_simple.js', 'SimpleSkiaDraw2D');
  var SimpleSkiaPath=es6_import_item(_es6_module, './vectordraw_skia_simple.js', 'SimpleSkiaPath');
  var loadCanvasKit=es6_import_item(_es6_module, './vectordraw_skia_simple.js', 'loadCanvasKit');
  var ___vectordraw_canvas2d_simple_js=es6_import(_es6_module, './vectordraw_canvas2d_simple.js');
  for (let k in ___vectordraw_canvas2d_simple_js) {
      _es6_module.add_export(k, ___vectordraw_canvas2d_simple_js[k], true);
  }
  let Canvas=CanvasDraw2D;
  Canvas = _es6_module.add_export('Canvas', Canvas);
  let Path=CanvasPath;
  Path = _es6_module.add_export('Path', Path);
}, '/dev/fairmotion/src/vectordraw/vectordraw.js');


es6_module_define('strokedraw', [], function _strokedraw_module(_es6_module) {
  "use strict";
}, '/dev/fairmotion/src/vectordraw/strokedraw.js');


es6_module_define('webgl', ["../path.ux/scripts/pathux.js"], function _webgl_module(_es6_module) {
  "use strict";
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  var Vector3=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector3');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Matrix4');
  var Vector4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Quat');
  var Vector2=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector2');
  let STRUCT=nstructjs.STRUCT;
  const constmap={}
  _es6_module.add_export('constmap', constmap);
  let TEXTURE_2D=3553;
  class IntUniform  {
     constructor(val) {
      this.val = val;
    }
  }
  _ESClass.register(IntUniform);
  _es6_module.add_class(IntUniform);
  IntUniform = _es6_module.add_export('IntUniform', IntUniform);
  function initDebugGL(gl) {
    let addfuncs={}
    let makeDebugFunc=(k, k2) =>      {
      return function () {
        let ret=this[k2].apply(this, arguments);
        let err=this.getError();
        if (err!==0) {
            console.warn("gl."+k+":", constmap[err]);
        }
        return ret;
      }
    }
    for (let k in gl) {
        let v=gl[k];
        if (k!=="getError"&&typeof v==="function") {
            let k2="_"+k;
            addfuncs[k2] = v;
            gl[k] = makeDebugFunc(k, k2);
        }
    }
    for (let k in addfuncs) {
        gl[k] = addfuncs[k];
    }
    return gl;
  }
  initDebugGL = _es6_module.add_export('initDebugGL', initDebugGL);
  let _gl=undefined;
  function addFastParameterGet(gl) {
    let map={}
    gl._getParameter = gl.getParameter;
    gl._enable = gl.enable;
    gl._disable = gl.disable;
    gl._viewport = gl.viewport;
    gl._scissor = gl.scissor;
    gl._depthMask = gl.depthMask;
    let validkeys=new Set([gl.DEPTH_TEST, gl.MAX_VERTEX_ATTRIBS, gl.DEPTH_WRITEMASK, gl.SCISSOR_BOX, gl.VIEWPORT]);
    gl.depthMask = function (mask) {
      mask = !!mask;
      if (mask!==map[gl.DEPTH_WRITEMASK]) {
          map[gl.DEPTH_WRITEMASK] = mask;
          gl._depthMask(mask);
      }
    }
    gl.viewport = function (x, y, w, h) {
      if (map[gl.VIEWPORT]===undefined) {
          map[gl.VIEWPORT] = [x, y, w, h];
      }
      else {
        let box=map[gl.VIEWPORT];
        box[0] = x;
        box[1] = y;
        box[2] = w;
        box[3] = h;
      }
      return gl._viewport(x, y, w, h);
    }
    gl.scissor = function (x, y, w, h) {
      if (map[gl.SCISSOR_BOX]===undefined) {
          map[gl.SCISSOR_BOX] = [x, y, w, h];
      }
      else {
        let box=map[gl.SCISSOR_BOX];
        box[0] = x;
        box[1] = y;
        box[2] = w;
        box[3] = h;
      }
      return gl._scissor(x, y, w, h);
    }
    gl.enable = function (p) {
      if (p in map&&map[p]) {
          return ;
      }
      map[p] = true;
      return gl._enable(p);
    }
    gl.disable = function (p) {
      if (p in map&&!map[p]) {
          return ;
      }
      map[p] = false;
      gl._disable(p);
    }
    gl.getParameter = function (p) {
      if (p!==undefined&&!validkeys.has(p)) {
          return gl._getParameter(p);
      }
      if (p in map) {
          return map[p];
      }
      map[p] = this._getParameter(p);
      if (map[p]&&Array.isArray(map[p])) {
          let cpy=[];
          for (let item of map[p]) {
              cpy.push(item);
          }
          map[p] = cpy;
      }
      return map[p];
    }
  }
  addFastParameterGet = _es6_module.add_export('addFastParameterGet', addFastParameterGet);
  function onContextLost(e) {
    for (let k in shapes) {
        shapes[k].onContextLost(e);
    }
  }
  onContextLost = _es6_module.add_export('onContextLost', onContextLost);
  function init_webgl(canvas, params) {
    if (params===undefined) {
        params = {};
    }
    if (_gl!==undefined) {
        return _gl;
    }
    let webgl2=params.webgl2!==undefined ? params.webgl2 : true;
    let gl;
    if (webgl2) {
        gl = canvas.getContext("webgl2", params);
        gl.color_buffer_float = gl.getExtension("EXT_color_buffer_float");
    }
    else {
      gl = canvas.getContext("webgl", params);
      if (!gl.RGBA32F) {
          gl.RGBA32F = gl.RGBA;
          gl.RGBA8UI = gl.RGBA;
      }
      gl.getExtension("EXT_frag_depth");
      gl.color_buffer_float = gl.getExtension("WEBGL_color_buffer_float");
      gl.texture_float = gl.getExtension("OES_texture_float");
    }
    canvas.addEventListener("webglcontextlost", function (event) {
      event.preventDefault();
    }, false);
    canvas.addEventListener("webglcontextrestored", onContextLost, false);
    addFastParameterGet(gl);
    _gl = gl;
    gl.haveWebGL2 = webgl2;
    for (let k in gl) {
        let v=gl[k];
        if (typeof v=="number"||typeof v=="string") {
            constmap[v] = k;
        }
    }
    window._constmap = constmap;
    gl.texture_float = gl.getExtension("OES_texture_float_linear");
    gl.float_blend = gl.getExtension("EXT_float_blend");
    gl.getExtension("OES_standard_derivatives");
    gl.getExtension("ANGLE_instanced_arrays");
    gl.getExtension("WEBGL_lose_context");
    gl.draw_buffers = gl.getExtension("WEBGL_draw_buffers");
    gl.depth_texture = gl.getExtension("WEBGL_depth_texture");
    gl.shadercache = {}
    if (DEBUG.gl) {
        initDebugGL(gl);
    }
    return gl;
  }
  init_webgl = _es6_module.add_export('init_webgl', init_webgl);
  function format_lines(script) {
    var i=1;
    var lines=script.split("\n");
    var maxcol=Math.ceil(Math.log(lines.length)/Math.log(10))+1;
    var s="";
    for (var line of lines) {
        s+=""+i+":";
        while (s.length<maxcol) {
          s+=" ";
        }
        s+=line+"\n";
        i++;
    }
    return s;
  }
  function hashShader(sdef) {
    let hash;
    let clean={vertex: sdef.vertex, 
    fragment: sdef.fragment, 
    uniforms: sdef.uniforms, 
    attributes: sdef.attributes}
    let ret=JSON.stringify(clean);
    sdef.__hash = ret;
    return ret;
  }
  hashShader = _es6_module.add_export('hashShader', hashShader);
  function getShader(gl, shaderdef) {
    if (gl.shadercache===undefined) {
        gl.shadercache = {};
    }
    let hash=shaderdef.__hash!==undefined ? shaderdef.__hash : hashShader(shaderdef);
    if (hash in gl.shadercache) {
        return gl.shadercache[hash];
    }
    let shader=new ShaderProgram(gl, shaderdef.vertex, shaderdef.fragment, shaderdef.attributes);
    if (shaderdef.uniforms)
      shader.uniforms = shaderdef.uniforms;
    gl.shadercache[hash] = shader;
    return shader;
  }
  getShader = _es6_module.add_export('getShader', getShader);
  function loadShader(ctx, shaderId) {
    var shaderScript=document.getElementById(shaderId);
    if (!shaderScript) {
        shaderScript = {text: shaderId, 
      type: undefined};
        if (shaderId.trim().toLowerCase().startsWith("//vertex")) {
            shaderScript.type = "x-shader/x-vertex";
        }
        else 
          if (shaderId.trim().toLowerCase().startsWith("//fragment")) {
            shaderScript.type = "x-shader/x-fragment";
        }
        else {
          console.trace();
          console.log("Invalid shader type");
          console.log("================");
          console.log(format_lines(shaderScript));
          console.log("================");
          throw new Error("Invalid shader type for shader script;\n script must start with //vertex or //fragment");
        }
    }
    if (shaderScript.type=="x-shader/x-vertex")
      var shaderType=ctx.VERTEX_SHADER;
    else 
      if (shaderScript.type=="x-shader/x-fragment")
      var shaderType=ctx.FRAGMENT_SHADER;
    else {
      log("*** Error: shader script '"+shaderId+"' of undefined type '"+shaderScript.type+"'");
      return null;
    }
    if (ctx==undefined||ctx==null||ctx.createShader==undefined)
      console.trace();
    var shader=ctx.createShader(shaderType);
    ctx.shaderSource(shader, shaderScript.text);
    ctx.compileShader(shader);
    var compiled=ctx.getShaderParameter(shader, ctx.COMPILE_STATUS);
    if (!compiled&&!ctx.isContextLost()) {
        var error=ctx.getShaderInfoLog(shader);
        console.log(format_lines(shaderScript.text));
        console.log("\nError compiling shader: ", error);
        ctx.deleteShader(shader);
        return null;
    }
    return shader;
  }
  var _safe_arrays=[0, 0, new Float32Array(2), new Float32Array(3), new Float32Array(4)];
  let use_ml_array=false;
  use_ml_array = _es6_module.add_export('use_ml_array', use_ml_array);
  class ShaderProgram  {
     constructor(gl, vertex, fragment, attributes) {
      this.vertexSource = vertex;
      this.fragmentSource = fragment;
      this.attrs = [];
      this.multilayer_programs = {};
      for (var a of attributes) {
          this.attrs.push(a);
      }
      this.defines = {};
      this._use_def_shaders = true;
      this._def_shaders = {};
      this.multilayer_attrs = {};
      this.rebuild = 1;
      this.uniformlocs = {};
      this.attrlocs = {};
      this.uniform_defaults = {};
      this.uniforms = {};
      this.gl = gl;
    }
    static  insertDefine(define, code) {
      code = code.trim().split("\n");
      if (code.length>3) {
          code = code.slice(0, 3).concat([define]).concat(code.slice(3, code.length));
      }
      else {
        code = code.concat([define]);
      }
      return code.join("\n")+"\n";
    }
    static  _use_ml_array() {
      return use_ml_array;
    }
    static  multilayerAttrSize(attr) {
      return attr.toUpperCase()+"_SIZE";
    }
    static  multilayerGet(attr, i) {
      if (this._use_ml_array()) {
          return `${attr}_layers[${i}]`;
      }
      else {
        return `get_${attr}_layer(i)`;
      }
    }
    static  maxMultilayer() {
      return 8;
    }
    static  multilayerAttrDeclare(attr, type, is_fragment, is_glsl_300) {
      let keyword, keyword2;
      if (is_fragment) {
          keyword = is_glsl_300 ? 'in' : "attribute";
          keyword2 = is_glsl_300 ? 'in' : "varying";
      }
      else {
        keyword = is_glsl_300 ? 'in' : "attribute";
        keyword2 = is_glsl_300 ? 'out' : "varying";
      }
      let size=this.multilayerAttrSize(attr);
      if (this._use_ml_array()) {
          let ret=`
#ifndef ${size}_DECLARE
#define ${size} 1
#endif

//${size}_DECLARE
#define ${attr} ${attr}_layers[0]\n`;
          if (!is_fragment) {
              ret+=`${keyword} ${type} ${attr}_layers[${size}];\n`;
          }
          ret+=`${keyword2} ${type} v${attr}_layers[${size}];\n`;
          return ret;
      }
      let ret=`
#ifndef ${size}_DECLARE
#define ${size} 1
#endif
//${size}_DECLARE\n`;
      if (!is_fragment) {
          ret+=`${keyword} ${type} ${attr};\n`;
      }
      ret+=`    
${keyword2} ${type} v${attr};
    `;
      let func=`
${type} get_${attr}_layer(int i) {
  switch (i) {
    case 0:
      return ${attr}

    `;
      for (let i=0; i<this.maxMultilayer(); i++) {
          ret+=`
      #if ${size} > ${i+1}\n`;
          if (!is_fragment) {
              ret+=`${keyword} ${type} ${attr}_${i+2};\n`;
          }
          ret+=`${keyword2} ${type} v${attr}_${i+2};
      #endif
      `;
          if (i===0) {
              continue;
          }
          func+=`
    case ${i}:
#if ${size} > ${i+1} 
      return ${attr}_${i+2};
      break;
#endif
      `;
      }
      func+='  }\n}\n';
      return ret;
    }
    static  multiLayerAttrKey(attr, i, use_glsl300) {
      if (!this._use_ml_array()) {
          return i ? `${attr}_${i}` : attr;
      }
      else {
        return `${attr}_layers[${i}]`;
      }
    }
    static  multilayerVertexCode(attr) {
      let size=this.multilayerAttrSize(attr);
      let ret=`

v${attr} = ${attr};
#if ${size} > 1

    `;
      for (let i=1; i<this.maxMultilayer; i++) {
          if (this._use_ml_array()) {
              ret+=`
#if ${size} >= ${i}
  v${attr}_layers[{i}] = ${attr}_layers[${i}];
#endif
      `;
          }
          else {
            ret+=`
#if ${size} >= ${i}
  v${attr}_${i+2} = ${attr}_${i+2};
#endif
      `;
          }
      }
      ret+='#endif\n';
      return ret;
    }
     setAttributeLayerCount(attr, n) {
      if (n<=1&&attr in this.multilayer_attrs) {
          delete this.multilayer_attrs[attr];
      }
      else {
        this.multilayer_attrs[attr] = n;
      }
      return this;
    }
     init(gl) {
      this.gl = gl;
      this.rebuild = false;
      let vshader=this.vertexSource, fshader=this.fragmentSource;
      if (!this._use_def_shaders) {
          let defs='';
          for (let k in this.defines) {
              let v=this.defines[k];
              if (v===undefined||v===null||v==="") {
                  defs+=`#define ${k}\n`;
              }
              else {
                defs+=`#define ${k} ${v}\n`;
              }
          }
          if (defs!=='') {
              vshader = this.constructor.insertDefine(defs, vshader);
              fshader = this.constructor.insertDefine(defs, fshader);
              this._vertexSource = vshader;
              this._fragmentSource = fshader;
          }
      }
      function loadShader(shaderType, code) {
        var shader=gl.createShader(shaderType);
        gl.shaderSource(shader, code);
        gl.compileShader(shader);
        let compiled=gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled&&!gl.isContextLost()) {
            var error=gl.getShaderInfoLog(shader);
            console.log(format_lines(code));
            console.log("\nError compiling shader: ", error);
            gl.deleteShader(shader);
            return null;
        }
        return shader;
      }
      let vertexShader=loadShader(gl.VERTEX_SHADER, vshader);
      let fragmentShader=loadShader(gl.FRAGMENT_SHADER, fshader);
      let program=gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      let attribs=this.attrs;
      let li=0;
      for (let i=0; i<attribs.length; ++i) {
          let attr=attribs[i];
          if (attr in this.multilayer_attrs) {
              let count=this.multilayer_attrs[attr];
              for (let j=0; j<count; j++) {
                  let key=this.constructor.multiLayerAttrKey(attr, j, gl.haveWebGL2);
                  gl.bindAttribLocation(program, li++, key);
              }
          }
          else {
            gl.bindAttribLocation(program, li++, attribs[i]);
          }
      }
      gl.linkProgram(program);
      let linked=gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!linked&&!gl.isContextLost()) {
          let error=gl.getProgramInfoLog(program);
          console.log("\nVERTEX:\n"+format_lines(vshader));
          console.log("\nFRAGMENT\n:"+format_lines(fshader));
          console.log("Error in program linking:"+error);
          gl.deleteProgram(program);
          return null;
      }
      this.program = program;
      this.gl = gl;
      this.vertexShader = vertexShader;
      this.fragmentShader = fragmentShader;
      this.attrlocs = {};
      this.uniformlocs = {};
      this.uniforms = {};
      for (var i=0; i<attribs.length; i++) {
          this.attrlocs[attribs[i]] = i;
      }
    }
    static  load_shader(scriptid, attrs) {
      var script=document.getElementById(scriptid);
      var text=script.text;
      var ret=new ShaderProgram(undefined, undefined, undefined, ["position", "normal", "uv", "color", "id"]);
      var lowertext=text.toLowerCase();
      var vshader=text.slice(0, lowertext.search("//fragment"));
      var fshader=text.slice(lowertext.search("//fragment"), text.length);
      ret.vertexSource = vshader;
      ret.fragmentSource = fshader;
      ret.ready = true;
      ret.promise = new Promise(function (accept, reject) {
        accept(ret);
      });
      ret.then = function () {
        return this.promise.then.apply(this.promise, arguments);
      };
      return ret;
    }
     on_gl_lost(newgl) {
      this.rebuild = 1;
      this.gl = newgl;
      this.program = undefined;
      this.uniformlocs = {};
    }
     destroy(gl) {
      if (gl&&this.program) {
          gl.deleteProgram(this.program);
          this.uniforms = {};
          this.program = undefined;
      }
    }
     uniformloc(name) {
      if (this.uniformlocs[name]==undefined) {
          this.uniformlocs[name] = this.gl.getUniformLocation(this.program, name);
      }
      return this.uniformlocs[name];
    }
     attrloc(name) {
      return this.attrLocation(name);
    }
     attrLoc(name) {
      if (!(name in this.attrlocs)) {
          this.attrlocs[name] = this.gl.getAttribLocation(this.program, name);
      }
      return this.attrlocs[name];
    }
     calcDefKey(extraDefines) {
      let key="";
      for (let i=0; i<2; i++) {
          let defs=i ? extraDefines : this.defines;
          if (!defs) {
              continue;
          }
          for (let k in defs) {
              let v=defs[k];
              key+=k;
              if (v!==null&&v!==undefined&&v!=="") {
                  key+=":"+v;
              }
          }
      }
      return key;
    }
     bindMultiLayer(gl, uniforms, attrsizes, attributes) {
      let key="";
      for (let k in attrsizes) {
          key+=k+":"+attrsizes[k]+":";
      }
      if (key in this.multilayer_programs) {
          let shader=this.multilayer_programs[key];
          shader.defines = this.defines;
          return shader.bind(gl, uniforms, attributes);
      }
      let shader=this.copy();
      for (let k in attrsizes) {
          let i=attrsizes[k];
          if (i>1) {
              shader.multilayer_attrs[k] = i;
          }
          let size=this.constructor.multilayerAttrSize(k);
          let define=`#define ${size} ${i}`;
          shader.vertexSource = shader.vertexSource.replace("//"+size+"_DECLARE", define);
          shader.fragmentSource = shader.fragmentSource.replace("//"+size+"_DECLARE", define);
      }
      this.multilayer_programs[key] = shader;
      return shader.bind(gl, uniforms, attributes);
    }
     copy() {
      let ret=new ShaderProgram(this.gl, this.vertexSource, this.fragmentSource, this.attrs);
      ret.uniforms = this.uniforms;
      ret.defines = Object.assign({}, this.defines);
      return ret;
    }
     bind(gl, uniforms, attributes) {
      this.gl = gl;
      let defines=undefined;
      if (attributes&&this._use_def_shaders) {
          for (let k in attributes) {
              let key="HAVE_"+k.toUpperCase();
              if (!defines) {
                  defines = {};
              }
              defines[key] = null;
          }
      }
      if (this._use_def_shaders) {
          let key=this.calcDefKey(defines);
          if (key!=="") {
              if (!(key in this._def_shaders)) {
                  let shader=this.copy();
                  if (defines) {
                      for (let k in defines) {
                          shader.defines[k] = defines[k];
                      }
                  }
                  shader._use_def_shaders = false;
                  this._def_shaders[key] = shader;
              }
              return this._def_shaders[key].bind(gl, uniforms);
          }
      }
      if (this.rebuild) {
          this.init(gl);
          if (this.rebuild)
            return false;
      }
      if (!this.program) {
          return false;
      }
      function setv(dst, src, n) {
        for (var i=0; i<n; i++) {
            dst[i] = src[i];
        }
      }
      let slot_i=0;
      gl.useProgram(this.program);
      this.gl = gl;
      for (var i=0; i<2; i++) {
          var us=i ? uniforms : this.uniforms;
          if (uniforms===undefined) {
              continue;
          }
          for (var k in us) {
              var v=us[k];
              var loc=this.uniformloc(k);
              if (loc===undefined) {
                  continue;
              }
              if (__instance_of(v, IntUniform)) {
                  gl.uniform1i(loc, v.val);
              }
              else 
                if (__instance_of(v, Texture)) {
                  let slot=v.texture_slot;
                  if (slot===undefined) {
                      slot = slot_i++;
                  }
                  v.bind(gl, this.uniformloc(k), slot);
              }
              else 
                if (__instance_of(v, Array)||__instance_of(v, Float32Array)||__instance_of(v, Float64Array)) {
                  switch (v.length) {
                    case 2:
                      var arr=_safe_arrays[2];
                      setv(arr, v, 2);
                      gl.uniform2fv(loc, arr);
                      break;
                    case 3:
                      var arr=_safe_arrays[3];
                      setv(arr, v, 3);
                      gl.uniform3fv(loc, arr);
                      break;
                    case 4:
                      var arr=_safe_arrays[4];
                      setv(arr, v, 4);
                      gl.uniform4fv(loc, arr);
                      break;
                    default:
                      console.log(v);
                      throw new Error("invalid array");
                      break;
                  }
              }
              else 
                if (__instance_of(v, Matrix4)) {
                  v.setUniform(gl, loc);
              }
              else 
                if (typeof v=="number") {
                  gl.uniform1f(loc, v);
              }
              else 
                if (v!==undefined&&v!==null) {
                  console.warn("Invalid uniform", k, v);
                  throw new Error("Invalid uniform");
              }
          }
      }
      return this;
    }
  }
  _ESClass.register(ShaderProgram);
  _es6_module.add_class(ShaderProgram);
  ShaderProgram = _es6_module.add_export('ShaderProgram', ShaderProgram);
  window._ShaderProgram = ShaderProgram;
  const GL_ARRAY_BUFFER=34962;
  const GL_ELEMENT_ARRAY_BUFFER=34963;
  class VBO  {
     constructor(gl, vbo, size=-1, bufferType=GL_ARRAY_BUFFER) {
      this.gl = gl;
      this.vbo = vbo;
      this.size = size;
      this.bufferType = bufferType;
      this.ready = false;
      this.lastData = undefined;
      this.dead = false;
      this.drawhint = undefined;
      this.lastData = undefined;
    }
     get(gl) {
      if (this.dead) {
          throw new Error("vbo is dead");
      }
      if (gl!==undefined&&gl!==this.gl) {
          this.ready = false;
          this.gl = gl;
          this.vbo = gl.createBuffer();
          console.warn("context loss detected");
      }
      if (!this.ready) {
          console.warn("buffer was not ready; forgot to call .uploadData?");
      }
      if (!this.vbo) {
          throw new Error("webgl error");
      }
      return this.vbo;
    }
     checkContextLoss(gl) {
      if (gl!==undefined&&gl!==this.gl) {
          this.ready = false;
          this.gl = gl;
          this.vbo = gl.createBuffer();
          console.warn("context loss detected");
          if (this.lastData!==undefined) {
              this.uploadData(gl, this.lastData, this.bufferType, this.drawhint);
          }
      }
    }
     reset(gl) {
      if (this.dead) {
          this.dead = false;
          this.gl = gl;
          this.vbo = gl.createBuffer();
          console.log("vbo creation");
      }
      this.ready = false;
      this.lastData = undefined;
      return this;
    }
     destroy(gl) {
      if (this.dead) {
          console.warn("tried to kill vbo twice");
          return ;
      }
      this.ready = false;
      gl.deleteBuffer(this.vbo);
      this.vbo = undefined;
      this.lastData = undefined;
      this.gl = undefined;
      this.dead = true;
    }
     uploadData(gl, dataF32, target=this.bufferType, drawhint=gl.STATIC_DRAW) {
      if (gl!==this.gl) {
          this.gl = gl;
          this.vbo = gl.createBuffer();
          this.size = -1;
          console.warn("Restoring VBO after context loss");
      }
      let useSub=this.size===dataF32.length&&this.vbo;
      this.lastData = dataF32;
      this.size = dataF32.length;
      this.drawhint = drawhint;
      gl.bindBuffer(target, this.vbo);
      if (useSub) {
          gl.bufferSubData(target, 0, dataF32);
      }
      else {
        if (DEBUG.simplemesh) {
            console.warn("bufferData");
        }
        gl.bufferData(target, dataF32, drawhint);
      }
      this.ready = true;
    }
  }
  _ESClass.register(VBO);
  _es6_module.add_class(VBO);
  VBO = _es6_module.add_export('VBO', VBO);
  class RenderBuffer  {
     constructor() {
      this._layers = {};
    }
     get(gl, name, bufferType=gl.ARRAY_BUFFER) {
      if (this[name]!==undefined) {
          return this[name];
      }
      let buf=gl.createBuffer();
      let vbo=new VBO(gl, buf, undefined, bufferType);
      this._layers[name] = vbo;
      this[name] = vbo;
      return vbo;
    }
    get  buffers() {
      let this2=this;
      return (function* () {
        for (let k in this2._layers) {
            yield this2._layers[k];
        }
      })();
    }
     reset(gl) {
      for (let vbo of this.buffers) {
          vbo.reset(gl);
      }
    }
     destroy(gl, name) {
      if (name===undefined) {
          for (let k in this._layers) {
              this._layers[k].destroy(gl);
              delete this._layers[name];
              delete this[name];
          }
      }
      else {
        if (this._layers[name]===undefined) {
            console.trace("WARNING: gl buffer not in RenderBuffer!", name, gl);
            return ;
        }
        this._layers[name].destroy(gl);
        delete this._layers[name];
        delete this[name];
      }
    }
  }
  _ESClass.register(RenderBuffer);
  _es6_module.add_class(RenderBuffer);
  RenderBuffer = _es6_module.add_export('RenderBuffer', RenderBuffer);
  class Texture  {
     constructor(texture_slot, texture, target=3553) {
      this.texture = texture;
      this.texture_slot = texture_slot;
      this.target = target;
      this.createParams = {target: TEXTURE_2D};
      this.createParamsList = [TEXTURE_2D];
      this._params = {};
    }
    static  unbindAllTextures(gl) {
      for (let i=gl.TEXTURE0; i<gl.TEXTURE0+31; i++) {
          gl.activeTexture(i);
          gl.bindTexture(gl.TEXTURE_2D, null);
      }
    }
     texParameteri(gl, target, param, value) {
      this._params[param] = value;
      gl.texParameteri(target, param, value);
      return this;
    }
     getParameter(gl, param) {
      return this._params[param];
    }
     _texImage2D1(gl, target, level, internalformat, format, type, source) {
      gl.bindTexture(target, this.texture);
      gl.texImage2D(target, level, internalformat, format, type, source);
      gl.getError();
      this.createParams = {target: target, 
     level: level, 
     internalformat: internalformat, 
     format: format, 
     type: type, 
     source: source};
      this.createParamsList = [target, level, internalformat, format, type, source];
      if (__instance_of(source, Image)||__instance_of(source, ImageData)) {
          this.createParams.width = source.width;
          this.createParams.height = source.height;
      }
      return this;
    }
     _texImage2D2(gl, target, level, internalformat, width, height, border, format, type, source) {
      gl.bindTexture(target, this.texture);
      gl.getError();
      gl.texImage2D(target, level, internalformat, width, height, border, format, type, source);
      this.createParams = {target: target, 
     level: level, 
     internalformat: internalformat, 
     format: format, 
     type: type, 
     source: source, 
     width: width, 
     height: height, 
     border: border};
      this.createParamsList = [target, level, internalformat, format, type, source, width, height, border];
      gl.getError();
      return this;
    }
     texImage2D() {
      if (arguments.length===7) {
          return this._texImage2D1(...arguments);
      }
      else {
        return this._texImage2D2(...arguments);
      }
    }
     copy(gl, copy_data=false) {
      let tex=new Texture();
      tex.texture = gl.createTexture();
      tex.createParams = Object.assign({}, this.createParams);
      tex.createParamsList = this.createParamsList.concat([]);
      tex.texture_slot = this.texture_slot;
      gl.bindTexture(this.createParams.target, tex.texture);
      if (!copy_data) {
          let p=this.createParams;
          tex.texImage2D(p.target, p.level, p.internalformat, p.format, p.type, null);
          gl.getError();
      }
      else {
        this.copyTexTo(gl, tex);
      }
      for (let k in this._params) {
          let key=parseInt(k);
          let val=this._params[key];
          gl.texParameteri(this.createParams.target, key, val);
          gl.getError();
      }
      return tex;
    }
     copyTexTo(gl, b) {
      if (this.texture===undefined) {
          return ;
      }
      let p=this.createParams;
      gl.bindTexture(p.target, b.texture);
      b.texImage2D(gl, p.target, p.level, p.internalformat, p.width, p.height, p.border, p.format, p.type, this.texture);
      gl.getError();
      return this;
    }
     destroy(gl) {
      gl.deleteTexture(this.texture);
    }
     load(gl, width, height, data, target=gl.TEXTURE_2D) {
      if (!this.texture) {
          this.texture = gl.createTexture();
      }
      gl.bindTexture(target, this.texture);
      if (__instance_of(data, Float32Array)) {
          gl.texImage2D(target, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, data);
      }
      else {
        gl.texImage2D(target, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      }
      gl.getError();
      Texture.defaultParams(gl, this, target);
      gl.getError();
      return this;
    }
     initEmpty(gl, target, width, height, format=gl.RGBA, type=gl.FLOAT) {
      this.target = target;
      if (!this.texture) {
          this.texture = gl.createTexture();
          Texture.defaultParams(gl, this.texture, target);
      }
      gl.bindTexture(this.texture);
      gl.texImage2D(this.target, 0, format, width, height, 0, format, type, null);
      return this;
    }
    static  load(gl, width, height, data, target=gl.TEXTURE_2D) {
      return new Texture(0).load(...arguments);
    }
    static  defaultParams(gl, tex, target=gl.TEXTURE_2D) {
      if (!(__instance_of(tex, Texture))) {
          console.warn("Depracated call to Texture.defaultParams with 'tex' a raw WebGLTexture instance instance of wrapper webgl.Texture object");
          tex = new Texture(undefined, tex);
      }
      gl.bindTexture(target, tex.texture);
      tex.texParameteri(gl, target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      tex.texParameteri(gl, target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      tex.texParameteri(gl, target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      tex.texParameteri(gl, target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
     bind(gl, uniformloc, slot=this.texture_slot) {
      gl.activeTexture(gl.TEXTURE0+slot);
      gl.bindTexture(this.target, this.texture);
      gl.uniform1i(uniformloc, slot);
    }
  }
  _ESClass.register(Texture);
  _es6_module.add_class(Texture);
  Texture = _es6_module.add_export('Texture', Texture);
  class CubeTexture extends Texture {
     constructor(texture_slot, texture) {
      super();
      this.texture = texture;
      this.texture_slot = texture_slot;
    }
     bind(gl, uniformloc, slot=this.texture_slot) {
      gl.activeTexture(gl.TEXTURE0+slot);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
      gl.uniform1i(uniformloc, slot);
    }
  }
  _ESClass.register(CubeTexture);
  _es6_module.add_class(CubeTexture);
  CubeTexture = _es6_module.add_export('CubeTexture', CubeTexture);
  class DrawMats  {
     constructor() {
      this.isPerspective = true;
      this.cameramat = new Matrix4();
      this.persmat = new Matrix4();
      this.rendermat = new Matrix4();
      this.normalmat = new Matrix4();
      this.icameramat = new Matrix4();
      this.ipersmat = new Matrix4();
      this.irendermat = new Matrix4();
      this.inormalmat = new Matrix4();
    }
     regen_mats(aspect=this.aspect) {
      this.aspect = aspect;
      this.rendermat.load(this.persmat).multiply(this.cameramat);
      this.normalmat.load(this.cameramat).makeRotationOnly();
      this.icameramat.load(this.cameramat).invert();
      this.ipersmat.load(this.persmat).invert();
      this.irendermat.load(this.rendermat).invert();
      this.inormalmat.load(this.normalmat).invert();
      return this;
    }
     toJSON() {
      return {cameramat: this.cameramat.getAsArray(), 
     persmat: this.persmat.getAsArray(), 
     rendermat: this.rendermat.getAsArray(), 
     normalmat: this.normalmat.getAsArray(), 
     isPerspective: this.isPerspective, 
     icameramat: this.icameramat.getAsArray(), 
     ipersmat: this.ipersmat.getAsArray(), 
     irendermat: this.irendermat.getAsArray(), 
     inormalmat: this.inormalmat.getAsArray()}
    }
     loadJSON(obj) {
      this.cameramat.load(obj.cameramat);
      this.persmat.load(obj.persmat);
      this.rendermat.load(obj.rendermat);
      this.normalmat.load(obj.normalmat);
      this.isPerspective = obj.isPerspective;
      this.icameramat.load(obj.icameramat);
      this.ipersmat.load(obj.ipersmat);
      this.irendermat.load(obj.irendermat);
      this.inormalmat.load(obj.inormalmat);
      return this;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(DrawMats);
  _es6_module.add_class(DrawMats);
  DrawMats = _es6_module.add_export('DrawMats', DrawMats);
  DrawMats.STRUCT = `
DrawMats {
  cameramat     : mat4;
  persmat       : mat4;
  rendermat     : mat4;
  normalmat     : mat4;
  icameramat    : mat4;
  ipersmat      : mat4;
  irendermat    : mat4;
  inormalmat    : mat4;
  isPerspective : int;
}
`;
  nstructjs.manager.add_class(DrawMats);
  class Camera extends DrawMats {
     constructor() {
      super();
      this.isPerspective = true;
      this.fovy = 35;
      this.aspect = 1.0;
      this.pos = new Vector3([0, 0, 5]);
      this.target = new Vector3();
      this.orbitTarget = new Vector3();
      this.up = new Vector3([1, 3, 0]);
      this.up.normalize();
      this.near = 0.25;
      this.far = 10000.0;
    }
     generateUpdateHash(objectMatrix=undefined) {
      let mul=1<<18;
      let ret=0;
      function add(val) {
        val = (val*mul)&((1<<31)-1);
        ret = (ret^val)&((1<<31)-1);
      }
      add(this.near);
      add(this.far);
      add(this.fovy);
      add(this.aspect);
      add(this.isPerspective);
      add(this.pos[0]);
      add(this.pos[1]);
      add(this.pos[2]);
      add(this.target[0]);
      add(this.target[1]);
      add(this.target[2]);
      add(this.up[0]);
      add(this.up[1]);
      add(this.up[2]);
      if (objectMatrix!==undefined) {
          let m=objectMatrix.$matrix;
          add(m.m11);
          add(m.m12);
          add(m.m13);
          add(m.m21);
          add(m.m22);
          add(m.m23);
          add(m.m31);
          add(m.m32);
          add(m.m33);
      }
      return ret;
    }
     load(b) {
      this.isPerspective = b.isPerspective;
      this.fovy = b.fovy;
      this.aspect = b.aspect;
      this.pos.load(b.pos);
      this.orbitTarget.load(b.orbitTarget);
      this.target.load(b.target);
      this.up.load(b.up);
      this.near = b.near;
      this.far = b.far;
      this.regen_mats(this.aspect);
      return this;
    }
     copy() {
      let ret=new Camera();
      ret.isPerspective = this.isPerspective;
      ret.fovy = this.fovy;
      ret.aspect = this.aspect;
      ret.pos.load(this.pos);
      ret.target.load(this.target);
      ret.orbitTarget.load(this.orbitTarget);
      ret.up.load(this.up);
      ret.near = this.near;
      ret.far = this.far;
      ret.regen_mats(ret.aspect);
      return ret;
    }
     reset() {
      this.pos = new Vector3([0, 0, 5]);
      this.target = new Vector3();
      this.up = new Vector3([1, 3, 0]);
      this.up.normalize();
      this.regen_mats(this.aspect);
      window.redraw_all();
      return this;
    }
     toJSON() {
      var ret=super.toJSON();
      ret.fovy = this.fovy;
      ret.near = this.near;
      ret.far = this.far;
      ret.aspect = this.aspect;
      ret.target = this.target.slice(0);
      ret.pos = this.pos.slice(0);
      ret.up = this.up.slice(0);
      return ret;
    }
     loadJSON(obj) {
      super.loadJSON(obj);
      this.fovy = obj.fovy;
      this.near = obj.near;
      this.far = obj.far;
      this.aspect = obj.aspect;
      this.target.load(obj.target);
      this.pos.load(obj.pos);
      this.up.load(obj.up);
      return this;
    }
     regen_mats(aspect=this.aspect) {
      this.aspect = aspect;
      this.persmat.makeIdentity();
      if (this.isPerspective) {
          this.persmat.perspective(this.fovy, aspect, this.near, this.far);
      }
      else {
        this.persmat.isPersp = true;
        let scale=1.0/this.pos.vectorDistance(this.target);
        this.persmat.makeIdentity();
        this.persmat.orthographic(scale, aspect, this.near, this.far);
      }
      this.cameramat.makeIdentity();
      this.cameramat.lookat(this.pos, this.target, this.up);
      this.cameramat.invert();
      this.rendermat.load(this.persmat).multiply(this.cameramat);
      super.regen_mats(aspect);
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(Camera);
  _es6_module.add_class(Camera);
  Camera = _es6_module.add_export('Camera', Camera);
  Camera.STRUCT = STRUCT.inherit(Camera, DrawMats)+`
  fovy          : float;
  aspect        : float;
  target        : vec3;
  orbitTarget   : vec3;
  pos           : vec3;
  up            : vec3;
  near          : float;
  far           : float;
  isPerspective : bool;
}
`;
  nstructjs.manager.add_class(Camera);
}, '/dev/fairmotion/src/webgl/webgl.js');


es6_module_define('fbo', ["./webgl.js", "../path.ux/scripts/pathux.js", "./simplemesh.js"], function _fbo_module(_es6_module) {
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  var Vector3=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector3');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Matrix4');
  var Vector4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Quat');
  var Vector2=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector2');
  var simplemesh=es6_import(_es6_module, './simplemesh.js');
  var webgl=es6_import(_es6_module, './webgl.js');
  var Texture=es6_import_item(_es6_module, './webgl.js', 'Texture');
  let DEPTH24_STENCIL8=35056;
  let RGBA32F=34836;
  let FLOAT=5126;
  let fbo_idgen=1;
  class FBO  {
     constructor(gl, width=512, height=512) {
      this.target = gl!==undefined ? gl.TEXTURE_2D : 3553;
      this.type = FLOAT;
      this.gl = gl;
      this.fbo = undefined;
      this.regen = true;
      this.id = "fbo"+(fbo_idgen++);
      this.deleteColor = false;
      this.deleteDepth = false;
      this.width = ~~width;
      this.height = ~~height;
      this.texColor = undefined;
      this.texDepth = undefined;
      this._last_viewport = undefined;
      this._last_scissor = undefined;
    }
     bind(gl) {
      this._last_viewport = gl.getParameter(gl.VIEWPORT);
      this._last_scissor = gl.getParameter(gl.SCISSOR_BOX);
      gl = this.gl = gl===undefined ? this.gl : gl;
      if (this.regen) {
          this.create(gl);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.viewport(0, 0, this.size[0], this.size[1]);
      gl.scissor(0, 0, this.size[0], this.size[1]);
    }
     drawQuadScaled(gl, width=this.width, height=this.height, tex=this.texColor, value_scale=1.0, depth=this.texDepth) {
      let quad=this._getQuad(gl, width, height);
      quad.program = this.blitshader;
      quad.uniforms.rgba = tex;
      quad.uniforms.depth = depth;
      quad.uniforms.valueScale = value_scale;
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      this.smesh.draw(gl);
    }
     drawQuad(gl, width=this.width, height=this.height, tex=this.texColor, depth=this.texDepth, program=undefined, uniforms=undefined) {
      let quad=this._getQuad(gl, width, height, program);
      if (program) {
          quad.program = program;
      }
      else {
        quad.program = this.blitshader;
      }
      quad.uniforms.rgba = tex;
      quad.uniforms.depth = depth;
      quad.uniforms.valueScale = 1.0;
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      this.smesh.draw(gl, uniforms);
    }
     _getQuad(gl, width, height, program) {
      width = ~~width;
      height = ~~height;
      if (this.smesh===undefined||this.size[0]!==width||this.size[1]!==height) {
          let lf=simplemesh.LayerTypes;
          this.smesh = new simplemesh.SimpleMesh(lf.LOC|lf.UV);
          let quad=this.smesh.quad([-1, -1, 0], [-1, 1, 0], [1, 1, 0], [1, -1, 0]);
          quad.uvs([0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]);
      }
      if (program) {
          this.smesh.program = program;
      }
      else {
        this.smesh.program = this.blitshader = webgl.getShader(gl, getBlitShaderCode(gl));
      }
      return this.smesh;
    }
     update(gl, width, height) {
      width = ~~width;
      height = ~~height;
      if (width!==this.width||height!==this.height) {
          this.width = width;
          this.height = height;
          this.regen = true;
      }
      if (this.regen) {
          this.create(gl);
      }
    }
     create(gl) {
      console.warn("Creating new fbo", this.width, this.height, this.id);
      this.regen = false;
      if (!this.texColor) {
          this.deleteColor = true;
          this.texColor = new Texture();
          this.texColor.initEmpty(gl, gl.TEXTURE_2D, this.width, this.height, gl.RGBA, this.type);
      }
      if (!this.texDepth) {
          this.deleteDepth = true;
          this.texDepth = new Texture();
          this.texDepth.initEmpty(gl, gl.TEXTURE_2D, this.width, this.height, gl.DEPTH_STENCIL, gl.UNSIGNED_INT_24_8);
      }
      let fbo=gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texColor.texture, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, this.texDepth.texture, 0);
    }
     unbind(gl) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      let sb=this._last_scissor;
      let vb=this._last_viewport;
      if (!vb) {
          return ;
      }
      gl.scissor(sb[0], sb[1], sb[2], sb[3]);
      gl.viewport(vb[0], vb[1], vb[2], vb[3]);
    }
     destroy() {
      if (this.fbo!==undefined) {
          this.gl.deleteFramebuffer(this.fbo);
          if (this.deleteColor&&this.texColor) {
              this.gl.deleteTexture(this.texColor.texture);
              this.texColor = undefined;
          }
          if (this.deleteDepth&&this.texDepth) {
              this.gl.deleteTexture(this.texDepth.texture);
              this.texDepth = undefined;
          }
          this.regen = true;
          this.fbo = undefined;
      }
    }
  }
  _ESClass.register(FBO);
  _es6_module.add_class(FBO);
  FBO = _es6_module.add_export('FBO', FBO);
  class oldFBO  {
     constructor(gl, width=512, height=512) {
      this.target = gl!==undefined ? gl.TEXTURE_2D : 3553;
      this.layer = undefined;
      this.ctype = RGBA32F;
      this.dtype = DEPTH24_STENCIL8;
      this.etype = FLOAT;
      this.gl = gl;
      this.fbo = undefined;
      this.regen = true;
      this.size = new Vector2([width, height]);
      this.texDepth = undefined;
      this.texColor = undefined;
    }
     getBlitShader(gl) {
      return webgl.getShader(gl, getBlitShaderCode(gl));
    }
     copy(copy_buffers=false) {
      let ret=new FBO();
      ret.size = new Vector2(this.size);
      ret.gl = this.gl;
      if (!copy_buffers||!this.gl||!this.fbo) {
          return ret;
      }
      ret.create(this.gl);
      let gl=this.gl;
      return ret;
    }
     create(gl, texColor=undefined, texDepth=undefined) {
      console.warn("fbo create");
      if (this.fbo&&this.gl) {
          this.destroy();
      }
      this.regen = 0;
      gl = this.gl = gl===undefined ? this.gl : gl;
      this.size[0] = ~~this.size[0];
      this.size[1] = ~~this.size[1];
      this.fbo = gl.createFramebuffer();
      this.texColor = texColor;
      this.texDepth = texDepth;
      let haveColor=!!this.texColor;
      let haveDepth=!!this.texDepth;
      if (!this.texDepth)
        this.texDepth = new webgl.Texture(undefined, gl.createTexture());
      if (!this.texColor)
        this.texColor = new webgl.Texture(undefined, gl.createTexture());
      let target=this.target;
      let layer=this.layer;
      function texParams(target, tex) {
        gl.bindTexture(target, tex.texture);
        tex.texParameteri(gl, target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        tex.texParameteri(gl, target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        tex.texParameteri(gl, target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        tex.texParameteri(gl, target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (target!==gl.TEXTURE_2D) {
            tex.texParameteri(gl, target, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        }
      }
      if (!haveDepth) {
          texParams(this.target, this.texDepth);
          if (gl.haveWebGL2) {
              this.texDepth.texParameteri(gl, this.target, gl.TEXTURE_COMPARE_MODE, gl.NONE);
          }
      }
      if (!haveColor) {
          texParams(this.target, this.texColor);
      }
      let initTex=(tex, dtype, dtype2, dtype3) =>        {
        if (this.target!==gl.TEXTURE_2D)
          return ;
        if (gl.haveWebGL2) {
            tex.texImage2D(gl, this.target, 0, dtype, this.size[0], this.size[1], 0, dtype2, dtype3, null);
        }
        else {
          tex.texImage2D(gl, this.target, 0, dtype, this.size[0], this.size[1], 0, dtype2, dtype3, null);
        }
      };
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      let dtype=this.dtype;
      let dtype2=gl.DEPTH_STENCIL;
      let dtype3=gl.UNSIGNED_INT_24_8;
      gl.bindTexture(this.target, this.texDepth.texture);
      if (!haveDepth) {
          initTex(this.texDepth, dtype, dtype2, dtype3);
      }
      let ctype=this.ctype;
      let ctype2=gl.RGBA, ctype3=this.etype;
      gl.bindTexture(target, this.texColor.texture);
      if (!haveColor) {
          initTex(this.texColor, ctype, ctype2, ctype3);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      if (this.target===gl.TEXTURE_2D) {
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texColor.texture, 0);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, this.texDepth.texture, 0);
      }
      else {
        let target2=target;
        if (target===gl.TEXTURE_CUBE_MAP) {
            target2 = layer;
        }
        if (DEBUG.fbo) {
            console.log("TARGET2", target2);
        }
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, target2, this.texColor.texture, 0);
        if (target===gl.TEXTURE_2D) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, target2, this.texDepth.texture, 0);
        }
        else {
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, target2, this.texDepth.texture, 0);
        }
      }
      let errret=gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (DEBUG.fbo) {
          console.log("FBO STATUS:", errret, webgl.constmap[errret]);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
     setTexColor(gl, tex) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      this.texColor = tex;
      if (this.target===gl.TEXTURE_2D) {
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texColor.texture, 0);
      }
      let errret=gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (DEBUG.fbo) {
          console.log("FBO STATUS:", errret, webgl.constmap[errret]);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
     bind(gl) {
      this._last_viewport = gl.getParameter(gl.VIEWPORT);
      gl = this.gl = gl===undefined ? this.gl : gl;
      if (this.regen) {
          this.create(gl);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.viewport(0, 0, this.size[0], this.size[1]);
    }
     _getQuad(gl, width, height, program) {
      width = ~~width;
      height = ~~height;
      if (this.smesh===undefined||this.size[0]!=width||this.size[1]!=height) {
          let lf=simplemesh.LayerTypes;
          this.smesh = new simplemesh.SimpleMesh(lf.LOC|lf.UV);
          let quad=this.smesh.quad([-1, -1, 0], [-1, 1, 0], [1, 1, 0], [1, -1, 0]);
          quad.uvs([0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]);
      }
      if (program) {
          this.smesh.program = program;
      }
      else {
        this.smesh.program = this.blitshader = webgl.getShader(gl, getBlitShaderCode(gl));
      }
      return this.smesh;
    }
     drawDepth(gl, width, height, tex) {
      let quad=this._getQuad(gl, width, height);
      quad.program = this.blitshader;
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      let dither=gl.getParameter(gl.DITHER);
      gl.disable(gl.DITHER);
      quad.draw(gl, {rgba: tex, 
     depth: tex, 
     size: [width, height], 
     valueScale: 1.0});
      if (dither) {
          gl.enable(gl.DITHER);
      }
    }
     drawQuadScaled(gl, width, height, tex=this.texColor, value_scale=1.0, depth=this.texDepth) {
      let quad=this._getQuad(gl, width, height);
      quad.program = this.blitshader;
      quad.uniforms.rgba = tex;
      quad.uniforms.depth = depth;
      quad.uniforms.valueScale = value_scale;
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      this.smesh.draw(gl);
    }
     drawQuad(gl, width, height, tex=this.texColor, depth=this.texDepth, program=undefined, uniforms=undefined) {
      let quad=this._getQuad(gl, width, height, program);
      if (program) {
          quad.program = program;
      }
      else {
        quad.program = this.blitshader;
      }
      quad.uniforms.rgba = tex;
      quad.uniforms.depth = depth;
      quad.uniforms.valueScale = 1.0;
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      this.smesh.draw(gl, uniforms);
    }
     unbind(gl) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      let vb=this._last_viewport;
      if (!vb) {
          return ;
      }
      gl.viewport(vb[0], vb[1], vb[2], vb[3]);
    }
     destroy() {
      if (this.fbo!==undefined) {
          this.gl.deleteFramebuffer(this.fbo);
          if (this.target===this.gl.TEXTURE_2D) {
              this.gl.deleteTexture(this.texDepth.texture);
              this.gl.deleteTexture(this.texColor.texture);
          }
          this.texDepth.texture = this.texColor.texture = undefined;
          this.fbo = undefined;
      }
    }
     update(gl, width, height) {
      width = ~~width;
      height = ~~height;
      gl = this.gl = gl===undefined ? this.gl : gl;
      if (width!==this.size[0]||height!==this.size[1]||gl!==this.gl) {
          console.log("fbo update", width, height);
          this.size[0] = width;
          this.size[1] = height;
          if (this.gl===undefined||gl===this.gl) {
              this.destroy(gl);
          }
          this.texDepth = this.texColor = undefined;
          this.create(gl);
      }
    }
  }
  _ESClass.register(oldFBO);
  _es6_module.add_class(oldFBO);
  oldFBO = _es6_module.add_export('oldFBO', oldFBO);
  class FrameStage extends FBO {
     constructor(shader, width=512, height=512) {
      super(undefined, width, height);
      this.shader = shader;
    }
     update(gl, width, height) {
      if (gl===undefined||width===undefined||height===undefined) {
          console.log("bad arguments to fbo.FrameStage.update()", arguments);
          throw new Error("bad arguments to fbo.FrameStage.update()");
      }
      super.update(gl, width, height);
    }
  }
  _ESClass.register(FrameStage);
  _es6_module.add_class(FrameStage);
  FrameStage = _es6_module.add_export('FrameStage', FrameStage);
  let BlitShaderGLSL200={vertex: `
precision mediump float;

uniform sampler2D rgba;
uniform sampler2D depth;

attribute vec3 position;
attribute vec2 uv;

varying vec2 v_Uv;

void main(void) {
  gl_Position = vec4(position, 1.0);
  v_Uv = uv;
}
    
  `, 
   fragment: `
#extension GL_EXT_frag_depth : require

precision mediump float;


uniform sampler2D rgba;
uniform sampler2D depth;
uniform float valueScale;

varying vec2 v_Uv;

void main(void) {
  vec4 color = texture2D(rgba, v_Uv);
  gl_FragColor = vec4(color.rgb*valueScale, color.a);
  gl_FragDepthEXT = texture2D(depth, v_Uv)[0];
}

  `, 
   uniforms: {}, 
   attributes: ["position", "uv"]}
  BlitShaderGLSL200 = _es6_module.add_export('BlitShaderGLSL200', BlitShaderGLSL200);
  let BlitShaderGLSL300={vertex: `#version 300 es
precision mediump float;

uniform sampler2D rgba;
uniform sampler2D depth;

in vec3 position;
in vec2 uv;

out vec2 v_Uv;

void main(void) {
  gl_Position = vec4(position, 1.0);
  v_Uv = uv;
}
    
  `, 
   fragment: `#version 300 es

precision mediump float;


uniform sampler2D rgba;
uniform sampler2D depth;
uniform float valueScale;

in vec2 v_Uv;
out vec4 fragColor;

void main(void) {
  vec4 color = texture(rgba, v_Uv);
  float d = texture(depth, v_Uv)[0];
  
  //color[0] = color[1] = color[2] = d*0.9;
  
  fragColor = vec4(color.rgb*valueScale, color.a);
  
  gl_FragDepth = texture(depth, v_Uv)[0];
}

  `, 
   uniforms: {}, 
   attributes: ["position", "uv"]}
  BlitShaderGLSL300 = _es6_module.add_export('BlitShaderGLSL300', BlitShaderGLSL300);
  class FramePipeline  {
     constructor(width=512, height=512) {
      this.stages = [new FrameStage()];
      this.size = new Vector2([width, height]);
      this.smesh = undefined;
      this._texs = [new webgl.Texture(0), new webgl.Texture(1), new webgl.Texture(2), new webgl.Texture(3), new webgl.Texture(4), new webgl.Texture(5)];
    }
     destroy(gl) {
      for (let stage of this.stages) {
          stage.destroy(gl);
      }
      if (this.smesh!==undefined) {
          this.smesh.destroy(gl);
          this.smesh = undefined;
      }
      this.stages = undefined;
    }
     addStage(gl, shaderdef) {
      let shader=webgl.getShader(gl, shaderdef);
      let stage=new FrameStage(shader, this.size[0], this.size[1]);
      this.stages.push(stage);
      return stage;
    }
     getBlitShader(gl) {
      return webgl.getShader(gl, getBlitShaderCode(gl));
    }
     draw(gl, drawfunc, width, height, drawmats) {
      if (this.smesh===undefined||this.size[0]!=width||this.size[1]!=height) {
          this.size[0] = width;
          this.size[1] = height;
          console.log("updateing framebuffer pipeline for new width/height");
          let lf=simplemesh.LayerTypes;
          this.smesh = new simplemesh.SimpleMesh(lf.LOC|lf.UV);
          this.smesh.program = this.blitshader = webgl.getShader(gl, getBlitShaderCode(gl));
          this.smesh.uniforms.iprojectionMatrix = drawmats.irendermat;
          this.smesh.uniforms.projectionMatrix = drawmats.rendermat;
          let quad=this.smesh.quad([-1, -1, 0], [-1, 1, 0], [1, 1, 0], [1, -1, 0]);
          quad.uvs([0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]);
      }
      let stage=this.stages[0];
      stage.update(gl, width, height);
      stage.bind(gl);
      gl.viewport(0, 0, this.size[0], this.size[1]);
      gl.enable(gl.DEPTH_TEST);
      gl.clearDepth(1000000.0);
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      drawfunc(gl);
      let laststage=stage;
      gl.depthMask(true);
      gl.disable(gl.DEPTH_TEST);
      for (let i=1; i<this.stages.length; i++) {
          let stage=this.stages[i];
          stage.update(gl, width, height);
          this._texs[0].texture = laststage.texColor.texture;
          stage.shader.uniforms.rgba = this._texs[0];
          this._texs[1].texture = laststage.texDepth.texture;
          stage.shader.uniforms.depth = this._texs[1];
          stage.shader.uniforms.size = this.size;
          this.smesh.program = stage.shader;
          stage.bind(gl);
          this.smesh.draw(gl);
          laststage = stage;
      }
    }
     drawFinal(gl, stage=undefined) {
      if (stage===undefined) {
          stage = this.stages[this.stages.length-1];
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(1);
      this.smesh.program = this.blitshader;
      this.blitshader.uniforms.rgba = this._texs[0];
      this.blitshader.uniforms.depth = this._texs[1];
      this.blitshader.uniforms.size = this.size;
      this._texs[0].texture = stage.texColor.texture;
      this._texs[1].texture = stage.texDepth.texture;
      this.smesh.draw(gl);
    }
  }
  _ESClass.register(FramePipeline);
  _es6_module.add_class(FramePipeline);
  FramePipeline = _es6_module.add_export('FramePipeline', FramePipeline);
  function getBlitShaderCode(gl) {
    if (gl.haveWebGL2) {
        return BlitShaderGLSL300;
    }
    else {
      return BlitShaderGLSL200;
    }
  }
  getBlitShaderCode = _es6_module.add_export('getBlitShaderCode', getBlitShaderCode);
}, '/dev/fairmotion/src/webgl/fbo.js');


es6_module_define('shaders', ["./webgl.js", "../path.ux/scripts/pathux.js"], function _shaders_module(_es6_module) {
  var ShaderProgram=es6_import_item(_es6_module, './webgl.js', 'ShaderProgram');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Matrix4');
  const RectShader={vertex: `precision mediump float;
uniform mat4 viewMatrix;

attribute vec2 position;
attribute vec2 uv;

varying vec2 vUv;

void main() {
  vec4 p = viewMatrix * vec4(position, 0.0, 1.0);
  gl_Position = p;
  
  vUv = uv; 
}
`, 
   fragment: `precision mediump float;

uniform mat4 viewMatrix;
varying vec2 vUv;

uniform sampler2D rgba;

void main() {
  vec4 color = texture2D(rgba, vUv); 
  gl_FragColor = color;
}
`, 
   attributes: ["position", "uv"], 
   uniforms: {viewMatrix: new Matrix4()}}
  _es6_module.add_export('RectShader', RectShader);
  const ShaderDef=window._ShaderDef = {RectShader: RectShader}
  _es6_module.add_export('ShaderDef', ShaderDef);
  const Shaders=window._Shaders = {}
  _es6_module.add_export('Shaders', Shaders);
  function loadShader(gl, sdef) {
    let sp=new ShaderProgram(gl, sdef.vertex, sdef.fragment, sdef.attributes);
    sp.uniforms = sdef.uniforms||{}
    sp.init(gl);
    return sp;
  }
  loadShader = _es6_module.add_export('loadShader', loadShader);
  function loadShaders(gl) {
    for (let k in ShaderDef) {
        let sdef=ShaderDef[k];
        Shaders[k] = loadShader(gl, sdef);
    }
  }
  loadShaders = _es6_module.add_export('loadShaders', loadShaders);
}, '/dev/fairmotion/src/webgl/shaders.js');


es6_module_define('simplemesh', ["../path.ux/scripts/pathux.js", "./shaders.js", "./webgl.js"], function _simplemesh_module(_es6_module) {
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
  var math=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'math');
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  var Vector3=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector3');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Matrix4');
  var Vector4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Quat');
  var Vector2=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector2');
  var webgl=es6_import(_es6_module, './webgl.js');
  var ShaderProgram=es6_import_item(_es6_module, './webgl.js', 'ShaderProgram');
  var Shaders=es6_import_item(_es6_module, './shaders.js', 'Shaders');
  var loadShader=es6_import_item(_es6_module, './shaders.js', 'loadShader');
  var RenderBuffer=webgl.RenderBuffer;
  const PrimitiveTypes={POINTS: 1, 
   LINES: 2, 
   TRIS: 4, 
   ADVANCED_LINES: 8, 
   ALL: 1|2|4|8}
  _es6_module.add_export('PrimitiveTypes', PrimitiveTypes);
  const LayerTypes={LOC: 1, 
   UV: 2, 
   COLOR: 4, 
   NORMAL: 8, 
   ID: 16, 
   CUSTOM: 32, 
   INDEX: 64}
  _es6_module.add_export('LayerTypes', LayerTypes);
  const LayerTypeNames={[LayerTypes.LOC]: "position", 
   [LayerTypes.UV]: "uv", 
   [LayerTypes.COLOR]: "color", 
   [LayerTypes.ID]: "id", 
   [LayerTypes.NORMAL]: "normal", 
   [LayerTypes.CUSTOM]: "custom"}
  _es6_module.add_export('LayerTypeNames', LayerTypeNames);
  let _TypeSizes={LOC: 3, 
   UV: 2, 
   COLOR: 4, 
   NORMAL: 3, 
   ID: 1, 
   CUSTOM: 4, 
   INDEX: 1}
  const TypeSizes={}
  _es6_module.add_export('TypeSizes', TypeSizes);
  for (var k in LayerTypes) {
      TypeSizes[LayerTypes[k]] = TypeSizes[k] = _TypeSizes[k];
  }
  let line2_temp4s=util.cachering.fromConstructor(Vector4, 64);
  let line2_stripuvs=[[1, 0], [-1, 0], [-1, 1], [1, 0], [-1, 1], [1, 1]];
  function appendvec(a, b, n, defaultval) {
    if (defaultval===undefined)
      defaultval = 0.0;
    for (var i=0; i<n; i++) {
        let val=b[i];
        a.push(val===undefined ? defaultval : val);
    }
  }
  var _ids_arrs=[[0], [0], [0], [0]];
  let zero=new Vector3();
  function copyvec(a, b, starti, n, defaultval) {
    if (defaultval===undefined)
      defaultval = 0.0;
    for (var i=starti; i<starti+n; i++) {
        let val=b[i];
        a[i] = val===undefined ? defaultval : val;
    }
  }
  class TriEditor  {
     constructor() {
      this.mesh = undefined;
      this.i = 0;
    }
     bind(mesh, i) {
      this.mesh = mesh;
      this.i = i;
      return this;
    }
     colors(c1, c2, c3) {
      let data=this.mesh.tri_colors;
      let i=this.i*3;
      data.copy(i, c1);
      data.copy(i+1, c2);
      data.copy(i+2, c3);
      return this;
    }
     normals(n1, n2, n3) {
      let data=this.mesh.tri_normals;
      let i=this.i*3;
      data.copy(i, n1);
      data.copy(i+1, n2);
      data.copy(i+2, n3);
      return this;
    }
     custom(layeri, v1, v2, v3) {
      let layer=this.mesh.layers.layers[layeri];
      let i=this.i*3;
      layer.copy(i, v1);
      layer.copy(i+1, v2);
      layer.copy(i+2, v3);
      return this;
    }
     uvs(u1, u2, u3) {
      let data=this.mesh.tri_uvs;
      let i=this.i*3;
      data.copy(i, u1);
      data.copy(i+1, u2);
      data.copy(i+2, u3);
      return this;
    }
     ids(i1, i2, i3) {
      if (i1===undefined||i2===undefined||i3===undefined) {
          throw new Error("i1/i2/i3 cannot be undefined");
      }
      let data=this.mesh.tri_ids;
      let i=this.i*3;
      _ids_arrs[0][0] = i1;
      i1 = _ids_arrs[0];
      _ids_arrs[1][0] = i2;
      i2 = _ids_arrs[1];
      _ids_arrs[2][0] = i3;
      i3 = _ids_arrs[2];
      data.copy(i, i1);
      data.copy(i+1, i2);
      data.copy(i+2, i3);
      return this;
    }
  }
  _ESClass.register(TriEditor);
  _es6_module.add_class(TriEditor);
  TriEditor = _es6_module.add_export('TriEditor', TriEditor);
  class QuadEditor  {
     constructor() {
      this.t1 = new TriEditor();
      this.t2 = new TriEditor();
    }
     bind(mesh, i, i2) {
      this.t1.bind(mesh, i);
      this.t2.bind(mesh, i2);
      return this;
    }
     custom(layeri, v1, v2, v3, v4) {
      this.t1.custom(layeri, v1, v2, v3);
      this.t2.custom(layeri, v1, v3, v4);
      return this;
    }
     uvs(u1, u2, u3, u4) {
      this.t1.uvs(u1, u2, u3);
      this.t2.uvs(u1, u3, u4);
      return this;
    }
     colors(u1, u2, u3, u4) {
      this.t1.colors(u1, u2, u3);
      this.t2.colors(u1, u3, u4);
      return this;
    }
     normals(u1, u2, u3, u4) {
      this.t1.normals(u1, u2, u3);
      this.t2.normals(u1, u3, u4);
      return this;
    }
     ids(u1, u2, u3, u4) {
      this.t1.ids(u1, u2, u3);
      this.t2.ids(u1, u3, u4);
      return this;
    }
  }
  _ESClass.register(QuadEditor);
  _es6_module.add_class(QuadEditor);
  QuadEditor = _es6_module.add_export('QuadEditor', QuadEditor);
  class LineEditor  {
     constructor() {
      this.mesh = undefined;
      this.i = 0;
    }
     bind(mesh, i) {
      this.mesh = mesh;
      this.i = i;
      return this;
    }
     colors(c1, c2) {
      let data=this.mesh.line_colors;
      let i=this.i*2;
      data.copy(i, c1);
      data.copy(i+1, c2);
      return this;
    }
     normals(c1, c2) {
      let data=this.mesh.line_normals;
      let i=this.i*2;
      data.copy(i, c1);
      data.copy(i+1, c2);
      return this;
    }
     uvs(c1, c2) {
      let data=this.mesh.line_uvs;
      let i=this.i*2;
      data.copy(i, c1);
      data.copy(i+1, c2);
      return this;
    }
     ids(i1, i2) {
      if (i1===undefined||i2===undefined) {
          throw new Error("i1 i2 cannot be undefined");
      }
      let data=this.mesh.line_ids;
      let i=this.i*2;
      _ids_arrs[0][0] = i1;
      _ids_arrs[1][0] = i2;
      data.copy(i, _ids_arrs[0]);
      data.copy(i+1, _ids_arrs[1]);
      return this;
    }
  }
  _ESClass.register(LineEditor);
  _es6_module.add_class(LineEditor);
  LineEditor = _es6_module.add_export('LineEditor', LineEditor);
  class DummyEditor  {
     colors() {
      return this;
    }
     ids() {
      return this;
    }
     normals() {
      return this;
    }
     custom() {
      return this;
    }
     tangent() {
      return this;
    }
     uvs() {
      return this;
    }
  }
  _ESClass.register(DummyEditor);
  _es6_module.add_class(DummyEditor);
  let dummyeditor=new DummyEditor();
  class LineEditor2  {
     constructor() {
      this.mesh = undefined;
      this.i = 0;
    }
     bind(mesh, i) {
      this.mesh = mesh;
      this.i = i;
      return this;
    }
     custom(layeri, c1, c2) {
      let data=this.mesh.layers.layers[layeri];
      let i=this.i*6;
      data.copy(i+0, c1);
      data.copy(i+1, c1);
      data.copy(i+2, c2);
      data.copy(i+3, c1);
      data.copy(i+4, c2);
      data.copy(i+5, c2);
      return this;
    }
     colors(c1, c2) {
      let data=this.mesh.line_colors2;
      let i=this.i*6;
      data.copy(i+0, c1);
      data.copy(i+1, c1);
      data.copy(i+2, c2);
      data.copy(i+3, c1);
      data.copy(i+4, c2);
      data.copy(i+5, c2);
      return this;
    }
     normals(c1, c2) {
      let data=this.mesh.line_normals2;
      let i=this.i*6;
      data.copy(i+0, c1);
      data.copy(i+1, c1);
      data.copy(i+2, c2);
      data.copy(i+3, c1);
      data.copy(i+4, c2);
      data.copy(i+5, c2);
      return this;
    }
     uvs(c1, c2) {
      let data=this.mesh.line_uvs2;
      let i=this.i*6;
      data.copy(i+0, c1);
      data.copy(i+1, c1);
      data.copy(i+2, c2);
      data.copy(i+3, c1);
      data.copy(i+4, c2);
      data.copy(i+5, c2);
      return this;
    }
     ids(i1, i2) {
      if (i1===undefined||i2===undefined) {
          throw new Error("i1 i2 cannot be undefined");
      }
      let data=this.mesh.line_ids2;
      let i=this.i*6;
      let c1=_ids_arrs[0];
      let c2=_ids_arrs[1];
      c1[0] = i1;
      c2[0] = i2;
      data.copy(i+0, c1);
      data.copy(i+1, c1);
      data.copy(i+2, c2);
      data.copy(i+3, c1);
      data.copy(i+4, c2);
      data.copy(i+5, c2);
      return this;
    }
  }
  _ESClass.register(LineEditor2);
  _es6_module.add_class(LineEditor2);
  LineEditor2 = _es6_module.add_export('LineEditor2', LineEditor2);
  class PointEditor  {
     constructor() {
      this.mesh = undefined;
      this.i = 0;
    }
     bind(mesh, i) {
      this.mesh = mesh;
      this.i = i;
      return this;
    }
     colors(c1) {
      let data=this.mesh.point_colors;
      let i=this.i;
      data.copy(i, c1);
      return this;
    }
     normals(c1) {
      let data=this.mesh.point_normals;
      let i=this.i;
      data.copy(i, c1);
      return this;
    }
     uvs(c1) {
      let data=this.mesh.point_uvs;
      let i=this.i;
      data.copy(i, c1);
      return this;
    }
     ids(i1) {
      if (i1===undefined) {
          throw new Error("i1 cannot be undefined");
      }
      let data=this.mesh.point_ids;
      let i=this.i;
      _ids_arrs[0][0] = i1;
      i1 = _ids_arrs[0];
      data.copy(i, _ids_arrs[0]);
      return this;
    }
  }
  _ESClass.register(PointEditor);
  _es6_module.add_class(PointEditor);
  PointEditor = _es6_module.add_export('PointEditor', PointEditor);
  const glTypeSizes={5126: 4, 
   5120: 1, 
   5121: 1, 
   5123: 2, 
   5122: 2, 
   5124: 4, 
   5125: 4}
  _es6_module.add_export('glTypeSizes', glTypeSizes);
  const glTypeArrays={5126: Float32Array, 
   5120: Int8Array, 
   5121: Uint8Array, 
   5122: Int16Array, 
   5123: Uint16Array, 
   5124: Int32Array, 
   5125: Uint32Array}
  _es6_module.add_export('glTypeArrays', glTypeArrays);
  const glTypeArrayMuls={5126: 1, 
   5120: 127, 
   5121: 255, 
   5123: 65535, 
   5122: 32767, 
   5124: 1, 
   5125: 1}
  _es6_module.add_export('glTypeArrayMuls', glTypeArrayMuls);
  const glSizes={FLOAT: 5126, 
   BYTE: 5120, 
   UNSIGNED_BYTE: 5121, 
   SHORT: 5122, 
   UNSIGNED_SHORT: 5123, 
   INT: 5124, 
   UNSIGNED_INT: 5125}
  const glRanges={[glSizes.FLOAT]: [-1e+17, 1e+17], 
   [glSizes.UNSIGNED_SHORT]: [0, 65535], 
   [glSizes.SHORT]: [-32767, 32767], 
   [glSizes.BYTE]: [-127, 127], 
   [glSizes.UNSIGNED_BYTE]: [0, 255], 
   [glSizes.UNSIGNED_INT]: [0, (1<<32)-1], 
   [glSizes.INT]: [-((1<<31)-1), (1<<31)-1]}
  window.glRanges = glRanges;
  let dmap=new WeakSet();
  function debugproxy(data, min, max, isint) {
    if (min===undefined) {
        min = -1e+17;
    }
    if (max===undefined) {
        max = 1e+17;
    }
    if (dmap.has(data)) {
        data.debug.min = min;
        data.isint = isint;
        data.debug.max = max;
        return data.debug.proxy;
    }
    dmap.add(data);
    function validate(target, prop) {
      if (typeof prop==="string") {
          prop = parseFloat(prop);
      }
      let bad=prop!==~~prop;
      bad = bad||isNaN(prop)||!isFinite(prop);
      bad = bad||prop<0||prop>=data.length;
      if (bad) {
          console.log(target, prop);
          throw new Error("bad prop "+prop);
      }
      return prop;
    }
    let debug={min: min, 
    max: max, 
    isint: isint}
    let proxy=new Proxy(data, {get: function get(target, prop, rc) {
        prop = validate(target, prop);
        return target[prop];
      }, 
    set: function set(target, prop, val) {
        prop = validate(target, prop);
        let bad=typeof val!=="number";
        bad = bad||val<debug.min||val>debug.max;
        bad = bad||isNaN(val)||!isFinite(val);
        bad = bad||(1&&val!==~~val);
        if (bad) {
            console.log(val, target, prop, debug.min, debug.max);
            throw new Error("bad value "+val);
        }
        target[prop] = val;
        return true;
      }});
    data.debug = debug;
    data.debug.proxy = proxy;
    return proxy;
  }
  window.debugproxy = debugproxy;
  const GL_ARRAY_BUFFER=34962;
  const GL_ELEMENT_ARRAY_BUFFER=34963;
  const GL_STATIC_DRAW=35044;
  class GeoLayer extends Array {
     constructor(size, name, primflag, type, idx) {
      super();
      this.index = undefined;
      this.glSize = 5126;
      this.glSizeMul = 1.0;
      this.glReady = false;
      this.type = type;
      this.data = [];
      this._useTypedData = false;
      this.dataUsed = 0;
      this.data_f32 = [];
      this.f32Ready = false;
      this.normalized = false;
      this.bufferType = GL_ARRAY_BUFFER;
      this.bufferHint = GL_STATIC_DRAW;
      this.size = size;
      this.name = name;
      this.primflag = primflag;
      this.bufferKey = undefined;
      this.idx = idx;
      this.id = undefined;
    }
     _getWriteData() {
      return this._useTypedData ? this.data_f32 : this.data;
    }
     setGLSize(size) {
      this.glSize = size;
      this.glSizeMul = glTypeArrayMuls[size];
      return this;
    }
     setNormalized(state) {
      this.normalized = !!state;
      return this;
    }
     reset() {
      this.glReady = false;
      this.dataUsed = 0;
      return this;
    }
     extend(data) {
      if (this._useTypedData&&this.dataUsed>=this.data_f32.length) {
          if (DEBUG.simplemesh) {
              console.warn("Resizing simplemesh attribute after conversion to a typed array");
          }
          this._useTypedData = false;
          this.data = new Array(this.data_f32.length);
          let a=this.data;
          let b=this.data_f32;
          for (let i=0; i<a.length; i++) {
              a[i] = b[i];
          }
          this.data_f32 = [];
      }
      let bad=isNaN(this.dataUsed)||this.dataUsed!==~~this.dataUsed||this.dataUsed<0;
      bad = bad||isNaN(this.size)||isNaN(this.data.length)||this.size<=0||this.data.length<0;
      if (bad) {
          throw new Error("dataUsed NaN error "+this.dataUsed);
      }
      let size=this.size;
      let starti=this.dataUsed;
      this.f32Ready = this._useTypedData;
      this.dataUsed+=size;
      if (!this._useTypedData&&this.dataUsed>this.data.length) {
          this.data.length = ~~(this.dataUsed*1.5);
      }
      if (data!==undefined) {
          this.copy(~~(starti/this.size), data, 1);
      }
      return this;
    }
     setCount(count, dirty=false) {
      if (isNaN(count)) {
          throw new Error("count was NaN");
      }
      count*=this.size;
      if (dirty) {
          this.glReady = false;
      }
      this.dataUsed = count;
      let data=this._useTypedData ? this.data_f32 : this.data;
      if (this.dataUsed!==data.length) {
          if (!this._useTypedData) {
              if (this.data.length<this.dataUsed) {
                  this.data.length = this.dataUsed;
                  this.glReady = false;
              }
              this.f32Ready = false;
          }
          else {
            if (window.DEBUG&&window.DEBUG.simplemesh) {
                console.log("simpleisland is converting back to simple array", count, this.data_f32.length, this.dataUsed);
            }
            let len=this.dataUsed;
            this.data = new Array(len);
            let a=this.data;
            let b=this.data_f32;
            for (let i=0; i<b.length; i++) {
                a[i] = b[i];
            }
            this.data.length = this.dataUsed;
            this.glReady = false;
            this._useTypedData = false;
            this.f32Ready = false;
          }
      }
    }
     _copy2Typed(data1, data2, n, mul, start) {
      for (let i=0; i<n; i++) {
          data1[start++] = ~~(data2[i]*mul);
      }
    }
     _copy2(data1, data2, n, mul, start) {
      for (let i=0; i<n; i++) {
          data1[start++] = ~~(data2[i]*mul);
      }
    }
     _copy_int(i, data, n=1) {
      let tot=n*this.size;
      this.f32Ready = false;
      i*=this.size;
      let thisdata;
      let mul=this.glSizeMul;
      if (this._useTypedData) {
          thisdata = this.data_f32;
      }
      else {
        thisdata = this.data;
      }
      if (DEBUG.simplemesh) {
          let range=glRanges[this.glSize];
          thisdata = debugproxy(thisdata, range[0], range[1], this.glSize!==glSizes.FLOAT);
      }
      if (this._useTypedData) {
          this._copy2Typed(thisdata, data, tot, mul, i);
      }
      else {
        this._copy2(thisdata, data, tot, mul, i);
      }
      return this;
    }
     copy(i, data, n=1) {
      if (this.glSizeMul!==1) {
          return this._copy_int(i, data, n);
      }
      let tot=n*this.size;
      this.f32Ready = this._useTypedData;
      i*=this.size;
      let thisdata;
      if (this._useTypedData) {
          thisdata = this.data_f32;
      }
      else {
        thisdata = this.data;
      }
      if (i>=this.dataUsed) {
          throw new Error("eek!");
          return ;
      }
      if (isNaN(i)) {
          throw new Error("NaN!");
      }
      let di=0;
      let end=i+tot;
      while (i<end) {
        thisdata[i] = data[di];
        di++;
        i++;
      }
      return this;
    }
     [Symbol.keystr]() {
      return ""+this.id;
    }
  }
  _ESClass.register(GeoLayer);
  _es6_module.add_class(GeoLayer);
  GeoLayer = _es6_module.add_export('GeoLayer', GeoLayer);
  class GeoLayerMeta  {
     constructor(primflag, type, attrsizes) {
      this.type = type;
      this.primflag = primflag;
      this.layers = [];
      this.normalized = false;
      this.attrsizes = attrsizes;
    }
     add(layer) {
      this.layers.push(layer);
      if (this.attrsizes[LayerTypeNames[layer.type]]===undefined) {
          this.attrsizes[LayerTypeNames[layer.type]] = 0;
      }
      else {
        this.attrsizes[LayerTypeNames[layer.type]]++;
      }
    }
  }
  _ESClass.register(GeoLayerMeta);
  _es6_module.add_class(GeoLayerMeta);
  GeoLayerMeta = _es6_module.add_export('GeoLayerMeta', GeoLayerMeta);
  function get_meta_mask(primflag, type) {
    return type|(primflag<<16);
  }
  let _debug_idgen=0;
  class GeoLayerManager  {
     constructor() {
      this.layers = [];
      this.has_multilayers = false;
      this._debug_id = _debug_idgen++;
      this.layer_meta = new Map();
      this.layer_idgen = new util.IDGen();
      this.attrsizes = new Map();
    }
     reset() {
      for (let /*unprocessed ExpandNode*/[key, meta] of this.layer_meta) {
          for (let l of meta.layers) {
              l.reset();
          }
      }
      return this;
    }
     copy() {
      let ret=new GeoLayerManager();
      ret.layer_idgen = this.layer_idgen.copy();
      ret.has_multilayers = this.has_multilayers;
      for (let key of this.layer_meta.keys()) {
          let meta=this.layer_meta.get(key);
          let meta2=ret.get_meta(meta.primflag, meta.type);
          for (let layer of meta.layers) {
              let layer2=new GeoLayer(layer.size, layer.name, layer.primflag, layer.type, layer.idx);
              layer2.data.length = layer.data.length;
              layer2.dataUsed = layer.dataUsed;
              layer2._useTypedData = layer._useTypedData;
              layer2.glSize = layer.glSize;
              layer2.glSizeMul = layer.glSizeMul;
              layer2.id = layer.id;
              layer2.index = layer.index;
              layer2.bufferKey = layer.bufferKey;
              layer2.normalized = layer.normalized;
              let a=layer.data;
              let b=layer2.data;
              let len=layer.dataUsed;
              if (layer._useTypedData) {
                  layer2.data_f32 = layer.data_f32.slice(0, layer.data_f32.length);
              }
              else {
                layer2.data = layer.data.slice(0, layer.data.length);
              }
              meta2.layers.push(layer2);
              ret.layers.push(layer2);
          }
      }
      return ret;
    }
     get_meta(primflag, type) {
      let mask=get_meta_mask(primflag, type);
      if (!this.layer_meta.has(mask)) {
          let attrsizes={};
          this.attrsizes.set(primflag, attrsizes);
          this.layer_meta.set(mask, new GeoLayerMeta(primflag, type, attrsizes));
      }
      return this.layer_meta.get(mask);
    }
     [Symbol.iterator]() {
      return this.layers[Symbol.iterator]();
    }
     extend(primflag, type, data, count) {
      let meta=this.get_meta(primflag, type);
      for (let i=0; i<meta.layers.length; i++) {
          meta.layers[i].extend(data, count);
      }
      return this;
    }
     layerCount(primflag, type) {
      return this.get_meta(primflag, type).layers.length;
    }
     pushLayer(name, primflag, type, size) {
      let meta=this.get_meta(primflag, type);
      let idx=meta.layers.length;
      let layer=new GeoLayer(size, name, primflag, type, idx);
      layer.id = this.layer_idgen.next();
      layer.index = this.layers.length;
      layer.primflag = primflag;
      layer.bufferKey = layer.name+":"+layer.id;
      this.layers.push(layer);
      meta.add(layer);
      layer.normalized = meta.normalized;
      return layer;
    }
     get(name, primflag, type, size, idx=undefined) {
      if (size===undefined) {
          size = TypeSizes[type];
      }
      if (idx>0) {
          this.has_multilayers = true;
      }
      let meta=this.get_meta(primflag, type);
      if (type===LayerTypes.CUSTOM) {
          for (let layer of meta.layers) {
              if (layer.name===name) {
                  return layer;
              }
          }
      }
      else {
        idx = idx===undefined ? 0 : idx;
        if (idx<meta.layers.length) {
            return meta.layers[idx];
        }
      }
      return this.pushLayer(name, primflag, type, size, idx);
    }
  }
  _ESClass.register(GeoLayerManager);
  _es6_module.add_class(GeoLayerManager);
  GeoLayerManager = _es6_module.add_export('GeoLayerManager', GeoLayerManager);
  var _default_uv=[0, 0];
  var _default_color=[0, 0, 0, 1];
  var _default_normal=[0, 0, 1];
  var _default_id=[-1];
  class SimpleIsland  {
     constructor(mesh) {
      let lay=this.layers = new GeoLayerManager();
      this._glAttrs = {};
      this.primflag = undefined;
      this.mesh = mesh;
      this.makeBufferAliases();
      this.totpoint = 0;
      this.totline = 0;
      this.tottri = 0;
      this.totline_tristrip = 0;
      this.indexedMode = undefined;
      this.layerflag = undefined;
      this.regen = 1;
      this._regen_all = 0;
      this.tri_editors = util.cachering.fromConstructor(TriEditor, 32, true);
      this.quad_editors = util.cachering.fromConstructor(QuadEditor, 32, true);
      this.line_editors = util.cachering.fromConstructor(LineEditor, 32, true);
      this.point_editors = util.cachering.fromConstructor(PointEditor, 32, true);
      this.tristrip_line_editors = util.cachering.fromConstructor(LineEditor2, 32, true);
      this.buffer = new RenderBuffer();
      this.program = undefined;
      this.textures = [];
      this.uniforms = {};
      this._uniforms_temp = {};
    }
     reset(gl) {
      this.layers.reset();
      this.buffer.reset(gl);
      this.tottri = this.totline = this.totpoint = this.totline_tristrip = 0;
      this.regen = 1;
    }
     getIndexedMode() {
      if (this.indexedMode!==undefined) {
          return this.indexedMode;
      }
      else {
        return this.mesh.indexedMode;
      }
    }
     setPrimitiveCount(primtype, tot) {
      switch (primtype) {
        case PrimitiveTypes.TRIS:
          this.tottri = tot;
          tot*=3;
          break;
        case PrimitiveTypes.LINES:
          this.totline = tot;
          tot*=2;
          break;
        case PrimitiveTypes.ADVANCED_LINES:
          this.totline_tristrip = tot;
          tot*=6;
          break;
        case PrimitiveTypes.POINTS:
          this.totpoint = tot;
          break;
      }
      let lf=this.layerflag ? this.layerflag : this.mesh.layerflag;
      for (let layer of this.layers.layers) {
          if (layer.primflag!==primtype||!(layer.type&lf)) {
              continue;
          }
          layer.setCount(tot);
      }
      return this;
    }
     makeBufferAliases() {
      let lay=this.layers;
      let pflag=PrimitiveTypes.TRIS;
      this.tri_cos = lay.get("tri_cos", pflag, LayerTypes.LOC);
      this.tri_normals = lay.get("tri_normals", pflag, LayerTypes.NORMAL).setGLSize(glSizes.SHORT).setNormalized(true);
      this.tri_uvs = lay.get("tri_uvs", pflag, LayerTypes.UV).setGLSize(glSizes.SHORT).setNormalized(true);
      this.tri_colors = lay.get("tri_colors", pflag, LayerTypes.COLOR).setGLSize(glSizes.UNSIGNED_BYTE).setNormalized(true);
      this.tri_ids = lay.get("tri_ids", pflag, LayerTypes.ID);
      pflag = PrimitiveTypes.LINES;
      this.line_cos = lay.get("line_cos", pflag, LayerTypes.LOC);
      this.line_normals = lay.get("line_normals", pflag, LayerTypes.NORMAL).setGLSize(glSizes.SHORT).setNormalized(true);
      this.line_uvs = lay.get("line_uvs", pflag, LayerTypes.UV).setGLSize(glSizes.SHORT).setNormalized(true);
      this.line_colors = lay.get("line_colors", pflag, LayerTypes.COLOR).setGLSize(glSizes.UNSIGNED_BYTE).setNormalized(true);
      this.line_ids = lay.get("line_ids", pflag, LayerTypes.ID);
      pflag = PrimitiveTypes.POINTS;
      this.point_cos = lay.get("point_cos", pflag, LayerTypes.LOC);
      this.point_normals = lay.get("point_normals", pflag, LayerTypes.NORMAL).setGLSize(glSizes.SHORT).setNormalized(true);
      this.point_uvs = lay.get("point_uvs", pflag, LayerTypes.UV).setGLSize(glSizes.SHORT).setNormalized(true);
      this.point_colors = lay.get("point_colors", pflag, LayerTypes.COLOR).setGLSize(glSizes.UNSIGNED_BYTE).setNormalized(true);
      this.point_ids = lay.get("point_ids", pflag, LayerTypes.ID);
      if (this.primflag&PrimitiveTypes.ADVANCED_LINES) {
          pflag = PrimitiveTypes.ADVANCED_LINES;
          this.line_cos2 = lay.get("line_cos2", pflag, LayerTypes.LOC);
          this.line_normals2 = lay.get("line_normals2", pflag, LayerTypes.NORMAL).setGLSize(glSizes.SHORT).setNormalized(true);
          this.line_uvs2 = lay.get("line_uvs2", pflag, LayerTypes.UV).setGLSize(glSizes.SHORT).setNormalized(true);
          this.line_colors2 = lay.get("line_colors2", pflag, LayerTypes.COLOR).setGLSize(glSizes.UNSIGNED_BYTE).setNormalized(true);
          this.line_ids2 = lay.get("line_ids2", pflag, LayerTypes.ID);
          this.line_stripuvs = this.getDataLayer(PrimitiveTypes.ADVANCED_LINES, LayerTypes.CUSTOM, 2, "_strip_uv");
          this.line_stripdirs = this.getDataLayer(PrimitiveTypes.ADVANCED_LINES, LayerTypes.CUSTOM, 4, "_strip_dir");
          this.line_stripdirs.normalized = false;
      }
    }
     copy() {
      let ret=new SimpleIsland();
      ret.primflag = this.primflag;
      ret.layerflag = this.layerflag;
      ret.totline = this.totline;
      ret.tottri = this.tottri;
      ret.totpoint = this.totpoint;
      for (let k in this.uniforms) {
          ret.uniforms[k] = this.uniforms[k];
      }
      for (let tex of this.textures) {
          ret.textures.push(tex);
      }
      ret.program = this.program;
      ret.layers = this.layers.copy();
      ret.regen = 1;
      ret.makeBufferAliases();
      return ret;
    }
     glFlagUploadAll(primflag=PrimitiveTypes.ALL) {
      this._regen_all|=primflag;
    }
     point(v1) {
      this.point_cos.extend(v1);
      this._newElem(PrimitiveTypes.POINTS, 1);
      this.totpoint++;
      return this.point_editors.next().bind(this, this.totpoint-1);
    }
     smoothline(v1, v2, w1=2, w2=2) {
      let dv=0.0;
      for (let i=0; i<3; i++) {
          dv+=(v1[i]-v2[i])*(v1[i]-v2[i]);
      }
      if (!this.line_cos2) {
          this.regen = true;
          this.primflag|=PrimitiveTypes.ADVANCED_LINES;
          if (this.layerflag!==undefined) {
              this.layerflag|=LayerTypes.CUSTOM;
          }
          else {
            this.mesh.layerflag|=LayerTypes.CUSTOM;
          }
          this.makeBufferAliases();
      }
      let li=this.line_cos2.dataUsed;
      this.line_cos2.extend(v1);
      this.line_cos2.extend(v1);
      this.line_cos2.extend(v2);
      this.line_cos2.extend(v1);
      this.line_cos2.extend(v2);
      this.line_cos2.extend(v2);
      let data=this.line_cos2._getWriteData();
      if (dv===0.0) {
          while (li<this.line_cos2.dataUsed) {
            data[li++]+=Math.random()*0.001;
          }
      }
      this._newElem(PrimitiveTypes.ADVANCED_LINES, 6);
      let i=this.totline_tristrip*6;
      this.line_stripuvs.copy(i, line2_stripuvs[0]);
      this.line_stripuvs.copy(i+1, line2_stripuvs[1]);
      this.line_stripuvs.copy(i+2, line2_stripuvs[2]);
      this.line_stripuvs.copy(i+3, line2_stripuvs[3]);
      this.line_stripuvs.copy(i+4, line2_stripuvs[4]);
      this.line_stripuvs.copy(i+5, line2_stripuvs[5]);
      let d=line2_temp4s.next().load(v2).sub(v1);
      d[3] = 0.0;
      d.normalize();
      d[3] = w1;
      this.line_stripdirs.copy(i, d);
      this.line_stripdirs.copy(i+1, d);
      d[3] = w2;
      this.line_stripdirs.copy(i+2, d);
      d[3] = w1;
      this.line_stripdirs.copy(i+3, d);
      d[3] = w2;
      this.line_stripdirs.copy(i+4, d);
      this.line_stripdirs.copy(i+5, d);
      this.totline_tristrip++;
      return this.tristrip_line_editors.next().bind(this, this.totline_tristrip-1);
    }
     line(v1, v2) {
      this.line_cos.extend(v1);
      this.line_cos.extend(v2);
      this._newElem(PrimitiveTypes.LINES, 2);
      this.totline++;
      return this.line_editors.next().bind(this, this.totline-1);
    }
     _newElem(primtype, primcount) {
      let layerflag=this.layerflag===undefined ? this.mesh.layerflag : this.layerflag;
      let meta=this.layers.get_meta(primtype, LayerTypes.LOC);
      let start=meta.layers[0].dataUsed/meta.layers[0].size;
      for (let j=0; j<primcount; j++) {
          if (layerflag&LayerTypes.UV) {
              this.layers.extend(primtype, LayerTypes.UV, _default_uv);
          }
          if (layerflag&LayerTypes.CUSTOM) {
              this.layers.extend(primtype, LayerTypes.CUSTOM, _default_uv);
          }
          if (layerflag&LayerTypes.COLOR) {
              this.layers.extend(primtype, LayerTypes.COLOR, _default_color);
          }
          if (layerflag&LayerTypes.NORMAL) {
              this.layers.extend(primtype, LayerTypes.NORMAL, _default_normal);
          }
          if (layerflag&LayerTypes.ID) {
              this.layers.extend(primtype, LayerTypes.ID, _default_id);
          }
      }
      return start;
    }
     tri(v1, v2, v3) {
      this.tri_cos.extend(v1);
      this.tri_cos.extend(v2);
      this.tri_cos.extend(v3);
      this._newElem(PrimitiveTypes.TRIS, 3);
      this.tottri++;
      return this.tri_editors.next().bind(this, this.tottri-1);
    }
     quad(v1, v2, v3, v4) {
      let i=this.tottri;
      this.tri(v1, v2, v3);
      this.tri(v1, v3, v4);
      return this.quad_editors.next().bind(this, i, i+1);
    }
     destroy(gl) {
      this.buffer.destroy(gl);
      this.regen = true;
    }
     gen_buffers(gl) {
      let layerflag=this.layerflag===undefined ? this.mesh.layerflag : this.layerflag;
      let allflag=this._regen_all;
      this._regen_all = 0;
      for (let layer of this.layers) {
          if (layer.dataUsed===0) {
              continue;
          }
          if (layer._useTypedData&&!layer.f32Ready) {
              layer.f32Ready = true;
          }
          if (!layer.f32Ready) {
              layer.f32Ready = true;
              let typedarray=glTypeArrays[layer.glSize];
              if (!layer.data_f32||layer.data_f32.length!==layer.dataUsed) {
                  if (DEBUG.simplemesh) {
                      console.warn("new layer data", layer.data_f32, layer);
                  }
                  layer.data_f32 = new typedarray(layer.dataUsed);
              }
              let a=layer.data;
              let b=layer.data_f32;
              let count=layer.dataUsed;
              layer.data.length = layer.dataUsed;
              layer.data_f32.set(layer.data);
              layer._useTypedData = true;
              layer.data = [];
              layer.glReady = false;
          }
          if (layer.glReady&&layer.dataUsed!==layer.data_f32.length) {
              throw new Error("simplemesh error");
          }
      }
      for (let layer of this.layers) {
          if (layer.glReady&&!(allflag&layer.primflag)) {
              continue;
          }
          if (layer.dataUsed===0||!(layer.type&layerflag)) {
              continue;
          }
          if (layer.type!==LayerTypes.CUSTOM) {
              this._glAttrs[LayerTypeNames[layer.type]] = 1;
          }
          let vbo=this.buffer.get(gl, layer.bufferKey, layer.bufferType);
          vbo.uploadData(gl, layer.data_f32, layer.bufferType, layer.bufferHint);
          layer.glReady = true;
      }
    }
     getIndexBuffer(ptype) {
      let key="";
      switch (ptype) {
        case PrimitiveTypes.TRIS:
          key = "tri";
          break;
        case PrimitiveTypes.LINES:
          key = "line";
          break;
        case PrimitiveTypes.POINTS:
          key = "point";
          break;
      }
      key+="_indices";
      if (!this[key]) {
          let layer=this[key] = this.layers.get(key, ptype, LayerTypes.INDEX);
          layer.size = 1;
          layer.glSizeMul = 1;
          layer.glSize = glSizes.UNSIGNED_SHORT;
          layer.normalized = false;
          layer.bufferType = GL_ELEMENT_ARRAY_BUFFER;
      }
      return this[key];
    }
     _draw_tris(gl, uniforms, params, program) {
      if (this.tottri) {
          this.bindArrays(gl, uniforms, program, "tri", PrimitiveTypes.TRIS);
          if (this.getIndexedMode()) {
              let idx=this.getIndexBuffer(PrimitiveTypes.TRIS);
              if (!idx) {
                  console.warn("Missing index layer", this);
                  return ;
              }
              let vbo=this.buffer.get(gl, idx.bufferKey, idx.bufferType);
              let buf=vbo.get(gl);
              gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
              gl.drawElements(gl.TRIANGLES, this.tottri*3, gl.UNSIGNED_SHORT, 0);
              gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
          }
          else {
            gl.drawArrays(gl.TRIANGLES, 0, this.tottri*3);
          }
      }
    }
     _draw_line_tristrips(gl, uniforms, params, program) {
      let attrs=this._glAttrs;
      if (this.totline_tristrip) {
          if (!program._smoothline) {
              let uniforms2=Object.assign({}, uniforms);
              let attributes=new Set(program.attrs);
              attributes.add("_strip_dir");
              attributes.add("_strip_uv");
              let vertex=program.vertexSource;
              let fragment=program.fragmentSource;
              vertex = ShaderProgram.insertDefine(`
#ifndef SMOOTH_LINE
#define SMOOTH_LINE
#endif
        `, vertex);
              fragment = ShaderProgram.insertDefine(`
#ifndef SMOOTH_LINE
#define SMOOTH_LINE
#endif
        `, fragment);
              let sdef={vertex: vertex, 
         fragment: fragment, 
         uniforms: uniforms2, 
         attributes: attributes};
              program._smoothline = loadShader(gl, sdef);
          }
          program = program._smoothline;
          program.bind(gl, uniforms, attrs);
          this.bindArrays(gl, uniforms, program, "line2", PrimitiveTypes.ADVANCED_LINES);
          gl.drawArrays(gl.TRIANGLES, 0, this.totline_tristrip*6);
      }
    }
     flagRecalc() {
      for (let layer of this.layers) {
          layer.f32Ready = false;
      }
      this.regen = true;
      return this;
    }
     bindArrays(gl, uniforms, program, key, primflag) {
      program = program===undefined ? this.program : program;
      program = program===undefined ? this.mesh.program : program;
      let layerflag=this.layerflag===undefined ? this.mesh.layerflag : this.layerflag;
      if (!program||!program.program) {
          return ;
      }
      let maxattrib=gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
      for (let i=0; i<maxattrib; i++) {
          gl.disableVertexAttribArray(i);
      }
      let li=0;
      let layer=this.layers.get_meta(primflag, LayerTypes.LOC).layers[0];
      if (layer.dataUsed===0) {
          return ;
      }
      let buf=this.buffer.get(gl, layer.bufferKey, layer.bufferType).get(gl);
      let btype=gl.ARRAY_BUFFER;
      if (this.getIndexedMode()) {
      }
      gl.bindBuffer(btype, buf);
      gl.vertexAttribPointer(0, layer.size, layer.glSize, false, 0, 0);
      gl.enableVertexAttribArray(0);
      let bindArray=(name, type) =>        {
        if (!(layerflag&type)||(type&LayerTypes.INDEX)) {
            return ;
        }
        let meta=this.layers.get_meta(primflag, type);
        if (!meta.layers.length) {
            li++;
            return ;
        }
        else {
          for (let i=0; i<meta.layers.length; i++) {
              let layer=meta.layers[i];
              let count;
              let mli=i;
              if (layer.dataUsed===0) {
                  continue;
              }
              if (type===LayerTypes.CUSTOM) {
                  name = layer.name;
                  count = 0;
                  for (let j=0; j<meta.layers.length; j++) {
                      if (j===i) {
                          break;
                      }
                      if (meta.layers[j].type===LayerTypes.CUSTOM&&meta.layers[j].name===name) {
                          count++;
                      }
                  }
                  mli = count;
              }
              let key=ShaderProgram.multiLayerAttrKey(name, mli, gl.haveWebGL2);
              let vbo=this.buffer.get(gl, layer.bufferKey, layer.bufferType);
              let buf=vbo.get(gl);
              li = program.attrLoc(key);
              if (li<0) {
                  continue;
              }
              gl.enableVertexAttribArray(li);
              gl.bindBuffer(btype, buf);
              gl.vertexAttribPointer(li, layer.size, layer.glSize, layer.normalized, 0, 0);
          }
        }
      };
      bindArray("normal", LayerTypes.NORMAL);
      bindArray("uv", LayerTypes.UV);
      bindArray("color", LayerTypes.COLOR);
      bindArray("id", LayerTypes.ID);
      bindArray("custom", LayerTypes.CUSTOM);
    }
     addDataLayer(primflag, type, size=TypeSizes[type], name=LayerTypeNames[type]) {
      this._glAttrs[name] = 1;
      return this.layers.pushLayer(name, primflag, type, size);
    }
     getDataLayer(primflag, type, size=TypeSizes[type], name=LayerTypeNames[type]) {
      this._glAttrs[name] = 1;
      return this.layers.get(name, primflag, type, size);
    }
     _draw_points(gl, uniforms, params, program) {
      if (this.totpoint>0) {
          this.bindArrays(gl, uniforms, program, "point", PrimitiveTypes.POINTS);
          gl.drawArrays(gl.POINTS, 0, this.totpoint);
      }
      else {
        console.log("no geometry");
      }
    }
     _draw_lines(gl, uniforms, params, program) {
      if (this.totline===0) {
          return ;
      }
      if (this.getIndexedMode()) {
          let idx=this.getIndexBuffer(PrimitiveTypes.LINES);
          this.bindArrays(gl, uniforms, program, "tris", PrimitiveTypes.TRIS);
          if (!idx) {
              console.warn("Missing index layer", this);
              return ;
          }
          let vbo=this.buffer.get(gl, idx.bufferKey, idx.bufferType);
          let buf=vbo.get(gl);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
          gl.drawElements(gl.LINES, this.totline*2, gl.UNSIGNED_SHORT, 0);
      }
      else {
        this.bindArrays(gl, uniforms, program, "line", PrimitiveTypes.LINES);
        gl.drawArrays(gl.LINES, 0, this.totline*2);
      }
    }
     onContextLost(e) {
      this.regen = 1;
    }
     draw(gl, uniforms, params, program_override=undefined) {
      this.gl = gl;
      let program=this.program===undefined ? this.mesh.program : this.program;
      let primflag=this.primflag===undefined ? this.mesh.primflag : this.primflag;
      if (program_override!==undefined) {
          program = program_override;
      }
      if (this.regen) {
          this.regen = 0;
          this.gen_buffers(gl);
      }
      if (uniforms===undefined) {
          for (let k in this._uniforms_temp) {
              delete this._uniforms_temp[k];
          }
          uniforms = this._uniforms_temp;
      }
      for (let k in this.uniforms) {
          if (!(k in uniforms)) {
              uniforms[k] = this.uniforms[k];
          }
      }
      for (let k in this.mesh.uniforms) {
          if (!(k in uniforms)) {
              uniforms[k] = this.mesh.uniforms[k];
          }
      }
      if (program===undefined)
        program = gl.simple_shader;
      let attrs=this._glAttrs;
      if (!this.layers.has_multilayers) {
          program.bind(gl, uniforms, attrs);
      }
      if (this.tottri&&(primflag&PrimitiveTypes.TRIS)) {
          if (this.layers.has_multilayers) {
              program.bindMultiLayer(gl, uniforms, this.layers.attrsizes.get(PrimitiveTypes.TRIS), attrs);
          }
          this._draw_tris(gl, uniforms, params, program);
      }
      if (this.totline&&(primflag&PrimitiveTypes.LINES)) {
          if (this.layers.has_multilayers) {
              program.bindMultiLayer(gl, uniforms, this.layers.attrsizes.get(PrimitiveTypes.LINES), attrs);
          }
          this._draw_lines(gl, uniforms, params, program);
      }
      if (this.totpoint&&(primflag&PrimitiveTypes.POINTS)) {
          if (this.layers.has_multilayers) {
              program.bindMultiLayer(gl, uniforms, this.layers.attrsizes.get(PrimitiveTypes.POINTS), attrs);
          }
          this._draw_points(gl, uniforms, params, program);
      }
      if (this.totline_tristrip&&(primflag&PrimitiveTypes.ADVANCED_LINES)) {
          if (this.layers.has_multilayers) {
              program.bindMultiLayer(gl, uniforms, this.layers.attrsizes.get(PrimitiveTypes.ADVANCED_LINES), attrs);
          }
          this._draw_line_tristrips(gl, uniforms, params, program);
      }
    }
  }
  _ESClass.register(SimpleIsland);
  _es6_module.add_class(SimpleIsland);
  SimpleIsland = _es6_module.add_export('SimpleIsland', SimpleIsland);
  class SimpleMesh  {
     constructor(layerflag=LayerTypes.LOC|LayerTypes.NORMAL|LayerTypes.UV) {
      this.layerflag = layerflag;
      this.primflag = PrimitiveTypes.ALL;
      this.indexedMode = false;
      this.gl = undefined;
      this.islands = [];
      this.uniforms = {};
      this.add_island();
      this.island = this.islands[0];
    }
     reset(gl) {
      for (let island of this.islands) {
          island.reset(gl);
      }
    }
     flagRecalc() {
      for (let island of this.islands) {
          island.flagRecalc();
      }
    }
     getDataLayer(primflag, type, size=TypeSizes[type], name=LayerTypeNames[type]) {
      let ret;
      for (let island of this.islands) {
          let ret2=island.getDataLayer(primflag, type, size, name);
          if (island===this.island) {
              ret = ret2;
          }
      }
      return ret;
    }
     addDataLayer(primflag, type, size=TypeSizes[type], name=LayerTypeNames[type]) {
      let ret;
      for (let island of this.islands) {
          let ret2=island.addDataLayer(primflag, type, size, name);
          if (island===this.island) {
              ret = ret2;
          }
      }
      return ret;
    }
     copy() {
      let ret=new SimpleMesh();
      ret.primflag = this.primflag;
      ret.layerflag = this.layerflag;
      for (let k in this.uniforms) {
          ret.uniforms[k] = this.uniforms[k];
      }
      for (let island of this.islands) {
          let island2=island.copy();
          island2.mesh = ret;
          ret.islands.push(island2);
          if (island===this.island) {
              ret.island = island2;
          }
      }
      return ret;
    }
     add_island() {
      let island=new SimpleIsland(this);
      this.island = island;
      this.islands.push(island);
      return island;
    }
     destroy(gl=this.gl) {
      if (!gl) {
          console.warn("failed to destroy a mesh");
          return ;
      }
      for (var island of this.islands) {
          island.destroy(gl);
      }
    }
     tri(v1, v2, v3) {
      return this.island.tri(v1, v2, v3);
    }
     quad(v1, v2, v3, v4) {
      return this.island.quad(v1, v2, v3, v4);
    }
     line(v1, v2) {
      return this.island.line(v1, v2);
    }
     point(v1) {
      return this.island.point(v1);
    }
     smoothline(v1, v2) {
      return this.island.smoothline(v1, v2);
    }
     drawLines(gl, uniforms, program_override=undefined) {
      for (let island of this.islands) {
          let primflag=island.primflag;
          island.primflag = PrimitiveTypes.LINES|PrimitiveTypes.ADVANCED_LINES;
          island.draw(gl, uniforms, undefined, program_override);
          island.primflag = primflag;
      }
    }
     draw(gl, uniforms, program_override=undefined) {
      this.gl = gl;
      for (var island of this.islands) {
          island.draw(gl, uniforms, undefined, program_override);
      }
    }
  }
  _ESClass.register(SimpleMesh);
  _es6_module.add_class(SimpleMesh);
  SimpleMesh = _es6_module.add_export('SimpleMesh', SimpleMesh);
  let IDMap=util.IDMap;
  class ChunkedSimpleMesh extends SimpleMesh {
     constructor(layerflag=LayerTypes.LOC|LayerTypes.NORMAL|LayerTypes.UV, chunksize=2048) {
      super(layerflag);
      this.chunksize = chunksize;
      this.islands = [];
      this.uniforms = {};
      this.primflag = PrimitiveTypes.TRIS;
      this.island = undefined;
      this.quad_editors = util.cachering.fromConstructor(QuadEditor, 32, true);
      this.freelist = [];
      this.freeset = new Set();
      this.delset = undefined;
      this.chunkmap = new IDMap();
      this.idmap = new IDMap();
      this.idgen = 0;
    }
     reset(gl) {
      this.chunkmap = new IDMap();
      this.idmap = new IDMap();
      this.freelist.length = 0;
      this.freeset = new Set();
      this.delset = undefined;
      for (let island of this.islands) {
          island.reset(gl);
      }
    }
     free(id) {
      let chunk=this.chunkmap.get(id);
      if (chunk===undefined||this.freeset.has(id)) {
          return ;
      }
      this.freelist.push(chunk);
      this.freelist.push(id);
      this.freeset.add(id);
      let island=this.islands[chunk];
      let i=this.idmap.get(id);
      island.point_cos.copy(i, zero);
      island.line_cos.copy(i*2, zero);
      island.line_cos.copy(i*2+1, zero);
      island.tri_cos.copy(i*3, zero);
      island.tri_cos.copy(i*3+1, zero);
      island.tri_cos.copy(i*3+2, zero);
      island.flagRecalc();
    }
     get_chunk(id) {
      if (id>1<<18&&__instance_of(this.idmap, IDMap)) {
          let idmap=new Map();
          for (let /*unprocessed ExpandNode*/[k, v] of this.idmap) {
              idmap.set(k, v);
          }
          this.idmap = idmap;
          let chunkmap=new Map();
          for (let /*unprocessed ExpandNode*/[k, v] of this.chunkmap) {
              chunkmap.set(k, v);
          }
          this.chunkmap = chunkmap;
      }
      if (this.chunkmap.has(id)) {
          return this.islands[this.chunkmap.get(id)];
      }
      if (this.freelist.length>0) {
          let id2=this.freelist.pop();
          let chunk=this.freelist.pop();
          this.chunkmap.set(id, chunk);
          this.idmap.set(id, id2);
          return this.islands[chunk];
      }
      let chunki=this.islands.length;
      let chunk=this.add_island();
      chunk.primflag = this.primflag;
      for (let i=0; i<this.chunksize; i++) {
          this.freelist.push(chunki);
          this.freelist.push(this.chunksize-i-1);
          chunk.tri(zero, zero, zero);
      }
      return this.get_chunk(id);
    }
     onContextLost(e) {
      for (var island of this.islands) {
          island.onContextLost(e);
      }
    }
     destroy(gl) {
      for (var island of this.islands) {
          island.destroy(gl);
      }
      this.regen = 1;
      this.chunkmap = new IDMap();
      this.idmap = new IDMap();
      this.freelist.length = 0;
      this.islands.length = 0;
      this.add_island();
    }
     tri(id, v1, v2, v3) {
      if (0) {
          function isvec(v) {
            if (!v) {
                return false;
            }
            let ret=typeof v.length==="number";
            ret = ret&&v.length>=3;
            ret = ret&&typeof v[0]==="number";
            ret = ret&&typeof v[1]==="number";
            ret = ret&&typeof v[2]==="number";
            return ret;
          }
          let bad=typeof id!=="number";
          bad = bad||Math.floor(id)!==id;
          bad = bad||!isvec(v1);
          bad = bad||!isvec(v2);
          bad = bad||!isvec(v3);
          if (bad) {
              throw new Error("bad parameters");
          }
      }
      let chunk=this.get_chunk(id);
      let itri=this.idmap.get(id);
      chunk.flagRecalc();
      chunk.glFlagUploadAll(PrimitiveTypes.TRIS);
      let tri_cos=chunk.tri_cos;
      let i=itri*9;
      if (tri_cos.dataUsed<i+9) {
          chunk.regen = 1;
          return chunk.tri(v1, v2, v3);
      }
      else {
        tri_cos.glReady = false;
        tri_cos = tri_cos._getWriteData();
        tri_cos[i++] = v1[0];
        tri_cos[i++] = v1[1];
        tri_cos[i++] = v1[2];
        tri_cos[i++] = v2[0];
        tri_cos[i++] = v2[1];
        tri_cos[i++] = v2[2];
        tri_cos[i++] = v3[0];
        tri_cos[i++] = v3[1];
        tri_cos[i++] = v3[2];
        if (i>tri_cos.length) {
            console.log(i, tri_cos.length, tri_cos);
            throw new Error("range error");
        }
      }
      chunk.regen = 1;
      return chunk.tri_editors.next().bind(chunk, itri);
    }
     quad(id, v1, v2, v3, v4) {
      throw new Error("unsupported for chunked meshes");
    }
     smoothline(id, v1, v2) {
      let chunk=this.get_chunk(id);
      let iline=this.idmap.get(id);
      chunk.flagRecalc();
      chunk.glFlagUploadAll(PrimitiveTypes.ADVANCED_LINES);
      if (!chunk.line_cos2) {
          chunk.primflag|=PrimitiveTypes.ADVANCED_LINES;
          this.layerflag|=LayerTypes.CUSTOM;
          chunk.makeBufferAliases();
      }
      let line_cos=chunk.line_cos2;
      let i=iline*18;
      if (line_cos.dataUsed<i+18) {
          let ret=chunk.smoothline(v1, v2);
          iline = ret.i;
          this.idmap.set(id, iline);
          return ret;
      }
      else {
        line_cos = line_cos._getWriteData();
        line_cos[i++] = v1[0];
        line_cos[i++] = v1[1];
        line_cos[i++] = v1[2];
        line_cos[i++] = v1[0];
        line_cos[i++] = v1[1];
        line_cos[i++] = v1[2];
        line_cos[i++] = v2[0];
        line_cos[i++] = v2[1];
        line_cos[i++] = v2[2];
        line_cos[i++] = v1[0];
        line_cos[i++] = v1[1];
        line_cos[i++] = v1[2];
        line_cos[i++] = v2[0];
        line_cos[i++] = v2[1];
        line_cos[i++] = v2[2];
        line_cos[i++] = v2[0];
        line_cos[i++] = v2[1];
        line_cos[i++] = v2[2];
        if (i>line_cos.length) {
            console.log(i, line_cos.length, line_cos);
            throw new Error("range error");
        }
      }
      chunk.regen = 1;
      return chunk.tristrip_line_editors.next().bind(chunk, iline);
    }
     line(id, v1, v2) {
      let chunk=this.get_chunk(id);
      let iline=this.idmap.get(id);
      chunk.flagRecalc();
      chunk.glFlagUploadAll(PrimitiveTypes.LINES);
      let line_cos=chunk.line_cos;
      let i=iline*6;
      if (line_cos.dataUsed<i+6) {
          chunk.line(v1, v2);
      }
      else {
        line_cos = line_cos._getWriteData();
        line_cos[i++] = v1[0];
        line_cos[i++] = v1[1];
        line_cos[i++] = v1[2];
        line_cos[i++] = v2[0];
        line_cos[i++] = v2[1];
        line_cos[i++] = v2[2];
        if (i>line_cos.length) {
            console.log(i, line_cos.length, line_cos);
            throw new Error("range error");
        }
      }
      chunk.regen = 1;
      return chunk.line_editors.next().bind(chunk, iline);
    }
     point(id, v1) {
      let chunk=this.get_chunk(id);
      let ipoint=this.idmap.get(id);
      chunk.flagRecalc();
      chunk.glFlagUploadAll(PrimitiveTypes.POINTS);
      let point_cos=chunk.point_cos;
      let i=ipoint*3;
      if (point_cos.dataUsed<i+3) {
          chunk.point(v1);
      }
      else {
        point_cos = point_cos._getWriteData();
        point_cos[i++] = v1[0];
        point_cos[i++] = v1[1];
        point_cos[i++] = v1[2];
        if (i>point_cos.length) {
            console.log(i, point_cos.length, point_cos);
            throw new Error("range error");
        }
      }
      chunk.regen = 1;
      return chunk.point_editors.next().bind(chunk, ipoint);
    }
     draw(gl, uniforms, program_override=undefined) {
      this.gl = gl;
      for (var island of this.islands) {
          island.draw(gl, uniforms, undefined, program_override);
      }
    }
  }
  _ESClass.register(ChunkedSimpleMesh);
  _es6_module.add_class(ChunkedSimpleMesh);
  ChunkedSimpleMesh = _es6_module.add_export('ChunkedSimpleMesh', ChunkedSimpleMesh);
}, '/dev/fairmotion/src/webgl/simplemesh.js');

