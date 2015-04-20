"use strict";

//#include "src/config/config_defines.js"

//#ifndef PACK_PROFILE

#define profile_start(name) ;

#define profile_end(name) ;

import {encode_utf8, decode_utf8, truncate_utf8, 
        urlencode, b64decode, b64encode} from 'strutils';

//#endif

var DEFL_NAMELEN = 64

if (typeof String.prototype.toUTF8 != "function") {
  String.prototype.toUTF8 = function() {
    var input = String(this);
    
    var b = [], i, unicode;
    for(i = 0; i < input.length; i++) {
        unicode = input.charCodeAt(i);
        // 0x00000000 - 0x0000007f -> 0xxxxxxx
        if (unicode <= 0x7f) {
            b.push(unicode);
        // 0x00000080 - 0x000007ff -> 110xxxxx 10xxxxxx
        } else if (unicode <= 0x7ff) {
            b.push((unicode >> 6) | 0xc0);
            b.push((unicode & 0x3F) | 0x80);
        // 0x00000800 - 0x0000ffff -> 1110xxxx 10xxxxxx 10xxxxxx
        } else if (unicode <= 0xffff) {
            b.push((unicode >> 12) | 0xe0);
            b.push(((unicode >> 6) & 0x3f) | 0x80);
            b.push((unicode & 0x3f) | 0x80);
        // 0x00010000 - 0x001fffff -> 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
        } else {
            b.push((unicode >> 18) | 0xf0);
            b.push(((unicode >> 12) & 0x3f) | 0x80);
            b.push(((unicode >> 6) & 0x3f) | 0x80);
            b.push((unicode & 0x3f) | 0x80);
        }
    }

    return b;
  }
}

Number.prototype.pack = function(data) {
  if (Number(Math.ceil(this)) == Number(this)) {
    pack_int(data, this);
  } else {
    pack_float(data, this);
  }
}

String.prototype.pack = function(data) {
  pack_string(data, this);
}

Array.prototype.pack = function(data) {
  pack_int(data, this.length);
  
  for (var i=0; i<this.length; i++) {
    this[i].pack(data);
  }
}

function get_endian() {
  var d = [1, 0, 0, 0]
  d = new Int32Array((new Uint8Array(d)).buffer)[0]
  
  return d == 1;
}

var little_endian = get_endian()

//this seems suspect
function str_to_uint8(String str) : Uint8Array
{
  var uint8 = [];
  
  for (var i=0; i<str.length; i++) {
    uint8.push(str.charCodeAt(i));
  }
  
  return new Uint8Array(uint8);
}

//data is always stored in big-endian network byte order

/*interface definition*/
var _static_byte = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]);
var _static_view = new DataView(_static_byte.buffer);

export function pack_int(Array<byte> data, int i, lendian=false)
{
  profile_start("pack_int");
  
  _static_view.setInt32(0, i);
  
  if (lendian) {
    for (var j=3; j>=0; j--) {
      data.push(_static_byte[j]);
    }
  } else {
    for (var j=0; j<4; j++) {
      data.push(_static_byte[j]);
    }
  }
  
  profile_end("pack_int");
}


export function pack_short(Array<byte> data, short i, lendian=false)
{
  profile_start("pack_short");
  _static_view.setInt16(0, i);
  
  if (lendian) {
    for (var j=1; j>=0; j--) {
      data.push(_static_byte[j]);
    }
  } else {
    for (var j=0; j<2; j++) {
      data.push(_static_byte[j]);
    }
  }
  
  profile_end("pack_short");
}

export function pack_byte(Array<byte> data, byte i)
{
  data.push(i);
}

export function pack_float(Array<byte> data, float f, Boolean lendian=false)
{
  profile_start("pack_float");
  _static_view.setFloat32(0, f);
  
  if (lendian) {
    for (var j=3; j>=0; j--) {
      data.push(_static_byte[j]);
    }
  } else {
    for (var j=0; j<4; j++) {
      data.push(_static_byte[j]);
    }
  }
  profile_end("pack_float");
}

export function pack_double(Array<byte> data, float f, Boolean lendian)
{
  profile_start("pack_double");
  
  _static_view.setFloat64(0, f);
  
  if (lendian) {
    for (var j=7; j>=0; j--) {
      data.push(_static_byte[j]);
    }
  } else {
    for (var j=0; j<8; j++) {
      data.push(_static_byte[j]);
    }
  }
  
  profile_end("pack_double");
}

export function pack_vec2(Array<byte> data, Vector2 vec, Boolean lendian=false)
{
  profile_start("pack_vec2");
  
  pack_float(data, vec[0], lendian);
  pack_float(data, vec[1], lendian);
  
  //discard pack records from composite pack
  profile_end("pack_vec2");
}

export function pack_vec3(Array<byte> data, Vector3 vec, lendian=false)
{
  profile_start("pack_vec3");
  
  pack_float(data, vec[0], lendian);
  pack_float(data, vec[1], lendian);
  pack_float(data, vec[2], lendian);
  
  //discard pack records from composite pack
  profile_end("pack_vec3");
}

export function pack_vec4(Array<byte> data, Vector4 vec, lendian=false)
{
  pack_float(data, vec[0], lendian);
  pack_float(data, vec[1], lendian);
  pack_float(data, vec[2], lendian);
  pack_float(data, vec[3], lendian);
  
  //discard pack records from composite pack
}


export function pack_quat(Array<byte> data, Quat vec, lendian=false)
{
  pack_float(data, vec[0], lendian);
  pack_float(data, vec[1], lendian);
  pack_float(data, vec[2], lendian);
  pack_float(data, vec[3], lendian);
  
  //discard pack records from composite pack
}

export function pack_mat4(Array<byte> data, Matrix4 mat, lendian=false)
{
  profile_start("pack_mat4");
  var m = mat.getAsArray();
  
  for (var i=0; i<16; i++) {
    pack_float(data, m[i], lendian);
  }
  
  profile_end("pack_mat4");
}

export function pack_dataref(Array<byte> data, DataBlock b, lendian=false)
{
  if (b != undefined) {
    pack_int(data, b.lib_id, lendian);
    
    if (b.lib_lib != undefined)
      pack_int(data, b.lib_lib.id, lendian);
    else
      pack_int(data, -1, lendian);
  } else {
    pack_int(data, -1, lendian);
    pack_int(data, -1, lendian);
  }
  
  //discard pack records from composite pack
}

var _static_sbuf_ss = new Array(32);
export function pack_static_string(Array<byte> data, String str, int length)
{
  profile_start("pack_static_string");
  
  if (length == undefined)
   throw new Error("'length' paremter is not optional for pack_static_string()");
  
  var arr = length < 2048 ? _static_sbuf_ss : new Array();
  arr.length = 0;
  
  encode_utf8(arr, str);
  truncate_utf8(arr, length);
  
  for (var i=0; i<length; i++) {
    if (i >= arr.length) {
      data.push(0);
    } else {
      data.push(arr[i]);
    }
  }
  
  //discard pack records from composite pack
  profile_end("pack_static_string");
}

export function test_str_packers() {
  function static_string_test() {
    var arr = []
    //pack_string(arr, "yay");
    
    //this string tests whether
    //utf8 truncation works, as well
    //as the encoding/decoding functinos
    
    var teststr = "12345678" + String.fromCharCode(8800)
    console.log(teststr);
    
    var arr2 = [];
    encode_utf8(arr2, teststr);
    console.log(arr2.length);
    
    pack_static_string(arr, teststr, 9);
    if (arr.length != 9)
      throw new UnitTestError("Bad length " + arr.length.toString());
    
    arr = new DataView(new Uint8Array(arr).buffer)
    
    var str2 = unpack_static_string(arr, new unpack_ctx(), 9)
    
    console.log(teststr, str2);
    console.log("'12345678'", "'"+str2+"'");
    
    if (str2 != "12345678") 
      throw new UnitTestError("Bad truncation");
  }
  
  static_string_test();
  return true;
}
create_test(test_str_packers);

var _static_sbuf = new Array(32);
/*strings are packed as 32-bit unicode codepoints*/
export function pack_string(Array<byte> data, String str)
{
  profile_start("pack_string");
  
  _static_sbuf.length = 0;
  encode_utf8(_static_sbuf, str);
  
  pack_int(data, _static_sbuf.length);
  
  for (var i=0; i<_static_sbuf.length; i++) {
    data.push(_static_sbuf[i]);
  }
  
  //discard pack records from composite pack
  profile_end("pack_string");
}

export function unpack_bytes(DataView data, unpack_ctx uctx, int len)
{
  var ret = new DataView(data.buffer.slice(uctx.i, uctx.i+len));
  uctx.i += len;
  
  return ret;
}

export function unpack_array(DataView data, unpack_ctx uctx, Function unpacker)
{
  var len = unpack_int(data, uctx);
  var list = new Array(len);
  
  for (var i=0; i<len; i++) {
    list[i] = unpacker(data, uctx);
  }
  
  return list;
}

export function unpack_garray(DataView data, unpack_ctx uctx, Function unpacker)
{
  var len = unpack_int(data, uctx);
  var list = new GArray();
  
  for (var i=0; i<len; i++) {
    list.push(unpacker(data, uctx));
  }
  
  return list;
}

export function unpack_dataref(DataView data, unpack_ctx uctx) : int
{
  var block_id = unpack_int(data, uctx);
  var lib_id = unpack_int(data, uctx);
  
  return new DataRef(block_id, lib_id);
}

export function unpack_byte(DataView data, unpack_ctx uctx) : byte
{
  var ret = data.getUint8(uctx.i);
  uctx.i += 1;
  
  return ret;  
}

export function unpack_int(DataView data, unpack_ctx uctx) : int
{
  var ret = data.getInt32(uctx.i);

  uctx.i += 4;
  return ret;
}

export function unpack_short(DataView data, unpack_ctx uctx) : int
{
  var ret = data.getInt16(uctx.i);

  uctx.i += 2;
  return ret;
}

export function unpack_float(DataView data, unpack_ctx uctx) : float
{
  var ret = data.getFloat32(uctx.i);
  
  uctx.i += 4;
  return ret;
}

export function unpack_double(DataView data, unpack_ctx uctx) : float
{
  var ret = data.getFloat64(uctx.i);
  
  uctx.i += 8;
  return ret;
}

export function unpack_vec2(Array<byte> data, unpack_ctx uctx)
{
  var x = unpack_float(data, uctx);
  var y = unpack_float(data, uctx);
  
  return new Vector2([x, y]);
}

export function unpack_vec3(DataView data, unpack_ctx uctx) : Vector3
{
  var vec = new Vector3();
  
  var x = unpack_float(data, uctx);
  var y = unpack_float(data, uctx);
  var z = unpack_float(data, uctx);
  
  vec[0] = x; vec[1] = y; vec[2] = z;
  
  return vec;
}


export function unpack_vec4(Array<byte> data, unpack_ctx uctx)
{
  var x = unpack_float(data, uctx);
  var y = unpack_float(data, uctx);
  var z = unpack_float(data, uctx);
  var w = unpack_float(data, uctx);
  
  return new Vector4([x, y, z, w]);
}


export function unpack_quat(Array<byte> data, unpack_ctx uctx)
{
  var x = unpack_float(data, uctx);
  var y = unpack_float(data, uctx);
  var z = unpack_float(data, uctx);
  var w = unpack_float(data, uctx);
  
  return new Quat([x, y, z, w]);
}

export function unpack_mat4(Array<byte> data, unpack_ctx uctx)
{
  var m = new Array(16);
  
  for (var i=0; i<16; i++) {
    m[i] = unpack_float(data, uctx);
  }
  
  return new Matrix4(m);
}


export function debug_unpack_bytes(DataView data, unpack_ctx uctx, int length) : String
{
  var s = "";

  var arr = new Array(length);
  arr.length = 0;

  for (var i=0; i<length; i++) {
    var c = unpack_byte(data, uctx);
    
    try {
      c = c ? String.fromCharCode(c) : "?";
    } catch (_err) {
      c = "?";
    }
    
    s += c;
  }
  
  return s;
}

var _static_arr_uss = new Array(32);
export function unpack_static_string(DataView data, unpack_ctx uctx, int length) : String
{
  var str = "";
  
  if (length == undefined)
    throw new Error("'length' cannot be undefined in unpack_static_string()");
  
  var arr = length < 2048 ? _static_arr_uss : new Array(length);
  arr.length = 0;

  var done = false;
  for (var i=0; i<length; i++) {
    var c = unpack_byte(data, uctx);
    
    if (c == 0) {
      done = true;
    }
    
    if (!done && c != 0) {
      arr.push(c);
      //arr.length++;
    }
  }
  
  truncate_utf8(arr, length);
  return decode_utf8(arr);
}

var _static_arr_us = new Array(32);
export function unpack_string(DataView data, unpack_ctx uctx) : String
{
  var str = ""
  
  var slen = unpack_int(data, uctx);
  var arr = slen < 2048 ? _static_arr_us : new Array(slen);
  
  arr.length = slen;
  for (var i=0; i<slen; i++) {
    arr[i] = unpack_byte(data, uctx);
  }
  
  return decode_utf8(arr);
}

//container to pass an int by reference
export class unpack_ctx {
  constructor() {
    this.i = 0;
  }
}

export function send_mesh(Mesh mesh)
{
  var buf = new ArrayBuffer(2);
  var uint = new Uint8Array(buf);
  uint[0] = 35;
  uint[1] = 36;
  
  var data = []
  mesh.pack(data);
  console.log(data);
  
  //localStorage.mesh_bytes = data;
}

//function NetJobFinish(job, owner);
//function NetJobError(job, owner, error);
//function NetJobStatus(job, owner, status) : NetStatus;

window.NetStatus = function NetStatus() {
  this.progress = 0 : float;
  this.status_msg = "";
  this.cancel = false;
  this._client_control = false; //client api code is controlling this NetStatus, not XMLHttpRequest callbacks
}

export class NetJob {
  constructor(owner, iter, finish, error, status) {
    this.iter = iter;
    this.finish = finish;
    this.error = error;
    this.status = status;
    
    this.status_data = new NetStatus();
    this.value = undefined;
    this.req = undefined;
  }
}
window.NetJob = NetJob;

function parse_headers(headers) {
  var ret = {};
  
  if (headers == undefined)
    return ret;
  
  var in_name = true;
  var key = ""
  var value = ""
  for (var i=0; i<headers.length; i++) {
    var c = headers[i];
    
    if (c == "\n") {
      ret[key.trim()] = value.trim();
      key = ""
      value = ""
      in_name = true
      
      continue;
    } else if (c == "\r") {
      continue
    }
    
    if (in_name) {
      if (c == " " || c == "\t") {
        continue;
      } else if (c == ":") {
        in_name = false;
      } else {
        key += c;
      }
    } else {
      value += c;
    }
  }
  
  if (key.trim().length != 0) {
    ret[key.trim()] = value.trim();
  }
  
  return ret;
}

window.create_folder = function create_folder(job, args) {
  var token = g_app_state.session.tokens.access;
  var url = "/api/files/dir/new?accessToken="+token+"&id="+args.folderid;
  url += "&name=" + urlencode(args.name);
  
  api_exec(url, job, "GET");
  
  yield;
}

window.api_exec = function api_exec(path, netjob, mode, 
    data, mime, extra_headers, 
    responseType) //mode, data are optional
{
  var owner = netjob.owner;
  var iter = netjob.iter;
  
  if (mode == undefined)
    mode = "GET";
  
  if (mime == undefined)
    mime = "application/octet-stream"
  
  if (data == undefined) {
    data = "";
  }  
  
  var error = netjob.error;
  
  if (error == undefined) {
    error = function(netjob, owner, msg) { console.log("Network Error: " + msg) };
  }
  
  var req = new XMLHttpRequest();
  netjob.req = req;
  
  req.open(mode, path, true);
  if (mode != "GET")
    req.setRequestHeader("Content-type", mime);
  
  if (extra_headers != undefined) {
    for (var k in extra_headers) {
      req.setRequestHeader(k, extra_headers[k]);
    }
  }
  
  if (responseType == undefined)
    responseType = "text"
  
  req.onerror = req.onabort = function() {
    error(netjob, netjob.owner, "Network Error");
  }
  
  req.responseType = responseType
  
  req.onprogress = function(evt) {
    if (netjob.status_data._client_control || evt.total == 0) return;
    
    if (DEBUG.netio)
      console.log("progress: ", evt, evt.status, evt.loaded, evt.total);
    
    var perc = evt.loaded / evt.total;
    netjob.status_data.progress = perc;
    
    if (DEBUG.netio)
      console.log("perc", perc, netjob.status);
    
    if (netjob.status)
      netjob.status(netjob, netjob.owner, netjob.status_data);
  }
  
  req.onreadystatechange=function() {
    if (req.readyState==4 && (req.status>=200 && req.status <=300)) {
      var obj;
      
      netjob.headers = parse_headers(req.getAllResponseHeaders());
      if (DEBUG.netio)
        console.log("headers:", netjob.headers)
      
      if (netjob.headers["Content-Type"] == "application/x-javascript") {
        try {
          obj = JSON.parse(req.response);
        } catch (_error) {
          error(netjob, owner, "JSON parse error");
          obj = {}
          return;
        }
        netjob.value = obj;
      } else {
        netjob.value = req.response;
      }     
      
      var reti = iter.next();
      if (reti.done) {
        if (netjob.status_data.progress != 1.0) {
          netjob.status_data.progress = 1.0;
          if (netjob.status)
            netjob.status(netjob, netjob.owner, netjob.status_data);
        }
        
        if (netjob.finish) {
          netjob.finish(netjob, owner);
        }
      }
    } else if (req.status >= 400) {
      var resp;
      try {
        resp = req.responseText;
      } catch (err) {
        resp = "";
      }
      
      error(netjob, netjob.owner, resp);
      console.log(req.readyState, req.status, resp);
    }
  }
  
  var ret = req.send(data);
}

window.AuthSessionGen = function AuthSessionGen(job, user, password, refresh_token) {
  if (refresh_token == undefined) {
    var sha1pwd = "{SHA}" + CryptoJS.enc.Base64.stringify(CryptoJS.SHA1(password))
    api_exec("/api/auth?user="+user+"&password="+sha1pwd, job);
    yield 1;
    
    console.log("auth value: ", job.value);
  
    refresh_token = job.value["refresh_token"];
  }
  
  api_exec("/api/auth/session?refreshToken="+refresh_token, job);
  yield 1;
  
  var access_token = job.value["access_token"];
  job.value = {refresh : refresh_token, access : access_token};
  
  if (job.finish != undefined)
    job.finish(job, job.owner);
}

window.auth_session = function auth_session(user, password, finish, error, status) {
  var obj = {};
  
  obj.job = new NetJob(obj, undefined, finish, error, status);
  obj.job.finish = finish;
  obj.iter = new AuthSessionGen(obj.job, user, password);
  
  obj.job.iter = obj.iter;
  obj.iter.next();
  
  return obj;
}

window.call_api = function call_api(iternew, args, finish, error, status) {
  var obj = {};
  
  obj.job = new NetJob(obj, undefined, finish, error, status);
  
  var iter = iternew(obj.job, args);
  
  iter.job = obj.job;
  obj.iter = obj.job.iter = iter;
  
  obj.iter.next();
  
  return obj;
}

window.get_user_info = function get_user_info(job, args) {
  if (g_app_state.session.tokens == undefined) {
    job.finish = undefined;
    job.error(job, job.owner);
    return;
  }
  
  var token = g_app_state.session.tokens.access;
  api_exec("/api/auth/userinfo?accessToken="+token, job);
  yield;
}

window.get_dir_files = function get_dir_files(job, args) {
  var token = g_app_state.session.tokens.access;
  var path = args.path;
  
  if (path == undefined) {
    api_exec("/api/files/dir/list?accessToken="+token+"&id="+args.id, job);
  } else {
    api_exec("/api/files/dir/list?accessToken="+token+"&path="+path, job);
  }
  
  yield;
}

window.upload_file = function upload_file(job, args) {
  var suffix;
  
  job.status_data._client_control = true;
  
  var url = args.url;
  var url2 = args.chunk_url
  
  api_exec(url, job);  
  yield 1;
  
  if (DEBUG.netio)
    console.log(job.value);
  
  var upload_token = job.value.uploadToken;
  
  var data = args.data;
  var len = data.byteLength;
  var csize = 1024*256;
  
  var c = 0;
  var ilen = Math.ceil(len/csize);
  
  var prog = 0.0;
  var dp = 1.0/ilen;
  
  if (DEBUG.netio)
    console.log("beginning upload", ilen);
  for (var i=0; i<ilen; i++) {
    if (DEBUG.netio)
      console.log("Uploading chunk "+(i+1)+" of "+ilen);
    
    var url = url2 + "&uploadToken="+upload_token;
    var size = i == ilen-1 ? len%(csize) : csize;
    
    if (DEBUG.netio)    
      console.log(i*csize, size, data);
    
    var chunk = new DataView(data, i*csize, size);
    var last = i*csize+size-1;
    
    var headers = {
      "Content-Range" : "bytes "+c+"-"+(c+size-1)+"/"+len
    }
    
    if (DEBUG.netio)
      console.log(headers["Content-Range"], size, c, chunk)
    
    api_exec(url, job, "PUT", chunk, undefined, headers);
    yield;
    
    c += size;
    
    prog += dp;
    job.status_data.progress = prog;
    if (job.status) {
      job.status(job, job.owner, job.status_data);
      if (job.status.cancel) {
        job.finish = undefined;
        job.req.abort();
        break;
      }
    }
  }
}

window.get_file_data = function get_file_data(job, args) {
  var token = g_app_state.session.tokens.access;
  var path = args.path;
  
  var url;
  if (path == undefined) {
    url = "/api/files/get?accessToken="+token+"&id="+args.id;
  } else {
    url = "/api/files/get?accessToken="+token+"&path="+path;
  }
  
  api_exec(url, job, undefined, undefined, undefined, undefined, "arraybuffer");
  yield;
}
