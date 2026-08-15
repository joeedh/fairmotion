#!/usr/bin/env bash
#
# Builds the parity harness and runs it: first the self-contained outline-buffer
# pin, then the geometry, trimmer and stroker comparisons over every artifact
# playwright/stroke-artifacts.spec.ts recorded.
#
# Twice, if it can.  The native pass needs only a host compiler, so a plain
# checkout can run it -- that is what keeps the harness available to anyone
# without an emscripten SDK.  The wasm pass is the one that matters more, since
# it is the toolchain and the target the app actually ships, and it is skipped
# with a note rather than a failure when emcc is not on PATH.
#
# The two passes are not the same test.  Against a host libm the recording can
# only be matched to a tolerance (§5.6); through emscripten it is matched bit
# for bit, because the recording's own geometry came from a wasm evaluator.
#
# -ffp-contract=off because an fma the recording's compiler did not emit shows
# up as a difference in arithmetic that has nothing to do with the port.  -O0
# for the same reason: nothing here is hot, and the fewer liberties the
# optimizer takes with the expression order, the more the comparison means.

set -e

cd "$(dirname "$0")"

CXX="${CXX:-g++}"
ARTIFACTS="../../../playwright/artifacts"

# Four test/build jobs at a time, project-wide -- see vitest.config.ts. The
# compiles below are serial and each is one process, so this is a ceiling for
# anything added here, not a change to what runs today.
JOBS="${JOBS:-4}"
export MAKEFLAGS="-j$JOBS"

# _USE_MATH_DEFINES: mingw hides M_PI under a strict -std=, and vector3d.h wants
# it.  The two -Wno- flags are macro artifacts of the existing headers -- the
# VEC* macros are comma expressions whose value is discarded by design.
build() {
  "$CXX" -O0 -g -ffp-contract=off -std=c++17 -D_USE_MATH_DEFINES -Wall -Wno-unused-value \
    -Wno-unused-function -o "$1" "$2" -lm
}

TESTS="outline_buffer eval_ref trim_ref outline_ref"

for t in $TESTS; do
  build "$t" "$t.cc"
done

# -w because the native pass above has already reported anything worth hearing,
# and the same warnings twice is noise.
#
# Two things about the output.  It is .js and not .mjs, because emscripten turns
# an .mjs into a module factory -- main() never runs and the harness passes in
# silence.  And the directory gets its own package.json, because the repo's says
# "type": "module" and node would read the glue's require() as ESM otherwise.
build_wasm() {
  "$EMCC" -O0 -g -ffp-contract=off -std=c++17 -D_USE_MATH_DEFINES -w \
    -sNODERAWFS=1 -sEXIT_RUNTIME=1 -sALLOW_MEMORY_GROWTH=1 -o "$WASMDIR/$1.js" "$2"
}

set +e

status=0

# emcc lives under $WASM_EMSDK the way ../build.sh expects it, or on PATH.
EMCC="${EMCC:-}"

if [ -z "$EMCC" ] && [ -n "$WASM_EMSDK" ]; then
  EMCC="$(cygpath "$WASM_EMSDK" 2>/dev/null || echo "$WASM_EMSDK")/upstream/emscripten/emcc"
fi

if [ -z "$EMCC" ] || [ ! -x "$EMCC" ]; then
  command -v emcc >/dev/null 2>&1 && EMCC=emcc || EMCC=""
fi

WASMDIR=wasm-out

if [ -n "$EMCC" ]; then
  mkdir -p "$WASMDIR"
  echo '{ "type": "commonjs" }' > "$WASMDIR/package.json"

  export EMCC_CORES="${EMCC_CORES:-$JOBS}"

  for t in $TESTS; do
    build_wasm "$t" "$t.cc" || status=$?
  done
else
  echo "note: no emcc (set WASM_EMSDK or put it on PATH) -- native pass only"
fi

run() {
  echo "--- $1"
  ./"$1" "${@:2}" || status=$?

  [ -n "$EMCC" ] || return 0

  echo "--- $1 (wasm)"
  node "$WASMDIR/$1.js" "${@:2}" || status=$?
}

run outline_buffer

for scene in "$ARTIFACTS"/*.scene; do
  [ -e "$scene" ] || { echo "no artifacts in $ARTIFACTS -- run the playwright spec"; exit 2; }

  echo "=== $(basename "$scene")"
  run eval_ref "$scene" "${scene%.scene}.evalref"
  run trim_ref "$scene" "${scene%.scene}.trimref"
  run outline_ref "$scene" "${scene%.scene}.outref"
done

exit $status
