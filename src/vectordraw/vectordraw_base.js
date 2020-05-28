"use strict";

export var VectorFlags = {
  //SELECT : 1,
  UPDATE : 2,
  TAG    : 4
};

export class VectorVertex extends Vector2 {
  constructor(co) {
    super(co);
  }

  loadSTRUCT(reader) {
    reader(this);

    this.load(this._vec);
    delete this._vec;
  }
}
VectorVertex.STRUCT = `
VectorVertex {
  _vec : vec2;
}
`;

/*
on factor;
off period;

procedure bez(a, b);
  a + (b - a)*s;

quad  := bez(bez(k1, k2), bez(k2, k3));
dquad := df(quad, s);
cubic := bez(quad, sub(k3=k4, k2=k3, k1=k2, quad));

f1 := sub(s=0, quad) - target;
f2 := sub(s=0, dquad) - dtarget;

f3 := sub(s=1, quad) - target;
f4 := sub(s=1, dquad) - dtarget;

solve({f1, f2}, {k1, k2});
solve({f3, f4}, {k2, k3});

f1 := x1 + dx1*t1 - x4 - dx2*t2;
f2 := y1 + dy1*t1 - y4 - dy2*t2;
f := solve({f1, f2}, {t1, t2});

*/
export class QuadBezPath {
  off : Vector2
  blur : number
  color : Vector4
  clip_paths : set
  clip_users : set;

  constructor() {
    this.off = new Vector2();
    this.id = -1;
    this.z = undefined;
    this.blur = 0;
    this.size = [-1, -1];
    this.index = -1;
    
    this.color = new Vector4();
    this.aabb = [new Vector2(), new Vector2()];
    
    //clip_paths is list of paths used to generate stencil buffer
    this.clip_paths = new set();
    this.clip_users = new set();
  }
  
  
  add_clip_path(path) {
    if (!this.clip_paths.has(path)) {
      this.update();
    }
    
    path.clip_users.add(this);
    this.clip_paths.add(path);
  }
  
  reset_clip_paths() {
    if (this.clip_paths.length > 0) {
      //this.update();
    }
    
    for (var path of this.clip_paths) {
      path.clip_users.remove(this);
    }
    this.clip_paths.reset();
  }
  
  update_aabb(draw, fast_mode=false) {
    throw new Error("implement me!");
  }
  
  beginPath() {
    throw new Error("implement me");
  }
  
  undo() { //remove last added path
    throw new Error("implement me");
  }
  
  moveTo(x, y) {
    this.lastx = x;
    this.lasty = y;
    throw new Error("implement me");
  }
  
  bezierTo(x2, y2, x3, y3) {
    this.lastx = x3;
    this.lasty = y3;
    throw new Error("implement me");
  }
  
  cubicTo(x2, y2, x3, y3, x4, y4, subdiv=1) {
    var x1 = this.lastx, y1 = this.lasty;

    if (subdiv > 0) {
      var dx1 = (x2-x1)*0.5, dy1 = (y2-y1)*0.5;
      var dx2 = (x4-x3)*0.5, dy2 = (y4-y3)*0.5;
      
      var dxmid = (x3 + x4 - x2 - x1)*0.25;
      var dymid = (y3 + y4 - y2 - y1)*0.25;
      
      var midx = (3*x3 + x4 + 3*x2 + x1)/8.0;
      var midy = (3*y3 + y4 + 3*y2 + y1)/8.0;
      
      this.cubicTo(x2+dx1, y2+dy1, midx-dxmid, midy-dymid, midx, midy, subdiv-1);
      this.cubicTo(midx+dxmid, midy+dymid, x4-dx2, y4-dy2, x4, y4, subdiv-1);
      return;
    }
    
    var dx1 = (x2-x1)*3.0, dy1 = (y2-y1)*3.0;
    var dx2 = (x4-x3)*3.0, dy2 = (y4-y3)*3.0;
    
    var tdiv = (dx1*dy2 - dx2*dy1);
    var t = (-(x1-x4)*dy2+(y1-y4)*dx2);
    var midx, midy;
    
    if (tdiv != 0.0) {
      t /= tdiv;
      
      midx = x1 + dx1*t;
      midy = y1 + dy1*t;
    } else {
      midx = (x2 + x3)*0.5;
      midy = (y2 + y3)*0.5;
    }
    
    this.bezierTo(midx, midy, x4, y4);
    
    this.lastx = x4;
    this.lasty = y4;
  }
  
  lineTo(x2, y2) {
    throw new Error("implement me");
    this.lastx = x2;
    this.lasty = y2;
  }
  
  destroy(draw) {
  }
  
  reset(draw) {
    this.pan.zero();
  }
  
  draw(draw, offx=0, offy=0) {
  }
  
  update() {
    throw new Error("implement me!");
  }
  
  [Symbol.keystr]() {
    return this.id;
  }
}

var pop_transform_rets = new cachering(function() {
  return new Matrix4();
}, 32);

export class VectorDraw {
  constructor() {
    this.pan = new Vector2();
    this.do_blur = true;
    
    this.matstack = new Array(256);
    for (var i=0; i<this.matstack.length; i++) {
      this.matstack[i] = new Matrix4();
    }
    this.matstack.cur = 0;
    
    this.matrix = new Matrix4();
  }
  
  //creates new path if necessary.  z is required
  get_path(id, z, check_z=true) {
    if (z === undefined) {
      throw new Error("z cannot be undefined");
    }
    
    throw new Error("implement me");
  }
  
  //returns false if path with id does not exist,
  //and also false if it does, but has a different z value.
  has_path(id, z, check_z=true) {
    if (z === undefined) {
      throw new Error("z cannot be undefined");
    }
    throw new Error("implement me");
  }
  
  remove(path) {
    for (var path2 of path.clip_users) {
      path2.clip_paths.remove(path);
      path2.update();
    }
    
    delete this.path_idmap[path.id];
    this.paths.remove(path);
    
    path.destroy(this);
  }
  
  update() {
    throw new Error("implement me");
  }
  
  destroy() {
    throw new Error("implement me");
  }
  
  draw() {
    throw new Error("implement me");
  }
  
  push_transform(mat, multiply_instead_of_load=true) {
    this.matstack[this.matstack.cur++].load(this.matrix);
    
    if (mat != undefined && multiply_instead_of_load) {
      this.matrix.multiply(mat);
    } else if (mat != undefined) {
      this.matrix.load(mat);
    }
  }
  
  //returns popped matrix
  pop_transform() {
    var ret = pop_transform_rets.next();
    ret.load(this.matrix);
    
    this.matrix.load(this.matstack[--this.matstack.cur]);
    return ret;
  }
  
  translate(x, y) {
    this.matrix.translate(x, y);
  }
  
  scale(x, y) {
    this.matrix.scale(x, y, 1.0);
  }
  
  rotate(th) {
    this.matrix.euler_rotate(0, 0, th);
  }
  
  //set draw matrix
  set_matrix(matrix) {
    this.matrix.load(matrix);
  }
  get_matrix() {
    return this.matrix;
  }
}
