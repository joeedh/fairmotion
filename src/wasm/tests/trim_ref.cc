/* Checks trimmer.h against a recording of what src/curve/trimmer.ts computed
   from the same scene.

   Usage: trim_ref <name>.scene <name>.trimref
   Both files come from playwright/stroke-artifacts.spec.ts.

   The second gate of stage 6, and the one with teeth for the junction code.
   eval_ref.cc probes the geometry layer field by field; this runs the whole
   trimming pass -- eight halvings of a bracket, a segment-vs-segment crossing
   test at every step, then the mitre solve -- over every vertex of a real
   document and compares the arrays it left behind.

   Two comparisons, because there are two kinds of output.  The mask is a set of
   decisions: whether a join got a mitre at all.  It is compared exactly, since a
   port that mitres a corner the JS left plain has a real bug and not a rounding
   difference.  The doubles are measurements and get a tolerance -- the same
   libm gap eval_ref.cc explains, arriving here through sceneEvalSide().

   Beware two amplifiers when reading a failure.  The bisection is a
   discontinuity: `a` and `b` are exact binary fractions of 0.65 and stay
   bit-identical as long as every crossing test answers the same way, so a trim
   value that is off by 0.0025 is not a rounding difference, it is one flipped
   decision eight halvings up.  And the mitre points are floored, so a crossing
   that lands within an ulp of a whole number can differ by a full 1.0.  Neither
   is noise; both are worth chasing.  That is why the report counts differing
   slots as well as naming the worst one. */

#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "../stroke_scene.h"
#include "../trim_view.h"
#include "../trimmer.h"

/* "FMTR" little-endian; src/curve/trim_ref.ts writes it. */
#define TRIMREF_MAGIC 0x52544d46
#define TRIMREF_VERSION 1
#define TRIMREF_HEADER_I 8

/* Field order is trim_state.ts's layout; see trim_view.h. */
static const char *FIELDS[TRIM_STRIDE] = {
    "start1",    "end1",      "start2",    "end2",      "v1.side0.x", "v1.side0.y",
    "v1.side1.x", "v1.side1.y", "v2.side0.x", "v2.side0.y", "v2.side1.x", "v2.side1.y",
};

#define TRIM_TOL 1e-9

static unsigned char *read_file(const char *path, size_t *len) {
  FILE *f = fopen(path, "rb");

  if (!f) {
    fprintf(stderr, "cannot open %s\n", path);
    return 0;
  }

  fseek(f, 0, SEEK_END);
  long n = ftell(f);
  fseek(f, 0, SEEK_SET);

  unsigned char *buf = (unsigned char *)malloc((size_t)n);

  if (!buf || fread(buf, 1, (size_t)n, f) != (size_t)n) {
    fprintf(stderr, "cannot read %s\n", path);
    fclose(f);
    free(buf);
    return 0;
  }

  fclose(f);
  *len = (size_t)n;

  return buf;
}

int main(int argc, char **argv) {
  if (argc != 3) {
    fprintf(stderr, "usage: %s <scene> <trimref>\n", argv[0]);
    return 2;
  }

  size_t scene_len = 0, ref_len = 0;
  unsigned char *scene_bytes = read_file(argv[1], &scene_len);
  unsigned char *ref_bytes = read_file(argv[2], &ref_len);

  if (!scene_bytes || !ref_bytes) {
    return 2;
  }

  StrokeScene scene;
  const char *err = scene_load(scene_bytes, scene_len, &scene);

  free(scene_bytes);

  if (err) {
    fprintf(stderr, "%s: %s\n", argv[1], err);
    return 2;
  }

  const int32_t *h = (const int32_t *)ref_bytes;

  if (ref_len < TRIMREF_HEADER_I * 4 || h[0] != TRIMREF_MAGIC || h[1] != TRIMREF_VERSION) {
    fprintf(stderr, "%s: not a trim reference this reader understands\n", argv[2]);
    return 2;
  }

  int slots = h[2], nverts = h[3], stride = h[4];

  if (stride != TRIM_STRIDE) {
    fprintf(stderr, "%s: stride %d, this reader knows %d\n", argv[2], stride, TRIM_STRIDE);
    return 2;
  }

  const int32_t *verts = (const int32_t *)(ref_bytes + TRIMREF_HEADER_I * 4);

  size_t mask_at = TRIMREF_HEADER_I * 4 + (size_t)nverts * 4;
  size_t data_at = (mask_at + (size_t)slots + 7) & ~(size_t)7;

  if (ref_len != data_at + (size_t)slots * TRIM_STRIDE * 8) {
    fprintf(stderr, "%s: not the length its header implies\n", argv[2]);
    return 2;
  }

  const uint8_t *want_mask = ref_bytes + mask_at;
  const double *want = (const double *)(ref_bytes + data_at);

  if (!(scene.flags & SCENE_FLAG_NATIVE)) {
    fprintf(stderr, "%s: recorded without the wasm evaluator; §5.6 pins it\n", argv[1]);
    return 2;
  }

  if (slots != scene.trimSlots) {
    fprintf(stderr, "reference has %d trim slots, scene says %d\n", slots, scene.trimSlots);
    return 2;
  }

  if (nverts != scene.vertLiveCount) {
    fprintf(stderr, "reference trims %d vertices, scene has %d live\n", nverts,
            scene.vertLiveCount);
    return 2;
  }

  /* The recorded order is strokeAll()'s -- live vertex slots ascending -- and
     order is part of the answer here, so check it rather than trust it. */
  for (int i = 1; i < nverts; i++) {
    if (verts[i] <= verts[i - 1]) {
      fprintf(stderr, "%s: vertex slots are not ascending at %d\n", argv[2], i);
      return 2;
    }
  }

  TrimView trims;
  err = trim_alloc(&trims, slots);

  if (err) {
    fprintf(stderr, "%s\n", err);
    return 2;
  }

  for (int i = 0; i < nverts; i++) {
    trim_vertex(&scene, &trims, verts[i]);
  }

  int mask_bad = 0, mask_first = -1;

  for (int i = 0; i < slots; i++) {
    if (trims.mask[i] != want_mask[i]) {
      if (!mask_bad) {
        mask_first = i;
      }

      mask_bad++;
    }
  }

  double worst[TRIM_STRIDE];
  int worst_slot[TRIM_STRIDE], over_slots[TRIM_STRIDE];

  for (int f = 0; f < TRIM_STRIDE; f++) {
    worst[f] = 0.0;
    worst_slot[f] = -1;
    over_slots[f] = 0;
  }

  for (int i = 0; i < slots; i++) {
    for (int f = 0; f < TRIM_STRIDE; f++) {
      double a = trims.data[i * TRIM_STRIDE + f];
      double b = want[i * TRIM_STRIDE + f];

      /* A NaN on one side only is a difference; on both it is agreement. */
      if (a != a || b != b) {
        if ((a != a) != (b != b)) {
          worst[f] = INFINITY;
          worst_slot[f] = i;
          over_slots[f]++;
        }

        continue;
      }

      double scale = fabs(b) > 1.0 ? fabs(b) : 1.0;
      double e = fabs(a - b) / scale;

      if (e > TRIM_TOL) {
        over_slots[f]++;
      }

      if (e > worst[f]) {
        worst[f] = e;
        worst_slot[f] = i;
      }
    }
  }

  int bad = mask_bad ? 1 : 0;

  printf("%s: %d vertices trimmed over %d segment slots\n", argv[2], nverts, slots);

  if (mask_bad) {
    printf("  mask           %d slot%s differ (first %d: got %d, want %d)  FAIL\n", mask_bad,
           mask_bad == 1 ? "" : "s", mask_first, trims.mask[mask_first], want_mask[mask_first]);
  } else {
    printf("  mask           exact over all %d slots\n", slots);
  }

  for (int f = 0; f < TRIM_STRIDE; f++) {
    bool over = !(worst[f] <= TRIM_TOL);

    if (over) {
      bad++;
    }

    printf("  %-12s %10.3e  (tol %.0e)%s", FIELDS[f], worst[f], TRIM_TOL, over ? "  FAIL" : "");

    if (over_slots[f]) {
      printf("  %d slot%s over, worst %d", over_slots[f], over_slots[f] == 1 ? "" : "s",
             worst_slot[f]);
    } else if (worst_slot[f] >= 0 && worst[f] > 0.0) {
      printf("  worst at slot %d", worst_slot[f]);
    }

    printf("\n");
  }

  trim_free(&trims);
  scene_free(&scene);
  free(ref_bytes);

  if (bad) {
    printf("%d check%s failed\n", bad, bad == 1 ? "" : "s");
    return 1;
  }

  printf("trim arrays agree\n");
  return 0;
}
