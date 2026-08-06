"use strict";

import type { HardwareKey } from "./license_api.js";

/* NOTE: node's module is spelled "os"; `require` is also not defined in the
   bundled ESM output. */
export function getHardwareKey(HardwareKeyCls: typeof HardwareKey) {
  var os = require("OS");

  var hostname = os.hostname();
  var platform = os.platform();

  var name = hostname;
  var key = "electron_" + hostname + "_" + platform;

  return new HardwareKeyCls(name, key);
}
