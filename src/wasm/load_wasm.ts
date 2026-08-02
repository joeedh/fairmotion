"use strict";

import * as config from '../config/config.js';
import '../../platforms/platform.js';

export var wasm_binary = undefined;
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
