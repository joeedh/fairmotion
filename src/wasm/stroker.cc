/* The stroker's entry point: what the drawer calls when config.USE_WASM is on.

   Everything below this file is header-only and shared with the native parity
   harness (src/wasm/tests/), which is the point -- the code the app runs is the
   code src/wasm/tests/outline_ref.cc checks against a recording of the JS
   stroker.  This file adds only the boundary: how a scene that lives in the JS
   heap is described to C++, and how the outlines come back.

   Three entry points, matching the three the drawer uses -- trimVertex(),
   strokeGroup() and strokeJoin().  Not stroke_all(): the drawer interleaves
   them with its own dirty checks and its own retained paths, and calling it
   would throw that away.  See docs/plans/draw-refactor-plan-final-notes.md stage 6f.

   How the scene crosses.  It does not: the flat arrays are allocated out of the
   wasm heap by src/curve/heap_arrays.ts and JS writes into them through typed
   array views, so C++ already has them at the addresses they were made at.
   What crosses is the *description* -- the pointers and counts -- as one int32
   block JS fills through a single view.  Pointers are 32 bits in wasm32, so
   addresses and counts share an array without a struct layout to agree on.

   Why the block is re-read on every call rather than cached at bind time: the
   scene's arrays are reallocated when the document grows past their capacity,
   and a cached pointer would then be one document behind.  Eighteen int loads
   per call is not a cost worth a class of stale-pointer bug.

   The outline buffer is owned here and not by JS, because only this side knows
   how much geometry a stroke produced.  After every call the base pointers and
   counts are written into the out block, and JS re-views onto them; nothing is
   copied in either direction. */

#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#include "outline_buffer.h"
#include "stroke_scene.h"
#include "stroker.h"
#include "trim_view.h"
#include "trimmer.h"

/* Fields of the bind block, in the order src/curve/stroke_wasm.ts writes them.
   Bumped whenever this list changes, and checked from there. */
#define STROKER_ABI 1

enum {
  BIND_VERT_MAX = 0,
  BIND_SEG_MAX,
  BIND_GROUP_COUNT,
  BIND_GROUP_SEG_COUNT,
  BIND_VSEG_COUNT,
  BIND_TRIM_SLOTS,

  BIND_VERTF,
  BIND_VERTI,
  BIND_SEGF,
  BIND_SEGI,
  BIND_NET_SEG,
  BIND_NET_V1,
  BIND_GROUPS,
  BIND_GROUP_SEGS,
  BIND_VSEG_OFF,
  BIND_VSEGS,

  BIND_TRIM_DATA,
  BIND_TRIM_MASK,

  BIND_N,
};

/* Fields of the out block, written after every stroke call. */
enum {
  OUT_CMDS = 0,
  OUT_PTS,
  OUT_OUTLINES,
  OUT_CMD_COUNT,
  OUT_PT_COUNT,
  OUT_COUNT,
  OUT_OOM,

  OUT_N,
};

static const int32_t *bind_block = NULL;
static int32_t *out_block = NULL;

static OutlineBuffer stroker_out;
static int stroker_out_ready = 0;

static int32_t *ptr32(const int32_t *b, int field) {
  return (int32_t *)(uintptr_t)(uint32_t)b[field];
}

static double *ptr64(const int32_t *b, int field) {
  return (double *)(uintptr_t)(uint32_t)b[field];
}

/* Rebuilds the two views from the bind block.  `scene` is filled rather than
   loaded: it owns nothing, so scene_free() must never see it, and ksScattered
   says the coefficients are wherever SEGI_KSPTR points (see scene_ks). */
static int stroker_read(StrokeScene *scene, TrimView *trims) {
  const int32_t *b = bind_block;

  if (!b) {
    return 0;
  }

  memset(scene, 0, sizeof(*scene));

  scene->vertMax = b[BIND_VERT_MAX];
  scene->segMax = b[BIND_SEG_MAX];
  scene->groupCount = b[BIND_GROUP_COUNT];
  scene->groupSegCount = b[BIND_GROUP_SEG_COUNT];
  scene->vsegCount = b[BIND_VSEG_COUNT];
  scene->trimSlots = b[BIND_TRIM_SLOTS];
  scene->ksScattered = 1;

  scene->vertf = ptr64(b, BIND_VERTF);
  scene->verti = ptr32(b, BIND_VERTI);
  scene->segf = ptr64(b, BIND_SEGF);
  scene->segi = ptr32(b, BIND_SEGI);
  scene->netSeg = ptr32(b, BIND_NET_SEG);
  scene->netV1 = (const uint8_t *)(uintptr_t)(uint32_t)b[BIND_NET_V1];
  scene->groups = ptr32(b, BIND_GROUPS);
  scene->groupSegs = ptr32(b, BIND_GROUP_SEGS);
  scene->vsegOff = ptr32(b, BIND_VSEG_OFF);
  scene->vsegs = ptr32(b, BIND_VSEGS);

  trims->data = ptr64(b, BIND_TRIM_DATA);
  trims->mask = (uint8_t *)(uintptr_t)(uint32_t)b[BIND_TRIM_MASK];
  trims->slots = b[BIND_TRIM_SLOTS];

  return scene->vertf && scene->verti && scene->segf && scene->segi && trims->data;
}

/* The outline buffer as JS is to see it, after a stroke has filled it. */
static void stroker_publish(void) {
  if (!out_block) {
    return;
  }

  out_block[OUT_CMDS] = (int32_t)(uintptr_t)stroker_out.cmds;
  out_block[OUT_PTS] = (int32_t)(uintptr_t)stroker_out.pts;
  out_block[OUT_OUTLINES] = (int32_t)(uintptr_t)stroker_out.outlines;
  out_block[OUT_CMD_COUNT] = stroker_out.cmdCount;
  out_block[OUT_PT_COUNT] = stroker_out.ptCount;
  out_block[OUT_COUNT] = stroker_out.count;
  out_block[OUT_OOM] = stroker_out.oom;
}

extern "C" {

/* The three numbers src/curve/stroke_wasm.ts checks its own constants against,
   so a block that has grown on one side and not the other is caught at load
   rather than as corrupt geometry. */
int fmStrokerAbi(int which) {
  switch (which) {
    case 0:
      return STROKER_ABI;
    case 1:
      return BIND_N;
    case 2:
      return OUT_N;
    default:
      return -1;
  }
}

void fmStrokerBind(int bindPtr, int outPtr) {
  bind_block = (const int32_t *)(uintptr_t)(uint32_t)bindPtr;
  out_block = (int32_t *)(uintptr_t)(uint32_t)outPtr;

  if (!stroker_out_ready) {
    outline_init(&stroker_out);
    stroker_out_ready = 1;
  }
}

/* trimmer.trimVertex().  Writes the trim view and returns nothing; the drawer
   reads what it left through the same memory. */
void fmTrimVertex(int v) {
  StrokeScene scene;
  TrimView trims;

  if (!stroker_read(&scene, &trims)) {
    return;
  }

  trim_vertex(&scene, &trims, v);
}

/* stroker.strokeGroup() and stroker.strokeJoin(), each into the shared buffer.
   Reset per call because the drawer takes one group's outlines at a time and
   builds its retained paths from them before asking for the next. */
void fmStrokeGroup(int gi, int debug) {
  StrokeScene scene;
  TrimView trims;

  outline_reset(&stroker_out);

  if (stroker_read(&scene, &trims)) {
    stroke_group(&scene, &trims, gi, debug != 0, &stroker_out);
    outline_finish(&stroker_out);
  }

  stroker_publish();
}

void fmStrokeJoin(int seg, int v) {
  StrokeScene scene;
  TrimView trims;

  outline_reset(&stroker_out);

  if (stroker_read(&scene, &trims)) {
    stroke_join(&scene, &trims, seg, v, &stroker_out);
    outline_finish(&stroker_out);
  }

  stroker_publish();
}
}
