#ifndef _STROKER_H
#define _STROKER_H

/* The C++ side of src/curve/stroker.ts: a StrokeScene in, an OutlineBuffer out.

   No Spline, no VectorDraw, no DOM -- the boundary stage 4 of the draw refactor
   exists to create, and this is the implementation that fits it.  See
   docs/plans/draw-refactor-plan-final-notes.md stage 6.

   Two outlines per group, and the difference between them is why this is not a
   point list.  The stroke's own path and the double-stroke path walk identical
   geometry but break it differently: where a tangent break makes the stroke draw
   a straight line across, the double stroke lifts the pen instead.  So each
   point is recorded once, with the opcode each path wants, and the two command
   streams are flushed from one traversal.  That staging is also what keeps the
   geometry evaluated exactly once, in the order the original evaluated it --
   load-bearing, because evaluating a segment rewrites its arc length and its
   neighbours' width nets read that.

   A header and not a .cc because everything else in this port is one and the
   native harness compiles a single translation unit per test; the .cc the plan
   names is the emscripten entry point, which needs an SDK this machine does not
   have.  Nothing here is inline-worthy, so the file is deliberately `static`
   throughout and included exactly once.

   Port notes.  The scratch vectors are file-scope statics because they are
   module-level in the JS and their contents survive between calls -- `p2` in
   particular is read after a branch that may not have written it, and reproducing
   that means reproducing where it lives.  The two Bezier helpers come along from
   src/util/bezier.ts rather than being rewritten: they are only ever called at
   s = 0, 0.5 and 1, so `s ** 2` and `s * s` cannot differ, but the coefficient
   grouping can and does. */

#include "flat_vec.h"
#include "outline_buffer.h"
#include "stroke_scene.h"
#include "stroker_eval.h"
#include "trim_view.h"
#include "trimmer.h"

#include <math.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

/* One recorded point of the walk: where it is, the two control points a cubic to
   it would use, its scaled tangent (debug only), and the extra point the
   two-valence break case evaluates -- which on a BREAK record instead carries
   the size of the marker that point draws, since it has no second point. */
#define REC_F 10

enum {
  RECF_X = 0,
  RECF_Y = 1,
  RECF_C1X = 2,
  RECF_C1Y = 3,
  RECF_C2X = 4,
  RECF_C2Y = 5,
  RECF_DVSX = 6,
  RECF_DVSY = 7,
  RECF_P2X = 8,
  RECF_P2Y = 9,
};

/* ...and what to do with it: the opcode the stroke path takes, the one the
   double-stroke path takes, an optional second opcode for the double stroke,
   and which branch produced the record. */
#define REC_I 4

enum {
  RECI_OP = 0,
  RECI_OP2A = 1,
  RECI_OP2B = 2,
  RECI_KIND = 3,
};

#define REC_NO_OP 255

enum {
  /* A point on the curve, joined to the last one by a cubic. */
  REC_CURVE = 0,
  /* The break point at a BREAK_TANGENTS vertex. */
  REC_BREAK = 1,
  /* The same point again, where the vertex has exactly two segments and no
     mitre point of its own. */
  REC_BREAK_2 = 2,
};

static double *recf = 0;
static uint8_t *reci = 0;
static int recCap = 0;
static int recCount = 0;
static int rec_oom = 0;

/* Where a record goes when the arrays could not grow: writes land somewhere
   harmless and recCount does not advance, so the flush below is short rather
   than wrong. */
static double rec_spill[REC_F];

/* Scratch shared by one call; the buffer is the only thing that outlives it. */
static double co[2] = {0.0, 0.0};
static double p2[2] = {0.0, 0.0};
static double dv[2] = {0.0, 0.0};
static double dv2[2] = {0.0, 0.0};
static double nor[2] = {0.0, 0.0};
static double lw_dlw[2] = {0.0, 0.0};

static void stroker_free(void) {
  free(recf);
  free(reci);

  recf = 0;
  reci = 0;
  recCap = 0;
  recCount = 0;
}

static double *record(int kind, int op, int op2a, int op2b) {
  if (recCount + 1 > recCap) {
    int cap = recCap > 0 ? recCap : 256;

    while (recCount + 1 > cap) {
      cap *= 2;
    }

    double *f = (double *)calloc((size_t)cap * REC_F, sizeof(double));
    uint8_t *i = (uint8_t *)calloc((size_t)cap * REC_I, 1);

    if (!f || !i) {
      free(f);
      free(i);
      rec_oom = 1;

      memset(rec_spill, 0, sizeof(rec_spill));
      return rec_spill;
    }

    memcpy(f, recf, (size_t)recCap * REC_F * sizeof(double));
    memcpy(i, reci, (size_t)recCap * REC_I);

    free(recf);
    free(reci);

    recf = f;
    reci = i;
    recCap = cap;
  }

  int io = recCount * REC_I;

  reci[io + RECI_OP] = (uint8_t)op;
  reci[io + RECI_OP2A] = (uint8_t)op2a;
  reci[io + RECI_OP2B] = (uint8_t)op2b;
  reci[io + RECI_KIND] = (uint8_t)kind;

  double *fo = recf + (size_t)recCount * REC_F;

  for (int k = 0; k < REC_F; k++) {
    fo[k] = 0.0;
  }

  recCount++;
  return fo;
}

/* --- small scene lookups -------------------------------------------------- */

static inline int seg_v1(const StrokeScene *scene, int seg) {
  return scene->segi[seg * SEG_I + SEGI_V1];
}

static inline int seg_v2(const StrokeScene *scene, int seg) {
  return scene->segi[seg * SEG_I + SEGI_V2];
}

/* The other segment at a two-valence vertex. */
static int other_segment(const StrokeScene *scene, int v, int seg) {
  int off = scene->vsegOff[v];
  int n = scene->verti[v * VERT_I + VERTI_VALENCE];

  for (int i = 0; i < n; i++) {
    int s = scene->vsegs[off + i];

    if (s != seg) {
      return s;
    }
  }

  return NO_SLOT;
}

/* --- flushing ------------------------------------------------------------- */

static void emit(OutlineBuffer *out, int i, int op) {
  const double *fo = recf + (size_t)i * REC_F;

  if (op == OUT_CUBIC) {
    outline_cubic_to(out, fo[RECF_C1X], fo[RECF_C1Y], fo[RECF_C2X], fo[RECF_C2Y], fo[RECF_X],
                     fo[RECF_Y]);
  } else if (op == OUT_MOVE) {
    outline_move_to(out, fo[RECF_X], fo[RECF_Y]);
  } else {
    outline_line_to(out, fo[RECF_X], fo[RECF_Y]);
  }
}

/* Plays the records into the two outlines.  The stroke path takes OP, the
   double stroke takes OP2A and then OP2B where there is one. */
static void flush(int id, OutlineBuffer *out) {
  outline_begin(out, id, ROLE_ELEMENT);

  for (int i = 0; i < recCount; i++) {
    emit(out, i, reci[i * REC_I + RECI_OP]);
  }

  outline_begin(out, id, ROLE_DOUBLE_STROKE);

  for (int i = 0; i < recCount; i++) {
    emit(out, i, reci[i * REC_I + RECI_OP2A]);

    int op2b = reci[i * REC_I + RECI_OP2B];

    if (op2b != REC_NO_OP) {
      emit(out, i, op2b);
    }
  }

  outline_finish(out);
}

static void dpoint(OutlineBuffer *out, double x, double y, double w) {
  w *= 0.5;

  outline_move_to(out, x - w, y - w);
  outline_line_to(out, x - w, y + w);
  outline_line_to(out, x + w, y + w);
  outline_line_to(out, x + w, y - w);
  outline_line_to(out, x - w, y - w);
}

static void dline(OutlineBuffer *out, double x1, double y1, double x2, double y2, double w) {
  double dx = y1 - y2;
  double dy = x2 - x1;

  double l = sqrt(dx * dx + dy * dy);
  l = (0.5 * w) / l;

  dx *= l;
  dy *= l;

  outline_move_to(out, x1 - dx, y1 - dy);
  outline_line_to(out, x2 - dx, y2 - dy);
  outline_line_to(out, x2 + dx, y2 + dy);
  outline_line_to(out, x1 + dx, y1 + dy);
  outline_line_to(out, x1 - dx, y1 - dy);
}

/* The overlays, in the order update_stroke_group() drew them: a marker at every
   point and its tangent into DEBUG_1, and the cubic's control arm into DEBUG_3.
   DEBUG_2 is opened empty because the pass resets it and draws nothing. */
static void flush_debug(int id, OutlineBuffer *out) {
  outline_begin(out, id, ROLE_DEBUG_1);

  for (int i = 0; i < recCount; i++) {
    const double *fo = recf + (size_t)i * REC_F;
    int kind = reci[i * REC_I + RECI_KIND];

    if (kind == REC_BREAK) {
      dpoint(out, fo[RECF_X], fo[RECF_Y], fo[RECF_P2X]);
    } else if (kind == REC_CURVE) {
      double x = fo[RECF_X], y = fo[RECF_Y];
      double dx = fo[RECF_DVSX], dy = fo[RECF_DVSY];

      dline(out, x, y, x + dx, y + dy, 0.5);
      dpoint(out, x + dx, y + dy, 4);
    }
  }

  outline_begin(out, id, ROLE_DEBUG_2);

  outline_begin(out, id, ROLE_DEBUG_3);

  for (int i = 0; i < recCount; i++) {
    const double *fo = recf + (size_t)i * REC_F;
    int kind = reci[i * REC_I + RECI_KIND];

    if (kind == REC_BREAK_2) {
      dpoint(out, fo[RECF_P2X], fo[RECF_P2Y], 15);
    } else if (kind == REC_CURVE && reci[i * REC_I + RECI_OP] == OUT_CUBIC) {
      dline(out, fo[RECF_C1X], fo[RECF_C1Y], fo[RECF_C2X], fo[RECF_C2Y], 0.5);
      dpoint(out, fo[RECF_C1X], fo[RECF_C1Y], 4);
    }
  }

  outline_finish(out);
}

/* --- the walk ------------------------------------------------------------- */

/* Strokes group `gi` of `scene` into `out`, as two outlines keyed by the group's
   id: the stroke and its double stroke.  With `debug` on, two more. */
static void stroke_group(const StrokeScene *scene, TrimView *trims, int gi, bool debug,
                         OutlineBuffer *out) {
  int go = gi * GROUP_I;
  int id = scene->groups[go + GROUPI_ID];
  int seg0 = scene->groups[go + GROUPI_SEG0];
  int seg1 = scene->groups[go + GROUPI_SEG1];
  int total = seg1 - seg0;

  recCount = 0;

  if (total == 0) {
    return;
  }

  /* The end to start from: the vertex the second segment does not share, so the
     walk runs through the group rather than off the front of it. */
  int first0 = scene->groupSegs[seg0];
  int second = total > 1 ? scene->groupSegs[seg0 + 1] : NO_SLOT;

  int v = seg_v1(scene, first0);

  if (second != NO_SLOT) {
    int a = seg_v1(scene, second);
    int b = seg_v2(scene, second);

    if (v == a || v == b) {
      v = seg_v2(scene, first0);
    }
  }

  double lastpx = 0.0, lastpy = 0.0;
  double lastdvx = 0.0, lastdvy = 0.0;
  double lastdvsx = 0.0, lastdvsy = 0.0;
  bool dobreak = false;

  for (int step = 0; step < 2; step++) {
    bool first = true;

    for (int si = 0; si < total; si++) {
      int seg = scene->groupSegs[step ? seg0 + total - si - 1 : seg0 + si];

      if (seg == NO_SLOT) {
        continue;
      }

      int tslot = scene->segi[seg * SEG_I + SEGI_TRIM];
      double seglen = seg_length(scene, seg);
      int steps = seglen > 0.0 ? (int)(seglen / 55.0 + 0.5) : 0;

      steps = steps < 7 ? 7 : (steps > 16 ? 16 : steps);

      bool isv1 = v == seg_v1(scene, seg);
      double dsign = isv1 ? 1.0 : -1.0;
      int side = dsign < 0.0 ? 1 : 0;

      double start = trim_start(trims, tslot, side);
      double end = trim_end(trims, tslot, side);

      double ds = dsign * ((end - start) / steps);
      double s = dsign < 0.0 ? end : start;

      /* Make sure we hit endpoints. */
      bool last = si == total - 1;

      if (last) {
        steps++;
      }

      int vo = v * VERT_I;
      bool usepoint = scene->verti[vo + VERTI_VALENCE] <= 2 &&
                      (scene->verti[vo + VERTI_FLAG] & VERT_BREAK_TANGENTS);

      if (usepoint) {
        int hasp = trim_hasp(trims, tslot, isv1, 1);

        if (hasp) {
          trim_getp(scene, trims, seg, tslot, isv1, 1, co, 0);
          scene_derivative(scene, seg, s, dv);
        } else {
          double s2 = trim_gets(trims, tslot, isv1, side);
          s2 = s2 < 0.0 ? 0.0 : (s2 > 1.0 ? 1.0 : s2);
          scene_eval_side(scene, seg, s2, 1, co, dv, 0, 0);
        }

        dobreak = true;

        double *fo;

        if (first) {
          first = false;

          if (!step) {
            fo = record(REC_BREAK, OUT_MOVE, OUT_MOVE, REC_NO_OP);
          } else {
            fo = record(REC_BREAK, OUT_LINE, OUT_LINE, OUT_MOVE);
          }
        } else {
          fo = record(REC_BREAK, OUT_LINE, OUT_LINE, REC_NO_OP);
        }

        fo[RECF_X] = co[0];
        fo[RECF_Y] = co[1];
        fo[RECF_P2X] = hasp ? 15.0 : 8.0;

        /* The far side of the join, evaluated whether or not anything draws it:
           evaluating a segment refreshes its arc length, and the widths of its
           neighbours are read from that. */
        if (scene->verti[vo + VERTI_VALENCE] == 2 && !hasp) {
          int seg2 = other_segment(scene, v, seg);

          if (seg2 != NO_SLOT) {
            int t2 = scene->segi[seg2 * SEG_I + SEGI_TRIM];
            double s2 = trim_gets(trims, t2, v == seg_v1(scene, seg2), side);
            s2 = s2 < 0.0 ? 0.0 : (s2 > 1.0 ? 1.0 : s2);

            scene_eval_side(scene, seg2, s2, 1, p2, dv2, 0, 0);
          }

          double *fo2 = record(REC_BREAK_2, OUT_LINE, OUT_LINE, REC_NO_OP);

          fo2[RECF_X] = co[0];
          fo2[RECF_Y] = co[1];
          fo2[RECF_P2X] = p2[0];
          fo2[RECF_P2Y] = p2[1];
        }
      }

      /* Now do curve. */
      for (int i = 0; i < steps; i++, s += ds) {
        if (last) {
          if (i == 0) {
            s = dsign > 0.0 ? start : end;
          } else if (i == steps - 1) {
            s = dsign < 0.0 ? start : end;
          }
        }

        scene_eval_side(scene, seg, s, side, co, dv, nor, lw_dlw);

        dv[0] *= dsign;
        dv[1] *= dsign;

        double dfac = ds / 3.0;

        if (side) {
          dfac *= -1;
        }

        double dvsx = dv[0] * dfac;
        double dvsy = dv[1] * dfac;

        lastdvsx = lastdvx * dfac;
        lastdvsy = lastdvy * dfac;

        double *fo;

        if (first) {
          first = false;

          if (!step) {
            fo = record(REC_CURVE, OUT_MOVE, OUT_MOVE, REC_NO_OP);
          } else {
            fo = record(REC_CURVE, OUT_LINE, OUT_MOVE, REC_NO_OP);
          }
        } else if (dobreak) {
          dobreak = false;

          fo = record(REC_CURVE, OUT_LINE, OUT_LINE, REC_NO_OP);

          lastdvsx = lastdvsy = 0.0;
        } else {
          fo = record(REC_CURVE, OUT_CUBIC, OUT_CUBIC, REC_NO_OP);

          fo[RECF_C1X] = lastpx + lastdvsx;
          fo[RECF_C1Y] = lastpy + lastdvsy;
          fo[RECF_C2X] = co[0] - dvsx;
          fo[RECF_C2Y] = co[1] - dvsy;
        }

        fo[RECF_X] = co[0];
        fo[RECF_Y] = co[1];
        fo[RECF_DVSX] = dvsx;
        fo[RECF_DVSY] = dvsy;

        lastdvx = dv[0];
        lastdvy = dv[1];
        lastpx = co[0];
        lastpy = co[1];
      }

      v = scene_other_vert(scene, seg, v);
    }
  }

  flush(id, out);

  if (debug) {
    flush_debug(id, out);
  }
}

/* --- joins ---------------------------------------------------------------- */

/* util/bezier.ts, grouped as it is grouped there -- `3.0 * (s-1)**2 * k2` is
   `(3.0 * (s-1)**2) * k2` and not `(3.0 * (s-1)) * (s-1) * k2`, which are not the
   same double.  `**` becomes a plain product because the only exponents are 2
   and 3 and the only arguments are 0, 0.5 and 1, where both are exact. */
static inline double bez4(double k1, double k2, double k3, double k4, double s) {
  double s1 = s - 1.0;

  return -((((3.0 * s1 * k3 - k4 * s) * s - 3.0 * (s1 * s1) * k2) * s) + (s1 * s1 * s1) * k1);
}

static inline double dbez4(double k1, double k2, double k3, double k4, double s) {
  double s2 = s * s;

  return -3.0 * (k1 * s2 - 2.0 * k1 * s + k1 - 3.0 * k2 * s2 + 4.0 * k2 * s - k2 + 3.0 * k3 * s2 -
                 2.0 * k3 * s - k4 * s2);
}

/* `v`'s segments in angular order, and the six points the join works from. */
static int jsorted[TRIM_MAX_VALENCE];

static double p0[2];
static double j1a[2];
static double j1b[2];
static double dv0[2];
static double dv1a[2];
static double dv1b[2];
static double t1[2];
static double t2[2];

/* Fills the wedge between `seg`'s two stroke sides at vertex slot `v`, so a
   vertex the trimming pulled the strokes back from does not show a gap.

   Two outlines.  The wedge itself is a cubic from the previous segment's
   boundary round to this one's, closed back through the vertex, and filled.  The
   double stroke's cap across it is either a stroke along that same cubic or,
   where the corner is too tight for one to look right, a filled quad -- and
   since that choice is made from the geometry, the outlines carry the finish op
   rather than leaving the assembler to guess. */
static void stroke_join(const StrokeScene *scene, TrimView *trims, int seg, int v,
                        OutlineBuffer *out) {
  if (scene->verti[v * VERT_I + VERTI_VALENCE] > TRIM_MAX_VALENCE) {
    return;
  }

  int n = scene_sort_segments(scene, v, jsorted);
  int si = -1;

  for (int i = 0; i < n; i++) {
    if (jsorted[i] == seg) {
      si = i;
      break;
    }
  }

  int prev = jsorted[(si + n - 1) % n];

  bool atv1 = seg_v1(scene, seg) == v;
  bool prevv1 = seg_v1(scene, prev) == v;

  int side0 = prevv1 ? 0 : 1;
  int side1 = atv1 ? 1 : 0;

  int tprev = scene->segi[prev * SEG_I + SEGI_TRIM];
  int tseg = scene->segi[seg * SEG_I + SEGI_TRIM];

  trim_getp(scene, trims, prev, tprev, prevv1, side0, p0, dv0);
  trim_getp(scene, trims, seg, tseg, atv1, side1, j1a, dv1a);
  /* dv1b goes nowhere, but asking for it is what evaluates the far boundary. */
  trim_getp(scene, trims, seg, tseg, atv1, side1 ^ 1, j1b, dv1b);

  double scl = 0.7;

  mul2(dv0, prevv1 ? scl : -scl);
  mul2(dv1a, atv1 ? scl : -scl);
  mul2(dv1b, atv1 ? scl : -scl);

  double vx = scene->vertf[v * VERT_F + VERTF_X];
  double vy = scene->vertf[v * VERT_F + VERTF_Y];

  /* How far back the trimming took each side, as a fraction of its segment. */
  double lprev = seg_length(scene, prev);
  double lseg = seg_length(scene, seg);

  double scale1 = dist2(vx, vy, p0[0], p0[1]) / (lprev > 0.00001 ? lprev : 0.00001);
  double scale2 = dist2(vx, vy, j1a[0], j1a[1]) / (lseg > 0.00001 ? lseg : 0.00001);

  scale1 /= 1.5;
  scale2 /= 1.5;

  mul2(dv0, -scale1);
  mul2(dv1a, scale2);

  int eid = scene->segi[seg * SEG_I + SEGI_EID];

  outline_begin(out, eid, atv1 ? ROLE_JOIN_V1 : ROLE_JOIN_V2);
  outline_move_to(out, p0[0], p0[1]);
  outline_cubic_to(out, p0[0] + dv0[0], p0[1] + dv0[1], j1a[0] - dv1a[0], j1a[1] - dv1a[1], j1a[0],
                   j1a[1]);
  outline_line_to(out, j1b[0], j1b[1]);
  outline_line_to(out, vx, vy);
  outline_fill(out);

  outline_begin(out, eid, atv1 ? ROLE_JOIN_V1_DOUBLE : ROLE_JOIN_V2_DOUBLE);
  outline_move_to(out, p0[0], p0[1]);

  double lw2 = scene->segf[seg * SEG_F + SEGF_LINEWIDTH2];

  /* No double stroke to cap.  The lone move above stays, and the outline
     finishes as neither a fill nor a stroke, exactly as the path did. */
  if (lw2 == 0.0) {
    return;
  }

  double px = bez4(p0[0], p0[0] + dv0[0], j1a[0] - dv1a[0], j1a[0], 0.5);
  double py = bez4(p0[1], p0[1] + dv0[1], j1a[1] - dv1a[1], j1a[1], 0.5);

  t1[0] = p0[0] - px;
  t1[1] = p0[1] - py;
  t2[0] = j1a[0] - px;
  t2[1] = j1a[1] - py;

  double len1 = len2(t1) + len2(t2);

  normalize2(t1);
  normalize2(t2);

  double th = acos(dot2(t1[0], t1[1], t2[0], t2[1]));

  if (len1 * 0.25 > lw2 || th > M_PI * 0.2) {
    outline_cubic_to(out, p0[0] + dv0[0], p0[1] + dv0[1], j1a[0] - dv1a[0], j1a[1] - dv1a[1],
                     j1a[0], j1a[1]);
    outline_stroke(out);

    return;
  }

  /* Too tight: the cap becomes a quad across the corner, plus the two edges
     leading into it. */
  double dy1 = dbez4(p0[0], p0[0] + dv0[0], j1a[0] - dv1a[0], j1a[0], 0.0);
  double dx1 = -dbez4(p0[1], p0[1] + dv0[1], j1a[1] - dv1a[1], j1a[1], 0.0);
  double dy2 = dbez4(p0[0], p0[0] + dv0[0], j1a[0] - dv1a[0], j1a[0], 1.0);
  double dx2 = -dbez4(p0[1], p0[1] + dv0[1], j1a[1] - dv1a[1], j1a[1], 1.0);

  double l = sqrt(dx1 * dx1 + dy1 * dy1);

  if (l > 0.0) {
    dx1 /= l;
    dy1 /= l;
  }

  l = sqrt(dx2 * dx2 + dy2 * dy2);

  if (l > 0.0) {
    dx2 /= l;
    dy2 /= l;
  }

  dx1 *= lw2 * 0.5;
  dy1 *= lw2 * 0.5;
  dx2 *= lw2 * 0.5;
  dy2 *= lw2 * 0.5;

  outline_move_to(out, p0[0] + dx1, p0[1] + dy1);
  outline_line_to(out, px, py);
  outline_line_to(out, j1a[0] + dx2, j1a[1] + dy2);

  outline_move_to(out, p0[0] + dx1, p0[1] + dy1);
  outline_line_to(out, j1a[0] + dx2, j1a[1] + dy2);
  outline_line_to(out, j1a[0] - dx2, j1a[1] - dy2);
  outline_line_to(out, p0[0] - dx1, p0[1] - dy1);

  outline_fill(out);
}

/* --- the whole pass ------------------------------------------------------- */

/* `stroke(scene) -> outlines`: everything the stroker does to a document, in the
   order the drawer does it -- trim every junction, stroke every group, then fill
   the wedge at each segment of a many-valence vertex.

   Not what a frame does: a frame trims only the vertices an edit touched and
   strokes in drawlist order, interleaved with the faces (§5.8).  The order here
   is the deterministic whole-document one a parity comparison needs -- and order
   is not cosmetic, since evaluating a segment rewrites the arc length its
   neighbours' widths are read against.

   `scene->vertLive` is stroke_dump's sorted copy of scene.vertMap's values, so
   it is already the ascending list strokeAll() builds for itself. */
static void stroke_all(const StrokeScene *scene, TrimView *trims, bool debug, OutlineBuffer *out) {
  for (int i = 0; i < scene->vertLiveCount; i++) {
    trim_vertex(scene, trims, scene->vertLive[i]);
  }

  for (int gi = 0; gi < scene->groupCount; gi++) {
    stroke_group(scene, trims, gi, debug, out);
  }

  for (int i = 0; i < scene->vertLiveCount; i++) {
    int v = scene->vertLive[i];
    int valence = scene->verti[v * VERT_I + VERTI_VALENCE];

    if (valence <= 2) {
      continue;
    }

    int off = scene->vsegOff[v];

    for (int j = 0; j < valence; j++) {
      int seg = scene->vsegs[off + j];

      if (seg != NO_SLOT) {
        stroke_join(scene, trims, seg, v, out);
      }
    }
  }

  outline_finish(out);
}

#endif /* _STROKER_H */
