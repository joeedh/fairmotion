/* The solved-curvature cache, keyed by frame time.

   Solving a spline is expensive and a scrub through the timeline re-solves the
   same shapes over and over, so each frame's `ks` are packed by
   Spline.export_ks() and stored here.  A cache entry is trusted only while its
   hash of the vertex coordinates still matches, and individual elements can be
   invalidated by eid and time.

   SplineFrameSet.loadSTRUCT() currently throws away whatever came off disk and
   starts with an empty cache; the reader below is still what parses old files. */

import { readSerialized } from "../struct.js";
import { SplineFlags } from "../../curve/spline_types.js";

import type { Spline } from "../../curve/spline.js";

export class EidTimePair {
  static STRUCT: string;

  eid: number;
  time: number;

  constructor(eid?: number, time?: number) {
    this.eid = eid!;
    this.time = time!;
  }

  load(eid: number, time: number) {
    this.eid = eid;
    this.time = time;
  }

  static fromSTRUCT(reader: StructReader<EidTimePair>) {
    let ret = new EidTimePair();
    reader(ret);
    return ret;
  }

  [Symbol.keystr]() {
    return "" + this.eid + "_" + this.time;
  }
}

EidTimePair.STRUCT = `
  EidTimePair {
    eid  : int;
    time : int;
  }
`;

/* `time` is optional only because revalidate() below omits it. */
function combine_eid_time(eid: number, time?: number) {
  return new EidTimePair(eid, time);
}

export class SplineKCacheItem {
  static STRUCT: string;

  /* The frame's spline packed by Spline.export_ks(); comes back off disk as a
     plain array and is re-wrapped on first load. */
  data: Uint8Array | number[];
  time: number;
  hash: number;

  constructor(data?: Uint8Array | number[], time?: number, hash?: number) {
    this.data = data!;
    this.time = time!;
    this.hash = hash!;
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
  }
}

SplineKCacheItem.STRUCT = `
SplineKCacheItem {
  data : array(byte);
  time : float;
  hash : int;
}
`;

export class SplineKCache {
  static STRUCT: string;

  /* Keyed by frame time. Serialized as an array and rebuilt into a map by
     fromSTRUCT. */
  cache: { [frame: number]: SplineKCacheItem };
  invalid_eids: set<EidTimePair>;
  hash: int;
  /* Only present on files saved before the cache became a map. */
  times?: number[];

  constructor() {
    this.cache = {};
    this.invalid_eids = new set();
    this.hash = 0;
  }

  has(frame: number, spline: Spline) {
    if (!this.cache[frame]) {
      return false;
    }

    let hash = this.calchash(spline);
    if (_DEBUG.timeChange) console.log("hash", hash, "should be", this.cache[frame].hash);

    return this.cache[frame].hash === hash;
  }

  set(frame: number, spline: Spline) {
    for (let eid in spline.eidmap) {
      this.revalidate(parseInt(eid), frame);
    }

    let hash = this.calchash(spline);
    this.cache[frame] = new SplineKCacheItem(spline.export_ks(), frame, hash);
  }

  invalidate(eid: number, time: number) {
    this.invalid_eids.add(combine_eid_time(eid, time));
  }

  revalidate(eid: number, time: number) {
    /* NOTE: this passes `time` in the eid slot and omits the time, so the
       EidTimePair keystr is "<time>_undefined" and never matches anything
       invalidate() put in the set -- revalidate has never removed an entry. */
    let t = combine_eid_time(time);
    this.invalid_eids.remove(t);
  }

  calchash(spline: Spline) {
    let hash = 0;

    let mul1 = Math.sqrt(3.0),
      mul2 = Math.sqrt(17.0);

    for (let v of spline.points) {
      hash = Math.fract(hash * mul1 + v[0] * mul2);
      hash = Math.fract(hash * mul1 + v[1] * mul2);
    }

    return ~~(hash * 1024 * 1024);
  }

  load(frame: number, spline: Spline) {
    if (typeof frame === "string") {
      throw new Error("Got bad frame! " + frame);
    }

    if (!(frame in this.cache)) {
      warn("Warning, bad call to SplineKCache");
      return;
    }

    let data = this.cache[frame].data;
    if (!(data instanceof Uint8Array)) {
      /* NOTE: this replaces the whole SplineKCacheItem with a bare byte array,
         losing its .time and .hash, so the next has() on this frame throws.
         Kept; Reflect.set only sidesteps the declared element type. */
      data = new Uint8Array(data);
      Reflect.set(this.cache, frame, data);
    }

    let ret = spline.import_ks(data);

    if (ret === undefined) {
      //bad data
      delete this.cache[frame];

      console.log("bad kcache data for frame", frame);

      for (let s of spline.segments) {
        s.v1.flag |= SplineFlags.UPDATE;
        s.v2.flag |= SplineFlags.UPDATE;
        s.h1.flag |= SplineFlags.UPDATE;
        s.h2.flag |= SplineFlags.UPDATE;
        s.flag |= SplineFlags.UPDATE;
      }

      spline.resolve = 1;
      return;
    }

    for (let eid in spline.eidmap) {
      let t = combine_eid_time(parseInt(eid), frame);

      if (!this.invalid_eids.has(t)) continue;

      this.invalid_eids.remove(t);
      let e = spline.eidmap[eid];

      e.flag |= SplineFlags.UPDATE;
      spline.resolve = 1;
    }
  }

  _as_array() {
    let ret = [];

    for (let k in this.cache) {
      ret.push(this.cache[k].data);
    }

    return ret;
  }

  static fromSTRUCT(reader: StructReader<SplineKCache>) {
    let ret = new SplineKCache();

    reader(ret);
    let cache: { [frame: number]: SplineKCacheItem } = {};

    let inv = new set<EidTimePair>();

    let rawInvalid = readSerialized<EidTimePair[]>(ret, "invalid_eids");

    if (rawInvalid !== undefined && rawInvalid instanceof Array) {
      for (let i = 0; i < rawInvalid.length; i++) {
        inv.add(rawInvalid[i]);
      }
    }

    /* Pre-map files put bare byte arrays in `cache`; newer ones put whole
       SplineKCacheItems.  `times` is what tells the two apart. */
    let rawCache = readSerialized<(SplineKCacheItem & number[])[]>(ret, "cache");

    if (ret.times) {
      //old structure
      let times = ret.times;
      ret.invalid_eids = inv;
      for (let i = 0; i < rawCache.length; i++) {
        /* NOTE: the old format's entries really are bare byte arrays, so these
           land in the map without a .time or .hash. */
        Reflect.set(cache, times[i], new Uint8Array(rawCache[i]));
      }

      delete ret.times;
      ret.cache = cache;
    } else {
      for (let item of rawCache) {
        cache[item.time] = item;
      }

      ret.cache = cache;
    }
    return ret;
  }
}

SplineKCache.STRUCT = `
  SplineKCache {
    cache : array(SplineKCacheItem) | obj._as_array();
    invalid_eids : iter(EidTimePair);
  }
`;
