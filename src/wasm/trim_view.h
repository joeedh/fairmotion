#ifndef _TRIM_VIEW_H
#define _TRIM_VIEW_H

/* The C++ side of src/curve/draw/trim_view.ts: where each of a segment's two stroke
   sides starts and ends, and the mitre points that replace those endpoints at a
   two-valence join.

   Twelve doubles and a mask byte per segment slot, laid out by trim_state.ts:

     0..3    start1, end1, start2, end2
     4,5     mitre point at v1, side 0
     6,7     mitre point at v1, side 1
     8,9     mitre point at v2, side 0
     10,11   mitre point at v2, side 1
     mask    which of those four points are in use (see trim_maskbit)

   The `v1` argument everywhere is the flag TrimState's methods derive from
   `v === seg.v1`: there is no vertex here to compare against, so the caller has
   worked it out already.

   A negative slot is a segment that never went through a TrimState.begin();
   reads answer with the untrimmed defaults it would get when it does, and
   writes are dropped.  That case is reachable from the app, not from the
   harness, where stroke_dump.newTrims() gives every live segment a slot. */

#include "flat_vec.h"
#include "stroke_scene.h"
#include "stroker_eval.h"

#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#define TRIM_STRIDE 12

struct TrimView {
  double *data;
  uint8_t *mask;
  int slots;
};

/* The defaults stroke_dump.newTrims() writes: untrimmed, no mitres. */
static const char *trim_alloc(TrimView *trims, int slots) {
  memset(trims, 0, sizeof(*trims));

  if (slots < 0) {
    return "negative trim slot count";
  }

  trims->data = (double *)calloc((size_t)slots * TRIM_STRIDE + 1, sizeof(double));
  trims->mask = (uint8_t *)calloc((size_t)slots + 1, 1);
  trims->slots = slots;

  if (!trims->data || !trims->mask) {
    return "out of memory";
  }

  for (int i = 0; i < slots; i++) {
    trims->data[i * TRIM_STRIDE + 1] = 1.0;
    trims->data[i * TRIM_STRIDE + 3] = 1.0;
  }

  return 0;
}

static inline void trim_free(TrimView *trims) {
  free(trims->data);
  free(trims->mask);
  memset(trims, 0, sizeof(*trims));
}

static inline double trim_start(const TrimView *trims, int slot, int side) {
  if (slot < 0) {
    return 0.0;
  }

  return trims->data[slot * TRIM_STRIDE + (side ? 2 : 0)];
}

static inline double trim_end(const TrimView *trims, int slot, int side) {
  if (slot < 0) {
    return 1.0;
  }

  return trims->data[slot * TRIM_STRIDE + (side ? 3 : 1)];
}

/* The trim value at one end of the segment. */
static inline double trim_gets(const TrimView *trims, int slot, bool v1, int side) {
  return v1 ? trim_start(trims, slot, side) : trim_end(trims, slot, side);
}

static inline void trim_sets(TrimView *trims, int slot, bool v1, int side, double s) {
  if (slot < 0) {
    return;
  }

  trims->data[slot * TRIM_STRIDE + (v1 ? (side ? 2 : 0) : side ? 3 : 1)] = s;
}

static inline int trim_maskbit(bool v1, int side) {
  if (v1) {
    return side ? 1 : 2;
  }

  return side ? 4 : 8;
}

/* Whether a mitre point is in use at this end and side. */
static inline int trim_hasp(const TrimView *trims, int slot, bool v1, int side) {
  if (slot < 0) {
    return 0;
  }

  return trims->mask[slot] & trim_maskbit(v1, side);
}

static inline int trim_point_off(int slot, bool v1, int side) {
  return slot * TRIM_STRIDE + (v1 ? 4 : 8) + (side ? 2 : 0);
}

static double trim_getp_co[2];

/* The mitre point, or the point on the boundary where there is none.  Note that
   the side is evaluated either way when a tangent was asked for -- the JS does
   the same, and the evaluation has side effects on the segment's arc length. */
static void trim_getp(const StrokeScene *scene, const TrimView *trims, int seg, int slot, bool v1,
                      int side, double *out, double *dv_out) {
  double s = trim_gets(trims, slot, v1, side);

  if (!trim_hasp(trims, slot, v1, side)) {
    scene_eval_side(scene, seg, s, side, out, dv_out, 0, 0);
    return;
  }

  if (dv_out) {
    scene_eval_side(scene, seg, s, side, trim_getp_co, dv_out, 0, 0);
  }

  int o = trim_point_off(slot, v1, side);

  out[0] = trims->data[o];
  out[1] = trims->data[o + 1];
}

static inline void trim_setp(TrimView *trims, int slot, bool v1, int side, double x, double y) {
  if (slot < 0) {
    return;
  }

  trims->mask[slot] |= (uint8_t)trim_maskbit(v1, side);

  int o = trim_point_off(slot, v1, side);

  trims->data[o] = x;
  trims->data[o + 1] = y;
}

static inline void trim_clearp(TrimView *trims, int slot, bool v1, int side) {
  if (slot < 0) {
    return;
  }

  trims->mask[slot] &= (uint8_t)~trim_maskbit(v1, side);
}

#endif /* _TRIM_VIEW_H */
