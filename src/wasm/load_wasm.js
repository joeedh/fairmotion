"use strict";

import * as config from '../config/config.js';
import '../../platforms/platform.js';

export var wasm_binary = undefined;
export var wasmBinaryPath = "";

console.log("%cLoading wasm...", "color : green;");

if (config.IS_NODEJS) {
  let fs = require('fs');

  window.wasmBinaryFile = undefined;

  wasm_binary = window.solverwasm_binary = fs.readFileSync(config.ORIGIN + "/fcontent/built_wasm.wasm");
  _es6_module.add_export('wasm_binary', wasm_binary);
} else {
  let path = config.ORIGIN + "/fcontent/built_wasm.wasm";

  exports.wasmBinaryPath = path;
  _es6_module.add_export('wasmBinaryPath', path);
  /*
  fetch(origin + "/fcontent/built_wasm.wasm").then((res) => {
    return res.arrayBuffer();
  }).then((data) => {
    wasm_binary = window.solverwasm_binary = data;
    _es6_module.add_export('wasm_binary', wasm_binary);
    console.log("loaded spline solver wasm binary");
  });*/
}
