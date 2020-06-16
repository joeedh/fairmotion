"use strict";

import {util, nstructjs, cconst, Vector3, Vector4, Vector2, Matrix4, Quat} from "../path.ux/scripts/pathux.js";
import {SplineSegment, SplineVertex, SplineTypes, SplineFlags,
        SplineFace, SplineElement} from "./spline_types.js";

let hashcache = util.cachering.fromConstructor(util.HashDigest, 8);

export class SplineStrokeGroup {
  hash : int;
  segments : Array<SplineSegment>;

  constructor(segs) {
    this.hash = -1;
    this.segments = [];
    this.eids = [];
    this.id = -1;

    if (segs) {
      for (let seg of segs) {
        this.add(seg);
      }

      this.calcHash();
    }
  }

  add(seg : SplineSegment) {
    this.segments.push(seg);
    this.eids.push(seg.eid);
  }

  calcHash() {
    this.hash = SplineStrokeGroup.calcHash(this.segments);
  }

  static calcHash(segments) {
    let hash = hashcache.next().reset();

    for (let s of segments) {
      hash.add(s.eid);
      /*
      hash.hash(s.v1[0]);
      hash.hash(s.v1[1]);
      hash.hash(s.h1[0]);
      hash.hash(s.h1[1]);
      hash.hash(s.h2[0]);
      hash.hash(s.h2[1]);
      hash.hash(s.v2[0]);
      hash.hash(s.v2[1]);
      //*/
    }

    return hash.get();
  }

  loadSTRUCT(reader) {
    reader(this);
  }

  afterSTRUCT(spline) {
    let eids = this.eids;

    this.segments.length = 0;
    this.eids = [];

    for (let eid of eids) {
      let seg = spline.eidmap[eid];
      if (!seg) {
        console.warn("Missing SplineSegment in SplineGroup!");
        continue;
      }

      this.segments.push(seg);
      this.eids.push(eid);
    }

    this.calcHash();

    return this;
  }
}
SplineStrokeGroup.STRUCT = `
SplineStrokeGroup {
  id       : int;
  hash     : uint;
  eids     : array(int);
}
`

export function splitSegmentGroups(spline : Spline) {
  let oldstrokes = spline._drawStrokeGroupMap;

  spline._drawStrokeGroupMap = new Map();
  spline.drawStrokeGroups.length = 0;

  let c1 = new Vector4();
  let c2 = new Vector4();

  for (let group of spline.strokeGroups) {
    let seg = group.segments[0];
    let segs = [];

    for (let s of group.segments) {
      let mat1 = seg.mat;
      let mat2 = s.mat;

      c1.load(mat1.strokecolor);
      c2.load(mat2.strokecolor);

      let bad = Math.abs(mat1.blur - mat2.blur) > 0.01;
      bad = bad || c1.vectorDistance(c2) > 0.01;

      if (bad && segs.length > 0) {
        let hash = SplineStrokeGroup.calcHash(segs);
        let group;

        if (oldstrokes.has(hash)) {
          group = oldstrokes.get(hash);

          //make sure instance references are correct
          for (let i=0; i<group.segments.length; i++) {
            group.segments[i] = spline.eidmap[group.eids[i]];
          }
        } else {
          group = new SplineStrokeGroup(segs);
          group.id = spline.strokeGroupIdgen.gen_id();
        }

        spline._drawStrokeGroupMap.set(hash, group);
        spline.drawStrokeGroups.push(group);

        segs = [];
      }

      segs.push(s);
    }

    if (segs.length > 0) {
      let hash = SplineStrokeGroup.calcHash(segs);
      let group2;

      if (oldstrokes.has(hash)) {
        group2 = oldstrokes.get(hash);

        //make sure instance references are correct
        for (let i = 0; i < group2.segments.length; i++) {
          group2.segments[i] = spline.eidmap[group2.eids[i]];
        }
      } else {
        group2 = new SplineStrokeGroup(segs);
        group2.id = spline.strokeGroupIdgen.gen_id();
      }

      spline._drawStrokeGroupMap.set(hash, group2);
      spline.drawStrokeGroups.push(group2);
    }
  }
}

export function buildSegmentGroups(spline : Spline) {
  let roots = new Set();
  let visit = new Set();

  let oldstrokes = spline._strokeGroupMap;

  spline._strokeGroupMap = new Map();
  spline.strokeGroups.length = 0;

  let groups = spline.strokeGroups;

  for (let v of spline.verts) {
    let val = v.segments.length;
    if (val === 0 || val === 2) {
      continue;
    }

    roots.add(v);
  }

  let vvisit = new Set();

  let doseg = (v : SplineVertex) => {
    let startv = v;

    for (let seg of v.segments) {
      if (visit.has(seg)) continue;

      let _i = 0;
      let segs = [seg];

      v = startv;
      visit.add(seg);
      vvisit.add(startv);

      do {
        if (v !== seg.v1 && v !== seg.v2) {
          console.error("EEK!!");
          break;
        }

        v = seg.other_vert(v);
        vvisit.add(v);

        if (v.segments.length !== 2) {
          break;
        }

        seg = v.other_segment(seg);

        segs.push(seg);
        visit.add(seg);

        if (_i++ > 1000) {
          console.warn("infinite loop detected");
          break;
        }
      } while (v !== startv);

      if (segs.length === 0) {
        continue;
      }

      let group = new SplineStrokeGroup(segs);
      group.calcHash();

      if (oldstrokes.has(group.hash)) {
        group = oldstrokes.get(group.hash);

        //make sure instance references are correct
        for (let i=0; i<group.segments.length; i++) {
          group.segments[i] = spline.eidmap[group.eids[i]];
        }
      } else {
        group.id = spline.strokeGroupIdgen.gen_id();
      }

      if (!spline._strokeGroupMap.has(group.hash)) {
        spline._strokeGroupMap.set(group.hash, group);
        groups.push(group);
      }
    }
  }

  for (let v of roots) {
    doseg(v);
  }

  //now handle closed loops
  for (let v of spline.verts) {
    if (!(vvisit.has(v))) {
      doseg(v);
    }
  }

  //console.warn("GROUPS", groups);
}


import {Spline} from './spline.js';