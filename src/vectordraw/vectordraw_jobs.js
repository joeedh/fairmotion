"use strict";

import * as eventmanager from 'eventmanager';
import {MESSAGES} from 'vectordraw_jobs_base';
let MS = MESSAGES;

let Debug = false;
let freeze_while_drawing = true;

let MAX_THREADS = 5;

//uses web workers
export class Thread {
  constructor(worker, id, manager) {
    this.id = id;
    this.manager = manager;
    this.worker = worker;
    this.dead = false;
    this.queue = []; //message queue
    this.ready = false;
    
    this.lock = 0;
    this.owner = undefined;
    
    this.msgstate = undefined;
    
    worker.onmessage = this.onmessage.bind(this);
    this.callbacks = {};
    this.ownerid_msgid_map = {};
    this.msgid_ownerid_map = {};
    this.cancelset = new Set();
    
    this.freezelvl = 0;
  }
  
  cancelRenderJob(ownerid) {
    if (this.cancelset.has(ownerid)) {
      return;
    }
    
    if (ownerid in this.ownerid_msgid_map) {
      if (Debug) console.log("cancelling job ", ownerid, "in thread", this.manager.threads.indexOf(this), "freezelvl:", this.freezelvl);
      this.freezelvl--;
      
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
    if (!this.manager.drawing && freeze_while_drawing) {
      this.manager.startDrawing();
    }
    
    let id = this.manager._rthread_idgen++;
    if (Debug) console.log("thread", this.manager.threads.indexOf(this), "freezelvl:", this.freezelvl);
    this.freezelvl++;
  
    this.ownerid_msgid_map[ownerid] = id;
    this.msgid_ownerid_map[id] = ownerid;
    
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
  
  clearOutstandingJobs() {
    this.freezelvl = 0;
    this.postMessage(MS.CLEAR_QUEUE, 0);
    this.callback = {};
    this.msgid_ownerid_map = {};
    this.ownerid_msgid_map = {};
  }
  
  onmessage(e) {
    switch (e.data.type) {
      case MS.WORKER_READY:
        this.ready = true;
        this.manager.has_ready_thread = true;
        break;
      case MS.RESULT:
        let id = e.data.msgid;
        
        if (!(id in this.callbacks)) {
          if (Debug) console.warn("Renderthread callback not found for: ", id);
          return;
        }
        
        let ownerid = this.msgid_ownerid_map[id];
        if (ownerid === undefined) { //message was cancelled!
          if (Debug) console.log("failed to find owner for", id, this);
          return;
        }
        
        delete this.ownerid_msgid_map[ownerid];
        delete this.msgid_ownerid_map[id];
        
        let cb = this.callbacks[id];
        delete this.callbacks[id];
        this.freezelvl--;
  
        if (Debug) console.log("thread", this.manager.threads.indexOf(this), "freezelvl:", this.freezelvl);
        if (this.freezelvl == 0) {
          this.manager.on_thread_done(this);
        }
        
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
    this.drawing = false;
    this.thread_idmap = {};
    this._idgen = 0;
    this._rthread_idgen = 0;
    this.max_threads = MAX_THREADS;
    this.start_time = undefined;
    
    //make thread timeout checker
    window.setInterval(() => {
      if (this.drawing && time_ms() - this.start_time > 250) {
        console.log("Draw timed out; aborting draw freeze");
        this.endDrawing();
      }
      
      return;
    }, 150)
  }
  
  startDrawing() {
    this.drawing = true;
    this.start_time = time_ms();
    
    if (freeze_while_drawing)
      eventmanager.manager.freeze();
  }
  
  endDrawing() {
    this.drawing = false;
    
    if (freeze_while_drawing)
      eventmanager.manager.unfreeze();
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
  
  getRandomThread() {
    while (1) {
      let ri = ~~(Math.random() * this.threads.length * 0.99999);
      
      if (this.threads[ri].ready)
        return this.threads[ri];
    }
  }
  
  postRenderJob(ownerid, commands, datablocks) {
    let thread;
    
    //we want at last one gpu-capable render thread
    if (this.threads.length == 0) {
      thread = this.spawnThread("vectordraw_canvas2d_worker.js");
      thread.ready = true; //canvas2d worker starts out in ready state
      
      //*
      for (let i=0; i<this.max_threads-1; i++) {
        this.spawnThread("vectordraw_skia_worker.js");
      }
      //*/
    } else {
      thread = this.getRandomThread();
    }
  
    let ret = thread.postRenderJob(ownerid, commands, datablocks);
    return ret;
  }
  
  on_thread_done(thread) {
    let ok = true;
    
    for (let thread2 of this.threads) {
      if (thread2.freezelvl > 0) {
        ok = false;
        break;
      }
    }
    
    if (ok) {
      if (Debug) console.log("thread done");
      
      if (this.drawing && freeze_while_drawing) {
        this.endDrawing();
      }
    }
  }
  
  cancelAllJobs() {
    //kill all threads, we'll re-spawn new ones as needed
    for (let thread of this.threads) {
      thread.clearOutstandingJobs();
      
      this.on_thread_done(thread);
    }
    
    //this.threads = [];
    //this.thread_idmap = {};
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
  let thread = manager.spawnThread("vectordraw_canvas2d_worker.js");
  
  thread.postMessage("yay", [new ArrayBuffer(512)]);
  
  return thread;
}