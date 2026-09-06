#ifndef _OUTLINE_BUFFER_H
#define _OUTLINE_BUFFER_H

/* The C++ side of src/curve/draw/outline_buffer.ts: what the stroker returns.

   Three parallel arrays, appended to and never rewritten -- one byte per
   command, the command's points in command order, and seven ints per outline
   naming its owner, its role, its two half-open ranges and how it is to be
   finished.  The TypeScript file's header explains why it is a command stream
   and not a point list; this one only has to produce the same bytes.

   Same layout means the same numbers, so the growth policy is copied too: 256
   elements, then doubling.  A JS reader is handed `cmdCount`, `ptCount` and
   `count` and the three base pointers, and nothing about the capacities is
   observable -- but keeping them identical means a length mismatch is a real
   disagreement rather than an allocator difference.

   Storage is malloc'd and owned; outline_free() releases it, outline_reset()
   keeps it for the next stroke.  Every appender is infallible in the caller's
   eyes: if a grow fails the buffer sets `oom` and drops writes on the floor,
   which the caller checks once at the end rather than at every point. */

#include <stdint.h>
#include <stdlib.h>
#include <string.h>

enum OutCmd {
  OUT_MOVE = 0,
  OUT_LINE = 1,
  OUT_CUBIC = 2,
};

/* Doubles each command consumes, indexed by OutCmd. */
static const int OUT_CMD_PTS[3] = {2, 2, 6};

/* How the assembler is to realize a finished outline; see OutFinish in the
   TypeScript file for who chooses and why. */
enum OutFinish {
  OUT_FINISH_NONE = 0,
  OUT_FINISH_FILL = 1,
  OUT_FINISH_STROKE = 2,
};

/* src/curve/draw/path_key.ts's PathRole. */
enum PathRole {
  ROLE_ELEMENT = 0,
  ROLE_DOUBLE_STROKE = 1,
  ROLE_JOIN_V1 = 2,
  ROLE_JOIN_V2 = 3,
  ROLE_JOIN_V1_DOUBLE = 4,
  ROLE_JOIN_V2_DOUBLE = 5,
  ROLE_DEBUG_1 = 6,
  ROLE_DEBUG_2 = 7,
  ROLE_DEBUG_3 = 8,
};

#define OUTLINE_I 7

enum {
  OUTLINEI_OWNER = 0,
  OUTLINEI_ROLE = 1,
  OUTLINEI_CMD0 = 2,
  OUTLINEI_CMD1 = 3,
  OUTLINEI_PT0 = 4,
  OUTLINEI_PT1 = 5,
  OUTLINEI_FINISH = 6,
};

struct OutlineBuffer {
  uint8_t *cmds;
  double *pts;
  int32_t *outlines;

  /* Elements, not bytes, in each of the three above. */
  int cmdCap, ptCap, outlineCap;

  int cmdCount, ptCount, count;

  /* The outline begin() opened, or -1.  end() is implicit: opening the next one
     closes it, and so does reading the buffer. */
  int open;

  /* Set once and never cleared by anything but a reset: some allocation failed
     and the contents are incomplete. */
  int oom;
};

static inline int outline_capacity(int have, int need) {
  int cap = have > 0 ? have : 256;

  while (cap < need) {
    cap *= 2;
  }

  return cap;
}

/* Grows `*mem` to hold `need` elements of `size` bytes, zeroing the new tail.
   Returns 0 on failure, leaving what was there alone. */
static int outline_grow(void **mem, int *cap, int need, size_t size) {
  int want = outline_capacity(*cap, need);
  void *next = realloc(*mem, (size_t)want * size);

  if (!next) {
    return 0;
  }

  memset((unsigned char *)next + (size_t)*cap * size, 0, (size_t)(want - *cap) * size);

  *mem = next;
  *cap = want;

  return 1;
}

static inline void outline_init(OutlineBuffer *ob) {
  memset(ob, 0, sizeof(*ob));
  ob->open = -1;
}

static inline void outline_free(OutlineBuffer *ob) {
  free(ob->cmds);
  free(ob->pts);
  free(ob->outlines);
  outline_init(ob);
}

/* Keeps the storage, drops the contents. */
static inline void outline_reset(OutlineBuffer *ob) {
  ob->cmdCount = 0;
  ob->ptCount = 0;
  ob->count = 0;
  ob->open = -1;
  ob->oom = 0;
}

static void outline_close_open(OutlineBuffer *ob) {
  if (ob->open < 0) {
    return;
  }

  int o = ob->open * OUTLINE_I;

  ob->outlines[o + OUTLINEI_CMD1] = ob->cmdCount;
  ob->outlines[o + OUTLINEI_PT1] = ob->ptCount;
  ob->open = -1;
}

static void outline_begin(OutlineBuffer *ob, int owner, int role) {
  outline_close_open(ob);

  if ((ob->count + 1) * OUTLINE_I > ob->outlineCap) {
    if (!outline_grow((void **)&ob->outlines, &ob->outlineCap, (ob->count + 1) * OUTLINE_I,
                      sizeof(int32_t))) {
      ob->oom = 1;
      return;
    }
  }

  int o = ob->count * OUTLINE_I;

  ob->outlines[o + OUTLINEI_OWNER] = owner;
  ob->outlines[o + OUTLINEI_ROLE] = role;
  ob->outlines[o + OUTLINEI_CMD0] = ob->cmdCount;
  ob->outlines[o + OUTLINEI_PT0] = ob->ptCount;
  ob->outlines[o + OUTLINEI_FINISH] = OUT_FINISH_NONE;

  ob->open = ob->count;
  ob->count++;
}

/* Appends the opcode and reserves its points, returning where they go, or -1 if
   there was no room for them. */
static int outline_cmd(OutlineBuffer *ob, int op) {
  if (ob->oom) {
    return -1;
  }

  if (ob->cmdCount + 1 > ob->cmdCap) {
    if (!outline_grow((void **)&ob->cmds, &ob->cmdCap, ob->cmdCount + 1, sizeof(uint8_t))) {
      ob->oom = 1;
      return -1;
    }
  }

  int need = OUT_CMD_PTS[op];

  if (ob->ptCount + need > ob->ptCap) {
    if (!outline_grow((void **)&ob->pts, &ob->ptCap, ob->ptCount + need, sizeof(double))) {
      ob->oom = 1;
      return -1;
    }
  }

  ob->cmds[ob->cmdCount++] = (uint8_t)op;

  int p = ob->ptCount;
  ob->ptCount += need;

  return p;
}

static void outline_move_to(OutlineBuffer *ob, double x, double y) {
  int p = outline_cmd(ob, OUT_MOVE);

  if (p < 0) {
    return;
  }

  ob->pts[p] = x;
  ob->pts[p + 1] = y;
}

static void outline_line_to(OutlineBuffer *ob, double x, double y) {
  int p = outline_cmd(ob, OUT_LINE);

  if (p < 0) {
    return;
  }

  ob->pts[p] = x;
  ob->pts[p + 1] = y;
}

static void outline_cubic_to(OutlineBuffer *ob, double x1, double y1, double x2, double y2,
                             double x3, double y3) {
  int p = outline_cmd(ob, OUT_CUBIC);

  if (p < 0) {
    return;
  }

  ob->pts[p] = x1;
  ob->pts[p + 1] = y1;
  ob->pts[p + 2] = x2;
  ob->pts[p + 3] = y2;
  ob->pts[p + 4] = x3;
  ob->pts[p + 5] = y3;
}

/* How the open outline is to be finished; the default is NONE. */
static inline void outline_set_finish(OutlineBuffer *ob, int finish) {
  if (ob->open < 0) {
    return;
  }

  ob->outlines[ob->open * OUTLINE_I + OUTLINEI_FINISH] = finish;
}

static inline void outline_fill(OutlineBuffer *ob) {
  outline_set_finish(ob, OUT_FINISH_FILL);
}

static inline void outline_stroke(OutlineBuffer *ob) {
  outline_set_finish(ob, OUT_FINISH_STROKE);
}

/* Closes whatever is open and leaves the buffer ready to read. */
static inline void outline_finish(OutlineBuffer *ob) {
  outline_close_open(ob);
}

/* The fields of outline `i`; call outline_finish() first. */
static inline int outline_owner(const OutlineBuffer *ob, int i) {
  return ob->outlines[i * OUTLINE_I + OUTLINEI_OWNER];
}

static inline int outline_role(const OutlineBuffer *ob, int i) {
  return ob->outlines[i * OUTLINE_I + OUTLINEI_ROLE];
}

static inline int outline_finish_of(const OutlineBuffer *ob, int i) {
  return ob->outlines[i * OUTLINE_I + OUTLINEI_FINISH];
}

/* Whether outline `i` emitted anything.  An empty one is not a path the
   assembler should build. */
static inline int outline_empty(const OutlineBuffer *ob, int i) {
  int o = i * OUTLINE_I;
  return ob->outlines[o + OUTLINEI_CMD1] == ob->outlines[o + OUTLINEI_CMD0];
}

#endif /* _OUTLINE_BUFFER_H */
