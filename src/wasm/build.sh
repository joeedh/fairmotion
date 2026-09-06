#!/usr/bin/env bash
#
# Builds the wasm module the app loads: the solver, the curve evaluator, and --
# since stage 6f of docs/plans/draw-refactor.md -- the stroker.
#
# Two outputs.  _built_wasm.wasm is the binary, copied to fcontent/ by
# buildtools/esbuild.mjs.  built_wasm.ts is emscripten's glue with a small
# hand-written preamble in front of it: the preamble hands the module its
# binary (load_wasm.ts knows whether that is a path or bytes), pins the initial
# heap, and says where the binary is to be fetched from.  The file is .ts and
# carries @ts-nocheck because src/ is typechecked whole; the slice fairmotion
# calls is typed in load_wasm.ts.
#
# The preamble goes through Module.locateFile and not through the glue's
# `wasmBinaryFile`, which an earlier version of this script rewrote with sed.
# That stopped working silently: emcc used to emit the declaration and its
# value as one statement and now emits them apart, so the rename caught the
# declaration and the assignment still overwrote the path, and the app 404'd on
# a file it had asked for by the wrong name.  locateFile is the documented hook
# and survives an SDK upgrade.
#
# Everything the JS side calls has to be named in EXPORTED_FUNCTIONS -- an
# export left out here is not a link error, it is a missing property at
# runtime, which is what src/curve/stroke_wasm.ts's claim() reports.

set -e

cd "$(dirname "$0")"

# Four test/build jobs at a time, project-wide -- see vitest.config.ts. emcc
# sizes its own pool from the CPU count unless told otherwise.
export EMCC_CORES="${EMCC_CORES:-4}"

SDKROOT=`cygpath $WASM_EMSDK`
echo Using WASM_EMSDK in: $SDKROOT

# `emsdk activate latest` resolves "latest" against the release list and then
# fails on a machine whose installed SDK is older, which is most of them.
# Activation is what writes .emscripten, so where that exists there is nothing
# left to do but put the tools on PATH.
if [ ! -f "$SDKROOT/.emscripten" ]; then
  $SDKROOT/emsdk activate latest
fi

source $SDKROOT/emsdk_env.sh

rm _built_wasm.js 2> /dev/null || true
rm _built_wasm.wasm 2> /dev/null || true

EXPORTS="'_main', '_malloc', '_free', '_FM_malloc', '_FM_free', '_gotMessage', '_evalCurve'"
EXPORTS="$EXPORTS, '_fmStrokerAbi', '_fmStrokerBind'"
EXPORTS="$EXPORTS, '_fmTrimVertex', '_fmStrokeGroup', '_fmStrokeJoin'"

emcc -O3 -flto -s WASM_BIGINT solver.cc spline.cc matrix.cc wasm_main.cc stroker.cc -s WASM=1 -s "TOTAL_MEMORY=33554432" -s ALLOW_MEMORY_GROWTH=1 -s "EXPORTED_FUNCTIONS=[$EXPORTS]" -s "EXPORTED_RUNTIME_METHODS=['ccall', 'addOnPreMain','addOnInit']" -o _built_wasm.js

OUT=built_wasm.ts

echo "/* Generated emscripten glue. Not hand-written and not annotated; the slice" > $OUT
echo "   fairmotion actually calls is typed as WasmModule in load_wasm.ts. */" >> $OUT
echo "// @ts-nocheck" >> $OUT
echo "export default Module = {};" >> $OUT
echo "import { wasm_binary, wasmBinaryPath } from './load_wasm.js';" >> $OUT
echo "" >> $OUT
echo "Module.wasmBinary = wasm_binary;" >> $OUT
echo "Module.INITIAL_MEMORY = 33554432;" >> $OUT
echo "" >> $OUT
echo "/* The only file emscripten locates is the binary, and the two build" >> $OUT
echo "   targets keep it under different names; load_wasm.ts decides which." >> $OUT
echo "   Empty under node, where Module.wasmBinary above is the whole answer. */" >> $OUT
echo "Module.locateFile = function (path, dir) {" >> $OUT
echo "  return dir + (wasmBinaryPath && path.endsWith('.wasm') ? wasmBinaryPath : path);" >> $OUT
echo "};" >> $OUT

cat _built_wasm.js >> $OUT

node ../../node_modules/@pathtx/prettier/bin/prettier.cjs --log-level warn --write $OUT
