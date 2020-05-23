import {PlatformAPIBase} from '../common/platform_api.js';

export class PlatformAPI extends PlatformAPIBase {
  constructor() {
    super();
  }
  
  getProcessMemoryPromise() {
    return new Promise(); //never fulfills
  }

  saveDialog() {
  }
  
  openDialog() {
  }
  
  numberOfCPUs() {
    return navigator.hardwareConcurrency;
  }

  alertDialog(msg) {
    alert(msg);
  }

  questionDialog(msg) {

  }
}

export var PlatCapab = {
  NativeAPI      : false,
  saveFile      : false,
  saveDialog    : true,
  openDialog    : true,
  openLastFile : false,
  exitCatcher   : false
};
