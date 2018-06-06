"use strict";
;
import {STRUCT} from 'struct';
import {pack_int, pack_float, pack_static_string} from 'ajax';

export var PropTypes = {
  INT    : 0,
  FLOAT  : 1,
  STRING : 4,
  VEC3   : 6,
  VEC4   : 7,
  BOOL   : 8,
  MATRIX3: 12,
  MATRIX4: 13,
  ENUM   : 14,
  STRUCT      : 15, //internal type to data api
  FLAG        : 16,
  DATAREF     : 17,
  DATAREFLIST : 18,
  TRANSFORM   : 19, //ui-friendly matrix property
  COLLECTION  : 20,
  VEC2        : 21,
  IMAGE       : 22, //this is only a subtype, used with DataRefProperty
  ARRAYBUFFER : 23,
  COLOR3      : 24,
  COLOR4      : 25
};

export var TPropFlags = {
  PRIVATE         : 1, 
  LABEL           : 2, 
  COLL_LOOSE_TYPE : 4,
  USE_UNDO        : 8, //use toolstack.exec_datapath instead of api.set_prop
  UNDO_SIMPLE     : 16 //use simple undo implementation
};

export class ToolProperty {
  constructor(type, apiname="", uiname=apiname, description="", flag=0) {
    this.type = type;
    this.data = null;
    
    this.apiname = apiname;
    if (uiname == undefined)
      uiname = apiname;
      
    /*
      Okay.  Time for a toolproperty event listener api.
      listeners are fire on set_data.
    */
    //list of [owner, callback] pairs.
    //callback has property function(owner, property) 
    this.listeners = new GArray();
    
    this.uiname = uiname;
    this.flag = flag;
    this.description = description;
    
    this.userdata = undefined
    
    this.ctx = undefined;
    this.path = undefined;
    
    this.hotkey_ref = undefined;
    this.unit = undefined;
    this.icon = -1;
  }
  
  copyTo(dst, copy_data=false) {
    dst.flag = this.flag;
    dst.icon = this.icon;
    dst.unit = this.unit;
    dst.hotkey_ref = this.hotkey_ref;
    dst.uiname = this.uiname;
    dst.apiname = this.apiname;
    
    if (copy_data)
      dst.data = this.data;
    
    return dst;
  }
  
  //only one callback per owner allowed
  //any existing callback will be overwritten
  add_listener(owner, callback) {
    for (var l of this.listeners) {
      if (l[0] == owner) {
        l[1] = callback;
        return;
      }
    }
    
    this.listeners.push([owner, callback]);
  }
  
  remove_listener(owner, silent_fail=false) {
    for (var l of this.listeners) {
      if (l[0] == owner) {
        console.log("removing listener");
        this.listeners.remove(l);
        return;
      }
    }
    
    if (!silent_fail)
      console.trace("warning: remove_listener called for unknown owner:", owner);
  }
  
  _exec_listeners(data_api_owner) {
    for (var l of this.listeners) {
      if (RELEASE) {
        try {
          l[1](l[0], this, data_api_owner);
        } catch (_err) {
          print_stack(_err);
          console.log("Warning: a property event listener failed", "property:", this, "callback:", l[1], "owner:", l[0])
        }
      } else {
        l[1](l[0], this, data_api_owner);
      }
    }
  }
  
  load_ui_data(ToolProperty prop) {
    this.uiname = prop.uiname;
    this.apiname = prop.apiname;
    this.description = prop.description;
    this.unit = prop.unit;
    this.hotkey_ref = prop.hotkey_ref;
  }
  
  user_set_data(this_input) { }
  update(owner_obj, old_value, has_changed) { }
  api_update(ctx, path) { }

  pack(data) {
    pack_int(data, this.type);
    var unit = this.unit != undefined ? "" : this.unit;
    
    pack_static_string(data, unit, 16);
  }

  unpack(data, unpack_uctx uctx) {
    this.unit = unpack_static_string(data, 16);
    if (this.unit == "")
      this.unit = undefined;
  }

  //owner is used by data_api, is passed to .update
  //and listener functions
  set_data(data, owner, changed=true, set_data=true) {
    if (set_data)
      this.data = data;
    
    this.api_update(this.ctx, this.path, owner);
    this.update.call(this, owner, undefined, changed);
    
    this._exec_listeners(owner);
  }

  toJSON() {
    return {type : this.type, data : this.data};
  }

  loadJSON(prop, json) {
    switch (json.type) {
    case PropTypes.INT:
    case PropTypes.FLOAT:
    case PropTypes.STRING:
    case PropTypes.BOOL:
    case PropTypes.FLOAT_ARRAY:
    case PropTypes.INT_ARRAY:
    case PropTypes.ENUM:
    case PropTypes.FLAG:
      prop.set_data(json.data);
      break;
    case PropTypes.ELEMENTS:
      prop.set_data(new GArray(json.data));
      break;
    case PropTypes.VEC3:
      prop.set_data(new Vector3(json.data));
      break;
    case PropTypes.VEC4:
      prop.set_data(new Vector4(json.data));
      break;
    }
  }
  
  static fromSTRUCT(reader) {
    var ob = new ToolProperty();
    reader(ob);
    return ob;
  }
}

ToolProperty.STRUCT = """
  ToolProperty {
    type : int;
    flag : int;
  }
""";

export class ArrayBufferProperty extends ToolProperty {
  constructor(data, apiname="", uiname=apiname, description="", flag=0) {
    super(PropTypes.ARRAYBUFFER, apiname, uiname, description, flag);
    
    if (data != undefined) {
      this.set_data(data);
    }
  }
  
  copyTo(ArrayBufferProperty dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);

    if (this.data != undefined)
      dst.set_data(this.data);
    
    return dst;
  }
  
  copy() : ArrayBufferProperty {
    return this.copyTo(new ArrayBufferProperty());
  }
}
ArrayBufferProperty.STRUCT = STRUCT.inherit(ArrayBufferProperty, ToolProperty) + """
  data : arraybuffer;
}
""";

export class DataRefProperty extends ToolProperty {
  //allowed_types can be either a datablock type,
  //or a set of allowed datablock types.
  constructor(DataBlock value, set<int> allowed_types, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.DATAREF, apiname, uiname, description, flag);
    
    if (allowed_types == undefined)
      allowed_types = new set();
    
    if (!(allowed_types instanceof set)) {
      if (allowed_types instanceof Array)
        allowed_types = new set(allowed_types);
      else
        allowed_types = new set([allowed_types]);
    }
    
    this.types = new set();
    
    //ensure this.types stores integer type ids, not type classes
    for (var val of allowed_types) {
      if (typeof val == "object") {
        val = new val().lib_type;
      }
      
      this.types.add(val);
    }
    
    if (value != undefined)
      this.set_data(value);
  }
  
  get_block(ctx) {
    if (this.data == undefined)
      return undefined;
    else
      return ctx.datalib.get(this.data);
  }
  
  copyTo(DataRefProperty dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);

    var data = this.data;
    
    if (data != undefined)
      data = data.copy();
    
    dst.types = new set(this.types);
    
    if (data != undefined)
      dst.set_data(data);
    
    return dst;
  }
  
  copy() : DataRefProperty {
    return this.copyTo(new DataRefProperty());
  }
  
  set_data(DataBlock value, Object owner, changed, set_data) {
    if (value == undefined) {
      ToolProperty.prototype.set_data.call(this, undefined, owner, changed, set_data);
    } else if (!(value instanceof DataRef)) {
      if (!this.types.has(value.lib_type)) {
        console.trace("Invalid datablock type " + value.lib_type + " passed to DataRefProperty.set_value()");
        return;
      }
      
      value = new DataRef(value);
      ToolProperty.prototype.set_data.call(this, value, owner, changed, set_data);
    } else {
      ToolProperty.prototype.set_data.call(this, value, owner, changed, set_data);
    }
  }
  
  static fromSTRUCT(reader) {
    var l = new DataRefProperty();;
    reader(l);
    
    l.types = new set(l.types);
    
    if (l.data != undefined && l.data.id < 0)
      l.data = undefined;
    l.set_data(l.data);
    
    return l;
  }
}

DataRefProperty.STRUCT = STRUCT.inherit(DataRefProperty, ToolProperty) + """
  data : DataRef | obj.data == undefined ? new DataRef(-1) : obj.data;
  types : iter(int);
}
""";

export class RefListProperty extends ToolProperty {
  //allowed_types can be either a datablock integer type id,
  //or a set of allowed datablock integer types.
  constructor(Array<DataBlock> value, set<int> allowed_types, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.DATAREFLIST, apiname, uiname, description, flag);
    
    if (allowed_types == undefined)
      allowed_types = [];
      
    if (!(allowed_types instanceof set)) {
      allowed_types = new set([allowed_types]);
    }
    
    this.types = allowed_types;
    this.set_data(value);
  }
  
  copyTo(RefListProperty dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    
    dst.types = new set(this.types);
    if (this.data != undefined)
      dst.set_data(this.data);
    
    return dst;
  }
  
  copy() : RefListProperty {
    return this.copyTo(new RefListProperty());
  }
  
  set_data(DataBlock value, Object owner, changed, set_data) {
    if (value != undefined && value.constructor.name == "Array")
      value = new GArray(value);
    
    if (value == undefined) {
      ToolProperty.prototype.set_data.call(this, undefined, owner, changed, set_data);
    } else {
      var lst = new DataRefList();
      for (var i=0; i<value.length; i++) {
        var block = value[i];
        
        if (block == undefined || !this.types.has(block.lib_type)) {
          console.trace();
          if (block == undefined)
            console.log("Undefined datablock in list passed to RefListProperty.set_data");
          else
            console.log("Invalid datablock type " + block.lib_type + " passed to RefListProperty.set_value()");
          continue;
        }
        lst.push(block);
      }
      
      value = lst;
      super.set_data(this, value, owner, changed, set_data);
    }
  }
  
  static fromSTRUCT(reader) {
    var t = new RefListProperty()
    reader(t)
    
    t.types = new set(t.types);
    t.set_data(t.data);
    
    return t;
  }
}

RefListProperty.STRUCT = STRUCT.inherit(RefListProperty, ToolProperty) + """
  data : iter(dataref(DataBlock));
  types : iter(int);
}
"""
//flag (bitmask) property.  maskmap maps API names
//to bitmasks (e.g. 1, 2, 4, 8, along with combinatoins, like 1|4, 2|8, etc).
//
//uinames is an {} map from ui names to valid_value's keys (not values)

//ui, range, flag are optional
export class FlagProperty extends ToolProperty {
  constructor(value, maskmap, uinames, apiname, uiname, 
              description, range, uirange, flag) 
  {
    super(PropTypes.FLAG, apiname, uiname, description, flag);
    
    //detect if we were called by fromSTRUCT
    if (value == undefined && maskmap == undefined) {
      this.ui_value_names = {};
      this.ui_key_names = {};
      this.flag_descriptions = {};
      this.keys = {};
      this.values = {};
      
      return;
    }
    
    this.data = 0 : int;
    
    this.ui_key_names = {};
    this.flag_descriptions = {};
    
    this.keys = {}
    this.values = {}
    
    for (var k in maskmap) {
      this.values[maskmap[k]] = maskmap[k];
      this.keys[k] = maskmap[k];
    }
  
    if (uinames == undefined) {
      this.setUINames(uinames);
    } else {
      this.ui_value_names = uinames;
      for (var k in uinames) {
        this.ui_key_names[uinames[k]] = k;
      }
    }
    
    this.set_flag(value);  
  }

  setUINames(uinames) {
    this.ui_value_names = {}
    this.ui_key_names = {};
    
    for (var k in this.keys) {
      var key = k[0].toUpperCase() + k.slice(1, k.length).toLowerCase();
      key = key.replace(/\_/g, " ").replace(/\-/g, " ");

      this.ui_value_names[key] = k;
      this.ui_key_names[k] = key;
    }
  }

  copyTo(FlagProperty dst) {
    ToolProperty.prototype.copyTo.call(this, dst, true);
    
    for (var k in this.flag_descriptions) {
      dst.flag_descriptions[k] = this.flag_descriptions[k];
    }
    
    for (var k in this.keys) {
      dst.keys[k] = this.keys[k];
    }
    for (var k in this.values) {
      dst.values[k] = this.values[k];
    }
    for (var k in this.ui_value_names) {
      dst.ui_value_names[k] = this.ui_value_names[k];
    }
    
    dst.ui_key_names = {};
    for (var k in this.ui_key_names) {
      dst.ui_key_names[k] = this.ui_key_names[k];
    }
    
    return dst;
  }
  
  copy() : FlagProperty {
    return this.copyTo(new FlagProperty());
  }

  pack(data) {
    pack_int(this.data);
  }

  set_flag(value) {
    var flag;
    if (this.values.hasOwnProperty(value)) {
       flag = value;
    } else if (this.keys.hasOwnProperty(value)) {
      flag = this.keys[value];
    } else {
      console.trace("WARNING: bad flag value!", value, this.values);
      //throw new Error("Bad flag value");
    }
    
    this.data |= flag;
  }

  unset_flag(value) {
    var flag;
    if (this.values.hasOwnProperty(value)) {
       flag = value;
    } else if (this.keys.hasOwnProperty(value)) {
      flag = this.keys[value];
    } else {
      console.log(value, this.values);
      console.trace();
      throw new Error("Bad flag value");
    }
    
    this.data &= ~flag;
  }
  
  static fromSTRUCT(reader) {
    var t = new FlagProperty()
    reader(t)
    
    /*
    var keys = {}
    var values = {}
    
    for (var i=0; i<t.keys.length; i++) {
      var k = t.keys[i];
      var start = k.search(" ");
      
      console.log("->->->", k);
      var n = parseInt(k.splice(0, start).trim());
      
      keys[n] = k.splice(start+1, k.length);
      values[n] = n;
    }
    
    this.keys = keys;
    this.values = values;
    */
    return t;
  }
}

FlagProperty.STRUCT = STRUCT.inherit(FlagProperty, ToolProperty) + """
  data : int;
}
""";

export class FloatProperty extends ToolProperty {
  constructor(i, apiname, uiname, description, range, uirange, flag) {//range, uirange, flag are optional
    ToolProperty.call(this, PropTypes.FLOAT, apiname, uiname, description, flag);
    
    if (uirange == undefined) {
      uirange = range;
    }
    
    this.ui_range = uirange
    this.range = range
    this.data = i;
  }
  
  copyTo(FloatProperty dst) {
    ToolProperty.prototype.copyTo.call(this, dst, true);
    
    dst.ui_range = this.ui_range;
    dst.range = this.range;
    
    return dst;
  }
  
  copy() : FloatProperty {
    return this.copyTo(new FloatProperty());
  }
  
  static fromSTRUCT(reader) {
    var t = new FloatProperty();
    
    reader(t);
    
    return t;
  }
}

FloatProperty.STRUCT = STRUCT.inherit(FloatProperty, ToolProperty) + """
  data : float;
}
""";

export class IntProperty extends ToolProperty {
  constructor (i, apiname, uiname, description, 
               range, uirange, flag) 
  {
    ToolProperty.call(this, PropTypes.INT, apiname, uiname, description, flag);
    
    if (uirange == undefined) {
      uirange = range;
    }
    
    this.ui_range = uirange
    this.range = range
    
    this.data = i;
  }
  
  copyTo(IntProperty dst) {
    ToolProperty.prototype.copyTo.call(this, dst, true);
    
    dst.ui_range = this.ui_range;
    dst.range = this.range;
    
    return dst;
  }
  
  copy() : IntProperty {
    return this.copyTo(new IntProperty());
  }
  
  pack(data) {
    pack_int(this.data);
  }
  
  static fromSTRUCT(reader) {
    var t = new IntProperty();
    reader(t);
    return t;
  }
}

IntProperty.STRUCT = STRUCT.inherit(IntProperty, ToolProperty) + """
  data : int;
}
""";

export class BoolProperty extends ToolProperty {
  constructor(bool, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.BOOL, apiname, uiname, description, flag);
    this.data = bool ? true : false;
  }
  
  pack(data) {
    pack_int(this.data);
  }
  
    copyTo(BoolProperty dst) {
    ToolProperty.prototype.copyTo.call(this, dst, true);
    
    dst.ui_range = this.ui_range;
    dst.range = this.range;
    
    return dst;
  }
  
  copy() : BoolProperty {
    return this.copyTo(new BoolProperty());
  }

  static fromSTRUCT(reader) {
    var t = new BoolProperty();
    reader(t);
    
    t.data = !!t.data;
    
    return t;
  }
}

BoolProperty.STRUCT = STRUCT.inherit(BoolProperty, ToolProperty) + """
  data : int;
}
""";

export class StringProperty extends ToolProperty {
  constructor(string, apiname, uiname, description, flag) {
    if (string == undefined)
      string = "";
    
    ToolProperty.call(this, PropTypes.STRING, apiname, uiname, description, flag);
    this.data = string;
  }
   
  copyTo(StringProperty dst) {
    ToolProperty.prototype.copyTo.call(this, dst, true);
    
    dst.ui_range = this.ui_range;
    dst.range = this.range;
    
    return dst;
  }
  
  copy() : StringProperty {
    return this.copyTo(new StringProperty());
  }
  
  pack(data) {   
    pack_string(this.data);
  }
  
  static fromSTRUCT(reader) {
    var t = new StringProperty();
    reader(t);
    return t;
  }
}
StringProperty.STRUCT = STRUCT.inherit(StringProperty, ToolProperty) + """
  data : string;
}
""";

export class TransformProperty extends ToolProperty {
  constructor(value, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.TRANSFORM, apiname, uiname, description, flag)
    
    if (value != undefined) 
      ToolProperty.prototype.set_data.call(this, new Matrix4UI(value));
  }
  
  set_data(Matrix4 data, Object owner, changed, set_data) {
    this.data.load(data);
    ToolProperty.prototype.set_data.call(this, undefined, owner, changed, false);
  }
  
  copyTo(TransformProperty dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    
    dst.data = new Matrix4UI(new Matrix4());
    dst.data.load(this.data);
    
    return dst;
  }
  
  copy() : TransformProperty {
    return this.copyTo(new TransformProperty());
  }
  
  static fromSTRUCT(reader) {
    var t = new TransformProperty();
    reader(t);
    
    t.data = new Matrix4UI(t.data);
    
    return t;
  }

}
TransformProperty.STRUCT = STRUCT.inherit(TransformProperty, ToolProperty) + """
  data : mat4;
}
""";


export class EnumProperty extends ToolProperty {
  constructor(string, valid_values, apiname, 
              uiname, description, flag) 
  {
  
    ToolProperty.call(this, PropTypes.ENUM, apiname, uiname, description, flag);
    
    this.values = {}
    this.keys = {};
    this.ui_value_names = {}
    
    if (valid_values == undefined) return;
    
    if (valid_values instanceof Array || valid_values instanceof String) {
      for (var i=0; i<valid_values.length; i++) {
        this.values[valid_values[i]] = valid_values[i];
        this.keys[valid_values[i]] = valid_values[i];
      }
    } else {
      for (var k in valid_values) {
        this.values[k] = valid_values[k];
        this.keys[valid_values[k]] = k;
      }
    }
    
    if (string == undefined) {
      this.data = Iterator(valid_values).next();
    } else {
      this.set_value(string);
    }
    
    for (var k in this.values) {
      var uin = k[0].toUpperCase() + k.slice(1, k.length);
      
      uin = uin.replace(/\_/g, " ");
      this.ui_value_names[k] = uin;
    }
    
    this.iconmap = {};
  }
  
  load_ui_data(ToolProperty prop) {
    ToolProperty.prototype.load_ui_data.call(this, prop);
    
    this.ui_value_names = Object.create(prop.ui_value_names);
    this.iconmap = Object.create(prop.iconmap);
    this.values = Object.create(prop.values);
    this.keys = Object.create(prop.keys);
  }
  
  add_icons(iconmap) {
    for (var k in iconmap) {
      this.iconmap[k] = iconmap[k];
    }
  }

  copyTo(EnumProperty dst) : EnumProperty {
    ToolProperty.prototype.copyTo.call(this, dst, true);
    
    p.keys = Object.create(this.keys);
    p.values = Object.create(this.values);
    p.data = this.data;
    p.ui_value_names = this.ui_value_names;
    p.update = this.update;
    p.api_update = this.api_update;
    
    for (var k in this.iconmap) {
      p.iconmap[k] = this.iconmap[k];
    }
    
    return p;
  }
  
  copy() {
    var p = new EnumProperty("dummy", {"dummy" : 0}, this.apiname, this.uiname, this.description, this.flag)
    p.keys = Object.create(this.keys);
    p.values = Object.create(this.values);
    p.data = this.data;
    p.ui_value_names = this.ui_value_names;
    p.update = this.update;
    p.api_update = this.api_update;
    
    for (var k in this.iconmap) {
      p.iconmap[k] = this.iconmap[k];
    }
    
    return p;
  }

  pack(data) {
    pack_string(this.data);
  }

  get_value() {
    if (this.data in this.values)
      return this.values[this.data];
    else
      return this.data;
  }

  set_value(val) {
    if (!(val in this.values) && (val in this.keys))
      val = this.keys[val];
    
    if (!(val in this.values)) {
      console.trace("Invalid value for enum!");
      console.log("Invalid value for enum!", val, this.values);
      return;
    }
    
    this.data = new String(val);
  }
  
  static fromSTRUCT(reader) {
    var t = new EnumProperty();
    reader(t);
    return t;
  }
}

EnumProperty.STRUCT = STRUCT.inherit(EnumProperty, ToolProperty) + """
  data : string | obj.data.toString();
}
""";


export class Vec2Property extends ToolProperty {
  constructor(vec2, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.VEC2, apiname, uiname, description, flag);
    
    this.unit = undefined; //"default";
    this.range = [undefined, undefined]
    this.real_range = [undefined, undefined]
    this.data = new Vector3(vec2);  
  }
  
  copyTo(Vec2Property dst) : Vec2Property {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    
    dst.data = new Vector3(this.data);
    dst.real_range = this.real_range;
    dst.range = this.range;
    
    return dst;
  }
  
  set_data(Vector2 data, Object owner, changed) {
    this.data.load(data);
    ToolProperty.prototype.set_data.call(this, undefined, owner, changed, false);
  }
  
  copy() : Vec2Property {
    return this.copyTo(new Vec2Property());
  }
 
  static fromSTRUCT(reader) {
    var t = new Vec2Property();
    
    reader(t);
    
    return t;
  }
}

Vec2Property.STRUCT = STRUCT.inherit(Vec2Property, ToolProperty) + """
  data : array(float);
}
""";

export class Vec3Property extends ToolProperty {
  constructor(vec3, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.VEC3, apiname, uiname, description, flag);
    
    this.unit = "default";
    this.range = [undefined, undefined]
    this.real_range = [undefined, undefined]
    this.data = new Vector3(vec3);  
  }
  
  copyTo(Vec3Property dst) : Vec3Property {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    
    dst.data = new Vector3(this.data);
    dst.real_range = this.real_range;
    dst.range = this.range;
    
    return dst;
  }
  
  set_data(Vector3 data, Object owner, changed) {
    this.data.load(data);
    ToolProperty.prototype.set_data.call(this, undefined, owner, changed, false);
  }
  
  copy() : Vec3Property {
    return this.copyTo(new Vec3Property());
  }

 
  static fromSTRUCT(reader) {
    var t = new Vec3Property();
    
    reader(t);
    
    return t;
  }
}

Vec3Property.STRUCT = STRUCT.inherit(Vec3Property, ToolProperty) + """
  data : vec3;
}
""";

export class Vec4Property extends ToolProperty {
  constructor(vec4, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.VEC4, apiname, uiname, description, flag);
    
    this.subtype == PropTypes.VEC4;
    this.unit = "default";
    this.range = [undefined, undefined]
    this.real_range = [undefined, undefined]
    this.data = new Vector4(vec4);  
  }
  
  copyTo(Vec4Property dst) : Vec4Property {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    
    dst.data = new Vector4();
    dst.real_range = this.real_range;
    dst.range = this.range;
    dst.data.load(this.data);
    
    return dst;
  }
  
  set_data(Vector4 data, Object owner, changed) {
    this.data.load(data);
    ToolProperty.prototype.set_data.call(this, undefined, owner, changed, false);
  }
  
  copy() : Vec4Property {
    return this.copyTo(new Vec4Property());
  }

  
  static fromSTRUCT(reader) {
    var t = new Vec4Property();
    reader(t);
    return t;
  }
}

Vec4Property.STRUCT = STRUCT.inherit(Vec4Property, ToolProperty) + """
  data : vec4;
}
""";

/*
  A (very) generic container property.
  Internally, it stores references to special 
  iterable objects that implements the TPropIterable
  interface (which we do via the multiple inheritance 
  system), not arrays.  
  
  e.g. you might pass an eid_list, a DataRefList,
  a TMeshSelectedIter, etc.
*/

import {ToolIter} from 'toolprops_iter';
export class type_filter_iter extends ToolIter {
  constructor(iter, Array typefilter, ctx) {
    this.types = typefilter;
    this.ret = {done : false, value : undefined};
    this.iter = iter;
    this._ctx = ctx;
  }
  
  set ctx(ctx) {
    this._ctx = ctx;
    this.iter.ctx = ctx;
  }
  
  get ctx() {
    return this._ctx;
  }
  
  reset() {
    this.iter.ctx = this.ctx;
    this.iter.reset();
  }
  
  next() {
    var ret = this.iter.next();
    var types = this.types;
    var tlen = this.types.length;
    var this2 = this;
    
    function has_type(obj) {
      for (i=0; i<tlen; i++) {
        if (obj instanceof types[i]) return true;
      }
      
      return false;
    }
    
    while (!ret.done && !has_type(ret.value)) {
      ret = this.iter.next();
    }
    
    this.ret.done = ret.done;
    this.ret.value = ret.value;
    ret = this.ret;
    
    if (ret.done && this.iter.reset) {
      this.iter.reset();
    }
    
    return ret;
  }
}

export class CollectionProperty extends ToolProperty {
  constructor(data, Array<Function> filter_types, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.COLLECTION, apiname, uiname, description, flag);
    
    this.flag |= TPropFlags.COLL_LOOSE_TYPE;
    
    this.types = filter_types;
    this._data = undefined;
    this._ctx = undefined;
    
    this.set_data(data);
  }
  
  copyTo(CollectionProperty dst) : CollectionProperty {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    
    dst.types = this.types;
    this.set_data(this.data);
    
    return dst;
  }
  
  copy() : CollectionProperty {
    var ret = this.copyTo(new CollectionProperty());
    ret.types = this.types;
    ret._ctx = this._ctx;
    
    if (this._data != undefined && this._data.copy != undefined)
      ret.set_data(this._data.copy());
    
    return ret;
  }

  get ctx() {
    return this._ctx;
  }
  
  set ctx(data) {
    this._ctx = data;
    
    if (this._data != undefined)
      this._data.ctx = data;
  }
  
  set_data(data, Object owner, changed) {
    if (data == undefined) {
      this._data = undefined;
      return;
    }
    
    if ("__tooliter__" in data && typeof  data.__tooliter__ == "function") {
      this.set_data(data.__tooliter__(), owner, changed);
      return;
    } else if (!(this.flag & TPropFlags.COLL_LOOSE_TYPE) && !(TPropIterable.isTPropIterable(data))) {
      console.trace();
      console.log("ERROR: bad data '", data, "' was passed to CollectionProperty.set_data!");
      
      //this is, sadly, an unrecoverable error.
      throw new Error("ERROR: bad data '", data, "' was passed to CollectionProperty.set_data!");
    }
    
    this._data = data;
    this._data.ctx = this.ctx;
    
    ToolProperty.prototype.set_data.call(this, undefined, owner, changed, false);
  }
  
  //tool props are not supposed to use setters
  //for .data, but since we need one for .get 
  //(and since that meant renaming an inherited
  //member), we add a setter here for the sake of
  //robustness.
  
  //XXX: except. . .now you can't pass owner into it
  
  set data(data) {
    this.set_data(data);
  }
  
  get data() {
    return this._data;
  }
  
  [Symbol.iterator]() {
    if (this._data == undefined) //return empty iterator if no data
      return {next : function() { return {done : true, value : undefined};}};
    
    this._data.ctx = this._ctx;
    
    if (this.types != undefined && this.types.length > 0)
      return new type_filter_iter(this.data[Symbol.iterator](), this.types, this._ctx);
    else
      return this.data[Symbol.iterator]();
  }
  
  static fromSTRUCT(reader) {
    var ret = new CollectionProperty();
    
    reader(ret);
    
    return ret;
  }
}

CollectionProperty.STRUCT = STRUCT.inherit(CollectionProperty, ToolProperty) + """
    data : abstract(Object) | obj.data == undefined ? new BlankArray() : obj.data;
  }
""";

export class BlankArray {
  static fromSTRUCT(reader) {
    return undefined;
  }
}

BlankArray.STRUCT = """
  BlankArray {
    length : int | 0;
  }
""";

window.BlankArray = BlankArray;
