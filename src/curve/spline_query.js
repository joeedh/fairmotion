import {SelMask} from '../editors/viewport/selectmode.js';
import {
  has_multires, compose_id, decompose_id,
  MResFlags, MultiResLayer
} from './spline_multires.js';

let PI = Math.PI, abs = Math.abs, sqrt = Math.sqrt, floor = Math.floor,
  ceil = Math.ceil, sin = Math.sin, cos = Math.cos, acos = Math.acos,
  asin = Math.asin, tan = Math.tan, atan = Math.atan, atan2 = Math.atan2;
import {SplineFlags} from "./spline_base.js";
import * as math from '../path.ux/scripts/util/math.js';

let findnearest_segment_tmp = new Vector2();

let _mpos_fn_v = new Vector2();
let _v_fn_v = new Vector2();

export class SplineQuery {
  constructor(spline: Spline) {
    this.spline = spline;
  }

  findnearest(editor, mpos, selectmask, limit, ignore_layers) {
    if (limit === undefined) limit = 15;
    let dis = 1e18;
    let data = undefined;

    //[data, distance, type]
    if (selectmask & SelMask.VERTEX) {
      let ret = this.findnearest_vert(editor, mpos, limit, undefined, ignore_layers);
      if (ret !== undefined && ret[1] < dis) {
        data = ret;
        dis = ret[1];
      }
    }

    if (selectmask & SelMask.HANDLE) {
      let ret = this.findnearest_vert(editor, mpos, limit, true, ignore_layers);
      if (ret !== undefined && ret[1] < dis) {
        data = ret;
        dis = ret[1];
      }
    }

    if (selectmask & SelMask.SEGMENT) {
      let ret = this.findnearest_segment(editor, mpos, limit, ignore_layers);

      if (ret !== undefined && ret[1] < dis) {
        data = ret;
        dis = ret[1];
      }
    }

    if (selectmask & SelMask.FACE) {
      let ret = this.findnearest_face(editor, mpos, limit, ignore_layers);

      if (ret !== undefined && ret[1] < dis) {
        data = ret;
        dis = ret[1];
      }
    }

    return data;
  }

  findnearest_segment(editor, mpos, limit, ignore_layers) {
    let spline = this.spline;
    let actlayer = spline.layerset.active;
    let sret = undefined, mindis = limit;

    mpos = findnearest_segment_tmp.load(mpos);

    editor.unproject(mpos);

    for (let seg of spline.segments) {
      let ret = seg.closest_point(mpos, undefined, true);
      if (ret === undefined) continue;

      let s = ret.s;
      ret = ret.co;

      if (seg.hidden || seg.v1.hidden || seg.v2.hidden) continue;
      if (!ignore_layers && !seg.in_layer(actlayer)) continue;

      let dis = sqrt((ret[0] - mpos[0])*(ret[0] - mpos[0]) + (ret[1] - mpos[1])*(ret[1] - mpos[1]));
      let width = seg.width(s)*0.5;

      dis = Math.max(dis - width, 0.0);

      if (dis < mindis) {
        sret = seg;
        mindis = dis;
      }
    }

    if (sret !== undefined)
      return [sret, mindis, SelMask.SEGMENT];
  }

  findnearest_face(editor, mpos, limit, ignore_layers) {
    let spline = this.spline, actlayer = spline.layerset.active;
    let mindis = 0, closest = undefined;

    let p = new Vector2([5000, 5001]);
    mpos = new Vector2(mpos);

    editor.unproject(mpos);

    p.add(mpos);


    //console.log(mpos, p);

    //do basic polyline winding test
    for (let f of spline.faces) {
      if ((!ignore_layers && !f.in_layer(actlayer)) || f.hidden) continue;

      let sum = 0;

      for (let list of f.paths) {
        for (let l of list) {
          let v1 = l.v, v2 = l.next.v;

          let steps = 4; //subdivide clothoids 4 times
          let s = 0.0, ds = 1.0/(steps - 1);
          let lastco = undefined;

          for (let i = 0; i < steps; i++, s += ds) {
            let co = l.s.evaluate(s);

            if (lastco) {
              if (math.line_line_cross(lastco, co, mpos, p)) {
                sum += 1;
              }
            }
            lastco = co;
          }
        }
      }

      //console.log("SUM", sum, f.eid);

      if (sum%2 !== 1) {
        continue;
      }

      let dist = -f.finalz + (f.flag & SplineFlags.SELECT)*1000;

      //console.log("DIST", dist);
      if (!closest || dist < mindis) {
        closest = f;
        mindis = dist;
      }
    }

    if (closest !== undefined) {
      //console.log("CLOSEST", closest.eid);

      return [closest, mindis, SelMask.FACE];
    }
    /*
    let spline = this.spline;
    let actlayer = spline.layerset.active;


    return;
    console.log("findnearest face!", spline.canvas);

    let g = spline.canvas;
    let dis = 0, closest = undefined;

    if (g === undefined) return;

    for (let i=0; i<spline.faces.length; i++) {
      let f = spline.faces[i];
      if ((!ignore_layers && !f.in_layer(actlayer)) || f.hidden) continue;

      spline.trace_face(g, f);

      console.log("tracing face", f);

      if (g.isPointInPath(mpos[0], window.innerHeight-mpos[1])) {
        closest = f;
      }
    }

    g.beginPath();
    if (closest !== undefined)
      return [closest, dis, SelMask.FACE];

     */
  }

  findnearest_vert(editor, mpos, limit, do_handles, ignore_layers) {
    let spline = this.spline;
    let actlayer = spline.layerset.active;

    if (limit === undefined) limit = 15;
    let min = 1e17;

    let ret = undefined;

    let _mpos = _mpos_fn_v;
    let _v = _v_fn_v;

    mpos = _mpos.load(mpos);

    let list = do_handles ? spline.handles : spline.verts;
    for (let v of list) {
      if (v.hidden) continue;
      if (!ignore_layers && !v.in_layer(actlayer)) continue;

      let co = v;

      _v.load(co);
      editor.project(_v);

      let dis = _v.vectorDistance(mpos);
      if (dis < limit && dis < min) {
        min = dis;
        ret = v;
      }
    }

    if (ret !== undefined) {
      return [ret, min, do_handles ? SelMask.HANDLE : SelMask.VERTEX];
    }
  }
}
