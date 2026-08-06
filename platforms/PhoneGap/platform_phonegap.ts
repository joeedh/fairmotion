import {PlatformAPIBase} from '../common/platform_api.js';

export class PlatformAPI extends PlatformAPIBase {
  constructor() {
    super();
  }
  
  /* NOTE: this was `new Promise()`, with no executor -- a TypeError, not a
     promise that never fulfills. */
  getProcessMemoryPromise() {
    return new Promise<number>(() => {}); //never fulfills
  }

  saveDialog() {
  }
  
  openDialog() {
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

export var app = new PlatformAPI();

