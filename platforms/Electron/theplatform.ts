import {PlatformAPIBase} from '../common/platform_api.js';

/*detect prescence of node*/
let haveNode = typeof global !== "undefined" && typeof require !== "undefined";
let haveElectron = haveNode && require("electron");

if (!haveElectron) {
  let G;
  if (typeof global === "undefined") {
    if (typeof window !== "undefined") {
      G = window;
    } else if (typeof self !== "undefined") {
      G = self;
    } else {
      G = globalThis;
    }

    //make require stub
    Reflect.set(G, "require", () => {
      return {}
    });
  }
}

let mod = require("electron");

if (!mod.remote) {
  class MenuItem {

  }

  class Menu {

  }

  console.warn("Stubbing out electron.remote; 10.0.2 bug");
  mod.remote = {
    nativeTheme : {

    },
    MenuItem : MenuItem,
    Menu : Menu,
    nativeImage : mod.nativeImage
  }
}

export class ElectronPlatformAPI extends PlatformAPIBase {
  constructor() {
    super();
  }

  init() {
  }

  getProcessMemoryPromise() {
    return  new Promise<number>((accept, reject) => {
      require("process").getProcessMemoryInfo().then((data : {private : number}) => {
        let blink = require("process").getBlinkMemoryInfo();

        accept(data.private*1024 + blink.total*1024);
      })
    });
  }

  errorDialog(title : unknown, msg? : unknown) {
    alert(String(title) + ": " + String(msg));
  }

  //returns a promise
  saveFile(path_handle : string, name : string, databuf : ArrayBufferView, type : string) {
    let fs = require("fs");

    console.warn("TESTME");

    return new Promise<void>((accept, reject) => {
      fs.writeFile(path_handle, databuf, () => {
        accept();
      });
    });
  }

  //returns a promise
  openFile(path_handle : string) {
    let fs = require("fs");
    return new Promise<Uint8Array>((accept, reject) => {
      let buf;

      try {
        buf = fs.readFileSync(path_handle);
      } catch (error) {
        return reject(String(error));
      }

      accept(buf);
    });
  }
  
  numberOfCPUs() {
    let os = require("os");
    let cpus = os.cpus();
    
    let tot=0;
    for (let cpu of cpus) {
      //try to ignore hyperthreading
      if (cpu.model.toLowerCase().search("intel") >= 0) {
        tot += 0.5;
      } else {
        tot += 1.0;
      }
    }
    
    tot = ~~Math.ceil(tot);
    
    console.log(tot, cpus);
    
    return tot;
  }
  
  //returns a promise
  saveDialog(name : string, databuf : ArrayBufferView, type : string) {
  }

  //returns a promise
  openDialog(type : string) {
  }
  
  //returns a promise
  openLastFile() {
  }
  
  //handler is a function, returns true if exit should be allowed
  exitCatcher(handler : () => boolean) {
  }
  
  quitApp() {
    close();
  }

  alertDialog(msg : string) {
    return new Promise<void>((accept, reject) => {
      alert(msg);
      accept();
    })
  }

  questionDialog(msg : string) {
    return new Promise<boolean>((accept, reject) => {
      let ret = confirm(msg);
      accept(ret);
    });

  }
}

export var app = new ElectronPlatformAPI();
