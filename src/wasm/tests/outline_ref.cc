/* Checks stroker.h against a recording of what src/curve/draw/stroker.ts built from
   the same scene.

   Usage: outline_ref <name>.scene <name>.outref
   Both files come from playwright/stroke-artifacts.spec.ts.

   The end-to-end gate for the port, and the one that finally runs strokeAll()
   whole: trim every junction, stroke every group, fill every wedge.  Everything
   below it -- the geometry layer, the outline buffer, the trimmer -- has its own
   harness, so a failure here that the others pass is a failure in the walk
   itself.

   Structure exactly, points by tolerance.  The outline table and the command
   stream say which outline, in which role, how many commands, which opcodes and
   what finish; a port that emits a lineTo where the JS emitted a cubic, or opens
   its debug outlines in the wrong order, has a bug and not a rounding
   difference, and the reader stops at the first one rather than drowning the
   rest of the report.  The coordinates are measurements and get 1e-9, the same
   libm gap eval_ref.cc explains.

   The recording has the debug overlays on: they only append outlines, and they
   reach dline(), whose unguarded division nothing else in the harness runs. */

#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "../outline_buffer.h"
#include "../stroke_scene.h"
#include "../stroker.h"
#include "../trim_view.h"

/* "FMOR" little-endian; src/curve/draw/outline_ref.ts writes it. */
#define OUTREF_MAGIC 0x524f4d46
#define OUTREF_VERSION 1
#define OUTREF_HEADER_I 8

#define OUTREF_TOL 1e-9

static const char *ROLE_NAMES[9] = {
    "ELEMENT", "DOUBLE_STROKE", "JOIN_V1", "JOIN_V2",  "JOIN_V1_DOUBLE",
    "JOIN_V2_DOUBLE", "DEBUG_1", "DEBUG_2", "DEBUG_3",
};

static const char *CMD_NAMES[3] = {"move", "line", "cubic"};

static const char *role_name(int role) {
  return role >= 0 && role < 9 ? ROLE_NAMES[role] : "?";
}

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
    fprintf(stderr, "usage: %s <scene> <outref>\n", argv[0]);
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

  if (ref_len < OUTREF_HEADER_I * 4 || h[0] != OUTREF_MAGIC || h[1] != OUTREF_VERSION) {
    fprintf(stderr, "%s: not an outline reference this reader understands\n", argv[2]);
    return 2;
  }

  int count = h[2], ncmds = h[3], npts = h[4], stride = h[5], debug = h[6];

  if (stride != OUTLINE_I) {
    fprintf(stderr, "%s: %d ints per outline, this reader knows %d\n", argv[2], stride, OUTLINE_I);
    return 2;
  }

  size_t cmd_at = OUTREF_HEADER_I * 4 + (size_t)count * OUTLINE_I * 4;
  size_t pt_at = (cmd_at + (size_t)ncmds + 7) & ~(size_t)7;

  if (ref_len != pt_at + (size_t)npts * 8) {
    fprintf(stderr, "%s: not the length its header implies\n", argv[2]);
    return 2;
  }

  const int32_t *want_table = (const int32_t *)(ref_bytes + OUTREF_HEADER_I * 4);
  const uint8_t *want_cmds = ref_bytes + cmd_at;
  const double *want_pts = (const double *)(ref_bytes + pt_at);

  if (!(scene.flags & SCENE_FLAG_NATIVE)) {
    fprintf(stderr, "%s: recorded without the wasm evaluator; §5.6 pins it\n", argv[1]);
    return 2;
  }

  TrimView trims;
  err = trim_alloc(&trims, scene.trimSlots);

  if (err) {
    fprintf(stderr, "%s\n", err);
    return 2;
  }

  OutlineBuffer ob;
  outline_init(&ob);

  stroke_all(&scene, &trims, debug != 0, &ob);

  if (ob.oom || rec_oom) {
    fprintf(stderr, "out of memory while stroking\n");
    return 2;
  }

  printf("%s: %d outlines, %d commands, %d points%s\n", argv[2], count, ncmds, npts,
         debug ? " (with debug overlays)" : "");

  if (ob.count != count || ob.cmdCount != ncmds || ob.ptCount != npts) {
    printf("  built %d outlines, %d commands, %d points  FAIL\n", ob.count, ob.cmdCount,
           ob.ptCount);
    return 1;
  }

  /* Structure first, and it stops at the first disagreement: once the two
     command streams are out of step every later index is noise. */
  for (int i = 0; i < count; i++) {
    for (int f = 0; f < OUTLINE_I; f++) {
      int a = ob.outlines[i * OUTLINE_I + f];
      int b = want_table[i * OUTLINE_I + f];

      if (a != b) {
        printf("  outline %d (owner %d, role %s): field %d is %d, want %d  FAIL\n", i,
               want_table[i * OUTLINE_I + OUTLINEI_OWNER],
               role_name(want_table[i * OUTLINE_I + OUTLINEI_ROLE]), f, a, b);
        return 1;
      }
    }
  }

  for (int i = 0; i < ncmds; i++) {
    if (ob.cmds[i] != want_cmds[i]) {
      printf("  command %d is %s, want %s  FAIL\n", i,
             ob.cmds[i] < 3 ? CMD_NAMES[ob.cmds[i]] : "?",
             want_cmds[i] < 3 ? CMD_NAMES[want_cmds[i]] : "?");
      return 1;
    }
  }

  printf("  table          exact over %d outlines\n", count);
  printf("  commands       exact over %d opcodes\n", ncmds);

  double worst = 0.0;
  int worst_at = -1, over = 0;

  for (int i = 0; i < npts; i++) {
    double a = ob.pts[i], b = want_pts[i];

    /* A NaN on one side only is a difference; on both it is agreement. */
    if (a != a || b != b) {
      if ((a != a) != (b != b)) {
        worst = INFINITY;
        worst_at = i;
        over++;
      }

      continue;
    }

    double scale = fabs(b) > 1.0 ? fabs(b) : 1.0;
    double e = fabs(a - b) / scale;

    if (e > OUTREF_TOL) {
      over++;
    }

    if (e > worst) {
      worst = e;
      worst_at = i;
    }
  }

  bool bad = !(worst <= OUTREF_TOL);

  printf("  points       %10.3e  (tol %.0e)%s", worst, OUTREF_TOL, bad ? "  FAIL" : "");

  if (over) {
    printf("  %d of %d over, worst at %d", over, npts, worst_at);
  } else if (worst_at >= 0 && worst > 0.0) {
    printf("  worst at %d", worst_at);
  }

  printf("\n");

  outline_free(&ob);
  trim_free(&trims);
  stroker_free();
  scene_free(&scene);
  free(ref_bytes);

  if (bad) {
    return 1;
  }

  printf("outlines agree\n");
  return 0;
}
