/* Checks stroker_eval.h against a recording of what src/curve/stroker_eval.ts
   computed from the same scene.

   Usage: eval_ref <name>.scene <name>.evalref
   Both files come from playwright/stroke-artifacts.spec.ts.

   This is the middle gate of stage 6.  The end-to-end one is the outline digest
   in playwright/stroke-golden.spec.ts, which is exact and says nothing about
   *where* a port went wrong; this one probes every quantity the geometry layer
   produces, at eleven parameter values on every segment of a real document, and
   names the field and the slot when one disagrees.

   Why tolerance rather than equality.  §5.6 pins the evaluator, so the same
   eval_curve() is behind both sides -- but not the same build of it.  The
   recording came from the wasm module (LLVM, musl libm) and this harness is a
   native build (whatever compiled it, platform libm), and sin/cos/atan2 are not
   required to agree to the last bit across libms.  A disagreement of an ulp in
   a coordinate becomes five thousand ulps in sceneDwidth, which is a centred
   difference divided by 2e-4, so the derivative fields get their own budget.
   Compile with -ffp-contract=off: an fma the recording's compiler did not emit
   is a real difference in arithmetic, not in libm.

   Errors are reported scaled -- |a - b| / max(1, |reference|) -- so a
   coordinate in the hundreds and a shift near zero are held to the same
   relative standard without dividing by something that may be zero. */

#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "../stroke_scene.h"
#include "../stroker_eval.h"

/* "FMER" little-endian; src/curve/stroke_eval_ref.ts writes it. */
#define EVALREF_MAGIC 0x52454d46
#define EVALREF_VERSION 1
#define EVALREF_HEADER_I 8
#define EVALREF_HAS_NET 1

/* Field order is call order; see RefF in stroke_eval_ref.ts. */
enum {
  F_CO_X = 0,
  F_CO_Y,
  F_DV_X,
  F_DV_Y,
  F_CURVATURE,
  F_LENGTH,

  F_WIDTH,
  F_SHIFT,
  F_DWIDTH,
  F_DSHIFT,

  F_SIDE0_CO_X,
  F_SIDE0_CO_Y,
  F_SIDE0_DV_X,
  F_SIDE0_DV_Y,
  F_SIDE0_N_X,
  F_SIDE0_N_Y,
  F_SIDE0_LW,
  F_SIDE0_DLW,

  F_SIDE1_CO_X,
  F_SIDE1_CO_Y,
  F_SIDE1_DV_X,
  F_SIDE1_DV_Y,
  F_SIDE1_N_X,
  F_SIDE1_N_Y,
  F_SIDE1_LW,
  F_SIDE1_DLW,

  F_TOTAL,
};

/* A tolerance per field.  The loose ones are exactly the quantities that carry
   a finite difference: sceneDwidth and sceneDshift divide by 2e-4, and
   evaluateSide's dv and dlw are built out of them. */
#define TIGHT 1e-9
#define LOOSE 1e-6

static const struct {
  const char *name;
  double tol;
} FIELDS[F_TOTAL] = {
    {"evaluate.x", TIGHT},   {"evaluate.y", TIGHT},   {"derivative.x", TIGHT},
    {"derivative.y", TIGHT}, {"curvature", TIGHT},    {"length", TIGHT},

    {"width", TIGHT},        {"shift", TIGHT},        {"dwidth", LOOSE},
    {"dshift", LOOSE},

    {"side0.co.x", TIGHT},   {"side0.co.y", TIGHT},   {"side0.dv.x", LOOSE},
    {"side0.dv.y", LOOSE},   {"side0.n.x", TIGHT},    {"side0.n.y", TIGHT},
    {"side0.lw", TIGHT},     {"side0.dlw", LOOSE},

    {"side1.co.x", TIGHT},   {"side1.co.y", TIGHT},   {"side1.dv.x", LOOSE},
    {"side1.dv.y", LOOSE},   {"side1.n.x", TIGHT},    {"side1.n.y", TIGHT},
    {"side1.lw", TIGHT},     {"side1.dlw", LOOSE},
};

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

/* stroke_eval_ref.probe(), call for call.  The fields a segment with no width
   net does not have are left as the reference left them: zero. */
static void probe(const StrokeScene *scene, int slot, double s, double *out) {
  double co[2], dv[2], nor[2], lw[2];

  scene_evaluate(scene, slot, s, co);
  out[F_CO_X] = co[0];
  out[F_CO_Y] = co[1];

  scene_derivative(scene, slot, s, dv);
  out[F_DV_X] = dv[0];
  out[F_DV_Y] = dv[1];

  out[F_CURVATURE] = scene_curvature(scene, slot, s);
  out[F_LENGTH] = seg_length(scene, slot);

  if (!scene_has_net(scene, slot)) {
    return;
  }

  out[F_WIDTH] = scene_width(scene, slot, s, 0);
  out[F_SHIFT] = scene_shift(scene, slot, s);
  out[F_DWIDTH] = scene_dwidth(scene, slot, s);
  out[F_DSHIFT] = scene_dshift(scene, slot, s);

  for (int side = 0; side < 2; side++) {
    int b = side == 0 ? F_SIDE0_CO_X : F_SIDE1_CO_X;

    scene_eval_side(scene, slot, s, side, co, dv, nor, lw);

    out[b + 0] = co[0];
    out[b + 1] = co[1];
    out[b + 2] = dv[0];
    out[b + 3] = dv[1];
    out[b + 4] = nor[0];
    out[b + 5] = nor[1];
    out[b + 6] = lw[0];
    out[b + 7] = lw[1];
  }
}

int main(int argc, char **argv) {
  if (argc != 3) {
    fprintf(stderr, "usage: %s <scene> <evalref>\n", argv[0]);
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

  if (ref_len < EVALREF_HEADER_I * 4 || h[0] != EVALREF_MAGIC || h[1] != EVALREF_VERSION) {
    fprintf(stderr, "%s: not an eval reference this reader understands\n", argv[2]);
    return 2;
  }

  int nsegs = h[2], nsamples = h[3], nfields = h[4];

  if (nfields != F_TOTAL) {
    fprintf(stderr, "%s: %d fields per sample, this reader knows %d\n", argv[2], nfields, F_TOTAL);
    return 2;
  }

  const int32_t *slots = (const int32_t *)(ref_bytes + EVALREF_HEADER_I * 4);
  const int32_t *flags = slots + nsegs;

  size_t data_at = (EVALREF_HEADER_I * 4 + (size_t)nsegs * 4 * 2 + 7) & ~(size_t)7;

  if (ref_len != data_at + (size_t)nsegs * nsamples * nfields * 8) {
    fprintf(stderr, "%s: not the length its header implies\n", argv[2]);
    return 2;
  }

  const double *ref = (const double *)(ref_bytes + data_at);

  if (!(scene.flags & SCENE_FLAG_NATIVE)) {
    fprintf(stderr, "%s: recorded without the wasm evaluator; §5.6 pins it\n", argv[1]);
    return 2;
  }

  if (nsegs != scene.segLiveCount) {
    fprintf(stderr, "reference covers %d segments, scene has %d\n", nsegs, scene.segLiveCount);
    return 2;
  }

  double worst[F_TOTAL];
  int worst_slot[F_TOTAL], worst_sample[F_TOTAL];

  for (int f = 0; f < F_TOTAL; f++) {
    worst[f] = 0.0;
    worst_slot[f] = -1;
    worst_sample[f] = -1;
  }

  int no_net = 0;

  for (int i = 0; i < nsegs; i++) {
    int slot = slots[i];

    if (slot != scene.segLive[i]) {
      fprintf(stderr, "reference segment %d is slot %d, scene says %d\n", i, slot,
              scene.segLive[i]);
      return 2;
    }

    bool has_net = scene_has_net(&scene, slot);

    if (has_net != ((flags[i] & EVALREF_HAS_NET) != 0)) {
      fprintf(stderr, "slot %d: width net disagrees with the reference\n", slot);
      return 2;
    }

    if (!has_net) {
      no_net++;
    }

    for (int j = 0; j < nsamples; j++) {
      double got[F_TOTAL];

      memset(got, 0, sizeof(got));
      probe(&scene, slot, (double)j / (double)(nsamples - 1), got);

      const double *want = ref + ((size_t)i * nsamples + j) * nfields;

      for (int f = 0; f < F_TOTAL; f++) {
        double a = got[f], b = want[f];

        /* A NaN on one side only is a difference; on both it is agreement, and
           there is nothing to subtract. */
        if (a != a || b != b) {
          if ((a != a) != (b != b)) {
            worst[f] = INFINITY;
            worst_slot[f] = slot;
            worst_sample[f] = j;
          }

          continue;
        }

        double scale = fabs(b) > 1.0 ? fabs(b) : 1.0;
        double e = fabs(a - b) / scale;

        if (e > worst[f]) {
          worst[f] = e;
          worst_slot[f] = slot;
          worst_sample[f] = j;
        }
      }
    }
  }

  int bad = 0;

  printf("%s: %d segments (%d without a width net) x %d samples\n", argv[2], nsegs, no_net,
         nsamples);

  for (int f = 0; f < F_TOTAL; f++) {
    bool over = !(worst[f] <= FIELDS[f].tol);

    if (over) {
      bad++;
    }

    printf("  %-14s %10.3e  (tol %.0e)%s", FIELDS[f].name, worst[f], FIELDS[f].tol,
           over ? "  FAIL" : "");

    if (worst_slot[f] >= 0 && worst[f] > 0.0) {
      printf("  worst at slot %d sample %d", worst_slot[f], worst_sample[f]);
    }

    printf("\n");
  }

  scene_free(&scene);
  free(ref_bytes);

  if (bad) {
    printf("%d field%s outside tolerance\n", bad, bad == 1 ? "" : "s");
    return 1;
  }

  printf("all fields within tolerance\n");
  return 0;
}
