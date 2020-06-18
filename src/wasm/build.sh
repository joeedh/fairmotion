#!/usr/bin/env bash

echo Using WASM_EMSDK in: $WASM_EMSDK

source $WASM_EMSDK/emsdk_env.sh

rm _built_wasm.js 2> /dev/null
rm _built_wasm.wasm 2> /dev/null

emcc solver.cc spline.cc matrix.cc wasm_main.cc -s WASM=1 -s "TOTAL_MEMORY=33554432" -s ALLOW_MEMORY_GROWTH=1 -s "EXPORTED_FUNCTIONS=['_main', '_malloc', '_free', '_FM_malloc', '_FM_free', '_gotMessage', '_evalCurve']" -s "EXTRA_EXPORTED_RUNTIME_METHODS=['getMemory', 'ccall', 'addOnPreMain','addOnInit']" -o _built_wasm.js

echo "export default Module = {};" > built_wasm.js
echo "import {wasm_binary, wasmBinaryPath} from './load_wasm.js';" >> built_wasm.js
echo "Module.wasmBinary = wasm_binary;" >> built_wasm.js
echo "Module.INITIAL_MEMORY = 33554432;" >> built_wasm.js
echo "var wasmBinaryFile = wasmBinaryPath;" >> built_wasm.js

cat _built_wasm.js | sed 's/var wasmBinaryFile/\/\/var wasmBinaryFile/' >> built_wasm.js

