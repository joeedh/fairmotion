#ifndef _STROKER_EVAL_H
#define _STROKER_EVAL_H

/* The C++ side of src/curve/draw/stroker_eval.ts -- the stroker's geometry over a
   StrokeScene.

   Every function here is the twin of the TypeScript function it is named after,
   and the requirement is the same one that file states about its own twins: the
   expression order is copied, not chosen.  Where an expression looks like it
   could be simplified, it could not -- floating point is not associative, and
   the whole value of this port is that its output can be subtracted from the
   reference implementation's and give zero.

   Two quirks are carried deliberately (§5.7 of docs/plans/draw-refactor-plan-final-notes.md):

   - **The evaluator's endpoints are float, and z is dropped.**  That is what
     wasm_main.cc's evalCurve() wrapper does to them, and the app's JS calls the
     evaluator only through that wrapper, so those are the coordinates every
     recorded number was produced from.
   - **`no_update` is never set.**  native_api.evalCurvePtr() passes six
     arguments to a seven-argument function, so the flag JS calls `angle_only`
     lands in C++'s `angle_only` and C++'s `no_update` is always zero.  Every
     call therefore rewrites ks[KSCALE] -- which is the arc length the width
     nets read, which is why call order is part of the answer.

   The scratch arrays below are file-scope for the same reason they are
   module-scope in the TypeScript: one width net is live at a time, and the
   values that survive between calls are all overwritten before they are read.
   Single-threaded, like the wasm module. */

#include <math.h>

#include "spline.h"
#include "stroke_scene.h"

/* Math.max, including its NaN propagation -- fmax() returns the other operand
   instead, and a degenerate length must stay degenerate on both sides. */
static inline double js_max(double a, double b) {
  if (a != a || b != b) {
    return NAN;
  }

  return a > b ? a : b;
}

/* spline_math_hermite.polytheta_spower at order 4; the macro is spline.h's, and
   the locals are the names it expands to. */
static double spiraltheta(double s, const double *ks) {
  double k1 = ks[0], dv1_k1 = ks[1], dv1_k2 = ks[2], k2 = ks[3];
  double s2 = s * s, s3 = s2 * s;

  return POLYTHETA_BEZ(s);
}

/* spline_math_hermite.polycurvature_spower at order 4. */
static double spiralcurvature(double s, const double *ks) {
  double k1 = ks[0], dv1_k1 = ks[1], dv1_k2 = ks[2], k2 = ks[3];

  return POLYCURVATURE_BEZ(s);
}

/* src/curve/bspline.ts deBoor(), with the knot count passed rather than read
   off the array: the clamp in the first loop is against knots.length, and a
   plain pointer does not carry it. */
static double deBoor(int k, double x, const double *t, const double *c, int p, int knot_count) {
  double d[8];

  for (int j = 0; j < p + 1; j++) {
    int j2 = j + k - p;

    if (j2 < 0) {
      j2 = 0;
    }
    if (j2 > knot_count - 1) {
      j2 = knot_count - 1;
    }

    d[j] = c[j2];
  }

  for (int r = 1; r < p + 1; r++) {
    for (int j = p; j > r - 1; j--) {
      double alpha = (x - t[j + k - p]) / (t[j + 1 + k - r] - t[j + k - p]);

      d[j] = (1.0 - alpha) * d[j - 1] + alpha * d[j];
    }
  }

  return d[p];
}

static double netKnots[8] = {0, 0, 0, 0, 0, 0, 0, 0};
static double netWidths[7] = {0, 0, 0, 0, 0, 0, 0};
static double netShifts[7] = {0, 0, 0, 0, 0, 0, 0};

static double co_tmp[2] = {0, 0};
static double dv_tmp[2] = {0, 0};

static inline int seg_flag(const StrokeScene *scene, int slot) {
  return scene->segi[slot * SEG_I + SEGI_FLAG];
}

static inline double seg_length(const StrokeScene *scene, int slot) {
  return scene_ks(scene, slot)[KSCALE];
}

/* stroker_eval.evalFlat(), through wasm_main.evalCurve()'s marshalling.  `co`
   is left untouched when angle_only is set, exactly as the evaluator leaves it. */
static void eval_flat(const StrokeScene *scene, int slot, double s, bool angle_only, double co[3]) {
  int io = slot * SEG_I;
  int v1 = scene->segi[io + SEGI_V1] * VERT_F;
  int v2 = scene->segi[io + SEGI_V2] * VERT_F;

  float fv1[3], fv2[3];

  fv1[0] = (float)scene->vertf[v1 + VERTF_X];
  fv1[1] = (float)scene->vertf[v1 + VERTF_Y];
  fv1[2] = 0.0f;

  fv2[0] = (float)scene->vertf[v2 + VERTF_X];
  fv2[1] = (float)scene->vertf[v2 + VERTF_Y];
  fv2[2] = 0.0f;

  eval_curve(co, s, fv1, fv2, scene_ks(scene, slot), ORDER, angle_only, false);
}

/* SplineSegment.evaluate() with no_effects, the only mode the port supports. */
static double *scene_evaluate(const StrokeScene *scene, int slot, double s, double out[2]) {
  int io = slot * SEG_I;

  if (scene->segi[io + SEGI_FLAG] & SEG_COINCIDENT) {
    int v1 = scene->segi[io + SEGI_V1] * VERT_F;

    out[0] = scene->vertf[v1 + VERTF_X];
    out[1] = scene->vertf[v1 + VERTF_Y];

    return out;
  }

  /* The nudge is evaluate()'s, verbatim: it keeps s off both ends. */
  s = (s + 0.00000001) * (1.0 - 0.00000002);
  s -= 0.5;

  double co[3];

  eval_flat(scene, slot, s, false, co);

  out[0] = co[0];
  out[1] = co[1];

  return out;
}

/* SplineSegment.derivative(). */
static double *scene_derivative(const StrokeScene *scene, int slot, double s, double out[2]) {
  if (scene->segi[slot * SEG_I + SEGI_FLAG] & SEG_COINCIDENT) {
    out[0] = out[1] = 0.0;
    return out;
  }

  double *ks = scene_ks(scene, slot);
  double co[3];

  eval_flat(scene, slot, 0.5, true, co);

  double th = spiraltheta(s, ks);
  double ang = ks[KANGLE];

  out[0] = sin(th + ang) * ks[KSCALE];
  out[1] = cos(th + ang) * ks[KSCALE];

  return out;
}

/* SplineSegment.curvature(). */
static double scene_curvature(const StrokeScene *scene, int slot, double s) {
  if (scene->segi[slot * SEG_I + SEGI_FLAG] & SEG_COINCIDENT) {
    return 0.0;
  }

  double *ks = scene_ks(scene, slot);
  double co[3];

  eval_flat(scene, slot, 0.5, true, co);

  double k = spiralcurvature(s, ks);

  return k / (0.0000001 + ks[KSCALE]);
}

/* Whether the scene recorded a width net for this segment; a degenerate chain
   has none and the caller must not ask for a width. */
static inline bool scene_has_net(const StrokeScene *scene, int slot) {
  return scene->netSeg[slot * NET_STEPS] != NO_SLOT;
}

static double load_step(const StrokeScene *scene, int i, int oi) {
  int slot = scene->netSeg[i];
  int fo = slot * SEG_F;

  if (oi >= 0) {
    bool v1 = scene->netV1[i] == 1;

    netWidths[oi] = scene->segf[fo + (v1 ? SEGF_W1 : SEGF_W2)] * scene->segf[fo + SEGF_LINEWIDTH];
    netShifts[oi] = scene->segf[fo + (v1 ? SEGF_SHIFT1 : SEGF_SHIFT2)];
  }

  return js_max(seg_length(scene, slot), 0.0001);
}

/* width_chain.loadWidthNet(), in slot terms: the eight-knot window this
   segment's width is a B-spline over.  Returns the span it covers. */
static double load_net(const StrokeScene *scene, int slot) {
  int off = slot * NET_STEPS;
  int fo = slot * SEG_F;

  double l2 = load_step(scene, off, 0);
  double l1 = load_step(scene, off + 1, -1);
  double l0 = load_step(scene, off + 2, -1);

  double l5 = load_step(scene, off + 3, 3);
  double l6 = load_step(scene, off + 4, 4);
  double l7 = load_step(scene, off + 5, 5);
  load_step(scene, off + 6, 6);

  double lw = scene->segf[fo + SEGF_LINEWIDTH];
  double l4 = js_max(seg_length(scene, slot), 0.0001);

  netWidths[1] = scene->segf[fo + SEGF_W1] * lw;
  netShifts[1] = scene->segf[fo + SEGF_SHIFT1];
  netWidths[2] = scene->segf[fo + SEGF_W2] * lw;
  netShifts[2] = scene->segf[fo + SEGF_SHIFT2];

  netKnots[0] = -l0 - l1 - l2;
  netKnots[1] = -l1 - l2;
  netKnots[2] = -l2;
  netKnots[3] = 0;
  netKnots[4] = l4;
  netKnots[5] = l4 + l5;
  netKnots[6] = l4 + l5 + l6;
  netKnots[7] = l4 + l5 + l6 + l7;

  return l4;
}

/* SplineSegment.width(), and its shift out-param. */
static double scene_width(const StrokeScene *scene, int slot, double s, double *out_shift) {
  double span = load_net(scene, slot);
  double ss = s * span;

  if (out_shift) {
    *out_shift = deBoor(3, ss, netKnots, netShifts, 3, 8);
  }

  return deBoor(3, ss, netKnots, netWidths, 3, 8);
}

/* SplineSegment.shift(): width() called for its out-param alone. */
static double scene_shift(const StrokeScene *scene, int slot, double s) {
  double shift = 0.0;

  scene_width(scene, slot, s, &shift);

  return shift;
}

/* The two finite differences, at the same 1e-4 step the methods use. */
static double scene_dwidth(const StrokeScene *scene, int slot, double s) {
  double df = 0.0001;
  double a = scene_width(scene, slot, s - df, 0);
  double b = scene_width(scene, slot, s + df, 0);

  return (b - a) / (2.0 * df);
}

static double scene_dshift(const StrokeScene *scene, int slot, double s) {
  double df = 0.0001;
  double a = scene_shift(scene, slot, s - df);
  double b = scene_shift(scene, slot, s + df);

  return (b - a) / (2.0 * df);
}

/* SplineSegment.evaluateSide(): the point on one stroke boundary, with the
   boundary's derivative, its normal and [width, dwidth] as out-params.  The
   derivation is in the comment above the method in src/curve/types/segment.ts. */
static double *scene_eval_side(const StrokeScene *scene, int slot, double s, int side,
                               double co_out[2], double dv_out[2], double normal_out[2],
                               double lw_dlw_out[2]) {
  int io = slot * SEG_I;

  if (scene->segi[io + SEGI_FLAG] & SEG_COINCIDENT) {
    if (dv_out) {
      dv_out[0] = dv_out[1] = 0.0;
    }
    if (normal_out) {
      normal_out[0] = normal_out[1] = 0.0;
    }
    if (lw_dlw_out) {
      lw_dlw_out[0] = lw_dlw_out[1] = 0.0;
    }

    int v1 = scene->segi[io + SEGI_V1] * VERT_F;

    co_out[0] = scene->vertf[v1 + VERTF_X];
    co_out[1] = scene->vertf[v1 + VERTF_Y];

    return co_out;
  }

  double sidesign = side ? 1.0 : -1.0;

  scene_evaluate(scene, slot, s, co_tmp);

  double *dv = scene_derivative(scene, slot, s, dv_tmp);
  double shift = scene_shift(scene, slot, s) * sidesign;
  double dshift = scene_dshift(scene, slot, s) * sidesign;

  double lw = scene_width(scene, slot, s, 0) * sidesign;
  double dlw = scene_dwidth(scene, slot, s) * sidesign;

  dlw = dlw * shift + dlw + dshift * lw;
  lw = lw + lw * shift;

  double length = seg_length(scene, slot);

  double dx = (-dv[1] * lw * 0.5) / length;
  double dy = (dv[0] * lw * 0.5) / length;

  if (normal_out) {
    normal_out[0] = dx;
    normal_out[1] = dy;
  }

  if (lw_dlw_out) {
    lw_dlw_out[0] = lw;
    lw_dlw_out[1] = dlw;
  }

  if (dv_out) {
    double seglen = length;

    double k = -seglen * scene_curvature(scene, slot, s);
    double dx2 = (-0.5 * (dlw * dv[1] + dv[0] * k * lw - 2 * dv[0] * seglen)) / seglen;
    double dy2 = (0.5 * (dlw * dv[0] - dv[1] * k * lw + 2 * dv[1] * seglen)) / seglen;

    dv_out[0] = dx2;
    dv_out[1] = dy2;
  }

  co_out[0] = co_tmp[0] + dx;
  co_out[1] = co_tmp[1] + dy;

  return co_out;
}

#endif /* _STROKER_EVAL_H */
