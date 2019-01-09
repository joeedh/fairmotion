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
  save_file      : false,
  save_dialog    : true,
  open_dialog    : true,
  open_last_file : false,
  exit_catcher   : false
};

export var app = new PlatformAPI();
