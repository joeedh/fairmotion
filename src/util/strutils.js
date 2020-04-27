"use strict";

export function encode_utf8(arr, str) {
  for (var i=0; i<str.length; i++) {
    var c = str.charCodeAt(i);
    
    while (c != 0) {
      var uc = c & 127;
      c = c>>7;
      
      if (c != 0)
        uc |= 128;
      
      arr.push(uc);
    }
  }
}

export function decode_utf8(arr) {
  var str = ""
  var i = 0;
  
  while (i < arr.length) {
    var c = arr[i];
    var sum = c & 127;
    var j = 0;
    var lasti = i;
    
    while (i < arr.length && (c & 128)) {
      j += 7;
      i++;
      c = arr[i];
      
      c = (c&127)<<j;
      sum |= c;
    }
    
    if (sum == 0) break;
    
    str += String.fromCharCode(sum);
    i++;
  }
  
  return str;
}

export function test_utf8()
{
  var s = "a" + String.fromCharCode(8800) + "b";
  var arr = [];
  
  encode_utf8(arr, s);
  var s2 = decode_utf8(arr);
  
  if (s != s2) {
    throw new Error("UTF-8 encoding/decoding test failed");
  }
  
  return true;
}

export function truncate_utf8(Array<byte>arr, int maxlen)
{
  var len = Math.min(arr.length, maxlen);
  
  var last_codepoint = 0;
  var last2 = 0;
  
  var incode = false;
  var i = 0;
  var code = 0;
  while (i < len) {
    incode = arr[i] & 128;
    
    if (!incode) {
      last2 = last_codepoint+1;
      last_codepoint = i+1;
    }
    
    i++;
  }
  
  if (last_codepoint < maxlen)
    arr.length = last_codepoint;
  else
    arr.length = last2;
    
  return arr;
}

var _b64str='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
var _b64_map = {}

for (var i=0; i<64; i++) {
  _b64_map[_b64str[i]] = i;
}
_b64_map["="] = 65;

var _b64_arr = [0, 1, 2, 3];
export function b64encode(arr, add_newlines=false, collimit=76) {
  global _b64str;
  var s = "";
  var is_str = btypeof(arr) == "string";
  
  var ci = 0;
  for (var i=0; i<arr.length-2; i += 3) {
    if (arr[i] < 0 || arr[i] > 255) {
      console.log("Invalid input ", arr[i], " at index ", i, " passed to B64Encode")
      throw new Error("Invalid input " + arr[i] +" at index " + i +" passed to B64Encode");
    }
    
    var a = arr[i], b = arr[i+1], c = arr[i+2];
    if (is_str) {
      a = a.charCodeAt(0);
      b = b.charCodeAt(0);
      c = c.charCodeAt(0);
    }
    var n = a | (b << 8) | (c << 16)
    
    var b1 = n & 63;
    var b2 = (n>>6) & 63;
    var b3 = (n>>12) & 63;
    var b4 = (n>>18) & 63;
  
    _b64_arr[0] = b1; _b64_arr[1] = b2; _b64_arr[2] = b3; _b64_arr[3] = b4;
    for (var j=0; j<4; j++) {
      if (ci >= collimit && add_newlines) {
        ci = 0;
        s += "\n";
      }
      
      s += _b64str.charAt(_b64_arr[j]);
      ci++;
    }
  }
  
  if ((arr.length % 3) != 0) {
    i = arr.length % 3;
    
    if (i == 1) {
      var n = arr[arr.length-1];
      if (is_str)
        n = n.charCodeAt(0);
      
      var b1 = n & 63;
      var b2 = (n>>6) & 63;
      
      s += _b64str.charAt(b1) + _b64str.charAt(b2) + "==";
    } else {
      var n;
      
      if (is_str)
        n = arr[arr.length-2].charCodeAt(0) | (arr[arr.length-1].charCodeAt(0)<<8);
      else 
        n = arr[arr.length-2] | (arr[arr.length-1]<<8);
      
      var b1 = n & 63;
      var b2 = (n>>6) & 63;
      var b3 = (n>>12) & 63;
      
      s += _b64str.charAt(b1) + _b64str.charAt(b2) + _b64str.charAt(b3) + "=";
    }
  }
  
  return s;
}

export function b64decode(s, gen_str=false, gen_uint8arr=true) {
  var s2 = ""
  for (var i=0; i<s.length; i++) {
    if (s[i] != "\n" && s[i] != "\r" && s[i] != " " && s[i] != "\t")
      s2 += s[i];
  }
  
  s = s2;
  s2 = gen_str ? "" : []
  
  for (var i=0; i<s.length; i += 4) {
    var a = _b64_map[s[i]], b = _b64_map[s[i+1]], c = _b64_map[s[i+2]], d=_b64_map[s[i+3]];
    var n = a | (b<<6) | (c<<12) | (d<<18)
    
    if (c == 65) {
      a = n & 255;
      if (gen_str)
        s2 += String.fromCharCode(a);
      else
        s2.push(a);
      
      continue;
    } else if (d == 65) {
      a = n & 255;
      b = (n>>8) & 255;
      if (gen_str) {
        s2 += String.fromCharCode(a) + String.fromCharCode(b);
      } else {
        s2.push(a); s2.push(b);
      }
      
      continue;
    }
    
    a = n & 255;
    b = (n>>8) & 255;
    c = (n>>16) & 255;
    
    if (gen_str) {
      s2 += String.fromCharCode(a) + String.fromCharCode(b);
      if (d != "=")
        s2 += String.fromCharCode(c);
    } else {
      s2.push(a); s2.push(b); 
      if (d != "=")
        s2.push(c);
    }
  }
  
  if (!gen_str && gen_uint8arr)
    s2 = new Uint8Array(s2);
  
  return s2;
}

export function limit_line(s, limit=80) {
  var s2 = "";
  var ci = 0;
  
  for (var i=0; i<s.length; i++) {
    if (ci > limit) {
      s2 += "\n";
      ci = 0;
    }
    
    if (s2 == "\n")
      ci = 0;
    
    s2 += s.charAt(i);
    ci++;
  }
  
  return s2;
}

var perc_unres = "abcdefghijklmnopqrstuvwxyz";
perc_unres += perc_unres.toUpperCase();
perc_unres += "-_.~"

//transform into array form
var a = [];
for (var i=0; i<perc_unres.length; i++) {
  a.push(perc_unres.charCodeAt(i));
}
perc_unres = a;

var perc_res = " %\n\r\t!*'();:@&=+$,/?#[]"
var a = [];
for (var i=0; i<perc_res.length; i++) {
  a.push(perc_res.charCodeAt(i));
}
perc_res = a;

export function urlencode(s) {
  var s2 = "";
  
  var arr = [];
  encode_utf8(arr, s);
  console.log("arr", arr);
  
  for (var i=0; i<arr.length; i++) {
    var c = arr[i];
    
    if (perc_unres.indexOf(c) >= 0) {
      s2 += String.fromCharCode(c);
    } else if (perc_res.indexOf(c) >= 0) {
      var h = c.toString(16);
      s2 += "%" + h;
    } else {
      s2 += String.fromCharCode(c);
    }
  }
  
  return s2;
}

export function encode_dataurl(mimetype, buffer) {
  var uview = new Uint8Array(buffer);
  
  var ret = "data:"+mimetype+";base64,"
  
  //stupid differing base64 encodings, bleh. . .
  //ret += b64encode(uview, false);
  
  //use native JS version (which is for strings).
  var b64 = "";
  for (var i=0; i<uview.length; i++) {
    b64 += String.fromCharCode(uview[i]);
  }
  
  b64 = btoa(b64);
  ret += b64;
  
  return ret;
}
