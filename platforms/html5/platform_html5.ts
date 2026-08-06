import {PlatformAPIBase} from '../common/platform_api.js';
import type {ClipboardEntry} from '../../src/path.ux/scripts/config/const.js';

let clipdata : ClipboardEntry = {
  name : "nothing",
  mime : "nothing",
  data : undefined
};

export class PlatformAPI extends PlatformAPIBase {
  constructor() {
    super();
  }
  
  getProcessMemoryPromise() {
    return new Promise<number>(() => {}); //never fulfills
  }

  saveDialog() {
  }
  
  openDialog() {
  }

  pushClipboardData(name : string, mime : string, data : string) {
    clipdata = {
      name : name,
      mime : mime,
      data : data
    };
  }

  /**
   return {
    idname : arbitrary name attached to data (optional),
    mime : mime type of data
    data : data
  }
   */
  getClipboardData() {
    if (clipdata.mime === "nothing") {
      return undefined;
    }

    return clipdata;
  }

  numberOfCPUs() {
    return navigator.hardwareConcurrency;
  }

  alertDialog(msg : string) {
    alert(msg);
  }

  questionDialog(msg : string) {
    return new Promise<boolean>((accept, reject) => {
      accept(confirm(msg));

    });
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
