import {PlatformAPIBase} from 'platform_api';

export class ElectronPlatformAPI {
  constructor() {
  }
  
  init() {
  }
  
  //returns a promise
  saveFile(path_handle, name, databuf, type) {
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
}

export var app = new ElectronPlatformAPI();
