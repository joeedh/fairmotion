#!/usr/bin/env bash

echo Using WASM_EMSDK in: $WASM_EMSDK

source $WASM_EMSDK/emsdk_env.sh
emcc solver.cc spline.cc matrix.cc wasm_main.cc -s "EXPORTED_FUNCTIONS=['_main', '_malloc', '_free', '_FM_malloc', '_FM_free', '_gotMessage']" -s "EXTRA_EXPORTED_RUNTIME_METHODS=['getMemory', 'ccall']" -s WASM=1 -o _built_wasm.js

echo "export default Module = {};" > built_wasm.js
echo "import {wasm_binary} from 'load_wasm';" >> built_wasm.js
echo "Module.wasmBinary = wasm_binary;" >> built_wasm.js
cat _built_wasm.js >> built_wasm.js
