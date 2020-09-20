import * as pathux_const from '../../src/path.ux/scripts/config/const.js';

let default_clipfuncs = {
  setClipboardData : pathux_const.setClipboardData,
  getClipboardData : pathux_const.getClipboardData
};

export class PlatformAPIBase {
  constructor() {
  }
  
  init() {
  }

  /**
   default implementation uses path.ux.
   */
  setClipboardData(name, mime, data) {
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
  getClipboardData(desiredMimes="text/plain") {
    return default_clipfuncs.getClipboardData(name, mime, data);
  }

  //returns a promise
  saveFile(path_handle, name, databuf, type) {
  }
  //returns a promise
  openFile(path_handle) {
  }

  getProcessMemoryPromise() {
    return new Promise(() => {});

  }
  
  numberOfCPUs() {
    return 2;
  }

  errorDialog(title, msg) {
    console.warn(title + ": " + msg);
    alert(title + ": " + msg);
  }

  //returns a promise
  saveDialog(name, databuf, type) {
  }
  
  //returns a promise
  openDialog(type) {
  }
  
  //returns a promise
  openLastFile() {
  }
  
  //handler is a function, returns true if exit should be allowed
  exitCatcher(handler) {
  }
  
  quitApp() {
  
  }

  //returns a promise
  alertDialog(msg) {

  }

  //returns a promise
  questionDialog(msg) {

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

