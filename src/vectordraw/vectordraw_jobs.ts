"use strict";

import {MESSAGES} from './vectordraw_jobs_base.js';

let MS = MESSAGES;

let Debug = false;
let FREEZE_WHILE_DRAWING = false;

import * as platform from '../../platforms/platform.js';
import * as config from '../config/config.js';

let MAX_THREADS = platform.app.numberOfCPUs() + 1;

MAX_THREADS = Math.max(MAX_THREADS, 2);

//prioritize fast startup in html5 mode, at least for now
if (config.HTML5_APP_MODE || config.NO_RENDER_WORKERS) {
  MAX_THREADS = 1;
}

window.MAX_THREADS = MAX_THREADS;

/* What goes over the wire to a render worker.  `data` doubles as the
   transfer list. */
export type ThreadMessage = {
  type : number,
  msgid : number,
  data : Transferable[] | undefined
};

/* A finished render job hands back the worker's transferToImageBitmap(). */
export type RenderJobCallback = (image : ImageBitmap) => void;

//uses web workers
export class Thread {
  dead: boolean
  ready: boolean
  lock: number
  /* msgid -> the promise resolver waiting on that job. */
  callbacks: {[msgid : number] : RenderJobCallback}
  ownerid_msgid_map: {[ownerid : number] : number}
  msgid_ownerid_map: {[msgid : number] : number}
  cancelset: Set<number>
  freezelvl: number;
  /* NOTE: written only by clearOutstandingJobs(), which meant `callbacks`;
     nothing reads it. */
  callback!: object;

  id : number;
  manager : ThreadManager;
  worker : Worker | undefined;
  ondone : (() => void) | null;

  /* Dead scaffolding: nothing ever pushes to the queue, and the lock/owner
     pair has no caller. */
  queue : ThreadMessage[];
  owner : object | undefined;
  msgstate : undefined;

  constructor(worker: Worker, id: number, manager: ThreadManager) {
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

    this.ondone = null;

    this.callbacks = {};
    this.ownerid_msgid_map = {};
    this.msgid_ownerid_map = {};
    this.cancelset = new Set();

    this.freezelvl = 0;
  }

  cancelRenderJob(ownerid : number) {
    if (this.cancelset.has(ownerid)) {
      return;
    }

    if (ownerid in this.ownerid_msgid_map) {
      if (Debug) console.log("cancelling job ", ownerid, "in thread", this.manager.threads.indexOf(this), "freezelvl:", this.freezelvl, "_block_drawing:", window._block_drawing);
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
  postRenderJob(ownerid : number, commands : Float64Array,
                datablocks? : Transferable[]) {
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

    return new Promise<ImageBitmap>((accept, reject) => {
      let callback = (data : ImageBitmap) => {
        accept(data);
      }

      this.callbacks[id] = callback;
      this.postMessage(MS.RUN, id);
    });
  }

  clearOutstandingJobs() {
    this.freezelvl = 0;
    this.postMessage(MS.CLEAR_QUEUE, 0);
    /* NOTE: `callback` is a typo for `callbacks`, so the outstanding job
       resolvers are never actually dropped. */
    this.callback = {};
    this.msgid_ownerid_map = {};
    this.ownerid_msgid_map = {};
  }

  onmessage(e : MessageEvent) {
    switch (e.data.type) {
      case MS.WORKER_READY:
        console.log("%c Vectordraw worker ready", "color: blue");
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

        if (Debug) console.log("thread", this.manager.threads.indexOf(this), "freezelvl:", this.freezelvl, "_block_drawing:", window._block_drawing);

        //if (Debug) console.log(cb, e.data.data[0]);
        cb(e.data.data[0]);

        if (this.freezelvl <= 0) {
          this.manager.on_thread_done(this);
          this.freezelvl = 0;
        }

        break;
    }

    //if (Debug) console.log("event message in main thread", e);
  }

  tryLock(owner : object) {
    if (this.lock === 0 || this.owner === owner) {
      return true;
    }

    return false;
  }

  tryUnlock(owner : object) {
    if (this.lock === 0 || this.owner !== owner) {
      return false;
    }

    this.owner = undefined;
    this.lock = 0;

    return true;
  }

  postMessage(type : number, msgid : number, transfers? : Transferable[]) {
    this.worker!.postMessage({
      type : type,
      msgid: msgid,
      data : transfers
    }, transfers ?? []);
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
  drawing: boolean
  thread_idmap: {[id : number] : Thread}
  _idgen: number
  _rthread_idgen: number;
  locked_drawing: boolean = false;

  threads : Thread[];
  max_threads : number;
  /* time_ms() at the last startDrawing(); drives the timeout watchdog. */
  start_time : number | undefined;
  /* Set once any worker has reported in. */
  has_ready_thread! : boolean;

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
      if (this.drawing && time_ms() - this.start_time! > 750) {
        console.log("Draw timed out; aborting draw freeze");
        this.endDrawing();
      }

      return;
    }, 750)
  }

  setMaxThreads(n : number) {
    if (n === undefined || typeof n != "number" || n < 0) {
      throw new Error("n must be a number");
    }

    this.max_threads = n;
    while (this.threads.length > n) {
      let thread = this.threads.pop()!;
      thread.worker!.terminate();
    }

    while (this.threads.length < n) {
      if (config.HAVE_SKIA) {
        this.spawnThread("vectordraw_skia_worker.js");
      } else {
        this.spawnThread("vectordraw_canvas2d_worker.js");
      }
    }
  }

  startDrawing(nonBlocking = false) {
    this.drawing = true;
    this.start_time = time_ms();

    if (!nonBlocking && FREEZE_WHILE_DRAWING) {
      this.locked_drawing = true;
      //console.log("%cFreeze Drawing", "color : orange;");
      window._block_drawing++;
    }
  }

  endDrawing() {
    this.drawing = false;

    if (this.locked_drawing) {
      //console.log("%cUnfreeze Drawing", "color : orange;");
      window._block_drawing--;
      this.locked_drawing = false;
    }
  }

  spawnThread(source : string) {
    let worker = new Worker(source);
    let thread = new Thread(worker, this._idgen++, this);

    this.thread_idmap[thread.id] = thread;
    this.threads.push(thread);

    return thread;
  }

  endThread(thread : Thread) {
    if (thread.worker === undefined) {
      console.warn("Double call to ThreadManager.endThread()");
      return;
    }

    this.threads.remove(thread);
    delete this.thread_idmap[thread.id];

    thread.close();
  }

  getRandomThread() {
    /* `while (1)` reads as possibly-terminating, which made every caller see a
       `Thread | undefined`. */
    while (true) {
      let ri = ~~(Math.random()*this.threads.length*0.99999);

      if (this.threads[ri].ready)
        return this.threads[ri];
    }
  }

  postRenderJob(ownerid : number, commands : Float64Array,
                datablocks? : Transferable[], nonBlocking = false) {
    if (!this.drawing) {
      this.startDrawing(nonBlocking);
    }

    let thread;

    //we want at last one gpu-capable render thread
    if (this.threads.length === 0) {
      thread = this.spawnThread("vectordraw_canvas2d_worker.js");
      //thread = this.spawnThread("vectordraw_skia_worker.js");
      thread.ready = true; //canvas2d worker starts out in ready state

      //*
      for (let i = 0; i < this.max_threads - 1; i++) {
        if (config.HAVE_SKIA) {
          this.spawnThread("vectordraw_skia_worker.js");
        } else {
          this.spawnThread("vectordraw_canvas2d_worker.js");
        }
      }

      //*/
    } else {
      thread = this.getRandomThread();
    }

    let ret = thread.postRenderJob(ownerid, commands, datablocks);

    return ret;
  }

  get haveJobs() {
    for (let thread2 of this.threads) {
      if (thread2.freezelvl > 0) {
        return true;
      }
    }

    return false;
  }

  on_thread_done(thread : Thread) {
    let ok = true;

    for (let thread2 of this.threads) {
      if (thread2.freezelvl > 0) {
        ok = false;
        break;
      }
    }

    if (ok) {
      if (Debug) console.warn("thread done");

      window._all_draw_jobs_done();

      if (this.drawing) {
        this.endDrawing();
      }

      this.checkMemory();
    }
  }


  checkMemory() {
    let promise = platform.app.getProcessMemoryPromise();
    if (!promise)
      return;

    promise.then((memory : number) => {
      //console.log("Memory in use:", (memory/1024/1024).toFixed(1));
    })
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

  cancelRenderJob(ownerid : number) {
    for (let thread of this.threads) {
      if (ownerid in thread.ownerid_msgid_map) {
        thread.cancelRenderJob(ownerid);
      }
    }
  }
}

export var manager = new ThreadManager();

/* NOTE: a test() helper spawning a canvas2d worker sat here.  It had no
   callers, and its one postMessage() passed a string where the numeric opcode
   goes and the transfer list where the msgid goes. */