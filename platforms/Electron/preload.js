require("v8").setFlagsFromString('--expose-gc');
require("v8").setFlagsFromString('--expose-gc-as gc');
require("v8").setFlagsFromString('--expose_gc');
require("v8").setFlagsFromString('--expose_gc-as gc');

process.once('loaded', () => {
  console.log("Preload!");
  global.BLEH = 1;
  window.BLEH = 2;
});

