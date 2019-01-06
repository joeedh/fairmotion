"use strict";

import {MESSAGES} from 'vectordraw_jobs_base';
let MS = MESSAGES;

let Debug = false;

let MAX_THREADS = 2;

//uses web workers
export class Thread {
  constructor(worker, id, manager) {
    this.id = id;
    this.manager = manager;
    this.worker = worker;
    this.dead = false;
    this.queue = []; //message queue
    
    this.lock = 0;
    this.owner = undefined;
    
    this.msgstate = undefined;
    
    worker.onmessage = this.onmessage.bind(this);
    this.callbacks = {};
    this.ownerid_msgid_map = {};
    this.msgid_ownerid_map = {};
  }
  
  cancelRenderJob(ownerid) {
    if (ownerid in this.ownerid_msgid_map) {
      let oldid = this.msgid_ownerid_map[ownerid];
    
      this.postMessage(MS.CANCEL_JOB, oldid);
      
      delete this.ownerid_msgid_map[ownerid];
      delete this.msgid_ownerid_map[oldid];
    } else {
      if (Debug) console.log("Bad owner id", ownerid);
    }
  }
  
  //cancels any previous thread from ownerid
  postRenderJob(ownerid, commands, datablocks) {
    let id = this.manager._rthread_idgen++;
    
    this.ownerid_msgid_map[ownerid] = id;
    
    this.postMessage(MS.NEW_JOB, id, undefined);
    this.postMessage(MS.SET_COMMANDS, id, [commands.buffer]);
    
    if (datablocks !== undefined) {
      for (let block of datablocks) {
        this.postMessage(MS.ADD_DATABLOCK, id, [block]);
      }
    }
    
    return new Promise((accept, reject) => {
      let callback = (data) => {
        accept(data);
      }
  
      
      this.callbacks[id] = callback;
      this.postMessage(MS.RUN, id);
    });
  }
  
  clearOutstandingThreads() {
  
  }
  
  onmessage(e) {
    switch (e.data.type) {
      case MS.RESULT:
        let id = e.data.msgid;
        
        if (!(id in this.callbacks)) {
          if (Debug) console.warn("Renderthread callback not found for: ", id);
          return;
        }
        
        let cb = this.callbacks[id];
        delete this.callbacks[id];
        
        if (Debug) console.log(e.data.data[0]);
        cb(e.data.data[0]);
        break;
    }
  
    if (Debug) console.log("event message in main thread", e);
  }
  
  tryLock(owner) {
    if (this.lock == 0 || this.owner === owner) {
      return true;
    }
    
    return false;
  }
  
  tryUnlock(owner) {
    if (this.lock == 0 || this.owner !== owner) {
      return false;
    }
    
    this.owner = undefined;
    this.lock = 0;
    
    return true;
  }
  
  postMessage(type, msgid, transfers) {
    this.worker.postMessage({
      type  : type,
      msgid : msgid,
      data  : transfers
    }, transfers);
  }
  
  close() {
    if (this.worker !== undefined) {
      this.worker.terminate();
      this.worker = undefined;
    } else {
      console.warn("Worker already killed once", this.id);
    }
  }
}

export class ThreadManager {
  constructor() {
    this.threads = [];
    this.thread_idmap = {};
    this._idgen = 0;
    this._rthread_idgen = 0;
    this.max_threads = MAX_THREADS;
  }
  
  spawnThread(source) {
    let worker = new Worker(source);
    let thread = new Thread(worker, this._idgen++, this);
    
    this.thread_idmap[thread.id] = thread;
    this.threads.push(thread);
    
    return thread;
  }
  
  endThread(thread) {
    if (thread.worker === undefined) {
      console.warn("Double call to ThreadManager.endThread()");
      return;
    }
    
    this.threads.remove(thread);
    delete this.thread_idmap[thread.id];
    
    thread.close();
  }
  
  getRandomThread(source) {
    if (this.threads.length < this.max_threads) {
      return this.spawnThread(source);
    }
    
    let ri = ~~(Math.random()*this.threads.length*0.99999);
    return this.threads[ri];
  }
  
  postRenderJob(ownerid, commands, datablocks) {
    let thread = this.getRandomThread("vectordraw_canvas2d_worker.js");
    let ret = thread.postRenderJob(ownerid, commands, datablocks);
    
    return ret;
  }
  
  cancelAllJobs() {
    //kill all threads, we'll re-spawn new ones as needed
    for (let thread of this.threads) {
      thread.worker.terminate();
    }
    
    this.threads = [];
    this.thread_idmap = {};
  }
  
  cancelRenderJob(ownerid) {
    for (let thread of this.threads) {
      if (ownerid in thread.ownerid_msgid_map) {
        thread.cancelRenderJob(ownerid);
      }
    }
  }
}

export var manager = new ThreadManager();

export function test() {
  let thread = manager.getRandomThread("vectordraw_canvas2d_worker.js");
  
  thread.postMessage("yay", [new ArrayBuffer(512)]);
  
  return thread;
}