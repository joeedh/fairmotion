/*
it looks like this implementation doesn't
pass referred objects to property.update 
callbacks.  eek.

okay, I shall make it do so.  hopefully this doesn't
push the code over its entropy limit and force a refactor,
I was planning on doing that later.
*/

/*
  Refactor notes:

  Helper methods to build APIs are CamelCased, as opposed to camelCase, so e.g.

    Struct.Float(..).Range(0, 100).OnUpdate(bleh);

*/

function is_int(s) {
  s = s.trim();

  if (typeof s == "number") {
    return s == ~~s;
  }

  let m = s.match(/(\-)?[0-9]+/);

  if (!m)
    return false;

  return m[0].length == s.length;
}
window._is_int = is_int;

export var DataPathTypes = {PROP: 0, STRUCT: 1, STRUCT_ARRAY : 2};
export var DataFlags = {NO_CACHE : 1, RECALC_CACHE : 2};

import * as config from 'config';
import * as safe_eval from 'safe_eval';

export class TinyParserError extends Error {
}

//$XXX import {UIFrame} from 'UIFrame';
import {PropTypes, TPropFlags, ToolProperty, IntProperty, FloatProperty, 
        Vec3Property, Vec4Property, StringProperty, FlagProperty, EnumProperty} from 'toolprops';
import {ToolFlags, UndoFlags} from 'toolops_api';
import {DataBlock} from 'lib_api';
import {apiparser} from 'data_api_parser';

import {MultiResLayer, MultiResEffector, MResFlags, has_multires, 
        ensure_multires, iterpoints, compose_id, decompose_id
       } from 'spline_multires';

import * as safe_eval from 'safe_eval';

export * from 'data_api_base';
import {
  DataPathTypes, DataFlags, DataAPIError
} from 'data_api_base';

export class DataPath {
  constructor(prop, name, path, dest_is_prop=false, use_path=true, flag=0) { 
    this.flag = flag;
    
    this.dest_is_prop = dest_is_prop
    
    //need to get rid of dest_is_prop paramter;
    //for now, use as sanity variable.
    if (prop == undefined)
      this.type = dest_is_prop ? DataPathTypes.PROP : DataPathTypes.STRUCT;
    
    if (prop != undefined && prop instanceof ToolProperty) {
      this.type = DataPathTypes.PROP;
    } else if (prop != undefined && prop instanceof DataStruct) {
      this.type = DataPathTypes.STRUCT;
      prop.parent = this;
      
      //XXX need to fold DataPath/Struct/StructArray
      //instead of linking member variables in struct/structarray
      //with containing datapath
      this.pathmap = prop.pathmap;
    } else if (prop != undefined && prop instanceof DataStructArray) {
      this.type = DataPathTypes.STRUCT_ARRAY;
      prop.parent = this;
      
      //XXX need to fold DataPath/Struct/StructArray
      //instead of linking member variables in struct/structarray
      //with containing datapath
      this.getter = prop.getter;
    }
    
    this.name = name
    this.data = prop;
    this.path = path;
    this.update = undefined : Function;
    
    this.use_path = use_path;
    this.parent = undefined;
  }

  OnUpdate(func) {
    this.update = func;

    if (this.data !== undefined) {
      this.data.update = func;
    }

    return this;
  }

  Default(val) {
    this.data.value =  val;
  }

  Range(min, max) {
    this.data.range = [min, max];
    return this;
  }

  SetFlag(flag) {
    this.data.flag |= flag;
  }

  ClearFlag() {
    this.data.flag = 0;
  }

  FlagsUINames(uinames) {
    this.data.setUINames(uinames);
  }

  cache_good() {
    var p = this;
    
    while (p != undefined) {
      if (p.flag & DataFlags.RECALC_CACHE)
        return false;
      p = p.parent;
    }
    
    return true;
  }
}

export class DataStructIter {
  constructor(s) {
    this.ret = {done : false, value : undefined}; //cached_iret();
    this.cur = 0;
    
    this.strct = s;
    this.value = undefined;
  }
  
  [Symbol.iterator]() { return this; }
  
  reset() {
    this.cur = 0;
    this.ret.done = false;
    this.ret.value = undefined;
  }
  
  next() {
    if (this.cur >= this.strct.paths.length) {
      var ret = this.ret;
      
      this.cur = 0;
      
      ret.done = true;
      this.ret = {done : false, value : undefined}; //cached_iret();
      
      return ret;
    }
    
    var p = this.strct.paths[this.cur++];
    p.data.path = p.path;
    
    this.ret.value = p;
    return this.ret;
  }
}

/*array_item_struct_getter is a function that takes
  one of the array items in path, and returns 
  a struct definition
 */
export class DataStructArray {
  constructor(array_item_struct_getter, getitempath, getitem, getiter, getkeyiter, getlength) {
    this.getter = array_item_struct_getter;
    this.getiter = getiter;
    this.getlength = getlength;
    this.getkeyiter = getkeyiter;
    this.getitem = getitem;
    this.getitempath = getitempath;
    
    this.type = DataPathTypes.STRUCT_ARRAY;
  }
}

export class DataStruct {
  constructor(paths) {
    this.paths = new GArray(paths);
    this.pathmap = {}
    this.parent = undefined;
    
    this._flag = 0;
    
    for (var p of this.paths) {
      p.parent = this;
      this.pathmap[p.name] = p
      
      if (p.type == DataPathTypes.PROP) {
        p.data.path = p.path;
      }
    }
    
    this.type = DataPathTypes.STRUCT;
  }

  Color3(apiname, path, uiname, description) {
    var ret = new Vec3Property(0, apiname, uiname, description);
    ret.subtype = PropTypes.COLOR3;

    ret = new DataPath(ret, apiname, path, path!=undefined);
    this.add(ret);

    return ret;
  }

  Color4(apiname, path, uiname, description) {
    var ret = new Vec4Property(0, apiname, uiname, description);
    ret.subtype = PropTypes.COLOR4;

    ret = new DataPath(ret, apiname, path, path!=undefined);
    this.add(ret);

    return ret;
  }

  Vector2(apiname, path, uiname, description) {
    var ret = new Vec2Property(0, apiname, uiname, description);

    ret = new DataPath(ret, apiname, path, path!=undefined);
    this.add(ret);

    return ret;
  }

  Vector3(apiname, path, uiname, description) {
    var ret = new Vec3Property(0, apiname, uiname, description);

    ret = new DataPath(ret, apiname, path, path!=undefined);
    this.add(ret);

    return ret;
  }

  Bool(apiname, path, uiname, description) {
    var ret = new BoolProperty(0, apiname, uiname, description);

    ret = new DataPath(ret, apiname, path, path!==undefined);
    this.add(ret);

    return ret;
  }

  Flags(flags, apiname, path, uiname, description) {
    var ret = new FlagProperty(0, flags, undefined, apiname, uiname, description);
    
    ret = new  DataPath(ret, apiname, path, path!==undefined);
    this.add(ret);
    return ret;
  }

  Float(apiname, path, uiname, description) {
    var ret = new FloatProperty(0, apiname, uiname, description);
    
    ret = new DataPath(ret, apiname, path, path!==undefined);
    this.add(ret);
    
    return ret;
  }
  
  Struct(apiname, path, uiname, description) {
    var ret = new DataStruct([]);
    
    var path = new DataPath(ret, apiname, path, path!=undefined);
    this.add(path);
    
    return ret;
  }  
  
  Int(apiname, path, uiname, description) {
    var ret = new IntProperty(0, apiname, uiname, description);

    ret = new DataPath(ret, apiname, path, path != undefined);
    this.add(ret);

    return ret;
  }

  [Symbol.iterator]() {
    return new DataStructIter(this);
  }
  
  get flag() {
    return this._flag;
  }
  
  cache_good() {
    var p = this;
    
    while (p != undefined) {
      if (p.flag & DataFlags.RECALC_CACHE)
        return false;
      p = p.parent;
    }
    
    return true;
  }
  
  set flag(val) {
    this._flag = val;
    
    function recurse(p, flag) {
      p.flag |= flag;
      
      if (p instanceof DataStruct) {
        for (var p2 of p.paths) {
          if (p2 instanceof DataStruct) {
            //hand off to substruct;
            //we don't want to double recurse
            p2.flag |= flag;
          } else {
            recurse(p2, flag);
          }
        }
      }
    }
    
    if (val &  DataFlags.NO_CACHE) {
      for (var p of this.paths) {
        recurse(p, DataFlags.NO_CACHE);
      }
    }
    if (val &  DataFlags.RECALC_CACHE) {
      for (var p of this.paths) {
        recurse(p, DataFlags.RECALC_CACHE);
      }
    }
  }
  
  add(p) {
    if (this._flag & DataFlags.NO_CACHE)
      p._flag |= DataFlags.NO_CACHE;
    
    this.pathmap[p.name] = p;
    this.paths.push(p);
    p.parent = this;
  }

  replace(p, p2) {
    for (var p2 of this.paths) {
      if (p2.name == p.name) {
        this.flag |= DataFlags.RECALC_CACHE;
        this.paths.remove(p2);
        delete this.pathmap[p2.name];
        break;
      }
    }
    
    this.add(p);
  }
}

/*TinyParser is optimization to only be used with the data api.
  DO NOT USE IT ELSEWHERE.  It can only process a limited number
  of tokens (due to its reliance on the obj cache system), 
  and once the limit is reached it won't warn you.

  always use parseutils.js for general-purpose parsing tasks.*/
  
var _TOKEN = 0
var _WORD = 1
var _STRLIT = 2 //string literals always use single quotations, e.g. "'". (not backticks, which are "`")

var _LP = "("
var _RP = ")"
var _LS = "["
var _RS = "]"
var _CM = ","
var _EQ = "="
var _DT = "."

class TinyParser {
  constructor(data) {
    var tpl = TinyParser.ctemplates;
    
    this.toks = objcache.fetch(tpl.toks);
    this.toks.length = 0;
    
    this.split_chars = TinyParser.split_chars; 
    this.ws = TinyParser.ws; 
    this.data = data
    
    this.cur = 0;
  }
  
  reset(data) {
    this.cur = 0;
    this.toks.length = 0;
    this.data = data;
    
    if (data != undefined && data != "")
      this.lex();
  }
  
  gen_tok(a, b) {
    var ret = objcache.fetch(TinyParser.ctemplates.token);
    
    ret[0] = a;
    ret[1] = b;
    ret.length = 2;
    
    return ret;
  }
  
  lex(data) {
    var gt = this.gen_tok;
    
    if (data == undefined)
      data = this.data;
    
    var toks = this.toks
    var tok = undefined
    
    var in_str = false;
    var lastc = 0;
    
    var i = 0;
    while (i < data.length) {
      var c = data[i];
      
      if (c == "'" && lastc != "\\") {
        in_str ^= 1;
        
        if (in_str) {
          tok = gt("", _STRLIT)
          toks.push(tok)
        } else {
          tok = undefined;
        }
      } else if (in_str) {
        tok[0] += c;
      } else if (this.ws.has(c)) {
        if (tok != undefined && tok[1] == _WORD) {
          tok = undefined;
        }
      } else if (this.split_chars.has(c)) {
        toks.push(gt(c, _TOKEN));
        tok = undefined
      } else {
        if (tok == undefined) {
          tok = gt("", _WORD)
          toks.push(tok)
        }
        tok[0] += c
      }
      
      lastc = c;
      i += 1;
    }
  }
  
  next() {
    this.cur++;
    if (this.cur-1 < this.toks.length) {
      return this.toks[this.cur-1]
    }
    
    return undefined;
  }
  
  peek() {
    if (this.cur < this.toks.length) {
      return this.toks[this.cur]
    }
    
    return undefined;
  }
  
  expect(type, val) {
    if (this.peek()[1] != type) {
      console.trace("Unexpected token " + this.peek[0] + ", expected " + (type==_WORD?"WORD":val));
      throw new TinyParserError();
    }
    
    if (type == _TOKEN && this.peek()[0] != val) {
      console.trace("Unexpected token " + this.peek[0]);
      throw new TinyParserError();
    }
    
    return this.next()[0];
  }  
};

import {
  AnimKey, AnimChannel, AnimKeyFlags, AnimInterpModes
} from 'animdata';

TinyParser.ctemplates = {
  toks : {obj : Array(64), init : function(val) { val.length = 0; }},
  token : {obj : ["", ""], cachesize : 512}
};

TinyParser.split_chars = new set([",", "=", "(", ")", ".", "$", "[", "]"]);
TinyParser.ws = new set([" ", "\n", "\t", "\r"]);

import {toolmap} from 'data_api_pathux';

export class DataAPI { 
  constructor(appstate) {
    this.appstate = appstate;
    
    //this.ops = data_ops_list;
    this.parser = new TinyParser();
    this.parser2 = apiparser();
    
    this.root_struct = ContextStruct;
    
    this.cache = {};
    this.evalcache = {};
    this.evalcache2 = {};
    this.op_keyhandler_cache = {};
  }
  
  parse_call_line_intern(ctx, line) {
    var p = this.parser;
    
    function parse_argval(p) {
      var val;
      
      if (p.peek()[1] == _STRLIT) {
       val = p.next()[0];
      } else {
        val = p.expect(_WORD)
      }
      
      var args;
      
      if (p.peek()[0] == _LP) {
        args = parse_call(p);
      }
      
      return [val, args];
    }
    
    function parse_arg(p) {
      var arg = p.expect(_WORD);
      var val = undefined;
      
      if (p.peek()[0] == _EQ) {
        p.next(); 
        val = parse_argval(p);  
      }
      
      return [arg, val];
    }
    
    function parse_call(p) {
       p.expect(_TOKEN, _LP);
      var args=[];
      var t = undefined
      
      while (p.peek() != undefined) {
        if (p.peek()[1] == _WORD) {
          args.push(parse_arg(p));
        } else if (p.peek()[0] == _CM) {
          p.next();
        } else {
          p.expect(_TOKEN, _RP);
          break;
        }
      }
      
      return args;
    }
    
    if (line.contains(_LP)==0)
      throw new TinyParserError();
    
    var li = line.search(/\(/);
    
    path = line.slice(0, li);
    line = line.slice(li, line.length);
    
    p.reset(line);
    var call = parse_call(p)
    
    path = path.trimRight().trimLeft();
    
    var ret = objcache.array(2);
    ret[0] = path; ret[1] = call;
    
    return ret;
  }
  
  parse_call_line(ctx, line) {
    if (line == undefined) {
      line = ctx;
      ctx = new Context();
    }
    
    try {
      var ret = this.parse_call_line_intern(ctx, line);
      return ret;
    } catch (error) {
      if (!(error instanceof TinyParserError)) {
        throw error;
      } else {
        console.log("Could not parse tool call line " + line + "!");
      }
    }
  }
  
  do_selectmode(ctx, args) {
    return ctx.view2d.selectmode;
  }
  
  do_datapath(ctx, args) {
    if (args == undefined || args.length == 0 || args[0].length != 1) 
    {
      console.log("Invalid arguments to do_datapath()")
      throw TinyParserError();
    }
    
    return args[0];
  }
  
  //get active spline vertex eid
  do_active_vertex(ctx, args) {
    var spline = ctx.spline;
    var v = spline.verts.active;
    
    return v == undefined ? -1 : v.eid;
  }
  
  do_mesh_selected(ctx, args) {
    if (args == undefined || args.length == 0 || args[0].length != 2) 
    {
      console.log("Invalid arguments to do_mesh_selected()")
      throw TinyParserError();
    }
    
    var val = args[0][0]
    var typemask = 0
    for (var i=0; i<val.length; i++) {
      c = val[i].toLowerCase()
      if (c == "v") {
        typemask |= MeshTypes.VERT;
      } else if (c == "e") {
        typemask |= MeshTypes.EDGE;
      } else if (c == "f") {
        typemask |= MeshTypes.FACE;
      } else {
        console.log("Invalid arguments to do_mesh_select(): " + c);
        throw TinyParserError();
      }
    }
    
    var mesh = ctx.mesh;
    if (mesh == undefined) {
      console.trace();
      console.log("Mesh operation called with bad context");
      console.log("Creating dummy mesh. . .");
      console.log(ctx);
      
      mesh = new Mesh();
    }
    
    return new MSelectIter(typemask, mesh);
  }
  
  prepare_args(ctx, call) { //args is private/optional
    var args = {};
    for (var i=0; i<call.length; i++) {
      var a = call[i];
      
      if (a[1] != undefined) {
        if ("do_" + a[1][0] in this) {
          args[a[0]] = this["do_" + a[1][0]](ctx, a[1][1], a[1], a);
        } else if (typeof a[1][0] == "string") {
          args[a[0]] = a[1][0];
        } else if (typeof a[1][0] == "number" || parseFloat(a[1][0]) != NaN) {
          args[a[0]] = parseFloat(a[1][0]);
        } else {
          console.log("Invalid initializer" + a[1][1], a[1], a);
        }
      } else {
        console.log("Error: No parameter for undefined argument " + a[0]);
        throw TinyParserError();
      }
    }

    return args;
  }

  get_opclass_intern(ctx, str) {
    var ret = this.parse_call_line(ctx, str);

    if (ret == undefined)
      return;

    var call = ret[1];
    var path = ret[0];

    if (!(path in toolmap)) { //this.ops)) {
      console.error("Invalid api call " + str + "!");
      return;
    }

    return toolmap[path];
  }

  get_op_intern(ctx, str) {
    var ret = this.parse_call_line(ctx, str);
    
    if (ret == undefined)
      return;
    
    var call = ret[1];
    var path = ret[0];
    
    if (!(path in toolmap)) { //this.ops)) {
      console.error("Invalid api call " + str + "!");
      return;
    }
    
    var args = this.prepare_args(ctx, call);

    let cls = toolmap[path];
    let op = cls.invoke(ctx, args);
    //var op = this.ops[path](ctx, args)

    return op;
  }
  
  get_op_keyhandler(ctx, str) {
    //$XXX
    console.warn("get_op_keyhandler: implement me!");
#if 0
    //build hash key from active screen area and str;
    var hash = str;
    if (ctx.screen.active.type != undefined)
        hash += ctx.screen.active.type;
      
    if (hash in this.op_keyhandler_cache) {
      return this.op_keyhandler_cache[hash];
    }
    
    function find_hotkey_recurse(element) {
      if (element == undefined)
        return undefined;
      
      //console.log("element: ", element, element.active);
      
      var maps = element.get_keymaps();
      for (var i=0; i<maps.length; i++) {
        var km = maps[i];
        
        var handler = km.get_tool_handler(str);
        if (handler != undefined)
          return handler;
      }
      
      if (element instanceof UIFrame && element.active != undefined)
      {
        return find_hotkey_recurse(element.active);
      }
    }
    
    //cache final result
    this.op_keyhandler_cache[hash] = find_hotkey_recurse(ctx.screen);
    return this.op_keyhandler_cache[hash] ;
#endif
  }
  
  call_op(ctx, str) {
    if (RELEASE)
      return this.call_op_release(ctx, str);
    else
      return this.call_op_debug(ctx, str);
  }
  
  call_op_debug(ctx, str) {
    console.log("calling op", str);
    
    var op = this.get_op_intern(ctx, str);
    
    if (op == undefined) {
      throw new Error("Unknown tool '" + str + "'!");
    }
    
    if (op.flag & ToolFlags.USE_DEFAULT_INPUT) {
      this.appstate.toolstack.default_inputs(ctx, op);
    }
    
    this.appstate.toolstack.exec_tool(op);
  }
  
  call_op_release(ctx, str) {
    try {
      var op = this.get_op_intern(ctx, str);
      
      if (op.flag & ToolFlags.USE_DEFAULT_INPUT) {
        this.appstate.toolstack.default_inputs(ctx, op);
      }
      
      this.appstate.toolstack.exec_tool(op);
    } catch (error) {
      console.log("Error calling " + str);
      console.trace();
    }
  }
  
  get_op_uiname(ctx, str) {
    if (str == undefined) {
      str = ctx;
      ctx = new Context();
    }
    
    try {
      var op = this.get_op_intern(ctx, str);
      return op.uiname;
    } catch (error) {
      if (!(error instanceof TinyParserError)) {
        throw error;
      } else {
        console.log("Error calling " + str);
        console.trace();
      }
    }
  }
  
  get_op(ctx, str) {
    if (str == undefined) {
      str = ctx;
      ctx = new Context();
    }
    
    try {
      var op = this.get_op_intern(ctx, str);
      return op;
    } catch (error) {
      if ((error instanceof TinyParserError)) {
        throw error;
      } else {
        console.log("Error calling " + str);
        console.trace();
      }
    }
  }

  get_opclass(ctx, str) {
    if (str == undefined) {
      str = ctx;
      ctx = new Context();
    }

    try {
      var op = this.get_opclass_intern(ctx, str);
      return op;
    } catch (error) {
      if ((error instanceof TinyParserError)) {
        throw error;
      } else {
        console.log("Error calling " + str);
        console.trace();
      }
    }
  }

  copy_path(path) {
    var ret = [];
    
    ret.push(path[0]);
    for (var i=1; i<path.length; i++) {
      ret.push(copy_object_deep(path[i]));
    }
    
    return ret;
  }

  _build_path(dp) {
    var s = "";
    while (dp != undefined) {
      if (dp instanceof DataPath)
        s = dp.path + "." + s;
      
      dp = dp.parent;
    }
    
    s = s.slice(0, s.length-1); //get rid of trailing '.' 
    return s;
  }

  on_frame_change(ctx, time) {
    //console.log("api time update!", time);
    
    for (var id in ctx.datalib.idmap) {
      var block = ctx.datalib.idmap[id];
      
      for (var ch of block.lib_anim_channels) {
        //console.log("setting path", ch.path, ch.evaluate(time));
        this.set_prop(ctx, ch.path, ch.evaluate(time));
      }
    }
  }
  
  key_animpath(ctx, owner, path, time) {
    if (ctx == undefined) {
      time = path;
      path = ctx;
      ctx = new Context();
    }
    
    path = path.trim();
    var ret = this.resolve_path_intern(ctx, path);
    
    if (ret == undefined || ret[0] == undefined) {
      console.log("Error, cannot set keyframe for path", path, "!");
      return;
    }
    
    var prop = ret[0];
    if (!(path in owner.lib_anim_pathmap)) {
      //create a new path
      //eek, this should be a generic function somewhere, but where?
      //within DataBlock?
      
      var name = path.split(".");
      name = name[name.length-1];
      
      var ch = new AnimChannel(prop.type, name, path);
      ch.idgen = owner.lib_anim_idgen;
      ch.idmap = owner.lib_anim_idmap;
      
      /*stupid, but possibly useful code to extract an owning
        DataBlock from an arbitrary datapath.
        
      //find owning datablock
      var si = path.search("[") >= 0;
      var path2 = path;
      if (si >= 0) {//cut out array references
        path2 = path2.slice(0, si);
      }
      
      var ob;
      do {
        var ob = this.get_object(path2);
        if (ob != undefined && ob instanceof DataBlock)
          break;
        
        ob = undefined;
        
        var si = path.length-1;
        while (si >= 0 && path[si] != ".") si--;
        
        if (si <= 0) break;
        
        path = path.slice(0, si);
      } while (path.length > 0);
      
      if (ob == undefined) {
        console.log("Could not find owning datablock for ", path, "! Using scene!");
        ob = ctx.scene;
      }*/
      
      ch.owner = owner;
      owner.lib_anim_pathmap[path] = ch;
      owner.lib_anim_channels.push(ch);
    }
    
    var ch = owner.lib_anim_pathmap[path];
    var val = this.get_prop(ctx, path);
    
    ch.update(time, val);
  }
  
  resolve_path_intern(ctx, str) {  
    if (str == undefined) {
      str = ctx;
      ctx = new Context();
    }
    
    static cache = {};
    
    if (str == undefined) {
      warntrace("Warning, undefined path in resolve_path_intern (forgot to pass ctx?)");
      return undefined;
    }
    
    try {
      if (!(str in cache)) {
        var ret = this.resolve_path_intern2(ctx, str);
        
        //copy
        var ret2 = []
        for (var i=0; i<ret.length; i++) {
          ret2.push(ret[i]);
        }
        
        cache[str] = ret2;
      } else {
        var ret = cache[str];
        
        if (ret[0] != undefined && !ret[0].cache_good()) {
          delete cache[str];
          return this.resolve_path_intern(ctx, str);
        }
      }
      
      return ret;
    } catch (_err) {
      print_stack(_err);
      console.log("error: ", str);
    }
    
    return undefined;
  }
  
  resolve_path_intern2(ctx, str) {  
    var parser = this.parser2;
    
    var arr_index = undefined;
    var build_path = this._build_path;
    
    //not sure if still need to use arrays as containers like this
    var pathout = [""];
    var spathout = ["ContextStruct"];
    var ownerpathout = [""];
    var mass_set = undefined;
    var this2 = this;
    
    function do_eval(node, scope, pathout, spathout) {
      if (node.type == "ID") {
        if (scope == undefined) {
          console.log("data api error: ", str + ", " + pathout[0] + ", " + spathout[0]);
        }
        
        /*
        if (node != undefined && scope.pathmap != undefined) {
          console.log(node.val in scope.pathmap, scope.pathmap[node.val]);
        }
        //*/
        
        if (scope.pathmap == undefined || !(node.val in scope.pathmap))
          return undefined;
          
        var ret = scope.pathmap[node.val];
        
        if (ret == undefined)
          return undefined;
         
        if (ret.use_path) {
          ownerpathout[0] = pathout[0];
          
          if (ret.path != "" && ret.path[0] != "[" && ret.path[0] != "(")
            pathout[0] = pathout[0] + "." + ret.path;
          else
            pathout[0] += ret.path
        }
        
        spathout[0] = spathout[0] + ".pathmap." + node.val;
        
        return ret;
      } else if (node.type == "EQUALS") {
        let ret = do_eval(node.children[0], scope, pathout, spathout);

        pathout[0] += "==";
        let val = node.children[1].value;

        if (typeof val == "string" || val instanceof String) {
          let prop = ret.data;

          if (prop.type == PropTypes.ENUM) {
            val = prop.values[val];
          }
        }

        pathout[0] += val;

        return ret;
      } else if (node.type == "CODE") {
        mass_set = {
          filter  : node.children[1].value,
          path    : str.slice(0, node.children[1].lexstart),
          subpath : str.slice(node.children[1].lexend, str.length).trim(),
          do_mass_set : true
        }
        
        if (mass_set.subpath[0] == ".")
          mass_set.subpath = mass_set.subpath.slice(1, mass_set.subpath.length);
        
        return mass_set; //do_eval(node.children[0], scope, pathout, spathout);
      } else if (node.type == ".") {
        var n2 = do_eval(node.children[0], scope, pathout, spathout);
        
        if (n2 != undefined) {
          if (n2 instanceof DataPath)
            n2 = n2.data;
          
          return do_eval(node.children[1], n2, pathout, spathout);
        }
      } else if (node.type == "ARRAY") {
        var array = do_eval(node.children[0], scope, pathout, spathout);
        var index = do_eval(node.children[1], scope, pathout, spathout);
        
        if (array == undefined) return undefined;
        
        //var transform_key = (array.type == DataPathTypes.PROP && array.data.type == PropTypes.FLAG);
        //transform_key = transform_key && isNaN(parseInt(index));
        if (index == undefined)
          index = node.children[1].val;
        
        arr_index = index;
        
        var is_flag = false;
        
        if (array.type == DataPathTypes.PROP && array.data.type == PropTypes.FLAG) {
          index = array.data.keys[index];
          spathout[0] += ".data.data & "+index;
          is_flag = true;
        } else if (array.type == DataPathTypes.PROP) {
          spathout[0] += ".data.data["+index+"]";
        }
        
        if (!array.use_path) {
          return array;
        } else {
          if (!is_flag) {
            ownerpathout[0] = pathout[0];
          }
          
          var path = pathout[0];
          
          path = path.slice(1, path.length);
          
          if (array.type == DataPathTypes.PROP && array.data.type == PropTypes.FLAG) {
            pathout[0] += "&"+index;
          } else if (array.type == DataPathTypes.STRUCT_ARRAY) {
            pathout[0] += array.data.getitempath(index);
          } else {
            pathout[0] += "["+index+"]";
          }
          
          if (array.type == DataPathTypes.STRUCT_ARRAY) {
            var arr = this2.evaluate(ctx, path, undefined);
            
            var stt = array.data.getter(arr[index]); 
            stt.parent = array;
            
            spathout[0] += ".getter(" + path + "[" + index + "]" + ")";
            return stt;
          } else {
            return array;
          }
        }
      } else if (node.type == "NUM") {
        return node.val;
      }
    }
    
    var ast = parser.parse(str);
    
    static sret = [0, 0, 0, 0, 0];
    
    sret[0] = do_eval(ast, ContextStruct, pathout, spathout);
    pathout[0] = pathout[0].slice(1, pathout[0].length);
    
    sret[1] = pathout[0];
    sret[2] = spathout[0];
    sret[3] = mass_set;
    sret[4] = ownerpathout[0].slice(1, ownerpathout[0].length);
    
    return sret;
  }
  
  evaluate(ctx, str, scope) {
    try {
      if (str in this.evalcache) {
        return this.evalcache[str](ctx, scope);
      }
      
      var func;
      
      if (config.HAVE_EVAL) {
        var script = """
          var func = function(ctx, scope) {
            return $s
          }
        """.replace("$s", str);
        
        eval(script);
      } else {
        var ast = safe_eval.compile(str);
        var _scope = {
          ctx   : undefined,
          scope : undefined,
          ContextStruct : ContextStruct,
          g_theme : g_theme
        };
        
        func = function(ctx, scope) {
          _scope.scope = scope;
          _scope.ctx = ctx;
          _scope.g_theme = window.g_theme;
          
          return safe_eval.exec(ast, _scope);
        }
      }
      
      this.evalcache[str] = func;
      
      return func(ctx, scope);
    } catch (error) {
      if (window.DEBUG != undefined && window.DEBUG.ui_datapaths)
        print_stack(error);
      
      throw new DataAPIError(error.message);
    }
  }
  
  get_object(ctx, str) {
    if (str == undefined) {
      str = ctx;
      ctx = new Context();
    }
    
    var ret = this.resolve_path_intern(ctx, str);
    
    if (ret == undefined || ret[0] == undefined || ret[0].type == DataPathTypes.PROP) {
      console.trace("Not a direct object reference", str);
      return undefined;
    } else { //return actual object
        var path = ret[1];
        var val = this.evaluate(ctx, path);
        
        return val;
    }
  }
  
  get_prop(ctx, str) {
    try {
      return this.get_prop_intern(ctx, str);
    } catch (error) {
      if (!(error instanceof DataAPIError)) {
        print_stack(error);
        console.log("Data API error! path:", str);
      }
      
      if (DEBUG.ui_datapaths) {
        print_stack(error);
      }
      
      throw error;
    }
  }
  
  get_prop_intern(ctx, str) {
    if (str == undefined) {
      str = ctx;
      ctx = new Context();
    }
    
    var ret = this.resolve_path_intern(ctx, str);
    if (ret == undefined) return ret;
    
    var val = ret[0];
    
    if (ret[0].type == DataPathTypes.PROP) {
      if (ret[0].use_path) {
        var path = ret[1];
        val = this.evaluate(ctx, path);
      } else {
        val = this.evaluate(ctx, ret[2]);
        
        if (val instanceof DataPath)
          val = val.data;
        if (val instanceof ToolProperty)
          val = val.data;
      }
      
      var prop = ret[0].data;
      if (prop.type == PropTypes.ENUM && (val in prop.keys))
        val = prop.keys[val];
    } else { //return actual object
        var path = ret[1];
        val = this.evaluate(ctx, path);
        
        return val;
    }
    
    return val;
  }
  
  build_mass_set_paths(ctx, listpath, subpath, value, filterstr) {
    if (ctx == undefined) {
      filterstr = value;
      value = subpath;
      subpath = listpath;
      listpath = ctx;
      ctx = new Context();
    }
    
    var filter;
    
    if (config.HAVE_EVAL) {
      //"(item.fag & 1) && !item.hidden"
      var filtercode = """
        function filter($) {\n
          return """+filterstr+"""\n;
        }""";
      
      eval(filtercode);
    } else {
      var ast = safe_eval.compile(filterstr);
      var scope = {ctx : ctx, $ : undefined};
      
      function filter($) {
        scope.$ = $;
        return safe_eval.exec(ast, scope);
      }
    }
    
    var list = this.get_object(listpath);
    var ret = this.resolve_path_intern(ctx, listpath);
    
    var sta = ret[0].data;
    
    var ret = [];
    for (var key of sta.getkeyiter.call(list, ctx)) {
      var item = sta.getitem.call(list, key);
      //console.log("  key:", key, filter(item), filterstr);
      
      if (!filter(item)) continue;
      var path = (listpath + "[" + key + "]" + "." + subpath).trim();
      
      //console.log("\n", path, "\n\n");
      ret.push(path);
    }
    
    return ret;
  }
  
  //set properties on an entire collection, filter is filter function
  mass_set_prop(ctx, listpath, subpath, value, filterstr) {
    if (ctx == undefined) {
      filterstr = value;
      value = subpath;
      subpath = listpath;
      listpath = ctx;
      ctx = new Context();
    }
    
    var paths = this.build_mass_set_paths(ctx, listpath, subpath, value, filterstr);
    for (var i=0; i<paths.length; i++) {
      this.set_prop(ctx, paths[i], value);
    }
    
    /*
    var list = this.get_object(listpath);
    var ret = this.resolve_path_intern(ctx, listpath);
    
    var sta = ret[0].data;
    
    for (var key of sta.getkeyiter.call(list, ctx)) {
      var item = sta.getitem.call(list, key);
      if (!filterfunc(item)) continue;
      
      var path = listpath + "[" + key + "]" + "." + subpath;
      console.log(path);
      
      this.set_prop(ctx, path, value);
    }
    //*/
  }
  
  set_prop(ctx, str, value) {
    var ret = this.resolve_path_intern(ctx, str);
    static retcpy = new Array(16);
    static scope = [0, 0];
    
    if (ret == undefined) {
      if (DEBUG.ui_datapaths) {
        console.log("Failed to resolve path:", str, "with context", ctx);
      }
      
      return ret;
    }
    
    retcpy.length = ret.length;
    for (var i=0; i<5; i++) {
      /*okaaay, why do I have to do this again?
        somehow this.eval is corrupting it.  gah!
        problem path was: spline.active_vertex.flag[BREAK_TANGENTS]
       */
      retcpy[i] = ret[i];
    }
    ret = retcpy;
    
    //console.log("owner:", owner);
    var owner = this.evaluate(ctx, ret[4]);
    //console.log("      ", owner);
    
    if (ret[0] == undefined && ret[3] != undefined && ret[3].do_mass_set) {
      if (DEBUG.ui_datapaths) {
        console.log("Mass set prop", str, value);
      }
      
      this.mass_set_prop(ctx, ret[3].path, ret[3].subpath, value, ret[3].filter)
      return;
    } else if (ret[0] == undefined) {
      console.trace("Error! Unknown path", str, "!");
      return;
    }
    
    if (DEBUG.ui_datapaths && ret[0] == undefined) {
      console.log("error setting", str, "to", value, "ret[0] was undefined", ret.slice(0, ret.length));
    }
    if (DEBUG.ui_datapaths) {
      console.log("set", str, "to", value, "type", ret[0].type, "use_path", ret[0].use_path, "rdata", ret.slice(0, ret.length));
    }
    
    if (ret[0].type != DataPathTypes.PROP) {
      console.trace("Error: non-property in set_prop()", str, ret.slice(0, ret.length));
      return;
    }
    
    var old_value = this.get_prop(ctx, str);
    var changed = true; 
    
    if (ret[0].type == DataPathTypes.PROP) {
      if (DEBUG.ui_datapaths) {
        console.log("prop set; use_path: ", ret[0].use_path, "type", ret[0].type, ret[0].data);
      }
      
      var path;
      
      if (ret[0].use_path) {
        path = ret[1];
      } else {
        path = ret[2];
      }

      //truncate equals paths, e.g. some_enum == 3
      let si = path.search(/\=\=/);
      if (si >= 0) {
        value = path.slice(si+2, path.length).trim();
        path = path.slice(0, si).trim();

        if (is_int(value)) {
          value = parseInt(value);
        }
      }

      var prop = ret[0].data;
      prop.ctx = ctx;
      
      if (prop.type == PropTypes.FLAG) {
        //console.log("FLAG prop set!");
        //console.log(path, "value", value);
        
        if (path.contains("&")) {
          //handle "struct.flag[bit] = boolean" form.
          var mask = Number.parseInt(path.slice(path.search("&")+1, path.length).trim());
          var path2 = path.slice(0, path.search("&"));
          
          //console.log(path2, "");
          
          var val = this.evaluate(ctx, path2);
          
          changed = !!(val & mask) != !!(old_value & mask);
          
          if (value)
            val |= mask;
          else
            val &= ~mask;
          
          prop.set_data(val, owner, changed);
          
          scope[0] = val;
          path2 += " = scope[0];";
          
          this.evaluate(ctx, path2, scope);
        } else {
          //handle "struct.flag = integer bitmask" form
          path += " = " + value;
          this.evaluate(ctx, path);
          
          changed = value != old_value;
          prop.set_data(value, owner, changed);
        }
      } else {
        if (prop.type == PropTypes.DATAREF) {
          console.trace("IMPLEMENT ME!");
        } else if (prop.type == PropTypes.ENUM) {
          if (value instanceof String || typeof value == "string") {
            value = prop.values[value];
          }
        } else if (prop.type == PropTypes.STRING) {
          value = '"' + value + '"';
        }
        
        var valpath = path;
        if (path.endsWith("]")) {
          var i = path.length-1;
          while (i >= 0 && path[i] != "[") i--;
          valpath = path.slice(0, i);
          
        } else if (!ret[0].use_path) {
          //erg, stupid hackyness
          valpath += ".data.data";
          path += ".data.data";
        }
        
        var oval = this.evaluate(ctx, path);
        
        /*don't override array references
          e.g. struct.some_array = [0, 1, 2, 3]
          shouldn't assign the array expression's reference
          to some_array, it should load the contents.*/
        
        //need a better way to detect array assignments 
        //  (some.array = [0, 0, 0] instead of some.array[0] = 0).
        if (typeof value != "number" &&
           (prop.type == PropTypes.VEC2 || prop.type == PropTypes.VEC3 || prop.type == PropTypes.VEC4))
        {
          var arr = this.evaluate(ctx, path);
          
          changed = false;
          for (var i=0; i<arr.length; i++) {
            changed = changed || arr[i] != value[i];
            
            arr[i] = value[i];
          }
        } else {
          if (typeof value == "object" ) {
            scope[0] = value;
            path += " = scope[0]"
            
            this.evaluate(ctx, path, scope);
          } else {
            changed = value == old_value;
            
            path += " = " + value;
            console.log("SETPATH:", path);

            this.evaluate(ctx, path);
          }
        }
        
        changed = value == old_value;
        
        if (DEBUG.ui_datapaths) {
          console.log("prop set:", valpath, value);
        }

        value = this.evaluate(ctx, valpath);
        prop.set_data(value, owner, changed);
      }
      
      ret[0].ctx = ctx;
      if (ret[0].update != undefined)
        ret[0].update.call(ret[0], owner, old_value, changed);
    }
  }
  
  get_struct(ctx, str) {
    if (str == undefined) {
      str = ctx;
      ctx = new Context();
    }
    
    var ret = this.resolve_path_intern(ctx, str);
    
    if (ret == undefined || ret[0] == undefined) return undefined;
    if (ret[0] instanceof DataPath) {
      return ret[0].data;
    }
    
    return ret[0];
  }
  
  get_prop_meta(ctx, str) {
    if (str == undefined) {
      str = ctx;
      ctx = new Context();
    }
    
    var ret = this.resolve_path_intern(ctx, str);
    if (ret == undefined || ret[0] == undefined) return undefined;
    
    return ret[0].data;
  }
  
  /*
  get_prop_time(ctx, str) {
    var ts = []
    var c = time_ms()
    
    var ret = this.resolve_path(ctx, str);
    
    ts.push(time_ms()-c);
    
    if (ret == undefined) {
      console.log("error getting property")
      return;
    }
    
    var p = ret[0];
    
    if (p.use_path) {
      c = time_ms()
      
      var obj = eval(ret[2]);
      var ret;
      
      ts.push(time_ms()-c);
      c = time_ms();
      
      if (p.data.type == PropTypes.FLAG && ret[3]) {
        var ret2 = eval("(obj & "+ret[1]+")");
        ret = ret2 > 0 && ret2 == Number(ret[1]);
      } else {
        ret = eval("obj." + p.path);
      }
      
      if (p.data.type == PropTypes.ENUM) {
        ret = p.data.keys[ret];
      }
      
      ts.push(time_ms()-c);
      
      return ts;
    } else {
      return ts;
      
      if ((p.data.type == PropTypes.VEC3 || p.data.type == PropTypes.VEC4) && ret[3]) {
        return p.data.data[ret[1]];
      } else if (p.data.type == PropTypes.FLAG && ret[3]) {
        return (p.data.data & Number(ret[1])) == Number(ret[1]);
      } else {
        if (p.data.type == PropTypes.ENUM)
          return p.data.keys[p.data.data];
        else 
          return p.data.data;
      }
    }
  }*/
}
