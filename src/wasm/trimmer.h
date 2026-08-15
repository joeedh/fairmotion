#ifndef _TRIMMER_H
#define _TRIMMER_H

/* The C++ side of src/curve/trimmer.ts: junction geometry over a StrokeScene.

   Where strokes meet at a vertex their outlines overlap, and a stroke drawn
   through the overlap shows a bulge or a crossed corner.  This trims each
   stroke back until they stop crossing, and at a two-segment join replaces the
   trimmed ends with the point where the two outer edges actually cross -- the
   mitre.  Both results go into the trim arrays (trim_view.h), which the stroker
   reads when it walks the group.

   Bisection, not a formula: the overlap test is a segment-vs-segment crossing
   check over the trimmed outlines, and the trim distance that clears it is
   found by eight halvings of a fixed bracket.  That is why this is the part of
   the pipeline most worth having in wasm -- it evaluates the curve some
   hundreds of times per vertex, and it runs for every vertex an edit touches.

   The two predicates out of src/util/mathlib.ts come along, because the trimmer
   is their only caller here and their exact form is load-bearing:
   line_line_cross() answers *true* for the three near-colinear cases before it
   ever looks at the windings, and line_isect() reports colinearity from an
   exactly-zero determinant rather than a tolerance.

   Everything else is spelled out in doubles, with path.ux's Vector2 quirks
   preserved in flat_vec.h.  Where the JS swaps two array *references* to pick
   an outer side, this swaps two pointers into the same scratch -- the swap is
   what decides which tangent gets negated, so it has to be a swap and not a
   copy. */

#include "flat_vec.h"
#include "stroke_scene.h"
#include "stroker_eval.h"
#include "trim_view.h"

#include <math.h>

/* SplineFlags.BREAK_TANGENTS, from src/curve/spline_base.ts. */
#define VERT_BREAK_TANGENTS 2

/* mathlib.ts's feps, and the COLINEAR return of line_isect(). */
#define MATH_FEPS 2.22e-16
#define ISECT_COLINEAR 1

/* `if (x)` on a JS number: zero, -0 and NaN are all false. */
static inline bool js_truthy(double x) {
  return x != 0.0 && !isnan(x);
}

/* --- the two predicates from mathlib.ts ----------------------------------- */

static inline bool winding2(const double *a, const double *b, const double *c) {
  double dx1 = a[0] - b[0];
  double dy1 = a[1] - b[1];

  double dx2 = c[0] - b[0];
  double dy2 = c[1] - b[1];

  double r = dx1 * dy2 - dy1 * dx2;
  return r >= 0.0;
}

/* vdist() over the two components a Vector2 carries -- which is what
   line_line_cross4() gives it, having loaded four Coords into Vector2s. */
static inline double vdist2(const double *a, const double *b) {
  double dx = a[0] - b[0];
  double dy = a[1] - b[1];

  return sqrt(dx * dx + dy * dy);
}

/* line_line_cross4(): do the segments a1->a2 and b1->b2 cross?  The four
   distance tests come first and answer true, so a point sitting on the other
   segment counts as a crossing however the windings come out. */
static bool line_line_cross4(const double *a1, const double *a2, const double *b1,
                             const double *b2) {
  double limit = MATH_FEPS * 1000.0;

  if (fabs(vdist2(a1, b1) + vdist2(a2, b1) - vdist2(a1, a2)) < limit) {
    return true;
  }
  if (fabs(vdist2(a1, b2) + vdist2(a2, b2) - vdist2(a1, a2)) < limit) {
    return true;
  }
  if (fabs(vdist2(b1, a1) + vdist2(b2, a1) - vdist2(b1, b2)) < limit) {
    return true;
  }
  if (fabs(vdist2(b1, a2) + vdist2(b2, a2) - vdist2(b1, b2)) < limit) {
    return true;
  }

  bool ok = winding2(a1, a2, b1) != winding2(a1, a2, b2);
  ok = ok && winding2(b1, b2, a1) != winding2(b1, b2, a2);

  return ok;
}

/* line_isect(), 2D branch, without the parameter: writes the crossing point to
   `out` and returns ISECT_COLINEAR when there is none.  `div === 0.0` exactly,
   as in the JS -- a tolerance here would change which joins get a mitre. */
static int line_isect2(const double *v1, const double *v2, const double *v3, const double *v4,
                       double *out) {
  double div = (v2[0] - v1[0]) * (v4[1] - v3[1]) - (v2[1] - v1[1]) * (v4[0] - v3[0]);

  if (div == 0.0) {
    out[0] = out[1] = 0.0;
    return ISECT_COLINEAR;
  }

  double d12 = v1[0] * v2[1] - v1[1] * v2[0];
  double d34 = v3[0] * v4[1] - v3[1] * v4[0];

  out[0] = ((v3[0] - v4[0]) * d12 - (v1[0] - v2[0]) * d34) / div;
  out[1] = ((v3[1] - v4[1]) * d12 - (v1[1] - v2[1]) * d34) / div;

  return 0;
}

/* --- scratch -------------------------------------------------------------- */

/* One list per function: trim_vertex() still holds its order while
   trim_points() sorts again.  Sized for any valence a scene can hold; the JS
   arrays grow instead. */
#define TRIM_MAX_VALENCE 256

static int vsorted[TRIM_MAX_VALENCE];
static int psorted[TRIM_MAX_VALENCE];

static double p1a[2], p1b[2], p2a[2], p2b[2];

static double trim_pts[6][2];
static double trim_dvs[6][2];
static double evalscratch[2];

/* --- the pass ------------------------------------------------------------- */

static inline int trim_slot_of(const StrokeScene *scene, int seg) {
  return scene->segi[seg * SEG_I + SEGI_TRIM];
}

static inline bool is_v1(const StrokeScene *scene, int seg, int v) {
  return scene->segi[seg * SEG_I + SEGI_V1] == v;
}

/* Every stroke pulled back the same distance, in arc length rather than
   parameter, so a short segment is not trimmed away entirely. */
static void set_segments(const StrokeScene *scene, TrimView *trims, const int *segs, int n, int v,
                         double seglen, double s) {
  for (int i = 0; i < n; i++) {
    int seg = segs[i];
    int tslot = trim_slot_of(scene, seg);
    bool v1 = is_v1(scene, seg, v);

    double s2 = (s * seglen) / seg_length(scene, seg);
    s2 = s2 < 0.0 ? 0.0 : (s2 > 1.0 ? 1.0 : s2);

    trim_sets(trims, tslot, v1, 0, v1 ? s2 : 1.0 - s2);
    trim_sets(trims, tslot, v1, 1, v1 ? s2 : 1.0 - s2);
  }
}

/* Does any stroke's cut end still cross another's? */
static bool test_isect(const StrokeScene *scene, const TrimView *trims, const int *segs, int n,
                       int v) {
  for (int i = 0; i < n; i++) {
    int seg1 = segs[i];
    double s1 = trim_gets(trims, trim_slot_of(scene, seg1), is_v1(scene, seg1, v), 0);

    for (int j = 0; j < n; j++) {
      int seg2 = segs[j];

      if (seg1 == seg2) {
        continue;
      }

      double s2 = trim_gets(trims, trim_slot_of(scene, seg2), is_v1(scene, seg2, v), 0);

      for (int k = 0; k < 8; k++) {
        int side1 = k % 2;
        int side2 = k / 2;

        scene_evaluate(scene, seg1, s1, p1a);
        scene_eval_side(scene, seg1, s1, side1, p1b, 0, 0, 0);

        scene_evaluate(scene, seg2, s2, p2a);
        scene_eval_side(scene, seg2, s2, side2, p2b, 0, 0, 0);

        if (line_line_cross4(p1a, p1b, p2a, p2b)) {
          return true;
        }
      }
    }
  }

  return false;
}

/* Where the two outer edges cross, floored to whole units as the original did;
   colinear edges fall back to the vertex itself. */
static void set_isect(const StrokeScene *scene, TrimView *trims, int tseg, bool v1, int side, int v,
                      const double *a1, const double *a2, const double *b1, const double *b2) {
  double isect[2];

  if (line_isect2(a1, a2, b1, b2, isect) == ISECT_COLINEAR) {
    int o = v * VERT_F;

    trim_setp(trims, tseg, v1, side, scene->vertf[o + VERTF_X], scene->vertf[o + VERTF_Y]);
    return;
  }

  trim_setp(trims, tseg, v1, side, floor(isect[0]), floor(isect[1]));
}

/* Sets the explicit mitre points at `v` for the two-segment case: where the two
   strokes' outer edges actually cross.  Higher valences fall through to the
   plain trim trim_vertex() just set. */
static void trim_points(const StrokeScene *scene, TrimView *trims, int v) {
  int vo = v * VERT_I;
  int valence = scene->verti[vo + VERTI_VALENCE];

  if (valence == 2 && !(scene->verti[vo + VERTI_FLAG] & VERT_BREAK_TANGENTS)) {
    return;
  }

  if (valence > TRIM_MAX_VALENCE) {
    return;
  }

  int *segs = psorted;
  int n = scene_sort_segments(scene, v, segs);

  for (int si = 0; si < n; si++) {
    int seg = segs[si];
    int prev = segs[(si + n - 1) % n];
    int next = segs[(si + 1) % n];

    int tseg = trim_slot_of(scene, seg);
    int tprev = trim_slot_of(scene, prev);
    int tnext = trim_slot_of(scene, next);

    bool f0 = is_v1(scene, prev, v);
    bool f1 = is_v1(scene, seg, v);
    bool f2 = is_v1(scene, next, v);

    double s0a = trim_gets(trims, tprev, f0, 0);
    double s0b = trim_gets(trims, tprev, f0, 1);

    double s1a = trim_gets(trims, tseg, f1, 0);
    double s1b = trim_gets(trims, tseg, f1, 1);

    double s2a = trim_gets(trims, tnext, f2, 0);
    double s2b = trim_gets(trims, tnext, f2, 1);

    /* Both sides of all three segments, as points and boundary tangents. */
    double *pa = trim_pts[0], *pb = trim_pts[1];
    double *sa = trim_pts[2], *sb = trim_pts[3];
    double *na = trim_pts[4], *nb = trim_pts[5];

    double *d0a = trim_dvs[0], *d0b = trim_dvs[1];
    double *d1a = trim_dvs[2], *d1b = trim_dvs[3];
    double *d2a = trim_dvs[4], *d2b = trim_dvs[5];

    scene_eval_side(scene, prev, s0b, 1, pa, d0a, 0, 0);
    scene_eval_side(scene, prev, s0a, 0, pb, d0b, 0, 0);

    scene_eval_side(scene, seg, s1a, 0, sa, d1a, 0, 0);
    scene_eval_side(scene, seg, s1b, 1, sb, d1b, 0, 0);

    scene_eval_side(scene, next, s2b, 1, na, d2a, 0, 0);
    scene_eval_side(scene, next, s2a, 0, nb, d2b, 0, 0);

    /* Which side is "outer" flips with the direction the segment leaves `v`. */
    if (f0) {
      double *t = pa;
      pa = pb;
      pb = t;
      t = d0a;
      d0a = d0b;
      d0b = t;
      negate2(d0a);
      negate2(d0b);
    }
    if (f1) {
      double *t = sa;
      sa = sb;
      sb = t;
      t = d1a;
      d1a = d1b;
      d1b = t;
      negate2(d1a);
      negate2(d1b);
    }
    if (f2) {
      double *t = na;
      na = nb;
      nb = t;
      t = d2a;
      d2a = d2b;
      d2b = t;
      negate2(d2a);
      negate2(d2b);
    }

    if (isnan(dot2(sa[0], sa[1], sa[0], sa[1]))) {
      continue;
    }

    /* Evaluated for its side effects: this refreshes the segment's arc length,
       which its neighbours' widths are read against. */
    scene_evaluate(scene, seg, s1a, evalscratch);

    if (n != 2) {
      trim_clearp(trims, tseg, f1, 0);
      trim_clearp(trims, tseg, f1, 1);
      continue;
    }

    /* A shallow join needs no mitre -- the outer edges barely diverge, and the
       crossing point runs off to infinity. */
    normalize2(d0b);
    normalize2(d1b);
    bool doIsect1 = fabs(acos(dot2(d0b[0], d0b[1], d1b[0], d1b[1]))) > M_PI * 0.3;

    normalize2(d0a);
    normalize2(d1a);
    bool doIsect2 = fabs(acos(dot2(d0a[0], d0a[1], d1a[0], d1a[1]))) > M_PI * 0.3;

    doIsect1 = doIsect1 && doIsect2;
    doIsect2 = doIsect1;

    /* The tangents become second points on their lines. */
    add2(d0a, pa);
    add2(d0b, pb);
    add2(d1a, sa);
    add2(d1b, sb);
    add2(d2a, na);
    add2(d2b, nb);

    if (doIsect1) {
      set_isect(scene, trims, tseg, f1, 1, v, pb, d0b, sb, d1b);
    } else {
      trim_clearp(trims, tseg, f1, 1);
      trim_sets(trims, tseg, f1, 1, f1 ? 0.0 : 1.0);
    }

    if (doIsect2) {
      set_isect(scene, trims, tseg, f1, 0, v, pa, d0a, sa, d1a);
    } else {
      trim_clearp(trims, tseg, f1, 0);
      trim_sets(trims, tseg, f1, 0, f1 ? 0.0 : 1.0);
    }
  }
}

/* Trims every stroke meeting at vertex slot `v` back far enough that none of
   them overlaps another, then sets the mitre points.  The caller decides
   whether joins are wanted at all (FANCY_JOINS) and whether `v` needs redoing. */
static void trim_vertex(const StrokeScene *scene, TrimView *trims, int v) {
  int vo = v * VERT_I;
  int valence = scene->verti[vo + VERTI_VALENCE];

  if (valence == 0) {
    return;
  }

  int off = scene->vsegOff[v];

  if (!((scene->verti[vo + VERTI_FLAG] & VERT_BREAK_TANGENTS) || valence > 2)) {
    for (int i = 0; i < valence; i++) {
      int seg = scene->vsegs[off + i];
      int tslot = trim_slot_of(scene, seg);
      bool v1 = is_v1(scene, seg, v);

      trim_sets(trims, tslot, v1, 0, v1 ? 0.0 : 1.0);
      trim_sets(trims, tslot, v1, 1, v1 ? 0.0 : 1.0);
    }

    return;
  }

  if (valence > TRIM_MAX_VALENCE) {
    return;
  }

  int *segs = vsorted;
  int n = scene_sort_segments(scene, v, segs);

  double seglen = 0.0;

  for (int i = 0; i < n; i++) {
    seglen += seg_length(scene, segs[i]);
  }

  seglen /= n;

  double a = 0.0;
  double b = 0.65;

  for (int i = 0; i < 8; i++) {
    double s = (a + b) * 0.5;

    set_segments(scene, trims, segs, n, v, seglen, s);

    if (test_isect(scene, trims, segs, n, v)) {
      a = (a + b) * 0.5;
    } else {
      b = (a + b) * 0.5;
    }
  }

  double s = (a + b) * 0.5;
  s = s < 0.0 ? 0.0 : (s > 1.0 ? 1.0 : s);

  set_segments(scene, trims, segs, n, v, seglen, s);

  /* Then a little further, by the strokes' own widths: the crossing test walks
     centre lines, and a wide stroke overlaps well before those meet. */
  double w = 0.0;
  double tot = 0.0;

  for (int i = 0; i < n; i++) {
    int seg = segs[i];
    double s1 = trim_gets(trims, trim_slot_of(scene, seg), is_v1(scene, seg, v), 0);
    double w2 = scene_width(scene, seg, s1, 0);

    w += w2 * 0.1 + scene->segf[seg * SEG_F + SEGF_LINEWIDTH2] * 1.0;
    tot++;
  }

  /* `if (tot && w && seglen)` in the JS, and NaN is falsy there: a width that
     came back NaN skips the widening rather than poisoning the trim. */
  if (js_truthy(tot) && js_truthy(w) && js_truthy(seglen)) {
    w /= tot;

    s += w / seglen;
    s = s < 0.0 ? 0.0 : (s > 0.5 ? 0.5 : s);

    set_segments(scene, trims, segs, n, v, seglen, s);
  }

  trim_points(scene, trims, v);
}

#endif /* _TRIMMER_H */
