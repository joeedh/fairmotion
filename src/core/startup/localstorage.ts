"use strict";

/*
 * window.myLocalStorage.
 *
 * This is a pre-bundle classic script, not a module, because config.js and
 * const.js read `myLocalStorage.use_canvas2d` at module scope. The legacy
 * build evaluated module bodies lazily, so startup() had already installed
 * this by then; an esbuild bundle evaluates them the moment it loads, so the
 * storage object has to exist before the bundle does.
 */

//localstorage variant
window.MyLocalStorage_LS = class MyLocalStorage_LS {
  set(key: string, val: string): void {
    localStorage[key] = val;
  }

  getCached(key: string): string {
    return localStorage[key];
  }

  getAsync(key: string): Promise<string> {
    return new Promise(function (accept, reject) {
      if (key in localStorage && localStorage[key] !== undefined) {
        accept(localStorage[key]);
      }
    });
  }

  hasCached(key: string): boolean {
    return key in localStorage;
  }
};

window.MyLocalStorage_ChromeApp = class MyLocalStorage_ChromeApp {
  /* null marks a key chrome.storage failed to read, so getCached() can tell
     "known missing" from "never asked". */
  cache: {[key: string]: string | null};

  constructor() {
    this.cache = {};
  }

  set(key: string, val: string): void {
    let obj: {[key: string]: string} = {};
    obj[key] = val;

    chrome.storage.local.set(obj);
    this.cache[key] = val;
  }

  getCached(key: string): string {
    return this.cache[key];
  }

  getAsync(key: string): Promise<string> {
    let this2 = this;

    return new Promise(function (accept, reject) {
      chrome.storage.local.get(key, function (value) {
        if (chrome.runtime.lastError !== undefined) {
          this2.cache[key] = null;
          reject(chrome.runtime.lastError.string);
        } else {
          if (value !== {} && value !== undefined && key in value) {
            value = value[key];
          }

          if (typeof value === "object")
            value = JSON.stringify(value);

          this2.cache[key] = value;
          accept(value);
        }
      });
    });
  }

  hasCached(key) {
    return key in this.cache;
  }
};

/* Same test config.js uses for CHROME_APP_MODE; the tags are deferred, so the
   document is parsed by the time this runs. */
if (window.CHROME_APP_MODE || document.getElementById("GoogleChromeAppMode") !== null) {
  window.CHROME_APP_MODE = true;
  window.myLocalStorage = new window.MyLocalStorage_ChromeApp();
} else {
  window.myLocalStorage = new window.MyLocalStorage_LS();
}
