"use strict";

import {PropTypes, TPropFlags}  from './toolprops.js';
  
import {STRUCT} from './struct.js';
import {EventHandler} from "../editors/events.js";
import {charmap} from "../editors/events.js";

//makes e.x/e.y relative to dom,
//and also flips to origin at bottom left instead of top left
export function patchMouseEvent(e, dom) {
  dom = dom === undefined ? g_app_state.screen : dom;

  let e2 = {
    prototype : e
  };

  let keys = Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e));
  for (let k in e) {
    keys.push(k);
  }

  for (let k of keys) {
    try {
      e2[k] = e[k];
    } catch (error) {
      console.log("failed to set property", k);
      continue;
    }

    if (typeof e2[k] == "function") {
      e2[k] = e2[k].bind(e);
    }
  }

  let rect = dom.getClientRects()[0];

  if (rect === undefined) {
    console.warn("bad rect in toolops_api.patchMouseEvent");
    return e2;
  }

  e2.x = ((e.x === undefined ? e.clientX : e.x)-rect.left);
  e2.y = ((e.y === undefined ? e.clientY : e.y)-rect.top);

  e2.y = rect.height - e2.y;

  e2.x *= window.devicePixelRatio;
  e2.y *= window.devicePixelRatio;

  e2.original = e;

  return e2;
}

import {pushModalLight, popModalLight} from '../path.ux/scripts/util/simple_events.js';

/*
  basic design of tool ops:
  
  inspired by Blender's tool system.  each tool has
  a list of parameters, and are also passed a Context struct (a sort of
  bundle of common tool parameters).
  
  The main difference is that undo is implemented on top of this system.
  Tools that do not implement undo callbacks will trigger a complete copy
  of the data state.  This is to get new tools up and running quickly; 
  all tools should eventually get their own, faster callbacks (or at least
  inherit from super-classes with faster defaults, like SelectOpAbstract).
  
  Note that for some tools, serializing the app state prior to undo is
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
  TOOLOP REFACTOR 2:
  1. Transition to a 'tooldef' static method: <- PARTLY COMPLETE
     class SomeTool extends ToolOp {
        static tooldef() { return {
          apiname  : "load_image",
          uiname   : "Load Image",
          inputs   : ToolOp.inherit({}), //will inherit inputs from parent
          outputs  : ToolOp.inherit({}),
          icon     : -1,
          is_modal : false,
          description : "some tooltip"
        }}
     }
     
  2. Data_api_opdefine should auto-generate tool paths from .apiname.
  
  TOOLOP REFACTOR 1:
  
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
  USE_DEFAULT_INPUT          : 4,
  USE_REPEAT_FUNCTION        : 8,
  USE_TOOL_CONTEXT           : 16 //will use context in tool.ctx instead of providing one
};

//this is a bitmask!!
export var ModalStates = {
  TRANSFORMING : 1,
  PLAYING      : 2
};

//XXX need to do this properly at some point; toolops should
//an idgen that is saved in each file
var _tool_op_idgen = 1; 

class InheritFlag {
  constructor(val) {
    this.val = val;
  }
};

export class ToolOpAbstract {
  /*
  if presense, defines defaults:
  
  static tooldef() { return {
    apiname  : "load_image",
    uiname   : "Load Image",
    inputs   : ToolOp.inherit({}), //will inherit inputs from parent class
    outputs  : {},
    icon     : -1,
    is_modal : false,
    flag     : [see ToolFlags]
  }}
  */
  
  static inherit(inputs_or_outputs) {
    return new InheritFlag(inputs_or_outputs);
  }

  /*
  * this is like invoke, only instead
  * of returning one class it returns a list of them,
  * each with .ctx set to the context to execute with.
  *
  * this is used for e.g. running the same tool on multiple editable splines
  * */
  static invokeMultiple(ctx, args) {

  }

  static _get_slots() {
    var ret = [{}, {}];
    var parent = this.__parent__; //this.__parents__.length > 0 ? this.__parents__[0] : undefined;
    
    if (this.tooldef !== undefined
        && (parent === undefined || this.tooldef !== parent.tooldef) )
    {
      var tooldef = this.tooldef();
      for (var k in tooldef) {
        if (k !== "inputs" && k !== "outputs") {
          continue;
        }
        
        var v = tooldef[k];
        if (v instanceof InheritFlag) {
          v = v.val === undefined ? {} : v.val;
          
          var slots = parent._get_slots();
          slots = k === "inputs" ? slots[0] : slots[1];
          
          v = this._inherit_slots(slots, v);
        }
        
        ret[k === "inputs" ? 0 : 1] = v;
      }
    } else if (this.inputs !== undefined || this.outputs !== undefined) {
      console.trace("Deprecation warning: (second) old form\
                     of toolprop definition detected for", this);
                     
      if (this.inputs !== undefined) {
        ret[0] = this.inputs;
      }
      
      if (this.outputs !== undefined) {
        ret[1] = this.outputs;
      }
    } else {
      console.warn("Deprecation warning: oldest (and evilest) form\
                     of toolprop detected for", this);
    }
    
    return ret;
  }
  
  constructor(apiname, uiname, description=undefined, icon=-1) {
    var parent = this.constructor.__parent__; //__parents__.length > 0 ? this.constructor.__parents__[0] : undefined;

    //instantiate slots
    var slots = this.constructor._get_slots();
    
    for (var i=0; i<2; i++) {
      var slots2 = {};
      
      if (i == 0)
        this.inputs = slots2;
      else
        this.outputs = slots2;
      
      for (var k in slots[i]) {
        slots2[k] = slots[i][k].copy();
        slots2[k].apiname = k;
      }
    }
    
    if (this.constructor.tooldef !== undefined && (parent === undefined
        || this.constructor.tooldef !== parent.tooldef)) 
    {
      var tooldef = this.constructor.tooldef();
      
      for (var k in tooldef) {
        //we handled input/outputs above
        if (k === "inputs" || k === "outputs")
          continue;
          
        this[k] = tooldef[k];
      }
    } else {
      if (this.name === undefined)
        this.name = apiname;
      if (this.uiname === undefined)
        this.uiname = uiname;
      if (this.description === undefined)
        this.description = description === undefined ? "" : description;
      if (this.icon === undefined)
        this.icon = icon;
    }
    
    this.apistruct = undefined; //DataStruct, may or may not be set
    this.op_id = _tool_op_idgen++;
    this.stack_index = -1;
  }
  
  static _inherit_slots(old, newslots) {
    if (old === undefined) {
      console.trace("Warning: old was undefined in _inherit_slots()!");
      
      return newslots;
    }
    
    for (var k in old) {
      if (!(k in newslots))
        newslots[k] = old[k];
    }
    
    return newslots;
  }
  
  static inherit_inputs(cls, newslots) {
    if (cls.inputs === undefined)
      return newslots;
      
    return ToolOpAbstract._inherit_slots(cls.inputs, newslots);
  }

  static invoke(ctx, args) {
    let ret = new this();

    for (let k in args) {
      if (k in ret.inputs) {
        ret.inputs[k].setValue(args[k]);
      } else {
        console.warn("Unknown tool argument " + k, ret);
      }
    }

    return ret;
  }

  static inherit_outputs(cls, newslots) {
    if (cls.outputs === undefined)
      return newslots;
      
    return ToolOpAbstract._inherit_slots(cls.outputs, newslots);
  }
  
  get_saved_context() {
    if (this.saved_context === undefined) {
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
  default_inputs(ctx : Context, get_default : ToolGetDefaultFunc) {  }
  
  /*
  static unit_test_req(Context ctx) : ToolOpTestReq {}
  static unit_test(Context ctx) : ToolOpAbstract {}
  
  unit_test_pre(Context ctx) {}
  unit_test_post(Context ctx) {}
  */
}

ToolOpAbstract.STRUCT = `
  ToolOpAbstract {
      flag    : int;
      saved_context  : SavedContext | obj.get_saved_context();
      inputs  : iter(k, PropPair) | new PropPair(k, obj.inputs[k]);
      outputs : iter(k, PropPair) | new PropPair(k, obj.outputs[k]);
  }
`;

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

PropPair.STRUCT = `
  PropPair {
    key   : string;
    value : abstract(ToolProperty);
  }
`;

let _toolop_tools = undefined;

export class ToolOp extends ToolOpAbstract {
  drawlines : GArray
  is_modal : boolean
  undoflag : number
  flag : number
  modal_running : boolean;

  constructor(apiname = "(undefined)",
              uiname="(undefined)",
              description=undefined,
              icon=-1)
  {
    super(apiname, uiname, description, icon);
    EventHandler.prototype.EventHandler_init.call(this);
    
    this.drawlines = new GArray();
    
    //XXX
    if (this.is_modal === undefined)
      this.is_modal = false;
    
    this.undoflag = 0;
    this.on_modal_end = undefined; //modal end callback
    
    this.modal_ctx = null;
    this.flag = 0;
    
    this.keyhandler = undefined;
    this.parent = undefined; //parent macro
    
    this.widgets = [];
    this.modal_running = false;
    
    this._widget_on_tick = undefined;
  }
  
  new_drawline(v1, v2, color, line_width) {
    var dl = this.modal_ctx.view2d.make_drawline(v1, v2, undefined, color, line_width);
    
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
  
  /*creates workspace widgets, that either
     a), create a new toolop of this type
          whenever they are clicked, or
     b), creates a toolop of this type if
         the active tool isn't one already,
         otherwise edits the active toolop.
  */
  static create_widgets(manager : ManipulatorManager, ctx : Context) {
  }
  
  /*forcably resets widgets to "default" state (the meaning of which
    may vary from tool to tool).*/
  static reset_widgets(op : ToolOp, ctx : Context) {
  }
  
  undo_ignore() {
    this.undoflag |= UndoFlags.IGNORE_UNDO;
  }
  
  on_mousemove() {
    redraw_viewport();
  }

  exec_pre(tctx : ToolContext) {
    for (var k in this.inputs) {
      if (this.inputs[k].type === PropTypes.COLLECTION) {
        this.inputs[k].ctx = tctx;
      }
    }
    
    for (var k in this.outputs) {
      if (this.outputs[k].type === PropTypes.COLLECTION) {
        this.outputs[k].ctx = tctx;
      }
    }
  }
  
  //pops tool from undo history
  cancel_modal(ctx : Context) {
    console.log("cancel");
    ctx.toolstack.toolop_cancel(this);
  }

  start_modal(ctx : Context) {
  }
  
  /*private function*/
  _start_modal(ctx : Context) {
    this.modal_running = true;

    let active_area = ctx.active_area;
    let patch = (e) => {
      let dom = active_area ? active_area : g_app_state.screen;
      //console.log("dom", dom.tagName);
      return patchMouseEvent(e, dom);
    };

    //ctx.view2d.push_modal(this);
    //for (let k in )
    let handlers = {
      on_mousedown : (e) => this.on_mousedown(patch(e)),
      on_mousemove : (e) => this.on_mousemove(patch(e)),
      on_mouseup : (e) => this.on_mouseup(patch(e)),
      on_keydown : this.on_keydown.bind(this),
      on_keyup : this.on_keyup.bind(this)
    };


    this._modal_state = pushModalLight(handlers);
    this.modal_ctx = ctx;
  }

  _end_modal() {
    var ctx = this.modal_ctx;
    
    this.modal_running = false;
    this.saved_context = new SavedContext(this.modal_ctx);

    if (this._modal_state !== undefined) {
      //this.modal_ctx.view2d.pop_modal();
      popModalLight(this._modal_state);
      this._modal_state = undefined;
    }

    if (this.on_modal_end !== undefined)
      this.on_modal_end(this);
    
    this.reset_drawlines(ctx);
  }

  end_modal() {/*called by inheriting tools*/
      this._end_modal();
  }

  can_call(ctx : Context) { return true; }
  exec(ctx : Context) { }
  start_modal(ctx : Context) { }

  //called after redo execution
  redo_post(ctx : Context) {
    window.redraw_viewport();
  }
  
  /*default undo implementation simply copies the mesh before running the tool.
    remember when overriding to override undo_pre, too, otherwise the tool will
    be copying the mesh unnecessarily*/
    
  undo_pre(ctx : Context) {
    this._undocpy = g_app_state.create_undo_file();
    window.redraw_viewport();
  }

  undo(ctx : Context) {
    g_app_state.load_undo_file(this._undocpy);
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
    if (_toolop_tools === undefined) {
      _toolop_tools = {};
      
      for (let c of defined_classes) {
        if (c instanceof ToolOp) _toolop_tools[c.name] = c;
      }
    }
    
    return _toolop_tools[c];
  }
}

ToolOp.STRUCT = `
  ToolOp {
      flag    : int;
      saved_context  : SavedContext | obj.get_saved_context();
      inputs  : iter(k, PropPair) | new PropPair(k, obj.inputs[k]);
      outputs : iter(k, PropPair) | new PropPair(k, obj.outputs[k]);
  }
`;

export class ToolMacro extends ToolOp {
  cur_modal : number
  _chained_on_modal_end : boolean
  tools : GArray;

  constructor (name, uiname, tools) {
    super(name, uiname);
    
    this.cur_modal = 0;
    this._chained_on_modal_end = false;
    
    if (tools === undefined)
      this.tools = new GArray<ToolOp>();
    else
      this.tools = new GArray<ToolOp>(tools);
  }

  add_tool(tool : ToolOp) {
    tool.parent = this;
    
    this.tools.push(tool);
    if (tool.is_modal)
      this.is_modal = true;
  }
  
  connect_tools(output : ToolOp, input : ToolOp)
  {
    var old_set = input.userSetData;
    
    input.userSetData = function() {
      this.data = output.data;
      
      old_set.call(this, this.data);
    }
  }

  undo_pre(ctx : Context) {
  }

  undo(ctx : Context) {
    for (var i=this.tools.length-1; i >= 0; i--) {
      if (this.tools[i].undoflag & UndoFlags.HAS_UNDO_DATA) {
        this.tools[i].undo(ctx);
      }
    }
  }

  exec(ctx : ToolContext) {
    for (var i=0; i<this.tools.length; i++) {
      if (!(this.tools[i].flag & ToolFlags.USE_TOOL_CONTEXT)) {
        this.tools[i].saved_context = this.saved_context;
      }
    }
    
    for (let op of this.tools) {
      if (op.is_modal)
        op.is_modal = this.is_modal;

      let tctx = (op.flag & ToolFlags.USE_TOOL_CONTEXT) ? op.ctx : ctx;

      for (var k in op.inputs) {
        var p = op.inputs[k];
        
        if (p.userSetData != undefined)
          p.userSetData.call(p, p.data);
      };

      if (!(op.flag & ToolFlags.USE_TOOL_CONTEXT)) {
        op.saved_context = this.saved_context;
      }

      op.undo_pre(tctx);
      
      op.undoflag |= UndoFlags.HAS_UNDO_DATA;
      
      op.exec_pre(tctx);
      op.exec(tctx);
    }
  }

  can_call(ctx : Context) {
    return this.tools[0].can_call(ctx); //only check with first tool
  }
  
  _start_modal(ctx) {
    //do nothing here
  }
  
  start_modal(ctx : Context) {
    if (!this._chained_on_modal_end) {
      //find last modal op, and chain its on_modal_end callback
      let last_modal = undefined;
      
      for (let op of this.tools) {
        if (op.is_modal)
          last_modal = op;
      }
      
      console.log("last_modal", last_modal);
      
      if (last_modal !== undefined) {
        let on_modal_end = last_modal.on_modal_end;
        let this2 = this;
        
        last_modal.on_modal_end = function(toolop) {
          if (on_modal_end !== undefined)
            on_modal_end(toolop);
          
          if (this2.on_modal_end)
            this2.on_modal_end(this2);
        }
        
        this._chained_on_modal_end = true;
      }
    }
    
    for (let i=0; i<this.tools.length; i++) {
      this.tools[i].saved_context = this.saved_context;
    }
    
    for (let i=0; i<this.tools.length; i++) {
      let op = this.tools[i];
      
      if (op.is_modal) {
        this.cur_modal = i;
        
        for (let k in op.inputs) {
          let p = op.inputs[k];
          
          if (p.userSetData !== undefined)
            p.userSetData.call(p, p.data);
        }
        
        op.__end_modal = op._end_modal;
        op._end_modal = (ctx) => {
          op.__end_modal(ctx);
          
          this.next_modal(ctx ? ctx : this.modal_ctx);
        };
        
        op.modal_ctx = this.modal_ctx;
        op.modal_tctx = this.modal_tctx;
        
        op.saved_context = this.saved_context;
        
        op.undo_pre(ctx);
        op.undoflag |= UndoFlags.HAS_UNDO_DATA;
        
        op.modal_running = true;

        op._start_modal(ctx);
        return op.start_modal(ctx);
      } else {
        for (let k in op.inputs) {
          let p = op.inputs[k];
          
          if (p.userSetData !== undefined)
            p.userSetData(p, p.data);
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
    this.next_modal(this.modal_ctx);
  }

  next_modal(ctx : Context) {
    console.log("next_modal called");
    
    //okay, I don't think this is needed
    //this.tools[this.cur_modal].end_modal(ctx);
    
    this.cur_modal++;
    
    while (this.cur_modal < this.tools.length && !this.tools[this.cur_modal].is_modal) {
      this.cur_modal++;
    }
    
    if (this.cur_modal >= this.tools.length) {
      super._end_modal();
    } else {
      console.log("next_modal op", this.tools[this.cur_modal]);
      
      this.tools[this.cur_modal].undo_pre(ctx);
      this.tools[this.cur_modal].undoflag |= UndoFlags.HAS_UNDO_DATA;
      
      this.tools[this.cur_modal]._start_modal(ctx);
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

ToolMacro.STRUCT = STRUCT.inherit(ToolMacro, ToolOp) + `
  tools   : array(abstract(ToolOp));
  apiname : string;
  uiname  : string;
}
`

import {
        StringProperty, Vec3Property, Vec4Property, 
        IntProperty, FloatProperty, BoolProperty
       } from './toolprops.js';
import {pushModalLight} from "../path.ux/scripts/util/simple_events.js";
import {popModalLight} from "../path.ux/scripts/util/simple_events.js";

/*note: datapathops can only access data paths
  in ToolContext, u.e. object, scene, and mesh.*/
class DataPathOp extends ToolOp {
  is_modal : boolean
  inputs : Object
  outputs : Object;

  constructor(String path="", use_simple_undo=false) {
    super("DataPathOp", "DataPath", "DataPath Value Set");
    
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

mixin(ToolOp, EventHandler);

/*note: datapathops can only access data paths
  in ToolContext, u.e. object, scene, and mesh.*/
class MassSetPathOp extends ToolOp {
  is_modal : boolean
  inputs : Object
  outputs : Object;

  constructor(String path="", String subpath="", String filterstr="", bool use_simple_undo=false) {
    super("DataPathOp", "DataPath", "DataPath Value Set");
    
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
    var paths = ctx.api.buildMassSetPaths(ctx, this.path, this.subpath, value, this.filterstr);
    
    var ud = this._undo = {};
    for (var i=0; i<paths.length; i++) {
      var value2 = ctx.api.get_prop(paths[i]);
      
      ud[paths[i]] = JSON.stringify(value2);
    }
  }

  undo(Context ctx) {
    var value = this._get_value(ctx);
    var paths = ctx.api.buildMassSetPaths(ctx, this.path, this.subpath, value, this.filterstr);
    
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
    
    var parent = cls.prototype.__proto__.constructor;

    while (parent) {
      if (parent === ToolOpAbstract) {
        ok = true;
      } else if (parent === ToolOp) {
        ok = true;
        is_toolop = true;
        break;
      }
      
      parent = parent.prototype.__proto__;

      if (!parent)
        break;

      parent = parent.constructor;

      if (!parent || parent === Object)
        break;
    }

    if (!ok) continue;

    //console.log("-->", cls.name);

    if (!Object.hasOwnProperty(cls, "STRUCT")) {
      cls.STRUCT = cls.name + " {" + `
        flag    : int;
        inputs  : iter(k, PropPair) | new PropPair(k, obj.inputs[k]);
        outputs : iter(k, PropPair) | new PropPair(k, obj.outputs[k]);
      `
      if (is_toolop)
        cls.STRUCT += "    saved_context  : SavedContext | obj.get_saved_context();\n";
      
      cls.STRUCT += "  }";
    }

    if (!cls.fromSTRUCT) {
      cls.fromSTRUCT = gen_fromSTRUCT(cls);
      //define_static(cls, "fromSTRUCT", cls.fromSTRUCT);
    }
  }
};

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
