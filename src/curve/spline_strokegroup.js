"use strict";

import {util, nstructjs, cconst, Vector3, Vector4, Vector2, Matrix4, Quat} from "../path.ux/scripts/pathux.js";
import {
  SplineSegment, SplineVertex, SplineTypes, SplineFlags,
  SplineFace, SplineElement, MaterialFlags
} from "./spline_types.js";

import {SplineLayerFlags} from './spline_element_array.js';

let hashcache = util.cachering.fromConstructor(util.HashDigest, 8);

export class SplineStrokeGroup {
  hash: int;
  segments: Array<SplineSegment>;

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

  add(seg: SplineSegment) {
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

let _color1 = new Vector4();
let _color2 = new Vector4();

/** Note: v is only required if third segments parameter is not used. */
export function vertexIsSplit(spline, v, segments = v.segments) {
  function visible(seg) {
    let hide = seg.flag & SplineFlags.HIDE;
    hide = hide || (seg.flag & SplineFlags.NO_RENDER);

    if (hide)
      return false;

    for (let k in seg.layers) {
      if (spline.layerset.get(k).flag & SplineLayerFlags.HIDE) {
        return false;
      }
    }

    return true;
  }

  if (v !== undefined && v.segments.length > 3) {
    return true;
  }

  let hide;
  let stroke;
  let mask_to_face;
  let blur;
  let doublewid;
  let doublecol;
  let fill_over_stroke;
  let opacity;

  function fcmp(a, b, l = 0.01) {
    return Math.abs(a - b) > l;
  }

  for (let seg of segments) {
    let hide2 = visible(seg);
    if (hide !== undefined && hide !== hide2) {
      return 1;
    } else {
      hide = hide2;
    }

    let stroke2 = seg.mat.strokecolor;
    if (stroke !== undefined && stroke2.vectorDistanceSqr(stroke) > 0.0001) {
      return 2;
    } else {
      stroke = _color1.load(stroke2);
    }

    let mask_to_face2 = seg.mat.flag & MaterialFlags.MASK_TO_FACE;
    if (mask_to_face !== undefined && mask_to_face2 !== mask_to_face) {
      return 3;
    } else {
      mask_to_face = mask_to_face2;
    }

    let blur2 = seg.mat.blur;
    if (blur !== undefined && fcmp(blur2, blur)) {
      return 4;
    } else {
      blur = blur2;
    }

    let fill_over_stroke2 = seg.mat.fill_over_stroke;
    if (fill_over_stroke !== undefined && fill_over_stroke2 !== fill_over_stroke) {
      return 5;
    } else {
      fill_over_stroke = fill_over_stroke2;
    }

    let doublewid2 = seg.mat.linewidth2;
    if (doublewid !== undefined && !!doublewid2 !== !!doublewid) {
      return 6;
    } else {
      doublewid = doublewid2;
    }

    let doublecol2 = seg.mat.strokecolor2;
    if (doublewid2 !== 0 && doublecol !== undefined && doublecol.vectorDistanceSqr(doublecol2) > 0.001) {
      return 7;
    } else {
      doublecol = _color2.load(doublecol2);
    }

    let opacity2 = seg.mat.opacity;
    if (opacity !== undefined && fcmp(opacity2, opacity)) {
      return 8;
    } else {
      opacity = opacity2;
    }
  }

  let layerbad = 9;

  outer: for (let s1 of segments) {
    for (let s2 of segments) {
      if (s1 === s2) {
        continue;
      }

      for (let k in s1.layers) {
        if (k in s2.layers) {
          layerbad = false;
          break outer;
        }
      }
    }
  }

  return layerbad;
}

export function splitSegmentGroups(spline: Spline) {
  let oldstrokes = spline._drawStrokeGroupMap;

  /* Used to keep track of which verts are at group
     boundaries */
  spline._drawStrokeVertSplits = new Set();
  spline._drawStrokeGroupMap = new Map();
  spline.drawStrokeGroups.length = 0;

  let c1 = new Vector4();
  let c2 = new Vector4();

  let tempsegs = [null, null];

  function visible(seg) {
    let hide = seg.flag & SplineFlags.HIDE;
    hide = hide || (seg.flag & SplineFlags.NO_RENDER);

    if (hide)
      return false;

    for (let k in seg.layers) {
      if (spline.layerset.get(k).flag & SplineLayerFlags.HIDE) {
        return false;
      }
    }

    return true;
  }

  const drawStrokeVertSplits = spline._drawStrokeVertSplits;

  function finishSegs(segs) {
    if (segs.length === 0) {
      return;
    }

    /* Tag group endpoint vertices as split */
    if (segs.length === 1) {
      drawStrokeVertSplits.add(segs[0].v1.eid);
      drawStrokeVertSplits.add(segs[0].v2.eid);
    } else {
      let seg = segs[0];

      if (seg.v2 === segs[1].v1 || seg.v2 === segs[1].v2) {
        drawStrokeVertSplits.add(seg.v2.eid);
      } else {
        drawStrokeVertSplits.add(seg.v1.eid);
      }

      seg = segs[segs.length - 1];
      let seg2 = segs[segs.length - 2];

      if (seg.v2 === seg2.v1) {
        drawStrokeVertSplits.add(seg.v2.eid);
      } else {
        drawStrokeVertSplits.add(seg.v1.eid);
      }
    }

    let hash = SplineStrokeGroup.calcHash(segs);
    let group;

    /* Reuse old groups if hash compatible. */
    if (oldstrokes.has(hash)) {
      group = oldstrokes.get(hash);

      //make sure instance references are correct
      for (let i = 0; i < group.segments.length; i++) {
        group.segments[i] = spline.eidmap[group.eids[i]];
      }
    } else {
      group = new SplineStrokeGroup(segs);
      group.id = spline.idgen.gen_id();

      oldstrokes.set(hash, group);
    }

    spline._drawStrokeGroupMap.set(hash, group);
    spline.drawStrokeGroups.push(group);
  }

  for (let group of spline.strokeGroups) {
    if (group.segments.length === 0) {
      continue;
    }

    let seg = group.segments[0];

    let i = 0;
    while (i < group.segments.length && !visible(group.segments[i])) {
      i++;
    }

    if (i === group.segments.length) {
      continue;
    }

    seg = group.segments[i];

    let segs = [];

    while (i < group.segments.length) {
      let s = group.segments[i];
      let bad = false;

      if (0) {
        let mat1 = seg.mat;
        let mat2 = s.mat;

        c1.load(mat1.strokecolor);
        c2.load(mat2.strokecolor);

        bad = Math.abs(mat1.blur - mat2.blur) > 0.01;
        bad = bad || c1.vectorDistance(c2) > 0.01;
        bad = bad || !visible(s);

        let layerbad = true;
        for (let k in s.layers) {
          if (k in seg.layers) {
            layerbad = false;
          }
        }

        bad = bad || layerbad;
      } else {
        tempsegs[0] = s;
        tempsegs[1] = seg;

        bad = vertexIsSplit(spline, undefined, tempsegs);
      }

      if (bad && segs.length > 0) {
        //debugger;

        finishSegs(segs);
        segs = [];
        seg = s;
      }

      segs.push(s);
      i++;
    }

    finishSegs(segs);
    /*
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
            group2.id = spline.idgen.gen_id();
          }

          spline._drawStrokeGroupMap.set(hash, group2);
          spline.drawStrokeGroups.push(group2);
        }
     */

  }

  //spline.strokeGroups = spline.strokeGroups.filter(g => g.segments.length > 0);
}

export function buildSegmentGroups(spline: Spline) {
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

  let doseg = (v: SplineVertex) => {
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

        if (segs.length === 0 || seg !== segs[0]) {
          segs.push(seg);
        }

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
        for (let i = 0; i < group.segments.length; i++) {
          group.segments[i] = spline.eidmap[group.eids[i]];
        }
      } else {
        group.id = spline.idgen.gen_id();
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


  //remove empty groups
  for (let i = 0; i < groups.length; i++) {
    let g = groups[i];

    for (let j = 0; j < g.segments.length; j++) {
      if (g.segments[j] === undefined) {
        console.warn("Corrupted group!", g);

        g.segments.remove(undefined);
        j--;
      }
    }

    if (g.length === 0) {
      groups[i] = groups[groups.length - 1];
      groups.length--;
      i--;
    }
  }
  //console.warn("GROUPS", groups);
}


//import {Spline} from './spline.js';
