#ifndef _FLAT_VEC_H
#define _FLAT_VEC_H

/* The C++ side of src/curve/flat_vec.ts: path.ux's Vector2 arithmetic over
   plain pairs of doubles.

   Two of these are not what a fresh implementation would write, and both are
   visible in the output, so both come across as they are: dot() snaps anything
   within 1e-11 of +/-1 to exactly +/-1, so that an acos() of it cannot come
   back NaN, and normalize() multiplies by the reciprocal of the length -- one
   division and two multiplies, not two divisions -- and gives up below 1e-8
   rather than dividing.

   The reciprocal matters: `v * (1/l)` and `v / l` differ in the last bit, and
   the trimmer feeds normalized tangents to an acos() whose result is compared
   against a threshold.  Near the threshold, one bit decides whether a join gets
   a mitre. */

#include <math.h>

#define DOT_SNAP 0.00000000001

static inline double dot2(double ax, double ay, double bx, double by) {
  double ret = ax * bx + ay * by;

  if (ret >= 1.0 - DOT_SNAP && ret <= 1.0 + DOT_SNAP) {
    return 1.0;
  }

  if (ret >= -1.0 - DOT_SNAP && ret <= -1.0 + DOT_SNAP) {
    return -1.0;
  }

  return ret;
}

/* vectorLength(): the square root of dot() with itself, snap included. */
static inline double len2(const double *v) {
  return sqrt(dot2(v[0], v[1], v[0], v[1]));
}

static inline double dist2(double ax, double ay, double bx, double by) {
  double dx = ax - bx;
  double dy = ay - by;

  return sqrt(dx * dx + dy * dy);
}

static inline void normalize2(double *v) {
  double l = len2(v);

  if (l > 0.00000001) {
    double s = 1.0 / l;

    v[0] *= s;
    v[1] *= s;
  }
}

static inline void mul2(double *v, double s) {
  v[0] *= s;
  v[1] *= s;
}

static inline void add2(double *v, const double *b) {
  v[0] += b[0];
  v[1] += b[1];
}

static inline void negate2(double *v) {
  v[0] = -v[0];
  v[1] = -v[1];
}

#endif /* _FLAT_VEC_H */
