#ifndef SOLVER_H
#define SOLVER_H

#include "spline.h"
#include "stdint.h"

typedef struct SplineBezSegments {
  int eid, totseg;
  double segments[(4*2)*BEZ_SEGMENTS];
} SplineBezSegments;

typedef struct SplineDrawSegment {
    int32_t eid;

    float v1[3];
    float v2[3];

    int32_t totks;

    double ks[16];
 } SplineDrawSegment;

typedef struct SplineVertex {
  int32_t eid, flag; //8 bytes
  float co[3]; // 12 bytes
  int32_t pad0; //pad to 8-byte boundary
} SplineVertex;

enum SplineFlags {
  FIXED_KS = 1<<21
};

typedef struct SplineSegment {
  int32_t eid, flag; //8 bytes

  double *ks;

  float h1[3], h2[3];

  int32_t v1, v2;
  int32_t pad;
} SplineSegment;

enum {
  TAN_CONSTRAINT,
  HARD_TAN_CONSTRAINT,
  CURVATURE_CONSTRAINT,
  COPY_C_CONSTRAINT
};

typedef struct Constraint {
  int32_t type;
  float k, k2, pad0; //k2 is constraint weight applied after 10-15 steps
  
  int32_t seg1, seg2;
  int32_t param1, param2;
  float param1f, param2f;

  double gs[16];
  double error;
} Constraint;

//make sure to free result afterwards
char *do_solve(char *data, int *len_out, bool *free_ret);
void do_segment_split(SplineDrawSegment *seg, SplineBezSegments *bz);

#endif /* SOLVER_H */
