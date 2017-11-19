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
  var CacheCycle=_ESClass("CacheCycle", GArray, [function CacheCycle(obj, tot) {
    Array.call(this, tot);
    for (var i=0; i<tot; i++) {
        this[i] = _cache_copy_object(obj);
        this[i]._cache_id = _cache_id_gen++;
    }
    this.cur = 0;
    this.length = tot;
  }, function next() {
    var ret=this[this.cur];
    this.cur = (this.cur+1)%this.length;
    return ret;
  }]);
  _es6_module.add_class(CacheCycle);
  
  var _c_idgen=0;
  var ObjectCache=_ESClass("ObjectCache", [function ObjectCache() {
    this.cycles = {}
    this.arrays = {}
    this.idmap = {}
  }, function cache_remove(obj) {
    if (obj==undefined||!("_cache_id" in obj)) {
        console.trace();
        console.log("WARNING: non-cached object ", obj, ", passed to ObjectCache.cache_remove");
        return ;
    }
    var cycle=this.cycles[obj._cache_id];
    cycle.remove(obj);
    delete obj._cache_id;
  }, function raw_fetch(templ, tot) {
    if (tot==undefined) {
        tot = CACHE_CYCLE_SIZE;
    }
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
  }, function is_cache_obj(obj) {
    return "_cache_id" in obj;
  }, function fetch(descriptor) {
    var d=descriptor;
    if (d.cachesize==undefined)
      d.cachesize = CACHE_CYCLE_SIZE;
    var obj=this.raw_fetch(d.obj, d.cachesize);
    if (d.init!=undefined)
      d.init(obj);
    return obj;
  }, function getarr() {
    var arr=this.array(arguments.length);
    for (var i=0; i<arguments.length; i++) {
        arr[i] = arguments[i];
    }
    return arr;
  }, function array(len) {
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
  }]);
  _es6_module.add_class(ObjectCache);
  var objcache=window.objcache = new ObjectCache();
  var _itempl={done: false, value: undefined}
  function cached_iret() {
    var ret=objcache.raw_fetch(_itempl);
    ret.done = false;
    ret.value = undefined;
    return ret;
  }
});
"not_a_module";
var CryptoJS=CryptoJS||(function(Math, undefined) {
  var C={}
  var C_lib=C.lib = {}
  var Base=C_lib.Base = (function() {
    function F() {
    }
    return {extend: function(overrides) {
      F.prototype = this;
      var subtype=new F();
      if (overrides) {
          subtype.mixIn(overrides);
      }
      if (!subtype.hasOwnProperty('init')) {
          subtype.init = function() {
            subtype.$super.init.apply(this, arguments);
          };
      }
      subtype.init.prototype = subtype;
      subtype.$super = this;
      return subtype;
    }, create: function() {
      var instance=this.extend();
      instance.init.apply(instance, arguments);
      return instance;
    }, init: function() {
    }, mixIn: function(properties) {
      for (var propertyName in properties) {
          if (properties.hasOwnProperty(propertyName)) {
              this[propertyName] = properties[propertyName];
          }
      }
      if (properties.hasOwnProperty('toString')) {
          this.toString = properties.toString;
      }
    }, clone: function() {
      return this.init.prototype.extend(this);
    }}
  }());
  var WordArray=C_lib.WordArray = Base.extend({init: function(words, sigBytes) {
    words = this.words = words||[];
    if (sigBytes!=undefined) {
        this.sigBytes = sigBytes;
    }
    else {
      this.sigBytes = words.length*4;
    }
  }, toString: function(encoder) {
    return (encoder||Hex).stringify(this);
  }, concat: function(wordArray) {
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
  }, clamp: function() {
    var words=this.words;
    var sigBytes=this.sigBytes;
    words[sigBytes>>>2]&=0xffffffff<<(32-(sigBytes%4)*8);
    words.length = Math.ceil(sigBytes/4);
  }, clone: function() {
    var clone=Base.clone.call(this);
    clone.words = this.words.slice(0);
    return clone;
  }, random: function(nBytes) {
    var words=[];
    for (var i=0; i<nBytes; i+=4) {
        words.push((Math.random()*0x100000000)|0);
    }
    return new WordArray.init(words, nBytes);
  }});
  var C_enc=C.enc = {}
  var Hex=C_enc.Hex = {stringify: function(wordArray) {
    var words=wordArray.words;
    var sigBytes=wordArray.sigBytes;
    var hexChars=[];
    for (var i=0; i<sigBytes; i++) {
        var bite=(words[i>>>2]>>>(24-(i%4)*8))&0xff;
        hexChars.push((bite>>>4).toString(16));
        hexChars.push((bite&0xf).toString(16));
    }
    return hexChars.join('');
  }, parse: function(hexStr) {
    var hexStrLength=hexStr.length;
    var words=[];
    for (var i=0; i<hexStrLength; i+=2) {
        words[i>>>3]|=parseInt(hexStr.substr(i, 2), 16)<<(24-(i%8)*4);
    }
    return new WordArray.init(words, hexStrLength/2);
  }}
  var Latin1=C_enc.Latin1 = {stringify: function(wordArray) {
    var words=wordArray.words;
    var sigBytes=wordArray.sigBytes;
    var latin1Chars=[];
    for (var i=0; i<sigBytes; i++) {
        var bite=(words[i>>>2]>>>(24-(i%4)*8))&0xff;
        latin1Chars.push(String.fromCharCode(bite));
    }
    return latin1Chars.join('');
  }, parse: function(latin1Str) {
    var latin1StrLength=latin1Str.length;
    var words=[];
    for (var i=0; i<latin1StrLength; i++) {
        words[i>>>2]|=(latin1Str.charCodeAt(i)&0xff)<<(24-(i%4)*8);
    }
    return new WordArray.init(words, latin1StrLength);
  }}
  var Utf8=C_enc.Utf8 = {stringify: function(wordArray) {
    try {
      return decodeURIComponent(escape(Latin1.stringify(wordArray)));
    }
    catch (e) {
        throw new Error('Malformed UTF-8 data');
    }
  }, parse: function(utf8Str) {
    return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
  }}
  var BufferedBlockAlgorithm=C_lib.BufferedBlockAlgorithm = Base.extend({reset: function() {
    this._data = new WordArray.init();
    this._nDataBytes = 0;
  }, _append: function(data) {
    if (typeof data=='string') {
        data = Utf8.parse(data);
    }
    this._data.concat(data);
    this._nDataBytes+=data.sigBytes;
  }, _process: function(doFlush) {
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
  }, clone: function() {
    var clone=Base.clone.call(this);
    clone._data = this._data.clone();
    return clone;
  }, _minBufferSize: 0});
  var Hasher=C_lib.Hasher = BufferedBlockAlgorithm.extend({cfg: Base.extend(), init: function(cfg) {
    this.cfg = this.cfg.extend(cfg);
    this.reset();
  }, reset: function() {
    BufferedBlockAlgorithm.reset.call(this);
    this._doReset();
  }, update: function(messageUpdate) {
    this._append(messageUpdate);
    this._process();
    return this;
  }, finalize: function(messageUpdate) {
    if (messageUpdate) {
        this._append(messageUpdate);
    }
    var hash=this._doFinalize();
    return hash;
  }, blockSize: 512/32, _createHelper: function(hasher) {
    return function(message, cfg) {
      return new hasher.init(cfg).finalize(message);
    }
  }, _createHmacHelper: function(hasher) {
    return function(message, key) {
      return new C_algo.HMAC.init(hasher, key).finalize(message);
    }
  }});
  var C_algo=C.algo = {}
  return C;
}(Math));
(function() {
  var C=CryptoJS;
  var C_lib=C.lib;
  var WordArray=C_lib.WordArray;
  var C_enc=C.enc;
  var Base64=C_enc.Base64 = {stringify: function(wordArray) {
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
  }, parse: function(base64Str) {
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
  }, _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='}
}());
(function() {
  var C=CryptoJS;
  var C_lib=C.lib;
  var WordArray=C_lib.WordArray;
  var Hasher=C_lib.Hasher;
  var C_algo=C.algo;
  var W=[];
  var SHA1=C_algo.SHA1 = Hasher.extend({_doReset: function() {
    this._hash = new WordArray.init([0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0]);
  }, _doProcessBlock: function(M, offset) {
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
  }, _doFinalize: function() {
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
  }, clone: function() {
    var clone=Hasher.clone.call(this);
    clone._hash = this._hash.clone();
    return clone;
  }});
  C.SHA1 = Hasher._createHelper(SHA1);
  C.HmacSHA1 = Hasher._createHmacHelper(SHA1);
}());
"not_a_module";
var Base64String={compressToUTF16: function(input) {
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
}, decompressFromUTF16: function(input) {
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
}, _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", decompress: function(input) {
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
}, compress: function(input) {
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
var LZString={_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", _f: String.fromCharCode, compressToBase64: function(input) {
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
}, decompressFromBase64: function(input) {
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
}, compressToUTF16: function(input) {
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
}, decompressFromUTF16: function(input) {
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
}, compress: function(uncompressed) {
  if ((__instance_of(uncompressed, Uint8Array))||(__instance_of(uncompressed, Array))) {
      function newarr() {
        this.data = uncompressed;
        this.charAt = function(i) {
          return String.fromCharCode(this.data[i]);
        }
        this.charCodeAt = function(i) {
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
}, decompress: function(compressed) {
  if (compressed==null)
    return "";
  if (compressed=="")
    return null;
  var dictionary=[], next, enlargeIn=4, dictSize=4, numBits=3, entry="", result="", i, w, bits, resb, maxpower, power, c, f=LZString._f, data={string: compressed, val: compressed.charCodeAt(0), position: 32768, index: 1}
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
es6_module_define('startup_file', [], function _startup_file_module(_es6_module) {
  "use strict";
  window.startup_file_str = "GFUSSBAAAEAAAAAAAAAAwEoMiChKGAAkCBDqCAIPFw4UghxAAXgAEIAWvAGjA0A+UAuvAAYNISiiD0B\nYkFZzEgdT4KAcCk6D+SIXAoDRNAuRPbBqkBAGCQPB7wMAp2PzNngJZUYcIRztFEAU+p9w1hWhBFQJgZ\noIApi1uRVFGASIwBSJnFQAgHtsMEdJ0NdwwPn1JMl8idPigfWBTIeNTELl1eLjTkEDPdZDKSLDMERJG\nfHsOFz8Qgsk2MAxUoYw2xGd11e1ILcAgdAUZBrZKC96nNAYgbZBZEQxFPdWHAt5nFMtAgwHyGH7VdAU\nHTlAsfcsVZACLJb8Ri9pMxVHJvJKwCAAgTH3yE+AAs4nRTIMZDjjYC7BALFNWjZdy0hKj6RuBvsFwOy\nYWmHQe1DC3NBgMjo+FZUWWhqx/dqnEDI2WQ4HAy1ZAEH4XQtb0ExAEbc2RTiozoELfGqIsw0Hz7V1k9\naFqq1tRl50PNmiqVvORj4gxakrC6o1IjwNRHActRAAWPIMEOaipXBZbb9sGRcGwMHnYb7fNjNU3yDAk\nTfLKxsGzRGsD9g+zJagzENzpTEDuizit41ymXcBB4C8kRoTzXFjlAAQgw6oYhEhfTOhWUUrssW9mibO\nMXHv41h3M7KTzADnR+w4DRRT74HEfd/pdnis2Qju6J4fehTnVYydfK0eyieU531PVp5pbvlklbKO/5m\n3v5Wl/gn8gkFekfqfBKpmBw7Vay+9UEuqaC2oPvf50YDEkwjsPBdugtpCSwjbo64LiMOmaCYZwEsNyl\n3EkDJwZ4jRKRURSwgrKwT0Y3FuKCxaxUxsxqrdImSTcJGZyFfyAJsJcKToloD/LuycAHY/EysAYNCRi\nL8QSp4o2p2J+JnYLEJ4G/DcAYhgbnJ3eNQamKMI0cE6CGy7bloJ/KbAAbBqvp92PsSOWuaE74nHa5AO\n5DEJ5QBsLtPUuFvmsZWxSZ+6FGDLIHgQA9Uc6dAClIZQZUZQsiEJoJ5BWIVg1yb8l6iuHaB8gyHcCnK\nuiZcFeVoutJEi6g+E+xXQCgJ5pLnyuQKxgqigXlOxKpgrxpEf2mU5xIJAykO4TxgFmHiPNqDELQIYQK\nCBmoUH0WHXZNYiK21hxggYogbkaAAf+0g1PQZDAKavze0b579v9R9ftVDvtKYbtZHGv5mdJJMdW/YXY\nXHAjH3d1DQ5dpwB95wD9Y/1DkNN0NIDJ9e42A1k8AutmvoLxUlrt0SCtbrYAN2jSgB4qm3pgQjLAOlS\nUKmcj+0A1ulk1Kjc9qK+06kOUMUNAPwkxg7r2ox0pd9MNtNaMGE2T8j790YTUgxDhQ4yessg8c1ExqH\n64K1q4fNYPEkRT2r1r703qyqv2dQtxspk4dOjpgf324wW3J1zDAIko6aYN3AZtToPZYu3EyhtRsBfUf\nxHHQkzgT1aD08mfUuNeyrNdV8/0iet1hcjDTGdeBDFY3xsAtzdwuLVXiTCNbMm4G9LtyMEuxd9NcfOv\ncnl3PS7koP6RFx6zk8C9yyUv53r47LK2lOx5A4KQhBCE1xqJeUJirlPmHD2+J5TP+7EAMP7rATYR+xT\nsr3Vn1IFqbbU+D6irFr+t/BM9eYJ5TgMbaFKJm4qvjJNXPbgrf4KBAGFaedABMNbsDcG++hOAmCUVm4\nBLR4AIIISKOnKx8/grmB34RhEZBlEJfE+II+ICibctEBX4ahCiJTpe4IdzcgQ5TDIBiP57ZILWCAgc0\nbDvQmtGgTJoy5iSwQo3Y8rwUQqQ+b/1bq6+X4EjxdqiqQI0Ja0Yhd8KGyHjb4KKBiImcHidCxnEmAiL\nIKYGbxHUWsCQYEd4ATX1zK6usOhG8ZPYMVFuzAMOxXWxMAAYs7G/hUKMxFEALJGIIaEJmbPS6IIMWS8\nbYxhjxYvEH+qnQLZS5IZSgHdLcFyhAQm0JaSAgaUF1QD4kFEuRL5Lawj8IzlxQPNARChuAiBwRcyHpD\ndBvoO6p0OOWgd0YpRH4JZhACzDxmMwqJRPgvmEhZTWIRT6gOEkToNVKATxpYSCoEpoY+DUZPNKPmXFY\nixM9NfPUQ6ZNyUBxP4rOWcNuCDgbqYexk29qgGCoEybgLzX8i89APotINANNRFlBoUfLNlwKRJUwtmS\nCWDxYR+GghifkcrVhLtjUp3lM9l1of1RORxW4CnyhmaY6WKrIoZeh8sr0OMTnEp6ZRsHwAEKDAT4J1B\n4UX85+YUE1XqvhcWzZ1BqdZINEsys0lixufGwTnKucZhUOJsmRDxj3RkSdnp1xAAEwFsMfYIwToBlAN\nVR1oByN9BmZhP77k5QBTqiZtPw2z+yDsneG6Q33XrelyB2AOrPm55ILkQrInNKE4VSDOllHwQv8E5qb\nGNlCF1FqA/U1U97p2QVZBVS1JKagP2nMItnmpjcBdS33H6oTRnMMts7YwGA5zSMSgqhCxwODjc6eGN7\n7KtEM2vC+sYrk0hD7rJ3pQu0qZhiQM9pcAfaop0mmNwM4CV+C02b+OgBaWV0Q/J3KcMZz2OBl21YrPp\nYQphgOpAoBcBUFUXJ31Ubm6leVqaXidFU0FRxQEV0xqP0IY2P4JhkRh4k9YkyxVAgSSQoYZUn4KXf21\nmpc0WIttDCAj5A5iNNbjKhaaYGRBfiVybY6FXRapayHkVRINwoF3VPHTRmAFSBm9609okDHK9RzBVgE\nIeeNdQ8UM+ucMf0EdhrFM5qzK2tbRWquudj0RNtQFGMqnW2BdE4O87SvCV1Jba6rZ1gYanvGXIqTXQr\nctOhR0BN0ivEbAwx2TT4yxpzEtJ/yYYCX9E2uIlbS2z1TD1Qhs4wRQOiJFwar8QywRZMnqeLKpttT0E\njpHrcxqhRJLEFuNNTTVD2RYn4EOOt4eE4aNrKIuCgvVYDTLUltGp8VQyIRt7R8FYPVTGIfgmkBwUCsT\nWwFkOoIfbT7qG5CVnmXBqcegX0+cb36AeEOOsLm6ZB5CbXldh7QMSLzALuCs77G9xSVmWqxqQ365DVL\nFXzRT9U5xF3JUDDz2kb80BY1gaisKH0+r2mlpxT7VXT35AuBnwx1t2vbBAcQcV9DiAXQ29gwwWtP5sb\nj0+cYmO6/UcdVp1eStfb0mcVFlb64PN3qe5U1p6DsCqkjmDmderY7eunkDxVnlX3FchPKX217AXcT4y\ndSe3lOrO/Y4KTGs1I9Mx6ou9dh+gr9Ccvn41+Ivhbyp7mngbH/LYVyBB7QIs+N6CHnE4OftnrZSNv+H\n9idCG9/4SciRit62vT2ltBpYBDFtUQr3deXuiT4F5oPhj+6vx7rTY8SpnTDAmI0zBTeOseEqEP+HxhD\nNvxjTXvvn0pYz30v4pFlHseA7gFAM2h4Ybwsseo0hK/+u33x6/ln/9eqe1X7V/RbfSGpQoDl641+i75\njc3vT32l+mv2peaf67/7bphivvffoeiG5S+wv+reb/zH4Xcs329OFfYbdCApSftjxyDPCXde43PnIv9\nLgxXvSP9ktLA3PP528lyMMEDwBAwQLgLYDod01IxAB49yjKJvHMD1ryM/+dcwfAEghQBGCBaY9DRzbl\nIXByD0vqnge39Ogla/eJDLQDjgWvCCwFMPc7wEOhT39yCNog0g8L9w/SQn+UDOolxAgR1JEXXHAKpBi\nAc4M/9zjk7QCFCI4t/ABeCyvZ9Q86CR1iLEC4JBU3Uv9CgKk1vQBy8OM5/Q5G9JUjefAaCEWETErcQC\ngXdYgvAGmTK0+2DJcnigAF9ISYVf/hD1vHoQgFiLCBiIgvi0RRKE+FDMi3sw+fC3xHxQejiKQRYfDNC\ngy8JEC8QAAAtWS9Jpg7PO0oY48PSKwokrjK8P0I9qdJCFROOcjGaBMgjQiWMxf4Eu8HKPyw0yi61P6Q\nAaiKCI8IjMjMeGUYJIAcKGMQHLhpfAK4EjCIgJko7+8FuK0wqaiEqznghkhxR3E7UChDuIsg4diOuxl\nYxkD/HM0AVdDbF0bsNlgKFwhQKPDO4K24/bjOMLuYg0jEGOAA4mc2M3Ffe4EDkB5EmPDPhPg4vqSCBM\n6omATAAJKQQFFASxM3ODR4+Io4SeSCMP6E2kSCeI1wuylIjVAwF6INcLhEvWCPWJNv41jLsJ6Yzwihu\nGQQYOABYTNQv4QIFK6I5f9PWN2U8NSCGKK22IQPSJqQClSMKK5U11jPsI9Eh7jOAK+krMTdWGk0I6CM\n6Mp0sfSLtMuk5tjFlM9U3mg/WFUSDAAslCQGAAAgO5g5TKdrn0TRDxLfiIhBTNR5A2qcik2lOgjzTKZ\n894TLSJZrjkRbTz3tiMp7EBdTpYiPSIz56sQPjM18mEhaTN5K8sUdzOpjmES8zIFZsUzGTOTakEhhDL\nL9O3QGcKxV4sz6SKrNgUTyCNlazMxykGheOAAVhIHT5kxcZNjt3owEyy9q8shMSLHJe6i1BDiUwcwJT\nPVbG/w+zO9ZoMZbzDdTSwGU8VJERUSGhkSwGQAcRR+AEbfEMFUE58LghhcuJTi5UsgkLAD4RAvgB+pi\nQQ7WS93St0CTK8jbxC/1fcSBwgXnYYG8sG/yvCT+wswHct2I1BkxniIywiAobkyzREGjDkteplTwDTp\nfBvoFHojnKswjKCUtRV11pYjUgKwVLYhYIQMJakxrzNNv78SvzJnLlULfzQ1RUpklLOHTrMz7yLWuic\nzEjMf4xcAaioEWApAOoOHTvsKlKMjbpyIjjtUZt0DlKE22K4eVgEZUlsziQIbuJ3yGSvMovsiKzGuoL\n4ixxGJkEaJPQBueJmjsIICdQhCUBBAmfQc7gAFxucypKtcY/KAVyMHY3kDn8ECJbgwSBG5e4KzNRm9O\n4cTPqu0/vyJTDP5qyqwSrqqNv8ybq0jNuyRSSsc5s8hXL0i8kQSREPVBvSKFzvyfk8q2rz3txE5sdVx\nmPaThAFFW20wdqpC5gqpSyMLe1IQMqr24QwqtBLdtpaz8rssvtapSrqONX9odBtKnc7AeArkThqrBKq\nK8oyITqoeevIvJhtqlhSrDrvmPgqrlSuBJrYo5pAsGMgjDaGT2WUYoKoeIn6oWbwHa/GpXFRlfRIAgh\nEIR46LfRoxO3aZabqxfhEokyOyOc/ppaHF5Dgr99raOoGb4boOJ0IrcCHSBbVyUqo50uYZYqr+7pGaB\nqLGuY0BiB3Zh3mZaqshdqkAfbvJYvWCsSQTYMopZar+9/aaors1+vmBMTDt+VMA50uVhcMpdBuN5+mb\n6rr5LgWiArga+x0pOaFsDdPDeEUwULgwVFGzi4OIwpjb4YWUJJyOiTYYfAEUf025AoANKkO6w6qD6dp\n1OUEBQD18+IWzhgOhIKoA/KgpsLDictWpgwpC79mribtBurWz5QORTbYgkDSOncUYkApTn+O7Q5pDPS\nAH46ujX0a4YBgYt4e21FpzULgKJFUJeAZpsBFs3cohOo06HaVqX5gNLGEmHgjE2YwSnAhO3Fgg+UO0E\nZIZS7Ebt6256aoa8tuZNapn8rWjMaIaqNwqKxmGPbQIdrplQrMCvaoba+2aryH8dYGi8gkojfy5BAGr\nOSArK6pzOyBxv7PcGHrDg1agFiO5LiJCSNSJNICsm2BIh7qr3sqYebvb+rmjh7mUOE0i4gKplnaajBp\nVfzW6XbcY4o2TUz3UszMZnHd4J8243Hq8/2RItYb44GsbXqbAr2hbZHt/MgRqXFCQOI0ZIHvfeq2EeH\ns/4t2yWKrZBvGR3AS2CrBEDaboPihG1HaMdr8tJHACWcgDipaAi6+5XGdULwRFBaa0Ypm5fAW54jKHQ\nYvu9xhHpHNPshJAAAOU1ZAoJC8rZim3R5jmYkc4gqmqD1bYaocAcski6tqmM1eohG4mQMeyRmamUSCM\ngpPmCXs+hbnGbCcgypQafge6pxtnW0d8JjOGhffmM+nnaga8xskmusu1GVFrXUC3RipbXyrpxkXnJUa\nspJFni+BnZ5WHVcI1ZyNLVSeagpUiQKr+Jy/GdMcopr6rR6b6Z7Jaivnqm8hsG0H1xOjmbufik9+mEe\ndmYKBBdiUpx3/namYw5vAySmepEsQBtmaJp29ncyZ6F6BLVaYIN+u9QNur2JiIHOQLbaNMU1vsYS8iG\nicZKBIHkHlmOrU7hzd0O6pVkiojeCoRdJUbAvfXC4UY1OTkBekIKD+oB0Z1VAMIzUke4CHNKcEqVCOY\ngPCIQ0ghRtfNyIFsZiwOZALt3mFcQdOsZIHEaunWtLUZQ4ckusQHV/jWsXXdrVHljXCHekm6VKQo0Bi\nh/nDP8F1hHEEcIGyzf+TYFAVVmtpjUOPV+aaR8RCAuyBFQURUAfB8VDggeTy0V/IBhpAFYhTR1CpL6c\nMsVxsAQZkzFiEDqITKA31OkWcg36GR4SZMoYCotm6wCad38fesGwfRIMKhX+oC1DtBAqv0FABxhcbUt\nEYDu5eWXMuSaKYRi9DFESiqOgO/lfg0ERFfM3dhn8FFAmBbOrV51O3GiBg4IJM5eadXqG10TBePPaQw\nbhjOwc5s+XnSXBqyEglTj09ak2ffCDBV3oEI8KE3rgkSXXPLoltAaR82nYWleXpP87AWWWSjYoV6G49\n13V5g9jejsUHQF59VLOc3/GeNE3CpMGaLYLj90RW0bB4g4f4mmggoqc+h8BmcCtDlmIlwYoVi8RjCi2\nj5VtaObafKYpjSgrjXP26onTg1/OlZjICOxos48MbU5n2EkjjXppoAnwTpqPAwgK4ktRElORQMuNgGN\nDYBYBZa6wThdcQWWOEXboYvIfgqDgYpB9eVGGtHbCz5Y6BIZieClOn2VgdOHQfxrfI7A7fwcwl6x758\nPuzP/7E6vbZnPgFGxdhQsyBCB2LYFJ7cVolGM6cpNqltr6bynV24UW+K5LIjnRND35ch5gAgDEAEAAA\nu9u2A5a4LAAAAYEAABRAsrHAu2ACw9ardQu2zHArHIv+j7GAAwKYBQWZJXYKv2AEA4aDcAgb8ouO69m\nbgLu2L9WbpViWH+Wt/b2hi52bNwBACA4rCwe8+rtnu7e627lru3e/i79xv/++67nHu3+/qr9Av/B6NA\nugu/h4p7/Pe424CAuYBgv1D9BrtnuZj7u76nuP29OlMVuTHF0bybe0+CgAAEONsZA4aPOAMZUYO7CBq\nb4HvN96eONAeywBw+RVvnuTMLmAuLuhQ6uAuXubh8RXk3eo/5FHkLewm+BH8HeJm6+X2HeYm/V71nel\nz4eHx3uPL6Fb8HeMe8xAgrpcdye72v6HNbfXC46nCAu+nS7fLAgpJSjovCQYkieaM7tMtlgY+6EuXJg\nQ8+d3BKAq2BA+dATH+wADk6/P8weAobo3pv36dEhp1TLj7Nm3hdhXKY5ak5gOetg39MQ/94sz+AX7DO\niPAx/GkTTQ8oA4jJfoByB4jDpPdH+/zqpP/UBff/6PhRQ4bXWLbUm57oo3dL/9LpsF/Q/7dIqe2+/GF\neY63hQ8jP5P9O/DaqhP9Mg87fQWAO+8Hm3vgY+7Lm0n+g+8nq6v+aE4r7i39mU+do1f9t/BuY9P9u/8\n38p/AM//311f/Df5PeyLcY++Zs8OwBkXw/vkrPBO3lFAEF98jzTN+SBSOkrOOXDrAo2AAA42AFA4ehA\n+JvFECQMQATWP31eeIsBA0WRIo4BAs6RRKA2OiABApQwcdu6A8ckBActgDQDYvFwIgKAXUgTYvAmBC4\n8AAgrADY6FEYzzDgrDYworhQX3OReD8Cc8A9aLIIsPAAoxbQtjggoesdCCi7EEGBAAnbQGcXTQBJN9A\naF5BKKIbiH71ggFSur9C2C6FcyOowTwhd3/thBBtdNuBGYCSGORwSRPAcBBcwDKrGwsPIQcoX/8gQEu\nBDCBAU1pCw4FiV298YIIV3gkFBXXCCZHECKw90QwjcfAHwB3qCFA5OAAA==";
});
"not_a_module";
window.init_redraw_globals = function init_redraw_globals() {
  window.redraw_rect_combined = [new Vector3(), new Vector3()];
  window.redraw_rect = [new Vector3(), new Vector3()];
  window.last_redraw_rect = [new Vector3(), new Vector3()];
  window.redraw_rect_defined = false;
  window.redraw_whole_screen = false;
  window._addEventListener = window.addEventListener;
  window._removeEventListener = window.removeEventListener;
  window._killscreen_handlers = [];
  window._send_killscreen = function() {
    var evt={type: 'killscreen'}
    var __iter_h=__get_iter(this._killscreen_handlers);
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
      try {
        h(evt);
      }
      catch (error) {
          print_stack(error);
          console.log("Error while executing a killscreen callback");
      }
    }
  }
  window.removeEventListener = function(e) {
    if (e._is_killscreen) {
        this._killscreen_handlers.remove(e, false);
    }
    else {
      return window._removeEventListener.apply(this, arguments);
    }
  }
  window.addEventListener = function(name, cb) {
    cb._is_killscreen = 1;
    if (name!="killscreen") {
        return this._addEventListener.apply(this, arguments);
    }
    else {
      this._killscreen_handlers.push(cb);
    }
  }
  var animreq=undefined;
  var animreq_ui=undefined;
  var block_ui_draw=false;
  window.block_redraw_ui = function() {
    var oldval=block_ui_draw;
    block_ui_draw = true;
    return oldval;
  }
  window.unblock_redraw_ui = function() {
    var oldval=block_ui_draw;
    block_ui_draw = false;
    return oldval;
  }
  window.redraw_ui = function() {
    if (block_ui_draw)
      return ;
    if (animreq_ui==undefined) {
        animreq_ui = window.requestAnimationFrame(function() {
          animreq_ui = undefined;
          if (DEBUG.ui_redraw)
            console.log("ui frame");
          if (window.g_app_state!=undefined)
            window.g_app_state.eventhandler.on_draw();
        });
    }
  }
  window.redraw_viewport_p = function(min, max, promise) {
    promise.then(function() {
      window.redraw_viewport(min, max);
    });
  }
  window.force_viewport_redraw = function() {
    redraw_whole_screen = true;
    window.redraw_whole_screen = true;
  }
  window._solve_idgen = 1;
  window.redraw_queue = {}
  window.redraw_smap = {}
  window.redraw_start_times = {}
  window.cur_redraw_queue = undefined;
  window.pending_redraws = 0;
  window.push_solve = function(spline) {
    var id=_solve_idgen++;
    var sid=spline._internal_id;
    redraw_queue[id] = [];
    redraw_smap[id] = sid;
    redraw_start_times[id] = time_ms();
    cur_redraw_queue = redraw_queue[id];
    pending_redraws++;
    return id;
  }
  var _popsolve_min=[0, 0];
  var _popsolve_max=[0, 0];
  window.pop_solve = function(id) {
    if (!(id in this.redraw_queue)) {
        console.trace("Warning: either pop_solve call was switched, or the system automatically called due to timeout");
        return ;
    }
    var queue=redraw_queue[id];
    delete redraw_start_times[id];
    delete redraw_smap[id];
    delete redraw_queue[id];
    pending_redraws--;
    var min=_popsolve_min, max=_popsolve_max;
    for (var i=0; i<queue.length; i+=5) {
        min[0] = queue[i], min[1] = queue[i+1];
        max[0] = queue[i+2], max[1] = queue[i+3];
        redraw_viewport(min, max, true, queue[i+4]);
    }
  }
  window.workcanvas_redraw_rects = [];
  window.workcanvas_redraw_rects2 = [];
  window.redraw_viewport = function(min, max, ignore_queuing, combine_mode) {
    if (ignore_queuing==undefined)
      ignore_queuing = false;
    if (!ignore_queuing&&pending_redraws>0) {
        var q=cur_redraw_queue;
        if (min!=undefined&&max!=undefined) {
            q.push(min[0]);
            q.push(min[1]);
            q.push(max[0]);
            q.push(max[1]);
            q.push(combine_mode);
        }
        else {
          var w=50000;
          q.length = 0;
          q.push(-w), q.push(-w), q.push(w), q.push(w);
        }
        return ;
    }
    var r=workcanvas_redraw_rects;
    if (min!=undefined&&max!=undefined) {
        if (combine_mode&&r.length>0) {
            var i=r.length-4;
            r[i] = Math.min(r[i], min[0]);
            r[i+1] = Math.min(r[i+1], min[1]);
            r[i+2] = Math.max(r[i+2], max[0]);
            r[i+3] = Math.max(r[i+3], max[1]);
        }
        else {
          r.push(min[0]);
          r.push(min[1]);
          r.push(max[0]);
          r.push(max[1]);
        }
    }
    else {
      var w=50000;
      r.length = 0;
      r.push(-w), r.push(-w), r.push(w), r.push(w);
    }
    if (animreq==undefined) {
        animreq = window.requestAnimationFrame(function() {
          animreq = undefined;
          var rects=workcanvas_redraw_rects;
          workcanvas_redraw_rects = workcanvas_redraw_rects2;
          workcanvas_redraw_rects.length = 0;
          workcanvas_redraw_rects2 = rects;
          for (var i=0; i<window.g_app_state.screen.children.length; i++) {
              var c=window.g_app_state.screen.children[i];
              var is_viewport=c.constructor.name=="ScreenArea"&&c.area.constructor.name=="View2DHandler";
              if (is_viewport) {
                  var old=window.g_app_state.active_view2d;
                  window.g_app_state.active_view2d = c.area;
                  c.area.do_draw_viewport(rects);
                  window.g_app_state.active_view2d = old;
              }
          }
        });
    }
  }
  window.rffedraw_viewport = function(min, max, ignore_queuing) {
    if (ignore_queuing==undefined)
      ignore_queuing = false;
    if (!ignore_queuing&&pending_redraws>0) {
        var q=cur_redraw_queue;
        q.push(min[0]);
        q.push(min[1]);
        q.push(max[0]);
        q.push(max[1]);
        return ;
    }
    if (DEBUG!=undefined&&DEBUG.viewport_partial_update) {
        console.trace("\n\n\n==Viewport Redraw==:", redraw_whole_screen, min, max, "||", redraw_rect[0], redraw_rect[1], "\n\n\n");
    }
    if (window.redraw_whole_screen)
      min = max = undefined;
    if (window._trace) {
        console.trace();
    }
    if (min==undefined) {
        window.redraw_whole_screen = true;
        if (!window.redraw_rect_defined) {
            window.redraw_rect[0].zero();
            window.redraw_rect[1].zero();
            window.redraw_rect[0][0] = window.redraw_rect[0][1] = -15000;
            window.redraw_rect[1][0] = 15000;
            window.redraw_rect[1][1] = 15000;
        }
    }
    else 
      if (!window.redraw_whole_screen&&window.redraw_rect_defined) {
        var h=window.innerHeight;
        window.redraw_rect[0][0] = Math.min(min[0], window.redraw_rect[0][0]);
        window.redraw_rect[0][1] = Math.min(min[1], window.redraw_rect[0][1]);
        window.redraw_rect[1][0] = Math.max(max[0], window.redraw_rect[1][0]);
        window.redraw_rect[1][1] = Math.max(max[1], window.redraw_rect[1][1]);
    }
    else 
      if (!redraw_whole_screen) {
        window.redraw_rect[0][0] = min[0];
        window.redraw_rect[0][1] = min[1];
        window.redraw_rect[1][0] = max[0];
        window.redraw_rect[1][1] = max[1];
        window.redraw_rect_defined = true;
    }
    if (window.g_app_state==undefined||window.g_app_state.screen==undefined)
      return ;
    var g=window.g_app_state;
    var cs=window.g_app_state.screen.children;
    for (var i=0; i<cs.length; i++) {
        var c=cs[i];
        if (c.constructor.name=="ScreenArea"&&c.area.draw_viewport!=undefined) {
            c.area.draw_viewport = 1;
        }
    }
    if (animreq==undefined) {
        animreq = window.requestAnimationFrame(function() {
          animreq = undefined;
          for (var i=0; i<window.g_app_state.screen.children.length; i++) {
              var c=window.g_app_state.screen.children[i];
              var is_viewport=c.constructor.name=="ScreenArea"&&c.area.constructor.name=="View2DHandler";
              if (is_viewport) {
                  var old=window.g_app_state.active_view2d;
                  window.g_app_state.active_view2d = c.area;
                  c.area.do_draw_viewport();
                  window.g_app_state.active_view2d = old;
              }
          }
          for (var i=0; i<2; i++) {
              for (var j=0; j<3; j++) {
                  window.last_redraw_rect[i][j] = window.redraw_rect[i][j];
              }
          }
          window.redraw_rect[0].zero();
          window.redraw_rect[1].zero();
          window.redraw_whole_screen = false;
          window.redraw_rect_defined = false;
        });
    }
  }
  var requestId;
  window._fps = 1;
  window.reshape = function reshape(gl) {
    var g=window.g_app_state;
    if (g==undefined)
      return ;
    var canvas=document.getElementById('canvas2d_work');
    var canvas2d=document.getElementById("canvas2d");
    g.canvas = canvas;
    g.canvas2d = canvas2d;
    if (canvas2d.width!=canvas.clientWidth||canvas2d.height!=canvas.clientHeight) {
        canvas2d.width = canvas.clientWidth;
        canvas2d.height = canvas.clientHeight;
        window.redraw_viewport();
        if (g!=undefined&&g.screen!=undefined) {
            g.screen.do_full_recalc();
            window.redraw_ui();
        }
    }
    var width=window.innerWidth, height=window.innerHeight;
    if (canvas.width==width&&canvas.height==height)
      return ;
    var oldsize=[canvas.width, canvas.height];
    var newsize=[width, height];
    canvas.width = width;
    canvas.height = height;
    g.size = new Vector2(newsize);
    if (g.screen!=undefined) {
        g.screen.do_full_recalc();
        g.eventhandler.on_resize(newsize, oldsize);
        window.redraw_ui();
    }
  }
};
"not_a_module";
if (window.mobilecheck===undefined) {
    window.mobilecheck = function mobilecheck() {
      var str=navigator.userAgent+navigator.vendor;
      function test(s) {
        var ret=str.match(s);
        if (ret==null||ret==undefined)
          return false;
        if (ret.length==0||ret.length==undefined)
          return false;
        return true;
      }
      str = str.toLowerCase();
      var ret=test("android")||test("mobile")||test("blackberry")||test("iphone");
      return ret;
    };
}
window.moduleDidLoad = function moduleDidLoad() {
  console.log("-------Loaded NACL module!----------");
  common.hideModule();
};
window.handleMessage = function handleMessage(message) {
  console.log("NACL message!", message, message.data);
};
var MyLocalStorage_LS=_ESClass("MyLocalStorage_LS", [function set(key, val) {
  localStorage[key] = val;
}, function getCached(key) {
  return localStorage[key];
}, function getAsync(key) {
  return new Promise(function(accept, reject) {
    accept(localStorage[key]);
  });
}, function hasCached(key) {
  return key in localStorage;
}, function MyLocalStorage_LS() {
}]);
var MyLocalStorage_ChromeApp=_ESClass("MyLocalStorage_ChromeApp", [function MyLocalStorage_ChromeApp() {
  this.cache = {}
}, function set(key, val) {
  var obj={}
  obj[key] = val;
  chrome.storage.local.set(obj);
  this.cache[key] = val;
}, function getCached(key) {
  return this.cache[key];
}, function getAsync(key) {
  var this2=this;
  return new Promise(function(accept, reject) {
    chrome.storage.local.get(key, function(value) {
      if (chrome.runtime.lastError!=undefined) {
          this2.cache[key] = null;
          reject(chrome.runtime.lastError.string);
      }
      else {
        if (value!={}&&value!=undefined&&key in value) {
            value = value[key];
        }
        if (typeof value=="object")
          value = JSON.stringify(value);
        this2.cache[key] = value;
        accept(value);
      }
    });
  });
}, function hasCached(key) {
  return key in this.cache;
}]);
window.startup = function startup() {
  if (window.CHROME_APP_MODE) {
      window.myLocalStorage = new MyLocalStorage_ChromeApp();
      window.myLocalStorage.getAsync("session");
      window.myLocalStorage.getAsync("startup_file");
      window.myLocalStorage.getAsync("_settings");
      var timer=window.setInterval(function() {
        window.clearInterval(timer);
        
        startup_intern();
        var timer2=window.setInterval(function() {
          window.clearInterval(timer2);
          var canvas=document.getElementById("canvas2d");
          g_app_state.screen.on_resize([window.innerWidth, window.innerHeight]);
        }, 200);
      }, 450);
  }
  else {
    window.myLocalStorage = new MyLocalStorage_LS();
    startup_intern();
  }
};
window.startup_intern = function startup() {
  window.IsMobile = mobilecheck();
  load_modules();
  if (window.CHROME_APP_MODE) {
      var config=_es6_get_module("config");
      config.exports.HAVE_EVAL = false;
  }
  init_theme();
  init_redraw_globals();
  var canvas=document.getElementById('canvas2d_work');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  window._canvas2d_ctx = canvas.getContext("2d");
  document.onselectstart = function() {
    return false;
  }
  document.oncontextmenu = function() {
    return false;
  }
  if (g_app_state==undefined) {
      startup_report("parsing serialization scripts...");
      init_struct_packer();
      startup_report("initializing data api...");
      api_define_ops();
      api_define_context();
      startup_report("create event dag...");
      init_event_graph();
      g_app_state = new AppState(undefined, undefined, undefined);
      g_app_state.size = [canvas.clientWidth, canvas.clientHeight];
      startup_report("loading new scene file...");
      gen_default_file([canvas.clientWidth, canvas.clientHeight]);
      g_app_state.session.validate_session();
      init_event_system();
  }
  startup_report("loading native client plugin, if possible...");
  _nacl_domContentLoaded();
};
function init_event_system() {
  window._stime = 10;
  window.setInterval(function() {
    if (window.skip_draw)
      return ;
    var g=window.g_app_state;
    if (g==undefined)
      return ;
    reshape();
  }, 200);
  window.setInterval(function() {
    if (window.redraw_start_times==undefined)
      return ;
    for (var k in redraw_start_times) {
        var t=redraw_start_times[k];
        if (time_ms()-t>1500) {
            pop_solve(k);
        }
    }
    if (g_app_state!=undefined&&g_app_state.screen!=undefined) {
        g_app_state.screen._on_tick();
    }
  }, 32);
  function stop_event_propegation(e) {
    e.stopPropagation();
    e.preventDefault();
  }
  function handleTouchMove(e) {
    g_app_state.was_touch = true;
    stop_event_propegation(e);
    if (g_app_state.eventhandler!=undefined) {
        touch_manager.owner = g_app_state.screen;
        var x, y;
        var t=e.targetTouches[0];
        if (t==undefined) {
            x = g_app_state._last_touch_mpos[0];
            y = g_app_state._last_touch_mpos[1];
        }
        else {
          x = t.pageX;
          y = g_app_state.screen.size[1]-t.pageY;
          g_app_state._last_touch_mpos[0] = x;
          g_app_state._last_touch_mpos[1] = y;
        }
        var e2=new MyMouseEvent(x, y, 0, MyMouseEvent.MOUSEMOVE);
        e2.touches = do_touches(e);
        touch_manager.queue_event(e2);
    }
  }
  function handleMouseMove(e) {
    g_app_state.was_touch = false;
    if (g_app_state.eventhandler!=undefined) {
        var evt=new MyMouseEvent(e.pageX, g_app_state.screen.size[1]-e.pageY, 0, MyMouseEvent.MOUSEMOVE);
        g_app_state.eventhandler._on_mousemove(evt);
    }
  }
  function handleMouseWheel(event) {
    var delta=0;
    if (!event)
      event = window.event;
    if (event.wheelDelta) {
        delta = event.wheelDelta/120;
    }
    else 
      if (event.detail) {
        delta = -event.detail/3;
    }
    if (event.preventDefault)
      event.preventDefault();
    event.returnValue = false;
    if (delta&&g_app_state.screen!=undefined) {
        event.x = event.pageX;
        event.y = g_app_state.screen.size[1]-event.pageY;
        g_app_state.eventhandler._on_mousewheel(event, delta);
    }
  }
  function handleTouchCancel(e) {
    if (t==undefined) {
        x = e.pageX;
        y = e.pageY;
    }
    else {
      x = t.pageX;
      y = t.pageY;
    }
    var lst=e.changedTouches;
    var touches={}
    for (var i=0; i<t.length; i++) {
        touches[lst[i].identifier] = [x, y];
    }
    console.log("touch cancel");
    if (g_app_state.screen!=undefined) {
        touch_manager.owner = g_app_state.screen;
        var e2=new MyMouseEvent(x, g_app_state.screen.size[1]-y, 0, MyMouseEvent.MOUSEUP);
        e2.shiftKey = e.shiftKey;
        e2.altKey = e.altKey;
        e2.ctrlKey = e.ctrlKey;
        touch_manager.cancel(e2);
    }
  }
  function do_touches(e) {
    var ts={}
    var in_ts=e.changedTouches.length==0 ? e.targetTouches : e.changedTouches;
    if (in_ts==undefined||in_ts.length==0)
      return [];
    for (var i=0; i<in_ts.length; i++) {
        var id=in_ts[i].identifier;
        if (id==undefined)
          id = i;
        ts[id] = [in_ts[i].pageX, g_app_state.screen.size[1]-in_ts[i].pageY];
    }
    return ts;
  }
  function handleTouchDown(e) {
    g_app_state.was_touch = true;
    stop_event_propegation(e);
    var x, y;
    if (DEBUG.touch==2)
      console.log(e.targetTouches.length, e);
    var t=e.targetTouches[0];
    if (t==undefined) {
        x = g_app_state._last_touch_mpos[0];
        y = g_app_state._last_touch_mpos[1];
    }
    else {
      x = t.pageX;
      y = g_app_state.screen.size[1]-t.pageY;
      g_app_state._last_touch_mpos[0] = x;
      g_app_state._last_touch_mpos[1] = y;
    }
    if (g_app_state.screen!=undefined) {
        touch_manager.owner = g_app_state.screen;
        var e2=new MyMouseEvent(x, y, 0, MyMouseEvent.MOUSEDOWN);
        e2.shiftKey = e.shiftKey;
        e2.altKey = e.altKey;
        e2.ctrlKey = e.ctrlKey;
        e2.touches = do_touches(e);
        touch_manager.queue_event(e2);
    }
  }
  function handleTouchUp(e) {
    g_app_state.was_touch = true;
    stop_event_propegation(e);
    var x, y;
    if (DEBUG.touch==2)
      console.log(e);
    var t=e.targetTouches[0];
    if (t==undefined) {
        x = g_app_state._last_touch_mpos[0];
        y = g_app_state._last_touch_mpos[1];
    }
    else {
      x = t.pageX;
      y = g_app_state.screen.size[1]-t.pageY;
      g_app_state._last_touch_mpos[0] = x;
      g_app_state._last_touch_mpos[1] = y;
    }
    if (g_app_state.screen!=undefined) {
        touch_manager.owner = g_app_state.screen;
        var e2=new MyMouseEvent(x, y, 0, MyMouseEvent.MOUSEUP);
        e2.shiftKey = e.shiftKey;
        e2.altKey = e.altKey;
        e2.ctrlKey = e.ctrlKey;
        e2.touches = do_touches(e);
        touch_manager.queue_event(e2);
    }
  }
  var last_mouse_down=time_ms();
  var last_mouse_pos=[0, 0];
  var last_mouse_button=0;
  var DBCLK_THRESH=200;
  function handleMouseDown(e) {
    g_app_state.was_touch = false;
    if (g_app_state.screen!=undefined) {
        var e2=new MyMouseEvent(e.pageX, g_app_state.screen.size[1]-e.pageY, e.button, MyMouseEvent.MOUSEDOWN);
        e2.shiftKey = e.shiftKey;
        e2.altKey = e.altKey;
        e2.ctrlKey = e.ctrlKey;
        g_app_state.eventhandler._on_mousedown(e2);
        var is_dclick=last_mouse_button==e.button&&time_ms()-last_mouse_down<DBCLK_THRESH;
        var dx=last_mouse_pos[0]-e.pageX, dy=last_mouse_pos[1]-e.pageY;
        is_dclick = is_dclick&&Math.sqrt(dx*dx+dy*dy)<10;
        last_mouse_down = time_ms();
        last_mouse_button = e.button;
        last_mouse_pos[0] = e.pageX;
        last_mouse_pos[1] = e.pageY;
        if (is_dclick) {
            e2 = new MyMouseEvent(e.pageX, g_app_state.screen.size[1]-e.pageY, e.button, MyMouseEvent.MOUSEDOWN);
            e2.shiftKey = e.shiftKey;
            e2.altKey = e.altKey;
            e2.ctrlKey = e.ctrlKey;
            g_app_state.eventhandler._on_doubleclick(e2);
        }
    }
    if (e.button==2) {
        stop_event_propegation(e);
        return false;
    }
  }
  function handleMouseUp(e) {
    g_app_state.was_touch = false;
    if (g_app_state.screen!=undefined) {
        var e2=new MyMouseEvent(e.pageX, g_app_state.screen.size[1]-e.pageY, e.button, MyMouseEvent.MOUSEUP);
        e2.shiftKey = e.shiftKey;
        e2.altKey = e.altKey;
        e2.ctrlKey = e.ctrlKey;
        g_app_state.eventhandler._on_mouseup(e2);
    }
    if (e.button==2) {
        stop_event_propegation(e);
        return false;
    }
  }
  function gen_keystr(key, keystate) {
    if (typeof key=="number") {
        key = String.fromCharCode(key);
    }
    var s=key.toUpperCase();
    if (keystate.shift)
      s = "SHIFT-"+s;
    if (keystate.alt)
      s = "ALT-"+s;
    if (keystate.ctrl)
      s = "CTRL-"+s;
    return s;
  }
  var key_exclude_list={}, ke=key_exclude_list;
  ke[gen_keystr("O", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("R", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("N", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("S", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("S", {shift: false, alt: true, ctrl: true})] = 0;
  ke[gen_keystr("P", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("A", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("BACKSPACE", {shift: false, alt: false, ctrl: false})] = 0;
  ke[gen_keystr("TAB", {shift: false, alt: false, ctrl: false})] = 0;
  ke[gen_keystr("V", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("E", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("F", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("G", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("G", {shift: true, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("G", {shift: false, alt: true, ctrl: false})] = 0;
  ke[gen_keystr("O", {shift: true, alt: false, ctrl: true})] = 0;
  function handle_key_exclude(e) {
    var kc=charmap[e.keyCode];
    if (kc==undefined)
      kc = "";
    var keystr=gen_keystr(kc, {shift: e.shiftKey, alt: e.altKey, ctrl: e.ctrlKey});
    keystr = keystr.toString().toUpperCase();
    if (keystr in key_exclude_list) {
        stop_event_propegation(e);
    }
  }
  function handleKeyDown(e) {
    handle_key_exclude(e);
    if (g_app_state.screen!=undefined)
      g_app_state.eventhandler._on_keydown(e);
  }
  function handleKeyUp(e) {
    handle_key_exclude(e);
    if (g_app_state.screen!=undefined)
      g_app_state.eventhandler._on_keyup(e);
  }
  function handleKeyPress(e) {
    handle_key_exclude(e);
    if (g_app_state.screen!=undefined) {
        if (e.charCode==0||e.charCode==13||e.charCode==undefined)
          return ;
        e["char"] = String.fromCharCode(e.charCode);
        g_app_state.eventhandler._on_charcode(e);
    }
  }
  function handleTextInput(e, e2) {
    uevt = e;
    if (g_app_state.screen!=undefined) {
        var canvas=document.getElementById("canvas2d_work");
        var text=""+canvas.textContent;
        if (text.length==0)
          canvas.textContent = "<TK>";
        text = text.replace(/\<TK\>/g, "");
        g_app_state.eventhandler._on_textinput({text: text});
    }
  }
  var ce=document.getElementById("canvas2d_work");
  ce.addEventListener("mousemove", handleMouseMove, false);
  ce.addEventListener("mousedown", handleMouseDown, false);
  ce.addEventListener("touchstart", handleTouchDown, false);
  ce.addEventListener("touchmove", handleTouchMove, false);
  ce.addEventListener("mouseup", handleMouseUp, false);
  ce.addEventListener("touchend", handleTouchUp, false);
  ce.addEventListener("touchcancel", handleTouchCancel, false);
  window.addEventListener("DOMMouseScroll", handleMouseWheel, false);
  window.addEventListener("mousewheel", handleMouseWheel, false);
  document.addEventListener("keydown", handleKeyDown, false);
  document.addEventListener("keyup", handleKeyUp, false);
  document.addEventListener("keypress", handleKeyPress, false);
  document.addEventListener("textinput", handleTextInput);
  document.addEventListener("input", handleTextInput);
}
es6_module_define('safe_eval', ["parseutil"], function _safe_eval_module(_es6_module) {
  "use strict";
  var debug_parser=0;
  var debug_exec=0;
  function parsedebug() {
    if (debug_parser)
      console.log.apply(console, arguments);
  }
  function execdebug() {
    if (debug_exec)
      console.log.apply(console, arguments);
  }
  var parseutil=es6_import(_es6_module, 'parseutil');
  var token=parseutil.token;
  var tokdef=parseutil.tokdef;
  var PUTLParseError=parseutil.PUTLParseError;
  var lexer=parseutil.lexer;
  var parser=parseutil.parser;
  var Node=_ESClass("Node", Array, [function Node(type, prec, a, b) {
    Array.call(this);
    this.type = type;
    this.prec = prec;
    this.length = b!=undefined ? 2 : (a!=undefined ? 1 : 0);
    if (a!=undefined) {
        this[0] = a;
        if (__instance_of(a, Node))
          a.parent = this;
    }
    if (b!=undefined) {
        this[1] = b;
        if (__instance_of(b, Node))
          b.parent = this;
    }
  }, function toJSON() {
    var ret={type: this.type, length: this.length}
    for (var i=0; i<this.length; i++) {
        ret[i] = this[i];
    }
    return ret;
  }]);
  _es6_module.add_class(Node);
  function test(path) {
    if (path==undefined)
      path = "ContextStruct.pathmap.theme.pathmap.ui.pathmap.colors.getter(g_theme.ui.flat_colors[0]).pathmap.type";
    console.log(path);
    var scope={ctx: new Context(), ContextStruct: ContextStruct, g_theme: g_theme, $: {layers: {}}}
    var ast=compile(path);
    console.log("AST:", ast);
    console.log("SCOPE:", scope);
    return exec(ast, scope);
  }
  test = _es6_module.add_export('test', test);
  var reserved_words=new set(["in", "function"]);
  var tokens=[new tokdef("ID", /[a-zA-Z$_]+[a-zA-Z0-9$_]*/, function(t) {
    if (reserved_words.has(t.value)) {
        t.type = t.value.toUpperCase();
    }
    return t;
  }), new tokdef("NUMLIT", /([0-9]+[\.][0-9]*)|([0-9]+)/, function(t) {
    t.value = parseFloat(t.value);
    return t;
  }), new tokdef("PLUS", /\+/), new tokdef("MINUS", /\-/), new tokdef("MUL", /\*/), new tokdef("DIV", /\//), new tokdef("LSHIFT", /\<\</), new tokdef("RSHIFT", /\>\>/), new tokdef("COMMA", /,/), new tokdef("COND", /\?/), new tokdef("COLON", /\:/), new tokdef("DOT", /\./), new tokdef("LSBRACKET", /\[/), new tokdef("RSBRACKET", /\]/), new tokdef("LPAREN", /\(/), new tokdef("RPAREN", /\)/), new tokdef("EQUALS", /\=/), new tokdef("MOD", /\%/), new tokdef("BITAND", /\&/), new tokdef("SEMI", /\;/), new tokdef("LNOT", /\!/), new tokdef("BNOT", /\~/), new tokdef("LEQUALS", /\=\=/), new tokdef("LNEQUALS", /\!\=/), new tokdef("LOR", /\|\|/), new tokdef("LAND", /\&\&/), new tokdef("BXOR", /\^/), new tokdef("STRLIT", /(".*")|('.*')/, function(t) {
    t.value = t.value.slice(1, t.value.length-1);
    return t;
  }), new tokdef("WS", /[ \t\r\n]/, function(t) {
  })];
  var prec_map={">>": 4, ">>>": 4, "<<": 4, "+": 4, "-": 4, "%": 5, "/": 5, "*": 5, "typeof": 6, ">=": 5, "<=": 5, "in": 5, "==": 6, "!=": 6, "&&": 7, "||": 7, "&": 8, "|": 8, "^": 8, "=": 11, "!": 99, ".": 101, ",": 2, "[": 3, "]": 0, ")": 0, "(": 200, ":": 0, "?": 1}
  var bin_ops=new set(["DOT", "EQUALS", "BITAND", "LAND", "LOR", "BXOR", "LEQUALS", "LNEQUALS", "MOD", "PLUS", "MINUS", "MUL", "DIV", "RSHIFT", "LSHIFT", "IN"]);
  function get_prec(p) {
    var t=p.peeknext();
    if (t==undefined)
      return 0;
    if (t.value in prec_map) {
        return prec_map[t.value];
    }
    if (t.type=="ID"||t.type=="NUMLIT"||t.type=="STRLIT") {
        return 0;
    }
    return 0;
  }
  function p_prefix(p, token) {
    if (token.type=="ID") {
        return token.value;
    }
    else 
      if (token.type=="NUMLIT") {
        return token.value;
    }
    else 
      if (token.type=="STRLIT") {
        return {type: "STRLIT", value: token.value}
    }
    else 
      if (token.type=="LNOT") {
        return new Node("!", prec_map["!"], p_expr(p, prec_map["!"]));
    }
    else 
      if (token.type=="MINUS") {
        return new Node("negate", prec_map["-"], p_expr(p, prec_map["-"]));
    }
    else 
      if (token.type=="LPAREN") {
        var ret=p_expr(p, prec_map[")"]);
        p.expect("RPAREN");
        return ret;
    }
    else {
      p.error(token, "unexpected "+token.value);
    }
  }
  function p_expr(p, prec) {
    var t=p.next();
    if (t==undefined) {
        return "ERROR_ERROR_ERROR";
    }
    if (debug_parser)
      console.log("T", t.type);
    var a=p_prefix(p, t);
    while (prec<get_prec(p)) {
      if (debug_parser&&p.peeknext()!=undefined) {
          console.log("PREC", prec, get_prec(p), p.peeknext().type);
      }
      t = p.next();
      if (debug_parser)
        console.log("  T:", t.type);
      if (bin_ops.has(t.type)) {
          var b=p_expr(p, prec_map[t.value]);
          a = new Node(t.value, prec_map[t.value], a, b);
      }
      else 
        if (t.type=="LPAREN") {
          if (debug_parser)
            console.log("LPAREN infix!", ast, "\n-----\n");
          var list;
          if (p.peeknext().type!="RPAREN") {
              list = p_expr(p, prec_map[")"]);
              if (list.type!="list") {
                  list = new Node("list", prec["("], list);
              }
          }
          else {
            list = new Node("list", prec["("]);
          }
          a = new Node("call", 500, a, list);
          p.expect("RPAREN");
      }
      else 
        if (t.type=="LSBRACKET") {
          var b=p_expr(p, prec_map["]"]);
          p.expect("RSBRACKET");
          if (debug_parser)
            console.log("LSBRACKET");
          a = new Node("array", prec_map["["], a, b);
      }
      else 
        if (t.type=="COMMA") {
          if (debug_parser)
            console.log("COMMA", a);
          if (a.type=="list") {
              a.push(p_expr(p, 0));
          }
          else {
            var b=p_expr(p, 0);
            if (b.type=="list") {
                b.insert(0, a);
                a = b;
            }
            else {
              a = new Node("list", prec_map[","], a);
              a.push(b);
            }
          }
      }
      else 
        if (t.type=="COND") {
          var b=p_expr(p, 0);
          p.expect("COLON");
          var c=p_expr(p, 0);
          a = new Node("?", undefined, a, b);
          a.push(c);
      }
      else {
        p.error(t, "unexpected "+t.value);
      }
    }
    if (p.peeknext()!=undefined) {
        if (p.peeknext()!=undefined) {
            if (debug_parser)
              console.log("PREC", prec, get_prec(p), p.peeknext().type);
        }
    }
    return a;
  }
  function p_root(p) {
    var ret=p_expr(p, 0);
    if (p.peeknext()!=undefined&&p.peeknext().type=="SEMI") {
        p.next();
    }
    return ret;
  }
  var jslexer=new lexer(tokens);
  var jsparser=new parser(jslexer);
  jsparser.start = p_root;
  function compile2(code) {
    return jsparser.parse(code);
  }
  compile2 = _es6_module.add_export('compile2', compile2);
  function parentify(node) {
    var idgen=0;
    var set={}
    function visit(node) {
      if (node==null) {
          return ;
      }
      if (node._inst_id!=undefined&&node._inst_id in set)
        return ;
      if (node._inst_id==undefined) {
          node._inst_id = idgen++;
      }
      set[node._inst_id] = 1;
      for (var k in node) {
          var v=node[k];
          if (typeof v!="object"||v===null)
            continue;
          if (v._inst_id==undefined) {
              v._inst_id = idgen++;
          }
          if (v._inst_id in set) {
              continue;
          }
          v.parent = node;
          visit(v);
      }
    }
    visit(node);
    return node;
  }
  parentify = _es6_module.add_export('parentify', parentify);
  function compile(code) {
    return parentify(esprima.parse(code).body);
  }
  compile = _es6_module.add_export('compile', compile);
  function exec(ast, scope1) {
    var scope=scopes.next();
    scope.scope = scope1;
    scope.parent = undefined;
    function visit(node, scope) {
      if (node==undefined) {
          throw new Error("node was undefined!");
      }
      if (node.type=="Identifier") {
          return scope.scope[node.name];
      }
      else 
        if (node.type=="Literal") {
          return node.value;
      }
      else 
        if (node.type=="ExpressionStatement") {
          return visit(node.expression, scope);
      }
      else 
        if (node.type=="VariableDeclarator") {
          var name=node.id.name;
          if (node.init==null) {
              scope.scope[name] = undefined;
          }
          else {
            scope.scope[name] = visit(node.init, scope);
          }
          return scope.scope[name];
      }
      else 
        if (node.type=="VariableDeclaration") {
          var first=visit(node.declarations[0], scope);
          for (var i=1; i<node.declarations.length; i++) {
              visit(node.declarations[i], scope);
          }
          return first;
      }
      else 
        if (node.type=="MemberExpression") {
          var obj=visit(node.object, scope);
          var prop;
          execdebug("Member Expression!", node);
          if (node.computed) {
              prop = visit(node.property, scope);
          }
          else 
            if (node.property.type=="Identifier") {
              prop = node.property.name;
          }
          else 
            if (node.property.type=="Literal") {
              prop = node.property.value;
          }
          else {
            console.trace(node);
            throw new Error("Expected an identifier or literal node");
          }
          execdebug("  Obj, prop:", obj, prop, "...");
          return obj[prop];
      }
      else 
        if (node.type=="ConditionalExpression") {
          var a=visit(node.test, scope);
          if (a) {
              return visit(node.consequent, scope);
          }
          else {
            return visit(node.alternate, scope);
          }
      }
      else 
        if (node.type=="UpdateExpression") {
          var obj, prop;
          if (node.argument.type=="MemberExpression") {
              obj = visit(node.argument.object, scope);
              if (node.argument.computed) {
                  prop = visit(node.argument.property, scope);
              }
              else 
                if (node.argument.property.type=="Identifier") {
                  prop = node.argument.property.name;
              }
              else 
                if (node.argument.property.type=="Literal") {
                  prop = node.argument.property.value;
              }
              else {
                console.trace(node.argument);
                throw new Error("Expected an identifier or literal node");
              }
          }
          else {
            if (node.argument.type!="Identifier") {
                console.log(node);
                console.trace(node.argument);
                throw new Error("Expeced an identifier node");
            }
            obj = scope.scope;
            prop = node.argument.name;
          }
          var preval=obj[prop];
          if (node.operator=="++")
            obj[prop]++;
          else 
            obj[prop]--;
          return node.prefix ? obj[prop] : preval;
      }
      else 
        if (node.type=="AssignmentExpression") {
          var obj, prop;
          if (node.left.type=="MemberExpression") {
              obj = visit(node.left.object, scope);
              if (node.left.computed) {
                  prop = visit(node.left.property, scope);
              }
              else 
                if (node.left.property.type=="Identifier") {
                  prop = node.left.property.name;
              }
              else 
                if (node.left.property.type=="Literal") {
                  prop = node.left.property.value;
              }
              else {
                console.trace(node.left);
                throw new Error("Expected an identifier or literal node");
              }
          }
          else {
            if (node.left.type!="Identifier") {
                console.log(node);
                console.trace(node.left);
                throw new Error("Expeced an identifier node");
            }
            obj = scope.scope;
            prop = node.left.name;
          }
          switch (node.operator) {
            case "=":
              obj[prop] = visit(node.right, scope);
              break;
            case "+=":
              obj[prop]+=visit(node.right, scope);
              break;
            case "-=":
              obj[prop]-=visit(node.right, scope);
              break;
            case "/=":
              obj[prop]/=visit(node.right, scope);
              break;
            case "*=":
              obj[prop]*=visit(node.right, scope);
              break;
            case "%=":
              obj[prop]%=visit(node.right, scope);
              break;
            case "<<=":
              obj[prop]<<=visit(node.right, scope);
              break;
            case ">>=":
              obj[prop]>>=visit(node.right, scope);
              break;
            case ">>>=":
              obj[prop]>>>=visit(node.right, scope);
              break;
            case "|=":
              obj[prop]|=visit(node.right, scope);
              break;
            case "^=":
              obj[prop]^=visit(node.right, scope);
              break;
            case "&=":
              obj[prop]&=visit(node.right, scope);
              break;
              break;
          }
          return obj[prop];
      }
      else 
        if (node.type=="ArrayExpression") {
          var ret=[];
          var items=node.elements;
          for (var i=0; i<items.length; i++) {
              ret.push(visit(items[i], scope));
          }
          return ret;
      }
      else 
        if (node.type=="UnaryExpression") {
          var val=visit(node.argument, scope);
          switch (node.operator) {
            case "-":
              return -val;
            case "+":
              return val;
            case "!":
              return !val;
            case "~":
              return ~val;
            case "typeof":
              return typeof val;
            case "void":
              throw new Error("implement me");
            case "delete":
              throw new Error("implement me");
            default:
              throw new Error("Unknown prefix "+node.prefix);
          }
      }
      else 
        if (node.type=="NewExpression") {
          execdebug("new call!", node, node.callee);
          var func=visit(node.callee, scope);
          var thisvar=undefined;
          if (node.callee.type=="MemberExpression") {
              thisvar = visit(node.callee.object, scope);
          }
          var args=node.arguments;
          switch (args.length) {
            case 0:
              return new func();
            case 1:
              return new func(visit(args[0], scope));
            case 2:
              return new func(visit(args[0], scope), visit(args[1], scope));
            case 3:
              return new func(visit(args[0], scope), visit(args[1], scope), visit(args[2], scope));
            case 4:
              return new func(visit(args[0], scope), visit(args[1], scope), visit(args[2], scope), visit(args[3], scope));
            case 5:
              throw new Error("new calls of more than 4 arguments is not supported");
          }
      }
      else 
        if (node.type=="CallExpression") {
          execdebug("function call!", node, node.callee);
          var func=visit(node.callee, scope);
          var thisvar=undefined;
          if (node.callee.type=="MemberExpression") {
              thisvar = visit(node.callee.object, scope);
          }
          var args=node.arguments;
          switch (args.length) {
            case 0:
              return func.call(thisvar);
            case 1:
              return func.call(thisvar, visit(args[0], scope));
            case 2:
              return func.call(thisvar, visit(args[0], scope), visit(args[1], scope));
            case 3:
              return func.call(thisvar, visit(args[0], scope), visit(args[1], scope), visit(args[2], scope));
            case 4:
              return func.call(thisvar, visit(args[0], scope), visit(args[1], scope), visit(args[2], scope), visit(args[3], scope));
            case 5:
              throw new Error("function calls of more than 4 arguments is not supported");
          }
      }
      else 
        if (node.type=="BinaryExpression"||node.type=="LogicalExpression") {
          var a=visit(node.left, scope);
          var b=visit(node.right, scope);
          switch (node.operator) {
            case "==":
              return a==b;
            case "!=":
              return a!=b;
            case ">":
              return a>b;
            case "<":
              return a<b;
            case ">=":
              return a>=b;
            case "<=":
              return a<=b;
            case "===":
              return a===b;
            case "!==":
              return a!==b;
            case "<<":
              return a<<b;
            case ">>":
              return a>>b;
            case ">>>":
              return a>>>b;
            case "+":
              return a+b;
            case "-":
              return a-b;
            case "*":
              return a*b;
            case "/":
              return a/b;
            case "%":
              return a%b;
            case "|":
              return a|b;
            case "&&":
              return a&&b;
            case "||":
              return a||b;
            case "^":
              return a^b;
            case "&":
              return a&b;
            case "in":
              return a in b;
            case "instanceof":
              return __instance_of(a, b);
            default:
              throw new Error("Unknown binary operator "+node.operator);
          }
      }
      else {
        console.log(node);
        throw new Error("Unknown node "+node.type);
      }
    }
    if (__instance_of(ast, Array)) {
        var last=undefined;
        for (var i=0; i<ast.length; i++) {
            last = visit(ast[i], scope);
        }
        return last;
    }
    else {
      return visit(ast, scope);
    }
  }
  exec = _es6_module.add_export('exec', exec);
  var scopes=new cachering(function() {
    return {thisvar: undefined, scope: {}}
  }, 512);
  function exec2(ast, scope1) {
    var scope=scopes.next();
    scope.scope = scope1;
    scope.parent = undefined;
    function visit(node, scope, pscope) {
      if (typeof node=="string")
        return scope.scope[node];
      if (typeof node=="number")
        return node;
      if (node.type=="!") {
          return !visit(node[0], scope);
      }
      else 
        if (node.type=="negate") {
          return -visit(node[0], scope);
      }
      else 
        if (node.type=="?") {
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          var c=visit(node[2], scope, pscope);
          return a ? b : c;
      }
      else 
        if (node.type=="call") {
          var func;
          if (typeof node[0]=="string"&&node.parent.type==".") {
              func = scope.thisvar[node[0]];
          }
          else {
            func = visit(node[0], scope, pscope);
          }
          var thisvar;
          if (node.parent.type!=".") {
              thisvar = self;
          }
          else {
            thisvar = scope.thisvar;
          }
          execdebug("func call!", func, thisvar, "...", pscope);
          switch (node[1].length) {
            case 0:
              return func.call(thisvar);
            case 1:
              return func.call(thisvar, visit(node[1][0], scope, pscope));
            case 2:
              return func.call(thisvar, visit(node[1][0], scope, pscope), visit(node[1][1], scope, pscope));
            case 3:
              return func.call(thisvar, visit(node[1][0], scope, pscope), visit(node[1][1], scope, pscope), visit(node[1][2], scope, pscope));
            case 4:
              return func.call(thisvar, visit(node[1][0], scope, pscope), visit(node[1][1], scope, pscope), visit(node[1][2], scope, pscope), visit(node[1][3], scope, pscope));
          }
      }
      else 
        if (node.type=="ID") {
          if (node.parent!=undefined&&node.parent.type==".") {
              return scope.thisvar[node.value];
          }
          else {
            return scope.scope[node.value];
          }
      }
      else 
        if (node.type=="NUMLIT") {
          return node.value;
      }
      else 
        if (node.type=="STRLIT") {
          return node.value;
      }
      else 
        if (node.type==".") {
          var scope2=scopes.next();
          scope2.parent = scope;
          scope2.scope = scope.scope;
          scope2.thisvar = visit(node[0], scope, pscope);
          pscope = scope, scope = scope2;
          if (debug_exec)
            console.log("scope", scope, node[0], scope.scope[node[0]], "...");
          if (typeof node[1]=="string") {
              return scope.thisvar[node[1]];
          }
          else {
            return visit(node[1], scope, pscope);
          }
      }
      else 
        if (node.type=="array") {
          var array=visit(node[0], scope, pscope);
          var idx=visit(node[1], scope, pscope);
          return array[idx];
      }
      else 
        if (node.type=="==") {
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          return a==b;
      }
      else 
        if (node.type=="&&") {
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          return a&&b;
      }
      else 
        if (node.type=="||") {
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          return a||b;
      }
      else 
        if (node.type=="^") {
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          return a^b;
      }
      else 
        if (node.type==">=") {
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          return a>=b;
      }
      else 
        if (node.type==">") {
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          return a>b;
      }
      else 
        if (node.type=="!=") {
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          return a!=b;
      }
      else 
        if (node.type=="in") {
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          if (debug_exec)
            console.log("in keyword", a, b, a in b);
          return a in b;
      }
      else 
        if (node.type=="<=") {
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          return a<=b;
      }
      else 
        if (node.type=="<") {
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          return a<b;
      }
      else 
        if (node.type=="|") {
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          return a|b;
      }
      else 
        if (node.type=="+") {
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          return a+b;
      }
      else 
        if (node.type=="-") {
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          return a-b;
      }
      else 
        if (node.type=="*") {
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          return a*b;
      }
      else 
        if (node.type=="/") {
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          return a/b;
      }
      else 
        if (node.type==">>") {
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          return a>>b;
      }
      else 
        if (node.type=="<<") {
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          return a<<b;
      }
      else 
        if (node.type=="&") {
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          return a&b;
      }
      else 
        if (node.type=="=") {
          if (typeof node[0]=="string"||node[0].type=="ID") {
              var key=typeof node[0]=="string" ? node[0] : node[0].value;
              scope.scope[key] = visit(node[1], scope, pscope);
              return scope.scope[key];
          }
          var a=visit(node[0], scope, pscope);
          var b=visit(node[1], scope, pscope);
          var container=visit(node[0][0], scope, pscope);
          var key=node[0][1];
          if (typeof key!="string") {
              throw new Error("safe_eval error with: "+code);
          }
          container[key] = b;
          return b;
      }
      else {
        console.log("Error, unknown node. "+node.type+", ast:\n", ast);
      }
    }
    return visit(ast, scope, undefined);
  }
  exec2 = _es6_module.add_export('exec2', exec2);
  function safe_eval(code, scope) {
    scope = scope==undefined ? {} : scope;
    var ast=compile(code);
    parsedebug(ast);
    return exec(ast, scope);
  }
  safe_eval = _es6_module.add_export('safe_eval', safe_eval);
});
es6_module_define('esprima', [], function _esprima_module(_es6_module) {
  (function(root, factory) {
    'use strict';
    if (typeof define==='function'&&define.amd) {
        define(['exports'], factory);
    }
    else 
      if (typeof exports!=='undefined') {
        factory(exports);
    }
    else {
      factory(root.esprima = {});
    }
  }(this, function(exports) {
    'use strict';
    var Token, TokenName, FnExprTokens, Syntax, PlaceHolders, Messages, Regex, source, strict, index, lineNumber, lineStart, hasLineTerminator, lastIndex, lastLineNumber, lastLineStart, startIndex, startLineNumber, startLineStart, scanning, length, lookahead, state, extra, isBindingElement, isAssignmentTarget, firstCoverInitializedNameError;
    Token = {BooleanLiteral: 1, EOF: 2, Identifier: 3, Keyword: 4, NullLiteral: 5, NumericLiteral: 6, Punctuator: 7, StringLiteral: 8, RegularExpression: 9, Template: 10}
    TokenName = {}
    TokenName[Token.BooleanLiteral] = 'Boolean';
    TokenName[Token.EOF] = '<end>';
    TokenName[Token.Identifier] = 'Identifier';
    TokenName[Token.Keyword] = 'Keyword';
    TokenName[Token.NullLiteral] = 'Null';
    TokenName[Token.NumericLiteral] = 'Numeric';
    TokenName[Token.Punctuator] = 'Punctuator';
    TokenName[Token.StringLiteral] = 'String';
    TokenName[Token.RegularExpression] = 'RegularExpression';
    TokenName[Token.Template] = 'Template';
    FnExprTokens = ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new', 'return', 'case', 'delete', 'throw', 'void', '=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '>>>=', '&=', '|=', '^=', ',', '+', '-', '*', '/', '%', '++', '--', '<<', '>>', '>>>', '&', '|', '^', '!', '~', '&&', '||', '?', ':', '===', '==', '>=', '<=', '<', '>', '!=', '!=='];
    Syntax = {AssignmentExpression: 'AssignmentExpression', AssignmentPattern: 'AssignmentPattern', ArrayExpression: 'ArrayExpression', ArrayPattern: 'ArrayPattern', ArrowFunctionExpression: 'ArrowFunctionExpression', BlockStatement: 'BlockStatement', BinaryExpression: 'BinaryExpression', BreakStatement: 'BreakStatement', CallExpression: 'CallExpression', CatchClause: 'CatchClause', ClassBody: 'ClassBody', ClassDeclaration: 'ClassDeclaration', ClassExpression: 'ClassExpression', ConditionalExpression: 'ConditionalExpression', ContinueStatement: 'ContinueStatement', DoWhileStatement: 'DoWhileStatement', DebuggerStatement: 'DebuggerStatement', EmptyStatement: 'EmptyStatement', ExportAllDeclaration: 'ExportAllDeclaration', ExportDefaultDeclaration: 'ExportDefaultDeclaration', ExportNamedDeclaration: 'ExportNamedDeclaration', ExportSpecifier: 'ExportSpecifier', ExpressionStatement: 'ExpressionStatement', ForStatement: 'ForStatement', ForOfStatement: 'ForOfStatement', ForInStatement: 'ForInStatement', FunctionDeclaration: 'FunctionDeclaration', FunctionExpression: 'FunctionExpression', Identifier: 'Identifier', IfStatement: 'IfStatement', ImportDeclaration: 'ImportDeclaration', ImportDefaultSpecifier: 'ImportDefaultSpecifier', ImportNamespaceSpecifier: 'ImportNamespaceSpecifier', ImportSpecifier: 'ImportSpecifier', Literal: 'Literal', LabeledStatement: 'LabeledStatement', LogicalExpression: 'LogicalExpression', MemberExpression: 'MemberExpression', MetaProperty: 'MetaProperty', MethodDefinition: 'MethodDefinition', NewExpression: 'NewExpression', ObjectExpression: 'ObjectExpression', ObjectPattern: 'ObjectPattern', Program: 'Program', Property: 'Property', RestElement: 'RestElement', ReturnStatement: 'ReturnStatement', SequenceExpression: 'SequenceExpression', SpreadElement: 'SpreadElement', Super: 'Super', SwitchCase: 'SwitchCase', SwitchStatement: 'SwitchStatement', TaggedTemplateExpression: 'TaggedTemplateExpression', TemplateElement: 'TemplateElement', TemplateLiteral: 'TemplateLiteral', ThisExpression: 'ThisExpression', ThrowStatement: 'ThrowStatement', TryStatement: 'TryStatement', UnaryExpression: 'UnaryExpression', UpdateExpression: 'UpdateExpression', VariableDeclaration: 'VariableDeclaration', VariableDeclarator: 'VariableDeclarator', WhileStatement: 'WhileStatement', WithStatement: 'WithStatement', YieldExpression: 'YieldExpression'}
    PlaceHolders = {ArrowParameterPlaceHolder: 'ArrowParameterPlaceHolder'}
    Messages = {UnexpectedToken: 'Unexpected token %0', UnexpectedNumber: 'Unexpected number', UnexpectedString: 'Unexpected string', UnexpectedIdentifier: 'Unexpected identifier', UnexpectedReserved: 'Unexpected reserved word', UnexpectedTemplate: 'Unexpected quasi %0', UnexpectedEOS: 'Unexpected end of input', NewlineAfterThrow: 'Illegal newline after throw', InvalidRegExp: 'Invalid regular expression', UnterminatedRegExp: 'Invalid regular expression: missing /', InvalidLHSInAssignment: 'Invalid left-hand side in assignment', InvalidLHSInForIn: 'Invalid left-hand side in for-in', InvalidLHSInForLoop: 'Invalid left-hand side in for-loop', MultipleDefaultsInSwitch: 'More than one default clause in switch statement', NoCatchOrFinally: 'Missing catch or finally after try', UnknownLabel: 'Undefined label \'%0\'', Redeclaration: '%0 \'%1\' has already been declared', IllegalContinue: 'Illegal continue statement', IllegalBreak: 'Illegal break statement', IllegalReturn: 'Illegal return statement', StrictModeWith: 'Strict mode code may not include a with statement', StrictCatchVariable: 'Catch variable may not be eval or arguments in strict mode', StrictVarName: 'Variable name may not be eval or arguments in strict mode', StrictParamName: 'Parameter name eval or arguments is not allowed in strict mode', StrictParamDupe: 'Strict mode function may not have duplicate parameter names', StrictFunctionName: 'Function name may not be eval or arguments in strict mode', StrictOctalLiteral: 'Octal literals are not allowed in strict mode.', StrictDelete: 'Delete of an unqualified identifier in strict mode.', StrictLHSAssignment: 'Assignment to eval or arguments is not allowed in strict mode', StrictLHSPostfix: 'Postfix increment/decrement may not have eval or arguments operand in strict mode', StrictLHSPrefix: 'Prefix increment/decrement may not have eval or arguments operand in strict mode', StrictReservedWord: 'Use of future reserved word in strict mode', TemplateOctalLiteral: 'Octal literals are not allowed in template strings.', ParameterAfterRestParameter: 'Rest parameter must be last formal parameter', DefaultRestParameter: 'Unexpected token =', ObjectPatternAsRestParameter: 'Unexpected token {', DuplicateProtoProperty: 'Duplicate __proto__ fields are not allowed in object literals', ConstructorSpecialMethod: 'Class constructor may not be an accessor', DuplicateConstructor: 'A class may only have one constructor', StaticPrototype: 'Classes may not have static property named prototype', MissingFromClause: 'Unexpected token', NoAsAfterImportNamespace: 'Unexpected token', InvalidModuleSpecifier: 'Unexpected token', IllegalImportDeclaration: 'Unexpected token', IllegalExportDeclaration: 'Unexpected token', DuplicateBinding: 'Duplicate binding %0'}
    var Regex={}
    Regex.NonAsciiIdentifierStart = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDE00-\uDE11\uDE13-\uDE2B\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDE00-\uDE2F\uDE44\uDE80-\uDEAA]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]/;
    Regex.NonAsciiIdentifierPart = /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDD0-\uDDDA\uDE00-\uDE11\uDE13-\uDE37\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF01-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/;
    function assert(condition, message) {
      if (!condition) {
          throw new Error('ASSERT: '+message);
      }
    }
    function isDecimalDigit(ch) {
      return (ch>=0x30&&ch<=0x39);
    }
    function isHexDigit(ch) {
      return '0123456789abcdefABCDEF'.indexOf(ch)>=0;
    }
    function isOctalDigit(ch) {
      return '01234567'.indexOf(ch)>=0;
    }
    function octalToDecimal(ch) {
      var octal=(ch!=='0'), code='01234567'.indexOf(ch);
      if (index<length&&isOctalDigit(source[index])) {
          octal = true;
          code = code*8+'01234567'.indexOf(source[index++]);
          if ('0123'.indexOf(ch)>=0&&index<length&&isOctalDigit(source[index])) {
              code = code*8+'01234567'.indexOf(source[index++]);
          }
      }
      return {code: code, octal: octal}
    }
    function isWhiteSpace(ch) {
      return (ch===0x20)||(ch===0x9)||(ch===0xb)||(ch===0xc)||(ch===0xa0)||(ch>=0x1680&&[0x1680, 0x180e, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200a, 0x202f, 0x205f, 0x3000, 0xfeff].indexOf(ch)>=0);
    }
    function isLineTerminator(ch) {
      return (ch===0xa)||(ch===0xd)||(ch===0x2028)||(ch===0x2029);
    }
    function fromCodePoint(cp) {
      return (cp<0x10000) ? String.fromCharCode(cp) : String.fromCharCode(0xd800+((cp-0x10000)>>10))+String.fromCharCode(0xdc00+((cp-0x10000)&1023));
    }
    function isIdentifierStart(ch) {
      return (ch===0x24)||(ch===0x5f)||(ch>=0x41&&ch<=0x5a)||(ch>=0x61&&ch<=0x7a)||(ch===0x5c)||((ch>=0x80)&&Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch)));
    }
    function isIdentifierPart(ch) {
      return (ch===0x24)||(ch===0x5f)||(ch>=0x41&&ch<=0x5a)||(ch>=0x61&&ch<=0x7a)||(ch>=0x30&&ch<=0x39)||(ch===0x5c)||((ch>=0x80)&&Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch)));
    }
    function isFutureReservedWord(id) {
      switch (id) {
        case 'enum':
        case 'export':
        case 'import':
        case 'super':
          return true;
        default:
          return false;
      }
    }
    function isStrictModeReservedWord(id) {
      switch (id) {
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'yield':
        case 'let':
          return true;
        default:
          return false;
      }
    }
    function isRestrictedWord(id) {
      return id==='eval'||id==='arguments';
    }
    function isKeyword(id) {
      switch (id.length) {
        case 2:
          return (id==='if')||(id==='in')||(id==='do');
        case 3:
          return (id==='var')||(id==='for')||(id==='new')||(id==='try')||(id==='let');
        case 4:
          return (id==='this')||(id==='else')||(id==='case')||(id==='void')||(id==='with')||(id==='enum');
        case 5:
          return (id==='while')||(id==='break')||(id==='catch')||(id==='throw')||(id==='const')||(id==='yield')||(id==='class')||(id==='super');
        case 6:
          return (id==='return')||(id==='typeof')||(id==='delete')||(id==='switch')||(id==='export')||(id==='import');
        case 7:
          return (id==='default')||(id==='finally')||(id==='extends');
        case 8:
          return (id==='function')||(id==='continue')||(id==='debugger');
        case 10:
          return (id==='instanceof');
        default:
          return false;
      }
    }
    function addComment(type, value, start, end, loc) {
      var comment;
      assert(typeof start==='number', 'Comment must have valid position');
      state.lastCommentStart = start;
      comment = {type: type, value: value}
      if (extra.range) {
          comment.range = [start, end];
      }
      if (extra.loc) {
          comment.loc = loc;
      }
      extra.comments.push(comment);
      if (extra.attachComment) {
          extra.leadingComments.push(comment);
          extra.trailingComments.push(comment);
      }
      if (extra.tokenize) {
          comment.type = comment.type+'Comment';
          if (extra.delegate) {
              comment = extra.delegate(comment);
          }
          extra.tokens.push(comment);
      }
    }
    function skipSingleLineComment(offset) {
      var start, loc, ch, comment;
      start = index-offset;
      loc = {start: {line: lineNumber, column: index-lineStart-offset}}
      while (index<length) {
        ch = source.charCodeAt(index);
        ++index;
        if (isLineTerminator(ch)) {
            hasLineTerminator = true;
            if (extra.comments) {
                comment = source.slice(start+offset, index-1);
                loc.end = {line: lineNumber, column: index-lineStart-1};
                addComment('Line', comment, start, index-1, loc);
            }
            if (ch===13&&source.charCodeAt(index)===10) {
                ++index;
            }
            ++lineNumber;
            lineStart = index;
            return ;
        }
      }
      if (extra.comments) {
          comment = source.slice(start+offset, index);
          loc.end = {line: lineNumber, column: index-lineStart};
          addComment('Line', comment, start, index, loc);
      }
    }
    function skipMultiLineComment() {
      var start, loc, ch, comment;
      if (extra.comments) {
          start = index-2;
          loc = {start: {line: lineNumber, column: index-lineStart-2}};
      }
      while (index<length) {
        ch = source.charCodeAt(index);
        if (isLineTerminator(ch)) {
            if (ch===0xd&&source.charCodeAt(index+1)===0xa) {
                ++index;
            }
            hasLineTerminator = true;
            ++lineNumber;
            ++index;
            lineStart = index;
        }
        else 
          if (ch===0x2a) {
            if (source.charCodeAt(index+1)===0x2f) {
                ++index;
                ++index;
                if (extra.comments) {
                    comment = source.slice(start+2, index-2);
                    loc.end = {line: lineNumber, column: index-lineStart};
                    addComment('Block', comment, start, index, loc);
                }
                return ;
            }
            ++index;
        }
        else {
          ++index;
        }
      }
      if (extra.comments) {
          loc.end = {line: lineNumber, column: index-lineStart};
          comment = source.slice(start+2, index);
          addComment('Block', comment, start, index, loc);
      }
      tolerateUnexpectedToken();
    }
    function skipComment() {
      var ch, start;
      hasLineTerminator = false;
      start = (index===0);
      while (index<length) {
        ch = source.charCodeAt(index);
        if (isWhiteSpace(ch)) {
            ++index;
        }
        else 
          if (isLineTerminator(ch)) {
            hasLineTerminator = true;
            ++index;
            if (ch===0xd&&source.charCodeAt(index)===0xa) {
                ++index;
            }
            ++lineNumber;
            lineStart = index;
            start = true;
        }
        else 
          if (ch===0x2f) {
            ch = source.charCodeAt(index+1);
            if (ch===0x2f) {
                ++index;
                ++index;
                skipSingleLineComment(2);
                start = true;
            }
            else 
              if (ch===0x2a) {
                ++index;
                ++index;
                skipMultiLineComment();
            }
            else {
              break;
            }
        }
        else 
          if (start&&ch===0x2d) {
            if ((source.charCodeAt(index+1)===0x2d)&&(source.charCodeAt(index+2)===0x3e)) {
                index+=3;
                skipSingleLineComment(3);
            }
            else {
              break;
            }
        }
        else 
          if (ch===0x3c) {
            if (source.slice(index+1, index+4)==='!--') {
                ++index;
                ++index;
                ++index;
                ++index;
                skipSingleLineComment(4);
            }
            else {
              break;
            }
        }
        else {
          break;
        }
      }
    }
    function scanHexEscape(prefix) {
      var i, len, ch, code=0;
      len = (prefix==='u') ? 4 : 2;
      for (i = 0; i<len; ++i) {
          if (index<length&&isHexDigit(source[index])) {
              ch = source[index++];
              code = code*16+'0123456789abcdef'.indexOf(ch.toLowerCase());
          }
          else {
            return '';
          }
      }
      return String.fromCharCode(code);
    }
    function scanUnicodeCodePointEscape() {
      var ch, code;
      ch = source[index];
      code = 0;
      if (ch==='}') {
          throwUnexpectedToken();
      }
      while (index<length) {
        ch = source[index++];
        if (!isHexDigit(ch)) {
            break;
        }
        code = code*16+'0123456789abcdef'.indexOf(ch.toLowerCase());
      }
      if (code>0x10ffff||ch!=='}') {
          throwUnexpectedToken();
      }
      return fromCodePoint(code);
    }
    function codePointAt(i) {
      var cp, first, second;
      cp = source.charCodeAt(i);
      if (cp>=0xd800&&cp<=0xdbff) {
          second = source.charCodeAt(i+1);
          if (second>=0xdc00&&second<=0xdfff) {
              first = cp;
              cp = (first-0xd800)*0x400+second-0xdc00+0x10000;
          }
      }
      return cp;
    }
    function getComplexIdentifier() {
      var cp, ch, id;
      cp = codePointAt(index);
      id = fromCodePoint(cp);
      index+=id.length;
      if (cp===0x5c) {
          if (source.charCodeAt(index)!==0x75) {
              throwUnexpectedToken();
          }
          ++index;
          if (source[index]==='{') {
              ++index;
              ch = scanUnicodeCodePointEscape();
          }
          else {
            ch = scanHexEscape('u');
            cp = ch.charCodeAt(0);
            if (!ch||ch==='\\'||!isIdentifierStart(cp)) {
                throwUnexpectedToken();
            }
          }
          id = ch;
      }
      while (index<length) {
        cp = codePointAt(index);
        if (!isIdentifierPart(cp)) {
            break;
        }
        ch = fromCodePoint(cp);
        id+=ch;
        index+=ch.length;
        if (cp===0x5c) {
            id = id.substr(0, id.length-1);
            if (source.charCodeAt(index)!==0x75) {
                throwUnexpectedToken();
            }
            ++index;
            if (source[index]==='{') {
                ++index;
                ch = scanUnicodeCodePointEscape();
            }
            else {
              ch = scanHexEscape('u');
              cp = ch.charCodeAt(0);
              if (!ch||ch==='\\'||!isIdentifierPart(cp)) {
                  throwUnexpectedToken();
              }
            }
            id+=ch;
        }
      }
      return id;
    }
    function getIdentifier() {
      var start, ch;
      start = index++;
      while (index<length) {
        ch = source.charCodeAt(index);
        if (ch===0x5c) {
            index = start;
            return getComplexIdentifier();
        }
        else 
          if (ch>=0xd800&&ch<0xdfff) {
            index = start;
            return getComplexIdentifier();
        }
        if (isIdentifierPart(ch)) {
            ++index;
        }
        else {
          break;
        }
      }
      return source.slice(start, index);
    }
    function scanIdentifier() {
      var start, id, type;
      start = index;
      id = (source.charCodeAt(index)===0x5c) ? getComplexIdentifier() : getIdentifier();
      if (id.length===1) {
          type = Token.Identifier;
      }
      else 
        if (isKeyword(id)) {
          type = Token.Keyword;
      }
      else 
        if (id==='null') {
          type = Token.NullLiteral;
      }
      else 
        if (id==='true'||id==='false') {
          type = Token.BooleanLiteral;
      }
      else {
        type = Token.Identifier;
      }
      return {type: type, value: id, lineNumber: lineNumber, lineStart: lineStart, start: start, end: index}
    }
    function scanPunctuator() {
      var token, str;
      token = {type: Token.Punctuator, value: '', lineNumber: lineNumber, lineStart: lineStart, start: index, end: index}
      str = source[index];
      switch (str) {
        case '(':
          if (extra.tokenize) {
              extra.openParenToken = extra.tokenValues.length;
          }
          ++index;
          break;
        case '{':
          if (extra.tokenize) {
              extra.openCurlyToken = extra.tokenValues.length;
          }
          state.curlyStack.push('{');
          ++index;
          break;
        case '.':
          ++index;
          if (source[index]==='.'&&source[index+1]==='.') {
              index+=2;
              str = '...';
          }
          break;
        case '}':
          ++index;
          state.curlyStack.pop();
          break;
        case ')':
        case ';':
        case ',':
        case '[':
        case ']':
        case ':':
        case '?':
        case '~':
          ++index;
          break;
        default:
          str = source.substr(index, 4);
          if (str==='>>>=') {
              index+=4;
          }
          else {
            str = str.substr(0, 3);
            if (str==='==='||str==='!=='||str==='>>>'||str==='<<='||str==='>>=') {
                index+=3;
            }
            else {
              str = str.substr(0, 2);
              if (str==='&&'||str==='||'||str==='=='||str==='!='||str==='+='||str==='-='||str==='*='||str==='/='||str==='++'||str==='--'||str==='<<'||str==='>>'||str==='&='||str==='|='||str==='^='||str==='%='||str==='<='||str==='>='||str==='=>') {
                  index+=2;
              }
              else {
                str = source[index];
                if ('<>=!+-*%&|^/'.indexOf(str)>=0) {
                    ++index;
                }
              }
            }
          }
      }
      if (index===token.start) {
          throwUnexpectedToken();
      }
      token.end = index;
      token.value = str;
      return token;
    }
    function scanHexLiteral(start) {
      var number='';
      while (index<length) {
        if (!isHexDigit(source[index])) {
            break;
        }
        number+=source[index++];
      }
      if (number.length===0) {
          throwUnexpectedToken();
      }
      if (isIdentifierStart(source.charCodeAt(index))) {
          throwUnexpectedToken();
      }
      return {type: Token.NumericLiteral, value: parseInt('0x'+number, 16), lineNumber: lineNumber, lineStart: lineStart, start: start, end: index}
    }
    function scanBinaryLiteral(start) {
      var ch, number;
      number = '';
      while (index<length) {
        ch = source[index];
        if (ch!=='0'&&ch!=='1') {
            break;
        }
        number+=source[index++];
      }
      if (number.length===0) {
          throwUnexpectedToken();
      }
      if (index<length) {
          ch = source.charCodeAt(index);
          if (isIdentifierStart(ch)||isDecimalDigit(ch)) {
              throwUnexpectedToken();
          }
      }
      return {type: Token.NumericLiteral, value: parseInt(number, 2), lineNumber: lineNumber, lineStart: lineStart, start: start, end: index}
    }
    function scanOctalLiteral(prefix, start) {
      var number, octal;
      if (isOctalDigit(prefix)) {
          octal = true;
          number = '0'+source[index++];
      }
      else {
        octal = false;
        ++index;
        number = '';
      }
      while (index<length) {
        if (!isOctalDigit(source[index])) {
            break;
        }
        number+=source[index++];
      }
      if (!octal&&number.length===0) {
          throwUnexpectedToken();
      }
      if (isIdentifierStart(source.charCodeAt(index))||isDecimalDigit(source.charCodeAt(index))) {
          throwUnexpectedToken();
      }
      return {type: Token.NumericLiteral, value: parseInt(number, 8), octal: octal, lineNumber: lineNumber, lineStart: lineStart, start: start, end: index}
    }
    function isImplicitOctalLiteral() {
      var i, ch;
      for (i = index+1; i<length; ++i) {
          ch = source[i];
          if (ch==='8'||ch==='9') {
              return false;
          }
          if (!isOctalDigit(ch)) {
              return true;
          }
      }
      return true;
    }
    function scanNumericLiteral() {
      var number, start, ch;
      ch = source[index];
      assert(isDecimalDigit(ch.charCodeAt(0))||(ch==='.'), 'Numeric literal must start with a decimal digit or a decimal point');
      start = index;
      number = '';
      if (ch!=='.') {
          number = source[index++];
          ch = source[index];
          if (number==='0') {
              if (ch==='x'||ch==='X') {
                  ++index;
                  return scanHexLiteral(start);
              }
              if (ch==='b'||ch==='B') {
                  ++index;
                  return scanBinaryLiteral(start);
              }
              if (ch==='o'||ch==='O') {
                  return scanOctalLiteral(ch, start);
              }
              if (isOctalDigit(ch)) {
                  if (isImplicitOctalLiteral()) {
                      return scanOctalLiteral(ch, start);
                  }
              }
          }
          while (isDecimalDigit(source.charCodeAt(index))) {
            number+=source[index++];
          }
          ch = source[index];
      }
      if (ch==='.') {
          number+=source[index++];
          while (isDecimalDigit(source.charCodeAt(index))) {
            number+=source[index++];
          }
          ch = source[index];
      }
      if (ch==='e'||ch==='E') {
          number+=source[index++];
          ch = source[index];
          if (ch==='+'||ch==='-') {
              number+=source[index++];
          }
          if (isDecimalDigit(source.charCodeAt(index))) {
              while (isDecimalDigit(source.charCodeAt(index))) {
                number+=source[index++];
              }
          }
          else {
            throwUnexpectedToken();
          }
      }
      if (isIdentifierStart(source.charCodeAt(index))) {
          throwUnexpectedToken();
      }
      return {type: Token.NumericLiteral, value: parseFloat(number), lineNumber: lineNumber, lineStart: lineStart, start: start, end: index}
    }
    function scanStringLiteral() {
      var str='', quote, start, ch, unescaped, octToDec, octal=false;
      quote = source[index];
      assert((quote==='\''||quote==='"'), 'String literal must starts with a quote');
      start = index;
      ++index;
      while (index<length) {
        ch = source[index++];
        if (ch===quote) {
            quote = '';
            break;
        }
        else 
          if (ch==='\\') {
            ch = source[index++];
            if (!ch||!isLineTerminator(ch.charCodeAt(0))) {
                switch (ch) {
                  case 'u':
                  case 'x':
                    if (source[index]==='{') {
                        ++index;
                        str+=scanUnicodeCodePointEscape();
                    }
                    else {
                      unescaped = scanHexEscape(ch);
                      if (!unescaped) {
                          throw throwUnexpectedToken();
                      }
                      str+=unescaped;
                    }
                    break;
                  case 'n':
                    str+='\n';
                    break;
                  case 'r':
                    str+='\r';
                    break;
                  case 't':
                    str+='\t';
                    break;
                  case 'b':
                    str+='\b';
                    break;
                  case 'f':
                    str+='\f';
                    break;
                  case 'v':
                    str+='\x0B';
                    break;
                  case '8':
                  case '9':
                    str+=ch;
                    tolerateUnexpectedToken();
                    break;
                  default:
                    if (isOctalDigit(ch)) {
                        octToDec = octalToDecimal(ch);
                        octal = octToDec.octal||octal;
                        str+=String.fromCharCode(octToDec.code);
                    }
                    else {
                      str+=ch;
                    }
                    break;
                }
            }
            else {
              ++lineNumber;
              if (ch==='\r'&&source[index]==='\n') {
                  ++index;
              }
              lineStart = index;
            }
        }
        else 
          if (isLineTerminator(ch.charCodeAt(0))) {
            break;
        }
        else {
          str+=ch;
        }
      }
      if (quote!=='') {
          index = start;
          throwUnexpectedToken();
      }
      return {type: Token.StringLiteral, value: str, octal: octal, lineNumber: startLineNumber, lineStart: startLineStart, start: start, end: index}
    }
    function scanTemplate() {
      var cooked='', ch, start, rawOffset, terminated, head, tail, restore, unescaped;
      terminated = false;
      tail = false;
      start = index;
      head = (source[index]==='`');
      rawOffset = 2;
      ++index;
      while (index<length) {
        ch = source[index++];
        if (ch==='`') {
            rawOffset = 1;
            tail = true;
            terminated = true;
            break;
        }
        else 
          if (ch==='$') {
            if (source[index]==='{') {
                state.curlyStack.push('${');
                ++index;
                terminated = true;
                break;
            }
            cooked+=ch;
        }
        else 
          if (ch==='\\') {
            ch = source[index++];
            if (!isLineTerminator(ch.charCodeAt(0))) {
                switch (ch) {
                  case 'n':
                    cooked+='\n';
                    break;
                  case 'r':
                    cooked+='\r';
                    break;
                  case 't':
                    cooked+='\t';
                    break;
                  case 'u':
                  case 'x':
                    if (source[index]==='{') {
                        ++index;
                        cooked+=scanUnicodeCodePointEscape();
                    }
                    else {
                      restore = index;
                      unescaped = scanHexEscape(ch);
                      if (unescaped) {
                          cooked+=unescaped;
                      }
                      else {
                        index = restore;
                        cooked+=ch;
                      }
                    }
                    break;
                  case 'b':
                    cooked+='\b';
                    break;
                  case 'f':
                    cooked+='\f';
                    break;
                  case 'v':
                    cooked+='\v';
                    break;
                  default:
                    if (ch==='0') {
                        if (isDecimalDigit(source.charCodeAt(index))) {
                            throwError(Messages.TemplateOctalLiteral);
                        }
                        cooked+='\0';
                    }
                    else 
                      if (isOctalDigit(ch)) {
                        throwError(Messages.TemplateOctalLiteral);
                    }
                    else {
                      cooked+=ch;
                    }
                    break;
                }
            }
            else {
              ++lineNumber;
              if (ch==='\r'&&source[index]==='\n') {
                  ++index;
              }
              lineStart = index;
            }
        }
        else 
          if (isLineTerminator(ch.charCodeAt(0))) {
            ++lineNumber;
            if (ch==='\r'&&source[index]==='\n') {
                ++index;
            }
            lineStart = index;
            cooked+='\n';
        }
        else {
          cooked+=ch;
        }
      }
      if (!terminated) {
          throwUnexpectedToken();
      }
      if (!head) {
          state.curlyStack.pop();
      }
      return {type: Token.Template, value: {cooked: cooked, raw: source.slice(start+1, index-rawOffset)}, head: head, tail: tail, lineNumber: lineNumber, lineStart: lineStart, start: start, end: index}
    }
    function testRegExp(pattern, flags) {
      var astralSubstitute='\uFFFF', tmp=pattern;
      if (flags.indexOf('u')>=0) {
          tmp = tmp.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([a-fA-F0-9]{4})/g, function($0, $1, $2) {
            var codePoint=parseInt($1||$2, 16);
            if (codePoint>0x10ffff) {
                throwUnexpectedToken(null, Messages.InvalidRegExp);
            }
            if (codePoint<=0xffff) {
                return String.fromCharCode(codePoint);
            }
            return astralSubstitute;
          }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, astralSubstitute);
      }
      try {
        RegExp(tmp);
      }
      catch (e) {
          throwUnexpectedToken(null, Messages.InvalidRegExp);
      }
      try {
        return new RegExp(pattern, flags);
      }
      catch (exception) {
          return null;
      }
    }
    function scanRegExpBody() {
      var ch, str, classMarker, terminated, body;
      ch = source[index];
      assert(ch==='/', 'Regular expression literal must start with a slash');
      str = source[index++];
      classMarker = false;
      terminated = false;
      while (index<length) {
        ch = source[index++];
        str+=ch;
        if (ch==='\\') {
            ch = source[index++];
            if (isLineTerminator(ch.charCodeAt(0))) {
                throwUnexpectedToken(null, Messages.UnterminatedRegExp);
            }
            str+=ch;
        }
        else 
          if (isLineTerminator(ch.charCodeAt(0))) {
            throwUnexpectedToken(null, Messages.UnterminatedRegExp);
        }
        else 
          if (classMarker) {
            if (ch===']') {
                classMarker = false;
            }
        }
        else {
          if (ch==='/') {
              terminated = true;
              break;
          }
          else 
            if (ch==='[') {
              classMarker = true;
          }
        }
      }
      if (!terminated) {
          throwUnexpectedToken(null, Messages.UnterminatedRegExp);
      }
      body = str.substr(1, str.length-2);
      return {value: body, literal: str}
    }
    function scanRegExpFlags() {
      var ch, str, flags, restore;
      str = '';
      flags = '';
      while (index<length) {
        ch = source[index];
        if (!isIdentifierPart(ch.charCodeAt(0))) {
            break;
        }
        ++index;
        if (ch==='\\'&&index<length) {
            ch = source[index];
            if (ch==='u') {
                ++index;
                restore = index;
                ch = scanHexEscape('u');
                if (ch) {
                    flags+=ch;
                    for (str+='\\u'; restore<index; ++restore) {
                        str+=source[restore];
                    }
                }
                else {
                  index = restore;
                  flags+='u';
                  str+='\\u';
                }
                tolerateUnexpectedToken();
            }
            else {
              str+='\\';
              tolerateUnexpectedToken();
            }
        }
        else {
          flags+=ch;
          str+=ch;
        }
      }
      return {value: flags, literal: str}
    }
    function scanRegExp() {
      var start, body, flags, value;
      scanning = true;
      lookahead = null;
      skipComment();
      start = index;
      body = scanRegExpBody();
      flags = scanRegExpFlags();
      value = testRegExp(body.value, flags.value);
      scanning = false;
      if (extra.tokenize) {
          return {type: Token.RegularExpression, value: value, regex: {pattern: body.value, flags: flags.value}, lineNumber: lineNumber, lineStart: lineStart, start: start, end: index}
      }
      return {literal: body.literal+flags.literal, value: value, regex: {pattern: body.value, flags: flags.value}, start: start, end: index}
    }
    function collectRegex() {
      var pos, loc, regex, token;
      skipComment();
      pos = index;
      loc = {start: {line: lineNumber, column: index-lineStart}}
      regex = scanRegExp();
      loc.end = {line: lineNumber, column: index-lineStart}
      if (!extra.tokenize) {
          if (extra.tokens.length>0) {
              token = extra.tokens[extra.tokens.length-1];
              if (token.range[0]===pos&&token.type==='Punctuator') {
                  if (token.value==='/'||token.value==='/=') {
                      extra.tokens.pop();
                  }
              }
          }
          extra.tokens.push({type: 'RegularExpression', value: regex.literal, regex: regex.regex, range: [pos, index], loc: loc});
      }
      return regex;
    }
    function isIdentifierName(token) {
      return token.type===Token.Identifier||token.type===Token.Keyword||token.type===Token.BooleanLiteral||token.type===Token.NullLiteral;
    }
    function advanceSlash() {
      var regex, previous, check;
      function testKeyword(value) {
        return value&&(value.length>1)&&(value[0]>='a')&&(value[0]<='z');
      }
      previous = extra.tokenValues[extra.tokens.length-1];
      regex = (previous!==null);
      switch (previous) {
        case 'this':
        case ']':
          regex = false;
          break;
        case ')':
          check = extra.tokenValues[extra.openParenToken-1];
          regex = (check==='if'||check==='while'||check==='for'||check==='with');
          break;
        case '}':
          regex = false;
          if (testKeyword(extra.tokenValues[extra.openCurlyToken-3])) {
              check = extra.tokenValues[extra.openCurlyToken-4];
              regex = check ? (FnExprTokens.indexOf(check)<0) : false;
          }
          else 
            if (testKeyword(extra.tokenValues[extra.openCurlyToken-4])) {
              check = extra.tokenValues[extra.openCurlyToken-5];
              regex = check ? (FnExprTokens.indexOf(check)<0) : true;
          }
      }
      return regex ? collectRegex() : scanPunctuator();
    }
    function advance() {
      var cp, token;
      if (index>=length) {
          return {type: Token.EOF, lineNumber: lineNumber, lineStart: lineStart, start: index, end: index}
      }
      cp = source.charCodeAt(index);
      if (isIdentifierStart(cp)) {
          token = scanIdentifier();
          if (strict&&isStrictModeReservedWord(token.value)) {
              token.type = Token.Keyword;
          }
          return token;
      }
      if (cp===0x28||cp===0x29||cp===0x3b) {
          return scanPunctuator();
      }
      if (cp===0x27||cp===0x22) {
          return scanStringLiteral();
      }
      if (cp===0x2e) {
          if (isDecimalDigit(source.charCodeAt(index+1))) {
              return scanNumericLiteral();
          }
          return scanPunctuator();
      }
      if (isDecimalDigit(cp)) {
          return scanNumericLiteral();
      }
      if (extra.tokenize&&cp===0x2f) {
          return advanceSlash();
      }
      if (cp===0x60||(cp===0x7d&&state.curlyStack[state.curlyStack.length-1]==='${')) {
          return scanTemplate();
      }
      if (cp>=0xd800&&cp<0xdfff) {
          cp = codePointAt(index);
          if (isIdentifierStart(cp)) {
              return scanIdentifier();
          }
      }
      return scanPunctuator();
    }
    function collectToken() {
      var loc, token, value, entry;
      loc = {start: {line: lineNumber, column: index-lineStart}}
      token = advance();
      loc.end = {line: lineNumber, column: index-lineStart}
      if (token.type!==Token.EOF) {
          value = source.slice(token.start, token.end);
          entry = {type: TokenName[token.type], value: value, range: [token.start, token.end], loc: loc};
          if (token.regex) {
              entry.regex = {pattern: token.regex.pattern, flags: token.regex.flags};
          }
          if (extra.tokenValues) {
              extra.tokenValues.push((entry.type==='Punctuator'||entry.type==='Keyword') ? entry.value : null);
          }
          if (extra.tokenize) {
              if (!extra.range) {
                  delete entry.range;
              }
              if (!extra.loc) {
                  delete entry.loc;
              }
              if (extra.delegate) {
                  entry = extra.delegate(entry);
              }
          }
          extra.tokens.push(entry);
      }
      return token;
    }
    function lex() {
      var token;
      scanning = true;
      lastIndex = index;
      lastLineNumber = lineNumber;
      lastLineStart = lineStart;
      skipComment();
      token = lookahead;
      startIndex = index;
      startLineNumber = lineNumber;
      startLineStart = lineStart;
      lookahead = (typeof extra.tokens!=='undefined') ? collectToken() : advance();
      scanning = false;
      return token;
    }
    function peek() {
      scanning = true;
      skipComment();
      lastIndex = index;
      lastLineNumber = lineNumber;
      lastLineStart = lineStart;
      startIndex = index;
      startLineNumber = lineNumber;
      startLineStart = lineStart;
      lookahead = (typeof extra.tokens!=='undefined') ? collectToken() : advance();
      scanning = false;
    }
    function Position() {
      this.line = startLineNumber;
      this.column = startIndex-startLineStart;
    }
    function SourceLocation() {
      this.start = new Position();
      this.end = null;
    }
    function WrappingSourceLocation(startToken) {
      this.start = {line: startToken.lineNumber, column: startToken.start-startToken.lineStart}
      this.end = null;
    }
    function Node() {
      if (extra.range) {
          this.range = [startIndex, 0];
      }
      if (extra.loc) {
          this.loc = new SourceLocation();
      }
    }
    function WrappingNode(startToken) {
      if (extra.range) {
          this.range = [startToken.start, 0];
      }
      if (extra.loc) {
          this.loc = new WrappingSourceLocation(startToken);
      }
    }
    WrappingNode.prototype = Node.prototype = {processComment: function() {
      var lastChild, innerComments, leadingComments, trailingComments, bottomRight=extra.bottomRightStack, i, comment, last=bottomRight[bottomRight.length-1];
      if (this.type===Syntax.Program) {
          if (this.body.length>0) {
              return ;
          }
      }
      if (this.type===Syntax.BlockStatement&&this.body.length===0) {
          innerComments = [];
          for (i = extra.leadingComments.length-1; i>=0; --i) {
              comment = extra.leadingComments[i];
              if (this.range[1]>=comment.range[1]) {
                  innerComments.unshift(comment);
                  extra.leadingComments.splice(i, 1);
                  extra.trailingComments.splice(i, 1);
              }
          }
          if (innerComments.length) {
              this.innerComments = innerComments;
              return ;
          }
      }
      if (extra.trailingComments.length>0) {
          trailingComments = [];
          for (i = extra.trailingComments.length-1; i>=0; --i) {
              comment = extra.trailingComments[i];
              if (comment.range[0]>=this.range[1]) {
                  trailingComments.unshift(comment);
                  extra.trailingComments.splice(i, 1);
              }
          }
          extra.trailingComments = [];
      }
      else {
        if (last&&last.trailingComments&&last.trailingComments[0].range[0]>=this.range[1]) {
            trailingComments = last.trailingComments;
            delete last.trailingComments;
        }
      }
      while (last&&last.range[0]>=this.range[0]) {
        lastChild = bottomRight.pop();
        last = bottomRight[bottomRight.length-1];
      }
      if (lastChild) {
          if (lastChild.leadingComments) {
              leadingComments = [];
              for (i = lastChild.leadingComments.length-1; i>=0; --i) {
                  comment = lastChild.leadingComments[i];
                  if (comment.range[1]<=this.range[0]) {
                      leadingComments.unshift(comment);
                      lastChild.leadingComments.splice(i, 1);
                  }
              }
              if (!lastChild.leadingComments.length) {
                  lastChild.leadingComments = undefined;
              }
          }
      }
      else 
        if (extra.leadingComments.length>0) {
          leadingComments = [];
          for (i = extra.leadingComments.length-1; i>=0; --i) {
              comment = extra.leadingComments[i];
              if (comment.range[1]<=this.range[0]) {
                  leadingComments.unshift(comment);
                  extra.leadingComments.splice(i, 1);
              }
          }
      }
      if (leadingComments&&leadingComments.length>0) {
          this.leadingComments = leadingComments;
      }
      if (trailingComments&&trailingComments.length>0) {
          this.trailingComments = trailingComments;
      }
      bottomRight.push(this);
    }, finish: function() {
      if (extra.range) {
          this.range[1] = lastIndex;
      }
      if (extra.loc) {
          this.loc.end = {line: lastLineNumber, column: lastIndex-lastLineStart};
          if (extra.source) {
              this.loc.source = extra.source;
          }
      }
      if (extra.attachComment) {
          this.processComment();
      }
    }, finishArrayExpression: function(elements) {
      this.type = Syntax.ArrayExpression;
      this.elements = elements;
      this.finish();
      return this;
    }, finishArrayPattern: function(elements) {
      this.type = Syntax.ArrayPattern;
      this.elements = elements;
      this.finish();
      return this;
    }, finishArrowFunctionExpression: function(params, defaults, body, expression) {
      this.type = Syntax.ArrowFunctionExpression;
      this.id = null;
      this.params = params;
      this.defaults = defaults;
      this.body = body;
      this.generator = false;
      this.expression = expression;
      this.finish();
      return this;
    }, finishAssignmentExpression: function(operator, left, right) {
      this.type = Syntax.AssignmentExpression;
      this.operator = operator;
      this.left = left;
      this.right = right;
      this.finish();
      return this;
    }, finishAssignmentPattern: function(left, right) {
      this.type = Syntax.AssignmentPattern;
      this.left = left;
      this.right = right;
      this.finish();
      return this;
    }, finishBinaryExpression: function(operator, left, right) {
      this.type = (operator==='||'||operator==='&&') ? Syntax.LogicalExpression : Syntax.BinaryExpression;
      this.operator = operator;
      this.left = left;
      this.right = right;
      this.finish();
      return this;
    }, finishBlockStatement: function(body) {
      this.type = Syntax.BlockStatement;
      this.body = body;
      this.finish();
      return this;
    }, finishBreakStatement: function(label) {
      this.type = Syntax.BreakStatement;
      this.label = label;
      this.finish();
      return this;
    }, finishCallExpression: function(callee, args) {
      this.type = Syntax.CallExpression;
      this.callee = callee;
      this.arguments = args;
      this.finish();
      return this;
    }, finishCatchClause: function(param, body) {
      this.type = Syntax.CatchClause;
      this.param = param;
      this.body = body;
      this.finish();
      return this;
    }, finishClassBody: function(body) {
      this.type = Syntax.ClassBody;
      this.body = body;
      this.finish();
      return this;
    }, finishClassDeclaration: function(id, superClass, body) {
      this.type = Syntax.ClassDeclaration;
      this.id = id;
      this.superClass = superClass;
      this.body = body;
      this.finish();
      return this;
    }, finishClassExpression: function(id, superClass, body) {
      this.type = Syntax.ClassExpression;
      this.id = id;
      this.superClass = superClass;
      this.body = body;
      this.finish();
      return this;
    }, finishConditionalExpression: function(test, consequent, alternate) {
      this.type = Syntax.ConditionalExpression;
      this.test = test;
      this.consequent = consequent;
      this.alternate = alternate;
      this.finish();
      return this;
    }, finishContinueStatement: function(label) {
      this.type = Syntax.ContinueStatement;
      this.label = label;
      this.finish();
      return this;
    }, finishDebuggerStatement: function() {
      this.type = Syntax.DebuggerStatement;
      this.finish();
      return this;
    }, finishDoWhileStatement: function(body, test) {
      this.type = Syntax.DoWhileStatement;
      this.body = body;
      this.test = test;
      this.finish();
      return this;
    }, finishEmptyStatement: function() {
      this.type = Syntax.EmptyStatement;
      this.finish();
      return this;
    }, finishExpressionStatement: function(expression) {
      this.type = Syntax.ExpressionStatement;
      this.expression = expression;
      this.finish();
      return this;
    }, finishForStatement: function(init, test, update, body) {
      this.type = Syntax.ForStatement;
      this.init = init;
      this.test = test;
      this.update = update;
      this.body = body;
      this.finish();
      return this;
    }, finishForOfStatement: function(left, right, body) {
      this.type = Syntax.ForOfStatement;
      this.left = left;
      this.right = right;
      this.body = body;
      this.finish();
      return this;
    }, finishForInStatement: function(left, right, body) {
      this.type = Syntax.ForInStatement;
      this.left = left;
      this.right = right;
      this.body = body;
      this.each = false;
      this.finish();
      return this;
    }, finishFunctionDeclaration: function(id, params, defaults, body, generator) {
      this.type = Syntax.FunctionDeclaration;
      this.id = id;
      this.params = params;
      this.defaults = defaults;
      this.body = body;
      this.generator = generator;
      this.expression = false;
      this.finish();
      return this;
    }, finishFunctionExpression: function(id, params, defaults, body, generator) {
      this.type = Syntax.FunctionExpression;
      this.id = id;
      this.params = params;
      this.defaults = defaults;
      this.body = body;
      this.generator = generator;
      this.expression = false;
      this.finish();
      return this;
    }, finishIdentifier: function(name) {
      this.type = Syntax.Identifier;
      this.name = name;
      this.finish();
      return this;
    }, finishIfStatement: function(test, consequent, alternate) {
      this.type = Syntax.IfStatement;
      this.test = test;
      this.consequent = consequent;
      this.alternate = alternate;
      this.finish();
      return this;
    }, finishLabeledStatement: function(label, body) {
      this.type = Syntax.LabeledStatement;
      this.label = label;
      this.body = body;
      this.finish();
      return this;
    }, finishLiteral: function(token) {
      this.type = Syntax.Literal;
      this.value = token.value;
      this.raw = source.slice(token.start, token.end);
      if (token.regex) {
          this.regex = token.regex;
      }
      this.finish();
      return this;
    }, finishMemberExpression: function(accessor, object, property) {
      this.type = Syntax.MemberExpression;
      this.computed = accessor==='[';
      this.object = object;
      this.property = property;
      this.finish();
      return this;
    }, finishMetaProperty: function(meta, property) {
      this.type = Syntax.MetaProperty;
      this.meta = meta;
      this.property = property;
      this.finish();
      return this;
    }, finishNewExpression: function(callee, args) {
      this.type = Syntax.NewExpression;
      this.callee = callee;
      this.arguments = args;
      this.finish();
      return this;
    }, finishObjectExpression: function(properties) {
      this.type = Syntax.ObjectExpression;
      this.properties = properties;
      this.finish();
      return this;
    }, finishObjectPattern: function(properties) {
      this.type = Syntax.ObjectPattern;
      this.properties = properties;
      this.finish();
      return this;
    }, finishPostfixExpression: function(operator, argument) {
      this.type = Syntax.UpdateExpression;
      this.operator = operator;
      this.argument = argument;
      this.prefix = false;
      this.finish();
      return this;
    }, finishProgram: function(body, sourceType) {
      this.type = Syntax.Program;
      this.body = body;
      this.sourceType = sourceType;
      this.finish();
      return this;
    }, finishProperty: function(kind, key, computed, value, method, shorthand) {
      this.type = Syntax.Property;
      this.key = key;
      this.computed = computed;
      this.value = value;
      this.kind = kind;
      this.method = method;
      this.shorthand = shorthand;
      this.finish();
      return this;
    }, finishRestElement: function(argument) {
      this.type = Syntax.RestElement;
      this.argument = argument;
      this.finish();
      return this;
    }, finishReturnStatement: function(argument) {
      this.type = Syntax.ReturnStatement;
      this.argument = argument;
      this.finish();
      return this;
    }, finishSequenceExpression: function(expressions) {
      this.type = Syntax.SequenceExpression;
      this.expressions = expressions;
      this.finish();
      return this;
    }, finishSpreadElement: function(argument) {
      this.type = Syntax.SpreadElement;
      this.argument = argument;
      this.finish();
      return this;
    }, finishSwitchCase: function(test, consequent) {
      this.type = Syntax.SwitchCase;
      this.test = test;
      this.consequent = consequent;
      this.finish();
      return this;
    }, finishSuper: function() {
      this.type = Syntax.Super;
      this.finish();
      return this;
    }, finishSwitchStatement: function(discriminant, cases) {
      this.type = Syntax.SwitchStatement;
      this.discriminant = discriminant;
      this.cases = cases;
      this.finish();
      return this;
    }, finishTaggedTemplateExpression: function(tag, quasi) {
      this.type = Syntax.TaggedTemplateExpression;
      this.tag = tag;
      this.quasi = quasi;
      this.finish();
      return this;
    }, finishTemplateElement: function(value, tail) {
      this.type = Syntax.TemplateElement;
      this.value = value;
      this.tail = tail;
      this.finish();
      return this;
    }, finishTemplateLiteral: function(quasis, expressions) {
      this.type = Syntax.TemplateLiteral;
      this.quasis = quasis;
      this.expressions = expressions;
      this.finish();
      return this;
    }, finishThisExpression: function() {
      this.type = Syntax.ThisExpression;
      this.finish();
      return this;
    }, finishThrowStatement: function(argument) {
      this.type = Syntax.ThrowStatement;
      this.argument = argument;
      this.finish();
      return this;
    }, finishTryStatement: function(block, handler, finalizer) {
      this.type = Syntax.TryStatement;
      this.block = block;
      this.guardedHandlers = [];
      this.handlers = handler ? [handler] : [];
      this.handler = handler;
      this.finalizer = finalizer;
      this.finish();
      return this;
    }, finishUnaryExpression: function(operator, argument) {
      this.type = (operator==='++'||operator==='--') ? Syntax.UpdateExpression : Syntax.UnaryExpression;
      this.operator = operator;
      this.argument = argument;
      this.prefix = true;
      this.finish();
      return this;
    }, finishVariableDeclaration: function(declarations) {
      this.type = Syntax.VariableDeclaration;
      this.declarations = declarations;
      this.kind = 'var';
      this.finish();
      return this;
    }, finishLexicalDeclaration: function(declarations, kind) {
      this.type = Syntax.VariableDeclaration;
      this.declarations = declarations;
      this.kind = kind;
      this.finish();
      return this;
    }, finishVariableDeclarator: function(id, init) {
      this.type = Syntax.VariableDeclarator;
      this.id = id;
      this.init = init;
      this.finish();
      return this;
    }, finishWhileStatement: function(test, body) {
      this.type = Syntax.WhileStatement;
      this.test = test;
      this.body = body;
      this.finish();
      return this;
    }, finishWithStatement: function(object, body) {
      this.type = Syntax.WithStatement;
      this.object = object;
      this.body = body;
      this.finish();
      return this;
    }, finishExportSpecifier: function(local, exported) {
      this.type = Syntax.ExportSpecifier;
      this.exported = exported||local;
      this.local = local;
      this.finish();
      return this;
    }, finishImportDefaultSpecifier: function(local) {
      this.type = Syntax.ImportDefaultSpecifier;
      this.local = local;
      this.finish();
      return this;
    }, finishImportNamespaceSpecifier: function(local) {
      this.type = Syntax.ImportNamespaceSpecifier;
      this.local = local;
      this.finish();
      return this;
    }, finishExportNamedDeclaration: function(declaration, specifiers, src) {
      this.type = Syntax.ExportNamedDeclaration;
      this.declaration = declaration;
      this.specifiers = specifiers;
      this.source = src;
      this.finish();
      return this;
    }, finishExportDefaultDeclaration: function(declaration) {
      this.type = Syntax.ExportDefaultDeclaration;
      this.declaration = declaration;
      this.finish();
      return this;
    }, finishExportAllDeclaration: function(src) {
      this.type = Syntax.ExportAllDeclaration;
      this.source = src;
      this.finish();
      return this;
    }, finishImportSpecifier: function(local, imported) {
      this.type = Syntax.ImportSpecifier;
      this.local = local||imported;
      this.imported = imported;
      this.finish();
      return this;
    }, finishImportDeclaration: function(specifiers, src) {
      this.type = Syntax.ImportDeclaration;
      this.specifiers = specifiers;
      this.source = src;
      this.finish();
      return this;
    }, finishYieldExpression: function(argument, delegate) {
      this.type = Syntax.YieldExpression;
      this.argument = argument;
      this.delegate = delegate;
      this.finish();
      return this;
    }}
    function recordError(error) {
      var e, existing;
      for (e = 0; e<extra.errors.length; e++) {
          existing = extra.errors[e];
          if (existing.index===error.index&&existing.message===error.message) {
              return ;
          }
      }
      extra.errors.push(error);
    }
    function constructError(msg, column) {
      var error=new Error(msg);
      try {
        throw error;
      }
      catch (base) {
          if (Object.create&&Object.defineProperty) {
              error = Object.create(base);
              Object.defineProperty(error, 'column', {value: column});
          }
      }
      finally {
          return error;
        }
    }
    function createError(line, pos, description) {
      var msg, column, error;
      msg = 'Line '+line+': '+description;
      column = pos-(scanning ? lineStart : lastLineStart)+1;
      error = constructError(msg, column);
      error.lineNumber = line;
      error.description = description;
      error.index = pos;
      return error;
    }
    function throwError(messageFormat) {
      var args, msg;
      args = Array.prototype.slice.call(arguments, 1);
      msg = messageFormat.replace(/%(\d)/g, function(whole, idx) {
        assert(idx<args.length, 'Message reference must be in range');
        return args[idx];
      });
      throw createError(lastLineNumber, lastIndex, msg);
    }
    function tolerateError(messageFormat) {
      var args, msg, error;
      args = Array.prototype.slice.call(arguments, 1);
      msg = messageFormat.replace(/%(\d)/g, function(whole, idx) {
        assert(idx<args.length, 'Message reference must be in range');
        return args[idx];
      });
      error = createError(lineNumber, lastIndex, msg);
      if (extra.errors) {
          recordError(error);
      }
      else {
        throw error;
      }
    }
    function unexpectedTokenError(token, message) {
      var value, msg=message||Messages.UnexpectedToken;
      if (token) {
          if (!message) {
              msg = (token.type===Token.EOF) ? Messages.UnexpectedEOS : (token.type===Token.Identifier) ? Messages.UnexpectedIdentifier : (token.type===Token.NumericLiteral) ? Messages.UnexpectedNumber : (token.type===Token.StringLiteral) ? Messages.UnexpectedString : (token.type===Token.Template) ? Messages.UnexpectedTemplate : Messages.UnexpectedToken;
              if (token.type===Token.Keyword) {
                  if (isFutureReservedWord(token.value)) {
                      msg = Messages.UnexpectedReserved;
                  }
                  else 
                    if (strict&&isStrictModeReservedWord(token.value)) {
                      msg = Messages.StrictReservedWord;
                  }
              }
          }
          value = (token.type===Token.Template) ? token.value.raw : token.value;
      }
      else {
        value = 'ILLEGAL';
      }
      msg = msg.replace('%0', value);
      return (token&&typeof token.lineNumber==='number') ? createError(token.lineNumber, token.start, msg) : createError(scanning ? lineNumber : lastLineNumber, scanning ? index : lastIndex, msg);
    }
    function throwUnexpectedToken(token, message) {
      throw unexpectedTokenError(token, message);
    }
    function tolerateUnexpectedToken(token, message) {
      var error=unexpectedTokenError(token, message);
      if (extra.errors) {
          recordError(error);
      }
      else {
        throw error;
      }
    }
    function expect(value) {
      var token=lex();
      if (token.type!==Token.Punctuator||token.value!==value) {
          throwUnexpectedToken(token);
      }
    }
    function expectCommaSeparator() {
      var token;
      if (extra.errors) {
          token = lookahead;
          if (token.type===Token.Punctuator&&token.value===',') {
              lex();
          }
          else 
            if (token.type===Token.Punctuator&&token.value===';') {
              lex();
              tolerateUnexpectedToken(token);
          }
          else {
            tolerateUnexpectedToken(token, Messages.UnexpectedToken);
          }
      }
      else {
        expect(',');
      }
    }
    function expectKeyword(keyword) {
      var token=lex();
      if (token.type!==Token.Keyword||token.value!==keyword) {
          throwUnexpectedToken(token);
      }
    }
    function match(value) {
      return lookahead.type===Token.Punctuator&&lookahead.value===value;
    }
    function matchKeyword(keyword) {
      return lookahead.type===Token.Keyword&&lookahead.value===keyword;
    }
    function matchContextualKeyword(keyword) {
      return lookahead.type===Token.Identifier&&lookahead.value===keyword;
    }
    function matchAssign() {
      var op;
      if (lookahead.type!==Token.Punctuator) {
          return false;
      }
      op = lookahead.value;
      return op==='='||op==='*='||op==='/='||op==='%='||op==='+='||op==='-='||op==='<<='||op==='>>='||op==='>>>='||op==='&='||op==='^='||op==='|=';
    }
    function consumeSemicolon() {
      if (source.charCodeAt(startIndex)===0x3b||match(';')) {
          lex();
          return ;
      }
      if (hasLineTerminator) {
          return ;
      }
      lastIndex = startIndex;
      lastLineNumber = startLineNumber;
      lastLineStart = startLineStart;
      if (lookahead.type!==Token.EOF&&!match('}')) {
          throwUnexpectedToken(lookahead);
      }
    }
    function isolateCoverGrammar(parser) {
      var oldIsBindingElement=isBindingElement, oldIsAssignmentTarget=isAssignmentTarget, oldFirstCoverInitializedNameError=firstCoverInitializedNameError, result;
      isBindingElement = true;
      isAssignmentTarget = true;
      firstCoverInitializedNameError = null;
      result = parser();
      if (firstCoverInitializedNameError!==null) {
          throwUnexpectedToken(firstCoverInitializedNameError);
      }
      isBindingElement = oldIsBindingElement;
      isAssignmentTarget = oldIsAssignmentTarget;
      firstCoverInitializedNameError = oldFirstCoverInitializedNameError;
      return result;
    }
    function inheritCoverGrammar(parser) {
      var oldIsBindingElement=isBindingElement, oldIsAssignmentTarget=isAssignmentTarget, oldFirstCoverInitializedNameError=firstCoverInitializedNameError, result;
      isBindingElement = true;
      isAssignmentTarget = true;
      firstCoverInitializedNameError = null;
      result = parser();
      isBindingElement = isBindingElement&&oldIsBindingElement;
      isAssignmentTarget = isAssignmentTarget&&oldIsAssignmentTarget;
      firstCoverInitializedNameError = oldFirstCoverInitializedNameError||firstCoverInitializedNameError;
      return result;
    }
    function parseArrayPattern(params, kind) {
      var node=new Node(), elements=[], rest, restNode;
      expect('[');
      while (!match(']')) {
        if (match(',')) {
            lex();
            elements.push(null);
        }
        else {
          if (match('...')) {
              restNode = new Node();
              lex();
              params.push(lookahead);
              rest = parseVariableIdentifier(kind);
              elements.push(restNode.finishRestElement(rest));
              break;
          }
          else {
            elements.push(parsePatternWithDefault(params, kind));
          }
          if (!match(']')) {
              expect(',');
          }
        }
      }
      expect(']');
      return node.finishArrayPattern(elements);
    }
    function parsePropertyPattern(params, kind) {
      var node=new Node(), key, keyToken, computed=match('['), init;
      if (lookahead.type===Token.Identifier) {
          keyToken = lookahead;
          key = parseVariableIdentifier();
          if (match('=')) {
              params.push(keyToken);
              lex();
              init = parseAssignmentExpression();
              return node.finishProperty('init', key, false, new WrappingNode(keyToken).finishAssignmentPattern(key, init), false, true);
          }
          else 
            if (!match(':')) {
              params.push(keyToken);
              return node.finishProperty('init', key, false, key, false, true);
          }
      }
      else {
        key = parseObjectPropertyKey();
      }
      expect(':');
      init = parsePatternWithDefault(params, kind);
      return node.finishProperty('init', key, computed, init, false, false);
    }
    function parseObjectPattern(params, kind) {
      var node=new Node(), properties=[];
      expect('{');
      while (!match('}')) {
        properties.push(parsePropertyPattern(params, kind));
        if (!match('}')) {
            expect(',');
        }
      }
      lex();
      return node.finishObjectPattern(properties);
    }
    function parsePattern(params, kind) {
      if (match('[')) {
          return parseArrayPattern(params, kind);
      }
      else 
        if (match('{')) {
          return parseObjectPattern(params, kind);
      }
      else 
        if (matchKeyword('let')) {
          if (kind==='const'||kind==='let') {
              tolerateUnexpectedToken(lookahead, Messages.UnexpectedToken);
          }
      }
      params.push(lookahead);
      return parseVariableIdentifier(kind);
    }
    function parsePatternWithDefault(params, kind) {
      var startToken=lookahead, pattern, previousAllowYield, right;
      pattern = parsePattern(params, kind);
      if (match('=')) {
          lex();
          previousAllowYield = state.allowYield;
          state.allowYield = true;
          right = isolateCoverGrammar(parseAssignmentExpression);
          state.allowYield = previousAllowYield;
          pattern = new WrappingNode(startToken).finishAssignmentPattern(pattern, right);
      }
      return pattern;
    }
    function parseArrayInitializer() {
      var elements=[], node=new Node(), restSpread;
      expect('[');
      while (!match(']')) {
        if (match(',')) {
            lex();
            elements.push(null);
        }
        else 
          if (match('...')) {
            restSpread = new Node();
            lex();
            restSpread.finishSpreadElement(inheritCoverGrammar(parseAssignmentExpression));
            if (!match(']')) {
                isAssignmentTarget = isBindingElement = false;
                expect(',');
            }
            elements.push(restSpread);
        }
        else {
          elements.push(inheritCoverGrammar(parseAssignmentExpression));
          if (!match(']')) {
              expect(',');
          }
        }
      }
      lex();
      return node.finishArrayExpression(elements);
    }
    function parsePropertyFunction(node, paramInfo, isGenerator) {
      var previousStrict, body;
      isAssignmentTarget = isBindingElement = false;
      previousStrict = strict;
      body = isolateCoverGrammar(parseFunctionSourceElements);
      if (strict&&paramInfo.firstRestricted) {
          tolerateUnexpectedToken(paramInfo.firstRestricted, paramInfo.message);
      }
      if (strict&&paramInfo.stricted) {
          tolerateUnexpectedToken(paramInfo.stricted, paramInfo.message);
      }
      strict = previousStrict;
      return node.finishFunctionExpression(null, paramInfo.params, paramInfo.defaults, body, isGenerator);
    }
    function parsePropertyMethodFunction() {
      var params, method, node=new Node(), previousAllowYield=state.allowYield;
      state.allowYield = false;
      params = parseParams();
      state.allowYield = previousAllowYield;
      state.allowYield = false;
      method = parsePropertyFunction(node, params, false);
      state.allowYield = previousAllowYield;
      return method;
    }
    function parseObjectPropertyKey() {
      var token, node=new Node(), expr;
      token = lex();
      switch (token.type) {
        case Token.StringLiteral:
        case Token.NumericLiteral:
          if (strict&&token.octal) {
              tolerateUnexpectedToken(token, Messages.StrictOctalLiteral);
          }
          return node.finishLiteral(token);
        case Token.Identifier:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.Keyword:
          return node.finishIdentifier(token.value);
        case Token.Punctuator:
          if (token.value==='[') {
              expr = isolateCoverGrammar(parseAssignmentExpression);
              expect(']');
              return expr;
          }
          break;
      }
      throwUnexpectedToken(token);
    }
    function lookaheadPropertyName() {
      switch (lookahead.type) {
        case Token.Identifier:
        case Token.StringLiteral:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.NumericLiteral:
        case Token.Keyword:
          return true;
        case Token.Punctuator:
          return lookahead.value==='[';
      }
      return false;
    }
    function tryParseMethodDefinition(token, key, computed, node) {
      var value, options, methodNode, params, previousAllowYield=state.allowYield;
      if (token.type===Token.Identifier) {
          if (token.value==='get'&&lookaheadPropertyName()) {
              computed = match('[');
              key = parseObjectPropertyKey();
              methodNode = new Node();
              expect('(');
              expect(')');
              state.allowYield = false;
              value = parsePropertyFunction(methodNode, {params: [], defaults: [], stricted: null, firstRestricted: null, message: null}, false);
              state.allowYield = previousAllowYield;
              return node.finishProperty('get', key, computed, value, false, false);
          }
          else 
            if (token.value==='set'&&lookaheadPropertyName()) {
              computed = match('[');
              key = parseObjectPropertyKey();
              methodNode = new Node();
              expect('(');
              options = {params: [], defaultCount: 0, defaults: [], firstRestricted: null, paramSet: {}};
              if (match(')')) {
                  tolerateUnexpectedToken(lookahead);
              }
              else {
                state.allowYield = false;
                parseParam(options);
                state.allowYield = previousAllowYield;
                if (options.defaultCount===0) {
                    options.defaults = [];
                }
              }
              expect(')');
              state.allowYield = false;
              value = parsePropertyFunction(methodNode, options, false);
              state.allowYield = previousAllowYield;
              return node.finishProperty('set', key, computed, value, false, false);
          }
      }
      else 
        if (token.type===Token.Punctuator&&token.value==='*'&&lookaheadPropertyName()) {
          computed = match('[');
          key = parseObjectPropertyKey();
          methodNode = new Node();
          state.allowYield = true;
          params = parseParams();
          state.allowYield = previousAllowYield;
          state.allowYield = false;
          value = parsePropertyFunction(methodNode, params, true);
          state.allowYield = previousAllowYield;
          return node.finishProperty('init', key, computed, value, true, false);
      }
      if (key&&match('(')) {
          value = parsePropertyMethodFunction();
          return node.finishProperty('init', key, computed, value, true, false);
      }
      return null;
    }
    function parseObjectProperty(hasProto) {
      var token=lookahead, node=new Node(), computed, key, maybeMethod, proto, value;
      computed = match('[');
      if (match('*')) {
          lex();
      }
      else {
        key = parseObjectPropertyKey();
      }
      maybeMethod = tryParseMethodDefinition(token, key, computed, node);
      if (maybeMethod) {
          return maybeMethod;
      }
      if (!key) {
          throwUnexpectedToken(lookahead);
      }
      if (!computed) {
          proto = (key.type===Syntax.Identifier&&key.name==='__proto__')||(key.type===Syntax.Literal&&key.value==='__proto__');
          if (hasProto.value&&proto) {
              tolerateError(Messages.DuplicateProtoProperty);
          }
          hasProto.value|=proto;
      }
      if (match(':')) {
          lex();
          value = inheritCoverGrammar(parseAssignmentExpression);
          return node.finishProperty('init', key, computed, value, false, false);
      }
      if (token.type===Token.Identifier) {
          if (match('=')) {
              firstCoverInitializedNameError = lookahead;
              lex();
              value = isolateCoverGrammar(parseAssignmentExpression);
              return node.finishProperty('init', key, computed, new WrappingNode(token).finishAssignmentPattern(key, value), false, true);
          }
          return node.finishProperty('init', key, computed, key, false, true);
      }
      throwUnexpectedToken(lookahead);
    }
    function parseObjectInitializer() {
      var properties=[], hasProto={value: false}, node=new Node();
      expect('{');
      while (!match('}')) {
        properties.push(parseObjectProperty(hasProto));
        if (!match('}')) {
            expectCommaSeparator();
        }
      }
      expect('}');
      return node.finishObjectExpression(properties);
    }
    function reinterpretExpressionAsPattern(expr) {
      var i;
      switch (expr.type) {
        case Syntax.Identifier:
        case Syntax.MemberExpression:
        case Syntax.RestElement:
        case Syntax.AssignmentPattern:
          break;
        case Syntax.SpreadElement:
          expr.type = Syntax.RestElement;
          reinterpretExpressionAsPattern(expr.argument);
          break;
        case Syntax.ArrayExpression:
          expr.type = Syntax.ArrayPattern;
          for (i = 0; i<expr.elements.length; i++) {
              if (expr.elements[i]!==null) {
                  reinterpretExpressionAsPattern(expr.elements[i]);
              }
          }
          break;
        case Syntax.ObjectExpression:
          expr.type = Syntax.ObjectPattern;
          for (i = 0; i<expr.properties.length; i++) {
              reinterpretExpressionAsPattern(expr.properties[i].value);
          }
          break;
        case Syntax.AssignmentExpression:
          expr.type = Syntax.AssignmentPattern;
          reinterpretExpressionAsPattern(expr.left);
          break;
        default:
          break;
      }
    }
    function parseTemplateElement(option) {
      var node, token;
      if (lookahead.type!==Token.Template||(option.head&&!lookahead.head)) {
          throwUnexpectedToken();
      }
      node = new Node();
      token = lex();
      return node.finishTemplateElement({raw: token.value.raw, cooked: token.value.cooked}, token.tail);
    }
    function parseTemplateLiteral() {
      var quasi, quasis, expressions, node=new Node();
      quasi = parseTemplateElement({head: true});
      quasis = [quasi];
      expressions = [];
      while (!quasi.tail) {
        expressions.push(parseExpression());
        quasi = parseTemplateElement({head: false});
        quasis.push(quasi);
      }
      return node.finishTemplateLiteral(quasis, expressions);
    }
    function parseGroupExpression() {
      var expr, expressions, startToken, i, params=[];
      expect('(');
      if (match(')')) {
          lex();
          if (!match('=>')) {
              expect('=>');
          }
          return {type: PlaceHolders.ArrowParameterPlaceHolder, params: [], rawParams: []}
      }
      startToken = lookahead;
      if (match('...')) {
          expr = parseRestElement(params);
          expect(')');
          if (!match('=>')) {
              expect('=>');
          }
          return {type: PlaceHolders.ArrowParameterPlaceHolder, params: [expr]}
      }
      isBindingElement = true;
      expr = inheritCoverGrammar(parseAssignmentExpression);
      if (match(',')) {
          isAssignmentTarget = false;
          expressions = [expr];
          while (startIndex<length) {
            if (!match(',')) {
                break;
            }
            lex();
            if (match('...')) {
                if (!isBindingElement) {
                    throwUnexpectedToken(lookahead);
                }
                expressions.push(parseRestElement(params));
                expect(')');
                if (!match('=>')) {
                    expect('=>');
                }
                isBindingElement = false;
                for (i = 0; i<expressions.length; i++) {
                    reinterpretExpressionAsPattern(expressions[i]);
                }
                return {type: PlaceHolders.ArrowParameterPlaceHolder, params: expressions}
            }
            expressions.push(inheritCoverGrammar(parseAssignmentExpression));
          }
          expr = new WrappingNode(startToken).finishSequenceExpression(expressions);
      }
      expect(')');
      if (match('=>')) {
          if (expr.type===Syntax.Identifier&&expr.name==='yield') {
              return {type: PlaceHolders.ArrowParameterPlaceHolder, params: [expr]}
          }
          if (!isBindingElement) {
              throwUnexpectedToken(lookahead);
          }
          if (expr.type===Syntax.SequenceExpression) {
              for (i = 0; i<expr.expressions.length; i++) {
                  reinterpretExpressionAsPattern(expr.expressions[i]);
              }
          }
          else {
            reinterpretExpressionAsPattern(expr);
          }
          expr = {type: PlaceHolders.ArrowParameterPlaceHolder, params: expr.type===Syntax.SequenceExpression ? expr.expressions : [expr]};
      }
      isBindingElement = false;
      return expr;
    }
    function parsePrimaryExpression() {
      var type, token, expr, node;
      if (match('(')) {
          isBindingElement = false;
          return inheritCoverGrammar(parseGroupExpression);
      }
      if (match('[')) {
          return inheritCoverGrammar(parseArrayInitializer);
      }
      if (match('{')) {
          return inheritCoverGrammar(parseObjectInitializer);
      }
      type = lookahead.type;
      node = new Node();
      if (type===Token.Identifier) {
          if (state.sourceType==='module'&&lookahead.value==='await') {
              tolerateUnexpectedToken(lookahead);
          }
          expr = node.finishIdentifier(lex().value);
      }
      else 
        if (type===Token.StringLiteral||type===Token.NumericLiteral) {
          isAssignmentTarget = isBindingElement = false;
          if (strict&&lookahead.octal) {
              tolerateUnexpectedToken(lookahead, Messages.StrictOctalLiteral);
          }
          expr = node.finishLiteral(lex());
      }
      else 
        if (type===Token.Keyword) {
          if (!strict&&state.allowYield&&matchKeyword('yield')) {
              return parseNonComputedProperty();
          }
          if (!strict&&matchKeyword('let')) {
              return node.finishIdentifier(lex().value);
          }
          isAssignmentTarget = isBindingElement = false;
          if (matchKeyword('function')) {
              return parseFunctionExpression();
          }
          if (matchKeyword('this')) {
              lex();
              return node.finishThisExpression();
          }
          if (matchKeyword('class')) {
              return parseClassExpression();
          }
          throwUnexpectedToken(lex());
      }
      else 
        if (type===Token.BooleanLiteral) {
          isAssignmentTarget = isBindingElement = false;
          token = lex();
          token.value = (token.value==='true');
          expr = node.finishLiteral(token);
      }
      else 
        if (type===Token.NullLiteral) {
          isAssignmentTarget = isBindingElement = false;
          token = lex();
          token.value = null;
          expr = node.finishLiteral(token);
      }
      else 
        if (match('/')||match('/=')) {
          isAssignmentTarget = isBindingElement = false;
          index = startIndex;
          if (typeof extra.tokens!=='undefined') {
              token = collectRegex();
          }
          else {
            token = scanRegExp();
          }
          lex();
          expr = node.finishLiteral(token);
      }
      else 
        if (type===Token.Template) {
          expr = parseTemplateLiteral();
      }
      else {
        throwUnexpectedToken(lex());
      }
      return expr;
    }
    function parseArguments() {
      var args=[], expr;
      expect('(');
      if (!match(')')) {
          while (startIndex<length) {
            if (match('...')) {
                expr = new Node();
                lex();
                expr.finishSpreadElement(isolateCoverGrammar(parseAssignmentExpression));
            }
            else {
              expr = isolateCoverGrammar(parseAssignmentExpression);
            }
            args.push(expr);
            if (match(')')) {
                break;
            }
            expectCommaSeparator();
          }
      }
      expect(')');
      return args;
    }
    function parseNonComputedProperty() {
      var token, node=new Node();
      token = lex();
      if (!isIdentifierName(token)) {
          throwUnexpectedToken(token);
      }
      return node.finishIdentifier(token.value);
    }
    function parseNonComputedMember() {
      expect('.');
      return parseNonComputedProperty();
    }
    function parseComputedMember() {
      var expr;
      expect('[');
      expr = isolateCoverGrammar(parseExpression);
      expect(']');
      return expr;
    }
    function parseNewExpression() {
      var callee, args, node=new Node();
      expectKeyword('new');
      if (match('.')) {
          lex();
          if (lookahead.type===Token.Identifier&&lookahead.value==='target') {
              if (state.inFunctionBody) {
                  lex();
                  return node.finishMetaProperty('new', 'target');
              }
          }
          throwUnexpectedToken(lookahead);
      }
      callee = isolateCoverGrammar(parseLeftHandSideExpression);
      args = match('(') ? parseArguments() : [];
      isAssignmentTarget = isBindingElement = false;
      return node.finishNewExpression(callee, args);
    }
    function parseLeftHandSideExpressionAllowCall() {
      var quasi, expr, args, property, startToken, previousAllowIn=state.allowIn;
      startToken = lookahead;
      state.allowIn = true;
      if (matchKeyword('super')&&state.inFunctionBody) {
          expr = new Node();
          lex();
          expr = expr.finishSuper();
          if (!match('(')&&!match('.')&&!match('[')) {
              throwUnexpectedToken(lookahead);
          }
      }
      else {
        expr = inheritCoverGrammar(matchKeyword('new') ? parseNewExpression : parsePrimaryExpression);
      }
      for (; ; ) {
          if (match('.')) {
              isBindingElement = false;
              isAssignmentTarget = true;
              property = parseNonComputedMember();
              expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
          }
          else 
            if (match('(')) {
              isBindingElement = false;
              isAssignmentTarget = false;
              args = parseArguments();
              expr = new WrappingNode(startToken).finishCallExpression(expr, args);
          }
          else 
            if (match('[')) {
              isBindingElement = false;
              isAssignmentTarget = true;
              property = parseComputedMember();
              expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
          }
          else 
            if (lookahead.type===Token.Template&&lookahead.head) {
              quasi = parseTemplateLiteral();
              expr = new WrappingNode(startToken).finishTaggedTemplateExpression(expr, quasi);
          }
          else {
            break;
          }
      }
      state.allowIn = previousAllowIn;
      return expr;
    }
    function parseLeftHandSideExpression() {
      var quasi, expr, property, startToken;
      assert(state.allowIn, 'callee of new expression always allow in keyword.');
      startToken = lookahead;
      if (matchKeyword('super')&&state.inFunctionBody) {
          expr = new Node();
          lex();
          expr = expr.finishSuper();
          if (!match('[')&&!match('.')) {
              throwUnexpectedToken(lookahead);
          }
      }
      else {
        expr = inheritCoverGrammar(matchKeyword('new') ? parseNewExpression : parsePrimaryExpression);
      }
      for (; ; ) {
          if (match('[')) {
              isBindingElement = false;
              isAssignmentTarget = true;
              property = parseComputedMember();
              expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
          }
          else 
            if (match('.')) {
              isBindingElement = false;
              isAssignmentTarget = true;
              property = parseNonComputedMember();
              expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
          }
          else 
            if (lookahead.type===Token.Template&&lookahead.head) {
              quasi = parseTemplateLiteral();
              expr = new WrappingNode(startToken).finishTaggedTemplateExpression(expr, quasi);
          }
          else {
            break;
          }
      }
      return expr;
    }
    function parsePostfixExpression() {
      var expr, token, startToken=lookahead;
      expr = inheritCoverGrammar(parseLeftHandSideExpressionAllowCall);
      if (!hasLineTerminator&&lookahead.type===Token.Punctuator) {
          if (match('++')||match('--')) {
              if (strict&&expr.type===Syntax.Identifier&&isRestrictedWord(expr.name)) {
                  tolerateError(Messages.StrictLHSPostfix);
              }
              if (!isAssignmentTarget) {
                  tolerateError(Messages.InvalidLHSInAssignment);
              }
              isAssignmentTarget = isBindingElement = false;
              token = lex();
              expr = new WrappingNode(startToken).finishPostfixExpression(token.value, expr);
          }
      }
      return expr;
    }
    function parseUnaryExpression() {
      var token, expr, startToken;
      if (lookahead.type!==Token.Punctuator&&lookahead.type!==Token.Keyword) {
          expr = parsePostfixExpression();
      }
      else 
        if (match('++')||match('--')) {
          startToken = lookahead;
          token = lex();
          expr = inheritCoverGrammar(parseUnaryExpression);
          if (strict&&expr.type===Syntax.Identifier&&isRestrictedWord(expr.name)) {
              tolerateError(Messages.StrictLHSPrefix);
          }
          if (!isAssignmentTarget) {
              tolerateError(Messages.InvalidLHSInAssignment);
          }
          expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
          isAssignmentTarget = isBindingElement = false;
      }
      else 
        if (match('+')||match('-')||match('~')||match('!')) {
          startToken = lookahead;
          token = lex();
          expr = inheritCoverGrammar(parseUnaryExpression);
          expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
          isAssignmentTarget = isBindingElement = false;
      }
      else 
        if (matchKeyword('delete')||matchKeyword('void')||matchKeyword('typeof')) {
          startToken = lookahead;
          token = lex();
          expr = inheritCoverGrammar(parseUnaryExpression);
          expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
          if (strict&&expr.operator==='delete'&&expr.argument.type===Syntax.Identifier) {
              tolerateError(Messages.StrictDelete);
          }
          isAssignmentTarget = isBindingElement = false;
      }
      else {
        expr = parsePostfixExpression();
      }
      return expr;
    }
    function binaryPrecedence(token, allowIn) {
      var prec=0;
      if (token.type!==Token.Punctuator&&token.type!==Token.Keyword) {
          return 0;
      }
      switch (token.value) {
        case '||':
          prec = 1;
          break;
        case '&&':
          prec = 2;
          break;
        case '|':
          prec = 3;
          break;
        case '^':
          prec = 4;
          break;
        case '&':
          prec = 5;
          break;
        case '==':
        case '!=':
        case '===':
        case '!==':
          prec = 6;
          break;
        case '<':
        case '>':
        case '<=':
        case '>=':
        case 'instanceof':
          prec = 7;
          break;
        case 'in':
          prec = allowIn ? 7 : 0;
          break;
        case '<<':
        case '>>':
        case '>>>':
          prec = 8;
          break;
        case '+':
        case '-':
          prec = 9;
          break;
        case '*':
        case '/':
        case '%':
          prec = 11;
          break;
        default:
          break;
      }
      return prec;
    }
    function parseBinaryExpression() {
      var marker, markers, expr, token, prec, stack, right, operator, left, i;
      marker = lookahead;
      left = inheritCoverGrammar(parseUnaryExpression);
      token = lookahead;
      prec = binaryPrecedence(token, state.allowIn);
      if (prec===0) {
          return left;
      }
      isAssignmentTarget = isBindingElement = false;
      token.prec = prec;
      lex();
      markers = [marker, lookahead];
      right = isolateCoverGrammar(parseUnaryExpression);
      stack = [left, token, right];
      while ((prec = binaryPrecedence(lookahead, state.allowIn))>0) {
        while ((stack.length>2)&&(prec<=stack[stack.length-2].prec)) {
          right = stack.pop();
          operator = stack.pop().value;
          left = stack.pop();
          markers.pop();
          expr = new WrappingNode(markers[markers.length-1]).finishBinaryExpression(operator, left, right);
          stack.push(expr);
        }
        token = lex();
        token.prec = prec;
        stack.push(token);
        markers.push(lookahead);
        expr = isolateCoverGrammar(parseUnaryExpression);
        stack.push(expr);
      }
      i = stack.length-1;
      expr = stack[i];
      markers.pop();
      while (i>1) {
        expr = new WrappingNode(markers.pop()).finishBinaryExpression(stack[i-1].value, stack[i-2], expr);
        i-=2;
      }
      return expr;
    }
    function parseConditionalExpression() {
      var expr, previousAllowIn, consequent, alternate, startToken;
      startToken = lookahead;
      expr = inheritCoverGrammar(parseBinaryExpression);
      if (match('?')) {
          lex();
          previousAllowIn = state.allowIn;
          state.allowIn = true;
          consequent = isolateCoverGrammar(parseAssignmentExpression);
          state.allowIn = previousAllowIn;
          expect(':');
          alternate = isolateCoverGrammar(parseAssignmentExpression);
          expr = new WrappingNode(startToken).finishConditionalExpression(expr, consequent, alternate);
          isAssignmentTarget = isBindingElement = false;
      }
      return expr;
    }
    function parseConciseBody() {
      if (match('{')) {
          return parseFunctionSourceElements();
      }
      return isolateCoverGrammar(parseAssignmentExpression);
    }
    function checkPatternParam(options, param) {
      var i;
      switch (param.type) {
        case Syntax.Identifier:
          validateParam(options, param, param.name);
          break;
        case Syntax.RestElement:
          checkPatternParam(options, param.argument);
          break;
        case Syntax.AssignmentPattern:
          checkPatternParam(options, param.left);
          break;
        case Syntax.ArrayPattern:
          for (i = 0; i<param.elements.length; i++) {
              if (param.elements[i]!==null) {
                  checkPatternParam(options, param.elements[i]);
              }
          }
          break;
        case Syntax.YieldExpression:
          break;
        default:
          assert(param.type===Syntax.ObjectPattern, 'Invalid type');
          for (i = 0; i<param.properties.length; i++) {
              checkPatternParam(options, param.properties[i].value);
          }
          break;
      }
    }
    function reinterpretAsCoverFormalsList(expr) {
      var i, len, param, params, defaults, defaultCount, options, token;
      defaults = [];
      defaultCount = 0;
      params = [expr];
      switch (expr.type) {
        case Syntax.Identifier:
          break;
        case PlaceHolders.ArrowParameterPlaceHolder:
          params = expr.params;
          break;
        default:
          return null;
      }
      options = {paramSet: {}}
      for (i = 0, len = params.length; i<len; i+=1) {
          param = params[i];
          switch (param.type) {
            case Syntax.AssignmentPattern:
              params[i] = param.left;
              if (param.right.type===Syntax.YieldExpression) {
                  if (param.right.argument) {
                      throwUnexpectedToken(lookahead);
                  }
                  param.right.type = Syntax.Identifier;
                  param.right.name = 'yield';
                  delete param.right.argument;
                  delete param.right.delegate;
              }
              defaults.push(param.right);
              ++defaultCount;
              checkPatternParam(options, param.left);
              break;
            default:
              checkPatternParam(options, param);
              params[i] = param;
              defaults.push(null);
              break;
          }
      }
      if (strict||!state.allowYield) {
          for (i = 0, len = params.length; i<len; i+=1) {
              param = params[i];
              if (param.type===Syntax.YieldExpression) {
                  throwUnexpectedToken(lookahead);
              }
          }
      }
      if (options.message===Messages.StrictParamDupe) {
          token = strict ? options.stricted : options.firstRestricted;
          throwUnexpectedToken(token, options.message);
      }
      if (defaultCount===0) {
          defaults = [];
      }
      return {params: params, defaults: defaults, stricted: options.stricted, firstRestricted: options.firstRestricted, message: options.message}
    }
    function parseArrowFunctionExpression(options, node) {
      var previousStrict, previousAllowYield, body;
      if (hasLineTerminator) {
          tolerateUnexpectedToken(lookahead);
      }
      expect('=>');
      previousStrict = strict;
      previousAllowYield = state.allowYield;
      state.allowYield = true;
      body = parseConciseBody();
      if (strict&&options.firstRestricted) {
          throwUnexpectedToken(options.firstRestricted, options.message);
      }
      if (strict&&options.stricted) {
          tolerateUnexpectedToken(options.stricted, options.message);
      }
      strict = previousStrict;
      state.allowYield = previousAllowYield;
      return node.finishArrowFunctionExpression(options.params, options.defaults, body, body.type!==Syntax.BlockStatement);
    }
    function parseYieldExpression() {
      var argument, expr, delegate, previousAllowYield;
      argument = null;
      expr = new Node();
      delegate = false;
      expectKeyword('yield');
      if (!hasLineTerminator) {
          previousAllowYield = state.allowYield;
          state.allowYield = false;
          delegate = match('*');
          if (delegate) {
              lex();
              argument = parseAssignmentExpression();
          }
          else {
            if (!match(';')&&!match('}')&&!match(')')&&lookahead.type!==Token.EOF) {
                argument = parseAssignmentExpression();
            }
          }
          state.allowYield = previousAllowYield;
      }
      return expr.finishYieldExpression(argument, delegate);
    }
    function parseAssignmentExpression() {
      var token, expr, right, list, startToken;
      startToken = lookahead;
      token = lookahead;
      if (!state.allowYield&&matchKeyword('yield')) {
          return parseYieldExpression();
      }
      expr = parseConditionalExpression();
      if (expr.type===PlaceHolders.ArrowParameterPlaceHolder||match('=>')) {
          isAssignmentTarget = isBindingElement = false;
          list = reinterpretAsCoverFormalsList(expr);
          if (list) {
              firstCoverInitializedNameError = null;
              return parseArrowFunctionExpression(list, new WrappingNode(startToken));
          }
          return expr;
      }
      if (matchAssign()) {
          if (!isAssignmentTarget) {
              tolerateError(Messages.InvalidLHSInAssignment);
          }
          if (strict&&expr.type===Syntax.Identifier) {
              if (isRestrictedWord(expr.name)) {
                  tolerateUnexpectedToken(token, Messages.StrictLHSAssignment);
              }
              if (isStrictModeReservedWord(expr.name)) {
                  tolerateUnexpectedToken(token, Messages.StrictReservedWord);
              }
          }
          if (!match('=')) {
              isAssignmentTarget = isBindingElement = false;
          }
          else {
            reinterpretExpressionAsPattern(expr);
          }
          token = lex();
          right = isolateCoverGrammar(parseAssignmentExpression);
          expr = new WrappingNode(startToken).finishAssignmentExpression(token.value, expr, right);
          firstCoverInitializedNameError = null;
      }
      return expr;
    }
    function parseExpression() {
      var expr, startToken=lookahead, expressions;
      expr = isolateCoverGrammar(parseAssignmentExpression);
      if (match(',')) {
          expressions = [expr];
          while (startIndex<length) {
            if (!match(',')) {
                break;
            }
            lex();
            expressions.push(isolateCoverGrammar(parseAssignmentExpression));
          }
          expr = new WrappingNode(startToken).finishSequenceExpression(expressions);
      }
      return expr;
    }
    function parseStatementListItem() {
      if (lookahead.type===Token.Keyword) {
          switch (lookahead.value) {
            case 'export':
              if (state.sourceType!=='module') {
                  tolerateUnexpectedToken(lookahead, Messages.IllegalExportDeclaration);
              }
              return parseExportDeclaration();
            case 'import':
              if (state.sourceType!=='module') {
                  tolerateUnexpectedToken(lookahead, Messages.IllegalImportDeclaration);
              }
              return parseImportDeclaration();
            case 'const':
              return parseLexicalDeclaration({inFor: false});
            case 'function':
              return parseFunctionDeclaration(new Node());
            case 'class':
              return parseClassDeclaration();
          }
      }
      if (matchKeyword('let')&&isLexicalDeclaration()) {
          return parseLexicalDeclaration({inFor: false});
      }
      return parseStatement();
    }
    function parseStatementList() {
      var list=[];
      while (startIndex<length) {
        if (match('}')) {
            break;
        }
        list.push(parseStatementListItem());
      }
      return list;
    }
    function parseBlock() {
      var block, node=new Node();
      expect('{');
      block = parseStatementList();
      expect('}');
      return node.finishBlockStatement(block);
    }
    function parseVariableIdentifier(kind) {
      var token, node=new Node();
      token = lex();
      if (token.type===Token.Keyword&&token.value==='yield') {
          if (strict) {
              tolerateUnexpectedToken(token, Messages.StrictReservedWord);
          }
          if (!state.allowYield) {
              throwUnexpectedToken(token);
          }
      }
      else 
        if (token.type!==Token.Identifier) {
          if (strict&&token.type===Token.Keyword&&isStrictModeReservedWord(token.value)) {
              tolerateUnexpectedToken(token, Messages.StrictReservedWord);
          }
          else {
            if (strict||token.value!=='let'||kind!=='var') {
                throwUnexpectedToken(token);
            }
          }
      }
      else 
        if (state.sourceType==='module'&&token.type===Token.Identifier&&token.value==='await') {
          tolerateUnexpectedToken(token);
      }
      return node.finishIdentifier(token.value);
    }
    function parseVariableDeclaration(options) {
      var init=null, id, node=new Node(), params=[];
      id = parsePattern(params, 'var');
      if (strict&&isRestrictedWord(id.name)) {
          tolerateError(Messages.StrictVarName);
      }
      if (match('=')) {
          lex();
          init = isolateCoverGrammar(parseAssignmentExpression);
      }
      else 
        if (id.type!==Syntax.Identifier&&!options.inFor) {
          expect('=');
      }
      return node.finishVariableDeclarator(id, init);
    }
    function parseVariableDeclarationList(options) {
      var opt, list;
      opt = {inFor: options.inFor}
      list = [parseVariableDeclaration(opt)];
      while (match(',')) {
        lex();
        list.push(parseVariableDeclaration(opt));
      }
      return list;
    }
    function parseVariableStatement(node) {
      var declarations;
      expectKeyword('var');
      declarations = parseVariableDeclarationList({inFor: false});
      consumeSemicolon();
      return node.finishVariableDeclaration(declarations);
    }
    function parseLexicalBinding(kind, options) {
      var init=null, id, node=new Node(), params=[];
      id = parsePattern(params, kind);
      if (strict&&id.type===Syntax.Identifier&&isRestrictedWord(id.name)) {
          tolerateError(Messages.StrictVarName);
      }
      if (kind==='const') {
          if (!matchKeyword('in')&&!matchContextualKeyword('of')) {
              expect('=');
              init = isolateCoverGrammar(parseAssignmentExpression);
          }
      }
      else 
        if ((!options.inFor&&id.type!==Syntax.Identifier)||match('=')) {
          expect('=');
          init = isolateCoverGrammar(parseAssignmentExpression);
      }
      return node.finishVariableDeclarator(id, init);
    }
    function parseBindingList(kind, options) {
      var list=[parseLexicalBinding(kind, options)];
      while (match(',')) {
        lex();
        list.push(parseLexicalBinding(kind, options));
      }
      return list;
    }
    function tokenizerState() {
      return {index: index, lineNumber: lineNumber, lineStart: lineStart, hasLineTerminator: hasLineTerminator, lastIndex: lastIndex, lastLineNumber: lastLineNumber, lastLineStart: lastLineStart, startIndex: startIndex, startLineNumber: startLineNumber, startLineStart: startLineStart, lookahead: lookahead, tokenCount: extra.tokens ? extra.tokens.length : 0}
    }
    function resetTokenizerState(ts) {
      index = ts.index;
      lineNumber = ts.lineNumber;
      lineStart = ts.lineStart;
      hasLineTerminator = ts.hasLineTerminator;
      lastIndex = ts.lastIndex;
      lastLineNumber = ts.lastLineNumber;
      lastLineStart = ts.lastLineStart;
      startIndex = ts.startIndex;
      startLineNumber = ts.startLineNumber;
      startLineStart = ts.startLineStart;
      lookahead = ts.lookahead;
      if (extra.tokens) {
          extra.tokens.splice(ts.tokenCount, extra.tokens.length);
      }
    }
    function isLexicalDeclaration() {
      var lexical, ts;
      ts = tokenizerState();
      lex();
      lexical = (lookahead.type===Token.Identifier)||match('[')||match('{')||matchKeyword('let')||matchKeyword('yield');
      resetTokenizerState(ts);
      return lexical;
    }
    function parseLexicalDeclaration(options) {
      var kind, declarations, node=new Node();
      kind = lex().value;
      assert(kind==='let'||kind==='const', 'Lexical declaration must be either let or const');
      declarations = parseBindingList(kind, options);
      consumeSemicolon();
      return node.finishLexicalDeclaration(declarations, kind);
    }
    function parseRestElement(params) {
      var param, node=new Node();
      lex();
      if (match('{')) {
          throwError(Messages.ObjectPatternAsRestParameter);
      }
      params.push(lookahead);
      param = parseVariableIdentifier();
      if (match('=')) {
          throwError(Messages.DefaultRestParameter);
      }
      if (!match(')')) {
          throwError(Messages.ParameterAfterRestParameter);
      }
      return node.finishRestElement(param);
    }
    function parseEmptyStatement(node) {
      expect(';');
      return node.finishEmptyStatement();
    }
    function parseExpressionStatement(node) {
      var expr=parseExpression();
      consumeSemicolon();
      return node.finishExpressionStatement(expr);
    }
    function parseIfStatement(node) {
      var test, consequent, alternate;
      expectKeyword('if');
      expect('(');
      test = parseExpression();
      expect(')');
      consequent = parseStatement();
      if (matchKeyword('else')) {
          lex();
          alternate = parseStatement();
      }
      else {
        alternate = null;
      }
      return node.finishIfStatement(test, consequent, alternate);
    }
    function parseDoWhileStatement(node) {
      var body, test, oldInIteration;
      expectKeyword('do');
      oldInIteration = state.inIteration;
      state.inIteration = true;
      body = parseStatement();
      state.inIteration = oldInIteration;
      expectKeyword('while');
      expect('(');
      test = parseExpression();
      expect(')');
      if (match(';')) {
          lex();
      }
      return node.finishDoWhileStatement(body, test);
    }
    function parseWhileStatement(node) {
      var test, body, oldInIteration;
      expectKeyword('while');
      expect('(');
      test = parseExpression();
      expect(')');
      oldInIteration = state.inIteration;
      state.inIteration = true;
      body = parseStatement();
      state.inIteration = oldInIteration;
      return node.finishWhileStatement(test, body);
    }
    function parseForStatement(node) {
      var init, forIn, initSeq, initStartToken, test, update, left, right, kind, declarations, body, oldInIteration, previousAllowIn=state.allowIn;
      init = test = update = null;
      forIn = true;
      expectKeyword('for');
      expect('(');
      if (match(';')) {
          lex();
      }
      else {
        if (matchKeyword('var')) {
            init = new Node();
            lex();
            state.allowIn = false;
            declarations = parseVariableDeclarationList({inFor: true});
            state.allowIn = previousAllowIn;
            if (declarations.length===1&&matchKeyword('in')) {
                init = init.finishVariableDeclaration(declarations);
                lex();
                left = init;
                right = parseExpression();
                init = null;
            }
            else 
              if (declarations.length===1&&declarations[0].init===null&&matchContextualKeyword('of')) {
                init = init.finishVariableDeclaration(declarations);
                lex();
                left = init;
                right = parseAssignmentExpression();
                init = null;
                forIn = false;
            }
            else {
              init = init.finishVariableDeclaration(declarations);
              expect(';');
            }
        }
        else 
          if (matchKeyword('const')||matchKeyword('let')) {
            init = new Node();
            kind = lex().value;
            if (!strict&&lookahead.value==='in') {
                init = init.finishIdentifier(kind);
                lex();
                left = init;
                right = parseExpression();
                init = null;
            }
            else {
              state.allowIn = false;
              declarations = parseBindingList(kind, {inFor: true});
              state.allowIn = previousAllowIn;
              if (declarations.length===1&&declarations[0].init===null&&matchKeyword('in')) {
                  init = init.finishLexicalDeclaration(declarations, kind);
                  lex();
                  left = init;
                  right = parseExpression();
                  init = null;
              }
              else 
                if (declarations.length===1&&declarations[0].init===null&&matchContextualKeyword('of')) {
                  init = init.finishLexicalDeclaration(declarations, kind);
                  lex();
                  left = init;
                  right = parseAssignmentExpression();
                  init = null;
                  forIn = false;
              }
              else {
                consumeSemicolon();
                init = init.finishLexicalDeclaration(declarations, kind);
              }
            }
        }
        else {
          initStartToken = lookahead;
          state.allowIn = false;
          init = inheritCoverGrammar(parseAssignmentExpression);
          state.allowIn = previousAllowIn;
          if (matchKeyword('in')) {
              if (!isAssignmentTarget) {
                  tolerateError(Messages.InvalidLHSInForIn);
              }
              lex();
              reinterpretExpressionAsPattern(init);
              left = init;
              right = parseExpression();
              init = null;
          }
          else 
            if (matchContextualKeyword('of')) {
              if (!isAssignmentTarget) {
                  tolerateError(Messages.InvalidLHSInForLoop);
              }
              lex();
              reinterpretExpressionAsPattern(init);
              left = init;
              right = parseAssignmentExpression();
              init = null;
              forIn = false;
          }
          else {
            if (match(',')) {
                initSeq = [init];
                while (match(',')) {
                  lex();
                  initSeq.push(isolateCoverGrammar(parseAssignmentExpression));
                }
                init = new WrappingNode(initStartToken).finishSequenceExpression(initSeq);
            }
            expect(';');
          }
        }
      }
      if (typeof left==='undefined') {
          if (!match(';')) {
              test = parseExpression();
          }
          expect(';');
          if (!match(')')) {
              update = parseExpression();
          }
      }
      expect(')');
      oldInIteration = state.inIteration;
      state.inIteration = true;
      body = isolateCoverGrammar(parseStatement);
      state.inIteration = oldInIteration;
      return (typeof left==='undefined') ? node.finishForStatement(init, test, update, body) : forIn ? node.finishForInStatement(left, right, body) : node.finishForOfStatement(left, right, body);
    }
    function parseContinueStatement(node) {
      var label=null, key;
      expectKeyword('continue');
      if (source.charCodeAt(startIndex)===0x3b) {
          lex();
          if (!state.inIteration) {
              throwError(Messages.IllegalContinue);
          }
          return node.finishContinueStatement(null);
      }
      if (hasLineTerminator) {
          if (!state.inIteration) {
              throwError(Messages.IllegalContinue);
          }
          return node.finishContinueStatement(null);
      }
      if (lookahead.type===Token.Identifier) {
          label = parseVariableIdentifier();
          key = '$'+label.name;
          if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
              throwError(Messages.UnknownLabel, label.name);
          }
      }
      consumeSemicolon();
      if (label===null&&!state.inIteration) {
          throwError(Messages.IllegalContinue);
      }
      return node.finishContinueStatement(label);
    }
    function parseBreakStatement(node) {
      var label=null, key;
      expectKeyword('break');
      if (source.charCodeAt(lastIndex)===0x3b) {
          lex();
          if (!(state.inIteration||state.inSwitch)) {
              throwError(Messages.IllegalBreak);
          }
          return node.finishBreakStatement(null);
      }
      if (hasLineTerminator) {
          if (!(state.inIteration||state.inSwitch)) {
              throwError(Messages.IllegalBreak);
          }
      }
      else 
        if (lookahead.type===Token.Identifier) {
          label = parseVariableIdentifier();
          key = '$'+label.name;
          if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
              throwError(Messages.UnknownLabel, label.name);
          }
      }
      consumeSemicolon();
      if (label===null&&!(state.inIteration||state.inSwitch)) {
          throwError(Messages.IllegalBreak);
      }
      return node.finishBreakStatement(label);
    }
    function parseReturnStatement(node) {
      var argument=null;
      expectKeyword('return');
      if (!state.inFunctionBody) {
          tolerateError(Messages.IllegalReturn);
      }
      if (source.charCodeAt(lastIndex)===0x20) {
          if (isIdentifierStart(source.charCodeAt(lastIndex+1))) {
              argument = parseExpression();
              consumeSemicolon();
              return node.finishReturnStatement(argument);
          }
      }
      if (hasLineTerminator) {
          return node.finishReturnStatement(null);
      }
      if (!match(';')) {
          if (!match('}')&&lookahead.type!==Token.EOF) {
              argument = parseExpression();
          }
      }
      consumeSemicolon();
      return node.finishReturnStatement(argument);
    }
    function parseWithStatement(node) {
      var object, body;
      if (strict) {
          tolerateError(Messages.StrictModeWith);
      }
      expectKeyword('with');
      expect('(');
      object = parseExpression();
      expect(')');
      body = parseStatement();
      return node.finishWithStatement(object, body);
    }
    function parseSwitchCase() {
      var test, consequent=[], statement, node=new Node();
      if (matchKeyword('default')) {
          lex();
          test = null;
      }
      else {
        expectKeyword('case');
        test = parseExpression();
      }
      expect(':');
      while (startIndex<length) {
        if (match('}')||matchKeyword('default')||matchKeyword('case')) {
            break;
        }
        statement = parseStatementListItem();
        consequent.push(statement);
      }
      return node.finishSwitchCase(test, consequent);
    }
    function parseSwitchStatement(node) {
      var discriminant, cases, clause, oldInSwitch, defaultFound;
      expectKeyword('switch');
      expect('(');
      discriminant = parseExpression();
      expect(')');
      expect('{');
      cases = [];
      if (match('}')) {
          lex();
          return node.finishSwitchStatement(discriminant, cases);
      }
      oldInSwitch = state.inSwitch;
      state.inSwitch = true;
      defaultFound = false;
      while (startIndex<length) {
        if (match('}')) {
            break;
        }
        clause = parseSwitchCase();
        if (clause.test===null) {
            if (defaultFound) {
                throwError(Messages.MultipleDefaultsInSwitch);
            }
            defaultFound = true;
        }
        cases.push(clause);
      }
      state.inSwitch = oldInSwitch;
      expect('}');
      return node.finishSwitchStatement(discriminant, cases);
    }
    function parseThrowStatement(node) {
      var argument;
      expectKeyword('throw');
      if (hasLineTerminator) {
          throwError(Messages.NewlineAfterThrow);
      }
      argument = parseExpression();
      consumeSemicolon();
      return node.finishThrowStatement(argument);
    }
    function parseCatchClause() {
      var param, params=[], paramMap={}, key, i, body, node=new Node();
      expectKeyword('catch');
      expect('(');
      if (match(')')) {
          throwUnexpectedToken(lookahead);
      }
      param = parsePattern(params);
      for (i = 0; i<params.length; i++) {
          key = '$'+params[i].value;
          if (Object.prototype.hasOwnProperty.call(paramMap, key)) {
              tolerateError(Messages.DuplicateBinding, params[i].value);
          }
          paramMap[key] = true;
      }
      if (strict&&isRestrictedWord(param.name)) {
          tolerateError(Messages.StrictCatchVariable);
      }
      expect(')');
      body = parseBlock();
      return node.finishCatchClause(param, body);
    }
    function parseTryStatement(node) {
      var block, handler=null, finalizer=null;
      expectKeyword('try');
      block = parseBlock();
      if (matchKeyword('catch')) {
          handler = parseCatchClause();
      }
      if (matchKeyword('finally')) {
          lex();
          finalizer = parseBlock();
      }
      if (!handler&&!finalizer) {
          throwError(Messages.NoCatchOrFinally);
      }
      return node.finishTryStatement(block, handler, finalizer);
    }
    function parseDebuggerStatement(node) {
      expectKeyword('debugger');
      consumeSemicolon();
      return node.finishDebuggerStatement();
    }
    function parseStatement() {
      var type=lookahead.type, expr, labeledBody, key, node;
      if (type===Token.EOF) {
          throwUnexpectedToken(lookahead);
      }
      if (type===Token.Punctuator&&lookahead.value==='{') {
          return parseBlock();
      }
      isAssignmentTarget = isBindingElement = true;
      node = new Node();
      if (type===Token.Punctuator) {
          switch (lookahead.value) {
            case ';':
              return parseEmptyStatement(node);
            case '(':
              return parseExpressionStatement(node);
            default:
              break;
          }
      }
      else 
        if (type===Token.Keyword) {
          switch (lookahead.value) {
            case 'break':
              return parseBreakStatement(node);
            case 'continue':
              return parseContinueStatement(node);
            case 'debugger':
              return parseDebuggerStatement(node);
            case 'do':
              return parseDoWhileStatement(node);
            case 'for':
              return parseForStatement(node);
            case 'function':
              return parseFunctionDeclaration(node);
            case 'if':
              return parseIfStatement(node);
            case 'return':
              return parseReturnStatement(node);
            case 'switch':
              return parseSwitchStatement(node);
            case 'throw':
              return parseThrowStatement(node);
            case 'try':
              return parseTryStatement(node);
            case 'var':
              return parseVariableStatement(node);
            case 'while':
              return parseWhileStatement(node);
            case 'with':
              return parseWithStatement(node);
            default:
              break;
          }
      }
      expr = parseExpression();
      if ((expr.type===Syntax.Identifier)&&match(':')) {
          lex();
          key = '$'+expr.name;
          if (Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
              throwError(Messages.Redeclaration, 'Label', expr.name);
          }
          state.labelSet[key] = true;
          labeledBody = parseStatement();
          delete state.labelSet[key];
          return node.finishLabeledStatement(expr, labeledBody);
      }
      consumeSemicolon();
      return node.finishExpressionStatement(expr);
    }
    function parseFunctionSourceElements() {
      var statement, body=[], token, directive, firstRestricted, oldLabelSet, oldInIteration, oldInSwitch, oldInFunctionBody, node=new Node();
      expect('{');
      while (startIndex<length) {
        if (lookahead.type!==Token.StringLiteral) {
            break;
        }
        token = lookahead;
        statement = parseStatementListItem();
        body.push(statement);
        if (statement.expression.type!==Syntax.Literal) {
            break;
        }
        directive = source.slice(token.start+1, token.end-1);
        if (directive==='use strict') {
            strict = true;
            if (firstRestricted) {
                tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
            }
        }
        else {
          if (!firstRestricted&&token.octal) {
              firstRestricted = token;
          }
        }
      }
      oldLabelSet = state.labelSet;
      oldInIteration = state.inIteration;
      oldInSwitch = state.inSwitch;
      oldInFunctionBody = state.inFunctionBody;
      state.labelSet = {}
      state.inIteration = false;
      state.inSwitch = false;
      state.inFunctionBody = true;
      while (startIndex<length) {
        if (match('}')) {
            break;
        }
        body.push(parseStatementListItem());
      }
      expect('}');
      state.labelSet = oldLabelSet;
      state.inIteration = oldInIteration;
      state.inSwitch = oldInSwitch;
      state.inFunctionBody = oldInFunctionBody;
      return node.finishBlockStatement(body);
    }
    function validateParam(options, param, name) {
      var key='$'+name;
      if (strict) {
          if (isRestrictedWord(name)) {
              options.stricted = param;
              options.message = Messages.StrictParamName;
          }
          if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
              options.stricted = param;
              options.message = Messages.StrictParamDupe;
          }
      }
      else 
        if (!options.firstRestricted) {
          if (isRestrictedWord(name)) {
              options.firstRestricted = param;
              options.message = Messages.StrictParamName;
          }
          else 
            if (isStrictModeReservedWord(name)) {
              options.firstRestricted = param;
              options.message = Messages.StrictReservedWord;
          }
          else 
            if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
              options.stricted = param;
              options.message = Messages.StrictParamDupe;
          }
      }
      options.paramSet[key] = true;
    }
    function parseParam(options) {
      var token, param, params=[], i, def;
      token = lookahead;
      if (token.value==='...') {
          param = parseRestElement(params);
          validateParam(options, param.argument, param.argument.name);
          options.params.push(param);
          options.defaults.push(null);
          return false;
      }
      param = parsePatternWithDefault(params);
      for (i = 0; i<params.length; i++) {
          validateParam(options, params[i], params[i].value);
      }
      if (param.type===Syntax.AssignmentPattern) {
          def = param.right;
          param = param.left;
          ++options.defaultCount;
      }
      options.params.push(param);
      options.defaults.push(def);
      return !match(')');
    }
    function parseParams(firstRestricted) {
      var options;
      options = {params: [], defaultCount: 0, defaults: [], firstRestricted: firstRestricted}
      expect('(');
      if (!match(')')) {
          options.paramSet = {};
          while (startIndex<length) {
            if (!parseParam(options)) {
                break;
            }
            expect(',');
          }
      }
      expect(')');
      if (options.defaultCount===0) {
          options.defaults = [];
      }
      return {params: options.params, defaults: options.defaults, stricted: options.stricted, firstRestricted: options.firstRestricted, message: options.message}
    }
    function parseFunctionDeclaration(node, identifierIsOptional) {
      var id=null, params=[], defaults=[], body, token, stricted, tmp, firstRestricted, message, previousStrict, isGenerator, previousAllowYield;
      previousAllowYield = state.allowYield;
      expectKeyword('function');
      isGenerator = match('*');
      if (isGenerator) {
          lex();
      }
      if (!identifierIsOptional||!match('(')) {
          token = lookahead;
          id = parseVariableIdentifier();
          if (strict) {
              if (isRestrictedWord(token.value)) {
                  tolerateUnexpectedToken(token, Messages.StrictFunctionName);
              }
          }
          else {
            if (isRestrictedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictFunctionName;
            }
            else 
              if (isStrictModeReservedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictReservedWord;
            }
          }
      }
      state.allowYield = !isGenerator;
      tmp = parseParams(firstRestricted);
      params = tmp.params;
      defaults = tmp.defaults;
      stricted = tmp.stricted;
      firstRestricted = tmp.firstRestricted;
      if (tmp.message) {
          message = tmp.message;
      }
      previousStrict = strict;
      body = parseFunctionSourceElements();
      if (strict&&firstRestricted) {
          throwUnexpectedToken(firstRestricted, message);
      }
      if (strict&&stricted) {
          tolerateUnexpectedToken(stricted, message);
      }
      strict = previousStrict;
      state.allowYield = previousAllowYield;
      return node.finishFunctionDeclaration(id, params, defaults, body, isGenerator);
    }
    function parseFunctionExpression() {
      var token, id=null, stricted, firstRestricted, message, tmp, params=[], defaults=[], body, previousStrict, node=new Node(), isGenerator, previousAllowYield;
      previousAllowYield = state.allowYield;
      expectKeyword('function');
      isGenerator = match('*');
      if (isGenerator) {
          lex();
      }
      state.allowYield = !isGenerator;
      if (!match('(')) {
          token = lookahead;
          id = (!strict&&!isGenerator&&matchKeyword('yield')) ? parseNonComputedProperty() : parseVariableIdentifier();
          if (strict) {
              if (isRestrictedWord(token.value)) {
                  tolerateUnexpectedToken(token, Messages.StrictFunctionName);
              }
          }
          else {
            if (isRestrictedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictFunctionName;
            }
            else 
              if (isStrictModeReservedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictReservedWord;
            }
          }
      }
      tmp = parseParams(firstRestricted);
      params = tmp.params;
      defaults = tmp.defaults;
      stricted = tmp.stricted;
      firstRestricted = tmp.firstRestricted;
      if (tmp.message) {
          message = tmp.message;
      }
      previousStrict = strict;
      body = parseFunctionSourceElements();
      if (strict&&firstRestricted) {
          throwUnexpectedToken(firstRestricted, message);
      }
      if (strict&&stricted) {
          tolerateUnexpectedToken(stricted, message);
      }
      strict = previousStrict;
      state.allowYield = previousAllowYield;
      return node.finishFunctionExpression(id, params, defaults, body, isGenerator);
    }
    function parseClassBody() {
      var classBody, token, isStatic, hasConstructor=false, body, method, computed, key;
      classBody = new Node();
      expect('{');
      body = [];
      while (!match('}')) {
        if (match(';')) {
            lex();
        }
        else {
          method = new Node();
          token = lookahead;
          isStatic = false;
          computed = match('[');
          if (match('*')) {
              lex();
          }
          else {
            key = parseObjectPropertyKey();
            if (key.name==='static'&&(lookaheadPropertyName()||match('*'))) {
                token = lookahead;
                isStatic = true;
                computed = match('[');
                if (match('*')) {
                    lex();
                }
                else {
                  key = parseObjectPropertyKey();
                }
            }
          }
          method = tryParseMethodDefinition(token, key, computed, method);
          if (method) {
              method['static'] = isStatic;
              if (method.kind==='init') {
                  method.kind = 'method';
              }
              if (!isStatic) {
                  if (!method.computed&&(method.key.name||method.key.value.toString())==='constructor') {
                      if (method.kind!=='method'||!method.method||method.value.generator) {
                          throwUnexpectedToken(token, Messages.ConstructorSpecialMethod);
                      }
                      if (hasConstructor) {
                          throwUnexpectedToken(token, Messages.DuplicateConstructor);
                      }
                      else {
                        hasConstructor = true;
                      }
                      method.kind = 'constructor';
                  }
              }
              else {
                if (!method.computed&&(method.key.name||method.key.value.toString())==='prototype') {
                    throwUnexpectedToken(token, Messages.StaticPrototype);
                }
              }
              method.type = Syntax.MethodDefinition;
              delete method.method;
              delete method.shorthand;
              body.push(method);
          }
          else {
            throwUnexpectedToken(lookahead);
          }
        }
      }
      lex();
      return classBody.finishClassBody(body);
    }
    function parseClassDeclaration(identifierIsOptional) {
      var id=null, superClass=null, classNode=new Node(), classBody, previousStrict=strict;
      strict = true;
      expectKeyword('class');
      if (!identifierIsOptional||lookahead.type===Token.Identifier) {
          id = parseVariableIdentifier();
      }
      if (matchKeyword('extends')) {
          lex();
          superClass = isolateCoverGrammar(parseLeftHandSideExpressionAllowCall);
      }
      classBody = parseClassBody();
      strict = previousStrict;
      return classNode.finishClassDeclaration(id, superClass, classBody);
    }
    function parseClassExpression() {
      var id=null, superClass=null, classNode=new Node(), classBody, previousStrict=strict;
      strict = true;
      expectKeyword('class');
      if (lookahead.type===Token.Identifier) {
          id = parseVariableIdentifier();
      }
      if (matchKeyword('extends')) {
          lex();
          superClass = isolateCoverGrammar(parseLeftHandSideExpressionAllowCall);
      }
      classBody = parseClassBody();
      strict = previousStrict;
      return classNode.finishClassExpression(id, superClass, classBody);
    }
    function parseModuleSpecifier() {
      var node=new Node();
      if (lookahead.type!==Token.StringLiteral) {
          throwError(Messages.InvalidModuleSpecifier);
      }
      return node.finishLiteral(lex());
    }
    function parseExportSpecifier() {
      var exported, local, node=new Node(), def;
      if (matchKeyword('default')) {
          def = new Node();
          lex();
          local = def.finishIdentifier('default');
      }
      else {
        local = parseVariableIdentifier();
      }
      if (matchContextualKeyword('as')) {
          lex();
          exported = parseNonComputedProperty();
      }
      return node.finishExportSpecifier(local, exported);
    }
    function parseExportNamedDeclaration(node) {
      var declaration=null, isExportFromIdentifier, src=null, specifiers=[];
      if (lookahead.type===Token.Keyword) {
          switch (lookahead.value) {
            case 'let':
            case 'const':
              declaration = parseLexicalDeclaration({inFor: false});
              return node.finishExportNamedDeclaration(declaration, specifiers, null);
            case 'var':
            case 'class':
            case 'function':
              declaration = parseStatementListItem();
              return node.finishExportNamedDeclaration(declaration, specifiers, null);
          }
      }
      expect('{');
      while (!match('}')) {
        isExportFromIdentifier = isExportFromIdentifier||matchKeyword('default');
        specifiers.push(parseExportSpecifier());
        if (!match('}')) {
            expect(',');
            if (match('}')) {
                break;
            }
        }
      }
      expect('}');
      if (matchContextualKeyword('from')) {
          lex();
          src = parseModuleSpecifier();
          consumeSemicolon();
      }
      else 
        if (isExportFromIdentifier) {
          throwError(lookahead.value ? Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
      }
      else {
        consumeSemicolon();
      }
      return node.finishExportNamedDeclaration(declaration, specifiers, src);
    }
    function parseExportDefaultDeclaration(node) {
      var declaration=null, expression=null;
      expectKeyword('default');
      if (matchKeyword('function')) {
          declaration = parseFunctionDeclaration(new Node(), true);
          return node.finishExportDefaultDeclaration(declaration);
      }
      if (matchKeyword('class')) {
          declaration = parseClassDeclaration(true);
          return node.finishExportDefaultDeclaration(declaration);
      }
      if (matchContextualKeyword('from')) {
          throwError(Messages.UnexpectedToken, lookahead.value);
      }
      if (match('{')) {
          expression = parseObjectInitializer();
      }
      else 
        if (match('[')) {
          expression = parseArrayInitializer();
      }
      else {
        expression = parseAssignmentExpression();
      }
      consumeSemicolon();
      return node.finishExportDefaultDeclaration(expression);
    }
    function parseExportAllDeclaration(node) {
      var src;
      expect('*');
      if (!matchContextualKeyword('from')) {
          throwError(lookahead.value ? Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
      }
      lex();
      src = parseModuleSpecifier();
      consumeSemicolon();
      return node.finishExportAllDeclaration(src);
    }
    function parseExportDeclaration() {
      var node=new Node();
      if (state.inFunctionBody) {
          throwError(Messages.IllegalExportDeclaration);
      }
      expectKeyword('export');
      if (matchKeyword('default')) {
          return parseExportDefaultDeclaration(node);
      }
      if (match('*')) {
          return parseExportAllDeclaration(node);
      }
      return parseExportNamedDeclaration(node);
    }
    function parseImportSpecifier() {
      var local, imported, node=new Node();
      imported = parseNonComputedProperty();
      if (matchContextualKeyword('as')) {
          lex();
          local = parseVariableIdentifier();
      }
      return node.finishImportSpecifier(local, imported);
    }
    function parseNamedImports() {
      var specifiers=[];
      expect('{');
      while (!match('}')) {
        specifiers.push(parseImportSpecifier());
        if (!match('}')) {
            expect(',');
            if (match('}')) {
                break;
            }
        }
      }
      expect('}');
      return specifiers;
    }
    function parseImportDefaultSpecifier() {
      var local, node=new Node();
      local = parseNonComputedProperty();
      return node.finishImportDefaultSpecifier(local);
    }
    function parseImportNamespaceSpecifier() {
      var local, node=new Node();
      expect('*');
      if (!matchContextualKeyword('as')) {
          throwError(Messages.NoAsAfterImportNamespace);
      }
      lex();
      local = parseNonComputedProperty();
      return node.finishImportNamespaceSpecifier(local);
    }
    function parseImportDeclaration() {
      var specifiers=[], src, node=new Node();
      if (state.inFunctionBody) {
          throwError(Messages.IllegalImportDeclaration);
      }
      expectKeyword('import');
      if (lookahead.type===Token.StringLiteral) {
          src = parseModuleSpecifier();
      }
      else {
        if (match('{')) {
            specifiers = specifiers.concat(parseNamedImports());
        }
        else 
          if (match('*')) {
            specifiers.push(parseImportNamespaceSpecifier());
        }
        else 
          if (isIdentifierName(lookahead)&&!matchKeyword('default')) {
            specifiers.push(parseImportDefaultSpecifier());
            if (match(',')) {
                lex();
                if (match('*')) {
                    specifiers.push(parseImportNamespaceSpecifier());
                }
                else 
                  if (match('{')) {
                    specifiers = specifiers.concat(parseNamedImports());
                }
                else {
                  throwUnexpectedToken(lookahead);
                }
            }
        }
        else {
          throwUnexpectedToken(lex());
        }
        if (!matchContextualKeyword('from')) {
            throwError(lookahead.value ? Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
        }
        lex();
        src = parseModuleSpecifier();
      }
      consumeSemicolon();
      return node.finishImportDeclaration(specifiers, src);
    }
    function parseScriptBody() {
      var statement, body=[], token, directive, firstRestricted;
      while (startIndex<length) {
        token = lookahead;
        if (token.type!==Token.StringLiteral) {
            break;
        }
        statement = parseStatementListItem();
        body.push(statement);
        if (statement.expression.type!==Syntax.Literal) {
            break;
        }
        directive = source.slice(token.start+1, token.end-1);
        if (directive==='use strict') {
            strict = true;
            if (firstRestricted) {
                tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
            }
        }
        else {
          if (!firstRestricted&&token.octal) {
              firstRestricted = token;
          }
        }
      }
      while (startIndex<length) {
        statement = parseStatementListItem();
        if (typeof statement==='undefined') {
            break;
        }
        body.push(statement);
      }
      return body;
    }
    function parseProgram() {
      var body, node;
      peek();
      node = new Node();
      body = parseScriptBody();
      return node.finishProgram(body, state.sourceType);
    }
    function filterTokenLocation() {
      var i, entry, token, tokens=[];
      for (i = 0; i<extra.tokens.length; ++i) {
          entry = extra.tokens[i];
          token = {type: entry.type, value: entry.value};
          if (entry.regex) {
              token.regex = {pattern: entry.regex.pattern, flags: entry.regex.flags};
          }
          if (extra.range) {
              token.range = entry.range;
          }
          if (extra.loc) {
              token.loc = entry.loc;
          }
          tokens.push(token);
      }
      extra.tokens = tokens;
    }
    function tokenize(code, options, delegate) {
      var toString, tokens;
      toString = String;
      if (typeof code!=='string'&&!(__instance_of(code, String))) {
          code = toString(code);
      }
      source = code;
      index = 0;
      lineNumber = (source.length>0) ? 1 : 0;
      lineStart = 0;
      startIndex = index;
      startLineNumber = lineNumber;
      startLineStart = lineStart;
      length = source.length;
      lookahead = null;
      state = {allowIn: true, allowYield: true, labelSet: {}, inFunctionBody: false, inIteration: false, inSwitch: false, lastCommentStart: -1, curlyStack: []}
      extra = {}
      options = options||{}
      options.tokens = true;
      extra.tokens = [];
      extra.tokenValues = [];
      extra.tokenize = true;
      extra.delegate = delegate;
      extra.openParenToken = -1;
      extra.openCurlyToken = -1;
      extra.range = (typeof options.range==='boolean')&&options.range;
      extra.loc = (typeof options.loc==='boolean')&&options.loc;
      if (typeof options.comment==='boolean'&&options.comment) {
          extra.comments = [];
      }
      if (typeof options.tolerant==='boolean'&&options.tolerant) {
          extra.errors = [];
      }
      try {
        peek();
        if (lookahead.type===Token.EOF) {
            return extra.tokens;
        }
        lex();
        while (lookahead.type!==Token.EOF) {
          try {
            lex();
          }
          catch (lexError) {
              if (extra.errors) {
                  recordError(lexError);
                  break;
              }
              else {
                throw lexError;
              }
          }
        }
        tokens = extra.tokens;
        if (typeof extra.errors!=='undefined') {
            tokens.errors = extra.errors;
        }
      }
      catch (e) {
          throw e;
      }
      finally {
          extra = {};
        }
      return tokens;
    }
    function parse(code, options) {
      var program, toString;
      toString = String;
      if (typeof code!=='string'&&!(__instance_of(code, String))) {
          code = toString(code);
      }
      source = code;
      index = 0;
      lineNumber = (source.length>0) ? 1 : 0;
      lineStart = 0;
      startIndex = index;
      startLineNumber = lineNumber;
      startLineStart = lineStart;
      length = source.length;
      lookahead = null;
      state = {allowIn: true, allowYield: true, labelSet: {}, inFunctionBody: false, inIteration: false, inSwitch: false, lastCommentStart: -1, curlyStack: [], sourceType: 'script'}
      strict = false;
      extra = {}
      if (typeof options!=='undefined') {
          extra.range = (typeof options.range==='boolean')&&options.range;
          extra.loc = (typeof options.loc==='boolean')&&options.loc;
          extra.attachComment = (typeof options.attachComment==='boolean')&&options.attachComment;
          if (extra.loc&&options.source!==null&&options.source!==undefined) {
              extra.source = toString(options.source);
          }
          if (typeof options.tokens==='boolean'&&options.tokens) {
              extra.tokens = [];
          }
          if (typeof options.comment==='boolean'&&options.comment) {
              extra.comments = [];
          }
          if (typeof options.tolerant==='boolean'&&options.tolerant) {
              extra.errors = [];
          }
          if (extra.attachComment) {
              extra.range = true;
              extra.comments = [];
              extra.bottomRightStack = [];
              extra.trailingComments = [];
              extra.leadingComments = [];
          }
          if (options.sourceType==='module') {
              state.sourceType = options.sourceType;
              strict = true;
          }
      }
      try {
        program = parseProgram();
        if (typeof extra.comments!=='undefined') {
            program.comments = extra.comments;
        }
        if (typeof extra.tokens!=='undefined') {
            filterTokenLocation();
            program.tokens = extra.tokens;
        }
        if (typeof extra.errors!=='undefined') {
            program.errors = extra.errors;
        }
      }
      catch (e) {
          throw e;
      }
      finally {
          extra = {};
        }
      return program;
    }
    exports.version = '2.7.2';
    exports.tokenize = tokenize;
    exports.parse = parse;
    exports.Syntax = (function() {
      var name, types={}
      if (typeof Object.create==='function') {
          types = Object.create(null);
      }
      for (name in Syntax) {
          if (Syntax.hasOwnProperty(name)) {
              types[name] = Syntax[name];
          }
      }
      if (typeof Object.freeze==='function') {
          Object.freeze(types);
      }
      return types;
    }());
  }));
});
es6_module_define('icon_enum', [], function _icon_enum_module(_es6_module) {
  "use strict";
  window.Icons = {HFLIP: 0, TRANSLATE: 1, ROTATE: 2, HELP_PICKER: 3, UNDO: 4, REDO: 5, CIRCLE_SEL: 6, BACKSPACE: 7, LEFT_ARROW: 8, RIGHT_ARROW: 9, UI_EXPAND: 10, UI_COLLAPSE: 11, FILTER_SEL_OPS: 12, SCROLL_DOWN: 13, SCROLL_UP: 14, NOTE_EXCL: 15, TINY_X: 16, FOLDER: 17, FILE: 18, SMALL_PLUS: 19, SMALL_MINUS: 20, MAKE_SEGMENT: 21, MAKE_POLYGON: 22, FACE_MODE: 23, EDGE_MODE: 24, VERT_MODE: 25, CURSOR_ARROW: 26, TOGGLE_SEL_ALL: 27, DELETE: 28, RESIZE: 29}
});
es6_module_define('J3DIMath', [], function _J3DIMath_module(_es6_module) {
  "use strict";
  var PI=Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos, asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;
  var HasCSSMatrix=false;
  var HasCSSMatrixCopy=false;
  var M_SQRT2=Math.sqrt(2.0);
  var FLT_EPSILON=2.22e-16;
  var premul_temp=undefined;
  function internal_matrix() {
    this.m11 = 0.0;
    this.m12 = 0.0;
    this.m13 = 0.0;
    this.m14 = 0.0;
    this.m21 = 0.0;
    this.m22 = 0.0;
    this.m23 = 0.0;
    this.m24 = 0.0;
    this.m31 = 0.0;
    this.m32 = 0.0;
    this.m33 = 0.0;
    this.m34 = 0.0;
    this.m41 = 0.0;
    this.m42 = 0.0;
    this.m43 = 0.0;
    this.m44 = 0.0;
  }
  function internal_matrix3() {
    this.m11 = this.m12 = this.m13 = 0.0;
    this.m21 = this.m22 = this.m23 = 0.0;
    this.m31 = this.m32 = this.m33 = 0.0;
  }
  var $smatrix_tbRa_scale;
  var $smatrix_Ps9__translate;
  var Matrix3=_ESClass("Matrix3", [function Matrix3(mat) {
    this.$matrix = new internal_matrix3();
    if (mat!=undefined) {
        this.load(mat);
    }
    else {
      this.makeIdentity();
    }
  }, function load(m) {
    var m1=this.$matrix, m2=m.$matrix;
    m1.m11 = m2.m11;
    m1.m12 = m2.m12;
    m1.m13 = m2.m13;
    m1.m21 = m2.m21;
    m1.m22 = m2.m22;
    m1.m23 = m2.m23;
    m1.m31 = m2.m31;
    m1.m32 = m2.m32;
    m1.m33 = m2.m33;
    return this;
  }, function makeIdentity() {
    var m=this.$matrix;
    m.m11 = m.m12 = m.m13 = 0.0;
    m.m21 = m.m22 = m.m23 = 0.0;
    m.m31 = m.m32 = m.m33 = 0.0;
    m.m11 = m.m22 = m.m33 = 1.0;
    return this;
  }, function scale(x, y) {
    var m=$smatrix_tbRa_scale.$matrix;
    m.m11 = x;
    m.m22 = y;
    this.multiply($smatrix_tbRa_scale);
    return this;
  }, function translate(x, y) {
    $smatrix_Ps9__translate.makeIdentity();
    var m=$smatrix_Ps9__translate.$matrix;
    m.m31 = x;
    m.m32 = y;
    this.multiply($smatrix_Ps9__translate);
    return this;
  }, function euler_rotate(x, y, z) {
    var xmat=new Matrix4();
    var m=xmat.$matrix;
    var c=Math.cos(x), s=Math.sin(x);
    m.m22 = c;
    m.m23 = s;
    m.m32 = -s;
    m.m33 = c;
    var ymat=new Matrix4();
    c = Math.cos(y);
    s = Math.sin(y);
    var m=ymat.$matrix;
    m.m11 = c;
    m.m13 = s;
    m.m31 = -s;
    m.m33 = c;
    ymat.multiply(xmat);
    var zmat=new Matrix4();
    c = Math.cos(z);
    s = Math.sin(z);
    var m=zmat.$matrix;
    m.m11 = c;
    m.m12 = -s;
    m.m21 = s;
    m.m22 = c;
    zmat.multiply(ymat);
    this.preMultiply(zmat);
  }, function multVecMatrix(v, z_is_one) {
    if (z_is_one==undefined) {
        z_is_one = true;
    }
    var x=v[0], y=v[1], z=z_is_one ? 1.0 : v[2];
    var m=this.$matrix;
    v[0] = m.m11*x+m.m12*y+m.m13*z;
    v[1] = m.m21*x+m.m22*y+m.m23*z;
    v[2] = m.m31*x+m.m32*y+m.m33*z;
  }, function multiply(mat2) {
    m1 = this.$matrix;
    m2 = mat2.$matrix;
    var m11=m2.m11*m1.m11+m2.m12*m1.m21+m2.m13*m1.m31;
    var m12=m2.m11*m1.m12+m2.m12*m1.m22+m2.m13*m1.m32;
    var m13=m2.m11*m1.m13+m2.m12*m1.m23+m2.m13*m1.m33;
    var m21=m2.m21*m1.m11+m2.m22*m1.m21+m2.m23*m1.m31;
    var m22=m2.m21*m1.m12+m2.m22*m1.m22+m2.m23*m1.m32;
    var m23=m2.m21*m1.m13+m2.m22*m1.m23+m2.m23*m1.m33;
    var m31=m2.m31*m1.m11+m2.m32*m1.m21+m2.m33*m1.m31;
    var m32=m2.m31*m1.m12+m2.m32*m1.m22+m2.m33*m1.m32;
    var m33=m2.m31*m1.m13+m2.m32*m1.m23+m2.m33*m1.m33;
    m1.m11 = m11;
    m1.m12 = m12;
    m1.m13 = m13;
    m1.m21 = m21;
    m1.m22 = m22;
    m1.m23 = m23;
    m1.m31 = m31;
    m1.m32 = m32;
    m1.m33 = m33;
    return this;
  }]);
  var $smatrix_tbRa_scale={$matrix: {m11: 1, m12: 0, m13: 0, m21: 0, m22: 1, m23: 0, m31: 0, m32: 0, m33: 1}}
  var $smatrix_Ps9__translate=new Matrix3();
  _es6_module.add_class(Matrix3);
  var Matrix4=_ESClass("Matrix4", [function Matrix4(m) {
    if (HasCSSMatrix)
      this.$matrix = new WebKitCSSMatrix;
    else 
      this.$matrix = new internal_matrix();
    this.isPersp = false;
    if (typeof m=='object') {
        if ("length" in m&&m.length>=16) {
            this.load(m);
            return ;
        }
        else 
          if (__instance_of(m, Matrix4)) {
            this.load(m);
            return ;
        }
    }
    this.makeIdentity();
  }, function multVecMatrix(v, ignore_w) {
    if (ignore_w==undefined) {
        ignore_w = false;
    }
    var matrix=this;
    var x=v[0];
    var y=v[1];
    var z=v[2];
    v[0] = matrix.$matrix.m41+x*matrix.$matrix.m11+y*matrix.$matrix.m21+z*matrix.$matrix.m31;
    v[1] = matrix.$matrix.m42+x*matrix.$matrix.m12+y*matrix.$matrix.m22+z*matrix.$matrix.m32;
    v[2] = matrix.$matrix.m43+x*matrix.$matrix.m13+y*matrix.$matrix.m23+z*matrix.$matrix.m33;
    var w=matrix.$matrix.m44+x*matrix.$matrix.m14+y*matrix.$matrix.m24+z*matrix.$matrix.m34;
    if (!ignore_w&&w!=1&&w!=0&&matrix.isPersp) {
        v[0]/=w;
        v[1]/=w;
        v[2]/=w;
    }
    return w;
  }, function load() {
    if (arguments.length==1&&typeof arguments[0]=='object') {
        var matrix;
        if (__instance_of(arguments[0], Matrix4)) {
            matrix = arguments[0].$matrix;
            this.isPersp = arguments[0].isPersp;
            this.$matrix.m11 = matrix.m11;
            this.$matrix.m12 = matrix.m12;
            this.$matrix.m13 = matrix.m13;
            this.$matrix.m14 = matrix.m14;
            this.$matrix.m21 = matrix.m21;
            this.$matrix.m22 = matrix.m22;
            this.$matrix.m23 = matrix.m23;
            this.$matrix.m24 = matrix.m24;
            this.$matrix.m31 = matrix.m31;
            this.$matrix.m32 = matrix.m32;
            this.$matrix.m33 = matrix.m33;
            this.$matrix.m34 = matrix.m34;
            this.$matrix.m41 = matrix.m41;
            this.$matrix.m42 = matrix.m42;
            this.$matrix.m43 = matrix.m43;
            this.$matrix.m44 = matrix.m44;
            return this;
        }
        else 
          matrix = arguments[0];
        if ("length" in matrix&&matrix.length>=16) {
            this.$matrix.m11 = matrix[0];
            this.$matrix.m12 = matrix[1];
            this.$matrix.m13 = matrix[2];
            this.$matrix.m14 = matrix[3];
            this.$matrix.m21 = matrix[4];
            this.$matrix.m22 = matrix[5];
            this.$matrix.m23 = matrix[6];
            this.$matrix.m24 = matrix[7];
            this.$matrix.m31 = matrix[8];
            this.$matrix.m32 = matrix[9];
            this.$matrix.m33 = matrix[10];
            this.$matrix.m34 = matrix[11];
            this.$matrix.m41 = matrix[12];
            this.$matrix.m42 = matrix[13];
            this.$matrix.m43 = matrix[14];
            this.$matrix.m44 = matrix[15];
            return this;
        }
    }
    this.makeIdentity();
    return this;
  }, function toJSON() {
    return {isPersp: this.isPersp, items: this.getAsArray()}
  }, _ESClass.static(function fromJSON(json) {
    var mat=new Matrix4();
    mat.load(json.items);
    mat.isPersp = json.isPersp;
    return mat;
  }), function getAsArray() {
    return [this.$matrix.m11, this.$matrix.m12, this.$matrix.m13, this.$matrix.m14, this.$matrix.m21, this.$matrix.m22, this.$matrix.m23, this.$matrix.m24, this.$matrix.m31, this.$matrix.m32, this.$matrix.m33, this.$matrix.m34, this.$matrix.m41, this.$matrix.m42, this.$matrix.m43, this.$matrix.m44];
  }, function getAsFloat32Array() {
    if (HasCSSMatrixCopy) {
        var array=new Float32Array(16);
        this.$matrix.copy(array);
        return array;
    }
    return new Float32Array(this.getAsArray());
  }, function setUniform(ctx, loc, transpose) {
    if (Matrix4.setUniformArray==undefined) {
        Matrix4.setUniformWebGLArray = new Float32Array(16);
        Matrix4.setUniformArray = new Array(16);
    }
    if (HasCSSMatrixCopy)
      this.$matrix.copy(Matrix4.setUniformWebGLArray);
    else {
      Matrix4.setUniformArray[0] = this.$matrix.m11;
      Matrix4.setUniformArray[1] = this.$matrix.m12;
      Matrix4.setUniformArray[2] = this.$matrix.m13;
      Matrix4.setUniformArray[3] = this.$matrix.m14;
      Matrix4.setUniformArray[4] = this.$matrix.m21;
      Matrix4.setUniformArray[5] = this.$matrix.m22;
      Matrix4.setUniformArray[6] = this.$matrix.m23;
      Matrix4.setUniformArray[7] = this.$matrix.m24;
      Matrix4.setUniformArray[8] = this.$matrix.m31;
      Matrix4.setUniformArray[9] = this.$matrix.m32;
      Matrix4.setUniformArray[10] = this.$matrix.m33;
      Matrix4.setUniformArray[11] = this.$matrix.m34;
      Matrix4.setUniformArray[12] = this.$matrix.m41;
      Matrix4.setUniformArray[13] = this.$matrix.m42;
      Matrix4.setUniformArray[14] = this.$matrix.m43;
      Matrix4.setUniformArray[15] = this.$matrix.m44;
      Matrix4.setUniformWebGLArray.set(Matrix4.setUniformArray);
    }
    ctx.uniformMatrix4fv(loc, transpose, Matrix4.setUniformWebGLArray);
  }, function makeIdentity() {
    this.$matrix.m11 = 1;
    this.$matrix.m12 = 0;
    this.$matrix.m13 = 0;
    this.$matrix.m14 = 0;
    this.$matrix.m21 = 0;
    this.$matrix.m22 = 1;
    this.$matrix.m23 = 0;
    this.$matrix.m24 = 0;
    this.$matrix.m31 = 0;
    this.$matrix.m32 = 0;
    this.$matrix.m33 = 1;
    this.$matrix.m34 = 0;
    this.$matrix.m41 = 0;
    this.$matrix.m42 = 0;
    this.$matrix.m43 = 0;
    this.$matrix.m44 = 1;
    return this;
  }, function transpose() {
    var tmp=this.$matrix.m12;
    this.$matrix.m12 = this.$matrix.m21;
    this.$matrix.m21 = tmp;
    tmp = this.$matrix.m13;
    this.$matrix.m13 = this.$matrix.m31;
    this.$matrix.m31 = tmp;
    tmp = this.$matrix.m14;
    this.$matrix.m14 = this.$matrix.m41;
    this.$matrix.m41 = tmp;
    tmp = this.$matrix.m23;
    this.$matrix.m23 = this.$matrix.m32;
    this.$matrix.m32 = tmp;
    tmp = this.$matrix.m24;
    this.$matrix.m24 = this.$matrix.m42;
    this.$matrix.m42 = tmp;
    tmp = this.$matrix.m34;
    this.$matrix.m34 = this.$matrix.m43;
    this.$matrix.m43 = tmp;
    return this;
  }, function invert() {
    if (HasCSSMatrix) {
        this.$matrix = this.$matrix.inverse();
        return this;
    }
    var det=this._determinant4x4();
    if (Math.abs(det)<1e-08)
      return null;
    this._makeAdjoint();
    this.$matrix.m11/=det;
    this.$matrix.m12/=det;
    this.$matrix.m13/=det;
    this.$matrix.m14/=det;
    this.$matrix.m21/=det;
    this.$matrix.m22/=det;
    this.$matrix.m23/=det;
    this.$matrix.m24/=det;
    this.$matrix.m31/=det;
    this.$matrix.m32/=det;
    this.$matrix.m33/=det;
    this.$matrix.m34/=det;
    this.$matrix.m41/=det;
    this.$matrix.m42/=det;
    this.$matrix.m43/=det;
    this.$matrix.m44/=det;
    return this;
  }, function translate(x, y, z) {
    if (typeof x=='object'&&"length" in x) {
        var t=x;
        x = t[0];
        y = t[1];
        z = t[2];
    }
    else {
      if (x==undefined)
        x = 0;
      if (y==undefined)
        y = 0;
      if (z==undefined)
        z = 0;
    }
    if (HasCSSMatrix) {
        this.$matrix = this.$matrix.translate(x, y, z);
        return ;
    }
    var matrix=new Matrix4();
    matrix.$matrix.m41 = x;
    matrix.$matrix.m42 = y;
    matrix.$matrix.m43 = z;
    this.multiply(matrix);
  }, function preTranslate(x, y, z) {
    if (typeof x=='object'&&"length" in x) {
        var t=x;
        x = t[0];
        y = t[1];
        z = t[2];
    }
    else {
      if (x==undefined)
        x = 0;
      if (y==undefined)
        y = 0;
      if (z==undefined)
        z = 0;
    }
    if (HasCSSMatrix) {
        this.$matrix = this.$matrix.translate(x, y, z);
        return ;
    }
    var matrix=new Matrix4();
    matrix.$matrix.m41 = x;
    matrix.$matrix.m42 = y;
    matrix.$matrix.m43 = z;
    this.preMultiply(matrix);
  }, function scale(x, y, z) {
    if (typeof x=='object'&&"length" in x) {
        var t=x;
        x = t[0];
        y = t[1];
        z = t[2];
    }
    else {
      if (x==undefined)
        x = 1;
      if (z==undefined) {
          if (y==undefined) {
              y = x;
              z = x;
          }
          else 
            z = 1;
      }
      else 
        if (y==undefined)
        y = x;
    }
    if (HasCSSMatrix) {
        this.$matrix = this.$matrix.scale(x, y, z);
        return ;
    }
    var matrix=new Matrix4();
    matrix.$matrix.m11 = x;
    matrix.$matrix.m22 = y;
    matrix.$matrix.m33 = z;
    this.multiply(matrix);
  }, function rotate(angle, x, y, z) {
    if (typeof x=='object'&&"length" in x) {
        var t=x;
        x = t[0];
        y = t[1];
        z = t[2];
    }
    else {
      if (arguments.length==1) {
          x = 0;
          y = 0;
          z = 1;
      }
      else 
        if (arguments.length==3) {
          this.rotate(angle, 1, 0, 0);
          this.rotate(x, 0, 1, 0);
          this.rotate(y, 0, 0, 1);
          return ;
      }
    }
    if (HasCSSMatrix) {
        this.$matrix = this.$matrix.rotateAxisAngle(x, y, z, angle);
        return ;
    }
    angle/=2;
    var sinA=Math.sin(angle);
    var cosA=Math.cos(angle);
    var sinA2=sinA*sinA;
    var len=Math.sqrt(x*x+y*y+z*z);
    if (len==0) {
        x = 0;
        y = 0;
        z = 1;
    }
    else 
      if (len!=1) {
        x/=len;
        y/=len;
        z/=len;
    }
    var mat=new Matrix4();
    if (x==1&&y==0&&z==0) {
        mat.$matrix.m11 = 1;
        mat.$matrix.m12 = 0;
        mat.$matrix.m13 = 0;
        mat.$matrix.m21 = 0;
        mat.$matrix.m22 = 1-2*sinA2;
        mat.$matrix.m23 = 2*sinA*cosA;
        mat.$matrix.m31 = 0;
        mat.$matrix.m32 = -2*sinA*cosA;
        mat.$matrix.m33 = 1-2*sinA2;
        mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
        mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
        mat.$matrix.m44 = 1;
    }
    else 
      if (x==0&&y==1&&z==0) {
        mat.$matrix.m11 = 1-2*sinA2;
        mat.$matrix.m12 = 0;
        mat.$matrix.m13 = -2*sinA*cosA;
        mat.$matrix.m21 = 0;
        mat.$matrix.m22 = 1;
        mat.$matrix.m23 = 0;
        mat.$matrix.m31 = 2*sinA*cosA;
        mat.$matrix.m32 = 0;
        mat.$matrix.m33 = 1-2*sinA2;
        mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
        mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
        mat.$matrix.m44 = 1;
    }
    else 
      if (x==0&&y==0&&z==1) {
        mat.$matrix.m11 = 1-2*sinA2;
        mat.$matrix.m12 = 2*sinA*cosA;
        mat.$matrix.m13 = 0;
        mat.$matrix.m21 = -2*sinA*cosA;
        mat.$matrix.m22 = 1-2*sinA2;
        mat.$matrix.m23 = 0;
        mat.$matrix.m31 = 0;
        mat.$matrix.m32 = 0;
        mat.$matrix.m33 = 1;
        mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
        mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
        mat.$matrix.m44 = 1;
    }
    else {
      var x2=x*x;
      var y2=y*y;
      var z2=z*z;
      mat.$matrix.m11 = 1-2*(y2+z2)*sinA2;
      mat.$matrix.m12 = 2*(x*y*sinA2+z*sinA*cosA);
      mat.$matrix.m13 = 2*(x*z*sinA2-y*sinA*cosA);
      mat.$matrix.m21 = 2*(y*x*sinA2-z*sinA*cosA);
      mat.$matrix.m22 = 1-2*(z2+x2)*sinA2;
      mat.$matrix.m23 = 2*(y*z*sinA2+x*sinA*cosA);
      mat.$matrix.m31 = 2*(z*x*sinA2+y*sinA*cosA);
      mat.$matrix.m32 = 2*(z*y*sinA2-x*sinA*cosA);
      mat.$matrix.m33 = 1-2*(x2+y2)*sinA2;
      mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
      mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
      mat.$matrix.m44 = 1;
    }
    this.multiply(mat);
  }, function preMultiply(mat) {
    var mat2=premul_temp;
    mat2.load(this);
    this.load(mat);
    return this.multiply(mat2);
  }, function multiply(mat) {
    if (HasCSSMatrix) {
        this.$matrix = this.$matrix.multiply(mat.$matrix);
        return ;
    }
    var m11=(mat.$matrix.m11*this.$matrix.m11+mat.$matrix.m12*this.$matrix.m21+mat.$matrix.m13*this.$matrix.m31+mat.$matrix.m14*this.$matrix.m41);
    var m12=(mat.$matrix.m11*this.$matrix.m12+mat.$matrix.m12*this.$matrix.m22+mat.$matrix.m13*this.$matrix.m32+mat.$matrix.m14*this.$matrix.m42);
    var m13=(mat.$matrix.m11*this.$matrix.m13+mat.$matrix.m12*this.$matrix.m23+mat.$matrix.m13*this.$matrix.m33+mat.$matrix.m14*this.$matrix.m43);
    var m14=(mat.$matrix.m11*this.$matrix.m14+mat.$matrix.m12*this.$matrix.m24+mat.$matrix.m13*this.$matrix.m34+mat.$matrix.m14*this.$matrix.m44);
    var m21=(mat.$matrix.m21*this.$matrix.m11+mat.$matrix.m22*this.$matrix.m21+mat.$matrix.m23*this.$matrix.m31+mat.$matrix.m24*this.$matrix.m41);
    var m22=(mat.$matrix.m21*this.$matrix.m12+mat.$matrix.m22*this.$matrix.m22+mat.$matrix.m23*this.$matrix.m32+mat.$matrix.m24*this.$matrix.m42);
    var m23=(mat.$matrix.m21*this.$matrix.m13+mat.$matrix.m22*this.$matrix.m23+mat.$matrix.m23*this.$matrix.m33+mat.$matrix.m24*this.$matrix.m43);
    var m24=(mat.$matrix.m21*this.$matrix.m14+mat.$matrix.m22*this.$matrix.m24+mat.$matrix.m23*this.$matrix.m34+mat.$matrix.m24*this.$matrix.m44);
    var m31=(mat.$matrix.m31*this.$matrix.m11+mat.$matrix.m32*this.$matrix.m21+mat.$matrix.m33*this.$matrix.m31+mat.$matrix.m34*this.$matrix.m41);
    var m32=(mat.$matrix.m31*this.$matrix.m12+mat.$matrix.m32*this.$matrix.m22+mat.$matrix.m33*this.$matrix.m32+mat.$matrix.m34*this.$matrix.m42);
    var m33=(mat.$matrix.m31*this.$matrix.m13+mat.$matrix.m32*this.$matrix.m23+mat.$matrix.m33*this.$matrix.m33+mat.$matrix.m34*this.$matrix.m43);
    var m34=(mat.$matrix.m31*this.$matrix.m14+mat.$matrix.m32*this.$matrix.m24+mat.$matrix.m33*this.$matrix.m34+mat.$matrix.m34*this.$matrix.m44);
    var m41=(mat.$matrix.m41*this.$matrix.m11+mat.$matrix.m42*this.$matrix.m21+mat.$matrix.m43*this.$matrix.m31+mat.$matrix.m44*this.$matrix.m41);
    var m42=(mat.$matrix.m41*this.$matrix.m12+mat.$matrix.m42*this.$matrix.m22+mat.$matrix.m43*this.$matrix.m32+mat.$matrix.m44*this.$matrix.m42);
    var m43=(mat.$matrix.m41*this.$matrix.m13+mat.$matrix.m42*this.$matrix.m23+mat.$matrix.m43*this.$matrix.m33+mat.$matrix.m44*this.$matrix.m43);
    var m44=(mat.$matrix.m41*this.$matrix.m14+mat.$matrix.m42*this.$matrix.m24+mat.$matrix.m43*this.$matrix.m34+mat.$matrix.m44*this.$matrix.m44);
    this.$matrix.m11 = m11;
    this.$matrix.m12 = m12;
    this.$matrix.m13 = m13;
    this.$matrix.m14 = m14;
    this.$matrix.m21 = m21;
    this.$matrix.m22 = m22;
    this.$matrix.m23 = m23;
    this.$matrix.m24 = m24;
    this.$matrix.m31 = m31;
    this.$matrix.m32 = m32;
    this.$matrix.m33 = m33;
    this.$matrix.m34 = m34;
    this.$matrix.m41 = m41;
    this.$matrix.m42 = m42;
    this.$matrix.m43 = m43;
    this.$matrix.m44 = m44;
  }, function divide(divisor) {
    this.$matrix.m11/=divisor;
    this.$matrix.m12/=divisor;
    this.$matrix.m13/=divisor;
    this.$matrix.m14/=divisor;
    this.$matrix.m21/=divisor;
    this.$matrix.m22/=divisor;
    this.$matrix.m23/=divisor;
    this.$matrix.m24/=divisor;
    this.$matrix.m31/=divisor;
    this.$matrix.m32/=divisor;
    this.$matrix.m33/=divisor;
    this.$matrix.m34/=divisor;
    this.$matrix.m41/=divisor;
    this.$matrix.m42/=divisor;
    this.$matrix.m43/=divisor;
    this.$matrix.m44/=divisor;
  }, function ortho(left, right, bottom, top, near, far) {
    var tx=(left+right)/(left-right);
    var ty=(top+bottom)/(top-bottom);
    var tz=(far+near)/(far-near);
    var matrix=new Matrix4();
    matrix.$matrix.m11 = 2/(left-right);
    matrix.$matrix.m12 = 0;
    matrix.$matrix.m13 = 0;
    matrix.$matrix.m14 = 0;
    matrix.$matrix.m21 = 0;
    matrix.$matrix.m22 = 2/(top-bottom);
    matrix.$matrix.m23 = 0;
    matrix.$matrix.m24 = 0;
    matrix.$matrix.m31 = 0;
    matrix.$matrix.m32 = 0;
    matrix.$matrix.m33 = -2/(far-near);
    matrix.$matrix.m34 = 0;
    matrix.$matrix.m41 = tx;
    matrix.$matrix.m42 = ty;
    matrix.$matrix.m43 = tz;
    matrix.$matrix.m44 = 1;
    this.multiply(matrix);
  }, function frustum(left, right, bottom, top, near, far) {
    var matrix=new Matrix4();
    var A=(right+left)/(right-left);
    var B=(top+bottom)/(top-bottom);
    var C=-(far+near)/(far-near);
    var D=-(2*far*near)/(far-near);
    matrix.$matrix.m11 = (2*near)/(right-left);
    matrix.$matrix.m12 = 0;
    matrix.$matrix.m13 = 0;
    matrix.$matrix.m14 = 0;
    matrix.$matrix.m21 = 0;
    matrix.$matrix.m22 = 2*near/(top-bottom);
    matrix.$matrix.m23 = 0;
    matrix.$matrix.m24 = 0;
    matrix.$matrix.m31 = A;
    matrix.$matrix.m32 = B;
    matrix.$matrix.m33 = C;
    matrix.$matrix.m34 = -1;
    matrix.$matrix.m41 = 0;
    matrix.$matrix.m42 = 0;
    matrix.$matrix.m43 = D;
    matrix.$matrix.m44 = 0;
    this.isPersp = true;
    this.multiply(matrix);
  }, function perspective(fovy, aspect, zNear, zFar) {
    var top=Math.tan(fovy*Math.PI/360)*zNear;
    var bottom=-top;
    var left=aspect*bottom;
    var right=aspect*top;
    this.frustum(left, right, bottom, top, zNear, zFar);
  }, function lookat(eyex, eyey, eyez, centerx, centery, centerz, upx, upy, upz) {
    if (typeof eyez=='object'&&"length" in eyez) {
        var t=eyez;
        upx = t[0];
        upy = t[1];
        upz = t[2];
        t = eyey;
        centerx = t[0];
        centery = t[1];
        centerz = t[2];
        t = eyex;
        eyex = t[0];
        eyey = t[1];
        eyez = t[2];
    }
    var matrix=new Matrix4();
    var zx=eyex-centerx;
    var zy=eyey-centery;
    var zz=eyez-centerz;
    var mag=Math.sqrt(zx*zx+zy*zy+zz*zz);
    if (mag) {
        zx/=mag;
        zy/=mag;
        zz/=mag;
    }
    var yx=upx;
    var yy=upy;
    var yz=upz;
    var xx, xy, xz;
    xx = yy*zz-yz*zy;
    xy = -yx*zz+yz*zx;
    xz = yx*zy-yy*zx;
    yx = zy*xz-zz*xy;
    yy = -zx*xz+zz*xx;
    yx = zx*xy-zy*xx;
    mag = Math.sqrt(xx*xx+xy*xy+xz*xz);
    if (mag) {
        xx/=mag;
        xy/=mag;
        xz/=mag;
    }
    mag = Math.sqrt(yx*yx+yy*yy+yz*yz);
    if (mag) {
        yx/=mag;
        yy/=mag;
        yz/=mag;
    }
    matrix.$matrix.m11 = xx;
    matrix.$matrix.m12 = xy;
    matrix.$matrix.m13 = xz;
    matrix.$matrix.m14 = 0;
    matrix.$matrix.m21 = yx;
    matrix.$matrix.m22 = yy;
    matrix.$matrix.m23 = yz;
    matrix.$matrix.m24 = 0;
    matrix.$matrix.m31 = zx;
    matrix.$matrix.m32 = zy;
    matrix.$matrix.m33 = zz;
    matrix.$matrix.m34 = 0;
    matrix.$matrix.m41 = 0;
    matrix.$matrix.m42 = 0;
    matrix.$matrix.m43 = 0;
    matrix.$matrix.m44 = 1;
    matrix.translate(-eyex, -eyey, -eyez);
    this.multiply(matrix);
  }, function decompose(_translate, _rotate, _scale, _skew, _perspective) {
    if (this.$matrix.m44==0)
      return false;
    var translate, rotate, scale, skew, perspective;
    var translate=(_translate==undefined||!("length" in _translate)) ? new Vector3 : _translate;
    var rotate=(_rotate==undefined||!("length" in _rotate)) ? new Vector3 : _rotate;
    var scale=(_scale==undefined||!("length" in _scale)) ? new Vector3 : _scale;
    var skew=(_skew==undefined||!("length" in _skew)) ? new Vector3 : _skew;
    var perspective=(_perspective==undefined||!("length" in _perspective)) ? new Array(4) : _perspective;
    var matrix=new Matrix4(this);
    matrix.divide(matrix.$matrix.m44);
    var perspectiveMatrix=new Matrix4(matrix);
    perspectiveMatrix.$matrix.m14 = 0;
    perspectiveMatrix.$matrix.m24 = 0;
    perspectiveMatrix.$matrix.m34 = 0;
    perspectiveMatrix.$matrix.m44 = 1;
    if (perspectiveMatrix._determinant4x4()==0)
      return false;
    if (matrix.$matrix.m14!=0||matrix.$matrix.m24!=0||matrix.$matrix.m34!=0) {
        var rightHandSide=[matrix.$matrix.m14, matrix.$matrix.m24, matrix.$matrix.m34, matrix.$matrix.m44];
        var inversePerspectiveMatrix=new Matrix4(perspectiveMatrix);
        inversePerspectiveMatrix.invert();
        var transposedInversePerspectiveMatrix=new Matrix4(inversePerspectiveMatrix);
        transposedInversePerspectiveMatrix.transpose();
        transposedInversePerspectiveMatrix.multVecMatrix(perspective, rightHandSide);
        matrix.$matrix.m14 = matrix.$matrix.m24 = matrix.$matrix.m34 = 0;
        matrix.$matrix.m44 = 1;
    }
    else {
      perspective[0] = perspective[1] = perspective[2] = 0;
      perspective[3] = 1;
    }
    translate[0] = matrix.$matrix.m41;
    matrix.$matrix.m41 = 0;
    translate[1] = matrix.$matrix.m42;
    matrix.$matrix.m42 = 0;
    translate[2] = matrix.$matrix.m43;
    matrix.$matrix.m43 = 0;
    var row0=new Vector3([matrix.$matrix.m11, matrix.$matrix.m12, matrix.$matrix.m13]);
    var row1=new Vector3([matrix.$matrix.m21, matrix.$matrix.m22, matrix.$matrix.m23]);
    var row2=new Vector3([matrix.$matrix.m31, matrix.$matrix.m32, matrix.$matrix.m33]);
    scale[0] = row0.vectorLength();
    row0.divide(scale[0]);
    skew[0] = row0.dot(row1);
    row1.combine(row0, 1.0, -skew[0]);
    scale[1] = row1.vectorLength();
    row1.divide(scale[1]);
    skew[0]/=scale[1];
    skew[1] = row1.dot(row2);
    row2.combine(row0, 1.0, -skew[1]);
    skew[2] = row1.dot(row2);
    row2.combine(row1, 1.0, -skew[2]);
    scale[2] = row2.vectorLength();
    row2.divide(scale[2]);
    skew[1]/=scale[2];
    skew[2]/=scale[2];
    var pdum3=new Vector3(row1);
    pdum3.cross(row2);
    if (row0.dot(pdum3)<0) {
        for (var i=0; i<3; i++) {
            scale[i]*=-1;
            row[0][i]*=-1;
            row[1][i]*=-1;
            row[2][i]*=-1;
        }
    }
    rotate[1] = Math.asin(-row0[2]);
    if (Math.cos(rotate[1])!=0) {
        rotate[0] = Math.atan2(row1[2], row2[2]);
        rotate[2] = Math.atan2(row0[1], row0[0]);
    }
    else {
      rotate[0] = Math.atan2(-row2[0], row1[1]);
      rotate[2] = 0;
    }
    var rad2deg=180/Math.PI;
    rotate[0]*=rad2deg;
    rotate[1]*=rad2deg;
    rotate[2]*=rad2deg;
    return true;
  }, function _determinant2x2(a, b, c, d) {
    return a*d-b*c;
  }, function _determinant3x3(a1, a2, a3, b1, b2, b3, c1, c2, c3) {
    return a1*this._determinant2x2(b2, b3, c2, c3)-b1*this._determinant2x2(a2, a3, c2, c3)+c1*this._determinant2x2(a2, a3, b2, b3);
  }, function _determinant4x4() {
    var a1=this.$matrix.m11;
    var b1=this.$matrix.m12;
    var c1=this.$matrix.m13;
    var d1=this.$matrix.m14;
    var a2=this.$matrix.m21;
    var b2=this.$matrix.m22;
    var c2=this.$matrix.m23;
    var d2=this.$matrix.m24;
    var a3=this.$matrix.m31;
    var b3=this.$matrix.m32;
    var c3=this.$matrix.m33;
    var d3=this.$matrix.m34;
    var a4=this.$matrix.m41;
    var b4=this.$matrix.m42;
    var c4=this.$matrix.m43;
    var d4=this.$matrix.m44;
    return a1*this._determinant3x3(b2, b3, b4, c2, c3, c4, d2, d3, d4)-b1*this._determinant3x3(a2, a3, a4, c2, c3, c4, d2, d3, d4)+c1*this._determinant3x3(a2, a3, a4, b2, b3, b4, d2, d3, d4)-d1*this._determinant3x3(a2, a3, a4, b2, b3, b4, c2, c3, c4);
  }, function _makeAdjoint() {
    var a1=this.$matrix.m11;
    var b1=this.$matrix.m12;
    var c1=this.$matrix.m13;
    var d1=this.$matrix.m14;
    var a2=this.$matrix.m21;
    var b2=this.$matrix.m22;
    var c2=this.$matrix.m23;
    var d2=this.$matrix.m24;
    var a3=this.$matrix.m31;
    var b3=this.$matrix.m32;
    var c3=this.$matrix.m33;
    var d3=this.$matrix.m34;
    var a4=this.$matrix.m41;
    var b4=this.$matrix.m42;
    var c4=this.$matrix.m43;
    var d4=this.$matrix.m44;
    this.$matrix.m11 = this._determinant3x3(b2, b3, b4, c2, c3, c4, d2, d3, d4);
    this.$matrix.m21 = -this._determinant3x3(a2, a3, a4, c2, c3, c4, d2, d3, d4);
    this.$matrix.m31 = this._determinant3x3(a2, a3, a4, b2, b3, b4, d2, d3, d4);
    this.$matrix.m41 = -this._determinant3x3(a2, a3, a4, b2, b3, b4, c2, c3, c4);
    this.$matrix.m12 = -this._determinant3x3(b1, b3, b4, c1, c3, c4, d1, d3, d4);
    this.$matrix.m22 = this._determinant3x3(a1, a3, a4, c1, c3, c4, d1, d3, d4);
    this.$matrix.m32 = -this._determinant3x3(a1, a3, a4, b1, b3, b4, d1, d3, d4);
    this.$matrix.m42 = this._determinant3x3(a1, a3, a4, b1, b3, b4, c1, c3, c4);
    this.$matrix.m13 = this._determinant3x3(b1, b2, b4, c1, c2, c4, d1, d2, d4);
    this.$matrix.m23 = -this._determinant3x3(a1, a2, a4, c1, c2, c4, d1, d2, d4);
    this.$matrix.m33 = this._determinant3x3(a1, a2, a4, b1, b2, b4, d1, d2, d4);
    this.$matrix.m43 = -this._determinant3x3(a1, a2, a4, b1, b2, b4, c1, c2, c4);
    this.$matrix.m14 = -this._determinant3x3(b1, b2, b3, c1, c2, c3, d1, d2, d3);
    this.$matrix.m24 = this._determinant3x3(a1, a2, a3, c1, c2, c3, d1, d2, d3);
    this.$matrix.m34 = -this._determinant3x3(a1, a2, a3, b1, b2, b3, d1, d2, d3);
    this.$matrix.m44 = this._determinant3x3(a1, a2, a3, b1, b2, b3, c1, c2, c3);
  }]);
  _es6_module.add_class(Matrix4);
  premul_temp = new Matrix4();
  var M_SQRT2=Math.sqrt(2.0);
  var FLT_EPSILON=2.22e-16;
  function saacos(fac) {
    if (fac<=-1.0)
      return Math.pi;
    else 
      if (fac>=1.0)
      return 0.0;
    else 
      return Math.acos(fac);
  }
  function saasin(fac) {
    if (fac<=-1.0)
      return -Math.pi/2.0;
    else 
      if (fac>=1.0)
      return Math.pi/2.0;
    else 
      return Math.asin(fac);
  }
  var _temp_xyz_vecs=[];
  for (var i=0; i<32; i++) {
      _temp_xyz_vecs.push(null);
  }
  var _temp_xyz_cur=0;
  var $init_LTTY_Vector3;
  var $_tmp_Ck3K_cross;
  var $vec_YIHW_vectorDistance;
  var $vec_sosG_vectorDotDistance;
  var $add__e6T_static_add;
  var $_static_sub_xx2I_static_sub;
  var $_static_mul_NZnI_static_mul;
  var $_static_divide_5DAu_static_divide;
  var $_static_addScalar_sFVK_static_addScalar;
  var $_static_subScalar_TGYr_static_subScalar;
  var $_static_mulScalar_FwDz_static_mulScalar;
  var $_static_divideScalar_7Fss__static_divideScalar;
  var $n1_Q8Pk_normalizedDot;
  var $_v3nd4_n1_Dv3s_normalizedDot4;
  var $n1_8aqL_normalizedDot3;
  var $n2_XIpQ_normalizedDot;
  var $_v3nd4_n2_nY15_normalizedDot4;
  var $n2_yZYl_normalizedDot3;
  var Vector3=_ESClass("Vector3", Array, [function Vector3(vec) {
    if (vec==undefined)
      vec = $init_LTTY_Vector3;
    if (vec[0]==undefined)
      vec[0] = 0;
    if (vec[1]==undefined)
      vec[1] = 0;
    if (vec[2]==undefined)
      vec[2] = 0;
    if (typeof (vec)=="number"||typeof (vec[0])!="number")
      throw new Error("Invalid argument to new Vector3(vec)");
    this.length = 3;
    this[0] = vec[0];
    this[1] = vec[1];
    this[2] = vec[2];
  }, function toCSS() {
    var r=~~(this[0]*255);
    var g=~~(this[1]*255);
    var b=~~(this[2]*255);
    return "rgb("+r+","+g+","+b+")";
  }, function toJSON() {
    var arr=new Array(this.length);
    var i=0;
    for (var i=0; i<this.length; i++) {
        arr[i] = this[i];
    }
    return arr;
  }, function zero() {
    this[0] = 0.0;
    this[1] = 0.0;
    this[2] = 0.0;
    return this;
  }, function floor() {
    this[0] = Math.floor(this[0]);
    this[1] = Math.floor(this[1]);
    this[2] = Math.floor(this[2]);
    return this;
  }, function ceil() {
    this[0] = Math.ceil(this[0]);
    this[1] = Math.ceil(this[1]);
    this[2] = Math.ceil(this[2]);
    return this;
  }, function loadxy(vec2, z) {
    if (z==undefined) {
        z = 0;
    }
    this[0] = vec2[0];
    this[1] = vec2[1];
    this[3] = z;
    return this;
  }, function load(vec3) {
    this[0] = vec3[0];
    this[1] = vec3[1];
    this[2] = vec3[2];
    return this;
  }, function loadXYZ(x, y, z) {
    this[0] = x;
    this[1] = y;
    this[2] = z;
    return this;
  }, _ESClass.static(function temp_xyz(x, y, z) {
    var vec=_temp_xyz_vecs[_temp_xyz_cur];
    if (vec==null) {
        vec = new Vector3();
        _temp_xyz_vecs[_temp_xyz_cur] = vec;
    }
    _temp_xyz_cur = (_temp_xyz_cur+1)%_temp_xyz_vecs.length;
    vec.loadXYZ(x, y, z);
    return vec;
  }), function getAsArray() {
    return [this[0], this[1], this[2]];
  }, function min(b) {
    this[0] = Math.min(this[0], b[0]);
    this[1] = Math.min(this[1], b[1]);
    this[2] = Math.min(this[2], b[2]);
    return this;
  }, function max(b) {
    this[0] = Math.max(this[0], b[0]);
    this[1] = Math.max(this[1], b[1]);
    this[2] = Math.max(this[2], b[2]);
    return this;
  }, function floor(b) {
    this[0] = Math.floor(this[0], b[0]);
    this[1] = Math.floor(this[1], b[1]);
    this[2] = Math.floor(this[2], b[2]);
    return this;
  }, function ceil(b) {
    this[0] = Math.ceil(this[0], b[0]);
    this[1] = Math.ceil(this[1], b[1]);
    this[2] = Math.ceil(this[2], b[2]);
    return this;
  }, function round(b) {
    this[0] = Math.round(this[0], b[0]);
    this[1] = Math.round(this[1], b[1]);
    this[2] = Math.round(this[2], b[2]);
    return this;
  }, function getAsFloat32Array() {
    return new Float32Array(this.getAsArray());
  }, function vectorLength() {
    return Math.sqrt(this[0]*this[0]+this[1]*this[1]+this[2]*this[2]);
  }, function rot2d(angle) {
    angle+=PI/2;
    var x=this[0], y=this[1];
    this[0] = sin(angle)*x+cos(angle)*y;
    this[1] = sin(angle)*y-cos(angle)*x;
    return this;
  }, function normalize() {
    var len=this.vectorLength();
    if (len>FLT_EPSILON*2)
      this.mulScalar(1.0/len);
    return this;
  }, function negate() {
    this[0] = -this[0];
    this[1] = -this[1];
    this[2] = -this[2];
    return this;
  }, function fast_normalize() {
    var d=this[0]*this[0]+this[1]*this[1]+this[2]*this[2];
    var len=Math.sqrt(d);
    if (len>FLT_EPSILON)
      return 0;
    this[0]/=len;
    this[1]/=len;
    this[2]/=len;
    return this;
  }, function divideVect(v) {
    this[0]/=v[0];
    this[1]/=v[1];
    this[2]/=v[2];
    return this;
  }, function divide(divisor) {
    this[0]/=divisor;
    this[1]/=divisor;
    this[2]/=divisor;
    return this;
  }, function divideScalar(divisor) {
    this[0]/=divisor;
    this[1]/=divisor;
    this[2]/=divisor;
    return this;
  }, function divScalar(divisor) {
    this[0]/=divisor;
    this[1]/=divisor;
    this[2]/=divisor;
    return this;
  }, function divVector(vec) {
    this[0]/=vec[0];
    this[1]/=vec[1];
    this[2]/=vec[2];
    return this;
  }, function subScalar(scalar) {
    this[0]-=scalar;
    this[1]-=scalar;
    this[2]-=scalar;
    return this;
  }, function addScalar(scalar) {
    this[0]+=scalar;
    this[1]+=scalar;
    this[2]+=scalar;
    return this;
  }, function mulScalar(scalar) {
    this[0]*=scalar;
    this[1]*=scalar;
    this[2]*=scalar;
    return this;
  }, function mul(v) {
    this[0] = this[0]*v[0];
    this[1] = this[1]*v[1];
    this[2] = this[2]*v[2];
    return this;
  }, function cross(v) {
    $_tmp_Ck3K_cross[0] = this[1]*v[2]-this[2]*v[1];
    $_tmp_Ck3K_cross[1] = this[2]*v[0]-this[0]*v[2];
    $_tmp_Ck3K_cross[2] = this[0]*v[1]-this[1]*v[0];
    this[0] = $_tmp_Ck3K_cross[0];
    this[1] = $_tmp_Ck3K_cross[1];
    this[2] = $_tmp_Ck3K_cross[2];
    return this;
  }, function vectorDistance(v2) {
    $vec_YIHW_vectorDistance.load(this);
    $vec_YIHW_vectorDistance.sub(v2);
    return $vec_YIHW_vectorDistance.vectorLength();
  }, function vectorDotDistance(v2) {
    $vec_sosG_vectorDotDistance.load(this);
    $vec_sosG_vectorDotDistance.sub(v2);
    return $vec_sosG_vectorDotDistance.dot($vec_sosG_vectorDotDistance);
  }, function sub(v) {
    if (v==null||v==undefined)
      console.trace();
    this[0] = this[0]-v[0];
    this[1] = this[1]-v[1];
    this[2] = this[2]-v[2];
    return this;
  }, function add(v) {
    this[0] = this[0]+v[0];
    this[1] = this[1]+v[1];
    this[2] = this[2]+v[2];
    return this;
  }, function static_add(v) {
    $add__e6T_static_add[0] = this[0]+v[0];
    $add__e6T_static_add[1] = this[1]+v[1];
    $add__e6T_static_add[2] = this[2]+v[2];
    return $add__e6T_static_add;
  }, function static_sub(v) {
    $_static_sub_xx2I_static_sub[0] = this[0]-v[0];
    $_static_sub_xx2I_static_sub[1] = this[1]-v[1];
    $_static_sub_xx2I_static_sub[2] = this[2]-v[2];
    return $_static_sub_xx2I_static_sub;
  }, function static_mul(v) {
    $_static_mul_NZnI_static_mul[0] = this[0]*v[0];
    $_static_mul_NZnI_static_mul[1] = this[1]*v[1];
    $_static_mul_NZnI_static_mul[2] = this[2]*v[2];
    return $_static_mul_NZnI_static_mul;
  }, function static_divide(v) {
    $_static_divide_5DAu_static_divide[0] = this[0]/v[0];
    $_static_divide_5DAu_static_divide[1] = this[1]/v[1];
    $_static_divide_5DAu_static_divide[2] = this[2]/v[2];
    return $_static_divide_5DAu_static_divide;
  }, function static_addScalar(s) {
    $_static_addScalar_sFVK_static_addScalar[0] = this[0]+s;
    $_static_addScalar_sFVK_static_addScalar[1] = this[1]+s;
    $_static_addScalar_sFVK_static_addScalar[2] = this[2]+s;
    return $_static_addScalar_sFVK_static_addScalar;
  }, function static_subScalar(s) {
    $_static_subScalar_TGYr_static_subScalar[0] = this[0]-s;
    $_static_subScalar_TGYr_static_subScalar[1] = this[1]-s;
    $_static_subScalar_TGYr_static_subScalar[2] = this[2]-s;
    return $_static_subScalar_TGYr_static_subScalar;
  }, function static_mulScalar(s) {
    $_static_mulScalar_FwDz_static_mulScalar[0] = this[0]*s;
    $_static_mulScalar_FwDz_static_mulScalar[1] = this[1]*s;
    $_static_mulScalar_FwDz_static_mulScalar[2] = this[2]*s;
    return $_static_mulScalar_FwDz_static_mulScalar;
  }, function _static_divideScalar(s) {
    $_static_divideScalar_7Fss__static_divideScalar[0] = this[0]/s;
    $_static_divideScalar_7Fss__static_divideScalar[1] = this[1]/s;
    $_static_divideScalar_7Fss__static_divideScalar[2] = this[2]/s;
    return $_static_divideScalar_7Fss__static_divideScalar;
  }, function dot(v) {
    return this[0]*v[0]+this[1]*v[1]+this[2]*v[2];
  }, function normalizedDot(v) {
    $n1_Q8Pk_normalizedDot.load(this);
    $n2_XIpQ_normalizedDot.load(v);
    $n1_Q8Pk_normalizedDot.normalize();
    $n2_XIpQ_normalizedDot.normalize();
    return $n1_Q8Pk_normalizedDot.dot($n2_XIpQ_normalizedDot);
  }, _ESClass.static(function normalizedDot4(v1, v2, v3, v4) {
    $_v3nd4_n1_Dv3s_normalizedDot4.load(v2).sub(v1).normalize();
    $_v3nd4_n2_nY15_normalizedDot4.load(v4).sub(v3).normalize();
    return $_v3nd4_n1_Dv3s_normalizedDot4.dot($_v3nd4_n2_nY15_normalizedDot4);
  }), _ESClass.static(function normalizedDot3(v1, v2, v3) {
    $n1_8aqL_normalizedDot3.load(v1).sub(v2).normalize();
    $n2_yZYl_normalizedDot3.load(v3).sub(v2).normalize();
    return $n1_8aqL_normalizedDot3.dot($n2_yZYl_normalizedDot3);
  }), function preNormalizedAngle(v2) {
    if (this.dot(v2)<0.0) {
        var vec=new Vector3();
        vec[0] = -v2[0];
        vec[1] = -v2[1];
        vec[2] = -v2[2];
        return Math.pi-2.0*saasin(vec.vectorDistance(this)/2.0);
    }
    else 
      return 2.0*saasin(v2.vectorDistance(this)/2.0);
  }, function combine(v, ascl, bscl) {
    this[0] = (ascl*this[0])+(bscl*v[0]);
    this[1] = (ascl*this[1])+(bscl*v[1]);
    this[2] = (ascl*this[2])+(bscl*v[2]);
  }, function mulVecQuat(q) {
    var t0=-this[1]*this[0]-this[2]*this[1]-this[3]*this[2];
    var t1=this[0]*this[0]+this[2]*this[2]-this[3]*this[1];
    var t2=this[0]*this[1]+this[3]*this[0]-this[1]*this[2];
    this[2] = this[0]*this[2]+this[1]*this[1]-this[2]*this[0];
    this[0] = t1;
    this[1] = t2;
    t1 = t0*-this[1]+this[0]*this[0]-this[1]*this[3]+this[2]*this[2];
    t2 = t0*-this[2]+this[1]*this[0]-this[2]*this[1]+this[0]*this[3];
    this[2] = t0*-this[3]+this[2]*this[0]-this[0]*this[2]+this[1]*this[1];
    this[0] = t1;
    this[1] = t2;
  }, function multVecMatrix(matrix, ignore_w) {
    if (ignore_w==undefined) {
        ignore_w = false;
    }
    matrix.multVecMatrix(this, ignore_w);
  }, function interp(b, t) {
    this[0]+=(b[0]-this[0])*t;
    this[1]+=(b[1]-this[1])*t;
    this[2]+=(b[2]-this[2])*t;
  }, function toString() {
    return "["+this[0]+","+this[1]+","+this[2]+"]";
  }]);
  var $init_LTTY_Vector3=[0, 0, 0];
  var $_tmp_Ck3K_cross=[0, 0, 0];
  var $vec_YIHW_vectorDistance=new Vector3();
  var $vec_sosG_vectorDotDistance=new Vector3();
  var $add__e6T_static_add=new Vector3();
  var $_static_sub_xx2I_static_sub=new Vector3();
  var $_static_mul_NZnI_static_mul=new Vector3();
  var $_static_divide_5DAu_static_divide=new Vector3();
  var $_static_addScalar_sFVK_static_addScalar=new Vector3();
  var $_static_subScalar_TGYr_static_subScalar=new Vector3();
  var $_static_mulScalar_FwDz_static_mulScalar=new Vector3();
  var $_static_divideScalar_7Fss__static_divideScalar=new Vector3();
  var $n1_Q8Pk_normalizedDot=new Vector3();
  var $_v3nd4_n1_Dv3s_normalizedDot4=new Vector3();
  var $n1_8aqL_normalizedDot3=new Vector3();
  var $n2_XIpQ_normalizedDot=new Vector3();
  var $_v3nd4_n2_nY15_normalizedDot4=new Vector3();
  var $n2_yZYl_normalizedDot3=new Vector3();
  _es6_module.add_class(Vector3);
  var _vec2_init=[0, 0];
  var _v2_static_mvm_co=new Vector3();
  var Vector2=_ESClass("Vector2", Array, [function Vector2(vec) {
    Array.call(this, 2);
    if (vec==undefined)
      vec = _vec2_init;
    if (vec[0]==undefined)
      vec[0] = 0;
    if (vec[1]==undefined)
      vec[1] = 0;
    if (typeof (vec)=="number"||typeof (vec[0])!="number")
      throw new Error("Invalid argument to new Vector2(vec): "+JSON.stringify(vec));
    this[0] = vec[0];
    this[1] = vec[1];
    this.length = 2;
  }, function toJSON() {
    var arr=new Array(this.length);
    var i=0;
    for (var i=0; i<this.length; i++) {
        arr[i] = this[i];
    }
    return arr;
  }, function dot(b) {
    return this[0]*b[0]+this[1]*b[1];
  }, function load(b) {
    this[0] = b[0];
    this[1] = b[1];
    return this;
  }, function zero() {
    this[0] = this[1] = 0.0;
    return this;
  }, function floor() {
    this[0] = Math.floor(this[0]);
    this[1] = Math.floor(this[1]);
    return this;
  }, function ceil() {
    this[0] = Math.ceil(this[0]);
    this[1] = Math.ceil(this[1]);
    return this;
  }, function vectorDistance(b) {
    var x, y;
    x = this[0]-b[0];
    y = this[1]-b[1];
    return Math.sqrt(x*x+y*y);
  }, function vectorLength() {
    return Math.sqrt(this[0]*this[0]+this[1]*this[1]);
  }, function sub(b) {
    this[0]-=b[0];
    this[1]-=b[1];
    return this;
  }, function add(b) {
    this[0]+=b[0];
    this[1]+=b[1];
    return this;
  }, function mul(b) {
    this[0]*=b[0];
    this[1]*=b[1];
    return this;
  }, function divide(b) {
    this[0]/=b[0];
    this[1]/=b[1];
    return this;
  }, function divideScalar(b) {
    this[0]/=b;
    this[1]/=b;
    return this;
  }, function negate() {
    this[0] = -this[0];
    this[1] = -this[1];
    return this;
  }, function mulScalar(b) {
    this[0]*=b;
    this[1]*=b;
    return this;
  }, function addScalar(b) {
    this[0]+=b;
    this[1]+=b;
    return this;
  }, function subScalar(b) {
    this[0]-=b;
    this[1]-=b;
    return this;
  }, function multVecMatrix(mat) {
    var v3=_v2_static_mvm_co;
    v3[0] = this[0];
    v3[1] = this[1];
    v3[2] = 0.0;
    v3.multVecMatrix(mat);
    this[0] = v3[0];
    this[1] = v3[1];
    return this;
  }, function normalize() {
    var vlen=this.vectorLength();
    if (vlen<FLT_EPSILON) {
        this[0] = this[1] = 0.0;
        return ;
    }
    this[0]/=vlen;
    this[1]/=vlen;
    return this;
  }, function toSource() {
    return "new Vector2(["+this[0]+", "+this[1]+"])";
  }, function toString() {
    return "["+this[0]+", "+this[1]+"]";
  }, function interp(b, t) {
    this[0]+=(b[0]-this[0])*t;
    this[1]+=(b[1]-this[1])*t;
  }]);
  _es6_module.add_class(Vector2);
  function Color(color) {
    var c=new Array();
    c[0] = color[0];
    c[1] = color[1];
    c[2] = color[2];
    c[3] = color[3];
    return c;
  }
  var Vector4=_ESClass("Vector4", Array, [function Vector4(x, y, z, w) {
    Array.call(this, 4);
    this.length = 4;
    this.load(x, y, z, w);
  }, function toCSS() {
    var r=~~(this[0]*255);
    var g=~~(this[1]*255);
    var b=~~(this[2]*255);
    var a=this[3];
    return "rgba("+r+","+g+","+b+","+a+")";
  }, function toJSON() {
    var arr=new Array(this.length);
    var i=0;
    for (var i=0; i<this.length; i++) {
        arr[i] = this[i];
    }
    return arr;
  }, function load(x, y, z, w) {
    if (typeof x=='object'&&"length" in x) {
        this[0] = x[0];
        this[1] = x[1];
        this[2] = x[2];
        this[3] = x[3];
    }
    else 
      if (typeof x=='number') {
        this[0] = x;
        this[1] = y;
        this[2] = z;
        this[3] = w;
    }
    else {
      this[0] = 0;
      this[1] = 0;
      this[2] = 0;
      this[3] = 0;
    }
    return this;
  }, function floor() {
    this[0] = Math.floor(this[0]);
    this[1] = Math.floor(this[1]);
    this[2] = Math.floor(this[2]);
    this[3] = Math.floor(this[3]);
    return this;
  }, function ceil() {
    this[0] = Math.ceil(this[0]);
    this[1] = Math.ceil(this[1]);
    this[2] = Math.ceil(this[2]);
    this[3] = Math.ceil(this[3]);
    return this;
  }, function getAsArray() {
    return [this[0], this[1], this[2], this[3]];
  }, function getAsFloat32Array() {
    return new Float32Array(this.getAsArray());
  }, function vectorLength() {
    return Math.sqrt(this[0]*this[0]+this[1]*this[1]+this[2]*this[2]+this[3]*this[3]);
  }, function normalize() {
    var len=this.vectorLength();
    if (len>FLT_EPSILON)
      this.mulScalar(1.0/len);
    return len;
  }, function divide(divisor) {
    this[0]/=divisor;
    this[1]/=divisor;
    this[2]/=divisor;
    this[3]/=divisor;
  }, function negate() {
    this[0] = -this[0];
    this[1] = -this[1];
    this[2] = -this[2];
    this[3] = -this[3];
    return this;
  }, function mulScalar(scalar) {
    this[0]*=scalar;
    this[1]*=scalar;
    this[2]*=scalar;
    this[3]*=scalar;
    return this;
  }, function mul(scalar) {
    this[0] = this[0]*v[0];
    this[1] = this[1]*v[1];
    this[2] = this[2]*v[2];
    this[3] = this[3]*v[3];
  }, function cross(v) {
    this[0] = this[1]*v[2]-this[2]*v[1];
    this[1] = -this[0]*v[2]+this[2]*v[0];
    this[2] = this[0]*v[1]-this[1]*v[0];
  }, function sub(v) {
    this[0] = this[0]-v[0];
    this[1] = this[1]-v[1];
    this[2] = this[2]-v[2];
    this[3] = this[3]-v[3];
  }, function add(v) {
    this[0] = this[0]+v[0];
    this[1] = this[1]+v[1];
    this[2] = this[2]+v[2];
    this[3] = this[3]+v[3];
  }, function dot(v) {
    return this[0]*v[0]+this[1]*v[1]+this[2]*v[2]+this[3]*v[3];
  }, function combine(v, ascl, bscl) {
    this[0] = (ascl*this[0])+(bscl*v[0]);
    this[1] = (ascl*this[1])+(bscl*v[1]);
    this[2] = (ascl*this[2])+(bscl*v[2]);
    this[3] = (ascl*this[3])+(bscl*v[3]);
  }, function multVecMatrix(matrix) {
    var x=this[0];
    var y=this[1];
    var z=this[2];
    var w=this[3];
    this[0] = matrix.$matrix.m41+x*matrix.$matrix.m11+y*matrix.$matrix.m21+z*matrix.$matrix.m31+w*matrix.$matrix.m41;
    this[1] = matrix.$matrix.m42+x*matrix.$matrix.m12+y*matrix.$matrix.m22+z*matrix.$matrix.m32+w*matrix.$matrix.m42;
    this[2] = matrix.$matrix.m43+x*matrix.$matrix.m13+y*matrix.$matrix.m23+z*matrix.$matrix.m33+w*matrix.$matrix.m43;
    this[3] = w*matrix.$matrix.m44+x*matrix.$matrix.m14+y*matrix.$matrix.m24+z*matrix.$matrix.m34;
    return w;
  }, function interp(b, t) {
    this[0]+=(b[0]-this[0])*t;
    this[1]+=(b[1]-this[1])*t;
    this[2]+=(b[2]-this[2])*t;
    this[3]+=(b[3]-this[3])*t;
  }, function toString() {
    return "["+this[0]+","+this[1]+","+this[2]+","+this[3]+"]";
  }]);
  _es6_module.add_class(Vector4);
  var $v4init_Xr9F_Quat;
  var Quat=_ESClass("Quat", Vector4, [function Quat(x, y, z, w) {
    var vec=$v4init_Xr9F_Quat;
    if (typeof (x)=="number") {
        $v4init_Xr9F_Quat[0] = x;
        $v4init_Xr9F_Quat[1] = y;
        $v4init_Xr9F_Quat[2] = z;
        $v4init_Xr9F_Quat[3] = w;
    }
    else {
      vec = x;
    }
    Vector4.call(this, vec);
  }, function load(x, y, z, w) {
    if (typeof x=='object'&&"length" in x) {
        this[0] = x[0];
        this[1] = x[1];
        this[2] = x[2];
        this[3] = x[3];
    }
    else 
      if (typeof x=='number') {
        this[0] = x;
        this[1] = y;
        this[2] = z;
        this[3] = w;
    }
    else {
      this[0] = 0;
      this[1] = 0;
      this[2] = 0;
      this[3] = 0;
    }
  }, function makeUnitQuat() {
    this[0] = 1.0;
    this[1] = this[2] = this[3] = 0.0;
  }, function isZero() {
    return (this[0]==0&&this[1]==0&&this[2]==0&&this[3]==0);
  }, function mulQuat(q2) {
    var t0=this[0]*q2[0]-this[1]*q2[1]-this[2]*q2[2]-this[3]*q2[3];
    var t1=this[0]*q2[1]+this[1]*q2[0]+this[2]*q2[3]-this[3]*q2[2];
    var t2=this[0]*q2[2]+this[2]*q2[0]+this[3]*q2[1]-this[1]*q2[3];
    this[3] = this[0]*q2[3]+this[3]*q2[0]+this[1]*q2[2]-this[2]*q2[1];
    this[0] = t0;
    this[1] = t1;
    this[2] = t2;
  }, function conjugate() {
    this[1] = -this[1];
    this[2] = -this[2];
    this[3] = -this[3];
  }, function dotWithQuat(q2) {
    return this[0]*q2[0]+this[1]*q2[1]+this[2]*q2[2]+this[3]*q2[3];
  }, function invert() {
    var f=this.dot();
    if (f==0.0)
      return ;
    conjugate_qt(q);
    this.mulscalar(1.0/f);
  }, function sub(q2) {
    var nq2=new Quat();
    nq2[0] = -q2[0];
    nq2[1] = q2[1];
    nq2[2] = q2[2];
    nq2[3] = q2[3];
    this.mul(nq2);
  }, function mulScalarWithFactor(fac) {
    var angle=fac*saacos(this[0]);
    var co=Math.cos(angle);
    var si=Math.sin(angle);
    this[0] = co;
    var last3=Vector3([this[1], this[2], this[3]]);
    last3.normalize();
    last3.mulScalar(si);
    this[1] = last3[0];
    this[2] = last3[1];
    this[3] = last3[2];
    return this;
  }, function toMatrix() {
    var m=new Matrix4();
    var q0=M_SQRT2*this[0];
    var q1=M_SQRT2*this[1];
    var q2=M_SQRT2*this[2];
    var q3=M_SQRT2*this[3];
    var qda=q0*q1;
    var qdb=q0*q2;
    var qdc=q0*q3;
    var qaa=q1*q1;
    var qab=q1*q2;
    var qac=q1*q3;
    var qbb=q2*q2;
    var qbc=q2*q3;
    var qcc=q3*q3;
    m.$matrix.m11 = (1.0-qbb-qcc);
    m.$matrix.m12 = (qdc+qab);
    m.$matrix.m13 = (-qdb+qac);
    m.$matrix.m14 = 0.0;
    m.$matrix.m21 = (-qdc+qab);
    m.$matrix.m22 = (1.0-qaa-qcc);
    m.$matrix.m23 = (qda+qbc);
    m.$matrix.m24 = 0.0;
    m.$matrix.m31 = (qdb+qac);
    m.$matrix.m32 = (-qda+qbc);
    m.$matrix.m33 = (1.0-qaa-qbb);
    m.$matrix.m34 = 0.0;
    m.$matrix.m41 = m.$matrix.m42 = m.$matrix.m43 = 0.0;
    m.$matrix.m44 = 1.0;
    return m;
  }, function matrixToQuat(wmat) {
    var mat=new Matrix4(wmat);
    mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
    mat.$matrix.m44 = 1.0;
    var r1=new Vector3([mat.$matrix.m11, mat.$matrix.m12, mat.$matrix.m13]);
    var r2=new Vector3([mat.$matrix.m21, mat.$matrix.m22, mat.$matrix.m23]);
    var r3=new Vector3([mat.$matrix.m31, mat.$matrix.m32, mat.$matrix.m33]);
    r1.normalize();
    r2.normalize();
    r3.normalize();
    mat.$matrix.m11 = r1[0];
    mat.$matrix.m12 = r1[1];
    mat.$matrix.m13 = r1[2];
    mat.$matrix.m21 = r2[0];
    mat.$matrix.m22 = r2[1];
    mat.$matrix.m23 = r2[2];
    mat.$matrix.m31 = r3[0];
    mat.$matrix.m32 = r3[1];
    mat.$matrix.m33 = r3[2];
    var tr=0.25*(1.0+mat[0][0]+mat[1][1]+mat[2][2]);
    var s=0;
    if (tr>FLT_EPSILON) {
        s = Math.sqrt(tr);
        this[0] = s;
        s = 1.0/(4.0*s);
        this[1] = ((mat[1][2]-mat[2][1])*s);
        this[2] = ((mat[2][0]-mat[0][2])*s);
        this[3] = ((mat[0][1]-mat[1][0])*s);
    }
    else {
      if (mat[0][0]>mat[1][1]&&mat[0][0]>mat[2][2]) {
          s = 2.0*Math.sqrt(1.0+mat[0][0]-mat[1][1]-mat[2][2]);
          this[1] = (0.25*s);
          s = 1.0/s;
          this[0] = ((mat[2][1]-mat[1][2])*s);
          this[2] = ((mat[1][0]+mat[0][1])*s);
          this[3] = ((mat[2][0]+mat[0][2])*s);
      }
      else 
        if (mat[1][1]>mat[2][2]) {
          s = 2.0*Math.sqrt(1.0+mat[1][1]-mat[0][0]-mat[2][2]);
          this[2] = (0.25*s);
          s = 1.0/s;
          this[0] = ((mat[2][0]-mat[0][2])*s);
          this[1] = ((mat[1][0]+mat[0][1])*s);
          this[3] = ((mat[2][1]+mat[1][2])*s);
      }
      else {
        s = 2.0*Math.sqrt(1.0+mat[2][2]-mat[0][0]-mat[1][1]);
        this[3] = (0.25*s);
        s = 1.0/s;
        this[0] = ((mat[1][0]-mat[0][1])*s);
        this[1] = ((mat[2][0]+mat[0][2])*s);
        this[2] = ((mat[2][1]+mat[1][2])*s);
      }
    }
    this.normalize();
  }, function normalize() {
    var len=Math.sqrt(this.dot(this));
    if (len!=0.0) {
        this.mulScalar(1.0/len);
    }
    else {
      this[1] = 1.0;
      this[0] = this[2] = this[3] = 0.0;
    }
    return len;
  }, function axisAngleToQuat(axis, angle) {
    var nor=new Vector3(axis);
    if (nor.normalize()!=0.0) {
        var phi=angle/2.0;
        var si=Math.sin(phi);
        this[0] = Math.cos(phi);
        this[1] = nor[0]*si;
        this[2] = nor[1]*si;
        this[3] = nor[2]*si;
    }
    else {
      this.makeUnitQuat();
    }
  }, function rotationBetweenVecs(v1, v2) {
    v1 = new Vector3(v1);
    v2 = new Vector3(v2);
    v1.normalize();
    v2.normalize();
    var axis=new Vector3(v1);
    axis.cross(v2);
    var angle=v1.preNormalizedAngle(v2);
    this.axisAngleToQuat(axis, angle);
  }, function quatInterp(quat2, t) {
    var quat=new Quat();
    var cosom=this[0]*quat2[0]+this[1]*quat2[1]+this[2]*quat2[2]+this[3]*quat2[3];
    if (cosom<0.0) {
        cosom = -cosom;
        quat[0] = -this[0];
        quat[1] = -this[1];
        quat[2] = -this[2];
        quat[3] = -this[3];
    }
    else {
      quat[0] = this[0];
      quat[1] = this[1];
      quat[2] = this[2];
      quat[3] = this[3];
    }
    var omega, sinom, sc1, sc2;
    if ((1.0-cosom)>0.0001) {
        omega = Math.acos(cosom);
        sinom = Math.sin(omega);
        sc1 = Math.sin((1.0-t)*omega)/sinom;
        sc2 = Math.sin(t*omega)/sinom;
    }
    else {
      sc1 = 1.0-t;
      sc2 = t;
    }
    this[0] = sc1*quat[0]+sc2*quat2[0];
    this[1] = sc1*quat[1]+sc2*quat2[1];
    this[2] = sc1*quat[2]+sc2*quat2[2];
    this[3] = sc1*quat[3]+sc2*quat2[3];
  }]);
  var $v4init_Xr9F_Quat=[0, 0, 0, 0];
  _es6_module.add_class(Quat);
  window.Vector2 = Vector2;
  window.Vector3 = Vector3;
  window.Vector4 = Vector4;
  window.Quat = Quat;
  window.Matrix4 = Matrix4;
});
"not_a_module";
function testr(obj) {
  var __gen_this2=this;
  function _generator_iter() {
    this.scope = {obj_0: obj, __iter_k_1: undefined, k_1: undefined}
    this.ret = {done: false, value: undefined}
    this.state = 1;
    this.trystack = [];
    this.next = function() {
      var ret;
      var stack=this.trystack;
      try {
        ret = this._next();
      }
      catch (err) {
          if (stack.length>0) {
              var item=stack.pop(stack.length-1);
              this.state = item[0];
              this.scope[item[1]] = err;
              return this.next();
          }
          else {
            throw err;
          }
      }
      return ret;
    }
    this.push_trystack = function(catchstate, catchvar) {
      this.trystack.push([catchstate, catchvar]);
    }
    this.pop_trystack = function() {
      this.trystack.pop(this.trystack.length-1);
    }
    this._next = function() {
      var $__ret=undefined;
      var $__state=this.state;
      var scope=this.scope;
      while ($__state<8) {
        switch ($__state) {
          case 0:
            break;
          case 1:
            scope.__iter_k_1=__get_in_iter(scope.obj_0);
            scope.k_1;
            
            $__state = 2;
            break;
          case 2:
            $__state = (1) ? 3 : 8;
            break;
          case 3:
            scope.__ival_k_3=scope.__iter_k_1.next();
            
            $__state = 4;
            break;
          case 4:
            $__state = (scope.__ival_k_3.done) ? 5 : 6;
            break;
          case 5:
            $__state = 8;
            break;
            
            $__state = 6;
            break;
          case 6:
            scope.k_1 = scope.__ival_k_3.value;
            
            $__state = 7;
            break;
          case 7:
            $__ret = this.ret;
            $__ret.value = scope.k_1;
            
            $__state = 2;
            break;
          case 8:
            break;
          default:
            console.log("Generator state error");
            console.trace();
            break;
        }
        if ($__ret!=undefined) {
            break;
        }
      }
      if ($__ret!=undefined) {
          this.ret.value = $__ret.value;
      }
      else {
        this.ret.done = true;
        this.ret.value = undefined;
      }
      this.state = $__state;
      return this.ret;
    }
    this[Symbol.iterator] = function() {
      return this;
    }
    this.forEach = function(callback, thisvar) {
      if (thisvar==undefined)
        thisvar = self;
      var _i=0;
      while (1) {
        var ret=this.next();
        if (ret==undefined||ret.done||(ret._ret!=undefined&&ret._ret.done))
          break;
        callback.call(thisvar, ret.value);
        if (_i++>100) {
            console.log("inf loop", ret);
            break;
        }
      }
    }
  }
  return new _generator_iter();
}
if (Math.sign==undefined) {
    Math.sign = function(f) {
      return 1.0-(f<0.0)*2.0;
    };
}
if (Math.fract==undefined) {
    Math.fract = function(f) {
      f = Math.abs(f);
      return f-Math.floor(f);
    };
}
if (Array.prototype.insert==undefined) {
    Array.prototype.insert = function(before, item) {
      if (before<0||before>this.length) {
          throw new Error("Bad index "+before+", should be between 0-"+this.length+".");
      }
      this.push(0);
      for (var i=this.length-1; i>before; i--) {
          this[i] = this[i-1];
      }
      this[before] = item;
      return this;
    };
}
var Iter=_ESClass("Iter", [function reset() {
}, function next() {
}, function Iter() {
}]);
var CanIter=_ESClass("CanIter", [_ESClass.symbol(Symbol.iterator, function iterator() {
}), function CanIter() {
}]);
var debug_int_1=0;
var $args_fromConstructor;
var cachering=_ESClass("cachering", Array, [function cachering(createcallback, count) {
  if (count==undefined) {
      count = 32;
  }
  Array.call(this, count);
  this._cur = 0;
  this.length = count;
  for (var i=0; i<count; i++) {
      this[i] = createcallback();
  }
}, function next() {
  var ret=this[this._cur];
  this._cur = (this._cur+1)%this.length;
  return ret;
}, _ESClass.static(function fromConstructor(cls, count) {
  if (count==undefined) {
      count = 32;
  }
  $args_fromConstructor.length = 0;
  for (var i=1; i<arguments.length; i++) {
      $args_fromConstructor.push(arguments[i]);
  }
  function callback() {
    var ret=new cls();
    cls.apply(ret, arguments);
    return ret;
  }
  return new cachering(callback, count);
})]);
var $args_fromConstructor=[];

var GArray=_ESClass("GArray", Array, [function GArray(input) {
  Array.call(this);
  if (input!=undefined) {
      for (var i=0; i<input.length; i++) {
          this.push(input[i]);
      }
  }
}, function slice(a, b) {
  var ret=Array.prototype.slice.call(this, a, b);
  if (!(__instance_of(ret, GArray)))
    ret = new GArray(ret);
  return ret;
}, function pack(data) {
  _ajax.pack_int(data, this.length);
  for (var i=0; i<this.length; i++) {
      this[i].pack(data);
  }
}, function has(item) {
  return this.indexOf(item)>=0;
}, _ESClass.symbol(Symbol.iterator, function iterator() {
  if (this.itercache==undefined) {
      this.itercache = cachering.fromConstructor(GArrayIter, 8);
  }
  var iter=this.itercache.next();
  iter.init(this);
  return iter;
  return new GArrayIter(this);
}), function toJSON() {
  var arr=new Array(this.length);
  var i=0;
  for (var i=0; i<this.length; i++) {
      arr[i] = this[i];
  }
  return arr;
}, function insert(index, item) {
  for (var i=this.length; i>index; i--) {
      this[i] = this[i-1];
  }
  this[index] = item;
  this.length++;
}, function prepend(item) {
  this.insert(0, item);
}, function pop_i(idx) {
  if (idx==undefined) {
      idx = -1;
  }
  if (idx<0)
    idx+=this.length;
  var ret=this[i];
  for (var i=idx; i<this.length-1; i++) {
      this[i] = this[i+1];
  }
  this.length-=1;
  return ret;
}, function remove(item, ignore_existence) {
  var idx=this.indexOf(item);
  if (ignore_existence==undefined)
    ignore_existence = false;
  if (idx<0||idx==undefined) {
      console.log("Yeek! Item "+item+" not in array");
      console.trace();
      if (!ignore_existence) {
          console.trace();
          throw "Yeek! Item "+item+" not in array";
      }
      return ;
  }
  for (var i=idx; i<this.length-1; i++) {
      this[i] = this[i+1];
  }
  this.length-=1;
}, function replace(olditem, newitem) {
  var idx=this.indexOf(olditem);
  if (idx<0||idx==undefined) {
      console.trace("Yeek! Item "+olditem+" not in array");
      return ;
  }
  this[idx] = newitem;
}, function toSource() {
  var s="new GArray"+this.length+"([";
  for (var i=0; i<this.length; i++) {
      s+=this[i];
      if (i!=this.length-1)
        s+=", ";
  }
  s+="])";
  return s;
}, function toString() {
  var s="[GArray: ";
  for (var i=0; i<this.length; i++) {
      s+=this[i];
      if (i!=this.length-1)
        s+=", ";
  }
  s+="])";
  return s;
}, function reset() {
  this.length = 0;
}]);

window.defined_classes = new GArray(window.defined_classes);
function obj_value_iter(obj) {
  this.ret = {done: false, value: undefined}
  this.obj = obj;
  this.iter = Iterator(obj);
  this.next = function() {
    var reti=this.ret;
    var ret=this.iter.next();
    if (ret.done)
      return ret;
    reti.value = ret.value[1];
    return reti;
  }
  this[Symbol.iterator] = function() {
    return this;
  }
}
function list(iter) {
  var lst=new GArray();
  var i=0;
  var __iter_item=__get_iter(iter);
  var item;
  while (1) {
    var __ival_item=__iter_item.next();
    if (__ival_item.done) {
        break;
    }
    item = __ival_item.value;
    lst.push(item);
    i++;
  }
  lst.length = i;
  return lst;
}
function time_func(func, steps) {
  if (steps==undefined) {
      steps = 10;
  }
  var times=[];
  for (var i=0; i<steps; i++) {
      var last_ms=time_ms();
      func();
      times.push(time_ms()-last_ms);
  }
  console.log(times);
  return times;
}
var $lst_A5CR=new GArray();
function cached_list(iter) {
  $lst_A5CR.reset();
  var i=0;
  var __iter_item=__get_iter(iter);
  var item;
  while (1) {
    var __ival_item=__iter_item.next();
    if (__ival_item.done) {
        break;
    }
    item = __ival_item.value;
    $lst_A5CR.push(item);
    i++;
  }
  $lst_A5CR.length = i;
  return $lst_A5CR;
}
var g_list=list;
var eid_list=_ESClass("eid_list", GArray, [function eid_list(iter) {
  GArray.call(this);
  var __iter_item=__get_iter(iter);
  var item;
  while (1) {
    var __ival_item=__iter_item.next();
    if (__ival_item.done) {
        break;
    }
    item = __ival_item.value;
    this.push([item.type, item.eid]);
  }
  return lst;
}]);
Number.prototype[Symbol.keystr] = function() {
  return this;
};
String.prototype[Symbol.keystr] = function() {
  return this;
};
Array.prototype[Symbol.keystr] = function() {
  var s="";
  for (var i=0; i<this.length; i++) {
      s+=this[i][Symbol.keystr]()+"|";
  }
  return s;
};
var _set_null={set_null: true};
var SetIter=_ESClass("SetIter", [function SetIter(set) {
  this.set = set;
  this.i = 0;
  this.done = false;
  this.ret = {done: false, value: undefined}
  this.list = set.list;
}, _ESClass.symbol(Symbol.iterator, function iterator() {
  return this;
}), function cache_init() {
  this.i = 0;
  this.ret.done = false;
  this.done = false;
  this.ret.value = undefined;
  this.list = this.set.list;
  return this;
}, _ESClass.symbol("return", function() {
  this.done = true;
  this.ret.done = true;
}), function next() {
  var list=this.list;
  var len=list.length;
  while (this.i<len&&list[this.i]===_set_null) {
    this.i++;
  }
  if (this.i>=len) {
      this.ret.done = this.done = true;
      this.ret.value = undefined;
      return this.ret;
  }
  this.ret.value = list[this.i];
  this.i++;
  return this.ret;
}, function reset() {
  this.cache_init();
}]);
var set=_ESClass("set", [function set(input) {
  this.items = {}
  this.list = [];
  this.freelist = [];
  this.length = 0;
  var this2=this;
  this._itercache = new cachering(function() {
    return new SetIter(this2);
  }, 64);
  if (input!=undefined) {
      if (__instance_of(input, Array)||__instance_of(input, String)) {
          for (var i=0; i<input.length; i++) {
              this.add(input[i]);
          }
      }
      else {
        var __iter_item=__get_iter(input);
        var item;
        while (1) {
          var __ival_item=__iter_item.next();
          if (__ival_item.done) {
              break;
          }
          item = __ival_item.value;
          this.add(item);
        }
      }
  }
}, function reset() {
  this.list.length = 0;
  this.freelist.length = 0;
  for (var k in this.items) {
      delete this.items[k];
  }
  this.length = 0;
  return this;
}, function forEach(cb, thisvar) {
  if (thisvar==undefined)
    thisvar = self;
  var __iter_item=__get_iter(this);
  var item;
  while (1) {
    var __ival_item=__iter_item.next();
    if (__ival_item.done) {
        break;
    }
    item = __ival_item.value;
    cb.call(thisvar, item);
  }
}, function add(item) {
  var hash=item[Symbol.keystr]();
  if (hash in this.items)
    return ;
  var i;
  if (this.freelist.length>0) {
      i = this.freelist.pop();
      this.list[i] = item;
  }
  else {
    i = this.list.length;
    this.list.push(item);
  }
  this.items[hash] = i;
  this.length++;
}, function remove(item) {
  var hash=item[Symbol.keystr]();
  if (!(hash in this.items))
    return ;
  var i=this.items[hash];
  this.list[i] = _set_null;
  this.freelist.push(i);
  delete this.items[hash];
  this.length--;
  return item;
}, function has(item) {
  var hash=item[Symbol.keystr]();
  return hash in this.items;
}, function union(set2) {
  var ret=new set();
  var __iter_item=__get_iter(this);
  var item;
  while (1) {
    var __ival_item=__iter_item.next();
    if (__ival_item.done) {
        break;
    }
    item = __ival_item.value;
    ret.add(item);
  }
  var __iter_item=__get_iter(set2);
  var item;
  while (1) {
    var __ival_item=__iter_item.next();
    if (__ival_item.done) {
        break;
    }
    item = __ival_item.value;
    ret.add(item);
  }
  return ret;
}, _ESClass.symbol(Symbol.iterator, function iterator() {
  return this._itercache.next().cache_init(this);
}), function asArray() {
  var arr=new Array(this.length);
  var __iter_item=__get_iter(this);
  var item;
  while (1) {
    var __ival_item=__iter_item.next();
    if (__ival_item.done) {
        break;
    }
    item = __ival_item.value;
    arr[i++] = item;
  }
  return arr;
}, function toJSON() {
  return this.asArray();
}, function toSource() {
  return "new set("+list(this).toSource()+")";
}]);
var GArrayIter=_ESClass("GArrayIter", [function GArrayIter(arr) {
  this.ret = {done: false, value: undefined}
  this.arr = arr;
  this.cur = 0;
}, function init(arr) {
  this.ret.done = false;
  this.ret.value = undefined;
  this.arr = arr;
  this.cur = 0;
  return this;
}, function next() {
  var reti=this.ret;
  if (this.cur>=this.arr.length) {
      this.cur = 0;
      this.ret = {done: false, value: undefined};
      reti.done = true;
      return reti;
  }
  else {
    reti.value = this.arr[this.cur++];
    return reti;
  }
}, function reset() {
  this.ret = {done: false, value: undefined}
  this.cur = 0;
}]);
var ArrayIter=_ESClass("ArrayIter", [function ArrayIter(arr) {
  this.ret = {done: false, value: undefined}
  this.arr = arr;
  this.cur = 0;
}, function init(arr) {
  this.ret.done = false;
  this.ret.value = undefined;
  this.arr = arr;
  this.cur = 0;
  return this;
}, function next() {
  var reti=this.ret;
  if (this.cur>=this.arr.length) {
      this.cur = 0;
      this.ret = {done: false, value: undefined};
      reti.done = true;
      return reti;
  }
  else {
    reti.value = this.arr[this.cur++];
    return reti;
  }
}, function reset() {
  this.ret = {done: false, value: undefined}
  this.cur = 0;
}]);
Array.prototype[Symbol.iterator] = function() {
  if (this.itercache==undefined) {
      this.itercache = cachering.fromConstructor(ArrayIter, 8);
  }
  return this.itercache.next().init(this);
};
var HashKeyIter=_ESClass("HashKeyIter", [function HashKeyIter(hash) {
  this.ret = {done: false, value: undefined}
  this.hash = hash;
  this.iter = Iterator(hash.items);
}, function next() {
  var reti=this.ret;
  var iter=this.iter;
  var items=this.hash.items;
  var item=iter.next();
  if (item.done)
    return item;
  while (!items.hasOwnProperty(item.value[0])) {
    if (item.done)
      return item;
    item = iter.next();
  }
  reti.value = this.hash.keymap[item.value[0]];
  return reti;
}]);
var hashtable=_ESClass("hashtable", [function hashtable() {
  this.items = {}
  this.keymap = {}
  this.length = 0;
}, function reset() {
  this.items = {}
  this.keymap = {}
  this.length = 0;
}, function add(key, item) {
  if (!this.items.hasOwnProperty(key[Symbol.keystr]()))
    this.length++;
  this.items[key[Symbol.keystr]()] = item;
  this.keymap[key[Symbol.keystr]()] = key;
}, function remove(key) {
  delete this.items[key[Symbol.keystr]()];
  delete this.keymap[key[Symbol.keystr]()];
  this.length-=1;
}, _ESClass.symbol(Symbol.iterator, function iterator() {
  return Object.keys(this.items)[Symbol.iterator]();
}), function values() {
  var ret=new Array();
  var __iter_k=__get_iter(this);
  var k;
  while (1) {
    var __ival_k=__iter_k.next();
    if (__ival_k.done) {
        break;
    }
    k = __ival_k.value;
    ret.push(this.items[k]);
  }
  return ret;
}, function keys() {
  return list(this);
}, function get(key) {
  return this.items[key[Symbol.keystr]()];
}, function set(key, item) {
  if (!this.has(key)) {
      this.length++;
  }
  this.items[key[Symbol.keystr]()] = item;
  this.keymap[key[Symbol.keystr]()] = key;
}, function union(b) {
  var newhash=new hashtable(this);
  var __iter_item=__get_iter(b);
  var item;
  while (1) {
    var __ival_item=__iter_item.next();
    if (__ival_item.done) {
        break;
    }
    item = __ival_item.value;
    newhash.add(item, b.get[item]);
  }
  return newhash;
}, function has(item) {
  if (item==undefined)
    console.trace();
  return this.items.hasOwnProperty(item[Symbol.keystr]());
}]);
function validate_mesh_intern(m) {
  var eidmap={}
  var __iter_f=__get_iter(m.faces);
  var f;
  while (1) {
    var __ival_f=__iter_f.next();
    if (__ival_f.done) {
        break;
    }
    f = __ival_f.value;
    var lset=new set();
    var eset=new set();
    var vset=new set();
    var __iter_v=__get_iter(f.verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      if (vset.has(v)) {
          console.trace();
          console.log("Warning: found same vert multiple times in a face");
      }
      vset.add(v);
    }
    var __iter_e=__get_iter(f.edges);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      if (eset.has(e)) {
          console.trace();
          console.log("Warning: found same edge multiple times in a face");
      }
      eset.add(e);
    }
    var __iter_loops=__get_iter(f.looplists);
    var loops;
    while (1) {
      var __ival_loops=__iter_loops.next();
      if (__ival_loops.done) {
          break;
      }
      loops = __ival_loops.value;
      var __iter_l=__get_iter(loops);
      var l;
      while (1) {
        var __ival_l=__iter_l.next();
        if (__ival_l.done) {
            break;
        }
        l = __ival_l.value;
        var e=l.e;
        var v1=l.v, v2=l.next.v;
        if (!(v1==e.v1&&v2==e.v2)&&!(v1==e.v2&&v2==e.v1)) {
            console.log("lerror with edge "+e.eid+", and loop "+l.eid);
            console.log("loop doesn't match edge");
            return false;
        }
        if (lset.has(l)) {
            console.trace();
            return false;
        }
        lset.add(l);
      }
    }
  }
  var __iter_v=__get_iter(m.verts);
  var v;
  while (1) {
    var __ival_v=__iter_v.next();
    if (__ival_v.done) {
        break;
    }
    v = __ival_v.value;
    if (v._gindex==-1) {
        console.trace();
        return false;
    }
    if (v.loop!=null&&v.loop.f._gindex==-1) {
        console.trace();
        return false;
    }
    var __iter_e=__get_iter(v.edges);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      if (e._gindex==-1) {
          console.trace();
          return false;
      }
      if (!e.vert_in_edge(v)) {
          console.trace();
          return false;
      }
    }
  }
  var __iter_e=__get_iter(m.edges);
  var e;
  while (1) {
    var __ival_e=__iter_e.next();
    if (__ival_e.done) {
        break;
    }
    e = __ival_e.value;
    if (e._gindex==-1) {
        console.trace();
        return false;
    }
    var i=0;
    var lset=new set();
    var fset=new set();
    if (e.loop==null)
      continue;
    var l=e.loop;
    do {
      if (lset.has(l)) {
          console.trace();
          return false;
      }
      lset.add(l);
      if (fset.has(l.f)) {
          console.trace();
          console.log("Warning: found the same face multiple times in an edge's radial list");
      }
      fset.add(l.f);
      i++;
      if (i==10000) {
          console.trace();
          return false;
      }
      if (l.f._gindex==-1) {
          console.trace();
          console.log("error with edge "+e.eid);
          return false;
      }
      var v1=l.v, v2=l.next.v;
      if (!(v1==e.v1&&v2==e.v2)&&!(v1==e.v2&&v2==e.v1)) {
          console.log("error with edge "+e.eid+", and loop "+l.eid);
          console.log("loop doesn't match edge");
          return false;
      }
      l = l.radial_next;
    } while (l!=e.loop);
    
  }
  var __iter_v=__get_iter(m.verts);
  var v;
  while (1) {
    var __ival_v=__iter_v.next();
    if (__ival_v.done) {
        break;
    }
    v = __ival_v.value;
    eidmap[v.eid] = v;
  }
  var __iter_e=__get_iter(m.edges);
  var e;
  while (1) {
    var __ival_e=__iter_e.next();
    if (__ival_e.done) {
        break;
    }
    e = __ival_e.value;
    eidmap[e.eid] = v;
  }
  var __iter_f=__get_iter(m.faces);
  var f;
  while (1) {
    var __ival_f=__iter_f.next();
    if (__ival_f.done) {
        break;
    }
    f = __ival_f.value;
    eidmap[f.eid] = v;
  }
  for (var k in m.eidmap) {
      if (!(k in eidmap)) {
          console.trace();
          return true;
      }
  }
  for (var k in eidmap) {
      if (!(k in m.eidmap)) {
          console.trace();
          return true;
      }
  }
  return true;
}
function fix_object_mesh(ob) {
  var mesh=ob.data;
  var mesh2=new Mesh();
  mesh.verts.index_update();
  mesh.edges.index_update();
  mesh.faces.index_update();
  var eidmap={}
  var verts=[];
  var vset=new set();
  var __iter_v=__get_iter(mesh.verts);
  var v;
  while (1) {
    var __ival_v=__iter_v.next();
    if (__ival_v.done) {
        break;
    }
    v = __ival_v.value;
    var v2=mesh2.make_vert(v.co, v.no);
    mesh2.copy_vert_data(v2, v, true);
    verts.push(v2);
    vset.add(v2);
  }
  var edges=[];
  var __iter_e=__get_iter(mesh.edges);
  var e;
  while (1) {
    var __ival_e=__iter_e.next();
    if (__ival_e.done) {
        break;
    }
    e = __ival_e.value;
    var v1=verts[e.v1.index], v2=verts[e.v2.index];
    var e2=mesh2.make_edge(v1, v2, false);
    mesh2.copy_edge_data(e2, e, true);
    edges.push(e2);
  }
  var __iter_f=__get_iter(mesh.faces);
  var f;
  while (1) {
    var __ival_f=__iter_f.next();
    if (__ival_f.done) {
        break;
    }
    f = __ival_f.value;
    var vlists=new GArray();
    var vset2=new set();
    var __iter_list_0=__get_iter(f.looplists);
    var list_0;
    while (1) {
      var __ival_list_0=__iter_list_0.next();
      if (__ival_list_0.done) {
          break;
      }
      list_0 = __ival_list_0.value;
      var vs=new GArray();
      var __iter_l=__get_iter(list_0);
      var l;
      while (1) {
        var __ival_l=__iter_l.next();
        if (__ival_l.done) {
            break;
        }
        l = __ival_l.value;
        if (vset.has(l.v)&&!vset2.has(l.v)) {
            vs.push(verts[l.v.index]);
            vset2.add(l.v);
        }
        else {
          console.log("Duplicate verts in face "+f.eid, f);
        }
      }
      if (vs.length>1) {
          vlists.push(vs);
      }
    }
    if (vlists.length>0) {
        var f2=mesh2.make_face_complex(vlists);
        mesh2.copy_face_data(f2, f, true);
    }
  }
  mesh.load(mesh2);
  mesh.api.recalc_normals();
  mesh.gen_render_struct();
  mesh.regen_render();
}
function validate_mesh(m) {
  if (!validate_mesh_intern(m)) {
      console.log("Mesh validation error.");
      throw "Mesh validation error.";
  }
}
function concat_array(a1, a2) {
  var ret=new GArray();
  for (var i=0; i<a1.length; i++) {
      ret.push(a1[i]);
  }
  for (var i=0; i<a2.length; i++) {
      ret.push(a2[i]);
  }
  return ret;
}
function get_callstack(err) {
  var callstack=[];
  var isCallstackPopulated=false;
  var err_was_undefined=err==undefined;
  if (err==undefined) {
      try {
        _idontexist.idontexist+=0;
      }
      catch (err1) {
          err = err1;
      }
  }
  if (err!=undefined) {
      if (err.stack) {
          var lines=err.stack.split('\n');
          var len=lines.length;
          for (var i=0; i<len; i++) {
              if (1) {
                  lines[i] = lines[i].replace(/@http\:\/\/.*\//, "|");
                  var l=lines[i].split("|");
                  lines[i] = l[1]+": "+l[0];
                  lines[i] = lines[i].trim();
                  callstack.push(lines[i]);
              }
          }
          if (err_was_undefined) {
          }
          isCallstackPopulated = true;
      }
      else 
        if (window.opera&&e.message) {
          var lines=err.message.split('\n');
          var len=lines.length;
          for (var i=0; i<len; i++) {
              if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {
                  var entry=lines[i];
                  if (lines[i+1]) {
                      entry+=' at '+lines[i+1];
                      i++;
                  }
                  callstack.push(entry);
              }
          }
          if (err_was_undefined) {
              callstack.shift();
          }
          isCallstackPopulated = true;
      }
  }
  var limit=24;
  if (!isCallstackPopulated) {
      var currentFunction=arguments.callee.caller;
      var i=0;
      while (currentFunction&&i<24) {
        var fn=currentFunction.toString();
        var fname=fn.substring(fn.indexOf("function")+8, fn.indexOf(''))||'anonymous';
        callstack.push(fname);
        currentFunction = currentFunction.caller;
        i++;
      }
  }
  return callstack;
}
function print_stack(err) {
  try {
    var cs=get_callstack(err);
  }
  catch (err2) {
      console.log("Could not fetch call stack.");
      return ;
  }
  console.log("Callstack:");
  for (var i=0; i<cs.length; i++) {
      console.log(cs[i]);
  }
}
function time_ms() {
  if (window.performance)
    return window.performance.now();
  else 
    return new Date().getMilliseconds();
}
var movavg=_ESClass("movavg", [function movavg(length) {
  this.len = length;
  this.value = 0;
  this.arr = [];
}, function _recalc() {
  if (this.arr.length==0)
    return ;
  var avg=0.0;
  for (var i=0; i<this.arr.length; i++) {
      avg+=this.arr[i];
  }
  avg/=this.arr.length;
  this.value = avg;
}, function update(val) {
  if (this.arr.length<this.len) {
      this.arr.push(val);
  }
  else {
    this.arr.shift();
    this.arr.push(val);
  }
  this._recalc();
  return this.value;
}, function valueOf() {
  return this.value;
}]);
var Timer=_ESClass("Timer", [function Timer(interval_ms) {
  this.ival = interval_ms;
  this.normval = 0.0;
  this.last_ms = time_ms();
}, function ready() {
  this.normval = (time_ms()-this.last_ms)/this.ival;
  if (time_ms()-this.last_ms>this.ival) {
      this.last_ms = time_ms();
      return true;
  }
  return false;
}]);
function other_tri_vert(e, f) {
  var __iter_v=__get_iter(f.verts);
  var v;
  while (1) {
    var __ival_v=__iter_v.next();
    if (__ival_v.done) {
        break;
    }
    v = __ival_v.value;
    if (v!=e.v1&&v!=e.v2)
      return v;
  }
  return null;
}
var _sran_tab=[0.42858355099189227, 0.5574386030715371, 0.9436109711290556, 0.11901816474442506, 0.05494319267999703, 0.4089598843412747, 0.9617377622975879, 0.6144736752713642, 0.4779527665160106, 0.5358937375859902, 0.6392009453796094, 0.24893232630444684, 0.33278166078571036, 0.23623349009987882, 0.6007015401310062, 0.3705022651967115, 0.0225052050200355, 0.35908220770197297, 0.6762962413645864, 0.7286584766550781, 0.19885076794257972, 0.6066651236611478, 0.23594878250486895, 0.9559806203614414, 0.37878311003873877, 0.14489505173573436, 0.6853451367228348, 0.778201767931336, 0.9629591508405009, 0.10159174495809686, 0.9956652458055149, 0.27241630290235785, 0.4657146086929548, 0.7459995799823305, 0.30955785437169314, 0.7594519036966647, 0.9003876360971134, 0.14415784566467216, 0.13837285006138467, 0.5708662986155526, 0.04911823375362412, 0.5182157396751097, 0.24535476698939818, 0.4755762294863617, 0.6241760808125321, 0.05480018253112229, 0.8345698022607818, 0.26287656274013016, 0.1025239144443526];
var StupidRandom2=_ESClass("StupidRandom2", [function StupidRandom2(seed) {
  if (seed==undefined)
    seed = 0;
  this._seed = seed+1;
  this.i = 1;
}, function seed(seed) {
  this._seed = seed+1;
  this.i = 1;
}, function random() {
  
  var tab=_sran_tab;
  var i=this.i;
  if (i<0)
    i = Math.abs(i)-1;
  i = Math.max(i, 1);
  var i1=Math.max(i, 0)+this._seed;
  var i2=Math.ceil(i/4+this._seed);
  var r1=Math.sqrt(tab[i1%tab.length]*tab[i2%tab.length]);
  this.i++;
  return r1;
}]);
var seedrand=new StupidRandom2();
function get_nor_zmatrix(no) {
  var axis=new Vector3();
  var cross=new Vector3();
  axis.zero();
  axis[2] = 1.0;
  cross.load(no);
  cross.cross(axis);
  cross.normalize();
  var sign=axis.dot(no)>0.0 ? 1.0 : -1.0;
  var a=Math.acos(Math.abs(no.dot(axis)));
  var q=new Quat();
  q.axisAngleToQuat(cross, sign*a);
  var mat=q.toMatrix();
  return mat;
}
var _o_basic_types={"String": 0, "Number": 0, "Array": 0, "Function": 0};
function is_obj_lit(obj) {
  if (obj.constructor.name in _o_basic_types)
    return false;
  if (obj.constructor.name=="Object")
    return true;
  if (obj.prototype==undefined)
    return true;
  return false;
}
var UnitTestError=_ESClass("UnitTestError", Error, [function UnitTestError(msg) {
  Error.call(this, msg);
  this.msg = msg;
}]);
function utest(func) {
  try {
    func();
  }
  catch (err) {
      if (__instance_of(err, UnitTestError)) {
          console.log("---------------");
          console.log("Error: Unit Test Failure");
          console.log("  "+func.name+": "+err.msg);
          console.log("---------------");
          return false;
      }
      else {
        print_stack(err);
        throw err;
      }
      return false;
  }
  console.log(func.name+" succeeded.");
  return true;
}
function do_unit_tests() {
  console.log("-----Unit testing-----");
  console.log("Total number of tests: ", defined_tests.length);
  console.log(" ");
  var totok=0, toterr=0;
  console.log("Defined tests:");
  for (var i=0; i<defined_tests.length; i++) {
      var test=defined_tests[i];
      console.log("  "+test.name);
  }
  console.log(" ");
  for (var i=0; i<defined_tests.length; i++) {
      var test=defined_tests[i];
      if (!utest(test))
        toterr++;
      else 
        totok++;
  }
  console.log("OK: ", totok);
  console.log("FAILED: ", toterr);
  console.log("-------------------");
  return toterr==0;
}
var EventDispatcher=_ESClass("EventDispatcher", [function EventDispatcher(name, owner) {
  this.name = name;
  this.callbacks = [];
}, function addListener(callback, thisvar) {
  this.callbacks.push([callback, thisvar]);
}, function fire() {
  for (var i=0; i<this.callbacks.length; i++) {
      var cb=this.callbacks[i];
      cb[0].apply(cb[1]==undefined ? window : cb[1], arguments);
  }
}]);
var EIDGen=_ESClass("EIDGen", [function EIDGen() {
  this.cur_eid = 1;
}, _ESClass.static(function fromSTRUCT(unpacker) {
  var g=new EIDGen();
  unpacker(g);
  return g;
}), function set_cur(cur) {
  this.cur_eid = Math.ceil(cur);
}, function max_cur(cur) {
  this.cur_eid = Math.max(Math.ceil(cur)+1, this.cur_eid);
}, function get_cur(cur) {
  return this.cur_eid;
}, function eid_max_cur(t) {
  return this.max_cur(t);
}, function gen_eid(typemask) {
  if (typemask==undefined) {
      typemask = 0;
  }
  return this.cur_eid++;
}, function gen_id() {
  return this.gen_eid();
}, function toJSON() {
  return {cur_eid: this.cur_eid}
}, _ESClass.static(function fromJSON(obj) {
  var idgen=new EIDGen();
  idgen.cur_eid = obj.cur_eid;
  return idgen;
})]);
EIDGen.STRUCT = "\n  EIDGen {\n    cur_eid : int;\n  }";
function copy_into(dst, src) {
  console.log(dst);
  var keys2=list(obj_get_keys(src));
  for (var i=0; i<keys2.length; i++) {
      var k=keys2[i];
      dst[k] = src[k];
  }
  console.log(dst);
  return dst;
}
var __v3d_g_s=[];
function get_spiral(size) {
  if (__v3d_g_s.length==size*size)
    return __v3d_g_s;
  var arr=__v3d_g_s;
  var x=Math.floor((size-1)/2);
  var y=Math.floor((size-1)/2);
  var c;
  var i;
  if (size%2==0) {
      arr.push([x, y+1]);
      arr.push([x, y]);
      arr.push([x+1, y]);
      arr.push([x+1, y+1]);
      arr.push([x+1, y+2]);
      c = 5;
      i = 2;
      y+=2;
      x+=1;
  }
  else {
    arr.push([x, y]);
    arr.push([x+1, y]);
    arr.push([x+1, y+1]);
    c = 3;
    i = 2;
    x++;
    y++;
  }
  while (c<size*size-1) {
    var sign=(Math.floor(i/2)%2)==1;
    sign = sign ? -1.0 : 1.0;
    for (var j=0; j<i; j++) {
        if ((i%2==0)) {
            if (x+sign<0||x+sign>=size)
              break;
            x+=sign;
        }
        else {
          if (y+sign<0||y+sign>=size)
            break;
          y+=sign;
        }
        if (c==size*size)
          break;
        arr.push([x, y]);
        c++;
    }
    if (c==size*size)
      break;
    i++;
  }
  for (var j=0; j<arr.length; j++) {
      arr[j][0] = Math.floor(arr[j][0]);
      arr[j][1] = Math.floor(arr[j][1]);
  }
  return __v3d_g_s;
}
var _bt_h={"String": "string", "RegExp": "regexp", "Number": "number", "Function": "function", "Array": "array", "Boolean": "boolean", "Error": "error"};
function btypeof(obj) {
  if (typeof obj=="object") {
      if (obj.constructor.name in _bt_h)
        return _bt_h[obj.constructor.name];
      else 
        return "object";
  }
  else {
    return typeof obj;
  }
}
var SDIDLayer=_ESClass("SDIDLayer", [function SDIDLayer(int_id) {
  this.int_id = int_id;
  this.idmap = {}
}, function _save_idmap() {
  var ret=[];
  var idmap=this.idmap;
  for (var k in idmap) {
      var lst=idmap[k];
      ret.push(k);
      var len=0;
      for (var k in lst) {
          len++;
      }
      ret.push(lst.length);
      for (var k in lst) {
          ret.push(lst[k]);
      }
  }
  return ret;
}, _ESClass.static(function fromSTRUCT(reader) {
  var ret=new SDIDLayer();
  reader(ret);
  var idmap={}, i=0;
  while (i<ret.idmap.length) {
    var k=ret.idmap[i++], len=ret.idmap[i++];
    var lst={};
    for (var j=0; j<len; j++) {
        var k2=ret.idmap[i++];
        lst[k2] = k2;
    }
    ret.idmap[k] = lst;
  }
  ret.idmap = idmap;
  return ret;
})]);
SDIDLayer.STRUCT = "\n  SDIDLayer {\n    int_id : int;\n    idmap  : array(int) | obj._save_idmap();\n  }\n";
var SDIDLayerListIter=_ESClass("SDIDLayerListIter", [function SDIDLayerListIter(list) {
  var keys=Object.keys(list);
  this.arr = [];
  for (var i=0; i<keys.length; i++) {
      var k=keys[i];
      if (k=='layers')
        continue;
      this.arr.push(k);
  }
  for (var i=0; i<this.arr.length; i++) {
      this.arr[i] = list[this.arr[i]];
  }
  this.list = list;
  this.ret = {done: false, value: undefined}
  this.i = 0;
}, function next() {
  var ret=this.ret;
  if (this.i>=this.arr.length) {
      ret.done = true;
      ret.value = undefined;
      return ret;
  }
  ret.value = this.arr[this.i++];
  return ret;
}, function reset() {
  this.i = 0;
  this.arr = Object.keys(this.list);
  this.ret.done = false;
  this.ret.value = undefined;
}]);
var SDIDLayerList=_ESClass("SDIDLayerList", [function SDIDLayerList() {
}, _ESClass.symbol(Symbol.iterator, function iterator() {
  return new SDIDLayerListIter(this);
}), function get_from_layer(layer, parent) {
  if (!(layer in this))
    return undefined;
  return this[layer].idmap[parent];
}, function copy() {
  var ret=new SDIDLayerList();
  var __iter_k=__get_iter(this);
  var k;
  while (1) {
    var __ival_k=__iter_k.next();
    if (__ival_k.done) {
        break;
    }
    k = __ival_k.value;
    var layer=this[k];
    var layer2=new SDIDLayer(layer.int_id);
    ret[k] = layer2;
    for (var k in layer.idmap) {
        layer2.idmap[k] = {};
        for (var k2 in layer.idmap[k]) {
            layer2.idmap[k][k2] = layer.idmap[k][k2];
        }
    }
  }
  return ret;
}, function add_to_layer(layer, parent, child) {
  if (layer==undefined) {
      throw new Error("Layer cannot be undefined", layer, parent);
  }
  if (!(layer in this)) {
      this[layer] = new SDIDLayer(layer);
  }
  layer = this[layer];
  if (!(parent in layer.idmap))
    layer.idmap[parent] = {}
  layer.idmap[parent][child] = child;
}, _ESClass.static(function fromSTRUCT(reader) {
  var ret=new SDIDLayerList();
  reader(ret);
  for (var i=0; i<ret.layers.length; i++) {
      ret[ret.layers[i].int_id] = ret.layers[i];
  }
  return ret;
})]);
SDIDLayerList.STRUCT = "\n  SDIDLayerList {\n    layers : iter(SDIDLayer) | obj;\n  }\n";
var SDIDGen=_ESClass("SDIDGen", [function SDIDGen() {
  this.cur_id = 1;
  this.idmap_layers = new SDIDLayerList();
  this.usedmap = {}
  this.freelist = [];
  this.freemap = {}
}, function copy() {
  var ret=new SDIDGen();
  ret.cur_id = this.cur_id;
  ret.idmap_layers = this.idmap_layers.copy();
  return ret;
}, _ESClass.static(function fromSTRUCT(unpacker) {
  var g=new SDIDGen();
  unpacker(g);
  for (var i=0; i<g.freelist.length; i++) {
      g.freemap[g.freelist[i]] = i;
  }
  var usedmap={}
  for (var i=0; i<g.usedmap.length; i++) {
      usedmap[g.usedmap[i]] = 1;
  }
  g.usedmap = usedmap;
  return g;
}), function max_cur(cur, depth) {
  this.cur_eid = Math.max(Math.ceil(cur)+1, this.cur_eid);
}, function gen_id(parent, layer) {
  if (parent==undefined) {
      parent = undefined;
  }
  if (layer==undefined) {
      layer = 0;
  }
  var id=this.cur_id++;
  if (id in this.freemap) {
      this.freelist.remove(id);
      delete this.freemap[id];
  }
  this.usedmap[id] = 1;
  return id;
}, function free_id(id) {
  if (id==this.cur_id-1) {
      this.cur_id--;
      while (this.cur_id>=0&&this.cur_id-1 in this.freemap) {
        this.cur_id--;
      }
  }
  this.freemap[id] = this.freelist.length;
  this.freelist.push(id);
  delete this.usedmap[id];
}]);
SDIDGen.STRUCT = "\nSDIDGen {\n  cur_id        : int;\n  idmap_layers  : SDIDLayerList;\n  usedmap       : iter(int);\n  freelist      : array(int);\n}\n";
