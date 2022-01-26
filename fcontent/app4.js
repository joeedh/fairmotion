
es6_module_define('math', ["./vectormath.js", "./util.js"], function _math_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, './util.js');
  var vectormath=es6_import(_es6_module, './vectormath.js');
  var Vector2=es6_import_item(_es6_module, './vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, './vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, './vectormath.js', 'Vector4');
  var Matrix4=es6_import_item(_es6_module, './vectormath.js', 'Matrix4');
  var Quat=es6_import_item(_es6_module, './vectormath.js', 'Quat');
  let dtvtmps=util.cachering.fromConstructor(Vector3, 32);
  let quad_co_rets2=util.cachering.fromConstructor(Vector2, 512);
  function quad_bilinear(v1, v2, v3, v4, u, v) {
    return -((v1-v2)*u-v1-(u*v1-u*v2+u*v3-u*v4-v1+v4)*v);
  }
  quad_bilinear = _es6_module.add_export('quad_bilinear', quad_bilinear);
  function quad_uv_2d(p, v1, v2, v3, v4) {
    let u, v;
    let v2x=v2[0]-v1[0];
    let v2y=v2[1]-v1[1];
    let v3x=v3[0]-v1[0];
    let v3y=v3[1]-v1[1];
    let v4x=v4[0]-v1[0];
    let v4y=v4[1]-v1[1];
    let x=p[0]-v1[0];
    let y=p[1]-v1[1];
    let sqrt=Math.sqrt;
    let A=2*(((v4y+y)*x-2*v4x*y)*v3y+(v4x*y-v4y*x)*(v4y+y)-((v4x-x)*v2y-v3x*y)*(v4y-y))*v2x-2*((v4x*y-v4y*x)*(v4x+x)-(v4x-x)*v3y*x+((2*v4y-y)*x-v4x*y)*v3x)*v2y+(v4x*y-v4y*x+v3y*x-v3x*y)**2+(v4x-x)**2*v2y**2+(v4y-y)**2*v2x**2;
    let B=v4x*y-v4y*x+v3y*x-v3x*y;
    let C1=(2*(v3x-v4x)*v2y-2*(v3y-v4y)*v2x);
    let C2=(2*(v3x*v4y-v3y*v4x+v2y*v4x)-2*v2x*v4y);
    let u1, u2;
    if (A<0.0) {
        console.log("A was < 0", A);
        A = -A;
        C1 = C2 = 0.0;
    }
    if (Math.abs(C1)<1e-05) {
        let dx=v2x;
        let dy=v2y;
        console.log("C1 bad");
        let l=Math.sqrt(dx*dx+dy*dy);
        if (l>1e-06) {
            dx/=l*l;
            dy/=l*l;
        }
        u1 = u2 = dx*x+dy*y;
    }
    else {
      u1 = (-(B+sqrt(A)-(v4y-y)*v2x)-(v4x-x)*v2y)/C1;
      u2 = (-(B-sqrt(A)-(v4y-y)*v2x)-(v4x-x)*v2y)/C1;
    }
    if (Math.abs(C2)<1e-05) {
        let dx, dy;
        dx = v3x-v2x;
        dy = v3y-v2y;
        console.log("C2 bad");
        let l=Math.sqrt(dx**2+dy**2);
        if (l>1e-05) {
            dx/=l*l;
            dy/=l*l;
        }
        v1 = v2 = x*dx+y*dy;
    }
    else {
      v1 = (-(B-sqrt(A)+(v4y+y)*v2x)+(v4x+x)*v2y)/C2;
      v2 = (-(B+sqrt(A)+(v4y+y)*v2x)+(v4x+x)*v2y)/C2;
    }
    let ret=quad_co_rets2.next();
    let d1=(u1-0.5)**2+(v1-0.5)**2;
    let d2=(u2-0.5)**2+(v2-0.5)**2;
    if (d1<d2) {
        ret[0] = u1;
        ret[1] = v1;
    }
    else {
      ret[0] = u2;
      ret[1] = v2;
    }
    return ret;
  }
  const ClosestModes={CLOSEST: 0, 
   START: 1, 
   END: 2, 
   ENDPOINTS: 3, 
   ALL: 4}
  _es6_module.add_export('ClosestModes', ClosestModes);
  let advs=util.cachering.fromConstructor(Vector4, 128);
  class AbstractCurve  {
     evaluate(t) {
      throw new Error("implement me");
    }
     derivative(t) {

    }
     curvature(t) {

    }
     normal(t) {

    }
     width(t) {

    }
  }
  _ESClass.register(AbstractCurve);
  _es6_module.add_class(AbstractCurve);
  AbstractCurve = _es6_module.add_export('AbstractCurve', AbstractCurve);
  class ClosestCurveRets  {
     constructor() {
      this.p = new Vector3();
      this.t = 0;
    }
  }
  _ESClass.register(ClosestCurveRets);
  _es6_module.add_class(ClosestCurveRets);
  ClosestCurveRets = _es6_module.add_export('ClosestCurveRets', ClosestCurveRets);
  let cvrets=util.cachering.fromConstructor(ClosestCurveRets, 2048);
  let cvarrays=new util.ArrayPool();
  let cvtmp=new Array(1024);
  function closestPoint(p, curve, mode) {
    let steps=5;
    let s=0, ds=1.0/steps;
    let ri=0;
    for (let i=0; i<steps; i++, s+=ds) {
        let c1=curve.evaluate(s);
        let c2=curve.evaluate(s+ds);
    }
  }
  closestPoint = _es6_module.add_export('closestPoint', closestPoint);
  let poly_normal_tmps=util.cachering.fromConstructor(Vector3, 64);
  let pncent=new Vector3();
  function normal_poly(vs) {
    if (vs.length===3) {
        return poly_normal_tmps.next().load(normal_tri(vs[0], vs[1], vs[2]));
    }
    else 
      if (vs.length===4) {
        return poly_normal_tmps.next().load(normal_quad(vs[0], vs[1], vs[2], vs[3]));
    }
    if (vs.length===0) {
        return poly_normal_tmps.next().zero();
    }
    let cent=pncent.zero();
    let tot=0;
    for (let v of vs) {
        cent.add(v);
        tot++;
    }
    cent.mulScalar(1.0/tot);
    let n=poly_normal_tmps.next().zero();
    for (let i=0; i<vs.length; i++) {
        let a=vs[i];
        let b=vs[(i+1)%vs.length];
        let c=cent;
        let n2=normal_tri(a, b, c);
        n.add(n2);
    }
    n.normalize();
    return n;
  }
  normal_poly = _es6_module.add_export('normal_poly', normal_poly);
  let barycentric_v2_rets=util.cachering.fromConstructor(Vector2, 2048);
  let calc_proj_refs=new util.cachering(() =>    {
    return [0, 0];
  }, 64);
  function dihedral_v3_sqr(v1, v2, v3, v4) {
    let bx=v2[0]-v1[0];
    let by=v2[1]-v1[1];
    let bz=v2[2]-v1[2];
    let cx=v3[0]-v1[0];
    let cy=v3[1]-v1[1];
    let cz=v3[2]-v1[2];
    let dx=v4[0]-v1[0];
    let dy=v4[1]-v1[1];
    let dz=v4[2]-v1[2];
    return ((bx*cz-bz*cx)*(cx*dz-cz*dx)+(by*cz-bz*cy)*(cy*dz-cz*dy)+(bx*cy-by*cx)*(cx*dy-cy*dx))**2/(((bx*cz-bz*cx)**2+(by*cz-bz*cy)**2+(bx*cy-by*cx)**2)*((cx*dz-cz*dx)**2+(cy*dz-cz*dy)**2+(cx*dy-cy*dx)**2));
  }
  dihedral_v3_sqr = _es6_module.add_export('dihedral_v3_sqr', dihedral_v3_sqr);
  let tet_area_tmps=util.cachering.fromConstructor(Vector3, 64);
  function tet_volume(a, b, c, d) {
    a = tet_area_tmps.next().load(a);
    b = tet_area_tmps.next().load(b);
    c = tet_area_tmps.next().load(c);
    d = tet_area_tmps.next().load(d);
    a.sub(d);
    b.sub(d);
    c.sub(d);
    b.cross(c);
    return a.dot(b)/6.0;
  }
  tet_volume = _es6_module.add_export('tet_volume', tet_volume);
  function calc_projection_axes(no) {
    let ax=Math.abs(no[0]), ay=Math.abs(no[1]), az=Math.abs(no[2]);
    let ret=calc_proj_refs.next();
    if (ax>ay&&ax>az) {
        ret[0] = 1;
        ret[1] = 2;
    }
    else 
      if (ay>az&&ay>ax) {
        ret[0] = 0;
        ret[1] = 2;
    }
    else {
      ret[0] = 0;
      ret[1] = 1;
    }
    return ret;
  }
  calc_projection_axes = _es6_module.add_export('calc_projection_axes', calc_projection_axes);
  let _avtmps=util.cachering.fromConstructor(Vector3, 128);
  function inrect_3d(p, min, max) {
    let ok=p[0]>=min[0]&&p[0]<=max[0];
    ok = ok&&p[1]>=min[1]&&p[1]<=max[1];
    ok = ok&&p[2]>=min[2]&&p[2]<=max[2];
    return ok;
  }
  function aabb_isect_line_3d(v1, v2, min, max) {
    let inside=inrect_3d(v1, min, max);
    inside = inside||inrect_3d(v2, min, max);
    if (inside) {
        return true;
    }
    let cent=_avtmps.next().load(min).interp(max, 0.5);
    let p=closest_point_on_line(cent, v1, v2, true);
    if (!p) {
        return false;
    }
    p = p[0];
    return inrect_3d(p, min, max);
  }
  aabb_isect_line_3d = _es6_module.add_export('aabb_isect_line_3d', aabb_isect_line_3d);
  function aabb_isect_cylinder_3d(v1, v2, radius, min, max) {
    let inside=inrect_3d(v1, min, max);
    inside = inside||inrect_3d(v2, min, max);
    if (inside) {
        return true;
    }
    let cent=_avtmps.next().load(min).interp(max, 0.5);
    let p=closest_point_on_line(cent, v1, v2, true);
    if (!p) {
        return false;
    }
    p = p[0];
    let size=_avtmps.next().load(max).sub(min);
    size.mulScalar(0.5);
    size.addScalar(radius);
    p.sub(cent).abs();
    return p[0]<=size[0]&&p[1]<=size[1]&&p[2]<=size[2];
  }
  aabb_isect_cylinder_3d = _es6_module.add_export('aabb_isect_cylinder_3d', aabb_isect_cylinder_3d);
  function barycentric_v2(p, v1, v2, v3, axis1, axis2, out) {
    if (axis1===undefined) {
        axis1 = 0;
    }
    if (axis2===undefined) {
        axis2 = 1;
    }
    if (out===undefined) {
        out = undefined;
    }
    let div=(v2[axis1]*v3[axis2]-v2[axis2]*v3[axis1]+(v2[axis2]-v3[axis2])*v1[axis1]-(v2[axis1]-v3[axis1])*v1[axis2]);
    if (Math.abs(div)<1e-06) {
        div = 1e-05;
    }
    let u=(v2[axis1]*v3[axis2]-v2[axis2]*v3[axis1]+(v2[axis2]-v3[axis2])*p[axis1]-(v2[axis1]-v3[axis1])*p[axis2])/div;
    let v=(-(v1[axis1]*v3[axis2]-v1[axis2]*v3[axis1]+(v1[axis2]-v3[axis2])*p[axis1])+(v1[axis1]-v3[axis1])*p[axis2])/div;
    if (!out) {
        out = barycentric_v2_rets.next();
    }
    out[0] = u;
    out[1] = v;
    return out;
  }
  barycentric_v2 = _es6_module.add_export('barycentric_v2', barycentric_v2);
  function _linedis2(co, v1, v2) {
    let v1x=v1[0]-co[0];
    let v1y=v1[1]-co[1];
    let v1z=v1[2]-co[2];
    let v2x=v2[0]-co[0];
    let v2y=v2[1]-co[1];
    let v2z=v2[2]-co[2];
    let dis=(((v1y-v2y)*v1y+(v1z-v2z)*v1z+(v1x-v2x)*v1x)*(v1y-v2y)-v1y)**2+(((v1y-v2y)*v1y+(v1z-v2z)*v1z+(v1x-v2x)*v1x)*(v1z-v2z)-v1z)**2+(((v1y-v2y)*v1y+(v1z-v2z)*v1z+(v1x-v2x)*v1x)*(v1x-v2x)-v1x)**2;
    return dis;
  }
  let closest_p_tri_rets=new util.cachering(() =>    {
    return {co: new Vector3(), 
    uv: new Vector2(), 
    dist: 0}
  }, 512);
  let cpt_v1=new Vector3();
  let cpt_v2=new Vector3();
  let cpt_v3=new Vector3();
  let cpt_v4=new Vector3();
  let cpt_v5=new Vector3();
  let cpt_v6=new Vector3();
  let cpt_p=new Vector3();
  let cpt_n=new Vector3();
  let cpt_mat=new Matrix4();
  let cpt_mat2=new Matrix4();
  let cpt_b=new Vector3();
  function closest_point_on_quad(p, v1, v2, v3, v4, n, uvw) {
    let a=closest_point_on_tri(p, v1, v2, v3, n, uvw);
    let b=closest_point_on_tri(p, v1, v3, v4, n, uvw);
    return a.dist<=b.dist ? a : b;
  }
  closest_point_on_quad = _es6_module.add_export('closest_point_on_quad', closest_point_on_quad);
  function closest_point_on_tri(p, v1, v2, v3, n, uvw) {
    let op=p;
    if (uvw) {
        uvw[0] = uvw[1] = 0.0;
        if (uvw.length>2) {
            uvw[2] = 0.0;
        }
    }
    v1 = cpt_v1.load(v1);
    v2 = cpt_v2.load(v2);
    v3 = cpt_v3.load(v3);
    p = cpt_p.load(p);
    if (n===undefined) {
        n = cpt_n.load(normal_tri(v1, v2, v3));
    }
    v1.sub(p);
    v2.sub(p);
    v3.sub(p);
    p.zero();
    let ax1, ax2;
    let ax=Math.abs(n[0]), ay=Math.abs(n[1]), az=Math.abs(n[2]);
    if (ax===0.0&&ay===0.0&&az===0.0) {
        console.log("eek1", n, v1, v2, v3);
        let ret=closest_p_tri_rets.next();
        ret.dist = 1e+17;
        ret.co.zero();
        ret.uv.zero();
        return ret;
    }
    let ax3;
    if (ax>=ay&&ax>=az) {
        ax1 = 1;
        ax2 = 2;
        ax3 = 0;
    }
    else 
      if (ay>=ax&&ay>=az) {
        ax1 = 0;
        ax2 = 2;
        ax3 = 1;
    }
    else {
      ax1 = 0;
      ax2 = 1;
      ax3 = 2;
    }
    let mat=cpt_mat;
    let mat2=cpt_mat2;
    mat.makeIdentity();
    let m=mat.$matrix;
    m.m11 = v1[ax1];
    m.m12 = v2[ax1];
    m.m13 = v3[ax1];
    m.m14 = 0.0;
    m.m21 = v1[ax2];
    m.m22 = v2[ax2];
    m.m23 = v3[ax2];
    m.m24 = 0.0;
    m.m31 = 1;
    m.m32 = 1;
    m.m33 = 1;
    m.m34 = 0.0;
    mat.transpose();
    let b=cpt_b.zero();
    b[0] = p[ax1];
    b[1] = p[ax2];
    b[2] = 1.0;
    b[3] = 0.0;
    mat2.load(mat).transpose();
    mat.preMultiply(mat2);
    if (mat.invert()===null) {
        console.log("eek2", mat.determinant(), ax1, ax2, n);
        let ret=closest_p_tri_rets.next();
        ret.dist = 1e+17;
        ret.co.zero();
        ret.uv.zero();
        return ret;
    }
    mat.multiply(mat2);
    b.multVecMatrix(mat);
    let u=b[0];
    let v=b[1];
    let w=b[2];
    for (let i=0; i<1; i++) {
        u = Math.min(Math.max(u, 0.0), 1.0);
        v = Math.min(Math.max(v, 0.0), 1.0);
        w = Math.min(Math.max(w, 0.0), 1.0);
        let tot=u+v+w;
        if (tot!==0.0) {
            tot = 1.0/tot;
            u*=tot;
            v*=tot;
            w*=tot;
        }
    }
    if (uvw) {
        uvw[0] = u;
        uvw[1] = v;
        if (uvw.length>2) {
            uvw[2] = w;
        }
    }
    let x=v1[0]*u+v2[0]*v+v3[0]*w;
    let y=v1[1]*u+v2[1]*v+v3[1]*w;
    let z=v1[2]*u+v2[2]*v+v3[2]*w;
    let ret=closest_p_tri_rets.next();
    ret.co.loadXYZ(x, y, z);
    ret.uv[0] = u;
    ret.uv[1] = v;
    ret.dist = ret.co.vectorLength();
    ret.co.add(op);
    return ret;
  }
  closest_point_on_tri = _es6_module.add_export('closest_point_on_tri', closest_point_on_tri);
  function dist_to_tri_v3_old(co, v1, v2, v3, no) {
    if (no===undefined) {
        no = undefined;
    }
    if (!no) {
        no = dtvtmps.next().load(normal_tri(v1, v2, v3));
    }
    let p=dtvtmps.next().load(co);
    p.sub(v1);
    let planedis=-p.dot(no);
    let $_t0rkgu=calc_projection_axes(no), axis=$_t0rkgu[0], axis2=$_t0rkgu[1];
    let p1=dtvtmps.next();
    let p2=dtvtmps.next();
    let p3=dtvtmps.next();
    p1[0] = v1[axis];
    p1[1] = v1[axis2];
    p1[2] = 0.0;
    p2[0] = v2[axis];
    p2[1] = v2[axis2];
    p2[2] = 0.0;
    p3[0] = v3[axis];
    p3[1] = v3[axis2];
    p3[2] = 0.0;
    let pp=dtvtmps.next();
    pp[0] = co[axis];
    pp[1] = co[axis2];
    pp[2] = 0.0;
    if (point_in_tri(pp, p1, p2, p3)) {
        return Math.abs(planedis);
    }
    else {
      let dis=1e+17;
      if (0) {
          dis = Math.min(dis, _linedis2(co, v1, v2));
          dis = Math.min(dis, _linedis2(co, v2, v3));
          dis = Math.min(dis, _linedis2(co, v3, v1));
          dis = Math.sqrt(dis);
      }
      else {
        dis = Math.min(dis, dist_to_line_sqr(co, v1, v2, true));
        dis = Math.min(dis, dist_to_line_sqr(co, v2, v3, true));
        dis = Math.min(dis, dist_to_line_sqr(co, v3, v1, true));
        dis = Math.sqrt(dis);
      }
      return dis;
    }
    if (0) {
        p.add(a).addFac(no, planedis);
        if (Math.abs(p.dot(no))>1e-06) {
            console.log(p.dot(no), p, no);
            throw new Error("");
        }
        a.add(co);
        b.add(co);
        c.add(co);
        let ax=a[0], bx=b[0], cx=c[0];
        let ay=a[1], by=b[1], cy=c[1];
        let az=a[2], bz=b[2], cz=c[2];
        let div=((bx*cz-bz*cx)*ay-(by*cz-bz*cy)*ax-(bx*cy-by*cx)*az);
        if (div===0.0) {
            return 0.0;
        }
        let x1=co[0], y1=co[1], z1=co[2];
        let u=((cx*z1-cz*x1)*by-(cy*z1-cz*y1)*bx-(cx*y1-cy*x1)*bz)/div;
        let v=(-((cx*z1-cz*x1)*ay-(cy*z1-cz*y1)*ax)+(cx*y1-cy*x1)*az)/div;
        let w=((bx*z1-bz*x1)*ay-(by*z1-bz*y1)*ax-(bx*y1-by*x1)*az)/div;
        if (isNaN(u)||isNaN(v)||isNaN(w)) {
            console.log(u, v, w, co, a, b, c, div);
            throw new Error("NaN!");
        }
        u = Math.min(Math.max(u, 0), 1.0);
        v = Math.min(Math.max(v, 0), 1.0);
        w = Math.min(Math.max(w, 0), 1.0);
        let tot=u+v+w;
        if (tot>0) {
            tot = 1.0/tot;
            u*=tot;
            v*=tot;
            w*=tot;
        }
        p2.addFac(v1, u);
        p2.addFac(v2, v);
        p2.addFac(v3, w);
        return p2.vectorDistance(co);
    }
  }
  dist_to_tri_v3_old = _es6_module.add_export('dist_to_tri_v3_old', dist_to_tri_v3_old);
  function dist_to_tri_v3(p, v1, v2, v3, n) {
    return dist_to_tri_v3_old(p, v1, v2, v3, n);
  }
  dist_to_tri_v3 = _es6_module.add_export('dist_to_tri_v3', dist_to_tri_v3);
  let _dt3s_n=new Vector3();
  function dist_to_tri_v3_sqr(p, v1, v2, v3, n) {
    if (n===undefined) {
        n = _dt3s_n;
        n.load(normal_tri(v1, v2, v3));
    }
    let axis1, axis2, axis3;
    let nx=n[0]<0.0 ? -n[0] : n[0];
    let ny=n[1]<0.0 ? -n[1] : n[1];
    let nz=n[2]<0.0 ? -n[2] : n[2];
    const feps=1e-07;
    if (nx>ny&&nx>nz) {
        axis1 = 1;
        axis2 = 2;
        axis3 = 0;
    }
    else 
      if (ny>nx&&ny>nz) {
        axis1 = 0;
        axis2 = 2;
        axis3 = 1;
    }
    else {
      axis1 = 0;
      axis2 = 1;
      axis3 = 2;
    }
    let planedis=(p[0]-v1[0])*n[0]+(p[1]-v1[1])*n[1]+(p[2]-v1[2])*n[2];
    planedis = planedis<0.0 ? -planedis : planedis;
    let ax=v1[axis1], ay=v1[axis2], az=v1[axis3];
    let bx=v2[axis1]-ax, by=v2[axis2]-ay, bz=v2[axis3]-az;
    let cx=v3[axis1]-ax, cy=v3[axis2]-ay, cz=v3[axis3]-az;
    let bx2=bx*bx, by2=by*by, bz2=bz*bz, cx2=cx*cx, cy2=cy*cy, cz2=cz*cz;
    let x1=p[axis1]-ax;
    let y1=p[axis2]-ay;
    let z1=p[axis3]-az;
    const testf=0.0;
    let l1=Math.sqrt(bx**2+by**2);
    let l2=Math.sqrt((cx-bx)**2+(cy-by)**2);
    let l3=Math.sqrt(cx**2+cy**2);
    let s1=x1*by-y1*bx<testf;
    let s2=(x1-bx)*(cy-by)-(y1-by)*(cx-bx)<testf;
    let s3=(x1*-cy+y1*cx)<testf;
    if (1&&n[axis3]<0.0) {
        s1 = !s1;
        s2 = !s2;
        s3 = !s3;
    }
    let mask=(s1&1)|(s2<<1)|(s3<<2);
    if (mask===0||mask===7) {
        return planedis*planedis;
    }
    let d1, d2, d3, div;
    let dis=0.0;
    let lx, ly, lz;
    lx = bx;
    ly = by;
    lz = bz;
    nx = n[axis1];
    ny = n[axis2];
    nz = n[axis3];
    switch (mask) {
      case 1:
        div = (bx2+by2);
        if (div>feps) {
            d1 = (bx*y1-by*x1);
            d1 = (d1*d1)/div;
            lx = -by;
            ly = bx;
            lz = bz;
        }
        else {
          d1 = x1*x1+y1*y1;
          lx = x1;
          ly = y1;
          lz = z1;
        }
        dis = d1;
        break;
      case 3:
        lx = x1-bx;
        ly = y1-by;
        lz = z1-bz;
        dis = lx*lx+ly*ly;
        return lx*lx+ly*ly+lz*lz;
      case 2:
        div = (bx-cx)**2+(by-cy)**2;
        if (div>feps) {
            d2 = ((bx-cx)*y1-(by-cy)*x1);
            d2 = d2/div;
            lx = (by-cy);
            ly = (cx-bx);
            lz = cz-bz;
        }
        else {
          d2 = (x1-bx)*(x1-bx)+(y1-by)*(y1-by);
          lx = x1-bx;
          ly = y1-by;
          lz = z1-bz;
        }
        dis = d2;
        break;
      case 6:
        lx = x1-cx;
        ly = y1-cy;
        lz = z1-cz;
        return lx*lx+ly*ly+lz*lz;
      case 4:
        div = (cx2+cy2);
        if (div>feps) {
            d3 = (cx*y1-cy*x1);
            d3 = (d3*d3)/div;
            lx = cy;
            ly = -cx;
            lz = cz;
        }
        else {
          d3 = (x1-cx)*(x1-cx)+(y1-cy)*(y1-cy);
          lx = x1-cx;
          ly = y1-cy;
          lz = z1-cz;
        }
        dis = d3;
        break;
      case 5:
        lx = x1;
        ly = y1;
        lz = z1;
        return lx*lx+ly*ly+lz*lz;
    }
    let d=lx*nx+ly*ny+lz*nz;
    d = -d;
    lx+=nx*d;
    ly+=ny*d;
    lz+=nz*d;
    if (0&&Math.random()>0.999) {
        console.log("d", d.toFixed(6));
        console.log(lx*nx+ly*ny+lz*nz);
    }
    let mul=((lx**2+ly**2)*nz**2+(lx*nx+ly*ny)**2)/((lx**2+ly**2)*nz**2);
    if (Math.random()>0.999) {
        console.log(mul.toFixed(4));
    }
    if (0) {
        let odis=dis;
        dis = x1**2+y1**2+z1**2;
        if (Math.random()>0.999) {
            console.log((dis/odis).toFixed(4), mul.toFixed(4));
        }
        mul = 1.0;
    }
    return dis*mul+planedis*planedis;
  }
  dist_to_tri_v3_sqr = _es6_module.add_export('dist_to_tri_v3_sqr', dist_to_tri_v3_sqr);
  let tri_area_temps=util.cachering.fromConstructor(Vector3, 64);
  function tri_area(v1, v2, v3) {
    let l1=v1.vectorDistance(v2);
    let l2=v2.vectorDistance(v3);
    let l3=v3.vectorDistance(v1);
    let s=(l1+l2+l3)/2.0;
    return Math.sqrt(s*(s-l1)*(s-l2)*(s-l3));
  }
  tri_area = _es6_module.add_export('tri_area', tri_area);
  function aabb_overlap_area(pos1, size1, pos2, size2) {
    let r1=0.0, r2=0.0;
    for (let i=0; i<2; i++) {
        let a1=pos1[i], a2=pos2[i];
        let b1=pos1[i]+size1[i];
        let b2=pos2[i]+size2[i];
        if (b1>=a2&&b2>=a1) {
            let r=Math.abs(a2-b1);
            r = Math.min(r, Math.abs(a1-b2));
            if (i) {
                r2 = r;
            }
            else {
              r1 = r;
            }
        }
    }
    return r1*r2;
  }
  aabb_overlap_area = _es6_module.add_export('aabb_overlap_area', aabb_overlap_area);
  function aabb_isect_2d(pos1, size1, pos2, size2) {
    let ret=0;
    for (let i=0; i<2; i++) {
        let a=pos1[i];
        let b=pos1[i]+size1[i];
        let c=pos2[i];
        let d=pos2[i]+size2[i];
        if (b>=c&&a<=d)
          ret+=1;
    }
    return ret===2;
  }
  aabb_isect_2d = _es6_module.add_export('aabb_isect_2d', aabb_isect_2d);
  
  function aabb_isect_3d(pos1, size1, pos2, size2) {
    let ret=0;
    for (let i=0; i<3; i++) {
        let a=pos1[i];
        let b=pos1[i]+size1[i];
        let c=pos2[i];
        let d=pos2[i]+size2[i];
        if (b>=c&&a<=d)
          ret+=1;
    }
    return ret===3;
  }
  aabb_isect_3d = _es6_module.add_export('aabb_isect_3d', aabb_isect_3d);
  let aabb_intersect_vs=util.cachering.fromConstructor(Vector2, 32);
  let aabb_intersect_rets=new util.cachering(() =>    {
    return {pos: new Vector2(), 
    size: new Vector2()}
  }, 512);
  function aabb_intersect_2d(pos1, size1, pos2, size2) {
    let v1=aabb_intersect_vs.next().load(pos1);
    let v2=aabb_intersect_vs.next().load(pos1).add(size1);
    let v3=aabb_intersect_vs.next().load(pos2);
    let v4=aabb_intersect_vs.next().load(pos2).add(size2);
    let min=aabb_intersect_vs.next().zero();
    let max=aabb_intersect_vs.next().zero();
    let tot=0;
    for (let i=0; i<2; i++) {
        if (v2[i]>=v3[i]&&v1[i]<=v4[i]) {
            tot++;
            min[i] = Math.max(v3[i], v1[i]);
            max[i] = Math.min(v2[i], v4[i]);
        }
    }
    if (tot!==2) {
        return undefined;
    }
    let ret=aabb_intersect_rets.next();
    ret.pos.load(min);
    ret.size.load(max).sub(min);
    return ret;
  }
  aabb_intersect_2d = _es6_module.add_export('aabb_intersect_2d', aabb_intersect_2d);
  window.test_aabb_intersect_2d = function () {
    let canvas=document.getElementById("test_canvas");
    if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.setAttribute("id", "test_canvas");
        canvas.g = canvas.getContext("2d");
        document.body.appendChild(canvas);
    }
    canvas.width = ~~(window.innerWidth*devicePixelRatio);
    canvas.height = ~~(window.innerHeight*devicePixelRatio);
    canvas.style.width = (canvas.width/devicePixelRatio)+"px";
    canvas.style.height = (canvas.height/devicePixelRatio)+"px";
    canvas.style.position = "absolute";
    canvas.style["z-index"] = "1000";
    let g=canvas.g;
    g.clearRect(0, 0, canvas.width, canvas.height);
    let sz=800;
    let a1=new Vector2([Math.random()*sz, Math.random()*sz]).floor();
    let a2=new Vector2([Math.random()*sz, Math.random()*sz]).floor();
    let b1=new Vector2([Math.random()*sz, Math.random()*sz]).floor();
    let b2=new Vector2([Math.random()*sz, Math.random()*sz]).floor();
    let p1=new Vector2();
    let s1=new Vector2();
    let p2=new Vector2();
    let s2=new Vector2();
    p1.load(a1).min(a2);
    s1.load(a1).max(a2);
    p2.load(b1).min(b2);
    s2.load(b1).max(b2);
    s1.sub(p1);
    s2.sub(p1);
    console.log(p1, s1);
    console.log(p2, s2);
    g.beginPath();
    g.rect(0, 0, canvas.width, canvas.height);
    g.fillStyle = "white";
    g.fill();
    g.beginPath();
    g.rect(p1[0], p1[1], s1[0], s1[1]);
    g.fillStyle = "rgba(255, 100, 75, 1.0)";
    g.fill();
    g.beginPath();
    g.rect(p2[0], p2[1], s2[0], s2[1]);
    g.fillStyle = "rgba(75, 100, 255, 1.0)";
    g.fill();
    let ret=aabb_intersect_2d(p1, s1, p2, s2);
    if (ret) {
        g.beginPath();
        g.rect(ret.pos[0], ret.pos[1], ret.size[0], ret.size[1]);
        g.fillStyle = "rgba(0, 0, 0, 1.0)";
        g.fill();
    }
    return {end: test_aabb_intersect_2d.end, 
    timer: test_aabb_intersect_2d.timer}
  }
  test_aabb_intersect_2d.stop = function stop() {
    if (test_aabb_intersect_2d._timer) {
        console.log("stopping timer");
        window.clearInterval(test_aabb_intersect_2d._timer);
        test_aabb_intersect_2d._timer = undefined;
    }
  }
  test_aabb_intersect_2d.end = function end() {
    test_aabb_intersect_2d.stop();
    let canvas=document.getElementById("test_canvas");
    if (canvas) {
        canvas.remove();
    }
  }
  test_aabb_intersect_2d.timer = function timer(rate) {
    if (rate===undefined) {
        rate = 500;
    }
    if (test_aabb_intersect_2d._timer) {
        window.clearInterval(test_aabb_intersect_2d._timer);
        test_aabb_intersect_2d._timer = undefined;
        console.log("stopping timer");
        return ;
    }
    console.log("starting timer");
    test_aabb_intersect_2d._timer = window.setInterval(() =>      {
      test_aabb_intersect_2d();
    }, rate);
  }
  let aabb_intersect_vs3=util.cachering.fromConstructor(Vector3, 64);
  function aabb_intersect_3d(min1, max1, min2, max2) {
    let tot=0;
    for (let i=0; i<2; i++) {
        if (max1[i]>=min2[i]&&min1[i]<=max2[i]) {
            tot++;
        }
    }
    if (tot!==3) {
        return false;
    }
    return true;
  }
  aabb_intersect_3d = _es6_module.add_export('aabb_intersect_3d', aabb_intersect_3d);
  function aabb_union(a, b) {
    for (let i=0; i<2; i++) {
        for (let j=0; j<a[i].length; j++) {
            a[i][j] = i ? Math.max(a[i][j], b[i][j]) : Math.min(a[i][j], b[i][j]);
        }
    }
    return a;
  }
  aabb_union = _es6_module.add_export('aabb_union', aabb_union);
  function aabb_union_2d(pos1, size1, pos2, size2) {
    let v1=aabb_intersect_vs.next();
    let v2=aabb_intersect_vs.next();
    let min=aabb_intersect_vs.next();
    let max=aabb_intersect_vs.next();
    v1.load(pos1).add(size1);
    v2.load(pos2).add(size2);
    min.load(v1).min(v2);
    max.load(v1).max(v2);
    max.sub(min);
    let ret=aabb_intersect_rets.next();
    ret.pos.load(min);
    ret.pos.load(max);
    return ret;
  }
  aabb_union_2d = _es6_module.add_export('aabb_union_2d', aabb_union_2d);
  function init_prototype(cls, proto) {
    for (var k in proto) {
        cls.prototype[k] = proto[k];
    }
    return cls.prototype;
  }
  function inherit(cls, parent, proto) {
    cls.prototype = Object.create(parent.prototype);
    for (var k in proto) {
        cls.prototype[k] = proto[k];
    }
    return cls.prototype;
  }
  var set=util.set;
  var $_mh, $_swapt;
  const feps=2.22e-16;
  _es6_module.add_export('feps', feps);
  const COLINEAR=1;
  _es6_module.add_export('COLINEAR', COLINEAR);
  const LINECROSS=2;
  _es6_module.add_export('LINECROSS', LINECROSS);
  const COLINEAR_ISECT=3;
  _es6_module.add_export('COLINEAR_ISECT', COLINEAR_ISECT);
  var _cross_vec1=new Vector3();
  var _cross_vec2=new Vector3();
  const SQRT2=Math.sqrt(2.0);
  _es6_module.add_export('SQRT2', SQRT2);
  const FEPS_DATA={F16: 1.11e-16, 
   F32: 5.96e-08, 
   F64: 0.000488}
  _es6_module.add_export('FEPS_DATA', FEPS_DATA);
  const FEPS=FEPS_DATA.F32;
  _es6_module.add_export('FEPS', FEPS);
  const FLOAT_MIN=-1e+21;
  _es6_module.add_export('FLOAT_MIN', FLOAT_MIN);
  const FLOAT_MAX=1e+22;
  _es6_module.add_export('FLOAT_MAX', FLOAT_MAX);
  const Matrix4UI=Matrix4;
  _es6_module.add_export('Matrix4UI', Matrix4UI);
  if (FLOAT_MIN!=FLOAT_MIN||FLOAT_MAX!=FLOAT_MAX) {
      FLOAT_MIN = 1e-05;
      FLOAT_MAX = 1000000.0;
      console.log("Floating-point 16-bit system detected!");
  }
  var _static_grp_points4=new Array(4);
  var _static_grp_points8=new Array(8);
  function get_rect_points(p, size) {
    var cs;
    if (p.length==2) {
        cs = _static_grp_points4;
        cs[0] = p;
        cs[1] = [p[0]+size[0], p[1]];
        cs[2] = [p[0]+size[0], p[1]+size[1]];
        cs[3] = [p[0], p[1]+size[1]];
    }
    else 
      if (p.length==3) {
        cs = _static_grp_points8;
        cs[0] = p;
        cs[1] = [p[0]+size[0], p[1], p[2]];
        cs[2] = [p[0]+size[0], p[1]+size[1], p[2]];
        cs[3] = [p[0], p[1]+size[0], p[2]];
        cs[4] = [p[0], p[1], p[2]+size[2]];
        cs[5] = [p[0]+size[0], p[1], p[2]+size[2]];
        cs[6] = [p[0]+size[0], p[1]+size[1], p[2]+size[2]];
        cs[7] = [p[0], p[1]+size[0], p[2]+size[2]];
    }
    else {
      throw "get_rect_points has no implementation for "+p.length+"-dimensional data";
    }
    return cs;
  }
  get_rect_points = _es6_module.add_export('get_rect_points', get_rect_points);
  
  function get_rect_lines(p, size) {
    var ps=get_rect_points(p, size);
    if (p.length==2) {
        return [[ps[0], ps[1]], [ps[1], ps[2]], [ps[2], ps[3]], [ps[3], ps[0]]];
    }
    else 
      if (p.length==3) {
        var l1=[[ps[0], ps[1]], [ps[1], ps[2]], [ps[2], ps[3]], [ps[3], ps[0]]];
        var l2=[[ps[4], ps[5]], [ps[5], ps[6]], [ps[6], ps[7]], [ps[7], ps[4]]];
        l1.concat(l2);
        l1.push([ps[0], ps[4]]);
        l1.push([ps[1], ps[5]]);
        l1.push([ps[2], ps[6]]);
        l1.push([ps[3], ps[7]]);
        return l1;
    }
    else {
      throw "get_rect_points has no implementation for "+p.length+"-dimensional data";
    }
  }
  get_rect_lines = _es6_module.add_export('get_rect_lines', get_rect_lines);
  
  var $vs_simple_tri_aabb_isect=[0, 0, 0];
  function simple_tri_aabb_isect(v1, v2, v3, min, max) {
    $vs_simple_tri_aabb_isect[0] = v1;
    $vs_simple_tri_aabb_isect[1] = v2;
    $vs_simple_tri_aabb_isect[2] = v3;
    for (var i=0; i<3; i++) {
        var isect=true;
        for (var j=0; j<3; j++) {
            if ($vs_simple_tri_aabb_isect[j][i]<min[i]||$vs_simple_tri_aabb_isect[j][i]>=max[i])
              isect = false;
        }
        if (isect)
          return true;
    }
    return false;
  }
  simple_tri_aabb_isect = _es6_module.add_export('simple_tri_aabb_isect', simple_tri_aabb_isect);
  
  class MinMax  {
     constructor(totaxis) {
      if (totaxis==undefined) {
          totaxis = 1;
      }
      this.totaxis = totaxis;
      if (totaxis!=1) {
          let cls;
          switch (totaxis) {
            case 2:
              cls = Vector2;
              break;
            case 3:
              cls = Vector3;
              break;
            case 4:
              cls = Vector4;
              break;
            default:
              cls = Array;
              break;
          }
          this._min = new cls(totaxis);
          this._max = new cls(totaxis);
          this.min = new cls(totaxis);
          this.max = new cls(totaxis);
      }
      else {
        this.min = this.max = 0;
        this._min = FLOAT_MAX;
        this._max = FLOAT_MIN;
      }
      this.reset();
      this._static_mr_co = new Array(this.totaxis);
      this._static_mr_cs = new Array(this.totaxis*this.totaxis);
    }
    static  fromSTRUCT(reader) {
      var ret=new MinMax();
      reader(ret);
      return ret;
    }
     load(mm) {
      if (this.totaxis==1) {
          this.min = mm.min;
          this.max = mm.max;
          this._min = mm.min;
          this._max = mm.max;
      }
      else {
        this.min = new Vector3(mm.min);
        this.max = new Vector3(mm.max);
        this._min = new Vector3(mm._min);
        this._max = new Vector3(mm._max);
      }
    }
     reset() {
      var totaxis=this.totaxis;
      if (totaxis==1) {
          this.min = this.max = 0;
          this._min = FLOAT_MAX;
          this._max = FLOAT_MIN;
      }
      else {
        for (var i=0; i<totaxis; i++) {
            this._min[i] = FLOAT_MAX;
            this._max[i] = FLOAT_MIN;
            this.min[i] = 0;
            this.max[i] = 0;
        }
      }
    }
     minmax_rect(p, size) {
      var totaxis=this.totaxis;
      var cs=this._static_mr_cs;
      if (totaxis==2) {
          cs[0] = p;
          cs[1] = [p[0]+size[0], p[1]];
          cs[2] = [p[0]+size[0], p[1]+size[1]];
          cs[3] = [p[0], p[1]+size[1]];
      }
      else 
        if (totaxis = 3) {
          cs[0] = p;
          cs[1] = [p[0]+size[0], p[1], p[2]];
          cs[2] = [p[0]+size[0], p[1]+size[1], p[2]];
          cs[3] = [p[0], p[1]+size[0], p[2]];
          cs[4] = [p[0], p[1], p[2]+size[2]];
          cs[5] = [p[0]+size[0], p[1], p[2]+size[2]];
          cs[6] = [p[0]+size[0], p[1]+size[1], p[2]+size[2]];
          cs[7] = [p[0], p[1]+size[0], p[2]+size[2]];
      }
      else {
        throw "Minmax.minmax_rect has no implementation for "+totaxis+"-dimensional data";
      }
      for (var i=0; i<cs.length; i++) {
          this.minmax(cs[i]);
      }
    }
     minmax(p) {
      var totaxis=this.totaxis;
      if (totaxis==1) {
          this._min = this.min = Math.min(this._min, p);
          this._max = this.max = Math.max(this._max, p);
      }
      else 
        if (totaxis==2) {
          this._min[0] = this.min[0] = Math.min(this._min[0], p[0]);
          this._min[1] = this.min[1] = Math.min(this._min[1], p[1]);
          this._max[0] = this.max[0] = Math.max(this._max[0], p[0]);
          this._max[1] = this.max[1] = Math.max(this._max[1], p[1]);
      }
      else 
        if (totaxis==3) {
          this._min[0] = this.min[0] = Math.min(this._min[0], p[0]);
          this._min[1] = this.min[1] = Math.min(this._min[1], p[1]);
          this._min[2] = this.min[2] = Math.min(this._min[2], p[2]);
          this._max[0] = this.max[0] = Math.max(this._max[0], p[0]);
          this._max[1] = this.max[1] = Math.max(this._max[1], p[1]);
          this._max[2] = this.max[2] = Math.max(this._max[2], p[2]);
      }
      else {
        for (var i=0; i<totaxis; i++) {
            this._min[i] = this.min[i] = Math.min(this._min[i], p[i]);
            this._max[i] = this.max[i] = Math.max(this._max[i], p[i]);
        }
      }
    }
  }
  _ESClass.register(MinMax);
  _es6_module.add_class(MinMax);
  MinMax = _es6_module.add_export('MinMax', MinMax);
  
  MinMax.STRUCT = "\n  math.MinMax {\n    min     : vec3;\n    max     : vec3;\n    _min    : vec3;\n    _max    : vec3;\n    totaxis : int;\n  }\n";
  function winding_axis(a, b, c, up_axis) {
    let xaxis=(up_axis+1)%3;
    let yaxis=(up_axis+2)%3;
    let x1=a[xaxis], y1=a[yaxis];
    let x2=b[xaxis], y2=b[yaxis];
    let x3=c[xaxis], y3=c[yaxis];
    let dx1=x1-x2, dy1=y1-y2;
    let dx2=x3-x2, dy2=y3-y2;
    let f=dx1*dy2-dy1*dx2;
    return f>=0.0;
  }
  winding_axis = _es6_module.add_export('winding_axis', winding_axis);
  function winding(a, b, c, zero_z, tol) {
    if (tol===undefined) {
        tol = 0.0;
    }
    let t1=_cross_vec1;
    let t2=_cross_vec2;
    for (let i=0; i<a.length; i++) {
        t1[i] = b[i]-a[i];
        t2[i] = c[i]-a[i];
    }
    return t1[0]*t2[1]-t1[1]*t2[0]>tol;
  }
  winding = _es6_module.add_export('winding', winding);
  function inrect_2d(p, pos, size) {
    if (p==undefined||pos==undefined||size==undefined) {
        console.trace();
        console.log("Bad paramters to inrect_2d()");
        console.log("p: ", p, ", pos: ", pos, ", size: ", size);
        return false;
    }
    return p[0]>=pos[0]&&p[0]<=pos[0]+size[0]&&p[1]>=pos[1]&&p[1]<=pos[1]+size[1];
  }
  inrect_2d = _es6_module.add_export('inrect_2d', inrect_2d);
  
  var $smin_aabb_isect_line_2d=new Vector2();
  var $ssize_aabb_isect_line_2d=new Vector2();
  var $sv1_aabb_isect_line_2d=new Vector2();
  var $ps_aabb_isect_line_2d=[new Vector2(), new Vector2(), new Vector2()];
  var $l1_aabb_isect_line_2d=[0, 0];
  var $smax_aabb_isect_line_2d=new Vector2();
  var $sv2_aabb_isect_line_2d=new Vector2();
  var $l2_aabb_isect_line_2d=[0, 0];
  function aabb_isect_line_2d(v1, v2, min, max) {
    for (var i=0; i<2; i++) {
        $smin_aabb_isect_line_2d[i] = Math.min(min[i], v1[i]);
        $smax_aabb_isect_line_2d[i] = Math.max(max[i], v2[i]);
    }
    $smax_aabb_isect_line_2d.sub($smin_aabb_isect_line_2d);
    $ssize_aabb_isect_line_2d.load(max).sub(min);
    if (!aabb_isect_2d($smin_aabb_isect_line_2d, $smax_aabb_isect_line_2d, min, $ssize_aabb_isect_line_2d))
      return false;
    for (var i=0; i<4; i++) {
        if (inrect_2d(v1, min, $ssize_aabb_isect_line_2d))
          return true;
        if (inrect_2d(v2, min, $ssize_aabb_isect_line_2d))
          return true;
    }
    $ps_aabb_isect_line_2d[0] = min;
    $ps_aabb_isect_line_2d[1][0] = min[0];
    $ps_aabb_isect_line_2d[1][1] = max[1];
    $ps_aabb_isect_line_2d[2] = max;
    $ps_aabb_isect_line_2d[3][0] = max[0];
    $ps_aabb_isect_line_2d[3][1] = min[1];
    $l1_aabb_isect_line_2d[0] = v1;
    $l1_aabb_isect_line_2d[1] = v2;
    for (var i=0; i<4; i++) {
        var a=$ps_aabb_isect_line_2d[i], b=$ps_aabb_isect_line_2d[(i+1)%4];
        $l2_aabb_isect_line_2d[0] = a;
        $l2_aabb_isect_line_2d[1] = b;
        if (line_line_cross($l1_aabb_isect_line_2d, $l2_aabb_isect_line_2d))
          return true;
    }
    return false;
  }
  aabb_isect_line_2d = _es6_module.add_export('aabb_isect_line_2d', aabb_isect_line_2d);
  
  function expand_rect2d(pos, size, margin) {
    pos[0]-=Math.floor(margin[0]);
    pos[1]-=Math.floor(margin[1]);
    size[0]+=Math.floor(margin[0]*2.0);
    size[1]+=Math.floor(margin[1]*2.0);
  }
  expand_rect2d = _es6_module.add_export('expand_rect2d', expand_rect2d);
  
  function expand_line(l, margin) {
    var c=new Vector3();
    c.add(l[0]);
    c.add(l[1]);
    c.mulScalar(0.5);
    l[0].sub(c);
    l[1].sub(c);
    var l1=l[0].vectorLength();
    var l2=l[1].vectorLength();
    l[0].normalize();
    l[1].normalize();
    l[0].mulScalar(margin+l1);
    l[1].mulScalar(margin+l2);
    l[0].add(c);
    l[1].add(c);
    return l;
  }
  expand_line = _es6_module.add_export('expand_line', expand_line);
  
  function colinear(a, b, c, limit) {
    if (limit===undefined) {
        limit = 2.2e-16;
    }
    for (var i=0; i<3; i++) {
        _cross_vec1[i] = b[i]-a[i];
        _cross_vec2[i] = c[i]-a[i];
    }
    if (a.vectorDistance(b)<feps*100&&a.vectorDistance(c)<feps*100) {
        return true;
    }
    if (_cross_vec1.dot(_cross_vec1)<limit||_cross_vec2.dot(_cross_vec2)<limit)
      return true;
    _cross_vec1.cross(_cross_vec2);
    return _cross_vec1.dot(_cross_vec1)<limit;
  }
  colinear = _es6_module.add_export('colinear', colinear);
  
  var _llc_l1=[new Vector3(), new Vector3()];
  var _llc_l2=[new Vector3(), new Vector3()];
  var _llc_l3=[new Vector3(), new Vector3()];
  var _llc_l4=[new Vector3(), new Vector3()];
  var lli_v1=new Vector3(), lli_v2=new Vector3(), lli_v3=new Vector3(), lli_v4=new Vector3();
  var _zero_cn=new Vector3();
  var _tmps_cn=util.cachering.fromConstructor(Vector3, 64);
  var _rets_cn=util.cachering.fromConstructor(Vector3, 64);
  function corner_normal(vec1, vec2, width) {
    var ret=_rets_cn.next().zero();
    var vec=_tmps_cn.next().zero();
    vec.load(vec1).add(vec2).normalize();
    if (Math.abs(vec1.normalizedDot(vec2))>0.9999) {
        if (vec1.dot(vec2)>0.0001) {
            ret.load(vec1).add(vec2).normalize();
        }
        else {
          ret.load(vec1).normalize();
        }
        ret.mulScalar(width);
        return ret;
    }
    else {
    }
    vec1 = _tmps_cn.next().load(vec1).mulScalar(width);
    vec2 = _tmps_cn.next().load(vec2).mulScalar(width);
    var p1=_tmps_cn.next().load(vec1);
    var p2=_tmps_cn.next().load(vec2);
    vec1.addFac(vec1, 0.01);
    vec2.addFac(vec2, 0.01);
    var sc=1.0;
    p1[0]+=vec1[1]*sc;
    p1[1]+=-vec1[0]*sc;
    p2[0]+=-vec2[1]*sc;
    p2[1]+=vec2[0]*sc;
    var p=line_line_isect(vec1, p1, vec2, p2, false);
    if (p==undefined||p===COLINEAR_ISECT||p.dot(p)<1e-06) {
        ret.load(vec1).add(vec2).normalize().mulScalar(width);
    }
    else {
      ret.load(p);
      if (vec.dot(vec)>0&&vec.dot(ret)<0) {
          ret.load(vec).mulScalar(width);
      }
    }
    return ret;
  }
  corner_normal = _es6_module.add_export('corner_normal', corner_normal);
  function line_line_isect(v1, v2, v3, v4, test_segment) {
    test_segment = test_segment===undefined ? true : test_segment;
    if (!line_line_cross(v1, v2, v3, v4)) {
        return undefined;
    }
    var xa1=v1[0], xa2=v2[0], ya1=v1[1], ya2=v2[1];
    var xb1=v3[0], xb2=v4[0], yb1=v3[1], yb2=v4[1];
    var div=((xa1-xa2)*(yb1-yb2)-(xb1-xb2)*(ya1-ya2));
    if (div<1e-08) {
        return COLINEAR_ISECT;
    }
    else {
      var t1=(-((ya1-yb2)*xb1-(yb1-yb2)*xa1-(ya1-yb1)*xb2))/div;
      return lli_v1.load(v1).interp(v2, t1);
    }
  }
  line_line_isect = _es6_module.add_export('line_line_isect', line_line_isect);
  function line_line_cross(v1, v2, v3, v4) {
    var l1=_llc_l3, l2=_llc_l4;
    var a=l1[0], b=l1[1], c=l2[0], d=l2[1];
    a[0] = v1[0];
    a[1] = v1[1];
    a[2] = v1[2];
    b[0] = v2[0];
    b[1] = v2[1];
    b[2] = v2[2];
    c[0] = v3[0];
    c[1] = v3[1];
    c[2] = v3[2];
    d[0] = v4[0];
    d[1] = v4[1];
    d[2] = v4[2];
    var a=l1[0];
    var b=l1[1];
    var c=l2[0];
    var d=l2[1];
    var w1=winding(a, b, c);
    var w2=winding(c, a, d);
    var w3=winding(a, b, d);
    var w4=winding(c, b, d);
    return (w1==w2)&&(w3==w4)&&(w1!=w3);
  }
  line_line_cross = _es6_module.add_export('line_line_cross', line_line_cross);
  
  var _asi_v1=new Vector3();
  var _asi_v2=new Vector3();
  var _asi_v3=new Vector3();
  var _asi_v4=new Vector3();
  var _asi_v5=new Vector3();
  var _asi_v6=new Vector3();
  function point_in_aabb_2d(p, min, max) {
    return p[0]>=min[0]&&p[0]<=max[0]&&p[1]>=min[1]&&p[1]<=max[1];
  }
  point_in_aabb_2d = _es6_module.add_export('point_in_aabb_2d', point_in_aabb_2d);
  var _asi2d_v1=new Vector2();
  var _asi2d_v2=new Vector2();
  var _asi2d_v3=new Vector2();
  var _asi2d_v4=new Vector2();
  var _asi2d_v5=new Vector2();
  var _asi2d_v6=new Vector2();
  function aabb_sphere_isect_2d(p, r, min, max) {
    var v1=_asi2d_v1, v2=_asi2d_v2, v3=_asi2d_v3, mvec=_asi2d_v4;
    var v4=_asi2d_v5;
    p = _asi2d_v6.load(p);
    v1.load(p);
    v2.load(p);
    min = _asi_v5.load(min);
    max = _asi_v6.load(max);
    mvec.load(max).sub(min).normalize().mulScalar(r+0.0001);
    v1.sub(mvec);
    v2.add(mvec);
    v3.load(p);
    var ret=point_in_aabb_2d(v1, min, max)||point_in_aabb_2d(v2, min, max)||point_in_aabb_2d(v3, min, max);
    if (ret)
      return ret;
    v1.load(min);
    v2[0] = min[0];
    v2[1] = max[1];
    ret = ret||dist_to_line_2d(p, v1, v2)<r;
    v1.load(max);
    v2[0] = max[0];
    v2[1] = max[1];
    ret = ret||dist_to_line_2d(p, v1, v2)<r;
    v1.load(max);
    v2[0] = max[0];
    v2[1] = min[1];
    ret = ret||dist_to_line_2d(p, v1, v2)<r;
    v1.load(max);
    v2[0] = min[0];
    v2[1] = min[1];
    ret = ret||dist_to_line_2d(p, v1, v2)<r;
    return ret;
  }
  aabb_sphere_isect_2d = _es6_module.add_export('aabb_sphere_isect_2d', aabb_sphere_isect_2d);
  
  function point_in_aabb(p, min, max) {
    return p[0]>=min[0]&&p[0]<=max[0]&&p[1]>=min[1]&&p[1]<=max[1]&&p[2]>=min[2]&&p[2]<=max[2];
  }
  point_in_aabb = _es6_module.add_export('point_in_aabb', point_in_aabb);
  let asi_rect=new Array(8);
  for (let i=0; i<8; i++) {
      asi_rect[i] = new Vector3();
  }
  let aabb_sphere_isect_vs=util.cachering.fromConstructor(Vector3, 64);
  function aabb_sphere_isect(p, r, min, max) {
    let p1=aabb_sphere_isect_vs.next().load(p);
    let min1=aabb_sphere_isect_vs.next().load(min);
    let max1=aabb_sphere_isect_vs.next().load(max);
    if (p.length===2) {
        p1[2] = 0.0;
    }
    if (min1.length===2) {
        min1[2] = 0.0;
    }
    if (max.length===2) {
        max1[2] = 0.0;
    }
    p = p1;
    min = min1;
    max = max1;
    let cent=aabb_sphere_isect_vs.next().load(min).interp(max, 0.5);
    p.sub(cent);
    min.sub(cent);
    max.sub(cent);
    r*=r;
    let isect=point_in_aabb(p, min, max);
    if (isect) {
        return true;
    }
    let rect=asi_rect;
    rect[0].loadXYZ(min[0], min[1], min[2]);
    rect[1].loadXYZ(min[0], max[1], min[2]);
    rect[2].loadXYZ(max[0], max[1], min[2]);
    rect[3].loadXYZ(max[0], min[1], min[2]);
    rect[4].loadXYZ(min[0], min[1], max[2]);
    rect[5].loadXYZ(min[0], max[1], max[2]);
    rect[6].loadXYZ(max[0], max[1], max[2]);
    rect[7].loadXYZ(max[0], min[1], max[2]);
    for (let i=0; i<8; i++) {
        if (p.vectorDistanceSqr(rect[i])<r) {
            return true;
        }
    }
    let p2=aabb_sphere_isect_vs.next().load(p);
    for (let i=0; i<3; i++) {
        p2.load(p);
        let i2=(i+1)%3;
        let i3=(i+2)%3;
        p2[i] = p2[i]<0.0 ? min[i] : max[i];
        p2[i2] = Math.min(Math.max(p2[i2], min[i2]), max[i2]);
        p2[i3] = Math.min(Math.max(p2[i3], min[i3]), max[i3]);
        let isect=p2.vectorDistanceSqr(p)<=r;
        if (isect) {
            return true;
        }
    }
    return false;
  }
  aabb_sphere_isect = _es6_module.add_export('aabb_sphere_isect', aabb_sphere_isect);
  
  function aabb_sphere_dist(p, min, max) {
    let p1=aabb_sphere_isect_vs.next().load(p);
    let min1=aabb_sphere_isect_vs.next().load(min);
    let max1=aabb_sphere_isect_vs.next().load(max);
    if (p.length===2) {
        p1[2] = 0.0;
    }
    if (min1.length===2) {
        min1[2] = 0.0;
    }
    if (max.length===2) {
        max1[2] = 0.0;
    }
    p = p1;
    min = min1;
    max = max1;
    let cent=aabb_sphere_isect_vs.next().load(min).interp(max, 0.5);
    p.sub(cent);
    min.sub(cent);
    max.sub(cent);
    let isect=point_in_aabb(p, min, max);
    if (isect) {
        return 0.0;
    }
    let rect=asi_rect;
    rect[0].loadXYZ(min[0], min[1], min[2]);
    rect[1].loadXYZ(min[0], max[1], min[2]);
    rect[2].loadXYZ(max[0], max[1], min[2]);
    rect[3].loadXYZ(max[0], min[1], min[2]);
    rect[4].loadXYZ(min[0], min[1], max[2]);
    rect[5].loadXYZ(min[0], max[1], max[2]);
    rect[6].loadXYZ(max[0], max[1], max[2]);
    rect[7].loadXYZ(max[0], min[1], max[2]);
    let mindis;
    for (let i=0; i<8; i++) {
        let dis=p.vectorDistanceSqr(rect[i]);
        if (mindis===undefined||dis<mindis) {
            mindis = dis;
        }
    }
    let p2=aabb_sphere_isect_vs.next().load(p);
    for (let i=0; i<3; i++) {
        p2.load(p);
        let i2=(i+1)%3;
        let i3=(i+2)%3;
        p2[i] = p2[i]<0.0 ? min[i] : max[i];
        p2[i2] = Math.min(Math.max(p2[i2], min[i2]), max[i2]);
        p2[i3] = Math.min(Math.max(p2[i3], min[i3]), max[i3]);
        let dis=p2.vectorDistanceSqr(p);
        if (mindis===undefined||dis<mindis) {
            mindis = dis;
        }
    }
    return mindis===undefined ? 1e+17 : mindis;
  }
  aabb_sphere_dist = _es6_module.add_export('aabb_sphere_dist', aabb_sphere_dist);
  
  function point_in_tri(p, v1, v2, v3) {
    var w1=winding(p, v1, v2);
    var w2=winding(p, v2, v3);
    var w3=winding(p, v3, v1);
    return w1==w2&&w2==w3;
  }
  point_in_tri = _es6_module.add_export('point_in_tri', point_in_tri);
  
  function convex_quad(v1, v2, v3, v4) {
    return line_line_cross([v1, v3], [v2, v4]);
  }
  convex_quad = _es6_module.add_export('convex_quad', convex_quad);
  
  var $e1_normal_tri=new Vector3();
  var $e3_normal_tri=new Vector3();
  var $e2_normal_tri=new Vector3();
  function isNum(f) {
    let ok=typeof f==="number";
    ok = ok&&!isNaN(f)&&isFinite(f);
    return ok;
  }
  isNum = _es6_module.add_export('isNum', isNum);
  const _normal_tri_rets=util.cachering.fromConstructor(Vector3, 64);
  function normal_tri(v1, v2, v3) {
    let x1=v2[0]-v1[0];
    let y1=v2[1]-v1[1];
    let z1=v2[2]-v1[2];
    let x2=v3[0]-v1[0];
    let y2=v3[1]-v1[1];
    let z2=v3[2]-v1[2];
    if (!isNum(x1+y1+z1+z2+y2+z2)) {
        throw new Error("NaN in normal_tri");
    }
    let x3, y3, z3;
    x1 = v2[0]-v1[0];
    y1 = v2[1]-v1[1];
    z1 = v2[2]-v1[2];
    x2 = v3[0]-v1[0];
    y2 = v3[1]-v1[1];
    z2 = v3[2]-v1[2];
    x3 = y1*z2-z1*y2;
    y3 = z1*x2-x1*z2;
    z3 = x1*y2-y1*x2;
    let len=Math.sqrt(x3*x3+y3*y3+z3*z3);
    if (len>1e-05)
      len = 1.0/len;
    x3*=len;
    y3*=len;
    z3*=len;
    let n=_normal_tri_rets.next();
    if (!isNum(x3+y3+z3)) {
        throw new Error("NaN!");
    }
    n[0] = x3;
    n[1] = y3;
    n[2] = z3;
    return n;
  }
  normal_tri = _es6_module.add_export('normal_tri', normal_tri);
  
  var $n2_normal_quad=new Vector3();
  let _q1=new Vector3(), _q2=new Vector3(), _q3=new Vector3();
  function normal_quad(v1, v2, v3, v4) {
    _q1.load(normal_tri(v1, v2, v3));
    _q2.load(normal_tri(v2, v3, v4));
    _q1.add(_q2).normalize();
    return _q1;
  }
  normal_quad = _es6_module.add_export('normal_quad', normal_quad);
  function normal_quad_old(v1, v2, v3, v4) {
    var n=normal_tri(v1, v2, v3);
    $n2_normal_quad[0] = n[0];
    $n2_normal_quad[1] = n[1];
    $n2_normal_quad[2] = n[2];
    n = normal_tri(v1, v3, v4);
    $n2_normal_quad[0] = $n2_normal_quad[0]+n[0];
    $n2_normal_quad[1] = $n2_normal_quad[1]+n[1];
    $n2_normal_quad[2] = $n2_normal_quad[2]+n[2];
    var _len=Math.sqrt($n2_normal_quad[0]*$n2_normal_quad[0]+$n2_normal_quad[1]*$n2_normal_quad[1]+$n2_normal_quad[2]*$n2_normal_quad[2]);
    if (_len>1e-05)
      _len = 1.0/_len;
    $n2_normal_quad[0]*=_len;
    $n2_normal_quad[1]*=_len;
    $n2_normal_quad[2]*=_len;
    return $n2_normal_quad;
  }
  normal_quad_old = _es6_module.add_export('normal_quad_old', normal_quad_old);
  
  var _li_vi=new Vector3();
  function line_isect(v1, v2, v3, v4, calc_t) {
    if (calc_t==undefined) {
        calc_t = false;
    }
    var div=(v2[0]-v1[0])*(v4[1]-v3[1])-(v2[1]-v1[1])*(v4[0]-v3[0]);
    if (div==0.0)
      return [new Vector3(), COLINEAR, 0.0];
    var vi=_li_vi;
    vi[0] = 0;
    vi[1] = 0;
    vi[2] = 0;
    vi[0] = ((v3[0]-v4[0])*(v1[0]*v2[1]-v1[1]*v2[0])-(v1[0]-v2[0])*(v3[0]*v4[1]-v3[1]*v4[0]))/div;
    vi[1] = ((v3[1]-v4[1])*(v1[0]*v2[1]-v1[1]*v2[0])-(v1[1]-v2[1])*(v3[0]*v4[1]-v3[1]*v4[0]))/div;
    if (calc_t||v1.length==3) {
        var n1=new Vector2(v2).sub(v1);
        var n2=new Vector2(vi).sub(v1);
        var t=n2.vectorLength()/n1.vectorLength();
        n1.normalize();
        n2.normalize();
        if (n1.dot(n2)<0.0) {
            t = -t;
        }
        if (v1.length==3) {
            vi[2] = v1[2]+(v2[2]-v1[2])*t;
        }
        return [vi, LINECROSS, t];
    }
    return [vi, LINECROSS];
  }
  line_isect = _es6_module.add_export('line_isect', line_isect);
  
  var dt2l_v1=new Vector2();
  var dt2l_v2=new Vector2();
  var dt2l_v3=new Vector2();
  var dt2l_v4=new Vector2();
  var dt2l_v5=new Vector2();
  function dist_to_line_2d(p, v1, v2, clip, closest_co_out, t_out) {
    if (closest_co_out===undefined) {
        closest_co_out = undefined;
    }
    if (t_out===undefined) {
        t_out = undefined;
    }
    if (clip==undefined) {
        clip = true;
    }
    v1 = dt2l_v4.load(v1);
    v2 = dt2l_v5.load(v2);
    var n=dt2l_v1;
    var vec=dt2l_v3;
    n.load(v2).sub(v1).normalize();
    vec.load(p).sub(v1);
    var t=vec.dot(n);
    if (clip) {
        t = Math.min(Math.max(t, 0.0), v1.vectorDistance(v2));
    }
    n.mulScalar(t).add(v1);
    if (closest_co_out) {
        closest_co_out[0] = n[0];
        closest_co_out[1] = n[1];
    }
    if (t_out!==undefined) {
        t_out = t;
    }
    return n.vectorDistance(p);
  }
  dist_to_line_2d = _es6_module.add_export('dist_to_line_2d', dist_to_line_2d);
  var dt3l_v1=new Vector3();
  var dt3l_v2=new Vector3();
  var dt3l_v3=new Vector3();
  var dt3l_v4=new Vector3();
  var dt3l_v5=new Vector3();
  function dist_to_line_sqr(p, v1, v2, clip) {
    if (clip===undefined) {
        clip = true;
    }
    let px=p[0]-v1[0];
    let py=p[1]-v1[1];
    let pz=p.length<3 ? 0.0 : p[2]-v1[2];
    pz = pz===undefined ? 0.0 : pz;
    let v2x=v2[0]-v1[0];
    let v2y=v2[1]-v1[1];
    let v2z=v2.length<3 ? 0.0 : v2[2]-v1[2];
    let len=v2x*v2x+v2y*v2y+v2z*v2z;
    if (len===0.0) {
        return Math.sqrt(px*px+py*py+pz*pz);
    }
    let len2=1.0/len;
    v2x*=len2;
    v2y*=len2;
    v2z*=len2;
    let t=px*v2x+py*v2y+pz*v2z;
    if (clip) {
        t = Math.min(Math.max(t, 0.0), len);
    }
    v2x*=t;
    v2y*=t;
    v2z*=t;
    return (v2x-px)*(v2x-px)+(v2y-py)*(v2y-py)+(v2z-pz)*(v2z-pz);
  }
  dist_to_line_sqr = _es6_module.add_export('dist_to_line_sqr', dist_to_line_sqr);
  function dist_to_line(p, v1, v2, clip) {
    if (clip===undefined) {
        clip = true;
    }
    return Math.sqrt(dist_to_line_sqr(p, v1, v2, clip));
  }
  dist_to_line = _es6_module.add_export('dist_to_line', dist_to_line);
  var _cplw_vs4=util.cachering.fromConstructor(Vector4, 64);
  var _cplw_vs3=util.cachering.fromConstructor(Vector3, 64);
  var _cplw_vs2=util.cachering.fromConstructor(Vector2, 64);
  function wclip(x1, x2, w1, w2, near) {
    var r1=near*w1-x1;
    var r2=(w1-w2)*near-(x1-x2);
    if (r2==0.0)
      return 0.0;
    return r1/r2;
  }
  function clip(a, b, znear) {
    if (a-b==0.0)
      return 0.0;
    return (a-znear)/(a-b);
  }
  function clip_line_w(_v1, _v2, znear, zfar) {
    var v1=_cplw_vs4.next().load(_v1);
    var v2=_cplw_vs4.next().load(_v2);
    if ((v1[2]<1.0&&v2[2]<1.0))
      return false;
    function doclip1(v1, v2, axis) {
      if (v1[axis]/v1[3]<-1) {
          var t=wclip(v1[axis], v2[axis], v1[3], v2[3], -1);
          v1.interp(v2, t);
      }
      else 
        if (v1[axis]/v1[3]>1) {
          var t=wclip(v1[axis], v2[axis], v1[3], v2[3], 1);
          v1.interp(v2, t);
      }
    }
    function doclip(v1, v2, axis) {
      doclip1(v1, v2, axis);
      doclip1(v2, v1, axis);
    }
    function dozclip(v1, v2) {
      if (v1[2]<1) {
          var t=clip(v1[2], v2[2], 1);
          v1.interp(v2, t);
      }
      else 
        if (v2[2]<1) {
          var t=clip(v2[2], v1[2], 1);
          v2.interp(v1, t);
      }
    }
    dozclip(v1, v2, 1);
    doclip(v1, v2, 0);
    doclip(v1, v2, 1);
    for (var i=0; i<4; i++) {
        _v1[i] = v1[i];
        _v2[i] = v2[i];
    }
    return !(v1[0]/v1[3]==v2[0]/v2[3]||v1[1]/v2[3]==v2[1]/v2[3]);
  }
  clip_line_w = _es6_module.add_export('clip_line_w', clip_line_w);
  
  var _closest_point_on_line_cache=util.cachering.fromConstructor(Vector3, 64);
  var _closest_point_rets=new util.cachering(function () {
    return [0, 0];
  }, 64);
  var _closest_tmps=[new Vector3(), new Vector3(), new Vector3()];
  function closest_point_on_line(p, v1, v2, clip) {
    if (clip===undefined) {
        clip = true;
    }
    var l1=_closest_tmps[0], l2=_closest_tmps[1];
    var len;
    l1.load(v2).sub(v1);
    if (clip) {
        len = l1.vectorLength();
    }
    l1.normalize();
    l2.load(p).sub(v1);
    var t=l2.dot(l1);
    if (clip) {
        t = t<0.0 ? 0.0 : t;
        t = t>len ? len : t;
    }
    var p=_closest_point_on_line_cache.next();
    p.load(l1).mulScalar(t).add(v1);
    var ret=_closest_point_rets.next();
    ret[0] = p;
    ret[1] = t;
    return ret;
  }
  closest_point_on_line = _es6_module.add_export('closest_point_on_line', closest_point_on_line);
  
  var _circ_from_line_tan_vs=util.cachering.fromConstructor(Vector3, 32);
  var _circ_from_line_tan_ret=new util.cachering(function () {
    return [new Vector3(), 0];
  });
  function circ_from_line_tan(a, b, t) {
    var p1=_circ_from_line_tan_vs.next();
    var t2=_circ_from_line_tan_vs.next();
    var n1=_circ_from_line_tan_vs.next();
    p1.load(a).sub(b);
    t2.load(t).normalize();
    n1.load(p1).normalize().cross(t2).cross(t2).normalize();
    var ax=p1[0], ay=p1[1], az=p1[2], nx=n1[0], ny=n1[1], nz=n1[2];
    var r=-(ax*ax+ay*ay+az*az)/(2*(ax*nx+ay*ny+az*nz));
    var ret=_circ_from_line_tan_ret.next();
    ret[0].load(n1).mulScalar(r).add(a);
    ret[1] = r;
    return ret;
  }
  circ_from_line_tan = _es6_module.add_export('circ_from_line_tan', circ_from_line_tan);
  var _gtc_e1=new Vector3();
  var _gtc_e2=new Vector3();
  var _gtc_e3=new Vector3();
  var _gtc_p1=new Vector3();
  var _gtc_p2=new Vector3();
  var _gtc_v1=new Vector3();
  var _gtc_v2=new Vector3();
  var _gtc_p12=new Vector3();
  var _gtc_p22=new Vector3();
  var _get_tri_circ_ret=new util.cachering(function () {
    return [0, 0];
  });
  function get_tri_circ(a, b, c) {
    var v1=_gtc_v1;
    var v2=_gtc_v2;
    var e1=_gtc_e1;
    var e2=_gtc_e2;
    var e3=_gtc_e3;
    var p1=_gtc_p1;
    var p2=_gtc_p2;
    for (var i=0; i<3; i++) {
        e1[i] = b[i]-a[i];
        e2[i] = c[i]-b[i];
        e3[i] = a[i]-c[i];
    }
    for (var i=0; i<3; i++) {
        p1[i] = (a[i]+b[i])*0.5;
        p2[i] = (c[i]+b[i])*0.5;
    }
    e1.normalize();
    v1[0] = -e1[1];
    v1[1] = e1[0];
    v1[2] = e1[2];
    v2[0] = -e2[1];
    v2[1] = e2[0];
    v2[2] = e2[2];
    v1.normalize();
    v2.normalize();
    var cent;
    var type;
    for (var i=0; i<3; i++) {
        _gtc_p12[i] = p1[i]+v1[i];
        _gtc_p22[i] = p2[i]+v2[i];
    }
    var ret=line_isect(p1, _gtc_p12, p2, _gtc_p22);
    cent = ret[0];
    type = ret[1];
    e1.load(a);
    e2.load(b);
    e3.load(c);
    var r=e1.sub(cent).vectorLength();
    if (r<feps)
      r = e2.sub(cent).vectorLength();
    if (r<feps)
      r = e3.sub(cent).vectorLength();
    var ret=_get_tri_circ_ret.next();
    ret[0] = cent;
    ret[1] = r;
    return ret;
  }
  get_tri_circ = _es6_module.add_export('get_tri_circ', get_tri_circ);
  
  function gen_circle(m, origin, r, stfeps) {
    var pi=Math.PI;
    var f=-pi/2;
    var df=(pi*2)/stfeps;
    var verts=new Array();
    for (var i=0; i<stfeps; i++) {
        var x=origin[0]+r*Math.sin(f);
        var y=origin[1]+r*Math.cos(f);
        var v=m.make_vert(new Vector3([x, y, origin[2]]));
        verts.push(v);
        f+=df;
    }
    for (var i=0; i<verts.length; i++) {
        var v1=verts[i];
        var v2=verts[(i+1)%verts.length];
        m.make_edge(v1, v2);
    }
    return verts;
  }
  gen_circle = _es6_module.add_export('gen_circle', gen_circle);
  
  var cos=Math.cos;
  var sin=Math.sin;
  function rot2d(v1, A, axis) {
    var x=v1[0];
    var y=v1[1];
    if (axis==1) {
        v1[0] = x*cos(A)+y*sin(A);
        v1[2] = y*cos(A)-x*sin(A);
    }
    else {
      v1[0] = x*cos(A)-y*sin(A);
      v1[1] = y*cos(A)+x*sin(A);
    }
  }
  rot2d = _es6_module.add_export('rot2d', rot2d);
  function makeCircleMesh(gl, radius, stfeps) {
    var mesh=new Mesh();
    var verts1=gen_circle(mesh, new Vector3(), radius, stfeps);
    var verts2=gen_circle(mesh, new Vector3(), radius/1.75, stfeps);
    mesh.make_face_complex([verts1, verts2]);
    return mesh;
  }
  makeCircleMesh = _es6_module.add_export('makeCircleMesh', makeCircleMesh);
  
  function minmax_verts(verts) {
    var min=new Vector3([1000000000000.0, 1000000000000.0, 1000000000000.0]);
    var max=new Vector3([-1000000000000.0, -1000000000000.0, -1000000000000.0]);
    var __iter_v=__get_iter(verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      for (var i=0; i<3; i++) {
          min[i] = Math.min(min[i], v.co[i]);
          max[i] = Math.max(max[i], v.co[i]);
      }
    }
    return [min, max];
  }
  minmax_verts = _es6_module.add_export('minmax_verts', minmax_verts);
  
  function unproject(vec, ipers, iview) {
    var newvec=new Vector3(vec);
    newvec.multVecMatrix(ipers);
    newvec.multVecMatrix(iview);
    return newvec;
  }
  unproject = _es6_module.add_export('unproject', unproject);
  
  function project(vec, pers, view) {
    var newvec=new Vector3(vec);
    newvec.multVecMatrix(pers);
    newvec.multVecMatrix(view);
    return newvec;
  }
  project = _es6_module.add_export('project', project);
  
  var _sh_minv=new Vector3();
  var _sh_maxv=new Vector3();
  var _sh_start=[];
  var _sh_end=[];
  var static_cent_gbw=new Vector3();
  function get_boundary_winding(points) {
    var cent=static_cent_gbw.zero();
    if (points.length==0)
      return false;
    for (var i=0; i<points.length; i++) {
        cent.add(points[i]);
    }
    cent.divideScalar(points.length);
    var w=0, totw=0;
    for (var i=0; i<points.length; i++) {
        var v1=points[i];
        var v2=points[(i+1)%points.length];
        if (!colinear(v1, v2, cent)) {
            w+=winding(v1, v2, cent);
            totw+=1;
        }
    }
    if (totw>0)
      w/=totw;
    return Math.round(w)==1;
  }
  get_boundary_winding = _es6_module.add_export('get_boundary_winding', get_boundary_winding);
  
  class PlaneOps  {
     constructor(normal) {
      var no=normal;
      this.axis = [0, 0, 0];
      this.reset_axis(normal);
    }
     reset_axis(no) {
      var ax, ay, az;
      var nx=Math.abs(no[0]), ny=Math.abs(no[1]), nz=Math.abs(no[2]);
      if (nz>nx&&nz>ny) {
          ax = 0;
          ay = 1;
          az = 2;
      }
      else 
        if (nx>ny&&nx>nz) {
          ax = 2;
          ay = 1;
          az = 0;
      }
      else {
        ax = 0;
        ay = 2;
        az = 1;
      }
      this.axis = [ax, ay, az];
    }
     convex_quad(v1, v2, v3, v4) {
      var ax=this.axis;
      v1 = new Vector3([v1[ax[0]], v1[ax[1]], v1[ax[2]]]);
      v2 = new Vector3([v2[ax[0]], v2[ax[1]], v2[ax[2]]]);
      v3 = new Vector3([v3[ax[0]], v3[ax[1]], v3[ax[2]]]);
      v4 = new Vector3([v4[ax[0]], v4[ax[1]], v4[ax[2]]]);
      return convex_quad(v1, v2, v3, v4);
    }
     line_isect(v1, v2, v3, v4) {
      var ax=this.axis;
      var orig1=v1, orig2=v2;
      v1 = new Vector3([v1[ax[0]], v1[ax[1]], v1[ax[2]]]);
      v2 = new Vector3([v2[ax[0]], v2[ax[1]], v2[ax[2]]]);
      v3 = new Vector3([v3[ax[0]], v3[ax[1]], v3[ax[2]]]);
      v4 = new Vector3([v4[ax[0]], v4[ax[1]], v4[ax[2]]]);
      var ret=line_isect(v1, v2, v3, v4, true);
      var vi=ret[0];
      if (ret[1]==LINECROSS) {
          ret[0].load(orig2).sub(orig1).mulScalar(ret[2]).add(orig1);
      }
      return ret;
    }
     line_line_cross(l1, l2) {
      var ax=this.axis;
      var v1=l1[0], v2=l1[1], v3=l2[0], v4=l2[1];
      v1 = new Vector3([v1[ax[0]], v1[ax[1]], 0.0]);
      v2 = new Vector3([v2[ax[0]], v2[ax[1]], 0.0]);
      v3 = new Vector3([v3[ax[0]], v3[ax[1]], 0.0]);
      v4 = new Vector3([v4[ax[0]], v4[ax[1]], 0.0]);
      return line_line_cross([v1, v2], [v3, v4]);
    }
     winding(v1, v2, v3) {
      var ax=this.axis;
      if (v1==undefined)
        console.trace();
      v1 = new Vector3([v1[ax[0]], v1[ax[1]], 0.0]);
      v2 = new Vector3([v2[ax[0]], v2[ax[1]], 0.0]);
      v3 = new Vector3([v3[ax[0]], v3[ax[1]], 0.0]);
      return winding(v1, v2, v3);
    }
     colinear(v1, v2, v3) {
      var ax=this.axis;
      v1 = new Vector3([v1[ax[0]], v1[ax[1]], 0.0]);
      v2 = new Vector3([v2[ax[0]], v2[ax[1]], 0.0]);
      v3 = new Vector3([v3[ax[0]], v3[ax[1]], 0.0]);
      return colinear(v1, v2, v3);
    }
     get_boundary_winding(points) {
      var ax=this.axis;
      var cent=new Vector3();
      if (points.length==0)
        return false;
      for (var i=0; i<points.length; i++) {
          cent.add(points[i]);
      }
      cent.divideScalar(points.length);
      var w=0, totw=0;
      for (var i=0; i<points.length; i++) {
          var v1=points[i];
          var v2=points[(i+1)%points.length];
          if (!this.colinear(v1, v2, cent)) {
              w+=this.winding(v1, v2, cent);
              totw+=1;
          }
      }
      if (totw>0)
        w/=totw;
      return Math.round(w)==1;
    }
  }
  _ESClass.register(PlaneOps);
  _es6_module.add_class(PlaneOps);
  PlaneOps = _es6_module.add_export('PlaneOps', PlaneOps);
  var _isrp_ret=new Vector3();
  let isect_ray_plane_rets=util.cachering.fromConstructor(Vector3, 256);
  function isect_ray_plane(planeorigin, planenormal, rayorigin, raynormal) {
    let po=planeorigin, pn=planenormal, ro=rayorigin, rn=raynormal;
    let div=(pn[1]*rn[1]+pn[2]*rn[2]+pn[0]*rn[0]);
    if (Math.abs(div)<1e-06) {
        return undefined;
    }
    let t=((po[1]-ro[1])*pn[1]+(po[2]-ro[2])*pn[2]+(po[0]-ro[0])*pn[0])/div;
    _isrp_ret.load(ro).addFac(rn, t);
    return isect_ray_plane_rets.next().load(_isrp_ret);
  }
  isect_ray_plane = _es6_module.add_export('isect_ray_plane', isect_ray_plane);
  function _old_isect_ray_plane(planeorigin, planenormal, rayorigin, raynormal) {
    var p=planeorigin, n=planenormal;
    var r=rayorigin, v=raynormal;
    var d=p.vectorLength();
    var t=-(r.dot(n)-p.dot(n))/v.dot(n);
    _isrp_ret.load(v);
    _isrp_ret.mulScalar(t);
    _isrp_ret.add(r);
    return _isrp_ret;
  }
  _old_isect_ray_plane = _es6_module.add_export('_old_isect_ray_plane', _old_isect_ray_plane);
  
  function mesh_find_tangent(mesh, viewvec, offvec, projmat, verts) {
    if (verts==undefined)
      verts = mesh.verts.selected;
    var vset=new set();
    var eset=new set();
    var __iter_v=__get_iter(verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      vset.add(v);
    }
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      var __iter_e=__get_iter(v.edges);
      var e;
      while (1) {
        var __ival_e=__iter_e.next();
        if (__ival_e.done) {
            break;
        }
        e = __ival_e.value;
        if (vset.has(e.other_vert(v))) {
            eset.add(e);
        }
      }
    }
    if (eset.length==0) {
        return new Vector3(offvec);
    }
    var tanav=new Vector3();
    var evec=new Vector3();
    var tan=new Vector3();
    var co2=new Vector3();
    var __iter_e=__get_iter(eset);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      evec.load(e.v1.co).multVecMatrix(projmat);
      co2.load(e.v2.co).multVecMatrix(projmat);
      evec.sub(co2);
      evec.normalize();
      tan[0] = evec[1];
      tan[1] = -evec[0];
      tan[2] = 0.0;
      if (tan.dot(offvec)<0.0)
        tan.mulScalar(-1.0);
      tanav.add(tan);
    }
    tanav.normalize();
    return tanav;
  }
  mesh_find_tangent = _es6_module.add_export('mesh_find_tangent', mesh_find_tangent);
  
  class Mat4Stack  {
     constructor() {
      this.stack = [];
      this.matrix = new Matrix4();
      this.matrix.makeIdentity();
      this.update_func = undefined;
    }
     set_internal_matrix(mat, update_func) {
      this.update_func = update_func;
      this.matrix = mat;
    }
     reset(mat) {
      this.matrix.load(mat);
      this.stack = [];
      if (this.update_func!=undefined)
        this.update_func();
    }
     load(mat) {
      this.matrix.load(mat);
      if (this.update_func!=undefined)
        this.update_func();
    }
     multiply(mat) {
      this.matrix.multiply(mat);
      if (this.update_func!=undefined)
        this.update_func();
    }
     identity() {
      this.matrix.loadIdentity();
      if (this.update_func!=undefined)
        this.update_func();
    }
     push(mat2) {
      this.stack.push(new Matrix4(this.matrix));
      if (mat2!=undefined) {
          this.matrix.load(mat2);
          if (this.update_func!=undefined)
            this.update_func();
      }
    }
     pop() {
      var mat=this.stack.pop(this.stack.length-1);
      this.matrix.load(mat);
      if (this.update_func!=undefined)
        this.update_func();
      return mat;
    }
  }
  _ESClass.register(Mat4Stack);
  _es6_module.add_class(Mat4Stack);
  Mat4Stack = _es6_module.add_export('Mat4Stack', Mat4Stack);
  const tril_rets=util.cachering.fromConstructor(Vector3, 128);
  function lreport() {
  }
  function trilinear_v3(uvw, boxverts) {
    let $_t1dbkn=uvw, u=$_t1dbkn[0], v=$_t1dbkn[1], w=$_t1dbkn[2];
    const a1x=boxverts[0][0], a1y=boxverts[0][1], a1z=boxverts[0][2];
    const b1x=boxverts[1][0]-a1x, b1y=boxverts[1][1]-a1y, b1z=boxverts[1][2]-a1z;
    const c1x=boxverts[2][0]-a1x, c1y=boxverts[2][1]-a1y, c1z=boxverts[2][2]-a1z;
    const d1x=boxverts[3][0]-a1x, d1y=boxverts[3][1]-a1y, d1z=boxverts[3][2]-a1z;
    const a2x=boxverts[4][0]-a1x, a2y=boxverts[4][1]-a1y, a2z=boxverts[4][2]-a1z;
    const b2x=boxverts[5][0]-a1x, b2y=boxverts[5][1]-a1y, b2z=boxverts[5][2]-a1z;
    const c2x=boxverts[6][0]-a1x, c2y=boxverts[6][1]-a1y, c2z=boxverts[6][2]-a1z;
    const d2x=boxverts[7][0]-a1x, d2y=boxverts[7][1]-a1y, d2z=boxverts[7][2]-a1z;
    const x=(((a2x-b2x)*v-a2x+(c2x-d2x)*v+d2x)*u-((a2x-b2x)*v-a2x)-(((c1x-d1x)*v+d1x-b1x*v)*u+b1x*v))*w+((c1x-d1x)*v+d1x-b1x*v)*u+b1x*v;
    const y=(((a2y-b2y)*v-a2y+(c2y-d2y)*v+d2y)*u-((a2y-b2y)*v-a2y)-(((c1y-d1y)*v+d1y-b1y*v)*u+b1y*v))*w+((c1y-d1y)*v+d1y-b1y*v)*u+b1y*v;
    const z=(((a2z-b2z)*v-a2z+(c2z-d2z)*v+d2z)*u-((a2z-b2z)*v-a2z)-(((c1z-d1z)*v+d1z-b1z*v)*u+b1z*v))*w+((c1z-d1z)*v+d1z-b1z*v)*u+b1z*v;
    let p=tril_rets.next();
    p[0] = x+a1x;
    p[1] = y+a1y;
    p[2] = z+a1z;
    return p;
  }
  trilinear_v3 = _es6_module.add_export('trilinear_v3', trilinear_v3);
  let tril_co_rets=util.cachering.fromConstructor(Vector3, 128);
  let tril_co_tmps=util.cachering.fromConstructor(Vector3, 16);
  let tril_mat_1=new Matrix4();
  let tril_mat_2=new Matrix4();
  let wtable=[[[0.5, 0.5, 0], [0.5, 0.5, 0], [0.5, 0.5, 0]], [[0.5, 0.5, 0], [0.0, 0.5, 0.5], [0.5, 0.5, 0]], [[0.0, 0.5, 0.5], [0.0, 0.5, 0.5], [0.5, 0.5, 0]], [[0.0, 0.5, 0.5], [0.5, 0.5, 0], [0.5, 0.5, 0]]];
  for (let i=0; i<4; i++) {
      let w=wtable[i];
      w = [w[0], w[1], [0.0, 0.5, 0.5]];
      wtable.push(w);
  }
  const pih_tmps=util.cachering.fromConstructor(Vector3, 16);
  const boxfaces_table=[[0, 1, 2, 3], [7, 6, 5, 4], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]];
  let boxfaces_tmp=new Array(6);
  for (let i=0; i<6; i++) {
      boxfaces_tmp[i] = new Vector3();
  }
  let boxfacenormals_tmp=new Array(6);
  for (let i=0; i<6; i++) {
      boxfacenormals_tmp[i] = new Vector3();
  }
  function point_in_hex(p, boxverts, boxfacecents, boxfacenormals) {
    if (boxfacecents===undefined) {
        boxfacecents = undefined;
    }
    if (boxfacenormals===undefined) {
        boxfacenormals = undefined;
    }
    if (!boxfacecents) {
        boxfacecents = boxfaces_tmp;
        for (let i=0; i<6; i++) {
            let $_t2otnk=boxfaces_table[i], v1=$_t2otnk[0], v2=$_t2otnk[1], v3=$_t2otnk[2], v4=$_t2otnk[3];
            v1 = boxverts[v1];
            v2 = boxverts[v2];
            v3 = boxverts[v3];
            v4 = boxverts[v4];
            boxfacecents[i].load(v1).add(v2).add(v3).add(v4).mulScalar(0.25);
        }
    }
    if (!boxfacenormals) {
        boxfacenormals = boxfacenormals_tmp;
        for (let i=0; i<6; i++) {
            let $_t3sogn=boxfaces_table[i], v1=$_t3sogn[0], v2=$_t3sogn[1], v3=$_t3sogn[2], v4=$_t3sogn[3];
            v1 = boxverts[v1];
            v2 = boxverts[v2];
            v3 = boxverts[v3];
            v4 = boxverts[v4];
            let n=normal_quad(v1, v2, v3, v4);
            boxfacenormals[i].load(n).negate();
        }
    }
    let t1=pih_tmps.next();
    let t2=pih_tmps.next();
    let cent=pih_tmps.next().zero();
    for (let i=0; i<6; i++) {
        cent.add(boxfacecents[i]);
    }
    cent.mulScalar(1.0/6.0);
    let ret=true;
    for (let i=0; i<6; i++) {
        t1.load(p).sub(boxfacecents[i]);
        t2.load(cent).sub(boxfacecents[i]);
        let n=boxfacenormals[i];
        if (1) {
            t1.normalize();
            t2.normalize();
        }
        if (t1.dot(t2)<0) {
            ret = false;
            return false;
        }
    }
    return ret;
  }
  point_in_hex = _es6_module.add_export('point_in_hex', point_in_hex);
  const boxverts_tmp=new Array(8);
  for (let i=0; i<8; i++) {
      boxverts_tmp[i] = new Vector3();
  }
  function trilinear_co(p, boxverts) {
    let uvw=tril_co_rets.next();
    uvw.zero();
    let u=tril_co_tmps.next();
    let v=tril_co_tmps.next();
    let w=tril_co_tmps.next();
    u.loadXYZ(0.0, 0.5, 1.0);
    v.loadXYZ(0.0, 0.5, 1.0);
    w.loadXYZ(0.0, 0.5, 1.0);
    let uvw2=tril_co_tmps.next();
    for (let step=0; step<4; step++) {
        uvw.loadXYZ(u[1], v[1], w[1]);
        let mini=undefined;
        let mindis=trilinear_v3(uvw, boxverts).vectorDistanceSqr(p);
        for (let i=0; i<8; i++) {
            let $_t4hhov=wtable[i], t1=$_t4hhov[0], t2=$_t4hhov[1], t3=$_t4hhov[2];
            let u2=t1[0]*u[0]+t1[1]*u[1]+t1[2]*u[2];
            let v2=t2[0]*v[0]+t2[1]*v[1]+t2[2]*v[2];
            let w2=t3[0]*w[0]+t3[1]*w[1]+t3[2]*w[2];
            let du=Math.abs(u2-u[1]);
            let dv=Math.abs(v2-v[1]);
            let dw=Math.abs(w2-w[1]);
            uvw.loadXYZ(u2, v2, w2);
            let dis=trilinear_v3(uvw, boxverts).vectorDistanceSqr(p);
            if (mindis===undefined||dis<mindis) {
            }
            if (1) {
                let bv=boxverts_tmp;
                bv[0].loadXYZ(u2-du, v2-dv, w2-dw);
                bv[1].loadXYZ(u2-du, v2+dv, w2-dw);
                bv[2].loadXYZ(u2+du, v2+dv, w2-dw);
                bv[3].loadXYZ(u2+du, v2-dv, w2-dw);
                bv[4].loadXYZ(u2-du, v2-dv, w2+dw);
                bv[5].loadXYZ(u2-du, v2+dv, w2+dw);
                bv[6].loadXYZ(u2+du, v2+dv, w2+dw);
                bv[7].loadXYZ(u2+du, v2-dv, w2+dw);
                for (let j=0; j<8; j++) {
                    bv[j].load(trilinear_v3(bv[j], boxverts));
                }
                if (point_in_hex(p, bv)) {
                    mini = i;
                    mindis = dis;
                    break;
                }
            }
        }
        if (mini===undefined) {
            lreport("mindis:", (mindis**0.5).toFixed(3));
            break;
        }
        let $_t5ftud=wtable[mini], t1=$_t5ftud[0], t2=$_t5ftud[1], t3=$_t5ftud[2];
        let u2=t1[0]*u[0]+t1[1]*u[1]+t1[2]*u[2];
        let v2=t2[0]*v[0]+t2[1]*v[1]+t2[2]*v[2];
        let w2=t3[0]*w[0]+t3[1]*w[1]+t3[2]*w[2];
        let du=Math.abs(u2-u[1]);
        let dv=Math.abs(v2-v[1]);
        let dw=Math.abs(w2-w[1]);
        u[0] = u2-du;
        v[0] = v2-dv;
        w[0] = w2-dw;
        u[1] = u2;
        v[1] = v2;
        w[1] = w2;
        u[2] = u2+du;
        v[2] = v2+dv;
        w[2] = w2+dw;
        lreport("mindis:", (mindis**0.5).toFixed(3), u2, v2, w2);
    }
    uvw.loadXYZ(u[1], v[1], w[1]);
    return trilinear_co2(p, boxverts, uvw);
  }
  trilinear_co = _es6_module.add_export('trilinear_co', trilinear_co);
  function trilinear_co2(p, boxverts, uvw) {
    let grad=tril_co_tmps.next();
    let df=1e-05;
    let mat=tril_mat_1;
    let m=mat.$matrix;
    let mat2=tril_mat_2;
    let r1=tril_co_tmps.next();
    for (let step=0; step<55; step++) {
        let totg=0;
        for (let i=0; i<3; i++) {
            let axis_error=0.0;
            if (uvw[i]<0) {
                axis_error = -uvw[i];
            }
            else 
              if (uvw[i]>1.0) {
                axis_error = uvw[i]-1.0;
            }
            r1[i] = trilinear_v3(uvw, boxverts).vectorDistance(p)+10.0*axis_error;
            let orig=uvw[i];
            uvw[i]+=df;
            if (uvw[i]<0) {
                axis_error = -uvw[i];
            }
            else 
              if (uvw[i]>1.0) {
                axis_error = uvw[i]-1.0;
            }
            else {
              axis_error = 0.0;
            }
            let r2=trilinear_v3(uvw, boxverts).vectorDistance(p)+10.0*axis_error;
            uvw[i] = orig;
            grad[i] = (r2-r1[i])/df;
            totg+=grad[i]**2;
        }
        if (totg===0.0) {
            break;
        }
        let err=trilinear_v3(uvw, boxverts).vectorDistance(p);
        if (1) {
            uvw.addFac(grad, -err/totg*0.85);
        }
        else {
          mat.makeIdentity();
          m.m11 = grad[0];
          m.m12 = grad[1];
          m.m13 = grad[2];
          m.m22 = m.m33 = m.m44 = 0.0;
          mat.transpose();
          mat2.load(mat).transpose();
          mat.preMultiply(mat2).invert();
          mat.multiply(mat2);
          grad.load(r1);
          grad.multVecMatrix(mat);
          uvw.addFac(grad, -1.0);
        }
        lreport("error:", err.toFixed(3), uvw);
        if (r1.dot(r1)**0.5<0.0001) {
            break;
        }
    }
    lreport("\n");
    return uvw;
  }
  trilinear_co2 = _es6_module.add_export('trilinear_co2', trilinear_co2);
  let angle_tri_v3_rets=util.cachering.fromConstructor(Vector3, 32);
  let angle_tri_v3_vs=util.cachering.fromConstructor(Vector3, 32);
  function tri_angles(v1, v2, v3) {
    let t1=angle_tri_v3_vs.next().load(v1).sub(v2);
    let t2=angle_tri_v3_vs.next().load(v3).sub(v2);
    let t3=angle_tri_v3_vs.next().load(v2).sub(v3);
    t1.normalize();
    t2.normalize();
    t3.normalize();
    let th1=Math.acos(t1.dot(t2)*0.99999);
    t2.negate();
    let th2=Math.acos(t2.dot(t3)*0.99999);
    let th3=Math.PI-(th1+th2);
    let ret=angle_tri_v3_rets.next();
    ret[0] = th1;
    ret[1] = th2;
    ret[2] = th3;
    return ret;
  }
  tri_angles = _es6_module.add_export('tri_angles', tri_angles);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/math.js');


es6_module_define('mobile-detect', [], function _mobile_detect_module(_es6_module) {
  (function (define, undefined) {
    define(function () {
      'use strict';
      var impl={}
      impl.mobileDetectRules = {"phones": {"iPhone": "\\biPhone\\b|\\biPod\\b", 
      "BlackBerry": "BlackBerry|\\bBB10\\b|rim[0-9]+|\\b(BBA100|BBB100|BBD100|BBE100|BBF100|STH100)\\b-[0-9]+", 
      "HTC": "HTC|HTC.*(Sensation|Evo|Vision|Explorer|6800|8100|8900|A7272|S510e|C110e|Legend|Desire|T8282)|APX515CKT|Qtek9090|APA9292KT|HD_mini|Sensation.*Z710e|PG86100|Z715e|Desire.*(A8181|HD)|ADR6200|ADR6400L|ADR6425|001HT|Inspire 4G|Android.*\\bEVO\\b|T-Mobile G1|Z520m|Android [0-9.]+; Pixel", 
      "Nexus": "Nexus One|Nexus S|Galaxy.*Nexus|Android.*Nexus.*Mobile|Nexus 4|Nexus 5|Nexus 6", 
      "Dell": "Dell[;]? (Streak|Aero|Venue|Venue Pro|Flash|Smoke|Mini 3iX)|XCD28|XCD35|\\b001DL\\b|\\b101DL\\b|\\bGS01\\b", 
      "Motorola": "Motorola|DROIDX|DROID BIONIC|\\bDroid\\b.*Build|Android.*Xoom|HRI39|MOT-|A1260|A1680|A555|A853|A855|A953|A955|A956|Motorola.*ELECTRIFY|Motorola.*i1|i867|i940|MB200|MB300|MB501|MB502|MB508|MB511|MB520|MB525|MB526|MB611|MB612|MB632|MB810|MB855|MB860|MB861|MB865|MB870|ME501|ME502|ME511|ME525|ME600|ME632|ME722|ME811|ME860|ME863|ME865|MT620|MT710|MT716|MT720|MT810|MT870|MT917|Motorola.*TITANIUM|WX435|WX445|XT300|XT301|XT311|XT316|XT317|XT319|XT320|XT390|XT502|XT530|XT531|XT532|XT535|XT603|XT610|XT611|XT615|XT681|XT701|XT702|XT711|XT720|XT800|XT806|XT860|XT862|XT875|XT882|XT883|XT894|XT901|XT907|XT909|XT910|XT912|XT928|XT926|XT915|XT919|XT925|XT1021|\\bMoto E\\b|XT1068|XT1092|XT1052", 
      "Samsung": "\\bSamsung\\b|SM-G950F|SM-G955F|SM-G9250|GT-19300|SGH-I337|BGT-S5230|GT-B2100|GT-B2700|GT-B2710|GT-B3210|GT-B3310|GT-B3410|GT-B3730|GT-B3740|GT-B5510|GT-B5512|GT-B5722|GT-B6520|GT-B7300|GT-B7320|GT-B7330|GT-B7350|GT-B7510|GT-B7722|GT-B7800|GT-C3010|GT-C3011|GT-C3060|GT-C3200|GT-C3212|GT-C3212I|GT-C3262|GT-C3222|GT-C3300|GT-C3300K|GT-C3303|GT-C3303K|GT-C3310|GT-C3322|GT-C3330|GT-C3350|GT-C3500|GT-C3510|GT-C3530|GT-C3630|GT-C3780|GT-C5010|GT-C5212|GT-C6620|GT-C6625|GT-C6712|GT-E1050|GT-E1070|GT-E1075|GT-E1080|GT-E1081|GT-E1085|GT-E1087|GT-E1100|GT-E1107|GT-E1110|GT-E1120|GT-E1125|GT-E1130|GT-E1160|GT-E1170|GT-E1175|GT-E1180|GT-E1182|GT-E1200|GT-E1210|GT-E1225|GT-E1230|GT-E1390|GT-E2100|GT-E2120|GT-E2121|GT-E2152|GT-E2220|GT-E2222|GT-E2230|GT-E2232|GT-E2250|GT-E2370|GT-E2550|GT-E2652|GT-E3210|GT-E3213|GT-I5500|GT-I5503|GT-I5700|GT-I5800|GT-I5801|GT-I6410|GT-I6420|GT-I7110|GT-I7410|GT-I7500|GT-I8000|GT-I8150|GT-I8160|GT-I8190|GT-I8320|GT-I8330|GT-I8350|GT-I8530|GT-I8700|GT-I8703|GT-I8910|GT-I9000|GT-I9001|GT-I9003|GT-I9010|GT-I9020|GT-I9023|GT-I9070|GT-I9082|GT-I9100|GT-I9103|GT-I9220|GT-I9250|GT-I9300|GT-I9305|GT-I9500|GT-I9505|GT-M3510|GT-M5650|GT-M7500|GT-M7600|GT-M7603|GT-M8800|GT-M8910|GT-N7000|GT-S3110|GT-S3310|GT-S3350|GT-S3353|GT-S3370|GT-S3650|GT-S3653|GT-S3770|GT-S3850|GT-S5210|GT-S5220|GT-S5229|GT-S5230|GT-S5233|GT-S5250|GT-S5253|GT-S5260|GT-S5263|GT-S5270|GT-S5300|GT-S5330|GT-S5350|GT-S5360|GT-S5363|GT-S5369|GT-S5380|GT-S5380D|GT-S5560|GT-S5570|GT-S5600|GT-S5603|GT-S5610|GT-S5620|GT-S5660|GT-S5670|GT-S5690|GT-S5750|GT-S5780|GT-S5830|GT-S5839|GT-S6102|GT-S6500|GT-S7070|GT-S7200|GT-S7220|GT-S7230|GT-S7233|GT-S7250|GT-S7500|GT-S7530|GT-S7550|GT-S7562|GT-S7710|GT-S8000|GT-S8003|GT-S8500|GT-S8530|GT-S8600|SCH-A310|SCH-A530|SCH-A570|SCH-A610|SCH-A630|SCH-A650|SCH-A790|SCH-A795|SCH-A850|SCH-A870|SCH-A890|SCH-A930|SCH-A950|SCH-A970|SCH-A990|SCH-I100|SCH-I110|SCH-I400|SCH-I405|SCH-I500|SCH-I510|SCH-I515|SCH-I600|SCH-I730|SCH-I760|SCH-I770|SCH-I830|SCH-I910|SCH-I920|SCH-I959|SCH-LC11|SCH-N150|SCH-N300|SCH-R100|SCH-R300|SCH-R351|SCH-R400|SCH-R410|SCH-T300|SCH-U310|SCH-U320|SCH-U350|SCH-U360|SCH-U365|SCH-U370|SCH-U380|SCH-U410|SCH-U430|SCH-U450|SCH-U460|SCH-U470|SCH-U490|SCH-U540|SCH-U550|SCH-U620|SCH-U640|SCH-U650|SCH-U660|SCH-U700|SCH-U740|SCH-U750|SCH-U810|SCH-U820|SCH-U900|SCH-U940|SCH-U960|SCS-26UC|SGH-A107|SGH-A117|SGH-A127|SGH-A137|SGH-A157|SGH-A167|SGH-A177|SGH-A187|SGH-A197|SGH-A227|SGH-A237|SGH-A257|SGH-A437|SGH-A517|SGH-A597|SGH-A637|SGH-A657|SGH-A667|SGH-A687|SGH-A697|SGH-A707|SGH-A717|SGH-A727|SGH-A737|SGH-A747|SGH-A767|SGH-A777|SGH-A797|SGH-A817|SGH-A827|SGH-A837|SGH-A847|SGH-A867|SGH-A877|SGH-A887|SGH-A897|SGH-A927|SGH-B100|SGH-B130|SGH-B200|SGH-B220|SGH-C100|SGH-C110|SGH-C120|SGH-C130|SGH-C140|SGH-C160|SGH-C170|SGH-C180|SGH-C200|SGH-C207|SGH-C210|SGH-C225|SGH-C230|SGH-C417|SGH-C450|SGH-D307|SGH-D347|SGH-D357|SGH-D407|SGH-D415|SGH-D780|SGH-D807|SGH-D980|SGH-E105|SGH-E200|SGH-E315|SGH-E316|SGH-E317|SGH-E335|SGH-E590|SGH-E635|SGH-E715|SGH-E890|SGH-F300|SGH-F480|SGH-I200|SGH-I300|SGH-I320|SGH-I550|SGH-I577|SGH-I600|SGH-I607|SGH-I617|SGH-I627|SGH-I637|SGH-I677|SGH-I700|SGH-I717|SGH-I727|SGH-i747M|SGH-I777|SGH-I780|SGH-I827|SGH-I847|SGH-I857|SGH-I896|SGH-I897|SGH-I900|SGH-I907|SGH-I917|SGH-I927|SGH-I937|SGH-I997|SGH-J150|SGH-J200|SGH-L170|SGH-L700|SGH-M110|SGH-M150|SGH-M200|SGH-N105|SGH-N500|SGH-N600|SGH-N620|SGH-N625|SGH-N700|SGH-N710|SGH-P107|SGH-P207|SGH-P300|SGH-P310|SGH-P520|SGH-P735|SGH-P777|SGH-Q105|SGH-R210|SGH-R220|SGH-R225|SGH-S105|SGH-S307|SGH-T109|SGH-T119|SGH-T139|SGH-T209|SGH-T219|SGH-T229|SGH-T239|SGH-T249|SGH-T259|SGH-T309|SGH-T319|SGH-T329|SGH-T339|SGH-T349|SGH-T359|SGH-T369|SGH-T379|SGH-T409|SGH-T429|SGH-T439|SGH-T459|SGH-T469|SGH-T479|SGH-T499|SGH-T509|SGH-T519|SGH-T539|SGH-T559|SGH-T589|SGH-T609|SGH-T619|SGH-T629|SGH-T639|SGH-T659|SGH-T669|SGH-T679|SGH-T709|SGH-T719|SGH-T729|SGH-T739|SGH-T746|SGH-T749|SGH-T759|SGH-T769|SGH-T809|SGH-T819|SGH-T839|SGH-T919|SGH-T929|SGH-T939|SGH-T959|SGH-T989|SGH-U100|SGH-U200|SGH-U800|SGH-V205|SGH-V206|SGH-X100|SGH-X105|SGH-X120|SGH-X140|SGH-X426|SGH-X427|SGH-X475|SGH-X495|SGH-X497|SGH-X507|SGH-X600|SGH-X610|SGH-X620|SGH-X630|SGH-X700|SGH-X820|SGH-X890|SGH-Z130|SGH-Z150|SGH-Z170|SGH-ZX10|SGH-ZX20|SHW-M110|SPH-A120|SPH-A400|SPH-A420|SPH-A460|SPH-A500|SPH-A560|SPH-A600|SPH-A620|SPH-A660|SPH-A700|SPH-A740|SPH-A760|SPH-A790|SPH-A800|SPH-A820|SPH-A840|SPH-A880|SPH-A900|SPH-A940|SPH-A960|SPH-D600|SPH-D700|SPH-D710|SPH-D720|SPH-I300|SPH-I325|SPH-I330|SPH-I350|SPH-I500|SPH-I600|SPH-I700|SPH-L700|SPH-M100|SPH-M220|SPH-M240|SPH-M300|SPH-M305|SPH-M320|SPH-M330|SPH-M350|SPH-M360|SPH-M370|SPH-M380|SPH-M510|SPH-M540|SPH-M550|SPH-M560|SPH-M570|SPH-M580|SPH-M610|SPH-M620|SPH-M630|SPH-M800|SPH-M810|SPH-M850|SPH-M900|SPH-M910|SPH-M920|SPH-M930|SPH-N100|SPH-N200|SPH-N240|SPH-N300|SPH-N400|SPH-Z400|SWC-E100|SCH-i909|GT-N7100|GT-N7105|SCH-I535|SM-N900A|SGH-I317|SGH-T999L|GT-S5360B|GT-I8262|GT-S6802|GT-S6312|GT-S6310|GT-S5312|GT-S5310|GT-I9105|GT-I8510|GT-S6790N|SM-G7105|SM-N9005|GT-S5301|GT-I9295|GT-I9195|SM-C101|GT-S7392|GT-S7560|GT-B7610|GT-I5510|GT-S7582|GT-S7530E|GT-I8750|SM-G9006V|SM-G9008V|SM-G9009D|SM-G900A|SM-G900D|SM-G900F|SM-G900H|SM-G900I|SM-G900J|SM-G900K|SM-G900L|SM-G900M|SM-G900P|SM-G900R4|SM-G900S|SM-G900T|SM-G900V|SM-G900W8|SHV-E160K|SCH-P709|SCH-P729|SM-T2558|GT-I9205|SM-G9350|SM-J120F|SM-G920F|SM-G920V|SM-G930F|SM-N910C|SM-A310F|GT-I9190|SM-J500FN|SM-G903F|SM-J330F", 
      "LG": "\\bLG\\b;|LG[- ]?(C800|C900|E400|E610|E900|E-900|F160|F180K|F180L|F180S|730|855|L160|LS740|LS840|LS970|LU6200|MS690|MS695|MS770|MS840|MS870|MS910|P500|P700|P705|VM696|AS680|AS695|AX840|C729|E970|GS505|272|C395|E739BK|E960|L55C|L75C|LS696|LS860|P769BK|P350|P500|P509|P870|UN272|US730|VS840|VS950|LN272|LN510|LS670|LS855|LW690|MN270|MN510|P509|P769|P930|UN200|UN270|UN510|UN610|US670|US740|US760|UX265|UX840|VN271|VN530|VS660|VS700|VS740|VS750|VS910|VS920|VS930|VX9200|VX11000|AX840A|LW770|P506|P925|P999|E612|D955|D802|MS323|M257)|LM-G710", 
      "Sony": "SonyST|SonyLT|SonyEricsson|SonyEricssonLT15iv|LT18i|E10i|LT28h|LT26w|SonyEricssonMT27i|C5303|C6902|C6903|C6906|C6943|D2533", 
      "Asus": "Asus.*Galaxy|PadFone.*Mobile", 
      "NokiaLumia": "Lumia [0-9]{3,4}", 
      "Micromax": "Micromax.*\\b(A210|A92|A88|A72|A111|A110Q|A115|A116|A110|A90S|A26|A51|A35|A54|A25|A27|A89|A68|A65|A57|A90)\\b", 
      "Palm": "PalmSource|Palm", 
      "Vertu": "Vertu|Vertu.*Ltd|Vertu.*Ascent|Vertu.*Ayxta|Vertu.*Constellation(F|Quest)?|Vertu.*Monika|Vertu.*Signature", 
      "Pantech": "PANTECH|IM-A850S|IM-A840S|IM-A830L|IM-A830K|IM-A830S|IM-A820L|IM-A810K|IM-A810S|IM-A800S|IM-T100K|IM-A725L|IM-A780L|IM-A775C|IM-A770K|IM-A760S|IM-A750K|IM-A740S|IM-A730S|IM-A720L|IM-A710K|IM-A690L|IM-A690S|IM-A650S|IM-A630K|IM-A600S|VEGA PTL21|PT003|P8010|ADR910L|P6030|P6020|P9070|P4100|P9060|P5000|CDM8992|TXT8045|ADR8995|IS11PT|P2030|P6010|P8000|PT002|IS06|CDM8999|P9050|PT001|TXT8040|P2020|P9020|P2000|P7040|P7000|C790", 
      "Fly": "IQ230|IQ444|IQ450|IQ440|IQ442|IQ441|IQ245|IQ256|IQ236|IQ255|IQ235|IQ245|IQ275|IQ240|IQ285|IQ280|IQ270|IQ260|IQ250", 
      "Wiko": "KITE 4G|HIGHWAY|GETAWAY|STAIRWAY|DARKSIDE|DARKFULL|DARKNIGHT|DARKMOON|SLIDE|WAX 4G|RAINBOW|BLOOM|SUNSET|GOA(?!nna)|LENNY|BARRY|IGGY|OZZY|CINK FIVE|CINK PEAX|CINK PEAX 2|CINK SLIM|CINK SLIM 2|CINK +|CINK KING|CINK PEAX|CINK SLIM|SUBLIM", 
      "iMobile": "i-mobile (IQ|i-STYLE|idea|ZAA|Hitz)", 
      "SimValley": "\\b(SP-80|XT-930|SX-340|XT-930|SX-310|SP-360|SP60|SPT-800|SP-120|SPT-800|SP-140|SPX-5|SPX-8|SP-100|SPX-8|SPX-12)\\b", 
      "Wolfgang": "AT-B24D|AT-AS50HD|AT-AS40W|AT-AS55HD|AT-AS45q2|AT-B26D|AT-AS50Q", 
      "Alcatel": "Alcatel", 
      "Nintendo": "Nintendo (3DS|Switch)", 
      "Amoi": "Amoi", 
      "INQ": "INQ", 
      "OnePlus": "ONEPLUS", 
      "GenericPhone": "Tapatalk|PDA;|SAGEM|\\bmmp\\b|pocket|\\bpsp\\b|symbian|Smartphone|smartfon|treo|up.browser|up.link|vodafone|\\bwap\\b|nokia|Series40|Series60|S60|SonyEricsson|N900|MAUI.*WAP.*Browser"}, 
     "tablets": {"iPad": "iPad|iPad.*Mobile", 
      "NexusTablet": "Android.*Nexus[\\s]+(7|9|10)", 
      "GoogleTablet": "Android.*Pixel C", 
      "SamsungTablet": "SAMSUNG.*Tablet|Galaxy.*Tab|SC-01C|GT-P1000|GT-P1003|GT-P1010|GT-P3105|GT-P6210|GT-P6800|GT-P6810|GT-P7100|GT-P7300|GT-P7310|GT-P7500|GT-P7510|SCH-I800|SCH-I815|SCH-I905|SGH-I957|SGH-I987|SGH-T849|SGH-T859|SGH-T869|SPH-P100|GT-P3100|GT-P3108|GT-P3110|GT-P5100|GT-P5110|GT-P6200|GT-P7320|GT-P7511|GT-N8000|GT-P8510|SGH-I497|SPH-P500|SGH-T779|SCH-I705|SCH-I915|GT-N8013|GT-P3113|GT-P5113|GT-P8110|GT-N8010|GT-N8005|GT-N8020|GT-P1013|GT-P6201|GT-P7501|GT-N5100|GT-N5105|GT-N5110|SHV-E140K|SHV-E140L|SHV-E140S|SHV-E150S|SHV-E230K|SHV-E230L|SHV-E230S|SHW-M180K|SHW-M180L|SHW-M180S|SHW-M180W|SHW-M300W|SHW-M305W|SHW-M380K|SHW-M380S|SHW-M380W|SHW-M430W|SHW-M480K|SHW-M480S|SHW-M480W|SHW-M485W|SHW-M486W|SHW-M500W|GT-I9228|SCH-P739|SCH-I925|GT-I9200|GT-P5200|GT-P5210|GT-P5210X|SM-T311|SM-T310|SM-T310X|SM-T210|SM-T210R|SM-T211|SM-P600|SM-P601|SM-P605|SM-P900|SM-P901|SM-T217|SM-T217A|SM-T217S|SM-P6000|SM-T3100|SGH-I467|XE500|SM-T110|GT-P5220|GT-I9200X|GT-N5110X|GT-N5120|SM-P905|SM-T111|SM-T2105|SM-T315|SM-T320|SM-T320X|SM-T321|SM-T520|SM-T525|SM-T530NU|SM-T230NU|SM-T330NU|SM-T900|XE500T1C|SM-P605V|SM-P905V|SM-T337V|SM-T537V|SM-T707V|SM-T807V|SM-P600X|SM-P900X|SM-T210X|SM-T230|SM-T230X|SM-T325|GT-P7503|SM-T531|SM-T330|SM-T530|SM-T705|SM-T705C|SM-T535|SM-T331|SM-T800|SM-T700|SM-T537|SM-T807|SM-P907A|SM-T337A|SM-T537A|SM-T707A|SM-T807A|SM-T237|SM-T807P|SM-P607T|SM-T217T|SM-T337T|SM-T807T|SM-T116NQ|SM-T116BU|SM-P550|SM-T350|SM-T550|SM-T9000|SM-P9000|SM-T705Y|SM-T805|GT-P3113|SM-T710|SM-T810|SM-T815|SM-T360|SM-T533|SM-T113|SM-T335|SM-T715|SM-T560|SM-T670|SM-T677|SM-T377|SM-T567|SM-T357T|SM-T555|SM-T561|SM-T713|SM-T719|SM-T813|SM-T819|SM-T580|SM-T355Y?|SM-T280|SM-T817A|SM-T820|SM-W700|SM-P580|SM-T587|SM-P350|SM-P555M|SM-P355M|SM-T113NU|SM-T815Y|SM-T585|SM-T285|SM-T825|SM-W708|SM-T835|SM-T830|SM-T837V|SM-T720|SM-T510|SM-T387V", 
      "Kindle": "Kindle|Silk.*Accelerated|Android.*\\b(KFOT|KFTT|KFJWI|KFJWA|KFOTE|KFSOWI|KFTHWI|KFTHWA|KFAPWI|KFAPWA|WFJWAE|KFSAWA|KFSAWI|KFASWI|KFARWI|KFFOWI|KFGIWI|KFMEWI)\\b|Android.*Silk\/[0-9.]+ like Chrome\/[0-9.]+ (?!Mobile)", 
      "SurfaceTablet": "Windows NT [0-9.]+; ARM;.*(Tablet|ARMBJS)", 
      "HPTablet": "HP Slate (7|8|10)|HP ElitePad 900|hp-tablet|EliteBook.*Touch|HP 8|Slate 21|HP SlateBook 10", 
      "AsusTablet": "^.*PadFone((?!Mobile).)*$|Transformer|TF101|TF101G|TF300T|TF300TG|TF300TL|TF700T|TF700KL|TF701T|TF810C|ME171|ME301T|ME302C|ME371MG|ME370T|ME372MG|ME172V|ME173X|ME400C|Slider SL101|\\bK00F\\b|\\bK00C\\b|\\bK00E\\b|\\bK00L\\b|TX201LA|ME176C|ME102A|\\bM80TA\\b|ME372CL|ME560CG|ME372CG|ME302KL| K010 | K011 | K017 | K01E |ME572C|ME103K|ME170C|ME171C|\\bME70C\\b|ME581C|ME581CL|ME8510C|ME181C|P01Y|PO1MA|P01Z|\\bP027\\b|\\bP024\\b|\\bP00C\\b", 
      "BlackBerryTablet": "PlayBook|RIM Tablet", 
      "HTCtablet": "HTC_Flyer_P512|HTC Flyer|HTC Jetstream|HTC-P715a|HTC EVO View 4G|PG41200|PG09410", 
      "MotorolaTablet": "xoom|sholest|MZ615|MZ605|MZ505|MZ601|MZ602|MZ603|MZ604|MZ606|MZ607|MZ608|MZ609|MZ615|MZ616|MZ617", 
      "NookTablet": "Android.*Nook|NookColor|nook browser|BNRV200|BNRV200A|BNTV250|BNTV250A|BNTV400|BNTV600|LogicPD Zoom2", 
      "AcerTablet": "Android.*; \\b(A100|A101|A110|A200|A210|A211|A500|A501|A510|A511|A700|A701|W500|W500P|W501|W501P|W510|W511|W700|G100|G100W|B1-A71|B1-710|B1-711|A1-810|A1-811|A1-830)\\b|W3-810|\\bA3-A10\\b|\\bA3-A11\\b|\\bA3-A20\\b|\\bA3-A30", 
      "ToshibaTablet": "Android.*(AT100|AT105|AT200|AT205|AT270|AT275|AT300|AT305|AT1S5|AT500|AT570|AT700|AT830)|TOSHIBA.*FOLIO", 
      "LGTablet": "\\bL-06C|LG-V909|LG-V900|LG-V700|LG-V510|LG-V500|LG-V410|LG-V400|LG-VK810\\b", 
      "FujitsuTablet": "Android.*\\b(F-01D|F-02F|F-05E|F-10D|M532|Q572)\\b", 
      "PrestigioTablet": "PMP3170B|PMP3270B|PMP3470B|PMP7170B|PMP3370B|PMP3570C|PMP5870C|PMP3670B|PMP5570C|PMP5770D|PMP3970B|PMP3870C|PMP5580C|PMP5880D|PMP5780D|PMP5588C|PMP7280C|PMP7280C3G|PMP7280|PMP7880D|PMP5597D|PMP5597|PMP7100D|PER3464|PER3274|PER3574|PER3884|PER5274|PER5474|PMP5097CPRO|PMP5097|PMP7380D|PMP5297C|PMP5297C_QUAD|PMP812E|PMP812E3G|PMP812F|PMP810E|PMP880TD|PMT3017|PMT3037|PMT3047|PMT3057|PMT7008|PMT5887|PMT5001|PMT5002", 
      "LenovoTablet": "Lenovo TAB|Idea(Tab|Pad)( A1|A10| K1|)|ThinkPad([ ]+)?Tablet|YT3-850M|YT3-X90L|YT3-X90F|YT3-X90X|Lenovo.*(S2109|S2110|S5000|S6000|K3011|A3000|A3500|A1000|A2107|A2109|A1107|A5500|A7600|B6000|B8000|B8080)(-|)(FL|F|HV|H|)|TB-X103F|TB-X304X|TB-X304F|TB-X304L|TB-X505F|TB-X505L|TB-X505X|TB-X605F|TB-X605L|TB-8703F|TB-8703X|TB-8703N|TB-8704N|TB-8704F|TB-8704X|TB-8704V|TB-7304F|TB-7304I|TB-7304X|Tab2A7-10F|Tab2A7-20F|TB2-X30L|YT3-X50L|YT3-X50F|YT3-X50M|YT-X705F|YT-X703F|YT-X703L|YT-X705L|YT-X705X|TB2-X30F|TB2-X30L|TB2-X30M|A2107A-F|A2107A-H|TB3-730F|TB3-730M|TB3-730X|TB-7504F|TB-7504X", 
      "DellTablet": "Venue 11|Venue 8|Venue 7|Dell Streak 10|Dell Streak 7", 
      "YarvikTablet": "Android.*\\b(TAB210|TAB211|TAB224|TAB250|TAB260|TAB264|TAB310|TAB360|TAB364|TAB410|TAB411|TAB420|TAB424|TAB450|TAB460|TAB461|TAB464|TAB465|TAB467|TAB468|TAB07-100|TAB07-101|TAB07-150|TAB07-151|TAB07-152|TAB07-200|TAB07-201-3G|TAB07-210|TAB07-211|TAB07-212|TAB07-214|TAB07-220|TAB07-400|TAB07-485|TAB08-150|TAB08-200|TAB08-201-3G|TAB08-201-30|TAB09-100|TAB09-211|TAB09-410|TAB10-150|TAB10-201|TAB10-211|TAB10-400|TAB10-410|TAB13-201|TAB274EUK|TAB275EUK|TAB374EUK|TAB462EUK|TAB474EUK|TAB9-200)\\b", 
      "MedionTablet": "Android.*\\bOYO\\b|LIFE.*(P9212|P9514|P9516|S9512)|LIFETAB", 
      "ArnovaTablet": "97G4|AN10G2|AN7bG3|AN7fG3|AN8G3|AN8cG3|AN7G3|AN9G3|AN7dG3|AN7dG3ST|AN7dG3ChildPad|AN10bG3|AN10bG3DT|AN9G2", 
      "IntensoTablet": "INM8002KP|INM1010FP|INM805ND|Intenso Tab|TAB1004", 
      "IRUTablet": "M702pro", 
      "MegafonTablet": "MegaFon V9|\\bZTE V9\\b|Android.*\\bMT7A\\b", 
      "EbodaTablet": "E-Boda (Supreme|Impresspeed|Izzycomm|Essential)", 
      "AllViewTablet": "Allview.*(Viva|Alldro|City|Speed|All TV|Frenzy|Quasar|Shine|TX1|AX1|AX2)", 
      "ArchosTablet": "\\b(101G9|80G9|A101IT)\\b|Qilive 97R|Archos5|\\bARCHOS (70|79|80|90|97|101|FAMILYPAD|)(b|c|)(G10| Cobalt| TITANIUM(HD|)| Xenon| Neon|XSK| 2| XS 2| PLATINUM| CARBON|GAMEPAD)\\b", 
      "AinolTablet": "NOVO7|NOVO8|NOVO10|Novo7Aurora|Novo7Basic|NOVO7PALADIN|novo9-Spark", 
      "NokiaLumiaTablet": "Lumia 2520", 
      "SonyTablet": "Sony.*Tablet|Xperia Tablet|Sony Tablet S|SO-03E|SGPT12|SGPT13|SGPT114|SGPT121|SGPT122|SGPT123|SGPT111|SGPT112|SGPT113|SGPT131|SGPT132|SGPT133|SGPT211|SGPT212|SGPT213|SGP311|SGP312|SGP321|EBRD1101|EBRD1102|EBRD1201|SGP351|SGP341|SGP511|SGP512|SGP521|SGP541|SGP551|SGP621|SGP641|SGP612|SOT31|SGP771|SGP611|SGP612|SGP712", 
      "PhilipsTablet": "\\b(PI2010|PI3000|PI3100|PI3105|PI3110|PI3205|PI3210|PI3900|PI4010|PI7000|PI7100)\\b", 
      "CubeTablet": "Android.*(K8GT|U9GT|U10GT|U16GT|U17GT|U18GT|U19GT|U20GT|U23GT|U30GT)|CUBE U8GT", 
      "CobyTablet": "MID1042|MID1045|MID1125|MID1126|MID7012|MID7014|MID7015|MID7034|MID7035|MID7036|MID7042|MID7048|MID7127|MID8042|MID8048|MID8127|MID9042|MID9740|MID9742|MID7022|MID7010", 
      "MIDTablet": "M9701|M9000|M9100|M806|M1052|M806|T703|MID701|MID713|MID710|MID727|MID760|MID830|MID728|MID933|MID125|MID810|MID732|MID120|MID930|MID800|MID731|MID900|MID100|MID820|MID735|MID980|MID130|MID833|MID737|MID960|MID135|MID860|MID736|MID140|MID930|MID835|MID733|MID4X10", 
      "MSITablet": "MSI \\b(Primo 73K|Primo 73L|Primo 81L|Primo 77|Primo 93|Primo 75|Primo 76|Primo 73|Primo 81|Primo 91|Primo 90|Enjoy 71|Enjoy 7|Enjoy 10)\\b", 
      "SMiTTablet": "Android.*(\\bMID\\b|MID-560|MTV-T1200|MTV-PND531|MTV-P1101|MTV-PND530)", 
      "RockChipTablet": "Android.*(RK2818|RK2808A|RK2918|RK3066)|RK2738|RK2808A", 
      "FlyTablet": "IQ310|Fly Vision", 
      "bqTablet": "Android.*(bq)?.*\\b(Elcano|Curie|Edison|Maxwell|Kepler|Pascal|Tesla|Hypatia|Platon|Newton|Livingstone|Cervantes|Avant|Aquaris ([E|M]10|M8))\\b|Maxwell.*Lite|Maxwell.*Plus", 
      "HuaweiTablet": "MediaPad|MediaPad 7 Youth|IDEOS S7|S7-201c|S7-202u|S7-101|S7-103|S7-104|S7-105|S7-106|S7-201|S7-Slim|M2-A01L|BAH-L09|BAH-W09|AGS-L09|CMR-AL19", 
      "NecTablet": "\\bN-06D|\\bN-08D", 
      "PantechTablet": "Pantech.*P4100", 
      "BronchoTablet": "Broncho.*(N701|N708|N802|a710)", 
      "VersusTablet": "TOUCHPAD.*[78910]|\\bTOUCHTAB\\b", 
      "ZyncTablet": "z1000|Z99 2G|z930|z990|z909|Z919|z900", 
      "PositivoTablet": "TB07STA|TB10STA|TB07FTA|TB10FTA", 
      "NabiTablet": "Android.*\\bNabi", 
      "KoboTablet": "Kobo Touch|\\bK080\\b|\\bVox\\b Build|\\bArc\\b Build", 
      "DanewTablet": "DSlide.*\\b(700|701R|702|703R|704|802|970|971|972|973|974|1010|1012)\\b", 
      "TexetTablet": "NaviPad|TB-772A|TM-7045|TM-7055|TM-9750|TM-7016|TM-7024|TM-7026|TM-7041|TM-7043|TM-7047|TM-8041|TM-9741|TM-9747|TM-9748|TM-9751|TM-7022|TM-7021|TM-7020|TM-7011|TM-7010|TM-7023|TM-7025|TM-7037W|TM-7038W|TM-7027W|TM-9720|TM-9725|TM-9737W|TM-1020|TM-9738W|TM-9740|TM-9743W|TB-807A|TB-771A|TB-727A|TB-725A|TB-719A|TB-823A|TB-805A|TB-723A|TB-715A|TB-707A|TB-705A|TB-709A|TB-711A|TB-890HD|TB-880HD|TB-790HD|TB-780HD|TB-770HD|TB-721HD|TB-710HD|TB-434HD|TB-860HD|TB-840HD|TB-760HD|TB-750HD|TB-740HD|TB-730HD|TB-722HD|TB-720HD|TB-700HD|TB-500HD|TB-470HD|TB-431HD|TB-430HD|TB-506|TB-504|TB-446|TB-436|TB-416|TB-146SE|TB-126SE", 
      "PlaystationTablet": "Playstation.*(Portable|Vita)", 
      "TrekstorTablet": "ST10416-1|VT10416-1|ST70408-1|ST702xx-1|ST702xx-2|ST80208|ST97216|ST70104-2|VT10416-2|ST10216-2A|SurfTab", 
      "PyleAudioTablet": "\\b(PTBL10CEU|PTBL10C|PTBL72BC|PTBL72BCEU|PTBL7CEU|PTBL7C|PTBL92BC|PTBL92BCEU|PTBL9CEU|PTBL9CUK|PTBL9C)\\b", 
      "AdvanTablet": "Android.* \\b(E3A|T3X|T5C|T5B|T3E|T3C|T3B|T1J|T1F|T2A|T1H|T1i|E1C|T1-E|T5-A|T4|E1-B|T2Ci|T1-B|T1-D|O1-A|E1-A|T1-A|T3A|T4i)\\b ", 
      "DanyTechTablet": "Genius Tab G3|Genius Tab S2|Genius Tab Q3|Genius Tab G4|Genius Tab Q4|Genius Tab G-II|Genius TAB GII|Genius TAB GIII|Genius Tab S1", 
      "GalapadTablet": "Android.*\\bG1\\b(?!\\))", 
      "MicromaxTablet": "Funbook|Micromax.*\\b(P250|P560|P360|P362|P600|P300|P350|P500|P275)\\b", 
      "KarbonnTablet": "Android.*\\b(A39|A37|A34|ST8|ST10|ST7|Smart Tab3|Smart Tab2)\\b", 
      "AllFineTablet": "Fine7 Genius|Fine7 Shine|Fine7 Air|Fine8 Style|Fine9 More|Fine10 Joy|Fine11 Wide", 
      "PROSCANTablet": "\\b(PEM63|PLT1023G|PLT1041|PLT1044|PLT1044G|PLT1091|PLT4311|PLT4311PL|PLT4315|PLT7030|PLT7033|PLT7033D|PLT7035|PLT7035D|PLT7044K|PLT7045K|PLT7045KB|PLT7071KG|PLT7072|PLT7223G|PLT7225G|PLT7777G|PLT7810K|PLT7849G|PLT7851G|PLT7852G|PLT8015|PLT8031|PLT8034|PLT8036|PLT8080K|PLT8082|PLT8088|PLT8223G|PLT8234G|PLT8235G|PLT8816K|PLT9011|PLT9045K|PLT9233G|PLT9735|PLT9760G|PLT9770G)\\b", 
      "YONESTablet": "BQ1078|BC1003|BC1077|RK9702|BC9730|BC9001|IT9001|BC7008|BC7010|BC708|BC728|BC7012|BC7030|BC7027|BC7026", 
      "ChangJiaTablet": "TPC7102|TPC7103|TPC7105|TPC7106|TPC7107|TPC7201|TPC7203|TPC7205|TPC7210|TPC7708|TPC7709|TPC7712|TPC7110|TPC8101|TPC8103|TPC8105|TPC8106|TPC8203|TPC8205|TPC8503|TPC9106|TPC9701|TPC97101|TPC97103|TPC97105|TPC97106|TPC97111|TPC97113|TPC97203|TPC97603|TPC97809|TPC97205|TPC10101|TPC10103|TPC10106|TPC10111|TPC10203|TPC10205|TPC10503", 
      "GUTablet": "TX-A1301|TX-M9002|Q702|kf026", 
      "PointOfViewTablet": "TAB-P506|TAB-navi-7-3G-M|TAB-P517|TAB-P-527|TAB-P701|TAB-P703|TAB-P721|TAB-P731N|TAB-P741|TAB-P825|TAB-P905|TAB-P925|TAB-PR945|TAB-PL1015|TAB-P1025|TAB-PI1045|TAB-P1325|TAB-PROTAB[0-9]+|TAB-PROTAB25|TAB-PROTAB26|TAB-PROTAB27|TAB-PROTAB26XL|TAB-PROTAB2-IPS9|TAB-PROTAB30-IPS9|TAB-PROTAB25XXL|TAB-PROTAB26-IPS10|TAB-PROTAB30-IPS10", 
      "OvermaxTablet": "OV-(SteelCore|NewBase|Basecore|Baseone|Exellen|Quattor|EduTab|Solution|ACTION|BasicTab|TeddyTab|MagicTab|Stream|TB-08|TB-09)|Qualcore 1027", 
      "HCLTablet": "HCL.*Tablet|Connect-3G-2.0|Connect-2G-2.0|ME Tablet U1|ME Tablet U2|ME Tablet G1|ME Tablet X1|ME Tablet Y2|ME Tablet Sync", 
      "DPSTablet": "DPS Dream 9|DPS Dual 7", 
      "VistureTablet": "V97 HD|i75 3G|Visture V4( HD)?|Visture V5( HD)?|Visture V10", 
      "CrestaTablet": "CTP(-)?810|CTP(-)?818|CTP(-)?828|CTP(-)?838|CTP(-)?888|CTP(-)?978|CTP(-)?980|CTP(-)?987|CTP(-)?988|CTP(-)?989", 
      "MediatekTablet": "\\bMT8125|MT8389|MT8135|MT8377\\b", 
      "ConcordeTablet": "Concorde([ ]+)?Tab|ConCorde ReadMan", 
      "GoCleverTablet": "GOCLEVER TAB|A7GOCLEVER|M1042|M7841|M742|R1042BK|R1041|TAB A975|TAB A7842|TAB A741|TAB A741L|TAB M723G|TAB M721|TAB A1021|TAB I921|TAB R721|TAB I720|TAB T76|TAB R70|TAB R76.2|TAB R106|TAB R83.2|TAB M813G|TAB I721|GCTA722|TAB I70|TAB I71|TAB S73|TAB R73|TAB R74|TAB R93|TAB R75|TAB R76.1|TAB A73|TAB A93|TAB A93.2|TAB T72|TAB R83|TAB R974|TAB R973|TAB A101|TAB A103|TAB A104|TAB A104.2|R105BK|M713G|A972BK|TAB A971|TAB R974.2|TAB R104|TAB R83.3|TAB A1042", 
      "ModecomTablet": "FreeTAB 9000|FreeTAB 7.4|FreeTAB 7004|FreeTAB 7800|FreeTAB 2096|FreeTAB 7.5|FreeTAB 1014|FreeTAB 1001 |FreeTAB 8001|FreeTAB 9706|FreeTAB 9702|FreeTAB 7003|FreeTAB 7002|FreeTAB 1002|FreeTAB 7801|FreeTAB 1331|FreeTAB 1004|FreeTAB 8002|FreeTAB 8014|FreeTAB 9704|FreeTAB 1003", 
      "VoninoTablet": "\\b(Argus[ _]?S|Diamond[ _]?79HD|Emerald[ _]?78E|Luna[ _]?70C|Onyx[ _]?S|Onyx[ _]?Z|Orin[ _]?HD|Orin[ _]?S|Otis[ _]?S|SpeedStar[ _]?S|Magnet[ _]?M9|Primus[ _]?94[ _]?3G|Primus[ _]?94HD|Primus[ _]?QS|Android.*\\bQ8\\b|Sirius[ _]?EVO[ _]?QS|Sirius[ _]?QS|Spirit[ _]?S)\\b", 
      "ECSTablet": "V07OT2|TM105A|S10OT1|TR10CS1", 
      "StorexTablet": "eZee[_']?(Tab|Go)[0-9]+|TabLC7|Looney Tunes Tab", 
      "VodafoneTablet": "SmartTab([ ]+)?[0-9]+|SmartTabII10|SmartTabII7|VF-1497|VFD 1400", 
      "EssentielBTablet": "Smart[ ']?TAB[ ]+?[0-9]+|Family[ ']?TAB2", 
      "RossMoorTablet": "RM-790|RM-997|RMD-878G|RMD-974R|RMT-705A|RMT-701|RME-601|RMT-501|RMT-711", 
      "iMobileTablet": "i-mobile i-note", 
      "TolinoTablet": "tolino tab [0-9.]+|tolino shine", 
      "AudioSonicTablet": "\\bC-22Q|T7-QC|T-17B|T-17P\\b", 
      "AMPETablet": "Android.* A78 ", 
      "SkkTablet": "Android.* (SKYPAD|PHOENIX|CYCLOPS)", 
      "TecnoTablet": "TECNO P9|TECNO DP8D", 
      "JXDTablet": "Android.* \\b(F3000|A3300|JXD5000|JXD3000|JXD2000|JXD300B|JXD300|S5800|S7800|S602b|S5110b|S7300|S5300|S602|S603|S5100|S5110|S601|S7100a|P3000F|P3000s|P101|P200s|P1000m|P200m|P9100|P1000s|S6600b|S908|P1000|P300|S18|S6600|S9100)\\b", 
      "iJoyTablet": "Tablet (Spirit 7|Essentia|Galatea|Fusion|Onix 7|Landa|Titan|Scooby|Deox|Stella|Themis|Argon|Unique 7|Sygnus|Hexen|Finity 7|Cream|Cream X2|Jade|Neon 7|Neron 7|Kandy|Scape|Saphyr 7|Rebel|Biox|Rebel|Rebel 8GB|Myst|Draco 7|Myst|Tab7-004|Myst|Tadeo Jones|Tablet Boing|Arrow|Draco Dual Cam|Aurix|Mint|Amity|Revolution|Finity 9|Neon 9|T9w|Amity 4GB Dual Cam|Stone 4GB|Stone 8GB|Andromeda|Silken|X2|Andromeda II|Halley|Flame|Saphyr 9,7|Touch 8|Planet|Triton|Unique 10|Hexen 10|Memphis 4GB|Memphis 8GB|Onix 10)", 
      "FX2Tablet": "FX2 PAD7|FX2 PAD10", 
      "XoroTablet": "KidsPAD 701|PAD[ ]?712|PAD[ ]?714|PAD[ ]?716|PAD[ ]?717|PAD[ ]?718|PAD[ ]?720|PAD[ ]?721|PAD[ ]?722|PAD[ ]?790|PAD[ ]?792|PAD[ ]?900|PAD[ ]?9715D|PAD[ ]?9716DR|PAD[ ]?9718DR|PAD[ ]?9719QR|PAD[ ]?9720QR|TelePAD1030|Telepad1032|TelePAD730|TelePAD731|TelePAD732|TelePAD735Q|TelePAD830|TelePAD9730|TelePAD795|MegaPAD 1331|MegaPAD 1851|MegaPAD 2151", 
      "ViewsonicTablet": "ViewPad 10pi|ViewPad 10e|ViewPad 10s|ViewPad E72|ViewPad7|ViewPad E100|ViewPad 7e|ViewSonic VB733|VB100a", 
      "VerizonTablet": "QTAQZ3|QTAIR7|QTAQTZ3|QTASUN1|QTASUN2|QTAXIA1", 
      "OdysTablet": "LOOX|XENO10|ODYS[ -](Space|EVO|Xpress|NOON)|\\bXELIO\\b|Xelio10Pro|XELIO7PHONETAB|XELIO10EXTREME|XELIOPT2|NEO_QUAD10", 
      "CaptivaTablet": "CAPTIVA PAD", 
      "IconbitTablet": "NetTAB|NT-3702|NT-3702S|NT-3702S|NT-3603P|NT-3603P|NT-0704S|NT-0704S|NT-3805C|NT-3805C|NT-0806C|NT-0806C|NT-0909T|NT-0909T|NT-0907S|NT-0907S|NT-0902S|NT-0902S", 
      "TeclastTablet": "T98 4G|\\bP80\\b|\\bX90HD\\b|X98 Air|X98 Air 3G|\\bX89\\b|P80 3G|\\bX80h\\b|P98 Air|\\bX89HD\\b|P98 3G|\\bP90HD\\b|P89 3G|X98 3G|\\bP70h\\b|P79HD 3G|G18d 3G|\\bP79HD\\b|\\bP89s\\b|\\bA88\\b|\\bP10HD\\b|\\bP19HD\\b|G18 3G|\\bP78HD\\b|\\bA78\\b|\\bP75\\b|G17s 3G|G17h 3G|\\bP85t\\b|\\bP90\\b|\\bP11\\b|\\bP98t\\b|\\bP98HD\\b|\\bG18d\\b|\\bP85s\\b|\\bP11HD\\b|\\bP88s\\b|\\bA80HD\\b|\\bA80se\\b|\\bA10h\\b|\\bP89\\b|\\bP78s\\b|\\bG18\\b|\\bP85\\b|\\bA70h\\b|\\bA70\\b|\\bG17\\b|\\bP18\\b|\\bA80s\\b|\\bA11s\\b|\\bP88HD\\b|\\bA80h\\b|\\bP76s\\b|\\bP76h\\b|\\bP98\\b|\\bA10HD\\b|\\bP78\\b|\\bP88\\b|\\bA11\\b|\\bA10t\\b|\\bP76a\\b|\\bP76t\\b|\\bP76e\\b|\\bP85HD\\b|\\bP85a\\b|\\bP86\\b|\\bP75HD\\b|\\bP76v\\b|\\bA12\\b|\\bP75a\\b|\\bA15\\b|\\bP76Ti\\b|\\bP81HD\\b|\\bA10\\b|\\bT760VE\\b|\\bT720HD\\b|\\bP76\\b|\\bP73\\b|\\bP71\\b|\\bP72\\b|\\bT720SE\\b|\\bC520Ti\\b|\\bT760\\b|\\bT720VE\\b|T720-3GE|T720-WiFi", 
      "OndaTablet": "\\b(V975i|Vi30|VX530|V701|Vi60|V701s|Vi50|V801s|V719|Vx610w|VX610W|V819i|Vi10|VX580W|Vi10|V711s|V813|V811|V820w|V820|Vi20|V711|VI30W|V712|V891w|V972|V819w|V820w|Vi60|V820w|V711|V813s|V801|V819|V975s|V801|V819|V819|V818|V811|V712|V975m|V101w|V961w|V812|V818|V971|V971s|V919|V989|V116w|V102w|V973|Vi40)\\b[\\s]+|V10 \\b4G\\b", 
      "JaytechTablet": "TPC-PA762", 
      "BlaupunktTablet": "Endeavour 800NG|Endeavour 1010", 
      "DigmaTablet": "\\b(iDx10|iDx9|iDx8|iDx7|iDxD7|iDxD8|iDsQ8|iDsQ7|iDsQ8|iDsD10|iDnD7|3TS804H|iDsQ11|iDj7|iDs10)\\b", 
      "EvolioTablet": "ARIA_Mini_wifi|Aria[ _]Mini|Evolio X10|Evolio X7|Evolio X8|\\bEvotab\\b|\\bNeura\\b", 
      "LavaTablet": "QPAD E704|\\bIvoryS\\b|E-TAB IVORY|\\bE-TAB\\b", 
      "AocTablet": "MW0811|MW0812|MW0922|MTK8382|MW1031|MW0831|MW0821|MW0931|MW0712", 
      "MpmanTablet": "MP11 OCTA|MP10 OCTA|MPQC1114|MPQC1004|MPQC994|MPQC974|MPQC973|MPQC804|MPQC784|MPQC780|\\bMPG7\\b|MPDCG75|MPDCG71|MPDC1006|MP101DC|MPDC9000|MPDC905|MPDC706HD|MPDC706|MPDC705|MPDC110|MPDC100|MPDC99|MPDC97|MPDC88|MPDC8|MPDC77|MP709|MID701|MID711|MID170|MPDC703|MPQC1010", 
      "CelkonTablet": "CT695|CT888|CT[\\s]?910|CT7 Tab|CT9 Tab|CT3 Tab|CT2 Tab|CT1 Tab|C820|C720|\\bCT-1\\b", 
      "WolderTablet": "miTab \\b(DIAMOND|SPACE|BROOKLYN|NEO|FLY|MANHATTAN|FUNK|EVOLUTION|SKY|GOCAR|IRON|GENIUS|POP|MINT|EPSILON|BROADWAY|JUMP|HOP|LEGEND|NEW AGE|LINE|ADVANCE|FEEL|FOLLOW|LIKE|LINK|LIVE|THINK|FREEDOM|CHICAGO|CLEVELAND|BALTIMORE-GH|IOWA|BOSTON|SEATTLE|PHOENIX|DALLAS|IN 101|MasterChef)\\b", 
      "MediacomTablet": "M-MPI10C3G|M-SP10EG|M-SP10EGP|M-SP10HXAH|M-SP7HXAH|M-SP10HXBH|M-SP8HXAH|M-SP8MXA", 
      "MiTablet": "\\bMI PAD\\b|\\bHM NOTE 1W\\b", 
      "NibiruTablet": "Nibiru M1|Nibiru Jupiter One", 
      "NexoTablet": "NEXO NOVA|NEXO 10|NEXO AVIO|NEXO FREE|NEXO GO|NEXO EVO|NEXO 3G|NEXO SMART|NEXO KIDDO|NEXO MOBI", 
      "LeaderTablet": "TBLT10Q|TBLT10I|TBL-10WDKB|TBL-10WDKBO2013|TBL-W230V2|TBL-W450|TBL-W500|SV572|TBLT7I|TBA-AC7-8G|TBLT79|TBL-8W16|TBL-10W32|TBL-10WKB|TBL-W100", 
      "UbislateTablet": "UbiSlate[\\s]?7C", 
      "PocketBookTablet": "Pocketbook", 
      "KocasoTablet": "\\b(TB-1207)\\b", 
      "HisenseTablet": "\\b(F5281|E2371)\\b", 
      "Hudl": "Hudl HT7S3|Hudl 2", 
      "TelstraTablet": "T-Hub2", 
      "GenericTablet": "Android.*\\b97D\\b|Tablet(?!.*PC)|BNTV250A|MID-WCDMA|LogicPD Zoom2|\\bA7EB\\b|CatNova8|A1_07|CT704|CT1002|\\bM721\\b|rk30sdk|\\bEVOTAB\\b|M758A|ET904|ALUMIUM10|Smartfren Tab|Endeavour 1010|Tablet-PC-4|Tagi Tab|\\bM6pro\\b|CT1020W|arc 10HD|\\bTP750\\b|\\bQTAQZ3\\b|WVT101|TM1088|KT107"}, 
     "oss": {"AndroidOS": "Android", 
      "BlackBerryOS": "blackberry|\\bBB10\\b|rim tablet os", 
      "PalmOS": "PalmOS|avantgo|blazer|elaine|hiptop|palm|plucker|xiino", 
      "SymbianOS": "Symbian|SymbOS|Series60|Series40|SYB-[0-9]+|\\bS60\\b", 
      "WindowsMobileOS": "Windows CE.*(PPC|Smartphone|Mobile|[0-9]{3}x[0-9]{3})|Windows Mobile|Windows Phone [0-9.]+|WCE;", 
      "WindowsPhoneOS": "Windows Phone 10.0|Windows Phone 8.1|Windows Phone 8.0|Windows Phone OS|XBLWP7|ZuneWP7|Windows NT 6.[23]; ARM;", 
      "iOS": "\\biPhone.*Mobile|\\biPod|\\biPad|AppleCoreMedia", 
      "iPadOS": "CPU OS 13", 
      "MeeGoOS": "MeeGo", 
      "MaemoOS": "Maemo", 
      "JavaOS": "J2ME\/|\\bMIDP\\b|\\bCLDC\\b", 
      "webOS": "webOS|hpwOS", 
      "badaOS": "\\bBada\\b", 
      "BREWOS": "BREW"}, 
     "uas": {"Chrome": "\\bCrMo\\b|CriOS|Android.*Chrome\/[.0-9]* (Mobile)?", 
      "Dolfin": "\\bDolfin\\b", 
      "Opera": "Opera.*Mini|Opera.*Mobi|Android.*Opera|Mobile.*OPR\/[0-9.]+$|Coast\/[0-9.]+", 
      "Skyfire": "Skyfire", 
      "Edge": "Mobile Safari\/[.0-9]* Edge", 
      "IE": "IEMobile|MSIEMobile", 
      "Firefox": "fennec|firefox.*maemo|(Mobile|Tablet).*Firefox|Firefox.*Mobile|FxiOS", 
      "Bolt": "bolt", 
      "TeaShark": "teashark", 
      "Blazer": "Blazer", 
      "Safari": "Version.*Mobile.*Safari|Safari.*Mobile|MobileSafari", 
      "WeChat": "\\bMicroMessenger\\b", 
      "UCBrowser": "UC.*Browser|UCWEB", 
      "baiduboxapp": "baiduboxapp", 
      "baidubrowser": "baidubrowser", 
      "DiigoBrowser": "DiigoBrowser", 
      "Mercury": "\\bMercury\\b", 
      "ObigoBrowser": "Obigo", 
      "NetFront": "NF-Browser", 
      "GenericBrowser": "NokiaBrowser|OviBrowser|OneBrowser|TwonkyBeamBrowser|SEMC.*Browser|FlyFlow|Minimo|NetFront|Novarra-Vision|MQQBrowser|MicroMessenger", 
      "PaleMoon": "Android.*PaleMoon|Mobile.*PaleMoon"}, 
     "props": {"Mobile": "Mobile\/[VER]", 
      "Build": "Build\/[VER]", 
      "Version": "Version\/[VER]", 
      "VendorID": "VendorID\/[VER]", 
      "iPad": "iPad.*CPU[a-z ]+[VER]", 
      "iPhone": "iPhone.*CPU[a-z ]+[VER]", 
      "iPod": "iPod.*CPU[a-z ]+[VER]", 
      "Kindle": "Kindle\/[VER]", 
      "Chrome": ["Chrome\/[VER]", "CriOS\/[VER]", "CrMo\/[VER]"], 
      "Coast": ["Coast\/[VER]"], 
      "Dolfin": "Dolfin\/[VER]", 
      "Firefox": ["Firefox\/[VER]", "FxiOS\/[VER]"], 
      "Fennec": "Fennec\/[VER]", 
      "Edge": "Edge\/[VER]", 
      "IE": ["IEMobile\/[VER];", "IEMobile [VER]", "MSIE [VER];", "Trident\/[0-9.]+;.*rv:[VER]"], 
      "NetFront": "NetFront\/[VER]", 
      "NokiaBrowser": "NokiaBrowser\/[VER]", 
      "Opera": [" OPR\/[VER]", "Opera Mini\/[VER]", "Version\/[VER]"], 
      "Opera Mini": "Opera Mini\/[VER]", 
      "Opera Mobi": "Version\/[VER]", 
      "UCBrowser": ["UCWEB[VER]", "UC.*Browser\/[VER]"], 
      "MQQBrowser": "MQQBrowser\/[VER]", 
      "MicroMessenger": "MicroMessenger\/[VER]", 
      "baiduboxapp": "baiduboxapp\/[VER]", 
      "baidubrowser": "baidubrowser\/[VER]", 
      "SamsungBrowser": "SamsungBrowser\/[VER]", 
      "Iron": "Iron\/[VER]", 
      "Safari": ["Version\/[VER]", "Safari\/[VER]"], 
      "Skyfire": "Skyfire\/[VER]", 
      "Tizen": "Tizen\/[VER]", 
      "Webkit": "webkit[ \/][VER]", 
      "PaleMoon": "PaleMoon\/[VER]", 
      "Gecko": "Gecko\/[VER]", 
      "Trident": "Trident\/[VER]", 
      "Presto": "Presto\/[VER]", 
      "Goanna": "Goanna\/[VER]", 
      "iOS": " \\bi?OS\\b [VER][ ;]{1}", 
      "Android": "Android [VER]", 
      "BlackBerry": ["BlackBerry[\\w]+\/[VER]", "BlackBerry.*Version\/[VER]", "Version\/[VER]"], 
      "BREW": "BREW [VER]", 
      "Java": "Java\/[VER]", 
      "Windows Phone OS": ["Windows Phone OS [VER]", "Windows Phone [VER]"], 
      "Windows Phone": "Windows Phone [VER]", 
      "Windows CE": "Windows CE\/[VER]", 
      "Windows NT": "Windows NT [VER]", 
      "Symbian": ["SymbianOS\/[VER]", "Symbian\/[VER]"], 
      "webOS": ["webOS\/[VER]", "hpwOS\/[VER];"]}, 
     "utils": {"Bot": "Googlebot|facebookexternalhit|Google-AMPHTML|s~amp-validator|AdsBot-Google|Google Keyword Suggestion|Facebot|YandexBot|YandexMobileBot|bingbot|ia_archiver|AhrefsBot|Ezooms|GSLFbot|WBSearchBot|Twitterbot|TweetmemeBot|Twikle|PaperLiBot|Wotbox|UnwindFetchor|Exabot|MJ12bot|YandexImages|TurnitinBot|Pingdom|contentkingapp", 
      "MobileBot": "Googlebot-Mobile|AdsBot-Google-Mobile|YahooSeeker\/M1A1-R2D2", 
      "DesktopMode": "WPDesktop", 
      "TV": "SonyDTV|HbbTV", 
      "WebKit": "(webkit)[ \/]([\\w.]+)", 
      "Console": "\\b(Nintendo|Nintendo WiiU|Nintendo 3DS|Nintendo Switch|PLAYSTATION|Xbox)\\b", 
      "Watch": "SM-V700"}}
      impl.detectMobileBrowsers = {fullPattern: /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i, 
     shortPattern: /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i, 
     tabletPattern: /android|ipad|playbook|silk/i}
      var hasOwnProp=Object.prototype.hasOwnProperty, isArray;
      impl.FALLBACK_PHONE = 'UnknownPhone';
      impl.FALLBACK_TABLET = 'UnknownTablet';
      impl.FALLBACK_MOBILE = 'UnknownMobile';
      isArray = ('isArray' in Array) ? Array.isArray : function (value) {
        return Object.prototype.toString.call(value)==='[object Array]';
      }
      function equalIC(a, b) {
        return a!=null&&b!=null&&a.toLowerCase()===b.toLowerCase();
      }
      function containsIC(array, value) {
        var valueLC, i, len=array.length;
        if (!len||!value) {
            return false;
        }
        valueLC = value.toLowerCase();
        for (i = 0; i<len; ++i) {
            if (valueLC===array[i].toLowerCase()) {
                return true;
            }
        }
        return false;
      }
      function convertPropsToRegExp(object) {
        for (var key in object) {
            if (hasOwnProp.call(object, key)) {
                object[key] = new RegExp(object[key], 'i');
            }
        }
      }
      function prepareUserAgent(userAgent) {
        return (userAgent||'').substr(0, 500);
      }(function init() {
        var key, values, value, i, len, verPos, mobileDetectRules=impl.mobileDetectRules;
        for (key in mobileDetectRules.props) {
            if (hasOwnProp.call(mobileDetectRules.props, key)) {
                values = mobileDetectRules.props[key];
                if (!isArray(values)) {
                    values = [values];
                }
                len = values.length;
                for (i = 0; i<len; ++i) {
                    value = values[i];
                    verPos = value.indexOf('[VER]');
                    if (verPos>=0) {
                        value = value.substring(0, verPos)+'([\\w._\\+]+)'+value.substring(verPos+5);
                    }
                    values[i] = new RegExp(value, 'i');
                }
                mobileDetectRules.props[key] = values;
            }
        }
        convertPropsToRegExp(mobileDetectRules.oss);
        convertPropsToRegExp(mobileDetectRules.phones);
        convertPropsToRegExp(mobileDetectRules.tablets);
        convertPropsToRegExp(mobileDetectRules.uas);
        convertPropsToRegExp(mobileDetectRules.utils);
        mobileDetectRules.oss0 = {WindowsPhoneOS: mobileDetectRules.oss.WindowsPhoneOS, 
      WindowsMobileOS: mobileDetectRules.oss.WindowsMobileOS}
      }());
      impl.findMatch = function (rules, userAgent) {
        for (var key in rules) {
            if (hasOwnProp.call(rules, key)) {
                if (rules[key].test(userAgent)) {
                    return key;
                }
            }
        }
        return null;
      }
      impl.findMatches = function (rules, userAgent) {
        var result=[];
        for (var key in rules) {
            if (hasOwnProp.call(rules, key)) {
                if (rules[key].test(userAgent)) {
                    result.push(key);
                }
            }
        }
        return result;
      }
      impl.getVersionStr = function (propertyName, userAgent) {
        var props=impl.mobileDetectRules.props, patterns, i, len, match;
        if (hasOwnProp.call(props, propertyName)) {
            patterns = props[propertyName];
            len = patterns.length;
            for (i = 0; i<len; ++i) {
                match = patterns[i].exec(userAgent);
                if (match!==null) {
                    return match[1];
                }
            }
        }
        return null;
      }
      impl.getVersion = function (propertyName, userAgent) {
        var version=impl.getVersionStr(propertyName, userAgent);
        return version ? impl.prepareVersionNo(version) : NaN;
      }
      impl.prepareVersionNo = function (version) {
        var numbers;
        numbers = version.split(/[a-z._ \/\-]/i);
        if (numbers.length===1) {
            version = numbers[0];
        }
        if (numbers.length>1) {
            version = numbers[0]+'.';
            numbers.shift();
            version+=numbers.join('');
        }
        return Number(version);
      }
      impl.isMobileFallback = function (userAgent) {
        return impl.detectMobileBrowsers.fullPattern.test(userAgent)||impl.detectMobileBrowsers.shortPattern.test(userAgent.substr(0, 4));
      }
      impl.isTabletFallback = function (userAgent) {
        return impl.detectMobileBrowsers.tabletPattern.test(userAgent);
      }
      impl.prepareDetectionCache = function (cache, userAgent, maxPhoneWidth) {
        if (cache.mobile!==undefined) {
            return ;
        }
        var phone, tablet, phoneSized;
        tablet = impl.findMatch(impl.mobileDetectRules.tablets, userAgent);
        if (tablet) {
            cache.mobile = cache.tablet = tablet;
            cache.phone = null;
            return ;
        }
        phone = impl.findMatch(impl.mobileDetectRules.phones, userAgent);
        if (phone) {
            cache.mobile = cache.phone = phone;
            cache.tablet = null;
            return ;
        }
        if (impl.isMobileFallback(userAgent)) {
            phoneSized = MobileDetect.isPhoneSized(maxPhoneWidth);
            if (phoneSized===undefined) {
                cache.mobile = impl.FALLBACK_MOBILE;
                cache.tablet = cache.phone = null;
            }
            else 
              if (phoneSized) {
                cache.mobile = cache.phone = impl.FALLBACK_PHONE;
                cache.tablet = null;
            }
            else {
              cache.mobile = cache.tablet = impl.FALLBACK_TABLET;
              cache.phone = null;
            }
        }
        else 
          if (impl.isTabletFallback(userAgent)) {
            cache.mobile = cache.tablet = impl.FALLBACK_TABLET;
            cache.phone = null;
        }
        else {
          cache.mobile = cache.tablet = cache.phone = null;
        }
      }
      impl.mobileGrade = function (t) {
        var $isMobile=t.mobile()!==null;
        if (t.os('iOS')&&t.version('iPad')>=4.3||t.os('iOS')&&t.version('iPhone')>=3.1||t.os('iOS')&&t.version('iPod')>=3.1||(t.version('Android')>2.1&&t.is('Webkit'))||t.version('Windows Phone OS')>=7.0||t.is('BlackBerry')&&t.version('BlackBerry')>=6.0||t.match('Playbook.*Tablet')||(t.version('webOS')>=1.4&&t.match('Palm|Pre|Pixi'))||t.match('hp.*TouchPad')||(t.is('Firefox')&&t.version('Firefox')>=12)||(t.is('Chrome')&&t.is('AndroidOS')&&t.version('Android')>=4.0)||(t.is('Skyfire')&&t.version('Skyfire')>=4.1&&t.is('AndroidOS')&&t.version('Android')>=2.3)||(t.is('Opera')&&t.version('Opera Mobi')>11&&t.is('AndroidOS'))||t.is('MeeGoOS')||t.is('Tizen')||t.is('Dolfin')&&t.version('Bada')>=2.0||((t.is('UC Browser')||t.is('Dolfin'))&&t.version('Android')>=2.3)||(t.match('Kindle Fire')||t.is('Kindle')&&t.version('Kindle')>=3.0)||t.is('AndroidOS')&&t.is('NookTablet')||t.version('Chrome')>=11&&!$isMobile||t.version('Safari')>=5.0&&!$isMobile||t.version('Firefox')>=4.0&&!$isMobile||t.version('MSIE')>=7.0&&!$isMobile||t.version('Opera')>=10&&!$isMobile) {
            return 'A';
        }
        if (t.os('iOS')&&t.version('iPad')<4.3||t.os('iOS')&&t.version('iPhone')<3.1||t.os('iOS')&&t.version('iPod')<3.1||t.is('Blackberry')&&t.version('BlackBerry')>=5&&t.version('BlackBerry')<6||(t.version('Opera Mini')>=5.0&&t.version('Opera Mini')<=6.5&&(t.version('Android')>=2.3||t.is('iOS')))||t.match('NokiaN8|NokiaC7|N97.*Series60|Symbian/3')||t.version('Opera Mobi')>=11&&t.is('SymbianOS')) {
            return 'B';
        }
        if (t.version('BlackBerry')<5.0||t.match('MSIEMobile|Windows CE.*Mobile')||t.version('Windows Mobile')<=5.2) {
            return 'C';
        }
        return 'C';
      }
      impl.detectOS = function (ua) {
        return impl.findMatch(impl.mobileDetectRules.oss0, ua)||impl.findMatch(impl.mobileDetectRules.oss, ua);
      }
      impl.getDeviceSmallerSide = function () {
        return window.screen.width<window.screen.height ? window.screen.width : window.screen.height;
      }
      function MobileDetect(userAgent, maxPhoneWidth) {
        this.ua = prepareUserAgent(userAgent);
        this._cache = {}
        this.maxPhoneWidth = maxPhoneWidth||600;
      }
      MobileDetect.prototype = {constructor: MobileDetect, 
     mobile: function () {
          impl.prepareDetectionCache(this._cache, this.ua, this.maxPhoneWidth);
          return this._cache.mobile;
        }, 
     phone: function () {
          impl.prepareDetectionCache(this._cache, this.ua, this.maxPhoneWidth);
          return this._cache.phone;
        }, 
     tablet: function () {
          impl.prepareDetectionCache(this._cache, this.ua, this.maxPhoneWidth);
          return this._cache.tablet;
        }, 
     userAgent: function () {
          if (this._cache.userAgent===undefined) {
              this._cache.userAgent = impl.findMatch(impl.mobileDetectRules.uas, this.ua);
          }
          return this._cache.userAgent;
        }, 
     userAgents: function () {
          if (this._cache.userAgents===undefined) {
              this._cache.userAgents = impl.findMatches(impl.mobileDetectRules.uas, this.ua);
          }
          return this._cache.userAgents;
        }, 
     os: function () {
          if (this._cache.os===undefined) {
              this._cache.os = impl.detectOS(this.ua);
          }
          return this._cache.os;
        }, 
     version: function (key) {
          return impl.getVersion(key, this.ua);
        }, 
     versionStr: function (key) {
          return impl.getVersionStr(key, this.ua);
        }, 
     is: function (key) {
          return containsIC(this.userAgents(), key)||equalIC(key, this.os())||equalIC(key, this.phone())||equalIC(key, this.tablet())||containsIC(impl.findMatches(impl.mobileDetectRules.utils, this.ua), key);
        }, 
     match: function (pattern) {
          if (!(__instance_of(pattern, RegExp))) {
              pattern = new RegExp(pattern, 'i');
          }
          return pattern.test(this.ua);
        }, 
     isPhoneSized: function (maxPhoneWidth) {
          return MobileDetect.isPhoneSized(maxPhoneWidth||this.maxPhoneWidth);
        }, 
     mobileGrade: function () {
          if (this._cache.grade===undefined) {
              this._cache.grade = impl.mobileGrade(this);
          }
          return this._cache.grade;
        }}
      if (typeof window!=='undefined'&&window.screen) {
          MobileDetect.isPhoneSized = function (maxPhoneWidth) {
            return maxPhoneWidth<0 ? undefined : impl.getDeviceSmallerSide()<=maxPhoneWidth;
          };
      }
      else {
        MobileDetect.isPhoneSized = function () {
        };
      }
      MobileDetect._impl = impl;
      MobileDetect.version = '1.4.4 2019-09-21';
      return MobileDetect;
    });
  })((function (undefined) {
    if (typeof module!=='undefined'&&module.exports) {
        return function (factory) {
          module.exports = factory();
        }
    }
    else 
      if (typeof define==='function'&&define.amd) {
        return define;
    }
    else 
      if (typeof window!=='undefined') {
        return function (factory) {
          window.MobileDetect = factory();
        }
    }
    else {
      throw new Error('unknown environment');
    }
  })());
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/mobile-detect.js');


es6_module_define('nstructjs', [], function _nstructjs_module(_es6_module) {
  let nexports=(function () {
    if (typeof window==="undefined"&&typeof global!="undefined") {
        global._nGlobal = global;
    }
    else 
      if (typeof self!=="undefined") {
        self._nGlobal = self;
    }
    else {
      window._nGlobal = window;
    }
    let exports;
    let module={}
    if (typeof window==="undefined"&&typeof global!=="undefined") {
        console.log("Nodejs!");
    }
    else {
      exports = {};
      _nGlobal.module = {exports: exports};
    }
    'use strict';
    if (Array.prototype.pop_i===undefined) {
        Array.prototype.pop_i = function (idx) {
          if (idx<0||idx>=this.length) {
              throw new Error("Index out of range");
          }
          while (idx<this.length) {
            this[idx] = this[idx+1];
            idx++;
          }
          this.length-=1;
        };
    }
    if (Array.prototype.remove===undefined) {
        Array.prototype.remove = function (item, suppress_error) {
          var i=this.indexOf(item);
          if (i<0) {
              if (suppress_error)
                console.trace("Warning: item not in array", item);
              else 
                throw new Error("Error: item not in array "+item);
              return ;
          }
          this.pop_i(i);
        };
    }
    if (String.prototype.contains===undefined) {
        String.prototype.contains = function (substr) {
          return String.search(substr)!=null;
        };
    }
    Symbol["_struct_keystr"] = Symbol("_struct_keystr");
    String.prototype[Symbol._struct_keystr] = function () {
      return this;
    }
    Number.prototype[Symbol._struct_keystr] = Boolean.prototype[Symbol._struct_keystr] = function () {
      return ""+this;
    }
    var _o_basic_types={"String": 0, 
    "Number": 0, 
    "Array": 0, 
    "Function": 0}
    const _export_truncateDollarSign_=function (s) {
      let i=s.search("$");
      if (i>0) {
          return s.slice(0, i).trim();
      }
      return s;
    }
    const _export_cachering_=class cachering extends Array {
       constructor(cb, tot) {
        super();
        this.length = tot;
        this.cur = 0;
        for (let i=0; i<tot; i++) {
            this[i] = cb();
        }
      }
       next() {
        let ret=this[this.cur];
        this.cur = (this.cur+1)%this.length;
        return ret;
      }
      static  fromConstructor(cls, tot) {
        return new _export_cachering_(() =>          {
          return new cls();
        }, tot);
      }
    }
    _ESClass.register(_export_cachering_);
    function isNodeJS() {
      ret = typeof process!=="undefined";
      ret = ret&&process.release;
      ret = ret&&process.release.name==="node";
      ret = ret&&process.version;
      return !!ret;
    }
    let is_obj_lit=function is_obj_lit(obj) {
      if (typeof obj!=="object") {
          return false;
      }
      let good=obj.__proto__&&obj.__proto__.constructor&&obj.__proto__.constructor===Object;
      if (good) {
          return true;
      }
      let bad=typeof obj!=="object";
      bad = bad||obj.constructor.name in _o_basic_types;
      bad = bad||__instance_of(obj, String);
      bad = bad||__instance_of(obj, Number);
      bad = bad||__instance_of(obj, Boolean);
      bad = bad||__instance_of(obj, Function);
      bad = bad||__instance_of(obj, Array);
      bad = bad||__instance_of(obj, Set);
      bad = bad||(obj.__proto__.constructor&&obj.__proto__.constructor!==Object);
      return !bad;
    }
    _nGlobal.is_obj_lit = is_obj_lit;
    function set_getkey(obj) {
      if (typeof obj=="number"||typeof obj=="boolean")
        return ""+obj;
      else 
        if (typeof obj=="string")
        return obj;
      else 
        return obj[Symbol._struct_keystr]();
    }
    const _export_get_callstack_=function get_callstack(err) {
      var callstack=[];
      var isCallstackPopulated=false;
      var err_was_undefined=err==undefined;
      if (err==undefined) {
          try {
            _idontexist.idontexist+=0;
          }
          catch (err1) {
              err = err1;
          }
      }
      if (err!=undefined) {
          if (err.stack) {
              var lines=err.stack.split('\n');
              var len=lines.length;
              for (var i=0; i<len; i++) {
                  if (1) {
                      lines[i] = lines[i].replace(/@http\:\/\/.*\//, "|");
                      var l=lines[i].split("|");
                      lines[i] = l[1]+": "+l[0];
                      lines[i] = lines[i].trim();
                      callstack.push(lines[i]);
                  }
              }
              if (err_was_undefined) {
              }
              isCallstackPopulated = true;
          }
          else 
            if (window.opera&&e.message) {
              var lines=err.message.split('\n');
              var len=lines.length;
              for (var i=0; i<len; i++) {
                  if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {
                      var entry=lines[i];
                      if (lines[i+1]) {
                          entry+=' at '+lines[i+1];
                          i++;
                      }
                      callstack.push(entry);
                  }
              }
              if (err_was_undefined) {
                  callstack.shift();
              }
              isCallstackPopulated = true;
          }
      }
      var limit=24;
      if (!isCallstackPopulated) {
          var currentFunction=arguments.callee.caller;
          var i=0;
          while (currentFunction&&i<24) {
            var fn=currentFunction.toString();
            var fname=fn.substring(fn.indexOf("function")+8, fn.indexOf(''))||'anonymous';
            callstack.push(fname);
            currentFunction = currentFunction.caller;
            i++;
          }
      }
      return callstack;
    }
    const _export_print_stack_=function print_stack(err) {
      try {
        var cs=_export_get_callstack_(err);
      }
      catch (err2) {
          console.log("Could not fetch call stack.");
          return ;
      }
      console.log("Callstack:");
      for (var i=0; i<cs.length; i++) {
          console.log(cs[i]);
      }
    }
    const EmptySlot=Symbol("emptyslot");
    var set$1=class set  {
       constructor(input) {
        this.items = [];
        this.keys = {};
        this.freelist = [];
        this.length = 0;
        if (typeof input=="string") {
            input = new String(input);
        }
        if (input!==undefined) {
            if (Symbol.iterator in input) {
                for (var item of input) {
                    this.add(item);
                }
            }
            else 
              if ("forEach" in input) {
                input.forEach(function (item) {
                  this.add(item);
                }, this);
            }
            else 
              if (__instance_of(input, Array)) {
                for (var i=0; i<input.length; i++) {
                    this.add(input[i]);
                }
            }
        }
      }
       [Symbol.iterator]() {
        return new SetIter(this);
      }
       equals(setb) {
        for (let item of this) {
            if (!setb.has(item)) {
                return false;
            }
        }
        for (let item of setb) {
            if (!this.has(item)) {
                return false;
            }
        }
        return true;
      }
       clear() {
        this.items.length = 0;
        this.keys = {};
        this.freelist.length = 0;
        this.length = 0;
        return this;
      }
       filter(f, thisvar) {
        let i=0;
        let ret=new set();
        for (let item of this) {
            if (f.call(thisvar, item, i++, this)) {
                ret.add(item);
            }
        }
        return ret;
      }
       map(f, thisvar) {
        let ret=new set();
        let i=0;
        for (let item of this) {
            ret.add(f.call(thisvar, item, i++, this));
        }
        return ret;
      }
       reduce(f, initial) {
        if (initial===undefined) {
            for (let item of this) {
                initial = item;
                break;
            }
        }
        let i=0;
        for (let item of this) {
            initial = f(initial, item, i++, this);
        }
        return initial;
      }
       copy() {
        let ret=new set();
        for (let item of this) {
            ret.add(item);
        }
        return ret;
      }
       add(item) {
        var key=item[Symbol._struct_keystr]();
        if (key in this.keys)
          return ;
        if (this.freelist.length>0) {
            var i=this.freelist.pop();
            this.keys[key] = i;
            this.items[i] = item;
        }
        else {
          var i=this.items.length;
          this.keys[key] = i;
          this.items.push(item);
        }
        this.length++;
      }
       remove(item, ignore_existence) {
        var key=item[Symbol._struct_keystr]();
        if (!(key in this.keys)) {
            if (!ignore_existence) {
                console.warn("Warning, item", item, "is not in set");
            }
            return ;
        }
        var i=this.keys[key];
        this.freelist.push(i);
        this.items[i] = EmptySlot;
        delete this.keys[key];
        this.length--;
      }
       has(item) {
        return item[Symbol._struct_keystr]() in this.keys;
      }
       forEach(func, thisvar) {
        for (var i=0; i<this.items.length; i++) {
            var item=this.items[i];
            if (item===EmptySlot)
              continue;
            thisvar!==undefined ? func.call(thisvar, item) : func(item);
        }
      }
    }
    _ESClass.register(set$1);
    var IDGen=class IDGen  {
       constructor() {
        this.cur_id = 1;
      }
       gen_id() {
        return this.cur_id++;
      }
      static  fromSTRUCT(reader) {
        var ret=new IDGen();
        reader(ret);
        return ret;
      }
    }
    _ESClass.register(IDGen);
    IDGen.STRUCT = `
struct_util.IDGen {
  cur_id : int;
}
`;
    var struct_util=Object.freeze({__proto__: null, 
    truncateDollarSign: _export_truncateDollarSign_, 
    cachering: _export_cachering_, 
    is_obj_lit: is_obj_lit, 
    get_callstack: _export_get_callstack_, 
    print_stack: _export_print_stack_, 
    set: set$1, 
    IDGen: IDGen});
    "use strict";
    const _module_exports_={}
    _module_exports_.STRUCT_ENDIAN = true;
    let temp_dataview=new DataView(new ArrayBuffer(16));
    let uint8_view=new Uint8Array(temp_dataview.buffer);
    let unpack_context=_module_exports_.unpack_context = class unpack_context  {
       constructor() {
        this.i = 0;
      }
    }
    _ESClass.register(_module_exports_.unpack_context);
    let pack_byte=_module_exports_.pack_byte = function (array, val) {
      array.push(val);
    }
    let pack_sbyte=_module_exports_.pack_sbyte = function (array, val) {
      if (val<0) {
          val = 256+val;
      }
      array.push(val);
    }
    let pack_bytes=_module_exports_.pack_bytes = function (array, bytes) {
      for (let i=0; i<bytes.length; i++) {
          array.push(bytes[i]);
      }
    }
    let pack_int=_module_exports_.pack_int = function (array, val) {
      temp_dataview.setInt32(0, val, _module_exports_.STRUCT_ENDIAN);
      array.push(uint8_view[0]);
      array.push(uint8_view[1]);
      array.push(uint8_view[2]);
      array.push(uint8_view[3]);
    }
    let pack_uint=_module_exports_.pack_uint = function (array, val) {
      temp_dataview.setUint32(0, val, _module_exports_.STRUCT_ENDIAN);
      array.push(uint8_view[0]);
      array.push(uint8_view[1]);
      array.push(uint8_view[2]);
      array.push(uint8_view[3]);
    }
    let pack_ushort=_module_exports_.pack_ushort = function (array, val) {
      temp_dataview.setUint16(0, val, _module_exports_.STRUCT_ENDIAN);
      array.push(uint8_view[0]);
      array.push(uint8_view[1]);
    }
    _module_exports_.pack_float = function (array, val) {
      temp_dataview.setFloat32(0, val, _module_exports_.STRUCT_ENDIAN);
      array.push(uint8_view[0]);
      array.push(uint8_view[1]);
      array.push(uint8_view[2]);
      array.push(uint8_view[3]);
    }
    _module_exports_.pack_double = function (array, val) {
      temp_dataview.setFloat64(0, val, _module_exports_.STRUCT_ENDIAN);
      array.push(uint8_view[0]);
      array.push(uint8_view[1]);
      array.push(uint8_view[2]);
      array.push(uint8_view[3]);
      array.push(uint8_view[4]);
      array.push(uint8_view[5]);
      array.push(uint8_view[6]);
      array.push(uint8_view[7]);
    }
    _module_exports_.pack_short = function (array, val) {
      temp_dataview.setInt16(0, val, _module_exports_.STRUCT_ENDIAN);
      array.push(uint8_view[0]);
      array.push(uint8_view[1]);
    }
    let encode_utf8=_module_exports_.encode_utf8 = function encode_utf8(arr, str) {
      for (let i=0; i<str.length; i++) {
          let c=str.charCodeAt(i);
          while (c!=0) {
            let uc=c&127;
            c = c>>7;
            if (c!=0)
              uc|=128;
            arr.push(uc);
          }
      }
    }
    let decode_utf8=_module_exports_.decode_utf8 = function decode_utf8(arr) {
      let str="";
      let i=0;
      while (i<arr.length) {
        let c=arr[i];
        let sum=c&127;
        let j=0;
        let lasti=i;
        while (i<arr.length&&(c&128)) {
          j+=7;
          i++;
          c = arr[i];
          c = (c&127)<<j;
          sum|=c;
        }
        if (sum===0)
          break;
        str+=String.fromCharCode(sum);
        i++;
      }
      return str;
    }
    let test_utf8=_module_exports_.test_utf8 = function test_utf8() {
      let s="a"+String.fromCharCode(8800)+"b";
      let arr=[];
      encode_utf8(arr, s);
      let s2=decode_utf8(arr);
      if (s!=s2) {
          throw new Error("UTF-8 encoding/decoding test failed");
      }
      return true;
    }
    function truncate_utf8(arr, maxlen) {
      let len=Math.min(arr.length, maxlen);
      let last_codepoint=0;
      let last2=0;
      let incode=false;
      let i=0;
      let code=0;
      while (i<len) {
        incode = arr[i]&128;
        if (!incode) {
            last2 = last_codepoint+1;
            last_codepoint = i+1;
        }
        i++;
      }
      if (last_codepoint<maxlen)
        arr.length = last_codepoint;
      else 
        arr.length = last2;
      return arr;
    }
    let _static_sbuf_ss=new Array(2048);
    let pack_static_string=_module_exports_.pack_static_string = function pack_static_string(data, str, length) {
      if (length==undefined)
        throw new Error("'length' paremter is not optional for pack_static_string()");
      let arr=length<2048 ? _static_sbuf_ss : new Array();
      arr.length = 0;
      encode_utf8(arr, str);
      truncate_utf8(arr, length);
      for (let i=0; i<length; i++) {
          if (i>=arr.length) {
              data.push(0);
          }
          else {
            data.push(arr[i]);
          }
      }
    }
    let _static_sbuf=new Array(32);
    let pack_string=_module_exports_.pack_string = function pack_string(data, str) {
      _static_sbuf.length = 0;
      encode_utf8(_static_sbuf, str);
      pack_int(data, _static_sbuf.length);
      for (let i=0; i<_static_sbuf.length; i++) {
          data.push(_static_sbuf[i]);
      }
    }
    let unpack_bytes=_module_exports_.unpack_bytes = function unpack_bytes(dview, uctx, len) {
      let ret=new DataView(dview.buffer.slice(uctx.i, uctx.i+len));
      uctx.i+=len;
      return ret;
    }
    let unpack_byte=_module_exports_.unpack_byte = function (dview, uctx) {
      return dview.getUint8(uctx.i++);
    }
    let unpack_sbyte=_module_exports_.unpack_sbyte = function (dview, uctx) {
      return dview.getInt8(uctx.i++);
    }
    let unpack_int=_module_exports_.unpack_int = function (dview, uctx) {
      uctx.i+=4;
      return dview.getInt32(uctx.i-4, _module_exports_.STRUCT_ENDIAN);
    }
    let unpack_uint=_module_exports_.unpack_uint = function (dview, uctx) {
      uctx.i+=4;
      return dview.getUint32(uctx.i-4, _module_exports_.STRUCT_ENDIAN);
    }
    let unpack_ushort=_module_exports_.unpack_ushort = function (dview, uctx) {
      uctx.i+=2;
      return dview.getUint16(uctx.i-2, _module_exports_.STRUCT_ENDIAN);
    }
    _module_exports_.unpack_float = function (dview, uctx) {
      uctx.i+=4;
      return dview.getFloat32(uctx.i-4, _module_exports_.STRUCT_ENDIAN);
    }
    _module_exports_.unpack_double = function (dview, uctx) {
      uctx.i+=8;
      return dview.getFloat64(uctx.i-8, _module_exports_.STRUCT_ENDIAN);
    }
    _module_exports_.unpack_short = function (dview, uctx) {
      uctx.i+=2;
      return dview.getInt16(uctx.i-2, _module_exports_.STRUCT_ENDIAN);
    }
    let _static_arr_us=new Array(32);
    _module_exports_.unpack_string = function (data, uctx) {
      let slen=unpack_int(data, uctx);
      if (!slen) {
          return "";
      }
      let str="";
      let arr=slen<2048 ? _static_arr_us : new Array(slen);
      arr.length = slen;
      for (let i=0; i<slen; i++) {
          arr[i] = unpack_byte(data, uctx);
      }
      return decode_utf8(arr);
    }
    let _static_arr_uss=new Array(2048);
    _module_exports_.unpack_static_string = function unpack_static_string(data, uctx, length) {
      let str="";
      if (length==undefined)
        throw new Error("'length' cannot be undefined in unpack_static_string()");
      let arr=length<2048 ? _static_arr_uss : new Array(length);
      arr.length = 0;
      let done=false;
      for (let i=0; i<length; i++) {
          let c=unpack_byte(data, uctx);
          if (c==0) {
              done = true;
          }
          if (!done&&c!=0) {
              arr.push(c);
          }
      }
      truncate_utf8(arr, length);
      return decode_utf8(arr);
    }
    let _export_parser_;
    "use strict";
    var t;
    const _export_token_=class token  {
       constructor(type, val, lexpos, lineno, lexer, parser) {
        this.type = type;
        this.value = val;
        this.lexpos = lexpos;
        this.lineno = lineno;
        this.lexer = lexer;
        this.parser = parser;
      }
       toString() {
        if (this.value!=undefined)
          return "token(type="+this.type+", value='"+this.value+"')";
        else 
          return "token(type="+this.type+")";
      }
    }
    _ESClass.register(_export_token_);
    const _export_tokdef_=class tokdef  {
       constructor(name, regexpr, func, example) {
        this.name = name;
        this.re = regexpr;
        this.func = func;
        this.example = example;
        if (example===undefined&&regexpr) {
            let s=""+regexpr;
            if (s.startsWith("/")&&s.endsWith("/")) {
                s = s.slice(1, s.length-1);
            }
            if (s.startsWith("\\")) {
                s = s.slice(1, s.length);
            }
            s = s.trim();
            if (s.length===1) {
                this.example = s;
            }
        }
      }
    }
    _ESClass.register(_export_tokdef_);
    var PUTIL_ParseError=class PUTIL_ParseError extends Error {
       constructor(msg) {
        super();
      }
    }
    _ESClass.register(PUTIL_ParseError);
    const _export_lexer_=class lexer  {
       constructor(tokdef, errfunc) {
        this.tokdef = tokdef;
        this.tokens = new Array();
        this.lexpos = 0;
        this.lexdata = "";
        this.lineno = 0;
        this.errfunc = errfunc;
        this.tokints = {};
        for (var i=0; i<tokdef.length; i++) {
            this.tokints[tokdef[i].name] = i;
        }
        this.statestack = [["__main__", 0]];
        this.states = {"__main__": [tokdef, errfunc]};
        this.statedata = 0;
      }
       add_state(name, tokdef, errfunc) {
        if (errfunc==undefined) {
            errfunc = function (lexer) {
              return true;
            };
        }
        this.states[name] = [tokdef, errfunc];
      }
       tok_int(name) {

      }
       push_state(state, statedata) {
        this.statestack.push([state, statedata]);
        state = this.states[state];
        this.statedata = statedata;
        this.tokdef = state[0];
        this.errfunc = state[1];
      }
       pop_state() {
        var item=this.statestack[this.statestack.length-1];
        var state=this.states[item[0]];
        this.tokdef = state[0];
        this.errfunc = state[1];
        this.statedata = item[1];
      }
       input(str) {
        while (this.statestack.length>1) {
          this.pop_state();
        }
        this.lexdata = str;
        this.lexpos = 0;
        this.lineno = 0;
        this.tokens = new Array();
        this.peeked_tokens = [];
      }
       error() {
        if (this.errfunc!=undefined&&!this.errfunc(this))
          return ;
        console.log("Syntax error near line "+this.lineno);
        var next=Math.min(this.lexpos+8, this.lexdata.length);
        console.log("  "+this.lexdata.slice(this.lexpos, next));
        throw new PUTIL_ParseError("Parse error");
      }
       peek() {
        var tok=this.next(true);
        if (tok==undefined)
          return undefined;
        this.peeked_tokens.push(tok);
        return tok;
      }
       peeknext() {
        if (this.peeked_tokens.length>0) {
            return this.peeked_tokens[0];
        }
        return this.peek();
      }
       at_end() {
        return this.lexpos>=this.lexdata.length&&this.peeked_tokens.length==0;
      }
       next(ignore_peek) {
        if (!ignore_peek&&this.peeked_tokens.length>0) {
            var tok=this.peeked_tokens[0];
            this.peeked_tokens.shift();
            return tok;
        }
        if (this.lexpos>=this.lexdata.length)
          return undefined;
        var ts=this.tokdef;
        var tlen=ts.length;
        var lexdata=this.lexdata.slice(this.lexpos, this.lexdata.length);
        var results=[];
        for (var i=0; i<tlen; i++) {
            var t=ts[i];
            if (t.re==undefined)
              continue;
            var res=t.re.exec(lexdata);
            if (res!=null&&res!=undefined&&res.index==0) {
                results.push([t, res]);
            }
        }
        var max_res=0;
        var theres=undefined;
        for (var i=0; i<results.length; i++) {
            var res=results[i];
            if (res[1][0].length>max_res) {
                theres = res;
                max_res = res[1][0].length;
            }
        }
        if (theres==undefined) {
            this.error();
            return ;
        }
        var def=theres[0];
        var token=new _export_token_(def.name, theres[1][0], this.lexpos, this.lineno, this, undefined);
        this.lexpos+=token.value.length;
        if (def.func) {
            token = def.func(token);
            if (token==undefined) {
                return this.next();
            }
        }
        return token;
      }
    }
    _ESClass.register(_export_lexer_);
    const parser=_export_parser_ = class parser  {
       constructor(lexer, errfunc) {
        this.lexer = lexer;
        this.errfunc = errfunc;
        this.start = undefined;
      }
       parse(data, err_on_unconsumed) {
        if (err_on_unconsumed==undefined)
          err_on_unconsumed = true;
        if (data!=undefined)
          this.lexer.input(data);
        var ret=this.start(this);
        if (err_on_unconsumed&&!this.lexer.at_end()&&this.lexer.next()!=undefined) {
            this.error(undefined, "parser did not consume entire input");
        }
        return ret;
      }
       input(data) {
        this.lexer.input(data);
      }
       error(token, msg) {
        if (msg==undefined)
          msg = "";
        if (token==undefined)
          var estr="Parse error at end of input: "+msg;
        else 
          estr = "Parse error at line "+(token.lineno+1)+": "+msg;
        var buf="1| ";
        var ld=this.lexer.lexdata;
        var l=1;
        for (var i=0; i<ld.length; i++) {
            var c=ld[i];
            if (c=='\n') {
                l++;
                buf+="\n"+l+"| ";
            }
            else {
              buf+=c;
            }
        }
        console.log("------------------");
        console.log(buf);
        console.log("==================");
        console.log(estr);
        if (this.errfunc&&!this.errfunc(token)) {
            return ;
        }
        throw new PUTIL_ParseError(estr);
      }
       peek() {
        var tok=this.lexer.peek();
        if (tok!=undefined)
          tok.parser = this;
        return tok;
      }
       peeknext() {
        var tok=this.lexer.peeknext();
        if (tok!=undefined)
          tok.parser = this;
        return tok;
      }
       next() {
        var tok=this.lexer.next();
        if (tok!=undefined)
          tok.parser = this;
        return tok;
      }
       optional(type) {
        var tok=this.peek();
        if (tok==undefined)
          return false;
        if (tok.type==type) {
            this.next();
            return true;
        }
        return false;
      }
       at_end() {
        return this.lexer.at_end();
      }
       expect(type, msg) {
        var tok=this.next();
        if (msg==undefined) {
            msg = type;
            for (let tk of this.lexer.tokdef) {
                if (tk.name===type&&tk.example) {
                    msg = tk.example;
                }
            }
        }
        if (tok==undefined||tok.type!=type) {
            this.error(tok, "Expected "+msg);
        }
        return tok.value;
      }
    }
    _ESClass.register(_export_parser_);
    function test_parser() {
      var basic_types=new set(["int", "float", "double", "vec2", "vec3", "vec4", "mat4", "string"]);
      var reserved_tokens=new set(["int", "float", "double", "vec2", "vec3", "vec4", "mat4", "string", "static_string", "array"]);
      function tk(name, re, func) {
        return new _export_tokdef_(name, re, func);
      }
      var tokens=[tk("ID", /[a-zA-Z]+[a-zA-Z0-9_]*/, function (t) {
        if (reserved_tokens.has(t.value)) {
            t.type = t.value.toUpperCase();
        }
        return t;
      }), tk("OPEN", /\{/), tk("CLOSE", /}/), tk("COLON", /:/), tk("JSCRIPT", /\|/, function (t) {
        var js="";
        var lexer=t.lexer;
        while (lexer.lexpos<lexer.lexdata.length) {
          var c=lexer.lexdata[lexer.lexpos];
          if (c=="\n")
            break;
          js+=c;
          lexer.lexpos++;
        }
        if (js.endsWith(";")) {
            js = js.slice(0, js.length-1);
            lexer.lexpos--;
        }
        t.value = js;
        return t;
      }), tk("LPARAM", /\(/), tk("RPARAM", /\)/), tk("COMMA", /,/), tk("NUM", /[0-9]/), tk("SEMI", /;/), tk("NEWLINE", /\n/, function (t) {
        t.lexer.lineno+=1;
      }), tk("SPACE", / |\t/, function (t) {
      })];
      var __iter_rt=__get_iter(reserved_tokens);
      var rt;
      while (1) {
        var __ival_rt=__iter_rt.next();
        if (__ival_rt.done) {
            break;
        }
        rt = __ival_rt.value;
        tokens.push(tk(rt.toUpperCase()));
      }
      var a="\n  Loop {\n    eid : int;\n    flag : int;\n    index : int;\n    type : int;\n\n    co : vec3;\n    no : vec3;\n    loop : int | eid(loop);\n    edges : array(e, int) | e.eid;\n\n    loops : array(Loop);\n  }\n  ";
      function errfunc(lexer) {
        return true;
      }
      var lex=new _export_lexer_(tokens, errfunc);
      console.log("Testing lexical scanner...");
      lex.input(a);
      var token;
      while (token = lex.next()) {
        console.log(token.toString());
      }
      var parser=new _export_parser_(lex);
      parser.input(a);
      function p_Array(p) {
        p.expect("ARRAY");
        p.expect("LPARAM");
        var arraytype=p_Type(p);
        var itername="";
        if (p.optional("COMMA")) {
            itername = arraytype;
            arraytype = p_Type(p);
        }
        p.expect("RPARAM");
        return {type: "array", 
      data: {type: arraytype, 
       iname: itername}}
      }
      function p_Type(p) {
        var tok=p.peek();
        if (tok.type=="ID") {
            p.next();
            return {type: "struct", 
        data: "\""+tok.value+"\""}
        }
        else 
          if (basic_types.has(tok.type.toLowerCase())) {
            p.next();
            return {type: tok.type.toLowerCase()}
        }
        else 
          if (tok.type=="ARRAY") {
            return p_Array(p);
        }
        else {
          p.error(tok, "invalid type "+tok.type);
        }
      }
      function p_Field(p) {
        var field={}
        console.log("-----", p.peek().type);
        field.name = p.expect("ID", "struct field name");
        p.expect("COLON");
        field.type = p_Type(p);
        field.set = undefined;
        field.get = undefined;
        var tok=p.peek();
        if (tok.type=="JSCRIPT") {
            field.get = tok.value;
            p.next();
        }
        tok = p.peek();
        if (tok.type=="JSCRIPT") {
            field.set = tok.value;
            p.next();
        }
        p.expect("SEMI");
        return field;
      }
      function p_Struct(p) {
        var st={}
        st.name = p.expect("ID", "struct name");
        st.fields = [];
        p.expect("OPEN");
        while (1) {
          if (p.at_end()) {
              p.error(undefined);
          }
          else 
            if (p.optional("CLOSE")) {
              break;
          }
          else {
            st.fields.push(p_Field(p));
          }
        }
        return st;
      }
      var ret=p_Struct(parser);
      console.log(JSON.stringify(ret));
    }
    var struct_parseutil=Object.freeze({__proto__: null, 
    get parser() {
        return _export_parser_;
      }, 
    token: _export_token_, 
    tokdef: _export_tokdef_, 
    PUTIL_ParseError: PUTIL_ParseError, 
    lexer: _export_lexer_});
    "use strict";
    let NStruct=class NStruct  {
       constructor(name) {
        this.fields = [];
        this.id = -1;
        this.name = name;
      }
    }
    _ESClass.register(NStruct);
    let StructEnum={T_INT: 0, 
    T_FLOAT: 1, 
    T_DOUBLE: 2, 
    T_STRING: 7, 
    T_STATIC_STRING: 8, 
    T_STRUCT: 9, 
    T_TSTRUCT: 10, 
    T_ARRAY: 11, 
    T_ITER: 12, 
    T_SHORT: 13, 
    T_BYTE: 14, 
    T_BOOL: 15, 
    T_ITERKEYS: 16, 
    T_UINT: 17, 
    T_USHORT: 18, 
    T_STATIC_ARRAY: 19, 
    T_SIGNED_BYTE: 20}
    let ValueTypes=new Set([StructEnum.T_INT, StructEnum.T_FLOAT, StructEnum.T_DOUBLE, StructEnum.T_STRING, StructEnum.T_STATIC_STRING, StructEnum.T_SHORT, StructEnum.T_BYTE, StructEnum.T_BOOL, StructEnum.T_UINT, StructEnum.T_USHORT, StructEnum.T_SIGNED_BYTE]);
    let StructTypes={"int": StructEnum.T_INT, 
    "uint": StructEnum.T_UINT, 
    "ushort": StructEnum.T_USHORT, 
    "float": StructEnum.T_FLOAT, 
    "double": StructEnum.T_DOUBLE, 
    "string": StructEnum.T_STRING, 
    "static_string": StructEnum.T_STATIC_STRING, 
    "struct": StructEnum.T_STRUCT, 
    "abstract": StructEnum.T_TSTRUCT, 
    "array": StructEnum.T_ARRAY, 
    "iter": StructEnum.T_ITER, 
    "short": StructEnum.T_SHORT, 
    "byte": StructEnum.T_BYTE, 
    "bool": StructEnum.T_BOOL, 
    "iterkeys": StructEnum.T_ITERKEYS, 
    "sbyte": StructEnum.T_SIGNED_BYTE}
    let StructTypeMap={}
    for (let k in StructTypes) {
        StructTypeMap[StructTypes[k]] = k;
    }
    function gen_tabstr(t) {
      let s="";
      for (let i=0; i<t; i++) {
          s+="  ";
      }
      return s;
    }
    function StructParser() {
      let basic_types=new set$1(["int", "float", "double", "string", "short", "byte", "sbyte", "bool", "uint", "ushort"]);
      let reserved_tokens=new set$1(["int", "float", "double", "string", "static_string", "array", "iter", "abstract", "short", "byte", "sbyte", "bool", "iterkeys", "uint", "ushort", "static_array"]);
      function tk(name, re, func) {
        return new _export_tokdef_(name, re, func);
      }
      let tokens=[tk("ID", /[a-zA-Z_$]+[a-zA-Z0-9_\.$]*/, function (t) {
        if (reserved_tokens.has(t.value)) {
            t.type = t.value.toUpperCase();
        }
        return t;
      }, "identifier"), tk("OPEN", /\{/), tk("EQUALS", /=/), tk("CLOSE", /}/), tk("COLON", /:/), tk("SOPEN", /\[/), tk("SCLOSE", /\]/), tk("JSCRIPT", /\|/, function (t) {
        let js="";
        let lexer=t.lexer;
        while (lexer.lexpos<lexer.lexdata.length) {
          let c=lexer.lexdata[lexer.lexpos];
          if (c==="\n")
            break;
          js+=c;
          lexer.lexpos++;
        }
        while (js.trim().endsWith(";")) {
          js = js.slice(0, js.length-1);
          lexer.lexpos--;
        }
        t.value = js.trim();
        return t;
      }), tk("LPARAM", /\(/), tk("RPARAM", /\)/), tk("COMMA", /,/), tk("NUM", /[0-9]+/, undefined, "number"), tk("SEMI", /;/), tk("NEWLINE", /\n/, function (t) {
        t.lexer.lineno+=1;
      }, "newline"), tk("SPACE", / |\t/, function (t) {
      }, "whitespace")];
      reserved_tokens.forEach(function (rt) {
        tokens.push(tk(rt.toUpperCase()));
      });
      function errfunc(lexer) {
        return true;
      }
      let lex=new _export_lexer_(tokens, errfunc);
      let parser=new _export_parser_(lex);
      function p_Static_String(p) {
        p.expect("STATIC_STRING");
        p.expect("SOPEN");
        let num=p.expect("NUM");
        p.expect("SCLOSE");
        return {type: StructEnum.T_STATIC_STRING, 
      data: {maxlength: num}}
      }
      function p_DataRef(p) {
        p.expect("DATAREF");
        p.expect("LPARAM");
        let tname=p.expect("ID");
        p.expect("RPARAM");
        return {type: StructEnum.T_DATAREF, 
      data: tname}
      }
      function p_Array(p) {
        p.expect("ARRAY");
        p.expect("LPARAM");
        let arraytype=p_Type(p);
        let itername="";
        if (p.optional("COMMA")) {
            itername = arraytype.data.replace(/"/g, "");
            arraytype = p_Type(p);
        }
        p.expect("RPARAM");
        return {type: StructEnum.T_ARRAY, 
      data: {type: arraytype, 
       iname: itername}}
      }
      function p_Iter(p) {
        p.expect("ITER");
        p.expect("LPARAM");
        let arraytype=p_Type(p);
        let itername="";
        if (p.optional("COMMA")) {
            itername = arraytype.data.replace(/"/g, "");
            arraytype = p_Type(p);
        }
        p.expect("RPARAM");
        return {type: StructEnum.T_ITER, 
      data: {type: arraytype, 
       iname: itername}}
      }
      function p_StaticArray(p) {
        p.expect("STATIC_ARRAY");
        p.expect("SOPEN");
        let arraytype=p_Type(p);
        let itername="";
        p.expect("COMMA");
        let size=p.expect("NUM");
        if (size<0||Math.abs(size-Math.floor(size))>1e-06) {
            console.log(Math.abs(size-Math.floor(size)));
            p.error("Expected an integer");
        }
        size = Math.floor(size);
        if (p.optional("COMMA")) {
            itername = p_Type(p).data;
        }
        p.expect("SCLOSE");
        return {type: StructEnum.T_STATIC_ARRAY, 
      data: {type: arraytype, 
       size: size, 
       iname: itername}}
      }
      function p_IterKeys(p) {
        p.expect("ITERKEYS");
        p.expect("LPARAM");
        let arraytype=p_Type(p);
        let itername="";
        if (p.optional("COMMA")) {
            itername = arraytype.data.replace(/"/g, "");
            arraytype = p_Type(p);
        }
        p.expect("RPARAM");
        return {type: StructEnum.T_ITERKEYS, 
      data: {type: arraytype, 
       iname: itername}}
      }
      function p_Abstract(p) {
        p.expect("ABSTRACT");
        p.expect("LPARAM");
        let type=p.expect("ID");
        p.expect("RPARAM");
        return {type: StructEnum.T_TSTRUCT, 
      data: type}
      }
      function p_Type(p) {
        let tok=p.peek();
        if (tok.type==="ID") {
            p.next();
            return {type: StructEnum.T_STRUCT, 
        data: tok.value}
        }
        else 
          if (basic_types.has(tok.type.toLowerCase())) {
            p.next();
            return {type: StructTypes[tok.type.toLowerCase()]}
        }
        else 
          if (tok.type==="ARRAY") {
            return p_Array(p);
        }
        else 
          if (tok.type==="ITER") {
            return p_Iter(p);
        }
        else 
          if (tok.type==="ITERKEYS") {
            return p_IterKeys(p);
        }
        else 
          if (tok.type==="STATIC_ARRAY") {
            return p_StaticArray(p);
        }
        else 
          if (tok.type==="STATIC_STRING") {
            return p_Static_String(p);
        }
        else 
          if (tok.type==="ABSTRACT") {
            return p_Abstract(p);
        }
        else 
          if (tok.type==="DATAREF") {
            return p_DataRef(p);
        }
        else {
          p.error(tok, "invalid type "+tok.type);
        }
      }
      function p_ID_or_num(p) {
        let t=p.peeknext();
        if (t.type==="NUM") {
            p.next();
            return t.value;
        }
        else {
          return p.expect("ID", "struct field name");
        }
      }
      function p_Field(p) {
        let field={}
        field.name = p_ID_or_num(p);
        p.expect("COLON");
        field.type = p_Type(p);
        field.set = undefined;
        field.get = undefined;
        let check=0;
        let tok=p.peek();
        if (tok.type==="JSCRIPT") {
            field.get = tok.value;
            check = 1;
            p.next();
        }
        tok = p.peek();
        if (tok.type==="JSCRIPT") {
            check = 1;
            field.set = tok.value;
            p.next();
        }
        p.expect("SEMI");
        return field;
      }
      function p_Struct(p) {
        let name=p.expect("ID", "struct name");
        let st=new NStruct(name);
        let tok=p.peek();
        let id=-1;
        if (tok.type==="ID"&&tok.value==="id") {
            p.next();
            p.expect("EQUALS");
            st.id = p.expect("NUM");
        }
        p.expect("OPEN");
        while (1) {
          if (p.at_end()) {
              p.error(undefined);
          }
          else 
            if (p.optional("CLOSE")) {
              break;
          }
          else {
            st.fields.push(p_Field(p));
          }
        }
        return st;
      }
      parser.start = p_Struct;
      return parser;
    }
    const _export_struct_parse_=StructParser();
    var struct_parser=Object.freeze({__proto__: null, 
    NStruct: NStruct, 
    StructEnum: StructEnum, 
    ValueTypes: ValueTypes, 
    StructTypes: StructTypes, 
    StructTypeMap: StructTypeMap, 
    struct_parse: _export_struct_parse_});
    let _export_StructFieldTypeMap_;
    let warninglvl=1;
    let debug=0;
    let pack_int$1=_module_exports_.pack_int;
    let pack_uint$1=_module_exports_.pack_uint;
    let pack_ushort$1=_module_exports_.pack_ushort;
    let pack_float=_module_exports_.pack_float;
    let pack_string$1=_module_exports_.pack_string;
    let pack_byte$1=_module_exports_.pack_byte;
    let pack_sbyte$1=_module_exports_.pack_sbyte;
    let pack_double=_module_exports_.pack_double;
    let pack_static_string$1=_module_exports_.pack_static_string;
    let pack_short=_module_exports_.pack_short;
    let unpack_int$1=_module_exports_.unpack_int;
    let unpack_float=_module_exports_.unpack_float;
    let unpack_uint$1=_module_exports_.unpack_uint;
    let unpack_ushort$1=_module_exports_.unpack_ushort;
    let unpack_string=_module_exports_.unpack_string;
    let unpack_byte$1=_module_exports_.unpack_byte;
    let unpack_sbyte$1=_module_exports_.unpack_sbyte;
    let unpack_double=_module_exports_.unpack_double;
    let unpack_static_string=_module_exports_.unpack_static_string;
    let unpack_short=_module_exports_.unpack_short;
    let _static_envcode_null="";
    let packer_debug, packer_debug_start, packer_debug_end;
    let packdebug_tablevel=0;
    function gen_tabstr$1(tot) {
      let ret="";
      for (let i=0; i<tot; i++) {
          ret+=" ";
      }
      return ret;
    }
    const _export_setWarningMode_=(t) =>      {
      if (typeof t!=="number"||isNaN(t)) {
          throw new Error("Expected a single number (>= 0) argument to setWarningMode");
      }
      warninglvl = t;
    }
    const _export_setDebugMode_=(t) =>      {
      debug = t;
      if (debug) {
          packer_debug = function (msg) {
            if (msg!==undefined) {
                let t=gen_tabstr$1(packdebug_tablevel);
                console.log(t+msg);
            }
            else {
              console.log("Warning: undefined msg");
            }
          };
          packer_debug_start = function (funcname) {
            packer_debug("Start "+funcname);
            packdebug_tablevel++;
          };
          packer_debug_end = function (funcname) {
            packdebug_tablevel--;
            packer_debug("Leave "+funcname);
          };
      }
      else {
        packer_debug = function () {
        };
        packer_debug_start = function () {
        };
        packer_debug_end = function () {
        };
      }
    }
    _export_setDebugMode_(debug);
    const _export_StructFieldTypes_=[];
    let StructFieldTypeMap=_export_StructFieldTypeMap_ = {}
    let packNull=function (manager, data, field, type) {
      StructFieldTypeMap[type.type].packNull(manager, data, field, type);
    }
    let toJSON=function (manager, val, obj, field, type) {
      return _export_StructFieldTypeMap_[type.type].toJSON(manager, val, obj, field, type);
    }
    let fromJSON=function (manager, val, obj, field, type, instance) {
      return _export_StructFieldTypeMap_[type.type].fromJSON(manager, val, obj, field, type, instance);
    }
    function unpack_field(manager, data, type, uctx) {
      let name;
      if (debug) {
          name = _export_StructFieldTypeMap_[type.type].define().name;
          packer_debug_start("R start "+name);
      }
      let ret=_export_StructFieldTypeMap_[type.type].unpack(manager, data, type, uctx);
      if (debug) {
          packer_debug_end("R end "+name);
      }
      return ret;
    }
    let fakeFields=new _export_cachering_(() =>      {
      return {type: undefined, 
     get: undefined, 
     set: undefined}
    }, 256);
    function fmt_type(type) {
      return _export_StructFieldTypeMap_[type.type].format(type);
    }
    function do_pack(manager, data, val, obj, field, type) {
      let name;
      if (debug) {
          name = _export_StructFieldTypeMap_[type.type].define().name;
          packer_debug_start("W start "+name);
      }
      let typeid=type;
      if (typeof typeid!=="number") {
          typeid = typeid.type;
      }
      let ret=_export_StructFieldTypeMap_[typeid].pack(manager, data, val, obj, field, type);
      if (debug) {
          packer_debug_end("W end "+name);
      }
      return ret;
    }
    let StructEnum$1=StructEnum;
    let _ws_env=[[undefined, undefined]];
    let StructFieldType=class StructFieldType  {
      static  pack(manager, data, val, obj, field, type) {

      }
      static  unpack(manager, data, type, uctx) {

      }
      static  packNull(manager, data, field, type) {
        this.pack(manager, data, 0, 0, field, type);
      }
      static  format(type) {
        return this.define().name;
      }
      static  toJSON(manager, val, obj, field, type) {
        return val;
      }
      static  fromJSON(manager, val, obj, field, type, instance) {
        return val;
      }
      static  useHelperJS(field) {
        return true;
      }
      static  define() {
        return {type: -1, 
      name: "(error)"}
      }
      static  register(cls) {
        if (_export_StructFieldTypes_.indexOf(cls)>=0) {
            throw new Error("class already registered");
        }
        if (cls.define===StructFieldType.define) {
            throw new Error("you forgot to make a define() static method");
        }
        if (cls.define().type===undefined) {
            throw new Error("cls.define().type was undefined!");
        }
        if (cls.define().type in _export_StructFieldTypeMap_) {
            throw new Error("type "+cls.define().type+" is used by another StructFieldType subclass");
        }
        _export_StructFieldTypes_.push(cls);
        _export_StructFieldTypeMap_[cls.define().type] = cls;
      }
    }
    _ESClass.register(StructFieldType);
    class StructIntField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        pack_int$1(data, val);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_int$1(data, uctx);
      }
      static  define() {
        return {type: StructEnum$1.T_INT, 
      name: "int"}
      }
    }
    _ESClass.register(StructIntField);
    _es6_module.add_class(StructIntField);
    StructFieldType.register(StructIntField);
    class StructFloatField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        pack_float(data, val);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_float(data, uctx);
      }
      static  define() {
        return {type: StructEnum$1.T_FLOAT, 
      name: "float"}
      }
    }
    _ESClass.register(StructFloatField);
    _es6_module.add_class(StructFloatField);
    StructFieldType.register(StructFloatField);
    class StructDoubleField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        pack_double(data, val);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_double(data, uctx);
      }
      static  define() {
        return {type: StructEnum$1.T_DOUBLE, 
      name: "double"}
      }
    }
    _ESClass.register(StructDoubleField);
    _es6_module.add_class(StructDoubleField);
    StructFieldType.register(StructDoubleField);
    class StructStringField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        val = !val ? "" : val;
        pack_string$1(data, val);
      }
      static  packNull(manager, data, field, type) {
        this.pack(manager, data, "", 0, field, type);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_string(data, uctx);
      }
      static  define() {
        return {type: StructEnum$1.T_STRING, 
      name: "string"}
      }
    }
    _ESClass.register(StructStringField);
    _es6_module.add_class(StructStringField);
    StructFieldType.register(StructStringField);
    class StructStaticStringField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        val = !val ? "" : val;
        pack_static_string$1(data, val, type.data.maxlength);
      }
      static  format(type) {
        return `static_string[${type.data.maxlength}]`;
      }
      static  packNull(manager, data, field, type) {
        this.pack(manager, data, "", 0, field, type);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_static_string(data, uctx, type.data.maxlength);
      }
      static  define() {
        return {type: StructEnum$1.T_STATIC_STRING, 
      name: "static_string"}
      }
    }
    _ESClass.register(StructStaticStringField);
    _es6_module.add_class(StructStaticStringField);
    StructFieldType.register(StructStaticStringField);
    class StructStructField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        manager.write_struct(data, val, manager.get_struct(type.data));
      }
      static  format(type) {
        return type.data;
      }
      static  fromJSON(manager, val, obj, field, type, instance) {
        let stt=manager.get_struct(type.data);
        return manager.readJSON(val, stt, instance);
      }
      static  toJSON(manager, val, obj, field, type) {
        let stt=manager.get_struct(type.data);
        return manager.writeJSON(val, stt);
      }
      static  unpackInto(manager, data, type, uctx, dest) {
        let cls2=manager.get_struct_cls(type.data);
        return manager.read_object(data, cls2, uctx, dest);
      }
      static  packNull(manager, data, field, type) {
        let stt=manager.get_struct(type.data);
        for (let field2 of stt.fields) {
            let type2=field2.type;
            packNull(manager, data, field2, type2);
        }
      }
      static  unpack(manager, data, type, uctx) {
        let cls2=manager.get_struct_cls(type.data);
        return manager.read_object(data, cls2, uctx);
      }
      static  define() {
        return {type: StructEnum$1.T_STRUCT, 
      name: "struct"}
      }
    }
    _ESClass.register(StructStructField);
    _es6_module.add_class(StructStructField);
    StructFieldType.register(StructStructField);
    class StructTStructField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        let cls=manager.get_struct_cls(type.data);
        let stt=manager.get_struct(type.data);
        if (val.constructor.structName!==type.data&&(__instance_of(val, cls))) {
            stt = manager.get_struct(val.constructor.structName);
        }
        else 
          if (val.constructor.structName===type.data) {
            stt = manager.get_struct(type.data);
        }
        else {
          console.trace();
          throw new Error("Bad struct "+val.constructor.structName+" passed to write_struct");
        }
        packer_debug("int "+stt.id);
        pack_int$1(data, stt.id);
        manager.write_struct(data, val, stt);
      }
      static  fromJSON(manager, val, obj, field, type, instance) {
        let stt=manager.get_struct(val._structName);
        return manager.readJSON(val, stt, instance);
      }
      static  toJSON(manager, val, obj, field, type) {
        let stt=manager.get_struct(val.constructor.structName);
        let ret=manager.writeJSON(val, stt);
        ret._structName = ""+stt.name;
        return ret;
      }
      static  packNull(manager, data, field, type) {
        let stt=manager.get_struct(type.data);
        pack_int$1(data, stt.id);
        packNull(manager, data, field, {type: StructEnum$1.T_STRUCT, 
      data: type.data});
      }
      static  format(type) {
        return "abstract("+type.data+")";
      }
      static  unpackInto(manager, data, type, uctx, dest) {
        let id=_module_exports_.unpack_int(data, uctx);
        packer_debug("-int "+id);
        if (!(id in manager.struct_ids)) {
            packer_debug("struct id: "+id);
            console.trace();
            console.log(id);
            console.log(manager.struct_ids);
            packer_debug_end("tstruct");
            throw new Error("Unknown struct type "+id+".");
        }
        let cls2=manager.get_struct_id(id);
        packer_debug("struct name: "+cls2.name);
        cls2 = manager.struct_cls[cls2.name];
        return manager.read_object(data, cls2, uctx, dest);
      }
      static  unpack(manager, data, type, uctx) {
        let id=_module_exports_.unpack_int(data, uctx);
        packer_debug("-int "+id);
        if (!(id in manager.struct_ids)) {
            packer_debug("struct id: "+id);
            console.trace();
            console.log(id);
            console.log(manager.struct_ids);
            packer_debug_end("tstruct");
            throw new Error("Unknown struct type "+id+".");
        }
        let cls2=manager.get_struct_id(id);
        packer_debug("struct name: "+cls2.name);
        cls2 = manager.struct_cls[cls2.name];
        return manager.read_object(data, cls2, uctx);
      }
      static  define() {
        return {type: StructEnum$1.T_TSTRUCT, 
      name: "tstruct"}
      }
    }
    _ESClass.register(StructTStructField);
    _es6_module.add_class(StructTStructField);
    StructFieldType.register(StructTStructField);
    class StructArrayField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        if (val===undefined) {
            console.trace();
            console.log("Undefined array fed to struct struct packer!");
            console.log("Field: ", field);
            console.log("Type: ", type);
            console.log("");
            packer_debug("int 0");
            _module_exports_.pack_int(data, 0);
            return ;
        }
        packer_debug("int "+val.length);
        _module_exports_.pack_int(data, val.length);
        let d=type.data;
        let itername=d.iname;
        let type2=d.type;
        let env=_ws_env;
        for (let i=0; i<val.length; i++) {
            let val2=val[i];
            if (itername!==""&&itername!==undefined&&field.get) {
                env[0][0] = itername;
                env[0][1] = val2;
                val2 = manager._env_call(field.get, obj, env);
            }
            let fakeField=fakeFields.next();
            fakeField.type = type2;
            do_pack(manager, data, val2, obj, fakeField, type2);
        }
      }
      static  packNull(manager, data, field, type) {
        pack_int$1(data, 0);
      }
      static  format(type) {
        if (type.data.iname!==""&&type.data.iname!==undefined) {
            return "array("+type.data.iname+", "+fmt_type(type.data.type)+")";
        }
        else {
          return "array("+fmt_type(type.data.type)+")";
        }
      }
      static  useHelperJS(field) {
        return !field.type.data.iname;
      }
      static  fromJSON(manager, val, obj, field, type, instance) {
        let ret=instance||[];
        ret.length = 0;
        for (let i=0; i<val.length; i++) {
            let val2=fromJSON(manager, val[i], val, field, type.data.type, undefined);
            if (val2===undefined) {
                console.log(val2);
                console.error("eeek");
                process.exit();
            }
            ret.push(val2);
        }
        return ret;
      }
      static  toJSON(manager, val, obj, field, type) {
        val = val||[];
        let json=[];
        let itername=type.data.iname;
        for (let i=0; i<val.length; i++) {
            let val2=val[i];
            let env=_ws_env;
            if (itername!==""&&itername!==undefined&&field.get) {
                env[0][0] = itername;
                env[0][1] = val2;
                val2 = manager._env_call(field.get, obj, env);
            }
            json.push(toJSON(manager, val2, val, field, type.data.type));
        }
        return json;
      }
      static  unpackInto(manager, data, type, uctx, dest) {
        let len=_module_exports_.unpack_int(data, uctx);
        dest.length = 0;
        for (let i=0; i<len; i++) {
            dest.push(unpack_field(manager, data, type.data.type, uctx));
        }
      }
      static  unpack(manager, data, type, uctx) {
        let len=_module_exports_.unpack_int(data, uctx);
        packer_debug("-int "+len);
        let arr=new Array(len);
        for (let i=0; i<len; i++) {
            arr[i] = unpack_field(manager, data, type.data.type, uctx);
        }
        return arr;
      }
      static  define() {
        return {type: StructEnum$1.T_ARRAY, 
      name: "array"}
      }
    }
    _ESClass.register(StructArrayField);
    _es6_module.add_class(StructArrayField);
    StructFieldType.register(StructArrayField);
    class StructIterField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        function forEach(cb, thisvar) {
          if (val&&val[Symbol.iterator]) {
              for (let item of val) {
                  cb.call(thisvar, item);
              }
          }
          else 
            if (val&&val.forEach) {
              val.forEach(function (item) {
                cb.call(thisvar, item);
              });
          }
          else {
            console.trace();
            console.log("Undefined iterable list fed to struct struct packer!", val);
            console.log("Field: ", field);
            console.log("Type: ", type);
            console.log("");
          }
        }
        let len=0.0;
        forEach(() =>          {
          len++;
        });
        packer_debug("int "+len);
        _module_exports_.pack_int(data, len);
        let d=type.data, itername=d.iname, type2=d.type;
        let env=_ws_env;
        let i=0;
        forEach(function (val2) {
          if (i>=len) {
              if (warninglvl>0)
                console.trace("Warning: iterator returned different length of list!", val, i);
              return ;
          }
          if (itername!==""&&itername!==undefined&&field.get) {
              env[0][0] = itername;
              env[0][1] = val2;
              val2 = manager._env_call(field.get, obj, env);
          }
          let fakeField=fakeFields.next();
          fakeField.type = type2;
          do_pack(manager, data, val2, obj, fakeField, type2);
          i++;
        }, this);
      }
      static  fromJSON() {
        return StructArrayField.fromJSON(...arguments);
      }
      static  toJSON(manager, val, obj, field, type) {
        val = val||[];
        let json=[];
        let itername=type.data.iname;
        for (let val2 of val) {
            let env=_ws_env;
            if (itername!==""&&itername!==undefined&&field.get) {
                env[0][0] = itername;
                env[0][1] = val2;
                val2 = manager._env_call(field.get, obj, env);
            }
            json.push(toJSON(manager, val2, val, field, type.data.type));
        }
        return json;
      }
      static  packNull(manager, data, field, type) {
        pack_int$1(data, 0);
      }
      static  useHelperJS(field) {
        return !field.type.data.iname;
      }
      static  format(type) {
        if (type.data.iname!==""&&type.data.iname!==undefined) {
            return "iter("+type.data.iname+", "+fmt_type(type.data.type)+")";
        }
        else {
          return "iter("+fmt_type(type.data.type)+")";
        }
      }
      static  unpackInto(manager, data, type, uctx, arr) {
        let len=_module_exports_.unpack_int(data, uctx);
        packer_debug("-int "+len);
        arr.length = 0;
        for (let i=0; i<len; i++) {
            arr.push(unpack_field(manager, data, type.data.type, uctx));
        }
        return arr;
      }
      static  unpack(manager, data, type, uctx) {
        let len=_module_exports_.unpack_int(data, uctx);
        packer_debug("-int "+len);
        let arr=new Array(len);
        for (let i=0; i<len; i++) {
            arr[i] = unpack_field(manager, data, type.data.type, uctx);
        }
        return arr;
      }
      static  define() {
        return {type: StructEnum$1.T_ITER, 
      name: "iter"}
      }
    }
    _ESClass.register(StructIterField);
    _es6_module.add_class(StructIterField);
    StructFieldType.register(StructIterField);
    class StructShortField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        pack_short(data, val);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_short(data, uctx);
      }
      static  define() {
        return {type: StructEnum$1.T_SHORT, 
      name: "short"}
      }
    }
    _ESClass.register(StructShortField);
    _es6_module.add_class(StructShortField);
    StructFieldType.register(StructShortField);
    class StructByteField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        pack_byte$1(data, val);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_byte$1(data, uctx);
      }
      static  define() {
        return {type: StructEnum$1.T_BYTE, 
      name: "byte"}
      }
    }
    _ESClass.register(StructByteField);
    _es6_module.add_class(StructByteField);
    StructFieldType.register(StructByteField);
    class StructSignedByteField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        pack_sbyte$1(data, val);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_sbyte$1(data, uctx);
      }
      static  define() {
        return {type: StructEnum$1.T_SIGNED_BYTE, 
      name: "sbyte"}
      }
    }
    _ESClass.register(StructSignedByteField);
    _es6_module.add_class(StructSignedByteField);
    StructFieldType.register(StructSignedByteField);
    class StructBoolField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        pack_byte$1(data, !!val);
      }
      static  unpack(manager, data, type, uctx) {
        return !!unpack_byte$1(data, uctx);
      }
      static  define() {
        return {type: StructEnum$1.T_BOOL, 
      name: "bool"}
      }
    }
    _ESClass.register(StructBoolField);
    _es6_module.add_class(StructBoolField);
    StructFieldType.register(StructBoolField);
    class StructIterKeysField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        if ((typeof val!=="object"&&typeof val!=="function")||val===null) {
            console.warn("Bad object fed to iterkeys in struct packer!", val);
            console.log("Field: ", field);
            console.log("Type: ", type);
            console.log("");
            _module_exports_.pack_int(data, 0);
            packer_debug_end("iterkeys");
            return ;
        }
        let len=0.0;
        for (let k in val) {
            len++;
        }
        packer_debug("int "+len);
        _module_exports_.pack_int(data, len);
        let d=type.data, itername=d.iname, type2=d.type;
        let env=_ws_env;
        let i=0;
        for (let val2 in val) {
            if (i>=len) {
                if (warninglvl>0)
                  console.warn("Warning: object keys magically replaced on us", val, i);
                return ;
            }
            if (itername&&itername.trim().length>0&&field.get) {
                env[0][0] = itername;
                env[0][1] = val2;
                val2 = manager._env_call(field.get, obj, env);
            }
            else {
              val2 = val[val2];
            }
            let f2={type: type2, 
        get: undefined, 
        set: undefined};
            do_pack(manager, data, val2, obj, f2, type2);
            i++;
        }
      }
      static  fromJSON() {
        return StructArrayField.fromJSON(...arguments);
      }
      static  toJSON(manager, val, obj, field, type) {
        val = val||[];
        let json=[];
        let itername=type.data.iname;
        for (let k in val) {
            let val2=val[k];
            let env=_ws_env;
            if (itername!==""&&itername!==undefined&&field.get) {
                env[0][0] = itername;
                env[0][1] = val2;
                val2 = manager._env_call(field.get, obj, env);
            }
            json.push(toJSON(manager, val2, val, field, type.data.type));
        }
        return json;
      }
      static  packNull(manager, data, field, type) {
        pack_int$1(data, 0);
      }
      static  useHelperJS(field) {
        return !field.type.data.iname;
      }
      static  format(type) {
        if (type.data.iname!==""&&type.data.iname!==undefined) {
            return "iterkeys("+type.data.iname+", "+fmt_type(type.data.type)+")";
        }
        else {
          return "iterkeys("+fmt_type(type.data.type)+")";
        }
      }
      static  unpackInto(manager, data, type, uctx, arr) {
        let len=unpack_int$1(data, uctx);
        packer_debug("-int "+len);
        arr.length = 0;
        for (let i=0; i<len; i++) {
            arr.push(unpack_field(manager, data, type.data.type, uctx));
        }
        return arr;
      }
      static  unpack(manager, data, type, uctx) {
        let len=unpack_int$1(data, uctx);
        packer_debug("-int "+len);
        let arr=new Array(len);
        for (let i=0; i<len; i++) {
            arr[i] = unpack_field(manager, data, type.data.type, uctx);
        }
        return arr;
      }
      static  define() {
        return {type: StructEnum$1.T_ITERKEYS, 
      name: "iterkeys"}
      }
    }
    _ESClass.register(StructIterKeysField);
    _es6_module.add_class(StructIterKeysField);
    StructFieldType.register(StructIterKeysField);
    class StructUintField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        pack_uint$1(data, val);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_uint$1(data, uctx);
      }
      static  define() {
        return {type: StructEnum$1.T_UINT, 
      name: "uint"}
      }
    }
    _ESClass.register(StructUintField);
    _es6_module.add_class(StructUintField);
    StructFieldType.register(StructUintField);
    class StructUshortField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        pack_ushort$1(data, val);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_ushort$1(data, uctx);
      }
      static  define() {
        return {type: StructEnum$1.T_USHORT, 
      name: "ushort"}
      }
    }
    _ESClass.register(StructUshortField);
    _es6_module.add_class(StructUshortField);
    StructFieldType.register(StructUshortField);
    class StructStaticArrayField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        if (type.data.size===undefined) {
            throw new Error("type.data.size was undefined");
        }
        let itername=type.data.iname;
        if (val===undefined||!val.length) {
            this.packNull(manager, data, field, type);
            return ;
        }
        for (let i=0; i<type.data.size; i++) {
            let i2=Math.min(i, Math.min(val.length-1, type.data.size));
            let val2=val[i2];
            if (itername!==""&&itername!==undefined&&field.get) {
                let env=_ws_env;
                env[0][0] = itername;
                env[0][1] = val2;
                val2 = manager._env_call(field.get, obj, env);
            }
            do_pack(manager, data, val2, val, field, type.data.type);
        }
      }
      static  useHelperJS(field) {
        return !field.type.data.iname;
      }
      static  fromJSON() {
        return StructArrayField.fromJSON(...arguments);
      }
      static  packNull(manager, data, field, type) {
        let size=type.data.size;
        for (let i=0; i<size; i++) {
            packNull(manager, data, field, type.data.type);
        }
      }
      static  toJSON(manager, val, obj, field, type) {
        return StructArrayField.toJSON(...arguments);
      }
      static  format(type) {
        let type2=_export_StructFieldTypeMap_[type.data.type.type].format(type.data.type);
        let ret=`static_array[${type2}, ${type.data.size}`;
        if (type.data.iname) {
            ret+=`, ${type.data.iname}`;
        }
        ret+=`]`;
        return ret;
      }
      static  unpackInto(manager, data, type, uctx, ret) {
        packer_debug("-size: "+type.data.size);
        ret.length = 0;
        for (let i=0; i<type.data.size; i++) {
            ret.push(unpack_field(manager, data, type.data.type, uctx));
        }
        return ret;
      }
      static  unpack(manager, data, type, uctx) {
        packer_debug("-size: "+type.data.size);
        let ret=[];
        for (let i=0; i<type.data.size; i++) {
            ret.push(unpack_field(manager, data, type.data.type, uctx));
        }
        return ret;
      }
      static  define() {
        return {type: StructEnum$1.T_STATIC_ARRAY, 
      name: "static_array"}
      }
    }
    _ESClass.register(StructStaticArrayField);
    _es6_module.add_class(StructStaticArrayField);
    StructFieldType.register(StructStaticArrayField);
    "use strict";
    const NStruct$1=NStruct;
    let StructFieldTypeMap$1=_export_StructFieldTypeMap_;
    let warninglvl$1=2;
    const _module_exports_$1={}
    function unmangle(name) {
      if (_module_exports_$1.truncateDollarSign) {
          return _export_truncateDollarSign_(name);
      }
      else {
        return name;
      }
    }
    let StructTypeMap$1=StructTypeMap;
    let StructTypes$1=StructTypes;
    let struct_parse=_export_struct_parse_;
    let StructEnum$2=StructEnum;
    let _static_envcode_null$1="";
    let debug_struct=0;
    let packdebug_tablevel$1=0;
    _module_exports_$1.truncateDollarSign = true;
    function gen_tabstr$2(tot) {
      let ret="";
      for (let i=0; i<tot; i++) {
          ret+=" ";
      }
      return ret;
    }
    let packer_debug$1, packer_debug_start$1, packer_debug_end$1;
    if (debug_struct) {
        packer_debug$1 = function (msg) {
          if (msg!==undefined) {
              let t=gen_tabstr$2(packdebug_tablevel$1);
              console.log(t+msg);
          }
          else {
            console.log("Warning: undefined msg");
          }
        };
        packer_debug_start$1 = function (funcname) {
          packer_debug$1("Start "+funcname);
          packdebug_tablevel$1++;
        };
        packer_debug_end$1 = function (funcname) {
          packdebug_tablevel$1--;
          packer_debug$1("Leave "+funcname);
        };
    }
    else {
      packer_debug$1 = function () {
      };
      packer_debug_start$1 = function () {
      };
      packer_debug_end$1 = function () {
      };
    }
    _module_exports_$1.setWarningMode = (t) =>      {
      _export_setWarningMode_(t);
      if (typeof t!=="number"||isNaN(t)) {
          throw new Error("Expected a single number (>= 0) argument to setWarningMode");
      }
      warninglvl$1 = t;
    }
    _module_exports_$1.setDebugMode = (t) =>      {
      debug_struct = t;
      _export_setDebugMode_(t);
      if (debug_struct) {
          packer_debug$1 = function (msg) {
            if (msg!==undefined) {
                let t=gen_tabstr$2(packdebug_tablevel$1);
                console.log(t+msg);
            }
            else {
              console.log("Warning: undefined msg");
            }
          };
          packer_debug_start$1 = function (funcname) {
            packer_debug$1("Start "+funcname);
            packdebug_tablevel$1++;
          };
          packer_debug_end$1 = function (funcname) {
            packdebug_tablevel$1--;
            packer_debug$1("Leave "+funcname);
          };
      }
      else {
        packer_debug$1 = function () {
        };
        packer_debug_start$1 = function () {
        };
        packer_debug_end$1 = function () {
        };
      }
    }
    let _ws_env$1=[[undefined, undefined]];
    function do_pack$1(data, val, obj, thestruct, field, type) {
      StructFieldTypeMap$1[field.type.type].pack(manager, data, val, obj, field, type);
    }
    function define_empty_class(name) {
      let cls=function () {
      }
      cls.prototype = Object.create(Object.prototype);
      cls.constructor = cls.prototype.constructor = cls;
      cls.STRUCT = name+" {\n  }\n";
      cls.structName = name;
      cls.prototype.loadSTRUCT = function (reader) {
        reader(this);
      }
      cls.newSTRUCT = function () {
        return new this();
      }
      return cls;
    }
    let STRUCT=_module_exports_$1.STRUCT = class STRUCT  {
       constructor() {
        this.idgen = new IDGen();
        this.allowOverriding = true;
        this.structs = {};
        this.struct_cls = {};
        this.struct_ids = {};
        this.compiled_code = {};
        this.null_natives = {};
        function define_null_native(name, cls) {
          let obj=define_empty_class(name);
          let stt=struct_parse.parse(obj.STRUCT);
          stt.id = this.idgen.gen_id();
          this.structs[name] = stt;
          this.struct_cls[name] = cls;
          this.struct_ids[stt.id] = stt;
          this.null_natives[name] = 1;
        }
        define_null_native.call(this, "Object", Object);
      }
       validateStructs(onerror) {
        function getType(type) {
          switch (type.type) {
            case StructEnum$2.T_ITERKEYS:
            case StructEnum$2.T_ITER:
            case StructEnum$2.T_STATIC_ARRAY:
            case StructEnum$2.T_ARRAY:
              return getType(type.data.type);
            case StructEnum$2.T_TSTRUCT:
              return type;
            case StructEnum$2.T_STRUCT:
            default:
              return type;
          }
        }
        function formatType(type) {
          let ret={}
          ret.type = type.type;
          if (typeof ret.type==="number") {
              for (let k in StructEnum$2) {
                  if (StructEnum$2[k]===ret.type) {
                      ret.type = k;
                      break;
                  }
              }
          }
          else 
            if (typeof ret.type==="object") {
              ret.type = formatType(ret.type);
          }
          if (typeof type.data==="object") {
              ret.data = formatType(type.data);
          }
          else {
            ret.data = type.data;
          }
          return ret;
        }
        function throwError(stt, field, msg) {
          let buf=STRUCT.formatStruct(stt);
          console.error(buf+"\n\n"+msg);
          if (onerror) {
              onerror(msg, stt, field);
          }
          else {
            throw new Error(msg);
          }
        }
        for (let k in this.structs) {
            let stt=this.structs[k];
            for (let field of stt.fields) {
                if (field.name==="this") {
                    let type=field.type.type;
                    if (ValueTypes.has(type)) {
                        throwError(stt, field, "'this' cannot be used with value types");
                    }
                }
                let type=getType(field.type);
                if (type.type!==StructEnum$2.T_STRUCT&&type.type!==StructEnum$2.T_TSTRUCT) {
                    continue;
                }
                if (!(type.data in this.structs)) {
                    let msg=stt.name+":"+field.name+": Unknown struct "+type.data+".";
                    throwError(stt, field, msg);
                }
            }
        }
      }
       forEach(func, thisvar) {
        for (let k in this.structs) {
            let stt=this.structs[k];
            if (thisvar!==undefined)
              func.call(thisvar, stt);
            else 
              func(stt);
        }
      }
       parse_structs(buf, defined_classes) {
        if (defined_classes===undefined) {
            defined_classes = _module_exports_$1.manager;
        }
        if (__instance_of(defined_classes, STRUCT)) {
            let struct2=defined_classes;
            defined_classes = [];
            for (let k in struct2.struct_cls) {
                defined_classes.push(struct2.struct_cls[k]);
            }
        }
        if (defined_classes===undefined) {
            defined_classes = [];
            for (let k in _module_exports_$1.manager.struct_cls) {
                defined_classes.push(_module_exports_$1.manager.struct_cls[k]);
            }
        }
        let clsmap={};
        for (let i=0; i<defined_classes.length; i++) {
            let cls=defined_classes[i];
            if (!cls.structName&&cls.STRUCT) {
                let stt=struct_parse.parse(cls.STRUCT.trim());
                cls.structName = stt.name;
            }
            else 
              if (!cls.structName&&cls.name!=="Object") {
                if (warninglvl$1>0)
                  console.log("Warning, bad class in registered class list", unmangle(cls.name), cls);
                continue;
            }
            clsmap[cls.structName] = defined_classes[i];
        }
        struct_parse.input(buf);
        while (!struct_parse.at_end()) {
          let stt=struct_parse.parse(undefined, false);
          if (!(stt.name in clsmap)) {
              if (!(stt.name in this.null_natives))
                if (warninglvl$1>0)
                console.log("WARNING: struct "+stt.name+" is missing from class list.");
              let dummy=define_empty_class(stt.name);
              dummy.STRUCT = STRUCT.fmt_struct(stt);
              dummy.structName = stt.name;
              dummy.prototype.structName = dummy.name;
              this.struct_cls[dummy.structName] = dummy;
              this.structs[dummy.structName] = stt;
              if (stt.id!==-1)
                this.struct_ids[stt.id] = stt;
          }
          else {
            this.struct_cls[stt.name] = clsmap[stt.name];
            this.structs[stt.name] = stt;
            if (stt.id!==-1)
              this.struct_ids[stt.id] = stt;
          }
          let tok=struct_parse.peek();
          while (tok&&(tok.value==="\n"||tok.value==="\r"||tok.value==="\t"||tok.value===" ")) {
            tok = struct_parse.peek();
          }
        }
      }
       register(cls, structName) {
        return this.add_class(cls, structName);
      }
       unregister(cls) {
        if (!cls||!cls.structName||!(cls.structName in this.struct_cls)) {
            console.warn("Class not registered with nstructjs", cls);
            return ;
        }
        let st=this.structs[cls.structName];
        delete this.structs[cls.structName];
        delete this.struct_cls[cls.structName];
        delete this.struct_ids[st.id];
      }
       add_class(cls, structName) {
        if (cls.STRUCT) {
            let bad=false;
            let p=cls;
            while (p) {
              p = p.__proto__;
              if (p&&p.STRUCT&&p.STRUCT===cls.STRUCT) {
                  bad = true;
                  break;
              }
            }
            if (bad) {
                console.warn("Generating STRUCT script for derived class "+unmangle(cls.name));
                if (!structName) {
                    structName = unmangle(cls.name);
                }
                cls.STRUCT = STRUCT.inherit(cls, p)+`\n}`;
            }
        }
        if (!cls.STRUCT) {
            throw new Error("class "+unmangle(cls.name)+" has no STRUCT script");
        }
        let stt=struct_parse.parse(cls.STRUCT);
        stt.name = unmangle(stt.name);
        cls.structName = stt.name;
        if (cls.newSTRUCT===undefined) {
            cls.newSTRUCT = function () {
              return new this();
            };
        }
        if (structName!==undefined) {
            stt.name = cls.structName = structName;
        }
        else 
          if (cls.structName===undefined) {
            cls.structName = stt.name;
        }
        else {
          stt.name = cls.structName;
        }
        if (cls.structName in this.structs) {
            console.warn("Struct "+unmangle(cls.structName)+" is already registered", cls);
            if (!this.allowOverriding) {
                throw new Error("Struct "+unmangle(cls.structName)+" is already registered");
            }
            return ;
        }
        if (stt.id===-1)
          stt.id = this.idgen.gen_id();
        this.structs[cls.structName] = stt;
        this.struct_cls[cls.structName] = cls;
        this.struct_ids[stt.id] = stt;
      }
       isRegistered(cls) {
        if (!cls.hasOwnProperty("structName")) {
            return false;
        }
        return cls===this.struct_cls[cls.structName];
      }
       get_struct_id(id) {
        return this.struct_ids[id];
      }
       get_struct(name) {
        if (!(name in this.structs)) {
            console.warn("Unknown struct", name);
            throw new Error("Unknown struct "+name);
        }
        return this.structs[name];
      }
       get_struct_cls(name) {
        if (!(name in this.struct_cls)) {
            console.trace();
            throw new Error("Unknown struct "+name);
        }
        return this.struct_cls[name];
      }
      static  inherit(child, parent, structName=child.name) {
        if (!parent.STRUCT) {
            return structName+"{\n";
        }
        let stt=struct_parse.parse(parent.STRUCT);
        let code=structName+"{\n";
        code+=STRUCT.fmt_struct(stt, true);
        return code;
      }
      static  Super(obj, reader) {
        if (warninglvl$1>0)
          console.warn("deprecated");
        reader(obj);
        function reader2(obj) {
        }
        let cls=obj.constructor;
        let bad=cls===undefined||cls.prototype===undefined||cls.prototype.__proto__===undefined;
        if (bad) {
            return ;
        }
        let parent=cls.prototype.__proto__.constructor;
        bad = bad||parent===undefined;
        if (!bad&&parent.prototype.loadSTRUCT&&parent.prototype.loadSTRUCT!==obj.loadSTRUCT) {
            parent.prototype.loadSTRUCT.call(obj, reader2);
        }
      }
      static  chain_fromSTRUCT(cls, reader) {
        if (warninglvl$1>0)
          console.warn("Using deprecated (and evil) chain_fromSTRUCT method, eek!");
        let proto=cls.prototype;
        let parent=cls.prototype.prototype.constructor;
        let obj=parent.fromSTRUCT(reader);
        let obj2=new cls();
        let keys=Object.keys(obj).concat(Object.getOwnPropertySymbols(obj));
        for (let i=0; i<keys.length; i++) {
            let k=keys[i];
            try {
              obj2[k] = obj[k];
            }
            catch (error) {
                if (warninglvl$1>0)
                  console.warn("  failed to set property", k);
            }
        }
        return obj2;
      }
      static  formatStruct(stt, internal_only, no_helper_js) {
        return this.fmt_struct(stt, internal_only, no_helper_js);
      }
      static  fmt_struct(stt, internal_only, no_helper_js) {
        if (internal_only===undefined)
          internal_only = false;
        if (no_helper_js===undefined)
          no_helper_js = false;
        let s="";
        if (!internal_only) {
            s+=stt.name;
            if (stt.id!==-1)
              s+=" id="+stt.id;
            s+=" {\n";
        }
        let tab="  ";
        function fmt_type(type) {
          return StructFieldTypeMap$1[type.type].format(type);
          if (type.type===StructEnum$2.T_ARRAY||type.type===StructEnum$2.T_ITER||type.type===StructEnum$2.T_ITERKEYS) {
              if (type.data.iname!==""&&type.data.iname!==undefined) {
                  return "array("+type.data.iname+", "+fmt_type(type.data.type)+")";
              }
              else {
                return "array("+fmt_type(type.data.type)+")";
              }
          }
          else 
            if (type.type===StructEnum$2.T_STATIC_STRING) {
              return "static_string["+type.data.maxlength+"]";
          }
          else 
            if (type.type===StructEnum$2.T_STRUCT) {
              return type.data;
          }
          else 
            if (type.type===StructEnum$2.T_TSTRUCT) {
              return "abstract("+type.data+")";
          }
          else {
            return StructTypeMap$1[type.type];
          }
        }
        let fields=stt.fields;
        for (let i=0; i<fields.length; i++) {
            let f=fields[i];
            s+=tab+f.name+" : "+fmt_type(f.type);
            if (!no_helper_js&&f.get!==undefined) {
                s+=" | "+f.get.trim();
            }
            s+=";\n";
        }
        if (!internal_only)
          s+="}";
        return s;
      }
       _env_call(code, obj, env) {
        let envcode=_static_envcode_null$1;
        if (env!==undefined) {
            envcode = "";
            for (let i=0; i<env.length; i++) {
                envcode = "let "+env[i][0]+" = env["+i.toString()+"][1];\n"+envcode;
            }
        }
        let fullcode="";
        if (envcode!==_static_envcode_null$1)
          fullcode = envcode+code;
        else 
          fullcode = code;
        let func;
        if (!(fullcode in this.compiled_code)) {
            let code2="func = function(obj, env) { "+envcode+"return "+code+"}";
            try {
              func = _structEval(code2);
            }
            catch (err) {
                _export_print_stack_(err);
                console.log(code2);
                console.log(" ");
                throw err;
            }
            this.compiled_code[fullcode] = func;
        }
        else {
          func = this.compiled_code[fullcode];
        }
        try {
          return func.call(obj, obj, env);
        }
        catch (err) {
            _export_print_stack_(err);
            let code2="func = function(obj, env) { "+envcode+"return "+code+"}";
            console.log(code2);
            console.log(" ");
            throw err;
        }
      }
       write_struct(data, obj, stt) {
        function use_helper_js(field) {
          let type=field.type.type;
          let cls=StructFieldTypeMap$1[type];
          return cls.useHelperJS(field);
        }
        let fields=stt.fields;
        let thestruct=this;
        for (let i=0; i<fields.length; i++) {
            let f=fields[i];
            let t1=f.type;
            let t2=t1.type;
            if (use_helper_js(f)) {
                let val;
                let type=t2;
                if (f.get!==undefined) {
                    val = thestruct._env_call(f.get, obj);
                }
                else {
                  val = f.name==="this" ? obj : obj[f.name];
                }
                if (_nGlobal.DEBUG&&_nGlobal.DEBUG.tinyeval) {
                    console.log("\n\n\n", f.get, "Helper JS Ret", val, "\n\n\n");
                }
                do_pack$1(data, val, obj, thestruct, f, t1);
            }
            else {
              let val=f.name==="this" ? obj : obj[f.name];
              do_pack$1(data, val, obj, thestruct, f, t1);
            }
        }
      }
       write_object(data, obj) {
        let cls=obj.constructor.structName;
        let stt=this.get_struct(cls);
        if (data===undefined) {
            data = [];
        }
        this.write_struct(data, obj, stt);
        return data;
      }
       readObject(data, cls_or_struct_id, uctx) {
        if (__instance_of(data, Uint8Array)||__instance_of(data, Uint8ClampedArray)) {
            data = new DataView(data.buffer);
        }
        else 
          if (__instance_of(data, Array)) {
            data = new DataView(new Uint8Array(data).buffer);
        }
        return this.read_object(data, cls_or_struct_id, uctx);
      }
       writeObject(data, obj) {
        return this.write_object(data, obj);
      }
       writeJSON(obj, stt=undefined) {
        let cls=obj.constructor;
        stt = stt||this.get_struct(cls.structName);
        function use_helper_js(field) {
          let type=field.type.type;
          let cls=StructFieldTypeMap$1[type];
          return cls.useHelperJS(field);
        }
        let toJSON$1=toJSON;
        let fields=stt.fields;
        let thestruct=this;
        let json={};
        for (let i=0; i<fields.length; i++) {
            let f=fields[i];
            let val;
            let t1=f.type;
            let json2;
            if (use_helper_js(f)) {
                if (f.get!==undefined) {
                    val = thestruct._env_call(f.get, obj);
                }
                else {
                  val = f.name==="this" ? obj : obj[f.name];
                }
                if (_nGlobal.DEBUG&&_nGlobal.DEBUG.tinyeval) {
                    console.log("\n\n\n", f.get, "Helper JS Ret", val, "\n\n\n");
                }
                json2 = toJSON$1(this, val, obj, f, t1);
            }
            else {
              val = f.name==="this" ? obj : obj[f.name];
              json2 = toJSON$1(this, val, obj, f, t1);
            }
            if (f.name!=='this') {
                json[f.name] = json2;
            }
            else {
              let isArray=Array.isArray(json2);
              isArray = isArray||f.type.type===StructTypes$1.T_ARRAY;
              isArray = isArray||f.type.type===StructTypes$1.T_STATIC_ARRAY;
              if (isArray) {
                  json.length = json2.length;
                  for (let i=0; i<json2.length; i++) {
                      json[i] = json2[i];
                  }
              }
              else {
                Object.assign(json, json2);
              }
            }
        }
        return json;
      }
       read_object(data, cls_or_struct_id, uctx, objInstance) {
        let cls, stt;
        if (__instance_of(data, Array)) {
            data = new DataView(new Uint8Array(data).buffer);
        }
        if (typeof cls_or_struct_id==="number") {
            cls = this.struct_cls[this.struct_ids[cls_or_struct_id].name];
        }
        else {
          cls = cls_or_struct_id;
        }
        if (cls===undefined) {
            throw new Error("bad cls_or_struct_id "+cls_or_struct_id);
        }
        stt = this.structs[cls.structName];
        if (uctx===undefined) {
            uctx = new _module_exports_.unpack_context();
            packer_debug$1("\n\n=Begin reading "+cls.structName+"=");
        }
        let thestruct=this;
        let this2=this;
        function unpack_field(type) {
          return StructFieldTypeMap$1[type.type].unpack(this2, data, type, uctx);
        }
        function unpack_into(type, dest) {
          return StructFieldTypeMap$1[type.type].unpackInto(this2, data, type, uctx, dest);
        }
        let was_run=false;
        function makeLoader(stt) {
          return function load(obj) {
            if (was_run) {
                return ;
            }
            was_run = true;
            let fields=stt.fields;
            let flen=fields.length;
            for (let i=0; i<flen; i++) {
                let f=fields[i];
                if (f.name==='this') {
                    unpack_into(f.type, obj);
                }
                else {
                  obj[f.name] = unpack_field(f.type);
                }
            }
          }
        }
        let load=makeLoader(stt);
        if (cls.prototype.loadSTRUCT!==undefined) {
            let obj=objInstance;
            if (!obj&&cls.newSTRUCT!==undefined) {
                obj = cls.newSTRUCT(load);
            }
            else 
              if (!obj) {
                obj = new cls();
            }
            obj.loadSTRUCT(load);
            return obj;
        }
        else 
          if (cls.fromSTRUCT!==undefined) {
            if (warninglvl$1>1)
              console.warn("Warning: class "+unmangle(cls.name)+" is using deprecated fromSTRUCT interface; use newSTRUCT/loadSTRUCT instead");
            return cls.fromSTRUCT(load);
        }
        else {
          let obj=objInstance;
          if (!obj&&cls.newSTRUCT!==undefined) {
              obj = cls.newSTRUCT(load);
          }
          else 
            if (!obj) {
              obj = new cls();
          }
          load(obj);
          return obj;
        }
      }
       readJSON(json, cls_or_struct_id, objInstance=undefined) {
        let cls, stt;
        if (typeof cls_or_struct_id==="number") {
            cls = this.struct_cls[this.struct_ids[cls_or_struct_id].name];
        }
        else 
          if (__instance_of(cls_or_struct_id, NStruct$1)) {
            cls = this.get_struct_cls(cls_or_struct_id.name);
        }
        else {
          cls = cls_or_struct_id;
        }
        if (cls===undefined) {
            throw new Error("bad cls_or_struct_id "+cls_or_struct_id);
        }
        stt = this.structs[cls.structName];
        packer_debug$1("\n\n=Begin reading "+cls.structName+"=");
        let thestruct=this;
        let this2=this;
        let was_run=false;
        let fromJSON$1=fromJSON;
        function makeLoader(stt) {
          return function load(obj) {
            if (was_run) {
                return ;
            }
            was_run = true;
            let fields=stt.fields;
            let flen=fields.length;
            for (let i=0; i<flen; i++) {
                let f=fields[i];
                let val;
                if (f.name==='this') {
                    val = json;
                }
                else {
                  val = json[f.name];
                }
                if (val===undefined) {
                    console.warn("nstructjs.readJSON: Missing field "+f.name+" in struct "+stt.name);
                    continue;
                }
                let instance=f.name==='this' ? obj : objInstance;
                let ret=fromJSON$1(this2, val, obj, f, f.type, instance);
                if (f.name!=='this') {
                    obj[f.name] = ret;
                }
            }
          }
        }
        let load=makeLoader(stt);
        if (cls.prototype.loadSTRUCT!==undefined) {
            let obj=objInstance;
            if (!obj&&cls.newSTRUCT!==undefined) {
                obj = cls.newSTRUCT(load);
            }
            else 
              if (!obj) {
                obj = new cls();
            }
            obj.loadSTRUCT(load);
            return obj;
        }
        else 
          if (cls.fromSTRUCT!==undefined) {
            if (warninglvl$1>1)
              console.warn("Warning: class "+unmangle(cls.name)+" is using deprecated fromSTRUCT interface; use newSTRUCT/loadSTRUCT instead");
            return cls.fromSTRUCT(load);
        }
        else {
          let obj=objInstance;
          if (!obj&&cls.newSTRUCT!==undefined) {
              obj = cls.newSTRUCT(load);
          }
          else 
            if (!obj) {
              obj = new cls();
          }
          load(obj);
          return obj;
        }
      }
    }
    _ESClass.register(_module_exports_$1.STRUCT);
    let manager=_module_exports_$1.manager = new STRUCT();
    let write_scripts=_module_exports_$1.write_scripts = function write_scripts(manager, include_code) {
      if (include_code===undefined) {
          include_code = false;
      }
      if (manager===undefined)
        manager = _module_exports_$1.manager;
      let buf="";
      manager.forEach(function (stt) {
        buf+=STRUCT.fmt_struct(stt, false, !include_code)+"\n";
      });
      let buf2=buf;
      buf = "";
      for (let i=0; i<buf2.length; i++) {
          let c=buf2[i];
          if (c==="\n") {
              buf+="\n";
              let i2=i;
              while (i<buf2.length&&(buf2[i]===" "||buf2[i]==="\t"||buf2[i]==="\n")) {
                i++;
              }
              if (i!==i2)
                i--;
          }
          else {
            buf+=c;
          }
      }
      return buf;
    }
    "use strict";
    if (typeof btoa==="undefined") {
        _nGlobal.btoa = function btoa(str) {
          let buffer=new Buffer(""+str, 'binary');
          return buffer.toString('base64');
        };
        _nGlobal.atob = function atob(str) {
          return new Buffer(str, 'base64').toString('binary');
        };
    }
    const _export_versionToInt_=function (v) {
      v = _export_versionCoerce_(v);
      let mul=64;
      return ~~(v.major*mul*mul*mul+v.minor*mul*mul+v.micro*mul);
    }
    let ver_pat=/[0-9]+\.[0-9]+\.[0-9]+$/;
    const _export_versionCoerce_=function (v) {
      if (!v) {
          throw new Error("empty version: "+v);
      }
      if (typeof v==="string") {
          if (!ver_pat.exec(v)) {
              throw new Error("invalid version string "+v);
          }
          let ver=v.split(".");
          return {major: parseInt(ver[0]), 
       minor: parseInt(ver[1]), 
       micro: parseInt(ver[2])}
      }
      else 
        if (Array.isArray(v)) {
          return {major: v[0], 
       minor: v[1], 
       micro: v[2]}
      }
      else 
        if (typeof v==="object") {
          let test=(k) =>            {
            return k in v&&typeof v[k]==="number";
          };
          if (!test("major")||!test("minor")||!test("micro")) {
              throw new Error("invalid version object: "+v);
          }
          return v;
      }
      else {
        throw new Error("invalid version "+v);
      }
    }
    const _export_versionLessThan_=function (a, b) {
      return _export_versionToInt_(a)<_export_versionToInt_(b);
    }
    let versionLessThan=_export_versionLessThan_;
    let FileParams=class FileParams  {
       constructor() {
        this.magic = "STRT";
        this.ext = ".bin";
        this.blocktypes = ["DATA"];
        this.version = {major: 0, 
      minor: 0, 
      micro: 1};
      }
    }
    _ESClass.register(FileParams);
    let Block=class Block  {
       constructor(type_magic, data) {
        this.type = type_magic;
        this.data = data;
      }
    }
    _ESClass.register(Block);
    let FileError=class FileeError extends Error {
    }
    _ESClass.register(FileError);
    let FileHelper=class FileHelper  {
       constructor(params) {
        if (params===undefined) {
            params = new FileParams();
        }
        else {
          let fp=new FileParams();
          for (let k in params) {
              fp[k] = params[k];
          }
          params = fp;
        }
        this.version = params.version;
        this.blocktypes = params.blocktypes;
        this.magic = params.magic;
        this.ext = params.ext;
        this.struct = undefined;
        this.unpack_ctx = undefined;
      }
       read(dataview) {
        this.unpack_ctx = new _module_exports_.unpack_context();
        let magic=_module_exports_.unpack_static_string(dataview, this.unpack_ctx, 4);
        if (magic!==this.magic) {
            throw new FileError("corrupted file");
        }
        this.version = {};
        this.version.major = _module_exports_.unpack_short(dataview, this.unpack_ctx);
        this.version.minor = _module_exports_.unpack_byte(dataview, this.unpack_ctx);
        this.version.micro = _module_exports_.unpack_byte(dataview, this.unpack_ctx);
        let struct=this.struct = new _module_exports_$1.STRUCT();
        let scripts=_module_exports_.unpack_string(dataview, this.unpack_ctx);
        this.struct.parse_structs(scripts, _module_exports_$1.manager);
        let blocks=[];
        let dviewlen=dataview.buffer.byteLength;
        while (this.unpack_ctx.i<dviewlen) {
          let type=_module_exports_.unpack_static_string(dataview, this.unpack_ctx, 4);
          let datalen=_module_exports_.unpack_int(dataview, this.unpack_ctx);
          let bstruct=_module_exports_.unpack_int(dataview, this.unpack_ctx);
          let bdata;
          if (bstruct==-2) {
              bdata = _module_exports_.unpack_static_string(dataview, this.unpack_ctx, datalen);
          }
          else {
            bdata = _module_exports_.unpack_bytes(dataview, this.unpack_ctx, datalen);
            bdata = struct.read_object(bdata, bstruct, new _module_exports_.unpack_context());
          }
          let block=new Block();
          block.type = type;
          block.data = bdata;
          blocks.push(block);
        }
        this.blocks = blocks;
        return blocks;
      }
       doVersions(old) {
        let blocks=this.blocks;
        if (versionLessThan(old, "0.0.1")) {
        }
      }
       write(blocks) {
        this.struct = _module_exports_$1.manager;
        this.blocks = blocks;
        let data=[];
        _module_exports_.pack_static_string(data, this.magic, 4);
        _module_exports_.pack_short(data, this.version.major);
        _module_exports_.pack_byte(data, this.version.minor&255);
        _module_exports_.pack_byte(data, this.version.micro&255);
        let scripts=_module_exports_$1.write_scripts();
        _module_exports_.pack_string(data, scripts);
        let struct=this.struct;
        for (let block of blocks) {
            if (typeof block.data==="string") {
                _module_exports_.pack_static_string(data, block.type, 4);
                _module_exports_.pack_int(data, block.data.length);
                _module_exports_.pack_int(data, -2);
                _module_exports_.pack_static_string(data, block.data, block.data.length);
                continue;
            }
            let structName=block.data.constructor.structName;
            if (structName===undefined||!(structName in struct.structs)) {
                throw new Error("Non-STRUCTable object "+block.data);
            }
            let data2=[];
            let stt=struct.structs[structName];
            struct.write_object(data2, block.data);
            _module_exports_.pack_static_string(data, block.type, 4);
            _module_exports_.pack_int(data, data2.length);
            _module_exports_.pack_int(data, stt.id);
            _module_exports_.pack_bytes(data, data2);
        }
        return new DataView(new Uint8Array(data).buffer);
      }
       writeBase64(blocks) {
        let dataview=this.write(blocks);
        let str="";
        let bytes=new Uint8Array(dataview.buffer);
        for (let i=0; i<bytes.length; i++) {
            str+=String.fromCharCode(bytes[i]);
        }
        return btoa(str);
      }
       makeBlock(type, data) {
        return new Block(type, data);
      }
       readBase64(base64) {
        let data=atob(base64);
        let data2=new Uint8Array(data.length);
        for (let i=0; i<data.length; i++) {
            data2[i] = data.charCodeAt(i);
        }
        return this.read(new DataView(data2.buffer));
      }
    }
    _ESClass.register(FileHelper);
    var struct_filehelper=Object.freeze({__proto__: null, 
    versionToInt: _export_versionToInt_, 
    versionCoerce: _export_versionCoerce_, 
    versionLessThan: _export_versionLessThan_, 
    FileParams: FileParams, 
    Block: Block, 
    FileError: FileError, 
    FileHelper: FileHelper});
    var struct_typesystem=Object.freeze({__proto__: null});
    if (typeof window!=="undefined") {
        window._nGlobal = window;
    }
    else 
      if (typeof self!=="undefined") {
        self._nGlobal = self;
    }
    else {
      global._nGlobal = global;
    }
    _nGlobal._structEval = eval;
    const _module_exports_$2={}
    _module_exports_$2.unpack_context = _module_exports_.unpack_context;
    Object.defineProperty(_module_exports_$2, "STRUCT_ENDIAN", {get: function () {
        return _module_exports_.STRUCT_ENDIAN;
      }, 
    set: function (val) {
        _module_exports_.STRUCT_ENDIAN = val;
      }});
    for (let k in _module_exports_$1) {
        _module_exports_$2[k] = _module_exports_$1[k];
    }
    var StructTypeMap$2=StructTypeMap;
    var StructTypes$2=StructTypes;
    var Class=undefined;
    for (var k in _module_exports_$1) {
        _module_exports_$2[k] = _module_exports_$1[k];
    }
    _module_exports_$2.truncateDollarSign = function (value) {
      if (value===undefined) {
          value = true;
      }
      _module_exports_$1.truncateDollarSign = !!value;
    }
    _module_exports_$2.validateStructs = function validateStructs(onerror) {
      return _module_exports_$2.manager.validateStructs(onerror);
    }
    _module_exports_$2.setAllowOverriding = function setAllowOverriding(t) {
      return _module_exports_$2.manager.allowOverriding = !!t;
    }
    _module_exports_$2.isRegistered = function isRegistered(cls) {
      return _module_exports_$2.manager.isRegistered(cls);
    }
    _module_exports_$2.register = function register(cls, structName) {
      return _module_exports_$2.manager.register(cls, structName);
    }
    _module_exports_$2.unregister = function unregister(cls) {
      _module_exports_$2.manager.unregister(cls);
    }
    _module_exports_$2.inherit = function (child, parent, structName) {
      if (structName===undefined) {
          structName = child.name;
      }
      return _module_exports_$2.STRUCT.inherit(...arguments);
    }
    _module_exports_$2.readObject = function (data, cls, __uctx) {
      if (__uctx===undefined) {
          __uctx = undefined;
      }
      return _module_exports_$2.manager.readObject(data, cls, __uctx);
    }
    _module_exports_$2.writeObject = function (data, obj) {
      return _module_exports_$2.manager.writeObject(data, obj);
    }
    _module_exports_$2.writeJSON = function (obj) {
      return _module_exports_$2.manager.writeJSON(obj);
    }
    _module_exports_$2.readJSON = function (json, class_or_struct_id) {
      return _module_exports_$2.manager.readJSON(json, class_or_struct_id);
    }
    _module_exports_$2.setDebugMode = _module_exports_$1.setDebugMode;
    _module_exports_$2.setWarningMode = _module_exports_$1.setWarningMode;
    _module_exports_$2.useTinyEval = () =>      {    }
    _module_exports_$2.binpack = _module_exports_;
    _module_exports_$2.util = struct_util;
    _module_exports_$2.typesystem = struct_typesystem;
    _module_exports_$2.parseutil = struct_parseutil;
    _module_exports_$2.parser = struct_parser;
    _module_exports_$2.filehelper = struct_filehelper;
    module.exports = _module_exports_$2;
    let glob=!((typeof window==="undefined"&&typeof self==="undefined")&&typeof global!=="undefined");
    glob = glob||(typeof global!=="undefined"&&typeof global.require==="undefined");
    if (glob) {
        _nGlobal.nstructjs = module.exports;
        _nGlobal.module = undefined;
    }
    return module.exports;
  })();
  if (typeof window==="undefined"&&typeof global!=="undefined"&&typeof module!=="undefined") {
      console.log("Nodejs!", nexports);
      module.exports = exports = nexports;
  }
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/nstructjs.js');


es6_module_define('parseutil', [], function _parseutil_module(_es6_module) {
  class token  {
     constructor(type, val, lexpos, lexlen, lineno, lexer, parser) {
      this.type = type;
      this.value = val;
      this.lexpos = lexpos;
      this.lexlen = lexlen;
      this.lineno = lineno;
      this.lexer = lexer;
      this.parser = parser;
    }
     setValue(val) {
      this.value = val;
      return this;
    }
     toString() {
      if (this.value!==undefined)
        return "token(type="+this.type+", value='"+this.value+"')";
      else 
        return "token(type="+this.type+")";
    }
  }
  _ESClass.register(token);
  _es6_module.add_class(token);
  token = _es6_module.add_export('token', token);
  class tokdef  {
     constructor(name, regexpr, func) {
      this.name = name;
      this.re = regexpr;
      this.func = func;
    }
  }
  _ESClass.register(tokdef);
  _es6_module.add_class(tokdef);
  tokdef = _es6_module.add_export('tokdef', tokdef);
  class PUTLParseError extends Error {
  }
  _ESClass.register(PUTLParseError);
  _es6_module.add_class(PUTLParseError);
  PUTLParseError = _es6_module.add_export('PUTLParseError', PUTLParseError);
  class lexer  {
     constructor(tokdef, errfunc) {
      this.tokdef = tokdef;
      this.tokens = new Array();
      this.lexpos = 0;
      this.lexdata = "";
      this.lineno = 0;
      this.errfunc = errfunc;
      this.tokints = {};
      for (var i=0; i<tokdef.length; i++) {
          this.tokints[tokdef[i].name] = i;
      }
      this.statestack = [["__main__", 0]];
      this.states = {"__main__": [tokdef, errfunc]};
      this.statedata = 0;
    }
     copy() {
      let ret=new lexer(this.tokdef, this.errfunc);
      for (let k in this.states) {
          let state=this.states[k];
          state = [state[0], state[1]];
          ret.states[k] = state;
      }
      ret.statedata = this.statedata;
      return ret;
    }
     add_state(name, tokdef, errfunc) {
      if (errfunc===undefined) {
          errfunc = function (lexer) {
            return true;
          };
      }
      this.states[name] = [tokdef, errfunc];
    }
     tok_int(name) {

    }
     push_state(state, statedata) {
      this.statestack.push([state, statedata]);
      state = this.states[state];
      this.statedata = statedata;
      this.tokdef = state[0];
      this.errfunc = state[1];
    }
     pop_state() {
      var item=this.statestack[this.statestack.length-1];
      var state=this.states[item[0]];
      this.tokdef = state[0];
      this.errfunc = state[1];
      this.statedata = item[1];
    }
     input(str) {
      while (this.statestack.length>1) {
        this.pop_state();
      }
      this.lexdata = str;
      this.lexpos = 0;
      this.lineno = 0;
      this.tokens = new Array();
      this.peeked_tokens = [];
    }
     error() {
      if (this.errfunc!==undefined&&!this.errfunc(this))
        return ;
      console.log("Syntax error near line "+this.lineno);
      var next=Math.min(this.lexpos+8, this.lexdata.length);
      console.log("  "+this.lexdata.slice(this.lexpos, next));
      throw new PUTLParseError("Parse error");
    }
     peek() {
      var tok=this.next(true);
      if (tok===undefined)
        return undefined;
      this.peeked_tokens.push(tok);
      return tok;
    }
     peek_i(i) {
      while (this.peeked_tokens.length<=i) {
        var t=this.peek();
        if (t===undefined)
          return undefined;
      }
      return this.peeked_tokens[i];
    }
     at_end() {
      return this.lexpos>=this.lexdata.length&&this.peeked_tokens.length==0;
    }
     next(ignore_peek) {
      if (ignore_peek!==true&&this.peeked_tokens.length>0) {
          var tok=this.peeked_tokens[0];
          this.peeked_tokens.shift();
          return tok;
      }
      if (this.lexpos>=this.lexdata.length)
        return undefined;
      var ts=this.tokdef;
      var tlen=ts.length;
      var lexdata=this.lexdata.slice(this.lexpos, this.lexdata.length);
      var results=[];
      for (var i=0; i<tlen; i++) {
          var t=ts[i];
          if (t.re===undefined)
            continue;
          var res=t.re.exec(lexdata);
          if (res!==null&&res!==undefined&&res.index===0) {
              results.push([t, res]);
          }
      }
      var max_res=0;
      var theres=undefined;
      for (var i=0; i<results.length; i++) {
          var res=results[i];
          if (res[1][0].length>max_res) {
              theres = res;
              max_res = res[1][0].length;
          }
      }
      if (theres===undefined) {
          this.error();
          return ;
      }
      var def=theres[0];
      var lexlen=max_res;
      var tok=new token(def.name, theres[1][0], this.lexpos, lexlen, this.lineno, this, undefined);
      this.lexpos+=max_res;
      if (def.func) {
          tok = def.func(tok);
          if (tok===undefined) {
              return this.next();
          }
      }
      return tok;
    }
  }
  _ESClass.register(lexer);
  _es6_module.add_class(lexer);
  lexer = _es6_module.add_export('lexer', lexer);
  class parser  {
     constructor(lexer, errfunc) {
      this.lexer = lexer;
      this.errfunc = errfunc;
      this.start = undefined;
      this.userdata = undefined;
    }
     copy() {
      let ret=new parser(this.lexer.copy(), this.errfunc);
      ret.start = this.start;
      return ret;
    }
     parse(data, err_on_unconsumed) {
      if (err_on_unconsumed===undefined)
        err_on_unconsumed = true;
      if (data!==undefined)
        this.lexer.input(data);
      var ret=this.start(this);
      if (err_on_unconsumed&&!this.lexer.at_end()&&this.lexer.next()!==undefined) {
          this.error(undefined, "parser did not consume entire input");
      }
      return ret;
    }
     input(data) {
      this.lexer.input(data);
    }
     error(tok, msg) {
      if (msg==undefined)
        msg = "";
      if (tok==undefined)
        var estr="Parse error at end of input: "+msg;
      else 
        estr = "Parse error at line "+(tok.lineno+1)+": "+msg;
      var buf="1| ";
      var ld=this.lexer.lexdata;
      var l=1;
      for (var i=0; i<ld.length; i++) {
          var c=ld[i];
          if (c=='\n') {
              l++;
              buf+="\n"+l+"| ";
          }
          else {
            buf+=c;
          }
      }
      console.log("------------------");
      console.log(buf);
      console.log("==================");
      console.log(estr);
      if (this.errfunc&&!this.errfunc(tok)) {
          return ;
      }
      throw new PUTLParseError(estr);
    }
     peek() {
      var tok=this.lexer.peek();
      if (tok!=undefined)
        tok.parser = this;
      return tok;
    }
     peek_i(i) {
      var tok=this.lexer.peek_i(i);
      if (tok!==undefined)
        tok.parser = this;
      return tok;
    }
     peeknext() {
      return this.peek_i(0);
    }
     next() {
      var tok=this.lexer.next();
      if (tok!==undefined)
        tok.parser = this;
      return tok;
    }
     optional(type) {
      var tok=this.peek_i(0);
      if (tok&&tok.type===type) {
          this.next();
          return true;
      }
      return false;
    }
     at_end() {
      return this.lexer.at_end();
    }
     expect(type, msg) {
      var tok=this.next();
      if (msg==undefined)
        msg = type;
      if (tok==undefined||tok.type!=type) {
          this.error(tok, "Expected "+msg+", not "+tok.type);
      }
      return tok.value;
    }
  }
  _ESClass.register(parser);
  _es6_module.add_class(parser);
  parser = _es6_module.add_export('parser', parser);
  function test_parser() {
    var basic_types=new set(["int", "float", "double", "vec2", "vec3", "vec4", "mat4", "string"]);
    var reserved_tokens=new set(["int", "float", "double", "vec2", "vec3", "vec4", "mat4", "string", "static_string", "array"]);
    function tk(name, re, func) {
      return new tokdef(name, re, func);
    }
    var tokens=[tk("ID", /[a-zA-Z]+[a-zA-Z0-9_]*/, function (t) {
      if (reserved_tokens.has(t.value)) {
          t.type = t.value.toUpperCase();
      }
      return t;
    }), tk("OPEN", /\{/), tk("CLOSE", /}/), tk("COLON", /:/), tk("JSCRIPT", /\|/, function (t) {
      var js="";
      var lexer=t.lexer;
      while (lexer.lexpos<lexer.lexdata.length) {
        var c=lexer.lexdata[lexer.lexpos];
        if (c=="\n")
          break;
        js+=c;
        lexer.lexpos++;
      }
      if (js.endsWith(";")) {
          js = js.slice(0, js.length-1);
          lexer.lexpos--;
      }
      t.value = js;
      return t;
    }), tk("LPARAM", /\(/), tk("RPARAM", /\)/), tk("COMMA", /,/), tk("NUM", /[0-9]/), tk("SEMI", /;/), tk("NEWLINE", /\n/, function (t) {
      t.lexer.lineno+=1;
    }), tk("SPACE", / |\t/, function (t) {
    })];
    for (var rt in reserved_tokens) {
        tokens.push(tk(rt.toUpperCase()));
    }
    function errfunc(lexer) {
      return true;
    }
    var lex=new lexer(tokens, errfunc);
    console.log("Testing lexical scanner...");
    lex.input(a);
    var tok;
    while (tok = lex.next()) {
      console.log(tok.toString());
    }
    var parser=new parser(lex);
    parser.input(a);
    function p_Array(p) {
      p.expect("ARRAY");
      p.expect("LPARAM");
      var arraytype=p_Type(p);
      var itername="";
      if (p.optional("COMMA")) {
          itername = arraytype;
          arraytype = p_Type(p);
      }
      p.expect("RPARAM");
      return {type: "array", 
     data: {type: arraytype, 
      iname: itername}}
    }
    function p_Type(p) {
      var tok=p.peek();
      if (tok.type=="ID") {
          p.next();
          return {type: "struct", 
       data: "\""+tok.value+"\""}
      }
      else 
        if (basic_types.has(tok.type.toLowerCase())) {
          p.next();
          return {type: tok.type.toLowerCase()}
      }
      else 
        if (tok.type=="ARRAY") {
          return p_Array(p);
      }
      else {
        p.error(tok, "invalid type "+tok.type);
      }
    }
    function p_Field(p) {
      var field={}
      console.log("-----", p.peek().type);
      field.name = p.expect("ID", "struct field name");
      p.expect("COLON");
      field.type = p_Type(p);
      field.set = undefined;
      field.get = undefined;
      var tok=p.peek();
      if (tok.type=="JSCRIPT") {
          field.get = tok.value;
          p.next();
      }
      tok = p.peek();
      if (tok.type=="JSCRIPT") {
          field.set = tok.value;
          p.next();
      }
      p.expect("SEMI");
      return field;
    }
    function p_Struct(p) {
      var st={}
      st.name = p.expect("ID", "struct name");
      st.fields = [];
      p.expect("OPEN");
      while (1) {
        if (p.at_end()) {
            p.error(undefined);
        }
        else 
          if (p.optional("CLOSE")) {
            break;
        }
        else {
          st.fields.push(p_Field(p));
        }
      }
      return st;
    }
    var ret=p_Struct(parser);
    console.log(JSON.stringify(ret));
  }
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/parseutil.js');


es6_module_define('simple_events', ["./util.js", "./vectormath.js", "../config/config.js"], function _simple_events_module(_es6_module) {
  var util=es6_import(_es6_module, './util.js');
  var cconst=es6_import_item(_es6_module, '../config/config.js', 'default');
  var Vector2=es6_import_item(_es6_module, './vectormath.js', 'Vector2');
  let modalstack=[];
  modalstack = _es6_module.add_export('modalstack', modalstack);
  let singleMouseCBs={}
  function singletonMouseEvents() {
    let keys=["mousedown", "mouseup", "mousemove"];
    for (let k of keys) {
        singleMouseCBs[k] = new Set();
    }
    let ddd=-1.0;
    window.testSingleMouseUpEvent = (type) =>      {
      if (type===undefined) {
          type = "mousedown";
      }
      let id=ddd++;
      singleMouseEvent(() =>        {
        console.log("mouse event", id);
      }, type);
    }
    let _mpos=new Vector2();
    function doSingleCbs(e, type) {
      let list=singleMouseCBs[type];
      singleMouseCBs[type] = new Set();
      if (e.type!=="touchend"&&e.type!=="touchcancel") {
          _mpos[0] = e.touches&&e.touches.length>0 ? e.touches[0].pageX : e.x;
          _mpos[1] = e.touches&&e.touches.length>0 ? e.touches[0].pageY : e.y;
      }
      if (e.touches) {
          e = copyEvent(e);
          e.type = type;
          if (e.touches.length>0) {
              e.x = e.pageX = e.touches[0].pageX;
              e.y = e.pageY = e.touches[0].pageY;
          }
          else {
            e.x = _mpos[0];
            e.y = _mpos[1];
          }
      }
      for (let cb of list) {
          try {
            cb(e);
          }
          catch (error) {
              util.print_stack(error);
              console.warn("Error in event callback");
          }
      }
    }
    window.addEventListener("mouseup", (e) =>      {
      doSingleCbs(e, "mouseup");
    }, {capture: true});
    window.addEventListener("touchcancel", (e) =>      {
      doSingleCbs(e, "mouseup");
    }, {capture: true});
    document.addEventListener("touchend", (e) =>      {
      doSingleCbs(e, "mouseup");
    }, {capture: true});
    document.addEventListener("mousedown", (e) =>      {
      doSingleCbs(e, "mousedown");
    }, {capture: true});
    document.addEventListener("touchstart", (e) =>      {
      doSingleCbs(e, "mousedown");
    }, {capture: true});
    document.addEventListener("mousemove", (e) =>      {
      doSingleCbs(e, "mousemove");
    }, {capture: true});
    document.addEventListener("touchmove", (e) =>      {
      doSingleCbs(e, "mousemove");
    }, {capture: true});
    return {singleMouseEvent: function singleMouseEvent(cb, type) {
        if (!(type in singleMouseCBs)) {
            throw new Error("not a mouse event");
        }
        singleMouseCBs[type].add(cb);
      }}
  }
  singletonMouseEvents = singletonMouseEvents();
  function singleMouseEvent(cb, type) {
    return singletonMouseEvents.singleMouseEvent(cb, type);
  }
  singleMouseEvent = _es6_module.add_export('singleMouseEvent', singleMouseEvent);
  function isLeftClick(e) {
    if (e.touches!==undefined) {
        return e.touches.length===1;
    }
    return e.button===0;
  }
  isLeftClick = _es6_module.add_export('isLeftClick', isLeftClick);
  class DoubleClickHandler  {
     constructor() {
      this.down = 0;
      this.last = 0;
      this.dblEvent = undefined;
      this.start_mpos = new Vector2();
      this._on_mouseup = this._on_mouseup.bind(this);
      this._on_mousemove = this._on_mousemove.bind(this);
    }
     _on_mouseup(e) {
      this.mdown = false;
    }
     _on_mousemove(e) {
      let mpos=new Vector2();
      mpos[0] = e.x;
      mpos[1] = e.y;
      let dist=mpos.vectorDistance(this.start_mpos)*devicePixelRatio;
      if (dist>11) {
          this.mdown = false;
      }
      if (this.mdown) {
          singleMouseEvent(this._on_mousemove, "mousemove");
      }
      this.update();
    }
     mousedown(e) {
      if (!this.last) {
          this.last = 0;
      }
      if (!this.down) {
          this.down = 0;
      }
      if (!this.up) {
          this.up = 0;
      }
      if (isMouseDown(e)) {
          this.mdown = true;
          let cpy=Object.assign({}, e);
          this.start_mpos[0] = e.x;
          this.start_mpos[1] = e.y;
          singleMouseEvent(this._on_mousemove, "mousemove");
          if (e.type.search("touch")>=0&&e.touches.length>0) {
              cpy.x = cpy.pageX = e.touches[0].pageX;
              cpy.y = cpy.pageY = e.touches[1].pageY;
          }
          else {
            cpy.x = cpy.pageX = e.x;
            cpy.y = cpy.pageY = e.y;
          }
          this.dblEvent = copyEvent(e);
          this.dblEvent.type = "dblclick";
          this.last = this.down;
          this.down = util.time_ms();
          if (this.down-this.last<cconst.doubleClickTime) {
              this.mdown = false;
              this.ondblclick(this.dblEvent);
              this.down = this.last = 0.0;
          }
          else {
            singleMouseEvent(this._on_mouseup, "mouseup");
          }
      }
      else {
        this.mdown = false;
      }
    }
     ondblclick(e) {

    }
     update() {
      if (modalstack.length>0) {
          this.mdown = false;
      }
      if (this.mdown&&util.time_ms()-this.down>cconst.doubleClickHoldTime) {
          this.mdown = false;
          this.ondblclick(this.dblEvent);
      }
    }
     abort() {
      this.last = this.down = 0;
    }
  }
  _ESClass.register(DoubleClickHandler);
  _es6_module.add_class(DoubleClickHandler);
  DoubleClickHandler = _es6_module.add_export('DoubleClickHandler', DoubleClickHandler);
  function isMouseDown(e) {
    let mdown=0;
    if (e.touches!==undefined) {
        mdown = e.touches.length>0;
    }
    else {
      mdown = e.buttons;
    }
    mdown = mdown&1;
    return mdown;
  }
  isMouseDown = _es6_module.add_export('isMouseDown', isMouseDown);
  function pathDebugEvent(e, extra) {
    e.__prevdef = e.preventDefault;
    e.__stopprop = e.stopPropagation;
    e.preventDefault = function () {
      console.warn("preventDefault", extra);
      return this.__prevdef();
    }
    e.stopPropagation = function () {
      console.warn("stopPropagation", extra);
      return this.__stopprop();
    }
  }
  pathDebugEvent = _es6_module.add_export('pathDebugEvent', pathDebugEvent);
  function eventWasTouch(e) {
    let ret=e.sourceCapabilities&&e.sourceCapabilities.firesTouchEvents;
    ret = ret||e.was_touch;
    ret = ret||e.touches!==undefined;
    return ret;
  }
  eventWasTouch = _es6_module.add_export('eventWasTouch', eventWasTouch);
  function copyEvent(e) {
    let ret={}
    let keys=[];
    for (let k in e) {
        keys.push(k);
    }
    keys = keys.concat(Object.getOwnPropertySymbols(e));
    keys = keys.concat(Object.getOwnPropertyNames(e));
    for (let k of keys) {
        let v;
        try {
          v = e[k];
        }
        catch (error) {
            console.warn("read error for event key", k);
            continue;
        }
        if (typeof v=="function") {
            ret[k] = v.bind(e);
        }
        else {
          ret[k] = v;
        }
    }
    ret.original = e;
    return ret;
  }
  copyEvent = _es6_module.add_export('copyEvent', copyEvent);
  let Screen;
  function _setScreenClass(cls) {
    Screen = cls;
  }
  _setScreenClass = _es6_module.add_export('_setScreenClass', _setScreenClass);
  function findScreen() {
    let rec=(n) =>      {
      for (let n2 of n.childNodes) {
          if (n2&&typeof n2==="object"&&__instance_of(n2, Screen)) {
              return n2;
          }
      }
      for (let n2 of n.childNodes) {
          let ret=rec(n2);
          if (ret) {
              return ret;
          }
      }
    }
    return rec(document.body);
  }
  window._findScreen = findScreen;
  function pushModalLight(obj, autoStopPropagation) {
    if (autoStopPropagation===undefined) {
        autoStopPropagation = true;
    }
    if (cconst.DEBUG.modalEvents) {
        console.warn("pushModalLight");
    }
    let keys=new Set(["keydown", "keyup", "keypress", "mousedown", "mouseup", "touchstart", "touchend", "touchcancel", "mousewheel", "mousemove", "mouseover", "mouseout", "mouseenter", "mouseleave", "dragstart", "drag", "dragend", "dragexit", "dragleave", "dragover", "dragenter", "drop", "pointerdown", "pointermove", "pointerup", "pointercancel"]);
    let ret={keys: keys, 
    handlers: {}, 
    last_mpos: [0, 0]}
    let touchmap={"touchstart": "mousedown", 
    "touchmove": "mousemove", 
    "touchend": "mouseup", 
    "touchcancel": "mouseup"}
    let mpos=[0, 0];
    let screen=findScreen();
    if (screen) {
        mpos[0] = screen.mpos[0];
        mpos[1] = screen.mpos[1];
        screen = undefined;
    }
    function handleAreaContext() {
      let screen=findScreen();
      if (screen) {
          let sarea=screen.findScreenArea(mpos[0], mpos[1]);
          if (sarea&&sarea.area) {
              sarea.area.push_ctx_active();
              sarea.area.pop_ctx_active();
          }
      }
    }
    function make_default_touchhandler(type, state) {
      return function (e) {
        if (cconst.DEBUG.domEvents) {
            pathDebugEvent(e);
        }
        if (touchmap[type] in ret.handlers) {
            let type2=touchmap[type];
            let e2=copyEvent(e);
            e2.was_touch = true;
            e2.type = type2;
            e2.button = type=="touchcancel" ? 1 : 0;
            e2.touches = e.touches;
            if (e.touches.length>0) {
                let dpi=window.devicePixelRatio;
                let t=e.touches[0];
                mpos[0] = t.pageX;
                mpos[1] = t.pageY;
                e2.pageX = e2.x = t.pageX;
                e2.pageY = e2.y = t.pageY;
                e2.clientX = t.clientX;
                e2.clientY = t.clientY;
                e2.x = t.clientX;
                e2.y = t.clientY;
                ret.last_mpos[0] = e2.x;
                ret.last_mpos[1] = e2.y;
            }
            else {
              e2.x = e2.clientX = e2.pageX = e2.screenX = ret.last_mpos[0];
              e2.y = e2.clientY = e2.pageY = e2.screenY = ret.last_mpos[1];
            }
            e2.was_touch = true;
            handleAreaContext();
            ret.handlers[type2](e2);
        }
        if (autoStopPropagation) {
            e.preventDefault();
            e.stopPropagation();
        }
      }
    }
    function make_handler(type, key) {
      return function (e) {
        if (cconst.DEBUG.domEvents) {
            pathDebugEvent(e);
        }
        if (typeof key!=="string") {
            return ;
        }
        if (key.startsWith("mouse")) {
            mpos[0] = e.pageX;
            mpos[1] = e.pageY;
        }
        handleAreaContext();
        if (key!==undefined)
          obj[key](e);
        if (autoStopPropagation) {
            e.preventDefault();
            e.stopPropagation();
        }
      }
    }
    let found={}
    for (let k of keys) {
        let key;
        if (obj[k])
          key = k;
        else 
          if (obj["on"+k])
          key = "on"+k;
        else 
          if (obj["on_"+k])
          key = "on_"+k;
        else 
          if (k in touchmap)
          continue;
        else 
          key = undefined;
        if (key===undefined&&k.search("pointer")===0) {
            continue;
        }
        if (key!==undefined) {
            found[k] = 1;
        }
        let handler=make_handler(k, key);
        ret.handlers[k] = handler;
        let settings=handler.settings = {passive: false, 
      capture: true};
        window.addEventListener(k, handler, settings);
    }
    for (let k in touchmap) {
        if (!(k in found)) {
            ret.handlers[k] = make_default_touchhandler(k, ret);
            let settings=ret.handlers[k].settings = {passive: false, 
        capture: true};
            window.addEventListener(k, ret.handlers[k], settings);
        }
    }
    modalstack.push(ret);
    return ret;
  }
  pushModalLight = _es6_module.add_export('pushModalLight', pushModalLight);
  if (0) {
      let addevent=EventTarget.prototype.addEventListener;
      let remevent=EventTarget.prototype.removeEventListener;
      const funckey=Symbol("eventfunc");
      EventTarget.prototype.addEventListener = function (name, func, args) {
        console.warn("listener added", name, func, args);
        let func2=function (e) {
          let proxy=new Proxy(e, {get: function get(target, p, receiver) {
              if (p==="preventDefault") {
                  return function () {
                    console.warn("preventDefault", name, arguments);
                    return e.preventDefault(...arguments);
                  }
              }
              else 
                if (p==="stopPropagation") {
                  return function () {
                    console.warn("stopPropagation", name, arguments);
                    return e.preventDefault(...arguments);
                  }
              }
              return e[p];
            }});
          return func.call(this, proxy);
        }
        func[funckey] = func2;
        return addevent.call(this, name, func2, args);
      };
      EventTarget.prototype.removeEventListener = function (name, func, args) {
        console.warn("listener removed", name, func, args);
        func = func[funckey];
        return remevent.call(this, name, func, args);
      };
  }
  function popModalLight(state) {
    if (state===undefined) {
        console.warn("Bad call to popModalLight: state was undefined");
        return ;
    }
    if (state!==modalstack[modalstack.length-1]) {
        if (modalstack.indexOf(state)<0) {
            console.warn("Error in popModalLight; modal handler not found");
            return ;
        }
        else {
          console.warn("Error in popModalLight; called in wrong order");
        }
    }
    for (let k in state.handlers) {
        window.removeEventListener(k, state.handlers[k], state.handlers[k].settings);
    }
    state.handlers = {}
    modalstack.remove(state);
    if (cconst.DEBUG.modalEvents) {
        console.warn("popModalLight", modalstack);
    }
  }
  popModalLight = _es6_module.add_export('popModalLight', popModalLight);
  function haveModal() {
    return modalstack.length>0;
  }
  haveModal = _es6_module.add_export('haveModal', haveModal);
  window._haveModal = haveModal;
  var keymap_latin_1={"Space": 32, 
   "Escape": 27, 
   "Enter": 13, 
   "Return": 13, 
   "Up": 38, 
   "Down": 40, 
   "Left": 37, 
   "Right": 39, 
   "Num0": 96, 
   "Num1": 97, 
   "Num2": 98, 
   "Num3": 99, 
   "Num4": 100, 
   "Num5": 101, 
   "Num6": 102, 
   "Num7": 103, 
   "Num8": 104, 
   "Num9": 105, 
   "Home": 36, 
   "End": 35, 
   "Delete": 46, 
   "Backspace": 8, 
   "Insert": 45, 
   "PageUp": 33, 
   "PageDown": 34, 
   "Tab": 9, 
   "-": 189, 
   "=": 187, 
   ".": 190, 
   "/": 191, 
   ",": 188, 
   ";": 186, 
   "'": 222, 
   "[": 219, 
   "]": 221, 
   "NumPlus": 107, 
   "NumMinus": 109, 
   "Shift": 16, 
   "Ctrl": 17, 
   "Control": 17, 
   "Alt": 18}
  keymap_latin_1 = _es6_module.add_export('keymap_latin_1', keymap_latin_1);
  for (var i=0; i<26; i++) {
      keymap_latin_1[String.fromCharCode(i+65)] = i+65;
  }
  for (var i=0; i<10; i++) {
      keymap_latin_1[String.fromCharCode(i+48)] = i+48;
  }
  for (var k in keymap_latin_1) {
      if (!(k in keymap_latin_1)) {
          keymap_latin_1[keymap_latin_1[k]] = k;
      }
  }
  var keymap_latin_1_rev={}
  for (var k in keymap_latin_1) {
      keymap_latin_1_rev[keymap_latin_1[k]] = k;
  }
  var keymap=keymap_latin_1;
  keymap = _es6_module.add_export('keymap', keymap);
  var reverse_keymap=keymap_latin_1_rev;
  reverse_keymap = _es6_module.add_export('reverse_keymap', reverse_keymap);
  class HotKey  {
     constructor(key, modifiers, action, uiname) {
      this.action = action;
      this.mods = modifiers;
      this.key = keymap[key];
      this.uiname = uiname;
    }
     exec(ctx) {
      if (typeof this.action=="string") {
          ctx.api.execTool(ctx, this.action);
      }
      else {
        this.action(ctx);
      }
    }
     buildString() {
      let s="";
      for (let i=0; i<this.mods.length; i++) {
          if (i>0) {
              s+=" + ";
          }
          let k=this.mods[i].toLowerCase();
          k = k[0].toUpperCase()+k.slice(1, k.length).toLowerCase();
          s+=k;
      }
      if (this.mods.length>0) {
          s+="+";
      }
      s+=reverse_keymap[this.key];
      return s.trim();
    }
  }
  _ESClass.register(HotKey);
  _es6_module.add_class(HotKey);
  HotKey = _es6_module.add_export('HotKey', HotKey);
  class KeyMap extends Array {
     constructor(hotkeys=[], pathid="undefined") {
      super();
      this.pathid = pathid;
      for (let hk of hotkeys) {
          this.add(hk);
      }
    }
     handle(ctx, e) {
      let mods=new util.set();
      if (e.shiftKey)
        mods.add("shift");
      if (e.altKey)
        mods.add("alt");
      if (e.ctrlKey) {
          mods.add("ctrl");
      }
      if (e.commandKey) {
          mods.add("command");
      }
      for (let hk of this) {
          let ok=e.keyCode===hk.key;
          if (!ok)
            continue;
          let count=0;
          for (let m of hk.mods) {
              m = m.toLowerCase().trim();
              if (!mods.has(m)) {
                  ok = false;
                  break;
              }
              count++;
          }
          if (count!==mods.length) {
              ok = false;
          }
          if (ok) {
              console.log("handling hotkey", hk, this);
              try {
                hk.exec(ctx);
              }
              catch (error) {
                  util.print_stack(error);
                  console.log("failed to execute a hotkey", keymap[e.keyCode]);
              }
              return true;
          }
      }
    }
     add(hk) {
      this.push(hk);
    }
     push(hk) {
      super.push(hk);
    }
  }
  _ESClass.register(KeyMap);
  _es6_module.add_class(KeyMap);
  KeyMap = _es6_module.add_export('KeyMap', KeyMap);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/simple_events.js');


es6_module_define('solver', ["./math.js", "./vectormath.js", "./util.js"], function _solver_module(_es6_module) {
  var Vector2=es6_import_item(_es6_module, './vectormath.js', 'Vector2');
  var math=es6_import(_es6_module, './math.js');
  var util=es6_import(_es6_module, './util.js');
  class Constraint  {
     constructor(name, func, klst, params, k=1.0) {
      this.glst = [];
      this.klst = klst;
      this.k = k;
      this.params = params;
      this.name = name;
      for (let ks of klst) {
          this.glst.push(new Float64Array(ks.length));
      }
      this.df = 0.0005;
      this.threshold = 0.0001;
      this.func = func;
      this.funcDv = null;
    }
     evaluate(no_dvs=false) {
      let r1=this.func(this.params);
      if (this.funcDv) {
          this.funcDv(this.params, this.glst);
          return r1;
      }
      if (Math.abs(r1)<this.threshold)
        return 0.0;
      let df=this.df;
      if (no_dvs)
        return r1;
      for (let i=0; i<this.klst.length; i++) {
          let gs=this.glst[i];
          let ks=this.klst[i];
          for (let j=0; j<ks.length; j++) {
              let orig=ks[j];
              ks[j]+=df;
              let r2=this.func(this.params);
              ks[j] = orig;
              gs[j] = (r2-r1)/df;
          }
      }
      return r1;
    }
  }
  _ESClass.register(Constraint);
  _es6_module.add_class(Constraint);
  Constraint = _es6_module.add_export('Constraint', Constraint);
  class Solver  {
     constructor() {
      this.constraints = [];
      this.gk = 0.99;
      this.simple = false;
      this.randCons = false;
    }
     add(con) {
      this.constraints.push(con);
    }
     solveStep(gk=this.gk) {
      let err=0.0;
      let cons=this.constraints;
      for (let ci=0; ci<cons.length; ci++) {
          let ri=ci;
          if (this.randCons) {
              ri = ~~(Math.random()*this.constraints.length*0.99999);
          }
          let con=cons[ri];
          let r1=con.evaluate();
          if (r1===0.0)
            continue;
          err+=Math.abs(r1);
          let totgs=0.0;
          for (let i=0; i<con.klst.length; i++) {
              let ks=con.klst[i], gs=con.glst[i];
              for (let j=0; j<ks.length; j++) {
                  totgs+=gs[j]*gs[j];
              }
          }
          if (totgs===0.0) {
              continue;
          }
          r1/=totgs;
          for (let i=0; i<con.klst.length; i++) {
              let ks=con.klst[i], gs=con.glst[i];
              for (let j=0; j<ks.length; j++) {
                  ks[j]+=-r1*gs[j]*con.k*gk;
              }
          }
      }
      return err;
    }
     solveStepSimple(gk=this.gk) {
      let err=0.0;
      let cons=this.constraints;
      for (let ci=0; ci<cons.length; ci++) {
          let ri=ci;
          if (this.randCons) {
              ri = ~~(Math.random()*this.constraints.length*0.99999);
          }
          let con=cons[ri];
          let r1=con.evaluate();
          if (r1===0.0)
            continue;
          err+=Math.abs(r1);
          let totgs=0.0;
          for (let i=0; i<con.klst.length; i++) {
              let ks=con.klst[i], gs=con.glst[i];
              for (let j=0; j<ks.length; j++) {
                  totgs+=gs[j]*gs[j];
              }
          }
          if (totgs===0.0) {
              continue;
          }
          totgs = 0.0001/Math.sqrt(totgs);
          for (let i=0; i<con.klst.length; i++) {
              let ks=con.klst[i], gs=con.glst[i];
              for (let j=0; j<ks.length; j++) {
                  ks[j]+=-totgs*gs[j]*con.k*gk;
              }
          }
      }
      return err;
    }
     solve(steps, gk=this.gk, printError=false) {
      let err=0.0;
      for (let i=0; i<steps; i++) {
          if (this.simple) {
              err = this.solveStepSimple(gk);
          }
          else {
            err = this.solveStep(gk);
          }
          if (printError) {
              console.warn("average error:", (err/this.constraints.length).toFixed(4));
          }
          if (err<0.01/this.constraints.length) {
              break;
          }
      }
      return err;
    }
  }
  _ESClass.register(Solver);
  _es6_module.add_class(Solver);
  Solver = _es6_module.add_export('Solver', Solver);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/solver.js');


es6_module_define('struct', ["./nstructjs.js"], function _struct_module(_es6_module) {
  es6_import(_es6_module, './nstructjs.js');
  let nstructjs=window.nstructjs;
  nstructjs = _es6_module.add_export('nstructjs', nstructjs);
  _es6_module.set_default_export(undefined, Object.assign({setEndian: function setEndian(mode) {
      nstructjs.STRUCT_ENDIAN = mode;
    }}, nstructjs));
  
  delete window.nstructjs;
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/struct.js');


es6_module_define('vectormath', ["./struct.js", "./util.js"], function _vectormath_module(_es6_module) {
  var util=es6_import(_es6_module, './util.js');
  var nstructjs=es6_import_item(_es6_module, './struct.js', 'default');
  const EulerOrders={XYZ: 0, 
   XZY: 1, 
   YXZ: 2, 
   YZX: 3, 
   ZXY: 4, 
   ZYX: 5}
  _es6_module.add_export('EulerOrders', EulerOrders);
  window.makeCompiledVectormathCode = function (mode) {
    if (mode===undefined) {
        mode = "es";
    }
    let s="";
    let es6exports=mode==="es";
    function doExports(name) {
      if (es6exports) {
          return "export";
      }
      else {
        return `var ${name} = exports.${name} =`;
      }
    }
    let classes=[Vector2, Vector3, Vector4, a];
    let lens={Vector2: 2, 
    Vector3: 3, 
    Vector4: 4, 
    Quat: 4}
    let modecode="";
    let nstructjscode=`
  let g = typeof window !== "undefined" ? window : "undefined";
  
  g = g || (typeof global !== "undefined" ? global : "undefined");
  g = g || (typeof self !== "undefined" ? self : "undefined");
  g = g || (typeof globals !== "undefined" ? globals : "undefined");

  if (typeof nstructjs === "undefined") {
    //add nstructjs stub
    g.nstructjs = {
      register : function() {}
    }
  }
  `;
    if (mode!=="rjs") {
        if (mode==="commonjs") {
            modecode = `if (typeof module !== "undefined" && typeof exports === "undefined") {
      if (module.exports === undefined) {
        module.exports = {};
      }
      
      g.exports = module.exports;
    } else if (typeof module === "undefined") {
      g.exports = g.vectormath = {};
    }\n`;
        }
        s+=`{
      ${nstructjscode}
    ${modecode}
  }`;
    }
    s+=`
class cachering extends Array {
  constructor(func, size) {
    super()

    this.cur = 0;

    for (var i=0; i<size; i++) {
      this.push(func());
    }
  }

  static fromConstructor(cls, size) {
    var func = function() {
      return new cls();
    }

    return new cachering(func, size);
  }

  next() {
    var ret = this[this.cur];
    this.cur = (this.cur+1)%this.length;

    return ret;
  }
}
`;
    s+=`

var M_SQRT2 = Math.sqrt(2.0);
var FLT_EPSILON = 2.22e-16;  
var sin=Math.sin, cos=Math.cos, abs=Math.abs, log=Math.log,
    asin=Math.asin, exp=Math.exp, acos=Math.acos, fract=Math.fract,
    sign=Math.sign, tent=Math.tent, atan2=Math.atan2, atan=Math.atan,
    pow=Math.pow, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil,
    min=Math.min, max=Math.max, PI=Math.PI, E=2.718281828459045;

var DOT_NORM_SNAP_LIMIT = 0.00000000001;

${doExports("BaseVector")} class BaseVector extends Array {
  constructor() {
    super();
    
    this.vec = undefined; //for compatibility with old files
  }

  copy() {
    return new this.constructor(this);
  }

  load(data) {
    throw new Error("Implement me!");
  }
  
  vectorLength() {
    return sqrt(this.dot(this));
  }
  
  normalize() {
    var l = this.vectorLength();
    if (l > 0.00000001) {
      this.mulScalar(1.0/l);
    }
    
    return this;
  }
}
  
`;
    function indent(s, pad) {
      if (pad===undefined) {
          pad = "  ";
      }
      let l=s.split("\n");
      let s2="";
      for (let l2 of l) {
          s2+=pad+l2+"\n";
      }
      return s2;
    }
    let i=0;
    for (let cls of classes) {
        s+=doExports(cls.name)+" class "+cls.name+" extends BaseVector {\n";
        let keys=Reflect.ownKeys(cls.prototype);
        for (let k of keys) {
            let v=cls.prototype[k];
            if (typeof v!=="function") {
                continue;
            }
            if (typeof k==="symbol") {
                k = "  ["+k.toString()+"]";
            }
            v = (""+v).trim();
            if (v.startsWith("function(")||v.startsWith("function (")) {
                v = k+v.slice(8, v.length).trim();
            }
            else 
              if (v.startsWith("function")) {
                v = v.slice(8, v.length).trim();
            }
            if (v.endsWith(";}")) {
                v = v.slice(0, v.length-1)+"\n  }\n";
            }
            let zero="";
            let l=lens[cls.name];
            for (let j=0; j<l; j++) {
                if (j>0) {
                    zero+=" = ";
                }
                zero+=`this[${j}]`;
            }
            zero+=" = 0.0";
            if (k==="constructor") {
                s+=`  constructor(data) {
    super(${l});
        
    this.vec = undefined; //for compatibility with old files
    
    if (arguments.length > 1) {
      throw new Error("unexpected argument");
    }

    //this.length = ${l};
    ${zero};

    if (data !== undefined) {
      this.load(data);
    }
  }
`;
            }
            else {
              s+=indent(v);
            }
            s+="\n";
            i++;
        }
        s+="}\n\n";
        s+=`${cls.name}.STRUCT = \`${cls.STRUCT}\`;\n`;
        s+=`nstructjs.register(${cls.name});\n\n`;
    }
    s+="\n\n"+(""+internal_matrix).trim()+"\n";
    s+="\n"+doExports("Matrix4")+Matrix4;
    s+=`\n  Matrix4.STRUCT = \`${Matrix4.STRUCT}\`;\n`;
    s+="nstructjs.register(Matrix4)\n";
    s+=`
  var _quat_vs3_temps = cachering.fromConstructor(Vector3, 64);
  var _v3nd4_n1_normalizedDot4 = new Vector3();
  var _v3nd4_n2_normalizedDot4 = new Vector3();
  var _v3nd_n1_normalizedDot = new Vector3();
  var _v3nd_n2_normalizedDot = new Vector3();

  var $_v3nd4_n1_normalizedDot4 = new Vector3();
  var $_v3nd4_n2_normalizedDot4 = new Vector3();
  var $_v3nd_n1_normalizedDot = new Vector3();
  var $_v3nd_n2_normalizedDot = new Vector3();

  var lookat_cache_vs3 = cachering.fromConstructor(Vector3, 64);
  var lookat_cache_vs4 = cachering.fromConstructor(Vector4, 64);

  var makenormalcache = cachering.fromConstructor(Vector3, 64);
`;
    if (mode==="rjs") {
        s = `define([], function() {
  "use strict";

  let exports = {};

  {
    ${nstructjscode}
  }
  ${indent(s)}

  return exports;
});
`;
    }
    return s;
  }
  var sin=Math.sin, cos=Math.cos, abs=Math.abs, log=Math.log, asin=Math.asin, exp=Math.exp, acos=Math.acos, fract=Math.fract, sign=Math.sign, tent=Math.tent, atan2=Math.atan2, atan=Math.atan, pow=Math.pow, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, min=Math.min, max=Math.max, PI=Math.PI, E=2.718281828459045;
  var DOT_NORM_SNAP_LIMIT=1e-11;
  var M_SQRT2=Math.sqrt(2.0);
  var FLT_EPSILON=2.22e-16;
  var basic_funcs={equals: [["b"], "this[X] === b[X]", "&&"], 
   zero: [[], "0.0;"], 
   negate: [[], "-this[X];"], 
   combine: [["b", "u", "v"], "this[X]*u + this[X]*v;"], 
   interp: [["b", "t"], "this[X] + (b[X] - this[X])*t;"], 
   add: [["b"], "this[X] + b[X];"], 
   addFac: [["b", "F"], "this[X] + b[X]*F;"], 
   fract: [[], "Math.fract(this[X]);"], 
   sub: [["b"], "this[X] - b[X];"], 
   mul: [["b"], "this[X] * b[X];"], 
   div: [["b"], "this[X] / b[X];"], 
   mulScalar: [["b"], "this[X] * b;"], 
   divScalar: [["b"], "this[X] / b;"], 
   addScalar: [["b"], "this[X] + b;"], 
   subScalar: [["b"], "this[X] - b;"], 
   minScalar: [["b"], "Math.min(this[X], b);"], 
   maxScalar: [["b"], "Math.max(this[X], b);"], 
   ceil: [[], "Math.ceil(this[X])"], 
   floor: [[], "Math.floor(this[X])"], 
   abs: [[], "Math.abs(this[X])"], 
   min: [["b"], "Math.min(this[X], b[X])"], 
   max: [["b"], "Math.max(this[X], b[X])"], 
   clamp: [["MIN", "MAX"], "min(max(this[X], MAX), MIN)"]}
  function bounded_acos(fac) {
    if (fac<=-1.0)
      return Math.pi;
    else 
      if (fac>=1.0)
      return 0.0;
    else 
      return Math.acos(fac);
  }
  function make_norm_safe_dot(cls) {
    var _dot=cls.prototype.dot;
    cls.prototype._dot = _dot;
    cls.prototype.dot = function (b) {
      var ret=_dot.call(this, b);
      if (ret>=1.0-DOT_NORM_SNAP_LIMIT&&ret<=1.0+DOT_NORM_SNAP_LIMIT)
        return 1.0;
      if (ret>=-1.0-DOT_NORM_SNAP_LIMIT&&ret<=-1.0+DOT_NORM_SNAP_LIMIT)
        return -1.0;
      return ret;
    }
  }
  function getBaseVector(parent) {
    return class BaseVector extends parent {
       constructor() {
        super(...arguments);
        this.vec = undefined;
      }
      static  inherit(cls, vectorsize) {
        make_norm_safe_dot(cls);
        var f;
        var vectorDotDistance="f = function vectorDotDistance(b) {\n";
        for (var i=0; i<vectorsize; i++) {
            vectorDotDistance+="  let d"+i+" = this["+i+"]-b["+i+"];\n\n  ";
        }
        vectorDotDistance+="  return ";
        for (var i=0; i<vectorsize; i++) {
            if (i>0)
              vectorDotDistance+=" + ";
            vectorDotDistance+="d"+i+"*d"+i;
        }
        vectorDotDistance+=";\n";
        vectorDotDistance+="};";
        cls.prototype.vectorDotDistance = eval(vectorDotDistance);
        var f;
        var vectorDistance="f = function vectorDistance(b) {\n";
        for (var i=0; i<vectorsize; i++) {
            vectorDistance+=`  let d${i} = this[${i}] - (b[${i}]||0);\n\n  `;
        }
        vectorDistance+="  return Math.sqrt(";
        for (var i=0; i<vectorsize; i++) {
            if (i>0)
              vectorDistance+=" + ";
            vectorDistance+="d"+i+"*d"+i;
        }
        vectorDistance+=");\n";
        vectorDistance+="};";
        cls.prototype.vectorDistance = eval(vectorDistance);
        var vectorDistanceSqr="f = function vectorDistanceSqr(b) {\n";
        for (var i=0; i<vectorsize; i++) {
            vectorDistanceSqr+=`  let d${i} = this[${i}] - (b[${i}]||0);\n\n  `;
        }
        vectorDistanceSqr+="  return (";
        for (var i=0; i<vectorsize; i++) {
            if (i>0)
              vectorDistanceSqr+=" + ";
            vectorDistanceSqr+="d"+i+"*d"+i;
        }
        vectorDistanceSqr+=");\n";
        vectorDistanceSqr+="};";
        cls.prototype.vectorDistanceSqr = eval(vectorDistanceSqr);
        for (var k in basic_funcs) {
            var func=basic_funcs[k];
            var args=func[0];
            var line=func[1];
            var f;
            var code="f = function "+k+"(";
            for (var i=0; i<args.length; i++) {
                if (i>0)
                  code+=", ";
                line = line.replace(args[i], args[i].toLowerCase());
                code+=args[i].toLowerCase();
            }
            code+=") {\n";
            if (func.length>2) {
                code+="  return ";
                for (var i=0; i<vectorsize; i++) {
                    if (i>0)
                      code+=func[2];
                    code+="("+line.replace(/X/g, ""+i)+")";
                }
                code+=";\n";
            }
            else {
              for (var i=0; i<vectorsize; i++) {
                  var line2=line.replace(/X/g, ""+i);
                  code+="  this["+i+"] = "+line2+";\n";
              }
              code+="  return this;\n";
            }
            code+="}\n";
            var f=eval(code);
            cls.prototype[k] = f;
        }
      }
       copy() {
        return new this.constructor(this);
      }
       load(data) {
        throw new Error("Implement me!");
      }
       init_swizzle(size) {
        var ret={};
        var cls=size===4 ? Vector4 : (size===3 ? Vector3 : Vector2);
        for (var k in cls.prototype) {
            var v=cls.prototype[k];
            if (typeof v!=="function"&&!(__instance_of(v, Function)))
              continue;
            ret[k] = v.bind(this);
        }
        return ret;
      }
       vectorLength() {
        return sqrt(this.dot(this));
      }
       swapAxes(axis1, axis2) {
        let t=this[axis1];
        this[axis1] = this[axis2];
        this[axis2] = t;
        return this;
      }
       normalize() {
        let l=this.vectorLength();
        if (l>1e-08) {
            this.mulScalar(1.0/l);
        }
        return this;
      }
    }
    _ESClass.register(BaseVector);
    _es6_module.add_class(BaseVector);
  }
  const BaseVector=getBaseVector(Array);
  _es6_module.add_export('BaseVector', BaseVector);
  const F64BaseVector=getBaseVector(Float64Array);
  _es6_module.add_export('F64BaseVector', F64BaseVector);
  const F32BaseVector=getBaseVector(Float32Array);
  _es6_module.add_export('F32BaseVector', F32BaseVector);
  function myclamp(f, a, b) {
    return Math.min(Math.max(f, a), b);
  }
  class Vector4 extends BaseVector {
     constructor(data) {
      super(4);
      if (arguments.length>1) {
          throw new Error("unexpected argument");
      }
      this[0] = this[1] = this[2] = this[3] = 0.0;
      if (data!==undefined) {
          this.load(data);
      }
    }
     toCSS() {
      let r=~~(this[0]*255);
      let g=~~(this[1]*255);
      let b=~~(this[2]*255);
      let a=this[3];
      return `rgba(${r},${g},${b},${a})`;
    }
     loadXYZW(x, y, z, w) {
      this[0] = x;
      this[1] = y;
      this[2] = z;
      this[3] = w;
      return this;
    }
     loadXYZ(x, y, z) {
      this[0] = x;
      this[1] = y;
      this[2] = z;
      return this;
    }
     load(data) {
      if (data===undefined)
        return this;
      this[0] = data[0];
      this[1] = data[1];
      this[2] = data[2];
      this[3] = data[3];
      return this;
    }
     dot(b) {
      return this[0]*b[0]+this[1]*b[1]+this[2]*b[2]+this[3]*b[3];
    }
     mulVecQuat(q) {
      let t0=-q[1]*this[0]-q[2]*this[1]-q[3]*this[2];
      let t1=q[0]*this[0]+q[2]*this[2]-q[3]*this[1];
      let t2=q[0]*this[1]+q[3]*this[0]-q[1]*this[2];
      this[2] = q[0]*this[2]+q[1]*this[1]-q[2]*this[0];
      this[0] = t1;
      this[1] = t2;
      t1 = t0*-q[1]+this[0]*q[0]-this[1]*q[3]+this[2]*q[2];
      t2 = t0*-q[2]+this[1]*q[0]-this[2]*q[1]+this[0]*q[3];
      this[2] = t0*-q[3]+this[2]*q[0]-this[0]*q[2]+this[1]*q[1];
      this[0] = t1;
      this[1] = t2;
      return this;
    }
     multVecMatrix(matrix) {
      var x=this[0];
      var y=this[1];
      var z=this[2];
      var w=this[3];
      this[0] = w*matrix.$matrix.m41+x*matrix.$matrix.m11+y*matrix.$matrix.m21+z*matrix.$matrix.m31;
      this[1] = w*matrix.$matrix.m42+x*matrix.$matrix.m12+y*matrix.$matrix.m22+z*matrix.$matrix.m32;
      this[2] = w*matrix.$matrix.m43+x*matrix.$matrix.m13+y*matrix.$matrix.m23+z*matrix.$matrix.m33;
      this[3] = w*matrix.$matrix.m44+x*matrix.$matrix.m14+y*matrix.$matrix.m24+z*matrix.$matrix.m34;
      return this[3];
    }
     cross(v) {
      var x=this[1]*v[2]-this[2]*v[1];
      var y=this[2]*v[0]-this[0]*v[2];
      var z=this[0]*v[1]-this[1]*v[0];
      this[0] = x;
      this[1] = y;
      this[2] = z;
      return this;
    }
     preNormalizedAngle(v2) {
      let th=this.dot(v2)*0.99999;
      return Math.acos(th);
    }
     loadSTRUCT(reader) {
      reader(this);
      if (typeof this.vec!=="undefined") {
          this.load(this.vec);
          this.vec = undefined;
      }
    }
  }
  _ESClass.register(Vector4);
  _es6_module.add_class(Vector4);
  Vector4 = _es6_module.add_export('Vector4', Vector4);
  
  Vector4.STRUCT = `
vec4 {
  0 : float;
  1 : float;
  2 : float;
  3 : float;
}
`;
  nstructjs.manager.add_class(Vector4);
  var _v3nd_n1_normalizedDot, _v3nd_n2_normalizedDot;
  var _v3nd4_n1_normalizedDot4, _v3nd4_n2_normalizedDot4;
  class Vector3 extends F64BaseVector {
     constructor(data) {
      super(3);
      if (arguments.length>1) {
          throw new Error("unexpected argument");
      }
      this[0] = this[1] = this[2] = 0.0;
      if (data!==undefined) {
          this.load(data);
      }
      if (this.constructor===Vector3) {
          Object.preventExtensions(this);
      }
    }
    static  normalizedDot4(v1, v2, v3, v4) {
      $_v3nd4_n1_normalizedDot4.load(v2).sub(v1).normalize();
      $_v3nd4_n2_normalizedDot4.load(v4).sub(v3).normalize();
      return $_v3nd4_n1_normalizedDot4.dot($_v3nd4_n2_normalizedDot4);
    }
    static  normalizedDot3(v1, center, v2) {
      $_v3nd4_n1_normalizedDot3.load(v1).sub(center).normalize();
      $_v3nd4_n2_normalizedDot3.load(v2).sub(center).normalize();
      return $_v3nd4_n1_normalizedDot3.dot($_v3nd4_n2_normalizedDot3);
    }
     toCSS() {
      let r=~~(this[0]*255);
      let g=~~(this[1]*255);
      let b=~~(this[2]*255);
      return `rgb(${r},${g},${b})`;
    }
     loadXYZ(x, y, z) {
      this[0] = x;
      this[1] = y;
      this[2] = z;
      return this;
    }
     toJSON() {
      return [this[0], this[1], this[2]];
    }
     loadJSON(obj) {
      return this.load(obj);
    }
     initVector3() {
      this.length = 3;
      this[0] = this[1] = this[2] = 0;
      return this;
    }
     load(data) {
      if (data===undefined)
        return this;
      this[0] = data[0];
      this[1] = data[1];
      this[2] = data[2];
      return this;
    }
     dot(b) {
      return this[0]*b[0]+this[1]*b[1]+this[2]*b[2];
    }
     normalizedDot(v) {
      $_v3nd_n1_normalizedDot.load(this);
      $_v3nd_n2_normalizedDot.load(v);
      $_v3nd_n1_normalizedDot.normalize();
      $_v3nd_n2_normalizedDot.normalize();
      return $_v3nd_n1_normalizedDot.dot($_v3nd_n2_normalizedDot);
    }
     mulVecQuat(q) {
      let t0=-q[1]*this[0]-q[2]*this[1]-q[3]*this[2];
      let t1=q[0]*this[0]+q[2]*this[2]-q[3]*this[1];
      let t2=q[0]*this[1]+q[3]*this[0]-q[1]*this[2];
      this[2] = q[0]*this[2]+q[1]*this[1]-q[2]*this[0];
      this[0] = t1;
      this[1] = t2;
      t1 = t0*-q[1]+this[0]*q[0]-this[1]*q[3]+this[2]*q[2];
      t2 = t0*-q[2]+this[1]*q[0]-this[2]*q[1]+this[0]*q[3];
      this[2] = t0*-q[3]+this[2]*q[0]-this[0]*q[2]+this[1]*q[1];
      this[0] = t1;
      this[1] = t2;
      return this;
    }
     multVecMatrix(matrix, ignore_w) {
      if (ignore_w===undefined) {
          ignore_w = false;
      }
      var x=this[0];
      var y=this[1];
      var z=this[2];
      this[0] = matrix.$matrix.m41+x*matrix.$matrix.m11+y*matrix.$matrix.m21+z*matrix.$matrix.m31;
      this[1] = matrix.$matrix.m42+x*matrix.$matrix.m12+y*matrix.$matrix.m22+z*matrix.$matrix.m32;
      this[2] = matrix.$matrix.m43+x*matrix.$matrix.m13+y*matrix.$matrix.m23+z*matrix.$matrix.m33;
      var w=matrix.$matrix.m44+x*matrix.$matrix.m14+y*matrix.$matrix.m24+z*matrix.$matrix.m34;
      if (!ignore_w&&w!==1&&w!==0&&matrix.isPersp) {
          this[0]/=w;
          this[1]/=w;
          this[2]/=w;
      }
      return w;
    }
     cross(v) {
      var x=this[1]*v[2]-this[2]*v[1];
      var y=this[2]*v[0]-this[0]*v[2];
      var z=this[0]*v[1]-this[1]*v[0];
      this[0] = x;
      this[1] = y;
      this[2] = z;
      return this;
    }
     rot2d(A, axis) {
      var x=this[0];
      var y=this[1];
      if (axis===1) {
          this[0] = x*cos(A)+y*sin(A);
          this[1] = y*cos(A)-x*sin(A);
      }
      else {
        this[0] = x*cos(A)-y*sin(A);
        this[1] = y*cos(A)+x*sin(A);
      }
      return this;
    }
     preNormalizedAngle(v2) {
      let th=this.dot(v2)*0.99999;
      return Math.acos(th);
    }
     loadSTRUCT(reader) {
      reader(this);
      if (typeof this.vec!=="undefined") {
          this.load(this.vec);
          this.vec = undefined;
      }
    }
  }
  _ESClass.register(Vector3);
  _es6_module.add_class(Vector3);
  Vector3 = _es6_module.add_export('Vector3', Vector3);
  Vector3.STRUCT = `
vec3 {
  0 : float;
  1 : float;
  2 : float;
}
`;
  nstructjs.manager.add_class(Vector3);
  class Vector2 extends BaseVector {
     constructor(data) {
      super(2);
      if (arguments.length>1) {
          throw new Error("unexpected argument");
      }
      this[0] = this[1] = 0.0;
      if (data!==undefined) {
          this.load(data);
      }
    }
     initVector2(co) {
      this.length = 2;
      if (co!==undefined) {
          this[0] = co[0];
          this[1] = co[1];
      }
      else {
        this[0] = this[1] = 0.0;
      }
      return this;
    }
     loadXY(x, y) {
      this[0] = x;
      this[1] = y;
      return this;
    }
     toJSON() {
      return [this[0], this[1]];
    }
     loadJSON(obj) {
      return this.load(obj);
    }
     loadXY(x, y) {
      this[0] = x;
      this[1] = y;
      return this;
    }
     load(data) {
      if (data===undefined)
        return this;
      this[0] = data[0];
      this[1] = data[1];
      return this;
    }
     rot2d(A, axis) {
      var x=this[0];
      var y=this[1];
      if (axis===1) {
          this[0] = x*cos(A)+y*sin(A);
          this[1] = y*cos(A)-x*sin(A);
      }
      else {
        this[0] = x*cos(A)-y*sin(A);
        this[1] = y*cos(A)+x*sin(A);
      }
      return this;
    }
     dot(b) {
      return this[0]*b[0]+this[1]*b[1];
    }
     multVecMatrix(matrix) {
      var x=this[0];
      var y=this[1];
      var w=1.0;
      this[0] = w*matrix.$matrix.m41+x*matrix.$matrix.m11+y*matrix.$matrix.m21;
      this[1] = w*matrix.$matrix.m42+x*matrix.$matrix.m12+y*matrix.$matrix.m22;
      if (matrix.isPersp) {
          let w2=w*matrix.$matrix.m44+x*matrix.$matrix.m14+y*matrix.$matrix.m24;
          if (w2!==0.0) {
              this[0]/=w2;
              this[1]/=w2;
          }
      }
      return this;
    }
     mulVecQuat(q) {
      let t0=-q[1]*this[0]-q[2]*this[1];
      let t1=q[0]*this[0]-q[3]*this[1];
      let t2=q[0]*this[1]+q[3]*this[0];
      let z=q[1]*this[1]-q[2]*this[0];
      this[0] = t1;
      this[1] = t2;
      t1 = t0*-q[1]+this[0]*q[0]-this[1]*q[3]+z*q[2];
      t2 = t0*-q[2]+this[1]*q[0]-z*q[1]+this[0]*q[3];
      this[0] = t1;
      this[1] = t2;
      return this;
    }
     vectorLengthSqr() {
      return this.dot(this);
    }
     loadSTRUCT(reader) {
      reader(this);
      if (typeof this.vec!==undefined) {
          this.load(this.vec);
          this.vec = undefined;
      }
    }
  }
  _ESClass.register(Vector2);
  _es6_module.add_class(Vector2);
  Vector2 = _es6_module.add_export('Vector2', Vector2);
  
  Vector2.STRUCT = `
vec2 {
  0 : float;
  1 : float;
}
`;
  nstructjs.manager.add_class(Vector2);
  let _quat_vs3_temps=util.cachering.fromConstructor(Vector3, 64);
  class Quat extends Vector4 {
     makeUnitQuat() {
      this[0] = 1.0;
      this[1] = this[2] = this[3] = 0.0;
    }
     isZero() {
      return (this[0]===0&&this[1]===0&&this[2]===0&&this[3]===0);
    }
     mulQuat(qt) {
      var a=this[0]*qt[0]-this[1]*qt[1]-this[2]*qt[2]-this[3]*qt[3];
      var b=this[0]*qt[1]+this[1]*qt[0]+this[2]*qt[3]-this[3]*qt[2];
      var c=this[0]*qt[2]+this[2]*qt[0]+this[3]*qt[1]-this[1]*qt[3];
      this[3] = this[0]*qt[3]+this[3]*qt[0]+this[1]*qt[2]-this[2]*qt[1];
      this[0] = a;
      this[1] = b;
      this[2] = c;
    }
     conjugate() {
      this[1] = -this[1];
      this[2] = -this[2];
      this[3] = -this[3];
    }
     dotWithQuat(q2) {
      return this[0]*q2[0]+this[1]*q2[1]+this[2]*q2[2]+this[3]*q2[3];
    }
     invert() {
      var f=this.dot(this);
      if (f===0.0)
        return ;
      conjugate_qt(q);
      this.mulscalar(1.0/f);
    }
     sub(q2) {
      var nq2=new Quat();
      nq2[0] = -q2[0];
      nq2[1] = q2[1];
      nq2[2] = q2[2];
      nq2[3] = q2[3];
      this.mul(nq2);
    }
     mulScalarWithFactor(fac) {
      var angle=fac*bounded_acos(this[0]);
      var co=Math.cos(angle);
      var si=Math.sin(angle);
      this[0] = co;
      var last3=Vector3([this[1], this[2], this[3]]);
      last3.normalize();
      last3.mulScalar(si);
      this[1] = last3[0];
      this[2] = last3[1];
      this[3] = last3[2];
      return this;
    }
     toMatrix(m) {
      if (m===undefined) {
          m = new Matrix4();
      }
      var q0=M_SQRT2*this[0];
      var q1=M_SQRT2*this[1];
      var q2=M_SQRT2*this[2];
      var q3=M_SQRT2*this[3];
      var qda=q0*q1;
      var qdb=q0*q2;
      var qdc=q0*q3;
      var qaa=q1*q1;
      var qab=q1*q2;
      var qac=q1*q3;
      var qbb=q2*q2;
      var qbc=q2*q3;
      var qcc=q3*q3;
      m.$matrix.m11 = (1.0-qbb-qcc);
      m.$matrix.m12 = (qdc+qab);
      m.$matrix.m13 = (-qdb+qac);
      m.$matrix.m14 = 0.0;
      m.$matrix.m21 = (-qdc+qab);
      m.$matrix.m22 = (1.0-qaa-qcc);
      m.$matrix.m23 = (qda+qbc);
      m.$matrix.m24 = 0.0;
      m.$matrix.m31 = (qdb+qac);
      m.$matrix.m32 = (-qda+qbc);
      m.$matrix.m33 = (1.0-qaa-qbb);
      m.$matrix.m34 = 0.0;
      m.$matrix.m41 = m.$matrix.m42 = m.$matrix.m43 = 0.0;
      m.$matrix.m44 = 1.0;
      return m;
    }
     matrixToQuat(wmat) {
      var mat=temp_mats.next();
      mat.load(wmat);
      mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
      mat.$matrix.m44 = 1.0;
      var r1=new Vector3([mat.$matrix.m11, mat.$matrix.m12, mat.$matrix.m13]);
      var r2=new Vector3([mat.$matrix.m21, mat.$matrix.m22, mat.$matrix.m23]);
      var r3=new Vector3([mat.$matrix.m31, mat.$matrix.m32, mat.$matrix.m33]);
      r1.normalize();
      r2.normalize();
      r3.normalize();
      mat.$matrix.m11 = r1[0];
      mat.$matrix.m12 = r1[1];
      mat.$matrix.m13 = r1[2];
      mat.$matrix.m21 = r2[0];
      mat.$matrix.m22 = r2[1];
      mat.$matrix.m23 = r2[2];
      mat.$matrix.m31 = r3[0];
      mat.$matrix.m32 = r3[1];
      mat.$matrix.m33 = r3[2];
      var tr=0.25*(1.0+mat.$matrix.m11+mat.$matrix.m22+mat.$matrix.m33);
      var s=0;
      if (tr>FLT_EPSILON) {
          s = Math.sqrt(tr);
          this[0] = s;
          s = 1.0/(4.0*s);
          this[1] = ((mat.$matrix.m23-mat.$matrix.m32)*s);
          this[2] = ((mat.$matrix.m31-mat.$matrix.m13)*s);
          this[3] = ((mat.$matrix.m12-mat.$matrix.m21)*s);
      }
      else {
        if (mat.$matrix.m11>mat.$matrix.m22&&mat.$matrix.m11>mat.$matrix.m33) {
            s = 2.0*Math.sqrt(1.0+mat.$matrix.m11-mat.$matrix.m22-mat.$matrix.m33);
            this[1] = (0.25*s);
            s = 1.0/s;
            this[0] = ((mat.$matrix.m32-mat.$matrix.m23)*s);
            this[2] = ((mat.$matrix.m21+mat.$matrix.m12)*s);
            this[3] = ((mat.$matrix.m31+mat.$matrix.m13)*s);
        }
        else 
          if (mat.$matrix.m22>mat.$matrix.m33) {
            s = 2.0*Math.sqrt(1.0+mat.$matrix.m22-mat.$matrix.m11-mat.$matrix.m33);
            this[2] = (0.25*s);
            s = 1.0/s;
            this[0] = ((mat.$matrix.m31-mat.$matrix.m13)*s);
            this[1] = ((mat.$matrix.m21+mat.$matrix.m12)*s);
            this[3] = ((mat.$matrix.m32+mat.$matrix.m23)*s);
        }
        else {
          s = 2.0*Math.sqrt(1.0+mat.$matrix.m33-mat.$matrix.m11-mat.$matrix.m22);
          this[3] = (0.25*s);
          s = 1.0/s;
          this[0] = ((mat.$matrix.m21-mat.$matrix.m12)*s);
          this[1] = ((mat.$matrix.m31+mat.$matrix.m13)*s);
          this[2] = ((mat.$matrix.m32+mat.$matrix.m23)*s);
        }
      }
      this.normalize();
    }
     normalize() {
      var len=Math.sqrt(this.dot(this));
      if (len!==0.0) {
          this.mulScalar(1.0/len);
      }
      else {
        this[1] = 1.0;
        this[0] = this[2] = this[3] = 0.0;
      }
      return this;
    }
     axisAngleToQuat(axis, angle) {
      let nor=_quat_vs3_temps.next().load(axis);
      nor.normalize();
      if (nor.dot(nor)!==0.0) {
          var phi=angle/2.0;
          var si=Math.sin(phi);
          this[0] = Math.cos(phi);
          this[1] = nor[0]*si;
          this[2] = nor[1]*si;
          this[3] = nor[2]*si;
      }
      else {
        this.makeUnitQuat();
      }
      return this;
    }
     rotationBetweenVecs(v1, v2, fac=1.0) {
      v1 = new Vector3(v1);
      v2 = new Vector3(v2);
      v1.normalize();
      v2.normalize();
      if (Math.abs(v1.dot(v2))>0.9999) {
          this.makeUnitQuat();
          return this;
      }
      let axis=new Vector3(v1);
      axis.cross(v2);
      let angle=v1.preNormalizedAngle(v2)*fac;
      this.axisAngleToQuat(axis, angle);
      return this;
    }
     quatInterp(quat2, t) {
      let quat=new Quat();
      let cosom=this[0]*quat2[0]+this[1]*quat2[1]+this[2]*quat2[2]+this[3]*quat2[3];
      if (cosom<0.0) {
          cosom = -cosom;
          quat[0] = -this[0];
          quat[1] = -this[1];
          quat[2] = -this[2];
          quat[3] = -this[3];
      }
      else {
        quat[0] = this[0];
        quat[1] = this[1];
        quat[2] = this[2];
        quat[3] = this[3];
      }
      let omega, sinom, sc1, sc2;
      if ((1.0-cosom)>0.0001) {
          omega = Math.acos(cosom);
          sinom = Math.sin(omega);
          sc1 = Math.sin((1.0-t)*omega)/sinom;
          sc2 = Math.sin(t*omega)/sinom;
      }
      else {
        sc1 = 1.0-t;
        sc2 = t;
      }
      this[0] = sc1*quat[0]+sc2*quat2[0];
      this[1] = sc1*quat[1]+sc2*quat2[1];
      this[2] = sc1*quat[2]+sc2*quat2[2];
      this[3] = sc1*quat[3]+sc2*quat2[3];
      return this;
    }
  }
  _ESClass.register(Quat);
  _es6_module.add_class(Quat);
  Quat = _es6_module.add_export('Quat', Quat);
  
  Quat.STRUCT = nstructjs.inherit(Quat, Vector4, 'quat')+`
}
`;
  nstructjs.register(Quat);
  _v3nd4_n1_normalizedDot4 = new Vector3();
  _v3nd4_n2_normalizedDot4 = new Vector3();
  _v3nd_n1_normalizedDot = new Vector3();
  _v3nd_n2_normalizedDot = new Vector3();
  BaseVector.inherit(Vector4, 4);
  F64BaseVector.inherit(Vector3, 3);
  BaseVector.inherit(Vector2, 2);
  lookat_cache_vs3 = util.cachering.fromConstructor(Vector3, 64);
  lookat_cache_vs4 = util.cachering.fromConstructor(Vector4, 64);
  makenormalcache = util.cachering.fromConstructor(Vector3, 64);
  var $_v3nd_n1_normalizedDot=new Vector3();
  var $_v3nd_n2_normalizedDot=new Vector3();
  var $_v3nd4_n1_normalizedDot4=new Vector3();
  var $_v3nd4_n2_normalizedDot4=new Vector3();
  var $_v3nd4_n1_normalizedDot3=new Vector3();
  var $_v3nd4_n2_normalizedDot3=new Vector3();
  var M_SQRT2=Math.sqrt(2.0);
  var FLT_EPSILON=2.22e-16;
  class internal_matrix  {
     constructor() {
      this.m11 = 1.0;
      this.m12 = 0.0;
      this.m13 = 0.0;
      this.m14 = 0.0;
      this.m21 = 0.0;
      this.m22 = 1.0;
      this.m23 = 0.0;
      this.m24 = 0.0;
      this.m31 = 0.0;
      this.m32 = 0.0;
      this.m33 = 1.0;
      this.m34 = 0.0;
      this.m41 = 0.0;
      this.m42 = 0.0;
      this.m43 = 0.0;
      this.m44 = 1.0;
    }
  }
  _ESClass.register(internal_matrix);
  _es6_module.add_class(internal_matrix);
  var lookat_cache_vs3;
  var lookat_cache_vs4;
  var lookat_cache_ms;
  var euler_rotate_mats;
  var makenormalcache;
  var temp_mats;
  let preMultTemp;
  class Matrix4  {
     constructor(m) {
      this.$matrix = new internal_matrix();
      this.isPersp = false;
      if (typeof m==='object') {
          if ("length" in m&&m.length>=16) {
              this.load(m);
          }
          else 
            if (__instance_of(m, Matrix4)) {
              this.load(m);
          }
      }
    }
    static  fromJSON() {
      var mat=new Matrix4();
      mat.load(json.items);
      mat.isPersp = json.isPersp;
      return mat;
    }
     clone() {
      return new Matrix4(this);
    }
     addToHashDigest(hash) {
      let m=this.$matrix;
      hash.add(m.m11);
      hash.add(m.m12);
      hash.add(m.m13);
      hash.add(m.m14);
      hash.add(m.m21);
      hash.add(m.m22);
      hash.add(m.m23);
      hash.add(m.m24);
      hash.add(m.m31);
      hash.add(m.m32);
      hash.add(m.m33);
      hash.add(m.m34);
      hash.add(m.m41);
      hash.add(m.m42);
      hash.add(m.m43);
      hash.add(m.m44);
      return this;
    }
     equals(m) {
      let m1=this.$matrix;
      let m2=m.$matrix;
      let ok=1;
      ok = ok&&m1.m11===m2.m11;
      ok = ok&&m1.m12===m2.m12;
      ok = ok&&m1.m13===m2.m13;
      ok = ok&&m1.m14===m2.m14;
      ok = ok&&m1.m21===m2.m21;
      ok = ok&&m1.m22===m2.m22;
      ok = ok&&m1.m23===m2.m23;
      ok = ok&&m1.m24===m2.m24;
      ok = ok&&m1.m31===m2.m31;
      ok = ok&&m1.m32===m2.m32;
      ok = ok&&m1.m33===m2.m33;
      ok = ok&&m1.m34===m2.m34;
      ok = ok&&m1.m41===m2.m41;
      ok = ok&&m1.m42===m2.m42;
      ok = ok&&m1.m43===m2.m43;
      ok = ok&&m1.m44===m2.m44;
      return ok;
    }
     loadColumn(i, vec) {
      let m=this.$matrix;
      let have4=vec.length>3;
      switch (i) {
        case 0:
          m.m11 = vec[0];
          m.m21 = vec[1];
          m.m31 = vec[2];
          if (have4) {
              m.m41 = vec[3];
          }
          break;
        case 1:
          m.m12 = vec[0];
          m.m22 = vec[1];
          m.m32 = vec[2];
          if (have4) {
              m.m42 = vec[3];
          }
          break;
        case 2:
          m.m13 = vec[0];
          m.m23 = vec[1];
          m.m33 = vec[2];
          if (have4) {
              m.m43 = vec[3];
          }
          break;
        case 3:
          m.m14 = vec[0];
          m.m24 = vec[1];
          m.m34 = vec[2];
          if (have4) {
              m.m44 = vec[3];
          }
          break;
      }
      return this;
    }
     copyColumnTo(i, vec) {
      let m=this.$matrix;
      let have4=vec.length>3;
      switch (i) {
        case 0:
          vec[0] = m.m11;
          vec[1] = m.m21;
          vec[2] = m.m31;
          if (have4) {
              vec[3] = m.m41;
          }
          break;
        case 1:
          vec[0] = m.m12;
          vec[1] = m.m22;
          vec[2] = m.m32;
          if (have4) {
              vec[3] = m.m42;
          }
          break;
        case 2:
          vec[0] = m.m13;
          vec[1] = m.m23;
          vec[2] = m.m33;
          if (have4) {
              vec[3] = m.m43;
          }
          break;
        case 3:
          vec[0] = m.m14;
          vec[1] = m.m24;
          vec[2] = m.m34;
          if (have4) {
              vec[3] = m.m44;
          }
          break;
      }
      return vec;
    }
     copyColumn(i) {
      return this.copyColumnTo(i, new Vector3());
    }
     load() {
      if (arguments.length===1&&typeof arguments[0]==='object') {
          var matrix;
          if (__instance_of(arguments[0], Matrix4)) {
              matrix = arguments[0].$matrix;
              this.isPersp = arguments[0].isPersp;
              this.$matrix.m11 = matrix.m11;
              this.$matrix.m12 = matrix.m12;
              this.$matrix.m13 = matrix.m13;
              this.$matrix.m14 = matrix.m14;
              this.$matrix.m21 = matrix.m21;
              this.$matrix.m22 = matrix.m22;
              this.$matrix.m23 = matrix.m23;
              this.$matrix.m24 = matrix.m24;
              this.$matrix.m31 = matrix.m31;
              this.$matrix.m32 = matrix.m32;
              this.$matrix.m33 = matrix.m33;
              this.$matrix.m34 = matrix.m34;
              this.$matrix.m41 = matrix.m41;
              this.$matrix.m42 = matrix.m42;
              this.$matrix.m43 = matrix.m43;
              this.$matrix.m44 = matrix.m44;
              return this;
          }
          else 
            matrix = arguments[0];
          if ("length" in matrix&&matrix.length>=16) {
              this.$matrix.m11 = matrix[0];
              this.$matrix.m12 = matrix[1];
              this.$matrix.m13 = matrix[2];
              this.$matrix.m14 = matrix[3];
              this.$matrix.m21 = matrix[4];
              this.$matrix.m22 = matrix[5];
              this.$matrix.m23 = matrix[6];
              this.$matrix.m24 = matrix[7];
              this.$matrix.m31 = matrix[8];
              this.$matrix.m32 = matrix[9];
              this.$matrix.m33 = matrix[10];
              this.$matrix.m34 = matrix[11];
              this.$matrix.m41 = matrix[12];
              this.$matrix.m42 = matrix[13];
              this.$matrix.m43 = matrix[14];
              this.$matrix.m44 = matrix[15];
              return this;
          }
      }
      this.makeIdentity();
      return this;
    }
     toJSON() {
      return {isPersp: this.isPersp, 
     items: this.getAsArray()}
    }
     getAsArray() {
      return [this.$matrix.m11, this.$matrix.m12, this.$matrix.m13, this.$matrix.m14, this.$matrix.m21, this.$matrix.m22, this.$matrix.m23, this.$matrix.m24, this.$matrix.m31, this.$matrix.m32, this.$matrix.m33, this.$matrix.m34, this.$matrix.m41, this.$matrix.m42, this.$matrix.m43, this.$matrix.m44];
    }
     getAsFloat32Array() {
      return new Float32Array(this.getAsArray());
    }
     setUniform(ctx, loc, transpose) {
      if (Matrix4.setUniformArray===undefined) {
          Matrix4.setUniformWebGLArray = new Float32Array(16);
          Matrix4.setUniformArray = new Array(16);
      }
      Matrix4.setUniformArray[0] = this.$matrix.m11;
      Matrix4.setUniformArray[1] = this.$matrix.m12;
      Matrix4.setUniformArray[2] = this.$matrix.m13;
      Matrix4.setUniformArray[3] = this.$matrix.m14;
      Matrix4.setUniformArray[4] = this.$matrix.m21;
      Matrix4.setUniformArray[5] = this.$matrix.m22;
      Matrix4.setUniformArray[6] = this.$matrix.m23;
      Matrix4.setUniformArray[7] = this.$matrix.m24;
      Matrix4.setUniformArray[8] = this.$matrix.m31;
      Matrix4.setUniformArray[9] = this.$matrix.m32;
      Matrix4.setUniformArray[10] = this.$matrix.m33;
      Matrix4.setUniformArray[11] = this.$matrix.m34;
      Matrix4.setUniformArray[12] = this.$matrix.m41;
      Matrix4.setUniformArray[13] = this.$matrix.m42;
      Matrix4.setUniformArray[14] = this.$matrix.m43;
      Matrix4.setUniformArray[15] = this.$matrix.m44;
      Matrix4.setUniformWebGLArray.set(Matrix4.setUniformArray);
      ctx.uniformMatrix4fv(loc, transpose, Matrix4.setUniformWebGLArray);
      return this;
    }
     makeIdentity() {
      this.$matrix.m11 = 1;
      this.$matrix.m12 = 0;
      this.$matrix.m13 = 0;
      this.$matrix.m14 = 0;
      this.$matrix.m21 = 0;
      this.$matrix.m22 = 1;
      this.$matrix.m23 = 0;
      this.$matrix.m24 = 0;
      this.$matrix.m31 = 0;
      this.$matrix.m32 = 0;
      this.$matrix.m33 = 1;
      this.$matrix.m34 = 0;
      this.$matrix.m41 = 0;
      this.$matrix.m42 = 0;
      this.$matrix.m43 = 0;
      this.$matrix.m44 = 1;
      this.isPersp = false;
      return this;
    }
     transpose() {
      var tmp=this.$matrix.m12;
      this.$matrix.m12 = this.$matrix.m21;
      this.$matrix.m21 = tmp;
      tmp = this.$matrix.m13;
      this.$matrix.m13 = this.$matrix.m31;
      this.$matrix.m31 = tmp;
      tmp = this.$matrix.m14;
      this.$matrix.m14 = this.$matrix.m41;
      this.$matrix.m41 = tmp;
      tmp = this.$matrix.m23;
      this.$matrix.m23 = this.$matrix.m32;
      this.$matrix.m32 = tmp;
      tmp = this.$matrix.m24;
      this.$matrix.m24 = this.$matrix.m42;
      this.$matrix.m42 = tmp;
      tmp = this.$matrix.m34;
      this.$matrix.m34 = this.$matrix.m43;
      this.$matrix.m43 = tmp;
      return this;
    }
     determinant() {
      return this._determinant4x4();
    }
     invert() {
      var det=this._determinant4x4();
      if (Math.abs(det)<1e-08)
        return null;
      this._makeAdjoint();
      this.$matrix.m11/=det;
      this.$matrix.m12/=det;
      this.$matrix.m13/=det;
      this.$matrix.m14/=det;
      this.$matrix.m21/=det;
      this.$matrix.m22/=det;
      this.$matrix.m23/=det;
      this.$matrix.m24/=det;
      this.$matrix.m31/=det;
      this.$matrix.m32/=det;
      this.$matrix.m33/=det;
      this.$matrix.m34/=det;
      this.$matrix.m41/=det;
      this.$matrix.m42/=det;
      this.$matrix.m43/=det;
      this.$matrix.m44/=det;
      return this;
    }
     translate(x, y, z) {
      if (typeof x==='object'&&"length" in x) {
          var t=x;
          x = t[0];
          y = t[1];
          z = t[2];
      }
      x = x===undefined ? 0 : x;
      y = y===undefined ? 0 : y;
      z = z===undefined ? 0 : z;
      var matrix=temp_mats.next().makeIdentity();
      matrix.$matrix.m41 = x;
      matrix.$matrix.m42 = y;
      matrix.$matrix.m43 = z;
      this.multiply(matrix);
      return this;
    }
     preTranslate(x, y, z) {
      if (typeof x==='object'&&"length" in x) {
          var t=x;
          x = t[0];
          y = t[1];
          z = t[2];
      }
      x = x===undefined ? 0 : x;
      y = y===undefined ? 0 : y;
      z = z===undefined ? 0 : z;
      var matrix=temp_mats.next().makeIdentity();
      matrix.$matrix.m41 = x;
      matrix.$matrix.m42 = y;
      matrix.$matrix.m43 = z;
      this.preMultiply(matrix);
      return this;
    }
     scale(x, y, z, w=1.0) {
      if (typeof x==='object'&&"length" in x) {
          var t=x;
          x = t[0];
          y = t[1];
          z = t[2];
      }
      else {
        if (x===undefined)
          x = 1;
        if (z===undefined) {
            if (y===undefined) {
                y = x;
                z = x;
            }
            else {
              z = x;
            }
        }
        else 
          if (y===undefined) {
            y = x;
        }
      }
      var matrix=temp_mats.next().makeIdentity();
      matrix.$matrix.m11 = x;
      matrix.$matrix.m22 = y;
      matrix.$matrix.m33 = z;
      matrix.$matrix.m44 = w;
      this.multiply(matrix);
      return this;
    }
     preScale(x, y, z, w=1.0) {
      let mat=temp_mats.next().makeIdentity();
      mat.scale(x, y, z, w);
      this.preMultiply(mat);
      return this;
    }
     euler_rotate_order(x, y, z, order=EulerOrders.XYZ) {
      if (y===undefined) {
          y = 0.0;
      }
      if (z===undefined) {
          z = 0.0;
      }
      x = -x;
      y = -y;
      z = -z;
      let xmat=euler_rotate_mats.next().makeIdentity();
      let m=xmat.$matrix;
      let c=Math.cos(x), s=Math.sin(x);
      m.m22 = c;
      m.m23 = s;
      m.m32 = -s;
      m.m33 = c;
      let ymat=euler_rotate_mats.next().makeIdentity();
      c = Math.cos(y);
      s = Math.sin(y);
      m = ymat.$matrix;
      m.m11 = c;
      m.m13 = -s;
      m.m31 = s;
      m.m33 = c;
      let zmat=euler_rotate_mats.next().makeIdentity();
      c = Math.cos(z);
      s = Math.sin(z);
      m = zmat.$matrix;
      m.m11 = c;
      m.m12 = s;
      m.m21 = -s;
      m.m22 = c;
      let a, b;
      switch (order) {
        case EulerOrders.XYZ:
          a = xmat;
          b = ymat;
          c = zmat;
          break;
        case EulerOrders.XZY:
          a = xmat;
          b = zmat;
          c = ymat;
          break;
        case EulerOrders.YXZ:
          a = ymat;
          b = xmat;
          c = zmat;
          break;
        case EulerOrders.YZX:
          a = ymat;
          b = zmat;
          c = xmat;
          break;
        case EulerOrders.ZXY:
          a = zmat;
          b = xmat;
          c = ymat;
          break;
        case EulerOrders.ZYX:
          a = zmat;
          b = ymat;
          c = xmat;
          break;
      }
      b.preMultiply(c);
      b.multiply(a);
      this.preMultiply(b);
      return this;
    }
     euler_rotate(x, y, z) {
      if (y===undefined) {
          y = 0.0;
      }
      if (z===undefined) {
          z = 0.0;
      }
      window.Matrix4 = Matrix4;
      var xmat=euler_rotate_mats.next().makeIdentity();
      var m=xmat.$matrix;
      var c=Math.cos(x), s=Math.sin(x);
      m.m22 = c;
      m.m23 = s;
      m.m32 = -s;
      m.m33 = c;
      var ymat=euler_rotate_mats.next().makeIdentity();
      c = Math.cos(y);
      s = Math.sin(y);
      var m=ymat.$matrix;
      m.m11 = c;
      m.m13 = -s;
      m.m31 = s;
      m.m33 = c;
      ymat.multiply(xmat);
      var zmat=euler_rotate_mats.next().makeIdentity();
      c = Math.cos(z);
      s = Math.sin(z);
      var m=zmat.$matrix;
      m.m11 = c;
      m.m12 = s;
      m.m21 = -s;
      m.m22 = c;
      zmat.multiply(ymat);
      this.preMultiply(zmat);
      return this;
    }
     toString() {
      var s="";
      var m=this.$matrix;
      function dec(d) {
        var ret=d.toFixed(3);
        if (ret[0]!=="-")
          ret = " "+ret;
        return ret;
      }
      s = dec(m.m11)+", "+dec(m.m12)+", "+dec(m.m13)+", "+dec(m.m14)+"\n";
      s+=dec(m.m21)+", "+dec(m.m22)+", "+dec(m.m23)+", "+dec(m.m24)+"\n";
      s+=dec(m.m31)+", "+dec(m.m32)+", "+dec(m.m33)+", "+dec(m.m34)+"\n";
      s+=dec(m.m41)+", "+dec(m.m42)+", "+dec(m.m43)+", "+dec(m.m44)+"\n";
      return s;
    }
     rotate(angle, x, y, z) {
      if (typeof x==='object'&&"length" in x) {
          var t=x;
          x = t[0];
          y = t[1];
          z = t[2];
      }
      else {
        if (arguments.length===1) {
            x = y = 0;
            z = 1;
        }
        else 
          if (arguments.length===3) {
            this.rotate(angle, 1, 0, 0);
            this.rotate(x, 0, 1, 0);
            this.rotate(y, 0, 0, 1);
            return ;
        }
      }
      angle/=2;
      var sinA=Math.sin(angle);
      var cosA=Math.cos(angle);
      var sinA2=sinA*sinA;
      var len=Math.sqrt(x*x+y*y+z*z);
      if (len===0) {
          x = 0;
          y = 0;
          z = 1;
      }
      else 
        if (len!==1) {
          x/=len;
          y/=len;
          z/=len;
      }
      var mat=temp_mats.next().makeIdentity();
      if (x===1&&y===0&&z===0) {
          mat.$matrix.m11 = 1;
          mat.$matrix.m12 = 0;
          mat.$matrix.m13 = 0;
          mat.$matrix.m21 = 0;
          mat.$matrix.m22 = 1-2*sinA2;
          mat.$matrix.m23 = 2*sinA*cosA;
          mat.$matrix.m31 = 0;
          mat.$matrix.m32 = -2*sinA*cosA;
          mat.$matrix.m33 = 1-2*sinA2;
          mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
          mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
          mat.$matrix.m44 = 1;
      }
      else 
        if (x===0&&y===1&&z===0) {
          mat.$matrix.m11 = 1-2*sinA2;
          mat.$matrix.m12 = 0;
          mat.$matrix.m13 = -2*sinA*cosA;
          mat.$matrix.m21 = 0;
          mat.$matrix.m22 = 1;
          mat.$matrix.m23 = 0;
          mat.$matrix.m31 = 2*sinA*cosA;
          mat.$matrix.m32 = 0;
          mat.$matrix.m33 = 1-2*sinA2;
          mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
          mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
          mat.$matrix.m44 = 1;
      }
      else 
        if (x===0&&y===0&&z===1) {
          mat.$matrix.m11 = 1-2*sinA2;
          mat.$matrix.m12 = 2*sinA*cosA;
          mat.$matrix.m13 = 0;
          mat.$matrix.m21 = -2*sinA*cosA;
          mat.$matrix.m22 = 1-2*sinA2;
          mat.$matrix.m23 = 0;
          mat.$matrix.m31 = 0;
          mat.$matrix.m32 = 0;
          mat.$matrix.m33 = 1;
          mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
          mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
          mat.$matrix.m44 = 1;
      }
      else {
        var x2=x*x;
        var y2=y*y;
        var z2=z*z;
        mat.$matrix.m11 = 1-2*(y2+z2)*sinA2;
        mat.$matrix.m12 = 2*(x*y*sinA2+z*sinA*cosA);
        mat.$matrix.m13 = 2*(x*z*sinA2-y*sinA*cosA);
        mat.$matrix.m21 = 2*(y*x*sinA2-z*sinA*cosA);
        mat.$matrix.m22 = 1-2*(z2+x2)*sinA2;
        mat.$matrix.m23 = 2*(y*z*sinA2+x*sinA*cosA);
        mat.$matrix.m31 = 2*(z*x*sinA2+y*sinA*cosA);
        mat.$matrix.m32 = 2*(z*y*sinA2-x*sinA*cosA);
        mat.$matrix.m33 = 1-2*(x2+y2)*sinA2;
        mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
        mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
        mat.$matrix.m44 = 1;
      }
      this.multiply(mat);
      return this;
    }
     normalize() {
      let m=this.$matrix;
      let v1=new Vector4([m.m11, m.m12, m.m13, m.m14]);
      let v2=new Vector4([m.m21, m.m22, m.m23, m.m24]);
      let v3=new Vector4([m.m31, m.m32, m.m33, m.m34]);
      let v4=new Vector4([m.m41, m.m42, m.m43, m.m44]);
      v1.normalize();
      v2.normalize();
      v3.normalize();
      let flat=new Array().concat(v1).concat(v2).concat(v3).concat(v4);
      this.load(flat);
      return this;
    }
     clearTranslation(set_w_to_one=false) {
      let m=this.$matrix;
      m.m41 = m.m42 = m.m43 = 0.0;
      if (set_w_to_one) {
          m.m44 = 1.0;
      }
      return this;
    }
     setTranslation(x, y, z, resetW=true) {
      if (typeof x==="object") {
          y = x[1];
          z = x[2];
          x = x[0];
      }
      let m=this.$matrix;
      m.m41 = x;
      m.m42 = y;
      m.m43 = z;
      if (resetW) {
          m.m44 = 1.0;
      }
      return this;
    }
     makeNormalMatrix(normal, up=undefined) {
      if (normal===undefined) {
          throw new Error("normal cannot be undefined");
      }
      let n=makenormalcache.next().load(normal).normalize();
      if (up===undefined) {
          up = makenormalcache.next().zero();
          if (Math.abs(n[2])>0.95) {
              up[1] = 1.0;
          }
          else {
            up[2] = 1.0;
          }
      }
      up = makenormalcache.next().load(up);
      up.normalize();
      if (up.dot(normal)>0.99) {
          this.makeIdentity();
          return this;
      }
      else 
        if (up.dot(normal)<-0.99) {
          this.makeIdentity();
          this.scale(1.0, 1.0, -1.0);
          return this;
      }
      let x=makenormalcache.next();
      let y=makenormalcache.next();
      x.load(n).cross(up).normalize();
      y.load(x).cross(n).normalize();
      this.makeIdentity();
      let m=this.$matrix;
      m.m11 = x[0];
      m.m12 = x[1];
      m.m13 = x[2];
      m.m21 = y[0];
      m.m22 = y[1];
      m.m23 = y[2];
      m.m31 = n[0];
      m.m32 = n[1];
      m.m33 = n[2];
      m.m44 = 1.0;
      return this;
    }
     preMultiply(mat) {
      preMultTemp.load(mat);
      preMultTemp.multiply(this);
      this.load(preMultTemp);
      return this;
    }
     multiply(mat) {
      let mm=this.$matrix;
      let mm2=mat.$matrix;
      let m11=(mm2.m11*mm.m11+mm2.m12*mm.m21+mm2.m13*mm.m31+mm2.m14*mm.m41);
      let m12=(mm2.m11*mm.m12+mm2.m12*mm.m22+mm2.m13*mm.m32+mm2.m14*mm.m42);
      let m13=(mm2.m11*mm.m13+mm2.m12*mm.m23+mm2.m13*mm.m33+mm2.m14*mm.m43);
      let m14=(mm2.m11*mm.m14+mm2.m12*mm.m24+mm2.m13*mm.m34+mm2.m14*mm.m44);
      let m21=(mm2.m21*mm.m11+mm2.m22*mm.m21+mm2.m23*mm.m31+mm2.m24*mm.m41);
      let m22=(mm2.m21*mm.m12+mm2.m22*mm.m22+mm2.m23*mm.m32+mm2.m24*mm.m42);
      let m23=(mm2.m21*mm.m13+mm2.m22*mm.m23+mm2.m23*mm.m33+mm2.m24*mm.m43);
      let m24=(mm2.m21*mm.m14+mm2.m22*mm.m24+mm2.m23*mm.m34+mm2.m24*mm.m44);
      let m31=(mm2.m31*mm.m11+mm2.m32*mm.m21+mm2.m33*mm.m31+mm2.m34*mm.m41);
      let m32=(mm2.m31*mm.m12+mm2.m32*mm.m22+mm2.m33*mm.m32+mm2.m34*mm.m42);
      let m33=(mm2.m31*mm.m13+mm2.m32*mm.m23+mm2.m33*mm.m33+mm2.m34*mm.m43);
      let m34=(mm2.m31*mm.m14+mm2.m32*mm.m24+mm2.m33*mm.m34+mm2.m34*mm.m44);
      let m41=(mm2.m41*mm.m11+mm2.m42*mm.m21+mm2.m43*mm.m31+mm2.m44*mm.m41);
      let m42=(mm2.m41*mm.m12+mm2.m42*mm.m22+mm2.m43*mm.m32+mm2.m44*mm.m42);
      let m43=(mm2.m41*mm.m13+mm2.m42*mm.m23+mm2.m43*mm.m33+mm2.m44*mm.m43);
      let m44=(mm2.m41*mm.m14+mm2.m42*mm.m24+mm2.m43*mm.m34+mm2.m44*mm.m44);
      mm.m11 = m11;
      mm.m12 = m12;
      mm.m13 = m13;
      mm.m14 = m14;
      mm.m21 = m21;
      mm.m22 = m22;
      mm.m23 = m23;
      mm.m24 = m24;
      mm.m31 = m31;
      mm.m32 = m32;
      mm.m33 = m33;
      mm.m34 = m34;
      mm.m41 = m41;
      mm.m42 = m42;
      mm.m43 = m43;
      mm.m44 = m44;
      return this;
    }
     divide(divisor) {
      this.$matrix.m11/=divisor;
      this.$matrix.m12/=divisor;
      this.$matrix.m13/=divisor;
      this.$matrix.m14/=divisor;
      this.$matrix.m21/=divisor;
      this.$matrix.m22/=divisor;
      this.$matrix.m23/=divisor;
      this.$matrix.m24/=divisor;
      this.$matrix.m31/=divisor;
      this.$matrix.m32/=divisor;
      this.$matrix.m33/=divisor;
      this.$matrix.m34/=divisor;
      this.$matrix.m41/=divisor;
      this.$matrix.m42/=divisor;
      this.$matrix.m43/=divisor;
      this.$matrix.m44/=divisor;
      return this;
    }
     ortho(left, right, bottom, top, near, far) {
      console.warn("Matrix4.ortho() is deprecated, use .orthographic() instead");
      var tx=(left+right)/(left-right);
      var ty=(top+bottom)/(top-bottom);
      var tz=(far+near)/(far-near);
      var matrix=temp_mats.next().makeIdentity();
      matrix.$matrix.m11 = 2/(left-right);
      matrix.$matrix.m12 = 0;
      matrix.$matrix.m13 = 0;
      matrix.$matrix.m14 = 0;
      matrix.$matrix.m21 = 0;
      matrix.$matrix.m22 = 2/(top-bottom);
      matrix.$matrix.m23 = 0;
      matrix.$matrix.m24 = 0;
      matrix.$matrix.m31 = 0;
      matrix.$matrix.m32 = 0;
      matrix.$matrix.m33 = -2/(far-near);
      matrix.$matrix.m34 = 0;
      matrix.$matrix.m41 = tx;
      matrix.$matrix.m42 = ty;
      matrix.$matrix.m43 = tz;
      matrix.$matrix.m44 = 1;
      this.multiply(matrix);
      return this;
    }
     frustum(left, right, bottom, top, near, far) {
      var matrix=temp_mats.next().makeIdentity();
      var A=(right+left)/(right-left);
      var B=(top+bottom)/(top-bottom);
      var C=-(far+near)/(far-near);
      var D=-(2*far*near)/(far-near);
      matrix.$matrix.m11 = (2*near)/(right-left);
      matrix.$matrix.m12 = 0;
      matrix.$matrix.m13 = 0;
      matrix.$matrix.m14 = 0;
      matrix.$matrix.m21 = 0;
      matrix.$matrix.m22 = 2*near/(top-bottom);
      matrix.$matrix.m23 = 0;
      matrix.$matrix.m24 = 0;
      matrix.$matrix.m31 = A;
      matrix.$matrix.m32 = B;
      matrix.$matrix.m33 = C;
      matrix.$matrix.m34 = -1;
      matrix.$matrix.m41 = 0;
      matrix.$matrix.m42 = 0;
      matrix.$matrix.m43 = D;
      matrix.$matrix.m44 = 0;
      this.isPersp = true;
      this.multiply(matrix);
      return this;
    }
     orthographic(scale, aspect, near, far) {
      let mat=temp_mats.next().makeIdentity();
      let zscale=far-near;
      mat.scale(2.0/aspect, 2.0, -1.0/scale/zscale, 1.0/scale);
      mat.translate(0.0, 0.0, 0.5*zscale-near);
      this.isPersp = true;
      this.multiply(mat);
      return mat;
    }
     perspective(fovy, aspect, zNear, zFar) {
      var top=Math.tan(fovy*Math.PI/360)*zNear;
      var bottom=-top;
      var left=aspect*bottom;
      var right=aspect*top;
      this.frustum(left, right, bottom, top, zNear, zFar);
      return this;
    }
     lookat(pos, target, up) {
      var matrix=lookat_cache_ms.next();
      matrix.makeIdentity();
      var vec=lookat_cache_vs3.next().load(pos).sub(target);
      var len=vec.vectorLength();
      vec.normalize();
      var zvec=vec;
      var yvec=lookat_cache_vs3.next().load(up).normalize();
      var xvec=lookat_cache_vs3.next().load(yvec).cross(zvec).normalize();
      let mm=matrix.$matrix;
      mm.m11 = xvec[0];
      mm.m12 = yvec[0];
      mm.m13 = zvec[0];
      mm.m14 = 0;
      mm.m21 = xvec[1];
      mm.m22 = yvec[1];
      mm.m23 = zvec[1];
      mm.m24 = 0;
      mm.m31 = xvec[2];
      mm.m32 = yvec[2];
      mm.m33 = zvec[2];
      mm.m11 = xvec[0];
      mm.m12 = xvec[1];
      mm.m13 = xvec[2];
      mm.m14 = 0;
      mm.m21 = yvec[0];
      mm.m22 = yvec[1];
      mm.m23 = yvec[2];
      mm.m24 = 0;
      mm.m31 = zvec[0];
      mm.m32 = zvec[1];
      mm.m33 = zvec[2];
      mm.m34 = 0;
      mm.m41 = pos[0];
      mm.m42 = pos[1];
      mm.m43 = pos[2];
      mm.m44 = 1;
      this.multiply(matrix);
      return this;
    }
     makeRotationOnly() {
      var m=this.$matrix;
      m.m41 = m.m42 = m.m43 = 0.0;
      m.m44 = 1.0;
      let l1=Math.sqrt(m.m11*m.m11+m.m12*m.m12+m.m13*m.m13);
      let l2=Math.sqrt(m.m21*m.m21+m.m22*m.m22+m.m23*m.m23);
      let l3=Math.sqrt(m.m31*m.m31+m.m32*m.m32+m.m33*m.m33);
      if (l1) {
          m.m11/=l1;
          m.m12/=l1;
          m.m13/=l1;
      }
      if (l2) {
          m.m21/=l2;
          m.m22/=l2;
          m.m23/=l2;
      }
      if (l3) {
          m.m31/=l3;
          m.m32/=l3;
          m.m33/=l3;
      }
      return this;
    }
     alignAxis(axis, vec) {
      vec = new Vector3(vec);
      vec.normalize();
      let mat=this.inputs.transformMatrix.getValue();
      let m=mat.$matrix;
      let mat2=new Matrix4(mat);
      let loc=new Vector3(), scale=new Vector3(), rot=new Vector3();
      mat2.decompose(loc, rot, scale);
      mat2.makeRotationOnly();
      let axes=mat2.getAsVecs();
      let axis2=(axis+1)%3;
      let axis3=(axis+2)%3;
      axes[axis].load(vec);
      axes[axis2].cross(axes[axis]).cross(axes[axis]);
      axes[axis3].load(axes[axis]).cross(axes[axis2]);
      axes[0][3] = 1.0;
      axes[1][3] = 1.0;
      axes[2][3] = 1.0;
      axes[0].normalize();
      axes[1].normalize();
      axes[2].normalize();
      this.loadFromVecs(axes);
      this.scale(scale[0], scale[1], scale[2]);
      m.m41 = loc[0];
      m.m42 = loc[1];
      m.m43 = loc[2];
      return this;
    }
     decompose(_translate, _rotate, _scale, _skew, _perspective, order=EulerOrders.XYZ) {
      if (this.$matrix.m44===0)
        return false;
      let mat=temp_mats.next().load(this);
      let m=mat.$matrix;
      let t=_translate, r=_rotate, s=_scale;
      if (t) {
          t[0] = m.m41;
          t[1] = m.m42;
          t[2] = m.m43;
      }
      let l1=Math.sqrt(m.m11*m.m11+m.m12*m.m12+m.m13*m.m13);
      let l2=Math.sqrt(m.m21*m.m21+m.m22*m.m22+m.m23*m.m23);
      let l3=Math.sqrt(m.m31*m.m31+m.m32*m.m32+m.m33*m.m33);
      if (l1) {
          m.m11/=l1;
          m.m12/=l1;
          m.m13/=l1;
      }
      if (l2) {
          m.m21/=l2;
          m.m22/=l2;
          m.m23/=l2;
      }
      if (l3) {
          m.m31/=l3;
          m.m32/=l3;
          m.m33/=l3;
      }
      if (s) {
          s[0] = l1;
          s[1] = l2;
          s[2] = l3;
      }
      if (r) {
          let clamp=myclamp;
          let rmat=temp_mats.next().load(this);
          rmat.normalize();
          m = rmat.$matrix;
          let m11=m.m11, m12=m.m12, m13=m.m13, m14=m.m14;
          let m21=m.m21, m22=m.m22, m23=m.m23, m24=m.m24;
          let m31=m.m31, m32=m.m32, m33=m.m33, m34=m.m34;
          if (order===EulerOrders.XYZ) {
              r[1] = Math.asin(clamp(m13, -1, 1));
              if (Math.abs(m13)<0.9999999) {
                  r[0] = Math.atan2(-m23, m33);
                  r[2] = Math.atan2(-m12, m11);
              }
              else {
                r[0] = Math.atan2(m32, m22);
                r[2] = 0;
              }
          }
          else 
            if (order===EulerOrders.YXZ) {
              r[0] = Math.asin(-clamp(m23, -1, 1));
              if (Math.abs(m23)<0.9999999) {
                  r[1] = Math.atan2(m13, m33);
                  r[2] = Math.atan2(m21, m22);
              }
              else {
                r[1] = Math.atan2(-m31, m11);
                r[2] = 0;
              }
          }
          else 
            if (order===EulerOrders.ZXY) {
              r[0] = Math.asin(clamp(m32, -1, 1));
              if (Math.abs(m32)<0.9999999) {
                  r[1] = Math.atan2(-m31, m33);
                  r[2] = Math.atan2(-m12, m22);
              }
              else {
                r[1] = 0;
                r[2] = Math.atan2(m21, m11);
              }
          }
          else 
            if (order===EulerOrders.ZYX) {
              r[1] = Math.asin(-clamp(m31, -1, 1));
              if (Math.abs(m31)<0.9999999) {
                  r[0] = Math.atan2(m32, m33);
                  r[2] = Math.atan2(m21, m11);
              }
              else {
                r[0] = 0;
                r[2] = Math.atan2(-m12, m22);
              }
          }
          else 
            if (order===EulerOrders.YZX) {
              r[2] = Math.asin(clamp(m21, -1, 1));
              if (Math.abs(m21)<0.9999999) {
                  r[0] = Math.atan2(-m23, m22);
                  r[1] = Math.atan2(-m31, m11);
              }
              else {
                r[0] = 0;
                r[1] = Math.atan2(m13, m33);
              }
          }
          else 
            if (order===EulerOrders.XZY) {
              r[2] = Math.asin(-clamp(m12, -1, 1));
              if (Math.abs(m12)<0.9999999) {
                  r[0] = Math.atan2(m32, m22);
                  r[1] = Math.atan2(m13, m11);
              }
              else {
                r[0] = Math.atan2(-m23, m33);
                r[1] = 0;
              }
          }
          else {
            console.warn('unsupported euler order:', order);
          }
      }
    }
     _determinant2x2(a, b, c, d) {
      return a*d-b*c;
    }
     _determinant3x3(a1, a2, a3, b1, b2, b3, c1, c2, c3) {
      return a1*this._determinant2x2(b2, b3, c2, c3)-b1*this._determinant2x2(a2, a3, c2, c3)+c1*this._determinant2x2(a2, a3, b2, b3);
    }
     determinant() {
      return this._determinant4x4();
    }
     _determinant4x4() {
      var a1=this.$matrix.m11;
      var b1=this.$matrix.m12;
      var c1=this.$matrix.m13;
      var d1=this.$matrix.m14;
      var a2=this.$matrix.m21;
      var b2=this.$matrix.m22;
      var c2=this.$matrix.m23;
      var d2=this.$matrix.m24;
      var a3=this.$matrix.m31;
      var b3=this.$matrix.m32;
      var c3=this.$matrix.m33;
      var d3=this.$matrix.m34;
      var a4=this.$matrix.m41;
      var b4=this.$matrix.m42;
      var c4=this.$matrix.m43;
      var d4=this.$matrix.m44;
      return a1*this._determinant3x3(b2, b3, b4, c2, c3, c4, d2, d3, d4)-b1*this._determinant3x3(a2, a3, a4, c2, c3, c4, d2, d3, d4)+c1*this._determinant3x3(a2, a3, a4, b2, b3, b4, d2, d3, d4)-d1*this._determinant3x3(a2, a3, a4, b2, b3, b4, c2, c3, c4);
    }
     _makeAdjoint() {
      var a1=this.$matrix.m11;
      var b1=this.$matrix.m12;
      var c1=this.$matrix.m13;
      var d1=this.$matrix.m14;
      var a2=this.$matrix.m21;
      var b2=this.$matrix.m22;
      var c2=this.$matrix.m23;
      var d2=this.$matrix.m24;
      var a3=this.$matrix.m31;
      var b3=this.$matrix.m32;
      var c3=this.$matrix.m33;
      var d3=this.$matrix.m34;
      var a4=this.$matrix.m41;
      var b4=this.$matrix.m42;
      var c4=this.$matrix.m43;
      var d4=this.$matrix.m44;
      this.$matrix.m11 = this._determinant3x3(b2, b3, b4, c2, c3, c4, d2, d3, d4);
      this.$matrix.m21 = -this._determinant3x3(a2, a3, a4, c2, c3, c4, d2, d3, d4);
      this.$matrix.m31 = this._determinant3x3(a2, a3, a4, b2, b3, b4, d2, d3, d4);
      this.$matrix.m41 = -this._determinant3x3(a2, a3, a4, b2, b3, b4, c2, c3, c4);
      this.$matrix.m12 = -this._determinant3x3(b1, b3, b4, c1, c3, c4, d1, d3, d4);
      this.$matrix.m22 = this._determinant3x3(a1, a3, a4, c1, c3, c4, d1, d3, d4);
      this.$matrix.m32 = -this._determinant3x3(a1, a3, a4, b1, b3, b4, d1, d3, d4);
      this.$matrix.m42 = this._determinant3x3(a1, a3, a4, b1, b3, b4, c1, c3, c4);
      this.$matrix.m13 = this._determinant3x3(b1, b2, b4, c1, c2, c4, d1, d2, d4);
      this.$matrix.m23 = -this._determinant3x3(a1, a2, a4, c1, c2, c4, d1, d2, d4);
      this.$matrix.m33 = this._determinant3x3(a1, a2, a4, b1, b2, b4, d1, d2, d4);
      this.$matrix.m43 = -this._determinant3x3(a1, a2, a4, b1, b2, b4, c1, c2, c4);
      this.$matrix.m14 = -this._determinant3x3(b1, b2, b3, c1, c2, c3, d1, d2, d3);
      this.$matrix.m24 = this._determinant3x3(a1, a2, a3, c1, c2, c3, d1, d2, d3);
      this.$matrix.m34 = -this._determinant3x3(a1, a2, a3, b1, b2, b3, d1, d2, d3);
      this.$matrix.m44 = this._determinant3x3(a1, a2, a3, b1, b2, b3, c1, c2, c3);
    }
     loadSTRUCT(reader) {
      reader(this);
      this.load(this.mat);
      this.__mat = this.mat;
    }
  }
  _ESClass.register(Matrix4);
  _es6_module.add_class(Matrix4);
  Matrix4 = _es6_module.add_export('Matrix4', Matrix4);
  Matrix4.STRUCT = `
mat4 {
  mat      : array(float) | this.getAsArray();
  isPersp  : int          | this.isPersp;
}
`;
  nstructjs.register(Matrix4);
  preMultTemp = new Matrix4();
  window.testmat = (x, y, z) =>    {
    if (x===undefined) {
        x = 0;
    }
    if (y===undefined) {
        y = 0;
    }
    if (z===undefined) {
        z = Math.PI*0.5;
    }
    let m1=new Matrix4();
    m1.euler_rotate(x, y, z);
    let t=[0, 0, 0], r=[0, 0, 0], s=[0, 0, 0];
    m1.decompose(t, r, s);
    window.console.log("\n");
    window.console.log(t);
    window.console.log(r);
    window.console.log(s);
    let mat=m1.clone();
    mat.transpose();
    mat.multiply(m1);
    console.log(mat.toString());
    return r;
  }
  lookat_cache_ms = util.cachering.fromConstructor(Matrix4, 64);
  euler_rotate_mats = util.cachering.fromConstructor(Matrix4, 64);
  temp_mats = util.cachering.fromConstructor(Matrix4, 64);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/vectormath.js');


es6_module_define('pathux', ["./widgets/ui_treeview.js", "./path-controller/util/html5_fileapi.js", "./path-controller/util/graphpack.js", "./widgets/ui_richedit.js", "./widgets/ui_numsliders.js", "./xmlpage/xmlpage.js", "./widgets/ui_listbox.js", "./config/const.js", "./widgets/ui_button.js", "./widgets/ui_lasttool.js", "./screen/ScreenArea.js", "./widgets/ui_widgets2.js", "./widgets/ui_menu.js", "./widgets/ui_curvewidget.js", "./core/units.js", "./core/ui_base.js", "./platforms/electron/electron_api.js", "./widgets/theme_editor.js", "./path-controller/util/polyfill.js", "./widgets/ui_textbox.js", "./widgets/ui_tabs.js", "./util/ScreenOverdraw.js", "./core/ui.js", "./widgets/ui_table.js", "./widgets/ui_widgets.js", "./widgets/ui_noteframe.js", "./widgets/ui_panel.js", "./path-controller/controller.js", "./platforms/platform.js", "./widgets/ui_progress.js", "./screen/FrameManager.js", "./core/ui_theme.js", "./widgets/ui_colorpicker2.js"], function _pathux_module(_es6_module) {
  es6_import(_es6_module, './path-controller/util/polyfill.js');
  var ___xmlpage_xmlpage_js=es6_import(_es6_module, './xmlpage/xmlpage.js');
  for (let k in ___xmlpage_xmlpage_js) {
      _es6_module.add_export(k, ___xmlpage_xmlpage_js[k], true);
  }
  var ___core_ui_base_js=es6_import(_es6_module, './core/ui_base.js');
  for (let k in ___core_ui_base_js) {
      _es6_module.add_export(k, ___core_ui_base_js[k], true);
  }
  var ___core_ui_js=es6_import(_es6_module, './core/ui.js');
  for (let k in ___core_ui_js) {
      _es6_module.add_export(k, ___core_ui_js[k], true);
  }
  var ___widgets_ui_widgets_js=es6_import(_es6_module, './widgets/ui_widgets.js');
  for (let k in ___widgets_ui_widgets_js) {
      _es6_module.add_export(k, ___widgets_ui_widgets_js[k], true);
  }
  var ___widgets_ui_widgets2_js=es6_import(_es6_module, './widgets/ui_widgets2.js');
  for (let k in ___widgets_ui_widgets2_js) {
      _es6_module.add_export(k, ___widgets_ui_widgets2_js[k], true);
  }
  var ___core_ui_theme_js=es6_import(_es6_module, './core/ui_theme.js');
  for (let k in ___core_ui_theme_js) {
      _es6_module.add_export(k, ___core_ui_theme_js[k], true);
  }
  var ___core_units_js=es6_import(_es6_module, './core/units.js');
  for (let k in ___core_units_js) {
      _es6_module.add_export(k, ___core_units_js[k], true);
  }
  var ___widgets_ui_button_js=es6_import(_es6_module, './widgets/ui_button.js');
  for (let k in ___widgets_ui_button_js) {
      _es6_module.add_export(k, ___widgets_ui_button_js[k], true);
  }
  var ___widgets_ui_richedit_js=es6_import(_es6_module, './widgets/ui_richedit.js');
  for (let k in ___widgets_ui_richedit_js) {
      _es6_module.add_export(k, ___widgets_ui_richedit_js[k], true);
  }
  var ___widgets_ui_curvewidget_js=es6_import(_es6_module, './widgets/ui_curvewidget.js');
  for (let k in ___widgets_ui_curvewidget_js) {
      _es6_module.add_export(k, ___widgets_ui_curvewidget_js[k], true);
  }
  var ___widgets_ui_panel_js=es6_import(_es6_module, './widgets/ui_panel.js');
  for (let k in ___widgets_ui_panel_js) {
      _es6_module.add_export(k, ___widgets_ui_panel_js[k], true);
  }
  var ___widgets_ui_colorpicker2_js=es6_import(_es6_module, './widgets/ui_colorpicker2.js');
  for (let k in ___widgets_ui_colorpicker2_js) {
      _es6_module.add_export(k, ___widgets_ui_colorpicker2_js[k], true);
  }
  var ___widgets_ui_tabs_js=es6_import(_es6_module, './widgets/ui_tabs.js');
  for (let k in ___widgets_ui_tabs_js) {
      _es6_module.add_export(k, ___widgets_ui_tabs_js[k], true);
  }
  var ___widgets_ui_listbox_js=es6_import(_es6_module, './widgets/ui_listbox.js');
  for (let k in ___widgets_ui_listbox_js) {
      _es6_module.add_export(k, ___widgets_ui_listbox_js[k], true);
  }
  var ___widgets_ui_menu_js=es6_import(_es6_module, './widgets/ui_menu.js');
  for (let k in ___widgets_ui_menu_js) {
      _es6_module.add_export(k, ___widgets_ui_menu_js[k], true);
  }
  var ___widgets_ui_progress_js=es6_import(_es6_module, './widgets/ui_progress.js');
  for (let k in ___widgets_ui_progress_js) {
      _es6_module.add_export(k, ___widgets_ui_progress_js[k], true);
  }
  var ___widgets_ui_table_js=es6_import(_es6_module, './widgets/ui_table.js');
  for (let k in ___widgets_ui_table_js) {
      _es6_module.add_export(k, ___widgets_ui_table_js[k], true);
  }
  var ___widgets_ui_noteframe_js=es6_import(_es6_module, './widgets/ui_noteframe.js');
  for (let k in ___widgets_ui_noteframe_js) {
      _es6_module.add_export(k, ___widgets_ui_noteframe_js[k], true);
  }
  var ___widgets_ui_numsliders_js=es6_import(_es6_module, './widgets/ui_numsliders.js');
  for (let k in ___widgets_ui_numsliders_js) {
      _es6_module.add_export(k, ___widgets_ui_numsliders_js[k], true);
  }
  var ___widgets_ui_lasttool_js=es6_import(_es6_module, './widgets/ui_lasttool.js');
  for (let k in ___widgets_ui_lasttool_js) {
      _es6_module.add_export(k, ___widgets_ui_lasttool_js[k], true);
  }
  var ___widgets_ui_textbox_js=es6_import(_es6_module, './widgets/ui_textbox.js');
  for (let k in ___widgets_ui_textbox_js) {
      _es6_module.add_export(k, ___widgets_ui_textbox_js[k], true);
  }
  var ___path_controller_util_graphpack_js=es6_import(_es6_module, './path-controller/util/graphpack.js');
  for (let k in ___path_controller_util_graphpack_js) {
      _es6_module.add_export(k, ___path_controller_util_graphpack_js[k], true);
  }
  var ___path_controller_util_html5_fileapi_js=es6_import(_es6_module, './path-controller/util/html5_fileapi.js');
  for (let k in ___path_controller_util_html5_fileapi_js) {
      _es6_module.add_export(k, ___path_controller_util_html5_fileapi_js[k], true);
  }
  var ___path_controller_controller_js=es6_import(_es6_module, './path-controller/controller.js');
  for (let k in ___path_controller_controller_js) {
      _es6_module.add_export(k, ___path_controller_controller_js[k], true);
  }
  var controller1=es6_import(_es6_module, './path-controller/controller.js');
  const controller=controller1;
  _es6_module.add_export('controller', controller);
  var ui_noteframe=es6_import(_es6_module, './widgets/ui_noteframe.js');
  controller1.setNotifier(ui_noteframe);
  var platform1=es6_import(_es6_module, './platforms/platform.js');
  const platform=platform1;
  _es6_module.add_export('platform', platform);
  var electron_api1=es6_import(_es6_module, './platforms/electron/electron_api.js');
  const electron_api=electron_api1;
  _es6_module.add_export('electron_api', electron_api);
  var ___platforms_platform_js=es6_import(_es6_module, './platforms/platform.js');
  for (let k in ___platforms_platform_js) {
      _es6_module.add_export(k, ___platforms_platform_js[k], true);
  }
  var ___widgets_theme_editor_js=es6_import(_es6_module, './widgets/theme_editor.js');
  for (let k in ___widgets_theme_editor_js) {
      _es6_module.add_export(k, ___widgets_theme_editor_js[k], true);
  }
  var ___widgets_ui_treeview_js=es6_import(_es6_module, './widgets/ui_treeview.js');
  for (let k in ___widgets_ui_treeview_js) {
      _es6_module.add_export(k, ___widgets_ui_treeview_js[k], true);
  }
  var ___screen_FrameManager_js=es6_import(_es6_module, './screen/FrameManager.js');
  for (let k in ___screen_FrameManager_js) {
      _es6_module.add_export(k, ___screen_FrameManager_js[k], true);
  }
  var ___screen_ScreenArea_js=es6_import(_es6_module, './screen/ScreenArea.js');
  for (let k in ___screen_ScreenArea_js) {
      _es6_module.add_export(k, ___screen_ScreenArea_js[k], true);
  }
  var ___util_ScreenOverdraw_js=es6_import(_es6_module, './util/ScreenOverdraw.js');
  for (let k in ___util_ScreenOverdraw_js) {
      _es6_module.add_export(k, ___util_ScreenOverdraw_js[k], true);
  }
  var cconst1=es6_import_item(_es6_module, './config/const.js', 'default');
  const cconst=cconst1;
  _es6_module.add_export('cconst', cconst);
}, '/dev/fairmotion/src/path.ux/scripts/pathux.js');


es6_module_define('electron_api', ["../../config/const.js", "../../util/util.js", "../platform_base.js", "../../core/ui_base.js", "../../widgets/ui_menu.js"], function _electron_api_module(_es6_module) {
  "use strict";
  function getElectronVersion() {
    let key=navigator.userAgent;
    let i=key.search("Electron");
    key = key.slice(i+9, key.length);
    i = key.search(/[ \t]/);
    if (i>=0) {
        key = key.slice(0, i);
    }
    key = key.trim();
    key = key.split(".").map((f) =>      {
      return parseInt(f);
    });
    return key;
  }
  function getElectron() {
    return require('electron');
  }
  function myRequire(mod) {
    return globalThis.require(mod);
  }
  var Menu=es6_import_item(_es6_module, '../../widgets/ui_menu.js', 'Menu');
  var DropBox=es6_import_item(_es6_module, '../../widgets/ui_menu.js', 'DropBox');
  var getIconManager=es6_import_item(_es6_module, '../../core/ui_base.js', 'getIconManager');
  var cconst=es6_import_item(_es6_module, '../../config/const.js', 'default');
  var util=es6_import(_es6_module, '../../util/util.js');
  var FileDialogArgs=es6_import_item(_es6_module, '../platform_base.js', 'FileDialogArgs');
  var FilePath=es6_import_item(_es6_module, '../platform_base.js', 'FilePath');
  function getFilename(path) {
    let filename=path.replace(/\\/g, "/");
    let i=filename.length-1;
    while (i>=0&&filename[i]!=="/") {
      i--;
    }
    if (i>0) {
        filename = filename.slice(i, filename.length).trim();
    }
    return filename;
  }
  let _menu_init=false;
  let _init=false;
  let mimemap={"js": "application/javascript", 
   "json": "text/json", 
   "png": "image/png", 
   "svg": "image/svg+xml", 
   "jpg": "image/jpeg", 
   "txt": "text/plain", 
   "html": "text/html", 
   "css": "text/css", 
   "ts": "application/typescript", 
   "py": "application/python", 
   "c": "application/c", 
   "cpp": "application/cpp", 
   "cc": "application/cpp", 
   "h": "application/c", 
   "hh": "application/cpp", 
   "hpp": "application/cpp", 
   "xml": "text/xml", 
   "sh": "application/bash", 
   "mjs": "application/javascript", 
   "cjs": "application/javascript", 
   "gif": "image/gif"}
  let electron_menu_idgen=1;
  let ipcRenderer;
  class ElectronMenu extends Array {
     constructor(args={}) {
      super();
      this._ipcId = electron_menu_idgen++;
      for (let k in args) {
          this[k] = args[k];
      }
    }
     insert(i, item) {
      this.length++;
      let j=this.length-1;
      while (j>i) {
        this[j] = this[j-1];
        j--;
      }
      this[i] = item;
      return this;
    }
    static  setApplicationMenu(menu) {
      initElectronIpc();
      ipcRenderer.invoke("set-menu-bar", menu);
    }
     closePopup() {
      ipcRenderer.invoke("close-menu", this._ipcId);
    }
     append(item) {
      this.push(item);
    }
     popup(args) {
      let $_t0ravh=args, x=$_t0ravh.x, y=$_t0ravh.y, callback=$_t0ravh.callback;
      callback = wrapRemoteCallback("popup_menu_click", callback);
      const $_t1slfe=require('electron'), ipcRenderer=$_t1slfe.ipcRenderer;
      ipcRenderer.invoke("popup-menu", this, x, y, callback);
    }
  }
  _ESClass.register(ElectronMenu);
  _es6_module.add_class(ElectronMenu);
  ElectronMenu = _es6_module.add_export('ElectronMenu', ElectronMenu);
  let callbacks={}
  let keybase=1;
  function wrapRemoteCallback(key, callback) {
    key = "remote_"+key+(keybase++);
    callbacks[key] = callback;
    return key;
  }
  wrapRemoteCallback = _es6_module.add_export('wrapRemoteCallback', wrapRemoteCallback);
  let ipcInit=false;
  function initElectronIpc() {
    if (ipcInit) {
        return ;
    }
    ipcInit = true;
    ipcRenderer = require('electron').ipcRenderer;
    ipcRenderer.on('invoke-menu-callback', (event, key, args) =>      {
      console.error("Electron menu callback", key, args);
      callbacks[key].apply(undefined, args);
    });
  }
  class ElectronMenuItem  {
     constructor(args) {
      for (let k in args) {
          this[k] = args[k];
      }
      if (this.click) {
          this.click = wrapRemoteCallback("menu_click", this.click);
      }
    }
  }
  _ESClass.register(ElectronMenuItem);
  _es6_module.add_class(ElectronMenuItem);
  ElectronMenuItem = _es6_module.add_export('ElectronMenuItem', ElectronMenuItem);
  function patchDropBox() {
    initElectronIpc();
    DropBox.prototype._onpress = function _onpress(e) {
      if (this._menu!==undefined) {
          this._menu.close();
          this._menu = undefined;
          this._pressed = false;
          this._redraw();
          return ;
      }
      this._build_menu();
      let emenu=buildElectronMenu(this._menu);
      this._menu.close = () =>        {
        emenu.closePopup();
      }
      if (this._menu===undefined) {
          return ;
      }
      this._menu._dropbox = this;
      this.dom._background = this.getDefault("BoxDepressed");
      this._background = this.getDefault("BoxDepressed");
      this._redraw();
      this._pressed = true;
      this.setCSS();
      let onclose=this._menu.onclose;
      this._menu.onclose = () =>        {
        this._pressed = false;
        this._redraw();
        let menu=this._menu;
        if (menu) {
            this._menu = undefined;
            menu._dropbox = undefined;
        }
        if (onclose) {
            onclose.call(menu);
        }
      }
      let menu=this._menu;
      let screen=this.getScreen();
      let dpi=this.getDPI();
      let x=e.x, y=e.y;
      let rects=this.dom.getClientRects();
      x = rects[0].x;
      y = rects[0].y+Math.ceil(rects[0].height);
      x = ~~x;
      y = ~~y;
      emenu.popup({x: x, 
     y: y, 
     callback: () =>          {
          if (this._menu) {
              this._menu.onclose();
          }
        }});
    }
  }
  let on_tick=() =>    {
    let nativeTheme=getElectron().remote.nativeTheme;
    let mode=nativeTheme.shouldUseDarkColors ? "dark" : "light";
    if (mode!==cconst.colorSchemeType) {
        nativeTheme.themeSource = cconst.colorSchemeType;
    }
  }
  function checkInit() {
    if (window.haveElectron&&!_init) {
        _init = true;
        patchDropBox();
        setInterval(on_tick, 350);
    }
  }
  checkInit = _es6_module.add_export('checkInit', checkInit);
  let iconcache={}
  iconcache = _es6_module.add_export('iconcache', iconcache);
  function makeIconKey(icon, iconsheet, invertColors) {
    return ""+icon+":"+iconsheet+":"+invertColors;
  }
  function getNativeIcon(icon, iconsheet, invertColors, size) {
    if (iconsheet===undefined) {
        iconsheet = 0;
    }
    if (invertColors===undefined) {
        invertColors = false;
    }
    if (size===undefined) {
        size = 16;
    }
    let icongen;
    try {
      icongen = myRequire("./icogen.js");
    }
    catch (error) {
        icongen = myRequire("./icogen.cjs");
    }
    window.icongen = icongen;
    let nativeImage=getElectron().nativeImage;
    let manager=getIconManager();
    let sheet=manager.findSheet(iconsheet);
    let images=[];
    let sizes=icongen.GetRequiredICOImageSizes();
    if (1) {
        let iconsheet=manager.findClosestSheet(size);
        let tilesize=manager.getTileSize(iconsheet);
        let canvas=document.createElement("canvas");
        let g=canvas.getContext("2d");
        canvas.width = canvas.height = size;
        if (invertColors) {
            g.filter = "invert(100%)";
        }
        let scale=size/tilesize;
        g.scale(scale, scale);
        manager.canvasDraw({getDPI: () =>            {
            return 1.0;
          }}, canvas, g, icon, 0, 0, iconsheet);
        let header="data:image/png;base64,";
        let data=canvas.toDataURL();
        data = data.slice(header.length, data.length);
        data = Buffer.from(data, "base64");
        myRequire("fs").writeFileSync("./myicon2.png", data);
        images.push(data);
    }
    return "myicon2.png";
    return icon;
    return undefined;
    window._icon = icon;
    return icon;
  }
  getNativeIcon = _es6_module.add_export('getNativeIcon', getNativeIcon);
  let map={CTRL: "Control", 
   ALT: "Alt", 
   SHIFT: "Shift", 
   COMMAND: "Command"}
  function buildElectronHotkey(hk) {
    hk = hk.trim().replace(/[ \t-]+/g, "+");
    for (let k in map) {
        hk = hk.replace(k, map[k]);
    }
    return hk;
  }
  buildElectronHotkey = _es6_module.add_export('buildElectronHotkey', buildElectronHotkey);
  function buildElectronMenu(menu) {
    let electron=getElectron().remote;
    initElectronIpc();
    let emenu=new ElectronMenu();
    let buildItem=(item) =>      {
      if (item._isMenu) {
          let menu2=item._menu;
          return new ElectronMenuItem({submenu: buildElectronMenu(item._menu), 
       label: menu2.getAttribute("title")});
      }
      let hotkey=item.hotkey;
      let icon=item.icon;
      let label=""+item.label;
      if (hotkey&&typeof hotkey!=="string") {
          hotkey = buildElectronHotkey(hotkey);
      }
      else {
        hotkey = ""+hotkey;
      }
      if (icon<0) {
          icon = undefined;
      }
      let args={id: ""+item._id, 
     label: label, 
     accelerator: hotkey, 
     icon: icon ? getNativeIcon(icon) : undefined, 
     click: function () {
          menu.onselect(item._id);
        }, 
     registerAccelerator: false}
      return new ElectronMenuItem(args);
    }
    for (let item of menu.items) {
        emenu.append(buildItem(item));
    }
    return emenu;
  }
  buildElectronMenu = _es6_module.add_export('buildElectronMenu', buildElectronMenu);
  function initMenuBar(menuEditor, override) {
    if (override===undefined) {
        override = false;
    }
    checkInit();
    if (!window.haveElectron) {
        return ;
    }
    if (_menu_init&&!override) {
        return ;
    }
    _menu_init = true;
    let electron=getElectron().remote;
    let menu=new ElectronMenu();
    let _roles=new Set(["undo", "redo", "cut", "copy", "paste", "delete", "about", "quit", "open", "save", "load", "paste", "cut", "zoom"]);
    let roles={}
    for (let k of _roles) {
        roles[k] = k;
    }
    roles = Object.assign(roles, {"select all": "selectAll", 
    "file": "fileMenu", 
    "edit": "editMenu", 
    "view": "viewMenu", 
    "app": "appMenu", 
    "help": "help", 
    "zoom in": "zoomIn", 
    "zoom out": "zoomOut"});
    let header=menuEditor.header;
    for (let dbox of header.traverse(DropBox)) {
        dbox._build_menu();
        dbox.update();
        dbox._build_menu();
        let menu2=dbox._menu;
        menu2.ctx = dbox.ctx;
        menu2._init();
        menu2.update();
        let title=dbox._genLabel();
        let args={label: title, 
      tooltip: dbox.description, 
      submenu: buildElectronMenu(menu2)};
        console.error(menu);
        menu.insert(0, new ElectronMenuItem(args));
    }
    ElectronMenu.setApplicationMenu(menu);
  }
  initMenuBar = _es6_module.add_export('initMenuBar', initMenuBar);
  var PlatformAPI=es6_import_item(_es6_module, '../platform_base.js', 'PlatformAPI');
  var isMimeText=es6_import_item(_es6_module, '../platform_base.js', 'isMimeText');
  class platform extends PlatformAPI {
    static  showOpenDialog(title, args=new FileDialogArgs()) {
      const $_t2kpmj=require('electron').remote, dialog=$_t2kpmj.dialog;
      console.log(args.filters);
      let eargs={defaultPath: args.defaultPath, 
     filters: this._sanitizeFilters(args.filters??[]), 
     properties: ["openFile", "showHiddenFiles", "createDirectory"]};
      if (args.multi) {
          eargs.properties.push("multiSelections");
      }
      if (!args.addToRecentList) {
          eargs.properties.push("dontAddToRecent");
      }
      initElectronIpc();
      return new Promise((accept, reject) =>        {
        ipcRenderer.invoke('show-open-dialog', eargs, wrapRemoteCallback("open-dialog", (ret) =>          {
          if (ret.canceled||ret.cancelled) {
              reject("cancel");
          }
          else {
            accept(ret.filePaths.map((f) =>              {
              return new FilePath(f, getFilename(f));
            }));
          }
        }), makeRemoteCallback("show-open-dialog", (error) =>          {
          reject(error);
        }));
      });
    }
    static  _sanitizeFilters(filters) {
      let filters2=[];
      for (let filter of filters) {
          if (Array.isArray(filter)) {
              let ext=filter[0];
              filter = {extensions: filter};
              ext = ext.replace(/\./g, "").trim().toLowerCase();
              if (ext in mimemap) {
                  filter.mime = mimemap[ext];
              }
              filter.name = ext;
          }
          console.log(filter.extensions);
          filter.extensions = filter.extensions.map((f) =>            {
            return f.startsWith(".") ? f.slice(1, f.length) : f;
          });
          filters2.push(filter);
      }
      return filters2;
    }
    static  showSaveDialog(title, filedata_cb, args=new FileDialogArgs()) {
      const $_t3oqtm=require('electron').remote, dialog=$_t3oqtm.dialog;
      console.log(args.filters);
      let eargs={defaultPath: args.defaultPath, 
     filters: this._sanitizeFilters(args.filters??[]), 
     properties: ["openFile", "showHiddenFiles", "createDirectory"]};
      if (args.multi) {
          eargs.properties.push("multiSelections");
      }
      if (!args.addToRecentList) {
          eargs.properties.push("dontAddToRecent");
      }
      return new Promise((accept, reject) =>        {
        dialog.showSaveDialog(undefined, eargs).then((ret) =>          {
          if (ret.canceled) {
              reject("cancel");
          }
          else {
            let path=ret.filePath;
            let filedata=filedata_cb();
            if (__instance_of(filedata, ArrayBuffer)) {
                filedata = new Uint8Array(filedata);
            }
            require('fs').writeFileSync(path, filedata);
            console.log("saved file", filedata);
            accept(new FilePath(path, getFilename(path)));
          }
        });
      });
    }
    static  readFile(path, mime) {
      return new Promise((accept, reject) =>        {
        let fs=require('fs');
        if (isMimeText(mime)) {
            accept(fs.readFileSync(path.data, "utf8"));
        }
        else {
          accept(fs.readFileSync(path.data).buffer);
        }
      });
    }
    static  writeFile(data, handle, mime) {
      return new Promise((accept, reject) =>        {
        let fs=require('fs');
        fs.writeFileSync(handle.data, data);
        accept(handle);
      });
    }
  }
  _ESClass.register(platform);
  _es6_module.add_class(platform);
  platform = _es6_module.add_export('platform', platform);
}, '/dev/fairmotion/src/path.ux/scripts/platforms/electron/electron_api.js');


es6_module_define('icogen', [], function _icogen_module(_es6_module) {
  "use strict";
  if (window.haveElectron) {
      let fs=require("fs");
      let path=require("path");
      let pngjsNozlib=require("pngjs-nozlib");
      let png=require("pngjs");
      const REQUIRED_IMAGE_SIZES=[16, 24, 32, 48, 64, 128, 256];
      const DEFAULT_FILE_NAME='app';
      const FILE_EXTENSION='.ico';
      const HEADER_SIZE=6;
      const DIRECTORY_SIZE=16;
      const BITMAPINFOHEADER_SIZE=40;
      const BI_RGB=0;
      const convertPNGtoDIB=(src, width, height, bpp) =>        {
        const cols=width*bpp;
        const rows=height*cols;
        const rowEnd=rows-cols;
        const dest=Buffer.alloc(src.length);
        for (let row=0; row<rows; row+=cols) {
            for (let col=0; col<cols; col+=bpp) {
                let pos=row+col;
                const r=src.readUInt8(pos);
                const g=src.readUInt8(pos+1);
                const b=src.readUInt8(pos+2);
                const a=src.readUInt8(pos+3);
                pos = rowEnd-row+col;
                dest.writeUInt8(b, pos);
                dest.writeUInt8(g, pos+1);
                dest.writeUInt8(r, pos+2);
                dest.writeUInt8(a, pos+3);
            }
        }
        return dest;
      };
      const createBitmapInfoHeader=(png, compression) =>        {
        const b=Buffer.alloc(BITMAPINFOHEADER_SIZE);
        b.writeUInt32LE(BITMAPINFOHEADER_SIZE, 0);
        b.writeInt32LE(png.width, 4);
        b.writeInt32LE(png.height*2, 8);
        b.writeUInt16LE(1, 12);
        b.writeUInt16LE(png.bpp*8, 14);
        b.writeUInt32LE(compression, 16);
        b.writeUInt32LE(png.data.length, 20);
        b.writeInt32LE(0, 24);
        b.writeInt32LE(0, 28);
        b.writeUInt32LE(0, 32);
        b.writeUInt32LE(0, 36);
        return b;
      };
      const createDirectory=(png, offset) =>        {
        const b=Buffer.alloc(DIRECTORY_SIZE);
        const size=png.data.length+BITMAPINFOHEADER_SIZE;
        const width=256<=png.width ? 0 : png.width;
        const height=256<=png.height ? 0 : png.height;
        const bpp=png.bpp*8;
        b.writeUInt8(width, 0);
        b.writeUInt8(height, 1);
        b.writeUInt8(0, 2);
        b.writeUInt8(0, 3);
        b.writeUInt16LE(1, 4);
        b.writeUInt16LE(bpp, 6);
        b.writeUInt32LE(size, 8);
        b.writeUInt32LE(offset, 12);
        return b;
      };
      const createFileHeader=(count) =>        {
        const b=Buffer.alloc(HEADER_SIZE);
        b.writeUInt16LE(0, 0);
        b.writeUInt16LE(1, 2);
        b.writeUInt16LE(count, 4);
        return b;
      };
      const checkOptions=(options) =>        {
        if (options) {
            return {name: typeof options.name==='string'&&options.name!=='' ? options.name : DEFAULT_FILE_NAME, 
        sizes: Array.isArray(options.sizes) ? options.sizes : REQUIRED_IMAGE_SIZES}
        }
        else {
          return {name: DEFAULT_FILE_NAME, 
       sizes: REQUIRED_IMAGE_SIZES}
        }
      };
      const GetRequiredICOImageSizes=() =>        {
        return REQUIRED_IMAGE_SIZES;
      };
      let stream=require("stream");
      class WriteStream extends stream.Writable {
         constructor() {
          super();
          this.data = [];
        }
         _write(chunk, encoding, cb) {
          let buf=chunk;
          if (!(__instance_of(buf, Buffer))) {
              Buffer.from(chunk, encoding);
          }
          for (let i=0; i<buf.length; i++) {
              this.data.push(buf[i]);
          }
          cb(null);
        }
         end() {
          this.data = Buffer.from(this.data);
          super.end();
        }
      }
      _ESClass.register(WriteStream);
      _es6_module.add_class(WriteStream);
      exports.GetRequiredICOImageSizes = GetRequiredICOImageSizes;
      const GenerateICO=(images, logger) =>        {
        if (logger===undefined) {
            logger = console;
        }
        logger.log('ICO:');
        const stream=new WriteStream();
        stream.write(createFileHeader(images.length), 'binary');
        let pngs=[];
        for (let image of images) {
            pngs.push(pngjsNozlib.PNG.sync.read(image));
        }
        let offset=HEADER_SIZE+DIRECTORY_SIZE*images.length;
        pngs.forEach((png) =>          {
          const directory=createDirectory(png, offset);
          stream.write(directory, 'binary');
          offset+=png.data.length+BITMAPINFOHEADER_SIZE;
        });
        pngs.forEach((png) =>          {
          const header=createBitmapInfoHeader(png, BI_RGB);
          stream.write(header, 'binary');
          const dib=convertPNGtoDIB(png.data, png.width, png.height, png.bpp);
          stream.write(dib, 'binary');
        });
        stream.end();
        return stream.data;
      };
      exports.GenerateICO = GenerateICO;
      let _default=GenerateICO;
      exports.default = _default;
  }
}, '/dev/fairmotion/src/path.ux/scripts/platforms/electron/icogen.js');


es6_module_define('platform', [], function _platform_module(_es6_module) {
  let promise;
  if (window.haveElectron) {
      promise = _es_dynamic_import(_es6_module, './electron/electron_api.js');
  }
  else {
    promise = _es_dynamic_import(_es6_module, './web/web_api.js');
  }
  var platform;
  platform = _es6_module.add_export('platform', platform);
  promise.then((module) =>    {
    platform = module.platform;
  });
}, '/dev/fairmotion/src/path.ux/scripts/platforms/platform.js');


es6_module_define('platform_base', [], function _platform_base_module(_es6_module) {
  const mimeMap={".js": "application/javascript", 
   ".json": "text/json", 
   ".html": "text/html", 
   ".txt": "text/plain", 
   ".jpg": "image/jpeg", 
   ".png": "image/png", 
   ".tiff": "image/tiff", 
   ".gif": "image/gif", 
   ".bmp": "image/bitmap", 
   ".tga": "image/targa", 
   ".svg": "image/svg+xml", 
   ".xml": "text/xml"}
  _es6_module.add_export('mimeMap', mimeMap);
  var textMimes=new Set(["application/javascript", "application/x-javscript", "image/svg+xml", "application/xml"]);
  textMimes = _es6_module.add_export('textMimes', textMimes);
  function isMimeText(mime) {
    if (!mime) {
        return false;
    }
    if (mime.startsWith("text")) {
        return true;
    }
    return textMimes.has(mime);
  }
  isMimeText = _es6_module.add_export('isMimeText', isMimeText);
  function getExtension(path) {
    if (!path) {
        return "";
    }
    let i=path.length;
    while (i>0&&path[i]!==".") {
      i--;
    }
    return path.slice(i, path.length).trim().toLowerCase();
  }
  getExtension = _es6_module.add_export('getExtension', getExtension);
  function getMime(path) {
    let ext=getExtension(path);
    if (ext in mimeMap) {
        return mimeMap[ext];
    }
    return "application/x-octet-stream";
  }
  getMime = _es6_module.add_export('getMime', getMime);
  class PlatformAPI  {
    static  writeFile(data, handle, mime) {
      throw new Error("implement me");
    }
    static  resolveURL(path, base=location.href) {
      base = base.trim();
      if (path.startsWith("./")) {
          path = path.slice(2, path.length).trim();
      }
      while (path.startsWith("/")) {
        path = path.slice(1, path.length).trim();
      }
      while (base.endsWith("/")) {
        base = base.slice(0, base.length-1).trim();
      }
      let exts=["html", "txt", "js", "php", "cgi"];
      for (let ext of exts) {
          ext = "."+ext;
          if (base.endsWith(ext)) {
              let i=base.length-1;
              while (i>0&&base[i]!=="/") {
                i--;
              }
              base = base.slice(0, i).trim();
          }
      }
      while (base.endsWith("/")) {
        base = base.slice(0, base.length-1).trim();
      }
      path = (base+"/"+path).split("/");
      let path2=[];
      for (let i=0; i<path.length; i++) {
          if (path[i]==="..") {
              path2.pop();
          }
          else {
            path2.push(path[i]);
          }
      }
      return path2.join("/");
    }
    static  showOpenDialog(title, args=new FileDialogArgs()) {
      throw new Error("implement me");
    }
    static  showSaveDialog(title, savedata_cb, args=new FileDialogArgs()) {
      throw new Error("implement me");
    }
    static  readFile(path, mime) {
      throw new Error("implement me");
    }
  }
  _ESClass.register(PlatformAPI);
  _es6_module.add_class(PlatformAPI);
  PlatformAPI = _es6_module.add_export('PlatformAPI', PlatformAPI);
  class FileDialogArgs  {
     constructor() {
      this.multi = false;
      this.addToRecentList = false;
      this.filters = [];
    }
  }
  _ESClass.register(FileDialogArgs);
  _es6_module.add_class(FileDialogArgs);
  FileDialogArgs = _es6_module.add_export('FileDialogArgs', FileDialogArgs);
  class FilePath  {
     constructor(data, filename="unnamed") {
      this.data = data;
      this.filename = filename;
    }
  }
  _ESClass.register(FilePath);
  _es6_module.add_class(FilePath);
  FilePath = _es6_module.add_export('FilePath', FilePath);
}, '/dev/fairmotion/src/path.ux/scripts/platforms/platform_base.js');


es6_module_define('web_api', ["../../path-controller/util/html5_fileapi.js", "../platform_base.js"], function _web_api_module(_es6_module) {
  var PlatformAPI=es6_import_item(_es6_module, '../platform_base.js', 'PlatformAPI');
  var isMimeText=es6_import_item(_es6_module, '../platform_base.js', 'isMimeText');
  var saveFile=es6_import_item(_es6_module, '../../path-controller/util/html5_fileapi.js', 'saveFile');
  var loadFile=es6_import_item(_es6_module, '../../path-controller/util/html5_fileapi.js', 'loadFile');
  var FileDialogArgs=es6_import_item(_es6_module, '../platform_base.js', 'FileDialogArgs');
  var FilePath=es6_import_item(_es6_module, '../platform_base.js', 'FilePath');
  var mimeMap=es6_import_item(_es6_module, '../platform_base.js', 'mimeMap');
  function getWebFilters(filters) {
    if (filters===undefined) {
        filters = [];
    }
    let types=[];
    for (let item of filters) {
        let mime=item.mime;
        let exts=[];
        for (let ext of item.extensions) {
            ext = "."+ext;
            if (ext.toLowerCase() in mimeMap) {
                mime = mime!==undefined ? mime : mimeMap[ext.toLowerCase()];
            }
            exts.push(ext);
        }
        if (!mime) {
            mime = "application/x-octet-stream";
        }
        types.push({description: item.name, 
      accept: {[mime]: exts}});
    }
    return types;
  }
  getWebFilters = _es6_module.add_export('getWebFilters', getWebFilters);
  class platform extends PlatformAPI {
    static  showOpenDialog(title, args=new FileDialogArgs()) {
      let types=getWebFilters(args.filters);
      return new Promise((accept, reject) =>        {
        window.showOpenFilePicker({multiple: args.multi, 
      types: types}).then((arg) =>          {
          let paths=[];
          for (let file of arg) {
              paths.push(new FilePath(file, file.name));
          }
          accept(paths);
        });
      });
    }
    static  writeFile(data, handle, mime) {
      handle = handle.data;
      return handle.createWritable().then((file) =>        {
        file.write(data);
        file.close();
      });
    }
    static  showSaveDialog(title, savedata_cb, args=new FileDialogArgs()) {
      if (!window.showSaveFilePicker) {
          return this.showSaveDialog_old(...arguments);
      }
      let types=getWebFilters(args.filters);
      return new Promise((accept, reject) =>        {
        let fname;
        let saveHandle=window.showSaveFilePicker({types: types});
        let handle;
        saveHandle.then((handle1) =>          {
          handle = handle1;
          fname = handle.name;
          console.log("saveHandle", handle);
          return handle.createWritable();
        }).then((file) =>          {
          let savedata=savedata_cb();
          if (__instance_of(savedata, Uint8Array)||__instance_of(savedata, DataView)) {
              savedata = savedata.buffer;
          }
          file.write(savedata);
          file.close();
          let path=new FilePath(handle, fname);
          accept(path);
        });
      });
    }
    static  showSaveDialog_old(title, savedata, args=new FileDialogArgs()) {
      let exts=[];
      for (let list of args.filters) {
          if (!Array.isArray(list)&&list.filters) {
              list = list.filters;
          }
          for (let ext of list) {
              exts.push(ext);
          }
      }
      return new Promise((accept, reject) =>        {
        saveFile(savedata);
        window.setTimeout(() =>          {
          accept("undefined");
        });
      });
    }
    static  readFile(path, mime="") {
      if (mime==="") {
          mime = path.filename;
          let i=mime.length-1;
          while (i>0&&mime[i]!==".") {
            i--;
          }
          mime = mime.slice(i, mime.length).trim().toLowerCase();
          if (mime in mimeMap) {
              mime = mimeMap[mime];
          }
      }
      return new Promise((accept, reject) =>        {
        path.data.getFile().then((file) =>          {
          console.log("file!", file);
          let promise;
          if (isMimeText(mime)) {
              promise = file.text();
          }
          else {
            promise = file.arrayBuffer();
          }
          promise.then((data) =>            {
            accept(data);
          });
        });
      });
      return new Promise((accept, reject) =>        {
        let data=path.data;
        if (isMimeText(mime)) {
            let s='';
            data = new Uint8Array(data);
            for (let i=0; i<data.length; i++) {
                s+=String.fromCharCode(data[i]);
            }
            data = s;
        }
        accept(data);
      });
    }
  }
  _ESClass.register(platform);
  _es6_module.add_class(platform);
  platform = _es6_module.add_export('platform', platform);
}, '/dev/fairmotion/src/path.ux/scripts/platforms/web/web_api.js');


es6_module_define('AreaDocker', ["../config/const.js", "../core/ui_base.js", "../path-controller/util/struct.js", "./ScreenArea.js", "../widgets/ui_menu.js", "../core/ui.js", "./area_wrangler.js", "../path-controller/util/util.js"], function _AreaDocker_module(_es6_module) {
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var saveUIData=es6_import_item(_es6_module, '../core/ui_base.js', 'saveUIData');
  var loadUIData=es6_import_item(_es6_module, '../core/ui_base.js', 'loadUIData');
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var nstructjs=es6_import(_es6_module, '../path-controller/util/struct.js');
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  var Area=es6_import_item(_es6_module, './ScreenArea.js', 'Area');
  var Icons=es6_import_item(_es6_module, '../core/ui_base.js', 'Icons');
  var startMenu=es6_import_item(_es6_module, '../widgets/ui_menu.js', 'startMenu');
  var getAreaIntName=es6_import_item(_es6_module, './area_wrangler.js', 'getAreaIntName');
  var setAreaTypes=es6_import_item(_es6_module, './area_wrangler.js', 'setAreaTypes');
  var AreaWrangler=es6_import_item(_es6_module, './area_wrangler.js', 'AreaWrangler');
  var areaclasses=es6_import_item(_es6_module, './area_wrangler.js', 'areaclasses');
  let ignore=0;
  window.testSnapScreenVerts = function (arg) {
    let screen=CTX.screen;
    screen.unlisten();
    screen.on_resize([screen.size[0]-75, screen.size[1]], screen.size);
    screen.on_resize = screen.updateSize = () =>      {    }
    let p=CTX.propsbar;
    p.pos[0]+=50;
    p.owning_sarea.loadFromPosSize();
    screen.regenBorders();
    screen.size[0] = window.innerWidth-5;
    screen.snapScreenVerts(arg);
  }
  class AreaDocker extends Container {
     constructor() {
      super();
      this.tbar = this.tabs();
      this.tbar.enableDrag();
      this.tbar.addEventListener("dragstart", (e) =>        {
        console.log("drag start", e);
        let name=this.tbar.tbar.tabs.active.name;
        let id=this.tbar.tbar.tabs.active._id;
        let sarea=this.getArea().owning_sarea;
        let area=this.getArea();
        this.ctx.screen.dragArea = [area, sarea];
        e.dataTransfer.setData("area", name+"|"+this._id);
        e.preventDefault();
      });
      this.tbar.addEventListener("dragover", (e) =>        {
        console.log("drag over");
        console.log(e.dataTransfer.getData("area"));
        let data=e.dataTransfer.getData("area");
        if (!data) {
            return ;
        }
        let $_t0rrig=this.ctx.screen.dragArea, area=$_t0rrig[0], sarea=$_t0rrig[1];
        if (!area||this.getArea()===area) {
            return ;
        }
        if (area.constructor.define().areaname in this.getArea().owning_sarea.editormap) {
            return ;
        }
        this.ctx.screen.dragArea[1] = this.getArea().owning_sarea;
        try {
          sarea.removeChild(area);
        }
        catch (error) {
            util.print_stack(error);
        }
        this.getArea().owning_sarea.appendChild(area);
        this.rebuild();
        e.preventDefault();
      });
      this.tbar.addEventListener("dragexit", (e) =>        {
        console.log("drag exit");
        console.log(e.dataTransfer.getData("area"));
        if (this.tbar.__fake) {
            this.tbar.removeTab(this.tbar.__fake);
            this.tbar.__fake = undefined;
        }
      });
      this.tbar.addEventListener("drop", (e) =>        {
        console.log("drop event", e);
        console.log(e.dataTransfer.getData("area"));
      });
      this.tbar.addEventListener("dragend", (e) =>        {
        console.log("drag end event", e);
        console.log(e.dataTransfer.getData("area"));
      });
      this.tbar.onchange = (tab) =>        {
        if (ignore) {
            return ;
        }
        if (!tab||!this.getArea()||!this.getArea().parentWidget) {
            return ;
        }
        if (tab.id==="add") {
            this.addTabMenu(tab);
            return ;
        }
        console.warn("CHANGE AREA", tab.id, this.id);
        let sarea=this.getArea().parentWidget;
        if (!sarea) {
            return ;
        }
        for (let area of sarea.editors) {
            if (area._id===tab.id&&area!==sarea.area) {
                let ud=saveUIData(this.tbar, "tabs");
                sarea.switch_editor(area.constructor);
                area._init();
                area.flushUpdate();
                if (area.switcher) {
                    ignore++;
                    area.switcher.update();
                    area.switcher.tbar.setActive(area._id);
                    try {
                      loadUIData(sarea.area.switcher.tbar, ud);
                    }
                    finally {
                        ignore = Math.max(ignore-1, 0);
                      }
                    area.switcher.rebuild();
                }
            }
        }
      };
    }
     addTabMenu(tab) {
      console.log("Add Tab!");
      let rect=tab.getClientRects()[0];
      let mpos=this.ctx.screen.mpos;
      let menu=UIBase.createElement("menu-x");
      menu.closeOnMouseUp = false;
      menu.ctx = this.ctx;
      menu._init();
      let prop=Area.makeAreasEnum();
      let sarea=this.getArea().parentWidget;
      if (!sarea) {
          return ;
      }
      for (let k in Object.assign({}, prop.values)) {
          let ok=true;
          for (let area of sarea.editors) {
              if (area.constructor.define().uiname===k) {
                  ok = false;
              }
          }
          if (!ok) {
              continue;
          }
          let icon=prop.iconmap[k];
          menu.addItemExtra(k, prop.values[k], undefined, icon);
      }
      console.log(mpos[0], mpos[1], rect.x, rect.y);
      menu.onselect = (val) =>        {
        console.log("menu select", val, this.getArea().parentWidget);
        let sarea=this.getArea().parentWidget;
        if (sarea) {
            let cls=areaclasses[val];
            ignore++;
            let area, ud;
            try {
              ud = saveUIData(this.tbar, "tab");
              sarea.switchEditor(cls);
              console.log("switching", cls);
              area = sarea.area;
              area._init();
            }
            catch (error) {
                util.print_stack(error);
                throw error;
            }
            finally {
                ignore = Math.max(ignore-1, 0);
              }
            console.log("AREA", area.switcher, area);
            if (area.switcher) {
                ignore++;
                try {
                  area.parentWidget = sarea;
                  area.owning_sarea = sarea;
                  area.switcher.parentWidget = area;
                  area.switcher.ctx = area.ctx;
                  area.switcher._init();
                  area.switcher.update();
                  console.log("loading data", ud);
                  loadUIData(area.switcher.tbar, ud);
                  area.switcher.rebuild();
                  area.flushUpdate();
                }
                catch (error) {
                    throw error;
                }
                finally {
                    ignore = Math.max(ignore-1, 0);
                  }
            }
        }
      };
      startMenu(menu, mpos[0], rect.y, false, 0);
    }
     getArea() {
      let p=this;
      while (p&&!(__instance_of(p, Area))) {
        p = p.parentWidget;
      }
      return p;
    }
     _hash() {
      let area=this.getArea();
      if (!area)
        return ;
      let sarea=area.parentWidget;
      if (!sarea) {
          return ;
      }
      let hash="";
      for (let area2 of sarea.editors) {
          hash+=area2.tagName+":";
      }
      return hash+(sarea.area ? sarea.area.tagName : "");
    }
     rebuild() {
      console.log("rebuild");
      if (!this.getArea()||!this.getArea().parentWidget) {
          this._last_hash = undefined;
          this.tbar.clear();
          return ;
      }
      ignore++;
      let ud=saveUIData(this.tbar, "tbar");
      this.tbar.clear();
      let sarea=this.getArea().parentWidget;
      for (let area of sarea.editors) {
          let uiname=area.constructor.define().uiname;
          let tab=this.tbar.tab(uiname, area._id);
      }
      let tab=this.tbar.icontab(Icons.SMALL_PLUS, "add", "Add Editor", false);
      loadUIData(this.tbar, ud);
      let tc=this.tbar.getTabCount();
      this.tbar.moveTab(tab, tc-1);
      ignore = Math.max(ignore-1, 0);
    }
     update() {
      super.update();
      if (!this.ctx)
        return ;
      let area=this.getArea();
      if (!area)
        return ;
      let sarea=area.parentWidget;
      if (!sarea)
        return ;
      let hash=this._hash();
      if (hash!==this._last_hash) {
          this._last_hash = hash;
          this.rebuild();
      }
      if (this.isDead()||!this.getArea()) {
          ignore++;
          this.tbar.setActive(this.getArea()._id);
          ignore--;
      }
    }
     init() {
      super.init();
    }
    static  define() {
      return {tagname: "area-docker-x"}
    }
  }
  _ESClass.register(AreaDocker);
  _es6_module.add_class(AreaDocker);
  AreaDocker = _es6_module.add_export('AreaDocker', AreaDocker);
  UIBase.internalRegister(AreaDocker);
}, '/dev/fairmotion/src/path.ux/scripts/screen/AreaDocker.js');


es6_module_define('area_wrangler', ["../path-controller/util/vectormath.js", "./FrameManager_mesh.js", "../path-controller/util/simple_events.js", "../path-controller/util/util.js", "../core/ui.js", "../widgets/ui_noteframe.js", "../core/ui_base.js", "../path-controller/util/struct.js"], function _area_wrangler_module(_es6_module) {
  let _ScreenArea=undefined;
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var vectormath=es6_import(_es6_module, '../path-controller/util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var ui=es6_import(_es6_module, '../core/ui.js');
  var ui_noteframe=es6_import(_es6_module, '../widgets/ui_noteframe.js');
  var haveModal=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'haveModal');
  es6_import(_es6_module, '../path-controller/util/struct.js');
  let UIBase=ui_base.UIBase;
  let Vector2=vectormath.Vector2;
  let ScreenClass=undefined;
  var snap=es6_import_item(_es6_module, './FrameManager_mesh.js', 'snap');
  var snapi=es6_import_item(_es6_module, './FrameManager_mesh.js', 'snapi');
  function setScreenClass(cls) {
    ScreenClass = cls;
  }
  setScreenClass = _es6_module.add_export('setScreenClass', setScreenClass);
  function getAreaIntName(name) {
    let hash=0;
    for (let i=0; i<name.length; i++) {
        let c=name.charCodeAt(i);
        if (i%2===0) {
            hash+=c<<8;
            hash*=13;
            hash = hash&((1<<15)-1);
        }
        else {
          hash+=c;
        }
    }
    return hash;
  }
  getAreaIntName = _es6_module.add_export('getAreaIntName', getAreaIntName);
  window.getAreaIntName = getAreaIntName;
  var AreaTypes={TEST_CANVAS_EDITOR: 0}
  AreaTypes = _es6_module.add_export('AreaTypes', AreaTypes);
  function setAreaTypes(def) {
    for (let k in AreaTypes) {
        delete AreaTypes[k];
    }
    for (let k in def) {
        AreaTypes[k] = def[k];
    }
  }
  setAreaTypes = _es6_module.add_export('setAreaTypes', setAreaTypes);
  let areaclasses={}
  areaclasses = _es6_module.add_export('areaclasses', areaclasses);
  class AreaWrangler  {
     constructor() {
      this.stacks = {};
      this.lasts = {};
      this.lastArea = undefined;
      this.stack = [];
      this.idgen = 0;
      this._last_screen_id = undefined;
    }
     _checkWrangler(ctx) {
      if (ctx===undefined) {
          return true;
      }
      if (this._last_screen_id===undefined) {
          this._last_screen_id = ctx.screen._id;
          return true;
      }
      if (ctx.screen._id!==this._last_screen_id) {
          this.reset();
          this._last_screen_id = ctx.screen._id;
          console.warn("contextWrangler detected a new screen; new file?");
          return false;
      }
      return true;
    }
     reset() {
      this.stacks = {};
      this.lasts = {};
      this.lastArea = undefined;
      this.stack = [];
      this._last_screen_id = undefined;
      return this;
    }
     push(type, area, pushLastRef=true) {
      if (!(type.name in this.stacks)) {
          this.stacks[type.name] = [];
      }
      this.stacks[type.name].push(this.lasts[type.name]);
      if (pushLastRef||this.lasts[type.name]===undefined) {
          this.lasts[type.name] = area;
          this.lastArea = area;
      }
      this.stacks[type.name].push(area);
      this.stack.push(area);
    }
     updateLastRef(type, area) {
      this.lasts[type.name] = area;
      this.lastArea = area;
    }
     pop(type, area) {
      if (!(type.name in this.stacks)) {
          console.warn("pop_ctx_area called in error");
          return ;
      }
      if (this.stacks[type.name].length>0) {
          this.stacks[type.name].pop();
          let last=this.stacks[type.name].pop();
          if (last&&last.isConnected) {
              this.lasts[type.name] = last;
          }
      }
      else {
        console.error("pop_ctx_area called in error");
      }
      if (this.stack.length>0) {
          this.stack.pop();
      }
    }
     getLastArea(type) {
      if (type===undefined) {
          if (this.stack.length>0) {
              return this.stack[this.stack.length-1];
          }
          else {
            return this.lastArea;
          }
      }
      else {
        if (type.name in this.stacks) {
            let stack=this.stacks[type.name];
            if (stack.length>0) {
                return stack[stack.length-1];
            }
        }
        return this.lasts[type.name];
      }
    }
  }
  _ESClass.register(AreaWrangler);
  _es6_module.add_class(AreaWrangler);
  AreaWrangler = _es6_module.add_export('AreaWrangler', AreaWrangler);
}, '/dev/fairmotion/src/path.ux/scripts/screen/area_wrangler.js');

