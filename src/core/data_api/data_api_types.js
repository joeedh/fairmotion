
import {DataFlags, DataPathTypes} from "./data_api_base.js";
import {PropTypes, TPropFlags, ToolProperty, IntProperty, FloatProperty, Vec2Property, BoolProperty,
        Vec3Property, Vec4Property, StringProperty, FlagProperty, EnumProperty} from '../toolprops.js';
import {ToolFlags, UndoFlags} from '../toolops_api.js';
import {PropSubTypes} from "../toolprops.js";

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
    return this;
  }

  Range(min, max) {
    this.data.range = [min, max];
    return this;
  }

  ExpRate(rate) {
    this.data.expRate = rate;
    return this;
  }

  Step(f) {
    this.data.step = f;
    return this;
  }

  DecimalPlaces(p) {
    this.data.decimalPlaces = p;
    return this;
  }

  SetFlag(flag) {
    this.data.flag |= flag;
    return this;
  }

  ClearFlag() {
    this.data.flag = 0;
    return this;
  }

  FlagsUINames(uinames) {
    this.data.setUINames(uinames);
    return this;
  }

  cache_good() {
    var p = this;

    while (p !== undefined) {
      if (p.flag & (DataFlags.RECALC_CACHE|DataFlags.NO_CACHE))
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
    this.getitempath = getitempath;
    this.getitem = getitem;
    this.getiter = getiter;
    this.getkeyiter = getkeyiter;
    this.getlength = getlength;

    this.type = DataPathTypes.STRUCT_ARRAY;
  }
}

export class DataStruct {
  constructor(paths=[], cls) {
    this.paths = new GArray();
    this.pathmap = {}
    this.parent = undefined;
    this.dataClass = cls;

    this._flag = 0;

    for (let p of paths) {
      this.add(p);

      /*p.parent = this;
      this.pathmap[p.name] = p

      if (p.type === DataPathTypes.PROP) {
        p.data.path = p.path;
      }//*/
    }

    this.type = DataPathTypes.STRUCT;
  }

  Color3(apiname, path, uiname, description) {
    var ret = new Vec3Property(undefined, apiname, uiname, description);
    ret.subtype = PropSubTypes.COLOR;

    ret = new DataPath(ret, apiname, path, path !== undefined);
    this.add(ret);

    return ret;
  }

  String(apiname, path, uiname, description) {
    let ret = new StringProperty("", apiname, uiname, description);
    ret = new DataPath(ret, apiname, path, true, path !== undefined);

    this.add(ret);

    return ret;
  }

  Color4(apiname, path, uiname, description) {
    var ret = new Vec4Property(undefined, apiname, uiname, description);
    ret.subtype = PropSubTypes.COLOR;

    ret = new DataPath(ret, apiname, path, path !== undefined);
    this.add(ret);

    return ret;
  }

  Vector2(apiname, path, uiname, description) {
    var ret = new Vec2Property(undefined, apiname, uiname, description);

    ret = new DataPath(ret, apiname, path, path !== undefined);
    this.add(ret);

    return ret;
  }

  Vector3(apiname, path, uiname, description) {
    var ret = new Vec3Property(undefined, apiname, uiname, description);

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

    ret = new DataPath(ret, apiname, path, path !== undefined);
    this.add(ret);

    return ret;
  }

  Struct(apiname, path, uiname, description) {
    var ret = new DataStruct([]);

    var path = new DataPath(ret, apiname, path, path !== undefined);
    this.add(path);

    return ret;
  }

  Int(apiname, path, uiname, description) {
    var ret = new IntProperty(0, apiname, uiname, description);

    ret = new DataPath(ret, apiname, path, path !== undefined);
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

    while (p !== undefined) {
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
    if (!p) {
      console.warn("Invalid call to DataStruct.prototype.add()");
      return;
    }

    if (this._flag & DataFlags.NO_CACHE) {
      p.flag |= DataFlags.NO_CACHE;
    } else {
      p.flag |= DataFlags.RECALC_CACHE;
      this._flag |= DataFlags.RECALC_CACHE;
    }


    this.pathmap[p.name] = p;
    this.paths.push(p);

    p.parent = this;

    if (p.type === DataPathTypes.PROP) {
      p.data.path = p.path;
    }

    return this;
  }

  remove(p) {
    delete this.pathmap[p.name];
    this.paths.remove(p);
    this.flag |= DataFlags.RECALC_CACHE;

    return this;
  }

  addOrReplace(p) {
    return this.replace(p, p);
  }

  replace(p, p2) {
    if (p2 === undefined) {
      console.warn("Invalid call to DataStruct.prototype.replace()");
      return;
    }

    for (let p3 of this.paths) {
      if (p3.name === p.name) {
        this.remove(p3);
        break;
      }
    }

    this.add(p2);

    return this;
  }
}
