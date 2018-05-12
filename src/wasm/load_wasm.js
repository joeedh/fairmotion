let fs = require('fs');

export var wasm_binary = fs.readFileSync("electron_build/fcontent/built_wasm.wasm");
