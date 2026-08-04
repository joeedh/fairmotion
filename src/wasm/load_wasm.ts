"use strict";

import * as config from '../config/config.js';
import '../../platforms/platform.js';

/* The slice of the emscripten Module object fairmotion actually calls.
   built_wasm.ts is generated glue and is not annotated; this interface lives
   here so both it and native_api.ts can name the same shape. */
export interface WasmModule {
  /* Set by emscripten once the runtime has finished initialising. */
  calledRun : boolean;
  HEAPU8 : Uint8Array;

  _malloc(size : number) : number;
  _free(ptr : number) : void;

  /* solver.c's entry points. Everything is passed as a heap offset. */
  _gotMessage(type : number, ptr : number, len : number) : void;
  _evalCurve(coPtr : number, s : number, ksPtr : number, v1Ptr : number,
             v2Ptr : number, noUpdate : number) : void;
}

/* Only set under node; the browser hands emscripten a path instead. */
export var wasm_binary : ArrayBufferView | undefined = undefined;
export var wasmBinaryPath = "";

console.log("%cLoading wasm...", "color : green;");

if (config.IS_NODEJS) {
  let fs = require('fs');

  window.wasmBinaryFile = undefined;

  /* Assigning the exported `var` is enough — ESM export bindings are live, so
     the old explicit add_export() calls are gone. */
  wasm_binary = window.solverwasm_binary = fs.readFileSync(config.ORIGIN + "/fcontent/built_wasm.wasm");
} else {
  /* Relative on purpose: built_wasm.js runs this through emscripten's
     locateFile(), which prepends the directory app.js was loaded from --
     fcontent/ in both targets. An absolute URL got that prefix too and 404'd.
     The legacy build got away with it only because its lazy module evaluation
     left document.currentScript null, so scriptDirectory stayed empty. */
  wasmBinaryPath = "built_wasm.wasm";
  /*
  fetch(origin + "/fcontent/built_wasm.wasm").then((res) => {
    return res.arrayBuffer();
  }).then((data) => {
    wasm_binary = window.solverwasm_binary = data;
    console.log("loaded spline solver wasm binary");
  });*/
}
