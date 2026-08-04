"use strict";

import * as config from '../config/config.js';

export class License {
  owner : string
  email : string
  /* Issue and expiry dates, as whatever the server hands back. */
  issued : string
  expiration : string
  max_devices : number
  used_devices : number;

  /* NOTE: `key` is accepted and then dropped -- nothing stores it. */
  constructor(owner : string, email : string, issued : string,
              expiration : string, max_devices : number,
              used_devices : number, key : string) {
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
  deviceName : string
  deviceKey : string;

  constructor(deviceName : string, deviceKey : string) {
    this.deviceName = deviceName;
    this.deviceKey = deviceKey;
  }
};

import * as license_electron from "./license_electron.js";

/* NOTE: returns an Error rather than throwing it outside electron. */
export function getHardwareKey() : HardwareKey | Error {
  if (config.ELECTRON_APP_MODE) {
    return license_electron.getHardwareKey(HardwareKey);
  } else {
    return new Error("can't get hardware key");
  }
}
