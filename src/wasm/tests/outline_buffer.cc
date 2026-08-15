/* The C++ half of a cross-language pin on the outline buffer.

   tests/outline_buffer.test.ts drives the TypeScript OutlineBuffer with the
   same script and asserts the same four numbers.  Neither side reads the
   other's output -- the expectation is written down twice on purpose, so that
   whichever implementation drifts, one of the two tests fails and says so.

   Everything the script feeds the buffer is exact in binary (coordinates are
   eighths), so the digest is byte equality rather than a tolerance.  That is
   the right gate for this layer: it only copies numbers about, and the
   arithmetic that produces them is checked by eval_ref.cc. */

#include "../outline_buffer.h"
#include "../outline_hash.h"

#include <stdio.h>

/* A 31-bit LCG, chosen because Math.imul and a uint32_t multiply agree on it
   exactly.  Keep in step with the TypeScript twin. */
static uint32_t rng_state = 12345;

static uint32_t rng_next() {
  rng_state = (uint32_t)(rng_state * 1103515245u + 12345u) & 0x7fffffffu;
  return rng_state;
}

/* Multiples of an eighth in [-1250, 1250]. */
static double rng_coord() {
  return (double)((int)(rng_next() % 20001) - 10000) / 8.0;
}

#define SCRIPT_OUTLINES 200

static void run_script(OutlineBuffer *out) {
  rng_state = 12345;

  for (int i = 0; i < SCRIPT_OUTLINES; i++) {
    outline_begin(out, i * 7 + 3, i % 9);

    int n = (int)(rng_next() % 6);

    for (int j = 0; j < n; j++) {
      double a, b, c, d, e, f;

      switch (rng_next() % 3) {
      case 0:
        /* Argument evaluation order is unspecified in C++ and left-to-right in
           JS, so every coordinate is drawn into a local first. */
        a = rng_coord();
        b = rng_coord();
        outline_move_to(out, a, b);
        break;
      case 1:
        a = rng_coord();
        b = rng_coord();
        outline_line_to(out, a, b);
        break;
      default:
        a = rng_coord();
        b = rng_coord();
        c = rng_coord();
        d = rng_coord();
        e = rng_coord();
        f = rng_coord();
        outline_cubic_to(out, a, b, c, d, e, f);
        break;
      }
    }

    switch (rng_next() % 3) {
    case 1:
      outline_fill(out);
      break;
    case 2:
      outline_stroke(out);
      break;
    }
  }

  outline_finish(out);
}

/* Recorded from the TypeScript implementation; see the test named above. */
#define EXPECT_COUNT 200
#define EXPECT_CMDS 422
#define EXPECT_PTS 1436
#define EXPECT_HASH 828189321u

static int failures = 0;

static void check(const char *what, long long got, long long want) {
  if (got != want) {
    printf("  FAIL %-28s got %lld, want %lld\n", what, got, want);
    failures++;
  } else {
    printf("  ok   %-28s %lld\n", what, got);
  }
}

int main() {
  OutlineBuffer ob;

  outline_init(&ob);
  run_script(&ob);

  if (ob.oom) {
    printf("out of memory\n");
    return 2;
  }

  OutlineDigest d = outline_digest(&ob, 0, 0);

  printf("=== outline buffer digest\n");
  check("count", d.count, EXPECT_COUNT);
  check("cmds", d.cmds, EXPECT_CMDS);
  check("pts", d.pts, EXPECT_PTS);
  check("hash", d.hash, EXPECT_HASH);

  /* The ranges have to tile: every outline ends where the next begins, and the
     last one ends at the counts.  A digest alone would not notice a gap. */
  int tiled = 1;

  for (int i = 0; i + 1 < ob.count; i++) {
    const int32_t *a = ob.outlines + i * OUTLINE_I;
    const int32_t *b = a + OUTLINE_I;

    if (a[OUTLINEI_CMD1] != b[OUTLINEI_CMD0] || a[OUTLINEI_PT1] != b[OUTLINEI_PT0]) {
      tiled = 0;
    }
    if (outline_empty(&ob, i) != (a[OUTLINEI_CMD1] == a[OUTLINEI_CMD0])) {
      tiled = 0;
    }
    if (outline_owner(&ob, i) != i * 7 + 3 || outline_role(&ob, i) != i % 9) {
      tiled = 0;
    }
  }

  const int32_t *last = ob.outlines + (ob.count - 1) * OUTLINE_I;

  if (last[OUTLINEI_CMD1] != ob.cmdCount || last[OUTLINEI_PT1] != ob.ptCount) {
    tiled = 0;
  }

  check("ranges tile", tiled, 1);

  /* Reusing a buffer keeps its storage and must not keep its contents. */
  outline_reset(&ob);
  run_script(&ob);

  OutlineDigest again = outline_digest(&ob, 0, 0);

  check("hash after reset", again.hash, d.hash);
  check("count after reset", again.count, d.count);

  outline_free(&ob);

  return failures ? 1 : 0;
}
