import {PlatformAPIBase} from 'platform_api';

export class PlatformAPI extends PlatformAPIBase {
  constructor() {
    super();
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
