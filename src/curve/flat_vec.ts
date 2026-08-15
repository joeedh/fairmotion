/* path.ux's Vector2 arithmetic over plain two-element arrays.

   The scene-side ports work in flat doubles, but they are held to matching the
   graph-side methods bit for bit, and two of path.ux's are not what a fresh
   implementation would write: dot() snaps anything within 1e-11 of +/-1 to
   exactly +/-1, so that an acos() of it cannot come back NaN, and normalize()
   multiplies by the reciprocal of the length -- one division and two
   multiplies, not two divisions -- and gives up below 1e-8 rather than
   dividing.  Both are visible in the output, so both are reproduced here.

   The rest are spelled out for the same reason the ports are: nothing in this
   file allocates, and nothing in it needs a class. */

const DOT_SNAP = 0.00000000001;

export function dot2(ax: number, ay: number, bx: number, by: number): number {
  const ret = ax * bx + ay * by;

  if (ret >= 1.0 - DOT_SNAP && ret <= 1.0 + DOT_SNAP) {
    return 1.0;
  }

  if (ret >= -1.0 - DOT_SNAP && ret <= -1.0 + DOT_SNAP) {
    return -1.0;
  }

  return ret;
}

/* vectorLength(): the square root of dot() with itself, snap included. */
export function len2(v: number[]): number {
  return Math.sqrt(dot2(v[0], v[1], v[0], v[1]));
}

export function dist2(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;

  return Math.sqrt(dx * dx + dy * dy);
}

export function normalize2(v: number[]): number[] {
  const l = len2(v);

  if (l > 0.00000001) {
    const s = 1.0 / l;

    v[0] *= s;
    v[1] *= s;
  }

  return v;
}

export function mul2(v: number[], s: number): number[] {
  v[0] *= s;
  v[1] *= s;

  return v;
}

export function add2(v: number[], b: number[]): number[] {
  v[0] += b[0];
  v[1] += b[1];

  return v;
}

export function negate2(v: number[]): number[] {
  v[0] = -v[0];
  v[1] = -v[1];

  return v;
}
