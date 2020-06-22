es6_module_define('built_wasm', ["./load_wasm.js"], function _built_wasm_module(_es6_module) {
  var Module={}
  Module = _es6_module.set_default_export('Module', Module);
  
  var wasm_binary=es6_import_item(_es6_module, './load_wasm.js', 'wasm_binary');
  var wasmBinaryPath=es6_import_item(_es6_module, './load_wasm.js', 'wasmBinaryPath');
  Module.wasmBinary = wasm_binary;
  Module.INITIAL_MEMORY = 33554432;
  var wasmBinaryFile=wasmBinaryPath;
  var Module=typeof Module!=='undefined' ? Module : {}
  var moduleOverrides={}
  var key;
  for (key in Module) {
      if (Module.hasOwnProperty(key)) {
          moduleOverrides[key] = Module[key];
      }
  }
  var arguments_=[];
  var thisProgram='./this.program';
  var quit_=function (status, toThrow) {
    throw toThrow;
  }
  var ENVIRONMENT_IS_WEB=false;
  var ENVIRONMENT_IS_WORKER=false;
  var ENVIRONMENT_IS_NODE=false;
  var ENVIRONMENT_IS_SHELL=false;
  ENVIRONMENT_IS_WEB = typeof window==='object';
  ENVIRONMENT_IS_WORKER = typeof importScripts==='function';
  ENVIRONMENT_IS_NODE = typeof process==='object'&&typeof process.versions==='object'&&typeof process.versions.node==='string';
  ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_NODE&&!ENVIRONMENT_IS_WORKER;
  if (Module['ENVIRONMENT']) {
      throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)');
  }
  var scriptDirectory='';
  function locateFile(path) {
    if (Module['locateFile']) {
        return Module['locateFile'](path, scriptDirectory);
    }
    return scriptDirectory+path;
  }
  var read_, readAsync, readBinary, setWindowTitle;
  var nodeFS;
  var nodePath;
  if (ENVIRONMENT_IS_NODE) {
      if (ENVIRONMENT_IS_WORKER) {
          scriptDirectory = require('path').dirname(scriptDirectory)+'/';
      }
      else {
        scriptDirectory = __dirname+'/';
      }
      read_ = function shell_read(filename, binary) {
        if (!nodeFS)
          nodeFS = require('fs');
        if (!nodePath)
          nodePath = require('path');
        filename = nodePath['normalize'](filename);
        return nodeFS['readFileSync'](filename, binary ? null : 'utf8');
      };
      readBinary = function readBinary(filename) {
        var ret=read_(filename, true);
        if (!ret.buffer) {
            ret = new Uint8Array(ret);
        }
        assert(ret.buffer);
        return ret;
      };
      if (process['argv'].length>1) {
          thisProgram = process['argv'][1].replace(/\\/g, '/');
      }
      arguments_ = process['argv'].slice(2);
      if (typeof module!=='undefined') {
          module['exports'] = Module;
      }
      process['on']('uncaughtException', function (ex) {
        if (!(__instance_of(ex, ExitStatus))) {
            throw ex;
        }
      });
      process['on']('unhandledRejection', abort);
      quit_ = function (status) {
        process['exit'](status);
      };
      Module['inspect'] = function () {
        return '[Emscripten Module object]';
      };
  }
  else 
    if (ENVIRONMENT_IS_SHELL) {
      if (typeof read!='undefined') {
          read_ = function shell_read(f) {
            return read(f);
          };
      }
      readBinary = function readBinary(f) {
        var data;
        if (typeof readbuffer==='function') {
            return new Uint8Array(readbuffer(f));
        }
        data = read(f, 'binary');
        assert(typeof data==='object');
        return data;
      };
      if (typeof scriptArgs!='undefined') {
          arguments_ = scriptArgs;
      }
      else 
        if (typeof arguments!='undefined') {
          arguments_ = arguments;
      }
      if (typeof quit==='function') {
          quit_ = function (status) {
            quit(status);
          };
      }
      if (typeof print!=='undefined') {
          if (typeof console==='undefined')
            console = ({});
          console.log = (print);
          console.warn = console.error = (typeof printErr!=='undefined' ? printErr : print);
      }
  }
  else 
    if (ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER) {
      if (ENVIRONMENT_IS_WORKER) {
          scriptDirectory = self.location.href;
      }
      else 
        if (document.currentScript) {
          scriptDirectory = document.currentScript.src;
      }
      if (scriptDirectory.indexOf('blob:')!==0) {
          scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf('/')+1);
      }
      else {
        scriptDirectory = '';
      }
      read_ = function shell_read(url) {
        var xhr=new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.send(null);
        return xhr.responseText;
      };
      if (ENVIRONMENT_IS_WORKER) {
          readBinary = function readBinary(url) {
            var xhr=new XMLHttpRequest();
            xhr.open('GET', url, false);
            xhr.responseType = 'arraybuffer';
            xhr.send(null);
            return new Uint8Array(xhr.response);
          };
      }
      readAsync = function readAsync(url, onload, onerror) {
        var xhr=new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status==200||(xhr.status==0&&xhr.response)) {
              onload(xhr.response);
              return ;
          }
          onerror();
        }
        xhr.onerror = onerror;
        xhr.send(null);
      };
      setWindowTitle = function (title) {
        document.title = title;
      };
  }
  else {
    throw new Error('environment detection error');
  }
  var out=Module['print']||console.log.bind(console);
  var err=Module['printErr']||console.warn.bind(console);
  for (key in moduleOverrides) {
      if (moduleOverrides.hasOwnProperty(key)) {
          Module[key] = moduleOverrides[key];
      }
  }
  moduleOverrides = null;
  if (Module['arguments'])
    arguments_ = Module['arguments'];
  if (!Object.getOwnPropertyDescriptor(Module, 'arguments'))
    Object.defineProperty(Module, 'arguments', {configurable: true, 
   get: function () {
      abort('Module.arguments has been replaced with plain arguments_');
    }});
  if (Module['thisProgram'])
    thisProgram = Module['thisProgram'];
  if (!Object.getOwnPropertyDescriptor(Module, 'thisProgram'))
    Object.defineProperty(Module, 'thisProgram', {configurable: true, 
   get: function () {
      abort('Module.thisProgram has been replaced with plain thisProgram');
    }});
  if (Module['quit'])
    quit_ = Module['quit'];
  if (!Object.getOwnPropertyDescriptor(Module, 'quit'))
    Object.defineProperty(Module, 'quit', {configurable: true, 
   get: function () {
      abort('Module.quit has been replaced with plain quit_');
    }});
  assert(typeof Module['memoryInitializerPrefixURL']==='undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['pthreadMainPrefixURL']==='undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['cdInitializerPrefixURL']==='undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['filePackagePrefixURL']==='undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['read']==='undefined', 'Module.read option was removed (modify read_ in JS)');
  assert(typeof Module['readAsync']==='undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
  assert(typeof Module['readBinary']==='undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
  assert(typeof Module['setWindowTitle']==='undefined', 'Module.setWindowTitle option was removed (modify setWindowTitle in JS)');
  assert(typeof Module['TOTAL_MEMORY']==='undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
  if (!Object.getOwnPropertyDescriptor(Module, 'read'))
    Object.defineProperty(Module, 'read', {configurable: true, 
   get: function () {
      abort('Module.read has been replaced with plain read_');
    }});
  if (!Object.getOwnPropertyDescriptor(Module, 'readAsync'))
    Object.defineProperty(Module, 'readAsync', {configurable: true, 
   get: function () {
      abort('Module.readAsync has been replaced with plain readAsync');
    }});
  if (!Object.getOwnPropertyDescriptor(Module, 'readBinary'))
    Object.defineProperty(Module, 'readBinary', {configurable: true, 
   get: function () {
      abort('Module.readBinary has been replaced with plain readBinary');
    }});
  if (!Object.getOwnPropertyDescriptor(Module, 'setWindowTitle'))
    Object.defineProperty(Module, 'setWindowTitle', {configurable: true, 
   get: function () {
      abort('Module.setWindowTitle has been replaced with plain setWindowTitle');
    }});
  var IDBFS='IDBFS is no longer included by default; build with -lidbfs.js';
  var PROXYFS='PROXYFS is no longer included by default; build with -lproxyfs.js';
  var WORKERFS='WORKERFS is no longer included by default; build with -lworkerfs.js';
  var NODEFS='NODEFS is no longer included by default; build with -lnodefs.js';
  var STACK_ALIGN=16;
  var stackSave;
  var stackRestore;
  var stackAlloc;
  stackSave = stackRestore = stackAlloc = function () {
    abort('cannot use the stack before compiled code is ready to run, and has provided stack access');
  }
  function staticAlloc(size) {
    abort('staticAlloc is no longer available at runtime; instead, perform static allocations at compile time (using makeStaticAlloc)');
  }
  function dynamicAlloc(size) {
    assert(DYNAMICTOP_PTR);
    var ret=HEAP32[DYNAMICTOP_PTR>>2];
    var end=(ret+size+15)&-16;
    assert(end<=HEAP8.length, 'failure to dynamicAlloc - memory growth etc. is not supported there, call malloc/sbrk directly');
    HEAP32[DYNAMICTOP_PTR>>2] = end;
    return ret;
  }
  function alignMemory(size, factor) {
    if (!factor)
      factor = STACK_ALIGN;
    return Math.ceil(size/factor)*factor;
  }
  function getNativeTypeSize(type) {
    switch (type) {
      case 'i1':
      case 'i8':
        return 1;
      case 'i16':
        return 2;
      case 'i32':
        return 4;
      case 'i64':
        return 8;
      case 'float':
        return 4;
      case 'double':
        return 8;
      default:
        if (type[type.length-1]==='*') {
            return 4;
        }
        else 
          if (type[0]==='i') {
            var bits=Number(type.substr(1));
            assert(bits%8===0, 'getNativeTypeSize invalid bits '+bits+', type '+type);
            return bits/8;
        }
        else {
          return 0;
        }
    }
  }
  function warnOnce(text) {
    if (!warnOnce.shown)
      warnOnce.shown = {}
    if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text);
    }
  }
  function convertJsFunctionToWasm(func, sig) {
    if (typeof WebAssembly.Function==="function") {
        var typeNames={'i': 'i32', 
      'j': 'i64', 
      'f': 'f32', 
      'd': 'f64'};
        var type={parameters: [], 
      results: sig[0]=='v' ? [] : [typeNames[sig[0]]]};
        for (var i=1; i<sig.length; ++i) {
            type.parameters.push(typeNames[sig[i]]);
        }
        return new WebAssembly.Function(type, func);
    }
    var typeSection=[0x1, 0x0, 0x1, 0x60];
    var sigRet=sig.slice(0, 1);
    var sigParam=sig.slice(1);
    var typeCodes={'i': 0x7f, 
    'j': 0x7e, 
    'f': 0x7d, 
    'd': 0x7c}
    typeSection.push(sigParam.length);
    for (var i=0; i<sigParam.length; ++i) {
        typeSection.push(typeCodes[sigParam[i]]);
    }
    if (sigRet=='v') {
        typeSection.push(0x0);
    }
    else {
      typeSection = typeSection.concat([0x1, typeCodes[sigRet]]);
    }
    typeSection[1] = typeSection.length-2;
    var bytes=new Uint8Array([0x0, 0x61, 0x73, 0x6d, 0x1, 0x0, 0x0, 0x0].concat(typeSection, [0x2, 0x7, 0x1, 0x1, 0x65, 0x1, 0x66, 0x0, 0x0, 0x7, 0x5, 0x1, 0x1, 0x66, 0x0, 0x0]));
    var module=new WebAssembly.Module(bytes);
    var instance=new WebAssembly.Instance(module, {'e': {'f': func}});
    var wrappedFunc=instance.exports['f'];
    return wrappedFunc;
  }
  var freeTableIndexes=[];
  var functionsInTableMap;
  function addFunctionWasm(func, sig) {
    var table=wasmTable;
    if (!functionsInTableMap) {
        functionsInTableMap = new WeakMap();
        for (var i=0; i<table.length; i++) {
            var item=table.get(i);
            if (item) {
                functionsInTableMap.set(item, i);
            }
        }
    }
    if (functionsInTableMap.has(func)) {
        return functionsInTableMap.get(func);
    }
    var ret;
    if (freeTableIndexes.length) {
        ret = freeTableIndexes.pop();
    }
    else {
      ret = table.length;
      try {
        table.grow(1);
      }
      catch (err) {
          if (!(__instance_of(err, RangeError))) {
              throw err;
          }
          throw 'Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.';
      }
    }
    try {
      table.set(ret, func);
    }
    catch (err) {
        if (!(__instance_of(err, TypeError))) {
            throw err;
        }
        assert(typeof sig!=='undefined', 'Missing signature argument to addFunction');
        var wrapped=convertJsFunctionToWasm(func, sig);
        table.set(ret, wrapped);
    }
    functionsInTableMap.set(func, ret);
    return ret;
  }
  function removeFunctionWasm(index) {
    functionsInTableMap.delete(wasmTable.get(index));
    freeTableIndexes.push(index);
  }
  function addFunction(func, sig) {
    assert(typeof func!=='undefined');
    return addFunctionWasm(func, sig);
  }
  function removeFunction(index) {
    removeFunctionWasm(index);
  }
  var funcWrappers={}
  function getFuncWrapper(func, sig) {
    if (!func)
      return ;
    assert(sig);
    if (!funcWrappers[sig]) {
        funcWrappers[sig] = {};
    }
    var sigCache=funcWrappers[sig];
    if (!sigCache[func]) {
        if (sig.length===1) {
            sigCache[func] = function dynCall_wrapper() {
              return dynCall(sig, func);
            };
        }
        else 
          if (sig.length===2) {
            sigCache[func] = function dynCall_wrapper(arg) {
              return dynCall(sig, func, [arg]);
            };
        }
        else {
          sigCache[func] = function dynCall_wrapper() {
            return dynCall(sig, func, Array.prototype.slice.call(arguments));
          };
        }
    }
    return sigCache[func];
  }
  function makeBigInt(low, high, unsigned) {
    return unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0));
  }
  function dynCall(sig, ptr, args) {
    if (args&&args.length) {
        assert(args.length===sig.substring(1).replace(/j/g, '--').length);
        assert(('dynCall_'+sig) in Module, 'bad function pointer type - no table for sig \''+sig+'\'');
        return Module['dynCall_'+sig].apply(null, [ptr].concat(args));
    }
    else {
      assert(sig.length==1);
      assert(('dynCall_'+sig) in Module, 'bad function pointer type - no table for sig \''+sig+'\'');
      return Module['dynCall_'+sig].call(null, ptr);
    }
  }
  var tempRet0=0;
  var setTempRet0=function (value) {
    tempRet0 = value;
  }
  var getTempRet0=function () {
    return tempRet0;
  }
  function getCompilerSetting(name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for getCompilerSetting or emscripten_get_compiler_setting to work';
  }
  var GLOBAL_BASE=1024;
  var wasmBinary;
  if (Module['wasmBinary'])
    wasmBinary = Module['wasmBinary'];
  if (!Object.getOwnPropertyDescriptor(Module, 'wasmBinary'))
    Object.defineProperty(Module, 'wasmBinary', {configurable: true, 
   get: function () {
      abort('Module.wasmBinary has been replaced with plain wasmBinary');
    }});
  var noExitRuntime;
  if (Module['noExitRuntime'])
    noExitRuntime = Module['noExitRuntime'];
  if (!Object.getOwnPropertyDescriptor(Module, 'noExitRuntime'))
    Object.defineProperty(Module, 'noExitRuntime', {configurable: true, 
   get: function () {
      abort('Module.noExitRuntime has been replaced with plain noExitRuntime');
    }});
  if (typeof WebAssembly!=='object') {
      abort('No WebAssembly support found. Build with -s WASM=0 to target JavaScript instead.');
  }
  function setValue(ptr, value, type, noSafe) {
    type = type||'i8';
    if (type.charAt(type.length-1)==='*')
      type = 'i32';
    switch (type) {
      case 'i1':
        HEAP8[((ptr)>>0)] = value;
        break;
      case 'i8':
        HEAP8[((ptr)>>0)] = value;
        break;
      case 'i16':
        HEAP16[((ptr)>>1)] = value;
        break;
      case 'i32':
        HEAP32[((ptr)>>2)] = value;
        break;
      case 'i64':
        (tempI64 = [value>>>0, (tempDouble = value, (+(Math_abs(tempDouble)))>=1.0 ? (tempDouble>0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble-+(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[((ptr)>>2)] = tempI64[0], HEAP32[(((ptr)+(4))>>2)] = tempI64[1]);
        break;
      case 'float':
        HEAPF32[((ptr)>>2)] = value;
        break;
      case 'double':
        HEAPF64[((ptr)>>3)] = value;
        break;
      default:
        abort('invalid type for setValue: '+type);
    }
  }
  function getValue(ptr, type, noSafe) {
    type = type||'i8';
    if (type.charAt(type.length-1)==='*')
      type = 'i32';
    switch (type) {
      case 'i1':
        return HEAP8[((ptr)>>0)];
      case 'i8':
        return HEAP8[((ptr)>>0)];
      case 'i16':
        return HEAP16[((ptr)>>1)];
      case 'i32':
        return HEAP32[((ptr)>>2)];
      case 'i64':
        return HEAP32[((ptr)>>2)];
      case 'float':
        return HEAPF32[((ptr)>>2)];
      case 'double':
        return HEAPF64[((ptr)>>3)];
      default:
        abort('invalid type for getValue: '+type);
    }
    return null;
  }
  var wasmMemory;
  var wasmTable=new WebAssembly.Table({'initial': 6, 
   'maximum': 6+0, 
   'element': 'anyfunc'});
  var ABORT=false;
  var EXITSTATUS=0;
  function assert(condition, text) {
    if (!condition) {
        abort('Assertion failed: '+text);
    }
  }
  function getCFunc(ident) {
    var func=Module['_'+ident];
    assert(func, 'Cannot call unknown function '+ident+', make sure it is exported');
    return func;
  }
  function ccall(ident, returnType, argTypes, args, opts) {
    var toC={'string': function (str) {
        var ret=0;
        if (str!==null&&str!==undefined&&str!==0) {
            var len=(str.length<<2)+1;
            ret = stackAlloc(len);
            stringToUTF8(str, ret, len);
        }
        return ret;
      }, 
    'array': function (arr) {
        var ret=stackAlloc(arr.length);
        writeArrayToMemory(arr, ret);
        return ret;
      }}
    function convertReturnValue(ret) {
      if (returnType==='string')
        return UTF8ToString(ret);
      if (returnType==='boolean')
        return Boolean(ret);
      return ret;
    }
    var func=getCFunc(ident);
    var cArgs=[];
    var stack=0;
    assert(returnType!=='array', 'Return type should not be "array".');
    if (args) {
        for (var i=0; i<args.length; i++) {
            var converter=toC[argTypes[i]];
            if (converter) {
                if (stack===0)
                  stack = stackSave();
                cArgs[i] = converter(args[i]);
            }
            else {
              cArgs[i] = args[i];
            }
        }
    }
    var ret=func.apply(null, cArgs);
    ret = convertReturnValue(ret);
    if (stack!==0)
      stackRestore(stack);
    return ret;
  }
  function cwrap(ident, returnType, argTypes, opts) {
    return function () {
      return ccall(ident, returnType, argTypes, arguments, opts);
    }
  }
  var ALLOC_NORMAL=0;
  var ALLOC_STACK=1;
  var ALLOC_DYNAMIC=2;
  var ALLOC_NONE=3;
  function allocate(slab, types, allocator, ptr) {
    var zeroinit, size;
    if (typeof slab==='number') {
        zeroinit = true;
        size = slab;
    }
    else {
      zeroinit = false;
      size = slab.length;
    }
    var singleType=typeof types==='string' ? types : null;
    var ret;
    if (allocator==ALLOC_NONE) {
        ret = ptr;
    }
    else {
      ret = [_malloc, stackAlloc, dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length));
    }
    if (zeroinit) {
        var stop;
        ptr = ret;
        assert((ret&3)==0);
        stop = ret+(size&~3);
        for (; ptr<stop; ptr+=4) {
            HEAP32[((ptr)>>2)] = 0;
        }
        stop = ret+size;
        while (ptr<stop) {
          HEAP8[((ptr++)>>0)] = 0;
        }
        return ret;
    }
    if (singleType==='i8') {
        if (slab.subarray||slab.slice) {
            HEAPU8.set((slab), ret);
        }
        else {
          HEAPU8.set(new Uint8Array(slab), ret);
        }
        return ret;
    }
    var i=0, type, typeSize, previousType;
    while (i<size) {
      var curr=slab[i];
      type = singleType||types[i];
      if (type===0) {
          i++;
          continue;
      }
      assert(type, 'Must know what type to store in allocate!');
      if (type=='i64')
        type = 'i32';
      setValue(ret+i, curr, type);
      if (previousType!==type) {
          typeSize = getNativeTypeSize(type);
          previousType = type;
      }
      i+=typeSize;
    }
    return ret;
  }
  function getMemory(size) {
    if (!runtimeInitialized)
      return dynamicAlloc(size);
    return _malloc(size);
  }
  var UTF8Decoder=typeof TextDecoder!=='undefined' ? new TextDecoder('utf8') : undefined;
  function UTF8ArrayToString(heap, idx, maxBytesToRead) {
    var endIdx=idx+maxBytesToRead;
    var endPtr=idx;
    while (heap[endPtr]&&!(endPtr>=endIdx)) {
      ++endPtr    }
    if (endPtr-idx>16&&heap.subarray&&UTF8Decoder) {
        return UTF8Decoder.decode(heap.subarray(idx, endPtr));
    }
    else {
      var str='';
      while (idx<endPtr) {
        var u0=heap[idx++];
        if (!(u0&0x80)) {
            str+=String.fromCharCode(u0);
            continue;
        }
        var u1=heap[idx++]&63;
        if ((u0&0xe0)==0xc0) {
            str+=String.fromCharCode(((u0&31)<<6)|u1);
            continue;
        }
        var u2=heap[idx++]&63;
        if ((u0&0xf0)==0xe0) {
            u0 = ((u0&15)<<12)|(u1<<6)|u2;
        }
        else {
          if ((u0&0xf8)!=0xf0)
            warnOnce('Invalid UTF-8 leading byte 0x'+u0.toString(16)+' encountered when deserializing a UTF-8 string on the asm.js/wasm heap to a JS string!');
          u0 = ((u0&7)<<18)|(u1<<12)|(u2<<6)|(heap[idx++]&63);
        }
        if (u0<0x10000) {
            str+=String.fromCharCode(u0);
        }
        else {
          var ch=u0-0x10000;
          str+=String.fromCharCode(0xd800|(ch>>10), 0xdc00|(ch&0x3ff));
        }
      }
    }
    return str;
  }
  function UTF8ToString(ptr, maxBytesToRead) {
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
  }
  function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite>0))
      return 0;
    var startIdx=outIdx;
    var endIdx=outIdx+maxBytesToWrite-1;
    for (var i=0; i<str.length; ++i) {
        var u=str.charCodeAt(i);
        if (u>=0xd800&&u<=0xdfff) {
            var u1=str.charCodeAt(++i);
            u = 0x10000+((u&0x3ff)<<10)|(u1&0x3ff);
        }
        if (u<=0x7f) {
            if (outIdx>=endIdx)
              break;
            heap[outIdx++] = u;
        }
        else 
          if (u<=0x7ff) {
            if (outIdx+1>=endIdx)
              break;
            heap[outIdx++] = 0xc0|(u>>6);
            heap[outIdx++] = 0x80|(u&63);
        }
        else 
          if (u<=0xffff) {
            if (outIdx+2>=endIdx)
              break;
            heap[outIdx++] = 0xe0|(u>>12);
            heap[outIdx++] = 0x80|((u>>6)&63);
            heap[outIdx++] = 0x80|(u&63);
        }
        else {
          if (outIdx+3>=endIdx)
            break;
          if (u>=0x200000)
            warnOnce('Invalid Unicode code point 0x'+u.toString(16)+' encountered when serializing a JS string to an UTF-8 string on the asm.js/wasm heap! (Valid unicode code points should be in range 0-0x1FFFFF).');
          heap[outIdx++] = 0xf0|(u>>18);
          heap[outIdx++] = 0x80|((u>>12)&63);
          heap[outIdx++] = 0x80|((u>>6)&63);
          heap[outIdx++] = 0x80|(u&63);
        }
    }
    heap[outIdx] = 0;
    return outIdx-startIdx;
  }
  function stringToUTF8(str, outPtr, maxBytesToWrite) {
    assert(typeof maxBytesToWrite=='number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
  }
  function lengthBytesUTF8(str) {
    var len=0;
    for (var i=0; i<str.length; ++i) {
        var u=str.charCodeAt(i);
        if (u>=0xd800&&u<=0xdfff)
          u = 0x10000+((u&0x3ff)<<10)|(str.charCodeAt(++i)&0x3ff);
        if (u<=0x7f)
          ++len;
        else 
          if (u<=0x7ff)
          len+=2;
        else 
          if (u<=0xffff)
          len+=3;
        else 
          len+=4;
    }
    return len;
  }
  function AsciiToString(ptr) {
    var str='';
    while (1) {
      var ch=HEAPU8[((ptr++)>>0)];
      if (!ch)
        return str;
      str+=String.fromCharCode(ch);
    }
  }
  function stringToAscii(str, outPtr) {
    return writeAsciiToMemory(str, outPtr, false);
  }
  var UTF16Decoder=typeof TextDecoder!=='undefined' ? new TextDecoder('utf-16le') : undefined;
  function UTF16ToString(ptr, maxBytesToRead) {
    assert(ptr%2==0, 'Pointer passed to UTF16ToString must be aligned to two bytes!');
    var endPtr=ptr;
    var idx=endPtr>>1;
    var maxIdx=idx+maxBytesToRead/2;
    while (!(idx>=maxIdx)&&HEAPU16[idx]) {
      ++idx    }
    endPtr = idx<<1;
    if (endPtr-ptr>32&&UTF16Decoder) {
        return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
    }
    else {
      var i=0;
      var str='';
      while (1) {
        var codeUnit=HEAP16[(((ptr)+(i*2))>>1)];
        if (codeUnit==0||i==maxBytesToRead/2)
          return str;
        ++i;
        str+=String.fromCharCode(codeUnit);
      }
    }
  }
  function stringToUTF16(str, outPtr, maxBytesToWrite) {
    assert(outPtr%2==0, 'Pointer passed to stringToUTF16 must be aligned to two bytes!');
    assert(typeof maxBytesToWrite=='number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
    if (maxBytesToWrite===undefined) {
        maxBytesToWrite = 0x7fffffff;
    }
    if (maxBytesToWrite<2)
      return 0;
    maxBytesToWrite-=2;
    var startPtr=outPtr;
    var numCharsToWrite=(maxBytesToWrite<str.length*2) ? (maxBytesToWrite/2) : str.length;
    for (var i=0; i<numCharsToWrite; ++i) {
        var codeUnit=str.charCodeAt(i);
        HEAP16[((outPtr)>>1)] = codeUnit;
        outPtr+=2;
    }
    HEAP16[((outPtr)>>1)] = 0;
    return outPtr-startPtr;
  }
  function lengthBytesUTF16(str) {
    return str.length*2;
  }
  function UTF32ToString(ptr, maxBytesToRead) {
    assert(ptr%4==0, 'Pointer passed to UTF32ToString must be aligned to four bytes!');
    var i=0;
    var str='';
    while (!(i>=maxBytesToRead/4)) {
      var utf32=HEAP32[(((ptr)+(i*4))>>2)];
      if (utf32==0)
        break;
      ++i;
      if (utf32>=0x10000) {
          var ch=utf32-0x10000;
          str+=String.fromCharCode(0xd800|(ch>>10), 0xdc00|(ch&0x3ff));
      }
      else {
        str+=String.fromCharCode(utf32);
      }
    }
    return str;
  }
  function stringToUTF32(str, outPtr, maxBytesToWrite) {
    assert(outPtr%4==0, 'Pointer passed to stringToUTF32 must be aligned to four bytes!');
    assert(typeof maxBytesToWrite=='number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
    if (maxBytesToWrite===undefined) {
        maxBytesToWrite = 0x7fffffff;
    }
    if (maxBytesToWrite<4)
      return 0;
    var startPtr=outPtr;
    var endPtr=startPtr+maxBytesToWrite-4;
    for (var i=0; i<str.length; ++i) {
        var codeUnit=str.charCodeAt(i);
        if (codeUnit>=0xd800&&codeUnit<=0xdfff) {
            var trailSurrogate=str.charCodeAt(++i);
            codeUnit = 0x10000+((codeUnit&0x3ff)<<10)|(trailSurrogate&0x3ff);
        }
        HEAP32[((outPtr)>>2)] = codeUnit;
        outPtr+=4;
        if (outPtr+4>endPtr)
          break;
    }
    HEAP32[((outPtr)>>2)] = 0;
    return outPtr-startPtr;
  }
  function lengthBytesUTF32(str) {
    var len=0;
    for (var i=0; i<str.length; ++i) {
        var codeUnit=str.charCodeAt(i);
        if (codeUnit>=0xd800&&codeUnit<=0xdfff)
          ++i;
        len+=4;
    }
    return len;
  }
  function allocateUTF8(str) {
    var size=lengthBytesUTF8(str)+1;
    var ret=_malloc(size);
    if (ret)
      stringToUTF8Array(str, HEAP8, ret, size);
    return ret;
  }
  function allocateUTF8OnStack(str) {
    var size=lengthBytesUTF8(str)+1;
    var ret=stackAlloc(size);
    stringToUTF8Array(str, HEAP8, ret, size);
    return ret;
  }
  function writeStringToMemory(string, buffer, dontAddNull) {
    warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');
    var lastChar, end;
    if (dontAddNull) {
        end = buffer+lengthBytesUTF8(string);
        lastChar = HEAP8[end];
    }
    stringToUTF8(string, buffer, Infinity);
    if (dontAddNull)
      HEAP8[end] = lastChar;
  }
  function writeArrayToMemory(array, buffer) {
    assert(array.length>=0, 'writeArrayToMemory array must have a length (should be an array or typed array)');
    HEAP8.set(array, buffer);
  }
  function writeAsciiToMemory(str, buffer, dontAddNull) {
    for (var i=0; i<str.length; ++i) {
        assert(str.charCodeAt(i)===str.charCodeAt(i)&0xff);
        HEAP8[((buffer++)>>0)] = str.charCodeAt(i);
    }
    if (!dontAddNull)
      HEAP8[((buffer)>>0)] = 0;
  }
  var PAGE_SIZE=16384;
  var WASM_PAGE_SIZE=65536;
  var ASMJS_PAGE_SIZE=16777216;
  function alignUp(x, multiple) {
    if (x%multiple>0) {
        x+=multiple-(x%multiple);
    }
    return x;
  }
  var HEAP, buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
  function updateGlobalBufferAndViews(buf) {
    buffer = buf;
    Module['HEAP8'] = HEAP8 = new Int8Array(buf);
    Module['HEAP16'] = HEAP16 = new Int16Array(buf);
    Module['HEAP32'] = HEAP32 = new Int32Array(buf);
    Module['HEAPU8'] = HEAPU8 = new Uint8Array(buf);
    Module['HEAPU16'] = HEAPU16 = new Uint16Array(buf);
    Module['HEAPU32'] = HEAPU32 = new Uint32Array(buf);
    Module['HEAPF32'] = HEAPF32 = new Float32Array(buf);
    Module['HEAPF64'] = HEAPF64 = new Float64Array(buf);
  }
  var STATIC_BASE=1024, STACK_BASE=5254224, STACKTOP=STACK_BASE, STACK_MAX=11344, DYNAMIC_BASE=5254224, DYNAMICTOP_PTR=11184;
  assert(STACK_BASE%16===0, 'stack must start aligned');
  assert(DYNAMIC_BASE%16===0, 'heap must start aligned');
  var TOTAL_STACK=5242880;
  if (Module['TOTAL_STACK'])
    assert(TOTAL_STACK===Module['TOTAL_STACK'], 'the stack size can no longer be determined at runtime');
  var INITIAL_INITIAL_MEMORY=Module['INITIAL_MEMORY']||33554432;
  if (!Object.getOwnPropertyDescriptor(Module, 'INITIAL_MEMORY'))
    Object.defineProperty(Module, 'INITIAL_MEMORY', {configurable: true, 
   get: function () {
      abort('Module.INITIAL_MEMORY has been replaced with plain INITIAL_INITIAL_MEMORY');
    }});
  assert(INITIAL_INITIAL_MEMORY>=TOTAL_STACK, 'INITIAL_MEMORY should be larger than TOTAL_STACK, was '+INITIAL_INITIAL_MEMORY+'! (TOTAL_STACK='+TOTAL_STACK+')');
  assert(typeof Int32Array!=='undefined'&&typeof Float64Array!=='undefined'&&Int32Array.prototype.subarray!==undefined&&Int32Array.prototype.set!==undefined, 'JS engine does not provide full typed array support');
  if (Module['wasmMemory']) {
      wasmMemory = Module['wasmMemory'];
  }
  else {
    wasmMemory = new WebAssembly.Memory({'initial': INITIAL_INITIAL_MEMORY/WASM_PAGE_SIZE, 
    'maximum': 2147483648/WASM_PAGE_SIZE});
  }
  if (wasmMemory) {
      buffer = wasmMemory.buffer;
  }
  INITIAL_INITIAL_MEMORY = buffer.byteLength;
  assert(INITIAL_INITIAL_MEMORY%WASM_PAGE_SIZE===0);
  assert(65536%WASM_PAGE_SIZE===0);
  updateGlobalBufferAndViews(buffer);
  HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;
  function writeStackCookie() {
    assert((STACK_MAX&3)==0);
    HEAPU32[(STACK_MAX>>2)+1] = 0x2135467;
    HEAPU32[(STACK_MAX>>2)+2] = 0x89bacdfe;
    HEAP32[0] = 0x63736d65;
  }
  function checkStackCookie() {
    var cookie1=HEAPU32[(STACK_MAX>>2)+1];
    var cookie2=HEAPU32[(STACK_MAX>>2)+2];
    if (cookie1!=0x2135467||cookie2!=0x89bacdfe) {
        abort('Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x2135467, but received 0x'+cookie2.toString(16)+' '+cookie1.toString(16));
    }
    if (HEAP32[0]!==0x63736d65)
      abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
  }
  function abortStackOverflow(allocSize) {
    abort('Stack overflow! Attempted to allocate '+allocSize+' bytes on the stack, but stack has only '+(STACK_MAX-stackSave()+allocSize)+' bytes available!');
  }(function () {
    var h16=new Int16Array(1);
    var h8=new Int8Array(h16.buffer);
    h16[0] = 0x6373;
    if (h8[0]!==0x73||h8[1]!==0x63)
      throw 'Runtime error: expected the system to be little-endian!';
  })();
  function abortFnPtrError(ptr, sig) {
    abort("Invalid function pointer "+ptr+" called with signature '"+sig+"'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this). Build with ASSERTIONS=2 for more info.");
  }
  function callRuntimeCallbacks(callbacks) {
    while (callbacks.length>0) {
      var callback=callbacks.shift();
      if (typeof callback=='function') {
          callback(Module);
          continue;
      }
      var func=callback.func;
      if (typeof func==='number') {
          if (callback.arg===undefined) {
              Module['dynCall_v'](func);
          }
          else {
            Module['dynCall_vi'](func, callback.arg);
          }
      }
      else {
        func(callback.arg===undefined ? null : callback.arg);
      }
    }
  }
  var __ATPRERUN__=[];
  var __ATINIT__=[];
  var __ATMAIN__=[];
  var __ATEXIT__=[];
  var __ATPOSTRUN__=[];
  var runtimeInitialized=false;
  var runtimeExited=false;
  function preRun() {
    if (Module['preRun']) {
        if (typeof Module['preRun']=='function')
          Module['preRun'] = [Module['preRun']];
        while (Module['preRun'].length) {
          addOnPreRun(Module['preRun'].shift());
        }
    }
    callRuntimeCallbacks(__ATPRERUN__);
  }
  function initRuntime() {
    checkStackCookie();
    assert(!runtimeInitialized);
    runtimeInitialized = true;
    callRuntimeCallbacks(__ATINIT__);
  }
  function preMain() {
    checkStackCookie();
    callRuntimeCallbacks(__ATMAIN__);
  }
  function exitRuntime() {
    checkStackCookie();
    runtimeExited = true;
  }
  function postRun() {
    checkStackCookie();
    if (Module['postRun']) {
        if (typeof Module['postRun']=='function')
          Module['postRun'] = [Module['postRun']];
        while (Module['postRun'].length) {
          addOnPostRun(Module['postRun'].shift());
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__);
  }
  function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb);
  }
  function addOnInit(cb) {
    __ATINIT__.unshift(cb);
  }
  function addOnPreMain(cb) {
    __ATMAIN__.unshift(cb);
  }
  function addOnExit(cb) {
  }
  function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb);
  }
  function unSign(value, bits, ignore) {
    if (value>=0) {
        return value;
    }
    return bits<=32 ? 2*Math.abs(1<<(bits-1))+value : Math.pow(2, bits)+value;
  }
  function reSign(value, bits, ignore) {
    if (value<=0) {
        return value;
    }
    var half=bits<=32 ? Math.abs(1<<(bits-1)) : Math.pow(2, bits-1);
    if (value>=half&&(bits<=32||value>half)) {
        value = -2*half+value;
    }
    return value;
  }
  assert(Math.imul, 'This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
  assert(Math.fround, 'This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
  assert(Math.clz32, 'This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
  assert(Math.trunc, 'This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
  var Math_abs=Math.abs;
  var Math_cos=Math.cos;
  var Math_sin=Math.sin;
  var Math_tan=Math.tan;
  var Math_acos=Math.acos;
  var Math_asin=Math.asin;
  var Math_atan=Math.atan;
  var Math_atan2=Math.atan2;
  var Math_exp=Math.exp;
  var Math_log=Math.log;
  var Math_sqrt=Math.sqrt;
  var Math_ceil=Math.ceil;
  var Math_floor=Math.floor;
  var Math_pow=Math.pow;
  var Math_imul=Math.imul;
  var Math_fround=Math.fround;
  var Math_round=Math.round;
  var Math_min=Math.min;
  var Math_max=Math.max;
  var Math_clz32=Math.clz32;
  var Math_trunc=Math.trunc;
  var runDependencies=0;
  var runDependencyWatcher=null;
  var dependenciesFulfilled=null;
  var runDependencyTracking={}
  function getUniqueRunDependency(id) {
    var orig=id;
    while (1) {
      if (!runDependencyTracking[id])
        return id;
      id = orig+Math.random();
    }
  }
  function addRunDependency(id) {
    runDependencies++;
    if (Module['monitorRunDependencies']) {
        Module['monitorRunDependencies'](runDependencies);
    }
    if (id) {
        assert(!runDependencyTracking[id]);
        runDependencyTracking[id] = 1;
        if (runDependencyWatcher===null&&typeof setInterval!=='undefined') {
            runDependencyWatcher = setInterval(function () {
              if (ABORT) {
                  clearInterval(runDependencyWatcher);
                  runDependencyWatcher = null;
                  return ;
              }
              var shown=false;
              for (var dep in runDependencyTracking) {
                  if (!shown) {
                      shown = true;
                      err('still waiting on run dependencies:');
                  }
                  err('dependency: '+dep);
              }
              if (shown) {
                  err('(end of list)');
              }
            }, 10000);
        }
    }
    else {
      err('warning: run dependency added without ID');
    }
  }
  function removeRunDependency(id) {
    runDependencies--;
    if (Module['monitorRunDependencies']) {
        Module['monitorRunDependencies'](runDependencies);
    }
    if (id) {
        assert(runDependencyTracking[id]);
        delete runDependencyTracking[id];
    }
    else {
      err('warning: run dependency removed without ID');
    }
    if (runDependencies==0) {
        if (runDependencyWatcher!==null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null;
        }
        if (dependenciesFulfilled) {
            var callback=dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback();
        }
    }
  }
  Module["preloadedImages"] = {}
  Module["preloadedAudios"] = {}
  function abort(what) {
    if (Module['onAbort']) {
        Module['onAbort'](what);
    }
    what+='';
    out(what);
    err(what);
    ABORT = true;
    EXITSTATUS = 1;
    var output='abort('+what+') at '+stackTrace();
    what = output;
    throw new WebAssembly.RuntimeError(what);
  }
  var memoryInitializer=null;
  var FS={error: function () {
      abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with  -s FORCE_FILESYSTEM=1');
    }, 
   init: function () {
      FS.error();
    }, 
   createDataFile: function () {
      FS.error();
    }, 
   createPreloadedFile: function () {
      FS.error();
    }, 
   createLazyFile: function () {
      FS.error();
    }, 
   open: function () {
      FS.error();
    }, 
   mkdev: function () {
      FS.error();
    }, 
   registerDevice: function () {
      FS.error();
    }, 
   analyzePath: function () {
      FS.error();
    }, 
   loadFilesFromDB: function () {
      FS.error();
    }, 
   ErrnoError: function ErrnoError() {
      FS.error();
    }}
  Module['FS_createDataFile'] = FS.createDataFile;
  Module['FS_createPreloadedFile'] = FS.createPreloadedFile;
  function hasPrefix(str, prefix) {
    return String.prototype.startsWith ? str.startsWith(prefix) : str.indexOf(prefix)===0;
  }
  var dataURIPrefix='data:application/octet-stream;base64,';
  function isDataURI(filename) {
    return hasPrefix(filename, dataURIPrefix);
  }
  var fileURIPrefix="file://";
  function isFileURI(filename) {
    return hasPrefix(filename, fileURIPrefix);
  }
  if (!isDataURI(wasmBinaryFile)) {
      wasmBinaryFile = locateFile(wasmBinaryFile);
  }
  function getBinary() {
    try {
      if (wasmBinary) {
          return new Uint8Array(wasmBinary);
      }
      if (readBinary) {
          return readBinary(wasmBinaryFile);
      }
      else {
        throw "both async and sync fetching of the wasm failed";
      }
    }
    catch (err) {
        abort(err);
    }
  }
  function getBinaryPromise() {
    if (!wasmBinary&&(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER)&&typeof fetch==='function'&&!isFileURI(wasmBinaryFile)) {
        return fetch(wasmBinaryFile, {credentials: 'same-origin'}).then(function (response) {
          if (!response['ok']) {
              throw "failed to load wasm binary file at '"+wasmBinaryFile+"'";
          }
          return response['arrayBuffer']();
        }).catch(function () {
          return getBinary();
        });
    }
    return new Promise(function (resolve, reject) {
      resolve(getBinary());
    });
  }
  function createWasm() {
    var info={'env': asmLibraryArg, 
    'wasi_snapshot_preview1': asmLibraryArg}
    function receiveInstance(instance, module) {
      var exports=instance.exports;
      Module['asm'] = exports;
      removeRunDependency('wasm-instantiate');
    }
    addRunDependency('wasm-instantiate');
    var trueModule=Module;
    function receiveInstantiatedSource(output) {
      assert(Module===trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
      trueModule = null;
      receiveInstance(output['instance']);
    }
    function instantiateArrayBuffer(receiver) {
      return getBinaryPromise().then(function (binary) {
        return WebAssembly.instantiate(binary, info);
      }).then(receiver, function (reason) {
        err('failed to asynchronously prepare wasm: '+reason);
        abort(reason);
      });
    }
    function instantiateAsync() {
      if (!wasmBinary&&typeof WebAssembly.instantiateStreaming==='function'&&!isDataURI(wasmBinaryFile)&&!isFileURI(wasmBinaryFile)&&typeof fetch==='function') {
          fetch(wasmBinaryFile, {credentials: 'same-origin'}).then(function (response) {
            var result=WebAssembly.instantiateStreaming(response, info);
            return result.then(receiveInstantiatedSource, function (reason) {
              err('wasm streaming compile failed: '+reason);
              err('falling back to ArrayBuffer instantiation');
              instantiateArrayBuffer(receiveInstantiatedSource);
            });
          });
      }
      else {
        return instantiateArrayBuffer(receiveInstantiatedSource);
      }
    }
    if (Module['instantiateWasm']) {
        try {
          var exports=Module['instantiateWasm'](info, receiveInstance);
          return exports;
        }
        catch (e) {
            err('Module.instantiateWasm callback failed with error: '+e);
            return false;
        }
    }
    instantiateAsync();
    return {}
  }
  var tempDouble;
  var tempI64;
  var ASM_CONSTS={}
  function sendMessage(x, buffer, len) {
    _wasm_post_message(x, buffer, len);
  }
  __ATINIT__.push({func: function () {
      ___wasm_call_ctors();
    }});
  function demangle(func) {
    warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
    return func;
  }
  function demangleAll(text) {
    var regex=/\b_Z[\w\d_]+/g;
    return text.replace(regex, function (x) {
      var y=demangle(x);
      return x===y ? x : (y+' ['+x+']');
    });
  }
  function jsStackTrace() {
    var err=new Error();
    if (!err.stack) {
        try {
          throw new Error();
        }
        catch (e) {
            err = e;
        }
        if (!err.stack) {
            return '(no stack trace available)';
        }
    }
    return err.stack.toString();
  }
  function stackTrace() {
    var js=jsStackTrace();
    if (Module['extraStackTrace'])
      js+='\n'+Module['extraStackTrace']();
    return demangleAll(js);
  }
  function ___handle_stack_overflow() {
    abort('stack overflow');
  }
  function _clock() {
    if (_clock.start===undefined)
      _clock.start = Date.now();
    return ((Date.now()-_clock.start)*(1000000/1000))|0;
  }
  function _emscripten_get_sbrk_ptr() {
    return 11184;
  }
  function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.copyWithin(dest, src, src+num);
  }
  function _emscripten_get_heap_size() {
    return HEAPU8.length;
  }
  function emscripten_realloc_buffer(size) {
    try {
      wasmMemory.grow((size-buffer.byteLength+65535)>>>16);
      updateGlobalBufferAndViews(wasmMemory.buffer);
      return 1;
    }
    catch (e) {
        console.error('emscripten_realloc_buffer: Attempted to grow heap from '+buffer.byteLength+' bytes to '+size+' bytes, but got error: '+e);
    }
  }
  function _emscripten_resize_heap(requestedSize) {
    requestedSize = requestedSize>>>0;
    var oldSize=_emscripten_get_heap_size();
    assert(requestedSize>oldSize);
    var PAGE_MULTIPLE=65536;
    var maxHeapSize=2147483648;
    if (requestedSize>maxHeapSize) {
        err('Cannot enlarge memory, asked to go up to '+requestedSize+' bytes, but the limit is '+maxHeapSize+' bytes!');
        return false;
    }
    var minHeapSize=16777216;
    for (var cutDown=1; cutDown<=4; cutDown*=2) {
        var overGrownHeapSize=oldSize*(1+0.2/cutDown);
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize+100663296);
        var newSize=Math.min(maxHeapSize, alignUp(Math.max(minHeapSize, requestedSize, overGrownHeapSize), PAGE_MULTIPLE));
        var replacement=emscripten_realloc_buffer(newSize);
        if (replacement) {
            return true;
        }
    }
    err('Failed to grow the heap from '+oldSize+' bytes to '+newSize+' bytes, not enough memory!');
    return false;
  }
  function flush_NO_FILESYSTEM() {
    if (typeof _fflush!=='undefined')
      _fflush(0);
    var buffers=SYSCALLS.buffers;
    if (buffers[1].length)
      SYSCALLS.printChar(1, 10);
    if (buffers[2].length)
      SYSCALLS.printChar(2, 10);
  }
  var PATH={splitPath: function (filename) {
      var splitPathRe=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
      return splitPathRe.exec(filename).slice(1);
    }, 
   normalizeArray: function (parts, allowAboveRoot) {
      var up=0;
      for (var i=parts.length-1; i>=0; i--) {
          var last=parts[i];
          if (last==='.') {
              parts.splice(i, 1);
          }
          else 
            if (last==='..') {
              parts.splice(i, 1);
              up++;
          }
          else 
            if (up) {
              parts.splice(i, 1);
              up--;
          }
      }
      if (allowAboveRoot) {
          for (; up; up--) {
              parts.unshift('..');
          }
      }
      return parts;
    }, 
   normalize: function (path) {
      var isAbsolute=path.charAt(0)==='/', trailingSlash=path.substr(-1)==='/';
      path = PATH.normalizeArray(path.split('/').filter(function (p) {
        return !!p;
      }), !isAbsolute).join('/');
      if (!path&&!isAbsolute) {
          path = '.';
      }
      if (path&&trailingSlash) {
          path+='/';
      }
      return (isAbsolute ? '/' : '')+path;
    }, 
   dirname: function (path) {
      var result=PATH.splitPath(path), root=result[0], dir=result[1];
      if (!root&&!dir) {
          return '.';
      }
      if (dir) {
          dir = dir.substr(0, dir.length-1);
      }
      return root+dir;
    }, 
   basename: function (path) {
      if (path==='/')
        return '/';
      var lastSlash=path.lastIndexOf('/');
      if (lastSlash===-1)
        return path;
      return path.substr(lastSlash+1);
    }, 
   extname: function (path) {
      return PATH.splitPath(path)[3];
    }, 
   join: function () {
      var paths=Array.prototype.slice.call(arguments, 0);
      return PATH.normalize(paths.join('/'));
    }, 
   join2: function (l, r) {
      return PATH.normalize(l+'/'+r);
    }}
  var SYSCALLS={mappings: {}, 
   buffers: [null, [], []], 
   printChar: function (stream, curr) {
      var buffer=SYSCALLS.buffers[stream];
      assert(buffer);
      if (curr===0||curr===10) {
          (stream===1 ? out : err)(UTF8ArrayToString(buffer, 0));
          buffer.length = 0;
      }
      else {
        buffer.push(curr);
      }
    }, 
   varargs: undefined, 
   get: function () {
      assert(SYSCALLS.varargs!=undefined);
      SYSCALLS.varargs+=4;
      var ret=HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
      return ret;
    }, 
   getStr: function (ptr) {
      var ret=UTF8ToString(ptr);
      return ret;
    }, 
   get64: function (low, high) {
      if (low>=0)
        assert(high===0);
      else 
        assert(high===-1);
      return low;
    }}
  function _fd_write(fd, iov, iovcnt, pnum) {
    var num=0;
    for (var i=0; i<iovcnt; i++) {
        var ptr=HEAP32[(((iov)+(i*8))>>2)];
        var len=HEAP32[(((iov)+(i*8+4))>>2)];
        for (var j=0; j<len; j++) {
            SYSCALLS.printChar(fd, HEAPU8[ptr+j]);
        }
        num+=len;
    }
    HEAP32[((pnum)>>2)] = num;
    return 0;
  }
  function _setTempRet0($i) {
    setTempRet0(($i)|0);
  }
  var ASSERTIONS=true;
  function intArrayFromString(stringy, dontAddNull, length) {
    var len=length>0 ? length : lengthBytesUTF8(stringy)+1;
    var u8array=new Array(len);
    var numBytesWritten=stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull)
      u8array.length = numBytesWritten;
    return u8array;
  }
  function intArrayToString(array) {
    var ret=[];
    for (var i=0; i<array.length; i++) {
        var chr=array[i];
        if (chr>0xff) {
            if (ASSERTIONS) {
                assert(false, 'Character code '+chr+' ('+String.fromCharCode(chr)+')  at offset '+i+' not in 0x00-0xFF.');
            }
            chr&=0xff;
        }
        ret.push(String.fromCharCode(chr));
    }
    return ret.join('');
  }
  var asmGlobalArg={}
  var asmLibraryArg={"__handle_stack_overflow": ___handle_stack_overflow, 
   "clock": _clock, 
   "emscripten_get_sbrk_ptr": _emscripten_get_sbrk_ptr, 
   "emscripten_memcpy_big": _emscripten_memcpy_big, 
   "emscripten_resize_heap": _emscripten_resize_heap, 
   "fd_write": _fd_write, 
   "memory": wasmMemory, 
   "sendMessage": sendMessage, 
   "setTempRet0": _setTempRet0, 
   "table": wasmTable}
  var asm=createWasm();
  Module["asm"] = asm;
  var ___wasm_call_ctors=Module["___wasm_call_ctors"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["__wasm_call_ctors"].apply(null, arguments);
  }
  var _FM_malloc=Module["_FM_malloc"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["FM_malloc"].apply(null, arguments);
  }
  var _malloc=Module["_malloc"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["malloc"].apply(null, arguments);
  }
  var _FM_free=Module["_FM_free"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["FM_free"].apply(null, arguments);
  }
  var _free=Module["_free"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["free"].apply(null, arguments);
  }
  var _evalCurve=Module["_evalCurve"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["evalCurve"].apply(null, arguments);
  }
  var ___em_js__sendMessage=Module["___em_js__sendMessage"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["__em_js__sendMessage"].apply(null, arguments);
  }
  var _gotMessage=Module["_gotMessage"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["gotMessage"].apply(null, arguments);
  }
  var _main=Module["_main"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["main"].apply(null, arguments);
  }
  var ___errno_location=Module["___errno_location"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["__errno_location"].apply(null, arguments);
  }
  var _fflush=Module["_fflush"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["fflush"].apply(null, arguments);
  }
  var ___set_stack_limit=Module["___set_stack_limit"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["__set_stack_limit"].apply(null, arguments);
  }
  var stackSave=Module["stackSave"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["stackSave"].apply(null, arguments);
  }
  var stackAlloc=Module["stackAlloc"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["stackAlloc"].apply(null, arguments);
  }
  var stackRestore=Module["stackRestore"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["stackRestore"].apply(null, arguments);
  }
  var __growWasmMemory=Module["__growWasmMemory"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["__growWasmMemory"].apply(null, arguments);
  }
  var dynCall_ii=Module["dynCall_ii"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_ii"].apply(null, arguments);
  }
  var dynCall_iiii=Module["dynCall_iiii"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiii"].apply(null, arguments);
  }
  var dynCall_jiji=Module["dynCall_jiji"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_jiji"].apply(null, arguments);
  }
  var dynCall_iidiiii=Module["dynCall_iidiiii"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iidiiii"].apply(null, arguments);
  }
  var dynCall_vii=Module["dynCall_vii"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_vii"].apply(null, arguments);
  }
  Module['asm'] = asm;
  if (!Object.getOwnPropertyDescriptor(Module, "intArrayFromString"))
    Module["intArrayFromString"] = function () {
    abort("'intArrayFromString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "intArrayToString"))
    Module["intArrayToString"] = function () {
    abort("'intArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  Module["ccall"] = ccall;
  if (!Object.getOwnPropertyDescriptor(Module, "cwrap"))
    Module["cwrap"] = function () {
    abort("'cwrap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "setValue"))
    Module["setValue"] = function () {
    abort("'setValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "getValue"))
    Module["getValue"] = function () {
    abort("'getValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "allocate"))
    Module["allocate"] = function () {
    abort("'allocate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  Module["getMemory"] = getMemory;
  if (!Object.getOwnPropertyDescriptor(Module, "UTF8ArrayToString"))
    Module["UTF8ArrayToString"] = function () {
    abort("'UTF8ArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "UTF8ToString"))
    Module["UTF8ToString"] = function () {
    abort("'UTF8ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8Array"))
    Module["stringToUTF8Array"] = function () {
    abort("'stringToUTF8Array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8"))
    Module["stringToUTF8"] = function () {
    abort("'stringToUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF8"))
    Module["lengthBytesUTF8"] = function () {
    abort("'lengthBytesUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stackTrace"))
    Module["stackTrace"] = function () {
    abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "addOnPreRun"))
    Module["addOnPreRun"] = function () {
    abort("'addOnPreRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  Module["addOnInit"] = addOnInit;
  Module["addOnPreMain"] = addOnPreMain;
  if (!Object.getOwnPropertyDescriptor(Module, "addOnExit"))
    Module["addOnExit"] = function () {
    abort("'addOnExit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "addOnPostRun"))
    Module["addOnPostRun"] = function () {
    abort("'addOnPostRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "writeStringToMemory"))
    Module["writeStringToMemory"] = function () {
    abort("'writeStringToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "writeArrayToMemory"))
    Module["writeArrayToMemory"] = function () {
    abort("'writeArrayToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "writeAsciiToMemory"))
    Module["writeAsciiToMemory"] = function () {
    abort("'writeAsciiToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "addRunDependency"))
    Module["addRunDependency"] = function () {
    abort("'addRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "removeRunDependency"))
    Module["removeRunDependency"] = function () {
    abort("'removeRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "FS_createFolder"))
    Module["FS_createFolder"] = function () {
    abort("'FS_createFolder' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "FS_createPath"))
    Module["FS_createPath"] = function () {
    abort("'FS_createPath' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "FS_createDataFile"))
    Module["FS_createDataFile"] = function () {
    abort("'FS_createDataFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "FS_createPreloadedFile"))
    Module["FS_createPreloadedFile"] = function () {
    abort("'FS_createPreloadedFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "FS_createLazyFile"))
    Module["FS_createLazyFile"] = function () {
    abort("'FS_createLazyFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "FS_createLink"))
    Module["FS_createLink"] = function () {
    abort("'FS_createLink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "FS_createDevice"))
    Module["FS_createDevice"] = function () {
    abort("'FS_createDevice' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "FS_unlink"))
    Module["FS_unlink"] = function () {
    abort("'FS_unlink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "dynamicAlloc"))
    Module["dynamicAlloc"] = function () {
    abort("'dynamicAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "loadDynamicLibrary"))
    Module["loadDynamicLibrary"] = function () {
    abort("'loadDynamicLibrary' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "loadWebAssemblyModule"))
    Module["loadWebAssemblyModule"] = function () {
    abort("'loadWebAssemblyModule' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "getLEB"))
    Module["getLEB"] = function () {
    abort("'getLEB' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "getFunctionTables"))
    Module["getFunctionTables"] = function () {
    abort("'getFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "alignFunctionTables"))
    Module["alignFunctionTables"] = function () {
    abort("'alignFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "registerFunctions"))
    Module["registerFunctions"] = function () {
    abort("'registerFunctions' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "addFunction"))
    Module["addFunction"] = function () {
    abort("'addFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "removeFunction"))
    Module["removeFunction"] = function () {
    abort("'removeFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "getFuncWrapper"))
    Module["getFuncWrapper"] = function () {
    abort("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "prettyPrint"))
    Module["prettyPrint"] = function () {
    abort("'prettyPrint' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "makeBigInt"))
    Module["makeBigInt"] = function () {
    abort("'makeBigInt' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "dynCall"))
    Module["dynCall"] = function () {
    abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "getCompilerSetting"))
    Module["getCompilerSetting"] = function () {
    abort("'getCompilerSetting' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "print"))
    Module["print"] = function () {
    abort("'print' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "printErr"))
    Module["printErr"] = function () {
    abort("'printErr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "getTempRet0"))
    Module["getTempRet0"] = function () {
    abort("'getTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "setTempRet0"))
    Module["setTempRet0"] = function () {
    abort("'setTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "callMain"))
    Module["callMain"] = function () {
    abort("'callMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "abort"))
    Module["abort"] = function () {
    abort("'abort' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stringToNewUTF8"))
    Module["stringToNewUTF8"] = function () {
    abort("'stringToNewUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "emscripten_realloc_buffer"))
    Module["emscripten_realloc_buffer"] = function () {
    abort("'emscripten_realloc_buffer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "ENV"))
    Module["ENV"] = function () {
    abort("'ENV' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "setjmpId"))
    Module["setjmpId"] = function () {
    abort("'setjmpId' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_CODES"))
    Module["ERRNO_CODES"] = function () {
    abort("'ERRNO_CODES' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_MESSAGES"))
    Module["ERRNO_MESSAGES"] = function () {
    abort("'ERRNO_MESSAGES' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "setErrNo"))
    Module["setErrNo"] = function () {
    abort("'setErrNo' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "DNS"))
    Module["DNS"] = function () {
    abort("'DNS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "GAI_ERRNO_MESSAGES"))
    Module["GAI_ERRNO_MESSAGES"] = function () {
    abort("'GAI_ERRNO_MESSAGES' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "Protocols"))
    Module["Protocols"] = function () {
    abort("'Protocols' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "Sockets"))
    Module["Sockets"] = function () {
    abort("'Sockets' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "UNWIND_CACHE"))
    Module["UNWIND_CACHE"] = function () {
    abort("'UNWIND_CACHE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "readAsmConstArgs"))
    Module["readAsmConstArgs"] = function () {
    abort("'readAsmConstArgs' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "jstoi_q"))
    Module["jstoi_q"] = function () {
    abort("'jstoi_q' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "jstoi_s"))
    Module["jstoi_s"] = function () {
    abort("'jstoi_s' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "reallyNegative"))
    Module["reallyNegative"] = function () {
    abort("'reallyNegative' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "formatString"))
    Module["formatString"] = function () {
    abort("'formatString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "PATH"))
    Module["PATH"] = function () {
    abort("'PATH' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "PATH_FS"))
    Module["PATH_FS"] = function () {
    abort("'PATH_FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "SYSCALLS"))
    Module["SYSCALLS"] = function () {
    abort("'SYSCALLS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "syscallMmap2"))
    Module["syscallMmap2"] = function () {
    abort("'syscallMmap2' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "syscallMunmap"))
    Module["syscallMunmap"] = function () {
    abort("'syscallMunmap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "flush_NO_FILESYSTEM"))
    Module["flush_NO_FILESYSTEM"] = function () {
    abort("'flush_NO_FILESYSTEM' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "JSEvents"))
    Module["JSEvents"] = function () {
    abort("'JSEvents' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "specialHTMLTargets"))
    Module["specialHTMLTargets"] = function () {
    abort("'specialHTMLTargets' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "demangle"))
    Module["demangle"] = function () {
    abort("'demangle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "demangleAll"))
    Module["demangleAll"] = function () {
    abort("'demangleAll' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "jsStackTrace"))
    Module["jsStackTrace"] = function () {
    abort("'jsStackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stackTrace"))
    Module["stackTrace"] = function () {
    abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "getEnvStrings"))
    Module["getEnvStrings"] = function () {
    abort("'getEnvStrings' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64"))
    Module["writeI53ToI64"] = function () {
    abort("'writeI53ToI64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Clamped"))
    Module["writeI53ToI64Clamped"] = function () {
    abort("'writeI53ToI64Clamped' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Signaling"))
    Module["writeI53ToI64Signaling"] = function () {
    abort("'writeI53ToI64Signaling' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Clamped"))
    Module["writeI53ToU64Clamped"] = function () {
    abort("'writeI53ToU64Clamped' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Signaling"))
    Module["writeI53ToU64Signaling"] = function () {
    abort("'writeI53ToU64Signaling' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "readI53FromI64"))
    Module["readI53FromI64"] = function () {
    abort("'readI53FromI64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "readI53FromU64"))
    Module["readI53FromU64"] = function () {
    abort("'readI53FromU64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "convertI32PairToI53"))
    Module["convertI32PairToI53"] = function () {
    abort("'convertI32PairToI53' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "convertU32PairToI53"))
    Module["convertU32PairToI53"] = function () {
    abort("'convertU32PairToI53' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "Browser"))
    Module["Browser"] = function () {
    abort("'Browser' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "FS"))
    Module["FS"] = function () {
    abort("'FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "MEMFS"))
    Module["MEMFS"] = function () {
    abort("'MEMFS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "TTY"))
    Module["TTY"] = function () {
    abort("'TTY' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "PIPEFS"))
    Module["PIPEFS"] = function () {
    abort("'PIPEFS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "SOCKFS"))
    Module["SOCKFS"] = function () {
    abort("'SOCKFS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "GL"))
    Module["GL"] = function () {
    abort("'GL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGet"))
    Module["emscriptenWebGLGet"] = function () {
    abort("'emscriptenWebGLGet' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetTexPixelData"))
    Module["emscriptenWebGLGetTexPixelData"] = function () {
    abort("'emscriptenWebGLGetTexPixelData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetUniform"))
    Module["emscriptenWebGLGetUniform"] = function () {
    abort("'emscriptenWebGLGetUniform' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetVertexAttrib"))
    Module["emscriptenWebGLGetVertexAttrib"] = function () {
    abort("'emscriptenWebGLGetVertexAttrib' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "AL"))
    Module["AL"] = function () {
    abort("'AL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "SDL_unicode"))
    Module["SDL_unicode"] = function () {
    abort("'SDL_unicode' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "SDL_ttfContext"))
    Module["SDL_ttfContext"] = function () {
    abort("'SDL_ttfContext' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "SDL_audio"))
    Module["SDL_audio"] = function () {
    abort("'SDL_audio' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "SDL"))
    Module["SDL"] = function () {
    abort("'SDL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "SDL_gfx"))
    Module["SDL_gfx"] = function () {
    abort("'SDL_gfx' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "GLUT"))
    Module["GLUT"] = function () {
    abort("'GLUT' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "EGL"))
    Module["EGL"] = function () {
    abort("'EGL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "GLFW_Window"))
    Module["GLFW_Window"] = function () {
    abort("'GLFW_Window' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "GLFW"))
    Module["GLFW"] = function () {
    abort("'GLFW' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "GLEW"))
    Module["GLEW"] = function () {
    abort("'GLEW' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "IDBStore"))
    Module["IDBStore"] = function () {
    abort("'IDBStore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "runAndAbortIfError"))
    Module["runAndAbortIfError"] = function () {
    abort("'runAndAbortIfError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "warnOnce"))
    Module["warnOnce"] = function () {
    abort("'warnOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stackSave"))
    Module["stackSave"] = function () {
    abort("'stackSave' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stackRestore"))
    Module["stackRestore"] = function () {
    abort("'stackRestore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stackAlloc"))
    Module["stackAlloc"] = function () {
    abort("'stackAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "AsciiToString"))
    Module["AsciiToString"] = function () {
    abort("'AsciiToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stringToAscii"))
    Module["stringToAscii"] = function () {
    abort("'stringToAscii' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "UTF16ToString"))
    Module["UTF16ToString"] = function () {
    abort("'UTF16ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF16"))
    Module["stringToUTF16"] = function () {
    abort("'stringToUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF16"))
    Module["lengthBytesUTF16"] = function () {
    abort("'lengthBytesUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "UTF32ToString"))
    Module["UTF32ToString"] = function () {
    abort("'UTF32ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF32"))
    Module["stringToUTF32"] = function () {
    abort("'stringToUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF32"))
    Module["lengthBytesUTF32"] = function () {
    abort("'lengthBytesUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8"))
    Module["allocateUTF8"] = function () {
    abort("'allocateUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8OnStack"))
    Module["allocateUTF8OnStack"] = function () {
    abort("'allocateUTF8OnStack' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  Module["writeStackCookie"] = writeStackCookie;
  Module["checkStackCookie"] = checkStackCookie;
  Module["abortStackOverflow"] = abortStackOverflow;
  if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_NORMAL"))
    Object.defineProperty(Module, "ALLOC_NORMAL", {configurable: true, 
   get: function () {
      abort("'ALLOC_NORMAL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
    }});
  if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_STACK"))
    Object.defineProperty(Module, "ALLOC_STACK", {configurable: true, 
   get: function () {
      abort("'ALLOC_STACK' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
    }});
  if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_DYNAMIC"))
    Object.defineProperty(Module, "ALLOC_DYNAMIC", {configurable: true, 
   get: function () {
      abort("'ALLOC_DYNAMIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
    }});
  if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_NONE"))
    Object.defineProperty(Module, "ALLOC_NONE", {configurable: true, 
   get: function () {
      abort("'ALLOC_NONE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
    }});
  var calledRun;
  function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit("+status+")";
    this.status = status;
  }
  var calledMain=false;
  dependenciesFulfilled = function runCaller() {
    if (!calledRun)
      run();
    if (!calledRun)
      dependenciesFulfilled = runCaller;
  }
  function callMain(args) {
    assert(runDependencies==0, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
    assert(__ATPRERUN__.length==0, 'cannot call main when preRun functions remain to be called');
    var entryFunction=Module['_main'];
    args = args||[];
    var argc=args.length+1;
    var argv=stackAlloc((argc+1)*4);
    HEAP32[argv>>2] = allocateUTF8OnStack(thisProgram);
    for (var i=1; i<argc; i++) {
        HEAP32[(argv>>2)+i] = allocateUTF8OnStack(args[i-1]);
    }
    HEAP32[(argv>>2)+argc] = 0;
    try {
      Module['___set_stack_limit'](STACK_MAX);
      var ret=entryFunction(argc, argv);
      exit(ret, true);
    }
    catch (e) {
        if (__instance_of(e, ExitStatus)) {
            return ;
        }
        else 
          if (e=='unwind') {
            noExitRuntime = true;
            return ;
        }
        else {
          var toLog=e;
          if (e&&typeof e==='object'&&e.stack) {
              toLog = [e, e.stack];
          }
          err('exception thrown: '+toLog);
          quit_(1, e);
        }
    }
    finally {
        calledMain = true;
      }
  }
  function run(args) {
    args = args||arguments_;
    if (runDependencies>0) {
        return ;
    }
    writeStackCookie();
    preRun();
    if (runDependencies>0)
      return ;
    function doRun() {
      if (calledRun)
        return ;
      calledRun = true;
      Module['calledRun'] = true;
      if (ABORT)
        return ;
      initRuntime();
      preMain();
      if (Module['onRuntimeInitialized'])
        Module['onRuntimeInitialized']();
      if (shouldRunNow)
        callMain(args);
      postRun();
    }
    if (Module['setStatus']) {
        Module['setStatus']('Running...');
        setTimeout(function () {
          setTimeout(function () {
            Module['setStatus']('');
          }, 1);
          doRun();
        }, 1);
    }
    else {
      doRun();
    }
    checkStackCookie();
  }
  Module['run'] = run;
  function checkUnflushedContent() {
    var print=out;
    var printErr=err;
    var has=false;
    out = err = function (x) {
      has = true;
    }
    try {
      var flush=flush_NO_FILESYSTEM;
      if (flush)
        flush();
    }
    catch (e) {
    }
    out = print;
    err = printErr;
    if (has) {
        warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.');
        warnOnce('(this may also be due to not including full filesystem support - try building with -s FORCE_FILESYSTEM=1)');
    }
  }
  function exit(status, implicit) {
    checkUnflushedContent();
    if (implicit&&noExitRuntime&&status===0) {
        return ;
    }
    if (noExitRuntime) {
        if (!implicit) {
            var msg='program exited (with status: '+status+'), but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)';
            err(msg);
        }
    }
    else {
      ABORT = true;
      EXITSTATUS = status;
      exitRuntime();
      if (Module['onExit'])
        Module['onExit'](status);
    }
    quit_(status, new ExitStatus(status));
  }
  if (Module['preInit']) {
      if (typeof Module['preInit']=='function')
        Module['preInit'] = [Module['preInit']];
      while (Module['preInit'].length>0) {
        Module['preInit'].pop()();
      }
  }
  var shouldRunNow=true;
  if (Module['noInitialRun'])
    shouldRunNow = false;
  noExitRuntime = true;
  run();
}, '/dev/fairmotion/src/wasm/built_wasm.js');
es6_module_define('native_api', ["../core/ajax.js", "../curve/spline_base.js", "../path.ux/scripts/util/vectormath.js", "../util/typedwriter.js", "../curve/spline_math_hermite.js", "../path.ux/scripts/util/util.js", "./built_wasm.js", "../curve/solver.js", "../core/toolops_api.js"], function _native_api_module(_es6_module) {
  var wasm=es6_import(_es6_module, './built_wasm.js');
  let wasmModule=wasm;
  wasmModule = _es6_module.add_export('wasmModule', wasmModule);
  let active_solves={}
  active_solves = _es6_module.add_export('active_solves', active_solves);
  let solve_starttimes={}
  solve_starttimes = _es6_module.add_export('solve_starttimes', solve_starttimes);
  let solve_starttimes2={}
  solve_starttimes2 = _es6_module.add_export('solve_starttimes2', solve_starttimes2);
  let solve_endtimes={}
  solve_endtimes = _es6_module.add_export('solve_endtimes', solve_endtimes);
  let active_jobs={}
  active_jobs = _es6_module.add_export('active_jobs', active_jobs);
  var constraint=es6_import_item(_es6_module, '../curve/solver.js', 'constraint');
  var solver=es6_import_item(_es6_module, '../curve/solver.js', 'solver');
  var ModalStates=es6_import_item(_es6_module, '../core/toolops_api.js', 'ModalStates');
  var SplineTypes=es6_import_item(_es6_module, '../curve/spline_base.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../curve/spline_base.js', 'SplineFlags');
  var build_solver=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'build_solver');
  var solve_pre=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'solve_pre');
  var TypedWriter=es6_import_item(_es6_module, '../util/typedwriter.js', 'TypedWriter');
  var util=es6_import(_es6_module, '../path.ux/scripts/util/util.js');
  var Vector2=es6_import_item(_es6_module, '../path.ux/scripts/util/vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../path.ux/scripts/util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../path.ux/scripts/util/vectormath.js', 'Vector4');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/util/vectormath.js', 'Matrix4');
  var Quat=es6_import_item(_es6_module, '../path.ux/scripts/util/vectormath.js', 'Quat');
  var ajax=es6_import(_es6_module, '../core/ajax.js');
  function isReady() {
    return wasm.calledRun;
  }
  isReady = _es6_module.add_export('isReady', isReady);
  const mmax=Math.max, mmin=Math.min, mfloor=Math.floor;
  const abs=Math.abs, sqrt=Math.sqrt, sin=Math.sin, cos=Math.cos, pow=Math.pow, log=Math.log, acos=Math.acos, asin=Math.asin, PI=Math.PI;
  let last_call=undefined;
  let DEBUG=false;
  const FIXED_KS_FLAG=SplineFlags.FIXED_KS;
  const callbacks={}
  _es6_module.add_export('callbacks', callbacks);
  let msg_idgen=0;
  let solve_idgen=0;
  var ORDER=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'ORDER');
  var KSCALE=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'KANGLE');
  var KSTARTX=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'KSTARTX');
  var KSTARTY=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'KSTARTY');
  var KSTARTZ=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'KSTARTZ');
  var KTOTKS=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'KTOTKS');
  var INT_STEPS=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'INT_STEPS');
  function onMessage(type, message, ptr) {
    let iview=new Int32Array(message);
    let id=iview[1];
    if (DEBUG)
      console.log("got array buffer!", message, "ID", id);
    if (!(id in callbacks)) {
        if (DEBUG)
          console.log("Warning, dead communication callback", id);
        return ;
    }
    let job=callbacks[id], iter=job.job;
    if (DEBUG)
      console.log("job:", job);
    job.status.data = message.slice(8, message.byteLength);
    if (DEBUG)
      console.log("iter:", iter, iter.data);
    let ret=iter.next();
    if (ret.done) {
        delete callbacks[id];
        if (job.callback!==undefined)
          job.callback.call(job.thisvar, job.status.value);
    }
    wasm._free(ptr);
  }
  onMessage = _es6_module.add_export('onMessage', onMessage);
  let messageQueue=[];
  messageQueue = _es6_module.add_export('messageQueue', messageQueue);
  let queueMessages=false;
  function queueUpMessages(state) {
    queueMessages = state;
  }
  queueUpMessages = _es6_module.add_export('queueUpMessages', queueUpMessages);
  function flushQueue() {
    let queue=messageQueue.slice(0, messageQueue.length);
    messageQueue.length = 0;
    for (let msg of queue) {
        onMessage(msg.type, msg.msg, msg.ptr);
    }
  }
  flushQueue = _es6_module.add_export('flushQueue', flushQueue);
  window._wasm_post_message = function (type, ptr, len) {
    if (DEBUG)
      console.log("got wasm message", type, ptr, len);
    let message=wasm.HEAPU8.slice(ptr, ptr+len).buffer;
    if (DEBUG)
      console.log(message);
    if (!queueMessages) {
        onMessage(type, message, ptr);
    }
    else {
      if (DEBUG)
        console.log("Queuing a message!", type, message, ptr, "=======");
      messageQueue.push({type: type, 
     msg: message, 
     ptr: ptr});
    }
  }
  let wv1, wv2, wks, wco;
  let pv1, pv2, pks, pco;
  function init_eval_mem() {
    let ptr=wasm._malloc(8*3+8*16+8*3*2);
    let mem=wasm.HEAPU8;
    wv1 = new Float64Array(mem.buffer, ptr, 2);
    pv1 = ptr;
    ptr+=8*2;
    wv2 = new Float64Array(mem.buffer, ptr, 2);
    pv2 = ptr;
    ptr+=8*2;
    wks = new Float64Array(mem.buffer, ptr, 16);
    pks = ptr;
    ptr+=16*8;
    wco = new Float64Array(mem.buffer, ptr, 3);
    pco = ptr;
  }
  function onSegmentDestroy(seg) {
    if (seg.ks._has_wasm) {
        wasm._free(seg.ks.ptr);
        seg.ks = new Float64Array(16);
    }
  }
  onSegmentDestroy = _es6_module.add_export('onSegmentDestroy', onSegmentDestroy);
  function checkSegment(seg) {
    if (!seg.ks._has_wasm) {
        let ks=seg.ks;
        let ptr2=wasm._malloc(8*16);
        let ks2=new Float64Array(wasm.HEAPU8.buffer, ptr2, ks.length);
        for (let i=0; i<ks.length; i++) {
            ks2[i] = ks[i];
        }
        ks2._has_wasm = true;
        ks2.ptr = ptr2;
        seg.ks = ks2;
    }
  }
  checkSegment = _es6_module.add_export('checkSegment', checkSegment);
  let evalrets=util.cachering.fromConstructor(Vector2, 64);
  function evalCurve(seg, s, v1, v2, ks, no_update) {
    if (no_update===undefined) {
        no_update = false;
    }
    if (!wv1) {
        init_eval_mem();
    }
    for (let i=0; i<2; i++) {
        wv1[i] = v1[i];
        wv2[i] = v2[i];
    }
    checkSegment(seg);
    wasm._evalCurve(pco, s, seg.ks.ptr, pv1, pv2, no_update ? 1 : 0);
    let ret=evalrets.next();
    ret[0] = wco[0];
    ret[1] = wco[1];
    return ret;
  }
  evalCurve = _es6_module.add_export('evalCurve', evalCurve);
  function postToWasm(type, msg) {
    if (!(__instance_of(msg, ArrayBuffer))) {
        throw new Error("msg must be array buffer");
    }
    let bytes=new Uint8Array(msg);
    let ptr=wasm._malloc(msg.byteLength*2);
    let mem=wasm.HEAPU8;
    for (let i=ptr; i<ptr+bytes.length; i++) {
        mem[i] = bytes[i-ptr];
    }
    wasm._gotMessage(type, ptr, msg.byteLength);
    wasm._free(ptr);
  }
  postToWasm = _es6_module.add_export('postToWasm', postToWasm);
  function test_wasm() {
    let msg=new Int32Array([0, 1, 2, 3, 2, 1, -1]);
    console.log(msg);
    postToWasm(0, msg.buffer);
  }
  test_wasm = _es6_module.add_export('test_wasm', test_wasm);
  const MessageTypes={GEN_DRAW_BEZIERS: 0, 
   REPLY: 1, 
   SOLVE: 2}
  _es6_module.add_export('MessageTypes', MessageTypes);
  const ConstraintTypes={TAN_CONSTRAINT: 0, 
   HARD_TAN_CONSTRAINT: 1, 
   CURVATURE_CONSTRAINT: 2, 
   COPY_C_CONSTRAINT: 3}
  _es6_module.add_export('ConstraintTypes', ConstraintTypes);
  const JobTypes={DRAWSOLVE: 1, 
   PATHSOLVE: 2, 
   SOLVE: 1|2}
  _es6_module.add_export('JobTypes', JobTypes);
  function clear_jobs_except_latest(typeid) {
    let last=undefined;
    let lastk=undefined;
    for (let k in callbacks) {
        let job=callbacks[k];
        if (job.typeid&typeid) {
            job._skip = 1;
            delete callbacks[k];
            last = job;
            lastk = k;
        }
    }
    if (last!==undefined) {
        callbacks[lastk] = last;
        delete last._skip;
    }
  }
  clear_jobs_except_latest = _es6_module.add_export('clear_jobs_except_latest', clear_jobs_except_latest);
  function clear_jobs_except_first(typeid) {
    let last=undefined;
    let lastk=undefined;
    for (let k in callbacks) {
        let job=callbacks[k];
        if (job.typeid&typeid) {
            if (last!=undefined) {
                job._skip = 1;
                delete callbacks[k];
            }
            last = job;
            lastk = k;
        }
    }
  }
  clear_jobs_except_first = _es6_module.add_export('clear_jobs_except_first', clear_jobs_except_first);
  function clear_jobs(typeid) {
    for (let k in callbacks) {
        let job=callbacks[k];
        if (job.typeid&typeid) {
            job._skip = 1;
            delete callbacks[k];
        }
    }
  }
  clear_jobs = _es6_module.add_export('clear_jobs', clear_jobs);
  function call_api(job, params) {
    if (params===undefined) {
        params = undefined;
    }
    let callback, error, thisvar, typeid, only_latest=false;
    if (params!==undefined) {
        callback = params.callback;
        thisvar = params.thisvar!==undefined ? params.thisvar : self;
        error = params.error;
        only_latest = params.only_latest!==undefined ? params.only_latest : false;
        typeid = params.typeid;
    }
    let postMessage=function (type, msg) {
      postToWasm(type, msg);
    }
    let id=msg_idgen++;
    let status={msgid: id, 
    data: undefined}
    let args=[postMessage, status];
    for (let i=2; i<arguments.length; i++) {
        args.push(arguments[i]);
    }
    queueUpMessages(true);
    let iter=job.apply(job, args);
    let ret=iter.next();
    if (ret.done) {
        callback.call(thisvar, iter.value);
        return ;
    }
    if (DEBUG)
      console.log("  SETTING CALLBACK WITH ID", id);
    callbacks[id] = {job: iter, 
    typeid: typeid, 
    only_latest: only_latest, 
    callback: callback, 
    thisvar: thisvar, 
    error: error, 
    status: status}
    queueUpMessages(false);
    flushQueue();
  }
  call_api = _es6_module.add_export('call_api', call_api);
  function start_message(type, msgid, endian) {
    let data=[];
    ajax.pack_int(data, type, endian);
    ajax.pack_int(data, msgid, endian);
    return data;
  }
  start_message = _es6_module.add_export('start_message', start_message);
  function start_message_new(writer, type, msgid, endian) {
    writer.int32(type);
    writer.int32(msgid);
  }
  start_message_new = _es6_module.add_export('start_message_new', start_message_new);
  function _unpacker(dview) {
    let b=0;
    return {getint: function getint() {
        b+=4;
        return dview.getInt32(b-4, endian);
      }, 
    getfloat: function getfloat() {
        b+=4;
        return dview.getFloat32(b-4, endian);
      }, 
    getdouble: function getdouble() {
        b+=8;
        return dview.getFloat64(b-8, endian);
      }}
  }
  function do_solve(sflags, spline, steps, gk, return_promise) {
    if (gk===undefined) {
        gk = 0.95;
    }
    if (return_promise===undefined) {
        return_promise = false;
    }
    let draw_id=push_solve(spline);
    spline._solve_id = draw_id;
    let job_id=solve_idgen++;
    active_solves[spline._solve_id] = job_id;
    active_jobs[job_id] = spline._solve_id;
    solve_starttimes[job_id] = time_ms();
    const SplineFlags=sflags;
    spline.resolve = 1;
    solve_pre(spline);
    let on_finish, on_reject, promise;
    if (return_promise) {
        promise = new Promise(function (resolve, reject) {
          on_finish = function () {
            resolve();
          }
          on_reject = function () {
            reject();
          }
        });
    }
    function finish(unload) {
      let start_time=solve_starttimes[job_id];
      window.pop_solve(draw_id);
      let skip=solve_endtimes[spline._solve_id]>start_time;
      skip = skip&&solve_starttimes2[spline._solve_id]>start_time;
      delete active_jobs[job_id];
      delete active_solves[spline._solve_id];
      delete solve_starttimes[job_id];
      if (skip) {
          if (on_reject!==undefined) {
              on_reject();
          }
          console.log("Dropping dead solve job", job_id);
          return ;
      }
      unload();
      solve_endtimes[spline._solve_id] = time_ms();
      solve_starttimes2[spline._solve_id] = start_time;
      if (_DEBUG.solve_times) {
          console.log((solve_endtimes[spline._solve_id]-start_time).toFixed(2)+"ms");
      }
      for (let seg of spline.segments) {
          seg.evaluate(0.5);
          for (let j=0; j<seg.ks.length; j++) {
              if (isNaN(seg.ks[j])) {
                  console.log("NaN!", seg.ks, seg);
                  seg.ks[j] = 0;
              }
          }
          if (g_app_state.modalstate!==ModalStates.TRANSFROMING) {
              if ((seg.v1.flag&SplineFlags.UPDATE)||(seg.v2.flag&SplineFlags.UPDATE))
                seg.update_aabb();
          }
          else {
            if ((seg.v1.flag&SplineFlags.UPDATE)||(seg.v2.flag&SplineFlags.UPDATE))
              seg.flag|=SplineFlags.UPDATE_AABB;
          }
      }
      for (let f of spline.faces) {
          for (let path of f.paths) {
              for (let l of path) {
                  if (l.v.flag&SplineFlags.UPDATE)
                    f.flag|=SplineFlags.UPDATE_AABB;
              }
          }
      }
      for (let h of spline.handles) {
          h.flag&=~(SplineFlags.UPDATE|SplineFlags.TEMP_TAG);
      }
      for (let v of spline.verts) {
          v.flag&=~(SplineFlags.UPDATE|SplineFlags.TEMP_TAG);
      }
      for (let seg of spline.segments) {
          seg.flag&=~SplineFlags.UPDATE;
      }
      if (spline.on_resolve!==undefined) {
          spline.on_resolve();
          spline.on_resolve = undefined;
      }
      if (on_finish!==undefined) {
          on_finish();
      }
    }
    spline.resolve = 0;
    let update_verts=new set();
    let slv=build_solver(spline, ORDER, undefined, 1, undefined, update_verts);
    let cs=slv.cs, edge_segs=slv.edge_segs;
    edge_segs = new set(edge_segs);
    call_api(wasm_solve, {callback: function (value) {
        finish(value);
      }, 
    error: function (error) {
        console.log("wasm solve error!");
        window.pop_solve(draw_id);
      }, 
    typeid: spline.is_anim_path ? JobTypes.PATHSOLVE : JobTypes.DRAWSOLVE, 
    only_latest: true}, spline, cs, update_verts, gk, edge_segs);
    return promise;
  }
  do_solve = _es6_module.add_export('do_solve', do_solve);
  window.wasm_do_solve = do_solve;
  function write_wasm_solve_new(writer, spline, cons, update_verts, update_segs, gk, edge_segs) {
    let idxmap={}
    let i=0;
    function add_vert(v) {
      writer.int32(v.eid);
      writer.int32(v.flag);
      writer.vec3(v);
      writer.int32(0);
      idxmap[v.eid] = i++;
    }
    for (let v of update_verts) {
        add_vert(v, true);
    }
    writer.int32(update_segs.length);
    writer.int32(0);
    i = 0;
    for (let s of update_segs) {
        let flag=s.flag;
        let count=s.v1.flag&SplineFlags.UPDATE ? 1 : 0;
        count+=s.v2.flag&SplineFlags.UPDATE ? 1 : 0;
        if (count<2) {
            flag|=FIXED_KS_FLAG;
        }
        writer.int32(s.eid);
        writer.int32(flag);
        let klen=s.ks.length;
        let is_eseg=edge_segs.has(s);
        checkSegment(s);
        writer.uint32(s.ks.ptr);
        writer.vec3(s.h1);
        writer.vec3(s.h2);
        writer.int32(idxmap[s.v1.eid]);
        writer.int32(idxmap[s.v2.eid]);
        writer.int32(0);
        idxmap[s.eid] = i++;
    }
    writer.int32(cons.length);
    writer.int32(0.0);
    for (let i=0; i<cons.length; i++) {
        let c=cons[i];
        let type=0, seg1=-1, seg2=-1, param1=0, param2=0, fparam1=0, fparam2=0;
        if (c.type==="tan_c") {
            type = ConstraintTypes.TAN_CONSTRAINT;
            seg1 = c.params[0];
            seg2 = c.params[1];
            let v=seg1.shared_vert(seg2);
            param1 = idxmap[seg1.eid];
            param2 = idxmap[seg2.eid];
            fparam1 = seg1.v2===v;
            fparam2 = seg2.v2===v;
            if (c.klst.length===1) {
                seg1 = c.klst[0]!==seg1.ks ? param2 : param1;
                seg2 = -1;
            }
            else {
              seg1 = param1;
              seg2 = param2;
            }
        }
        else 
          if (c.type==="hard_tan_c") {
            type = ConstraintTypes.HARD_TAN_CONSTRAINT;
            let seg=c.params[0], tan=c.params[1], s=c.params[2];
            seg1 = idxmap[seg.eid];
            seg2 = -1;
            fparam1 = Math.atan2(tan[0], tan[1]);
            fparam2 = s;
        }
        else 
          if (c.type==="curv_c") {
            type = ConstraintTypes.CURVATURE_CONSTRAINT;
            seg1 = c.params[0];
            seg2 = c.params[1];
            if (seg1.ks!==c.klst[0]) {
            }
            let v=seg1.shared_vert(seg2);
            fparam1 = seg1.v2===v;
            fparam2 = seg2.v2===v;
            param1 = idxmap[seg1.eid];
            param2 = idxmap[seg2.eid];
            seg1 = param1;
            seg2 = -1;
        }
        else 
          if (c.type==="copy_c") {
            type = ConstraintTypes.COPY_C_CONSTRAINT;
            seg1 = c.params[0];
            param1 = seg1.v1.segments.length===1;
        }
        else {
          console.trace(c, seg1, seg2);
          throw new Error("unknown constraint type "+c.type);
        }
        writer.int32(type);
        writer.float32(c.k);
        writer.float32(c.k2===undefined ? c.k : c.k2);
        writer.int32(0);
        writer.int32(seg1);
        writer.int32(seg2);
        writer.int32(param1);
        writer.int32(param2);
        writer.float32(fparam1);
        writer.float32(fparam2);
        for (let j=0; j<17; j++) {
            writer.float64(0);
        }
    }
    return idxmap;
  }
  function write_wasm_solve(data, spline, cons, update_verts, update_segs, gk, edge_segs) {
    let endian=ajax.little_endian;
    let idxmap={}
    let i=0;
    function add_vert(v) {
      ajax.pack_int(data, v.eid, endian);
      ajax.pack_int(data, v.flag, endian);
      ajax.pack_vec3(data, v, endian);
      ajax.pack_int(data, 0, endian);
      idxmap[v.eid] = i++;
    }
    for (let v of update_verts) {
        add_vert(v, true);
    }
    ajax.pack_int(data, update_segs.length, endian);
    ajax.pack_int(data, 0, endian);
    i = 0;
    for (let s of update_segs) {
        let flag=s.flag;
        if (edge_segs.has(s)) {
            flag|=FIXED_KS_FLAG;
        }
        ajax.pack_int(data, s.eid, endian);
        ajax.pack_int(data, flag, endian);
        let klen=s.ks.length;
        let is_eseg=edge_segs.has(s);
        let zero_ks=((s.v1.flag&SplineFlags.BREAK_TANGENTS)||(s.v2.flag&SplineFlags.BREAK_TANGENTS));
        for (let ji=0; ji<1; ji++) {
            for (let j=0; j<klen; j++) {
                if (zero_ks&&j<ORDER)
                  ajax.pack_double(data, 0.0, endian);
                else 
                  ajax.pack_double(data, is_eseg ? s.ks[j] : 0.0, endian);
            }
            for (let j=0; j<16-klen; j++) {
                ajax.pack_double(data, 0.0, endian);
            }
        }
        ajax.pack_vec3(data, s.h1, endian);
        ajax.pack_vec3(data, s.h2, endian);
        ajax.pack_int(data, idxmap[s.v1.eid], endian);
        ajax.pack_int(data, idxmap[s.v2.eid], endian);
        idxmap[s.eid] = i++;
    }
    ajax.pack_int(data, cons.length, endian);
    ajax.pack_int(data, 0, endian);
    for (let i=0; i<cons.length; i++) {
        let c=cons[i];
        let type=0, seg1=-1, seg2=-1, param1=0, param2=0, fparam1=0, fparam2=0;
        if (c.type==="tan_c") {
            type = ConstraintTypes.TAN_CONSTRAINT;
            seg1 = c.params[0];
            seg2 = c.params[1];
            let v=seg1.shared_vert(seg2);
            param1 = idxmap[seg1.eid];
            param2 = idxmap[seg2.eid];
            fparam1 = seg1.v2===v;
            fparam2 = seg2.v2===v;
            if (c.klst.length===1) {
                seg1 = c.klst[0]!==seg1.ks ? param2 : param1;
                seg2 = -1;
            }
            else {
              seg1 = param1;
              seg2 = param2;
            }
        }
        else 
          if (c.type==="hard_tan_c") {
            type = ConstraintTypes.HARD_TAN_CONSTRAINT;
            let seg=c.params[0], tan=c.params[1], s=c.params[2];
            seg1 = idxmap[seg.eid];
            seg2 = -1;
            fparam1 = Math.atan2(tan[0], tan[1]);
            fparam2 = s;
        }
        else 
          if (c.type==="curv_c") {
            type = ConstraintTypes.CURVATURE_CONSTRAINT;
            seg1 = c.params[0];
            seg2 = c.params[1];
            if (seg1.ks!==c.klst[0]) {
            }
            let v=seg1.shared_vert(seg2);
            fparam1 = seg1.v2===v;
            fparam2 = seg2.v2===v;
            param1 = idxmap[seg1.eid];
            param2 = idxmap[seg2.eid];
            seg1 = param1;
            seg2 = -1;
        }
        else 
          if (c.type==="copy_c") {
            type = ConstraintTypes.COPY_C_CONSTRAINT;
            seg1 = c.params[0];
            param1 = seg1.v1.segments.length===1;
        }
        ajax.pack_int(data, type, endian);
        ajax.pack_float(data, c.k*gk, endian);
        ajax.pack_float(data, c.k2==undefined ? c.k*gk : c.k2*gk, endian);
        ajax.pack_int(data, 0, endian);
        ajax.pack_int(data, seg1, endian);
        ajax.pack_int(data, seg2, endian);
        ajax.pack_int(data, param1, endian);
        ajax.pack_int(data, param2, endian);
        ajax.pack_float(data, fparam1, endian);
        ajax.pack_float(data, fparam2, endian);
        for (let j=0; j<33; j++) {
            ajax.pack_double(data, 0, endian);
        }
    }
    return idxmap;
  }
  function _unload(spline, data) {
    let _i=0;
    function getint() {
      _i+=4;
      return data.getInt32(_i-4, true);
    }
    function getfloat() {
      _i+=4;
      return data.getFloat32(_i-4, true);
    }
    function getdouble() {
      _i+=8;
      return data.getFloat64(_i-8, true);
    }
    let totvert=getint();
    getint();
    _i+=24*totvert;
    let totseg=getint();
    getint();
    if (DEBUG)
      console.log("totseg:", totseg);
  }
  function wrap_unload(spline, data) {
    return function () {
      _unload(spline, data);
    }
  }
  function wasm_solve(postMessage, status, spline, cons, update_verts, gk, edge_segs) {
    let ret={}
    ret.ret = {done: false, 
    value: undefined}
    ret.stage = 0;
    ret[Symbol.iterator] = function () {
      return this;
    }
    ret.next = function () {
      if (ret.stage===0) {
          this.stage++;
          this.stage0();
          return this.ret;
      }
      else 
        if (ret.stage===1) {
          this.stage++;
          this.stage1();
          this.ret.done = true;
          return this.ret;
      }
      else {
        this.ret.done = true;
        this.ret.value = undefined;
        return this.ret;
      }
    }
    let data;
    ret.stage0 = function () {
      let maxsize=(cons.length+1)*650+128;
      let writer=new TypedWriter(maxsize);
      let msgid=status.msgid;
      let endian=ajax.little_endian;
      let prof=false;
      start_message_new(writer, MessageTypes.SOLVE, msgid, endian);
      let timestart=time_ms();
      let update_segs=new set();
      for (let v of update_verts) {
          for (let i=0; i<v.segments.length; i++) {
              let s=v.segments[i];
              update_segs.add(s);
          }
      }
      for (let s of update_segs) {
          update_verts.add(s.v1);
          update_verts.add(s.v2);
      }
      if (prof)
        console.log("time a:", time_ms()-timestart);
      writer.int32(update_verts.length);
      writer.int32(0);
      if (prof)
        console.log("time b:", time_ms()-timestart);
      let idxmap=write_wasm_solve_new(writer, spline, cons, update_verts, update_segs, gk, edge_segs);
      let data=writer.final();
      if (prof)
        console.log("time c:", time_ms()-timestart);
      if (prof)
        console.log("time d:", time_ms()-timestart, data.byteLength);
      postMessage(MessageTypes.SOLVE, data);
      if (prof)
        console.log("DATA "+(data.byteLength/1024).toFixed(3)+"kb");
      if (prof)
        console.log("time e:", time_ms()-timestart, "\n\n\n");
    }
    ret.stage1 = function () {
      let buf1=status.data;
      data = new DataView(buf1);
      status.value = wrap_unload(spline, data);
    }
    return ret;
  }
  wasm_solve = _es6_module.add_export('wasm_solve', wasm_solve);
}, '/dev/fairmotion/src/wasm/native_api.js');
es6_module_define('addon_api_intern', ["../core/frameset.js", "../curve/spline.js", "../path.ux/scripts/pathux.js"], function _addon_api_intern_module(_es6_module) {
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
  var cconst=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'cconst');
  var Spline=es6_import_item(_es6_module, '../curve/spline.js', 'Spline');
  var SplineFrameSet=es6_import_item(_es6_module, '../core/frameset.js', 'SplineFrameSet');
  function bindAddonAPI(addon) {
    return {registerCustomBlockData: function registerCustomBlockData(datablock_cls, cls) {
        throw new Error("implement me!");
      }, 
    nstructjs: {register: function register(cls) {
          let s=new nstructjs.STRUCT();
          s.add_class(cls);
          if (cls.structName.search(/\./)<0) {
              throw new Error("Must add namespace prefix (e.g. addon.SomeClass) to STRUCT scripts in addons");
          }
          nstructjs.register(cls);
        }, 
     inherit: function inherit(cls, parent, structName) {
          if (structName===undefined) {
              throw new Error("structName cannot be undefined, and don't forget to add a module prefix, e.g. addon.SomeClass");
          }
          else 
            if (structName.search(/\./)<0) {
              throw new Error("You must add a module prefix to addon STRUCT scripts, e.g. addon.SomeClass");
          }
          return nstructjs.inherit(cls, parent, structName);
        }, 
     STRUCT: nstructjs.STRUCT}, 
    Spline: Spline, 
    SplineFrameSet: SplineFrameSet}
  }
  bindAddonAPI = _es6_module.add_export('bindAddonAPI', bindAddonAPI);
}, '/dev/fairmotion/src/addon_api/addon_api_intern.js');
es6_module_define('addon_api', ["./addon_api_intern.js", "../path.ux/scripts/util/math.js", "../path.ux/scripts/pathux.js", "../path.ux/scripts/util/util.js", "../util/vectormath.js", "../../platforms/platform.js", "../path.ux/scripts/util/parseutil.js"], function _addon_api_module(_es6_module) {
  "use strict";
  var tokdef=es6_import_item(_es6_module, '../path.ux/scripts/util/parseutil.js', 'tokdef');
  var token=es6_import_item(_es6_module, '../path.ux/scripts/util/parseutil.js', 'token');
  var lexer=es6_import_item(_es6_module, '../path.ux/scripts/util/parseutil.js', 'lexer');
  var parser=es6_import_item(_es6_module, '../path.ux/scripts/util/parseutil.js', 'parser');
  var app=es6_import_item(_es6_module, '../../platforms/platform.js', 'app');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var math=es6_import(_es6_module, '../path.ux/scripts/util/math.js');
  var util=es6_import(_es6_module, '../path.ux/scripts/util/util.js');
  var parseutil=es6_import(_es6_module, '../path.ux/scripts/util/parseutil.js');
  var pathux=es6_import(_es6_module, '../path.ux/scripts/pathux.js');
  var bindAddonAPI=es6_import_item(_es6_module, './addon_api_intern.js', 'bindAddonAPI');
  let builtins={vectormath: vectormath, 
   parseutil: parseutil, 
   util: util, 
   math: math, 
   pathux: pathux}
  let tk=(name, re, func) =>    {
    return new tokdef(name, re, func);
  }
  let keywords=new Set(["export", "import", "from", "as", "in", "default", "let", "const", "var", "class", "function"]);
  let tokens=[tk("ID", /[a-zA-Z_$]+[a-zA-Z0-9_$]*/, (t) =>    {
    if (keywords.has(t.value)) {
        t.type = t.value.toUpperCase();
    }
    return t;
  }), tk("LBRACE", /\{/), tk("RBRACE", /\}/), tk("COMMA", /\,/), tk("LPAREN", /\(/), tk("RPAREN", /\)/), tk("STRLIT", /["'`]/, (t) =>    {
    t.type = "STRLIT";
    let chr=t.value;
    let start=t.lexer.lexpos-1;
    let li=t.lexer.lexpos+1;
    let buf=t.lexer.lexdata;
    while (li<buf.length&&buf[li]!==chr) {
      let c=buf[li];
      if (c==="\\"&&buf[li+1]===chr) {
          li++;
      }
      else 
        if (c==="\n"&&chr!=="`") {
          break;
      }
      li++;
    }
    t.value = buf.slice(start, li+1);
    t.lexer.lexpos = li+1;
    return t;
  }), tk("STAR", /\*/), tk("WS", /[ \t\n\r]/, (t) =>    {
    t.lexer.lineno+=t.value==="\n" ? 1 : 0;
  }), tk("SEMI", /;/), tk("BINOP", /[+\-\*\/%$~\.\<\>&%^|]/), tk("BINOP", /(\*\*)|(\<\<)/), tk("BINOP", /\=\=/), tk("UNOP", /[!~]/), tk("COLON", /\:/), tk("ASSIGN", /\=/)];
  function parseFile(buf, modname, path, modid) {
    let lex=new lexer(tokens);
    let p=new parser(lex);
    let linemap=new Array(buf.length);
    let li=0;
    for (let i=0; i<buf.length; i++) {
        linemap[i] = li;
        if (buf[i]==="\n") {
            li++;
        }
    }
    let newbuf=buf;
    let spans=[];
    function p_Id() {
      let t=p.next();
      if (t.type==="ID"||t.value==="default") {
          return t.value;
      }
      console.log(t);
      p.error(t, "Expected an identifier");
    }
    let deps=[];
    let name_idgen=1;
    function p_Import(t) {
      let start=t.lexpos;
      let t2=p.next();
      let repl="";
      if (t2.type==="LBRACE") {
          let t3=t2;
          let members=[];
          while (!p.at_end()&&t3&&t3.type!=="RBRACE") {
            members.push(p_Id());
            p.optional("COMMA");
            t3 = p.peeknext();
            if (t3.type==="COMMA") {
                p.next();
                t3 = p.peeknext();
            }
          }
          p.expect("RBRACE");
          p.expect("FROM");
          console.log(members);
          let path=p.expect("STRLIT");
          let modname="__mod_tmp_"+name_idgen;
          deps.push(path);
          repl = `var ${modname} = _addon_require(${modid}, ${path});\n`;
          name_idgen++;
          let first=true;
          repl+="var ";
          for (let m of members) {
              if (first) {
                  first = false;
              }
              else {
                repl+=", ";
              }
              repl+=`${m} = ${modname}.${m}`;
          }
          repl+=";\n";
      }
      else 
        if (t2.type==="ID") {
          let mod=t2.value;
          t2 = p.next();
          if (t2.type==="FROM") {
              let path=p.expect("STRLIT");
              repl = `var ${mod} = _addon_require(${modid}, ${path}).default;`;
              deps.push(path);
          }
          else {
            p.error(t2, "Invalid import statement");
          }
      }
      else 
        if (t2.type==="STRLIT") {
          repl = `_addon_require(${t2.value});`;
          deps.push(t2.value);
      }
      else 
        if (t2.type==="STAR") {
          p.expect("AS");
          let mod=p_Id();
          p.expect("FROM");
          let path=p.expect("STRLIT");
          repl = `var ${mod} = _addon_require(${modid}, ${path});`;
          deps.push(path);
      }
      else {
        p.error(t, "Invalid import statement");
      }
      let end=p.lexer.lexpos;
      console.log(start, end, repl);
      spans.push([start, end, repl]);
    }
    function p_VarExpr() {
      let li=p.lexer.lexpos, start=li;
      let bracketmap={"{": "{", 
     "}": "{", 
     "[": "[", 
     "]": "[", 
     "(": "(", 
     ")": "("}
      let bracketsigns={"{": 1, 
     "}": -1, 
     "[": 1, 
     "]": -1, 
     "(": 1, 
     ")": -1}
      let states={base: function base(li) {
          if (buf[li]==="/"&&buf[li+1]==="*") {
              this.push("comment");
              return li+2;
          }
          else 
            if (buf[li]==="`") {
              this.push("tmpl");
              return li+2;
          }
          else 
            if (buf[li]==="'"||buf[li]==='"') {
              let chr=buf[li];
              li++;
              while (li<buf.length&&buf[li]!==chr) {
                if (buf[li]==="\\"&&buf[li+1]===chr) {
                    li++;
                }
                li++;
              }
          }
          else 
            if (buf[li] in bracketmap) {
              this.brackets[bracketmap[buf[li]]]+=bracketsigns[buf[li]];
          }
          else 
            if ((buf[li]===","||buf[li]===";")&&this.bracketsZero()) {
              this.end();
              return li;
          }
          return li+1;
        }, 
     tmpl: function tmpl(li) {
          if (buf[li-1]!=="\\"&&buf[li]==="`") {
              this.pop();
          }
          return li+1;
        }, 
     str: function str(li) {
        }, 
     comment: function comment(li) {
          if (buf[li]==="*"&&buf[li+1]==="/") {
              this.pop();
              return li+2;
          }
          return li+1;
        }, 
     push: function push(state, statedata) {
          if (statedata===undefined) {
              statedata = undefined;
          }
          this.statestack.push([this.statedata, this.state]);
          this.state = state;
          this.statedata = statedata;
        }, 
     pop: function pop() {
          [this.statedata, this.state] = this.statestack.pop();
        }, 
     bracketsZero: function bracketsZero() {
          for (let k in this.brackets) {
              if (this.brackets[k]) {
                  return false;
              }
          }
          return true;
        }, 
     end: function end() {
          this.done = true;
        }, 
     done: false, 
     brackets: {"{": 0, 
      "[": 0, 
      "(": 0}, 
     statedata: undefined, 
     state: "base", 
     statestack: []}
      while (li<buf.length) {
        let start=li;
        li = states[states.state](li);
        if (states.done) {
            break;
        }
        if (li<=start) {
            li = start+1;
        }
      }
      p.lexer.lexpos = li;
      p.lexer.lineno = li<linemap.length ? linemap[li] : p.lexer.lineno;
      return buf.slice(start, li).trim();
    }
    let varkeywords=new Set(["let", "const", "var"]);
    function p_Export(t) {
      let start=t.lexpos;
      let t2=p.next();
      let repl="";
      if (t2.type==="LBRACE") {
          let t3=t2;
          let members=[];
          while (!p.at_end()&&t3&&t3.type!=="RBRACE") {
            members.push(p_Id());
            p.optional("COMMA");
            t3 = p.peeknext();
            if (t3.type==="COMMA") {
                p.next();
                t3 = p.peeknext();
            }
          }
          p.expect("RBRACE");
          p.expect("FROM");
          console.log(members);
          let path=p.expect("STRLIT");
          let modname="__mod_tmp_"+name_idgen;
          repl = `var ${modname} = _addon_require(${modid}, ${path});\n`;
          deps.push(path);
          name_idgen++;
          let first=true;
          repl+="";
          for (let m of members) {
              if (first) {
                  first = false;
              }
              else {
                repl+=";\n ";
              }
              repl+=`exports.${m} = ${modname}.${m}`;
          }
          repl+=";\n";
      }
      else 
        if (t2.type==="ID") {
          let mod=t2.value;
          t2 = p.next();
          if (t2.type==="FROM") {
              let path=p.expect("STRLIT");
              repl = `exports.${mod} = _addon_require(${modid}, ${path}).default;\n`;
              deps.push(path);
          }
          else {
            p.error(t2, "Invalid import statement");
          }
      }
      else 
        if (t2.type==="STRLIT") {
          repl = `_addon_require(${t2.value});\n`;
          deps.push(t2.value);
      }
      else 
        if (t2.type==="STAR") {
          p.expect("FROM");
          let path=p.expect("STRLIT");
          repl = `_exportall(${modid}, exports, _addon_require(${modid}, ${path}));\n`;
          deps.push(path);
      }
      else 
        if (varkeywords.has(t2.value)) {
          let vars={};
          let keyword=t2.value;
          repl = '';
          for (let _i=0; _i<500000; _i++) {
              let lineno=p.lexer.lineno;
              let id=p.expect("ID");
              let expr=undefined;
              console.log("VAR", id);
              if (p.optional("ASSIGN")) {
                  expr = p_VarExpr();
              }
              if (expr) {
                  repl+=`${keyword} ${id} = exports.${id} = ${expr};\n`;
              }
              else {
                repl+=`${keyword} ${id} = exports.${id} = undefined;\n`;
              }
              vars[id] = expr;
              console.log(vars);
              p.optional("COMMA");
              let t=p.peeknext();
              if (!t||t.type==="SEMI"||(t.type!=="ID"&&t.lexer.lineno>lineno)) {
                  break;
              }
          }
      }
      else 
        if (t2.value==="function"||t2.value==="class") {
          let id=p_Id();
          repl = `var ${id} = exports.${id} = ${t2.value} ${id}`;
      }
      else {
        console.log(t);
        p.error(t, "Invalid export statement");
      }
      let end=p.lexer.lexpos;
      console.log(start, end, repl);
      spans.push([start, end, repl]);
    }
    p.lexer.input(buf);
    li = 0;
    while (li<buf.length) {
      let startli=li;
      let buf2=buf.slice(li, buf.length);
      let i1=buf2.search(/\bexport\b/);
      let i2=buf2.search(/\bimport\b/);
      if (i1<0&&i2<0) {
          break;
      }
      i1 = i1<0 ? buf2.length : i1;
      i2 = i2<0 ? buf2.length : i2;
      i1+=li;
      i2+=li;
      let i=Math.min(i1, i2);
      if (i1<i2) {
          p.lexer.peeked_tokens.length = 0;
          p.lexer.lexpos = i1;
          p.lexer.lineno = linemap[i1];
          p_Export(p.next());
      }
      else {
        p.lexer.peeked_tokens.length = 0;
        p.lexer.lexpos = i2;
        p.lexer.lineno = linemap[i2];
        p_Import(p.next());
      }
      li = p.lexer.lexpos+1;
      if (li===i) {
          break;
      }
    }
    let off=0;
    for (let span of spans) {
        let start=span[0], end=span[1], line=span[2];
        start+=off;
        end+=off;
        buf = buf.slice(0, start)+line+buf.slice(end, buf.length);
        off+=line.length-(end-start);
    }
    buf = `"use strict";
_addon_define(${modid}, "${path}", [${""+deps}], function($__module, exports, _addon_require) {
${buf}
});
  `;
    console.log("FINAL:", buf);
    console.log(spans);
    return buf;
  }
  parseFile = _es6_module.add_export('parseFile', parseFile);
  let test=`

import {a, b, c} from '../d';
import a from 'b';
import * as a from 'b';
import 'bleh';

export * from 'b';
export {a, d, e, Tst} from 'b.js';

export class b {
}
export function c {
}

export let a = 0, c=2, d=4, e=5, u={a : b, c : d, f : [1, 2, 3]}, c = 3, e="2";

export const d;
`;
  window._testParseFile = function () {
    console.log(parseFile(test));
  }
  const modules={}
  _es6_module.add_export('modules', modules);
  const pathstack=["."];
  _es6_module.add_export('pathstack', pathstack);
  for (let k in builtins) {
      let mod=new ES6Module(k, k);
      mod.loaded = true;
      mod.exports = builtins[k];
      modules[k] = mod;
  }
  function resolvePath(path) {
    path = path.replace(/\\/g, "/");
    path = path.replace(/\/\//g, "/");
    if (path.startsWith("/")) {
        path = path.slice(1, path.length);
    }
    if (path.endsWith("/")) {
        path = path.slice(0, path.length-1);
    }
    let root=pathstack[pathstack.length-1];
    if (path.startsWith("./")) {
        path = root+"/"+path.slice(2, path.length);
    }
    else {
      path = _normpath(path, root);
    }
    return path.trim();
  }
  resolvePath = _es6_module.add_export('resolvePath', resolvePath);
  let addonmap=new Map();
  let addon_idgen=0;
  let file_idgen=0;
  let filestates={}
  function loadModule(path, addon) {
    if (path in builtins||path==="api") {
        return true;
    }
    path = resolvePath(path);
    if (path in modules) {
        return true;
    }
    window._addon_define = function _addon_define(fileid, path, deps, func) {
      console.log("ADDON DEFINE CALLED!");
      let module=new ES6Module(_splitpath(path)[1], path);
      module.callback = func;
      let file=filestates[fileid];
      let addon=file.addon;
      module.exports = {}
      module.deps = deps;
      module.loaded = false;
      module.addon = addon;
      modules[path] = module;
      addon.modules[path] = module;
      let ok=true;
      for (let dep of deps) {
          ok = ok&&loadModule(dep, addon);
      }
      let _addon_require;
      function load(mod) {
        pathstack.push(_splitpath(mod.path)[0]);
        mod.loaded = true;
        mod.callback(addon, mod.exports, _addon_require);
        pathstack.pop();
      }
      let api=bindAddonAPI(addon);
      _addon_require = function (__module, mod2) {
        if (mod2==="api") {
            return api;
        }
        else 
          if (!(mod2 in builtins)) {
            mod2 = resolvePath(mod2);
        }
        let mod3=modules[mod2];
        if (!mod3.loaded) {
            load(mod3);
        }
        return mod3.exports;
      }
      if (ok) {
          console.log("loading modules for addon. . .");
          for (let k in addon.modules) {
              let mod=addon.modules[k];
              if (!mod.loaded) {
                  load(mod);
              }
          }
          addon.onLoad();
      }
    }
    let file={id: file_idgen++, 
    path: path, 
    addon: addon}
    filestates[file.id] = file;
    app.openFile(path).then((data) =>      {
      let buf=data;
      if (__instance_of(data, Uint8Array)||Array.isArray(data)) {
          buf = "";
          for (let i=0; i<data.length; i++) {
              buf+=String.fromCharCode(data[i]);
          }
      }
      pathstack.push(_splitpath(path)[0]);
      buf = parseFile(buf, _splitpath(path)[1], path, file.id);
      eval(buf);
      pathstack.pop();
    });
    return false;
  }
  loadModule = _es6_module.add_export('loadModule', loadModule);
  class Addon  {
    static  define() {
      return {author: "", 
     email: "", 
     version: "", 
     tooltip: "", 
     description: "", 
     apiVersion: 0}
    }
     constructor(manager, mainModulePath) {
      this.manager = manager;
      this.modules = {};
      this.id = addon_idgen++;
      this.mainModule = _normpath1(mainModulePath);
      addonmap.set(this.id, this);
      addonmap.set(this, this.id);
    }
     define_data_api(api) {

    }
     onLoad() {
      let main=this.modules[this.mainModule];
      if (main&&main.exports.register) {
          main.exports.register();
      }
    }
     init_addon() {

    }
     destroyAddon() {
      try {
        this.modules[this.mainModule].exports.unregister();
      }
      catch (error) {
          util.print_stack(error);
          console.log("error while unloading addon");
      }
      for (let k in this.modules) {
          delete modules[k];
      }
      this.modules = {};
    }
     handle_versioning(file, oldversion) {

    }
  }
  _ESClass.register(Addon);
  _es6_module.add_class(Addon);
  Addon = _es6_module.add_export('Addon', Addon);
  class AddonManager  {
     constructor() {
      this.addons = [];
      this.addon_pathmap = {};
      this.datablock_types = [];
    }
     loadAddon(path) {
      path = _normpath1(path);
      if (path in this.addon_pathmap) {
          console.log("reloading module");
          this.destroyAddon(this.addon_pathmap[path]);
      }
      let addon=new Addon(this, path);
      pathstack.length = 0;
      pathstack.push(".");
      this.addon_pathmap[addon.mainModule] = addon;
      this.addons.push(addon);
      loadModule(addon.mainModule, addon);
    }
     destroyAddon(addon) {
      addon.destroyAddon();
      delete this.addon_pathmap[addon.mainModule];
    }
     registerDataBlockType(cls) {
      this.datablock_types.push(cls);
    }
     unregisterDataBlockType(cls) {
      this.datablock_types.remove(cls, false);
    }
     getModule(name) {
      return modules[name];
    }
     getModules() {
      return Object.getOwnPropertyNames(modules);
    }
  }
  _ESClass.register(AddonManager);
  _es6_module.add_class(AddonManager);
  AddonManager = _es6_module.add_export('AddonManager', AddonManager);
  const manager=new AddonManager();
  _es6_module.add_export('manager', manager);
  window._testAddons = function () {
    manager.loadAddon("./addons/test.js");
  }
}, '/dev/fairmotion/src/addon_api/addon_api.js');
es6_module_define('scene', ["./sceneobject.js", "../core/eventdag.js", "../curve/spline_base.js", "../core/struct.js", "../core/frameset.js", "../editors/viewport/selectmode.js", "../core/lib_api.js", "../editors/viewport/toolmodes/toolmode.js"], function _scene_module(_es6_module) {
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  var DataBlock=es6_import_item(_es6_module, '../core/lib_api.js', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, '../core/lib_api.js', 'DataTypes');
  var SplineFrameSet=es6_import_item(_es6_module, '../core/frameset.js', 'SplineFrameSet');
  var SceneObject=es6_import_item(_es6_module, './sceneobject.js', 'SceneObject');
  var ObjectFlags=es6_import_item(_es6_module, './sceneobject.js', 'ObjectFlags');
  var DataPathNode=es6_import_item(_es6_module, '../core/eventdag.js', 'DataPathNode');
  var SplineElement=es6_import_item(_es6_module, '../curve/spline_base.js', 'SplineElement');
  var ToolModes=es6_import_item(_es6_module, '../editors/viewport/toolmodes/toolmode.js', 'ToolModes');
  var SelMask=es6_import_item(_es6_module, '../editors/viewport/selectmode.js', 'SelMask');
  class ObjectList extends Array {
    
    
     constructor(scene) {
      super();
      this.idmap = {};
      this.namemap = {};
      this.scene = scene;
      this.active = undefined;
    }
     get(id_or_string) {
      if (typeof id_or_string=="string") {
          return this.namemap[id_or_string];
      }
      else {
        return this.idmap[id_or_string];
      }
    }
     has(ob) {
      return ob.id in this.idmap;
    }
     push(ob) {
      this.add(ob);
    }
     add(ob) {
      this.idmap[ob.id] = ob;
      this.namemap[ob.name] = ob;
      super.push(ob);
    }
     remove(ob) {
      delete this.idmap[ob.id];
      delete this.namemap[ob.name];
      super.remove(ob);
    }
     validateName(name) {
      let i=2;
      let name2=name;
      while (name2 in this.namemap) {
        name2 = name+i;
        i++;
      }
      return name2;
    }
    get  editable() {
      let this2=this;
      return (function* () {
        for (let ob of this.objects) {
            if (ob.flag&ObjectFlags.HIDE)
              continue;
            yield ob;
        }
      });
    }
    get  visible() {
      return this.editable;
    }
    get  selected_editable() {
      return (function* () {
        for (let ob of this.objects) {
            let bad=(ob.flag&ObjectFlags.HIDE);
            bad = bad|!(ob.flag&ObjectFlags.SELECT);
            yield ob;
        }
      });
    }
  }
  _ESClass.register(ObjectList);
  _es6_module.add_class(ObjectList);
  ObjectList = _es6_module.add_export('ObjectList', ObjectList);
  class ToolModeSwitchError extends Error {
  }
  _ESClass.register(ToolModeSwitchError);
  _es6_module.add_class(ToolModeSwitchError);
  ToolModeSwitchError = _es6_module.add_export('ToolModeSwitchError', ToolModeSwitchError);
  class Scene extends DataBlock {
    
    
    
    
    
    
    
     constructor() {
      super(DataTypes.SCENE);
      this.fps = 24.0;
      this.edit_all_layers = false;
      this.objects = new ObjectList(this);
      this.objects.active = undefined;
      this.object_idgen = new EIDGen();
      this.dagnodes = [];
      this.toolmodes = [];
      this.toolmodes.map = {};
      this.toolmode_i = 0;
      this.selectmode = SelMask.VERTEX;
      for (let cls of ToolModes) {
          let mode=new cls();
          this.toolmodes.push(mode);
          this.toolmodes.map[cls.toolDefine().name] = mode;
      }
      this.active_splinepath = "frameset.drawspline";
      this.time = 1;
    }
     switchToolMode(tname) {
      let tool=this.toolmodes.map[tname];
      if (!tool) {
          throw new ToolModeSwitchError("unknown tool mode "+tname);
      }
      try {
        if (this.toolmode) {
            this.toolmode.onInactive();
        }
      }
      catch (error) {
          print_stack(error);
          throw new ToolModeSwitchError("error switchign tool mode");
      }
      this.toolmode_i = this.toolmodes.indexOf(tool);
      try {
        if (this.toolmode) {
            this.toolmode.onActive();
        }
      }
      catch (error) {
          print_stack(error);
          throw new ToolModeSwitchError("error switchign tool mode");
      }
      this.toolmode.ctx = g_app_state.ctx;
    }
    get  toolmode() {
      return this.toolmodes[this.toolmode_i];
    }
     setActiveObject(ob) {
      this.objects.active = ob;
      this.dag_update("on_active_set", true);
    }
     addFrameset(fs) {
      let ob=new SceneObject(fs);
      ob.name = this.objects.validateName(fs.name);
      ob.id = this.object_idgen.gen_id();
      fs.lib_adduser(this, this.name);
      this.objects.push(ob);
      return ob;
    }
     change_time(ctx, time, _update_animation=true) {
      if (_DEBUG.timeChange)
        console.warn("Time change!", time, this.time);
      if (isNaN(this.time)) {
          console.warn("EEK corruption!");
          this.time = ctx.frameset.time;
          if (isNaN(this.time))
            this.time = 1;
          if (isNaN(time))
            time = 1;
      }
      if (time===this.time)
        return ;
      if (isNaN(time))
        return ;
      if (time<1) {
          time = 1;
      }
      window._wait_for_draw = true;
      window.redraw_viewport();
      this.time = time;
      ctx.frameset.change_time(time, _update_animation);
      ctx.api.onFrameChange(ctx, time);
      this.dag_update("on_time_change", true);
    }
     copy() {
      var ret=new Scene();
      ret.time = this.time;
      return ret;
    }
     dag_exec() {

    }
     dag_get_datapath() {
      return "datalib.scene.items["+this.lib_id+"]";
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      let objs=new ObjectList(this);
      for (let i=0; i<this.objects.length; i++) {
          objs.add(this.objects[i]);
      }
      this.objects = objs;
      if (this.active_object>=0) {
          this.objects.active = this.objects.idmap[this.active_object];
      }
      delete this.active_object;
      this.afterSTRUCT();
      if (this.active_splinepath==="frameset.active_spline")
        this.active_splinepath = "frameset.drawspline";
      return this;
    }
     data_link(block, getblock, getblock_us) {
      super.data_link(block, getblock, getblock_us);
      for (let i=0; i<this.objects.length; i++) {
          this.objects[i].data_link(block, getblock, getblock_us);
      }
      this.toolmodes.map = {};
      for (let tool of this.toolmodes) {
          tool.dataLink(this, getblock, getblock_us);
          let def=tool.constructor.toolDefine();
          this.toolmodes.map[def.name] = tool;
      }
      for (let cls of ToolModes) {
          let def=cls.toolDefine();
          if (!(def.name in this.toolmodes)) {
              let tool=new cls();
              this.toolmodes.push(tool);
              this.toolmodes.map[def.name] = tool;
          }
      }
    }
     linkDag(ctx) {
      let on_sel=function (ctx, inputs, outputs, graph) {
        console.warn("on select called through eventdag!");
        ctx.frameset.sync_vdata_selstate(ctx);
      };
      the_global_dag.link(ctx.frameset.spline.verts, ["on_select_add"], on_sel, ["eid"]);
      the_global_dag.link(ctx.frameset.spline.verts, ["on_select_sub"], on_sel, ["eid"]);
      the_global_dag.link(ctx.frameset.spline.handles, ["on_select_add"], on_sel, ["eid"]);
      the_global_dag.link(ctx.frameset.spline.handles, ["on_select_sub"], on_sel, ["eid"]);
      this.dagnodes.push(on_sel);
    }
     on_tick(ctx) {
      if (this.dagnodes.length===0) {
          this.linkDag(ctx);
      }
    }
    static  nodedef() {
      return {name: "scene", 
     uiname: "scene", 
     outputs: {on_active_set: null, 
      on_time_change: null}, 
     inputs: {}}
    }
  }
  _ESClass.register(Scene);
  _es6_module.add_class(Scene);
  Scene = _es6_module.add_export('Scene', Scene);
  Scene.STRUCT = STRUCT.inherit(Scene, DataBlock)+`
    time              : float;
    active_splinepath : string;
    objects           : array(SceneObject);
    active_object     : int | obj.objects.active !== undefined ? obj.objects.active.id : -1;
    object_idgen      : EIDGen;
    toolmodes         : array(abstract(ToolMode));
    active_toolmode   : string | this.toolmode !== undefined ? this.toolmode.constructor.toolDefine().name : "";
    edit_all_layers   : int;
    selectmode        : int;
    fps               : float;
  }
`;
  mixin(Scene, DataPathNode);
}, '/dev/fairmotion/src/scene/scene.js');
es6_module_define('sceneobject', ["../core/lib_api.js", "../core/struct.js"], function _sceneobject_module(_es6_module) {
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  var DataTypes=es6_import_item(_es6_module, '../core/lib_api.js', 'DataTypes');
  var DataBlock=es6_import_item(_es6_module, '../core/lib_api.js', 'DataBlock');
  let UpdateFlags={REDRAW: 1, 
   TRANSFORM: 1}
  UpdateFlags = _es6_module.add_export('UpdateFlags', UpdateFlags);
  let ObjectFlags={SELECT: 1, 
   HIDE: 2}
  ObjectFlags = _es6_module.add_export('ObjectFlags', ObjectFlags);
  class SceneObject extends DataBlock {
    
    
    
    
    
     constructor(data) {
      super(DataTypes.OBJECT);
      this.id = -1;
      this.data = data;
      this.matrix = new Matrix4();
      this.loc = new Vector2();
      this.scale = new Vector2();
      this.rot = 0.0;
      this.flag = 0;
      this.aabb = [new Vector2(), new Vector2()];
    }
     recalcAABB() {
      throw new Error("implement me!");
    }
     recalcMatrix() {
      this.matrix.makeIdentity();
      this.matrix.scale(this.scale[0], this.scale[1], 1.0);
      this.matrix.translate(this.loc[0], this.loc[1], 1.0);
      this.matrix.rotate(0.0, 0.0, this.rot);
      return this.matrix;
    }
     data_link(block, getblock, getblock_us) {
      this.data = getblock_us(this.data);
    }
     update(flag=UpdateFlags.REDRAW) {

    }
  }
  _ESClass.register(SceneObject);
  _es6_module.add_class(SceneObject);
  SceneObject = _es6_module.add_export('SceneObject', SceneObject);
  SceneObject.STRUCT = STRUCT.inherit(SceneObject, DataBlock)+`
  data     : dataref(DataBlock);
  matrix   : mat4;
  loc      : vec2;
  scale    : vec2;
  rot      : float;
  flag     : int;
  id       : int;
}
`;
}, '/dev/fairmotion/src/scene/sceneobject.js');
es6_module_define('velpan', ["../datafiles/icon_enum.js", "../path.ux/scripts/toolsys/simple_toolsys.js", "../util/vectormath.js", "../path.ux/scripts/toolsys/toolprop.js", "../path.ux/scripts/util/simple_events.js", "../path.ux/scripts/util/util.js"], function _velpan_module(_es6_module) {
  var Matrix4=es6_import_item(_es6_module, '../util/vectormath.js', 'Matrix4');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var ToolOp=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/simple_toolsys.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/simple_toolsys.js', 'UndoFlags');
  var keymap=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'keymap');
  var StringProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'StringProperty');
  var Vec2Property=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'Vec2Property');
  es6_import(_es6_module, '../datafiles/icon_enum.js');
  var util=es6_import(_es6_module, '../path.ux/scripts/util/util.js');
  let VelPanFlags={UNIFORM_SCALE: 1}
  VelPanFlags = _es6_module.add_export('VelPanFlags', VelPanFlags);
  class VelPan  {
    
    
    
    
    
    
    
    
    
    
    
    
    
     constructor() {
      this.bounds = [new Vector2([-2000, -2000]), new Vector2([2000, 2000])];
      this.decay = 0.995;
      this.pos = new Vector2();
      this.scale = new Vector2([1, 1]);
      this.vel = new Vector2();
      this.oldpos = new Vector2();
      this.axes = 3;
      this.flag = VelPanFlags.UNIFORM_SCALE;
      this.mat = new Matrix4();
      this.imat = new Matrix4();
      this._last_mat = new Matrix4(this.mat);
      this.onchange = null;
      this.last_update_time = util.time_ms();
      this.timer = undefined;
    }
     copy() {
      return new VelPan().load(this);
    }
    get  min() {
      return this.bounds[0];
    }
    get  max() {
      return this.bounds[1];
    }
     load(velpan) {
      this.pos.load(velpan.pos);
      this.scale.load(velpan.scale);
      this.axes = velpan.axes;
      this.bounds[0].load(velpan.bounds[0]);
      this.bounds[1].load(velpan.bounds[1]);
      this.update(false);
      return this;
    }
     startVelocity() {
      if (this.timer===undefined) {
          this.last_update_time = util.time_ms();
          this.timer = window.setInterval(this.doVelocity.bind(this), 30);
      }
    }
     doVelocity() {
      if (this.vel.dot(this.vel)<0.001) {
          console.log("removing velpan timer");
          window.clearInterval(this.timer);
          this.timer = undefined;
          return ;
      }
      let dt=util.time_ms()-this.last_update_time;
      this.pos.addFac(this.vel, dt);
      dt = Math.max(dt, 0.001);
      this.vel.mulScalar(Math.pow(this.decay, dt));
      this.last_update_time = util.time_ms();
    }
     update(fire_events=true, do_velocity=true) {
      if (do_velocity&&this.vel.dot(this.vel)>0.001) {
          this.startVelocity();
      }
      this.mat.makeIdentity();
      this.mat.scale(this.scale[0], this.scale[1], 1.0);
      this.mat.translate(this.pos[0], this.pos[1], 0.0);
      this.imat.load(this.mat).invert();
      if (fire_events&&JSON.stringify(this.mat)!=JSON.stringify(this._last_mat)) {
          this._last_mat.load(this.mat);
          if (this.onchange)
            this.onchange(this);
      }
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(VelPan);
  _es6_module.add_class(VelPan);
  VelPan = _es6_module.add_export('VelPan', VelPan);
  VelPan.STRUCT = `
VelPan {
  bounds : array(vec2); 
  pos    : vec2;
  scale  : vec2;
  axes   : int;
  mat    : mat4;
  imat   : mat4;
  flag   : int;
}
`;
  nstructjs.manager.add_class(VelPan);
  class VelPanPanOp extends ToolOp {
     constructor() {
      super();
      this.start_pan = new Vector2();
      this.first = true;
      this.last_mpos = new Vector2();
      this.start_mpos = new Vector2();
      this.start_time = this.last_time = 0;
      this._temps = util.cachering.fromConstructor(Vector2, 16);
    }
    static  tooldef() {
      return {uiname: "Pan (2d)", 
     description: "Pan 2d window", 
     toolpath: "velpan.pan", 
     undoflag: UndoFlags.NO_UNDO, 
     is_modal: true, 
     icon: -1, 
     inputs: {velpanPath: new StringProperty(), 
      pan: new Vec2Property()}}
    }
     on_mousemove(e) {
      let ctx=this.modal_ctx;
      let path=this.inputs.velpanPath.getValue();
      let velpan=ctx.api.getValue(ctx, path);
      if (velpan===undefined) {
          this.modalEnd();
          throw new Error("bad velpan path "+path+".");
      }
      let mpos=this._temps.next().zero();
      mpos[0] = e.x;
      mpos[1] = e.y;
      if (this.first) {
          this.start_mpos.load(mpos);
          this.last_mpos.load(mpos);
          this.start_pan.load(velpan.pos);
          this.start_time = util.time_ms();
          this.last_time = util.time_ms();
          this.first = false;
          return ;
      }
      let dx=mpos[0]-this.last_mpos[0];
      let dy=mpos[1]-this.last_mpos[1];
      dx/=velpan.scale[0];
      dy/=velpan.scale[1];
      let pan=this.inputs.pan.getValue();
      pan[0]+=dx;
      pan[1]+=dy;
      velpan.pos.load(this.start_pan);
      this.exec(this.modal_ctx);
      this.last_mpos.load(mpos);
    }
     exec(ctx) {
      let path=this.inputs.velpanPath.getValue();
      let velpan=ctx.api.getValue(ctx, path);
      if (velpan===undefined) {
          throw new Error("bad velpan path "+path+".");
      }
      velpan.pos.add(this.inputs.pan.getValue());
      velpan.update(undefined, false);
      let vel=new Vector2(velpan.pos).sub(velpan.oldpos);
      vel.mulScalar(1.0/(util.time_ms()-this.last_time));
      let l=vel.vectorLength();
      l = Math.min(l, 3.0);
      vel.normalize().mulScalar(l);
      velpan.vel.load(vel);
      velpan.oldpos.load(velpan.pos);
      this.last_time = util.time_ms();
      if (velpan.onchange) {
          velpan.onchange();
      }
    }
     on_mouseup(e) {
      this.modalEnd();
    }
  }
  _ESClass.register(VelPanPanOp);
  _es6_module.add_class(VelPanPanOp);
  VelPanPanOp = _es6_module.add_export('VelPanPanOp', VelPanPanOp);
  ToolOp.register(VelPanPanOp);
}, '/dev/fairmotion/src/editors/velpan.js');
es6_module_define('nodegraph', ["../editor_base.js", "../../path.ux/scripts/pathux.js", "../velpan.js", "../../core/lib_api.js"], function _nodegraph_module(_es6_module) {
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  var nstructjs=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'nstructjs');
  var util=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'util');
  var VelPan=es6_import_item(_es6_module, '../velpan.js', 'VelPan');
  var VelPanPanOp=es6_import_item(_es6_module, '../velpan.js', 'VelPanPanOp');
  var Vector2=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'Vector2');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'UIBase');
  var color2css=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'color2css');
  var css2color=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'css2color');
  var DataBlock=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataBlock');
  class NodeViewer extends Editor {
    
    
    
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.graphPath = "";
      this.graphClass = "";
      this._last_graph_path = undefined;
      this.velpan = new VelPan();
      this.velpan.pos[0] = 0;
      this.velpan.pos[1] = 0;
      this.velpan.onchange = this._on_velpan_change.bind(this);
      this._last_scale = new Vector2();
      this.canvases = {};
      this.nodes = {};
      this.node_idmap = {};
      this.sockSize = 20;
      this.extraNodeWidth = 155;
      this.canvas = document.createElement("canvas");
      this.g = this.canvas.getContext("2d");
      this.shadow.appendChild(this.canvas);
    }
     init() {
      super.init();
      this.velpan.onchange = this._on_velpan_change.bind(this);
      this.addEventListener("mousedown", (e) =>        {
        this.push_ctx_active();
        console.log("node viewer mousedown");
        let toolop=new VelPanPanOp();
        toolop.inputs.velpanPath.setValue("nodeViewer.velpan");
        this.ctx.toolstack.execTool(this.ctx, toolop);
        this.pop_ctx_active();
      });
      this.header.button("Arrange", () =>        {
        let graph=this.getGraph();
        console.log("Arranging graph", graph);
        if (graph) {
            sortGraphSpatially(graph, {socksize: this.sockSize, 
        steps: 45, 
        headerHeight: 75, 
        extraWidth: this.extraNodeWidth});
            this.clear();
            this.rebuild();
            this.draw();
        }
      });
      this.addEventListener("wheel", (e) =>        {
        let df=Math.sign(e.deltaY)*0.15;
        console.log("wheel in node viewer!");
        this.velpan.scale.mulScalar(1.0-df);
        this.velpan.update();
        this.rebuild();
      });
    }
     getGraph() {
      return this.ctx.api.getValue(this.ctx, this.graphPath);
    }
     getCanvas(id) {
      if (!(id in this.canvases)) {
          this.canvases[id] = document.createElement("canvas");
          this.canvases[id].g = this.canvases[id].getContext("2d");
      }
      return this.canvases[id];
    }
     hashNode(node) {
      let layout=layoutNode(node, {socksize: this.sockSize});
      let mask=(1<<19)-1;
      let mul=(1<<14)-1;
      let hash=node.graph_id;
      function dohash(n) {
        let f=((n+mask)*mul)&mask;
        hash = hash^f;
      }
      let scale=this.velpan.scale;
      dohash(layout.size[0]*scale[0]);
      dohash(layout.size[1]*scale[1]);
      for (let i=0; i<2; i++) {
          let socks=i ? layout.outputs : layout.inputs;
          let j=0;
          for (let k in socks) {
              let sock=socks[k];
              dohash(sock[0]*scale[0]);
              dohash(sock[1]*scale[1]);
              dohash(j++);
          }
      }
      return hash+":"+node.graph_id;
    }
     _on_velpan_change() {
      if (this._last_scale.vectorDistance(this.velpan.scale)>0.1) {
          this.rebuild();
      }
      else {
        this.draw();
      }
      this._last_scale.load(this.velpan.scale);
    }
     clear() {
      this.canvases = {};
      this.nodes = {};
      this.node_idmap = {};
    }
     buildNode(node) {
      let scale=this.velpan.scale;
      let layout=layoutNode(node, {socksize: this.sockSize, 
     extraWidth: this.extraNodeWidth});
      let hash=this.hashNode(node);
      layout.size = new Vector2(layout.size);
      layout.size.mulScalar(scale[0]);
      layout.size.floor();
      for (let i=0; i<2; i++) {
          let lsocks=i ? layout.outputs : layout.inputs;
          let socks=i ? node.outputs : node.inputs;
          for (let k in lsocks) {
              let sock=socks[k];
              let lsock=lsocks[k];
              lsock = new Vector2(lsock);
              let color=sock.constructor.nodedef().color;
              if (color) {
                  color = color2css(color);
              }
              else {
                color = "orange";
              }
              lsock.color = color;
              lsocks[k] = lsock;
          }
      }
      layout.canvas = this.getCanvas(hash);
      let canvas=layout.canvas;
      let g=canvas.g;
      let ts=this.getDefault("DefaultText").size*1.45;
      let header=layout.header = ts*this.velpan.scale[0]*1.3*2.5;
      layout.size[1]+=Math.ceil(header);
      canvas.width = layout.size[0];
      canvas.height = layout.size[1];
      g.font = this.getDefault("DefaultText").genCSS(ts*this.velpan.scale[0]);
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.beginPath();
      g.rect(0, 0, canvas.width, canvas.height);
      g.lineWidth = 2;
      g.fillStyle = "grey";
      g.strokeStyle = "black";
      g.fill();
      g.stroke();
      g.fillStyle = "white";
      let name=node.graphDisplayName();
      g.fillText(name, 1, ts*this.velpan.scale[0]*1.3);
      g.fillText("("+node.constructor.name+")", 45*this.velpan.scale[0], ts*this.velpan.scale[0]*1.3*1.7);
      layout.graph_id = node.graph_id;
      this.nodes[hash] = layout;
      this.node_idmap[node.graph_id] = layout;
      for (let i=0; i<2; i++) {
          let y=0.0;
          let socks=i ? layout.outputs : layout.inputs;
          for (let k in socks) {
              let sock=socks[k];
              sock[1]+=header/this.velpan.scale[0];
              let w=g.measureText(k).width;
              let x=i ? layout.size[0]-w : 0;
              let y=sock[1]*this.velpan.scale[0];
              g.fillText(k, x, y);
          }
      }
      return layout;
    }
     updateCanvaSize() {
      let canvas=this.canvas;
      let size=this.size;
      let dpi=UIBase.getDPI();
      let w=~~(size[0]*dpi);
      let h=~~(size[1]*dpi);
      canvas.width = w;
      canvas.height = h;
      canvas.style["width"] = size[0]+"px";
      canvas.style["height"] = size[1]+"px";
    }
     draw() {
      return ;
      let canvas=this.canvas;
      let g=this.g;
      this.updateCanvaSize();
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.font = this.getDefault("DefaultText").genCSS();
      g.strokeStyle = "black";
      let transform=(p) =>        {
        p[0]-=canvas.width*0.5;
        p[1]-=canvas.height*0.5;
        p.multVecMatrix(this.velpan.mat);
        p[0]+=canvas.width*0.5;
        p[1]+=canvas.height*0.5;
      };
      let p=new Vector2(), p2=new Vector2(), p3=new Vector2(), p4=new Vector2();
      let s=new Vector2();
      function find_sock_key(node, sock) {
        for (let k in node.inputs) {
            if (node.inputs[k]===sock) {
                return k;
            }
        }
      }
      g.beginPath();
      let sz=this.sockSize;
      let graph=this.getGraph();
      let rebuild=false;
      for (let k1 in this.nodes) {
          let node=this.nodes[k1];
          p.load(node.pos);
          let node2=graph.node_idmap[node.graph_id];
          if (node2===undefined) {
              rebuild = true;
              continue;
          }
          for (let k in node2.inputs) {
              let sock=node2.inputs[k];
              for (let sock2 of sock.edges) {
                  let node3=this.node_idmap[sock2.node.graph_id];
                  sock2 = find_sock_key(sock2);
                  node3 = this.node_idmap[node3.graph_id];
                  let lsock1=node.inputs[k];
                  let lsock2=node3.outputs[k];
                  p2.load(node.pos).add(lsock1);
                  p3.load(node3.pos).add(lsock2);
                  transform(p2);
                  transform(p3);
                  g.moveTo(p2[0], p2[1]);
                  g.lineTo(p3[0], p3[1]);
              }
          }
      }
      if (rebuild) {
          this.rebuild();
          this.doOnce(this.draw);
          return ;
      }
      g.strokeStyle = "white";
      g.stroke();
      for (let k2 in this.nodes) {
          let node=this.nodes[k2];
          p.load(node.pos);
          for (let i=0; i<2; i++) {
              let socks=i ? node.outputs : node.inputs;
              for (let k in socks) {
                  let sock=socks[k];
                  p2.load(sock);
                  p2.add(p);
                  transform(p2);
                  g.beginPath();
                  g.fillStyle = sock.color;
                  g.moveTo(p2[0], p2[1]);
                  g.arc(p2[0], p2[1], sz*0.35, -Math.PI, Math.PI);
                  g.fill();
              }
          }
      }
      g.fill();
      g.fillStyle = "grey";
      g.beginPath();
      for (let k in this.nodes) {
          let node=this.nodes[k];
          p.load(node.pos);
          s.load(node.size);
          transform(p);
          g.drawImage(node.canvas, p[0], p[1]);
      }
      g.fill();
      g.stroke();
    }
     rebuild() {
      return ;
      if (!this.ctx) {
          return ;
      }
      this._last_graph_path = this.graphPath;
      console.log("rebuilding node editor");
      this.updateCanvaSize();
      let canvas=this.canvas;
      let g=this.g;
      let size=this.size;
      let dpi=UIBase.getDPI();
      let graph=this.ctx.api.getValue(this.ctx, this.graphPath);
      if (this.graphPath===""||graph===undefined) {
          console.warn("Failed to load graph!");
          this._last_graph_path = undefined;
          return ;
      }
      let visit=new util.set();
      for (let node of graph.nodes) {
          let hash=this.hashNode(node);
          visit.add(hash);
          if (!(hash in this.nodes)) {
              this.buildNode(node);
          }
      }
      let del=[];
      for (let k in this.canvases) {
          if (!visit.has(k)) {
              del.push(k);
          }
      }
      for (let k of del) {
          delete this.canvases[k];
          delete this.nodes[k];
      }
      this.draw();
    }
     on_resize() {
      this.draw();
    }
     update() {
      if (this._last_graph_path!==this.graphPath) {
          this.clear();
          this.rebuild();
      }
      this.velpan.update();
    }
    static  define() {
      return {tagname: "nodegraph-viewer-x", 
     areaname: "nodegraph_viewer", 
     uiname: "Graph Viewer"}
    }
  }
  _ESClass.register(NodeViewer);
  _es6_module.add_class(NodeViewer);
  NodeViewer = _es6_module.add_export('NodeViewer', NodeViewer);
  NodeViewer.STRUCT = nstructjs.inherit(NodeViewer, Editor)+`
  graphPath  : string;
  graphClass : string;
  velpan     : VelPan;
}`;
  Editor.register(NodeViewer);
  nstructjs.register(NodeViewer);
}, '/dev/fairmotion/src/editors/nodegraph/nodegraph.js');
es6_module_define('nodegraph_base', [], function _nodegraph_base_module(_es6_module) {
}, '/dev/fairmotion/src/editors/nodegraph/nodegraph_base.js');
es6_module_define('nodegraph_ops', [], function _nodegraph_ops_module(_es6_module) {
}, '/dev/fairmotion/src/editors/nodegraph/nodegraph_ops.js');
es6_module_define('widgets', ["../path.ux/scripts/util/util.js", "../path.ux/scripts/util/struct.js", "../path.ux/scripts/core/ui.js", "../image/image_ops.js", "../path.ux/scripts/core/ui_base.js"], function _widgets_module(_es6_module) {
  var UIBase=es6_import_item(_es6_module, '../path.ux/scripts/core/ui_base.js', 'UIBase');
  var Icons=es6_import_item(_es6_module, '../path.ux/scripts/core/ui_base.js', 'Icons');
  var PackFlags=es6_import_item(_es6_module, '../path.ux/scripts/core/ui_base.js', 'PackFlags');
  var nstructjs=es6_import(_es6_module, '../path.ux/scripts/util/struct.js');
  var util=es6_import(_es6_module, '../path.ux/scripts/util/util.js');
  var Container=es6_import_item(_es6_module, '../path.ux/scripts/core/ui.js', 'Container');
  var LoadImageOp=es6_import_item(_es6_module, '../image/image_ops.js', 'LoadImageOp');
  class IDBrowser extends Container {
     constructor() {
      super();
      this.idlist = {};
    }
     init() {
      super.init();
      let name=undefined;
      try {
        let block=this.getPathValue(this.ctx, this.getAttribute("datapath"));
        if (block) {
            name = block.name;
        }
      }
      catch (error) {
          util.print_stack(error);
      }
      this.buildEnum();
      this.listbox = this.listenum(undefined, {enumDef: this.idlist, 
     callback: this._on_select.bind(this), 
     defaultval: name});
    }
     _on_select(lib_id) {
      let block=this.ctx.datalib.idmap[lib_id];
      if (block) {
          console.log("block:", block);
          let path=this.getAttribute("datapath");
          this.setPathValue(this.ctx, path, block);
      }
      else {
        console.warn("unknown block with id '"+lib_id+"'");
      }
    }
     buildEnum() {
      let path=this.getAttribute("datapath");
      let rdef=path ? this.ctx.api.resolvePath(this.ctx, path) : undefined;
      if (!path||!rdef||!rdef.prop) {
          console.error("Datapath error");
          return ;
      }
      let prop=rdef.prop;
      let datalib=this.ctx.datalib;
      let lst=[];
      for (let block of datalib.allBlocks) {
          if (prop.types.has(block.lib_type)) {
              lst.push(block);
          }
      }
      lst.sort((a, b) =>        {
        return (a.name.toLowerCase()<b.name.toLowerCase())*2-1;
      });
      let def={};
      this.idlist = def;
      for (let block of lst) {
          def[block.name] = block.lib_id;
      }
      return def;
    }
     updateDataPath() {
      let path=this.getAttribute("datapath");
      if (!path)
        return ;
      let value=this.getPathValue(this.ctx, path);
      let name="";
      if (value===undefined) {
          name = "";
      }
      else {
        name = value.name;
      }
      if (name!==this.listbox.value) {
          this.listbox.setAttribute("name", name);
      }
    }
     update() {
      super.update();
      this.updateDataPath();
    }
     setCSS() {
      super.setCSS();
    }
    static  define() {
      return {tagname: "id-browser-x"}
    }
  }
  _ESClass.register(IDBrowser);
  _es6_module.add_class(IDBrowser);
  IDBrowser = _es6_module.add_export('IDBrowser', IDBrowser);
  UIBase.register(IDBrowser);
  class ImageUserPanel extends Container {
     constructor() {
      super();
    }
     init() {
      super.init();
      let path=this.getAttribute("datapath");
      let row=this.row();
      let idbrowser=document.createElement("id-browser-x");
      idbrowser.setAttribute("datapath", path+".image");
      row.add(idbrowser);
      row.button("Open", () =>        {
        let toolop=new LoadImageOp(this.getAttribute("datapath")+".image");
        this.ctx.api.execTool(this.ctx, toolop);
      });
      this.prop(path+".off", PackFlags.NO_NUMSLIDER_TEXTBOX);
      this.prop(path+".scale", PackFlags.NO_NUMSLIDER_TEXTBOX);
      this.setCSS();
    }
     update() {
      super.update();
    }
     setCSS() {
      super.setCSS();
      let w=150;
      this.style["width"] = w+"px";
    }
    static  define() {
      return {tagname: "image-user-panel-x"}
    }
  }
  _ESClass.register(ImageUserPanel);
  _es6_module.add_class(ImageUserPanel);
  ImageUserPanel = _es6_module.add_export('ImageUserPanel', ImageUserPanel);
  UIBase.register(ImageUserPanel);
}, '/dev/fairmotion/src/editors/widgets.js');
es6_module_define('all', ["./viewport/view2d.js", "./settings/SettingsEditor.js", "./curve/CurveEditor.js", "./ops/ops_editor.js", "./dopesheet/DopeSheetEditor.js", "./material/MaterialEditor.js", "./console/console.js", "./menubar/MenuBar.js"], function _all_module(_es6_module) {
  es6_import(_es6_module, './viewport/view2d.js');
  es6_import(_es6_module, './dopesheet/DopeSheetEditor.js');
  es6_import(_es6_module, './ops/ops_editor.js');
  es6_import(_es6_module, './console/console.js');
  es6_import(_es6_module, './material/MaterialEditor.js');
  es6_import(_es6_module, './curve/CurveEditor.js');
  es6_import(_es6_module, './menubar/MenuBar.js');
  es6_import(_es6_module, './settings/SettingsEditor.js');
}, '/dev/fairmotion/src/editors/all.js');
es6_module_define('console', ["../../path.ux/scripts/util/html5_fileapi.js", "../editor_base.js", "../../path.ux/scripts/pathux.js", "../../path.ux/scripts/util/util.js"], function _console_module(_es6_module) {
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  var color2css=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'color2css');
  var css2color=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'css2color');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'UIBase');
  var keymap=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'keymap');
  var util=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'util');
  var cconst=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'cconst');
  var nstructjs=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'nstructjs');
  var Vector2=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'Vector3');
  var Matrix4=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'Matrix4');
  var termColorMap=es6_import_item(_es6_module, '../../path.ux/scripts/util/util.js', 'termColorMap');
  var loadFile=es6_import_item(_es6_module, '../../path.ux/scripts/util/html5_fileapi.js', 'loadFile');
  let g_screen=undefined;
  let _silence=() =>    {  }
  let _unsilence=() =>    {  }
  let _patched=false;
  function patch_console() {
    if (_patched) {
        return ;
    }
    _patched = true;
    let methods={}
    let ignore=0;
    _silence = () =>      {
      return ignore = 1;
    }
    _unsilence = () =>      {
      return ignore = 0;
    }
    let handlers={}
    function patch(key) {
      handlers[key] = function () {
        setTimeout(() =>          {
          if (ignore||!g_screen) {
              return ;
          }
          for (let sarea of g_screen.sareas) {
              if (__instance_of(sarea.area, ConsoleEditor)) {
                  sarea.area[key](...arguments);
              }
          }
        }, 0);
      }
      methods[key] = console[key].bind(console);
      console[key] = function () {
        methods[key](...arguments);
        handlers[key](...arguments);
      }
    }
    patch("log");
    patch("warn");
    patch("error");
    patch("trace");
  }
  const NO_CHILDREN=0x7ffff;
  const LineFlags={ACTIVE: 1, 
   TWO_LINE: 2}
  class ConsoleLineEntry  {
    
    
    
    
    
    
    
     constructor(line, loc="", fg="", bg="") {
      this.line = ""+line;
      this.loc = ""+loc;
      this.bg = ""+bg;
      this.fg = ""+fg;
      this.closed = false;
      this.parent = 0;
      this.children = NO_CHILDREN;
      this.flag = 0;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(ConsoleLineEntry);
  _es6_module.add_class(ConsoleLineEntry);
  ConsoleLineEntry = _es6_module.add_export('ConsoleLineEntry', ConsoleLineEntry);
  ConsoleLineEntry.STRUCT = `
ConsoleLineEntry {
    line     : string;
    loc      : string;
    bg       : string;
    fg       : string; 
    closed   : bool;
    parent   : int;
    children : int;
    flag     : int | this.flag & ~1;
}
`;
  nstructjs.register(ConsoleLineEntry);
  class ConsoleCommand  {
     constructor(cmd) {
      this.command = cmd;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(ConsoleCommand);
  _es6_module.add_class(ConsoleCommand);
  ConsoleCommand = _es6_module.add_export('ConsoleCommand', ConsoleCommand);
  ConsoleCommand.STRUCT = `
ConsoleCommand {
    command : string;
}
`;
  nstructjs.register(ConsoleCommand);
  const HitBoxTypes={TOGGLE_CHILDREN: 0, 
   CUSTOM: 1}
  _es6_module.add_export('HitBoxTypes', HitBoxTypes);
  class HitBox  {
    
    
     constructor(x, y, w, h) {
      this.pos = new Vector2([x, y]);
      this.size = new Vector2([w, h]);
      this.type = HitBoxTypes.TOGGLE_CHILDREN;
      this.onhit = null;
      this.lines = [];
    }
     toggle(e, editor) {
      _silence();
      for (let l of this.lines) {
          let i=editor.lines.indexOf(l);
          let starti=i;
          if (l.children===NO_CHILDREN) {
              continue;
          }
          i+=l.children;
          let j=0;
          while (j++<editor.lines.length) {
            let l2=editor.lines[i];
            if (editor.lines[i+l2.parent]!==l) {
                break;
            }
            l2.closed^=1;
            i++;
          }
      }
      editor.queueRedraw();
      _unsilence();
    }
     click(e, editor) {
      if (this.type===HitBoxTypes.TOGGLE_CHILDREN) {
          this.toggle(e, editor);
          console.log("click!");
      }
    }
  }
  _ESClass.register(HitBox);
  _es6_module.add_class(HitBox);
  HitBox = _es6_module.add_export('HitBox', HitBox);
  class ConsoleEditor extends Editor {
    
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this._animreq = 0;
      this.redraw = this.redraw.bind(this);
      this.hitboxes = [];
      this.fontsize = 12;
      this.lines = [];
      this.lines.active = undefined;
      this.history = [];
      this.history.cur = 0;
      this.head = 0;
      this.bufferSize = 512;
      this.scroll = new Vector2();
      this.colors = {error: "red", 
     error_bg: "rgb(55,55,55,1.0)", 
     warning: "yellow", 
     object: "blue", 
     loc: "blue", 
     source: "white", 
     warning_bg: "rgb(50, 50, 0)"};
      this.colormap = {"red": "rgb(255, 100, 100)", 
     "blue": "rgb(125, 125, 255)"};
    }
     on_area_active() {
      patch_console();
    }
     formatMessage() {
      let s="";
      let prev="";
      function safestr(obj) {
        if (typeof obj==="object"&&Array.isArray(obj)) {
            let s="[\n";
            let i=0;
            for (let item of obj) {
                if (i>0) {
                    s+=",\n";
                }
                s+="  "+safestr(item);
                i++;
            }
            s+="]\n";
            return s;
        }
        return typeof obj==="symbol" ? obj.toString() : ""+obj;
      }
      for (let i=0; i<arguments.length; i++) {
          let arg=safestr(arguments[i]);
          let s2=""+arg;
          let next=i<arguments.length-1 ? (safestr(arguments[i+1])).trim() : "";
          if (s2.startsWith("%c")) {
              s2 = s2.slice(2, s2.length);
              let style=next.replace(/\n/g, "").split(";");
              for (let line of style) {
                  line = (""+line).trim().split(":");
                  if (line.length===2&&(""+line[0]).trim()==="color") {
                      let color=(""+line[1]).trim().toLowerCase();
                      if (color in util.termColorMap) {
                          s2 = termColor(s2, color);
                      }
                  }
              }
              i++;
          }
          s+=s2+" ";
          prev = s2;
      }
      return (""+s).trim();
    }
     formatStackLine(stack, parts=false) {
      if (stack.search("at")<0) {
          return "";
      }
      stack = ""+stack;
      stack = stack.replace("at ", "").trim();
      let i=stack.length-1;
      while (i>0&&stack[i]!=="/"&&stack[i]!=="\\") {
        i--;
      }
      let i2=stack.search("\\(");
      let prefix=i2>=0 ? (""+stack.slice(0, i2)).trim() : "";
      if (prefix.length>0) {
          prefix+=":";
      }
      stack = stack.slice(i+1, stack.length-1);
      if (parts) {
          return [prefix, stack];
      }
      return util.termColor(prefix, this.colors["object"])+util.termColor(stack, this.colors["source"]);
    }
     push(msg, linefg="", linebg="", childafter=false) {
      let stack=""+new Error().stack;
      stack = (""+stack.split("\n")[5]).trim();
      stack = this.formatStackLine(stack);
      let ls=msg.split("\n");
      for (let i=0; i<ls.length; i++) {
          let l=ls[i];
          let loc="";
          if (i===ls.length-1) {
              loc = stack;
          }
          l = new ConsoleLineEntry(l, loc, linefg, linebg);
          if (childafter) {
              l.children = ls.length-i;
          }
          this.pushLine(l);
      }
    }
     pushLine(line) {
      if (line===undefined) {
          line = "";
      }
      if (typeof line==="string") {
          line = new ConsoleLineEntry(line, "");
      }
      if (this.lines.length>=this.bufferSize) {
          this.lines[this.head] = line;
          this.head = (this.head+1)%this.lines.length;
      }
      else {
        this.lines.push(line);
        this.head = this.lines.length;
      }
      _silence();
      this.queueRedraw();
      _unsilence();
      if (Math.abs(this.scroll[1])>10) {
      }
    }
    get  lineHeight() {
      return this.fontsize*1.3*UIBase.getDPI();
    }
     printStack(start=0, fg="", bg="", closed=true) {
      let stack=(""+new Error().stack).split("\n");
      let off=-1;
      for (let i=start; i<stack.length; i++) {
          let s=stack[i];
          let l=this.formatStackLine(s, true);
          l[0] = "  "+(""+l[0]).trim();
          l = new ConsoleLineEntry(l[0], l[1], fg, bg);
          l.closed = closed;
          l.parent = off--;
          this.pushLine(l);
      }
    }
     warn() {
      let msg=this.formatMessage(...arguments);
      msg = util.termColor(msg, 1);
      this.push(msg, this.colors["warning"], this.colors["warning_bg"], true);
      this.printStack(5, undefined, this.colors["warning_bg"], true);
    }
     error() {
      let msg=this.formatMessage(...arguments);
      msg = util.termColor(msg, 1);
      this.push(msg, this.colors["error"], this.colors["error_bg"], true);
      this.printStack(5, undefined, this.colors["error_bg"], true);
    }
     trace() {
      let msg=this.formatMessage(...arguments);
      this.push(msg);
      this.printStack(5, undefined, undefined, false);
    }
     log() {
      let msg=this.formatMessage(...arguments);
      this.push(msg);
    }
     _mouse(e) {
      let x=e.x, y=e.y;
      let rect=this.canvas.getClientRects()[0];
      let dpi=UIBase.getDPI();
      if (rect) {
          x-=rect.x;
          y-=rect.y;
          x*=dpi;
          y*=dpi;
      }
      let e2={preventDefault: e.preventDefault.bind(e), 
     stopPropagation: e.stopPropagation.bind(e), 
     buttons: e.buttons, 
     button: e.button, 
     shiftKey: e.shiftKey, 
     ctrlKey: e.ctrlKey, 
     altKey: e.altKey, 
     commandKey: e.commandKey, 
     x: x, 
     y: y, 
     pageX: x, 
     pageY: y, 
     touches: e.touches};
      return e2;
    }
     on_mousedown(e) {
      e = this._mouse(e);
      let hb=this.updateActive(e.x, e.y);
      if (hb) {
          hb.click(e, this);
      }
      _silence();
      console.log(e.x, e.y);
      _unsilence();
    }
     on_mousemove(e) {
      _silence();
      e = this._mouse(e);
      this.updateActive(e.x, e.y);
      _unsilence();
    }
     updateActive(x, y) {
      let found=0;
      for (let hb of this.hitboxes) {
          let ok=1;
          ok = ok&&(x>hb.pos[0]&&x<=hb.pos[0]+hb.size[0]);
          ok = ok&&(y>hb.pos[1]&&y<=hb.pos[1]+hb.size[1]);
          if (ok) {
              found = 1;
              if (this.lines.active!==undefined) {
                  this.lines.active.flag&=~LineFlags.ACTIVE;
              }
              if (hb.lines.length>0) {
                  if (this.lines.active!==hb.lines[0]) {
                      hb.lines[0].flag|=LineFlags.ACTIVE;
                      this.lines.active = hb.lines[0];
                      this.queueRedraw();
                  }
                  return hb;
              }
          }
      }
      if (!found&&this.lines.active) {
          this.lines.active.flag&=~LineFlags.ACTIVE;
          this.queueRedraw();
      }
    }
     on_mouseup(e) {
      e = this._mouse(e);
      _silence();
      console.log(e.x, e.y);
      _unsilence();
    }
     init() {
      super.init();
      this.addEventListener("mousewheel", (e) =>        {
        this.scroll[1]+=-e.deltaY;
        this.queueRedraw();
      });
      let header=this.header;
      let container=this.container;
      let col=container.col();
      let canvas=this.canvas = document.createElement("canvas");
      let g=this.g = canvas.getContext("2d");
      canvas.addEventListener("mousemove", this.on_mousemove.bind(this));
      canvas.addEventListener("mousedown", this.on_mousedown.bind(this));
      canvas.addEventListener("mouseup", this.on_mouseup.bind(this));
      col.shadow.appendChild(canvas);
      let textbox=this.textbox = document.createElement("input");
      textbox.type = "text";
      col.shadow.appendChild(textbox);
      textbox.style["width"] = "100%";
      textbox.style["height"] = "25px";
      textbox.style["padding-left"] = "5px";
      textbox.style["padding-top"] = "1px";
      textbox.style["padding-bottom"] = "1px";
      textbox.oninput = this._on_change.bind(this);
      textbox.onkeydown = this._on_keydown.bind(this);
      this.setCSS();
      this.update();
      this.queueRedraw();
    }
     _on_change(e) {
      _silence();
      console.log("yay", e);
      _unsilence();
    }
     pushHistory(cmd) {
      let lasti=this.history.cur-1;
      let last=this.history.length>0&&this.history.cur>0 ? this.history[lasti].command : undefined;
      if (cmd===last) {
          return ;
      }
      _silence();
      console.log("history insert");
      _unsilence();
      let command=new ConsoleCommand(cmd);
      this.history.push(command);
      this.history.cur = this.history.length;
    }
     doCommand(cmd) {
      this.scroll[1] = 0.0;
      this.pushHistory(cmd);
      let v=undefined;
      try {
        v = eval(cmd);
      }
      catch (error) {
          console.error(error);
          return ;
      }
      console.log(v);
    }
     doTab(cmd="") {
      let i=cmd.length-1;
      while (i>=0) {
        if (cmd[i]==="."||cmd[i]==="]"||cmd[i]===")") {
            break;
        }
        i--;
      }
      let prefix;
      let suffix;
      let join="";
      if (i<=0) {
          prefix = "";
          suffix = (""+cmd).trim();
      }
      else {
        prefix = cmd.slice(0, i).trim();
        suffix = cmd.slice(i+1, cmd.length).trim();
        join = cmd[i];
      }
      _silence();
      console.log("p:", prefix);
      console.log("s:", suffix);
      _unsilence();
      let obj;
      try {
        obj = prefix==="" ? window : eval(prefix);
      }
      catch (error) {
          obj = undefined;
      }
      _silence();
      console.log(obj);
      _unsilence();
      if (typeof obj!=="object"&&typeof obj!=="function") {
          return ;
      }
      let keys=Reflect.ownKeys(obj);
      keys = keys.concat(Object.keys(Object.getOwnPropertyDescriptors(obj)));
      keys = keys.concat(Object.keys(Object.getOwnPropertyDescriptors(obj.__proto__)));
      keys = new Set(keys);
      let keys2=[];
      for (let k of keys) {
          keys2.push(k);
      }
      keys = keys2;
      let list=[];
      let lsuffix=suffix.toLowerCase();
      let hit=suffix;
      let hit2=undefined;
      keys.sort((a, b) =>        {
        return a.length-b.length;
      });
      for (let k of keys) {
          if (typeof k!=="string") {
              continue;
          }
          if (suffix.length===0) {
              list.push(k);
              continue;
          }
          if (k.startsWith(suffix)&&(hit2===undefined||k.length<hit2.length)) {
              hit = k;
              hit2 = k;
          }
          if (k.toLowerCase().startsWith(lsuffix)) {
              list.push(k);
          }
      }
      _silence();
      console.log(hit);
      console.log(list);
      _unsilence();
      let printall=0;
      if (hit) {
          let s=(prefix+join+hit).trim();
          if (s===this.textbox.value) {
              printall = 1;
          }
          this.textbox.value = s;
          this.textbox.setSelectionRange(s.length, s.length);
          window.tb = this.textbox;
      }
      else {
        printall = 1;
      }
      if (printall) {
          this.scroll[1] = 0.0;
          this.pushLine(new ConsoleLineEntry(""));
          for (let k of list) {
              let l=new ConsoleLineEntry("  "+k);
              this.pushLine(l);
          }
      }
    }
     goHistory(di) {
      if (this.history.length===0) {
          return ;
      }
      let i=this.history.cur;
      let push=(this.textbox.value.trim().length>0);
      if (push) {
          this.pushHistory(this.textbox.value.trim());
      }
      i = Math.min(Math.max(i+di, 0), this.history.length-1);
      this.history.cur = i;
      let s=this.history[i].command.trim();
      this.textbox.value = s;
      this.textbox.setSelectionRange(s.length, s.length);
    }
     popup(x, y) {

    }
     _on_keydown(e) {
      _silence();
      console.log(e.keyCode);
      _unsilence();
      e.stopPropagation();
      switch (e.keyCode) {
        case keymap["R"]:
          if ((e.ctrlKey|e.commandKey)&&!e.shiftKey&&!e.altKey) {
              location.reload();
          }
          break;
        case keymap["Tab"]:
          this.doTab(this.textbox.value);
          e.preventDefault();
          e.stopPropagation();
          break;
        case keymap["Enter"]:
          this.doCommand(this.textbox.value);
          this.textbox.value = "";
          break;
        case keymap["Up"]:
          this.goHistory(-1);
          break;
        case keymap["Down"]:
          this.goHistory(1);
          break;
      }
    }
     redraw() {
      this._animreq = 0;
      this.hitboxes = [];
      if (!this.canvas||!this.g) {
          return ;
      }
      let ts=this.fontsize*UIBase.getDPI();
      let canvas=this.canvas;
      let g=this.g;
      let c=this.getDefault("DefaultText").color;
      let font=this.getDefault("DefaultText");
      c = css2color(c);
      for (let i=0; i<3; i++) {
          let f=1.0-c[i];
          c[i]+=(f-c[i])*0.75;
      }
      let bg=color2css(c);
      g.resetTransform();
      g.fillStyle = bg;
      g.rect(0, 0, canvas.width, canvas.height);
      g.fill();
      g.font = font.genCSS(ts);
      g.fillStyle = font.color;
      let width=canvas.width, height=canvas.height;
      let lh=this.lineHeight;
      let pad1=10*UIBase.getDPI();
      let scroll=this.scroll;
      let x=scroll[0];
      let y=scroll[1]+5+canvas.height-lh;
      let this2=this;
      let color=g.font.color;
      let fontcpy=font.copy();
      let stateMachine={stack: [], 
     start: function start(x, y, color) {
          this.stack.length = 0;
          this.x = x;
          this.y = y;
          this.state = this.base;
          this.d = 0;
          this.param1 = 0;
          this.param2 = 0;
          this.bgcolor = undefined;
          this.color = color;
          this.font = g.font;
        }, 
     escape: function escape(c) {
          let ci=c.charCodeAt(0);
          if (this.d===0&&c==="[") {
              this.d++;
          }
          else 
            if (this.d===1&&ci>=48&&ci<=57) {
              this.param1 = c;
              this.d++;
          }
          else 
            if (this.d===2&&ci>=48&&ci<=57) {
              this.param2 = c;
              this.d++;
          }
          else 
            if (c==="m"&&this.d>=2) {
              let tcolor=this.param1;
              if (this.d>2) {
                  tcolor+=this.param2;
              }
              tcolor = parseInt(tcolor);
              if (tcolor===0) {
                  font.copyTo(fontcpy);
                  fontcpy.color = color;
                  this.bgcolor = undefined;
                  this.color = fontcpy.color;
                  this.font = fontcpy.genCSS(ts);
              }
              else 
                if (tcolor===1) {
                  fontcpy.weight = "bold";
                  this.font = fontcpy.genCSS(ts);
              }
              else 
                if (tcolor===4) {
              }
              else 
                if (tcolor>=40) {
                  this.bgcolor = termColorMap[tcolor-10];
                  if (this.bgcolor&&this.bgcolor in this2.colormap) {
                      this.bgcolor = this2.colormap[this.bgcolor];
                  }
              }
              else {
                this.color = termColorMap[tcolor];
                if (this.color&&this.color in this2.colormap) {
                    this.color = this2.colormap[this.color];
                }
              }
              this.state = this.base;
          }
          else {
            this.state = this.base;
            return "?";
          }
          return false;
        }, 
     base: function base(c) {
          let ci=c.charCodeAt(0);
          if (ci===27) {
              this.state = this.escape;
              this.d = 0;
              this.param1 = "";
              this.param2 = "";
              return false;
          }
          if (c===" ") {
              this.x+=ts;
              return false;
          }
          else 
            if (c=="\t") {
              this.x+=ts*2.0;
              return false;
          }
          if (ci<30) {
              return "?";
          }
          return c;
        }};
      let fillText=(s, x, y, bg) =>        {
        stateMachine.start(x, y, color);
        for (let i=0; i<s.length; i++) {
            let c=s[i];
            c = stateMachine.state(c);
            if (c===false) {
                continue;
            }
            if (stateMachine.font!==g.font) {
                g.font = stateMachine.font;
            }
            let w=g.measureText(c).width;
            stateMachine.x+=w;
            if (stateMachine.bgcolor!==undefined) {
                g.beginPath();
                g.rect(stateMachine.x, stateMachine.y+2, w, ts);
                let old=g.fillStyle;
                g.fillStyle = stateMachine.bgcolor;
                g.fill();
                g.fillStyle = old;
            }
            g.fillStyle = stateMachine.color;
            g.fillText(c, stateMachine.x, stateMachine.y);
        }
      };
      let measureText=(s) =>        {
        stateMachine.start(0, 0, color);
        for (let i=0; i<s.length; i++) {
            let c=s[i];
            c = stateMachine.state(c);
            if (c===false) {
                continue;
            }
            if (stateMachine.font!==g.font) {
                g.font = stateMachine.font;
            }
            let w=g.measureText(c).width;
            stateMachine.x+=w;
            g.fillStyle = stateMachine.color;
            g.fillText(c, stateMachine.x, stateMachine.y);
        }
        return {width: stateMachine.x}
      };
      let lines=this.lines;
      for (let li2=lines.length-1; li2>=0; li2--) {
          let li=(li2+this.head)%this.lines.length;
          let l=lines[li];
          let s=l.line;
          if (l.closed||y<-lh*4||y>=canvas.height+lh*3) {
              if (!l.closed) {
                  y-=lh;
                  if (l.flag&LineFlags.TWO_LINE) {
                      y-=lh;
                  }
              }
              continue;
          }
          if (l.bg) {
              g.beginPath();
              g.fillStyle = l.bg;
              g.rect(x, y-ts+2, canvas.width, ts+3);
              g.fill();
          }
          if (l.flag&LineFlags.ACTIVE) {
              g.beginPath();
              g.fillStyle = "rgb(255,255,255,0.2)";
              g.rect(x, y-ts+2, canvas.width, ts+3);
              g.fill();
          }
          color = l.fg ? l.fg : font.color;
          g.fillStyle = font.color;
          let w1=measureText(s).width;
          if (l.loc.length>0) {
              let w2=measureText(l.loc).width;
              if (w1+w2+pad1*2<canvas.width) {
                  l.flag&=~LineFlags.TWO_LINE;
                  g.fillStyle = this.colors["loc"];
                  fillText(l.loc, canvas.width-pad1-w2, y);
              }
              else {
                l.flag|=LineFlags.TWO_LINE;
                g.fillStyle = this.colors["loc"];
                fillText(l.loc, canvas.width-pad1-w2, y);
                y-=lh;
              }
          }
          if (l.children!==NO_CHILDREN) {
              let hb=new HitBox(x, y-ts+2, canvas.width, ts+3);
              hb.lines.push(l);
              this.hitboxes.push(hb);
          }
          fillText(s, x, y);
          y-=lh;
      }
    }
     updateSize() {
      if (!this.canvas)
        return ;
      let dpi=UIBase.getDPI();
      let w1=this.size[0];
      let h1=this.size[1]-100/dpi;
      let w2=~~(w1*dpi);
      let h2=~~(h1*dpi);
      let canvas=this.canvas;
      if (w2!==canvas.width||h2!==canvas.height) {
          console.log("resizing console canvas");
          this.canvas.style["width"] = (w2/dpi)+"px";
          this.canvas.style["height"] = (h2/dpi)+"px";
          this.canvas.width = w2;
          this.canvas.height = h2;
          this.queueRedraw();
      }
    }
     queueRedraw() {
      if (this._animreq) {
          return ;
      }
      this._animreq = 1;
      requestAnimationFrame(this.redraw);
    }
     setCSS() {
      this.updateSize();
    }
     update() {
      if (!this.ctx) {
          return ;
      }
      g_screen = this.ctx.screen;
      super.update();
      this.updateSize();
    }
    static  define() {
      return {tagname: "console-editor-x", 
     areaname: "console_editor", 
     uiname: "Console", 
     icon: Icons.CONSOLE_EDITOR, 
     flag: 0, 
     style: "console"}
    }
     copy() {
      return document.createElement("console-editor-x");
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.history.cur = this.history.length;
      for (let i=0; i<this.lines.length; i++) {
          if (typeof this.lines[i]==="string") {
              this.lines[i] = new ConsoleLineEntry(this.lines[i], "");
          }
      }
    }
  }
  _ESClass.register(ConsoleEditor);
  _es6_module.add_class(ConsoleEditor);
  ConsoleEditor = _es6_module.add_export('ConsoleEditor', ConsoleEditor);
  ConsoleEditor.STRUCT = nstructjs.inherit(ConsoleEditor, Editor)+`
    fontsize    :  float;
    bufferSize  :  int;
    lines       :  array(ConsoleLineEntry);
    history     :  array(ConsoleCommand);
    head        :  int;
    scroll      :  vec2;
}`;
  Editor.register(ConsoleEditor);
}, '/dev/fairmotion/src/editors/console/console.js');
es6_module_define('theme', ["../path.ux/scripts/util/util.js", "../path.ux/scripts/core/ui_theme.js"], function _theme_module(_es6_module) {
  var CSSFont=es6_import_item(_es6_module, '../path.ux/scripts/core/ui_theme.js', 'CSSFont');
  var util=es6_import(_es6_module, '../path.ux/scripts/util/util.js');
  const theme={base: {AreaHeaderBG: 'rgba(65, 65, 65, 1.0)', 
    BasePackFlag: 0, 
    BoxBG: 'rgba(100,100,100, 0.558404961947737)', 
    BoxBorder: 'rgba(196,196,196, 1)', 
    BoxDepressed: 'rgba(43,32,27, 0.7410558240167026)', 
    BoxDrawMargin: 2, 
    BoxHighlight: 'rgba(125, 195, 225, 1.0)', 
    BoxMargin: 4, 
    BoxRadius: 12, 
    BoxSub2BG: 'rgba(55, 55, 55, 1.0)', 
    BoxSubBG: 'rgba(75, 75, 75, 1.0)', 
    DefaultPanelBG: 'rgba(75, 75, 75, 1.0)', 
    DefaultText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 10, 
     color: 'rgba(215, 215, 215, 1.0)'}), 
    Disabled: {AreaHeaderBG: 'rgb(72, 72, 72)', 
     BoxBG: 'rgb(50, 50, 50)', 
     BoxSub2BG: 'rgb(50, 50, 50)', 
     BoxSubBG: 'rgb(50, 50, 50)', 
     DefaultPanelBG: 'rgb(72, 72, 72)', 
     InnerPanelBG: 'rgb(72, 72, 72)', 
     'background-color': 'rgb(72, 72, 72)', 
     'background-size': '5px 3px', 
     'border-radius': '15px'}, 
    FocusOutline: 'rgba(100, 150, 255, 1.0)', 
    HotkeyText: new CSSFont({font: 'courier', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgba(230, 230, 230, 1.0)'}), 
    InnerPanelBG: 'rgba(85, 85, 85, 1.0)', 
    LabelText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgba(215, 215, 215, 1.0)'}), 
    NoteBG: 'rgba(220, 220, 220, 0.0)', 
    NoteText: new CSSFont({font: 'sans-serif', 
     weight: 'bold', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgba(235, 235, 235, 1.0)'}), 
    ProgressBar: 'rgba(75, 175, 255, 1.0)', 
    ProgressBarBG: 'rgba(110, 110, 110, 1.0)', 
    ScreenBorderInner: 'rgba(120, 120, 120, 1.0)', 
    ScreenBorderMousePadding: 5, 
    ScreenBorderOuter: 'rgba(120, 120, 120, 1.0)', 
    ScreenBorderWidth: 2, 
    TitleText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgba(215, 215, 215, 1.0)'}), 
    ToolTipText: new CSSFont({font: 'sans-serif', 
     weight: 'bold', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgba(35, 35, 35, 1.0)'}), 
    defaultHeight: 24, 
    defaultWidth: 24, 
    mobileSizeMultiplier: 2, 
    mobileTextSizeMultiplier: 1.5, 
    numslider_height: 20, 
    numslider_width: 20, 
    oneAxisMargin: 6, 
    oneAxisPadding: 6, 
    themeVersion: 0.1}, 
   button: {BoxMargin: 7.491595625232676, 
    defaultHeight: 24, 
    defaultWidth: 100}, 
   checkbox: {BoxMargin: 2, 
    CheckSide: 'left'}, 
   colorfield: {circleSize: 4, 
    colorBoxHeight: 24, 
    defaultHeight: 200, 
    defaultWidth: 200, 
    fieldsize: 32, 
    hueheight: 24}, 
   colorpickerbutton: {defaultFont: 'LabelText', 
    defaultHeight: 25, 
    defaultWidth: 100}, 
   console: {DefaultText: new CSSFont({font: 'monospace', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 18, 
     color: 'rgba(225, 225, 225, 1.0)'})}, 
   curvewidget: {CanvasBG: 'rgba(50, 50, 50, 0.75)', 
    CanvasHeight: 256, 
    CanvasWidth: 256}, 
   dopesheet: {DefaultText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 10, 
     color: 'rgba(209,209,209, 1)'}), 
    TreeText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgba(207,207,207, 1)'}), 
    boxSize: 14, 
    keyBorder: 'rgba(255,255,240, 0.4038793037677633)', 
    keyBorderWidth: 1.0403650286511763, 
    keyColor: 'rgba(82,82,82, 1)', 
    keyHighlight: 'rgba(195,159,136, 1)', 
    keySelect: 'rgba(83,109,255, 1)', 
    lineMajor: 'rgba(255, 255, 255, 0.5)', 
    lineMinor: 'rgba(50, 50, 50, 1.0)', 
    timeLine: "rgba(50, 150, 255, 0.75)", 
    lineWidth: 1, 
    textShadowColor: 'rgba(131,77,56, 1)', 
    textShadowSize: 5.048919110763356, 
    treeHeight: 600, 
    treeWidth: 100}, 
   dropbox: {BoxHighlight: 'rgba(155, 220, 255, 0.4)', 
    defaultHeight: 19.508909279310238, 
    dropTextBG: 'rgba(38,22,15, 0)'}, 
   iconbutton: {}, 
   iconcheck: {}, 
   listbox: {DefaultPanelBG: 'rgba(81,81,81, 1)', 
    ListActive: 'rgba(49,39,35, 1)', 
    ListHighlight: 'rgba(55,112,226, 0.3637933139143319)', 
    height: 200, 
    width: 110}, 
   menu: {MenuBG: 'rgba(40,40,40, 1)', 
    MenuBorder: '1px solid grey', 
    MenuHighlight: 'rgba(171,171,171, 0.28922413793103446)', 
    MenuSeparator: `
      width : 100%;
      height : 2px;
      padding : 0px;
      margin : 0px;
      border : none;
      background-color : grey;
    `, 
    MenuSpacing: 0, 
    MenuText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgba(238,238,238, 1)'})}, 
   numslider: {DefaultText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'white'}), 
    defaultHeight: 22.76656831702612, 
    defaultWidth: 100}, 
   numslider_simple: {BoxBG: 'rgb(225, 225, 225)', 
    BoxBorder: 'rgb(75, 75, 75)', 
    BoxRadius: 5, 
    DefaultHeight: 18, 
    DefaultWidth: 135, 
    SlideHeight: 10, 
    TextBoxWidth: 45, 
    TitleText: new CSSFont({font: undefined, 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 14, 
     color: undefined}), 
    labelOnTop: false}, 
   panel: {Background: 'rgba(38,22,15, 0.2642241905475485)', 
    BoxBorder: 'rgba(91,91,91, 1)', 
    BoxLineWidth: 0.9585563201850567, 
    BoxRadius: 5, 
    TitleBackground: 'rgba(126,178,237, 0.309051618904903)', 
    TitleBorder: 'rgba(136,136,136, 1)', 
    'border-style': 'inset', 
    'padding-bottom': undefined, 
    'padding-top': undefined}, 
   richtext: {DefaultText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 16, 
     color: 'rgba(35, 35, 35, 1.0)'}), 
    'background-color': undefined}, 
   scrollbars: {border: 'rgba(125,125,125, 1)', 
    color: 'rgba(56,56,56, 1)', 
    color2: '#505050', 
    contrast: 'rgba(75,38,38, 1)', 
    width: 15}, 
   tabs: {TabHighlight: 'rgba(50, 50, 50, 0.2)', 
    TabInactive: 'rgba(130, 130, 150, 1.0)', 
    TabStrokeStyle1: 'rgba(200, 200, 200, 1.0)', 
    TabStrokeStyle2: 'rgba(255, 255, 255, 1.0)', 
    TabText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 18, 
     color: 'rgba(215, 215, 215, 1.0)'})}, 
   textbox: {'background-color': undefined}, 
   tooltip: {BoxBG: 'rgb(245, 245, 245, 1.0)', 
    BoxBorder: 'rgb(145, 145, 145, 1.0)'}, 
   treeview: {itemIndent: 10, 
    rowHeight: 18}}
  _es6_module.add_export('theme', theme);
}, '/dev/fairmotion/src/editors/theme.js');
es6_module_define('MenuBar', ["../../core/struct.js", "../../path.ux/scripts/widgets/ui_menu.js", "../../path.ux/scripts/platforms/electron/electron_api.js", "../../path.ux/scripts/widgets/ui_widgets.js", "../../path.ux/scripts/core/ui_base.js", "../../../platforms/platform.js", "../editor_base.js", "../../path.ux/scripts/screen/ScreenArea.js", "../../core/startup/startup_file.js"], function _MenuBar_module(_es6_module) {
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var AreaFlags=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'AreaFlags');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var iconmanager=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'iconmanager');
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  var ui_widgets=es6_import(_es6_module, '../../path.ux/scripts/widgets/ui_widgets.js');
  var platform=es6_import(_es6_module, '../../../platforms/platform.js');
  var Menu=es6_import_item(_es6_module, '../../path.ux/scripts/widgets/ui_menu.js', 'Menu');
  var startup_file=es6_import_item(_es6_module, '../../core/startup/startup_file.js', 'startup_file');
  var electron_api=es6_import(_es6_module, '../../path.ux/scripts/platforms/electron/electron_api.js');
  class MenuBar extends Editor {
     constructor() {
      super();
      let dpi=UIBase.getDPI();
      let tilesize=iconmanager.getTileSize(0)+7;
      let h=Math.max(this.getDefault("TitleText").size, tilesize);
      this.editMenuDef = [];
      this._last_toolmode = undefined;
      this.maxSize = [undefined, h];
      this.minSize = [undefined, h];
    }
     buildRecentMenu() {
      let menu=document.createElement("menu-x");
      menu.setAttribute("title", "Recent Files");
      let paths=g_app_state.settings.recent_paths;
      paths = list(paths);
      paths.reverse();
      for (let p of paths) {
          let name=p.displayname;
          let id=p.path;
          let i=name.length-1;
          while (i>=0&&name[i]!=="/"&&name[i]!=="\\") {
            i--;
          }
          if (i>=0) {
              i++;
          }
          name = name.slice(i, name.length).trim();
          menu.addItem(name, id);
      }
      menu.onselect = (id) =>        {
        console.warn("recent files callback!", id);
        g_app_state.load_path(id);
      };
      return menu;
    }
     init() {
      super.init();
      let row=this.header;
      let SEP=Menu.SEP;
      let menudef=["appstate.quit()", "view2d.export_image()", "appstate.export_svg()", SEP, "appstate.save_as()", "appstate.save()", this.buildRecentMenu.bind(this), "appstate.open()", SEP, ["New File", function () {
        platform.app.questionDialog("Create blank scene?\nAny unsaved changes\nwill be lost").then((val) =>          {
          if (val) {
              gen_default_file(g_app_state.screen.size);
          }
        });
      }]];
      menudef.reverse();
      row.menu("&File", menudef);
      this.genSessionMenu(row);
      let notef=document.createElement("noteframe-x");
      notef.ctx = this.ctx;
      row._add(notef);
      if (window.haveElectron) {
          electron_api.initMenuBar(this);
          this.minSize[1] = this.maxSize[1] = 1;
      }
    }
     buildEditMenu() {
      console.log("rebuilding edit menu");
      this.editMenuDef.length = 0;
      this.editMenuDef.push(["Undo", function () {
        g_app_state.toolstack.undo();
      }, "Ctrl + Z", Icons.UNDO]);
      this.editMenuDef.push(["Redo", function () {
        g_app_state.toolstack.undo();
      }, "Ctrl + Shift + Z", Icons.REDO]);
      if (!this.ctx||!this.ctx.toolmode) {
          return ;
      }
      let ret=g_app_state.ctx.toolmode.constructor.buildEditMenu();
      if (!ret)
        return ;
      for (let item of ret) {
          this.editMenuDef.push(item);
      }
    }
     genSessionMenu(row) {
      function callback(entry) {
        console.log(entry);
        if (entry.i==0) {
            if (confirm("Settings will be cleared", "Clear Settings?")) {
                console.log("clearing settings");
                ctx.appstate.session.settings.reload_defaults();
            }
        }
        else 
          if (entry.i==2) {
            g_app_state.set_startup_file();
        }
        else 
          if (entry.i==1) {
            myLocalStorage.set("startup_file", startup_file);
        }
      }
      row.dynamicMenu("&Edit", this.editMenuDef);
      this.buildEditMenu();
      row.menu("&Session", [["Save Default File", function () {
        platform.app.questionDialog("Erase default startup file?").then((val) =>          {
          if (val) {
              g_app_state.set_startup_file();
              console.log("save default file", val);
          }
        });
      }], ["Clear Default File", function () {
        platform.app.questionDialog("Erase default startup file?").then((val) =>          {
          if (val) {
              myLocalStorage.set("startup_file", startup_file);
              console.log("clear default file", val);
          }
        });
      }, "ctrl-alt-u"], ["Reset Settings", function () {
        platform.app.questionDialog("Settings will be cleared", "Clear Settings?").then((val) =>          {
          if (val) {
              console.log("clearing settings");
              ctx.appstate.session.settings.reload_defaults();
          }
        });
      }]]);
    }
     update() {
      super.update();
      if (!this.ctx||!this.ctx.scene) {
          return ;
      }
      if (this._last_toolmode!==this.ctx.scene.toolmode_i) {
          this._last_toolmode = this.ctx.scene.toolmode_i;
          this.buildEditMenu();
      }
    }
    static  getHeight() {
      let ctx=g_app_state.ctx;
      if (ctx&&ctx.menubar) {
          return ctx.menubar.minSize[1];
      }
      return 28;
    }
     makeHeader(container) {
      super.makeHeader(container, false);
    }
    static  define() {
      return {tagname: "menubar-editor-x", 
     areaname: "menubar_editor", 
     uiname: "menu", 
     icon: Icons.MENU_EDITOR, 
     flag: AreaFlags.HIDDEN|AreaFlags.NO_SWITCHER}
    }
     copy() {
      return document.createElement("menubar-editor-x");
    }
  }
  _ESClass.register(MenuBar);
  _es6_module.add_class(MenuBar);
  MenuBar = _es6_module.add_export('MenuBar', MenuBar);
  MenuBar.STRUCT = STRUCT.inherit(MenuBar, Editor)+`
}
`;
  Editor.register(MenuBar);
}, '/dev/fairmotion/src/editors/menubar/MenuBar.js');
es6_module_define('events', ["../path.ux/scripts/util/events.js", "../path.ux/scripts/util/vectormath.js"], function _events_module(_es6_module) {
  "use strict";
  var Vector2=es6_import_item(_es6_module, '../path.ux/scripts/util/vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../path.ux/scripts/util/vectormath.js', 'Vector3');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/util/vectormath.js', 'Matrix4');
  var keymap=es6_import_item(_es6_module, '../path.ux/scripts/util/events.js', 'keymap');
  var reverse_keymap=es6_import_item(_es6_module, '../path.ux/scripts/util/events.js', 'reverse_keymap');
  let charmap=keymap;
  charmap = _es6_module.add_export('charmap', charmap);
  let charmap_rev=reverse_keymap;
  charmap_rev = _es6_module.add_export('charmap_rev', charmap_rev);
  window.charmap = charmap;
  window.charmap_rev = charmap_rev;
  class MyKeyboardEvent  {
     constructor(code, shift=false, ctrl=false, alt=false) {
      this.keyCode = code;
      this.shiftKey = shift;
      this.ctrlKey = ctrl;
      this.altKey = alt;
    }
  }
  _ESClass.register(MyKeyboardEvent);
  _es6_module.add_class(MyKeyboardEvent);
  MyKeyboardEvent = _es6_module.add_export('MyKeyboardEvent', MyKeyboardEvent);
  window.MyKeyboardEvent = MyKeyboardEvent;
  class MyMouseEvent  {
    
     constructor(x, y, button, type) {
      this.x = x;
      this.y = y;
      this.button = button;
      this.type = type;
      this.touches = {};
    }
     copy(sub_offset=undefined) {
      var ret=new MyMouseEvent(this.x, this.y, this.button, this.type);
      for (var k in this.touches) {
          var t=this.touches[k];
          var x=t[0], y=t[1];
          if (sub_offset) {
              x-=sub_offset[0];
              y-=sub_offset[1];
          }
          ret.touches[k] = [x, y];
      }
      return ret;
    }
  }
  _ESClass.register(MyMouseEvent);
  _es6_module.add_class(MyMouseEvent);
  MyMouseEvent = _es6_module.add_export('MyMouseEvent', MyMouseEvent);
  window.MyMouseEvent = MyMouseEvent;
  MyMouseEvent.MOUSEMOVE = 0;
  MyMouseEvent.MOUSEDOWN = 1;
  MyMouseEvent.MOUSEUP = 2;
  MyMouseEvent.LEFT = 0;
  MyMouseEvent.RIGHT = 1;
  var _swap_next_mouseup=false;
  var _swap_next_mouseup_button=2;
  function swap_next_mouseup_event(button) {
    _swap_next_mouseup = true;
    _swap_next_mouseup_button = button;
  }
  swap_next_mouseup_event = _es6_module.add_export('swap_next_mouseup_event', swap_next_mouseup_event);
  var _ignore_next_mouseup=false;
  var _ignore_next_mouseup_button=2;
  function ignore_next_mouseup_event(button) {
    _ignore_next_mouseup = true;
    _ignore_next_mouseup_button = button;
  }
  ignore_next_mouseup_event = _es6_module.add_export('ignore_next_mouseup_event', ignore_next_mouseup_event);
  class EventHandler  {
     constructor() {
      this.EventHandler_init();
    }
     EventHandler_init() {
      this.modalstack = new Array();
      this.modalhandler = null;
      this.keymap = null;
      this.touch_manager = undefined;
      this.touch_delay_stack = [];
    }
     push_touch_delay(delay_ms) {
      this.touch_delay_stack.push(this.touch_delay);
      this.touch_delay = delay_ms;
    }
     pop_touch_delay() {
      if (this.touch_delay_stack.length==0) {
          console.log("Invalid call to EventHandler.pop_touch_delay!");
          return ;
      }
      this.touch_delay = this.touch_delay_stack.pop();
    }
    set  touch_delay(delay_ms) {
      if (delay_ms==0) {
          this.touch_manager = undefined;
      }
      else {
        if (this.touch_manager==undefined)
          this.touch_manager = new TouchEventManager(this, delay_ms);
        else 
          this.touch_manager.delay = delay_ms;
      }
    }
    get  touch_delay() {
      if (this.touch_manager==undefined)
        return 0;
      return this.touch_manager.delay;
    }
     on_tick() {
      if (this.touch_manager!=undefined)
        this.touch_manager.process();
    }
     bad_event(event) {
      var tm=this.touch_manager;
      if (tm==undefined)
        return false;
      if (this.touch_manager!=undefined)
        this.touch_manager.process();
      if (tm!=undefined&&__instance_of(event, MyMouseEvent)) {
          var i=0;
          for (var k in event.touches) {
              i++;
          }
          if (i==0)
            return false;
          if ("_good" in event)
            return false;
          this.touch_manager.queue_event(event);
          return true;
      }
      return false;
    }
     on_textinput(event) {

    }
     on_keydown(event) {

    }
     on_charcode(event) {

    }
     on_keyinput(event) {

    }
     on_keyup(event) {

    }
     on_mousemove(event) {

    }
     on_mousedown(event) {

    }
     on_doubleclick(event) {

    }
     on_pan(pan, last_pan) {

    }
     on_gl_lost(new_gl) {

    }
     on_mouseup2(event) {

    }
     on_mouseup3(event) {

    }
     on_mousedown2(event) {

    }
     on_mousedown3(event) {

    }
     on_mousemove2(event) {

    }
     on_mousemove3(event) {

    }
     on_mousewheel(event) {

    }
     on_mouseup(event) {

    }
     on_resize(newsize) {

    }
     on_contextchange(event) {

    }
     on_draw(gl) {

    }
     has_modal() {
      return this.modalhandler!=null;
    }
     push_modal(handler) {
      if (this.modalhandler!=null) {
          this.modalstack.push(this.modalhandler);
      }
      this.modalhandler = handler;
    }
     pop_modal() {
      if (this.modalhandler!=null) {
      }
      if (this.modalstack.length>0) {
          this.modalhandler = this.modalstack.pop();
      }
      else {
        this.modalhandler = null;
      }
    }
     _on_resize(newsize) {
      this.on_resize(event);
    }
     _on_pan(pan, last_pan) {
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_pan(event);
      else 
        this.on_pan(event);
    }
     _on_textinput(event) {
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_textinput(event);
      else 
        this.on_textinput(event);
    }
     _on_keydown(event) {
      if (this.bad_event(event))
        return ;
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_keydown(event);
      else 
        this.on_keydown(event);
    }
     _on_charcode(event) {
      if (this.bad_event(event))
        return ;
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_charcode(event);
      else 
        this.on_charcode(event);
    }
     _on_keyinput(event) {
      if (this.bad_event(event))
        return ;
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_keyinput(event);
      else 
        this.on_keyinput(event);
    }
     _on_keyup(event) {
      if (this.bad_event(event))
        return ;
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_keyup(event);
      else 
        this.on_keyup(event);
    }
     _on_mousemove(event) {
      if (this.bad_event(event))
        return ;
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_mousemove(event);
      else 
        this.on_mousemove(event);
    }
     _on_doubleclick(event) {
      if (this.bad_event(event))
        return ;
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_doubleclick(event);
      else 
        this.on_doubleclick(event);
    }
     _on_mousedown(event) {
      if (this.bad_event(event))
        return ;
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_mousedown(event);
      else 
        this.on_mousedown(event);
    }
     _on_mouseup(event) {
      if (this.bad_event(event))
        return ;
      if (_swap_next_mouseup&&event.button==_swap_next_mouseup_button) {
          event.button = _swap_next_mouseup_button==2 ? 0 : 2;
          _swap_next_mouseup = false;
      }
      if (_ignore_next_mouseup&&event.button==_ignore_next_mouseup_button) {
          _ignore_next_mouseup = false;
          return ;
      }
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_mouseup(event);
      else 
        this.on_mouseup(event);
    }
     _on_mousewheel(event, delta) {
      if (this.bad_event(event))
        return ;
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_mousewheel(event, delta);
      else 
        this.on_mousewheel(event, delta);
    }
  }
  _ESClass.register(EventHandler);
  _es6_module.add_class(EventHandler);
  EventHandler = _es6_module.add_export('EventHandler', EventHandler);
  var valid_modifiers={"SHIFT": 1, 
   "CTRL": 2, 
   "ALT": 4}
  window.charmap = charmap;
  window.charmap_rev = charmap_rev;
  class HotKey  {
    
    
    
    
    
     constructor(key, modifiers, uiname, menunum, ignore_charmap_error) {
      if (!charmap.hasOwnProperty(key)) {
          if (ignore_charmap_error!=undefined&&ignore_charmap_error!=true) {
              console.trace();
              console.log("Invalid hotkey "+key+"!");
          }
          this.key = 0;
          this.keyAscii = "[corrupted hotkey]";
          this.shift = this.alt = this.ctrl = false;
          return this;
      }
      if (typeof (key)=="string") {
          if (key.length==1)
            key = key.toUpperCase();
          this.keyAscii = key;
          this.key = charmap[key];
      }
      else {
        this.key = key;
        this.keyAscii = charmap[key];
      }
      this.shift = this.alt = this.ctrl = false;
      this.menunum = menunum;
      for (var i=0; i<modifiers.length; i++) {
          if (modifiers[i]=="SHIFT") {
              this.shift = true;
          }
          else 
            if (modifiers[i]=="ALT") {
              this.alt = true;
          }
          else 
            if (modifiers[i]=="CTRL") {
              this.ctrl = true;
          }
          else {
            console.trace();
            console.log("Warning: invalid modifier "+modifiers[i]+" in KeyHandler");
          }
      }
    }
     build_str(add_menu_num) {
      var s="";
      if (this.ctrl)
        s+="CTRL-";
      if (this.alt)
        s+="ALT-";
      if (this.shift)
        s+="SHIFT-";
      s+=this.keyAscii;
      return s;
    }
     [Symbol.keystr]() {
      return this.build_str(false);
    }
  }
  _ESClass.register(HotKey);
  _es6_module.add_class(HotKey);
  HotKey = _es6_module.add_export('HotKey', HotKey);
  class KeyMap extends hashtable {
    
     constructor() {
      super();
      this.op_map = new hashtable();
    }
     concat(keymap) {
      for (let key of keymap) {
          this.add(key, keymap.get(key));
      }
      return this;
    }
     get_tool_handler(toolstr) {
      if (this.op_map.has(toolstr))
        return this.op_map.get(toolstr);
    }
     add_tool(keyhandler, toolstr) {
      this.add(keyhandler, new ToolKeyHandler(toolstr));
      this.op_map.add(toolstr, keyhandler);
    }
     add_func(keyhandler, func) {
      this.add(keyhandler, new FuncKeyHandler(func));
    }
     add(keyhandler, value) {
      if (this.has(keyhandler)) {
          console.trace();
          console.log("Duplicate hotkey definition!");
      }
      if (__instance_of(value, ToolKeyHandler)&&!(typeof value.tool=="string"||__instance_of(value.tool, String))) {
          value.tool.keyhandler = keyhandler;
      }
      super.set(keyhandler, value);
    }
     process_event(ctx, event) {
      var modlist=[];
      if (event.ctrlKey)
        modlist.push("CTRL");
      if (event.shiftKey)
        modlist.push("SHIFT");
      if (event.altKey)
        modlist.push("ALT");
      var key=new HotKey(event.keyCode, modlist, 0, 0, true);
      if (this.has(key)) {
          ctx.keymap_mpos[0] = ctx.screen.mpos[0];
          ctx.keymap_mpos[1] = ctx.screen.mpos[1];
          return this.get(key).handle(ctx);
      }
      return undefined;
    }
  }
  _ESClass.register(KeyMap);
  _es6_module.add_class(KeyMap);
  KeyMap = _es6_module.add_export('KeyMap', KeyMap);
  class KeyHandlerCls  {
     handle(ctx) {

    }
  }
  _ESClass.register(KeyHandlerCls);
  _es6_module.add_class(KeyHandlerCls);
  KeyHandlerCls = _es6_module.add_export('KeyHandlerCls', KeyHandlerCls);
  class ToolKeyHandler extends KeyHandlerCls {
     constructor(tool) {
      super();
      this.tool = tool;
    }
     handle(ctx) {
      ctx.api.execTool(ctx, this.tool);
    }
  }
  _ESClass.register(ToolKeyHandler);
  _es6_module.add_class(ToolKeyHandler);
  ToolKeyHandler = _es6_module.add_export('ToolKeyHandler', ToolKeyHandler);
  class FuncKeyHandler extends KeyHandlerCls {
     constructor(func) {
      super();
      this.handle = func;
    }
  }
  _ESClass.register(FuncKeyHandler);
  _es6_module.add_class(FuncKeyHandler);
  FuncKeyHandler = _es6_module.add_export('FuncKeyHandler', FuncKeyHandler);
  var $was_clamped_NG1c_clamp_pan;
  class VelocityPan extends EventHandler {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.start_mpos = new Vector2();
      this.last_mpos = new Vector2();
      this.mpos = new Vector2();
      this.start_time = 0;
      this.owner = undefined;
      this.coasting = false;
      this.panning = false;
      this.was_touch = false;
      this.enabled = true;
      this.vel = new Vector2();
      this.pan = new Vector2();
      this.damp = 0.99;
      this.can_coast = true;
      this.start_pan = new Vector2();
      this.first = false;
      this.last_ms = 0;
      this.vel = new Vector2();
    }
     on_tick() {
      if (!this.panning&&this.coasting) {
          let vel=new Vector2();
          var damp=0.99;
          vel.load(this.vel);
          vel.mulScalar(time_ms()-this.last_ms);
          this.vel.mulScalar(damp);
          this.last_ms = time_ms();
          this.pan.sub(vel);
          var was_clamped=this.clamp_pan();
          this.owner.on_pan(this.pan, this.start_pan);
          var stop=was_clamped!=undefined&&(was_clamped[0]&&was_clamped[1]);
          stop = stop||this.vel.vectorLength<1;
          if (stop)
            this.coasting = false;
      }
    }
     calc_vel() {
      let vel=new Vector2();
      if (!this.can_coast) {
          this.vel.zero();
          this.coasting = false;
          this.last_ms = time_ms();
          return ;
      }
      var t=time_ms()-this.start_time;
      if (t<10) {
          console.log("small t!!!", t);
          return ;
      }
      vel.load(this.last_mpos).sub(this.mpos).divideScalar(t);
      this.vel.add(vel);
      this.coasting = (this.vel.vectorLength()>0.25);
      this.last_ms = time_ms();
    }
     start(start_mpos, last_mpos, owner, push_modal_func, pop_modal_func) {
      if (this.panning) {
          console.trace("warning, duplicate call to VelocityPan.start()");
          return ;
      }
      this.vel.zero();
      this.pop_modal_func = pop_modal_func;
      this.coasting = false;
      this.first = false;
      this.owner = owner;
      this.panning = true;
      push_modal_func(this);
      this.start_pan.load(this.pan);
      this.last_ms = time_ms();
      this.start_time = time_ms();
      this.was_touch = g_app_state.was_touch;
      this.start_mpos.load(start_mpos);
      this.last_mpos.load(start_mpos);
      this.mpos.load(start_mpos);
      this.do_mousemove(last_mpos);
    }
     end() {
      console.log("in end");
      if (this.panning) {
          console.log("  pop modal");
          this.pop_modal_func();
      }
      this.panning = false;
    }
     do_mousemove(mpos) {
      if (DEBUG.touch) {
          console.log("py", mpos[1]);
      }
      this.last_mpos.load(this.mpos);
      this.mpos.load(mpos);
      this.pan[0] = this.start_pan[0]+mpos[0]-this.start_mpos[0];
      this.pan[1] = this.start_pan[1]+mpos[1]-this.start_mpos[1];
      this.vel.zero();
      this.calc_vel();
      this.clamp_pan();
      this.owner.on_pan(this.pan, this.start_pan);
    }
     clamp_pan() {
      var bs=this.owner.pan_bounds;
      if (this.owner.state&8192*4)
        return ;
      var p=this.pan;
      $was_clamped_NG1c_clamp_pan[0] = false;
      $was_clamped_NG1c_clamp_pan[1] = false;
      for (var i=0; i<2; i++) {
          var l=p[i];
          p[i] = Math.min(Math.max(bs[0][i], p[i]), bs[0][i]+bs[1][i]);
          if (p[i]!=l)
            $was_clamped_NG1c_clamp_pan[i] = true;
      }
      return $was_clamped_NG1c_clamp_pan;
    }
     on_mouseup(event) {
      console.log("pan mouse up!", this.panning, this.owner);
      if (this.panning) {
          this.mpos.load([event.y, event.y]);
          this.calc_vel();
          this.end();
      }
    }
     on_mousemove(event) {
      this.do_mousemove([event.x, event.y]);
    }
     set_pan(pan) {
      if (this.panning)
        this.end();
      this.pan.load(pan);
      this.coasting = false;
      this.vel.zero();
    }
  }
  var $was_clamped_NG1c_clamp_pan=[0, 0];
  _ESClass.register(VelocityPan);
  _es6_module.add_class(VelocityPan);
  VelocityPan = _es6_module.add_export('VelocityPan', VelocityPan);
  class TouchEventManager  {
     constructor(owner, delay=100) {
      this.init(owner, delay);
    }
     init(owner, delay=100) {
      this.queue = new GArray();
      this.queue_ms = new GArray();
      this.delay = delay;
      this.owner = owner;
    }
     get_last(type) {
      var i=this.queue.length;
      if (i==0)
        return undefined;
      i--;
      var q=this.queue;
      while (i>=0) {
        var e=q[i];
        if (e.type==type||e.type!=MyMouseEvent.MOUSEMOVE)
          break;
        i--;
      }
      if (i<0)
        i = 0;
      return q[i].type==type ? q[i] : undefined;
    }
     queue_event(event) {
      var last=this.get_last(event.type);
      if (DEBUG.touch&&this==touch_manager)
        console.log("touch event", event.type);
      if (last!=undefined&&last.type!=MyMouseEvent.MOUSEMOVE) {
          var dis, same=true;
          for (var k in event.touches) {
              if (!(k in last.touches)) {
              }
          }
          dis = new Vector2([event.x, event.y]).vectorDistance(new Vector2([last.x, last.y]));
          if (DEBUG.touch&&this==touch_manager)
            console.log(dis);
          if (same&&dis<50) {
              if (DEBUG.touch&&this==touch_manager)
                console.log("destroying duplicate event", last.type, event.x, event.y, event.touches);
              for (var k in event.touches) {
                  last.touches[k] = event.touches[k];
              }
              return ;
          }
      }
      this.queue.push(event);
      this.queue_ms.push(time_ms());
    }
     cancel(event) {
      var ts=event.touches;
      var dl=new GArray;
      if (DEBUG.touch&&this==touch_manager)
        console.log("touch cancel", event);
      for (var e in this.queue) {
          for (var k in ts) {
              if (k in e.touches) {
                  delete e.touches;
              }
          }
          if (list(e.touches).length==0) {
              dl.push(e);
          }
      }
      for (var e in dl) {
          var i=this.queue.indexOf(e);
          this.queue.remove(e);
          this.queue_ms.pop_i(i);
      }
    }
     process() {
      var owner=this.owner;
      var dl=new GArray();
      var q=this.queue;
      var qm=this.queue_ms;
      var delay=this.delay;
      for (var i=0; i<q.length; i++) {
          if (time_ms()-qm[i]>delay) {
              dl.push(q[i]);
          }
      }
      for (var e of dl) {
          var i=q.indexOf(e);
          q.remove(e);
          qm.pop_i(i);
      }
      for (var e of dl) {
          e._good = true;
          g_app_state.was_touch = true;
          try {
            if (e.type==MyMouseEvent.MOUSEDOWN) {
                if (DEBUG.touch)
                  console.log("td1", e.x, e.y);
                owner._on_mousedown(e);
                if (DEBUG.touch)
                  console.log("td2", e.x, e.y);
            }
            else 
              if (e.type==MyMouseEvent.MOUSEMOVE) {
                owner._on_mousemove(e);
            }
            else 
              if (e.type==MyMouseEvent.MOUSEUP) {
                owner._on_mouseup(e);
            }
          }
          catch (_err) {
              print_stack(_err);
              console.log("Error executing delayed touch event");
          }
      }
    }
     reset() {
      this.queue = new GArray();
      this.queue_ms = new GArray();
    }
  }
  _ESClass.register(TouchEventManager);
  _es6_module.add_class(TouchEventManager);
  TouchEventManager = _es6_module.add_export('TouchEventManager', TouchEventManager);
  window.TouchEventManager = TouchEventManager;
  var touch_manager=window.touch_manager = new TouchEventManager(undefined, 20);
}, '/dev/fairmotion/src/editors/events.js');
es6_module_define('touchevents', [], function _touchevents_module(_es6_module) {
  "use strict";
  class TouchManager  {
    
    
    
     constructor(event) {
      this.pattern = new set(Object.keys(event.touches));
      this.idxmap = {};
      this.tot = event.touches.length;
      this.event = event;
      this.deltas = {};
      var i=0;
      for (var k in event.touches) {
          this.idxmap[i++] = k;
          this.deltas[k] = 0.0;
      }
    }
     update(event) {
      if (this.valid(event)) {
          for (var k in event.touches) {
              var t2=event.touches[k];
              var t1=this.event.touches[k];
              var d=[t2[0]-t1[0], t2[1]-t1[1]];
              this.deltas[k] = d;
          }
      }
      this.event = event;
    }
     delta(i) {
      return this.deltas[this.idxmap[i]];
    }
     get(i) {
      return this.event.touches[this.idxmap[i]];
    }
     valid(event=this.event) {
      var keys=Object.keys(event.touches);
      if (keys.length!=this.pattern.length)
        return false;
      for (var i=0; i<keys.length; i++) {
          if (!pattern.has(keys[i]))
            return false;
      }
      return true;
    }
  }
  _ESClass.register(TouchManager);
  _es6_module.add_class(TouchManager);
}, '/dev/fairmotion/src/util/touchevents.js');
es6_module_define('toolprops', ["./toolprops_iter.js", "../path.ux/scripts/util/struct.js", "./struct.js", "../path.ux/scripts/toolsys/toolprop.js", "./ajax.js"], function _toolprops_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
  var nstructjs=es6_import(_es6_module, '../path.ux/scripts/util/struct.js');
  var pack_int=es6_import_item(_es6_module, './ajax.js', 'pack_int');
  var pack_float=es6_import_item(_es6_module, './ajax.js', 'pack_float');
  var pack_static_string=es6_import_item(_es6_module, './ajax.js', 'pack_static_string');
  var setPropTypes=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'setPropTypes');
  var ToolProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'ToolProperty');
  var FlagProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'FlagProperty');
  var toolprop=es6_import(_es6_module, '../path.ux/scripts/toolsys/toolprop.js');
  let _ex_StringProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'StringProperty');
  _es6_module.add_export('StringProperty', _ex_StringProperty, true);
  let _ex_StringSetProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'StringSetProperty');
  _es6_module.add_export('StringSetProperty', _ex_StringSetProperty, true);
  let _ex_Vec2Property=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'Vec2Property');
  _es6_module.add_export('Vec2Property', _ex_Vec2Property, true);
  let _ex_Vec3Property=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'Vec3Property');
  _es6_module.add_export('Vec3Property', _ex_Vec3Property, true);
  let _ex_Vec4Property=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'Vec4Property');
  _es6_module.add_export('Vec4Property', _ex_Vec4Property, true);
  let _ex_Mat4Property=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'Mat4Property');
  _es6_module.add_export('Mat4Property', _ex_Mat4Property, true);
  let _ex_IntProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'IntProperty');
  _es6_module.add_export('IntProperty', _ex_IntProperty, true);
  let _ex_FloatProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'FloatProperty');
  _es6_module.add_export('FloatProperty', _ex_FloatProperty, true);
  let _ex_BoolProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'BoolProperty');
  _es6_module.add_export('BoolProperty', _ex_BoolProperty, true);
  let _ex_FlagProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'FlagProperty');
  _es6_module.add_export('FlagProperty', _ex_FlagProperty, true);
  let _ex_EnumProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'EnumProperty');
  _es6_module.add_export('EnumProperty', _ex_EnumProperty, true);
  let _ex_ListProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'ListProperty');
  _es6_module.add_export('ListProperty', _ex_ListProperty, true);
  let _ex_PropClasses=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'PropClasses');
  _es6_module.add_export('PropClasses', _ex_PropClasses, true);
  let _ex_ToolProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'ToolProperty');
  _es6_module.add_export('ToolProperty', _ex_ToolProperty, true);
  var PropTypes={INT: 1, 
   STRING: 2, 
   BOOL: 4, 
   ENUM: 8, 
   FLAG: 16, 
   FLOAT: 32, 
   VEC2: 64, 
   VEC3: 128, 
   VEC4: 256, 
   MATRIX4: 512, 
   QUAT: 1024, 
   PROPLIST: 4096, 
   STRSET: 1<<13, 
   CURVE: 1<<14, 
   STRUCT: 1<<19, 
   DATAREF: 1<<20, 
   DATAREFLIST: 1<<21, 
   TRANSFORM: 1<<22, 
   COLLECTION: 1<<23, 
   IMAGE: 1<<24, 
   ARRAYBUFFER: 1<<25, 
   ITER: 1<<28, 
   INTARRAY: 1<<29}
  PropTypes = _es6_module.add_export('PropTypes', PropTypes);
  setPropTypes(PropTypes);
  var TPropFlags={PRIVATE: 2, 
   LABEL: 4, 
   COLL_LOOSE_TYPE: 8, 
   USE_UNDO: 16, 
   UNDO_SIMPLE: 32, 
   USE_ICONS: 64, 
   USE_CUSTOM_GETSET: 128, 
   NEEDS_OWNING_OBJECT: 256}
  TPropFlags = _es6_module.add_export('TPropFlags', TPropFlags);
  const PropSubTypes={COLOR: 1}
  _es6_module.add_export('PropSubTypes', PropSubTypes);
  ToolProperty.prototype.set_data = function (d) {
    console.warn("deprectaed ToolProperty.prototype.set_data called!");
    return this.setValue(d);
  }
  ToolProperty.prototype.get_data = function (d) {
    console.warn("deprectaed ToolProperty.prototype.get_data called!");
    return this.getValue();
  }
  ToolProperty.prototype.get_value = function (d) {
    console.warn("deprectaed ToolProperty.prototype.get_value called!");
    return this.getValue();
  }
  ToolProperty.prototype.report = function () {
    let s="";
    for (let a of arguments) {
        s+=a+" ";
    }
    if (typeof g_app_state==="undefined"||!g_app_state.notes) {
        console.warn(...arguments);
        return ;
    }
    g_app_state.notes.label(s);
  }
  ToolProperty.prototype._fire = function () {
    if (this.update) {
        this.update(this.dataref);
    }
    if (this.api_update) {
        this.api_update(this.dataref);
    }
  }
  ToolProperty.prototype.load_ui_data = function (prop) {
    this.uiname = prop.uiname;
    this.apiname = prop.apiname;
    this.description = prop.description;
    this.unit = prop.unit;
    this.hotkey_ref = prop.hotkey_ref;
    this.range = prop.range;
    this.uiRange = prop.uiRange;
    this.icon = prop.icon;
    this.radix = prop.radix;
    this.decimalPlaces = prop.declarations;
    this.step = prop.step;
    this.stepIsRelative = prop.stepIsRelative;
    this.expRate = prop.expRate;
  }
  ToolProperty.prototype._exec_listeners = function (data_api_owner) {
    for (var l of this.callbacks) {
        if (RELEASE) {
            try {
              l[1](l[0], this, data_api_owner);
            }
            catch (_err) {
                print_stack(_err);
                console.log("Warning: a property event listener failed", "property:", this, "callback:", l[1], "owner:", l[0]);
            }
        }
        else {
          l[1](l[0], this, data_api_owner);
        }
    }
  }
  ToolProperty.prototype.add_listener = function add_listener(owner, callback) {
    let cb=() =>      {
      callback(...arguments);
    }
    for (let cb of this.callbacks['change']) {
        if (cb.owner===owner) {
            console.warn("owner already added a callback");
            return ;
        }
    }
    this.on('change', cb);
    cb.owner = owner;
  }
  ToolProperty.prototype.remove_listener = function (owner, silent_fail) {
    if (silent_fail===undefined) {
        silent_fail = false;
    }
    for (let cb of this.callbacks['change']) {
        if (cb.owner===owner) {
            this.off('change', cb);
        }
    }
  }
  FlagProperty.prototype.addIcons = function (iconmap) {
    this.iconmap = {}
    for (let k in iconmap) {
        this.iconmap[k] = iconmap[k];
        if (k in this.values) {
            this.iconmap[this.values[k]] = iconmap[k];
        }
    }
  }
  ToolProperty.prototype.add_icons = function (iconmap) {
    return this.addIcons(iconmap);
  }
  ToolProperty.prototype.userSetData = function (prop, val) {
    return val;
  }
  ToolProperty.prototype.userGetData = function (prop, val) {
    return val;
  }
  let _copyTo=ToolProperty.prototype.copyTo;
  ToolProperty.prototype.copyTo = function (b) {
    _copyTo.call(this, b);
    b.userSetData = this.userSetData;
    b.userGetData = this.userGetData;
    return this;
  }
  ToolProperty.prototype.update = () =>    {  }
  ToolProperty.prototype.api_update = () =>    {  }
  for (let i=0; i<2; i++) {
      let key=i ? "FlagProperty" : "EnumProperty";
      toolprop[key].prototype.setUINames = function (uinames) {
        this.ui_value_names = {}
        this.ui_key_names = {}
        for (let k in this.keys) {
            let key=k[0].toUpperCase()+k.slice(1, k.length).toLowerCase();
            key = key.replace(/_/g, " ").replace(/-/g, " ");
            this.ui_value_names[key] = k;
            this.ui_key_names[k] = key;
        }
      };
      Object.defineProperty(toolprop[key].prototype, "ui_key_names", {get: function get() {
          if (!Object.hasOwnProperty(this, "_ui_key_names")) {
              this._ui_key_names = {};
              for (let k in this.ui_value_names) {
                  this._ui_key_names[this.ui_value_names[k]] = k;
              }
          }
          return this._ui_key_names;
        }, 
     set: function set(val) {
          this._ui_key_names = val;
        }});
  }
  function isTypedArray(n) {
    if (!n||typeof n!=="object") {
        return false;
    }
    return (__instance_of(n, Int8Array)||__instance_of(n, Uint8Array)||__instance_of(n, Uint8ClampedArray)||__instance_of(n, Int16Array)||__instance_of(n, Uint16Array)||__instance_of(n, Int32Array)||__instance_of(n, Uint32Array)||__instance_of(n, Float32Array)||__instance_of(n, Float64Array));
  }
  class ArrayBufferProperty extends ToolProperty {
     constructor(data, apiname="", uiname=apiname, description="", flag=0) {
      super(PropTypes.ARRAYBUFFER, apiname, uiname, description, flag);
      if (data!==undefined) {
          this.setValue(data);
      }
    }
     setValue(d) {
      if (d.constructor.name==="ArrayBuffer") {
          d = new Uint8Array(d, 0, d.byteLength);
      }
      else 
        if (isTypedArray(d)) {
          d = d.buffer;
          d = new Uint8Array(d, 0, d.byteLength);
      }
      else 
        if (Array.isArray(d)) {
          d = new Uint8Array(d);
      }
      this.data = d;
    }
     getValue() {
      return this.data;
    }
     copyTo(dst) {
      super.copyTo(dst, false);
      if (this.data!=undefined)
        dst.setValue(this.data);
      return dst;
    }
     copy() {
      return this.copyTo(new ArrayBufferProperty());
    }
     _getDataU8() {
      return __instance_of(this.data, ArrayBuffer) ? new Uint8Array(this.data) : this.data;
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.data = new Uint8Array(this.data).buffer;
    }
  }
  _ESClass.register(ArrayBufferProperty);
  _es6_module.add_class(ArrayBufferProperty);
  ArrayBufferProperty = _es6_module.add_export('ArrayBufferProperty', ArrayBufferProperty);
  ArrayBufferProperty.STRUCT = nstructjs.inherit(ArrayBufferProperty, ToolProperty)+`
  data : array(byte) | this._getDataU8;
}`;
  nstructjs.register(ArrayBufferProperty);
  ToolProperty.register(ArrayBufferProperty);
  class IntArrayProperty extends ToolProperty {
     constructor(data, apiname, uiname, description, flag) {
      super(PropTypes.INTARRAY, undefined, apiname, uiname, description, flag);
      this.data = [];
      if (data) {
          for (let item of data) {
              this.data.push(item);
          }
      }
    }
     [Symbol.iterator]() {
      return this.data[Symbol.iterator]();
    }
     getValue() {
      return this.data;
    }
     setValue(array) {
      let data=this.data;
      super.setValue(array);
      this.data = data;
      this.data.length = 0;
      for (let item of array) {
          let old=item;
          item = ~~item;
          if (isNaN(item)) {
              console.warn("NaN warning! bad item", old, "!");
              continue;
          }
          this.data.push(item);
      }
      return this;
    }
     copyTo(b) {
      super.copyTo(b);
      b.data = this.data.concat([]);
    }
     copy() {
      let ret=new IntArrayProperty();
      this.copyTo(ret);
      return ret;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(IntArrayProperty);
  _es6_module.add_class(IntArrayProperty);
  IntArrayProperty = _es6_module.add_export('IntArrayProperty', IntArrayProperty);
  IntArrayProperty.STRUCT = nstructjs.inherit(IntArrayProperty, ToolProperty)+`
  data : array(int);
}`;
  class DataRefProperty extends ToolProperty {
    
     constructor(value, allowed_types, apiname, uiname, description, flag) {
      super(PropTypes.DATAREF, apiname, uiname, description, flag);
      if (allowed_types==undefined)
        allowed_types = new set();
      if (!(__instance_of(allowed_types, set))) {
          if (__instance_of(allowed_types, Array))
            allowed_types = new set(allowed_types);
          else 
            allowed_types = new set([allowed_types]);
      }
      this.types = new set();
      for (var val of allowed_types) {
          if (typeof val=="object") {
              val = new val().lib_type;
          }
          this.types.add(val);
      }
      if (value!=undefined)
        this.setValue(value);
    }
     get_block(ctx) {
      if (this.data==undefined)
        return undefined;
      else 
        return ctx.datalib.get(this.data);
    }
     copyTo(dst) {
      super.copyTo(dst, false);
      var data=this.data;
      if (data!=undefined)
        data = data.copy();
      dst.types = new set(this.types);
      if (data!=undefined)
        dst.setValue(data);
      return dst;
    }
     copy() {
      return this.copyTo(new DataRefProperty());
    }
     set_data(value, owner, changed, set_data) {
      if (value==undefined) {
          ToolProperty.prototype.setValue.call(this, undefined, owner, changed, set_data);
      }
      else 
        if (!(__instance_of(value, DataRef))) {
          if (!this.types.has(value.lib_type)) {
              console.trace("Invalid datablock type "+value.lib_type+" passed to DataRefProperty.set_value()");
              return ;
          }
          value = new DataRef(value);
          ToolProperty.prototype.setValue.call(this, value, owner, changed, set_data);
      }
      else {
        ToolProperty.prototype.setValue.call(this, value, owner, changed, set_data);
      }
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.types = new set(this.types);
      if (this.data!==undefined&&this.data.id<0)
        this.data = undefined;
      this.setValue(this.data);
    }
  }
  _ESClass.register(DataRefProperty);
  _es6_module.add_class(DataRefProperty);
  DataRefProperty = _es6_module.add_export('DataRefProperty', DataRefProperty);
  DataRefProperty.STRUCT = STRUCT.inherit(DataRefProperty, ToolProperty)+`
  data  : DataRef | this.data == undefined ? new DataRef(-1) : this.data;
  types : iter(int);
}`;
  
  nstructjs.register(DataRefProperty);
  ToolProperty.register(DataRefProperty);
  class RefListProperty extends ToolProperty {
     constructor(value, allowed_types, apiname, uiname, description, flag) {
      super(PropTypes.DATAREFLIST, apiname, uiname, description, flag);
      if (allowed_types===undefined)
        allowed_types = [];
      if (!(__instance_of(allowed_types, set))) {
          allowed_types = new set([allowed_types]);
      }
      this.types = allowed_types;
      if (value!==undefined) {
          this.setValue(value);
      }
    }
     copyTo(dst) {
      ToolProperty.prototype.copyTo.call(this, dst, false);
      dst.types = new set(this.types);
      if (this.data!=undefined)
        dst.setValue(this.data);
      return dst;
    }
     copy() {
      return this.copyTo(new RefListProperty());
    }
     set_data(value, owner, changed, set_data) {
      if (value!=undefined&&value.constructor.name=="Array")
        value = new GArray(value);
      if (value==undefined) {
          ToolProperty.prototype.setValue.call(this, undefined, owner, changed, set_data);
      }
      else {
        var lst=new DataRefList();
        for (var i=0; i<value.length; i++) {
            var block=value[i];
            if (block==undefined||!this.types.has(block.lib_type)) {
                console.trace();
                if (block==undefined)
                  console.log("Undefined datablock in list passed to RefListProperty.setValue");
                else 
                  console.log("Invalid datablock type "+block.lib_type+" passed to RefListProperty.set_value()");
                continue;
            }
            lst.push(block);
        }
        value = lst;
        super.setValue(this, value, owner, changed, set_data);
      }
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.types = new set(this.types);
      this.setValue(this.data);
    }
  }
  _ESClass.register(RefListProperty);
  _es6_module.add_class(RefListProperty);
  RefListProperty = _es6_module.add_export('RefListProperty', RefListProperty);
  RefListProperty.STRUCT = nstructjs.inherit(RefListProperty, ToolProperty)+`
  data  : iter(dataref);
  types : iter(int);
}
`;
  nstructjs.register(RefListProperty);
  ToolProperty.register(RefListProperty);
  class TransformProperty extends ToolProperty {
     constructor(value, apiname, uiname, description, flag) {
      super(PropTypes.TRANSFORM, apiname, uiname, description, flag);
      if (value!==undefined)
        ToolProperty.prototype.setValue.call(this, new Matrix4UI(value));
    }
     set_data(data, owner, changed, set_data) {
      this.data.load(data);
      ToolProperty.prototype.setValue.call(this, undefined, owner, changed, false);
    }
     copyTo(dst) {
      ToolProperty.prototype.copyTo.call(this, dst, false);
      dst.data = new Matrix4UI(new Matrix4());
      dst.data.load(this.data);
      return dst;
    }
     copy() {
      return this.copyTo(new TransformProperty());
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.data = new Matrix4UI(this.data);
    }
  }
  _ESClass.register(TransformProperty);
  _es6_module.add_class(TransformProperty);
  TransformProperty = _es6_module.add_export('TransformProperty', TransformProperty);
  TransformProperty.STRUCT = STRUCT.inherit(TransformProperty, ToolProperty)+`
  data : mat4;
}`;
  nstructjs.register(TransformProperty);
  ToolProperty.register(TransformProperty);
  var ToolIter=es6_import_item(_es6_module, './toolprops_iter.js', 'ToolIter');
  class type_filter_iter extends ToolIter {
    
     constructor(iter, typefilter, ctx) {
      super(iter);
      this.types = typefilter;
      this.ret = {done: false, 
     value: undefined};
      this.iter = iter;
      this._ctx = ctx;
    }
    set  ctx(ctx) {
      this._ctx = ctx;
      if (this.iter!==undefined)
        this.iter.ctx = ctx;
    }
    get  ctx() {
      return this._ctx;
    }
     reset() {
      this.iter.ctx = this.ctx;
      this.iter.reset();
    }
     next() {
      var ret=this.iter.next();
      var types=this.types;
      var tlen=this.types.length;
      var this2=this;
      function has_type(obj) {
        for (let i=0; i<tlen; i++) {
            if (__instance_of(obj, types[i]))
              return true;
        }
        return false;
      }
      while (!ret.done&&!has_type(ret.value)) {
        ret = this.iter.next();
      }
      this.ret.done = ret.done;
      this.ret.value = ret.value;
      ret = this.ret;
      if (ret.done&&this.iter.reset) {
          this.iter.reset();
      }
      return ret;
    }
  }
  _ESClass.register(type_filter_iter);
  _es6_module.add_class(type_filter_iter);
  type_filter_iter = _es6_module.add_export('type_filter_iter', type_filter_iter);
  class CollectionProperty extends ToolProperty {
     constructor(data, filter_types, apiname, uiname, description, flag) {
      super(PropTypes.COLLECTION, apiname, uiname, description, flag);
      this.flag|=TPropFlags.COLL_LOOSE_TYPE;
      this.types = filter_types;
      this._data = undefined;
      this._ctx = undefined;
      if (data!==undefined) {
          this.setValue(data);
      }
    }
     copyTo(dst) {
      ToolProperty.prototype.copyTo.call(this, dst, false);
      dst.types = this.types;
      this.setValue(this.data);
      return dst;
    }
     copy() {
      var ret=this.copyTo(new CollectionProperty());
      ret.types = this.types;
      ret._ctx = this._ctx;
      if (this._data!==undefined&&this._data.copy!==undefined)
        ret.setValue(this._data.copy());
      return ret;
    }
    get  ctx() {
      return this._ctx;
    }
    set  ctx(data) {
      this._ctx = data;
      if (this._data!==undefined)
        this._data.ctx = data;
    }
     getValue() {
      return this.data;
    }
     set_data(data, owner, changed) {
      this.setValue(data, owner, changed);
    }
     setValue(data, owner, changed) {
      if (data===undefined) {
          this._data = undefined;
          return ;
      }
      if ("__tooliter__" in data&&typeof data.__tooliter__=="function") {
          this.setValue(data.__tooliter__(), owner, changed);
          return ;
      }
      else 
        if (!(this.flag&TPropFlags.COLL_LOOSE_TYPE)&&!(TPropIterable.isTPropIterable(data))) {
          console.trace();
          console.log("ERROR: bad data '", data, "' was passed to CollectionProperty.setValue!");
          throw new Error("ERROR: bad data '", data, "' was passed to CollectionProperty.setValue!");
      }
      this._data = data;
      this._data.ctx = this.ctx;
      ToolProperty.prototype.setValue.call(this, undefined, owner, changed, false);
    }
    set  data(data) {
      this.setValue(data);
    }
    get  data() {
      return this._data;
    }
     [Symbol.iterator]() {
      if (this._data==undefined)
        return {next: function () {
          return {done: true, 
       value: undefined}
        }}
      this._data.ctx = this._ctx;
      if (this.types!=undefined&&this.types.length>0)
        return new type_filter_iter(this.data[Symbol.iterator](), this.types, this._ctx);
      else 
        return this.data[Symbol.iterator]();
    }
    static  fromSTRUCT(reader) {
      var ret=new CollectionProperty();
      reader(ret);
      return ret;
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
    }
  }
  _ESClass.register(CollectionProperty);
  _es6_module.add_class(CollectionProperty);
  CollectionProperty = _es6_module.add_export('CollectionProperty', CollectionProperty);
  CollectionProperty.STRUCT = nstructjs.inherit(CollectionProperty, ToolProperty)+`
  data : abstract(Object) | obj.data == undefined ? new BlankArray() : obj.data;
}`;
  nstructjs.register(CollectionProperty);
  ToolProperty.register(CollectionProperty);
  class BlankArray  {
    static  fromSTRUCT(reader) {
      return undefined;
    }
  }
  _ESClass.register(BlankArray);
  _es6_module.add_class(BlankArray);
  BlankArray = _es6_module.add_export('BlankArray', BlankArray);
  BlankArray.STRUCT = `
  BlankArray {
  length : int | 0;
}`;
  nstructjs.register(BlankArray);
  window.BlankArray = BlankArray;
}, '/dev/fairmotion/src/core/toolprops.js');
es6_module_define('toolprops_iter', ["./struct.js"], function _toolprops_iter_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
  class TPropIterable  {
     constructor() {

    }
     [Symbol.iterator]() {

    }
     _is_tprop_iterable() {

    }
    static  isTPropIterable(obj) {
      return obj!=undefined&&"_is_tprop_iterable" in obj;
    }
  }
  _ESClass.register(TPropIterable);
  _es6_module.add_class(TPropIterable);
  TPropIterable = _es6_module.add_export('TPropIterable', TPropIterable);
  window.TPropIterable = TPropIterable;
  class TCanSafeIter  {
     constructor() {

    }
     __tooliter__() {

    }
  }
  _ESClass.register(TCanSafeIter);
  _es6_module.add_class(TCanSafeIter);
  TCanSafeIter = _es6_module.add_export('TCanSafeIter', TCanSafeIter);
  window.TCanSafeIter = TCanSafeIter;
  class ToolIter extends TPropIterable {
    
     constructor(itemtypes=[]) {
      super();
      this.itemtypes = itemtypes;
      this.ctx = undefined;
      this.ret = {done: true, 
     value: undefined};
    }
     next() {

    }
     reset() {

    }
     spawn() {

    }
     _get_block(ref) {
      if (this.ctx!=undefined) {
          if (ref.lib_id==this.ctx.object.lib_id)
            return this.ctx.object;
          else 
            return this.ctx.datalib.get(ref);
      }
    }
     [Symbol.iterator]() {
      return this;
    }
    static  fromSTRUCT(reader) {
      var obj=new ToolIter();
      reader(obj);
      return obj;
    }
  }
  _ESClass.register(ToolIter);
  _es6_module.add_class(ToolIter);
  ToolIter = _es6_module.add_export('ToolIter', ToolIter);
  ToolIter.STRUCT = `
  ToolIter {
  }
`;
  class MSelectIter extends ToolIter {
    
    
     constructor(typemask, mesh) {
      super();
      this.meshref = new DataRef(mesh);
      this.mask = typemask;
      this.mesh = undefined;
      this.init = true;
      this.iter = undefined;
    }
     [Symbol.iterator]() {
      if (this.init) {
          return this;
      }
      else {
        return new MSelectIter(this.mask, this.meshref);
      }
    }
     reset() {
      this.init = true;
      this.mesh = undefined;
      this.iter = undefined;
    }
     next() {
      if (this.init) {
          this.mesh = this._get_block(this.meshref);
          this.init = false;
          this.iter = new selectiter(this.mesh, this.mask);
      }
      var ret=this.iter.next();
      if (ret.done) {
          this.reset();
      }
      return ret;
    }
    static  fromSTRUCT(reader) {
      var ob={};
      reader(ob);
      var ret=new MSelectIter(ob.mask, ob.meshref);
      return ret;
    }
  }
  _ESClass.register(MSelectIter);
  _es6_module.add_class(MSelectIter);
  MSelectIter.STRUCT = STRUCT.inherit(MSelectIter, ToolIter)+`
  meshref  : DataRef;
  mask     : int;
}
`;
  var $map_hILl_fromSTRUCT;
  class element_iter_convert extends ToolIter {
    
     constructor(iter, type) {
      super();
      if (!(__instance_of(iter, TPropIterable))) {
          throw new Error("element_iter_convert requires a 'safe' TPropIterable-derived iterator");
      }
      this.vset = new set();
      this.iter = iter[Symbol.iterator]();
      this.subiter = undefined;
      if (type==MeshTypes.VERT)
        this.type = Vertex;
      else 
        if (type==MeshTypes.EDGE)
        this.type = Edge;
      else 
        if (type==MeshTypes.LOOP)
        this.type = Loop;
      else 
        if (type==MeshTypes.FACE)
        this.type = Face;
    }
     reset() {
      if (this.iter.reset!=undefined)
        this.iter.reset();
      this.vset = new set();
      this.iter.ctx = this.ctx;
    }
     [Symbol.iterator]() {
      return this;
    }
     next() {
      if (this.mesh!=undefined)
        this.iter.mesh = this.mesh;
      var v=this._next();
      if (v.done)
        return v;
      var vset=this.vset;
      while ((!v.done)&&(v.value==undefined||vset.has(v.value))) {
        v = this._next();
      }
      if (!v.done)
        vset.add(v.value);
      return v;
    }
     _next() {
      if (this.subiter==undefined) {
          var next=this.iter.next();
          if (next.done) {
              this.reset();
              return next;
          }
          if (next.value.constructor.name==this.type.name)
            return next;
          this.subiter = next.value.verts[Symbol.iterator]();
      }
      var vset=this.vset;
      var v=this.subiter.next();
      if (v.done) {
          this.subiter = undefined;
          return this._next();
      }
      return v;
    }
    static  fromSTRUCT(reader) {
      var ob={};
      reader(ob);
      var type=$map_hILl_fromSTRUCT[ob.type];
      var ret=new element_iter_convert(ob._iter, type);
    }
  }
  var $map_hILl_fromSTRUCT={Vertex: 1, 
   Edge: 2, 
   Loop: 4, 
   Face: 8}
  _ESClass.register(element_iter_convert);
  _es6_module.add_class(element_iter_convert);
  element_iter_convert.STRUCT = STRUCT.inherit(element_iter_convert, ToolIter)+`
  type  : string | this.type != undefined ? this.type.constructor.name : "";
  _iter : abstract(ToolIter) | obj.iter;
}
`;
}, '/dev/fairmotion/src/core/toolprops_iter.js');
es6_module_define('toolops_api', ["../editors/events.js", "../path.ux/scripts/toolsys/simple_toolsys.js", "../path.ux/scripts/util/simple_events.js", "./toolprops.js", "./struct.js"], function _toolops_api_module(_es6_module) {
  "use strict";
  var PropTypes=es6_import_item(_es6_module, './toolprops.js', 'PropTypes');
  var TPropFlags=es6_import_item(_es6_module, './toolprops.js', 'TPropFlags');
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
  var EventHandler=es6_import_item(_es6_module, '../editors/events.js', 'EventHandler');
  var charmap=es6_import_item(_es6_module, '../editors/events.js', 'charmap');
  class ToolDef  {
    
    
    
    
    
    
    
    
    
  }
  _ESClass.register(ToolDef);
  _es6_module.add_class(ToolDef);
  ToolDef = _es6_module.add_export('ToolDef', ToolDef);
  function patchMouseEvent(e, dom) {
    dom = g_app_state.screen;
    let e2={prototype: e}
    let keys=Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e));
    for (let k in e) {
        keys.push(k);
    }
    for (let k of keys) {
        try {
          e2[k] = e[k];
        }
        catch (error) {
            console.log("failed to set property", k);
            continue;
        }
        if (typeof e2[k]=="function") {
            e2[k] = e2[k].bind(e);
        }
    }
    e2.original = e;
    return e2;
  }
  patchMouseEvent = _es6_module.add_export('patchMouseEvent', patchMouseEvent);
  var pushModalLight=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'popModalLight');
  var UndoFlags={IGNORE_UNDO: 2, 
   IS_ROOT_OPERATOR: 4, 
   UNDO_BARRIER: 8, 
   HAS_UNDO_DATA: 16}
  UndoFlags = _es6_module.add_export('UndoFlags', UndoFlags);
  var ToolFlags={HIDE_TITLE_IN_LAST_BUTTONS: 1, 
   USE_PARTIAL_UNDO: 2, 
   USE_DEFAULT_INPUT: 4, 
   USE_REPEAT_FUNCTION: 8, 
   USE_TOOL_CONTEXT: 16}
  ToolFlags = _es6_module.add_export('ToolFlags', ToolFlags);
  var ModalStates={TRANSFORMING: 1, 
   PLAYING: 2}
  ModalStates = _es6_module.add_export('ModalStates', ModalStates);
  var _tool_op_idgen=1;
  class InheritFlag  {
     constructor(val) {
      this.val = val;
    }
  }
  _ESClass.register(InheritFlag);
  _es6_module.add_class(InheritFlag);
  
  class ToolOpAbstract  {
    static  inherit(inputs_or_outputs) {
      return new InheritFlag(inputs_or_outputs);
    }
    static  invokeMultiple(ctx, args) {

    }
    static  _get_slots() {
      var ret=[{}, {}];
      var parent=this.__parent__;
      if (this.tooldef!==undefined&&(parent===undefined||this.tooldef!==parent.tooldef)) {
          var tooldef=this.tooldef();
          for (var k in tooldef) {
              if (k!=="inputs"&&k!=="outputs") {
                  continue;
              }
              var v=tooldef[k];
              if (__instance_of(v, InheritFlag)) {
                  v = v.val===undefined ? {} : v.val;
                  var slots=parent._get_slots();
                  slots = k==="inputs" ? slots[0] : slots[1];
                  v = this._inherit_slots(slots, v);
              }
              ret[k==="inputs" ? 0 : 1] = v;
          }
      }
      else 
        if (this.inputs!==undefined||this.outputs!==undefined) {
          console.trace("Deprecation warning: (second) old form\
                     of toolprop definition detected for", this);
          if (this.inputs!==undefined) {
              ret[0] = this.inputs;
          }
          if (this.outputs!==undefined) {
              ret[1] = this.outputs;
          }
      }
      else {
        console.warn("Deprecation warning: oldest (and evilest) form\
                     of toolprop detected for", this);
      }
      return ret;
    }
     constructor(apiname, uiname, description=undefined, icon=-1) {
      var parent=this.constructor.__parent__;
      var slots=this.constructor._get_slots();
      for (var i=0; i<2; i++) {
          var slots2={};
          if (i===0)
            this.inputs = slots2;
          else 
            this.outputs = slots2;
          for (var k in slots[i]) {
              slots2[k] = slots[i][k].copy();
              slots2[k].apiname = k;
          }
      }
      if (this.constructor.tooldef!==undefined&&(parent===undefined||this.constructor.tooldef!==parent.tooldef)) {
          var tooldef=this.constructor.tooldef();
          for (var k in tooldef) {
              if (k==="inputs"||k==="outputs")
                continue;
              this[k] = tooldef[k];
          }
      }
      else {
        if (this.name===undefined)
          this.name = apiname;
        if (this.uiname===undefined)
          this.uiname = uiname;
        if (this.description===undefined)
          this.description = description===undefined ? "" : description;
        if (this.icon===undefined)
          this.icon = icon;
      }
      this.apistruct = undefined;
      this.op_id = _tool_op_idgen++;
      this.stack_index = -1;
    }
    static  _inherit_slots(old, newslots) {
      if (old===undefined) {
          console.trace("Warning: old was undefined in _inherit_slots()!");
          return newslots;
      }
      for (var k in old) {
          if (!(k in newslots))
            newslots[k] = old[k];
      }
      return newslots;
    }
    static  inherit_inputs(cls, newslots) {
      if (cls.inputs===undefined)
        return newslots;
      return ToolOpAbstract._inherit_slots(cls.inputs, newslots);
    }
    static  invoke(ctx, args) {
      let ret=new this();
      for (let k in args) {
          if (k in ret.inputs) {
              ret.inputs[k].setValue(args[k]);
          }
          else {
            console.warn("Unknown tool argument "+k, ret);
          }
      }
      return ret;
    }
    static  inherit_outputs(cls, newslots) {
      if (cls.outputs===undefined)
        return newslots;
      return ToolOpAbstract._inherit_slots(cls.outputs, newslots);
    }
     get_saved_context() {
      if (this.saved_context===undefined) {
          console.log("warning : invalid saved_context in "+this.constructor.name+".get_saved_context()");
          this.saved_context = new SavedContext(new Context());
      }
      return this.saved_context;
    }
     [Symbol.keystr]() {
      return "TO"+this.op_id;
    }
     exec(tctx) {

    }
     default_inputs(ctx, get_default) {

    }
  }
  _ESClass.register(ToolOpAbstract);
  _es6_module.add_class(ToolOpAbstract);
  ToolOpAbstract = _es6_module.add_export('ToolOpAbstract', ToolOpAbstract);
  ToolOpAbstract.STRUCT = `
  ToolOpAbstract {
      flag    : int;
      saved_context  : SavedContext | obj.get_saved_context();
      inputs  : iterkeys(k, PropPair) | new PropPair(k, obj.inputs[k]);
      outputs : iterkeys(k, PropPair) | new PropPair(k, obj.outputs[k]);
  }
`;
  class PropPair  {
     constructor(key, value) {
      this.key = key;
      this.value = value;
    }
    static  fromSTRUCT(reader) {
      var obj={};
      reader(obj);
      return obj;
    }
  }
  _ESClass.register(PropPair);
  _es6_module.add_class(PropPair);
  PropPair = _es6_module.add_export('PropPair', PropPair);
  window.PropPair = PropPair;
  PropPair.STRUCT = `
  PropPair {
    key   : string;
    value : abstract(ToolProperty);
  }
`;
  let _toolop_tools=undefined;
  var toolsys=es6_import(_es6_module, '../path.ux/scripts/toolsys/simple_toolsys.js');
  toolsys.ToolOp.prototype.undo_pre = function (ctx) {
    return this.undoPre(ctx);
  }
  toolsys.ToolOp.prototype.exec_pre = function (ctx) {
    return this.execPre(ctx);
  }
  toolsys.ToolOp.prototype.exec_post = function (ctx) {
    return this.execPost(ctx);
  }
  toolsys.ToolOp.prototype._start_modal = function (ctx) {
  }
  toolsys.ToolOp.prototype.start_modal = function (ctx) {
    return this.modalStart(ctx);
  }
  toolsys.ToolOp.prototype.redo_post = function (ctx) {
  }
  toolsys.ToolOp.prototype.undo_post = function (ctx) {
  }
  toolsys.ToolOp.prototype.end_modal = function (ctx) {
    return this.modalEnd(false);
  }
  class ToolOp extends ToolOpAbstract {
    
    
    
    
    
     constructor(apiname="(undefined)", uiname="(undefined)", description=undefined, icon=-1) {
      super(apiname, uiname, description, icon);
      EventHandler.prototype.EventHandler_init.call(this);
      this.drawlines = new GArray();
      if (this.is_modal===undefined)
        this.is_modal = false;
      this.undoflag = 0;
      this.on_modal_end = undefined;
      this.modal_ctx = null;
      this.flag = 0;
      this.keyhandler = undefined;
      this.parent = undefined;
      this.widgets = [];
      this.modal_running = false;
      this._widget_on_tick = undefined;
    }
     modalEnd() {
      return this.end_modal(...arguments);
    }
     new_drawline(v1, v2, color, line_width) {
      var dl=this.modal_ctx.view2d.make_drawline(v1, v2, undefined, color, line_width);
      this.drawlines.push(dl);
      return dl;
    }
    static  canRun(ctx) {
      return true;
    }
     reset_drawlines(ctx=this.modal_ctx) {
      var view2d=ctx.view2d;
      for (var dl of this.drawlines) {
          view2d.kill_drawline(dl);
      }
      this.drawlines.reset();
    }
    static  create_widgets(manager, ctx) {

    }
    static  reset_widgets(op, ctx) {

    }
     undo_ignore() {
      this.undoflag|=UndoFlags.IGNORE_UNDO;
    }
     on_mousemove() {
      redraw_viewport();
    }
     exec_pre(tctx) {
      for (var k in this.inputs) {
          if (this.inputs[k].type===PropTypes.COLLECTION) {
              this.inputs[k].ctx = tctx;
          }
      }
      for (var k in this.outputs) {
          if (this.outputs[k].type===PropTypes.COLLECTION) {
              this.outputs[k].ctx = tctx;
          }
      }
    }
     cancel_modal(ctx, execUndo) {
      console.log("cancel");
      ctx.toolstack.toolop_cancel(this, execUndo);
      if (this._modal_state) {
          this._end_modal();
      }
      window.redraw_viewport();
    }
     touchCancelable(callback) {
      this._touch_cancelable = true;
      this._touch_cancel_callback = callback;
    }
     modalStart(ctx) {

    }
     start_modal() {
      this.modalStart(ctx);
    }
     _start_modal(ctx) {
      this.modal_running = true;
      let active_area=ctx.active_area;
      let patch=(e) =>        {
        return patchMouseEvent(e);
      };
      let doMouse=(e, key) =>        {
        if (this._touch_cancelable&&e.touches&&e.touches.length>1) {
            this.cancel_modal(this.modal_ctx, true);
            if (this._touch_cancel_callback) {
                this._touch_cancel_callback(e);
            }
            return ;
        }
        e = patchMouseEvent(e);
        return this[key](e);
      };
      let handlers={on_mousedown: (e) =>          {
          return doMouse(e, "on_mousedown");
        }, 
     on_mousemove: (e) =>          {
          return doMouse(e, "on_mousemove");
        }, 
     on_mouseup: (e) =>          {
          return doMouse(e, "on_mouseup");
        }, 
     on_keydown: this.on_keydown.bind(this), 
     on_keyup: this.on_keyup.bind(this), 
     on_mousewheel: (e) =>          {
          return this.on_mousewheel(patchMouseEvent(e));
        }};
      this._modal_state = pushModalLight(handlers);
      this.modal_ctx = ctx;
    }
     on_mousewheel(e) {

    }
     _end_modal() {
      var ctx=this.modal_ctx;
      this.modal_running = false;
      this.saved_context = new SavedContext(this.modal_ctx);
      if (this._modal_state!==undefined) {
          popModalLight(this._modal_state);
          this._modal_state = undefined;
      }
      if (this.on_modal_end!==undefined)
        this.on_modal_end(this);
      this.reset_drawlines(ctx);
    }
     end_modal() {
      this._end_modal();
    }
     exec(ctx) {

    }
     start_modal(ctx) {

    }
     redo_post(ctx) {
      window.redraw_viewport();
    }
     undo_pre(ctx) {
      this._undocpy = g_app_state.create_undo_file();
      window.redraw_viewport();
    }
     undo(ctx) {
      g_app_state.load_undo_file(this._undocpy);
    }
    static  fromSTRUCT(reader) {
      var op=new ToolOp();
      reader(op);
      var ins={};
      for (var i=0; i<op.inputs.length; i++) {
          ins[op.inputs[i].key] = op.inputs[i].value;
      }
      var outs={};
      for (var i=0; i<op.outputs.length; i++) {
          outs[op.outputs[i].key] = op.outputs[i].value;
      }
      op.inputs = ins;
      op.outputs = outs;
      return op;
    }
    static  get_constructor(name) {
      if (_toolop_tools===undefined) {
          _toolop_tools = {};
          for (let c of defined_classes) {
              if (__instance_of(c, ToolOp))
                _toolop_tools[c.name] = c;
          }
      }
      return _toolop_tools[c];
    }
  }
  _ESClass.register(ToolOp);
  _es6_module.add_class(ToolOp);
  ToolOp = _es6_module.add_export('ToolOp', ToolOp);
  ToolOp.STRUCT = `
  ToolOp {
      flag    : int;
      saved_context  : SavedContext | obj.get_saved_context();
      inputs  : iterkeys(k, PropPair) | new PropPair(k, obj.inputs[k]);
      outputs : iterkeys(k, PropPair) | new PropPair(k, obj.outputs[k]);
  }
`;
  class ToolMacro extends ToolOp {
    
    
    
     constructor(name, uiname, tools) {
      super(name, uiname);
      this.cur_modal = 0;
      this._chained_on_modal_end = false;
      if (tools===undefined)
        this.tools = new GArray();
      else 
        this.tools = new GArray(tools);
    }
     add_tool(tool) {
      tool.parent = this;
      this.tools.push(tool);
      if (tool.is_modal)
        this.is_modal = true;
    }
     connect_tools(output, input) {
      var old_set=input.userSetData;
      input.userSetData = function () {
        this.data = output.data;
        old_set.call(this, this.data);
      };
    }
     undo_pre(ctx) {

    }
     undo(ctx) {
      for (var i=this.tools.length-1; i>=0; i--) {
          if (this.tools[i].undoflag&UndoFlags.HAS_UNDO_DATA) {
              this.tools[i].undo(ctx);
          }
      }
    }
     exec(ctx) {
      for (var i=0; i<this.tools.length; i++) {
          if (!(this.tools[i].flag&ToolFlags.USE_TOOL_CONTEXT)) {
              this.tools[i].saved_context = this.saved_context;
          }
      }
      for (let op of this.tools) {
          if (op.is_modal)
            op.is_modal = this.is_modal;
          let tctx=(op.flag&ToolFlags.USE_TOOL_CONTEXT) ? op.ctx : ctx;
          for (var k in op.inputs) {
              var p=op.inputs[k];
              if (p.userSetData!=undefined)
                p.userSetData.call(p, p.data);
          }
          
          if (!(op.flag&ToolFlags.USE_TOOL_CONTEXT)) {
              op.saved_context = this.saved_context;
          }
          op.undo_pre(tctx);
          op.undoflag|=UndoFlags.HAS_UNDO_DATA;
          op.exec_pre(tctx);
          op.exec(tctx);
      }
    }
     error(msg) {
      console.error(msg);
      g_app_state.ctx.error(msg);
    }
     _start_modal(ctx) {

    }
     start_modal(ctx) {
      if (!this._chained_on_modal_end) {
          let last_modal=undefined;
          for (let op of this.tools) {
              if (op.is_modal)
                last_modal = op;
          }
          console.log("last_modal", last_modal);
          if (last_modal!==undefined) {
              let on_modal_end=last_modal.on_modal_end;
              let this2=this;
              last_modal.on_modal_end = function (toolop) {
                if (on_modal_end!==undefined)
                  on_modal_end(toolop);
                if (this2.on_modal_end)
                  this2.on_modal_end(this2);
              };
              this._chained_on_modal_end = true;
          }
      }
      for (let i=0; i<this.tools.length; i++) {
          this.tools[i].saved_context = this.saved_context;
      }
      for (let i=0; i<this.tools.length; i++) {
          let op=this.tools[i];
          if (op.is_modal) {
              this.cur_modal = i;
              for (let k in op.inputs) {
                  let p=op.inputs[k];
                  if (p.userSetData!==undefined)
                    p.userSetData.call(p, p.data);
              }
              op.__end_modal = op._end_modal;
              op._end_modal = (ctx) =>                {
                op.__end_modal(ctx);
                this.next_modal(ctx ? ctx : this.modal_ctx);
              };
              op.modal_ctx = this.modal_ctx;
              op.modal_tctx = this.modal_tctx;
              op.saved_context = this.saved_context;
              op.undo_pre(ctx);
              op.undoflag|=UndoFlags.HAS_UNDO_DATA;
              op.modal_running = true;
              op._start_modal(ctx);
              return op.start_modal(ctx);
          }
          else {
            for (let k in op.inputs) {
                let p=op.inputs[k];
                if (p.userSetData!==undefined)
                  p.userSetData(p, p.data);
            }
            op.saved_context = this.saved_context;
            op.exec_pre(ctx);
            op.undo_pre(ctx);
            op.undoflag|=UndoFlags.HAS_UNDO_DATA;
            op.exec(ctx);
          }
      }
    }
     _end_modal() {
      this.next_modal(this.modal_ctx);
    }
     next_modal(ctx) {
      console.log("next_modal called");
      this.cur_modal++;
      while (this.cur_modal<this.tools.length&&!this.tools[this.cur_modal].is_modal) {
        this.cur_modal++;
      }
      if (this.cur_modal>=this.tools.length) {
          super._end_modal();
      }
      else {
        console.log("next_modal op", this.tools[this.cur_modal]);
        this.tools[this.cur_modal].undo_pre(ctx);
        this.tools[this.cur_modal].undoflag|=UndoFlags.HAS_UNDO_DATA;
        this.tools[this.cur_modal]._start_modal(ctx);
        this.tools[this.cur_modal].start_modal(ctx);
      }
    }
     on_mousemove(event) {
      this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
      this.tools[this.cur_modal].on_mousemove(event);
    }
     on_mousewheel(event) {
      this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
      this.tools[this.cur_modal].on_mousewheel(event);
    }
     on_mousedown(event) {
      this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
      this.tools[this.cur_modal].on_mousedown(event);
    }
     on_mouseup(event) {
      this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
      this.tools[this.cur_modal].on_mouseup(event);
    }
     on_keydown(event) {
      this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
      this.tools[this.cur_modal].on_keydown(event);
    }
     on_keyup(event) {
      this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
      this.tools[this.cur_modal].on_keyup(event);
    }
     on_draw(event) {
      this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
      this.tools[this.cur_modal].on_draw(event);
    }
    static  fromSTRUCT(reader) {
      var ret=STRUCT.chain_fromSTRUCT(ToolMacro, reader);
      ret.tools = new GArray(ret.tools);
      for (var t of ret.tools) {
          t.parent = this;
      }
      return ret;
    }
  }
  _ESClass.register(ToolMacro);
  _es6_module.add_class(ToolMacro);
  ToolMacro = _es6_module.add_export('ToolMacro', ToolMacro);
  ToolMacro.STRUCT = STRUCT.inherit(ToolMacro, ToolOp)+`
  tools   : array(abstract(ToolOp));
  apiname : string;
  uiname  : string;
}
`;
  var StringProperty=es6_import_item(_es6_module, './toolprops.js', 'StringProperty');
  var Vec3Property=es6_import_item(_es6_module, './toolprops.js', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, './toolprops.js', 'Vec4Property');
  var IntProperty=es6_import_item(_es6_module, './toolprops.js', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, './toolprops.js', 'FloatProperty');
  var BoolProperty=es6_import_item(_es6_module, './toolprops.js', 'BoolProperty');
  var pushModalLight=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'popModalLight');
  class DataPathOp extends ToolOp {
    
    
    
     constructor(path="", use_simple_undo=false) {
      super("DataPathOp", "DataPath", "DataPath Value Set");
      this.use_simple_undo = use_simple_undo;
      this.is_modal = false;
      this.path = path;
      this.inputs = {path: new StringProperty(path, "path", "path", "path"), 
     vec3: new Vec3Property(undefined, "vec3", "vec3", "vec3"), 
     vec4: new Vec4Property(undefined, "vec4", "vec4", "vec4"), 
     pint: new IntProperty(0, "pint", "pint", "pint"), 
     pfloat: new FloatProperty(0, "pfloat", "pfloat", "pfloat"), 
     str: new StringProperty("", "str", "str", "str"), 
     bool: new BoolProperty(false, "bool", "bool", "bool"), 
     val_input: new StringProperty("", "val_input", "val_input", "val_input")};
      this.outputs = {};
      for (var k in this.inputs) {
          this.inputs[k].flag|=TPropFlags.PRIVATE;
      }
    }
     undo_pre(ctx) {
      this._undocpy = g_app_state.create_undo_file();
    }
     undo(ctx) {
      g_app_state.load_undo_file(this._undocpy);
    }
     get_prop_input(path, prop) {
      if (prop==undefined) {
          console.trace("Warning: DataPathOp failed!", path, prop);
          return ;
      }
      var input;
      if (prop.type==PropTypes.INT) {
          input = this.inputs.pint;
      }
      else 
        if (prop.type==PropTypes.FLOAT) {
          input = this.inputs.pfloat;
      }
      else 
        if (prop.type==PropTypes.VEC3) {
          input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec3;
      }
      else 
        if (prop.type==PropTypes.VEC4) {
          input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec4;
      }
      else 
        if (prop.type==PropTypes.BOOL) {
          input = this.inputs.bool;
      }
      else 
        if (prop.type==PropTypes.STR) {
          input = this.inputs.str;
      }
      else 
        if (prop.type==PropTypes.FLAG) {
          input = this.inputs.str;
      }
      else 
        if (prop.type==PropTypes.ENUM) {
          input = this.inputs.pint;
      }
      else {
        console.trace("ERROR: unimplemented prop type "+prop.type+"in DataPathOp", prop, this);
        return undefined;
      }
      return input;
    }
     exec(ctx) {
      var api=g_app_state.api;
      var path=this.inputs.path.data.trim();
      var prop=api.get_prop_meta(ctx, path);
      if (prop==undefined) {
          console.trace("Warning: DataPathOp failed!");
          return ;
      }
      var input=this.get_prop_input(path, prop);
      api.set_prop(ctx, path, input.data);
    }
  }
  _ESClass.register(DataPathOp);
  _es6_module.add_class(DataPathOp);
  mixin(ToolOp, EventHandler);
  class MassSetPathOp extends ToolOp {
    
    
    
     constructor(path="", subpath="", filterstr="", use_simple_undo=false) {
      super("DataPathOp", "DataPath", "DataPath Value Set");
      this.use_simple_undo = use_simple_undo;
      this.is_modal = false;
      this.path = path;
      this.subpath = subpath;
      this.filterstr = filterstr;
      this.inputs = {path: new StringProperty(path, "path", "path", "path"), 
     vec3: new Vec3Property(undefined, "vec3", "vec3", "vec3"), 
     vec4: new Vec4Property(undefined, "vec4", "vec4", "vec4"), 
     pint: new IntProperty(0, "pint", "pint", "pint"), 
     pfloat: new FloatProperty(0, "pfloat", "pfloat", "pfloat"), 
     str: new StringProperty("", "str", "str", "str"), 
     bool: new BoolProperty(false, "bool", "bool", "bool"), 
     val_input: new StringProperty("", "val_input", "val_input", "val_input")};
      this.outputs = {};
      for (var k in this.inputs) {
          this.inputs[k].flag|=TPropFlags.PRIVATE;
      }
    }
     _get_value(ctx) {
      var path=this.path.trim();
      var prop=api.get_prop_meta(ctx, path);
      if (prop==undefined) {
          console.trace("Warning: DataPathOp failed!");
          return ;
      }
      return this.get_prop_input(path, prop);
    }
     undo_pre(ctx) {
      var value=this._get_value(ctx);
      var paths=ctx.api.buildMassSetPaths(ctx, this.path, this.subpath, value, this.filterstr);
      var ud=this._undo = {};
      for (var i=0; i<paths.length; i++) {
          var value2=ctx.api.get_prop(paths[i]);
          ud[paths[i]] = JSON.stringify(value2);
      }
    }
     undo(ctx) {
      var value=this._get_value(ctx);
      var paths=ctx.api.buildMassSetPaths(ctx, this.path, this.subpath, value, this.filterstr);
      var ud=this._undo;
      for (var k in ud) {
          var data=JSON.parse(ud[k]);
          if (data=="undefined")
            data = undefined;
          ctx.api.set_prop(ctx, k, data);
      }
    }
     get_prop_input(path, prop) {
      if (prop==undefined) {
          console.trace("Warning: DataPathOp failed!", path, prop);
          return ;
      }
      var input;
      if (prop.type==PropTypes.INT) {
          input = this.inputs.pint;
      }
      else 
        if (prop.type==PropTypes.FLOAT) {
          input = this.inputs.pfloat;
      }
      else 
        if (prop.type==PropTypes.VEC3) {
          input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec3;
      }
      else 
        if (prop.type==PropTypes.VEC4) {
          input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec4;
      }
      else 
        if (prop.type==PropTypes.BOOL) {
          input = this.inputs.bool;
      }
      else 
        if (prop.type==PropTypes.STR) {
          input = this.inputs.str;
      }
      else 
        if (prop.type==PropTypes.FLAG) {
          input = this.inputs.str;
      }
      else 
        if (prop.type==PropTypes.ENUM) {
          input = this.inputs.pint;
      }
      else {
        console.trace("ERROR: unimplemented prop type "+prop.type+"in DataPathOp", prop, this);
        return undefined;
      }
      return input;
    }
     exec(ctx) {
      var api=g_app_state.api;
      var path=this.inputs.path.data.trim();
      var prop=api.get_prop_meta(ctx, path);
      if (prop==undefined) {
          console.trace("Warning: DataPathOp failed!");
          return ;
      }
      var input=this.get_prop_input(path, prop);
      api.mass_set_prop(ctx, path, this.subpath, input.data, this.filterstr);
    }
  }
  _ESClass.register(MassSetPathOp);
  _es6_module.add_class(MassSetPathOp);
  window.init_toolop_structs = function () {
    
    function gen_fromSTRUCT(cls1) {
      function fromSTRUCT(reader) {
        var op=new cls1();
        var inputs=op.inputs, outputs=op.outputs;
        reader(op);
        var ins=Object.create(inputs), outs=Object.create(outputs);
        for (var i=0; i<op.inputs.length; i++) {
            var k=op.inputs[i].key;
            ins[k] = op.inputs[i].value;
            if (k in inputs) {
                ins[k].load_ui_data(inputs[k]);
            }
            else {
              ins[k].uiname = ins[k].apiname = k;
            }
        }
        for (var i=0; i<op.outputs.length; i++) {
            var k=op.outputs[i].key;
            outs[k] = op.outputs[i].value;
            if (k in outputs) {
                outs[k].load_ui_data(outputs[k]);
            }
            else {
              outs[k].uiname = outs[k].apiname = k;
            }
        }
        op.inputs = ins;
        op.outputs = outs;
        return op;
      }
      return fromSTRUCT;
    }
    for (var i=0; i<defined_classes.length; i++) {
        var cls=defined_classes[i];
        var ok=false;
        var is_toolop=false;
        var parent=cls.prototype.__proto__.constructor;
        while (parent) {
          if (parent===ToolOpAbstract) {
              ok = true;
          }
          else 
            if (parent===ToolOp) {
              ok = true;
              is_toolop = true;
              break;
          }
          parent = parent.prototype.__proto__;
          if (!parent)
            break;
          parent = parent.constructor;
          if (!parent||parent===Object)
            break;
        }
        if (!ok)
          continue;
        if (!Object.hasOwnProperty(cls, "STRUCT")) {
            cls.STRUCT = cls.name+" {"+`
        flag    : int;
        inputs  : iterkeys(k, PropPair) | new PropPair(k, obj.inputs[k]);
        outputs : iterkeys(k, PropPair) | new PropPair(k, obj.outputs[k]);
      `;
            if (is_toolop)
              cls.STRUCT+="    saved_context  : SavedContext | obj.get_saved_context();\n";
            cls.STRUCT+="  }";
        }
        if (!cls.fromSTRUCT) {
            cls.fromSTRUCT = gen_fromSTRUCT(cls);
        }
    }
  }
  class WidgetToolOp extends ToolOp {
    static  create_widgets(manager, ctx) {
      var $zaxis_wq__;
      var widget=manager.create();
      var enabled_axes=this.widget_axes;
      var do_widget_center=this.widget_center;
      var gen_toolop=this.gen_toolop;
      var do_x=enabled_axes[0], do_y=enabled_axes[1], do_z=enabled_axes[2];
      if (do_x)
        widget.arrow([1, 0, 0], 0, [1, 0, 0, 1]);
      if (do_y)
        widget.arrow([0, 1, 0], 1, [0, 1, 0, 1]);
      if (do_z)
        widget.arrow([0, 0, 1], 2, [0, 0, 1, 1]);
      var this2=this;
      function widget_on_tick(widget) {
        var mat=widget.matrix;
        var mesh=ctx.mesh;
        var cent=new Vector3();
        var len=0;
        var v1=new Vector3();
        for (var v of mesh.verts.selected) {
            cent.add(v.co);
            v1.load(v.edges[0].v1.co).sub(v.edges[0].v2.co);
            v1.normalize();
            len++;
        }
        if (len>0)
          cent.mulScalar(1.0/len);
        mat.makeIdentity();
        mat.translate(cent[0], cent[1], cent[2]);
        if (this2.widget_align_normal) {
            var n=new Vector3();
            var tan=new Vector3();
            len = 0;
            var v1=new Vector3();
            for (var f of mesh.faces.selected) {
                var e=f.looplists[0].loop.e;
                len++;
                n.add(f.no);
            }
            n.mulScalar(1.0/len);
            n.normalize();
            if (tan.dot(tan)==0.0) {
                tan.loadXYZ(0, 0, 1);
            }
            else {
              tan.mulScalar(1.0/len);
              tan.normalize();
            }
            var angle=Math.PI-Math.acos($zaxis_wq__.dot(n));
            if (n.dot($zaxis_wq__)>0.9) {
            }
            if (1) {
                if (Math.abs(angle)<0.001||Math.abs(angle)>Math.PI-0.001) {
                    n.loadXYZ(1, 0, 0);
                }
                else {
                  n.cross($zaxis_wq__);
                  n.normalize();
                }
                var q=new Quat();
                q.axisAngleToQuat(n, angle);
                var rmat=q.toMatrix();
                mat.multiply(rmat);
            }
        }
        mat.multiply(ctx.object.matrix);
      }
      widget.on_tick = widget_on_tick;
      widget.on_click = function (widget, id) {
        console.log("widget click: ", id);
        ctx.view2d._mstart = null;
        var toolop=undefined;
        if (gen_toolop!=undefined) {
            var toolop=gen_toolop(id, widget, ctx);
        }
        else {
          console.trace("IMPLEMENT ME! missing widget gen_toolop callback!");
          return ;
        }
        if (toolop==undefined) {
            console.log("Evil! Undefined toolop in WidgetToolOp.create_widgets()!");
            return ;
        }
        widget.user_data = toolop;
        toolop._widget_on_tick = widget_on_tick;
        toolop.widgets.push(widget);
        toolop.on_modal_end = function (toolop) {
          for (var w of toolop.widgets) {
              for (var k in toolop.inputs) {
                  var p=toolop.inputs[k];
                  p.remove_listener(w, true);
              }
              for (var k in toolop.outputs) {
                  var p=toolop.outputs[k];
                  p.remove_listener(w, true);
              }
          }
          console.log("widget modal end");
          toolop.widgets = new GArray();
          widget.on_tick = widget_on_tick;
        }
        if (toolop.widget_on_tick)
          widget.widget_on_tick = toolop.widget_on_tick;
        widget.on_tick = function (widget) {
          toolop.widget_on_tick.call(toolop, widget);
        }
        g_app_state.toolstack.exec_tool(toolop);
      };
      var $zaxis_wq__=new Vector3([0, 0, -1]);
    }
     widget_on_tick(widget) {
      if (this._widget_on_tick!=undefined)
        this._widget_on_tick(widget);
    }
  }
  _ESClass.register(WidgetToolOp);
  _es6_module.add_class(WidgetToolOp);
}, '/dev/fairmotion/src/core/toolops_api.js');
es6_module_define('eventdag', ["../util/vectormath.js"], function _eventdag_module(_es6_module) {
  "use strict";
  var _event_dag_idgen=undefined;
  es6_import(_es6_module, '../util/vectormath.js');
  class InheritFlag  {
     constructor(data) {
      this.data = data;
    }
  }
  _ESClass.register(InheritFlag);
  _es6_module.add_class(InheritFlag);
  window.the_global_dag = undefined;
  class NodeBase  {
     dag_update(output_socket_name, data) {
      var graph=window.the_global_dag;
      var node=graph.get_node(this, false);
      if (node!==undefined) {
          node.dag_update(output_socket_name, data);
      }
      else 
        if (DEBUG.dag) {
          console.warn("Failed to find node data for ", this.dag_get_datapath!==undefined ? this.dag_get_datapath(g_app_state.ctx) : this, "\nThis is not necassarily an error");
      }
    }
    static  nodedef() {

    }
    static  Inherit(data={}) {
      return new InheritFlag(data);
    }
     dag_unlink() {
      var graph=window.the_global_dag;
      var node=graph.get_node(this, false);
      if (node!=undefined)
        window.the_global_dag.remove(node);
    }
  }
  _ESClass.register(NodeBase);
  _es6_module.add_class(NodeBase);
  NodeBase = _es6_module.add_export('NodeBase', NodeBase);
  class NodeFieldSocketWrapper extends NodeBase {
     dag_exec(ctx, inputs, outputs, graph) {
      for (let k in inputs) {
          let sock=inputs[k];
          switch (sock.datatype) {
            case DataTypes.VEC2:
            case DataTypes.VEC3:
            case DataTypes.VEC4:
            case DataTypes.MATRIX4:
              if (this[k]===undefined) {
                  this[k].load(sock.data);
              }
              else {
                this[k] = sock.data.copy();
              }
              break;
            default:
              this[k] = sock.data;
          }
      }
    }
     dag_exec_finish(ctx, inputs, outputs, graph) {
      for (let k in outputs) {
          let sock=outputs[k];
          sock.loadData(this[k]);
      }
    }
  }
  _ESClass.register(NodeFieldSocketWrapper);
  _es6_module.add_class(NodeFieldSocketWrapper);
  NodeFieldSocketWrapper = _es6_module.add_export('NodeFieldSocketWrapper', NodeFieldSocketWrapper);
  class UIOnlyNode extends NodeBase {
  }
  _ESClass.register(UIOnlyNode);
  _es6_module.add_class(UIOnlyNode);
  UIOnlyNode = _es6_module.add_export('UIOnlyNode', UIOnlyNode);
  class DataPathNode extends NodeBase {
     dag_get_datapath(ctx) {

    }
    static  isDataPathNode(obj) {
      return obj.dag_get_datapath!==undefined;
    }
  }
  _ESClass.register(DataPathNode);
  _es6_module.add_class(DataPathNode);
  DataPathNode = _es6_module.add_export('DataPathNode', DataPathNode);
  class DataPathWrapperNode extends NodeFieldSocketWrapper {
     dag_get_datapath(ctx) {

    }
  }
  _ESClass.register(DataPathWrapperNode);
  _es6_module.add_class(DataPathWrapperNode);
  DataPathWrapperNode = _es6_module.add_export('DataPathWrapperNode', DataPathWrapperNode);
  var DagFlags={UPDATE: 1, 
   TEMP: 2, 
   DEAD: 4}
  DagFlags = _es6_module.add_export('DagFlags', DagFlags);
  function make_slot(stype, k, v, node) {
    var type;
    if (v===undefined||v===null)
      type = DataTypes.DEPEND;
    else 
      if (__instance_of(v, set))
      type = DataTypes.SET;
    else 
      if (v===true||k===false)
      type = DataTypes.BOOL;
    else 
      if (typeof v=="number")
      type = DataTypes.NUMBER;
    else 
      if (typeof v=="string"||__instance_of(v, String))
      type = DataTypes.STRING;
    else 
      if (__instance_of(v, Vector2))
      type = DataTypes.VEC2;
    else 
      if (__instance_of(v, Vector3))
      type = DataTypes.VEC3;
    else 
      if (__instance_of(v, Vector4))
      type = DataTypes.VEC4;
    else 
      if (__instance_of(v, Matrix4))
      type = DataTypes.MATRIX4;
    else 
      if (__instance_of(v, Array)) {
        for (var i=0; i<v.length; i++) {
            if (typeof (v[i])!="number"&&typeof (v[i])!=undefined) {
                warntrace("WARNING: bad array being passed around!!", v);
            }
            type = DataTypes.ARRAY;
        }
    }
    return new EventSocket(k, node, stype, type);
  }
  function get_sockets(cls, key) {
    if (cls.nodedef===undefined) {
        console.warn("Warning, missing node definition nodedef() for ", cls, cls);
        return {}
    }
    let ndef=cls.nodedef();
    let socks=ndef[key];
    if (socks===undefined) {
        return {}
    }
    if (__instance_of(socks, InheritFlag)) {
        socks = socks.data;
        let parent=cls.__parent__;
        console.log("INHERITANCE", cls, parent);
        if (parent===undefined) {
            return socks;
        }
        socks = Object.assign({}, socks);
        let socks2=get_sockets(parent, key);
        for (let k in socks2) {
            if (socks[k]===undefined) {
                socks[k] = socks2[k];
            }
        }
    }
    return socks;
  }
  function build_sockets(cls, key) {
    let socks=get_sockets(cls, key);
    let socks2={}
    for (let k in socks) {
        let sock=socks[k];
        if (!(__instance_of(sock, EventSocket))) {
            socks2[k] = make_slot(key=="inputs" ? "i" : "o", k, sock, undefined);
        }
        else {
          socks2[k] = sock.copy();
        }
    }
    return socks2;
  }
  function get_ndef(cls) {
    if (cls._cached_nodedef!==undefined) {
        return cls._cached_nodedef;
    }
    let ndef;
    if (cls.nodedef===undefined) {
        console.warn("Warning, no nodedef for cls", cls, "inheriting...");
        let cls2=cls;
        while (cls2!==undefined) {
          if (cls2.nodedef) {
              ndef = Object.assign({}, cls2.nodedef());
              break;
          }
          cls2 = cls2.__parent__;
        }
        if (ndef===undefined) {
            console.warn("Failed to find nodedef static for class", cls);
            throw new Error("Failed to find nodedef static for class"+cls);
        }
    }
    else {
      ndef = cls.nodedef();
    }
    cls._cached_nodedef = ndef;
    ndef.inputs = build_sockets(cls, "inputs");
    ndef.outputs = build_sockets(cls, "outputs");
    return ndef;
  }
  function finalNodeDefInputs(cls) {
    return get_ndef(cls).inputs;
  }
  finalNodeDefInputs = _es6_module.add_export('finalNodeDefInputs', finalNodeDefInputs);
  function finalNodeDefOutputs(cls) {
    return get_ndef(cls).outputs;
  }
  finalNodeDefOutputs = _es6_module.add_export('finalNodeDefOutputs', finalNodeDefOutputs);
  class EventNode  {
    
    
    
     constructor() {
      this.flag = 0;
      this.id = -1;
      this.graph = undefined;
      this.inputs = {};
      this.outputs = {};
    }
     get_owner(ctx) {

    }
     on_remove(ctx) {

    }
     dag_update(field, data) {
      if (DEBUG.dag) {
          console.trace("dag_update:", field, data);
      }
      if (field===undefined) {
          for (var k in this.outputs) {
              this.dag_update(k);
          }
          return ;
      }
      var sock=this.outputs[field];
      if (arguments.length>1) {
          sock.loadData(data);
      }
      sock.update();
      this.flag|=DagFlags.UPDATE;
      this.graph.on_update(this, field);
    }
     unlink() {
      for (var k in this.inputs) {
          this.inputs[k].disconnect_all();
      }
      for (var k in this.outputs) {
          this.outputs[k].disconnect_all();
      }
    }
  }
  _ESClass.register(EventNode);
  _es6_module.add_class(EventNode);
  EventNode = _es6_module.add_export('EventNode', EventNode);
  class IndirectNode extends EventNode {
     constructor(path) {
      super();
      this.datapath = path;
    }
     get_owner(ctx) {
      if (this._owner!=undefined)
        return this._owner;
      this._owner = ctx.api.getObject(ctx, this.datapath);
      return this._owner;
    }
  }
  _ESClass.register(IndirectNode);
  _es6_module.add_class(IndirectNode);
  IndirectNode = _es6_module.add_export('IndirectNode', IndirectNode);
  class DirectNode extends EventNode {
     constructor(id) {
      super();
      this.objid = id;
    }
     get_owner(ctx) {
      return this.graph.object_idmap[this.objid];
    }
  }
  _ESClass.register(DirectNode);
  _es6_module.add_class(DirectNode);
  DirectNode = _es6_module.add_export('DirectNode', DirectNode);
  var DataTypes={DEPEND: 1, 
   NUMBER: 2, 
   BOOL: 4, 
   STRING: 8, 
   VEC2: 16, 
   VEC3: 32, 
   VEC4: 64, 
   MATRIX4: 128, 
   ARRAY: 256, 
   SET: 512}
  DataTypes = _es6_module.add_export('DataTypes', DataTypes);
  var TypeDefaults={}, t=TypeDefaults;
  t[DataTypes.DEPEND] = null;
  t[DataTypes.NUMBER] = 0;
  t[DataTypes.STRING] = "";
  t[DataTypes.VEC2] = () =>    {
    return new Vector2();
  }
  t[DataTypes.MATRIX4] = () =>    {
    return new Vector3();
  }
  t[DataTypes.ARRAY] = [];
  t[DataTypes.BOOL] = true;
  t[DataTypes.SET] = () =>    {
    return new set();
  }
  function makeDefaultSlotData(type) {
    let ret=TypeDefaults[type];
    if (typeof ret=="function") {
        return ret();
    }
    return ret;
  }
  makeDefaultSlotData = _es6_module.add_export('makeDefaultSlotData', makeDefaultSlotData);
  function wrap_ndef(ndef) {
    return function () {
      return ndef;
    }
  }
  class EventEdge  {
     constructor(dst, src) {
      this.dst = dst;
      this.src = src;
    }
     opposite(socket) {
      return socket==this.dst ? this.src : this.dst;
    }
  }
  _ESClass.register(EventEdge);
  _es6_module.add_class(EventEdge);
  EventEdge = _es6_module.add_export('EventEdge', EventEdge);
  class EventSocket  {
     constructor(name, owner, type, datatype) {
      this.type = type;
      this.name = name;
      this.node = node;
      this.datatype = datatype;
      this.data = undefined;
      this.flag = DagFlags.UPDATE;
      this.edges = [];
    }
     update() {
      this.flag|=DagFlags.UPDATE;
    }
     copy() {
      var s=new EventSocket(this.name, undefined, this.type, this.datatype);
      s.loadData(this.data, false);
      if (s.data===undefined) {
          s.data = makeDefaultSlotData(this.datatype);
      }
      return s;
    }
     loadData(data, auto_set_update=true) {
      let update=false;
      switch (this.datatype) {
        case DataTypes.VEC2:
        case DataTypes.VEC3:
        case DataTypes.VEC4:
        case DataTypes.MATRIX4:
          update = auto_set_update&&this.data.equals(data);
          this.data.load(data);
          break;
        default:
          update = auto_set_update&&this.data===data;
          this.data = data;
      }
      if (update) {
          this.update();
      }
    }
     connect(b) {
      if (b.type==this.type) {
          throw new Error("Cannot put two inputs or outputs together");
      }
      var src, dst;
      if (this.type=="i") {
          src = b, dst = this;
      }
      else 
        if (this.type=="o") {
          src = this, dst = b;
      }
      else {
        throw new Error("Malformed socket type.  this.type, b.type, this, b:", this.type, b.type, this, b);
      }
      var edge=new EventEdge(dst, src);
      this.edges.push(edge);
      b.edges.push(edge);
    }
     _find_edge(b) {
      for (var i=0; i<this.edges.length; i++) {
          if (this.edges[i].opposite(this)===b)
            return this.edges[i];
      }
      return undefined;
    }
     disconnect(other_socket) {
      if (other_socket==undefined) {
          warntrace("Warning, no other_socket in disconnect!");
          return ;
      }
      var e=this._find_edge(other_socket);
      if (e!=undefined) {
          other_socket.edges.remove(e);
          this.edges.remove(e);
      }
    }
     disconnect_all() {
      while (this.edges.length>0) {
        var e=this.edges[0];
        e.opposite(this).edges.remove(e);
        this.edges.remove(e);
      }
    }
  }
  _ESClass.register(EventSocket);
  _es6_module.add_class(EventSocket);
  EventSocket = _es6_module.add_export('EventSocket', EventSocket);
  window._NodeBase = NodeBase;
  function gen_callback_exec(func, thisvar) {
    for (var k of Object.getOwnPropertyNames(NodeBase.prototype)) {
        if (k=="toString")
          continue;
        func[k] = NodeBase.prototype[k];
    }
    func.constructor = {}
    func.constructor.name = func.name;
    func.constructor.prototype = NodeBase.prototype;
    func.prototype = NodeBase.prototype;
    func.dag_exec = function (ctx, inputs, outputs, graph) {
      return func.apply(thisvar, arguments);
    }
  }
  var $sarr_9ujI_link;
  var $darr_3Fns_link;
  class EventDag  {
     constructor(ctx) {
      this.nodes = [];
      this.sortlist = [];
      this.doexec = false;
      this.node_pathmap = {};
      this.node_idmap = {};
      this.object_idmap = {};
      this.idmap = {};
      this.ctx = ctx;
      if (_event_dag_idgen==undefined)
        _event_dag_idgen = new EIDGen();
      this.object_idgen = _event_dag_idgen;
      this.idgen = new EIDGen();
      this.resort = true;
    }
     reset_cache() {
      for (var n of this.nodes) {
          if (__instance_of(n, IndirectNode)) {
              n._owner = undefined;
          }
      }
    }
     init_slots(node, object) {
      let ndef;
      ndef = get_ndef(object.constructor);
      if (ndef) {
          node.name = ndef.name;
          node.uiName = ndef.uiName;
          for (let i=0; i<2; i++) {
              let key=i ? "outputs" : "inputs";
              let stype=i ? "o" : "i";
              let sockdef=ndef[key];
              let socks={};
              node[key] = socks;
              for (let k in sockdef) {
                  let sock=sockdef[k].copy();
                  if (sock.datatype==DataTypes.ARRAY||sock.datatype==DataTypes.SET) {
                      sock.data = makeDefaultSlotData(sock.datatype);
                  }
                  sock.type = stype;
                  sock.node = node;
                  socks[k] = sock;
              }
          }
      }
      else {
        console.warn("Failed to find node definition", object);
        node.inputs = {};
        node.outputs = {};
      }
    }
     indirect_node(ctx, path, object=undefined, auto_create=true) {
      if (path in this.node_pathmap)
        return this.node_pathmap[path];
      if (!auto_create)
        return undefined;
      var node=new IndirectNode(path);
      this.node_pathmap[path] = node;
      if (object===undefined) {
          ctx = ctx===undefined ? this.ctx : ctx;
          object = ctx.api.getObject(ctx, path);
      }
      this.init_slots(node, object);
      this.add(node);
      return node;
    }
     direct_node(ctx, object, auto_create=true) {
      if ("__dag_id" in object&&object.__dag_id in this.node_idmap) {
          this.object_idmap[object.__dag_id] = object;
          return this.node_idmap[object.__dag_id];
      }
      if (!auto_create)
        return undefined;
      if (object.__dag_id==undefined)
        object.__dag_id = this.object_idgen.gen_id();
      var node=new DirectNode(object.__dag_id);
      node.id = object.__dag_id;
      this.object_idmap[object.__dag_id] = object;
      this.node_idmap[object.__dag_id] = node;
      this.init_slots(node, object);
      this.add(node);
      return node;
    }
     add(node) {
      node.graph = this;
      this.nodes.push(node);
      this.resort = true;
      node.id = this.idgen.gen_id();
      this.idmap[node.id] = node;
    }
     remove(node) {
      if (!(__instance_of(node, EventNode))) {
          node = this.get_node(node, false);
          if (node==undefined) {
              console.log("node already removed");
              return ;
          }
      }
      if (this.nodes.indexOf(node)<0) {
          console.log("node not in graph", node);
      }
      node.unlink();
      if (__instance_of(node, DirectNode)) {
          delete this.object_idmap[node.objid];
          delete this.node_idmap[node.objid];
      }
      else 
        if (__instance_of(node, IndirectNode)) {
          delete this.node_pathmap[node.datapath];
      }
      delete this.idmap[node.id];
      this.nodes.remove(node);
      if (this.sortlist.indexOf(node)>=0) {
          this.sortlist.remove(node);
      }
      this.resort = true;
    }
     get_node(object, auto_create=true) {
      if (__instance_of(object, EventNode)) {
          return object;
      }
      var node;
      if (DataPathNode.isDataPathNode(object)) {
          node = this.indirect_node(this.ctx, object.dag_get_datapath(), object, auto_create);
      }
      else {
        node = this.direct_node(this.ctx, object, auto_create);
      }
      if (node!==undefined&&object.dag_exec!==undefined&&node.dag_exec===undefined) {
          object = undefined;
          node.dag_exec = function (ctx, inputs, outputs, graph) {
            var owner=this.get_owner(ctx);
            if (owner!==undefined) {
                return owner.dag_exec.apply(owner, arguments);
            }
          };
      }
      return node;
    }
     link(src, srcfield, dst, dstfield, dstthis) {
      var obja=src, objb=dst;
      var srcnode=this.get_node(src);
      if (!(__instance_of(srcfield, Array))) {
          $sarr_9ujI_link[0] = srcfield;
          srcfield = $sarr_9ujI_link;
      }
      if (!(__instance_of(dstfield, Array))) {
          $darr_3Fns_link[0] = dstfield;
          dstfield = $darr_3Fns_link;
      }
      if ((typeof dst=="function"||__instance_of(dst, Function))&&!dst._dag_callback_init) {
          gen_callback_exec(dst, dstthis);
          dst._dag_callback_init = true;
          delete dst.__prototypeid__;
          let ndef={name: "function callback node", 
       uiname: "function callback node", 
       inputs: {}, 
       outputs: {}};
          dst.constructor.nodedef = wrap_ndef(ndef);
          if (__instance_of(srcfield, Array)) {
              for (var i=0; i<srcfield.length; i++) {
                  var field=srcfield[i];
                  var field2=dstfield[i];
                  if (!(field in srcnode.outputs)) {
                      console.trace(field, Object.keys(srcnode.outputs), srcnode);
                      throw new Error("Field not in outputs: "+field);
                  }
                  let sock=srcnode.outputs[field];
                  ndef.inputs[field2] = sock.copy();
              }
          }
      }
      var dstnode=this.get_node(dst);
      if (__instance_of(srcfield, Array)) {
          if (srcfield.length!=dstfield.length) {
              throw new Error("Error, both arguments must be arrays of equal length!", srcfield, dstfield);
          }
          for (var i=0; i<dstfield.length; i++) {
              if (!(dstfield[i] in dstnode.inputs))
                throw new Error("Event inputs does not exist: "+dstfield[i]);
              if (!(srcfield[i] in srcnode.outputs))
                throw new Error("Event output does not exist: "+srcfield[i]);
              dstnode.inputs[dstfield[i]].connect(srcnode.outputs[srcfield[i]]);
          }
      }
      else {
        console.log(dstnode, dstfield);
        if (!(dstfield in dstnode.inputs))
          throw new Error("Event input does not exist: "+dstfield);
        if (!(srcfield in srcnode.outputs))
          throw new Error("Event output does not exist: "+srcfield);
        dstnode.inputs[dstfield].connect(srcnode.outputs[srcfield]);
      }
      this.resort = true;
    }
     prune_dead_nodes() {
      var dellist=[];
      for (var n of this.nodes) {
          var tot=0;
          for (var k in n.inputs) {
              tot+=n.inputs[k].edges.length;
          }
          for (var k in n.outputs) {
              tot+=n.outputs[k].edges.length;
          }
          if (tot==0) {
              dellist.push(n);
          }
      }
      for (var n of dellist) {
          this.remove(n);
      }
    }
     sort() {
      this.prune_dead_nodes();
      var sortlist=[];
      var visit={};
      for (var n of this.nodes) {
          n.flag&=~DagFlags.TEMP;
      }
      function sort(n) {
        n.flag|=DagFlags.TEMP;
        for (var k in n.inputs) {
            var sock=n.inputs[k];
            for (var i=0; i<sock.length; i++) {
                var n2=sock.edges[i].opposite(sock).node;
                if (!(n2.flag&DagFlags.TEMP)) {
                    sort(n2);
                }
            }
        }
        sortlist.push(n);
        for (var k in n.outputs) {
            var sock=n.outputs[k];
            for (var i=0; i<sock.length; i++) {
                var n2=sock.edges[i].opposite(sock).node;
                if (!(n2.flag&DagFlags.TEMP)) {
                    sort(n2);
                }
            }
        }
      }
      var nlen=this.nodes.length, nodes=this.nodes;
      for (var i=0; i<nlen; i++) {
          var n=nodes[i];
          if (n.flag&DagFlags.TEMP)
            continue;
          sort(n);
      }
      this.sortlist = sortlist;
      this.resort = false;
    }
     on_update(node) {
      this.doexec = true;
    }
     startUpdateTimer() {
      this.timer = window.setInterval(() =>        {
        if (this.doexec&&this.ctx!==undefined) {
            this.exec(this.ctx);
        }
      }, 100);
    }
     exec(ctx) {
      if (ctx===undefined) {
          ctx = this.ctx;
      }
      this.doexec = false;
      this.ctx = ctx;
      if (DEBUG.dag) {
          console.log("eventdag EXEC");
      }
      if (this.resort) {
          this.sort();
      }
      var sortlist=this.sortlist;
      var slen=sortlist.length;
      for (var i=0; i<slen; i++) {
          var n=sortlist[i];
          if (!n) {
              console.warn("dead node in event dag");
              sortlist[i] = sortlist[sortlist.length-1];
              sortlist.length--;
              slen--;
              i--;
              continue;
          }
          if (!(n.flag&DagFlags.UPDATE))
            continue;
          n.flag&=~DagFlags.UPDATE;
          var owner=n.get_owner(ctx);
          if (owner===undefined) {
              console.warn("Bad owner!");
              n.flag|=DagFlags.DEAD;
              continue;
          }
          for (var k in n.inputs) {
              var sock=n.inputs[k];
              for (var j=0; j<sock.edges.length; j++) {
                  var e=sock.edges[j], s2=e.opposite(sock);
                  var n2=s2.node, owner2=n2.get_owner(ctx);
                  if (n2===undefined) {
                      n2.flag|=DagFlags.DEAD;
                      continue;
                  }
                  if (s2.flag&DagFlags.UPDATE) {
                      sock.loadData(s2.data);
                  }
                  break;
              }
          }
          if (owner.dag_exec) {
              owner.dag_exec(ctx, n.inputs, n.outputs, this);
          }
          for (var k in n.outputs) {
              var s=n.outputs[k];
              if (!(s.flag&DagFlags.UPDATE))
                continue;
              s.flag&=~DagFlags.UPDATE;
              if (DEBUG.dag)
                console.log("Propegating updated socket", k);
              for (var j=0; j<s.edges.length; j++) {
                  s.edges[j].opposite(s).node.flag|=DagFlags.UPDATE;
              }
          }
      }
    }
  }
  var $sarr_9ujI_link=[0];
  var $darr_3Fns_link=[0];
  _ESClass.register(EventDag);
  _es6_module.add_class(EventDag);
  EventDag = _es6_module.add_export('EventDag', EventDag);
  window.init_event_graph = function init_event_graph(ctx) {
    window.the_global_dag = new EventDag(ctx);
    window.the_global_dag.startUpdateTimer();
    _event_dag_idgen = new EIDGen();
  }
}, '/dev/fairmotion/src/core/eventdag.js');
es6_module_define('lib_utils', ["./toolprops_iter.js", "../editors/events.js", "./struct.js"], function _lib_utils_module(_es6_module) {
  "use strict";
  es6_import(_es6_module, '../editors/events.js');
  es6_import(_es6_module, './toolprops_iter.js');
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
  var EventHandler=es6_import_item(_es6_module, '../editors/events.js', 'EventHandler');
  var charmap=es6_import_item(_es6_module, '../editors/events.js', 'charmap');
  class DBList extends GArray {
    
    
    
    
     constructor(type) {
      super();
      this.type = type;
      this.idmap = {};
      this.selected = new GArray();
      this.active = undefined;
      this.length = 0;
      this.selset = new set();
    }
    static  fromSTRUCT(unpacker) {
      var dblist=new DBList(0);
      unpacker(dblist);
      var arr=dblist.arrdata;
      dblist.length = 0;
      for (var i=0; i<arr.length; i++) {
          GArray.prototype.push.call(dblist, arr[i]);
      }
      dblist.selected = new GArray(dblist.selected);
      delete dblist.arrdata;
      return dblist;
    }
     toJSON() {
      var list=[];
      var sellist=[];
      for (var block of this) {
          list.push(block.lib_id);
      }
      for (var block of this.selected) {
          sellist.push(block.lib_id);
      }
      var obj={list: list, 
     selected: sellist, 
     active: this.active!=undefined ? this.active.lib_id : -1, 
     length: this.length, 
     type: this.type};
      return obj;
    }
    static  fromJSON(obj) {
      var list=new DBList(obj.type);
      list.list = new GArray(obj.list);
      list.selected = new GArray(obj.selected);
      list.active = obj.active;
      list.length = obj.length;
    }
     clear_select() {
      for (var block of this.selected) {
          block.flag&=~SELECT;
      }
      this.selset = new set();
      this.selected = new GArray();
    }
     set_active(block) {
      if (block==undefined&&this.length>0) {
          console.trace();
          console.log("Undefined actives are illegal for DBLists, unless the list length is zero.");
          return ;
      }
      this.active = block;
    }
     select(block, do_select=true) {
      if (!(__instance_of(block, DataBlock))) {
          warntrace("WARNING: bad value ", block, " passed to DBList.select()");
          return ;
      }
      if (do_select) {
          block.flag|=SELECT;
          if (this.selset.has(block)) {
              return ;
          }
          this.selset.add(block);
          this.selected.push(block);
      }
      else {
        block.flag&=~SELECT;
        if (!this.selset.has(block)) {
            return ;
        }
        this.selset.remove(block);
        this.selected.remove(block);
      }
    }
     data_link(block, getblock, getblock_us) {
      for (var i=0; i<this.length; i++) {
          this[i] = getblock(this[i]);
          this.idmap[this[i].lib_id] = this[i];
      }
      var sel=this.selected;
      for (var i=0; i<sel.length; i++) {
          sel[i] = getblock(sel[i]);
          this.selset.add(sel[i]);
      }
      this.active = getblock(this.active);
    }
     push(block) {
      if (!(__instance_of(block, DataBlock))) {
          warntrace("WARNING: bad value ", block, " passed to DBList.select()");
          return ;
      }
      super.push(block);
      this.idmap[block.lib_id] = block;
      if (this.active==undefined) {
          this.active = block;
          this.select(block, true);
      }
    }
     remove(block) {
      var i=this.indexOf(block);
      if (i<0||i==undefined) {
          warn("WARNING: Could not remove block "+block.name+" from a DBList");
          return ;
      }
      this.pop(i);
    }
     pop(i) {
      if (i<0||i>=this.length) {
          warn("WARNING: Invalid argument ", i, " to static pop()");
          print_stack();
          return ;
      }
      var block=this[i];
      super.pop(i);
      delete this.idmap[block.lib_id];
      if (this.active==block) {
          this.select(block, false);
          this.active = this.length>0 ? this[0] : undefined;
      }
      if (this.selset.has(block)) {
          this.selected.remove(block);
          this.selset.remove(block);
      }
    }
     idget(id) {
      return this.idmap[id];
    }
  }
  _ESClass.register(DBList);
  _es6_module.add_class(DBList);
  DBList.STRUCT = `
  DBList {
    type : int;
    selected : array(dataref(DataBlock));
    arrdata : array(dataref(DataBlock)) | obj;
    active : dataref(DataBlock);
  }
`;
  function DataArrayRem(dst, field, obj) {
    var array=dst[field];
    function rem() {
      array.remove(obj);
    }
    return rem;
  }
  function SceneObjRem(scene, obj) {
    function rem() {
      for (var e of obj.dag_node.inmap["parent"]) {
          var node=e.opposite(obj).node;
          if (__instance_of(node, ASObject))
            node.unparent(scene);
      }
      scene.objects.remove(obj);
      scene.graph.remove(obj);
      if (scene.active==obj)
        scene.active = scene.objects.length>0 ? scene.objects[0] : undefined;
      if (scene.selection.has(obj))
        scene.selection.remove(obj);
    }
    return rem;
  }
  function DataRem(dst, field) {
    function rem() {
      dst["field"] = undefined;
    }
    return rem;
  }
  function wrap_getblock_us(datalib) {
    return function (dataref, block, fieldname, add_user, refname, rem_func) {
      if (dataref==undefined)
        return ;
      if (rem_func==undefined)
        rem_func = DataRem(block, fieldname);
      if (refname==undefined)
        refname = fieldname;
      var id=dataref[0];
      if (id==-1) {
          return undefined;
      }
      else {
        var b=datalib.get(id);
        if (b!=undefined) {
            if (add_user)
              b.lib_adduser(block, refname, rem_func);
        }
        else {
          warntrace(["WARNING WARNING WARNING saved block reference isn't in database!!!", "  dataref: "].join("\n"), dataref);
        }
        return b;
      }
    }
  }
  wrap_getblock_us = _es6_module.add_export('wrap_getblock_us', wrap_getblock_us);
  function wrap_getblock(datalib) {
    return function (dataref) {
      if (dataref==undefined)
        return ;
      var id=dataref[0];
      if (id==-1) {
          return undefined;
      }
      else {
        var b=datalib.get(id);
        if (b!=undefined) {
        }
        else {
          warntrace(["WARNING WARNING WARNING saved block reference isn't in database!!!", "  dataref: "].join("\n"), dataref);
        }
        return b;
      }
    }
  }
  wrap_getblock = _es6_module.add_export('wrap_getblock', wrap_getblock);
  class DataRefList extends GArray {
     constructor(lst=undefined) {
      super();
      this.datalib = undefined;
      if (lst==undefined)
        return ;
      if (__instance_of(lst, Array)) {
          for (var i=0; i<lst.length; i++) {
              if (lst[i]==undefined)
                continue;
              this.push(lst[i]);
          }
      }
      else 
        if (Symbol.iterator in lst) {
          for (var b of lst) {
              this.push(b);
          }
      }
    }
     [Symbol.iterator]() {
      return new DataRefListIter(this, new Context());
    }
    set  ctx(ctx) {
      this.datalib = ctx.datalib;
    }
    get  ctx() {
      return undefined;
    }
     get(i, return_block=true) {
      if (return_block) {
          var dl=this.datalib!=undefined ? this.datalib : g_app_state.datalib;
          return dl.get(this[i]);
      }
      else {
        return this[i];
      }
    }
     push(b) {
      if (!(b = this._b(b)))
        return ;
      if (__instance_of(b, DataBlock))
        b = new DataRef(b);
      super.push(new DataRef(b));
    }
     _b(b) {
      if (b==undefined) {
          warntrace("WARNING: undefined passed to DataRefList.push()");
          return ;
      }
      if (__instance_of(b, DataBlock)) {
          return new DataRef(b);
      }
      else 
        if (__instance_of(b, DataRef)) {
          return b;
      }
      else {
        warntrace("WARNING: bad value ", b, " passed to DataRefList._b()");
      }
    }
     remove(b) {
      if (!(b = this._b(b)))
        return ;
      var i=this.indexOf(b);
      if (i<0) {
          warntrace("WARNING: ", b, " not found in this DataRefList");
          return ;
      }
      this.pop(i);
    }
     pop(i, return_block=true) {
      var ret=super.pop(i);
      if (return_block)
        ret = new Context().datalib.get(ret.id);
      return ret;
    }
     replace(a, b) {
      if (!(b = this._b(b)))
        return ;
      var i=this.indexOf(a);
      if (i<0) {
          warntrace("WARNING: ", b, " not found in this DataRefList");
          return ;
      }
      this[i] = b;
    }
     indexOf(b) {
      super.indexOf(b);
      if (!(b = this._b(b)))
        return ;
      for (var i=0; i<this.length; i++) {
          if (this[i].id==b.id)
            return i;
      }
      return -1;
    }
     insert(index, b) {
      if (!(b = this._b(b)))
        return ;
      super.insert(b);
    }
     prepend(b) {
      if (!(b = this._b(b)))
        return ;
      super.prepend(b);
    }
    static  fromSTRUCT(reader) {
      var ret={};
      reader(ret);
      return new DataRefList(ret.list);
    }
  }
  _ESClass.register(DataRefList);
  _es6_module.add_class(DataRefList);
  mixin(DataRefList, TPropIterable);
  DataRefList.STRUCT = `
  DataRefList {
    list : array(i, dataref(DataBlock)) | this[i];
  }
`;
}, '/dev/fairmotion/src/core/lib_utils.js');
es6_module_define('transdata', ["../../util/mathlib.js"], function _transdata_module(_es6_module) {
  "use strict";
  var MinMax=es6_import_item(_es6_module, '../../util/mathlib.js', 'MinMax');
  class TransDataItem  {
    
     constructor(data, type, start_data) {
      this.data = data;
      this.start_data = start_data;
      this.type = type;
      this.w = 1;
      this.dis = -1;
    }
  }
  _ESClass.register(TransDataItem);
  _es6_module.add_class(TransDataItem);
  TransDataItem = _es6_module.add_export('TransDataItem', TransDataItem);
  class TransDataType  {
    static  apply(ctx, td, item, mat, w) {

    }
    static  undo_pre(ctx, td, undo_obj) {

    }
    static  getDataPath(ctx, td, ti) {

    }
    static  undo(ctx, undo_obj) {

    }
    static  update(ctx, td) {

    }
    static  calc_prop_distances(ctx, td, data) {

    }
    static  gen_data(ctx, td, data) {

    }
    static  iter_data(ctx, td) {
      let data=[];
      this.gen_data(ctx, td, data);
      return data;
    }
    static  calc_draw_aabb(ctx, td, minmax) {

    }
    static  aabb(ctx, td, item, minmax, selected_only) {

    }
  }
  _ESClass.register(TransDataType);
  _es6_module.add_class(TransDataType);
  TransDataType = _es6_module.add_export('TransDataType', TransDataType);
  TransDataType.selectmode = -1;
  class TransData  {
    
    
    
    
    
    
    
     constructor(ctx, top, datamode) {
      this.ctx = ctx;
      this.top = top;
      this.datamode = datamode;
      this.edit_all_layers = top.inputs.edit_all_layers.data;
      this.layer = ctx.spline.layerset.active;
      this.types = top.types;
      this.data = new GArray();
      this.undodata = {};
      this.doprop = top.inputs.proportional.data;
      this.propradius = top.inputs.propradius.data;
      this.center = new Vector3();
      this.start_center = new Vector3();
      this.minmax = new MinMax(3);
      for (var t of this.types) {
          if (datamode&t.selectmode) {
              t.gen_data(ctx, this, this.data);
          }
      }
      if (this.doprop)
        this.calc_propweights();
      for (var d of this.data) {
          d.type.aabb(ctx, this, d, this.minmax, true);
      }
      if (top.inputs.use_pivot.data) {
          this.center.load(top.inputs.pivot.data);
      }
      else {
        this.center.load(this.minmax.max).add(this.minmax.min).mulScalar(0.5);
      }
      this.start_center.load(this.center);
      if (top.modal_running) {
          this.scenter = new Vector3(this.center);
          this.start_scenter = new Vector3(this.start_center);
          ctx.view2d.project(this.scenter);
          ctx.view2d.project(this.start_scenter);
      }
    }
     calc_propweights(radius=this.propradius) {
      this.propradius = radius;
      for (var t of this.types) {
          if (t.selectmode&this.datamode)
            t.calc_prop_distances(this.ctx, this, this.data);
      }
      var r=radius;
      for (var tv of this.data) {
          if (tv.dis==-1)
            continue;
          tv.w = tv.dis>r ? 0 : 1.0-tv.dis/r;
      }
    }
  }
  _ESClass.register(TransData);
  _es6_module.add_class(TransData);
  TransData = _es6_module.add_export('TransData', TransData);
}, '/dev/fairmotion/src/editors/viewport/transdata.js');
es6_module_define('transform', ["../../core/toolops_api.js", "../events.js", "./transform_spline.js", "./transdata.js", "../dopesheet/dopesheet_transdata.js", "./view2d_base.js", "../../wasm/native_api.js", "../../core/toolprops.js", "../../curve/spline_types.js", "../../util/mathlib.js", "./selectmode.js"], function _transform_module(_es6_module) {
  var MinMax=es6_import_item(_es6_module, '../../util/mathlib.js', 'MinMax');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var Vec3Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec3Property');
  var BoolProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'BoolProperty');
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var CollectionProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'CollectionProperty');
  var TPropFlags=es6_import_item(_es6_module, '../../core/toolprops.js', 'TPropFlags');
  var EnumProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'EnumProperty');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var ToolDef=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolDef');
  var ModalStates=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ModalStates');
  var TransDataItem=es6_import_item(_es6_module, './transdata.js', 'TransDataItem');
  var TransDataType=es6_import_item(_es6_module, './transdata.js', 'TransDataType');
  var TransData=es6_import_item(_es6_module, './transdata.js', 'TransData');
  var TransDopeSheetType=es6_import_item(_es6_module, '../dopesheet/dopesheet_transdata.js', 'TransDopeSheetType');
  var SessionFlags=es6_import_item(_es6_module, './view2d_base.js', 'SessionFlags');
  var KeyMap=es6_import_item(_es6_module, '../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../events.js', 'EventHandler');
  var clear_jobs=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs');
  var clear_jobs_except_latest=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs_except_latest');
  var clear_jobs_except_first=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs_except_first');
  var JobTypes=es6_import_item(_es6_module, '../../wasm/native_api.js', 'JobTypes');
  var _tsv_apply_tmp1=new Vector3();
  var _tsv_apply_tmp2=new Vector3();
  var post_mousemove_cachering=cachering.fromConstructor(Vector3, 64);
  var mousemove_cachering=cachering.fromConstructor(Vector3, 64);
  var TransSplineVert=es6_import_item(_es6_module, './transform_spline.js', 'TransSplineVert');
  class TransformOp extends ToolOp {
    
    
    
     constructor(start_mpos, datamode) {
      super();
      this.first = true;
      this.types = new GArray([TransSplineVert]);
      this.first_viewport_redraw = true;
      if (start_mpos!==undefined&&typeof start_mpos!="number"&&__instance_of(start_mpos, Array)) {
          this.user_start_mpos = start_mpos;
      }
      if (datamode!==undefined)
        this.inputs.datamode.setValue(datamode);
      this.modaldata = {};
    }
    static  invoke(ctx, args) {
      var op=new this();
      if ("datamode" in args) {
          op.inputs.datamode.setValue(args["datamode"]);
      }
      if ("mpos" in args) {
          this.user_start_mpos = args["mpos"];
      }
      op.inputs.edit_all_layers.setValue(ctx.view2d.edit_all_layers);
      if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
          op.inputs.proportional.setValue(true);
          op.inputs.propradius.setValue(ctx.view2d.propradius);
      }
      return op;
    }
    static  tooldef() {
      return {inputs: {data: new CollectionProperty([], [], "data", "data", "data", TPropFlags.COLL_LOOSE_TYPE), 
      proportional: new BoolProperty(false, "proportional", "proportional mode"), 
      propradius: new FloatProperty(80, "propradius", "prop radius"), 
      datamode: new IntProperty(0, "datamode", "datamode"), 
      edit_all_layers: new BoolProperty(false, "Edit all layers", "Edit all layers"), 
      pivot: new Vec3Property(undefined, "pivot", "pivot", "pivot"), 
      use_pivot: new BoolProperty(false, "use_pivot", "use pivot", "use pivot"), 
      constraint_axis: new Vec3Property(undefined, "constraint_axis", "Constraint Axis", "Axis to constrain"), 
      constrain: new BoolProperty(false, "constrain", "Enable Constraint", "Enable Constraint Axis")}}
    }
     ensure_transdata(ctx) {
      var selmode=this.inputs.datamode.data;
      if (this.transdata==undefined) {
          this.types = [];
          if (selmode&SelMask.TOPOLOGY)
            this.types.push(TransSplineVert);
          this.transdata = new TransData(ctx, this, this.inputs.datamode.data);
      }
      return this.transdata;
    }
     finish(ctx) {
      delete this.transdata;
      delete this.modaldata;
      ctx.frameset.on_ctx_update(ctx);
    }
     cancel() {
      var ctx=this.modal_ctx;
      this.end_modal();
      this.undo(ctx, true);
    }
     undo_pre(ctx) {
      var td=this.ensure_transdata(ctx);
      var undo=this._undo = {};
      undo.edit_all_layers = this.inputs.edit_all_layers.data;
      for (var i=0; i<this.types.length; i++) {
          this.types[i].undo_pre(ctx, td, undo);
      }
    }
     undo(ctx, suppress_ctx_update=false) {
      var undo=this._undo;
      for (var i=0; i<this.types.length; i++) {
          this.types[i].undo(ctx, undo);
      }
      if (!suppress_ctx_update) {
          ctx.frameset.on_ctx_update(ctx);
      }
      window.redraw_viewport();
    }
     end_modal() {
      var ctx=this.modal_ctx;
      this.post_mousemove(event, true);
      ctx.appstate.popModalState(ModalStates.TRANSFORMING);
      ToolOp.prototype.end_modal.call(this);
      this.finish(ctx);
    }
     start_modal(ctx) {
      super.start_modal(ctx);
      this.first_viewport_redraw = true;
      ctx.state.pushModalState(ModalStates.TRANSFORMING);
      ctx.spline.solve().then(function () {
        redraw_viewport();
      });
      this.ensure_transdata(ctx);
      this.modaldata = {};
    }
     on_mousemove(event) {
      var td=this.ensure_transdata(this.modal_ctx);
      var ctx=this.modal_ctx;
      var mpos=new Vector3([event.x, event.y, 0]);
      mpos.load(ctx.view2d.getLocalMouse(event.original.x, event.original.y));
      var md=this.modaldata;
      if (this.first) {
          md.start_mpos = new Vector3(mpos);
          md.mpos = new Vector3(mpos);
          md.last_mpos = new Vector3(mpos);
          this.first = false;
          return ;
      }
      else 
        if (md.start_mpos===undefined&&this.user_start_mpos!==undefined) {
          md.start_mpos = new Vector3(this.user_start_mpos);
          md.start_mpos[2] = 0.0;
          md.last_mpos = new Vector3(md.start_mpos);
          md.mpos = new Vector3(md.start_mpos);
      }
      md.last_mpos.load(md.mpos);
      md.mpos.load(mpos);
      this.draw_helper_lines(md, ctx);
    }
     post_mousemove(event, force_solve=false) {
      var td=this.transdata, view2d=this.modal_ctx.view2d;
      var md=this.modaldata, do_last=true;
      var min1=post_mousemove_cachering.next(), max1=post_mousemove_cachering.next();
      var min2=post_mousemove_cachering.next(), max2=post_mousemove_cachering.next();
      if (this.first_viewport_redraw) {
          md.draw_minmax = new MinMax(3);
          do_last = false;
      }
      var ctx=this.modal_ctx;
      var minmax=md.draw_minmax;
      min1.load(minmax.min);
      max1.load(minmax.max);
      minmax.reset();
      for (var i=0; i<td.types.length; i++) {
          td.types[i].calc_draw_aabb(ctx, td, minmax);
      }
      for (var i=0; i<2; i++) {
          minmax.min[i]-=20/view2d.zoom;
          minmax.max[i]+=20/view2d.zoom;
      }
      if (do_last) {
          for (var i=0; i<2; i++) {
              min2[i] = Math.min(min1[i], minmax.min[i]);
              max2[i] = Math.max(max1[i], minmax.max[i]);
          }
      }
      else {
        min2.load(minmax.min), max2.load(minmax.max);
      }
      var found=false;
      for (var i=0; i<this.types; i++) {
          if (this.types[i]===TransSplineVert) {
              found = true;
              break;
          }
      }
      var this2=this;
      redraw_viewport(min2, max2, undefined, !this2.first_viewport_redraw);
      if (!ctx.spline.solving) {
          if (force_solve&&!ctx.spline.solving) {
              redraw_viewport(min2, max2, undefined, !this2.first_viewport_redraw);
          }
          else 
            if (force_solve) {
              ctx.spline._pending_solve.then(function () {
                redraw_viewport(min2, max2, undefined, !this2.first_viewport_redraw);
              });
          }
      }
      else 
        if (force_solve) {
          ctx.spline.solve(undefined, undefined, force_solve).then(function () {
            redraw_viewport(min2, max2, undefined, !this2.first_viewport_redraw);
          });
      }
    }
     draw_helper_lines(md, ctx) {
      this.reset_drawlines();
      if (this.inputs.proportional.data) {
          var rad=this.inputs.propradius.data;
          var steps=64, t=-Math.PI, dt=(Math.PI*2.0)/(steps-1);
          var td=this.transdata;
          var v1=new Vector3(), v2=new Vector3();
          var r=this.inputs.propradius.data;
          var cent=new Vector2(td.center);
          ctx.view2d.project(cent);
          for (var i=0; i<steps-1; i++, t+=dt) {
              v1[0] = Math.sin(t)*r+cent[0];
              v1[1] = Math.cos(t)*r+cent[1];
              v2[0] = Math.sin(t+dt)*r+cent[0];
              v2[1] = Math.cos(t+dt)*r+cent[1];
              var dl=this.new_drawline(v1, v2);
              dl.clr[0] = dl.clr[1] = dl.clr[2] = 0.1;
              dl.clr[3] = 0.01;
              dl.width = 2;
          }
      }
    }
     on_keydown(event) {
      console.log(event.keyCode);
      var propdelta=15;
      switch (event.keyCode) {
        case 88:
        case 89:
          this.inputs.constraint_axis.data.zero();
          this.inputs.constraint_axis.data[event.keyCode==89 ? 1 : 0] = 1;
          this.inputs.constrain.setValue(true);
          this.exec(this.modal_ctx);
          window.redraw_viewport();
          break;
        case 13:
          console.log("end transform!");
          this.end_modal();
          break;
        case 27:
          this.cancel();
          break;
        case 189:
          if (this.inputs.proportional.data) {
              this.inputs.propradius.setValue(this.inputs.propradius.data-propdelta);
              this.transdata.propradius = this.inputs.propradius.data;
              this.transdata.calc_propweights();
              this.modal_ctx.view2d.propradius = this.inputs.propradius.data;
              this.exec(this.modal_ctx);
              this.draw_helper_lines(this.modaldata, this.modal_ctx);
              window.redraw_viewport();
          }
          break;
        case 187:
          if (this.inputs.proportional.data) {
              this.inputs.propradius.setValue(this.inputs.propradius.data+propdelta);
              this.transdata.propradius = this.inputs.propradius.data;
              this.transdata.calc_propweights();
              this.modal_ctx.view2d.propradius = this.inputs.propradius.data;
              this.exec(this.modal_ctx);
              this.draw_helper_lines(this.modaldata, this.modal_ctx);
              window.redraw_viewport();
          }
          break;
      }
    }
     on_mouseup(event) {
      console.log("end transform!");
      this.end_modal();
    }
     update(ctx) {
      for (var t of this.transdata.types) {
          t.update(ctx, this.transdata);
      }
    }
  }
  _ESClass.register(TransformOp);
  _es6_module.add_class(TransformOp);
  TransformOp = _es6_module.add_export('TransformOp', TransformOp);
  class TranslateOp extends TransformOp {
     constructor(user_start_mpos, datamode) {
      super(user_start_mpos, datamode);
    }
    static  tooldef() {
      return {uiname: "Translate", 
     apiname: "spline.translate", 
     description: "Move geometry around", 
     is_modal: true, 
     inputs: ToolOp.inherit({translation: new Vec3Property(undefined, "translation", "translation", "translation")})}
    }
     on_mousemove(event) {
      let first=this.first;
      super.on_mousemove(event);
      if (this.modaldata===undefined) {
          console.trace("ERROR: corrupted modal event call in TransformOp");
          return ;
      }
      if (first) {
          return ;
      }
      var md=this.modaldata;
      var ctx=this.modal_ctx;
      var td=this.transdata;
      let view2d=ctx.view2d;
      var start=mousemove_cachering.next(), off=mousemove_cachering.next();
      start.load(md.start_mpos);
      off.load(md.mpos);
      ctx.view2d.unproject(start);
      ctx.view2d.unproject(off);
      off.sub(start);
      off.mulScalar(view2d.dpi_scale);
      this.inputs.translation.setValue(off);
      this.exec(ctx);
      this.post_mousemove(event);
    }
     exec(ctx) {
      var td=this.modal_running ? this.transdata : this.ensure_transdata(ctx);
      var mat=new Matrix4();
      var off=this.inputs.translation.data;
      if (this.inputs.constrain.data) {
          off = new Vector3(off);
          off.mul(this.inputs.constraint_axis.data);
      }
      mat.makeIdentity();
      mat.translate(off[0], off[1], 0);
      for (var d of td.data) {
          d.type.apply(ctx, td, d, mat, d.w);
      }
      this.update(ctx);
      if (!this.modal_running) {
          ctx.frameset.on_ctx_update(ctx);
          delete this.transdata;
      }
    }
  }
  _ESClass.register(TranslateOp);
  _es6_module.add_class(TranslateOp);
  TranslateOp = _es6_module.add_export('TranslateOp', TranslateOp);
  class NonUniformScaleOp extends TransformOp {
     constructor(user_start_mpos, datamode) {
      super(user_start_mpos, datamode);
    }
    static  tooldef() {
      return {uiname: "Non-Uniform Scale", 
     apiname: "spline.nonuniform_scale", 
     description: "Resize geometry", 
     is_modal: true, 
     inputs: ToolOp.inherit({scale: new Vec3Property(undefined, "scale", "scale", "scale")})}
    }
     on_mousemove(event) {
      super.on_mousemove(event);
      var md=this.modaldata;
      var ctx=this.modal_ctx;
      var td=this.transdata;
      var scale=mousemove_cachering.next();
      var off1=mousemove_cachering.next();
      var off2=mousemove_cachering.next();
      off1.load(md.mpos).sub(td.scenter).vectorLength();
      off2.load(md.start_mpos).sub(td.scenter).vectorLength();
      scale[0] = off1[0]!=off2[0]&&off2[0]!=0.0 ? off1[0]/off2[0] : 1.0;
      scale[1] = off1[1]!=off2[1]&&off2[1]!=0.0 ? off1[1]/off2[1] : 1.0;
      scale[2] = 1.0;
      this.inputs.scale.setValue(scale);
      this.exec(ctx);
      this.post_mousemove(event);
    }
     exec(ctx) {
      var td=this.modal_running ? this.transdata : this.ensure_transdata(ctx);
      var mat=new Matrix4();
      var scale=this.inputs.scale.data;
      var cent=td.center;
      mat.makeIdentity();
      if (this.inputs.constrain.data) {
          scale = new Vector3(scale);
          let caxis=this.inputs.constraint_axis.data;
          for (let i=0; i<3; i++) {
              scale[i]+=(1.0-scale[i])*(1.0-caxis[i]);
          }
      }
      mat.translate(cent[0], cent[1], 0);
      mat.scale(scale[0], scale[1], scale[2]);
      mat.translate(-cent[0], -cent[1], 0);
      for (var d of td.data) {
          d.type.apply(ctx, td, d, mat, d.w);
      }
      this.update(ctx);
      if (!this.modal_running) {
          ctx.frameset.on_ctx_update(ctx);
          delete this.transdata;
      }
    }
  }
  _ESClass.register(NonUniformScaleOp);
  _es6_module.add_class(NonUniformScaleOp);
  NonUniformScaleOp = _es6_module.add_export('NonUniformScaleOp', NonUniformScaleOp);
  class ScaleOp extends TransformOp {
     constructor(user_start_mpos, datamode) {
      super(user_start_mpos, datamode);
    }
    static  tooldef() {
      return {uiname: "Scale", 
     apiname: "spline.scale", 
     description: "Resize geometry", 
     is_modal: true, 
     inputs: ToolOp.inherit({scale: new Vec3Property(undefined, "scale", "scale", "scale")})}
    }
     on_mousemove(event) {
      super.on_mousemove(event);
      var md=this.modaldata;
      var ctx=this.modal_ctx;
      var td=this.transdata;
      var scale=mousemove_cachering.next();
      var off=mousemove_cachering.next();
      var l1=off.load(md.mpos).sub(td.scenter).vectorLength();
      var l2=off.load(md.start_mpos).sub(td.scenter).vectorLength();
      scale[0] = scale[1] = l1/l2;
      scale[2] = 1.0;
      this.inputs.scale.setValue(scale);
      this.exec(ctx);
      this.post_mousemove(event);
    }
     exec(ctx) {
      var td=this.modal_running ? this.transdata : this.ensure_transdata(ctx);
      var mat=new Matrix4();
      var scale=this.inputs.scale.data;
      var cent=td.center;
      mat.makeIdentity();
      if (this.inputs.constrain.data) {
          scale = new Vector3(scale);
          let caxis=this.inputs.constraint_axis.data;
          for (let i=0; i<3; i++) {
              scale[i]+=(1.0-scale[i])*(1.0-caxis[i]);
          }
      }
      mat.translate(cent[0], cent[1], 0);
      mat.scale(scale[0], scale[1], scale[2]);
      mat.translate(-cent[0], -cent[1], 0);
      for (var d of td.data) {
          d.type.apply(ctx, td, d, mat, d.w);
      }
      this.update(ctx);
      if (!this.modal_running) {
          ctx.frameset.on_ctx_update(ctx);
          delete this.transdata;
      }
    }
  }
  _ESClass.register(ScaleOp);
  _es6_module.add_class(ScaleOp);
  ScaleOp = _es6_module.add_export('ScaleOp', ScaleOp);
  class RotateOp extends TransformOp {
    
     constructor(user_start_mpos, datamode) {
      super(user_start_mpos, datamode);
      this.angle_sum = 0.0;
    }
    static  tooldef() {
      return {uiname: "Rotate", 
     apiname: "spline.rotate", 
     description: "Rotate geometry", 
     is_modal: true, 
     inputs: ToolOp.inherit({angle: new FloatProperty(undefined, "angle", "angle", "angle")})}
    }
     on_mousemove(event) {
      super.on_mousemove(event);
      var md=this.modaldata;
      var ctx=this.modal_ctx;
      var td=this.transdata;
      var off=mousemove_cachering.next();
      this.reset_drawlines();
      var l1=off.load(md.mpos).sub(td.scenter).vectorLength();
      var l2=off.load(md.start_mpos).sub(td.scenter).vectorLength();
      var dl=this.new_drawline(md.mpos, td.scenter);
      ctx.view2d.unproject(dl.v1), ctx.view2d.unproject(dl.v2);
      var angle=Math.atan2(md.start_mpos[0]-td.scenter[0], md.start_mpos[1]-td.scenter[1])-Math.atan2(md.mpos[0]-td.scenter[0], md.mpos[1]-td.scenter[1]);
      this.angle_sum+=angle;
      md.start_mpos.load(md.mpos);
      this.inputs.angle.setValue(this.angle_sum);
      this.exec(ctx);
      this.post_mousemove(event);
    }
     exec(ctx) {
      var td=this.modal_running ? this.transdata : this.ensure_transdata(ctx);
      var mat=new Matrix4();
      var cent=td.center;
      mat.makeIdentity();
      mat.translate(cent[0], cent[1], 0);
      mat.rotate(this.inputs.angle.data, 0, 0, 1);
      mat.translate(-cent[0], -cent[1], 0);
      for (var d of td.data) {
          d.type.apply(ctx, td, d, mat, d.w);
      }
      this.update(ctx);
      if (!this.modal_running) {
          ctx.frameset.on_ctx_update(ctx);
          delete this.transdata;
      }
    }
  }
  _ESClass.register(RotateOp);
  _es6_module.add_class(RotateOp);
  RotateOp = _es6_module.add_export('RotateOp', RotateOp);
}, '/dev/fairmotion/src/editors/viewport/transform.js');
es6_module_define('transform_ops', ["./multires/multires_transdata.js", "../../curve/spline_types.js", "../../wasm/native_api.js", "../../util/mathlib.js", "../events.js", "./transform.js", "../../core/toolops_api.js", "./transdata.js", "../../core/toolprops.js", "./selectmode.js", "../dopesheet/dopesheet_transdata.js"], function _transform_ops_module(_es6_module) {
  var MinMax=es6_import_item(_es6_module, '../../util/mathlib.js', 'MinMax');
  var TransformOp=es6_import_item(_es6_module, './transform.js', 'TransformOp');
  var ScaleOp=es6_import_item(_es6_module, './transform.js', 'ScaleOp');
  var NonUniformScaleOp=es6_import_item(_es6_module, './transform.js', 'NonUniformScaleOp');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var MResTransData=es6_import_item(_es6_module, './multires/multires_transdata.js', 'MResTransData');
  var Vec3Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec3Property');
  var BoolProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'BoolProperty');
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var CollectionProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'CollectionProperty');
  var TPropFlags=es6_import_item(_es6_module, '../../core/toolprops.js', 'TPropFlags');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var ModalStates=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ModalStates');
  var TransDataItem=es6_import_item(_es6_module, './transdata.js', 'TransDataItem');
  var TransDataType=es6_import_item(_es6_module, './transdata.js', 'TransDataType');
  var TransDopeSheetType=es6_import_item(_es6_module, '../dopesheet/dopesheet_transdata.js', 'TransDopeSheetType');
  var KeyMap=es6_import_item(_es6_module, '../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../events.js', 'EventHandler');
  var clear_jobs=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs');
  var clear_jobs_except_latest=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs_except_latest');
  var clear_jobs_except_first=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs_except_first');
  var JobTypes=es6_import_item(_es6_module, '../../wasm/native_api.js', 'JobTypes');
  var Vec2Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec2Property');
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  class WidgetResizeOp extends TransformOp {
     constructor(user_start_mpos, datamode) {
      super(user_start_mpos, datamode);
    }
    static  tooldef() {
      return {uiname: "Resize", 
     apiname: "spline.widget_resize", 
     description: "Resize geometry", 
     is_modal: true, 
     inputs: ToolOp.inherit({translation: new Vec2Property(), 
      scale: new Vec2Property(), 
      rotation: new FloatProperty(0.0), 
      pivot: new Vec2Property()}), 
     outputs: {}}
    }
    static  _get_bounds(minmax, spline, ctx) {
      let totsel=0;
      minmax.reset();
      for (let v of spline.verts.selected.editable(ctx)) {
          minmax.minmax(v);
          totsel++;
      }
      if (ctx.view2d.selectmode&SelMask.HANDLE) {
          for (let h of spline.handles.selected.editable(ctx)) {
              minmax.minmax(h);
              totsel++;
          }
      }
      for (let seg of spline.segments.selected.editable(ctx)) {
          let aabb=seg.aabb;
          minmax.minmax(aabb[0]);
          minmax.minmax(aabb[1]);
      }
      return totsel;
    }
    static  create_widgets(manager, ctx) {
      let spline=ctx.spline;
      let minmax=new MinMax(2);
      let totsel=WidgetResizeOp._get_bounds(minmax, spline, ctx);
      if (totsel<2) {
          return ;
      }
      let cent=new Vector2(minmax.min).add(minmax.max).mulScalar(0.5);
      let widget=manager.create(this);
      let w=(minmax.max[0]-minmax.min[0])*0.5;
      let h=(minmax.max[1]-minmax.min[1])*0.5;
      let len=9;
      let outline=widget.outline([-w, -h], [w, h], "outline", [0.4, 0.4, 0.4, 0.7]);
      let larrow=widget.arrow([0, 0], [0, 0], "l", [0, 0, 0, 1.0]);
      let rarrow=widget.arrow([0, 0], [0, 0], "r", [0, 0, 0, 1.0]);
      let tarrow=widget.arrow([0, 0], [0, 0], "t", [0, 0, 0, 1.0]);
      let barrow=widget.arrow([0, 0], [0, 0], "b", [0, 0, 0, 1.0]);
      let corners=new Array(4);
      for (let i=0; i<4; i++) {
          corners[i] = widget.arrow([0, 0], [0, 0], i, [0, 0, 0, 1.0]);
      }
      let signs=[[-1, -1], [-1, 1], [1, 1], [1, -1]];
      let set_handles=() =>        {
        rarrow.v1[0] = w, rarrow.v1[1] = 0.0;
        rarrow.v2[0] = w+len, rarrow.v2[1] = 0.0;
        larrow.v1[0] = -w, larrow.v1[1] = 0.0;
        larrow.v2[0] = -w-len, larrow.v2[1] = 0.0;
        tarrow.v1[0] = 0, tarrow.v1[1] = h;
        tarrow.v2[0] = 0, tarrow.v2[1] = h+len;
        barrow.v1[0] = 0, barrow.v1[1] = -h;
        barrow.v2[0] = 0, barrow.v2[1] = -h-len;
        outline.v1[0] = -w, outline.v1[1] = -h;
        outline.v2[0] = w, outline.v2[1] = h;
        for (let i=0; i<4; i++) {
            let c=corners[i];
            c.v1[0] = w*signs[i][0], c.v1[1] = h*signs[i][1];
            c.v2[0] = (w+len)*signs[i][0], c.v2[1] = (h+len)*signs[i][1];
        }
      };
      set_handles();
      widget.co = new Vector2(cent);
      widget.on_tick = function (ctx) {
        let totsel=WidgetResizeOp._get_bounds(minmax, spline, ctx);
        let update=false;
        if (totsel<2) {
            this.hide();
            return ;
        }
        else {
          update = this.hidden;
          this.unhide();
        }
        let cx=(minmax.min[0]+minmax.max[0])*0.5;
        let cy=(minmax.min[1]+minmax.max[1])*0.5;
        let w2=(minmax.max[0]-minmax.min[0])*0.5;
        let h2=(minmax.max[1]-minmax.min[1])*0.5;
        update = update||cx!=this.co[0]||cy!=this.co[1];
        update = update||w2!=w||h2!=h;
        if (update) {
            w = w2, h = h2;
            this.co[0] = cx;
            this.co[1] = cy;
            set_handles();
            this.update();
        }
      };
      let corner_onclick=function (e, view2d, id) {
        let ci=id;
        let anchor=corners[(ci+2)%4];
        let co=new Vector3();
        co[0] = anchor.v1[0]+widget.co[0];
        co[1] = anchor.v1[1]+widget.co[1];
        let mpos=new Vector3([e.origX, e.origY, 0.0]);
        let toolop=e.ctrlKey ? new ScaleOp(mpos, view2d.selectmode) : new NonUniformScaleOp(mpos, view2d.selectmode);
        toolop.inputs.edit_all_layers.setValue(view2d.ctx.edit_all_layers);
        toolop.inputs.use_pivot.setValue(true);
        toolop.inputs.pivot.setValue(co);
        view2d.ctx.toolstack.exec_tool(toolop);
        return true;
      };
      for (let i=0; i<4; i++) {
          corners[i].on_click = corner_onclick;
      }
      larrow.on_click = rarrow.on_click = function (e, view2d, id) {
        let mpos=new Vector3([e.origX, e.origY, 0.0]);
        let toolop=new ScaleOp(mpos, view2d.selectmode);
        let co=new Vector3(widget.co);
        co[2] = 1.0;
        if (!e.shiftKey) {
            co[0]+=id==='l' ? w : -w;
        }
        toolop.inputs.use_pivot.setValue(true);
        toolop.inputs.pivot.setValue(co);
        toolop.inputs.edit_all_layers.setValue(view2d.ctx.edit_all_layers);
        toolop.inputs.constrain.setValue(true);
        toolop.inputs.constraint_axis.setValue(new Vector3([1, 0, 0]));
        view2d.ctx.toolstack.exec_tool(toolop);
        return true;
      };
      tarrow.on_click = barrow.on_click = function (e, view2d, id) {
        let mpos=new Vector3([e.origX, e.origY, 0.0]);
        let toolop=new ScaleOp(mpos, view2d.selectmode);
        let co=new Vector3(widget.co);
        co[2] = 1.0;
        if (!e.shiftKey) {
            co[1]+=id==='b' ? h : -h;
        }
        toolop.inputs.edit_all_layers.setValue(view2d.ctx.edit_all_layers);
        toolop.inputs.use_pivot.setValue(true);
        toolop.inputs.pivot.setValue(co);
        toolop.inputs.constrain.setValue(true);
        toolop.inputs.constraint_axis.setValue(new Vector3([0, 1, 0]));
        view2d.ctx.toolstack.exec_tool(toolop);
        return true;
      };
      return widget;
    }
    static  reset_widgets(op, ctx) {

    }
  }
  _ESClass.register(WidgetResizeOp);
  _es6_module.add_class(WidgetResizeOp);
  WidgetResizeOp = _es6_module.add_export('WidgetResizeOp', WidgetResizeOp);
  class WidgetRotateOp extends TransformOp {
     constructor(user_start_mpos, datamode) {
      super(user_start_mpos, datamode);
    }
    static  tooldef() {
      return {uiname: "Rotate", 
     apiname: "spline.widget_rotate", 
     description: "Rotate geometry", 
     is_modal: true, 
     inputs: ToolOp.inherit({translation: new Vec2Property(), 
      scale: new Vec2Property(), 
      rotation: new FloatProperty(0.0), 
      pivot: new Vec2Property()}), 
     outputs: {}}
    }
    static  _get_bounds(minmax, spline, ctx) {
      let totsel=0;
      minmax.reset();
      for (let v of spline.verts.selected.editable(ctx)) {
          minmax.minmax(v);
          totsel++;
      }
      if (ctx.view2d.selectmode&SelMask.HANDLE) {
          for (let h of spline.handles.selected.editable(ctx)) {
              minmax.minmax(h);
              totsel++;
          }
      }
      for (let seg of spline.segments.selected.editable(ctx)) {
          let aabb=seg.aabb;
          minmax.minmax(aabb[0]);
          minmax.minmax(aabb[1]);
      }
      return totsel;
    }
    static  create_widgets(manager, ctx) {
      let spline=ctx.spline;
      let minmax=new MinMax(2);
      let totsel=WidgetResizeOp._get_bounds(minmax, spline, ctx);
      if (totsel<2) {
          return ;
      }
      let cent=new Vector2(minmax.min).add(minmax.max).mulScalar(0.5);
      let widget=manager.create(this);
      let w=(minmax.max[0]-minmax.min[0])*0.5;
      let h=(minmax.max[1]-minmax.min[1])*0.5;
      let len=9;
      if (w==0&h==0) {
          return ;
      }
      let r=Math.sqrt(w*w+h*h)*Math.sqrt(2)*0.5;
      let circle=widget.circle([0, 0], r, "rotate_circle", [0.4, 0.4, 0.4, 0.7]);
      widget.co = new Vector2(cent);
      widget.on_tick = function (ctx) {
        let totsel=WidgetResizeOp._get_bounds(minmax, spline, ctx);
        let update=false;
        if (totsel<2) {
            this.hide();
            return ;
        }
        else {
          update = this.hidden;
          this.unhide();
        }
        let cx=(minmax.min[0]+minmax.max[0])*0.5;
        let cy=(minmax.min[1]+minmax.max[1])*0.5;
        let w2=(minmax.max[0]-minmax.min[0])*0.5;
        let h2=(minmax.max[1]-minmax.min[1])*0.5;
        update = update||cx!=this.co[0]||cy!=this.co[1];
        update = update||w2!=w||h2!=h;
        if (update) {
            this.co[0] = cx;
            this.co[1] = cy;
            this.update();
        }
        return ;
        if (update) {
            w = w2, h = h2;
            this.co[0] = cx;
            this.co[1] = cy;
            set_handles();
            this.update();
        }
      };
      let corner_onclick=function (e, view2d, id) {
        let ci=id;
        let anchor=corners[(ci+2)%4];
        let co=new Vector3();
        co[0] = anchor.v1[0]+widget.co[0];
        co[1] = anchor.v1[1]+widget.co[1];
        let mpos=new Vector3([e.origX, e.origY, 0.0]);
        let toolop=e.ctrlKey ? new ScaleOp(mpos, view2d.selectmode) : new NonUniformScaleOp(mpos, view2d.selectmode);
        toolop.inputs.use_pivot.setValue(true);
        toolop.inputs.pivot.setValue(co);
        view2d.ctx.toolstack.exec_tool(toolop);
        return true;
      };
      circle.on_click = function (e, view2d, id) {
        let mpos=new Vector3([e.origX, e.origY, 0.0]);
        let toolop=new ScaleOp(mpos, view2d.selectmode);
        let co=new Vector3(widget.co);
        if (!e.shiftKey) {
            co[1]+=id=='b' ? h : -h;
        }
        toolop.inputs.use_pivot.setValue(true);
        toolop.inputs.pivot.setValue(co);
        toolop.inputs.constrain.setValue(true);
        toolop.inputs.constraint_axis.setValue(new Vector3([0, 1, 0]));
        view2d.ctx.toolstack.exec_tool(toolop);
        return true;
      };
      return widget;
    }
    static  reset_widgets(op, ctx) {

    }
  }
  _ESClass.register(WidgetRotateOp);
  _es6_module.add_class(WidgetRotateOp);
  WidgetRotateOp = _es6_module.add_export('WidgetRotateOp', WidgetRotateOp);
}, '/dev/fairmotion/src/editors/viewport/transform_ops.js');
es6_module_define('transform_query', ["./transform_spline.js", "./transform_object.js", "./selectmode.js", "./transdata.js"], function _transform_query_module(_es6_module) {
  var TransDataType=es6_import_item(_es6_module, './transdata.js', 'TransDataType');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var TransSceneObject=es6_import_item(_es6_module, './transform_object.js', 'TransSceneObject');
  var TransSplineVert=es6_import_item(_es6_module, './transform_spline.js', 'TransSplineVert');
  function getTransDataType(ctx) {
    if (ctx.view2d.selectmode==SelMask.OBJECT) {
        return TransSceneObject;
    }
    else {
      return TransSplineVert;
    }
  }
  getTransDataType = _es6_module.add_export('getTransDataType', getTransDataType);
}, '/dev/fairmotion/src/editors/viewport/transform_query.js');
es6_module_define('transform_object', ["./selectmode.js", "../../scene/sceneobject.js", "./transdata.js", "./transform_spline.js", "../../path.ux/scripts/util/vectormath.js"], function _transform_object_module(_es6_module) {
  var TransDataType=es6_import_item(_es6_module, './transdata.js', 'TransDataType');
  var TransData=es6_import_item(_es6_module, './transdata.js', 'TransData');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var TransDataItem=es6_import_item(_es6_module, './transdata.js', 'TransDataItem');
  var TransSplineVert=es6_import_item(_es6_module, './transform_spline.js', 'TransSplineVert');
  var UpdateFlags=es6_import_item(_es6_module, '../../scene/sceneobject.js', 'UpdateFlags');
  es6_import(_es6_module, '../../path.ux/scripts/util/vectormath.js');
  let iter_cachering=new cachering(() =>    {
    let ret=new TransDataItem();
    ret.start_data = new Matrix4();
    return ret;
  }, 512);
  class TransSceneObject extends TransDataType {
    static  iter_data(ctx, td) {
      return (function* () {
        let scene=ctx.scene;
        for (let ob in scene.objects.selected_editable) {
            let ti=iter_cachering.next();
            ob.recalcMatrix();
            ti.type = TransSceneObject;
            ti.data = ob;
            ti.start_data.load(ob.matrix);
            yield ti;
        }
      })();
    }
    static  getDataPath(ctx, td, ti) {
      return `scene.objects[${ti.data.id}]`;
    }
    static  gen_data(ctx, td, data) {
      let scene=ctx.scene;
      for (let ob in scene.objects.selected_editable) {
          let ti=new TransDataItem();
          ob.recalcMatrix();
          ti.type = TransSceneObject;
          ti.data = ob;
          ti.start_data = new Matrix4(ob.matrix);
          data.push(ti);
      }
    }
    static  calc_prop_distances(ctx, td, data) {

    }
    static  update(ctx, td) {
      for (let ti of td.data) {
          if (ti.type===TransSceneObject) {
              ti.data.update(UpdateFlags.TRANSFORM);
          }
      }
      window.redraw_viewport();
    }
    static  undo(ctx, undo_obj) {
      let scene=ctx.scene;
      for (let id in undo_obj.object) {
          let ob=scene.get(id);
          let ud=undo_obj.object[id];
          ob.loc.load(ud.loc);
          ob.scale.load(ud.scale);
          ob.rot = ud.rot;
          ob.matrix.load(ud.matrix);
          ob.update();
          ob.recalcAABB();
      }
      window.redraw_viewport();
    }
    static  undo_pre(ctx, td, undo_obj) {
      let ud=undo_obj["object"] = {};
      let scene=ctx.scene;
      for (let ob in scene.objects.selected_editable) {
          ud[ob.id] = {matrix: new Matrix4(ob.matrix), 
       loc: new Vector2(ob.loc), 
       scale: new Vector2(ob.scale), 
       rot: ob.rot};
      }
    }
    static  apply(ctx, td, item, mat, w) {
      let rot=new Vector3(), loc=new Vector3(), scale=new Vector3();
      for (let ti of td.data) {
          if (ti.type!==TransSceneObject) {
              continue;
          }
          let ob=ti.data;
          let mat=ob.matrix;
          mat.load(ti.start_data).multiply(mat);
          if (mat.decompose(loc, rot, scale)) {
              ob.loc.load(loc);
              ob.scale.load(scale);
              ob.rot = rot[2];
          }
      }
    }
    static  calc_draw_aabb(ctx, td, minmax) {

    }
    static  aabb(ctx, td, item, minmax, selected_only) {

    }
  }
  _ESClass.register(TransSceneObject);
  _es6_module.add_class(TransSceneObject);
  TransSceneObject = _es6_module.add_export('TransSceneObject', TransSceneObject);
  TransSceneObject.selectmode = SelMask.OBJECT;
}, '/dev/fairmotion/src/editors/viewport/transform_object.js');
es6_module_define('transform_spline', ["./selectmode.js", "./transdata.js", "../dopesheet/dopesheet_transdata.js", "../../core/toolprops.js", "../../core/toolops_api.js", "../../util/mathlib.js", "../../wasm/native_api.js", "../events.js", "../../curve/spline_types.js", "./view2d_base.js"], function _transform_spline_module(_es6_module) {
  var MinMax=es6_import_item(_es6_module, '../../util/mathlib.js', 'MinMax');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var Vec3Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec3Property');
  var BoolProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'BoolProperty');
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var CollectionProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'CollectionProperty');
  var TPropFlags=es6_import_item(_es6_module, '../../core/toolprops.js', 'TPropFlags');
  var EnumProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'EnumProperty');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var ModalStates=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ModalStates');
  var TransDataItem=es6_import_item(_es6_module, './transdata.js', 'TransDataItem');
  var TransDataType=es6_import_item(_es6_module, './transdata.js', 'TransDataType');
  var TransDopeSheetType=es6_import_item(_es6_module, '../dopesheet/dopesheet_transdata.js', 'TransDopeSheetType');
  var SessionFlags=es6_import_item(_es6_module, './view2d_base.js', 'SessionFlags');
  var KeyMap=es6_import_item(_es6_module, '../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../events.js', 'EventHandler');
  var clear_jobs=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs');
  var clear_jobs_except_latest=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs_except_latest');
  var clear_jobs_except_first=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs_except_first');
  var JobTypes=es6_import_item(_es6_module, '../../wasm/native_api.js', 'JobTypes');
  var TransData=es6_import_item(_es6_module, './transdata.js', 'TransData');
  var TransDataType=es6_import_item(_es6_module, './transdata.js', 'TransDataType');
  var _tsv_apply_tmp1=new Vector3();
  var _tsv_apply_tmp2=new Vector3();
  var post_mousemove_cachering=cachering.fromConstructor(Vector3, 64);
  var mousemove_cachering=cachering.fromConstructor(Vector3, 64);
  class TransSplineVert extends TransDataType {
    static  apply(ctx, td, item, mat, w) {
      var co=_tsv_apply_tmp1;
      var v=item.data;
      if (w==0.0)
        return ;
      co.load(item.start_data);
      co[2] = 0.0;
      co.multVecMatrix(mat);
      v.load(co).sub(item.start_data).mulScalar(w).add(item.start_data);
      v.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      if (v.type==SplineTypes.HANDLE) {
          var seg=v.owning_segment;
          seg.update();
          seg.flag|=SplineFlags.FRAME_DIRTY;
          seg.v1.flag|=SplineFlags.UPDATE;
          seg.v2.flag|=SplineFlags.UPDATE;
          var hpair=seg.update_handle(v);
          if (hpair!=undefined) {
              hpair.flag|=SplineFlags.FRAME_DIRTY;
          }
      }
      else {
        for (var j=0; j<v.segments.length; j++) {
            v.segments[j].flag|=SplineFlags.FRAME_DIRTY;
            v.segments[j].h1.flag|=SplineFlags.FRAME_DIRTY;
            v.segments[j].h2.flag|=SplineFlags.FRAME_DIRTY;
            v.segments[j].update();
            var hpair=v.segments[j].update_handle(v.segments[j].handle(v));
            if (hpair!=undefined) {
                hpair.flag|=SplineFlags.FRAME_DIRTY;
            }
        }
      }
    }
    static  getDataPath(ctx, td, ti) {
      return `spline.verts[${ti.data.eid}]`;
    }
    static  undo_pre(ctx, td, undo_obj) {
      var doneset=new set();
      var undo=[];
      function push_vert(v) {
        if (doneset.has(v))
          return ;
        doneset.add(v);
        undo.push(v.eid);
        undo.push(v[0]);
        undo.push(v[1]);
        undo.push(v[2]);
      }
      for (var i=0; i<td.data.length; i++) {
          var d=td.data[i];
          if (d.type!==TransSplineVert)
            continue;
          var v=d.data;
          if (v.type==SplineTypes.HANDLE) {
              if (v.hpair!=undefined) {
                  push_vert(v.hpair);
              }
              if (v.owning_vertex!==undefined&&v.owning_vertex.segments.length==2) {
                  var ov=v.owning_vertex;
                  for (var j=0; j<ov.segments.length; j++) {
                      var s=ov.segments[j];
                      push_vert(s.h1);
                      push_vert(s.h2);
                  }
              }
              else 
                if (v.owning_vertex===undefined) {
                  console.warn("Orphaned handle!", v.eid, v);
              }
          }
          push_vert(v);
      }
      undo_obj['svert'] = undo;
    }
    static  undo(ctx, undo_obj) {
      var spline=ctx.spline;
      var i=0;
      var undo=undo_obj['svert'];
      var edit_all_layers=undo.edit_all_layers;
      while (i<undo.length) {
        var eid=undo[i++];
        var v=spline.eidmap[eid];
        if (v==undefined) {
            console.log("Transform undo error!", eid);
            i+=4;
            continue;
        }
        v[0] = undo[i++];
        v[1] = undo[i++];
        v[2] = undo[i++];
        if (v.type==SplineTypes.HANDLE&&!v.use) {
            var seg=v.segments[0];
            seg.update();
            seg.flag|=SplineFlags.FRAME_DIRTY;
            seg.v1.flag|=SplineFlags.UPDATE;
            seg.v2.flag|=SplineFlags.UPDATE;
        }
        else 
          if (v.type==SplineTypes.VERTEX) {
            v.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
            for (var j=0; j<v.segments.length; j++) {
                v.segments[j].update();
                v.segments[j].flag|=SplineFlags.FRAME_DIRTY;
                v.segments[j].h1.flag|=SplineFlags.FRAME_DIRTY;
                v.segments[j].h2.flag|=SplineFlags.FRAME_DIRTY;
            }
        }
      }
      spline.resolve = 1;
    }
    static  update(ctx, td) {
      var spline=ctx.spline;
      spline.resolve = 1;
    }
    static  calc_prop_distances(ctx, td, data) {
      var doprop=td.doprop;
      var proprad=td.propradius;
      var spline=ctx.spline;
      var propfacs={};
      var shash=spline.build_shash();
      var tdmap={};
      var layer=td.layer;
      var edit_all_layers=td.edit_all_layers;
      for (var tv of data) {
          if (tv.type!==TransSplineVert)
            continue;
          tdmap[tv.data.eid] = tv;
      }
      for (var v of spline.verts.selected.editable(ctx)) {
          shash.forEachPoint(v, proprad, function (v2, dis) {
            if (v2.flag&SplineFlags.SELECT)
              return ;
            if (v2.hidden)
              return ;
            if (!v2.in_layer(layer))
              return ;
            if (!(v2.eid in propfacs)) {
                propfacs[v2.eid] = dis;
            }
            propfacs[v2.eid] = Math.min(propfacs[v2.eid], dis);
            v2.flag|=SplineFlags.UPDATE;
          });
      }
      for (var k in propfacs) {
          var v=spline.eidmap[k];
          var d=propfacs[k];
          var tv=tdmap[k];
          tv.dis = d;
      }
    }
    static  gen_data(ctx, td, data) {
      var doprop=td.doprop;
      var proprad=td.propradius;
      var selmap={};
      var spline=ctx.spline;
      var tdmap={};
      var layer=td.layer;
      var edit_all_layers=td.edit_all_layers;
      for (var i=0; i<2; i++) {
          for (var v of i ? spline.handles.selected.editable(ctx) : spline.verts.selected.editable(ctx)) {
              var co=new Vector3(v);
              if (i) {
                  var ov=v.owning_segment.handle_vertex(v);
                  if (ov!=undefined&&v.hidden&&ov.hidden)
                    continue;
              }
              else 
                if (v.hidden) {
                  continue;
              }
              selmap[v.eid] = 1;
              var td=new TransDataItem(v, TransSplineVert, co);
              data.push(td);
              tdmap[v.eid] = td;
          }
      }
      if (!doprop)
        return ;
      var propfacs={};
      var shash=spline.build_shash();
      for (var si=0; si<2; si++) {
          var list=si ? spline.handles : spline.verts;
          for (var v of list) {
              if (!edit_all_layers&&!v.in_layer(layer))
                continue;
              if (si) {
                  var ov=v.owning_segment.handle_vertex(v);
                  if (ov!=undefined&&v.hidden&&ov.hidden)
                    continue;
              }
              else 
                if (v.hidden) {
                  continue;
              }
              if (v.eid in selmap)
                continue;
              var co=new Vector3(v);
              var td=new TransDataItem(v, TransSplineVert, co);
              data.push(td);
              td.dis = 10000;
              tdmap[v.eid] = td;
          }
      }
      console.log("proprad", proprad);
      for (var v of spline.verts.selected.editable(ctx)) {
          shash.forEachPoint(v, proprad, function (v2, dis) {
            if (v2.flag&SplineFlags.SELECT)
              return ;
            if (!edit_all_layers&&!v2.in_layer(layer))
              return ;
            if (v2.type==SplineTypes.HANDLE&&v2.hidden&&(v2.owning_vertex==undefined||v2.owning_vertex.hidden))
              return ;
            if (v2.type==SplineTypes.VERTEX&&v2.hidden)
              return ;
            if (!(v2.eid in propfacs)) {
                propfacs[v2.eid] = dis;
            }
            propfacs[v2.eid] = Math.min(propfacs[v2.eid], dis);
            v2.flag|=SplineFlags.UPDATE;
            for (var i=0; i<v2.segments.length; i++) {
                v2.segments[i].update();
            }
          });
      }
      for (var k in propfacs) {
          var v=spline.eidmap[k];
          var d=propfacs[k];
          var tv=tdmap[k];
          tv.dis = d;
      }
    }
    static  calc_draw_aabb(ctx, td, minmax) {
      var vset={};
      var sset={};
      var hset={};
      for (var i=0; i<td.data.length; i++) {
          var d=td.data[i];
          if (d.type!=TransSplineVert)
            continue;
          if (d.data.type==SplineTypes.HANDLE)
            hset[d.data.eid] = 1;
      }
      function rec_walk(v, depth) {
        if (depth>2)
          return ;
        if (v==undefined)
          return ;
        if (v.eid in vset)
          return ;
        vset[v.eid] = 1;
        minmax.minmax(v);
        for (var i=0; i<v.segments.length; i++) {
            var seg=v.segments[i];
            if (!(seg.eid in sset)) {
                sset[seg.eid] = 1;
                seg.update_aabb();
                minmax.minmax(seg._aabb[0]);
                minmax.minmax(seg._aabb[1]);
            }
            var v2=seg.other_vert(v);
            if (v2!=undefined&&(v2.flag&SplineFlags.SELECT))
              continue;
            if (v.type==SplineTypes.HANDLE&&!(v.eid in hset)) {
                vset[v.eid] = 1;
            }
            else {
              rec_walk(seg.other_vert(v), depth+1);
            }
        }
      }
      for (var i=0; i<td.data.length; i++) {
          var d=td.data[i];
          if (d.type!=TransSplineVert)
            continue;
          if (d.w<=0.0)
            continue;
          var v=d.data;
          if (v.eid in vset)
            continue;
          if (v.type==SplineTypes.HANDLE)
            v = v.owning_vertex;
          for (var j=0; j<v.segments.length; j++) {
              var seg=v.segments[j];
              if (!seg.l)
                continue;
              var _i1=0, l=seg.l;
              do {
                var faabb=l.f._aabb;
                minmax.minmax(faabb[0]);
                minmax.minmax(faabb[1]);
                if (_i1++>100) {
                    console.log("infinite loop!");
                    break;
                }
                l = l.radial_next;
              } while (l!=seg.l);
              
          }
          rec_walk(v, 0);
      }
    }
    static  aabb(ctx, td, item, minmax, selected_only) {
      var co=_tsv_apply_tmp2;
      if (item.w<=0.0)
        return ;
      if (item.data.hidden)
        return ;
      co.load(item.data);
      co[2] = 0.0;
      minmax.minmax(co);
      for (var i=0; i<item.data.segments.length; i++) {
          var seg=item.data.segments[i];
          if (selected_only&&!(item.data.flag&SplineFlags.SELECT))
            continue;
          seg.update_aabb();
          minmax.minmax(seg.aabb[0]);
          minmax.minmax(seg.aabb[1]);
      }
    }
  }
  _ESClass.register(TransSplineVert);
  _es6_module.add_class(TransSplineVert);
  TransSplineVert = _es6_module.add_export('TransSplineVert', TransSplineVert);
  TransSplineVert.selectmode = SelMask.TOPOLOGY;
}, '/dev/fairmotion/src/editors/viewport/transform_spline.js');
es6_module_define('spline_selectops', ["../../curve/spline_draw.js", "../../curve/spline_types.js", "../../core/toolops_api.js", "../../core/animdata.js", "../../core/toolprops.js"], function _spline_selectops_module(_es6_module) {
  "use strict";
  var $_mh;
  var $_swapt;
  let PI=Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos, asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var BoolProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'BoolProperty');
  var EnumProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'EnumProperty');
  var StringProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'StringProperty');
  var FlagProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FlagProperty');
  var CollectionProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'CollectionProperty');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var SplineVertex=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineSegment');
  var SplineFace=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFace');
  var redraw_element=es6_import_item(_es6_module, '../../curve/spline_draw.js', 'redraw_element');
  var get_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'get_vtime');
  let SelOpModes={AUTO: 0, 
   SELECT: 1, 
   DESELECT: 2}
  SelOpModes = _es6_module.add_export('SelOpModes', SelOpModes);
  class SelectOpBase extends ToolOp {
     constructor(datamode, do_flush, uiname) {
      super(undefined, uiname);
      if (datamode!==undefined)
        this.inputs.datamode.setValue(datamode);
      if (do_flush!==undefined)
        this.inputs.flush.setValue(do_flush);
    }
    static  tooldef() {
      return {inputs: {mode: new EnumProperty("AUTO", SelOpModes, "mode", "mode"), 
      datamode: new IntProperty(0), 
      flush: new BoolProperty(false)}}
    }
    static  invoke(ctx, args) {
      let datamode;
      let ret=new this();
      if ("selectmode" in args) {
          datamode = args["selectmode"];
      }
      else {
        datamode = ctx.selectmode;
      }
      ret.inputs.datamode.setValue(datamode);
      console.log("args", args);
      if ("mode" in args) {
          let mode=args["mode"].toUpperCase().trim();
          ret.inputs.mode.setValue(mode);
      }
      else {
        ret.inputs.mode.setValue("AUTO");
      }
      return ret;
    }
     undo_pre(ctx) {
      let spline=ctx.spline;
      let ud=this._undo = [];
      for (let v of spline.verts.selected) {
          ud.push(v.eid);
      }
      for (let h of spline.handles.selected) {
          ud.push(h.eid);
      }
      for (let s of spline.segments.selected) {
          ud.push(s.eid);
      }
      ud.active_vert = spline.verts.active!==undefined ? spline.verts.active.eid : -1;
      ud.active_handle = spline.handles.active!==undefined ? spline.handles.active.eid : -1;
      ud.active_segment = spline.segments.active!==undefined ? spline.segments.active.eid : -1;
      ud.active_face = spline.faces.active!==undefined ? spline.faces.active.eid : -1;
    }
     undo(ctx) {
      let ud=this._undo;
      let spline=ctx.spline;
      console.log(ctx, spline);
      spline.clear_selection();
      let eidmap=spline.eidmap;
      for (let i=0; i<ud.length; i++) {
          if (!(ud[i] in eidmap)) {
              console.trace("Warning, corruption in SelectOpBase.undo(): '", ud[i], "'.");
              continue;
          }
          let e=eidmap[ud[i]];
          spline.setselect(e, true);
      }
      spline.verts.active = eidmap[ud.active_vert];
      spline.handles.active = eidmap[ud.active_handle];
      spline.segments.active = eidmap[ud.active_segment];
      spline.faces.active = eidmap[ud.active_face];
    }
  }
  _ESClass.register(SelectOpBase);
  _es6_module.add_class(SelectOpBase);
  SelectOpBase = _es6_module.add_export('SelectOpBase', SelectOpBase);
  class SelectOneOp extends SelectOpBase {
     constructor(e=undefined, unique=true, mode=true, datamode=0, do_flush=false) {
      super(datamode, do_flush, "Select Element");
      this.inputs.unique.setValue(unique);
      this.inputs.state.setValue(mode);
      if (e!=undefined)
        this.inputs.eid.setValue(e.eid);
    }
    static  tooldef() {
      return {apiname: "spline.select_one", 
     uiname: "Select Element", 
     inputs: ToolOp.inherit({eid: new IntProperty(-1), 
      state: new BoolProperty(true), 
      set_active: new BoolProperty(true), 
      unique: new BoolProperty(true)}), 
     description: "Select Element"}
    }
     exec(ctx) {
      let spline=ctx.spline;
      let e=spline.eidmap[this.inputs.eid.data];
      if (e==undefined) {
          console.trace("Error in SelectOneOp", this.inputs.eid.data, this);
          return ;
      }
      let state=this.inputs.state.data;
      if (this.inputs.unique.data) {
          state = true;
          for (let e of spline.selected) {
              redraw_element(e);
          }
          spline.clear_selection();
      }
      console.log("selectone!", e, state);
      spline.setselect(e, state);
      if (state&&this.inputs.set_active.data) {
          spline.set_active(e);
      }
      if (this.inputs.flush.data) {
          console.log("flushing data!", this.inputs.datamode.data);
          spline.select_flush(this.inputs.datamode.data);
      }
      redraw_element(e);
    }
  }
  _ESClass.register(SelectOneOp);
  _es6_module.add_class(SelectOneOp);
  SelectOneOp = _es6_module.add_export('SelectOneOp', SelectOneOp);
  class ToggleSelectAllOp extends SelectOpBase {
     constructor() {
      super(undefined, undefined, "Toggle Select All");
    }
    static  tooldef() {
      return {uiname: "Toggle Select All", 
     apiname: "spline.toggle_select_all", 
     icon: Icons.TOGGLE_SEL_ALL, 
     inputs: ToolOp.inherit({})}
    }
     undo_pre(ctx) {
      super.undo_pre(ctx);
      redraw_viewport();
    }
     exec(ctx) {
      console.log("toggle select!");
      let spline=ctx.spline;
      let mode=this.inputs.mode.get_data();
      let layerid=ctx.spline.layerset.active.id;
      let totsel=0.0;
      let iterctx=mode===SelOpModes.AUTO ? {edit_all_layers: false} : ctx;
      if (mode===SelOpModes.AUTO) {
          for (let v of spline.verts.editable(iterctx)) {
              totsel+=v.flag&SplineFlags.SELECT;
          }
          for (let s of spline.segments.editable(iterctx)) {
              totsel+=s.flag&SplineFlags.SELECT;
          }
          for (let f of spline.faces.editable(iterctx)) {
              totsel+=f.flag&SplineFlags.SELECT;
          }
          mode = totsel ? SelOpModes.DESELECT : SelOpModes.SELECT;
      }
      console.log("MODE", mode);
      if (mode===SelOpModes.DESELECT)
        spline.verts.active = undefined;
      for (let v of spline.verts.editable(iterctx)) {
          v.flag|=SplineFlags.REDRAW;
          if (mode===SelOpModes.DESELECT) {
              spline.setselect(v, false);
          }
          else {
            spline.setselect(v, true);
          }
      }
      for (let s of spline.segments.editable(iterctx)) {
          s.flag|=SplineFlags.REDRAW;
          if (mode===SelOpModes.DESELECT) {
              spline.setselect(s, false);
          }
          else {
            spline.setselect(s, true);
          }
      }
      for (let f of spline.faces.editable(iterctx)) {
          f.flag|=SplineFlags.REDRAW;
          if (mode===SelOpModes.DESELECT) {
              spline.setselect(f, false);
          }
          else {
            spline.setselect(f, true);
          }
      }
    }
  }
  _ESClass.register(ToggleSelectAllOp);
  _es6_module.add_class(ToggleSelectAllOp);
  ToggleSelectAllOp = _es6_module.add_export('ToggleSelectAllOp', ToggleSelectAllOp);
  class SelectLinkedOp extends SelectOpBase {
     constructor(mode, datamode) {
      super(datamode);
      if (mode!=undefined)
        this.inputs.mode.setValue(mode);
    }
    static  tooldef() {
      return {uiname: "Select Linked", 
     apiname: "spline.select_linked", 
     inputs: ToolOp.inherit({vertex_eid: new IntProperty(-1)})}
    }
     undo_pre(ctx) {
      super.undo_pre(ctx);
      window.redraw_viewport();
    }
     exec(ctx) {
      let spline=ctx.spline;
      let v=spline.eidmap[this.inputs.vertex_eid.data];
      if (v==undefined) {
          console.trace("Error in SelectLinkedOp");
          return ;
      }
      let state=this.inputs.mode.get_data()!=SelOpModes.AUTO ? 1 : 0;
      let visit=new set();
      let verts=spline.verts;
      function recurse(v) {
        visit.add(v);
        verts.setselect(v, state);
        for (let i=0; i<v.segments.length; i++) {
            let seg=v.segments[i], v2=seg.other_vert(v);
            if (!visit.has(v2)) {
                recurse(v2);
            }
        }
      }
      recurse(v);
      spline.select_flush(this.inputs.datamode.data);
    }
  }
  _ESClass.register(SelectLinkedOp);
  _es6_module.add_class(SelectLinkedOp);
  SelectLinkedOp = _es6_module.add_export('SelectLinkedOp', SelectLinkedOp);
  class HideOp extends SelectOpBase {
     constructor(mode, ghost) {
      super(undefined, undefined, "Hide");
      if (mode!=undefined)
        this.inputs.selmode.setValue(mode);
      if (ghost!=undefined)
        this.inputs.ghost.setValue(ghost);
    }
    static  tooldef() {
      return {apiname: "spline.hide", 
     uiname: "Hide", 
     inputs: ToolOp.inherit({selmode: new IntProperty(1|2), 
      ghost: new BoolProperty(false)}), 
     outputs: ToolOp.inherit({})}
    }
     undo_pre(ctx) {
      super.undo_pre(ctx);
      window.redraw_viewport();
    }
     undo(ctx) {
      let ud=this._undo;
      let spline=ctx.spline;
      for (let i=0; i<ud.length; i++) {
          let e=spline.eidmap[ud[i]];
          e.flag&=~(SplineFlags.HIDE|SplineFlags.GHOST);
      }
      super.undo(ctx);
      window.redraw_viewport();
    }
     exec(ctx) {
      let spline=ctx.spline;
      let mode=this.inputs.selmode.data;
      let ghost=this.inputs.ghost.data;
      let layer=spline.layerset.active;
      for (let elist of spline.elists) {
          if (!(elist.type&mode))
            continue;
          for (let e of elist.selected) {
              if (!(layer.id in e.layers))
                continue;
              e.sethide(true);
              if (ghost) {
                  e.flag|=SplineFlags.GHOST;
              }
              elist.setselect(e, false);
          }
      }
      spline.clear_selection();
      spline.validate_active();
    }
  }
  _ESClass.register(HideOp);
  _es6_module.add_class(HideOp);
  HideOp = _es6_module.add_export('HideOp', HideOp);
  class UnhideOp extends ToolOp {
     constructor(mode, ghost) {
      super(undefined, "Unhide");
      if (mode!=undefined)
        this.inputs.selmode.setValue(mode);
      if (ghost!=undefined)
        this.inputs.ghost.setValue(ghost);
      this._undo = undefined;
    }
    static  tooldef() {
      return {apiname: "spline.unhide", 
     uiname: "Unhide", 
     inputs: ToolOp.inherit({selmode: new IntProperty(1|2), 
      ghost: new BoolProperty(false)}), 
     outputs: ToolOp.inherit({})}
    }
     undo_pre(ctx) {
      let ud=this._undo = [];
      let spline=ctx.spline;
      for (let elist of spline.elists) {
          for (let e of elist) {
              if (e.flag&SplineFlags.HIDE) {
                  ud.push(e.eid);
                  ud.push(e.flag&(SplineFlags.SELECT|SplineFlags.HIDE|SplineFlags.GHOST));
              }
          }
      }
      window.redraw_viewport();
    }
     undo(ctx) {
      let ud=this._undo;
      let spline=ctx.spline;
      let i=0;
      while (i<ud.length) {
        let e=spline.eidmap[ud[i++]];
        let flag=ud[i++];
        e.flag|=flag;
        if (flag&SplineFlags.SELECT)
          spline.setselect(e, selstate);
      }
      window.redraw_viewport();
    }
     exec(ctx) {
      let spline=ctx.spline;
      let layer=spline.layerset.active;
      let mode=this.inputs.selmode.data;
      let ghost=this.inputs.ghost.data;
      for (let elist of spline.elists) {
          if (!(mode&elist.type))
            continue;
          for (let e of elist) {
              if (!(layer.id in e.layers))
                continue;
              if (!ghost&&(e.flag&SplineFlags.GHOST))
                continue;
              let was_hidden=e.flag&SplineFlags.HIDE;
              e.flag&=~(SplineFlags.HIDE|SplineFlags.GHOST);
              e.sethide(false);
              if (was_hidden)
                spline.setselect(e, true);
          }
      }
    }
  }
  _ESClass.register(UnhideOp);
  _es6_module.add_class(UnhideOp);
  UnhideOp = _es6_module.add_export('UnhideOp', UnhideOp);
  var CollectionProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'CollectionProperty');
  var ElementRefSet=es6_import_item(_es6_module, '../../curve/spline_types.js', 'ElementRefSet');
  let _last_radius=45;
  class CircleSelectOp extends SelectOpBase {
     constructor(datamode, do_flush=true) {
      super(datamode, do_flush, "Circle Select");
      if (isNaN(_last_radius)||_last_radius<=0)
        _last_radius = 45;
      this.mpos = new Vector3();
      this.mdown = false;
      this.sel_or_unsel = true;
      this.radius = _last_radius;
    }
    static  tooldef() {
      return {apiname: "view2d.circle_select", 
     uiname: "Circle Select", 
     inputs: ToolOp.inherit({add_elements: new CollectionProperty(new ElementRefSet(SplineTypes.ALL), [SplineVertex, SplineSegment, SplineFace], "elements", "Elements", "Elements"), 
      sub_elements: new CollectionProperty(new ElementRefSet(SplineTypes.ALL), [SplineVertex, SplineSegment, SplineFace], "elements", "Elements", "Elements")}), 
     outputs: ToolOp.inherit({}), 
     icon: Icons.CIRCLE_SEL, 
     is_modal: true, 
     description: "Select in a circle.\nRight click to deselect."}
    }
     start_modal(ctx) {
      this.radius = _last_radius;
      let mpos=ctx.view2d.mpos;
      if (mpos!=undefined)
        this.on_mousemove({x: mpos[0], 
     y: mpos[1]});
    }
     on_mousewheel(e) {
      let dt=e.deltaY;
      dt*=0.2;
      console.log("wheel", e, dt);
      this.radius = Math.max(Math.min(this.radius+dt, 1024), 3.0);
      this._draw_circle();
    }
     _draw_circle() {
      let ctx=this.modal_ctx;
      let editor=ctx.view2d;
      this.reset_drawlines();
      let steps=64;
      let t=-Math.PI, dt=(Math.PI*2.0)/steps;
      let lastco=new Vector3();
      let co=new Vector3();
      let mpos=new Vector3(editor.getLocalMouse(this.mpos[0], this.mpos[1]));
      let radius=this.radius;
      for (let i=0; i<steps+1; i++, t+=dt) {
          co[0] = sin(t)*radius+mpos[0];
          co[1] = cos(t)*radius+mpos[1];
          if (i>0) {
              let dl=this.new_drawline(lastco, co);
          }
          lastco.load(co);
      }
      window.redraw_viewport();
    }
     exec(ctx) {
      let spline=ctx.spline;
      let eset_add=this.inputs.add_elements;
      let eset_sub=this.inputs.sub_elements;
      eset_add.ctx = ctx;
      eset_sub.ctx = ctx;
      eset_add.data.ctx = ctx;
      eset_sub.data.ctx = ctx;
      for (let e of eset_add) {
          spline.setselect(e, true);
      }
      for (let e of eset_sub) {
          spline.setselect(e, false);
      }
      if (this.inputs.flush.data) {
          spline.select_flush(this.inputs.datamode.data);
      }
    }
     do_sel(sel_or_unsel) {
      let datamode=this.inputs.datamode.data;
      let ctx=this.modal_ctx, spline=ctx.spline;
      let editor=ctx.view2d;
      let co=new Vector3();
      let mpos=new Vector3(editor.getLocalMouse(this.mpos[0], this.mpos[1]));
      let scale=editor.rendermat.$matrix.m11;
      mpos[2] = 0.0;
      console.warn(scale);
      let eset_add=this.inputs.add_elements.data;
      let eset_sub=this.inputs.sub_elements.data;
      let actlayer=spline.layerset.active.id;
      if (datamode&SplineTypes.VERTEX) {
          for (let i=0; i<2; i++) {
              if (i&&!(datamode&SplineTypes.HANDLE))
                break;
              let list=i ? spline.handles : spline.verts;
              for (let v of list.editable(ctx)) {
                  co.load(v);
                  co[2] = 0.0;
                  editor.project(co);
                  if (co.vectorDistance(mpos)<this.radius) {
                      if (sel_or_unsel) {
                          eset_sub.remove(v);
                          eset_add.add(v);
                      }
                      else {
                        eset_add.remove(v);
                        eset_sub.add(v);
                      }
                  }
              }
          }
      }
      if (datamode&SplineTypes.SEGMENT) {
      }
      if (datamode&SplineTypes.FACE) {
      }
    }
     on_mousemove(event) {
      let ctx=this.modal_ctx;
      let spline=ctx.spline;
      let editor=ctx.view2d;
      this.mpos[0] = event.x;
      this.mpos[1] = event.y;
      this._draw_circle();
      if (this.inputs.mode.getValue()!==SelOpModes.AUTO) {
          this.sel_or_unsel = this.inputs.mode.getValue()===SelOpModes.SELECT;
      }
      if (this.mdown) {
          this.do_sel(this.sel_or_unsel);
          window.redraw_viewport();
      }
      this.exec(ctx);
    }
     end_modal(ctx) {
      super.end_modal(ctx);
      _last_radius = this.radius;
    }
     on_keydown(event) {
      console.log(event.keyCode);
      let ctx=this.modal_ctx;
      let spline=ctx.spline;
      let view2d=ctx.view2d;
      let radius_inc=10;
      switch (event.keyCode) {
        case charmap["="]:
        case charmap["NumPlus"]:
          this.radius+=radius_inc;
          this._draw_circle();
          break;
        case charmap["-"]:
        case charmap["NumMinus"]:
          this.radius-=radius_inc;
          this._draw_circle();
          break;
        case charmap["Escape"]:
        case charmap["Enter"]:
        case charmap["Space"]:
          this.end_modal();
          break;
      }
    }
     on_mousedown(event) {
      let auto=this.inputs.mode.get_data()==SelOpModes.AUTO;
      console.log("auto", auto);
      if (auto) {
          this.sel_or_unsel = (event.button==0)^event.shiftKey;
      }
      this.mdown = true;
    }
     on_mouseup(event) {
      console.log("modal end!");
      this.mdown = false;
      this.end_modal();
    }
  }
  _ESClass.register(CircleSelectOp);
  _es6_module.add_class(CircleSelectOp);
  CircleSelectOp = _es6_module.add_export('CircleSelectOp', CircleSelectOp);
}, '/dev/fairmotion/src/editors/viewport/spline_selectops.js');
es6_module_define('spline_createops', ["../../curve/spline_draw_new.js", "../../core/toolops_api.js", "./spline_editops.js", "../../path.ux/scripts/pathux.js", "../../curve/spline.js", "../../core/toolprops.js", "../../curve/spline_types.js"], function _spline_createops_module(_es6_module) {
  var util=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'util');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var EnumProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'EnumProperty');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var Vec3Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec4Property');
  var StringProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'StringProperty');
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  var RestrictFlags=es6_import_item(_es6_module, '../../curve/spline.js', 'RestrictFlags');
  var SplineLocalToolOp=es6_import_item(_es6_module, './spline_editops.js', 'SplineLocalToolOp');
  var SplineDrawData=es6_import_item(_es6_module, '../../curve/spline_draw_new.js', 'SplineDrawData');
  var ExtrudeModes={SMOOTH: 0, 
   LESS_SMOOTH: 1, 
   BROKEN: 2}
  ExtrudeModes = _es6_module.add_export('ExtrudeModes', ExtrudeModes);
  class ExtrudeVertOp extends SplineLocalToolOp {
     constructor(co, mode) {
      super();
      if (co!==undefined)
        this.inputs.location.setValue(co);
      if (mode!==undefined) {
          this.inputs.mode.setValue(mode);
      }
    }
    static  tooldef() {
      return {uiname: "Extrude Path", 
     apiname: "spline.extrude_verts", 
     inputs: {location: new Vec3Property(undefined, "location", "location"), 
      linewidth: new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500]), 
      mode: new EnumProperty(ExtrudeModes.SMOOTH, ExtrudeModes, "extrude_mode", "Smooth Mode"), 
      stroke: new Vec4Property([0, 0, 0, 1])}, 
     outputs: {vertex: new IntProperty(-1, "vertex", "vertex", "new vertex")}, 
     icon: -1, 
     is_modal: false, 
     description: "Add points to path"}
    }
    static  canRun(ctx) {
      return !(ctx.spline.restrict&RestrictFlags.NO_EXTRUDE);
    }
     exec(ctx) {
      console.log("Extrude vertex op");
      var spline=ctx.spline;
      var layer=spline.layerset.active;
      var max_z=1;
      for (var f of spline.faces) {
          if (!(layer.id in f.layers))
            continue;
          max_z = Math.max(f.z, max_z);
      }
      var max_z_seg=max_z+1;
      for (var s of spline.segments) {
          if (!(layer.id in s.layers))
            continue;
          max_z_seg = Math.max(max_z_seg, s.z);
      }
      var co=this.inputs.location.data;
      console.log("co", co);
      var actvert=spline.verts.active;
      for (var i=0; i<spline.verts.length; i++) {
          var v=spline.verts[i];
          spline.verts.setselect(v, false);
      }
      var start_eid=spline.idgen.cur_id;
      var v=spline.make_vertex(co);
      console.log("v", v);
      var smode=this.inputs.mode.get_value();
      if (smode==ExtrudeModes.LESS_SMOOTH)
        v.flag|=SplineFlags.BREAK_CURVATURES;
      else 
        if (smode==ExtrudeModes.BROKEN)
        v.flag|=SplineFlags.BREAK_TANGENTS;
      this.outputs.vertex.setValue(v.eid);
      spline.verts.setselect(v, true);
      if (actvert!==v&&actvert!==undefined&&!actvert.hidden&&!((spline.restrict&RestrictFlags.VALENCE2)&&actvert.segments.length>=2)) {
          if (actvert.segments.length===2) {
              var v2=actvert;
              var h1=v2.segments[0].handle(v2), h2=v2.segments[1].handle(v2);
              spline.connect_handles(h1, h2);
              h1.flag|=SplineFlags.AUTO_PAIRED_HANDLE;
              h2.flag|=SplineFlags.AUTO_PAIRED_HANDLE;
              h1.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
              h2.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
          }
          let width=actvert.segments.length>0 ? actvert.width : 1.0;
          var seg=spline.make_segment(actvert, v);
          seg.z = max_z_seg;
          seg.w1 = width;
          seg.w2 = width;
          console.log("creating segment");
          if (actvert.segments.length>1) {
              var seg2=actvert.segments[0];
              seg.mat.load(seg2.mat);
          }
          else {
            seg.mat.linewidth = this.inputs.linewidth.data;
            var color=this.inputs.stroke.data;
            for (var i=0; i<4; i++) {
                seg.mat.strokecolor[i] = color[i];
            }
          }
          v.flag|=SplineFlags.UPDATE;
          actvert.flag|=SplineFlags.UPDATE;
      }
      spline.verts.active = v;
      spline.regen_render();
    }
  }
  _ESClass.register(ExtrudeVertOp);
  _es6_module.add_class(ExtrudeVertOp);
  ExtrudeVertOp = _es6_module.add_export('ExtrudeVertOp', ExtrudeVertOp);
  class CreateEdgeOp extends SplineLocalToolOp {
     constructor(linewidth) {
      super();
      if (linewidth!=undefined)
        this.inputs.linewidth.setValue(linewidth);
    }
    static  tooldef() {
      return {uiname: "Make Segment", 
     apiname: "spline.make_edge", 
     inputs: {linewidth: new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500])}, 
     outputs: {}, 
     icon: Icons.MAKE_SEGMENT, 
     is_modal: false, 
     description: "Create segment between two selected points"}
    }
    static  canRun(ctx) {
      return !(ctx.spline.restrict&RestrictFlags.NO_CONNECT);
    }
     exec(ctx) {
      console.log("create edge op!");
      var spline=ctx.spline;
      var sels=[];
      var max_z=1;
      for (var f of spline.faces) {
          max_z = Math.max(f.z, max_z);
      }
      var max_z_seg=max_z+1;
      for (var s of spline.segments) {
          max_z_seg = Math.max(max_z_seg, s.z);
      }
      for (var i=0; i<spline.verts.length; i++) {
          var v=spline.verts[i];
          if (v.hidden)
            continue;
          if (!(v.flag&SplineFlags.SELECT))
            continue;
          sels.push(v);
      }
      if (sels.length!=2)
        return ;
      sels[0].flag|=SplineFlags.UPDATE;
      sels[1].flag|=SplineFlags.UPDATE;
      var seg=spline.make_segment(sels[0], sels[1]);
      seg.z = max_z_seg;
      seg.mat.linewidth = this.inputs.linewidth.data;
      spline.regen_render();
    }
  }
  _ESClass.register(CreateEdgeOp);
  _es6_module.add_class(CreateEdgeOp);
  CreateEdgeOp = _es6_module.add_export('CreateEdgeOp', CreateEdgeOp);
  class CreateEdgeFaceOp extends SplineLocalToolOp {
     constructor(linewidth) {
      super();
      if (linewidth!=undefined)
        this.inputs.linewidth.setValue(linewidth);
    }
    static  tooldef() {
      return {uiname: "Make Polygon", 
     apiname: "spline.make_edge_face", 
     inputs: {linewidth: new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500])}, 
     outputs: {}, 
     icon: Icons.MAKE_POLYGON, 
     is_modal: false, 
     description: "Create polygon from selected points"}
    }
    static  canRun(ctx) {
      return !(ctx.spline.restrict&RestrictFlags.NO_CONNECT);
    }
     exec(ctx) {
      console.log("create edge op!");
      var spline=ctx.spline;
      var layer=spline.layerset.active;
      var sels=[];
      var max_z=1;
      for (var f of spline.faces) {
          if (!(layer.id in f.layers))
            continue;
          max_z = Math.max(f.z, max_z);
      }
      var max_z_seg=max_z+1;
      for (var s of spline.segments) {
          if (!(layer.id in s.layers))
            continue;
          max_z_seg = Math.max(max_z_seg, s.z);
      }
      var vs=[];
      var valmap={};
      var vset=new set();
      var doneset=new set();
      function walk(v) {
        var stack=[v];
        var path=[];
        if (doneset.has(v))
          return path;
        if (!vset.has(v))
          return path;
        while (stack.length>0) {
          var v=stack.pop();
          if (doneset.has(v))
            break;
          path.push(v);
          doneset.add(v);
          if (valmap[v.eid]>2)
            break;
          for (var i=0; i<v.segments.length; i++) {
              var v2=v.segments[i].other_vert(v);
              if (!doneset.has(v2)&&vset.has(v2)) {
                  stack.push(v2);
              }
          }
        }
        return path;
      }
      for (var v of spline.verts.selected) {
          if (v.hidden)
            continue;
          v.flag|=SplineFlags.UPDATE;
          vs.push(v);
          vset.add(v);
      }
      for (var v of vset) {
          var valence=0;
          console.log("============", v);
          for (var i=0; i<v.segments.length; i++) {
              var v2=v.segments[i].other_vert(v);
              console.log(v.eid, v2.segments[0].v1.eid, v2.segments[0].v2.eid);
              if (vset.has(v2))
                valence++;
          }
          valmap[v.eid] = valence;
      }
      console.log("VS.LENGTH", vs.length);
      if (vs.length==2) {
          var v=vs[0].segments.length>0 ? vs[0] : vs[1];
          var seg2=v.segments.length>0 ? v.segments[0] : undefined;
          var e=spline.make_segment(vs[0], vs[1]);
          if (seg2!=undefined) {
              e.mat.load(seg2.mat);
          }
          else {
            e.mat.linewidth = this.inputs.linewidth.data;
          }
          e.z = max_z_seg;
          spline.regen_render();
          return ;
      }
      else 
        if (vs.length==3) {
          var f=spline.make_face([vs]);
          f.z = max_z+1;
          max_z++;
          spline.regen_sort();
          spline.faces.setselect(f, true);
          spline.set_active(f);
          spline.regen_render();
          return ;
      }
      for (var v of vset) {
          if (valmap[v.eid]!=1)
            continue;
          var path=walk(v);
          if (path.length>2) {
              var f=spline.make_face([path]);
              f.z = max_z+1;
              max_z++;
              spline.regen_sort();
              spline.faces.setselect(f, true);
              spline.set_active(f);
              spline.regen_render();
          }
      }
      for (var v of vset) {
          var path=walk(v);
          if (path.length>2) {
              var f=spline.make_face([path]);
              f.z = max_z+1;
              max_z++;
              spline.regen_sort();
              spline.faces.setselect(f, true);
              spline.set_active(f);
              spline.regen_render();
          }
      }
      spline.regen_render();
    }
  }
  _ESClass.register(CreateEdgeFaceOp);
  _es6_module.add_class(CreateEdgeFaceOp);
  CreateEdgeFaceOp = _es6_module.add_export('CreateEdgeFaceOp', CreateEdgeFaceOp);
  class ImportJSONOp extends ToolOp {
     constructor(str) {
      super();
      if (str!==undefined) {
          this.inputs.strdata.setValue(str);
      }
    }
    static  tooldef() {
      return {uiname: "Import Old JSON", 
     apiname: "editor.import_old_json", 
     inputs: {strdata: new StringProperty("", "JSON", "JSON", "JSON string data")}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     description: "Import old json files"}
    }
    static  canRun(ctx) {
      return !(ctx.spline.restrict&RestrictFlags.NO_CONNECT);
    }
     exec(ctx) {
      console.log("import json spline op!");
      var spline=ctx.spline;
      var obj=JSON.parse(this.inputs.strdata.data);
      spline.import_json(obj);
      spline.regen_render();
    }
  }
  _ESClass.register(ImportJSONOp);
  _es6_module.add_class(ImportJSONOp);
  ImportJSONOp = _es6_module.add_export('ImportJSONOp', ImportJSONOp);
  function strokeSegments(spline, segments, width, color) {
    if (width===undefined) {
        width = 2.0;
    }
    if (color===undefined) {
        color = [0, 0, 0, 1];
    }
    segments = new util.set(segments);
    let verts=new util.set();
    for (let seg of segments) {
        verts.add(seg.v1);
        verts.add(seg.v2);
    }
    let doneset=new util.set();
    function angle(v, seg) {
      let v2=seg.other_vert(v);
      let dx=v2[0]-v[0];
      let dy=v2[1]-v[1];
      return Math.atan2(dy, dx);
    }
    for (let v of verts) {
        v.segments.sort((a, b) =>          {
          return angle(v, a)-angle(v, b);
        });
    }
    let ekey=function (e, side) {
      return ""+e.eid+":"+side;
    }
    let doneset2=new util.set();
    for (let v of verts) {
        let side=0;
        let startside=side;
        if (doneset.has(ekey(v, side))) {
            continue;
        }
        let startv=v;
        let seg;
        let found=0;
        for (seg of v.segments) {
            let realside=side^(seg.v1===v ? 0 : 1);
            if (segments.has(seg)&&!doneset.has(ekey(seg, realside))) {
                found = 1;
                break;
            }
        }
        if (!found) {
            continue;
        }
        let vcurs={};
        let vstarts={};
        let lastco=undefined;
        let firstp=undefined;
        let lastp=undefined;
        let lastv=v;
        let lastseg=undefined;
        let widthscale=1.0;
        let _i=0;
        do {
          let realside=side^(seg.v1===v ? 0 : 1);
          if (doneset.has(ekey(seg, realside))) {
              break;
          }
          doneset.add(ekey(seg, realside));
          let data=seg.cdata.get_layer(SplineDrawData);
          if (!data) {
              throw new Error("data was not defined");
          }
          let s=data.gets(seg, v);
          let p=seg.evaluateSide(s, realside);
          p = spline.make_vertex(p);
          if ((v.flag&SplineFlags.BREAK_TANGENTS)||v.segments.length!==2) {
              p.flag|=SplineFlags.BREAK_TANGENTS;
              if (v.segments.length===2) {
                  p.load(data.getp(seg, v, side^1));
                  p[2] = 0.0;
              }
          }
          if (v.flag&SplineFlags.BREAK_CURVATURES) {
              p.flag|=SplineFlags.BREAK_CURVATURES;
          }
          if (lastco===undefined) {
              lastco = new Vector2(p);
              lastp = p;
              firstp = p;
          }
          else {
            let seg2=spline.make_segment(lastp, p);
            lastp.width = widthscale;
            widthscale+=0.025;
            seg2.mat.strokecolor.load(color);
            seg2.mat.linewidth = width;
            seg2.mat.update();
            lastco.load(p);
            let nev=spline.split_edge(seg2, 0.5);
            let pn=seg.evaluateSide(0.5, realside);
            pn[2] = 0.0;
            nev[1].load(pn);
          }
          lastp = p;
          if (v.segments.length===2) {
              seg = v.other_segment(seg);
              v = seg.other_vert(v);
          }
          else 
            if (v.segments.length>2) {
              if (!vcurs[v.eid]) {
                  vcurs[v.eid] = vstarts[v.eid] = v.segments.indexOf(v.seg);
              }
              let side2=seg.v1===v ? 1 : 0;
              side2 = side2^side;
              let dir=realside ? -1 : 1;
              vcurs[v.eid] = (vcurs[v.eid]+dir+v.segments.length)%v.segments.length;
              if (vcurs[v.eid]===vstarts[v.eid]) {
                  break;
              }
              seg = v.segments[vcurs[v.eid]];
              v = seg.other_vert(v);
          }
          else {
            v = seg.other_vert(v);
            let co=seg.evaluateSide(s, realside^1);
            let v2=spline.make_vertex(co);
            let seg2=spline.make_segment(lastp, v2);
            seg2.mat.strokecolor.load(color);
            seg2.mat.linewidth = width;
            seg2.mat.update();
            v2.flag|=SplineFlags.BREAK_TANGENTS;
            lastp.flag|=SplineFlags.BREAK_TANGENTS;
            lastp = v2;
          }
          lastv = v;
          lastseg = seg;
          if (_i++>1000) {
              console.warn("Infinite loop detected!");
              break;
          }
        } while (ekey(v, side)!==ekey(startv, startside));
        
        if (v===startv) {
            let seg2=spline.make_segment(lastp, firstp);
            lastp.width = widthscale;
            seg2.mat.strokecolor.load(color);
            seg2.mat.linewidth = width;
            seg2.mat.update();
        }
    }
  }
  strokeSegments = _es6_module.add_export('strokeSegments', strokeSegments);
  class StrokePathOp extends SplineLocalToolOp {
     constructor() {
      super();
    }
    static  invoke(ctx, args) {
      let tool=new StrokePathOp();
      if ("color" in args) {
          tool.inputs.color.setValue(args.color);
      }
      else 
        if (ctx.view2d) {
          tool.inputs.color.setValue(ctx.view2d.default_stroke);
      }
      if ("width" in args) {
          tool.inputs.width.setValue(args.width);
      }
      else 
        if (ctx.view2d) {
          tool.inputs.width.setValue(ctx.view2d.default_linewidth);
      }
      return tool;
    }
    static  tooldef() {
      return {name: "Stroke Path", 
     description: "Stroke Path", 
     toolpath: "spline.stroke", 
     inputs: {color: new Vec4Property([0, 0, 0, 1]), 
      width: new FloatProperty(1.0)}, 
     outputs: {}, 
     icon: Icons.STROKE_TOOL}
    }
     exec(ctx) {
      let spline=ctx.frameset.spline;
      let width=this.inputs.width.getValue();
      let color=this.inputs.color.getValue();
      strokeSegments(spline, spline.segments.selected.editable(ctx), width, color);
      spline.regen_render();
      spline.regen_solve();
      spline.regen_sort();
      window.redraw_viewport();
    }
  }
  _ESClass.register(StrokePathOp);
  _es6_module.add_class(StrokePathOp);
  StrokePathOp = _es6_module.add_export('StrokePathOp', StrokePathOp);
}, '/dev/fairmotion/src/editors/viewport/spline_createops.js');
