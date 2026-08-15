#!/usr/bin/env bash
#
# Builds the native parity harness and runs it over every artifact
# playwright/stroke-artifacts.spec.ts recorded.
#
# Native, not wasm, on purpose: this checks the port's arithmetic against a
# recording, and a host compiler is enough for that -- it needs no emscripten
# SDK, so it can be run in a plain checkout.  The wasm build (../build.sh) is
# what ships the same code to the app.
#
# -ffp-contract=off because an fma the recording's compiler did not emit shows
# up as a difference in arithmetic that has nothing to do with the port.  -O0
# for the same reason: nothing here is hot, and the fewer liberties the
# optimizer takes with the expression order, the more the comparison means.

set -e

cd "$(dirname "$0")"

CXX="${CXX:-g++}"
OUT="${OUT:-eval_ref}"
ARTIFACTS="../../../playwright/artifacts"

# _USE_MATH_DEFINES: mingw hides M_PI under a strict -std=, and vector3d.h wants
# it.  The two -Wno- flags are macro artifacts of the existing headers -- the
# VEC* macros are comma expressions whose value is discarded by design.
"$CXX" -O0 -g -ffp-contract=off -std=c++17 -D_USE_MATH_DEFINES -Wall -Wno-unused-value \
  -Wno-unused-function -o "$OUT" eval_ref.cc -lm

status=0

for scene in "$ARTIFACTS"/*.scene; do
  [ -e "$scene" ] || { echo "no artifacts in $ARTIFACTS -- run the playwright spec"; exit 2; }

  ref="${scene%.scene}.evalref"

  echo "=== $(basename "$scene")"
  "./$OUT" "$scene" "$ref" || status=$?
done

exit $status
