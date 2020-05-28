"use strict";

//interface
var _event_dag_idgen = undefined;

import '../util/vectormath.js';

/*
NodeBase is protocol to define node types;  EventDag uses it to internally build
EventNodes.
*/


class InheritFlag {
  constructor(data) {
    this.data = data;
  }
}

window.the_global_dag = undefined;
export class NodeBase {
  //if output_socket_name is undefined,
  //will update all outputs
  dag_update(output_socket_name : string, data) {
    var graph = window.the_global_dag;
    var node = graph.get_node(this, false);

    //console.log("Updating node field", field, node);
    if (node !== undefined) {
      node.dag_update(output_socket_name, data);
    } else if (DEBUG.dag) {
      console.warn("Failed to find node data for ",
                    this.dag_get_datapath !== undefined ? this.dag_get_datapath(g_app_state.ctx) : this,
                    "\nThis is not necassarily an error");
    }
  }

  /*
  inputs/outputs are {} maps of names to sockets.

  See EventSocket.  If you update an output socket,
  call .update();
  */

  //dag_exec(ctx, inputs, outputs, graph) {
  //} can be undefined

  static nodedef() {
    /* example:
  static nodedef() { return {
    name : "",
    uiName : "",
    inputs : NodeBase.Inherit({ //will inherit from parent
      depend : undefined,
      number : 0,
      string : "sdf",
      vec3   : new Vector3(),
      bool   : true,
      number_array : [0, 0, 0, 0, 0],
      set : new set(), //Symbol.keyhash() using set, not built-in JS Set() class
    }),
    outputs : {} //will not inherit from parent
  }}*/
  }

  static Inherit(data={}) {
    return new InheritFlag(data);
  }

  dag_unlink() {
    var graph = window.the_global_dag;
     var node = graph.get_node(this, false);
    
    if (node != undefined)
      window.the_global_dag.remove(node);
  }
}

/*note type that wraps object field for sockets directly
Example of usage:

class Bleh extends NodeBaseDirectSockets {
  constructor() {
    this.something = 1;
  }

  dag_exec(ctx, inputs, outputs, graph) {
    //update sockets
    super.dag_exec(ctx, inputs, outputs, graph);

    this.other = 3;

    //this will set outputs for you
    this.dag_exec_finish(ctx, inputs, outputs, graph);
  }

  static nodedef() {return {
    name : "bleh"
    inputs : {
      something : 0,
    }
    outputs : {
      other : 2
    }
  }}
}
 */
export class NodeFieldSocketWrapper extends NodeBase {
  dag_exec(ctx, inputs, outputs, graph) {
    for (let k in inputs) {
      let sock = inputs[k];

      switch (sock.datatype) {
        case DataTypes.VEC2:
        case DataTypes.VEC3:
        case DataTypes.VEC4:
        case DataTypes.MATRIX4:
          if (this[k] === undefined) {
            this[k].load(sock.data);
          } else {
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
      let sock = outputs[k];

      sock.loadData(this[k]);
    }
  }
}

export class UIOnlyNode extends NodeBase {
}

export class DataPathNode extends NodeBase {
  //returns datapath to get object
  dag_get_datapath(ctx) {
  }

  //have to be compatible with DataPathWrapperNode too
  static isDataPathNode(obj) {
    return obj.dag_get_datapath !== undefined;
  }
}

export class DataPathWrapperNode extends NodeFieldSocketWrapper {
  //returns datapath to get object
  dag_get_datapath(ctx) {
  }
}

export var DagFlags = {
  UPDATE : 1,
  TEMP   : 2,
  DEAD   : 4
}

/*
* private structures
* */

function make_slot(stype, k, v, node) {
  var type;

  if (v === undefined || v === null)
    type = DataTypes.DEPEND;
  else if (v instanceof set)
    type = DataTypes.SET;
  else if (v === true || k === false)
    type = DataTypes.BOOL
  else if (typeof v == "number")
    type = DataTypes.NUMBER
  else if (typeof v == "string" || v instanceof String)
    type = DataTypes.STRING
  else if (v instanceof Vector2)
    type = DataTypes.VEC2
  else if (v instanceof Vector3)
    type = DataTypes.VEC3
  else if (v instanceof Vector4)
    type = DataTypes.VEC4
  else if (v instanceof Matrix4)
    type = DataTypes.MATRIX4
  else if (v instanceof Array) {
    for (var i=0; i<v.length; i++) {
      //allow undefined and null?
      if (typeof(v[i]) != "number" && typeof(v[i]) != undefined) {
        warntrace("WARNING: bad array being passed around!!", v);
      }
      type = DataTypes.ARRAY;
    }
  }

  return new EventSocket(k, node, stype, type);
}


function get_sockets(cls, key) {
  if (cls.nodedef === undefined) {
    console.warn("Warning, missing node definition nodedef() for ", cls, cls);
    return {};
  }

  let ndef = cls.nodedef();
  let socks = ndef[key];

  if (socks === undefined) {
    return {};
  }

  if (socks instanceof InheritFlag) {
    socks = socks.data;
    let parent = cls.__parent__;

    console.log("INHERITANCE", cls, parent);

    if (parent === undefined) {
      return socks;
    }

    socks = Object.assign({}, socks);

    let socks2 = get_sockets(parent, key);
    for (let k in socks2) {
      if (socks[k] === undefined) {
        socks[k] = socks2[k];
      }
    }
  }

  return socks;
}

function build_sockets(cls, key) {
  let socks = get_sockets(cls, key);
  let socks2 = {};

  for (let k in socks) {
    let sock = socks[k];

    if (!(sock instanceof EventSocket)) {
      socks2[k] = make_slot(key=="inputs" ? "i" : "o", k, sock, undefined);
    } else {
      socks2[k] = sock.copy();
    }
  }

  return socks2;
}

/**
takes return of nodedef() and
builds final socket lists, converted
to EventSockets and any requested inheritance
applied.

the result in then cached.
*/
function get_ndef(cls) {
  if (cls._cached_nodedef !== undefined) {
    return cls._cached_nodedef;
  }

  let ndef;

  if (cls.nodedef === undefined) {
    console.warn("Warning, no nodedef for cls", cls, "inheriting...");
    let cls2 = cls;

    while (cls2 !== undefined) {
      if (cls2.nodedef) {
        ndef = Object.assign({}, cls2.nodedef()); //make copy
        break;
      }
      cls2 = cls2.__parent__;
    }

    if (ndef === undefined) {
      console.warn("Failed to find nodedef static for class", cls);
      throw new Error("Failed to find nodedef static for class" + cls);
    }
  } else {
    ndef = cls.nodedef();
  }

  cls._cached_nodedef = ndef;

  ndef.inputs = build_sockets(cls, "inputs");
  ndef.outputs = build_sockets(cls, "outputs");

  return ndef;
}

/*
gets node inputs with all sockets converted
to EventSockets and any inheritance applied.
*/
export function finalNodeDefInputs(cls) {
  return get_ndef(cls).inputs;
}

/*
gets node inputs with all sockets converted
to EventSockets and any inheritance applied.
*/
export function finalNodeDefOutputs(cls) {
  return get_ndef(cls).outputs;
}

//private structures
export class EventNode {
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

  /*
  if field is undefined then will update
  all sockets
  */

  dag_update(field, data) {
    if (DEBUG.dag) {
      console.trace("dag_update:", field, data);
    }

    if (field === undefined) {
      for (var k in this.outputs) {
        this.dag_update(k);
      }

      return;
    }
    
    var sock = this.outputs[field];

    if (arguments.length > 1) {
      sock.loadData(data);
    }

    sock.update();
    this.flag |= DagFlags.UPDATE;

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

/**
 Links to nodes without actually linking to the
 physical references.  This is the internal node
 version of DataPathNode.
 */
export class IndirectNode extends EventNode {
  constructor(path) {
    super();
    this.datapath = path;
  }
  
  get_owner(ctx) {
    if (this._owner != undefined)
      return this._owner;

    this._owner = ctx.api.getObject(ctx, this.datapath);
    return this._owner;
  }
}

export class DirectNode extends EventNode {
  constructor(id) {
    super();
    
    this.objid = id;
  }
  
  get_owner(ctx) {
    return this.graph.object_idmap[this.objid];
  }
}

//inputs/outputs all correspond to object fields?

export var DataTypes = {
  DEPEND  : 1,
  NUMBER  : 2,
  BOOL    : 4,
  STRING  : 8,
  VEC2    : 16,
  VEC3    : 32,
  VEC4    : 64,
  MATRIX4 : 128,
  ARRAY   : 256, //array of numbers only?
  SET     : 512
}

var TypeDefaults = t = {};
t[DataTypes.DEPEND] = null;
t[DataTypes.NUMBER] = 0;
t[DataTypes.STRING] = "";
t[DataTypes.VEC2]   = () => new Vector2();
t[DataTypes.MATRIX4] = () => new Vector3();
t[DataTypes.ARRAY] = [];
t[DataTypes.BOOL] = true;
t[DataTypes.SET] = () => new set();

export function makeDefaultSlotData(type) {
  let ret = TypeDefaults[type];

  if (typeof ret == "function") {
    return ret();
  }

  return ret;
}
//this would normally be a local function
//but I don't want to form a closure and get memory leaks
function wrap_ndef(ndef) {
  return function() {
    return ndef;
  };
}

export class EventEdge {
  constructor(dst, src) {
    this.dst = dst;
    this.src = src;
  }
  
  opposite(socket) {
    return socket == this.dst ? this.src : this.dst;
  }
}

export class EventSocket {
  constructor(name, owner, type, datatype) { //type can be either lower-case 'i' or 'o'
    this.type = type;

    this.name = name;
    this.node = node;

    this.datatype = datatype;
    this.data = undefined;
    
    this.flag = DagFlags.UPDATE;
    
    this.edges = [];
  }

  update() {
    this.flag |= DagFlags.UPDATE;
  }

  copy() {
    var s = new EventSocket(this.name, undefined, this.type, this.datatype);

    s.loadData(this.data, false);

    if (s.data === undefined) {
      s.data = makeDefaultSlotData(this.datatype);
    }

    return s;
  }

  loadData(data, auto_set_update=true) {
    let update = false;

    switch (this.datatype) {
      case DataTypes.VEC2:
      case DataTypes.VEC3:
      case DataTypes.VEC4:
      case DataTypes.MATRIX4:
        update = auto_set_update && this.data.equals(data);

        this.data.load(data);
        break;
      default:
        update = auto_set_update && this.data === data;
        this.data = data;
    }

    if (update) {
      this.update();
    }
  }

  connect(b) {
    if (b.type == this.type) {
      throw new Error("Cannot put two inputs or outputs together");
    }
    
    var src, dst;
    if (this.type == "i") {
      src = b, dst = this;
    } else if (this.type == "o") {
      src = this, dst = b;
    } else {
      throw new Error("Malformed socket type.  this.type, b.type, this, b:", this.type, b.type, this, b);
    }
    
    var edge = new EventEdge(dst, src);
    
    this.edges.push(edge);
    b.edges.push(edge);
  }
  
  _find_edge(b) {
    for (var i=0; i<this.edges.length; i++) {
      if (this.edges[i].opposite(this) === b)
        return this.edges[i];
    }
    
    return undefined;
  }
  
  disconnect(other_socket) {
    if (other_socket == undefined) {
      warntrace("Warning, no other_socket in disconnect!");
      return;
    }
    
    var e = this._find_edge(other_socket);
    
    if (e != undefined) {
      other_socket.edges.remove(e);
      this.edges.remove(e);
    }
  }
  
  disconnect_all() {
    while (this.edges.length > 0) {
      var e = this.edges[0];
      
      e.opposite(this).edges.remove(e);
      this.edges.remove(e);
    }
  }
}

window._NodeBase = NodeBase;

//for client objects that are actually functions
function gen_callback_exec(func, thisvar) {
  //*
  for (var k of Object.getOwnPropertyNames(NodeBase.prototype)) {
    if (k == "toString") continue;

    func[k] = NodeBase.prototype[k];
  }//*/
  
  func.constructor = {};
  func.constructor.name = func.name;
  func.constructor.prototype = NodeBase.prototype;
  func.prototype = NodeBase.prototype;

  func.dag_exec = function(ctx, inputs, outputs, graph) {
    return func.apply(thisvar, arguments);
  }
}

export class EventDag {
  constructor(ctx) {
    this.nodes = [];
    this.sortlist = [];
    
    this.doexec = false;
    
    this.node_pathmap = {};
    this.node_idmap = {}; //only direct nodes have ids?
    this.object_idmap = {};
    
    this.idmap = {};
    
    this.ctx = ctx;
    
    if (_event_dag_idgen == undefined)
      _event_dag_idgen = new EIDGen();
      
    this.object_idgen = _event_dag_idgen;
    this.idgen = new EIDGen();
    this.resort = true;
  }
  
  reset_cache() {
    for (var n of this.nodes) {
      if (n instanceof IndirectNode) {
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

      for (let i = 0; i < 2; i++) {
        let key = i ? "outputs" : "inputs";
        let stype = i ? "o" : "i";

        //get_ndef() already converted/inherited sockets
        //node.outputs = build_sockets(object.constructor, "outputs");

        let sockdef = ndef[key];
        let socks = {};

        node[key] = socks;

        for (let k in sockdef) {
          let sock = sockdef[k].copy();

          //don't use slot definition's .data for collections,
          //which are designed to be passed around by reference
          //this is diferent from vectors/matrices, which are passed around by
          //value.
          if (sock.datatype == DataTypes.ARRAY || sock.datatype == DataTypes.SET) {
            sock.data = makeDefaultSlotData(sock.datatype);
          }

          sock.type = stype;
          sock.node = node;

          socks[k] = sock;
        }
      }
    } else {
      console.warn("Failed to find node definition", object);

      //failed to find nodedef
      node.inputs = {};
      node.outputs = {};
    }
  }
  
  indirect_node(ctx, path, object=undefined, auto_create=true) {
    if (path in this.node_pathmap)
      return this.node_pathmap[path];

    if (!auto_create) return undefined;

    var node = new IndirectNode(path);
    this.node_pathmap[path] = node;
    
    if (object === undefined) {
      //XXX getObject no longer gracefully handles undefined ctx,
      //make sure it exists
      ctx = ctx === undefined ? this.ctx : ctx;
      object = ctx.api.getObject(ctx, path);
    }
    
    //console.log(path);
    //console.log("api call; result:", object);
    
    this.init_slots(node, object);
    this.add(node);
    
    return node;
  }
  
  direct_node(ctx, object, auto_create=true) {
    if ("__dag_id" in object && object.__dag_id in this.node_idmap) {
      this.object_idmap[object.__dag_id] = object;
      return this.node_idmap[object.__dag_id]
    }
    
    if (!auto_create) return undefined;
    
    if (object.__dag_id == undefined)
      object.__dag_id = this.object_idgen.gen_id();
    
    var node = new DirectNode(object.__dag_id);
    node.id = object.__dag_id;
    
    //eww, direct references
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
    if (!(node instanceof EventNode)) {
      node = this.get_node(node, false);

      if (node == undefined) {
        console.log("node already removed");
        return;
      }
    }

    if (this.nodes.indexOf(node) < 0) {
      console.log("node not in graph", node);
    }

    node.unlink();
    
    if (node instanceof DirectNode) {
      delete this.object_idmap[node.objid];
      delete this.node_idmap[node.objid];
    } else if (node instanceof IndirectNode) {
      delete this.node_pathmap[node.datapath];
    }
    
    delete this.idmap[node.id];
    
    this.nodes.remove(node);

    if (this.sortlist.indexOf(node) >= 0) {
      this.sortlist.remove(node);
    }

    this.resort = true;
  }
  
  get_node(object, auto_create=true) {
    //already an event node?
    if (object instanceof EventNode) {
      return object;
    }

    var node;
    
    if (DataPathNode.isDataPathNode(object)) {
      node = this.indirect_node(this.ctx, object.dag_get_datapath(), object, auto_create);
      //console.log(node != undefined ? node.id : "", object.__prototypeid__, "getting path node", object.dag_get_datapath());
    } else {
      //console.log(object.__prototypeid__, "getting ui only node");
      node = this.direct_node(this.ctx, object, auto_create); //eek!!
    }
    
    /*We build a dag_exec bridge here,
      to avoid lots of calls to empty functions*/
      
    if (node !== undefined && object.dag_exec !== undefined && node.dag_exec === undefined) {
      //don't make cyclic reference from closure. . .
      //. . .pretty please?
      object = undefined;
      
      node.dag_exec = function(ctx, inputs, outputs, graph) {
        var owner = this.get_owner(ctx);
        
        if (owner !== undefined) {
          return owner.dag_exec.apply(owner, arguments);
        }
      }
    }
    
    return node;
  }

  /**
   src/dst can be either EventNodes,objects that follow NodeBase
   interface.

   src may also be a function; if so, a node will be generated internally.
   Functions should have the following prototype:

     function callback(ctx, inputs, outputs, graph) {
     }

   See NodeBase.dag_exec.
   */
  link(src, srcfield, dst, dstfield, dstthis) { //dstthis is for in case src is a function
    static sarr = [0], darr = [0];
    
    var obja = src, objb = dst;

    var srcnode = this.get_node(src);
    
    if (!(srcfield instanceof Array)) {
      sarr[0] = srcfield;
      srcfield = sarr;
    }
    
    if (!(dstfield instanceof Array)) {
      darr[0] = dstfield;
      dstfield = darr;
    }
    
    //callback nodes!
    if ((typeof dst == "function" || dst instanceof Function) && !dst._dag_callback_init) {
      gen_callback_exec(dst, dstthis);
      dst._dag_callback_init = true;
      delete dst.__prototypeid__;
      
      //.constructor was reset to {} by gen_callback_exec

      let ndef = {
        name : "function callback node",
        uiname : "function callback node",
        inputs : {},
        outputs : {}
      };

      //don't want to make closure here
      dst.constructor.nodedef = wrap_ndef(ndef);

      if (srcfield instanceof Array) {
        for (var i=0; i<srcfield.length; i++) {
          var field = srcfield[i];
          var field2 = dstfield[i];

          if (!(field in srcnode.outputs)) {
            console.trace(field, Object.keys(srcnode.outputs), srcnode);

            throw new Error("Field not in outputs: " + field);
          }

          let sock = srcnode.outputs[field];
          ndef.inputs[field2] = sock.copy();
        }
      }
    }
    
    var dstnode = this.get_node(dst);
    
    //console.log(srcnode, src);
    
    //ooh, array of fields?
    if (srcfield instanceof Array) {
      if (srcfield.length != dstfield.length) {
        throw new Error("Error, both arguments must be arrays of equal length!", srcfield, dstfield);
      }
      
      for (var i=0; i<dstfield.length; i++) {
        //console.log(dstnode, dstfield[i]);
        
        if (!(dstfield[i] in dstnode.inputs))
          throw new Error("Event inputs does not exist: " + dstfield[i]);
        if (!(srcfield[i] in srcnode.outputs))
          throw new Error("Event output does not exist: " + srcfield[i]);
          
        dstnode.inputs[dstfield[i]].connect(srcnode.outputs[srcfield[i]]);
      }
    } else {
      console.log(dstnode, dstfield);
      if (!(dstfield in dstnode.inputs)) 
        throw new Error("Event input does not exist: " + dstfield);
        
      if (!(srcfield in srcnode.outputs))
        throw new Error("Event output does not exist: " + srcfield);
      
      dstnode.inputs[dstfield].connect(srcnode.outputs[srcfield]);
    }
    
    this.resort = true;
  }
  
  //get rid of all unconnected nodes.
  //todo: should this be indirect nodes only?
  prune_dead_nodes() {
    var dellist = [];
    
    for (var n of this.nodes) {
      var tot = 0;
      
      for (var k in n.inputs) {
        tot += n.inputs[k].edges.length;
      }
      for (var k in n.outputs) {
        tot += n.outputs[k].edges.length;
      }
      
      if (tot == 0) {
        dellist.push(n);
      }
    }
    
    for (var n of dellist) {
      this.remove(n);
    }
  }
  
  sort() {
    this.prune_dead_nodes();
    
    var sortlist = [];
    var visit = {};
    
    for (var n of this.nodes) {
      n.flag &= ~DagFlags.TEMP;
    }
    
    function sort(n) {
      n.flag |= DagFlags.TEMP;
      
      for (var k in n.inputs) {
        var sock = n.inputs[k];
        
        for (var i=0; i<sock.length; i++) {
          var n2 = sock.edges[i].opposite(sock).node;
          
          if (!(n2.flag & DagFlags.TEMP)) {
            sort(n2);
          }
        }
      }
      
      sortlist.push(n);
      
      for (var k in n.outputs) {
        var sock = n.outputs[k];
        
        for (var i=0; i<sock.length; i++) {
          var n2 = sock.edges[i].opposite(sock).node;
          
          if (!(n2.flag & DagFlags.TEMP)) {
            sort(n2);
          }
        }
      }
    }
    
    var nlen = this.nodes.length, nodes = this.nodes;
    for (var i=0; i<nlen; i++) {
      var n = nodes[i];
      if (n.flag & DagFlags.TEMP)
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
    this.timer = window.setInterval(() => {
      if (this.doexec && this.ctx !== undefined) {
        this.exec(this.ctx);
      }
    }, 100);
  }

  exec(ctx) {
    if (ctx === undefined) {
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
    
    var sortlist = this.sortlist;
    var slen = sortlist.length;
    
    for (var i=0; i<slen; i++) {
      var n = sortlist[i];
      if (!(n.flag & DagFlags.UPDATE))
        continue;
      
      n.flag &= ~DagFlags.UPDATE;
      
      //this is where things get interesting. . .
      var owner = n.get_owner(ctx);
      
      //console.log("Executing DAG node", owner.constructor.name);
      
      if (owner == undefined) { //destroy!
        n.flag |= DagFlags.DEAD;
      }
      
      //console.log("have dag_exec?", owner.dag_exec != undefined);

      //does object have a dag node callback?
      if (owner == undefined || owner.dag_exec == undefined)
        continue;
      
      //pull from inputs
      for (var k in n.inputs) {
        var sock = n.inputs[k];
        
        for (var j=0; j<sock.edges.length; j++) {
          var e = sock.edges[j], s2 = e.opposite(sock);
          
          var n2 = s2.node, owner2 = n2.get_owner(ctx);
          if (n2 == undefined) {
            //dead
            n2.flag |= DagFlags.DEAD;
            continue;
          }
          
          if (s2.flag & DagFlags.UPDATE) {
            sock.loadData(s2.data);
          }

          //ignore any other input links
          //it's such a specialist case that client code
          //can fetch it themselves
          break;
        }
      }
            
      owner.dag_exec(ctx, n.inputs, n.outputs, this);

      //flag child nodes that need updating first
      for (var k in n.outputs) {
        var s = n.outputs[k];

        if (!(s.flag & DagFlags.UPDATE))
          continue;

        s.flag &= ~DagFlags.UPDATE;

        if (DEBUG.dag)
          console.log("Propegating updated socket", k);

        for (var j=0; j<s.edges.length; j++) {
          s.edges[j].opposite(s).node.flag |= DagFlags.UPDATE;
        }
      }

    }
  }
}

window.init_event_graph = function init_event_graph(ctx) {
  window.the_global_dag = new EventDag(ctx);
  window.the_global_dag.startUpdateTimer();

  _event_dag_idgen = new EIDGen();
}
