"not_a_module"; //todo: need to make this a module

if (Array.prototype.set === undefined) {
    Array.prototype.set = function set1(this: unknown[], array: ArrayLike<unknown>,
                                        src?: number, dst?: number, count?: number) {
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
    Array.prototype.reject = function reject(this: unknown[], func: (item: unknown) => boolean) {
        return this.filter(function(item) { return !func(item); });
    }
}

function* testr(obj: object) {
  for (var k in obj) {
    yield k;
  }
}

if (Math.sign == undefined) {
  Math.sign = function(f: number) {
    return 1.0 - (f < 0.0)*2.0;
  }
}

if (Math.fract == undefined) {
  Math.fract = function(f: number) {
    f = Math.abs(f);

    return f - Math.floor(f);
  }
}

if (Array.prototype.insert == undefined) {
  Array.prototype.insert = function(this: unknown[], before: number, item: unknown) {
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

var debug_int_1 = 0;

/* Was `static` inside cachering.fromConstructor(). fromConstructor throws past
   two arguments, so the only thing that ever lands here is `count`. Dead --
   nothing reads it back. */
const _fromConstructor_args: number[] = [];

class cachering<T> extends Array<T> {
  _cur! : number;

  constructor (createcallback : () => T, count=32) {
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

  static fromConstructor<T>(cls: new () => T, count=32) {
    const args = _fromConstructor_args;
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

class GArray<T> extends Array<T> {
  /* Lazily built on first iteration, shared by every GArray of this instance. */
  itercache : cachering<GArrayIter<T>> | undefined;

  constructor(input? : ArrayLike<T>) {
    super()

    if (input != undefined) {
      for (var i=0; i<input.length; i++) {
        this.push(input[i]);
      }
    }
  }

  slice(a? : number, b? : number) : GArray<T> {
    var ret = Array.prototype.slice.call(this, a, b);
    if (!(ret instanceof GArray))
      ret = new GArray(ret);

    return ret;
  }

  pack(data : number[]) {
    _ajax.pack_int(data, this.length);

    for (var i=0; i<this.length; i++) {
      this[i].pack(data);
    }
  }

  has(item : T) : boolean {
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

  toJSON() : T[] {
    var arr = new Array(this.length);

    var i = 0;
    for (var i=0; i<this.length; i++) {
      arr[i] = this[i];
    }

    return arr;
  }

  //inserts *before* index
  insert(index : number, item : T) {
    for (var i=this.length; i > index; i--) {
      this[i] = this[i-1];
    }
    
    this[index] = item;
    this.length++;
  }

  prepend(item : T) {
    this.insert(0, item);
  }

  pop_i(idx=-1) {
    if (idx < 0)
      idx += this.length;

    var ret = this[i];

    for (var i=idx; i<this.length-1; i++) {
      this[i] = this[i+1];
    }

    this.length -= 1;

    return ret;
  }

  remove(item : T, ignore_existence? : boolean) { //ignore_existence defaults to false
    var idx = this.indexOf(item);
    
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

  replace(olditem : T, newitem : T) {
    var idx = this.indexOf(olditem);
    
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

  toSource() : string {
    var s = "new GArray" + this.length + "([";

    for (var i=0; i<this.length; i++) {
      s += this[i];
      if (i != this.length-1)
        s += ", ";
    }

    s += "])";

    return s
  }

  toString() : string {
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
window.defined_classes = new GArray(window.defined_classes);

/* Iterates an object's values.  The global Iterator() yields [key, value]
   pairs, so this just projects out element 1. */
class obj_value_iter<T> {
  /* Reused for every step, like the rest of the iterators in this file. */
  ret : {done : boolean, value : T | undefined};
  obj : {[key : string] : T};
  iter : {next() : {done : boolean, value : [string, T]}};

  constructor(obj: {[key : string] : T}) {
    this.ret = {done : false, value : undefined};
    this.obj = obj;
    this.iter = Iterator(obj);
  }

  next() {
    var reti = this.ret;

    var ret = this.iter.next()
    if (ret.done) return ret;

    reti.value = ret.value[1];
    return reti;
  }

  [Symbol.iterator]() {
    return this;
  }
}


//turns any iterator into an array
function list<T>(iter : Iterable<T>) : GArray<T> {
  var lst = new GArray<T>();

  var i = 0;
  for (var item of iter) {
    lst.push(item);
    i++;
  }
  
  lst.length = i;
  
  return lst;
}


function time_func(func : () => void, steps=10) {
  var times : number[] = [];
  
  for (var i=0; i<steps; i++) {
    var last_ms = time_ms();
    func();
    times.push(time_ms()-last_ms);
  }
  
  console.log(times);
  return times;
}

/* Was `static` inside cached_list(); the transpiler hoisted it to module scope,
   so the cache persists across calls. Written without <T> — T isn't in scope here. */
const _cached_list_lst = new GArray();

//turns any iterator into a (cached) array
function cached_list<T>(iter) : GArray<T> {
  const lst = _cached_list_lst;

  lst.reset();
  
  var i = 0;
  for (var item of iter) {
    lst.push(item);
    i++;
  }
  
  lst.length = i;
  
  return lst;
}


var g_list = list;

/* Dead -- nothing constructs one, and `GeoArrayIter` never existed in this
   codebase. Kept verbatim; the element type is a [type, eid] pair. */
class eid_list extends GArray<[number, number]> {
  constructor(iter : Iterable<{type : number, eid : number}>) {
    super();

    for (var item of iter) {
      this.push([item.type, item.eid]);
    }
  }
}

Number.prototype[Symbol.keystr] = function(this : number) : number {
  return this;
}

String.prototype[Symbol.keystr] = function(this : string) : string {
  return this;
}

Array.prototype[Symbol.keystr] = function(this : Object[]) : string {
  var s = ""
  for (var i=0; i<this.length; i++) {
    s += this[i][Symbol.keystr]()+"|"
  }

  return s
}


/* Placeholder left behind in `set`'s backing list when an item is removed, so
   the surviving indices stay valid. */
var _set_null = {set_null : true};

/* The mutable iterator-result object these hand-rolled iterators recycle.
   Deliberately not TS's IteratorResult<T>, which is a discriminated union and
   so cannot be updated field by field. */
type IterRet<T> = {done : boolean, value : T | undefined};

/* An entry in `set`'s backing list: a live item, or the removal placeholder. */
type SetSlot<T> = T | typeof _set_null;

/* Whatever [Symbol.keystr]() returns. Most implementations give a string, a
   couple give a number; either works because it is only ever an object key. */
type KeyStr = string | number;

class SetIter<T extends Keyable> {
  i : number
  done : boolean
  ret : IterRet<T>;
  set : set<T>;
  list : SetSlot<T>[];

  constructor(set : set<T>) {
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

class set<T extends Keyable> {
  /* keystr -> index into `list`. */
  items : Record<KeyStr, number>
  length : number
  _itercache : cachering<SetIter<T>>;
  /* Indices into `list` freed by remove(), reused before the list grows. */
  freelist : number[];
  list : SetSlot<T>[];

  constructor(input? : Iterable<T> | ArrayLike<T>) {
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
  
  forEach(cb : (item : T) => void, thisvar? : object) {
    if (thisvar === undefined)
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
    var ret = new set<T>();

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

  toJSON() : Array<T> {
    return this.asArray();
  }

  toSource() : string {
    return "new set(" + list(this).toSource() + ")";
  }
}

class GArrayIter<T> {
  ret : IterRet<T>
  cur : number;
  arr : GArray<T>;

  constructor(arr : GArray<T>) {
    this.ret = {done : false, value : undefined};
    this.arr = arr;
    this.cur = 0;
  }
  
  init(arr : GArray<T>) : GArrayIter<T> {
    this.ret.done = false; this.ret.value = undefined;
    this.arr = arr;
    this.cur = 0;
    
    return this;
  }
  
  next() : IterRet<T> {
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

class ArrayIter<T> {
  ret : IterRet<T>
  cur : number;
  arr : Array<T>;

  constructor(arr : Array<T>) {
    this.ret = {done : false, value : undefined};
    this.arr = arr;
    this.cur = 0;
  }

  [Symbol.iterator]() {
    return this;
  }

  init(arr : Array<T>) {
    this.ret.done = false; this.ret.value = undefined;
    this.arr = arr;
    this.cur = 0;

    return this;
  }

  next() : IterRet<T> {
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

//surely browsers have fixes allocation issues with iterators by now. . .
//*
if (!window.TYPE_LOGGING_ENABLED) {
  Array.prototype[Symbol.iterator] = function () {
    if (this.itercache === undefined) {
      this.itercache = cachering.fromConstructor(ArrayIter, 8);
    }

    return this.itercache.next().init(this);
  }
}
//*/

/* Dead: hashtable[Symbol.iterator] returns a plain key-string iterator instead
   of one of these, despite its declared return type. Kept for reference. */
class HashKeyIter<K extends Keyable, V> {
  ret : IterRet<K>;
  hash : hashtable<K, V>;
  iter : Iterator<[KeyStr, V]>;

  constructor(hash : hashtable<K, V>) {
    this.ret = {done : false, value : undefined};
    this.hash = hash;
    this.iter = Iterator(hash.items);
  }

  next() : IterRet<K> {
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


/* Both maps are keyed by the *keystr* of K, not by K itself: `items` holds the
   values, `keymap` holds the original keys so they can be recovered. */
class hashtable<K extends Keyable, V> {
  items : Record<KeyStr, V>
  keymap : Record<KeyStr, K>
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

  /* Note that this hands the callback a keystr, not a key. */
  forEach(cb : (key : KeyStr) => void, thisvar? : object) {
    for (let k of this) {
      cb.call(thisvar, k);
    }
  }

  add(key : K, item : V) {
    if (!this.items.hasOwnProperty(key[Symbol.keystr]())) 
      this.length++;
    
    this.items[key[Symbol.keystr]()] = item;
    this.keymap[key[Symbol.keystr]()] = key;
  }

  remove(key : K) {
    if (!this.has(key)) {
      return false;
    }

    let keystr = key[Symbol.keystr]();

    delete this.items[keystr];
    delete this.keymap[keystr];
    this.length -= 1;

    return true;
  }

  /* Iterates *keystrs*, not keys -- run them back through getKey() for the
     original key objects. */
  [Symbol.iterator]() {
    return Object.keys(this.items)[Symbol.iterator]();
  }

  values() : Array<V> {
    var ret = new Array();

    for (var k of this) {
      ret.push(this.items[k]);
    }

    return ret;
  }

  /* Despite the name these are keystrs, for the same reason as the iterator. */
  keys() : GArray<KeyStr> {
    return list(this);
  }

  getKey(key : KeyStr) : K {
    return this.keymap[key];
  }

  get(key : K) : V {
    return this.items[key[Symbol.keystr]()];
  }

  set(key : K, item : V) {
    if (!this.has(key)) {
      this.length++;
    }
    
    this.items[key[Symbol.keystr]()] = item;
    this.keymap[key[Symbol.keystr]()] = key;
  }

  /* Broken: the constructor takes no arguments, the loop yields keystrs where
     add() wants keys, and `b.get[item]` should be `b.get(item)`. */
  union(b : hashtable<K, V>) : hashtable<K, V> {
    var newhash = new hashtable(this)

    for (var item of b) {
      newhash.add(item, b.get[item])
    }

    return newhash;
  }

  has(item : K) : boolean {
    if (item === undefined)
      console.trace();
    return this.items.hasOwnProperty(item[Symbol.keystr]())
  }
}

/* Dead. Left over from a half-edge mesh editor that no longer exists in this
   codebase, so these shapes are reconstructed from the body below. */
interface MeshVert extends Keyable {
  eid : number; _gindex : number; loop : MeshLoop | null; edges : Iterable<MeshEdge>;
}
interface MeshEdge extends Keyable {
  eid : number; _gindex : number; loop : MeshLoop | null; v1 : MeshVert; v2 : MeshVert;
  vert_in_edge(v : MeshVert) : boolean;
}
interface MeshLoop extends Keyable {
  eid : number; e : MeshEdge; v : MeshVert; f : MeshFace;
  next : MeshLoop; radial_next : MeshLoop;
}
interface MeshFace extends Keyable {
  eid : number; _gindex : number; verts : Iterable<MeshVert>; edges : Iterable<MeshEdge>;
  looplists : Iterable<Iterable<MeshLoop>>;
}
interface Mesh {
  verts : Iterable<MeshVert>; edges : Iterable<MeshEdge>; faces : Iterable<MeshFace>;
  eidmap : Record<number, MeshVert | MeshEdge | MeshFace>;
}

function validate_mesh_intern(m : Mesh) {
  var eidmap : Record<number, MeshVert | MeshEdge | MeshFace> = {};
  
  for (var f of m.faces) {
    var lset = new set<MeshLoop>();
    var eset = new set<MeshEdge>();
    var vset = new set<MeshVert>();
    
    
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
    
    var lset = new set<MeshLoop>();
    var fset = new set<MeshFace>();
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

/* Dead. */
function concat_array<T>(a1 : ArrayLike<T>, a2 : ArrayLike<T>) : GArray<T>
{
  var ret = new GArray<T>();
  
  for (var i=0; i<a1.length; i++) {
    ret.push(a1[i]);
  }
  
  for (var i=0; i<a2.length; i++) {
    ret.push(a2[i]);
  }
  
  return ret;
}


/* Dead at runtime: path.ux's util.ts assigns its own get_callstack/print_stack
   onto globalThis after the global scripts have run, overwriting both of these. */
function get_callstack(err? : Error) {
  var callstack : string[] = [];
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


function print_stack(err? : Error) {
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


function time_ms() : number {
  if (window.performance)
    return window.performance.now();
  else
    return new Date().getMilliseconds();
}


class movavg {
  value : number;
  /* jobs.ts:126 constructs one with no length, which leaves this undefined and
     wedges update() -- `arr.length < undefined` is never true. */
  len : number | undefined;
  arr : number[];

  constructor(length? : number) {
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
  
  update(val : number) {
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

/* Dead -- nothing constructs one. */
class Timer {
  normval : number;
  ival : number;
  last_ms : number;

  constructor(interval_ms : number) {
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

/* Dead, and from the same vanished mesh editor as validate_mesh_intern(). */
function other_tri_vert(e : MeshEdge, f : MeshFace) {
    for (var v of f.verts) {
        if (v != e.v1 && v != e.v2)
            return v;
    }
    
    return null;
}


var _sran_tab : number[] = [0.42858355099189227,0.5574386030715371,0.9436109711290556,
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
  _seed : number;

  constructor(seed? : number) {
    if (seed == undefined)
      seed = 0;

    this._seed = seed+1;
    this.i = 1;
  }
  
  seed(seed : number) {
    this._seed = seed+1;
    this.i = 1;
  }
  
  random() {
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

var seedrand = new StupidRandom2();

/* Dead. Rotation taking the +Z axis onto `no`. */
function get_nor_zmatrix(no : Vector3)
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
/* Dead. True for plain object literals, false for class instances. */
function is_obj_lit(obj : object) {
  if (obj.constructor.name in _o_basic_types)
    return false;
    
  if (obj.constructor.name == "Object")
    return true;
  if (obj.prototype == undefined)
    return true;
  
  return false;
}

class UnitTestError extends Error {
  msg : string;

  constructor(msg : string) {
    super(msg);
    this.msg = msg;
  }
}

function utest(func : () => void) {
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

/* `owner` is accepted and dropped; spline_element_array.ts is the only caller
   and it passes just a name. */
class EventDispatcher {
  name : string;
  callbacks : [Function, object | undefined][];

  constructor(name : string, owner? : object) {
    this.name = name;
    this.callbacks = [];
  }
  
  addListener(callback : Function, thisvar? : object) {
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
  static STRUCT : string;

  cur_eid : number;

  constructor() {
    this.cur_eid = 1;
  }
  
  static fromSTRUCT(unpacker : StructReader<EIDGen>) {
    var g = new EIDGen();
    unpacker(g);
    
    return g;
  }
  set_cur(cur : number) {
    this.cur_eid = Math.ceil(cur);
  }

  //if cur is >= to this.cur_eid, 
  //set this.cur to cur+1
  max_cur(cur : number) {
    this.cur_eid = Math.max(Math.ceil(cur)+1, this.cur_eid);
  }
  /* `cur` is ignored. */
  get_cur(cur? : number) {
    return this.cur_eid;
  }
  
  eid_max_cur(t : number) {
    return this.max_cur(t);
  }
  
  /* `typemask` is ignored -- eids are unique across every element type. */
  gen_eid(typemask=0) {
    return this.cur_eid++;
  }
  
  gen_id() {
    return this.gen_eid();
  }
  
  toJSON() {
    return { cur_eid : this.cur_eid };
  }
  static fromJSON(obj : {cur_eid : number}) {
    var idgen = new EIDGen()
    idgen.cur_eid = obj.cur_eid;
    
    return idgen;
  }
}
EIDGen.STRUCT = `
  EIDGen {
    cur_eid : int;
  }`;

/* Dead. Shallow-copies src's own keys onto dst. */
function copy_into<T extends object>(dst : T, src : object) {
  console.log(dst);
  
  var keys2 = list(obj_get_keys(src));
  for (var i=0; i<keys2.length; i++) {
    var k = keys2[i];
    dst[k] = src[k];
  }
  
  console.log(dst);
  
  return dst;
}

/* Dead. Cache for get_spiral(); holds the last size it was asked for. */
var __v3d_g_s : [number, number][] = [];
function get_spiral(size : number)
{
  if (__v3d_g_s.length == size*size)
    return __v3d_g_s;
  
  var arr = __v3d_g_s;
  
  var x = Math.floor((size-1)/2);
  var y = Math.floor((size-1)/2);
  
  var c : number;
  var i : number;
  
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
    var sign = (Math.floor(i/2) % 2)==1 ? -1.0 : 1.0;
    
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
var _bt_h : Record<string, string> = {
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

/* One layer of the save-data id map: local id -> a set of ids, stored as a
   self-keyed object. nstructjs flattens it to a flat int array on write (see
   _save_idmap) and fromSTRUCT unflattens it, so during load `idmap` is
   transiently that flat array. */
class SDIDLayer {
  static STRUCT : string;

  idmap : Record<number, Record<number, number>>;
  int_id : number;

  constructor(int_id : number) {
    this.int_id = int_id;
    this.idmap = {};
  }
  
  /* Broken: `lst` is an object, so lst.length is undefined and the `len` counted
     just above is thrown away. fromSTRUCT then reads that undefined back. */
  _save_idmap() {
    let ret : number[] = [];
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
  
  /* Also broken: the unflattened entries are written into ret.idmap, then
     ret.idmap is overwritten with the empty local `idmap`. */
  static fromSTRUCT(reader : StructReader<SDIDLayer>) {
    var ret = new SDIDLayer();
    reader(ret);

    var idmap : Record<number, Record<number, number>> = {}, i = 0;
    while (i < ret.idmap.length) {
      var k = ret.idmap[i++], len = ret.idmap[i++];
      var lst : Record<number, number> = {};

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

/* Dead. Iterates a SplineLayerSet's layers by skipping its `layers` key. */
class SDIDLayerListIter<T> {
  ret : IterRet<T>
  i : number;
  arr : T[];
  list : Record<string, T>;

  constructor(list : Record<string, T>) {
    var keys = Object.keys(list);
    var used : string[] = [];

    for (var i=0; i<keys.length; i++) {
      var k = keys[i];
      if (k === 'layers') continue;

      used.push(k);
    }

    this.arr = [];
    for (var i=0; i<used.length; i++) {
      this.arr.push(list[used[i]]);
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
  
  /* This used to rebuild arr from Object.keys(list), i.e. keys where the
     constructor stores values -- reusing an iterator yielded the wrong thing. */
  reset() {
    this.i = 0;
    this.arr = [];
    for (let k in this.list) {
      if (k !== 'layers') this.arr.push(this.list[k]);
    }
    this.ret.done = false;
    this.ret.value = undefined;
  }
}

class SDIDGen {
  static STRUCT : string;

  cur_id : number;

  constructor() {
    this.cur_id = 1;
  }

  copy() {
    let ret = new SDIDGen();

    ret.cur_id = this.cur_id;

    return ret;
  }

  loadSTRUCT(reader : StructReader<this>) {
    reader(this);
  }

  max_cur(id : number) {
    this.cur_id = Math.max(this.cur_id, Math.ceil(id)+1);
    return this;
  }

  gen_id() {
    return this.cur_id++;
  }
}

SDIDGen.STRUCT = `
SDIDGen {
  cur_id        : int;
}
`;
