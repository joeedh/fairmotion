es6_module_define('eventdag', ["../util/vectormath.js"], function _eventdag_module(_es6_module) {
  "use strict";
  var _event_dag_idgen=undefined;
  es6_import(_es6_module, '../util/vectormath.js');
  class InheritFlag  {
     constructor(data) {
      this.data = data;
    }
  }
  _ESClass.register(InheritFlag);
  _es6_module.add_class(InheritFlag);
  window.the_global_dag = undefined;
  class NodeBase  {
     dag_update(output_socket_name, data) {
      var graph=window.the_global_dag;
      var node=graph.get_node(this, false);
      if (node!==undefined) {
          node.dag_update(output_socket_name, data);
      }
      else 
        if (DEBUG.dag) {
          console.warn("Failed to find node data for ", this.dag_get_datapath!==undefined ? this.dag_get_datapath(g_app_state.ctx) : this, "\nThis is not necassarily an error");
      }
    }
    static  nodedef() {

    }
    static  Inherit(data={}) {
      return new InheritFlag(data);
    }
     dag_unlink() {
      var graph=window.the_global_dag;
      var node=graph.get_node(this, false);
      if (node!=undefined)
        window.the_global_dag.remove(node);
    }
  }
  _ESClass.register(NodeBase);
  _es6_module.add_class(NodeBase);
  NodeBase = _es6_module.add_export('NodeBase', NodeBase);
  class NodeFieldSocketWrapper extends NodeBase {
     dag_exec(ctx, inputs, outputs, graph) {
      for (let k in inputs) {
          let sock=inputs[k];
          switch (sock.datatype) {
            case DataTypes.VEC2:
            case DataTypes.VEC3:
            case DataTypes.VEC4:
            case DataTypes.MATRIX4:
              if (this[k]===undefined) {
                  this[k].load(sock.data);
              }
              else {
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
          let sock=outputs[k];
          sock.loadData(this[k]);
      }
    }
  }
  _ESClass.register(NodeFieldSocketWrapper);
  _es6_module.add_class(NodeFieldSocketWrapper);
  NodeFieldSocketWrapper = _es6_module.add_export('NodeFieldSocketWrapper', NodeFieldSocketWrapper);
  class UIOnlyNode extends NodeBase {
  }
  _ESClass.register(UIOnlyNode);
  _es6_module.add_class(UIOnlyNode);
  UIOnlyNode = _es6_module.add_export('UIOnlyNode', UIOnlyNode);
  class DataPathNode extends NodeBase {
     dag_get_datapath(ctx) {

    }
    static  isDataPathNode(obj) {
      return obj.dag_get_datapath!==undefined;
    }
  }
  _ESClass.register(DataPathNode);
  _es6_module.add_class(DataPathNode);
  DataPathNode = _es6_module.add_export('DataPathNode', DataPathNode);
  class DataPathWrapperNode extends NodeFieldSocketWrapper {
     dag_get_datapath(ctx) {

    }
  }
  _ESClass.register(DataPathWrapperNode);
  _es6_module.add_class(DataPathWrapperNode);
  DataPathWrapperNode = _es6_module.add_export('DataPathWrapperNode', DataPathWrapperNode);
  var DagFlags={UPDATE: 1, 
   TEMP: 2, 
   DEAD: 4}
  DagFlags = _es6_module.add_export('DagFlags', DagFlags);
  function make_slot(stype, k, v, node) {
    var type;
    if (v===undefined||v===null)
      type = DataTypes.DEPEND;
    else 
      if (__instance_of(v, set))
      type = DataTypes.SET;
    else 
      if (v===true||k===false)
      type = DataTypes.BOOL;
    else 
      if (typeof v=="number")
      type = DataTypes.NUMBER;
    else 
      if (typeof v=="string"||__instance_of(v, String))
      type = DataTypes.STRING;
    else 
      if (__instance_of(v, Vector2))
      type = DataTypes.VEC2;
    else 
      if (__instance_of(v, Vector3))
      type = DataTypes.VEC3;
    else 
      if (__instance_of(v, Vector4))
      type = DataTypes.VEC4;
    else 
      if (__instance_of(v, Matrix4))
      type = DataTypes.MATRIX4;
    else 
      if (__instance_of(v, Array)) {
        for (var i=0; i<v.length; i++) {
            if (typeof (v[i])!="number"&&typeof (v[i])!=undefined) {
                warntrace("WARNING: bad array being passed around!!", v);
            }
            type = DataTypes.ARRAY;
        }
    }
    return new EventSocket(k, node, stype, type);
  }
  function get_sockets(cls, key) {
    if (cls.nodedef===undefined) {
        console.warn("Warning, missing node definition nodedef() for ", cls, cls);
        return {}
    }
    let ndef=cls.nodedef();
    let socks=ndef[key];
    if (socks===undefined) {
        return {}
    }
    if (__instance_of(socks, InheritFlag)) {
        socks = socks.data;
        let parent=cls.__parent__;
        console.log("INHERITANCE", cls, parent);
        if (parent===undefined) {
            return socks;
        }
        socks = Object.assign({}, socks);
        let socks2=get_sockets(parent, key);
        for (let k in socks2) {
            if (socks[k]===undefined) {
                socks[k] = socks2[k];
            }
        }
    }
    return socks;
  }
  function build_sockets(cls, key) {
    let socks=get_sockets(cls, key);
    let socks2={}
    for (let k in socks) {
        let sock=socks[k];
        if (!(__instance_of(sock, EventSocket))) {
            socks2[k] = make_slot(key=="inputs" ? "i" : "o", k, sock, undefined);
        }
        else {
          socks2[k] = sock.copy();
        }
    }
    return socks2;
  }
  function get_ndef(cls) {
    if (cls._cached_nodedef!==undefined) {
        return cls._cached_nodedef;
    }
    let ndef;
    if (cls.nodedef===undefined) {
        console.warn("Warning, no nodedef for cls", cls, "inheriting...");
        let cls2=cls;
        while (cls2!==undefined) {
          if (cls2.nodedef) {
              ndef = Object.assign({}, cls2.nodedef());
              break;
          }
          cls2 = cls2.__parent__;
        }
        if (ndef===undefined) {
            console.warn("Failed to find nodedef static for class", cls);
            throw new Error("Failed to find nodedef static for class"+cls);
        }
    }
    else {
      ndef = cls.nodedef();
    }
    cls._cached_nodedef = ndef;
    ndef.inputs = build_sockets(cls, "inputs");
    ndef.outputs = build_sockets(cls, "outputs");
    return ndef;
  }
  function finalNodeDefInputs(cls) {
    return get_ndef(cls).inputs;
  }
  finalNodeDefInputs = _es6_module.add_export('finalNodeDefInputs', finalNodeDefInputs);
  function finalNodeDefOutputs(cls) {
    return get_ndef(cls).outputs;
  }
  finalNodeDefOutputs = _es6_module.add_export('finalNodeDefOutputs', finalNodeDefOutputs);
  class EventNode  {
    
    
    
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
     dag_update(field, data) {
      if (DEBUG.dag) {
          console.trace("dag_update:", field, data);
      }
      if (field===undefined) {
          for (var k in this.outputs) {
              this.dag_update(k);
          }
          return ;
      }
      var sock=this.outputs[field];
      if (arguments.length>1) {
          sock.loadData(data);
      }
      sock.update();
      this.flag|=DagFlags.UPDATE;
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
  _ESClass.register(EventNode);
  _es6_module.add_class(EventNode);
  EventNode = _es6_module.add_export('EventNode', EventNode);
  class IndirectNode extends EventNode {
     constructor(path) {
      super();
      this.datapath = path;
    }
     get_owner(ctx) {
      if (this._owner!=undefined)
        return this._owner;
      this._owner = ctx.api.getObject(ctx, this.datapath);
      return this._owner;
    }
  }
  _ESClass.register(IndirectNode);
  _es6_module.add_class(IndirectNode);
  IndirectNode = _es6_module.add_export('IndirectNode', IndirectNode);
  class DirectNode extends EventNode {
     constructor(id) {
      super();
      this.objid = id;
    }
     get_owner(ctx) {
      return this.graph.object_idmap[this.objid];
    }
  }
  _ESClass.register(DirectNode);
  _es6_module.add_class(DirectNode);
  DirectNode = _es6_module.add_export('DirectNode', DirectNode);
  var DataTypes={DEPEND: 1, 
   NUMBER: 2, 
   BOOL: 4, 
   STRING: 8, 
   VEC2: 16, 
   VEC3: 32, 
   VEC4: 64, 
   MATRIX4: 128, 
   ARRAY: 256, 
   SET: 512}
  DataTypes = _es6_module.add_export('DataTypes', DataTypes);
  var TypeDefaults=t = {}
  t[DataTypes.DEPEND] = null;
  t[DataTypes.NUMBER] = 0;
  t[DataTypes.STRING] = "";
  t[DataTypes.VEC2] = () =>    {
    return new Vector2();
  }
  t[DataTypes.MATRIX4] = () =>    {
    return new Vector3();
  }
  t[DataTypes.ARRAY] = [];
  t[DataTypes.BOOL] = true;
  t[DataTypes.SET] = () =>    {
    return new set();
  }
  function makeDefaultSlotData(type) {
    let ret=TypeDefaults[type];
    if (typeof ret=="function") {
        return ret();
    }
    return ret;
  }
  makeDefaultSlotData = _es6_module.add_export('makeDefaultSlotData', makeDefaultSlotData);
  function wrap_ndef(ndef) {
    return function () {
      return ndef;
    }
  }
  class EventEdge  {
     constructor(dst, src) {
      this.dst = dst;
      this.src = src;
    }
     opposite(socket) {
      return socket==this.dst ? this.src : this.dst;
    }
  }
  _ESClass.register(EventEdge);
  _es6_module.add_class(EventEdge);
  EventEdge = _es6_module.add_export('EventEdge', EventEdge);
  class EventSocket  {
     constructor(name, owner, type, datatype) {
      this.type = type;
      this.name = name;
      this.node = node;
      this.datatype = datatype;
      this.data = undefined;
      this.flag = DagFlags.UPDATE;
      this.edges = [];
    }
     update() {
      this.flag|=DagFlags.UPDATE;
    }
     copy() {
      var s=new EventSocket(this.name, undefined, this.type, this.datatype);
      s.loadData(this.data, false);
      if (s.data===undefined) {
          s.data = makeDefaultSlotData(this.datatype);
      }
      return s;
    }
     loadData(data, auto_set_update=true) {
      let update=false;
      switch (this.datatype) {
        case DataTypes.VEC2:
        case DataTypes.VEC3:
        case DataTypes.VEC4:
        case DataTypes.MATRIX4:
          update = auto_set_update&&this.data.equals(data);
          this.data.load(data);
          break;
        default:
          update = auto_set_update&&this.data===data;
          this.data = data;
      }
      if (update) {
          this.update();
      }
    }
     connect(b) {
      if (b.type==this.type) {
          throw new Error("Cannot put two inputs or outputs together");
      }
      var src, dst;
      if (this.type=="i") {
          src = b, dst = this;
      }
      else 
        if (this.type=="o") {
          src = this, dst = b;
      }
      else {
        throw new Error("Malformed socket type.  this.type, b.type, this, b:", this.type, b.type, this, b);
      }
      var edge=new EventEdge(dst, src);
      this.edges.push(edge);
      b.edges.push(edge);
    }
     _find_edge(b) {
      for (var i=0; i<this.edges.length; i++) {
          if (this.edges[i].opposite(this)===b)
            return this.edges[i];
      }
      return undefined;
    }
     disconnect(other_socket) {
      if (other_socket==undefined) {
          warntrace("Warning, no other_socket in disconnect!");
          return ;
      }
      var e=this._find_edge(other_socket);
      if (e!=undefined) {
          other_socket.edges.remove(e);
          this.edges.remove(e);
      }
    }
     disconnect_all() {
      while (this.edges.length>0) {
        var e=this.edges[0];
        e.opposite(this).edges.remove(e);
        this.edges.remove(e);
      }
    }
  }
  _ESClass.register(EventSocket);
  _es6_module.add_class(EventSocket);
  EventSocket = _es6_module.add_export('EventSocket', EventSocket);
  window._NodeBase = NodeBase;
  function gen_callback_exec(func, thisvar) {
    for (var k of Object.getOwnPropertyNames(NodeBase.prototype)) {
        if (k=="toString")
          continue;
        func[k] = NodeBase.prototype[k];
    }
    func.constructor = {}
    func.constructor.name = func.name;
    func.constructor.prototype = NodeBase.prototype;
    func.prototype = NodeBase.prototype;
    func.dag_exec = function (ctx, inputs, outputs, graph) {
      return func.apply(thisvar, arguments);
    }
  }
  var $sarr_QtVx_link;
  var $darr_WUMt_link;
  class EventDag  {
     constructor(ctx) {
      this.nodes = [];
      this.sortlist = [];
      this.doexec = false;
      this.node_pathmap = {};
      this.node_idmap = {};
      this.object_idmap = {};
      this.idmap = {};
      this.ctx = ctx;
      if (_event_dag_idgen==undefined)
        _event_dag_idgen = new EIDGen();
      this.object_idgen = _event_dag_idgen;
      this.idgen = new EIDGen();
      this.resort = true;
    }
     reset_cache() {
      for (var n of this.nodes) {
          if (__instance_of(n, IndirectNode)) {
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
          for (let i=0; i<2; i++) {
              let key=i ? "outputs" : "inputs";
              let stype=i ? "o" : "i";
              let sockdef=ndef[key];
              let socks={};
              node[key] = socks;
              for (let k in sockdef) {
                  let sock=sockdef[k].copy();
                  if (sock.datatype==DataTypes.ARRAY||sock.datatype==DataTypes.SET) {
                      sock.data = makeDefaultSlotData(sock.datatype);
                  }
                  sock.type = stype;
                  sock.node = node;
                  socks[k] = sock;
              }
          }
      }
      else {
        console.warn("Failed to find node definition", object);
        node.inputs = {};
        node.outputs = {};
      }
    }
     indirect_node(ctx, path, object=undefined, auto_create=true) {
      if (path in this.node_pathmap)
        return this.node_pathmap[path];
      if (!auto_create)
        return undefined;
      var node=new IndirectNode(path);
      this.node_pathmap[path] = node;
      if (object===undefined) {
          ctx = ctx===undefined ? this.ctx : ctx;
          object = ctx.api.getObject(ctx, path);
      }
      this.init_slots(node, object);
      this.add(node);
      return node;
    }
     direct_node(ctx, object, auto_create=true) {
      if ("__dag_id" in object&&object.__dag_id in this.node_idmap) {
          this.object_idmap[object.__dag_id] = object;
          return this.node_idmap[object.__dag_id];
      }
      if (!auto_create)
        return undefined;
      if (object.__dag_id==undefined)
        object.__dag_id = this.object_idgen.gen_id();
      var node=new DirectNode(object.__dag_id);
      node.id = object.__dag_id;
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
      if (!(__instance_of(node, EventNode))) {
          node = this.get_node(node, false);
          if (node==undefined) {
              console.log("node already removed");
              return ;
          }
      }
      if (this.nodes.indexOf(node)<0) {
          console.log("node not in graph", node);
      }
      node.unlink();
      if (__instance_of(node, DirectNode)) {
          delete this.object_idmap[node.objid];
          delete this.node_idmap[node.objid];
      }
      else 
        if (__instance_of(node, IndirectNode)) {
          delete this.node_pathmap[node.datapath];
      }
      delete this.idmap[node.id];
      this.nodes.remove(node);
      if (this.sortlist.indexOf(node)>=0) {
          this.sortlist.remove(node);
      }
      this.resort = true;
    }
     get_node(object, auto_create=true) {
      if (__instance_of(object, EventNode)) {
          return object;
      }
      var node;
      if (DataPathNode.isDataPathNode(object)) {
          node = this.indirect_node(this.ctx, object.dag_get_datapath(), object, auto_create);
      }
      else {
        node = this.direct_node(this.ctx, object, auto_create);
      }
      if (node!==undefined&&object.dag_exec!==undefined&&node.dag_exec===undefined) {
          object = undefined;
          node.dag_exec = function (ctx, inputs, outputs, graph) {
            var owner=this.get_owner(ctx);
            if (owner!==undefined) {
                return owner.dag_exec.apply(owner, arguments);
            }
          };
      }
      return node;
    }
     link(src, srcfield, dst, dstfield, dstthis) {
      var obja=src, objb=dst;
      var srcnode=this.get_node(src);
      if (!(__instance_of(srcfield, Array))) {
          $sarr_QtVx_link[0] = srcfield;
          srcfield = $sarr_QtVx_link;
      }
      if (!(__instance_of(dstfield, Array))) {
          $darr_WUMt_link[0] = dstfield;
          dstfield = $darr_WUMt_link;
      }
      if ((typeof dst=="function"||__instance_of(dst, Function))&&!dst._dag_callback_init) {
          gen_callback_exec(dst, dstthis);
          dst._dag_callback_init = true;
          delete dst.__prototypeid__;
          let ndef={name: "function callback node", 
       uiname: "function callback node", 
       inputs: {}, 
       outputs: {}};
          dst.constructor.nodedef = wrap_ndef(ndef);
          if (__instance_of(srcfield, Array)) {
              for (var i=0; i<srcfield.length; i++) {
                  var field=srcfield[i];
                  var field2=dstfield[i];
                  if (!(field in srcnode.outputs)) {
                      console.trace(field, Object.keys(srcnode.outputs), srcnode);
                      throw new Error("Field not in outputs: "+field);
                  }
                  let sock=srcnode.outputs[field];
                  ndef.inputs[field2] = sock.copy();
              }
          }
      }
      var dstnode=this.get_node(dst);
      if (__instance_of(srcfield, Array)) {
          if (srcfield.length!=dstfield.length) {
              throw new Error("Error, both arguments must be arrays of equal length!", srcfield, dstfield);
          }
          for (var i=0; i<dstfield.length; i++) {
              if (!(dstfield[i] in dstnode.inputs))
                throw new Error("Event inputs does not exist: "+dstfield[i]);
              if (!(srcfield[i] in srcnode.outputs))
                throw new Error("Event output does not exist: "+srcfield[i]);
              dstnode.inputs[dstfield[i]].connect(srcnode.outputs[srcfield[i]]);
          }
      }
      else {
        console.log(dstnode, dstfield);
        if (!(dstfield in dstnode.inputs))
          throw new Error("Event input does not exist: "+dstfield);
        if (!(srcfield in srcnode.outputs))
          throw new Error("Event output does not exist: "+srcfield);
        dstnode.inputs[dstfield].connect(srcnode.outputs[srcfield]);
      }
      this.resort = true;
    }
     prune_dead_nodes() {
      var dellist=[];
      for (var n of this.nodes) {
          var tot=0;
          for (var k in n.inputs) {
              tot+=n.inputs[k].edges.length;
          }
          for (var k in n.outputs) {
              tot+=n.outputs[k].edges.length;
          }
          if (tot==0) {
              dellist.push(n);
          }
      }
      for (var n of dellist) {
          this.remove(n);
      }
    }
     sort() {
      this.prune_dead_nodes();
      var sortlist=[];
      var visit={};
      for (var n of this.nodes) {
          n.flag&=~DagFlags.TEMP;
      }
      function sort(n) {
        n.flag|=DagFlags.TEMP;
        for (var k in n.inputs) {
            var sock=n.inputs[k];
            for (var i=0; i<sock.length; i++) {
                var n2=sock.edges[i].opposite(sock).node;
                if (!(n2.flag&DagFlags.TEMP)) {
                    sort(n2);
                }
            }
        }
        sortlist.push(n);
        for (var k in n.outputs) {
            var sock=n.outputs[k];
            for (var i=0; i<sock.length; i++) {
                var n2=sock.edges[i].opposite(sock).node;
                if (!(n2.flag&DagFlags.TEMP)) {
                    sort(n2);
                }
            }
        }
      }
      var nlen=this.nodes.length, nodes=this.nodes;
      for (var i=0; i<nlen; i++) {
          var n=nodes[i];
          if (n.flag&DagFlags.TEMP)
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
      this.timer = window.setInterval(() =>        {
        if (this.doexec&&this.ctx!==undefined) {
            this.exec(this.ctx);
        }
      }, 100);
    }
     exec(ctx) {
      if (ctx===undefined) {
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
      var sortlist=this.sortlist;
      var slen=sortlist.length;
      for (var i=0; i<slen; i++) {
          var n=sortlist[i];
          if (!n) {
              console.warn("dead node in event dag");
              sortlist[i] = sortlist[sortlist.length-1];
              sortlist.length--;
              slen--;
              i--;
              continue;
          }
          if (!(n.flag&DagFlags.UPDATE))
            continue;
          n.flag&=~DagFlags.UPDATE;
          var owner=n.get_owner(ctx);
          if (owner===undefined) {
              console.warn("Bad owner!");
              n.flag|=DagFlags.DEAD;
              continue;
          }
          for (var k in n.inputs) {
              var sock=n.inputs[k];
              for (var j=0; j<sock.edges.length; j++) {
                  var e=sock.edges[j], s2=e.opposite(sock);
                  var n2=s2.node, owner2=n2.get_owner(ctx);
                  if (n2===undefined) {
                      n2.flag|=DagFlags.DEAD;
                      continue;
                  }
                  if (s2.flag&DagFlags.UPDATE) {
                      sock.loadData(s2.data);
                  }
                  break;
              }
          }
          if (owner.dag_exec) {
              owner.dag_exec(ctx, n.inputs, n.outputs, this);
          }
          for (var k in n.outputs) {
              var s=n.outputs[k];
              if (!(s.flag&DagFlags.UPDATE))
                continue;
              s.flag&=~DagFlags.UPDATE;
              if (DEBUG.dag)
                console.log("Propegating updated socket", k);
              for (var j=0; j<s.edges.length; j++) {
                  s.edges[j].opposite(s).node.flag|=DagFlags.UPDATE;
              }
          }
      }
    }
  }
  var $sarr_QtVx_link=[0];
  var $darr_WUMt_link=[0];
  _ESClass.register(EventDag);
  _es6_module.add_class(EventDag);
  EventDag = _es6_module.add_export('EventDag', EventDag);
  window.init_event_graph = function init_event_graph(ctx) {
    window.the_global_dag = new EventDag(ctx);
    window.the_global_dag.startUpdateTimer();
    _event_dag_idgen = new EIDGen();
  }
}, '/dev/fairmotion/src/core/eventdag.js');
es6_module_define('lib_utils', ["./toolprops_iter.js", "../editors/events.js", "./struct.js"], function _lib_utils_module(_es6_module) {
  "use strict";
  es6_import(_es6_module, '../editors/events.js');
  es6_import(_es6_module, './toolprops_iter.js');
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
  var EventHandler=es6_import_item(_es6_module, '../editors/events.js', 'EventHandler');
  var charmap=es6_import_item(_es6_module, '../editors/events.js', 'charmap');
  class DBList extends GArray {
    
    
    
    
     constructor(type) {
      super();
      this.type = type;
      this.idmap = {};
      this.selected = new GArray();
      this.active = undefined;
      this.length = 0;
      this.selset = new set();
    }
    static  fromSTRUCT(unpacker) {
      var dblist=new DBList(0);
      unpacker(dblist);
      var arr=dblist.arrdata;
      dblist.length = 0;
      for (var i=0; i<arr.length; i++) {
          GArray.prototype.push.call(dblist, arr[i]);
      }
      dblist.selected = new GArray(dblist.selected);
      delete dblist.arrdata;
      return dblist;
    }
     toJSON() {
      var list=[];
      var sellist=[];
      for (var block of this) {
          list.push(block.lib_id);
      }
      for (var block of this.selected) {
          sellist.push(block.lib_id);
      }
      var obj={list: list, 
     selected: sellist, 
     active: this.active!=undefined ? this.active.lib_id : -1, 
     length: this.length, 
     type: this.type};
      return obj;
    }
    static  fromJSON(obj) {
      var list=new DBList(obj.type);
      list.list = new GArray(obj.list);
      list.selected = new GArray(obj.selected);
      list.active = obj.active;
      list.length = obj.length;
    }
     clear_select() {
      for (var block of this.selected) {
          block.flag&=~SELECT;
      }
      this.selset = new set();
      this.selected = new GArray();
    }
     set_active(block) {
      if (block==undefined&&this.length>0) {
          console.trace();
          console.log("Undefined actives are illegal for DBLists, unless the list length is zero.");
          return ;
      }
      this.active = block;
    }
     select(block, do_select=true) {
      if (!(__instance_of(block, DataBlock))) {
          warntrace("WARNING: bad value ", block, " passed to DBList.select()");
          return ;
      }
      if (do_select) {
          block.flag|=SELECT;
          if (this.selset.has(block)) {
              return ;
          }
          this.selset.add(block);
          this.selected.push(block);
      }
      else {
        block.flag&=~SELECT;
        if (!this.selset.has(block)) {
            return ;
        }
        this.selset.remove(block);
        this.selected.remove(block);
      }
    }
     data_link(block, getblock, getblock_us) {
      for (var i=0; i<this.length; i++) {
          this[i] = getblock(this[i]);
          this.idmap[this[i].lib_id] = this[i];
      }
      var sel=this.selected;
      for (var i=0; i<sel.length; i++) {
          sel[i] = getblock(sel[i]);
          this.selset.add(sel[i]);
      }
      this.active = getblock(this.active);
    }
     push(block) {
      if (!(__instance_of(block, DataBlock))) {
          warntrace("WARNING: bad value ", block, " passed to DBList.select()");
          return ;
      }
      super.push(block);
      this.idmap[block.lib_id] = block;
      if (this.active==undefined) {
          this.active = block;
          this.select(block, true);
      }
    }
     remove(block) {
      var i=this.indexOf(block);
      if (i<0||i==undefined) {
          warn("WARNING: Could not remove block "+block.name+" from a DBList");
          return ;
      }
      this.pop(i);
    }
     pop(i) {
      if (i<0||i>=this.length) {
          warn("WARNING: Invalid argument ", i, " to static pop()");
          print_stack();
          return ;
      }
      var block=this[i];
      super.pop(i);
      delete this.idmap[block.lib_id];
      if (this.active==block) {
          this.select(block, false);
          this.active = this.length>0 ? this[0] : undefined;
      }
      if (this.selset.has(block)) {
          this.selected.remove(block);
          this.selset.remove(block);
      }
    }
     idget(id) {
      return this.idmap[id];
    }
  }
  _ESClass.register(DBList);
  _es6_module.add_class(DBList);
  DBList.STRUCT = `
  DBList {
    type : int;
    selected : array(dataref(DataBlock));
    arrdata : array(dataref(DataBlock)) | obj;
    active : dataref(DataBlock);
  }
`;
  function DataArrayRem(dst, field, obj) {
    var array=dst[field];
    function rem() {
      array.remove(obj);
    }
    return rem;
  }
  function SceneObjRem(scene, obj) {
    function rem() {
      for (var e of obj.dag_node.inmap["parent"]) {
          var node=e.opposite(obj).node;
          if (__instance_of(node, ASObject))
            node.unparent(scene);
      }
      scene.objects.remove(obj);
      scene.graph.remove(obj);
      if (scene.active==obj)
        scene.active = scene.objects.length>0 ? scene.objects[0] : undefined;
      if (scene.selection.has(obj))
        scene.selection.remove(obj);
    }
    return rem;
  }
  function DataRem(dst, field) {
    function rem() {
      dst["field"] = undefined;
    }
    return rem;
  }
  function wrap_getblock_us(datalib) {
    return function (dataref, block, fieldname, add_user, refname, rem_func) {
      if (dataref==undefined)
        return ;
      if (rem_func==undefined)
        rem_func = DataRem(block, fieldname);
      if (refname==undefined)
        refname = fieldname;
      var id=dataref[0];
      if (id==-1) {
          return undefined;
      }
      else {
        var b=datalib.get(id);
        if (b!=undefined) {
            if (add_user)
              b.lib_adduser(block, refname, rem_func);
        }
        else {
          warntrace(["WARNING WARNING WARNING saved block reference isn't in database!!!", "  dataref: "].join("\n"), dataref);
        }
        return b;
      }
    }
  }
  wrap_getblock_us = _es6_module.add_export('wrap_getblock_us', wrap_getblock_us);
  function wrap_getblock(datalib) {
    return function (dataref) {
      if (dataref==undefined)
        return ;
      var id=dataref[0];
      if (id==-1) {
          return undefined;
      }
      else {
        var b=datalib.get(id);
        if (b!=undefined) {
        }
        else {
          warntrace(["WARNING WARNING WARNING saved block reference isn't in database!!!", "  dataref: "].join("\n"), dataref);
        }
        return b;
      }
    }
  }
  wrap_getblock = _es6_module.add_export('wrap_getblock', wrap_getblock);
  class DataRefList extends GArray {
     constructor(lst=undefined) {
      super();
      this.datalib = undefined;
      if (lst==undefined)
        return ;
      if (__instance_of(lst, Array)) {
          for (var i=0; i<lst.length; i++) {
              if (lst[i]==undefined)
                continue;
              this.push(lst[i]);
          }
      }
      else 
        if (Symbol.iterator in lst) {
          for (var b of lst) {
              this.push(b);
          }
      }
    }
     [Symbol.iterator]() {
      return new DataRefListIter(this, new Context());
    }
    set  ctx(ctx) {
      this.datalib = ctx.datalib;
    }
    get  ctx() {
      return undefined;
    }
     get(i, return_block=true) {
      if (return_block) {
          var dl=this.datalib!=undefined ? this.datalib : g_app_state.datalib;
          return dl.get(this[i]);
      }
      else {
        return this[i];
      }
    }
     push(b) {
      if (!(b = this._b(b)))
        return ;
      if (__instance_of(b, DataBlock))
        b = new DataRef(b);
      super.push(new DataRef(b));
    }
     _b(b) {
      if (b==undefined) {
          warntrace("WARNING: undefined passed to DataRefList.push()");
          return ;
      }
      if (__instance_of(b, DataBlock)) {
          return new DataRef(b);
      }
      else 
        if (__instance_of(b, DataRef)) {
          return b;
      }
      else {
        warntrace("WARNING: bad value ", b, " passed to DataRefList._b()");
      }
    }
     remove(b) {
      if (!(b = this._b(b)))
        return ;
      var i=this.indexOf(b);
      if (i<0) {
          warntrace("WARNING: ", b, " not found in this DataRefList");
          return ;
      }
      this.pop(i);
    }
     pop(i, return_block=true) {
      var ret=super.pop(i);
      if (return_block)
        ret = new Context().datalib.get(ret.id);
      return ret;
    }
     replace(a, b) {
      if (!(b = this._b(b)))
        return ;
      var i=this.indexOf(a);
      if (i<0) {
          warntrace("WARNING: ", b, " not found in this DataRefList");
          return ;
      }
      this[i] = b;
    }
     indexOf(b) {
      super.indexOf(b);
      if (!(b = this._b(b)))
        return ;
      for (var i=0; i<this.length; i++) {
          if (this[i].id==b.id)
            return i;
      }
      return -1;
    }
     insert(index, b) {
      if (!(b = this._b(b)))
        return ;
      super.insert(b);
    }
     prepend(b) {
      if (!(b = this._b(b)))
        return ;
      super.prepend(b);
    }
    static  fromSTRUCT(reader) {
      var ret={};
      reader(ret);
      return new DataRefList(ret.list);
    }
  }
  _ESClass.register(DataRefList);
  _es6_module.add_class(DataRefList);
  mixin(DataRefList, TPropIterable);
  DataRefList.STRUCT = `
  DataRefList {
    list : array(i, dataref(DataBlock)) | this[i];
  }
`;
}, '/dev/fairmotion/src/core/lib_utils.js');
es6_module_define('transdata', ["../../util/mathlib.js"], function _transdata_module(_es6_module) {
  "use strict";
  var MinMax=es6_import_item(_es6_module, '../../util/mathlib.js', 'MinMax');
  class TransDataItem  {
    
     constructor(data, type, start_data) {
      this.data = data;
      this.start_data = start_data;
      this.type = type;
      this.w = 1;
      this.dis = -1;
    }
  }
  _ESClass.register(TransDataItem);
  _es6_module.add_class(TransDataItem);
  TransDataItem = _es6_module.add_export('TransDataItem', TransDataItem);
  class TransDataType  {
    static  apply(ctx, td, item, mat, w) {

    }
    static  undo_pre(ctx, td, undo_obj) {

    }
    static  getDataPath(ctx, td, ti) {

    }
    static  undo(ctx, undo_obj) {

    }
    static  update(ctx, td) {

    }
    static  calc_prop_distances(ctx, td, data) {

    }
    static  gen_data(ctx, td, data) {

    }
    static  iter_data(ctx, td) {
      let data=[];
      this.gen_data(ctx, td, data);
      return data;
    }
    static  calc_draw_aabb(ctx, td, minmax) {

    }
    static  aabb(ctx, td, item, minmax, selected_only) {

    }
  }
  _ESClass.register(TransDataType);
  _es6_module.add_class(TransDataType);
  TransDataType = _es6_module.add_export('TransDataType', TransDataType);
  TransDataType.selectmode = -1;
  class TransData  {
    
    
    
    
    
    
    
     constructor(ctx, top, datamode) {
      this.ctx = ctx;
      this.top = top;
      this.datamode = datamode;
      this.edit_all_layers = top.inputs.edit_all_layers.data;
      this.layer = ctx.spline.layerset.active;
      this.types = top.types;
      this.data = new GArray();
      this.undodata = {};
      this.doprop = top.inputs.proportional.data;
      this.propradius = top.inputs.propradius.data;
      this.center = new Vector3();
      this.start_center = new Vector3();
      this.minmax = new MinMax(3);
      for (var t of this.types) {
          if (datamode&t.selectmode) {
              t.gen_data(ctx, this, this.data);
          }
      }
      if (this.doprop)
        this.calc_propweights();
      for (var d of this.data) {
          d.type.aabb(ctx, this, d, this.minmax, true);
      }
      if (top.inputs.use_pivot.data) {
          this.center.load(top.inputs.pivot.data);
      }
      else {
        this.center.load(this.minmax.max).add(this.minmax.min).mulScalar(0.5);
      }
      this.start_center.load(this.center);
      if (top.modal_running) {
          this.scenter = new Vector3(this.center);
          this.start_scenter = new Vector3(this.start_center);
          ctx.view2d.project(this.scenter);
          ctx.view2d.project(this.start_scenter);
      }
    }
     calc_propweights(radius=this.propradius) {
      this.propradius = radius;
      for (var t of this.types) {
          if (t.selectmode&this.datamode)
            t.calc_prop_distances(this.ctx, this, this.data);
      }
      var r=radius;
      for (var tv of this.data) {
          if (tv.dis==-1)
            continue;
          tv.w = tv.dis>r ? 0 : 1.0-tv.dis/r;
      }
    }
  }
  _ESClass.register(TransData);
  _es6_module.add_class(TransData);
  TransData = _es6_module.add_export('TransData', TransData);
}, '/dev/fairmotion/src/editors/viewport/transdata.js');
es6_module_define('transform', ["../../curve/spline_types.js", "./transform_spline.js", "../../core/toolops_api.js", "../../util/mathlib.js", "../dopesheet/dopesheet_transdata.js", "../../wasm/native_api.js", "./transdata.js", "../events.js", "../../core/toolprops.js", "./view2d_base.js", "./selectmode.js"], function _transform_module(_es6_module) {
  var MinMax=es6_import_item(_es6_module, '../../util/mathlib.js', 'MinMax');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var Vec3Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec3Property');
  var BoolProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'BoolProperty');
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var CollectionProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'CollectionProperty');
  var TPropFlags=es6_import_item(_es6_module, '../../core/toolprops.js', 'TPropFlags');
  var EnumProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'EnumProperty');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var ToolDef=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolDef');
  var ModalStates=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ModalStates');
  var TransDataItem=es6_import_item(_es6_module, './transdata.js', 'TransDataItem');
  var TransDataType=es6_import_item(_es6_module, './transdata.js', 'TransDataType');
  var TransData=es6_import_item(_es6_module, './transdata.js', 'TransData');
  var TransDopeSheetType=es6_import_item(_es6_module, '../dopesheet/dopesheet_transdata.js', 'TransDopeSheetType');
  var SessionFlags=es6_import_item(_es6_module, './view2d_base.js', 'SessionFlags');
  var KeyMap=es6_import_item(_es6_module, '../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../events.js', 'EventHandler');
  var clear_jobs=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs');
  var clear_jobs_except_latest=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs_except_latest');
  var clear_jobs_except_first=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs_except_first');
  var JobTypes=es6_import_item(_es6_module, '../../wasm/native_api.js', 'JobTypes');
  var _tsv_apply_tmp1=new Vector3();
  var _tsv_apply_tmp2=new Vector3();
  var post_mousemove_cachering=cachering.fromConstructor(Vector3, 64);
  var mousemove_cachering=cachering.fromConstructor(Vector3, 64);
  var TransSplineVert=es6_import_item(_es6_module, './transform_spline.js', 'TransSplineVert');
  class TransformOp extends ToolOp {
    
    
    
     constructor(start_mpos, datamode) {
      super();
      this.first = true;
      this.types = new GArray([TransSplineVert]);
      this.first_viewport_redraw = true;
      if (start_mpos!==undefined&&typeof start_mpos!="number"&&__instance_of(start_mpos, Array)) {
          this.user_start_mpos = start_mpos;
      }
      if (datamode!==undefined)
        this.inputs.datamode.setValue(datamode);
      this.modaldata = {};
    }
    static  invoke(ctx, args) {
      var op=new this();
      if ("datamode" in args) {
          op.inputs.datamode.setValue(args["datamode"]);
      }
      if ("mpos" in args) {
          this.user_start_mpos = args["mpos"];
      }
      op.inputs.edit_all_layers.setValue(ctx.view2d.edit_all_layers);
      if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
          op.inputs.proportional.setValue(true);
          op.inputs.propradius.setValue(ctx.view2d.propradius);
      }
      return op;
    }
    static  tooldef() {
      return {inputs: {data: new CollectionProperty([], [], "data", "data", "data", TPropFlags.COLL_LOOSE_TYPE), 
      proportional: new BoolProperty(false, "proportional", "proportional mode"), 
      propradius: new FloatProperty(80, "propradius", "prop radius"), 
      datamode: new IntProperty(0, "datamode", "datamode"), 
      edit_all_layers: new BoolProperty(false, "Edit all layers", "Edit all layers"), 
      pivot: new Vec3Property(undefined, "pivot", "pivot", "pivot"), 
      use_pivot: new BoolProperty(false, "use_pivot", "use pivot", "use pivot"), 
      constraint_axis: new Vec3Property(undefined, "constraint_axis", "Constraint Axis", "Axis to constrain"), 
      constrain: new BoolProperty(false, "constrain", "Enable Constraint", "Enable Constraint Axis")}}
    }
     ensure_transdata(ctx) {
      var selmode=this.inputs.datamode.data;
      if (this.transdata==undefined) {
          this.types = [];
          if (selmode&SelMask.TOPOLOGY)
            this.types.push(TransSplineVert);
          this.transdata = new TransData(ctx, this, this.inputs.datamode.data);
      }
      return this.transdata;
    }
     finish(ctx) {
      delete this.transdata;
      delete this.modaldata;
      ctx.frameset.on_ctx_update(ctx);
    }
     cancel() {
      var ctx=this.modal_ctx;
      this.end_modal();
      this.undo(ctx, true);
    }
     undo_pre(ctx) {
      var td=this.ensure_transdata(ctx);
      var undo=this._undo = {};
      undo.edit_all_layers = this.inputs.edit_all_layers.data;
      for (var i=0; i<this.types.length; i++) {
          this.types[i].undo_pre(ctx, td, undo);
      }
    }
     undo(ctx, suppress_ctx_update=false) {
      var undo=this._undo;
      for (var i=0; i<this.types.length; i++) {
          this.types[i].undo(ctx, undo);
      }
      if (!suppress_ctx_update) {
          ctx.frameset.on_ctx_update(ctx);
      }
      window.redraw_viewport();
    }
     end_modal() {
      var ctx=this.modal_ctx;
      this.post_mousemove(event, true);
      ctx.appstate.set_modalstate(0);
      ToolOp.prototype.end_modal.call(this);
      this.finish(ctx);
    }
     start_modal(ctx) {
      super.start_modal(ctx);
      this.first_viewport_redraw = true;
      ctx.appstate.set_modalstate(ModalStates.TRANSFORMING);
      ctx.spline.solve().then(function () {
        redraw_viewport();
      });
      this.ensure_transdata(ctx);
      this.modaldata = {};
    }
     on_mousemove(event) {
      var td=this.ensure_transdata(this.modal_ctx);
      var ctx=this.modal_ctx;
      var mpos=new Vector3([event.x, event.y, 0]);
      mpos.load(ctx.view2d.getLocalMouse(event.original.x, event.original.y));
      var md=this.modaldata;
      if (this.first) {
          md.start_mpos = new Vector3(mpos);
          md.mpos = new Vector3(mpos);
          md.last_mpos = new Vector3(mpos);
          this.first = false;
          return ;
      }
      else 
        if (md.start_mpos===undefined&&this.user_start_mpos!==undefined) {
          md.start_mpos = new Vector3(this.user_start_mpos);
          md.start_mpos[2] = 0.0;
          md.last_mpos = new Vector3(md.start_mpos);
          md.mpos = new Vector3(md.start_mpos);
      }
      md.last_mpos.load(md.mpos);
      md.mpos.load(mpos);
      this.draw_helper_lines(md, ctx);
    }
     post_mousemove(event, force_solve=false) {
      var td=this.transdata, view2d=this.modal_ctx.view2d;
      var md=this.modaldata, do_last=true;
      var min1=post_mousemove_cachering.next(), max1=post_mousemove_cachering.next();
      var min2=post_mousemove_cachering.next(), max2=post_mousemove_cachering.next();
      if (this.first_viewport_redraw) {
          md.draw_minmax = new MinMax(3);
          do_last = false;
      }
      var ctx=this.modal_ctx;
      var minmax=md.draw_minmax;
      min1.load(minmax.min);
      max1.load(minmax.max);
      minmax.reset();
      for (var i=0; i<td.types.length; i++) {
          td.types[i].calc_draw_aabb(ctx, td, minmax);
      }
      for (var i=0; i<2; i++) {
          minmax.min[i]-=20/view2d.zoom;
          minmax.max[i]+=20/view2d.zoom;
      }
      if (do_last) {
          for (var i=0; i<2; i++) {
              min2[i] = Math.min(min1[i], minmax.min[i]);
              max2[i] = Math.max(max1[i], minmax.max[i]);
          }
      }
      else {
        min2.load(minmax.min), max2.load(minmax.max);
      }
      var found=false;
      for (var i=0; i<this.types; i++) {
          if (this.types[i]==TransSplineVert) {
              found = true;
              break;
          }
      }
      var this2=this;
      redraw_viewport(min2, max2, undefined, !this2.first_viewport_redraw);
      if (!ctx.spline.solving) {
          if (force_solve&&!ctx.spline.solving) {
              redraw_viewport(min2, max2, undefined, !this2.first_viewport_redraw);
          }
          else 
            if (force_solve) {
              ctx.spline._pending_solve.then(function () {
                redraw_viewport(min2, max2, undefined, !this2.first_viewport_redraw);
              });
          }
      }
      else 
        if (force_solve) {
          ctx.spline.solve(undefined, undefined, force_solve).then(function () {
            redraw_viewport(min2, max2, undefined, !this2.first_viewport_redraw);
          });
      }
    }
     draw_helper_lines(md, ctx) {
      this.reset_drawlines();
      if (this.inputs.proportional.data) {
          var rad=this.inputs.propradius.data;
          var steps=64, t=-Math.PI;
          dt = (Math.PI*2.0)/(steps-1);
          var td=this.transdata;
          var v1=new Vector3(), v2=new Vector3();
          var r=this.inputs.propradius.data;
          var cent=td.center;
          for (var i=0; i<steps-1; i++, t+=dt) {
              v1[0] = Math.sin(t)*r+cent[0];
              v1[1] = Math.cos(t)*r+cent[1];
              v2[0] = Math.sin(t+dt)*r+cent[0];
              v2[1] = Math.cos(t+dt)*r+cent[1];
              var dl=this.new_drawline(v1, v2);
              dl.clr[0] = dl.clr[1] = dl.clr[2] = 0.1;
              dl.clr[3] = 0.01;
              dl.width = 2;
          }
      }
    }
     on_keydown(event) {
      console.log(event.keyCode);
      var propdelta=15;
      switch (event.keyCode) {
        case 88:
        case 89:
          this.inputs.constraint_axis.data.zero();
          this.inputs.constraint_axis.data[event.keyCode==89 ? 1 : 0] = 1;
          this.inputs.constrain.setValue(true);
          this.exec(this.modal_ctx);
          window.redraw_viewport();
          break;
        case 13:
          console.log("end transform!");
          this.end_modal();
          break;
        case 27:
          this.cancel();
          break;
        case 189:
          if (this.inputs.proportional.data) {
              this.inputs.propradius.setValue(this.inputs.propradius.data-propdelta);
              this.transdata.propradius = this.inputs.propradius.data;
              this.transdata.calc_propweights();
              this.modal_ctx.view2d.propradius = this.inputs.propradius.data;
              this.exec(this.modal_ctx);
              this.draw_helper_lines(this.modaldata, this.modal_ctx);
              window.redraw_viewport();
          }
          break;
        case 187:
          if (this.inputs.proportional.data) {
              this.inputs.propradius.setValue(this.inputs.propradius.data+propdelta);
              this.transdata.propradius = this.inputs.propradius.data;
              this.transdata.calc_propweights();
              this.modal_ctx.view2d.propradius = this.inputs.propradius.data;
              this.exec(this.modal_ctx);
              this.draw_helper_lines(this.modaldata, this.modal_ctx);
              window.redraw_viewport();
          }
          break;
      }
    }
     on_mouseup(event) {
      console.log("end transform!");
      this.end_modal();
    }
     update(ctx) {
      for (var t of this.transdata.types) {
          t.update(ctx, this.transdata);
      }
    }
  }
  _ESClass.register(TransformOp);
  _es6_module.add_class(TransformOp);
  TransformOp = _es6_module.add_export('TransformOp', TransformOp);
  class TranslateOp extends TransformOp {
     constructor(user_start_mpos, datamode) {
      super(user_start_mpos, datamode);
    }
    static  tooldef() {
      return {uiname: "Translate", 
     apiname: "spline.translate", 
     description: "Move geometry around", 
     is_modal: true, 
     inputs: ToolOp.inherit({translation: new Vec3Property(undefined, "translation", "translation", "translation")})}
    }
     on_mousemove(event) {
      let first=this.first;
      super.on_mousemove(event);
      if (this.modaldata===undefined) {
          console.trace("ERROR: corrupted modal event call in TransformOp");
          return ;
      }
      if (first) {
          return ;
      }
      var md=this.modaldata;
      var ctx=this.modal_ctx;
      var td=this.transdata;
      let view2d=ctx.view2d;
      var start=mousemove_cachering.next(), off=mousemove_cachering.next();
      start.load(md.start_mpos);
      off.load(md.mpos);
      ctx.view2d.unproject(start);
      ctx.view2d.unproject(off);
      off.sub(start);
      off.mulScalar(view2d.dpi_scale);
      this.inputs.translation.setValue(off);
      this.exec(ctx);
      this.post_mousemove(event);
    }
     exec(ctx) {
      var td=this.modal_running ? this.transdata : this.ensure_transdata(ctx);
      var mat=new Matrix4();
      var off=this.inputs.translation.data;
      if (this.inputs.constrain.data) {
          off = new Vector3(off);
          off.mul(this.inputs.constraint_axis.data);
      }
      mat.makeIdentity();
      mat.translate(off[0], off[1], 0);
      for (var d of td.data) {
          d.type.apply(ctx, td, d, mat, d.w);
      }
      this.update(ctx);
      if (!this.modal_running) {
          ctx.frameset.on_ctx_update(ctx);
          delete this.transdata;
      }
    }
  }
  _ESClass.register(TranslateOp);
  _es6_module.add_class(TranslateOp);
  TranslateOp = _es6_module.add_export('TranslateOp', TranslateOp);
  class NonUniformScaleOp extends TransformOp {
     constructor(user_start_mpos, datamode) {
      super(user_start_mpos, datamode);
    }
    static  tooldef() {
      return {uiname: "Non-Uniform Scale", 
     apiname: "spline.nonuniform_scale", 
     description: "Resize geometry", 
     is_modal: true, 
     inputs: ToolOp.inherit({scale: new Vec3Property(undefined, "scale", "scale", "scale")})}
    }
     on_mousemove(event) {
      super.on_mousemove(event);
      var md=this.modaldata;
      var ctx=this.modal_ctx;
      var td=this.transdata;
      var scale=mousemove_cachering.next();
      var off1=mousemove_cachering.next();
      var off2=mousemove_cachering.next();
      off1.load(md.mpos).sub(td.scenter).vectorLength();
      off2.load(md.start_mpos).sub(td.scenter).vectorLength();
      scale[0] = off1[0]!=off2[0]&&off2[0]!=0.0 ? off1[0]/off2[0] : 1.0;
      scale[1] = off1[1]!=off2[1]&&off2[1]!=0.0 ? off1[1]/off2[1] : 1.0;
      scale[2] = 1.0;
      this.inputs.scale.setValue(scale);
      this.exec(ctx);
      this.post_mousemove(event);
    }
     exec(ctx) {
      var td=this.modal_running ? this.transdata : this.ensure_transdata(ctx);
      var mat=new Matrix4();
      var scale=this.inputs.scale.data;
      var cent=td.center;
      mat.makeIdentity();
      if (this.inputs.constrain.data) {
          scale = new Vector3(scale);
          let caxis=this.inputs.constraint_axis.data;
          for (let i=0; i<3; i++) {
              scale[i]+=(1.0-scale[i])*(1.0-caxis[i]);
          }
      }
      mat.translate(cent[0], cent[1], 0);
      mat.scale(scale[0], scale[1], scale[2]);
      mat.translate(-cent[0], -cent[1], 0);
      for (var d of td.data) {
          d.type.apply(ctx, td, d, mat, d.w);
      }
      this.update(ctx);
      if (!this.modal_running) {
          ctx.frameset.on_ctx_update(ctx);
          delete this.transdata;
      }
    }
  }
  _ESClass.register(NonUniformScaleOp);
  _es6_module.add_class(NonUniformScaleOp);
  NonUniformScaleOp = _es6_module.add_export('NonUniformScaleOp', NonUniformScaleOp);
  class ScaleOp extends TransformOp {
     constructor(user_start_mpos, datamode) {
      super(user_start_mpos, datamode);
    }
    static  tooldef() {
      return {uiname: "Scale", 
     apiname: "spline.scale", 
     description: "Resize geometry", 
     is_modal: true, 
     inputs: ToolOp.inherit({scale: new Vec3Property(undefined, "scale", "scale", "scale")})}
    }
     on_mousemove(event) {
      super.on_mousemove(event);
      var md=this.modaldata;
      var ctx=this.modal_ctx;
      var td=this.transdata;
      var scale=mousemove_cachering.next();
      var off=mousemove_cachering.next();
      var l1=off.load(md.mpos).sub(td.scenter).vectorLength();
      var l2=off.load(md.start_mpos).sub(td.scenter).vectorLength();
      scale[0] = scale[1] = l1/l2;
      scale[2] = 1.0;
      this.inputs.scale.setValue(scale);
      this.exec(ctx);
      this.post_mousemove(event);
    }
     exec(ctx) {
      var td=this.modal_running ? this.transdata : this.ensure_transdata(ctx);
      var mat=new Matrix4();
      var scale=this.inputs.scale.data;
      var cent=td.center;
      mat.makeIdentity();
      if (this.inputs.constrain.data) {
          scale = new Vector3(scale);
          let caxis=this.inputs.constraint_axis.data;
          for (let i=0; i<3; i++) {
              scale[i]+=(1.0-scale[i])*(1.0-caxis[i]);
          }
      }
      mat.translate(cent[0], cent[1], 0);
      mat.scale(scale[0], scale[1], scale[2]);
      mat.translate(-cent[0], -cent[1], 0);
      for (var d of td.data) {
          d.type.apply(ctx, td, d, mat, d.w);
      }
      this.update(ctx);
      if (!this.modal_running) {
          ctx.frameset.on_ctx_update(ctx);
          delete this.transdata;
      }
    }
  }
  _ESClass.register(ScaleOp);
  _es6_module.add_class(ScaleOp);
  ScaleOp = _es6_module.add_export('ScaleOp', ScaleOp);
  class RotateOp extends TransformOp {
    
     constructor(user_start_mpos, datamode) {
      super(user_start_mpos, datamode);
      this.angle_sum = 0.0;
    }
    static  tooldef() {
      return {uiname: "Rotate", 
     apiname: "spline.rotate", 
     description: "Rotate geometry", 
     is_modal: true, 
     inputs: ToolOp.inherit({angle: new FloatProperty(undefined, "angle", "angle", "angle")})}
    }
     on_mousemove(event) {
      super.on_mousemove(event);
      var md=this.modaldata;
      var ctx=this.modal_ctx;
      var td=this.transdata;
      var off=mousemove_cachering.next();
      this.reset_drawlines();
      var l1=off.load(md.mpos).sub(td.scenter).vectorLength();
      var l2=off.load(md.start_mpos).sub(td.scenter).vectorLength();
      var dl=this.new_drawline(md.mpos, td.scenter);
      ctx.view2d.unproject(dl.v1), ctx.view2d.unproject(dl.v2);
      var angle=Math.atan2(md.start_mpos[0]-td.scenter[0], md.start_mpos[1]-td.scenter[1])-Math.atan2(md.mpos[0]-td.scenter[0], md.mpos[1]-td.scenter[1]);
      this.angle_sum+=angle;
      md.start_mpos.load(md.mpos);
      this.inputs.angle.setValue(this.angle_sum);
      this.exec(ctx);
      this.post_mousemove(event);
    }
     exec(ctx) {
      var td=this.modal_running ? this.transdata : this.ensure_transdata(ctx);
      var mat=new Matrix4();
      var cent=td.center;
      mat.makeIdentity();
      mat.translate(cent[0], cent[1], 0);
      mat.rotate(this.inputs.angle.data, 0, 0, 1);
      mat.translate(-cent[0], -cent[1], 0);
      for (var d of td.data) {
          d.type.apply(ctx, td, d, mat, d.w);
      }
      this.update(ctx);
      if (!this.modal_running) {
          ctx.frameset.on_ctx_update(ctx);
          delete this.transdata;
      }
    }
  }
  _ESClass.register(RotateOp);
  _es6_module.add_class(RotateOp);
  RotateOp = _es6_module.add_export('RotateOp', RotateOp);
}, '/dev/fairmotion/src/editors/viewport/transform.js');
es6_module_define('transform_ops', ["./multires/multires_transdata.js", "../../curve/spline_types.js", "../../wasm/native_api.js", "../../util/mathlib.js", "../events.js", "./transform.js", "../../core/toolops_api.js", "./transdata.js", "../../core/toolprops.js", "./selectmode.js", "../dopesheet/dopesheet_transdata.js"], function _transform_ops_module(_es6_module) {
  var MinMax=es6_import_item(_es6_module, '../../util/mathlib.js', 'MinMax');
  var TransformOp=es6_import_item(_es6_module, './transform.js', 'TransformOp');
  var ScaleOp=es6_import_item(_es6_module, './transform.js', 'ScaleOp');
  var NonUniformScaleOp=es6_import_item(_es6_module, './transform.js', 'NonUniformScaleOp');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var MResTransData=es6_import_item(_es6_module, './multires/multires_transdata.js', 'MResTransData');
  var Vec3Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec3Property');
  var BoolProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'BoolProperty');
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var CollectionProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'CollectionProperty');
  var TPropFlags=es6_import_item(_es6_module, '../../core/toolprops.js', 'TPropFlags');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var ModalStates=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ModalStates');
  var TransDataItem=es6_import_item(_es6_module, './transdata.js', 'TransDataItem');
  var TransDataType=es6_import_item(_es6_module, './transdata.js', 'TransDataType');
  var TransDopeSheetType=es6_import_item(_es6_module, '../dopesheet/dopesheet_transdata.js', 'TransDopeSheetType');
  var KeyMap=es6_import_item(_es6_module, '../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../events.js', 'EventHandler');
  var clear_jobs=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs');
  var clear_jobs_except_latest=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs_except_latest');
  var clear_jobs_except_first=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs_except_first');
  var JobTypes=es6_import_item(_es6_module, '../../wasm/native_api.js', 'JobTypes');
  var Vec2Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec2Property');
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  class WidgetResizeOp extends TransformOp {
     constructor(user_start_mpos, datamode) {
      super(user_start_mpos, datamode);
    }
    static  tooldef() {
      return {uiname: "Resize", 
     apiname: "spline.widget_resize", 
     description: "Resize geometry", 
     is_modal: true, 
     inputs: ToolOp.inherit({translation: new Vec2Property(), 
      scale: new Vec2Property(), 
      rotation: new FloatProperty(0.0), 
      pivot: new Vec2Property()}), 
     outputs: {}}
    }
    static  _get_bounds(minmax, spline, ctx) {
      let totsel=0;
      minmax.reset();
      for (let v of spline.verts.selected.editable(ctx)) {
          minmax.minmax(v);
          totsel++;
      }
      if (ctx.view2d.selectmode&SelMask.HANDLE) {
          for (let h of spline.handles.selected.editable(ctx)) {
              minmax.minmax(h);
              totsel++;
          }
      }
      for (let seg of spline.segments.selected.editable(ctx)) {
          let aabb=seg.aabb;
          minmax.minmax(aabb[0]);
          minmax.minmax(aabb[1]);
      }
      return totsel;
    }
    static  create_widgets(manager, ctx) {
      let spline=ctx.spline;
      let minmax=new MinMax(2);
      let totsel=WidgetResizeOp._get_bounds(minmax, spline, ctx);
      if (totsel<2) {
          return ;
      }
      let cent=new Vector2(minmax.min).add(minmax.max).mulScalar(0.5);
      let widget=manager.create(this);
      let w=(minmax.max[0]-minmax.min[0])*0.5;
      let h=(minmax.max[1]-minmax.min[1])*0.5;
      let len=9;
      let outline=widget.outline([-w, -h], [w, h], "outline", [0.4, 0.4, 0.4, 0.7]);
      let larrow=widget.arrow([0, 0], [0, 0], "l", [0, 0, 0, 1.0]);
      let rarrow=widget.arrow([0, 0], [0, 0], "r", [0, 0, 0, 1.0]);
      let tarrow=widget.arrow([0, 0], [0, 0], "t", [0, 0, 0, 1.0]);
      let barrow=widget.arrow([0, 0], [0, 0], "b", [0, 0, 0, 1.0]);
      let corners=new Array(4);
      for (let i=0; i<4; i++) {
          corners[i] = widget.arrow([0, 0], [0, 0], i, [0, 0, 0, 1.0]);
      }
      let signs=[[-1, -1], [-1, 1], [1, 1], [1, -1]];
      let set_handles=() =>        {
        rarrow.v1[0] = w, rarrow.v1[1] = 0.0;
        rarrow.v2[0] = w+len, rarrow.v2[1] = 0.0;
        larrow.v1[0] = -w, larrow.v1[1] = 0.0;
        larrow.v2[0] = -w-len, larrow.v2[1] = 0.0;
        tarrow.v1[0] = 0, tarrow.v1[1] = h;
        tarrow.v2[0] = 0, tarrow.v2[1] = h+len;
        barrow.v1[0] = 0, barrow.v1[1] = -h;
        barrow.v2[0] = 0, barrow.v2[1] = -h-len;
        outline.v1[0] = -w, outline.v1[1] = -h;
        outline.v2[0] = w, outline.v2[1] = h;
        for (let i=0; i<4; i++) {
            let c=corners[i];
            c.v1[0] = w*signs[i][0], c.v1[1] = h*signs[i][1];
            c.v2[0] = (w+len)*signs[i][0], c.v2[1] = (h+len)*signs[i][1];
        }
      };
      set_handles();
      widget.co = new Vector2(cent);
      widget.on_tick = function (ctx) {
        let totsel=WidgetResizeOp._get_bounds(minmax, spline, ctx);
        let update=false;
        if (totsel<2) {
            this.hide();
            return ;
        }
        else {
          update = this.hidden;
          this.unhide();
        }
        let cx=(minmax.min[0]+minmax.max[0])*0.5;
        let cy=(minmax.min[1]+minmax.max[1])*0.5;
        let w2=(minmax.max[0]-minmax.min[0])*0.5;
        let h2=(minmax.max[1]-minmax.min[1])*0.5;
        update = update||cx!=this.co[0]||cy!=this.co[1];
        update = update||w2!=w||h2!=h;
        if (update) {
            w = w2, h = h2;
            this.co[0] = cx;
            this.co[1] = cy;
            set_handles();
            this.update();
        }
      };
      let corner_onclick=function (e, view2d, id) {
        let ci=id;
        let anchor=corners[(ci+2)%4];
        let co=new Vector3();
        co[0] = anchor.v1[0]+widget.co[0];
        co[1] = anchor.v1[1]+widget.co[1];
        let mpos=new Vector3([e.origX, e.origY, 0.0]);
        let toolop=e.ctrlKey ? new ScaleOp(mpos, view2d.selectmode) : new NonUniformScaleOp(mpos, view2d.selectmode);
        toolop.inputs.edit_all_layers.setValue(view2d.ctx.edit_all_layers);
        toolop.inputs.use_pivot.setValue(true);
        toolop.inputs.pivot.setValue(co);
        view2d.ctx.toolstack.exec_tool(toolop);
        return true;
      };
      for (let i=0; i<4; i++) {
          corners[i].on_click = corner_onclick;
      }
      larrow.on_click = rarrow.on_click = function (e, view2d, id) {
        let mpos=new Vector3([e.origX, e.origY, 0.0]);
        let toolop=new ScaleOp(mpos, view2d.selectmode);
        let co=new Vector3(widget.co);
        co[2] = 1.0;
        if (!e.shiftKey) {
            co[0]+=id==='l' ? w : -w;
        }
        toolop.inputs.use_pivot.setValue(true);
        toolop.inputs.pivot.setValue(co);
        toolop.inputs.edit_all_layers.setValue(view2d.ctx.edit_all_layers);
        toolop.inputs.constrain.setValue(true);
        toolop.inputs.constraint_axis.setValue(new Vector3([1, 0, 0]));
        view2d.ctx.toolstack.exec_tool(toolop);
        return true;
      };
      tarrow.on_click = barrow.on_click = function (e, view2d, id) {
        let mpos=new Vector3([e.origX, e.origY, 0.0]);
        let toolop=new ScaleOp(mpos, view2d.selectmode);
        let co=new Vector3(widget.co);
        co[2] = 1.0;
        if (!e.shiftKey) {
            co[1]+=id==='b' ? h : -h;
        }
        toolop.inputs.edit_all_layers.setValue(view2d.ctx.edit_all_layers);
        toolop.inputs.use_pivot.setValue(true);
        toolop.inputs.pivot.setValue(co);
        toolop.inputs.constrain.setValue(true);
        toolop.inputs.constraint_axis.setValue(new Vector3([0, 1, 0]));
        view2d.ctx.toolstack.exec_tool(toolop);
        return true;
      };
      return widget;
    }
    static  reset_widgets(op, ctx) {

    }
  }
  _ESClass.register(WidgetResizeOp);
  _es6_module.add_class(WidgetResizeOp);
  WidgetResizeOp = _es6_module.add_export('WidgetResizeOp', WidgetResizeOp);
  class WidgetRotateOp extends TransformOp {
     constructor(user_start_mpos, datamode) {
      super(user_start_mpos, datamode);
    }
    static  tooldef() {
      return {uiname: "Rotate", 
     apiname: "spline.widget_rotate", 
     description: "Rotate geometry", 
     is_modal: true, 
     inputs: ToolOp.inherit({translation: new Vec2Property(), 
      scale: new Vec2Property(), 
      rotation: new FloatProperty(0.0), 
      pivot: new Vec2Property()}), 
     outputs: {}}
    }
    static  _get_bounds(minmax, spline, ctx) {
      let totsel=0;
      minmax.reset();
      for (let v of spline.verts.selected.editable(ctx)) {
          minmax.minmax(v);
          totsel++;
      }
      if (ctx.view2d.selectmode&SelMask.HANDLE) {
          for (let h of spline.handles.selected.editable(ctx)) {
              minmax.minmax(h);
              totsel++;
          }
      }
      for (let seg of spline.segments.selected.editable(ctx)) {
          let aabb=seg.aabb;
          minmax.minmax(aabb[0]);
          minmax.minmax(aabb[1]);
      }
      return totsel;
    }
    static  create_widgets(manager, ctx) {
      let spline=ctx.spline;
      let minmax=new MinMax(2);
      let totsel=WidgetResizeOp._get_bounds(minmax, spline, ctx);
      if (totsel<2) {
          return ;
      }
      let cent=new Vector2(minmax.min).add(minmax.max).mulScalar(0.5);
      let widget=manager.create(this);
      let w=(minmax.max[0]-minmax.min[0])*0.5;
      let h=(minmax.max[1]-minmax.min[1])*0.5;
      let len=9;
      if (w==0&h==0) {
          return ;
      }
      let r=Math.sqrt(w*w+h*h)*Math.sqrt(2)*0.5;
      let circle=widget.circle([0, 0], r, "rotate_circle", [0.4, 0.4, 0.4, 0.7]);
      widget.co = new Vector2(cent);
      widget.on_tick = function (ctx) {
        let totsel=WidgetResizeOp._get_bounds(minmax, spline, ctx);
        let update=false;
        if (totsel<2) {
            this.hide();
            return ;
        }
        else {
          update = this.hidden;
          this.unhide();
        }
        let cx=(minmax.min[0]+minmax.max[0])*0.5;
        let cy=(minmax.min[1]+minmax.max[1])*0.5;
        let w2=(minmax.max[0]-minmax.min[0])*0.5;
        let h2=(minmax.max[1]-minmax.min[1])*0.5;
        update = update||cx!=this.co[0]||cy!=this.co[1];
        update = update||w2!=w||h2!=h;
        if (update) {
            this.co[0] = cx;
            this.co[1] = cy;
            this.update();
        }
        return ;
        if (update) {
            w = w2, h = h2;
            this.co[0] = cx;
            this.co[1] = cy;
            set_handles();
            this.update();
        }
      };
      let corner_onclick=function (e, view2d, id) {
        let ci=id;
        let anchor=corners[(ci+2)%4];
        let co=new Vector3();
        co[0] = anchor.v1[0]+widget.co[0];
        co[1] = anchor.v1[1]+widget.co[1];
        let mpos=new Vector3([e.origX, e.origY, 0.0]);
        let toolop=e.ctrlKey ? new ScaleOp(mpos, view2d.selectmode) : new NonUniformScaleOp(mpos, view2d.selectmode);
        toolop.inputs.use_pivot.setValue(true);
        toolop.inputs.pivot.setValue(co);
        view2d.ctx.toolstack.exec_tool(toolop);
        return true;
      };
      circle.on_click = function (e, view2d, id) {
        let mpos=new Vector3([e.origX, e.origY, 0.0]);
        let toolop=new ScaleOp(mpos, view2d.selectmode);
        let co=new Vector3(widget.co);
        if (!e.shiftKey) {
            co[1]+=id=='b' ? h : -h;
        }
        toolop.inputs.use_pivot.setValue(true);
        toolop.inputs.pivot.setValue(co);
        toolop.inputs.constrain.setValue(true);
        toolop.inputs.constraint_axis.setValue(new Vector3([0, 1, 0]));
        view2d.ctx.toolstack.exec_tool(toolop);
        return true;
      };
      return widget;
    }
    static  reset_widgets(op, ctx) {

    }
  }
  _ESClass.register(WidgetRotateOp);
  _es6_module.add_class(WidgetRotateOp);
  WidgetRotateOp = _es6_module.add_export('WidgetRotateOp', WidgetRotateOp);
}, '/dev/fairmotion/src/editors/viewport/transform_ops.js');
es6_module_define('transform_query', ["./transform_spline.js", "./transform_object.js", "./selectmode.js", "./transdata.js"], function _transform_query_module(_es6_module) {
  var TransDataType=es6_import_item(_es6_module, './transdata.js', 'TransDataType');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var TransSceneObject=es6_import_item(_es6_module, './transform_object.js', 'TransSceneObject');
  var TransSplineVert=es6_import_item(_es6_module, './transform_spline.js', 'TransSplineVert');
  function getTransDataType(ctx) {
    if (ctx.view2d.selectmode==SelMask.OBJECT) {
        return TransSceneObject;
    }
    else {
      return TransSplineVert;
    }
  }
  getTransDataType = _es6_module.add_export('getTransDataType', getTransDataType);
}, '/dev/fairmotion/src/editors/viewport/transform_query.js');
es6_module_define('transform_object', ["./selectmode.js", "../../scene/sceneobject.js", "./transdata.js", "./transform_spline.js", "../../path.ux/scripts/util/vectormath.js"], function _transform_object_module(_es6_module) {
  var TransDataType=es6_import_item(_es6_module, './transdata.js', 'TransDataType');
  var TransData=es6_import_item(_es6_module, './transdata.js', 'TransData');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var TransDataItem=es6_import_item(_es6_module, './transdata.js', 'TransDataItem');
  var TransSplineVert=es6_import_item(_es6_module, './transform_spline.js', 'TransSplineVert');
  var UpdateFlags=es6_import_item(_es6_module, '../../scene/sceneobject.js', 'UpdateFlags');
  es6_import(_es6_module, '../../path.ux/scripts/util/vectormath.js');
  let iter_cachering=new cachering(() =>    {
    let ret=new TransDataItem();
    ret.start_data = new Matrix4();
    return ret;
  }, 512);
  class TransSceneObject extends TransDataType {
    static  iter_data(ctx, td) {
      return (function* () {
        let scene=ctx.scene;
        for (let ob in scene.objects.selected_editable) {
            let ti=iter_cachering.next();
            ob.recalcMatrix();
            ti.type = TransSceneObject;
            ti.data = ob;
            ti.start_data.load(ob.matrix);
            yield ti;
        }
      })();
    }
    static  getDataPath(ctx, td, ti) {
      return `scene.objects[${ti.data.id}]`;
    }
    static  gen_data(ctx, td, data) {
      let scene=ctx.scene;
      for (let ob in scene.objects.selected_editable) {
          let ti=new TransDataItem();
          ob.recalcMatrix();
          ti.type = TransSceneObject;
          ti.data = ob;
          ti.start_data = new Matrix4(ob.matrix);
          data.push(ti);
      }
    }
    static  calc_prop_distances(ctx, td, data) {

    }
    static  update(ctx, td) {
      for (let ti of td.data) {
          if (ti.type===TransSceneObject) {
              ti.data.update(UpdateFlags.TRANSFORM);
          }
      }
      window.redraw_viewport();
    }
    static  undo(ctx, undo_obj) {
      let scene=ctx.scene;
      for (let id in undo_obj.object) {
          let ob=scene.get(id);
          let ud=undo_obj.object[id];
          ob.loc.load(ud.loc);
          ob.scale.load(ud.scale);
          ob.rot = ud.rot;
          ob.matrix.load(ud.matrix);
          ob.update();
          ob.recalcAABB();
      }
      window.redraw_viewport();
    }
    static  undo_pre(ctx, td, undo_obj) {
      let ud=undo_obj["object"] = {};
      let scene=ctx.scene;
      for (let ob in scene.objects.selected_editable) {
          ud[ob.id] = {matrix: new Matrix4(ob.matrix), 
       loc: new Vector2(ob.loc), 
       scale: new Vector2(ob.scale), 
       rot: ob.rot};
      }
    }
    static  apply(ctx, td, item, mat, w) {
      let rot=new Vector3(), loc=new Vector3(), scale=new Vector3();
      for (let ti of td.data) {
          if (ti.type!==TransSceneObject) {
              continue;
          }
          let ob=ti.data;
          let mat=ob.matrix;
          mat.load(ti.start_data).multiply(mat);
          if (mat.decompose(loc, rot, scale)) {
              ob.loc.load(loc);
              ob.scale.load(scale);
              ob.rot = rot[2];
          }
      }
    }
    static  calc_draw_aabb(ctx, td, minmax) {

    }
    static  aabb(ctx, td, item, minmax, selected_only) {

    }
  }
  _ESClass.register(TransSceneObject);
  _es6_module.add_class(TransSceneObject);
  TransSceneObject = _es6_module.add_export('TransSceneObject', TransSceneObject);
  TransSceneObject.selectmode = SelMask.OBJECT;
}, '/dev/fairmotion/src/editors/viewport/transform_object.js');
es6_module_define('transform_spline', ["./selectmode.js", "./transdata.js", "../dopesheet/dopesheet_transdata.js", "../../core/toolprops.js", "../../core/toolops_api.js", "../../util/mathlib.js", "../../wasm/native_api.js", "../events.js", "../../curve/spline_types.js", "./view2d_base.js"], function _transform_spline_module(_es6_module) {
  var MinMax=es6_import_item(_es6_module, '../../util/mathlib.js', 'MinMax');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var Vec3Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec3Property');
  var BoolProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'BoolProperty');
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var CollectionProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'CollectionProperty');
  var TPropFlags=es6_import_item(_es6_module, '../../core/toolprops.js', 'TPropFlags');
  var EnumProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'EnumProperty');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var ModalStates=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ModalStates');
  var TransDataItem=es6_import_item(_es6_module, './transdata.js', 'TransDataItem');
  var TransDataType=es6_import_item(_es6_module, './transdata.js', 'TransDataType');
  var TransDopeSheetType=es6_import_item(_es6_module, '../dopesheet/dopesheet_transdata.js', 'TransDopeSheetType');
  var SessionFlags=es6_import_item(_es6_module, './view2d_base.js', 'SessionFlags');
  var KeyMap=es6_import_item(_es6_module, '../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../events.js', 'EventHandler');
  var clear_jobs=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs');
  var clear_jobs_except_latest=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs_except_latest');
  var clear_jobs_except_first=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs_except_first');
  var JobTypes=es6_import_item(_es6_module, '../../wasm/native_api.js', 'JobTypes');
  var TransData=es6_import_item(_es6_module, './transdata.js', 'TransData');
  var TransDataType=es6_import_item(_es6_module, './transdata.js', 'TransDataType');
  var _tsv_apply_tmp1=new Vector3();
  var _tsv_apply_tmp2=new Vector3();
  var post_mousemove_cachering=cachering.fromConstructor(Vector3, 64);
  var mousemove_cachering=cachering.fromConstructor(Vector3, 64);
  class TransSplineVert extends TransDataType {
    static  apply(ctx, td, item, mat, w) {
      var co=_tsv_apply_tmp1;
      var v=item.data;
      if (w==0.0)
        return ;
      co.load(item.start_data);
      co[2] = 0.0;
      co.multVecMatrix(mat);
      v.load(co).sub(item.start_data).mulScalar(w).add(item.start_data);
      v.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      if (v.type==SplineTypes.HANDLE) {
          var seg=v.owning_segment;
          seg.update();
          seg.flag|=SplineFlags.FRAME_DIRTY;
          seg.v1.flag|=SplineFlags.UPDATE;
          seg.v2.flag|=SplineFlags.UPDATE;
          var hpair=seg.update_handle(v);
          if (hpair!=undefined) {
              hpair.flag|=SplineFlags.FRAME_DIRTY;
          }
      }
      else {
        for (var j=0; j<v.segments.length; j++) {
            v.segments[j].flag|=SplineFlags.FRAME_DIRTY;
            v.segments[j].h1.flag|=SplineFlags.FRAME_DIRTY;
            v.segments[j].h2.flag|=SplineFlags.FRAME_DIRTY;
            v.segments[j].update();
            var hpair=v.segments[j].update_handle(v.segments[j].handle(v));
            if (hpair!=undefined) {
                hpair.flag|=SplineFlags.FRAME_DIRTY;
            }
        }
      }
    }
    static  getDataPath(ctx, td, ti) {
      return `spline.verts[${ti.data.eid}]`;
    }
    static  undo_pre(ctx, td, undo_obj) {
      var doneset=new set();
      var undo=[];
      function push_vert(v) {
        if (doneset.has(v))
          return ;
        doneset.add(v);
        undo.push(v.eid);
        undo.push(v[0]);
        undo.push(v[1]);
        undo.push(v[2]);
      }
      for (var i=0; i<td.data.length; i++) {
          var d=td.data[i];
          if (d.type!==TransSplineVert)
            continue;
          var v=d.data;
          if (v.type==SplineTypes.HANDLE) {
              if (v.hpair!=undefined) {
                  push_vert(v.hpair);
              }
              if (v.owning_vertex!==undefined&&v.owning_vertex.segments.length==2) {
                  var ov=v.owning_vertex;
                  for (var j=0; j<ov.segments.length; j++) {
                      var s=ov.segments[j];
                      push_vert(s.h1);
                      push_vert(s.h2);
                  }
              }
              else 
                if (v.owning_vertex===undefined) {
                  console.warn("Orphaned handle!", v.eid, v);
              }
          }
          push_vert(v);
      }
      undo_obj['svert'] = undo;
    }
    static  undo(ctx, undo_obj) {
      var spline=ctx.spline;
      var i=0;
      var undo=undo_obj['svert'];
      var edit_all_layers=undo.edit_all_layers;
      while (i<undo.length) {
        var eid=undo[i++];
        var v=spline.eidmap[eid];
        if (v==undefined) {
            console.log("Transform undo error!", eid);
            i+=4;
            continue;
        }
        v[0] = undo[i++];
        v[1] = undo[i++];
        v[2] = undo[i++];
        if (v.type==SplineTypes.HANDLE&&!v.use) {
            var seg=v.segments[0];
            seg.update();
            seg.flag|=SplineFlags.FRAME_DIRTY;
            seg.v1.flag|=SplineFlags.UPDATE;
            seg.v2.flag|=SplineFlags.UPDATE;
        }
        else 
          if (v.type==SplineTypes.VERTEX) {
            v.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
            for (var j=0; j<v.segments.length; j++) {
                v.segments[j].update();
                v.segments[j].flag|=SplineFlags.FRAME_DIRTY;
                v.segments[j].h1.flag|=SplineFlags.FRAME_DIRTY;
                v.segments[j].h2.flag|=SplineFlags.FRAME_DIRTY;
            }
        }
      }
      spline.resolve = 1;
    }
    static  update(ctx, td) {
      var spline=ctx.spline;
      spline.resolve = 1;
    }
    static  calc_prop_distances(ctx, td, data) {
      var doprop=td.doprop;
      var proprad=td.propradius;
      var spline=ctx.spline;
      var propfacs={};
      var shash=spline.build_shash();
      var tdmap={};
      var layer=td.layer;
      var edit_all_layers=td.edit_all_layers;
      for (var tv of data) {
          if (tv.type!==TransSplineVert)
            continue;
          tdmap[tv.data.eid] = tv;
      }
      for (var v of spline.verts.selected.editable(ctx)) {
          shash.forEachPoint(v, proprad, function (v2, dis) {
            if (v2.flag&SplineFlags.SELECT)
              return ;
            if (v2.hidden)
              return ;
            if (!v2.in_layer(layer))
              return ;
            if (!(v2.eid in propfacs)) {
                propfacs[v2.eid] = dis;
            }
            propfacs[v2.eid] = Math.min(propfacs[v2.eid], dis);
            v2.flag|=SplineFlags.UPDATE;
          });
      }
      for (var k in propfacs) {
          var v=spline.eidmap[k];
          var d=propfacs[k];
          var tv=tdmap[k];
          tv.dis = d;
      }
    }
    static  gen_data(ctx, td, data) {
      var doprop=td.doprop;
      var proprad=td.propradius;
      var selmap={};
      var spline=ctx.spline;
      var tdmap={};
      var layer=td.layer;
      var edit_all_layers=td.edit_all_layers;
      for (var i=0; i<2; i++) {
          for (var v of i ? spline.handles.selected.editable(ctx) : spline.verts.selected.editable(ctx)) {
              var co=new Vector3(v);
              if (i) {
                  var ov=v.owning_segment.handle_vertex(v);
                  if (ov!=undefined&&v.hidden&&ov.hidden)
                    continue;
              }
              else 
                if (v.hidden) {
                  continue;
              }
              selmap[v.eid] = 1;
              var td=new TransDataItem(v, TransSplineVert, co);
              data.push(td);
              tdmap[v.eid] = td;
          }
      }
      if (!doprop)
        return ;
      var propfacs={};
      var shash=spline.build_shash();
      for (var si=0; si<2; si++) {
          var list=si ? spline.handles : spline.verts;
          for (var v of list) {
              if (!edit_all_layers&&!v.in_layer(layer))
                continue;
              if (si) {
                  var ov=v.owning_segment.handle_vertex(v);
                  if (ov!=undefined&&v.hidden&&ov.hidden)
                    continue;
              }
              else 
                if (v.hidden) {
                  continue;
              }
              if (v.eid in selmap)
                continue;
              var co=new Vector3(v);
              var td=new TransDataItem(v, TransSplineVert, co);
              data.push(td);
              td.dis = 10000;
              tdmap[v.eid] = td;
          }
      }
      console.log("proprad", proprad);
      for (var v of spline.verts.selected.editable(ctx)) {
          shash.forEachPoint(v, proprad, function (v2, dis) {
            if (v2.flag&SplineFlags.SELECT)
              return ;
            if (!edit_all_layers&&!v2.in_layer(layer))
              return ;
            if (v2.type==SplineTypes.HANDLE&&v2.hidden&&(v2.owning_vertex==undefined||v2.owning_vertex.hidden))
              return ;
            if (v2.type==SplineTypes.VERTEX&&v2.hidden)
              return ;
            if (!(v2.eid in propfacs)) {
                propfacs[v2.eid] = dis;
            }
            propfacs[v2.eid] = Math.min(propfacs[v2.eid], dis);
            v2.flag|=SplineFlags.UPDATE;
            for (var i=0; i<v2.segments.length; i++) {
                v2.segments[i].update();
            }
          });
      }
      for (var k in propfacs) {
          var v=spline.eidmap[k];
          var d=propfacs[k];
          var tv=tdmap[k];
          tv.dis = d;
      }
    }
    static  calc_draw_aabb(ctx, td, minmax) {
      var vset={};
      var sset={};
      var hset={};
      for (var i=0; i<td.data.length; i++) {
          var d=td.data[i];
          if (d.type!=TransSplineVert)
            continue;
          if (d.data.type==SplineTypes.HANDLE)
            hset[d.data.eid] = 1;
      }
      function rec_walk(v, depth) {
        if (depth>2)
          return ;
        if (v==undefined)
          return ;
        if (v.eid in vset)
          return ;
        vset[v.eid] = 1;
        minmax.minmax(v);
        for (var i=0; i<v.segments.length; i++) {
            var seg=v.segments[i];
            if (!(seg.eid in sset)) {
                sset[seg.eid] = 1;
                seg.update_aabb();
                minmax.minmax(seg._aabb[0]);
                minmax.minmax(seg._aabb[1]);
            }
            var v2=seg.other_vert(v);
            if (v2!=undefined&&(v2.flag&SplineFlags.SELECT))
              continue;
            if (v.type==SplineTypes.HANDLE&&!(v.eid in hset)) {
                vset[v.eid] = 1;
            }
            else {
              rec_walk(seg.other_vert(v), depth+1);
            }
        }
      }
      for (var i=0; i<td.data.length; i++) {
          var d=td.data[i];
          if (d.type!=TransSplineVert)
            continue;
          if (d.w<=0.0)
            continue;
          var v=d.data;
          if (v.eid in vset)
            continue;
          if (v.type==SplineTypes.HANDLE)
            v = v.owning_vertex;
          for (var j=0; j<v.segments.length; j++) {
              var seg=v.segments[j];
              if (!seg.l)
                continue;
              var _i1=0, l=seg.l;
              do {
                var faabb=l.f._aabb;
                minmax.minmax(faabb[0]);
                minmax.minmax(faabb[1]);
                if (_i1++>100) {
                    console.log("infinite loop!");
                    break;
                }
                l = l.radial_next;
              } while (l!=seg.l);
              
          }
          rec_walk(v, 0);
      }
    }
    static  aabb(ctx, td, item, minmax, selected_only) {
      var co=_tsv_apply_tmp2;
      if (item.w<=0.0)
        return ;
      if (item.data.hidden)
        return ;
      co.load(item.data);
      co[2] = 0.0;
      minmax.minmax(co);
      for (var i=0; i<item.data.segments.length; i++) {
          var seg=item.data.segments[i];
          if (selected_only&&!(item.data.flag&SplineFlags.SELECT))
            continue;
          seg.update_aabb();
          minmax.minmax(seg.aabb[0]);
          minmax.minmax(seg.aabb[1]);
      }
    }
  }
  _ESClass.register(TransSplineVert);
  _es6_module.add_class(TransSplineVert);
  TransSplineVert = _es6_module.add_export('TransSplineVert', TransSplineVert);
  TransSplineVert.selectmode = SelMask.TOPOLOGY;
}, '/dev/fairmotion/src/editors/viewport/transform_spline.js');
es6_module_define('spline_selectops', ["../../curve/spline_draw.js", "../../curve/spline_types.js", "../../core/toolops_api.js", "../../core/animdata.js", "../../core/toolprops.js"], function _spline_selectops_module(_es6_module) {
  "use strict";
  var $_mh;
  var $_swapt;
  let PI=Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos, asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var BoolProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'BoolProperty');
  var EnumProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'EnumProperty');
  var StringProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'StringProperty');
  var FlagProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FlagProperty');
  var CollectionProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'CollectionProperty');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var SplineVertex=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineSegment');
  var SplineFace=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFace');
  var redraw_element=es6_import_item(_es6_module, '../../curve/spline_draw.js', 'redraw_element');
  var get_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'get_vtime');
  let SelOpModes={AUTO: 0, 
   SELECT: 1, 
   DESELECT: 2}
  SelOpModes = _es6_module.add_export('SelOpModes', SelOpModes);
  class SelectOpBase extends ToolOp {
     constructor(datamode, do_flush, uiname) {
      super(undefined, uiname);
      if (datamode!==undefined)
        this.inputs.datamode.setValue(datamode);
      if (do_flush!==undefined)
        this.inputs.flush.setValue(do_flush);
    }
    static  tooldef() {
      return {inputs: {mode: new EnumProperty("AUTO", SelOpModes, "mode", "mode"), 
      datamode: new IntProperty(0), 
      flush: new BoolProperty(false)}}
    }
    static  invoke(ctx, args) {
      let datamode;
      let ret=new this();
      if ("selectmode" in args) {
          datamode = args["selectmode"];
      }
      else {
        datamode = ctx.selectmode;
      }
      ret.inputs.datamode.setValue(datamode);
      console.log("args", args);
      if ("mode" in args) {
          let mode=args["mode"].toUpperCase().trim();
          ret.inputs.mode.setValue(mode);
      }
      else {
        ret.inputs.mode.setValue("AUTO");
      }
      return ret;
    }
     undo_pre(ctx) {
      let spline=ctx.spline;
      let ud=this._undo = [];
      for (let v of spline.verts.selected) {
          ud.push(v.eid);
      }
      for (let h of spline.handles.selected) {
          ud.push(h.eid);
      }
      for (let s of spline.segments.selected) {
          ud.push(s.eid);
      }
      ud.active_vert = spline.verts.active!==undefined ? spline.verts.active.eid : -1;
      ud.active_handle = spline.handles.active!==undefined ? spline.handles.active.eid : -1;
      ud.active_segment = spline.segments.active!==undefined ? spline.segments.active.eid : -1;
      ud.active_face = spline.faces.active!==undefined ? spline.faces.active.eid : -1;
    }
     undo(ctx) {
      let ud=this._undo;
      let spline=ctx.spline;
      console.log(ctx, spline);
      spline.clear_selection();
      let eidmap=spline.eidmap;
      for (let i=0; i<ud.length; i++) {
          if (!(ud[i] in eidmap)) {
              console.trace("Warning, corruption in SelectOpBase.undo(): '", ud[i], "'.");
              continue;
          }
          let e=eidmap[ud[i]];
          spline.setselect(e, true);
      }
      spline.verts.active = eidmap[ud.active_vert];
      spline.handles.active = eidmap[ud.active_handle];
      spline.segments.active = eidmap[ud.active_segment];
      spline.faces.active = eidmap[ud.active_face];
    }
  }
  _ESClass.register(SelectOpBase);
  _es6_module.add_class(SelectOpBase);
  SelectOpBase = _es6_module.add_export('SelectOpBase', SelectOpBase);
  class SelectOneOp extends SelectOpBase {
     constructor(e=undefined, unique=true, mode=true, datamode=0, do_flush=false) {
      super(datamode, do_flush, "Select Element");
      this.inputs.unique.setValue(unique);
      this.inputs.state.setValue(mode);
      if (e!=undefined)
        this.inputs.eid.setValue(e.eid);
    }
    static  tooldef() {
      return {apiname: "spline.select_one", 
     uiname: "Select Element", 
     inputs: ToolOp.inherit({eid: new IntProperty(-1), 
      state: new BoolProperty(true), 
      set_active: new BoolProperty(true), 
      unique: new BoolProperty(true)}), 
     description: "Select Element"}
    }
     exec(ctx) {
      let spline=ctx.spline;
      let e=spline.eidmap[this.inputs.eid.data];
      if (e==undefined) {
          console.trace("Error in SelectOneOp", this.inputs.eid.data, this);
          return ;
      }
      let state=this.inputs.state.data;
      if (this.inputs.unique.data) {
          state = true;
          for (let e of spline.selected) {
              redraw_element(e);
          }
          spline.clear_selection();
      }
      console.log("selectone!", e, state);
      spline.setselect(e, state);
      if (state&&this.inputs.set_active.data) {
          spline.set_active(e);
      }
      if (this.inputs.flush.data) {
          console.log("flushing data!", this.inputs.datamode.data);
          spline.select_flush(this.inputs.datamode.data);
      }
      redraw_element(e);
    }
  }
  _ESClass.register(SelectOneOp);
  _es6_module.add_class(SelectOneOp);
  SelectOneOp = _es6_module.add_export('SelectOneOp', SelectOneOp);
  class ToggleSelectAllOp extends SelectOpBase {
     constructor() {
      super(undefined, undefined, "Toggle Select All");
    }
    static  tooldef() {
      return {uiname: "Toggle Select All", 
     apiname: "spline.toggle_select_all", 
     icon: Icons.TOGGLE_SEL_ALL, 
     inputs: ToolOp.inherit({})}
    }
     undo_pre(ctx) {
      super.undo_pre(ctx);
      redraw_viewport();
    }
     exec(ctx) {
      console.log("toggle select!");
      let spline=ctx.spline;
      let mode=this.inputs.mode.get_data();
      let layerid=ctx.spline.layerset.active.id;
      let totsel=0.0;
      let iterctx=mode===SelOpModes.AUTO ? {edit_all_layers: false} : ctx;
      if (mode===SelOpModes.AUTO) {
          for (let v of spline.verts.editable(iterctx)) {
              totsel+=v.flag&SplineFlags.SELECT;
          }
          for (let s of spline.segments.editable(iterctx)) {
              totsel+=s.flag&SplineFlags.SELECT;
          }
          for (let f of spline.faces.editable(iterctx)) {
              totsel+=f.flag&SplineFlags.SELECT;
          }
          mode = totsel ? SelOpModes.DESELECT : SelOpModes.SELECT;
      }
      console.log("MODE", mode);
      if (mode===SelOpModes.DESELECT)
        spline.verts.active = undefined;
      for (let v of spline.verts.editable(iterctx)) {
          v.flag|=SplineFlags.REDRAW;
          if (mode===SelOpModes.DESELECT) {
              spline.setselect(v, false);
          }
          else {
            spline.setselect(v, true);
          }
      }
      for (let s of spline.segments.editable(iterctx)) {
          s.flag|=SplineFlags.REDRAW;
          if (mode===SelOpModes.DESELECT) {
              spline.setselect(s, false);
          }
          else {
            spline.setselect(s, true);
          }
      }
      for (let f of spline.faces.editable(iterctx)) {
          f.flag|=SplineFlags.REDRAW;
          if (mode===SelOpModes.DESELECT) {
              spline.setselect(f, false);
          }
          else {
            spline.setselect(f, true);
          }
      }
    }
  }
  _ESClass.register(ToggleSelectAllOp);
  _es6_module.add_class(ToggleSelectAllOp);
  ToggleSelectAllOp = _es6_module.add_export('ToggleSelectAllOp', ToggleSelectAllOp);
  class SelectLinkedOp extends SelectOpBase {
     constructor(mode, datamode) {
      super(datamode);
      if (mode!=undefined)
        this.inputs.mode.setValue(mode);
    }
    static  tooldef() {
      return {uiname: "Select Linked", 
     apiname: "spline.select_linked", 
     inputs: ToolOp.inherit({vertex_eid: new IntProperty(-1)})}
    }
     undo_pre(ctx) {
      super.undo_pre(ctx);
      window.redraw_viewport();
    }
     exec(ctx) {
      let spline=ctx.spline;
      let v=spline.eidmap[this.inputs.vertex_eid.data];
      if (v==undefined) {
          console.trace("Error in SelectLinkedOp");
          return ;
      }
      let state=this.inputs.mode.get_data()!=SelOpModes.AUTO ? 1 : 0;
      let visit=new set();
      let verts=spline.verts;
      function recurse(v) {
        visit.add(v);
        verts.setselect(v, state);
        for (let i=0; i<v.segments.length; i++) {
            let seg=v.segments[i], v2=seg.other_vert(v);
            if (!visit.has(v2)) {
                recurse(v2);
            }
        }
      }
      recurse(v);
      spline.select_flush(this.inputs.datamode.data);
    }
  }
  _ESClass.register(SelectLinkedOp);
  _es6_module.add_class(SelectLinkedOp);
  SelectLinkedOp = _es6_module.add_export('SelectLinkedOp', SelectLinkedOp);
  class HideOp extends SelectOpBase {
     constructor(mode, ghost) {
      super(undefined, undefined, "Hide");
      if (mode!=undefined)
        this.inputs.selmode.setValue(mode);
      if (ghost!=undefined)
        this.inputs.ghost.setValue(ghost);
    }
    static  tooldef() {
      return {apiname: "spline.hide", 
     uiname: "Hide", 
     inputs: ToolOp.inherit({selmode: new IntProperty(1|2), 
      ghost: new BoolProperty(false)}), 
     outputs: ToolOp.inherit({})}
    }
     undo_pre(ctx) {
      super.undo_pre(ctx);
      window.redraw_viewport();
    }
     undo(ctx) {
      let ud=this._undo;
      let spline=ctx.spline;
      for (let i=0; i<ud.length; i++) {
          let e=spline.eidmap[ud[i]];
          e.flag&=~(SplineFlags.HIDE|SplineFlags.GHOST);
      }
      super.undo(ctx);
      window.redraw_viewport();
    }
     exec(ctx) {
      let spline=ctx.spline;
      let mode=this.inputs.selmode.data;
      let ghost=this.inputs.ghost.data;
      let layer=spline.layerset.active;
      for (let elist of spline.elists) {
          if (!(elist.type&mode))
            continue;
          for (let e of elist.selected) {
              if (!(layer.id in e.layers))
                continue;
              e.sethide(true);
              if (ghost) {
                  e.flag|=SplineFlags.GHOST;
              }
              elist.setselect(e, false);
          }
      }
      spline.clear_selection();
      spline.validate_active();
    }
  }
  _ESClass.register(HideOp);
  _es6_module.add_class(HideOp);
  HideOp = _es6_module.add_export('HideOp', HideOp);
  class UnhideOp extends ToolOp {
     constructor(mode, ghost) {
      super(undefined, "Unhide");
      if (mode!=undefined)
        this.inputs.selmode.setValue(mode);
      if (ghost!=undefined)
        this.inputs.ghost.setValue(ghost);
      this._undo = undefined;
    }
    static  tooldef() {
      return {apiname: "spline.unhide", 
     uiname: "Unhide", 
     inputs: ToolOp.inherit({selmode: new IntProperty(1|2), 
      ghost: new BoolProperty(false)}), 
     outputs: ToolOp.inherit({})}
    }
     undo_pre(ctx) {
      let ud=this._undo = [];
      let spline=ctx.spline;
      for (let elist of spline.elists) {
          for (let e of elist) {
              if (e.flag&SplineFlags.HIDE) {
                  ud.push(e.eid);
                  ud.push(e.flag&(SplineFlags.SELECT|SplineFlags.HIDE|SplineFlags.GHOST));
              }
          }
      }
      window.redraw_viewport();
    }
     undo(ctx) {
      let ud=this._undo;
      let spline=ctx.spline;
      let i=0;
      while (i<ud.length) {
        let e=spline.eidmap[ud[i++]];
        let flag=ud[i++];
        e.flag|=flag;
        if (flag&SplineFlags.SELECT)
          spline.setselect(e, selstate);
      }
      window.redraw_viewport();
    }
     exec(ctx) {
      let spline=ctx.spline;
      let layer=spline.layerset.active;
      let mode=this.inputs.selmode.data;
      let ghost=this.inputs.ghost.data;
      for (let elist of spline.elists) {
          if (!(mode&elist.type))
            continue;
          for (let e of elist) {
              if (!(layer.id in e.layers))
                continue;
              if (!ghost&&(e.flag&SplineFlags.GHOST))
                continue;
              let was_hidden=e.flag&SplineFlags.HIDE;
              e.flag&=~(SplineFlags.HIDE|SplineFlags.GHOST);
              e.sethide(false);
              if (was_hidden)
                spline.setselect(e, true);
          }
      }
    }
  }
  _ESClass.register(UnhideOp);
  _es6_module.add_class(UnhideOp);
  UnhideOp = _es6_module.add_export('UnhideOp', UnhideOp);
  var CollectionProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'CollectionProperty');
  var ElementRefSet=es6_import_item(_es6_module, '../../curve/spline_types.js', 'ElementRefSet');
  let _last_radius=45;
  class CircleSelectOp extends SelectOpBase {
     constructor(datamode, do_flush=true) {
      super(datamode, do_flush, "Circle Select");
      if (isNaN(_last_radius)||_last_radius<=0)
        _last_radius = 45;
      this.mpos = new Vector3();
      this.mdown = false;
      this.sel_or_unsel = true;
      this.radius = _last_radius;
    }
    static  tooldef() {
      return {apiname: "view2d.circle_select", 
     uiname: "Circle Select", 
     inputs: ToolOp.inherit({add_elements: new CollectionProperty(new ElementRefSet(SplineTypes.ALL), [SplineVertex, SplineSegment, SplineFace], "elements", "Elements", "Elements"), 
      sub_elements: new CollectionProperty(new ElementRefSet(SplineTypes.ALL), [SplineVertex, SplineSegment, SplineFace], "elements", "Elements", "Elements")}), 
     outputs: ToolOp.inherit({}), 
     icon: Icons.CIRCLE_SEL, 
     is_modal: true, 
     description: "Select in a circle.\nRight click to deselect."}
    }
     start_modal(ctx) {
      this.radius = _last_radius;
      let mpos=ctx.view2d.mpos;
      if (mpos!=undefined)
        this.on_mousemove({x: mpos[0], 
     y: mpos[1]});
    }
     on_mousewheel(e) {
      let dt=e.deltaY;
      dt*=0.2;
      console.log("wheel", e, dt);
      this.radius = Math.max(Math.min(this.radius+dt, 1024), 3.0);
      this._draw_circle();
    }
     _draw_circle() {
      let ctx=this.modal_ctx;
      let editor=ctx.view2d;
      this.reset_drawlines();
      let steps=64;
      let t=-Math.PI, dt=(Math.PI*2.0)/steps;
      let lastco=new Vector3();
      let co=new Vector3();
      let mpos=new Vector3(editor.getLocalMouse(this.mpos[0], this.mpos[1]));
      let radius=this.radius;
      for (let i=0; i<steps+1; i++, t+=dt) {
          co[0] = sin(t)*radius+mpos[0];
          co[1] = cos(t)*radius+mpos[1];
          if (i>0) {
              let dl=this.new_drawline(lastco, co);
          }
          lastco.load(co);
      }
      window.redraw_viewport();
    }
     exec(ctx) {
      let spline=ctx.spline;
      let eset_add=this.inputs.add_elements;
      let eset_sub=this.inputs.sub_elements;
      eset_add.ctx = ctx;
      eset_sub.ctx = ctx;
      eset_add.data.ctx = ctx;
      eset_sub.data.ctx = ctx;
      for (let e of eset_add) {
          spline.setselect(e, true);
      }
      for (let e of eset_sub) {
          spline.setselect(e, false);
      }
      if (this.inputs.flush.data) {
          spline.select_flush(this.inputs.datamode.data);
      }
    }
     do_sel(sel_or_unsel) {
      let datamode=this.inputs.datamode.data;
      let ctx=this.modal_ctx, spline=ctx.spline;
      let editor=ctx.view2d;
      let co=new Vector3();
      let mpos=new Vector3(editor.getLocalMouse(this.mpos[0], this.mpos[1]));
      let scale=editor.rendermat.$matrix.m11;
      mpos[2] = 0.0;
      console.warn(scale);
      let eset_add=this.inputs.add_elements.data;
      let eset_sub=this.inputs.sub_elements.data;
      let actlayer=spline.layerset.active.id;
      if (datamode&SplineTypes.VERTEX) {
          for (let i=0; i<2; i++) {
              if (i&&!(datamode&SplineTypes.HANDLE))
                break;
              let list=i ? spline.handles : spline.verts;
              for (let v of list.editable(ctx)) {
                  co.load(v);
                  co[2] = 0.0;
                  editor.project(co);
                  if (co.vectorDistance(mpos)<this.radius) {
                      if (sel_or_unsel) {
                          eset_sub.remove(v);
                          eset_add.add(v);
                      }
                      else {
                        eset_add.remove(v);
                        eset_sub.add(v);
                      }
                  }
              }
          }
      }
      if (datamode&SplineTypes.SEGMENT) {
      }
      if (datamode&SplineTypes.FACE) {
      }
    }
     on_mousemove(event) {
      let ctx=this.modal_ctx;
      let spline=ctx.spline;
      let editor=ctx.view2d;
      this.mpos[0] = event.x;
      this.mpos[1] = event.y;
      this._draw_circle();
      if (this.inputs.mode.getValue()!==SelOpModes.AUTO) {
          this.sel_or_unsel = this.inputs.mode.getValue()===SelOpModes.SELECT;
      }
      if (this.mdown) {
          this.do_sel(this.sel_or_unsel);
          window.redraw_viewport();
      }
      this.exec(ctx);
    }
     end_modal(ctx) {
      super.end_modal(ctx);
      _last_radius = this.radius;
    }
     on_keydown(event) {
      console.log(event.keyCode);
      let ctx=this.modal_ctx;
      let spline=ctx.spline;
      let view2d=ctx.view2d;
      let radius_inc=10;
      switch (event.keyCode) {
        case charmap["="]:
        case charmap["NumPlus"]:
          this.radius+=radius_inc;
          this._draw_circle();
          break;
        case charmap["-"]:
        case charmap["NumMinus"]:
          this.radius-=radius_inc;
          this._draw_circle();
          break;
        case charmap["Escape"]:
        case charmap["Enter"]:
        case charmap["Space"]:
          this.end_modal();
          break;
      }
    }
     on_mousedown(event) {
      let auto=this.inputs.mode.get_data()==SelOpModes.AUTO;
      console.log("auto", auto);
      if (auto) {
          this.sel_or_unsel = (event.button==0)^event.shiftKey;
      }
      this.mdown = true;
    }
     on_mouseup(event) {
      console.log("modal end!");
      this.mdown = false;
      this.end_modal();
    }
  }
  _ESClass.register(CircleSelectOp);
  _es6_module.add_class(CircleSelectOp);
  CircleSelectOp = _es6_module.add_export('CircleSelectOp', CircleSelectOp);
}, '/dev/fairmotion/src/editors/viewport/spline_selectops.js');
es6_module_define('spline_createops', ["../../core/toolops_api.js", "../../curve/spline.js", "../../core/toolprops.js", "../../curve/spline_types.js", "./spline_editops.js"], function _spline_createops_module(_es6_module) {
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var EnumProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'EnumProperty');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var Vec3Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec4Property');
  var StringProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'StringProperty');
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  var RestrictFlags=es6_import_item(_es6_module, '../../curve/spline.js', 'RestrictFlags');
  var SplineLocalToolOp=es6_import_item(_es6_module, './spline_editops.js', 'SplineLocalToolOp');
  var ExtrudeModes={SMOOTH: 0, 
   LESS_SMOOTH: 1, 
   BROKEN: 2}
  ExtrudeModes = _es6_module.add_export('ExtrudeModes', ExtrudeModes);
  class ExtrudeVertOp extends SplineLocalToolOp {
     constructor(co, mode) {
      super();
      if (co!==undefined)
        this.inputs.location.setValue(co);
      if (mode!==undefined) {
          this.inputs.mode.setValue(mode);
      }
    }
    static  tooldef() {
      return {uiname: "Extrude Path", 
     apiname: "spline.extrude_verts", 
     inputs: {location: new Vec3Property(undefined, "location", "location"), 
      linewidth: new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500]), 
      mode: new EnumProperty(ExtrudeModes.SMOOTH, ExtrudeModes, "extrude_mode", "Smooth Mode"), 
      stroke: new Vec4Property([0, 0, 0, 1])}, 
     outputs: {vertex: new IntProperty(-1, "vertex", "vertex", "new vertex")}, 
     icon: -1, 
     is_modal: false, 
     description: "Add points to path"}
    }
     can_call(ctx) {
      return !(ctx.spline.restrict&RestrictFlags.NO_EXTRUDE);
    }
     exec(ctx) {
      console.log("Extrude vertex op");
      var spline=ctx.spline;
      var layer=spline.layerset.active;
      var max_z=1;
      for (var f of spline.faces) {
          if (!(layer.id in f.layers))
            continue;
          max_z = Math.max(f.z, max_z);
      }
      var max_z_seg=max_z+1;
      for (var s of spline.segments) {
          if (!(layer.id in s.layers))
            continue;
          max_z_seg = Math.max(max_z_seg, s.z);
      }
      var co=this.inputs.location.data;
      console.log("co", co);
      var actvert=spline.verts.active;
      for (var i=0; i<spline.verts.length; i++) {
          var v=spline.verts[i];
          spline.verts.setselect(v, false);
      }
      var start_eid=spline.idgen.cur_id;
      var v=spline.make_vertex(co);
      console.log("v", v);
      var smode=this.inputs.mode.get_value();
      if (smode==ExtrudeModes.LESS_SMOOTH)
        v.flag|=SplineFlags.BREAK_CURVATURES;
      else 
        if (smode==ExtrudeModes.BROKEN)
        v.flag|=SplineFlags.BREAK_TANGENTS;
      this.outputs.vertex.setValue(v.eid);
      spline.verts.setselect(v, true);
      if (actvert!==v&&actvert!=undefined&&!actvert.hidden&&!((spline.restrict&RestrictFlags.VALENCE2)&&actvert.segments.length>=2)) {
          if (actvert.segments.length==2) {
              var v2=actvert;
              var h1=v2.segments[0].handle(v2), h2=v2.segments[1].handle(v2);
              spline.connect_handles(h1, h2);
              h1.flag|=SplineFlags.AUTO_PAIRED_HANDLE;
              h2.flag|=SplineFlags.AUTO_PAIRED_HANDLE;
              h1.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
              h2.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
          }
          var seg=spline.make_segment(actvert, v);
          seg.z = max_z_seg;
          console.log("creating segment");
          if (actvert.segments.length>1) {
              var seg2=actvert.segments[0];
              seg.mat.load(seg2.mat);
          }
          else {
            seg.mat.linewidth = this.inputs.linewidth.data;
            var color=this.inputs.stroke.data;
            for (var i=0; i<4; i++) {
                seg.mat.strokecolor[i] = color[i];
            }
          }
          v.flag|=SplineFlags.UPDATE;
          actvert.flag|=SplineFlags.UPDATE;
      }
      spline.verts.active = v;
      spline.regen_render();
    }
  }
  _ESClass.register(ExtrudeVertOp);
  _es6_module.add_class(ExtrudeVertOp);
  ExtrudeVertOp = _es6_module.add_export('ExtrudeVertOp', ExtrudeVertOp);
  class CreateEdgeOp extends SplineLocalToolOp {
     constructor(linewidth) {
      super();
      if (linewidth!=undefined)
        this.inputs.linewidth.setValue(linewidth);
    }
    static  tooldef() {
      return {uiname: "Make Segment", 
     apiname: "spline.make_edge", 
     inputs: {linewidth: new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500])}, 
     outputs: {}, 
     icon: Icons.MAKE_SEGMENT, 
     is_modal: false, 
     description: "Create segment between two selected points"}
    }
     can_call(ctx) {
      return !(ctx.spline.restrict&RestrictFlags.NO_CONNECT);
    }
     exec(ctx) {
      console.log("create edge op!");
      var spline=ctx.spline;
      var sels=[];
      var max_z=1;
      for (var f of spline.faces) {
          max_z = Math.max(f.z, max_z);
      }
      var max_z_seg=max_z+1;
      for (var s of spline.segments) {
          max_z_seg = Math.max(max_z_seg, s.z);
      }
      for (var i=0; i<spline.verts.length; i++) {
          var v=spline.verts[i];
          if (v.hidden)
            continue;
          if (!(v.flag&SplineFlags.SELECT))
            continue;
          sels.push(v);
      }
      if (sels.length!=2)
        return ;
      sels[0].flag|=SplineFlags.UPDATE;
      sels[1].flag|=SplineFlags.UPDATE;
      var seg=spline.make_segment(sels[0], sels[1]);
      seg.z = max_z_seg;
      seg.mat.linewidth = this.inputs.linewidth.data;
      spline.regen_render();
    }
  }
  _ESClass.register(CreateEdgeOp);
  _es6_module.add_class(CreateEdgeOp);
  CreateEdgeOp = _es6_module.add_export('CreateEdgeOp', CreateEdgeOp);
  class CreateEdgeFaceOp extends SplineLocalToolOp {
     constructor(linewidth) {
      super();
      if (linewidth!=undefined)
        this.inputs.linewidth.setValue(linewidth);
    }
    static  tooldef() {
      return {uiname: "Make Polygon", 
     apiname: "spline.make_edge_face", 
     inputs: {linewidth: new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500])}, 
     outputs: {}, 
     icon: Icons.MAKE_POLYGON, 
     is_modal: false, 
     description: "Create polygon from selected points"}
    }
     can_call(ctx) {
      return !(ctx.spline.restrict&RestrictFlags.NO_CONNECT);
    }
     exec(ctx) {
      console.log("create edge op!");
      var spline=ctx.spline;
      var layer=spline.layerset.active;
      var sels=[];
      var max_z=1;
      for (var f of spline.faces) {
          if (!(layer.id in f.layers))
            continue;
          max_z = Math.max(f.z, max_z);
      }
      var max_z_seg=max_z+1;
      for (var s of spline.segments) {
          if (!(layer.id in s.layers))
            continue;
          max_z_seg = Math.max(max_z_seg, s.z);
      }
      var vs=[];
      var valmap={};
      var vset=new set();
      var doneset=new set();
      function walk(v) {
        var stack=[v];
        var path=[];
        if (doneset.has(v))
          return path;
        if (!vset.has(v))
          return path;
        while (stack.length>0) {
          var v=stack.pop();
          if (doneset.has(v))
            break;
          path.push(v);
          doneset.add(v);
          if (valmap[v.eid]>2)
            break;
          for (var i=0; i<v.segments.length; i++) {
              var v2=v.segments[i].other_vert(v);
              if (!doneset.has(v2)&&vset.has(v2)) {
                  stack.push(v2);
              }
          }
        }
        return path;
      }
      for (var v of spline.verts.selected) {
          if (v.hidden)
            continue;
          v.flag|=SplineFlags.UPDATE;
          vs.push(v);
          vset.add(v);
      }
      for (var v of vset) {
          var valence=0;
          console.log("============", v);
          for (var i=0; i<v.segments.length; i++) {
              var v2=v.segments[i].other_vert(v);
              console.log(v.eid, v2.segments[0].v1.eid, v2.segments[0].v2.eid);
              if (vset.has(v2))
                valence++;
          }
          valmap[v.eid] = valence;
      }
      console.log("VS.LENGTH", vs.length);
      if (vs.length==2) {
          var v=vs[0].segments.length>0 ? vs[0] : vs[1];
          var seg2=v.segments.length>0 ? v.segments[0] : undefined;
          var e=spline.make_segment(vs[0], vs[1]);
          if (seg2!=undefined) {
              e.mat.load(seg2.mat);
          }
          else {
            e.mat.linewidth = this.inputs.linewidth.data;
          }
          e.z = max_z_seg;
          spline.regen_render();
          return ;
      }
      else 
        if (vs.length==3) {
          var f=spline.make_face([vs]);
          f.z = max_z+1;
          max_z++;
          spline.regen_sort();
          spline.faces.setselect(f, true);
          spline.set_active(f);
          spline.regen_render();
          return ;
      }
      for (var v of vset) {
          if (valmap[v.eid]!=1)
            continue;
          var path=walk(v);
          if (path.length>2) {
              var f=spline.make_face([path]);
              f.z = max_z+1;
              max_z++;
              spline.regen_sort();
              spline.faces.setselect(f, true);
              spline.set_active(f);
              spline.regen_render();
          }
      }
      for (var v of vset) {
          var path=walk(v);
          if (path.length>2) {
              var f=spline.make_face([path]);
              f.z = max_z+1;
              max_z++;
              spline.regen_sort();
              spline.faces.setselect(f, true);
              spline.set_active(f);
              spline.regen_render();
          }
      }
      spline.regen_render();
    }
  }
  _ESClass.register(CreateEdgeFaceOp);
  _es6_module.add_class(CreateEdgeFaceOp);
  CreateEdgeFaceOp = _es6_module.add_export('CreateEdgeFaceOp', CreateEdgeFaceOp);
  class ImportJSONOp extends ToolOp {
     constructor(str) {
      super();
      if (str!==undefined) {
          this.inputs.strdata.setValue(str);
      }
    }
    static  tooldef() {
      return {uiname: "Import Old JSON", 
     apiname: "editor.import_old_json", 
     inputs: {strdata: new StringProperty("", "JSON", "JSON", "JSON string data")}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     description: "Import old json files"}
    }
     can_call(ctx) {
      return !(ctx.spline.restrict&RestrictFlags.NO_CONNECT);
    }
     exec(ctx) {
      console.log("import json spline op!");
      var spline=ctx.spline;
      var obj=JSON.parse(this.inputs.strdata.data);
      spline.import_json(obj);
      spline.regen_render();
    }
  }
  _ESClass.register(ImportJSONOp);
  _es6_module.add_class(ImportJSONOp);
  ImportJSONOp = _es6_module.add_export('ImportJSONOp', ImportJSONOp);
}, '/dev/fairmotion/src/editors/viewport/spline_createops.js');
es6_module_define('spline_editops', ["../../core/toolops_api.js", "../../curve/spline_types.js", "../../core/frameset.js", "../../curve/spline.js", "../../core/animdata.js", "../../curve/spline_draw.js", "../../core/toolprops.js", "../../curve/spline_base.js", "../../path.ux/scripts/util/struct.js"], function _spline_editops_module(_es6_module) {
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  var CollectionProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'CollectionProperty');
  var BoolProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'BoolProperty');
  var TPropFlags=es6_import_item(_es6_module, '../../core/toolprops.js', 'TPropFlags');
  var StringProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'StringProperty');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ModalStates');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var RecalcFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'RecalcFlags');
  var RestrictFlags=es6_import_item(_es6_module, '../../curve/spline.js', 'RestrictFlags');
  var Spline=es6_import_item(_es6_module, '../../curve/spline.js', 'Spline');
  var VDAnimFlags=es6_import_item(_es6_module, '../../core/frameset.js', 'VDAnimFlags');
  var TPropFlags=es6_import_item(_es6_module, '../../core/toolprops.js', 'TPropFlags');
  es6_import(_es6_module, '../../path.ux/scripts/util/struct.js');
  var redo_draw_sort=es6_import_item(_es6_module, '../../curve/spline_draw.js', 'redo_draw_sort');
  class KeyCurrentFrame extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {apiname: "spline.key_current_frame", 
     uiname: "Key Selected", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false}
    }
     exec(ctx) {
      for (var v of ctx.frameset.spline.verts.selected.editable(ctx)) {
          v.flag|=SplineFlags.FRAME_DIRTY;
      }
      ctx.frameset.update_frame();
      ctx.frameset.pathspline.resolve = 1;
      ctx.frameset.pathspline.regen_sort();
      ctx.frameset.pathspline.solve();
    }
  }
  _ESClass.register(KeyCurrentFrame);
  _es6_module.add_class(KeyCurrentFrame);
  KeyCurrentFrame = _es6_module.add_export('KeyCurrentFrame', KeyCurrentFrame);
  class ShiftLayerOrderOp extends ToolOp {
     constructor(layer_id, off) {
      super();
      if (layer_id!=undefined) {
          this.inputs.layer_id.setValue(layer_id);
      }
      if (off!=undefined) {
          this.inputs.off.setValue(off);
      }
    }
    static  tooldef() {
      return {uiname: "Shift Layer Order", 
     apiname: "spline.shift_layer_order", 
     inputs: {layer_id: new IntProperty(0), 
      off: new IntProperty(1), 
      spline_path: new StringProperty("frameset.drawspline")}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false}
    }
     exec(ctx) {
      var spline=ctx.api.getValue(ctx, this.inputs.spline_path.data);
      var layer=this.inputs.layer_id.data;
      layer = spline.layerset.idmap[layer];
      if (layer==undefined)
        return ;
      var off=this.inputs.off.data;
      spline.layerset.change_layer_order(layer, layer.order+off);
      spline.regen_sort();
    }
  }
  _ESClass.register(ShiftLayerOrderOp);
  _es6_module.add_class(ShiftLayerOrderOp);
  ShiftLayerOrderOp = _es6_module.add_export('ShiftLayerOrderOp', ShiftLayerOrderOp);
  class SplineGlobalToolOp extends ToolOp {
     constructor(apiname, uiname, description, icon) {
      super(apiname, uiname, description, icon);
    }
  }
  _ESClass.register(SplineGlobalToolOp);
  _es6_module.add_class(SplineGlobalToolOp);
  SplineGlobalToolOp = _es6_module.add_export('SplineGlobalToolOp', SplineGlobalToolOp);
  class SplineLocalToolOp extends ToolOp {
     constructor(apiname, uiname, description, icon) {
      super(apiname, uiname, description, icon);
    }
     undo_pre(ctx) {
      var spline=ctx.spline;
      var data=[];
      istruct.write_object(data, spline);
      data = new DataView(new Uint8Array(data).buffer);
      this._undo = {data: data};
      window.redraw_viewport();
    }
     undo(ctx) {
      var spline=ctx.spline;
      var spline2=istruct.read_object(this._undo.data, Spline);
      var idgen=spline.idgen;
      var is_anim_path=spline.is_anim_path;
      for (var k in spline2) {
          if (typeof k==="symbol")
            continue;
          if (k==="inputs"||k==="outputs"||k.startsWith("dag_")) {
              continue;
          }
          spline[k] = spline2[k];
      }
      var max_cur=spline.idgen.cur_id;
      spline.idgen = idgen;
      if (is_anim_path!==undefined)
        spline.is_anim_path = is_anim_path;
      console.log("Restoring IDGen; max_cur:", max_cur, "current max:", spline.idgen.cur_id);
      idgen.max_cur(max_cur-1);
    }
  }
  _ESClass.register(SplineLocalToolOp);
  _es6_module.add_class(SplineLocalToolOp);
  SplineLocalToolOp = _es6_module.add_export('SplineLocalToolOp', SplineLocalToolOp);
  class KeyEdgesOp extends SplineLocalToolOp {
    
     constructor() {
      super();
      this.uiname = "Key Edges";
    }
    static  tooldef() {
      return {uiname: "Key Edges", 
     apiname: "spline.key_edges", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false}
    }
     can_call(ctx) {
      return ctx.spline===ctx.frameset.spline;
    }
     exec(ctx) {
      var prefix="frameset.drawspline.segments[";
      var frameset=ctx.frameset;
      var spline=frameset.spline;
      var edge_path_keys={z: 1};
      for (var s of spline.segments) {
          var path=prefix+s.eid+"]";
          for (var k in edge_path_keys) {
              path+="."+k;
          }
          ctx.api.setAnimPathKey(ctx, frameset, path, ctx.scene.time);
      }
    }
  }
  _ESClass.register(KeyEdgesOp);
  _es6_module.add_class(KeyEdgesOp);
  KeyEdgesOp = _es6_module.add_export('KeyEdgesOp', KeyEdgesOp);
  var pose_clipboards={}
  class CopyPoseOp extends SplineLocalToolOp {
     constructor() {
      super();
      this.undoflag|=UndoFlags.IGNORE_UNDO;
    }
    static  tooldef() {
      return {uiname: "Copy Pose", 
     apiname: "editor.copy_pose", 
     undoflag: UndoFlags.IGNORE_UNDO, 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false}
    }
     exec(ctx) {
      var lists=[ctx.spline.verts.selected.editable(ctx), ctx.spline.handles.selected.editable(ctx)];
      var pose_clipboard={};
      pose_clipboards[ctx.splinepath] = pose_clipboard;
      for (var i=0; i<2; i++) {
          for (var v of lists[i]) {
              pose_clipboard[v.eid] = new Vector3(v);
          }
      }
    }
  }
  _ESClass.register(CopyPoseOp);
  _es6_module.add_class(CopyPoseOp);
  CopyPoseOp = _es6_module.add_export('CopyPoseOp', CopyPoseOp);
  class PastePoseOp extends SplineLocalToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {uiname: "Paste Pose", 
     apiname: "editor.paste_pose", 
     inputs: {pose: new CollectionProperty([], undefined, "pose", "pose", "pose data", TPropFlags.COLL_LOOSE_TYPE)}, 
     outputs: {}, 
     icon: -1, 
     is_modal: true}
    }
     start_modal(ctx) {
      var spline=ctx.spline;
      var pose_clipboard=pose_clipboards[ctx.splinepath];
      if (pose_clipboard==undefined) {
          console.trace("No pose for splinepath", ctx.splinepath);
          this.end_modal(ctx);
          return ;
      }
      var array=[];
      for (var k in pose_clipboard) {
          var v=spline.eidmap[k];
          if (v==undefined) {
              console.trace("Bad vertex");
              continue;
          }
          var co=pose_clipboard[k];
          array.push(v.eid);
          array.push(co[0]);
          array.push(co[1]);
          array.push(co[2]);
      }
      this.inputs.pose.flag|=TPropFlags.COLL_LOOSE_TYPE;
      this.inputs.pose.setValue(array);
      this.exec(ctx);
    }
     exec(ctx) {
      var spline=ctx.spline;
      if (this.modal_running) {
          this.end_modal(this.modal_ctx);
      }
      var pose=this.inputs.pose.data;
      console.log("poselen", pose.length);
      var actlayer=spline.layerset.active;
      var i=0;
      while (i<pose.length) {
        var eid=pose[i++];
        var v=spline.eidmap[eid];
        if (v==undefined||v.type>2) {
            console.log("bad eid: eid, v:", eid, v);
            i+=3;
            continue;
        }
        var skip=!(v.flag&SplineFlags.SELECT);
        skip = skip||(v.flag&SplineFlags.HIDE);
        skip = skip||!(actlayer.id in v.layers);
        if (skip) {
            console.log("skipping vertex", eid);
            i+=3;
            continue;
        }
        console.log("loading. . .", v, eid, pose[i], pose[i+1], pose[i+2]);
        v[0] = pose[i++];
        v[1] = pose[i++];
        v[2] = pose[i++];
        v.flag|=SplineFlags.UPDATE;
        v.flag|=SplineFlags.FRAME_DIRTY;
      }
      spline.resolve = 1;
      spline.regen_sort();
    }
  }
  _ESClass.register(PastePoseOp);
  _es6_module.add_class(PastePoseOp);
  PastePoseOp = _es6_module.add_export('PastePoseOp', PastePoseOp);
  class InterpStepModeOp extends ToolOp {
     constructor() {
      super(undefined, "Toggle Step Mode", "Disable/enable smooth interpolation for animation paths");
    }
    static  tooldef() {
      return {uiname: "Toggle Step Mode", 
     apiname: "spline.toggle_step_mode", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     description: "Disable/enable smooth interpolation for animation paths"}
    }
     get_animverts(ctx) {
      var vds=new set();
      var spline=ctx.frameset.spline, pathspline=ctx.frameset.pathspline;
      var frameset=ctx.frameset;
      for (var v of spline.verts.selected.editable(ctx)) {
          var vd=frameset.vertex_animdata[v.eid];
          if (vd==undefined)
            continue;
          vds.add(vd);
      }
      return vds;
    }
     undo_pre(ctx) {
      var undo={};
      var pathspline=ctx.frameset.pathspline;
      for (var vd of this.get_animverts(ctx)) {
          undo[vd.eid] = vd.animflag;
      }
      this._undo = undo;
    }
     undo(ctx) {
      var undo=this._undo;
      var pathspline=ctx.frameset.pathspline;
      for (var vd of this.get_animverts(ctx)) {
          if (!(vd.eid in undo)) {
              console.log("ERROR in step function tool undo!!");
              continue;
          }
          vd.animflag = undo[vd.eid];
      }
    }
     exec(ctx) {
      var kcache=ctx.frameset.kcache;
      for (var vd of this.get_animverts(ctx)) {
          vd.animflag^=VDAnimFlags.STEP_FUNC;
          for (var v of vd.verts) {
              var time=get_vtime(v);
              kcache.invalidate(v.eid, time);
          }
      }
    }
  }
  _ESClass.register(InterpStepModeOp);
  _es6_module.add_class(InterpStepModeOp);
  InterpStepModeOp = _es6_module.add_export('InterpStepModeOp', InterpStepModeOp);
  class DeleteVertOp extends SplineLocalToolOp {
     constructor() {
      super();
    }
     can_call(ctx) {
      return !(ctx.spline.restrict&RestrictFlags.NO_DELETE);
    }
    static  tooldef() {
      return {uiname: "Delete Points/Segments", 
     apiname: "spline.delete_verts", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     description: "Remove points and segments"}
    }
     exec(ctx) {
      console.log("delete op!");
      var spline=ctx.spline;
      var dellist=[];
      for (var v of spline.verts.selected.editable(ctx)) {
          v.flag|=SplineFlags.UPDATE;
          dellist.push(v);
      }
      spline.propagate_update_flags();
      for (var i=0; i<dellist.length; i++) {
          console.log(dellist[i]);
          spline.kill_vertex(dellist[i]);
      }
      spline.regen_render();
    }
  }
  _ESClass.register(DeleteVertOp);
  _es6_module.add_class(DeleteVertOp);
  DeleteVertOp = _es6_module.add_export('DeleteVertOp', DeleteVertOp);
  class DeleteSegmentOp extends ToolOp {
     constructor() {
      super(undefined);
    }
    static  tooldef() {
      return {uiname: "Delete Segments", 
     apiname: "spline.delete_segments", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     description: "Remove segments"}
    }
     can_call(ctx) {
      return !(ctx.spline.restrict&RestrictFlags.NO_DELETE);
    }
     exec(ctx) {
      console.log("delete op!");
      var spline=ctx.spline;
      var dellist=[];
      for (var s of spline.segments.selected.editable(ctx)) {
          dellist.push(s);
      }
      for (var i=0; i<dellist.length; i++) {
          console.log(dellist[i]);
          spline.kill_segment(dellist[i]);
      }
      if (dellist.length>0) {
          for (var i=0; i<spline.segments.length; i++) {
              var s=spline.segments[i];
              s.flag|=SplineFlags.UPDATE;
          }
      }
      spline.regen_render();
    }
  }
  _ESClass.register(DeleteSegmentOp);
  _es6_module.add_class(DeleteSegmentOp);
  DeleteSegmentOp = _es6_module.add_export('DeleteSegmentOp', DeleteSegmentOp);
  class DeleteFaceOp extends SplineLocalToolOp {
     constructor() {
      super(undefined, "Delete Faces");
    }
    static  tooldef() {
      return {uiname: "Delete Faces", 
     apiname: "spline.delete_faces", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     description: "Remove faces"}
    }
     can_call(ctx) {
      return !(ctx.spline.restrict&RestrictFlags.NO_DELETE);
    }
     exec(ctx) {
      console.log("delete op!");
      var spline=ctx.spline;
      var vset=new set(), sset=new set(), fset=new set();
      var dellist=[];
      for (var f of spline.faces.selected.editable(ctx)) {
          fset.add(f);
      }
      for (var f of fset) {
          for (var path of f.paths) {
              for (var l of path) {
                  var l2=l.s.l;
                  var _c=0, del=true;
                  do {
                    if (_c++>1000) {
                        console.log("Infintite loop!");
                        break;
                    }
                    if (!fset.has(l2.f))
                      del = false;
                    l2 = l2.radial_next;
                  } while (l2!=l.s.l);
                  
                  if (del)
                    sset.add(l.s);
              }
          }
      }
      for (var s of sset) {
          for (var si=0; si<2; si++) {
              var del=true;
              var v=si ? s.v2 : s.v1;
              for (var i=0; i<v.segments.length; i++) {
                  if (!(sset.has(v.segments[i]))) {
                      del = false;
                      break;
                  }
              }
              if (del)
                vset.add(v);
          }
      }
      for (var f of fset) {
          spline.kill_face(f);
      }
      for (var s of sset) {
          spline.kill_segment(s);
      }
      for (var v of vset) {
          spline.kill_vertex(v);
      }
      spline.regen_render();
      window.redraw_viewport();
    }
  }
  _ESClass.register(DeleteFaceOp);
  _es6_module.add_class(DeleteFaceOp);
  DeleteFaceOp = _es6_module.add_export('DeleteFaceOp', DeleteFaceOp);
  class ChangeFaceZ extends SplineLocalToolOp {
     constructor(offset, selmode) {
      super(undefined);
      if (offset!=undefined)
        this.inputs.offset.setValue(offset);
      if (selmode!=undefined)
        this.inputs.selmode.setValue(selmode);
    }
    static  tooldef() {
      return {uiname: "Set Order", 
     apiname: "spline.change_face_z", 
     inputs: {offset: new IntProperty(1), 
      selmode: new IntProperty(SplineTypes.FACE)}, 
     outputs: {}, 
     icon: Icons.Z_UP, 
     is_modal: false, 
     description: "Change draw order of selected faces"}
    }
     can_call(ctx) {
      return 1;
    }
     exec(ctx) {
      var spline=ctx.spline;
      var off=this.inputs.offset.data;
      var selmode=this.inputs.selmode.data;
      if (isNaN(off))
        off = 0.0;
      console.log("change face z! selmode:", selmode, "off", off);
      if (selmode&SplineTypes.VERTEX) {
          selmode|=SplineTypes.SEGMENT;
      }
      if (selmode&SplineTypes.FACE) {
          for (var f of spline.faces.selected.editable(ctx)) {
              if (isNaN(f.z))
                f.z = 0.0;
              if (f.hidden)
                continue;
              f.z+=off;
          }
      }
      if (selmode&(SplineTypes.SEGMENT|SplineTypes.VERTEX)) {
          for (var s of spline.segments.selected.editable(ctx)) {
              if (isNaN(s.z))
                s.z = 0.0;
              if (s.hidden)
                continue;
              s.z+=off;
          }
      }
      spline.regen_sort();
      window.redraw_viewport();
    }
  }
  _ESClass.register(ChangeFaceZ);
  _es6_module.add_class(ChangeFaceZ);
  ChangeFaceZ = _es6_module.add_export('ChangeFaceZ', ChangeFaceZ);
  class DissolveVertOp extends SplineLocalToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {uiname: "Collapse Points", 
     apiname: "spline.dissolve_verts", 
     inputs: {verts: new CollectionProperty([], undefined, "verts", "verts"), 
      use_verts: new BoolProperty(false, "use_verts")}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     description: "Change draw order of selected faces"}
    }
     can_call(ctx) {
      return !(ctx.spline.restrict&RestrictFlags.NO_DISSOLVE);
    }
     exec(ctx) {
      var spline=ctx.spline;
      var dellist=[];
      var verts=spline.verts.selected.editable(ctx);
      if (this.inputs.use_verts.data) {
          verts = new set();
          for (var eid of this.inputs.verts.data) {
              verts.add(spline.eidmap[eid]);
          }
      }
      for (var v of verts) {
          if (v.segments.length!=2)
            continue;
          dellist.push(v);
      }
      for (var i=0; i<dellist.length; i++) {
          spline.dissolve_vertex(dellist[i]);
      }
      spline.regen_render();
    }
  }
  _ESClass.register(DissolveVertOp);
  _es6_module.add_class(DissolveVertOp);
  DissolveVertOp = _es6_module.add_export('DissolveVertOp', DissolveVertOp);
  function frameset_split_edge(ctx, spline, s, t) {
    if (t===undefined) {
        t = 0.5;
    }
    console.log("split edge op!");
    var interp_animdata=spline===ctx.frameset.spline;
    var frameset=interp_animdata ? ctx.frameset : undefined;
    if (interp_animdata) {
        console.log("interpolating animation data from adjacent vertices!");
    }
    var e_v=spline.split_edge(s, t);
    if (interp_animdata) {
        frameset.create_path_from_adjacent(e_v[1], e_v[0]);
    }
    spline.verts.setselect(e_v[1], true);
    spline.verts.active = e_v[1];
    spline.regen_sort();
    spline.regen_render();
    return e_v;
  }
  class SplitEdgeOp extends SplineGlobalToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {uiname: "Split Segments", 
     apiname: "spline.split_edges", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     description: "Split selected segments"}
    }
     can_call(ctx) {
      return !(ctx.spline.restrict&RestrictFlags.NO_SPLIT_EDGE);
    }
     exec(ctx) {
      console.log("split edge op!");
      var spline=ctx.spline;
      var interp_animdata=spline===ctx.frameset.spline;
      var frameset=interp_animdata ? ctx.frameset : undefined;
      console.log("interp_animdata: ", interp_animdata);
      var segs=[];
      if (interp_animdata) {
          console.log("interpolating animation data from adjacent vertices!");
      }
      for (var s of spline.segments.selected.editable(ctx)) {
          if (s.v1.hidden||s.v2.hidden)
            continue;
          if ((s.v1.flag&SplineFlags.SELECT&&s.v2.flag&SplineFlags.SELECT))
            segs.push(s);
      }
      for (var i=0; i<segs.length; i++) {
          let e_v=frameset_split_edge(ctx, spline, segs[i]);
          spline.verts.setselect(e_v[1], true);
      }
      spline.regen_render();
    }
  }
  _ESClass.register(SplitEdgeOp);
  _es6_module.add_class(SplitEdgeOp);
  SplitEdgeOp = _es6_module.add_export('SplitEdgeOp', SplitEdgeOp);
  class SplitEdgePickOp extends SplineGlobalToolOp {
    
     constructor() {
      super();
      this.mpos = new Vector2();
    }
    static  tooldef() {
      return {uiname: "Split Segment", 
     apiname: "spline.split_pick_edge", 
     inputs: {segment_eid: new IntProperty(-1, "segment_eid", "segment_eid", "segment_eid"), 
      segment_t: new FloatProperty(0, "segment_t", "segment_t", "segment_t"), 
      spline_path: new StringProperty("drawspline", "spline_path", "splien_path", "spline_path"), 
      deselect: new BoolProperty(true, "deselect", "deselect", "deselect")}, 
     outputs: {}, 
     icon: Icons.SPLIT_EDGE, 
     is_modal: true, 
     description: "Split picked segment"}
    }
     can_call(ctx) {
      return !(ctx.spline.restrict&RestrictFlags.NO_SPLIT_EDGE);
    }
     start_modal(ctx) {
      super.start_modal(ctx);
    }
     on_mousedown(e) {
      console.log("mdown", e);
      this.finish(e.button!=0);
    }
     on_mouseup(e) {
      console.log("mup");
      this.finish(e.button!=0);
    }
     end_modal(ctx) {
      this.reset_drawlines();
      super.end_modal(ctx);
    }
     on_keydown(event) {
      switch (event.keyCode) {
        case charmap["Enter"]:
        case charmap["Escape"]:
          this.finish(event.keyCode==charmap["Escape"]);
          break;
      }
    }
     on_mousemove(e) {
      let ctx=this.modal_ctx;
      let mpos=[e.x, e.y];
      this.mpos.load(mpos);
      let ret=ctx.view2d.editor.findnearest(mpos, SplineTypes.SEGMENT, 105);
      if (ret===undefined) {
          this.reset_drawlines();
          this.inputs.segment_eid.setValue(-1);
          return ;
      }
      let seg=ret[1];
      let spline=ret[0];
      if (spline===ctx.frameset.pathspline) {
          this.inputs.spline_path.setValue("pathspline");
      }
      else {
        this.inputs.spline_path.setValue("spline");
      }
      this.reset_drawlines(ctx);
      let steps=16;
      let ds=1.0/(steps-1), s=ds;
      let lastco=seg.evaluate(s);
      let view2d=ctx.view2d;
      let canvas=view2d.get_bg_canvas();
      for (let i=1; i<steps; i++, s+=ds) {
          let co=seg.evaluate(s);
          view2d.project(co);
          co[1] = canvas.height-co[1];
          this.new_drawline(lastco, co, [1, 0.3, 0.0, 1.0], 2);
          lastco = co;
      }
      this.inputs.segment_eid.setValue(seg.eid);
      this.inputs.segment_t.setValue(0.5);
      ctx.view2d.unproject(mpos);
      let p=seg.closest_point(mpos, ClosestModes.CLOSEST);
      if (p!==undefined) {
          this.inputs.segment_t.setValue(p[1]);
          p = new Vector2(p[0]);
          view2d.project(p);
          let y=canvas.height-p[1];
          let w=4;
          this.new_drawline([p[0]-w, y-w], [p[0]-w, y+w], "blue");
          this.new_drawline([p[0]-w, y+w], [p[0]+w, y+w], "blue");
          this.new_drawline([p[0]+w, y+w], [p[0]+w, y-w], "blue");
          this.new_drawline([p[0]+w, y-w], [p[0]-w, y-w], "blue");
      }
    }
     finish(do_cancel) {
      if (do_cancel||this.inputs.segment_eid.data==-1) {
          this.end_modal(this.modal_ctx);
          this.cancel_modal(this.modal_ctx);
      }
      else {
        this.exec(this.modal_ctx);
        this.end_modal(this.modal_ctx);
      }
    }
     exec(ctx) {
      var spline=this.inputs.spline_path.data;
      spline = spline=="pathspline" ? ctx.frameset.pathspline : ctx.frameset.spline;
      if (this.inputs.deselect.data) {
          spline.select_none(ctx, SplineTypes.ALL);
      }
      var seg=spline.eidmap[this.inputs.segment_eid.data];
      var t=this.inputs.segment_t.data;
      if (seg===undefined) {
          console.warn("Unknown segment", this.inputs.segment_eid.data);
          return ;
      }
      frameset_split_edge(ctx, spline, seg, t);
    }
  }
  _ESClass.register(SplitEdgePickOp);
  _es6_module.add_class(SplitEdgePickOp);
  SplitEdgePickOp = _es6_module.add_export('SplitEdgePickOp', SplitEdgePickOp);
  class VertPropertyBaseOp extends ToolOp {
     undo_pre(ctx) {
      var spline=ctx.spline;
      var vdata={};
      for (var v of spline.verts.selected.editable(ctx)) {
          vdata[v.eid] = v.flag;
      }
      this._undo = vdata;
      window.redraw_viewport();
    }
     undo(ctx) {
      var spline=ctx.spline;
      for (var k in this._undo) {
          var v=spline.eidmap[k];
          v.flag = this._undo[k];
          v.flag|=SplineFlags.UPDATE;
      }
      spline.resolve = 1;
    }
  }
  _ESClass.register(VertPropertyBaseOp);
  _es6_module.add_class(VertPropertyBaseOp);
  VertPropertyBaseOp = _es6_module.add_export('VertPropertyBaseOp', VertPropertyBaseOp);
  class ToggleBreakTanOp extends VertPropertyBaseOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {uiname: "Toggle Sharp Corners", 
     apiname: "spline.toggle_break_tangents", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     description: "Toggle Sharp Corners"}
    }
     exec(ctx) {
      var spline=ctx.spline;
      var actlayer=spline.layerset.active.id;
      for (var si=0; si<2; si++) {
          var list=si ? spline.handles : spline.verts;
          for (var v of list.selected.editable(ctx)) {
              if (v.type==SplineTypes.HANDLE&&!v.use)
                continue;
              if (v.type==SplineTypes.HANDLE&&(v.owning_vertex!=undefined&&(v.owning_vertex.flag&SplineFlags.SELECT))) {
                  if (v.owning_vertex.flag&SplineFlags.BREAK_TANGENTS)
                    v.flag|=SplineFlags.BREAK_TANGENTS;
                  else 
                    v.flag&=~SplineFlags.BREAK_TANGENTS;
              }
              v.flag^=SplineFlags.BREAK_TANGENTS;
              v.flag|=SplineFlags.UPDATE;
          }
      }
      spline.resolve = 1;
    }
  }
  _ESClass.register(ToggleBreakTanOp);
  _es6_module.add_class(ToggleBreakTanOp);
  ToggleBreakTanOp = _es6_module.add_export('ToggleBreakTanOp', ToggleBreakTanOp);
  class ToggleBreakCurvOp extends VertPropertyBaseOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {uiname: "Toggle Broken Curvatures", 
     apiname: "spline.toggle_break_curvature", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     description: "Toggle Break Curvatures, enable 'draw normals'\n in display panel to\n see what this does"}
    }
     exec(ctx) {
      var spline=ctx.spline;
      for (var v of spline.verts.selected.editable(ctx)) {
          v.flag^=SplineFlags.BREAK_CURVATURES;
          v.flag|=SplineFlags.UPDATE;
      }
      spline.resolve = 1;
    }
  }
  _ESClass.register(ToggleBreakCurvOp);
  _es6_module.add_class(ToggleBreakCurvOp);
  ToggleBreakCurvOp = _es6_module.add_export('ToggleBreakCurvOp', ToggleBreakCurvOp);
  class ConnectHandlesOp extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {uiname: "Connect Handles", 
     apiname: "spline.connect_handles", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     description: "Pairs adjacent handles together to make a smooth curve"}
    }
     exec(ctx) {
      var spline=ctx.spline;
      var h1=undefined, h2=undefined;
      for (var h of spline.handles.selected.editable(ctx)) {
          if (h1==undefined)
            h1 = h;
          else 
            if (h2==undefined)
            h2 = h;
          else 
            break;
      }
      if (h1==undefined||h2==undefined)
        return ;
      var s1=h1.segments[0], s2=h2.segments[0];
      if (s1.handle_vertex(h1)!=s2.handle_vertex(h2))
        return ;
      console.log("Connecting handles", h1.eid, h2.eid);
      h1.flag|=SplineFlags.AUTO_PAIRED_HANDLE;
      h2.flag|=SplineFlags.AUTO_PAIRED_HANDLE;
      h1.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      h2.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      var v=s1.handle_vertex(h1);
      v.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      spline.connect_handles(h1, h2);
      spline.resolve = 1;
    }
  }
  _ESClass.register(ConnectHandlesOp);
  _es6_module.add_class(ConnectHandlesOp);
  ConnectHandlesOp = _es6_module.add_export('ConnectHandlesOp', ConnectHandlesOp);
  class DisconnectHandlesOp extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {uiname: "Disconnect Handles", 
     apiname: "spline.disconnect_handles", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     description: "Disconnects all handles around a point.\n  Point must have more than two segments"}
    }
     exec(ctx) {
      var spline=ctx.spline;
      console.log("Disconnect handles");
      for (var h of spline.handles.selected.editable(ctx)) {
          var v=h.owning_segment.handle_vertex(h);
          if (h.hpair==undefined)
            continue;
          h.flag&=~SplineFlags.AUTO_PAIRED_HANDLE;
          h.hpair.flag&=~SplineFlags.AUTO_PAIRED_HANDLE;
          h.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
          h.hpair.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
          v.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
          spline.disconnect_handle(h);
          spline.resolve = 1;
      }
    }
  }
  _ESClass.register(DisconnectHandlesOp);
  _es6_module.add_class(DisconnectHandlesOp);
  DisconnectHandlesOp = _es6_module.add_export('DisconnectHandlesOp', DisconnectHandlesOp);
  class CurveRootFinderTest extends ToolOp {
     constructor() {
      super("curverootfinder", "curverootfinder", "curverootfinder");
    }
    static  tooldef() {
      return {uiname: "Test Closest Point Finder", 
     apiname: "spline._test_closest_points", 
     inputs: {}, 
     outputs: {}, 
     undoflag: UndoFlags.IGNORE_UNDO, 
     icon: -1, 
     is_modal: true, 
     description: "Test closest-point-to-curve functionality"}
    }
     on_mousemove(event) {
      var mpos=[event.x, event.y];
      var ctx=this.modal_ctx;
      var spline=ctx.spline;
      this.reset_drawlines();
      for (var seg of spline.segments) {
          var ret=seg.closest_point(mpos, 0);
          if (ret==undefined)
            continue;
          var dl=this.new_drawline(ret[0], mpos);
          dl.clr[3] = 0.1;
          continue;
          var ret=seg.closest_point(mpos, 3);
          for (var p of ret) {
              this.new_drawline(p[0], mpos);
          }
      }
    }
     end_modal() {
      this.reset_drawlines();
      this._end_modal();
    }
     on_mousedown(event) {
      this.end_modal();
    }
     on_keydown(event) {
      switch (event.keyCode) {
        case charmap["Enter"]:
        case charmap["Escape"]:
          this.end_modal();
          break;
      }
    }
  }
  _ESClass.register(CurveRootFinderTest);
  _es6_module.add_class(CurveRootFinderTest);
  CurveRootFinderTest = _es6_module.add_export('CurveRootFinderTest', CurveRootFinderTest);
  class AnimPlaybackOp extends ToolOp {
    
    
    
    
     constructor() {
      super();
      this.undoflag|=UndoFlags.IGNORE_UNDO;
      this.timer = undefined;
      this.time = 0;
      this.start_time = 0;
      this.done = false;
      this.on_solve_node = function () {
        console.log("on_solve callback triggered in AnimPLaybackOp");
        window.redraw_viewport();
        this.on_frame(this.modal_ctx);
      };
    }
    static  tooldef() {
      return {uiname: "Playback", 
     apiname: "editor.playback", 
     inputs: {}, 
     outputs: {}, 
     undoflag: UndoFlags.IGNORE_UNDO, 
     icon: -1, 
     is_modal: true, 
     description: "Play back animation"}
    }
     on_frame(ctx) {
      let this2=this;
      window.redraw_viewport().then(() =>        {
        if (this2.done) {
            return ;
        }
        console.log("frame!");
        console.log("playback op: change time");
        console.log("  time:", this2.time, this2);
        this2.time+=1.0;
        ctx.scene.change_time(ctx, this2.time);
      });
    }
     end_modal(ctx) {
      the_global_dag.remove(this.on_solve_node);
      g_app_state.set_modalstate(0);
      super.end_modal();
      if (this.timer!=undefined) {
          window.clearInterval(this.timer);
          this.timer = undefined;
      }
    }
     cancel(ctx) {

    }
     finish(ctx) {
      if (!this.done) {
          this.done = true;
          ctx.scene.change_time(ctx, this.start_time);
          window.redraw_viewport();
      }
    }
     on_mousemove(event) {

    }
     on_keydown(event) {
      switch (event.keyCode) {
        case charmap["Escape"]:
        case charmap["Return"]:
        case charmap["Space"]:
          this.finish(this.modal_ctx);
          this.end_modal();
      }
    }
     on_mouseup(event) {
      this.finish(this.modal_ctx);
      this.end_modal();
    }
     start_modal(ctx) {
      the_global_dag.link(ctx.frameset.spline, ["on_solve"], this.on_solve_node, "", this);
      g_app_state.set_modalstate(ModalStates.PLAYING);
      var this2=this;
      this.time = this.start_time = ctx.scene.time;
      this.on_frame(this.modal_ctx);
      if (0) {
          var last_time=time_ms();
          this.timer = window.setInterval(function () {
            if (time_ms()-last_time<41) {
                return ;
            }
            last_time = time_ms();
            this2.on_frame(this2.modal_ctx);
          }, 1);
      }
    }
  }
  _ESClass.register(AnimPlaybackOp);
  _es6_module.add_class(AnimPlaybackOp);
  AnimPlaybackOp = _es6_module.add_export('AnimPlaybackOp', AnimPlaybackOp);
  class ToggleManualHandlesOp extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {uiname: "Toggle Manual Handles", 
     apiname: "spline.toggle_manual_handles", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     description: "Toggle Manual Handles"}
    }
     undo_pre(ctx) {
      var spline=ctx.spline;
      var ud=this._undo = {};
      for (var v of spline.verts.selected.editable(ctx)) {
          ud[v.eid] = v.flag&SplineFlags.USE_HANDLES;
      }
    }
     undo(ctx) {
      var spline=ctx.spline;
      var ud=this._undo;
      for (var k in ud) {
          var v=spline.eidmap[k];
          if (v==undefined||v.type!=SplineTypes.VERTEX) {
              console.log("WARNING: bad v in toggle manual handles op's undo handler!", v);
              continue;
          }
          v.flag = (v.flag&~SplineFlags.USE_HANDLES)|ud[k]|SplineFlags.UPDATE;
      }
      spline.resolve = 1;
    }
     exec(ctx) {
      var spline=ctx.spline;
      for (var v of spline.verts.selected.editable(ctx)) {
          v.flag^=SplineFlags.USE_HANDLES;
          v.flag|=SplineFlags.UPDATE;
      }
      spline.resolve = 1;
    }
  }
  _ESClass.register(ToggleManualHandlesOp);
  _es6_module.add_class(ToggleManualHandlesOp);
  ToggleManualHandlesOp = _es6_module.add_export('ToggleManualHandlesOp', ToggleManualHandlesOp);
  var TimeDataLayer=es6_import_item(_es6_module, '../../core/animdata.js', 'TimeDataLayer');
  var get_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'set_vtime');
  var ClosestModes=es6_import_item(_es6_module, '../../curve/spline_base.js', 'ClosestModes');
  class ShiftTimeOp extends ToolOp {
    
     constructor() {
      super();
      this.start_mpos = new Vector3();
    }
    static  tooldef() {
      return {uiname: "Move Keyframes", 
     apiname: "spline.shift_time", 
     inputs: {factor: new FloatProperty(-1, "factor", "factor", "factor")}, 
     outputs: {}, 
     icon: -1, 
     is_modal: true, 
     description: "Move keyframes"}
    }
     get_curframe_animverts(ctx) {
      var vset=new set();
      var spline=ctx.frameset.spline, pathspline=ctx.frameset.pathspline;
      var frameset=ctx.frameset;
      for (var v of pathspline.verts.selected.editable(ctx)) {
          vset.add(v);
      }
      if (vset.length==0) {
          for (var v of spline.verts.selected.editable(ctx)) {
              var vd=frameset.vertex_animdata[v.eid];
              if (vd==undefined)
                continue;
              for (var v2 of vd.verts) {
                  var vtime=get_vtime(v2);
                  if (vtime==ctx.scene.time) {
                      vset.add(v2);
                  }
              }
          }
      }
      return vset;
    }
     start_modal(ctx) {
      this.first = true;
    }
     end_modal(ctx) {
      super.end_modal(ctx);
    }
     cancel(ctx) {

    }
     finish(ctx) {
      ctx.scene.change_time(ctx, this.start_time);
    }
     on_mousemove(event) {
      if (this.first) {
          this.start_mpos.load([event.x, event.y, 0]);
          this.first = false;
      }
      var mpos=new Vector3([event.x, event.y, 0]);
      var dx=-Math.floor((this.start_mpos[0]-mpos[0])/20+0.5);
      this.undo(this.modal_ctx);
      this.inputs.factor.setValue(dx);
      this.exec(this.modal_ctx);
      window.redraw_viewport();
    }
     on_keydown(event) {
      switch (event.keyCode) {
        case charmap["Escape"]:
          this.cancel(this.modal_ctx);
        case charmap["Return"]:
        case charmap["Space"]:
          this.finish(this.modal_ctx);
          this.end_modal();
      }
    }
     on_mouseup(event) {
      this.end_modal();
    }
     undo_pre(ctx) {
      var ud=this._undo = {};
      for (var v of this.get_curframe_animverts(ctx)) {
          ud[v.eid] = get_vtime(v);
      }
    }
     undo(ctx) {
      var spline=ctx.frameset.pathspline;
      for (var k in this._undo) {
          var v=spline.eidmap[k], time=this._undo[k];
          set_vtime(spline, v, time);
          v.dag_update("depend");
      }
      ctx.frameset.download();
    }
     exec(ctx) {
      var spline=ctx.frameset.pathspline;
      var starts={};
      var off=this.inputs.factor.data;
      var vset=this.get_curframe_animverts(ctx);
      for (var v of vset) {
          starts[v.eid] = get_vtime(v);
      }
      var kcache=ctx.frameset.kcache;
      for (var v of vset) {
          kcache.invalidate(v.eid, get_vtime(v));
          set_vtime(spline, v, starts[v.eid]+off);
          kcache.invalidate(v.eid, get_vtime(v));
          v.dag_update("depend");
      }
      for (var v of vset) {
          var min=undefined, max=undefined;
          if (v.segments.length==1) {
              var s=v.segments[0];
              var v2=s.other_vert(v);
              var t1=get_vtime(v), t2=get_vtime(v2);
              if (t1<t2) {
                  min = 0, max = t2;
              }
              else 
                if (t1==t2) {
                  min = max = t1;
              }
              else {
                min = t1, max = 100000;
              }
          }
          else 
            if (v.segments.length==2) {
              var v1=v.segments[0].other_vert(v);
              var v2=v.segments[1].other_vert(v);
              var t1=get_vtime(v1), t2=get_vtime(v2);
              min = Math.min(t1, t2), max = Math.max(t1, t2);
          }
          else {
            min = 0;
            max = 100000;
          }
          var newtime=get_vtime(v);
          newtime = Math.min(Math.max(newtime, min), max);
          set_vtime(spline, v, newtime);
          v.dag_update("depend");
      }
      ctx.frameset.download();
    }
  }
  _ESClass.register(ShiftTimeOp);
  _es6_module.add_class(ShiftTimeOp);
  ShiftTimeOp = _es6_module.add_export('ShiftTimeOp', ShiftTimeOp);
  class DuplicateOp extends SplineLocalToolOp {
     constructor() {
      super(undefined, "Duplicate");
    }
    static  tooldef() {
      return {uiname: "Duplicate Geometry", 
     apiname: "spline.duplicate", 
     inputs: {}, 
     outputs: {}, 
     icon: Icons.DUPLICATE, 
     is_modal: false, 
     description: "Make a duplicate of selected geometry."}
    }
     can_call(ctx) {
      return !(ctx.spline.restrict&RestrictFlags.NO_CREATE);
    }
     exec(ctx) {
      var vset=new set();
      var sset=new set();
      var fset=new set();
      var hset=new set();
      var spline=ctx.spline;
      var eidmap={};
      for (var v of spline.verts.selected.editable(ctx)) {
          vset.add(v);
      }
      for (var s of spline.segments.selected.editable(ctx)) {
          sset.add(s);
          vset.add(s.v1);
          vset.add(s.v2);
      }
      for (var f of spline.faces.selected.editable(ctx)) {
          fset.add(f);
          for (var path of f.paths) {
              for (var l of path) {
                  sset.add(l.s);
                  vset.add(l.s.v1);
                  vset.add(l.s.v2);
              }
          }
      }
      for (var v of vset) {
          var nv=spline.make_vertex(v);
          spline.copy_vert_data(nv, v);
          eidmap[v.eid] = nv;
          spline.verts.setselect(v, false);
          spline.verts.setselect(nv, true);
      }
      for (var s of sset) {
          var v1=eidmap[s.v1.eid], v2=eidmap[s.v2.eid];
          var ns=spline.make_segment(v1, v2);
          ns._aabb[0].load(s._aabb[0]);
          ns._aabb[1].load(s._aabb[1]);
          spline.copy_segment_data(ns, s);
          spline.copy_handle_data(ns.h1, s.h1);
          spline.copy_handle_data(ns.h2, s.h2);
          eidmap[s.h1.eid] = ns.h1;
          eidmap[s.h2.eid] = ns.h2;
          ns.h1.load(s.h1);
          ns.h2.load(s.h2);
          hset.add(s.h1);
          hset.add(s.h2);
          eidmap[ns.eid] = ns;
          spline.segments.setselect(s, false);
          spline.segments.setselect(ns, true);
          spline.handles.setselect(s.h1, false);
          spline.handles.setselect(s.h2, false);
          spline.handles.setselect(ns.h1, true);
          spline.handles.setselect(ns.h2, true);
      }
      for (var h of hset) {
          var nh=eidmap[h.eid];
          if (h.pair!=undefined&&h.pair.eid in eidmap) {
              spline.connect_handles(nh, eidmap[h.pair.eid]);
          }
      }
      for (var f of fset) {
          var vlists=[];
          for (var path of f.paths) {
              var verts=[];
              vlists.push(verts);
              for (var l of path) {
                  verts.push(eidmap[l.v.eid]);
              }
          }
          console.log("duplicate");
          var nf=spline.make_face(vlists);
          nf._aabb[0].load(f._aabb[0]);
          nf._aabb[1].load(f._aabb[1]);
          spline.copy_face_data(nf, f);
          spline.faces.setselect(f, false);
          spline.faces.setselect(nf, true);
      }
      spline.regen_render();
      spline.solve();
    }
  }
  _ESClass.register(DuplicateOp);
  _es6_module.add_class(DuplicateOp);
  DuplicateOp = _es6_module.add_export('DuplicateOp', DuplicateOp);
  class SplineMirrorOp extends SplineLocalToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {uiname: "Flip Horizontally", 
     apiname: "spline.mirror_verts", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     description: "Flip selected points horizontally"}
    }
     exec(ctx) {
      var spline=ctx.spline;
      var points=new set();
      var cent=new Vector3();
      for (var i=0; i<2; i++) {
          var list=i ? spline.handles : spline.verts;
          for (var v of list.selected.editable(ctx)) {
              if (i==1&&v.owning_vertex!=undefined&&v.owning_vertex.hidden)
                continue;
              if (i==0&&v.hidden)
                continue;
              points.add(v);
              cent.add(v);
          }
      }
      if (points.length==0)
        return ;
      cent.mulScalar(1.0/points.length);
      for (var v of points) {
          v.sub(cent);
          v[0] = -v[0];
          v.add(cent);
          v.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      }
      spline.resolve = 1;
    }
  }
  _ESClass.register(SplineMirrorOp);
  _es6_module.add_class(SplineMirrorOp);
  SplineMirrorOp = _es6_module.add_export('SplineMirrorOp', SplineMirrorOp);
}, '/dev/fairmotion/src/editors/viewport/spline_editops.js');
es6_module_define('spline_layerops', ["./spline_editops.js", "../../core/toolops_api.js", "../../curve/spline.js", "../../core/toolprops.js", "../../curve/spline_types.js"], function _spline_layerops_module(_es6_module) {
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolFlags');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var RecalcFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'RecalcFlags');
  var RestrictFlags=es6_import_item(_es6_module, '../../curve/spline.js', 'RestrictFlags');
  var Spline=es6_import_item(_es6_module, '../../curve/spline.js', 'Spline');
  var SplineLocalToolOp=es6_import_item(_es6_module, './spline_editops.js', 'SplineLocalToolOp');
  var StringProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'StringProperty');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  var BoolProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'BoolProperty');
  var CollectionProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'CollectionProperty');
  class SplineLayerOp extends SplineLocalToolOp {
    static  tooldef() {
      return {inputs: ToolOp.inherit({spline_path: new StringProperty("frameset.drawspline")})}
    }
     get_spline(ctx) {
      return ctx.api.getValue(this.inputs.spline_path.data);
    }
  }
  _ESClass.register(SplineLayerOp);
  _es6_module.add_class(SplineLayerOp);
  SplineLayerOp = _es6_module.add_export('SplineLayerOp', SplineLayerOp);
  class AddLayerOp extends SplineLayerOp {
     constructor(name) {
      super(undefined, "Add Layer");
      if (name!=undefined)
        this.inputs.name.set_data(name);
    }
    static  tooldef() {
      return {uiname: "Add Layer", 
     apiname: "spline.layers.add", 
     inputs: ToolOp.inherit({name: new StringProperty("Layer", "name", "Name", "Layer Name"), 
      make_active: new BoolProperty(true, "Make Active")}), 
     outputs: ToolOp.inherit({layerid: new IntProperty(0, "layerid", "layerid", "New Layer ID")}), 
     is_modal: false}
    }
     can_call(ctx) {
      let spline=ctx.api.getValue(ctx, this.inputs.spline_path.data);
      return spline!==undefined;
    }
     exec(ctx) {
      console.warn(ctx, ctx.api);
      let spline=ctx.api.getValue(ctx, this.inputs.spline_path.data);
      var layer=spline.layerset.new_layer(this.inputs.name.data);
      this.outputs.layerid.set_data(layer.id);
      if (this.inputs.make_active.data) {
          spline.layerset.active = layer;
          for (var list of spline.elists) {
              list.active = undefined;
          }
      }
      spline.regen_sort();
    }
  }
  _ESClass.register(AddLayerOp);
  _es6_module.add_class(AddLayerOp);
  AddLayerOp = _es6_module.add_export('AddLayerOp', AddLayerOp);
  class ChangeLayerOp extends SplineLayerOp {
    static  tooldef() {
      return {uiname: "Change Layer", 
     apiname: "spline.layers.set", 
     inputs: ToolOp.inherit({layerid: new IntProperty(0, "layerid", "layerid", "Layer ID")}), 
     is_modal: false}
    }
     constructor(id) {
      super(undefined);
      if (id!=undefined)
        this.inputs.layerid.set_data(id);
    }
     undo_pre(ctx) {
      var spline=this.get_spline(ctx);
      var actives=[];
      for (var list of spline.elists) {
          actives.push(list.active!=undefined ? list.active.eid : -1);
      }
      this._undo = {id: this.get_spline(ctx).layerset.active.id, 
     actives: actives};
    }
     undo(ctx) {
      var spline=this.get_spline(ctx);
      var layer=spline.layerset.idmap[this._undo.id];
      var actives=this._undo.actives;
      for (var i=0; i<actives.length; i++) {
          spline.elists[i].active = spline.eidmap[actives[i]];
      }
      if (layer==undefined) {
          console.log("ERROR IN CHANGELAYER UNDO!");
          return ;
      }
      spline.layerset.active = layer;
    }
     exec(ctx) {
      var spline=this.get_spline(ctx);
      var layer=spline.layerset.idmap[this.inputs.layerid.data];
      if (layer==undefined) {
          console.log("ERROR IN CHANGELAYER!");
          return ;
      }
      for (var list of spline.elists) {
          list.active = undefined;
      }
      spline.layerset.active = layer;
      window.redraw_viewport();
    }
  }
  _ESClass.register(ChangeLayerOp);
  _es6_module.add_class(ChangeLayerOp);
  ChangeLayerOp = _es6_module.add_export('ChangeLayerOp', ChangeLayerOp);
  
  class ChangeElementLayerOp extends SplineLayerOp {
     constructor(old_layer, new_layer) {
      super(undefined, "Move to Layer");
      if (old_layer!=undefined)
        this.inputs.old_layer.set_data(old_layer);
      if (new_layer!=undefined)
        this.inputs.new_layer.set_data(new_layer);
    }
    static  tooldef() {
      return {name: "move_to_layer", 
     uiname: "Move To Layer", 
     path: "spline.move_to_layer", 
     inputs: ToolOp.inherit({old_layer: new IntProperty(0), 
      new_layer: new IntProperty(0)}), 
     outputs: {}}
    }
     exec(ctx) {
      var spline=this.get_spline(ctx);
      var oldl=this.inputs.old_layer.data;
      var newl=this.inputs.new_layer.data;
      var eset=new set();
      for (var e of spline.selected) {
          if (e.hidden)
            continue;
          if (!(oldl in e.layers))
            continue;
          eset.add(e);
      }
      console.log("ids", oldl, newl);
      oldl = spline.layerset.idmap[oldl];
      newl = spline.layerset.idmap[newl];
      if (newl==undefined||oldl==undefined||oldl==newl) {
          console.log("Error in ChangeElementLayerOp!", "oldlayer", oldl, "newlayer", newl);
          return ;
      }
      for (var e of eset) {
          oldl.remove(e);
          newl.add(e);
      }
      window.redraw_viewport();
      spline.regen_sort();
    }
  }
  _ESClass.register(ChangeElementLayerOp);
  _es6_module.add_class(ChangeElementLayerOp);
  ChangeElementLayerOp = _es6_module.add_export('ChangeElementLayerOp', ChangeElementLayerOp);
  class DeleteLayerOp extends SplineLayerOp {
     constructor() {
      super(undefined);
    }
    static  tooldef() {
      return {uiname: "Delete Layer", 
     apiname: "spline.layers.remove", 
     inputs: ToolOp.inherit({layer_id: new IntProperty(-1)}), 
     is_modal: false}
    }
     exec(ctx) {
      var spline=this.get_spline(ctx);
      var layer=spline.layerset.idmap[this.inputs.layer_id.data];
      if (layer==undefined) {
          console.trace("Warning, bad data passed to DeleteLayerOp()");
          return ;
      }
      if (spline.layerset.length<2) {
          console.trace("DeleteLayerOp(): Must have at least one layer at all times");
          return ;
      }
      var orphaned=new set();
      for (var k in spline.eidmap) {
          var e=spline.eidmap[k];
          if (layer.id in e.layers) {
              delete e.layers[layer.id];
          }
          var exist=false;
          for (var id in e.layers) {
              exist = true;
              break;
          }
          if (!exist) {
              orphaned.add(e);
          }
      }
      spline.layerset.remove(layer);
      var layer=spline.layerset.active;
      for (var e of orphaned) {
          e.layers[layer.id] = 1;
      }
    }
  }
  _ESClass.register(DeleteLayerOp);
  _es6_module.add_class(DeleteLayerOp);
  DeleteLayerOp = _es6_module.add_export('DeleteLayerOp', DeleteLayerOp);
}, '/dev/fairmotion/src/editors/viewport/spline_layerops.js');
es6_module_define('spline_animops', [], function _spline_animops_module(_es6_module) {
}, '/dev/fairmotion/src/editors/viewport/spline_animops.js');
es6_module_define('multires_ops', ["../../../curve/spline_draw.js", "../spline_editops.js", "../../../curve/spline_types.js", "../../../core/toolops_api.js", "../../../core/toolprops.js", "../../../curve/spline.js", "../../../curve/spline_multires.js", "../../../path.ux/scripts/util/vectormath.js"], function _multires_ops_module(_es6_module) {
  es6_import(_es6_module, '../../../path.ux/scripts/util/vectormath.js');
  var IntProperty=es6_import_item(_es6_module, '../../../core/toolprops.js', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, '../../../core/toolprops.js', 'FloatProperty');
  var CollectionProperty=es6_import_item(_es6_module, '../../../core/toolprops.js', 'CollectionProperty');
  var BoolProperty=es6_import_item(_es6_module, '../../../core/toolprops.js', 'BoolProperty');
  var TPropFlags=es6_import_item(_es6_module, '../../../core/toolprops.js', 'TPropFlags');
  var Vec3Property=es6_import_item(_es6_module, '../../../core/toolprops.js', 'Vec3Property');
  var ToolOp=es6_import_item(_es6_module, '../../../core/toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../../core/toolops_api.js', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, '../../../core/toolops_api.js', 'ModalStates');
  var SplineFlags=es6_import_item(_es6_module, '../../../curve/spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, '../../../curve/spline_types.js', 'SplineTypes');
  var RecalcFlags=es6_import_item(_es6_module, '../../../curve/spline_types.js', 'RecalcFlags');
  var RestrictFlags=es6_import_item(_es6_module, '../../../curve/spline.js', 'RestrictFlags');
  var Spline=es6_import_item(_es6_module, '../../../curve/spline.js', 'Spline');
  var TPropFlags=es6_import_item(_es6_module, '../../../core/toolprops.js', 'TPropFlags');
  var redo_draw_sort=es6_import_item(_es6_module, '../../../curve/spline_draw.js', 'redo_draw_sort');
  var SplineLocalToolOp=es6_import_item(_es6_module, '../spline_editops.js', 'SplineLocalToolOp');
  var ensure_multires=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'ensure_multires');
  var MResFlags=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'MResFlags');
  var BoundPoint=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'BoundPoint');
  var MultiResLayer=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'MultiResLayer');
  var compose_id=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'decompose_id');
  var has_multires=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'has_multires');
  var iterpoints=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'iterpoints');
  var $vec_PdwJ_exec;
  class CreateMResPoint extends SplineLocalToolOp {
     constructor(seg, co) {
      super("create_mres_point", "Add Detail Point", "", -1);
      if (seg!=undefined) {
          this.inputs.segment.set_data(typeof seg!="number" ? seg.eid : seg);
      }
      if (co!=undefined) {
          this.inputs.co.set_data(co);
      }
    }
     exec(ctx) {
      var spline=ctx.spline;
      var level=this.inputs.level.data;
      console.log("Add mres point! yay!");
      ensure_multires(spline);
      var seg=spline.eidmap[this.inputs.segment.data];
      var co=this.inputs.co.data;
      var flag=MResFlags.SELECT;
      var mr=seg.cdata.get_layer(MultiResLayer);
      for (var seg2 of spline.segments) {
          var mr2=seg2.cdata.get_layer(MultiResLayer);
          for (var p2 of mr2.points(level)) {
              p2.flag&=~MResFlags.SELECT;
          }
      }
      console.log(p);
      console.log("S", s);
      var p=mr.add_point(level, co);
      var cp=seg.closest_point(co);
      var t=10.0, s=0.5;
      if (cp!=undefined) {
          s = cp[1];
          t = cp[0].vectorDistance(co);
          $vec_PdwJ_exec.zero().load(co).sub(cp[0]);
          var n=seg.normal(s);
          t*=Math.sign(n.dot($vec_PdwJ_exec));
          p.offset[0] = $vec_PdwJ_exec[0];
          p.offset[1] = $vec_PdwJ_exec[1];
      }
      else {
        flag|=MResFlags.UPDATE;
      }
      p.flag = flag;
      p.s = s;
      p.t = t;
      p.seg = seg.eid;
      var id=compose_id(p.seg, p.id);
      spline.segments.cdata.get_shared('MultiResLayer').active = id;
    }
  }
  var $vec_PdwJ_exec=new Vector3();
  _ESClass.register(CreateMResPoint);
  _es6_module.add_class(CreateMResPoint);
  CreateMResPoint = _es6_module.add_export('CreateMResPoint', CreateMResPoint);
  CreateMResPoint.inputs = {segment: new IntProperty(0), 
   co: new Vec3Property(), 
   level: new IntProperty(0)}
}, '/dev/fairmotion/src/editors/viewport/multires/multires_ops.js');
es6_module_define('multires_selectops', ["../../../curve/spline_types.js", "../../../core/toolops_api.js", "../../../core/toolprops.js", "../../../path.ux/scripts/util/vectormath.js", "../../../curve/spline_multires.js", "../../../curve/spline.js", "../spline_editops.js", "../../../curve/spline_draw.js"], function _multires_selectops_module(_es6_module) {
  "use strict";
  es6_import(_es6_module, '../../../path.ux/scripts/util/vectormath.js');
  var IntProperty=es6_import_item(_es6_module, '../../../core/toolprops.js', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, '../../../core/toolprops.js', 'FloatProperty');
  var CollectionProperty=es6_import_item(_es6_module, '../../../core/toolprops.js', 'CollectionProperty');
  var BoolProperty=es6_import_item(_es6_module, '../../../core/toolprops.js', 'BoolProperty');
  var TPropFlags=es6_import_item(_es6_module, '../../../core/toolprops.js', 'TPropFlags');
  var Vec3Property=es6_import_item(_es6_module, '../../../core/toolprops.js', 'Vec3Property');
  var ToolOp=es6_import_item(_es6_module, '../../../core/toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../../core/toolops_api.js', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, '../../../core/toolops_api.js', 'ModalStates');
  var SplineFlags=es6_import_item(_es6_module, '../../../curve/spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, '../../../curve/spline_types.js', 'SplineTypes');
  var RecalcFlags=es6_import_item(_es6_module, '../../../curve/spline_types.js', 'RecalcFlags');
  var RestrictFlags=es6_import_item(_es6_module, '../../../curve/spline.js', 'RestrictFlags');
  var Spline=es6_import_item(_es6_module, '../../../curve/spline.js', 'Spline');
  var TPropFlags=es6_import_item(_es6_module, '../../../core/toolprops.js', 'TPropFlags');
  var redo_draw_sort=es6_import_item(_es6_module, '../../../curve/spline_draw.js', 'redo_draw_sort');
  var SplineLocalToolOp=es6_import_item(_es6_module, '../spline_editops.js', 'SplineLocalToolOp');
  var ensure_multires=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'ensure_multires');
  var has_multires=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'has_multires');
  var MResFlags=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'MResFlags');
  var compose_id=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'decompose_id');
  var BoundPoint=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'BoundPoint');
  var MultiResLayer=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'MultiResLayer');
  class SelectOpBase extends ToolOp {
     constructor(actlevel, uiname, description, icon) {
      super(undefined, uiname, description, icon);
      if (actlevel!=undefined)
        this.inputs.level.set_data(actlevel);
    }
     can_call(ctx) {
      var spline=ctx.spline;
      return has_multires(spline);
    }
     undo_pre(ctx) {
      var ud=this._undo = [];
      this._undo_level = this.inputs.level.data;
      var spline=ctx.spline;
      var actlayer=spline.layerset.active;
      var level=this.inputs.level.data;
      if (!has_multires(spline))
        return ;
      for (var seg of spline.segments) {
          if (seg.hidden)
            continue;
          if (!(actlayer.id in seg.layers))
            continue;
          var mr=seg.cdata.get_layer(MultiResLayer);
          for (var p of mr.points(level)) {
              if (p.flag&MResFlags.SELECT)
                ud.push(compose_id(seg.eid, p.id));
          }
      }
      window.redraw_viewport();
    }
     undo(ctx) {
      var spline=ctx.spline;
      var actlayer=spline.layerset.active;
      var level=this._undo_level;
      if (!has_multires(spline))
        return ;
      for (var seg of spline.segments) {
          if (seg.hidden)
            continue;
          if (!(actlayer.id in seg.layers))
            continue;
          var mr=seg.cdata.get_layer(MultiResLayer);
          for (var p of mr.points(level)) {
              p.flag&=~MResFlags.SELECT;
              p.flag&=~MResFlags.HIGHLIGHT;
          }
      }
      for (var i=0; i<this._undo.length; i++) {
          var id=this._undo[i];
          var seg=decompose_id(id)[0];
          var p=decompose_id(id)[1];
          seg = spline.eidmap[seg];
          if (seg==undefined) {
              console.trace("Eek! bad seg eid!", seg, p, id, this, this._undo);
              continue;
          }
          var mr=seg.cdata.get_layer(MultiResLayer);
          p = mr.get(p);
          p.flag|=MResFlags.SELECT;
      }
      window.redraw_viewport();
    }
  }
  _ESClass.register(SelectOpBase);
  _es6_module.add_class(SelectOpBase);
  SelectOpBase.inputs = {level: new IntProperty(0)}
  class ToggleSelectAll extends SelectOpBase {
     constructor(actlevel=0) {
      super(actlevel, "Select All", "Select all/none");
    }
     can_call(ctx) {
      var spline=ctx.spline;
      return has_multires(spline);
    }
     exec(ctx) {
      var spline=ctx.spline;
      var actlayer=spline.layerset.active;
      var level=this.inputs.level.data;
      if (!has_multires(spline))
        return ;
      var totsel=0;
      for (var seg of spline.segments) {
          if (seg.hidden)
            continue;
          if (!(actlayer.id in seg.layers))
            continue;
          var mr=seg.cdata.get_layer(MultiResLayer);
          for (var p of mr.points(level)) {
              if (p.flag&MResFlags.HIDE)
                continue;
              totsel+=p.flag&MResFlags.SELECT;
          }
      }
      for (var seg of spline.segments) {
          if (seg.hidden)
            continue;
          if (!(actlayer.id in seg.layers))
            continue;
          var mr=seg.cdata.get_layer(MultiResLayer);
          for (var p of mr.points(level)) {
              if (p.flag&MResFlags.HIDE)
                continue;
              if (totsel)
                p.flag&=~MResFlags.SELECT;
              else 
                p.flag|=MResFlags.SELECT;
          }
      }
    }
  }
  _ESClass.register(ToggleSelectAll);
  _es6_module.add_class(ToggleSelectAll);
  ToggleSelectAll = _es6_module.add_export('ToggleSelectAll', ToggleSelectAll);
  ToggleSelectAll.inputs = {level: new IntProperty(0)}
  class SelectOneOp extends SelectOpBase {
     constructor(pid=undefined, unique=true, mode=true, level=0) {
      super(level, "Select One", "select one element");
      this.inputs.unique.set_data(unique);
      this.inputs.state.set_data(mode);
      if (pid!=undefined)
        this.inputs.pid.set_data(pid);
    }
     exec(ctx) {
      var spline=ctx.spline;
      var actlayer=spline.layerset.active;
      var id=this.inputs.pid.data;
      var level=this.inputs.level.data;
      var seg=decompose_id(id)[0];
      var p=decompose_id(id)[1];
      seg = spline.eidmap[seg];
      var mr=seg.cdata.get_layer(MultiResLayer);
      p = mr.get(p);
      if (this.inputs.unique.data) {
          for (var seg2 of spline.segments) {
              if (seg2.hidden)
                continue;
              if (!(actlayer.id in seg2.layers))
                continue;
              var mr2=seg2.cdata.get_layer(MultiResLayer);
              for (var p2 of mr2.points(level)) {
                  p2.flag&=~SplineFlags.SELECT;
              }
          }
      }
      var state=this.inputs.state.data;
      if (state&&this.inputs.set_active.data) {
          var shared=spline.segments.cdata.get_shared("MultiResLayer");
          shared.active = id;
      }
      if (state) {
          p.flag|=SplineFlags.SELECT;
      }
      else {
        p.flag&=~SplineFlags.SELECT;
      }
    }
  }
  _ESClass.register(SelectOneOp);
  _es6_module.add_class(SelectOneOp);
  SelectOneOp = _es6_module.add_export('SelectOneOp', SelectOneOp);
  SelectOneOp.inputs = ToolOp.inherit_inputs(SelectOpBase, {pid: new IntProperty(-1), 
   state: new BoolProperty(true), 
   set_active: new BoolProperty(true), 
   unique: new BoolProperty(true), 
   level: new IntProperty(0)});
}, '/dev/fairmotion/src/editors/viewport/multires/multires_selectops.js');
es6_module_define('multires_transdata', ["../selectmode.js", "../../../curve/spline_multires.js", "../transdata.js", "../../../util/mathlib.js"], function _multires_transdata_module(_es6_module) {
  "use strict";
  var SelMask=es6_import_item(_es6_module, '../selectmode.js', 'SelMask');
  var compose_id=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'decompose_id');
  var has_multires=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'has_multires');
  var ensure_multires=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'ensure_multires');
  var MultiResLayer=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'MultiResLayer');
  var iterpoints=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'iterpoints');
  var MResFlags=es6_import_item(_es6_module, '../../../curve/spline_multires.js', 'MResFlags');
  var MinMax=es6_import_item(_es6_module, '../../../util/mathlib.js', 'MinMax');
  var TransDataType=es6_import_item(_es6_module, '../transdata.js', 'TransDataType');
  var TransDataItem=es6_import_item(_es6_module, '../transdata.js', 'TransDataItem');
  var $co_rzB8_apply;
  var $co_b8x2_calc_draw_aabb;
  var $co2_rcAc_calc_draw_aabb;
  var $co_cZHo_aabb;
  class MResTransData extends TransDataType {
    static  gen_data(ctx, td, data) {
      var doprop=td.doprop;
      var proprad=td.propradius;
      var spline=ctx.spline;
      var actlayer=spline.layerset.active;
      if (!has_multires(spline))
        return ;
      var actlevel=spline.actlevel;
      for (var seg of spline.segments) {
          if (!(actlayer.id in seg.layers))
            continue;
          if (seg.hidden)
            continue;
          var mr=seg.cdata.get_layer(MultiResLayer);
          for (var p of mr.points(actlevel)) {
              if (!(p.flag&MResFlags.SELECT))
                continue;
              p = mr.get(p.id, true);
              var co=new Vector3(p);
              co[2] = 0.0;
              var td=new TransDataItem(p, MResTransData, co);
              data.push(td);
          }
      }
    }
    static  apply(ctx, td, item, mat, w) {
      var p=item.data;
      if (w==0.0)
        return ;
      $co_rzB8_apply.load(item.start_data);
      $co_rzB8_apply[2] = 0.0;
      $co_rzB8_apply.multVecMatrix(mat);
      $co_rzB8_apply.sub(item.start_data).mulScalar(w).add(item.start_data);
      p[0] = $co_rzB8_apply[0];
      p[1] = $co_rzB8_apply[1];
      p.recalc_offset(ctx.spline);
      var seg=ctx.spline.eidmap[p.seg];
      p.mr.recalc_wordscos(seg);
    }
    static  undo_pre(ctx, td, undo_obj) {
      var ud=[];
      var spline=ctx.spline;
      var actlayer=spline.layerset.active;
      var doprop=td.doprop;
      if (!has_multires(spline))
        return ;
      for (var seg of spline.segments) {
          if (seg.hidden)
            continue;
          if (!(actlayer.id in seg.layers))
            continue;
          var mr=seg.cdata.get_layer(MultiResLayer);
          for (var p of mr.points) {
              if (!doprop&&!(p.flag&MResFlags.SELECT))
                continue;
              ud.push(compose_id(seg.eid, p.id));
              ud.push(p[0]);
              ud.push(p[1]);
          }
      }
      undo_obj.mr_undo = ud;
    }
    static  undo(ctx, undo_obj) {
      var ud=undo_obj.mr_undo;
      var spline=ctx.spline;
      var i=0;
      while (i<ud.length) {
        var pid=ud[i++];
        var x=ud[i++];
        var y=ud[i++];
        var seg=decompose_id(pid)[0];
        var p=decompose_id(pid)[1];
        seg = spline.eidmap[seg];
        var mr=seg.cdata.get_layer(MultiResLayer);
        p = mr.get(p);
        p[0] = x;
        p[1] = y;
      }
    }
    static  update(ctx, td) {

    }
    static  calc_prop_distances(ctx, td, data) {

    }
    static  calc_draw_aabb(ctx, td, minmax) {
      $co_b8x2_calc_draw_aabb.zero();
      var pad=15;
      function do_minmax(co) {
        $co2_rcAc_calc_draw_aabb[0] = co[0]-pad;
        $co2_rcAc_calc_draw_aabb[1] = co[1]-pad;
        minmax.minmax($co2_rcAc_calc_draw_aabb);
        $co2_rcAc_calc_draw_aabb[0]+=pad*2.0;
        $co2_rcAc_calc_draw_aabb[1]+=pad*2.0;
        minmax.minmax($co2_rcAc_calc_draw_aabb);
      }
      var spline=ctx.spline;
      for (var i=0; i<td.data.length; i++) {
          var t=td.data[i];
          if (t.type!==MResTransData)
            continue;
          var seg=spline.eidmap[t.data.seg];
          if (seg!=undefined) {
              seg.update_aabb();
              minmax.minmax(seg.aabb[0]);
              minmax.minmax(seg.aabb[1]);
          }
          if (seg.v1.segments.length==2) {
              var seg2=seg.v1.other_segment(seg);
              seg2.update_aabb();
              minmax.minmax(seg2.aabb[0]);
              minmax.minmax(seg2.aabb[1]);
          }
          if (seg.v2.segments.length==2) {
              var seg2=seg.v2.other_segment(seg);
              seg2.update_aabb();
              minmax.minmax(seg2.aabb[0]);
              minmax.minmax(seg2.aabb[1]);
          }
          $co_b8x2_calc_draw_aabb[0] = t.data[0];
          $co_b8x2_calc_draw_aabb[1] = t.data[1];
          do_minmax($co_b8x2_calc_draw_aabb);
          $co_b8x2_calc_draw_aabb[0]-=t.data.offset[0];
          $co_b8x2_calc_draw_aabb[1]-=t.data.offset[1];
          do_minmax($co_b8x2_calc_draw_aabb);
      }
    }
    static  aabb(ctx, td, item, minmax, selected_only) {
      $co_cZHo_aabb.zero();
      for (var i=0; i<td.data.length; i++) {
          var t=td.data[i];
          if (t.type!==MResTransData)
            continue;
          $co_cZHo_aabb[0] = t.data[0];
          $co_cZHo_aabb[1] = t.data[1];
          minmax.minmax($co_cZHo_aabb);
      }
    }
  }
  var $co_rzB8_apply=new Vector3();
  var $co_b8x2_calc_draw_aabb=new Vector3();
  var $co2_rcAc_calc_draw_aabb=[0, 0, 0];
  var $co_cZHo_aabb=new Vector3();
  _ESClass.register(MResTransData);
  _es6_module.add_class(MResTransData);
  MResTransData = _es6_module.add_export('MResTransData', MResTransData);
  MResTransData.selectmode = SelMask.MULTIRES;
}, '/dev/fairmotion/src/editors/viewport/multires/multires_transdata.js');
var g_theme;
es6_module_define('theme', ["../core/struct.js"], function _theme_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  function darken(c, m) {
    for (var i=0; i<3; i++) {
        c[i]*=m;
    }
    return c;
  }
  darken = _es6_module.add_export('darken', darken);
  class BoxColor  {
     constructor() {
      this.colors = undefined;
    }
     copy() {
      var ret=new BoxColor();
      ret.colors = JSON.parse(JSON.stringify(this.colors));
      return ret;
    }
    static  fromSTRUCT(reader) {
      return {}
    }
  }
  _ESClass.register(BoxColor);
  _es6_module.add_class(BoxColor);
  BoxColor = _es6_module.add_export('BoxColor', BoxColor);
  BoxColor.STRUCT = `
  BoxColor {
  }
`;
  class BoxColor4 extends BoxColor {
     constructor(colors) {
      super();
      var clrs=this.colors = [[], [], [], []];
      if (colors==undefined)
        return this;
      for (var i=0; i<4; i++) {
          for (var j=0; j<4; j++) {
              clrs[i].push(colors[i][j]);
          }
      }
    }
     copy() {
      return new BoxColor4(this.colors);
    }
    static  fromSTRUCT(reader) {
      var ret=new BoxColor4();
      reader(ret);
      return ret;
    }
  }
  _ESClass.register(BoxColor4);
  _es6_module.add_class(BoxColor4);
  BoxColor4 = _es6_module.add_export('BoxColor4', BoxColor4);
  BoxColor4.STRUCT = `
  BoxColor4 {
    colors : array(vec4);
  }
`;
  class BoxWColor extends BoxColor {
     constructor(color, weights) {
      super();
      if (color==undefined||weights==undefined) {
          return this;
      }
      this.color = [color[0], color[1], color[2], color[3]];
      this.weights = [weights[0], weights[1], weights[2], weights[3]];
    }
    set  colors(c) {
      if (c===undefined) {
          if (DEBUG.theme)
            console.warn("undefined was passed to BoxWColor.colors setter");
          return ;
      }
      if (typeof c[0]=="object") {
          this.color = c[0];
      }
      else {
        this.color = c;
      }
    }
    get  colors() {
      var ret=[[], [], [], []];
      var clr=this.color;
      var w=this.weights;
      if (clr==undefined)
        clr = [1, 1, 1, 1];
      for (var i=0; i<4; i++) {
          for (var j=0; j<3; j++) {
              ret[i].push(clr[j]*w[i]);
          }
          ret[i].push(clr[3]);
      }
      return ret;
    }
     copy() {
      return new BoxWColor(this.color, this.weights);
    }
    static  fromSTRUCT(reader) {
      var ret=new BoxWColor();
      reader(ret);
      return ret;
    }
  }
  _ESClass.register(BoxWColor);
  _es6_module.add_class(BoxWColor);
  BoxWColor = _es6_module.add_export('BoxWColor', BoxWColor);
  BoxWColor.STRUCT = `
  BoxWColor {
    color   : vec4;
    weights : vec4;
  }
`;
  class ThemePair  {
     constructor(key, value) {
      this.key = key;
      this.val = value;
    }
  }
  _ESClass.register(ThemePair);
  _es6_module.add_class(ThemePair);
  ThemePair = _es6_module.add_export('ThemePair', ThemePair);
  class ColorTheme  {
    
    
    
     constructor(defobj) {
      this.colors = new hashtable();
      this.boxcolors = new hashtable();
      if (defobj!==undefined) {
          for (var k in defobj) {
              if (this.colors.has(k)||this.boxcolors.has(k))
                continue;
              var c=defobj[k];
              if (__instance_of(c, BoxColor)) {
                  this.boxcolors.set(k, c);
              }
              else {
                this.colors.set(k, c);
              }
          }
      }
      this.flat_colors = new GArray();
    }
     copy() {
      var ret=new ColorTheme({});
      function cpy(c) {
        if (__instance_of(c, BoxColor)) {
            return c.copy();
        }
        else {
          return JSON.parse(JSON.stringify(c));
        }
      }
      for (var k of this.boxcolors) {
          var c=this.boxcolors.get(k);
          ret.boxcolors.set(k, cpy(c));
      }
      for (var k of this.colors) {
          var c=this.colors.get(k);
          ret.colors.set(k, cpy(c));
      }
      ret.gen_colors();
      return ret;
    }
     patch(newtheme) {
      if (newtheme==undefined)
        return ;
      var ks=new set(newtheme.colors.keys()).union(newtheme.boxcolors.keys());
      for (var k of this.colors) {
          if (!ks.has(k)) {
              newtheme.colors.set(k, this.colors.get(k));
          }
      }
      for (var k of this.boxcolors) {
          if (!ks.has(k)) {
              newtheme.boxcolors.set(k, this.boxcolors.get(k));
          }
      }
      newtheme.gen_colors();
    }
     gen_code() {
      var s="new ColorTheme({\n";
      var arr=this.flat_colors;
      for (var i=0; i<arr.length; i++) {
          var item=arr[i];
          if (i>0)
            s+=",";
          s+="\n";
          if (__instance_of(item[1], BoxWColor)) {
              s+='  "'+item[0]+'" : ui_weight_clr(';
              s+=JSON.stringify(item[1].color);
              s+=",";
              s+=JSON.stringify(item[1].weights);
              s+=")";
          }
          else 
            if (__instance_of(item[1], BoxColor4)) {
              s+='  "'+item[0]+'" : new BoxColor4(';
              s+=JSON.stringify(item[1].colors);
              s+=")";
          }
          else {
            s+='  "'+item[0]+'" : '+JSON.stringify(item[1]);
          }
      }
      s+="});";
      return s;
    }
     gen_colors() {
      var ret={};
      this.flat_colors = new GArray();
      for (var k of this.colors) {
          var c1=this.colors.get(k), c2=[0, 0, 0, 0];
          for (var i=0; i<4; i++) {
              c2[i] = c1[i];
          }
          ret[k] = c2;
          this.flat_colors.push([k, c1]);
      }
      for (var k of this.boxcolors) {
          ret[k] = this.boxcolors.get(k).colors;
          this.flat_colors.push([k, this.boxcolors.get(k)]);
      }
      return ret;
    }
    static  fromSTRUCT(reader) {
      var c=new ColorTheme({});
      reader(c);
      var ks=c.colorkeys;
      for (var i=0; i<ks.length; i++) {
          c.colors.set(ks[i], c.colorvals[i]);
      }
      var ks=c.boxkeys;
      for (var i=0; i<ks.length; i++) {
          c.boxcolors.set(ks[i], c.boxvals[i]);
      }
      delete c.colorkeys;
      delete c.boxkeys;
      delete c.colorvals;
      delete c.boxvals;
      return c;
    }
  }
  _ESClass.register(ColorTheme);
  _es6_module.add_class(ColorTheme);
  ColorTheme = _es6_module.add_export('ColorTheme', ColorTheme);
  ColorTheme.STRUCT = `
  ColorTheme {
    colorkeys : array(string) | obj.colors.keys();
    colorvals : array(vec4) | obj.colors.values();
    boxkeys : array(string) | obj.boxcolors.keys();
    boxvals : array(abstract(BoxColor)) | obj.boxcolors.values();
  }
`;
  window.menu_text_size = 14;
  window.default_ui_font_size = 16;
  window.ui_hover_time = 800;
  function ui_weight_clr(clr, weights) {
    return new BoxWColor(clr, weights);
  }
  ui_weight_clr = _es6_module.add_export('ui_weight_clr', ui_weight_clr);
  window.uicolors = {}
  window.colors3d = {}
  class Theme  {
     constructor(ui, view2d) {
      this.ui = ui;
      this.view2d = view2d;
    }
     patch(theme) {
      this.ui.patch(theme.ui);
    }
     gen_code() {
      var s='"use strict";\n/*auto-generated file*/\nvar UITheme = '+this.ui.gen_code()+"\n";
      return s;
    }
    static  fromSTRUCT(reader) {
      var ret=new Theme();
      reader(ret);
      return ret;
    }
     gen_globals() {
      
      uicolors = this.ui.gen_colors();
    }
  }
  _ESClass.register(Theme);
  _es6_module.add_class(Theme);
  Theme = _es6_module.add_export('Theme', Theme);
  Theme.STRUCT = `
  Theme {
    ui     : ColorTheme;
    view2d : ColorTheme;
  }
`;
  
  window.init_theme = function () {
    window.UITheme.original = window.UITheme.copy();
    window.View2DTheme.original = window.View2DTheme.copy();
    window.g_theme = new Theme(window.UITheme, window.View2DTheme);
    window.g_theme.gen_globals();
  }
  function reload_default_theme() {
    window.g_theme = new Theme(window.UITheme.original.copy(), window.View2DTheme.original.copy());
    window.g_theme.gen_globals();
  }
  reload_default_theme = _es6_module.add_export('reload_default_theme', reload_default_theme);
}, '/dev/fairmotion/src/datafiles/theme.js');
es6_module_define('theme_def', ["./theme.js"], function _theme_def_module(_es6_module) {
  "use strict";
  var ColorTheme=es6_import_item(_es6_module, './theme.js', 'ColorTheme');
  var ui_weight_clr=es6_import_item(_es6_module, './theme.js', 'ui_weight_clr');
  var BoxColor4=es6_import_item(_es6_module, './theme.js', 'BoxColor4');
  function uniformbox4(clr) {
    return new BoxColor4([clr, clr, clr, clr]);
  }
  window.UITheme = new ColorTheme({"ErrorText": [1, 0.20000000298023224, 0.20000000298023224, 0.8899999856948853], 
   "ListBoxText": [0.20000000298023224, 0.20000000298023224, 0.20000000298023224, 1], 
   "MenuHighlight": [0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 1], 
   "RadialMenu": [1, 0, 0, 1], 
   "RadialMenuHighlight": [0.7831560373306274, 0.7664570808410645, 0.3468262255191803, 0.7717778086662292], 
   "DefaultLine": [0.4163331985473633, 0.3746998906135559, 0.3746998906135559, 1], 
   "SelectLine": [0.699999988079071, 0.699999988079071, 0.699999988079071, 1], 
   "Check": [0.8999999761581421, 0.699999988079071, 0.4000000059604645, 1], 
   "Arrow": [0.4000000059604645, 0.4000000059604645, 0.4000000059604645, 1], 
   "DefaultText": [0.9092121124267578, 0.9092121124267578, 0.9092121124267578, 1], 
   "BoxText": [0, 0, 0, 1], 
   "HotkeyText": [0.43986162543296814, 0.43986162543296814, 0.43986162543296814, 1], 
   "HighlightCursor": [0.8999999761581421, 0.8999999761581421, 0.8999999761581421, 0.875], 
   "TextSelect": [0.4000000059604645, 0.4000000059604645, 0.4000000059604645, 0.75], 
   "TextEditCursor": [0.10000000149011612, 0.10000000149011612, 0.10000000149011612, 1], 
   "TextBoxHighlight": [0.5270000100135803, 0.5270000100135803, 0.5270000100135803, 1], 
   "MenuSep": [0.6901277303695679, 0.6901277303695679, 0.6901277303695679, 1], 
   "MenuBorder": [0.6499999761581421, 0.6499999761581421, 0.6499999761581421, 1], 
   "RadialMenuSep": [0.10000000149011612, 0.20000000298023224, 0.20000000298023224, 1], 
   "TabPanelOutline": [0.24494896829128265, 0.24494896829128265, 0.24494896829128265, 1], 
   "TabPanelBG": [0.47600001096725464, 0.47600001096725464, 0.47600001096725464, 1], 
   "ActiveTab": [0.47600001096725464, 0.47600001096725464, 0.47600001096725464, 1], 
   "HighlightTab": [0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 0.8999999761581421], 
   "InactiveTab": [0.24494896829128265, 0.24494896829128265, 0.24494896829128265, 1], 
   "TabText": [0.930949330329895, 0.930949330329895, 0.930949330329895, 1], 
   "IconBox": [1, 1, 1, 0.17968888580799103], 
   "HighlightIcon": [0.30000001192092896, 0.8149344325065613, 1, 0.21444444358348846], 
   "MenuText": [0.10000000149011612, 0.10000000149011612, 0.10000000149011612, 1], 
   "MenuTextHigh": [0.9330000281333923, 0.9330000281333923, 0.9330000281333923, 1], 
   "PanelText": [0, 0, 0, 1], 
   "DialogText": [0.05000003054738045, 0.05000000447034836, 0.05000000447034836, 1], 
   "DialogBorder": [0.4000000059604645, 0.40000003576278687, 0.4000000059604645, 1], 
   "DisabledBox": [0.5, 0.5, 0.5, 1], 
   "IconCheckBG": [0.587992250919342, 0.587992250919342, 0.587992250919342, 1], 
   "IconCheckSet": [0.6324555320336759, 0.6324555320336759, 0.6324555320336759, 1], 
   "IconCheckUnset": [0.565685424949238, 0.565685424949238, 0.565685424949238, 1], 
   "IconEnumBG": [0.587992250919342, 0.587992250919342, 0.587992250919342, 1], 
   "IconEnumSet": [0.3324555320336759, 0.3324555320336759, 0.3324555320336759, 1], 
   "IconEnumUnset": [0.565685424949238, 0.565685424949238, 0.565685424949238, 1], 
   "Highlight": new BoxColor4([[0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 1], [0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 1], [0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 1], [0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 1]]), 
   "NoteBox": ui_weight_clr([0.800000011920929, 0.800000011920929, 0.800000011920929, 1], [0.800000011920929, 0.800000011920929, 0.800000011920929, 1]), 
   "Box": ui_weight_clr([0.9399999976158142, 0.9399999976158142, 0.9399999976158142, 1], [0.800000011920929, 0.800000011920929, 0.800000011920929, 1]), 
   "HoverHint": ui_weight_clr([1, 0.9769999980926514, 0.8930000066757202, 0.8999999761581421], [0.8999999761581421, 0.8999999761581421, 1, 1]), 
   "ErrorBox": ui_weight_clr([1, 0.30000001192092896, 0.20000000298023224, 1], [1, 1, 1, 1]), 
   "ErrorTextBG": ui_weight_clr([1, 1, 1, 1], [0.8999999761581421, 0.8999999761581421, 1, 1]), 
   "ShadowBox": ui_weight_clr([0, 0, 0, 0.10000000149011612], [1, 1, 1, 1]), 
   "ProgressBar": ui_weight_clr([0.4000000059604645, 0.7300000190734863, 0.8999999761581421, 0.8999999761581421], [0.75, 0.75, 1, 1]), 
   "ProgressBarBG": ui_weight_clr([0.699999988079071, 0.699999988079071, 0.699999988079071, 0.699999988079071], [1, 1, 1, 1]), 
   "WarningBox": ui_weight_clr([1, 0.800000011920929, 0.10000000149011612, 0.8999999761581421], [0.699999988079071, 0.800000011920929, 1.0499999523162842, 1]), 
   "ListBoxBG": ui_weight_clr([0.9399999976158142, 0.9399999976158142, 0.9399999976158142, 1], [0.9399999976158142, 0.9399999976158142, 0.9399999976158142, 1]), 
   "InvBox": ui_weight_clr([0.6000000238418579, 0.6000000238418579, 0.6000000238418579, 1], [0.6000000238418579, 0.6000000238418579, 0.6000000238418579, 1]), 
   "HLightBox": new BoxColor4([[0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 1], [0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 1], [0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 1], [0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 1]]), 
   "ActivePanel": ui_weight_clr([0.800000011920929, 0.4000000059604645, 0.30000001192092896, 0.8999999761581421], [1, 1, 1, 1]), 
   "CollapsingPanel": ui_weight_clr([0.687468409538269, 0.687468409538269, 0.687468409538269, 1], [1, 1, 1, 1]), 
   "SimpleBox": ui_weight_clr([0.4760952293872833, 0.4760952293872833, 0.4760952293872833, 1], [0.9399999976158142, 0.9399999976158142, 0.9399999976158142, 1]), 
   "DialogBox": ui_weight_clr([0.7269999980926514, 0.7269999980926514, 0.7269999980926514, 1], [1, 1, 1, 1]), 
   "DialogTitle": ui_weight_clr([0.6299999952316284, 0.6299999952316284, 0.6299999952316284, 1], [1, 1, 1, 1]), 
   "MenuBox": ui_weight_clr([0.9200000166893005, 0.9200000166893005, 0.9200000166893005, 1], [1, 1, 1, 1]), 
   "TextBox": ui_weight_clr([0.800000011920929, 0.800000011920929, 0.800000011920929, 0.8999999761581421], [1, 1, 1, 1]), 
   "TextBoxInv": ui_weight_clr([0.699999988079071, 0.699999988079071, 0.699999988079071, 1], [0.699999988079071, 0.699999988079071, 0.699999988079071, 1]), 
   "MenuLabel": ui_weight_clr([0.9044828414916992, 0.8657192587852478, 0.8657192587852478, 0.24075555801391602], [0.6000000238418579, 0.6000000238418579, 0.6000000238418579, 0.8999999761581421]), 
   "MenuLabelInv": ui_weight_clr([0.75, 0.75, 0.75, 0.47111111879348755], [1, 1, 0.9410666823387146, 1]), 
   "ScrollBG": ui_weight_clr([0.800000011920929, 0.800000011920929, 0.800000011920929, 1], [1, 1, 1, 1]), 
   "ScrollBar": ui_weight_clr([0.5919697284698486, 0.5919697284698486, 0.5919697284698486, 1], [1, 1, 1, 1]), 
   "ScrollBarHigh": ui_weight_clr([0.6548083424568176, 0.6548083424568176, 0.6548083424568176, 1], [1, 1, 1, 1]), 
   "ScrollButton": ui_weight_clr([0.800000011920929, 0.800000011920929, 0.800000011920929, 1], [1, 1, 1, 1]), 
   "ScrollButtonHigh": ui_weight_clr([0.75, 0.75, 0.75, 1], [1, 1, 1, 1]), 
   "ScrollInv": ui_weight_clr([0.4000000059604645, 0.4000000059604645, 0.4000000059604645, 1], [1, 1, 1, 1]), 
   "IconInv": ui_weight_clr([0.48299384117126465, 0.5367956161499023, 0.8049896955490112, 0.4000000059604645], [1, 1, 1, 1])});
  window.View2DTheme = new ColorTheme({"Background": [1, 1, 1, 1], 
   "ActiveObject": [0.800000011920929, 0.6000000238418579, 0.30000001192092896, 1], 
   "Selection": [0.699999988079071, 0.4000000059604645, 0.10000000149011612, 1], 
   "GridLineBold": [0.38, 0.38, 0.38, 1.0], 
   "GridLine": [0.5, 0.5, 0.5, 1.0], 
   "AxisX": [0.9, 0.0, 0.0, 1.0], 
   "AxisY": [0.0, 0.9, 0.0, 1.0], 
   "AxisZ": [0.0, 0.0, 0.9, 1.0]});
}, '/dev/fairmotion/src/datafiles/theme_def.js');
es6_module_define('icon', [], function _icon_module(_es6_module) {
  "use strict";
  var $ret_7LAN_enum_to_xy;
  class IconManager  {
    
    
    
     constructor(gl, sheet_path, imgsize, iconsize) {
      this.path = sheet_path;
      this.size = new Vector2(imgsize);
      this.cellsize = new Vector2(iconsize);
      this.load(gl);
      this.texture = undefined;
      this.ready = false;
    }
     load(gl) {
      this.tex = {};
      this.tex.image = new Image();
      this.tex.image.src = this.path;
      this.te = {};
      var thetex=this.tex;
      var this2=this;
      this.tex.image.onload = function () {
        var tex=thetex;
        this2.ready = true;
      };
    }
     get_tile(tile) {
      var ret=[];
      this.gen_tile(tile, ret);
      return ret;
    }
     enum_to_xy(tile) {
      var size=this.size;
      var cellsize=this.cellsize;
      var fx=Math.floor(size[0]/cellsize[0]);
      var y=Math.floor(tile/fx);
      var x=tile%fx;
      x*=cellsize[0];
      y*=cellsize[1];
      $ret_7LAN_enum_to_xy[0] = x;
      $ret_7LAN_enum_to_xy[1] = y;
      return $ret_7LAN_enum_to_xy;
    }
     gen_tile(tile, texcos) {
      var size=this.size;
      var cellsize=this.cellsize;
      var fx=Math.floor(size[0]/cellsize[0]);
      var y=Math.floor(tile/fx);
      var x=tile%fx;
      x = (x*cellsize[0])/size[0];
      y = (y*cellsize[1])/size[1];
      var u=1.0/size[0], v=1.0/size[1];
      u*=cellsize[0];
      v*=cellsize[1];
      y+=v;
      texcos.push(x);
      texcos.push(y);
      texcos.push(x);
      texcos.push(y-v);
      texcos.push(x+u);
      texcos.push(y-v);
      texcos.push(x);
      texcos.push(y);
      texcos.push(x+u);
      texcos.push(y-v);
      texcos.push(x+u);
      texcos.push(y);
    }
  }
  var $ret_7LAN_enum_to_xy=[0, 0];
  _ESClass.register(IconManager);
  _es6_module.add_class(IconManager);
  IconManager = _es6_module.add_export('IconManager', IconManager);
  var icon_vshader=`

`;
  var icon_fshader=`
`;
}, '/dev/fairmotion/src/core/icon.js');
es6_module_define('selectmode', [], function _selectmode_module(_es6_module) {
  var SelMask={VERTEX: 1, 
   HANDLE: 2, 
   SEGMENT: 4, 
   FACE: 16, 
   TOPOLOGY: 1|2|4|16, 
   OBJECT: 32}
  SelMask = _es6_module.add_export('SelMask', SelMask);
  var ToolModes={SELECT: 1, 
   APPEND: 2, 
   RESIZE: 3, 
   ROTATE: 4}
  ToolModes = _es6_module.add_export('ToolModes', ToolModes);
}, '/dev/fairmotion/src/editors/viewport/selectmode.js');
es6_module_define('platform_api', [], function _platform_api_module(_es6_module) {
  class PlatformAPIBase  {
     constructor() {

    }
     init() {

    }
     saveFile(path_handle, name, databuf, type) {

    }
     openFile(path_handle) {

    }
     getProcessMemoryPromise() {
      return new Promise(() =>        {      });
    }
     numberOfCPUs() {
      return 2;
    }
     errorDialog(title, msg) {
      console.warn(title+": "+msg);
      alert(title+": "+msg);
    }
     saveDialog(name, databuf, type) {

    }
     openDialog(type) {

    }
     openLastFile() {

    }
     exitCatcher(handler) {

    }
     quitApp() {

    }
     alertDialog(msg) {

    }
     questionDialog(msg) {

    }
  }
  _ESClass.register(PlatformAPIBase);
  _es6_module.add_class(PlatformAPIBase);
  PlatformAPIBase = _es6_module.add_export('PlatformAPIBase', PlatformAPIBase);
  window.setZoom = function (z) {
    let webFrame=require('electron').webFrame;
    webFrame.setZoomFactor(z);
  }
  class NativeAPIBase  {
  }
  _ESClass.register(NativeAPIBase);
  _es6_module.add_class(NativeAPIBase);
  NativeAPIBase = _es6_module.add_export('NativeAPIBase', NativeAPIBase);
}, '/dev/fairmotion/platforms/common/platform_api.js');
es6_module_define('platform_capabilies', [], function _platform_capabilies_module(_es6_module) {
  var PlatCapab={NativeAPI: undefined, 
   save_file: undefined, 
   save_dialog: undefined, 
   open_dialog: undefined, 
   open_last_file: undefined, 
   exit_catcher: undefined, 
   alert_dialog: undefined, 
   question_dialog: undefined}
  PlatCapab = _es6_module.add_export('PlatCapab', PlatCapab);
}, '/dev/fairmotion/platforms/common/platform_capabilies.js');
es6_module_define('platform_utils', [], function _platform_utils_module(_es6_module) {
}, '/dev/fairmotion/platforms/common/platform_utils.js');
es6_module_define('platform', ["../src/config/config.js", "./PhoneGap/platform_phonegap.js", "./chromeapp/platform_chromeapp.js", "./Electron/theplatform.js", "./html5/platform_html5.js"], function _platform_module(_es6_module) {
  var config=es6_import(_es6_module, '../src/config/config.js');
  var html5=es6_import(_es6_module, './html5/platform_html5.js');
  var electron=es6_import(_es6_module, './Electron/theplatform.js');
  var phonegap=es6_import(_es6_module, './PhoneGap/platform_phonegap.js');
  var chromeapp=es6_import(_es6_module, './chromeapp/platform_chromeapp.js');
  let mod;
  if (config.ELECTRON_APP_MODE) {
      mod = electron;
      config.ORIGIN = ".";
      let fs=require("fs");
      if (fs.existsSync("./resources/app/fcontent")) {
          config.ORIGIN = "./resources/app";
      }
  }
  else 
    if (config.HTML5_APP_MODE) {
      mod = html5;
      let o=document.location.href;
      if (o.endsWith("/index.html")) {
          o = o.slice(0, o.length-("/index.html").length);
      }
      config.ORIGIN = o;
  }
  else 
    if (config.PHONE_APP_MODE) {
      mod = phonegay;
  }
  else 
    if (config.CHROME_APP_MODE) {
      mod = chromeapp;
  }
  if (mod.app===undefined) {
      mod.app = new mod.PlatformAPI();
  }
  window.error_dialog = mod.app.errorDialog;
  for (let k in mod) {
      _es6_module.add_export(k, mod[k]);
  }
}, '/dev/fairmotion/platforms/platform.js');
es6_module_define('utildefine', [], function _utildefine_module(_es6_module) {
  var $_mh;
  var $_swapt;
}, '/dev/fairmotion/src/core/utildefine.js');
es6_module_define('view2d_editor', ["../../core/struct.js", "./selectmode.js", "../events.js", "./view2d_base.js"], function _view2d_editor_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var KeyMap=es6_import_item(_es6_module, '../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../events.js', 'EventHandler');
  var ToolModes=es6_import_item(_es6_module, './selectmode.js', 'ToolModes');
  let _ex_EditModes=es6_import_item(_es6_module, './view2d_base.js', 'EditModes');
  _es6_module.add_export('EditModes', _ex_EditModes, true);
  let _ex_EditorTypes=es6_import_item(_es6_module, './view2d_base.js', 'EditorTypes');
  _es6_module.add_export('EditorTypes', _ex_EditorTypes, true);
  let _ex_SessionFlags=es6_import_item(_es6_module, './view2d_base.js', 'SessionFlags');
  _es6_module.add_export('SessionFlags', _ex_SessionFlags, true);
  let v3d_idgen=0;
  class View2DEditor  {
    
    
     constructor(name, editor_type, type, lib_type) {
      this.name = name;
      this._id = v3d_idgen++;
      this.type = type;
      this.editor_type = editor_type;
      this.lib_type = lib_type;
      this.keymap = new KeyMap();
      this.selectmode = 0;
    }
    static  fromSTRUCT(reader) {
      var obj={};
      reader(obj);
      return obj;
    }
     get_keymaps() {
      return [this.keymap];
    }
     on_area_inactive(view2d) {

    }
     editor_duplicate(view2d) {
      throw new Error("implement me!");
    }
     data_link(block, getblock, getblock_us) {

    }
     add_menu(view2d, mpos, add_title=true) {

    }
     on_tick(ctx) {
      let widgets=[WidgetResizeOp, WidgetRotateOp];
      if (ctx.view2d.toolmode==ToolModes.RESIZE) {
          ctx.view2d.widgets.ensure_toolop(ctx, WidgetResizeOp);
      }
      else 
        if (ctx.view2d.toolmode==ToolModes.ROTATE) {
          ctx.view2d.widgets.ensure_toolop(ctx, WidgetRotateOp);
      }
      else {
        for (let cls of widgets) {
            ctx.view2d.widgets.ensure_not_toolop(ctx, cls);
        }
      }
    }
     define_keymap() {
      var k=this.keymap;
    }
     set_selectmode(mode) {
      this.selectmode = mode;
    }
     do_select(event, mpos, view2d, do_multiple) {
      return false;
    }
     tools_menu(ctx, mpos, view2d) {

    }
     on_inactive(view2d) {

    }
     on_active(view2d) {

    }
     rightclick_menu(event, view2d) {

    }
     on_mousedown(event) {

    }
     findnearest(mpos, selectmask, limit, ignore_layers) {

    }
     on_mousemove(event) {
      this.mdown = true;
    }
     on_mouseup(event) {
      this.mdown = false;
    }
     do_alt_select(event, mpos, view2d) {

    }
     gen_edit_menu(add_title=false) {

    }
     delete_menu(event) {

    }
  }
  _ESClass.register(View2DEditor);
  _es6_module.add_class(View2DEditor);
  View2DEditor = _es6_module.add_export('View2DEditor', View2DEditor);
  View2DEditor.STRUCT = `
  View2DEditor {
  }
`;
}, '/dev/fairmotion/src/editors/viewport/view2d_editor.js');
es6_module_define('view2d_object', ["../../core/struct.js", "../../curve/spline_base.js", "./selectmode.js"], function _view2d_object_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_base.js', 'SplineTypes');
  class WorkObjectType  {
     constructor(ctx, selmode) {
      this.ctx = ctx;
      this.selmode = selmode;
    }
     setSelMode(mode) {
      this.selmode = mode;
    }
     findnearest(ctx, p) {
      throw new Error("implement findnearest!");
    }
     iterKeys() {
      throw new Error("want element key iter");
    }
    get  length() {
      throw new Error("need length");
    }
     setCtx(ctx) {
      this.ctx = ctx;
      return this;
    }
     getPos(ei) {
      throw new Error("want a Vector2 for pos");
    }
     setPos(ei, pos) {
      throw new Error("want to set pos");
    }
     getBounds(ei) {
      throw new Error("want [Vector2, Vector2], min/max bounds");
    }
     getSelect(ei) {
      throw new Error("want boolean");
    }
     setSelect(ei, state) {
      throw new Error("want to set selection");
    }
     getVisible(ei) {
      return this.getHide(ei);
    }
     getHide(ei) {
      throw new Error("want to get hide");
    }
     setHide(e1, state) {
      throw new Error("want to set hide");
    }
  }
  _ESClass.register(WorkObjectType);
  _es6_module.add_class(WorkObjectType);
  WorkObjectType = _es6_module.add_export('WorkObjectType', WorkObjectType);
  
  let pos_tmps=cachering.fromConstructor(Vector3, 64);
  function concat_iterator(iter1, iter2) {
    if (iter2===undefined) {
        return iter1;
    }
    else 
      if (iter1===undefined) {
        return iter2;
    }
    return (function* () {
      for (let item of iter1) {
          yield item;
      }
      for (let item of iter2) {
          yield item;
      }
    })();
  }
  class WorkSpline extends WorkObjectType {
     constructor(ctx, selmode, edit_all_layers) {
      super(ctx, selmode);
      this.edit_all_layers = edit_all_layers;
    }
     iterKeys() {
      let ctx=this.ctx;
      let selmode=this.selmode;
      let spline=ctx.spline;
      let iter=undefined;
      if (selmode&SelMask.VERTEX) {
          iter = concat_iterator(iter, spline.verts.editable(ctx));
      }
      if (selmode&SelMask.HANDLE) {
          iter = concat_iterator(iter, spline.handles.editable(ctx));
      }
      if (selmode&SelMask.SEGMENT) {
          iter = concat_iterator(iter, spline.segments.editable(ctx));
      }
      if (selmode&SelMask.FACE) {
          iter = concat_iterator(iter, spline.faces.editable(ctx));
      }
      return (function* () {
        for (let item of iter) {
            yield item.eid;
        }
      })();
    }
     iterSelectedKeys() {
      let ctx=this.ctx;
      let selmode=this.selmode;
      let spline=ctx.spline;
      let iter=undefined;
      if (selmode&SelMask.VERTEX) {
          iter = concat_iterator(iter, spline.verts.selected.editable(ctx));
      }
      if (selmode&SelMask.HANDLE) {
          iter = concat_iterator(iter, spline.handles.selected.editable(ctx));
      }
      if (selmode&SelMask.SEGMENT) {
          iter = concat_iterator(iter, spline.segments.selected.editable(ctx));
      }
      if (selmode&SelMask.FACE) {
          iter = concat_iterator(iter, spline.faces.selected.editable(ctx));
      }
      return (function* () {
        for (let item of iter) {
            yield item.eid;
        }
      })();
    }
    get  length() {
      throw new Error("need length");
    }
     findnearest(ctx, p) {
      throw new Error("implement findnearest!");
    }
     getPos(ei) {
      let spline=this.ctx.spline;
      let e=spline.eidmap[ei];
      if (e===undefined) {
          console.warn("Bad element index", ei, "for spline", spline);
          return undefined;
      }
      if (e.type==SplineTypes.VERTEX||e.type==SplineTypes.HANDLE) {
          return e;
      }
      else 
        if (e.type==SplineTypes.SEGMENT) {
          let p=pos_tmps.next().zero();
          p.load(e.evaluate(0.5));
          return p;
      }
      else 
        if (e.type==SplineTypes.FACE) {
          let p=pos_tmps.next().zero();
          return p.load(e.aabb[0]).interp(e.aabb[1], 0.5);
      }
      else {
        console.warn("bad element type for", e, "type at error time was:", e.type);
        throw new Error("bad element type"+e.type);
      }
      throw new Error("want a Vector2 for pos");
    }
     setPos(ei, pos) {
      let spline=this.ctx.spline;
      let e=spline.eidmap[ei];
      if (e===undefined) {
          console.warn("Bad element index", ei, "for spline", spline);
          return false;
      }
      if (e.type==SplineTypes.VERTEX||e.type==SplineTypes.HANDLE) {
          e.load(pos);
          return true;
      }
      else 
        if (e.type==SplineTypes.SEGMENT) {
          let p=this.getPos(ei);
          p.sub(pos).negate();
          e.v1.add(p);
          e.v2.add(p);
          return true;
      }
      else 
        if (e.type==SplineTypes.FACE) {
          p = this.getPos(ei);
          p.sub(pos).negate();
          for (let v of e.verts) {
              v.add(p);
          }
          return true;
      }
      else {
        console.warn("bad element type for", e, "type at error time was:", e.type);
        throw new Error("bad element type"+e.type);
      }
      return false;
    }
     getBounds(ei) {
      throw new Error("want [Vector2, Vector2], min/max bounds");
    }
     getSelect(ei) {
      throw new Error("want boolean");
    }
     setSelect(ei, state) {
      throw new Error("want to set selection");
    }
     getVisible(ei) {
      throw new Error("implement me");
    }
     getHide(ei) {
      throw new Error("want to hide");
    }
     setHide(e1, state) {
      throw new Error("want to set hide");
    }
  }
  _ESClass.register(WorkSpline);
  _es6_module.add_class(WorkSpline);
  WorkSpline = _es6_module.add_export('WorkSpline', WorkSpline);
  
}, '/dev/fairmotion/src/editors/viewport/view2d_object.js');
es6_module_define('MaterialEditor', ["../../path.ux/scripts/core/ui_base.js", "../../path.ux/scripts/widgets/ui_listbox.js", "../../path.ux/scripts/screen/ScreenArea.js", "../viewport/spline_layerops.js", "../../path.ux/scripts/widgets/ui_menu.js", "../../core/struct.js", "../editor_base.js", "../../path.ux/scripts/widgets/ui_table.js", "../../path.ux/scripts/core/ui.js", "../viewport/spline_editops.js"], function _MaterialEditor_module(_es6_module) {
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var Container=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui.js', 'Container');
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  var PackFlags=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'PackFlags');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var ShiftLayerOrderOp=es6_import_item(_es6_module, '../viewport/spline_editops.js', 'ShiftLayerOrderOp');
  var AddLayerOp=es6_import_item(_es6_module, '../viewport/spline_layerops.js', 'AddLayerOp');
  var DeleteLayerOp=es6_import_item(_es6_module, '../viewport/spline_layerops.js', 'DeleteLayerOp');
  var ChangeLayerOp=es6_import_item(_es6_module, '../viewport/spline_layerops.js', 'ChangeLayerOp');
  var ChangeElementLayerOp=es6_import_item(_es6_module, '../viewport/spline_layerops.js', 'ChangeElementLayerOp');
  es6_import(_es6_module, '../../path.ux/scripts/widgets/ui_table.js');
  es6_import(_es6_module, '../../path.ux/scripts/widgets/ui_menu.js');
  es6_import(_es6_module, '../../path.ux/scripts/widgets/ui_listbox.js');
  function list(iter) {
    let ret=[];
    for (let item of iter) {
        ret.push(item);
    }
    return ret;
  }
  class LayerPanel extends Container {
    
    
    
     constructor(ctx) {
      super(ctx);
      this.last_total_layers = this.last_active_id = 0;
      this.do_rebuild = 1;
      this.delayed_recalc = 0;
    }
     init() {
      super.init();
    }
     update() {
      if (this.do_rebuild) {
          this.rebuild();
          return ;
      }
      super.update();
      if (this.ctx==undefined)
        return ;
      var spline=this.ctx.frameset.spline;
      var do_rebuild=spline.layerset.length!=this.last_total_layers;
      do_rebuild = do_rebuild||spline.layerset.active.id!=this.last_active_id;
      this.do_rebuild|=do_rebuild;
      if (this.delayed_recalc>0) {
          this.delayed_recalc--;
          this.update();
      }
    }
     rebuild() {
      if (this.ctx==undefined)
        return ;
      this.do_rebuild = false;
      console.log("layers ui rebuild!");
      var spline=this.ctx.frameset.spline;
      this.last_total_layers = spline.layerset.length;
      this.last_active_id = spline.layerset.active.id;
      for (let child of this.childNodes) {
          child.remove();
      }
      for (let child of this.shadow.childNodes) {
          child.remove();
      }
      for (let child of this.children) {
          child.remove();
      }
      this.label("Layers");
      let listbox=this.listbox();
      for (var i=spline.layerset.length-1; i>=0; i--) {
          var layer=spline.layerset[i];
          let row=listbox.addItem(layer.name, layer.id);
          console.log("Adding item", layer.name);
      }
      if (spline.layerset.active!==undefined) {
          listbox.setActive(spline.layerset.active.id);
      }
      listbox.onchange = (id, item) =>        {
        var layer=spline.layerset.idmap[id];
        if (layer==undefined) {
            console.log("Error!", arguments);
            return ;
        }
        console.log("Changing layers!", id);
        ChangeLayerOp;
        g_app_state.toolstack.exec_tool(new ChangeLayerOp(id));
      };
      let row=this.row();
      row.iconbutton(Icons.SMALL_PLUS, "Add Layer", () =>        {
        g_app_state.toolstack.exec_tool(new AddLayerOp());
        this.rebuild();
      }, undefined);
      row.iconbutton(Icons.SCROLL_UP, "Move Up", () =>        {
        console.log("Shift layers up");
        var ctx=new Context(), spline=ctx.frameset.spline;
        var layer=spline.layerset.active;
        var tool=new ShiftLayerOrderOp(layer.id, 1);
        g_app_state.toolstack.exec_tool(tool);
        this.rebuild();
      }, undefined);
      row.iconbutton(Icons.SCROLL_DOWN, "Move Down", () =>        {
        console.log("Shift layers down");
        var ctx=new Context(), spline=ctx.frameset.spline;
        var layer=spline.layerset.active;
        var tool=new ShiftLayerOrderOp(layer.id, -1);
        g_app_state.toolstack.exec_tool(tool);
        this.rebuild();
      }, undefined);
      row.iconbutton(Icons.SMALL_MINUS, "Remove Layer", () =>        {
        var tool=new DeleteLayerOp();
        var layer=this.ctx.spline.layerset.active;
        if (layer==undefined)
          return ;
        tool.inputs.layer_id.set_data(layer.id);
        g_app_state.toolstack.exec_tool(tool);
        this.rebuild();
      }, undefined);
      row = this.row();
      row.button("Move Up", () =>        {
        var lset=this.ctx.frameset.spline.layerset;
        var oldl=lset.active;
        console.log("oldl", oldl);
        if (oldl.order===lset.length-1)
          return ;
        var newl=lset[oldl.order+1];
        var tool=new ChangeElementLayerOp(oldl.id, newl.id);
        this.ctx.toolstack.execTool(tool);
      });
      row.button("Move Down", () =>        {
        var lset=this.ctx.frameset.spline.layerset;
        var oldl=lset.active;
        console.log("oldl", oldl);
        if (oldl.order==0)
          return ;
        var newl=lset[oldl.order-1];
        var tool=new ChangeElementLayerOp(oldl.id, newl.id);
        this.ctx.toolstack.execTool(tool);
      });
      row.prop('frameset.drawspline.active_layer.flag[HIDE]');
      row.prop('frameset.drawspline.active_layer.flag[CAN_SELECT]');
      this.flushUpdate();
    }
     _old() {
      return ;
      var controls=this.col();
      var add=new UIButtonIcon(this.ctx, "Add");
      var del=new UIButtonIcon(this.ctx, "Delete");
      add.icon = Icons.SMALL_PLUS;
      del.icon = Icons.SMALL_MINUS;
      var this2=this;
      add.callback = function () {
        g_app_state.toolstack.exec_tool(new AddLayerOp());
      };
      del.callback = function () {
        var tool=new DeleteLayerOp();
        var layer=this.ctx.spline.layerset.active;
        if (layer==undefined)
          return ;
        tool.inputs.layer_id.set_data(layer.id);
        g_app_state.toolstack.exec_tool(tool);
      };
      var up=new UIButtonIcon(this.ctx, "Up", 30);
      var down=new UIButtonIcon(this.ctx, "Down", 29);
      up.icon = Icons.SCROLL_UP;
      down.icon = Icons.SCROLL_DOWN;
      var this2=this;
      down.callback = function () {
        console.log("Shift layers down");
        var ctx=new Context(), spline=ctx.frameset.spline;
        var layer=spline.layerset.active;
        var tool=new ShiftLayerOrderOp(layer.id, -1);
        g_app_state.toolstack.exec_tool(tool);
        this2.rebuild();
      };
      up.callback = function () {
        console.log("Shift layers up");
        var ctx=new Context(), spline=ctx.frameset.spline;
        var layer=spline.layerset.active;
        var tool=new ShiftLayerOrderOp(layer.id, 1);
        g_app_state.toolstack.exec_tool(tool);
        this2.rebuild();
      };
      this.controls = {add: add, 
     del: del, 
     up: up, 
     down: down};
      for (var k in this.controls) {
          controls.add(this.controls[k]);
      }
      var list=this.list = new UIListBox();
      list.size = [200, 250];
      this.add(list);
      for (var i=spline.layerset.length-1; i>=0; i--) {
          var layer=spline.layerset[i];
          list.add_item(layer.name, layer.id);
      }
      list.set_active(spline.layerset.active.id);
      list.callback = function (list, text, id) {
        var layer=spline.layerset.idmap[id];
        if (layer==undefined) {
            console.log("Error!", arguments);
            return ;
        }
        console.log("Changing layers!");
        g_app_state.toolstack.exec_tool(new ChangeLayerOp(id));
      };
      var controls2=this.col();
      let selup=new UIButton(this.ctx, "Sel Up");
      let seldown=new UIButton(this.ctx, "Sel Down");
      controls2.add(selup);
      controls2.add(seldown);
      var this2=this;
      selup.callback = function () {
        var lset=this2.ctx.frameset.spline.layerset;
        var oldl=lset.active;
        console.log("oldl", oldl);
        if (oldl.order==lset.length-1)
          return ;
        var newl=lset[oldl.order+1];
        var tool=new ChangeElementLayerOp(oldl.id, newl.id);
        g_app_state.toolstack.exec_tool(tool);
      };
      seldown.callback = function () {
        var lset=this2.ctx.frameset.spline.layerset;
        var oldl=lset.active;
        console.log("oldl", oldl);
        if (oldl.order==0)
          return ;
        var newl=lset[oldl.order-1];
        var tool=new ChangeElementLayerOp(oldl.id, newl.id);
        g_app_state.toolstack.exec_tool(tool);
      };
      var controls3=this.col();
      controls3.prop('frameset.drawspline.active_layer.flag');
      this.delayed_recalc = 4;
    }
    static  define() {
      return {tagname: "layerpanel-x"}
    }
  }
  _ESClass.register(LayerPanel);
  _es6_module.add_class(LayerPanel);
  
  UIBase.register(LayerPanel);
  class MaterialEditor extends Editor {
     constructor() {
      super();
      this.define_keymap();
    }
     init() {
      if (this.ctx===undefined) {
          this.ctx = new Context();
      }
      super.init();
      this.makeToolbars();
      this.setCSS();
    }
     setCSS() {
      super.setCSS();
      this.style["background-color"] = this.getDefault("DefaultPanelBG");
    }
     makeToolbars() {
      let row=this.container;
      let tabs=row.tabs("right");
      tabs.float(1, 35*UIBase.getDPI(), 7);
      this.strokePanel(tabs);
      this.fillPanel(tabs);
      this.layersPanel(tabs);
      this.vertexPanel(tabs);
      this.update();
    }
     fillPanel(tabs) {
      var ctx=this.ctx;
      let panel=tabs.tab("Fill");
      let panel2=panel.panel("Fill Color");
      panel2.prop("spline.active_face.mat.fillcolor", undefined, "spline.editable_faces{(ctx.spline.layerset.active.id in $.layers) && ($.flag & 1) && !$.hidden}.mat.fillcolor");
      panel.prop("spline.active_face.mat.blur", undefined, "spline.editable_faces{(ctx.spline.layerset.active.id in $.layers) && ($.flag & 1) && !$.hidden}.mat.blur");
      return panel;
    }
     strokePanel(tabs) {
      let panel=tabs.tab("Stroke");
      var ctx=this.ctx;
      var set_prefix="spline.segments{(ctx.spline.layerset.active.id in $.layers) && ($.flag & 1) && !$.hidden}.mat";
      let panel2=panel.panel("Stroke Color");
      panel2.prop("spline.active_segment.mat.strokecolor", undefined, set_prefix+".strokecolor");
      panel.prop("spline.active_segment.mat.linewidth", undefined, set_prefix+".linewidth");
      panel.prop("spline.active_segment.mat.blur", undefined, set_prefix+".blur");
      panel.prop("spline.active_segment.renderable", undefined, "spline.segments{($.flag & 1) && !$.hidden}.renderable");
      panel.prop("spline.active_segment.mat.flag[MASK_TO_FACE]", undefined, set_prefix+".flag[MASK_TO_FACE]");
      return panel;
    }
     layersPanel(tabs) {
      var ctx=this.ctx;
      var panel=tabs.tab("Layers");
      panel.add(document.createElement("layerpanel-x"));
    }
     vertexPanel(tabs) {
      let ctx=this.ctx;
      let tab=tabs.tab("Control Point");
      let set_prefix="spline.verts{(ctx.spline.layerset.active.id in $.layers) && ($.flag & 1) && !$.hidden}";
      let panel=tab.panel("Vertex");
      panel.prop("spline.active_vertex.flag[BREAK_TANGENTS]", undefined, set_prefix+".flag[BREAK_TANGENTS]");
      panel.prop("spline.active_vertex.flag[BREAK_CURVATURES]", undefined, set_prefix+".flag[BREAK_CURVATURES]");
      panel.prop("spline.active_vertex.flag[USE_HANDLES]", undefined, set_prefix+".flag[USE_HANDLES]");
      panel.prop("spline.active_vertex.flag[GHOST]", undefined, set_prefix+".flag[GHOST]");
      panel = tab.panel("Animation Settings");
      set_prefix = "frameset.keypaths{$.animflag & 8}";
      panel.prop("frameset.active_keypath.animflag[STEP_FUNC]", undefined, set_prefix+".animflag[STEP_FUNC]");
      return panel;
    }
     define_keymap() {
      let k=this.keymap;
    }
     copy() {
      return document.createElement("material-editor-x");
    }
    static  define() {
      return {tagname: "material-editor-x", 
     areaname: "material_editor", 
     uiname: "Properties", 
     icon: Icons.MATERIAL_EDITOR}
    }
  }
  _ESClass.register(MaterialEditor);
  _es6_module.add_class(MaterialEditor);
  MaterialEditor = _es6_module.add_export('MaterialEditor', MaterialEditor);
  MaterialEditor.STRUCT = STRUCT.inherit(MaterialEditor, Area)+`
}
`;
  Editor.register(MaterialEditor);
}, '/dev/fairmotion/src/editors/material/MaterialEditor.js');
es6_module_define('DopeSheetEditor', ["../events.js", "../../util/mathlib.js", "../../path.ux/scripts/core/ui.js", "../../curve/spline_types.js", "../../path.ux/scripts/util/simple_events.js", "./dopesheet_ops.js", "../../core/struct.js", "../editor_base.js", "../../curve/spline.js", "../../path.ux/scripts/core/ui_base.js", "./dopesheet_ops_new.js", "../../core/toolops_api.js", "../../path.ux/scripts/util/util.js", "../../core/animdata.js", "../../path.ux/scripts/screen/ScreenArea.js"], function _DopeSheetEditor_module(_es6_module) {
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var css2color=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'css2color');
  var color2css=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'color2css');
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  var ToggleSelectAll=es6_import_item(_es6_module, './dopesheet_ops_new.js', 'ToggleSelectAll');
  var MoveKeyFramesOp=es6_import_item(_es6_module, './dopesheet_ops_new.js', 'MoveKeyFramesOp');
  var SelectKeysOp=es6_import_item(_es6_module, './dopesheet_ops_new.js', 'SelectKeysOp');
  var SelModes2=es6_import_item(_es6_module, './dopesheet_ops_new.js', 'SelModes2');
  var util=es6_import(_es6_module, '../../path.ux/scripts/util/util.js');
  var eventWasTouch=es6_import_item(_es6_module, '../../path.ux/scripts/util/simple_events.js', 'eventWasTouch');
  "use strict";
  var aabb_isect_2d=es6_import_item(_es6_module, '../../util/mathlib.js', 'aabb_isect_2d');
  var KeyMap=es6_import_item(_es6_module, '../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../events.js', 'EventHandler');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var PackFlags=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'PackFlags');
  var UIFlags=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIFlags');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var color2css=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'color2css');
  var _getFont_new=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', '_getFont_new');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolFlags');
  var Spline=es6_import_item(_es6_module, '../../curve/spline.js', 'Spline');
  var RestrictFlags=es6_import_item(_es6_module, '../../curve/spline.js', 'RestrictFlags');
  var CustomDataLayer=es6_import_item(_es6_module, '../../curve/spline_types.js', 'CustomDataLayer');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var SplineSegment=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineSegment');
  var TimeDataLayer=es6_import_item(_es6_module, '../../core/animdata.js', 'TimeDataLayer');
  var get_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'set_vtime');
  var AnimKey=es6_import_item(_es6_module, '../../core/animdata.js', 'AnimKey');
  var AnimChannel=es6_import_item(_es6_module, '../../core/animdata.js', 'AnimChannel');
  var AnimKeyFlags=es6_import_item(_es6_module, '../../core/animdata.js', 'AnimKeyFlags');
  var AnimInterpModes=es6_import_item(_es6_module, '../../core/animdata.js', 'AnimInterpModes');
  var AnimKeyTypes=es6_import_item(_es6_module, '../../core/animdata.js', 'AnimKeyTypes');
  let projrets=cachering.fromConstructor(Vector2, 128);
  const RecalcFlags={CHANNELS: 1, 
   REDRAW_KEYS: 2, 
   ALL: 1|2}
  let treeDebug=0;
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var Container=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui.js', 'Container');
  var ColumnFrame=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui.js', 'ColumnFrame');
  var RowFrame=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui.js', 'RowFrame');
  var SelectKeysToSide=es6_import_item(_es6_module, './dopesheet_ops.js', 'SelectKeysToSide');
  var ShiftTimeOp3=es6_import_item(_es6_module, './dopesheet_ops.js', 'ShiftTimeOp3');
  var tree_packflag=0;
  var CHGT=25;
  class TreeItem extends ColumnFrame {
    
    
    
     constructor() {
      super();
      this.namemap = {};
      this.name = "";
      this._collapsed = false;
      this.parent = undefined;
      this.pathid = -1;
      this.rebuild_intern = this.rebuild_intern.bind(this);
      this._redraw = this._redraw.bind(this);
      let row=this.widget = this.row();
      row.overrideClass("dopesheet");
      this.icon = row.iconbutton(Icons.UI_EXPAND, "", undefined, undefined, PackFlags.SMALL_ICON);
    }
    get  isVisible() {
      if (this.collapsed) {
          return false;
      }
      let p=this;
      while (p) {
        if (p.collapsed)
          return false;
        p = p.parent;
      }
      return true;
    }
     init() {
      super.init();
      let row=this.widget;
      this.icon.addEventListener("mouseup", (e2) =>        {
        this.setCollapsed(!this.collapsed);
        if (treeDebug)
          console.log("click!");
        let e=new CustomEvent("change", {target: this});
        this.dispatchEvent(e);
        if (this.onchange) {
        }
        this.setCSS();
      });
      row.overrideClass("dopesheet");
      row.label(this.name).font = this.getDefault("TreeText");
      this.setCSS();
    }
     setCSS() {
      super.setCSS();
      this.style["margin-left"] = "2px";
      this.style["padding-left"] = "2px";
      if (this.widget!==undefined) {
          this.widget.remove();
          this._prepend(this.widget);
      }
      if (this.icon!==undefined) {
          let i=0;
          for (let k in this.namemap) {
              i++;
          }
          this.icon.hidden = i==0;
      }
    }
     build_path() {
      var path=this.path;
      var p=this;
      while (p!==undefined&&!(__instance_of(p.parent, TreePanel))) {
        p = p.parent;
        path = p.path+"."+path;
      }
      return path;
    }
    get  collapsed() {
      if (treeDebug)
        console.warn("    get collapsed", this._id, this.pathid, this._collapsed);
      return !!this._collapsed;
    }
    set  collapsed(v) {
      if (treeDebug)
        console.warn("    set collapsed directly", v);
      this._collapsed = v;
    }
     setCollapsed(state) {
      if (treeDebug)
        console.warn("setCollapsed", state, this._id);
      if (this.icon!==undefined) {
          this.icon.icon = !state ? Icons.UI_COLLAPSE : Icons.UI_EXPAND;
      }
      if (state&&!this._collapsed) {
          this._collapsed = true;
          for (let k in this.namemap) {
              let child=this.namemap[k];
              if (child.parentNode) {
                  child.remove();
              }
          }
      }
      else 
        if (!state&&this._collapsed) {
          this._collapsed = false;
          for (let k in this.namemap) {
              let child=this.namemap[k];
              this._add(child);
          }
      }
    }
     get_filedata() {
      return {collapsed: this.collapsed}
    }
     load_filedata(data) {
      this.setCollapsed(data.collapsed);
    }
     rebuild_intern() {

    }
     rebuild() {
      this.doOnce(this.rebuild_intern);
    }
     recalc() {
      this.doOnce(this._redraw);
    }
     _redraw() {

    }
    static  define() {
      return {tagname: "dopesheet-treeitem-x", 
     style: "dopesheet"}
    }
  }
  _ESClass.register(TreeItem);
  _es6_module.add_class(TreeItem);
  TreeItem = _es6_module.add_export('TreeItem', TreeItem);
  UIBase.register(TreeItem);
  class TreePanel extends ColumnFrame {
    
    
     constructor() {
      super();
      this.treeData = {};
      this.tree = document.createElement("dopesheet-treeitem-x");
      this.tree.path = "root";
      this.tree.pathid = -1;
      this.add(this.tree);
      this.totpath = 0;
      this.pathmap = {root: this.tree};
      this.rebuild_intern = this.rebuild_intern.bind(this);
      this._redraw = this._redraw.bind(this);
      this._onchange = this._onchange.bind(this);
      this.tree.addEventListener("change", this._onchange);
    }
     init() {
      super.init();
      this._queueDagLink = true;
      this.setCSS();
      this._redraw();
    }
     rebuild_intern() {

    }
     countPaths(visible_only=false) {
      let i=0;
      for (let path in this.pathmap) {
          if (visible_only&&this.pathmap[path].collapsed) {
              continue;
          }
          i++;
      }
      return i;
    }
     saveTreeData(existing_merge=[]) {
      let map={};
      let version=existing_merge[0];
      for (let i=1; i<existing_merge.length; i+=2) {
          let pathid=existing_merge[i];
          let state=existing_merge[i+1];
      }
      for (let k in this.pathmap) {
          let path=this.pathmap[k];
          if (treeDebug)
            console.log("  ", path._id, path._collapsed);
          map[parseInt(path.pathid)] = path._collapsed;
      }
      if (this.tree&&!(this.tree.pathid in map)) {
          map[parseInt(this.tree.pathid)] = this.tree.collapsed;
      }
      let ret=[];
      ret.push(1);
      for (let k in map) {
          ret.push(parseInt(k));
          ret.push(map[k] ? 1 : 0);
      }
      if (treeDebug)
        console.log("saveTreeData", ret);
      return ret;
    }
     loadTreeData(obj) {
      let version=obj[0];
      let map={};
      for (let k in this.pathmap) {
          let path=this.pathmap[k];
          map[path.pathid] = path;
      }
      this.treeData = {};
      if (treeDebug)
        console.log(map, this.pathmap);
      for (let i=1; i<obj.length; i+=2) {
          let pathid=obj[i];
          let state=obj[i+1];
          if (treeDebug)
            console.log("  pathid", pathid, "state", state);
          if (map[pathid]!==undefined) {
              map[pathid].setCollapsed(state);
          }
          this.treeData[pathid] = state;
      }
      if (treeDebug)
        console.log("loadTreeData", obj);
      this.setCSS();
    }
     is_collapsed(path) {
      return path in this.pathmap ? this.pathmap[path].collapsed : false;
    }
     rebuild() {
      this.doOnce(this.rebuild_intern());
    }
     reset() {
      if (treeDebug)
        console.warn("tree reset");
      this.totpath = 0;
      for (let k in this.pathmap) {
          let v=this.pathmap[k];
          v.remove();
      }
      this.pathmap = {};
      this.tree.remove();
      this.tree = document.createElement("dopesheet-treeitem-x");
      this.tree.pathid = -1;
      this.tree.path = "root";
      this.pathmap[this.tree.path] = this.tree;
      this.add(this.tree);
      this.tree.addEventListener("change", this._onchange);
    }
     _onchange(e) {
      let e2=new CustomEvent("change", e);
      this.dispatchEvent(e2);
    }
     _redraw() {
      this.setCSS();
    }
     _rebuild_redraw_all() {
      this._redraw(true);
    }
     recalc() {
      this.doOnce(this._rebuild_redraw_all);
    }
     get_path(path) {
      return this.pathmap[path];
    }
     has_path(path) {
      return path in this.pathmap;
    }
     add_path(path, id) {
      path = path.trim();
      if (id===undefined||typeof id!=="number") {
          throw new Error("id cannot be undefined or non-number");
      }
      var paths=path.split(".");
      var tree=this.tree;
      var lasttree=undefined;
      let idgen=~~(id*32);
      if (paths[0].trim()==="root")
        paths = paths.slice(1, paths.length);
      var path2="";
      for (var i=0; i<paths.length; i++) {
          var key=paths[i].trim();
          if (i===0)
            path2 = key;
          else 
            path2+="."+key;
          if (!(key in tree.namemap)) {
              let tree2=document.createElement("dopesheet-treeitem-x");
              tree2.name = key;
              tree2.path = key;
              tree2.parent = tree;
              tree._prepend(tree2);
              tree2.addEventListener("change", this._onchange);
              tree2.pathid = idgen++;
              if (tree2.ctx) {
              }
              if (this.treeData[tree2.pathid]!==undefined) {
                  tree2.setCollapsed(this.treeData[tree2.pathid]);
              }
              this.pathmap[path2] = tree2;
              tree.namemap[key] = tree2;
          }
          lasttree = tree;
          tree = tree.namemap[key];
      }
      if (!(path in this.pathmap))
        this.totpath++;
      tree.pathid = id;
      this.pathmap[path] = tree;
      this.flushUpdate();
      return tree;
    }
     set_y(path, y) {
      if (typeof path==="string") {
          path = this.pathmap[path];
      }
      if (path) {
          path.style["top"] = (y/UIBase.getDPI())+"px";
      }
    }
     get_y(path) {
      if (typeof path==="string") {
          if (!(path in this.pathmap)) {
              return undefined;
          }
          path = this.pathmap[path];
      }
      let a=this.getClientRects()[0];
      let b=path.getClientRects()[0];
      let dpi=UIBase.getDPI();
      if (a!==undefined&&b!==undefined) {
          return (b.top-a.top)*dpi;
      }
      else {
        return undefined;
      }
    }
     get_x(path) {
      return 0;
    }
     setCSS() {
      super.setCSS();
      this.style["width"] = "55px";
      this.style["height"] = "500px";
    }
    static  define() {
      return {tagname: "dopesheet-treepanel-x", 
     style: "dopesheet"}
    }
  }
  _ESClass.register(TreePanel);
  _es6_module.add_class(TreePanel);
  TreePanel = _es6_module.add_export('TreePanel', TreePanel);
  UIBase.register(TreePanel);
  class ChannelState  {
     constructor(type, state, eid) {
      this.type = type;
      this.state = state;
      this.eid = eid;
    }
  }
  _ESClass.register(ChannelState);
  _es6_module.add_class(ChannelState);
  ChannelState = _es6_module.add_export('ChannelState', ChannelState);
  ChannelState.STRUCT = `
ChannelState {
  type     :  int;
  state    :  bool;
  eid      :  int;
}
`;
  nstructjs.register(ChannelState);
  class PanOp extends ToolOp {
    
    
    
    
    
    
     can_call(ctx) {
      return true;
    }
    static  can_call(ctx) {
      return true;
    }
     constructor(dopesheet) {
      super();
      this.ds = dopesheet;
      this._last_dpi = undefined;
      this.is_modal = true;
      this.undoflag|=UndoFlags.IGNORE_UNDO;
      this.start_pan = new Vector2(dopesheet.pan);
      this.first_draw = true;
      this.start_mpos = new Vector2();
      this.first = true;
      this.start_cameramat = undefined;
      this.cameramat = new Matrix4();
    }
    static  tooldef() {
      return {is_modal: true, 
     toolpath: "dopesheet.pan", 
     undoflag: UndoFlags.IGNORE_UNDO, 
     inputs: {}, 
     outputs: {}, 
     icon: -1}
    }
     modalStart(ctx) {
      this.start_cameramat = new Matrix4(ctx.view2d.cameramat);
    }
     on_mousemove(event) {
      var mpos=new Vector3([event.x, event.y, 0]);
      console.log(event.x, event.y);
      if (this.first) {
          this.first = false;
          this.start_mpos.load(mpos);
          return ;
      }
      var ctx=this.modal_ctx;
      this.ds.pan[0] = this.start_pan[0]+(mpos[0]-this.start_mpos[0]);
      this.ds.pan[1] = this.start_pan[1]+(mpos[1]-this.start_mpos[1]);
      this.ds.buildPositions();
      this.ds.redraw();
      this.ds.update();
    }
     on_mouseup(event) {
      this.modalEnd();
    }
  }
  _ESClass.register(PanOp);
  _es6_module.add_class(PanOp);
  PanOp = _es6_module.add_export('PanOp', PanOp);
  const KX=0, KY=1, KW=2, KH=3, KEID=5, KTYPE=6, KFLAG=7, KTIME=9, KEID2=10, KTOT=11;
  class KeyBox  {
     constructor() {
      this.x = 0;
      this.y = 0;
      this.w = 0;
      this.h = 0;
      this.flag = 0;
      this.eid = 0;
      this.ki = -1;
    }
  }
  _ESClass.register(KeyBox);
  _es6_module.add_class(KeyBox);
  KeyBox = _es6_module.add_export('KeyBox', KeyBox);
  let keybox_temps=util.cachering.fromConstructor(KeyBox, 512);
  let proj_temps=util.cachering.fromConstructor(Vector2, 512);
  class DopeSheetEditor extends Editor {
    
    
    
    
    
    
     constructor() {
      super();
      this.draw = this.draw.bind(this);
      this.mdown = false;
      this.gridGen = 0;
      this.posRegen = 0;
      this.nodes = [];
      this.treeData = [];
      this.activeChannels = [];
      this.activeBoxes = [];
      this.pan = new Vector2();
      this.zoom = 1.0;
      this.timescale = 1.0;
      this.canvas = this.getCanvas("bg");
      this._animreq = undefined;
      this.pinned_ids = [];
      this.keyboxes = [];
      this.keybox_eidmap = {};
      this.boxSize = 15;
      this.start_mpos = new Vector2();
      this.on_mousedown = this.on_mousedown.bind(this);
      this.on_mousemove = this.on_mousemove.bind(this);
      this.on_mouseup = this.on_mouseup.bind(this);
      this.on_keydown = this.on_keydown.bind(this);
      this.addEventListener("mousedown", this.on_mousedown);
      this.addEventListener("mousemove", this.on_mousemove);
      this.addEventListener("mouseup", this.on_mouseup);
      this.channels = document.createElement("dopesheet-treepanel-x");
      this.channels.onchange = (e) =>        {
        console.warn("channels flagged onchange", this.channels.saveTreeData(), this.channels.saveTreeData());
        this.rebuild();
        this.redraw();
      };
      this.define_keymap();
    }
     define_keymap() {
      this.keymap = new KeyMap();
      let k=this.keymap;
      k.add(new HotKey("A", [], "Toggle Select All"), new FuncKeyHandler(function (ctx) {
        console.log("Dopesheet toggle select all!");
        let tool=new ToggleSelectAll();
        ctx.api.execTool(ctx, tool);
        window.force_viewport_redraw();
        window.redraw_viewport();
      }));
      k.add(new HotKey("G", [], "Move Keyframes"), new FuncKeyHandler(function (ctx) {
        console.log("Dopesheet toggle select all!");
        let tool=new MoveKeyFramesOp();
        ctx.api.execTool(ctx, tool);
        window.force_viewport_redraw();
        window.redraw_viewport();
      }));
      k.add(new HotKey("Z", ["CTRL"], "Undo"), new FuncKeyHandler(function (ctx) {
        g_app_state.toolstack.undo();
      }));
      k.add(new HotKey("Z", ["CTRL", "SHIFT"], "Redo"), new FuncKeyHandler(function (ctx) {
        g_app_state.toolstack.redo();
      }));
      k.add(new HotKey("Up", [], "Frame Ahead 10"), new FuncKeyHandler(function (ctx) {
        ctx.scene.change_time(ctx, ctx.scene.time+10);
        window.force_viewport_redraw();
        window.redraw_viewport();
      }));
      k.add(new HotKey("Down", [], "Frame Back 10"), new FuncKeyHandler(function (ctx) {
        ctx.scene.change_time(ctx, ctx.scene.time-10);
        window.force_viewport_redraw();
        window.redraw_viewport();
      }));
      k.add(new HotKey("Right", [], ""), new FuncKeyHandler(function (ctx) {
        console.log("Frame Change!", ctx.scene.time+1);
        ctx.scene.change_time(ctx, ctx.scene.time+1);
        window.redraw_viewport();
      }));
      k.add(new HotKey("Left", [], ""), new FuncKeyHandler(function (ctx) {
        console.log("Frame Change!", ctx.scene.time-1);
        ctx.scene.change_time(ctx, ctx.scene.time-1);
        window.redraw_viewport();
      }));
    }
     get_keymaps() {
      return [this.keymap];
    }
     init() {
      super.init();
      this.channels.float(0, 0);
      this.channels.style["overflow"] = "hidden";
      this.style["overflow"] = "hidden";
      this.shadow.appendChild(this.channels);
      this.header.prop("scene.frame");
      this.header.prop("dopesheet.timescale");
      this._queueDagLink = true;
      this.rebuild();
      this.redraw();
      this.define_keymap();
    }
     dag_unlink_all() {
      for (var node of this.nodes) {
          node.dag_unlink();
      }
      this.nodes = [];
    }
     calcUpdateHash() {
      let hash=0;
      let add=0;
      function dohash(h) {
        h = ((h+add)*((1<<19)-1))&((1<<19)-1);
        add = (add+(1<<25))&((1<<19)-1);
        hash = hash^h;
      }
      let ctx=this.ctx;
      if (!ctx) {
          return 0;
      }
      let spline=ctx.frameset ? ctx.frameset.spline : undefined;
      if (!spline) {
          return 1;
      }
      dohash(spline.verts.selected.length);
      dohash(spline.handles.selected.length);
      dohash(spline.updateGen);
      if (this.canvas) {
          dohash(this.canvas.width);
          dohash(this.canvas.height);
      }
      return hash;
    }
    get  treeData() {
      if (treeDebug)
        console.warn("treeData get", this._treeData);
      return this._treeData;
    }
    set  treeData(v) {
      this._treeData = v;
      if (treeDebug)
        console.warn("treeData set", this._treeData, v);
    }
     update() {
      super.update();
      let hash=this.calcUpdateHash();
      if (hash!==this._last_hash1) {
          console.log("dopesheet hash rebuild update", hash);
          this._last_hash1 = hash;
          this.rebuild();
          this.redraw();
      }
      if (this.regen) {
          this.redraw();
      }
      this.channels.style["top"] = (this.pan[1]*this.zoom/UIBase.getDPI())+"px";
      if (this._queueDagLink) {
          this.linkEventDag();
      }
      if (this.boxSize!==this.getDefault("boxSize")) {
          this.boxSize = this.getDefault("boxSize");
          this.rebuild();
          return ;
      }
      let panupdate=""+this.pan[0]+":"+this.pan[1];
      panupdate+=""+this.zoom+":"+this.timescale;
      if (panupdate!==this._last_panupdate_key) {
          console.log("dopesheet key shape style change detected");
          this._last_panupdate_key = panupdate;
          this.updateKeyPositions();
      }
      let stylekey=""+this.getDefault("lineWidth");
      stylekey+=this.getDefault("lineMajor");
      stylekey+=this.getDefault("lineMinor");
      stylekey+=this.getDefault("keyColor");
      stylekey+=this.getDefault("keySelect");
      stylekey+=this.getDefault("keyHighlight");
      stylekey+=this.getDefault("keyBorder");
      stylekey+=this.getDefault("keyBorderWidth");
      stylekey+=this.getDefault("textShadowColor");
      stylekey+=this.getDefault("textShadowSize");
      stylekey+=this.getDefault("DefaultText").color;
      stylekey+=this.getDefault("DefaultText").size;
      stylekey+=this.getDefault("DefaultText").font;
      if (stylekey!==this._last_style_key_1) {
          console.log("dopesheet style change detected");
          this._last_style_key_1 = stylekey;
          this.redraw();
      }
    }
     project(p) {
      p[0] = (p[0]+this.pan[0])*this.zoom;
      p[1] = (p[1]+this.pan[1])*this.zoom;
    }
     unproject(p) {
      p[0] = p[0]/this.zoom-this.pan[0];
      p[1] = p[1]/this.zoom-this.pan[1];
    }
     rebuild() {
      this.regen = 1;
      this.redraw();
    }
    get  verts() {
      let this2=this;
      if (!this.ctx) {
          this.rebuild();
          return [];
      }
      return (function* () {
        let ctx=this2.ctx;
        if (!ctx)
          return ;
        let spline=ctx.frameset ? ctx.frameset.spline : undefined;
        if (!spline)
          return ;
        for (let v of spline.verts.selected.editable(ctx)) {
            yield v;
        }
        for (let h of spline.handles.selected.editable(ctx)) {
            yield h;
        }
      })();
    }
     on_mousedown(e) {
      this.updateHighlight(e);
      if (!e.button) {
          this.mdown = true;
          this.start_mpos[0] = e.x;
          this.start_mpos[1] = e.y;
      }
      if (!e.button&&this.activeBoxes.highlight!==undefined) {
          let ks=this.keyboxes;
          let ki1=this.activeBoxes.highlight;
          let list=[];
          let x1=ks[ki1+KX], y1=ks[ki1+KY], t1=ks[ki1+KTIME];
          let count=0;
          for (let ki2=0; ki2<ks.length; ki2+=KTOT) {
              let x2=ks[ki2+KX], y2=ks[ki2+KY], t2=ks[ki2+KTIME];
              let eid2=ks[ki2+KEID2];
              if (Math.abs(t2-t1)<1&&Math.abs(y2-y1)<1) {
                  list.push(AnimKeyTypes.SPLINE);
                  list.push(eid2);
                  let flag=ks[ki2+KFLAG];
                  if (flag&AnimKeyFlags.SELECT) {
                      count++;
                  }
              }
          }
          let mode=SelModes2.UNIQUE;
          if (e.shiftKey) {
              mode = count>0 ? SelModes2.SUB : SelModes2.ADD;
          }
          if (eventWasTouch(e)) {
              this.activeBoxes.highlight = undefined;
          }
          let tool=new SelectKeysOp();
          console.log(tool);
          tool.inputs.mode.setValue(mode);
          tool.inputs.keyList.setValue(list);
          this.ctx.toolstack.execTool(this.ctx, tool);
          return ;
      }
      this.ctx.toolstack.execTool(this.ctx, new PanOp(this));
    }
     getLocalMouse(x, y) {
      let r=this.canvas.getClientRects()[0];
      let dpi=UIBase.getDPI();
      let ret=new Vector2();
      if (!r)
        return ret;
      x-=r.x;
      y-=r.y;
      x*=dpi;
      y*=dpi;
      ret[0] = x;
      ret[1] = y;
      return ret;
    }
     findnearest(mpos, limit=25) {
      this.getGrid();
      limit*=UIBase.getDPI();
      let ks=this.keyboxes;
      let p=new Vector2();
      let mindis=1e+17, minret;
      for (let ki of this.activeBoxes) {
          let x=ks[ki+KX], y=ks[ki+KY];
          p[0] = x;
          p[1] = y;
          this.project(p);
          let dist=p.vectorDistance(mpos);
          if (dist<mindis&&dist<limit) {
              minret = ki;
              mindis = dist;
          }
      }
      return minret;
    }
     updateHighlight(e) {
      let mpos=this.getLocalMouse(e.x, e.y);
      let ret=this.findnearest(mpos);
      if (ret!==this.activeBoxes.highlight) {
          this.activeBoxes.highlight = ret;
          this.redraw();
      }
    }
     on_mousemove(e) {
      if (!this.mdown) {
          this.updateHighlight(e);
      }
      else {
        let mpos=new Vector2([e.x, e.y]);
        let dist=this.start_mpos.vectorDistance(mpos);
        console.log(dist.toFixed(2));
        if (dist>10) {
            this.mdown = false;
            console.log("Tool exec!");
            let tool=new MoveKeyFramesOp();
            this.ctx.api.execTool(this.ctx, tool);
        }
      }
    }
     on_mouseup(e) {
      this.mdown = false;
    }
     on_keydown(e) {

    }
     build() {
      if (this.regen===2) {
          return ;
      }
      let timescale=this.timescale;
      let boxsize=this.boxSize;
      let cellwid=boxsize*this.zoom*this.timescale;
      console.warn("rebuilding dopesheet");
      let canvas=this.canvas;
      function getVPath(eid) {
        if (typeof eid!=="number") {
            throw new Error("expected a number for eid "+eid);
        }
        return "spline."+eid;
      }
      let gw=canvas.width>>2;
      let gh=canvas.height>>2;
      let grid=this.grid = new Float64Array(gw*gh);
      grid.width = gw;
      grid.height = gh;
      grid.ratio = 4.0;
      for (let i=0; i<grid.length; i++) {
          grid[i] = -1;
      }
      this.treeData = this.channels.saveTreeData(this.treeData);
      this.channels.reset();
      this.activeChannels = [];
      this.activeBoxes = [];
      this.activeBoxes.highlight = undefined;
      let paths={};
      for (let v of this.verts) {
          let path=this.channels.add_path(getVPath(v.eid), v.eid);
          let key=v.eid;
          paths[v.eid] = path;
          this.activeChannels.push(path);
      }
      this.channels.loadTreeData(this.treeData);
      this.regen = 2;
      this.doOnce(() =>        {
        this.channels.flushUpdate();
      });
      let co1=new Vector2(), co2=new Vector2();
      let stage2=() =>        {
        this.channels.loadTreeData(this.treeData);
        this.regen = 0;
        this.keybox_eidmap = {}
        this.keyboxes.length = 0;
        let frameset=this.ctx.frameset;
        let spline=frameset.spline;
        let keys=this.keyboxes;
        let ts=this.getDefault("DefaultText").size*UIBase.getDPI();
        let lineh=ts*1.5;
        let y=lineh*0.5;
        for (let k in paths) {
            let v=spline.eidmap[k];
            if (!v) {
                console.warn("missing vertex", v.eid);
                this.rebuild();
                return ;
            }
            let path=paths[v.eid];
            if (!path)
              continue;
            if (path.isVisible) {
                y = this.channels.get_y(path)/this.zoom;
                if (y===undefined) {
                    this.regen = 2;
                    window.setTimeout(stage2, 155);
                    return ;
                }
            }
            let vd=frameset.vertex_animdata[v.eid];
            if (!vd) {
                continue;
            }
            let timescale=this.timescale;
            let boxsize=this.boxSize;
            for (let v2 of vd.verts) {
                let ki=keys.length;
                this.keybox_eidmap[v2.eid] = ki;
                for (let i=0; i<KTOT; i++) {
                    keys.push(0.0);
                }
                keys[ki+KTIME] = get_vtime(v2);
                keys[ki+KEID] = v.eid;
                keys[ki+KEID2] = v2.eid;
                keys[ki+KFLAG] = v2.flag&SplineFlags.UI_SELECT ? AnimKeyFlags.SELECT : 0;
                let time=get_vtime(v2);
                co1[0] = this.timescale*time*boxsize;
                co1[1] = y;
                keys[ki+KX] = co1[0];
                keys[ki+KY] = co1[1];
                keys[ki+KW] = boxsize;
                keys[ki+KH] = boxsize;
                this.project(co1);
                let ix=~~((co1[0]+boxsize*0.5)/grid.ratio);
                let iy=~~((co1[1]+boxsize*0.5)/grid.ratio);
                if (ix>=0&&iy>=0&&ix<=grid.width&&iy<=grid.height) {
                    let gi=iy*grid.width+ix;
                    if (grid[gi]<0) {
                        grid[gi] = ki;
                        this.activeBoxes.push(ki);
                    }
                }
            }
        }
        this.redraw();
      };
      window.setTimeout(stage2, 155);
    }
     buildPositions() {
      this.posRegen = 0;
      let ks=this.keyboxes;
      let pathspline=this.ctx.frameset.pathspline;
      let boxsize=this.boxSize;
      for (let ki=0; ki<ks.length; ki+=KTOT) {
          let type=ks[ki+KTYPE], eid=ks[ki+KEID], eid2=ks[ki+KEID2];
          if (type===AnimKeyTypes.SPLINE) {
              let v=pathspline.eidmap[eid2];
              if (!v) {
                  console.warn("Missing vertex animkey in dopesheet; rebuilding. . .");
                  this.rebuild();
                  return ;
              }
              let time=get_vtime(v);
              let x=this.timescale*time*boxsize;
              let flag=0;
              if (v.flag&SplineFlags.UI_SELECT) {
                  flag|=AnimKeyFlags.SELECT;
              }
              ks[ki+KW] = boxsize;
              ks[ki+KH] = boxsize;
              ks[ki+KX] = x;
              ks[ki+KFLAG] = flag;
              ks[ki+KTIME] = get_vtime(v);
          }
          else {
            throw new Error("implement me! '"+type+"'");
          }
      }
      this.updateGrid();
    }
     updateKeyPositions() {
      this.posRegen = 1;
      this.redraw();
    }
     updateGrid() {
      this.gridGen++;
    }
     getGrid() {
      if (!this.grid||this.grid.gen!==this.gridGen) {
          this.recalcGrid();
      }
      return this.grid;
    }
     recalcGrid() {
      console.log("rebuilding grid");
      if (!this.grid) {
          let ratio=4;
          let gw=this.canvas.width>>2, gh=this.canvas.height>>2;
          this.grid = new Float64Array(gw*gh);
          this.grid.width = gw;
          this.grid.height = gh;
          this.grid.ratio = ratio;
      }
      let grid=this.grid;
      grid.gen = this.gridGen;
      let gw=grid.width, gh=grid.height;
      for (let i=0; i<grid.length; i++) {
          grid[i] = -1;
      }
      this.activeBoxes = [];
      let p=new Vector2();
      let ks=this.keyboxes;
      for (let ki=0; ki<ks.length; ki+=KTOT) {
          let x=ks[ki+KX], y=ks[ki+KY], w=ks[ki+KW], h=ks[ki+KH];
          p[0] = x+w*0.5;
          p[1] = y+h*0.5;
          this.project(p);
          let ix=~~(p[0]/grid.ratio);
          let iy=~~(p[1]/grid.ratio);
          if (ix>=0&&iy>=0&&ix<=gw&&iy<=gh) {
              let gi=iy*gw+ix;
              if (grid[gi]<0) {
                  grid[gi] = ki;
                  this.activeBoxes.push(ki);
              }
          }
      }
    }
     getKeyBox(ki) {
      let kd=this.keyboxes;
      let ret=keybox_temps.next();
      ret.x = kd[ki+KX];
      ret.y = kd[ki+KY];
      ret.w = kd[ki+KH];
      ret.h = kd[ki+KW];
      ret.flag = kd[ki+KFLAG];
      ret.eid = kd[ki+KEID];
      return ret;
    }
     redraw() {
      if (!this.isConnected&&this.nodes.length>0) {
          console.warn("Dopesheet editor failed to clean up properly; fixing. . .");
          this.dag_unlink_all();
          return ;
      }
      if (this._animreq!==undefined) {
          return ;
      }
      this._animreq = requestAnimationFrame(this.draw);
    }
     draw() {
      this._animreq = undefined;
      if (this.regen) {
          this.build();
          this.posRegen = 0;
          this.doOnce(this.draw);
          return ;
      }
      else 
        if (this.posRegen) {
          this.buildPositions();
      }
      let boxsize=this.boxSize, timescale=this.timescale;
      let zoom=this.zoom, pan=this.pan;
      let canvas=this.canvas = this.getCanvas("bg", "-1");
      let g=this.canvas.g;
      console.log("dopesheet draw!");
      g.beginPath();
      g.rect(0, 0, canvas.width, canvas.height);
      g.fillStyle = "rgb(55,55,55,1.0)";
      g.fill();
      let bwid=~~(boxsize*zoom*timescale);
      let time=~~(-pan[0]/bwid);
      let off=this.pan[0]%bwid;
      let tot=~~(canvas.width/bwid)+1;
      let major=this.getDefault("lineMajor");
      let minor=this.getDefault("lineMinor");
      let lw1=g.lineWidth;
      g.lineWidth = this.getDefault("lineWidth");
      for (let i=0; i<tot; i++) {
          let x=i*bwid+off;
          let t=~~(time+i);
          if (t%8===0) {
              g.strokeStyle = major;
          }
          else {
            g.strokeStyle = minor;
          }
          g.beginPath();
          g.moveTo(x, 0);
          g.lineTo(x, canvas.height);
          g.stroke();
      }
      g.lineWidth = lw1;
      let ks=this.keyboxes;
      g.beginPath();
      for (let ki=0; ki<ks.length; ki+=KTOT) {
          let x=ks[ki], y=ks[ki+KY], w=ks[ki+KW], h=ks[ki+KH];
          x = (x*zoom)+pan[0];
          y = (y*zoom)+pan[1];
          g.rect(x, y, w, h);
      }
      g.fillStyle = "rgba(125, 125, 125, 1.0)";
      g.fill();
      g.fillStyle = "rgba(250, 250, 250, 0.5)";
      g.beginPath();
      let highlight=this.activeBoxes.highlight;
      let bs=this.boxSize*2;
      let width=canvas.width;
      let height=canvas.height;
      let colors={0: this.getDefault("keyColor"), 
     [AnimKeyFlags.SELECT]: this.getDefault("keySelect")};
      let highColor=this.getDefault("keyHighlight");
      let border=this.getDefault("keyBorder");
      g.strokeStyle = border;
      let lw2=g.lineWidth;
      g.lineWidth = this.getDefault("keyBorderWidth");
      border = css2color(border)[3]<0.01 ? undefined : border;
      for (let ki of this.activeBoxes) {
          let x=ks[ki], y=ks[ki+KY], w=ks[ki+KW], h=ks[ki+KH];
          x = (x*zoom)+pan[0];
          y = (y*zoom)+pan[1];
          let flag=ks[ki+KFLAG]&AnimKeyFlags.SELECT;
          let color=colors[flag];
          g.fillStyle = color;
          g.beginPath();
          g.rect(x, y, w, h);
          g.fill();
          if (border) {
              g.stroke();
          }
          if (x<-bs||y<-bs||x>=width+bs||y>=height+bs) {
              continue;
          }
          if (ki===highlight) {
              g.fillStyle = highColor;
              g.beginPath();
              g.rect(x, y, w, h);
              g.fill();
              if (border) {
                  g.stroke();
              }
          }
      }
      g.lineWidth = lw2;
      console.log("D", off, tot, bwid);
      let ts=this.getDefault("DefaultText").size*UIBase.getDPI();
      g.fillStyle = this.getDefault("DefaultText").color;
      g.font = this.getDefault("DefaultText").genCSS(ts);
      g.strokeStyle = "rgba(0,0,0, 0.5)";
      let lw=g.lineWidth;
      let curtime=this.ctx.scene.time;
      let tx=curtime*this.zoom*this.timescale*boxsize+this.pan[0];
      if (tx>=0&&tx<=this.canvas.width) {
          g.lineWidth = 3;
          g.strokeStyle = this.getDefault("timeLine");
          g.moveTo(tx, 0);
          g.lineTo(tx, this.canvas.height);
          g.stroke();
      }
      g.lineWidth = this.getDefault("textShadowSize");
      g.strokeStyle = this.getDefault("textShadowColor");
      let spacing=Math.floor((ts*4)/bwid);
      for (let i=0; i<tot; i++) {
          let x=i*bwid+off;
          let t=time+i;
          g.shadowBlur = 3.5;
          g.shadowColor = "black";
          g.shadowOffsetX = 2;
          g.shadowOffsetY = 2;
          if (spacing&&(i%spacing)!==0) {
              continue;
          }
          g.strokeText(""+t, x, canvas.height-ts*1.15);
          g.fillText(""+t, x, canvas.height-ts*1.15);
          g.shadowColor = "";
      }
      g.lineWidth = lw;
    }
    static  define() {
      return {tagname: "dopesheet-editor-x", 
     areaname: "dopesheet_editor", 
     uiname: "Animation Keys", 
     icon: Icons.DOPESHEET_EDITOR, 
     style: "dopesheet"}
    }
     on_area_inactive() {
      this.dag_unlink_all();
    }
     on_area_active() {
      this._queueDagLink = true;
      this.doOnce(this.linkEventDag);
    }
     linkEventDag() {
      var ctx=this.ctx;
      if (ctx===undefined) {
          console.log("No ctx for dopesheet editor linkEventDag");
          return ;
      }
      if (this.nodes.length>0) {
          this.dag_unlink_all();
      }
      this._queueDagLink = false;
      let on_sel=() =>        {
        console.log("------------------on sel!----------------");
        return this.on_vert_select(...arguments);
      };
      let on_vert_change=(ctx, inputs, outputs, graph) =>        {
        this.rebuild();
      };
      let on_vert_time_change=(ctx, inputs, outputs, graph) =>        {
        this.updateKeyPositions();
      };
      let on_time_change=(ctx, inputs, outputs, graph) =>        {
        console.log("dopesheet time change callback");
        this.redraw();
      };
      this.nodes.push(on_sel);
      this.nodes.push(on_vert_change);
      this.nodes.push(on_time_change);
      the_global_dag.link(ctx.scene, ["on_time_change"], on_time_change, ["on_time_change"]);
      the_global_dag.link(ctx.frameset.spline.verts, ["on_select_add"], on_sel, ["eid"]);
      the_global_dag.link(ctx.frameset.spline.verts, ["on_select_sub"], on_sel, ["eid"]);
      the_global_dag.link(ctx.frameset.spline, ["on_vert_change"], on_vert_change, ["verts"]);
      the_global_dag.link(ctx.frameset.pathspline, ["on_vert_time_change"], on_vert_time_change, ["verts"]);
    }
     on_vert_select() {
      this.rebuild();
      console.log("on vert select", arguments);
    }
     copy() {
      let ret=document.createElement("dopesheet-editor-x");
      ret.pan[0] = this.pan[0];
      ret.pan[1] = this.pan[1];
      ret.pinned_ids = this.pinned_ids;
      ret.selected_only = this.selected_only;
      ret.time_zero_x = this.time_zero_x;
      ret.timescale = this.timescale;
      ret.zoom = this.zoom;
      return ret;
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.channels.loadTreeData(this.treeData);
    }
  }
  _ESClass.register(DopeSheetEditor);
  _es6_module.add_class(DopeSheetEditor);
  DopeSheetEditor = _es6_module.add_export('DopeSheetEditor', DopeSheetEditor);
  DopeSheetEditor.STRUCT = STRUCT.inherit(DopeSheetEditor, Editor)+`
    pan             : vec2 | this.pan;
    zoom            : float;
    timescale       : float;
    selected_only   : int;
    pinned_ids      : array(int) | this.pinned_ids != undefined ? this.pinned_ids : [];
    treeData        : array(int) | this.channels.saveTreeData();
}
`;
  Editor.register(DopeSheetEditor);
  DopeSheetEditor.debug_only = false;
}, '/dev/fairmotion/src/editors/dopesheet/DopeSheetEditor.js');
es6_module_define('dopesheet_phantom', ["../../core/animdata.js", "../../curve/spline_types.js"], function _dopesheet_phantom_module(_es6_module) {
  "use strict";
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var TimeDataLayer=es6_import_item(_es6_module, '../../core/animdata.js', 'TimeDataLayer');
  var get_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'set_vtime');
  var AnimKey=es6_import_item(_es6_module, '../../core/animdata.js', 'AnimKey');
  var AnimChannel=es6_import_item(_es6_module, '../../core/animdata.js', 'AnimChannel');
  var AnimKeyFlags=es6_import_item(_es6_module, '../../core/animdata.js', 'AnimKeyFlags');
  var AnimInterpModes=es6_import_item(_es6_module, '../../core/animdata.js', 'AnimInterpModes');
  var KeyTypes={PATHSPLINE: 1<<29, 
   DATAPATH: 1<<30, 
   CLEARMASK: ~((1<<29)|(1<<30))}
  KeyTypes = _es6_module.add_export('KeyTypes', KeyTypes);
  var FilterModes={VERTICES: 1, 
   SEGMENTS: 4, 
   FACES: 16}
  FilterModes = _es6_module.add_export('FilterModes', FilterModes);
  class phantom  {
    
    
    
    
     constructor() {
      this.flag = 0;
      this.ds = undefined;
      this.pos = new Vector2(), this.size = new Vector2();
      this.type = KeyTypes.PATHSPLINE;
      this.group = "root";
      this.id = 0;
      this.e = undefined;
      this.ch = undefined;
    }
    get  cached_y() {
      return this.ds.heightmap[this.id];
    }
    get  oldbox() {
      return this.ds.old_keyboxes[this.id];
    }
    get  select() {
      if (this.type==KeyTypes.PATHSPLINE) {
          return this.v.flag&SplineFlags.UI_SELECT;
      }
      else {
        return this.key.flag&AnimKeyFlags.SELECT;
      }
    }
    set  select(val) {
      if (this.type==KeyTypes.PATHSPLINE) {
          this.v.flag|=SplineFlags.UI_SELECT;
      }
      else {
        if (val) {
            this.key.flag|=AnimKeyFlags.SELECT;
        }
        else {
          this.key.flag&=~AnimKeyFlags.SELECT;
        }
      }
    }
     load(b) {
      for (var j=0; j<2; j++) {
          this.pos[j] = b.pos[j];
          this.size[j] = b.size[j];
      }
      this.id = b.id;
      this.type = b.type;
      this.v = b.v;
      this.vd = b.vd;
      this.key = b.key;
      this.ch = b.ch;
    }
  }
  _ESClass.register(phantom);
  _es6_module.add_class(phantom);
  phantom = _es6_module.add_export('phantom', phantom);
  function get_time(ctx, id) {
    if (id&KeyTypes.PATHSPLINE) {
        id = id&KeyTypes.CLEARMASK;
        var v=ctx.frameset.pathspline.eidmap[id];
        return get_vtime(v);
    }
    else {
      id = id&KeyTypes.CLEARMASK;
      var k=ctx.frameset.lib_anim_idmap[id];
      return k.time;
    }
  }
  get_time = _es6_module.add_export('get_time', get_time);
  function set_time(ctx, id, time) {
    if (id&KeyTypes.PATHSPLINE) {
        id = id&KeyTypes.CLEARMASK;
        let spline=ctx.frameset.pathspline;
        var v=spline.eidmap[id];
        set_vtime(spline, v, time);
        v.dag_update("depend");
    }
    else {
      id = id&KeyTypes.CLEARMASK;
      var k=ctx.frameset.lib_anim_idmap[id];
      k.set_time(time);
      k.dag_update("depend");
    }
  }
  set_time = _es6_module.add_export('set_time', set_time);
  function get_select(ctx, id) {
    if (id&KeyTypes.PATHSPLINE) {
        id = id&KeyTypes.CLEARMASK;
        var v=ctx.frameset.pathspline.eidmap[id];
        return v.flag&SplineFlags.UI_SELECT;
    }
    else {
      id = id&KeyTypes.CLEARMASK;
      var k=ctx.frameset.lib_anim_idmap[id];
      return k.flag&AnimKeyFlags.SELECT;
    }
  }
  get_select = _es6_module.add_export('get_select', get_select);
  function set_select(ctx, id, state) {
    if (id&KeyTypes.PATHSPLINE) {
        id = id&KeyTypes.CLEARMASK;
        var v=ctx.frameset.pathspline.eidmap[id];
        var changed=!!(v.flag&SplineFlags.UI_SELECT)!=!!state;
        if (state)
          v.flag|=SplineFlags.UI_SELECT;
        else 
          v.flag&=~SplineFlags.UI_SELECT;
        if (changed)
          v.dag_update("depend");
    }
    else {
      id = id&KeyTypes.CLEARMASK;
      var k=ctx.frameset.lib_anim_idmap[id];
      var changed=!!(k.flag&AnimKeyFlags.SELECT)!=!!state;
      if (state)
        k.flag|=AnimKeyFlags.SELECT;
      else 
        k.flag&=~AnimKeyFlags.SELECT;
      if (changed)
        k.dag_update("depend");
    }
  }
  set_select = _es6_module.add_export('set_select', set_select);
  function delete_key(ctx, id) {
    if (id&KeyTypes.PATHSPLINE) {
        id = id&KeyTypes.CLEARMASK;
        var pathspline=ctx.frameset.pathspline;
        var v=pathspline.eidmap[id];
        var time=get_vtime(v);
        var kcache=ctx.frameset.kcache;
        for (var i=0; i<v.segments.length; i++) {
            var s=v.segments[i], v2=s.other_vert(v), time2=get_vtime(v2);
            var ts=Math.min(time, time2), te=Math.max(time, time2);
            for (var j=ts; j<=te; j++) {
                kcache.invalidate(v2.eid, j);
            }
        }
        v.dag_update("depend");
        pathspline.dissolve_vertex(v);
    }
    else {
      id = id&KeyTypes.CLEARMASK;
      var k=ctx.frameset.lib_anim_idmap[id];
      k.dag_update("depend");
      k.channel.remove(k);
    }
  }
  delete_key = _es6_module.add_export('delete_key', delete_key);
}, '/dev/fairmotion/src/editors/dopesheet/dopesheet_phantom.js');
es6_module_define('dopesheet_transdata', ["../viewport/transdata.js", "../../util/mathlib.js", "../../core/animdata.js"], function _dopesheet_transdata_module(_es6_module) {
  "use strict";
  var MinMax=es6_import_item(_es6_module, '../../util/mathlib.js', 'MinMax');
  var TransDataItem=es6_import_item(_es6_module, '../viewport/transdata.js', 'TransDataItem');
  var TransDataType=es6_import_item(_es6_module, '../viewport/transdata.js', 'TransDataType');
  var get_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'set_vtime');
  class TransKey  {
     constructor(v) {
      this.v = v;
      this.start_time = get_vtime(v);
    }
  }
  _ESClass.register(TransKey);
  _es6_module.add_class(TransKey);
  class TransDopeSheetType  {
    static  apply(ctx, td, item, mat, w) {

    }
    static  undo_pre(ctx, td, undo_obj) {

    }
    static  undo(ctx, undo_obj) {

    }
    static  update(ctx, td) {
      var fs=ctx.frameset;
      fs.check_vdata_integrity();
      window.redraw_ui();
    }
    static  calc_prop_distances(ctx, td, data) {

    }
    static  gen_data(ctx, td, data) {
      var doprop=td.doprop;
      var proprad=td.propradius;
      var vs=new set();
      for (var eid of td.top.inputs.data) {
          var v=ctx.frameset.pathspline.eidmap[eid];
          if (v==undefined) {
              console.log("WARNING: transdata corruption in dopesheet!!");
              continuel;
          }
          vs.add(v);
      }
      for (var v of vs) {
          var titem=new TransDataItem(v, TransDopeSheetType, get_vtime(v));
          data.push(titem);
      }
    }
    static  find_dopesheet(ctx) {
      var active=ctx.screen.active;
      if (__instance_of(active, ScreenArea)&&__instance_of(active.editor, DopeSheetEditor)) {
          return active;
      }
      for (var c of ctx.screen.children) {
          if (__instance_of(c, ScreenArea)&&__instance_of(c.editor, DopeSheetEditor))
            return c;
      }
    }
    static  calc_draw_aabb(ctx, td, minmax) {

    }
    static  aabb(ctx, td, item, minmax, selected_only) {

    }
  }
  _ESClass.register(TransDopeSheetType);
  _es6_module.add_class(TransDopeSheetType);
  TransDopeSheetType = _es6_module.add_export('TransDopeSheetType', TransDopeSheetType);
}, '/dev/fairmotion/src/editors/dopesheet/dopesheet_transdata.js');
es6_module_define('dopesheet_ops', ["./dopesheet_phantom.js", "../../core/toolprops.js", "../../core/animdata.js", "../../core/toolops_api.js"], function _dopesheet_ops_module(_es6_module) {
  "use strict";
  var CollectionProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'CollectionProperty');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  var BoolProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'BoolProperty');
  var EnumProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'EnumProperty');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var TimeDataLayer=es6_import_item(_es6_module, '../../core/animdata.js', 'TimeDataLayer');
  var get_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'set_vtime');
  var AnimKey=es6_import_item(_es6_module, '../../core/animdata.js', 'AnimKey');
  var AnimChannel=es6_import_item(_es6_module, '../../core/animdata.js', 'AnimChannel');
  var AnimKeyFlags=es6_import_item(_es6_module, '../../core/animdata.js', 'AnimKeyFlags');
  var AnimInterpModes=es6_import_item(_es6_module, '../../core/animdata.js', 'AnimInterpModes');
  var get_time=es6_import_item(_es6_module, './dopesheet_phantom.js', 'get_time');
  var set_time=es6_import_item(_es6_module, './dopesheet_phantom.js', 'set_time');
  var get_select=es6_import_item(_es6_module, './dopesheet_phantom.js', 'get_select');
  var set_select=es6_import_item(_es6_module, './dopesheet_phantom.js', 'set_select');
  var KeyTypes=es6_import_item(_es6_module, './dopesheet_phantom.js', 'KeyTypes');
  var FilterModes=es6_import_item(_es6_module, './dopesheet_phantom.js', 'FilterModes');
  var delete_key=es6_import_item(_es6_module, './dopesheet_phantom.js', 'delete_key');
  class ShiftTimeOp2 extends ToolOp {
    
     constructor() {
      super();
      var first=true;
      this.start_mpos = new Vector3();
    }
    static  tooldef() {
      return {apiname: "spline.shift_time2", 
     uiname: "Shift Time2", 
     is_modal: true, 
     inputs: {factor: new FloatProperty(-1, "factor", "factor", "factor"), 
      vertex_eids: new CollectionProperty([], undefined, "verts", "verts")}, 
     outputs: {}, 
     icon: -1, 
     description: "Move keyframes around"}
    }
     get_curframe_animverts(ctx) {
      var vset=new set();
      var spline=ctx.frameset.pathspline;
      for (var eid of this.inputs.vertex_eids) {
          var v=spline.eidmap[eid];
          if (v==undefined) {
              console.warn("ShiftTimeOp2 data corruption! v was undefined!");
              continue;
          }
          vset.add(v);
      }
      return vset;
    }
     start_modal(ctx) {
      this.first = true;
    }
     end_modal(ctx) {
      ToolOp.prototype.end_modal.call(this);
    }
     cancel(ctx) {

    }
     finish(ctx) {
      ctx.scene.change_time(ctx, this.start_time);
    }
     on_mousemove(event) {
      if (this.first) {
          this.start_mpos.load([event.x, event.y, 0]);
          this.first = false;
      }
      var mpos=new Vector3([event.x, event.y, 0]);
      var dx=-Math.floor(1.5*(this.start_mpos[0]-mpos[0])/20+0.5);
      this.undo(this.modal_ctx);
      this.inputs.factor.set_data(dx);
      this.exec(this.modal_ctx);
    }
     on_keydown(event) {
      switch (event.keyCode) {
        case charmap["Escape"]:
          this.cancel(this.modal_ctx);
        case charmap["Return"]:
        case charmap["Space"]:
          this.finish(this.modal_ctx);
          this.end_modal();
      }
    }
     on_mouseup(event) {
      var ctx=this.modal_ctx;
      this.end_modal();
      ctx.frameset.download();
      window.redraw_viewport();
    }
     undo_pre(ctx) {
      var ud=this._undo = {};
      for (var v of this.get_curframe_animverts(ctx)) {
          ud[v.eid] = get_vtime(v);
      }
    }
     undo(ctx) {
      var spline=ctx.frameset.pathspline;
      for (var k in this._undo) {
          var v=spline.eidmap[k], time=this._undo[k];
          set_vtime(spline, v, time);
          v.dag_update("depend");
      }
      ctx.frameset.download();
    }
     exec(ctx) {
      var spline=ctx.frameset.pathspline;
      var starts={};
      var off=this.inputs.factor.data;
      var vset=this.get_curframe_animverts(ctx);
      for (var v of vset) {
          starts[v.eid] = get_vtime(v);
      }
      var frameset=ctx.frameset;
      var vdmap={};
      for (var k in frameset.vertex_animdata) {
          var vd=frameset.vertex_animdata[k];
          for (var v of vd.verts) {
              vdmap[v.eid] = k;
          }
      }
      var kcache=ctx.frameset.kcache;
      for (var v of vset) {
          var eid=vdmap[v.eid];
          var time1=get_vtime(v);
          for (var i=0; i<v.segments.length; i++) {
              var s=v.segments[i], v2=s.other_vert(v), time2=get_vtime(v2);
              var t1=Math.min(time1, time2), t2=Math.max(time1, time2);
              for (var j=t1; j<=t2; j++) {
                  kcache.invalidate(eid, j);
              }
          }
          set_vtime(spline, v, starts[v.eid]+off);
          kcache.invalidate(eid, starts[v.eid]+off);
          v.dag_update("depend");
      }
      for (var v of vset) {
          var min=undefined, max=undefined;
          if (v.segments.length==1) {
              var s=v.segments[0];
              var v2=s.other_vert(v);
              var t1=get_vtime(v), t2=get_vtime(v2);
              if (t1<t2) {
                  min = 0, max = t2;
              }
              else 
                if (t1==t2) {
                  min = max = t1;
              }
              else {
                min = t1, max = 100000;
              }
          }
          else 
            if (v.segments.length==2) {
              var v1=v.segments[0].other_vert(v);
              var v2=v.segments[1].other_vert(v);
              var t1=get_vtime(v1), t2=get_vtime(v2);
              min = Math.min(t1, t2), max = Math.max(t1, t2);
          }
          else {
            min = 0;
            max = 100000;
          }
          var newtime=get_vtime(v);
          newtime = Math.min(Math.max(newtime, min), max);
          set_vtime(spline, v, newtime);
          v.dag_update("depend");
      }
      if (!this.modal_running) {
          ctx.frameset.download();
      }
    }
  }
  _ESClass.register(ShiftTimeOp2);
  _es6_module.add_class(ShiftTimeOp2);
  ShiftTimeOp2 = _es6_module.add_export('ShiftTimeOp2', ShiftTimeOp2);
  class ShiftTimeOp3 extends ToolOp {
    
     constructor() {
      super();
      var first=true;
      this.start_mpos = new Vector3();
    }
    static  tooldef() {
      return {apiname: "spline.shift_time3", 
     uiname: "Shift Time", 
     is_modal: true, 
     inputs: {factor: new FloatProperty(-1, "factor", "factor", "factor"), 
      phantom_ids: new CollectionProperty([], undefined, "phantom_ids", "phantom_ids")}, 
     outputs: {}, 
     icon: -1, 
     description: "Move keyframes around"}
    }
     start_modal(ctx) {
      this.first = true;
    }
     end_modal(ctx) {
      ToolOp.prototype.end_modal.call(this);
    }
     cancel(ctx) {

    }
     finish(ctx) {
      ctx.scene.change_time(ctx, this.start_time);
    }
     on_mousemove(event) {
      if (this.first) {
          this.start_mpos.load([event.x, event.y, 0]);
          this.first = false;
      }
      var mpos=new Vector3([event.x, event.y, 0]);
      let scale;
      let ctx=this.modal_ctx;
      if (ctx.dopesheet) {
          let ds=ctx.dopesheet;
          scale = 1.0/(ds.timescale*ds.zoom*ds.boxSize);
      }
      else {
        scale = 0.01;
        console.warn("Warning, no dopesheet");
      }
      var dx=-Math.floor((this.start_mpos[0]-mpos[0])*scale);
      this.do_undo(this.modal_ctx, true);
      this.inputs.factor.set_data(dx);
      this.exec(this.modal_ctx);
    }
     on_keydown(event) {
      switch (event.keyCode) {
        case charmap["Escape"]:
          this.cancel(this.modal_ctx);
        case charmap["Return"]:
        case charmap["Space"]:
          this.finish(this.modal_ctx);
          this.end_modal();
      }
    }
     on_mouseup(event) {
      var ctx=this.modal_ctx;
      this.end_modal();
      ctx.frameset.download();
      window.redraw_viewport();
    }
     undo_pre(ctx) {
      var ud=this._undo = {};
      for (var id of this.inputs.phantom_ids) {
          ud[id] = get_time(ctx, id);
      }
    }
     do_undo(ctx, no_download=false) {
      for (var k in this._undo) {
          set_time(ctx, k, this._undo[k]);
      }
      if (!no_download)
        ctx.frameset.download();
    }
     undo(ctx) {
      this.do_undo(ctx);
    }
     exec(ctx) {
      var spline=ctx.frameset.pathspline;
      var starts={};
      var off=this.inputs.factor.data;
      var ids=this.inputs.phantom_ids;
      for (var id of ids) {
          starts[id] = get_time(ctx, id);
      }
      var frameset=ctx.frameset;
      var vdmap={};
      for (var k in frameset.vertex_animdata) {
          var vd=frameset.vertex_animdata[k];
          for (var v of vd.verts) {
              vdmap[v.eid] = k;
          }
      }
      var kcache=ctx.frameset.kcache;
      for (var id of ids) {
          set_time(ctx, id, starts[id]+off);
      }
      for (var id of ids) {
          var min=undefined, max=undefined;
          if (id&KeyTypes.PATHSPLINE) {
              var v=ctx.frameset.pathspline.eidmap[id&KeyTypes.CLEARMASK];
              if (v.segments.length==1) {
                  var s=v.segments[0];
                  var v2=s.other_vert(v);
                  var t1=get_vtime(v), t2=get_vtime(v2);
                  if (t1<t2) {
                      min = 0, max = t2;
                  }
                  else 
                    if (t1==t2) {
                      min = max = t1;
                  }
                  else {
                    min = t1, max = 100000;
                  }
              }
              else 
                if (v.segments.length==2) {
                  var v1=v.segments[0].other_vert(v);
                  var v2=v.segments[1].other_vert(v);
                  var t1=get_vtime(v1), t2=get_vtime(v2);
                  min = Math.min(t1, t2), max = Math.max(t1, t2);
              }
              else {
                min = 0;
                max = 100000;
              }
              var eid=vdmap[v.eid];
              for (var j=min; j<max; j++) {

              }
              var newtime=get_vtime(v);
              newtime = Math.min(Math.max(newtime, min), max);
              set_vtime(spline, v, newtime);
              v.dag_update("depend");
          }
      }
      if (!this.modal_running) {
          console.log("download");
          ctx.frameset.download();
      }
    }
  }
  _ESClass.register(ShiftTimeOp3);
  _es6_module.add_class(ShiftTimeOp3);
  ShiftTimeOp3 = _es6_module.add_export('ShiftTimeOp3', ShiftTimeOp3);
  class SelectOpBase extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {inputs: {phantom_ids: new CollectionProperty([], undefined, "phantom_ids", "phantom_ids")}, 
     outputs: {}}
    }
     undo_pre(ctx) {
      var undo=this._undo = {};
      for (var id of this.inputs.phantom_ids) {
          undo[id] = get_select(ctx, id);
      }
    }
     undo(ctx) {
      var undo=this._undo;
      for (var id in undo) {
          set_select(ctx, id, undo[id]);
      }
    }
  }
  _ESClass.register(SelectOpBase);
  _es6_module.add_class(SelectOpBase);
  SelectOpBase = _es6_module.add_export('SelectOpBase', SelectOpBase);
  class SelectOp extends SelectOpBase {
    
     constructor() {
      super();
      this.uiname = "Select";
    }
    static  tooldef() {
      return {apiname: "spline.select_keyframe", 
     uiname: "Select Keyframe", 
     is_modal: false, 
     inputs: ToolOp.inherit({select_ids: new CollectionProperty([], undefined, "select_ids", "select_ids"), 
      phantom_ids: new CollectionProperty([], undefined, "phantom_ids", "phantom_ids"), 
      state: new BoolProperty(true, "state"), 
      unique: new BoolProperty(true, "unique")}), 
     outputs: {}, 
     icon: -1, 
     description: "Select keyframes"}
    }
     exec(ctx) {
      var state=this.inputs.state.data;
      if (this.inputs.unique.data) {
          for (var id of this.inputs.phantom_ids) {
              set_select(ctx, id, false);
          }
      }
      for (var id of this.inputs.select_ids) {
          set_select(ctx, id, state);
      }
    }
  }
  _ESClass.register(SelectOp);
  _es6_module.add_class(SelectOp);
  SelectOp = _es6_module.add_export('SelectOp', SelectOp);
  class ColumnSelect extends SelectOpBase {
     constructor() {
      super();
    }
    static  tooldef() {
      return {apiname: "spline.select_keyframe_column", 
     uiname: "Column Select", 
     is_modal: false, 
     inputs: ToolOp.inherit({state: new BoolProperty(true, "state"), 
      phantom_ids: new CollectionProperty([], undefined, "phantom_ids", "phantom_ids")}), 
     outputs: {}, 
     icon: -1, 
     description: "Select keyframes in a single column"}
    }
     exec(ctx) {
      var cols={};
      var state=this.inputs.state.data;
      for (var id of this.inputs.phantom_ids) {
          if (get_select(ctx, id))
            cols[get_time(ctx, id)] = 1;
      }
      for (var id of this.inputs.phantom_ids) {
          if (!(get_time(ctx, id) in cols))
            continue;
          set_select(ctx, id, state);
      }
    }
  }
  _ESClass.register(ColumnSelect);
  _es6_module.add_class(ColumnSelect);
  ColumnSelect = _es6_module.add_export('ColumnSelect', ColumnSelect);
  class SelectKeysToSide extends SelectOpBase {
     constructor() {
      super();
    }
    static  tooldef() {
      return {apiname: "spline.select_keys_to_side", 
     uiname: "Select Keys To Side", 
     is_modal: false, 
     inputs: ToolOp.inherit({state: new BoolProperty(true, "state"), 
      phantom_ids: new CollectionProperty([], undefined, "phantom_ids", "phantom_ids"), 
      side: new BoolProperty(true, "side")}), 
     outputs: {}, 
     icon: -1, 
     description: "Select keyframes before or after the cursor"}
    }
     exec(ctx) {
      var state=this.inputs.state.data;
      var mintime=1e+17, maxtime=-1e+17;
      for (var id of this.inputs.phantom_ids) {
          if (!get_select(ctx, id))
            continue;
          var time=get_time(ctx, id);
          mintime = Math.min(mintime, time);
          maxtime = Math.max(maxtime, time);
      }
      if (mintime==1e+17) {
          mintime = maxtime = ctx.scene.time;
      }
      var side=this.inputs.side.data;
      for (var id of this.inputs.phantom_ids) {
          var time=get_time(ctx, id);
          if ((side&&time<maxtime)||(!side&&time>mintime))
            continue;
          set_select(ctx, id, state);
      }
    }
  }
  _ESClass.register(SelectKeysToSide);
  _es6_module.add_class(SelectKeysToSide);
  SelectKeysToSide = _es6_module.add_export('SelectKeysToSide', SelectKeysToSide);
  var mode_vals=["select", "deselect", "auto"];
  mode_vals = _es6_module.add_export('mode_vals', mode_vals);
  class ToggleSelectOp extends SelectOpBase {
     constructor(mode="auto") {
      super();
      this.inputs.mode.set_data(mode);
    }
    static  tooldef() {
      return {apiname: "spline.toggle_select_keys", 
     uiname: "Select Keyframe Selection", 
     is_modal: false, 
     inputs: ToolOp.inherit({phantom_ids: new CollectionProperty([], undefined, "phantom_ids", "phantom ids"), 
      mode: new EnumProperty("auto", mode_vals, "mode", "Mode", "mode")}), 
     outputs: {}, 
     icon: -1, 
     description: "Select all keyframes, or deselect them if already selected"}
    }
     exec(ctx) {
      var mode=this.inputs.mode.data;
      if (mode=="auto") {
          mode = "select";
          for (var id of this.inputs.phantom_ids) {
              if (get_select(ctx, id))
                mode = "deselect";
          }
      }
      mode = mode=="select" ? true : false;
      for (var id of this.inputs.phantom_ids) {
          set_select(ctx, id, mode);
      }
    }
  }
  _ESClass.register(ToggleSelectOp);
  _es6_module.add_class(ToggleSelectOp);
  ToggleSelectOp = _es6_module.add_export('ToggleSelectOp', ToggleSelectOp);
  class DeleteKeyOp extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {apiname: "spline.delete_key", 
     uiname: "Delete Keyframe", 
     is_modal: false, 
     inputs: {phantom_ids: new CollectionProperty([], undefined, "phantom_ids", "phantom ids")}, 
     outputs: {}, 
     icon: -1, 
     description: "Delete a keyframe"}
    }
     exec(ctx) {
      for (var id of this.inputs.phantom_ids) {
          if (get_select(ctx, id)) {
              delete_key(ctx, id);
          }
      }
    }
  }
  _ESClass.register(DeleteKeyOp);
  _es6_module.add_class(DeleteKeyOp);
  DeleteKeyOp = _es6_module.add_export('DeleteKeyOp', DeleteKeyOp);
  
}, '/dev/fairmotion/src/editors/dopesheet/dopesheet_ops.js');
es6_module_define('dopesheet_ops_new', ["../../path.ux/scripts/util/util.js", "../../core/animdata.js", "../../path.ux/scripts/util/vectormath.js", "../../curve/spline_base.js", "../../core/toolprops.js", "../../core/toolops_api.js"], function _dopesheet_ops_new_module(_es6_module) {
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var AnimKeyFlags=es6_import_item(_es6_module, '../../core/animdata.js', 'AnimKeyFlags');
  var AnimKeyTypes=es6_import_item(_es6_module, '../../core/animdata.js', 'AnimKeyTypes');
  var get_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'set_vtime');
  var ListProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'ListProperty');
  var EnumProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'EnumProperty');
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  var Vec2Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec2Property');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var BoolProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'BoolProperty');
  var IntArrayProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntArrayProperty');
  var util=es6_import(_es6_module, '../../path.ux/scripts/util/util.js');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_base.js', 'SplineFlags');
  var Vector2=es6_import_item(_es6_module, '../../path.ux/scripts/util/vectormath.js', 'Vector2');
  class KeyIterItem  {
    
     getFlag() {

    }
     setFlag() {

    }
     getTime() {

    }
     setTime() {

    }
     setSelect(state) {
      if (state) {
          this.setFlag(this.getFlag()|AnimKeyFlags.SELECT);
      }
      else {
        this.setFlag(this.getFlag()&~AnimKeyFlags.SELECT);
      }
    }
     getValue() {
      throw new Error("implement me");
    }
     setValue() {
      throw new Error("implement me");
    }
     getId() {
      throw new Error("implement me");
    }
  }
  _ESClass.register(KeyIterItem);
  _es6_module.add_class(KeyIterItem);
  KeyIterItem = _es6_module.add_export('KeyIterItem', KeyIterItem);
  class VertKeyIterItem extends KeyIterItem {
     constructor() {
      super();
      this.v = undefined;
      this.spline = undefined;
      this.type = AnimKeyTypes.SPLINE;
    }
     getId() {
      return this.v.eid;
    }
     getFlag() {
      let flag=0;
      if (this.v.flag&SplineFlags.UI_SELECT) {
          flag|=AnimKeyFlags.SELECT;
      }
      return flag;
    }
     setFlag(flag) {
      if (flag&AnimKeyFlags.SELECT) {
          this.v.flag|=SplineFlags.UI_SELECT;
      }
      else {
        this.v.flag&=~SplineFlags.UI_SELECT;
      }
      return this;
    }
     getTime() {
      return get_vtime(this.v);
    }
     setTime(time) {
      if (isNaN(time)) {
          throw new Error("Time was NaN!");
      }
      set_vtime(this.spline, this.v, time);
    }
     init(spline, v) {
      this.spline = spline;
      this.v = v;
      return this;
    }
     destroy() {
      this.spline = undefined;
      this.v = undefined;
    }
  }
  _ESClass.register(VertKeyIterItem);
  _es6_module.add_class(VertKeyIterItem);
  VertKeyIterItem = _es6_module.add_export('VertKeyIterItem', VertKeyIterItem);
  class DataPathKeyItem extends VertKeyIterItem {
     constructor(datapath) {
      this.path = datapath;
      throw new Error("implement me");
    }
  }
  _ESClass.register(DataPathKeyItem);
  _es6_module.add_class(DataPathKeyItem);
  DataPathKeyItem = _es6_module.add_export('DataPathKeyItem', DataPathKeyItem);
  let vkey_cache=util.cachering.fromConstructor(VertKeyIterItem, 32);
  let UEID=0, UTIME=1, UFLAG=2, UX=3, UY=4, UTOT=5;
  class AnimKeyTool extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {inputs: {useKeyList: new BoolProperty(), 
      keyList: new IntArrayProperty()}}
    }
    * iterKeys(ctx, useKeyList=this.inputs.useKeyList.getValue()) {
      if (useKeyList) {
          let list=this.inputs.keyList.getValue();
          let pathspline=ctx.frameset.pathspline;
          for (let i=0; i<list.length; i+=2) {
              let type=list[i], id=list[i+1];
              if (type===AnimKeyTypes.SPLINE) {
                  let v=pathspline.eidmap[id];
                  if (!v) {
                      console.warn("Error iterating spline animation keys; key could not be found", id, pathspline);
                      continue;
                  }
                  yield vkey_cache.next().init(pathspline, v);
              }
              else {
                throw new Error("implement me!");
              }
          }
      }
      else {
        console.warn("basic iter");
        let frameset=ctx.frameset;
        let spline=frameset.spline;
        let pathspline=frameset.pathspline;
        for (var i2=0; i2<2; i2++) {
            let list=i2 ? spline.handles : spline.verts;
            for (let v of list.selected.editable(ctx)) {
                if (!(v.eid in frameset.vertex_animdata)) {
                    continue;
                }
                let vd=frameset.vertex_animdata[v.eid];
                for (let v2 of vd.verts) {
                    yield vkey_cache.next().init(pathspline, v2);
                }
            }
        }
      }
    }
     undoPre(ctx) {
      this.undo_pre(ctx);
    }
     undo_pre(ctx) {
      let spline=[];
      let _undo=this._undo = {spline: spline};
      let vset=new Set();
      for (let i=0; i<2; i++) {
          for (let key of this.iterKeys(ctx, i)) {
              if (key.type===AnimKeyTypes.SPLINE) {
                  if (vset.has(key.v.eid)) {
                      continue;
                  }
                  vset.add(key.v.eid);
                  spline.push(key.v.eid);
                  spline.push(get_vtime(key.v));
                  spline.push(key.v.flag);
                  spline.push(key.v[0]);
                  spline.push(key.v[1]);
              }
              else {
                throw new Error("implement me!");
              }
          }
      }
    }
     undo(ctx) {
      let list=this._undo.spline;
      let spline=ctx.frameset.pathspline;
      for (let i=0; i<list.length; i+=UTOT) {
          let eid=list[i], time=list[i+1], flag=list[i+2];
          let x=list[i+3], y=list[i+4];
          let v=spline.eidmap[eid];
          if (!v) {
              console.warn("EEK! Misssing vertex/handle in AnimKeyTool.undo!");
              continue;
          }
          let do_update=Math.abs(x-v[0])>0.001||Math.abs(y-v[1])>0.001;
          v.flag = flag;
          set_vtime(spline, v, time);
          v[0] = x;
          v[1] = y;
          if (do_update) {
              v.flag|=SplineFlags.UPDATE;
          }
      }
    }
     exec(ctx) {
      ctx.frameset.spline.updateGen++;
      window.redraw_viewport();
    }
  }
  _ESClass.register(AnimKeyTool);
  _es6_module.add_class(AnimKeyTool);
  AnimKeyTool = _es6_module.add_export('AnimKeyTool', AnimKeyTool);
  const SelModes={AUTO: 0, 
   ADD: 1, 
   SUB: 2}
  _es6_module.add_export('SelModes', SelModes);
  class ToggleSelectAll extends AnimKeyTool {
     constructor() {
      super();
    }
    static  tooldef() {
      return {uiname: "Toggle Select All (Keys)", 
     toolpath: "animkeys.toggle_select_all()", 
     inputs: ToolOp.inherit({mode: new EnumProperty("AUTO", SelModes)})}
    }
     exec(ctx) {
      console.log("Anim Key Toggle Select Tool!");
      let mode=this.inputs.mode.getValue();
      let count=0;
      if (mode===SelModes.AUTO) {
          mode = SelModes.ADD;
          for (let key of this.iterKeys(ctx)) {
              let flag=key.getFlag();
              if (flag&AnimKeyFlags.SELECT) {
                  mode = SelModes.SUB;
                  break;
              }
          }
      }
      console.log("mode, count", mode, count);
      for (let key of this.iterKeys(ctx)) {
          if (mode===SelModes.ADD) {
              key.setFlag(key.getFlag()|AnimKeyFlags.SELECT);
          }
          else {
            key.setFlag(key.getFlag()&~AnimKeyFlags.SELECT);
          }
      }
      super.exec(ctx);
    }
     undo(ctx) {
      super.undo(ctx);
      if (ctx.dopesheet) {
          ctx.dopesheet.updateKeyPositions();
      }
    }
  }
  _ESClass.register(ToggleSelectAll);
  _es6_module.add_class(ToggleSelectAll);
  ToggleSelectAll = _es6_module.add_export('ToggleSelectAll', ToggleSelectAll);
  class MoveKeyFramesOp extends AnimKeyTool {
     constructor() {
      super();
      this.first = true;
      this.last_mpos = new Vector2();
      this.start_mpos = new Vector2();
      this.sum = 0.0;
      this.transdata = [];
    }
     on_mousemove(e) {
      let ctx=this.modal_ctx;
      if (this.first) {
          this.last_mpos[0] = e.x;
          this.last_mpos[1] = e.y;
          this.start_mpos[0] = e.x;
          this.start_mpos[1] = e.y;
          this.first = false;
          this.sum = 0.0;
          this.transdata.length = 0;
          for (let key of this.iterKeys(ctx)) {
              if (!(key.getFlag()&AnimKeyFlags.SELECT)) {
                  continue;
              }
              this.transdata.push(key.getTime());
          }
          return ;
      }
      let dx=e.x-this.last_mpos[0], dy=e.y-this.last_mpos[1];
      let dopesheet=ctx.dopesheet;
      dx = e.x-this.start_mpos[0];
      if (dopesheet) {
          let boxsize=dopesheet.boxSize;
          dx/=dopesheet.zoom*dopesheet.timescale*boxsize;
      }
      else {
        dx*=0.1;
        console.error("MISSING DOPESHEET");
      }
      if (dx===undefined) {
          throw new Error("eek!");
      }
      this.inputs.delta.setValue(dx);
      let i=0;
      let td=this.transdata;
      for (let key of this.iterKeys(ctx)) {
          if (!(key.getFlag()&AnimKeyFlags.SELECT)) {
              continue;
          }
          key.setTime(td[i]);
          i++;
      }
      this.exec(ctx);
      if (dopesheet) {
          dopesheet.updateKeyPositions();
      }
      console.log(dx, dy, dopesheet!==undefined);
      this.last_mpos[0] = e.x;
      this.last_mpos[1] = e.y;
    }
     exec(ctx, dx_override=undefined) {
      let dx=this.inputs.delta.getValue();
      if (dx_override) {
          dx = dx_override;
      }
      for (let key of this.iterKeys(ctx)) {
          if (!(key.getFlag()&AnimKeyFlags.SELECT)) {
              continue;
          }
          let time=key.getTime();
          key.setTime(Math.floor(time+dx+0.5));
      }
      ctx.frameset.pathspline.flagUpdateVertTime();
    }
     undo(ctx) {
      super.undo(ctx);
      if (ctx.dopesheet) {
          ctx.dopesheet.updateKeyPositions();
      }
    }
     on_keydown(e) {
      if (e.keyCode===27) {
          this.end_modal();
      }
    }
     on_mousedown(e) {
      this.end_modal();
    }
     on_mouseup(e) {
      this.end_modal();
    }
    static  tooldef() {
      return {name: "Move Keyframes", 
     toolpath: "anim.movekeys", 
     is_modal: true, 
     inputs: ToolOp.inherit({delta: new FloatProperty()})}
    }
  }
  _ESClass.register(MoveKeyFramesOp);
  _es6_module.add_class(MoveKeyFramesOp);
  MoveKeyFramesOp = _es6_module.add_export('MoveKeyFramesOp', MoveKeyFramesOp);
  const SelModes2={UNIQUE: 0, 
   ADD: 1, 
   SUB: 2}
  _es6_module.add_export('SelModes2', SelModes2);
  class SelectKeysOp extends AnimKeyTool {
     constructor() {
      super();
      this.inputs.useKeyList.setValue(true);
    }
    static  tooldef() {
      return {name: "Select Keyframes", 
     toolpath: "anim.select", 
     inputs: ToolOp.inherit({mode: new EnumProperty("UNIQUE", SelModes2)})}
    }
     exec(ctx) {
      let mode=this.inputs.mode.getValue();
      console.log("select mode:", mode);
      if (mode===SelModes2.UNIQUE) {
          for (let key of this.iterKeys(ctx, false)) {
              key.setSelect(false);
          }
      }
      let state=mode===SelModes2.UNIQUE||mode===SelModes2.ADD;
      for (let key of this.iterKeys(ctx)) {
          key.setSelect(state);
      }
      ctx.frameset.pathspline.flagUpdateVertTime();
    }
     undo(ctx) {
      super.undo(ctx);
      ctx.frameset.pathspline.flagUpdateVertTime();
      if (ctx.dopesheet) {
          ctx.dopesheet.updateKeyPositions();
          ctx.dopesheet.redraw();
      }
    }
  }
  _ESClass.register(SelectKeysOp);
  _es6_module.add_class(SelectKeysOp);
  SelectKeysOp = _es6_module.add_export('SelectKeysOp', SelectKeysOp);
}, '/dev/fairmotion/src/editors/dopesheet/dopesheet_ops_new.js');
es6_module_define('editcurve_ops', [], function _editcurve_ops_module(_es6_module) {
}, '/dev/fairmotion/src/editors/curve/editcurve_ops.js');
es6_module_define('editcurve_util', [], function _editcurve_util_module(_es6_module) {
}, '/dev/fairmotion/src/editors/curve/editcurve_util.js');
es6_module_define('CurveEditor', ["../../path.ux/scripts/pathux.js", "../../path.ux/scripts/screen/ScreenArea.js", "../../path.ux/scripts/util/simple_events.js", "../editor_base.js", "../../path.ux/scripts/util/vectormath.js", "../../path.ux/scripts/core/ui_base.js", "../../core/struct.js"], function _CurveEditor_module(_es6_module) {
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  var Vector2=es6_import_item(_es6_module, '../../path.ux/scripts/util/vectormath.js', 'Vector2');
  var DropBox=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'DropBox');
  var pushModalLight=es6_import_item(_es6_module, '../../path.ux/scripts/util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../../path.ux/scripts/util/simple_events.js', 'popModalLight');
  function startPan(edit, x, y) {
    if (edit._modaldata) {
        popModalLight(edit._modaldata);
        edit._modaldata = undefined;
        return ;
    }
    let startmpos=new Vector2([x, y]);
    let lastmpos=new Vector2([x, y]);
    let mpos=new Vector2();
    let dv=new Vector2();
    let first=true;
    edit._modaldata = pushModalLight({on_mousedown: function on_mousedown(e) {
      }, 
    on_mousemove: function on_mousemove(e) {
        lastmpos.load(mpos);
        mpos[0] = e.x;
        mpos[1] = e.y;
        if (first) {
            first = false;
            return ;
        }
        dv.load(mpos).sub(lastmpos);
        edit.pan.add(dv);
        edit.redraw();
      }, 
    on_mouseup: function on_mouseup(e) {
        this.stop();
      }, 
    stop: function stop() {
        if (edit._modaldata) {
            popModalLight(edit._modaldata);
            edit._modaldata = undefined;
        }
      }, 
    on_keydown: function on_keydown(e) {
        if (e.keyCode===27) {
            this.stop();
        }
      }});
  }
  class CurveEdit extends UIBase {
     constructor() {
      super();
      this.curvePaths = [];
      this._drawreq = false;
      this.size = new Vector2([512, 512]);
      this.canvas = document.createElement("canvas");
      this.g = this.canvas.getContext("2d");
      this.shadow.appendChild(this.canvas);
      this.pan = new Vector2();
      this.zoom = new Vector2([1, 1]);
      this.addEventListener("mousedown", this.on_mousedown.bind(this));
      this.addEventListener("mousemove", this.on_mousemove.bind(this));
      this.addEventListener("mouseup", this.on_mouseup.bind(this));
    }
     on_mousedown(e) {
      this.mdown = true;
      startPan(this);
      console.log("mdown");
    }
     on_mousemove(e) {
      console.log("mmove");
    }
     on_mouseup(e) {
      console.log("mup");
      this.mdown = false;
    }
     init() {
      super.init();
    }
     redraw() {
      if (this._drawreq) {
          return ;
      }
      this.doOnce(this.draw);
    }
     draw() {
      this._drawreq = false;
      let g=this.g;
      let canvas=this.canvas;
      g.fillStyle = "rgb(240, 240, 240)";
      g.rect(0, 0, canvas.width, canvas.height);
      g.fill();
      let fsize=10;
      g.font = ""+fsize+"px sans-serif";
      let pad=fsize*3.0;
      let csize=32;
      let steps=~~(this.size[0]/csize+1.0);
      g.fillStyle = "grey";
      g.beginPath();
      g.rect(0, 0, pad, this.size[1]);
      g.rect(0, this.size[1]-pad, this.size[0], pad);
      g.rect(0, 0, this.size[0], pad);
      g.rect(this.size[0]-pad, 0, pad, this.size[1]);
      g.fill();
      g.fillStyle = "orange";
      for (let step=0; step<2; step++) {
          let off=this.pan[step]%csize;
          let x=off-csize;
          for (let i=0; i<steps; i++) {
              let val=i-~~(this.pan[step]/csize);
              val = val.toFixed(1);
              if (x>=this.size[step]-pad) {
                  break;
              }
              let v1=[0, 0];
              let v2=[0, 0];
              v1[step] = v2[step] = x;
              v1[step^1] = pad;
              v2[step^1] = this.size[step^1]-pad;
              if (x>=pad) {
                  g.beginPath();
                  g.moveTo(v1[0], v1[1]);
                  g.lineTo(v2[0], v2[1]);
                  g.stroke();
                  v1[step] = v2[step] = x;
                  v1[step^1] = 0;
                  v2[step^1] = this.size[step^1];
                  if (!step) {
                      v1[1]+=fsize*1.45;
                  }
                  g.fillText(""+val, 10+v1[0], v1[1]);
              }
              x+=csize;
          }
      }
    }
     updateSize() {
      let rect=this.getBoundingClientRect();
      if (!rect)
        return ;
      let dpi=UIBase.getDPI();
      let w=~~(this.size[0]*dpi);
      let h=~~((this.size[1]-22.5)*dpi);
      let c=this.canvas;
      if (w!==c.width||h!==c.height) {
          console.log("size update");
          c.width = w;
          c.height = h;
          c.style["width"] = (w/dpi)+"px";
          c.style["height"] = (h/dpi)+"px";
          this.redraw();
      }
    }
     update() {
      super.update();
      this.updateSize();
    }
    static  define() {
      return {tagname: "curve-edit-x", 
     style: "curve-edit"}
    }
  }
  _ESClass.register(CurveEdit);
  _es6_module.add_class(CurveEdit);
  CurveEdit = _es6_module.add_export('CurveEdit', CurveEdit);
  UIBase.register(CurveEdit);
  class CurveEditor extends Editor {
    
    
     constructor() {
      super();
      this.pan = new Vector2();
      this.zoom = new Vector2([1, 1]);
    }
     init() {
      super.init();
      let edit=this.edit = document.createElement("curve-edit-x");
      edit.pan.load(this.pan);
      edit.zoom.load(this.zoom);
      this.pan = edit.pan;
      this.zoom = edit.zoom;
      this.container.add(edit);
    }
     update() {
      this.edit.size[0] = this.size[0];
      this.edit.size[1] = this.size[1];
      super.update();
    }
    static  define() {
      return {tagname: "curve-editor-x", 
     areaname: "curve_editor", 
     uiname: "Curve Editor", 
     icon: Icons.CURVE_EDITOR}
    }
     copy() {
      return document.createElement("curve-editor-x");
    }
  }
  _ESClass.register(CurveEditor);
  _es6_module.add_class(CurveEditor);
  CurveEditor = _es6_module.add_export('CurveEditor', CurveEditor);
  CurveEditor.STRUCT = STRUCT.inherit(CurveEditor, Area)+`
  pan  : vec2;
  zoom : vec2;
}
`;
  Editor.register(CurveEditor);
}, '/dev/fairmotion/src/editors/curve/CurveEditor.js');
es6_module_define('notifications', ["../path.ux/scripts/widgets/ui_noteframe.js"], function _notifications_module(_es6_module) {
  var sendNote=es6_import_item(_es6_module, '../path.ux/scripts/widgets/ui_noteframe.js', 'sendNote');
  class Notification  {
  }
  _ESClass.register(Notification);
  _es6_module.add_class(Notification);
  Notification = _es6_module.add_export('Notification', Notification);
  class NotificationManager  {
     label(label, description) {
      sendNote(g_app_state.ctx.screen, label);
    }
     progbar(label, progress, description) {
      let f=progress.toFixed(1);
      sendNote(g_app_state.ctx.screen, label+" "+f+"%");
    }
     on_tick() {

    }
  }
  _ESClass.register(NotificationManager);
  _es6_module.add_class(NotificationManager);
  NotificationManager = _es6_module.add_export('NotificationManager', NotificationManager);
}, '/dev/fairmotion/src/core/notifications.js');
es6_module_define('app_ops', ["../util/svg_export.js", "../core/toolops_api.js", "../../platforms/platform.js", "../core/toolprops.js", "./viewport/spline_createops.js", "../core/fileapi/fileapi.js", "../util/strutils.js", "../config/config.js"], function _app_ops_module(_es6_module) {
  var config=es6_import(_es6_module, '../config/config.js');
  var urlencode=es6_import_item(_es6_module, '../util/strutils.js', 'urlencode');
  var b64decode=es6_import_item(_es6_module, '../util/strutils.js', 'b64decode');
  var b64encode=es6_import_item(_es6_module, '../util/strutils.js', 'b64encode');
  var ToolFlags=es6_import_item(_es6_module, '../core/toolops_api.js', 'ToolFlags');
  var UndoFlags=es6_import_item(_es6_module, '../core/toolops_api.js', 'UndoFlags');
  var StringProperty=es6_import_item(_es6_module, '../core/toolprops.js', 'StringProperty');
  var export_svg=es6_import_item(_es6_module, '../util/svg_export.js', 'export_svg');
  var ToolOp=es6_import_item(_es6_module, '../core/toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../core/toolops_api.js', 'ToolFlags');
  var get_root_folderid=es6_import_item(_es6_module, '../core/fileapi/fileapi.js', 'get_root_folderid');
  var get_current_dir=es6_import_item(_es6_module, '../core/fileapi/fileapi.js', 'get_current_dir');
  var path_to_id=es6_import_item(_es6_module, '../core/fileapi/fileapi.js', 'path_to_id');
  var platform=es6_import(_es6_module, '../../platforms/platform.js');
  var FileDialogModes={OPEN: "Open", 
   SAVE: "Save"}
  FileDialogModes = _es6_module.add_export('FileDialogModes', FileDialogModes);
  var fdialog_exclude_chars=new set(["*", "\\", ";", ":", "&", "^"]);
  var open_file=es6_import_item(_es6_module, '../core/fileapi/fileapi.js', 'open_file');
  var save_file=es6_import_item(_es6_module, '../core/fileapi/fileapi.js', 'save_file');
  var save_with_dialog=es6_import_item(_es6_module, '../core/fileapi/fileapi.js', 'save_with_dialog');
  var can_access_path=es6_import_item(_es6_module, '../core/fileapi/fileapi.js', 'can_access_path');
  class FileOpenOp extends ToolOp {
     constructor() {
      super();
      this.undoflag = UndoFlags.IGNORE_UNDO;
      this.flag = ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS;
    }
    static  tooldef() {
      return {apiname: "appstate.open", 
     uiname: "Open", 
     inputs: {path: new StringProperty("", "path", "File Path", "File Path")}, 
     outputs: {}, 
     icon: Icons.RESIZE, 
     is_modal: false, 
     undoflag: UndoFlags.IGNORE_UNDO, 
     flag: ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS}
    }
     exec(ctx) {
      console.log("File open");
      open_file(function (buf, fname, filepath) {
        console.log("\n\ngot file!", buf, fname, filepath, "\n\n");
        if (filepath!==undefined) {
            g_app_state.session.settings.add_recent_file(filepath);
        }
        g_app_state.load_user_file_new(new DataView(buf), filepath);
      }, this, true, "Fairmotion Files", ["fmo"]);
      return ;
    }
  }
  _ESClass.register(FileOpenOp);
  _es6_module.add_class(FileOpenOp);
  FileOpenOp = _es6_module.add_export('FileOpenOp', FileOpenOp);
  class FileSaveAsOp extends ToolOp {
    
     constructor(do_progress=true) {
      super();
      this.do_progress = true;
    }
    static  tooldef() {
      return {apiname: "appstate.save_as", 
     uiname: "Save As", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     undoflag: UndoFlags.IGNORE_UNDO, 
     flag: ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS}
    }
     exec(ctx) {
      console.log("File save As");
      var mesh_data=g_app_state.create_user_file_new().buffer;
      save_with_dialog(mesh_data, undefined, "Fairmotion Files", ["fmo"], function () {
        error_dialog(ctx, "Could not write file", undefined, true);
      }, (path) =>        {
        g_app_state.filepath = path;
        g_app_state.notes.label("File saved");
      });
    }
  }
  _ESClass.register(FileSaveAsOp);
  _es6_module.add_class(FileSaveAsOp);
  FileSaveAsOp = _es6_module.add_export('FileSaveAsOp', FileSaveAsOp);
  class FileSaveOp extends ToolOp {
    
     constructor(do_progress=true) {
      super();
      this.do_progress = true;
    }
    static  tooldef() {
      return {apiname: "appstate.save", 
     uiname: "Save", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     undoflag: UndoFlags.IGNORE_UNDO, 
     flag: ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS}
    }
     exec(ctx) {
      console.log("File save");
      var mesh_data=g_app_state.create_user_file_new().buffer;
      let path=g_app_state.filepath;
      let ok=path!=""&&path!==undefined;
      ok = ok&&can_access_path(path);
      if (!ok) {
          save_with_dialog(mesh_data, undefined, "Fairmotion Files", ["fmo"], function () {
            error_dialog(ctx, "Could not write file", undefined, true);
          }, (path) =>            {
            g_app_state.filepath = path;
            g_app_state.notes.label("File saved");
          });
      }
      else {
        save_file(mesh_data, path, () =>          {
          error_dialog(ctx, "Could not write file", undefined, true);
        }, () =>          {
          g_app_state.notes.label("File saved");
        });
      }
    }
  }
  _ESClass.register(FileSaveOp);
  _es6_module.add_class(FileSaveOp);
  FileSaveOp = _es6_module.add_export('FileSaveOp', FileSaveOp);
  class FileSaveSVGOp extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {apiname: "appstate.export_svg", 
     uiname: "Export SVG", 
     inputs: {path: new StringProperty("", "path", "File Path", "File Path")}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     undoflag: UndoFlags.IGNORE_UNDO, 
     flag: ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS}
    }
     exec(ctx) {
      console.log("Export SVG");
      ctx = new Context();
      var buf=export_svg(ctx.spline);
      if (g_app_state.filepath!="") {
          var name=g_app_state.filepath;
          if (name===undefined||name=="") {
              name = "untitled";
          }
          if (name.endsWith(".fmo"))
            name = name.slice(0, name.length-4);
      }
      else {
        name = "document";
      }
      var blob=new Blob([buf], {type: "text/svg+xml"});
      if (config.CHROME_APP_MODE) {
          save_with_dialog(buf, undefined, "SVG", ["svg"], function () {
            error_dialog(ctx, "Could not write file", undefined, true);
          });
      }
      else {
        var a=document.createElement("a");
        a.download = name+".svg";
        a.href = URL.createObjectURL(blob);
        a.click();
      }
    }
  }
  _ESClass.register(FileSaveSVGOp);
  _es6_module.add_class(FileSaveSVGOp);
  FileSaveSVGOp = _es6_module.add_export('FileSaveSVGOp', FileSaveSVGOp);
  class FileSaveB64Op extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {apiname: "appstate.export_al3_b64", 
     uiname: "Export Base64", 
     description: "Export a base64-encoded .fmo file", 
     inputs: {path: new StringProperty("", "path", "File Path", "File Path")}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     undoflag: UndoFlags.IGNORE_UNDO, 
     flag: ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS}
    }
     exec(ctx) {
      console.log("Export AL3-B64");
      var buf=g_app_state.create_user_file_new({compress: true});
      buf = b64encode(new Uint8Array(buf.buffer));
      var buf2="";
      for (var i=0; i<buf.length; i++) {
          buf2+=buf[i];
          if (((i+1)%79)==0) {
              buf2+="\n";
          }
      }
      buf = buf2;
      var byte_data=[];
      ajax.pack_static_string(byte_data, buf, buf.length);
      byte_data = new Uint8Array(byte_data).buffer;
      ctx = new Context();
      var pd=new ProgressDialog(ctx, "Uploading");
      function error(job, owner, msg) {
        pd.end();
        error_dialog(ctx, "Network Error", undefined, true);
      }
      function status(job, owner, status) {
        pd.value = status.progress;
        pd.bar.do_recalc();
        if (DEBUG.netio)
          console.log("status: ", status.progress);
      }
      var this2=this;
      function finish(job, owner) {
        if (DEBUG.netio)
          console.log("finished uploading");
        var url="/api/files/get?path=/"+this2._path+"&";
        url+="accessToken="+g_app_state.session.tokens.access;
        if (DEBUG.netio)
          console.log(url);
        window.open(url);
        pd.end();
      }
      function save_callback(dialog, path) {
        pd.call(ctx.screen.mpos);
        if (DEBUG.netio)
          console.log("saving...", path);
        if (!path.endsWith(".al3.b64")) {
            path = path+".al3.b64";
        }
        this2._path = path;
        var token=g_app_state.session.tokens.access;
        var url="/api/files/upload/start?accessToken="+token+"&path="+path;
        var url2="/api/files/upload?accessToken="+token;
        call_api(upload_file, {data: byte_data, 
      url: url, 
      chunk_url: url2}, finish, error, status);
      }
      file_dialog("SAVE", new Context(), save_callback, true);
    }
  }
  _ESClass.register(FileSaveB64Op);
  _es6_module.add_class(FileSaveB64Op);
  FileSaveB64Op = _es6_module.add_export('FileSaveB64Op', FileSaveB64Op);
  var ImportJSONOp=es6_import_item(_es6_module, './viewport/spline_createops.js', 'ImportJSONOp');
  var _dom_input_node=undefined;
  var import_json=window.import_json = function import_json() {
    
    console.log("import json!");
    if (_dom_input_node==undefined) {
        window._dom_input_node = _dom_input_node = document.getElementById("fileinput");
    }
    _dom_input_node.style.visibility = "visible";
    var node=_dom_input_node;
    node.value = "";
    node.onchange = function () {
      console.log("file select!", node.files);
      if (node.files.length==0)
        return ;
      var f=node.files[0];
      console.log("file", f);
      var reader=new FileReader();
      reader.onload = function (data) {
        var obj=JSON.parse(reader.result);
        var tool=new ImportJSONOp(reader.result);
        g_app_state.toolstack.exec_tool(tool);
      }
      reader.readAsText(f);
    }
  }
  import_json = _es6_module.add_export('import_json', import_json);
}, '/dev/fairmotion/src/editors/app_ops.js');
es6_module_define('editor_base', ["../path.ux/scripts/screen/ScreenArea.js", "../core/struct.js", "../path.ux/scripts/screen/FrameManager.js", "../curve/spline_draw.js", "./events.js", "../path.ux/scripts/core/ui_base.js"], function _editor_base_module(_es6_module) {
  var Area=es6_import_item(_es6_module, '../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var ScreenArea=es6_import_item(_es6_module, '../path.ux/scripts/screen/ScreenArea.js', 'ScreenArea');
  var Screen=es6_import_item(_es6_module, '../path.ux/scripts/screen/FrameManager.js', 'Screen');
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  var ui_base=es6_import(_es6_module, '../path.ux/scripts/core/ui_base.js');
  var KeyMap=es6_import_item(_es6_module, './events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, './events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, './events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, './events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, './events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, './events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, './events.js', 'EventHandler');
  var patch_canvas2d=es6_import_item(_es6_module, '../curve/spline_draw.js', 'patch_canvas2d');
  var set_rendermat=es6_import_item(_es6_module, '../curve/spline_draw.js', 'set_rendermat');
  var _area_active_stacks={}
  _area_active_stacks = _es6_module.add_export('_area_active_stacks', _area_active_stacks);
  var _area_active_lasts={}
  _area_active_lasts = _es6_module.add_export('_area_active_lasts', _area_active_lasts);
  var _area_main_stack=[];
  _area_main_stack = _es6_module.add_export('_area_main_stack', _area_main_stack);
  var _last_area=undefined;
  function _get_area_stack(cls) {
    var h=cls.name;
    if (!(h in _area_active_stacks)) {
        _area_active_stacks[h] = new Array();
    }
    return _area_active_stacks[h];
  }
  function resetAreaStacks() {
    _area_main_stack.length = 0;
    for (let k in _area_active_lasts) {
        _area_active_lasts[k].length = 0;
    }
    for (let k in _area_active_stacks) {
        _area_active_stacks[k].length = 0;
    }
    _last_area = undefined;
  }
  resetAreaStacks = _es6_module.add_export('resetAreaStacks', resetAreaStacks);
  class FairmotionScreen extends Screen {
     constructor() {
      super();
      this.define_keymap();
    }
     init() {
      this.define_keymap();
    }
     define_keymap() {
      this.keymap = new KeyMap();
      var k=this.keymap;
      k.add_tool(new HotKey("O", ["CTRL"], "Open File"), "appstate.open()");
      k.add_tool(new HotKey("O", ["CTRL", "SHIFT"], "Open Recent"), "appstate.open_recent()");
      k.add_tool(new HotKey("S", ["CTRL", "ALT"], "Save File"), "appstate.save_as()");
      k.add_tool(new HotKey("S", ["CTRL"], "Save File"), "appstate.save()");
      k.add_func(new HotKey("U", ["CTRL", "SHIFT"]), function () {
        ("saving new startup file.");
        g_app_state.set_startup_file();
      });
    }
     on_keyup(e) {
      if (g_app_state.eventhandler!==this)
        return g_app_state.eventhandler.on_keyup(e);
    }
     on_keydown(e) {
      if (g_app_state.eventhandler!==this)
        return g_app_state.eventhandler.on_keydown(e);
      if (this.keymap.process_event(this.ctx, e)) {
          return ;
      }
      let area=this.pickElement(this.mpos[0], this.mpos[1], undefined, undefined, Area);
      if (area===undefined) {
          return ;
      }
      area.push_ctx_active();
      var ret=false;
      try {
        ret = area.keymap.process_event(this.ctx, e);
      }
      catch (error) {
          print_stack(error);
          console.log("Error executing hotkey");
      }
      area.pop_ctx_active();
      return ret;
    }
     update() {
      super.update();
      if (this.ctx&&this.ctx.scene) {
          this.ctx.scene.on_tick(this.ctx);
      }
      the_global_dag.exec();
    }
    static  define() {
      return {tagname: "fairmotion-screen-x"}
    }
  }
  _ESClass.register(FairmotionScreen);
  _es6_module.add_class(FairmotionScreen);
  FairmotionScreen = _es6_module.add_export('FairmotionScreen', FairmotionScreen);
  FairmotionScreen.STRUCT = STRUCT.inherit(FairmotionScreen, Screen)+`
}
`;
  ui_base.UIBase.register(FairmotionScreen);
  class Editor extends Area {
    
     constructor() {
      super();
      this.canvases = {};
    }
     makeHeader(container) {
      return super.makeHeader(container);
    }
     init() {
      super.init();
      if (!this.container) {
          this.container = document.createElement("container-x");
          this.container.ctx = this.ctx;
          this.container.style["width"] = "100%";
          this.shadow.appendChild(this.container);
          this.makeHeader(this.container);
      }
      this.keymap = new KeyMap();
      if (this.helppicker) {
          this.helppicker.iconsheet = 0;
      }
      this.style["overflow"] = "hidden";
      this.setCSS();
    }
     getCanvas(id, zindex, patch_canvas2d_matrix=true, dpi_scale=1.0) {
      let canvas;
      let dpi=ui_base.UIBase.getDPI();
      if (id in this.canvases) {
          canvas = this.canvases[id];
      }
      else {
        console.log("creating new canvas", id, zindex);
        canvas = this.canvases[id] = document.createElement("canvas");
        canvas.g = this.canvases[id].getContext("2d");
        this.shadow.prepend(canvas);
        canvas.style["position"] = "absolute";
      }
      canvas.dpi_scale = dpi_scale;
      if (canvas.style["z-index"]!==zindex) {
          canvas.style["z-index"] = zindex;
      }
      if (this.size!==undefined) {
          let w=~~(this.size[0]*dpi*dpi_scale);
          let h=~~(this.size[1]*dpi*dpi_scale);
          let sw=this.size[0]+"px";
          let sh=this.size[1]+"px";
          canvas.style["left"] = "0px";
          canvas.style["top"] = "0px";
          if (canvas.width!==w||canvas.style["width"]!==sw) {
              canvas.width = w;
              canvas.style["width"] = sw;
          }
          if (canvas.height!==h||canvas.style["height"]!==sh) {
              canvas.height = h;
              canvas.style["height"] = sh;
          }
      }
      return canvas;
    }
     on_destroy() {

    }
     on_fileload(ctx) {

    }
     data_link(block, getblock, getblock_us) {

    }
    static  register(cls) {
      return Area.register(cls);
    }
    static  active_area() {
      let ret=_area_main_stack[_area_main_stack.length-1];
      if (ret===undefined) {
          ret = _last_area;
      }
      return ret;
    }
    static  context_area(cls) {
      var stack=_get_area_stack(cls.name);
      if (stack.length===0)
        return _area_active_lasts[cls.name];
      else 
        return stack[stack.length-1];
    }
    static  wrapContextEvent(f) {
      return function (e) {
        this.push_ctx_active();
        try {
          f(e);
        }
        catch (error) {
            print_stack(error);
            console.warn("Error executing area", e.type, "callback");
        }
        this.pop_ctx_active();
      }
    }
     push_ctx_active(ctx) {
      var stack=_get_area_stack(this.constructor);
      stack.push(this);
      _area_active_lasts[this.constructor.name] = this;
      _area_main_stack.push(_last_area);
      _last_area = this;
    }
     pop_ctx_active(ctx) {
      let cls=this.constructor;
      var stack=_get_area_stack(cls);
      if (stack.length==0||stack[stack.length-1]!==this) {
          console.trace();
          console.log("Warning: invalid Area.pop_active() call");
          return ;
      }
      stack.pop();
      if (stack.length>0) {
          _area_active_lasts[cls.name] = stack[stack.length-1];
      }
      let area=_area_main_stack.pop();
      if (area!==undefined) {
          _last_area = area;
      }
    }
  }
  _ESClass.register(Editor);
  _es6_module.add_class(Editor);
  Editor = _es6_module.add_export('Editor', Editor);
  Editor.STRUCT = STRUCT.inherit(Editor, Area)+`
}
`;
}, '/dev/fairmotion/src/editors/editor_base.js');
es6_module_define('manipulator', ["../../util/mathlib.js", "../../config/config.js"], function _manipulator_module(_es6_module) {
  "use strict";
  var dist_to_line_v2=es6_import_item(_es6_module, '../../util/mathlib.js', 'dist_to_line_v2');
  var config=es6_import(_es6_module, '../../config/config.js');
  var ManipFlags={}
  ManipFlags = _es6_module.add_export('ManipFlags', ManipFlags);
  var HandleShapes={ARROW: 0, 
   HAMMER: 1, 
   ROTCIRCLE: 2, 
   SIMPLE_CIRCLE: 3, 
   OUTLINE: 4}
  HandleShapes = _es6_module.add_export('HandleShapes', HandleShapes);
  var HandleColors={DEFAULT: [0, 0, 0, 1], 
   HIGHLIGHT: [0.4, 0.4, 0.4, 1], 
   SELECT: [1.0, 0.7, 0.3, 1]}
  HandleColors = _es6_module.add_export('HandleColors', HandleColors);
  var _mh_idgen=1;
  class HandleBase  {
     on_click(e, view2d, id) {

    }
     on_active() {
      this.color = HandleColors.HIGHLIGHT;
      this.update();
    }
     on_inactive() {
      this.color = HandleColors.DEFAULT;
      this.update();
    }
     distanceTo(p) {
      throw new Error("unimplemented distanceTo");
    }
     update() {
      throw new Error("unimplemented update");
    }
     [Symbol.keystr]() {
      throw new Error("unimplemented keystr");
    }
     get_render_rects(ctx, canvas, g) {
      throw new Error("unimplemented get_render_rects");
    }
     render(canvas, g) {
      throw new Error("unimplemented render");
    }
  }
  _ESClass.register(HandleBase);
  _es6_module.add_class(HandleBase);
  HandleBase = _es6_module.add_export('HandleBase', HandleBase);
  HandleBase;
  var $min_x_4B_update;
  var $max_3gek_update;
  class ManipHandle extends HandleBase {
    
    
    
    
     constructor(v1, v2, id, shape, view2d, clr) {
      super();
      this.id = id;
      this._hid = _mh_idgen++;
      this.shape = shape;
      this.v1 = v1;
      this.v2 = v2;
      this.transparent = false;
      this.color = clr===undefined ? [0, 0, 0, 1] : clr.slice(0, clr.length);
      this.parent = undefined;
      this.linewidth = 1.5;
      if (this.color.length==3)
        this.color.push(1.0);
      this._min = new Vector2(v1);
      this._max = new Vector2(v2);
      this._redraw_pad = this.linewidth;
    }
     on_click(e, view2d, id) {

    }
     on_active() {
      this.color = HandleColors.HIGHLIGHT;
      this.update();
    }
     on_inactive() {
      this.color = HandleColors.DEFAULT;
      this.update();
    }
     distanceTo(p) {
      return dist_to_line_v2(p, this.v1, this.v2);
    }
     update_aabb() {
      this._min[0] = this.v1[0]+this.parent.co[0];
      this._min[1] = this.v1[1]+this.parent.co[1];
      this._max[0] = this.v2[0]+this.parent.co[0];
      this._max[1] = this.v2[1]+this.parent.co[1];
      var minx=Math.min(this._min[0], this._max[0]);
      var miny=Math.min(this._min[1], this._max[1]);
      var maxx=Math.max(this._min[0], this._max[0]);
      var maxy=Math.max(this._min[1], this._max[1]);
      this._min[0] = minx;
      this._min[1] = miny;
      this._max[0] = maxx;
      this._max[1] = maxy;
    }
     update() {
      var p=this._redraw_pad;
      $min_x_4B_update[0] = this._min[0]-p;
      $min_x_4B_update[1] = this._min[1]-p;
      $max_3gek_update[0] = this._max[0]+p;
      $max_3gek_update[1] = this._max[1]+p;
      window.redraw_viewport($min_x_4B_update, $max_3gek_update);
      this.update_aabb();
      $min_x_4B_update[0] = this._min[0]-p;
      $min_x_4B_update[1] = this._min[1]-p;
      $max_3gek_update[0] = this._max[0]+p;
      $max_3gek_update[1] = this._max[1]+p;
      window.redraw_viewport($min_x_4B_update, $max_3gek_update);
    }
     [Symbol.keystr]() {
      return "MH"+this._hid.toString;
    }
     get_render_rects(ctx, canvas, g) {
      let p=this._redraw_pad;
      this.update_aabb();
      let xmin=this._min[0], ymin=this._min[1], xmax=this._max[0], ymax=this._max[1];
      return [[xmin-p, ymin-p, xmax-xmin+2*p, ymax-ymin+2*p]];
    }
     render(canvas, g) {
      let c=this.color;
      let style="rgba("+(~~(c[0]*255))+","+(~~(c[1]*255))+","+(~~(c[2]*255))+","+c[3]+")";
      g.strokeStyle = g.fillStyle = style;
      g.lineWidth = this.linewidth;
      if (this.shape==HandleShapes.ARROW) {
          g.beginPath();
          let dx=this.v2[0]-this.v1[0], dy=this.v2[1]-this.v1[1];
          let dx2=this.v1[1]-this.v2[1], dy2=this.v2[0]-this.v1[0];
          let l=Math.sqrt(dx2*dx2+dy2*dy2);
          if (l==0.0) {
              g.beginPath();
              g.rect(this.v1[0]-5, this.v1[1]-5, 10, 10);
              g.fill();
              return ;
          }
          dx2*=1.5/l;
          dy2*=1.5/l;
          dx*=0.65;
          dy*=0.65;
          let w=3;
          let v1=this.v1, v2=this.v2;
          g.moveTo(v1[0]-dx2, v1[1]-dy2);
          g.lineTo(v1[0]+dx-dx2, v1[1]+dy-dy2);
          g.lineTo(v1[0]+dx-dx2*w, v1[1]+dy-dy2*w);
          g.lineTo(v2[0], v2[1]);
          g.lineTo(v1[0]+dx+dx2*w, v1[1]+dy+dy2*w);
          g.lineTo(v1[0]+dx+dx2, v1[1]+dy+dy2);
          g.lineTo(v1[0]+dx2, v1[1]+dy2);
          g.closePath();
          g.fill();
      }
      else 
        if (this.shape==HandleShapes.OUTLINE) {
          g.beginPath();
          g.moveTo(this.v1[0], this.v1[1]);
          g.lineTo(this.v1[0], this.v2[1]);
          g.lineTo(this.v2[0], this.v2[1]);
          g.lineTo(this.v2[0], this.v1[1]);
          g.closePath();
          g.stroke();
      }
      else {
        g.beginPath();
        g.moveTo(this.v1[0], this.v1[1]);
        g.lineTo(this.v2[0], this.v2[1]);
        g.stroke();
      }
    }
  }
  var $min_x_4B_update=new Vector2();
  var $max_3gek_update=new Vector2();
  _ESClass.register(ManipHandle);
  _es6_module.add_class(ManipHandle);
  ManipHandle = _es6_module.add_export('ManipHandle', ManipHandle);
  var $min_zjXQ_update;
  var $max_Q31N_update;
  class ManipCircle extends HandleBase {
    
    
    
    
    
     constructor(p, r, id, view2d, clr) {
      super();
      this.id = id;
      this._hid = _mh_idgen++;
      this.p = new Vector2(p);
      this.r = r;
      this.transparent = false;
      this.color = clr===undefined ? [0, 0, 0, 1] : clr.slice(0, clr.length);
      this.parent = undefined;
      this.linewidth = 1.5;
      if (this.color.length==3)
        this.color.push(1.0);
      this._min = new Vector2();
      this._max = new Vector2();
      this._redraw_pad = this.linewidth;
    }
     on_click(e, view2d, id) {

    }
     on_active() {
      this.color = HandleColors.HIGHLIGHT;
      this.update();
    }
     on_inactive() {
      this.color = HandleColors.DEFAULT;
      this.update();
    }
     distanceTo(p) {
      let dx=this.p[0]-p[0];
      let dy=this.p[1]-p[1];
      let dis=dx*dx+dy*dy;
      dis = dis!=0.0 ? Math.sqrt(dis) : 0.0;
      return Math.abs(dis-this.r);
    }
     update_aabb() {
      this._min[0] = this.parent.co[0]+this.p[0]-Math.sqrt(2)*this.r;
      this._min[1] = this.parent.co[1]+this.p[1]-Math.sqrt(2)*this.r;
      this._max[0] = this.parent.co[0]+this.p[0]+Math.sqrt(2)*this.r;
      this._max[1] = this.parent.co[1]+this.p[1]+Math.sqrt(2)*this.r;
    }
     update() {
      var p=this._redraw_pad;
      $min_zjXQ_update[0] = this._min[0]-p;
      $min_zjXQ_update[1] = this._min[1]-p;
      $max_Q31N_update[0] = this._max[0]+p;
      $max_Q31N_update[1] = this._max[1]+p;
      window.redraw_viewport($min_zjXQ_update, $max_Q31N_update);
      this.update_aabb();
      $min_zjXQ_update[0] = this._min[0]-p;
      $min_zjXQ_update[1] = this._min[1]-p;
      $max_Q31N_update[0] = this._max[0]+p;
      $max_Q31N_update[1] = this._max[1]+p;
      window.redraw_viewport($min_zjXQ_update, $max_Q31N_update);
    }
     [Symbol.keystr]() {
      return "MC"+this._hid.toString;
    }
     get_render_rects(ctx, canvas, g) {
      let p=this._redraw_pad;
      this.update_aabb();
      let xmin=this._min[0], ymin=this._min[1], xmax=this._max[0], ymax=this._max[1];
      return [[xmin-p, ymin-p, xmax-xmin+2*p, ymax-ymin+2*p]];
    }
     render(canvas, g) {
      let c=this.color;
      let style="rgba("+(~~(c[0]*255))+","+(~~(c[1]*255))+","+(~~(c[2]*255))+","+c[3]+")";
      g.strokeStyle = g.fillStyle = style;
      g.lineWidth = this.linewidth;
      g.beginPath();
      g.arc(this.p[0], this.p[1], this.r, -Math.PI, Math.PI);
      g.closePath();
      g.stroke();
    }
  }
  var $min_zjXQ_update=new Vector2();
  var $max_Q31N_update=new Vector2();
  _ESClass.register(ManipCircle);
  _es6_module.add_class(ManipCircle);
  ManipCircle = _es6_module.add_export('ManipCircle', ManipCircle);
  var _mh_idgen_2=1;
  var _mp_first=true;
  class Manipulator  {
    
    
    
    
     constructor(handles) {
      this._hid = _mh_idgen_2++;
      this.handles = handles.slice(0, handles.length);
      this.recalc = 1;
      this.parent = undefined;
      this.user_data = undefined;
      for (var h of this.handles) {
          h.parent = this;
      }
      this.handle_size = 65;
      this.co = new Vector3();
      this.hidden = false;
    }
     hide() {
      if (!this.hidden) {
          this.update();
      }
      this.hidden = true;
    }
     unhide() {
      if (this.hidden) {
          this.hidden = false;
          this.update();
      }
      else {
        this.hidden = false;
      }
    }
     update() {
      if (this.hidden)
        return ;
      for (var h of this.handles) {
          h.update();
      }
    }
     on_tick(ctx) {

    }
     [Symbol.keystr]() {
      return "MP"+this._hid.toString;
    }
     end() {
      this.parent.remove(this);
    }
     get_render_rects(ctx, canvas, g) {
      var rects=[];
      if (this.hidden) {
          return rects;
      }
      for (var h of this.handles) {
          var rs=h.get_render_rects(ctx, canvas, g);
          for (var i=0; i<rs.length; i++) {
              rs[i] = rs[i].slice(0, rs[i].length);
              rs[i][0]+=this.co[0];
              rs[i][1]+=this.co[1];
          }
          rects = rects.concat(rs);
      }
      return rects;
    }
     render(canvas, g) {
      if (this.hidden) {
          return ;
      }
      for (var h of this.handles) {
          var x=this.co[0], y=this.co[1];
          g.translate(x, y);
          h.render(canvas, g);
          g.translate(-x, -y);
      }
    }
     outline(min, max, id, clr=[0, 0, 0, 1.0]) {
      min = new Vector2(min);
      max = new Vector2(max);
      var h=new ManipHandle(min, max, id, HandleShapes.OUTLINE, this.view3d, clr);
      h.transparent = true;
      h.parent = this;
      this.handles.push(h);
      return h;
    }
     arrow(v1, v2, id, clr=[0, 0, 0, 1.0]) {
      v1 = new Vector2(v1);
      v2 = new Vector2(v2);
      var h=new ManipHandle(v1, v2, id, HandleShapes.ARROW, this.view3d, clr);
      h.parent = this;
      this.handles.push(h);
      return h;
    }
     circle(p, r, id, clr=[0, 0, 0, 1.0]) {
      let h=new ManipCircle(new Vector2(p), r, id, this.view3d, clr);
      h.parent = this;
      this.handles.push(h);
      return h;
    }
     findnearest(e) {
      let limit=config.MANIPULATOR_MOUSEOVER_LIMIT;
      let h=this.handles[0];
      let mpos=[e.x-this.co[0], e.y-this.co[1]];
      let mindis=undefined, minh=undefined;
      for (let h of this.handles) {
          if (h.transparent)
            continue;
          let dis=h.distanceTo(mpos);
          if (dis<limit&&(mindis===undefined||dis<mindis)) {
              mindis = dis;
              minh = h;
          }
      }
      return minh;
    }
     on_mousemove(e, view2d) {
      let h=this.findnearest(e);
      if (h!==this.active) {
          if (this.active!==undefined) {
              this.active.on_inactive();
          }
          this.active = h;
          if (h!==undefined) {
              h.on_active();
          }
      }
      return false;
    }
     on_click(event, view2d) {
      return this.active!=undefined ? this.active.on_click(event, view2d, this.active.id) : undefined;
    }
  }
  _ESClass.register(Manipulator);
  _es6_module.add_class(Manipulator);
  Manipulator = _es6_module.add_export('Manipulator', Manipulator);
  var $nil_GJS__get_render_rects;
  class ManipulatorManager  {
    
    
    
     constructor(view2d) {
      this.view2d = view2d;
      this.stack = [];
      this.active = undefined;
    }
     render(canvas, g) {
      if (this.active!==undefined) {
          this.active.render(canvas, g);
      }
    }
     get_render_rects(ctx, canvas, g) {
      if (this.active!=undefined) {
          return this.active.get_render_rects(ctx, canvas, g);
      }
      else {
        return $nil_GJS__get_render_rects;
      }
    }
     remove(mn) {
      if (mn==this.active) {
          this.pop();
      }
      else {
        this.stack.remove(mn);
      }
    }
     push(mn) {
      mn.parent = this;
      this.stack.push(this.active);
      this.active = mn;
    }
     ensure_not_toolop(ctx, cls) {
      if (this.active!=undefined&&this.active.toolop_class===cls) {
          this.remove(this.active);
      }
    }
     ensure_toolop(ctx, cls) {
      if (this.active!=undefined&&this.active.toolop_class===cls) {
          return this.active;
      }
      if (this.active!=undefined) {
          this.remove(this.active);
      }
      this.active = cls.create_widgets(this, ctx);
      if (this.active!==undefined) {
          this.active.toolop_class = cls;
      }
    }
     pop() {
      var ret=this.active;
      this.active = this.stack.pop(-1);
    }
     on_mousemove(event, view2d) {
      return this.active!=undefined ? this.active.on_mousemove(event, view2d) : undefined;
    }
     on_click(event, view2d) {
      return this.active!=undefined ? this.active.on_click(event, view2d) : undefined;
    }
     active_toolop() {
      if (this.active==undefined)
        return undefined;
      return this.active.toolop_class;
    }
     create(cls, do_push=true) {
      var mn=new Manipulator([]);
      mn.parent = this;
      mn.toolop_class = cls;
      if (do_push)
        this.push(mn);
      return mn;
    }
     on_tick(ctx) {
      if (this.active!=undefined&&this.active.on_tick!=undefined)
        this.active.on_tick(ctx);
    }
     circle(p, r, clr, do_push=true) {
      let h=new ManipCircle(p, r, id, this.view3d, clr);
      let mn=new Manipulator([h]);
      mn.parent = this;
      if (do_push) {
          this.push(mn);
      }
      return mn;
    }
     arrow(v1, v2, id, clr, do_push=true) {
      v1 = new Vector2(v1);
      v2 = new Vector2(v2);
      var h=new ManipHandle(v1, v2, id, HandleShapes.ARROW, this.view3d, clr);
      var mn=new Manipulator([h]);
      mn.parent = this;
      if (do_push)
        this.push(mn);
      return mn;
    }
  }
  var $nil_GJS__get_render_rects=[];
  _ESClass.register(ManipulatorManager);
  _es6_module.add_class(ManipulatorManager);
  ManipulatorManager = _es6_module.add_export('ManipulatorManager', ManipulatorManager);
}, '/dev/fairmotion/src/editors/viewport/manipulator.js');
