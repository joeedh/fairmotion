let _bspline = undefined;

//import {} from '';

let _i = 0;
let IW = _i++;
let IDV1 = _i++;
let IDV2 = _i++;
let IDV3 = _i++;
let IDV4 = _i++;
let ITOT = _i;

export function Table(size, start, end, ds) {
  this.start = start;
  this.end = end;
  this.ds = ds;
  this.size = size;

  this.t = new Float64Array(size*ITOT);
  //return; //XXX

  this.w = new Array(size);
  this.dv = new Array(size);
  this.dv2 = new Array(size);
  this.dv3 = new Array(size);
  this.dv4 = new Array(size);

  this.start = start;
  this.end = end;

  this.ds = ds;

  this.ds2 = ds*ds;
  this.ds3 = ds*ds*ds;
  this.ds4 = ds*ds*ds*ds;
  this.ds5 = ds*ds*ds*ds*ds;
  this.ds6 = ds*ds*ds*ds*ds*ds;
  this.ds7 = ds*ds*ds*ds*ds*ds*ds;
  this.ds8 = ds*ds*ds*ds*ds*ds*ds*ds;
  this.ds9 = ds*ds*ds*ds*ds*ds*ds*ds*ds;
}

let cache = {};

window.NO_CACHE = false;

let uniform_vec = new Array(1024);
for (let i = 0; i < uniform_vec.length; i++) {
  uniform_vec[i] = i;
}

export class BasisCache {
  constructor(knots) {
    this.size = undefined; //is calculated from degree
    this.recalc = 1;
    this.tables = [];

    this.dpad = 1;

    if (knots !== undefined) {
      this.gen(knots);
    }
  }

  gen(ks, degree) {
    if (NO_CACHE) {
      this.recalc = 1;
      return;
    }

    this.tables = [];

    let start_time = time_ms();
    console.log("start generating tables");

    let sz = 14;
    if (degree < 3)
      sz = 128;
    else if (degree < 4)
      sz = 40;

    this.size = sz; //Math.floor(300/degree)+1.0;
    this.degree = degree;
    let dpad = this.dpad;

    for (let i = -degree - dpad; i < ks.length + degree + dpad; i++) {
      let j1 = Math.max(0, i - degree - dpad);
      let j2 = Math.min(ks.length - 1, i + degree + dpad);

      if (i === -degree - dpad)
        j1 = 0;

      let tstart = ks[j1];
      let tend = ks[j2];

      let ds = (tend - tstart)/(this.size - 1.0);
      let table = new Table(this.size, tstart, tend, ds);
      /*
      let table = {
      w   : new Array(this.size),
      dv  : new Array(this.size),
      dv2 : new Array(this.size),
      dv3 : new Array(this.size),
      dv4 : new Array(this.size),

      start : tstart,
      end   : tend,

      ds    : (tend-tstart)/(this.size-1.0),
      ds2   : ds*ds,
      ds3   : ds*ds*ds,
      ds4   : ds*ds*ds*ds,
      ds5   : ds*ds*ds*ds*ds,
          ds6   : ds*ds*ds*ds*ds*ds,
          ds7   : ds*ds*ds*ds*ds*ds*ds,
          ds8   : ds*ds*ds*ds*ds*ds*ds*ds,
          ds9   : ds*ds*ds*ds*ds*ds*ds*ds*ds,
      }*/

      this.tables.push(table);
    }

    this.recalc = 0;

    if (ks.length === 0)
      return;

    let start = ks[0], end = ks[ks.length - 1];
    let s = start, steps = this.size, ds = (end - start)/(steps - 1.0);

    this.start = start;
    this.end = end;

    let df = 0.00001;
    let lastk = ks[ks.length - 1];
    dpad = this.dpad;

    for (let j = -degree - dpad; j < ks.length + degree + dpad; j++) {
      let j1 = Math.min(Math.max(j + degree + dpad, 0), this.tables.length - 1);

      let table = this.tables[j1];
      start = table.start, end = table.end, ds = table.ds;

      let ac = 0.0;
      for (let i = 0, s2 = start; i < steps; i++, s2 += ds) {
        let s = s2;
        s = min(lastk - 0.00000001, s);

        //ac = i * ITOT;
        let table = this.tables[j + degree + dpad];

        //let w = table.w[i] = basis(s, j, degree, ks);

        let dv, dv2, dv3, dv4;

        /*
        if (s+df*4.0 >= lastk-0.000001) {
            let w = table.w[i] = basis(s-4.0, j, degree, ks);
            let dv = basis(s-df*3.0, j, degree, ks);
            let dv2 = basis(s-df*2.0, j, degree, ks);
            let dv3 = basis(s-df, j, degree, ks);
            let dv4 = basis(s, j, degree, ks);
        } else {
            let w = table.w[i] = basis(s, j, degree, ks);
            let dv = basis(s+df, j, degree, ks);
            let dv2 = basis(s+df*2.0, j, degree, ks);
            let dv3 = basis(s+df*3.0, j, degree, ks);
            let dv4 = basis(s+df*4.0, j, degree, ks);
        }

        dv4 = (dv4-dv3)/df;
        dv3 = (dv3-dv2)/df;
        dv2 = (dv2-dv)/df;
        dv = (dv-w)/df;

        dv4 = (dv4-dv3)/df;
        dv3 = (dv3-dv2)/df;
        dv2 = (dv2-dv)/df;

        dv4 = (dv4-dv3)/df;
        dv3 = (dv3-dv2)/df;

        dv4 = (dv4-dv3)/df;
        */
        //*
        dv = dv2 = dv3 = dv4 = 0.0;

        let w = table.w[i] = basis(s, j, degree, ks);

        table.t[ac++] = w;

        //console.log(i, j);
        //let dv = basis(s+df, j, degree, ks);

        //dv = (dv-w)/df;
        //let eps = -0.0001;
        let s2 = s;//*(1.0-eps) + eps;

        dv = basis_dv(s2, j, degree, ks, 1);
        table.t[ac++] = dv;

        if (this.degree > 2) {
          dv2 = basis_dv(s, j, degree, ks, 2);
          table.t[ac++] = dv2;
        } else {
          ac++;
        }

        //*
        if (this.degree > 3) {
          dv3 = basis_dv(s, j, degree, ks, 3);
          table.t[ac++] = dv3;
        } else {
          ac++;
        }
        //*/

        //*
        if (this.degree > 4) {
          dv4 = basis_dv(s, j, degree, ks, 4);
          table.t[ac++] = dv4;
        } else {
          ac++;
        }
        //*/
        table.dv[i] = dv;
        table.dv2[i] = dv2;
        table.dv3[i] = dv3;
        table.dv4[i] = dv4;
      }
    }
  }

  update() {
    this.recalc = 1;
  }

  basis(s, j, n, ks, no_cache) {
    let origs = s;

    if (NO_CACHE || (no_cache !== undefined && no_cache)) {
      return basis(s, j, n, ks, true);
    }

    if (this.recalc) {
      this.gen(ks, n);
    }


    j = min(max(j + n + this.dpad, 0), this.tables.length - 1);

    let table = this.tables[j];
    let start = table.start, end = table.end, ds = table.ds;

    if (s < start || s >= end)
      return 0.0;

    let div = (end - start);
    let tsize = this.size;

    s = (s - start)/div;
    s = min(max(s, 0.0), 1.0)*(tsize - 1.0);

    let t = s;
    s = floor(s);

    s = min(max(s, 0.0), tsize - 1);
    t -= s;

    let s2 = min(s + 1, tsize);

    let ac1 = s*ITOT;
    let ac2 = s2*ITOT;

    let tb = table.t;

    /*
    //function get1() {
     w1 = tb[ac1], dv1a = tb[ac1+1], dv2a=tb[ac1+2], 
             dv3a=tb[ac1+3], dv4a=tb[ac1+4];
             
     w2 = tb[ac2], dv1b = tb[ac2+1], dv2b=tb[ac2+2], 
             dv3b=tb[ac2+3], dv4b=tb[ac2+4];
    //}
    
    //get1();
    //return w1; //table.t[ac1];
    //*/
    //*
    let w1 = table.w[s], dv1a = table.dv[s], dv2a = table.dv2[s], dv3a = table.dv3[s], dv4a = table.dv4[s];
    let w2 = table.w[s2], dv1b = table.dv[s2], dv2b = table.dv2[s2], dv3b = table.dv3[s2], dv4b = table.dv4[s2];
    //return w1;
    //*/
    //let w3 = tba[c2++], dv1c = tba[c2++], dv2b=tba[c2++], 
    //         dv3b=tba[c2++], dv4b=tba[c2++];

    /* cubic bezier
    dv1a *= (1.0/3.0)*ds;
    dv1b *= (1.0/3.0)*ds;
    
    dv1a += w1;
    dv1b = w2-dv1b;
    
    let r1 = w1 + (dv1a -  w1)*t;
    let r2 = dv1a + (dv1b -  dv1a)*t;
    let r3 = dv1b + (w2 -  dv1b)*t;
    
    r1 = r1 + (r2 - r1)*t;
    r2 = r2 + (r3 - r2)*t;
    
    //t = t*t*(3.0 - 2.0*t);
    
    return r1 + (r2 - r1)*t;
    */
    //return w1;
    //return w1;
    /*
    let dv2a = table.dv2[s];
    let dv3a = table.dv3[s];
    let dv4a = table.dv4[s];
    
    let dv2b = table.dv2[s2];
    let dv3b = table.dv3[s2];
    let dv4b = table.dv4[s2];

    let s3 = min(s+2, table.w.length-1);
    let w3   = table.w[s3];
    let dv1c = table.dv[s3];*/

    //return w1 + (w2 - w1)*t;


    /*
        on factor;
        off period;
        
        fp := a*s**3 + b*s**2 + c*s**1 + d; 
        
        dv1a := (w2-w1)/0.5;
        dv1b := (w3-w2)/0.5;
        
        f1 := sub(s=0.0, fp) = w1;
        f2 := sub(s=1.0, fp) = w3;
        f3 := sub(s=0.0, df(fp, s)) = dv1a;
        f4 := sub(s=1.0, df(fp, s)) = dv1b;
        f := solve({f1, f2, f3, f4}, {a, b, c, d});
        fa := part(f, 1, 1, 2);
        fb := part(f, 1, 2, 2);
        fc := part(f, 1, 3, 2);
        fd := part(f, 1, 4, 2);
        
        fp2 := sub(a=fa, b=fb, c=fc, d=fd, fp);
        r1 := w1 + (w2 - w1)*s;
        r2 := w2 + (w3 - w2)*s;
        r1 + (r2 - r1)*s;
    */


    //return w;
    //*

    let t2 = 1.0 - t;
    let t3 = t;

    t *= ds;
    t2 *= -ds;

    let eps = 0.000001;
    t3 = (t3*(1.0 - eps*2.0)) + eps;

    //see basistaylor.reduce
    s = t3*ds;

    s2 = s*s, s3 = s*s*s, s4 = s2*s2, s5 = s4*s, s6 = s3*s3, s7 = s6*s, s8 = s7*s;
    // let ds2=table.ds2, ds3 = table.ds3, ds4=table.ds4, ds5=table.ds5;
    //let ds6=table.ds6, ds7=table.ds7;
    let ds2 = ds*ds, ds3 = ds*ds*ds, ds4 = ds3*ds, ds5 = ds4*ds, ds6 = ds5*ds, ds7 = ds6*ds, ds8 = ds7*ds;

    let polynomial = ((((dv3a*s3 + 6*w1 + 3*dv2a*s2 + 6*dv1a*s)*ds5 + 3*(2*ds3*
        dv3a + ds3*dv3b + 20*ds2*dv2a - 14*ds2*dv2b + 90*ds*dv1a + 78*ds*
        dv1b + 168*w1 - 168*w2)*s5)*ds - (4*ds3*dv3a + 3*ds3*dv3b + 45*
        ds2*dv2a - 39*ds2*dv2b + 216*ds*dv1a + 204*ds*dv1b + 420*w1 - 420*w2)*
      s6)*ds + ((dv3a + dv3b)*ds3 + 120*(w1 - w2) + 12*(dv2a - dv2b)*ds2 +
      60*(dv1a + dv1b)*ds)*s7 - ((4*dv3a + dv3b)*ds3 + 210*(w1 - w2) + 15*(2
      *dv2a - dv2b)*ds2 + 30*(4*dv1a + 3*dv1b)*ds)*ds3*s4)/(6*ds7);

    if (isNaN(polynomial)) {
      // throw new Error();
      //console.trace("NAN in basis cache!");
      return 0;
    }

    return polynomial;
    /*
        let dm = ds
        s = t3;
        s2=s*s, s3=s*s*s, s4=s2*s2, s5=s4*s, s6=s3*s3, s7=s6*s, s8=s7*s;
        dv1a *= dm; dv1b *= dm; dm *= dm;
        dm = 0.0
        dv2a *= dm; dv2b *= dm; dm *= dm;
        dv3a *= dm; dv3b *= dm; //dm *= dm;

        let polynomial1 = ((120*(w1-w2)+dv3b+dv3a-12*dv2b+12*dv2a+60*dv1b+60*dv1a)*s7+
                dv3a*s3+6*w1+3*dv2a*s2+6*dv1a*s-(3*(140*(w1-w2)+dv3b)+
                4*dv3a-39*dv2b+45*dv2a+204*dv1b+216*dv1a)*s6+3*(168*(w1-w2)+
                 dv3b+2*dv3a-14*dv2b+20*dv2a+78*dv1b+90*dv1a)*s5-(210*(w1-w2)
                +dv3b+4*dv3a-15*dv2b+30*dv2a+90*dv1b+120*dv1a)*s4)/6.0;

        return polynomial1;
        let a = w1 + dv1a*t + dv2a*0.5*t*t;
        a    += dv3a*(1.0/6.0)*t*t*t + dv4a*(1.0/24.0)*t*t*t*t;

        let b = w2 + dv1b*t2 + dv2b*0.5*t2*t2;
        b   += dv3b*(1.0/6.0)*t2*t2*t2 + dv4b*(1.0/24.0)*t2*t2*t2*t2;

        return a + (b - a)*t3;*/
  }
}

let basis_dv_cache = new cachering(function () {
  let ret = new Array(32);

  for (let i = 0; i < ret.length; i++) {
    ret[i] = 0.0;
  }

  ret.j = undefined;
  ret.n = undefined;

  ret.init = function (j, n) {
    this.j = j;
    this.n = n;

    for (let i = 0; i < this.length; i++) {
      this[i] = 0;
    }
  }

  return ret;
}, 64);

export function basis_dv(s, j, n, ks, dvn) {
  if (dvn === undefined)
    dvn = 1;

  return compiled_basis_dv(s, j, n, ks, dvn);

  if (dvn === 0) {
    return basis(s, j, n, ks);
  }

  let klen = ks.length;
  let j1 = j, j2 = j + 1, jn = j + n, jn1 = j + n + 1;

  j1 = min(max(j1, 0.0), klen - 1);
  j2 = min(max(j2, 0.0), klen - 1);
  jn = min(max(jn, 0.0), klen - 1);
  jn1 = min(max(jn1, 0.0), klen - 1);

  /*let df = 0.00001;
  let a = basis(s, j, n, ks);
  let b = basis(s+df, j, n, ks);
  return (b-a)/df;*/

  /*
  on factor;
  off period;

  operator bs;

  a := (s-kj1)  / (kjn - kj1);
  b := (kjn1 - s) / (kjn1-kj2);
  f := a*bs(s, j, n-1) + b*bs(s, j+1, n-1);

  df(f, s, 2);
  */

  if (n < 1) {
    return 0;
  } else if (0 && n <= 1) {
    let j3 = min(max(j + 2, 0.0), klen - 1);
    let j4 = min(max(j + 3, 0.0), klen - 1);

    /*
      let df = 0.0001;
      let a = basis(s, j, n, ks);
      let b = basis(s+df, j, n, ks);
      return (b-a)/df;
    //*/

    //if (s >= ks[j1] && s < ks[j3])
    //    return ks[j3]-ks[j1];

    let ret = 0.0;
    if (s >= ks[j1] && s < ks[j2])
      ret = 1.0/(ks[j2] - ks[j1]);
    else if (s >= ks[j2] && s < ks[j3])
      ret = -1.0/(ks[j3] - ks[j2]);

    return ret;
  } else {
    let kj1 = ks[j1];
    let kj2 = ks[j2];
    let kjn = ks[jn] + 0.0000000001;
    let kjn1 = ks[jn1] + 0.0000000001;

    let div = ((kj1 - kjn)*(kj2 - kjn1));

    if (div === 0.0) {
      div = 0.0;
    }
    let lastdv = basis_dv(s, j, n - 1, ks, dvn - 1);

    let ret = ((kj1 - s)*basis_dv(s, j, n - 1, ks, dvn) -
      dvn*basis_dv(s, j, n - 1, ks, dvn - 1))*(kj2 - kjn1);
    ret -= ((kjn1 - s)*basis_dv(s, j + 1, n - 1, ks, dvn) -
      dvn*basis_dv(s, j + 1, n - 1, ks, dvn - 1))*(kj1 - kjn);

    if (div !== 0.0)
      ret /= div;
    else
      ret /= 0.0001;

    return ret;
  }
}

let min = Math.min, max = Math.max;

let dtmp = new Array(64);
let ktmp = new Array(64);

/*
from: https://en.wikipedia.org/wiki/De_Boor%27s_algorithm

Evaluates S(x).

Arguments
---------
  k: Index of knot interval that contains x.
  x: Position.
  t: Array of knot positions, needs to be padded as described above.
  c: Array of control points.
  p: Degree of B-spline.
*/
export function deBoor(k: int, x: number, knots: Array<number>, controls: Array<number>, degree: int): number {
  let p = degree;

  //pad knot vector
  /*
  for (i=0; i<p; i++) {
    ktmp[i] = knots[0];
    ktmp[knots.length+p+i] = knots[knots.length-1];
  }
  for (let i=0; i<knots.length; i++) {
    ktmp[i+p] = knots[i];
  }
  knots = ktmp;
  */

  let t = knots;
  let c = controls;

  //d = [c[j + k - p] for j in range(0, p+1)]
  let d = dtmp;
  for (let j = 0; j < p + 1; j++) {
    let j2 = Math.min(Math.max(j + k - p, 0), knots.length - 1);
    d[j] = c[j2];
  }

  for (let r = 1; r < p + 1; r++) {
    for (let j = p; j > r - 1; j--) {
      let alpha = (x - t[j + k - p])/(t[j + 1 + k - r] - t[j + k - p])
      d[j] = (1.0 - alpha)*d[j - 1] + alpha*d[j]
    }
  }

  return d[p];
}

export function basis(s, j, n, ks, no_cache = false) {
  //if (!no_cache) {
  return compiled_basis(s, j, n, ks);
  //}

  let klen = ks.length;
  let j1 = j, j2 = j + 1, jn = j + n, jn1 = j + n + 1;

  j1 = min(max(j1, 0.0), klen - 1);
  j2 = min(max(j2, 0.0), klen - 1);
  jn = min(max(jn, 0.0), klen - 1);
  jn1 = min(max(jn1, 0.0), klen - 1);

  if (n === 0) {
    return s >= ks[j1] && s < ks[j2];
  } else {
    let A = s - ks[j1];
    let div = ks[jn] - ks[j1];
    div += 0.00001;

    //A = div !== 0.0 ? (A / div)*basis(s, j, n-1, ks) : 0.0;
    A = (A/div)*basis(s, j, n - 1, ks);

    let B = ks[jn1] - s;
    div = ks[jn1] - ks[j2];
    div += 0.00001;

    //B = div !== 0.0 ? (B / div)*basis(s, j+1, n-1, ks) : 0.0;
    B = (B/div)*basis(s, j + 1, n - 1, ks);

    return A + B;
  }
}

export function uniform_basis_intern(s, j, n) {
  let ret = basis(s, j, n, uniform_vec);

  if (n === 0) {
    return (s >= j && s < j + 1) ? 1.0 : 0.0;
  } else {
    let A = (s - j)/n;
    let B = (n + j + 1 - s)/n;

    return uniform_basis(s, j, n - 1)*A + uniform_basis(s, j + 1, n - 1)*B;
  }
}

function get_hash(h) {
  return cache[h];
}

function set_hash(h, val) {
  cache[h] = val;
}

export function uniform_basis(s, j, n, len) {
  uniform_vec.length = len === undefined ? 1024 : len;

  return basis(s, j, n, uniform_vec);

  //j = max(j, 0);

  let hash = s + j*100.0 + n*10000.0;

  let ret = get_hash(hash);
  if (ret === undefined) {
    ret = uniform_basis_intern(s, j, n);
    set_hash(hash, ret);
  }

  return ret;
}

let toHash2_stack = new Array(4096);
let toHash2_stack_2 = new Float64Array(4096);
let toHash2_stack_3 = new Float64Array(4096);

let _str_prejit = new Array(4096);
let strpre = 8;

let RNDLEN = 1024;
let rndtab = new Float64Array(RNDLEN);

for (let i = 0; i < rndtab.length; i++) {
  rndtab[i] = Math.random()*0.99999999;
}

function precheck(key) {
  let s1 = "";
  let seed = key.length%RNDLEN;
  seed = floor(rndtab[seed]*RNDLEN);

  let klen = key.length;

  for (let i = 0; i < strpre; i++) {
    s1 += key[floor(rndtab[seed]*klen)];
    seed = (seed + 1)%RNDLEN;
  }

  return s1;
}

let _vbuf = new Uint8Array(8);
let _view = new DataView(_vbuf.buffer);
let _fview = new Float32Array(_vbuf.buffer);
let _iview = new Int32Array(_vbuf.buffer);
let _sview = new Int16Array(_vbuf.buffer);

function pack_float(f) {
  let s = "";
  //_view.setFloat32(0, f);
  _fview[0] = f;

  for (let i = 0; i < 4; i++) {
    s += String.fromCharCode(_vbuf[i]);
  }

  return s;
}

function pack_int(f) {
  let s = "";
  //_view.setFloat32(0, f);
  _iview[0] = f;

  for (let i = 0; i < 4; i++) {
    s += String.fromCharCode(_vbuf[i]);
  }

  return s;
}

function pack_short(f) {
  let s = "";
  //_view.setFloat32(0, f);
  _sview[0] = f;

  for (let i = 0; i < 2; i++) {
    s += String.fromCharCode(_vbuf[i]);
  }

  return s;
}

function pack_byte(f) {
  return String.fromCharCode(f);
}

let tiny_strpool = {};
let tiny_strpool_idgen = 1;

function pack_str(f) {
  let ret = "";

  if (!(f in tiny_strpool)) {
    tiny_strpool[f] = tiny_strpool_idgen++;
  }

  return pack_short(tiny_strpool[f]);
}

let tiny_strpool2 = {};
let tiny_strpool_idgen2 = 1;

function pack_op(f) {
  let ret = "";

  if (!(f in tiny_strpool2)) {
    tiny_strpool2[f] = tiny_strpool_idgen2++;
  }

  return pack_byte(tiny_strpool2[f]);
}

window.pack_float = pack_float;

window.precheck = precheck;

let _str_prehash = {}
let _str_idhash = window._str_idhash = {};
let _str_idhash_rev = window._str_idhash_rev = {};
let _str_idgen = 0;

function spool(hash) {
  if (hash in _str_idhash) {
    return _str_idhash[hash];
  } else {
    let ret = _str_idgen++;

    _str_idhash[hash] = ret;
    _str_idhash_rev[ret] = hash;

    return ret;
  }
}

function spool_len(id) {
  return _str_idhash_rev[id].length;
}

window.tot_symcls = 0.0;
let KILL_ZEROS = true;

export class symcls {
  constructor(name_or_value, op) {
    this._id = tot_symcls++;

    this._last_h = undefined;
    this.value = undefined;
    this.name = ""; //"(error)";
    this.a = this.b = undefined;
    this.use_parens = false;
    this.op = undefined;
    this.parent = undefined;
    this._toString = undefined;
    this.is_func = false;

    this._hash = this._toString = undefined;

    this.key = this.tag = undefined;
    this._done = this._visit = false;
    this.id = undefined;
    this.ins = this.ins_ids = undefined;
    this.is_tag = this.is_root = undefined;

    /*Object.defineProperty(this, "hash", {
        get : function() {
            if (this._hash === undefined) {
                this._hash = spool(""+this);
            }
            return this._hash;
        }   
    });*/

    if (typeof name_or_value === "number" || typeof name_or_value === "boolean") {
      this.value = name_or_value;
    } else if (typeof name_or_value === "string" || name_or_value instanceof String) {
      this.name = name_or_value;
    }
  }

  binop(b, op) {
    if (typeof b === "string" || typeof b === "number" || typeof b === "boolean") {
      b = new symcls(b);
    }

    let ret = new symcls();
    let a = this;

    if (a.value !== undefined && b.value !== undefined && a.a === undefined && b.a === undefined) {
      ret.value = eval(a.value + " " + op + " " + b.value);
      return ret;
    }

    ret.use_parens = true;
    ret.op = op;

    if (KILL_ZEROS && a.value !== undefined && a.value === 0.0 && (op === "*" || op === "/")) {
      return sym(0);
    } else if (KILL_ZEROS && b.value !== undefined && b.value === 0.0 && (op === "*")) {
      return sym(0);
    } else if (KILL_ZEROS && this.a === undefined && this.value === 0.0 && op === "+") {
      return b.copy();
    } else if (KILL_ZEROS && b.a === undefined && b.value === 0.0 && (op === "+" || op === "-")) {
      return this.copy();
    } else if (this.value === 1.0 && op === "*" && this.a === undefined) {
      return b.copy();
    } else if (b.value === 1.0 && (op === "*" || op === "/") && b.a === undefined) {
      return this.copy();
    }

    if (this.b !== undefined && this.b.value !== undefined &&
      b.value !== undefined && op === "+") {

      ret = this.copy();
      ret.b.value = this.b.value + b.value;
      return ret;
    }

    ret.a = a.copy();
    ret.b = b.copy();

    ret.a.parent = ret;
    ret.b.parent = ret;

    return ret;
  }

  hash() {
    if (this._hash === undefined) {
      this._hash = spool(this.toHash());
    }
    return this._hash;
  }

  index(arg1) {
    if (typeof arg1 === "string" || arg1 instanceof String || typeof arg1
      === "number" || typeof arg1 === "boolean") {
      arg1 = sym(arg1);
    } else {
      arg1 = arg1.copy();
    }

    let ret = sym();

    ret.op = "i";
    ret.a = this.copy();
    ret.b = arg1;

    return ret;
  }

  func(fname, arg1) {
    if (typeof fname === "string" || fname instanceof String) {
      fname = sym(fname);
    }

    let ret = sym();

    if (arg1 === undefined) {
      ret.a = fname.copy();
      ret.b = this.copy();
      ret.op = "c";
    } else {
      if (typeof arg1 === "string" || arg1 instanceof String || typeof arg1
        === "number" || typeof arg1 === "boolean") {
        arg1 = sym(arg1);
      }

      ret.a = this.copy();
      ret.b = arg1.copy();
      ret.op = fname;
    }

    ret.is_func = true;

    return ret;
  }

  copy(copy_strcache) {
    let ret = new symcls();
    ret.name = this.name;
    ret.value = this.value;
    ret.use_parens = this.use_parens;
    ret.op = this.op;
    ret.is_func = this.is_func;

    if (copy_strcache) {
      ret._toString = this._toString; //risky!
      ret._hash = this._hash; //this too!
    } else {
      ret._hash = ret._toString = undefined;
    }

    if (this.a !== undefined) {
      ret.a = this.a.copy(copy_strcache);
      ret.b = this.b.copy(copy_strcache);

      ret.a.parent = ret;
      ret.b.parent = ret;
    }

    return ret;
  }

  negate() {
    return this.binop(-1.0, "*");
  }

  add(b) {
    return this.binop(b, "+");
  }

  sub(b) {
    return this.binop(b, "-");
  }

  mul(b) {
    return this.binop(b, "*");
  }

  div(b) {
    return this.binop(b, "/");
  }

  pow(b) {
    return this.binop(b, "p");
  }

  clear_toString() {
    this._toString = undefined;
    this._hash = undefined;
    this._last_h = undefined;

    if (this.a !== undefined) {
      //   this.a.clear_toString();
      //  this.b.clear_toString();
    }
  }

  toHash2() {
    let stack = toHash2_stack, stack2 = toHash2_stack_2, top = 0;
    let stack3 = toHash2_stack_3;

    //stack is main stack
    //stack2 stores "stages" (states)
    //stack3 store beginning string indexing for caching

    stack[top] = this;
    stack2[top] = 0;
    stack3[top] = 0;

    let ret = "";

    let _i = 0;
    while (top >= 0) {
      if (_i > 100000) {
        console.log("infinite loop!");
        break;
      }

      let item = stack[top];
      let stage = stack2[top];
      let start = stack3[top];
      top--;

      /*
      if (item._last_h !== undefined) {
          ret += item._last_h;
          continue;
      }*/

      //console.log(item, stage);

      if (stage === 0) {
        ret += item.name + "|";
        ret += (item.value !== undefined ? item.value : "") + "|";
        ret += item.is_func + "|";
      }

      if (item.a !== undefined && stage === 0) {
        ret += item.op + "$";

        top++;
        stack[top] = item;
        stack2[top] = 1;
        stack3[top] = start;

        top++;
        stack[top] = item.a;
        stack2[top] = 0;
        stack3[top] = ret.length;
      } else if (item.b !== undefined && stage === 1) {
        ret += "$";
        /*
        top++;
        stack[top] = item;
        stack2[top] = 2;
        stack3[top] = start;
        //*/

        top++;
        stack[top] = item.b;
        stack2[top] = 0;
        stack3[top] = ret.length;
      } /*else {
                if (stage === 2) {
                    ret += "$";
                }
                
                item._last_h = ret.slice(start, ret.length);
            }*/
    }

    return ret;
  }

  toHash3() {
    let ret = "";

    if (this._last_h !== undefined) {
      return this._last_h;
    }

    ret += pack_str(this.name);

    ret += this.value !== undefined ? pack_short(this.value*15000) : "" //pack_short(0.0);
    ret += pack_byte(this.is_func);

    if (this.a !== undefined) {
      ret += pack_op(this.op)
      ret += this.a.toHash3();// + pack_byte(-1);
      ret += this.b.toHash3();// + pack_byte(-1);
    }

    this._last_h = ret;

    return ret;
  }

  toHash() {
    //return ""+this;
    return this.toHash3();

    let ret = "";

    if (this._last_h !== undefined) {
      //return this._last_h;
    }

    ret += this.name + "|";
    ret += (this.value !== undefined ? this.value : "") + "|";
    ret += this.is_func + "|";

    if (this.a !== undefined) {
      ret += this.op + "$";
      ret += this.a.toHash() + "$";
      ret += this.b.toHash() + "$";
    }

    this._last_h = ret;

    return ret;
  }

  toString() {
    if (this._toString !== undefined) {
      return this._toString;
    }

    let use_parens = this.use_parens;
    use_parens = use_parens && !(this.parent !== undefined && (this.parent.op === "i" ||
      this.parent.op === "c" || this.parent.op.length > 2));

    use_parens = use_parens && !(this.value !== undefined && this.a === undefined);
    use_parens = use_parens && !(this.name !== undefined && this.name !== "" && this.a === undefined);

    let s = use_parens ? "(" : "";

    if (this.a !== undefined && this.op === "i") {
      return "" + this.a + "[" + this.b + "]";
    } else if (this.a !== undefined && this.is_func && this.op !== "c") {
      s += "" + this.op + "(" + this.a + ", " + this.b + ")";
    } else if (this.a !== undefined && this.is_func && this.op === "c") {
      s += "" + this.a + "(" + this.b + ")";
    } else if (this.a !== undefined && this.op !== "p") {
      s += "" + this.a + " " + this.op + " " + this.b;
    } else if (this.a !== undefined && this.op === "p") {
      return "pow(" + this.a + ", " + this.b + ")";
    } else if (this.value !== undefined && this.a === undefined) {
      s += "" + this.value;
    } else if (this.name !== undefined && this.name !== "") {
      s += this.name;
    } else {
      s += "{ERROR!}";
    }

    s += use_parens ? ")" : "";

    this._toString = s;

    return s;
  }
}

export function sym(name_or_value) {
  return new symcls(name_or_value);
}

function recurse2_a(n, root, map, haskeys, map2, subpart_i, symtags) {
  function recurse2(n, root) {
    let key = n.hash();

    if (map.has(key)) {
      n.tag = symtags.get(map2.get(key));
      n.tag.key = key;
      n.tag.is_tag = true;
      n.key = key;

      if (root !== undefined && n !== root) {
        if (!haskeys.has(root.key)) {
          haskeys.set(root.key, new hashtable());
        }

        haskeys.get(root.key).set(key, 1);
      }
    }

    if (n.a !== undefined) {
      recurse2(n.a, root);
      recurse2(n.b, root);
    }

    return n;
  }

  return recurse2(n, root);
}

export function optimize(tree) {
  tot_symcls = 0;

  let start_tree = tree.copy(true);

  function output() {
    console.log.apply(console, arguments);
  }

  function optimize_pass(tree, subpart_start_i) {
    if (subpart_start_i === undefined)
      subpart_start_i = 0;
    let subpart_i = subpart_start_i;

    let totstep = 8;
    let curstage = 1;

    output("begin optimization stage " + (curstage++) + " of " + totstep + ". . .");


    let symtags = new hashtable();
    let map = new hashtable()
    let mapcount = new hashtable();

    function recurse(n, depth) {
      if (depth === undefined)
        depth = 0;

      if (n.a === undefined) // || n.a.a === undefined)
        return;

      let hash;
      if (n.a !== undefined) {
        let str = n.toHash();

        if (str.length < 25) { //n.a === undefined || n.a.a === undefined) {//str.length < 30) {
          return;
        }
      }

      if (depth > 3) {
        hash = hash === undefined ? n.hash() : hash;

        map.set(hash, n.copy());

        if (!mapcount.has(hash)) {
          mapcount.set(hash, 0);
        }

        mapcount.set(hash, mapcount.get(hash) + 1);
      }

      if (n.a !== undefined) {
        recurse(n.a, depth + 1);
      }
      if (n.b !== undefined) {
        recurse(n.b, depth + 1);
      }
    }

    recurse(tree);

    let keys = map.keys();
    keys.sort(function (a, b) {
      return -spool_len(a)*mapcount.get(a) + spool_len(b)*mapcount.get(b);
    });

    let map2 = new hashtable();

    output("begin optimization stage " + (curstage++) + " of " + totstep + ". . .");

    //supposedly, putting this bit in a closure will optimize better.
    let keys3 = [];
    let i2 = 0;
    let max_si = 0;

    function next() {
      for (let i = 0; i < keys.length; i++) {
        if (mapcount.get(keys[i]) < 3) {
          map.remove(keys[i]);
          continue;
        }

        map2.set(keys[i], i2++);
        max_si = max(map2.get(keys[i]), max_si);

        symtags.set(i2 - 1, sym("SUBPART" + ((i2 - 1) + subpart_i)));
      }
    }

    next();
    output("begin optimization stage " + (curstage++) + " of " + totstep + ". . .");

    keys = undefined;
    let haskeys = new hashtable();

    tree = recurse2_a(tree, undefined, map, haskeys, map2, subpart_i, symtags);

    keys3 = map2.keys();
    keys3.sort(function (a, b) {
      return -spool_len(a)*mapcount.get(a) + spool_len(b)*mapcount.get(b);
    });

    function recurse3(n, key) {
      if (n.a !== undefined) {
        if (n.a.tag !== undefined && !n.a.is_tag && n.a.key === key) {
          n.a.parent = undefined;
          n.a = n.a.tag;
          n.clear_toString();
        } else {
          recurse3(n.a, key);
        }

        if (n.b.tag !== undefined && !n.b.is_tag && n.b.key === key) {
          n.b.parent = undefined;
          n.b = n.b.tag;
          n.clear_toString();
        } else {
          recurse3(n.b, key);
        }
      }

      return n;
    }

    output("begin optimization stage " + (curstage++) + " of " + totstep + ". . .");

    for (let i = 0; i < keys3.length; i++) {
      tree = recurse3(tree, keys3[i]);
    }

    let exists = new hashtable();

    function recurse4(n, key) {
      if (n.is_tag) {
        exists.set(n.key, true);
      }

      if (n.is_tag && n.key !== undefined && n.key === key)
        return true;

      if (n.a !== undefined) {
        if (recurse4(n.a, key))
          return true;
        if (recurse4(n.b, key))
          return true;
      }

      return false;
    }

    recurse4(tree);
    output("begin optimization stage " + (curstage++) + " of " + totstep + ". . .");

    keys3.sort(function (a, b) {
      return -map2.get(a) + map2.get(b);
    });

    //apply substitutions to substitutions, too
    output("begin optimization stage " + (curstage++) + " of " + totstep + ". . .");
    output(keys3.length);
    let last_time2 = time_ms();

    haskeys = new hashtable();
    window.haskeys = haskeys;

    /*
    function find_keys(n, root) {
        if (n !== root && n.is_tag) {

        }

        if (n.a !== undefined) {
            find_keys(n.a, root);
            find_keys(n.b, root);
        }
    }

    for (let i=0; i<keys3.length; i++) {
        let n = map.get(keys3[i])
        n.key = keys3[i];

        find_keys(n, n);
    }*/

    for (let i = 0; i < keys3.length; i++) {
      //for (let i=keys3.length-1; i>= 0; i--) {
      if (time_ms() - last_time2 > 500) {
        output("optimizing key", i + 1, "of", keys3.length);
        last_time2 = time_ms();
      }

      let n = map.get(keys3[i]);

      let last_time = time_ms();

      for (let j = 0; j < keys3.length; j++) {
        //for (let j=keys3.length-1; j>= 0; j--) {
        if (i === j)
          continue;

        if (time_ms() - last_time > 500) {
          output("  subkey part 1:", j + 1, "of", keys3.length + ", for", i + 1);
          last_time = time_ms();
        }

        recurse2_a(n, n, map, haskeys, map2, subpart_i, symtags);
        //*
      }

      for (let j = 0; j < keys3.length; j++) {
        //for (let j=keys3.length-1; j>= 0; j--) {
        let key = keys3[j];

        if (i === j)
          continue;

        if (time_ms() - last_time > 500) {
          output("  subkey part 2", j + 1, "of", keys3.length + ", for", i + 1);
          last_time = time_ms();
        }//*/

        if (haskeys.get(n.key) === undefined || !(haskeys.get(n.key).has(key)))
          continue;

        recurse3(n, keys3[j]);
        recurse4(n, keys3[j]);

        n.clear_toString();
      }
    }

    output("begin optimization stage " + (curstage++) + " of " + totstep + ". . .");

    function tag(n, root) {
      if (n !== root && n.is_tag) {
        let k = n.key;

        if (k === root.key) {
          output("Cycle!", k, root.key);
          throw RuntimeError("Cycle! " + k + ", " + root.key);
          return;
        }

        root.ins.set(n.key, 1);

        let id = map2.get(n.key);
        root.ins_ids.set(id, id);
      }

      if (n.a !== undefined) {
        tag(n.a, root);
        tag(n.b, root);
      }
    }

    output("begin optimization stage " + (curstage++) + " of " + totstep + ". . .");

    let dag = [];
    window.dag = dag;

    function visit_n(k) {
      let n2 = map.get(k);

      if (!n2._done) {
        dagsort(n2);
      }
    }

    function dagsort(n) {
      if (n._done) {
        return;
      }

      if (n._visit) {
        throw new Error("CYCLE!", n, n._visit);
      }

      if (n.is_root) {
        n._visit = true;

        /*for (let k in n.ins) {
        n.ins.forEach(function(k) {
            let n2 = map.get(k);

            if (!n2._done) {
                dagsort(n2);
            }
        }//, this);//*/
        n.ins.forEach(visit_n, this);

        n._visit = false;
        dag.push(n);

        n._done = true;
      }

      if (n.a !== undefined) {
        dagsort(n.a);
        dagsort(n.b);
      }
    }

    for (let i = 0; i < keys3.length; i++) {
      let n = map.get(keys3[i]);

      n.is_root = true;
      n.ins = new hashtable();
      n.ins_ids = new hashtable();
      //n.outs = new hashtable();
      n.id = map2.get(keys3[i]);
    }

    for (let i = 0; i < keys3.length; i++) {
      let n = map.get(keys3[i]);

      n._visit = n._done = false;
      n.key = keys3[i];
      tag(n, n);
    }

    for (let i = 0; i < keys3.length; i++) {
      let n = map.get(keys3[i]);
      if (!n._done) {
        dagsort(n);
      }
    }

    let i1 = 0;
    let header = "";
    for (let i = 0; i < dag.length; i++) {
      let n = dag[i];
      let key = n.key;

      if (subpart_i > 0 || i > 0) header += ", "

      n.clear_toString();

      header += "\n    "
      header += "SUBPART" + map2.get(key) + " = " + "" + n;
    }
    header += "\n";

    let finals = header + "" + tree;

    output("finished!");

    return [tree, finals, header, max_si];
  }

  let si = 0;
  let header2 = "";
  //for (let i=0; i<4; i++) {
  let r = optimize_pass(tree, si);

  if (i > 0 && header2.trim() !== "" && header2.trim()[header2.length - 1] !== ",")
    header2 += ", ";

  header2 += r[2];

  tree = r[0].copy();
  si += r[3] + 1;
  //console.log("\n\n\n\n");
  //}
  header2 = header2.trim();
  if (header2.trim() !== "")
    header2 = "let " + header2 + ";\n";

  let final2 = header2 + "\n  return " + tree + ";\n";

  let ret = undefined, func;
  let code1 = "ret = function(s, j, n, ks, dvn) {" + final2 + "};";
  code1 = splitline(code1);
  eval(code1)
  func = ret;

  let func2 = undefined;
  let code2 = "ret = function(s, j, n, ks, dvn) {return " + ("" + start_tree) + ";};";
  code2 = splitline(code2);
  func = ret;
  eval(code2)

  return [func, func2, code1, code2, tree];
}

export function get_cache(k, v) {
  let ret;
  try {
    ret = JSON.parse(myLocalStorage["_store_" + k]);
  } catch (error) {
    print_stack(error);
    return undefined;
  }

  if (ret === "undefined") {
    return undefined;
  }
}

window.get_cache = get_cache;

export function store_cache(k, v) {
  myLocalStorage["_store_" + k] = JSON.stringify(v);
}

window.store_cache = store_cache;

window.test_sym = function test_sym() {

  let x = sym("x");
  x = x.binop(2, "*");

  let degree = 2, klen = 10, j = 2;
  let dvn = 1;

  KILL_ZEROS = false;

  let tree = gen_basis_dv_code(j, degree, klen, dvn);
  let start_tree = tree.copy();

  KILL_ZEROS = true;

  tree = gen_basis_dv_code(j, degree, klen, dvn);

  window.tree_func = optimize(tree);
  let skey = "" + j + "|" + degree + "|" + klen + "|" + dvn;
  store_cache(skey, tree_func[2]);

  let tst = new Float32Array(10);
  for (let i = 0; i < tst.length; i++) {
    tst[i] = i;
  }

  let finals = tree_func[2];

  console.log("ratio: ", finals.replace(" ", "").replace("\n", "").length/("" + start_tree).replace(" ", "").replace("\n", "").length);

  window.test = function (s, j) {
    console.log("testing...");

    if (j === undefined)
      j = 3.0;

    let func = window.tree_func[0];
    let func2 = basis_dv; //window.tree_func[1];

    let time1 = 0;
    let time2 = 0;
    let steps = 250, steps2 = 10;

    for (let si = 0; si < steps2; si++) {
      let start_time = time_ms();

      for (let i = 0; i < steps; i++) {
        let r1 = func(s + i*0.0001, j, degree, tst);
      }

      time1 += (time_ms() - start_time);

      start_time = time_ms();
      for (let i = 0; i < steps; i++) {
        let r2 = func2(s + i*0.0001, j, degree, tst, dvn);
      }

      time2 += (time_ms() - start_time);
    }

    time1 = time1.toFixed(2) + "ms";
    time2 = time2.toFixed(2) + "ms";

    console.log(r1, r2, time1, time2);
    //console.log(s, j, degree, tst)
    ;
  }

  let dv_test = "" + tree;

  let dv_test2 = "";
  let ci = 0;
  let set = {"(": 0, ")": 0, "+": 0, "/": 0, "*": 0};
  for (let i = 0; i < dv_test.length; i++, ci++) {
    if (ci > 79 && (dv_test[i] in set)) {
      dv_test2 += "\n";
      ci = 0.0;
    }
    dv_test2 += dv_test[i];
  }
  dv_test = dv_test2;

  //return "let a = function(s, j, n, ks, dv) { return "+dv_test+";}";
  //return dv_test;
}
window.sym = sym;

function splitline(dv_test) {
  let dv_test2 = "";
  let ci = 0;
  let set = {"(": 0, ")": 0, "+": 0, "/": 0, "*": 0};

  for (let i = 0; i < dv_test.length; i++, ci++) {
    if (ci > 79 && (dv_test[i] in set)) {
      dv_test2 += "\n";
      ci = 0.0;
    }
    dv_test2 += dv_test[i];
  }

  return dv_test2;
}

window.splitline = splitline;


//gen_reduce is optional, false
export function gen_basis_code(j, n, klen, gen_reduce) {
  let s = sym("s");
  j = sym("j");
  let ks = sym("ks");

  return basis_sym_general(s, j, n, ks, gen_reduce);
  /*
  let s = sym("s");
  let ks = new Array(klen);

  for (let i=0; i<klen; i++) {
      ks[i] = gen_reduce ? sym("k"+(i+1)) : sym("ks["+i+"]");
  }

  return basis_sym(s, j, n, ks, gen_reduce);*/
}

function make_cache_table(maxknotsize, make_dvs) {
  let basis_caches1 = new Array(12);
  for (let i = 0; i < basis_caches1.length; i++) {
    let arr = new Array(maxknotsize);
    basis_caches1[i] = arr;

    for (let j = 1; j < arr.length; j++) {
      arr[j] = new Array(j);
      if (make_dvs) {
        let arr2 = arr[j];
        for (let k = 0; k < arr2.length; k++) {
          arr2[k] = new Array(5);
        }
      }
    }
  }
  return basis_caches1;
}

export const basis_caches = make_cache_table(256, false);
export const basis_caches_dv = make_cache_table(256, true);
export const DV_JADD = 0.0;


window.load_seven = function () {
  for (let k in basis_json) {
    let k1 = k;

    k = k.split("|")
    if (k.length < 4)
      continue;

    console.log(k);
    if (k[1] === "7") {
      console.log("found!", k);
      let hash = "" + 0 + "|" + 7 + "|" + 2 + "|" + k[3];
      myLocalStorage[hash] = basis_json[k1];

      let ret;
      console.log(hash, eval(basis_json[k1]))
    }
  }
}

window.save_local_storage = function () {
  let ret = JSON.stringify(myLocalStorage);
  let blob = new Blob([ret], {type: "application/binary"});
  let url = URL.createObjectURL(blob);
  console.log(url);

  window.open(url);
  return url;
}

function add_to_table_dv(j, n, klen, dvn, table) {
  let hash = "" + 0 + "|" + n + "|" + 2 + "|" + dvn;
  let s = myLocalStorage[hash]; //get_cache(hash);

  if (s === undefined || s === "undefined") {
    //throw new Error("Eek!");
    let tree = gen_basis_dv_code(j, n, klen, dvn);
    s = optimize(tree)[2];

    console.log("storing basis function. . .");
    //s = "ret = function(s, j, n, ks, dvn) { return " + splitline(""+tree) + "; }";

    myLocalStorage[hash] = s; //store_cache(hash, s);
  }

  //console.log("GENERATED");
  let ret;
  eval(s);

  table[n][2][0][dvn] = ret;

  return ret;
}

let zero = function (a, b, c, d, e) {
  return 0.0;
}

export function get_basis_dv_func(j, n, klen, dvn) {
  if (dvn <= 0) {
    return zero;
  }

  let ret = basis_caches_dv[n][2][0][dvn];

  if (ret === undefined) {
    ret = add_to_table_dv(0, n, klen, dvn, basis_caches_dv);
  }

  return ret;
}

window.get_basis_dv_func = get_basis_dv_func;

export function compiled_basis_dv(s, j, n, ks, dvn) {
  let func = get_basis_dv_func(j, n, ks.length, dvn);
  return func(s, j, n, ks, dvn);
}

export function gen_basis_dv_code(j, degree, klen, dv, gen_reduce) {
  let s = sym("s");
  let n = degree;

  j = sym("j");

  let ks = new Array(klen);
  for (let i = 0; i < klen; i++) {
    //ks[i] = gen_reduce ? sym("k"+(i+1)) : sym("ks["+i+"]");
    //ks[i]
    ks[i] = gen_reduce ? sym("k" + (i + 1)) : sym("ks").index(j);
  }

  ks = sym("ks");
  return basis_dv_sym(s, j, degree, ks, dv, gen_reduce);
}

export function get_basis_func(j, n, klen) {
  let KLEN = 5;

  let ret = basis_caches[n][KLEN][j];

  if (ret === undefined) {
    let hash = "bs:" + n; //+"|"+klen;
    let s = myLocalStorage[hash]; //get_cache(hash);

    if (s === undefined || s === "undefined") {
      console.log("storing basis function. . .");
      let tree = gen_basis_code(j, n, klen);
      s = optimize(tree)[2];

      //s = "ret = function(s, j, n, ks) { return " + splitline(""+tree) + "; }";

      myLocalStorage[hash] = s; //store_cache(hash, s);
    }

    //console.log("GENERATED");
    eval(s);

    basis_caches[n][KLEN][j] = ret;
  }

  return ret;
}

export function compiled_basis(s, j, n, ks) {
  let func = get_basis_func(j, n, ks.length);
  return func(s, j, n, ks);
}

window._sym_eps1 = 0.000000001;
window._sym_eps2 = 0.000001;
window._sym_do_clamping = true;
window._sym_more_symbolic = false;

export function basis_sym(s, j, n, ks, gen_reduce) {
  let klen = ks.length;

  let j1 = j, j2 = j + 1, jn = j + n, jn1 = j + n + 1;

  j1 = _sym_do_clamping ? min(max(j1, 0.0), klen - 1) : j1;
  j2 = _sym_do_clamping ? min(max(j2, 0.0), klen - 1) : j2;
  jn = _sym_do_clamping ? min(max(jn, 0.0), klen - 1) : jn;
  jn1 = _sym_do_clamping ? min(max(jn1, 0.0), klen - 1) : jn1;

//        console.log(j, j1, klen, j2, jn, jn1, klen, n);
  /*
  if (_sym_more_symbolic && n === 1) {
      return sym(j1).func("lin", j2);
  } else if (_sym_more_symbolic && n === 0) {
      return sym(j1).func("step", j2);
  }*/

  if (n === 0) {
    /*
        let r1 = s.binop(j1);
        let r2 = j2.binop(s);
        r1 = r1.mul(r1.func("abs")).mul(0.5);
        r2 = r2.mul(r2.func("abs")).mul(0.5);
        return r1.mul(r2);*/
    /*
    let r1 = s.binop(j1, ">=");
    let r2 = s.binop(j2, "<");
    return r1.binop(r2, "&&");*/

    return sym("(s >= ks[" + j1 + "] && s < ks[" + j2 + "])");
  } else {
    let A = s.sub(ks[j1]); //A = s-ks[j1];
    let div = ks[jn].sub(ks[j1]); //ks[jn] - ks[j1];

    let cancelA = div.binop(0.0, "!=");
    if (_sym_eps1 !== 0.0)
      div = div.add(_sym_eps1);

    //A = div !== 0.0 ? (A / div)*basis(s, j, n-1, ks) : 0.0;

    A = A.mul(basis_sym(s, j, n - 1, ks, gen_reduce)).div(div).mul(cancelA);

    let B = ks[jn1].sub(s);
    div = ks[jn1].sub(ks[j2]);

    let cancelB = div.binop(0.0, "!=");
    if (_sym_eps1 !== 0.0)
      div = div.add(_sym_eps1);

    B = B.mul(basis_sym(s, j + 1, n - 1, ks, gen_reduce)).div(div).mul(cancelB);
    //B = div !== 0.0 ? (B / div)*basis(s, j+1, n-1, ks) : 0.0;

    return A.add(B);
  }
}

export function basis_sym_general(s, j, n, ks, gen_reduce) {
  let j1, j2, jn1, kn2;
  if (_sym_do_clamping) {
    let j1 = j.add(0).func("max", 0.0).func("min", sym("(ks.length-1)"));
    let j2 = j.add(1).func("max", 0.0).func("min", sym("(ks.length-1)"));
    let jn = j.add(n).func("max", 0.0).func("min", sym("(ks.length-1)"));
    let jn1 = j.add(n + 1).func("max", 0.0).func("min", sym("(ks.length-1)"));
  } else {
    j1 = j, j2 = j.add(1), jn = j.add(n), jn1 = j.add(n + 1);
  }

  if (_sym_more_symbolic && n === 1) {
    return sym("lin(" + j1 + "," + j2 + "," + jn1 + ")");// // j1.func("lin", j2);
  } else if (_sym_more_symbolic && n === 0) {
    return j1.func("step", j2);
  }

  if (n === 0) {
    //return sym("(s >= ks["+j1+"] && s < ks["+j2+"])");
    let r1 = s.binop(ks.index(j1), ">=");
    let r2 = s.binop(ks.index(j2), "<");

    return r1.binop(r2, "&&");

    r1 = s.sub(ks.index(j1));
    r2 = ks.index(j2).sub(s);

    //return r1.binop(0.0, ">=").binop((r2.binop(0.0, ">")), "*");

    r1 = s.sub(ks.index(j1));
    r2 = ks.index(j2).sub(s);

    let eps1 = 0.000001;
    r1 = r1.add(eps1);
    r2 = r2.add(eps1);

    r1 = r1.div(r1.func("abs")).mul(0.5).add(0.5 - eps1);
    r2 = r2.div(r2.func("abs")).mul(0.5).add(0.5 + eps1);
    //return r1.mul(r2);
  } else {
    let A = s.sub(ks.index(j1)); //A = s-ks[j1];
    let div = ks.index(jn).sub(ks.index(j1)); //ks[jn] - ks[j1];

    let cancelA = div.binop(0.0, "!=");
    if (_sym_eps1 !== undefined)
      div = div.add(_sym_eps1);

    //A = div !== 0.0 ? (A / div)*basis(s, j, n-1, ks) : 0.0;

    A = A.mul(basis_sym_general(s, j, n - 1, ks, gen_reduce)).div(div).mul(cancelA);

    let B = ks.index(jn1).sub(s);
    div = ks.index(jn1).sub(ks.index(j2));

    let cancelB = div.binop(0.0, "!=");

    if (_sym_eps1 !== undefined)
      div = div.add(_sym_eps1);

    B = B.mul(basis_sym_general(s, j.add(1), n - 1, ks, gen_reduce)).div(div).mul(cancelB);
    //B = div !== 0.0 ? (B / div)*basis(s, j+1, n-1, ks) : 0.0;

    return A.add(B);
  }
}

export function basis_dv_sym(s, j, n, ks, dvn, gen_reduce) {
  if (dvn === 0) {
    return basis_sym_general(s, j, n, ks, gen_reduce);
  }
  let j1, j2, jn, jn1, j3, j4;

  if (_sym_do_clamping) {
    let j1 = j.add(0).func("max", 0.0).func("min", sym("(ks.length-1)"));
    let j2 = j.add(1).func("max", 0.0).func("min", sym("(ks.length-1)"));
    let jn = j.add(n).func("max", 0.0).func("min", sym("(ks.length-1)"));
    let jn1 = j.add(n + 1).func("max", 0.0).func("min", sym("(ks.length-1)"));

    //these are used if n==1
    let j3 = j.add(2).func("max", 0.0).func("min", sym("(ks.length-1)"));
    let j4 = j.add(3).func("max", 0.0).func("min", sym("(ks.length-1)"));
  } else {
    j1 = j, j2 = j.add(1), jn = j.add(n), jn1 = j.add(n + 1);
    j3 = j.add(2), j4 = j.add(3);
  }

  //let j1=j, j2=j+1, jn=j+n, jn1=j+n+1;
  /*
  j1 = min(max(j1, 0.0), klen-1);
  j2 = min(max(j2, 0.0), klen-1);
  jn = min(max(jn, 0.0), klen-1);
  jn1 = min(max(jn1, 0.0), klen-1);
  */

  /*let df = 0.00001;
  let a = basis(s, j, n, ks);
  let b = basis(s+df, j, n, ks);
  return (b-a)/df;*/

  /*
  on factor;
  off period;

  operator bs;

  a := (s-kj1)  / (kjn - kj1);
  b := (kjn1 - s) / (kjn1-kj2);
  f := a*bs(s, j, n-1) + b*bs(s, j+1, n-1);

  df(f, s, 2);
  */

  if (n < 1) {
    return sym(0);
  } else if (n <= 1) {
    let div1 = "(0.000+(ks[" + j3 + "])-(ks[" + j2 + "]))";
    let div2 = "(0.000+(ks[" + j2 + "])-(ks[" + j1 + "]))";
    //div1 = div2 = "1.0";
    let b = "(s >= ks[" + j2 + "] && s < ks[" + j3 + "]) ? (-1.0/" + div1 + ") : 0.0";
    let s = "(s >= ks[" + j1 + "] && s < ks[" + j2 + "]) ? (1.0/" + div2 + ") : (" + b + ")";
    return sym("(" + s + ")");

    let r1 = s.binop(ks.index(j1), ">=").binop(s.binop(ks.index(j2), "<"), "&&");
    let r2 = s.binop(ks.index(j2), ">=").binop(s.binop(ks.index(j3), "<"), "&&");
    let ret = r1.sub(r2);

    //return ret;
    div1 = ks.index(j2).sub(ks.index(j1));
    let div3 = div1.add(div1.binop("0.0", "=="));

    div2 = ks.index(j3).sub(ks.index(j2));
    let div4 = div2.add(div2.binop("0.0", "=="));

    let cancel = div2.binop("0.0", "==").mul(div1.binop("0.0", "=="));

    r1 = sym(1.0).div(div3).mul(div1.binop("0.0", "!="));
    r2 = sym(-1.0).div(div4).mul(div2.binop("0.0", "!="));

    a = s.binop(ks.index(j1), ">=").binop(s.binop(ks.index(j2), "<"), "&&");
    b = s.binop(ks.index(j2), ">=").binop(s.binop(ks.index(j3), "<"), "&&");


    return r1.mul(a).add(r2.mul(b));


    ret = 0.0;
    if (s >= ks[j1] && s < ks[j2])
      ret = 1.0/(ks[j2] - ks[j1]);
    else if (s >= ks[j2] && s < ks[j3])
      ret = -1.0/(ks[j3] - ks[j2]);
  } else {
    let kj1 = ks.index(j1);
    let kj2 = ks.index(j2);
    let kjn = ks.index(jn);
    let kjn1 = ks.index(jn1);

    kjn.add(_sym_eps2)
    if (!_sym_more_symbolic) {
      kj1 = kj1.sub(_sym_eps2);
      kj2 = kj2.sub(_sym_eps2);

      kjn = kjn.add(_sym_eps2);
      kjn1 = kjn1.add(_sym_eps2);
    }

    let div = kj1.sub(kjn).mul(kj2.sub(kjn1));
    let cancel = div.func("abs").binop(0.0001, ">="); //z1.mul(z2).mul(z3);

    if (!_sym_more_symbolic) {
      div = div.add(0.0); //((kj1-kjn)*(kj2-kjn1));
    }

    let ret = (kj1.sub(s).mul(basis_dv_sym(s, j, n - 1, ks, dvn, gen_reduce)).sub(
      basis_dv_sym(s, j, n - 1, ks, dvn - 1, gen_reduce).mul(dvn)));
    ret = ret.mul(kj2.sub(kjn1));

    let ret2 = (kjn1.sub(s).mul(basis_dv_sym(s, j.add(1.0), n - 1, ks, dvn)).sub(
      basis_dv_sym(s, j.add(1.0), n - 1, ks, dvn - 1, gen_reduce).mul(dvn)));
    ret2 = ret2.mul(kj1.sub(kjn));

    ret = ret.sub(ret2).div(div);
    return ret;
    //let ret = ((kj1-s) * basis_dv_sym(s, j, n-1, ks, dvn, gen_reduce) -
    //                 dvn*basis_dv_sym(s, j, n-1, ks, dvn-1, gen_reduce))*(kj2 - kjn1);
    //ret -= ((kjn1 - s) * basis_dv_sym(s, j+1, n-1, ks, dvn) -
    //         dvn*basis_dv_sym(s, j+1, n-1, ks, dvn-1, gen_reduce))*(kj1-kjn);
  }
}

let _jit = [0.529914898565039, 0.36828512651845813, 0.06964468420483172, 0.7305932911112905,
            0.5716458782553673, 0.8704596017487347, 0.4227079786360264, 0.5019868116360158, 0.8813679129816592,
            0.1114522460848093, 0.6895110581535846, 0.6958548363763839, 0.3031193600036204, 0.37011902872473,
            0.2962806692812592, 0.028554908465594053, 0.823489741422236, 0.46635359339416027, 0.32072878000326455,
            0.790815538726747, 0.24832243379205465, 0.4548102973494679, 0.17482145293615758, 0.12876217160373926,
            0.47663668682798743, 0.5577574144117534, 0.44505770644173026, 0.4608486376237124, 0.17487138183787465,
            0.9557673167437315, 0.48691147728823125, 0.21344363503158092, 0.4561011800542474, 0.5500841496977955,
            0.056078286841511726, 0.2025157359894365, 0.3545380241703242, 0.37520054122433066, 0.9240472037345171,
            0.5759296049363911, 0.23126523662358522, 0.8160425815731287, 0.2655198322609067, 0.5174507955089211,
            0.5305957165546715, 0.7498655256349593, 0.16992988483980298, 0.8977103955112398, 0.6693002553656697,
            0.6586289645638317, 0.014608860714361072, 0.46719147730618715, 0.22958142310380936, 0.2482534891460091,
            0.9248246876522899, 0.5719250738620758, 0.8759879691060632, 0.014760041143745184, 0.27814899617806077,
            0.8179157497361302, 0.8425747095607221, 0.5784667218104005, 0.8781018694862723, 0.25768745923414826,
            0.12491370760835707, 0.17019980889745057, 0.6778648062609136, 0.7985234088264406, 0.5552649961318821,
            0.4146097879856825, 0.3286898732185364, 0.3871084579732269, 0.5073949920479208, 0.26263241469860077,
            0.16050022304989398, 0.7419972626958042, 0.10826557059772313, 0.15192136517725885, 0.08435141341760755,
            0.8828735174611211, 0.9579186830669641, 0.4730489938519895, 0.13362190243788064, 0.3206780105829239,
            0.5988038030918688, 0.4641053748782724, 0.8168729823082685, 0.18584533245302737, 0.862093557137996,
            0.5530180907808244, 0.9900481395889074, 0.5014054768253118, 0.5830419992562383, 0.31904217251576483,
            0.285037521738559, 0.25403662770986557, 0.20903456234373152, 0.8835178036242723, 0.8222054259385914,
            0.5918245937209576];
window._jit = _jit;
window._jit_cur = 0;
