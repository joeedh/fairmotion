"use strict";

import {PropTypes, TPropFlags}  from 'toolprops';
  
import {STRUCT} from 'struct';
import {EventHandler} from 'events';
import {charmap} from 'events';
import {pack_int, pack_float, pack_static_string, unpack_ctx} from 'ajax';

/*
  basic design of tool ops:
  
  a carbon copy (sort of) of Blender's tool system.  each tool has
  a list of parameters, and are also passed a Context struct (a sort of
  bundle of common tool parameters).
  
  The main difference is that undo is implemented on top of this system.
  Tools that do not implement undo callbacks will trigger a complete copy
  of the data state.  This is to get new tools up and running quickly; 
  all tools should eventually get their own, faster callbacks (or at least
  inherit from super-classes with faster defaults, like SelectOpAbstract).
  
  Note that for some tools, serialization the app state prior to undo is
  unavoidable.
  
  RULES:
  1. Tools must store all (non-undo) state data in slots.
  
  2. Tools cannot access ANYTHING RELATED TO THE UI within exec.  
     This is to ensure tool repeatability, and maintain the integrity
     of the undostack (which doesn't store things like viewport pans).
     
  3. ToolProperty subclassess MUST NOT STORE REFERENCES (except to basic types like
     strings, ints, etc).  Rather, they must store a value to lookup an object:
        * DataRef structures for DataBlocks (ASObject/Mesh/Scene/etc)
        * integers for Mesh element subtypes (Vertex/Edge/Loops/Face).
*/
/*
  toolop refactor 2:
  1. Move uiname/description/icon of tools into prototype or
     constructor object.
     NEW: transition to a 'tooldef' static method.  like so:
     
     class Tool extends ToolOp {
      static tooldef() { return {
        apiname  : "load_image",
        uiname   : "Load Image",
        inputs   : {},
        outputs  : {},
        icon     : -1,
        is_modal : false
      }}
     }
     
  2. Get rid of apiname.
  
  toolop refactor:
  
  1. DROPPED, Constructor should take a single, SavedContext parameter.
  2. XXX, decided against this for now -> Combine inputs and outputs into slots.
  3. DONE. Normalize input/output names (e.g. TRANSLATION -> translation).
  4. DONE: Exec only gets ToolContext; access view2d in modal mode,
     with .modal_ctx.
  5. DONE: A RuntimeSavedContext class?  ToolExecContext?
  6. Think about Context's class hierarchy.
  7. DONE Default undo implementation should copy whole program state (other than the toolstack),
     not just the current mesh data.
  8. DONE (for now): Implement an iterator property type.  Perhaps something based on
     a SavedContext-restricted subset of the datapath api?  Note to self:
     do not implement a datapath-based means of linking properties to other
     parts of the data model.  That's better done as an explicit part of the DAG
     solver.
*/

export var UndoFlags = {
  IGNORE_UNDO      :  2, 
  IS_ROOT_OPERATOR :  4, 
  UNDO_BARRIER     :  8,
  HAS_UNDO_DATA    : 16
};

export var ToolFlags = {
  HIDE_TITLE_IN_LAST_BUTTONS : 1, 
  USE_PARTIAL_UNDO           : 2,
  USE_DEFAULT_INPUT          : 4
};

//this is a bitmask!!
export var ModalStates = {
  TRANSFORMING : 1,
  PLAYING      : 2
}

//XXX need to do this properly at some point; toolops should
//an idgen that is saved in each file
var _tool_op_idgen = 1; 

export class ToolOpAbstract {
  /*
  if presense, defines defaults:
  
  static tooldef() { return {
    apiname  : "load_image",
    uiname   : "Load Image",
    inputs   : {},
    outputs  : {},
    icon     : -1,
    is_modal : false
  }}
  */
  
  constructor(apiname, uiname, description=undefined, icon=-1) {
    if (this.constructor.tooldef != undefined && 
        this.constructor.tooldef != this.constructor.prototype.prototype.constructor.tooldef) {
      var ret = this.constructor.tooldef();
      
      for (var k in ret) {
        this[k] = ret[k];
        
        //copy input/output slots
        if (k == "inputs" || k == "outputs") {
          var v = this[k];
          
          for (var k2 in v) {
            v[k2] = v[k2].copy();
          }
        }
      }
    } else {
      var ins = {};
      if (this.constructor.inputs != undefined) {
        for (var k in this.constructor.inputs) {
          ins[k] = this.constructor.inputs[k].copy();
        }
      }
      this.inputs = ins;

      var outs = {};
      if (this.constructor.outputs != undefined) {
        for (var k in this.constructor.outputs) {
          outs[k] = this.constructor.outputs[k].copy();
        }
      }
      this.outputs = outs;
    }
    
    if (this.name == undefined)
      this.name = apiname;
    if (this.uiname == undefined)
      this.uiname = uiname;
    if (this.description == undefined)
      this.description = description == undefined ? "" : description;
    if (this.icon == undefined)
      this.icon = icon;
    
    this.apistruct = undefined : DataStruct; //may or may not be set
    this.op_id = _tool_op_idgen++;
    this.stack_index = -1;
  }
  
  get_saved_context() {
    if (this.saved_context == undefined) {
      console.log("warning : invalid saved_context in "+this.constructor.name + ".get_saved_context()");
      this.saved_context = new SavedContext(new Context());
    }
    
    return this.saved_context;
  }
  
  [Symbol.keystr]() : String {
    return "TO" + this.op_id;
  }
  
  exec(tctx) { }
  
  /*set default inputs. note that this is call is not 
    necessary for many modal tools, which generate their
    inputs in modal mode prior to executing.
  
    get_default is a passed in function, of prototype:
      function get_default(keyword, default_value, input_property);
      
    note that this function should never be called in the contextual
    of re-executing (redoing) a tool on the undo stack.
    
    input_property is required, so that we can validate types in the future.
    otherwise we might end up destroying the tool default cache every time
    we modify a tool input.
  */
  default_inputs(Context ctx, ToolGetDefaultFunc get_default) {  }
  
  /*
  static unit_test_req(Context ctx) : ToolOpTestReq {}
  static unit_test(Context ctx) : ToolOpAbstract {}
  
  unit_test_pre(Context ctx) {}
  unit_test_post(Context ctx) {}
  */
}

ToolOpAbstract.STRUCT = """
  ToolOpAbstract {
      flag    : int;
      saved_context  : SavedContext | obj.get_saved_context();
      inputs  : iter(k, PropPair) | new PropPair(k, obj.inputs[k]);
      outputs : iter(k, PropPair) | new PropPair(k, obj.outputs[k]);
  }
"""

class PropPair {
  constructor(key, value) {
    this.key = key;
    this.value = value;
  }
  
  static fromSTRUCT(reader) {
    var obj = {};
    reader(obj);
    return obj;
  }
}
PropPair.STRUCT = """
  PropPair {
    key   : string;
    value : abstract(ToolProperty);
  }
""";

export class ToolOp extends EventHandler, ToolOpAbstract {
  String name, uiname, description;
  ToolOp parent;
  Context modal_ctx;
  ToolContext modal_tctx;
  ObjectMap<String, ToolProperty> inputs;
  ObjectMap<String, ToolProperty> outputs;
  GArray drawlines; //for modal tools
  GArray widgets;
  KeyHandler keyhandler;
  Boolean is_modal, modal_running;
  Function on_modal_end, _widget_on_tick;
  int flag, icon, undoflag;
  
  constructor(String apiname="(undefined)", 
              String uiname="(undefined)", 
              String description=undefined,
              int icon=-1) 
  {
    ToolOpAbstract.call(this, apiname, uiname, description, icon);
    EventHandler.call(this);
    
    this.drawlines = new GArray();
    
    if (this.is_modal == undefined)
      this.is_modal = false;
    
    this.undoflag = 0;
    this.on_modal_end = undefined; //modal end callback
    
    this.modal_ctx = null;
    this.flag = 0;
    
    this.keyhandler = undefined;
    this.parent = undefined; //parent macro
    
    this.widgets = new GArray();
    this.modal_running = false;
    
    this._widget_on_tick = undefined;
  }
  
  new_drawline(v1, v2) {
    var dl = this.modal_ctx.view2d.make_drawline(v1, v2);
    
    this.drawlines.push(dl);
    
    return dl;
  }
  
  reset_drawlines(ctx=this.modal_ctx) {
    var view2d = ctx.view2d;
    
    for (var dl of this.drawlines) {
      view2d.kill_drawline(dl);
    }
    
    this.drawlines.reset();
  }
  
  static inherit_slots(old, newslots) {
    if (old == undefined) {
      console.trace("Warning: old was undefined in inherit_slots()!");
      
      return newslots;
    }
    
    for (var k in old) {
      if (!(k in newslots))
        newslots[k] = old[k];
    }
    
    return newslots;
  }
  
  static inherit_inputs(cls, newslots) {
    if (cls.inputs == undefined)
      return newslots;
      
    return ToolOp.inherit_slots(cls.inputs, newslots);
  }
  
  static inherit_outputs(cls, newslots) {
    if (cls.outputs == undefined)
      return newslots;
      
    return ToolOp.inherit_slots(cls.outputs, newslots);
  }
  
  /*creates 3d widgets, that either
     a), create a new toolop of this type
          whenever they are clicked, or
     b), creates a toolop of this type if
         the active tool isn't one already,
         otherwise edits the active toolop.
  */
  static create_widgets(ManipulatorManager manager, Context ctx) {
  }
  
  /*forcably resets widgets to "default" state (the meaning of which
    may vary from tool to tool).*/
  static reset_widgets(ToolOp op, Context ctx) {
  }
  
  pack(data) {
    pack_static_string(data, this.constructor.name, 32);
    pack_static_string(data, this.name, 32);
    pack_static_string(data, this.uiname, 32);
    
    var ilen=0, olen=0;
    for (var k in this.inputs) ilen++;
    for (var k in this.outputs) olen++;
    
    pack_int(data, ilen);
    pack_int(data, olen);
    
    for (var k in this.inputs) {
      this.inputs[k].pack(data);
    }
    
    for (var k in this.outputs) {
      this.outputs[k].pack(data);
    }
  }

  undo_ignore() {
    this.undoflag |= UndoFlags.IGNORE_UNDO;
  }
  
  on_mousemove() {
    redraw_viewport();
  }

  exec_pre(ToolContext tctx) {
    for (var k in this.inputs) {
      if (this.inputs[k].type == PropTypes.COLLECTION) {
        this.inputs[k].ctx = tctx;
      }
    }
    
    for (var k in this.outputs) {
      if (this.outputs[k].type == PropTypes.COLLECTION) {
        this.outputs[k].ctx = tctx;
      }
    }
  }
  
  start_modal(Context ctx) {
  }
  
  /*private function*/
  _start_modal(Context ctx) {
    this.modal_running = true;
    ctx.view2d.push_modal(this);
    this.modal_ctx = ctx;
  }

  _end_modal() {
    var ctx = this.modal_ctx;
    
    this.modal_running = false;
    this.saved_context = new SavedContext(this.modal_ctx);
    this.modal_ctx.view2d.pop_modal();
    
    if (this.on_modal_end != undefined)
      this.on_modal_end(this);
    
    this.reset_drawlines(ctx);
  }

  end_modal() 
  {/*called by inheriting tools*/
      this._end_modal();
  }

  can_call(Context ctx) { return true; }
  exec(Context ctx) { }
  start_modal(Context ctx) { }

  //called after redo execution
  redo_post(Context ctx) {
    window.redraw_viewport();
  }
  
  /*default undo implementation simply copies the mesh before running the tool.
    remember when overriding to override undo_pre, too, otherwise the tool will
    be copying the mesh unnecessarily*/
    
  undo_pre(Context ctx) {
    this._undocpy = g_app_state.create_undo_file();
    window.redraw_viewport();
  }

  undo(Context ctx) {
    g_app_state.load_undo_file(this._undocpy);
    
    /*
    ctx.kill_mesh_ctx(ctx.mesh);
    
    var m2 = new Mesh()
    m2.unpack(this._undocpy, new unpack_ctx())
    m2.render = ctx.mesh.render
    m2.regen_render();
    
    ctx.set_mesh(m2);
    */
  }
    
  static fromSTRUCT(reader) : ToolOp {
    var op = new ToolOp();
    reader(op);
    
    var ins = {};
    for (var i=0; i<op.inputs.length; i++) {
      ins[op.inputs[i].key] = op.inputs[i].value;
    }
    
    var outs = {};
    for (var i=0; i<op.outputs.length; i++) {
      outs[op.outputs[i].key] = op.outputs[i].value;
    }
    
    op.inputs = ins;
    op.outputs = outs;
    
    return op;
  }
  
  static get_constructor(name) {
    static toolops = undefined;
    
    if (toolops == undefined) {
      toolops = {};
      
      for (var c in defined_classes) {
        if (c instanceof ToolOp) toolops[c.name] = c;
      }
    }
    
    return toolops[c];
  }
}

ToolOp.STRUCT = """
  ToolOp {
      flag    : int;
      saved_context  : SavedContext | obj.get_saved_context();
      inputs  : iter(k, PropPair) | new PropPair(k, obj.inputs[k]);
      outputs : iter(k, PropPair) | new PropPair(k, obj.outputs[k]);
  }
"""

export class ToolMacro extends ToolOp {
  constructor (String name, String uiname, Array<ToolOp> tools=undefined) 
    {
    ToolOp.call(this, name, uiname);
    
    this.cur_modal = 0;
    this._chained_on_modal_end = false;
    
    if (tools == undefined)
      this.tools = new GArray<ToolOp>();
    else
      this.tools = new GArray<ToolOp>(tools);
  }

  add_tool(ToolOp tool) {
    tool.parent = this;
    
    this.tools.push(tool);
    if (tool.is_modal)
      this.is_modal = true;
  }
  
  connect_tools(ToolOp output, ToolOp input) 
  {
    var old_set = input.user_set_data;
    
    input.user_set_data = function() {
      this.data = output.data;
      
      old_set.call(this);
    }
  }

  undo_pre(Context ctx) {
  }

  undo(Context ctx) {
    for (var i=this.tools.length-1; i >= 0; i--) {
      this.tools[i].undo(ctx);
    }
  }

  exec(ToolContext ctx) {
    for (var i=0; i<this.tools.length; i++) {
      this.tools[i].saved_context = this.saved_context;
    }
    
    for (var op in this.tools) {
      if (op.is_modal)
        op.is_modal = this.is_modal;
      
      for (var k in op.inputs) {
        var p = op.inputs[k];
        
        if (p.user_set_data != undefined)
          p.user_set_data.call(p);
      }
      
      op.saved_context = this.saved_context;
      op.undo_pre(ctx);    
      
      op.undoflag |= UndoFlags.HAS_UNDO_DATA;
      
      op.exec_pre(ctx);
      op.exec(ctx);
    }
  }

  can_call(Context ctx) {
    return this.tools[0].can_call(ctx); //only check with first tool
  }
  
  start_modal(Context ctx) {
    if (!this._chained_on_modal_end) {
      //find last modal op, and chain its on_modal_end callback
      var last_modal = undefined;
      for (var op in this.tools) {
        if (op.is_modal)
          last_modal = op;
      }
      
      console.log("last_modal", last_modal);
      if (last_modal != undefined) {
        console.log("yay, found last modal")
        var on_modal_end = last_modal.on_modal_end;
        var this2 = this;
        
        last_modal.on_modal_end = function(toolop) {
          if (on_modal_end != undefined)
            on_modal_end(toolop);
          
          if (this2.on_modal_end)
            this2.on_modal_end(this2);
        }
        
        this._chained_on_modal_end = true;
      }
    }
    
    for (var i=0; i<this.tools.length; i++) {
      this.tools[i].saved_context = this.saved_context;
    }
    
    for (var i=0; i<this.tools.length; i++) {
      var op = this.tools[i];
      
      if (op.is_modal) {
        this.cur_modal = i;
        
        for (var k in op.inputs) {
          var p = op.inputs[k];
          if (p.user_set_data != undefined)
            p.user_set_data.call(p);
        }
        op.modal_ctx = this.modal_ctx;
        op.modal_tctx = this.modal_tctx;
        
        op.saved_context = this.saved_context;
        
        op.undo_pre(ctx);
        op.undoflag |= UndoFlags.HAS_UNDO_DATA;

        op.modal_running = true;
        return op.start_modal(ctx);
      } else {
        for (var k in op.inputs) {
          var p = op.inputs[k];
          if (p.user_set_data != undefined)
            p.user_set_data.call(p);
        }
        
        op.saved_context = this.saved_context;
        
        op.exec_pre(ctx);
        op.undo_pre(ctx);
        op.undoflag |= UndoFlags.HAS_UNDO_DATA;
        
        op.exec(ctx);
      }
    }
  }

  _end_modal() {
    var ctx = this.modal_ctx;
    
    this.next_modal(ctx);
  }

  next_modal(Context ctx) {
    
    this.tools[this.cur_modal].end_modal(ctx);
    
    this.cur_modal++;
    
    while (this.cur_modal < this.tools.length && !this.tools[this.cur_modal].is_modal)
      this.cur_modal++;
      
    if (this.cur_modal >= this.tools.length) {
      prior(ToolMacro, this)._end_modal();
    } else {
      this.tools[this.cur_modal].undo_pre(ctx);
      this.tools[this.cur_modal].undoflag |= UndoFlags.HAS_UNDO_DATA;
      this.tools[this.cur_modal].start_modal(ctx);
    }
  }

  on_mousemove(event) {
    this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
    this.tools[this.cur_modal].on_mousemove(event);
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
  
  static fromSTRUCT(Function reader) : ToolMacro {
    var ret = STRUCT.chain_fromSTRUCT(ToolMacro, reader);
    ret.tools = new GArray(ret.tools);
    
    for (var t of ret.tools) {  
      t.parent = this;
    }
    
    return ret;
  }
}

ToolMacro.STRUCT = STRUCT.inherit(ToolMacro, ToolOp) + """
  tools   : array(abstract(ToolOp));
  apiname : string;
  uiname  : string;
}
"""

import {
        StringProperty, Vec3Property, Vec4Property, 
        IntProperty, FloatProperty, BoolProperty
       } from 'toolprops';

/*note: datapathops can only access data paths
  in ToolContext, u.e. object, scene, and mesh.*/
class DataPathOp extends ToolOp {
  constructor(String path="", use_simple_undo=false) {
    ToolOpAbstract.call(this, "DataPathOp", "DataPath", "DataPath Value Set");
    
    this.use_simple_undo = use_simple_undo;
    this.is_modal = false;
    this.path = path;
    
    this.inputs = {
      path      : new StringProperty(path, "path", "path", "path"),
      vec3      : new Vec3Property(undefined, "vec3", "vec3", "vec3"),
      vec4      : new Vec4Property(undefined, "vec4", "vec4", "vec4"),
      pint      : new IntProperty(0, "pint", "pint", "pint"),
      pfloat    : new FloatProperty(0, "pfloat", "pfloat", "pfloat"),
      str       : new StringProperty("", "str", "str", "str"),
      bool      : new BoolProperty(false, "bool", "bool", "bool"),
      val_input : new StringProperty("", "val_input", "val_input", "val_input")
    };
    
    this.outputs = {
    };
    
    for (var k in this.inputs) {
      this.inputs[k].flag |= TPropFlags.PRIVATE;
    }
  }
  
  undo_pre(Context ctx) {
    this._undocpy = g_app_state.create_undo_file();
  }

  undo(Context ctx) {
    g_app_state.load_undo_file(this._undocpy);
  }
  
  get_prop_input(String path, ToolProperty prop) {
    if (prop == undefined) {
      console.trace("Warning: DataPathOp failed!", path, prop);
      return;
    }
    
    var input;
    
    if (prop.type == PropTypes.INT) {
      input = this.inputs.pint;
    } else if (prop.type == PropTypes.FLOAT) {
      input = this.inputs.pfloat;
    } else if (prop.type == PropTypes.VEC3) {
      input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec3;
    } else if (prop.type == PropTypes.VEC4) {
      input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec4;
    } else if (prop.type == PropTypes.BOOL) {
      input = this.inputs.bool;
    } else if (prop.type == PropTypes.STR) {
      input = this.inputs.str;
    } else if (prop.type == PropTypes.FLAG) {
      input = this.inputs.str;
    } else if (prop.type == PropTypes.ENUM) {
      input = this.inputs.pint;
    } else {
      console.trace("ERROR: unimplemented prop type "+prop.type+"in DataPathOp", prop, this);
      return undefined;
    }
    
    return input;
  }
  
  exec(ToolContext ctx) {
    var api = g_app_state.api;
    
    var path = this.inputs.path.data.trim();
    
    //HA! FINALLY! A use case where passing
    //ctx to DataAPI.get_XXX, instead of caching
    //one in DataAPI, makes sense!
    
    var prop = api.get_prop_meta(ctx, path);
    if (prop == undefined) {
      console.trace("Warning: DataPathOp failed!");
      return;
    }
    
    var input = this.get_prop_input(path, prop);
    
    api.set_prop(ctx, path, input.data);
  }
}


/*note: datapathops can only access data paths
  in ToolContext, u.e. object, scene, and mesh.*/
class MassSetPathOp extends ToolOp {
  constructor(String path="", String subpath="", String filterstr="", bool use_simple_undo=false) {
    ToolOpAbstract.call(this, "DataPathOp", "DataPath", "DataPath Value Set");
    
    this.use_simple_undo = use_simple_undo;
    this.is_modal = false;
    this.path = path;
    this.subpath = subpath;
    this.filterstr = filterstr;
    
    
    this.inputs = {
      path      : new StringProperty(path, "path", "path", "path"),
      vec3      : new Vec3Property(undefined, "vec3", "vec3", "vec3"),
      vec4      : new Vec4Property(undefined, "vec4", "vec4", "vec4"),
      pint      : new IntProperty(0, "pint", "pint", "pint"),
      pfloat    : new FloatProperty(0, "pfloat", "pfloat", "pfloat"),
      str       : new StringProperty("", "str", "str", "str"),
      bool      : new BoolProperty(false, "bool", "bool", "bool"),
      val_input : new StringProperty("", "val_input", "val_input", "val_input")
    };
    
    this.outputs = {
    };
    
    for (var k in this.inputs) {
      this.inputs[k].flag |= TPropFlags.PRIVATE;
    }
  }
  
  _get_value(Context ctx) {
    var path = this.path.trim();
    
    var prop = api.get_prop_meta(ctx, path);
    if (prop == undefined) {
      console.trace("Warning: DataPathOp failed!");
      return;
    }
    
    return this.get_prop_input(path, prop);
  }
  
  undo_pre(Context ctx) {
    var value = this._get_value(ctx);
    var paths = ctx.api.build_mass_set_paths(ctx, this.path, this.subpath, value, this.filterstr);
    
    var ud = this._undo = {};
    for (var i=0; i<paths.length; i++) {
      var value2 = ctx.api.get_prop(paths[i]);
      
      ud[paths[i]] = JSON.stringify(value2);
    }
  }

  undo(Context ctx) {
    var value = this._get_value(ctx);
    var paths = ctx.api.build_mass_set_paths(ctx, this.path, this.subpath, value, this.filterstr);
    
    var ud = this._undo;
    for (var k in ud) {
      var data = JSON.parse(ud[k]);
      
      if (data == "undefined") data = undefined;
      ctx.api.set_prop(ctx, k, data);
    }
  }
  
  get_prop_input(String path, ToolProperty prop) {
    if (prop == undefined) {
      console.trace("Warning: DataPathOp failed!", path, prop);
      return;
    }
    
    var input;
    
    if (prop.type == PropTypes.INT) {
      input = this.inputs.pint;
    } else if (prop.type == PropTypes.FLOAT) {
      input = this.inputs.pfloat;
    } else if (prop.type == PropTypes.VEC3) {
      input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec3;
    } else if (prop.type == PropTypes.VEC4) {
      input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec4;
    } else if (prop.type == PropTypes.BOOL) {
      input = this.inputs.bool;
    } else if (prop.type == PropTypes.STR) {
      input = this.inputs.str;
    } else if (prop.type == PropTypes.FLAG) {
      input = this.inputs.str;
    } else if (prop.type == PropTypes.ENUM) {
      input = this.inputs.pint;
    } else {
      console.trace("ERROR: unimplemented prop type "+prop.type+"in DataPathOp", prop, this);
      return undefined;
    }
    
    return input;
  }
  
  exec(ToolContext ctx) {
    var api = g_app_state.api;
    
    var path = this.inputs.path.data.trim();
    
    //HA! FINALLY! A use case where passing
    //ctx to DataAPI.get_XXX, instead of caching
    //one in DataAPI, makes sense!
    
    var prop = api.get_prop_meta(ctx, path);
    if (prop == undefined) {
      console.trace("Warning: DataPathOp failed!");
      return;
    }
    
    var input = this.get_prop_input(path, prop);
    api.mass_set_prop(ctx, path, this.subpath, input.data, this.filterstr);
  }
}


//generates default toolop STRUCTs/fromSTRUCTS, as needed
//genereated STRUCT/fromSTRUCT should be identical with 
//ToolOp.STRUCT/fromSTRUCT, except for the change in class name.
window.init_toolop_structs = function() {
  global defined_classes;
  
  function gen_fromSTRUCT(cls1) {
    function fromSTRUCT(reader) {
      var op = new cls1();
      //property templates
      var inputs = op.inputs, outputs = op.outputs;
      
      reader(op);
      
      //we need be able to handle new properties
      //so, copy default inputs/output slots,
      //then override.
      var ins = Object.create(inputs), outs = Object.create(outputs);
      
      for (var i=0; i<op.inputs.length; i++) {
        var k = op.inputs[i].key;
        ins[k] = op.inputs[i].value;
        
        if (k in inputs) {
          ins[k].load_ui_data(inputs[k]);
        } else {
          ins[k].uiname = ins[k].apiname = k;
        }
      }
      
      for (var i=0; i<op.outputs.length; i++) {
        var k = op.outputs[i].key;
        outs[k] = op.outputs[i].value;
        
        if (k in outputs) {
          outs[k].load_ui_data(outputs[k]);
        } else {
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
    //only consider classes that inherit from ToolOpAbstract
    var cls = defined_classes[i];
    var ok=false;
    var is_toolop = false;
    
    for (var j=0; j<cls.__clsorder__.length; j++) {
      if (cls.__clsorder__[j] == ToolOpAbstract) {
        ok = true;
      } else if (cls.__clsorder__[j] == ToolOp) {
        ok = true;
        is_toolop = true;
        break;
      }
    }
    if (!ok) continue;
    
    //console.log("-->", cls.name);
    if (!("STRUCT" in cls)) {
      cls.STRUCT = cls.name + " {" + """
        flag    : int;
        inputs  : iter(k, PropPair) | new PropPair(k, obj.inputs[k]);
        outputs : iter(k, PropPair) | new PropPair(k, obj.outputs[k]);
      """
      if (is_toolop)
        cls.STRUCT += "    saved_context  : SavedContext | obj.get_saved_context();\n";
      
      cls.STRUCT += "  }";
    }
    
    if (!("fromSTRUCT" in cls.__statics__)) {
      cls.fromSTRUCT = gen_fromSTRUCT(cls);
      define_static(cls, "fromSTRUCT", cls.fromSTRUCT);
    }
  }
}

//builds a basic, flexible mesh widget that centers on selected geometry
//gen_toolop has prototype: gen_toolop(ctx, id, widget) { }
class WidgetToolOp extends ToolOp {
  static create_widgets(ManipulatorManager manager, Context ctx) {
    var widget = manager.create();
    
    var enabled_axes = this.widget_axes;
    var do_widget_center = this.widget_center;
    var gen_toolop = this.gen_toolop;
    
    var do_x = enabled_axes[0], do_y = enabled_axes[1], do_z = enabled_axes[2];
    
    if (do_x) widget.arrow([1, 0, 0], 0, [1, 0, 0, 1]);
    if (do_y) widget.arrow([0, 1, 0], 1, [0, 1, 0, 1]);
    if (do_z) widget.arrow([0, 0, 1], 2, [0, 0, 1, 1]);
    
    //XXX implementme! do_center
    
    var this2 = this; //constructor, not instance
    function widget_on_tick(widget) {
      var mat = widget.matrix;
      var mesh = ctx.mesh;
      
      var cent = new Vector3();
      var len = 0;
      var v1 = new Vector3();
      
      for (var v of mesh.verts.selected) {
        cent.add(v.co);
        
        v1.load(v.edges[0].v1.co).sub(v.edges[0].v2.co);
        v1.normalize();
        
        len++;
      }
      
      if (len > 0)
        cent.mulScalar(1.0/len);
      
      mat.makeIdentity();
      mat.translate(cent[0], cent[1], cent[2]);
      
      if (this2.widget_align_normal) {
        var n = new Vector3();
        var tan = new Vector3();
        
        len = 0;
        var v1 = new Vector3();
        for (var f of mesh.faces.selected) {
          var e = f.looplists[0].loop.e;
          //v1.load(e.v2.co).sub(e.v1.co).normalize();
          //tan.add(v1);
          
          len++;
          n.add(f.no);
        }
        
        n.mulScalar(1.0/len);
        n.normalize();
        
        if (tan.dot(tan) == 0.0) {
          tan.loadXYZ(0, 0, 1);
        } else {
          tan.mulScalar(1.0/len);
          tan.normalize();
        }
        
        static zaxis = new Vector3([0, 0, -1]);
        
        var angle = Math.PI - Math.acos(zaxis.dot(n));
        if (n.dot(zaxis) > 0.9) { //n[0] == 0 && n[1] == 0 && n[2] == -1) {
          //angle = Math.PI;
        }
        
        if (1) { //Math.abs(angle) > 0.1) {
          if (Math.abs(angle) < 0.001 || Math.abs(angle) > Math.PI-0.001) {
            n.loadXYZ(1, 0, 0);
          } else {
            n.cross(zaxis);
            n.normalize();
          }
          
          var q = new Quat();
          q.axisAngleToQuat(n, angle);
          
          var rmat = q.toMatrix();
          mat.multiply(rmat);
        }
      }
      mat.multiply(ctx.object.matrix);
    }
    
    widget.on_tick = widget_on_tick;
    widget.on_click = function(widget, id) {
      console.log("widget click: ", id);
      
      //prevent drag transform
      ctx.view2d._mstart = null;
      
      var toolop = undefined;
      if (gen_toolop != undefined) {
        var toolop = gen_toolop(id, widget, ctx);
      } else {
        console.trace("IMPLEMENT ME! missing widget gen_toolop callback!");
        return;
      }
      
      if (toolop == undefined) {
        console.log("Evil! Undefined toolop in WidgetToolOp.create_widgets()!");
        return;
      }
      
      widget.user_data = toolop;
      toolop._widget_on_tick = widget_on_tick;
      toolop.widgets.push(widget);
      
      toolop.on_modal_end = function(toolop) {
        for (var w of toolop.widgets) {
        
          //destory all listeners belonging to w
          for (var k in toolop.inputs) {
            var p = toolop.inputs[k];  
            p.remove_listener(w, true); //second arg tells remove_listener to selectly fail
          }
          for (var k in toolop.outputs) {
            var p = toolop.outputs[k];
            p.remove_listener(w, true); //second arg tells remove_listener to selectly fail
          }
        }
        
        console.log("widget modal end");
        toolop.widgets = new GArray();
        widget.on_tick = widget_on_tick;
      }
      
      if (toolop.widget_on_tick)
        widget.widget_on_tick = toolop.widget_on_tick;
      
      widget.on_tick = function(widget) {
        toolop.widget_on_tick.call(toolop, widget);
      }
      /*
      widget.on_tick = function() {
        if (toolop.transdata == undefined) return;
        
        var c = toolop.transdata.center;
        var t = toolop.inputs.translation.data;
        var mat = widget.matrix;
        
        mat.makeIdentity();
        mat.translate(c[0], c[1], c[2]);
        mat.translate(t[0], t[1], t[2]);
        mat.multiply(ctx.object.matrix);
      }
      */
      g_app_state.toolstack.exec_tool(toolop);
    }
  }
  
  //only called while tool is running, in modal mode
  //by default, calls the the auto-generated on_tick
  //that's used outside of modal mode
  widget_on_tick(widget) {
    if (this._widget_on_tick != undefined)
      this._widget_on_tick(widget);
  }
}
