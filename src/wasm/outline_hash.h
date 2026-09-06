#ifndef _OUTLINE_HASH_H
#define _OUTLINE_HASH_H

/* The C++ side of stroke_dump.ts's hashOutlines(): an OutlineBuffer reduced to
   something two implementations can compare.

   FNV-1a, 32-bit, over little-endian bytes -- `h = 2166136261`, then
   `h = (h ^ byte) * 16777619` per byte.  Each outline hashes its own opcodes and
   then its own coordinates, and the rows fold into a total through a six-int32
   record: owner, role, finish, command count, point count, row hash.  Rows stay
   in emission order, because here the order is part of what the port has to
   reproduce.

   Bytes, not formatted decimals: a coordinate that survived the port unchanged
   hashes the same on both sides, and one that drifted by an ulp does not.  That
   makes the digest the right gate for the outline *structure* and the wrong one
   for its arithmetic -- see src/curve/draw/stroke_eval_ref.ts for why the geometry
   layer is compared by tolerance instead. */

#include "outline_buffer.h"

#include <stdint.h>

static uint32_t fnv1a(const void *bytes, size_t len, uint32_t h) {
  const unsigned char *p = (const unsigned char *)bytes;

  for (size_t i = 0; i < len; i++) {
    h = (h ^ p[i]) * 16777619u;
  }

  return h;
}

#define FNV1A_SEED 2166136261u

struct OutlineRow {
  int32_t owner, role, finish, cmds, pts;
  int32_t hash;
};

/* The fold hashes the record's bytes, so it must have none of its own. */
static_assert(sizeof(OutlineRow) == 6 * 4, "OutlineRow must be six packed int32s");

struct OutlineDigest {
  int count, cmds, pts;
  uint32_t hash;
};

/* Digests `ob`, which must have been finished.  If `rows` is not null it is
   filled with up to `maxRows` per-outline records -- what a mismatch is located
   with, and what the JS digest's `rows` holds. */
static OutlineDigest outline_digest(const OutlineBuffer *ob, OutlineRow *rows, int maxRows) {
  OutlineDigest out;

  out.count = ob->count;
  out.cmds = ob->cmdCount;
  out.pts = ob->ptCount;
  out.hash = FNV1A_SEED;

  for (int i = 0; i < ob->count; i++) {
    int o = i * OUTLINE_I;

    int cmd0 = ob->outlines[o + OUTLINEI_CMD0];
    int cmd1 = ob->outlines[o + OUTLINEI_CMD1];
    int pt0 = ob->outlines[o + OUTLINEI_PT0];
    int pt1 = ob->outlines[o + OUTLINEI_PT1];

    uint32_t h = fnv1a(ob->cmds + cmd0, (size_t)(cmd1 - cmd0), FNV1A_SEED);
    h = fnv1a(ob->pts + pt0, (size_t)(pt1 - pt0) * 8, h);

    OutlineRow row;

    row.owner = outline_owner(ob, i);
    row.role = outline_role(ob, i);
    row.finish = outline_finish_of(ob, i);
    row.cmds = cmd1 - cmd0;
    row.pts = pt1 - pt0;
    row.hash = (int32_t)h;

    if (rows && i < maxRows) {
      rows[i] = row;
    }

    out.hash = fnv1a(&row, 6 * 4, out.hash);
  }

  return out;
}

#endif /* _OUTLINE_HASH_H */
