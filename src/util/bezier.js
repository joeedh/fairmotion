/*
on factor;

procedure bez(a, b);
  a + (b - a)*s;

lin   := bez(k1, k2);
quad  := bez(lin, sub(k2=k3, k1=k2, lin));
cubic := bez(quad, sub(k3=k4, k2=k3, k1=k2, quad));

on fort;

df(quad, s, 2);
df(quad, s);
quad;
int(quad, s);

df(cubic, s, 2);
df(cubic, s);
cubic;
int(cubic, s);

off fort;

fx := sub(k1=x1, k2=x2, k3=x3, k4=x4, cubic);
fy := sub(k1=y1, k2=y2, k3=y3, k4=y4, cubic);
dx1 := df(fx, s);
dy1 := df(fy, s);
dx2 := df(fx, s, 2);
dy2 := df(fy, s, 2);

k := (dx1*dy2 - dy1*dx2) / pow(dx1*dx1 + dy1*dy1, 3.0/2.0);

steps := 3;
ds := 1.0 / steps;

ff := for i:=0:steps-1 sum sub(s=i*ds, k)*ds + sub(s=i*ds, df(k, s))*0.5*ds*ds;
on fort;
ff;
off fort;

*/

export function d2bez3(k1, k2, k3, s) {
  return 2.0 * (k1 - k2 - (k2 - k3))
}

export function dbez3(k1, k2, k3, s) {
  return 2.0*(k1*s-k1-2.0*k2*s+k2+k3*s)
}

export function bez3(k1, k2, k3, s) {
  return ((k1-k2)*s-k1-((k2-k3)*s-k2))*s-((k1-k2)*s-k1);
}

export function ibez3(k1, k2, k3, s) {
  return (-(((2.0 * s - 3.0) * k2 - k3 * s) * s - (s ** 2 - 3.0 * s + 3.0) * k1) * s) / 3.0
}

export function d2bez4(k1, k2, k3, k4, s) {
  return -6.0*(k1*s-k1-3.0*k2*s+2.0*k2+3.0*k3*s-k3-k4*s);
}

export function dbez4(k1, k2, k3, k4, s) {
  return -3.0*(k1*s**2-2.0*k1*s+k1-3.0*k2*s**2+4.0*k2*s-k2+3.0*k3*s**2-2.0*k3*s-k4*s**2);
}

export function bez4(k1, k2, k3, k4, s) {
  return -(((3.0*(s-1.0)*k3-k4*s)*s-3.0*(s-1.0)**2*k2)*s+(s-1.0)**3*k1);
}

export function ibez4(k1, k2, k3, k4, s) {
  return (-(((3.0*s-4.0)*k3-k4*s)*s**2+(s**2-2.0*s+2.0)*(s-2.0)*k1-(3.0*s**2-8.0*s+6.0)*k2*s)*s)/4.0;
}

export function curv4(x1, y1, x2, y2, x3, y3, x4, y4, s) {
  let dx1 = dbez4(x1, x2, x3, x4, s);
  let dy1 = dbez4(y1, y2, y3, y4, s);

  let dx2 = d2bez4(x1, x2, x3, x4, s);
  let dy2 = d2bez4(y1, y2, y3, y4, s);

  return (dx1*dy2 - dy1*dx2) / Math.pow(dx1*dx1 + dy1*dy1, 3.0/2.0);
}

export function dcurv4(x1, y1, x2, y2, x3, y3, x4, y4, s) {
  let df = 0.00001;
  let a = curv4(x1, y1, x2, y2, x3, y3, x4, y4, s-df);
  let b = curv4(x1, y1, x2, y2, x3, y3, x4, y4, s+df);

  return (b - a) / (df*2.0);
}

export function bez_self_isect4(x1, y1, x2, y2, x3, y3, x4, y4) {
  return;
  let steps = 8;
  let s=0, ds = 1.0 / (steps-1);

  for (let i=0; i<steps; i++, s += ds) {
    let ax = bez4(x1, x2, x3, x4, s);
    let ay = bez4(y1, y2, y3, y4, s);

    let s2 = 0.0;
    for (let j=0; j<steps; j++, s2 += ds) {
      if (j === i) continue;


    }
  }
}

export function lenbez4(x1, y1, x2, y2, x3, y3, x4, y4, s1) {
  const steps = 16;
  let ds = s1 / steps, s = 0.0;

  let len = 0.0;
  for (let i=0; i<steps; i++, s += ds) {
    let dk = 0.0;
    let k = curv4(x1, y1, x2, y2, x3, y3, x4, y4, s);
    let dx = dbez4(x1, x2, x3, x4, s);
    let dy = dbez4(y1, y2, y3, y4, s);
    let l = Math.sqrt(dx*dx + dy*dy);

    len += l*ds;
  }

  return len;
}

export function thbez4(x1, y1, x2, y2, x3, y3, x4, y4, s1) {
  let len = 1.0; //lenbez4(x1, y1, x2, y2, x3, y3, x4, y4, 1.0);

  if (s1 === 0.0) {
    return curv4(...arguments)*len;
  }

  const steps = 18;
  let ds = s1 / steps, s = 0.0;
  let lastk = undefined;
  let sum = 0.0;

  s = 0.0;
  for (let i=0; i<steps; i++, s += ds) {
    let dk = 0.0;
    let k = curv4(x1, y1, x2, y2, x3, y3, x4, y4, s);

    k *= len;

    //let dx = dbez4(x1, x2, x3, x4, s);
    //let dy = dbez4(y1, y2, y3, y4, s);

    //let l = 1.0;

    //l = Math.sqrt(dx*dx + dy*dy);

    if (i > 0) {
      //let dx = x-lx;
      //let dy = y-ly;
      //l = Math.sqrt(dx*dx + dy*dy);
    }


    //lx = x;
    //ly = y;

    if (lastk !== undefined) {
      dk = (k - lastk) / ds;
    }

    sum += k*ds;// + 0.5*dk*ds*ds;
    lastk = k;
  }

  return sum;
}
