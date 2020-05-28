"use strict";

export class TypedCache {
  freelist : Object;

  constructor() {
    this.freelist = {};
  }
  
  get(size) {
    var lst = this.freelist[size];
    
    if (lst == undefined) {
      lst = this.freelist[size] = [];
    }
    
    if (lst.length > 0) {
      return lst.pop();
    } else {
      lst.push(new ArrayBuffer());
      return lst.pop();
    }
  }
  
  free(arraybuffer) {
    var lst = this.freelist[size];
    
    if (lst == undefined) {
      lst = this.freelist[size] = [];
    }
    
    lst.insert(0, arraybuffer);
  }
}

export var typedcache = new TypedCache();

var u8 = new Uint8Array(16);

var u16 = new Uint16Array(u8.buffer);
var i16 = new Int16Array(u8.buffer);

var u32 = new Uint32Array(u8.buffer);
var i32 = new Int32Array(u8.buffer);

var f32 = new Float32Array(u8.buffer);
var f64 = new Float64Array(u8.buffer);

export class TypedWriter {
  i : number
  buf : Uint8Array;

  constructor(maxsize) {
    this.i = 0;
    this.maxsize = maxsize;
    this.buf = new Uint8Array(maxsize); //typedcache.get(maxsize));
  }
  
  destroy() {
    //typedcache.free(this.buf.buffer);
  }
  
  int8(f) {
    this.buf[this.i++] = f;
    return this;
  }
    
  int16(f) {
    var buf = this.buf, i = this.i;
    i16[0] = f;
    
    buf[i++] = u8[0];
    buf[i++] = u8[1];

    this.i = i;
    return this;
  }
  
  vec2(v) {
    this.float32(v[0]);
    this.float32(v[1]);
    
    return this;
  }
  
  vec3(v) {
    this.float32(v[0]);
    this.float32(v[1]);
    this.float32(v[2]);
    
    return this;
  }
  
  vec4(v) {
    this.float32(v[0]);
    this.float32(v[1]);
    this.float32(v[2]);
    this.float32(v[3]);
    
    return this;
  }
  
  final() {
    if (this.i > this.buf.length) {
      throw new Error("Exceeded maximum size of TypedWriter: " + this.i + " > " + this.buf.length);
    }
    
    return this.buf.buffer.slice(0, this.i);
  }
  
  bytes(f, len=f.length) {
    var buf = this.buf, i = this.i;
    
    if (typeof f == "string") {
      for (var j=0; j<f.length; j++) {
        buf[i++] = f.charCodeAt(j);
      }
    } else {
      for (var j=0; j<f.length; j++) {
        buf[i++] = f[j];
      }
    }
    
    this.i = i;
    return this;
  }
  
  int32(f) {
    var buf = this.buf, i = this.i;
    i32[0] = f;
    
    buf[i++] = u8[0];
    buf[i++] = u8[1];
    buf[i++] = u8[2];
    buf[i++] = u8[3];

    this.i = i;
    return this;
  }
  
  float32(f) {
    var buf = this.buf, i = this.i;
    f32[0] = f;
    
    buf[i++] = u8[0];
    buf[i++] = u8[1];
    buf[i++] = u8[2];
    buf[i++] = u8[3];

    this.i = i;
    return this;
  }
  
  float64(f) {
    var buf = this.buf, i = this.i;
    f64[0] = f;
    
    buf[i++] = u8[0];
    buf[i++] = u8[1];
    buf[i++] = u8[2];
    buf[i++] = u8[3];
    
    buf[i++] = u8[4];
    buf[i++] = u8[5];
    buf[i++] = u8[6];
    buf[i++] = u8[7];

    this.i = i;
    return this;
  }
}
