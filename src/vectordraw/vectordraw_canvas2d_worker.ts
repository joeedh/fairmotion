"use strict";

/* Bundled to a classic worker script by buildtools/esbuild.mjs, so this import
   is inlined; the worker global still has no module loader of its own. */
import { OPCODES, MESSAGES } from "./vectordraw_jobs_base.js";

let Debug = false;

if (Array.prototype.remove === undefined) {
  Array.prototype.remove = function <T>(this: T[], item: T, throw_error = true) {
    let idx = this.indexOf(item);

    if (idx < 0) {
      if (throw_error) {
        throw new Error("Item not in array");
      } else {
        console.warn("Item not in array:", item);
        return this;
      }
    }

    while (idx < this.length - 1) {
      this[idx] = this[idx + 1];

      idx++;
    }

    this[idx] = undefined!;
    this.length--;

    return this;
  };
}

//XXX figure out how to make extjcc code work well with WebWorkers

/* NOTE: this built the reverse map in place on the forward object.  Only the
   reverse direction is read in this file, and the forward map is exported
   separately from vectordraw_jobs_base.ts. */
const CompositeModes: GlobalCompositeOperation[] = ["source-over", "source-atop"];

const {
  LINESTYLE,
  LINEWIDTH,
  FILLSTYLE,
  BEGINPATH,
  CLOSEPATH,
  MOVETO,
  LINETO,
  RECT,
  ARC,
  CUBIC,
  QUADRATIC,
  STROKE,
  FILL,
  SAVE,
  RESTORE,
  TRANSLATE,
  ROTATE,
  SCALE,
  SETBLUR,
  SETCOMPOSITE,
  CLIP,
  DRAWIMAGE,
  PUTIMAGE,
  SETTRANSFORM,
  NOFILL,
} = OPCODES;

const {
  NEW_JOB: MSG_NEW_JOB,
  ADD_DATABLOCK: MSG_ADD_DATABLOCK,
  SET_COMMANDS: MSG_SET_COMMANDS,
  RUN: MSG_RUN,
  ERROR: MSG_ERROR,
  RESULT: MSG_RESULT,
  ACK: MSG_ACK,
  CLEAR_QUEUE: MSG_CLEAR_QUEUE,
  CANCEL_JOB: MSG_CANCEL_JOB,
  WORKER_READY: MSG_WORKER_READY,
} = MESSAGES;

/* Everything the worker carries between messages.  msg_data accumulates the
   job described by the current NEW_JOB / SET_COMMANDS / RUN sequence. */
type WorkerState = {
  canvas: OffscreenCanvas | undefined;
  queue: Job[];
  job_idmap: { [msgid: number]: Job };
  /* Declared with the rest of the bookkeeping but never read or written. */
  waitqueue: { [msgid: number]: Job };
  datablocks: Transferable[];
  running: boolean;
  msg_state: undefined;
  msg_id: number | undefined;
  msg_cmd: number | undefined;
  msg_data?: Job;
};

let state: WorkerState = {
  canvas    : undefined,
  queue     : [],
  job_idmap : {},
  waitqueue : {},
  datablocks: [],
  running   : false,
  msg_state : undefined,
  msg_id    : undefined,
  msg_cmd   : undefined,
};

function init() {
  //state.canvas = new OffscreenCanvas();
  //state.canvas = document.createElement("canvas");
  //state.g = state.canvas.getContext("2d");
  postMessage({
    type : MSG_WORKER_READY,
    data : 0,
    msgid: 0,
  });
}

//commands should be a float32 array
function doDrawList(commands: Float64Array, datablocks: Transferable[], id: number) {
  state.running = true;

  let _i = 0;

  let u8buffer = new Uint8Array(commands.buffer);

  let read = () => {
    return commands[_i++];
  };

  let width = read(),
    height = read();

  let fillcolor = [0, 0, 0, 1],
    strokecolor = [0, 0, 0, 1];

  let blur_doff = 25000;
  let blur = 0;

  //try to catch malformed dimensions
  if (
    isNaN(width) ||
    isNaN(height) ||
    width <= 0 ||
    height <= 0 ||
    width > 10000 ||
    height > 10000
  ) {
    console.warn("Malformed dimensions", width, height);
    senderror("Malformed dimensions " + width + ", " + height);
    state.running = false;
    return;
  }

  let canvas = new OffscreenCanvas(width, height);
  let g = canvas.getContext("2d")!;
  let transform = [1, 0, 0, 0, 1, 0];

  g.globalCompositeOperation = "source-over";
  g.miterLimit = 2.5;
  g.lineCap = "butt";

  let no_fill = false;

  while (_i < commands.length) {
    let cmd = ~~read(); //give hint to compiler that this is an integer
    if (Debug) console.log("cmd", cmd);

    switch (cmd) {
      case LINESTYLE:
      case FILLSTYLE:
        let r = read(),
          g1 = read(),
          b = read(),
          a = read();
        let style = "rgba(" + r + "," + g1 + "," + b + "," + a + ")";

        if (Debug) console.log("STYLE", style);
        let clr;

        if (cmd === LINESTYLE) {
          g.strokeStyle = style;
          clr = strokecolor;
        } else {
          g.fillStyle = style;
          clr = fillcolor;
        }

        clr[0] = r;
        clr[1] = g1;
        clr[2] = b;
        clr[3] = a;

        if (Debug) console.log(id, "yay color", fillcolor, style, _i - 5);

        break;
      /*
        let i = _i * 4;
        len = u8buffer[i++];
        let style = "";

        for (let j = 0; j < len; j++) {
          style += String.fromCharCode(u8buffer[i + j]);
        }

        //pad to 4-byte boundary
        let off = (len + 1) & 3;
        if (off) {
          _i += 4 - off;
        }

        if (cmd === LINESTYLE) {
          g.strokeStyle = style;
        } else {
          g.fillStyle = style;
        }
        break;*/
      case LINEWIDTH:
        g.lineWidth = read();
        break;
      case BEGINPATH:
        g.beginPath();
        break;
      case CLOSEPATH:
        g.closePath();
        break;
      case MOVETO:
        let x = read(),
          y = read();
        if (Debug) console.log("moving to!", x, y);
        g.moveTo(x, y);
        break;
      case LINETO:
        g.lineTo(read(), read());
        break;
      case RECT:
        g.rect(read(), read(), read(), read());
        break;
      case ARC:
        g.arc(read(), read(), read(), read(), read());
        break;
      case CUBIC:
        g.bezierCurveTo(read(), read(), read(), read(), read(), read());
        break;
      case QUADRATIC:
        g.quadraticCurveTo(read(), read(), read(), read());
        break;
      case STROKE:
        g.stroke();
        break;
      case FILL:
        if (Debug) console.log("filling");
        g.fill();
        break;
      case CLIP:
        if (Debug) console.log("clipping");
        g.clip();
        break;
      case SAVE:
        g.save();
        break;
      case RESTORE:
        g.restore();
        break;
      case SETTRANSFORM:
        for (let i = 0; i < 6; i++) {
          transform[i] = read();
        }

        g.setTransform(
          transform[0],
          transform[1],
          transform[2],
          transform[3],
          transform[4],
          transform[5]
        );
        break;
      case TRANSLATE:
        g.translate(read(), read());
        break;
      case ROTATE:
        g.rotate(read());
        break;
      case SCALE:
        g.scale(read(), read());
        break;
      case DRAWIMAGE: {
        /* Nothing posts datablocks today, so neither image opcode is reached;
           the reads still have to happen to keep the cursor aligned. */
        let block = datablocks[~~read()];
        let x = read(),
          y = read();

        if (block instanceof ImageBitmap) {
          g.drawImage(block, x, y);
        }
        break;
      }
      case PUTIMAGE: {
        let block = datablocks[~~read()];
        let x = read(),
          y = read();

        /* NOTE: ImageData is not transferable, and postRenderJob() posts every
           datablock in its transfer list, so a PUTIMAGE payload has never
           survived the trip into this worker. */
        if (block instanceof ImageData) {
          g.putImageData(block, x, y);
        }
        break;
      }
      case SETCOMPOSITE:
        g.globalCompositeOperation = CompositeModes[~~read()];
        break;
      case SETBLUR:
        let blur2 = read();

        //*
        if (blur2 === 0 && blur !== 0) {
          blur = 0;
          g.filter = "none";
        } else if (blur2 > 0) {
          let scale = transform[0];
          blur = blur2 * scale;

          g.filter = "blur(" + blur * 0.25 + "px)";
        }
        //*/

        break;
      case NOFILL:
        no_fill = true;
        break;
    }
  }

  //reset blur
  if (blur > 0) {
    g.shadowOffsetX = 0.0;
    g.shadowOffsetY = 0.0;
    g.shadowBlur = 0.0;

    g.translate(-blur_doff, 0.0);
  }

  state.running = false;

  let result = canvas.transferToImageBitmap();

  postMessage(
    {
      type : MSG_RESULT,
      data : [result],
      msgid: id,
    },
    [result]
  );

  self.setTimeout(() => {
    for (let i = 0; i < 3; i++) {
      handleQueue();
    }
  }, 0);

  if (self.gc && typeof self.gc === "function") {
    self.gc();
  }
}

let MAGIC = 123452;

function senderror(msg: string) {
  console.warn("working thread:", msg);
}

function handleQueue() {
  if (state.running) return;

  if (state.queue.length > 0) {
    let job = state.queue.shift()!;
    doDrawList(job.commands!, job.datablocks, job.id);
  }
}

class Job {
  id: number;
  commands: Float64Array | undefined;
  datablocks: Transferable[];

  constructor(id: number) {
    this.id = id;
    this.commands = undefined;
    this.datablocks = [];
  }
}

onmessage = function (e: MessageEvent) {
  let m;

  //console.log("event message in worker", e);

  m = e.data.type;

  switch (m) {
    case MSG_CLEAR_QUEUE:
      state.queue = [];
      state.job_idmap = {};
      break;
    case MSG_CANCEL_JOB:
      let id = e.data.msgid;
      if (!(id in state.job_idmap)) {
        if (Debug) console.warn("Error: id not in job_idmap to cancel", id);
        return;
      }

      let job = state.job_idmap[id];
      if (state.queue.indexOf(job) >= 0) {
        state.queue.remove(job);
      }

      delete state.job_idmap[id];

      break;
    case MSG_NEW_JOB:
      state.msg_id = e.data.msgid;
      state.msg_data = new Job(e.data.msgid);
      break;
    case MSG_SET_COMMANDS:
      /* MSG_NEW_JOB always precedes these three. */
      state.msg_data!.commands = new Float64Array(e.data.data[0]);
      break;
    case MSG_ADD_DATABLOCK:
      state.msg_data!.datablocks = state.msg_data!.datablocks.concat(e.data.data);
      break;
    case MSG_RUN:
      state.queue.push(state.msg_data!);
      state.msg_data = undefined;
      handleQueue();
      break;
  }
};

init();
