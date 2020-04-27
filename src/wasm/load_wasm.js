"use strict";

import * as config from '../config/config.js';

export var wasm_binary = undefined;

if (config.IS_NODEJS) {
  let fs = require('fs');
  
  wasm_binary = window.solverwasm_binary = fs.readFileSync("electron_build/fcontent/built_wasm.wasm");
  _es6_module.add_export('wasm_binary', wasm_binary);
} else {
  let origin = document.location.origin;
  
  fetch(origin + "/fcontent/built_wasm.wasm").then((res) => {
    return res.arrayBuffer();
  }).then((data) => {
    wasm_binary = window.solverwasm_binary = data;
    _es6_module.add_export('wasm_binary', wasm_binary);
    console.log("loaded spline solver wasm binary");
  });
}



