#ifndef _WASM_API_H
#define _WASM_API_H

enum MessageTypes {
  GEN_DRAW_BEZIERS = 0,
  REPLY = 1,
  SOLVE = 2
};

extern int logf(const char *fmt, ...);

#endif /* _WASM_API_H */
