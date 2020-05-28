"use strict";

import * as config from '../config/config.js';

import {
  MinMax
} from '../util/mathlib.js';

import {
  VectorFlags, VectorVertex, QuadBezPath,
  VectorDraw
} from './vectordraw_base.js';

var canvaspath_draw_mat_tmps = new cachering(_ => new Matrix4(), 16);

var canvaspath_draw_args_tmps = new Array(8);
for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
  canvaspath_draw_args_tmps[i] = new Array(i);
}
var canvaspath_draw_vs = new cachering(function() {
  return new Vector2();
}, 32);

var CCMD=0, CARGLEN=1;

var MOVETO = 0, BEZIERTO=1, LINETO=2, BEGINPATH=3;
var NS = "http://www.w3.org/2000/svg";
var XLS = "http://www.w3.org/1999/xlink"

export function makeElement(type, attrs={}) {
  var ret = document.createElementNS(NS, type);
  for (var k in attrs) {
    ret.setAttributeNS(null, k, attrs[k]);
  }
  
  return ret;
}

export class SVGPath extends QuadBezPath {
recalc : number
lastx : number
lasty : number
_last_off : Vector2
clip_users : set
path_start_i : number
first : boolean
_mm : MinMax;

  constructor() {
    super();
    
    this.commands = [];
    this.recalc = 1;
    
    this.lastx = 0;
    this.lasty = 0;
    this._last_z = undefined;
    
    this._last_off = new Vector2();
    this._last_off[0] = this._last_off[1] = 1e17;
    
    this.domnode = undefined;
    this.filternode = undefined;
    
    this.clip_users = new set();
    
    this.path_start_i = 0;
    this.first = true;
    this._mm = new MinMax(2);
  }
  
  update_aabb(draw, fast_mode=false) {
    var tmp = new Vector2();
    var mm = this._mm;
    var pad = this.pad = this.blur > 0 ? this.blur*draw.zoom + 15 : 0;
    
    mm.reset();
    
    if (fast_mode) {
      console.trace("FAST MODE!");
    }
    
    var prev = -1;
    var cs = this.commands, i = 0;
    while (i < cs.length) {
      var cmd = cs[i++];
      var arglen = cs[i++];
      
      if (fast_mode && prev != BEGINPATH) {
        prev = cmd;
        i += arglen;
        continue;
      }
      
      for (var j=0; j<arglen; j += 2) {
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
  
  undo() { //remove last added path
    //hrm, wonder if I should update the aabb.  I'm thinking not.
    this.commands.length = this.path_start_i;
  }

  _pushCmd() {
    this.commands.push(arguments[0]);
    var arglen = arguments.length - 1;
    
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
      return;
    }
    
    this._pushCmd(LINETO, x2, y2);
    this.lastx = x2;
    this.lasty = y2;
  }
  
  destroy(draw) {
    if (this.domnode != undefined) {
      this.domnode.remove();
      this.domnode = undefined;
    }
    
    if (this.filternode != undefined) {
      this.filternode.remove();
      this.filternode = undefined;
    }
    
    if (this.usenode != undefined) {
      this.usenode.remove();
      this.usenode = undefined;
    }
  }
  
  get_dom_id(draw) {
    return draw.svg.id + "_path_" + this.id;
  }
  
  gen(draw, _check_tag=0) {
    //console.log("path gen", this.id);
    
    if (_check_tag && !this.recalc) {
      console.log("infinite loop in clip stack");
      return;
    }
    
    this.recalc = 0;
    
    var do_clip = this.clip_paths.length > 0;
    var do_blur = this.blur > 0.0;
    
    //var zoom = draw.matrix.$matrix.m11; //scale should always be uniform, I think
    
    this.update_aabb(draw);
    
    var w = this.size[0] = Math.ceil(this.aabb[1][0]-this.aabb[0][0]);
    var h = this.size[1] = Math.ceil(this.aabb[1][1]-this.aabb[0][1]);
    
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
    
    var domid = this.get_dom_id(draw);
    var node = this.domnode;
    
    if (node == undefined) {
      node = this.domnode = document.getElementById(domid);
      
      if (node == undefined) {
        node = this.domnode = makeElement("path");
        node.id = domid;
        node.setAttributeNS(null, "id", domid);
        
        draw.defs.appendChild(node);
        //draw.group.appendChild(node);
        
        var useid = domid + "_use";
        
        //remove any existing usenodes
        var usenode = document.getElementById(useid);
        if (usenode != undefined) {
          usenode.remove();
        }
        
        usenode = makeElement("use", {
          "id" : useid
        });
        
        usenode.setAttributeNS(XLS, "xlink:href", "#"+domid);
        draw.group.appendChild(usenode);
        
        this.usenode = usenode;
      }
    }
    
    if (this.usenode == undefined) {
      this.usenode = document.getElementById(domid + "_use");
    }
    
    //force update of z position if necassary
    for (var i=0; i<draw.group.childNodes.length; i++) {
      if (draw.group.childNodes[i] === this.usenode) {
        this._last_z = i; //account for defs node
        //console.log("Found last z!", this.z, this._last_z);
        break;
      }
    }
    
    var fid = draw.svg.id + "_" + this.id + "_blur";
    var blur, filter;
    
    if (this.blur*draw.zoom > 1) {
      if (this.filternode == undefined) {
        filter = this.filternode = document.getElementById(fid);
      } else {
        filter = this.filternode;
      }
      
      var w2 = w - this.pad*2, h2 = h - this.pad*2;
      var wratio = 2.0*(w / w2)*100.0, hratio = 2.0*(h / h2)*100.0;
      
      var fx = ""+(-wratio/4)+"%", fy=""+(-hratio/4)+"%",
          fwidth=""+wratio+"%", fheight=""+hratio+"%";
          
      if (filter == undefined) {
        //console.log("wratio, hratio:", wratio.toFixed(4), hratio.toFixed(4));
        
        var defs = draw.defs;
        var filter = this.filternode = makeElement("filter", {
          id : fid,
          x : fx,
          y : fy,
          width : fwidth,
          height : fheight
        });
        
        var blur = makeElement("feGaussianBlur", {
          stdDeviation : ~~(this.blur*draw.zoom*0.5),
          "in" : "SourceGraphic"
        });
        
        filter.appendChild(blur);
        defs.appendChild(filter);
        
        node.setAttributeNS(null, "filter", "url(#"+fid+")");
      } else {
        if (filter.getAttributeNS(null, "x") != fx)
          filter.setAttributeNS(null, "x", fx);
        if (filter.getAttributeNS(null, "y") != fy)
          filter.setAttributeNS(null, "y", fy);
        if (filter.getAttributeNS(null, "width") != fwidth)
          filter.setAttributeNS(null, "width", fwidth);
        if (filter.getAttributeNS(null, "height") != fheight)
          filter.setAttributeNS(null, "hratio", fheight);

        blur = filter.childNodes[0];
        
        if (!blur.hasAttributeNS(null, "stdDeviation") || 
            parseFloat(blur.getAttributeNS(null, "stdDeviation")) != ~~(this.blur*draw.zoom*0.5))
        {
          blur.setAttributeNS(null, "stdDeviation", ~~(this.blur*draw.zoom*0.5));
        }
      }
    } else if (this.filternode != undefined) {
      node.removeAttributeNS(null, "filter");
      
      this.filternode.remove();
      this.filternode = undefined;
    }

    var clipid = draw.svg.id + "_" + this.id + "_clip";
    
    if (this.clip_paths.length > 0) {
      var clip = this.clipnode;
      
      if (clip == undefined) {
        clip = this.clipnode = document.getElementById(clipid);
      }
      
      if (clip == undefined) {
        clip = this.clipnode = makeElement("clipPath", {
          id : clipid
        });
        draw.defs.appendChild(clip);
       
        for (var path of this.clip_paths) {
          if (path.recalc) {
            console.log("  clipping subgen!");
            path.gen(draw, 1);
          }
          
          var usenode = makeElement("use");
          //console.log(usenode.constructor);
          
          usenode.setAttributeNS(XLS, "xlink:href", "#"+path.domnode.getAttributeNS(null, "id"));
          //usenode.setAttributeNS(null, "x", path.off[0]);
          //usenode.setAttributeNS(null, "y", path.off[1]);
          
          //var transform = "translate(" + (path.off[0]) + "," + (path.off[1]) + ")";
          //usenode.setAttributeNS(null, "transform", transform);
          
          clip.appendChild(usenode);
        }
      }
      
      node.setAttributeNS(null, "clip-path", "url(#"+clipid+")");
    } else if (this.clipnode != undefined) {
     node.removeAttributeNS(null, "clip-path");
     this.clipnode.remove();
     this.clipnode = undefined;
    }
   
    /*
    for (var path of this.clip_paths) {
      //console.log("CLIPPING!", path);
      
      if (path.recalc) {
        console.log("  clipping subgen!");
        path.gen(draw, 1);
      }
      
      path.draw(draw, -this.aabb[0][0], -this.aabb[0][1], this.canvas, this.g);
    }*/
    
    var mat = canvaspath_draw_mat_tmps.next();
    mat.load(draw.matrix);
    
    var co = canvaspath_draw_vs.next().zero();
    
    if (node == undefined) {
      node = document.getElementById(domid);
      console.log("undefined node!", this.domnode, document.getElementById(domid), domid);
      return;
    }
    
    var r = ~~(this.color[0]*255),
        g = ~~(this.color[1]*255),
        b = ~~(this.color[2]*255),
        a = this.color[3];
    
    node.setAttributeNS(null, "fill", "rgba("+r+","+g+","+b+","+a+")");
    /*
    if (do_blur) {
      var doff = 25000;
      this.g.translate(-doff, -doff);
      this.g.shadowOffsetX = doff;
      this.g.shadowOffsetY = doff;
      this.g.shadowColor = "rgba("+r+","+g+","+b+","+a+")";
      this.g.shadowBlur = this.blur;
    }
    */
    
    var d = "";

    var cs = this.commands, i = 0;
    while (i < cs.length) {
      var cmd = cs[i++];
      var arglen = cs[i++];
      
      //console.log(cmd, arglen);
      
      var tmp = canvaspath_draw_args_tmps[arglen];
      var h = parseFloat(draw.svg.getAttributeNS(null, "height"));
      
      for (var j=0; j<arglen; j += 2) {
        co[0] = cs[i++], co[1] = cs[i++];
        co.multVecMatrix(mat);
        
        //nan check
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
          d += "M" + tmp[0] + " " + tmp[1];
          break;
        case LINETO:
          d += "L" + tmp[0] + " " + tmp[1];
          break;
        case BEZIERTO:
          d += "Q" + tmp[0] + " " + tmp[1] + " " + tmp[2] + " " + tmp[3];
          break;
        case BEGINPATH:
          //XXX does svg have this within path elements?
          break;
      }
    }
    
    node.setAttributeNS(null, "d", d);
  }
  
  reset(draw) {
    //this.recalc = 1;
    this.commands.length = 0;
    this.path_start_i = 0;
    this.off.zero();
    this._last_off[0] = this._last_off[1] = 1e17;
    this.first = true;
  }
  
  draw(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g) {
    offx += this.off[0], offy += this.off[1];
    
    this._last_z = this.z;
    
    if (this.recalc) {
      this.recalc = 0;
      
      this.gen(draw);
    }
    
    if (this._last_off[0] != offx || this._last_off[1] != offy) {
      this._last_off[0] = offx;
      this._last_off[1] = offy;
      
      var transform = "translate(" + offx + "," + offy + ")";
      this.usenode.setAttributeNS(null, "transform", transform);
    }
  }
  
  update() {
    this.recalc = 1;
  }
}

export class SVGDraw2D extends VectorDraw {
  path_idmap : Object
  dosort : boolean
  matstack : Array
  matrix : Matrix4;

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
  
  static get_canvas(id, width, height, zindex) {
    var ret = document.getElementById(id);
    
    if (ret == undefined) {
      ret = makeElement("svg", {
        width  : width,
        height : height
      });
      
      ret.id = id;
      ret.setAttributeNS(null, "id", id);
      ret.style["position"] = "absolute";
      ret.style["z-index"] = zindex;
      
      console.trace("\tZINDEX: ", zindex)
      
      document.body.appendChild(ret);
    }
    
    if (ret.width != width) {
      ret.setAttributeNS(null, "width", width);
    }
    if (ret.height != height) {
      ret.setAttributeNS(null, "height", height);
    }
    
    return ret;
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
      this.path_idmap[id] = new SVGPath();
      this.path_idmap[id].index = this.paths.length;
      this.path_idmap[id].id = id;

      this.paths.push(this.path_idmap[id]);
    }
    
    var ret = this.path_idmap[id];
    
    if (check_z && ret.z != z) {
      this.dosort = 1;
      ret.z = z;
    }
    
    return ret;
  }
  
  update() {
    for (var path of this.paths) {
      //path.update(this);
    }
  }
  
  static kill_canvas(svg) {
    if (svg != undefined) {
      svg.remove();
    }
  }
  
  destroy() {
    return;
    console.log("DESTROY!");
    
    for (var path of this.paths) {
      path.destroy(this);
    }
    
    this.paths.length = 0;
    this.path_idmap = {};
    
    if (this.svg != undefined) {
      this.svg.remove();
      this.svg = this.defs = undefined;
    }
  }
  
  draw(g) {
    var canvas = g.canvas;
    
    if (canvas.style["background"] != "rgba(0,0,0,0)") {
      canvas.style["background"] = "rgba(0,0,0,0)";
    }
    
    this.svg = SVGDraw2D.get_canvas(canvas.id + "_svg", canvas.width, canvas.height, 1);
    
    var this2 = this;
    function onkillscreen() {
      window.removeEventListener(onkillscreen);
      
      SVGDraw2D.kill_canvas(this2.svg);
      this2.svg = undefined;
    }
    
    //custom event
    window.addEventListener("killscreen", onkillscreen);
    
    var defsid = this.svg.id + "_defs";
    var defs = document.getElementById(defsid);
    
    if (defs == undefined) {
      defs = makeElement("defs", {
        id : defsid
      });
      defs.id = defsid;
      this.svg.appendChild(defs);
    }
    this.defs = defs;
    
    var groupid = this.svg.id + "_maingroup";
    var group = document.getElementById(groupid);
    
    if (group == undefined) {
      group = makeElement("g", {
        id : groupid
      });
      this.svg.appendChild(group);
    }
    this.group = group;
    
    //update pan
    var transform = "translate("+this.pan[0] + "," + this.pan[1] + ")";
    if (!group.hasAttributeNS(null, "transform") || group.getAttributeNS(null, "transform") != transform) {
      group.setAttributeNS(null, "transform", transform);
    }
    
    if (this.svg.style["left"] != canvas.style["left"])
      this.svg.style["left"] = canvas.style["left"];
    
    if (this.svg.style["top"] != canvas.style["top"])
      this.svg.style["top"] = canvas.style["top"];
    
    for (var path of this.paths) {
      if (path.z != path._last_z) {
        this.dosort = 1;
        
        path.recalc = 1;
        path._last_z = path.z;
      }
    }
    
    //force path recalc here
    for (var path of this.paths) {
      if (path.recalc) {
        path.gen(this);
      }
    }
    
    if (this.dosort) {
      console.log("SVG sort!");
      
      this.dosort = 0;
      this.paths.sort(function(a, b) {
        return a.z - b.z;
      });
      
      //clear all use nodes;
      var cs = this.group.childNodes;
      for (var i=0; i<cs.length; i++) {
        var n = cs[i];
        
        if (n.tagName.toUpperCase() == "USE") {
          n.remove();
          i--;
        }
      }
      
      for (var path of this.paths) {
        if (path.hidden) {
          path.usenode = undefined;
          continue;
        }
        
        var useid = path.get_dom_id(this) + "_use";
        var usenode = path.usenode = makeElement("use", {
          "id" : useid
        });
          
        usenode.setAttributeNS(XLS, "xlink:href", "#"+path.get_dom_id(this));
        
        //force setting of transform property
        path._last_off[0] = path._last_off[1] = 1e17;
        
        //if (path.domnode != undefined && path.clipnode != undefined) {
        //  usenode.setAttributeNS(null, "clip-path", "url(#"+path.clipnode.id+")");
        //}
        
        this.group.appendChild(usenode);
      }
    }
    
    for (var path of this.paths) {
      if (!path.hidden)
        path.draw(this);
    }
  }
  
  //set draw matrix
  set_matrix(matrix) {
    super.set_matrix(matrix);
    
    this.zoom = matrix.$matrix.m11;
  }
}
