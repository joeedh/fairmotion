import cconst from '../../src/path.ux/scripts/config/const.js';
import type {ClipboardEntry} from '../../src/path.ux/scripts/config/const.js';

let default_clipfuncs = {
  setClipboardData : cconst.setClipboardData,
  getClipboardData : cconst.getClipboardData
};

export class PlatformAPIBase {
  constructor() {
  }
  
  init() {
  }

  /**
   default implementation uses path.ux.
   */
  setClipboardData(name : string, mime : string, data : string) {
    default_clipfuncs.setClipboardData(name, mime, data);
  }

  /**
    desiredMimes is either a string, or an array of strings.

    default implementation uses path.ux.

    returns {
    name : arbitrary name attached to data (optional),
    mime : mime type of data
    data : data
  }
   */
  /* NOTE: this forwarded (name, mime, data) -- path.ux's getClipboardData takes
     a mime list, and `mime`/`data` are not declared here, so every call threw a
     ReferenceError (`name` resolved to window.name). */
  getClipboardData(desiredMimes : string | string[] = "text/plain") : ClipboardEntry | undefined {
    return default_clipfuncs.getClipboardData(desiredMimes);
  }

  //returns a promise
  saveFile(path_handle : string, name : string, databuf : ArrayBufferView, type : string) {
  }

  /* The stubs that have to hand back a promise throw instead of returning
     undefined; the caller's .then() threw a TypeError one line later anyway. */
  openFile(path_handle : string) : Promise<Uint8Array> {
    throw new Error("openFile is not supported on this platform");
  }

  getProcessMemoryPromise() : Promise<number> {
    return new Promise<number>(() => {});

  }
  
  numberOfCPUs() {
    return 2;
  }

  /* `unknown` because every caller in editors/app_ops.ts passes
     (ctx, title, undefined, true); see the note on PlatformErrorDialog. */
  errorDialog(title : unknown, msg? : unknown) {
    console.warn(String(title) + ": " + String(msg));
    alert(String(title) + ": " + String(msg));
  }

  //returns a promise
  saveDialog(name : string, databuf : ArrayBufferView, type : string) {
  }

  //returns a promise
  openDialog(type : string) {
  }

  //returns a promise
  openLastFile() {
  }

  //handler is a function, returns true if exit should be allowed
  exitCatcher(handler : () => boolean) {
  }

  quitApp() {

  }

  //returns a promise
  alertDialog(msg : string) {

  }

  questionDialog(msg : string) : Promise<boolean> {
    throw new Error("questionDialog is not supported on this platform");
  }
}

//for debugging purposes
window.setZoom = function(z) {
  let webFrame = require('electron').webFrame;

// Set the zoom factor to 200%
  webFrame.setZoomFactor(z);
}


export class NativeAPIBase {
  
}

