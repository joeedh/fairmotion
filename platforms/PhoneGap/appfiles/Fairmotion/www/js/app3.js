es6_module_define('eventdag', ["J3DIMath"], function _eventdag_module(_es6_module) {
  "use strict";
  var _event_dag_idgen=undefined;
  es6_import(_es6_module, 'J3DIMath');
  window.the_global_dag = undefined;
  var NodeBase=_ESClass("NodeBase", [function dag_update(field, data) {
    var graph=window.the_global_dag;
    var node=graph.get_node(this, false);
    if (node!=undefined)
      node.dag_update(field, data);
  }, function dag_unlink() {
    var graph=window.the_global_dag;
    var node=graph.get_node(this, false);
    if (node!=undefined)
      window.the_global_dag.remove(node);
  }, function NodeBase() {
  }]);
  _es6_module.add_class(NodeBase);
  NodeBase = _es6_module.add_export('NodeBase', NodeBase);
  var UIOnlyNode=_ESClass("UIOnlyNode", NodeBase, [function UIOnlyNode() {
    NodeBase.apply(this, arguments);
  }]);
  _es6_module.add_class(UIOnlyNode);
  UIOnlyNode = _es6_module.add_export('UIOnlyNode', UIOnlyNode);
  var DataPathNode=_ESClass("DataPathNode", NodeBase, [function dag_get_datapath(ctx) {
  }, _ESClass.static(function isDataPathNode(obj) {
    return "dag_get_datapath" in obj;
  }), function DataPathNode() {
    NodeBase.apply(this, arguments);
  }]);
  _es6_module.add_class(DataPathNode);
  DataPathNode = _es6_module.add_export('DataPathNode', DataPathNode);
  Node.dag_inputs = {}
  Node.dag_outputs = {}
  var DagFlags={UPDATE: 1, TEMP: 2, DEAD: 4}
  DagFlags = _es6_module.add_export('DagFlags', DagFlags);
  var EventNode=_ESClass("EventNode", [function EventNode() {
    this.flag = 0;
    this.id = -1;
    this.graph = undefined;
  }, function get_owner(ctx) {
  }, function on_remove(ctx) {
  }, function dag_update(field, data) {
    if (field==undefined) {
        for (var k in this.outputs) {
            this.dag_update(k);
        }
        return ;
    }
    var sock=this.outputs[field];
    if (arguments.length>1) {
        sock.data = data;
    }
    sock.flag|=DagFlags.UPDATE;
    this.flag|=DagFlags.UPDATE;
    for (var i=0; i<sock.edges.length; i++) {
        var e=sock.edges[i], n2=e.opposite(sock).owner;
    }
    this.graph.on_update(this, field);
  }, function unlink() {
    for (var k in this.inputs) {
        this.inputs[k].disconnect_all();
    }
    for (var k in this.outputs) {
        this.outputs[k].disconnect_all();
    }
  }]);
  _es6_module.add_class(EventNode);
  EventNode = _es6_module.add_export('EventNode', EventNode);
  EventNode.inputs = {}
  EventNode.outputs = {}
  var IndirectNode=_ESClass("IndirectNode", EventNode, [function IndirectNode(path) {
    EventNode.call(this);
    this.datapath = path;
  }, function get_owner(ctx) {
    if (this._owner!=undefined)
      return this._owner;
    this._owner = ctx.api.get_object(ctx, this.datapath);
    return this._owner;
  }]);
  _es6_module.add_class(IndirectNode);
  IndirectNode = _es6_module.add_export('IndirectNode', IndirectNode);
  var DirectNode=_ESClass("DirectNode", EventNode, [function DirectNode(id) {
    EventNode.call(this);
    this.objid = id;
  }, function get_owner(ctx) {
    return this.graph.object_idmap[this.objid];
  }]);
  _es6_module.add_class(DirectNode);
  DirectNode = _es6_module.add_export('DirectNode', DirectNode);
  var DataTypes={DEPEND: 1, NUMBER: 2, BOOL: 4, STRING: 8, VEC2: 16, VEC3: 32, VEC4: 64, MATRIX4: 128, ARRAY: 256}
  DataTypes = _es6_module.add_export('DataTypes', DataTypes);
  var TypeDefaults=t = {}
  t[DataTypes.DEPEND] = undefined;
  t[DataTypes.NUMBER] = 0;
  t[DataTypes.STRING] = "";
  t[DataTypes.VEC2] = new Vector2();
  t[DataTypes.MATRIX4] = new Vector3();
  t[DataTypes.ARRAY] = [];
  t[DataTypes.BOOL] = true;
  var EventEdge=_ESClass("EventEdge", [function EventEdge(dst, src) {
    this.dst = dst;
    this.src = src;
  }, function opposite(socket) {
    return socket==this.dst ? this.src : this.dst;
  }]);
  _es6_module.add_class(EventEdge);
  EventEdge = _es6_module.add_export('EventEdge', EventEdge);
  var EventSocket=_ESClass("EventSocket", [function EventSocket(name, owner, type, datatype) {
    this.type = type;
    this.name = name;
    this.owner = owner;
    this.datatype = datatype;
    this.data = undefined;
    this.flag = DagFlags.UPDATE;
    this.edges = [];
  }, function copy() {
    var s=new EventSocket(this.name, undefined, this.type, this.datatype);
    return s;
  }, function connect(b) {
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
  }, function _find_edge(b) {
    for (var i=0; i<this.edges.length; i++) {
        if (this.edges[i].opposite(this)===b)
          return this.edges[i];
    }
    return undefined;
  }, function disconnect(other_socket) {
    if (other_socket==undefined) {
        warntrace("Warning, no other_socket in disconnect!");
        return ;
    }
    var e=this._find_edge(other_socket);
    if (e!=undefined) {
        other_socket.edges.remove(e);
        this.edges.remove(e);
    }
  }, function disconnect_all() {
    while (this.edges.length>0) {
      var e=this.edges[0];
      e.opposite(this).edges.remove(e);
      this.edges.remove(e);
    }
  }]);
  _es6_module.add_class(EventSocket);
  EventSocket = _es6_module.add_export('EventSocket', EventSocket);
  function gen_callback_exec(func, thisvar) {
    for (var k in UIOnlyNode.prototype) {
        if (k=="toString")
          continue;
        func[k] = UIOnlyNode.prototype[k];
    }
    func.constructor = {}
    func.constructor.name = func.name;
    func.constructor.prototype = UIOnlyNode.prototype;
    func.dag_exec = function(ctx, graph) {
      var args=[];
      for (var k in this.constructor.dag_inputs) {
          args.push(this[k]);
      }
      this.apply(thisvar!=undefined ? thisvar : self, args);
    }
  }
  var $sarr_bwu3_link;
  var $darr_bWm9_link;
  var EventDag=_ESClass("EventDag", [function EventDag() {
    this.nodes = [];
    this.sortlist = [];
    this.doexec = false;
    this.node_pathmap = {}
    this.node_idmap = {}
    this.object_idmap = {}
    this.idmap = {}
    this.ctx = undefined;
    if (_event_dag_idgen==undefined)
      _event_dag_idgen = new EIDGen();
    this.object_idgen = _event_dag_idgen;
    this.idgen = new EIDGen();
    this.resort = true;
  }, function reset_cache() {
    var __iter_n=__get_iter(this.nodes);
    var n;
    while (1) {
      var __ival_n=__iter_n.next();
      if (__ival_n.done) {
          break;
      }
      n = __ival_n.value;
      if (__instance_of(n, IndirectNode)) {
          n._owner = undefined;
      }
    }
  }, function init_slots(node, object) {
    function make_slot(stype, k, v) {
      var type;
      if (v===undefined||v===null)
        type = DataTypes.DEPEND;
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
    node.inputs = {}
    node.outputs = {}
    if (object.constructor.dag_inputs!=undefined) {
        for (var k in object.constructor.dag_inputs) {
            var v=object.constructor.dag_inputs[k];
            node.inputs[k] = make_slot('i', k, v);
        }
    }
    if (object.constructor.dag_outputs!=undefined) {
        for (var k in object.constructor.dag_outputs) {
            var v=object.constructor.dag_outputs[k];
            node.outputs[k] = make_slot('o', k, v);
        }
    }
  }, function indirect_node(ctx, path, object, auto_create) {
    if (object==undefined) {
        object = undefined;
    }
    if (auto_create==undefined) {
        auto_create = true;
    }
    if (path in this.node_pathmap)
      return this.node_pathmap[path];
    if (!auto_create)
      return undefined;
    var node=new IndirectNode(path);
    this.node_pathmap[path] = node;
    if (object==undefined) {
        object = ctx.api.get_object(path);
    }
    this.init_slots(node, object);
    this.add(node);
    return node;
  }, function direct_node(ctx, object, auto_create) {
    if (auto_create==undefined) {
        auto_create = true;
    }
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
  }, function add(node) {
    node.graph = this;
    this.nodes.push(node);
    this.resort = true;
    node.id = this.idgen.gen_id();
    this.idmap[node.id] = node;
  }, function remove(node) {
    if (!(__instance_of(node, EventNode)))
      node = this.get_node(node, false);
    if (node==undefined) {
        console.log("node already removed");
        return ;
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
    this.sortlist.remove(node);
    this.resort = true;
  }, function get_node(object, auto_create) {
    if (auto_create==undefined) {
        auto_create = true;
    }
    if (this.ctx==undefined)
      this.ctx = new Context();
    var node;
    if (DataPathNode.isDataPathNode(object)) {
        node = this.indirect_node(this.ctx, object.dag_get_datapath(), object, auto_create);
    }
    else {
      node = this.direct_node(this.ctx, object, auto_create);
    }
    if (node!=undefined&&object.dag_exec!=undefined&&node.dag_exec==undefined) {
        object = undefined;
        node.dag_exec = function(ctx) {
          var owner=this.get_owner(ctx);
          if (owner!=undefined) {
              return owner.dag_exec.apply(owner, arguments);
          }
        };
    }
    return node;
  }, function link(src, srcfield, dst, dstfield, dstthis) {
    var obja=src, objb=dst;
    var srcnode=this.get_node(src);
    if (!(__instance_of(srcfield, Array))) {
        $sarr_bwu3_link[0] = srcfield;
        srcfield = $sarr_bwu3_link;
    }
    if (!(__instance_of(dstfield, Array))) {
        $darr_bWm9_link[0] = dstfield;
        dstfield = $darr_bWm9_link;
    }
    if ((typeof dst=="function"||__instance_of(dst, Function))&&!dst._dag_callback_init) {
        gen_callback_exec(dst, dstthis);
        dst._dag_callback_init = true;
        delete dst.__prototypeid__;
        dst.constructor.dag_inputs = {};
        if (__instance_of(srcfield, Array)) {
            for (var i=0; i<srcfield.length; i++) {
                var field=srcfield[i];
                var field2=dstfield[i];
                if (!(field in srcnode.outputs)) {
                    console.trace(field, Object.keys(srcnode.outputs), srcnode);
                    throw new Error("Field not in outputs", field);
                }
                var type=srcnode.outputs[field].datatype;
                dst.constructor.dag_inputs[field2] = TypeDefaults[type];
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
  }, function prune_dead_nodes() {
    var dellist=[];
    var __iter_n=__get_iter(this.nodes);
    var n;
    while (1) {
      var __ival_n=__iter_n.next();
      if (__ival_n.done) {
          break;
      }
      n = __ival_n.value;
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
    var __iter_n=__get_iter(dellist);
    var n;
    while (1) {
      var __ival_n=__iter_n.next();
      if (__ival_n.done) {
          break;
      }
      n = __ival_n.value;
      this.remove(n);
    }
  }, function sort() {
    this.prune_dead_nodes();
    var sortlist=[];
    var visit={}
    var __iter_n=__get_iter(this.nodes);
    var n;
    while (1) {
      var __ival_n=__iter_n.next();
      if (__ival_n.done) {
          break;
      }
      n = __ival_n.value;
      n.flag&=~DagFlags.TEMP;
    }
    function sort(n) {
      n.flag|=DagFlags.TEMP;
      for (var k in n.inputs) {
          var sock=n.inputs[k];
          for (var i=0; i<sock.length; i++) {
              var n2=sock.edges[i].opposite(sock).owner;
              if (!(n2.flag&DagFlags.TEMP)) {
                  sort(n2);
              }
          }
      }
      sortlist.push(n);
      for (var k in n.outputs) {
          var sock=n.outputs[k];
          for (var i=0; i<sock.length; i++) {
              var n2=sock.edges[i].opposite(sock).owner;
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
  }, function on_update(node) {
    this.doexec = true;
  }, function exec(ctx) {
    if (this.resort) {
        this.sort();
    }
    var sortlist=this.sortlist;
    var slen=sortlist.length;
    for (var i=0; i<slen; i++) {
        var n=sortlist[i];
        if (!(n.flag&DagFlags.UPDATE))
          continue;
        n.flag&=~DagFlags.UPDATE;
        var owner=n.get_owner(ctx);
        if (owner==undefined) {
            n.flag|=DagFlags.DEAD;
        }
        for (var k in n.outputs) {
            var s=n.outputs[k];
            if (!(s.flag&DagFlags.UPDATE))
              continue;
            for (var j=0; j<s.edges.length; j++) {
                s.edges[j].opposite(s).owner.flag|=DagFlags.UPDATE;
            }
        }
        if (owner==undefined||owner.dag_exec==undefined)
          continue;
        for (var k in n.inputs) {
            var sock=n.inputs[k];
            for (var j=0; j<sock.edges.length; j++) {
                var e=sock.edges[j], s2=e.opposite(sock);
                var n2=s2.owner, owner2=n2.get_owner(ctx);
                if (n2==undefined) {
                    n2.flag|=DagFlags.DEAD;
                    continue;
                }
                if ((sock.flag&DagFlags.UPDATE)||sock.datatype==DataTypes.DEPEND) {
                }
                var data=s2.data!=undefined||owner2==undefined ? s2.data : owner2[s2.name];
                if (data!=undefined)
                  s2.data = data;
                switch (sock.datatype) {
                  case DataTypes.DEPEND:
                    break;
                  case DataTypes.NUMBER:
                  case DataTypes.STRING:
                  case DataTypes.BOOL:
                    owner[sock.name] = data;
                    break;
                  case DataTypes.VEC2:
                    if (!(sock.name in owner)) {
                        owner[sock.name] = new Vector2(data);
                    }
                    else {
                      owner[sock.name].load(data);
                    }
                    break;
                  case DataTypes.VEC3:
                    if (!(sock.name in owner)) {
                        owner[sock.name] = new Vector3(data);
                    }
                    else {
                      owner[sock.name].load(data);
                    }
                    break;
                  case DataTypes.VEC4:
                    if (!(sock.name in owner)) {
                        owner[sock.name] = new Vector4(data);
                    }
                    else {
                      owner[sock.name].load(data);
                    }
                    break;
                  case DataTypes.MATRIX4:
                    if (!(sock.name in owner)) {
                        owner[sock.name] = new Matrix4(data);
                    }
                    else {
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
  }]);
  var $sarr_bwu3_link=[0];
  var $darr_bWm9_link=[0];
  _es6_module.add_class(EventDag);
  EventDag = _es6_module.add_export('EventDag', EventDag);
  window.init_event_graph = function init_event_graph() {
    window.the_global_dag = new EventDag();
    _event_dag_idgen = new EIDGen();
  }
});
es6_module_define('lib_utils', ["events", "toolprops_iter", "struct"], function _lib_utils_module(_es6_module) {
  "use strict";
  es6_import(_es6_module, 'events');
  es6_import(_es6_module, 'toolprops_iter');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var EventHandler=es6_import_item(_es6_module, 'events', 'EventHandler');
  var charmap=es6_import_item(_es6_module, 'events', 'charmap');
  var DBList=_ESClass("DBList", GArray, [function DBList(type) {
    GArray.call(this);
    this.type = type;
    this.idmap = {}
    this.selected = new GArray();
    this.active = undefined;
    this.length = 0;
    this.selset = new set();
  }, _ESClass.static(function fromSTRUCT(unpacker) {
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
  }), function toJSON() {
    var list=[];
    var sellist=[];
    var __iter_block=__get_iter(this);
    var block;
    while (1) {
      var __ival_block=__iter_block.next();
      if (__ival_block.done) {
          break;
      }
      block = __ival_block.value;
      list.push(block.lib_id);
    }
    var __iter_block=__get_iter(this.selected);
    var block;
    while (1) {
      var __ival_block=__iter_block.next();
      if (__ival_block.done) {
          break;
      }
      block = __ival_block.value;
      sellist.push(block.lib_id);
    }
    var obj={list: list, selected: sellist, active: this.active!=undefined ? this.active.lib_id : -1, length: this.length, type: this.type}
    return obj;
  }, _ESClass.static(function fromJSON(obj) {
    var list=new DBList(obj.type);
    list.list = new GArray(obj.list);
    list.selected = new GArray(obj.selected);
    list.active = obj.active;
    list.length = obj.length;
  }), function clear_select() {
    var __iter_block=__get_iter(this.selected);
    var block;
    while (1) {
      var __ival_block=__iter_block.next();
      if (__ival_block.done) {
          break;
      }
      block = __ival_block.value;
      block.flag&=~SELECT;
    }
    this.selset = new set();
    this.selected = new GArray();
  }, function set_active(block) {
    if (block==undefined&&this.length>0) {
        console.trace();
        console.log("Undefined actives are illegal for DBLists, unless the list length is zero.");
        return ;
    }
    this.active = block;
  }, function select(block, do_select) {
    if (do_select==undefined) {
        do_select = true;
    }
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
  }, function data_link(block, getblock, getblock_us) {
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
  }, function push(block) {
    if (!(__instance_of(block, DataBlock))) {
        warntrace("WARNING: bad value ", block, " passed to DBList.select()");
        return ;
    }
    GArray.prototype.push.call(this, block);
    this.idmap[block.lib_id] = block;
    if (this.active==undefined) {
        this.active = block;
        this.select(block, true);
    }
  }, function remove(block) {
    var i=this.indexOf(block);
    if (i<0||i==undefined) {
        warn("WARNING: Could not remove block "+block.name+" from a DBList");
        return ;
    }
    this.pop(i);
  }, function pop(i) {
    if (i<0||i>=this.length) {
        warn("WARNING: Invalid argument ", i, " to static pop()");
        print_stack();
        return ;
    }
    var block=this[i];
    GArray.prototype.pop.call(this, i);
    delete this.idmap[block.lib_id];
    if (this.active==block) {
        this.select(block, false);
        this.active = this.length>0 ? this[0] : undefined;
    }
    if (this.selset.has(block)) {
        this.selected.remove(block);
        this.selset.remove(block);
    }
  }, function idget(id) {
    return this.idmap[id];
  }]);
  _es6_module.add_class(DBList);
  DBList.STRUCT = "\n  DBList {\n    type : int;\n    selected : array(dataref(DataBlock));\n    arrdata : array(dataref(DataBlock)) | obj;\n    active : dataref(DataBlock);\n  }\n";
  function DataArrayRem(dst, field, obj) {
    var array=dst[field];
    function rem() {
      array.remove(obj);
    }
    return rem;
  }
  function SceneObjRem(scene, obj) {
    function rem() {
      var __iter_e=__get_iter(obj.dag_node.inmap["parent"]);
      var e;
      while (1) {
        var __ival_e=__iter_e.next();
        if (__ival_e.done) {
            break;
        }
        e = __ival_e.value;
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
    return function(dataref, block, fieldname, add_user, refname, rem_func) {
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
    return function(dataref) {
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
  var DataRefList=_ESClass("DataRefList", GArray, [function DataRefList(lst) {
    if (lst==undefined) {
        lst = undefined;
    }
    GArray.call(this);
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
        var __iter_b=__get_iter(lst);
        var b;
        while (1) {
          var __ival_b=__iter_b.next();
          if (__ival_b.done) {
              break;
          }
          b = __ival_b.value;
          this.push(b);
        }
    }
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return new DataRefListIter(this, new Context());
  }), _ESClass.set(function ctx(ctx) {
    this.datalib = ctx.datalib;
  }), _ESClass.get(function ctx() {
    return undefined;
  }), function get(i, return_block) {
    if (return_block==undefined) {
        return_block = true;
    }
    if (return_block) {
        var dl=this.datalib!=undefined ? this.datalib : g_app_state.datalib;
        return dl.get(this[i]);
    }
    else {
      return this[i];
    }
  }, function push(b) {
    if (!(b = this._b(b)))
      return ;
    if (__instance_of(b, DataBlock))
      b = new DataRef(b);
    GArray.prototype.push.call(this, new DataRef(b));
  }, function _b(b) {
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
  }, function remove(b) {
    if (!(b = this._b(b)))
      return ;
    var i=this.indexOf(b);
    if (i<0) {
        warntrace("WARNING: ", b, " not found in this DataRefList");
        return ;
    }
    this.pop(i);
  }, function pop(i, return_block) {
    if (return_block==undefined) {
        return_block = true;
    }
    var ret=GArray.prototype.pop.call(this, i);
    if (return_block)
      ret = new Context().datalib.get(ret.id);
    return ret;
  }, function replace(a, b) {
    if (!(b = this._b(b)))
      return ;
    var i=this.indexOf(a);
    if (i<0) {
        warntrace("WARNING: ", b, " not found in this DataRefList");
        return ;
    }
    this[i] = b;
  }, function indexOf(b) {
    Array.indexOf.call(this, b);
    if (!(b = this._b(b)))
      return ;
    for (var i=0; i<this.length; i++) {
        if (this[i].id==b.id)
          return i;
    }
    return -1;
  }, function insert(index, b) {
    if (!(b = this._b(b)))
      return ;
    GArray.prototype.insert.call(this, b);
  }, function prepend(b) {
    if (!(b = this._b(b)))
      return ;
    GArray.prototype.prepend.call(this, b);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret={}
    reader(ret);
    return new DataRefList(ret.list);
  })]);
  _es6_module.add_class(DataRefList);
  mixin(DataRefList, TPropIterable);
  DataRefList.STRUCT = "\n  DataRefList {\n    list : array(i, dataref(DataBlock)) | this[i];\n  }\n";
});
es6_module_define('nacl_api', ["spline_types", "ajax", "solver", "toolops_api", "typedwriter", "spline_base", "spline_math_hermite"], function _nacl_api_module(_es6_module) {
  "use strict";
  var TypedWriter=es6_import_item(_es6_module, 'typedwriter', 'TypedWriter');
  var mmax=Math.max, mmin=Math.min, mfloor=Math.floor;
  var abs=Math.abs, sqrt=Math.sqrt, sin=Math.sin, cos=Math.cos, pow=Math.pow, log=Math.log, acos=Math.acos, asin=Math.asin, PI=Math.PI;
  var DEBUG=false;
  var constraint=es6_import_item(_es6_module, 'solver', 'constraint');
  var solver=es6_import_item(_es6_module, 'solver', 'solver');
  var ModalStates=es6_import_item(_es6_module, 'toolops_api', 'ModalStates');
  var SplineTypes=es6_import_item(_es6_module, 'spline_base', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, 'spline_base', 'SplineFlags');
  var FIXED_KS_FLAG=SplineFlags.FIXED_KS;
  function has_nacl() {
    return common.naclModule!=undefined;
  }
  has_nacl = _es6_module.add_export('has_nacl', has_nacl);
  var solve_idgen=0;
  var active_solves={}
  active_solves = _es6_module.add_export('active_solves', active_solves);
  var solve_starttimes={}
  solve_starttimes = _es6_module.add_export('solve_starttimes', solve_starttimes);
  var solve_starttimes2={}
  solve_starttimes2 = _es6_module.add_export('solve_starttimes2', solve_starttimes2);
  var solve_endtimes={}
  solve_endtimes = _es6_module.add_export('solve_endtimes', solve_endtimes);
  var active_jobs={}
  active_jobs = _es6_module.add_export('active_jobs', active_jobs);
  var MessageTypes={GEN_DRAW_BEZIERS: 0, REPLY: 1, SOLVE: 2}
  var callbacks={}
  callbacks = _es6_module.add_export('callbacks', callbacks);
  var msg_idgen=0;
  msg_idgen = _es6_module.add_export('msg_idgen', msg_idgen);
  var ORDER=es6_import_item(_es6_module, 'spline_math_hermite', 'ORDER');
  var KSCALE=es6_import_item(_es6_module, 'spline_math_hermite', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, 'spline_math_hermite', 'KANGLE');
  var KSTARTX=es6_import_item(_es6_module, 'spline_math_hermite', 'KSTARTX');
  var KSTARTY=es6_import_item(_es6_module, 'spline_math_hermite', 'KSTARTY');
  var KSTARTZ=es6_import_item(_es6_module, 'spline_math_hermite', 'KSTARTZ');
  var KTOTKS=es6_import_item(_es6_module, 'spline_math_hermite', 'KTOTKS');
  var INT_STEPS=es6_import_item(_es6_module, 'spline_math_hermite', 'INT_STEPS');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var ConstraintTypes={TAN_CONSTRAINT: 0, HARD_TAN_CONSTRAINT: 1, CURVATURE_CONSTRAINT: 2, COPY_C_CONSTRAINT: 3}
  ConstraintTypes = _es6_module.add_export('ConstraintTypes', ConstraintTypes);
  var JobTypes={DRAWSOLVE: 1, PATHSOLVE: 2, SOLVE: 1|2}
  JobTypes = _es6_module.add_export('JobTypes', JobTypes);
  var ajax=es6_import(_es6_module, 'ajax');
  function clear_jobs_except_latest(typeid) {
    var last=undefined;
    var lastk=undefined;
    for (var k in callbacks) {
        var job=callbacks[k];
        if (job.typeid&typeid) {
            job._skip = 1;
            delete callbacks[k];
            last = job;
            lastk = k;
        }
    }
    if (last!=undefined) {
        callbacks[lastk] = last;
        delete last._skip;
    }
  }
  clear_jobs_except_latest = _es6_module.add_export('clear_jobs_except_latest', clear_jobs_except_latest);
  function clear_jobs_except_first(typeid) {
    var last=undefined;
    var lastk=undefined;
    for (var k in callbacks) {
        var job=callbacks[k];
        if (job.typeid&typeid) {
            if (last!=undefined) {
                job._skip = 1;
                delete callbacks[k];
            }
            last = job;
            lastk = k;
        }
    }
  }
  clear_jobs_except_first = _es6_module.add_export('clear_jobs_except_first', clear_jobs_except_first);
  function clear_jobs(typeid) {
    for (var k in callbacks) {
        var job=callbacks[k];
        if (job.typeid&typeid) {
            job._skip = 1;
            delete callbacks[k];
        }
    }
  }
  clear_jobs = _es6_module.add_export('clear_jobs', clear_jobs);
  var last_call=undefined;
  var build_solver=es6_import_item(_es6_module, 'spline_math_hermite', 'build_solver');
  function _get_job(message) {
    if (__instance_of(message.data, ArrayBuffer)) {
        var iview=new Int32Array(message.data);
        if (DEBUG)
          console.log("got array buffer!", message.data);
        var id=iview[1];
        if (!(id in callbacks)) {
            return ;
        }
        var job=callbacks[id], iter=job.job;
        if (DEBUG)
          console.log("job:", job);
        return job;
    }
  }
  _get_job = _es6_module.add_export('_get_job', _get_job);
  function destroy_job(job) {
    delete callbacks[job.status.msgid];
  }
  var handleMessage_intern=function(message) {
    if (typeof message.data=="string"||__instance_of(message.data, String)) {
        if (message.data.startsWith("OK ")) {
            console.log("%cNaCL: %s", "color:green", message.data.slice(3, message.data.length));
        }
        else 
          if (message.data.startsWith("ER ")) {
            console.log("%cNaCL: Error: %s", "color:red", message.data.slice(3, message.data.length));
        }
        else {
          console.log("%cNaCL: %s", "color:rgb(255, 65, 10)", message.data);
        }
    }
    else 
      if (__instance_of(message.data, ArrayBuffer)) {
        var iview=new Int32Array(message.data);
        if (DEBUG)
          console.log("got array buffer!", message.data);
        var id=iview[1];
        if (!(id in callbacks)) {
            return ;
        }
        var job=callbacks[id], iter=job.job;
        if (DEBUG)
          console.log("job:", job);
        job.status.data = message.data.slice(8, message.data.byteLength);
        if (DEBUG)
          console.log("iter:", iter, iter.data);
        var ret=iter.next();
        if (ret.done) {
            delete callbacks[id];
            if (job.callback!=undefined)
              job.callback.call(job.thisvar, job.status.value);
        }
        return ;
    }
    else {
      if (DEBUG)
        console.log("Got message!", message);
    }
  }
  var queue=[];
  queue = _es6_module.add_export('queue', queue);
  window.handleMessage = function(message) {
    handleMessage_intern(message);
  }
  function _PostMessage(msg, id) {
    common.naclModule.postMessage(data);
  }
  _PostMessage = _es6_module.add_export('_PostMessage', _PostMessage);
  function call_api(job, params) {
    if (params==undefined) {
        params = undefined;
    }
    var callback, error, thisvar, typeid, only_latest=false;
    if (params!=undefined) {
        callback = params.callback;
        thisvar = params.thisvar!=undefined ? params.thisvar : self;
        error = params.error;
        only_latest = params.only_latest!=undefined ? params.only_latest : false;
        typeid = params.typeid;
    }
    var postMessage=function(msg) {
      common.naclModule.postMessage(msg);
    }
    var id=msg_idgen++;
    var status={msgid: id, data: undefined}
    var args=[postMessage, status];
    for (var i=2; i<arguments.length; i++) {
        args.push(arguments[i]);
    }
    var iter=job.apply(job, args);
    var ret=iter.next();
    if (ret.done) {
        callback.call(thisvar, iter.value);
        return ;
    }
    callbacks[id] = {job: iter, typeid: typeid, only_latest: only_latest, callback: callback, thisvar: thisvar, error: error, status: status}
  }
  call_api = _es6_module.add_export('call_api', call_api);
  function test_nacl() {
    call_api(gen_draw_cache, {callback: function(value) {
    }}, new Context().frameset.spline);
    window.redraw_viewport();
  }
  test_nacl = _es6_module.add_export('test_nacl', test_nacl);
  function start_message(type, msgid, endian) {
    var data=[];
    ajax.pack_int(data, type, endian);
    ajax.pack_int(data, msgid, endian);
    return data;
  }
  start_message = _es6_module.add_export('start_message', start_message);
  function start_message_new(writer, type, msgid, endian) {
    writer.int32(type);
    writer.int32(msgid);
  }
  start_message_new = _es6_module.add_export('start_message_new', start_message_new);
  function _unpacker(dview) {
    var b=0;
    return {getint: function getint() {
      b+=4;
      return dview.getInt32(b-4, endian);
    }, getfloat: function getfloat() {
      b+=4;
      return dview.getFloat32(b-4, endian);
    }, getdouble: function getdouble() {
      b+=8;
      return dview.getFloat64(b-8, endian);
    }}
  }
  function gen_draw_cache(postMessage, status, spline) {
    var __gen_this2=this;
    function _generator_iter() {
      this.scope = {dview_18: undefined, i_18: undefined, __iter_s_1: undefined, endian_1: undefined, getdouble_18: undefined, status_0: status, ret_18: undefined, data_1: undefined, postMessage_0: postMessage, getint_18: undefined, upack_18: undefined, tot_18: undefined, msgid_1: undefined, eidmap_18: undefined, s_1: undefined, getfloat_18: undefined, spline_0: spline}
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
        while ($__state<33) {
          switch ($__state) {
            case 0:
              break;
            case 1:
              scope.data_1=[];
              scope.msgid_1=scope.status_0.msgid;
              scope.endian_1=ajax.little_endian;
              scope.data_1=start_message(MessageTypes.GEN_DRAW_BEZIERS, scope.msgid_1, scope.endian_1);
              ajax.pack_int(scope.data_1, scope.spline_0.segments.length, scope.endian_1);
              ajax.pack_int(scope.data_1, 0, scope.endian_1);
              scope.__iter_s_1=__get_iter(scope.spline_0.segments);
              scope.s_1;
              
              $__state = 2;
              break;
            case 2:
              $__state = (1) ? 3 : 16;
              break;
            case 3:
              scope.__ival_s_3=scope.__iter_s_1.next();
              
              $__state = 4;
              break;
            case 4:
              $__state = (scope.__ival_s_3.done) ? 5 : 6;
              break;
            case 5:
              $__state = 16;
              break;
              
              $__state = 6;
              break;
            case 6:
              scope.s_1 = scope.__ival_s_3.value;
              ajax.pack_int(scope.data_1, scope.s_1.eid, scope.endian_1);
              ajax.pack_vec3(scope.data_1, scope.s_1.v1, scope.endian_1);
              ajax.pack_vec3(scope.data_1, scope.s_1.v2, scope.endian_1);
              ajax.pack_int(scope.data_1, scope.s_1.ks.length, scope.endian_1);
              scope.zero_ks_6=((scope.s_1.v1.flag&SplineFlags.BREAK_TANGENTS)||(scope.s_1.v2.flag&SplineFlags.BREAK_TANGENTS));
              scope.i_6=0;
              
              $__state = 7;
              break;
            case 7:
              $__state = (scope.i_6<scope.s_1.ks.length) ? 8 : 13;
              break;
            case 8:
              $__state = (scope.zero_ks_6&&scope.i_6<ORDER) ? 9 : 10;
              break;
            case 9:
              ajax.pack_double(scope.data_1, 0.0, scope.endian_1);
              
              $__state = 12;
              break;
            case 10:
              
              $__state = 11;
              break;
            case 11:
              ajax.pack_double(scope.data_1, scope.s_1.ks[scope.i_6], scope.endian_1);
              
              $__state = 12;
              break;
            case 12:
              scope.i_6++;
              
              $__state = 7;
              break;
            case 13:
              scope.rem_13=16-scope.s_1.ks.length;
              scope.i_6=0;
              
              $__state = 14;
              break;
            case 14:
              $__state = (scope.i_6<scope.rem_13) ? 15 : 2;
              break;
            case 15:
              ajax.pack_double(scope.data_1, 0.0, scope.endian_1);
              scope.i_6++;
              
              $__state = 14;
              break;
            case 16:
              scope.data_1 = new Uint8Array(scope.data_1).buffer;
              postMessage(scope.data_1);
              
              $__state = 17;
              break;
            case 17:
              $__ret = this.ret;
              $__ret.value = undefined;
              
              $__state = 18;
              break;
            case 18:
              scope.dview_18=new DataView(scope.status_0.data);
              scope.upack_18=_unpacker(scope.dview_18);
              scope.getint_18=scope.upack_18.getint;
              scope.getfloat_18=scope.upack_18.getfloat;
              scope.getdouble_18=scope.upack_18.getdouble;
              scope.tot_18=getint();
              scope.ret_18=[];
              scope.eidmap_18=scope.spline_0.eidmap;
              scope.i_18=0;
              
              $__state = 19;
              break;
            case 19:
              $__state = (scope.i_18<scope.tot_18) ? 20 : 32;
              break;
            case 20:
              scope.eid_20=getint(), scope.totseg_20=getint();
              scope.segs_20=[];
              scope.seg_20=scope.eidmap_18[scope.eid_20];
              
              $__state = 21;
              break;
            case 21:
              $__state = (scope.seg_20==undefined||scope.seg_20.type!=SplineTypes.SEGMENT) ? 22 : 23;
              break;
            case 22:
              console.log("WARNING: defunct segment in gen_draw_cache", scope.seg_20);
              
              $__state = 23;
              break;
            case 23:
              scope.ret_18.push(scope.segs_20);
              scope.j_23=0;
              
              $__state = 24;
              break;
            case 24:
              $__state = (scope.j_23<scope.totseg_20) ? 25 : 26;
              break;
            case 25:
              scope.segs_20[scope.j_23] = [0, 0, 0, 0];
              scope.j_23++;
              
              $__state = 24;
              break;
            case 26:
              scope.j_23=0;
              
              $__state = 27;
              break;
            case 27:
              $__state = (scope.j_23<scope.totseg_20*4) ? 28 : 29;
              break;
            case 28:
              scope.p_28=new Vector3();
              scope.p_28[0] = getdouble();
              scope.p_28[1] = getdouble();
              scope.p_28[2] = 0.0;
              scope.segs_20[Math.floor(scope.j_23/4)][scope.j_23%4] = scope.p_28;
              scope.j_23++;
              
              $__state = 27;
              break;
            case 29:
              $__state = (scope.seg_20!=undefined) ? 30 : 31;
              break;
            case 30:
              scope.seg_20._draw_bzs = scope.segs_20;
              
              $__state = 31;
              break;
            case 31:
              scope.i_18++;
              
              $__state = 19;
              break;
            case 32:
              scope.status_0.value = scope.ret_18;
              
              $__state = 33;
              break;
            case 33:
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
  gen_draw_cache = _es6_module.add_export('gen_draw_cache', gen_draw_cache);
  function do_solve(sflags, spline, steps, gk, return_promise, draw_id) {
    if (gk==undefined) {
        gk = 0.95;
    }
    if (return_promise==undefined) {
        return_promise = false;
    }
    if (draw_id==undefined) {
        draw_id = 0;
    }
    if (spline._solve_id==undefined) {
        spline._solve_id = solve_idgen++;
    }
    if (spline._solve_id in active_solves) {
    }
    var job_id=solve_idgen++;
    active_solves[spline._solve_id] = job_id;
    active_jobs[job_id] = spline._solve_id;
    solve_starttimes[job_id] = time_ms();
    var SplineFlags=sflags;
    spline.resolve = 1;
    spline.propagate_update_flags();
    for (var i=0; i<spline.segments.length; i++) {
        var seg=spline.segments[i];
        if ((!(seg.v1.flag&SplineFlags.UPDATE)&&!(seg.v2.flag&SplineFlags.UPDATE)))
          continue;
        if ((seg.v1.flag&SplineFlags.BREAK_TANGENTS)&&(seg.v2.flag&SplineFlags.BREAK_TANGENTS)) {
            for (var j=0; j<seg.ks.length; j++) {
                seg.ks[j] = 1e-07;
            }
        }
        for (var j=0; j<seg.ks.length; j++) {
            if (isNaN(seg.ks[j])) {
                seg.ks[j] = 1e-06;
            }
        }
        seg.evaluate(0.5);
    }
    var on_finish, on_reject, promise;
    if (return_promise) {
        promise = new Promise(function(resolve, reject) {
          on_finish = function() {
            resolve();
          }
          on_reject = function() {
            reject();
          }
        });
    }
    function finish(unload) {
      var start_time=solve_starttimes[job_id];
      window.pop_solve(draw_id);
      var skip=solve_endtimes[spline._solve_id]>start_time;
      skip = skip&&solve_starttimes2[spline._solve_id]>start_time;
      delete active_jobs[job_id];
      delete active_solves[spline._solve_id];
      delete solve_starttimes[job_id];
      if (skip) {
          if (on_reject!=undefined) {
              on_reject();
          }
          console.log("Dropping dead solve job", job_id);
          return ;
      }
      unload();
      solve_endtimes[spline._solve_id] = time_ms();
      solve_starttimes2[spline._solve_id] = start_time;
      console.log((solve_endtimes[spline._solve_id]-start_time).toFixed(2)+"ms");
      for (var i=0; i<spline.segments.length; i++) {
          var seg=spline.segments[i];
          seg.evaluate(0.5);
          for (var j=0; j<seg.ks.length; j++) {
              if (isNaN(seg.ks[j])) {
                  console.log("NaN!", seg.ks, seg);
                  seg.ks[j] = 0;
              }
          }
          if (g_app_state.modalstate!=ModalStates.TRANSFROMING) {
              if ((seg.v1.flag&SplineFlags.UPDATE)||(seg.v2.flag&SplineFlags.UPDATE))
                seg.update_aabb();
          }
          else {
            if ((seg.v1.flag&SplineFlags.UPDATE)||(seg.v2.flag&SplineFlags.UPDATE))
              seg.flag|=SplineFlags.UPDATE_AABB;
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
      if (on_finish!=undefined) {
          on_finish();
      }
    }
    spline.resolve = 0;
    var update_verts=new set();
    var slv=build_solver(spline, ORDER, undefined, 1, undefined, update_verts);
    var cs=slv.cs, edge_segs=slv.edge_segs;
    edge_segs = new set(edge_segs);
    call_api(nacl_solve, {callback: function(value) {
      finish(value);
    }, error: function(error) {
      console.log("Nacl solve error!");
      window.pop_solve(draw_id);
    }, typeid: spline.is_anim_path ? JobTypes.PATHSOLVE : JobTypes.DRAWSOLVE, only_latest: true}, spline, cs, update_verts, gk, edge_segs);
    return promise;
  }
  do_solve = _es6_module.add_export('do_solve', do_solve);
  window.nacl_do_solve = do_solve;
  function write_nacl_solve_new(writer, spline, cons, update_verts, update_segs, gk, edge_segs) {
    var idxmap={}
    var i=0;
    function add_vert(v) {
      writer.int32(v.eid);
      writer.int32(v.flag);
      writer.vec3(v);
      writer.int32(0);
      idxmap[v.eid] = i++;
    }
    var __iter_v=__get_iter(update_verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      add_vert(v, true);
    }
    writer.int32(update_segs.length);
    writer.int32(0);
    var i=0;
    var __iter_s=__get_iter(update_segs);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      var flag=s.flag;
      if (edge_segs.has(s)) {
          flag|=FIXED_KS_FLAG;
      }
      writer.int32(s.eid);
      writer.int32(flag);
      var klen=s.ks.length;
      var is_eseg=edge_segs.has(s);
      var zero_ks=((s.v1.flag&SplineFlags.BREAK_TANGENTS)||(s.v2.flag&SplineFlags.BREAK_TANGENTS));
      for (var ji=0; ji<1; ji++) {
          for (var j=0; j<klen; j++) {
              if (zero_ks&&j<ORDER)
                writer.float64(0.0);
              else 
                writer.float64(is_eseg ? s.ks[j] : 0.0);
          }
          for (var j=0; j<16-klen; j++) {
              writer.float64(0.0);
          }
      }
      writer.vec3(s.h1);
      writer.vec3(s.h2);
      writer.int32(idxmap[s.v1.eid]);
      writer.int32(idxmap[s.v2.eid]);
      idxmap[s.eid] = i++;
    }
    writer.int32(cons.length);
    writer.int32(0.0);
    for (var i=0; i<cons.length; i++) {
        var c=cons[i];
        var type=0, seg1=-1, seg2=-1, param1=0, param2=0, fparam1=0, fparam2=0;
        if (c.type=="tan_c") {
            type = ConstraintTypes.TAN_CONSTRAINT;
            seg1 = c.params[0];
            seg2 = c.params[1];
            var v=seg1.shared_vert(seg2);
            param1 = idxmap[seg1.eid];
            param2 = idxmap[seg2.eid];
            fparam1 = seg1.v2===v;
            fparam2 = seg2.v2===v;
            if (c.klst.length==1) {
                seg1 = c.klst[0]!==seg1.ks ? param2 : param1;
                seg2 = -1;
            }
            else {
              seg1 = param1;
              seg2 = param2;
            }
        }
        else 
          if (c.type=="hard_tan_c") {
            type = ConstraintTypes.HARD_TAN_CONSTRAINT;
            var seg=c.params[0], tan=c.params[1], s=c.params[2];
            seg1 = idxmap[seg.eid];
            seg2 = -1;
            fparam1 = Math.atan2(tan[0], tan[1]);
            fparam2 = s;
        }
        else 
          if (c.type=="curv_c") {
            type = ConstraintTypes.CURVATURE_CONSTRAINT;
            seg1 = c.params[0];
            seg2 = c.params[1];
            if (seg1.ks!==c.klst[0]) {
            }
            var v=seg1.shared_vert(seg2);
            fparam1 = seg1.v2===v;
            fparam2 = seg2.v2===v;
            param1 = idxmap[seg1.eid];
            param2 = idxmap[seg2.eid];
            seg1 = param1;
            seg2 = -1;
        }
        else 
          if (c.type=="copy_c") {
            type = ConstraintTypes.COPY_C_CONSTRAINT;
            seg1 = c.params[0];
            param1 = seg1.v1.segments.length==1;
        }
        else {
          console.trace(c, seg1, seg2);
          throw new Error("unknown constraint type "+c.type);
        }
        writer.int32(type);
        writer.float32(c.k*gk);
        writer.float32(c.k2==undefined ? c.k*gk : c.k2*gk);
        writer.int32(0);
        writer.int32(seg1);
        writer.int32(seg2);
        writer.int32(param1);
        writer.int32(param2);
        writer.float32(fparam1);
        writer.float32(fparam2);
        for (var j=0; j<33; j++) {
            writer.float64(0);
        }
    }
    return idxmap;
  }
  function write_nacl_solve(data, spline, cons, update_verts, update_segs, gk, edge_segs) {
    var endian=ajax.little_endian;
    var idxmap={}
    var i=0;
    function add_vert(v) {
      ajax.pack_int(data, v.eid, endian);
      ajax.pack_int(data, v.flag, endian);
      ajax.pack_vec3(data, v, endian);
      ajax.pack_int(data, 0, endian);
      idxmap[v.eid] = i++;
    }
    var __iter_v=__get_iter(update_verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      add_vert(v, true);
    }
    ajax.pack_int(data, update_segs.length, endian);
    ajax.pack_int(data, 0, endian);
    var i=0;
    var __iter_s=__get_iter(update_segs);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      var flag=s.flag;
      if (edge_segs.has(s)) {
          flag|=FIXED_KS_FLAG;
      }
      ajax.pack_int(data, s.eid, endian);
      ajax.pack_int(data, flag, endian);
      var klen=s.ks.length;
      var is_eseg=edge_segs.has(s);
      var zero_ks=((s.v1.flag&SplineFlags.BREAK_TANGENTS)||(s.v2.flag&SplineFlags.BREAK_TANGENTS));
      for (var ji=0; ji<1; ji++) {
          for (var j=0; j<klen; j++) {
              if (zero_ks&&j<ORDER)
                ajax.pack_double(data, 0.0, endian);
              else 
                ajax.pack_double(data, is_eseg ? s.ks[j] : 0.0, endian);
          }
          for (var j=0; j<16-klen; j++) {
              ajax.pack_double(data, 0.0, endian);
          }
      }
      ajax.pack_vec3(data, s.h1, endian);
      ajax.pack_vec3(data, s.h2, endian);
      ajax.pack_int(data, idxmap[s.v1.eid], endian);
      ajax.pack_int(data, idxmap[s.v2.eid], endian);
      idxmap[s.eid] = i++;
    }
    ajax.pack_int(data, cons.length, endian);
    ajax.pack_int(data, 0, endian);
    for (var i=0; i<cons.length; i++) {
        var c=cons[i];
        var type=0, seg1=-1, seg2=-1, param1=0, param2=0, fparam1=0, fparam2=0;
        if (c.type=="tan_c") {
            type = ConstraintTypes.TAN_CONSTRAINT;
            seg1 = c.params[0];
            seg2 = c.params[1];
            var v=seg1.shared_vert(seg2);
            param1 = idxmap[seg1.eid];
            param2 = idxmap[seg2.eid];
            fparam1 = seg1.v2===v;
            fparam2 = seg2.v2===v;
            if (c.klst.length==1) {
                seg1 = c.klst[0]!==seg1.ks ? param2 : param1;
                seg2 = -1;
            }
            else {
              seg1 = param1;
              seg2 = param2;
            }
        }
        else 
          if (c.type=="hard_tan_c") {
            type = ConstraintTypes.HARD_TAN_CONSTRAINT;
            var seg=c.params[0], tan=c.params[1], s=c.params[2];
            seg1 = idxmap[seg.eid];
            seg2 = -1;
            fparam1 = Math.atan2(tan[0], tan[1]);
            fparam2 = s;
        }
        else 
          if (c.type=="curv_c") {
            type = ConstraintTypes.CURVATURE_CONSTRAINT;
            seg1 = c.params[0];
            seg2 = c.params[1];
            if (seg1.ks!==c.klst[0]) {
            }
            var v=seg1.shared_vert(seg2);
            fparam1 = seg1.v2===v;
            fparam2 = seg2.v2===v;
            param1 = idxmap[seg1.eid];
            param2 = idxmap[seg2.eid];
            seg1 = param1;
            seg2 = -1;
        }
        else 
          if (c.type=="copy_c") {
            type = ConstraintTypes.COPY_C_CONSTRAINT;
            seg1 = c.params[0];
            param1 = seg1.v1.segments.length==1;
        }
        ajax.pack_int(data, type, endian);
        ajax.pack_float(data, c.k*gk, endian);
        ajax.pack_float(data, c.k2==undefined ? c.k*gk : c.k2*gk, endian);
        ajax.pack_int(data, 0, endian);
        ajax.pack_int(data, seg1, endian);
        ajax.pack_int(data, seg2, endian);
        ajax.pack_int(data, param1, endian);
        ajax.pack_int(data, param2, endian);
        ajax.pack_float(data, fparam1, endian);
        ajax.pack_float(data, fparam2, endian);
        for (var j=0; j<33; j++) {
            ajax.pack_double(data, 0, endian);
        }
    }
    return idxmap;
  }
  function _unload(spline, data) {
    var _i=0;
    function getint() {
      _i+=4;
      return data.getInt32(_i-4, true);
    }
    function getfloat() {
      _i+=4;
      return data.getFloat32(_i-4, true);
    }
    function getdouble() {
      _i+=8;
      return data.getFloat64(_i-8, true);
    }
    var totvert=getint();
    getint();
    _i+=24*totvert;
    var totseg=getint();
    getint();
    for (var i=0; i<totseg; i++) {
        var eid=getint(), flag=getint();
        var seg=spline.eidmap[eid];
        if (seg==undefined||seg.type!=SplineTypes.SEGMENT) {
            console.log("WARNING: defunct/invalid segment in nacl_solve!", eid);
            _i+=160;
            continue;
        }
        for (var j=0; j<16; j++) {
            var d=getdouble();
            if (j<seg.ks.length) {
                seg.ks[j] = d;
            }
        }
        _i+=4*6;
        _i+=4*2;
    }
  }
  function wrap_unload(spline, data) {
    return function() {
      _unload(spline, data);
    }
  }
  function nacl_solve(postMessage, status, spline, cons, update_verts, gk, edge_segs) {
    var ret={}
    ret.ret = {done: false, value: undefined}
    ret.stage = 0;
    ret[Symbol.iterator] = function() {
      return this;
    }
    ret.next = function() {
      if (ret.stage==0) {
          this.stage++;
          this.stage0();
          return this.ret;
      }
      else 
        if (ret.stage==1) {
          this.stage++;
          this.stage1();
          this.ret.done = true;
          return this.ret;
      }
      else {
        this.ret.done = true;
        this.ret.value = undefined;
        return this.ret;
      }
    }
    var data;
    ret.stage0 = function() {
      var maxsize=(cons.length+1)*650+128;
      var writer=new TypedWriter(maxsize);
      var msgid=status.msgid;
      var endian=ajax.little_endian;
      var prof=false;
      start_message_new(writer, MessageTypes.SOLVE, msgid, endian);
      var timestart=time_ms();
      var update_segs=new set();
      var __iter_v=__get_iter(update_verts);
      var v;
      while (1) {
        var __ival_v=__iter_v.next();
        if (__ival_v.done) {
            break;
        }
        v = __ival_v.value;
        for (var i=0; i<v.segments.length; i++) {
            var s=v.segments[i];
            update_segs.add(s);
        }
      }
      var __iter_s=__get_iter(update_segs);
      var s;
      while (1) {
        var __ival_s=__iter_s.next();
        if (__ival_s.done) {
            break;
        }
        s = __ival_s.value;
        update_verts.add(s.v1);
        update_verts.add(s.v2);
      }
      if (prof)
        console.log("time a:", time_ms()-timestart);
      writer.int32(update_verts.length);
      writer.int32(0);
      if (prof)
        console.log("time b:", time_ms()-timestart);
      var idxmap=write_nacl_solve_new(writer, spline, cons, update_verts, update_segs, gk, edge_segs);
      var data=writer.final();
      if (prof)
        console.log("time c:", time_ms()-timestart);
      if (prof)
        console.log("time d:", time_ms()-timestart, data.byteLength);
      postMessage(data);
      if (prof)
        console.log("time e:", time_ms()-timestart, "\n\n\n");
    }
    ret.stage1 = function() {
      data = new DataView(status.data);
      status.value = wrap_unload(spline, data);
    }
    return ret;
  }
  nacl_solve = _es6_module.add_export('nacl_solve', nacl_solve);
});
"not_a_module";
"use strict";
var isTest=false;
var isRelease=false;
var common=(function() {
  function isHostToolchain(tool) {
    return tool=='win'||tool=='linux'||tool=='mac';
  }
  function mimeTypeForTool(tool) {
    var mimetype='application/x-nacl';
    if (isHostToolchain(tool)) {
        if (isRelease)
          mimetype = 'application/x-ppapi-release';
        else 
          mimetype = 'application/x-ppapi-debug';
    }
    else 
      if (tool=='pnacl') {
        mimetype = 'application/x-pnacl';
    }
    return mimetype;
  }
  function browserSupportsNaCl(tool) {
    if (isHostToolchain(tool)) {
        return true;
    }
    var mimetype=mimeTypeForTool(tool);
    return navigator.mimeTypes[mimetype]!==undefined;
  }
  function injectScript(url, onload, onerror) {
    var scriptEl=document.createElement('script');
    scriptEl.type = 'text/javascript';
    scriptEl.src = url;
    scriptEl.onload = onload;
    if (onerror) {
        scriptEl.addEventListener('error', onerror, false);
    }
    document.head.appendChild(scriptEl);
  }
  function runTests(moduleEl) {
    console.log('runTests()');
    common.tester = new Tester();
    common.tester.exitCleanlyIsOK();
    common.tester.addAsyncTest('loaded', function(test) {
      test.pass();
    });
    if (typeof window.addTests!=='undefined') {
        window.addTests();
    }
    common.tester.waitFor(moduleEl);
    common.tester.run();
  }
  function createNaClModule(name, tool, path, width, height, attrs) {
    var moduleEl=document.createElement('embed');
    moduleEl.setAttribute('name', 'nacl_module');
    moduleEl.setAttribute('id', 'nacl_module');
    moduleEl.setAttribute('width', width);
    moduleEl.setAttribute('height', height);
    moduleEl.setAttribute('path', path);
    moduleEl.setAttribute('src', path+'/'+name+'.nmf');
    if (attrs) {
        for (var key in attrs) {
            moduleEl.setAttribute(key, attrs[key]);
        }
    }
    var mimetype=mimeTypeForTool(tool);
    moduleEl.setAttribute('type', mimetype);
    var listenerDiv=document.getElementById('listener');
    listenerDiv.appendChild(moduleEl);
    moduleEl.offsetTop;
    var isHost=isHostToolchain(tool);
    if (isHost) {
        window.setTimeout(function() {
          moduleEl.readyState = 1;
          moduleEl.dispatchEvent(new CustomEvent('loadstart'));
          moduleEl.readyState = 4;
          moduleEl.dispatchEvent(new CustomEvent('load'));
          moduleEl.dispatchEvent(new CustomEvent('loadend'));
        }, 100);
    }
    if (isTest) {
        var loadNaClTest=function() {
          injectScript('nacltest.js', function() {
            runTests(moduleEl);
          });
        };
        injectScript('test.js', loadNaClTest, loadNaClTest);
    }
  }
  function attachDefaultListeners() {
    var listenerDiv=document.getElementById('listener');
    listenerDiv.addEventListener('load', moduleDidLoad, true);
    listenerDiv.addEventListener('message', handleMessage, true);
    listenerDiv.addEventListener('error', handleError, true);
    listenerDiv.addEventListener('crash', handleCrash, true);
    if (typeof window.attachListeners!=='undefined') {
        window.attachListeners();
    }
  }
  function handleError(event) {
    var moduleEl=document.getElementById('nacl_module');
    updateStatus('ERROR ['+moduleEl.lastError+']');
  }
  function handleCrash(event) {
    if (common.naclModule.exitStatus==-1) {
        updateStatus('CRASHED');
    }
    else {
      updateStatus('EXITED ['+common.naclModule.exitStatus+']');
    }
    if (typeof window.handleCrash!=='undefined') {
        window.handleCrash(common.naclModule.lastError);
    }
  }
  function moduleDidLoad() {
    common.naclModule = document.getElementById('nacl_module');
    updateStatus('RUNNING');
    if (typeof window.moduleDidLoad!=='undefined') {
        window.moduleDidLoad();
    }
  }
  function hideModule() {
    common.naclModule.style.height = '0';
  }
  function removeModule() {
    common.naclModule.parentNode.removeChild(common.naclModule);
    common.naclModule = null;
  }
  function startsWith(s, prefix) {
    return s.lastIndexOf(prefix, 0)===0;
  }
  var kMaxLogMessageLength=20;
  var logMessageArray=[];
  function logMessage(message) {
    logMessageArray.push(message);
    if (logMessageArray.length>kMaxLogMessageLength)
      logMessageArray.shift();
    if (document.getElementById('log')!=undefined) {
        document.getElementById('log').textContent = logMessageArray.join('\n');
    }
    console.log("%c NACL: "+message, "color:blue");
  }
  var defaultMessageTypes={'alert': alert, 'log': logMessage}
  function handleMessage(message_event) {
    if (typeof message_event.data==='string') {
        for (var type in defaultMessageTypes) {
            if (defaultMessageTypes.hasOwnProperty(type)) {
                if (startsWith(message_event.data, type+':')) {
                    var func=defaultMessageTypes[type];
                    func(message_event.data.slice(type.length+1));
                    return ;
                }
            }
        }
    }
    if (typeof window.handleMessage!=='undefined') {
        window.handleMessage(message_event);
        return ;
    }
    logMessage('Unhandled message: '+message_event.data);
  }
  function domContentLoaded(name, tool, path, width, height, attrs) {
    updateStatus('Page loaded.');
    if (!browserSupportsNaCl(tool)) {
        updateStatus('Browser does not support NaCl ('+tool+'), or NaCl is disabled');
    }
    else 
      if (common.naclModule==null) {
        updateStatus('Creating embed: '+tool);
        width = typeof width!=='undefined' ? width : 200;
        height = typeof height!=='undefined' ? height : 200;
        attachDefaultListeners();
        createNaClModule(name, tool, path, width, height, attrs);
    }
    else {
      updateStatus('Waiting.');
    }
  }
  var statusText='NO-STATUSES';
  function updateStatus(opt_message) {
    if (opt_message!=undefined) {
        console.log("%c "+opt_message, "color:teal");
    }
    if (opt_message) {
        statusText = opt_message;
    }
  }
  return {naclModule: null, attachDefaultListeners: attachDefaultListeners, domContentLoaded: domContentLoaded, createNaClModule: createNaClModule, hideModule: hideModule, removeModule: removeModule, logMessage: logMessage, updateStatus: updateStatus}
}());
window._nacl_domContentLoaded = function _nacl_domContentLoaded() {
  var body=document.body;
  if (body.dataset) {
      var loadFunction;
      if (!body.dataset.customLoad) {
          loadFunction = common.domContentLoaded;
      }
      else 
        if (typeof window.domContentLoaded!=='undefined') {
          loadFunction = window.domContentLoaded;
      }
      var searchVars={};
      if (window.location.search.length>1) {
          var pairs=window.location.search.substr(1).split('&');
          for (var key_ix=0; key_ix<pairs.length; key_ix++) {
              var keyValue=pairs[key_ix].split('=');
              searchVars[unescape(keyValue[0])] = keyValue.length>1 ? unescape(keyValue[1]) : '';
          }
      }
      if (loadFunction) {
          var toolchains=body.dataset.tools.split(' ');
          var configs=body.dataset.configs.split(' ');
          var attrs={};
          if (body.dataset.attrs) {
              var attr_list=body.dataset.attrs.split(' ');
              for (var key in attr_list) {
                  var attr=attr_list[key].split('=');
                  var key=attr[0];
                  var value=attr[1];
                  attrs[key] = value;
              }
          }
          var tc=toolchains.indexOf(searchVars.tc)!==-1 ? searchVars.tc : toolchains[0];
          if (configs.indexOf(searchVars.config)!==-1)
            var config=searchVars.config;
          else 
            if (configs.indexOf('Release')!==-1)
            var config='Release';
          else 
            var config=configs[0];
          var pathFormat=body.dataset.path;
          var path=pathFormat.replace('{tc}', tc).replace('{config}', config);
          isTest = searchVars.test==='true';
          isRelease = path.toLowerCase().indexOf('release')!=-1;
          console.log("%c NACL LOAD", "color:teal");
          loadFunction(body.dataset.name, tc, path, body.dataset.width, body.dataset.height, attrs);
      }
  }
};
es6_module_define('transdata', ["mathlib"], function _transdata_module(_es6_module) {
  "use strict";
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var TransDataItem=_ESClass("TransDataItem", [function TransDataItem(data, type, start_data) {
    this.data = data;
    this.start_data = start_data;
    this.type = type;
    this.w = 1;
    this.dis = -1;
  }]);
  _es6_module.add_class(TransDataItem);
  TransDataItem = _es6_module.add_export('TransDataItem', TransDataItem);
  var TransDataType=_ESClass("TransDataType", [_ESClass.static(function apply(ctx, td, item, mat, w) {
  }), _ESClass.static(function undo_pre(ctx, td, undo_obj) {
  }), _ESClass.static(function undo(ctx, undo_obj) {
  }), _ESClass.static(function update(ctx, td) {
  }), _ESClass.static(function calc_prop_distances(ctx, td, data) {
  }), _ESClass.static(function gen_data(ctx, td, data) {
  }), _ESClass.static(function calc_draw_aabb(Context, td, minmax) {
  }), _ESClass.static(function aabb(ctx, td, item, minmax, selected_only) {
  }), function TransDataType() {
  }]);
  _es6_module.add_class(TransDataType);
  TransDataType = _es6_module.add_export('TransDataType', TransDataType);
  TransDataType.selectmode = -1;
});
es6_module_define('transform', ["toolprops", "mathlib", "spline_types", "selectmode", "multires_transdata", "dopesheet_transdata", "events", "transdata", "toolops_api", "nacl_api"], function _transform_module(_es6_module) {
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var SelMask=es6_import_item(_es6_module, 'selectmode', 'SelMask');
  var MResTransData=es6_import_item(_es6_module, 'multires_transdata', 'MResTransData');
  var Vec3Property=es6_import_item(_es6_module, 'toolprops', 'Vec3Property');
  var BoolProperty=es6_import_item(_es6_module, 'toolprops', 'BoolProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var CollectionProperty=es6_import_item(_es6_module, 'toolprops', 'CollectionProperty');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var ModalStates=es6_import_item(_es6_module, 'toolops_api', 'ModalStates');
  var TransDataItem=es6_import_item(_es6_module, 'transdata', 'TransDataItem');
  var TransDataType=es6_import_item(_es6_module, 'transdata', 'TransDataType');
  var TransDopeSheetType=es6_import_item(_es6_module, 'dopesheet_transdata', 'TransDopeSheetType');
  var KeyMap=es6_import_item(_es6_module, 'events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, 'events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, 'events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, 'events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, 'events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, 'events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, 'events', 'EventHandler');
  var clear_jobs=es6_import_item(_es6_module, 'nacl_api', 'clear_jobs');
  var clear_jobs_except_latest=es6_import_item(_es6_module, 'nacl_api', 'clear_jobs_except_latest');
  var clear_jobs_except_first=es6_import_item(_es6_module, 'nacl_api', 'clear_jobs_except_first');
  var JobTypes=es6_import_item(_es6_module, 'nacl_api', 'JobTypes');
  var _tsv_apply_tmp1=new Vector3();
  var _tsv_apply_tmp2=new Vector3();
  var post_mousemove_cachering=cachering.fromConstructor(Vector3, 64);
  var mousemove_cachering=cachering.fromConstructor(Vector3, 64);
  var TransSplineVert=_ESClass("TransSplineVert", [_ESClass.static(function apply(ctx, td, item, mat, w) {
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
  }), _ESClass.static(function undo_pre(ctx, td, undo_obj) {
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
  }), _ESClass.static(function undo(ctx, undo_obj) {
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
  }), _ESClass.static(function update(ctx, td) {
    var spline=ctx.spline;
    spline.resolve = 1;
  }), _ESClass.static(function calc_prop_distances(ctx, td, data) {
    var doprop=td.doprop;
    var proprad=td.propradius;
    var spline=ctx.spline;
    var propfacs={}
    var shash=spline.build_shash();
    var tdmap={}
    var layer=td.layer;
    var edit_all_layers=td.edit_all_layers;
    var __iter_tv=__get_iter(data);
    var tv;
    while (1) {
      var __ival_tv=__iter_tv.next();
      if (__ival_tv.done) {
          break;
      }
      tv = __ival_tv.value;
      if (tv.type!==TransSplineVert)
        continue;
      tdmap[tv.data.eid] = tv;
    }
    var __iter_v=__get_iter(spline.verts.selected.editable(edit_all_layers));
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      shash.forEachPoint(v, proprad, function(v2, dis) {
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
  }), _ESClass.static(function gen_data(ctx, td, data) {
    var doprop=td.doprop;
    var proprad=td.propradius;
    var selmap={}
    var spline=ctx.spline;
    var tdmap={}
    var layer=td.layer;
    var edit_all_layers=td.edit_all_layers;
    for (var i=0; i<2; i++) {
        var __iter_v=__get_iter(i ? spline.handles.selected.editable(edit_all_layers) : spline.verts.selected.editable(edit_all_layers));
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
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
    var propfacs={}
    var shash=spline.build_shash();
    for (var si=0; si<2; si++) {
        var list=si ? spline.handles : spline.verts;
        var __iter_v=__get_iter(list);
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
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
    var __iter_v=__get_iter(spline.verts.selected.editable(edit_all_layers));
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      shash.forEachPoint(v, proprad, function(v2, dis) {
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
  }), _ESClass.static(function calc_draw_aabb(ctx, td, minmax) {
    var vset={}
    var sset={}
    var hset={}
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
  }), _ESClass.static(function aabb(ctx, td, item, minmax, selected_only) {
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
  }), function TransSplineVert() {
  }]);
  _es6_module.add_class(TransSplineVert);
  TransSplineVert = _es6_module.add_export('TransSplineVert', TransSplineVert);
  TransSplineVert.selectmode = SelMask.TOPOLOGY;
  var TransData=_ESClass("TransData", [function TransData(ctx, top, datamode) {
    this.ctx = ctx;
    this.top = top;
    this.datamode = datamode;
    this.edit_all_layers = top.inputs.edit_all_layers.data;
    this.layer = ctx.spline.layerset.active;
    this.types = top.types;
    this.data = new GArray();
    this.undodata = {}
    this.doprop = top.inputs.proportional.data;
    this.propradius = top.inputs.propradius.data;
    this.center = new Vector3();
    this.start_center = new Vector3();
    this.minmax = new MinMax(3);
    var __iter_t=__get_iter(this.types);
    var t;
    while (1) {
      var __ival_t=__iter_t.next();
      if (__ival_t.done) {
          break;
      }
      t = __ival_t.value;
      if (datamode&t.selectmode) {
          t.gen_data(ctx, this, this.data);
      }
    }
    if (this.doprop)
      this.calc_propweights();
    var __iter_d=__get_iter(this.data);
    var d;
    while (1) {
      var __ival_d=__iter_d.next();
      if (__ival_d.done) {
          break;
      }
      d = __ival_d.value;
      d.type.aabb(ctx, this, d, this.minmax, true);
    }
    this.center.load(this.minmax.max).add(this.minmax.min).mulScalar(0.5);
    this.start_center.load(this.center);
    if (top.modal_running) {
        this.scenter = new Vector3(this.center);
        this.start_scenter = new Vector3(this.start_center);
        ctx.view2d.project(this.scenter);
        ctx.view2d.project(this.start_scenter);
    }
  }, function calc_propweights(radius) {
    if (radius==undefined) {
        radius = this.propradius;
    }
    this.propradius = radius;
    var __iter_t=__get_iter(this.types);
    var t;
    while (1) {
      var __ival_t=__iter_t.next();
      if (__ival_t.done) {
          break;
      }
      t = __ival_t.value;
      if (t.selectmode&this.datamode)
        t.calc_prop_distances(this.ctx, this, this.data);
    }
    var r=radius;
    var __iter_tv=__get_iter(this.data);
    var tv;
    while (1) {
      var __ival_tv=__iter_tv.next();
      if (__ival_tv.done) {
          break;
      }
      tv = __ival_tv.value;
      if (tv.dis==-1)
        continue;
      tv.w = tv.dis>r ? 0 : 1.0-tv.dis/r;
    }
  }]);
  _es6_module.add_class(TransData);
  TransData = _es6_module.add_export('TransData', TransData);
  var TransformOp=_ESClass("TransformOp", ToolOp, [function TransformOp(start_mpos, datamode) {
    ToolOp.call(this);
    this.types = new GArray([MResTransData, TransSplineVert]);
    this.first_viewport_redraw = true;
    if (start_mpos!=undefined&&typeof start_mpos!="number"&&__instance_of(start_mpos, Array)) {
        this.user_start_mpos = start_mpos;
    }
    if (datamode!=undefined)
      this.inputs.datamode.set_data(datamode);
    this.modaldata = {}
  }, _ESClass.static(function tooldef() {
    return {inputs: {data: new CollectionProperty([], [], "data", "data", "data", TPropFlags.COLL_LOOSE_TYPE), proportional: new BoolProperty(false, "proportional", "proportional mode"), propradius: new FloatProperty(80, "propradius", "prop radius"), datamode: new IntProperty(0, "datamode", "datamode"), edit_all_layers: new BoolProperty(false, "Edit all layers", "Edit all layers")}}
  }), function ensure_transdata(ctx) {
    var selmode=this.inputs.datamode.data;
    if (this.transdata==undefined) {
        this.types = [];
        if (selmode&SelMask.MULTIRES)
          this.types.push(MResTransData);
        if (selmode&SelMask.TOPOLOGY)
          this.types.push(TransSplineVert);
        this.transdata = new TransData(ctx, this, this.inputs.datamode.data);
    }
    return this.transdata;
  }, function finish(ctx) {
    delete this.transdata;
    delete this.modaldata;
    ctx.frameset.on_ctx_update(ctx);
  }, function cancel() {
    var ctx=this.modal_ctx;
    this.end_modal();
    this.undo(ctx, true);
  }, function undo_pre(ctx) {
    var td=this.ensure_transdata(ctx);
    var undo=this._undo = {}
    undo.edit_all_layers = this.inputs.edit_all_layers.data;
    for (var i=0; i<this.types.length; i++) {
        this.types[i].undo_pre(ctx, td, undo);
    }
  }, function undo(ctx, suppress_ctx_update) {
    if (suppress_ctx_update==undefined) {
        suppress_ctx_update = false;
    }
    var undo=this._undo;
    for (var i=0; i<this.types.length; i++) {
        this.types[i].undo(ctx, undo);
    }
    if (!suppress_ctx_update) {
        ctx.frameset.on_ctx_update(ctx);
    }
    window.redraw_viewport();
  }, function end_modal() {
    var ctx=this.modal_ctx;
    this.post_mousemove(event, true);
    ctx.appstate.set_modalstate(0);
    ToolOp.prototype.end_modal.call(this);
    this.finish(ctx);
  }, function start_modal(ctx) {
    ToolOp.prototype.start_modal.call(this);
    this.first_viewport_redraw = true;
    ctx.appstate.set_modalstate(ModalStates.TRANSFORMING);
    this.ensure_transdata(ctx);
    this.modaldata = {}
  }, function on_mousemove(event) {
    var td=this.ensure_transdata(this.modal_ctx);
    var ctx=this.modal_ctx;
    var mpos=new Vector3([event.x, event.y, 0]);
    var md=this.modaldata;
    if (md.start_mpos==undefined&&this.user_start_mpos!=undefined) {
        md.start_mpos = new Vector3(this.user_start_mpos);
        md.start_mpos[2] = 0.0;
        md.last_mpos = new Vector3(md.start_mpos);
        md.mpos = new Vector3(md.start_mpos);
    }
    if (md.start_mpos==undefined) {
        md.start_mpos = new Vector3(mpos);
        md.mpos = new Vector3(mpos);
        md.last_mpos = new Vector3(mpos);
    }
    else {
      md.last_mpos.load(md.mpos);
      md.mpos.load(mpos);
    }
    this.draw_helper_lines(md, ctx);
  }, function post_mousemove(event, force_solve) {
    if (force_solve==undefined) {
        force_solve = false;
    }
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
    if (ctx.spline.resolve==0) {
        if (force_solve&&!ctx.spline.solving) {
            redraw_viewport(min2, max2, undefined, !this2.first_viewport_redraw);
        }
        else 
          if (force_solve) {
            ctx.spline._pending_solve.then(function() {
              redraw_viewport(min2, max2, undefined, !this2.first_viewport_redraw);
            });
        }
        return ;
    }
    if (force_solve||!ctx.spline.solving) {
        ctx.spline.solve(undefined, undefined, force_solve).then(function() {
          redraw_viewport(min2, max2, undefined, !this2.first_viewport_redraw);
        });
    }
  }, function draw_helper_lines(md, ctx) {
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
  }, function on_keydown(event) {
    console.log(event.keyCode);
    var propdelta=15;
    switch (event.keyCode) {
      case 189:
        if (this.inputs.proportional.data) {
            this.inputs.propradius.set_data(this.inputs.propradius.data-propdelta);
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
            this.inputs.propradius.set_data(this.inputs.propradius.data+propdelta);
            this.transdata.propradius = this.inputs.propradius.data;
            this.transdata.calc_propweights();
            this.modal_ctx.view2d.propradius = this.inputs.propradius.data;
            this.exec(this.modal_ctx);
            this.draw_helper_lines(this.modaldata, this.modal_ctx);
            window.redraw_viewport();
        }
        break;
    }
  }, function on_mouseup(event) {
    console.log("end transform!");
    this.end_modal();
  }, function update(ctx) {
    var __iter_t=__get_iter(this.transdata.types);
    var t;
    while (1) {
      var __ival_t=__iter_t.next();
      if (__ival_t.done) {
          break;
      }
      t = __ival_t.value;
      t.update(ctx, this.transdata);
    }
  }]);
  _es6_module.add_class(TransformOp);
  TransformOp = _es6_module.add_export('TransformOp', TransformOp);
  var TranslateOp=_ESClass("TranslateOp", TransformOp, [function TranslateOp(user_start_mpos, datamode) {
    TransformOp.call(this, user_start_mpos, datamode);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Translate", apiname: "spline.translate", description: "Move geometry around", is_modal: true, inputs: ToolOp.inherit({translation: new Vec3Property(undefined, "translation", "translation", "translation")})}
  }), function on_mousemove(event) {
    TransformOp.prototype.on_mousemove.call(this, event);
    var md=this.modaldata;
    var ctx=this.modal_ctx;
    var td=this.transdata;
    var start=mousemove_cachering.next(), off=mousemove_cachering.next();
    start.load(md.start_mpos);
    off.load(md.mpos);
    ctx.view2d.unproject(start);
    ctx.view2d.unproject(off);
    off.sub(start);
    this.inputs.translation.set_data(off);
    this.exec(ctx);
    this.post_mousemove(event);
  }, function exec(ctx) {
    var td=this.modal_running ? this.transdata : this.ensure_transdata(ctx);
    var mat=new Matrix4();
    var off=this.inputs.translation.data;
    mat.makeIdentity();
    mat.translate(off[0], off[1], 0);
    var __iter_d=__get_iter(td.data);
    var d;
    while (1) {
      var __ival_d=__iter_d.next();
      if (__ival_d.done) {
          break;
      }
      d = __ival_d.value;
      d.type.apply(ctx, td, d, mat, d.w);
    }
    this.update(ctx);
    if (!this.modal_running) {
        ctx.frameset.on_ctx_update(ctx);
        delete this.transdata;
    }
  }]);
  _es6_module.add_class(TranslateOp);
  TranslateOp = _es6_module.add_export('TranslateOp', TranslateOp);
  var ScaleOp=_ESClass("ScaleOp", TransformOp, [function ScaleOp(user_start_mpos, datamode) {
    TransformOp.call(this, user_start_mpos, datamode);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Scale", apiname: "spline.scale", description: "Resize geometry", is_modal: true, inputs: ToolOp.inherit({scale: new Vec3Property(undefined, "scale", "scale", "scale")})}
  }), function on_mousemove(event) {
    TransformOp.prototype.on_mousemove.call(this, event);
    var md=this.modaldata;
    var ctx=this.modal_ctx;
    var td=this.transdata;
    var scale=mousemove_cachering.next();
    var off=mousemove_cachering.next();
    var l1=off.load(md.mpos).sub(td.scenter).vectorLength();
    var l2=off.load(md.start_mpos).sub(td.scenter).vectorLength();
    scale[0] = scale[1] = l1/l2;
    scale[2] = 1.0;
    this.inputs.scale.set_data(scale);
    this.exec(ctx);
    this.post_mousemove(event);
  }, function exec(ctx) {
    var td=this.modal_running ? this.transdata : this.ensure_transdata(ctx);
    var mat=new Matrix4();
    var scale=this.inputs.scale.data;
    var cent=td.center;
    mat.makeIdentity();
    mat.translate(cent[0], cent[1], 0);
    mat.scale(scale[0], scale[1], scale[2]);
    mat.translate(-cent[0], -cent[1], 0);
    var __iter_d=__get_iter(td.data);
    var d;
    while (1) {
      var __ival_d=__iter_d.next();
      if (__ival_d.done) {
          break;
      }
      d = __ival_d.value;
      d.type.apply(ctx, td, d, mat, d.w);
    }
    this.update(ctx);
    if (!this.modal_running) {
        ctx.frameset.on_ctx_update(ctx);
        delete this.transdata;
    }
  }]);
  _es6_module.add_class(ScaleOp);
  ScaleOp = _es6_module.add_export('ScaleOp', ScaleOp);
  var RotateOp=_ESClass("RotateOp", TransformOp, [function RotateOp(user_start_mpos, datamode) {
    this.angle_sum = 0.0;
    TransformOp.call(this, user_start_mpos, datamode, "rotate", "Rotate");
  }, _ESClass.static(function tooldef() {
    return {uiname: "Rotate", apiname: "spline.rotate", description: "Rotate geometry", is_modal: true, inputs: ToolOp.inherit({angle: new FloatProperty(undefined, "angle", "angle", "angle")})}
  }), function on_mousemove(event) {
    TransformOp.prototype.on_mousemove.call(this, event);
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
    this.inputs.angle.set_data(this.angle_sum);
    this.exec(ctx);
    this.post_mousemove(event);
  }, function exec(ctx) {
    var td=this.modal_running ? this.transdata : this.ensure_transdata(ctx);
    var mat=new Matrix4();
    var cent=td.center;
    mat.makeIdentity();
    mat.translate(cent[0], cent[1], 0);
    mat.rotate(this.inputs.angle.data, 0, 0, 1);
    mat.translate(-cent[0], -cent[1], 0);
    var __iter_d=__get_iter(td.data);
    var d;
    while (1) {
      var __ival_d=__iter_d.next();
      if (__ival_d.done) {
          break;
      }
      d = __ival_d.value;
      d.type.apply(ctx, td, d, mat, d.w);
    }
    this.update(ctx);
    if (!this.modal_running) {
        ctx.frameset.on_ctx_update(ctx);
        delete this.transdata;
    }
  }]);
  _es6_module.add_class(RotateOp);
  RotateOp = _es6_module.add_export('RotateOp', RotateOp);
});
es6_module_define('transform_ops', ["transdata", "transform", "mathlib", "multires_transdata", "toolops_api", "events", "spline_types", "dopesheet_transdata", "nacl_api", "selectmode", "toolprops"], function _transform_ops_module(_es6_module) {
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var TransformOp=es6_import_item(_es6_module, 'transform', 'TransformOp');
  var SelMask=es6_import_item(_es6_module, 'selectmode', 'SelMask');
  var MResTransData=es6_import_item(_es6_module, 'multires_transdata', 'MResTransData');
  var Vec3Property=es6_import_item(_es6_module, 'toolprops', 'Vec3Property');
  var BoolProperty=es6_import_item(_es6_module, 'toolprops', 'BoolProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var CollectionProperty=es6_import_item(_es6_module, 'toolprops', 'CollectionProperty');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var ModalStates=es6_import_item(_es6_module, 'toolops_api', 'ModalStates');
  var TransDataItem=es6_import_item(_es6_module, 'transdata', 'TransDataItem');
  var TransDataType=es6_import_item(_es6_module, 'transdata', 'TransDataType');
  var TransDopeSheetType=es6_import_item(_es6_module, 'dopesheet_transdata', 'TransDopeSheetType');
  var KeyMap=es6_import_item(_es6_module, 'events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, 'events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, 'events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, 'events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, 'events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, 'events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, 'events', 'EventHandler');
  var clear_jobs=es6_import_item(_es6_module, 'nacl_api', 'clear_jobs');
  var clear_jobs_except_latest=es6_import_item(_es6_module, 'nacl_api', 'clear_jobs_except_latest');
  var clear_jobs_except_first=es6_import_item(_es6_module, 'nacl_api', 'clear_jobs_except_first');
  var JobTypes=es6_import_item(_es6_module, 'nacl_api', 'JobTypes');
  var WidgetResizeOp=_ESClass("WidgetResizeOp", TransformOp, [function WidgetResizeOp(user_start_mpos, datamode) {
    TransformOp.call(this, user_start_mpos, datamode);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Resize", apiname: "spline.widget_resize", description: "Resize geometry", is_modal: true, inputs: ToolOp.inherit({translation: new Vec2Property(), scale: new Vec2Property(), rotation: new FloatProperty(0.0), pivot: new Vec2Property()}), outputs: {}}
  }), _ESClass.static(function create_widgets(manager, ctx) {
    var spline=ctx.spline;
    var minmax=new MinMax(2);
    var __iter_v=__get_iter(spline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      minmax.minmax(v);
    }
    var __iter_h=__get_iter(spline.handles.selected.editable());
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
      minmax.minmax(h);
    }
    var cent=new Vector2(minmax.min).add(minmax.max).mulScalar(0.5);
    var widget=manager.create(this);
    widget.co = new Vector2(cent);
    widget.on_tick = function(ctx) {
      if (g_app_state.modalstate==ModalStates.TRANSFORMING) {
          this.hide();
          return ;
      }
      else {
        this.unhide();
      }
      minmax.reset();
      var totsel=0;
      var __iter_v=__get_iter(spline.verts.selected.editable());
      var v;
      while (1) {
        var __ival_v=__iter_v.next();
        if (__ival_v.done) {
            break;
        }
        v = __ival_v.value;
        minmax.minmax(v);
        totsel++;
      }
      if (ctx.view2d.selectmode&SelMask.HANDLE) {
          var __iter_h=__get_iter(spline.handles.selected.editable());
          var h;
          while (1) {
            var __ival_h=__iter_h.next();
            if (__ival_h.done) {
                break;
            }
            h = __ival_h.value;
            minmax.minmax(h);
            totsel++;
          }
      }
      var update=false;
      if (totsel==0) {
          this.hide();
          return ;
      }
      else {
        update = this.hidden;
        this.unhide();
      }
      var cx=(minmax.min[0]+minmax.max[0])*0.5;
      var cy=(minmax.min[1]+minmax.max[1])*0.5;
      update = update||cx!=this.co[0]||cy!=this.co[1];
      if (update) {
          this.co[0] = cx;
          this.co[1] = cy;
          this.update();
          console.log("update widget!", cx, cy);
      }
    }
    var arrow=widget.arrow([1, 0], "a", [0, 0, 0, 1.0]);
    widget.on_click = function(id) {
      console.log("widget click!");
    }
    return widget;
  }), _ESClass.static(function reset_widgets(op, ctx) {
  })]);
  _es6_module.add_class(WidgetResizeOp);
  WidgetResizeOp = _es6_module.add_export('WidgetResizeOp', WidgetResizeOp);
});
es6_module_define('spline_selectops', ["spline_types", "animdata", "spline_draw", "toolprops", "toolops_api"], function _spline_selectops_module(_es6_module) {
  "use strict";
  var $_mh;
  var $_swapt;
  var PI=Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos, asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var BoolProperty=es6_import_item(_es6_module, 'toolprops', 'BoolProperty');
  var EnumProperty=es6_import_item(_es6_module, 'toolprops', 'EnumProperty');
  var StringProperty=es6_import_item(_es6_module, 'toolprops', 'StringProperty');
  var FlagProperty=es6_import_item(_es6_module, 'toolprops', 'FlagProperty');
  var CollectionProperty=es6_import_item(_es6_module, 'toolprops', 'CollectionProperty');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var SplineVertex=es6_import_item(_es6_module, 'spline_types', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, 'spline_types', 'SplineSegment');
  var SplineFace=es6_import_item(_es6_module, 'spline_types', 'SplineFace');
  var redraw_element=es6_import_item(_es6_module, 'spline_draw', 'redraw_element');
  var get_vtime=es6_import_item(_es6_module, 'animdata', 'get_vtime');
  var SelectOpBase=_ESClass("SelectOpBase", ToolOp, [function SelectOpBase(datamode, do_flush, uiname) {
    ToolOp.call(this, undefined, uiname);
    if (datamode!=undefined)
      this.inputs.datamode.set_data(datamode);
    if (do_flush!=undefined)
      this.inputs.flush.set_data(do_flush);
  }, _ESClass.static(function tooldef() {
    return {inputs: {mode: new IntProperty(0), datamode: new IntProperty(0), flush: new BoolProperty(false)}}
  }), function undo_pre(ctx) {
    var spline=ctx.spline;
    var ud=this._undo = [];
    var __iter_v=__get_iter(spline.verts.selected);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      ud.push(v.eid);
    }
    var __iter_h=__get_iter(spline.handles.selected);
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
      ud.push(h.eid);
    }
    var __iter_s=__get_iter(spline.segments.selected);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      ud.push(s.eid);
    }
    ud.active_vert = spline.verts.active!=undefined ? spline.verts.active.eid : -1;
    ud.active_handle = spline.handles.active!=undefined ? spline.handles.active.eid : -1;
    ud.active_segment = spline.segments.active!=undefined ? spline.segments.active.eid : -1;
    ud.active_face = spline.faces.active!=undefined ? spline.faces.active.eid : -1;
  }, function undo(ctx) {
    var ud=this._undo;
    var spline=ctx.spline;
    console.log(ctx, spline);
    spline.clear_selection();
    var eidmap=spline.eidmap;
    for (var i=0; i<ud.length; i++) {
        if (!(ud[i] in eidmap)) {
            console.trace("Warning, corruption in SelectOpBase.undo(): '", ud[i], "'.");
            continue;
        }
        var e=eidmap[ud[i]];
        spline.setselect(e, true);
    }
    spline.verts.active = eidmap[ud.active_vert];
    spline.handles.active = eidmap[ud.active_handle];
    spline.segments.active = eidmap[ud.active_segment];
    spline.faces.active = eidmap[ud.active_face];
  }]);
  _es6_module.add_class(SelectOpBase);
  SelectOpBase = _es6_module.add_export('SelectOpBase', SelectOpBase);
  var SelectOneOp=_ESClass("SelectOneOp", SelectOpBase, [function SelectOneOp(e, unique, mode, datamode, do_flush) {
    if (e==undefined) {
        e = undefined;
    }
    if (unique==undefined) {
        unique = true;
    }
    if (mode==undefined) {
        mode = true;
    }
    if (datamode==undefined) {
        datamode = 0;
    }
    if (do_flush==undefined) {
        do_flush = false;
    }
    SelectOpBase.call(this, datamode, do_flush, "Select Element");
    this.inputs.unique.set_data(unique);
    this.inputs.state.set_data(mode);
    if (e!=undefined)
      this.inputs.eid.set_data(e.eid);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Select Element", inputs: ToolOp.inherit({eid: new IntProperty(-1), state: new BoolProperty(true), set_active: new BoolProperty(true), unique: new BoolProperty(true)}), description: "Select Element"}
  }), function exec(ctx) {
    var spline=ctx.spline;
    var e=spline.eidmap[this.inputs.eid.data];
    if (e==undefined) {
        console.trace("Error in SelectOneOp", this.inputs.eid.data, this);
        return ;
    }
    var state=this.inputs.state.data;
    if (this.inputs.unique.data) {
        state = true;
        var __iter_e_0=__get_iter(spline.selected);
        var e_0;
        while (1) {
          var __ival_e_0=__iter_e_0.next();
          if (__ival_e_0.done) {
              break;
          }
          e_0 = __ival_e_0.value;
          redraw_element(e_0);
        }
        spline.clear_selection();
    }
    spline.setselect(e, state);
    if (state&&this.inputs.set_active.data) {
        spline.set_active(e);
    }
    if (this.inputs.flush.data) {
        console.log("flushing data!", this.inputs.datamode.data);
        spline.select_flush(this.inputs.datamode.data);
    }
    redraw_element(e);
  }]);
  _es6_module.add_class(SelectOneOp);
  SelectOneOp = _es6_module.add_export('SelectOneOp', SelectOneOp);
  var ToggleSelectAllOp=_ESClass("ToggleSelectAllOp", SelectOpBase, [function ToggleSelectAllOp() {
    SelectOpBase.call(this, undefined, undefined, "Toggle Select All");
  }, _ESClass.static(function tooldef() {
    return {uiname: "Toggle Select All", apiname: "spline.toggle_select_all", icon: Icons.TOGGLE_SEL_ALL, inputs: {mode: new EnumProperty("auto", ["select", "deselect", "auto"], "mode", "Mode", "mode")}}
  }), function undo_pre(ctx) {
    SelectOpBase.prototype.undo_pre.call(this, ctx);
    redraw_viewport();
  }, function exec(ctx) {
    console.log("toggle select!");
    var spline=ctx.spline;
    var mode=this.inputs.mode.data;
    var layerid=ctx.spline.layerset.active.id;
    var totsel=0.0;
    var $_let_iterctx1=mode=="sub" ? {edit_all_layers: false} : ctx;
    if (mode=="auto") {
        var __iter_v=__get_iter(spline.verts.editable($_let_iterctx1));
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          totsel+=v.flag&SplineFlags.SELECT;
        }
        var __iter_s=__get_iter(spline.segments.editable($_let_iterctx1));
        var s;
        while (1) {
          var __ival_s=__iter_s.next();
          if (__ival_s.done) {
              break;
          }
          s = __ival_s.value;
          totsel+=s.flag&SplineFlags.SELECT;
        }
        var __iter_f=__get_iter(spline.faces.editable($_let_iterctx1));
        var f;
        while (1) {
          var __ival_f=__iter_f.next();
          if (__ival_f.done) {
              break;
          }
          f = __ival_f.value;
          totsel+=f.flag&SplineFlags.SELECT;
        }
        mode = totsel ? "sub" : "add";
    }
    if (mode=="sub")
      spline.verts.active = undefined;
    var __iter_v=__get_iter(spline.verts.editable($_let_iterctx1));
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      v.flag|=SplineFlags.REDRAW;
      if (mode=="sub") {
          spline.setselect(v, false);
      }
      else {
        spline.setselect(v, true);
      }
    }
    var __iter_s=__get_iter(spline.segments.editable($_let_iterctx1));
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      s.flag|=SplineFlags.REDRAW;
      if (mode=="sub") {
          spline.setselect(s, false);
      }
      else {
        spline.setselect(s, true);
      }
    }
    var __iter_f=__get_iter(spline.faces.editable($_let_iterctx1));
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      f.flag|=SplineFlags.REDRAW;
      if (mode=="sub") {
          spline.setselect(f, false);
      }
      else {
        spline.setselect(f, true);
      }
    }
  }]);
  _es6_module.add_class(ToggleSelectAllOp);
  ToggleSelectAllOp = _es6_module.add_export('ToggleSelectAllOp', ToggleSelectAllOp);
  var SelectLinkedOp=_ESClass("SelectLinkedOp", SelectOpBase, [function SelectLinkedOp(mode, datamode) {
    SelectOpBase.call(this, datamode);
    if (mode!=undefined)
      this.inputs.mode.set_data(mode);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Select Linked", apiname: "spline.select_linked", inputs: ToolOp.inherit({vertex_eid: new IntProperty(-1), mode: new EnumProperty("select", ["select", "deselect"], "mode", "Mode", "mode")})}
  }), function undo_pre(ctx) {
    SelectOpBase.prototype.undo_pre.call(this, ctx);
    window.redraw_viewport();
  }, function exec(ctx) {
    var spline=ctx.spline;
    var v=spline.eidmap[this.inputs.vertex_eid.data];
    if (v==undefined) {
        console.trace("Error in SelectLinkedOp");
        return ;
    }
    var state=this.inputs.mode.data=="select" ? 1 : 0;
    var visit=new set();
    var verts=spline.verts;
    function recurse(v) {
      visit.add(v);
      verts.setselect(v, state);
      for (var i=0; i<v.segments.length; i++) {
          var seg=v.segments[i], v2=seg.other_vert(v);
          if (!visit.has(v2)) {
              recurse(v2);
          }
      }
    }
    recurse(v);
    spline.select_flush(this.inputs.datamode.data);
  }]);
  _es6_module.add_class(SelectLinkedOp);
  SelectLinkedOp = _es6_module.add_export('SelectLinkedOp', SelectLinkedOp);
  var HideOp=_ESClass("HideOp", SelectOpBase, [function HideOp(mode, ghost) {
    SelectOpBase.call(this, undefined, undefined, "Hide");
    if (mode!=undefined)
      this.inputs.selmode.set_data(mode);
    if (ghost!=undefined)
      this.inputs.ghost.set_data(ghost);
  }, function undo_pre(ctx) {
    SelectOpBase.prototype.undo_pre.call(this, ctx);
    window.redraw_viewport();
  }, function undo(ctx) {
    var ud=this._undo;
    var spline=ctx.spline;
    for (var i=0; i<ud.length; i++) {
        var e=spline.eidmap[ud[i]];
        e.flag&=~(SplineFlags.HIDE|SplineFlags.GHOST);
    }
    SelectOpBase.prototype.undo.call(this, ctx);
    window.redraw_viewport();
  }, function exec(ctx) {
    var spline=ctx.spline;
    var mode=this.inputs.selmode.data;
    var ghost=this.inputs.ghost.data;
    var layer=spline.layerset.active;
    var __iter_elist=__get_iter(spline.elists);
    var elist;
    while (1) {
      var __ival_elist=__iter_elist.next();
      if (__ival_elist.done) {
          break;
      }
      elist = __ival_elist.value;
      if (!(elist.type&mode))
        continue;
      var __iter_e=__get_iter(elist.selected);
      var e;
      while (1) {
        var __ival_e=__iter_e.next();
        if (__ival_e.done) {
            break;
        }
        e = __ival_e.value;
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
  }]);
  _es6_module.add_class(HideOp);
  HideOp = _es6_module.add_export('HideOp', HideOp);
  HideOp.inputs = {selmode: new IntProperty(1|2), ghost: new BoolProperty(false)}
  var UnhideOp=_ESClass("UnhideOp", ToolOp, [function UnhideOp(mode, ghost) {
    ToolOp.call(this, undefined, "Unhide");
    if (mode!=undefined)
      this.inputs.selmode.set_data(mode);
    if (ghost!=undefined)
      this.inputs.ghost.set_data(ghost);
    this._undo = undefined;
  }, function undo_pre(ctx) {
    var ud=this._undo = [];
    var spline=ctx.spline;
    var __iter_elist=__get_iter(spline.elists);
    var elist;
    while (1) {
      var __ival_elist=__iter_elist.next();
      if (__ival_elist.done) {
          break;
      }
      elist = __ival_elist.value;
      var __iter_e=__get_iter(elist);
      var e;
      while (1) {
        var __ival_e=__iter_e.next();
        if (__ival_e.done) {
            break;
        }
        e = __ival_e.value;
        if (e.flag&SplineFlags.HIDE) {
            ud.push(e.eid);
            ud.push(e.flag&(SplineFlags.SELECT|SplineFlags.HIDE|SplineFlags.GHOST));
        }
      }
    }
    window.redraw_viewport();
  }, function undo(ctx) {
    var ud=this._undo;
    var spline=ctx.spline;
    var i=0;
    while (i<ud.length) {
      var e=spline.eidmap[ud[i++]];
      var flag=ud[i++];
      e.flag|=flag;
      if (flag&SplineFlags.SELECT)
        spline.setselect(e, selstate);
    }
    window.redraw_viewport();
  }, function exec(ctx) {
    var spline=ctx.spline;
    var layer=spline.layerset.active;
    var mode=this.inputs.selmode.data;
    var ghost=this.inputs.ghost.data;
    console.log("mode!", mode);
    var __iter_elist=__get_iter(spline.elists);
    var elist;
    while (1) {
      var __ival_elist=__iter_elist.next();
      if (__ival_elist.done) {
          break;
      }
      elist = __ival_elist.value;
      if (!(mode&elist.type))
        continue;
      var __iter_e=__get_iter(elist);
      var e;
      while (1) {
        var __ival_e=__iter_e.next();
        if (__ival_e.done) {
            break;
        }
        e = __ival_e.value;
        if (!(layer.id in e.layers))
          continue;
        if (!ghost&&(e.flag&SplineFlags.GHOST))
          continue;
        var was_hidden=e.flag&SplineFlags.HIDE;
        e.flag&=~(SplineFlags.HIDE|SplineFlags.GHOST);
        e.sethide(false);
        if (was_hidden)
          spline.setselect(e, true);
      }
    }
  }]);
  _es6_module.add_class(UnhideOp);
  UnhideOp = _es6_module.add_export('UnhideOp', UnhideOp);
  UnhideOp.inputs = {selmode: new IntProperty(1|2), ghost: new BoolProperty(false)}
  var CollectionProperty=es6_import_item(_es6_module, 'toolprops', 'CollectionProperty');
  var ElementRefSet=es6_import_item(_es6_module, 'spline_types', 'ElementRefSet');
  var _last_radius=45;
  var CircleSelectOp=_ESClass("CircleSelectOp", SelectOpBase, [function CircleSelectOp(datamode, do_flush) {
    if (do_flush==undefined) {
        do_flush = true;
    }
    SelectOpBase.call(this, datamode, do_flush, "Circle Select");
    if (isNaN(_last_radius)||_last_radius<=0)
      _last_radius = 45;
    this.mpos = new Vector3();
    this.mdown = false;
    this.sel_or_unsel = true;
    this.radius = _last_radius;
  }, _ESClass.static(function tooldef() {
    return {apiname: "circle_select", uiname: "Circle Select", inputs: ToolOp.inherit({add_elements: new CollectionProperty(new ElementRefSet(SplineTypes.ALL), [SplineVertex, SplineSegment, SplineFace], "elements", "Elements", "Elements"), sub_elements: new CollectionProperty(new ElementRefSet(SplineTypes.ALL), [SplineVertex, SplineSegment, SplineFace], "elements", "Elements", "Elements")}), outputs: ToolOp.inherit({}), icon: Icons.CIRCLE_SEL, is_modal: true, description: "Select in a circle.\nRight click to deselect."}
  }), function start_modal(ctx) {
    this.radius = _last_radius;
    var mpos=ctx.view2d.mpos;
    if (mpos!=undefined)
      this.on_mousemove({x: mpos[0], y: mpos[1]});
  }, function _draw_circle() {
    var ctx=this.modal_ctx;
    var editor=ctx.view2d;
    this.reset_drawlines();
    var steps=64;
    var t=-Math.PI, dt=(Math.PI*2.0)/steps;
    var lastco=new Vector3();
    var co=new Vector3();
    var mpos=this.mpos;
    var radius=this.radius;
    for (var i=0; i<steps; i++, t+=dt) {
        co[0] = sin(t)*radius+mpos[0];
        co[1] = cos(t)*radius+mpos[1];
        editor.unproject(co);
        if (i>0) {
            var dl=this.new_drawline(lastco, co);
        }
        lastco.load(co);
    }
    window.redraw_viewport();
  }, function exec(ctx) {
    var spline=ctx.spline;
    var eset_add=this.inputs.add_elements;
    var eset_sub=this.inputs.sub_elements;
    eset_add.ctx = ctx;
    eset_sub.ctx = ctx;
    eset_add.data.ctx = ctx;
    eset_sub.data.ctx = ctx;
    console.log("exec!");
    var __iter_e=__get_iter(eset_add);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      spline.setselect(e, true);
    }
    var __iter_e=__get_iter(eset_sub);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      spline.setselect(e, false);
    }
    if (this.inputs.flush.data) {
        spline.select_flush(this.inputs.datamode.data);
    }
  }, function do_sel(sel_or_unsel) {
    var datamode=this.inputs.datamode.data;
    var ctx=this.modal_ctx, spline=ctx.spline;
    var editor=ctx.view2d;
    var co=new Vector3();
    var eset_add=this.inputs.add_elements.data;
    var eset_sub=this.inputs.sub_elements.data;
    var actlayer=spline.layerset.active.id;
    if (datamode&SplineTypes.VERTEX) {
        var __iter_v=__get_iter(spline.verts);
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          if (v.hidden)
            continue;
          if (!(actlayer in v.layers))
            continue;
          co.load(v);
          editor.project(co);
          if (co.vectorDistance(this.mpos)<this.radius) {
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
    else 
      if (datamode&SplineTypes.SEGMENT) {
    }
    else 
      if (datamode&SplineTypes.FACE) {
    }
  }, function on_mousemove(event) {
    var ctx=this.modal_ctx;
    var spline=ctx.spline;
    var editor=ctx.view2d;
    this.mpos[0] = event.x;
    this.mpos[1] = event.y;
    this._draw_circle();
    if (this.mdown) {
        this.do_sel(this.sel_or_unsel);
    }
    this.exec(ctx);
  }, function end_modal(ctx) {
    SelectOpBase.prototype.end_modal.call(this, ctx);
    _last_radius = this.radius;
  }, function on_keydown(event) {
    console.log(event.keyCode);
    var ctx=this.modal_ctx;
    var spline=ctx.spline;
    var view2d=ctx.view2d;
    var radius_inc=10;
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
    }
  }, function on_mousedown(event) {
    if (event.button==0) {
        this.sel_or_unsel = true;
        this.mdown = true;
    }
    else {
      this.sel_or_unsel = false;
      this.mdown = true;
    }
  }, function on_mouseup(event) {
    console.log("modal end!");
    this.mdown = false;
    this.end_modal();
  }]);
  _es6_module.add_class(CircleSelectOp);
  CircleSelectOp = _es6_module.add_export('CircleSelectOp', CircleSelectOp);
});
es6_module_define('spline_createops', ["toolprops", "spline_editops", "toolops_api", "spline_types", "spline"], function _spline_createops_module(_es6_module) {
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var EnumProperty=es6_import_item(_es6_module, 'toolprops', 'EnumProperty');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var Vec3Property=es6_import_item(_es6_module, 'toolprops', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, 'toolprops', 'Vec4Property');
  var StringProperty=es6_import_item(_es6_module, 'toolprops', 'StringProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var RestrictFlags=es6_import_item(_es6_module, 'spline', 'RestrictFlags');
  var SplineLocalToolOp=es6_import_item(_es6_module, 'spline_editops', 'SplineLocalToolOp');
  var ExtrudeModes={SMOOTH: 0, LESS_SMOOTH: 1, BROKEN: 2}
  ExtrudeModes = _es6_module.add_export('ExtrudeModes', ExtrudeModes);
  var ExtrudeVertOp=_ESClass("ExtrudeVertOp", SplineLocalToolOp, [function ExtrudeVertOp(co, mode) {
    SplineLocalToolOp.call(this);
    if (co!=undefined)
      this.inputs.location.set_data(co);
    if (mode!=undefined) {
        this.inputs.mode.set_data(mode);
    }
  }, _ESClass.static(function tooldef() {
    return {uiname: "Extrude Path", apiname: "spline.extrude_verts", inputs: {location: new Vec3Property(undefined, "location", "location"), linewidth: new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500]), mode: new EnumProperty(ExtrudeModes.SMOOTH, ExtrudeModes, "extrude_mode", "Smooth Mode"), stroke: new Vec4Property([0, 0, 0, 1])}, outputs: {vertex: new IntProperty(-1, "vertex", "vertex", "new vertex")}, icon: -1, is_modal: false, description: "Add points to path"}
  }), function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_EXTRUDE);
  }, function exec(ctx) {
    console.log("Extrude vertex op");
    var spline=ctx.spline;
    var layer=spline.layerset.active;
    var max_z=1;
    var __iter_f=__get_iter(spline.faces);
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      if (!(layer.id in f.layers))
        continue;
      max_z = Math.max(f.z, max_z);
    }
    var max_z_seg=max_z+1;
    var __iter_s=__get_iter(spline.segments);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      if (!(layer.id in s.layers))
        continue;
      max_z_seg = Math.max(max_z_seg, s.z);
    }
    var co=this.inputs.location.data;
    for (var i=0; i<spline.verts.length; i++) {
        var v=spline.verts[i];
        spline.verts.setselect(v, false);
    }
    var start_eid=spline.idgen.cur_id;
    var v=spline.make_vertex(co);
    var smode=this.inputs.mode.get_value();
    if (smode==ExtrudeModes.LESS_SMOOTH)
      v.flag|=SplineFlags.BREAK_CURVATURES;
    else 
      if (smode==ExtrudeModes.BROKEN)
      v.flag|=SplineFlags.BREAK_TANGENTS;
    this.outputs.vertex.set_data(v.eid);
    spline.verts.setselect(v, true);
    if (spline.verts.active!==v&&spline.verts.active!=undefined&&!spline.verts.active.hidden&&!((spline.restrict&RestrictFlags.VALENCE2)&&spline.verts.active.segments.length>=2)) {
        if (spline.verts.active.segments.length==2) {
            var v2=spline.verts.active;
            var h1=v2.segments[0].handle(v2), h2=v2.segments[1].handle(v2);
            spline.connect_handles(h1, h2);
            h1.flag|=SplineFlags.AUTO_PAIRED_HANDLE;
            h2.flag|=SplineFlags.AUTO_PAIRED_HANDLE;
            h1.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
            h2.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
        }
        var seg=spline.make_segment(spline.verts.active, v);
        seg.z = max_z_seg;
        console.log("creating segment");
        if (spline.verts.active.segments.length>1) {
            var seg2=spline.verts.active.segments[0];
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
        spline.verts.active.flag|=SplineFlags.UPDATE;
    }
    spline.verts.active = v;
    spline.regen_render();
  }]);
  _es6_module.add_class(ExtrudeVertOp);
  ExtrudeVertOp = _es6_module.add_export('ExtrudeVertOp', ExtrudeVertOp);
  var CreateEdgeOp=_ESClass("CreateEdgeOp", SplineLocalToolOp, [function CreateEdgeOp(linewidth) {
    SplineLocalToolOp.call(this);
    if (linewidth!=undefined)
      this.inputs.linewidth.set_data(linewidth);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Make Segment", apiname: "spline.make_edge", inputs: {linewidth: new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500])}, outputs: {}, icon: Icons.MAKE_SEGMENT, is_modal: false, description: "Create segment between two selected points"}
  }), function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_CONNECT);
  }, function exec(ctx) {
    console.log("create edge op!");
    var spline=ctx.spline;
    var sels=[];
    var max_z=1;
    var __iter_f=__get_iter(spline.faces);
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      max_z = Math.max(f.z, max_z);
    }
    var max_z_seg=max_z+1;
    var __iter_s=__get_iter(spline.segments);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
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
  }]);
  _es6_module.add_class(CreateEdgeOp);
  CreateEdgeOp = _es6_module.add_export('CreateEdgeOp', CreateEdgeOp);
  var CreateEdgeFaceOp=_ESClass("CreateEdgeFaceOp", SplineLocalToolOp, [function CreateEdgeFaceOp(linewidth) {
    SplineLocalToolOp.call(this);
    if (linewidth!=undefined)
      this.inputs.linewidth.set_data(linewidth);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Make Polygon", apiname: "spline.make_edge_face", inputs: {linewidth: new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500])}, outputs: {}, icon: Icons.MAKE_POLYGON, is_modal: false, description: "Create polygon from selected points"}
  }), function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_CONNECT);
  }, function exec(ctx) {
    console.log("create edge op!");
    var spline=ctx.spline;
    var layer=spline.layerset.active;
    var sels=[];
    var max_z=1;
    var __iter_f=__get_iter(spline.faces);
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      if (!(layer.id in f.layers))
        continue;
      max_z = Math.max(f.z, max_z);
    }
    var max_z_seg=max_z+1;
    var __iter_s=__get_iter(spline.segments);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      if (!(layer.id in s.layers))
        continue;
      max_z_seg = Math.max(max_z_seg, s.z);
    }
    var vs=[];
    var valmap={}
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
    var __iter_v=__get_iter(spline.verts.selected);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      if (v.hidden)
        continue;
      v.flag|=SplineFlags.UPDATE;
      vs.push(v);
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
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
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
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
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
  }]);
  _es6_module.add_class(CreateEdgeFaceOp);
  CreateEdgeFaceOp = _es6_module.add_export('CreateEdgeFaceOp', CreateEdgeFaceOp);
  var ImportJSONOp=_ESClass("ImportJSONOp", ToolOp, [function ImportJSONOp(str) {
    ToolOp.call(this);
    if (str!=undefined) {
        this.inputs.strdata.set_data(str);
    }
  }, _ESClass.static(function tooldef() {
    return {uiname: "Import Old JSON", apiname: "editor.import_old_json", inputs: {strdata: new StringProperty("", "JSON", "JSON", "JSON string data")}, outputs: {}, icon: -1, is_modal: false, description: "Import old json files"}
  }), function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_CONNECT);
  }, function exec(ctx) {
    console.log("import json spline op!");
    var spline=ctx.spline;
    var obj=JSON.parse(this.inputs.strdata.data);
    spline.import_json(obj);
    spline.regen_render();
  }]);
  _es6_module.add_class(ImportJSONOp);
  ImportJSONOp = _es6_module.add_export('ImportJSONOp', ImportJSONOp);
});
es6_module_define('spline_editops', ["frameset", "toolops_api", "struct", "toolprops", "animdata", "spline", "spline_draw", "spline_types"], function _spline_editops_module(_es6_module) {
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var CollectionProperty=es6_import_item(_es6_module, 'toolprops', 'CollectionProperty');
  var BoolProperty=es6_import_item(_es6_module, 'toolprops', 'BoolProperty');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, 'toolops_api', 'ModalStates');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var RecalcFlags=es6_import_item(_es6_module, 'spline_types', 'RecalcFlags');
  var RestrictFlags=es6_import_item(_es6_module, 'spline', 'RestrictFlags');
  var Spline=es6_import_item(_es6_module, 'spline', 'Spline');
  var VDAnimFlags=es6_import_item(_es6_module, 'frameset', 'VDAnimFlags');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  es6_import(_es6_module, 'struct');
  var redo_draw_sort=es6_import_item(_es6_module, 'spline_draw', 'redo_draw_sort');
  var KeyCurrentFrame=_ESClass("KeyCurrentFrame", ToolOp, [function KeyCurrentFrame() {
    ToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {apiname: "spline.key_current_frame", uiname: "Key Selected", inputs: {}, outputs: {}, icon: -1, is_modal: false}
  }), function exec(ctx) {
    var __iter_v=__get_iter(ctx.frameset.spline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      v.flag|=SplineFlags.FRAME_DIRTY;
    }
    ctx.frameset.update_frame();
    ctx.frameset.pathspline.resolve = 1;
    ctx.frameset.pathspline.regen_sort();
    ctx.frameset.pathspline.solve();
  }]);
  _es6_module.add_class(KeyCurrentFrame);
  KeyCurrentFrame = _es6_module.add_export('KeyCurrentFrame', KeyCurrentFrame);
  var ShiftLayerOrderOp=_ESClass("ShiftLayerOrderOp", ToolOp, [function ShiftLayerOrderOp(layer_id, off) {
    ToolOp.call(this);
    if (layer_id!=undefined) {
        this.inputs.layer_id.set_data(layer_id);
    }
    if (off!=undefined) {
        this.inputs.off.set_data(off);
    }
  }, _ESClass.static(function tooldef() {
    return {uiname: "Shift Layer Order", apiname: "spline.shift_layer_order", inputs: {layer_id: new IntProperty(0), off: new IntProperty(1)}, outputs: {}, icon: -1, is_modal: false}
  }), function exec(ctx) {
    var spline=ctx.spline;
    var layer=this.inputs.layer_id.data;
    layer = spline.layerset.idmap[layer];
    if (layer==undefined)
      return ;
    var off=this.inputs.off.data;
    spline.layerset.change_layer_order(layer, layer.order+off);
    spline.regen_sort();
  }]);
  _es6_module.add_class(ShiftLayerOrderOp);
  ShiftLayerOrderOp = _es6_module.add_export('ShiftLayerOrderOp', ShiftLayerOrderOp);
  var SplineGlobalToolOp=_ESClass("SplineGlobalToolOp", ToolOp, [function SplineGlobalToolOp(apiname, uiname, description, icon) {
    ToolOp.call(this, apiname, uiname, description, icon);
  }]);
  _es6_module.add_class(SplineGlobalToolOp);
  SplineGlobalToolOp = _es6_module.add_export('SplineGlobalToolOp', SplineGlobalToolOp);
  var SplineLocalToolOp=_ESClass("SplineLocalToolOp", ToolOp, [function SplineLocalToolOp(apiname, uiname, description, icon) {
    ToolOp.call(this, apiname, uiname, description, icon);
  }, function undo_pre(ctx) {
    var spline=ctx.spline;
    var data=[];
    istruct.write_object(data, spline);
    data = new DataView(new Uint8Array(data).buffer);
    this._undo = {data: data}
    window.redraw_viewport();
  }, function undo(ctx) {
    var spline=ctx.spline;
    var spline2=istruct.read_object(this._undo.data, Spline);
    var idgen=spline.idgen;
    var is_anim_path=spline.is_anim_path;
    for (var k in spline2) {
        spline[k] = spline2[k];
    }
    var max_cur=spline.idgen.cur_id;
    spline.idgen = idgen;
    if (is_anim_path!=undefined)
      spline.is_anim_path = is_anim_path;
    console.log("Restoring IDGen; max_cur:", max_cur, "current max:", spline.idgen.cur_id);
    idgen.max_cur(max_cur-1);
  }]);
  _es6_module.add_class(SplineLocalToolOp);
  SplineLocalToolOp = _es6_module.add_export('SplineLocalToolOp', SplineLocalToolOp);
  var KeyEdgesOp=_ESClass("KeyEdgesOp", SplineLocalToolOp, [function KeyEdgesOp() {
    SplineLocalToolOp.call(this);
    this.uiname = "Key Edges";
  }, _ESClass.static(function tooldef() {
    return {uiname: "Key Edges", apiname: "spline.key_edges", inputs: {}, outputs: {}, icon: -1, is_modal: false}
  }), function can_call(ctx) {
    return ctx.spline===ctx.frameset.spline;
  }, function exec(ctx) {
    var prefix="frameset.drawspline.segments[";
    var frameset=ctx.frameset;
    var spline=frameset.spline;
    var edge_path_keys={z: 1}
    var __iter_s=__get_iter(spline.segments);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      var path=prefix+s.eid+"]";
      for (var k in edge_path_keys) {
          path+="."+k;
      }
      ctx.api.key_animpath(ctx, frameset, path, ctx.scene.time);
    }
  }]);
  _es6_module.add_class(KeyEdgesOp);
  KeyEdgesOp = _es6_module.add_export('KeyEdgesOp', KeyEdgesOp);
  var pose_clipboards={}
  var CopyPoseOp=_ESClass("CopyPoseOp", SplineLocalToolOp, [function CopyPoseOp() {
    SplineLocalToolOp.call(this);
    this.undoflag|=UndoFlags.IGNORE_UNDO;
  }, _ESClass.static(function tooldef() {
    return {uiname: "Copy Pose", apiname: "editor.copy_pose", undoflag: UndoFlags.IGNORE_UNDO, inputs: {}, outputs: {}, icon: -1, is_modal: false}
  }), function exec(ctx) {
    var lists=[ctx.spline.verts.selected.editable(), ctx.spline.handles.selected.editable()];
    var pose_clipboard={}
    pose_clipboards[ctx.splinepath] = pose_clipboard;
    for (var i=0; i<2; i++) {
        var __iter_v=__get_iter(lists[i]);
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          pose_clipboard[v.eid] = new Vector3(v);
        }
    }
  }]);
  _es6_module.add_class(CopyPoseOp);
  CopyPoseOp = _es6_module.add_export('CopyPoseOp', CopyPoseOp);
  var PastePoseOp=_ESClass("PastePoseOp", SplineLocalToolOp, [function PastePoseOp() {
    SplineLocalToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Paste Pose", apiname: "editor.paste_pose", inputs: {pose: new CollectionProperty([], undefined, "pose", "pose", "pose data", TPropFlags.COLL_LOOSE_TYPE)}, outputs: {}, icon: -1, is_modal: true}
  }), function start_modal(ctx) {
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
    this.inputs.pose.set_data(array);
    this.exec(ctx);
  }, function exec(ctx) {
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
  }]);
  _es6_module.add_class(PastePoseOp);
  PastePoseOp = _es6_module.add_export('PastePoseOp', PastePoseOp);
  var InterpStepModeOp=_ESClass("InterpStepModeOp", ToolOp, [function InterpStepModeOp() {
    ToolOp.call(this, undefined, "Toggle Step Mode", "Disable/enable smooth interpolation for animation paths");
  }, _ESClass.static(function tooldef() {
    return {uiname: "Toggle Step Mode", apiname: "spline.toggle_step_mode", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Disable/enable smooth interpolation for animation paths"}
  }), function get_animverts(ctx) {
    var vds=new set();
    var spline=ctx.frameset.spline, pathspline=ctx.frameset.pathspline;
    var frameset=ctx.frameset;
    var __iter_v=__get_iter(spline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      var vd=frameset.vertex_animdata[v.eid];
      if (vd==undefined)
        continue;
      vds.add(vd);
    }
    return vds;
  }, function undo_pre(ctx) {
    var undo={}
    var pathspline=ctx.frameset.pathspline;
    var __iter_vd=__get_iter(this.get_animverts(ctx));
    var vd;
    while (1) {
      var __ival_vd=__iter_vd.next();
      if (__ival_vd.done) {
          break;
      }
      vd = __ival_vd.value;
      undo[vd.eid] = vd.animflag;
    }
    this._undo = undo;
  }, function undo(ctx) {
    var undo=this._undo;
    var pathspline=ctx.frameset.pathspline;
    var __iter_vd=__get_iter(this.get_animverts(ctx));
    var vd;
    while (1) {
      var __ival_vd=__iter_vd.next();
      if (__ival_vd.done) {
          break;
      }
      vd = __ival_vd.value;
      if (!(vd.eid in undo)) {
          console.log("ERROR in step function tool undo!!");
          continue;
      }
      vd.animflag = undo[vd.eid];
    }
  }, function exec(ctx) {
    var kcache=ctx.frameset.kcache;
    var __iter_vd=__get_iter(this.get_animverts(ctx));
    var vd;
    while (1) {
      var __ival_vd=__iter_vd.next();
      if (__ival_vd.done) {
          break;
      }
      vd = __ival_vd.value;
      vd.animflag^=VDAnimFlags.STEP_FUNC;
      var __iter_v=__get_iter(vd.verts);
      var v;
      while (1) {
        var __ival_v=__iter_v.next();
        if (__ival_v.done) {
            break;
        }
        v = __ival_v.value;
        var time=get_vtime(v);
        kcache.invalidate(v.eid, time);
      }
    }
  }]);
  _es6_module.add_class(InterpStepModeOp);
  InterpStepModeOp = _es6_module.add_export('InterpStepModeOp', InterpStepModeOp);
  var DeleteVertOp=_ESClass("DeleteVertOp", SplineLocalToolOp, [function DeleteVertOp() {
    SplineLocalToolOp.call(this);
  }, function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_DELETE);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Delete Points/Segments", apiname: "spline.delete_verts", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Remove points and segments"}
  }), function exec(ctx) {
    console.log("delete op!");
    var spline=ctx.spline;
    var dellist=[];
    var __iter_v=__get_iter(spline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      v.flag|=SplineFlags.UPDATE;
      dellist.push(v);
    }
    spline.propagate_update_flags();
    for (var i=0; i<dellist.length; i++) {
        console.log(dellist[i]);
        spline.kill_vertex(dellist[i]);
    }
    spline.regen_render();
  }]);
  _es6_module.add_class(DeleteVertOp);
  DeleteVertOp = _es6_module.add_export('DeleteVertOp', DeleteVertOp);
  var DeleteSegmentOp=_ESClass("DeleteSegmentOp", ToolOp, [function DeleteSegmentOp() {
    ToolOp.call(this, undefined);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Delete Segments", apiname: "spline.delete_segments", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Remove segments"}
  }), function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_DELETE);
  }, function exec(ctx) {
    console.log("delete op!");
    var spline=ctx.spline;
    var dellist=[];
    var __iter_s=__get_iter(spline.segments.selected.editable());
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
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
  }]);
  _es6_module.add_class(DeleteSegmentOp);
  DeleteSegmentOp = _es6_module.add_export('DeleteSegmentOp', DeleteSegmentOp);
  var DeleteFaceOp=_ESClass("DeleteFaceOp", SplineLocalToolOp, [function DeleteFaceOp() {
    SplineLocalToolOp.call(this, undefined, "Delete Faces");
  }, _ESClass.static(function tooldef() {
    return {uiname: "Delete Faces", apiname: "spline.delete_faces", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Remove faces"}
  }), function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_DELETE);
  }, function exec(ctx) {
    console.log("delete op!");
    var spline=ctx.spline;
    var vset=new set(), sset=new set(), fset=new set();
    var dellist=[];
    var __iter_f=__get_iter(spline.faces.selected.editable());
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      fset.add(f);
    }
    var __iter_f=__get_iter(fset);
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
    var __iter_s=__get_iter(sset);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
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
    var __iter_f=__get_iter(fset);
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      spline.kill_face(f);
    }
    var __iter_s=__get_iter(sset);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      spline.kill_segment(s);
    }
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      spline.kill_vertex(v);
    }
    spline.regen_render();
    window.redraw_viewport();
  }]);
  _es6_module.add_class(DeleteFaceOp);
  DeleteFaceOp = _es6_module.add_export('DeleteFaceOp', DeleteFaceOp);
  var ChangeFaceZ=_ESClass("ChangeFaceZ", SplineLocalToolOp, [function ChangeFaceZ(offset, selmode) {
    SplineLocalToolOp.call(this, undefined);
    if (offset!=undefined)
      this.inputs.offset.set_data(offset);
    if (selmode!=undefined)
      this.inputs.selmode.set_data(selmode);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Set Order", apiname: "spline.change_face_z", inputs: {offset: new IntProperty(1), selmode: new IntProperty(SplineTypes.FACE)}, outputs: {}, icon: -1, is_modal: false, description: "Change draw order of selected faces"}
  }), function can_call(ctx) {
    return 1;
  }, function exec(ctx) {
    console.log("change face z!");
    var spline=ctx.spline;
    var off=this.inputs.offset.data;
    var selmode=this.inputs.selmode.data;
    if (isNaN(off))
      off = 0.0;
    if (selmode&SplineTypes.FACE) {
        var __iter_f=__get_iter(spline.faces.selected.editable());
        var f;
        while (1) {
          var __ival_f=__iter_f.next();
          if (__ival_f.done) {
              break;
          }
          f = __ival_f.value;
          if (isNaN(f.z))
            f.z = 0.0;
          if (f.hidden)
            continue;
          f.z+=off;
        }
    }
    if (selmode&SplineTypes.SEGMENT) {
        var __iter_s=__get_iter(spline.segments.selected.editable());
        var s;
        while (1) {
          var __ival_s=__iter_s.next();
          if (__ival_s.done) {
              break;
          }
          s = __ival_s.value;
          if (isNaN(s.z))
            s.z = 0.0;
          if (s.hidden)
            continue;
          s.z+=off;
        }
    }
    spline.regen_sort();
    window.redraw_viewport();
  }]);
  _es6_module.add_class(ChangeFaceZ);
  ChangeFaceZ = _es6_module.add_export('ChangeFaceZ', ChangeFaceZ);
  var DissolveVertOp=_ESClass("DissolveVertOp", SplineLocalToolOp, [function DissolveVertOp() {
    SplineLocalToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Collapse Points", apiname: "spline.dissolve_verts", inputs: {verts: new CollectionProperty([], undefined, "verts", "verts"), use_verts: new BoolProperty(false, "use_verts")}, outputs: {}, icon: -1, is_modal: false, description: "Change draw order of selected faces"}
  }), function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_DISSOLVE);
  }, function exec(ctx) {
    var spline=ctx.spline;
    var dellist=[];
    var verts=spline.verts.selected.editable();
    if (this.inputs.use_verts.data) {
        verts = new set();
        var __iter_eid=__get_iter(this.inputs.verts.data);
        var eid;
        while (1) {
          var __ival_eid=__iter_eid.next();
          if (__ival_eid.done) {
              break;
          }
          eid = __ival_eid.value;
          verts.add(spline.eidmap[eid]);
        }
    }
    var __iter_v=__get_iter(verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      if (v.segments.length!=2)
        continue;
      dellist.push(v);
    }
    for (var i=0; i<dellist.length; i++) {
        spline.dissolve_vertex(dellist[i]);
    }
    spline.regen_render();
  }]);
  _es6_module.add_class(DissolveVertOp);
  DissolveVertOp = _es6_module.add_export('DissolveVertOp', DissolveVertOp);
  var SplitEdgeOp=_ESClass("SplitEdgeOp", SplineGlobalToolOp, [function SplitEdgeOp() {
    SplineGlobalToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Split Segments", apiname: "spline.split_edges", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Split selected segments"}
  }), function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_SPLIT_EDGE);
  }, function exec(ctx) {
    console.log("split edge op!");
    var spline=ctx.spline;
    var interp_animdata=spline===ctx.frameset.spline;
    var frameset=interp_animdata ? ctx.frameset : undefined;
    console.log("interp_animdata: ", interp_animdata);
    var segs=[];
    if (interp_animdata) {
        console.log("interpolating animation data from adjacent vertices!");
    }
    var __iter_s=__get_iter(spline.segments.selected.editable());
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      if (s.v1.hidden||s.v2.hidden)
        continue;
      if ((s.v1.flag&SplineFlags.SELECT&&s.v2.flag&SplineFlags.SELECT))
        segs.push(s);
    }
    for (var i=0; i<segs.length; i++) {
        var e_v=spline.split_edge(segs[i]);
        if (interp_animdata) {
            frameset.create_path_from_adjacent(e_v[1], e_v[0]);
        }
        spline.verts.setselect(e_v[1], true);
    }
    spline.regen_render();
  }]);
  _es6_module.add_class(SplitEdgeOp);
  SplitEdgeOp = _es6_module.add_export('SplitEdgeOp', SplitEdgeOp);
  var VertPropertyBaseOp=_ESClass("VertPropertyBaseOp", ToolOp, [function undo_pre(ctx) {
    var spline=ctx.spline;
    var vdata={}
    var __iter_v=__get_iter(spline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      vdata[v.eid] = v.flag;
    }
    this._undo = vdata;
    window.redraw_viewport();
  }, function undo(ctx) {
    var spline=ctx.spline;
    for (var k in this._undo) {
        var v=spline.eidmap[k];
        v.flag = this._undo[k];
        v.flag|=SplineFlags.UPDATE;
    }
    spline.resolve = 1;
  }, function VertPropertyBaseOp() {
    ToolOp.apply(this, arguments);
  }]);
  _es6_module.add_class(VertPropertyBaseOp);
  VertPropertyBaseOp = _es6_module.add_export('VertPropertyBaseOp', VertPropertyBaseOp);
  var ToggleBreakTanOp=_ESClass("ToggleBreakTanOp", VertPropertyBaseOp, [function ToggleBreakTanOp() {
    VertPropertyBaseOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Toggle Sharp Corners", apiname: "spline.toggle_break_tangents", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Toggle Sharp Corners"}
  }), function exec(ctx) {
    var spline=ctx.spline;
    var actlayer=spline.layerset.active.id;
    for (var si=0; si<2; si++) {
        var list=si ? spline.handles : spline.verts;
        var __iter_v=__get_iter(list.selected.editable());
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
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
  }]);
  _es6_module.add_class(ToggleBreakTanOp);
  ToggleBreakTanOp = _es6_module.add_export('ToggleBreakTanOp', ToggleBreakTanOp);
  var ToggleBreakCurvOp=_ESClass("ToggleBreakCurvOp", VertPropertyBaseOp, [function ToggleBreakCurvOp() {
    VertPropertyBaseOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Toggle Broken Curvatures", apiname: "spline.toggle_break_curvature", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Toggle Break Curvatures, enable 'draw normals'\n in display panel to\n see what this does"}
  }), function exec(ctx) {
    var spline=ctx.spline;
    var __iter_v=__get_iter(spline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      v.flag^=SplineFlags.BREAK_CURVATURES;
      v.flag|=SplineFlags.UPDATE;
    }
    spline.resolve = 1;
  }]);
  _es6_module.add_class(ToggleBreakCurvOp);
  ToggleBreakCurvOp = _es6_module.add_export('ToggleBreakCurvOp', ToggleBreakCurvOp);
  var ConnectHandlesOp=_ESClass("ConnectHandlesOp", ToolOp, [function ConnectHandlesOp() {
    ToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Connect Handles", apiname: "spline.connect_handles", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Pairs adjacent handles together to make a smooth curve"}
  }), function exec(ctx) {
    var spline=ctx.spline;
    var h1=undefined, h2=undefined;
    var __iter_h=__get_iter(spline.handles.selected.editable());
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
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
  }]);
  _es6_module.add_class(ConnectHandlesOp);
  ConnectHandlesOp = _es6_module.add_export('ConnectHandlesOp', ConnectHandlesOp);
  var DisconnectHandlesOp=_ESClass("DisconnectHandlesOp", ToolOp, [function DisconnectHandlesOp() {
    ToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Disconnect Handles", apiname: "spline.disconnect_handles", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Disconnects all handles around a point.\n  Point must have more than two segments"}
  }), function exec(ctx) {
    var spline=ctx.spline;
    console.log("Disconnect handles");
    var __iter_h=__get_iter(spline.handles.selected.editable());
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
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
  }]);
  _es6_module.add_class(DisconnectHandlesOp);
  DisconnectHandlesOp = _es6_module.add_export('DisconnectHandlesOp', DisconnectHandlesOp);
  var CurveRootFinderTest=_ESClass("CurveRootFinderTest", ToolOp, [function CurveRootFinderTest() {
    ToolOp.call(this, "curverootfinder", "curverootfinder", "curverootfinder");
  }, _ESClass.static(function tooldef() {
    return {uiname: "Test Closest Point Finder", apiname: "spline._test_closest_points", inputs: {}, outputs: {}, undoflag: UndoFlags.IGNORE_UNDO, icon: -1, is_modal: true, description: "Test closest-point-to-curve functionality"}
  }), function on_mousemove(event) {
    var mpos=[event.x, event.y];
    var ctx=this.modal_ctx;
    var spline=ctx.spline;
    this.reset_drawlines();
    var __iter_seg=__get_iter(spline.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      var ret=seg.closest_point(mpos, 0);
      if (ret==undefined)
        continue;
      var dl=this.new_drawline(ret[0], mpos);
      dl.clr[3] = 0.1;
      continue;
      var ret=seg.closest_point(mpos, 3);
      var __iter_p=__get_iter(ret);
      var p;
      while (1) {
        var __ival_p=__iter_p.next();
        if (__ival_p.done) {
            break;
        }
        p = __ival_p.value;
        this.new_drawline(p[0], mpos);
      }
    }
  }, function end_modal() {
    this.reset_drawlines();
    this._end_modal();
  }, function on_mousedown(event) {
    this.end_modal();
  }, function on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Enter"]:
      case charmap["Escape"]:
        this.end_modal();
        break;
    }
  }]);
  _es6_module.add_class(CurveRootFinderTest);
  CurveRootFinderTest = _es6_module.add_export('CurveRootFinderTest', CurveRootFinderTest);
  var AnimPlaybackOp=_ESClass("AnimPlaybackOp", ToolOp, [function AnimPlaybackOp() {
    ToolOp.call(this);
    this.undoflag|=UndoFlags.IGNORE_UNDO;
    this.timer = undefined;
    this.time = 0;
    this.start_time = 0;
    this.on_solve_node = function() {
      console.log("on_solve callback triggered in AnimPLaybackOp");
      window.redraw_viewport();
      this.on_frame(this.modal_ctx);
    }
  }, _ESClass.static(function tooldef() {
    return {uiname: "Playback", apiname: "editor.playback", inputs: {}, outputs: {}, undoflag: UndoFlags.IGNORE_UNDO, icon: -1, is_modal: true, description: "Play back animation"}
  }), function on_frame(ctx) {
    this.time+=1.0;
    ctx.scene.change_time(ctx, this.time);
    window.redraw_viewport();
  }, function end_modal(ctx) {
    the_global_dag.remove(this.on_solve_node);
    g_app_state.set_modalstate(0);
    ToolOp.prototype.end_modal.call(this);
    if (this.timer!=undefined) {
        window.clearInterval(this.timer);
        this.timer = undefined;
    }
  }, function cancel(ctx) {
  }, function finish(ctx) {
    ctx.scene.change_time(ctx, this.start_time);
  }, function on_mousemove(event) {
  }, function on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Escape"]:
      case charmap["Return"]:
      case charmap["Space"]:
        this.finish(this.modal_ctx);
        this.end_modal();
    }
  }, function on_mouseup(event) {
    this.end_modal();
  }, function start_modal(ctx) {
    the_global_dag.link(ctx.frameset.spline, ["on_solve"], this.on_solve_node, "", this);
    g_app_state.set_modalstate(ModalStates.PLAYING);
    var this2=this;
    this.time = this.start_time = ctx.scene.time;
    this.on_frame(this.modal_ctx);
    if (0) {
        var last_time=time_ms();
        this.timer = window.setInterval(function() {
          if (time_ms()-last_time<41) {
              return ;
          }
          last_time = time_ms();
          this2.on_frame(this2.modal_ctx);
        }, 1);
    }
  }]);
  _es6_module.add_class(AnimPlaybackOp);
  AnimPlaybackOp = _es6_module.add_export('AnimPlaybackOp', AnimPlaybackOp);
  var ToggleManualHandlesOp=_ESClass("ToggleManualHandlesOp", ToolOp, [function ToggleManualHandlesOp() {
    ToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Toggle Manual Handles", apiname: "spline.toggle_manual_handles", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Toggle Manual Handles"}
  }), function undo_pre(ctx) {
    var spline=ctx.spline;
    var ud=this._undo = {}
    var __iter_v=__get_iter(spline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      ud[v.eid] = v.flag&SplineFlags.USE_HANDLES;
    }
  }, function undo(ctx) {
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
  }, function exec(ctx) {
    var spline=ctx.spline;
    var __iter_v=__get_iter(spline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      v.flag^=SplineFlags.USE_HANDLES;
      v.flag|=SplineFlags.UPDATE;
    }
    spline.resolve = 1;
  }]);
  _es6_module.add_class(ToggleManualHandlesOp);
  ToggleManualHandlesOp = _es6_module.add_export('ToggleManualHandlesOp', ToggleManualHandlesOp);
  var TimeDataLayer=es6_import_item(_es6_module, 'animdata', 'TimeDataLayer');
  var get_vtime=es6_import_item(_es6_module, 'animdata', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, 'animdata', 'set_vtime');
  var ShiftTimeOp=_ESClass("ShiftTimeOp", ToolOp, [function ShiftTimeOp() {
    ToolOp.call(this);
    this.start_mpos = new Vector3();
  }, _ESClass.static(function tooldef() {
    return {uiname: "Move Keyframes", apiname: "spline.shift_time", inputs: {factor: new FloatProperty(-1, "factor", "factor", "factor")}, outputs: {}, icon: -1, is_modal: true, description: "Move keyframes"}
  }), function get_curframe_animverts(ctx) {
    var vset=new set();
    var spline=ctx.frameset.spline, pathspline=ctx.frameset.pathspline;
    var frameset=ctx.frameset;
    var __iter_v=__get_iter(pathspline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      vset.add(v);
    }
    if (vset.length==0) {
        var __iter_v=__get_iter(spline.verts.selected.editable());
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          var vd=frameset.vertex_animdata[v.eid];
          if (vd==undefined)
            continue;
          var __iter_v2=__get_iter(vd.verts);
          var v2;
          while (1) {
            var __ival_v2=__iter_v2.next();
            if (__ival_v2.done) {
                break;
            }
            v2 = __ival_v2.value;
            var vtime=get_vtime(v2);
            if (vtime==ctx.scene.time) {
                vset.add(v2);
            }
          }
        }
    }
    return vset;
  }, function start_modal(ctx) {
    this.first = true;
  }, function end_modal(ctx) {
    ToolOp.prototype.end_modal.call(this);
  }, function cancel(ctx) {
  }, function finish(ctx) {
    ctx.scene.change_time(ctx, this.start_time);
  }, function on_mousemove(event) {
    if (this.first) {
        this.start_mpos.load([event.x, event.y, 0]);
        this.first = false;
    }
    var mpos=new Vector3([event.x, event.y, 0]);
    var dx=-Math.floor((this.start_mpos[0]-mpos[0])/20+0.5);
    this.undo(this.modal_ctx);
    this.inputs.factor.set_data(dx);
    this.exec(this.modal_ctx);
    window.redraw_viewport();
  }, function on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Escape"]:
        this.cancel(this.modal_ctx);
      case charmap["Return"]:
      case charmap["Space"]:
        this.finish(this.modal_ctx);
        this.end_modal();
    }
  }, function on_mouseup(event) {
    this.end_modal();
  }, function undo_pre(ctx) {
    var ud=this._undo = {}
    var __iter_v=__get_iter(this.get_curframe_animverts(ctx));
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      ud[v.eid] = get_vtime(v);
    }
  }, function undo(ctx) {
    var spline=ctx.frameset.pathspline;
    for (var k in this._undo) {
        var v=spline.eidmap[k], time=this._undo[k];
        set_vtime(v, time);
        v.dag_update("depend");
    }
    ctx.frameset.download();
  }, function exec(ctx) {
    var spline=ctx.frameset.pathspline;
    var starts={}
    var off=this.inputs.factor.data;
    var vset=this.get_curframe_animverts(ctx);
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      starts[v.eid] = get_vtime(v);
    }
    var kcache=ctx.frameset.kcache;
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      kcache.invalidate(v.eid, get_vtime(v));
      set_vtime(v, starts[v.eid]+off);
      kcache.invalidate(v.eid, get_vtime(v));
      v.dag_update("depend");
    }
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
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
      set_vtime(v, newtime);
      v.dag_update("depend");
    }
    ctx.frameset.download();
  }]);
  _es6_module.add_class(ShiftTimeOp);
  ShiftTimeOp = _es6_module.add_export('ShiftTimeOp', ShiftTimeOp);
  var DuplicateOp=_ESClass("DuplicateOp", SplineLocalToolOp, [function DuplicateOp() {
    SplineLocalToolOp.call(this, undefined, "Duplicate");
  }, _ESClass.static(function tooldef() {
    return {uiname: "Duplicate Geometry", apiname: "spline.duplicate", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Make a duplicate of selected geometry."}
  }), function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_CREATE);
  }, function exec(ctx) {
    var vset=new set();
    var sset=new set();
    var fset=new set();
    var hset=new set();
    var spline=ctx.spline;
    var eidmap={}
    var __iter_v=__get_iter(spline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      vset.add(v);
    }
    var __iter_s=__get_iter(spline.segments.selected.editable());
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      sset.add(s);
      vset.add(s.v1);
      vset.add(s.v2);
    }
    var __iter_f=__get_iter(spline.faces.selected.editable());
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      fset.add(f);
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
          sset.add(l.s);
          vset.add(l.s.v1);
          vset.add(l.s.v2);
        }
      }
    }
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      var nv=spline.make_vertex(v);
      spline.copy_vert_data(nv, v);
      eidmap[v.eid] = nv;
      spline.verts.setselect(v, false);
      spline.verts.setselect(nv, true);
    }
    var __iter_s=__get_iter(sset);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
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
    var __iter_h=__get_iter(hset);
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
      var nh=eidmap[h.eid];
      if (h.pair!=undefined&&h.pair.eid in eidmap) {
          spline.connect_handles(nh, eidmap[h.pair.eid]);
      }
    }
    var __iter_f=__get_iter(fset);
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      var vlists=[];
      var __iter_path=__get_iter(f.paths);
      var path;
      while (1) {
        var __ival_path=__iter_path.next();
        if (__ival_path.done) {
            break;
        }
        path = __ival_path.value;
        var verts=[];
        vlists.push(verts);
        var __iter_l=__get_iter(path);
        var l;
        while (1) {
          var __ival_l=__iter_l.next();
          if (__ival_l.done) {
              break;
          }
          l = __ival_l.value;
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
  }]);
  _es6_module.add_class(DuplicateOp);
  DuplicateOp = _es6_module.add_export('DuplicateOp', DuplicateOp);
  var SplineMirrorOp=_ESClass("SplineMirrorOp", SplineLocalToolOp, [function SplineMirrorOp() {
    SplineLocalToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Flip Horizontally", apiname: "spline.mirror_verts", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Flip selected points horizontally"}
  }), function exec(ctx) {
    var spline=ctx.spline;
    var points=new set();
    var cent=new Vector3();
    for (var i=0; i<2; i++) {
        var list=i ? spline.handles : spline.verts;
        var __iter_v=__get_iter(list.selected.editable());
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
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
    var __iter_v=__get_iter(points);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      v.sub(cent);
      v[0] = -v[0];
      v.add(cent);
      v.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
    }
    spline.resolve = 1;
  }]);
  _es6_module.add_class(SplineMirrorOp);
  SplineMirrorOp = _es6_module.add_export('SplineMirrorOp', SplineMirrorOp);
});
es6_module_define('spline_layerops', ["spline_editops", "toolops_api", "spline_types", "spline", "toolprops"], function _spline_layerops_module(_es6_module) {
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var RecalcFlags=es6_import_item(_es6_module, 'spline_types', 'RecalcFlags');
  var RestrictFlags=es6_import_item(_es6_module, 'spline', 'RestrictFlags');
  var Spline=es6_import_item(_es6_module, 'spline', 'Spline');
  var SplineLocalToolOp=es6_import_item(_es6_module, 'spline_editops', 'SplineLocalToolOp');
  var StringProperty=es6_import_item(_es6_module, 'toolprops', 'StringProperty');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var BoolProperty=es6_import_item(_es6_module, 'toolprops', 'BoolProperty');
  var CollectionProperty=es6_import_item(_es6_module, 'toolprops', 'CollectionProperty');
  var AddLayerOp=_ESClass("AddLayerOp", SplineLocalToolOp, [function AddLayerOp(name) {
    SplineLocalToolOp.call(this, undefined, "Add Layer");
    if (name!=undefined)
      this.inputs.name.set_data(name);
  }, function exec(ctx) {
    var layer=ctx.spline.layerset.new_layer(this.inputs.name.data);
    this.outputs.layerid.set_data(layer.id);
    if (this.inputs.make_active.data) {
        ctx.spline.layerset.active = layer;
        var __iter_list=__get_iter(ctx.spline.elists);
        var list;
        while (1) {
          var __ival_list=__iter_list.next();
          if (__ival_list.done) {
              break;
          }
          list = __ival_list.value;
          list.active = undefined;
        }
    }
    ctx.spline.regen_sort();
  }]);
  _es6_module.add_class(AddLayerOp);
  AddLayerOp = _es6_module.add_export('AddLayerOp', AddLayerOp);
  AddLayerOp.inputs = {name: new StringProperty("Layer", "name", "Name", "Layer Name"), make_active: new BoolProperty(true, "Make Active")}
  AddLayerOp.outputs = {layerid: new IntProperty(0, "layerid", "layerid", "New Layer ID")}
  var ChangeLayerOp=_ESClass("ChangeLayerOp", ToolOp, [function ChangeLayerOp(id) {
    ToolOp.call(this, undefined, "Change Layer");
    if (id!=undefined)
      this.inputs.layerid.set_data(id);
  }, function undo_pre(ctx) {
    var spline=ctx.spline;
    var actives=[];
    var __iter_list=__get_iter(spline.elists);
    var list;
    while (1) {
      var __ival_list=__iter_list.next();
      if (__ival_list.done) {
          break;
      }
      list = __ival_list.value;
      actives.push(list.active!=undefined ? list.active.eid : -1);
    }
    this._undo = {id: ctx.spline.layerset.active.id, actives: actives}
  }, function undo(ctx) {
    var spline=ctx.spline;
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
  }, function exec(ctx) {
    var spline=ctx.spline;
    var layer=spline.layerset.idmap[this.inputs.layerid.data];
    if (layer==undefined) {
        console.log("ERROR IN CHANGELAYER!");
        return ;
    }
    var __iter_list=__get_iter(spline.elists);
    var list;
    while (1) {
      var __ival_list=__iter_list.next();
      if (__ival_list.done) {
          break;
      }
      list = __ival_list.value;
      list.active = undefined;
    }
    spline.layerset.active = layer;
    window.redraw_viewport();
  }]);
  _es6_module.add_class(ChangeLayerOp);
  ChangeLayerOp = _es6_module.add_export('ChangeLayerOp', ChangeLayerOp);
  
  ChangeLayerOp.inputs = {layerid: new IntProperty(0, "layerid", "layerid", "Layer ID")}
  var ChangeElementLayerOp=_ESClass("ChangeElementLayerOp", SplineLocalToolOp, [function ChangeElementLayerOp(old_layer, new_layer) {
    SplineLocalToolOp.call(this, undefined, "Move to Layer");
    if (old_layer!=undefined)
      this.inputs.old_layer.set_data(old_layer);
    if (new_layer!=undefined)
      this.inputs.new_layer.set_data(new_layer);
  }, function exec(ctx) {
    var spline=ctx.spline;
    var oldl=this.inputs.old_layer.data;
    var newl=this.inputs.new_layer.data;
    var eset=new set();
    var __iter_e=__get_iter(spline.selected);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
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
    var __iter_e=__get_iter(eset);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      oldl.remove(e);
      newl.add(e);
    }
    window.redraw_viewport();
    spline.regen_sort();
  }]);
  _es6_module.add_class(ChangeElementLayerOp);
  ChangeElementLayerOp = _es6_module.add_export('ChangeElementLayerOp', ChangeElementLayerOp);
  ChangeElementLayerOp.inputs = {old_layer: new IntProperty(0), new_layer: new IntProperty(0)}
  var DeleteLayerOp=_ESClass("DeleteLayerOp", SplineLocalToolOp, [function DeleteLayerOp() {
    SplineLocalToolOp.call(this, undefined);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Delete Layer", apiname: "spline.layers.remove", inputs: {layer_id: new IntProperty(-1)}, is_modal: false}
  }), function exec(ctx) {
    var spline=ctx.spline;
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
    var __iter_e=__get_iter(orphaned);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      e.layers[layer.id] = 1;
    }
  }]);
  _es6_module.add_class(DeleteLayerOp);
  DeleteLayerOp = _es6_module.add_export('DeleteLayerOp', DeleteLayerOp);
});
es6_module_define('spline_animops', [], function _spline_animops_module(_es6_module) {
});
es6_module_define('multires_ops', ["spline_draw", "spline_types", "spline_editops", "spline_multires", "toolprops", "J3DIMath", "spline", "toolops_api"], function _multires_ops_module(_es6_module) {
  es6_import(_es6_module, 'J3DIMath');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var CollectionProperty=es6_import_item(_es6_module, 'toolprops', 'CollectionProperty');
  var BoolProperty=es6_import_item(_es6_module, 'toolprops', 'BoolProperty');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var Vec3Property=es6_import_item(_es6_module, 'toolprops', 'Vec3Property');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, 'toolops_api', 'ModalStates');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var RecalcFlags=es6_import_item(_es6_module, 'spline_types', 'RecalcFlags');
  var RestrictFlags=es6_import_item(_es6_module, 'spline', 'RestrictFlags');
  var Spline=es6_import_item(_es6_module, 'spline', 'Spline');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var redo_draw_sort=es6_import_item(_es6_module, 'spline_draw', 'redo_draw_sort');
  var SplineLocalToolOp=es6_import_item(_es6_module, 'spline_editops', 'SplineLocalToolOp');
  var ensure_multires=es6_import_item(_es6_module, 'spline_multires', 'ensure_multires');
  var MResFlags=es6_import_item(_es6_module, 'spline_multires', 'MResFlags');
  var BoundPoint=es6_import_item(_es6_module, 'spline_multires', 'BoundPoint');
  var MultiResLayer=es6_import_item(_es6_module, 'spline_multires', 'MultiResLayer');
  var compose_id=es6_import_item(_es6_module, 'spline_multires', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, 'spline_multires', 'decompose_id');
  var has_multires=es6_import_item(_es6_module, 'spline_multires', 'has_multires');
  var iterpoints=es6_import_item(_es6_module, 'spline_multires', 'iterpoints');
  var $vec_n_Kr_exec;
  var CreateMResPoint=_ESClass("CreateMResPoint", SplineLocalToolOp, [function CreateMResPoint(seg, co) {
    SplineLocalToolOp.call(this, "create_mres_point", "Add Detail Point", "", -1);
    if (seg!=undefined) {
        this.inputs.segment.set_data(typeof seg!="number" ? seg.eid : seg);
    }
    if (co!=undefined) {
        this.inputs.co.set_data(co);
    }
  }, function exec(ctx) {
    var spline=ctx.spline;
    var level=this.inputs.level.data;
    console.log("Add mres point! yay!");
    ensure_multires(spline);
    var seg=spline.eidmap[this.inputs.segment.data];
    var co=this.inputs.co.data;
    var flag=MResFlags.SELECT;
    var mr=seg.cdata.get_layer(MultiResLayer);
    var __iter_seg2=__get_iter(spline.segments);
    var seg2;
    while (1) {
      var __ival_seg2=__iter_seg2.next();
      if (__ival_seg2.done) {
          break;
      }
      seg2 = __ival_seg2.value;
      var mr2=seg2.cdata.get_layer(MultiResLayer);
      var __iter_p2=__get_iter(mr2.points(level));
      var p2;
      while (1) {
        var __ival_p2=__iter_p2.next();
        if (__ival_p2.done) {
            break;
        }
        p2 = __ival_p2.value;
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
        $vec_n_Kr_exec.zero().load(co).sub(cp[0]);
        var n=seg.normal(s);
        t*=Math.sign(n.dot($vec_n_Kr_exec));
        p.offset[0] = $vec_n_Kr_exec[0];
        p.offset[1] = $vec_n_Kr_exec[1];
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
  }]);
  var $vec_n_Kr_exec=new Vector3();
  _es6_module.add_class(CreateMResPoint);
  CreateMResPoint = _es6_module.add_export('CreateMResPoint', CreateMResPoint);
  CreateMResPoint.inputs = {segment: new IntProperty(0), co: new Vec3Property(), level: new IntProperty(0)}
});
es6_module_define('multires_selectops', ["spline_editops", "toolprops", "spline_multires", "spline", "toolops_api", "J3DIMath", "spline_types", "spline_draw"], function _multires_selectops_module(_es6_module) {
  "use strict";
  es6_import(_es6_module, 'J3DIMath');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var CollectionProperty=es6_import_item(_es6_module, 'toolprops', 'CollectionProperty');
  var BoolProperty=es6_import_item(_es6_module, 'toolprops', 'BoolProperty');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var Vec3Property=es6_import_item(_es6_module, 'toolprops', 'Vec3Property');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, 'toolops_api', 'ModalStates');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var RecalcFlags=es6_import_item(_es6_module, 'spline_types', 'RecalcFlags');
  var RestrictFlags=es6_import_item(_es6_module, 'spline', 'RestrictFlags');
  var Spline=es6_import_item(_es6_module, 'spline', 'Spline');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var redo_draw_sort=es6_import_item(_es6_module, 'spline_draw', 'redo_draw_sort');
  var SplineLocalToolOp=es6_import_item(_es6_module, 'spline_editops', 'SplineLocalToolOp');
  var ensure_multires=es6_import_item(_es6_module, 'spline_multires', 'ensure_multires');
  var has_multires=es6_import_item(_es6_module, 'spline_multires', 'has_multires');
  var MResFlags=es6_import_item(_es6_module, 'spline_multires', 'MResFlags');
  var compose_id=es6_import_item(_es6_module, 'spline_multires', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, 'spline_multires', 'decompose_id');
  var BoundPoint=es6_import_item(_es6_module, 'spline_multires', 'BoundPoint');
  var MultiResLayer=es6_import_item(_es6_module, 'spline_multires', 'MultiResLayer');
  var SelectOpBase=_ESClass("SelectOpBase", ToolOp, [function SelectOpBase(actlevel, uiname, description, icon) {
    ToolOp.call(this, undefined, uiname, description, icon);
    if (actlevel!=undefined)
      this.inputs.level.set_data(actlevel);
  }, function can_call(ctx) {
    var spline=ctx.spline;
    return has_multires(spline);
  }, function undo_pre(ctx) {
    var ud=this._undo = [];
    this._undo_level = this.inputs.level.data;
    var spline=ctx.spline;
    var actlayer=spline.layerset.active;
    var level=this.inputs.level.data;
    if (!has_multires(spline))
      return ;
    var __iter_seg=__get_iter(spline.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      if (seg.hidden)
        continue;
      if (!(actlayer.id in seg.layers))
        continue;
      var mr=seg.cdata.get_layer(MultiResLayer);
      var __iter_p=__get_iter(mr.points(level));
      var p;
      while (1) {
        var __ival_p=__iter_p.next();
        if (__ival_p.done) {
            break;
        }
        p = __ival_p.value;
        if (p.flag&MResFlags.SELECT)
          ud.push(compose_id(seg.eid, p.id));
      }
    }
    window.redraw_viewport();
  }, function undo(ctx) {
    var spline=ctx.spline;
    var actlayer=spline.layerset.active;
    var level=this._undo_level;
    if (!has_multires(spline))
      return ;
    var __iter_seg=__get_iter(spline.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      if (seg.hidden)
        continue;
      if (!(actlayer.id in seg.layers))
        continue;
      var mr=seg.cdata.get_layer(MultiResLayer);
      var __iter_p=__get_iter(mr.points(level));
      var p;
      while (1) {
        var __ival_p=__iter_p.next();
        if (__ival_p.done) {
            break;
        }
        p = __ival_p.value;
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
  }]);
  _es6_module.add_class(SelectOpBase);
  SelectOpBase.inputs = {level: new IntProperty(0)}
  var ToggleSelectAll=_ESClass("ToggleSelectAll", SelectOpBase, [function ToggleSelectAll(actlevel) {
    if (actlevel==undefined) {
        actlevel = 0;
    }
    SelectOpBase.call(this, actlevel, "Select All", "Select all/none");
  }, function can_call(ctx) {
    var spline=ctx.spline;
    return has_multires(spline);
  }, function exec(ctx) {
    var spline=ctx.spline;
    var actlayer=spline.layerset.active;
    var level=this.inputs.level.data;
    if (!has_multires(spline))
      return ;
    var totsel=0;
    var __iter_seg=__get_iter(spline.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      if (seg.hidden)
        continue;
      if (!(actlayer.id in seg.layers))
        continue;
      var mr=seg.cdata.get_layer(MultiResLayer);
      var __iter_p=__get_iter(mr.points(level));
      var p;
      while (1) {
        var __ival_p=__iter_p.next();
        if (__ival_p.done) {
            break;
        }
        p = __ival_p.value;
        if (p.flag&MResFlags.HIDE)
          continue;
        totsel+=p.flag&MResFlags.SELECT;
      }
    }
    var __iter_seg=__get_iter(spline.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      if (seg.hidden)
        continue;
      if (!(actlayer.id in seg.layers))
        continue;
      var mr=seg.cdata.get_layer(MultiResLayer);
      var __iter_p=__get_iter(mr.points(level));
      var p;
      while (1) {
        var __ival_p=__iter_p.next();
        if (__ival_p.done) {
            break;
        }
        p = __ival_p.value;
        if (p.flag&MResFlags.HIDE)
          continue;
        if (totsel)
          p.flag&=~MResFlags.SELECT;
        else 
          p.flag|=MResFlags.SELECT;
      }
    }
  }]);
  _es6_module.add_class(ToggleSelectAll);
  ToggleSelectAll = _es6_module.add_export('ToggleSelectAll', ToggleSelectAll);
  ToggleSelectAll.inputs = {level: new IntProperty(0)}
  var SelectOneOp=_ESClass("SelectOneOp", SelectOpBase, [function SelectOneOp(pid, unique, mode, level) {
    if (pid==undefined) {
        pid = undefined;
    }
    if (unique==undefined) {
        unique = true;
    }
    if (mode==undefined) {
        mode = true;
    }
    if (level==undefined) {
        level = 0;
    }
    SelectOpBase.call(this, level, "Select One", "select one element");
    this.inputs.unique.set_data(unique);
    this.inputs.state.set_data(mode);
    if (pid!=undefined)
      this.inputs.pid.set_data(pid);
  }, function exec(ctx) {
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
        var __iter_seg2=__get_iter(spline.segments);
        var seg2;
        while (1) {
          var __ival_seg2=__iter_seg2.next();
          if (__ival_seg2.done) {
              break;
          }
          seg2 = __ival_seg2.value;
          if (seg2.hidden)
            continue;
          if (!(actlayer.id in seg2.layers))
            continue;
          var mr2=seg2.cdata.get_layer(MultiResLayer);
          var __iter_p2=__get_iter(mr2.points(level));
          var p2;
          while (1) {
            var __ival_p2=__iter_p2.next();
            if (__ival_p2.done) {
                break;
            }
            p2 = __ival_p2.value;
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
  }]);
  _es6_module.add_class(SelectOneOp);
  SelectOneOp = _es6_module.add_export('SelectOneOp', SelectOneOp);
  SelectOneOp.inputs = ToolOp.inherit_inputs(SelectOpBase, {pid: new IntProperty(-1), state: new BoolProperty(true), set_active: new BoolProperty(true), unique: new BoolProperty(true), level: new IntProperty(0)});
});
es6_module_define('multires_transdata', ["transdata", "mathlib", "selectmode", "spline_multires"], function _multires_transdata_module(_es6_module) {
  "use strict";
  var SelMask=es6_import_item(_es6_module, 'selectmode', 'SelMask');
  var compose_id=es6_import_item(_es6_module, 'spline_multires', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, 'spline_multires', 'decompose_id');
  var has_multires=es6_import_item(_es6_module, 'spline_multires', 'has_multires');
  var ensure_multires=es6_import_item(_es6_module, 'spline_multires', 'ensure_multires');
  var MultiResLayer=es6_import_item(_es6_module, 'spline_multires', 'MultiResLayer');
  var iterpoints=es6_import_item(_es6_module, 'spline_multires', 'iterpoints');
  var MResFlags=es6_import_item(_es6_module, 'spline_multires', 'MResFlags');
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var TransDataType=es6_import_item(_es6_module, 'transdata', 'TransDataType');
  var TransDataItem=es6_import_item(_es6_module, 'transdata', 'TransDataItem');
  var $co_RB94_apply;
  var $co_XnLs_calc_draw_aabb;
  var $co2_48TJ_calc_draw_aabb;
  var $co__LJE_aabb;
  var MResTransData=_ESClass("MResTransData", TransDataType, [_ESClass.static(function gen_data(ctx, td, data) {
    var doprop=td.doprop;
    var proprad=td.propradius;
    var spline=ctx.spline;
    var actlayer=spline.layerset.active;
    if (!has_multires(spline))
      return ;
    var actlevel=spline.actlevel;
    var __iter_seg=__get_iter(spline.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      if (!(actlayer.id in seg.layers))
        continue;
      if (seg.hidden)
        continue;
      var mr=seg.cdata.get_layer(MultiResLayer);
      var __iter_p=__get_iter(mr.points(actlevel));
      var p;
      while (1) {
        var __ival_p=__iter_p.next();
        if (__ival_p.done) {
            break;
        }
        p = __ival_p.value;
        if (!(p.flag&MResFlags.SELECT))
          continue;
        p = mr.get(p.id, true);
        var co=new Vector3(p);
        co[2] = 0.0;
        var td=new TransDataItem(p, MResTransData, co);
        data.push(td);
      }
    }
  }), _ESClass.static(function apply(ctx, td, item, mat, w) {
    var p=item.data;
    if (w==0.0)
      return ;
    $co_RB94_apply.load(item.start_data);
    $co_RB94_apply[2] = 0.0;
    $co_RB94_apply.multVecMatrix(mat);
    $co_RB94_apply.sub(item.start_data).mulScalar(w).add(item.start_data);
    p[0] = $co_RB94_apply[0];
    p[1] = $co_RB94_apply[1];
    p.recalc_offset(ctx.spline);
    var seg=ctx.spline.eidmap[p.seg];
    p.mr.recalc_wordscos(seg);
  }), _ESClass.static(function undo_pre(ctx, td, undo_obj) {
    var ud=[];
    var spline=ctx.spline;
    var actlayer=spline.layerset.active;
    var doprop=td.doprop;
    if (!has_multires(spline))
      return ;
    var __iter_seg=__get_iter(spline.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      if (seg.hidden)
        continue;
      if (!(actlayer.id in seg.layers))
        continue;
      var mr=seg.cdata.get_layer(MultiResLayer);
      var __iter_p=__get_iter(mr.points);
      var p;
      while (1) {
        var __ival_p=__iter_p.next();
        if (__ival_p.done) {
            break;
        }
        p = __ival_p.value;
        if (!doprop&&!(p.flag&MResFlags.SELECT))
          continue;
        ud.push(compose_id(seg.eid, p.id));
        ud.push(p[0]);
        ud.push(p[1]);
      }
    }
    undo_obj.mr_undo = ud;
  }), _ESClass.static(function undo(ctx, undo_obj) {
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
  }), _ESClass.static(function update(ctx, td) {
  }), _ESClass.static(function calc_prop_distances(ctx, td, data) {
  }), _ESClass.static(function calc_draw_aabb(ctx, td, minmax) {
    $co_XnLs_calc_draw_aabb.zero();
    var pad=15;
    function do_minmax(co) {
      $co2_48TJ_calc_draw_aabb[0] = co[0]-pad;
      $co2_48TJ_calc_draw_aabb[1] = co[1]-pad;
      minmax.minmax($co2_48TJ_calc_draw_aabb);
      $co2_48TJ_calc_draw_aabb[0]+=pad*2.0;
      $co2_48TJ_calc_draw_aabb[1]+=pad*2.0;
      minmax.minmax($co2_48TJ_calc_draw_aabb);
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
        $co_XnLs_calc_draw_aabb[0] = t.data[0];
        $co_XnLs_calc_draw_aabb[1] = t.data[1];
        do_minmax($co_XnLs_calc_draw_aabb);
        $co_XnLs_calc_draw_aabb[0]-=t.data.offset[0];
        $co_XnLs_calc_draw_aabb[1]-=t.data.offset[1];
        do_minmax($co_XnLs_calc_draw_aabb);
    }
  }), _ESClass.static(function aabb(ctx, td, item, minmax, selected_only) {
    $co__LJE_aabb.zero();
    for (var i=0; i<td.data.length; i++) {
        var t=td.data[i];
        if (t.type!==MResTransData)
          continue;
        $co__LJE_aabb[0] = t.data[0];
        $co__LJE_aabb[1] = t.data[1];
        minmax.minmax($co__LJE_aabb);
    }
  }), function MResTransData() {
    TransDataType.apply(this, arguments);
  }]);
  var $co_RB94_apply=new Vector3();
  var $co_XnLs_calc_draw_aabb=new Vector3();
  var $co2_48TJ_calc_draw_aabb=[0, 0, 0];
  var $co__LJE_aabb=new Vector3();
  _es6_module.add_class(MResTransData);
  MResTransData = _es6_module.add_export('MResTransData', MResTransData);
  MResTransData.selectmode = SelMask.MULTIRES;
});
var g_theme;
es6_module_define('theme', ["struct"], function _theme_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  function darken(c, m) {
    for (var i=0; i<3; i++) {
        c[i]*=m;
    }
    return c;
  }
  darken = _es6_module.add_export('darken', darken);
  var BoxColor=_ESClass("BoxColor", [function BoxColor() {
    this.colors = undefined;
  }, _ESClass.static(function fromSTRUCT(reader) {
    return {}
  })]);
  _es6_module.add_class(BoxColor);
  BoxColor = _es6_module.add_export('BoxColor', BoxColor);
  BoxColor.STRUCT = "\n  BoxColor {\n  }\n";
  var BoxColor4=_ESClass("BoxColor4", BoxColor, [function BoxColor4(colors) {
    var clrs=this.colors = [[], [], [], []];
    if (colors==undefined)
      return ;
    for (var i=0; i<4; i++) {
        for (var j=0; j<4; j++) {
            clrs[i].push(colors[i][j]);
        }
    }
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new BoxColor4();
    reader(ret);
    return ret;
  })]);
  _es6_module.add_class(BoxColor4);
  BoxColor4 = _es6_module.add_export('BoxColor4', BoxColor4);
  BoxColor4.STRUCT = "\n  BoxColor4 {\n    colors : array(vec4);\n  }\n";
  var BoxWColor=_ESClass("BoxWColor", BoxColor, [function BoxWColor(color, weights) {
    if (color==undefined||weights==undefined)
      return ;
    this.color = [color[0], color[1], color[2], color[3]];
    this.weights = [weights[0], weights[1], weights[2], weights[3]];
  }, _ESClass.get(function colors() {
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
  }), _ESClass.static(function fromSTRUCT(reader) {
    var ret=new BoxWColor();
    reader(ret);
    return ret;
  })]);
  _es6_module.add_class(BoxWColor);
  BoxWColor = _es6_module.add_export('BoxWColor', BoxWColor);
  BoxWColor.STRUCT = "\n  BoxWColor {\n    color   : vec4;\n    weights : vec4;\n  }\n";
  var ThemePair=_ESClass("ThemePair", [function ThemePair(key, value) {
    this.key = key;
    this.val = value;
  }]);
  _es6_module.add_class(ThemePair);
  ThemePair = _es6_module.add_export('ThemePair', ThemePair);
  var ColorTheme=_ESClass("ColorTheme", [function ColorTheme(defobj) {
    this.colors = new hashtable();
    this.boxcolors = new hashtable();
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
    this.flat_colors = new GArray();
  }, function patch(newtheme) {
    if (newtheme==undefined)
      return ;
    var ks=new set(newtheme.colors.keys()).union(newtheme.boxcolors.keys());
    var __iter_k=__get_iter(this.colors);
    var k;
    while (1) {
      var __ival_k=__iter_k.next();
      if (__ival_k.done) {
          break;
      }
      k = __ival_k.value;
      if (!ks.has(k)) {
          newtheme.colors.set(k, this.colors.get(k));
      }
    }
    var __iter_k=__get_iter(this.boxcolors);
    var k;
    while (1) {
      var __ival_k=__iter_k.next();
      if (__ival_k.done) {
          break;
      }
      k = __ival_k.value;
      if (!ks.has(k)) {
          newtheme.boxcolors.set(k, this.boxcolors.get(k));
      }
    }
    newtheme.gen_colors();
  }, function gen_code() {
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
  }, function gen_colors() {
    var ret={}
    this.flat_colors = new GArray();
    var __iter_k=__get_iter(this.colors);
    var k;
    while (1) {
      var __ival_k=__iter_k.next();
      if (__ival_k.done) {
          break;
      }
      k = __ival_k.value;
      var c1=this.colors.get(k), c2=[0, 0, 0, 0];
      for (var i=0; i<4; i++) {
          c2[i] = c1[i];
      }
      ret[k] = c2;
      this.flat_colors.push([k, c1]);
    }
    var __iter_k=__get_iter(this.boxcolors);
    var k;
    while (1) {
      var __ival_k=__iter_k.next();
      if (__ival_k.done) {
          break;
      }
      k = __ival_k.value;
      ret[k] = this.boxcolors.get(k).colors;
      this.flat_colors.push([k, this.boxcolors.get(k)]);
    }
    return ret;
  }, _ESClass.static(function fromSTRUCT(reader) {
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
  })]);
  _es6_module.add_class(ColorTheme);
  ColorTheme = _es6_module.add_export('ColorTheme', ColorTheme);
  ColorTheme.STRUCT = "\n  ColorTheme {\n    colorkeys : array(string) | obj.colors.keys();\n    colorvals : array(vec4) | obj.colors.values();\n    boxkeys : array(string) | obj.boxcolors.keys();\n    boxvals : array(abstract(BoxColor)) | obj.boxcolors.values();\n  }\n";
  window.menu_text_size = IsMobile ? 14 : 14;
  window.default_ui_font_size = 16;
  window.ui_hover_time = 800;
  function ui_weight_clr(clr, weights) {
    return new BoxWColor(clr, weights);
  }
  ui_weight_clr = _es6_module.add_export('ui_weight_clr', ui_weight_clr);
  window.uicolors = {}
  window.colors3d = {}
  var Theme=_ESClass("Theme", [function Theme(ui, view2d) {
    this.ui = ui;
    this.view2d = view2d;
  }, function patch(theme) {
    this.ui.patch(theme.ui);
  }, function gen_code() {
    var s='"use strict";\n/*auto-generated file*/\nvar UITheme = '+this.ui.gen_code()+"\n";
    return s;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new Theme();
    reader(ret);
    return ret;
  }), function gen_globals() {
    
    uicolors = this.ui.gen_colors();
  }]);
  _es6_module.add_class(Theme);
  Theme = _es6_module.add_export('Theme', Theme);
  Theme.STRUCT = "\n  Theme {\n    ui     : ColorTheme;\n    view2d : ColorTheme;\n  }\n";
  
  window.init_theme = function() {
    window.g_theme = new Theme(window.UITheme, window.View2DTheme);
    window.g_theme.gen_globals();
  }
});
es6_module_define('theme_def', ["theme"], function _theme_def_module(_es6_module) {
  "use strict";
  var ColorTheme=es6_import_item(_es6_module, 'theme', 'ColorTheme');
  var ui_weight_clr=es6_import_item(_es6_module, 'theme', 'ui_weight_clr');
  var BoxColor4=es6_import_item(_es6_module, 'theme', 'BoxColor4');
  function uniformbox4(clr) {
    return new BoxColor4([clr, clr, clr, clr]);
  }
  window.UITheme = new ColorTheme({"ErrorText": [1, 0.20000000298023224, 0.20000000298023224, 0.8899999856948853], "ListBoxText": [0.20000000298023224, 0.20000000298023224, 0.20000000298023224, 1], "Highlight": uniformbox4([0.56862, 0.7882, 0.9602, 1.0]), "MenuHighlight": [0.56862, 0.7882, 0.9602, 1.0], "RadialMenu": [1, 0, 0, 1], "RadialMenuHighlight": [0.7831560373306274, 0.7664570808410645, 0.3468262255191803, 0.7717778086662292], "DefaultLine": [0.4163331985473633, 0.3746998906135559, 0.3746998906135559, 1], "SelectLine": [0.699999988079071, 0.699999988079071, 0.699999988079071, 1], "Check": [0.8999999761581421, 0.699999988079071, 0.4000000059604645, 1], "Arrow": [0.4000000059604645, 0.4000000059604645, 0.4000000059604645, 1], "DefaultText": [0, 0, 0, 1], "BoxText": [0, 0, 0, 1], "HotkeyText": [0.43986162543296814, 0.43986162543296814, 0.43986162543296814, 1], "HighlightCursor": [0.8999999761581421, 0.8999999761581421, 0.8999999761581421, 0.875], "TextSelect": [0.4000000059604645, 0.4000000059604645, 0.4000000059604645, 0.75], "TextEditCursor": [0.10000000149011612, 0.10000000149011612, 0.10000000149011612, 1], "TextBoxHighlight": [0.5270000100135803, 0.5270000100135803, 0.5270000100135803, 1], "MenuSep": [0.6901277303695679, 0.6901277303695679, 0.6901277303695679, 1], "MenuBorder": [0.6499999761581421, 0.6499999761581421, 0.6499999761581421, 1], "RadialMenuSep": [0.10000000149011612, 0.20000000298023224, 0.20000000298023224, 1], "TabPanelOutline": [0.4, 0.4, 0.4, 1.0], "TabPanelBG": [0.78, 0.78, 0.78, 1.0], "ActiveTab": [0.78, 0.78, 0.78, 1.0], "HighlightTab": [0.56862, 0.7882, 0.9602, 0.9], "InactiveTab": [0.6, 0.6, 0.6, 1.0], "TabText": [0.0, 0.0, 0.0, 1.0], "IconBox": [1, 1, 1, 0.17968888580799103], "HighlightIcon": [0.30000001192092896, 0.8149344325065613, 1, 0.21444444358348846], "MenuText": [0.10000000149011612, 0.10000000149011612, 0.10000000149011612, 1], "MenuTextHigh": [0.9330000281333923, 0.9330000281333923, 0.9330000281333923, 1], "PanelText": [0, 0, 0, 1], "DialogText": [0.05000003054738045, 0.05000000447034836, 0.05000000447034836, 1], "DialogBorder": [0.40000000298023225, 0.4000000298023224, 0.40000000298023225, 1], "DisabledBox": [0.5000000029802323, 0.5000000029802323, 0.5000000029802323, 1], "IconCheckBG": [0.6879922747612, 0.6879922747612, 0.6879922747612, 1], "IconCheckSet": [0.6, 0.6, 0.6, 1], "IconCheckUnset": [0.44641016151377544, 0.44641016151377544, 0.44641016151377544, 1], "NoteBox": ui_weight_clr([0.8, 0.8, 0.8, 1.0], [0.8, 0.8, 0.8, 1.0]), "Box": ui_weight_clr([0.94, 0.94, 0.94, 1.0], [0.8, 0.8, 0.8, 1.0]), "HoverHint": ui_weight_clr([1, 0.9769999980926514, 0.8930000066757202, 0.8999999761581421], [0.8999999761581421, 0.8999999761581421, 1, 1]), "ErrorBox": ui_weight_clr([1, 0.30000001192092896, 0.20000000298023224, 1], [1, 1, 1, 1]), "ErrorTextBG": ui_weight_clr([1, 1, 1, 1], [0.8999999761581421, 0.8999999761581421, 1, 1]), "ShadowBox": ui_weight_clr([0, 0, 0, 0.10000000149011612], [1, 1, 1, 1]), "ProgressBar": ui_weight_clr([0.4000000059604645, 0.7300000190734863, 0.8999999761581421, 0.8999999761581421], [0.75, 0.75, 1, 1]), "ProgressBarBG": ui_weight_clr([0.699999988079071, 0.699999988079071, 0.699999988079071, 0.699999988079071], [1, 1, 1, 1]), "WarningBox": ui_weight_clr([1, 0.800000011920929, 0.10000000149011612, 0.8999999761581421], [0.699999988079071, 0.800000011920929, 1.0499999523162842, 1]), "ListBoxBG": ui_weight_clr([0.94, 0.94, 0.94, 1.0], [0.94, 0.94, 0.94, 1.0]), "InvBox": ui_weight_clr([0.6, 0.6, 0.6, 1.0], [0.6, 0.6, 0.6, 1.0]), "HLightBox": uniformbox4([0.56862, 0.7882, 0.9602, 1.0]), "ActivePanel": ui_weight_clr([0.800000011920929, 0.4000000059604645, 0.30000001192092896, 0.8999999761581421], [1, 1, 1, 1]), "CollapsingPanel": ui_weight_clr([0.687468421459198, 0.687468421459198, 0.687468421459198, 1], [1, 1, 1, 1]), "SimpleBox": ui_weight_clr([0.94, 0.94, 0.94, 1.0], [0.94, 0.94, 0.94, 1.0]), "DialogBox": ui_weight_clr([0.7269999980926514, 0.7269999980926514, 0.7269999980926514, 1], [1, 1, 1, 1]), "DialogTitle": ui_weight_clr([0.6299999952316284, 0.6299999952316284, 0.6299999952316284, 1], [1, 1, 1, 1]), "MenuBox": ui_weight_clr([0.9200000166893005, 0.9200000166893005, 0.9200000166893005, 1], [1, 1, 1, 1]), "TextBox": ui_weight_clr([0.800000011920929, 0.800000011920929, 0.800000011920929, 0.8999999761581421], [1, 1, 1, 1]), "TextBoxInv": ui_weight_clr([0.699999988079071, 0.699999988079071, 0.699999988079071, 1], [0.699999988079071, 0.699999988079071, 0.699999988079071, 1]), "MenuLabel": ui_weight_clr([0.9044828414916992, 0.8657192587852478, 0.8657192587852478, 0.24075555801391602], [0.6000000238418579, 0.6000000238418579, 0.6000000238418579, 0.8999999761581421]), "MenuLabelInv": ui_weight_clr([0.75, 0.75, 0.75, 0.47111111879348755], [1, 1, 0.9410666823387146, 1]), "ScrollBG": ui_weight_clr([0.800000011920929, 0.800000011920929, 0.800000011920929, 1], [1, 1, 1, 1]), "ScrollBar": ui_weight_clr([0.5919697284698486, 0.5919697284698486, 0.5919697284698486, 1], [1, 1, 1, 1]), "ScrollBarHigh": ui_weight_clr([0.6548083424568176, 0.6548083424568176, 0.6548083424568176, 1], [1, 1, 1, 1]), "ScrollButton": ui_weight_clr([0.800000011920929, 0.800000011920929, 0.800000011920929, 1], [1, 1, 1, 1]), "ScrollButtonHigh": ui_weight_clr([0.75, 0.75, 0.75, 1], [1, 1, 1, 1]), "ScrollInv": ui_weight_clr([0.4000000059604645, 0.4000000059604645, 0.4000000059604645, 1], [1, 1, 1, 1]), "IconInv": ui_weight_clr([0.48299384117126465, 0.5367956161499023, 0.8049896955490112, 0.4000000059604645], [1, 1, 1, 1])});
  window.View2DTheme = new ColorTheme({"Background": [1, 1, 1, 1], "ActiveObject": [0.800000011920929, 0.6000000238418579, 0.30000001192092896, 1], "Selection": [0.699999988079071, 0.4000000059604645, 0.10000000149011612, 1], "GridLineBold": [0.38, 0.38, 0.38, 1.0], "GridLine": [0.5, 0.5, 0.5, 1.0], "AxisX": [0.9, 0.0, 0.0, 1.0], "AxisY": [0.0, 0.9, 0.0, 1.0], "AxisZ": [0.0, 0.0, 0.9, 1.0]});
});
es6_module_define('UIElement', ["toolprops", "mathlib", "events"], function _UIElement_module(_es6_module) {
  es6_import(_es6_module, 'events');
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var aabb_isect_2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_2d');
  var EventHandler=es6_import_item(_es6_module, 'events', 'EventHandler');
  var charmap=es6_import_item(_es6_module, 'events', 'charmap');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var UIFlags={ENABLED: 1, HIGHLIGHT: 2, FOCUS: 4, GREYED: 8, REDERROR: 16, WARNING: 32, USE_PATH: 64, NO_RECALC: 128, FLASH: (16|32), SKIP_DRAW: 256, HAS_PAN: 512, USE_PAN: 1024, PAN_CANVAS_MAT: 2048, IS_CANVAS_ROOT: 4096, NO_FRAME_CACHE: (1<<14), INVISIBLE: (1<<15), IGNORE_PAN_BOUNDS: (1<<16), BLOCK_REPAINT: (1<<17), NO_VELOCITY_PAN: (1<<18)}
  UIFlags = _es6_module.add_export('UIFlags', UIFlags);
  var PackFlags={INHERIT_HEIGHT: 1, INHERIT_WIDTH: 2, ALIGN_RIGHT: 4, ALIGN_LEFT: 8, ALIGN_CENTER: 16, ALIGN_BOTTOM: 32, IGNORE_LIMIT: 64, NO_REPACK: 128, UI_DATAPATH_IGNORE: 256, USE_ICON: 1024|2048, USE_SMALL_ICON: 1024, USE_LARGE_ICON: 2048, ENUM_STRIP: 4096, NO_AUTO_SPACING: 8192, ALIGN_CENTER_Y: 16384, ALIGN_CENTER_X: 32768, FLIP_TABSTRIP: 65536, NO_LEAD_SPACING: (1<<17), NO_TRAIL_SPACING: (1<<18), KEEP_SIZE: (1<<19), _KEEPSIZE: ((1<<19)|128), ALIGN_TOP: (1<<20), CALC_NEGATIVE_PAN: (1<<21), PAN_X_ONLY: (1<<22), PAN_Y_ONLY: (1<<23), VERTICAL: (1<<24), COLOR_BUTTON_ONLY: (1<<25)}
  PackFlags = _es6_module.add_export('PackFlags', PackFlags);
  var CanvasFlags={NOT_ROOT: 1, NO_PROPEGATE: 2}
  CanvasFlags = _es6_module.add_export('CanvasFlags', CanvasFlags);
  window.CanvasFlags = CanvasFlags;
  var _ui_element_id_gen=1;
  function open_mobile_keyboard(e, on_close) {
    if (on_close==undefined) {
        on_close = function() {
        };
    }
    if (IsMobile||DEBUG.screen_keyboard)
      call_keyboard(e, on_close);
  }
  open_mobile_keyboard = _es6_module.add_export('open_mobile_keyboard', open_mobile_keyboard);
  function close_mobile_keyboard(e) {
    if (IsMobile||DEBUG.screen_keyboard)
      end_keyboard(e);
  }
  close_mobile_keyboard = _es6_module.add_export('close_mobile_keyboard', close_mobile_keyboard);
  var $pos2_gOhq_inrect_2d_button=new Vector2();
  var $size2_6STe_inrect_2d_button=new Vector2();
  function inrect_2d_button(p, pos, size) {
    if (g_app_state.was_touch) {
        $pos2_gOhq_inrect_2d_button.load(pos);
        $size2_6STe_inrect_2d_button.load(size);
        $pos2_gOhq_inrect_2d_button.subScalar(fuzzy_ui_press_hotspot);
        $size2_6STe_inrect_2d_button.addScalar(fuzzy_ui_press_hotspot*2.0);
        return inrect_2d(p, $pos2_gOhq_inrect_2d_button, $size2_6STe_inrect_2d_button);
    }
    else {
      return inrect_2d(p, pos, size);
    }
  }
  inrect_2d_button = _es6_module.add_export('inrect_2d_button', inrect_2d_button);
  var $empty_arr_FLfR_get_keymaps;
  var $pos_PFjJ_get_abs_pos;
  var $ret_jada_get_min_size;
  var UIElement=_ESClass("UIElement", EventHandler, [function UIElement(ctx, path, pos, size) {
    if (path==undefined) {
        path = undefined;
    }
    if (pos==undefined) {
        pos = undefined;
    }
    if (size==undefined) {
        size = undefined;
    }
    EventHandler.call(this);
    this.defunct = false;
    this._uiel_id = _ui_element_id_gen++;
    this.fake_push_modal = 0;
    this.description = "";
    this.dirty = [[0, 0], [0, 0]];
    this.last_dirty = [[0, 0], [0, 0]];
    this.dirty_flag = 0;
    this.abspos = [0, 0];
    this._minsize = [0, 0];
    this._h12 = undefined;
    this.state = UIFlags.ENABLED;
    this.packflag = 0;
    this.data_path = path;
    this.ctx = ctx;
    this.parent = undefined;
    this.flash_timer_len = 650;
    this.status_timer = undefined;
    this.flash_ival = 20;
    this.last_flash = 0;
    this.pos = [0, 0];
    this.size = [0, 0];
    if (pos!=undefined) {
        this.pos[0] = pos[0];
        this.pos[1] = pos[1];
    }
    if (size!=undefined) {
        this.size[0] = size[0];
        this.size[1] = size[1];
    }
    this.recalc = 0;
    this.recalc_minsize = 0;
    if (path!=undefined) {
        this.state|=UIFlags.USE_PATH;
    }
  }, function disable() {
    if ((this.state&UIFlags.ENABLED))
      this.do_recalc();
    this.state&=~UIFlags.ENABLED;
  }, function enable() {
    if (!(this.state&UIFlags.ENABLED))
      this.do_recalc();
    this.state|=UIFlags.ENABLED;
  }, function get_keymaps() {
    return $empty_arr_FLfR_get_keymaps;
  }, _ESClass.symbol(Symbol.keystr, function keystr() {
    if (this._h12==undefined) {
        var n=this.constructor.name;
        if (n==undefined)
          n = "evil_ie_bug";
        this._h12 = n[2]+n[3]+n[n.length-2]+n[n.length-1]+this._uiel_id.toString();
    }
    return this._h12;
  }), function set_context(ctx) {
    this.ctx = ctx;
  }, function inc_flash_timer(color) {
    if (this.status_timer==undefined) {
        this.state&=~UIFlags.FLASH;
        return false;
    }
    if (this.status_timer.ready()) {
        this.status_timer = undefined;
        this.state&=~UIFlags.FLASH;
        return false;
    }
    return true;
  }, function do_flash_color(color) {
    this.inc_flash_timer();
    if (!(this.state&UIFlags.FLASH))
      return color;
    var color2;
    if (this.state&UIFlags.REDERROR)
      color2 = uicolors["ErrorBox"];
    else 
      if (this.state&UIFlags.WARNING)
      color2 = uicolors["WarningBox"];
    if (color==undefined)
      color = color2;
    if (color2==undefined)
      return undefined;
    var f=this.status_timer.normval;
    if (f<0.5)
      f*=2.0;
    else 
      (f = 1.0-f)*2.0;
    var alen=color.length;
    var l1=objcache.array(alen), l2=objcache.array(alen);
    l1.length = 0;
    l2.length = 0;
    if (typeof (color[0])=="number") {
        l1.push(color);
    }
    else {
      for (var i=0; i<color.length; i++) {
          l1.push(color[i]);
      }
    }
    if (typeof (color2[0])=="number") {
        l2.push(color2);
    }
    else {
      for (var i=0; i<color2.length; i++) {
          l2.push(color2[i]);
      }
    }
    while (l1.length<l2.length) {
      l1.push(l1[l1.length-1]);
    }
    while (l2.length<l1.length) {
      l2.push(l2[l2.length-1]);
    }
    var l3=objcache.array(l1.length);
    l3.length = 0;
    for (var i=0; i<l1.length; i++) {
        var clr=new Vector4(l1[i]);
        clr.interp(l2[i], f);
        l3.push(clr);
    }
    if (l3.length==1)
      return l3[0];
    else 
      return l3;
  }, function flash(status) {
    if (status==undefined) {
        status = UIFlags.REDERROR;
    }
    console.log("flash!", status);
    this.status_timer = new Timer(this.flash_timer_len);
    this.state|=status;
    this.do_recalc();
  }, function focus() {
    if (this.parent!=undefined)
      this.parent.focus(this);
  }, function get_abs_pos() {
    $pos_PFjJ_get_abs_pos[0] = this.pos[0];
    $pos_PFjJ_get_abs_pos[1] = this.pos[1];
    var p=this.parent;
    while (p!=undefined) {
      $pos_PFjJ_get_abs_pos[0]+=p.pos[0];
      $pos_PFjJ_get_abs_pos[1]+=p.pos[1];
      p = p.parent;
    }
    return $pos_PFjJ_get_abs_pos;
  }, function call_menu(menu, off, min_width) {
    if (off==undefined) {
        off = undefined;
    }
    if (min_width==undefined) {
        min_width = 20;
    }
    if (off==undefined) {
        off = [0, 0];
    }
    var frame;
    if (this.parent==undefined) {
        frame = this;
    }
    else {
      frame = this.parent;
    }
    this.abs_transform(off);
    while (frame.parent!=undefined) {
      frame = frame.parent;
    }
    ui_call_menu(menu, frame, off, false, min_width);
  }, function set_prop_data(data, undo_push) {
    if (undo_push==undefined) {
        undo_push = true;
    }
    if (this.path_is_bad)
      return ;
    var ctx=this.ctx;
    var setpath=this.setter_path!=undefined ? this.setter_path : this.data_path;
    var prop=ctx.api.get_prop_meta(ctx, this.data_path);
    if (prop.flag&TPropFlags.USE_UNDO)
      g_app_state.toolstack.exec_datapath(ctx, setpath, data, undo_push);
    else 
      ctx.api.set_prop(ctx, setpath, data);
  }, function get_prop_data() {
    var ctx=this.ctx;
    var bad=true, ret=undefined;
    try {
      ret = ctx.api.get_prop(ctx, this.data_path);
      bad = false;
    }
    catch (err) {
        if (DEBUG.ui_datapaths) {
            console.trace("Got error");
            print_stack(err);
        }
        ret = 0;
    }
    if (this.path_is_bad!=bad) {
        this.do_recalc();
    }
    this.path_is_bad = bad;
    if (bad)
      this.disable();
    else 
      this.enable();
    return ret;
  }, function get_prop_meta() {
    var ctx=this.ctx;
    return ctx.api.get_prop_meta(ctx, this.data_path);
  }, function do_recalc() {
    window.redraw_ui();
    if (this.state&UIFlags.BLOCK_REPAINT)
      return ;
    this.recalc = 1;
    this.recalc_minsize = 1;
    if (this.parent!=undefined)
      this.parent.do_recalc();
    else 
      if (DEBUG.complex_ui_recalc&&Math.random()>0.99)
      console.trace("leaf ui call");
  }, function abs_transform(pos) {
    var e=this;
    while (e!=undefined) {
      pos[0]+=e.pos[0];
      pos[1]+=e.pos[1];
      if ((e.state&UIFlags.HAS_PAN)) {
          pos[0]+=e.velpan.pan[0];
          pos[1]+=e.velpan.pan[1];
      }
      e = e.parent;
    }
  }, function push_modal(e) {
    if (e==undefined) {
        this.fake_push_modal++;
        this.parent.push_modal(this);
    }
    else {
      EventHandler.prototype.push_modal.call(this, e);
      if (this.parent!=undefined) {
          this.parent.push_modal(this);
      }
    }
  }, function pop_modal() {
    if (this.fake_push_modal) {
        this.fake_push_modal--;
        this.parent.pop_modal();
        return ;
    }
    EventHandler.prototype.pop_modal.call(this);
    if (this.parent!=undefined)
      this.parent.pop_modal();
  }, function get_canvas() {
    var frame=this;
    while (frame.parent!=undefined&&frame.canvas==undefined) {
      frame = frame.parent;
    }
    return frame.canvas;
  }, function is_canvas_root() {
    var ret=this.parent==undefined||(this.canvas!=undefined&&this.parent.get_canvas()!=this.canvas);
    ret = ret||this.state&UIFlags.IS_CANVAS_ROOT;
    ret = ret||__instance_of(this, ScreenArea);
    ret = ret||__instance_of(this, Area);
    ret = ret&&this.canvas!=undefined;
    ret = ret&&!(this.canvas.flag&CanvasFlags.NOT_ROOT);
    return ret;
  }, function get_hint() {
    if (this.description==""&&(this.state&UIFlags.USE_PATH)) {
        var prop=this.get_prop_meta();
        return prop.description!="" ? prop.description : undefined;
    }
    else {
      return this.description;
    }
  }, function start_pan(start_mpos, button, last_mpos) {
    if (button==undefined) {
        button = 0;
    }
    if (last_mpos==undefined) {
        last_mpos = undefined;
    }
    if (!(this.state&UIFlags.HAS_PAN)) {
        if (this.parent==undefined) {
            console.trace();
            console.log("Warning: UIFrame.start_pan: no parent frame with pan support");
        }
        else {
          if (start_mpos!=undefined) {
              start_mpos[0]+=this.pos[0];
              start_mpos[1]+=this.pos[1];
          }
          if (last_mpos!=undefined) {
              last_mpos[0]+=this.pos[0];
              last_mpos[1]+=this.pos[1];
          }
          this.parent.start_pan(start_mpos, button, last_mpos);
        }
    }
  }, function get_filedata() {
    return undefined;
  }, function load_filedata(map) {
  }, function get_uhash() {
    var s=this.constructor.name;
    if (s==undefined)
      s = "";
    if (this.data_path!=undefined) {
        s+=this.data_path;
    }
    if (this.parent!=undefined) {
        s = this.parent.get_uhash()+s;
    }
    return s;
  }, function on_tick() {
    if (time_ms()-this.last_flash>this.flash_ival&&(this.state&UIFlags.FLASH)) {
        this.do_recalc();
        this.last_flash = time_ms();
        this.inc_flash_timer();
    }
    EventHandler.prototype.on_tick.call(this);
  }, function on_keydown(event) {
  }, function on_keyup(event) {
  }, function on_mousemove(event) {
  }, function on_mousedown(event) {
  }, function on_mousewheel(event) {
  }, function on_mouseup(event) {
  }, function on_contextchange(event) {
  }, function update_data(ctx) {
  }, function cached_min_size(canvas, isVertical) {
    if (this.recalc_minsize) {
        this.recalc_minsize = 0;
        var ret=this.get_min_size(canvas, isVertical);
        this._minsize[0] = ret[0];
        this._minsize[1] = ret[1];
    }
    return this._minsize;
  }, function get_min_size(canvas, isvertical) {
    return $ret_jada_get_min_size;
  }, function build_draw(canvas, isvertical) {
  }, function on_active() {
  }, function on_inactive() {
  }, function pack(canvas, isvertical) {
  }, function gen_tooltip() {
  }, function on_add(parent) {
  }, function on_remove(parent) {
  }]);
  var $empty_arr_FLfR_get_keymaps=[];
  var $pos_PFjJ_get_abs_pos=[0, 0];
  var $ret_jada_get_min_size=[1, 1];
  _es6_module.add_class(UIElement);
  UIElement = _es6_module.add_export('UIElement', UIElement);
  var UIHoverBox=_ESClass("UIHoverBox", UIElement, [function UIHoverBox(ctx, text, is_modal, pos, size) {
    UIElement.call(this, ctx, undefined, pos, size);
    this.is_modal = is_modal;
    this.text = text;
    this.packflag|=PackFlags.NO_REPACK;
  }, function get_min_size(UICanvas, isVertical) {
    return this.size;
  }, function on_mousedown(event) {
    if (this.is_modal) {
        this.pop_modal();
        var mpos=[event.x, event.y];
        var p=this, lastp;
        while (p!=undefined) {
          lastp = p;
          mpos[0]+=p.pos[0];
          mpos[1]+=p.pos[1];
          p = p.parent;
        }
        this.parent.remove(this);
        this.parent.do_recalc();
        event.x = mpos[0];
        event.y = mpos[1];
        lastp._on_mousedown(event);
    }
  }, function _on_mousedown(event) {
    if (this.state&UIFlags.ENABLED)
      this.on_mousedown(event);
  }, function _on_mousemove(event) {
    if (this.state&UIFlags.ENABLED)
      this.on_mousemove(event);
  }, function _on_mouseup(event) {
    if (this.state&UIFlags.ENABLED)
      this.on_mouseup(event);
  }, function _on_keydown(event) {
    if (this.state&UIFlags.ENABLED)
      this.on_keydown(event);
  }, function _on_keyup(event) {
    if (this.state&UIFlags.ENABLED)
      this.on_keyup(event);
  }, function on_mousemove(event) {
    if (this.is_modal&&!inrect_2d([event.x, event.y], [0, 0], this.size)) {
        this.pop_modal();
        this.parent.remove(this);
        this.parent.do_recalc();
    }
  }, function build_draw(canvas, isVertical) {
    canvas.begin(this);
    canvas.shadow_box([0, 0], this.size);
    var size=IsMobile ? this.size : [this.size[0], this.size[1]];
    canvas.box([0, 0], size, uicolors["HoverHint"]);
    canvas.text([4, 7], this.text, uicolors["BoxText"]);
    canvas.end(this);
  }]);
  _es6_module.add_class(UIHoverBox);
  UIHoverBox = _es6_module.add_export('UIHoverBox', UIHoverBox);
  var UIHoverHint=_ESClass("UIHoverHint", UIElement, [function UIHoverHint(ctx, path, pos, size) {
    if (path==undefined) {
        path = undefined;
    }
    if (pos==undefined) {
        pos = undefined;
    }
    if (size==undefined) {
        size = undefined;
    }
    
    UIElement.call(this, ctx, path, pos, size);
    this.start_time = 0;
    this.hover_time = ui_hover_time;
    this.hovering = false;
  }, function start_hover() {
    this.start_time = time_ms();
    this.hovering = true;
  }, function stop_hover() {
    this.hovering = false;
  }, function on_hint(is_modal) {
    if (is_modal==undefined) {
        is_modal = true;
    }
    var hint=this.get_hint();
    console.log("hint: ", hint);
    if (!hint)
      return ;
    if (this.ctx==undefined)
      this.ctx = new Context();
    if (this.get_canvas()==undefined)
      return ;
    var size=new Vector2(this.get_canvas().textsize(hint));
    size.add([8.0, 12.0]);
    var pos=new Vector2([this.pos[0]+4, this.pos[1]-size[1]]);
    var hintbox=new UIHoverBox(this.ctx, hint, is_modal, pos, size);
    var abspos=[0, -size[1]];
    this.abs_transform(abspos);
    var screen=g_app_state.screen;
    var abspos2=[abspos[0], abspos[1]];
    if (abspos[1]<0) {
        abspos[1]+=size[1]+this.size[1];
    }
    abspos[0] = Math.min(Math.max(0, abspos[0]), screen.size[0]-hintbox.size[0]);
    abspos[1] = Math.min(Math.max(0, abspos[1]), screen.size[1]-hintbox.size[1]);
    hintbox.pos[0]+=abspos[0]-abspos2[0];
    hintbox.pos[1]+=abspos[1]-abspos2[1];
    is_modal = is_modal&&(g_app_state.screen.modalhandler==undefined);
    this.parent.add_floating(hintbox, is_modal);
    return hintbox;
  }, function on_active() {
    if (this.hovering) {
        this.start_hover();
    }
  }, function on_inactive() {
    this.hovering = false;
  }, function on_tick() {
    if (this.hovering&&time_ms()-this.start_time>=this.hover_time) {
        this.hovering = false;
        console.log("hint!");
        this.on_hint();
    }
  }]);
  _es6_module.add_class(UIHoverHint);
  UIHoverHint = _es6_module.add_export('UIHoverHint', UIHoverHint);
});
es6_module_define('UIFileData', ["struct"], function _UIFileData_module(_es6_module) {
  "use struct";
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var UIInt=_ESClass("UIInt", [function UIInt(val) {
    this.val = val;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var obj=new UIInt();
    reader(obj);
    return obj.val;
  })]);
  _es6_module.add_class(UIInt);
  UIInt = _es6_module.add_export('UIInt', UIInt);
  UIInt.STRUCT = "\n  UIInt {\n    val : int;\n  }\n";
  var UIFloat=_ESClass("UIFloat", [function UIFloat(val) {
    this.val = val;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var obj=new UIFloat();
    reader(obj);
    return obj.val;
  })]);
  _es6_module.add_class(UIFloat);
  UIFloat = _es6_module.add_export('UIFloat', UIFloat);
  UIFloat.STRUCT = "\n  UIFloat {\n    val : float;\n  }\n";
  var UIString=_ESClass("UIString", [function UIString(val) {
    this.val = val;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var obj=new UIString();
    reader(obj);
    return obj.val;
  })]);
  _es6_module.add_class(UIString);
  UIString = _es6_module.add_export('UIString', UIString);
  UIString.STRUCT = "\n  UIString {\n    val : string;\n  }\n";
  var UIFloatArray=_ESClass("UIFloatArray", [function UIFloatArray(val) {
    this.val = val;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var obj=new UIFloatArray();
    reader(obj);
    return obj.val;
  })]);
  _es6_module.add_class(UIFloatArray);
  UIFloatArray = _es6_module.add_export('UIFloatArray', UIFloatArray);
  UIFloatArray.STRUCT = "\n  UIFloatArray {\n    val : array(float);\n  }\n";
  var UIKeyPair=_ESClass("UIKeyPair", [function UIKeyPair(key, val) {
    this.key = key;
    this.val = val;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var obj=new UIKeyPair();
    reader(obj);
    return obj;
  }), function get_val() {
    is_num = (typeof (this.val)=="number"||__instance_of(this.val, Number));
    is_num = is_num||(typeof (this.val)=="boolean"||__instance_of(this.val, Boolean));
    if (is_num) {
        if (this.val==Math.floor(this.val))
          return new UIInt(this.val);
        else 
          return new UIFloat(this.val);
    }
    else 
      if (typeof (this.val)=="string"||__instance_of(this.val, String)) {
        return new UIString(this.val);
    }
    else 
      if (typeof (this.val)=="array"||__instance_of(this.val, Array)) {
        for (var i=0; i<this.val.length; i++) {
            var val=this.val[i];
            is_num = (typeof (val)=="number"||__instance_of(val, Number));
            is_num = is_num||(typeof (val)=="boolean"||__instance_of(val, Boolean));
            if (!is_num) {
                console.log("warning; could not serialize array as numeric array; will do object serialization instead.");
                return new UIStruct(this.val);
            }
        }
        return new UIFloatArray(this.val);
    }
    else 
      if (typeof (this.val)=="object") {
        return new UIStruct(this.val);
    }
    else {
      console.log("Warning; bad value passed to UIKeyVal; returning 0. . .");
      return new UIInt(0);
    }
  }]);
  _es6_module.add_class(UIKeyPair);
  UIKeyPair = _es6_module.add_export('UIKeyPair', UIKeyPair);
  UIKeyPair.STRUCT = "\n  UIKeyPair {\n    key : string;\n    val : abstract(Object) | obj.get_val();\n  }\n";
  var UIStruct=_ESClass("UIStruct", [function UIStruct(obj) {
    this.obj = obj;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var obj={}
    reader(obj);
    var keys=obj.obj;
    var ret={}
    for (var i=0; i<keys.length; i++) {
        var k=keys[i];
        ret[k.key] = k.val;
    }
    return ret;
  })]);
  _es6_module.add_class(UIStruct);
  UIStruct = _es6_module.add_export('UIStruct', UIStruct);
  UIStruct.STRUCT = "\n  UIStruct {\n    obj : iter(k, UIKeyPair) | new UIKeyPair(k, obj.obj[k]);\n  }\n";
  function test_ui_structs() {
    a = new UIStruct({a: 1, b: [1, 2, 3], c: "yay", d: 0.03, e: {a: [1, 2], b: 2}});
    var arr=[];
    istruct.write_object(arr, a);
    console.log(arr);
    var view=new DataView(new Uint8Array(arr).buffer);
    var ret=istruct.read_object(view, UIStruct);
    arr = LZString.compress(new Uint8Array(view.buffer));
    console.log(ret);
    console.log("- binlen", arr.length);
    console.log("-JSONlen", LZString.compress(JSON.stringify(a.obj)).length);
  }
});
es6_module_define('UICanvas', ["mathlib", "UIElement"], function _UICanvas_module(_es6_module) {
  "use strict";
  var rot2d=es6_import_item(_es6_module, 'mathlib', 'rot2d');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var $_mh;
  var $_swapt;
  var $arr4_window__box_process_clr=[0, 0, 0, 0];
  window._box_process_clr = function _box_process_clr(default_cs, clr) {
    var cs=default_cs;
    if (clr!=undefined) {
        if (typeof clr=="number") {
            var cs2=$arr4_window__box_process_clr;
            for (var i=0; i<4; i++) {
                cs2[i] = (($_mh = objcache.array(2)), ($_mh[0] = (cs[i][0])), ($_mh[1] = (cs[i][1])), ($_mh[2] = (cs[i][2])), ($_mh[3] = (cs[i][3])), $_mh);
                for (var j=0; j<4; j++) {
                    cs2[i]*=clr;
                }
            }
            cs = cs2;
        }
        else 
          if (typeof clr[0]=="number") {
            var cs=$arr4_window__box_process_clr;
            cs[0] = clr;
            cs[1] = clr;
            cs[2] = clr;
            cs[3] = clr;
        }
        else {
          cs = clr;
        }
    }
    return cs;
  }
  var $ret_RFnu_get_2d_canvas={}
  function get_2d_canvas() {
    if ($ret_RFnu_get_2d_canvas.canvas==undefined) {
        $ret_RFnu_get_2d_canvas.canvas = document.getElementById("canvas2d");
        $ret_RFnu_get_2d_canvas.ctx = _canvas2d_ctx;
    }
    return $ret_RFnu_get_2d_canvas;
  }
  get_2d_canvas = _es6_module.add_export('get_2d_canvas', get_2d_canvas);
  window.get_2d_canvas = get_2d_canvas;
  var $ret_ubtP_get_2d_canvas_2={}
  function get_2d_canvas_2() {
    if ($ret_ubtP_get_2d_canvas_2.canvas==undefined) {
        $ret_ubtP_get_2d_canvas_2.canvas = document.getElementById("canvas2d_work");
        $ret_ubtP_get_2d_canvas_2.ctx = _canvas2d_ctx_2;
    }
    return $ret_ubtP_get_2d_canvas_2;
  }
  get_2d_canvas_2 = _es6_module.add_export('get_2d_canvas_2', get_2d_canvas_2);
  window.get_2d_canvas_2 = get_2d_canvas_2;
  window._ui_canvas_2d_idgen = 1;
  var $temp_layer_idgen_Q0np_push_layer;
  var $black_KuvY_quad;
  var $grads_pVXQ_quad;
  var $mid_IVRi_colorfield;
  var $cache_lN9__box1;
  var $v1_O1rr_box1;
  var $v3_a8pc_box1;
  var $pairs_MDx2_box1;
  var $pos_JikP_text;
  var $v2_bNP1_box1;
  var $v4_I7Ys_box1;
  var UICanvas=_ESClass("UICanvas", [function UICanvas(viewport) {
    var c=get_2d_canvas();
    this.canvas = c.canvas;
    this.id = _ui_canvas_2d_idgen++;
    this.ctx = c.ctx;
    this.canvases = {}
    var ctx=c.ctx, fl=Math.floor;
    
    if (ctx.setFillColor==undefined) {
        ctx.setFillColor = function(r, g, b, a) {
          if (a==undefined)
            a = 1.0;
          this.fillStyle = "rgba("+fl(r*255)+","+fl(g*255)+","+fl(b*255)+","+a+")";
        };
    }
    if (ctx.setStrokeColor==undefined) {
        ctx.setStrokeColor = function(r, g, b, a) {
          if (a==undefined)
            a = 1.0;
          this.strokeStyle = "rgba("+fl(r*255)+","+fl(g*255)+","+fl(b*255)+","+a+")";
        };
    }
    this.layerstack = [];
    this.scissor_stack = [];
    this._lastclip = [[0, 0], [0, 0]];
    this.transmat = new Matrix4();
    this.trans_stack = [];
    this.raster = g_app_state.raster;
    this.global_matrix = new Matrix4();
    this.iconsheet = g_app_state.raster.iconsheet;
    this.iconsheet16 = g_app_state.raster.iconsheet16;
    this.viewport = viewport;
  }, function destroy() {
  }, function _css_color(c) {
    if (isNaN(c[0]))
      return "black";
    var s="rgba(";
    for (var i=0; i<3; i++) {
        if (i>0)
          s+=",";
        s+=Math.floor(c[i]*255);
    }
    s+=","+(c[3]==undefined ? "1.0" : c[3])+")";
    return s;
  }, function reset_canvases() {
    console.trace("reset_canvases called");
    for (var k in this.canvases) {
        document.body.removeChild(this.canvases[k]);
    }
    this.canvases = {}
  }, function kill_canvas(obj_or_id) {
    console.trace("kill called");
    var id=obj_or_id;
    if (typeof id=="object") {
        console.log(id);
        id = id[Symbol.keystr]();
    }
    var canvas=this.canvases[id];
    delete this.canvases[id];
    
    delete active_canvases[id];
    if (canvas!=undefined) {
        document.body.removeChild(canvas);
    }
  }, function get_canvas(obj_or_id, pos, size, zindex) {
    if (zindex==undefined) {
        zindex = 4;
    }
    var id=obj_or_id;
    if (typeof id=="object")
      id = id[Symbol.keystr]();
    var canvas;
    if (id in this.canvases) {
        canvas = this.canvases[id];
        canvas.is_blank = false;
    }
    else {
      console.trace("creating new canvas. . .");
      var canvas=document.createElement("canvas");
      canvas.id = "_canvas2d_"+id;
      document.body.appendChild(canvas);
      canvas.style["position"] = "absolute";
      canvas.style["left"] = "0px";
      canvas.style["top"] = "0px";
      canvas.style["z-index"] = ""+zindex;
      canvas.style["pointer-events"] = "none";
      canvas.width = this.canvas.width;
      canvas.height = this.canvas.height;
      canvas.ctx = canvas.getContext("2d");
      if (canvas.ctx.canvas==undefined) {
          canvas.ctx.canvas = canvas;
      }
      canvas.is_blank = true;
      this.canvases[id] = canvas;
      
      active_canvases[id] = [canvas, this];
    }
    if (parseInt(canvas.style["z-index"])!=zindex) {
        canvas.style["z-index"] = zindex;
    }
    if (canvas.width!=size[0]) {
        canvas.width = size[0];
    }
    if (canvas.height!=size[1]) {
        canvas.height = size[1];
    }
    if (canvas.style["left"]!=""+Math.floor(pos[0])+"px") {
        canvas.style["left"] = Math.floor(pos[0])+"px";
        canvas.is_blank = true;
    }
    var y=Math.floor(window.innerHeight-pos[1]-size[1]);
    if (canvas.style["top"]!=""+y+"px") {
        canvas.style["top"] = ""+y+"px";
        canvas.is_blank = true;
    }
    canvas.ctx.is_blank = canvas.is_blank;
    return canvas;
  }, function push_layer() {
    this.layerstack.push([this.canvas, this.ctx]);
    var canvas=document.createElement("canvas");
    canvas.id = "_temp_canvas2d_"+($temp_layer_idgen_Q0np_push_layer++);
    document.body.appendChild(canvas);
    canvas.style["position"] = "absolute";
    canvas.style["left"] = "0px";
    canvas.style["top"] = "0px";
    canvas.style["z-index"] = ""+(4+this.layerstack.length);
    canvas.style["pointer-events"] = "none";
    canvas.width = this.canvas.width;
    canvas.height = this.canvas.height;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }, function pop_layer() {
    if (this.layerstack.length==0) {
        console.trace("%cTHE SHEER EVIL OF IT!", "color:red");
        return ;
    }
    var item=this.layerstack.pop();
    document.body.removeChild(this.canvas);
    this.canvas = item[0];
    this.ctx = item[1];
  }, function on_draw(gl) {
  }, function set_viewport(viewport) {
    this.viewport = viewport;
  }, function clear(p, size) {
    var v=this.viewport;
    var canvas=this.canvas;
    var ctx=this.ctx;
    if (p==undefined) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
    }
    else {
      ctx.clearRect(p[0]+v[0][0], canvas.height-(v[0][1]+p[1]+size[1]), size[0], size[1]);
      ctx.beginPath();
      ctx.rect(p[0]+v[0][0], canvas.height-(v[0][1]+p[1]+size[1]), size[0], size[1]);
    }
  }, function reset() {
    var v=this.viewport;
    var canvas=this.canvas;
    var ctx=this.ctx;
  }, function clip(rect, vis_only) {
    if (vis_only==undefined) {
        vis_only = false;
    }
    var canvas=this.canvas;
    var ctx=this.ctx;
    rect[0] = new Vector2(rect[0]);
    rect[1] = new Vector2(rect[1]);
    var v=this.viewport;
    this._clip_to_viewport(rect[0], rect[1], v);
    ctx.fillStyle = Math.random()>0.5 ? "rgba(255,0,0,0.7)" : "rgba(0,255,0,0.7)";
    ctx.beginPath();
    ctx.rect(v[0][0]+rect[0][0], canvas.height-(v[0][1]+rect[0][1]+rect[1][1]), rect[1][0], rect[1][1]);
    ctx.closePath();
    if (vis_only)
      ctx.fill();
    else 
      ctx.clip();
  }, function root_start() {
    this.ctx.save();
  }, function root_end() {
    this.ctx.restore();
  }, function begin() {
  }, function end() {
  }, function frame_begin() {
  }, function frame_end() {
  }, function use_cache(item) {
  }, function has_cache(item) {
    return false;
  }, function remove_cache(item) {
  }, function on_resize(oldsize, newsize) {
  }, function invbox(pos, size, clr, r) {
    var cs=uicolors["InvBox"];
    cs = _box_process_clr(cs, clr);
    this.box(pos, size, cs, r);
  }, function simple_box(pos, size, clr, r) {
    if (clr==undefined) {
        clr = undefined;
    }
    if (r==undefined) {
        r = 2.0;
    }
    var cs=uicolors["SimpleBox"];
    cs = _box_process_clr(cs, clr);
    this.box(pos, size, cs, r);
  }, function hlightbox(pos, size, clr_mul, r) {
    var cs=uicolors["HLightBox"];
    if (clr_mul!==undefined&&typeof clr_mul=="number") {
        cs = [new Vector4(cs[0]), new Vector4(cs[1]), new Vector4(cs[2]), new Vector4(cs[3])];
        for (var i=0; i<4; i++) {
            for (var j=0; j<4; j++) {
                cs[i][j]*=clr_mul;
            }
        }
    }
    else 
      if (clr_mul!==undefined&&__instance_of(clr_mul, Array)) {
        if (typeof clr_mul[0]=="number") {
            cs = [clr_mul, clr_mul, clr_mul, clr_mul];
        }
        else {
          cs = [new Vector4(clr_mul[0]), new Vector4(clr_mul[1]), new Vector4(clr_mul[2]), new Vector4(clr_mul[3])];
        }
    }
    this.box(pos, size, cs, r);
  }, function box_outline(pos, size, clr, rfac) {
    this.box(pos, size, clr, rfac, true);
  }, function quad(v1, v2, v3, v4, c1, c2, c3, c4, horiz_gradient) {
    if (horiz_gradient==undefined) {
        horiz_gradient = false;
    }
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=g_app_state.raster.viewport;
    if (c1==undefined) {
        c1 = $black_KuvY_quad;
    }
    if (c2==undefined) {
        c2 = c1;
    }
    if (c3==undefined) {
        c3 = c2;
    }
    if (c4==undefined) {
        c4 = c3;
    }
    var m=this.transmat.$matrix;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var x=m.m41, y=m.m42;
    var hash="";
    for (var i=0; i<4; i++) {
        hash+=c1[i]+","+c2[i]+","+c3[i]+","+c4[i];
    }
    var grad;
    if (1||!(hash in $grads_pVXQ_quad)) {
        var min=[v1[0], v1[1]], max=[v1[0], v1[1]];
        for (var i=0; i<2; i++) {
            min[i] = Math.min(min[i], v1[i]);
            max[i] = Math.max(max[i], v1[i]);
            min[i] = Math.min(min[i], v2[i]);
            max[i] = Math.max(max[i], v2[i]);
            min[i] = Math.min(min[i], v3[i]);
            max[i] = Math.max(max[i], v3[i]);
            min[i] = Math.min(min[i], v4[i]);
            max[i] = Math.max(max[i], v4[i]);
        }
        min[0]+=x+v[0][0];
        max[0]+=x+v[0][0];
        min[1] = canvas.height-(min[1]+y+v[0][1]);
        max[1] = canvas.height-(max[1]+y+v[0][1]);
        var grad;
        if (isNaN(min[0])||isNaN(max[0])||isNaN(min[1])||isNaN(max[1])||isNaN(c1[0])||isNaN(c3[0])) {
            grad = "black";
        }
        else {
          try {
            if (horiz_gradient)
              grad = ctx.createLinearGradient(min[0], min[1]*0.5+max[1]*0.5, max[0], min[1]*0.5+max[1]*0.5);
            else 
              grad = ctx.createLinearGradient(min[0]*0.5+max[0]*0.5, min[1], min[0]*0.5+max[0]*0.5, max[1]);
            $grads_pVXQ_quad[hash] = grad;
            grad.addColorStop(0.0, this._css_color(c1));
            grad.addColorStop(1.0, this._css_color(c3));
          }
          catch (error) {
              print_stack(error);
              console.log("GRADIENT ERROR", min[0], min[1], max[0], max[1]);
          }
        }
    }
    else {
      grad = $grads_pVXQ_quad[hash];
    }
    if (grad!=undefined)
      ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(v1[0]+x+v[0][0], canvas.height-(v1[1]+y+v[0][1]));
    ctx.lineTo(v2[0]+x+v[0][0], canvas.height-(v2[1]+y+v[0][1]));
    ctx.lineTo(v3[0]+x+v[0][0], canvas.height-(v3[1]+y+v[0][1]));
    ctx.lineTo(v4[0]+x+v[0][0], canvas.height-(v4[1]+y+v[0][1]));
    ctx.fill();
  }, function colorfield(pos, size, color) {
    $mid_IVRi_colorfield[3] = 1.0;
    for (var i=0; i<3; i++) {
        if (color[i]==0.0)
          $mid_IVRi_colorfield[i] = 0.0;
        else 
          $mid_IVRi_colorfield[i] = color[i];
    }
    var color2=this._css_color($mid_IVRi_colorfield);
    $mid_IVRi_colorfield[3] = 1.0;
    for (var i=0; i<3; i++) {
        $mid_IVRi_colorfield[i] = (color[i]*3.0-1.0)/4.0;
    }
    var midclr=this._css_color($mid_IVRi_colorfield);
    $mid_IVRi_colorfield[3] = 1.0;
    for (var i=0; i<3; i++) {
        $mid_IVRi_colorfield[i] = 0.5+color[i]*0.5;
    }
    var smidclr=this._css_color($mid_IVRi_colorfield);
    $mid_IVRi_colorfield[3] = 0.0;
    for (var i=0; i<3; i++) {
        $mid_IVRi_colorfield[i] = color[i];
    }
    var zerocolor=this._css_color($mid_IVRi_colorfield);
    color = this._css_color(color);
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=g_app_state.raster.viewport;
    var m=this.transmat.$matrix;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var x=m.m41, y=m.m42;
    var bx=pos[0]+x+v[0][0], by=canvas.height-(pos[1]+y+v[0][1])-size[1];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(bx, by, size[0], size[1]);
    ctx.closePath();
    ctx.fill();
    function draw_grad(a, b, c, is_horiz) {
      var grad;
      var dp=0.0, dp2=0.0, dp3=35;
      if (is_horiz==1)
        grad = ctx.createLinearGradient(bx+1, by, bx+size[0]-2, by);
      else 
        if (is_horiz==2)
        grad = ctx.createLinearGradient(bx+dp+size[0]-dp*2, by+dp, bx+dp, by+size[1]-dp*2.0);
      else 
        if (is_horiz==3)
        grad = ctx.createLinearGradient(bx+dp2+dp3, by+dp2+dp3, bx+dp2+size[0]-dp2*2, by+size[1]-dp2*2.0);
      else 
        grad = ctx.createLinearGradient(bx, by+size[1], bx, by);
      grad.addColorStop(0.0, a);
      grad.addColorStop(1.0, c);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.rect(bx, by, size[0], size[1]);
      ctx.closePath();
      ctx.fill();
    }
    try {
      draw_grad("rgba(255,255,255,1.0)", "rgba(255,255,255, 0.5)", "rgba(255,255,255,0.0)", 0);
      draw_grad("rgba(0,0,0,1.0)", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.0)", 1);
    }
    catch (error) {
    }
  }, function icon(icon, pos, alpha, small, clr) {
    if (alpha==undefined) {
        alpha = 1.0;
    }
    if (small==undefined) {
        small = false;
    }
    if (clr==undefined) {
        clr = undefined;
    }
    if (icon<0)
      return ;
    var sheet=small ? g_app_state.raster.iconsheet16 : g_app_state.raster.iconsheet;
    var img=sheet.tex.image;
    var csize=sheet.cellsize;
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=g_app_state.raster.viewport;
    var m=this.transmat.$matrix;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var x=m.m41+v[0][0]+pos[0], y=canvas.height-(m.m42+v[0][1]+pos[1])-csize[1];
    var spos=sheet.enum_to_xy(icon);
    ctx.drawImage(img, spos[0], spos[1], csize[0], csize[1], x, y, csize[0], csize[1]);
  }, function quad_aa(v1, v2, v3, v4, c1, c2, c3, c4) {
    this.quad(v1, v2, v3, v4, c1, c2, c3, c4);
  }, function _clip_to_viewport(pos, size, v) {
    if (pos[0]<0) {
        size[0]+=pos[0];
        pos[0] = 0;
    }
    if (pos[0]+size[0]>v[1][0]) {
        size[0] = v[1][0]-pos[0];
    }
    if (pos[1]<0) {
        size[1]+=pos[1];
        pos[1] = 0;
    }
    if (pos[1]+size[1]>v[1][1]) {
        size[1] = v[1][1]-pos[1];
    }
  }, function push_scissor(pos, size) {
    var t="";
    for (var i=0; i<this.scissor_stack.length; i++) {
        t+="  ";
    }
    var oldpos=pos;
    pos = new Vector3([pos[0], pos[1], 0]);
    size = new Vector3([pos[0]+size[0], pos[1]+size[1], 0]);
    pos.multVecMatrix(this.transmat);
    size.multVecMatrix(this.transmat);
    size[0]-=pos[0];
    size[1]-=pos[1];
    var v=g_app_state.raster.viewport;
    this._clip_to_viewport(pos, size, v);
    pos[0]+=v[0][0];
    pos[1]+=v[0][1];
    for (var i=0; i<3; i++) {
        pos[i] = Math.floor(pos[i]);
        size[i] = Math.ceil(size[i]);
    }
    this.scissor_stack.push([pos, size]);
    var canvas=this.canvas;
    var g=this.ctx;
    try {
      g.save();
      if (window._cd==undefined)
        window._cd = 0;
      g.fillStyle = (window._cd++%2) ? "rgba(255, 0, 0, 0.5)" : "rgba(0, 255, 0, 0.5)";
      g.beginPath();
      g.rect(pos[0], canvas.height-(pos[1]+size[1]), size[0], size[1]);
      g.closePath();
      g.clip();
    }
    catch (err) {
        print_stack(err);
    }
  }, function pop_scissor() {
    this.scissor_stack.pop();
    var t="";
    for (var i=0; i<this.scissor_stack.length; i++) {
        t+="  ";
    }
    this.ctx.restore();
  }, function _clipeq(c1, c2) {
    return c1[0][0]==c2[0][0]&&c1[0][1]==c2[0][1]&&c1[1][0]==c2[1][0]&&c1[1][1]==c2[1][1];
  }, function arc_points(pos, start, arc, r, steps) {
    if (steps==undefined) {
        steps = Math.floor(6*arc/Math.PI);
    }
    var f, df;
    var f=start;
    var df=arc/steps;
    var points=[];
    for (var i=0; i<steps+1; i++) {
        var x=pos[0]+Math.sin(f)*r;
        var y=pos[1]+Math.cos(f)*r;
        points.push([x, y, 0]);
        f+=df;
    }
    return points;
  }, function arc(pos, start, arc, r, clr, half) {
    if (clr==undefined) {
        clr = [0.9, 0.8, 0.7, 0.6];
    }
    var steps=18/(2.0-arc/(Math.PI*2));
    var f, df;
    var f=start;
    var df=arc/steps;
    var points=[];
    for (var i=0; i<steps+1; i++) {
        var x=pos[0]+Math.sin(f)*r;
        var y=pos[1]+Math.cos(f)*r;
        points.push([x, y, 0]);
        f+=df;
    }
    var lines=[];
    var colors=[];
    for (var i=0; i<points.length-1; i++) {
        lines.push([points[i], points[i+1]]);
        colors.push([clr, clr]);
    }
    colors[0][0] = [1.0, 1.0, 0.0, 1.0];
    colors[0][1] = [1.0, 1.0, 0.0, 1.0];
  }, function box1(pos, size, clr, rfac, outline_only) {
    if (clr==undefined) {
        clr = undefined;
    }
    if (rfac==undefined) {
        rfac = undefined;
    }
    if (outline_only==undefined) {
        outline_only = false;
    }
    var c1, c2, c3, c4;
    var cs=uicolors["Box"];
    if (outline_only==undefined)
      outline_only = false;
    cs = _box_process_clr(cs, clr);
    var x=Math.floor(pos[0]), y=Math.floor(pos[1]);
    var w=size[0], h=size[1];
    var start=0;
    var ang=Math.PI/2;
    var r=4;
    if (rfac==undefined)
      rfac = 1;
    var hash=size[0].toString()+" "+size[1]+" "+rfac;
    if (!(hash in $cache_lN9__box1)) {
        r/=rfac;
        var p1=this.arc_points((($_mh = objcache.array(2)), ($_mh[0] = (0+r+2)), ($_mh[1] = (0+r+2)), ($_mh[2] = (0)), $_mh), Math.PI, ang, r);
        var p2=this.arc_points((($_mh = objcache.array(2)), ($_mh[0] = (0+w-r-2)), ($_mh[1] = (0+r+2)), ($_mh[2] = (0)), $_mh), Math.PI/2, ang, r);
        var p3=this.arc_points((($_mh = objcache.array(2)), ($_mh[0] = (0+w-r-2)), ($_mh[1] = (0+h-r-2)), ($_mh[2] = (0)), $_mh), 0, ang, r);
        var p4=this.arc_points((($_mh = objcache.array(2)), ($_mh[0] = (0+r+2)), ($_mh[1] = (0+h-r-2)), ($_mh[2] = (0)), $_mh), -Math.PI/2, ang, r);
        var plen=p1.length;
        p4.reverse();
        p3.reverse();
        p2.reverse();
        p1.reverse();
        var points=[];
        for (var i=0; i<p1.length; i++) {
            points.push(p1[i]);
        }
        for (var i=0; i<p2.length; i++) {
            points.push(p2[i]);
            p1.push(p2[i]);
        }
        for (var i=0; i<p3.length; i++) {
            points.push(p3[i]);
        }
        p2 = p3;
        for (var i=0; i<p4.length; i++) {
            p2.push(p4[i]);
            points.push(p4[i]);
        }
        p2.reverse();
        $cache_lN9__box1[hash] = [p1, p2, points];
    }
    var cp=$cache_lN9__box1[hash];
    var p1=cp[0];
    var p2=cp[1];
    var points=cp[2];
    var plen=p1.length;
    function color(i) {
      if (i<plen)
        return cs[0];
      else 
        if (i<plen*2)
        return cs[1];
      else 
        if (i<plen*3)
        return cs[2];
      else 
        if (i<=plen*4+1)
        return cs[3];
    }
    if (!outline_only) {
        for (var i=0; i<p1.length-1; i++) {
            var i1=i;
            var i2=i+plen*2;
            var i3=i+1+plen*2;
            var i4=i+1;
            $v1_O1rr_box1[0] = p1[i][0]+x;
            $v1_O1rr_box1[1] = p1[i][1]+y;
            $v1_O1rr_box1[2] = p1[i][2];
            
            $v2_bNP1_box1[0] = p2[i][0]+x;
            $v2_bNP1_box1[1] = p2[i][1]+y;
            $v2_bNP1_box1[2] = p2[i][2];
            
            $v3_a8pc_box1[0] = p2[i+1][0]+x;
            $v3_a8pc_box1[1] = p2[i+1][1]+y;
            $v3_a8pc_box1[2] = p2[i+1][2];
            
            $v4_I7Ys_box1[0] = p1[i+1][0]+x;
            $v4_I7Ys_box1[1] = p1[i+1][1]+y;
            $v4_I7Ys_box1[2] = p1[i+1][2];
            
            this.quad($v1_O1rr_box1, $v2_bNP1_box1, $v3_a8pc_box1, $v4_I7Ys_box1, color(i1), color(i2), color(i3), color(i4));
        }
    }
    var lines=[];
    var colors=[];
    for (var i=0; i<points.length; i++) {
        $v1_O1rr_box1[0] = points[(i+1)%points.length][0]+x;
        $v1_O1rr_box1[1] = points[(i+1)%points.length][1]+y;
        $v1_O1rr_box1[2] = points[(i+1)%points.length][2];
        
        $v2_bNP1_box1[0] = points[i][0]+x;
        $v2_bNP1_box1[1] = points[i][1]+y;
        $v2_bNP1_box1[2] = points[i][2];
        
        if ($pairs_MDx2_box1.length<=i) {
            $pairs_MDx2_box1.push([[0, 0], [0, 0]]);
        }
        $pairs_MDx2_box1[i][0][0] = (($_mh = objcache.array(2)), ($_mh[0] = ($v1_O1rr_box1[0])), ($_mh[1] = ($v1_O1rr_box1[1])), ($_mh[2] = (0)), $_mh);
        $pairs_MDx2_box1[i][0][1] = (($_mh = objcache.array(2)), ($_mh[0] = ($v2_bNP1_box1[0])), ($_mh[1] = ($v2_bNP1_box1[1])), ($_mh[2] = (0)), $_mh);
        lines.push($pairs_MDx2_box1[i][0]);
        $pairs_MDx2_box1[i][1][0] = color((i+1)%points.length);
        $pairs_MDx2_box1[i][1][1] = color(i);
        colors.push($pairs_MDx2_box1[i][1]);
    }
  }, function tri_aa(v1, v2, v3, c1, c2, c3) {
    this.tri(v1, v2, v3, c1, c2, c3);
  }, function _split_text(line) {
    var i=0;
    var segments=[{line: "", format: "", color: undefined}];
    while (i<line.length) {
      var c=line[i];
      if (c=="%") {
          var n=line[i+1];
          var color=undefined;
          var format="";
          color = undefined;
          switch (n) {
            case "b":
              format = "bold";
              break;
            case "i":
              format = "italic";
              break;
            case "/":
              format = "";
              color = undefined;
              i++;
              break;
            case "c":
              i++;
              var end=line.slice(i, line.length).search("}");
              color = line.slice(i+2, i+end).trim();
              console.log("COLOR!!!", end, color, "|", line.slice(i, line.length));
              i+=end;
              break;
          }
          segments.push({line: "", format: format, color: color});
          i+=2;
          continue;
      }
      segments[segments.length-1].line+=c;
      i++;
    }
    return segments;
  }, function _measure_line(line, fontsize) {
    var segs=this._split_text(line);
    var x=0.0;
    var g=this.ctx;
    for (var i=0; i<segs.length; i++) {
        x+=g.measureText(segs[i].line).width;
    }
    return {width: x}
  }, function _text_line(line, x, y, fontsize) {
    var segs=this._split_text(line);
    var g=this.ctx;
    var startclr=g.fillStyle;
    for (var i=0; i<segs.length; i++) {
        this._set_font(g, fontsize, segs[i].format);
        if (segs[i].color!=undefined) {
            g.fillStyle = segs[i].color;
        }
        else {
          g.fillStyle = startclr;
        }
        g.fillText(segs[i].line, x, y);
        x+=g.measureText(segs[i].line).width;
    }
    g.fillStyle = startclr;
  }, function text(pos1, text, color, fontsize, scale, rot, scissor_pos, scissor_size) {
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=g_app_state.raster.viewport;
    var lines=text.split("\n");
    if (text[0]!="\n"&&text[1]!="\r"&&lines[0].trim()=="") {
        lines = lines.splice(1, lines.length);
    }
    lines.reverse();
    if (rot==undefined)
      rot = 0;
    var ly=0;
    for (var i=0; i<lines.length; i++, ly+=12) {
        var w=this._measure_line(lines[i]).width;
        var m=this.transmat.$matrix;
        $pos_JikP_text[0] = m.m41+v[0][0]+pos1[0];
        $pos_JikP_text[1] = canvas.height-(m.m42+v[0][1]+pos1[1]+ly);
        $pos_JikP_text[2] = 0;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.rotate(rot);
        if (rot!=0) {
            $pos_JikP_text[1]-=w;
        }
        rot2d($pos_JikP_text, -rot);
        $pos_JikP_text[1] = canvas.height-$pos_JikP_text[1];
        if (color==undefined)
          color = [0, 0, 0, 1];
        ctx.fillStyle = this._css_color(color);
        if (fontsize==undefined)
          fontsize = default_ui_font_size;
        ctx.font = fontsize+"px "+"Arial";
        var x=$pos_JikP_text[0], y=canvas.height-($pos_JikP_text[1]);
        this._text_line(lines[i], x, y, fontsize);
    }
  }, function _set_font(ctx, fontsize, addition_options) {
    if (addition_options==undefined) {
        addition_options = "";
    }
    addition_options = addition_options.trim()+" ";
    if (fontsize==undefined)
      fontsize = default_ui_font_size;
    ctx.font = addition_options+fontsize+"px "+"Arial";
  }, function line(v1, v2, c1, c2) {
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=g_app_state.raster.viewport;
    var m=this.transmat.$matrix;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var x=m.m41, y=m.m42;
    ctx.strokeStyle = this._css_color(c1);
    ctx.beginPath();
    ctx.moveTo(v1[0]+x+v[0][0], canvas.height-(v1[1]+y+v[0][1]));
    ctx.lineTo(v2[0]+x+v[0][0], canvas.height-(v2[1]+y+v[0][1]));
    ctx.stroke();
  }, function tri(v1, v2, v3, c1, c2, c3) {
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=g_app_state.raster.viewport;
    var m=this.transmat.$matrix;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var x=m.m41, y=m.m42;
    ctx.fillStyle = this._css_color(c1);
    ctx.beginPath();
    ctx.moveTo(v1[0]+x+v[0][0], canvas.height-(v1[1]+y+v[0][1]));
    ctx.lineTo(v2[0]+x+v[0][0], canvas.height-(v2[1]+y+v[0][1]));
    ctx.lineTo(v3[0]+x+v[0][0], canvas.height-(v3[1]+y+v[0][1]));
    ctx.fill();
  }, function shadow_box(pos, size, steps, margin, clr) {
    if (steps==undefined) {
        steps = 6;
    }
    if (margin==undefined) {
        margin = [6, 6];
    }
    if (clr==undefined) {
        clr = uicolors["ShadowBox"];
    }
  }, function box(pos, size, clr, rfac, outline_only) {
    if (IsMobile||rfac==0.0)
      return this.box2(pos, size, clr, rfac, outline_only);
    else 
      return this.box1(pos, size, clr, rfac, outline_only);
  }, function passpart(pos, size, clr) {
    if (clr==undefined) {
        clr = [0, 0, 0, 0.5];
    }
    var p=this.viewport[0];
    var s=this.viewport[1];
    this.box2([p[0], p[1]], [pos[0], s[1]], clr);
    this.box2([p[0]+pos[0]+size[0], p[1]], [s[0]-pos[0]-size[0], s[1]], clr);
    this.box2([pos[0]+p[0], pos[1]+p[1]+size[1]], [size[0], s[1]-size[1]-p[1]], clr);
    this.box2([pos[0]+p[0], p[1]], [size[0], pos[1]], clr);
  }, function box2(pos, size, clr, rfac, outline_only) {
    if (clr==undefined) {
        clr = undefined;
    }
    if (rfac==undefined) {
        rfac = undefined;
    }
    if (outline_only==undefined) {
        outline_only = false;
    }
    var cs=uicolors["Box"];
    cs = _box_process_clr(cs, clr);
    var x=pos[0], y=pos[1];
    var w=size[0], h=size[1];
    if (outline_only) {
        this.line([pos[0], pos[1]], [pos[0], pos[1]+size[1]], clr, clr, 1.0);
        this.line([pos[0], pos[1]+size[1]], [pos[0]+size[0], pos[1]+size[1]], clr, clr, 1.0);
        this.line([pos[0]+size[0], pos[1]+size[1]], [pos[0]+size[0], pos[1]], clr, clr, 1.0);
        this.line([pos[0]+size[0], pos[1]], [pos[0], pos[1]], clr, clr, 1.0);
    }
    else {
      this.quad((($_mh = objcache.array(2)), ($_mh[0] = (x)), ($_mh[1] = (y)), ($_mh[2] = (0)), $_mh), (($_mh = objcache.array(2)), ($_mh[0] = (x+w)), ($_mh[1] = (y)), ($_mh[2] = (0)), $_mh), (($_mh = objcache.array(2)), ($_mh[0] = (x+w)), ($_mh[1] = (y+h)), ($_mh[2] = (0)), $_mh), (($_mh = objcache.array(2)), ($_mh[0] = (x)), ($_mh[1] = (y+h)), ($_mh[2] = (0)), $_mh), cs[0], cs[1], cs[2], cs[3]);
    }
  }, function textsize(text, size) {
    if (size==undefined) {
        size = default_ui_font_size;
    }
    var lines=text.split("\n");
    if (text[0]!="\n"&&text[1]!="\r"&&lines[0].trim()=="") {
        lines = lines.splice(1, lines.length);
    }
    lines.reverse();
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=this.viewport;
    this._set_font(ctx, size);
    var wid=0, hgt=0;
    for (var i=0; i<lines.length; i++) {
        wid = Math.max(wid, this._measure_line(lines[i]).width);
        hgt+=size+2;
    }
    return [wid, hgt];
  }, function translate(off) {
    this.transmat.translate(off[0], off[1], 0.0);
  }, function push_transform(mat) {
    if (mat==undefined) {
        mat = undefined;
    }
    this.trans_stack.push(new Matrix4(this.transmat));
    if (mat!=undefined)
      this.transmat.multiply(mat);
  }, function pop_transform() {
    this.transmat.load(this.trans_stack.pop());
  }]);
  var $temp_layer_idgen_Q0np_push_layer=0;
  var $black_KuvY_quad=[0, 0, 0, 1];
  var $grads_pVXQ_quad={}
  var $mid_IVRi_colorfield=[0, 0, 0, 0.5];
  var $cache_lN9__box1={}
  var $v1_O1rr_box1=new Vector3();
  var $v3_a8pc_box1=new Vector3();
  var $pairs_MDx2_box1=[];
  var $pos_JikP_text=[0, 0, 0];
  var $v2_bNP1_box1=new Vector3();
  var $v4_I7Ys_box1=new Vector3();
  _es6_module.add_class(UICanvas);
  UICanvas = _es6_module.add_export('UICanvas', UICanvas);
  window.active_canvases = {}
  function test_canvas2d() {
    var u=new UICanvas();
  }
});
es6_module_define('UIFrame', ["UIElement", "J3DIMath", "mathlib", "events"], function _UIFrame_module(_es6_module) {
  var aabb_isect_2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_2d');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  es6_import(_es6_module, 'J3DIMath');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var CanvasFlags=es6_import_item(_es6_module, 'UIElement', 'CanvasFlags');
  var KeyMap=es6_import_item(_es6_module, 'events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, 'events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, 'events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, 'events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, 'events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, 'events', 'TouchEventManager');
  var VelocityPan=es6_import_item(_es6_module, 'events', 'VelocityPan');
  var EventHandler=es6_import_item(_es6_module, 'events', 'EventHandler');
  var _static_mat=new Matrix4();
  var _ufbd_v1=new Vector3();
  var _canvas_threshold=1.0;
  var $pos_Akn6__find_active;
  var $zero_qIR0_build_draw_old;
  var UIFrame=_ESClass("UIFrame", UIElement, [function UIFrame(ctx, canvas, path, pos, size) {
    UIElement.call(this, ctx, path, pos, size);
    this.dirty_rects = new GArray();
    this.bgcolor = undefined;
    this._pan_cache = {}
    this.pan_bounds = [[0, 0], [0, 0]];
    this.depth = 0;
    this.ctx = ctx;
    this._children = new GArray([]);
    this.active = undefined;
    this.velpan = new VelocityPan();
    this.tick_timer = new Timer(490);
    this.mpos = [0, 0];
    this.draw_background = false;
    this.has_hidden_elements = false;
    if (canvas!=undefined) {
        this.canvas = canvas;
    }
    this.leafcount = 0;
    this.framecount = 0;
    this.rcorner = 16.0;
    this.keymap = undefined;
  }, _ESClass.get(function children() {
    return this._children;
  }), _ESClass.set(function children(cs) {
    var cset=new set();
    var __iter_c=__get_iter(cs);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      cset.add(c);
    }
    var __iter_c=__get_iter(list(this._children));
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (!cset.has(c)) {
          c.on_remove(this);
          c.parent = undefined;
          c.canvas = undefined;
      }
    }
    this._children.reset();
    var __iter_c=__get_iter(cs);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (!cset.has(c)) {
          this.add(c);
      }
      else {
        this._children.push(c);
      }
    }
  }), function on_saved_uidata(visit_func) {
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      visit_func(c);
    }
  }, function on_load_uidata(visit) {
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      visit(c);
    }
  }, function on_gl_lost(new_gl) {
    if (this.canvas!=undefined&&!(this.canvas.gl===new_gl)) {
        this.canvas.on_gl_lost(new_gl);
    }
    if (this.children==undefined)
      return ;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.on_gl_lost(new_gl);
    }
    this.do_full_recalc();
  }, function start_pan(start_mpos, button, last_mpos) {
    if (start_mpos==undefined) {
        start_mpos = undefined;
    }
    if (button==undefined) {
        button = 0;
    }
    if (last_mpos==undefined) {
        last_mpos = undefined;
    }
    if (!(this.state&UIFlags.HAS_PAN)) {
        if (this.parent==undefined) {
            console.trace();
            console.log("Warning: UIFrame.start_pan: no parent frame with pan support");
        }
        else {
          if (start_mpos!=undefined) {
              start_mpos[0]+=this.pos[0];
              start_mpos[1]+=this.pos[1];
          }
          if (last_mpos!=undefined) {
              last_mpos[0]+=this.pos[0];
              last_mpos[1]+=this.pos[1];
          }
          this.parent.start_pan(start_mpos, button, last_mpos);
        }
    }
    else {
      this.start_pan_main(start_mpos, button, last_mpos);
    }
  }, function start_pan_main(start_mpos, button, last_mpos) {
    if (button==undefined) {
        button = 0;
    }
    if (last_mpos==undefined) {
        last_mpos = start_mpos;
    }
    if (start_mpos!=undefined) {
        this.mpos[0] = start_mpos[0];
        this.mpos[1] = start_mpos[1];
    }
    if (this.velpan==undefined)
      this.velpan = new VelocityPan();
    var mpos=[this.mpos[0], this.mpos[1]];
    var lastmpos;
    this.abs_transform(mpos);
    if (last_mpos!=undefined) {
        last_mpos = [last_mpos[0], last_mpos[1]];
        this.abs_transform(last_mpos);
    }
    else {
      last_mpos = mpos;
    }
    if (DEBUG.touch)
      console.log("sy", mpos[1]);
    var f=this;
    while (f.parent!=undefined) {
      f = f.parent;
    }
    this.velpan.can_coast = !(this.state&UIFlags.NO_VELOCITY_PAN);
    this.velpan.start(mpos, last_mpos, this, f.push_modal.bind(f), f.pop_modal.bind(f));
  }, function end_pan() {
    if (this.modalhandler==this.velpan) {
        this.velpan.end();
        this.pop_modal();
    }
    else {
      console.trace();
      console.log("Warning: UIFrame.end_pan called when not in panning mode");
      return ;
    }
  }, function get_keymaps() {
    return this.keymap!=undefined ? [this.keymap] : [];
  }, function do_full_recalc() {
    this.dirty_rects.push([[this.abspos[0], this.abspos[1]], [this.size[0], this.size[1]]]);
    this.do_recalc();
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (__instance_of(c, UIFrame))
        c.do_full_recalc();
      else 
        c.do_recalc();
    }
  }, function on_resize(newsize, oldsize) {
    if (this.canvas!=undefined) {
        this.canvas.on_resize(newsize, oldsize);
    }
    this.do_full_recalc();
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.do_recalc();
      c.on_resize(newsize, oldsize);
    }
  }, function on_inactive() {
    if (this.active!=undefined) {
        this.active.state&=~UIFlags.HIGHLIGHT;
        this.active.do_recalc();
        this.active.on_inactive();
        this.active = undefined;
        this.do_recalc();
    }
  }, function push_modal(e) {
    UIElement.prototype.push_modal.call(this, e);
  }, function pop_modal() {
    UIElement.prototype.pop_modal.call(this);
  }, function _offset_mpos(event) {
    if (this.modalhandler!=null&&__instance_of(this.modalhandler, UIElement)) {
        event.x-=this.modalhandler.pos[0];
        event.y-=this.modalhandler.pos[1];
    }
    if ((this.state&UIFlags.HAS_PAN)&&this.velpan!=undefined) {
        event.x-=this.velpan.pan[0];
        event.y-=this.velpan.pan[1];
    }
  }, function _unoffset_mpos(event) {
    if (this.state&UIFlags.HAS_PAN) {
        event.x+=this.velpan.pan[0];
        event.y+=this.velpan.pan[1];
    }
  }, function set_pan() {
    if (this.state&UIFlags.PAN_CANVAS_MAT)
      this.on_pan(this.velpan.pan, this.velpan.pan);
  }, function on_pan(pan, old_pan) {
    if (this.state&UIFlags.PAN_CANVAS_MAT) {
        var mat=this.canvas.global_matrix;
        var s=this.canvas.viewport[1];
        var x=(pan[0]/s[0])*2.0;
        var y=(pan[1]/s[1])*2.0;
        mat.makeIdentity();
        mat.translate(x, y, 0);
    }
    else {
      this.do_full_recalc();
    }
    this.pan_do_build();
  }, function _on_mousemove(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null) {
        this._offset_mpos(event);
        this.modalhandler._on_mousemove(event);
        return true;
    }
    else {
      return this.on_mousemove(event);
    }
  }, function focus(e) {
    if (this.active!==e&&this.active!==undefined) {
        this.active.state&=~UIFlags.HIGHLIGHT;
        this.active.on_inactive();
        this.active.do_recalc();
    }
    else 
      if (e!=undefined&&e===this.active) {
        if (this.parent!=undefined)
          this.parent.focus(this);
        return ;
    }
    if (e!=undefined) {
        e.state|=UIFlags.HIGHLIGHT;
        e.on_active();
        e.do_recalc();
    }
    this.active = e;
    if (this.parent!=undefined) {
        this.parent.focus(this);
    }
  }, function _find_active(e) {
    var mpos=[e.x, e.y];
    var found=false;
    for (var i=this.children.length-1; i>=0; i--) {
        var c=this.children[i];
        $pos_Akn6__find_active[0] = c.pos[0], $pos_Akn6__find_active[1] = c.pos[1];
        if (c.state&UIFlags.HAS_PAN) {
        }
        if (inrect_2d(mpos, $pos_Akn6__find_active, c.size)) {
            found = true;
            if (this.active!=c&&this.active!=undefined) {
                this.active.state&=~UIFlags.HIGHLIGHT;
                this.active.on_inactive();
                this.active.do_recalc();
            }
            if (this.active!=c) {
                c.state|=UIFlags.HIGHLIGHT;
                c.on_active();
                c.do_recalc();
                this.active = c;
            }
            break;
        }
    }
    if (!found&&this.active!=undefined) {
        this.active.state&=~UIFlags.HIGHLIGHT;
        this.active.on_inactive();
        this.active.do_recalc();
        this.active = undefined;
    }
  }, function on_mousemove(e) {
    if (this.bad_event(e))
      return ;
    this._offset_mpos(e);
    var mpos=this.mpos = [e.x, e.y];
    var found=false;
    this._find_active(e);
    if (this.active!=undefined) {
        e.x-=this.active.pos[0];
        e.y-=this.active.pos[1];
        this.active._on_mousemove(e);
        e.x+=this.active.pos[0];
        e.y+=this.active.pos[1];
    }
    this._unoffset_mpos(e);
    return this.active!=undefined;
  }, function bad_event(event) {
    if (!(this.state&UIFlags.ENABLED))
      return false;
    return UIElement.prototype.bad_event.call(this, event);
  }, function _on_doubleclick(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null) {
        this._offset_mpos(event);
        this.modalhandler._on_doubleclick(event);
    }
    else {
      this.on_doubleclick(event);
    }
  }, function _on_mousedown(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null) {
        this._offset_mpos(event);
        this.modalhandler._on_mousedown(event);
    }
    else {
      this.on_mousedown(event);
    }
  }, function on_doubleclick(e) {
    if (this.bad_event(e))
      return ;
    var mpos=this.mpos = [e.x, e.y];
    this._find_active(e);
    if (this.active!=undefined) {
        e.x-=this.active.pos[0];
        e.y-=this.active.pos[1];
        this.active._on_doubleclick(e);
    }
    this._unoffset_mpos(e);
    return this.active!=undefined;
  }, function on_mousedown(e, feed_mousemove) {
    if (feed_mousemove==undefined) {
        feed_mousemove = false;
    }
    if (this.bad_event(e))
      return ;
    if (feed_mousemove)
      this.on_mousemove(e);
    else 
      this._offset_mpos(e);
    var mpos=this.mpos = [e.x, e.y];
    this._find_active(e);
    if ((this.state&UIFlags.USE_PAN)&&(e.button!=0||this.active==undefined)) {
        console.log("panning");
        this.start_pan([e.x, e.y]);
        return ;
    }
    if (this.active!=undefined) {
        e.x-=this.active.pos[0];
        e.y-=this.active.pos[1];
        this.active._on_mousedown(e);
    }
    this._unoffset_mpos(e);
    return this.active!=undefined;
  }, function _on_mouseup(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null) {
        this._offset_mpos(event);
        this.modalhandler._on_mouseup(event);
    }
    else {
      this.on_mouseup(event);
    }
  }, function on_mouseup(e) {
    if (this.bad_event(e))
      return ;
    this._offset_mpos(e);
    if (this.active!=undefined) {
        e.x-=this.active.pos[0];
        e.y-=this.active.pos[1];
        this.active._on_mouseup(e);
    }
    this._unoffset_mpos(e);
    return this.active!=undefined;
  }, function _on_mousewheel(event, delta) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null) {
        if (this.modalhandler["pos"]!=undefined) {
            event.x-=this.modalhandler.pos[0];
            event.y-=this.modalhandler.pos[1];
        }
        this.modalhandler._on_mousewheel(event, delta);
    }
    else {
      this.on_mousewheel(event, delta);
    }
  }, function on_mousewheel(e, delta) {
    if (this.active!=undefined) {
        if (this.modalhandler!=null&&this.modalhandler["pos"]!=undefined) {
            event.x-=this.modalhandler.pos[0];
            event.y-=this.modalhandler.pos[1];
        }
        this.active._on_mousewheel(e, delta);
    }
    return this.active!=undefined;
  }, function on_textinput(e) {
    if (this.active!=undefined) {
        this.active._on_textinput(e);
    }
    return this.active!=undefined;
  }, function on_keydown(e) {
    if (this.active!=undefined) {
        this.active._on_keydown(e);
    }
    return this.active!=undefined;
  }, function on_keyup(e) {
    if (this.active!=undefined) {
        this.active._on_keyup(e);
    }
    return this.active!=undefined;
  }, function on_charcode(e) {
    if (this.active!=undefined) {
        this.active._on_charcode(e);
    }
    return this.active!=undefined;
  }, function get_uhash() {
    var s="";
    var p=this;
    while (p!=undefined) {
      s+=p.constructor.name;
      if (__instance_of(p, Area))
        break;
      p = p.parent;
    }
    return s;
  }, function prepend(e, packflag) {
    e.defunct = false;
    this.children.prepend(e);
    if (!(__instance_of(e, UIFrame))) {
        this.leafcount++;
    }
    else {
      this.framecount++;
    }
    if (packflag!=undefined)
      e.packflag|=packflag;
    e.parent = this;
    if (e.canvas==undefined)
      e.canvas = this.canvas;
    e.on_add(this);
    this.do_recalc();
    this.update_depth();
  }, function _set_pan(e) {
    e.state|=UIFlags.USE_PAN;
    if (__instance_of(e, UIFrame)) {
        var __iter_c=__get_iter(e.children);
        var c;
        while (1) {
          var __ival_c=__iter_c.next();
          if (__ival_c.done) {
              break;
          }
          c = __ival_c.value;
          this._set_pan(c);
        }
    }
  }, function update_depth(e) {
    return ;
    var p=this;
    this.depth = 0;
    while (p.parent!=undefined) {
      p = p.parent;
      this.depth++;
    }
    function rec(f, depth) {
      if (depth==undefined) {
          depth = 0;
      }
      f.depth = depth;
      var __iter_c=__get_iter(f.children);
      var c;
      while (1) {
        var __ival_c=__iter_c.next();
        if (__ival_c.done) {
            break;
        }
        c = __ival_c.value;
        if (__instance_of(c, UIFrame)) {
            rec(c, depth+1);
        }
      }
    }
  }, function add(e, packflag) {
    if (__instance_of(e, UIFrame)&&(e.state&UIFlags.HAS_PAN)&&e.velpan==undefined) {
        e.velpan = new VelocityPan();
    }
    if (this.state&(UIFlags.HAS_PAN|UIFlags.USE_PAN)) {
        this.state|=UIFlags.USE_PAN;
        this._set_pan(e);
    }
    e.defunct = false;
    this.children.push(e);
    if (!(__instance_of(e, UIFrame))) {
        this.leafcount++;
    }
    else {
      this.framecount++;
    }
    if (packflag!=undefined)
      e.packflag|=packflag;
    e.parent = this;
    if (e.canvas==undefined)
      e.canvas = this.canvas;
    e.on_add(this);
    e.do_recalc();
    this.update_depth();
  }, function replace(a, b) {
    if (a==this.modalhandler) {
        a.pop_modal();
    }
    this.dirty_rects.push([[a.abspos[0], a.abspos[1]], [a.size[0], a.size[1]]]);
    a.on_remove(this);
    this.children.replace(a, b);
    if (this.canvas!=undefined)
      this.canvas.remove_cache(a);
    if (a==this.active)
      this.active = b;
    b.parent = this;
    if (b.canvas==undefined)
      b.canvas = this.get_canvas();
    if (b.ctx==undefined)
      b.ctx = this.ctx;
    b.on_add(this);
    b.do_recalc();
    this.update_depth();
  }, function remove(e) {
    e.defunct = true;
    this.dirty_rects.push([[e.abspos[0], e.abspos[1]], [e.size[0], e.size[1]]]);
    if (!(__instance_of(e, UIFrame))) {
        this.leafcount--;
    }
    else {
      this.framecount--;
    }
    if (e==this.modalhandler) {
        e.pop_modal();
    }
    this.children.remove(e);
    e.on_remove(this);
    if (this.canvas!=undefined)
      this.canvas.remove_cache(e);
    if (e==this.active)
      this.active = undefined;
    this.update_depth();
  }, function set_context(ctx) {
    this.ctx = ctx;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.set_context(ctx);
    }
  }, function load_filedata(obj) {
    if (obj.pan) {
        this.velpan = new VelocityPan();
        this.velpan.pan.load(obj.pan);
    }
  }, function disable() {
    UIElement.prototype.disable.call(this);
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.disable();
    }
  }, function enable() {
    UIElement.prototype.enable.call(this);
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.enable();
    }
  }, function get_filedata() {
    if (this.state&UIFlags.HAS_PAN&&this.velpan!=undefined) {
        return {pan: this.velpan.pan}
    }
    return undefined;
  }, function pan_do_build() {
    var cache=this._pan_cache;
    var cache2={}
    var i=0;
    var viewport=g_app_state.raster.viewport;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.abspos[0] = 0;
      c.abspos[1] = 0;
      c.abs_transform(c.abspos);
      var hidden=!aabb_isect_2d(c.abspos, c.size, viewport[0], viewport[1]);
      if (!this.recalc&&!hidden&&(!(i in cache)||cache[i]!=hidden)) {
          console.log("pan recalc");
          this.do_recalc();
      }
      cache2[i] = hidden;
      i++;
    }
    this._pan_cache = cache2;
  }, function calc_dirty() {
    var d=this.last_dirty;
    var ret=[[0, 0], [0, 0]];
    var first=true;
    var margin=1;
    var __iter_r=__get_iter(this.dirty_rects);
    var r;
    while (1) {
      var __ival_r=__iter_r.next();
      if (__ival_r.done) {
          break;
      }
      r = __ival_r.value;
      if (first) {
          first = false;
          ret[0][0] = r[0][0]-margin;
          ret[0][1] = r[0][1]-margin;
          ret[1][0] = r[1][0]+r[0][0]+margin*2;
          ret[1][1] = r[1][1]+r[0][1]+margin*2;
      }
      else {
        ret[0][0] = Math.min(ret[0][0], r[0][0]-margin);
        ret[0][1] = Math.min(ret[0][1], r[0][1]-margin);
        ret[1][0] = Math.max(ret[1][0], r[0][0]+r[1][0]+margin*2);
        ret[1][1] = Math.max(ret[1][1], r[0][1]+r[1][1]+margin*2);
      }
    }
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.constructor.name=="ScreenBorder")
        continue;
      if (c.state&UIFlags.INVISIBLE)
        continue;
      if (!c.recalc)
        continue;
      var ret2;
      if (__instance_of(c, UIFrame)) {
          ret2 = c.calc_dirty();
      }
      else {
        ret2 = c.last_dirty;
      }
      if (first) {
          ret[0][0] = ret2[0][0];
          ret[0][1] = ret2[0][1];
          ret[1][0] = ret2[1][0]+ret2[0][0];
          ret[1][1] = ret2[1][1]+ret2[0][1];
          first = false;
      }
      else {
        for (var i=0; i<2; i++) {
            ret[0][i] = Math.min(ret[0][i], ret2[0][i]);
            ret[1][i] = Math.max(ret[1][i], ret2[1][i]+ret2[0][i]);
        }
      }
    }
    this.abspos[0] = this.abspos[1] = 0.0;
    this.abs_transform(this.abspos);
    ret[0][0] = Math.min(Math.max(ret[0][0], this.abspos[0]), this.abspos[0]+this.size[0]);
    ret[1][0]-=ret[0][0];
    ret[1][1]-=ret[0][1];
    return ret;
  }, function build_draw(canvas, isVertical, cache_frame) {
    if (cache_frame==undefined) {
        cache_frame = undefined;
    }
    var mat=_static_mat;
    this.has_hidden_elements = false;
    this.recalc = 0;
    if (this._limit==undefined)
      this._limit = 0;
    var d=this.calc_dirty();
    this.dirty_rects.reset();
    if (this.canvas==undefined) {
        var p=this;
        while (p!=undefined&&p.canvas==undefined) {
          p = p.parent;
        }
        if (p!=undefined) {
            this.canvas = p.canvas;
            this.pack(this.canvas, false);
        }
    }
    if (this.canvas==undefined) {
        return ;
    }
    var pushed_pan_transform=false;
    var canvas=this.canvas;
    try {
      if (this.state&UIFlags.HAS_PAN&&this.velpan!=undefined) {
          canvas.push_transform();
          pushed_pan_transform = true;
          canvas.translate(this.velpan.pan);
      }
    }
    catch (err) {
        print_stack(err);
    }
    if (this.draw_background) {
        canvas.simple_box([0, 0], this.size, this.bgcolor, this.rcorner);
    }
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.canvas==undefined)
        c.canvas = this.canvas;
      if (!c.recalc)
        continue;
      this.canvas.push_transform();
      this.canvas.translate(c.pos);
      c.abspos[0] = 0;
      c.abspos[1] = 0;
      c.abs_transform(c.abspos);
      if (!(__instance_of(c, UIFrame))) {
          var t=c.dirty;
          c.dirty = c.last_dirty;
          c.last_dirty = t;
          c.dirty[0][0] = c.abspos[0];
          c.dirty[0][1] = c.abspos[1];
          c.dirty[1][0] = c.size[0];
          c.dirty[1][1] = c.size[1];
      }
      try {
        c.build_draw(this.canvas, false);
      }
      catch (err) {
          print_stack(err);
      }
      this.canvas.pop_transform();
      c.recalc = false;
    }
    if (pushed_pan_transform) {
        this.canvas.pop_transform();
    }
  }, function build_draw_old(canvas, isVertical, cache_frame) {
    if (cache_frame==undefined) {
        cache_frame = undefined;
    }
    var mat=_static_mat;
    this.has_hidden_elements = false;
    var d=this.calc_dirty();
    if (this.is_canvas_root()) {
        if (DEBUG.use_2d_uicanvas) {
            var __iter_c=__get_iter(this.children);
            var c;
            while (1) {
              var __ival_c=__iter_c.next();
              if (__ival_c.done) {
                  break;
              }
              c = __ival_c.value;
              if (aabb_isect_2d(c.pos, c.size, d[0], d[1])) {
                  c.do_recalc();
              }
            }
        }
        this.canvas.push_transform();
        this.canvas.translate(this.pos);
    }
    if (cache_frame==undefined) {
        cache_frame = !(this.state&UIFlags.NO_FRAME_CACHE);
    }
    if (cache_frame&&this.depth==4) {
        canvas.frame_begin(this);
    }
    if (this.parent==undefined) {
        this.abspos[0] = this.abspos[1] = 0.0;
        this.abs_transform(this.abspos);
    }
    if (this.state&UIFlags.HAS_PAN&&this.velpan!=undefined) {
        if (!(this.state&UIFlags.PAN_CANVAS_MAT)) {
            canvas.push_transform();
            canvas.translate(this.velpan.pan);
        }
    }
    if (this.pos==undefined) {
        this.pos = [0, 0];
        console.log("eek");
        console.trace();
    }
    if (this.draw_background) {
    }
    var retag_recalc=false;
    this.recalc = 0;
    var viewport=g_app_state.raster.viewport;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      c.abspos[0] = 0;
      c.abspos[1] = 0;
      c.abs_transform(c.abspos);
      var t=c.dirty;
      c.dirty = c.last_dirty;
      c.last_dirty = t;
      c.dirty[0][0] = c.abspos[0];
      c.dirty[0][1] = c.abspos[1];
      c.dirty[1][0] = c.size[0];
      c.dirty[1][1] = c.size[1];
      var isect=aabb_isect_2d(c.abspos, c.size, viewport[0], viewport[1]);
      var pos;
      if (this.state&UIFlags.HAS_PAN)
        pos = this.velpan.pan;
      else 
        pos = $zero_qIR0_build_draw_old;
      isect = isect||aabb_isect_2d(c.pos, c.size, pos, this.size);
      if (!isect) {
          this.has_hidden_elements = true;
          continue;
      }
      if (c.pos==undefined) {
          c.pos = [0, 0];
          c.size = [0, 0];
          console.log("eek2");
          console.trace();
      }
      mat.makeIdentity();
      _ufbd_v1.zero();
      _ufbd_v1[0] = c.pos[0];
      _ufbd_v1[1] = c.pos[1];
      mat.translate(_ufbd_v1);
      if ((c.canvas!=undefined&&c.canvas!=this.get_canvas())||c.is_canvas_root()) {
          if (c.recalc&&!(c.packflag&PackFlags.NO_REPACK)) {
              var canvas2=c.get_canvas();
              canvas2.push_transform();
              canvas2.translate(c.pos);
              c.pack(canvas2, false);
              c.build_draw(canvas2, isVertical);
              canvas2.pop_transform();
          }
          continue;
      }
      var do_skip=!c.recalc;
      if (!(__instance_of(c, UIFrame))&&this.constructor.name!="UIMenu") {
          do_skip = !c.recalc;
      }
      if (c.recalc) {
          var r=this.recalc;
          if (c.recalc&&!(c.packflag&PackFlags.NO_REPACK))
            c.pack(canvas, false);
          canvas.push_transform(mat);
          try {
            c.build_draw(canvas, isVertical);
          }
          catch (_err) {
              print_stack(_err);
              if (c==this.modalhandler)
                c.pop_modal();
              console.log("Error occured while drawing element ", c);
          }
          canvas.pop_transform(mat);
          c.recalc = 0;
      }
    }
    if (cache_frame&&this.depth==4) {
        canvas.frame_end(this);
    }
    if (retag_recalc)
      this.do_recalc();
    if (this.state&UIFlags.HAS_PAN&&this.velpan!=undefined) {
        if (!(this.state&UIFlags.PAN_CANVAS_MAT)) {
            canvas.pop_transform();
        }
    }
    if (this.is_canvas_root()) {
        this.canvas.pop_transform();
    }
    this.dirty_rects.reset();
  }, function on_tick(pre_func) {
    if (!this.tick_timer.ready())
      return ;
    UIElement.prototype.on_tick.call(this);
    if (this.state&UIFlags.HAS_PAN&&this.valpan==undefined) {
        this.valpan = new VelocityPan();
        this.state|=UIFlags.USE_PAN;
        function recurse(f) {
          var __iter_c=__get_iter(f.children);
          var c;
          while (1) {
            var __ival_c=__iter_c.next();
            if (__ival_c.done) {
                break;
            }
            c = __ival_c.value;
            c.state|=UIFlags.USE_PAN;
            if (__instance_of(c, UIFrame))
              recurse(c);
          }
        }
        recurse(this);
    }
    if (this.velpan!=undefined) {
        this.velpan.on_tick();
    }
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      try {
        if (pre_func!=undefined)
          pre_func(c);
        c.on_tick();
        if (c.status_timer!=undefined) {
            c.inc_flash_timer();
            c.do_recalc();
        }
      }
      catch (_err) {
          print_stack(_err);
          if (c==this.modalhandler)
            c.pop_modal();
          console.log("Error occured in UIFrame.on_tick ", c);
      }
    }
  }, function pack(canvas, isVertical) {
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.recalc&&!(c.packflag&PackFlags.NO_REPACK))
        c.pack(canvas, isVertical);
    }
  }, function add_floating(e, modal, center) {
    if (modal==undefined) {
        modal = false;
    }
    if (center==undefined) {
        center = false;
    }
    var off=[e.pos[0], e.pos[1]];
    var frame=this;
    this.abs_transform(off);
    while (frame.parent!=undefined) {
      frame = frame.parent;
    }
    if (e.canvas==undefined)
      e.canvas = frame.get_canvas();
    if (center) {
    }
    e.pos[0] = off[0];
    e.pos[1] = off[1];
    frame.add(e);
    e.do_recalc();
    frame.do_full_recalc();
    if (modal) {
        frame.push_modal(e);
    }
  }]);
  var $pos_Akn6__find_active=[0, 0];
  var $zero_qIR0_build_draw_old=[0, 0];
  _es6_module.add_class(UIFrame);
  UIFrame = _es6_module.add_export('UIFrame', UIFrame);
});
es6_module_define('UIPack', ["UIWidgets", "UIElement", "UIFrame", "mathlib", "toolprops"], function _UIPack_module(_es6_module) {
  var PropTypes=es6_import_item(_es6_module, 'toolprops', 'PropTypes');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var DataRefProperty=es6_import_item(_es6_module, 'toolprops', 'DataRefProperty');
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var aabb_isect_2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_2d');
  var UIElement, UIFrame;
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var CanvasFlags=es6_import_item(_es6_module, 'UIElement', 'CanvasFlags');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var UIButtonAbstract=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonAbstract');
  var UIButton=es6_import_item(_es6_module, 'UIWidgets', 'UIButton');
  var UIButtonIcon=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonIcon');
  var UIMenuButton=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuButton');
  var UICheckBox=es6_import_item(_es6_module, 'UIWidgets', 'UICheckBox');
  var UINumBox=es6_import_item(_es6_module, 'UIWidgets', 'UINumBox');
  var UILabel=es6_import_item(_es6_module, 'UIWidgets', 'UILabel');
  var UIMenuLabel=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuLabel');
  var ScrollButton=es6_import_item(_es6_module, 'UIWidgets', 'ScrollButton');
  var UIVScroll=es6_import_item(_es6_module, 'UIWidgets', 'UIVScroll');
  var UIIconCheck=es6_import_item(_es6_module, 'UIWidgets', 'UIIconCheck');
  var $_mh;
  var $_swapt;
  var UIPackFrame=_ESClass("UIPackFrame", UIFrame, [function UIPackFrame(ctx, path_prefix) {
    UIFrame.call(this, ctx);
    this.mm = new MinMax(2);
    this._last_pack_recalc = 0;
    if (path_prefix==undefined)
      path_prefix = "";
    this.path_prefix = path_prefix;
    this.min_size = undefined;
    this.last_ms = 0;
    this.last_pos = new Vector2();
    this.last_size = new Vector2();
    this.default_packflag = 0;
  }, function build_draw(canvas, isVertical) {
    if (this.is_canvas_root())
      this.pack(canvas, isVertical);
    UIFrame.prototype.build_draw.call(this, canvas, isVertical);
  }, function on_resize(newsize, oldsize) {
    UIFrame.prototype.on_resize.call(this, newsize, oldsize);
  }, function add(child, packflag) {
    if (packflag==undefined) {
        packflag = 0;
    }
    packflag|=this.default_packflag;
    UIFrame.prototype.add.call(this, child, packflag);
  }, function prepend(child) {
    child.packflag|=this.default_packflag;
    UIFrame.prototype.prepend.call(this, child);
  }, function toolwidget(path, inherit_flag, label) {
    if (inherit_flag==undefined) {
        inherit_flag = 0;
    }
    if (label==undefined) {
        label = undefined;
    }
    var ret=this.toolop(path, inherit_flag, label);
    ret.path_exec_widget = true;
    return ret;
  }, function _inherit_packflag(inherit_flag) {
    var icon_size=inherit_flag&(PackFlags.USE_LARGE_ICON|PackFlags.USE_SMALL_ICON);
    if (icon_size==0) {
        icon_size = this.default_packflag&(PackFlags.USE_LARGE_ICON|PackFlags.USE_SMALL_ICON);
    }
    inherit_flag|=this.default_packflag&~(PackFlags.USE_SMALL_ICON|PackFlags.USE_SMALL_ICON);
    inherit_flag|=icon_size;
    return inherit_flag;
  }, function toolop(path, inherit_flag, label) {
    if (inherit_flag==undefined) {
        inherit_flag = 0;
    }
    if (label==undefined) {
        label = undefined;
    }
    var ctx=this.ctx;
    var opname=ctx.api.get_op_uiname(ctx, path);
    inherit_flag = this._inherit_packflag(inherit_flag);
    if (opname==undefined) {
        console.trace();
        console.log("couldn't find tool operator at path"+path+".");
        return ;
    }
    if (label!=undefined)
      opname = label;
    if (inherit_flag&PackFlags.USE_ICON) {
        var op=ctx.api.get_op(ctx, path);
        if (op==undefined) {
            console.trace();
            console.log("Error fetching operator ", path);
            var c=new UIButton(ctx, "???");
            c.packflag|=inherit_flag;
            this.add(c);
            return c;
        }
        if (DEBUG.icons)
          console.log("icon toolop", op.icon);
        if (op.icon>=0) {
            var use_small=inherit_flag&PackFlags.USE_SMALL_ICON;
            var c=new UIButtonIcon(ctx, opname, op.icon, [0, 0], [0, 0], path, undefined, undefined, use_small);
            c.packflag|=inherit_flag;
            this.add(c);
            return c;
        }
    }
    var c=new UIButton(ctx, opname, [0, 0], [0, 0], path);
    if (inherit_flag!=undefined)
      c.packflag|=inherit_flag;
    this.add(c);
    return c;
  }, function pack(canvas, isVertical) {
    var arr=[0, 0];
    var mm=this.mm;
    if (this.state&UIFlags.HAS_PAN) {
        mm.reset();
        var __iter_c=__get_iter(this.children);
        var c;
        while (1) {
          var __ival_c=__iter_c.next();
          if (__ival_c.done) {
              break;
          }
          c = __ival_c.value;
          arr[0] = c.pos[0]+c.size[0];
          arr[1] = c.pos[1]+c.size[1];
          mm.minmax(c.pos);
          mm.minmax(arr);
        }
        if (this.packflag&PackFlags.CALC_NEGATIVE_PAN) {
            this.pan_bounds[0] = new Vector2(mm.min).sub(mm.max).mulScalar(0.5);
            this.pan_bounds[1] = new Vector2(mm.max).sub(mm.min);
        }
        else {
          this.pan_bounds[1] = new Vector2(mm.max).sub(mm.min);
          this.pan_bounds[1][0]-=this.size[0];
          this.pan_bounds[1][1]-=this.size[1];
        }
        if (this.packflag&PackFlags.PAN_X_ONLY) {
            this.pan_bounds[0][1] = this.pan_bounds[1][1] = 0.0;
        }
        else 
          if (this.packflag&PackFlags.PAN_Y_ONLY) {
            this.pan_bounds[0][0] = this.pan_bounds[1][0] = 0.0;
        }
    }
  }, function prop(path, packflag, setter_path) {
    if (packflag==undefined) {
        packflag = 0;
    }
    if (setter_path==undefined) {
        setter_path = undefined;
    }
    packflag = this._inherit_packflag(packflag);
    if (this.path_prefix.length>0)
      path = this.path_prefix+"."+path;
    if (setter_path==undefined)
      setter_path = path;
    var ctx=this.ctx;
    var prop=ctx.api.get_prop_meta(ctx, path);
    if (prop==undefined) {
        console.trace();
        console.log("couldn't find property: "+path+".", this.path_prefix);
        return ;
    }
    if (prop.type==PropTypes.INT||prop.type==PropTypes.FLOAT) {
        var range=prop.range;
        if (prop.range==undefined||(prop.range[0]==0&&prop.range[1]==0)) {
            range = [-2000, 2000];
        }
        var c=new UINumBox(ctx, prop.uiname, range, prop.data, [0, 0], [0, 0], path);
        c.packflag = packflag;
        c.unit = prop.unit;
        c.setter_path = setter_path;
        this.add(c);
    }
    else 
      if (prop.type==PropTypes.ENUM&&(packflag&PackFlags.ENUM_STRIP)) {
        var checkmap={};
        var this2=this;
        prop.ctx = ctx;
        function update_enum(chk, val) {
          if (!val) {
              chk.set = true;
              return ;
          }
          for (var k in checkmap) {
              var check=checkmap[k];
              if (check===chk) {
                  this2.ctx.api.set_prop(this2.ctx, path, prop.keys[k]);
                  continue;
              }
              check.set = false;
              check.do_recalc();
          }
          var val=prop.values[k];
        }
        var subframe;
        if (__instance_of(this, ColumnFrame)) {
            subframe = this.col();
        }
        else {
          subframe = this.row();
        }
        subframe.packflag|=packflag|PackFlags.NO_AUTO_SPACING|PackFlags.NO_LEAD_SPACING|PackFlags.NO_TRAIL_SPACING;
        var large_icon=packflag&PackFlags.USE_LARGE_ICON;
        subframe.pad[0] = large_icon ? -4 : -2;
        subframe.pad[1] = large_icon ? -4 : -3;
        function update_callback(chk) {
          var val=undefined;
          for (var k in checkmap) {
              var check=checkmap[k];
              if (check===chk) {
                  val = k;
                  break;
              }
          }
          if (val==undefined) {
              console.log("error with ui enum strip; path:", path);
              return ;
          }
          val = ctx.api.get_prop(ctx, path)==prop.keys[val];
          if (!!val!=!!chk.set) {
              chk.set = val;
              chk.do_recalc();
          }
        }
        if (packflag&PackFlags.USE_ICON) {
            for (var k in prop.values) {
                var label=prop.ui_value_names!=undefined ? prop.ui_value_names[k] : k;
                if (label==undefined)
                  label = "(error)";
                var c=new UIIconCheck(ctx, "", prop.iconmap[prop.values[k]]);
                c.packflag|=packflag;
                c.setter_path = setter_path;
                c.callback = update_enum;
                c.icon = prop.iconmap[k];
                c.draw_check = false;
                c.update_callback = update_callback;
                c.description = label+"\n"+prop.description;
                if (prop.get_value()==prop.values[k])
                  c.set = true;
                subframe.add(c);
                checkmap[prop.values[k]] = c;
            }
        }
        else {
          for (var k in prop.values) {
              var label=prop.ui_value_names!=undefined ? prop.ui_value_names[k] : k;
              if (label==undefined)
                label = "(error)";
              var c=new UICheckBox(ctx, label);
              c.setter_path = setter_path;
              c.callback = update_enum;
              c.draw_check = false;
              c.update_callback = update_callback;
              if (prop.get_value()==prop.values[k])
                c.set = true;
              subframe.add(c);
              checkmap[prop.values[k]] = c;
          }
        }
        return subframe;
    }
    else 
      if (prop.type==PropTypes.ENUM) {
        var c=new UIMenuButton(ctx, undefined, [0, 0], [0, 0], path);
        c.setter_path = setter_path;
        c.packflag|=packflag;
        this.add(c);
        return c;
    }
    else 
      if ((prop.type==PropTypes.VEC3&&prop.subtype==PropTypes.COLOR3)||(prop.type==PropTypes.VEC4&&prop.subtype==PropTypes.COLOR4)) {
        if (packflag&PackFlags.COLOR_BUTTON_ONLY) {
            var colorb=new UIColorButton(ctx, packflag|this.default_packflag);
            colorb.state|=UIFlags.USE_PATH;
            colorb.data_path = path;
            colorb.setter_path = setter_path;
            this.add(colorb, packflag);
            return colorb;
        }
        else {
          var field=new UIColorPicker(ctx, undefined, prop.subtype==PropTypes.COLOR3 ? 3 : 4);
          field.state|=UIFlags.USE_PATH;
          field.data_path = path;
          field.setter_path = setter_path;
          this.add(field, packflag);
          return field;
        }
    }
    else 
      if (prop.type==PropTypes.VEC2) {
        range = (prop.range!=undefined&&prop.range[0]!=undefined) ? prop.range : [-2000, 2000];
        var row=this.row();
        row.packflag = packflag;
        row.label(prop.uiname);
        var c=new UINumBox(ctx, "X", range, prop.data, [0, 0], [0, 0], path+"[0]");
        c.unit = prop.unit;
        c.setter_path = setter_path+"[0]";
        c.packflag|=packflag;
        row.add(c);
        var c=new UINumBox(ctx, "Y", range, prop.data, [0, 0], [0, 0], path+"[1]");
        c.unit = prop.unit;
        c.setter_path = setter_path+"[1]";
        c.packflag|=packflag;
        row.add(c);
        return row;
    }
    else 
      if (prop.type==PropTypes.VEC3) {
        range = (prop.range!=undefined&&prop.range[0]!=undefined) ? prop.range : [-2000, 2000];
        var row=this.row();
        row.packflag = packflag;
        row.label(prop.uiname);
        var c=new UINumBox(ctx, "X", range, prop.data, [0, 0], [0, 0], path+"[0]");
        c.unit = prop.unit;
        c.setter_path = setter_path+"[0]";
        c.packflag|=packflag;
        row.add(c);
        var c=new UINumBox(ctx, "Y", range, prop.data, [0, 0], [0, 0], path+"[1]");
        c.unit = prop.unit;
        c.setter_path = setter_path+"[1]";
        c.packflag|=packflag;
        row.add(c);
        var c=new UINumBox(ctx, "Z", range, prop.data, [0, 0], [0, 0], path+"[2]");
        c.unit = prop.unit;
        c.setter_path = setter_path+"[2]";
        c.packflag|=packflag;
        row.add(c);
        return row;
    }
    else 
      if (prop.type==PropTypes.VEC4) {
        range = (prop.range!=undefined&&prop.range[0]!=undefined) ? prop.range : [-2000, 2000];
        var row=this.row();
        row.label(prop.uiname);
        var c=new UINumBox(ctx, "X", range, prop.data, [0, 0], [0, 0], path+"[0]");
        c.setter_path = setter_path+"[0]";
        c.packflag|=packflag;
        c.unit = prop.unit;
        row.add(c);
        var c=new UINumBox(ctx, "Y", range, prop.data, [0, 0], [0, 0], path+"[1]");
        c.setter_path = setter_path+"[1]";
        c.packflag|=packflag;
        c.unit = prop.unit;
        row.add(c);
        var c=new UINumBox(ctx, "Z", range, prop.data, [0, 0], [0, 0], path+"[2]");
        c.setter_path = setter_path+"[2]";
        c.packflag|=packflag;
        c.unit = prop.unit;
        row.add(c);
        var c=new UINumBox(ctx, "W", range, prop.data, [0, 0], [0, 0], path+"[3]");
        c.setter_path = setter_path+"[3]";
        c.packflag|=packflag;
        c.unit = prop.unit;
        row.add(c);
        return row;
    }
    else 
      if (prop.type==PropTypes.STRING&&(prop.flag&TPropFlags.LABEL)) {
        var ret=this.label(path, true, packflag);
        ret.setter_path = setter_path;
        return ret;
    }
    else 
      if (prop.type==PropTypes.BOOL) {
        var check;
        if (packflag&PackFlags.USE_ICON) {
            check = new UIIconCheck(ctx, "", prop.icon, undefined, undefined, path);
        }
        else {
          check = new UICheckBox(ctx, prop.uiname, undefined, undefined, path);
        }
        check.setter_path = setter_path;
        check.packflag|=packflag;
        this.add(check);
    }
    else 
      if (prop.type==PropTypes.FLAG) {
        var row=this.row();
        row.packflag|=packflag;
        if (path.trim().endsWith("]")) {
            var s=path.trim();
            var i=s.length-1;
            while (i>=0&&s[i-1]!="[") {
              i--;
            }
            var key=s.slice(i, s.length-1).trim();
            var uiname=prop.ui_key_names[key];
            if (uiname==undefined) {
                console.log("WARNING: possibly bad flag mask (will try interpreting it as integer)", path);
                key = parseInt(key);
                uiname = prop.ui_key_names[key];
            }
            if (isNaN(parseInt(key))&&key in prop.keys) {
                key = prop.keys[key];
            }
            if (uiname==undefined)
              uiname = "(corrupted)";
            var check=new UICheckBox(ctx, uiname, undefined, undefined, path);
            this.add(check);
            if (key in prop.flag_descriptions) {
                check.description = prop.flag_descriptions[key];
            }
            check.packflag|=PackFlags.INHERIT_WIDTH;
            check.setter_path = setter_path;
            return check;
        }
        else {
          row.label(prop.uiname+":");
          for (var k in prop.keys) {
              var uiname=prop.ui_key_names[k];
              var path2=path+"["+k+"]";
              var check=new UICheckBox(ctx, uiname, undefined, undefined, path2);
              check.packflag|=PackFlags.INHERIT_WIDTH;
              check.setter_path = setter_path+"["+k+"]";
              if (k in prop.flag_descriptions) {
                  check.description = prop.flag_descriptions[k];
              }
              row.add(check);
          }
          return check;
        }
    }
    else 
      if (prop.type==PropTypes.DATAREF) {
        var c=new UIMenuButton(ctx, undefined, [0, 0], [0, 0], path);
        c.setter_path = setter_path;
        c.packflag|=packflag;
        this.add(c);
    }
    else {
      if (1||DEBUG.ui_datapaths)
        console.log("warning: unimplemented property type for path "+path+" in user interface code");
    }
  }, function label(text, use_path, align) {
    if (use_path==undefined) {
        use_path = false;
    }
    if (align==undefined) {
        align = 0;
    }
    align = this._inherit_packflag(align);
    if (use_path!=undefined&&use_path) {
        var c=new UILabel(this.ctx, "", [0, 0], [0, 0], text);
        this.add(c);
        if (align)
          c.packflag|=align;
        return c;
    }
    else {
      var c=new UILabel(this.ctx, text, [0, 0], [0, 0], undefined);
      this.add(c);
      if (align)
        c.packflag|=align;
      return c;
    }
  }, function tabstrip(align, default_packflag) {
    if (align==undefined) {
        align = 0;
    }
    if (default_packflag==undefined) {
        default_packflag = 0;
    }
    var flip=this.default_packflag&PackFlags.FLIP_TABSTRIP;
    flip = flip||(align&PackFlags.FLIP_TABSTRIP);
    var ret=new UITabPanel(this.ctx, undefined, undefined, flip);
    ret.packflag|=align|PackFlags.INHERIT_WIDTH;
    ret.default_packflag = this._inherit_packflag(default_packflag);
    this.add(ret);
    return ret;
  }, function panel(label, permid, align, default_packflag) {
    if (align==undefined) {
        align = 0;
    }
    if (default_packflag==undefined) {
        default_packflag = 0;
    }
    align|=this.default_packflag;
    var ret=new UIPanel(this.ctx, label, permid);
    ret.packflag|=align|PackFlags.INHERIT_WIDTH;
    ret.default_packflag = this.default_packflag|default_packflag;
    this.add(ret);
    return ret;
  }, function row(path_prefix, align, default_packflag) {
    if (path_prefix==undefined) {
        path_prefix = "";
    }
    if (align==undefined) {
        align = 0;
    }
    if (default_packflag==undefined) {
        default_packflag = 0;
    }
    align|=this.default_packflag;
    var row=new RowFrame(this.ctx, this.path_prefix);
    this.add(row);
    row.default_packflag|=default_packflag|this.default_packflag;
    row.packflag|=align;
    return row;
  }, function col(path_prefix, align, default_packflag) {
    if (path_prefix==undefined) {
        path_prefix = "";
    }
    if (align==undefined) {
        align = 0;
    }
    if (default_packflag==undefined) {
        default_packflag = 0;
    }
    align|=this.default_packflag;
    var col=new ColumnFrame(this.ctx, this.path_prefix);
    this.add(col);
    col.default_packflag|=default_packflag|this.default_packflag;
    col.packflag|=align;
    return col;
  }, function on_tick() {
    UIFrame.prototype.on_tick.call(this);
    if (time_ms()-this._last_pack_recalc>300) {
        this._pack_recalc();
        this._last_pack_recalc = time_ms();
    }
  }, function _pack_recalc() {
    if (time_ms()-this.last_ms<40) {
        return ;
    }
    this.last_ms = time_ms();
    if (this.last_pos.vectorDistance(this.pos)>0.0001||this.last_size.vectorDistance(this.size)>1e-05) {
        if (DEBUG.complex_ui_recalc) {
            console.log("complex ui recalc", this.pos.toString(), this.last_pos.toString(), this.last_pos.vectorDistance(this.pos), this.last_size.vectorDistance(this.size));
        }
        this.parent.do_full_recalc();
        this.do_recalc();
        var __iter_c=__get_iter(this.children);
        var c;
        while (1) {
          var __ival_c=__iter_c.next();
          if (__ival_c.done) {
              break;
          }
          c = __ival_c.value;
          if (!(__instance_of(c, UIFrame))) {
              c.recalc = 1;
          }
        }
        this.last_pos.load(this.pos);
        this.last_size.load(this.size);
    }
  }]);
  _es6_module.add_class(UIPackFrame);
  UIPackFrame = _es6_module.add_export('UIPackFrame', UIPackFrame);
  var RowFrame=_ESClass("RowFrame", UIPackFrame, [function RowFrame(ctx, path_prefix, align) {
    UIPackFrame.call(this, ctx, path_prefix);
    this.packflag|=PackFlags.INHERIT_HEIGHT|align;
    this.pad = [4, 4];
  }, function get_min_size(canvas, isvertical) {
    if (canvas==undefined) {
        console.trace();
        console.log("Warning: undefined canvas in get_min_size");
        return ;
    }
    var maxwidth=0;
    var tothgt=0;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      var size;
      if (!(c.packflag&PackFlags.KEEP_SIZE))
        size = c.cached_min_size(canvas, isvertical);
      else 
        size = c.size;
      tothgt+=size[1]+this.pad[1];
      maxwidth = Math.max(maxwidth, size[0]+2);
    }
    if (this.min_size!=undefined) {
        maxwidth = Math.max(maxwidth, this.min_size[0]);
        tothgt = Math.max(tothgt, this.min_size[1]);
    }
    return [Math.max(maxwidth, 1), Math.max(tothgt, 1)];
  }, function pack(canvas, is_vertical) {
    if (canvas==undefined) {
        console.trace();
        console.log("Warning: undefined canvas in pack");
        return ;
    }
    if (this.size[0]==0&&this.size[1]==0) {
        this.size[0] = this.parent.size[0];
        this.size[1] = this.parent.size[1];
    }
    var minsize=this.get_min_size(canvas, is_vertical);
    var spacing;
    if (this.packflag&PackFlags.NO_AUTO_SPACING) {
        spacing = this.pad[1];
    }
    else {
      var spacing=Math.floor((this.size[1]-minsize[1])/this.children.length);
      spacing = Math.max(spacing, this.pad[1]);
    }
    var x=0;
    var y;
    if (this.packflag&PackFlags.ALIGN_BOTTOM)
      y = this.pad[1];
    else 
      y = this.size[1]-this.pad[1];
    for (var i=0; i<this.children.length; i++) {
        var c=this.children[i];
        var size;
        if (!(c.packflag&PackFlags.KEEP_SIZE))
          size = c.cached_min_size(canvas, is_vertical);
        else 
          size = c.size;
        size = [size[0], size[1]];
        size[0] = Math.min(size[0], this.size[0]);
        if (c.packflag&PackFlags.INHERIT_WIDTH)
          size[0] = this.size[0]-2;
        if (c.packflag&PackFlags.INHERIT_HEIGHT)
          size[1]+=spacing;
        if (c.size==undefined)
          c.size = [0, 0];
        c.size[0] = size[0];
        c.size[1] = size[1];
        var final_y=y;
        if (!(this.packflag&PackFlags.ALIGN_BOTTOM))
          final_y-=size[1];
        if (this.packflag&PackFlags.ALIGN_RIGHT) {
            c.pos = [this.size[0]-size[0]-x, final_y];
        }
        else 
          if (this.packflag&PackFlags.ALIGN_LEFT) {
            c.pos = [x, final_y];
        }
        else {
          c.pos = [x+Math.floor(0.5*(this.size[0]-size[0])), final_y];
        }
        var space=(c.packflag&PackFlags.INHERIT_HEIGHT) ? 0 : spacing;
        if (this.packflag&PackFlags.ALIGN_BOTTOM)
          y+=c.size[1]+space;
        else 
          y-=c.size[1]+space;
        if (!(c.packflag&PackFlags.NO_REPACK))
          c.pack(canvas, is_vertical);
    }
    UIPackFrame.prototype.pack.call(this, canvas, is_vertical);
  }]);
  _es6_module.add_class(RowFrame);
  RowFrame = _es6_module.add_export('RowFrame', RowFrame);
  var ColumnFrame=_ESClass("ColumnFrame", UIPackFrame, [function ColumnFrame(ctx, path_prefix, align) {
    UIPackFrame.call(this, ctx, path_prefix);
    this.packflag|=PackFlags.INHERIT_WIDTH|align;
    this.pad = [2, 2];
  }, function get_min_size(canvas, isvertical) {
    if (canvas==undefined) {
        console.trace();
        console.log("Warning: undefined canvas in get_min_size");
        return ;
    }
    var maxheight=0;
    var totwid=0;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      var size;
      if (!(c.packflag&PackFlags.KEEP_SIZE))
        size = c.cached_min_size(canvas, isvertical);
      else 
        size = [c.size[0], c.size[1]];
      totwid+=size[0]+this.pad[0];
      maxheight = Math.max(maxheight, size[1]+this.pad[1]);
    }
    if (this.min_size!=undefined) {
        totwid = Math.max(totwid, this.min_size[0]);
        maxheight = Math.max(maxheight, this.min_size[1]);
    }
    return [totwid, maxheight];
  }, function pack(canvas, is_vertical) {
    if (canvas==undefined) {
        console.trace();
        console.log("Warning: undefined canvas in pack");
        return ;
    }
    if (!(this.packflag&PackFlags.ALIGN_LEFT)&&!(this.packflag&PackFlags.ALIGN_RIGHT))
      this.packflag|=PackFlags.ALIGN_CENTER;
    if (this.size[0]==0&&this.size[1]==0) {
        this.size[0] = this.parent.size[0];
        this.size[1] = this.parent.size[1];
    }
    var minsize=this.get_min_size(canvas, is_vertical);
    if (this.packflag&PackFlags.NO_AUTO_SPACING) {
        spacing = this.pad[0];
    }
    else {
      var spacing=Math.floor((this.size[0]-minsize[0])/(this.children.length));
      spacing = Math.max(spacing, this.pad[0]);
    }
    var sum=0;
    var max_wid=0;
    var max_hgt=0;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      var s;
      if (!(c.packflag&PackFlags.KEEP_SIZE))
        s = c.cached_min_size(canvas, is_vertical);
      else 
        s = [c.size[0], c.size[1]];
      max_wid = Math.max(s[0], max_wid);
      max_hgt = Math.max(s[1], max_hgt);
      sum+=s[0];
    }
    if (!(this.packflag&PackFlags.IGNORE_LIMIT))
      max_wid*=((this.size[0])/sum);
    var x;
    var y;
    if (this.packflag&PackFlags.ALIGN_BOTTOM) {
        y = this.pad[1];
    }
    else 
      if (this.packflag&PackFlags.ALIGN_TOP) {
        y = this.size[1]-max_hgt-this.pad[1];
    }
    else {
      y = (this.size[1]-max_hgt)*0.5;
    }
    var startx;
    if (this.packflag&PackFlags.NO_LEAD_SPACING)
      startx = 0;
    else 
      startx = this.pad[0];
    var do_center_post=false;
    if (this.packflag&PackFlags.ALIGN_RIGHT) {
        x = this.size[0]-startx;
    }
    else 
      if (this.packflag&PackFlags.ALIGN_LEFT) {
        x = startx;
    }
    else {
      this.packflag|=PackFlags.ALIGN_CENTER;
      x = 0;
    }
    var pad=this.pad[0];
    var finalwid=0;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      var size;
      if (!(c.packflag&PackFlags.KEEP_SIZE))
        size = c.cached_min_size(canvas, is_vertical);
      else 
        size = c.size;
      size = [size[0], size[1]];
      if (!(this.packflag&PackFlags.IGNORE_LIMIT)) {
          if (c.packflag&PackFlags.INHERIT_WIDTH)
            size[0] = Math.min(size[0], max_wid-pad)+spacing;
          else 
            size[0] = Math.min(size[0], max_wid-pad);
      }
      if (c.packflag&PackFlags.INHERIT_HEIGHT)
        size[1] = this.size[1]-this.pad[1];
      if (c.size==undefined)
        c.size = [0, 0];
      c.size[0] = size[0];
      c.size[1] = size[1];
      var space=(c.packflag&PackFlags.INHERIT_WIDTH) ? 0 : spacing;
      if (this.packflag&PackFlags.ALIGN_RIGHT) {
          c.pos = [x-size[0], y];
          finalwid = this.size[0]-x-size[0]-1;
          x-=Math.floor(size[0]+pad+space);
      }
      else {
        c.pos = [x, y];
        finalwid = x+size[0];
        x+=Math.floor(size[0]+pad+space);
      }
      if (!(c.packflag&PackFlags.NO_REPACK))
        c.pack(canvas, is_vertical);
    }
    if ((this.packflag&PackFlags.ALIGN_CENTER)&&finalwid<this.size[0]) {
        var __iter_c=__get_iter(this.children);
        var c;
        while (1) {
          var __ival_c=__iter_c.next();
          if (__ival_c.done) {
              break;
          }
          c = __ival_c.value;
          if (this.packflag&PackFlags.ALIGN_RIGHT)
            c.pos[0]-=Math.floor((this.size[0]-finalwid)*0.5);
          else 
            c.pos[0]+=Math.floor((this.size[0]-finalwid)*0.5);
        }
    }
    UIPackFrame.prototype.pack.call(this, canvas, is_vertical);
  }]);
  _es6_module.add_class(ColumnFrame);
  ColumnFrame = _es6_module.add_export('ColumnFrame', ColumnFrame);
  var _te=0;
  var ToolOpFrame=_ESClass("ToolOpFrame", RowFrame, [function ToolOpFrame(ctx, path) {
    RowFrame.call(this, ctx, path);
    this.rebuild = true;
    this.strct = undefined;
    this.ctx = ctx;
  }, function do_rebuild(ctx) {
    var strct=this.ctx.api.get_struct(ctx, this.path_prefix);
    this.children.reset();
    if (strct==undefined)
      return ;
    this.strct = strct;
    var __iter_p=__get_iter(strct);
    var p;
    while (1) {
      var __ival_p=__iter_p.next();
      if (__ival_p.done) {
          break;
      }
      p = __ival_p.value;
      if (!(p.flag&PackFlags.UI_DATAPATH_IGNORE))
        this.prop(p.name, PackFlags.INHERIT_WIDTH);
    }
  }, function on_tick() {
    var strct=this.ctx.api.get_struct(this.ctx, this.path_prefix);
    if (strct!=this.strct) {
        this.do_rebuild(this.ctx);
        this.do_recalc();
        this.strct = strct;
    }
    RowFrame.prototype.on_tick.call(this);
  }, function build_draw(canvas, isVertical) {
    if (this.rebuild) {
        this.do_rebuild(this.ctx);
        this.rebuild = false;
    }
    canvas.simple_box([0, 0], this.size, [0.2, 0.2, 0.2, 0.1]);
    RowFrame.prototype.build_draw.call(this, canvas, isVertical);
  }]);
  _es6_module.add_class(ToolOpFrame);
  ToolOpFrame = _es6_module.add_export('ToolOpFrame', ToolOpFrame);
});
es6_module_define('icon', [], function _icon_module(_es6_module) {
  "use strict";
  var $ret_eOj6_enum_to_xy;
  var IconManager=_ESClass("IconManager", [function IconManager(gl, sheet_path, imgsize, iconsize) {
    this.path = sheet_path;
    this.size = new Vector2(imgsize);
    this.cellsize = new Vector2(iconsize);
    this.load(gl);
    this.texture = undefined;
    this.ready = false;
  }, function load(gl) {
    this.tex = {}
    this.tex.image = new Image();
    this.tex.image.src = this.path;
    this.te = {}
    var thetex=this.tex;
    var this2=this;
    this.tex.image.onload = function() {
      var tex=thetex;
      this2.ready = true;
    }
  }, function get_tile(tile) {
    var ret=[];
    this.gen_tile(tile, ret);
    return ret;
  }, function enum_to_xy(tile) {
    var size=this.size;
    var cellsize=this.cellsize;
    var fx=Math.floor(size[0]/cellsize[0]);
    var y=Math.floor(tile/fx);
    var x=tile%fx;
    x*=cellsize[0];
    y*=cellsize[1];
    $ret_eOj6_enum_to_xy[0] = x;
    $ret_eOj6_enum_to_xy[1] = y;
    return $ret_eOj6_enum_to_xy;
  }, function gen_tile(tile, texcos) {
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
  }]);
  var $ret_eOj6_enum_to_xy=[0, 0];
  _es6_module.add_class(IconManager);
  IconManager = _es6_module.add_export('IconManager', IconManager);
  var icon_vshader="\n\n";
  var icon_fshader="\n";
});
