"not_a_module";
if (Array.prototype.pop_i===undefined) {
    Array.prototype.pop_i = function pop_i(idx, throw_on_error) {
      if (idx<0||idx>=this.length||isNaN(idx)) {
          if (throw_on_error) {
              throw new Error(""+idx+" is out of bounds");
          }
          else {
            console.log(""+idx+" is out of bounds", this);
            return ;
          }
      }
      var ret=this[idx];
      while (idx<this.length-1) {
        this[idx] = this[idx+1];
        idx++;
      }
      this[this.length-1] = undefined;
      this.length--;
      return ret;
    };
}
function startup_report(message) {
  console.log("%c "+message+"", "color:green");
}
function startup_warning(message) {
  console.trace("%c "+message+"\n\n", "color:red");
}
function warn(message) {
  var args=["%c "+message+"\n", "color:orange"];
  for (var i=1; i<arguments.length; i++) {
      args.push(arguments[i]);
  }
  console.log.apply(console, args);
}
function warntrace(message) {
  var args=["%c "+message+"\n", "color:orange"];
  for (var i=1; i<arguments.length; i++) {
      args.push(arguments[i]);
  }
  console.trace.apply(console, args);
}
if (Symbol.keystr===undefined) {
    Symbol.keystr = Symbol("keystr");
}
if (Array.prototype.remove===undefined) {
    Array.prototype.remove = function (item, hide_error) {
      var i=this.indexOf(item);
      if (i<0) {
          if (hide_error)
            console.trace("Error: item", item, "not in array", this);
          else 
            throw new Error("Item "+item+" not in array");
          return ;
      }
      var len=this.length;
      while (i<len) {
        this[i] = this[i+1];
        i++;
      }
      this.length--;
    };
}
if (String.startsWith==undefined) {
    String.prototype.startsWith = function (str) {
      if (str.length>this.length)
        return false;
      for (var i=0; i<str.length; i++) {
          if (this[i]!=str[i])
            return false;
      }
      return true;
    };
}
if (String.endsWith==undefined) {
    String.prototype.endsWith = function (str) {
      if (str.length>this.length)
        return false;
      for (var i=0; i<str.length; i++) {
          if (this[this.length-str.length+i]!=str[i])
            return false;
      }
      return true;
    };
}
if (String.contains==undefined) {
    String.prototype.contains = function (str) {
      if (str.length>this.length)
        return false;
      for (var i=0; i<this.length-str.length+1; i++) {
          var found=true;
          for (var j=0; j<str.length; j++) {
              if (this[i+j]!=str[j]) {
                  found = false;
                  break;
              }
          }
          if (found)
            return true;
      }
      return false;
    };
}
window._my_object_keys = function (obj) {
  var arr=[];
  for (var k in obj) {
      arr.push(k);
  }
  return arr;
};
function is_str(str) {
  return typeof str=="string"||typeof str=="String";
}
function get_type_name(obj) {
  if (obj==undefined)
    return "undefined";
  if (obj.constructor!=undefined&&obj.constructor.name!=undefined&&obj.constructor.name!="")
    return obj.constructor.name;
  var c;
  try {
    var c=obj.toSource();
  }
  catch (Error) {
      c = "";
  }
  if (obj.toString().startsWith("[object ")) {
      var c2=obj.toString().replace("[object ", "").replace("]", "");
      if (c2!="Object"&&c2!="Array") {
          return c2;
      }
  }
  if (c.contains(">")&&c.contains("<")&&!c.contains(" ")&&!c.contains(",")&&!c.contains(".")) {
      c = c.replace(">", "").replace("<", "");
      if (c!="Object"&&c!="Array") {
          return c;
      }
  }
  if (obj.constructor==MouseEvent)
    return "MouseEvent";
  if (obj.constructor==KeyEvent)
    return "KeyEvent";
  if (obj.constructor==KeyboardEvent)
    return "KeyboardEvent";
  return "(unknown)";
}
function obj_get_keys(obj) {
  var ret=[];
  for (var k in obj) {
      if (obj.hasOwnProperty(k))
        ret.push(k);
  }
  return ret;
}
window._do_frame_debug = false;
window._do_iter_err_stacktrace = true;
window.FrameContinue = {"FC": 1};
window.FrameBreak = {"FB": 1};
function getattr(obj, attr) {
  return obj[attr];
}
function setattr(obj, attr, val) {
  obj[attr] = val;
}
function delattr(obj, attr) {
  delete obj[attr];
}
"not_a_module";
"no_type_logging";
function a() {
}
es6_module_define('object_cache', [], function _object_cache_module(_es6_module) {
  "use strict";
  var $_mh;
  var $_swapt;
  var CACHE_CYCLE_SIZE=256;
  function _cache_copy_object(obj) {
    var ob2;
    if (typeof obj=="string")
      return String(obj);
    else 
      if (typeof obj=="number")
      return Number(obj);
    else 
      if (typeof obj=="boolean")
      return Boolean(obj);
    else 
      if (typeof obj=="function")
      return obj;
    else 
      if (__instance_of(obj, String))
      return new obj.constructor(obj);
    else 
      if (__instance_of(obj, Number))
      return new obj.constructor(obj);
    else 
      if (__instance_of(obj, Boolean))
      return new obj.constructor(obj);
    else 
      if (obj===undefined)
      return undefined;
    else 
      if (obj===null)
      return null;
    else 
      if (typeof (obj.copy)=="function")
      return obj.copy();
    if (obj.constructor&&obj.constructor.prototype) {
        ob2 = Object.create(obj.constructor.prototype);
        ob2.constructor = obj.constructor;
    }
    if (obj.constructor==Array||typeof obj=="array")
      ob2 = new Array(obj.length);
    else 
      ob2 = {}
    var keys=Object.getOwnPropertyNames(obj);
    for (var i=0; i<keys.length; i++) {
        var k=keys[i];
        var d=Object.getOwnPropertyDescriptor(obj, k);
        if (("get" in d)||("set" in d)) {
            Object.defineProperty(ob2, k, d);
        }
        else 
          if (obj.hasOwnProperty(k)&&k!="_c_id") {
            ob2[k] = _cache_copy_object(obj[k]);
        }
    }
    return ob2;
  }
  var copy_object_deep=_cache_copy_object;
  var _cache_id_gen=1;
  class CacheCycle extends GArray {
     constructor(obj, tot) {
      super(tot);
      for (var i=0; i<tot; i++) {
          this[i] = _cache_copy_object(obj);
          this[i]._cache_id = _cache_id_gen++;
      }
      this.cur = 0;
      this.length = tot;
    }
     next() {
      var ret=this[this.cur];
      this.cur = (this.cur+1)%this.length;
      return ret;
    }
  }
  _ESClass.register(CacheCycle);
  _es6_module.add_class(CacheCycle);
  
  var _c_idgen=0;
  class ObjectCache  {
     constructor() {
      this.cycles = {};
      this.arrays = {};
      this.idmap = {};
    }
     cache_remove(obj) {
      if (obj==undefined||!("_cache_id" in obj)) {
          console.trace();
          console.log("WARNING: non-cached object ", obj, ", passed to ObjectCache.cache_remove");
          return ;
      }
      var cycle=this.cycles[obj._cache_id];
      cycle.remove(obj);
      delete obj._cache_id;
    }
     raw_fetch(templ, tot=CACHE_CYCLE_SIZE) {
      var id=templ._c_id;
      if (id==undefined)
        id = _c_idgen++;
      if (!(id in this.cycles)) {
          this.cycles[id] = new CacheCycle(templ, tot);
          var c=this.cycles[id];
          for (var i=0; i<c.length; i++) {
              this.idmap[c[i]._cache_id] = c;
          }
      }
      if (templ._c_id==undefined)
        templ._c_id = id;
      return this.cycles[id].next();
    }
     is_cache_obj(obj) {
      return "_cache_id" in obj;
    }
     fetch(descriptor) {
      var d=descriptor;
      if (d.cachesize==undefined)
        d.cachesize = CACHE_CYCLE_SIZE;
      var obj=this.raw_fetch(d.obj, d.cachesize);
      if (d.init!=undefined)
        d.init(obj);
      return obj;
    }
     getarr() {
      var arr=this.array(arguments.length);
      for (var i=0; i<arguments.length; i++) {
          arr[i] = arguments[i];
      }
      return arr;
    }
     array(len) {
      var arr;
      if (!(len in this.arrays)) {
          arr = new Array(len);
          arr.length = len;
          this.arrays[len] = arr;
      }
      else {
        arr = this.arrays[len];
      }
      var arr2=this.raw_fetch(arr, 8192);
      arr2.length = len;
      if (arr2.length>8) {
          for (var i=0; i<arr2.length; i++) {
              arr2[i] = undefined;
          }
          arr2.length = len;
      }
      return arr2;
    }
  }
  _ESClass.register(ObjectCache);
  _es6_module.add_class(ObjectCache);
  var objcache=window.objcache = new ObjectCache();
  var _itempl={done: false, 
   value: undefined}
  function cached_iret() {
    var ret=objcache.raw_fetch(_itempl);
    ret.done = false;
    ret.value = undefined;
    return ret;
  }
}, '/dev/fairmotion/src/util/object_cache.js');
es6_module_define('bezier', [], function _bezier_module(_es6_module) {
  function d2bez3(k1, k2, k3, s) {
    return 2.0*(k1-k2-(k2-k3));
  }
  d2bez3 = _es6_module.add_export('d2bez3', d2bez3);
  function dbez3(k1, k2, k3, s) {
    return 2.0*(k1*s-k1-2.0*k2*s+k2+k3*s);
  }
  dbez3 = _es6_module.add_export('dbez3', dbez3);
  function bez3(k1, k2, k3, s) {
    return ((k1-k2)*s-k1-((k2-k3)*s-k2))*s-((k1-k2)*s-k1);
  }
  bez3 = _es6_module.add_export('bez3', bez3);
  function ibez3(k1, k2, k3, s) {
    return (-(((2.0*s-3.0)*k2-k3*s)*s-(s**2-3.0*s+3.0)*k1)*s)/3.0;
  }
  ibez3 = _es6_module.add_export('ibez3', ibez3);
  function d2bez4(k1, k2, k3, k4, s) {
    return -6.0*(k1*s-k1-3.0*k2*s+2.0*k2+3.0*k3*s-k3-k4*s);
  }
  d2bez4 = _es6_module.add_export('d2bez4', d2bez4);
  function dbez4(k1, k2, k3, k4, s) {
    return -3.0*(k1*s**2-2.0*k1*s+k1-3.0*k2*s**2+4.0*k2*s-k2+3.0*k3*s**2-2.0*k3*s-k4*s**2);
  }
  dbez4 = _es6_module.add_export('dbez4', dbez4);
  function bez4(k1, k2, k3, k4, s) {
    return -(((3.0*(s-1.0)*k3-k4*s)*s-3.0*(s-1.0)**2*k2)*s+(s-1.0)**3*k1);
  }
  bez4 = _es6_module.add_export('bez4', bez4);
  function ibez4(k1, k2, k3, k4, s) {
    return (-(((3.0*s-4.0)*k3-k4*s)*s**2+(s**2-2.0*s+2.0)*(s-2.0)*k1-(3.0*s**2-8.0*s+6.0)*k2*s)*s)/4.0;
  }
  ibez4 = _es6_module.add_export('ibez4', ibez4);
  function curv4(x1, y1, x2, y2, x3, y3, x4, y4, s) {
    let dx1=dbez4(x1, x2, x3, x4, s);
    let dy1=dbez4(y1, y2, y3, y4, s);
    let dx2=dbez4(x1, x2, x3, x4, s);
    let dy2=dbez4(y1, y2, y3, y4, s);
    return (dx1*dy2-dy1*dx2)/Math.pow(dx1*dx1+dy1*dy1, 3.0/2.0);
  }
  curv4 = _es6_module.add_export('curv4', curv4);
}, '/dev/fairmotion/src/util/bezier.js');
"not_a_module";
var CryptoJS=CryptoJS||(function (Math, undefined) {
  var C={}
  var C_lib=C.lib = {}
  var Base=C_lib.Base = (function () {
    function F() {
    }
    return {extend: function (overrides) {
        F.prototype = this;
        var subtype=new F();
        if (overrides) {
            subtype.mixIn(overrides);
        }
        if (!subtype.hasOwnProperty('init')) {
            subtype.init = function () {
              subtype.$super.init.apply(this, arguments);
            };
        }
        subtype.init.prototype = subtype;
        subtype.$super = this;
        return subtype;
      }, 
    create: function () {
        var instance=this.extend();
        instance.init.apply(instance, arguments);
        return instance;
      }, 
    init: function () {
      }, 
    mixIn: function (properties) {
        for (var propertyName in properties) {
            if (properties.hasOwnProperty(propertyName)) {
                this[propertyName] = properties[propertyName];
            }
        }
        if (properties.hasOwnProperty('toString')) {
            this.toString = properties.toString;
        }
      }, 
    clone: function () {
        return this.init.prototype.extend(this);
      }}
  }());
  var WordArray=C_lib.WordArray = Base.extend({init: function (words, sigBytes) {
      words = this.words = words||[];
      if (sigBytes!=undefined) {
          this.sigBytes = sigBytes;
      }
      else {
        this.sigBytes = words.length*4;
      }
    }, 
   toString: function (encoder) {
      return (encoder||Hex).stringify(this);
    }, 
   concat: function (wordArray) {
      var thisWords=this.words;
      var thatWords=wordArray.words;
      var thisSigBytes=this.sigBytes;
      var thatSigBytes=wordArray.sigBytes;
      this.clamp();
      if (thisSigBytes%4) {
          for (var i=0; i<thatSigBytes; i++) {
              var thatByte=(thatWords[i>>>2]>>>(24-(i%4)*8))&0xff;
              thisWords[(thisSigBytes+i)>>>2]|=thatByte<<(24-((thisSigBytes+i)%4)*8);
          }
      }
      else 
        if (thatWords.length>0xffff) {
          for (var i=0; i<thatSigBytes; i+=4) {
              thisWords[(thisSigBytes+i)>>>2] = thatWords[i>>>2];
          }
      }
      else {
        thisWords.push.apply(thisWords, thatWords);
      }
      this.sigBytes+=thatSigBytes;
      return this;
    }, 
   clamp: function () {
      var words=this.words;
      var sigBytes=this.sigBytes;
      words[sigBytes>>>2]&=0xffffffff<<(32-(sigBytes%4)*8);
      words.length = Math.ceil(sigBytes/4);
    }, 
   clone: function () {
      var clone=Base.clone.call(this);
      clone.words = this.words.slice(0);
      return clone;
    }, 
   random: function (nBytes) {
      var words=[];
      for (var i=0; i<nBytes; i+=4) {
          words.push((Math.random()*0x100000000)|0);
      }
      return new WordArray.init(words, nBytes);
    }});
  var C_enc=C.enc = {}
  var Hex=C_enc.Hex = {stringify: function (wordArray) {
      var words=wordArray.words;
      var sigBytes=wordArray.sigBytes;
      var hexChars=[];
      for (var i=0; i<sigBytes; i++) {
          var bite=(words[i>>>2]>>>(24-(i%4)*8))&0xff;
          hexChars.push((bite>>>4).toString(16));
          hexChars.push((bite&0xf).toString(16));
      }
      return hexChars.join('');
    }, 
   parse: function (hexStr) {
      var hexStrLength=hexStr.length;
      var words=[];
      for (var i=0; i<hexStrLength; i+=2) {
          words[i>>>3]|=parseInt(hexStr.substr(i, 2), 16)<<(24-(i%8)*4);
      }
      return new WordArray.init(words, hexStrLength/2);
    }}
  var Latin1=C_enc.Latin1 = {stringify: function (wordArray) {
      var words=wordArray.words;
      var sigBytes=wordArray.sigBytes;
      var latin1Chars=[];
      for (var i=0; i<sigBytes; i++) {
          var bite=(words[i>>>2]>>>(24-(i%4)*8))&0xff;
          latin1Chars.push(String.fromCharCode(bite));
      }
      return latin1Chars.join('');
    }, 
   parse: function (latin1Str) {
      var latin1StrLength=latin1Str.length;
      var words=[];
      for (var i=0; i<latin1StrLength; i++) {
          words[i>>>2]|=(latin1Str.charCodeAt(i)&0xff)<<(24-(i%4)*8);
      }
      return new WordArray.init(words, latin1StrLength);
    }}
  var Utf8=C_enc.Utf8 = {stringify: function (wordArray) {
      try {
        return decodeURIComponent(escape(Latin1.stringify(wordArray)));
      }
      catch (e) {
          throw new Error('Malformed UTF-8 data');
      }
    }, 
   parse: function (utf8Str) {
      return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
    }}
  var BufferedBlockAlgorithm=C_lib.BufferedBlockAlgorithm = Base.extend({reset: function () {
      this._data = new WordArray.init();
      this._nDataBytes = 0;
    }, 
   _append: function (data) {
      if (typeof data=='string') {
          data = Utf8.parse(data);
      }
      this._data.concat(data);
      this._nDataBytes+=data.sigBytes;
    }, 
   _process: function (doFlush) {
      var data=this._data;
      var dataWords=data.words;
      var dataSigBytes=data.sigBytes;
      var blockSize=this.blockSize;
      var blockSizeBytes=blockSize*4;
      var nBlocksReady=dataSigBytes/blockSizeBytes;
      if (doFlush) {
          nBlocksReady = Math.ceil(nBlocksReady);
      }
      else {
        nBlocksReady = Math.max((nBlocksReady|0)-this._minBufferSize, 0);
      }
      var nWordsReady=nBlocksReady*blockSize;
      var nBytesReady=Math.min(nWordsReady*4, dataSigBytes);
      if (nWordsReady) {
          for (var offset=0; offset<nWordsReady; offset+=blockSize) {
              this._doProcessBlock(dataWords, offset);
          }
          var processedWords=dataWords.splice(0, nWordsReady);
          data.sigBytes-=nBytesReady;
      }
      return new WordArray.init(processedWords, nBytesReady);
    }, 
   clone: function () {
      var clone=Base.clone.call(this);
      clone._data = this._data.clone();
      return clone;
    }, 
   _minBufferSize: 0});
  var Hasher=C_lib.Hasher = BufferedBlockAlgorithm.extend({cfg: Base.extend(), 
   init: function (cfg) {
      this.cfg = this.cfg.extend(cfg);
      this.reset();
    }, 
   reset: function () {
      BufferedBlockAlgorithm.reset.call(this);
      this._doReset();
    }, 
   update: function (messageUpdate) {
      this._append(messageUpdate);
      this._process();
      return this;
    }, 
   finalize: function (messageUpdate) {
      if (messageUpdate) {
          this._append(messageUpdate);
      }
      var hash=this._doFinalize();
      return hash;
    }, 
   blockSize: 512/32, 
   _createHelper: function (hasher) {
      return function (message, cfg) {
        return new hasher.init(cfg).finalize(message);
      }
    }, 
   _createHmacHelper: function (hasher) {
      return function (message, key) {
        return new C_algo.HMAC.init(hasher, key).finalize(message);
      }
    }});
  var C_algo=C.algo = {}
  return C;
}(Math));
(function () {
  var C=CryptoJS;
  var C_lib=C.lib;
  var WordArray=C_lib.WordArray;
  var C_enc=C.enc;
  var Base64=C_enc.Base64 = {stringify: function (wordArray) {
      var words=wordArray.words;
      var sigBytes=wordArray.sigBytes;
      var map=this._map;
      wordArray.clamp();
      var base64Chars=[];
      for (var i=0; i<sigBytes; i+=3) {
          var byte1=(words[i>>>2]>>>(24-(i%4)*8))&0xff;
          var byte2=(words[(i+1)>>>2]>>>(24-((i+1)%4)*8))&0xff;
          var byte3=(words[(i+2)>>>2]>>>(24-((i+2)%4)*8))&0xff;
          var triplet=(byte1<<16)|(byte2<<8)|byte3;
          for (var j=0; (j<4)&&(i+j*0.75<sigBytes); j++) {
              base64Chars.push(map.charAt((triplet>>>(6*(3-j)))&0x3f));
          }
      }
      var paddingChar=map.charAt(64);
      if (paddingChar) {
          while (base64Chars.length%4) {
            base64Chars.push(paddingChar);
          }
      }
      return base64Chars.join('');
    }, 
   parse: function (base64Str) {
      var base64StrLength=base64Str.length;
      var map=this._map;
      var paddingChar=map.charAt(64);
      if (paddingChar) {
          var paddingIndex=base64Str.indexOf(paddingChar);
          if (paddingIndex!=-1) {
              base64StrLength = paddingIndex;
          }
      }
      var words=[];
      var nBytes=0;
      for (var i=0; i<base64StrLength; i++) {
          if (i%4) {
              var bits1=map.indexOf(base64Str.charAt(i-1))<<((i%4)*2);
              var bits2=map.indexOf(base64Str.charAt(i))>>>(6-(i%4)*2);
              words[nBytes>>>2]|=(bits1|bits2)<<(24-(nBytes%4)*8);
              nBytes++;
          }
      }
      return WordArray.create(words, nBytes);
    }, 
   _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='}
}());
(function () {
  var C=CryptoJS;
  var C_lib=C.lib;
  var WordArray=C_lib.WordArray;
  var Hasher=C_lib.Hasher;
  var C_algo=C.algo;
  var W=[];
  var SHA1=C_algo.SHA1 = Hasher.extend({_doReset: function () {
      this._hash = new WordArray.init([0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0]);
    }, 
   _doProcessBlock: function (M, offset) {
      var H=this._hash.words;
      var a=H[0];
      var b=H[1];
      var c=H[2];
      var d=H[3];
      var e=H[4];
      for (var i=0; i<80; i++) {
          if (i<16) {
              W[i] = M[offset+i]|0;
          }
          else {
            var n=W[i-3]^W[i-8]^W[i-14]^W[i-16];
            W[i] = (n<<1)|(n>>>31);
          }
          var t=((a<<5)|(a>>>27))+e+W[i];
          if (i<20) {
              t+=((b&c)|(~b&d))+0x5a827999;
          }
          else 
            if (i<40) {
              t+=(b^c^d)+0x6ed9eba1;
          }
          else 
            if (i<60) {
              t+=((b&c)|(b&d)|(c&d))-0x70e44324;
          }
          else {
            t+=(b^c^d)-0x359d3e2a;
          }
          e = d;
          d = c;
          c = (b<<30)|(b>>>2);
          b = a;
          a = t;
      }
      H[0] = (H[0]+a)|0;
      H[1] = (H[1]+b)|0;
      H[2] = (H[2]+c)|0;
      H[3] = (H[3]+d)|0;
      H[4] = (H[4]+e)|0;
    }, 
   _doFinalize: function () {
      var data=this._data;
      var dataWords=data.words;
      var nBitsTotal=this._nDataBytes*8;
      var nBitsLeft=data.sigBytes*8;
      dataWords[nBitsLeft>>>5]|=0x80<<(24-nBitsLeft%32);
      dataWords[(((nBitsLeft+64)>>>9)<<4)+14] = Math.floor(nBitsTotal/0x100000000);
      dataWords[(((nBitsLeft+64)>>>9)<<4)+15] = nBitsTotal;
      data.sigBytes = dataWords.length*4;
      this._process();
      return this._hash;
    }, 
   clone: function () {
      var clone=Hasher.clone.call(this);
      clone._hash = this._hash.clone();
      return clone;
    }});
  C.SHA1 = Hasher._createHelper(SHA1);
  C.HmacSHA1 = Hasher._createHmacHelper(SHA1);
}());
"not_a_module";
var Base64String={compressToUTF16: function (input) {
    var output="", i, c, current, status=0;
    input = this.compress(input);
    for (i = 0; i<input.length; i++) {
        c = input.charCodeAt(i);
        switch (status++) {
          case 0:
            output+=String.fromCharCode((c>>1)+32);
            current = (c&1)<<14;
            break;
          case 1:
            output+=String.fromCharCode((current+(c>>2))+32);
            current = (c&3)<<13;
            break;
          case 2:
            output+=String.fromCharCode((current+(c>>3))+32);
            current = (c&7)<<12;
            break;
          case 3:
            output+=String.fromCharCode((current+(c>>4))+32);
            current = (c&15)<<11;
            break;
          case 4:
            output+=String.fromCharCode((current+(c>>5))+32);
            current = (c&31)<<10;
            break;
          case 5:
            output+=String.fromCharCode((current+(c>>6))+32);
            current = (c&63)<<9;
            break;
          case 6:
            output+=String.fromCharCode((current+(c>>7))+32);
            current = (c&127)<<8;
            break;
          case 7:
            output+=String.fromCharCode((current+(c>>8))+32);
            current = (c&255)<<7;
            break;
          case 8:
            output+=String.fromCharCode((current+(c>>9))+32);
            current = (c&511)<<6;
            break;
          case 9:
            output+=String.fromCharCode((current+(c>>10))+32);
            current = (c&1023)<<5;
            break;
          case 10:
            output+=String.fromCharCode((current+(c>>11))+32);
            current = (c&2047)<<4;
            break;
          case 11:
            output+=String.fromCharCode((current+(c>>12))+32);
            current = (c&4095)<<3;
            break;
          case 12:
            output+=String.fromCharCode((current+(c>>13))+32);
            current = (c&8191)<<2;
            break;
          case 13:
            output+=String.fromCharCode((current+(c>>14))+32);
            current = (c&16383)<<1;
            break;
          case 14:
            output+=String.fromCharCode((current+(c>>15))+32, (c&32767)+32);
            status = 0;
            break;
        }
    }
    return output+String.fromCharCode(current+32);
  }, 
  decompressFromUTF16: function (input) {
    var output="", current, c, status=0, i=0;
    while (i<input.length) {
      c = input.charCodeAt(i)-32;
      switch (status++) {
        case 0:
          current = c<<1;
          break;
        case 1:
          output+=String.fromCharCode(current|(c>>14));
          current = (c&16383)<<2;
          break;
        case 2:
          output+=String.fromCharCode(current|(c>>13));
          current = (c&8191)<<3;
          break;
        case 3:
          output+=String.fromCharCode(current|(c>>12));
          current = (c&4095)<<4;
          break;
        case 4:
          output+=String.fromCharCode(current|(c>>11));
          current = (c&2047)<<5;
          break;
        case 5:
          output+=String.fromCharCode(current|(c>>10));
          current = (c&1023)<<6;
          break;
        case 6:
          output+=String.fromCharCode(current|(c>>9));
          current = (c&511)<<7;
          break;
        case 7:
          output+=String.fromCharCode(current|(c>>8));
          current = (c&255)<<8;
          break;
        case 8:
          output+=String.fromCharCode(current|(c>>7));
          current = (c&127)<<9;
          break;
        case 9:
          output+=String.fromCharCode(current|(c>>6));
          current = (c&63)<<10;
          break;
        case 10:
          output+=String.fromCharCode(current|(c>>5));
          current = (c&31)<<11;
          break;
        case 11:
          output+=String.fromCharCode(current|(c>>4));
          current = (c&15)<<12;
          break;
        case 12:
          output+=String.fromCharCode(current|(c>>3));
          current = (c&7)<<13;
          break;
        case 13:
          output+=String.fromCharCode(current|(c>>2));
          current = (c&3)<<14;
          break;
        case 14:
          output+=String.fromCharCode(current|(c>>1));
          current = (c&1)<<15;
          break;
        case 15:
          output+=String.fromCharCode(current|c);
          status = 0;
          break;
      }
      i++;
    }
    return this.decompress(output);
  }, 
  _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", 
  decompress: function (input) {
    var output="";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i=1;
    var odd=input.charCodeAt(0)>>8;
    while (i<input.length*2&&(i<input.length*2-1||odd==0)) {
      if (i%2==0) {
          chr1 = input.charCodeAt(i/2)>>8;
          chr2 = input.charCodeAt(i/2)&255;
          if (i/2+1<input.length)
            chr3 = input.charCodeAt(i/2+1)>>8;
          else 
            chr3 = NaN;
      }
      else {
        chr1 = input.charCodeAt((i-1)/2)&255;
        if ((i+1)/2<input.length) {
            chr2 = input.charCodeAt((i+1)/2)>>8;
            chr3 = input.charCodeAt((i+1)/2)&255;
        }
        else 
          chr2 = chr3 = NaN;
      }
      i+=3;
      enc1 = chr1>>2;
      enc2 = ((chr1&3)<<4)|(chr2>>4);
      enc3 = ((chr2&15)<<2)|(chr3>>6);
      enc4 = chr3&63;
      if (isNaN(chr2)||(i==input.length*2+1&&odd)) {
          enc3 = enc4 = 64;
      }
      else 
        if (isNaN(chr3)||(i==input.length*2&&odd)) {
          enc4 = 64;
      }
      output = output+this._keyStr.charAt(enc1)+this._keyStr.charAt(enc2)+this._keyStr.charAt(enc3)+this._keyStr.charAt(enc4);
    }
    return output;
  }, 
  compress: function (input) {
    var output="", ol=1, output_, chr1, chr2, chr3, enc1, enc2, enc3, enc4, i=0, flush=false;
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    while (i<input.length) {
      enc1 = this._keyStr.indexOf(input.charAt(i++));
      enc2 = this._keyStr.indexOf(input.charAt(i++));
      enc3 = this._keyStr.indexOf(input.charAt(i++));
      enc4 = this._keyStr.indexOf(input.charAt(i++));
      chr1 = (enc1<<2)|(enc2>>4);
      chr2 = ((enc2&15)<<4)|(enc3>>2);
      chr3 = ((enc3&3)<<6)|enc4;
      if (ol%2==0) {
          output_ = chr1<<8;
          flush = true;
          if (enc3!=64) {
              output+=String.fromCharCode(output_|chr2);
              flush = false;
          }
          if (enc4!=64) {
              output_ = chr3<<8;
              flush = true;
          }
      }
      else {
        output = output+String.fromCharCode(output_|chr1);
        flush = false;
        if (enc3!=64) {
            output_ = chr2<<8;
            flush = true;
        }
        if (enc4!=64) {
            output+=String.fromCharCode(output_|chr3);
            flush = false;
        }
      }
      ol+=3;
    }
    if (flush) {
        output+=String.fromCharCode(output_);
        output = String.fromCharCode(output.charCodeAt(0)|256)+output.substring(1);
    }
    return output;
  }};
"not_a_module";
var LZString={_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", 
  _f: String.fromCharCode, 
  compressToBase64: function (input) {
    if (input==null)
      return "";
    var output="";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i=0;
    input = LZString.compress(input);
    while (i<input.length*2) {
      if (i%2==0) {
          chr1 = input.charCodeAt(i/2)>>8;
          chr2 = input.charCodeAt(i/2)&255;
          if (i/2+1<input.length)
            chr3 = input.charCodeAt(i/2+1)>>8;
          else 
            chr3 = NaN;
      }
      else {
        chr1 = input.charCodeAt((i-1)/2)&255;
        if ((i+1)/2<input.length) {
            chr2 = input.charCodeAt((i+1)/2)>>8;
            chr3 = input.charCodeAt((i+1)/2)&255;
        }
        else 
          chr2 = chr3 = NaN;
      }
      i+=3;
      enc1 = chr1>>2;
      enc2 = ((chr1&3)<<4)|(chr2>>4);
      enc3 = ((chr2&15)<<2)|(chr3>>6);
      enc4 = chr3&63;
      if (isNaN(chr2)) {
          enc3 = enc4 = 64;
      }
      else 
        if (isNaN(chr3)) {
          enc4 = 64;
      }
      output = output+LZString._keyStr.charAt(enc1)+LZString._keyStr.charAt(enc2)+LZString._keyStr.charAt(enc3)+LZString._keyStr.charAt(enc4);
    }
    return output;
  }, 
  decompressFromBase64: function (input) {
    if (input==null)
      return "";
    var output="", ol=0, output_, chr1, chr2, chr3, enc1, enc2, enc3, enc4, i=0, f=LZString._f;
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    while (i<input.length) {
      enc1 = LZString._keyStr.indexOf(input.charAt(i++));
      enc2 = LZString._keyStr.indexOf(input.charAt(i++));
      enc3 = LZString._keyStr.indexOf(input.charAt(i++));
      enc4 = LZString._keyStr.indexOf(input.charAt(i++));
      chr1 = (enc1<<2)|(enc2>>4);
      chr2 = ((enc2&15)<<4)|(enc3>>2);
      chr3 = ((enc3&3)<<6)|enc4;
      if (ol%2==0) {
          output_ = chr1<<8;
          if (enc3!=64) {
              output+=f(output_|chr2);
          }
          if (enc4!=64) {
              output_ = chr3<<8;
          }
      }
      else {
        output = output+f(output_|chr1);
        if (enc3!=64) {
            output_ = chr2<<8;
        }
        if (enc4!=64) {
            output+=f(output_|chr3);
        }
      }
      ol+=3;
    }
    return LZString.decompress(output);
  }, 
  compressToUTF16: function (input) {
    if (input==null)
      return "";
    var output="", i, c, current, status=0, f=LZString._f;
    input = LZString.compress(input);
    for (var i=0; i<input.length; i++) {
        c = input.charCodeAt(i);
        switch (status++) {
          case 0:
            output+=f((c>>1)+32);
            current = (c&1)<<14;
            break;
          case 1:
            output+=f((current+(c>>2))+32);
            current = (c&3)<<13;
            break;
          case 2:
            output+=f((current+(c>>3))+32);
            current = (c&7)<<12;
            break;
          case 3:
            output+=f((current+(c>>4))+32);
            current = (c&15)<<11;
            break;
          case 4:
            output+=f((current+(c>>5))+32);
            current = (c&31)<<10;
            break;
          case 5:
            output+=f((current+(c>>6))+32);
            current = (c&63)<<9;
            break;
          case 6:
            output+=f((current+(c>>7))+32);
            current = (c&127)<<8;
            break;
          case 7:
            output+=f((current+(c>>8))+32);
            current = (c&255)<<7;
            break;
          case 8:
            output+=f((current+(c>>9))+32);
            current = (c&511)<<6;
            break;
          case 9:
            output+=f((current+(c>>10))+32);
            current = (c&1023)<<5;
            break;
          case 10:
            output+=f((current+(c>>11))+32);
            current = (c&2047)<<4;
            break;
          case 11:
            output+=f((current+(c>>12))+32);
            current = (c&4095)<<3;
            break;
          case 12:
            output+=f((current+(c>>13))+32);
            current = (c&8191)<<2;
            break;
          case 13:
            output+=f((current+(c>>14))+32);
            current = (c&16383)<<1;
            break;
          case 14:
            output+=f((current+(c>>15))+32, (c&32767)+32);
            status = 0;
            break;
        }
    }
    return output+f(current+32);
  }, 
  decompressFromUTF16: function (input) {
    if (input==null)
      return "";
    var output="", current, c, status=0, i=0, f=LZString._f;
    while (i<input.length) {
      c = input.charCodeAt(i)-32;
      switch (status++) {
        case 0:
          current = c<<1;
          break;
        case 1:
          output+=f(current|(c>>14));
          current = (c&16383)<<2;
          break;
        case 2:
          output+=f(current|(c>>13));
          current = (c&8191)<<3;
          break;
        case 3:
          output+=f(current|(c>>12));
          current = (c&4095)<<4;
          break;
        case 4:
          output+=f(current|(c>>11));
          current = (c&2047)<<5;
          break;
        case 5:
          output+=f(current|(c>>10));
          current = (c&1023)<<6;
          break;
        case 6:
          output+=f(current|(c>>9));
          current = (c&511)<<7;
          break;
        case 7:
          output+=f(current|(c>>8));
          current = (c&255)<<8;
          break;
        case 8:
          output+=f(current|(c>>7));
          current = (c&127)<<9;
          break;
        case 9:
          output+=f(current|(c>>6));
          current = (c&63)<<10;
          break;
        case 10:
          output+=f(current|(c>>5));
          current = (c&31)<<11;
          break;
        case 11:
          output+=f(current|(c>>4));
          current = (c&15)<<12;
          break;
        case 12:
          output+=f(current|(c>>3));
          current = (c&7)<<13;
          break;
        case 13:
          output+=f(current|(c>>2));
          current = (c&3)<<14;
          break;
        case 14:
          output+=f(current|(c>>1));
          current = (c&1)<<15;
          break;
        case 15:
          output+=f(current|c);
          status = 0;
          break;
      }
      i++;
    }
    return LZString.decompress(output);
  }, 
  compress: function (uncompressed) {
    if ((__instance_of(uncompressed, Uint8Array))||(__instance_of(uncompressed, Array))) {
        function newarr() {
          this.data = uncompressed;
          this.charAt = function (i) {
            return String.fromCharCode(this.data[i]);
          }
          this.charCodeAt = function (i) {
            return this.data[i];
          }
          this.length = this.data.length;
        }
        uncompressed = new newarr();
    }
    if (uncompressed==null)
      return "";
    var i, value, context_dictionary={}, context_dictionaryToCreate={}, context_c="", context_wc="", context_w="", context_enlargeIn=2, context_dictSize=3, context_numBits=2, context_data_string="", context_data_val=0, context_data_position=0, ii, f=LZString._f;
    for (var ii=0; ii<uncompressed.length; ii+=1) {
        context_c = uncompressed.charAt(ii);
        if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
            context_dictionary[context_c] = context_dictSize++;
            context_dictionaryToCreate[context_c] = true;
        }
        context_wc = context_w+context_c;
        if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
            context_w = context_wc;
        }
        else {
          if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
              if (context_w.charCodeAt(0)<256) {
                  for (var i=0; i<context_numBits; i++) {
                      context_data_val = (context_data_val<<1);
                      if (context_data_position==15) {
                          context_data_position = 0;
                          context_data_string+=f(context_data_val);
                          context_data_val = 0;
                      }
                      else {
                        context_data_position++;
                      }
                  }
                  value = context_w.charCodeAt(0);
                  for (var i=0; i<8; i++) {
                      context_data_val = (context_data_val<<1)|(value&1);
                      if (context_data_position==15) {
                          context_data_position = 0;
                          context_data_string+=f(context_data_val);
                          context_data_val = 0;
                      }
                      else {
                        context_data_position++;
                      }
                      value = value>>1;
                  }
              }
              else {
                value = 1;
                for (var i=0; i<context_numBits; i++) {
                    context_data_val = (context_data_val<<1)|value;
                    if (context_data_position==15) {
                        context_data_position = 0;
                        context_data_string+=f(context_data_val);
                        context_data_val = 0;
                    }
                    else {
                      context_data_position++;
                    }
                    value = 0;
                }
                value = context_w.charCodeAt(0);
                for (var i=0; i<16; i++) {
                    context_data_val = (context_data_val<<1)|(value&1);
                    if (context_data_position==15) {
                        context_data_position = 0;
                        context_data_string+=f(context_data_val);
                        context_data_val = 0;
                    }
                    else {
                      context_data_position++;
                    }
                    value = value>>1;
                }
              }
              context_enlargeIn--;
              if (context_enlargeIn==0) {
                  context_enlargeIn = Math.pow(2, context_numBits);
                  context_numBits++;
              }
              delete context_dictionaryToCreate[context_w];
          }
          else {
            value = context_dictionary[context_w];
            for (var i=0; i<context_numBits; i++) {
                context_data_val = (context_data_val<<1)|(value&1);
                if (context_data_position==15) {
                    context_data_position = 0;
                    context_data_string+=f(context_data_val);
                    context_data_val = 0;
                }
                else {
                  context_data_position++;
                }
                value = value>>1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn==0) {
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
          }
          context_dictionary[context_wc] = context_dictSize++;
          context_w = String(context_c);
        }
    }
    if (context_w!=="") {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
            if (context_w.charCodeAt(0)<256) {
                for (var i=0; i<context_numBits; i++) {
                    context_data_val = (context_data_val<<1);
                    if (context_data_position==15) {
                        context_data_position = 0;
                        context_data_string+=f(context_data_val);
                        context_data_val = 0;
                    }
                    else {
                      context_data_position++;
                    }
                }
                value = context_w.charCodeAt(0);
                for (var i=0; i<8; i++) {
                    context_data_val = (context_data_val<<1)|(value&1);
                    if (context_data_position==15) {
                        context_data_position = 0;
                        context_data_string+=f(context_data_val);
                        context_data_val = 0;
                    }
                    else {
                      context_data_position++;
                    }
                    value = value>>1;
                }
            }
            else {
              value = 1;
              for (var i=0; i<context_numBits; i++) {
                  context_data_val = (context_data_val<<1)|value;
                  if (context_data_position==15) {
                      context_data_position = 0;
                      context_data_string+=f(context_data_val);
                      context_data_val = 0;
                  }
                  else {
                    context_data_position++;
                  }
                  value = 0;
              }
              value = context_w.charCodeAt(0);
              for (var i=0; i<16; i++) {
                  context_data_val = (context_data_val<<1)|(value&1);
                  if (context_data_position==15) {
                      context_data_position = 0;
                      context_data_string+=f(context_data_val);
                      context_data_val = 0;
                  }
                  else {
                    context_data_position++;
                  }
                  value = value>>1;
              }
            }
            context_enlargeIn--;
            if (context_enlargeIn==0) {
                context_enlargeIn = Math.pow(2, context_numBits);
                context_numBits++;
            }
            delete context_dictionaryToCreate[context_w];
        }
        else {
          value = context_dictionary[context_w];
          for (var i=0; i<context_numBits; i++) {
              context_data_val = (context_data_val<<1)|(value&1);
              if (context_data_position==15) {
                  context_data_position = 0;
                  context_data_string+=f(context_data_val);
                  context_data_val = 0;
              }
              else {
                context_data_position++;
              }
              value = value>>1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn==0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
        }
    }
    value = 2;
    for (var i=0; i<context_numBits; i++) {
        context_data_val = (context_data_val<<1)|(value&1);
        if (context_data_position==15) {
            context_data_position = 0;
            context_data_string+=f(context_data_val);
            context_data_val = 0;
        }
        else {
          context_data_position++;
        }
        value = value>>1;
    }
    while (true) {
      context_data_val = (context_data_val<<1);
      if (context_data_position==15) {
          context_data_string+=f(context_data_val);
          break;
      }
      else 
        context_data_position++;
    }
    return context_data_string;
  }, 
  decompress: function (compressed) {
    if (compressed==null)
      return "";
    if (compressed=="")
      return null;
    var dictionary=[], next, enlargeIn=4, dictSize=4, numBits=3, entry="", result="", i, w, bits, resb, maxpower, power, c, f=LZString._f, data={string: compressed, 
    val: compressed.charCodeAt(0), 
    position: 32768, 
    index: 1}
    for (var i=0; i<3; i+=1) {
        dictionary[i] = i;
    }
    bits = 0;
    maxpower = Math.pow(2, 2);
    power = 1;
    while (power!=maxpower) {
      resb = data.val&data.position;
      data.position>>=1;
      if (data.position==0) {
          data.position = 32768;
          data.val = data.string.charCodeAt(data.index++);
      }
      bits|=(resb>0 ? 1 : 0)*power;
      power<<=1;
    }
    switch (next = bits) {
      case 0:
        bits = 0;
        maxpower = Math.pow(2, 8);
        power = 1;
        while (power!=maxpower) {
          resb = data.val&data.position;
          data.position>>=1;
          if (data.position==0) {
              data.position = 32768;
              data.val = data.string.charCodeAt(data.index++);
          }
          bits|=(resb>0 ? 1 : 0)*power;
          power<<=1;
        }
        c = f(bits);
        break;
      case 1:
        bits = 0;
        maxpower = Math.pow(2, 16);
        power = 1;
        while (power!=maxpower) {
          resb = data.val&data.position;
          data.position>>=1;
          if (data.position==0) {
              data.position = 32768;
              data.val = data.string.charCodeAt(data.index++);
          }
          bits|=(resb>0 ? 1 : 0)*power;
          power<<=1;
        }
        c = f(bits);
        break;
      case 2:
        return "";
    }
    dictionary[3] = c;
    w = result = c;
    while (true) {
      if (data.index>data.string.length) {
          return "";
      }
      bits = 0;
      maxpower = Math.pow(2, numBits);
      power = 1;
      while (power!=maxpower) {
        resb = data.val&data.position;
        data.position>>=1;
        if (data.position==0) {
            data.position = 32768;
            data.val = data.string.charCodeAt(data.index++);
        }
        bits|=(resb>0 ? 1 : 0)*power;
        power<<=1;
      }
      switch (c = bits) {
        case 0:
          bits = 0;
          maxpower = Math.pow(2, 8);
          power = 1;
          while (power!=maxpower) {
            resb = data.val&data.position;
            data.position>>=1;
            if (data.position==0) {
                data.position = 32768;
                data.val = data.string.charCodeAt(data.index++);
            }
            bits|=(resb>0 ? 1 : 0)*power;
            power<<=1;
          }
          dictionary[dictSize++] = f(bits);
          c = dictSize-1;
          enlargeIn--;
          break;
        case 1:
          bits = 0;
          maxpower = Math.pow(2, 16);
          power = 1;
          while (power!=maxpower) {
            resb = data.val&data.position;
            data.position>>=1;
            if (data.position==0) {
                data.position = 32768;
                data.val = data.string.charCodeAt(data.index++);
            }
            bits|=(resb>0 ? 1 : 0)*power;
            power<<=1;
          }
          dictionary[dictSize++] = f(bits);
          c = dictSize-1;
          enlargeIn--;
          break;
        case 2:
          return result;
      }
      if (enlargeIn==0) {
          enlargeIn = Math.pow(2, numBits);
          numBits++;
      }
      if (dictionary[c]) {
          entry = dictionary[c];
      }
      else {
        if (c===dictSize) {
            entry = w+w.charAt(0);
        }
        else {
          return null;
        }
      }
      result+=entry;
      dictionary[dictSize++] = w+entry.charAt(0);
      enlargeIn--;
      w = entry;
      if (enlargeIn==0) {
          enlargeIn = Math.pow(2, numBits);
          numBits++;
      }
    }
  }};
if (typeof module!=='undefined'&&module!=null) {
    module.exports = LZString;
}
