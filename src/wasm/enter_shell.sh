#!/usr/bin/env bash

echo `cygpath $WASM_EMSDK`
export WASM_EMSDK=`cygpath $WASM_EMSDK`

echo Using WASM_EMSDK in: $WASM_EMSDK

export WASM_BASH=bash

$WASM_EMSDK/emsdk activate latest
source $WASM_EMSDK/emsdk_env.sh
bash

