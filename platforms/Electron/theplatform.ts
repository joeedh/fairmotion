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
    G.require = () => {
      return {}
    }
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

export class ElectronPlatformAPI {
  constructor() {
  }
  
  init() {
  }

  getProcessMemoryPromise() {
    return  new Promise((accept, reject) => {
      require("process").getProcessMemoryInfo().then((data) => {
        let blink = require("process").getBlinkMemoryInfo();

        accept(data.private*1024 + blink.total*1024);
      })
    });
  }

  errorDialog(title, msg) {
    alert(title + ": " + msg);
  }

  //returns a promise
  saveFile(path_handle, name, databuf, type) {
    let fs = require("fs");

    console.warn("TESTME");

    return new Promise((accept, reject) => {
      fs.writeFile(path_handle, databuf, () => {
        accept();
      });
    });
  }

  //returns a promise
  openFile(path_handle) {
    let fs = require("fs");
    return new Promise((accept, reject) => {
      let buf;

      try {
        buf = fs.readFileSync(path_handle);
      } catch (error) {
        return reject(error.toString());
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
    close();
  }

  alertDialog(msg) {
    return new Promise((accept, reject) => {
      alert(msg);
      accept();
    })
  }

  questionDialog(msg) {
    return new Promise((accept, reject) => {
      let ret = confirm(msg);
      accept(ret);
    });

  }
}

export var app = new ElectronPlatformAPI();
