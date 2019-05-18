es6_module_define('lib_api', ["toolprops_iter", "struct"], function _lib_api_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var _DataTypeDef=[["IMAGE", 8], ["SCENE", 5], ["SCRIPT", 4], ["SPLINE", 6], ["FRAMESET", 7], ["ADDON", 8]];
  var DataTypes={}
  DataTypes = _es6_module.add_export('DataTypes', DataTypes);
  var LinkOrder=[];
  LinkOrder = _es6_module.add_export('LinkOrder', LinkOrder);
  for (var i=0; i<_DataTypeDef.length; i++) {
      DataTypes[_DataTypeDef[i][0]] = _DataTypeDef[i][1];
      LinkOrder.push(_DataTypeDef[i][1]);
  }
  var DataNames={}
  DataNames = _es6_module.add_export('DataNames', DataNames);
  for (var k in DataTypes) {
      DataNames[DataTypes[k]] = k.charAt(0)+k.slice(1, k.length).toLowerCase();
  }
  var BlockFlags={SELECT: 1, FAKE_USER: (1<<16), DELETED: (1<<17)}
  BlockFlags = _es6_module.add_export('BlockFlags', BlockFlags);
  var DataRef=_ESClass("DataRef", Array, [function DataRef(block_or_id, lib) {
    if (lib==undefined) {
        lib = undefined;
    }
    Array.call(this, 2);
    this.length = 2;
    if (lib!=undefined&&__instance_of(lib, DataLib))
      lib = lib.id;
    if (__instance_of(block_or_id, DataBlock)) {
        var block=block_or_id;
        this[0] = block.lib_id;
        if (lib!=undefined)
          this[1] = lib ? lib.id : -1;
        else 
          this[1] = block.lib_lib!=undefined ? block.lib_lib.id : -1;
    }
    else 
      if (__instance_of(block_or_id, Array)) {
        this[0] = block_or_id[0];
        this[1] = block_or_id[1];
    }
    else {
      this[0] = block_or_id;
      this[1] = lib!=undefined ? lib : -1;
    }
  }, function copyTo(dst) {
    dst[0] = this[0];
    dst[1] = this[1];
    return dst;
  }, function copy() {
    return this.copyTo(new DataRef());
  }, _ESClass.get(function id() {
    return this[0];
  }), _ESClass.set(function id(id) {
    this[0] = id;
  }), _ESClass.get(function lib() {
    return this[1];
  }), _ESClass.set(function lib(lib) {
    this[1] = lib;
  }), function equals(b) {
    return b!=undefined&&b[0]==this[0];
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new DataRef(0);
    reader(ret);
    return ret;
  })]);
  _es6_module.add_class(DataRef);
  DataRef = _es6_module.add_export('DataRef', DataRef);
  window.DataRef = DataRef;
  DataRef.STRUCT = "\n  DataRef {\n    id  : int;\n    lib : int;\n  }\n";
  var DataList=_ESClass("DataList", [_ESClass.symbol(Symbol.keystr, function keystr() {
    return this.type;
  }), function DataList(type) {
    this.list = new GArray();
    this.namemap = {}
    this.idmap = {}
    this.type = type;
    this.active = undefined;
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return this.list[Symbol.iterator]();
  }), function remove(block) {
    this.list.remove(block);
    if (block.name!=undefined&&this.namemap[block.name]==block)
      delete this.namemap[block.name];
    delete this.idmap[block];
    block.on_destroy();
    block.on_remove();
  }, function get(id) {
    if (__instance_of(id, DataRef))
      id = id.id;
    return this.idmap[id];
  }]);
  _es6_module.add_class(DataList);
  DataList = _es6_module.add_export('DataList', DataList);
  var DataLib=_ESClass("DataLib", [function DataLib() {
    this.id = 0;
    this.datalists = new hashtable();
    this.idmap = {}
    this.idgen = new EIDGen();
    this._destroyed = undefined;
  }, function on_destroy() {
    if (this._destroyed) {
        console.log("warning, datalib.on_destroyed called twice");
        return ;
    }
    this._destroyed = true;
    var __iter_k=__get_iter(this.datalists);
    var k;
    while (1) {
      var __ival_k=__iter_k.next();
      if (__ival_k.done) {
          break;
      }
      k = __ival_k.value;
      var l=this.datalists.get(k);
      var __iter_block=__get_iter(l);
      var block;
      while (1) {
        var __ival_block=__iter_block.next();
        if (__ival_block.done) {
            break;
        }
        block = __ival_block.value;
        try {
          block.on_destroy();
        }
        catch (err) {
            print_stack(err);
            console.trace("WARNING: failed to execute on_destroy handler for block", block.name, block);
        }
      }
    }
  }, function get_datalist(typeid) {
    var dl;
    if (!this.datalists.has(typeid)) {
        dl = new DataList(typeid);
        this.datalists.add(typeid, dl);
    }
    else {
      dl = this.datalists.get(typeid);
    }
    return dl;
  }, _ESClass.get(function images() {
    return this.get_datalist(DataTypes.IMAGE);
  }), _ESClass.get(function scenes() {
    return this.get_datalist(DataTypes.SCENE);
  }), _ESClass.get(function framesets() {
    return this.get_datalist(DataTypes.FRAMESET);
  }), function kill_datablock(block) {
    block.unlink();
    var list=this.datalists.get(block.lib_type);
    list.remove(block);
    block.lib_flag|=BlockFlags.DELETED;
  }, function search(type, prefix) {
    var list=this.datalists.get(type);
    var ret=new GArray();
    prefix = prefix.toLowerCase();
    for (var i=0; i<list.list.length; i++) {
        if (list.list[i].strip().toLowerCase().startsWith(prefix)) {
            ret.push(list.list[i]);
        }
    }
    return ret;
  }, function gen_name(block, name) {
    if (name==undefined||name.trim()=="") {
        name = DataNames[block.lib_type];
    }
    if (!this.datalists.has(block.lib_type)) {
        this.datalists.set(block.lib_type, new DataList(block.lib_type));
    }
    var list=this.datalists.get(block.lib_type);
    if (!(name in list.namemap)) {
        return name;
    }
    var i=0;
    while (1) {
      i++;
      if (name in list.namemap) {
          var j=name.length-1;
          for (j; j>=0; j--) {
              if (name[j]==".")
                break;
          }
          if (name==0) {
              name = name+"."+i.toString();
              continue;
          }
          var s=name.slice(j, name.length);
          if (!Number.isNaN(Number.parseInt(s))) {
              name = name.slice(0, j)+"."+i.toString();
          }
          else {
            name = name+"."+i.toString();
          }
      }
      else {
        break;
      }
    }
    return name;
  }, function add(block, set_id) {
    if (set_id==undefined)
      set_id = true;
    var name=this.gen_name(block, block.name);
    block.name = name;
    if (block.lib_id==-1) {
        block.lib_id = this.idgen.gen_id();
    }
    else {
      this.idgen.max_cur(block.lib_id);
    }
    this.idmap[block.lib_id] = block;
    if (!this.datalists.has(block.lib_type)) {
        this.datalists.set(block.lib_type, new DataList(block.lib_type));
    }
    var dl=this.datalists.get(block.lib_type);
    if (dl.active==undefined)
      dl.active = block;
    dl.list.push(block);
    dl.namemap[block.name] = block;
    dl.idmap[block.lib_id] = block;
    block.on_add(this);
  }, function get_active(data_type) {
    if (this.datalists.has(data_type)) {
        var lst=this.datalists.get(data_type);
        if (lst.active==undefined&&lst.list.length!=0) {
            if (DEBUG.datalib)
              console.log("Initializing active block for "+get_type_names()[data_type]);
            lst.active = lst.list[0];
        }
        return this.datalists.get(data_type).active;
    }
    else {
      return undefined;
    }
  }, function get(id) {
    if (__instance_of(id, DataRef))
      id = id.id;
    return this.idmap[id];
  }]);
  _es6_module.add_class(DataLib);
  DataLib = _es6_module.add_export('DataLib', DataLib);
  var UserRef=_ESClass("UserRef", [function UserRef() {
    this.user = 0;
    this.rem_func = 0;
    this.srcname = "";
  }]);
  _es6_module.add_class(UserRef);
  UserRef = _es6_module.add_export('UserRef', UserRef);
  var _db_hash_id=1;
  var DataBlock=_ESClass("DataBlock", [function DataBlock(type, name) {
    this.constructor.datablock_type = type;
    this.addon_data = {}
    if (name==undefined)
      name = "unnnamed";
    this.lib_anim_channels = new GArray();
    this.lib_anim_idgen = new EIDGen();
    this.lib_anim_idmap = {}
    this.lib_anim_pathmap = {}
    this.name = name;
    this._hash_id = _db_hash_id++;
    this.lib_id = -1;
    this.lib_lib = undefined;
    this.lib_type = type;
    this.lib_users = new GArray();
    this.lib_refs = 0;
    this.flag = 0;
  }, function on_gl_lost(new_gl) {
  }, function on_add(lib) {
  }, function on_remove() {
  }, function on_destroy() {
  }, function copy() {
  }, function set_fake_user(val) {
    if ((this.flag&BlockFlags.FAKE_USER)&&!val) {
        this.flag&=~BlockFlags.FAKE_USER;
        this.lib_refs-=1;
    }
    else 
      if (!(this.flag&BlockFlags.FAKE_USER)&&val) {
        this.flag|=BlockFlags.FAKE_USER;
        this.lib_refs+=1;
    }
  }, function data_link(block, getblock, getblock_us) {
  }, _ESClass.symbol(Symbol.keystr, function keystr() {
    return "DB"+this._hash_id;
  }), function lib_adduser(user, name, remfunc) {
    var ref=new UserRef();
    ref.user = user;
    ref.name = name;
    if (remfunc)
      ref.rem_func = remfunc;
    this.lib_users.push(ref);
    this.lib_refs++;
  }, function lib_remuser(user, refname) {
    var newusers=new GArray();
    for (var i=0; i<this.lib_users.length; i++) {
        if (this.lib_users[i].user!=user&&this.lib_users[i].srcname!=refname) {
            newusers.push(this.lib_users[i]);
        }
    }
    this.lib_users = newusers;
    this.lib_refs--;
  }, function unlink() {
    var users=this.lib_users;
    for (var i=0; i<users.length; i++) {
        if (users[i].rem_func!=undefined) {
            users[i].rem_func(users[i].user, this);
        }
        this.user_rem(users[i]);
    }
    if (this.lib_refs!=0) {
        console.log("Ref count error when deleting a datablock!", this.lib_refs, this);
    }
  }, function afterSTRUCT() {
    for (var i=0; i<this.lib_anim_channels.length; i++) {
        var ch=this.lib_anim_channels[i];
        ch.idgen = this.lib_anim_idgen;
        ch.idmap = this.lib_anim_idmap;
        ch.owner = this;
        for (var j=0; j<ch.keys.length; j++) {
            this.lib_anim_idmap[ch.keys[j].id] = ch.keys[j];
        }
        this.lib_anim_pathmap[ch.path] = ch;
    }
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new DataBlock();
    reader(ret);
    var map={}
    if (ret.addon_data===undefined||!(__instance_of(ret.addon_data, Array))) {
        ret.addon_data = [];
    }
    var __iter_dk=__get_iter(ret.addon_data);
    var dk;
    while (1) {
      var __ival_dk=__iter_dk.next();
      if (__ival_dk.done) {
          break;
      }
      dk = __ival_dk.value;
      map[dk.key] = dk.val;
    }
    ret.addon_data = map;
    return ret;
  }), function _addon_data_save() {
    var ret=[];
    if (this.addon_data===undefined) {
        return ret;
    }
    for (var k in this.addon_data) {
        ret.push(new _DictKey(k, this.addon_data[k]));
    }
    return ret;
  }]);
  _es6_module.add_class(DataBlock);
  DataBlock = _es6_module.add_export('DataBlock', DataBlock);
  var _DictKey=_ESClass("_DictKey", [function _DictKey(key, val) {
    this.key = key;
    this.val = val;
  }, _ESClass.static(function fromSTRUCT(reader) {
    let ret=new _DictKey();
    reader(ret);
    return ret;
  })]);
  _es6_module.add_class(_DictKey);
  _DictKey = _es6_module.add_export('_DictKey', _DictKey);
  _DictKey.STRUCT = "\n  _DictKey {\n    key : string;\n    val : abstract(Object);\n  }\n";
  DataBlock.STRUCT = "\n  DataBlock {\n    name              : string;\n    lib_type          : int;\n    lib_id            : int;\n    lib_lib           : int | obj.lib_lib != undefined ? obj.lib_lib.id : -1;\n\n    addon_data        : array(_DictKey) | obj._addon_data_save();\n\n    lib_refs          : int;\n    flag              : int;\n\n    lib_anim_channels : array(AnimChannel);\n    lib_anim_idgen    : EIDGen;\n  }\n";
  var ToolIter=es6_import_item(_es6_module, 'toolprops_iter', 'ToolIter');
  var DataRefListIter=_ESClass("DataRefListIter", ToolIter, [function DataRefListIter(lst, ctx) {
    this.lst = lst;
    this.i = 0;
    this.datalib = ctx.datalib;
    this.ret = undefined;
    this.init = true;
  }, function next() {
    if (this.init) {
        this.ret = cached_iret();
        this.init = false;
    }
    if (this.i<this.lst.length) {
        this.ret.value = this.datalib.get(this.lst[this.i].id);
    }
    else {
      this.ret.value = undefined;
      this.ret.done = true;
    }
    this.i++;
    return this.ret;
  }, function reset() {
    this.i = 0;
    this.init = true;
  }]);
  _es6_module.add_class(DataRefListIter);
  DataRefListIter = _es6_module.add_export('DataRefListIter', DataRefListIter);
}, '/dev/cleanfairmotion/src/core/lib_api.js');
es6_module_define('lib_api_typedefine', ["lib_api", "scene", "frameset", "spline", "imageblock"], function _lib_api_typedefine_module(_es6_module) {
  var SplineFrameSet=es6_import_item(_es6_module, 'frameset', 'SplineFrameSet');
  var Scene=es6_import_item(_es6_module, 'scene', 'Scene');
  var DataTypes=es6_import_item(_es6_module, 'lib_api', 'DataTypes');
  var Image=es6_import_item(_es6_module, 'imageblock', 'Image');
  var Spline=es6_import_item(_es6_module, 'spline', 'Spline');
  var get_data_typemap=function() {
    var obj={}
    obj[DataTypes.FRAMESET] = SplineFrameSet;
    obj[DataTypes.SCENE] = Scene;
    obj[DataTypes.IMAGE] = Image;
    obj[DataTypes.SPLINE] = Spline;
    return obj;
  }
  get_data_typemap = _es6_module.add_export('get_data_typemap', get_data_typemap);
}, '/dev/cleanfairmotion/src/core/lib_api_typedefine.js');
es6_module_define('mathlib', ["J3DIMath", "struct"], function _mathlib_module(_es6_module) {
  "use strict";
  var $_mh;
  var $_swapt;
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var feps=2.22e-16;
  feps = _es6_module.add_export('feps', feps);
  var COLINEAR=1;
  COLINEAR = _es6_module.add_export('COLINEAR', COLINEAR);
  var LINECROSS=2;
  LINECROSS = _es6_module.add_export('LINECROSS', LINECROSS);
  var _cross_vec1=new Vector3();
  var _cross_vec2=new Vector3();
  var FLOAT_MIN=-1e+21;
  FLOAT_MIN = _es6_module.add_export('FLOAT_MIN', FLOAT_MIN);
  var FLOAT_MAX=1e+22;
  FLOAT_MAX = _es6_module.add_export('FLOAT_MAX', FLOAT_MAX);
  es6_import(_es6_module, 'J3DIMath');
  var Matrix4UI=_ESClass("Matrix4UI", Matrix4, [function Matrix4UI(loc, rot, size) {
    if (rot==undefined) {
        rot = undefined;
    }
    if (size==undefined) {
        size = undefined;
    }
    if (__instance_of(loc, Matrix4)) {
        this.load(loc);
        return ;
    }
    if (rot==undefined)
      rot = [0, 0, 0];
    if (size==undefined)
      size = [1.0, 1.0, 1.0];
    this.makeIdentity();
    this.calc(loc, rot, size);
  }, function calc(loc, rot, size) {
    this.rotate(rot[0], rot[1], rot[2]);
    this.scale(size[0], size[1], size[2]);
    this.translate(loc[0], loc[1], loc[2]);
  }, _ESClass.get(function loc() {
    var t=new Vector3();
    this.decompose(t);
    return t;
  }), _ESClass.set(function loc(loc) {
    var l=new Vector3(), r=new Vector3(), s=new Vector3();
    this.decompose(l, r, s);
    this.calc(loc, r, s);
  }), _ESClass.get(function rot() {
    var t=new Vector3();
    this.decompose(undefined, t);
    return t;
  }), _ESClass.set(function rot(rot) {
    var l=new Vector3(), r=new Vector3(), s=new Vector3();
    this.decompose(l, r, s);
    this.calc(l, rot, s);
  }), _ESClass.get(function size() {
    var t=new Vector3();
    this.decompose(undefined, undefined, t);
    return t;
  }), _ESClass.set(function size(size) {
    var l=new Vector3(), r=new Vector3(), s=new Vector3();
    this.decompose(l, r, s);
    this.calc(l, r, size);
  })]);
  _es6_module.add_class(Matrix4UI);
  Matrix4UI = _es6_module.add_export('Matrix4UI', Matrix4UI);
  if (FLOAT_MIN!=FLOAT_MIN||FLOAT_MAX!=FLOAT_MAX) {
      FLOAT_MIN = 1e-05;
      FLOAT_MAX = 1000000.0;
      console.log("Floating-point 16-bit system detected!");
  }
  var $_cs4_9zx9_get_rect_points=new Array(4);
  var $_cs8_L9Qh_get_rect_points=new Array(8);
  function get_rect_points(p, size) {
    var cs;
    if (p.length==2) {
        cs = $_cs4_9zx9_get_rect_points;
        cs[0] = p;
        cs[1] = [p[0], p[1]+size[1]];
        cs[2] = [p[0]+size[0], p[1]+size[1]];
        cs[3] = [p[0]+size[0], p[1]];
    }
    else 
      if (p.length==3) {
        cs = $_cs8_L9Qh_get_rect_points;
        cs[0] = p;
        cs[1] = [p[0]+size[0], p[1], p[2]];
        cs[2] = [p[0]+size[0], p[1]+size[1], p[2]];
        cs[3] = [p[0], p[1]+size[0], p[2]];
        cs[4] = [p[0], p[1], p[2]+size[2]];
        cs[5] = [p[0]+size[0], p[1], p[2]+size[2]];
        cs[6] = [p[0]+size[0], p[1]+size[1], p[2]+size[2]];
        cs[7] = [p[0], p[1]+size[0], p[2]+size[2]];
    }
    else {
      throw "get_rect_points has no implementation for "+p.length+"-dimensional data";
    }
    return cs;
  }
  get_rect_points = _es6_module.add_export('get_rect_points', get_rect_points);
  function get_rect_lines(p, size) {
    var ps=get_rect_points(p, size);
    if (p.length==2) {
        return [[ps[0], ps[1]], [ps[1], ps[2]], [ps[2], ps[3]], [ps[3], ps[0]]];
    }
    else 
      if (p.length==3) {
        var l1=[[ps[0], ps[1]], [ps[1], ps[2]], [ps[2], ps[3]], [ps[3], ps[0]]];
        var l2=[[ps[4], ps[5]], [ps[5], ps[6]], [ps[6], ps[7]], [ps[7], ps[4]]];
        l1.concat(l2);
        l1.push([ps[0], ps[4]]);
        l1.push([ps[1], ps[5]]);
        l1.push([ps[2], ps[6]]);
        l1.push([ps[3], ps[7]]);
        return l1;
    }
    else {
      throw "get_rect_points has no implementation for "+p.length+"-dimensional data";
    }
  }
  get_rect_lines = _es6_module.add_export('get_rect_lines', get_rect_lines);
  var $vs_jUDz_simple_tri_aabb_isect=[0, 0, 0];
  function simple_tri_aabb_isect(v1, v2, v3, min, max) {
    $vs_jUDz_simple_tri_aabb_isect[0] = v1;
    $vs_jUDz_simple_tri_aabb_isect[1] = v2;
    $vs_jUDz_simple_tri_aabb_isect[2] = v3;
    for (var i=0; i<3; i++) {
        var isect=true;
        for (var j=0; j<3; j++) {
            if ($vs_jUDz_simple_tri_aabb_isect[j][i]<min[i]||$vs_jUDz_simple_tri_aabb_isect[j][i]>=max[i])
              isect = false;
        }
        if (isect)
          return true;
    }
    return false;
  }
  simple_tri_aabb_isect = _es6_module.add_export('simple_tri_aabb_isect', simple_tri_aabb_isect);
  var MinMax=_ESClass("MinMax", [function MinMax(totaxis) {
    if (totaxis==undefined) {
        totaxis = 1;
    }
    this.totaxis = totaxis;
    if (totaxis!=1) {
        this._min = new Array(totaxis);
        this._max = new Array(totaxis);
        this.min = new Array(totaxis);
        this.max = new Array(totaxis);
    }
    else {
      this.min = this.max = 0;
      this._min = FLOAT_MAX;
      this._max = FLOAT_MIN;
    }
    this.reset();
    this._static_mr_co = new Array(this.totaxis);
    this._static_mr_cs = new Array(this.totaxis*this.totaxis);
  }, function load(mm) {
    if (this.totaxis==1) {
        this.min = mm.min;
        this.max = mm.max;
        this._min = mm.min;
        this._max = mm.max;
    }
    else {
      this.min = new Vector3(mm.min);
      this.max = new Vector3(mm.max);
      this._min = new Vector3(mm._min);
      this._max = new Vector3(mm._max);
    }
  }, function reset() {
    var totaxis=this.totaxis;
    if (totaxis==1) {
        this.min = this.max = 0;
        this._min = FLOAT_MAX;
        this._max = FLOAT_MIN;
    }
    else {
      for (var i=0; i<totaxis; i++) {
          this._min[i] = FLOAT_MAX;
          this._max[i] = FLOAT_MIN;
          this.min[i] = 0;
          this.max[i] = 0;
      }
    }
  }, function minmax_rect(p, size) {
    var totaxis=this.totaxis;
    var cs=this._static_mr_cs;
    if (totaxis==2) {
        cs[0] = p;
        cs[1] = [p[0]+size[0], p[1]];
        cs[2] = [p[0]+size[0], p[1]+size[1]];
        cs[3] = [p[0], p[1]+size[1]];
    }
    else 
      if (totaxis = 3) {
        cs[0] = p;
        cs[1] = [p[0]+size[0], p[1], p[2]];
        cs[2] = [p[0]+size[0], p[1]+size[1], p[2]];
        cs[3] = [p[0], p[1]+size[0], p[2]];
        cs[4] = [p[0], p[1], p[2]+size[2]];
        cs[5] = [p[0]+size[0], p[1], p[2]+size[2]];
        cs[6] = [p[0]+size[0], p[1]+size[1], p[2]+size[2]];
        cs[7] = [p[0], p[1]+size[0], p[2]+size[2]];
    }
    else {
      throw "Minmax.minmax_rect has no implementation for "+totaxis+"-dimensional data";
    }
    for (var i=0; i<cs.length; i++) {
        this.minmax(cs[i]);
    }
  }, function minmax(p) {
    var totaxis=this.totaxis;
    if (totaxis==1) {
        this._min = this.min = Math.min(this._min, p);
        this._max = this.max = Math.max(this._max, p);
    }
    else {
      for (var i=0; i<totaxis; i++) {
          this._min[i] = this.min[i] = Math.min(this._min[i], p[i]);
          this._max[i] = this.max[i] = Math.max(this._max[i], p[i]);
      }
    }
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new MinMax();
    reader(ret);
    return ret;
  })]);
  _es6_module.add_class(MinMax);
  MinMax = _es6_module.add_export('MinMax', MinMax);
  MinMax.STRUCT = "\n  MinMax {\n    min     : vec3;\n    max     : vec3;\n    _min    : vec3;\n    _max    : vec3;\n    totaxis : int;\n  }\n";
  function winding(a, b, c) {
    for (var i=0; i<a.length; i++) {
        _cross_vec1[i] = b[i]-a[i];
        _cross_vec2[i] = c[i]-a[i];
    }
    if (a.length==2) {
        _cross_vec1[2] = 0.0;
        _cross_vec2[2] = 0.0;
    }
    _cross_vec1.cross(_cross_vec2);
    return _cross_vec1[2]>0.0;
  }
  winding = _es6_module.add_export('winding', winding);
  function inrect_2d(p, pos, size) {
    if (p==undefined||pos==undefined||size==undefined) {
        console.trace();
        console.log("Bad paramters to inrect_2d()");
        console.log("p: ", p, ", pos: ", pos, ", size: ", size);
        return false;
    }
    return p[0]>=pos[0]&&p[0]<=pos[0]+size[0]&&p[1]>=pos[1]&&p[1]<=pos[1]+size[1];
  }
  inrect_2d = _es6_module.add_export('inrect_2d', inrect_2d);
  var $smin_cQ5U_aabb_isect_line_2d=new Vector2();
  var $ssize_38CT_aabb_isect_line_2d=new Vector2();
  var $sv1_uHCn_aabb_isect_line_2d=new Vector2();
  var $ps_Fjq2_aabb_isect_line_2d=[new Vector2(), new Vector2(), new Vector2()];
  var $l1_zQrb_aabb_isect_line_2d=[0, 0];
  var $smax_22rm_aabb_isect_line_2d=new Vector2();
  var $sv2_OV2o_aabb_isect_line_2d=new Vector2();
  var $l2_po18_aabb_isect_line_2d=[0, 0];
  function aabb_isect_line_2d(v1, v2, min, max) {
    for (var i=0; i<2; i++) {
        $smin_cQ5U_aabb_isect_line_2d[i] = Math.min(min[i], v1[i]);
        $smax_22rm_aabb_isect_line_2d[i] = Math.max(max[i], v2[i]);
    }
    $smax_22rm_aabb_isect_line_2d.sub($smin_cQ5U_aabb_isect_line_2d);
    $ssize_38CT_aabb_isect_line_2d.load(max).sub(min);
    if (!aabb_isect_2d($smin_cQ5U_aabb_isect_line_2d, $smax_22rm_aabb_isect_line_2d, min, $ssize_38CT_aabb_isect_line_2d))
      return false;
    for (var i=0; i<4; i++) {
        if (inrect_2d(v1, min, $ssize_38CT_aabb_isect_line_2d))
          return true;
        if (inrect_2d(v2, min, $ssize_38CT_aabb_isect_line_2d))
          return true;
    }
    $ps_Fjq2_aabb_isect_line_2d[0] = min;
    $ps_Fjq2_aabb_isect_line_2d[1][0] = min[0];
    $ps_Fjq2_aabb_isect_line_2d[1][1] = max[1];
    $ps_Fjq2_aabb_isect_line_2d[2] = max;
    $ps_Fjq2_aabb_isect_line_2d[3][0] = max[0];
    $ps_Fjq2_aabb_isect_line_2d[3][1] = min[1];
    $l1_zQrb_aabb_isect_line_2d[0] = v1;
    $l1_zQrb_aabb_isect_line_2d[1] = v2;
    for (var i=0; i<4; i++) {
        var a=$ps_Fjq2_aabb_isect_line_2d[i], b=$ps_Fjq2_aabb_isect_line_2d[(i+1)%4];
        $l2_po18_aabb_isect_line_2d[0] = a;
        $l2_po18_aabb_isect_line_2d[1] = b;
        if (line_line_cross($l1_zQrb_aabb_isect_line_2d, $l2_po18_aabb_isect_line_2d))
          return true;
    }
    return false;
  }
  aabb_isect_line_2d = _es6_module.add_export('aabb_isect_line_2d', aabb_isect_line_2d);
  function aabb_isect_minmax2d(_min1, _max1, _min2, _max2, margin) {
    if (margin==undefined) {
        margin = 0;
    }
    var ret=0;
    for (var i=0; i<2; i++) {
        var min1=_min1[i]-margin, max1=_max1[i]+margin, min2=_min2[i]-margin, max2=_max2[i]+margin;
        if (max1>=min2&&min1<=max2)
          ret+=1;
    }
    return ret==2;
  }
  aabb_isect_minmax2d = _es6_module.add_export('aabb_isect_minmax2d', aabb_isect_minmax2d);
  function aabb_isect_2d(pos1, size1, pos2, size2) {
    var ret=0;
    for (var i=0; i<2; i++) {
        var a=pos1[i];
        var b=pos1[i]+size1[i];
        var c=pos2[i];
        var d=pos2[i]+size2[i];
        if (b>=c&&a<=d)
          ret+=1;
    }
    return ret==2;
  }
  aabb_isect_2d = _es6_module.add_export('aabb_isect_2d', aabb_isect_2d);
  function expand_rect2d(pos, size, margin) {
    pos[0]-=Math.floor(margin[0]);
    pos[1]-=Math.floor(margin[1]);
    size[0]+=Math.floor(margin[0]*2.0);
    size[1]+=Math.floor(margin[1]*2.0);
  }
  function expand_line(l, margin) {
    var c=new Vector3();
    c.add(l[0]);
    c.add(l[1]);
    c.mulScalar(0.5);
    l[0].sub(c);
    l[1].sub(c);
    var l1=l[0].vectorLength();
    var l2=l[1].vectorLength();
    l[0].normalize();
    l[1].normalize();
    l[0].mulScalar(margin+l1);
    l[1].mulScalar(margin+l2);
    l[0].add(c);
    l[1].add(c);
    return l;
  }
  function colinear(a, b, c) {
    for (var i=0; i<3; i++) {
        _cross_vec1[i] = b[i]-a[i];
        _cross_vec2[i] = c[i]-a[i];
    }
    var limit=2.2e-16;
    if (a.vectorDistance(b)<feps*100&&a.vectorDistance(c)<feps*100) {
        return true;
    }
    if (_cross_vec1.dot(_cross_vec1)<limit||_cross_vec2.dot(_cross_vec2)<limit)
      return true;
    _cross_vec1.cross(_cross_vec2);
    return _cross_vec1.dot(_cross_vec1)<limit;
  }
  var _llc_l1=[new Vector3(), new Vector3()];
  var _llc_l2=[new Vector3(), new Vector3()];
  function line_line_cross(l1, l2) {
    var limit=feps*1000;
    if (Math.abs(l1[0].vectorDistance(l2[0])+l1[1].vectorDistance(l2[0])-l1[0].vectorDistance(l1[1]))<limit) {
        return true;
    }
    if (Math.abs(l1[0].vectorDistance(l2[1])+l1[1].vectorDistance(l2[1])-l1[0].vectorDistance(l1[1]))<limit) {
        return true;
    }
    if (Math.abs(l2[0].vectorDistance(l1[0])+l2[1].vectorDistance(l1[0])-l2[0].vectorDistance(l2[1]))<limit) {
        return true;
    }
    if (Math.abs(l2[0].vectorDistance(l1[1])+l2[1].vectorDistance(l1[1])-l2[0].vectorDistance(l2[1]))<limit) {
        return true;
    }
    var a=l1[0];
    var b=l1[1];
    var c=l2[0];
    var d=l2[1];
    var w1=winding(a, b, c);
    var w2=winding(c, a, d);
    var w3=winding(a, b, d);
    var w4=winding(c, b, d);
    return (w1==w2)&&(w3==w4)&&(w1!=w3);
  }
  function point_in_tri(p, v1, v2, v3) {
    var w1=winding(p, v1, v2);
    var w2=winding(p, v2, v3);
    var w3=winding(p, v3, v1);
    return w1==w2&&w2==w3;
  }
  point_in_tri = _es6_module.add_export('point_in_tri', point_in_tri);
  function convex_quad(v1, v2, v3, v4) {
    return line_line_cross([v1, v3], [v2, v4]);
  }
  convex_quad = _es6_module.add_export('convex_quad', convex_quad);
  var $e1_owOk_normal_tri=new Vector3();
  var $e3_tthz_normal_tri=new Vector3();
  var $e2_9kZQ_normal_tri=new Vector3();
  function normal_tri(v1, v2, v3) {
    $e1_owOk_normal_tri[0] = v2[0]-v1[0];
    $e1_owOk_normal_tri[1] = v2[1]-v1[1];
    $e1_owOk_normal_tri[2] = v2[2]-v1[2];
    $e2_9kZQ_normal_tri[0] = v3[0]-v1[0];
    $e2_9kZQ_normal_tri[1] = v3[1]-v1[1];
    $e2_9kZQ_normal_tri[2] = v3[2]-v1[2];
    $e3_tthz_normal_tri[0] = $e1_owOk_normal_tri[1]*$e2_9kZQ_normal_tri[2]-$e1_owOk_normal_tri[2]*$e2_9kZQ_normal_tri[1];
    $e3_tthz_normal_tri[1] = $e1_owOk_normal_tri[2]*$e2_9kZQ_normal_tri[0]-$e1_owOk_normal_tri[0]*$e2_9kZQ_normal_tri[2];
    $e3_tthz_normal_tri[2] = $e1_owOk_normal_tri[0]*$e2_9kZQ_normal_tri[1]-$e1_owOk_normal_tri[1]*$e2_9kZQ_normal_tri[0];
    
    var _len=Math.sqrt($e3_tthz_normal_tri[0]*$e3_tthz_normal_tri[0]+$e3_tthz_normal_tri[1]*$e3_tthz_normal_tri[1]+$e3_tthz_normal_tri[2]*$e3_tthz_normal_tri[2]);
    if (_len>1e-05)
      _len = 1.0/_len;
    $e3_tthz_normal_tri[0]*=_len;
    $e3_tthz_normal_tri[1]*=_len;
    $e3_tthz_normal_tri[2]*=_len;
    return $e3_tthz_normal_tri;
  }
  normal_tri = _es6_module.add_export('normal_tri', normal_tri);
  var $n2_OsYc_normal_quad=new Vector3();
  function normal_quad(v1, v2, v3, v4) {
    var n=normal_tri(v1, v2, v3);
    $n2_OsYc_normal_quad[0] = n[0];
    $n2_OsYc_normal_quad[1] = n[1];
    $n2_OsYc_normal_quad[2] = n[2];
    n = normal_tri(v1, v3, v4);
    $n2_OsYc_normal_quad[0] = $n2_OsYc_normal_quad[0]+n[0];
    $n2_OsYc_normal_quad[1] = $n2_OsYc_normal_quad[1]+n[1];
    $n2_OsYc_normal_quad[2] = $n2_OsYc_normal_quad[2]+n[2];
    var _len=Math.sqrt($n2_OsYc_normal_quad[0]*$n2_OsYc_normal_quad[0]+$n2_OsYc_normal_quad[1]*$n2_OsYc_normal_quad[1]+$n2_OsYc_normal_quad[2]*$n2_OsYc_normal_quad[2]);
    if (_len>1e-05)
      _len = 1.0/_len;
    $n2_OsYc_normal_quad[0]*=_len;
    $n2_OsYc_normal_quad[1]*=_len;
    $n2_OsYc_normal_quad[2]*=_len;
    return $n2_OsYc_normal_quad;
  }
  normal_quad = _es6_module.add_export('normal_quad', normal_quad);
  var _li_vi=new Vector3();
  function line_isect(v1, v2, v3, v4, calc_t) {
    if (calc_t==undefined) {
        calc_t = false;
    }
    var div=(v2[0]-v1[0])*(v4[1]-v3[1])-(v2[1]-v1[1])*(v4[0]-v3[0]);
    if (div==0.0)
      return [new Vector3(), COLINEAR, 0.0];
    var vi=_li_vi;
    vi[0] = 0;
    vi[1] = 0;
    vi[2] = 0;
    vi[0] = ((v3[0]-v4[0])*(v1[0]*v2[1]-v1[1]*v2[0])-(v1[0]-v2[0])*(v3[0]*v4[1]-v3[1]*v4[0]))/div;
    vi[1] = ((v3[1]-v4[1])*(v1[0]*v2[1]-v1[1]*v2[0])-(v1[1]-v2[1])*(v3[0]*v4[1]-v3[1]*v4[0]))/div;
    if (calc_t||v1.length==3) {
        var n1=new Vector2(v2).sub(v1);
        var n2=new Vector2(vi).sub(v1);
        var t=n2.vectorLength()/n1.vectorLength();
        n1.normalize();
        n2.normalize();
        if (n1.dot(n2)<0.0) {
            t = -t;
        }
        if (v1.length==3) {
            vi[2] = v1[2]+(v2[2]-v1[2])*t;
        }
        return [vi, LINECROSS, t];
    }
    return [vi, LINECROSS];
  }
  line_isect = _es6_module.add_export('line_isect', line_isect);
  var dtl_v1=new Vector3();
  var dtl_v2=new Vector3();
  var dtl_v3=new Vector3();
  var dtl_v4=new Vector3();
  var dtl_v5=new Vector3();
  var dtl_p=new Vector3();
  function dist_to_line_v2(p, v1, v2) {
    var v3=dtl_v3, v4=dtl_v4;
    var v5=dtl_v5;
    v5[2] = 0.0;
    v1 = dtl_v1.load(v1);
    v2 = dtl_v2.load(v2);
    p = dtl_p.load(p);
    v3.load(v1);
    v4.load(v2);
    v1[2] = v2[2] = v3[2] = v4[2] = p[2] = 0.0;
    v4.sub(v3);
    v5[0] = -v4[1];
    v5[1] = v4[0];
    v3 = p;
    v4.load(v5);
    v4.add(v3);
    var ret=line_isect(v1, v2, v3, v4);
    if (ret[1]==COLINEAR) {
        var d1=p.vectorDistance(v1);
        var d2=p.vectorDistance(v2);
        return Math.min(d1, d2);
    }
    else {
      var t1=ret[0].vectorDistance(v1);
      var t2=ret[0].vectorDistance(v2);
      var t3=v1.vectorDistance(v2);
      if (t1>t3||t2>t3) {
          var d1=p.vectorDistance(v1);
          var d2=p.vectorDistance(v2);
          return Math.min(d1, d2);
      }
      else {
        return p.vectorDistance(ret[0]);
      }
    }
  }
  dist_to_line_v2 = _es6_module.add_export('dist_to_line_v2', dist_to_line_v2);
  function closest_point_on_line(p, v1, v2) {
    var v3=dtl_v3, v4=dtl_v4;
    var v5=dtl_v5;
    v3.load(v1);
    v4.load(v2);
    v4.sub(v3);
    v5[0] = -v4[1];
    v5[1] = v4[0];
    v3 = p;
    v4.load(v5);
    v4.add(v3);
    var ret=line_isect(v1, v2, v3, v4);
    if (ret[1]==COLINEAR) {
        var v3=dtl_v3;
        v4 = dtl_v4;
        var v5=dtl_v5;
        p = new Vector3(p);
        v3.load(v1);
        v4.load(v2);
        v4.sub(v3);
        p.sub(v4);
        v5[0] = -v4[1];
        v5[1] = v4[0];
        v3 = p;
        v4.load(v5);
        v4.add(v3);
        ret = line_isect(v1, v2, v3, v4);
    }
    return [new Vector3(ret[0]), v1.vectorDistance(ret[0])];
  }
  closest_point_on_line = _es6_module.add_export('closest_point_on_line', closest_point_on_line);
  var _gtc_e1=new Vector3();
  var _gtc_e2=new Vector3();
  var _gtc_e3=new Vector3();
  var _gtc_p1=new Vector3();
  var _gtc_p2=new Vector3();
  var _gtc_v1=new Vector3();
  var _gtc_v2=new Vector3();
  var _gtc_p12=new Vector3();
  var _gtc_p22=new Vector3();
  function get_tri_circ(a, b, c) {
    var e1=_gtc_e1;
    var e2=_gtc_e2;
    var e3=_gtc_e3;
    for (var i=0; i<3; i++) {
        e1[i] = b[i]-a[i];
        e2[i] = c[i]-b[i];
        e3[i] = a[i]-c[i];
    }
    var p1=_gtc_p1;
    var p2=_gtc_p2;
    for (var i=0; i<3; i++) {
        p1[i] = (a[i]+b[i])*0.5;
        p2[i] = (c[i]+b[i])*0.5;
    }
    e1.normalize();
    var v1=_gtc_v1;
    var v2=_gtc_v2;
    v1[0] = -e1[1];
    v1[1] = e1[0];
    v1[2] = e1[2];
    v2[0] = -e2[1];
    v2[1] = e2[0];
    v2[2] = e2[2];
    v1.normalize();
    v2.normalize();
    var cent;
    var type;
    for (i = 0; i<3; i++) {
        _gtc_p12[i] = p1[i]+v1[i];
        _gtc_p22[i] = p2[i]+v2[i];
    }
    var ret=line_isect(p1, _gtc_p12, p2, _gtc_p22);
    cent = ret[0];
    type = ret[1];
    e1.load(a);
    e2.load(b);
    e3.load(c);
    var r=e1.sub(cent).vectorLength();
    if (r<feps)
      r = e2.sub(cent).vectorLength();
    if (r<feps)
      r = e3.sub(cent).vectorLength();
    return [cent, r];
  }
  get_tri_circ = _es6_module.add_export('get_tri_circ', get_tri_circ);
  function gen_circle(m, origin, r, stfeps) {
    var pi=Math.PI;
    var f=-pi/2;
    var df=(pi*2)/stfeps;
    var verts=new GArray();
    for (var i=0; i<stfeps; i++) {
        var x=origin[0]+r*Math.sin(f);
        var y=origin[1]+r*Math.cos(f);
        var v=m.make_vert(new Vector3([x, y, origin[2]]));
        verts.push(v);
        f+=df;
    }
    for (var i=0; i<verts.length; i++) {
        var v1=verts[i];
        var v2=verts[(i+1)%verts.length];
        m.make_edge(v1, v2);
    }
    return verts;
  }
  gen_circle = _es6_module.add_export('gen_circle', gen_circle);
  function makeCircleMesh(gl, radius, stfeps) {
    var mesh=new Mesh();
    var verts1=gen_circle(mesh, new Vector3(), radius, stfeps);
    var verts2=gen_circle(mesh, new Vector3(), radius/1.75, stfeps);
    mesh.make_face_complex(new GArray([verts1, verts2]));
    return mesh;
  }
  function minmax_verts(verts) {
    var min=new Vector3([1000000000000.0, 1000000000000.0, 1000000000000.0]);
    var max=new Vector3([-1000000000000.0, -1000000000000.0, -1000000000000.0]);
    var __iter_v=__get_iter(verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      for (var i=0; i<3; i++) {
          min[i] = Math.min(min[i], v.co[i]);
          max[i] = Math.max(max[i], v.co[i]);
      }
    }
    return [min, max];
  }
  minmax_verts = _es6_module.add_export('minmax_verts', minmax_verts);
  function unproject(vec, ipers, iview) {
    var newvec=new Vector3(vec);
    newvec.multVecMatrix(ipers);
    newvec.multVecMatrix(iview);
    return newvec;
  }
  function project(vec, pers, view) {
    var newvec=new Vector3(vec);
    newvec.multVecMatrix(pers);
    newvec.multVecMatrix(view);
    return newvec;
  }
  var _sh_minv=new Vector3();
  var _sh_maxv=new Vector3();
  var _sh_start=[];
  var _sh_end=[];
  function spatialhash(init, cellsize) {
    if (cellsize==undefined)
      cellsize = 0.25;
    this.cellsize = cellsize;
    this.shash = {}
    this.items = {}
    this.length = 0;
    this.hashlookup = function(x, y, z, create) {
      if (create==undefined)
        create = false;
      var h=this.hash(x, y, z);
      var b=this.shash[h];
      if (b==undefined) {
          if (!create)
            return null;
          var ret={};
          this.shash[h] = ret;
          return ret;
      }
      else {
        return b;
      }
    }
    this.hash = function(x, y, z) {
      return z*125000000+y*250000+x;
    }
    this._op = function(item, mode) {
      var csize=this.cellsize;
      var minv=_sh_minv;
      minv.zero();
      var maxv=_sh_maxv;
      maxv.zero();
      if (item.type==MeshTypes.EDGE) {
          for (var i=0; i<3; i++) {
              minv[i] = Math.min(item.v1.co[i], item.v2.co[i]);
              maxv[i] = Math.max(item.v1.co[i], item.v2.co[i]);
          }
      }
      else 
        if (item.type==MeshTypes.FACE) {
          var firstl=item.looplists[0].loop;
          var l=firstl;
          do {
            for (var i=0; i<3; i++) {
                minv[i] = Math.min(minv[i], l.v.co[i]);
                maxv[i] = Math.max(maxv[i], l.v.co[i]);
            }
            l = l.next;
          } while (l!=firstl);
          
      }
      else 
        if (item.type==MeshTypes.VERT) {
          minv.load(item.co);
          maxv.load(item.co);
      }
      else {
        console.trace();
        throw "Invalid type for spatialhash";
      }
      var start=_sh_start;
      var end=_sh_end;
      for (var i=0; i<3; i++) {
          start[i] = Math.floor(minv[i]/csize);
          end[i] = Math.floor(maxv[i]/csize);
      }
      for (var x=start[0]; x<=end[0]; x++) {
          for (var y=start[1]; y<=end[1]; y++) {
              for (var z=start[2]; z<=end[2]; z++) {
                  var bset=this.hashlookup(x, y, z, true);
                  if (mode=="a") {
                      bset[item[Symbol.keystr]()] = item;
                  }
                  else 
                    if (mode=="r") {
                      delete bset[item[Symbol.keystr]()];
                  }
              }
          }
      }
    }
    this.add = function(item) {
      this._op(item, "a");
      if (this.items[item[Symbol.keystr]()]==undefined) {
          this.items[item[Symbol.keystr]()] = item;
          this.length++;
      }
    }
    this.remove = function(item) {
      this._op(item, "r");
      delete this.items[item[Symbol.keystr]()];
      this.length--;
    }
    this[Symbol.iterator] = function() {
      return new obj_value_iter(this.items);
    }
    this.query_radius = function(co, radius) {
      var min=new Vector3(co).sub(new Vector3(radius, radius, radius));
      var max=new Vector3(co).add(new Vector3(radius, radius, radius));
      return this.query(min, max);
    }
    this.query = function(start, end) {
      var csize=this.cellsize;
      var minv=_sh_minv.zero();
      var maxv=_sh_maxv.zero();
      for (var i=0; i<3; i++) {
          minv[i] = Math.min(start[i], end[i]);
          maxv[i] = Math.max(start[i], end[i]);
      }
      var start=_sh_start;
      var end=_sh_end;
      for (var i=0; i<3; i++) {
          start[i] = Math.floor(minv[i]/csize);
          end[i] = Math.floor(maxv[i]/csize);
      }
      var ret=new set();
      for (var x=start[0]; x<=end[0]; x++) {
          for (var y=start[1]; y<=end[1]; y++) {
              for (var z=start[2]; z<=end[2]; z++) {
                  var bset=this.hashlookup(x, y, z, false);
                  if (bset!=null) {
                      var __iter_r=__get_iter(new obj_value_iter(bset));
                      var r;
                      while (1) {
                        var __ival_r=__iter_r.next();
                        if (__ival_r.done) {
                            break;
                        }
                        r = __ival_r.value;
                        ret.add(r);
                      }
                  }
              }
          }
      }
      return ret;
    }
    this.union = function(b) {
      var newh=new spatialhash();
      newh.cellsize = Math.min(this.cellsize, b.cellsize);
      var __iter_item=__get_iter(this);
      var item;
      while (1) {
        var __ival_item=__iter_item.next();
        if (__ival_item.done) {
            break;
        }
        item = __ival_item.value;
        newh.add(item);
      }
      var __iter_item=__get_iter(b);
      var item;
      while (1) {
        var __ival_item=__iter_item.next();
        if (__ival_item.done) {
            break;
        }
        item = __ival_item.value;
        newh.add(item);
      }
      return newh;
    }
    this.has = function(b) {
      return this.items[b[Symbol.keystr]()]!=undefined;
    }
    if (init!=undefined) {
        var __iter_item=__get_iter(init);
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
  var $_cent_L06N=new Vector3();
  function get_boundary_winding(points) {
    var cent=$_cent_L06N.zero();
    if (points.length==0)
      return false;
    for (var i=0; i<points.length; i++) {
        cent.add(points[i]);
    }
    cent.divideScalar(points.length);
    var w=0, totw=0;
    for (var i=0; i<points.length; i++) {
        var v1=points[i];
        var v2=points[(i+1)%points.length];
        if (!colinear(v1, v2, cent)) {
            w+=winding(v1, v2, cent);
            totw+=1;
        }
    }
    if (totw>0)
      w/=totw;
    return Math.round(w)==1;
  }
  var PlaneOps=_ESClass("PlaneOps", [function PlaneOps(normal) {
    var no=normal;
    this.axis = [0, 0, 0];
    this.reset_axis(normal);
  }, function reset_axis(no) {
    var ax, ay, az;
    var nx=Math.abs(no[0]), ny=Math.abs(no[1]), nz=Math.abs(no[2]);
    if (nz>nx&&nz>ny) {
        ax = 0;
        ay = 1;
        az = 2;
    }
    else 
      if (nx>ny&&nx>nz) {
        ax = 2;
        ay = 1;
        az = 0;
    }
    else {
      ax = 0;
      ay = 2;
      az = 1;
    }
    this.axis = [ax, ay, az];
  }, function convex_quad(v1, v2, v3, v4) {
    var ax=this.axis;
    v1 = new Vector3([v1[ax[0]], v1[ax[1]], v1[ax[2]]]);
    v2 = new Vector3([v2[ax[0]], v2[ax[1]], v2[ax[2]]]);
    v3 = new Vector3([v3[ax[0]], v3[ax[1]], v3[ax[2]]]);
    v4 = new Vector3([v4[ax[0]], v4[ax[1]], v4[ax[2]]]);
    return convex_quad(v1, v2, v3, v4);
  }, function line_isect(v1, v2, v3, v4) {
    var ax=this.axis;
    var orig1=v1, orig2=v2;
    v1 = new Vector3([v1[ax[0]], v1[ax[1]], v1[ax[2]]]);
    v2 = new Vector3([v2[ax[0]], v2[ax[1]], v2[ax[2]]]);
    v3 = new Vector3([v3[ax[0]], v3[ax[1]], v3[ax[2]]]);
    v4 = new Vector3([v4[ax[0]], v4[ax[1]], v4[ax[2]]]);
    var ret=line_isect(v1, v2, v3, v4, true);
    var vi=ret[0];
    if (ret[1]==LINECROSS) {
        ret[0].load(orig2).sub(orig1).mulScalar(ret[2]).add(orig1);
    }
    return ret;
  }, function line_line_cross(l1, l2) {
    var ax=this.axis;
    var v1=l1[0], v2=l1[1], v3=l2[0], v4=l2[1];
    v1 = new Vector3([v1[ax[0]], v1[ax[1]], 0.0]);
    v2 = new Vector3([v2[ax[0]], v2[ax[1]], 0.0]);
    v3 = new Vector3([v3[ax[0]], v3[ax[1]], 0.0]);
    v4 = new Vector3([v4[ax[0]], v4[ax[1]], 0.0]);
    return line_line_cross([v1, v2], [v3, v4]);
  }, function winding(v1, v2, v3) {
    var ax=this.axis;
    if (v1==undefined)
      console.trace();
    v1 = new Vector3([v1[ax[0]], v1[ax[1]], 0.0]);
    v2 = new Vector3([v2[ax[0]], v2[ax[1]], 0.0]);
    v3 = new Vector3([v3[ax[0]], v3[ax[1]], 0.0]);
    return winding(v1, v2, v3);
  }, function colinear(v1, v2, v3) {
    var ax=this.axis;
    v1 = new Vector3([v1[ax[0]], v1[ax[1]], 0.0]);
    v2 = new Vector3([v2[ax[0]], v2[ax[1]], 0.0]);
    v3 = new Vector3([v3[ax[0]], v3[ax[1]], 0.0]);
    return colinear(v1, v2, v3);
  }, function get_boundary_winding(points) {
    var ax=this.axis;
    var cent=new Vector3();
    if (points.length==0)
      return false;
    for (var i=0; i<points.length; i++) {
        cent.add(points[i]);
    }
    cent.divideScalar(points.length);
    var w=0, totw=0;
    for (var i=0; i<points.length; i++) {
        var v1=points[i];
        var v2=points[(i+1)%points.length];
        if (!this.colinear(v1, v2, cent)) {
            w+=this.winding(v1, v2, cent);
            totw+=1;
        }
    }
    if (totw>0)
      w/=totw;
    return Math.round(w)==1;
  }]);
  _es6_module.add_class(PlaneOps);
  PlaneOps = _es6_module.add_export('PlaneOps', PlaneOps);
  var _isrp_ret=new Vector3();
  function isect_ray_plane(planeorigin, planenormal, rayorigin, raynormal) {
    var p=planeorigin, n=planenormal;
    var r=rayorigin, v=raynormal;
    var d=p.vectorLength();
    var t=-(r.dot(n)-p.dot(n))/v.dot(n);
    _isrp_ret.load(v);
    _isrp_ret.mulScalar(t);
    _isrp_ret.add(r);
    return _isrp_ret;
  }
  function mesh_find_tangent(mesh, viewvec, offvec, projmat, verts) {
    if (verts==undefined)
      verts = mesh.verts.selected;
    var vset=new set();
    var eset=new set();
    var __iter_v=__get_iter(verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      vset.add(v);
    }
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      var __iter_e=__get_iter(v.edges);
      var e;
      while (1) {
        var __ival_e=__iter_e.next();
        if (__ival_e.done) {
            break;
        }
        e = __ival_e.value;
        if (vset.has(e.other_vert(v))) {
            eset.add(e);
        }
      }
    }
    if (eset.length==0) {
        return new Vector3(offvec);
    }
    var tanav=new Vector3();
    var evec=new Vector3();
    var tan=new Vector3();
    var co2=new Vector3();
    var __iter_e=__get_iter(eset);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      evec.load(e.v1.co).multVecMatrix(projmat);
      co2.load(e.v2.co).multVecMatrix(projmat);
      evec.sub(co2);
      evec.normalize();
      tan[0] = evec[1];
      tan[1] = -evec[0];
      tan[2] = 0.0;
      if (tan.dot(offvec)<0.0)
        tan.mulScalar(-1.0);
      tanav.add(tan);
    }
    tanav.normalize();
    return tanav;
  }
  var Mat4Stack=_ESClass("Mat4Stack", [function Mat4Stack() {
    this.stack = [];
    this.matrix = new Matrix4();
    this.matrix.makeIdentity();
    this.update_func = undefined;
  }, function set_internal_matrix(mat, update_func) {
    this.update_func = update_func;
    this.matrix = mat;
  }, function reset(mat) {
    this.matrix.load(mat);
    this.stack = [];
    if (this.update_func!=undefined)
      this.update_func();
  }, function load(mat) {
    this.matrix.load(mat);
    if (this.update_func!=undefined)
      this.update_func();
  }, function multiply(mat) {
    this.matrix.multiply(mat);
    if (this.update_func!=undefined)
      this.update_func();
  }, function identity() {
    this.matrix.loadIdentity();
    if (this.update_func!=undefined)
      this.update_func();
  }, function push(mat2) {
    this.stack.push(new Matrix4(this.matrix));
    if (mat2!=undefined) {
        this.matrix.load(mat2);
        if (this.update_func!=undefined)
          this.update_func();
    }
  }, function pop() {
    var mat=this.stack.pop(this.stack.length-1);
    this.matrix.load(mat);
    if (this.update_func!=undefined)
      this.update_func();
    return mat;
  }]);
  _es6_module.add_class(Mat4Stack);
  var WrapperVecPool=_ESClass("WrapperVecPool", [function WrapperVecPool(nsize2, psize, nsize) {
    if (psize==undefined) {
        psize = 512;
    }
    if (nsize==undefined) {
        nsize = 3;
    }
    if (nsize2!=undefined)
      nsize = nsize2;
    this.pools = [];
    this.cur = 0;
    this.psize = psize;
    this.bytesize = 4;
    this.nsize = nsize;
    this.new_pool();
  }, function new_pool() {
    var pool=new Float32Array(this.psize*this.nsize);
    this.pools.push(pool);
    this.cur = 0;
  }, function get() {
    if (this.cur>=this.psize)
      this.new_pool();
    var pool=this.pools[this.pools.length-1];
    var n=this.nsize;
    var cur=this.cur;
    var bs=this.bytesize;
    var view=new Float32Array(pool.buffer, Math.floor(cur*n*bs), n);
    this.cur++;
    return new WVector3(view);
  }]);
  _es6_module.add_class(WrapperVecPool);
  var test_vpool=new WrapperVecPool();
  var WVector3=_ESClass("WVector3", Vector3, [function WVector3(view, arg) {
    if (arg==undefined) {
        arg = undefined;
    }
    this.view = view;
    Vector3.call(this, arg);
  }, _ESClass.get(_ESClass.symbol(0, function() {
    return this.view[0];
  })), _ESClass.set(_ESClass.symbol(0, function(n) {
    this.view[0] = n;
  })), _ESClass.get(_ESClass.symbol(1, function() {
    return this.view[1];
  })), _ESClass.set(_ESClass.symbol(1, function(n) {
    this.view[1] = n;
  })), _ESClass.get(_ESClass.symbol(2, function() {
    return this.view[2];
  })), _ESClass.set(_ESClass.symbol(2, function(n) {
    this.view[2] = n;
  }))]);
  _es6_module.add_class(WVector3);
  var cos=Math.cos;
  var sin=Math.sin;
  function rot2d(vec, A, axis) {
    if (axis==undefined) {
        axis = 0;
    }
    var x=vec[0];
    var y=vec[1];
    if (axis==1) {
        vec[0] = x*cos(A)+y*sin(A);
        vec[1] = y*cos(A)-x*sin(A);
    }
    else {
      vec[0] = x*cos(A)-y*sin(A);
      vec[1] = y*cos(A)+x*sin(A);
    }
    return vec;
  }
  rot2d = _es6_module.add_export('rot2d', rot2d);
}, '/dev/cleanfairmotion/src/util/mathlib.js');
es6_module_define('colorutils', [], function _colorutils_module(_es6_module) {
  "use strict";
  function rgba_to_hsva(clr, ret, last_hue) {
    if (ret==undefined) {
        ret = undefined;
    }
    if (last_hue==undefined) {
        last_hue = 0;
    }
    var r=clr[0], g=clr[1], b=clr[2], a=clr[3];
    var min, max, delta;
    var h, s, v;
    min = Math.min(r, g, b);
    max = Math.max(r, g, b);
    v = max;
    delta = max-min;
    if (max!=0) {
        s = delta/max;
    }
    else {
      s = -1;
      h = last_hue;
      ret[0] = h;
      ret[1] = s;
      ret[2] = v;
      ret[3] = a;
      return last_hue;
    }
    if (delta!=0.0&&s!=0.0) {
        if (r==max)
          h = (g-b)/delta;
        else 
          if (g==max)
          h = 2+(b-r)/delta;
        else 
          h = 4+(r-g)/delta;
        h = h/6.0+1*(h<0);
    }
    else {
      h = last_hue;
    }
    if (h<0)
      h+=360;
    ret[0] = h;
    ret[1] = s;
    ret[2] = v;
    ret[3] = a;
    return h;
  }
  rgba_to_hsva = _es6_module.add_export('rgba_to_hsva', rgba_to_hsva);
  function hsva_to_rgba(hsva, ret, last_hue) {
    var r, g, b, h=hsva[0]*360.0, s=hsva[1], v=hsva[2];
    var i, f, p, q, t;
    if (s==0) {
        ret[0] = ret[1] = ret[2] = v;
        if (ret.length>3)
          ret[3] = hsva[3];
        return last_hue;
    }
    h/=60;
    i = Math.floor(h);
    f = h-i;
    p = v*(1-s);
    q = v*(1-s*f);
    t = v*(1-s*(1-f));
    switch (i) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      default:
        r = v;
        g = p;
        b = q;
        break;
    }
    ret[0] = r;
    ret[1] = g;
    ret[2] = b;
    if (ret.length>3)
      ret[3] = hsva[3];
    return hsva[0];
  }
  hsva_to_rgba = _es6_module.add_export('hsva_to_rgba', hsva_to_rgba);
}, '/dev/cleanfairmotion/src/util/colorutils.js');
es6_module_define('parseutil', [], function _parseutil_module(_es6_module) {
  "use strict";
  var token=_ESClass("token", [function token(type, val, lexpos, lexlen, lineno, lexer, parser) {
    this.type = type;
    this.value = val;
    this.lexpos = lexpos;
    this.lexlen = lexlen;
    this.lineno = lineno;
    this.lexer = lexer;
    this.parser = parser;
  }, function toString() {
    if (this.value!=undefined)
      return "token(type="+this.type+", value='"+this.value+"')";
    else 
      return "token(type="+this.type+")";
  }]);
  _es6_module.add_class(token);
  token = _es6_module.add_export('token', token);
  var tokdef=_ESClass("tokdef", [function tokdef(name, regexpr, func) {
    this.name = name;
    this.re = regexpr;
    this.func = func;
  }]);
  _es6_module.add_class(tokdef);
  tokdef = _es6_module.add_export('tokdef', tokdef);
  var PUTLParseError=_ESClass("PUTLParseError", Error, [function PUTLParseError(msg) {
    Error.call(this);
  }]);
  _es6_module.add_class(PUTLParseError);
  PUTLParseError = _es6_module.add_export('PUTLParseError', PUTLParseError);
  var lexer=_ESClass("lexer", [function lexer(tokdef, errfunc) {
    this.tokdef = tokdef;
    this.tokens = new GArray();
    this.lexpos = 0;
    this.lexdata = "";
    this.lineno = 0;
    this.errfunc = errfunc;
    this.tokints = {}
    for (var i=0; i<tokdef.length; i++) {
        this.tokints[tokdef[i].name] = i;
    }
    this.statestack = [["__main__", 0]];
    this.states = {"__main__": [tokdef, errfunc]}
    this.statedata = 0;
  }, function add_state(name, tokdef, errfunc) {
    if (errfunc==undefined) {
        errfunc = function(lexer) {
          return true;
        };
    }
    this.states[name] = [tokdef, errfunc];
  }, function tok_int(name) {
  }, function push_state(state, statedata) {
    this.statestack.push([state, statedata]);
    state = this.states[state];
    this.statedata = statedata;
    this.tokdef = state[0];
    this.errfunc = state[1];
  }, function pop_state() {
    var item=this.statestack[this.statestack.length-1];
    var state=this.states[item[0]];
    this.tokdef = state[0];
    this.errfunc = state[1];
    this.statedata = item[1];
  }, function input(str) {
    while (this.statestack.length>1) {
      this.pop_state();
    }
    this.lexdata = str;
    this.lexpos = 0;
    this.lineno = 0;
    this.tokens = new GArray();
    this.peeked_tokens = [];
  }, function error() {
    if (this.errfunc!=undefined&&!this.errfunc(this))
      return ;
    console.log("Syntax error near line "+this.lineno);
    var next=Math.min(this.lexpos+8, this.lexdata.length);
    console.log("  "+this.lexdata.slice(this.lexpos, next));
    throw new PUTLParseError("Parse error");
  }, function peek() {
    var tok=this.next(true);
    if (tok==undefined)
      return undefined;
    this.peeked_tokens.push(tok);
    return tok;
  }, function peek_i(i) {
    while (this.peeked_tokens.length<=i) {
      var t=this.peek();
      if (t==undefined)
        return undefined;
    }
    return this.peeked_tokens[i];
  }, function at_end() {
    return this.lexpos>=this.lexdata.length&&this.peeked_tokens.length==0;
  }, function next(ignore_peek) {
    if (ignore_peek!=true&&this.peeked_tokens.length>0) {
        var tok=this.peeked_tokens[0];
        this.peeked_tokens.shift();
        return tok;
    }
    if (this.lexpos>=this.lexdata.length)
      return undefined;
    var ts=this.tokdef;
    var tlen=ts.length;
    var lexdata=this.lexdata.slice(this.lexpos, this.lexdata.length);
    var results=[];
    for (var i=0; i<tlen; i++) {
        var t=ts[i];
        if (t.re==undefined)
          continue;
        var res=t.re.exec(lexdata);
        if (res!=null&&res!=undefined&&res.index==0) {
            results.push([t, res]);
        }
    }
    var max_res=0;
    var theres=undefined;
    for (var i=0; i<results.length; i++) {
        var res=results[i];
        if (res[1][0].length>max_res) {
            theres = res;
            max_res = res[1][0].length;
        }
    }
    if (theres==undefined) {
        this.error();
        return ;
    }
    var def=theres[0];
    var lexlen=max_res;
    var tok=new token(def.name, theres[1][0], this.lexpos, lexlen, this.lineno, this, undefined);
    this.lexpos+=max_res;
    if (def.func) {
        tok = def.func(tok);
        if (tok==undefined) {
            return this.next();
        }
    }
    return tok;
  }]);
  _es6_module.add_class(lexer);
  lexer = _es6_module.add_export('lexer', lexer);
  var parser=_ESClass("parser", [function parser(lexer, errfunc) {
    this.lexer = lexer;
    this.errfunc = errfunc;
    this.start = undefined;
  }, function parse(data, err_on_unconsumed) {
    if (err_on_unconsumed==undefined)
      err_on_unconsumed = true;
    if (data!=undefined)
      this.lexer.input(data);
    var ret=this.start(this);
    if (err_on_unconsumed&&!this.lexer.at_end()&&this.lexer.next()!=undefined) {
        var left=this.lexer.lexdata.slice(this.lexer.lexpos-1, this.lexer.lexdata.length);
        this.error(undefined, "parser did not consume entire input; left: "+left);
    }
    return ret;
  }, function input(data) {
    this.lexer.input(data);
  }, function error(tok, msg) {
    if (msg==undefined)
      msg = "";
    if (tok==undefined)
      var estr="Parse error at end of input: "+msg;
    else 
      estr = "Parse error at line "+(tok.lineno+1)+": "+msg;
    var buf="1| ";
    var ld=this.lexer.lexdata;
    var l=1;
    for (var i=0; i<ld.length; i++) {
        var c=ld[i];
        if (c=='\n') {
            l++;
            buf+="\n"+l+"| ";
        }
        else {
          buf+=c;
        }
    }
    console.log("------------------");
    console.log(buf);
    console.log("==================");
    console.log(estr);
    if (this.errfunc&&!this.errfunc(tok)) {
        return ;
    }
    throw new PUTLParseError(estr);
  }, function peek() {
    var tok=this.lexer.peek();
    if (tok!=undefined)
      tok.parser = this;
    return tok;
  }, function peek_i(i) {
    var tok=this.lexer.peek_i(i);
    if (tok!=undefined)
      tok.parser = this;
    return tok;
  }, function peeknext() {
    return this.peek_i(0);
  }, function next() {
    var tok=this.lexer.next();
    if (tok!=undefined)
      tok.parser = this;
    return tok;
  }, function optional(type) {
    var tok=this.peek();
    if (tok==undefined)
      return false;
    if (tok.type==type) {
        this.next();
        return true;
    }
    return false;
  }, function at_end() {
    return this.lexer.at_end();
  }, function expect(type, msg) {
    var tok=this.next();
    if (msg==undefined)
      msg = type;
    if (tok==undefined||tok.type!=type) {
        this.error(tok, "Expected "+msg+", not "+tok.type);
    }
    return tok.value;
  }]);
  _es6_module.add_class(parser);
  parser = _es6_module.add_export('parser', parser);
  function test_parser() {
    var basic_types=new set(["int", "float", "double", "vec2", "vec3", "vec4", "mat4", "string"]);
    var reserved_tokens=new set(["int", "float", "double", "vec2", "vec3", "vec4", "mat4", "string", "static_string", "array"]);
    function tk(name, re, func) {
      return new tokdef(name, re, func);
    }
    var tokens=[tk("ID", /[a-zA-Z]+[a-zA-Z0-9_]*/, function(t) {
      if (reserved_tokens.has(t.value)) {
          t.type = t.value.toUpperCase();
      }
      return t;
    }), tk("OPEN", /\{/), tk("CLOSE", /}/), tk("COLON", /:/), tk("JSCRIPT", /\|/, function(t) {
      var js="";
      var lexer=t.lexer;
      while (lexer.lexpos<lexer.lexdata.length) {
        var c=lexer.lexdata[lexer.lexpos];
        if (c=="\n")
          break;
        js+=c;
        lexer.lexpos++;
      }
      if (js.endsWith(";")) {
          js = js.slice(0, js.length-1);
          lexer.lexpos--;
      }
      t.value = js;
      return t;
    }), tk("LPARAM", /\(/), tk("RPARAM", /\)/), tk("COMMA", /,/), tk("NUM", /[0-9]/), tk("SEMI", /;/), tk("NEWLINE", /\n/, function(t) {
      t.lexer.lineno+=1;
    }), tk("SPACE", / |\t/, function(t) {
    })];
    var __iter_rt=__get_iter(reserved_tokens);
    var rt;
    while (1) {
      var __ival_rt=__iter_rt.next();
      if (__ival_rt.done) {
          break;
      }
      rt = __ival_rt.value;
      tokens.push(tk(rt.toUpperCase()));
    }
    var a="\n  Loop {\n    eid : int;\n    flag : int;\n    index : int;\n    type : int;\n\n    co : vec3;\n    no : vec3;\n    loop : int | eid(loop);\n    edges : array(e, int) | e.eid;\n\n    loops : array(Loop);\n  }\n  ";
    function errfunc(lexer) {
      return true;
    }
    var lex=new lexer(tokens, errfunc);
    console.log("Testing lexical scanner...");
    lex.input(a);
    var tok;
    while (tok = lex.next()) {
      console.log(tok.toString());
    }
    var parser=new parser(lex);
    parser.input(a);
    function p_Array(p) {
      p.expect("ARRAY");
      p.expect("LPARAM");
      var arraytype=p_Type(p);
      var itername="";
      if (p.optional("COMMA")) {
          itername = arraytype;
          arraytype = p_Type(p);
      }
      p.expect("RPARAM");
      return {type: "array", data: {type: arraytype, iname: itername}}
    }
    function p_Type(p) {
      var tok=p.peek();
      if (tok.type=="ID") {
          p.next();
          return {type: "struct", data: "\""+tok.value+"\""}
      }
      else 
        if (basic_types.has(tok.type.toLowerCase())) {
          p.next();
          return {type: tok.type.toLowerCase()}
      }
      else 
        if (tok.type=="ARRAY") {
          return p_Array(p);
      }
      else {
        p.error(tok, "invalid type "+tok.type);
      }
    }
    function p_Field(p) {
      var field={}
      console.log("-----", p.peek().type);
      field.name = p.expect("ID", "struct field name");
      p.expect("COLON");
      field.type = p_Type(p);
      field.set = undefined;
      field.get = undefined;
      var tok=p.peek();
      if (tok.type=="JSCRIPT") {
          field.get = tok.value;
          p.next();
      }
      tok = p.peek();
      if (tok.type=="JSCRIPT") {
          field.set = tok.value;
          p.next();
      }
      p.expect("SEMI");
      return field;
    }
    function p_Struct(p) {
      var st={}
      st.name = p.expect("ID", "struct name");
      st.fields = [];
      p.expect("OPEN");
      while (1) {
        if (p.at_end()) {
            p.error(undefined);
        }
        else 
          if (p.optional("CLOSE")) {
            break;
        }
        else {
          st.fields.push(p_Field(p));
        }
      }
      return st;
    }
    var ret=p_Struct(parser);
    console.log(JSON.stringify(ret));
  }
}, '/dev/cleanfairmotion/src/util/parseutil.js');
es6_module_define('typedwriter', [], function _typedwriter_module(_es6_module) {
  "use strict";
  var TypedCache=_ESClass("TypedCache", [function TypedCache() {
    this.freelist = {}
  }, function get(size) {
    var lst=this.freelist[size];
    if (lst==undefined) {
        lst = this.freelist[size] = [];
    }
    if (lst.length>0) {
        return lst.pop();
    }
    else {
      lst.push(new ArrayBuffer());
      return lst.pop();
    }
  }, function free(arraybuffer) {
    var lst=this.freelist[size];
    if (lst==undefined) {
        lst = this.freelist[size] = [];
    }
    lst.insert(0, arraybuffer);
  }]);
  _es6_module.add_class(TypedCache);
  TypedCache = _es6_module.add_export('TypedCache', TypedCache);
  var typedcache=new TypedCache();
  typedcache = _es6_module.add_export('typedcache', typedcache);
  var u8=new Uint8Array(16);
  var u16=new Uint16Array(u8.buffer);
  var i16=new Int16Array(u8.buffer);
  var u32=new Uint32Array(u8.buffer);
  var i32=new Int32Array(u8.buffer);
  var f32=new Float32Array(u8.buffer);
  var f64=new Float64Array(u8.buffer);
  var TypedWriter=_ESClass("TypedWriter", [function TypedWriter(maxsize) {
    this.i = 0;
    this.maxsize = maxsize;
    this.buf = new Uint8Array(maxsize);
  }, function destroy() {
  }, function int8(f) {
    this.buf[this.i++] = f;
    return this;
  }, function int16(f) {
    var buf=this.buf, i=this.i;
    i16[0] = f;
    buf[i++] = u8[0];
    buf[i++] = u8[1];
    this.i = i;
    return this;
  }, function vec2(v) {
    this.float32(v[0]);
    this.float32(v[1]);
    return this;
  }, function vec3(v) {
    this.float32(v[0]);
    this.float32(v[1]);
    this.float32(v[2]);
    return this;
  }, function vec4(v) {
    this.float32(v[0]);
    this.float32(v[1]);
    this.float32(v[2]);
    this.float32(v[3]);
    return this;
  }, function final() {
    if (this.i>this.buf.length) {
        throw new Error("Exceeded maximum size of TypedWriter: "+this.i+" > "+this.buf.length);
    }
    return this.buf.buffer.slice(0, this.i);
  }, function bytes(f, len) {
    if (len==undefined) {
        len = f.length;
    }
    var buf=this.buf, i=this.i;
    if (typeof f=="string") {
        for (var j=0; j<f.length; j++) {
            buf[i++] = f.charCodeAt(j);
        }
    }
    else {
      for (var j=0; j<f.length; j++) {
          buf[i++] = f[j];
      }
    }
    this.i = i;
    return this;
  }, function int32(f) {
    var buf=this.buf, i=this.i;
    i32[0] = f;
    buf[i++] = u8[0];
    buf[i++] = u8[1];
    buf[i++] = u8[2];
    buf[i++] = u8[3];
    this.i = i;
    return this;
  }, function float32(f) {
    var buf=this.buf, i=this.i;
    f32[0] = f;
    buf[i++] = u8[0];
    buf[i++] = u8[1];
    buf[i++] = u8[2];
    buf[i++] = u8[3];
    this.i = i;
    return this;
  }, function float64(f) {
    var buf=this.buf, i=this.i;
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
  }]);
  _es6_module.add_class(TypedWriter);
  TypedWriter = _es6_module.add_export('TypedWriter', TypedWriter);
}, '/dev/cleanfairmotion/src/util/typedwriter.js');
es6_module_define('jobs', [], function _jobs_module(_es6_module) {
  "use strict";
  var default_job_interval=1;
  var ThreadIterator=_ESClass("ThreadIterator", [function ThreadIterator(worker) {
    this.queue = [];
    this.worker = worker;
    this.iter = {value: undefined, done: false}
    this.data = undefined;
    var this2=this;
    worker.onerror = function(event) {
      console.log("worker error; event: ", event);
      this2.iter.done = true;
    }
    var this2=this;
    worker.onmessage = function(event) {
      var data=event.data.evaluated();
      console.log(data);
      if (data=="{{terminate}}") {
          this2.kill();
          return ;
      }
      this2.queue.push(data);
    }
  }, function next() {
    if (this.iter.done&&this.poll()) {
        this.data = this.get();
    }
    return this.iter;
  }, function send(msg) {
    this.worker.postMessage(data);
  }, function poll() {
    return this.queue.length;
  }, function get() {
    if (this.queue.length===0)
      return undefined;
    var msg=this.queue[0];
    this.queue.shift();
    return msg;
  }, function kill() {
    this.iter.done = true;
    this.worker.terminate();
  }]);
  _es6_module.add_class(ThreadIterator);
  ThreadIterator = _es6_module.add_export('ThreadIterator', ThreadIterator);
  ThreadIterator;
  function worker_joblet(url, method, data) {
    var worker=new Worker(url);
    worker.postMessage({method: method, data: data});
    var iter=new ThreadIterator(worker);
  }
  var Joblet=_ESClass("Joblet", [function Joblet(owner, iter, destroyer, ival, start, finish) {
    if (ival==0||ival==undefined) {
        ival = default_job_interval;
    }
    if (destroyer==undefined) {
        destroyer = function(job) {
        };
    }
    this.start = start;
    this.finish = finish;
    this.ival = ival;
    this._kill = destroyer;
    this.dead = false;
    this.removed = false;
    this.type = get_type_name(iter);
    this.iter = iter;
    this.owner = owner;
    this.last_ms = time_ms(10);
    this.time_mean = new movavg();
    this._id = 0;
    this.queued = false;
  }, function kill() {
    this._kill(this);
  }, function start() {
    this.iter = new this.type;
  }, _ESClass.symbol(Symbol.keystr, function keystr() {
    return get_type_name(this)+this._id;
  })]);
  _es6_module.add_class(Joblet);
  Joblet = _es6_module.add_export('Joblet', Joblet);
  var JobManager=_ESClass("JobManager", [function JobManager() {
    this.jobs = new GArray();
    this.jobmap_owners = new hashtable();
    this.jobmap_types = new hashtable();
    this.queue = new GArray();
    this.idgen = 0;
    this.last_ms = time_ms();
    this.ival = default_job_interval;
    this.host_mean = new movavg(10);
    this.time_perc = 0.3;
  }, function add_job(job) {
    var owner=job.owner;
    var type=job.type;
    job._id = this.idgen++;
    this.jobs.push(job);
    if (!this.jobmap_owners.has(owner))
      this.jobmap_owners.add(owner, new GArray());
    if (!this.jobmap_types.has(type))
      this.jobmap_types.add(type, new GArray());
    var type=job.type;
    this.jobmap_owners.get(owner).push(job);
    this.jobmap_types.get(type).push(job);
  }, function remove_job(job) {
    var type=job.type;
    if (this.removed) {
        console.trace();
        throw "Tried to remove an already removed job!";
    }
    if (!this.dead)
      job.kill(job);
    if (job.queued) {
        this.queue.remove(job);
    }
    this.jobs.remove(job);
    this.jobmap_owners.get(job.owner).remove(job);
    this.jobmap_types.get(job.type).remove(job);
    var q_job, q_i=1000000;
    var __iter_job2=__get_iter(this.jobmap_types.get(type));
    var job2;
    while (1) {
      var __ival_job2=__iter_job2.next();
      if (__ival_job2.done) {
          break;
      }
      job2 = __ival_job2.value;
      if (job2.queued) {
          var i=this.queue.indexOf(job2);
          if (i<q_i) {
              q_job = job2;
              q_i = i;
          }
      }
    }
    if (q_job!=undefined) {
        if (q_job.start!=undefined)
          q_job.start(q_job);
        this.queue.remove(q_job);
        q_job.queued = false;
    }
  }, function kill_owner_jobs(owner) {
    if (!this.jobmap_owners.has(owner))
      return ;
    var jobs=g_list(this.jobmap_owners.get(owner));
    var __iter_job=__get_iter(jobs);
    var job;
    while (1) {
      var __ival_job=__iter_job.next();
      if (__ival_job.done) {
          break;
      }
      job = __ival_job.value;
      this.remove_job(job);
    }
    this.jobmap_owners.remove(owner);
  }, function kill_type_jobs(type) {
    type = get_type_name(type);
    if (!jobmap_types.has(type))
      return ;
    var jobs=g_list(jobmap_types.get(type));
    var __iter_job=__get_iter(jobs);
    var job;
    while (1) {
      var __ival_job=__iter_job.next();
      if (__ival_job.done) {
          break;
      }
      job = __ival_job.value;
      this.remove_job(job);
    }
    this.jobmap_types.remove(type);
  }, function queue_job(job) {
    this.add_job(job);
    job.queued = true;
    this.queue.push(job);
  }, function queue_replace(job, start) {
    var type=job.type;
    if (start!=undefined) {
        job.start = start;
    }
    if (this.jobmap_types.has(type)) {
        var lst=this.jobmap_types.get(type);
        var found_queued=false;
        var __iter_job2=__get_iter(g_list(lst));
        var job2;
        while (1) {
          var __ival_job2=__iter_job2.next();
          if (__ival_job2.done) {
              break;
          }
          job2 = __ival_job2.value;
          if (job2.queued) {
              this.remove_job(job2);
              found_queued = true;
          }
        }
        if (this.jobmap_types.get(type).length>0) {
            this.queue_job(job);
        }
        else {
          this.add_job(job);
          if (start!=undefined)
            start();
        }
    }
    else {
      this.add_job(job);
      if (start!=undefined)
        start();
    }
  }, function run() {
    if (time_ms()-this.last_ms<this.ival)
      return ;
    var host_ival=time_ms()-this.last_ms-this.ival;
    host_ival = this.host_mean.update(host_ival);
    var max_time=Math.abs((-host_ival*this.time_perc)/(1.0-this.time_perc));
    this.last_ms = time_ms();
    while (time_ms()-this.last_ms<max_time) {
      if (this.jobs.length==0)
        break;
      var __iter_job=__get_iter(this.jobs);
      var job;
      while (1) {
        var __ival_job=__iter_job.next();
        if (__ival_job.done) {
            break;
        }
        job = __ival_job.value;
        if (job.queued)
          continue;
        var ms=time_ms();
        var reti=job.iter.next();
        if (!reti.done) {
            var d=time_ms()-job.last_ms;
            job.time_mean.update(d);
            job.last_ms = time_ms();
        }
        else {
          if (job.finish!=undefined)
            job.finish(job);
          this.remove_job(job);
        }
      }
    }
    this.last_ms = time_ms();
  }, function has_job(type) {
    type = get_type_name(type);
    if (this.jobmap_types.has(type)) {
        return this.jobmap_types.get(type).length>0;
    }
    return false;
  }]);
  _es6_module.add_class(JobManager);
  JobManager = _es6_module.add_export('JobManager', JobManager);
}, '/dev/cleanfairmotion/src/core/jobs.js');
es6_module_define('ajax', ["strutils", "config"], function _ajax_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, 'config');
  var encode_utf8=es6_import_item(_es6_module, 'strutils', 'encode_utf8');
  var decode_utf8=es6_import_item(_es6_module, 'strutils', 'decode_utf8');
  var truncate_utf8=es6_import_item(_es6_module, 'strutils', 'truncate_utf8');
  var urlencode=es6_import_item(_es6_module, 'strutils', 'urlencode');
  var b64decode=es6_import_item(_es6_module, 'strutils', 'b64decode');
  var b64encode=es6_import_item(_es6_module, 'strutils', 'b64encode');
  var DEFL_NAMELEN=64;
  if (typeof String.prototype.toUTF8!="function") {
      String.prototype.toUTF8 = function() {
        var input=String(this);
        var b=[], i, unicode;
        for (i = 0; i<input.length; i++) {
            unicode = input.charCodeAt(i);
            if (unicode<=0x7f) {
                b.push(unicode);
            }
            else 
              if (unicode<=0x7ff) {
                b.push((unicode>>6)|0xc0);
                b.push((unicode&0x3f)|0x80);
            }
            else 
              if (unicode<=0xffff) {
                b.push((unicode>>12)|0xe0);
                b.push(((unicode>>6)&0x3f)|0x80);
                b.push((unicode&0x3f)|0x80);
            }
            else {
              b.push((unicode>>18)|0xf0);
              b.push(((unicode>>12)&0x3f)|0x80);
              b.push(((unicode>>6)&0x3f)|0x80);
              b.push((unicode&0x3f)|0x80);
            }
        }
        return b;
      };
  }
  Number.prototype.pack = function(data) {
    if (Number(Math.ceil(this))==Number(this)) {
        pack_int(data, this);
    }
    else {
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
    var d=[1, 0, 0, 0];
    d = new Int32Array((new Uint8Array(d)).buffer)[0];
    return d==1;
  }
  get_endian = _es6_module.add_export('get_endian', get_endian);
  var little_endian=get_endian();
  little_endian = _es6_module.add_export('little_endian', little_endian);
  function str_to_uint8(str) {
    var uint8=[];
    for (var i=0; i<str.length; i++) {
        uint8.push(str.charCodeAt(i));
    }
    return new Uint8Array(uint8);
  }
  var _static_byte=new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]);
  var _static_view=new DataView(_static_byte.buffer);
  function pack_int(data, i, lendian) {
    if (lendian==undefined) {
        lendian = false;
    }
    
    
    _static_view.setInt32(0, i);
    if (lendian) {
        for (var j=3; j>=0; j--) {
            data.push(_static_byte[j]);
        }
    }
    else {
      for (var j=0; j<4; j++) {
          data.push(_static_byte[j]);
      }
    }
    
    
  }
  pack_int = _es6_module.add_export('pack_int', pack_int);
  function pack_short(data, i, lendian) {
    if (lendian==undefined) {
        lendian = false;
    }
    
    
    _static_view.setInt16(0, i);
    if (lendian) {
        for (var j=1; j>=0; j--) {
            data.push(_static_byte[j]);
        }
    }
    else {
      for (var j=0; j<2; j++) {
          data.push(_static_byte[j]);
      }
    }
    
    
  }
  pack_short = _es6_module.add_export('pack_short', pack_short);
  function pack_byte(data, i) {
    data.push(i);
  }
  pack_byte = _es6_module.add_export('pack_byte', pack_byte);
  function pack_float(data, f, lendian) {
    if (lendian==undefined) {
        lendian = false;
    }
    
    
    _static_view.setFloat32(0, f);
    if (lendian) {
        for (var j=3; j>=0; j--) {
            data.push(_static_byte[j]);
        }
    }
    else {
      for (var j=0; j<4; j++) {
          data.push(_static_byte[j]);
      }
    }
    
    
  }
  pack_float = _es6_module.add_export('pack_float', pack_float);
  function pack_double(data, f, lendian) {
    
    
    _static_view.setFloat64(0, f);
    if (lendian) {
        for (var j=7; j>=0; j--) {
            data.push(_static_byte[j]);
        }
    }
    else {
      for (var j=0; j<8; j++) {
          data.push(_static_byte[j]);
      }
    }
    
    
  }
  pack_double = _es6_module.add_export('pack_double', pack_double);
  function pack_vec2(data, vec, lendian) {
    if (lendian==undefined) {
        lendian = false;
    }
    
    
    pack_float(data, vec[0], lendian);
    pack_float(data, vec[1], lendian);
    
    
  }
  pack_vec2 = _es6_module.add_export('pack_vec2', pack_vec2);
  function pack_vec3(data, vec, lendian) {
    if (lendian==undefined) {
        lendian = false;
    }
    
    
    pack_float(data, vec[0], lendian);
    pack_float(data, vec[1], lendian);
    pack_float(data, vec[2], lendian);
    
    
  }
  pack_vec3 = _es6_module.add_export('pack_vec3', pack_vec3);
  function pack_vec4(data, vec, lendian) {
    if (lendian==undefined) {
        lendian = false;
    }
    pack_float(data, vec[0], lendian);
    pack_float(data, vec[1], lendian);
    pack_float(data, vec[2], lendian);
    pack_float(data, vec[3], lendian);
  }
  pack_vec4 = _es6_module.add_export('pack_vec4', pack_vec4);
  function pack_quat(data, vec, lendian) {
    if (lendian==undefined) {
        lendian = false;
    }
    pack_float(data, vec[0], lendian);
    pack_float(data, vec[1], lendian);
    pack_float(data, vec[2], lendian);
    pack_float(data, vec[3], lendian);
  }
  pack_quat = _es6_module.add_export('pack_quat', pack_quat);
  function pack_mat4(data, mat, lendian) {
    if (lendian==undefined) {
        lendian = false;
    }
    
    
    var m=mat.getAsArray();
    for (var i=0; i<16; i++) {
        pack_float(data, m[i], lendian);
    }
    
    
  }
  pack_mat4 = _es6_module.add_export('pack_mat4', pack_mat4);
  function pack_dataref(data, b, lendian) {
    if (lendian==undefined) {
        lendian = false;
    }
    if (b!=undefined) {
        pack_int(data, b.lib_id, lendian);
        if (b.lib_lib!=undefined)
          pack_int(data, b.lib_lib.id, lendian);
        else 
          pack_int(data, -1, lendian);
    }
    else {
      pack_int(data, -1, lendian);
      pack_int(data, -1, lendian);
    }
  }
  pack_dataref = _es6_module.add_export('pack_dataref', pack_dataref);
  var _static_sbuf_ss=new Array(32);
  function pack_static_string(data, str, length) {
    
    
    if (length==undefined)
      throw new Error("'length' paremter is not optional for pack_static_string()");
    var arr=length<2048 ? _static_sbuf_ss : new Array();
    arr.length = 0;
    encode_utf8(arr, str);
    truncate_utf8(arr, length);
    for (var i=0; i<length; i++) {
        if (i>=arr.length) {
            data.push(0);
        }
        else {
          data.push(arr[i]);
        }
    }
    
    
  }
  pack_static_string = _es6_module.add_export('pack_static_string', pack_static_string);
  function test_str_packers() {
    function static_string_test() {
      var arr=[];
      var teststr="12345678"+String.fromCharCode(8800);
      console.log(teststr);
      var arr2=[];
      encode_utf8(arr2, teststr);
      console.log(arr2.length);
      pack_static_string(arr, teststr, 9);
      if (arr.length!=9)
        throw new UnitTestError("Bad length "+arr.length.toString());
      arr = new DataView(new Uint8Array(arr).buffer);
      var str2=unpack_static_string(arr, new unpack_ctx(), 9);
      console.log(teststr, str2);
      console.log("'12345678'", "'"+str2+"'");
      if (str2!="12345678")
        throw new UnitTestError("Bad truncation");
    }
    static_string_test();
    return true;
  }
  test_str_packers = _es6_module.add_export('test_str_packers', test_str_packers);
  register_test(test_str_packers);
  var _static_sbuf=new Array(32);
  function pack_string(data, str) {
    
    
    _static_sbuf.length = 0;
    encode_utf8(_static_sbuf, str);
    pack_int(data, _static_sbuf.length);
    for (var i=0; i<_static_sbuf.length; i++) {
        data.push(_static_sbuf[i]);
    }
    
    
  }
  pack_string = _es6_module.add_export('pack_string', pack_string);
  function unpack_bytes(data, uctx, len) {
    var ret=new DataView(data.buffer.slice(uctx.i, uctx.i+len));
    uctx.i+=len;
    return ret;
  }
  unpack_bytes = _es6_module.add_export('unpack_bytes', unpack_bytes);
  function unpack_array(data, uctx, unpacker) {
    var len=unpack_int(data, uctx);
    var list=new Array(len);
    for (var i=0; i<len; i++) {
        list[i] = unpacker(data, uctx);
    }
    return list;
  }
  unpack_array = _es6_module.add_export('unpack_array', unpack_array);
  function unpack_garray(data, uctx, unpacker) {
    var len=unpack_int(data, uctx);
    var list=new GArray();
    for (var i=0; i<len; i++) {
        list.push(unpacker(data, uctx));
    }
    return list;
  }
  unpack_garray = _es6_module.add_export('unpack_garray', unpack_garray);
  function unpack_dataref(data, uctx) {
    var block_id=unpack_int(data, uctx);
    var lib_id=unpack_int(data, uctx);
    return new DataRef(block_id, lib_id);
  }
  unpack_dataref = _es6_module.add_export('unpack_dataref', unpack_dataref);
  function unpack_byte(data, uctx) {
    var ret=data.getUint8(uctx.i);
    uctx.i+=1;
    return ret;
  }
  unpack_byte = _es6_module.add_export('unpack_byte', unpack_byte);
  function unpack_int(data, uctx) {
    var ret=data.getInt32(uctx.i);
    uctx.i+=4;
    return ret;
  }
  unpack_int = _es6_module.add_export('unpack_int', unpack_int);
  function unpack_short(data, uctx) {
    var ret=data.getInt16(uctx.i);
    uctx.i+=2;
    return ret;
  }
  unpack_short = _es6_module.add_export('unpack_short', unpack_short);
  function unpack_float(data, uctx) {
    var ret=data.getFloat32(uctx.i);
    uctx.i+=4;
    return ret;
  }
  unpack_float = _es6_module.add_export('unpack_float', unpack_float);
  function unpack_double(data, uctx) {
    var ret=data.getFloat64(uctx.i);
    uctx.i+=8;
    return ret;
  }
  unpack_double = _es6_module.add_export('unpack_double', unpack_double);
  function unpack_vec2(data, uctx) {
    var x=unpack_float(data, uctx);
    var y=unpack_float(data, uctx);
    return new Vector2([x, y]);
  }
  unpack_vec2 = _es6_module.add_export('unpack_vec2', unpack_vec2);
  function unpack_vec3(data, uctx) {
    var vec=new Vector3();
    var x=unpack_float(data, uctx);
    var y=unpack_float(data, uctx);
    var z=unpack_float(data, uctx);
    vec[0] = x;
    vec[1] = y;
    vec[2] = z;
    return vec;
  }
  unpack_vec3 = _es6_module.add_export('unpack_vec3', unpack_vec3);
  function unpack_vec4(data, uctx) {
    var x=unpack_float(data, uctx);
    var y=unpack_float(data, uctx);
    var z=unpack_float(data, uctx);
    var w=unpack_float(data, uctx);
    return new Vector4([x, y, z, w]);
  }
  unpack_vec4 = _es6_module.add_export('unpack_vec4', unpack_vec4);
  function unpack_quat(data, uctx) {
    var x=unpack_float(data, uctx);
    var y=unpack_float(data, uctx);
    var z=unpack_float(data, uctx);
    var w=unpack_float(data, uctx);
    return new Quat([x, y, z, w]);
  }
  unpack_quat = _es6_module.add_export('unpack_quat', unpack_quat);
  function unpack_mat4(data, uctx) {
    var m=new Array(16);
    for (var i=0; i<16; i++) {
        m[i] = unpack_float(data, uctx);
    }
    return new Matrix4(m);
  }
  unpack_mat4 = _es6_module.add_export('unpack_mat4', unpack_mat4);
  function debug_unpack_bytes(data, uctx, length) {
    var s="";
    var arr=new Array(length);
    arr.length = 0;
    for (var i=0; i<length; i++) {
        var c=unpack_byte(data, uctx);
        try {
          c = c ? String.fromCharCode(c) : "?";
        }
        catch (_err) {
            c = "?";
        }
        s+=c;
    }
    return s;
  }
  debug_unpack_bytes = _es6_module.add_export('debug_unpack_bytes', debug_unpack_bytes);
  var _static_arr_uss=new Array(32);
  function unpack_static_string(data, uctx, length) {
    var str="";
    if (length==undefined)
      throw new Error("'length' cannot be undefined in unpack_static_string()");
    var arr=length<2048 ? _static_arr_uss : new Array(length);
    arr.length = 0;
    var done=false;
    for (var i=0; i<length; i++) {
        var c=unpack_byte(data, uctx);
        if (c==0) {
            done = true;
        }
        if (!done&&c!=0) {
            arr.push(c);
        }
    }
    truncate_utf8(arr, length);
    return decode_utf8(arr);
  }
  unpack_static_string = _es6_module.add_export('unpack_static_string', unpack_static_string);
  var _static_arr_us=new Array(32);
  function unpack_string(data, uctx) {
    var str="";
    var slen=unpack_int(data, uctx);
    var arr=slen<2048 ? _static_arr_us : new Array(slen);
    arr.length = slen;
    for (var i=0; i<slen; i++) {
        arr[i] = unpack_byte(data, uctx);
    }
    return decode_utf8(arr);
  }
  unpack_string = _es6_module.add_export('unpack_string', unpack_string);
  var unpack_ctx=_ESClass("unpack_ctx", [function unpack_ctx() {
    this.i = 0;
  }]);
  _es6_module.add_class(unpack_ctx);
  unpack_ctx = _es6_module.add_export('unpack_ctx', unpack_ctx);
  window.NetStatus = function NetStatus() {
    this.progress = 0;
    this.status_msg = "";
    this.cancel = false;
    this._client_control = false;
  }
  var NetJob=_ESClass("NetJob", [function NetJob(owner, iter, finish, error, status) {
    this.iter = iter;
    this.finish = finish;
    this.error = error;
    this.status = status;
    this.status_data = new NetStatus();
    this.value = undefined;
    this.req = undefined;
  }]);
  _es6_module.add_class(NetJob);
  NetJob = _es6_module.add_export('NetJob', NetJob);
  window.NetJob = NetJob;
  function parse_headers(headers) {
    var ret={}
    if (headers==undefined)
      return ret;
    var in_name=true;
    var key="";
    var value="";
    for (var i=0; i<headers.length; i++) {
        var c=headers[i];
        if (c=="\n") {
            ret[key.trim()] = value.trim();
            key = "";
            value = "";
            in_name = true;
            continue;
        }
        else 
          if (c=="\r") {
            continue;
        }
        if (in_name) {
            if (c==" "||c=="\t") {
                continue;
            }
            else 
              if (c==":") {
                in_name = false;
            }
            else {
              key+=c;
            }
        }
        else {
          value+=c;
        }
    }
    if (key.trim().length!=0) {
        ret[key.trim()] = value.trim();
    }
    return ret;
  }
  window.create_folder = function create_folder(job, args) {
    var __gen_this2=this;
    function _generator_iter() {
      this.scope = {job_0: job, args_0: args, token_1: undefined, url_1: undefined}
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
        while ($__state<3) {
          switch ($__state) {
            case 0:
              break;
            case 1:
              scope.token_1=g_app_state.session.tokens.access;
              scope.url_1="/api/files/dir/new?accessToken="+scope.token_1+"&id="+scope.args_0.folderid;
              scope.url_1+="&name="+urlencode(scope.args_0.name);
              api_exec(scope.url_1, scope.job_0, "GET");
              
              $__state = 2;
              break;
            case 2:
              $__ret = this.ret;
              $__ret.value = undefined;
              
              $__state = 3;
              break;
            case 3:
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
  window.api_exec = function api_exec(path, netjob, mode, data, mime, extra_headers, responseType) {
    var owner=netjob.owner;
    var iter=netjob.iter;
    if (mode==undefined)
      mode = "GET";
    if (mime==undefined)
      mime = "application/octet-stream";
    if (data==undefined) {
        data = "";
    }
    var error=netjob.error;
    if (error==undefined) {
        error = function(netjob, owner, msg) {
          console.log("Network Error: "+msg);
        };
    }
    var req=new XMLHttpRequest();
    netjob.req = req;
    req.open(mode, path, true);
    if (mode!="GET")
      req.setRequestHeader("Content-type", mime);
    if (extra_headers!=undefined) {
        for (var k in extra_headers) {
            req.setRequestHeader(k, extra_headers[k]);
        }
    }
    if (responseType==undefined)
      responseType = "text";
    req.onerror = req.onabort = function() {
      error(netjob, netjob.owner, "Network Error");
    }
    req.responseType = responseType;
    req.onprogress = function(evt) {
      if (netjob.status_data._client_control||evt.total==0)
        return ;
      if (DEBUG.netio)
        console.log("progress: ", evt, evt.status, evt.loaded, evt.total);
      var perc=evt.loaded/evt.total;
      netjob.status_data.progress = perc;
      if (DEBUG.netio)
        console.log("perc", perc, netjob.status);
      if (netjob.status)
        netjob.status(netjob, netjob.owner, netjob.status_data);
    }
    req.onreadystatechange = function() {
      if (req.readyState==4&&(req.status>=200&&req.status<=300)) {
          var obj;
          netjob.headers = parse_headers(req.getAllResponseHeaders());
          if (DEBUG.netio)
            console.log("headers:", netjob.headers);
          if (netjob.headers["Content-Type"]=="application/x-javascript") {
              try {
                obj = JSON.parse(req.response);
              }
              catch (_error) {
                  error(netjob, owner, "JSON parse error");
                  obj = {};
                  return ;
              }
              netjob.value = obj;
          }
          else {
            netjob.value = req.response;
          }
          var reti=iter.next();
          if (reti.done) {
              if (netjob.status_data.progress!=1.0) {
                  netjob.status_data.progress = 1.0;
                  if (netjob.status)
                    netjob.status(netjob, netjob.owner, netjob.status_data);
              }
              if (netjob.finish) {
                  netjob.finish(netjob, owner);
              }
          }
      }
      else 
        if (req.status>=400) {
          var resp;
          try {
            resp = req.responseText;
          }
          catch (err) {
              resp = "";
          }
          error(netjob, netjob.owner, resp);
          console.log(req.readyState, req.status, resp);
      }
    }
    var ret=req.send(data);
  }
  window.AuthSessionGen = function AuthSessionGen(job, user, password, refresh_token) {
    var __gen_this2=this;
    function _generator_iter() {
      this.scope = {job_0: job, user_0: user, password_0: password, refresh_token_0: refresh_token, access_token_7: undefined}
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
        while ($__state<10) {
          switch ($__state) {
            case 0:
              break;
            case 1:
              $__state = (scope.refresh_token_0==undefined) ? 2 : 5;
              break;
            case 2:
              scope.sha1pwd_2="{SHA}"+CryptoJS.enc.Base64.stringify(CryptoJS.SHA1(scope.password_0));
              api_exec("/api/auth?user="+scope.user_0+"&password="+scope.sha1pwd_2, scope.job_0);
              
              $__state = 3;
              break;
            case 3:
              $__ret = this.ret;
              $__ret.value = 1;
              
              $__state = 4;
              break;
            case 4:
              console.log("auth value: ", scope.job_0.value);
              scope.refresh_token_0 = scope.job_0.value["refresh_token"];
              
              $__state = 5;
              break;
            case 5:
              api_exec("/api/auth/session?refreshToken="+scope.refresh_token_0, scope.job_0);
              
              $__state = 6;
              break;
            case 6:
              $__ret = this.ret;
              $__ret.value = 1;
              
              $__state = 7;
              break;
            case 7:
              scope.access_token_7=scope.job_0.value["access_token"];
              scope.job_0.value = {refresh: scope.refresh_token_0, access: scope.access_token_7};
              
              $__state = 8;
              break;
            case 8:
              $__state = (scope.job_0.finish!=undefined) ? 9 : 10;
              break;
            case 9:
              scope.job_0.finish(scope.job_0, scope.job_0.owner);
              
              $__state = 10;
              break;
            case 10:
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
  window.auth_session = function auth_session(user, password, finish, error, status) {
    var obj={}
    obj.job = new NetJob(obj, undefined, finish, error, status);
    obj.job.finish = finish;
    obj.iter = new AuthSessionGen(obj.job, user, password);
    obj.job.iter = obj.iter;
    obj.iter.next();
    return obj;
  }
  window.call_api = function call_api(iternew, args, finishcb, errorcb, status) {
    var promise=new Promise(function(accept, reject) {
      var obj={}
      function finish() {
        if (finishcb!=undefined)
          finishcb.apply(this, arguments);
        accept.apply(this, arguments);
      }
      function error() {
        if (errorcb!=undefined)
          errorcb.apply(this, arguments);
        if (reject!=undefined)
          reject.apply(this, arguments);
      }
      obj.job = new NetJob(obj, undefined, finish, error, status);
      var iter=iternew(obj.job, args);
      iter.job = obj.job;
      obj.iter = obj.job.iter = iter;
      obj.iter.next();
    });
    return promise;
  }
  window.get_user_info = function get_user_info(job, args) {
    var __gen_this2=this;
    function _generator_iter() {
      this.scope = {job_0: job, args_0: args, token_3: undefined}
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
        while ($__state<5) {
          switch ($__state) {
            case 0:
              break;
            case 1:
              $__state = (g_app_state.session.tokens==undefined) ? 2 : 3;
              break;
            case 2:
              scope.job_0.finish = undefined;
              scope.job_0.error(scope.job_0, scope.job_0.owner);
              return ;
              
              $__state = 3;
              break;
            case 3:
              scope.token_3=g_app_state.session.tokens.access;
              api_exec("/api/auth/userinfo?accessToken="+scope.token_3, scope.job_0);
              
              $__state = 4;
              break;
            case 4:
              $__ret = this.ret;
              $__ret.value = undefined;
              
              $__state = 5;
              break;
            case 5:
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
  window.get_dir_files = function get_dir_files(job, args) {
    var __gen_this2=this;
    function _generator_iter() {
      this.scope = {job_0: job, args_0: args, token_1: undefined, path_1: undefined}
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
        while ($__state<7) {
          switch ($__state) {
            case 0:
              break;
            case 1:
              scope.token_1=g_app_state.session.tokens.access;
              scope.path_1=scope.args_0.path;
              
              $__state = 2;
              break;
            case 2:
              $__state = (scope.path_1==undefined) ? 3 : 4;
              break;
            case 3:
              api_exec("/api/files/dir/list?accessToken="+scope.token_1+"&id="+scope.args_0.id, scope.job_0);
              
              $__state = 6;
              break;
            case 4:
              
              $__state = 5;
              break;
            case 5:
              api_exec("/api/files/dir/list?accessToken="+scope.token_1+"&path="+scope.path_1, scope.job_0);
              
              $__state = 6;
              break;
            case 6:
              $__ret = this.ret;
              $__ret.value = undefined;
              
              $__state = 7;
              break;
            case 7:
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
  window.upload_file = function upload_file(job, args) {
    var __gen_this2=this;
    function _generator_iter() {
      this.scope = {job_0: job, args_0: args, suffix_1: undefined, url_1: undefined, url2_1: undefined, upload_token_5: undefined, data_5: undefined, len_5: undefined, csize_5: undefined, c_5: undefined, ilen_5: undefined, prog_5: undefined, dp_5: undefined, i_8: undefined}
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
        while ($__state<26) {
          switch ($__state) {
            case 0:
              break;
            case 1:
              scope.suffix_1;
              scope.job_0.status_data._client_control = true;
              scope.url_1=scope.args_0.url;
              scope.url2_1=scope.args_0.chunk_url;
              api_exec(scope.url_1, scope.job_0);
              
              $__state = 2;
              break;
            case 2:
              $__ret = this.ret;
              $__ret.value = 1;
              
              $__state = 3;
              break;
            case 3:
              $__state = (DEBUG.netio) ? 4 : 5;
              break;
            case 4:
              console.log(scope.job_0.value);
              
              $__state = 5;
              break;
            case 5:
              scope.upload_token_5=scope.job_0.value.uploadToken;
              scope.data_5=scope.args_0.data;
              scope.len_5=scope.data_5.byteLength;
              scope.csize_5=1024*256;
              scope.c_5=0;
              scope.ilen_5=Math.ceil(scope.len_5/scope.csize_5);
              scope.prog_5=0.0;
              scope.dp_5=1.0/scope.ilen_5;
              
              $__state = 6;
              break;
            case 6:
              $__state = (DEBUG.netio) ? 7 : 8;
              break;
            case 7:
              console.log("beginning upload", scope.ilen_5);
              
              $__state = 8;
              break;
            case 8:
              scope.i_8=0;
              
              $__state = 9;
              break;
            case 9:
              $__state = (scope.i_8<scope.ilen_5) ? 10 : 26;
              break;
            case 10:
              $__state = (DEBUG.netio) ? 11 : 12;
              break;
            case 11:
              console.log("Uploading chunk "+(scope.i_8+1)+" of "+scope.ilen_5);
              
              $__state = 12;
              break;
            case 12:
              scope.url_1=scope.url2_1+"&uploadToken="+scope.upload_token_5;
              scope.size_12=scope.i_8==scope.ilen_5-1 ? scope.len_5%(scope.csize_5) : scope.csize_5;
              
              $__state = 13;
              break;
            case 13:
              $__state = (DEBUG.netio) ? 14 : 15;
              break;
            case 14:
              console.log(scope.i_8*scope.csize_5, scope.size_12, scope.data_5);
              
              $__state = 15;
              break;
            case 15:
              scope.chunk_15=new DataView(scope.data_5, scope.i_8*scope.csize_5, scope.size_12);
              scope.last_15=scope.i_8*scope.csize_5+scope.size_12-1;
              scope.headers_15={"Content-Range": "bytes "+scope.c_5+"-"+(scope.c_5+scope.size_12-1)+"/"+scope.len_5};
              
              $__state = 16;
              break;
            case 16:
              $__state = (DEBUG.netio) ? 17 : 18;
              break;
            case 17:
              console.log(scope.headers_15["Content-Range"], scope.size_12, scope.c_5, scope.chunk_15);
              
              $__state = 18;
              break;
            case 18:
              api_exec(scope.url_1, scope.job_0, "PUT", scope.chunk_15, undefined, scope.headers_15);
              
              $__state = 19;
              break;
            case 19:
              $__ret = this.ret;
              $__ret.value = undefined;
              
              $__state = 20;
              break;
            case 20:
              scope.c_5+=scope.size_12;
              scope.prog_5+=scope.dp_5;
              scope.job_0.status_data.progress = scope.prog_5;
              
              $__state = 21;
              break;
            case 21:
              $__state = (scope.job_0.status) ? 22 : 25;
              break;
            case 22:
              scope.job_0.status(scope.job_0, scope.job_0.owner, scope.job_0.status_data);
              
              $__state = 23;
              break;
            case 23:
              $__state = (scope.job_0.status.cancel) ? 24 : 25;
              break;
            case 24:
              scope.job_0.finish = undefined;
              scope.job_0.req.abort();
              $__state = 26;
              break;
              
              $__state = 25;
              break;
            case 25:
              scope.i_8++;
              
              $__state = 9;
              break;
            case 26:
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
  window.get_file_data = function get_file_data(job, args) {
    var __gen_this2=this;
    function _generator_iter() {
      this.scope = {job_0: job, args_0: args, token_1: undefined, path_1: undefined, url_1: undefined}
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
              scope.token_1=g_app_state.session.tokens.access;
              scope.path_1=scope.args_0.path;
              scope.url_1;
              
              $__state = 2;
              break;
            case 2:
              $__state = (scope.path_1==undefined) ? 3 : 4;
              break;
            case 3:
              scope.url_1 = "/api/files/get?accessToken="+scope.token_1+"&id="+scope.args_0.id;
              
              $__state = 6;
              break;
            case 4:
              
              $__state = 5;
              break;
            case 5:
              scope.url_1 = "/api/files/get?accessToken="+scope.token_1+"&path="+scope.path_1;
              
              $__state = 6;
              break;
            case 6:
              api_exec(scope.url_1, scope.job_0, undefined, undefined, undefined, undefined, "arraybuffer");
              
              $__state = 7;
              break;
            case 7:
              $__ret = this.ret;
              $__ret.value = undefined;
              
              $__state = 8;
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
}, '/dev/cleanfairmotion/src/core/ajax.js');
es6_module_define('raster', ["icon", "config"], function _raster_module(_es6_module) {
  "use strict";
  var IconManager=es6_import_item(_es6_module, 'icon', 'IconManager');
  var config=es6_import(_es6_module, 'config');
  var CacheStack=_ESClass("CacheStack", Array, [function CacheStack(itemlen) {
    Array.call(this);
    this.dellist = [];
    this.ilen = itemlen;
  }, function pop() {
    var ret=Array.prototype.pop.apply(this, arguments);
    if (this.dellist.length<64) {
        this.dellist.push(ret);
    }
    return ret;
  }, function clear() {
    var len=this.length;
    for (var i=0; i<len; i++) {
        this.pop(len);
    }
  }, function gen() {
    if (this.dellist.length!=0) {
        return this.dellist.pop();
    }
    else {
      return new Array(this.ilen);
    }
  }]);
  _es6_module.add_class(CacheStack);
  var $ret_fBvR_viewport;
  var RasterState=_ESClass("RasterState", [function RasterState(gl, size) {
    this.size = size;
    this.pos = [0, 0];
    this.iconsheet = new IconManager(gl, config.ICONPATH+"iconsheet.png", [512, 512], [32, 32]);
    this.iconsheet16 = new IconManager(gl, config.ICONPATH+"iconsheet16.png", [256, 256], [16, 16]);
    this.viewport_stack = new CacheStack(2);
    this.scissor_stack = new CacheStack(4);
  }, function on_gl_lost(gl) {
    this.pos = [0, 0];
    this.iconsheet = new IconManager(gl, config.ICONPATH+"iconsheet.png", [512, 512], [32, 32]);
    this.iconsheet16 = new IconManager(gl, config.ICONPATH+"iconsheet16.png", [256, 256], [16, 16]);
  }, function begin_draw(gl, pos, size) {
    this.gl = gl;
    this.pos = pos;
    this.size = size;
    this.viewport_stack.clear();
    this.scissor_stack.clear();
    this.cur_scissor = undefined;
  }, _ESClass.get(function viewport() {
    if (this.viewport_stack.length>0) {
        return this.viewport_stack[this.viewport_stack.length-1];
    }
    else {
      $ret_fBvR_viewport[0][0] = $ret_fBvR_viewport[0][1] = 0.0;
      $ret_fBvR_viewport[1][0] = g_app_state.screen.size[0];
      $ret_fBvR_viewport[1][1] = g_app_state.screen.size[1];
      return $ret_fBvR_viewport;
    }
  }), function push_viewport(pos, size) {
    var arr=this.viewport_stack.gen();
    arr[0] = pos;
    arr[1] = size;
    this.viewport_stack.push(arr);
    this.pos = pos;
    this.size = size;
  }, function pop_viewport() {
    var ret=this.viewport_stack.pop(this.viewport_stack.length-1);
    this.pos = ret[0];
    this.size = ret[1];
    return ret;
  }, function push_scissor(pos, size) {
    var rect;
    var gl=this.gl;
    if (this.cur_scissor==undefined) {
        var rect=this.scissor_stack.gen();
        var size2=g_app_state.screen.size;
        rect[0] = 0;
        rect[1] = 0;
        rect[2] = size2[0];
        rect[3] = size2[1];
    }
    else {
      rect = this.scissor_stack.gen();
      for (var i=0; i<4; i++) {
          rect[i] = this.cur_scissor[i];
      }
    }
    this.scissor_stack.push(rect);
    if (this.cur_scissor==undefined) {
        this.cur_scissor = [pos[0], pos[1], size[0], size[1]];
    }
    else {
      var cur=this.cur_scissor;
      cur[0] = pos[0];
      cur[1] = pos[1];
      cur[2] = size[0];
      cur[3] = size[1];
    }
  }, function pop_scissor() {
    var rect=this.scissor_stack.pop();
    var cur=this.cur_scissor;
    if (cur==undefined) {
        cur = [rect[0], rect[1], rect[2], rect[3]];
    }
    else {
      cur[0] = rect[0];
      cur[1] = rect[1];
      cur[2] = rect[2];
      cur[3] = rect[3];
    }
    this.cur_scissor = cur;
  }, function reset_scissor_stack() {
    this.scissor_stack.clear();
    this.cur_scissor = undefined;
  }]);
  var $ret_fBvR_viewport=[[0, 0], [0, 0]];
  _es6_module.add_class(RasterState);
  RasterState = _es6_module.add_export('RasterState', RasterState);
}, '/dev/cleanfairmotion/src/core/raster.js');
es6_module_define('imageblock', ["selectmode", "view2d_editor", "strutils", "J3DIMath", "lib_api", "toolops_api", "struct"], function _imageblock_module(_es6_module) {
  var DataBlock=es6_import_item(_es6_module, 'lib_api', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, 'lib_api', 'DataTypes');
  var BlockFlags=es6_import_item(_es6_module, 'lib_api', 'BlockFlags');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var ModalStates=es6_import_item(_es6_module, 'toolops_api', 'ModalStates');
  var SelMask=es6_import_item(_es6_module, 'selectmode', 'SelMask');
  var SessionFlags=es6_import_item(_es6_module, 'view2d_editor', 'SessionFlags');
  var strutils=es6_import(_es6_module, 'strutils');
  es6_import(_es6_module, 'J3DIMath');
  var ImageFlags={SELECT: 1, VALID: 2}
  ImageFlags = _es6_module.add_export('ImageFlags', ImageFlags);
  var Image=_ESClass("Image", DataBlock, [function Image(name) {
    if (name==undefined) {
        name = "Image";
    }
    DataBlock.call(this, DataTypes.IMAGE, name);
    this.path = "";
    this.data = undefined;
    this.size = [-1, -1];
    this._dom = undefined;
  }, function get_dom_image() {
    if (this._dom==undefined) {
        var img=document.createElement("img");
        var mimetype="image/png";
        if (this.path!=undefined) {
            var p=this.path.toLowerCase();
            if (p.endsWith(".jpg"))
              mimetype = "image/jpeg";
            else 
              if (p.endsWith(".bmp"))
              mimetype = "image/bitmap";
            else 
              if (p.endsWith(".gif"))
              mimetype = "image/gif";
            else 
              if (p.endsWith(".tif"))
              mimetype = "image/tiff";
        }
        if (this.data!=undefined) {
            img.src = strutils.encode_dataurl(mimetype, this.data);
        }
        this._dom = img;
    }
    return this._dom;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=STRUCT.chain_fromSTRUCT(Image, reader);
    if (ret.data.length==0) {
        ret.data = undefined;
    }
    ret.afterSTRUCT();
    return ret;
  })]);
  _es6_module.add_class(Image);
  Image = _es6_module.add_export('Image', Image);
  Image.STRUCT = STRUCT.inherit(Image, DataBlock)+"\n  path  : string;\n  width : array(int);\n  data  : arraybuffer;\n}\n";
  var ImageUser=_ESClass("ImageUser", [function ImageUser() {
    this.off = new Vector2([0, 0]);
    this.scale = new Vector2([1, 1]);
    this.image = undefined;
    this.flag = 0;
  }, function data_link(block, getblock, getblock_us) {
    this.image = getblock(this.image);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new ImageUser();
    reader(ret);
    return ret;
  })]);
  _es6_module.add_class(ImageUser);
  ImageUser = _es6_module.add_export('ImageUser', ImageUser);
  ImageUser.STRUCT = "\nImageUser {\n  off   : vec2;\n  scale : vec2;\n  image : dataref(Image);\n  flag  : int;\n}\n";
}, '/dev/cleanfairmotion/src/core/imageblock.js');
es6_module_define('image_ops', ["fileapi", "lib_api", "spline_draw", "spline", "imageblock", "dialogs", "toolprops", "struct", "toolops_api", "config", "frameset"], function _image_ops_module(_es6_module) {
  var Image=es6_import_item(_es6_module, 'imageblock', 'Image');
  var DataTypes=es6_import_item(_es6_module, 'lib_api', 'DataTypes');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var CollectionProperty=es6_import_item(_es6_module, 'toolprops', 'CollectionProperty');
  var BoolProperty=es6_import_item(_es6_module, 'toolprops', 'BoolProperty');
  var StringProperty=es6_import_item(_es6_module, 'toolprops', 'StringProperty');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var DataRefProperty=es6_import_item(_es6_module, 'toolprops', 'DataRefProperty');
  var ArrayBufferProperty=es6_import_item(_es6_module, 'toolprops', 'ArrayBufferProperty');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, 'toolops_api', 'ModalStates');
  var RestrictFlags=es6_import_item(_es6_module, 'spline', 'RestrictFlags');
  var Spline=es6_import_item(_es6_module, 'spline', 'Spline');
  var VDAnimFlags=es6_import_item(_es6_module, 'frameset', 'VDAnimFlags');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  es6_import(_es6_module, 'struct');
  var redo_draw_sort=es6_import_item(_es6_module, 'spline_draw', 'redo_draw_sort');
  var FileDialog=es6_import_item(_es6_module, 'dialogs', 'FileDialog');
  var FileDialogModes=es6_import_item(_es6_module, 'dialogs', 'FileDialogModes');
  var file_dialog=es6_import_item(_es6_module, 'dialogs', 'file_dialog');
  var download_file=es6_import_item(_es6_module, 'dialogs', 'download_file');
  var config=es6_import(_es6_module, 'config');
  var html5_fileapi=es6_import(_es6_module, 'fileapi');
  var LoadImageOp=_ESClass("LoadImageOp", ToolOp, [_ESClass.static(function tooldef() {
    return {apiname: "image.load_image", uiname: "Load Image", inputs: {name: new StringProperty("Image"), dest_datapath: new StringProperty(""), imagedata: new ArrayBufferProperty(), imagepath: new StringProperty("")}, outputs: {block: new DataRefProperty(undefined, [DataTypes.IMAGE])}, icon: -1, is_modal: true}
  }), function LoadImageOp(datapath, name) {
    if (datapath==undefined) {
        datapath = "";
    }
    if (name==undefined) {
        name = "";
    }
    ToolOp.call(this);
    datapath = ""+datapath;
    name = ""+name;
    this.inputs.dest_datapath.set_data(datapath);
    this.inputs.name.set_data(name);
  }, function start_modal(ctx) {
    ToolOp.prototype.start_modal.call(this, ctx);
    console.log("modal start!", ctx);
    this.end_modal();
    var this2=this;
    if (config.USE_HTML5_FILEAPI) {
        html5_fileapi.open_file(function(buffer, name) {
          console.log("loaded image!", buffer, buffer.byteLength);
          this2.inputs.imagedata.set_data(buffer);
          this2.inputs.imagepath.set_data(name);
          this2.exec(ctx);
        }, this, false, "Images", ["png", "jpg", "bmp", "tiff", "gif", "tga", "targa", "ico", "exr"]);
        return ;
    }
    file_dialog(FileDialogModes.OPEN, ctx, function(dialog, path) {
      console.log("path!:", path);
      download_file(path, function(dataview) {
        var buffer=dataview.buffer;
        console.log("loaded image!", buffer, buffer.byteLength);
        this2.inputs.imagedata.set_data(buffer);
        this2.inputs.imagepath.set_data(path);
        this2.exec(ctx);
      }, undefined, true);
    }, undefined, /\.(png|jpg|gif|bmp|tif|exr|jpeg|ico)/);
  }, function exec(ctx) {
    ctx = new Context();
    var name=this.inputs.name.data.trim();
    name = name=="" ? undefined : name;
    var image=new Image(name);
    ctx.datalib.add(image);
    image.path = this.inputs.imagepath.data;
    image.data = this.inputs.imagedata.data;
    this.outputs.block.set_data(image);
    var outpath=this.inputs.dest_datapath.data.trim();
    if (outpath!="") {
        ctx.api.set_prop(ctx, outpath, image);
    }
  }]);
  _es6_module.add_class(LoadImageOp);
  LoadImageOp = _es6_module.add_export('LoadImageOp', LoadImageOp);
}, '/dev/cleanfairmotion/src/image/image_ops.js');
es6_module_define('UserSettings', ["config", "dialogs", "struct", "theme", "strutils"], function _UserSettings_module(_es6_module) {
  var config=es6_import(_es6_module, 'config');
  var reload_default_theme=es6_import_item(_es6_module, 'theme', 'reload_default_theme');
  var b64encode=es6_import_item(_es6_module, 'strutils', 'b64encode');
  var b64decode=es6_import_item(_es6_module, 'strutils', 'b64decode');
  var download_file=es6_import_item(_es6_module, 'dialogs', 'download_file');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var AppSettings=_ESClass("AppSettings", [function AppSettings() {
    this.unit_scheme = "imperial";
    this.unit = "in";
    this.last_server_update = 0;
    this.update_waiting = false;
    this.recent_paths = [];
  }, function reload_defaults() {
    this.unit_scheme = "imperial";
    this.unit = "in";
    this.recent_paths.length = 0;
    reload_default_theme();
    this.server_update(true);
  }, function find_recent_path(path) {
    for (var i=0; i<this.recent_paths.length; i++) {
        if (this.recent_paths[i].path==path) {
            return i;
        }
    }
    return -1;
  }, function add_recent_file(path, displayname) {
    if (displayname==undefined) {
        displayname = path;
    }
    var rp=this.find_recent_path(path);
    path = new RecentPath(path, displayname);
    if (rp>=0) {
        this.recent_paths.remove(this.recent_paths[path]);
        this.recent_paths.push(path);
    }
    else 
      if (this.recent_paths.length>=config.MAX_RECENT_FILES) {
        this.recent_paths.shift();
        this.recent_paths.push(path);
    }
    else {
      this.recent_paths.push(path);
    }
  }, function toJSON() {
    return this;
  }, _ESClass.static(function fromJSON(obj) {
    var as=new AppSettings();
    as.unit_scheme = obj.unit_scheme;
    as.unit = obj.unit;
    return as;
  }), _ESClass.static(function fromSTRUCT(reader) {
    var ret=new AppSettings();
    reader(ret);
    return ret;
  }), function on_tick() {
    if (this.update_waiting) {
        this.server_update();
    }
  }, function server_update(force) {
    if (force==undefined) {
        force = false;
    }
    force = force||config.NO_SERVER||time_ms()-this.last_server_update>3000;
    force = force&&window.g_app_state!==undefined;
    if (force) {
        _settings_manager.server_push(this);
        this.last_server_update = time_ms();
        this.update_waiting = false;
    }
    else {
      this.update_waiting = true;
    }
  }, function gen_file() {
    var blocks={USET: this}
    var args={blocks: blocks}
    return g_app_state.write_blocks(args);
  }, function download(on_finish) {
    if (on_finish==undefined) {
        on_finish = undefined;
    }
    function finish(data) {
      function finish2(data) {
        console.log("loading settings data...");
        var ret=g_app_state.load_blocks(data);
        if (ret==undefined) {
            console.trace("could not load settings : load_blocks returned undefined");
            return ;
        }
        var fstructs=ret.fstructs;
        var blocks=ret.blocks;
        var version=ret.version;
        var settings=undefined;
        for (var i=0; i<blocks.length; i++) {
            if (blocks[i].type=="USET") {
                settings = fstructs.read_object(blocks[i].data, AppSettings);
            }
        }
        if (settings==undefined) {
            console.trace("could not find settings block");
            return ;
        }
        if (settings.theme!=undefined) {
            
            console.log("loading theme");
            g_theme.patch(settings.theme);
            g_theme = settings.theme;
            delete settings.theme;
            g_theme.gen_globals();
        }
        g_app_state.session.settings = settings;
        if (g_app_state.screen!=undefined)
          g_app_state.screen.do_full_recalc();
        if (on_finish!=undefined) {
            on_finish(settings);
        }
      }
      try {
        finish2(data);
      }
      catch (_err) {
          print_stack(_err);
          console.log("exception occured while loading settings!");
      }
    }
    if (config.NO_SERVER) {
        startup_report("getting settings from myLocalStorage. . .");
        myLocalStorage.getAsync("_settings").then(function(settings) {
          var settings=b64decode(settings);
          settings = new DataView(settings.buffer);
          finish(settings);
        });
    }
    else {
      download_file("/"+fairmotion_settings_filename, finish, "Settings", true);
    }
  }]);
  _es6_module.add_class(AppSettings);
  AppSettings = _es6_module.add_export('AppSettings', AppSettings);
  AppSettings.STRUCT = "\n  AppSettings {\n    unit_scheme  : string;\n    unit         : string;\n    theme        : Theme | g_theme;\n    recent_paths : array(RecentPath);\n  }\n";
  var RecentPath=_ESClass("RecentPath", [function RecentPath(path, displayname) {
    this.path = path;
    this.displayname = displayname;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new RecentPath();
    reader(ret);
    return ret;
  })]);
  _es6_module.add_class(RecentPath);
  RecentPath = _es6_module.add_export('RecentPath', RecentPath);
  RecentPath.STRUCT = "\n  RecentPath {\n    path        : string;\n    displayname : string;\n  }\n";
  var SettUploadManager=_ESClass("SettUploadManager", [function SettUploadManager() {
    this.next = undefined;
    this.active = undefined;
  }, function server_push(settings) {
    startup_report("writing settings");
    if (config.NO_SERVER) {
        var data=settings.gen_file().buffer;
        data = b64encode(new Uint8Array(data));
        myLocalStorage.set("_settings", data);
        return ;
    }
    var job=new UploadJob(undefined, settings);
    if (this.active!=undefined&&!this.active.done) {
        this.next = job;
    }
    else {
      this.active = upload_settings(settings, this);
    }
  }, function finish(job) {
    job.done = true;
    this.active = undefined;
    if (this.next!=undefined) {
        this.server_push(this.next.settings);
        this.next = undefined;
    }
  }]);
  _es6_module.add_class(SettUploadManager);
  SettUploadManager = _es6_module.add_export('SettUploadManager', SettUploadManager);
  window._settings_manager = new SettUploadManager();
  var UploadJob=_ESClass("UploadJob", [function UploadJob(data, settings) {
    if (settings==undefined) {
        settings = undefined;
    }
    this.cancel = false;
    this.data = data;
    this.done = false;
    this.settings = settings;
  }]);
  _es6_module.add_class(UploadJob);
  UploadJob = _es6_module.add_export('UploadJob', UploadJob);
  function upload_settings(settings, uman) {
    var path="/"+fairmotion_settings_filename;
    var data=settings.gen_file().buffer;
    var pnote=g_app_state.notes.progbar("upload settings", 0.0, "uset");
    var ctx=new Context();
    var ujob=new UploadJob(data);
    var did_error=false;
    function error(job, owner, msg) {
      if (!did_error) {
          uman.finish(ujob);
          pnote.end();
          g_app_state.notes.label("Network Error");
          did_error = true;
      }
    }
    function status(job, owner, status) {
      pnote.set_value(status.progress);
    }
    var this2=this;
    function finish(job, owner) {
      uman.finish(ujob);
    }
    var token=g_app_state.session.tokens.access;
    var url="/api/files/upload/start?accessToken="+token+"&path="+path;
    var url2="/api/files/upload?accessToken="+token;
    call_api(upload_file, {data: data, url: url, chunk_url: url2}, finish, error, status);
    return ujob;
  }
}, '/dev/cleanfairmotion/src/core/UserSettings.js');
var g_app_state, g, t;
es6_module_define('AppState', ["ajax", "toolprops", "config", "scene", "FrameManager", "startup_file", "ops_editor", "toolops_api", "spline_base", "lib_api", "lib_utils", "raster", "strutils", "data_api", "CurveEditor", "UserSettings", "DopeSheetEditor", "frameset", "UICanvas", "notifications", "lib_api_typedefine", "view2d_ops", "ScreenArea", "jobs", "struct", "fileapi", "view2d"], function _AppState_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, 'config');
  var html5_fileapi=es6_import(_es6_module, 'fileapi');
  es6_import(_es6_module, 'startup_file');
  var gen_screen=es6_import_item(_es6_module, 'FrameManager', 'gen_screen');
  var DataPath=es6_import_item(_es6_module, 'data_api', 'DataPath');
  var DataStruct=es6_import_item(_es6_module, 'data_api', 'DataStruct');
  var DataPathTypes=es6_import_item(_es6_module, 'data_api', 'DataPathTypes');
  var DataFlags=es6_import_item(_es6_module, 'data_api', 'DataFlags');
  var DataAPI=es6_import_item(_es6_module, 'data_api', 'DataAPI');
  var DataStructArray=es6_import_item(_es6_module, 'data_api', 'DataStructArray');
  var wrap_getblock=es6_import_item(_es6_module, 'lib_utils', 'wrap_getblock');
  var wrap_getblock_us=es6_import_item(_es6_module, 'lib_utils', 'wrap_getblock_us');
  var UICanvas=es6_import_item(_es6_module, 'UICanvas', 'UICanvas');
  var urlencode=es6_import_item(_es6_module, 'strutils', 'urlencode');
  var b64decode=es6_import_item(_es6_module, 'strutils', 'b64decode');
  var b64encode=es6_import_item(_es6_module, 'strutils', 'b64encode');
  var BasicFileOp=es6_import_item(_es6_module, 'view2d_ops', 'BasicFileOp');
  var AppSettings=es6_import_item(_es6_module, 'UserSettings', 'AppSettings');
  var JobManager=es6_import_item(_es6_module, 'jobs', 'JobManager');
  var RasterState=es6_import_item(_es6_module, 'raster', 'RasterState');
  var NotificationManager=es6_import_item(_es6_module, 'notifications', 'NotificationManager');
  var Notification=es6_import_item(_es6_module, 'notifications', 'Notification');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var get_data_typemap=es6_import_item(_es6_module, 'lib_api_typedefine', 'get_data_typemap');
  var Screen=es6_import_item(_es6_module, 'FrameManager', 'Screen');
  var ScreenArea=es6_import_item(_es6_module, 'ScreenArea', 'ScreenArea');
  var Area=es6_import_item(_es6_module, 'ScreenArea', 'Area');
  var DataLib=es6_import_item(_es6_module, 'lib_api', 'DataLib');
  var DataBlock=es6_import_item(_es6_module, 'lib_api', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, 'lib_api', 'DataTypes');
  var ToolMacro=es6_import_item(_es6_module, 'toolops_api', 'ToolMacro');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var PropTypes=es6_import_item(_es6_module, 'toolprops', 'PropTypes');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var StringProperty=es6_import_item(_es6_module, 'toolprops', 'StringProperty');
  var CollectionProperty=es6_import_item(_es6_module, 'toolprops', 'CollectionProperty');
  var View2DHandler=es6_import_item(_es6_module, 'view2d', 'View2DHandler');
  var Scene=es6_import_item(_es6_module, 'scene', 'Scene');
  var SplineTypes=es6_import_item(_es6_module, 'spline_base', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, 'spline_base', 'SplineFlags');
  var DopeSheetEditor=es6_import_item(_es6_module, 'DopeSheetEditor', 'DopeSheetEditor');
  var CurveEditor=es6_import_item(_es6_module, 'CurveEditor', 'CurveEditor');
  var OpStackEditor=es6_import_item(_es6_module, 'ops_editor', 'OpStackEditor');
  var pack_byte=es6_import_item(_es6_module, 'ajax', 'pack_byte');
  var pack_short=es6_import_item(_es6_module, 'ajax', 'pack_short');
  var pack_int=es6_import_item(_es6_module, 'ajax', 'pack_int');
  var pack_float=es6_import_item(_es6_module, 'ajax', 'pack_float');
  var pack_double=es6_import_item(_es6_module, 'ajax', 'pack_double');
  var pack_vec2=es6_import_item(_es6_module, 'ajax', 'pack_vec2');
  var pack_vec3=es6_import_item(_es6_module, 'ajax', 'pack_vec3');
  var pack_vec4=es6_import_item(_es6_module, 'ajax', 'pack_vec4');
  var pack_mat4=es6_import_item(_es6_module, 'ajax', 'pack_mat4');
  var pack_quat=es6_import_item(_es6_module, 'ajax', 'pack_quat');
  var pack_dataref=es6_import_item(_es6_module, 'ajax', 'pack_dataref');
  var pack_string=es6_import_item(_es6_module, 'ajax', 'pack_string');
  var pack_static_string=es6_import_item(_es6_module, 'ajax', 'pack_static_string');
  var unpack_byte=es6_import_item(_es6_module, 'ajax', 'unpack_byte');
  var unpack_short=es6_import_item(_es6_module, 'ajax', 'unpack_short');
  var unpack_int=es6_import_item(_es6_module, 'ajax', 'unpack_int');
  var unpack_float=es6_import_item(_es6_module, 'ajax', 'unpack_float');
  var unpack_double=es6_import_item(_es6_module, 'ajax', 'unpack_double');
  var unpack_vec2=es6_import_item(_es6_module, 'ajax', 'unpack_vec2');
  var unpack_vec3=es6_import_item(_es6_module, 'ajax', 'unpack_vec3');
  var unpack_vec4=es6_import_item(_es6_module, 'ajax', 'unpack_vec4');
  var unpack_mat4=es6_import_item(_es6_module, 'ajax', 'unpack_mat4');
  var unpack_quat=es6_import_item(_es6_module, 'ajax', 'unpack_quat');
  var unpack_dataref=es6_import_item(_es6_module, 'ajax', 'unpack_dataref');
  var unpack_string=es6_import_item(_es6_module, 'ajax', 'unpack_string');
  var unpack_static_string=es6_import_item(_es6_module, 'ajax', 'unpack_static_string');
  var unpack_bytes=es6_import_item(_es6_module, 'ajax', 'unpack_bytes');
  var unpack_ctx=es6_import_item(_es6_module, 'ajax', 'unpack_ctx');
  var profile_reset=es6_import_item(_es6_module, 'struct', 'profile_reset');
  var profile_report=es6_import_item(_es6_module, 'struct', 'profile_report');
  var gen_struct_str=es6_import_item(_es6_module, 'struct', 'gen_struct_str');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var FileFlags={COMPRESSED_LZSTRING: 1}
  FileFlags = _es6_module.add_export('FileFlags', FileFlags);
  t = 2;
  g_app_state = undefined;
  var FileData=_ESClass("FileData", [function FileData(blocks, fstructs, version) {
    this.blocks = blocks;
    this.fstructs = fstructs;
    this.version = version;
  }]);
  _es6_module.add_class(FileData);
  FileData = _es6_module.add_export('FileData', FileData);
  var UserSession=_ESClass("UserSession", [function UserSession() {
    this.tokens = {}
    this.username = "user";
    this.password = "";
    this.is_logged_in = false;
    this.loaded_settings = false;
    this.userid = undefined;
    this.settings = new AppSettings();
  }, function copy() {
    var c=new UserSession();
    for (var k in this.tokens) {
        c.tokens[k] = this.tokens[k];
    }
    c.username = this.username;
    c.password = this.password;
    c.is_logged_in = this.is_logged_in;
    c.loaded_settings = false;
    c.settings = this.settings;
    c.userid = this.userid;
    return c;
  }, function store(override_settings) {
    if (override_settings==undefined) {
        override_settings = false;
    }
    var saveobj=this.copy();
    if (!override_settings&&myLocalStorage.hasCached("session")) {
        try {
          var old=JSON.parse(myLocalStorage.getCached("session"));
          saveobj.settings = old;
        }
        catch (error) {
            print_stack(error);
            console.log("error loading session json object");
        }
    }
    myLocalStorage.set("session", JSON.stringify(saveobj));
  }, function logout_simple() {
    this.is_logged_in = false;
    this.tokens = {}
    this.loaded_settings = false;
  }, function validate_session() {
    var session=this;
    if (config.NO_SERVER) {
        this.is_logged_in = true;
        if (!session.loaded_settings) {
            session.settings.download(function() {
              session.loaded_settings = true;
              session.store(true);
            });
        }
        return ;
    }
    function finish2(job, owner) {
      session.tokens = job.value;
      session.is_logged_in = true;
      session.store(false);
      if (DEBUG.netio)
        console.log("downloading current user settings. . .");
      session.settings.download(function() {
        session.store(true);
      });
    }
    function error2(obj, owner, msg) {
      session.is_logged_in = false;
      session.store();
    }
    function error(job, owner, msg) {
      auth_session(session.username, session.password, finish2, error2);
    }
    function finish(job, owner) {
      if (DEBUG.netio)
        console.log("downloading current user settings. . .");
      session.userid = job.value.userid;
      if (!session.loaded_settings) {
          session.settings.download(function() {
            session.loaded_settings = true;
            session.store(true);
          });
      }
      console.log("session valid");
      return ;
    }
    call_api(get_user_info, undefined, finish, error);
  }, _ESClass.static(function fromJSON(obj) {
    var us=new UserSession;
    us.tokens = obj.tokens;
    us.username = obj.username;
    us.password = obj.password;
    us.is_logged_in = obj.is_logged_in;
    us.userid = obj.userid;
    us.settings = new AppSettings();
    return us;
  })]);
  _es6_module.add_class(UserSession);
  window.gen_default_file = function gen_default_file(size) {
    html5_fileapi.reset();
    var g=g_app_state;
    
    if (!myLocalStorage.hasCached("startup_file")) {
        myLocalStorage.startup_file = startup_file_str;
    }
    for (var i=0; i<2; i++) {
        var file=i==0 ? myLocalStorage.getCached("startup_file") : startup_file_str;
        if (file) {
            try {
              var buf=file;
              buf = new DataView(b64decode(buf).buffer);
              g.load_user_file_new(buf, undefined, new unpack_ctx());
              return ;
            }
            catch (err) {
                print_stack(err);
                console.log("ERROR: Could not load user-defined startup file.");
            }
        }
    }
    if (size==undefined)
      var size=[512, 512];
    g.reset_state();
    var op=new BasicFileOp();
    g.toolstack.exec_tool(op);
    var view2d=new View2DHandler(0, 0, size[0], size[1], 0.75, 1000.0);
    g.view2d = g.active_view2d = view2d;
    gen_screen(undefined, view2d, size[0], size[1]);
    view2d.ctx = new Context();
  }
  function output_startup_file() {
    var str=myLocalStorage.getCached("startup_file");
    var out="";
    for (var i=0; i<str.length; i++) {
        out+=str[i];
        if (((i+1)%77)==0) {
            out+="\n";
        }
    }
    return out;
  }
  var $toolop_input_cache_X9S1_AppState;
  var AppState=_ESClass("AppState", [function AppState(screen, mesh, gl) {
    this.screen = screen;
    this.eventhandler = screen;
    this.active_editor = undefined;
    this._nonblocks = new set(["SCRN", "TSTK", "THME"]);
    this.select_multiple = false;
    this.select_inverse = false;
    this._last_touch_mpos = [0, 0];
    this.notes = new NotificationManager();
    this.spline_pathstack = [];
    this._active_splinepath = "frameset.drawspline";
    this.was_touch = false;
    this.toolstack = new ToolStack(this);
    this.active_view2d = undefined;
    this.api = new DataAPI(this);
    this.filepath = "";
    this.version = g_app_version;
    this.gl = gl;
    this.size = screen!==undefined ? screen.size : [512, 512];
    this.raster = new RasterState(undefined, screen!==undefined ? screen.size : [512, 512]);
    this.toolop_input_cache = $toolop_input_cache_X9S1_AppState;
    if (this.datalib!==undefined) {
        this.datalib.on_destroy();
    }
    this.datalib = new DataLib();
    this.modalstate = 0;
    this.jobs = new JobManager();
    if (myLocalStorage.hasCached("session")) {
        try {
          this.session = UserSession.fromJSON(JSON.parse(myLocalStorage.getCached("session")));
        }
        catch (error) {
            print_stack(error);
            console.log("Error loading json session object:", myLocalStorage.getCached("session"));
        }
    }
    else {
      this.session = new UserSession();
    }
  }, function set_modalstate(state) {
    if (state==undefined) {
        state = 0;
    }
    this.modalstate = state;
  }, _ESClass.get(function active_splinepath() {
    var scene=this.datalib.get_active(DataTypes.SCENE);
    if (scene!=undefined)
      return scene.active_splinepath;
    return this._active_splinepath;
  }), _ESClass.set(function active_splinepath(val) {
    this._active_splinepath = val;
    var scene=this.datalib.get_active(DataTypes.SCENE);
    if (scene!=undefined)
      scene.active_splinepath = val;
  }), function destroy() {
    this.screen.destroy();
  }, function on_gl_lost(new_gl) {
    this.gl = new_gl;
    this.raster.on_gl_lost(new_gl);
    this.datalib.on_gl_lost(new_gl);
    this.screen.on_gl_lost(new_gl);
  }, function update_context() {
    var scene=this.datalib.get_active(DataTypes.SCENE);
    if (scene===undefined)
      return ;
  }, function switch_active_spline(newpath) {
    this.active_splinepath = newpath;
  }, function push_active_spline(newpath) {
    this.spline_pathstack.push(this.active_splinepath);
    this.switch_active_spline(newpath);
  }, function pop_active_spline() {
    this.switch_active_spline(this.spline_pathstack.pop());
  }, function reset_state(screen) {
    this.spline_pathstack = [];
    this.active_splinepath = "frameset.drawspline";
    for (let k in window.active_canvases) {
        let canvas=window.active_canvases[k];
        canvas[1].kill_canvas(k);
    }
    window.active_canvases = {}
    AppState.call(this, screen, undefined, this.gl);
    try {
      if (this.screen!==undefined)
        this.screen.destroy();
    }
    catch (error) {
        print_stack(error);
        console.log("ERROR: failed to fully destroy screen context");
    }
  }, function copy() {
    var as=new AppState(this.screen, undefined, this.gl);
    as.datalib = this.datalib;
    as.session = this.session;
    as.toolstack = this.toolstack;
    as.filepath = this.filepath;
    return as;
  }, function set_startup_file() {
    var buf=this.create_user_file_new({gen_dataview: true, compress: true, save_theme: false, save_toolstack: false});
    buf = new Uint8Array(buf.buffer);
    buf = b64encode(buf);
    myLocalStorage.set("startup_file", buf);
    g_app_state.notes.label("New file template saved");
  }, function create_scene_file() {
    var buf=this.create_user_file_new({save_screen: false, save_toolstack: false});
    return buf;
  }, function create_undo_file() {
    var buf=this.create_user_file_new({save_screen: false, save_toolstack: false});
    return buf;
  }, function load_scene_file(scenefile) {
    if (the_global_dag!=undefined)
      the_global_dag.reset_cache();
    var screen=this.screen;
    var toolstack=this.toolstack;
    var view2d=this.active_view2d;
    console.log(scenefile);
    if (this.datalib!==undefined) {
        this.datalib.on_destroy();
    }
    var datalib=new DataLib();
    this.datalib = datalib;
    var filedata=this.load_blocks(scenefile);
    this.link_blocks(datalib, filedata);
    this.screen = screen;
    this.eventhandler = screen;
    this.active_view2d = view2d;
    this.toolstack = toolstack;
    this.screen.ctx = new Context();
    if (the_global_dag!==undefined)
      the_global_dag.reset_cache();
    window.redraw_viewport();
  }, function load_undo_file(undofile) {
    var screen=this.screen;
    var toolstack=this.toolstack;
    console.log(undofile);
    if (this.datalib!=undefined) {
        this.datalib.on_destroy();
    }
    var datalib=new DataLib();
    this.datalib = datalib;
    var filedata=this.load_blocks(undofile);
    this.link_blocks(datalib, filedata);
    this.screen = screen;
    this.eventhandler = screen;
    this.toolstack = toolstack;
    this.screen.ctx = new Context();
    window.redraw_viewport();
  }, function create_user_file_new(args) {
    if (args==undefined) {
        args = {};
    }
    var gen_dataview=true, compress=false;
    var save_screen=true, save_toolstack=false;
    var save_theme=false;
    if (args.gen_dataview!==undefined)
      gen_dataview = args.gen_dataview;
    if (args.compress!==undefined)
      compress = args.compress;
    if (args.save_screen!==undefined)
      save_screen = args.save_screen;
    if (args.save_toolstack!==undefined)
      save_toolstack = args.save_toolstack;
    if (args.save_theme!==undefined)
      save_theme = args.save_theme;
    function bheader(data, type, subtype) {
      pack_static_string(data, type, 4);
      pack_static_string(data, subtype, 4);
    }
    var data=[];
    pack_static_string(data, "FAIR", 4);
    var flag=compress ? FileFlags.COMPRESSED_LZSTRING : 0;
    pack_int(data, flag);
    var major=Math.floor(g_app_version);
    var minor=Math.floor((g_app_version-Math.floor(g_app_version))*1000);
    pack_int(data, major);
    pack_int(data, minor);
    var headerdata=data;
    if (compress) {
        data = [];
    }
    var buf=gen_struct_str();
    bheader(data, "SDEF", "SDEF");
    pack_string(data, buf);
    profile_reset();
    if (save_screen) {
        var data2=[];
        istruct.write_object(data2, this.screen);
        bheader(data, "SCRN", "STRT");
        pack_int(data, data2.length);
        data = data.concat(data2);
    }
    var data2=[];
    var __iter_lib=__get_iter(this.datalib.datalists.values());
    var lib;
    while (1) {
      var __ival_lib=__iter_lib.next();
      if (__ival_lib.done) {
          break;
      }
      lib = __ival_lib.value;
      var __iter_block=__get_iter(lib);
      var block;
      while (1) {
        var __ival_block=__iter_block.next();
        if (__ival_block.done) {
            break;
        }
        block = __ival_block.value;
        data2 = [];
        var t1=time_ms();
        istruct.write_object(data2, block);
        t1 = time_ms()-t1;
        if (t1>50) {
            console.log(t1.toFixed(1)+"ms", block);
        }
        bheader(data, "BLCK", "STRT");
        pack_int(data, data2.length+4);
        pack_int(data, block.lib_type);
        data = data.concat(data2);
      }
    }
    profile_report();
    if (save_toolstack) {
        console.log("writing toolstack");
        var data2=[];
        istruct.write_object(data2, this.toolstack);
        bheader(data, "TSTK", "STRT");
        pack_int(data, data2.length);
        data = data.concat(data2);
    }
    if (save_theme) {
        console.log("writing theme");
        var data2=[];
        istruct.write_object(data2, g_theme);
        bheader(data, "THME", "STRT");
        pack_int(data, data2.length);
        data = data.concat(data2);
    }
    if (compress) {
        data = LZString.compress(new Uint8Array(data));
        console.log("using compression");
        var d=new Uint16Array(data.length);
        for (var i=0; i<data.length; i++) {
            d[i] = data.charCodeAt(i);
        }
        d = new Uint8Array(d.buffer);
        console.log("  file size", d.length);
        data = new Uint8Array(d.length+headerdata.length);
        for (var i=0; i<headerdata.length; i++) {
            data[i] = headerdata[i];
        }
        for (var i=0; i<d.length; i++) {
            data[i+headerdata.length] = d[i];
        }
        if (gen_dataview)
          return new DataView(data.buffer);
        else 
          return data;
    }
    else {
      console.log("  file size", data.length);
      if (gen_dataview)
        return new DataView(new Uint8Array(data).buffer);
      else 
        return data;
    }
  }, function write_blocks(args) {
    if (args==undefined) {
        args = {};
    }
    var gen_dataview=true, compress=false;
    var save_screen=args.save_screen!=undefined ? args.save_screen : true;
    var save_toolstack=args.save_toolstack!=undefined ? args.save_toolstack : false;
    var save_theme=false;
    var blocks=args["blocks"];
    if (args.gen_dataview!=undefined)
      gen_dataview = args.gen_dataview;
    if (args.compress!=undefined)
      compress = args.compress;
    function bheader(data, type, subtype) {
      pack_static_string(data, type, 4);
      pack_static_string(data, subtype, 4);
    }
    var data=[];
    pack_static_string(data, "FAIR", 4);
    var flag=compress ? FileFlags.COMPRESSED_LZSTRING : 0;
    pack_int(data, flag);
    var major=Math.floor(g_app_version);
    var minor=Math.floor((g_app_version-Math.floor(g_app_version))*1000);
    pack_int(data, major);
    pack_int(data, minor);
    var headerdata=data;
    if (compress) {
        data = [];
    }
    var buf=gen_struct_str();
    bheader(data, "SDEF", "SDEF");
    pack_string(data, buf);
    for (var k in blocks) {
        var data2=[];
        istruct.write_object(data2, blocks[k]);
        bheader(data, k, "STRT");
        pack_int(data, data2.length);
        data = data.concat(data2);
    }
    if (compress) {
        console.log("1 using compression");
        data = LZString.compress(new Uint8Array(data));
        var d=new Uint16Array(data.length);
        for (var i=0; i<data.length; i++) {
            d[i] = data.charCodeAt(i);
        }
        d = new Uint8Array(d.buffer);
        console.log("  file size:", d.length);
        data = new Uint8Array(d.length+headerdata.length);
        for (var i=0; i<headerdata.length; i++) {
            data[i] = headerdata[i];
        }
        for (var i=0; i<d.length; i++) {
            data[i+headerdata.length] = d[i];
        }
        if (gen_dataview)
          return new DataView(data.buffer);
        else 
          return data;
    }
    else {
      console.log("  file size:", data.length);
      if (gen_dataview)
        return new DataView(new Uint8Array(data).buffer);
      else 
        return data;
    }
  }, function do_versions(datalib, blocks, version) {
    if (version<0.046) {
        var __iter_frameset=__get_iter(datalib.framesets);
        var frameset;
        while (1) {
          var __ival_frameset=__iter_frameset.next();
          if (__ival_frameset.done) {
              break;
          }
          frameset = __ival_frameset.value;
          var __iter_spline=__get_iter(frameset._allsplines);
          var spline;
          while (1) {
            var __ival_spline=__iter_spline.next();
            if (__ival_spline.done) {
                break;
            }
            spline = __ival_spline.value;
            console.log("========>", spline);
            var __iter_h=__get_iter(spline.handles);
            var h;
            while (1) {
              var __ival_h=__iter_h.next();
              if (__ival_h.done) {
                  break;
              }
              h = __ival_h.value;
              console.log("  -", h.segments[0], h.segments);
              console.log("  -", h.owning_segment);
              var s=h.owning_segment;
              var v1=s.handle_vertex(h), v2=s.other_vert(v1);
              console.log("patching handle!", h.eid);
              h.load(v2).sub(v1).mulScalar(1.0/3.0).add(v1);
            }
          }
        }
    }
    if (version<0.047) {
        var scene=new Scene();
        scene.set_fake_user();
        this.datalib.add(scene);
    }
    if (version<0.048) {
        var __iter_frameset=__get_iter(datalib.framesets);
        var frameset;
        while (1) {
          var __ival_frameset=__iter_frameset.next();
          if (__ival_frameset.done) {
              break;
          }
          frameset = __ival_frameset.value;
          var __iter_spline=__get_iter(frameset._allsplines);
          var spline;
          while (1) {
            var __ival_spline=__iter_spline.next();
            if (__ival_spline.done) {
                break;
            }
            spline = __ival_spline.value;
            for (var eid in spline.eidmap) {
                var e=spline.eidmap[eid];
                var layer=spline.layerset.active;
                layer.add(e);
            }
          }
        }
    }
    if (version<0.049) {
        var __iter_frameset=__get_iter(datalib.framesets);
        var frameset;
        while (1) {
          var __ival_frameset=__iter_frameset.next();
          if (__ival_frameset.done) {
              break;
          }
          frameset = __ival_frameset.value;
          if (frameset.kcache!=undefined) {
              frameset.kcache.cache = {};
          }
          var __iter_s=__get_iter(frameset.spline.segments);
          var s;
          while (1) {
            var __ival_s=__iter_s.next();
            if (__ival_s.done) {
                break;
            }
            s = __ival_s.value;
            s.v1.flag|=SplineFlags.UPDATE;
            s.v2.flag|=SplineFlags.UPDATE;
            s.h1.flag|=SplineFlags.UPDATE;
            s.h2.flag|=SplineFlags.UPDATE;
            s.flag|=SplineFlags.UPDATE;
          }
          frameset.spline.resolve = 1;
        }
    }
    if (version<0.05) {
        var __iter_frameset=__get_iter(datalib.framesets);
        var frameset;
        while (1) {
          var __ival_frameset=__iter_frameset.next();
          if (__ival_frameset.done) {
              break;
          }
          frameset = __ival_frameset.value;
          startup_warning("Spline equation changed; forcing resolve. . .", version);
          frameset.spline.force_full_resolve();
          frameset.pathspline.force_full_resolve();
        }
    }
  }, function do_versions_post(version) {
  }, function load_user_file_new(data, path, uctx, use_existing_screen) {
    if (use_existing_screen==undefined) {
        use_existing_screen = false;
    }
    if (this.screen!=undefined)
      this.size = new Vector2(this.screen.size);
    if (uctx==undefined) {
        uctx = new unpack_ctx();
    }
    var s=unpack_static_string(data, uctx, 4);
    if (s!="FAIR") {
        console.log("header", s, s.length);
        console.log("data", new Uint8Array(data.buffer));
        throw new Error("Could not load file.");
    }
    var file_flag=unpack_int(data, uctx);
    var version_major=unpack_int(data, uctx);
    var version_minor=unpack_int(data, uctx)/1000.0;
    var version=version_major+version_minor;
    if (file_flag&FileFlags.COMPRESSED_LZSTRING) {
        if (DEBUG.compression)
          console.log("decompressing. . .");
        data = new Uint16Array(data.buffer.slice(uctx.i, data.byteLength));
        var s="";
        for (var i=0; i<data.length; i++) {
            s+=String.fromCharCode(data[i]);
        }
        data = LZString.decompress(s);
        var data2=new Uint8Array(data.length);
        if (DEBUG.compression)
          console.log("uncompressed length: ", data.length);
        for (var i=0; i<data.length; i++) {
            data2[i] = data.charCodeAt(i);
        }
        data = new DataView(data2.buffer);
        uctx.i = 0;
    }
    var blocks=new GArray();
    var fstructs=new STRUCT();
    var datalib=new DataLib();
    var tmap=get_data_typemap();
    window._send_killscreen();
    while (uctx.i<data.byteLength) {
      var type=unpack_static_string(data, uctx, 4);
      var subtype=unpack_static_string(data, uctx, 4);
      var len=unpack_int(data, uctx);
      var bdata;
      if (subtype=="JSON") {
          bdata = unpack_static_string(data, uctx, len);
      }
      else 
        if (subtype=="STRT") {
          if (type=="BLCK") {
              var dtype=unpack_int(data, uctx);
              bdata = unpack_bytes(data, uctx, len-4);
              bdata = [dtype, bdata];
          }
          else {
            bdata = unpack_bytes(data, uctx, len);
          }
      }
      else 
        if (subtype=="SDEF") {
          bdata = unpack_static_string(data, uctx, len).trim();
          fstructs.parse_structs(bdata);
      }
      else {
        console.log(subtype, type, uctx.i, data.byteLength);
        console.trace();
        break;
      }
      blocks.push({type: type, subtype: subtype, len: len, data: bdata});
    }
    for (var i=0; i<blocks.length; i++) {
        var b=blocks[i];
        if (b.subtype=="JSON") {
            b.data = JSON.parse(b.data);
        }
        else 
          if (b.subtype=="STRT") {
            if (b.type=="BLCK") {
                var lt=tmap[b.data[0]];
                lt = lt!=undefined ? lt.name : lt;
                b.data = fstructs.read_object(b.data[1], tmap[b.data[0]]);
                b.data.lib_refs = 0;
                datalib.add(b.data, false);
            }
            else {
              if (b.type=="SCRN") {
                  b.data = fstructs.read_object(b.data, Screen);
              }
              else 
                if (b.type=="THME") {
                  b.data = fstructs.read_object(b.data, Theme);
              }
            }
        }
    }
    for (var i=0; i<blocks.length; i++) {
        var block=blocks[i];
        if (block.type=="THME") {
            
            var old=g_theme;
            g_theme = block.data;
            g_theme.gen_globals();
            old.patch(g_theme);
        }
    }
    if (this.datalib!=undefined) {
        this.datalib.on_destroy();
    }
    this.datalib = datalib;
    this.active_view2d = undefined;
    var getblock=wrap_getblock(datalib);
    var getblock_us=wrap_getblock_us(datalib);
    var screen=undefined;
    var toolstack=undefined;
    var this2=this;
    function load_state() {
      this2.do_versions(datalib, blocks, version);
      for (var i=0; i<blocks.length; i++) {
          var block=blocks[i];
          if (block.subtype=="STRT"&&!this2._nonblocks.has(block.type)) {
              block.data.data_link(block.data, getblock, getblock_us);
          }
      }
      for (var i=0; i<blocks.length; i++) {
          var block=blocks[i];
          if (block.type=="SCRN") {
              screen = block.data;
          }
      }
      var size=new Vector2(this2.size);
      if (screen==undefined) {
          gen_default_file(this2.size);
          if (this2.datalib!=undefined) {
              this2.datalib.on_destroy();
          }
          this2.datalib = datalib;
          screen = this2.screen;
      }
      else {
        this2.datalib = new DataLib();
        if (this2.datalib!=undefined) {
            this2.datalib.on_destroy();
        }
        this2.reset_state(screen, undefined);
        this2.datalib = datalib;
      }
      this2.size = size;
      var __iter_sa=__get_iter(screen.areas);
      var sa;
      while (1) {
        var __ival_sa=__iter_sa.next();
        if (__ival_sa.done) {
            break;
        }
        sa = __ival_sa.value;
        if (__instance_of(sa.area, View2DHandler)) {
            this2.active_view2d = sa.area;
            break;
        }
      }
      var ctx=new Context();
      if (screen!=undefined) {
          screen.view2d = this2.active_view2d;
          screen.data_link(screen, getblock, getblock_us);
      }
      if (this2.datalib!=undefined) {
          this2.datalib.on_destroy();
      }
      this2.datalib = datalib;
      if (this2.screen.canvas==undefined) {
          this2.screen.canvas = new UICanvas([new Vector2(this2.screen.pos), new Vector2(this2.screen.size)]);
      }
      this2.eventhandler = this2.screen;
      this2.screen.on_resize(this2.size);
      this2.screen.size = this2.size;
      var ctx=new Context();
      for (var i=0; i<blocks.length; i++) {
          var block=blocks[i];
          if (block.type=="TSTK") {
              toolstack = block.data;
          }
      }
    }
    function add_macro(p1, p2, tool) {
      p1.push(tool);
      p2.push(tool.saved_context);
      var __iter_t_0=__get_iter(tool.tools);
      var t_0;
      while (1) {
        var __ival_t_0=__iter_t_0.next();
        if (__ival_t_0.done) {
            break;
        }
        t_0 = __ival_t_0.value;
        if (__instance_of(t_0, ToolMacro))
          add_macro(p1, p2, t_0);
        t_0.parent = tool;
        p1.push(t_0);
        p2.push(tool.saved_context);
      }
    }
    load_state();
    this.filepath = path;
    if (toolstack!=undefined) {
        this.toolstack = fstructs.read_object(toolstack, ToolStack);
        this.toolstack.undocur = this.toolstack.undostack.length;
        var patch_tools1=new GArray();
        var patch_tools2=new GArray();
        for (var i=0; i<this.toolstack.undostack.length; i++) {
            var tool=this.toolstack.undostack[i];
            if (tool.uiname=="(undefined)"||tool.uiname==undefined||tool.uiname=="") {
                tool.uiname = tool.name;
                if (tool.uiname=="(undefined)"||tool.uiname==undefined||tool.uiname=="") {
                    tool.uiname = "Macro";
                }
            }
            patch_tools1.push(tool);
            patch_tools2.push(tool.saved_context);
            if (__instance_of(tool, ToolMacro)) {
                add_macro(patch_tools1, patch_tools2, tool);
            }
        }
        for (var i=0; i<this.toolstack.undostack.length; i++) {
            var tool=this.toolstack.undostack[i];
            tool.stack_index = i;
        }
        for (var i=0; i<patch_tools1.length; i++) {
            var tool=patch_tools1[i];
            var saved_context=patch_tools2[i];
            for (var k in tool.inputs) {
                tool.inputs[k].ctx = saved_context;
            }
            for (var k in tool.outputs) {
                tool.outputs[k].ctx = saved_context;
            }
        }
    }
    this.do_versions_post(version);
    window.redraw_viewport();
  }, function load_blocks(data, uctx) {
    if (uctx==undefined) {
        uctx = new unpack_ctx();
    }
    var s=unpack_static_string(data, uctx, 4);
    if (s!="FAIR") {
        console.log(s, s.length);
        console.log(data);
        throw new Error("Could not load file.");
    }
    var file_flag=unpack_int(data, uctx);
    var version_major=unpack_int(data, uctx);
    var version_minor=unpack_int(data, uctx)/1000.0;
    var version=version_major+version_minor;
    if (file_flag&FileFlags.COMPRESSED_LZSTRING) {
        if (DEBUG.compression)
          console.log("decompressing. . .");
        data = new Uint16Array(data.buffer.slice(uctx.i, data.byteLength));
        var s="";
        for (var i=0; i<data.length; i++) {
            s+=String.fromCharCode(data[i]);
        }
        data = LZString.decompress(s);
        var data2=new Uint8Array(data.length);
        if (DEBUG.compression)
          console.log("uncompressed length: ", data.length);
        for (var i=0; i<data.length; i++) {
            data2[i] = data.charCodeAt(i);
        }
        data = new DataView(data2.buffer);
        uctx.i = 0;
    }
    var blocks=new GArray();
    var fstructs=new STRUCT();
    var tmap=get_data_typemap();
    while (uctx.i<data.byteLength) {
      var type=unpack_static_string(data, uctx, 4);
      var subtype=unpack_static_string(data, uctx, 4);
      var len=unpack_int(data, uctx);
      var bdata;
      if (subtype=="JSON") {
          bdata = unpack_static_string(data, uctx, len);
      }
      else 
        if (subtype=="STRT") {
          if (type=="BLCK") {
              var dtype=unpack_int(data, uctx);
              bdata = unpack_bytes(data, uctx, len-4);
              bdata = [dtype, bdata];
          }
          else {
            bdata = unpack_bytes(data, uctx, len);
          }
      }
      else 
        if (subtype=="SDEF") {
          bdata = unpack_static_string(data, uctx, len).trim();
          fstructs.parse_structs(bdata);
      }
      else {
        console.log(subtype, type, uctx.i, data.byteLength);
        console.trace();
        throw new Error("Unknown block type '"+subtype+"', "+JSON.stringify({subtype: subtype, type: type}));
      }
      blocks.push({type: type, subtype: subtype, len: len, data: bdata});
    }
    return new FileData(blocks, fstructs, version);
  }, function link_blocks(datalib, filedata) {
    var blocks=filedata.blocks;
    var fstructs=filedata.fstructs;
    var version=filedata.version;
    var tmap=get_data_typemap();
    for (var i=0; i<blocks.length; i++) {
        var b=blocks[i];
        if (b.subtype=="JSON") {
            b.data = JSON.parse(b.data);
        }
        else 
          if (b.subtype=="STRT") {
            if (b.type=="BLCK") {
                var lt=tmap[b.data[0]];
                lt = lt!=undefined ? lt.name : lt;
                b.data = fstructs.read_object(b.data[1], tmap[b.data[0]]);
                datalib.add(b.data, false);
            }
            else {
              if (b.type=="SCRN") {
                  b.data = fstructs.read_object(b.data, Screen);
              }
            }
        }
    }
    this.active_view2d = undefined;
    var getblock=wrap_getblock(datalib);
    var getblock_us=wrap_getblock_us(datalib);
    var screen=undefined;
    this.scene = undefined;
    this.do_versions(datalib, blocks, version);
    for (var i=0; i<blocks.length; i++) {
        var block=blocks[i];
        if (block!=undefined&&(typeof (block.data)=="string"||__instance_of(block.data, String)))
          continue;
        if (block.data!=undefined&&"data_link" in block.data&&block.subtype=="STRT"&&block.type!="SCRN"&&block.type!="THME") {
            block.data.data_link(block.data, getblock, getblock_us);
        }
    }
    for (var i=0; i<blocks.length; i++) {
        var block=blocks[i];
        if (block.type=="SCRN") {
            screen = block.data;
        }
    }
    if (screen!=undefined) {
        this.active_view2d = undefined;
        var __iter_sa=__get_iter(screen.areas);
        var sa;
        while (1) {
          var __ival_sa=__iter_sa.next();
          if (__ival_sa.done) {
              break;
          }
          sa = __ival_sa.value;
          if (__instance_of(sa.area, View2DHandler)) {
              this.active_view2d = sa.area;
              break;
          }
        }
    }
    var ctx=new Context();
    if (screen!=undefined) {
        screen.view2d = this.active_view2d;
        screen.data_link(screen, getblock, getblock_us);
    }
    if (screen!=undefined) {
        if (screen.canvas==undefined) {
            screen.canvas = new UICanvas([new Vector2(screen.pos), new Vector2(screen.size)]);
        }
        screen.on_resize(this.size);
        screen.size = this.size;
    }
  }]);
  var $toolop_input_cache_X9S1_AppState={}
  _es6_module.add_class(AppState);
  AppState = _es6_module.add_export('AppState', AppState);
  window.AppState = AppState;
  var ToolContext=_ESClass("ToolContext", [function ToolContext(frameset, spline, scene, splinepath) {
    var ctx=new Context();
    if (splinepath==undefined)
      splinepath = ctx.splinepath;
    if (frameset==undefined)
      frameset = ctx.frameset;
    if (spline==undefined&&frameset!=undefined)
      spline = ctx.spline;
    if (scene==undefined)
      scene = ctx.scene;
    this.datalib = g_app_state.datalib;
    this.splinepath = splinepath;
    this.frameset = frameset;
    this.spline = spline;
    this.scene = scene;
    this.edit_all_layers = ctx.edit_all_layers;
    this.api = g_app_state.api;
  }]);
  _es6_module.add_class(ToolContext);
  ToolContext = _es6_module.add_export('ToolContext', ToolContext);
  window.ToolContext = ToolContext;
  var SavedContext=_ESClass("SavedContext", [function SavedContext(ctx) {
    if (ctx==undefined) {
        ctx = undefined;
    }
    if (ctx!=undefined) {
        this.time = ctx.scene!=undefined ? ctx.scene.time : undefined;
        this.edit_all_layers = ctx.edit_all_layers;
        this._scene = ctx.scene ? new DataRef(ctx.scene) : new DataRef(-1);
        this._frameset = ctx.frameset ? new DataRef(ctx.frameset) : new DataRef(-1);
        this._frameset_editmode = "MAIN";
        this._spline_path = ctx.splinepath;
        if (ctx.spline!=undefined) {
            this._active_spline_layer = ctx.spline.layerset.active.id;
        }
    }
    else {
      this._scene = new DataRef(-1);
      this._frameset = new DataRef(-1);
      this.time = 0;
      this._spline_path = "frameset.drawspline";
      this._active_spline_layer = -1;
    }
  }, _ESClass.get(function splinepath() {
    return this._spline_path;
  }), function set_context(state) {
    var scene=state.datalib.get(this._scene);
    var fset=state.datalib.get(this._frameset);
    if (scene!=undefined&&scene.time!=this.time)
      scene.change_time(this, this.time, false);
    if (fset!=undefined)
      fset.editmode = this._frameset_editmode;
    state.switch_active_spline(this._spline_path);
    var spline=state.api.get_object(this._spline_path);
    if (spline!=undefined) {
        var layer=spline.layerset.idmap[this._active_spline_layer];
        if (layer==undefined) {
            warn("Warning: layer was undefined in SavedContext!");
        }
        else {
          spline.layerset.active = layer;
        }
    }
    else {
      warn("Warning: spline was undefined in SavedContext!");
    }
  }, _ESClass.get(function spline() {
    var ret=g_app_state.api.get_object(this._spline_path);
    if (ret==undefined) {
        warntrace("Warning: bad spline path", this._spline_path);
        ret = g_app_state.api.get_object("frameset.drawspline");
        if (ret==undefined) {
            console.trace("Even Worse: base spline path failed!");
        }
    }
    return ret;
  }), _ESClass.get(function frameset() {
    return g_app_state.datalib.get(this._frameset);
  }), _ESClass.get(function datalib() {
    return g_app_state.datalib;
  }), _ESClass.get(function scene() {
    return this._scene!=undefined ? g_app_state.datalib.get(this._scene) : undefined;
  }), _ESClass.get(function api() {
    return g_app_state.api;
  }), _ESClass.static(function fromSTRUCT(reader) {
    var sctx=new SavedContext();
    reader(sctx);
    if (sctx._scene.id==-1)
      sctx._scene = undefined;
    return sctx;
  })]);
  _es6_module.add_class(SavedContext);
  window.SavedContext = SavedContext;
  SavedContext.STRUCT = "\n  SavedContext {\n    _scene               : DataRef | obj._scene == undefined ? new DataRef(-1) : obj._scene;\n    _frameset            : DataRef | obj._frameset == undefined ? new DataRef(-1) : obj._frameset;\n    _frameset_editmode   : static_string[12];\n    _spline_path         : string;\n    time                 : float;\n    edit_all_layers      : int;\n  }\n";
  var SplineFrameSet=es6_import_item(_es6_module, 'frameset', 'SplineFrameSet');
  var Context=_ESClass("Context", [function Context() {
    this.font = g_app_state.raster.font;
    this.appstate = g_app_state;
    this.keymap_mpos = [0, 0];
    this.api = g_app_state.api;
  }, function switch_active_spline(newpath) {
    g_app_state.switch_active_spline(newpath);
  }, _ESClass.get(function splinepath() {
    return g_app_state.active_splinepath==undefined ? "frameset.drawspline" : g_app_state.active_splinepath;
  }), _ESClass.get(function filepath() {
    return g_app_state.filepath;
  }), _ESClass.get(function edit_all_layers() {
    let view2d=this.view2d;
    return view2d!==undefined ? view2d.edit_all_layers : false;
  }), _ESClass.get(function spline() {
    var ret=this.api.get_object(g_app_state.active_splinepath);
    if (ret==undefined) {
        warntrace("Warning: bad spline path", g_app_state.active_splinepath);
        g_app_state.switch_active_spline("frameset.drawspline");
        if (ret==undefined) {
            warntrace("Even Worse: base spline path failed!", g_app_state.active_splinepath);
        }
    }
    return ret;
  }), _ESClass.get(function dopesheet() {
    return Area.context_area(DopeSheetEditor);
  }), _ESClass.get(function editcurve() {
    return Area.context_area(CurveEditor);
  }), _ESClass.get(function settings_editor() {
    return Area.context_area(SettingsEditor);
  }), _ESClass.get(function frameset() {
    return g_app_state.datalib.framesets.active;
  }), _ESClass.get(function opseditor() {
    return Area.context_area(OpStackEditor);
  }), _ESClass.get(function view2d() {
    var ret=Area.context_area(View2DHandler);
    if (ret==undefined)
      ret = g_app_state.active_view2d;
    return ret;
  }), _ESClass.get(function scene() {
    var list=this.datalib.scenes;
    if (list.length==0) {
        var scene=new Scene();
        scene.set_fake_user();
        this.datalib.add(scene);
    }
    return this.datalib.get_active(DataTypes.SCENE);
  }), _ESClass.get(function screen() {
    return g_app_state.screen;
  }), _ESClass.get(function datalib() {
    return g_app_state.datalib;
  }), _ESClass.get(function toolstack() {
    return g_app_state.toolstack;
  })]);
  _es6_module.add_class(Context);
  Context = _es6_module.add_export('Context', Context);
  window.Context = Context;
  var ToolStack=_ESClass("ToolStack", [function ToolStack(appstate) {
    this.undocur = 0;
    this.undostack = new GArray();
    this.appstate = appstate;
    this.valcache = appstate.toolop_input_cache;
    this.do_truncate = true;
  }, function reexec_stack2(validate) {
    if (validate==undefined) {
        validate = false;
    }
    var stack=this.undostack;
    g_app_state.datalib = new DataLib();
    var mctx=new Context();
    var first=true;
    var last_time=0;
    function do_next(i) {
      var tool=stack[i];
      var ctx=tool.saved_context;
      if ((1||ctx.time!=last_time)&&mctx.frameset!=undefined) {
          mctx.frameset.update_frame();
      }
      ctx.set_context(mctx);
      last_time = ctx.time;
      tool.is_modal = false;
      tool.exec_pre(ctx);
      if (!(tool.undoflag&UndoFlags.IGNORE_UNDO)) {
          tool.undo_pre(ctx);
          tool.undoflag|=UndoFlags.HAS_UNDO_DATA;
      }
      tool.exec(ctx);
      if (mctx.frameset!=undefined)
        mctx.frameset.spline.solve();
      if (mctx.frameset!=undefined)
        mctx.frameset.pathspline.solve();
      if ((1||ctx.time!=last_time)&&mctx.frameset!=undefined) {
          mctx.frameset.update_frame();
      }
    }
    var ival;
    var thei;
    var this2=this;
    function cbfunc() {
      do_next(thei);
      thei+=1;
      var cctx=new Context();
      if (cctx.frameset!=undefined) {
          cctx.frameset.spline.solve();
          cctx.frameset.pathspline.solve();
      }
      window.redraw_viewport();
      clearInterval(ival);
      if (thei<this2.undostack.length)
        ival = window.setInterval(cbfunc, 500);
    }
    do_next(0);
    thei = 1;
    ival = window.setInterval(cbfunc, 500);
    console.log("reexecuting tool stack from scratch. . .");
    for (var i=0; i<this.undocur; i++) {

    }
  }, function reexec_stack(validate) {
    if (validate==undefined) {
        validate = false;
    }
    var stack=this.undostack;
    g_app_state.datalib = new DataLib();
    var mctx=new Context();
    var first=true;
    console.log("reexecuting tool stack from scratch. . .");
    for (var i=0; i<this.undocur; i++) {
        var tool=stack[i];
        var ctx=tool.saved_context;
        ctx.set_context(mctx);
        tool.is_modal = false;
        tool.exec_pre(ctx);
        if (!(tool.undoflag&UndoFlags.IGNORE_UNDO)) {
            tool.undo_pre(ctx);
            tool.undoflag|=UndoFlags.HAS_UNDO_DATA;
        }
        tool.exec(ctx);
    }
  }, function default_inputs(ctx, tool) {
    var cache=this.valcache;
    function get_default(key, defaultval, input_prop) {
      key = tool.constructor.name+":"+key;
      if (key in cache)
        return cache[key];
      cache[key] = defaultval;
      return defaultval;
    }
    var tctx=new ToolContext();
    for (var k in tool.inputs) {
        tool.inputs[k].ctx = tctx;
    }
    for (var k in tool.outputs) {
        tool.outputs[k].ctx = tctx;
    }
    tool.default_inputs(ctx, get_default);
  }, function truncate_stack() {
    if (this.undocur!=this.undostack.length) {
        if (this.undocur==0) {
            this.undostack = new GArray();
        }
        else {
          this.undostack = this.undostack.slice(0, this.undocur);
        }
    }
  }, function undo_push(tool) {
    if (this.do_truncate) {
        this.truncate_stack();
        this.undostack.push(tool);
    }
    else {
      this.undostack.insert(this.undocur, tool);
      for (var i=this.undocur-1; i<this.undostack.length; i++) {
          if (i<0)
            continue;
          this.undostack[i].stack_index = i;
      }
    }
    tool.stack_index = this.undostack.indexOf(tool);
    this.undocur++;
  }, function toolop_cancel(op) {
    if (this.undostack.indexOf(op)>=0) {
        this.undostack.remove(op);
        this.undocur--;
    }
  }, function undo() {
    if (this.undocur>0&&(this.undostack[this.undocur-1].undoflag&UndoFlags.UNDO_BARRIER))
      return ;
    if (this.undocur>0&&!(this.undostack[this.undocur-1].undoflag&UndoFlags.HAS_UNDO_DATA))
      return ;
    if (this.undocur>0) {
        this.undocur--;
        var tool=this.undostack[this.undocur];
        var ctx=new Context();
        if (the_global_dag!=undefined)
          the_global_dag.reset_cache();
        tool.saved_context.set_context(ctx);
        tool.undo(ctx);
        if (the_global_dag!=undefined)
          the_global_dag.reset_cache();
        if (this.undocur>0)
          this.rebuild_last_tool(this.undostack[this.undocur-1]);
        window.redraw_viewport();
    }
  }, function redo() {
    if (this.undocur<this.undostack.length) {
        var tool=this.undostack[this.undocur];
        var ctx=new Context();
        tool.saved_context.set_context(ctx);
        tool.is_modal = false;
        if (!(tool.undoflag&UndoFlags.IGNORE_UNDO)) {
            tool.undo_pre(ctx);
            tool.undoflag|=UndoFlags.HAS_UNDO_DATA;
        }
        var tctx=new ToolContext();
        if (the_global_dag!=undefined)
          the_global_dag.reset_cache();
        tool.exec_pre(tctx);
        tool.exec(tctx);
        tool.redo_post(ctx);
        this.undocur++;
        if (this.undocur>0)
          this.rebuild_last_tool(this.undostack[this.undocur-1]);
    }
  }, function reexec_tool(tool) {
    if (!(tool.undoflag&UndoFlags.HAS_UNDO_DATA)) {
        this.reexec_stack();
    }
    if (tool.stack_index==-1) {
        for (var i=0; i<this.undostack.length; i++) {
            this.undostack[i].stack_index = i;
        }
    }
    if (tool===this.undostack[this.undocur-1]) {
        this.undo();
        this.redo();
    }
    else 
      if (this.undocur>tool.stack_index) {
        var i=0;
        while (this.undocur!=tool.stack_index) {
          this.undo();
          i++;
        }
        while (i>=0) {
          this.redo();
          i--;
        }
    }
    else {
      console.log("reexec_tool: can't reexec tool in inactive portion of stack");
    }
    tool.saved_context = new SavedContext(new Context());
  }, function kill_opstack() {
    this.undostack = new GArray();
    this.undocur = 0;
  }, function gen_tool_datastruct(tool) {
    var datastruct=new DataStruct([]);
    var this2=this;
    var stacktool=tool;
    while (stacktool.parent!=undefined) {
      stacktool = stacktool.parent;
    }
    function update_dataprop(d) {
      this2.reexec_tool(stacktool);
    }
    var this2=this;
    function gen_subtool_struct(tool) {
      if (tool.apistruct==undefined)
        tool.apistruct = this2.gen_tool_datastruct(tool);
      return tool.apistruct;
    }
    var prop=new StringProperty(tool.uiname, tool.uiname, tool.uiname, "Tool Name");
    var dataprop=new DataPath(prop, "tool", "tool_name", true, false);
    dataprop.update = function() {
    }
    prop.flag = TPropFlags.LABEL;
    if (!(tool.flag&ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS)) {
        datastruct.add(dataprop);
    }
    for (var k in tool.inputs) {
        prop = tool.inputs[k];
        if (prop.flag&TPropFlags.PRIVATE)
          continue;
        dataprop = new DataPath(prop, prop.apiname, "", true, false);
        dataprop.update = update_dataprop;
        datastruct.add(dataprop);
    }
    if (__instance_of(tool, ToolMacro)) {
        var tarr=new DataStructArray(gen_subtool_struct);
        var toolsprop=new DataPath(tarr, "tools", "tools", false);
        datastruct.add(toolsprop);
    }
    return datastruct;
  }, function rebuild_last_tool(tool) {
    var s;
    if (tool!=undefined)
      s = this.gen_tool_datastruct(tool);
    else 
      s = new DataStruct([]);
    s.flag|=DataFlags.RECALC_CACHE;
    s.name = "last_tool";
    s = new DataPath(s, "last_tool", "", false, false);
    s.flag|=DataFlags.RECALC_CACHE;
    ContextStruct.replace(s);
  }, function set_tool_coll_flag(tool) {
    for (var k in tool.inputs) {
        var p=tool.inputs[k];
        if (__instance_of(p, CollectionProperty))
          p.flag&=~TPropFlags.COLL_LOOSE_TYPE;
    }
    for (var k in tool.outputs) {
        var p=tool.inputs[k];
        if (__instance_of(p, CollectionProperty))
          p.flag&=~TPropFlags.COLL_LOOSE_TYPE;
    }
    if (__instance_of(tool, ToolMacro)) {
        var __iter_t2=__get_iter(tool.tools);
        var t2;
        while (1) {
          var __ival_t2=__iter_t2.next();
          if (__ival_t2.done) {
              break;
          }
          t2 = __ival_t2.value;
          this.set_tool_coll_flag(t2);
        }
    }
  }, function exec_datapath(ctx, path, val, undo_push, use_simple_undo, cls) {
    if (undo_push==undefined) {
        undo_push = true;
    }
    if (use_simple_undo==undefined) {
        use_simple_undo = false;
    }
    if (cls==undefined) {
        cls = DataPathOp;
    }
    var api=g_app_state.api;
    var prop=api.get_prop_meta(ctx, path);
    if (prop==undefined) {
        console.trace("Error in exec_datapath", path);
        return ;
    }
    var good=this.undostack.length>0&&__instance_of(this.undostack[this.undocur-1], cls);
    good = good&&this.undostack[this.undocur-1].path==path;
    var exists=false;
    if (undo_push||!good) {
        var op=new cls(path, use_simple_undo);
    }
    else {
      op = this.undostack[this.undocur-1];
      this.undo();
      exists = true;
    }
    var input=op.get_prop_input(path, prop);
    input.set_data(val);
    if (exists) {
        this.redo();
    }
    else {
      this.exec_tool(op);
    }
  }, function exec_tool(tool) {
    this.set_tool_coll_flag(tool);
    var ctx=new Context();
    if (tool.can_call(ctx)==false) {
        if (DEBUG.toolstack) {
            console.trace();
            console.log(tool);
        }
        console.log("Can not call tool '"+tool.constructor.name+"'");
        return ;
    }
    if (!(tool.undoflag&UndoFlags.IGNORE_UNDO))
      this.undo_push(tool);
    for (var k in tool.inputs) {
        var p=tool.inputs[k];
        p.ctx = ctx;
        if (p.user_set_data!=undefined)
          p.user_set_data.call(p);
    }
    if (tool.is_modal) {
        tool.modal_ctx = ctx;
        tool.modal_tctx = new ToolContext();
        tool.saved_context = new SavedContext(tool.modal_tctx);
        tool.exec_pre(tool.modal_tctx);
        if (!(tool.undoflag&UndoFlags.IGNORE_UNDO)) {
            if (tool.is_modal)
              tool.modal_running = true;
            tool.undo_pre(ctx);
            tool.undoflag|=UndoFlags.HAS_UNDO_DATA;
            if (tool.is_modal)
              tool.modal_running = false;
        }
        tool._start_modal(ctx);
        tool.start_modal(ctx);
    }
    else {
      var tctx=new ToolContext();
      tool.saved_context = new SavedContext(tctx);
      if (!(tool.undoflag&UndoFlags.IGNORE_UNDO)) {
          tool.undo_pre(ctx);
          tool.undoflag|=UndoFlags.HAS_UNDO_DATA;
      }
      tool.exec_pre(tctx);
      tool.exec(tctx);
    }
    if (!(tool.undoflag&UndoFlags.IGNORE_UNDO)) {
        this.rebuild_last_tool(tool);
    }
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ts=new ToolStack(g_app_state);
    reader(ts);
    ts.undostack = new GArray(ts.undostack);
    for (var i=0; i<ts.undostack.length; i++) {
        ts.undostack[i].stack_index = i;
        ts.set_tool_coll_flag(ts.undostack[i]);
    }
    return ts;
  })]);
  _es6_module.add_class(ToolStack);
  ToolStack.STRUCT = "\n  ToolStack {\n    undocur   : int;\n    undostack : array(abstract(ToolOp)) | obj.undostack.slice(0, obj.undocur);\n  }\n";
}, '/dev/cleanfairmotion/src/core/AppState.js');
es6_module_define('units', ["safe_eval"], function _units_module(_es6_module) {
  "use strict";
  var safe_eval=es6_import_item(_es6_module, 'safe_eval', 'safe_eval');
  var number_regexpr=/(0x[0-9a-fA-F]+)|((\d|(\d\.\d+))+(e|e\-|e\+)\d+)|(\d*\.\d+)|(\d+)/;
  var UnitAttr=_ESClass("UnitAttr", [function UnitAttr(attrs) {
    function getval(defval, key, required) {
      if (required==undefined) {
          required = false;
      }
      if (key in attrs)
        return attrs[key];
      if (required)
        throw new Error("Missing required unit parameter");
      return defval;
    }
    this.grid_steps = getval(undefined, "grid_steps", true);
    this.grid_substeps = getval(undefined, "grid_substeps", true);
    this.geounit = getval(1.0, "geounit", false);
  }]);
  _es6_module.add_class(UnitAttr);
  UnitAttr = _es6_module.add_export('UnitAttr', UnitAttr);
  var Unit=_ESClass("Unit", [function Unit(suffices, cfactor, grid_subd_1, grid_subd_2, attrs) {
    if (grid_subd_2==undefined) {
        grid_subd_2 = grid_subd_1;
    }
    if (attrs==undefined) {
        attrs = {};
    }
    this.cfactor = cfactor;
    this.suffix_list = suffices;
    attrs.grid_steps = grid_subd_1;
    attrs.grid_substeps = grid_subd_2;
    if (!("geounit" in attrs)) {
        attrs.geounit = cfactor;
    }
    this.attrs = new UnitAttr(attrs);
  }, function from_normalized(v) {
    return v/this.cfactor;
  }, function to_normalized(v) {
    return v*this.cfactor;
  }, _ESClass.static(function get_unit(string) {
    var lower=string.toLowerCase();
    var units=Unit.units;
    var unit=undefined;
    if (string=="default") {
        string = lower = g_app_state.session.settings.unit;
    }
    for (var i=0; i<units.length; i++) {
        var u=units[i];
        for (var j=0; j<u.suffix_list.length; j++) {
            if (lower.trim().endsWith(u.suffix_list[j])) {
                unit = u;
                string = string.slice(0, string.length-u.suffix_list[j].length);
                break;
            }
        }
        if (unit!=undefined)
          break;
    }
    return [unit, string];
  }), _ESClass.static(function parse(string, oldval, errfunc, funcparam, defaultunit) {
    var units=Unit.units;
    var lower=string.toLowerCase();
    var unit=undefined;
    if (defaultunit==undefined)
      defaultunit = "cm";
    if (oldval==undefined)
      oldval = 0.0;
    var ret=Unit.get_unit(string);
    unit = ret[0];
    string = ret[1];
    if (unit==undefined) {
        unit = Unit.get_unit(defaultunit)[0];
    }
    var val=-1;
    try {
      val = safe_eval(string);
    }
    catch (err) {
        if (errfunc!=undefined) {
            errfunc(funcparam);
        }
        return oldval;
    }
    if (val==undefined||typeof (val)!="number"||isNaN(val)) {
        console.log(["haha ", val, string]);
        errfunc(funcparam);
        return oldval;
    }
    if (unit!=undefined) {
        val = unit.to_normalized(val);
    }
    return val;
  }), _ESClass.static(function gen_string(val, suffix, max_decimal) {
    if (max_decimal==undefined) {
        max_decimal = 3;
    }
    if (!(typeof val=="number")||val==undefined)
      return "?";
    if (suffix==undefined)
      return val.toFixed(max_decimal);
    if (suffix=="default")
      suffix = g_app_state.session.settings.unit;
    suffix = suffix.toLowerCase().trim();
    var unit=undefined;
    var units=Unit.units;
    for (var i=0; i<units.length; i++) {
        var u=units[i];
        var sl=u.suffix_list;
        for (var j=0; j<sl.length; j++) {
            var s=sl[j];
            if (s==suffix) {
                unit = u;
                break;
            }
        }
        if (unit!=undefined)
          break;
    }
    var out;
    if (unit!=undefined) {
        val = unit.from_normalized(val);
        if (val!=undefined)
          val = val.toFixed(max_decimal);
        else 
          val = "0";
        out = val.toString()+unit.suffix_list[0];
    }
    else {
      val = val.toFixed(max_decimal);
      out = val.toString()+Unit.internal_unit;
    }
    return out;
  })]);
  _es6_module.add_class(Unit);
  Unit = _es6_module.add_export('Unit', Unit);
  Unit.units = [new Unit(["cm"], 1.0, 10), new Unit(["in", "''", "``", '"'], 2.54, 8), new Unit(["ft", "'", "`"], 30.48, 12, 8), new Unit(["m"], 100, 10), new Unit(["mm"], 0.1, 10), new Unit(["km"], 100000, 10), new Unit(["mile"], 160934.4, 10)];
  Unit.metric_units = ["cm", "m", "mm", "km"];
  Unit.imperial_units = ["in", "ft", "mile"];
  Unit.internal_unit = "cm";
}, '/dev/cleanfairmotion/src/core/units.js');
es6_module_define('data_api', ["spline_multires", "animdata", "toolprops", "data_api_parser", "lib_api", "toolops_api", "safe_eval", "config", "UIFrame"], function _data_api_module(_es6_module) {
  var DataPathTypes={PROP: 0, STRUCT: 1, STRUCT_ARRAY: 2}
  DataPathTypes = _es6_module.add_export('DataPathTypes', DataPathTypes);
  var DataFlags={NO_CACHE: 1, RECALC_CACHE: 2}
  DataFlags = _es6_module.add_export('DataFlags', DataFlags);
  var config=es6_import(_es6_module, 'config');
  var safe_eval=es6_import(_es6_module, 'safe_eval');
  var TinyParserError=_ESClass("TinyParserError", Error, [function TinyParserError() {
    Error.apply(this, arguments);
  }]);
  _es6_module.add_class(TinyParserError);
  TinyParserError = _es6_module.add_export('TinyParserError', TinyParserError);
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var PropTypes=es6_import_item(_es6_module, 'toolprops', 'PropTypes');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var ToolProperty=es6_import_item(_es6_module, 'toolprops', 'ToolProperty');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var Vec3Property=es6_import_item(_es6_module, 'toolprops', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, 'toolprops', 'Vec4Property');
  var StringProperty=es6_import_item(_es6_module, 'toolprops', 'StringProperty');
  var FlagProperty=es6_import_item(_es6_module, 'toolprops', 'FlagProperty');
  var EnumProperty=es6_import_item(_es6_module, 'toolprops', 'EnumProperty');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var DataBlock=es6_import_item(_es6_module, 'lib_api', 'DataBlock');
  var apiparser=es6_import_item(_es6_module, 'data_api_parser', 'apiparser');
  var MultiResLayer=es6_import_item(_es6_module, 'spline_multires', 'MultiResLayer');
  var MultiResEffector=es6_import_item(_es6_module, 'spline_multires', 'MultiResEffector');
  var MResFlags=es6_import_item(_es6_module, 'spline_multires', 'MResFlags');
  var has_multires=es6_import_item(_es6_module, 'spline_multires', 'has_multires');
  var ensure_multires=es6_import_item(_es6_module, 'spline_multires', 'ensure_multires');
  var iterpoints=es6_import_item(_es6_module, 'spline_multires', 'iterpoints');
  var compose_id=es6_import_item(_es6_module, 'spline_multires', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, 'spline_multires', 'decompose_id');
  var safe_eval=es6_import(_es6_module, 'safe_eval');
  var DataAPIError=_ESClass("DataAPIError", Error, [function DataAPIError(msg) {
    Error.call(this, msg);
  }]);
  _es6_module.add_class(DataAPIError);
  DataAPIError = _es6_module.add_export('DataAPIError', DataAPIError);
  window.DataAPIError = DataAPIError;
  var DataPath=_ESClass("DataPath", [function DataPath(prop, name, path, dest_is_prop, use_path, flag) {
    if (dest_is_prop==undefined) {
        dest_is_prop = false;
    }
    if (use_path==undefined) {
        use_path = true;
    }
    if (flag==undefined) {
        flag = 0;
    }
    this.flag = flag;
    this.dest_is_prop = dest_is_prop;
    if (prop==undefined)
      this.type = dest_is_prop ? DataPathTypes.PROP : DataPathTypes.STRUCT;
    if (prop!=undefined&&__instance_of(prop, ToolProperty)) {
        this.type = DataPathTypes.PROP;
    }
    else 
      if (prop!=undefined&&__instance_of(prop, DataStruct)) {
        this.type = DataPathTypes.STRUCT;
        prop.parent = this;
        this.pathmap = prop.pathmap;
    }
    else 
      if (prop!=undefined&&__instance_of(prop, DataStructArray)) {
        this.type = DataPathTypes.STRUCT_ARRAY;
        prop.parent = this;
        this.getter = prop.getter;
    }
    this.name = name;
    this.data = prop;
    this.path = path;
    this.update = undefined;
    this.use_path = use_path;
    this.parent = undefined;
  }, function OnUpdate(func) {
    this.update = func;
    if (this.data!==undefined) {
        this.data.update = func;
    }
    return this;
  }, function Default(val) {
    this.data.value = val;
  }, function Range(min, max) {
    this.data.range = [min, max];
    return this;
  }, function SetFlag(flag) {
    this.data.flag|=flag;
  }, function ClearFlag() {
    this.data.flag = 0;
  }, function FlagsUINames(uinames) {
    this.data.setUINames(uinames);
  }, function cache_good() {
    var p=this;
    while (p!=undefined) {
      if (p.flag&DataFlags.RECALC_CACHE)
        return false;
      p = p.parent;
    }
    return true;
  }]);
  _es6_module.add_class(DataPath);
  DataPath = _es6_module.add_export('DataPath', DataPath);
  var DataStructIter=_ESClass("DataStructIter", [function DataStructIter(s) {
    this.ret = {done: false, value: undefined}
    this.cur = 0;
    this.strct = s;
    this.value = undefined;
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return this;
  }), function reset() {
    this.cur = 0;
    this.ret.done = false;
    this.ret.value = undefined;
  }, function next() {
    if (this.cur>=this.strct.paths.length) {
        var ret=this.ret;
        this.cur = 0;
        ret.done = true;
        this.ret = {done: false, value: undefined};
        return ret;
    }
    var p=this.strct.paths[this.cur++];
    p.data.path = p.path;
    this.ret.value = p;
    return this.ret;
  }]);
  _es6_module.add_class(DataStructIter);
  DataStructIter = _es6_module.add_export('DataStructIter', DataStructIter);
  var DataStructArray=_ESClass("DataStructArray", [function DataStructArray(array_item_struct_getter, getitempath, getitem, getiter, getkeyiter, getlength) {
    this.getter = array_item_struct_getter;
    this.getiter = getiter;
    this.getlength = getlength;
    this.getkeyiter = getkeyiter;
    this.getitem = getitem;
    this.getitempath = getitempath;
    this.type = DataPathTypes.STRUCT_ARRAY;
  }]);
  _es6_module.add_class(DataStructArray);
  DataStructArray = _es6_module.add_export('DataStructArray', DataStructArray);
  var DataStruct=_ESClass("DataStruct", [function DataStruct(paths) {
    this.paths = new GArray(paths);
    this.pathmap = {}
    this.parent = undefined;
    this._flag = 0;
    var __iter_p=__get_iter(this.paths);
    var p;
    while (1) {
      var __ival_p=__iter_p.next();
      if (__ival_p.done) {
          break;
      }
      p = __ival_p.value;
      p.parent = this;
      this.pathmap[p.name] = p;
      if (p.type==DataPathTypes.PROP) {
          p.data.path = p.path;
      }
    }
    this.type = DataPathTypes.STRUCT;
  }, function Color3(apiname, path, uiname, description) {
    var ret=new Vec3Property(0, apiname, uiname, description);
    ret.subtype = PropTypes.COLOR3;
    ret = new DataPath(ret, apiname, path, path!=undefined);
    this.add(ret);
    return ret;
  }, function Color4(apiname, path, uiname, description) {
    var ret=new Vec4Property(0, apiname, uiname, description);
    ret.subtype = PropTypes.COLOR4;
    ret = new DataPath(ret, apiname, path, path!=undefined);
    this.add(ret);
    return ret;
  }, function Vector2(apiname, path, uiname, description) {
    var ret=new Vec2Property(0, apiname, uiname, description);
    ret = new DataPath(ret, apiname, path, path!=undefined);
    this.add(ret);
    return ret;
  }, function Vector3(apiname, path, uiname, description) {
    var ret=new Vec3Property(0, apiname, uiname, description);
    ret = new DataPath(ret, apiname, path, path!=undefined);
    this.add(ret);
    return ret;
  }, function Bool(apiname, path, uiname, description) {
    var ret=new BoolProperty(0, apiname, uiname, description);
    ret = new DataPath(ret, apiname, path, path!==undefined);
    this.add(ret);
    return ret;
  }, function Flags(flags, apiname, path, uiname, description) {
    var ret=new FlagProperty(0, flags, undefined, apiname, uiname, description);
    ret = new DataPath(ret, apiname, path, path!==undefined);
    this.add(ret);
    return ret;
  }, function Float(apiname, path, uiname, description) {
    var ret=new FloatProperty(0, apiname, uiname, description);
    ret = new DataPath(ret, apiname, path, path!==undefined);
    this.add(ret);
    return ret;
  }, function Struct(apiname, path, uiname, description) {
    var ret=new DataStruct([]);
    var path=new DataPath(ret, apiname, path, path!=undefined);
    this.add(path);
    return ret;
  }, function Int(apiname, path, uiname, description) {
    var ret=new IntProperty(0, apiname, uiname, description);
    ret = new DataPath(ret, apiname, path, path!=undefined);
    this.add(ret);
    return ret;
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return new DataStructIter(this);
  }), _ESClass.get(function flag() {
    return this._flag;
  }), function cache_good() {
    var p=this;
    while (p!=undefined) {
      if (p.flag&DataFlags.RECALC_CACHE)
        return false;
      p = p.parent;
    }
    return true;
  }, _ESClass.set(function flag(val) {
    this._flag = val;
    function recurse(p, flag) {
      p.flag|=flag;
      if (__instance_of(p, DataStruct)) {
          var __iter_p2=__get_iter(p.paths);
          var p2;
          while (1) {
            var __ival_p2=__iter_p2.next();
            if (__ival_p2.done) {
                break;
            }
            p2 = __ival_p2.value;
            if (__instance_of(p2, DataStruct)) {
                p2.flag|=flag;
            }
            else {
              recurse(p2, flag);
            }
          }
      }
    }
    if (val&DataFlags.NO_CACHE) {
        var __iter_p=__get_iter(this.paths);
        var p;
        while (1) {
          var __ival_p=__iter_p.next();
          if (__ival_p.done) {
              break;
          }
          p = __ival_p.value;
          recurse(p, DataFlags.NO_CACHE);
        }
    }
    if (val&DataFlags.RECALC_CACHE) {
        var __iter_p=__get_iter(this.paths);
        var p;
        while (1) {
          var __ival_p=__iter_p.next();
          if (__ival_p.done) {
              break;
          }
          p = __ival_p.value;
          recurse(p, DataFlags.RECALC_CACHE);
        }
    }
  }), function add(p) {
    if (this._flag&DataFlags.NO_CACHE)
      p._flag|=DataFlags.NO_CACHE;
    this.pathmap[p.name] = p;
    this.paths.push(p);
    p.parent = this;
  }, function replace(p, p2) {
    var __iter_p2_0=__get_iter(this.paths);
    var p2_0;
    while (1) {
      var __ival_p2_0=__iter_p2_0.next();
      if (__ival_p2_0.done) {
          break;
      }
      p2_0 = __ival_p2_0.value;
      if (p2_0.name==p.name) {
          this.flag|=DataFlags.RECALC_CACHE;
          this.paths.remove(p2_0);
          delete this.pathmap[p2_0.name];
          break;
      }
    }
    this.add(p);
  }]);
  _es6_module.add_class(DataStruct);
  DataStruct = _es6_module.add_export('DataStruct', DataStruct);
  var _TOKEN=0;
  var _WORD=1;
  var _STRLIT=2;
  var _LP="(";
  var _RP=")";
  var _LS="[";
  var _RS="]";
  var _CM=",";
  var _EQ="=";
  var _DT=".";
  var TinyParser=_ESClass("TinyParser", [function TinyParser(data) {
    var tpl=TinyParser.ctemplates;
    this.toks = objcache.fetch(tpl.toks);
    this.toks.length = 0;
    this.split_chars = TinyParser.split_chars;
    this.ws = TinyParser.ws;
    this.data = data;
    this.cur = 0;
  }, function reset(data) {
    this.cur = 0;
    this.toks.length = 0;
    this.data = data;
    if (data!=undefined&&data!="")
      this.lex();
  }, function gen_tok(a, b) {
    var ret=objcache.fetch(TinyParser.ctemplates.token);
    ret[0] = a;
    ret[1] = b;
    ret.length = 2;
    return ret;
  }, function lex(data) {
    var gt=this.gen_tok;
    if (data==undefined)
      data = this.data;
    var toks=this.toks;
    var tok=undefined;
    var in_str=false;
    var lastc=0;
    var i=0;
    while (i<data.length) {
      var c=data[i];
      if (c=="'"&&lastc!="\\") {
          in_str^=1;
          if (in_str) {
              tok = gt("", _STRLIT);
              toks.push(tok);
          }
          else {
            tok = undefined;
          }
      }
      else 
        if (in_str) {
          tok[0]+=c;
      }
      else 
        if (this.ws.has(c)) {
          if (tok!=undefined&&tok[1]==_WORD) {
              tok = undefined;
          }
      }
      else 
        if (this.split_chars.has(c)) {
          toks.push(gt(c, _TOKEN));
          tok = undefined;
      }
      else {
        if (tok==undefined) {
            tok = gt("", _WORD);
            toks.push(tok);
        }
        tok[0]+=c;
      }
      lastc = c;
      i+=1;
    }
  }, function next() {
    this.cur++;
    if (this.cur-1<this.toks.length) {
        return this.toks[this.cur-1];
    }
    return undefined;
  }, function peek() {
    if (this.cur<this.toks.length) {
        return this.toks[this.cur];
    }
    return undefined;
  }, function expect(type, val) {
    if (this.peek()[1]!=type) {
        console.trace("Unexpected token "+this.peek[0]+", expected "+(type==_WORD ? "WORD" : val));
        throw new TinyParserError();
    }
    if (type==_TOKEN&&this.peek()[0]!=val) {
        console.trace("Unexpected token "+this.peek[0]);
        throw new TinyParserError();
    }
    return this.next()[0];
  }]);
  _es6_module.add_class(TinyParser);
  
  var AnimKey=es6_import_item(_es6_module, 'animdata', 'AnimKey');
  var AnimChannel=es6_import_item(_es6_module, 'animdata', 'AnimChannel');
  var AnimKeyFlags=es6_import_item(_es6_module, 'animdata', 'AnimKeyFlags');
  var AnimInterpModes=es6_import_item(_es6_module, 'animdata', 'AnimInterpModes');
  TinyParser.ctemplates = {toks: {obj: Array(64), init: function(val) {
    val.length = 0;
  }}, token: {obj: ["", ""], cachesize: 512}}
  TinyParser.split_chars = new set([",", "=", "(", ")", ".", "$", "[", "]"]);
  TinyParser.ws = new set([" ", "\n", "\t", "\r"]);
  var $cache_wQy5_resolve_path_intern;
  var $sret_uULw_resolve_path_intern2;
  var $retcpy_60yN_set_prop;
  var $scope_mmZT_set_prop;
  var DataAPI=_ESClass("DataAPI", [function DataAPI(appstate) {
    this.appstate = appstate;
    this.ops = data_ops_list;
    this.parser = new TinyParser();
    this.parser2 = apiparser();
    this.root_struct = ContextStruct;
    this.cache = {}
    this.evalcache = {}
    this.evalcache2 = {}
    this.op_keyhandler_cache = {}
  }, function parse_call_line_intern(ctx, line) {
    var p=this.parser;
    function parse_argval(p) {
      var val;
      if (p.peek()[1]==_STRLIT) {
          val = p.next()[0];
      }
      else {
        val = p.expect(_WORD);
      }
      var args;
      if (p.peek()[0]==_LP) {
          args = parse_call(p);
      }
      return [val, args];
    }
    function parse_arg(p) {
      var arg=p.expect(_WORD);
      var val=undefined;
      if (p.peek()[0]==_EQ) {
          p.next();
          val = parse_argval(p);
      }
      return [arg, val];
    }
    function parse_call(p) {
      p.expect(_TOKEN, _LP);
      var args=[];
      var t=undefined;
      while (p.peek()!=undefined) {
        if (p.peek()[1]==_WORD) {
            args.push(parse_arg(p));
        }
        else 
          if (p.peek()[0]==_CM) {
            p.next();
        }
        else {
          p.expect(_TOKEN, _RP);
          break;
        }
      }
      return args;
    }
    if (line.contains(_LP)==0)
      throw new TinyParserError();
    var li=line.search(/\(/);
    path = line.slice(0, li);
    line = line.slice(li, line.length);
    p.reset(line);
    var call=parse_call(p);
    path = path.trimRight().trimLeft();
    var ret=objcache.array(2);
    ret[0] = path;
    ret[1] = call;
    return ret;
  }, function parse_call_line(ctx, line) {
    if (line==undefined) {
        line = ctx;
        ctx = new Context();
    }
    try {
      var ret=this.parse_call_line_intern(ctx, line);
      return ret;
    }
    catch (error) {
        if (!(__instance_of(error, TinyParserError))) {
            throw error;
        }
        else {
          console.log("Could not parse tool call line "+line+"!");
        }
    }
  }, function do_selectmode(ctx, args) {
    return ctx.view2d.selectmode;
  }, function do_datapath(ctx, args) {
    if (args==undefined||args.length==0||args[0].length!=1) {
        console.log("Invalid arguments to do_datapath()");
        throw TinyParserError();
    }
    return args[0];
  }, function do_active_vertex(ctx, args) {
    var spline=ctx.spline;
    var v=spline.verts.active;
    return v==undefined ? -1 : v.eid;
  }, function do_mesh_selected(ctx, args) {
    if (args==undefined||args.length==0||args[0].length!=2) {
        console.log("Invalid arguments to do_mesh_selected()");
        throw TinyParserError();
    }
    var val=args[0][0];
    var typemask=0;
    for (var i=0; i<val.length; i++) {
        c = val[i].toLowerCase();
        if (c=="v") {
            typemask|=MeshTypes.VERT;
        }
        else 
          if (c=="e") {
            typemask|=MeshTypes.EDGE;
        }
        else 
          if (c=="f") {
            typemask|=MeshTypes.FACE;
        }
        else {
          console.log("Invalid arguments to do_mesh_select(): "+c);
          throw TinyParserError();
        }
    }
    var mesh=ctx.mesh;
    if (mesh==undefined) {
        console.trace();
        console.log("Mesh operation called with bad context");
        console.log("Creating dummy mesh. . .");
        console.log(ctx);
        mesh = new Mesh();
    }
    return new MSelectIter(typemask, mesh);
  }, function prepare_args(ctx, call) {
    var args={}
    for (var i=0; i<call.length; i++) {
        var a=call[i];
        if (a[1]!=undefined) {
            if ("do_"+a[1][0] in this) {
                args[a[0]] = this["do_"+a[1][0]](ctx, a[1][1], a[1], a);
            }
            else 
              if (typeof a[1][0]=="string") {
                args[a[0]] = a[1][0];
            }
            else 
              if (typeof a[1][0]=="number"||parseFloat(a[1][0])!=NaN) {
                args[a[0]] = parseFloat(a[1][0]);
            }
            else {
              console.log("Invalid initializer"+a[1][1], a[1], a);
            }
        }
        else {
          console.log("Error: No parameter for undefined argument "+a[0]);
          throw TinyParserError();
        }
    }
    return args;
  }, function get_op_intern(ctx, str) {
    var ret=this.parse_call_line(ctx, str);
    if (ret==undefined)
      return ;
    var call=ret[1];
    var path=ret[0];
    if (!(path in this.ops)) {
        console.log("Invalid api call "+str+"!");
        return ;
    }
    var args=this.prepare_args(ctx, call);
    var op=this.ops[path](ctx, args);
    return op;
  }, function get_op_keyhandler(ctx, str) {
    var hash=str;
    if (ctx.screen.active.type!=undefined)
      hash+=ctx.screen.active.type;
    if (hash in this.op_keyhandler_cache) {
        return this.op_keyhandler_cache[hash];
    }
    function find_hotkey_recurse(element) {
      if (element==undefined)
        return undefined;
      var maps=element.get_keymaps();
      for (var i=0; i<maps.length; i++) {
          var km=maps[i];
          var handler=km.get_tool_handler(str);
          if (handler!=undefined)
            return handler;
      }
      if (__instance_of(element, UIFrame)&&element.active!=undefined) {
          return find_hotkey_recurse(element.active);
      }
    }
    this.op_keyhandler_cache[hash] = find_hotkey_recurse(ctx.screen);
    return this.op_keyhandler_cache[hash];
  }, function call_op(ctx, str) {
    if (RELEASE)
      return this.call_op_release(ctx, str);
    else 
      return this.call_op_debug(ctx, str);
  }, function call_op_debug(ctx, str) {
    console.log("calling op", str);
    var op=this.get_op_intern(ctx, str);
    if (op==undefined) {
        throw new Error("Unknown tool '"+str+"'!");
    }
    if (op.flag&ToolFlags.USE_DEFAULT_INPUT) {
        this.appstate.toolstack.default_inputs(ctx, op);
    }
    this.appstate.toolstack.exec_tool(op);
  }, function call_op_release(ctx, str) {
    try {
      var op=this.get_op_intern(ctx, str);
      if (op.flag&ToolFlags.USE_DEFAULT_INPUT) {
          this.appstate.toolstack.default_inputs(ctx, op);
      }
      this.appstate.toolstack.exec_tool(op);
    }
    catch (error) {
        console.log("Error calling "+str);
        console.trace();
    }
  }, function get_op_uiname(ctx, str) {
    if (str==undefined) {
        str = ctx;
        ctx = new Context();
    }
    try {
      var op=this.get_op_intern(ctx, str);
      return op.uiname;
    }
    catch (error) {
        if (!(__instance_of(error, TinyParserError))) {
            throw error;
        }
        else {
          console.log("Error calling "+str);
          console.trace();
        }
    }
  }, function get_op(ctx, str) {
    if (str==undefined) {
        str = ctx;
        ctx = new Context();
    }
    try {
      var op=this.get_op_intern(ctx, str);
      return op;
    }
    catch (error) {
        if ((__instance_of(error, TinyParserError))) {
            throw error;
        }
        else {
          console.log("Error calling "+str);
          console.trace();
        }
    }
  }, function copy_path(path) {
    var ret=[];
    ret.push(path[0]);
    for (var i=1; i<path.length; i++) {
        ret.push(copy_object_deep(path[i]));
    }
    return ret;
  }, function _build_path(dp) {
    var s="";
    while (dp!=undefined) {
      if (__instance_of(dp, DataPath))
        s = dp.path+"."+s;
      dp = dp.parent;
    }
    s = s.slice(0, s.length-1);
    return s;
  }, function on_frame_change(ctx, time) {
    for (var id in ctx.datalib.idmap) {
        var block=ctx.datalib.idmap[id];
        var __iter_ch=__get_iter(block.lib_anim_channels);
        var ch;
        while (1) {
          var __ival_ch=__iter_ch.next();
          if (__ival_ch.done) {
              break;
          }
          ch = __ival_ch.value;
          this.set_prop(ctx, ch.path, ch.evaluate(time));
        }
    }
  }, function key_animpath(ctx, owner, path, time) {
    if (ctx==undefined) {
        time = path;
        path = ctx;
        ctx = new Context();
    }
    path = path.trim();
    var ret=this.resolve_path_intern(ctx, path);
    if (ret==undefined||ret[0]==undefined) {
        console.log("Error, cannot set keyframe for path", path, "!");
        return ;
    }
    var prop=ret[0];
    if (!(path in owner.lib_anim_pathmap)) {
        var name=path.split(".");
        name = name[name.length-1];
        var ch=new AnimChannel(prop.type, name, path);
        ch.idgen = owner.lib_anim_idgen;
        ch.idmap = owner.lib_anim_idmap;
        ch.owner = owner;
        owner.lib_anim_pathmap[path] = ch;
        owner.lib_anim_channels.push(ch);
    }
    var ch=owner.lib_anim_pathmap[path];
    var val=this.get_prop(ctx, path);
    ch.update(time, val);
  }, function resolve_path_intern(ctx, str) {
    if (str==undefined) {
        str = ctx;
        ctx = new Context();
    }
    if (str==undefined) {
        warntrace("Warning, undefined path in resolve_path_intern (forgot to pass ctx?)");
        return undefined;
    }
    try {
      if (!(str in $cache_wQy5_resolve_path_intern)) {
          var ret=this.resolve_path_intern2(ctx, str);
          var ret2=[];
          for (var i=0; i<ret.length; i++) {
              ret2.push(ret[i]);
          }
          $cache_wQy5_resolve_path_intern[str] = ret2;
      }
      else {
        var ret=$cache_wQy5_resolve_path_intern[str];
        if (ret[0]!=undefined&&!ret[0].cache_good()) {
            delete $cache_wQy5_resolve_path_intern[str];
            return this.resolve_path_intern(ctx, str);
        }
      }
      return ret;
    }
    catch (_err) {
        print_stack(_err);
        console.log("error: ", str);
    }
    return undefined;
  }, function resolve_path_intern2(ctx, str) {
    var parser=this.parser2;
    var arr_index=undefined;
    var build_path=this._build_path;
    var pathout=[""];
    var spathout=["ContextStruct"];
    var ownerpathout=[""];
    var mass_set=undefined;
    var this2=this;
    function do_eval(node, scope, pathout, spathout) {
      if (node.type=="ID") {
          if (scope==undefined) {
              console.log("data api error: ", str+", "+pathout[0]+", "+spathout[0]);
          }
          if (scope.pathmap==undefined||!(node.val in scope.pathmap))
            return undefined;
          var ret=scope.pathmap[node.val];
          if (ret==undefined)
            return undefined;
          if (ret.use_path) {
              ownerpathout[0] = pathout[0];
              if (ret.path!=""&&ret.path[0]!="["&&ret.path[0]!="(")
                pathout[0] = pathout[0]+"."+ret.path;
              else 
                pathout[0]+=ret.path;
          }
          spathout[0] = spathout[0]+".pathmap."+node.val;
          return ret;
      }
      else 
        if (node.type=="CODE") {
          mass_set = {filter: node.children[1].value, path: str.slice(0, node.children[1].lexstart), subpath: str.slice(node.children[1].lexend, str.length).trim(), do_mass_set: true};
          if (mass_set.subpath[0]==".")
            mass_set.subpath = mass_set.subpath.slice(1, mass_set.subpath.length);
          return mass_set;
      }
      else 
        if (node.type==".") {
          var n2=do_eval(node.children[0], scope, pathout, spathout);
          if (n2!=undefined) {
              if (__instance_of(n2, DataPath))
                n2 = n2.data;
              return do_eval(node.children[1], n2, pathout, spathout);
          }
      }
      else 
        if (node.type=="ARRAY") {
          var array=do_eval(node.children[0], scope, pathout, spathout);
          var index=do_eval(node.children[1], scope, pathout, spathout);
          if (array==undefined)
            return undefined;
          if (index==undefined)
            index = node.children[1].val;
          arr_index = index;
          var is_flag=false;
          if (array.type==DataPathTypes.PROP&&array.data.type==PropTypes.FLAG) {
              index = array.data.keys[index];
              spathout[0]+=".data.data & "+index;
              is_flag = true;
          }
          else 
            if (array.type==DataPathTypes.PROP) {
              spathout[0]+=".data.data["+index+"]";
          }
          if (!array.use_path) {
              return array;
          }
          else {
            if (!is_flag) {
                ownerpathout[0] = pathout[0];
            }
            var path=pathout[0];
            path = path.slice(1, path.length);
            if (array.type==DataPathTypes.PROP&&array.data.type==PropTypes.FLAG) {
                pathout[0]+="&"+index;
            }
            else 
              if (array.type==DataPathTypes.STRUCT_ARRAY) {
                pathout[0]+=array.data.getitempath(index);
            }
            else {
              pathout[0]+="["+index+"]";
            }
            if (array.type==DataPathTypes.STRUCT_ARRAY) {
                var arr=this2.evaluate(ctx, path, undefined);
                var stt=array.data.getter(arr[index]);
                stt.parent = array;
                spathout[0]+=".getter("+path+"["+index+"]"+")";
                return stt;
            }
            else {
              return array;
            }
          }
      }
      else 
        if (node.type=="NUM") {
          return node.val;
      }
    }
    var ast=parser.parse(str);
    $sret_uULw_resolve_path_intern2[0] = do_eval(ast, ContextStruct, pathout, spathout);
    pathout[0] = pathout[0].slice(1, pathout[0].length);
    $sret_uULw_resolve_path_intern2[1] = pathout[0];
    $sret_uULw_resolve_path_intern2[2] = spathout[0];
    $sret_uULw_resolve_path_intern2[3] = mass_set;
    $sret_uULw_resolve_path_intern2[4] = ownerpathout[0].slice(1, ownerpathout[0].length);
    return $sret_uULw_resolve_path_intern2;
  }, function evaluate(ctx, str, scope) {
    try {
      if (str in this.evalcache) {
          return this.evalcache[str](ctx, scope);
      }
      var func;
      if (config.HAVE_EVAL) {
          var script="\n          var func = function(ctx, scope) {\n            return $s\n          }\n        ".replace("$s", str);
          eval(script);
      }
      else {
        var ast=safe_eval.compile(str);
        var _scope={ctx: undefined, scope: undefined, ContextStruct: ContextStruct, g_theme: g_theme};
        func = function(ctx, scope) {
          _scope.scope = scope;
          _scope.ctx = ctx;
          _scope.g_theme = window.g_theme;
          return safe_eval.exec(ast, _scope);
        };
      }
      this.evalcache[str] = func;
      return func(ctx, scope);
    }
    catch (error) {
        if (window.DEBUG!=undefined&&window.DEBUG.ui_datapaths)
          print_stack(error);
        throw new DataAPIError(error.message);
    }
  }, function get_object(ctx, str) {
    if (str==undefined) {
        str = ctx;
        ctx = new Context();
    }
    var ret=this.resolve_path_intern(ctx, str);
    if (ret==undefined||ret[0]==undefined||ret[0].type==DataPathTypes.PROP) {
        console.trace("Not a direct object reference", str);
        return undefined;
    }
    else {
      var path=ret[1];
      var val=this.evaluate(ctx, path);
      return val;
    }
  }, function get_prop(ctx, str) {
    try {
      return this.get_prop_intern(ctx, str);
    }
    catch (error) {
        if (!(__instance_of(error, DataAPIError))) {
            print_stack(error);
            console.log("Data API error! path:", str);
        }
        if (DEBUG.ui_datapaths) {
            print_stack(error);
        }
        throw error;
    }
  }, function get_prop_intern(ctx, str) {
    if (str==undefined) {
        str = ctx;
        ctx = new Context();
    }
    var ret=this.resolve_path_intern(ctx, str);
    if (ret==undefined)
      return ret;
    var val=ret[0];
    if (ret[0].type==DataPathTypes.PROP) {
        if (ret[0].use_path) {
            var path=ret[1];
            val = this.evaluate(ctx, path);
        }
        else {
          val = this.evaluate(ctx, ret[2]);
          if (__instance_of(val, DataPath))
            val = val.data;
          if (__instance_of(val, ToolProperty))
            val = val.data;
        }
        var prop=ret[0].data;
        if (prop.type==PropTypes.ENUM&&(val in prop.keys))
          val = prop.keys[val];
    }
    else {
      var path=ret[1];
      val = this.evaluate(ctx, path);
      return val;
    }
    return val;
  }, function build_mass_set_paths(ctx, listpath, subpath, value, filterstr) {
    if (ctx==undefined) {
        filterstr = value;
        value = subpath;
        subpath = listpath;
        listpath = ctx;
        ctx = new Context();
    }
    var filter;
    if (config.HAVE_EVAL) {
        var filtercode="\n        function filter($) {\n\n          return "+filterstr+"\n;\n        }";
        eval(filtercode);
    }
    else {
      var ast=safe_eval.compile(filterstr);
      var scope={ctx: ctx, $: undefined};
      function filter($) {
        scope.$ = $;
        return safe_eval.exec(ast, scope);
      }
    }
    var list=this.get_object(listpath);
    var ret=this.resolve_path_intern(ctx, listpath);
    var sta=ret[0].data;
    var ret=[];
    var __iter_key=__get_iter(sta.getkeyiter.call(list, ctx));
    var key;
    while (1) {
      var __ival_key=__iter_key.next();
      if (__ival_key.done) {
          break;
      }
      key = __ival_key.value;
      var item=sta.getitem.call(list, key);
      if (!filter(item))
        continue;
      var path=(listpath+"["+key+"]"+"."+subpath).trim();
      ret.push(path);
    }
    return ret;
  }, function mass_set_prop(ctx, listpath, subpath, value, filterstr) {
    if (ctx==undefined) {
        filterstr = value;
        value = subpath;
        subpath = listpath;
        listpath = ctx;
        ctx = new Context();
    }
    var paths=this.build_mass_set_paths(ctx, listpath, subpath, value, filterstr);
    for (var i=0; i<paths.length; i++) {
        this.set_prop(ctx, paths[i], value);
    }
  }, function set_prop(ctx, str, value) {
    var ret=this.resolve_path_intern(ctx, str);
    if (ret==undefined) {
        if (DEBUG.ui_datapaths) {
            console.log("Failed to resolve path:", str, "with context", ctx);
        }
        return ret;
    }
    $retcpy_60yN_set_prop.length = ret.length;
    for (var i=0; i<5; i++) {
        $retcpy_60yN_set_prop[i] = ret[i];
    }
    ret = $retcpy_60yN_set_prop;
    var owner=this.evaluate(ctx, ret[4]);
    if (ret[0]==undefined&&ret[3]!=undefined&&ret[3].do_mass_set) {
        if (DEBUG.ui_datapaths) {
            console.log("Mass set prop", str, value);
        }
        this.mass_set_prop(ctx, ret[3].path, ret[3].subpath, value, ret[3].filter);
        return ;
    }
    else 
      if (ret[0]==undefined) {
        console.trace("Error! Unknown path", str, "!");
        return ;
    }
    if (DEBUG.ui_datapaths&&ret[0]==undefined) {
        console.log("error setting", str, "to", value, "ret[0] was undefined", ret.slice(0, ret.length));
    }
    if (DEBUG.ui_datapaths) {
        console.log("set", str, "to", value, "type", ret[0].type, "use_path", ret[0].use_path, "rdata", ret.slice(0, ret.length));
    }
    if (ret[0].type!=DataPathTypes.PROP) {
        console.trace("Error: non-property in set_prop()", str, ret.slice(0, ret.length));
        return ;
    }
    var old_value=this.get_prop(ctx, str);
    var changed=true;
    if (ret[0].type==DataPathTypes.PROP) {
        if (DEBUG.ui_datapaths) {
            console.log("prop set; use_path: ", ret[0].use_path, "type", ret[0].type, ret[0].data);
        }
        var path;
        if (ret[0].use_path) {
            path = ret[1];
        }
        else {
          path = ret[2];
        }
        var prop=ret[0].data;
        prop.ctx = ctx;
        if (prop.type==PropTypes.FLAG) {
            if (path.contains("&")) {
                var mask=Number.parseInt(path.slice(path.search("&")+1, path.length).trim());
                var path2=path.slice(0, path.search("&"));
                var val=this.evaluate(ctx, path2);
                changed = !!(val&mask)!=!!(old_value&mask);
                if (value)
                  val|=mask;
                else 
                  val&=~mask;
                prop.set_data(val, owner, changed);
                $scope_mmZT_set_prop[0] = val;
                path2+=" = scope[0];";
                this.evaluate(ctx, path2, $scope_mmZT_set_prop);
            }
            else {
              path+=" = "+value;
              this.evaluate(ctx, path);
              changed = value!=old_value;
              prop.set_data(value, owner, changed);
            }
        }
        else {
          if (prop.type==PropTypes.DATAREF) {
              console.trace("IMPLEMENT ME!");
          }
          else 
            if (prop.type==PropTypes.ENUM) {
              value = prop.values[value];
              if (__instance_of(value, String)||typeof value=="string") {
                  value = '"'+value+'"';
              }
          }
          else 
            if (prop.type==PropTypes.STRING) {
              value = '"'+value+'"';
          }
          var valpath=path;
          if (path.endsWith("]")) {
              var i=path.length-1;
              while (i>=0&&path[i]!="[") {
                i--              }
              valpath = path.slice(0, i);
          }
          else 
            if (!ret[0].use_path) {
              valpath+=".data.data";
              path+=".data.data";
          }
          var oval=this.evaluate(ctx, path);
          if (typeof value!="number"&&(prop.type==PropTypes.VEC2||prop.type==PropTypes.VEC3||prop.type==PropTypes.VEC4)) {
              var arr=this.evaluate(ctx, path);
              changed = false;
              for (var i=0; i<arr.length; i++) {
                  changed = changed||arr[i]!=value[i];
                  arr[i] = value[i];
              }
          }
          else {
            if (typeof value=="object") {
                $scope_mmZT_set_prop[0] = value;
                path+=" = scope[0]";
                this.evaluate(ctx, path, $scope_mmZT_set_prop);
            }
            else {
              changed = value==old_value;
              path+=" = "+value;
              this.evaluate(ctx, path);
            }
          }
          changed = value==old_value;
          if (DEBUG.ui_datapaths) {
              console.log("prop set:", valpath, value);
          }
          value = this.evaluate(ctx, valpath);
          prop.set_data(value, owner, changed);
        }
        ret[0].ctx = ctx;
        if (ret[0].update!=undefined)
          ret[0].update.call(ret[0], owner, old_value, changed);
    }
  }, function get_struct(ctx, str) {
    if (str==undefined) {
        str = ctx;
        ctx = new Context();
    }
    var ret=this.resolve_path_intern(ctx, str);
    if (ret==undefined||ret[0]==undefined)
      return undefined;
    if (__instance_of(ret[0], DataPath)) {
        return ret[0].data;
    }
    return ret[0];
  }, function get_prop_meta(ctx, str) {
    if (str==undefined) {
        str = ctx;
        ctx = new Context();
    }
    var ret=this.resolve_path_intern(ctx, str);
    if (ret==undefined||ret[0]==undefined)
      return undefined;
    return ret[0].data;
  }]);
  var $cache_wQy5_resolve_path_intern={}
  var $sret_uULw_resolve_path_intern2=[0, 0, 0, 0, 0];
  var $retcpy_60yN_set_prop=new Array(16);
  var $scope_mmZT_set_prop=[0, 0];
  _es6_module.add_class(DataAPI);
  DataAPI = _es6_module.add_export('DataAPI', DataAPI);
}, '/dev/cleanfairmotion/src/core/data_api.js');
es6_module_define('data_api_parser', ["parseutil"], function _data_api_parser_module(_es6_module) {
  "use strict";
  var PUTL=es6_import(_es6_module, 'parseutil');
  function apiparser() {
    function tk(name, re, func) {
      return new PUTL.tokdef(name, re, func);
    }
    var tokens=[tk("ID", /[a-zA-Z_]+[a-zA-Z$0-9_]*/), tk("EQUALS", /=/), tk("COLON", /:/), tk("LSBRACKET", /\[/), tk("RSBRACKET", /\]/), tk("LPARAM", /\(/), tk("RPARAM", /\)/), tk("CODE", /\{.*\}/, function(t) {
      t.value = t.value.slice(1, t.value.length-1).trim();
      return t;
    }), tk("COMMA", /,/), tk("DOT", /\./), tk("NUM", /[0-9]+/), tk("SEMI", /;/), tk("NEWLINE", /\n/, function(t) {
      t.lexer.lineno+=1;
    }), tk("SPACE", / |\t/, function(t) {
    })];
    function errfunc(lexer) {
      return true;
    }
    var lex=new PUTL.lexer(tokens, errfunc);
    var parser=new PUTL.parser(lex);
    function numnode(token, n) {
      return {type: "NUM", val: n, children: [], lexstart: token.lexpos, lexend: token.lexpos+token.lexlen}
    }
    function valnode(token, id) {
      return {type: "ID", val: id, children: [], lexstart: token.lexpos, lexend: token.lexpos+token.lexlen}
    }
    function varnode(token, id, val) {
      if (val==undefined) {
          val = undefined;
      }
      var cs=val!=undefined ? [val] : [];
      return {type: "VAR", val: id, children: cs, lexstart: token.lexpos, lexend: token.lexpos+token.lexlen}
    }
    function bnode(token, l, r, op) {
      return {type: op, children: [l, r], lexstart: token.lexpos, lexend: token.lexpos+token.lexlen}
    }
    function funcnode(token, name_expr, args) {
      var cs=[name_expr];
      for (var i=0; i<args.length; i++) {
          cs.push(args[i]);
      }
      return {type: "FUNC", children: cs, lexstart: token.lexpos, lexend: token.lexpos+token.lexlen}
    }
    function arrnode(token, name_expr, ref) {
      return {type: "ARRAY", children: [name_expr, ref], lexstart: token.lexpos, lexend: token.lexpos+token.lexlen}
    }
    function p_FuncCall(p, name_expr) {
      var args=[];
      var lexstart1=p.lexer.lexpos;
      p.expect("LPARAM");
      while (!p.at_end()) {
        var t=p.peeknext();
        if (t==undefined) {
            p.error(t, "func");
        }
        if (t.type=="RPARAM") {
            p.next();
            break;
        }
        var lexstart=p.lexer.lexpos;
        var arg=p.expect("ID");
        var val=undefined;
        if (p.peeknext().type=="EQUALS") {
            p.next();
            var val=p_Expr(p, ",)");
        }
        var lexend=p.lexer.lexpos;
        args.push({lexpos: lexstart, lexlen: lexstart-lexend}, varnode(arg, val));
        var t=p.next();
        if (t.type=="RPARAM") {
            break;
        }
        else 
          if (t.type!="COMMA") {
            p.error(t, "invalid token in function call");
        }
      }
      var lexlen=p.lexer.lexpos-lexstart1;
      var ret=funcnode({lexpos: lexstart, lexlen: lexlen}, name_expr, args);
      return ret;
    }
    function p_Expr(p, end_chars) {
      if (end_chars==undefined) {
          end_chars = "";
      }
      var lexstart=p.lexer.lexpos;
      var t=p.peeknext();
      var ast;
      if (t.type=="ID")
        ast = valnode(t, p.expect("ID"));
      else 
        if (t.type=="NUM")
        ast = numnode(t, p.expect("NUM"));
      else 
        p.error("Invalid token "+t.type+"'"+t.value+"'");
      while (!p.at_end()) {
        var t=p.peeknext();
        if (t.type=="DOT") {
            p.next();
            var t2=p.peeknext();
            var id=p.expect("ID", "expected id after '.'");
            ast = bnode({lexpos: lexstart, lexlen: t.lexpos+t.lexlen}, ast, valnode(t2, id), ".");
        }
        else 
          if (t.type=="LPARAM") {
            ast = p_FuncCall(p, ast);
        }
        else 
          if (t.type=="LSBRACKET") {
            p.expect("LSBRACKET");
            var val=p_Expr(p, "]");
            p.expect("RSBRACKET");
            ast = arrnode({lexpos: lexstart, lexlen: t.lexpos+t.lexlen}, ast, val);
        }
        else 
          if (t.type=="CODE") {
            p.next();
            var n2={type: "STRING", lexstart: t.lexpos, lexend: t.lexpos+t.lexlen, value: t.value};
            ast = bnode({lexpos: lexstart, lexlen: t.lexpos+t.lexlen}, ast, n2, "CODE");
        }
        else 
          if (end_chars.contains(t.value)) {
            return ast;
        }
        else {
          p.error(t, "Invalid token "+t.type+"'"+t.value+"'");
        }
      }
      return ast;
    }
    parser.start = p_Expr;
    return parser;
  }
  apiparser = _es6_module.add_export('apiparser', apiparser);
  function fmt_ast(ast, tlevel) {
    if (tlevel==undefined) {
        tlevel = 0;
    }
    var s="";
    var t="";
    for (var i=0; i<tlevel; i++) {
t+=" "
    }
    s+=t+ast["type"];
    if (ast["type"]=="ID"||ast["type"]=="VAR"||ast["type"]=="NUM")
      s+=" "+ast["val"];
    s+=" {\n";
    var cs=ast["children"];
    if (cs==undefined)
      cs = [];
    for (var i=0; i<cs.length; i++) {
        s+=fmt_ast(cs[i], tlevel+1);
    }
    s+=t+"}\n";
    return s;
  }
  function test_dapi_parser() {
    var p=apiparser();
    var tst="operator_stack[0].name";
    var tree=p.parse(tst);
    console.log(fmt_ast(tree));
    console.log(g_app_state.api.get_prop_new(new Context(), tst));
    g_app_state.api.set_prop_new(new Context(), "view2d.zoomfac", 0.5);
  }
}, '/dev/cleanfairmotion/src/core/data_api_parser.js');
es6_module_define('struct', ["ajax", "config", "safe_eval", "parseutil"], function _struct_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, 'config');
  var safe_eval=es6_import(_es6_module, 'safe_eval');
  var $_mh;
  var $_swapt;
  var pack_byte=es6_import_item(_es6_module, 'ajax', 'pack_byte');
  var pack_short=es6_import_item(_es6_module, 'ajax', 'pack_short');
  var pack_int=es6_import_item(_es6_module, 'ajax', 'pack_int');
  var pack_float=es6_import_item(_es6_module, 'ajax', 'pack_float');
  var pack_double=es6_import_item(_es6_module, 'ajax', 'pack_double');
  var pack_vec2=es6_import_item(_es6_module, 'ajax', 'pack_vec2');
  var pack_vec3=es6_import_item(_es6_module, 'ajax', 'pack_vec3');
  var pack_vec4=es6_import_item(_es6_module, 'ajax', 'pack_vec4');
  var pack_mat4=es6_import_item(_es6_module, 'ajax', 'pack_mat4');
  var pack_quat=es6_import_item(_es6_module, 'ajax', 'pack_quat');
  var pack_dataref=es6_import_item(_es6_module, 'ajax', 'pack_dataref');
  var pack_string=es6_import_item(_es6_module, 'ajax', 'pack_string');
  var pack_static_string=es6_import_item(_es6_module, 'ajax', 'pack_static_string');
  var unpack_byte=es6_import_item(_es6_module, 'ajax', 'unpack_byte');
  var unpack_short=es6_import_item(_es6_module, 'ajax', 'unpack_short');
  var unpack_int=es6_import_item(_es6_module, 'ajax', 'unpack_int');
  var unpack_float=es6_import_item(_es6_module, 'ajax', 'unpack_float');
  var unpack_double=es6_import_item(_es6_module, 'ajax', 'unpack_double');
  var unpack_vec2=es6_import_item(_es6_module, 'ajax', 'unpack_vec2');
  var unpack_vec3=es6_import_item(_es6_module, 'ajax', 'unpack_vec3');
  var unpack_vec4=es6_import_item(_es6_module, 'ajax', 'unpack_vec4');
  var unpack_mat4=es6_import_item(_es6_module, 'ajax', 'unpack_mat4');
  var unpack_quat=es6_import_item(_es6_module, 'ajax', 'unpack_quat');
  var unpack_dataref=es6_import_item(_es6_module, 'ajax', 'unpack_dataref');
  var unpack_string=es6_import_item(_es6_module, 'ajax', 'unpack_string');
  var unpack_static_string=es6_import_item(_es6_module, 'ajax', 'unpack_static_string');
  var unpack_bytes=es6_import_item(_es6_module, 'ajax', 'unpack_bytes');
  var unpack_ctx=es6_import_item(_es6_module, 'ajax', 'unpack_ctx');
  var PUTL=es6_import(_es6_module, 'parseutil');
  var _static_envcode_null="";
  var _tote=0, _cace=0, _compe=0;
  var SchemaTypes=Object.create({"int": 0, "float": 1, "double": 2, "vec2": 3, "vec3": 4, "vec4": 5, "mat4": 6, "string": 7, "static_string": 8, "struct": 9, "abstract": 10, "array": 11, "iter": 12, "dataref": 13, "byte": 14, "arraybuffer": 15});
  var SchemaTypeMap={}
  for (var k in SchemaTypes) {
      SchemaTypeMap[SchemaTypes[k]] = k;
  }
  function gen_tabstr(t) {
    var s="";
    for (var i=0; i<t; i++) {
        s+="  ";
    }
    return s;
  }
  function SchemaParser() {
    var basic_types=new set(["int", "float", "double", "vec2", "vec3", "vec4", "byte", "mat4", "string", "arraybuffer"]);
    var reserved_tokens=new set(["int", "float", "double", "vec2", "vec3", "vec4", "mat4", "string", "static_string", "array", "iter", "dataref", "byte", "arraybuffer", "abstract"]);
    function tk(name, re, func) {
      return new PUTL.tokdef(name, re, func);
    }
    var tokens=[tk("ID", /[a-zA-Z_]+[a-zA-Z0-9_]*/, function(t) {
      if (reserved_tokens.has(t.value)) {
          t.type = t.value.toUpperCase();
      }
      return t;
    }), tk("OPEN", /\{/), tk("EQUALS", /=/), tk("CLOSE", /}/), tk("COLON", /:/), tk("SOPEN", /\[/), tk("SCLOSE", /\]/), tk("JSCRIPT", /\|/, function(t) {
      var js="";
      var lexer=t.lexer;
      while (lexer.lexpos<lexer.lexdata.length) {
        var c=lexer.lexdata[lexer.lexpos];
        if (c=="\n")
          break;
        js+=c;
        lexer.lexpos++;
      }
      if (js.endsWith(";")) {
          js = js.slice(0, js.length-1);
          lexer.lexpos--;
      }
      t.value = js;
      return t;
    }), tk("LPARAM", /\(/), tk("RPARAM", /\)/), tk("COMMA", /,/), tk("NUM", /[0-9]+/), tk("SEMI", /;/), tk("NEWLINE", /\n/, function(t) {
      t.lexer.lineno+=1;
    }), tk("SPACE", / |\t/, function(t) {
    })];
    var __iter_rt=__get_iter(reserved_tokens);
    var rt;
    while (1) {
      var __ival_rt=__iter_rt.next();
      if (__ival_rt.done) {
          break;
      }
      rt = __ival_rt.value;
      tokens.push(tk(rt.toUpperCase()));
    }
    function errfunc(lexer) {
      return true;
    }
    var lex=new PUTL.lexer(tokens, errfunc);
    var parser=new PUTL.parser(lex);
    function p_Static_String(p) {
      p.expect("STATIC_STRING");
      p.expect("SOPEN");
      var num=p.expect("NUM");
      p.expect("SCLOSE");
      return {type: 8, data: {maxlength: num}}
    }
    function p_DataRef(p) {
      p.expect("DATAREF");
      p.expect("LPARAM");
      var tname=p.expect("ID");
      p.expect("RPARAM");
      return {type: 13, data: tname}
    }
    function p_Array(p) {
      p.expect("ARRAY");
      p.expect("LPARAM");
      var arraytype=p_Type(p);
      var itername="";
      if (p.optional("COMMA")) {
          itername = arraytype.data.replace(/"/g, "");
          arraytype = p_Type(p);
      }
      p.expect("RPARAM");
      return {type: 11, data: {type: arraytype, iname: itername}}
    }
    function p_Iter(p) {
      p.expect("ITER");
      p.expect("LPARAM");
      var arraytype=p_Type(p);
      var itername="";
      if (p.optional("COMMA")) {
          itername = arraytype.data.replace(/"/g, "");
          arraytype = p_Type(p);
      }
      p.expect("RPARAM");
      return {type: 12, data: {type: arraytype, iname: itername}}
    }
    function p_Abstract(p) {
      p.expect("ABSTRACT");
      p.expect("LPARAM");
      var type=p.expect("ID");
      p.expect("RPARAM");
      return {type: 10, data: type}
    }
    function p_Type(p) {
      var tok=p.peek();
      if (tok.type=="ID") {
          p.next();
          return {type: 9, data: tok.value}
      }
      else 
        if (basic_types.has(tok.type.toLowerCase())) {
          p.next();
          return {type: SchemaTypes[tok.type.toLowerCase()]}
      }
      else 
        if (tok.type=="ARRAY") {
          return p_Array(p);
      }
      else 
        if (tok.type=="ITER") {
          return p_Iter(p);
      }
      else 
        if (tok.type=="STATIC_STRING") {
          return p_Static_String(p);
      }
      else 
        if (tok.type=="ABSTRACT") {
          return p_Abstract(p);
      }
      else 
        if (tok.type=="DATAREF") {
          return p_DataRef(p);
      }
      else {
        p.error(tok, "invalid type "+tok.type);
      }
    }
    function p_Field(p) {
      var field={}
      field.name = p.expect("ID", "struct field name");
      p.expect("COLON");
      field.type = p_Type(p);
      field.set = undefined;
      field.get = undefined;
      var tok=p.peek();
      if (tok.type=="JSCRIPT") {
          field.get = tok.value;
          p.next();
      }
      tok = p.peek();
      if (tok.type=="JSCRIPT") {
          field.set = tok.value;
          p.next();
      }
      p.expect("SEMI");
      return field;
    }
    function p_Struct(p) {
      var st={}
      st.name = p.expect("ID", "struct name");
      st.fields = [];
      st.id = -1;
      var tok=p.peek();
      var id=-1;
      if (tok.type=="ID"&&tok.value=="id") {
          p.next();
          p.expect("EQUALS");
          st.id = p.expect("NUM");
      }
      p.expect("OPEN");
      while (1) {
        if (p.at_end()) {
            p.error(undefined);
        }
        else 
          if (p.optional("CLOSE")) {
            break;
        }
        else {
          st.fields.push(p_Field(p));
        }
      }
      return st;
    }
    parser.start = p_Struct;
    return parser;
  }
  var schema_parse=SchemaParser();
  var _do_packdebug=!RELEASE;
  var _packdebug_tlvl=0;
  var profiler=_ESClass("profiler", [function profiler() {
    this.times = {}
  }, function reset() {
    this.times = {}
  }, function gen_key(name, depth) {
    return name+"_"+(""+depth).replace("-", "_");
  }, function start(name, depth) {
    var key=this.gen_key(name, depth);
    if (!(key in this.times)) {
        this.times[key] = {start: time_ms(), accum: 0.0, calls: 1};
    }
    else {
      this.times[key].start = time_ms();
      this.times[key].calls++;
    }
  }, function end(name, depth) {
    var key=this.gen_key(name, depth);
    if (!(key in this.times))
      return ;
    var obj=this.times[key];
    obj.end = time_ms();
    obj.accum+=obj.end-obj.start;
  }]);
  _es6_module.add_class(profiler);
  var prof=new profiler();
  var profdepth=0;
  var mmin=Math.min, mmax=Math.max;
  function profile_reset() {
    prof.reset();
    profdepth = 0;
  }
  profile_reset = _es6_module.add_export('profile_reset', profile_reset);
  function profile_report() {
    var list=[];
    for (var k in prof.times) {
        var ob=prof.times[k];
        list.push([k, ob.accum, ob.calls]);
    }
    list.sort(function(a, b) {
      return a[1]-b[1];
    });
    for (var i=0; i<list.length; i++) {
        var a=list[i];
        var n=a[1].toFixed(3);
        while (n.length<6) {
          n+=" ";
        }
        console.log(n, a[0], a[2]);
    }
    console.log(prof);
  }
  profile_report = _es6_module.add_export('profile_report', profile_report);
  function profile_start(name) {
    prof.start(name, profdepth);
    profdepth++;
  }
  profile_start = _es6_module.add_export('profile_start', profile_start);
  window.profile_start = profile_start;
  function profile_end(name) {
    profdepth--;
    prof.end(name, profdepth);
  }
  profile_end = _es6_module.add_export('profile_end', profile_end);
  window.profile_end = profile_end;
  if (_do_packdebug) {
      var packer_debug=function(msg) {
        if (!DEBUG.Struct)
          return ;
        if (msg!=undefined) {
            var t=gen_tabstr(_packdebug_tlvl);
            console.log(t+msg);
        }
        else {
          warn("Warning: undefined msg");
        }
      };
      var packer_debug_start=function(funcname) {
        packer_debug("Start "+funcname);
        _packdebug_tlvl++;
      };
      var packer_debug_end=function(funcname) {
        _packdebug_tlvl--;
        packer_debug("Leave "+funcname);
      };
  }
  else {
    var packer_debug=function() {
    };
    var packer_debug_start=function() {
    };
    var packer_debug_end=function() {
    };
  }
  var _static_byte=new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]);
  _static_byte = _es6_module.add_export('_static_byte', _static_byte);
  var _static_view=new DataView(_static_byte.buffer);
  _static_view = _es6_module.add_export('_static_view', _static_view);
  var _ws_env=[[undefined, undefined]];
  var $sval_6izP=[0, 0];
  var $sval_GPhZ=[0, 0, 0];
  var $sval_NaCX=[0, 0, 0, 0];
  var _st_packers=[function(data, val) {
    
    pack_int(data, val);
  }, function(data, val) {
    
    pack_float(data, val);
  }, function(data, val) {
    
    pack_double(data, val);
  }, function(data, val) {
    if (val==undefined)
      val = $sval_6izP;
    
    pack_vec2(data, val);
  }, function(data, val) {
    if (val==undefined)
      val = $sval_GPhZ;
    pack_vec3(data, val);
  }, function(data, val) {
    if (val==undefined)
      val = $sval_NaCX;
    pack_vec4(data, val);
  }, function(data, val) {
    if (val==undefined)
      val = new Matrix4();
    pack_mat4(data, val);
  }, function(data, val) {
    if (val==undefined)
      val = "";
    
    pack_string(data, val);
  }, function(data, val, obj, thestruct, field, type) {
    if (val==undefined)
      val = "";
    
    pack_static_string(data, val, type.data.maxlength);
  }, function(data, val, obj, thestruct, field, type) {
    
    thestruct.write_struct(data, val, thestruct.get_struct(type.data));
    
  }, function(data, val, obj, thestruct, field, type) {
    var cls=thestruct.get_struct_cls(type.data);
    var stt=thestruct.get_struct(type.data);
    if (val==undefined) {
        console.trace(stt, field);
        console.log(field.name, obj);
        throw new Error("Undefined passed to tstruct, for field "+JSON.stringify(field));
    }
    if (type.data=="Object"||(val.constructor.name!=type.data&&(__instance_of(val, cls)))) {
        if (DEBUG.Struct) {
            console.log(val.constructor.name+" inherits from "+cls.name);
        }
        stt = thestruct.get_struct(val.constructor.name);
    }
    else 
      if (val.constructor.name==type.data) {
        stt = thestruct.get_struct(type.data);
    }
    else {
      console.trace();
      console.log(val, val.constructor, val.constructor.STRUCT, val.constructor.fromSTRUCT);
      console.log("|", type, cls, "|");
      console.log(__instance_of(val, ToolProperty));
      console.log(__instance_of(val, cls));
      console.log(cls===ToolProperty);
      console.log(val.constructor.name!=type.data);
      console.log(val.constructor.name, type.data);
      console.log(val.constructor.name!=type.data, (__instance_of(val, cls)));
      console.log(__instance_of(val, cls));
      console.log(val.constructor);
      console.log(IntProperty.__prototypeid__, val.__prototypeid__, val.constructor.__prototypeid__, val.constructor.name);
      console.log(val);
      throw new Error("Bad struct "+val.constructor.name+", "+JSON.stringify(val)+" passed to write_struct");
    }
    if (stt.id==0||stt.id==undefined) {
        console.log("--------------STRUCT ERROR------------------>", stt, val, field, thestruct);
        throw new Error("YEEK!");
    }
    
    
    pack_int(data, stt.id);
    thestruct.write_struct(data, val, stt);
    
  }, function(data, val, obj, thestruct, field, type) {
    
    if (val==undefined) {
        console.trace();
        console.log("Undefined array fed to schema struct packer!");
        console.log("Field: ", field);
        console.log("Type: ", type);
        console.log("");
        
        pack_int(data, 0);
        return ;
    }
    
    pack_int(data, val.length);
    var d=type.data;
    var itername=d.iname;
    var type2=d.type;
    var env=_ws_env;
    for (var i=0; i<val.length; i++) {
        var val2=val[i];
        if (itername!=""&&itername!=undefined&&field.get) {
            env[0][0] = itername;
            env[0][1] = val2;
            val2 = thestruct._env_call(field.get, obj, env);
        }
        var f2={type: type2, get: undefined, set: undefined};
        _st_pack_type(data, val2, obj, thestruct, f2, type2);
    }
    
  }, function(data, val, obj, thestruct, field, type) {
    
    if (val==undefined) {
        console.trace();
        console.log("Undefined iterable list fed to schema struct packer!");
        console.log("Field: ", field);
        console.log("Type: ", type);
        console.log("");
        
        pack_int(data, 0);
        return ;
    }
    if (val[Symbol.iterator]==undefined) {
        val = Object.keys(val);
    }
    var len=0;
    var __iter_val2=__get_iter(val);
    var val2;
    while (1) {
      var __ival_val2=__iter_val2.next();
      if (__ival_val2.done) {
          break;
      }
      val2 = __ival_val2.value;
      len++;
    }
    
    pack_int(data, len);
    var d=type.data;
    var itername=d.iname;
    var type2=d.type;
    var env=_ws_env;
    var i=0;
    var __iter_val2=__get_iter(val);
    var val2;
    while (1) {
      var __ival_val2=__iter_val2.next();
      if (__ival_val2.done) {
          break;
      }
      val2 = __ival_val2.value;
      if (i>=len) {
          console.log("malformed iteration value for serialization", field, val);
          break;
      }
      if (itername!=""&&itername!=undefined&&field.get) {
          env[0][0] = itername;
          env[0][1] = val2;
          val2 = thestruct._env_call(field.get, obj, env);
      }
      var f2={type: type2, get: undefined, set: undefined};
      _st_pack_type(data, val2, obj, thestruct, f2, type2);
      i++;
    }
    
  }, function(data, val) {
    
    
    
    pack_dataref(data, val);
  }, function(data, val) {
    val = mmin(mmax(val, 0), 255);
    
    data.push(val);
  }, function(data, val) {
    
    if (val==undefined) {
        pack_int(data, 0);
    }
    else {
      if (val.buffer!=undefined) {
          val = val.buffer;
      }
      if (val.byteLength==undefined) {
          console.trace("struct error", val, data);
          throw new Error("eek! "+val);
      }
      pack_int(data, val.byteLength);
      var view=new Uint8Array(val);
      var len=val.byteLength;
      for (var i=0; i<len; i++) {
          data.push(view[i]);
      }
    }
  }];
  function _st_pack_type(data, val, obj, thestruct, field, type) {
    
    
    _st_packers[field.type.type](data, val, obj, thestruct, field, type);
    
    
  }
  var STRUCT=_ESClass("STRUCT", [function STRUCT() {
    this.idgen = new EIDGen();
    this.structs = {}
    this.struct_cls = {}
    this.struct_ids = {}
    this.compiled_code = {}
    this.null_natives = {}
    var this2=this;
    function define_null_native(name, cls) {
      var obj={name: name, prototype: Object.create(Object.prototype)}
      obj.constructor = obj;
      obj.STRUCT = name+" {\n  }\n";
      obj.fromSTRUCT = function(reader) {
        var ob={}
        reader(ob);
        return ob;
      }
      var stt=schema_parse.parse(obj.STRUCT);
      stt.id = this2.idgen.gen_id();
      this2.structs[name] = stt;
      this2.struct_cls[name] = cls;
      this2.struct_ids[stt.id] = stt;
      this2.null_natives[name] = 1;
    }
    define_null_native("Object", Object);
  }, function parse_structs(buf) {
    
    var clsmap={}
    for (var i=0; i<defined_classes.length; i++) {
        clsmap[defined_classes[i].name] = defined_classes[i];
    }
    schema_parse.input(buf);
    while (!schema_parse.at_end()) {
      var stt=schema_parse.parse(undefined, false);
      if (!(stt.name in clsmap)) {
          if (!(stt.name in this.null_natives))
            warntrace("WARNING: struct "+stt.name+" no longer exists.  will try to convert.");
          var dummy=Object.create(Object.prototype);
          dummy.prototype = Object.create(Object.prototype);
          dummy.STRUCT = STRUCT.fmt_struct(stt);
          dummy.fromSTRUCT = function(reader) {
            var obj={}
            reader(obj);
            return obj;
          };
          dummy.name = stt.name;
          dummy.prototype.name = dummy.name;
          dummy.prototype.constructor = dummy;
          this.struct_cls[dummy.name] = dummy;
          this.struct_cls[dummy.name] = stt;
          if (stt.id!=-1)
            this.struct_ids[stt.id] = stt;
      }
      else {
        this.struct_cls[stt.name] = clsmap[stt.name];
        this.structs[stt.name] = stt;
        if (stt.id!=-1)
          this.struct_ids[stt.id] = stt;
      }
      var tok=schema_parse.peek();
      while (tok!=undefined&&tok.value=="\n") {
        tok = schema_parse.peek();
      }
    }
  }, function add_struct(cls) {
    var stt=schema_parse.parse(cls.STRUCT);
    if (stt.id==-1)
      stt.id = this.idgen.gen_id();
    this.structs[cls.name] = stt;
    this.struct_cls[cls.name] = cls;
    this.struct_ids[stt.id] = stt;
  }, function get_struct_id(id) {
    return this.struct_ids[id];
  }, function get_struct(name) {
    if (!(name in this.structs)) {
        console.trace();
        throw new Error("Unknown struct "+name);
    }
    return this.structs[name];
  }, function get_struct_cls(name) {
    if (!(name in this.struct_cls)) {
        console.trace();
        throw new Error("Unknown struct "+name);
    }
    return this.struct_cls[name];
  }, _ESClass.static(function inherit(child, parent) {
    var stt=schema_parse.parse(parent.STRUCT);
    var code=child.name+"{\n";
    code+=STRUCT.fmt_struct(stt, true);
    return code;
  }), _ESClass.static(function chain_fromSTRUCT(cls, reader) {
    var proto=cls.prototype;
    var parent=cls.__parent__;
    var obj=new cls();
    var p=parent.fromSTRUCT(reader);
    for (var k in p) {
        if (k=="__proto__"||k=="constructor"||k=="prototype"||k=="priors"||k=="__prototypeid__"||k=="__statics__")
          continue;
        if (k in proto) {
            var des=Object.getOwnPropertyDescriptor(proto, k);
            if (des==undefined||des.set==undefined) {
                continue;
            }
        }
        obj[k] = p[k];
    }
    return obj;
    var obj=parent.fromSTRUCT(reader);
    var keys=Object.keys(proto);
    for (var i=0; i<keys.length; i++) {
        var k=keys[i];
        var des=Object.getOwnPropertyDescriptor(proto, k);
        if (des!=undefined&&(des.get!=undefined)) {
            var des2=Object.getOwnPropertyDescriptor(proto, k);
            if (des2!=undefined&&des2.set==undefined) {
                continue;
            }
        }
        if (k=="__proto__")
          continue;
        obj[k] = proto[k];
    }
    if (proto.toString!=Object.prototype.toString)
      obj.toString = proto.toString;
    obj.constructor = cls;
    obj.prototype = cls.prototype;
    obj.__proto__.constructor = cls;
    return obj;
  }), _ESClass.static(function fmt_struct(stt, internal_only, no_helper_js) {
    if (internal_only==undefined)
      internal_only = false;
    if (no_helper_js==undefined)
      no_helper_js = false;
    var s="";
    if (!internal_only) {
        s+=stt.name;
        if (stt.id!=-1)
          s+=" id="+stt.id;
        s+=" {\n";
    }
    var tab="  ";
    function fmt_type(type) {
      if (type.type==11) {
          if (type.data.iname!=""&&type.data.iname!=undefined) {
              return "array("+type.data.iname+", "+fmt_type(type.data.type)+")";
          }
          else {
            return "array("+fmt_type(type.data.type)+")";
          }
      }
      else 
        if (type.type==12) {
          if (type.data.iname!=""&&type.data.iname!=undefined) {
              return "iter("+type.data.iname+", "+fmt_type(type.data.type)+")";
          }
          else {
            return "iter("+fmt_type(type.data.type)+")";
          }
      }
      else 
        if (type.type==13) {
          return "dataref("+type.data+")";
      }
      else 
        if (type.type==8) {
          return "static_string["+type.data.maxlength+"]";
      }
      else 
        if (type.type==9) {
          return type.data;
      }
      else 
        if (type.type==10) {
          return "abstract("+type.data+")";
      }
      else {
        return SchemaTypeMap[type.type];
      }
    }
    var fields=stt.fields;
    for (var i=0; i<fields.length; i++) {
        var f=fields[i];
        s+=tab+f.name+" : "+fmt_type(f.type);
        if (!no_helper_js&&f.get!=undefined) {
            s+=" | "+f.get.trim();
        }
        s+=";\n";
    }
    if (!internal_only)
      s+="}";
    return s;
  }), function _env_call(code, obj, env) {
    var envcode=_static_envcode_null;
    var profname=code.replace("\r", "").replace("\n", ";").trim();
    
    
    _tote++;
    if (env!=undefined) {
        envcode = "";
        for (var i=0; i<env.length; i++) {
            envcode = "var "+env[i][0]+" = env["+i.toString()+"][1];\n"+envcode;
        }
    }
    var fullcode="";
    if (envcode!==_static_envcode_null)
      fullcode = envcode+code;
    else 
      fullcode = code;
    var func;
    if (!(fullcode in this.compiled_code)) {
        if (config.HAVE_EVAL) {
            try {
              var code2="func = function(obj, env) { "+envcode+"return "+code+"}";
              eval(code2);
            }
            catch (err) {
                console.log(code2);
                console.log(" ");
                print_stack(err);
                throw err;
            }
        }
        else {
          var scope={obj: undefined, env: undefined};
          for (var k in safe_global) {
              scope[k] = safe_global[k];
          }
          var ast=safe_eval.compile(code);
          func = function(obj, env) {
            scope.obj = obj;
            if (env!=undefined) {
                for (var i=0; i<env.length; i++) {
                    scope[env[i][0]] = env[i][1];
                }
            }
            return safe_eval.exec(ast, scope);
          };
        }
        this.compiled_code[fullcode] = func;
        _compe++;
    }
    else {
      func = this.compiled_code[fullcode];
      _cace++;
    }
    var ret=undefined;
    try {
      ret = func(obj, env);
    }
    catch (err) {
        var code2="func = function(obj, env) { "+envcode+"return "+code+"}";
        console.log(code2);
        console.log(" ");
        print_stack(err);
        throw err;
    }
    
    
    return ret;
  }, function write_struct(data, obj, stt) {
    
    
    function use_helper_js(field) {
      if (field.type.type==11||field.type.type==12) {
          return field.type.data.iname==undefined||field.type.data.iname=="";
      }
      return true;
    }
    var fields=stt.fields;
    var thestruct=this;
    for (var i=0; i<fields.length; i++) {
        var f=fields[i];
        var t1=f.type;
        var t2=t1.type;
        if (use_helper_js(f)) {
            var val;
            var type=t2;
            if (obj==undefined) {
                console.log("Undefined obj!", f);
            }
            if (f.get!=undefined) {
                val = thestruct._env_call(f.get, obj);
            }
            else {
              val = obj[f.name];
            }
            _st_pack_type(data, val, obj, thestruct, f, t1);
        }
        else {
          var val=obj[f.name];
          _st_pack_type(data, val, obj, thestruct, f, t1);
        }
    }
    
    
  }, function write_object(data, obj) {
    var cls=obj.constructor.name;
    var stt=this.get_struct(cls);
    this.write_struct(data, obj, stt);
  }, function read_object(data, cls, uctx) {
    if (uctx==undefined) {
        uctx = new unpack_ctx();
    }
    var stt=this.structs[cls.name];
    var thestruct=this;
    
    
    var unpack_funcs={0: function(type) {
      var ret=unpack_int(data, uctx);
      
      return ret;
    }, 1: function(type) {
      var ret=unpack_float(data, uctx);
      
      return ret;
    }, 2: function(type) {
      var ret=unpack_double(data, uctx);
      
      return ret;
    }, 7: function(type) {
      
      var s=unpack_string(data, uctx);
      
      
      return s;
    }, 8: function(type) {
      
      var start_i=uctx.i;
      var s=unpack_static_string(data, uctx, type.data.maxlength);
      
      
      return s;
    }, 3: function(type) {
      
      return unpack_vec2(data, uctx);
    }, 4: function(type) {
      
      return unpack_vec3(data, uctx);
    }, 5: function(type) {
      
      return unpack_vec4(data, uctx);
    }, 6: function(type) {
      
      return unpack_mat4(data, uctx);
    }, 11: function(type) {
      
      var len=unpack_int(data, uctx);
      
      var arr=new Array(len);
      for (var i=0; i<len; i++) {
          arr[i] = unpack_field(type.data.type);
      }
      
      return arr;
    }, 12: function(type) {
      
      var len=unpack_int(data, uctx);
      
      var arr=new Array(len);
      for (var i=0; i<len; i++) {
          arr[i] = unpack_field(type.data.type);
      }
      
      return arr;
    }, 9: function(type) {
      
      var cls2=thestruct.get_struct_cls(type.data);
      var ret=thestruct.read_object(data, cls2, uctx);
      
      return ret;
    }, 10: function(type) {
      
      var id=unpack_int(data, uctx);
      
      if (!(id in thestruct.struct_ids)) {
          
          console.trace();
          console.log(id);
          console.log(thestruct.struct_ids);
          
          throw new Error(""+uctx.i+": Unknown struct type "+id+".");
      }
      var cls2=thestruct.get_struct_id(id);
      
      cls2 = thestruct.struct_cls[cls2.name];
      var ret=thestruct.read_object(data, cls2, uctx);
      
      return ret;
    }, 13: function(type) {
      
      var ret=unpack_dataref(data, uctx);
      
      return ret;
    }, 14: function(type) {
      var ret=unpack_byte(data, uctx);
      
      return ret;
    }, 15: function(type) {
      var length=unpack_int(data, uctx);
      var ret=unpack_bytes(data, uctx, length);
      
      return ret.buffer;
    }}
    function unpack_field(type) {
      return unpack_funcs[type.type](type);
    }
    var loader_used=false;
    function load(obj) {
      var fields=stt.fields;
      var flen=fields.length;
      loader_used = true;
      if (DEBUG.Struct)
        console.log("flen", flen, fields, stt);
      for (var i=0; i<flen; i++) {
          var f=fields[i];
          var val=unpack_field(f.type);
          obj[f.name] = val;
      }
    }
    
    if (cls.fromSTRUCT==undefined) {
        console.trace("-------->", data, cls.constructor, "|", cls.name, "|", cls, "|");
        return undefined;
    }
    var ret=cls.fromSTRUCT(load);
    if (!loader_used) {
        load({});
    }
    return ret;
  }]);
  _es6_module.add_class(STRUCT);
  STRUCT = _es6_module.add_export('STRUCT', STRUCT);
  window.istruct = new STRUCT();
  var test_vertex_struct="\n  Vertex {\n    eid : int;\n    flag : int;\n    index : int;\n    type : int;\n\n    co : vec3;\n    no : vec3;\n    loop : int | obj.loop == undefined ? -1 : obj.loop.eid;\n    edges : array(e, int) | e.eid;\n  }\n";
  var test_struct_str="\n  Test {\n    a : array(iter(Test2));\n    b : string;\n    c : array(int);\n    d : array(string);\n  }\n";
  var test_struct_str2="\n  Test2 {\n    b : static_string[16];\n    c : int;\n  }\n";
  function test_struct() {
    var stt=schema_parse.parse(test_struct_str);
    var t2a={b: "1dsfsd", c: 3}
    var t2b={b: "2dsfsd", c: 2}
    var t2c={b: "3dsfsd", c: 1}
    var l1=new GArray([t2a, t2b, t2c]);
    var l2=new GArray([t2b, t2a, t2c]);
    var obj={a: [l1, l2], b: "test", c: [1, 8, 9, 10], d: ["d", "e", "g", "t"]}
    obj.fromSTRUCT = function(unpacker) {
      var obj3={}
      unpacker(obj3);
      return obj3;
    }
    obj.STRUCT = test_struct_str;
    var obj2={b: "sdfsdf", c: 1}
    obj2.STRUCT = test_struct_str2;
    obj2.fromSTRUCT = function(unpacker) {
      var obj3={}
      unpacker(obj3);
      return obj3;
    }
    obj.name = "Test";
    obj2.name = "Test2";
    obj.constructor = {name: "Test"}
    obj2.constructor = {name: "Test2"}
    var data=[];
    istruct.add_struct(obj);
    istruct.add_struct(obj2);
    istruct.write_struct(data, obj, stt);
    data = new DataView(new Uint8Array(data).buffer);
    obj = istruct.read_object(data, obj);
    var m=makeBoxMesh(null);
    var data=[];
    istruct.write_object(data, m);
    data = new DataView(new Uint8Array(data).buffer);
    m = istruct.read_object(data, Mesh);
  }
  register_test(test_struct);
  window.init_struct_packer = function() {
    
    init_toolop_structs();
    window.istruct = new STRUCT();
    var errs=[];
    var __iter_cls=__get_iter(defined_classes);
    var cls;
    while (1) {
      var __ival_cls=__iter_cls.next();
      if (__ival_cls.done) {
          break;
      }
      cls = __ival_cls.value;
      try {
        if (cls.STRUCT!==undefined&&cls.fromSTRUCT!=undefined) {
            istruct.add_struct(cls);
        }
        else 
          if (cls.STRUCT!==undefined) {
            if (cls.prototype.fromSTRUCT!==undefined) {
                console.warn("fromSTRUCT must be a static method for class", cls.name, cls);
            }
            else {
              console.warn("STRUCT class", cls.name, "has no fromSTRUCT method", cls);
            }
        }
      }
      catch (err) {
          if (__instance_of(err, PUTLParseError)) {
              console.log("cls.name: ", cls.name);
              print_stack(err);
              console.log("Error parsing struct: "+err.message);
          }
          else {
            errs.push(err);
          }
      }
    }
    for (var i=0; i<errs.length; i++) {
        print_stack(err);
        if (i==errs.length-1)
          throw err;
    }
    window.safe_global = {}
    for (var k in window) {
        if (k.search("bar")>=0||k=="localStorage"||(k.startsWith("on")&&k[2]!="l")) {
            continue;
        }
        if (k.startsWith("webkit")) {
            continue;
        }
        safe_global[k] = window[k];
    }
  }
  function gen_struct_str() {
    var buf="";
    for (var k in istruct.structs) {
        buf+=STRUCT.fmt_struct(istruct.structs[k], false, true)+"\n";
    }
    var buf2=buf;
    buf = "";
    for (var i=0; i<buf2.length; i++) {
        var c=buf2[i];
        if (c=="\n") {
            buf+="\n";
            var i2=i;
            while (i<buf2.length&&(buf2[i]==" "||buf2[i]=="\t"||buf2[i]=="\n")) {
              i++;
            }
            if (i!=i2)
              i--;
        }
        else {
          buf+=c;
        }
    }
    return buf;
  }
  gen_struct_str = _es6_module.add_export('gen_struct_str', gen_struct_str);
  var JSONType=_ESClass("JSONType", [function JSONType() {
  }]);
  _es6_module.add_class(JSONType);
  function JSOB(obj) {
    obj.__proto__ = JSONType.prototype;
    obj.constructor = JSONType;
    return obj;
  }
  var StaticString=_ESClass("StaticString", String, [function StaticString(s, maxlength) {
    if (s.length>maxlength)
      s = s.slice(0, maxlength);
    String.call(this, s);
  }]);
  _es6_module.add_class(StaticString);
  var _basic_types={"StaticString": "static_string", "String": "string", "Number": "number", "Vec2": "vec2", "Vec3": "vec3", "Vec4": "vec4", "Matrix4": "mat4", "number": "number", "string": "string"}
  var SchemaError=_ESClass("SchemaError", Error, [function SchemaError(msg) {
    Error.call(this, msg);
    this.msg = msg;
  }]);
  _es6_module.add_class(SchemaError);
  function gen_schema(obj, calc_subschema) {
    if (calc_subschema==undefined)
      calc_subschema = false;
    var s={}
    if (obj==undefined) {
        throw new Error("Undefined not allowed");
    }
    if (btypeof(obj) in _basic_types) {
        s["type"] = _basic_types[btypeof(obj)];
        return s;
    }
    else 
      if (obj.__class__ in _basic_types) {
        s["type"] = _basic_types[obj.__class__];
        return s;
    }
    if ((__instance_of(obj, Array))||(__instance_of(obj, GArray))) {
        s.type = "array";
        if (obj.length==0) {
            if ("s_array_type" in obj)
              s.subtype = obj.s_array_type;
            else 
              s.subtype = "null";
        }
        else {
          var type="s_array_type" in obj ? obj.s_array_type : undefined;
          for (var i=0; i<obj.length; i++) {
              var t2=gen_schema(obj[i]);
              if (type==undefined)
                type = t2;
          }
          s.subtype = type;
        }
    }
    else 
      if (is_obj_lit(obj)) {
        s["type"] = "object";
        var fields=[];
        for (var k in obj) {
            if (k=="constructor"||k=="prototype"||k=="__proto__")
              continue;
            fields.push([k, gen_schema(obj[k])]);
        }
        s["fields"] = fields;
    }
    else {
      s["type"] = "schema_object";
      s["name"] = obj.__class__;
    }
    return s;
  }
  var SchmTypes={BYTE: 0, INT: 1, FLOAT: 2, DOUBLE: 3, STRING: 4, FIXEDSTRING: 5, ARRAY: 6, VEC2: 7, VEC3: 8, VEC4: 9, MAT4: 10, COLOR: 11, DATAREF: 12, OBJECT: 13}
  function time_packers() {
    var mesh=makeBoxMesh();
    var tot=1000;
    var av=0;
    var arr=[];
    mesh.pack(arr);
    var tarr=new Array(tot);
    for (var i=0; i<tot; i++) {
        arr.length = 0;
        var start=time_ms();
        mesh.pack(arr);
        var end=time_ms();
        av+=end-start;
        tarr[i] = end-start;
    }
    tarr.sort();
    tot = 200;
    tarr = new Array(tot);
    var ist=istruct;
    for (var i=0; i<tot; i++) {
        arr.length = 0;
        var start=time_ms();
        ist.write_object(arr, mesh);
        var end=time_ms();
        tarr[i] = end-start;
    }
  }
  function profile_schema() {
    var mesh=makeBoxMesh();
    var tot=10000;
    var av=0;
    var arr=[];
    var tarr=new Array(tot);
    tarr = new Array(tot);
    var ist=istruct;
    var lastt=time_ms();
    for (var i=0; i<tot; i++) {
        if (time_ms()-lastt>900) {
            lastt = time_ms();
            console.log(i, " of ", tot);
        }
        arr.length = 0;
        var start=time_ms();
        ist.write_object(arr, mesh);
        var end=time_ms();
        tarr[i] = end-start;
    }
    console.log("schema result: ", tarr[tot/2]);
  }
}, '/dev/cleanfairmotion/src/core/struct.js');
es6_module_define('video', [], function _video_module(_es6_module) {
  var FrameIterator=_ESClass("FrameIterator", [function FrameIterator(vm) {
    this.vm = vm;
    this.ret = {done: true, value: undefined}
    this.i = 0;
  }, function init(vm) {
    this.vm = vm;
    this.ret.done = false;
    this.ret.value = undefined;
    this.i = 0;
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return this;
  }), function next() {
    if (this.i>=this.vm.totframe) {
        this.ret.done = true;
        return this.ret;
    }
    this.ret.value = this.vm.get(this.i++);
    return this.ret;
  }]);
  _es6_module.add_class(FrameIterator);
  var Video=_ESClass("Video", [function Video(url) {
    this.canvas = document.createElement("canvas");
    this.g = this.canvas.getContext("2d");
    this.video = document.createElement("video");
    this.url = url;
    this.source = document.createElement("source");
    this.source.src = url;
    this.video.appendChild(this.source);
    var this2=this;
    this.video.oncanplaythrough = (function oncanplaythrough() {
      this2.record_video();
      this2.video.oncanplaythrough = null;
    }).bind(this);
    this.video.load();
    this.frames = {}
    this.recording = false;
    this.totframe = 0;
  }, function record_video() {
    if (this.recording) {
        console.trace("Already started recording!");
        return ;
    }
    var video=this.video;
    if (video.readyState!=4) {
        var this2=this;
        var timer=window.setInterval(function() {
          if (video.readyState==4) {
              window.clearInterval(timer);
              this2.record_video();
          }
        }, 100);
        return ;
    }
    this.recording = true;
    this.canvas.width = video.videoWidth;
    this.canvas.height = video.videoHeight;
    var g=this.g;
    var frames=this.frames;
    var size=[video.videoWidth, video.videoHeight];
    var this2=this;
    function finish() {
      console.log("finish!", this2);
      this2.recording = false;
      var rerun=false;
      for (var i=1; i<this2.totframe; i++) {
          if (!(i in this2.frames)) {
              console.log("Missing frame", i);
              rerun = true;
          }
      }
      if (rerun) {
          console.log("Scanning video again. . .");
          this2.video = video = document.createElement("video");
          this2.source = document.createElement("source");
          this2.source.src = this2.url;
          this2.video.appendChild(this2.source);
          this2.video.oncanplaythrough = (function() {
            this2.record_video();
            this2.video.oncanplaythrough = null;
          }).bind(this2);
          this2.video.load();
      }
    }
    this.blank = g.getImageData(0, 0, size[0], size[1]);
    var canvas=this.canvas;
    var cur_i=0;
    var on_frame=(function() {
      var frame=cur_i++;
      if (video.paused) {
          console.log("Done!");
      }
      if (frame in frames)
        return ;
      this2.totframe = Math.max(this2.totframe, frame+1);
      g.drawImage(video, 0, 0);
      var img=document.createElement("img");
      img.width = size[0];
      img.height = size[1];
      img.src = canvas.toDataURL();
      frames[frame] = img;
    }).bind(this);
    console.log("start video");
    video.onloadeddata = function() {
      console.log("meta", arguments);
    }
    video.addEventListener("loadeddata", function() {
      console.log("meta2", arguments);
    });
    var last_frame=-1;
    video.playbackRate = 0.5;
    video.ontimeupdate = video.onseeked = video.onplaying = function() {
      var frame=Math.floor(video.currentTime*29.97);
      if (last_frame!=frame) {
          console.clear();
          console.log("frame: ", frame-last_frame);
          on_frame();
      }
      last_frame = frame;
      video.onpause = function() {
        video.onpause = null;
        video.play();
      }
      video.pause();
    }
    video.play();
  }, function get(frame) {
    if (frame in this.frames)
      return this.frames[frame];
    return undefined;
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return new FrameIterator(this);
  })]);
  _es6_module.add_class(Video);
  Video = _es6_module.add_export('Video', Video);
  function current_frame(v) {
    return Math.floor(v.currentTime*15.0);
    if (v.webkitDecodedFrameCount!=undefined)
      return v.currentTime;
  }
  var VideoManager=_ESClass("VideoManager", [function VideoManager() {
    this.pathmap = {}
    this.videos = {}
  }, function get(url) {
    if (url in this.pathmap) {
        return this.pathmap[url];
    }
    this.pathmap[url] = new Video(url);
  }]);
  _es6_module.add_class(VideoManager);
  VideoManager = _es6_module.add_export('VideoManager', VideoManager);
  var manager=new VideoManager();
  manager = _es6_module.add_export('manager', manager);
}, '/dev/cleanfairmotion/src/core/video.js');
es6_module_define('fileapi', ["fileapi_electron", "fileapi_chrome", "config", "fileapi_html5"], function _fileapi_module(_es6_module) {
  var config=es6_import(_es6_module, 'config');
  function get_root_folderid() {
    return '/';
  }
  get_root_folderid = _es6_module.add_export('get_root_folderid', get_root_folderid);
  function get_current_dir() {
    return '';
  }
  get_current_dir = _es6_module.add_export('get_current_dir', get_current_dir);
  function path_to_id() {
    return '';
  }
  path_to_id = _es6_module.add_export('path_to_id', path_to_id);
  function id_to_path() {
    return '';
  }
  id_to_path = _es6_module.add_export('id_to_path', id_to_path);
  if (config.CHROME_APP_MODE) {
      var _fileapi_chrome=es6_import(_es6_module, 'fileapi_chrome');
      for (var k in _fileapi_chrome) {
          _es6_module.add_export(k, _fileapi_chrome[k], true);
      }
  }
  else 
    if (config.ELECTRON_APP_MODE) {
      var _fileapi_electron=es6_import(_es6_module, 'fileapi_electron');
      for (var k in _fileapi_electron) {
          _es6_module.add_export(k, _fileapi_electron[k], true);
      }
  }
  else {
    var _fileapi_html5=es6_import(_es6_module, 'fileapi_html5');
    for (var k in _fileapi_html5) {
        _es6_module.add_export(k, _fileapi_html5[k], true);
    }
  }
}, '/dev/cleanfairmotion/src/core/fileapi.js');
es6_module_define('fileapi_html5', ["config"], function _fileapi_html5_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, 'config');
  function clearRecentList() {
  }
  clearRecentList = _es6_module.add_export('clearRecentList', clearRecentList);
  function getRecentList() {
    return [];
  }
  getRecentList = _es6_module.add_export('getRecentList', getRecentList);
  function setRecent(name, id) {
  }
  setRecent = _es6_module.add_export('setRecent', setRecent);
  function openRecent(thisvar, id) {
    throw new Error("not supported for html5");
  }
  openRecent = _es6_module.add_export('openRecent', openRecent);
  function reset() {
  }
  reset = _es6_module.add_export('reset', reset);
  function open_file(callback, thisvar, set_current_file, extslabel, exts) {
    if (thisvar==undefined)
      thisvar = this;
    var form=document.createElement("form");
    document.body.appendChild(form);
    var input=document.createElement("input");
    input.type = "file";
    input.id = "file";
    input.style.position = "absolute";
    input.style["z-index"] = 10;
    input.style.visible = "hidden";
    input.style.visibility = "hidden";
    var finished=false;
    input.oncancel = input.onabort = input.close = function() {
      console.log("aborted");
      if (!finished) {
          document.body.removeChild(form);
          finished = true;
      }
    }
    input.onchange = function(e) {
      var files=this.files;
      if (!finished) {
          document.body.removeChild(form);
          finished = true;
      }
      if (files.length==0)
        return ;
      var file=files[0];
      var reader=new FileReader();
      reader.onload = function(e) {
        console.log(e.target.result);
        callback.call(thisvar, e.target.result, file.name, file.name);
      }
      reader.readAsArrayBuffer(file);
    }
    input.focus();
    input.select();
    input.click();
    window.finput = input;
    form.appendChild(input);
  }
  open_file = _es6_module.add_export('open_file', open_file);
  function can_access_path(path) {
    return false;
  }
  can_access_path = _es6_module.add_export('can_access_path', can_access_path);
  function save_file(data, save_as_mode, set_current_file, extslabel, exts, error_cb) {
    if (config.CHROME_APP_MODE) {
        return chrome_app_save(data, save_as_mode, set_current_file, extslabel, exts, error_cb);
    }
    if (!(__instance_of(data, Blob)))
      data = new Blob([data], {type: "application/octet-binary"});
    var url=URL.createObjectURL(data);
    var link=document.createElement("a");
    link.href = url;
    var name=g_app_state.filepath;
    name = name===undefined||name.trim()=="" ? "untitled.fmo" : name;
    link.download = name;
    console.log(link, link.__proto__);
    window._link = link;
    link.click();
    return ;
    window.open(url);
    console.log("url:", url);
  }
  save_file = _es6_module.add_export('save_file', save_file);
  function save_with_dialog(data, default_path, extslabel, exts, error_cb, success_cb) {
    return save_file(data, true, false, extslabel, exts, error_cb);
  }
  save_with_dialog = _es6_module.add_export('save_with_dialog', save_with_dialog);
}, '/dev/cleanfairmotion/src/core/fileapi_html5.js');
es6_module_define('fileapi_chrome', [], function _fileapi_chrome_module(_es6_module) {
  "use strict";
  var current_chromeapp_file=undefined;
  function chrome_get_current_file() {
    return current_chromeapp_file;
  }
  chrome_get_current_file = _es6_module.add_export('chrome_get_current_file', chrome_get_current_file);
  function reset() {
    current_chromeapp_file = undefined;
  }
  reset = _es6_module.add_export('reset', reset);
  function open_file(callback, thisvar, set_current_file, extslabel, exts) {
    console.log("Chrome open");
    function errorHandler() {
      console.log("Error reading file!", arguments);
    }
    var params={type: 'openFile'}
    params.accepts = [{description: extslabel, extensions: exts}];
    chrome.fileSystem.chooseEntry(params, function(readOnlyEntry) {
      if (readOnlyEntry==undefined)
        return ;
      if (set_current_file)
        current_chromeapp_file = readOnlyEntry;
      readOnlyEntry.file(function(file) {
        var reader=new FileReader();
        console.log("got file", arguments, reader);
        reader.onerror = errorHandler;
        reader.onload = function(e) {
          var id=chrome.fileSystem.retainEntry(readOnlyEntry);
          console.log("\n\n           ->", e.target.result, readOnlyEntry, id, "<-\n\n");
          callback.call(thisvar, e.target.result, file.name, id);
        }
        reader.readAsArrayBuffer(file);
      });
    });
  }
  open_file = _es6_module.add_export('open_file', open_file);
  function save_file(data, save_as_mode, set_current_file, extslabel, exts, error_cb) {
    function errorHandler() {
      console.log("Error writing file!", arguments);
    }
    function chooseFile() {
      var params={type: 'saveFile'}
      if (g_app_state.filepath!=""&g_app_state.filepath!=undefined) {
          params.suggestedName = g_app_state.filepath;
      }
      params.accepts = [{description: extslabel, extensions: exts}];
      chrome.fileSystem.chooseEntry(params, function(writableFileEntry) {
        if (writableFileEntry==undefined) {
            console.log("user cancel?");
            return ;
        }
        if (set_current_file)
          current_chromeapp_file = writableFileEntry;
        writableFileEntry.createWriter(function(writer) {
          writer.onerror = errorHandler;
          writer.onwriteend = function(e) {
            console.log('write complete');
            g_app_state.notes.label("File saved");
          }
          if (!(__instance_of(data, Blob)))
            data = new Blob([data], {type: "application/octet-binary"});
          writer.write(data);
        }, errorHandler);
      });
    }
    function error() {
      console.log("Error writing file", arguments);
      current_chromeapp_file = undefined;
      if (error_cb!=undefined)
        error_cb.apply(this, arguments);
    }
    if (save_as_mode||current_chromeapp_file==undefined) {
        chooseFile();
    }
    else 
      if (current_chromeapp_file!=undefined) {
        current_chromeapp_file.createWriter(function(writer) {
          writer.onerror = error;
          writer.onwriteend = function() {
            console.log('write complete');
            g_app_state.notes.label("File saved");
          }
          data = new Blob([data], {type: "application/octet-binary"});
          writer.write(data);
        }, errorHandler);
    }
  }
  save_file = _es6_module.add_export('save_file', save_file);
}, '/dev/cleanfairmotion/src/core/fileapi_chrome.js');
es6_module_define('fileapi_electron', ["config", "fileapi_html5"], function _fileapi_electron_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, 'config');
  var fileapi_html5=es6_import(_es6_module, 'fileapi_html5');
  let fs;
  if (config.IS_NODEJS) {
      fs = require("fs");
  }
  function reset() {
  }
  reset = _es6_module.add_export('reset', reset);
  function getRecentList() {
    if (!myLocalStorage.hasCached("recent_files")) {
        var list=[];
        myLocalStorage.set("recent_files", list);
        return list;
    }
    return myLocalStorage.getCached("recent_files");
  }
  getRecentList = _es6_module.add_export('getRecentList', getRecentList);
  function setRecent(name, id) {
    var list=myLocalStorage.getCached("recent_files");
    var item;
    list.reverse();
    var __iter_item_0=__get_iter(list);
    var item_0;
    while (1) {
      var __ival_item_0=__iter_item_0.next();
      if (__ival_item_0.done) {
          break;
      }
      item_0 = __ival_item_0.value;
      if (item_0.id===id) {
          break;
      }
    }
    if (item===undefined) {
        item = {name: name, id: id};
        list.shift();
    }
    else {
      item.name = name;
      item.id = id;
      list.remove(item);
    }
    list.push(item);
    list.reverse();
    myLocalStorage.set("recent_files", list);
    electron_app.addRecentDocument(id);
  }
  setRecent = _es6_module.add_export('setRecent', setRecent);
  function clearRecentList() {
    myLocalStorage.set("recent_files", {});
  }
  clearRecentList = _es6_module.add_export('clearRecentList', clearRecentList);
  function is_dir(path) {
    try {
      let st=fs.statSync(path);
      return st.isDirectory();
    }
    catch (error) {
        print_stack(error);
        return false;
    }
  }
  is_dir = _es6_module.add_export('is_dir', is_dir);
  function get_base_dir(path) {
    if (path===undefined)
      return undefined;
    while (path.length>0&&!is_dir(path)) {
      while (path.length>0&&path[path.length-1]!="/"&&path[path.length-1]!="\\") {
        path = path.slice(0, path.length-1);
      }
      if (path.length>0) {
          path = path.slice(0, path.length-1);
      }
    }
    return path=="" ? undefined : path;
  }
  get_base_dir = _es6_module.add_export('get_base_dir', get_base_dir);
  function open_file(callback, thisvar, set_current_file, extslabel, exts, error_cb) {
    if (thisvar==undefined)
      thisvar = this;
    let default_path=get_base_dir(g_app_state.filepath);
    let dialog=require('electron').dialog;
    if (dialog===undefined) {
        dialog = require('electron').remote.dialog;
    }
    dialog.showOpenDialog(undefined, {title: "Open", defaultPath: default_path, filters: [{name: extslabel, extensions: exts}], securityScopedBookmarks: true}, (path) =>      {
      if (__instance_of(path, Array)) {
          path = path[0];
      }
      let fname=path;
      let idx1=path.lastIndexOf("/");
      let idx2=path.lastIndexOf("\\");
      let idx=Math.max(idx1, idx2);
      if (idx>=0) {
          fname = fname.slice(idx+1, fname.length);
      }
      console.log("path:", path, "name", fname);
      let buf;
      try {
        buf = fs.readFileSync(path);
      }
      catch (error) {
          print_stack(error);
          console.warn("Failed to load file at path ", path);
          if (error_cb!==undefined)
            error_cb();
      }
      let buf2=new Uint8Array(buf.byteLength);
      let i=0;
      var __iter_b=__get_iter(buf);
      var b;
      while (1) {
        var __ival_b=__iter_b.next();
        if (__ival_b.done) {
            break;
        }
        b = __ival_b.value;
        buf2[i++] = b;
      }
      buf = buf2.buffer;
      if (thisvar!==undefined)
        callback.call(thisvar, buf, fname, path);
      else 
        callback(buf, fname, path);
    });
    return ;
    console.trace("open_file called");
    var form=document.createElement("form");
    document.body.appendChild(form);
    var input=document.createElement("input");
    input.type = "file";
    input.id = "file";
    input.style.position = "absolute";
    input.style["z-index"] = 10;
    input.style.visible = "hidden";
    input.style.visibility = "hidden";
    var finished=false;
    input.oncancel = input.onabort = input.close = function() {
      console.log("aborted");
      if (!finished) {
          document.body.removeChild(form);
          finished = true;
      }
    }
    input.onchange = function(e) {
      var files=this.files;
      if (!finished) {
          document.body.removeChild(form);
          finished = true;
      }
      if (files.length==0)
        return ;
      var file=files[0];
      var reader=new FileReader();
      reader.onload = function(e) {
        console.log(e.target.result);
        callback.call(thisvar, e.target.result, file.name, file.path);
      }
      reader.readAsArrayBuffer(file);
    }
    input.focus();
    input.select();
    input.click();
    window.finput = input;
    form.appendChild(input);
  }
  open_file = _es6_module.add_export('open_file', open_file);
  function can_access_path(path) {
    try {
      fs.accessSync(path, fs.constants.R_OK|fs.constants.W_OK);
      return true;
    }
    catch (error) {
        return false;
    }
  }
  can_access_path = _es6_module.add_export('can_access_path', can_access_path);
  function save_file(data, path, error_cb, success_cb) {
    if (__instance_of(data, DataView)) {
        data = data.buffer;
    }
    else 
      if (!(__instance_of(data, ArrayBuffer))&&data.buffer) {
        data = data.buffer;
    }
    console.log("Data", data, path);
    data = new Uint8Array(data);
    try {
      fs.writeFileSync(path, data);
    }
    catch (error) {
        console.warn("Failed to write to path "+path);
        if (error_cb!==undefined)
          error_cb(error);
        print_stack(error);
        return ;
    }
    if (success_cb!==undefined) {
        success_cb(path);
    }
  }
  save_file = _es6_module.add_export('save_file', save_file);
  function save_with_dialog(data, default_path, extslabel, exts, error_cb, success_cb) {
    let dialog=require('electron').dialog;
    if (dialog===undefined) {
        dialog = require('electron').remote.dialog;
    }
    dialog.showSaveDialog(undefined, {title: "Save", defaultPath: default_path, filters: [{name: extslabel, extensions: exts}], securityScopedBookmarks: true}, (path) =>      {
      console.log("path:", path);
      save_file(data, path, error_cb, success_cb);
    });
    return ;
    if (!(__instance_of(data, Blob)))
      data = new Blob([data], {type: "application/octet-binary"});
    var url=URL.createObjectURL(data);
    var link=document.createElement("a");
    link.href = url;
    var name=g_app_state.filepath;
    name = name==""||name===undefined ? "untitled.fmo" : name.trim();
    link.download = name;
    console.log(link, link.__proto__);
    window._link = link;
    link.click();
  }
  save_with_dialog = _es6_module.add_export('save_with_dialog', save_with_dialog);
  function save_file_old(data, save_as_mode, set_current_file, extslabel, exts, error_cb) {
    if (config.CHROME_APP_MODE) {
        return chrome_app_save(data, save_as_mode, set_current_file, extslabel, exts, error_cb);
    }
    if (!(__instance_of(data, Blob)))
      data = new Blob([data], {type: "application/octet-binary"});
    var url=URL.createObjectURL(data);
    var link=document.createElement("a");
    link.href = url;
    var name=g_app_state.filepath.trim();
    name = name=="" ? "untitled.fmo" : name;
    link.download = name;
    console.log(link, link.__proto__);
    window._link = link;
    link.click();
    return ;
    window.open(url);
    console.log("url:", url);
  }
  save_file_old = _es6_module.add_export('save_file_old', save_file_old);
}, '/dev/cleanfairmotion/src/core/fileapi_electron.js');
es6_module_define('stupidsecurity', ["strutils"], function _stupidsecurity_module(_es6_module) {
  var limit_code={"0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9}
  limit_code = _es6_module.add_export('limit_code', limit_code);
  var limit_code_rev={}
  limit_code_rev = _es6_module.add_export('limit_code_rev', limit_code_rev);
  var c=10;
  for (var i=65; i<91; i++) {
      limit_code[String.fromCharCode(i)] = c++;
  }
  limit_code["."] = c++;
  window.max_limit_code = c;
  var __iter_k=__get_in_iter(limit_code);
  var k;
  while (1) {
    var __ival_k=__iter_k.next();
    if (__ival_k.done) {
        break;
    }
    k = __ival_k.value;
    limit_code_rev[limit_code[k]] = k;
  }
  var _rnd_table=[2396599, 1798863, 2424653, 864425, 3411264, 3454329, 2740820, 672041, 2183812, 1374757, 1048546, 3996342, 4179799, 186880, 3607721, 2529926, 1600547, 1189562, 2830964, 1916059, 2876667, 2775942, 557742, 3220496, 4120476, 4065846, 2572439, 185639, 17008, 561912, 3946789, 1270269, 1535702, 3767250, 1318517, 2302563, 1828818, 272601, 2451727, 3540223, 656058, 940763, 1731676, 154871, 2082874, 3430816, 2759352, 2237558, 3586602, 627827, 2379121, 1569378, 2522015, 473595, 3252686, 405188, 697769, 3386638, 3974855, 1817076, 1736754, 1029609, 1152171, 2588906];
  var _max_rnd=4194240.0;
  var StupidRandom=_ESClass("StupidRandom", [function StupidRandom(seed) {
    this.i = 0;
    this.j = 0;
    this._seed = 0;
    this.max = _max_rnd;
    if (seed!=undefined)
      this.seed(seed);
  }, function seed(seed) {
    this._seed = Math.floor(seed);
    this.i = this.j = 0;
  }, function random() {
    i = this.i+this._seed*this.j;
    r1 = _rnd_table[(this.i+this._seed)%_rnd_table.length];
    r2 = _rnd_table[i%_rnd_table.length];
    this.i+=1;
    this.j+=3;
    return (r1+r2)%this.max;
  }, function frandom() {
    return this.next()/this.max;
  }]);
  _es6_module.add_class(StupidRandom);
  var _keyrot_rnd_1=new StupidRandom(0);
  _keyrot_rnd_1 = _es6_module.add_export('_keyrot_rnd_1', _keyrot_rnd_1);
  function fileid_to_publicid(fileid, userid) {
    if (userid==undefined) {
        throw new Error("userid cannot be undefined here!!");
    }
    function gen_id(cols, id) {
      h = id.toString(16).replace("0x", "");
      slen = cols-h.length;
      for (var i=0; i<slen; i++) {
          h = "0"+h;
      }
      return h;
    }
    if (typeof fileid=="string") {
        fileid = parseInt(fileid);
    }
    if (typeof userid=="string") {
        userid = parseInt(userid);
    }
    return key_rotate(gen_id(8, userid)+"."+gen_id(8, fileid));
  }
  function key_rotate(key) {
    key = key.toString().toUpperCase();
    s2 = "";
    if (key.length>0) {
        var c=key[key.length-1];
        if (!(c in limit_code)) {
            warn("WARNING: unknown limit code", c);
            c = ".";
        }
        _keyrot_rnd_1.seed(limit_code[c]);
    }
    for (var i=0; i<key.length-1; i++) {
        var c=key[i];
        if (!(c in limit_code)) {
            c = ".";
        }
        var limitcode=limit_code[c];
        var r=Math.floor(_keyrot_rnd_1.random()%24.0);
        limitcode = (limitcode+r)%window.max_limit_code;
        c = limit_code_rev[limitcode];
        s2+=c;
    }
    if (key.length>0) {
        s2+=key[key.length-1];
    }
    return s2;
  }
  key_rotate = _es6_module.add_export('key_rotate', key_rotate);
  function key_unrotate(key) {
    key = key.toString().toUpperCase();
    s2 = "";
    if (key.length>0) {
        var c=key[key.length-1];
        if (!(c in limit_code)) {
            console.log("Invalid character! '"+str(c)+"'");
            c = ".";
        }
        _keyrot_rnd_1.seed(limit_code[c]);
    }
    for (var i=0; i<key.length-1; i++) {
        var c=key[i];
        if (!(c in limit_code)) {
            throw "Invalid string for key_rotate!";
        }
        var limitcode=limit_code[c];
        var r=Math.floor(_keyrot_rnd_1.random()%24.0);
        if (window._td==undefined)
          window._td = 0;
        limitcode = (limitcode+window.max_limit_code-r)%window.max_limit_code;
        c = limit_code_rev[limitcode];
        s2+=c;
    }
    if (key.length>0) {
        s2+=key[key.length-1];
    }
    return s2;
  }
  key_unrotate = _es6_module.add_export('key_unrotate', key_unrotate);
  function get_root_folderid() {
    if (g_app_state.session.userid==undefined)
      return undefined;
    var userid=key_unrotate(g_app_state.session.userid);
    return fileid_to_publicid(1, userid);
  }
  get_root_folderid = _es6_module.add_export('get_root_folderid', get_root_folderid);
  function get_current_dir() {
    if (g_app_state.session.userid==undefined)
      return undefined;
    recent_paths = g_app_state.session.settings.recent_paths;
    if (recent_paths.length>0) {
        var path=recent_paths[recent_paths.length-1].path.trim().replace(/\\/g, "/");
        while (path.length>0&&path[path.length-1]!="/") {
          path = path.slice(0, path.length-1);
        }
        if (path.length>0&&path[path.length-1]!="/")
          path = path.slice(0, path.length-1);
        return path=="" ? undefined : path;
    }
    return undefined;
  }
  get_current_dir = _es6_module.add_export('get_current_dir', get_current_dir);
  var encode_utf8=es6_import_item(_es6_module, 'strutils', 'encode_utf8');
  var decode_utf8=es6_import_item(_es6_module, 'strutils', 'decode_utf8');
  var truncate_utf8=es6_import_item(_es6_module, 'strutils', 'truncate_utf8');
  var urlencode=es6_import_item(_es6_module, 'strutils', 'urlencode');
  var b64decode=es6_import_item(_es6_module, 'strutils', 'b64decode');
  var b64encode=es6_import_item(_es6_module, 'strutils', 'b64encode');
  function path_to_id(path) {
    if (path.trim()=="/") {
        return new Promise(function(accept, reject) {
          accept({value: get_root_folderid()});
        });
    }
    if (g_app_state.session.userid==undefined) {
        return new Promise(function(accept, reject) {
          reject();
        });
    }
    function joblet(job, args) {
      var __gen_this2=this;
      function _generator_iter() {
        this.scope = {job_0: job, args_0: args, token_3: undefined, path2_3: undefined}
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
          while ($__state<6) {
            switch ($__state) {
              case 0:
                break;
              case 1:
                $__state = (g_app_state.session.tokens==undefined) ? 2 : 3;
                break;
              case 2:
                scope.job_0.error(scope.job_0, scope.job_0.owner);
                return ;
                
                $__state = 3;
                break;
              case 3:
                scope.token_3=g_app_state.session.tokens.access;
                scope.path2_3=urlencode(path);
                api_exec("/api/files/get/meta?accessToken="+scope.token_3+"&path="+scope.path2_3, scope.job_0);
                
                $__state = 4;
                break;
              case 4:
                $__ret = this.ret;
                $__ret.value = undefined;
                
                $__state = 5;
                break;
              case 5:
                scope.job_0.value = scope.job_0.value.id;
                
                $__state = 6;
                break;
              case 6:
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
    return call_api(joblet);
  }
  path_to_id = _es6_module.add_export('path_to_id', path_to_id);
  window.test_get_file_id = function() {
    path_to_id("/C/dev").then(function(job) {
      console.log("==>", arguments, job.value);
    });
  }
  window.key_rot = key_rotate;
  window.key_unrot = key_unrotate;
}, '/dev/cleanfairmotion/src/core/stupidsecurity.js');
es6_module_define('animdata', ["eventdag", "spline_base", "lib_api", "struct", "toolprops"], function _animdata_module(_es6_module) {
  "use strict";
  var PropTypes=es6_import_item(_es6_module, 'toolprops', 'PropTypes');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var CustomDataLayer=es6_import_item(_es6_module, 'spline_base', 'CustomDataLayer');
  var SplineTypes=es6_import_item(_es6_module, 'spline_base', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, 'spline_base', 'SplineFlags');
  var DataPathNode=es6_import_item(_es6_module, 'eventdag', 'DataPathNode');
  es6_import(_es6_module, 'struct');
  var TimeDataLayer=_ESClass("TimeDataLayer", CustomDataLayer, [function TimeDataLayer() {
    CustomDataLayer.call(this);
    this.owning_veid = -1;
    this.time = 1.0;
  }, function interp(srcs, ws) {
    this.time = 0.0;
    if (srcs.length>0) {
        this.owning_veid = srcs[0].owning_veid;
    }
    for (var i=0; i<srcs.length; i++) {
        this.time+=srcs[i].time*ws[i];
    }
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=STRUCT.chain_fromSTRUCT(TimeDataLayer, reader);
    return ret;
  })]);
  _es6_module.add_class(TimeDataLayer);
  TimeDataLayer = _es6_module.add_export('TimeDataLayer', TimeDataLayer);
  TimeDataLayer.STRUCT = STRUCT.inherit(TimeDataLayer, CustomDataLayer)+"\n    time         : float;\n    owning_veid  : int;\n  }\n";
  TimeDataLayer.layerinfo = {type_name: "TimeDataLayer"}
  function get_vtime(v) {
    var ret=v.cdata.get_layer(TimeDataLayer);
    if (ret!=undefined)
      return ret.time;
    return -1;
  }
  get_vtime = _es6_module.add_export('get_vtime', get_vtime);
  function set_vtime(v, time) {
    var ret=v.cdata.get_layer(TimeDataLayer);
    if (ret!=undefined) {
        ret.time = time;
    }
  }
  set_vtime = _es6_module.add_export('set_vtime', set_vtime);
  var AnimKeyFlags={SELECT: 1}
  AnimKeyFlags = _es6_module.add_export('AnimKeyFlags', AnimKeyFlags);
  var AnimInterpModes={STEP: 1, CATMULL: 2, LINEAR: 4}
  AnimInterpModes = _es6_module.add_export('AnimInterpModes', AnimInterpModes);
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var DataTypes=es6_import_item(_es6_module, 'lib_api', 'DataTypes');
  var DataNames=es6_import_item(_es6_module, 'lib_api', 'DataNames');
  var AnimKey=_ESClass("AnimKey", DataPathNode, [function AnimKey() {
    this.id = -1;
    this.flag = 0;
    this.time = 1.0;
    this.handles = [0, 0];
    this.mode = AnimInterpModes.STEP;
    this.data = undefined;
    this.owner_eid = -1;
    this.channel = undefined;
  }, function dag_get_datapath(ctx) {
    var owner=this.channel.owner;
    var path;
    if (owner.lib_id<=-1) {
        path = owner.dag_get_datapath();
    }
    else {
      var name=DataNames[owner.lib_type].toLowerCase();
      path = "datalib."+name+".items["+owner.lib_id+"]";
    }
    path+=".animkeys["+this.id+"]";
    return path;
  }, function set_time(time) {
    this.time = time;
    this.channel.resort = true;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new AnimKey();
    reader(ret);
    return ret;
  })]);
  _es6_module.add_class(AnimKey);
  AnimKey = _es6_module.add_export('AnimKey', AnimKey);
  define_static(AnimKey, "dag_inputs", {});
  define_static(AnimKey, "dag_outputs", {"depend": undefined, "id": 0.0});
  AnimKey.STRUCT = "\n  AnimKey {\n    owner_eid : int;\n    id        : int;\n    flag      : int;\n    time      : float;\n    mode      : int;\n    handles   : array(float);\n    data      : abstract(ToolProperty);\n  }\n";
  var AnimChannel=_ESClass("AnimChannel", [function AnimChannel(proptype, name, path) {
    this.keys = [];
    this.resort = false;
    this.proptype = proptype;
    this.name = name==undefined ? "unnamed" : name;
    this.path = path;
    this.owner = undefined;
    this.idgen = undefined;
    this.idmap = undefined;
  }, function add(key) {
    if (key.id==-1) {
        key.id = this.idgen.gen_id();
    }
    this.idmap[key.id] = key;
    this.keys.push(key);
    return this;
  }, function remove(key) {
    delete this.idmap[key.id];
    this.keys.remove(key);
    this.resort = true;
    return this;
  }, function _do_resort() {
    this.keys.sort(function(a, b) {
      return a.time-b.time;
    });
    this.resort = false;
  }, function get_propcls() {
    if (this.propcls==undefined) {
        switch (this.proptype) {
          case PropTypes.INT:
            this.propcls = IntProperty;
            break;
          case PropTypes.FLOAT:
            this.propcls = FloatProperty;
            break;
        }
    }
    return this.propcls;
  }, function update(time, val) {
    if (this.resort) {
        this._do_resort();
    }
    for (var i=0; i<this.keys.length; i++) {
        if (this.keys[i].time==time) {
            this.keys[i].data.set_data(val);
            return this.keys[i];
        }
    }
    var propcls=this.get_propcls();
    var key=new AnimKey();
    key.id = this.idgen.gen_id();
    this.idmap[key.id] = key;
    key.channel = this;
    key.data = new propcls();
    key.data.set_data(val);
    key.time = time;
    this.keys.push(key);
    this._do_resort();
    return key;
  }, function evaluate(time) {
    if (this.resort) {
        this._do_resort();
    }
    for (var i=0; i<this.keys.length; i++) {
        var k=this.keys[i];
        if (k.time>time) {
            break;
        }
    }
    var prev=i==0 ? this.keys[i] : this.keys[i-1];
    var key=i==this.keys.length ? this.keys[this.keys.length-1] : this.keys[i];
    var t;
    if (prev.time!=key.time) {
        t = (time-prev.time)/(key.time-prev.time);
    }
    else {
      t = 1.0;
    }
    var a=prev.data.data, b=key.data.data;
    var ret;
    if (key.mode==AnimInterpModes.STEP)
      ret = a;
    else 
      ret = a+(b-a)*t;
    if (this.proptype==PropTypes.INT)
      ret = Math.floor(ret+0.5);
    return ret;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new AnimChannel();
    reader(ret);
    for (var i=0; i<ret.keys.length; i++) {
        ret.keys[i].channel = ret;
    }
    return ret;
  })]);
  _es6_module.add_class(AnimChannel);
  AnimChannel = _es6_module.add_export('AnimChannel', AnimChannel);
  AnimChannel.STRUCT = "\n  AnimChannel {\n    name     : string;\n    keys     : array(AnimKey);\n    proptype : int;\n    path     : string;\n  }\n";
}, '/dev/cleanfairmotion/src/core/animdata.js');
es6_module_define('animutil', [], function _animutil_module(_es6_module) {
  "use strict";
  var AnimTypes={SPLINE_PATH_TIME: 1, DATABLOCK_PATH: 2, ALL: 1|2}
  AnimTypes = _es6_module.add_export('AnimTypes', AnimTypes);
  function iterAnimCurves(ctx, types) {
  }
  iterAnimCurves = _es6_module.add_export('iterAnimCurves', iterAnimCurves);
}, '/dev/cleanfairmotion/src/core/animutil.js');
es6_module_define('config_defines', [], function _config_defines_module(_es6_module) {
}, '/dev/cleanfairmotion/src/config/config_defines.js');
es6_module_define('svg_export', ["mathlib", "spline_base"], function _svg_export_module(_es6_module) {
  "use strict";
  var math=es6_import(_es6_module, 'mathlib');
  var SplineFlags=es6_import_item(_es6_module, 'spline_base', 'SplineFlags');
  var MaterialFlags=es6_import_item(_es6_module, 'spline_base', 'MaterialFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_base', 'SplineTypes');
  var cubic_rets=cachering.fromConstructor(Vector3, 64);
  function cubic(a, b, c, d, s) {
    var ret=cubic_rets.next();
    for (var i=0; i<3; i++) {
        ret[i] = a[i]*s*s*s-3*a[i]*s*s+3*a[i]*s-a[i]-3*b[i]*s*s*s+6*b[i]*s*s-3*b[i]*s;
        ret[i]+=3*c[i]*s*s*s-3*c[i]*s*s-d[i]*s*s*s;
        ret[i] = -ret[i];
    }
    return ret;
  }
  function export_svg(spline, visible_only) {
    if (visible_only==undefined) {
        visible_only = false;
    }
    if (spline==undefined) {
        spline = new Context().spline;
    }
    var drawlist=spline.drawlist;
    var minmax=new math.MinMax(2);
    var __iter_v=__get_iter(spline.verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      minmax.minmax(v);
    }
    var min=minmax.min, max=minmax.max;
    function transform(co) {
      co[1] = (min[1]+max[1])-co[1];
      return co;
    }
    function curve_dist(seg, p, s, ds) {
      var s1=s-ds, s2=s+ds;
      var steps=5;
      var mindis=1e+17, mins=0.0;
      for (var i=0; i<steps+1; i++) {
          var segs=s1+(s2-s1)*(i/steps);
          var co=transform(seg.evaluate(segs));
          var dis=co.vectorDistance(p);
          if (dis<mindis) {
              mindis = dis;
              mins = s;
          }
      }
      if (mindis==1e+17) {
          return NaN;
      }
      return mindis;
    }
    function bezerror(seg, a, b, c, d, s1, s2) {
      var steps=5;
      var s=0, ds=1.0-(steps-1);
      var sum=0.0;
      for (var i=0; i<steps; i++, s+=ds) {
          var co1=cubic(a, b, c, d, s);
          var segs=s1+(s2-s1)*s;
          co1 = transform(co1);
          var err=seg.closest_point(co1);
          if (err!=undefined) {
              err = err[0].vectorDistance(co1);
              sum+=err;
          }
      }
      return sum/steps;
    }
    var circles=[];
    function save(seg, s1, s2, depth) {
      depth = depth==undefined ? 0 : depth;
      var s3=(s1+s2)*0.5;
      var k=Math.abs(seg.curvature(s3)*(s2-s1));
      var dk=Math.abs(seg.curvature_dv(s3)*(s2-s1));
      var err=k*seg.length;
      if (depth<0||(depth<5&&err>1.0)) {
          save(seg, s1, s3, depth+1);
          save(seg, s3, s2, depth+1);
          return ;
      }
      var ds=s2-s1;
      var df1=seg.derivative(s1).mulScalar(ds/3.0);
      df1[1] = -df1[1];
      var df2=seg.derivative(s2).mulScalar(-ds/3.0);
      df2[1] = -df2[1];
      var co1=transform(seg.evaluate(s1)), co2=transform(seg.evaluate(s2));
      df1.add(co1), df2.add(co2);
      buf+=" C"+df1[0]+" "+df1[1]+" "+df2[0]+" "+df2[1]+" "+co2[0]+" "+co2[1];
      circles.push([co2[0], co2[1]]);
    }
    function segstyle(seg) {
      var r=~~(seg.mat.strokecolor[0]*255);
      var g=~~(seg.mat.strokecolor[1]*255);
      var b=~~(seg.mat.strokecolor[2]*255);
      var a=seg.mat.strokecolor[3]*seg.mat.opacity;
      var wid=(seg.flag&SplineFlags.NO_RENDER) ? 0 : seg.mat.linewidth;
      var blur=seg.mat.blur;
      var ret="stroke=\"rgb("+r+","+g+","+b+")\" stroke-opacity=\""+a+"\"";
      ret+=" stroke-width=\""+wid+"\"";
      return ret;
    }
    function get_stroke(face) {
      var styles={}
      var maxstyle=0, retstyle="";
      var zi=drawlist.indexOf(face);
      var __iter_list=__get_iter(face.paths);
      var list;
      while (1) {
        var __ival_list=__iter_list.next();
        if (__ival_list.done) {
            break;
        }
        list = __ival_list.value;
        var __iter_loop=__get_iter(list);
        var loop;
        while (1) {
          var __ival_loop=__iter_loop.next();
          if (__ival_loop.done) {
              break;
          }
          loop = __ival_loop.value;
          if (drawlist.indexOf(loop.s)<zi) {
              continue;
          }
          var style=segstyle(loop.s);
          if (!(style in styles)) {
              styles[style] = 1;
          }
          else {
            styles[style]++;
          }
          if (styles[style]>maxstyle) {
              maxstyle = styles[style];
              retstyle = style;
          }
        }
      }
      return retstyle;
    }
    var buf="<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\">\n";
    var face_seg_styles={}
    function export_face(face) {
      var r=~~(face.mat.fillcolor[0]*255);
      var g=~~(face.mat.fillcolor[1]*255);
      var b=~~(face.mat.fillcolor[2]*255);
      var a=face.mat.fillcolor[3]*face.mat.opacity;
      var strokestyle=get_stroke(face);
      face_seg_styles[face.eid] = strokestyle;
      var fill="rgb("+r+","+g+","+b+")";
      buf+="<path "+strokestyle+" fill=\""+fill+"\" fill-opacity=\""+a+"\" d=\"";
      var i=0;
      var first=true;
      var __iter_list=__get_iter(face.paths);
      var list;
      while (1) {
        var __ival_list=__iter_list.next();
        if (__ival_list.done) {
            break;
        }
        list = __ival_list.value;
        list.update_winding();
        var j=0;
        var lastdf=new Vector3(), lastco=new Vector3();
        var __iter_loop=__get_iter(list);
        var loop;
        while (1) {
          var __ival_loop=__iter_loop.next();
          if (__ival_loop.done) {
              break;
          }
          loop = __ival_loop.value;
          var seg=loop.s, v=loop.v;
          var dir=seg.v1===v ? 1 : -1;
          var co=transform(seg.evaluate(dir<0 ? 1 : 0));
          if (first)
            buf+=(first ? " M" : " L")+co[0]+" "+co[1];
          first = false;
          save(seg, dir<0 ? 1 : 0, dir<0 ? 0 : 1, 0);
          var co=transform(seg.evaluate(dir<0 ? 0 : 1));
          continue;
        }
        i++;
      }
      buf+="\" />\n";
    }
    function export_segment(seg) {
      var style=segstyle(seg);
      var skip=seg.flag&SplineFlags.NO_RENDER;
      if (!skip&&seg.l!=undefined) {
          skip = true;
          var l=seg.l;
          var zi=drawlist.indexOf(seg);
          var _i=0;
          do {
            if (_i++>500) {
                console.trace("infinite loop detected; data corruption?");
                break;
            }
            var f=l.f, style2;
            if (!(f.eid in face_seg_styles)) {
                style2 = face_seg_styles[f.eid] = get_stroke(f);
            }
            else {
              style2 = face_seg_styles[f.eid];
            }
            skip = skip&&style2==style&&drawlist.indexOf(f)<=zi;
            l = l.radial_next;
          } while (l!=seg.l);
          
      }
      if (skip)
        return ;
      buf+="<path fill=\"none\" "+style+" d=\"";
      var co=transform(seg.evaluate(0));
      buf+="M"+co[0]+" "+co[1];
      save(seg, 0, 1);
      buf+="\" />\n";
    }
    var __iter_item=__get_iter(spline.drawlist);
    var item;
    while (1) {
      var __ival_item=__iter_item.next();
      if (__ival_item.done) {
          break;
      }
      item = __ival_item.value;
      if (item.type==SplineTypes.FACE)
        export_face(item);
      else 
        if (item.type==SplineTypes.SEGMENT)
        export_segment(item);
    }
    buf+="</svg>";
    let ret=new Uint8Array(buf.length);
    for (let i=0; i<buf.length; i++) {
        ret[i] = buf.charCodeAt(i);
    }
    return ret;
  }
  export_svg = _es6_module.add_export('export_svg', export_svg);
}, '/dev/cleanfairmotion/src/core/svg_export.js');
es6_module_define('curve', ["curvebase"], function _curve_module(_es6_module) {
  "use strict";
  var $rets_vcXK_derivative;
  var $rets_3ume_normal;
  var ClothoidInterface=_ESClass("ClothoidInterface", [_ESClass.static(function evaluate(p1, p2, t1, t2, k1, k2, s, cdata) {
  }), _ESClass.static(function derivative(p1, p2, t1, t2, k1, k2, s, cdata) {
    var df=0.0001;
    var a=this.evaluate(p1, p2, t1, t2, k1, k2, s, cdata);
    var b=this.evaluate(p1, p2, t1, t2, k1, k2, s+df, cdata);
    b.sub(a).mulScalar(1.0/df);
    return $rets_vcXK_derivative.next().load(b);
  }), _ESClass.static(function normal(p1, p2, t1, t2, k1, k2, s, cdata) {
    var df=0.0001;
    var a=this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
    var b=this.derivative(p1, p2, t1, t2, k1, k2, s+df, cdata);
    b.sub(a).mulScalar(1.0/df);
    return $rets_3ume_normal.next().load(b);
  }), _ESClass.static(function curvature(p1, p2, t1, t2, k1, k2, s, cdata) {
    var dv1=this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
    var dv2=this.normal(p1, p2, t1, t2, k1, k2, s, cdata);
    return (dv1[0]*dv2[1]-dv2[1]*dv1[0])/Math.pow(dv1.dot(dv1), 3.0/2.0);
  }), _ESClass.static(function curvature_dv(p1, p2, t1, t2, k1, k2, s, cdata) {
    var df=0.0001;
    var a=this.curvature(p1, p2, t1, t2, k1, k2, s, cdata);
    var b=this.curvature(p1, p2, t1, t2, k1, k2, s+df, cdata);
    return (b-a)/df;
  }), _ESClass.static(function curvature_dv2(p1, p2, t1, t2, k1, k2, s, cdata) {
    var df=0.0001;
    var a=this.curvature_dv(p1, p2, t1, t2, k1, k2, s, cdata);
    var b=this.curvature_dv(p1, p2, t1, t2, k1, k2, s+df, cdata);
    return (b-a)/df;
  }), _ESClass.static(function closest_point(p1, p2, t1, t2, k1, k2, p, cdata) {
  }), _ESClass.static(function update(p1, p2, t1, t2, k1, k2, s, cdata) {
  }), function ClothoidInterface() {
  }]);
  var $rets_vcXK_derivative=cachering.fromConstructor(Vector2, 16);
  var $rets_3ume_normal=cachering.fromConstructor(Vector2, 16);
  _es6_module.add_class(ClothoidInterface);
  var CurveInterfaces=es6_import_item(_es6_module, 'curvebase', 'CurveInterfaces');
  var CurveTypes=es6_import_item(_es6_module, 'curvebase', 'CurveTypes');
  CurveInterfaces[CurveTypes.CLOTHOID] = ClothoidInterface;
}, '/dev/cleanfairmotion/src/curve/curve.js');
es6_module_define('curvebase', [], function _curvebase_module(_es6_module) {
  var CurveTypes={CLOTHOID: 1}
  CurveTypes = _es6_module.add_export('CurveTypes', CurveTypes);
  var CurveFlags={SELECT: 1, UPDATE: 2}
  CurveFlags = _es6_module.add_export('CurveFlags', CurveFlags);
  var CurveInterfaces={}
  CurveInterfaces = _es6_module.add_export('CurveInterfaces', CurveInterfaces);
  var CurveData=_ESClass("CurveData", [function CurveData(type) {
    this.type = type;
    this.flag = 0;
    this.length = 0;
    this.cfi = CurveInterfaces[type];
  }, function update() {
    this.flag|=CurveFlags.UPDATE;
  }, function copy() {
    var ret=new CurveData(this.type);
    ret.flag = this.flag;
    ret.length = this.length;
    ret.cfi = this.cfi;
    ret.update();
    return ret;
  }]);
  _es6_module.add_class(CurveData);
  CurveData = _es6_module.add_export('CurveData', CurveData);
  var $rets_Snig_derivative;
  var $rets_t4PF_normal;
  var CurveInterface=_ESClass("CurveInterface", [_ESClass.static(function evaluate(p1, p2, t1, t2, k1, k2, s, cdata) {
  }), _ESClass.static(function derivative(p1, p2, t1, t2, k1, k2, s, cdata) {
    var df=0.0001;
    var a=this.evaluate(p1, p2, t1, t2, k1, k2, s, cdata);
    var b=this.evaluate(p1, p2, t1, t2, k1, k2, s+df, cdata);
    b.sub(a).mulScalar(1.0/df);
    return $rets_Snig_derivative.next().load(b);
  }), _ESClass.static(function normal(p1, p2, t1, t2, k1, k2, s, cdata) {
    var df=0.0001;
    var a=this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
    var b=this.derivative(p1, p2, t1, t2, k1, k2, s+df, cdata);
    b.sub(a).mulScalar(1.0/df);
    return $rets_t4PF_normal.next().load(b);
  }), _ESClass.static(function curvature(p1, p2, t1, t2, k1, k2, s, cdata) {
    var dv1=this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
    var dv2=this.normal(p1, p2, t1, t2, k1, k2, s, cdata);
    return (dv1[0]*dv2[1]-dv2[1]*dv1[0])/Math.pow(dv1.dot(dv1), 3.0/2.0);
  }), _ESClass.static(function curvature_dv(p1, p2, t1, t2, k1, k2, s, cdata) {
    var df=0.0001;
    var a=this.curvature(p1, p2, t1, t2, k1, k2, s, cdata);
    var b=this.curvature(p1, p2, t1, t2, k1, k2, s+df, cdata);
    return (b-a)/df;
  }), _ESClass.static(function curvature_dv2(p1, p2, t1, t2, k1, k2, s, cdata) {
    var df=0.0001;
    var a=this.curvature_dv(p1, p2, t1, t2, k1, k2, s, cdata);
    var b=this.curvature_dv(p1, p2, t1, t2, k1, k2, s+df, cdata);
    return (b-a)/df;
  }), _ESClass.static(function closest_point(p1, p2, t1, t2, k1, k2, p, cdata) {
  }), _ESClass.static(function update(p1, p2, t1, t2, k1, k2, s, cdata) {
  }), function CurveInterface() {
  }]);
  var $rets_Snig_derivative=cachering.fromConstructor(Vector2, 16);
  var $rets_t4PF_normal=cachering.fromConstructor(Vector2, 16);
  _es6_module.add_class(CurveInterface);
}, '/dev/cleanfairmotion/src/curve/curvebase.js');
es6_module_define('spline_math', ["spline_math_hermite", "native_api", "config"], function _spline_math_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, 'config');
  var FEPS=1e-18;
  var PI=Math.PI;
  var sin=Math.sin, acos=Math.acos, asin=Math.asin, atan2=Math.atan2, sqrt=Math.sqrt;
  var cos=Math.cos, pow=Math.pow, abs=Math.abs;
  var SPI2=Math.sqrt(PI/2);
  var math=es6_import(_es6_module, 'spline_math_hermite');
  var spiraltheta=math.spiraltheta;
  spiraltheta = _es6_module.add_export('spiraltheta', spiraltheta);
  var spiralcurvature=math.spiralcurvature;
  spiralcurvature = _es6_module.add_export('spiralcurvature', spiralcurvature);
  var spiralcurvature_dv=math.spiralcurvature_dv;
  spiralcurvature_dv = _es6_module.add_export('spiralcurvature_dv', spiralcurvature_dv);
  var approx=math.approx;
  approx = _es6_module.add_export('approx', approx);
  var INT_STEPS=math.INT_STEPS;
  INT_STEPS = _es6_module.add_export('INT_STEPS', INT_STEPS);
  var ORDER=math.ORDER;
  ORDER = _es6_module.add_export('ORDER', ORDER);
  var DISABLE_SOLVE=es6_import_item(_es6_module, 'config', 'DISABLE_SOLVE');
  function do_solve_nacl(sflags, spline, steps, gk, return_promise) {
    if (DISABLE_SOLVE)
      return ;
    if (window.common!=undefined&&window.common.naclModule!=undefined) {
        var draw_id=window.push_solve(spline);
        return window.nacl_do_solve(sflags, spline, steps, gk, return_promise, draw_id);
    }
    else {
      return math.do_solve.apply(this, arguments);
    }
  }
  var native_api=es6_import(_es6_module, 'native_api');
  function do_solve() {
    if (config.USE_NACL) {
        return do_solve_nacl.apply(this, arguments);
    }
    else 
      if (config.USE_WASM&&native_api.isReady()) {
        return native_api.do_solve.apply(this, arguments);
    }
    else {
      return math.do_solve.apply(this, arguments);
    }
  }
  do_solve = _es6_module.add_export('do_solve', do_solve);
  var KSCALE=ORDER+1;
  KSCALE = _es6_module.add_export('KSCALE', KSCALE);
  var KANGLE=ORDER+2;
  KANGLE = _es6_module.add_export('KANGLE', KANGLE);
  var KSTARTX=ORDER+3;
  KSTARTX = _es6_module.add_export('KSTARTX', KSTARTX);
  var KSTARTY=ORDER+4;
  KSTARTY = _es6_module.add_export('KSTARTY', KSTARTY);
  var KSTARTZ=ORDER+5;
  KSTARTZ = _es6_module.add_export('KSTARTZ', KSTARTZ);
  var KTOTKS=ORDER+6;
  KTOTKS = _es6_module.add_export('KTOTKS', KTOTKS);
  var eval_curve_vs=cachering.fromConstructor(Vector3, 64);
  var _eval_start=eval_curve_vs.next();
  function eval_curve(s, v1, v2, ks, order, angle_only, no_update) {
    var start=_eval_start;
    if (order==undefined)
      order = ORDER;
    s*=0.99999999;
    var eps=1e-09;
    var ang, scale, start;
    if (!no_update) {
        var start=approx(-0.5+eps, ks, order);
        var end=approx(0.5-eps, ks, order);
        end.sub(start);
        var a1=atan2(end[0], end[1]);
        var vec=eval_curve_vs.next();
        vec.load(v2).sub(v1);
        var a2=atan2(vec[0], vec[1]);
        ang = a2-a1;
        scale = vec.vectorLength()/end.vectorLength();
        ks[KSCALE] = scale;
        ks[KANGLE] = ang;
        ks[KSTARTX] = start[0];
        ks[KSTARTY] = start[1];
        ks[KSTARTZ] = start[2];
    }
    else {
      ang = ks[KANGLE];
      scale = ks[KSCALE];
      start[0] = ks[KSTARTX];
      start[1] = ks[KSTARTY];
      start[2] = ks[KSTARTZ];
    }
    if (!angle_only) {
        var co=approx(s, ks, order);
        co.sub(start).rot2d(-ang).mulScalar(scale).add(v1);
        return co;
    }
  }
  eval_curve = _es6_module.add_export('eval_curve', eval_curve);
  
}, '/dev/cleanfairmotion/src/curve/spline_math.js');
es6_module_define('spline_math_hermite', ["toolops_api", "solver", "J3DIMath", "spline_base"], function _spline_math_hermite_module(_es6_module) {
  "use strict";
  var SplineFlags=es6_import_item(_es6_module, 'spline_base', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_base', 'SplineTypes');
  var solver=es6_import_item(_es6_module, 'solver', 'solver');
  var constraint=es6_import_item(_es6_module, 'solver', 'constraint');
  var ModalStates=es6_import_item(_es6_module, 'toolops_api', 'ModalStates');
  var FEPS=1e-18;
  var PI=Math.PI;
  var sin=Math.sin, acos=Math.acos, asin=Math.asin, atan2=Math.atan2, sqrt=Math.sqrt;
  var cos=Math.cos, pow=Math.pow, abs=Math.abs;
  var SPI2=Math.sqrt(PI/2);
  var INCREMENTAL=true;
  var ORDER=4;
  ORDER = _es6_module.add_export('ORDER', ORDER);
  var KSCALE=ORDER+1;
  KSCALE = _es6_module.add_export('KSCALE', KSCALE);
  var KANGLE=ORDER+2;
  KANGLE = _es6_module.add_export('KANGLE', KANGLE);
  var KSTARTX=ORDER+3;
  KSTARTX = _es6_module.add_export('KSTARTX', KSTARTX);
  var KSTARTY=ORDER+4;
  KSTARTY = _es6_module.add_export('KSTARTY', KSTARTY);
  var KSTARTZ=ORDER+5;
  KSTARTZ = _es6_module.add_export('KSTARTZ', KSTARTZ);
  var KTOTKS=ORDER+6;
  KTOTKS = _es6_module.add_export('KTOTKS', KTOTKS);
  var INT_STEPS=4;
  INT_STEPS = _es6_module.add_export('INT_STEPS', INT_STEPS);
  function set_int_steps(steps) {
    INT_STEPS = steps;
  }
  set_int_steps = _es6_module.add_export('set_int_steps', set_int_steps);
  function get_int_steps(steps) {
    return INT_STEPS;
  }
  get_int_steps = _es6_module.add_export('get_int_steps', get_int_steps);
  var _approx_cache_vs=cachering.fromConstructor(Vector3, 32);
  var mmax=Math.max, mmin=Math.min;
  var mfloor=Math.floor, mceil=Math.ceil, abs=Math.abs, sqrt=Math.sqrt, sin=Math.sin, cos=Math.cos;
  var polytheta_spower=function polytheta_spower(s, ks, order) {
    var s2=s*s, s3=s2*s, s4=s3*s, s5=s4*s, s6=s5*s, s7=s6*s, s8=s7*s, s9=s8*s;
    switch (order) {
      case 2:
        var k1=ks[0], k2=ks[1];
        return (-((s-2)*k1-k2*s)*s)/2.0;
      case 4:
        var k1=ks[0], dv1_k1=ks[1], dv1_k2=ks[2], k2=ks[3];
        return (((((3*s-4)*dv1_k2-6*(s-2)*k2)*s+(3*s2-8*s+6)*dv1_k1)*s+6*(s3-2*s2+2)*k1)*s)/12;
      case 6:
        var k1=ks[0], dv1_k1=ks[1], dv2_k1=ks[2], dv2_k2=ks[3], dv1_k2=ks[4], k2=ks[5];
        return (-((((60*dv1_k2*s2-168*dv1_k2*s+120*dv1_k2-10*dv2_k2*s2+24*dv2_k2*s-15*dv2_k2-120*k2*s2+360*k2*s-300*k2)*s+(10*s3-36*s2+45*s-20)*dv2_k1)*s+12*(5*s4-16*s3+15*s2-5)*dv1_k1)*s+60*(2*s5-6*s4+5*s3-2)*k1)*s)/120;
    }
  }
  var polycurvature_spower=function polycurvature_spower(s, ks, order) {
    var k1=ks[0], dv1_k1=ks[1], dv2_k1=ks[2], dv2_k2=ks[3], dv1_k2=ks[4], k2=ks[5];
    var s2=s*s, s3=s2*s, s4=s3*s, s5=s4*s, s6=s5*s, s7=s6*s, s8=s7*s, s9=s8*s;
    switch (order) {
      case 2:
        var k1=ks[0], k2=ks[1];
        return -((s-1)*k1-k2*s);
      case 4:
        var k1=ks[0], dv1_k1=ks[1], dv1_k2=ks[2], k2=ks[3];
        return (((s-1)*dv1_k1+dv1_k2*s)*(s-1)-(2*s-3)*k2*s)*s+(2*s+1)*(s-1)*(s-1)*k1;
      case 6:
        return (-((((((s-1)*dv2_k1-dv2_k2*s)*(s-1)+2*(3*s-4)*dv1_k2*s)*s+2*(3*s+1)*(s-1)*(s-1)*dv1_k1)*(s-1)-2*(6*s2-15*s+10)*k2*s2)*s+2*(6*s2+3*s+1)*(s-1)*(s-1)*(s-1)*k1))/2.0;
    }
  }
  var polycurvature_dv_spower=function polycurvature_spower(s, ks, order) {
    var s2=s*s, s3=s2*s, s4=s3*s, s5=s4*s, s6=s5*s, s7=s6*s, s8=s7*s, s9=s8*s;
    switch (order) {
      case 2:
        var k1=ks[0], k2=ks[1];
        return -(k1-k2);
      case 4:
        var k1=ks[0], dv1_k1=ks[1], dv1_k2=ks[2], k2=ks[3];
        return (6*(k1-k2)*(s-1)+(3*s-2)*dv1_k2)*s+(3*s-1)*(s-1)*dv1_k1;
      case 6:
        var k1=ks[0], dv1_k1=ks[1], dv2_k1=ks[2], dv2_k2=ks[3], dv1_k2=ks[4], k2=ks[5];
        return (-(((2*(30*(k1-k2)*(s-1)*(s-1)+(5*s-6)*(3*s-2)*dv1_k2)-(5*s-3)*(s-1)*dv2_k2)*s+(5*s-2)*(s-1)*(s-1)*dv2_k1)*s+2*(5*s+1)*(3*s-1)*(s-1)*(s-1)*dv1_k1))/2.0;
    }
  }
  var spower_funcs=[polytheta_spower, polycurvature_spower, polycurvature_dv_spower];
  spower_funcs = _es6_module.add_export('spower_funcs', spower_funcs);
  var approx_ret_cache=cachering.fromConstructor(Vector3, 42);
  var abs=Math.abs;
  var mmax=Math.max, mmin=Math.min;
  es6_import(_es6_module, 'J3DIMath');
  var acache=[new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3()];
  var acur=0;
  var eval_curve_vs=cachering.fromConstructor(Vector3, 64);
  var _eval_start=new Vector3();
  function approx(s1, ks, order, dis, steps) {
    s1*=1.0-1e-07;
    if (steps==undefined)
      steps = INT_STEPS;
    var s=0, ds=s1/steps;
    var ds2=ds*ds, ds3=ds2*ds, ds4=ds3*ds;
    var ret=approx_ret_cache.next();
    ret[0] = ret[1] = ret[2] = 0.0;
    var x=0, y=0;
    var k1=ks[0], dv1_k1=ks[1], dv1_k2=ks[2], k2=ks[3];
    for (var i=0; i<steps; i++) {
        var st=s+0.5;
        var s2=st*st, s3=st*st*st, s4=s2*s2, s5=s4*st, s6=s5*st, s7=s6*st, s8=s7*st, s9=s8*st, s10=s9*st;
        var th=(((((3*st-4)*dv1_k2-6*(st-2)*k2)*st+(3*s2-8*st+6)*dv1_k1)*st+6*(s3-2*s2+2)*k1)*st)/12;
        var dx=sin(th), dy=cos(th);
        var kt=(((st-1)*dv1_k1+dv1_k2*st)*(st-1)-(2*st-3)*k2*st)*st+(2*st+1)*(st-1)*(st-1)*k1;
        var dkt=(6*(k1-k2)*(st-1)+(3*st-2)*dv1_k2)*st+(3*st-1)*(st-1)*dv1_k1;
        var dk2t=(6*(k1-k2)*((st+0.0001)-1)+(3*(st+0.0001)-2)*dv1_k2)*(st+0.0001)+(3*(st+0.0001)-1)*((st+0.0001)-1)*dv1_k1;
        dk2t = (dk2t-dkt)/(0.0001);
        var kt2=kt*kt, kt3=kt*kt*kt;
        x+=((5*(4*((dy*dkt-kt2*dx)*ds2+3*(dy*kt*ds+2*dx))+((dk2t-kt3)*dy-3*dkt*kt*dx)*ds3)-(((4*dk2t-kt3)*kt+3*dkt*dkt)*dx+6*dy*dkt*kt2)*ds4)*ds)/120;
        y+=(-(5*(4*((dy*kt2+dkt*dx)*ds2-3*(2*dy-kt*dx*ds))+((dk2t-kt3)*dx+3*dy*dkt*kt)*ds3)+(((4*dk2t-kt3)*kt+3*dkt*dkt)*dy-6*dkt*kt2*dx)*ds4)*ds)/120;
        s+=ds;
    }
    ret[0] = x;
    ret[1] = y;
    return ret;
  }
  approx = _es6_module.add_export('approx', approx);
  var spiraltheta=polytheta_spower;
  spiraltheta = _es6_module.add_export('spiraltheta', spiraltheta);
  var spiralcurvature=polycurvature_spower;
  spiralcurvature = _es6_module.add_export('spiralcurvature', spiralcurvature);
  var spiralcurvature_dv=polycurvature_dv_spower;
  spiralcurvature_dv = _es6_module.add_export('spiralcurvature_dv', spiralcurvature_dv);
  var ORDER=4;
  ORDER = _es6_module.add_export('ORDER', ORDER);
  var $con_cache_1lHW_build_solver={list: [], used: 0}
  function build_solver(spline, order, goal_order, gk, do_basic, update_verts) {
    var slv=new solver();
    $con_cache_1lHW_build_solver.used = 0;
    if (order==undefined)
      order = ORDER;
    if (gk==undefined)
      gk = 1.0;
    var UPDATE=SplineFlags.UPDATE;
    for (var i=0; INCREMENTAL&&i<spline.segments.length; i++) {
        var seg=spline.segments[i];
        var edge_seg=(seg.v1.flag&UPDATE)!=(seg.v2.flag&UPDATE);
        var ok=false;
        for (var j=0; j<2; j++) {
            var v=j ? seg.v2 : seg.v1;
            for (var k=0; !ok&&k<v.segments.length; k++) {
                var seg2=v.segments[k];
                ok = ok||((seg2.v1.flag&UPDATE)&&(seg2.v2.flag&UPDATE));
            }
        }
        edge_seg = edge_seg&&ok;
        if (edge_seg) {
            for (var j=0; j<KTOTKS; j++) {
                seg._last_ks[j] = seg.ks[j];
            }
            seg.flag|=SplineFlags.TEMP_TAG;
            slv.edge_segs.push(seg);
            var s2=undefined, s3=undefined;
            if (seg.v1.segments.length==2)
              s2 = seg.v1.other_segment(seg);
            if (seg.v2.segments.length==2)
              s3 = seg.v2.other_segment(seg);
        }
        else {
          seg.flag&=~SplineFlags.TEMP_TAG;
        }
    }
    function hard_tan_c(params) {
      var seg=params[0], tan=params[1], s=params[2];
      var dv=seg.derivative(s, order, undefined, true);
      dv.normalize();
      var a1=Math.atan2(tan[0], tan[1]);
      var a2=Math.atan2(dv[0], dv[1]);
      var diff=Math.abs(a1-a2);
      return abs(dv.vectorDistance(tan));
    }
    function tan_c(params) {
      var seg1=params[0], seg2=params[1];
      var v, s1=0, s2=0;
      if (seg1.v1==seg2.v1||seg1.v1==seg2.v2)
        v = seg1.v1;
      else 
        if (seg1.v2==seg2.v1||seg1.v2==seg2.v2)
        v = seg1.v2;
      else 
        console.trace("EVIL INCARNATE!");
      var eps=0.0001;
      s1 = v==seg1.v1 ? eps : 1.0-eps;
      s2 = v==seg2.v1 ? eps : 1.0-eps;
      var t1=seg1.derivative(s1, order, undefined, true);
      var t2=seg2.derivative(s2, order, undefined, true);
      t1.normalize();
      t2.normalize();
      if (seg1.v1.eid==seg2.v1.eid||seg1.v2.eid==seg2.v2.eid) {
          t1.negate();
      }
      var d=t1.dot(t2);
      d = mmax(mmin(d, 1.0), -1.0);
      return acos(d);
      var ret=abs(t1.vectorDistance(t2));
      return ret;
    }
    function handle_curv_c(params) {
      if (order<4)
        return 0;
      var seg1=params[0], seg2=params[1];
      var h1=params[2], h2=params[3];
      var len1=seg1.ks[KSCALE]-h1.vectorDistance(seg1.handle_vertex(h1));
      var len2=seg2.ks[KSCALE]-h2.vectorDistance(seg2.handle_vertex(h2));
      var k1i=h1==seg1.h1 ? 1 : order-2;
      var k2i=h2==seg2.h1 ? 1 : order-2;
      var k1=(len1!=0.0 ? 1.0/len1 : 0.0)*seg1.ks[KSCALE];
      var k2=(len2!=0.0 ? 1.0/len2 : 0.0)*seg2.ks[KSCALE];
      var s1=seg1.ks[k1i]<0.0 ? -1 : 1;
      var s2=seg2.ks[k2i]<0.0 ? -1 : 1;
      if (isNaN(k1)||isNaN(k2)) {
          console.log("NaN 2!");
          return 0;
      }
      console.log(k1, k2);
      if (abs(seg1.ks[k1i])<k1)
        seg1.ks[k1i] = k1*s1;
      if (abs(seg2.ks[k2i])<k2)
        seg2.ks[k2i] = k2*s2;
      return 0;
    }
    function copy_c(params) {
      var v=params[1], seg=params[0];
      var s1=v===seg.v1 ? 0 : order-1;
      var s2=v===seg.v1 ? order-1 : 0;
      seg.ks[s1]+=(seg.ks[s2]-seg.ks[s1])*gk*0.5;
      return 0.0;
    }
    function get_ratio(seg1, seg2) {
      var ratio=seg1.ks[KSCALE]/seg2.ks[KSCALE];
      if (seg2.ks[KSCALE]==0.0) {
          return 100000.0;
      }
      if (ratio>1.0)
        ratio = 1.0/ratio;
      if (isNaN(ratio)) {
          console.log("NaN 3!");
          ratio = 0.5;
      }
      return Math.pow(ratio, 2.0);
    }
    function curv_c_spower(params) {
      var seg1=params[0], seg2=params[1];
      var v, s1, s2;
      seg1.evaluate(0.5);
      seg2.evaluate(0.5);
      if (seg1.v1==seg2.v1||seg1.v1==seg2.v2)
        v = seg1.v1;
      else 
        if (seg1.v2==seg2.v1||seg1.v2==seg2.v2)
        v = seg1.v2;
      else 
        console.trace("EVIL INCARNATE!");
      var ratio=get_ratio(seg1, seg2);
      var mfac=ratio*gk*0.7;
      var s1=v===seg1.v1 ? 0 : order-1;
      var s2=v===seg2.v1 ? 0 : order-1;
      var sz1=seg1.ks[KSCALE];
      var sz2=seg2.ks[KSCALE];
      var k2sign=s1==s2 ? -1.0 : 1.0;
      var ret=0.0;
      for (var i=0; i<1; i++) {
          var s1=v===seg1.v1 ? i : order-1-i;
          var s2=v===seg2.v1 ? i : order-1-i;
          var k1=seg1.ks[s1]/sz1;
          var k2=k2sign*seg2.ks[s2]/sz2;
          var goalk=(k1+k2)*0.5;
          ret+=abs(k1-goalk)+abs(k2-goalk);
          seg1.ks[s1]+=(goalk*sz1-seg1.ks[s1])*mfac;
          seg2.ks[s2]+=(k2sign*goalk*sz2-seg2.ks[s2])*mfac;
      }
      return ret*5.0;
    }
    function curv_c_spower_basic(params) {
      var seg1=params[0], seg2=params[1];
      var v, s1=0, s2=0;
      seg1.evaluate(0.5);
      seg2.evaluate(0.5);
      if (seg1.v1==seg2.v1||seg1.v1==seg2.v2)
        v = seg1.v1;
      else 
        if (seg1.v2==seg2.v1||seg1.v2==seg2.v2)
        v = seg1.v2;
      else 
        console.trace("EVIL INCARNATE!");
      var ratio=get_ratio(seg1, seg2);
      var mfac=ratio*gk*0.7;
      var s1=v===seg1.v1 ? 0 : order-1;
      var s2=v===seg2.v1 ? 0 : order-1;
      var sz1=seg1.ks[KSCALE];
      var sz2=seg2.ks[KSCALE];
      var k2sign=s1==s2 ? -1.0 : 1.0;
      var ret=0.0;
      var len=Math.floor(order/2);
      for (var i=0; i<1; i++) {
          var s1=v===seg1.v1 ? i : order-1-i;
          var s2=v===seg2.v1 ? i : order-1-i;
          var k1=seg1.ks[s1]/sz1;
          var k2=k2sign*seg2.ks[s2]/sz2;
          var goalk=(k1+k2)*0.5;
          ret+=abs(k1-goalk)+abs(k2-goalk);
          if (i==0) {
              seg1.ks[s1]+=(goalk*sz1-seg1.ks[s1])*mfac;
              seg2.ks[s2]+=(k2sign*goalk*sz2-seg2.ks[s2])*mfac;
          }
          else 
            if (i==1) {
              seg1.ks[s1] = seg1.ks[order-1]-seg1.ks[0];
              seg2.ks[s2] = seg2.ks[order-1]-seg2.ks[0];
          }
          else {
            seg1.ks[s1] = seg2.ks[s2] = 0.0;
          }
      }
      return ret;
    }
    var curv_c=do_basic ? curv_c_spower_basic : curv_c_spower;
    for (var i=0; i<spline.handles.length; i++) {
        var h=spline.handles[i];
        if (!h.use)
          continue;
        var seg=h.segments[0];
        if (seg.v1.vectorDistance(seg.v2)<2)
          continue;
        var v=seg.handle_vertex(h);
        if (INCREMENTAL&&!((v.flag)&SplineFlags.UPDATE))
          continue;
        var tan1=new Vector3(h).sub(seg.handle_vertex(h)).normalize();
        if (h==seg.h2)
          tan1.negate();
        if (isNaN(tan1.dot(tan1))||tan1.dot(tan1)==0.0) {
            console.log("NaN 4!");
            continue;
        }
        var s=h==seg.h1 ? 0 : 1;
        var do_curv=(v.flag&SplineFlags.BREAK_CURVATURES);
        if (h.owning_vertex==undefined)
          continue;
        var do_tan=!((h.flag)&SplineFlags.BREAK_TANGENTS);
        do_tan = do_tan&&!(h.flag&SplineFlags.AUTO_PAIRED_HANDLE);
        if (do_tan) {
            var tc=new constraint("hard_tan_c", 0.25, [seg.ks], order, hard_tan_c, [seg, tan1, s]);
            tc.k2 = 1.0;
            if (update_verts)
              update_verts.add(h);
            slv.add(tc);
        }
        if (h.hpair==undefined)
          continue;
        var ss1=seg, h2=h.hpair, ss2=h2.owning_segment;
        if ((h.flag&SplineFlags.AUTO_PAIRED_HANDLE)&&!((seg.handle_vertex(h).flag&SplineFlags.BREAK_TANGENTS))) {
            var tc=new constraint("tan_c", 0.3, [ss1.ks, ss2.ks], order, tan_c, [ss1, ss2]);
            tc.k2 = 0.8;
            if (update_verts)
              update_verts.add(h);
            slv.add(tc);
        }
        var cc=new constraint("curv_c", 1, [ss1.ks], order, curv_c, [ss1, ss2, h, h2]);
        slv.add(cc);
        var cc=new constraint("curv_c", 1, [ss2.ks], order, curv_c, [ss1, ss2, h, h2]);
        slv.add(cc);
        if (update_verts)
          update_verts.add(h);
    }
    var limits={v_curve_limit: 12, v_tan_limit: 1}
    var manual_w=0.08;
    var manual_w_2=0.6;
    for (var i=0; i<spline.verts.length; i++) {
        var v=spline.verts[i];
        if (v.segments.length!=1)
          continue;
        if (!(v.flag&SplineFlags.USE_HANDLES))
          continue;
        var ss1=v.segments[0];
        var h=ss1.handle(v);
        var tan=new Vector3(h).sub(v).normalize();
        var s=v===ss1.v1 ? 0.0 : 1.0;
        if (v===ss1.v2) {
            tan.negate();
        }
        var tc=new constraint("hard_tan_c", manual_w, [ss1.ks], order, hard_tan_c, [ss1, tan, s]);
        tc.k2 = manual_w_2;
        slv.add(tc);
        if (update_verts)
          update_verts.add(v);
    }
    for (var i=0; i<spline.verts.length; i++) {
        var v=spline.verts[i];
        if (INCREMENTAL&&!(v.flag&SplineFlags.UPDATE))
          continue;
        if (v.segments.length==1&&!(v.flag&SplineFlags.BREAK_CURVATURES)) {
            var seg=v.segments[0];
        }
        if (v.segments.length!=2)
          continue;
        var ss1=v.segments[0], ss2=v.segments[1];
        var bad=false;
        for (var j=0; j<v.segments.length; j++) {
            var seg=v.segments[j];
            if (seg.v1.vectorDistance(seg.v2)<2) {
                bad = true;
            }
        }
        var mindis=Math.min(ss1.other_vert(v).vectorDistance(v), ss2.other_vert(v).vectorDistance(v));
        var maxdis=Math.max(ss1.other_vert(v).vectorDistance(v), ss2.other_vert(v).vectorDistance(v));
        if (mindis==0.0) {
        }
        else {
        }
        if (bad&&DEBUG.degenerate_geometry) {
            console.log("Ignoring!");
        }
        if (bad)
          continue;
        if (!(v.flag&(SplineFlags.BREAK_TANGENTS|SplineFlags.USE_HANDLES))) {
            var tc=new constraint("tan_c", 0.5, [ss2.ks], order, tan_c, [ss1, ss2]);
            tc.k2 = 0.8;
            slv.add(tc);
            var tc=new constraint("tan_c", 0.5, [ss1.ks], order, tan_c, [ss2, ss1]);
            tc.k2 = 0.8;
            slv.add(tc);
            if (update_verts)
              update_verts.add(v);
        }
        else 
          if (!(v.flag&SplineFlags.BREAK_TANGENTS)) {
            var h=ss1.handle(v);
            var tan=new Vector3(h).sub(v).normalize();
            var s=v===ss1.v1 ? 0.0 : 1.0;
            if (v===ss1.v2) {
                tan.negate();
            }
            var tc=new constraint("hard_tan_c", manual_w, [ss1.ks], order, hard_tan_c, [ss1, tan, s]);
            tc.k2 = manual_w_2;
            slv.add(tc);
            var h=ss2.handle(v);
            var tan=new Vector3(h).sub(v).normalize();
            var s=v===ss2.v1 ? 0.0 : 1.0;
            if (v===ss2.v2) {
                tan.negate();
            }
            var tc=new constraint("hard_tan_c", manual_w, [ss2.ks], order, hard_tan_c, [ss2, tan, s]);
            tc.k2 = manual_w_2;
            slv.add(tc);
            if (update_verts)
              update_verts.add(v);
        }
        else {
          continue;
        }
        if (v.flag&SplineFlags.BREAK_CURVATURES)
          continue;
        if (mindis==0.0) {
            bad = true;
        }
        else {
          bad = bad||maxdis/mindis>9.0;
        }
        if (bad)
          continue;
        var cc=new constraint("curv_c", 1, [ss1.ks], order, curv_c, [ss1, ss2]);
        slv.add(cc);
        var cc=new constraint("curv_c", 1, [ss2.ks], order, curv_c, [ss2, ss1]);
        slv.add(cc);
        if (update_verts)
          update_verts.add(v);
    }
    return slv;
  }
  build_solver = _es6_module.add_export('build_solver', build_solver);
  function solve_intern(spline, order, goal_order, steps, gk, do_basic) {
    if (order==undefined) {
        order = ORDER;
    }
    if (goal_order==undefined) {
        goal_order = ORDER;
    }
    if (steps==undefined) {
        steps = 65;
    }
    if (gk==undefined) {
        gk = 1.0;
    }
    if (do_basic==undefined) {
        do_basic = false;
    }
    var start_time=time_ms();
    window._SOLVING = true;
    var slv=build_solver(spline, order, goal_order, gk, do_basic);
    var totsteps=slv.solve(steps, gk, order==ORDER, slv.edge_segs);
    window._SOLVING = false;
    for (var i=0; i<spline.segments.length; i++) {
        var seg=spline.segments[i];
        seg.evaluate(0.5, undefined, undefined, undefined, true);
    }
    var end_time=time_ms()-start_time;
    if (end_time>50)
      console.log("solve time", end_time.toFixed(2), "ms", "steps", totsteps);
  }
  function do_solve(splineflags, spline, steps, gk) {
    spline.propagate_update_flags();
    for (var i=0; i<spline.segments.length; i++) {
        var seg=spline.segments[i];
        if (INCREMENTAL&&(!(seg.v1.flag&SplineFlags.UPDATE)||!(seg.v2.flag&SplineFlags.UPDATE)))
          continue;
        for (var j=0; j<seg.ks.length; j++) {
            seg.ks[j] = 1e-06;
        }
        seg.evaluate(0.5, undefined, undefined, undefined, true);
    }
    spline.resolve = 0;
    solve_intern(spline, ORDER, undefined, 65, 1, 0);
    for (var i=0; i<spline.segments.length; i++) {
        var seg=spline.segments[i];
        seg.evaluate(0.5, undefined, undefined, undefined, true);
        for (var j=0; j<seg.ks.length; j++) {
            if (isNaN(seg.ks[j])) {
                console.log("NaN 1!");
                seg.ks[j] = 0;
            }
        }
        if (g_app_state.modalstate!=ModalStates.TRANSFROMING) {
            if ((seg.v1.flag&SplineFlags.UPDATE)||(seg.v2.flag&SplineFlags.UPDATE))
              seg.update_aabb();
        }
    }
    var __iter_f=__get_iter(spline.faces);
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      var __iter_path=__get_iter(f.paths);
      var path;
      while (1) {
        var __ival_path=__iter_path.next();
        if (__ival_path.done) {
            break;
        }
        path = __ival_path.value;
        var __iter_l=__get_iter(path);
        var l;
        while (1) {
          var __ival_l=__iter_l.next();
          if (__ival_l.done) {
              break;
          }
          l = __ival_l.value;
          if (l.v.flag&SplineFlags.UPDATE)
            f.flag|=SplineFlags.UPDATE_AABB;
        }
      }
    }
    if (!spline.is_anim_path) {
        for (var i=0; i<spline.handles.length; i++) {
            var h=spline.handles[i];
            h.flag&=~(SplineFlags.UPDATE|SplineFlags.TEMP_TAG);
        }
        for (var i=0; i<spline.verts.length; i++) {
            var v=spline.verts[i];
            v.flag&=~(SplineFlags.UPDATE|SplineFlags.TEMP_TAG);
        }
    }
    if (spline.on_resolve!=undefined) {
        spline.on_resolve();
        spline.on_resolve = undefined;
    }
  }
  do_solve = _es6_module.add_export('do_solve', do_solve);
}, '/dev/cleanfairmotion/src/curve/spline_math_hermite.js');
es6_module_define('spline_element_array', ["spline_types", "eventdag", "struct"], function _spline_element_array_module(_es6_module) {
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var CustomDataLayer=es6_import_item(_es6_module, 'spline_types', 'CustomDataLayer');
  var CustomData=es6_import_item(_es6_module, 'spline_types', 'CustomData');
  var CustomDataSet=es6_import_item(_es6_module, 'spline_types', 'CustomDataSet');
  var DataPathNode=es6_import_item(_es6_module, 'eventdag', 'DataPathNode');
  var SplineLayerFlags={HIDE: 2, CAN_SELECT: 4, MASK: 8}
  SplineLayerFlags = _es6_module.add_export('SplineLayerFlags', SplineLayerFlags);
  var SplineLayer=_ESClass("SplineLayer", set, [function SplineLayer(elements) {
    if (elements==undefined) {
        elements = undefined;
    }
    set.call(this, elements);
    this.id = -1;
    this.order = 0;
    this.flag = 0;
    this.name = "unnamed";
  }, function add(e) {
    if (e==undefined) {
        console.trace("WARNING: e was undefined in SplineLayer.add");
        return ;
    }
    set.prototype.add.call(this, e);
    e.layers[this.id] = 1;
  }, function remove(e) {
    set.prototype.remove.call(this, e);
    delete e.layers[this.id];
  }, function _to_EIDs() {
    var ret=[];
    var __iter_e=__get_iter(this);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      ret.push(e.eid);
    }
    return ret;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new SplineLayer();
    reader(ret);
    return ret;
  }), function afterSTRUCT(spline) {
    if (this.eids===undefined)
      return ;
    var corrupted=false;
    var __iter_eid=__get_iter(this.eids);
    var eid;
    while (1) {
      var __ival_eid=__iter_eid.next();
      if (__ival_eid.done) {
          break;
      }
      eid = __ival_eid.value;
      var e=spline.eidmap[eid];
      if (e===undefined) {
          corrupted = true;
          continue;
      }
      this.add(e);
    }
    if (corrupted) {
        console.trace("Warning: corrupted layerset!", this, spline, "<==");
    }
    delete this.eids;
  }]);
  _es6_module.add_class(SplineLayer);
  SplineLayer = _es6_module.add_export('SplineLayer', SplineLayer);
  SplineLayer.STRUCT = "\nSplineLayer {\n  id    : int;\n  order : int;\n  flag  : int;\n  eids  : array(int) | obj._to_EIDs();\n  name  : string;\n}\n";
  var SplineLayerSet=_ESClass("SplineLayerSet", Array, [function SplineLayerSet() {
    Array.call(this);
    this.active = undefined;
    this.namemap = {}
    this.idmap = {}
    this.idgen = new SDIDGen();
    this._active = undefined;
    this.flag = 0;
  }, function get(id) {
    if (id==undefined) {
        throw new Error("id cannot be undefined");
    }
    if (!(id in this.idmap)) {
        console.log("WARNING: layer ", id, "not in spline layerset!", this);
        return undefined;
    }
    return this.idmap[id];
  }, _ESClass.get(function active() {
    if (this._active==undefined) {
        this._active = this[0];
    }
    return this._active;
  }), _ESClass.set(function active(val) {
    this._active = val;
  }), function new_layer() {
    var ret=new SplineLayer();
    ret.name = this.new_name();
    ret.id = this.idgen.gen_id();
    this.push(ret);
    return ret;
  }, function new_name() {
    var name="Layer", i=1;
    while ((name+" "+i) in this.namemap) {
      i++;
    }
    return name+" "+i;
  }, function validate_name(layer) {
    if (!(name in this.namemap))
      return ;
    var i=1;
    while ((name+" "+i) in this.namemap) {
      i++;
    }
    layer.name = name+" "+i;
  }, function push(layer) {
    this.validate_name(layer.name);
    this.namemap[layer.name] = layer;
    this.idmap[layer.id] = layer;
    Array.prototype.push.call(this, layer);
    this.update_orders();
    if (this.active==undefined)
      this.active = layer;
  }, function insert(i, layer) {
    this.validate_name(layer.name);
    this.namemap[layer.name] = layer;
    this.idmap[layer.id] = layer;
    Array.prototype.insert.call(this, i, layer);
    this.update_orders();
  }, function change_layer_order(layer, new_i) {
    var start=this.indexOf(layer);
    if (start==undefined) {
        console.trace("Evil error in change_layer_order!", layer, new_i);
        return ;
    }
    if (new_i==start)
      return ;
    var min=Math.min(new_i, start), max=Math.max(new_i, start);
    var diff=max-min;
    idx = start;
    if (start>new_i) {
        for (var i=0; i<diff; i++) {
            if (idx<1)
              break;
            var t=this[idx];
            this[idx] = this[idx-1];
            this[idx-1] = t;
            idx--;
        }
    }
    else {
      for (var i=0; i<diff; i++) {
          if (idx>=this.length-1)
            break;
          var t=this[idx];
          this[idx] = this[idx+1];
          this[idx+1] = t;
          idx++;
      }
    }
    this.update_orders();
  }, function update_orders() {
    for (var i=0; i<this.length; i++) {
        this[i].order = i;
    }
  }, function _new_active(i) {
    if (this.length==0) {
        console.log("WARNING: no layers left, adding a layer!");
        this.new_layer();
        return ;
    }
    i = Math.min(Math.max(0, i), this.length-1);
    this.active = this[i];
  }, function remove(layer) {
    var i=this.indexOf(layer);
    Array.prototype.remove.call(this, layer);
    delete this.namemap[layer.name];
    delete this.idmap[layer.id];
    if (layer==this.active)
      this._new_active(i);
    this.update_orders();
  }, function pop_i(i) {
    var layer=this[i];
    Array.prototype.pop_i.call(this, i);
    delete this.namemap[layer.name];
    delete this.idmap[layer.id];
    if (layer==this.active)
      this._new_active(i);
    this.update_orders();
  }, function pop() {
    var layer=Array.prototype.pop.call(this);
    delete this.namemap[layer.name];
    delete this.idmap[layer.id];
    if (layer==this.active)
      this._new_active(this.length-1);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new SplineLayerSet();
    reader(ret);
    for (var i=0; i<ret._layers.length; i++) {
        ret.push(ret._layers[i]);
        ret._layers[i].order = i;
    }
    ret.active = ret.idmap[ret.active];
    delete ret._layers;
    return ret;
  }), function afterSTRUCT(spline) {
    var __iter_layer=__get_iter(this);
    var layer;
    while (1) {
      var __ival_layer=__iter_layer.next();
      if (__ival_layer.done) {
          break;
      }
      layer = __ival_layer.value;
      layer.afterSTRUCT(spline);
    }
  }]);
  _es6_module.add_class(SplineLayerSet);
  SplineLayerSet = _es6_module.add_export('SplineLayerSet', SplineLayerSet);
  SplineLayerSet.STRUCT = "\n  SplineLayerSet {\n    idgen  : SDIDGen;\n    active : int | obj.active != undefined ? obj.active.id : -1;\n    flag   : int;\n    _layers : array(SplineLayer) | obj;\n  }\n";
  var IterCache=_ESClass("IterCache", [function IterCache(callback, count) {
    if (count==undefined) {
        count = 8;
    }
    this.stack = [];
    this.free = [];
    this.cache = [];
    this.callback = callback;
    for (var i=0; i<count; i++) {
        this.cache.push(callback());
        this.free.push(this.cache[this.cache.length-1]);
    }
  }, function push() {
    if (this.free.length==0) {
        console.log("Error in IterCache!");
        return this.callback();
    }
    for (var i=0; i<this.stack.length; i++) {
        var iter=this.stack[i];
        if (iter.is_done()) {
            this.stack.remove(iter);
            i--;
            this.free.push(iter);
        }
    }
    var iter=this.free.pop();
    this.stack.push(iter);
    return iter;
  }, function pop() {
    this.free.push(this.stack.pop());
  }, _ESClass.static(function fromConstructor(cls, count) {
    return new IterCache(function() {
      return new cls();
    }, count);
  })]);
  _es6_module.add_class(IterCache);
  IterCache = _es6_module.add_export('IterCache', IterCache);
  var EditableIter=_ESClass("EditableIter", [function EditableIter(list, layerset, all_layers) {
    this.init(list, layerset, all_layers);
  }, function init(list, layerset, all_layers) {
    this.list = list;
    this.layerset = layerset;
    this.all_layers = all_layers;
    this.i = 0;
    this.ret = {done: false, value: undefined}
    return this;
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return this;
  }), function reset() {
    this.ret.done = false;
    this.ret.value = undefined;
    this.i = 0;
    return this;
  }, function next() {
    let actlayer=this.layerset.active.id;
    while (this.i<this.list.length) {
      let e=this.list[this.i];
      let ok=!e.hidden;
      ok = ok&&(this.all_layers||actlayer in e.layers);
      if (ok)
        break;
      this.i++;
    }
    if (this.i>=this.list.length) {
        this.ret.done = true;
        this.ret.value = undefined;
        return this.ret;
    }
    this.i++;
    this.ret.done = false;
    this.ret.value = this.list[this.i-1];
    return this.ret;
  }]);
  _es6_module.add_class(EditableIter);
  EditableIter = _es6_module.add_export('EditableIter', EditableIter);
  var SelectedEditableIter=_ESClass("SelectedEditableIter", [function SelectedEditableIter(selset, layerset) {
    this.ret = {done: false, value: undefined}
    this._c = 0;
    if (selset!=undefined) {
        this.init(selset, layerset);
    }
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return this;
  }), function reset() {
    return this.init(this.set, this.layerset);
  }, function init(selset, layerset) {
    this.set = selset;
    this.iter = undefined;
    this.ret.done = false;
    this.layerset = layerset;
    this._c = 0;
    return this;
  }, function is_done() {
    return this.iter==undefined;
  }, function next() {
    if (this.iter==undefined) {
        this.iter = this.set[Symbol.iterator]();
        this.ret.done = false;
    }
    if (this._c++>100000) {
        console.log("infinite loop detected 2!");
        this.ret.done = true;
        this.ret.value = undefined;
        return this.ret;
    }
    var actlayer=this.layerset.active.id;
    function visible(e) {
      return !e.hidden&&actlayer in e.layers;
    }
    ret = undefined;
    var good=false;
    var c=0;
    var iter=this.iter;
    do {
      ret = iter.next();
      if (ret.done)
        break;
      var e=ret.value;
      good = visible(e);
      if (e.type==SplineTypes.HANDLE) {
          good = good||visible(e.owning_segment);
      }
      if (good) {
          this.ret.value = e;
          break;
      }
      ret = iter.next();
      if (c++>100000) {
          console.log("Infinite loop detected!!", ret, iter);
          break;
      }
    } while (!good);
    
    if (good==false) {
        this.ret.done = true;
        this.ret.value = undefined;
        this.iter = undefined;
    }
    return this.ret;
  }]);
  _es6_module.add_class(SelectedEditableIter);
  SelectedEditableIter = _es6_module.add_export('SelectedEditableIter', SelectedEditableIter);
  var SelectedEditableAllLayersIter=_ESClass("SelectedEditableAllLayersIter", [function SelectedEditableAllLayersIter(selset, layerset) {
    this.ret = {done: false, value: undefined}
    this._c = 0;
    if (selset!=undefined) {
        this.init(selset, layerset);
    }
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return this;
  }), function reset() {
    return this.init(this.set, this.layerset);
  }, function init(selset, layerset) {
    this.set = selset;
    this.iter = undefined;
    this.ret.done = false;
    this.layerset = layerset;
    this._c = 0;
    return this;
  }, function is_done() {
    return this.iter==undefined;
  }, function next() {
    if (this.iter==undefined) {
        this.iter = this.set[Symbol.iterator]();
        this.ret.done = false;
    }
    if (this._c++>100000) {
        console.log("infinite loop detected 2!");
        this.ret.done = true;
        this.ret.value = undefined;
        return this.ret;
    }
    var actlayer=this.layerset.active.id;
    function visible(e) {
      return !e.hidden;
    }
    ret = undefined;
    var good=false;
    var c=0;
    var iter=this.iter;
    do {
      ret = iter.next();
      if (ret.done)
        break;
      var e=ret.value;
      good = visible(e);
      if (e.type==SplineTypes.HANDLE) {
          good = good||visible(e.owning_segment);
      }
      if (good) {
          this.ret.value = e;
          break;
      }
      ret = iter.next();
      if (c++>100000) {
          console.log("Infinite loop detected!!", ret, iter);
          break;
      }
    } while (!good);
    
    if (good==false) {
        this.ret.done = true;
        this.ret.value = undefined;
        this.iter = undefined;
    }
    return this.ret;
  }]);
  _es6_module.add_class(SelectedEditableAllLayersIter);
  SelectedEditableAllLayersIter = _es6_module.add_export('SelectedEditableAllLayersIter', SelectedEditableAllLayersIter);
  var ElementArraySet=_ESClass("ElementArraySet", set, [function ElementArraySet(arg) {
    set.call(this, arg);
    this.layerset = undefined;
  }, function editable(ctx) {
    if (ctx===undefined) {
        console.warn("Missing ctx in editable() iterator!");
    }
    let ignore_layers=ctx!==undefined ? ctx.edit_all_layers : false;
    return ignore_layers ? new SelectedEditableAllLayersIter(this, this.layerset) : new SelectedEditableIter(this, this.layerset);
  }]);
  _es6_module.add_class(ElementArraySet);
  ElementArraySet = _es6_module.add_export('ElementArraySet', ElementArraySet);
  var ElementArray=_ESClass("ElementArray", GArray, [function ElementArray(type, idgen, idmap, global_sel, layerset, spline) {
    GArray.call(this);
    this.layerset = layerset;
    this.cdata = new CustomData(this);
    this.type = type;
    this.spline = spline;
    this.idgen = idgen;
    this.idmap = idmap;
    this.local_idmap = {}
    this.global_sel = global_sel;
    this.on_select = undefined;
    this.select_listeners = new EventDispatcher("select");
    this.selected = new ElementArraySet();
    this.selected.layerset = layerset;
  }, function editable(ctx) {
    if (ctx===undefined) {
        throw new Error("Missing ctx argument");
    }
    return new EditableIter(this, this.layerset, ctx.edit_all_layers);
  }, function dag_get_datapath() {
    var tname;
    switch (this.type) {
      case SplineTypes.VERTEX:
        tname = "verts";
        break;
      case SplineTypes.HANDLE:
        tname = "handles";
        break;
      case SplineTypes.SEGMENT:
        tname = "segments";
        break;
      case SplineTypes.FACE:
        tname = "faces";
        break;
    }
    var suffix="."+tname;
    var name="drawspline";
    for (var i=0; i<this.cdata.layers.length; i++) {
        if (this.cdata.layers[i].name=="TimeDataLayer")
          name = "pathspline";
    }
    return "frameset."+name+suffix;
  }, function remove_undefineds() {
    for (var i=0; i<this.length; i++) {
        if (this[i]==undefined) {
            this.pop_i(this[i]);
            i--;
        }
    }
  }, function swap(a, b) {
    if (a==undefined||b==undefined) {
        console.trace("Warning, undefined in ElementArray.swap(): a, b:", a, b);
        return ;
    }
    var i1=this.indexOf(a), i2=this.indexOf(b);
    if (i1<0||i2<0) {
        console.log(i1, i2, a, b);
        throw new Error("Elements not in list");
    }
    this[i2] = a;
    this[i1] = b;
  }, function on_layer_add(layer, i) {
    var __iter_e=__get_iter(this);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      e.cdata.on_add(layercls, i);
    }
  }, function on_layer_del(layer, i) {
    var __iter_e=__get_iter(this);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      e.cdata.on_del(layercls, i);
    }
  }, function push(e, custom_eid) {
    if (custom_eid==undefined) {
        custom_eid = undefined;
    }
    if (e.cdata==undefined||e.cdata.length!=this.cdata.layers.length) {
        e.cdata = this.cdata.gen_edata();
    }
    if (custom_eid==undefined) {
        e.eid = this.idgen.gen_id();
    }
    else {
      e.eid = custom_eid;
    }
    this.idmap[e.eid] = e;
    this.local_idmap[e.eid] = e;
    GArray.prototype.push.call(this, e);
    if (e.flag&SplineFlags.SELECT) {
        e.flag&=~SplineFlags.SELECT;
        this.setselect(e, true);
    }
    this.layerset.active.add(e);
    e.layers[this.layerset.active.id] = 1;
  }, function remove(e, soft_error) {
    if (soft_error==undefined) {
        soft_error = false;
    }
    var idx=this.indexOf(e);
    if (idx<0) {
        throw new Error("Element not in list");
    }
    if (this.active===e) {
        this.active = undefined;
    }
    if (this.selected.has(e))
      this.setselect(e, false);
    delete this.idmap[e.eid];
    delete this.local_idmap[e.eid];
    this[idx] = this[this.length-1];
    this.length--;
    for (var k in e.layers) {
        var layer=this.layerset.idmap[k];
        if (layer!=undefined) {
            layer.remove(e);
        }
        else {
          console.trace("Failed to find layer "+k+"!", e, this, this.layerset);
        }
    }
  }, function setselect(e, state) {
    if (state&&!(e.flag&SplineFlags.SELECT)) {
        this.dag_update("on_select_add", this.type);
    }
    else 
      if (!state&&(e.flag&SplineFlags.SELECT)) {
        this.dag_update("on_select_sub", this.type);
    }
    if (e.type!=this.type) {
        console.trace("Warning: bad element fed to ElementArray! Got ", e.type, " but expected", this.type);
        return ;
    }
    var changed=!!(e.flag&SplineFlags.SELECT)!=!!state;
    if (state) {
        if (this.active===undefined)
          this.active = e;
        this.global_sel.add(e);
        this.selected.add(e);
        e.flag|=SplineFlags.SELECT;
    }
    else {
      if (this.active===e) {
          this.active = undefined;
      }
      this.global_sel.remove(e);
      this.selected.remove(e);
      e.flag&=~SplineFlags.SELECT;
    }
    if (changed&&this.on_select!==undefined) {
        this.on_select(e, state);
        this.select_listeners.fire(e, state);
    }
  }, function clear_selection() {
    for (var i=0; i<this.length; i++) {
        this.setselect(this[i], false);
    }
  }, function select_all() {
    for (var i=0; i<this.length; i++) {
        this.setselect(this[i], true);
    }
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new ElementArray();
    reader(ret);
    ret.cdata.owner = ret;
    var active=ret.active;
    ret.active = undefined;
    for (var i=0; i<ret.arr.length; i++) {
        GArray.prototype.push.call(ret, ret.arr[i]);
        if (ret.arr[i].eid==active) {
            ret.active = ret.arr[i];
        }
    }
    delete ret.arr;
    return ret;
  }), function afterSTRUCT(type, idgen, idmap, global_sel, layerset, spline) {
    this.type = type;
    this.idgen = idgen;
    this.idmap = idmap;
    this.global_sel = global_sel;
    this.local_idmap = {}
    this.layerset = layerset;
    this.spline = spline;
    var selected=new ElementArraySet();
    selected.layerset = layerset;
    for (var i=0; i<this.selected.length; i++) {
        var eid=this.selected[i];
        if (!(eid in idmap)) {
            console.log("WARNING: afterSTRUCT: eid", eid, "not in eidmap!", Object.keys(idmap));
            continue;
        }
        selected.add(idmap[this.selected[i]]);
    }
    this.selected = selected;
    var __iter_e=__get_iter(this);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      this.local_idmap[e.eid] = e;
      if (e.cdata==undefined) {
          e.cdata = this.cdata.gen_edata();
      }
    }
    this.cdata.afterSTRUCT(this, this.cdata);
  }]);
  _es6_module.add_class(ElementArray);
  ElementArray = _es6_module.add_export('ElementArray', ElementArray);
  mixin(ElementArray, DataPathNode);
  ElementArray.STRUCT = "\n  ElementArray {\n    arr      : array(abstract(SplineElement)) | obj;\n    selected : iter(e, int) | e.eid;\n    active   : int | obj.active != undefined ? obj.active.eid : -1;\n    cdata    : CustomData;\n  }\n";
  ElementArray.dag_outputs = {on_select_add: 0, on_select_sub: 0}
}, '/dev/cleanfairmotion/src/curve/spline_element_array.js');
