export class PlatformAPIBase {
  constructor() {
  }
  
  init() {
  }
  
  //returns a promise
  saveFile(path_handle, name, databuf, type) {
  }
  
  numberOfCPUs() {
    return 2;
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

