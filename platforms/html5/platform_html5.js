import {PlatformAPIBase} from '../common/platform_api.js';

let clipdata = {
  name : "nothing",
  mime : "nothing",
  data : undefined
};

export class PlatformAPI extends PlatformAPIBase {
  constructor() {
    super();
  }
  
  getProcessMemoryPromise() {
    return new Promise(() => {}); //never fulfills
  }

  saveDialog() {
  }
  
  openDialog() {
  }

  pushClipboardData(name, mime, data) {
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

  alertDialog(msg) {
    alert(msg);
  }

  questionDialog(msg) {
    return new Promise((accept, reject) => {
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
