#ifndef _STROKE_SCENE_H
#define _STROKE_SCENE_H

/* The C++ side of src/curve/stroke_scene.ts: a whole document's geometry as
   flat arrays, and a reader for the blob src/curve/stroke_dump.ts writes.

   Nothing here knows what a Spline is -- that is the point of the format.  A
   scene arrives as bytes, from the wasm heap in the app or from a file in the
   native test harness, and the stroker reads slot indices out of it.  Field
   order, section order and every constant below are the TypeScript file's;
   they are duplicated rather than generated, so when one moves the other has to
   move with it.  playwright/stroke-artifacts.spec.ts writes blobs and
   src/wasm/tests/eval_ref.cc reads them, which is what keeps the two honest.

   The buffer is taken by value and kept: `ks` is written through as segments
   are evaluated (eval_curve stores the arc length back into it), so a scene
   needs its own mutable copy and cannot point into read-only memory. */

#include <algorithm>
#include <math.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

/* Per-vertex doubles: x, y, z.  Per-vertex ints: eid, flag, valence. */
#define VERT_F 3
#define VERT_I 3

/* Per-segment doubles: w1, w2, shift1, shift2, linewidth, linewidth2.
   Per-segment ints: eid, flag, v1, v2, ks pointer, trim slot. */
#define SEG_F 6
#define SEG_I 6

/* Steps in a width net's walk; see src/curve/width_chain.ts. */
#define NET_STEPS 7

/* Per-group ints: id, first groupSegs index, one past the last. */
#define GROUP_I 3

#define NO_SLOT (-1)

/* SplineFlags.COINCIDENT, from src/curve/spline_base.ts. */
#define SEG_COINCIDENT (1 << 24)

enum {
  VERTF_X = 0,
  VERTF_Y = 1,
  VERTF_Z = 2,
};

enum {
  VERTI_EID = 0,
  VERTI_FLAG = 1,
  VERTI_VALENCE = 2,
};

enum {
  SEGF_W1 = 0,
  SEGF_W2 = 1,
  SEGF_SHIFT1 = 2,
  SEGF_SHIFT2 = 3,
  SEGF_LINEWIDTH = 4,
  SEGF_LINEWIDTH2 = 5,
};

enum {
  SEGI_EID = 0,
  SEGI_FLAG = 1,
  SEGI_V1 = 2,
  SEGI_V2 = 3,
  SEGI_KSPTR = 4,
  SEGI_TRIM = 5,
};

enum {
  GROUPI_ID = 0,
  GROUPI_SEG0 = 1,
  GROUPI_SEG1 = 2,
};

/* "FMSD" little-endian, and the version this reader understands. */
#define SCENE_MAGIC 0x44534d46
#define SCENE_VERSION 1

/* Bit 0 of the header's flag word: the dump was taken with the wasm evaluator
   live, so the coefficients in it are the ones wasm left (see §5.6 of
   docs/plans/draw-refactor.md). */
#define SCENE_FLAG_NATIVE 1

#define SCENE_HEADER_I 16

struct StrokeScene {
  /* The copy every pointer below points into; free() this and nothing else. */
  unsigned char *mem;
  size_t bytes;

  int vertMax, segMax;
  int vertLiveCount, segLiveCount;
  int groupCount, groupSegCount, vsegCount;
  int trimSlots, ksSlots, flags;

  /* Where scene_ks() is to look; see it for the two cases. */
  int ksScattered;

  const int32_t *vertLive, *segLive;

  int32_t *verti, *segi, *netSeg;
  const uint8_t *netV1;
  int32_t *groups, *groupSegs, *vsegOff, *vsegs;

  double *vertf, *segf, *ks;
};

/* Coefficients for one segment slot: sixteen doubles, the block a heap-resident
   `ks` occupies (native_api.checkSegment reserves that much).

   Two layouts, because the two callers store them differently.  A dump packs
   every slot's block into one array and indexes it, which is what the harness
   reads.  The app does not get that choice: checkSegment() relocates each
   segment's `ks` on its own the first time that segment is evaluated, so the
   blocks are scattered across the heap and the only thing that knows where one
   is, is the address the scene recorded in SEGI_KSPTR (§5.3 would make these
   one layout again, and has not been done). */
static inline double *scene_ks(const StrokeScene *scene, int slot) {
  if (scene->ksScattered) {
    return (double *)(uintptr_t)(uint32_t)scene->segi[slot * SEG_I + SEGI_KSPTR];
  }

  return scene->ks + (size_t)slot * scene->ksSlots;
}

static inline void scene_free(StrokeScene *scene) {
  free(scene->mem);
  memset(scene, 0, sizeof(*scene));
}

/* The far end of `seg` from vertex slot `v`. */
static inline int scene_other_vert(const StrokeScene *scene, int seg, int v) {
  int v1 = scene->segi[seg * SEG_I + SEGI_V1];
  return v == v1 ? scene->segi[seg * SEG_I + SEGI_V2] : v1;
}

/* The segments around vertex slot `v`, by the angle they leave it at, into
   `out` (which must hold the vertex's valence).  Returns how many.

   std::stable_sort and not std::sort: the JS is Array#sort, which V8 implements
   with TimSort, and two segments leaving a vertex at the same angle -- a
   coincident pair -- would otherwise come out in a different order here than
   there.  The order decides which segment is `prev` and which is `next` in the
   mitre solve, so it is not cosmetic. */
static int scene_sort_segments(const StrokeScene *scene, int v, int *out) {
  int n = scene->verti[v * VERT_I + VERTI_VALENCE];
  int off = scene->vsegOff[v];

  double vx = scene->vertf[v * VERT_F + VERTF_X];
  double vy = scene->vertf[v * VERT_F + VERTF_Y];

  for (int i = 0; i < n; i++) {
    out[i] = scene->vsegs[off + i];
  }

  const StrokeScene *sc = scene;

  std::stable_sort(out, out + n, [sc, v, vx, vy](int a, int b) {
    int oa = scene_other_vert(sc, a, v) * VERT_F;
    int ob = scene_other_vert(sc, b, v) * VERT_F;

    double a1 = atan2(sc->vertf[oa + VERTF_Y] - vy, sc->vertf[oa + VERTF_X] - vx);
    double a2 = atan2(sc->vertf[ob + VERTF_Y] - vy, sc->vertf[ob + VERTF_X] - vx);

    return a1 - a2 < 0.0;
  });

  return n;
}

/* Fills `scene` from `buf`.  Returns 0, or a message describing why not.  The
   scene keeps its own copy, so `buf` may go away afterwards. */
static const char *scene_load(const void *buf, size_t len, StrokeScene *scene) {
  memset(scene, 0, sizeof(*scene));

  if (len < SCENE_HEADER_I * 4) {
    return "too short to hold a header";
  }

  unsigned char *mem = (unsigned char *)malloc(len);

  if (!mem) {
    return "out of memory";
  }

  memcpy(mem, buf, len);

  const int32_t *h = (const int32_t *)mem;

  if (h[0] != SCENE_MAGIC) {
    free(mem);
    return "not a stroke scene dump";
  }
  if (h[1] != SCENE_VERSION) {
    free(mem);
    return "wrong stroke scene dump version";
  }

  scene->mem = mem;
  scene->bytes = len;

  scene->vertMax = h[2];
  scene->segMax = h[3];
  scene->vertLiveCount = h[4];
  scene->segLiveCount = h[5];
  scene->groupCount = h[6];
  scene->groupSegCount = h[7];
  scene->vsegCount = h[8];
  scene->trimSlots = h[9];
  scene->ksSlots = h[10];
  scene->flags = h[11];

  /* Section offsets, derived from the header exactly as stroke_dump.layout()
     derives them -- same order, same alignment step before the doubles. */
  size_t o = SCENE_HEADER_I * 4;

#define TAKE_I32(field, count)                    \
  scene->field = (int32_t *)(mem + o);            \
  o += (size_t)(count) * 4

  TAKE_I32(vertLive, scene->vertLiveCount);
  TAKE_I32(segLive, scene->segLiveCount);
  TAKE_I32(verti, (size_t)scene->vertMax * VERT_I);
  TAKE_I32(segi, (size_t)scene->segMax * SEG_I);
  TAKE_I32(netSeg, (size_t)scene->segMax * NET_STEPS);
  TAKE_I32(groups, (size_t)scene->groupCount * GROUP_I);
  TAKE_I32(groupSegs, scene->groupSegCount);
  TAKE_I32(vsegOff, scene->vertMax);
  TAKE_I32(vsegs, scene->vsegCount);

#undef TAKE_I32

  scene->netV1 = (const uint8_t *)(mem + o);
  o += (size_t)scene->segMax * NET_STEPS;

  o = (o + 7) & ~(size_t)7;

  scene->vertf = (double *)(mem + o);
  o += (size_t)scene->vertMax * VERT_F * 8;

  scene->segf = (double *)(mem + o);
  o += (size_t)scene->segMax * SEG_F * 8;

  scene->ks = (double *)(mem + o);
  o += (size_t)scene->segMax * scene->ksSlots * 8;

  if (o != len) {
    scene_free(scene);
    return "stroke scene dump is not the length its header implies";
  }

  return 0;
}

#endif /* _STROKE_SCENE_H */
