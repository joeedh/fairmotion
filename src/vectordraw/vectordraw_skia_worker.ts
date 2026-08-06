"use strict";

/* Bundled to a classic worker script by buildtools/esbuild.mjs, so this import
   is inlined; importScripts() below still needs a classic worker global. */
import {OPCODES, MESSAGES} from './vectordraw_jobs_base.js';

importScripts("node_modules/canvaskit-wasm/bin/canvaskit.js");
CanvasKitInit({
  locateFile: (file : string) => 'node_modules/canvaskit-wasm/bin/' + file,
}).ready().then((CanvasKit) => {
  console.log("%c CanvasKit initialized", "color: blue");
  self.CanvasKit = CanvasKit;

  postMessage({
    type : MSG_WORKER_READY,
    data : 0,
    msgid: 0
  });
});

let Debug = false;

if (Array.prototype.remove === undefined) {
  Array.prototype.remove = function <T>(this : T[], item : T,
                                        throw_error = true) {
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
  }
}

//XXX figure out how to make extjcc code work well with WebWorkers

/* NOTE: this built the reverse map in place on the forward object.  Only the
   reverse direction is read in this file, and the forward map is exported
   separately from vectordraw_jobs_base.ts. */
const CompositeModes : GlobalCompositeOperation[] = ["source-over", "source-atop"];

const {
  LINESTYLE, LINEWIDTH, FILLSTYLE, BEGINPATH, CLOSEPATH, MOVETO, LINETO, RECT,
  ARC, CUBIC, QUADRATIC, STROKE, FILL, SAVE, RESTORE, TRANSLATE, ROTATE, SCALE,
  SETBLUR, SETCOMPOSITE, CLIP, DRAWIMAGE, PUTIMAGE, SETTRANSFORM,
} = OPCODES;

const {
  NEW_JOB      : MSG_NEW_JOB,
  ADD_DATABLOCK: MSG_ADD_DATABLOCK,
  SET_COMMANDS : MSG_SET_COMMANDS,
  RUN          : MSG_RUN,
  ERROR        : MSG_ERROR,
  RESULT       : MSG_RESULT,
  ACK          : MSG_ACK,
  CLEAR_QUEUE  : MSG_CLEAR_QUEUE,
  CANCEL_JOB   : MSG_CANCEL_JOB,
  WORKER_READY : MSG_WORKER_READY,
} = MESSAGES;

/* Everything the worker carries between messages.  msg_data accumulates the
   job described by the current NEW_JOB / SET_COMMANDS / RUN sequence. */
type WorkerState = {
  canvas : OffscreenCanvas | undefined,
  queue : Job[],
  job_idmap : {[msgid : number] : Job},
  /* Declared with the rest of the bookkeeping but never read or written. */
  waitqueue : {[msgid : number] : Job},
  datablocks : Transferable[],
  running : boolean,
  msg_state : undefined,
  msg_id : number | undefined,
  msg_cmd : number | undefined,
  msg_data? : Job
};

let state : WorkerState = {
  canvas    : undefined,
  queue     : [],
  job_idmap : {},
  waitqueue : {},
  datablocks: [],
  running   : false,
  msg_state : undefined,
  msg_id    : undefined,
  msg_cmd   : undefined
};


function init() {
  //state.canvas = new OffscreenCanvas();
  //state.canvas = document.createElement("canvas");
  //state.g = state.canvas.getContext("2d");
}

function doDrawList(commands : Float64Array, datablocks : Transferable[],
                    id : number) {
  state.running = true;

  let _i = 0;

  let u8buffer = new Uint8Array(commands.buffer);

  let read = () => {
    return commands[_i++];
  }

  let width = read(), height = read();

  let fillcolor = [0, 0, 0, 1], strokecolor = [0, 0, 0, 1];

  let blur_doff = 25000;
  let blur = 0;

  //try to catch malformed dimensions
  if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0 || width > 10000 || height > 10000) {
    console.warn("Malformed dimensions", width, height);
    senderror("Malformed dimensions " + width + ", " + height)
    state.running = false;
    return;
  }

  let canvas = new OffscreenCanvas(width, height);
  //let g = canvas.getContext("2d");
  let canvas2 = CanvasKit.MakeCanvas(width, height);
  let g = canvas2.getContext("2d")!;

  let transform = [1, 0, 0, 0, 1, 0];

  g.globalCompositeOperation = "source-over";
  g.lineCap = "butt";
  g.miterLimit = 2.5;

  while (_i < commands.length) {
    let cmd = ~~read(); //give hint to compiler that this is an integer
    if (Debug) console.log("cmd", cmd)

    switch (cmd) {
      case LINESTYLE :
      case FILLSTYLE : {
        let r = read(), g1 = read(), b = read(), a = read();
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
      }
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
      case BEGINPATH :
        g.beginPath();
        break;
      case CLOSEPATH :
        g.closePath();
        break;
      case MOVETO    : {
        let x = read(), y = read();
        if (Debug) console.log("moving to!", x, y);
        g.moveTo(x, y);
        break;
      }
      case LINETO    :
        g.lineTo(read(), read());
        break;
      case RECT      :
        g.rect(read(), read(), read(), read());
        break;
      case ARC       :
        g.arc(read(), read(), read(), read(), read());
        break;
      case CUBIC     :
        g.bezierCurveTo(read(), read(), read(), read(), read(), read());
        break;
      case QUADRATIC :
        g.quadraticCurveTo(read(), read(), read(), read());
        break;
      case STROKE    :
        g.stroke();
        break;
      case FILL      :
        if (Debug) console.log("filling");
        g.fill();
        break;
      case CLIP      :
        if (Debug) console.log("clipping");
        g.clip();
        break;
      case SAVE      :
        g.save();
        break;
      case RESTORE   :
        g.restore();
        break;
      case SETTRANSFORM:
        for (let i = 0; i < 6; i++) {
          transform[i] = read();
        }

        g.setTransform(transform[0], transform[1], transform[2], transform[3], transform[4], transform[5]);
        break;
      case TRANSLATE :
        g.translate(read(), read());
        break;
      case ROTATE    :
        g.rotate(read());
        break;
      case SCALE     :
        g.scale(read(), read());
        break;
      case DRAWIMAGE : {
        /* Nothing posts datablocks today, so neither image opcode is reached;
           the reads still have to happen to keep the cursor aligned. */
        let block = datablocks[~~read()];
        let x = read(), y = read();

        if (block instanceof ImageBitmap) {
          g.drawImage(block, x, y);
        }
        break;
      }
      case PUTIMAGE  : {
        let block = datablocks[~~read()];
        let x = read(), y = read();

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
      case SETBLUR: {
        let blur2 = read();

        //*
        if (blur2 == 0 && blur != 0) {
          g.shadowOffsetX = g.shadowOffsetY = g.shadowBlur = 0.0;
          g.translate(-blur_doff, 0.0);
          blur = 0;
        } else if (blur2 > 0) {
          let scale = transform[0];

          blur = blur2*scale;
          //console.log(blur2, scale);

          blur_doff = (~~(width - blur - 1)); //300; //Math.max(width, height)-20;
          blur_doff = Math.ceil(blur_doff/scale);

          if (scale > 1.0) {
            blur_doff *= 4.0;
          } else {
            blur_doff = (~~(width - blur - 2))/scale;
          }

          //if (Debug) console.log(width, blur_doff);
          g.translate(blur_doff, 0);

          g.shadowOffsetX = -blur_doff*scale;
          g.shadowOffsetY = 0;

          let clr = fillcolor;

          if (Debug) console.log(id, "set blur", blur, clr, strokecolor);

          g.shadowColor = "rgba(" + clr[0] + "," + clr[1] + "," + clr[2] + "," + clr[3] + ")";
          g.shadowBlur = blur*0.5;
        }
        //*/

        break;
      }
    }
  }

  //reset blur
  if (blur > 0) {
    g.shadowOffsetX = 0.0;
    g.shadowOffsetY = 0.0;
    g.shadowBlur = 0.0;

    g.translate(-blur_doff, 0.0);
  }

  //canvas2.i = canvas2._surface.i = canvas;
  //*
  canvas2.Lk = canvas2.mm.Lk = canvas;
  canvas2.mm.flush();
  canvas2.dispose();
  //*/
  /*
  canvas.width = 55;
  canvas.height = 55;
  canvas.getContext("2d")!;
  //*/

  state.running = false;

  let result = canvas.transferToImageBitmap();

  postMessage({
    type : MSG_RESULT,
    data : [result],
    msgid: id
  }, [result]);

  self.setTimeout(() => {
    handleQueue();
  }, 0);


  if (self.gc && typeof (self.gc) === "function") {
    self.gc();
  }
}

//commands should be a float32 array
function olddoDrawList(commands : Float64Array, datablocks : Transferable[],
                       id : number) {
  state.running = true;

  let _i = 0;

  let u8buffer = new Uint8Array(commands.buffer);

  let read = () => {
    return commands[_i++];
  }

  let width = read(), height = read();

  let fillcolor = [0, 0, 0, 1], strokecolor = [0, 0, 0, 1];

  let blur_doff = 25000;
  let blur = 0;

  //try to catch malformed dimensions
  if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0 || width > 10000 || height > 10000) {
    console.warn("Malformed dimensions", width, height);
    senderror("Malformed dimensions " + width + ", " + height)
    state.running = false;
    return;
  }

  let canvas = new OffscreenCanvas(width, height);
  /* CanvasKit's surface factory duck-types on tagName, so the OffscreenCanvas
     has to answer to it. */
  Reflect.set(canvas, "tagName", "CANVAS");

  let sksurface = CanvasKit.MakeSWCanvasSurface(canvas);
  let skcanvas = sksurface.getCanvas();
  let paint = new CanvasKit.SkPaint();

  const context = CanvasKit.currentContext();

  let bmode = CanvasKit.BlendMode.SrcOver;

  paint.setColor(CanvasKit.Color(0, 0, 0, 1.0));
  paint.setStyle(CanvasKit.PaintStyle.Fill);
  paint.setBlendMode(bmode);
  paint.setAntiAlias(true);

  let transform = [0, 0, 0, 0, 0, 0];
  let path = new CanvasKit.SkPath();
  let mat = CanvasKit.SkMatrix.identity();

  //g.globalCompositeOperation = "source-over";

  while (_i < commands.length) {
    let cmd = ~~read(); //give hint to compiler that this is an integer
    if (Debug) console.log("cmd", cmd)

    switch (cmd) {
      case LINESTYLE :
        break;
      case FILLSTYLE :
        let r = read(), g = read(), b = read(), a = read();
        let style = "rgba(" + r + "," + g + "," + b + "," + a + ")";

        if (Debug) console.log("STYLE", style);
        let clr = fillcolor;

        clr[0] = r;
        clr[1] = g;
        clr[2] = b;
        clr[3] = a;

        paint.delete();

        paint = new CanvasKit.SkPaint();
        paint.setColor(CanvasKit.Color(r, g, b, a));
        paint.setStyle(CanvasKit.PaintStyle.Fill);
        paint.setBlendMode(bmode);
        paint.setAntiAlias(true);

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
        //g.lineWidth = read();
        break;
      case BEGINPATH :
        path.delete();
        path = new CanvasKit.SkPath();
        path.transform(mat);
        break;
      case CLOSEPATH :
        //g.closePath();
        break;
      case MOVETO    :
        let x = read(), y = read();
        if (Debug) console.log("moving to!", x, y);
        path.moveTo(x, y);
        break;
      case LINETO    :
        path.lineTo(read(), read());
        break;
      case RECT      :
        //g.rect(read(), read(), read(), read());
        break;
      case ARC       :
        //g.arc(read(), read(), read(), read(), read());
        break;
      case CUBIC     :
        path.cubicTo(read(), read(), read(), read(), read(), read());
        break;
      case QUADRATIC :
        path.quadTo(read(), read(), read(), read());
        break;
      case STROKE    :
        //g.stroke();
        break;
      case FILL      :
        if (Debug) console.log("filling");
        //g.fill();
        skcanvas.drawPath(path, paint);
        break;
      case CLIP      :
        if (Debug) console.log("clipping");
        skcanvas.clipPath(path);
        //g.clip();
        break;
      case SAVE      :
        skcanvas.save();
        break;
      case RESTORE   :
        skcanvas.restore();
        break;
      case SETTRANSFORM: {
        for (let i = 0; i < 6; i++) {
          transform[i] = read();
        }

        //g.setTransform(transform[0], transform[1], transform[2], transform[3], transform[4], transform[5]);
        console.log("transform:", transform);
        //skcanvas.translate(transform[4], transform[5]);
        //skcanvas.scale(transform[0], transform[3]);
        let b = transform[0], c = transform[1], d = transform[2], e = transform[3], h = transform[4],
            l                                                                         = transform[5];

        let B = [b, d, h, c, e, l, 0, 0, 1];
        mat = B;
        mat = CanvasKit.SkMatrix.Ka(B);
        path.transform(mat);

        break;
      }
      case TRANSLATE : {
        let sx = read(), sy = read();
        let mscale = CanvasKit.SkMatrix.translated(sx, sy);
        mat = CanvasKit.SkMatrix.multiply(mat, mscale);

        path.translate(sx, sy);
        break;
      }
      case ROTATE    :
        skcanvas.rotate(read());
        break;
      case SCALE     : {
        let sx = read(), sy = read();
        let mscale = CanvasKit.SkMatrix.scaled(sx, sy);
        mat = CanvasKit.SkMatrix.multiply(mat, mscale);

        path.scale(sx, sy);
        break;
      }
      case DRAWIMAGE :
        //g.drawImage(datablocks[~~read()], read(), read());
        break;
      case PUTIMAGE  :
        //g.putImageData(datablocks[~~read()], read(), read());
        break;
      case SETCOMPOSITE:
        //g.globalCompositeOperation = CompositeModes[~~read()];
        break;
      case SETBLUR:
        /*
        let blur2 = read();

        //*
        if (blur2 == 0 && blur != 0) {
          g.shadowOffsetX = g.shadowOffsetY = g.shadowBlur = 0.0;
          g.translate(-blur_doff, 0.0);
          blur = 0;
        } else if (blur2 > 0) {
          let scale = transform[0];

          blur = blur2*scale;
          //console.log(blur2, scale);

          blur_doff = (~~(width-blur-1)); //300; //Math.max(width, height)-20;
          blur_doff = Math.ceil(blur_doff/scale);

          if (scale > 1.0) {
            blur_doff *= 4.0;
          } else {
            blur_doff = (~~(width-blur-2))/scale;
          }

          //if (Debug) console.log(width, blur_doff);
          g.translate(blur_doff, 0);

          g.shadowOffsetX = -blur_doff*scale;
          g.shadowOffsetY = 0;

          let clr = fillcolor;

          if (Debug) console.log(id, "set blur", blur, clr, strokecolor);

          g.shadowColor = "rgba(" + clr[0] + "," + clr[1] + "," + clr[2] + "," + clr[3] + ")";
          g.shadowBlur = blur;
        }
        //*/
        //*/
        break;
    }
  }

  state.running = false;

  skcanvas.flush();
  sksurface.flush();

  let result = canvas.transferToImageBitmap();

  sksurface.delete();
  paint.delete();

  postMessage({
    type : MSG_RESULT,
    data : [result],
    msgid: id
  }, [result]);

  handleQueue();
}

let MAGIC = 123452;

function senderror(msg : string) {
  console.warn("working thread:", msg);
}

function handleQueue() {
  if (self.CanvasKit === undefined) {
    self.setTimeout(() => handleQueue(), 35)
    return;
  }

  if (state.running)
    return;

  if (state.queue.length > 0) {
    let job = state.queue.shift()!;
    doDrawList(job.commands!, job.datablocks, job.id);
  }
}

class Job {
  id : number;
  commands : Float64Array | undefined;
  datablocks : Transferable[];

  constructor(id : number) {
    this.id = id;
    this.commands = undefined;
    this.datablocks = [];
  }
}

onmessage = function (e : MessageEvent) {
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
