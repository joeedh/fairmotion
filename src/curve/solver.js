//math globals
var SQRT2 = Math.sqrt(2.0);
var FEPS = 1e-17;
var PI = Math.PI;
var sin = Math.sin, cos = Math.cos, atan2 = Math.atan2;
var sqrt = Math.sqrt, pow = Math.pow, log = Math.log, abs=Math.abs;
var SPI2 = Math.sqrt(PI/2);

export class constraint {
  constructor(k, klst, klen, ceval, ws, params, limit) {
    if (limit == undefined) limit = 0.001;
    
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
      var gs = [];
      this.glst.push(gs);
      
      for (var j=0; j<klen; j++) {
        gs.push(0);
      }
    }
    
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

export class solver {
  constructor() {
    this.cs = [];
    this.threshold = 0.001;
  }

  add (c) {
    this.cs.push(c);
  }
  
  solve (steps, gk, final_solve, edge_segs) {
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
      
      var visit = {};
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
        
        for (var ki=0; ki<klst.length; ki++) {
          var klen = c.klen[ki];
          var gs = glst[ki];
          
          for (var k=0; k<klen; k++) {
            totgs += gs[k]*gs[k];
          }
        }
        
        if (totgs == 0.0) continue;
        
        totgs = (totgs);
        r /= totgs;
        
        for (var ki=0; ki<klst.length; ki++) {
          var gs = glst[ki], ks=klst[ki];
          
          for (var k=0; k<c.klen[ki]; k++) {
            ks[k] += -r*gs[k]*c.k*gk;
          }
        }
        
        //c.seg.eval(0.5);
        /*
        if (0) {
          var s = "["
          for (var i=0; i<c.gs.length; i++) {
            if (i > 0) s += ", ";
            
            s += (c.ks[i]).toFixed(3);
          }
          s += "]"
          
          console.log(s);
        }*/
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
      //console.log("err", err, "steps", i, "\n");
    }
    
    return i;
  }
}

//import {KSCALE} from 'spline_math';
