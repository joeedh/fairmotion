#include <stdio.h>
#include <stdlib.h>

#include <math.h>
#include <stdint.h>
#include <string.h>

#include "emscripten.h"
#include "wasm_api.h"
#include "spline.h"
#include "solver.h"
#include "matrix.h"
#include "vector3d.h"
#include "stdarg.h"

extern int solver_debug;

extern "C" void *FM_malloc(int size) {
    return malloc(size);
}

extern "C" void FM_free(void *mem) {
    free(mem);
}

int errorf(const char *fmt, ...) {
    int ret;

    va_list args;
    va_start(args, fmt);
    ret = vprintf(fmt, args);
    va_end(args);

    printf("\n");

    return ret+1;
}

int logf(const char *fmt, ...) {
    int ret;

    va_list args;
    va_start(args, fmt);
    ret = vprintf(fmt, args);
    va_end(args);

    printf("\n");

    return ret+1;
}

#define LOGPERF(...)

EM_JS(void, sendMessage, (int x, void* buffer, int len), {
    _wasm_post_message(x, buffer, len);
});

void handleMessage(int type, char *buf, int len) {
  int msgid = *((int*)(buf+4));

  if (solver_debug)
    logf("Got message! type: %d, id: %d, len: %d, ptr: %p\n", type, msgid, (int) len, buf);

  switch (type) {
    case GEN_DRAW_BEZIERS:
    {
      SplineDrawSegment *seg = (SplineDrawSegment*)(buf+16);
      static char scratch[4192];

      int totseg = *((int*)(buf+8));

      if (totseg > (len-16)/sizeof(SplineDrawSegment)) {
        errorf("Bad segment length %d, maximum allowed would be %d, sizeof() is %d", totseg,
               (len-12)/sizeof(SplineDrawSegment), sizeof(SplineDrawSegment));
        return;
      }

      //logf("totseg: %d", totseg);

      int retlen = 16+sizeof(SplineBezSegments)*totseg;
      //logf("Draw recalc; retlen: %d, msgid : %d", retlen, msgid);

      //BEZ_SEGMENTS
      const char *ret = retlen < sizeof(scratch) ? scratch : (const char*) malloc(retlen);

      *(int*)ret = REPLY;
      *(int*)(ret+4) = msgid;
      *(int*)(ret+8) = totseg;
      *(int*)(ret+12) = 0; //pad to 8 byte boundary

      //logf("totseg: %d", totseg);

      SplineBezSegments *bz = (SplineBezSegments*)(ret+16);
      for (int i=0; i<totseg; i++, seg++, bz++) {
        do_segment_split(seg, bz);
      }

      //should JS code free() this? I'm thinking yes. . .
      char *map = (char*) malloc(retlen);

      memcpy(map, ret, retlen);

      //logf("Sending result; msgid: %d", msgid);
      //PostMessage(retbuf);
      sendMessage(type, (void*)ret, retlen);

      if (retlen >= sizeof(scratch)) {
        free((void*)ret);
      }
    }
    break;
  case SOLVE: {
    int retlen = 0;
    bool free_ret = false;

    if (solver_debug) logf("Solving...");

    //stupid security restrictions
    double blah[3], ks[16];
    float bleh[3];
    bleh[0] = 0.0f; //ger, needed to avoid compiler errors

    eval_curve_dv(blah, 0.0, bleh, bleh, ks, ORDER, false, false);

    LOGPERF("time: %.2lfms", time_ms()-start_time);
    char *ret = do_solve(buf, &retlen, &free_ret);
    LOGPERF("  time2: %.2lfms", time_ms()-start_time);

    if (ret) {
      char *map = (char*) malloc(retlen);

//      logf("  retlen: %d\n", retlen);

      LOGPERF("  time3: %.2lfms", time_ms()-start_time);

      //memcpy((map, ret, retlen);
      //map = ret;
      int i;
      for (i=0; i<retlen; i++) {
        map[i] = ret[i];
      }

      //memcpy(map+4, (char*)&msgid, 4);

      if (solver_debug) logf("  buf: %p %d %d", buf, map-buf, retlen);
      if (solver_debug) logf("  ret: %p %p %d %d", ret, map, retlen, free_ret);

      LOGPERF("  time4: %.2lfms", time_ms()-start_time);

      //logf("Sending result; msgid: %d", msgid);

      LOGPERF("  time5: %.2lfms", time_ms()-start_time);

      sendMessage(type, (void*)map, retlen);

      LOGPERF("finaltime: %.2lfms", time_ms()-start_time);

      if (free_ret)
        free(ret);
    }
    break;
    }
  }
}

extern "C" void gotMessage(int type, void *message, int len) {
    char *buf = (char*) message;

    printf("Got message %d %p %d\n", type, message, len);
    handleMessage(type, buf, len);
}

int main(int argc, char ** argv) {

  printf("Hello, world!\n");
}
