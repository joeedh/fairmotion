import * as config from '../src/config/config.js';
import type {PlatformAPIBase} from './common/platform_api.js';

import * as html5 from './html5/platform_html5.js';
import * as electron from './Electron/theplatform.js';
import * as phonegap from './PhoneGap/platform_phonegap.js';
import * as chromeapp from './chromeapp/platform_chromeapp.js';

/* Only these three names are read off the selected platform module, and no
   platform exports all three. */
interface PlatformModule {
  app? : PlatformAPIBase;
  PlatformAPI? : new () => PlatformAPIBase;
  PlatCapab? : {[k : string] : boolean};
}

let mod : PlatformModule | undefined;

if (config.ELECTRON_APP_MODE) {
  mod = electron;
  config.setOrigin(".");

  let fs = require("fs");

  if (fs.existsSync("./resources/app/fcontent")) {
    config.setOrigin("./resources/app");
  }
} else if (config.HTML5_APP_MODE) {
  mod = html5;
  let o = document.location.href;

  if (o.endsWith("/index.html")) {
    o = o.slice(0, o.length - ("/index.html").length);
  }
  config.setOrigin(o);
} else if (config.PHONE_APP_MODE) {
  mod = phonegap;
} else if (config.CHROME_APP_MODE) {
  mod = chromeapp;
}

/* The old module emulation re-exported every key of the selected platform
   module dynamically, and wrote the lazily-built `app` back onto it. ESM
   namespaces are sealed, so `app` is built here and the three names consumers
   actually use are forwarded explicitly. */
function selectApp(m : PlatformModule | undefined) : PlatformAPIBase {
  if (m === undefined) {
    throw new Error("no platform selected; check config's *_APP_MODE flags");
  }

  if (m.app !== undefined) {
    return m.app;
  }

  if (m.PlatformAPI === undefined) {
    throw new Error("platform module exports neither app nor PlatformAPI");
  }

  return new m.PlatformAPI();
}

export const app = selectApp(mod);
export const PlatformAPI = mod?.PlatformAPI;
export const PlatCapab = mod?.PlatCapab;

window.error_dialog = app.errorDialog;
