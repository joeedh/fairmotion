"use strict";



//interface

var _event_dag_idgen = undefined;



import 'J3DIMath';



window.the_global_dag = undefined;

export class NodeBase {

  //dag_exec(ctx) {

  //} can be undefined

  

  //field is name of property that's updated; if undefined,

  //child nodes of every field will be executed

  dag_update(field, data) {

    var graph = window.the_global_dag;

    var node = graph.get_node(this, false);

    

    //console.log("Updating node field", field, node);

    if (node != undefined)

      node.dag_update(field, data);

  }

  

  dag_unlink() {

    var graph = window.the_global_dag;

    var node = graph.get_node(this, false);

    

    if (node != undefined)

      window.the_global_dag.remove(node);

  }

}



export class UIOnlyNode extends NodeBase {

}



export class DataPathNode extends NodeBase {

  //returns datapath to get object

  dag_get_datapath(ctx) {

  }

}



Node.dag_inputs = {

/* basic type info.  e.g.:



  depend : undefined,

  number : 0,

  string : "sdf",

  vec3   : new Vector3(),

  bool   : true,

  number_array : [0, 0, 0, 0, 0],

*/

}

Node.dag_outputs = {

}



export var DagFlags = {

  UPDATE : 1,

  TEMP   : 2,

  DEAD   : 4

}



//private structures (except for EventDag)

export class EventNode {

  constructor() {

    this.flag = 0;

    this.id = -1;

    this.graph = undefined;

  }

  

  get_owner(ctx) {

  }

  

  on_remove(ctx) {

  }

  

  dag_update(field, data) {

    if (field == undefined) {

      for (var k in this.outputs) {

        this.dag_update(k);

      }

      return;

    }

    

    var sock = this.outputs[field];



    if (arguments.length > 1) {

      sock.data = data;

    }

    

    sock.flag |= DagFlags.UPDATE;

    this.flag |= DagFlags.UPDATE;

    

    for (var i=0; i<sock.edges.length; i++) {

      var e = sock.edges[i], n2 = e.opposite(sock).owner;

      

      //n2.flag |= DagFlags.UPDATE;

    }

    

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



EventNode.inputs = {

}

EventNode.outputs = {

}



export class IndirectNode extends EventNode {

  constructor(path) {

    EventNode.call(this);

    this.datapath = path;

  }

  

  get_owner(ctx) {

    if (this._owner != undefined)

      return this._owner;

      

    this._owner = ctx.api.get_object(ctx, this.datapath);

    return this._owner;

    //return ctx.api.get_object(ctx, this.datapath);

  }

}



export class DirectNode extends EventNode {

  constructor(id) {

    EventNode.call(this);

    

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

  ARRAY   : 256 //array of numbers only?

}



var TypeDefaults = t = {};

t[DataTypes.DEPEND] = undefined;

t[DataTypes.NUMBER] = 0;

t[DataTypes.STRING] = "";

t[DataTypes.VEC2]   = new Vector2();

t[DataTypes.MATRIX4] = new Vector3();

t[DataTypes.ARRAY] = [];

t[DataTypes.BOOL] = true;



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

    this.owner = owner;



    this.datatype = datatype;

    this.data = undefined;

    

    this.flag = DagFlags.UPDATE;

    

    this.edges = [];

  }

  

  copy() {

    var s = new EventSocket(this.name, undefined, this.type, this.datatype);

    return s;

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

      console.trace("Warning, got other to disconnect!");

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



//for client objects that are actually functions

function gen_callback_exec(func, thisvar) {

  for (var k in UIOnlyNode.prototype) {

    if (k == "toString") continue;

    func[k] = UIOnlyNode.prototype[k];

  }

  

  func.constructor = {};

  func.constructor.name = func.name;

  func.constructor.prototype = UIOnlyNode.prototype;

  

  func.dag_exec = function(ctx, graph) {

    var args = [];

    for (var k in this.constructor.dag_inputs) {

      args.push(this[k]);

    }

    

    this.apply(thisvar != undefined ? thisvar : self, args);

  }

}



export class EventDag {

  constructor() {

    this.nodes = [];

    this.sortlist = [];

    

    this.doexec = false;

    

    this.node_pathmap = {};

    this.node_idmap = {}; //only direct nodes have ids?

    this.object_idmap = {};

    

    this.idmap = {};

    

    this.ctx = undefined;

    

    if (_event_dag_idgen == undefined)

      _event_dag_idgen = new EIDGen();

      

    this.object_idgen = _event_dag_idgen;

    this.idgen = new EIDGen();

    this.resort = true;

  }

  

  reset_cache() {

    for (var n in this.nodes) {

      if (n instanceof IndirectNode) {

        n._owner = undefined;

      }

    }

  }

  

  init_slots(node, object) {

    function make_slot(stype, k, v) {

      var type;

      

      if (v === undefined || v === null)

        type = DataTypes.DEPEND;

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

            console.trace("WARNING: bad array being passed around!!", v);

          }

          type = DataTypes.ARRAY;

        }

      }

      

      return new EventSocket(k, node, stype, type);

    }

    

    node.inputs = {};

    node.outputs = {};

    

    if (object.constructor.dag_inputs != undefined) {

      for (var k in object.constructor.dag_inputs) {

        var v = object.constructor.dag_inputs[k];

        

        node.inputs[k] = make_slot('i', k, v);

      }

    }

    

    if (object.constructor.dag_outputs != undefined) {

      for (var k in object.constructor.dag_outputs) {

        var v = object.constructor.dag_outputs[k];

        

        node.outputs[k] = make_slot('o', k, v);

      }

    }

  }

  

  indirect_node(ctx, path, object=undefined, auto_create=true) {

    if (path in this.node_pathmap)

      return this.node_pathmap[path];

    if (!auto_create) return undefined;

    

    var node = new IndirectNode(path);

    this.node_pathmap[path] = node;

    

    if (object == undefined) {

      object = ctx.api.get_object(path);

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

    if (!(node instanceof EventNode))

      node = this.get_node(node, false);

    

    if (node == undefined) {

      console.log("node already removed");

      return;

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

    this.sortlist.remove(node);

    

    this.resort = true;

  }

  

  get_node(object, auto_create=true) {

    if (this.ctx == undefined)

      this.ctx = new Context();

    

    var node;

    

    if (object instanceof DataPathNode || ("dag_get_datapath" in object)) {

      node = this.indirect_node(this.ctx, object.dag_get_datapath(), object, auto_create);

      //console.log(node != undefined ? node.id : "", object.__prototypeid__, "getting path node", object.dag_get_datapath());

    } else {

      //console.log(object.__prototypeid__, "getting ui only node");

      node = this.direct_node(this.ctx, object, auto_create); //eek!!

    }

    

    /*We build a dag_exec bridge here,

      to avoid lots of calls to empty functions*/

      

    if (node != undefined && object.dag_exec != undefined && node.dag_exec == undefined) {

      //don't make cyclic reference from closure. . .

      //. . .pretty please?

      object = undefined;

      

      node.dag_exec = function(ctx) {

        var owner = this.get_owner(ctx);

        

        if (owner != undefined) {

          return owner.dag_exec.apply(owner, arguments);

        }

      }

    }

    

    return node;

  }

  

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

      

      dst.constructor.dag_inputs = {};

      

      if (srcfield instanceof Array) {

        for (var i=0; i<srcfield.length; i++) {

          var field = srcfield[i];

          var field2 = dstfield[i];

          

          //console.log("field", field, srcnode.inputs, srcnode);

          

          if (!(field in srcnode.outputs)) {

            throw new Error("Field not in outputs", field);

          }

          

          var type = srcnode.outputs[field].datatype;

          dst.constructor.dag_inputs[field2] = TypeDefaults[type];

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

          var n2 = sock.edges[i].opposite(sock).owner;

          

          if (!(n2.flag & DagFlags.TEMP)) {

            sort(n2);

          }

        }

      }

      

      sortlist.push(n);

      

      for (var k in n.outputs) {

        var sock = n.outputs[k];

        

        for (var i=0; i<sock.length; i++) {

          var n2 = sock.edges[i].opposite(sock).owner;

          

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

  

  exec(ctx) {

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

      

      //flag child nodes that need updating first

      for (var k in n.outputs) {

        var s = n.outputs[k];

        

        if (!(s.flag & DagFlags.UPDATE))

          continue;

          

        //console.log("Updating socket", k);

        for (var j=0; j<s.edges.length; j++) {

          //s.edges[j].opposite(s).flag |= DagFlags.UPDATE;

          s.edges[j].opposite(s).owner.flag |= DagFlags.UPDATE;

          

          //console.log("Updating child node", s.edges[j].opposite(s).owner.get_owner(new Context()));

        }

      }

      

      //does object have a dag node callback?

      if (owner == undefined || owner.dag_exec == undefined)

        continue;

      

      //pull from inputs

      for (var k in n.inputs) {

        var sock = n.inputs[k];

        

        for (var j=0; j<sock.edges.length; j++) {

          var e = sock.edges[j], s2 = e.opposite(sock);

          

          var n2 = s2.owner, owner2 = n2.get_owner(ctx);

          if (n2 == undefined) {

            //dead

            n2.flag |= DagFlags.DEAD;

            continue;

          }

          

          if ((sock.flag & DagFlags.UPDATE) || sock.datatype == DataTypes.DEPEND) {

            //for (var k=0; k<sock.edges.length; k++) {

              //sock.edges[k].opposite(sock).owner.flag |= DagFlags.UPDATE;

            //}

          }

          

          

          var data = s2.data != undefined || owner2 == undefined ? s2.data : owner2[s2.name];

          

          //cache data for later use if we need it, e.g. a node has died

          if (data != undefined)

            s2.data = data;

          

          switch (sock.datatype) {

            case DataTypes.DEPEND: //do nothing

              break; 

            case DataTypes.NUMBER:

            case DataTypes.STRING:

            case DataTypes.BOOL:

              owner[sock.name] = data;

              break;

            case DataTypes.VEC2:

              if (!(sock.name in owner)) { //create vector

                owner[sock.name] = new Vector2(data);

              } else {

                owner[sock.name].load(data);

              }

              break;

            case DataTypes.VEC3:

              if (!(sock.name in owner)) { //create vector

                owner[sock.name] = new Vector3(data);

              } else {

                owner[sock.name].load(data);

              }

              break;

            case DataTypes.VEC4:

              if (!(sock.name in owner)) { //create vector

                owner[sock.name] = new Vector4(data);

              } else {

                owner[sock.name].load(data);

              }

              break;

            case DataTypes.MATRIX4:

              if (!(sock.name in owner)) { //create vector

                owner[sock.name] = new Matrix4(data);

              } else {

                owner[sock.name].load(data);

              }

              break;

            case DataTypes.ARRAY:

              owner[sock.name] = data;

              break;

          }

        }

      }

            

      owner.dag_exec(ctx, this);

    }

  }

}



window.init_event_graph = function init_event_graph() {

  window.the_global_dag = new EventDag();



  _event_dag_idgen = new EIDGen();

}
