export class PlatformAPIBase {
  constructor() {
  }
  
  init() {
  }
  
  //returns a promise
  save_file(path_handle, name, databuf, type) {
  }
  
  //returns a promise
  save_dialog(name, databuf, type) {
  }
  
  //returns a promise
  open_dialog(type) {
  }
  
  //returns a promise
  open_last_file() {
  }
  
  //handler is a function, returns true if exit should be allowed
  exit_catcher(handler) {
  }
}

export class NativeAPIBase {
  
}

