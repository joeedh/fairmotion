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
}

export class NativeAPIBase {
  
}

