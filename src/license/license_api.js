"use strict";

import * as config from '../config/config.js';

export class License {
  constructor(owner, email, issued, expiration, max_devices, used_devices, key) {
    this.owner = owner;
    this.email = email;
    this.issued = issued;
    this.expiration = expiration;
    this.max_devices = max_devices;
    this.used_devices = used_devices;
  }
}

//in days
export var MAX_EXPIRATION_TIME = 355; //one year

export class HardwareKey {
  constructor(deviceName, deviceKey) {
    this.deviceName = deviceName;
    this.deviceKey = deviceKey;
  }
};

import * as license_electron from "./license_electron.js";
 
export function getHardwareKey() {
  if (config.ELECTRON_APP_MODE) {
    return license_electron.getHardwareKey(HardwareKey);
  } else {
    return new Error("can't get hardware key");
  }
}
