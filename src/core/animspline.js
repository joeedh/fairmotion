"use strict";

import {STRUCT} from './struct.js';
import {DataBlock, DataTypes} from './lib_api.js';
import {Spline, RestrictFlags} from '../curve/spline.js';
import {CustomDataLayer, SplineTypes, SplineFlags, SplineSegment} from '../curve/spline_types.js';
import {
  TimeDataLayer, get_vtime, set_vtime, AnimChannel, AnimKey,
  AnimInterpModes, AnimKeyFlags
} from './animdata.js';
import {SplineLayerFlags, SplineLayerSet} from '../curve/spline_element_array.js';

import '../path.ux/scripts/util/struct.js';

let restrictflags = RestrictFlags.NO_DELETE | RestrictFlags.NO_EXTRUDE |
  RestrictFlags.NO_CONNECT;

let vertanimdata_eval_cache = cachering.fromConstructor(Vector2, 512);

import {AnimChannel, AnimKey} from './animdata.js';
import {PropTypes} from './toolprops.js';

export class VertexAnimIter {
  ret: Object
  stop: boolean;

  constructor(vd) {
    this.ret = {done: false, value: undefined};
    this.stop = false;

    if (vd !== undefined)
      VertexAnimIter.init(this, vd);
  }

  init(vd) {
    this.vd = vd;
    this.v = vd.startv;
    this.stop = false;

    if (this.v !== undefined && this.v.segments.length !== 0)
      this.s = this.v.segments[0];
    else
      this.s = undefined;

    this.ret.done = false;
    this.ret.value = undefined;

    return this;
  }

  [Symbol.iterator](self) {
    return this;
  }

  next() {
    let ret = this.ret;

    if (this.vd.startv === undefined) {
      ret.done = true;
      ret.value = undefined;

      return ret;
    }

    if (this.stop && this.v === undefined) {
      ret.done = true;
      ret.value = undefined;

      return ret;
    }

    ret.value = this.v;

    if (this.stop || this.s === undefined) {
      this.v = undefined;
      if (ret.value === undefined)
        ret.done = true;
      return ret;
    }

    this.v = this.s.other_vert(this.v);

    if (this.v.segments.length < 2) {
      this.stop = true;
      return ret;
    }

    this.s = this.v.other_segment(this.s);
    return ret;
  }
}

export class SegmentAnimIter {
  ret: Object
  stop: boolean;

  constructor(vd) {
    this.ret = {done: false, value: undefined};
    this.stop = false;

    if (this.v !== undefined && this.v.segments.length !== 0)
      if (vd !== undefined)
        SegmentAnimIter.init(this, vd);
  }

  init(vd) {
    this.vd = vd;
    this.v = vd.startv;
    this.stop = false;

    if (this.v !== undefined)
      this.s = this.v.segments[0];
    else
      this.s = undefined;

    this.ret.done = false;
    this.ret.value = undefined;

    return this;
  }

  [Symbol.iterator](self) {
    return this;
  }

  next() {
    let ret = this.ret;

    if (this.stop || this.s === undefined) {
      ret.done = true;
      ret.value = undefined;

      return ret;
    }

    ret.value = this.s;
    this.v = this.s.other_vert(this.v);

    if (this.v.segments.length < 2) {
      this.stop = true;

      return ret;
    }

    this.s = this.v.other_segment(this.s);
    return ret;
  }
}

export let VDAnimFlags = {
  SELECT           : 1,
  STEP_FUNC        : 2,
  HIDE             : 4,
  OWNER_IS_EDITABLE: 8 //owner is selected and visible
};

let dvcache = cachering.fromConstructor(Vector2, 256);

export class VertexAnimData {
  animflag: number
  flag: number
  visible: boolean
  path_times: Object
  cur_time: number;

  constructor(eid, pathspline) {
    this.eid = eid;

    this.dead = false;

    //this.timechannel = new AnimChannel(PropTypes.FLOAT, "Time", "");

    //basically this is just used to detect if a new vertex needs to be added to the time channel
    //this.timechannel_verts = new set();

    this.vitercache = cachering.fromConstructor(VertexAnimIter, 4);
    this.sitercache = cachering.fromConstructor(SegmentAnimIter, 4);

    this.spline = pathspline;

    this.animflag = 0;
    this.flag = 0; //holds selection and hide flags?
    this.visible = false;

    //maps splinevert eid's to the times they occur at?
    //hrm. . .
    this.path_times = {};
    this.startv_eid = -1; //this.spline.make_vertex(new Vector2());

    if (pathspline !== undefined) {
      let layer = pathspline.layerset.new_layer();
      layer.flag |= SplineLayerFlags.HIDE;

      this.layerid = layer.id;
    }

    this._start_layer_id = undefined;
    this.cur_time = 0;
  }

  /*
    sync_vtime() {
      let keymap = {};
      let totkey = this.animchannel.keys.length;

      let totvert = 0;
      let verts = [];
      for (let v of this.verts) {
        totvert++;
        verts.push(v);
      }

      let i = 0;
      for (let v of this.verts) {
        if (!this.timechannel_verts.has(v.eid)) {
          let time = get_vtime(v);
          let key = this.timechannel.update(time, i);

          key.owner_eid = v.eid;
          keymap[key] = key;

          this.timechannel_verts.add(v.eid);
        }

        i++;
      }

      i = 0;
      for (let key of this.timechannel.keys) {
        key.data.data *= totvert;
        key.owner_eid = verts[i].eid;
        i++;
      }
    }
    //*/

  get startv() {
    if (this.startv_eid === -1) return undefined;
    return this.spline.eidmap[this.startv_eid];
  }

  set startv(v) {
    if (typeof v === "number") {
      this.startv_eid = v;
      return;
    }

    if (v !== undefined) {
      this.startv_eid = v.eid;
    } else {
      this.startv_eid = -1;
    }
  }

  _set_layer() {
    if (this.spline.layerset.active.id !== this.layerid)
      this._start_layer_id = this.spline.layerset.active.id;

    if (this.layerid === undefined) {
      console.log("Error in _set_layer in VertexAnimData!!!");
      return;
    }

    this.spline.layerset.active = this.spline.layerset.idmap[this.layerid]
  }

  [Symbol.keystr]() {
    return this.eid;
  }

  _unset_layer() {
    if (this._start_layer_id !== undefined) {
      let layer = this.spline.layerset.idmap[this._start_layer_id];

      if (layer !== undefined)
        this.spline.layerset.active = layer;
    }

    this._start_layer_id = undefined;
  }

  remove(v) {
    if (v === this.startv) {
      let startv = undefined;

      for (let v2 of this.verts) {
        if (v2 !== v) {
          startv = v2;
          break;
        }
      }

      if (startv) {
        this.startv_eid = startv.eid;
        this.spline.remove(v);
      } else {
        this.dead = true;
        this.spline.remove(v);
      }
    } else {
      let ok = false;
      for (let v2 of this.verts) {
        if (v === v2) {
          ok = true;
          break;
        }
      }

      if (!ok) {
        console.error("Key not in this anim spline", v);
        return;
      }

      if (v.segments.length === 2) {
        this.spline.dissolve_vertex(v);
      } else {
        this.spline.kill_vertex(v);
      }
    }
  }

  get verts() {
    return this.vitercache.next().init(this);
  }

  get segments() {
    return this.sitercache.next().init(this);
  }

  find_seg(time) {
    let v = this.startv;
    //console.log("find_seg", v, time);

    if (v === undefined) return undefined;
    if (v.segments.length === 0) return undefined;

    let s = v.segments[0];
    let lastv = v;

    while (1) {
      lastv = v;
      v = s.other_vert(v);

      //console.log("vtime!", get_vtime(v));
      if (get_vtime(v) > time) {
        return s;
      }

      if (v.segments.length < 2) {
        lastv = v;
        break;
      }

      s = v.other_segment(s);
    }

    return undefined;
  }

  _get_animdata(v) {
    let ret = v.cdata.get_layer(TimeDataLayer);

    ret.owning_veid = this.eid;
    return ret;
  }

  update(co, time) {
    this._set_layer();
    let update = false;

    if (time < 0) {
      console.trace("ERROR! negative times not supported!");

      this._unset_layer();
      return false;
    }

    if (this.startv === undefined) {
      this.startv = this.spline.make_vertex(co);
      this._get_animdata(this.startv).time = 1;

      update = true;
      this.spline.regen_sort();
      this.spline.resolve = 1;
    }

    let spline = this.spline;
    let seg = this.find_seg(time);

    if (seg === undefined) {
      let e = this.endv;

      if (this._get_animdata(e).time === time) {
        update = update || e.vectorDistance(co) > 0.01;
        e.load(co);
        e.flag |= SplineFlags.UPDATE;
      } else {
        let nv = spline.make_vertex(co);

        this._get_animdata(nv).time = time;
        spline.make_segment(e, nv);

        spline.regen_sort();
        update = true;
      }
    } else {
      if (get_vtime(seg.v1) === time) {
        update = update || seg.v1.vectorDistance(co) > 0.01;
        seg.v1.load(co);
        seg.v1.flag |= SplineFlags.UPDATE;
      } else if (get_vtime(seg.v2) === time) {
        update = update || seg.v2.vectorDistance(co) > 0.01;
        seg.v2.load(co);
        seg.v2.flag |= SplineFlags.UPDATE;
      } else {
        let ret = spline.split_edge(seg);
        let nv = ret[1];

        spline.regen_sort();

        this._get_animdata(nv).time = time;
        update = true;
        nv.load(co);
      }
    }

    spline.resolve = 1;
    this._unset_layer();

    return update;
  }

  get start_time() {
    let v = this.startv;
    if (v === undefined) return 0;

    return get_vtime(v);
  }

  get end_time() {
    let v = this.endv;
    if (v === undefined) return 0;

    return get_vtime(v);
  }

  draw(g, matrix, alpha, time) {
    if (!(this.visible))
      return;

    let step_func = this.animflag & VDAnimFlags.STEP_FUNC;

    let start = this.start_time, end = this.end_time;

    g.lineWidth = 2.0;
    g.strokeStyle = "rgba(100,100,100," + alpha + ")";

    let dt = 1.0;
    let lastco = undefined;
    let dv = new Vector4();

    for (let t = start; t < end; t += dt) {
      let co = this.evaluate(t);
      dv.load(this.derivative(t));

      co.multVecMatrix(matrix);
      dv.multVecMatrix(matrix);

      dv.normalize().mulScalar(5);
      let tmp = dv[0];
      dv[0] = -dv[1];
      dv[1] = tmp;

      g.beginPath();

      let green = Math.floor(((t - start)/(end - start))*255);
      g.strokeStyle = "rgba(10, " + green + ",10," + alpha + ")";

      /*if (t === start+dt)
        g.strokeStyle = "rgba(100, 255, 140,"+alpha+")";
      else if (t >= end-dt)
        g.strokeStyle = "rgba(255, 140, 100,"+alpha+")";
      else
        g.strokeStyle = "rgba(0.0, 0.0, 0.0,"+alpha+")";
      */

      g.moveTo(co[0] - dv[0], co[1] - dv[1]);
      g.lineTo(co[0] + dv[0], co[1] + dv[1]);

      g.stroke();

      if (lastco !== undefined) {
        g.moveTo(lastco[0], lastco[1]);
        g.lineTo(co[0], co[1]);
        g.stroke();
      }

      lastco = co;
    }
  }

  derivative(time) {
    let df = 0.001;
    let a = this.evaluate(time);
    let b = this.evaluate(time + df);

    b.sub(a).mulScalar(1.0/df);
    return dvcache.next().load(b);
  }

  evaluate(time) {
    if (this.dead) {
      console.error("dead vertex anim key");
      return;
    }

    let v = this.startv;
    let step_func = this.animflag & VDAnimFlags.STEP_FUNC;

    if (v === undefined)
      return vertanimdata_eval_cache.next().zero();

    let co = vertanimdata_eval_cache.next();
    if (time <= get_vtime(v)) {
      co.load(v);
      return co;
    }

    //console.log("eval 1", v);

    if (v.segments.length === 0) {
      co.load(v);
      return co;
    }

    let s = v.segments[0];
    let lastv = v;
    let lasts = s;
    let lastv2 = v;

    //console.log("eval 2", v);

    while (1) {
      //console.log("  eval loop", get_vtime(v));

      lastv2 = lastv;
      lastv = v;
      v = s.other_vert(v);

      if (get_vtime(v) >= time) break;

      if (v.segments.length < 2) {
        lastv2 = lastv;
        lastv = v;
        break;
      }

      lasts = s;
      s = v.other_segment(s);
    }

    //console.log("eval 3", get_vtime(v));
    let nextv = v, nextv2 = v;
    let alen1 = s !== undefined ? s.length : 1, alen2 = alen1;
    let alen0 = lasts !== undefined ? lasts.length : alen1, alen3 = alen1;

    if (v.segments.length === 2) {
      let nexts = v.other_segment(s);

      nextv = nexts.other_vert(v);
      alen2 = nexts.length;
      alen3 = alen2;
    }

    nextv2 = nextv;
    if (nextv2.segments.length === 2) {
      let nexts2 = nextv2.other_segment(nexts);
      nextv2 = nexts2.other_vert(nextv2);

      alen3 = nexts2.length;
    }

    /*
    on factor;
    off period;
    
    procedure bez(a, b);
      a + (b - a)*t;
      
    quad := bez(bez(k0, k1), bez(k1, k2));
    cubic := bez(quad, sub(k2=k3, k1=k2, k0=k1, quad));
    
    comment: unknowns: t1t2  t4t5  t7t8;
    
    comment: t1 := t0 + (t3 - t0)*(1.0/3.0);
    comment: t8 := t6 + (t9 - t6)*(2.0/3.0);
    
    t := (time-t3) / (t6 - t3);
    
    time1 := sub(k3=t3, k2=t2, k1=t1, k0=t0, cubic);
    time2 := sub(k3=t6, k2=t5, k1=t4, k0=t3, cubic);
    time3 := sub(k3=t9, k2=t8, k1=t7, k0=t6, cubic);
    
    dis1 := arclength1*((time1-t0)/(t3-t0));
    dis2 := arclength2*((time2-t3)/(t6-t3));
    dis3 := arclength3*((time3-t6)/(t9-t6));
    
    ddis1 := df(dis1, time);
    ddis2 := df(dis2, time);
    ddis3 := df(dis3, time);
    
    d2dis1 := df(dis1, time, 2);
    d2dis2 := df(dis2, time, 2);
    d2dis3 := df(dis3, time, 2);

    d3dis1 := df(dis1, time, 3);
    d3dis2 := df(dis2, time, 3);
    d3dis3 := df(dis3, time, 3);
    
    f1 := sub(time=t3, ddis1) - sub(time=t3, ddis2);
    f2 := sub(time=t6, ddis2) - sub(time=t6, ddis3);
    
    f3 := sub(time=t3, d2dis1) - sub(time=t3, d2dis2);
    f4 := sub(time=t6, d2dis2) - sub(time=t6, d2dis3);
    
    f5 := sub(time=t3, d3dis1) - sub(time=t3, d3dis2);
    f6 := sub(time=t6, d3dis2) - sub(time=t6, d3dis3);
    
    f := solve({f1, f2, f3, f4}, {t4, t5, t1, t8});
    
    on fort;
    
    finalt1 := part(f, 1, 1, 2);
    finalt2 := part(f, 1, 2, 2);
    finalt4 := part(f, 1, 3, 2);
    finalt5 := part(f, 1, 4, 2);
    finalt7 := part(f, 1, 5, 2);
    finalt8 := part(f, 1, 6, 2);
    
    off fort;
    */

    if (lastv === v || get_vtime(lastv) === time) {
      co.load(v);
    } else {
      let pt2 = get_vtime(lastv2), pt = get_vtime(lastv), vt = get_vtime(v);
      let nt = get_vtime(nextv), nt2 = get_vtime(nextv2);

      let t = (time - pt)/(vt - pt);

      let a = pt, b, c, d = vt;
      let arclength1 = alen0;
      let arclength2 = alen1;
      let arclength3 = alen2;

      let t0 = pt2, t3 = pt, t6 = vt, t9 = nt;

      let t1 = pt2 + (pt - pt2)*(1.0/3.0);
      let t8 = vt + (nt - vt)*(2.0/3.0);

      b = (-(t0 - t1)*(t3 - t6)*arclength1 + (t0 - t3)*arclength2*t3)/((t0 - t3)*arclength2);
      c = ((t3 - t6)*(t8 - t9)*arclength3 + (t6 - t9)*arclength2*t6)/((t6 - t9)*arclength2);

      let r1 = alen0/alen1;
      let r2 = alen1/alen2;

      //console.log("r1, r2", r1.toFixed(3), r2.toFixed(3));

      //b = pt + (vt-pt)*(1.0/3.0)*r1;
      //c = pt + (vt-pt)*(2.0/3.0)*r2;
      b = pt + r1*(vt - pt2)/3.0;
      c = vt - r2*(nt - pt)/3.0;

      //if (b > pt-pt2) b = pt-pt2;
      //if (c > vt-pt)  c = vt-pt;

      t0 = a;
      t1 = b;
      t2 = c;
      t3 = d;
      let tt = -(3*(t0 - t1)*t - t0 + 3*(2*t1 - t2 - t0)*t*t +
        (3*t2 - t3 - 3*t1 + t0)*t*t*t);
      //*/

      tt = Math.abs(tt);
      //t = (tt - pt) / (vt-pt);

      if (step_func) {
        t = time < vt ? 0.0 : 1.0;
      }
      //t = 1.0;

      co.load(s.evaluate(lastv === s.v1 ? t : 1 - t));
    }

    return co;
  }

  get endv() {
    let v = this.startv;

    if (v === undefined) return undefined;
    if (v.segments.length === 0) return v;

    let s = v.segments[0];
    while (1) {
      v = s.other_vert(v);

      if (v.segments.length < 2) break;
      s = v.other_segment(s);
    }

    return v;
  }

  check_time_integrity() {
    let lasttime = -100000;

    for (let v of this.verts) {
      let t = get_vtime(v);

      if (t < lasttime) {
        console.log("Found timing integrity error for vertex", this.eid, "path vertex:", v.eid);
        //set_vtime(g_app_state.ctx.frameset.pathspline, v, lasttime);
        this.regen_topology();
        return true;
      }

      lasttime = t;
    }

    return false;
  }

  regen_topology() {
    let spline = this.spline;
    let verts = [];
    let segs = new set();
    let visit = new set();

    let handles = [];
    let lastv = undefined;
    let hi = 0;

    //get flat list of verts, along with handles
    for (let v of this.verts) {
      //check for duplicates
      if (visit.has(v)) {
        continue;
      }

      visit.add(v);
      verts.push(v);

      handles.push(undefined);
      handles.push(undefined);
      hi += 2;

      v.flag |= SplineFlags.UPDATE;

      for (let s of v.segments) {
        segs.add(s);

        let v2 = s.other_vert(v);
        let h2 = s.other_handle(s.handle(v));

        //keep track of handles
        if (v2 === lastv) {
          handles[hi - 2] = h2;
        } else {
          handles[hi - 1] = h2;
        }
      }

      lastv = v;
    }

    if (verts.length === 0) {
      return;
    }

    //sort by time
    verts.sort(function (a, b) {
      return get_vtime(a) - get_vtime(b);
    });

    //kill old segments
    for (let s of segs) {
      spline.kill_segment(s);
    }

    //set new start vertex
    this.startv_eid = verts[0].eid;

    //create new segments
    for (let i = 1; i < verts.length; i++) {
      let s = spline.make_segment(verts[i - 1], verts[i]);

      s.flag |= SplineFlags.UPDATE;
      s.h1.flag |= SplineFlags.UPDATE;
      s.h2.flag |= SplineFlags.UPDATE;

      for (let k in s.v1.layers) {
        spline.layerset.idmap[k].add(s);
      }
    }

    //migrate old handle data

    hi = 0;
    lastv = undefined;

    for (let v of verts) {
      for (let s of v.segments) {
        let v2 = s.other_vert(v);
        let h2 = s.other_handle(s.handle(v));

        //XXX note: technically we are accessing dead data here
        if (v2 === lastv && handles[hi] !== undefined) {
          h2.load(handles[hi]);
        } else if (v2 !== lastv && handles[hi + 1] !== undefined) {
          h2.load(handles[hi + 1]);
        }
      }

      lastv = v;
      hi += 2;
    }
  }

  loadSTRUCT(reader) {
    reader(this);
    //this.timechannel_verts = new set(this.timechannel_verts);
  }
}

VertexAnimData.STRUCT = `
VertexAnimData {
  eid         : int;
  flag        : int;
  animflag    : int;
  cur_time    : int;
  layerid     : int;
  startv_eid  : int;
  dead        : bool;
}
`;
