"use strict";

//interface
let _event_dag_idgen: EIDGen | undefined = undefined;

import "../util/vectormath.js";
import type { FullContext } from "./context.js";

/**

 NodeBase is an abstract protocol;  EventDag
 internally uses it to createEventNodes.

 Example:

 class View2D extends SomeNonRelatedBaseClass {
    constructor(ctx) {
      the_global_dag.direct_node(ctx, this);
    }

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
      }
    }

    dag_exec(ctx, inputs, outputs, graph) {
      if (!this.isConnected) { //not connected to DOM anymore?
        the_global_dag.remove(this);
      }
    }
 }

 the_global_dag.link(some_node, "depend", view2d, "depend");
 */

/*
 * What a socket carries. The type tag on the socket (DataTypes below) decides
 * which member of this union is live, and whether loadData() copies in place
 * (vectors, matrices) or by reference (everything else).
 */
export type SocketValue =
  | null
  | number
  | boolean
  | string
  | Vector2
  | Vector3
  | Vector4
  | Matrix4
  | number[]
  | set<number | string | object>;

/* Sockets as nodedef() declares them: either a bare default value, whose JS type
   picks the DataTypes tag, or a ready-made EventSocket to copy. */
export type SocketDefs = { [name: string]: SocketValue | EventSocket | undefined };

/* Which side of a node a socket sits on. */
export type SocketDir = "i" | "o";

/* Sockets after get_ndef() has resolved them. */
export type SocketMap = { [name: string]: EventSocket };

export interface NodeDef {
  name?: string;
  uiName?: string;
  inputs?: SocketDefs | InheritFlag;
  outputs?: SocketDefs | InheritFlag;
}

/* get_ndef() overwrites .inputs/.outputs on its cached copy with resolved
   sockets, so the cached object is this narrower shape. */
export interface FinalNodeDef extends NodeDef {
  inputs: SocketMap;
  outputs: SocketMap;
}

/* Any class that participates in the dag. __parent__ is path.ux's multiple-
   inheritance backlink, which is how Inherit() walks up. */
export interface NodeBaseClass {
  new (...args: never[]): object;

  nodedef?(): NodeDef;
  __parent__?: NodeBaseClass;
  _cached_nodedef?: FinalNodeDef;
}

/* The object a node stands for. Every member is optional because the dag also
   accepts plain functions and DOM elements. */
export interface DagOwner {
  __dag_id?: int;

  dag_exec?(ctx: FullContext, inputs: SocketMap, outputs: SocketMap, graph: EventDag): void;
  dag_get_datapath?(ctx?: FullContext): string;
}

/* A plain function used as a dag destination. link() runs gen_callback_exec()
   over it, which copies NodeBase's prototype onto the function object -- so a
   callback that has been linked also answers dag_unlink(). */
export interface DagCallback extends DagOwner {
  (ctx: FullContext, inputs: SocketMap, outputs: SocketMap, graph: EventDag): void;

  _dag_callback_init?: boolean;
  dag_unlink?(): void;

  /* path.ux stamps this on registered prototypes; link() clears it. */
  __prototypeid__?: int;
}

/* obj.constructor is typed Function, but a dag owner is either a class instance
   or a function gen_callback_exec() has stamped a stand-in constructor onto --
   both of which answer nodedef(). */
function ownerClass(object: DagOwner): NodeBaseClass {
  return object.constructor as NodeBaseClass;
}

/* A link destination may be a plain callback rather than a node owner. */
function isDagCallback(dst: EventNode | DagOwner): dst is DagCallback & Function {
  return typeof dst === "function" || dst instanceof Function;
}

/* A socket tagged VEC2/VEC3/VEC4/MATRIX4 carries a vector or matrix, and both
   ends of a link share the tag -- but nothing in the type system says so, so
   the two copy paths rediscover it here. */
function loadVectorData(dst: unknown, src: unknown): boolean {
  if (dst instanceof Vector2 && src instanceof Vector2) {
    let equals = dst.equals(src);
    dst.load(src);
    return equals;
  }

  if (dst instanceof Vector3 && src instanceof Vector3) {
    let equals = dst.equals(src);
    dst.load(src);
    return equals;
  }

  if (dst instanceof Vector4 && src instanceof Vector4) {
    let equals = dst.equals(src);
    dst.load(src);
    return equals;
  }

  if (dst instanceof Matrix4 && src instanceof Matrix4) {
    let equals = dst.equals(src);
    dst.load(src);
    return equals;
  }

  throw new TypeError("expected a matching pair of vectors or matrices");
}

/* A wrapper node's fields are named by its own socket map, so these two are
   as narrow as a field access gets. */
function getField(node: object, k: string): SocketValue | undefined {
  return Reflect.get(node, k);
}

function setField(node: object, k: string, value: SocketValue | undefined) {
  Reflect.set(node, k, value);
}

function copyVectorData(src: unknown): SocketValue {
  if (
    src instanceof Vector2 ||
    src instanceof Vector3 ||
    src instanceof Vector4 ||
    src instanceof Matrix4
  ) {
    return src.copy();
  }

  throw new TypeError("expected a vector or matrix");
}

/* Marks a nodedef() socket block as inheriting its parent class's sockets. */
class InheritFlag {
  data: SocketDefs;

  constructor(data: SocketDefs) {
    this.data = data;
  }
}

window.the_global_dag = undefined;

/* the_global_dag is undefined until init_event_graph() runs; everything that
   reaches for it runs after app startup. */
export function globalDag(): EventDag {
  const dag = window.the_global_dag;

  if (dag === undefined) {
    throw new Error("the event graph has not been created yet");
  }

  return dag;
}

export class NodeBase {
  /* Both hooks are optional: subclasses define dag_exec() if they compute
     anything, and dag_get_datapath() if they want an IndirectNode. */
  dag_exec?(ctx: FullContext, inputs: SocketMap, outputs: SocketMap, graph: EventDag): void;
  dag_get_datapath?(ctx?: FullContext): string;

  /* Assigned by EventDag.direct_node() the first time this object is added. */
  __dag_id?: int;

  //if output_socket_name is undefined,
  //will update all outputs
  dag_update(output_socket_name: string, data?: SocketValue) {
    let graph = globalDag();
    let node = graph.get_node(this, false);

    //console.log("Updating node field", field, node);
    if (node !== undefined) {
      node.dag_update(output_socket_name, data);
    } else if (DEBUG.dag) {
      console.warn(
        "Failed to find node data for ",
        this.dag_get_datapath !== undefined ? this.dag_get_datapath(g_app_state.ctx) : this,
        "\nThis is not necassarily an error"
      );
    }
  }

  /*
  inputs/outputs are {} maps of names to sockets.

  See EventSocket.  If you update an output socket,
  call .update();
  */

  //dag_exec(ctx, inputs, outputs, graph) {
  //} can be undefined

  static nodedef(): NodeDef | undefined {
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
    return undefined;
  }

  static Inherit(data: SocketDefs = {}) {
    return new InheritFlag(data);
  }

  dag_unlink() {
    let graph = globalDag();
    let node = graph.get_node(this, false);

    if (node !== undefined) graph.remove(node);
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
  dag_exec(ctx: FullContext, inputs: SocketMap, outputs: SocketMap, graph: EventDag) {
    for (let k in inputs) {
      let sock = inputs[k];

      switch (sock.datatype) {
        case DataTypes.VEC2:
        case DataTypes.VEC3:
        case DataTypes.VEC4:
        case DataTypes.MATRIX4:
          /* NOTE: the test is inverted -- it loads into the very field it just
             found missing, which throws.  Reproduced as-is; the copy below is
             the branch that has ever run. */
          if (getField(this, k) === undefined) {
            loadVectorData(getField(this, k), sock.data);
          } else {
            setField(this, k, copyVectorData(sock.data));
          }

          break;
        default:
          setField(this, k, sock.data);
      }
    }
  }

  dag_exec_finish(ctx: FullContext, inputs: SocketMap, outputs: SocketMap, graph: EventDag) {
    for (let k in outputs) {
      let sock = outputs[k];

      sock.loadData(getField(this, k));
    }
  }
}

export class UIOnlyNode extends NodeBase {}

export class DataPathNode extends NodeBase {
  /* Subclasses override this; the stub is here so isDataPathNode() finds the
     method on the prototype. */
  dag_get_datapath(ctx?: FullContext): string {
    return undefined!;
  }

  //have to be compatible with DataPathWrapperNode too
  static isDataPathNode(obj: DagOwner): obj is DagOwner & {
    dag_get_datapath(ctx?: FullContext): string;
  } {
    return obj.dag_get_datapath !== undefined;
  }
}

export class DataPathWrapperNode extends NodeFieldSocketWrapper {
  /* As DataPathNode.dag_get_datapath(): a stub for subclasses to override. */
  dag_get_datapath(ctx?: FullContext): string {
    return undefined!;
  }
}

export let DagFlags = {
  UPDATE: 1,
  TEMP  : 2,
  DEAD  : 4,
};

/*
 * private structures
 * */

function make_slot(stype: SocketDir, k: string, v: SocketValue | undefined, node?: EventNode) {
  let type;

  if (v === undefined || v === null) type = DataTypes.DEPEND;
  else if (v instanceof set) type = DataTypes.SET;
  /* NOTE: this also tested `k === false`, a typo for `v === false` that could
     never fire -- a socket declared with a `false` default still ends up with
     no datatype at all rather than BOOL. */ else if (v === true) type = DataTypes.BOOL;
  else if (typeof v === "number") type = DataTypes.NUMBER;
  else if (typeof v === "string" || v instanceof String) type = DataTypes.STRING;
  else if (v instanceof Vector2) type = DataTypes.VEC2;
  else if (v instanceof Vector3) type = DataTypes.VEC3;
  else if (v instanceof Vector4) type = DataTypes.VEC4;
  else if (v instanceof Matrix4) type = DataTypes.MATRIX4;
  else if (v instanceof Array) {
    for (let i = 0; i < v.length; i++) {
      //allow undefined and null?
      if (typeof v[i] !== "number" && typeof v[i] !== undefined) {
        warntrace("WARNING: bad array being passed around!!", v);
      }
      type = DataTypes.ARRAY;
    }
  }

  /* type is unset for the defaults the chain above misses; see the BOOL note. */
  return new EventSocket(k, node, stype, type!);
}

function get_sockets(cls: NodeBaseClass, key: "inputs" | "outputs"): SocketDefs {
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

function build_sockets(cls: NodeBaseClass, key: "inputs" | "outputs"): SocketMap {
  let socks = get_sockets(cls, key);
  let socks2: SocketMap = {};

  for (let k in socks) {
    let sock = socks[k];

    if (!(sock instanceof EventSocket)) {
      socks2[k] = make_slot(key == "inputs" ? "i" : "o", k, sock, undefined);
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
function get_ndef(cls: NodeBaseClass): FinalNodeDef {
  if (cls._cached_nodedef !== undefined) {
    return cls._cached_nodedef;
  }

  /* Starts out as a plain NodeDef and only becomes a FinalNodeDef once the two
     build_sockets() calls below have replaced .inputs/.outputs. */
  let ndef: NodeDef | undefined;

  if (cls.nodedef === undefined) {
    console.warn("Warning, no nodedef for cls", cls, "inheriting...");
    let cls2: NodeBaseClass | undefined = cls;

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

  /* Resolving .inputs/.outputs in place is what makes the def final; the
     mutated object itself is what gets cached. */
  let final: FinalNodeDef = Object.assign(ndef, {
    inputs : build_sockets(cls, "inputs"),
    outputs: build_sockets(cls, "outputs"),
  });

  cls._cached_nodedef = final;

  return final;
}

/*
gets node inputs with all sockets converted
to EventSockets and any inheritance applied.
*/
export function finalNodeDefInputs(cls: NodeBaseClass): SocketMap {
  return get_ndef(cls).inputs;
}

/*
gets node inputs with all sockets converted
to EventSockets and any inheritance applied.
*/
export function finalNodeDefOutputs(cls: NodeBaseClass): SocketMap {
  return get_ndef(cls).outputs;
}

//private structures
export class EventNode {
  flag: int;
  inputs: SocketMap;
  outputs: SocketMap;

  /* -1 until the node is added to a graph, which hands out the real id. */
  id: int;
  graph?: EventDag;

  /* Copied off the owner class's nodedef(), for debugging output only. */
  name?: string;
  uiName?: string;

  /* Installed by get_node() as a bridge to the owner's own dag_exec. */
  dag_exec?(ctx: FullContext, inputs: SocketMap, outputs: SocketMap, graph: EventDag): void;

  constructor() {
    this.flag = 0;
    this.id = -1;
    this.graph = undefined;

    this.inputs = {};
    this.outputs = {};
  }

  /* The object this node stands in for; subclasses resolve it differently. */
  get_owner(ctx: FullContext): DagOwner | undefined {
    return undefined;
  }

  on_remove(ctx: FullContext) {}

  /*
  if field is undefined then will update
  all sockets
  */

  dag_update(field?: string, data?: SocketValue) {
    if (DEBUG.dag) {
      console.trace("dag_update:", field, data);
    }

    if (field === undefined) {
      for (let k in this.outputs) {
        this.dag_update(k);
      }

      return;
    }

    let sock = this.outputs[field];

    if (arguments.length > 1) {
      sock.loadData(data);
    }

    sock.update();

    this.flag |= DagFlags.UPDATE;
    /* A node only has sockets to update once add() has given it a graph. */
    this.graph!.on_update(this, field);
  }

  unlink() {
    for (let k in this.inputs) {
      this.inputs[k].disconnect_all();
    }

    for (let k in this.outputs) {
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
  datapath: string;

  /* Resolved lazily on the first get_owner() and then held, so the "indirect"
     part only applies until then. */
  _owner?: DagOwner;

  constructor(path: string) {
    super();
    this.datapath = path;
  }

  get_owner(ctx: FullContext): DagOwner | undefined {
    if (this._owner !== undefined) return this._owner;

    this._owner = ctx.api.getValue(ctx, this.datapath);
    return this._owner;
  }
}

export class DirectNode extends EventNode {
  /* The owner's dag id, not the node's own .id. */
  __dag_id: int;

  constructor(id: int) {
    super();

    this.__dag_id = id;
  }

  get_owner(ctx: FullContext): DagOwner | undefined {
    /* Same as dag_update(): a reachable node has been added to a graph. */
    return this.graph!.object_idmap[this.__dag_id];
  }
}

//inputs/outputs all correspond to object fields?

export let DataTypes = {
  DEPEND : 1,
  NUMBER : 2,
  BOOL   : 4,
  STRING : 8,
  VEC2   : 16,
  VEC3   : 32,
  VEC4   : 64,
  MATRIX4: 128,
  ARRAY  : 256, //array of numbers only?
  SET    : 512,
};

/* Default socket data per DataTypes tag. Mutable types are stored as factories
   so every socket gets its own instance; immutable ones are stored directly. */
var TypeDefaults: { [type: int]: SocketValue | (() => SocketValue) } = {},
  t = TypeDefaults;
t[DataTypes.DEPEND] = null;
t[DataTypes.NUMBER] = 0;
t[DataTypes.STRING] = "";
t[DataTypes.VEC2] = () => new Vector2();
t[DataTypes.MATRIX4] = () => new Vector3();
t[DataTypes.ARRAY] = [];
t[DataTypes.BOOL] = true;
t[DataTypes.SET] = () => new set();

export function makeDefaultSlotData(type: int): SocketValue | undefined {
  let ret = TypeDefaults[type];

  if (typeof ret === "function") {
    return ret();
  }

  return ret;
}

//this would normally be a local function
//but I don't want to form a closure and get memory leaks
function wrap_ndef(ndef: NodeDef) {
  return function () {
    return ndef;
  };
}

export class EventEdge {
  dst: EventSocket;
  src: EventSocket;

  constructor(dst: EventSocket, src: EventSocket) {
    this.dst = dst;
    this.src = src;
  }

  opposite(socket: EventSocket): EventSocket {
    return socket === this.dst ? this.src : this.dst;
  }
}

export class EventSocket {
  type: SocketDir;
  name: string;

  /* Unset on the prototype sockets a nodedef() produces; filled in when the
     socket is copied onto a real node. */
  node?: EventNode;

  /* A DataTypes tag, which decides how loadData() copies. */
  datatype: int;
  data?: SocketValue;
  flag: int;
  edges: EventEdge[];

  constructor(name: string, owner: EventNode | undefined, type: SocketDir, datatype: int) {
    //type can be either lower-case 'i' or 'o'
    this.type = type;

    this.name = name;
    this.node = owner;

    this.datatype = datatype;
    this.data = undefined;

    this.flag = DagFlags.UPDATE;

    this.edges = [];
  }

  update() {
    this.flag |= DagFlags.UPDATE;
  }

  copy() {
    let s = new EventSocket(this.name, undefined, this.type, this.datatype);

    s.loadData(this.data, false);

    if (s.data === undefined) {
      s.data = makeDefaultSlotData(this.datatype);
    }

    return s;
  }

  loadData(data?: SocketValue, auto_set_update = true) {
    let update = false;

    switch (this.datatype) {
      case DataTypes.VEC2:
      case DataTypes.VEC3:
      case DataTypes.VEC4:
      case DataTypes.MATRIX4: {
        /* NOTE: copy() calls this on a fresh socket, whose .data is still
           undefined -- so copying a vector socket throws here, and always
           has. */
        let equals = loadVectorData(this.data, data);

        update = auto_set_update && equals;
        break;
      }
      default:
        update = auto_set_update && this.data === data;
        this.data = data;
    }

    if (update) {
      this.update();
    }
  }

  connect(b: EventSocket) {
    if (b.type === this.type) {
      throw new Error("Cannot put two inputs or outputs together");
    }

    let src, dst;
    if (this.type === "i") {
      (src = b), (dst = this);
    } else if (this.type === "o") {
      (src = this), (dst = b);
    } else {
      throw new Error("Malformed socket type.  this.type, b.type: " + this.type + ", " + b.type);
    }

    let edge = new EventEdge(dst, src);

    this.edges.push(edge);
    b.edges.push(edge);
  }

  _find_edge(b: EventSocket): EventEdge | undefined {
    for (let i = 0; i < this.edges.length; i++) {
      if (this.edges[i].opposite(this) === b) return this.edges[i];
    }

    return undefined;
  }

  disconnect(other_socket?: EventSocket) {
    if (other_socket === undefined) {
      warntrace("Warning, no other_socket in disconnect!");
      return;
    }

    let e = this._find_edge(other_socket);

    if (e !== undefined) {
      other_socket.edges.remove(e);
      this.edges.remove(e);
    }
  }

  disconnect_all() {
    while (this.edges.length > 0) {
      let e = this.edges[0];

      e.opposite(this).edges.remove(e);
      this.edges.remove(e);
    }
  }
}

window._NodeBase = NodeBase;

//temporaries used by EventDag.prototype.link
//the initial element is just a placeholder; link() always overwrites it
const sarr: string[] = [""],
  darr: string[] = [""];

//for client objects that are actually functions
function gen_callback_exec(func: DagCallback & Function, thisvar?: object) {
  //*
  for (let k of Object.getOwnPropertyNames(NodeBase.prototype)) {
    if (k === "toString") continue;

    Reflect.set(func, k, Reflect.get(NodeBase.prototype, k));
  } //*/

  /* A stand-in constructor, which is where link() hangs the callback's
     nodedef(). */
  Reflect.set(func, "constructor", {
    name     : func.name,
    prototype: NodeBase.prototype,
  });
  func.prototype = NodeBase.prototype;

  func.dag_exec = function (
    ctx: FullContext,
    inputs: SocketMap,
    outputs: SocketMap,
    graph: EventDag
  ) {
    return func.call(thisvar, ctx, inputs, outputs, graph);
  };
}

export class EventDag {
  nodes: EventNode[];

  /* Topologically sorted nodes, rebuilt whenever .resort is set. */
  sortlist: EventNode[];
  resort: boolean;

  /* Guards against re-entering exec() from inside a node's dag_exec(). */
  doexec: boolean;

  node_pathmap: { [path: string]: IndirectNode };
  node_idmap: { [dagId: int]: DirectNode }; //only direct nodes have ids?
  object_idmap: { [dagId: int]: DagOwner };

  /* Keyed by node.id, unlike the two maps above which are keyed by owner id. */
  idmap: { [id: int]: EventNode };

  ctx: FullContext;

  /* Owner ids are handed out from a module-wide generator so they stay unique
     across graphs; node ids are per-graph. */
  object_idgen: EIDGen;
  idgen: EIDGen;

  /* setInterval handle from startUpdateTimer(); unset until then. */
  timer?: int;

  constructor(ctx: FullContext) {
    this.nodes = [];
    this.sortlist = [];

    this.doexec = false;

    this.node_pathmap = {};
    this.node_idmap = {}; //only direct nodes have ids?
    this.object_idmap = {};

    this.idmap = {};

    this.ctx = ctx;

    if (_event_dag_idgen === undefined) _event_dag_idgen = new EIDGen();

    this.object_idgen = _event_dag_idgen;
    this.idgen = new EIDGen();
    this.resort = true;
  }

  reset_cache() {
    for (let n of this.nodes) {
      if (n instanceof IndirectNode) {
        n._owner = undefined;
      }
    }
  }

  init_slots(node: EventNode, object: DagOwner) {
    let ndef = get_ndef(ownerClass(object));

    if (ndef) {
      node.name = ndef.name;
      node.uiName = ndef.uiName;

      for (let i = 0; i < 2; i++) {
        let key: "inputs" | "outputs" = i ? "outputs" : "inputs";
        let stype: SocketDir = i ? "o" : "i";

        //get_ndef() already converted/inherited sockets
        //node.outputs = build_sockets(object.constructor, "outputs");

        let sockdef = ndef[key];
        let socks: SocketMap = {};

        node[key] = socks;

        for (let k in sockdef) {
          let sock = sockdef[k].copy();

          //don't use slot definition's .data for collections,
          //which are designed to be passed around by reference
          //this is diferent from vectors/matrices, which are passed around by
          //value.
          if (sock.datatype === DataTypes.ARRAY || sock.datatype === DataTypes.SET) {
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

  indirect_node(ctx: FullContext | undefined, path: string, object?: DagOwner, auto_create = true) {
    if (path in this.node_pathmap) return this.node_pathmap[path];

    if (!auto_create) return undefined;

    let node = new IndirectNode(path);
    this.node_pathmap[path] = node;

    if (object === undefined) {
      //XXX getObject no longer gracefully handles undefined ctx,
      //make sure it exists
      ctx = ctx === undefined ? this.ctx : ctx;
      object = ctx.api.getValue(ctx, path);
    }

    //console.log(path);
    //console.log("api call; result:", object);

    /* A path that resolves to nothing throws inside init_slots(), as before. */
    this.init_slots(node, object!);
    this.add(node);

    return node;
  }

  direct_node(ctx: FullContext | undefined, object: DagOwner, auto_create = true) {
    if (object.__dag_id !== undefined && object.__dag_id in this.node_idmap) {
      this.object_idmap[object.__dag_id] = object;
      return this.node_idmap[object.__dag_id];
    }

    if (!auto_create) return undefined;

    if (object.__dag_id === undefined) object.__dag_id = this.object_idgen.gen_id();

    let node = new DirectNode(object.__dag_id);
    node.id = object.__dag_id;

    //eww, direct references
    this.object_idmap[object.__dag_id] = object;
    this.node_idmap[object.__dag_id] = node;

    this.init_slots(node, object);
    this.add(node);

    return node;
  }

  add(node: EventNode) {
    node.graph = this;
    this.nodes.push(node);
    this.resort = true;

    node.id = this.idgen.gen_id();

    this.idmap[node.id] = node;
  }

  remove(nodeOrOwner: EventNode | DagOwner) {
    let node: EventNode;

    if (nodeOrOwner instanceof EventNode) {
      node = nodeOrOwner;
    } else {
      let node2 = this.get_node(nodeOrOwner, false);

      if (node2 === undefined) {
        console.log("node already removed");
        return;
      }

      node = node2;
    }

    if (this.nodes.indexOf(node) < 0) {
      console.log("node not in graph", node);
    }

    node.unlink();

    if (node instanceof DirectNode) {
      delete this.object_idmap[node.__dag_id];
      delete this.node_idmap[node.__dag_id];
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

  has(object: EventNode | DagOwner): boolean {
    /* Only a DirectNode carries the owner's dag id; every other node used to
       reach the same answer by looking up an undefined key. */
    if (object instanceof DirectNode) {
      return object.__dag_id in this.node_idmap;
    }

    if (object instanceof EventNode) {
      return false;
    }

    if (object.__dag_id !== undefined) {
      return object.__dag_id in this.node_idmap;
    }

    let node = this.get_node(object, false);

    return node instanceof DirectNode ? node.__dag_id in this.node_idmap : false;
  }

  get_node(object: EventNode | DagOwner, auto_create = true): EventNode | undefined {
    //already an event node?
    if (object instanceof EventNode) {
      return object;
    }

    let node;

    if (DataPathNode.isDataPathNode(object)) {
      node = this.indirect_node(this.ctx, object.dag_get_datapath(), object, auto_create);
      //console.log(node !== undefined ? node.id : "", object.__prototypeid__, "getting path node", object.dag_get_datapath());
    } else {
      //console.log(object.__prototypeid__, "getting ui only node");
      node = this.direct_node(this.ctx, object, auto_create); //eek!!
    }

    /*We build a dag_exec bridge here,
      to avoid lots of calls to empty functions*/

    if (node !== undefined && object.dag_exec !== undefined && node.dag_exec === undefined) {
      /* NOTE: `object` was cleared here to break a closure reference the
         function below never took; dropped. */
      node.dag_exec = function (
        this: EventNode,
        ctx: FullContext,
        inputs: SocketMap,
        outputs: SocketMap,
        graph: EventDag
      ) {
        let owner = this.get_owner(ctx);

        if (owner !== undefined && owner.dag_exec !== undefined) {
          return owner.dag_exec(ctx, inputs, outputs, graph);
        }
      };
    }

    return node;
  }

  /**
   src/dst can be either EventNodes or objects that follow NodeBase
   interface.

   src may also be a function; if so, a node will be generated internally.
   Functions should have the following prototype:

   function callback(ctx, inputs, outputs, graph) {
     }

   See NodeBase.dag_exec.
   */
  link(
    src: EventNode | DagOwner,
    srcfield: string | string[],
    dst: EventNode | DagOwner,
    dstfield: string | string[],
    dstthis?: object
  ) {
    //dstthis is for in case src is a function
    let obja = src,
      objb = dst;

    /* get_node() only comes back empty when it is told not to auto-create. */
    let srcnode = this.get_node(src)!;

    if (!(srcfield instanceof Array)) {
      sarr[0] = srcfield;
      srcfield = sarr;
    }

    if (!(dstfield instanceof Array)) {
      darr[0] = dstfield;
      dstfield = darr;
    }

    //callback nodes!
    if (isDagCallback(dst) && !dst._dag_callback_init) {
      gen_callback_exec(dst, dstthis);
      dst._dag_callback_init = true;
      delete dst.__prototypeid__;

      //.constructor was reset to {} by gen_callback_exec

      /* NOTE: uiname is misspelled -- init_slots() reads uiName, so a callback
         node's ui name is left undefined. */
      let inputs: SocketMap = {};
      let ndef = {
        name  : "function callback node",
        uiname: "function callback node",
        inputs,
        outputs: {},
      };

      //don't want to make closure here
      ownerClass(dst).nodedef = wrap_ndef(ndef);

      if (srcfield instanceof Array) {
        for (let i = 0; i < srcfield.length; i++) {
          let field = srcfield[i];
          let field2 = dstfield[i];

          if (!(field in srcnode.outputs)) {
            console.trace(field, Object.keys(srcnode.outputs), srcnode);

            throw new Error("Field not in outputs: " + field);
          }

          let sock = srcnode.outputs[field];
          inputs[field2] = sock.copy();
        }
      }
    }

    let dstnode = this.get_node(dst)!;

    //console.log(srcnode, src);

    /* NOTE: both fields are wrapped in an array above, so the non-array
       branch that used to follow this one was unreachable; dropped. */
    if (srcfield.length !== dstfield.length) {
      throw new Error(
        "Error, both arguments must be arrays of equal length: " + srcfield + ", " + dstfield
      );
    }

    for (let i = 0; i < dstfield.length; i++) {
      //console.log(dstnode, dstfield[i]);

      if (!(dstfield[i] in dstnode.inputs))
        throw new Error("Event inputs does not exist: " + dstfield[i]);
      if (!(srcfield[i] in srcnode.outputs))
        throw new Error("Event output does not exist: " + srcfield[i]);

      dstnode.inputs[dstfield[i]].connect(srcnode.outputs[srcfield[i]]);
    }

    this.resort = true;
  }

  //get rid of all unconnected nodes.
  //todo: should this be indirect nodes only?
  prune_dead_nodes() {
    let dellist: EventNode[] = [];

    for (let n of this.nodes) {
      let tot = 0;

      for (let k in n.inputs) {
        tot += n.inputs[k].edges.length;
      }
      for (let k in n.outputs) {
        tot += n.outputs[k].edges.length;
      }

      if (tot === 0) {
        dellist.push(n);
      }
    }

    for (let n of dellist) {
      this.remove(n);
    }
  }

  sort() {
    this.prune_dead_nodes();

    let sortlist: EventNode[] = [];
    let visit = {};

    for (let n of this.nodes) {
      n.flag &= ~DagFlags.TEMP;
    }

    /* NOTE: this walked each socket's edges with `sock.length`, which an
       EventSocket does not have -- so both walks were no-ops and the sortlist
       has only ever been the node list in insertion order.  The dead walks are
       dropped; making them run would reorder every dag exec. */
    function sort(n: EventNode) {
      n.flag |= DagFlags.TEMP;

      sortlist.push(n);
    }

    let nlen = this.nodes.length,
      nodes = this.nodes;
    for (let i = 0; i < nlen; i++) {
      let n = nodes[i];
      if (n.flag & DagFlags.TEMP) continue;

      sort(n);
    }

    this.sortlist = sortlist;
    this.resort = false;
  }

  on_update(node: EventNode, field?: string) {
    this.doexec = true;
  }

  startUpdateTimer() {
    this.timer = window.setInterval(() => {
      if (this.doexec && this.ctx !== undefined) {
        this.exec(this.ctx);
      }
    }, 100);
  }

  exec(ctx?: FullContext) {
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

    let sortlist = this.sortlist;
    let slen = sortlist.length;

    for (let i = 0; i < slen; i++) {
      let n = sortlist[i];

      if (!n) {
        console.warn("dead node in event dag");
        sortlist[i] = sortlist[sortlist.length - 1];
        sortlist.length--;
        slen--;
        i--;

        continue;
      }

      if (!(n.flag & DagFlags.UPDATE)) continue;

      n.flag &= ~DagFlags.UPDATE;

      /* this is where things get interesting. . . */
      let owner = n.get_owner(ctx);

      //console.log("Executing DAG node", owner.constructor.name);

      if (owner === undefined) {
        //destroy!
        console.warn("Bad owner!");
        n.flag |= DagFlags.DEAD;
        continue;
      }

      /* pull from inputs */
      for (let k in n.inputs) {
        let sock = n.inputs[k];

        for (let j = 0; j < sock.edges.length; j++) {
          let e = sock.edges[j],
            s2 = e.opposite(sock);

          /* NOTE: the owner lookup below ran before the `n2 === undefined`
             test that used to follow it, so an empty socket threw here rather
             than being flagged dead; the unreachable test is dropped.  The
             lookup stays -- it caches an IndirectNode's owner. */
          let n2 = s2.node!;
          n2.get_owner(ctx);

          if (s2.flag & DagFlags.UPDATE) {
            sock.loadData(s2.data);
          }

          /* ignore any other input links
             it's such a specialist case that client code
             can fetch it themselves */
          break;
        }
      }

      if (owner.dag_exec) {
        owner.dag_exec(ctx, n.inputs, n.outputs, this);
      }

      //flag child nodes that need updating first
      for (let k in n.outputs) {
        let s = n.outputs[k];

        if (!(s.flag & DagFlags.UPDATE)) continue;

        s.flag &= ~DagFlags.UPDATE;

        if (DEBUG.dag) console.log("Propegating updated socket", k);

        for (let j = 0; j < s.edges.length; j++) {
          s.edges[j].opposite(s).node!.flag |= DagFlags.UPDATE;
        }
      }
    }
  }
}

/* Set while a dag exec is already queued, so updateEventDag() coalesces. */
let req: int | undefined = undefined;

window.updateDataGraph = function (force?: boolean) {
  console.warn("use updateEventDag not updateDataGraph!");
  window.updateEventDag(force);
};

/** if force is false, will ensure a dag update is queued;
 *  otherwise dag will be executed immediately*/
window.updateEventDag = function (force = false) {
  if (force) {
    the_global_dag.exec();
    return;
  }

  if (req) {
    return;
  }

  req = 1;
  window.setTimeout(() => {
    req = undefined;

    the_global_dag.exec();
  }, 0);
};

window.init_event_graph = function init_event_graph(ctx: FullContext) {
  window.the_global_dag = new EventDag(ctx);
  globalDag().startUpdateTimer();

  _event_dag_idgen = new EIDGen();
};
