class FrameIterator {
  constructor(vm) {
    this.vm = vm;
    this.ret = {done : true, value : undefined};
    this.i = 0;
  }
  
  init(vm) {
    this.vm = vm;
    this.ret.done = false;
    this.ret.value = undefined;
    this.i = 0;
  }
  
  [Symbol.iterator]() {
    return this;
  }
  
  next() {
    if (this.i >= this.vm.totframe) {
      this.ret.done = true;
      return this.ret;
    }
    
    this.ret.value = this.vm.get(this.i++);
    return this.ret;
  }
}

export class Video {
  constructor(url) {
    this.canvas = document.createElement("canvas");
    this.g = this.canvas.getContext("2d");
    this.video = document.createElement("video")
    this.url = url;
    
    this.source = document.createElement("source")
    this.source.src = url;
    this.video.appendChild(this.source);
    var this2 = this;
    
    this.video.oncanplaythrough = (function oncanplaythrough() {
      this2.record_video();
      this2.video.oncanplaythrough = null;
    }).bind(this);
    
    this.video.load();
    
    this.frames = {};
    this.recording = false;
    this.totframe = 0;
 }
 
 record_video() {
  if (this.recording) {
    console.trace("Already started recording!");
    return;
  }
  
  var video = this.video;
  
  if (video.readyState != 4) {
    var this2 = this;
    var timer = window.setInterval(function() {
      if (video.readyState == 4) {
        window.clearInterval(timer);
        this2.record_video();
      }
    }, 100);
    
    return;
  }
  
  this.recording = true;
  
  this.canvas.width = video.videoWidth;
  this.canvas.height = video.videoHeight;
  var g = this.g;
  
  var frames = this.frames;
  var size = [video.videoWidth, video.videoHeight];
  
  var this2 = this;
  function finish() {
    console.log("finish!", this2);
    
    this2.recording = false;
    var rerun = false;
    
    for (var i=1; i<this2.totframe; i++) {
      if (!(i in this2.frames)) {
        console.log("Missing frame", i);
        rerun = true;
      }
    }
    
    if (rerun) {
      console.log("Scanning video again. . .");
      
      this2.video = video = document.createElement("video")
      
      this2.source = document.createElement("source")
      this2.source.src = this2.url;
      this2.video.appendChild(this2.source);
      
      this2.video.oncanplaythrough = (function() {
        this2.record_video();
        this2.video.oncanplaythrough = null;
      }).bind(this2);
      
      this2.video.load();
    }
  }
  
  //make one blank background
  this.blank = g.getImageData(0, 0, size[0], size[1]);
  var canvas = this.canvas;
  
  var cur_i = 0;
  var on_frame = (function() {
    var frame = cur_i++; //current_frame(video);
    
    if (video.paused) {
      console.log("Done!");
      //finish();
    }
    
    if (frame in frames) return;
    
    this2.totframe = Math.max(this2.totframe, frame+1);
    
    //console.log("got frame", frame);
    
    g.drawImage(video, 0, 0);
    //var imagedata = g.getImageData(0, 0, size[0], size[1]);
    /*
    var canvas = document.createElement("canvas");
    canvas.width = size[0];
    canvas.height = size[1];
    
    var g2 = canvas.getContext("2d");
    g2.drawImage(video, 0, 0);
    //*/
    
    var img = document.createElement("img");
    //var blob = new Blob([imagedata]);
    img.width = size[0];
    img.height = size[1];
    img.src = canvas.toDataURL(); //URL.createObjectURL(blob);
    
    //console.log("on frame!");
    frames[frame] = img;
    
    /*
    video.pause();
    var timer2 = window.setInterval(function() {
      console.log(video.webkitDecodedFrameCount, video.currentTime*29.97);
      window.clearInterval(timer2);
    }, 100);
    //*/
  }).bind(this);
  
  console.log("start video");
  
  //video.ontimeupdate = on_frame;

  video.onloadeddata  = function() {
    console.log("meta", arguments);
  }
  
  /*
  var timer3 = window.setInterval(function() {
    if (video.webkitDecodedFrameCount > 40) {
      video.pause();
      video.ontimeupdate = video.onseeked = video.onplaying = function() {
        console.log("have frame 2", video.currentTime, 4.0/29.97+0.0001);
        video.ontimechange = null;
      }
      
      video.currentTime=4.0/29.97+0.0001
      window.clearInterval(timer3);
      console.log("have frame", video.currentTime, 4.0/29.97+0.0001);
    }
  }, 10);
  //*/
  
  video.addEventListener("loadeddata", function() {
    console.log("meta2", arguments);
  });
  
  /*
  video.ontimechange = function() {
    console.log("have frame", video.currentTime, 4.0/29.97+0.0001);
    video.ontimechange = null;
  }
  
  video.currentTime=4.0/29.97+0.0001
  */
  var last_frame = -1;
  
  video.playbackRate = 0.5;
  video.ontimeupdate = video.onseeked = video.onplaying = function() {
    var frame = Math.floor(video.currentTime*29.97);
    if (last_frame != frame) {
      console.clear();
      console.log("frame: ", frame-last_frame);
      on_frame();
    }
    
    last_frame = frame;
    video.onpause = function() {
      //console.log("pause!");
      video.onpause = null;
      video.play();
    }
    
    video.pause();
    //video.play();
  }
  video.play();
 }
 
 get(frame) {
   if (frame in this.frames)
     return this.frames[frame];
   return undefined;
   //return this.blank;
 }
 
 [Symbol.iterator]() {
  return new FrameIterator(this);
 }
}

function current_frame(v) {
  return Math.floor(v.currentTime*15.0);
  
  if (v.webkitDecodedFrameCount != undefined)
    return v.currentTime;
}

export class VideoManager {
  constructor() {
    this.pathmap = {};
    this.videos = {};
  }
  
  get(url) {
    if (url in this.pathmap) {
      return this.pathmap[url];
    }
    
    this.pathmap[url] = new Video(url);
  }
}

export var manager = new VideoManager();
