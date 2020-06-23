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
  let dx2 = dbez4(x1, x2, x3, x4, s);
  let dy2 = dbez4(y1, y2, y3, y4, s);

  return (dx1*dy2 - dy1*dx2) / Math.pow(dx1*dx1 + dy1*dy1, 3.0/2.0);
}

