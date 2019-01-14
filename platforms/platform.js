import * as config from 'config';

import * as html5 from 'platform_html5';
import * as electron from 'theplatform';
import * as phonegap from 'platform_phonegap';
import * as chromeapp from 'platform_chromeapp';
import {wasm_binary} from "../src/wasm/load_wasm";

let mod;

if (config.ELECTRON_APP_MODE) {
  mod = electron;
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

//forward exports
for (let k in mod) {
  _es6_module.add_export(k, mod[k]);
}
