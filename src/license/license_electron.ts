"use strict";

export function getHardwareKey(HardwareKeyCls) {
  var os = require('OS');

  var hostname = os.hostname();
  var platform = os.platform();

  var name = hostname;
  var key = "electron_" + hostname + "_" + platform;

  return new HardwareKeyCls(name, key);
}
