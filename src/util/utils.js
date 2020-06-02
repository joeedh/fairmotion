"not_a_module"; //todo: need to make this a module

if (Array.prototype.set === undefined) {
    Array.prototype.set = function set1(array, src, dst, count) {
        src = src === undefined ? 0 : src;
        dst = dst === undefined ? 0 : dst;
        count = count === undefined ? array.length :  count;
        
        if (count < 0) {
            throw new RangeError("Count must be >= zero");
        }
        
        let len = Math.min(this.length-dst, array.length-src);
        len = Math.min(len, count);
        
        for (let i=0; i<len; i++) {
            this[dst+i] = array[src+i];
        }
        
        return this;
    }
    
    Float64Array.prototype.set = Array.prototype.set;
    Float32Array.prototype.set = Array.prototype.set;
    Uint8Array.prototype.set = Array.prototype.set;
    Uint8ClampedArray.prototype.set = Array.prototype.set;
    Int32Array.prototype.set = Array.prototype.set;
    Int16Array.prototype.set = Array.prototype.set;
    Int8Array.prototype.set = Array.prototype.set;
}

if (Array.prototype.reject === undefined) {
    Array.prototype.reject = function reject(func) {
        return this.filter(function(item) { return !func(item); });
    }
}

function* testr(obj) {
  for (var k in obj) {
    yield k;
  }
}

if (Math.sign == undefined) {
  Math.sign = function(f) {
    return 1.0 - (f < 0.0)*2.0;
  }
}

if (Math.fract == undefined) {
  Math.fract = function(f) {
    f = Math.abs(f);
    
    return f - Math.floor(f);
  }
}

if (Array.prototype.insert == undefined) {
  Array.prototype.insert = function(before, item) {
    if (before < 0 || before > this.length) {
      throw new Error("Bad index " + before + ", should be between 0-" + this.length + ".");
    }
    
    this.push(0);
    
    for (var i=this.length-1; i > before; i--) {
      this[i] = this[i-1];
    }
    
    this[before] = item;
    return this;
  }
}

//need to figure out which name to use for this
class Iter {
  reset() {}
  next() {} //returns a {done : bool iteration_done, value: value} object
}

class CanIter {
  [Symbol.iterator]() : Iter {
  }
}

var int debug_int_1 = 0;

class cachering extends Array {
  _cur : number;

  constructor (createcallback : Function, int count=32) {
    super(count);

    if (!createcallback) {
      console.warn("Cachering called with invalid arguments!");
      return;
    }

    this._cur = 0;
    this.length = count;
    for (var i=0; i<count; i++) {
      this[i] = createcallback();
    }
  }
  
  next() {
    var ret = this[this._cur];
    
    this._cur = (this._cur+1) % this.length;
    
    return ret;
  }
  
  static fromConstructor(cls, int count=32) {
    static args = [];
    args.length = 0;
    
    for (var i=1; i<arguments.length; i++) {
      args.push(arguments[i]);
    }

    if (arguments.length > 2) {
      throw new Error("too many arguments to fromConstructor");
    }

    function callback() {
      var ret = new cls();
      //cls.apply(ret, arguments);
      return ret;
    }
    
    return new cachering(callback, count);
  }
};

class GArray extends Array {
  constructor(Object input) {
    super()

    if (input != undefined) {
      for (var i=0; i<input.length; i++) {
        this.push(input[i]);
      }
    }
  }
  
  slice(int a, int b) : GArray {
    var ret = Array.prototype.slice.call(this, a, b);
    if (!(ret instanceof GArray))
      ret = new GArray(ret);
    
    return ret;
  }
  
  pack(Array<byte> data) {
    _ajax.pack_int(data, this.length);
    
    for (var i=0; i<this.length; i++) {
      this[i].pack(data);
    }
  }
  
  has(T item) : Boolean {
    return this.indexOf(item) >= 0;
  }
  
  [Symbol.iterator]() : GArrayIter<T> {
    if (this.itercache == undefined) {
      this.itercache = cachering.fromConstructor(GArrayIter, 8);
    }
    
    var iter = this.itercache.next();
    iter.init(this);
    return iter;

    return new GArrayIter<T>(this);
  }
    
  toJSON() : Array<Object> {
    var arr = new Array(this.length);
    
    var i = 0;
    for (var i=0; i<this.length; i++) {
      arr[i] = this[i];
    }
    
    return arr;
  }

  //inserts *before* index
  insert(int index, T item) {
    for (var i=this.length; i > index; i--) {
      this[i] = this[i-1];
    }
    
    this[index] = item;
    this.length++;
  }

  prepend(T item) {
    this.insert(0, item);
  }

  pop_i(int idx=-1) {
    if (idx < 0)
      idx += this.length;
   
    var ret = this[i];
    
    for (var i=idx; i<this.length-1; i++) {
      this[i] = this[i+1];
    }
    
    this.length -= 1;
    
    return ret;
  }
  
  remove(T item, Boolean ignore_existence) { //ignore_existence defaults to false
    var int idx = this.indexOf(item);
    
    if (ignore_existence == undefined)
      ignore_existence = false;
      
    if (idx < 0 || idx == undefined) {
      console.log("Yeek! Item " + item + " not in array");
      console.trace();
      
      if (!ignore_existence) {
        console.trace();
        throw "Yeek! Item " + item + " not in array"
      }
      
      return;
    }
    
    for (var i=idx; i<this.length-1; i++) {
      this[i] = this[i+1];
    }
    
    this.length -= 1;
  }

  replace(T olditem, T newitem) { 
    var int idx = this.indexOf(olditem);
    
    if (idx < 0 || idx == undefined) {
      console.trace("Yeek! Item " + olditem + " not in array");
      
      return;
    }
    
    this[idx] = newitem;
  }

  /*
  this.pop() {
    if (this.length == 0)
      return undefined;
    
    var ret = this[this.length-1];
    this.length--;
    
    return ret;
  }
  */

  toSource() : String {
    var s = "new GArray" + this.length + "([";
    
    for (var i=0; i<this.length; i++) {
      s += this[i];
      if (i != this.length-1)
        s += ", ";
    }
    
    s += "])";
    
    return s
  }

  toString() : String {
    var s = "[GArray: "

    for (var i=0; i<this.length; i++) {
      s += this[i];
      if (i != this.length-1)
        s += ", ";
    }
    
    s += "])";
    
    return s
  }
  
  reset() {
    this.length = 0;
  }
}


//turn defined_classes into a GArray, now that we've defined it (garray)
global defined_classes;
window.defined_classes = new GArray(window.defined_classes);

function obj_value_iter(Object obj) {
  this.ret = {done : false, value : undefined};
  this.obj = obj;
  this.iter = Iterator(obj);
  
  this.next = function() {
    var reti = this.ret;
    
    var ret = this.iter.next()
    if (ret.done) return ret;
    
    reti.value = ret.value[1];
    return reti;
  }
  
  this[Symbol.iterator] = function() {
    return this;
  }
}


//turns any iterator into an array
function list<T>(Iterator<T> iter) : GArray<T> {
  var lst = new GArray<T>();

  var i = 0;
  for (var item of iter) {
    lst.push(item);
    i++;
  }
  
  lst.length = i;
  
  return lst;
}


function time_func(func, steps=10) {
  var times = [];
  
  for (var i=0; i<steps; i++) {
    var last_ms = time_ms();
    func();
    times.push(time_ms()-last_ms);
  }
  
  console.log(times);
  return times;
}

//turns any iterator into a (cached) array
function cached_list<T>(Iterator<T> iter) : GArray<T> {
  static lst = new GArray<T>();
  
  lst.reset();
  
  var i = 0;
  for (var item of iter) {
    lst.push(item);
    i++;
  }
  
  lst.length = i;
  
  return lst;
}


var Function g_list = list;

class eid_list extends GArray {
  constructor(iter : GeoArrayIter) {
    super();

    for (var item of iter) {
      this.push([item.type, item.eid]);
    }
  }
}

Number.prototype[Symbol.keystr] = function() : String {
  return this;
}

String.prototype[Symbol.keystr] = function() : String {
  return this;
}

Array.prototype[Symbol.keystr] = function() : String {
  var s = ""
  for (var i=0; i<this.length; i++) {
    s += this[i][Symbol.keystr]()+"|"
  }
  
  return s
}


var _set_null = {set_null : true};

class SetIter {
  i : number
  done : boolean
  ret : Object;

  constructor(set) {
    this.set = set;
    this.i = 0;
    this.done = false;
    this.ret = {done : false, value : undefined};
    this.list = set.list;
  }
  
  [Symbol.iterator]() {
    return this;
  }
  
  cache_init() {
    this.i = 0;
    this.ret.done = false;
    this.done = false;
    this.ret.value = undefined;
    this.list = this.set.list;
    
    return this;
  }
  
  ["return"]() {
    this.done = true;
    this.ret.done = true;
    this.ret.value = undefined;
    return this.ret;
  }
  
  next() {
    var list = this.list;
    var len = list.length;
    
    while (this.i < len && list[this.i] === _set_null) {
      this.i++;
    }
    
    if (this.i >= len) {
      this.ret.done = this.done = true;
      this.ret.value = undefined;
      return this.ret;
    }
    
    this.ret.value = list[this.i];
    this.i++;
    
    return this.ret;
  }
  
  reset() {
    this.cache_init();
  }
}

class set<T> {
  items : Object
  length : number
  _itercache : cachering;
  freelist : Array<T>;

  constructor(input : Iterable<T>) {
    this.items = {};
    this.list = [];
    this.freelist = [];
    this.length = 0;
    
    var this2 = this;
    
    this._itercache = new cachering(function() {
      return new SetIter(this2);
    }, 64);
    
    if (input != undefined) {
      if (input instanceof Array || input instanceof String) {
        for (var i=0; i<input.length; i++) {
          this.add(input[i]);
        }
      } else {
        for (var item of input) {
          this.add(item);
        }
      }
    }
  }
  
  reset() {
    this.list.length = 0;
    this.freelist.length = 0;
    //this.items = {};
    
    for (var k in this.items) {
      delete this.items[k];
    }
    
    this.length = 0;
    
    /*
    var list = this.list;
    
    for (var i=0; i<list.length; i++) {
      if (list[i] !== _set_null) {
        this.freelist.push(i);
      }
    }
    
    this.items = {};
    this.length = 0;
    //*/
    
    return this;
  }
  
  forEach(cb, thisvar) {
    if (thisvar == undefined) 
      thisvar = self;
    
    for (var item of this) {
      cb.call(thisvar, item);
    }
  }
  
  add(item : T) {
    var hash = item[Symbol.keystr]();
    if (hash in this.items)
      return;
      
    var i;
    if (this.freelist.length > 0) {
      i = this.freelist.pop();
      this.list[i] = item;
    } else {
      i = this.list.length;
      this.list.push(item);
    }
    
    this.items[hash] = i;
    this.length++;
  }
  
  remove(item : T) {
    var hash = item[Symbol.keystr]();
    if (!(hash in this.items))
      return;
      
    var i = this.items[hash];
    this.list[i] = _set_null;
    this.freelist.push(i);

    delete this.items[hash];
    this.length--;
    
    return item;
  }
  
  has(item : T) {
    var hash = item[Symbol.keystr]();
    
    return hash in this.items;
  }
  
  union(set2 : set<T>) {
    var ret = new set();
    
    for (var item of this) {
      ret.add(item);
    }
    
    for (var item of set2) {
      ret.add(item);
    }
    
    return ret;
  }
  
  [Symbol.iterator]() {
    return this._itercache.next().cache_init(this);
  }

  asArray() : Array<T> {
    var arr = new Array(this.length);
    
    for (var item of this) {
      arr[i++] = item;
    }
    
    return arr;
  }

  toJSON() : Array<Object> {
    return this.asArray();
  }

  toSource() : string {
    return "new set(" + list(this).toSource() + ")";
  }
}

class GArrayIter<T> {
  ret : Object
  cur : number;

  constructor(GArray<T> arr) {
    this.ret = {done : false, value : undefined};
    this.arr = arr;
    this.cur = 0;
  }
  
  init(GArray<T> arr) : GArrayIter<T> {
    this.ret.done = false; this.ret.value = undefined;
    this.arr = arr;
    this.cur = 0;
    
    return this;
  }
  
  next() : T {
    var reti = this.ret;
    
    if (this.cur >= this.arr.length) {
      this.cur = 0;
      this.ret = {done : false, value : undefined};
      
      reti.done = true;
      return reti;
    } else { 
      reti.value = this.arr[this.cur++];
      return reti;
    }
  }
  
  reset() {
    this.ret = {done : false, value : undefined};
    this.cur = 0;
  }
}

class ArrayIter {
  ret : Object
  cur : number;

  constructor(Array<T> arr) {
    this.ret = {done : false, value : undefined};
    this.arr = arr;
    this.cur = 0;
  }
  
  init(Array<T> arr) {
    this.ret.done = false; this.ret.value = undefined;
    this.arr = arr;
    this.cur = 0;
    
    return this;
  }
  
  next() : T {
    var reti = this.ret;
    
    if (this.cur >= this.arr.length) {
      this.cur = 0;
      this.ret = {done : false, value : undefined};
      
      reti.done = true;
      return reti;
    } else { 
      reti.value = this.arr[this.cur++];
      return reti;
    }
  }
  
  reset() {
    this.ret = {done : false, value : undefined};
    this.cur = 0;
  }
}

if (!window.TYPE_LOGGING_ENABLED) {
  Array.prototype[Symbol.iterator] = function () {
    if (this.itercache == undefined) {
      this.itercache = cachering.fromConstructor(ArrayIter, 8);
    }

    return this.itercache.next().init(this);
  }
}


class HashKeyIter {
  constructor(hashtable hash) {
    this.ret = {done : false, value : undefined};
    this.hash = hash;
    this.iter = Iterator(hash.items);
  }
  
  next() : IterRet {
    var reti = this.ret;
    var iter = this.iter;
    var items = this.hash.items;
    
    var item = iter.next();
    
    if (item.done)
      return item;
      
    while (!items.hasOwnProperty(item.value[0])) {
      if (item.done) return item;
      
      item = iter.next();
    }
    
    reti.value = this.hash.keymap[item.value[0]];
    return reti;
  }
}


class hashtable {
  items : Object
  keymap : Object
  length : number;

  constructor() {
    this.items = {};
    this.keymap = {};
    this.length = 0;
  }
  
  reset() {
    this.items = {};
    this.keymap = {};
    this.length = 0;
  }
  
  add(Object key, Object item) {
    if (!this.items.hasOwnProperty(key[Symbol.keystr]())) 
      this.length++;
    
    this.items[key[Symbol.keystr]()] = item;
    this.keymap[key[Symbol.keystr]()] = key;
  }

  remove(Object key) {
    delete this.items[key[Symbol.keystr]()]
    delete this.keymap[key[Symbol.keystr]()]
    this.length -= 1;
  }

  [Symbol.iterator]() : HashKeyIter {
    return Object.keys(this.items)[Symbol.iterator]();
  }

  values() : Array<Object> {
    var ret = new Array();

    for (var k of this) {
      ret.push(this.items[k]);
    }
    
    return ret;
  }

  keys() : GArray<Object> {
    return list(this);
  }

  get(Object key) : Object {
    return this.items[key[Symbol.keystr]()];
  }

  set(Object key, Object item) {
    if (!this.has(key)) {
      this.length++;
    }
    
    this.items[key[Symbol.keystr]()] = item;
    this.keymap[key[Symbol.keystr]()] = key;
  }

  union(hashtable b) : hashtable {
    var newhash = new hashtable(this)
    
    for (var item of b) {
      newhash.add(item, b.get[item])
    }
    
    return newhash;
  }

  has(Object item) : Boolean {
    if (item == undefined)
      console.trace();
    return this.items.hasOwnProperty(item[Symbol.keystr]())
  }
}

function validate_mesh_intern(m) {
  var eidmap = {};
  
  for (var f of m.faces) {
    var lset = new set();
    var eset = new set();
    var vset = new set();
    
    
    for (var v of f.verts) {
      if (vset.has(v)) {
        console.trace();
        console.log("Warning: found same vert multiple times in a face");
      }
      vset.add(v);
    }
    
    for (var e of f.edges) {
      if (eset.has(e)) {
        console.trace();
        console.log("Warning: found same edge multiple times in a face");
      }
      
      eset.add(e);
    }
    
    for (var loops of f.looplists) {
      for (var l of loops) {
        var e = l.e;
        var v1 = l.v, v2 = l.next.v;
        if (!(v1 == e.v1 && v2 == e.v2) && !(v1 == e.v2 && v2 == e.v1)) {
          console.log("lerror with edge " + e.eid + ", and loop " + l.eid);
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
  
  for (var v of m.verts) {
    if (v._gindex == -1) {
      console.trace();
      return false;
    }
    
    if (v.loop != null && v.loop.f._gindex == -1) {
      console.trace();
      return false;
    }
    
    for (var e of v.edges) {
      if (e._gindex == -1) {
        console.trace();
        return false;
      }
      if (!e.vert_in_edge(v)) {
        console.trace();
        return false;
      }
    }
  }
  
  for (var e of m.edges) {
    if (e._gindex == -1) {
      console.trace();
      return false;
    }
    
    var i = 0;
    
    var lset = new set();
    var fset = new set();
    if (e.loop == null) 
      continue;
      
    var l = e.loop;
    do {
      if (lset.has(l)) {
        console.trace();
        return false;
      }
      lset.add(l);
      
      if (fset.has(l.f)) {
        console.trace();
        console.log("Warning: found the same face multiple times in an edge's radial list");
        //this is not a hard error, don't return false
      }
      fset.add(l.f);
      
      i++;
      if (i == 10000) {
        console.trace();
        return false;
      }
      
      if (l.f._gindex == -1) {
        console.trace();
        console.log("error with edge " + e.eid);
        return false;
      }
      
      var v1 = l.v, v2 = l.next.v;
      if (!(v1 == e.v1 && v2 == e.v2) && !(v1 == e.v2 && v2 == e.v1)) {
        console.log("error with edge " + e.eid + ", and loop " + l.eid);
        console.log("loop doesn't match edge");
        return false;
      }
      
      l = l.radial_next;
    } while (l != e.loop);
  }
  
  for (var v of m.verts) {
    eidmap[v.eid] = v;
  }
  for (var e of m.edges) {
    eidmap[e.eid] = v;
  }
  for (var f of m.faces) {
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

function concat_array(a1, a2)
{
  var ret = new GArray();
  
  for (var i=0; i<a1.length; i++) {
    ret.push(a1[i]);
  }
  
  for (var i=0; i<a2.length; i++) {
    ret.push(a2[i]);
  }
  
  return ret;
}


function get_callstack(err) {
  var callstack = [];
  var isCallstackPopulated = false;
  
  var err_was_undefined = err == undefined;
  
  if (err == undefined) {
    try {
      _idontexist.idontexist+=0; //doesn't exist- that's the point
    } catch(err1) {
      err = err1;
    }
  }
  
  if (err != undefined) {
    if (err.stack) { //Firefox
      var lines = err.stack.split('\n');
      var len=lines.length;
      for (var i=0; i<len; i++) {
        if (1) {
          lines[i] = lines[i].replace(/@http\:\/\/.*\//, "|")
          var l = lines[i].split("|")
          lines[i] = l[1] + ": " + l[0]
          lines[i] = lines[i].trim()
          callstack.push(lines[i]);
        }
      }
      
      //Remove call to printStackTrace()
      if (err_was_undefined) {
        //callstack.shift();
      }
      isCallstackPopulated = true;
    }
  }
  
  var limit = 24;
  if (!isCallstackPopulated) { //IE and Safari
    var currentFunction = arguments.callee.caller;
    var i = 0;
    while (currentFunction && i < 24) {
      var fn = currentFunction.toString();
      var fname = fn.substring(fn.indexOf("function") + 8, fn.indexOf('')) || 'anonymous';
      callstack.push(fname);
      currentFunction = currentFunction.caller;
      
      i++;
    }
  }
  
  return callstack;
}


function print_stack(err) {
  try {
    var cs = get_callstack(err);
  } catch (err2) {
    console.log("Could not fetch call stack.");
    return;
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


class movavg {
  value : number;

  constructor(length) {
    this.len = length;
    this.value = 0;
    this.arr = [];
  }

  _recalc() {
    if (this.arr.length == 0)
      return;

    var avg = 0.0;
    for (var i=0; i<this.arr.length; i++) {
      avg += this.arr[i];
    }
    
    avg /= this.arr.length;
    this.value = avg;
  }
  
  update(val) {
    if (this.arr.length < this.len) {
      this.arr.push(val);
    } else {
      this.arr.shift();
      this.arr.push(val);
    }
    
    this._recalc();
    
    return this.value;
  }

  valueOf() {
    return this.value; //"movavg(value=" + this.value + ")";
  }
}

class Timer {
  normval : number;

  constructor(interval_ms) {
    this.ival = interval_ms;
    this.normval = 0.0; //elapsed time scaled by timer interval
    this.last_ms = time_ms();
  }

  ready() {
    this.normval = (time_ms() - this.last_ms) / this.ival;
    
    if (time_ms() - this.last_ms > this.ival) {
      this.last_ms = time_ms();
      return true;
    }
    
    return false;
  }
}

function other_tri_vert(e, f) {
    for (var v of f.verts) {
        if (v != e.v1 && v != e.v2)
            return v;
    }
    
    return null;
}


var _sran_tab = [0.42858355099189227,0.5574386030715371,0.9436109711290556,
0.11901816474442506,0.05494319267999703,0.4089598843412747,
0.9617377622975879,0.6144736752713642,0.4779527665160106,
0.5358937375859902,0.6392009453796094,0.24893232630444684,
0.33278166078571036,0.23623349009987882,0.6007015401310062,
0.3705022651967115,0.0225052050200355,0.35908220770197297,
0.6762962413645864,0.7286584766550781,0.19885076794257972,
0.6066651236611478,0.23594878250486895,0.9559806203614414,
0.37878311003873877,0.14489505173573436,0.6853451367228348,
0.778201767931336,0.9629591508405009,0.10159174495809686,
0.9956652458055149,0.27241630290235785,0.4657146086929548,
0.7459995799823305,0.30955785437169314,0.7594519036966647,
0.9003876360971134,0.14415784566467216,0.13837285006138467,
0.5708662986155526,0.04911823375362412,0.5182157396751097,
0.24535476698939818,0.4755762294863617,0.6241760808125321,
0.05480018253112229,0.8345698022607818,0.26287656274013016,
0.1025239144443526];

class StupidRandom2 {
  i : number;

  constructor(seed) {
    if (seed == undefined)
      seed = 0;

    this._seed = seed+1;
    this.i = 1;
  }
  
  seed(seed) {
    this._seed = seed+1;
    this.i = 1;
  }
  
  random() {
    global _sran_tab;
    
    var tab = _sran_tab;
    var i = this.i;
    
    if (i < 0)
      i = Math.abs(i)-1;
    
    i = Math.max(i, 1)
    
    var i1 = Math.max(i, 0) + this._seed;
    var i2 = Math.ceil(i/4 + this._seed);
    var r1 = Math.sqrt(tab[i1%tab.length]*tab[i2%tab.length]);
    
    this.i++;
    
    return r1;
  }
}

var StupidRandom2 seedrand = new StupidRandom2();

function get_nor_zmatrix(Vector3 no)
{
  var axis = new Vector3();
  var cross = new Vector3();
  
  axis.zero();
  axis[2] = 1.0;
  
  cross.load(no);
  cross.cross(axis);
  cross.normalize();
  
  var sign = axis.dot(no) > 0.0 ? 1.0 : -1.0
  
  var a = Math.acos(Math.abs(no.dot(axis)));
  var q = new Quat()
  
  q.axisAngleToQuat(cross, sign*a);
  var mat = q.toMatrix();
  
  return mat;
}

var _o_basic_types = {"String" : 0, "Number" : 0, "Array" : 0, "Function" : 0};
function is_obj_lit(obj) {
  if (obj.constructor.name in _o_basic_types)
    return false;
    
  if (obj.constructor.name == "Object")
    return true;
  if (obj.prototype == undefined)
    return true;
  
  return false;
}

class UnitTestError extends Error {
  constructor(msg) {
    super(msg);
    this.msg = msg;
  }
}

function utest(func) {
  try {
    func();
  } catch (err) {
    if (err instanceof UnitTestError) {
      console.log("---------------");
      console.log("Error: Unit Test Failure");
      console.log("  " + func.name + ": " + err.msg);
      console.log("---------------");
      
      return false;
    } else {
      print_stack(err);
      throw err;
    }
    
    return false;
  }
  
  console.log(func.name + " succeeded.");
  return true;
}

function do_unit_tests() {
  console.log("-----Unit testing-----")
  console.log("Total number of tests: ", defined_tests.length);
  console.log(" ");
  
  var totok=0, toterr=0;
  console.log("Defined tests:")
  for (var i=0; i<defined_tests.length; i++) {
    var test = defined_tests[i];
    console.log("  " + test.name);
  }
  
  console.log(" ");
  for (var i=0; i<defined_tests.length; i++) {
    var test = defined_tests[i];
    
    if (!utest(test))
      toterr++;
    else
      totok++;
  }
  
  console.log("OK: ", totok);
  console.log("FAILED: ", toterr);
  console.log("-------------------");
  
  return toterr == 0;
}

class EventDispatcher {
  constructor(name, owner) {
    this.name = name;
    this.callbacks = [];
  }
  
  addListener(callback, thisvar) {
    this.callbacks.push([callback, thisvar]);
  }
  
  fire() {
    for (var i=0; i<this.callbacks.length; i++) {
      var cb = this.callbacks[i];
      
      cb[0].apply(cb[1]==undefined ? window : cb[1], arguments);
    }
  }
}

class EIDGen {  
  cur_eid : number;

  constructor() {
    this.cur_eid = 1;
  }
  
  static fromSTRUCT(unpacker) {
    var g = new EIDGen();
    unpacker(g);
    
    return g;
  }
  set_cur(cur) {
    this.cur_eid = Math.ceil(cur);
  }

  //if cur is >= to this.cur_eid, 
  //set this.cur to cur+1
  max_cur(cur) {
    this.cur_eid = Math.max(Math.ceil(cur)+1, this.cur_eid);
  }
  get_cur(cur) {
    return this.cur_eid;
  }
  
  eid_max_cur(t) {
    return this.max_cur(t);
  }
  
  gen_eid(typemask=0) {
    return this.cur_eid++;
  }
  
  gen_id() {
    return this.gen_eid();
  }
  
  toJSON() {
    return { cur_eid : this.cur_eid };
  }
  static fromJSON(obj) {
    var idgen = new EIDGen()
    idgen.cur_eid = obj.cur_eid;
    
    return idgen;
  }
}
EIDGen.STRUCT = `
  EIDGen {
    cur_eid : int;
  }`;

function copy_into(dst, src) {
  console.log(dst);
  
  var keys2 = list(obj_get_keys(src));
  for (var i=0; i<keys2.length; i++) {
    var k = keys2[i];
    dst[k] = src[k];
  }
  
  console.log(dst);
  
  return dst;
}

var Array<float> __v3d_g_s = [];
function get_spiral(size)
{
  if (__v3d_g_s.length == size*size)
    return __v3d_g_s;
  
  var arr = __v3d_g_s;
  
  var x = Math.floor((size-1)/2);
  var y = Math.floor((size-1)/2);
  
  var c;
  var i;
  
  if (size%2 == 0) {
    arr.push([x, y+1]);
    arr.push([x, y]);
    arr.push([x+1, y]);
    arr.push([x+1, y+1]);
    arr.push([x+1, y+2]);
    c = 5;
    i = 2;
    
    y += 2;
    x += 1;
  } else {
    arr.push([x, y])
    arr.push([x+1, y])
    arr.push([x+1, y+1]);
    c = 3;
    i = 2;
    x++; y++;
  }  
  
  while (c < size*size-1) {
    var sign = (Math.floor(i/2) % 2)==1;
    sign = sign ? -1.0 : 1.0;
    
    for (var j=0; j<i; j++) {
      if ((i%2==0)) {
        if (x+sign < 0 || x+sign >= size)
          break;
        x += sign;
      } else {
        if (y+sign < 0 || y+sign >= size)
          break;
        y += sign;
      }
      
      if (c == size*size)
        break;
        
      arr.push([x, y]);
      c++;
    }
    
    if (c == size*size)
      break;
    i++;
  }
  
  for (var j=0; j<arr.length; j++) {
    arr[j][0] = Math.floor(arr[j][0]);
    arr[j][1] = Math.floor(arr[j][1]);
  }
  
  return __v3d_g_s;
}
  
//ltypeof function, that handles object instances of basic types
var ObjMap<String> _bt_h = {
  "String" : "string",
  "RegExp" : "regexp",
  "Number" : "number",
  "Function" : "function",
  "Array" : "array",
  "Boolean" : "boolean",
  "Error" : "error"
}

function btypeof(obj) {
  if (typeof obj == "object") {
    if (obj.constructor.name in _bt_h)
      return _bt_h[obj.constructor.name];
    else
      return "object";
  } else {
    return typeof obj;
  }
}

const TOTAL_IDMAP_LAYERS = 10

class SDIDLayer {
  idmap : Object;

  constructor(int_id) {
    this.int_id = int_id;
    this.idmap = {};
  }
  
  _save_idmap() {
    let ret = [];
    let idmap = this.idmap;
    
    for (let k in idmap) {
      var lst = idmap[k];
      
      ret.push(k);

      let len = 0;
      for (let k2 in lst) {
        len++;
      }
      ret.push(lst.length);

      for (let k2 in lst) {
        ret.push(lst[k2]);
      }
    }
    
    return ret;
  }
  
  static fromSTRUCT(reader) {
    var ret = new SDIDLayer();
    reader(ret);
    
    var idmap = {}, i = 0;
    while (i < ret.idmap.length) {
      var k = ret.idmap[i++], len = ret.idmap[i++];
      var lst = {};
      
      for (var j=0; j<len; j++) {
        var k2 = ret.idmap[i++];
        lst[k2] = k2;
      }
      
      ret.idmap[k] = lst;
    }
    
    ret.idmap = idmap;
    return ret;
  }
}
SDIDLayer.STRUCT = `
  SDIDLayer {
    int_id : int;
    idmap  : array(int) | obj._save_idmap();
  }
`;

class SDIDLayerListIter {
  ret : Object
  i : number;

  constructor(list) {
    var keys = Object.keys(list);
    this.arr = [];
    
    for (var i=0; i<keys.length; i++) {
      var k = keys[i];
      if (k === 'layers') continue;
      
      this.arr.push(k);
    }
    
    for (var i=0; i<this.arr.length; i++) {
      this.arr[i] = list[this.arr[i]];
    }
    
    this.list = list;
    this.ret = {done : false, value : undefined};
    this.i = 0;
  }

  [Symbol.iterator]() {
    return this;
  }
  
  next() { 
    var ret = this.ret;
    if (this.i >= this.arr.length) {
      ret.done = true;
      ret.value = undefined;
      return ret;
    }
    
    ret.value = this.arr[this.i++];
    return ret;
  }
  
  reset() {
    this.i = 0;
    this.arr = Object.keys(this.list);
    this.ret.done = false;
    this.ret.value = undefined;
  }
}

class SDIDLayerList {
  constructor() {
  }
  
  [Symbol.iterator]() {
    return new SDIDLayerListIter(this);
  }
  
  get_from_layer(layer, parent) {
    if (!(layer in this)) return undefined;
    
    return this[layer].idmap[parent];
  }
  
  
  copy() {
    var ret = new SDIDLayerList();
      
    for (var k of this) {
      var layer = this[k];
      var layer2 = new SDIDLayer(layer.int_id);
      
      ret[k] = layer2;
      
      for (var k in layer.idmap) {
        layer2.idmap[k] = {};
        
        for (var k2 in layer.idmap[k]) {
          layer2.idmap[k][k2] = layer.idmap[k][k2];
        }
      }
    }
    
    return ret;
  }
  
  add_to_layer(layer, parent, child) {
    if (layer == undefined) {
      throw new Error("Layer cannot be undefined", layer, parent);
    }
    
    if (!(layer in this)) {
        this[layer] = new SDIDLayer(layer);
    }
    
    layer = this[layer];
    if (!(parent in layer.idmap))
      layer.idmap[parent] = {};
    
    layer.idmap[parent][child] = child;
  }
  
  static fromSTRUCT(reader) {
    var ret = new SDIDLayerList();
    reader(ret);
    
    for (var i=0; i<ret.layers.length; i++) {
      ret[ret.layers[i].int_id] = ret.layers[i];
    }
    
    //delete ret.layers;
    
    return ret;
  }
}
SDIDLayerList.STRUCT = `
  SDIDLayerList {
    layers : iter(SDIDLayer) | this;
  }
`

//subdividing id generator
class SDIDGen {  
  cur_id : number
  idmap_layers : SDIDLayerList
  usedmap : Object
  freemap : Object;

  constructor() {
    this.cur_id = 1;
    
    this.idmap_layers = new SDIDLayerList();
    this.usedmap = {};
    
    this.freelist = [];
    this.freemap = {};
  }
  
  copy() {
    var ret = new SDIDGen();

    ret.cur_id = this.cur_id;
    ret.idmap_layers = this.idmap_layers.copy();
    
    return ret;
  }
  
  static fromSTRUCT(unpacker) {
    var g = new SDIDGen();
    
    unpacker(g);

    if (!g.idmap_layers) {
      g.idmap_layers = new SDIDLayerList();
    }

    for (var i=0; i<g.freelist.length; i++) {
      g.freemap[g.freelist[i]] = i;
    }
    
    var usedmap = {};
    for (var i=0; i<g.usedmap.length; i++) {
      usedmap[g.usedmap[i]] = 1;
    }
    g.usedmap = usedmap;
    
    return g;
  }
  
  //if cur is >= to this.cur_eid, 
  //set this.cur to cur+1
  max_cur(cur, depth) {
    this.cur_eid = Math.max(Math.ceil(cur)+1, this.cur_eid);
  }
  
  gen_id(parent : int=undefined, layer : int=0) {
    var id = this.cur_id++;
    
    /*we "guarantee" proper order of id generation by
      making sure cur_id is always at its smallest
      possible value.*/
    if (id in this.freemap) {
      this.freelist.remove(id);
      delete this.freemap[id];
    }
    
    this.usedmap[id] = 1;
    
    return id;
  }

  _save_usedmap() {
    let ret = [];

    for (let k in this.usedmap) {
      ret.push(parseInt(k));
    }

    return ret;
  }

  free_id(id) {
    if (id == this.cur_id-1) {
      this.cur_id--;
      
      while (this.cur_id >= 0 && this.cur_id-1 in this.freemap) {
        this.cur_id--;
      }
    }
    
    this.freemap[id] = this.freelist.length;
    this.freelist.push(id);
    
    delete this.usedmap[id];
  }
}

SDIDGen.STRUCT = `
SDIDGen {
  cur_id        : int;
  idmap_layers  : SDIDLayerList;
  usedmap       : iter(int) | this._save_usedmap();
  freelist      : array(int);
}
`;

