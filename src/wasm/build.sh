#!/usr/bin/env bash

echo Using WASM_EMSDK in: $WASM_EMSDK

source $WASM_EMSDK/emsdk_env.sh

rm _built_wasm.js
rm _built_wasm.wasm

emcc solver.cc spline.cc matrix.cc wasm_main.cc -s WASM=1 -s "TOTAL_MEMORY=33554432" -s ALLOW_MEMORY_GROWTH=1 -s "EXPORTED_FUNCTIONS=['_main', '_malloc', '_free', '_FM_malloc', '_FM_free', '_gotMessage']" -s "EXTRA_EXPORTED_RUNTIME_METHODS=['getMemory', 'ccall']" -o _built_wasm.js

echo "export default Module = {};" > built_wasm.js
echo "import {wasm_binary} from 'load_wasm';" >> built_wasm.js
echo "Module.wasmBinary = wasm_binary;" >> built_wasm.js
echo "Module.TOTAL_MEMORY = 33554432;" >> built_wasm.js
cat _built_wasm.js >> built_wasm.js