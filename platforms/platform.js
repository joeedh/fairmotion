import * as config from '../src/config/config.js';

import * as html5 from './html5/platform_html5.js';
import * as electron from './Electron/theplatform.js';
import * as phonegap from './PhoneGap/platform_phonegap.js';
import * as chromeapp from './chromeapp/platform_chromeapp.js';

let mod;

if (config.ELECTRON_APP_MODE) {
  mod = electron;
  config.ORIGIN = ".";

  let fs = require("fs");

  if (fs.existsSync("./resources/app/fcontent")) {
    config.ORIGIN = "./resources/app";
  }
} else if (config.HTML5_APP_MODE) {
  mod = html5;
} else if (config.PHONE_APP_MODE) {
  mod = phonegay;
} else if (config.CHROME_APP_MODE) {
  mod = chromeapp;
}

if (mod.app === undefined) {
  mod.app = new mod.PlatformAPI();
}

window.error_dialog = mod.app.errorDialog;

//forward exports
for (let k in mod) {
  _es6_module.add_export(k, mod[k]);
}
