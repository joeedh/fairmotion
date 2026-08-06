import type {SplineSegment} from './spline_types.js';
import type {KsArray} from './spline_math.js';
/* Cyclic -- spline_math_hermite.js imports this module -- but KSCALE is only
   read from inside solve() below, long after both have finished loading. */
import {KSCALE} from './spline_math_hermite.js';

//math globals
var SQRT2 = Math.sqrt(2.0);
var FEPS = 1e-17;
var PI = Math.PI;
var sin = Math.sin, cos = Math.cos, atan2 = Math.atan2;
var sqrt = Math.sqrt, pow = Math.pow, log = Math.log, abs=Math.abs;
var SPI2 = Math.sqrt(PI/2);

/* Everything the solver itself touches. `constraint<Params>` satisfies this for
   any Params, which is how one list can hold constraints whose evaluators take
   completely different payloads. */
export interface AnyConstraint {
  limit : number;
  type : string;
  klst : KsArray[];
  klen : number[];
  glst : number[][];
  k : number;
  k2? : number;
  /* `type` says which layout this holds; only the matching evaluator, and
     native_api's packer, know how to read it. */
  params : unknown[];

  exec(do_gs? : boolean) : number;
}

/* One scalar equation over one or more curvature vectors. `ceval` returns the
   residual; `exec()` finite-differences it to fill in the gradients.

   `Params` is whatever payload the evaluator wants -- segments, vertices,
   tangents, arc-length parameters. Nothing here reads it; it is handed straight
   back to `ceval`. */
export class constraint<Params extends unknown[]> implements AnyConstraint {
  limit : number;
  type : string;
  /* The curvature vectors this constraint touches. */
  klst : KsArray[];
  /* How many entries of each klst[i] participate, one per klst entry. */
  klen : number[];
  /* d(residual)/d(klst[i][j]), same shape as klst. */
  glst : number[][];
  ceval : (params : Params) => number;
  params : Params;
  /* Step scale. `k2` is an optional late-iteration override the solver switches
     to after eight steps; nothing in this file sets it. */
  k : number;
  k2? : number;

  constructor(typename : string, k : number, klst : KsArray[],
              klen : number | number[],
              ceval : (params : Params) => number, params : Params,
              limit? : number) {
    if (limit == undefined) limit = 0.00001;

    this.limit = limit;
    this.type = typename;
    this.klst = klst;

    this.ceval = ceval;
    this.params = params;
    this.klen = [];

    if (!(klen instanceof Array)) {
      for (var i=0; i<klst.length; i++) {
        this.klen.push(klen);
      }
    } else {
      this.klen = klen;
    }

    this.glst = []
    for (var i=0; i<klst.length; i++) {
      var gs : number[] = [];
      this.glst.push(gs);

      /* NOTE: bounded by the `klen` parameter rather than this.klen, so an
         array-valued klen is compared through its toString: one entry works by
         accident, more give NaN and no gradient slots at all. */
      for (var j=0; j<Number(klen); j++) {
        gs.push(0);
      }
    }

    this.k = k;
  }

  exec(do_gs? : boolean) {
    if (do_gs == undefined)
      do_gs = true;

    var r1 = this.ceval(this.params);
    if (abs(r1) <= this.limit) return 0.0;

    if (!do_gs) return r1;

    var df = 0.000003;
    for (var ki=0; ki<this.klst.length; ki++) {
      var ks = this.klst[ki];
      var gs = this.glst[ki];

      //var origscale = ks.length > 5 ? ks[KSCALE] : -1;

      for (var i=0; i<this.klen[ki]; i++) {
        var orig = ks[i];

        ks[i] += df;

        var r2 = this.ceval(this.params);
        gs[i] = (r2-r1)/df;

        ks[i] = orig;
        if (ks.length > 5) {
          //ks[KSCALE] = origscale;
        }
      }
    }

    return r1;
  }
}

/*
export class simple_constraint {
  constructor(k, ks, order, ceval, ws, params, limit) {
    if (limit == undefined) limit = 0.001;

    if (ws == undefined) {
      this.ws = []
      for (var i=0; i<order; i++) {
        this.ws.push(0)
      }
    } else {
      this.ws = ws;
    }

    this.gs = new Array(order);
    for (var i=0; i<order; i++) {
      this.gs[i] = 0;
    }

    this.order = order;
    this.ks = ks

    this.klst = [ks]
    this.glst = [this.gs]
    this.klen = 1

    this.ceval = ceval;
    this.params = params;

    this.k = k;
    this.ws = ws;
  }

  exec(do_gs) {
    if (do_gs == undefined)
      do_gs = true;

    var r1 = this.ceval(this.params);
    if (abs(r1) <= this.limit) return 0.0;

    if (!do_gs) return r1;

    var df = 0.000003;
    for (var ki=0; ki<this.klst.length; ki++) {
      var ks = this.klst[ki];
      var gs = this.glst[ki];

      //var origscale = ks.length > 5 ? ks[KSCALE] : -1;

      for (var i=0; i<this.klen[ki]; i++) {
        var orig = ks[i];

        ks[i] += df;

        var r2 = this.ceval(this.params);
        gs[i] = (r2-r1)/df;

        ks[i] = orig;
        if (ks.length > 5) {
          //ks[KSCALE] = origscale;
        }
      }
    }

    return r1;
  }
}
*/

export class solver {
  threshold : number;
  cs : AnyConstraint[];
  edge_segs : SplineSegment[];

  constructor() {
    this.cs = [];
    this.threshold = 0.001;

    /*list of edges with a one-valence vertex.
      note that update flags are taken into account,
      so a vertex with two adjacent edges, but only one of which
      will be updated, is treated as a one-valence vert.*/
    this.edge_segs = [];
  }

  add (c : AnyConstraint) {
    this.cs.push(c);
  }

  /* NOTE: KSCALE used not to be imported here -- the import at the bottom of
     the file was commented out -- so the damping factor `mul` below threw a
     ReferenceError every time this JS fallback ran. */
  solve (steps : number, gk : number, final_solve : boolean,
         edge_segs : SplineSegment[]) {
    if (gk == undefined) gk = 1.0;

    var err = 0.0;
    var clen = this.cs.length;

    for (var i=0; i<steps; i++) {
      //reset outer most segments to their original state
      for (var j=0; j<edge_segs.length; j++) {
        var seg = edge_segs[j];
        var ks = seg.ks;
        for (var k=0; k<ks.length; k++) {
          ks[k] = seg._last_ks[k];
        }
      }

      err /= this.cs.length;
      if (i > 0 && err < this.threshold) break;

      if (isNaN(err)) break;

      //console.log(err)
      err = 0.0;
      var cs = this.cs;

      var visit : {[j : number] : number} = {};
      for (var j=0; j<cs.length; j++) {
        var j2 = i%2 ? clen-j-1 : j;

        /*
        do {
          j2 = Math.floor(Math.random()*(cs.length));
        } while (j2 in visit);

        visit[j2] = 1;
        //*/

        var c = cs[j2];

        var r = c.exec(true);
        err += abs(r); //Math.max(err, abs(r));

        if (r == 0.0) continue;

        /*if (0) {
          var s = "["
          for (var i=0; i<c.gs.length; i++) {
            if (i > 0) s += ", ";

            s += (c.gs[i]*r).toFixed(3);
          }
          s += "]"

          console.log(s);
        }*/

        var klst = c.klst, glst = c.glst;

        var totgs = 0.0;
        //var kg = 1.0;

        for (var ki=0; ki<klst.length; ki++) {
          //r = c.exec(true);

          var klen = c.klen[ki];
          var gs = glst[ki];

          totgs = 0.0;
          for (var k=0; k<klen; k++) {
            totgs += gs[k]*gs[k];
          }

          if (totgs == 0.0) continue;
          var rmul = r/totgs;

          ks=klst[ki];
          gs=glst[ki];

          var ck = i > 8 && c.k2 !== undefined ? c.k2 : c.k;
          //ck = c.k2 != undefined ? 0.8 : c.k;

          //stupid hack to suppress numerical instability
          let mul = 1.0 / Math.pow(1.0 + ks[KSCALE], 0.25);

          for (var k=0; k<klen; k++) {
            ks[k] += -rmul*gs[k]*ck*gk*mul;
          }

          //kg *= 0.5;
        }
      }
    }

    for (var j=0; j<edge_segs.length; j++) {
      var seg = edge_segs[j];
      var ks = seg.ks;

      for (var k=0; k<ks.length; k++) {
        seg.ks[k] = seg._last_ks[k];
      }
    }

    if (final_solve || isNaN(err)) { // && err > this.threshold) {
      console.log("err", err, "steps", i, "\n");
    }

    return i;
  }
}


