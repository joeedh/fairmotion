
es6_module_define('events', ["./simple_events.js", "./util.js"], function _events_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, './util.js');
  var simple_events=es6_import(_es6_module, './simple_events.js');
  let _ex_keymap=es6_import_item(_es6_module, './simple_events.js', 'keymap');
  _es6_module.add_export('keymap', _ex_keymap, true);
  let _ex_reverse_keymap=es6_import_item(_es6_module, './simple_events.js', 'reverse_keymap');
  _es6_module.add_export('reverse_keymap', _ex_reverse_keymap, true);
  let _ex_keymap_latin_1=es6_import_item(_es6_module, './simple_events.js', 'keymap_latin_1');
  _es6_module.add_export('keymap_latin_1', _ex_keymap_latin_1, true);
  class EventDispatcher  {
     constructor() {
      this._cbs = {};
    }
     _fireEvent(type, data) {
      let stop=false;
      data = {stopPropagation: function stopPropagation() {
          stop = true;
        }, 
     data: data};
      if (type in this._cbs) {
          for (let cb of this._cbs[type]) {
              cb(data);
              if (stop) {
                  break;
              }
          }
      }
    }
     on(type, cb) {
      if (!(type in this._cbs)) {
          this._cbs[type] = [];
      }
      this._cbs[type].push(cb);
      return this;
    }
     off(type, cb) {
      if (!(type in this._cbs)) {
          console.warn("event handler not in list", type, cb);
          return this;
      }
      let stack=this._cbs[type];
      if (stack.indexOf(cb)<0) {
          console.warn("event handler not in list", type, cb);
          return this;
      }
      stack.remove(cb);
      return this;
    }
  }
  _ESClass.register(EventDispatcher);
  _es6_module.add_class(EventDispatcher);
  EventDispatcher = _es6_module.add_export('EventDispatcher', EventDispatcher);
  function copyMouseEvent(e) {
    let ret={}
    function bind(func, obj) {
      return function () {
        return this._orig.apply(func, arguments);
      }
    }
    let exclude=new Set(["__proto__"]);
    ret._orig = e;
    for (let k in e) {
        let v=e[k];
        if (exclude.has(k)) {
            continue;
        }
        if (typeof v=="function") {
            v = bind(v);
        }
        ret[k] = v;
    }
    ret.ctrlKey = e.ctrlKey;
    ret.shiftKey = e.shiftKey;
    ret.altKey = e.altKey;
    for (let i=0; i<2; i++) {
        let key=i ? "targetTouches" : "touches";
        if (e[key]) {
            ret[key] = [];
            for (let t of e[key]) {
                let t2={};
                ret[key].push(t2);
                for (let k in t) {
                    t2[k] = t[k];
                }
            }
        }
    }
    return ret;
  }
  copyMouseEvent = _es6_module.add_export('copyMouseEvent', copyMouseEvent);
  const DomEventTypes={on_mousemove: 'mousemove', 
   on_mousedown: 'mousedown', 
   on_mouseup: 'mouseup', 
   on_touchstart: 'touchstart', 
   on_touchcancel: 'touchcanel', 
   on_touchmove: 'touchmove', 
   on_touchend: 'touchend', 
   on_mousewheel: 'mousewheel', 
   on_keydown: 'keydown', 
   on_keyup: 'keyup', 
   on_pointerdown: 'pointerdown', 
   on_pointermove: 'pointermove', 
   on_pointercancel: 'pointercancel', 
   on_pointerup: 'pointerup'}
  _es6_module.add_export('DomEventTypes', DomEventTypes);
  function getDom(dom, eventtype) {
    if (eventtype.startsWith("key"))
      return window;
    return dom;
  }
  let modalStack=[];
  modalStack = _es6_module.add_export('modalStack', modalStack);
  function isModalHead(owner) {
    return modalStack.length===0||modalStack[modalStack.length-1]===owner;
  }
  isModalHead = _es6_module.add_export('isModalHead', isModalHead);
  class EventHandler  {
     constructor() {
      this._modalstate = undefined;
    }
     pushPointerModal(dom, pointerId) {
      if (this._modalstate) {
          console.warn("pushPointerModal called twiced!");
          return ;
      }
      this._modalstate = simple_events.pushPointerModal(this, dom, pointerId);
    }
     pushModal(dom, _is_root) {
      if (this._modalstate) {
          console.warn("pushModal called twiced!");
          return ;
      }
      this._modalstate = simple_events.pushModalLight(this);
    }
     popModal() {
      if (this._modalstate!==undefined) {
          let modalstate=this._modalstate;
          simple_events.popModalLight(modalstate);
          this._modalstate = undefined;
      }
    }
  }
  _ESClass.register(EventHandler);
  _es6_module.add_class(EventHandler);
  EventHandler = _es6_module.add_export('EventHandler', EventHandler);
  function pushModal(dom, handlers) {
    console.warn("Deprecated call to pathux.events.pushModal; use api in simple_events.js instead");
    let h=new EventHandler();
    for (let k in handlers) {
        h[k] = handlers[k];
    }
    handlers.popModal = () =>      {
      return h.popModal(dom);
    }
    h.pushModal(dom, false);
    return h;
  }
  pushModal = _es6_module.add_export('pushModal', pushModal);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/events.js');


es6_module_define('expr', ["./vectormath.js", "./parseutil.js"], function _expr_module(_es6_module) {
  var vectormath=es6_import(_es6_module, './vectormath.js');
  var lexer=es6_import_item(_es6_module, './parseutil.js', 'lexer');
  var tokdef=es6_import_item(_es6_module, './parseutil.js', 'tokdef');
  var token=es6_import_item(_es6_module, './parseutil.js', 'token');
  var parser=es6_import_item(_es6_module, './parseutil.js', 'parser');
  var PUTLParseError=es6_import_item(_es6_module, './parseutil.js', 'PUTLParseError');
  let tk=(n, r, f) =>    {
    return new tokdef(n, r, f);
  }
  let count=(str, match) =>    {
    let c=0;
    do {
      let i=str.search(match);
      if (i<0) {
          break;
      }
      c++;
      str = str.slice(i+1, str.length);
    } while (1);
    
    return c;
  }
  let tokens=[tk("ID", /[a-zA-Z$_]+[a-zA-Z0-9$_]*/), tk("NUM", /[0-9]+(\.[0-9]*)?/), tk("LPAREN", /\(/), tk("RPAREN", /\)/), tk("STRLIT", /"[^"]*"/, (t) =>    {
    let v=t.value;
    t.lexer.lineno+=count(t.value, "\n");
    return t;
  }), tk("WS", /[ \t\n\r]/, (t) =>    {
    t.lexer.lineno+=count(t.value, "\n");
  }), tk("COMMA", /\,/), tk("COLON", /:/), tk("LSBRACKET", /\[/), tk("RSBRACKET", /\]/), tk("LBRACKET", /\{/), tk("RBRACKET", /\}/), tk("DOT", /\./), tk("PLUS", /\+/), tk("MINUS", /\-/), tk("TIMES", /\*/), tk("DIVIDE", /\//), tk("EXP", /\*\*/), tk("LAND", /\&\&/), tk("BAND", /\&/), tk("LOR", /\|\|/), tk("BOR", /\|/), tk("EQUALS", /=/), tk("LEQUALS", /\<\=/), tk("GEQUALS", /\>\=/), tk("LTHAN", /\</), tk("GTHAN", /\>/), tk("MOD", /\%/), tk("XOR", /\^/), tk("BITINV", /\~/)];
  let lex=new lexer(tokens, (t) =>    {
    console.log("Token error");
    return true;
  });
  let parse=new parser(lex);
  let binops=new Set([".", "/", "*", "**", "^", "%", "&", "+", "-", "&&", "||", "&", "|", "<", ">", "==", "=", "<=", ">="]);
  let precedence;
  if (1) {
      let table=[["**"], ["*", "/"], ["+", "-"], ["."], ["="], ["("], [")"]];
      let pr={};
      for (let i=0; i<table.length; i++) {
          for (let c of table[i]) {
              pr[c] = i;
          }
      }
      precedence = pr;
  }
  function indent(n, chr) {
    if (chr===undefined) {
        chr = "  ";
    }
    let s="";
    for (let i=0; i<n; i++) {
        s+=chr;
    }
    return s;
  }
  class Node extends Array {
     constructor(type) {
      super();
      this.type = type;
      this.parent = undefined;
    }
     push(n) {
      n.parent = this;
      return super.push(n);
    }
     remove(n) {
      let i=this.indexOf(n);
      if (i<0) {
          console.log(n);
          throw new Error("item not in array");
      }
      while (i<this.length) {
        this[i] = this[i+1];
        i++;
      }
      n.parent = undefined;
      this.length--;
      return this;
    }
     insert(starti, n) {
      let i=this.length-1;
      this.length++;
      if (n.parent) {
          n.parent.remove(n);
      }
      while (i>starti) {
        this[i] = this[i-1];
        i--;
      }
      n.parent = this;
      this[starti] = n;
      return this;
    }
     replace(n, n2) {
      if (n2.parent) {
          n2.parent.remove(n2);
      }
      this[this.indexOf(n)] = n2;
      n.parent = undefined;
      n2.parent = this;
      return this;
    }
     toString(t=0) {
      let tab=indent(t, "-");
      let typestr=this.type;
      if (this.value!==undefined) {
          typestr+=" : "+this.value;
      }
      else 
        if (this.op!==undefined) {
          typestr+=" ("+this.op+")";
      }
      let s=tab+typestr+" {\n";
      for (let c of this) {
          s+=c.toString(t+1);
      }
      s+=tab+"}\n";
      return s;
    }
  }
  _ESClass.register(Node);
  _es6_module.add_class(Node);
  Node = _es6_module.add_export('Node', Node);
  function parseExpr(s) {
    let p=parse;
    function Value() {
      let t=p.next();
      if (t&&t.value==="(") {
          t = p.next();
      }
      if (t===undefined) {
          p.error(undefined, "Expected a value");
          return ;
      }
      let n=new Node();
      n.value = t.value;
      if (t.type==="ID") {
          n.type = "Ident";
      }
      else 
        if (t.type==="NUM") {
          n.type = "Number";
      }
      else 
        if (t.type==="STRLIT") {
          n.type = "StrLit";
      }
      else 
        if (t.type==="MINUS") {
          let t2=p.peek_i(0);
          if (t2&&t2.type==="NUM") {
              p.next();
              n.type = "Number";
              n.value = -t2.value;
          }
          else 
            if (t2&&t2.type==="ID") {
              p.next();
              n.type = "Negate";
              let n2=new Node();
              n2.type = "Ident";
              n2.value = t2.value;
              n.push(n2);
          }
          else {
            p.error(t, "Expected a value, not '"+t.value+"'");
          }
      }
      else {
        p.error(t, "Expected a value, not '"+t.value+"'");
      }
      return n;
    }
    function bin_next(depth) {
      if (depth===undefined) {
          depth = 0;
      }
      let a=p.peek_i(0);
      let b=p.peek_i(1);
      if (b&&b.value===")") {
          b.type = a.type;
          b.value = a.value;
          p.next();
          let c=p.peek_i(2);
          if (c&&binops.has(c.value)) {
              return {value: b, 
         op: c.value, 
         prec: -10}
          }
      }
      if (b&&binops.has(b.value)) {
          return {value: a, 
       op: b.value, 
       prec: precedence[b.value]}
      }
      else {
        return Value(a);
      }
    }
    function BinOp(left, depth) {
      if (depth===undefined) {
          depth = 0;
      }
      console.log(indent(depth)+"BinOp", left.toString());
      let op=p.next();
      let right;
      let n;
      let prec=precedence[op.value];
      let r=bin_next(depth+1);
      if (__instance_of(r, Node)) {
          right = r;
      }
      else {
        if (r.prec>prec) {
            if (!n) {
                n = new Node("BinOp");
                n.op = op.value;
                n.push(left);
            }
            n.push(Value());
            return n;
        }
        else {
          right = BinOp(Value(), depth+2);
        }
      }
      n = new Node("BinOp", op);
      n.op = op.value;
      n.push(right);
      n.push(left);
      console.log("\n\n", n.toString(), "\n\n");
      left = n;
      console.log(n.toString());
      return n;
    }
    function Start() {
      let ret=Value();
      while (!p.at_end()) {
        let t=p.peek_i(0);
        if (t===undefined) {
            break;
        }
        console.log(t.toString());
        if (binops.has(t.value)) {
            console.log("binary op!");
            ret = BinOp(ret);
        }
        else 
          if (t.value===",") {
            let n=new Node();
            n.type = "ExprList";
            p.next();
            n.push(ret);
            let n2=Start();
            if (n2.type==="ExprList") {
                for (let c of n2) {
                    n.push(c);
                }
            }
            else {
              n.push(n2);
            }
            return n;
        }
        else 
          if (t.value==="(") {
            let n=new Node("FuncCall");
            n.push(ret);
            n.push(Start());
            p.expect("RPAREN");
            return n;
        }
        else 
          if (t.value===")") {
            return ret;
        }
        else {
          console.log(ret.toString());
          p.error(t, "Unexpected token "+t.value);
        }
      }
      return ret;
    }
    function Run() {
      let ret=[];
      while (!p.at_end()) {
        ret.push(Start());
      }
      return ret;
    }
    p.start = Run;
    return p.parse(s);
  }
  parseExpr = _es6_module.add_export('parseExpr', parseExpr);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/expr.js');


es6_module_define('graphpack', ["./vectormath.js", "./util.js", "./solver.js", "./math.js"], function _graphpack_module(_es6_module) {
  "use strict";
  var Vector2=es6_import_item(_es6_module, './vectormath.js', 'Vector2');
  var math=es6_import(_es6_module, './math.js');
  var util=es6_import(_es6_module, './util.js');
  var Constraint=es6_import_item(_es6_module, './solver.js', 'Constraint');
  var Solver=es6_import_item(_es6_module, './solver.js', 'Solver');
  let idgen=0;
  class PackNodeVertex extends Vector2 {
     constructor(node, co) {
      super(co);
      this.node = node;
      this._id = idgen++;
      this.edges = [];
      this._absPos = new Vector2();
    }
    get  absPos() {
      this._absPos.load(this).add(this.node.pos);
      return this._absPos;
    }
     [Symbol.keystr]() {
      return this._id;
    }
  }
  _ESClass.register(PackNodeVertex);
  _es6_module.add_class(PackNodeVertex);
  PackNodeVertex = _es6_module.add_export('PackNodeVertex', PackNodeVertex);
  class PackNode  {
     constructor() {
      this.pos = new Vector2();
      this.vel = new Vector2();
      this.oldpos = new Vector2();
      this._id = idgen++;
      this.size = new Vector2();
      this.verts = [];
    }
     [Symbol.keystr]() {
      return this._id;
    }
  }
  _ESClass.register(PackNode);
  _es6_module.add_class(PackNode);
  PackNode = _es6_module.add_export('PackNode', PackNode);
  function copyGraph(nodes) {
    let ret=[];
    let idmap={}
    for (let n of nodes) {
        let n2=new PackNode();
        n2._id = n._id;
        n2.pos.load(n.pos);
        n2.vel.load(n.vel);
        n2.size.load(n.size);
        n2.verts = [];
        idmap[n2._id] = n2;
        for (let v of n.verts) {
            let v2=new PackNodeVertex(n2, v);
            v2._id = v._id;
            idmap[v2._id] = v2;
            n2.verts.push(v2);
        }
        ret.push(n2);
    }
    for (let n of nodes) {
        for (let v of n.verts) {
            let v2=idmap[v._id];
            for (let v3 of v.edges) {
                v2.edges.push(idmap[v3._id]);
            }
        }
    }
    return ret;
  }
  function getCenter(nodes) {
    let cent=new Vector2();
    for (let n of nodes) {
        cent.add(n.pos);
    }
    if (nodes.length===0)
      return cent;
    cent.mulScalar(1.0/nodes.length);
    return cent;
  }
  function loadGraph(nodes, copy) {
    let idmap={}
    for (let i=0; i<nodes.length; i++) {
        nodes[i].pos.load(copy[i].pos);
        nodes[i].oldpos.load(copy[i].oldpos);
        nodes[i].vel.load(copy[i].vel);
    }
  }
  function graphGetIslands(nodes) {
    let islands=[];
    let visit1=new util.set();
    let rec=(n, island) =>      {
      island.push(n);
      visit1.add(n);
      for (let v of n.verts) {
          for (let e of v.edges) {
              let n2=e.node;
              if (n2!==n&&!visit1.has(n2)) {
                  rec(n2, island);
              }
          }
      }
    }
    for (let n of nodes) {
        if (visit1.has(n)) {
            continue;
        }
        let island=[];
        islands.push(island);
        rec(n, island);
    }
    return islands;
  }
  graphGetIslands = _es6_module.add_export('graphGetIslands', graphGetIslands);
  function graphPack(nodes, margin_or_args, steps, updateCb) {
    if (margin_or_args===undefined) {
        margin_or_args = 15;
    }
    if (steps===undefined) {
        steps = 10;
    }
    if (updateCb===undefined) {
        updateCb = undefined;
    }
    let margin=margin_or_args;
    let speed=1.0;
    if (typeof margin==="object") {
        let args=margin;
        margin = args.margin??15;
        steps = args.steps??10;
        updateCb = args.updateCb;
        speed = args.speed??1.0;
    }
    let orignodes=nodes;
    nodes = copyGraph(nodes);
    let decay=1.0;
    let decayi=0;
    let min=new Vector2().addScalar(1e+17);
    let max=new Vector2().addScalar(-1e+17);
    let tmp=new Vector2();
    for (let n of nodes) {
        min.min(n.pos);
        tmp.load(n.pos).add(n.size);
        max.max(tmp);
    }
    let size=new Vector2(max).sub(min);
    for (let n of nodes) {
        n.pos[0]+=(Math.random()-0.5)*5.0/size[0]*speed;
        n.pos[1]+=(Math.random()-0.5)*5.0/size[1]*speed;
    }
    let nodemap={}
    for (let n of nodes) {
        n.vel.zero();
        nodemap[n._id] = n;
        for (let v of n.verts) {
            nodemap[v._id] = v;
        }
    }
    let visit=new util.set();
    let verts=new util.set();
    let isect=[];
    let disableEdges=false;
    function edge_c(params) {
      let $_t0mvbd=params, v1=$_t0mvbd[0], v2=$_t0mvbd[1], restlen=$_t0mvbd[2];
      if (disableEdges)
        return 0;
      return Math.abs(v1.absPos.vectorDistance(v2.absPos)-restlen);
    }
    let p1=new Vector2();
    let p2=new Vector2();
    let s1=new Vector2();
    let s2=new Vector2();
    function loadBoxes(n1, n2, margin1) {
      if (margin1===undefined) {
          margin1 = margin;
      }
      p1.load(n1.pos);
      p2.load(n2.pos);
      s1.load(n1.size);
      s2.load(n2.size);
      p1.subScalar(margin1);
      p2.subScalar(margin1);
      s1.addScalar(margin1*2.0);
      s2.addScalar(margin1*2.0);
    }
    let disableArea=false;
    function area_c(params) {
      let $_t1fkmq=params, n1=$_t1fkmq[0], n2=$_t1fkmq[1];
      if (disableArea)
        return 0.0;
      loadBoxes(n1, n2);
      let a1=n1.size[0]*n1.size[1];
      let a2=n2.size[0]*n2.size[1];
      return math.aabb_overlap_area(p1, s1, p2, s2);
      return (math.aabb_overlap_area(p1, s1, p2, s2)/(a1+a2));
    }
    let lasterr, besterr, best;
    let err;
    let islands=graphGetIslands(nodes);
    let fakeVerts=[];
    for (let island of islands) {
        let n=island[0];
        let fv=new PackNodeVertex(n);
        fakeVerts.push(fv);
    }
    let solveStep1=(gk) =>      {
      if (gk===undefined) {
          gk = 1.0;
      }
      let solver=new Solver();
      isect.length = 0;
      visit = new util.set();
      if (fakeVerts.length>1) {
          for (let i=1; i<fakeVerts.length; i++) {
              let v1=fakeVerts[0];
              let v2=fakeVerts[i];
              let rlen=1.0;
              let con=new Constraint("edge_c", edge_c, [v1.node.pos, v2.node.pos], [v1, v2, rlen]);
              con.k = 0.25;
              solver.add(con);
          }
      }
      for (let n1 of nodes) {
          for (let v of n1.verts) {
              verts.add(v);
              for (let v2 of v.edges) {
                  if (v2._id<v._id)
                    continue;
                  let rlen=n1.size.vectorLength()*0.0;
                  let con=new Constraint("edge_c", edge_c, [v.node.pos, v2.node.pos], [v, v2, rlen]);
                  con.k = 1.0;
                  solver.add(con);
              }
          }
          for (let n2 of nodes) {
              if (n1===n2)
                continue;
              let key=Math.min(n1._id, n2._id)+":"+Math.max(n1._id, n2._id);
              if (visit.has(key))
                continue;
              loadBoxes(n1, n2);
              let area=math.aabb_overlap_area(p1, s1, p2, s2);
              if (area>0.01) {
                  let size=decay*(n1.size.vectorLength()+n2.size.vectorLength())*speed;
                  n1.pos[0]+=(Math.random()-0.5)*size;
                  n1.pos[1]+=(Math.random()-0.5)*size;
                  n2.pos[0]+=(Math.random()-0.5)*size;
                  n2.pos[1]+=(Math.random()-0.5)*size;
                  isect.push([n1, n2]);
                  visit.add(key);
              }
          }
          for (let /*unprocessed ExpandNode*/[n1, n2] of isect) {
              let con=new Constraint("area_c", area_c, [n1.pos, n2.pos], [n1, n2]);
              solver.add(con);
              con.k = 1.0;
          }
      }
      return solver;
    }
    let i=1;
    let solveStep=(gk) =>      {
      if (gk===undefined) {
          gk = 0.5;
      }
      let solver=solveStep1();
      if (i%40===0.0) {
          let c1=getCenter(nodes);
          let rfac=1000.0;
          if (best)
            loadGraph(nodes, best);
          for (let n of nodes) {
              n.pos[0]+=(Math.random()-0.5)*rfac*speed;
              n.pos[1]+=(Math.random()-0.5)*rfac*speed;
              n.vel.zero();
          }
          let c2=getCenter(nodes);
          c1.sub(c2);
          for (let n of nodes) {
              n.pos.add(c1);
          }
      }
      let err=1e+17;
      for (let n of nodes) {
          n.oldpos.load(n.pos);
          n.pos.addFac(n.vel, 0.5);
      }
      disableEdges = false;
      disableArea = true;
      solver.solve(1, gk);
      disableEdges = true;
      disableArea = false;
      for (let j=0; j<10; j++) {
          solver = solveStep1();
          err = solver.solve(10, gk*speed);
      }
      for (let n of nodes) {
          n.vel.load(n.pos).sub(n.oldpos);
      }
      disableEdges = false;
      disableArea = true;
      err = 0.0;
      for (let con of solver.constraints) {
          err+=con.evaluate(true);
      }
      disableEdges = false;
      disableArea = false;
      lasterr = err;
      let add=Math.random()*besterr*Math.exp(-i*0.1);
      if (besterr===undefined||err<besterr+add) {
          best = copyGraph(nodes);
          besterr = err;
      }
      i++;
      return err;
    }
    for (let j=0; j<steps; j++) {
        solveStep();
        decayi++;
        decay = Math.exp(-decayi*0.1);
    }
    min.zero().addScalar(1e+17);
    max.zero().addScalar(-1e+17);
    for (let node of (best ? best : nodes)) {
        min.min(node.pos);
        p2.load(node.pos).add(node.size);
        max.max(p2);
    }
    for (let node of (best ? best : nodes)) {
        node.pos.sub(min);
    }
    loadGraph(orignodes, best ? best : nodes);
    if (updateCb) {
        if (nodes._timer!==undefined) {
            window.clearInterval(nodes._timer);
        }
        nodes._timer = window.setInterval(() =>          {
          let time=util.time_ms();
          while (util.time_ms()-time<50) {
            let err=solveStep();
          }
          if (cconst.DEBUG.boxPacker) {
              console.log("err", (besterr/nodes.length).toFixed(2), (lasterr/nodes.length).toFixed(2), "isects", isect.length);
          }
          if (best)
            loadGraph(orignodes, best);
          if (updateCb()===false) {
              clearInterval(nodes._timer);
              return ;
          }
        }, 100);
        let timer=nodes._timer;
        return {stop: () =>            {
            if (best)
              loadGraph(nodes, best);
            window.clearInterval(timer);
            nodes._timer = undefined;
          }}
    }
  }
  graphPack = _es6_module.add_export('graphPack', graphPack);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/graphpack.js');


es6_module_define('html5_fileapi', [], function _html5_fileapi_module(_es6_module) {
  function saveFile(data, filename, exts, mime) {
    if (filename===undefined) {
        filename = "unnamed";
    }
    if (exts===undefined) {
        exts = [];
    }
    if (mime===undefined) {
        mime = "application/x-octet-stream";
    }
    let blob=new Blob([data], {type: mime});
    let url=URL.createObjectURL(blob);
    let a=document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", filename);
    a.click();
  }
  saveFile = _es6_module.add_export('saveFile', saveFile);
  function loadFile(filename, exts) {
    if (filename===undefined) {
        filename = "unnamed";
    }
    if (exts===undefined) {
        exts = [];
    }
    let input=document.createElement("input");
    input.type = "file";
    exts = exts.join(",");
    input.setAttribute("accept", exts);
    return new Promise((accept, reject) =>      {
      input.onchange = function (e) {
        if (this.files===undefined||this.files.length!==1) {
            reject("file load error");
            return ;
        }
        let file=this.files[0];
        let reader=new FileReader();
        reader.onload = function (e2) {
          accept(e2.target.result);
        }
        reader.readAsArrayBuffer(file);
      }
      input.click();
    });
  }
  loadFile = _es6_module.add_export('loadFile', loadFile);
  window._testLoadFile = function (exts) {
    if (exts===undefined) {
        exts = ["*.*"];
    }
    loadFile(undefined, exts).then((data) =>      {
      console.log("got file data:", data);
    });
  }
  window._testSaveFile = function () {
    let buf=_appstate.createFile();
    saveFile(buf, "unnamed.w3d", [".w3d"]);
  }
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/html5_fileapi.js');


es6_module_define('image', ["./util.js"], function _image_module(_es6_module) {
  var util=es6_import(_es6_module, './util.js');
  function getImageData(image) {
    if (typeof image=="string") {
        let src=image;
        image = new Image();
        image.src = src;
    }
    function render() {
      let canvas=document.createElement("canvas");
      let g=canvas.getContext("2d");
      canvas.width = image.width;
      canvas.height = image.height;
      g.drawImage(image, 0, 0);
      return g.getImageData(0, 0, image.width, image.height);
    }
    return new Promise((accept, reject) =>      {
      if (!image.complete) {
          image.onload = () =>            {
            console.log("image loaded");
            accept(render(image));
          };
      }
      else {
        accept(render(image));
      }
    });
  }
  getImageData = _es6_module.add_export('getImageData', getImageData);
  function loadImageFile() {
    return new Promise((accept, reject) =>      {
      let input=document.createElement("input");
      input.type = "file";
      input.addEventListener("change", function (e) {
        let files=this.files;
        console.log("file!", e, this.files);
        console.log("got file", e, files);
        if (files.length==0)
          return ;
        var reader=new FileReader();
        reader.onload = (e) =>          {
          var img=new Image();
          let dataurl=img.src = e.target.result;
          window._image_url = e.target.result;
          img.onload = (e) =>            {
            getImageData(img).then((data) =>              {
              data.dataurl = dataurl;
              accept(data);
            });
          }
        }
        reader.readAsDataURL(files[0]);
      });
      input.click();
    });
  }
  loadImageFile = _es6_module.add_export('loadImageFile', loadImageFile);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/image.js');


es6_module_define('math', ["./util.js", "./vectormath.js"], function _math_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, './util.js');
  var vectormath=es6_import(_es6_module, './vectormath.js');
  var Vector2=es6_import_item(_es6_module, './vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, './vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, './vectormath.js', 'Vector4');
  var Matrix4=es6_import_item(_es6_module, './vectormath.js', 'Matrix4');
  var Quat=es6_import_item(_es6_module, './vectormath.js', 'Quat');
  let dtvtmps=util.cachering.fromConstructor(Vector3, 32);
  let quad_co_rets2=util.cachering.fromConstructor(Vector2, 512);
  function quad_bilinear(v1, v2, v3, v4, u, v) {
    return -((v1-v2)*u-v1-(u*v1-u*v2+u*v3-u*v4-v1+v4)*v);
  }
  quad_bilinear = _es6_module.add_export('quad_bilinear', quad_bilinear);
  function quad_uv_2d(p, v1, v2, v3, v4) {
    let u, v;
    let v2x=v2[0]-v1[0];
    let v2y=v2[1]-v1[1];
    let v3x=v3[0]-v1[0];
    let v3y=v3[1]-v1[1];
    let v4x=v4[0]-v1[0];
    let v4y=v4[1]-v1[1];
    let x=p[0]-v1[0];
    let y=p[1]-v1[1];
    let sqrt=Math.sqrt;
    let A=2*(((v4y+y)*x-2*v4x*y)*v3y+(v4x*y-v4y*x)*(v4y+y)-((v4x-x)*v2y-v3x*y)*(v4y-y))*v2x-2*((v4x*y-v4y*x)*(v4x+x)-(v4x-x)*v3y*x+((2*v4y-y)*x-v4x*y)*v3x)*v2y+(v4x*y-v4y*x+v3y*x-v3x*y)**2+(v4x-x)**2*v2y**2+(v4y-y)**2*v2x**2;
    let B=v4x*y-v4y*x+v3y*x-v3x*y;
    let C1=(2*(v3x-v4x)*v2y-2*(v3y-v4y)*v2x);
    let C2=(2*(v3x*v4y-v3y*v4x+v2y*v4x)-2*v2x*v4y);
    let u1, u2;
    if (A<0.0) {
        console.log("A was < 0", A);
        A = -A;
        C1 = C2 = 0.0;
    }
    if (Math.abs(C1)<1e-05) {
        let dx=v2x;
        let dy=v2y;
        console.log("C1 bad");
        let l=Math.sqrt(dx*dx+dy*dy);
        if (l>1e-06) {
            dx/=l*l;
            dy/=l*l;
        }
        u1 = u2 = dx*x+dy*y;
    }
    else {
      u1 = (-(B+sqrt(A)-(v4y-y)*v2x)-(v4x-x)*v2y)/C1;
      u2 = (-(B-sqrt(A)-(v4y-y)*v2x)-(v4x-x)*v2y)/C1;
    }
    if (Math.abs(C2)<1e-05) {
        let dx, dy;
        dx = v3x-v2x;
        dy = v3y-v2y;
        console.log("C2 bad");
        let l=Math.sqrt(dx**2+dy**2);
        if (l>1e-05) {
            dx/=l*l;
            dy/=l*l;
        }
        v1 = v2 = x*dx+y*dy;
    }
    else {
      v1 = (-(B-sqrt(A)+(v4y+y)*v2x)+(v4x+x)*v2y)/C2;
      v2 = (-(B+sqrt(A)+(v4y+y)*v2x)+(v4x+x)*v2y)/C2;
    }
    let ret=quad_co_rets2.next();
    let d1=(u1-0.5)**2+(v1-0.5)**2;
    let d2=(u2-0.5)**2+(v2-0.5)**2;
    if (d1<d2) {
        ret[0] = u1;
        ret[1] = v1;
    }
    else {
      ret[0] = u2;
      ret[1] = v2;
    }
    return ret;
  }
  const ClosestModes={CLOSEST: 0, 
   START: 1, 
   END: 2, 
   ENDPOINTS: 3, 
   ALL: 4}
  _es6_module.add_export('ClosestModes', ClosestModes);
  let advs=util.cachering.fromConstructor(Vector4, 128);
  class AbstractCurve  {
     evaluate(t) {
      throw new Error("implement me");
    }
     derivative(t) {

    }
     curvature(t) {

    }
     normal(t) {

    }
     width(t) {

    }
  }
  _ESClass.register(AbstractCurve);
  _es6_module.add_class(AbstractCurve);
  AbstractCurve = _es6_module.add_export('AbstractCurve', AbstractCurve);
  class ClosestCurveRets  {
     constructor() {
      this.p = new Vector3();
      this.t = 0;
    }
  }
  _ESClass.register(ClosestCurveRets);
  _es6_module.add_class(ClosestCurveRets);
  ClosestCurveRets = _es6_module.add_export('ClosestCurveRets', ClosestCurveRets);
  let cvrets=util.cachering.fromConstructor(ClosestCurveRets, 2048);
  let cvarrays=new util.ArrayPool();
  let cvtmp=new Array(1024);
  function closestPoint(p, curve, mode) {
    let steps=5;
    let s=0, ds=1.0/steps;
    let ri=0;
    for (let i=0; i<steps; i++, s+=ds) {
        let c1=curve.evaluate(s);
        let c2=curve.evaluate(s+ds);
    }
  }
  closestPoint = _es6_module.add_export('closestPoint', closestPoint);
  let poly_normal_tmps=util.cachering.fromConstructor(Vector3, 64);
  let pncent=new Vector3();
  function normal_poly(vs) {
    if (vs.length===3) {
        return poly_normal_tmps.next().load(normal_tri(vs[0], vs[1], vs[2]));
    }
    else 
      if (vs.length===4) {
        return poly_normal_tmps.next().load(normal_quad(vs[0], vs[1], vs[2], vs[3]));
    }
    if (vs.length===0) {
        return poly_normal_tmps.next().zero();
    }
    let cent=pncent.zero();
    let tot=0;
    for (let v of vs) {
        cent.add(v);
        tot++;
    }
    cent.mulScalar(1.0/tot);
    let n=poly_normal_tmps.next().zero();
    for (let i=0; i<vs.length; i++) {
        let a=vs[i];
        let b=vs[(i+1)%vs.length];
        let c=cent;
        let n2=normal_tri(a, b, c);
        n.add(n2);
    }
    n.normalize();
    return n;
  }
  normal_poly = _es6_module.add_export('normal_poly', normal_poly);
  let barycentric_v2_rets=util.cachering.fromConstructor(Vector2, 2048);
  let calc_proj_refs=new util.cachering(() =>    {
    return [0, 0];
  }, 64);
  function dihedral_v3_sqr(v1, v2, v3, v4) {
    let bx=v2[0]-v1[0];
    let by=v2[1]-v1[1];
    let bz=v2[2]-v1[2];
    let cx=v3[0]-v1[0];
    let cy=v3[1]-v1[1];
    let cz=v3[2]-v1[2];
    let dx=v4[0]-v1[0];
    let dy=v4[1]-v1[1];
    let dz=v4[2]-v1[2];
    return ((bx*cz-bz*cx)*(cx*dz-cz*dx)+(by*cz-bz*cy)*(cy*dz-cz*dy)+(bx*cy-by*cx)*(cx*dy-cy*dx))**2/(((bx*cz-bz*cx)**2+(by*cz-bz*cy)**2+(bx*cy-by*cx)**2)*((cx*dz-cz*dx)**2+(cy*dz-cz*dy)**2+(cx*dy-cy*dx)**2));
  }
  dihedral_v3_sqr = _es6_module.add_export('dihedral_v3_sqr', dihedral_v3_sqr);
  let tet_area_tmps=util.cachering.fromConstructor(Vector3, 64);
  function tet_volume(a, b, c, d) {
    a = tet_area_tmps.next().load(a);
    b = tet_area_tmps.next().load(b);
    c = tet_area_tmps.next().load(c);
    d = tet_area_tmps.next().load(d);
    a.sub(d);
    b.sub(d);
    c.sub(d);
    b.cross(c);
    return a.dot(b)/6.0;
  }
  tet_volume = _es6_module.add_export('tet_volume', tet_volume);
  function calc_projection_axes(no) {
    let ax=Math.abs(no[0]), ay=Math.abs(no[1]), az=Math.abs(no[2]);
    let ret=calc_proj_refs.next();
    if (ax>ay&&ax>az) {
        ret[0] = 1;
        ret[1] = 2;
    }
    else 
      if (ay>az&&ay>ax) {
        ret[0] = 0;
        ret[1] = 2;
    }
    else {
      ret[0] = 0;
      ret[1] = 1;
    }
    return ret;
  }
  calc_projection_axes = _es6_module.add_export('calc_projection_axes', calc_projection_axes);
  let _avtmps=util.cachering.fromConstructor(Vector3, 128);
  function inrect_3d(p, min, max) {
    let ok=p[0]>=min[0]&&p[0]<=max[0];
    ok = ok&&p[1]>=min[1]&&p[1]<=max[1];
    ok = ok&&p[2]>=min[2]&&p[2]<=max[2];
    return ok;
  }
  function aabb_isect_line_3d(v1, v2, min, max) {
    let inside=inrect_3d(v1, min, max);
    inside = inside||inrect_3d(v2, min, max);
    if (inside) {
        return true;
    }
    let cent=_avtmps.next().load(min).interp(max, 0.5);
    let p=closest_point_on_line(cent, v1, v2, true);
    if (!p) {
        return false;
    }
    p = p[0];
    return inrect_3d(p, min, max);
  }
  aabb_isect_line_3d = _es6_module.add_export('aabb_isect_line_3d', aabb_isect_line_3d);
  function aabb_isect_cylinder_3d(v1, v2, radius, min, max) {
    let inside=inrect_3d(v1, min, max);
    inside = inside||inrect_3d(v2, min, max);
    if (inside) {
        return true;
    }
    let cent=_avtmps.next().load(min).interp(max, 0.5);
    let p=closest_point_on_line(cent, v1, v2, true);
    if (!p) {
        return false;
    }
    p = p[0];
    let size=_avtmps.next().load(max).sub(min);
    size.mulScalar(0.5);
    size.addScalar(radius);
    p.sub(cent).abs();
    return p[0]<=size[0]&&p[1]<=size[1]&&p[2]<=size[2];
  }
  aabb_isect_cylinder_3d = _es6_module.add_export('aabb_isect_cylinder_3d', aabb_isect_cylinder_3d);
  function barycentric_v2(p, v1, v2, v3, axis1, axis2, out) {
    if (axis1===undefined) {
        axis1 = 0;
    }
    if (axis2===undefined) {
        axis2 = 1;
    }
    if (out===undefined) {
        out = undefined;
    }
    let div=(v2[axis1]*v3[axis2]-v2[axis2]*v3[axis1]+(v2[axis2]-v3[axis2])*v1[axis1]-(v2[axis1]-v3[axis1])*v1[axis2]);
    if (Math.abs(div)<1e-06) {
        div = 1e-05;
    }
    let u=(v2[axis1]*v3[axis2]-v2[axis2]*v3[axis1]+(v2[axis2]-v3[axis2])*p[axis1]-(v2[axis1]-v3[axis1])*p[axis2])/div;
    let v=(-(v1[axis1]*v3[axis2]-v1[axis2]*v3[axis1]+(v1[axis2]-v3[axis2])*p[axis1])+(v1[axis1]-v3[axis1])*p[axis2])/div;
    if (!out) {
        out = barycentric_v2_rets.next();
    }
    out[0] = u;
    out[1] = v;
    return out;
  }
  barycentric_v2 = _es6_module.add_export('barycentric_v2', barycentric_v2);
  function _linedis2(co, v1, v2) {
    let v1x=v1[0]-co[0];
    let v1y=v1[1]-co[1];
    let v1z=v1[2]-co[2];
    let v2x=v2[0]-co[0];
    let v2y=v2[1]-co[1];
    let v2z=v2[2]-co[2];
    let dis=(((v1y-v2y)*v1y+(v1z-v2z)*v1z+(v1x-v2x)*v1x)*(v1y-v2y)-v1y)**2+(((v1y-v2y)*v1y+(v1z-v2z)*v1z+(v1x-v2x)*v1x)*(v1z-v2z)-v1z)**2+(((v1y-v2y)*v1y+(v1z-v2z)*v1z+(v1x-v2x)*v1x)*(v1x-v2x)-v1x)**2;
    return dis;
  }
  let closest_p_tri_rets=new util.cachering(() =>    {
    return {co: new Vector3(), 
    uv: new Vector2(), 
    dist: 0}
  }, 512);
  let cpt_v1=new Vector3();
  let cpt_v2=new Vector3();
  let cpt_v3=new Vector3();
  let cpt_v4=new Vector3();
  let cpt_v5=new Vector3();
  let cpt_v6=new Vector3();
  let cpt_p=new Vector3();
  let cpt_n=new Vector3();
  let cpt_mat=new Matrix4();
  let cpt_mat2=new Matrix4();
  let cpt_b=new Vector3();
  function closest_point_on_quad(p, v1, v2, v3, v4, n, uvw) {
    let a=closest_point_on_tri(p, v1, v2, v3, n, uvw);
    let b=closest_point_on_tri(p, v1, v3, v4, n, uvw);
    return a.dist<=b.dist ? a : b;
  }
  closest_point_on_quad = _es6_module.add_export('closest_point_on_quad', closest_point_on_quad);
  function closest_point_on_tri(p, v1, v2, v3, n, uvw) {
    let op=p;
    if (uvw) {
        uvw[0] = uvw[1] = 0.0;
        if (uvw.length>2) {
            uvw[2] = 0.0;
        }
    }
    v1 = cpt_v1.load(v1);
    v2 = cpt_v2.load(v2);
    v3 = cpt_v3.load(v3);
    p = cpt_p.load(p);
    if (n===undefined) {
        n = cpt_n.load(normal_tri(v1, v2, v3));
    }
    v1.sub(p);
    v2.sub(p);
    v3.sub(p);
    p.zero();
    let ax1, ax2;
    let ax=Math.abs(n[0]), ay=Math.abs(n[1]), az=Math.abs(n[2]);
    if (ax===0.0&&ay===0.0&&az===0.0) {
        console.log("eek1", n, v1, v2, v3);
        let ret=closest_p_tri_rets.next();
        ret.dist = 1e+17;
        ret.co.zero();
        ret.uv.zero();
        return ret;
    }
    let ax3;
    if (ax>=ay&&ax>=az) {
        ax1 = 1;
        ax2 = 2;
        ax3 = 0;
    }
    else 
      if (ay>=ax&&ay>=az) {
        ax1 = 0;
        ax2 = 2;
        ax3 = 1;
    }
    else {
      ax1 = 0;
      ax2 = 1;
      ax3 = 2;
    }
    let mat=cpt_mat;
    let mat2=cpt_mat2;
    mat.makeIdentity();
    let m=mat.$matrix;
    m.m11 = v1[ax1];
    m.m12 = v2[ax1];
    m.m13 = v3[ax1];
    m.m14 = 0.0;
    m.m21 = v1[ax2];
    m.m22 = v2[ax2];
    m.m23 = v3[ax2];
    m.m24 = 0.0;
    m.m31 = 1;
    m.m32 = 1;
    m.m33 = 1;
    m.m34 = 0.0;
    mat.transpose();
    let b=cpt_b.zero();
    b[0] = p[ax1];
    b[1] = p[ax2];
    b[2] = 1.0;
    b[3] = 0.0;
    mat2.load(mat).transpose();
    mat.preMultiply(mat2);
    if (mat.invert()===null) {
        console.log("eek2", mat.determinant(), ax1, ax2, n);
        let ret=closest_p_tri_rets.next();
        ret.dist = 1e+17;
        ret.co.zero();
        ret.uv.zero();
        return ret;
    }
    mat.multiply(mat2);
    b.multVecMatrix(mat);
    let u=b[0];
    let v=b[1];
    let w=b[2];
    for (let i=0; i<1; i++) {
        u = Math.min(Math.max(u, 0.0), 1.0);
        v = Math.min(Math.max(v, 0.0), 1.0);
        w = Math.min(Math.max(w, 0.0), 1.0);
        let tot=u+v+w;
        if (tot!==0.0) {
            tot = 1.0/tot;
            u*=tot;
            v*=tot;
            w*=tot;
        }
    }
    if (uvw) {
        uvw[0] = u;
        uvw[1] = v;
        if (uvw.length>2) {
            uvw[2] = w;
        }
    }
    let x=v1[0]*u+v2[0]*v+v3[0]*w;
    let y=v1[1]*u+v2[1]*v+v3[1]*w;
    let z=v1[2]*u+v2[2]*v+v3[2]*w;
    let ret=closest_p_tri_rets.next();
    ret.co.loadXYZ(x, y, z);
    ret.uv[0] = u;
    ret.uv[1] = v;
    ret.dist = ret.co.vectorLength();
    ret.co.add(op);
    return ret;
  }
  closest_point_on_tri = _es6_module.add_export('closest_point_on_tri', closest_point_on_tri);
  function dist_to_tri_v3_old(co, v1, v2, v3, no) {
    if (no===undefined) {
        no = undefined;
    }
    if (!no) {
        no = dtvtmps.next().load(normal_tri(v1, v2, v3));
    }
    let p=dtvtmps.next().load(co);
    p.sub(v1);
    let planedis=-p.dot(no);
    let $_t0bqwo=calc_projection_axes(no), axis=$_t0bqwo[0], axis2=$_t0bqwo[1];
    let p1=dtvtmps.next();
    let p2=dtvtmps.next();
    let p3=dtvtmps.next();
    p1[0] = v1[axis];
    p1[1] = v1[axis2];
    p1[2] = 0.0;
    p2[0] = v2[axis];
    p2[1] = v2[axis2];
    p2[2] = 0.0;
    p3[0] = v3[axis];
    p3[1] = v3[axis2];
    p3[2] = 0.0;
    let pp=dtvtmps.next();
    pp[0] = co[axis];
    pp[1] = co[axis2];
    pp[2] = 0.0;
    let dis=1e+17;
    function linedis2d(a, b, c) {
      let dx1=a[0]-b[0];
      let dy1=a[1]-b[1];
      let dx2=c[0]-b[0];
      let dy2=c[1]-b[1];
      let len=dx2*dx2+dy2*dy2;
      len = len>1e-06 ? 1.0/len : 0.0;
      dx2*=len;
      dy2*=len;
      return Math.abs(dx1*dy2-dx2*dy1);
    }
    let tmp=dtvtmps.next();
    let tmp2=dtvtmps.next();
    function linedis3d(a, b, c) {
      tmp.load(a).sub(b);
      tmp2.load(c).sub(b).normalize();
      let t=tmp.dot(tmp2);
      t = Math.min(Math.max(t, 0.0), b.vectorDistance(c));
      tmp2.mulScalar(t).add(b);
      return tmp2.vectorDistance(a);
    }
    if (point_in_tri(pp, p1, p2, p3)) {
        return Math.abs(planedis);
    }
    dis = Math.min(dis, linedis3d(co, v1, v2));
    dis = Math.min(dis, linedis3d(co, v2, v3));
    dis = Math.min(dis, linedis3d(co, v3, v1));
    if (0) {
        let uv=barycentric_v2(pp, p1, p2, p3);
        let w=1.0-uv[0]-uv[1];
        uv[0] = Math.min(Math.max(uv[0], 0.0), 1.0);
        uv[1] = Math.min(Math.max(uv[1], 0.0), 1.0);
        w = Math.min(Math.max(w, 0.0), 1.0);
        let sum=(uv[0]+uv[1]+w);
        sum = sum!==0.0 ? 1.0/sum : 0.0;
        w*=sum;
        uv[0]*=sum;
        uv[1]*=sum;
        pp.zero();
        pp.addFac(v1, uv[0]);
        pp.addFac(v2, uv[1]);
        pp.addFac(v3, 1.0-uv[0]-uv[1]);
        dis = Math.min(dis, pp.vectorDistance(co));
    }
    return dis;
  }
  dist_to_tri_v3_old = _es6_module.add_export('dist_to_tri_v3_old', dist_to_tri_v3_old);
  function dist_to_tri_v3(p, v1, v2, v3, n) {
    return dist_to_tri_v3_old(p, v1, v2, v3, n);
  }
  dist_to_tri_v3 = _es6_module.add_export('dist_to_tri_v3', dist_to_tri_v3);
  let _dt3s_n=new Vector3();
  function dist_to_tri_v3_sqr(p, v1, v2, v3, n) {
    if (n===undefined) {
        n = _dt3s_n;
        n.load(normal_tri(v1, v2, v3));
    }
    let axis1, axis2, axis3;
    let nx=n[0]<0.0 ? -n[0] : n[0];
    let ny=n[1]<0.0 ? -n[1] : n[1];
    let nz=n[2]<0.0 ? -n[2] : n[2];
    const feps=1e-07;
    if (nx>ny&&nx>nz) {
        axis1 = 1;
        axis2 = 2;
        axis3 = 0;
    }
    else 
      if (ny>nx&&ny>nz) {
        axis1 = 0;
        axis2 = 2;
        axis3 = 1;
    }
    else {
      axis1 = 0;
      axis2 = 1;
      axis3 = 2;
    }
    let planedis=(p[0]-v1[0])*n[0]+(p[1]-v1[1])*n[1]+(p[2]-v1[2])*n[2];
    planedis = planedis<0.0 ? -planedis : planedis;
    let ax=v1[axis1], ay=v1[axis2], az=v1[axis3];
    let bx=v2[axis1]-ax, by=v2[axis2]-ay, bz=v2[axis3]-az;
    let cx=v3[axis1]-ax, cy=v3[axis2]-ay, cz=v3[axis3]-az;
    let bx2=bx*bx, by2=by*by, bz2=bz*bz, cx2=cx*cx, cy2=cy*cy, cz2=cz*cz;
    let x1=p[axis1]-ax;
    let y1=p[axis2]-ay;
    let z1=p[axis3]-az;
    const testf=0.0;
    let l1=Math.sqrt(bx**2+by**2);
    let l2=Math.sqrt((cx-bx)**2+(cy-by)**2);
    let l3=Math.sqrt(cx**2+cy**2);
    let s1=x1*by-y1*bx<testf;
    let s2=(x1-bx)*(cy-by)-(y1-by)*(cx-bx)<testf;
    let s3=(x1*-cy+y1*cx)<testf;
    if (1&&n[axis3]<0.0) {
        s1 = !s1;
        s2 = !s2;
        s3 = !s3;
    }
    let mask=(s1&1)|(s2<<1)|(s3<<2);
    if (mask===0||mask===7) {
        return planedis*planedis;
    }
    let d1, d2, d3, div;
    let dis=0.0;
    let lx, ly, lz;
    lx = bx;
    ly = by;
    lz = bz;
    nx = n[axis1];
    ny = n[axis2];
    nz = n[axis3];
    switch (mask) {
      case 1:
        div = (bx2+by2);
        if (div>feps) {
            d1 = (bx*y1-by*x1);
            d1 = (d1*d1)/div;
            lx = -by;
            ly = bx;
            lz = bz;
        }
        else {
          d1 = x1*x1+y1*y1;
          lx = x1;
          ly = y1;
          lz = z1;
        }
        dis = d1;
        break;
      case 3:
        lx = x1-bx;
        ly = y1-by;
        lz = z1-bz;
        dis = lx*lx+ly*ly;
        return lx*lx+ly*ly+lz*lz;
      case 2:
        div = (bx-cx)**2+(by-cy)**2;
        if (div>feps) {
            d2 = ((bx-cx)*y1-(by-cy)*x1);
            d2 = d2/div;
            lx = (by-cy);
            ly = (cx-bx);
            lz = cz-bz;
        }
        else {
          d2 = (x1-bx)*(x1-bx)+(y1-by)*(y1-by);
          lx = x1-bx;
          ly = y1-by;
          lz = z1-bz;
        }
        dis = d2;
        break;
      case 6:
        lx = x1-cx;
        ly = y1-cy;
        lz = z1-cz;
        return lx*lx+ly*ly+lz*lz;
      case 4:
        div = (cx2+cy2);
        if (div>feps) {
            d3 = (cx*y1-cy*x1);
            d3 = (d3*d3)/div;
            lx = cy;
            ly = -cx;
            lz = cz;
        }
        else {
          d3 = (x1-cx)*(x1-cx)+(y1-cy)*(y1-cy);
          lx = x1-cx;
          ly = y1-cy;
          lz = z1-cz;
        }
        dis = d3;
        break;
      case 5:
        lx = x1;
        ly = y1;
        lz = z1;
        return lx*lx+ly*ly+lz*lz;
    }
{    let d=lx*nx+ly*ny+lz*nz;
    d = -d;
    lx+=nx*d;
    ly+=ny*d;
    lz+=nz*d;
    if (0&&Math.random()>0.999) {
        console.log("d", d.toFixed(6));
        console.log(lx*nx+ly*ny+lz*nz);
    }
}
    let mul=((lx**2+ly**2)*nz**2+(lx*nx+ly*ny)**2)/((lx**2+ly**2)*nz**2);
    if (Math.random()>0.999) {
        console.log(mul.toFixed(4));
    }
    if (0) {
        let odis=dis;
        dis = x1**2+y1**2+z1**2;
        if (Math.random()>0.999) {
            console.log((dis/odis).toFixed(4), mul.toFixed(4));
        }
        mul = 1.0;
    }
    return dis*mul+planedis*planedis;
  }
  dist_to_tri_v3_sqr = _es6_module.add_export('dist_to_tri_v3_sqr', dist_to_tri_v3_sqr);
  let tri_area_temps=util.cachering.fromConstructor(Vector3, 64);
  function tri_area(v1, v2, v3) {
    let l1=v1.vectorDistance(v2);
    let l2=v2.vectorDistance(v3);
    let l3=v3.vectorDistance(v1);
    let s=(l1+l2+l3)/2.0;
    s = s*(s-l1)*(s-l2)*(s-l3);
    s = Math.max(s, 0);
    return Math.sqrt(s);
  }
  tri_area = _es6_module.add_export('tri_area', tri_area);
  function aabb_overlap_area(pos1, size1, pos2, size2) {
    let r1=0.0, r2=0.0;
    for (let i=0; i<2; i++) {
        let a1=pos1[i], a2=pos2[i];
        let b1=pos1[i]+size1[i];
        let b2=pos2[i]+size2[i];
        if (b1>=a2&&b2>=a1) {
            let r=Math.abs(a2-b1);
            r = Math.min(r, Math.abs(a1-b2));
            if (i) {
                r2 = r;
            }
            else {
              r1 = r;
            }
        }
    }
    return r1*r2;
  }
  aabb_overlap_area = _es6_module.add_export('aabb_overlap_area', aabb_overlap_area);
  function aabb_isect_2d(pos1, size1, pos2, size2) {
    let ret=0;
    for (let i=0; i<2; i++) {
        let a=pos1[i];
        let b=pos1[i]+size1[i];
        let c=pos2[i];
        let d=pos2[i]+size2[i];
        if (b>=c&&a<=d)
          ret+=1;
    }
    return ret===2;
  }
  aabb_isect_2d = _es6_module.add_export('aabb_isect_2d', aabb_isect_2d);
  
  function aabb_isect_3d(pos1, size1, pos2, size2) {
    let ret=0;
    for (let i=0; i<3; i++) {
        let a=pos1[i];
        let b=pos1[i]+size1[i];
        let c=pos2[i];
        let d=pos2[i]+size2[i];
        if (b>=c&&a<=d)
          ret+=1;
    }
    return ret===3;
  }
  aabb_isect_3d = _es6_module.add_export('aabb_isect_3d', aabb_isect_3d);
  let aabb_intersect_vs=util.cachering.fromConstructor(Vector2, 32);
  let aabb_intersect_rets=new util.cachering(() =>    {
    return {pos: new Vector2(), 
    size: new Vector2()}
  }, 512);
  function aabb_intersect_2d(pos1, size1, pos2, size2) {
    let v1=aabb_intersect_vs.next().load(pos1);
    let v2=aabb_intersect_vs.next().load(pos1).add(size1);
    let v3=aabb_intersect_vs.next().load(pos2);
    let v4=aabb_intersect_vs.next().load(pos2).add(size2);
    let min=aabb_intersect_vs.next().zero();
    let max=aabb_intersect_vs.next().zero();
    let tot=0;
    for (let i=0; i<2; i++) {
        if (v2[i]>=v3[i]&&v1[i]<=v4[i]) {
            tot++;
            min[i] = Math.max(v3[i], v1[i]);
            max[i] = Math.min(v2[i], v4[i]);
        }
    }
    if (tot!==2) {
        return undefined;
    }
    let ret=aabb_intersect_rets.next();
    ret.pos.load(min);
    ret.size.load(max).sub(min);
    return ret;
  }
  aabb_intersect_2d = _es6_module.add_export('aabb_intersect_2d', aabb_intersect_2d);
  window.test_aabb_intersect_2d = function () {
    let canvas=document.getElementById("test_canvas");
    if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.setAttribute("id", "test_canvas");
        canvas.g = canvas.getContext("2d");
        document.body.appendChild(canvas);
    }
    canvas.width = ~~(window.innerWidth*devicePixelRatio);
    canvas.height = ~~(window.innerHeight*devicePixelRatio);
    canvas.style.width = (canvas.width/devicePixelRatio)+"px";
    canvas.style.height = (canvas.height/devicePixelRatio)+"px";
    canvas.style.position = "absolute";
    canvas.style["z-index"] = "1000";
    let g=canvas.g;
    g.clearRect(0, 0, canvas.width, canvas.height);
    let sz=800;
    let a1=new Vector2([Math.random()*sz, Math.random()*sz]).floor();
    let a2=new Vector2([Math.random()*sz, Math.random()*sz]).floor();
    let b1=new Vector2([Math.random()*sz, Math.random()*sz]).floor();
    let b2=new Vector2([Math.random()*sz, Math.random()*sz]).floor();
    let p1=new Vector2();
    let s1=new Vector2();
    let p2=new Vector2();
    let s2=new Vector2();
    p1.load(a1).min(a2);
    s1.load(a1).max(a2);
    p2.load(b1).min(b2);
    s2.load(b1).max(b2);
    s1.sub(p1);
    s2.sub(p1);
    console.log(p1, s1);
    console.log(p2, s2);
    g.beginPath();
    g.rect(0, 0, canvas.width, canvas.height);
    g.fillStyle = "white";
    g.fill();
    g.beginPath();
    g.rect(p1[0], p1[1], s1[0], s1[1]);
    g.fillStyle = "rgba(255, 100, 75, 1.0)";
    g.fill();
    g.beginPath();
    g.rect(p2[0], p2[1], s2[0], s2[1]);
    g.fillStyle = "rgba(75, 100, 255, 1.0)";
    g.fill();
    let ret=aabb_intersect_2d(p1, s1, p2, s2);
    if (ret) {
        g.beginPath();
        g.rect(ret.pos[0], ret.pos[1], ret.size[0], ret.size[1]);
        g.fillStyle = "rgba(0, 0, 0, 1.0)";
        g.fill();
    }
    return {end: test_aabb_intersect_2d.end, 
    timer: test_aabb_intersect_2d.timer}
  }
  test_aabb_intersect_2d.stop = function stop() {
    if (test_aabb_intersect_2d._timer) {
        console.log("stopping timer");
        window.clearInterval(test_aabb_intersect_2d._timer);
        test_aabb_intersect_2d._timer = undefined;
    }
  }
  test_aabb_intersect_2d.end = function end() {
    test_aabb_intersect_2d.stop();
    let canvas=document.getElementById("test_canvas");
    if (canvas) {
        canvas.remove();
    }
  }
  test_aabb_intersect_2d.timer = function timer(rate) {
    if (rate===undefined) {
        rate = 500;
    }
    if (test_aabb_intersect_2d._timer) {
        window.clearInterval(test_aabb_intersect_2d._timer);
        test_aabb_intersect_2d._timer = undefined;
        console.log("stopping timer");
        return ;
    }
    console.log("starting timer");
    test_aabb_intersect_2d._timer = window.setInterval(() =>      {
      test_aabb_intersect_2d();
    }, rate);
  }
  let aabb_intersect_vs3=util.cachering.fromConstructor(Vector3, 64);
  function aabb_intersect_3d(min1, max1, min2, max2) {
    let tot=0;
    for (let i=0; i<2; i++) {
        if (max1[i]>=min2[i]&&min1[i]<=max2[i]) {
            tot++;
        }
    }
    if (tot!==3) {
        return false;
    }
    return true;
  }
  aabb_intersect_3d = _es6_module.add_export('aabb_intersect_3d', aabb_intersect_3d);
  function aabb_union(a, b) {
    for (let i=0; i<2; i++) {
        for (let j=0; j<a[i].length; j++) {
            a[i][j] = i ? Math.max(a[i][j], b[i][j]) : Math.min(a[i][j], b[i][j]);
        }
    }
    return a;
  }
  aabb_union = _es6_module.add_export('aabb_union', aabb_union);
  function aabb_union_2d(pos1, size1, pos2, size2) {
    let v1=aabb_intersect_vs.next();
    let v2=aabb_intersect_vs.next();
    let min=aabb_intersect_vs.next();
    let max=aabb_intersect_vs.next();
    v1.load(pos1).add(size1);
    v2.load(pos2).add(size2);
    min.load(v1).min(v2);
    max.load(v1).max(v2);
    max.sub(min);
    let ret=aabb_intersect_rets.next();
    ret.pos.load(min);
    ret.pos.load(max);
    return ret;
  }
  aabb_union_2d = _es6_module.add_export('aabb_union_2d', aabb_union_2d);
  function init_prototype(cls, proto) {
    for (let k in proto) {
        cls.prototype[k] = proto[k];
    }
    return cls.prototype;
  }
  function inherit(cls, parent, proto) {
    cls.prototype = Object.create(parent.prototype);
    for (let k in proto) {
        cls.prototype[k] = proto[k];
    }
    return cls.prototype;
  }
  let set=util.set;
  let $_mh, $_swapt;
  const feps=2.22e-16;
  _es6_module.add_export('feps', feps);
  const COLINEAR=1;
  _es6_module.add_export('COLINEAR', COLINEAR);
  const LINECROSS=2;
  _es6_module.add_export('LINECROSS', LINECROSS);
  const COLINEAR_ISECT=3;
  _es6_module.add_export('COLINEAR_ISECT', COLINEAR_ISECT);
  let _cross_vec1=new Vector3();
  let _cross_vec2=new Vector3();
  const SQRT2=Math.sqrt(2.0);
  _es6_module.add_export('SQRT2', SQRT2);
  const FEPS_DATA={F16: 1.11e-16, 
   F32: 5.96e-08, 
   F64: 0.000488}
  _es6_module.add_export('FEPS_DATA', FEPS_DATA);
  const FEPS=FEPS_DATA.F32;
  _es6_module.add_export('FEPS', FEPS);
  const FLOAT_MIN=-1e+21;
  _es6_module.add_export('FLOAT_MIN', FLOAT_MIN);
  const FLOAT_MAX=1e+22;
  _es6_module.add_export('FLOAT_MAX', FLOAT_MAX);
  const Matrix4UI=Matrix4;
  _es6_module.add_export('Matrix4UI', Matrix4UI);
  let _static_grp_points4=new Array(4);
  let _static_grp_points8=new Array(8);
  function get_rect_points(p, size) {
    let cs;
    if (p.length===2) {
        cs = _static_grp_points4;
        cs[0] = p;
        cs[1] = [p[0]+size[0], p[1]];
        cs[2] = [p[0]+size[0], p[1]+size[1]];
        cs[3] = [p[0], p[1]+size[1]];
    }
    else 
      if (p.length===3) {
        cs = _static_grp_points8;
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
    let ps=get_rect_points(p, size);
    if (p.length===2) {
        return [[ps[0], ps[1]], [ps[1], ps[2]], [ps[2], ps[3]], [ps[3], ps[0]]];
    }
    else 
      if (p.length===3) {
        let l1=[[ps[0], ps[1]], [ps[1], ps[2]], [ps[2], ps[3]], [ps[3], ps[0]]];
        let l2=[[ps[4], ps[5]], [ps[5], ps[6]], [ps[6], ps[7]], [ps[7], ps[4]]];
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
  
  let $vs_simple_tri_aabb_isect=[0, 0, 0];
  function simple_tri_aabb_isect(v1, v2, v3, min, max) {
    $vs_simple_tri_aabb_isect[0] = v1;
    $vs_simple_tri_aabb_isect[1] = v2;
    $vs_simple_tri_aabb_isect[2] = v3;
    for (let i=0; i<3; i++) {
        let isect=true;
        for (let j=0; j<3; j++) {
            if ($vs_simple_tri_aabb_isect[j][i]<min[i]||$vs_simple_tri_aabb_isect[j][i]>=max[i])
              isect = false;
        }
        if (isect)
          return true;
    }
    return false;
  }
  simple_tri_aabb_isect = _es6_module.add_export('simple_tri_aabb_isect', simple_tri_aabb_isect);
  
  class MinMax  {
     constructor(totaxis) {
      if (totaxis===undefined) {
          totaxis = 1;
      }
      this.totaxis = totaxis;
      if (totaxis!==1) {
          let cls;
          switch (totaxis) {
            case 2:
              cls = Vector2;
              break;
            case 3:
              cls = Vector3;
              break;
            case 4:
              cls = Vector4;
              break;
            default:
              cls = Array;
              break;
          }
          this._min = new cls(totaxis);
          this._max = new cls(totaxis);
          this.min = new cls(totaxis);
          this.max = new cls(totaxis);
      }
      else {
        this.min = this.max = 0;
        this._min = FLOAT_MAX;
        this._max = FLOAT_MIN;
      }
      this.reset();
      this._static_mr_co = new Array(this.totaxis);
      this._static_mr_cs = new Array(this.totaxis*this.totaxis);
    }
    static  fromSTRUCT(reader) {
      let ret=new MinMax();
      reader(ret);
      return ret;
    }
     load(mm) {
      if (this.totaxis===1) {
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
    }
     reset() {
      let totaxis=this.totaxis;
      if (totaxis===1) {
          this.min = this.max = 0;
          this._min = FLOAT_MAX;
          this._max = FLOAT_MIN;
      }
      else {
        for (let i=0; i<totaxis; i++) {
            this._min[i] = FLOAT_MAX;
            this._max[i] = FLOAT_MIN;
            this.min[i] = 0;
            this.max[i] = 0;
        }
      }
    }
     minmax_rect(p, size) {
      let totaxis=this.totaxis;
      let cs=this._static_mr_cs;
      if (totaxis===2) {
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
      for (let i=0; i<cs.length; i++) {
          this.minmax(cs[i]);
      }
    }
     minmax(p) {
      let totaxis=this.totaxis;
      if (totaxis===1) {
          this._min = this.min = Math.min(this._min, p);
          this._max = this.max = Math.max(this._max, p);
      }
      else 
        if (totaxis===2) {
          this._min[0] = this.min[0] = Math.min(this._min[0], p[0]);
          this._min[1] = this.min[1] = Math.min(this._min[1], p[1]);
          this._max[0] = this.max[0] = Math.max(this._max[0], p[0]);
          this._max[1] = this.max[1] = Math.max(this._max[1], p[1]);
      }
      else 
        if (totaxis===3) {
          this._min[0] = this.min[0] = Math.min(this._min[0], p[0]);
          this._min[1] = this.min[1] = Math.min(this._min[1], p[1]);
          this._min[2] = this.min[2] = Math.min(this._min[2], p[2]);
          this._max[0] = this.max[0] = Math.max(this._max[0], p[0]);
          this._max[1] = this.max[1] = Math.max(this._max[1], p[1]);
          this._max[2] = this.max[2] = Math.max(this._max[2], p[2]);
      }
      else {
        for (let i=0; i<totaxis; i++) {
            this._min[i] = this.min[i] = Math.min(this._min[i], p[i]);
            this._max[i] = this.max[i] = Math.max(this._max[i], p[i]);
        }
      }
    }
  }
  _ESClass.register(MinMax);
  _es6_module.add_class(MinMax);
  MinMax = _es6_module.add_export('MinMax', MinMax);
  
  MinMax.STRUCT = "\n  math.MinMax {\n    min     : vec3;\n    max     : vec3;\n    _min    : vec3;\n    _max    : vec3;\n    totaxis : int;\n  }\n";
  function winding_axis(a, b, c, up_axis) {
    let xaxis=(up_axis+1)%3;
    let yaxis=(up_axis+2)%3;
    let x1=a[xaxis], y1=a[yaxis];
    let x2=b[xaxis], y2=b[yaxis];
    let x3=c[xaxis], y3=c[yaxis];
    let dx1=x1-x2, dy1=y1-y2;
    let dx2=x3-x2, dy2=y3-y2;
    let f=dx1*dy2-dy1*dx2;
    return f>=0.0;
  }
  winding_axis = _es6_module.add_export('winding_axis', winding_axis);
  function winding(a, b, c, zero_z, tol) {
    if (zero_z===undefined) {
        zero_z = false;
    }
    if (tol===undefined) {
        tol = 0.0;
    }
    let t1=_cross_vec1;
    let t2=_cross_vec2;
    for (let i=0; i<a.length; i++) {
        t1[i] = b[i]-a[i];
        t2[i] = c[i]-a[i];
    }
    return t1[0]*t2[1]-t1[1]*t2[0]>tol;
  }
  winding = _es6_module.add_export('winding', winding);
  function inrect_2d(p, pos, size) {
    if (p===undefined||pos===undefined||size===undefined) {
        console.trace();
        console.log("Bad paramters to inrect_2d()");
        console.log("p: ", p, ", pos: ", pos, ", size: ", size);
        return false;
    }
    return p[0]>=pos[0]&&p[0]<=pos[0]+size[0]&&p[1]>=pos[1]&&p[1]<=pos[1]+size[1];
  }
  inrect_2d = _es6_module.add_export('inrect_2d', inrect_2d);
  
  let $smin_aabb_isect_line_2d=new Vector2();
  let $ssize_aabb_isect_line_2d=new Vector2();
  let $sv1_aabb_isect_line_2d=new Vector2();
  let $ps_aabb_isect_line_2d=[new Vector2(), new Vector2(), new Vector2()];
  let $l1_aabb_isect_line_2d=[0, 0];
  let $smax_aabb_isect_line_2d=new Vector2();
  let $sv2_aabb_isect_line_2d=new Vector2();
  let $l2_aabb_isect_line_2d=[0, 0];
  function aabb_isect_line_2d(v1, v2, min, max) {
    for (let i=0; i<2; i++) {
        $smin_aabb_isect_line_2d[i] = Math.min(min[i], v1[i]);
        $smax_aabb_isect_line_2d[i] = Math.max(max[i], v2[i]);
    }
    $smax_aabb_isect_line_2d.sub($smin_aabb_isect_line_2d);
    $ssize_aabb_isect_line_2d.load(max).sub(min);
    if (!aabb_isect_2d($smin_aabb_isect_line_2d, $smax_aabb_isect_line_2d, min, $ssize_aabb_isect_line_2d))
      return false;
    for (let i=0; i<4; i++) {
        if (inrect_2d(v1, min, $ssize_aabb_isect_line_2d))
          return true;
        if (inrect_2d(v2, min, $ssize_aabb_isect_line_2d))
          return true;
    }
    $ps_aabb_isect_line_2d[0] = min;
    $ps_aabb_isect_line_2d[1][0] = min[0];
    $ps_aabb_isect_line_2d[1][1] = max[1];
    $ps_aabb_isect_line_2d[2] = max;
    $ps_aabb_isect_line_2d[3][0] = max[0];
    $ps_aabb_isect_line_2d[3][1] = min[1];
    $l1_aabb_isect_line_2d[0] = v1;
    $l1_aabb_isect_line_2d[1] = v2;
    for (let i=0; i<4; i++) {
        let a=$ps_aabb_isect_line_2d[i], b=$ps_aabb_isect_line_2d[(i+1)%4];
        $l2_aabb_isect_line_2d[0] = a;
        $l2_aabb_isect_line_2d[1] = b;
        if (line_line_cross($l1_aabb_isect_line_2d, $l2_aabb_isect_line_2d))
          return true;
    }
    return false;
  }
  aabb_isect_line_2d = _es6_module.add_export('aabb_isect_line_2d', aabb_isect_line_2d);
  
  function expand_rect2d(pos, size, margin) {
    pos[0]-=Math.floor(margin[0]);
    pos[1]-=Math.floor(margin[1]);
    size[0]+=Math.floor(margin[0]*2.0);
    size[1]+=Math.floor(margin[1]*2.0);
  }
  expand_rect2d = _es6_module.add_export('expand_rect2d', expand_rect2d);
  
  function expand_line(l, margin) {
    let c=new Vector3();
    c.add(l[0]);
    c.add(l[1]);
    c.mulScalar(0.5);
    l[0].sub(c);
    l[1].sub(c);
    let l1=l[0].vectorLength();
    let l2=l[1].vectorLength();
    l[0].normalize();
    l[1].normalize();
    l[0].mulScalar(margin+l1);
    l[1].mulScalar(margin+l2);
    l[0].add(c);
    l[1].add(c);
    return l;
  }
  expand_line = _es6_module.add_export('expand_line', expand_line);
  
  function colinear(a, b, c, limit) {
    if (limit===undefined) {
        limit = 2.2e-16;
    }
    for (let i=0; i<3; i++) {
        _cross_vec1[i] = b[i]-a[i];
        _cross_vec2[i] = c[i]-a[i];
    }
    if (a.vectorDistance(b)<feps*100&&a.vectorDistance(c)<feps*100) {
        return true;
    }
    if (_cross_vec1.dot(_cross_vec1)<limit||_cross_vec2.dot(_cross_vec2)<limit)
      return true;
    _cross_vec1.cross(_cross_vec2);
    return _cross_vec1.dot(_cross_vec1)<limit;
  }
  colinear = _es6_module.add_export('colinear', colinear);
  
  let _llc_l1=[new Vector3(), new Vector3()];
  let _llc_l2=[new Vector3(), new Vector3()];
  let _llc_l3=[new Vector3(), new Vector3()];
  let _llc_l4=[new Vector3(), new Vector3()];
  let lli_v1=new Vector3(), lli_v2=new Vector3(), lli_v3=new Vector3(), lli_v4=new Vector3();
  let _zero_cn=new Vector3();
  let _tmps_cn=util.cachering.fromConstructor(Vector3, 64);
  let _rets_cn=util.cachering.fromConstructor(Vector3, 64);
  function corner_normal(vec1, vec2, width) {
    let ret=_rets_cn.next().zero();
    let vec=_tmps_cn.next().zero();
    vec.load(vec1).add(vec2).normalize();
    if (Math.abs(vec1.normalizedDot(vec2))>0.9999) {
        if (vec1.dot(vec2)>0.0001) {
            ret.load(vec1).add(vec2).normalize();
        }
        else {
          ret.load(vec1).normalize();
        }
        ret.mulScalar(width);
        return ret;
    }
    else {
    }
    vec1 = _tmps_cn.next().load(vec1).mulScalar(width);
    vec2 = _tmps_cn.next().load(vec2).mulScalar(width);
    let p1=_tmps_cn.next().load(vec1);
    let p2=_tmps_cn.next().load(vec2);
    vec1.addFac(vec1, 0.01);
    vec2.addFac(vec2, 0.01);
    let sc=1.0;
    p1[0]+=vec1[1]*sc;
    p1[1]+=-vec1[0]*sc;
    p2[0]+=-vec2[1]*sc;
    p2[1]+=vec2[0]*sc;
    let p=line_line_isect(vec1, p1, vec2, p2, false);
    if (p===undefined||p===COLINEAR_ISECT||p.dot(p)<1e-06) {
        ret.load(vec1).add(vec2).normalize().mulScalar(width);
    }
    else {
      ret.load(p);
      if (vec.dot(vec)>0&&vec.dot(ret)<0) {
          ret.load(vec).mulScalar(width);
      }
    }
    return ret;
  }
  corner_normal = _es6_module.add_export('corner_normal', corner_normal);
  function line_line_isect(v1, v2, v3, v4, test_segment) {
    if (test_segment===undefined) {
        test_segment = true;
    }
    if (test_segment&&!line_line_cross(v1, v2, v3, v4)) {
        return undefined;
    }
    let xa1=v1[0], xa2=v2[0], ya1=v1[1], ya2=v2[1];
    let xb1=v3[0], xb2=v4[0], yb1=v3[1], yb2=v4[1];
    let div=((xa1-xa2)*(yb1-yb2)-(xb1-xb2)*(ya1-ya2));
    if (div<1e-08) {
        return COLINEAR_ISECT;
    }
    else {
      let t1=(-((ya1-yb2)*xb1-(yb1-yb2)*xa1-(ya1-yb1)*xb2))/div;
      return lli_v1.load(v1).interp(v2, t1);
    }
  }
  line_line_isect = _es6_module.add_export('line_line_isect', line_line_isect);
  function line_line_cross(a, b, c, d) {
    let w1=winding(a, b, c);
    let w2=winding(c, a, d);
    let w3=winding(a, b, d);
    let w4=winding(c, b, d);
    return (w1===w2)&&(w3===w4)&&(w1!==w3);
  }
  line_line_cross = _es6_module.add_export('line_line_cross', line_line_cross);
  
  let _asi_v1=new Vector3();
  let _asi_v2=new Vector3();
  let _asi_v3=new Vector3();
  let _asi_v4=new Vector3();
  let _asi_v5=new Vector3();
  let _asi_v6=new Vector3();
  function point_in_aabb_2d(p, min, max) {
    return p[0]>=min[0]&&p[0]<=max[0]&&p[1]>=min[1]&&p[1]<=max[1];
  }
  point_in_aabb_2d = _es6_module.add_export('point_in_aabb_2d', point_in_aabb_2d);
  let _asi2d_v1=new Vector2();
  let _asi2d_v2=new Vector2();
  let _asi2d_v3=new Vector2();
  let _asi2d_v4=new Vector2();
  let _asi2d_v5=new Vector2();
  let _asi2d_v6=new Vector2();
  function aabb_sphere_isect_2d(p, r, min, max) {
    let v1=_asi2d_v1, v2=_asi2d_v2, v3=_asi2d_v3, mvec=_asi2d_v4;
    let v4=_asi2d_v5;
    p = _asi2d_v6.load(p);
    v1.load(p);
    v2.load(p);
    min = _asi_v5.load(min);
    max = _asi_v6.load(max);
    mvec.load(max).sub(min).normalize().mulScalar(r+0.0001);
    v1.sub(mvec);
    v2.add(mvec);
    v3.load(p);
    let ret=point_in_aabb_2d(v1, min, max)||point_in_aabb_2d(v2, min, max)||point_in_aabb_2d(v3, min, max);
    if (ret)
      return ret;
    v1.load(min);
    v2[0] = min[0];
    v2[1] = max[1];
    ret = ret||dist_to_line_2d(p, v1, v2)<r;
    v1.load(max);
    v2[0] = max[0];
    v2[1] = max[1];
    ret = ret||dist_to_line_2d(p, v1, v2)<r;
    v1.load(max);
    v2[0] = max[0];
    v2[1] = min[1];
    ret = ret||dist_to_line_2d(p, v1, v2)<r;
    v1.load(max);
    v2[0] = min[0];
    v2[1] = min[1];
    ret = ret||dist_to_line_2d(p, v1, v2)<r;
    return ret;
  }
  aabb_sphere_isect_2d = _es6_module.add_export('aabb_sphere_isect_2d', aabb_sphere_isect_2d);
  
  function point_in_aabb(p, min, max) {
    return p[0]>=min[0]&&p[0]<=max[0]&&p[1]>=min[1]&&p[1]<=max[1]&&p[2]>=min[2]&&p[2]<=max[2];
  }
  point_in_aabb = _es6_module.add_export('point_in_aabb', point_in_aabb);
  let asi_rect=new Array(8);
  for (let i=0; i<8; i++) {
      asi_rect[i] = new Vector3();
  }
  let aabb_sphere_isect_vs=util.cachering.fromConstructor(Vector3, 64);
  function aabb_sphere_isect(p, r, min, max) {
{    let p1=aabb_sphere_isect_vs.next().load(p);
    let min1=aabb_sphere_isect_vs.next().load(min);
    let max1=aabb_sphere_isect_vs.next().load(max);
    if (p.length===2) {
        p1[2] = 0.0;
    }
    if (min1.length===2) {
        min1[2] = 0.0;
    }
    if (max.length===2) {
        max1[2] = 0.0;
    }
    p = p1;
    min = min1;
    max = max1;
}
    let cent=aabb_sphere_isect_vs.next().load(min).interp(max, 0.5);
    p.sub(cent);
    min.sub(cent);
    max.sub(cent);
    r*=r;
    let isect=point_in_aabb(p, min, max);
    if (isect) {
        return true;
    }
    let rect=asi_rect;
    rect[0].loadXYZ(min[0], min[1], min[2]);
    rect[1].loadXYZ(min[0], max[1], min[2]);
    rect[2].loadXYZ(max[0], max[1], min[2]);
    rect[3].loadXYZ(max[0], min[1], min[2]);
    rect[4].loadXYZ(min[0], min[1], max[2]);
    rect[5].loadXYZ(min[0], max[1], max[2]);
    rect[6].loadXYZ(max[0], max[1], max[2]);
    rect[7].loadXYZ(max[0], min[1], max[2]);
    for (let i=0; i<8; i++) {
        if (p.vectorDistanceSqr(rect[i])<r) {
            return true;
        }
    }
    let p2=aabb_sphere_isect_vs.next().load(p);
    for (let i=0; i<3; i++) {
        p2.load(p);
        let i2=(i+1)%3;
        let i3=(i+2)%3;
        p2[i] = p2[i]<0.0 ? min[i] : max[i];
        p2[i2] = Math.min(Math.max(p2[i2], min[i2]), max[i2]);
        p2[i3] = Math.min(Math.max(p2[i3], min[i3]), max[i3]);
        let isect=p2.vectorDistanceSqr(p)<=r;
        if (isect) {
            return true;
        }
    }
    return false;
  }
  aabb_sphere_isect = _es6_module.add_export('aabb_sphere_isect', aabb_sphere_isect);
  
  function aabb_sphere_dist(p, min, max) {
{    let p1=aabb_sphere_isect_vs.next().load(p);
    let min1=aabb_sphere_isect_vs.next().load(min);
    let max1=aabb_sphere_isect_vs.next().load(max);
    if (p.length===2) {
        p1[2] = 0.0;
    }
    if (min1.length===2) {
        min1[2] = 0.0;
    }
    if (max.length===2) {
        max1[2] = 0.0;
    }
    p = p1;
    min = min1;
    max = max1;
}
    let cent=aabb_sphere_isect_vs.next().load(min).interp(max, 0.5);
    p.sub(cent);
    min.sub(cent);
    max.sub(cent);
    let isect=point_in_aabb(p, min, max);
    if (isect) {
        return 0.0;
    }
    let rect=asi_rect;
    rect[0].loadXYZ(min[0], min[1], min[2]);
    rect[1].loadXYZ(min[0], max[1], min[2]);
    rect[2].loadXYZ(max[0], max[1], min[2]);
    rect[3].loadXYZ(max[0], min[1], min[2]);
    rect[4].loadXYZ(min[0], min[1], max[2]);
    rect[5].loadXYZ(min[0], max[1], max[2]);
    rect[6].loadXYZ(max[0], max[1], max[2]);
    rect[7].loadXYZ(max[0], min[1], max[2]);
    let mindis;
    for (let i=0; i<8; i++) {
        let dis=p.vectorDistanceSqr(rect[i]);
        if (mindis===undefined||dis<mindis) {
            mindis = dis;
        }
    }
    let p2=aabb_sphere_isect_vs.next().load(p);
    for (let i=0; i<3; i++) {
        p2.load(p);
        let i2=(i+1)%3;
        let i3=(i+2)%3;
        p2[i] = p2[i]<0.0 ? min[i] : max[i];
        p2[i2] = Math.min(Math.max(p2[i2], min[i2]), max[i2]);
        p2[i3] = Math.min(Math.max(p2[i3], min[i3]), max[i3]);
        let dis=p2.vectorDistanceSqr(p);
        if (mindis===undefined||dis<mindis) {
            mindis = dis;
        }
    }
    return mindis===undefined ? 1e+17 : mindis;
  }
  aabb_sphere_dist = _es6_module.add_export('aabb_sphere_dist', aabb_sphere_dist);
  
  function point_in_tri(p, v1, v2, v3) {
    let w1=winding(p, v1, v2);
    let w2=winding(p, v2, v3);
    let w3=winding(p, v3, v1);
    return w1===w2&&w2===w3;
  }
  point_in_tri = _es6_module.add_export('point_in_tri', point_in_tri);
  
  function convex_quad(v1, v2, v3, v4) {
    return line_line_cross([v1, v3], [v2, v4]);
  }
  convex_quad = _es6_module.add_export('convex_quad', convex_quad);
  
  let $e1_normal_tri=new Vector3();
  let $e3_normal_tri=new Vector3();
  let $e2_normal_tri=new Vector3();
  function isNum(f) {
    let ok=typeof f==="number";
    ok = ok&&!isNaN(f)&&isFinite(f);
    return ok;
  }
  isNum = _es6_module.add_export('isNum', isNum);
  const _normal_tri_rets=util.cachering.fromConstructor(Vector3, 64);
  function normal_tri(v1, v2, v3) {
    let x1=v2[0]-v1[0];
    let y1=v2[1]-v1[1];
    let z1=v2[2]-v1[2];
    let x2=v3[0]-v1[0];
    let y2=v3[1]-v1[1];
    let z2=v3[2]-v1[2];
    if (!isNum(x1+y1+z1+z2+y2+z2)) {
        throw new Error("NaN in normal_tri");
    }
    let x3, y3, z3;
    x1 = v2[0]-v1[0];
    y1 = v2[1]-v1[1];
    z1 = v2[2]-v1[2];
    x2 = v3[0]-v1[0];
    y2 = v3[1]-v1[1];
    z2 = v3[2]-v1[2];
    x3 = y1*z2-z1*y2;
    y3 = z1*x2-x1*z2;
    z3 = x1*y2-y1*x2;
    let len=Math.sqrt(x3*x3+y3*y3+z3*z3);
    if (len>1e-05)
      len = 1.0/len;
    x3*=len;
    y3*=len;
    z3*=len;
    let n=_normal_tri_rets.next();
    if (!isNum(x3+y3+z3)) {
        throw new Error("NaN!");
    }
    n[0] = x3;
    n[1] = y3;
    n[2] = z3;
    return n;
  }
  normal_tri = _es6_module.add_export('normal_tri', normal_tri);
  
  let $n2_normal_quad=new Vector3();
  let _q1=new Vector3(), _q2=new Vector3(), _q3=new Vector3();
  function normal_quad(v1, v2, v3, v4) {
    _q1.load(normal_tri(v1, v2, v3));
    _q2.load(normal_tri(v2, v3, v4));
    _q1.add(_q2).normalize();
    return _q1;
  }
  normal_quad = _es6_module.add_export('normal_quad', normal_quad);
  function normal_quad_old(v1, v2, v3, v4) {
    let n=normal_tri(v1, v2, v3);
    $n2_normal_quad[0] = n[0];
    $n2_normal_quad[1] = n[1];
    $n2_normal_quad[2] = n[2];
    n = normal_tri(v1, v3, v4);
    $n2_normal_quad[0] = $n2_normal_quad[0]+n[0];
    $n2_normal_quad[1] = $n2_normal_quad[1]+n[1];
    $n2_normal_quad[2] = $n2_normal_quad[2]+n[2];
    let _len=Math.sqrt($n2_normal_quad[0]*$n2_normal_quad[0]+$n2_normal_quad[1]*$n2_normal_quad[1]+$n2_normal_quad[2]*$n2_normal_quad[2]);
    if (_len>1e-05)
      _len = 1.0/_len;
    $n2_normal_quad[0]*=_len;
    $n2_normal_quad[1]*=_len;
    $n2_normal_quad[2]*=_len;
    return $n2_normal_quad;
  }
  normal_quad_old = _es6_module.add_export('normal_quad_old', normal_quad_old);
  
  let _li_vi=new Vector3();
  function line_isect(v1, v2, v3, v4, calc_t) {
    if (calc_t===undefined) {
        calc_t = false;
    }
    let div=(v2[0]-v1[0])*(v4[1]-v3[1])-(v2[1]-v1[1])*(v4[0]-v3[0]);
    if (div===0.0)
      return [new Vector3(), COLINEAR, 0.0];
    let vi=_li_vi;
    vi[0] = 0;
    vi[1] = 0;
    vi[2] = 0;
    vi[0] = ((v3[0]-v4[0])*(v1[0]*v2[1]-v1[1]*v2[0])-(v1[0]-v2[0])*(v3[0]*v4[1]-v3[1]*v4[0]))/div;
    vi[1] = ((v3[1]-v4[1])*(v1[0]*v2[1]-v1[1]*v2[0])-(v1[1]-v2[1])*(v3[0]*v4[1]-v3[1]*v4[0]))/div;
    if (calc_t||v1.length===3) {
        let n1=new Vector2(v2).sub(v1);
        let n2=new Vector2(vi).sub(v1);
        let t=n2.vectorLength()/n1.vectorLength();
        n1.normalize();
        n2.normalize();
        if (n1.dot(n2)<0.0) {
            t = -t;
        }
        if (v1.length===3) {
            vi[2] = v1[2]+(v2[2]-v1[2])*t;
        }
        return [vi, LINECROSS, t];
    }
    return [vi, LINECROSS];
  }
  line_isect = _es6_module.add_export('line_isect', line_isect);
  
  let dt2l_v1=new Vector2();
  let dt2l_v2=new Vector2();
  let dt2l_v3=new Vector2();
  let dt2l_v4=new Vector2();
  let dt2l_v5=new Vector2();
  function dist_to_line_2d(p, v1, v2, clip, closest_co_out, t_out) {
    if (closest_co_out===undefined) {
        closest_co_out = undefined;
    }
    if (t_out===undefined) {
        t_out = undefined;
    }
    if (clip===undefined) {
        clip = true;
    }
    v1 = dt2l_v4.load(v1);
    v2 = dt2l_v5.load(v2);
    let n=dt2l_v1;
    let vec=dt2l_v3;
    n.load(v2).sub(v1).normalize();
    vec.load(p).sub(v1);
    let t=vec.dot(n);
    if (clip) {
        t = Math.min(Math.max(t, 0.0), v1.vectorDistance(v2));
    }
    n.mulScalar(t).add(v1);
    if (closest_co_out) {
        closest_co_out[0] = n[0];
        closest_co_out[1] = n[1];
    }
    if (t_out!==undefined) {
        t_out = t;
    }
    return n.vectorDistance(p);
  }
  dist_to_line_2d = _es6_module.add_export('dist_to_line_2d', dist_to_line_2d);
  let dt3l_v1=new Vector3();
  let dt3l_v2=new Vector3();
  let dt3l_v3=new Vector3();
  let dt3l_v4=new Vector3();
  let dt3l_v5=new Vector3();
  function dist_to_line_sqr(p, v1, v2, clip) {
    if (clip===undefined) {
        clip = true;
    }
    let px=p[0]-v1[0];
    let py=p[1]-v1[1];
    let pz=p.length<3 ? 0.0 : p[2]-v1[2];
    pz = pz===undefined ? 0.0 : pz;
    let v2x=v2[0]-v1[0];
    let v2y=v2[1]-v1[1];
    let v2z=v2.length<3 ? 0.0 : v2[2]-v1[2];
    let len=v2x*v2x+v2y*v2y+v2z*v2z;
    if (len===0.0) {
        return Math.sqrt(px*px+py*py+pz*pz);
    }
    let len2=1.0/len;
    v2x*=len2;
    v2y*=len2;
    v2z*=len2;
    let t=px*v2x+py*v2y+pz*v2z;
    if (clip) {
        t = Math.min(Math.max(t, 0.0), len);
    }
    v2x*=t;
    v2y*=t;
    v2z*=t;
    return (v2x-px)*(v2x-px)+(v2y-py)*(v2y-py)+(v2z-pz)*(v2z-pz);
  }
  dist_to_line_sqr = _es6_module.add_export('dist_to_line_sqr', dist_to_line_sqr);
  function dist_to_line(p, v1, v2, clip) {
    if (clip===undefined) {
        clip = true;
    }
    return Math.sqrt(dist_to_line_sqr(p, v1, v2, clip));
  }
  dist_to_line = _es6_module.add_export('dist_to_line', dist_to_line);
  let _cplw_vs4=util.cachering.fromConstructor(Vector4, 64);
  let _cplw_vs3=util.cachering.fromConstructor(Vector3, 64);
  let _cplw_vs2=util.cachering.fromConstructor(Vector2, 64);
  function wclip(x1, x2, w1, w2, near) {
    let r1=near*w1-x1;
    let r2=(w1-w2)*near-(x1-x2);
    if (r2===0.0)
      return 0.0;
    return r1/r2;
  }
  function clip(a, b, znear) {
    if (a-b===0.0)
      return 0.0;
    return (a-znear)/(a-b);
  }
  function clip_line_w(_v1, _v2, znear, zfar) {
    let v1=_cplw_vs4.next().load(_v1);
    let v2=_cplw_vs4.next().load(_v2);
    if ((v1[2]<1.0&&v2[2]<1.0))
      return false;
    function doclip1(v1, v2, axis) {
      if (v1[axis]/v1[3]<-1) {
          let t=wclip(v1[axis], v2[axis], v1[3], v2[3], -1);
          v1.interp(v2, t);
      }
      else 
        if (v1[axis]/v1[3]>1) {
          let t=wclip(v1[axis], v2[axis], v1[3], v2[3], 1);
          v1.interp(v2, t);
      }
    }
    function doclip(v1, v2, axis) {
      doclip1(v1, v2, axis);
      doclip1(v2, v1, axis);
    }
    function dozclip(v1, v2) {
      if (v1[2]<1) {
          let t=clip(v1[2], v2[2], 1);
          v1.interp(v2, t);
      }
      else 
        if (v2[2]<1) {
          let t=clip(v2[2], v1[2], 1);
          v2.interp(v1, t);
      }
    }
    dozclip(v1, v2, 1);
    doclip(v1, v2, 0);
    doclip(v1, v2, 1);
    for (let i=0; i<4; i++) {
        _v1[i] = v1[i];
        _v2[i] = v2[i];
    }
    return !(v1[0]/v1[3]===v2[0]/v2[3]||v1[1]/v2[3]===v2[1]/v2[3]);
  }
  clip_line_w = _es6_module.add_export('clip_line_w', clip_line_w);
  
  let _closest_point_on_line_cache=util.cachering.fromConstructor(Vector3, 64);
  let _closest_point_rets=new util.cachering(function () {
    return [0, 0];
  }, 64);
  let _closest_tmps=[new Vector3(), new Vector3(), new Vector3()];
  function closest_point_on_line(p, v1, v2, clip) {
    if (clip===undefined) {
        clip = true;
    }
    let l1=_closest_tmps[0], l2=_closest_tmps[1];
    let len;
    l1.load(v2).sub(v1);
    if (clip) {
        len = l1.vectorLength();
    }
    l1.normalize();
    l2.load(p).sub(v1);
    let t=l2.dot(l1);
    if (clip) {
        t = t<0.0 ? 0.0 : t;
        t = t>len ? len : t;
    }
    let co=_closest_point_on_line_cache.next();
    co.load(l1).mulScalar(t).add(v1);
    let ret=_closest_point_rets.next();
    ret[0] = co;
    ret[1] = t;
    return ret;
  }
  closest_point_on_line = _es6_module.add_export('closest_point_on_line', closest_point_on_line);
  let _circ_from_line_tan_vs=util.cachering.fromConstructor(Vector3, 32);
  let _circ_from_line_tan_ret=new util.cachering(function () {
    return [new Vector3(), 0];
  }, 64);
  function circ_from_line_tan(a, b, t) {
    let p1=_circ_from_line_tan_vs.next();
    let t2=_circ_from_line_tan_vs.next();
    let n1=_circ_from_line_tan_vs.next();
    p1.load(a).sub(b);
    t2.load(t).normalize();
    n1.load(p1).normalize().cross(t2).cross(t2).normalize();
    let ax=p1[0], ay=p1[1], az=p1[2], nx=n1[0], ny=n1[1], nz=n1[2];
    let r=-(ax*ax+ay*ay+az*az);
    let div=(2*(ax*nx+ay*ny+az*nz));
    if (Math.abs(div)>1e-06) {
        r/=div;
    }
    else {
      r = 1000000.0;
    }
    let ret=_circ_from_line_tan_ret.next();
    ret[0].load(n1).mulScalar(r).add(a);
    ret[1] = r;
    return ret;
  }
  circ_from_line_tan = _es6_module.add_export('circ_from_line_tan', circ_from_line_tan);
  let _circ_from_line_tan2d_vs=util.cachering.fromConstructor(Vector3, 32);
  let _circ_from_line_tan2d_ret=new util.cachering(function () {
    return [new Vector2(), 0];
  }, 64);
  function circ_from_line_tan_2d(a, b, t) {
    a = _circ_from_line_tan2d_vs.next().load(a);
    b = _circ_from_line_tan2d_vs.next().load(b);
    t = _circ_from_line_tan2d_vs.next().load(t);
    a[2] = b[2] = t[2] = 0.0;
    let p1=_circ_from_line_tan2d_vs.next();
    let t2=_circ_from_line_tan2d_vs.next();
    let n1=_circ_from_line_tan2d_vs.next();
    p1.load(a).sub(b);
    t2.load(t).normalize();
    n1.load(p1).normalize().cross(t2).cross(t2).normalize();
    if (1) {
        let cx, cy, r;
        let x1=a[0], y1=a[1];
        let x2=b[0], y2=b[1];
        let tanx1=t[0], tany1=t[1];
        let div=(4.0*((x1-x2)*tany1-(y1-y2)*tanx1)**2);
        let div2=(2.0*(x1-x2)*tany1-2.0*(y1-y2)*tanx1);
        if (Math.abs(div)<0.0001||Math.abs(div2)<0.0001) {
            let ret=_circ_from_line_tan2d_ret.next();
            ret[0].load(a).interp(b, 0.5);
            let dx=a[1]-b[1];
            let dy=b[0]-a[0];
            r = 1000000.0;
            ret[0][0]+=dx*r;
            ret[0][1]+=dy*r;
            ret[1] = r;
            return ret;
        }
        cx = (((x1+x2)*(x1-x2)-(y1-y2)**2)*tany1-2.0*(y1-y2)*tanx1*x1)/div2;
        cy = (-((y1+y2)*(y1-y2)-x2**2-(x1-2.0*x2)*x1)*tanx1+2.0*(x1-x2)*tany1*y1)/div2;
        r = (((y1-y2)**2+x2**2+(x1-2.0*x2)*x1)**2*(tanx1**2+tany1**2))/div;
        let midx=a[0]*0.5+b[0]*0.5;
        let midy=a[1]*0.5+b[1]*0.5;
        cx = 2.0*midx-cx;
        cy = 2.0*midy-cy;
        let ret=_circ_from_line_tan2d_ret.next();
        ret[0].loadXY(cx, cy);
        ret[1] = Math.sqrt(r);
        return ret;
    }
    else {
      let ax=p1[0], ay=p1[1], az=p1[2], nx=n1[0], ny=n1[1], nz=n1[2];
      let r=-(ax*ax+ay*ay+az*az);
      let div=(2*(ax*nx+ay*ny+az*nz));
      if (Math.abs(div)>1e-06) {
          r/=div;
      }
      else {
        r = 1000000.0;
      }
      let ret=_circ_from_line_tan2d_ret.next();
      ret[0].load(n1).mulScalar(r).add(a);
      ret[1] = r;
      return ret;
    }
    return ret;
  }
  circ_from_line_tan_2d = _es6_module.add_export('circ_from_line_tan_2d', circ_from_line_tan_2d);
  let _gtc_e1=new Vector3();
  let _gtc_e2=new Vector3();
  let _gtc_e3=new Vector3();
  let _gtc_p1=new Vector3();
  let _gtc_p2=new Vector3();
  let _gtc_v1=new Vector3();
  let _gtc_v2=new Vector3();
  let _gtc_p12=new Vector3();
  let _gtc_p22=new Vector3();
  let _get_tri_circ_ret=new util.cachering(function () {
    return [0, 0];
  });
  function get_tri_circ(a, b, c) {
    let v1=_gtc_v1;
    let v2=_gtc_v2;
    let e1=_gtc_e1;
    let e2=_gtc_e2;
    let e3=_gtc_e3;
    let p1=_gtc_p1;
    let p2=_gtc_p2;
    for (let i=0; i<3; i++) {
        e1[i] = b[i]-a[i];
        e2[i] = c[i]-b[i];
        e3[i] = a[i]-c[i];
    }
    for (let i=0; i<3; i++) {
        p1[i] = (a[i]+b[i])*0.5;
        p2[i] = (c[i]+b[i])*0.5;
    }
    e1.normalize();
    v1[0] = -e1[1];
    v1[1] = e1[0];
    v1[2] = e1[2];
    v2[0] = -e2[1];
    v2[1] = e2[0];
    v2[2] = e2[2];
    v1.normalize();
    v2.normalize();
    let cent;
    let type;
    for (let i=0; i<3; i++) {
        _gtc_p12[i] = p1[i]+v1[i];
        _gtc_p22[i] = p2[i]+v2[i];
    }
    let isect=line_isect(p1, _gtc_p12, p2, _gtc_p22);
    cent = isect[0];
    type = isect[1];
    e1.load(a);
    e2.load(b);
    e3.load(c);
    let r=e1.sub(cent).vectorLength();
    if (r<feps)
      r = e2.sub(cent).vectorLength();
    if (r<feps)
      r = e3.sub(cent).vectorLength();
    let ret=_get_tri_circ_ret.next();
    ret[0] = cent;
    ret[1] = r;
    return ret;
  }
  get_tri_circ = _es6_module.add_export('get_tri_circ', get_tri_circ);
  
  function gen_circle(m, origin, r, stfeps) {
    let pi=Math.PI;
    let f=-pi/2;
    let df=(pi*2)/stfeps;
    let verts=new Array();
    for (let i=0; i<stfeps; i++) {
        let x=origin[0]+r*Math.sin(f);
        let y=origin[1]+r*Math.cos(f);
        let v=m.make_vert(new Vector3([x, y, origin[2]]));
        verts.push(v);
        f+=df;
    }
    for (let i=0; i<verts.length; i++) {
        let v1=verts[i];
        let v2=verts[(i+1)%verts.length];
        m.make_edge(v1, v2);
    }
    return verts;
  }
  gen_circle = _es6_module.add_export('gen_circle', gen_circle);
  
  let cos=Math.cos;
  let sin=Math.sin;
  function rot2d(v1, A, axis) {
    let x=v1[0];
    let y=v1[1];
    if (axis===1) {
        v1[0] = x*cos(A)+y*sin(A);
        v1[2] = y*cos(A)-x*sin(A);
    }
    else {
      v1[0] = x*cos(A)-y*sin(A);
      v1[1] = y*cos(A)+x*sin(A);
    }
  }
  rot2d = _es6_module.add_export('rot2d', rot2d);
  function makeCircleMesh(gl, radius, stfeps) {
    let mesh=new Mesh();
    let verts1=gen_circle(mesh, new Vector3(), radius, stfeps);
    let verts2=gen_circle(mesh, new Vector3(), radius/1.75, stfeps);
    mesh.make_face_complex([verts1, verts2]);
    return mesh;
  }
  makeCircleMesh = _es6_module.add_export('makeCircleMesh', makeCircleMesh);
  
  function minmax_verts(verts) {
    let min=new Vector3([1000000000000.0, 1000000000000.0, 1000000000000.0]);
    let max=new Vector3([-1000000000000.0, -1000000000000.0, -1000000000000.0]);
    let __iter_v=__get_iter(verts);
    let v;
    while (1) {
      let __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      for (let i=0; i<3; i++) {
          min[i] = Math.min(min[i], v.co[i]);
          max[i] = Math.max(max[i], v.co[i]);
      }
    }
    return [min, max];
  }
  minmax_verts = _es6_module.add_export('minmax_verts', minmax_verts);
  
  function unproject(vec, ipers, iview) {
    let newvec=new Vector3(vec);
    newvec.multVecMatrix(ipers);
    newvec.multVecMatrix(iview);
    return newvec;
  }
  unproject = _es6_module.add_export('unproject', unproject);
  
  function project(vec, pers, view) {
    let newvec=new Vector3(vec);
    newvec.multVecMatrix(pers);
    newvec.multVecMatrix(view);
    return newvec;
  }
  project = _es6_module.add_export('project', project);
  
  let _sh_minv=new Vector3();
  let _sh_maxv=new Vector3();
  let _sh_start=[];
  let _sh_end=[];
  let static_cent_gbw=new Vector3();
  function get_boundary_winding(points) {
    let cent=static_cent_gbw.zero();
    if (points.length===0)
      return false;
    for (let i=0; i<points.length; i++) {
        cent.add(points[i]);
    }
    cent.divideScalar(points.length);
    let w=0, totw=0;
    for (let i=0; i<points.length; i++) {
        let v1=points[i];
        let v2=points[(i+1)%points.length];
        if (!colinear(v1, v2, cent)) {
            w+=winding(v1, v2, cent);
            totw+=1;
        }
    }
    if (totw>0)
      w/=totw;
    return Math.round(w)===1;
  }
  get_boundary_winding = _es6_module.add_export('get_boundary_winding', get_boundary_winding);
  
  class PlaneOps  {
     constructor(normal) {
      let no=normal;
      this.axis = [0, 0, 0];
      this.reset_axis(normal);
    }
     reset_axis(no) {
      let ax, ay, az;
      let nx=Math.abs(no[0]), ny=Math.abs(no[1]), nz=Math.abs(no[2]);
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
    }
     convex_quad(v1, v2, v3, v4) {
      let ax=this.axis;
      v1 = new Vector3([v1[ax[0]], v1[ax[1]], v1[ax[2]]]);
      v2 = new Vector3([v2[ax[0]], v2[ax[1]], v2[ax[2]]]);
      v3 = new Vector3([v3[ax[0]], v3[ax[1]], v3[ax[2]]]);
      v4 = new Vector3([v4[ax[0]], v4[ax[1]], v4[ax[2]]]);
      return convex_quad(v1, v2, v3, v4);
    }
     line_isect(v1, v2, v3, v4) {
      let ax=this.axis;
      let orig1=v1, orig2=v2;
      v1 = new Vector3([v1[ax[0]], v1[ax[1]], v1[ax[2]]]);
      v2 = new Vector3([v2[ax[0]], v2[ax[1]], v2[ax[2]]]);
      v3 = new Vector3([v3[ax[0]], v3[ax[1]], v3[ax[2]]]);
      v4 = new Vector3([v4[ax[0]], v4[ax[1]], v4[ax[2]]]);
      let ret=line_isect(v1, v2, v3, v4, true);
      let vi=ret[0];
      if (ret[1]===LINECROSS) {
          ret[0].load(orig2).sub(orig1).mulScalar(ret[2]).add(orig1);
      }
      return ret;
    }
     line_line_cross(l1, l2) {
      let ax=this.axis;
      let v1=l1[0], v2=l1[1], v3=l2[0], v4=l2[1];
      v1 = new Vector3([v1[ax[0]], v1[ax[1]], 0.0]);
      v2 = new Vector3([v2[ax[0]], v2[ax[1]], 0.0]);
      v3 = new Vector3([v3[ax[0]], v3[ax[1]], 0.0]);
      v4 = new Vector3([v4[ax[0]], v4[ax[1]], 0.0]);
      return line_line_cross([v1, v2], [v3, v4]);
    }
     winding(v1, v2, v3) {
      let ax=this.axis;
      if (v1===undefined)
        console.trace();
      v1 = new Vector3([v1[ax[0]], v1[ax[1]], 0.0]);
      v2 = new Vector3([v2[ax[0]], v2[ax[1]], 0.0]);
      v3 = new Vector3([v3[ax[0]], v3[ax[1]], 0.0]);
      return winding(v1, v2, v3);
    }
     colinear(v1, v2, v3) {
      let ax=this.axis;
      v1 = new Vector3([v1[ax[0]], v1[ax[1]], 0.0]);
      v2 = new Vector3([v2[ax[0]], v2[ax[1]], 0.0]);
      v3 = new Vector3([v3[ax[0]], v3[ax[1]], 0.0]);
      return colinear(v1, v2, v3);
    }
     get_boundary_winding(points) {
      let ax=this.axis;
      let cent=new Vector3();
      if (points.length===0)
        return false;
      for (let i=0; i<points.length; i++) {
          cent.add(points[i]);
      }
      cent.divideScalar(points.length);
      let w=0, totw=0;
      for (let i=0; i<points.length; i++) {
          let v1=points[i];
          let v2=points[(i+1)%points.length];
          if (!this.colinear(v1, v2, cent)) {
              w+=this.winding(v1, v2, cent);
              totw+=1;
          }
      }
      if (totw>0)
        w/=totw;
      return Math.round(w)===1;
    }
  }
  _ESClass.register(PlaneOps);
  _es6_module.add_class(PlaneOps);
  PlaneOps = _es6_module.add_export('PlaneOps', PlaneOps);
  let _isrp_ret=new Vector3();
  let isect_ray_plane_rets=util.cachering.fromConstructor(Vector3, 256);
  function isect_ray_plane(planeorigin, planenormal, rayorigin, raynormal) {
    let po=planeorigin, pn=planenormal, ro=rayorigin, rn=raynormal;
    let div=(pn[1]*rn[1]+pn[2]*rn[2]+pn[0]*rn[0]);
    if (Math.abs(div)<1e-06) {
        return undefined;
    }
    let t=((po[1]-ro[1])*pn[1]+(po[2]-ro[2])*pn[2]+(po[0]-ro[0])*pn[0])/div;
    _isrp_ret.load(ro).addFac(rn, t);
    return isect_ray_plane_rets.next().load(_isrp_ret);
  }
  isect_ray_plane = _es6_module.add_export('isect_ray_plane', isect_ray_plane);
  function _old_isect_ray_plane(planeorigin, planenormal, rayorigin, raynormal) {
    let p=planeorigin, n=planenormal;
    let r=rayorigin, v=raynormal;
    let d=p.vectorLength();
    let t=-(r.dot(n)-p.dot(n))/v.dot(n);
    _isrp_ret.load(v);
    _isrp_ret.mulScalar(t);
    _isrp_ret.add(r);
    return _isrp_ret;
  }
  _old_isect_ray_plane = _es6_module.add_export('_old_isect_ray_plane', _old_isect_ray_plane);
  
  class Mat4Stack  {
     constructor() {
      this.stack = [];
      this.matrix = new Matrix4();
      this.matrix.makeIdentity();
      this.update_func = undefined;
    }
     set_internal_matrix(mat, update_func) {
      this.update_func = update_func;
      this.matrix = mat;
    }
     reset(mat) {
      this.matrix.load(mat);
      this.stack = [];
      if (this.update_func!==undefined)
        this.update_func();
    }
     load(mat) {
      this.matrix.load(mat);
      if (this.update_func!==undefined)
        this.update_func();
    }
     multiply(mat) {
      this.matrix.multiply(mat);
      if (this.update_func!==undefined)
        this.update_func();
    }
     identity() {
      this.matrix.loadIdentity();
      if (this.update_func!==undefined)
        this.update_func();
    }
     push(mat2) {
      this.stack.push(new Matrix4(this.matrix));
      if (mat2!==undefined) {
          this.matrix.load(mat2);
          if (this.update_func!==undefined)
            this.update_func();
      }
    }
     pop() {
      let mat=this.stack.pop(this.stack.length-1);
      this.matrix.load(mat);
      if (this.update_func!==undefined)
        this.update_func();
      return mat;
    }
  }
  _ESClass.register(Mat4Stack);
  _es6_module.add_class(Mat4Stack);
  Mat4Stack = _es6_module.add_export('Mat4Stack', Mat4Stack);
  const tril_rets=util.cachering.fromConstructor(Vector3, 128);
  function lreport() {
  }
  function trilinear_v3(uvw, boxverts) {
    let $_t1aghk=uvw, u=$_t1aghk[0], v=$_t1aghk[1], w=$_t1aghk[2];
    const a1x=boxverts[0][0], a1y=boxverts[0][1], a1z=boxverts[0][2];
    const b1x=boxverts[1][0]-a1x, b1y=boxverts[1][1]-a1y, b1z=boxverts[1][2]-a1z;
    const c1x=boxverts[2][0]-a1x, c1y=boxverts[2][1]-a1y, c1z=boxverts[2][2]-a1z;
    const d1x=boxverts[3][0]-a1x, d1y=boxverts[3][1]-a1y, d1z=boxverts[3][2]-a1z;
    const a2x=boxverts[4][0]-a1x, a2y=boxverts[4][1]-a1y, a2z=boxverts[4][2]-a1z;
    const b2x=boxverts[5][0]-a1x, b2y=boxverts[5][1]-a1y, b2z=boxverts[5][2]-a1z;
    const c2x=boxverts[6][0]-a1x, c2y=boxverts[6][1]-a1y, c2z=boxverts[6][2]-a1z;
    const d2x=boxverts[7][0]-a1x, d2y=boxverts[7][1]-a1y, d2z=boxverts[7][2]-a1z;
    const x=(((a2x-b2x)*v-a2x+(c2x-d2x)*v+d2x)*u-((a2x-b2x)*v-a2x)-(((c1x-d1x)*v+d1x-b1x*v)*u+b1x*v))*w+((c1x-d1x)*v+d1x-b1x*v)*u+b1x*v;
    const y=(((a2y-b2y)*v-a2y+(c2y-d2y)*v+d2y)*u-((a2y-b2y)*v-a2y)-(((c1y-d1y)*v+d1y-b1y*v)*u+b1y*v))*w+((c1y-d1y)*v+d1y-b1y*v)*u+b1y*v;
    const z=(((a2z-b2z)*v-a2z+(c2z-d2z)*v+d2z)*u-((a2z-b2z)*v-a2z)-(((c1z-d1z)*v+d1z-b1z*v)*u+b1z*v))*w+((c1z-d1z)*v+d1z-b1z*v)*u+b1z*v;
    let p=tril_rets.next();
    p[0] = x+a1x;
    p[1] = y+a1y;
    p[2] = z+a1z;
    return p;
  }
  trilinear_v3 = _es6_module.add_export('trilinear_v3', trilinear_v3);
  let tril_co_rets=util.cachering.fromConstructor(Vector3, 128);
  let tril_co_tmps=util.cachering.fromConstructor(Vector3, 16);
  let tril_mat_1=new Matrix4();
  let tril_mat_2=new Matrix4();
  let wtable=[[[0.5, 0.5, 0], [0.5, 0.5, 0], [0.5, 0.5, 0]], [[0.5, 0.5, 0], [0.0, 0.5, 0.5], [0.5, 0.5, 0]], [[0.0, 0.5, 0.5], [0.0, 0.5, 0.5], [0.5, 0.5, 0]], [[0.0, 0.5, 0.5], [0.5, 0.5, 0], [0.5, 0.5, 0]]];
  for (let i=0; i<4; i++) {
      let w=wtable[i];
      w = [w[0], w[1], [0.0, 0.5, 0.5]];
      wtable.push(w);
  }
  const pih_tmps=util.cachering.fromConstructor(Vector3, 16);
  const boxfaces_table=[[0, 1, 2, 3], [7, 6, 5, 4], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]];
  let boxfaces_tmp=new Array(6);
  for (let i=0; i<6; i++) {
      boxfaces_tmp[i] = new Vector3();
  }
  let boxfacenormals_tmp=new Array(6);
  for (let i=0; i<6; i++) {
      boxfacenormals_tmp[i] = new Vector3();
  }
  function point_in_hex(p, boxverts, boxfacecents, boxfacenormals) {
    if (boxfacecents===undefined) {
        boxfacecents = undefined;
    }
    if (boxfacenormals===undefined) {
        boxfacenormals = undefined;
    }
    if (!boxfacecents) {
        boxfacecents = boxfaces_tmp;
        for (let i=0; i<6; i++) {
            let $_t2vvns=boxfaces_table[i], v1=$_t2vvns[0], v2=$_t2vvns[1], v3=$_t2vvns[2], v4=$_t2vvns[3];
            v1 = boxverts[v1];
            v2 = boxverts[v2];
            v3 = boxverts[v3];
            v4 = boxverts[v4];
            boxfacecents[i].load(v1).add(v2).add(v3).add(v4).mulScalar(0.25);
        }
    }
    if (!boxfacenormals) {
        boxfacenormals = boxfacenormals_tmp;
        for (let i=0; i<6; i++) {
            let $_t3cpko=boxfaces_table[i], v1=$_t3cpko[0], v2=$_t3cpko[1], v3=$_t3cpko[2], v4=$_t3cpko[3];
            v1 = boxverts[v1];
            v2 = boxverts[v2];
            v3 = boxverts[v3];
            v4 = boxverts[v4];
            let n=normal_quad(v1, v2, v3, v4);
            boxfacenormals[i].load(n).negate();
        }
    }
    let t1=pih_tmps.next();
    let t2=pih_tmps.next();
    let cent=pih_tmps.next().zero();
    for (let i=0; i<6; i++) {
        cent.add(boxfacecents[i]);
    }
    cent.mulScalar(1.0/6.0);
    let ret=true;
    for (let i=0; i<6; i++) {
        t1.load(p).sub(boxfacecents[i]);
        t2.load(cent).sub(boxfacecents[i]);
        let n=boxfacenormals[i];
        if (1) {
            t1.normalize();
            t2.normalize();
        }
        if (t1.dot(t2)<0) {
            ret = false;
            return false;
        }
    }
    return ret;
  }
  point_in_hex = _es6_module.add_export('point_in_hex', point_in_hex);
  const boxverts_tmp=new Array(8);
  for (let i=0; i<8; i++) {
      boxverts_tmp[i] = new Vector3();
  }
  function trilinear_co(p, boxverts) {
    let uvw=tril_co_rets.next();
    uvw.zero();
    let u=tril_co_tmps.next();
    let v=tril_co_tmps.next();
    let w=tril_co_tmps.next();
    u.loadXYZ(0.0, 0.5, 1.0);
    v.loadXYZ(0.0, 0.5, 1.0);
    w.loadXYZ(0.0, 0.5, 1.0);
    let uvw2=tril_co_tmps.next();
    for (let step=0; step<4; step++) {
        uvw.loadXYZ(u[1], v[1], w[1]);
        let mini=undefined;
        let mindis=trilinear_v3(uvw, boxverts).vectorDistanceSqr(p);
        for (let i=0; i<8; i++) {
            let $_t4gtah=wtable[i], t1=$_t4gtah[0], t2=$_t4gtah[1], t3=$_t4gtah[2];
            let u2=t1[0]*u[0]+t1[1]*u[1]+t1[2]*u[2];
            let v2=t2[0]*v[0]+t2[1]*v[1]+t2[2]*v[2];
            let w2=t3[0]*w[0]+t3[1]*w[1]+t3[2]*w[2];
            let du=Math.abs(u2-u[1]);
            let dv=Math.abs(v2-v[1]);
            let dw=Math.abs(w2-w[1]);
            uvw.loadXYZ(u2, v2, w2);
            let dis=trilinear_v3(uvw, boxverts).vectorDistanceSqr(p);
            if (mindis===undefined||dis<mindis) {
            }
            if (1) {
                let bv=boxverts_tmp;
                bv[0].loadXYZ(u2-du, v2-dv, w2-dw);
                bv[1].loadXYZ(u2-du, v2+dv, w2-dw);
                bv[2].loadXYZ(u2+du, v2+dv, w2-dw);
                bv[3].loadXYZ(u2+du, v2-dv, w2-dw);
                bv[4].loadXYZ(u2-du, v2-dv, w2+dw);
                bv[5].loadXYZ(u2-du, v2+dv, w2+dw);
                bv[6].loadXYZ(u2+du, v2+dv, w2+dw);
                bv[7].loadXYZ(u2+du, v2-dv, w2+dw);
                for (let j=0; j<8; j++) {
                    bv[j].load(trilinear_v3(bv[j], boxverts));
                }
                if (point_in_hex(p, bv)) {
                    mini = i;
                    mindis = dis;
                    break;
                }
            }
        }
        if (mini===undefined) {
            lreport("mindis:", (mindis**0.5).toFixed(3));
            break;
        }
        let $_t5wjut=wtable[mini], t1=$_t5wjut[0], t2=$_t5wjut[1], t3=$_t5wjut[2];
        let u2=t1[0]*u[0]+t1[1]*u[1]+t1[2]*u[2];
        let v2=t2[0]*v[0]+t2[1]*v[1]+t2[2]*v[2];
        let w2=t3[0]*w[0]+t3[1]*w[1]+t3[2]*w[2];
        let du=Math.abs(u2-u[1]);
        let dv=Math.abs(v2-v[1]);
        let dw=Math.abs(w2-w[1]);
        u[0] = u2-du;
        v[0] = v2-dv;
        w[0] = w2-dw;
        u[1] = u2;
        v[1] = v2;
        w[1] = w2;
        u[2] = u2+du;
        v[2] = v2+dv;
        w[2] = w2+dw;
        lreport("mindis:", (mindis**0.5).toFixed(3), u2, v2, w2);
    }
    uvw.loadXYZ(u[1], v[1], w[1]);
    return trilinear_co2(p, boxverts, uvw);
  }
  trilinear_co = _es6_module.add_export('trilinear_co', trilinear_co);
  function trilinear_co2(p, boxverts, uvw) {
    let grad=tril_co_tmps.next();
    let df=1e-05;
    let mat=tril_mat_1;
    let m=mat.$matrix;
    let mat2=tril_mat_2;
    let r1=tril_co_tmps.next();
    for (let step=0; step<55; step++) {
        let totg=0;
        for (let i=0; i<3; i++) {
            let axis_error=0.0;
            if (uvw[i]<0) {
                axis_error = -uvw[i];
            }
            else 
              if (uvw[i]>1.0) {
                axis_error = uvw[i]-1.0;
            }
            r1[i] = trilinear_v3(uvw, boxverts).vectorDistance(p)+10.0*axis_error;
            let orig=uvw[i];
            uvw[i]+=df;
            if (uvw[i]<0) {
                axis_error = -uvw[i];
            }
            else 
              if (uvw[i]>1.0) {
                axis_error = uvw[i]-1.0;
            }
            else {
              axis_error = 0.0;
            }
            let r2=trilinear_v3(uvw, boxverts).vectorDistance(p)+10.0*axis_error;
            uvw[i] = orig;
            grad[i] = (r2-r1[i])/df;
            totg+=grad[i]**2;
        }
        if (totg===0.0) {
            break;
        }
        let err=trilinear_v3(uvw, boxverts).vectorDistance(p);
        if (1) {
            uvw.addFac(grad, -err/totg*0.85);
        }
        else {
          mat.makeIdentity();
          m.m11 = grad[0];
          m.m12 = grad[1];
          m.m13 = grad[2];
          m.m22 = m.m33 = m.m44 = 0.0;
          mat.transpose();
          mat2.load(mat).transpose();
          mat.preMultiply(mat2).invert();
          mat.multiply(mat2);
          grad.load(r1);
          grad.multVecMatrix(mat);
          uvw.addFac(grad, -1.0);
        }
        lreport("error:", err.toFixed(3), uvw);
        if (r1.dot(r1)**0.5<0.0001) {
            break;
        }
    }
    lreport("\n");
    return uvw;
  }
  trilinear_co2 = _es6_module.add_export('trilinear_co2', trilinear_co2);
  let angle_tri_v3_rets=util.cachering.fromConstructor(Vector3, 32);
  let angle_tri_v3_vs=util.cachering.fromConstructor(Vector3, 32);
  function tri_angles(v1, v2, v3) {
    let t1=angle_tri_v3_vs.next().load(v1).sub(v2);
    let t2=angle_tri_v3_vs.next().load(v3).sub(v2);
    let t3=angle_tri_v3_vs.next().load(v2).sub(v3);
    t1.normalize();
    t2.normalize();
    t3.normalize();
    let th1=Math.acos(t1.dot(t2)*0.99999);
    t2.negate();
    let th2=Math.acos(t2.dot(t3)*0.99999);
    let th3=Math.PI-(th1+th2);
    let ret=angle_tri_v3_rets.next();
    ret[0] = th1;
    ret[1] = th2;
    ret[2] = th3;
    return ret;
  }
  tri_angles = _es6_module.add_export('tri_angles', tri_angles);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/math.js');


es6_module_define('mobile-detect', [], function _mobile_detect_module(_es6_module) {
  (function (define, undefined) {
    define(function () {
      'use strict';
      var impl={}
      impl.mobileDetectRules = {"phones": {"iPhone": "\\biPhone\\b|\\biPod\\b", 
      "BlackBerry": "BlackBerry|\\bBB10\\b|rim[0-9]+|\\b(BBA100|BBB100|BBD100|BBE100|BBF100|STH100)\\b-[0-9]+", 
      "HTC": "HTC|HTC.*(Sensation|Evo|Vision|Explorer|6800|8100|8900|A7272|S510e|C110e|Legend|Desire|T8282)|APX515CKT|Qtek9090|APA9292KT|HD_mini|Sensation.*Z710e|PG86100|Z715e|Desire.*(A8181|HD)|ADR6200|ADR6400L|ADR6425|001HT|Inspire 4G|Android.*\\bEVO\\b|T-Mobile G1|Z520m|Android [0-9.]+; Pixel", 
      "Nexus": "Nexus One|Nexus S|Galaxy.*Nexus|Android.*Nexus.*Mobile|Nexus 4|Nexus 5|Nexus 6", 
      "Dell": "Dell[;]? (Streak|Aero|Venue|Venue Pro|Flash|Smoke|Mini 3iX)|XCD28|XCD35|\\b001DL\\b|\\b101DL\\b|\\bGS01\\b", 
      "Motorola": "Motorola|DROIDX|DROID BIONIC|\\bDroid\\b.*Build|Android.*Xoom|HRI39|MOT-|A1260|A1680|A555|A853|A855|A953|A955|A956|Motorola.*ELECTRIFY|Motorola.*i1|i867|i940|MB200|MB300|MB501|MB502|MB508|MB511|MB520|MB525|MB526|MB611|MB612|MB632|MB810|MB855|MB860|MB861|MB865|MB870|ME501|ME502|ME511|ME525|ME600|ME632|ME722|ME811|ME860|ME863|ME865|MT620|MT710|MT716|MT720|MT810|MT870|MT917|Motorola.*TITANIUM|WX435|WX445|XT300|XT301|XT311|XT316|XT317|XT319|XT320|XT390|XT502|XT530|XT531|XT532|XT535|XT603|XT610|XT611|XT615|XT681|XT701|XT702|XT711|XT720|XT800|XT806|XT860|XT862|XT875|XT882|XT883|XT894|XT901|XT907|XT909|XT910|XT912|XT928|XT926|XT915|XT919|XT925|XT1021|\\bMoto E\\b|XT1068|XT1092|XT1052", 
      "Samsung": "\\bSamsung\\b|SM-G950F|SM-G955F|SM-G9250|GT-19300|SGH-I337|BGT-S5230|GT-B2100|GT-B2700|GT-B2710|GT-B3210|GT-B3310|GT-B3410|GT-B3730|GT-B3740|GT-B5510|GT-B5512|GT-B5722|GT-B6520|GT-B7300|GT-B7320|GT-B7330|GT-B7350|GT-B7510|GT-B7722|GT-B7800|GT-C3010|GT-C3011|GT-C3060|GT-C3200|GT-C3212|GT-C3212I|GT-C3262|GT-C3222|GT-C3300|GT-C3300K|GT-C3303|GT-C3303K|GT-C3310|GT-C3322|GT-C3330|GT-C3350|GT-C3500|GT-C3510|GT-C3530|GT-C3630|GT-C3780|GT-C5010|GT-C5212|GT-C6620|GT-C6625|GT-C6712|GT-E1050|GT-E1070|GT-E1075|GT-E1080|GT-E1081|GT-E1085|GT-E1087|GT-E1100|GT-E1107|GT-E1110|GT-E1120|GT-E1125|GT-E1130|GT-E1160|GT-E1170|GT-E1175|GT-E1180|GT-E1182|GT-E1200|GT-E1210|GT-E1225|GT-E1230|GT-E1390|GT-E2100|GT-E2120|GT-E2121|GT-E2152|GT-E2220|GT-E2222|GT-E2230|GT-E2232|GT-E2250|GT-E2370|GT-E2550|GT-E2652|GT-E3210|GT-E3213|GT-I5500|GT-I5503|GT-I5700|GT-I5800|GT-I5801|GT-I6410|GT-I6420|GT-I7110|GT-I7410|GT-I7500|GT-I8000|GT-I8150|GT-I8160|GT-I8190|GT-I8320|GT-I8330|GT-I8350|GT-I8530|GT-I8700|GT-I8703|GT-I8910|GT-I9000|GT-I9001|GT-I9003|GT-I9010|GT-I9020|GT-I9023|GT-I9070|GT-I9082|GT-I9100|GT-I9103|GT-I9220|GT-I9250|GT-I9300|GT-I9305|GT-I9500|GT-I9505|GT-M3510|GT-M5650|GT-M7500|GT-M7600|GT-M7603|GT-M8800|GT-M8910|GT-N7000|GT-S3110|GT-S3310|GT-S3350|GT-S3353|GT-S3370|GT-S3650|GT-S3653|GT-S3770|GT-S3850|GT-S5210|GT-S5220|GT-S5229|GT-S5230|GT-S5233|GT-S5250|GT-S5253|GT-S5260|GT-S5263|GT-S5270|GT-S5300|GT-S5330|GT-S5350|GT-S5360|GT-S5363|GT-S5369|GT-S5380|GT-S5380D|GT-S5560|GT-S5570|GT-S5600|GT-S5603|GT-S5610|GT-S5620|GT-S5660|GT-S5670|GT-S5690|GT-S5750|GT-S5780|GT-S5830|GT-S5839|GT-S6102|GT-S6500|GT-S7070|GT-S7200|GT-S7220|GT-S7230|GT-S7233|GT-S7250|GT-S7500|GT-S7530|GT-S7550|GT-S7562|GT-S7710|GT-S8000|GT-S8003|GT-S8500|GT-S8530|GT-S8600|SCH-A310|SCH-A530|SCH-A570|SCH-A610|SCH-A630|SCH-A650|SCH-A790|SCH-A795|SCH-A850|SCH-A870|SCH-A890|SCH-A930|SCH-A950|SCH-A970|SCH-A990|SCH-I100|SCH-I110|SCH-I400|SCH-I405|SCH-I500|SCH-I510|SCH-I515|SCH-I600|SCH-I730|SCH-I760|SCH-I770|SCH-I830|SCH-I910|SCH-I920|SCH-I959|SCH-LC11|SCH-N150|SCH-N300|SCH-R100|SCH-R300|SCH-R351|SCH-R400|SCH-R410|SCH-T300|SCH-U310|SCH-U320|SCH-U350|SCH-U360|SCH-U365|SCH-U370|SCH-U380|SCH-U410|SCH-U430|SCH-U450|SCH-U460|SCH-U470|SCH-U490|SCH-U540|SCH-U550|SCH-U620|SCH-U640|SCH-U650|SCH-U660|SCH-U700|SCH-U740|SCH-U750|SCH-U810|SCH-U820|SCH-U900|SCH-U940|SCH-U960|SCS-26UC|SGH-A107|SGH-A117|SGH-A127|SGH-A137|SGH-A157|SGH-A167|SGH-A177|SGH-A187|SGH-A197|SGH-A227|SGH-A237|SGH-A257|SGH-A437|SGH-A517|SGH-A597|SGH-A637|SGH-A657|SGH-A667|SGH-A687|SGH-A697|SGH-A707|SGH-A717|SGH-A727|SGH-A737|SGH-A747|SGH-A767|SGH-A777|SGH-A797|SGH-A817|SGH-A827|SGH-A837|SGH-A847|SGH-A867|SGH-A877|SGH-A887|SGH-A897|SGH-A927|SGH-B100|SGH-B130|SGH-B200|SGH-B220|SGH-C100|SGH-C110|SGH-C120|SGH-C130|SGH-C140|SGH-C160|SGH-C170|SGH-C180|SGH-C200|SGH-C207|SGH-C210|SGH-C225|SGH-C230|SGH-C417|SGH-C450|SGH-D307|SGH-D347|SGH-D357|SGH-D407|SGH-D415|SGH-D780|SGH-D807|SGH-D980|SGH-E105|SGH-E200|SGH-E315|SGH-E316|SGH-E317|SGH-E335|SGH-E590|SGH-E635|SGH-E715|SGH-E890|SGH-F300|SGH-F480|SGH-I200|SGH-I300|SGH-I320|SGH-I550|SGH-I577|SGH-I600|SGH-I607|SGH-I617|SGH-I627|SGH-I637|SGH-I677|SGH-I700|SGH-I717|SGH-I727|SGH-i747M|SGH-I777|SGH-I780|SGH-I827|SGH-I847|SGH-I857|SGH-I896|SGH-I897|SGH-I900|SGH-I907|SGH-I917|SGH-I927|SGH-I937|SGH-I997|SGH-J150|SGH-J200|SGH-L170|SGH-L700|SGH-M110|SGH-M150|SGH-M200|SGH-N105|SGH-N500|SGH-N600|SGH-N620|SGH-N625|SGH-N700|SGH-N710|SGH-P107|SGH-P207|SGH-P300|SGH-P310|SGH-P520|SGH-P735|SGH-P777|SGH-Q105|SGH-R210|SGH-R220|SGH-R225|SGH-S105|SGH-S307|SGH-T109|SGH-T119|SGH-T139|SGH-T209|SGH-T219|SGH-T229|SGH-T239|SGH-T249|SGH-T259|SGH-T309|SGH-T319|SGH-T329|SGH-T339|SGH-T349|SGH-T359|SGH-T369|SGH-T379|SGH-T409|SGH-T429|SGH-T439|SGH-T459|SGH-T469|SGH-T479|SGH-T499|SGH-T509|SGH-T519|SGH-T539|SGH-T559|SGH-T589|SGH-T609|SGH-T619|SGH-T629|SGH-T639|SGH-T659|SGH-T669|SGH-T679|SGH-T709|SGH-T719|SGH-T729|SGH-T739|SGH-T746|SGH-T749|SGH-T759|SGH-T769|SGH-T809|SGH-T819|SGH-T839|SGH-T919|SGH-T929|SGH-T939|SGH-T959|SGH-T989|SGH-U100|SGH-U200|SGH-U800|SGH-V205|SGH-V206|SGH-X100|SGH-X105|SGH-X120|SGH-X140|SGH-X426|SGH-X427|SGH-X475|SGH-X495|SGH-X497|SGH-X507|SGH-X600|SGH-X610|SGH-X620|SGH-X630|SGH-X700|SGH-X820|SGH-X890|SGH-Z130|SGH-Z150|SGH-Z170|SGH-ZX10|SGH-ZX20|SHW-M110|SPH-A120|SPH-A400|SPH-A420|SPH-A460|SPH-A500|SPH-A560|SPH-A600|SPH-A620|SPH-A660|SPH-A700|SPH-A740|SPH-A760|SPH-A790|SPH-A800|SPH-A820|SPH-A840|SPH-A880|SPH-A900|SPH-A940|SPH-A960|SPH-D600|SPH-D700|SPH-D710|SPH-D720|SPH-I300|SPH-I325|SPH-I330|SPH-I350|SPH-I500|SPH-I600|SPH-I700|SPH-L700|SPH-M100|SPH-M220|SPH-M240|SPH-M300|SPH-M305|SPH-M320|SPH-M330|SPH-M350|SPH-M360|SPH-M370|SPH-M380|SPH-M510|SPH-M540|SPH-M550|SPH-M560|SPH-M570|SPH-M580|SPH-M610|SPH-M620|SPH-M630|SPH-M800|SPH-M810|SPH-M850|SPH-M900|SPH-M910|SPH-M920|SPH-M930|SPH-N100|SPH-N200|SPH-N240|SPH-N300|SPH-N400|SPH-Z400|SWC-E100|SCH-i909|GT-N7100|GT-N7105|SCH-I535|SM-N900A|SGH-I317|SGH-T999L|GT-S5360B|GT-I8262|GT-S6802|GT-S6312|GT-S6310|GT-S5312|GT-S5310|GT-I9105|GT-I8510|GT-S6790N|SM-G7105|SM-N9005|GT-S5301|GT-I9295|GT-I9195|SM-C101|GT-S7392|GT-S7560|GT-B7610|GT-I5510|GT-S7582|GT-S7530E|GT-I8750|SM-G9006V|SM-G9008V|SM-G9009D|SM-G900A|SM-G900D|SM-G900F|SM-G900H|SM-G900I|SM-G900J|SM-G900K|SM-G900L|SM-G900M|SM-G900P|SM-G900R4|SM-G900S|SM-G900T|SM-G900V|SM-G900W8|SHV-E160K|SCH-P709|SCH-P729|SM-T2558|GT-I9205|SM-G9350|SM-J120F|SM-G920F|SM-G920V|SM-G930F|SM-N910C|SM-A310F|GT-I9190|SM-J500FN|SM-G903F|SM-J330F", 
      "LG": "\\bLG\\b;|LG[- ]?(C800|C900|E400|E610|E900|E-900|F160|F180K|F180L|F180S|730|855|L160|LS740|LS840|LS970|LU6200|MS690|MS695|MS770|MS840|MS870|MS910|P500|P700|P705|VM696|AS680|AS695|AX840|C729|E970|GS505|272|C395|E739BK|E960|L55C|L75C|LS696|LS860|P769BK|P350|P500|P509|P870|UN272|US730|VS840|VS950|LN272|LN510|LS670|LS855|LW690|MN270|MN510|P509|P769|P930|UN200|UN270|UN510|UN610|US670|US740|US760|UX265|UX840|VN271|VN530|VS660|VS700|VS740|VS750|VS910|VS920|VS930|VX9200|VX11000|AX840A|LW770|P506|P925|P999|E612|D955|D802|MS323|M257)|LM-G710", 
      "Sony": "SonyST|SonyLT|SonyEricsson|SonyEricssonLT15iv|LT18i|E10i|LT28h|LT26w|SonyEricssonMT27i|C5303|C6902|C6903|C6906|C6943|D2533", 
      "Asus": "Asus.*Galaxy|PadFone.*Mobile", 
      "NokiaLumia": "Lumia [0-9]{3,4}", 
      "Micromax": "Micromax.*\\b(A210|A92|A88|A72|A111|A110Q|A115|A116|A110|A90S|A26|A51|A35|A54|A25|A27|A89|A68|A65|A57|A90)\\b", 
      "Palm": "PalmSource|Palm", 
      "Vertu": "Vertu|Vertu.*Ltd|Vertu.*Ascent|Vertu.*Ayxta|Vertu.*Constellation(F|Quest)?|Vertu.*Monika|Vertu.*Signature", 
      "Pantech": "PANTECH|IM-A850S|IM-A840S|IM-A830L|IM-A830K|IM-A830S|IM-A820L|IM-A810K|IM-A810S|IM-A800S|IM-T100K|IM-A725L|IM-A780L|IM-A775C|IM-A770K|IM-A760S|IM-A750K|IM-A740S|IM-A730S|IM-A720L|IM-A710K|IM-A690L|IM-A690S|IM-A650S|IM-A630K|IM-A600S|VEGA PTL21|PT003|P8010|ADR910L|P6030|P6020|P9070|P4100|P9060|P5000|CDM8992|TXT8045|ADR8995|IS11PT|P2030|P6010|P8000|PT002|IS06|CDM8999|P9050|PT001|TXT8040|P2020|P9020|P2000|P7040|P7000|C790", 
      "Fly": "IQ230|IQ444|IQ450|IQ440|IQ442|IQ441|IQ245|IQ256|IQ236|IQ255|IQ235|IQ245|IQ275|IQ240|IQ285|IQ280|IQ270|IQ260|IQ250", 
      "Wiko": "KITE 4G|HIGHWAY|GETAWAY|STAIRWAY|DARKSIDE|DARKFULL|DARKNIGHT|DARKMOON|SLIDE|WAX 4G|RAINBOW|BLOOM|SUNSET|GOA(?!nna)|LENNY|BARRY|IGGY|OZZY|CINK FIVE|CINK PEAX|CINK PEAX 2|CINK SLIM|CINK SLIM 2|CINK +|CINK KING|CINK PEAX|CINK SLIM|SUBLIM", 
      "iMobile": "i-mobile (IQ|i-STYLE|idea|ZAA|Hitz)", 
      "SimValley": "\\b(SP-80|XT-930|SX-340|XT-930|SX-310|SP-360|SP60|SPT-800|SP-120|SPT-800|SP-140|SPX-5|SPX-8|SP-100|SPX-8|SPX-12)\\b", 
      "Wolfgang": "AT-B24D|AT-AS50HD|AT-AS40W|AT-AS55HD|AT-AS45q2|AT-B26D|AT-AS50Q", 
      "Alcatel": "Alcatel", 
      "Nintendo": "Nintendo (3DS|Switch)", 
      "Amoi": "Amoi", 
      "INQ": "INQ", 
      "OnePlus": "ONEPLUS", 
      "GenericPhone": "Tapatalk|PDA;|SAGEM|\\bmmp\\b|pocket|\\bpsp\\b|symbian|Smartphone|smartfon|treo|up.browser|up.link|vodafone|\\bwap\\b|nokia|Series40|Series60|S60|SonyEricsson|N900|MAUI.*WAP.*Browser"}, 
     "tablets": {"iPad": "iPad|iPad.*Mobile", 
      "NexusTablet": "Android.*Nexus[\\s]+(7|9|10)", 
      "GoogleTablet": "Android.*Pixel C", 
      "SamsungTablet": "SAMSUNG.*Tablet|Galaxy.*Tab|SC-01C|GT-P1000|GT-P1003|GT-P1010|GT-P3105|GT-P6210|GT-P6800|GT-P6810|GT-P7100|GT-P7300|GT-P7310|GT-P7500|GT-P7510|SCH-I800|SCH-I815|SCH-I905|SGH-I957|SGH-I987|SGH-T849|SGH-T859|SGH-T869|SPH-P100|GT-P3100|GT-P3108|GT-P3110|GT-P5100|GT-P5110|GT-P6200|GT-P7320|GT-P7511|GT-N8000|GT-P8510|SGH-I497|SPH-P500|SGH-T779|SCH-I705|SCH-I915|GT-N8013|GT-P3113|GT-P5113|GT-P8110|GT-N8010|GT-N8005|GT-N8020|GT-P1013|GT-P6201|GT-P7501|GT-N5100|GT-N5105|GT-N5110|SHV-E140K|SHV-E140L|SHV-E140S|SHV-E150S|SHV-E230K|SHV-E230L|SHV-E230S|SHW-M180K|SHW-M180L|SHW-M180S|SHW-M180W|SHW-M300W|SHW-M305W|SHW-M380K|SHW-M380S|SHW-M380W|SHW-M430W|SHW-M480K|SHW-M480S|SHW-M480W|SHW-M485W|SHW-M486W|SHW-M500W|GT-I9228|SCH-P739|SCH-I925|GT-I9200|GT-P5200|GT-P5210|GT-P5210X|SM-T311|SM-T310|SM-T310X|SM-T210|SM-T210R|SM-T211|SM-P600|SM-P601|SM-P605|SM-P900|SM-P901|SM-T217|SM-T217A|SM-T217S|SM-P6000|SM-T3100|SGH-I467|XE500|SM-T110|GT-P5220|GT-I9200X|GT-N5110X|GT-N5120|SM-P905|SM-T111|SM-T2105|SM-T315|SM-T320|SM-T320X|SM-T321|SM-T520|SM-T525|SM-T530NU|SM-T230NU|SM-T330NU|SM-T900|XE500T1C|SM-P605V|SM-P905V|SM-T337V|SM-T537V|SM-T707V|SM-T807V|SM-P600X|SM-P900X|SM-T210X|SM-T230|SM-T230X|SM-T325|GT-P7503|SM-T531|SM-T330|SM-T530|SM-T705|SM-T705C|SM-T535|SM-T331|SM-T800|SM-T700|SM-T537|SM-T807|SM-P907A|SM-T337A|SM-T537A|SM-T707A|SM-T807A|SM-T237|SM-T807P|SM-P607T|SM-T217T|SM-T337T|SM-T807T|SM-T116NQ|SM-T116BU|SM-P550|SM-T350|SM-T550|SM-T9000|SM-P9000|SM-T705Y|SM-T805|GT-P3113|SM-T710|SM-T810|SM-T815|SM-T360|SM-T533|SM-T113|SM-T335|SM-T715|SM-T560|SM-T670|SM-T677|SM-T377|SM-T567|SM-T357T|SM-T555|SM-T561|SM-T713|SM-T719|SM-T813|SM-T819|SM-T580|SM-T355Y?|SM-T280|SM-T817A|SM-T820|SM-W700|SM-P580|SM-T587|SM-P350|SM-P555M|SM-P355M|SM-T113NU|SM-T815Y|SM-T585|SM-T285|SM-T825|SM-W708|SM-T835|SM-T830|SM-T837V|SM-T720|SM-T510|SM-T387V", 
      "Kindle": "Kindle|Silk.*Accelerated|Android.*\\b(KFOT|KFTT|KFJWI|KFJWA|KFOTE|KFSOWI|KFTHWI|KFTHWA|KFAPWI|KFAPWA|WFJWAE|KFSAWA|KFSAWI|KFASWI|KFARWI|KFFOWI|KFGIWI|KFMEWI)\\b|Android.*Silk\/[0-9.]+ like Chrome\/[0-9.]+ (?!Mobile)", 
      "SurfaceTablet": "Windows NT [0-9.]+; ARM;.*(Tablet|ARMBJS)", 
      "HPTablet": "HP Slate (7|8|10)|HP ElitePad 900|hp-tablet|EliteBook.*Touch|HP 8|Slate 21|HP SlateBook 10", 
      "AsusTablet": "^.*PadFone((?!Mobile).)*$|Transformer|TF101|TF101G|TF300T|TF300TG|TF300TL|TF700T|TF700KL|TF701T|TF810C|ME171|ME301T|ME302C|ME371MG|ME370T|ME372MG|ME172V|ME173X|ME400C|Slider SL101|\\bK00F\\b|\\bK00C\\b|\\bK00E\\b|\\bK00L\\b|TX201LA|ME176C|ME102A|\\bM80TA\\b|ME372CL|ME560CG|ME372CG|ME302KL| K010 | K011 | K017 | K01E |ME572C|ME103K|ME170C|ME171C|\\bME70C\\b|ME581C|ME581CL|ME8510C|ME181C|P01Y|PO1MA|P01Z|\\bP027\\b|\\bP024\\b|\\bP00C\\b", 
      "BlackBerryTablet": "PlayBook|RIM Tablet", 
      "HTCtablet": "HTC_Flyer_P512|HTC Flyer|HTC Jetstream|HTC-P715a|HTC EVO View 4G|PG41200|PG09410", 
      "MotorolaTablet": "xoom|sholest|MZ615|MZ605|MZ505|MZ601|MZ602|MZ603|MZ604|MZ606|MZ607|MZ608|MZ609|MZ615|MZ616|MZ617", 
      "NookTablet": "Android.*Nook|NookColor|nook browser|BNRV200|BNRV200A|BNTV250|BNTV250A|BNTV400|BNTV600|LogicPD Zoom2", 
      "AcerTablet": "Android.*; \\b(A100|A101|A110|A200|A210|A211|A500|A501|A510|A511|A700|A701|W500|W500P|W501|W501P|W510|W511|W700|G100|G100W|B1-A71|B1-710|B1-711|A1-810|A1-811|A1-830)\\b|W3-810|\\bA3-A10\\b|\\bA3-A11\\b|\\bA3-A20\\b|\\bA3-A30", 
      "ToshibaTablet": "Android.*(AT100|AT105|AT200|AT205|AT270|AT275|AT300|AT305|AT1S5|AT500|AT570|AT700|AT830)|TOSHIBA.*FOLIO", 
      "LGTablet": "\\bL-06C|LG-V909|LG-V900|LG-V700|LG-V510|LG-V500|LG-V410|LG-V400|LG-VK810\\b", 
      "FujitsuTablet": "Android.*\\b(F-01D|F-02F|F-05E|F-10D|M532|Q572)\\b", 
      "PrestigioTablet": "PMP3170B|PMP3270B|PMP3470B|PMP7170B|PMP3370B|PMP3570C|PMP5870C|PMP3670B|PMP5570C|PMP5770D|PMP3970B|PMP3870C|PMP5580C|PMP5880D|PMP5780D|PMP5588C|PMP7280C|PMP7280C3G|PMP7280|PMP7880D|PMP5597D|PMP5597|PMP7100D|PER3464|PER3274|PER3574|PER3884|PER5274|PER5474|PMP5097CPRO|PMP5097|PMP7380D|PMP5297C|PMP5297C_QUAD|PMP812E|PMP812E3G|PMP812F|PMP810E|PMP880TD|PMT3017|PMT3037|PMT3047|PMT3057|PMT7008|PMT5887|PMT5001|PMT5002", 
      "LenovoTablet": "Lenovo TAB|Idea(Tab|Pad)( A1|A10| K1|)|ThinkPad([ ]+)?Tablet|YT3-850M|YT3-X90L|YT3-X90F|YT3-X90X|Lenovo.*(S2109|S2110|S5000|S6000|K3011|A3000|A3500|A1000|A2107|A2109|A1107|A5500|A7600|B6000|B8000|B8080)(-|)(FL|F|HV|H|)|TB-X103F|TB-X304X|TB-X304F|TB-X304L|TB-X505F|TB-X505L|TB-X505X|TB-X605F|TB-X605L|TB-8703F|TB-8703X|TB-8703N|TB-8704N|TB-8704F|TB-8704X|TB-8704V|TB-7304F|TB-7304I|TB-7304X|Tab2A7-10F|Tab2A7-20F|TB2-X30L|YT3-X50L|YT3-X50F|YT3-X50M|YT-X705F|YT-X703F|YT-X703L|YT-X705L|YT-X705X|TB2-X30F|TB2-X30L|TB2-X30M|A2107A-F|A2107A-H|TB3-730F|TB3-730M|TB3-730X|TB-7504F|TB-7504X", 
      "DellTablet": "Venue 11|Venue 8|Venue 7|Dell Streak 10|Dell Streak 7", 
      "YarvikTablet": "Android.*\\b(TAB210|TAB211|TAB224|TAB250|TAB260|TAB264|TAB310|TAB360|TAB364|TAB410|TAB411|TAB420|TAB424|TAB450|TAB460|TAB461|TAB464|TAB465|TAB467|TAB468|TAB07-100|TAB07-101|TAB07-150|TAB07-151|TAB07-152|TAB07-200|TAB07-201-3G|TAB07-210|TAB07-211|TAB07-212|TAB07-214|TAB07-220|TAB07-400|TAB07-485|TAB08-150|TAB08-200|TAB08-201-3G|TAB08-201-30|TAB09-100|TAB09-211|TAB09-410|TAB10-150|TAB10-201|TAB10-211|TAB10-400|TAB10-410|TAB13-201|TAB274EUK|TAB275EUK|TAB374EUK|TAB462EUK|TAB474EUK|TAB9-200)\\b", 
      "MedionTablet": "Android.*\\bOYO\\b|LIFE.*(P9212|P9514|P9516|S9512)|LIFETAB", 
      "ArnovaTablet": "97G4|AN10G2|AN7bG3|AN7fG3|AN8G3|AN8cG3|AN7G3|AN9G3|AN7dG3|AN7dG3ST|AN7dG3ChildPad|AN10bG3|AN10bG3DT|AN9G2", 
      "IntensoTablet": "INM8002KP|INM1010FP|INM805ND|Intenso Tab|TAB1004", 
      "IRUTablet": "M702pro", 
      "MegafonTablet": "MegaFon V9|\\bZTE V9\\b|Android.*\\bMT7A\\b", 
      "EbodaTablet": "E-Boda (Supreme|Impresspeed|Izzycomm|Essential)", 
      "AllViewTablet": "Allview.*(Viva|Alldro|City|Speed|All TV|Frenzy|Quasar|Shine|TX1|AX1|AX2)", 
      "ArchosTablet": "\\b(101G9|80G9|A101IT)\\b|Qilive 97R|Archos5|\\bARCHOS (70|79|80|90|97|101|FAMILYPAD|)(b|c|)(G10| Cobalt| TITANIUM(HD|)| Xenon| Neon|XSK| 2| XS 2| PLATINUM| CARBON|GAMEPAD)\\b", 
      "AinolTablet": "NOVO7|NOVO8|NOVO10|Novo7Aurora|Novo7Basic|NOVO7PALADIN|novo9-Spark", 
      "NokiaLumiaTablet": "Lumia 2520", 
      "SonyTablet": "Sony.*Tablet|Xperia Tablet|Sony Tablet S|SO-03E|SGPT12|SGPT13|SGPT114|SGPT121|SGPT122|SGPT123|SGPT111|SGPT112|SGPT113|SGPT131|SGPT132|SGPT133|SGPT211|SGPT212|SGPT213|SGP311|SGP312|SGP321|EBRD1101|EBRD1102|EBRD1201|SGP351|SGP341|SGP511|SGP512|SGP521|SGP541|SGP551|SGP621|SGP641|SGP612|SOT31|SGP771|SGP611|SGP612|SGP712", 
      "PhilipsTablet": "\\b(PI2010|PI3000|PI3100|PI3105|PI3110|PI3205|PI3210|PI3900|PI4010|PI7000|PI7100)\\b", 
      "CubeTablet": "Android.*(K8GT|U9GT|U10GT|U16GT|U17GT|U18GT|U19GT|U20GT|U23GT|U30GT)|CUBE U8GT", 
      "CobyTablet": "MID1042|MID1045|MID1125|MID1126|MID7012|MID7014|MID7015|MID7034|MID7035|MID7036|MID7042|MID7048|MID7127|MID8042|MID8048|MID8127|MID9042|MID9740|MID9742|MID7022|MID7010", 
      "MIDTablet": "M9701|M9000|M9100|M806|M1052|M806|T703|MID701|MID713|MID710|MID727|MID760|MID830|MID728|MID933|MID125|MID810|MID732|MID120|MID930|MID800|MID731|MID900|MID100|MID820|MID735|MID980|MID130|MID833|MID737|MID960|MID135|MID860|MID736|MID140|MID930|MID835|MID733|MID4X10", 
      "MSITablet": "MSI \\b(Primo 73K|Primo 73L|Primo 81L|Primo 77|Primo 93|Primo 75|Primo 76|Primo 73|Primo 81|Primo 91|Primo 90|Enjoy 71|Enjoy 7|Enjoy 10)\\b", 
      "SMiTTablet": "Android.*(\\bMID\\b|MID-560|MTV-T1200|MTV-PND531|MTV-P1101|MTV-PND530)", 
      "RockChipTablet": "Android.*(RK2818|RK2808A|RK2918|RK3066)|RK2738|RK2808A", 
      "FlyTablet": "IQ310|Fly Vision", 
      "bqTablet": "Android.*(bq)?.*\\b(Elcano|Curie|Edison|Maxwell|Kepler|Pascal|Tesla|Hypatia|Platon|Newton|Livingstone|Cervantes|Avant|Aquaris ([E|M]10|M8))\\b|Maxwell.*Lite|Maxwell.*Plus", 
      "HuaweiTablet": "MediaPad|MediaPad 7 Youth|IDEOS S7|S7-201c|S7-202u|S7-101|S7-103|S7-104|S7-105|S7-106|S7-201|S7-Slim|M2-A01L|BAH-L09|BAH-W09|AGS-L09|CMR-AL19", 
      "NecTablet": "\\bN-06D|\\bN-08D", 
      "PantechTablet": "Pantech.*P4100", 
      "BronchoTablet": "Broncho.*(N701|N708|N802|a710)", 
      "VersusTablet": "TOUCHPAD.*[78910]|\\bTOUCHTAB\\b", 
      "ZyncTablet": "z1000|Z99 2G|z930|z990|z909|Z919|z900", 
      "PositivoTablet": "TB07STA|TB10STA|TB07FTA|TB10FTA", 
      "NabiTablet": "Android.*\\bNabi", 
      "KoboTablet": "Kobo Touch|\\bK080\\b|\\bVox\\b Build|\\bArc\\b Build", 
      "DanewTablet": "DSlide.*\\b(700|701R|702|703R|704|802|970|971|972|973|974|1010|1012)\\b", 
      "TexetTablet": "NaviPad|TB-772A|TM-7045|TM-7055|TM-9750|TM-7016|TM-7024|TM-7026|TM-7041|TM-7043|TM-7047|TM-8041|TM-9741|TM-9747|TM-9748|TM-9751|TM-7022|TM-7021|TM-7020|TM-7011|TM-7010|TM-7023|TM-7025|TM-7037W|TM-7038W|TM-7027W|TM-9720|TM-9725|TM-9737W|TM-1020|TM-9738W|TM-9740|TM-9743W|TB-807A|TB-771A|TB-727A|TB-725A|TB-719A|TB-823A|TB-805A|TB-723A|TB-715A|TB-707A|TB-705A|TB-709A|TB-711A|TB-890HD|TB-880HD|TB-790HD|TB-780HD|TB-770HD|TB-721HD|TB-710HD|TB-434HD|TB-860HD|TB-840HD|TB-760HD|TB-750HD|TB-740HD|TB-730HD|TB-722HD|TB-720HD|TB-700HD|TB-500HD|TB-470HD|TB-431HD|TB-430HD|TB-506|TB-504|TB-446|TB-436|TB-416|TB-146SE|TB-126SE", 
      "PlaystationTablet": "Playstation.*(Portable|Vita)", 
      "TrekstorTablet": "ST10416-1|VT10416-1|ST70408-1|ST702xx-1|ST702xx-2|ST80208|ST97216|ST70104-2|VT10416-2|ST10216-2A|SurfTab", 
      "PyleAudioTablet": "\\b(PTBL10CEU|PTBL10C|PTBL72BC|PTBL72BCEU|PTBL7CEU|PTBL7C|PTBL92BC|PTBL92BCEU|PTBL9CEU|PTBL9CUK|PTBL9C)\\b", 
      "AdvanTablet": "Android.* \\b(E3A|T3X|T5C|T5B|T3E|T3C|T3B|T1J|T1F|T2A|T1H|T1i|E1C|T1-E|T5-A|T4|E1-B|T2Ci|T1-B|T1-D|O1-A|E1-A|T1-A|T3A|T4i)\\b ", 
      "DanyTechTablet": "Genius Tab G3|Genius Tab S2|Genius Tab Q3|Genius Tab G4|Genius Tab Q4|Genius Tab G-II|Genius TAB GII|Genius TAB GIII|Genius Tab S1", 
      "GalapadTablet": "Android.*\\bG1\\b(?!\\))", 
      "MicromaxTablet": "Funbook|Micromax.*\\b(P250|P560|P360|P362|P600|P300|P350|P500|P275)\\b", 
      "KarbonnTablet": "Android.*\\b(A39|A37|A34|ST8|ST10|ST7|Smart Tab3|Smart Tab2)\\b", 
      "AllFineTablet": "Fine7 Genius|Fine7 Shine|Fine7 Air|Fine8 Style|Fine9 More|Fine10 Joy|Fine11 Wide", 
      "PROSCANTablet": "\\b(PEM63|PLT1023G|PLT1041|PLT1044|PLT1044G|PLT1091|PLT4311|PLT4311PL|PLT4315|PLT7030|PLT7033|PLT7033D|PLT7035|PLT7035D|PLT7044K|PLT7045K|PLT7045KB|PLT7071KG|PLT7072|PLT7223G|PLT7225G|PLT7777G|PLT7810K|PLT7849G|PLT7851G|PLT7852G|PLT8015|PLT8031|PLT8034|PLT8036|PLT8080K|PLT8082|PLT8088|PLT8223G|PLT8234G|PLT8235G|PLT8816K|PLT9011|PLT9045K|PLT9233G|PLT9735|PLT9760G|PLT9770G)\\b", 
      "YONESTablet": "BQ1078|BC1003|BC1077|RK9702|BC9730|BC9001|IT9001|BC7008|BC7010|BC708|BC728|BC7012|BC7030|BC7027|BC7026", 
      "ChangJiaTablet": "TPC7102|TPC7103|TPC7105|TPC7106|TPC7107|TPC7201|TPC7203|TPC7205|TPC7210|TPC7708|TPC7709|TPC7712|TPC7110|TPC8101|TPC8103|TPC8105|TPC8106|TPC8203|TPC8205|TPC8503|TPC9106|TPC9701|TPC97101|TPC97103|TPC97105|TPC97106|TPC97111|TPC97113|TPC97203|TPC97603|TPC97809|TPC97205|TPC10101|TPC10103|TPC10106|TPC10111|TPC10203|TPC10205|TPC10503", 
      "GUTablet": "TX-A1301|TX-M9002|Q702|kf026", 
      "PointOfViewTablet": "TAB-P506|TAB-navi-7-3G-M|TAB-P517|TAB-P-527|TAB-P701|TAB-P703|TAB-P721|TAB-P731N|TAB-P741|TAB-P825|TAB-P905|TAB-P925|TAB-PR945|TAB-PL1015|TAB-P1025|TAB-PI1045|TAB-P1325|TAB-PROTAB[0-9]+|TAB-PROTAB25|TAB-PROTAB26|TAB-PROTAB27|TAB-PROTAB26XL|TAB-PROTAB2-IPS9|TAB-PROTAB30-IPS9|TAB-PROTAB25XXL|TAB-PROTAB26-IPS10|TAB-PROTAB30-IPS10", 
      "OvermaxTablet": "OV-(SteelCore|NewBase|Basecore|Baseone|Exellen|Quattor|EduTab|Solution|ACTION|BasicTab|TeddyTab|MagicTab|Stream|TB-08|TB-09)|Qualcore 1027", 
      "HCLTablet": "HCL.*Tablet|Connect-3G-2.0|Connect-2G-2.0|ME Tablet U1|ME Tablet U2|ME Tablet G1|ME Tablet X1|ME Tablet Y2|ME Tablet Sync", 
      "DPSTablet": "DPS Dream 9|DPS Dual 7", 
      "VistureTablet": "V97 HD|i75 3G|Visture V4( HD)?|Visture V5( HD)?|Visture V10", 
      "CrestaTablet": "CTP(-)?810|CTP(-)?818|CTP(-)?828|CTP(-)?838|CTP(-)?888|CTP(-)?978|CTP(-)?980|CTP(-)?987|CTP(-)?988|CTP(-)?989", 
      "MediatekTablet": "\\bMT8125|MT8389|MT8135|MT8377\\b", 
      "ConcordeTablet": "Concorde([ ]+)?Tab|ConCorde ReadMan", 
      "GoCleverTablet": "GOCLEVER TAB|A7GOCLEVER|M1042|M7841|M742|R1042BK|R1041|TAB A975|TAB A7842|TAB A741|TAB A741L|TAB M723G|TAB M721|TAB A1021|TAB I921|TAB R721|TAB I720|TAB T76|TAB R70|TAB R76.2|TAB R106|TAB R83.2|TAB M813G|TAB I721|GCTA722|TAB I70|TAB I71|TAB S73|TAB R73|TAB R74|TAB R93|TAB R75|TAB R76.1|TAB A73|TAB A93|TAB A93.2|TAB T72|TAB R83|TAB R974|TAB R973|TAB A101|TAB A103|TAB A104|TAB A104.2|R105BK|M713G|A972BK|TAB A971|TAB R974.2|TAB R104|TAB R83.3|TAB A1042", 
      "ModecomTablet": "FreeTAB 9000|FreeTAB 7.4|FreeTAB 7004|FreeTAB 7800|FreeTAB 2096|FreeTAB 7.5|FreeTAB 1014|FreeTAB 1001 |FreeTAB 8001|FreeTAB 9706|FreeTAB 9702|FreeTAB 7003|FreeTAB 7002|FreeTAB 1002|FreeTAB 7801|FreeTAB 1331|FreeTAB 1004|FreeTAB 8002|FreeTAB 8014|FreeTAB 9704|FreeTAB 1003", 
      "VoninoTablet": "\\b(Argus[ _]?S|Diamond[ _]?79HD|Emerald[ _]?78E|Luna[ _]?70C|Onyx[ _]?S|Onyx[ _]?Z|Orin[ _]?HD|Orin[ _]?S|Otis[ _]?S|SpeedStar[ _]?S|Magnet[ _]?M9|Primus[ _]?94[ _]?3G|Primus[ _]?94HD|Primus[ _]?QS|Android.*\\bQ8\\b|Sirius[ _]?EVO[ _]?QS|Sirius[ _]?QS|Spirit[ _]?S)\\b", 
      "ECSTablet": "V07OT2|TM105A|S10OT1|TR10CS1", 
      "StorexTablet": "eZee[_']?(Tab|Go)[0-9]+|TabLC7|Looney Tunes Tab", 
      "VodafoneTablet": "SmartTab([ ]+)?[0-9]+|SmartTabII10|SmartTabII7|VF-1497|VFD 1400", 
      "EssentielBTablet": "Smart[ ']?TAB[ ]+?[0-9]+|Family[ ']?TAB2", 
      "RossMoorTablet": "RM-790|RM-997|RMD-878G|RMD-974R|RMT-705A|RMT-701|RME-601|RMT-501|RMT-711", 
      "iMobileTablet": "i-mobile i-note", 
      "TolinoTablet": "tolino tab [0-9.]+|tolino shine", 
      "AudioSonicTablet": "\\bC-22Q|T7-QC|T-17B|T-17P\\b", 
      "AMPETablet": "Android.* A78 ", 
      "SkkTablet": "Android.* (SKYPAD|PHOENIX|CYCLOPS)", 
      "TecnoTablet": "TECNO P9|TECNO DP8D", 
      "JXDTablet": "Android.* \\b(F3000|A3300|JXD5000|JXD3000|JXD2000|JXD300B|JXD300|S5800|S7800|S602b|S5110b|S7300|S5300|S602|S603|S5100|S5110|S601|S7100a|P3000F|P3000s|P101|P200s|P1000m|P200m|P9100|P1000s|S6600b|S908|P1000|P300|S18|S6600|S9100)\\b", 
      "iJoyTablet": "Tablet (Spirit 7|Essentia|Galatea|Fusion|Onix 7|Landa|Titan|Scooby|Deox|Stella|Themis|Argon|Unique 7|Sygnus|Hexen|Finity 7|Cream|Cream X2|Jade|Neon 7|Neron 7|Kandy|Scape|Saphyr 7|Rebel|Biox|Rebel|Rebel 8GB|Myst|Draco 7|Myst|Tab7-004|Myst|Tadeo Jones|Tablet Boing|Arrow|Draco Dual Cam|Aurix|Mint|Amity|Revolution|Finity 9|Neon 9|T9w|Amity 4GB Dual Cam|Stone 4GB|Stone 8GB|Andromeda|Silken|X2|Andromeda II|Halley|Flame|Saphyr 9,7|Touch 8|Planet|Triton|Unique 10|Hexen 10|Memphis 4GB|Memphis 8GB|Onix 10)", 
      "FX2Tablet": "FX2 PAD7|FX2 PAD10", 
      "XoroTablet": "KidsPAD 701|PAD[ ]?712|PAD[ ]?714|PAD[ ]?716|PAD[ ]?717|PAD[ ]?718|PAD[ ]?720|PAD[ ]?721|PAD[ ]?722|PAD[ ]?790|PAD[ ]?792|PAD[ ]?900|PAD[ ]?9715D|PAD[ ]?9716DR|PAD[ ]?9718DR|PAD[ ]?9719QR|PAD[ ]?9720QR|TelePAD1030|Telepad1032|TelePAD730|TelePAD731|TelePAD732|TelePAD735Q|TelePAD830|TelePAD9730|TelePAD795|MegaPAD 1331|MegaPAD 1851|MegaPAD 2151", 
      "ViewsonicTablet": "ViewPad 10pi|ViewPad 10e|ViewPad 10s|ViewPad E72|ViewPad7|ViewPad E100|ViewPad 7e|ViewSonic VB733|VB100a", 
      "VerizonTablet": "QTAQZ3|QTAIR7|QTAQTZ3|QTASUN1|QTASUN2|QTAXIA1", 
      "OdysTablet": "LOOX|XENO10|ODYS[ -](Space|EVO|Xpress|NOON)|\\bXELIO\\b|Xelio10Pro|XELIO7PHONETAB|XELIO10EXTREME|XELIOPT2|NEO_QUAD10", 
      "CaptivaTablet": "CAPTIVA PAD", 
      "IconbitTablet": "NetTAB|NT-3702|NT-3702S|NT-3702S|NT-3603P|NT-3603P|NT-0704S|NT-0704S|NT-3805C|NT-3805C|NT-0806C|NT-0806C|NT-0909T|NT-0909T|NT-0907S|NT-0907S|NT-0902S|NT-0902S", 
      "TeclastTablet": "T98 4G|\\bP80\\b|\\bX90HD\\b|X98 Air|X98 Air 3G|\\bX89\\b|P80 3G|\\bX80h\\b|P98 Air|\\bX89HD\\b|P98 3G|\\bP90HD\\b|P89 3G|X98 3G|\\bP70h\\b|P79HD 3G|G18d 3G|\\bP79HD\\b|\\bP89s\\b|\\bA88\\b|\\bP10HD\\b|\\bP19HD\\b|G18 3G|\\bP78HD\\b|\\bA78\\b|\\bP75\\b|G17s 3G|G17h 3G|\\bP85t\\b|\\bP90\\b|\\bP11\\b|\\bP98t\\b|\\bP98HD\\b|\\bG18d\\b|\\bP85s\\b|\\bP11HD\\b|\\bP88s\\b|\\bA80HD\\b|\\bA80se\\b|\\bA10h\\b|\\bP89\\b|\\bP78s\\b|\\bG18\\b|\\bP85\\b|\\bA70h\\b|\\bA70\\b|\\bG17\\b|\\bP18\\b|\\bA80s\\b|\\bA11s\\b|\\bP88HD\\b|\\bA80h\\b|\\bP76s\\b|\\bP76h\\b|\\bP98\\b|\\bA10HD\\b|\\bP78\\b|\\bP88\\b|\\bA11\\b|\\bA10t\\b|\\bP76a\\b|\\bP76t\\b|\\bP76e\\b|\\bP85HD\\b|\\bP85a\\b|\\bP86\\b|\\bP75HD\\b|\\bP76v\\b|\\bA12\\b|\\bP75a\\b|\\bA15\\b|\\bP76Ti\\b|\\bP81HD\\b|\\bA10\\b|\\bT760VE\\b|\\bT720HD\\b|\\bP76\\b|\\bP73\\b|\\bP71\\b|\\bP72\\b|\\bT720SE\\b|\\bC520Ti\\b|\\bT760\\b|\\bT720VE\\b|T720-3GE|T720-WiFi", 
      "OndaTablet": "\\b(V975i|Vi30|VX530|V701|Vi60|V701s|Vi50|V801s|V719|Vx610w|VX610W|V819i|Vi10|VX580W|Vi10|V711s|V813|V811|V820w|V820|Vi20|V711|VI30W|V712|V891w|V972|V819w|V820w|Vi60|V820w|V711|V813s|V801|V819|V975s|V801|V819|V819|V818|V811|V712|V975m|V101w|V961w|V812|V818|V971|V971s|V919|V989|V116w|V102w|V973|Vi40)\\b[\\s]+|V10 \\b4G\\b", 
      "JaytechTablet": "TPC-PA762", 
      "BlaupunktTablet": "Endeavour 800NG|Endeavour 1010", 
      "DigmaTablet": "\\b(iDx10|iDx9|iDx8|iDx7|iDxD7|iDxD8|iDsQ8|iDsQ7|iDsQ8|iDsD10|iDnD7|3TS804H|iDsQ11|iDj7|iDs10)\\b", 
      "EvolioTablet": "ARIA_Mini_wifi|Aria[ _]Mini|Evolio X10|Evolio X7|Evolio X8|\\bEvotab\\b|\\bNeura\\b", 
      "LavaTablet": "QPAD E704|\\bIvoryS\\b|E-TAB IVORY|\\bE-TAB\\b", 
      "AocTablet": "MW0811|MW0812|MW0922|MTK8382|MW1031|MW0831|MW0821|MW0931|MW0712", 
      "MpmanTablet": "MP11 OCTA|MP10 OCTA|MPQC1114|MPQC1004|MPQC994|MPQC974|MPQC973|MPQC804|MPQC784|MPQC780|\\bMPG7\\b|MPDCG75|MPDCG71|MPDC1006|MP101DC|MPDC9000|MPDC905|MPDC706HD|MPDC706|MPDC705|MPDC110|MPDC100|MPDC99|MPDC97|MPDC88|MPDC8|MPDC77|MP709|MID701|MID711|MID170|MPDC703|MPQC1010", 
      "CelkonTablet": "CT695|CT888|CT[\\s]?910|CT7 Tab|CT9 Tab|CT3 Tab|CT2 Tab|CT1 Tab|C820|C720|\\bCT-1\\b", 
      "WolderTablet": "miTab \\b(DIAMOND|SPACE|BROOKLYN|NEO|FLY|MANHATTAN|FUNK|EVOLUTION|SKY|GOCAR|IRON|GENIUS|POP|MINT|EPSILON|BROADWAY|JUMP|HOP|LEGEND|NEW AGE|LINE|ADVANCE|FEEL|FOLLOW|LIKE|LINK|LIVE|THINK|FREEDOM|CHICAGO|CLEVELAND|BALTIMORE-GH|IOWA|BOSTON|SEATTLE|PHOENIX|DALLAS|IN 101|MasterChef)\\b", 
      "MediacomTablet": "M-MPI10C3G|M-SP10EG|M-SP10EGP|M-SP10HXAH|M-SP7HXAH|M-SP10HXBH|M-SP8HXAH|M-SP8MXA", 
      "MiTablet": "\\bMI PAD\\b|\\bHM NOTE 1W\\b", 
      "NibiruTablet": "Nibiru M1|Nibiru Jupiter One", 
      "NexoTablet": "NEXO NOVA|NEXO 10|NEXO AVIO|NEXO FREE|NEXO GO|NEXO EVO|NEXO 3G|NEXO SMART|NEXO KIDDO|NEXO MOBI", 
      "LeaderTablet": "TBLT10Q|TBLT10I|TBL-10WDKB|TBL-10WDKBO2013|TBL-W230V2|TBL-W450|TBL-W500|SV572|TBLT7I|TBA-AC7-8G|TBLT79|TBL-8W16|TBL-10W32|TBL-10WKB|TBL-W100", 
      "UbislateTablet": "UbiSlate[\\s]?7C", 
      "PocketBookTablet": "Pocketbook", 
      "KocasoTablet": "\\b(TB-1207)\\b", 
      "HisenseTablet": "\\b(F5281|E2371)\\b", 
      "Hudl": "Hudl HT7S3|Hudl 2", 
      "TelstraTablet": "T-Hub2", 
      "GenericTablet": "Android.*\\b97D\\b|Tablet(?!.*PC)|BNTV250A|MID-WCDMA|LogicPD Zoom2|\\bA7EB\\b|CatNova8|A1_07|CT704|CT1002|\\bM721\\b|rk30sdk|\\bEVOTAB\\b|M758A|ET904|ALUMIUM10|Smartfren Tab|Endeavour 1010|Tablet-PC-4|Tagi Tab|\\bM6pro\\b|CT1020W|arc 10HD|\\bTP750\\b|\\bQTAQZ3\\b|WVT101|TM1088|KT107"}, 
     "oss": {"AndroidOS": "Android", 
      "BlackBerryOS": "blackberry|\\bBB10\\b|rim tablet os", 
      "PalmOS": "PalmOS|avantgo|blazer|elaine|hiptop|palm|plucker|xiino", 
      "SymbianOS": "Symbian|SymbOS|Series60|Series40|SYB-[0-9]+|\\bS60\\b", 
      "WindowsMobileOS": "Windows CE.*(PPC|Smartphone|Mobile|[0-9]{3}x[0-9]{3})|Windows Mobile|Windows Phone [0-9.]+|WCE;", 
      "WindowsPhoneOS": "Windows Phone 10.0|Windows Phone 8.1|Windows Phone 8.0|Windows Phone OS|XBLWP7|ZuneWP7|Windows NT 6.[23]; ARM;", 
      "iOS": "\\biPhone.*Mobile|\\biPod|\\biPad|AppleCoreMedia", 
      "iPadOS": "CPU OS 13", 
      "MeeGoOS": "MeeGo", 
      "MaemoOS": "Maemo", 
      "JavaOS": "J2ME\/|\\bMIDP\\b|\\bCLDC\\b", 
      "webOS": "webOS|hpwOS", 
      "badaOS": "\\bBada\\b", 
      "BREWOS": "BREW"}, 
     "uas": {"Chrome": "\\bCrMo\\b|CriOS|Android.*Chrome\/[.0-9]* (Mobile)?", 
      "Dolfin": "\\bDolfin\\b", 
      "Opera": "Opera.*Mini|Opera.*Mobi|Android.*Opera|Mobile.*OPR\/[0-9.]+$|Coast\/[0-9.]+", 
      "Skyfire": "Skyfire", 
      "Edge": "Mobile Safari\/[.0-9]* Edge", 
      "IE": "IEMobile|MSIEMobile", 
      "Firefox": "fennec|firefox.*maemo|(Mobile|Tablet).*Firefox|Firefox.*Mobile|FxiOS", 
      "Bolt": "bolt", 
      "TeaShark": "teashark", 
      "Blazer": "Blazer", 
      "Safari": "Version.*Mobile.*Safari|Safari.*Mobile|MobileSafari", 
      "WeChat": "\\bMicroMessenger\\b", 
      "UCBrowser": "UC.*Browser|UCWEB", 
      "baiduboxapp": "baiduboxapp", 
      "baidubrowser": "baidubrowser", 
      "DiigoBrowser": "DiigoBrowser", 
      "Mercury": "\\bMercury\\b", 
      "ObigoBrowser": "Obigo", 
      "NetFront": "NF-Browser", 
      "GenericBrowser": "NokiaBrowser|OviBrowser|OneBrowser|TwonkyBeamBrowser|SEMC.*Browser|FlyFlow|Minimo|NetFront|Novarra-Vision|MQQBrowser|MicroMessenger", 
      "PaleMoon": "Android.*PaleMoon|Mobile.*PaleMoon"}, 
     "props": {"Mobile": "Mobile\/[VER]", 
      "Build": "Build\/[VER]", 
      "Version": "Version\/[VER]", 
      "VendorID": "VendorID\/[VER]", 
      "iPad": "iPad.*CPU[a-z ]+[VER]", 
      "iPhone": "iPhone.*CPU[a-z ]+[VER]", 
      "iPod": "iPod.*CPU[a-z ]+[VER]", 
      "Kindle": "Kindle\/[VER]", 
      "Chrome": ["Chrome\/[VER]", "CriOS\/[VER]", "CrMo\/[VER]"], 
      "Coast": ["Coast\/[VER]"], 
      "Dolfin": "Dolfin\/[VER]", 
      "Firefox": ["Firefox\/[VER]", "FxiOS\/[VER]"], 
      "Fennec": "Fennec\/[VER]", 
      "Edge": "Edge\/[VER]", 
      "IE": ["IEMobile\/[VER];", "IEMobile [VER]", "MSIE [VER];", "Trident\/[0-9.]+;.*rv:[VER]"], 
      "NetFront": "NetFront\/[VER]", 
      "NokiaBrowser": "NokiaBrowser\/[VER]", 
      "Opera": [" OPR\/[VER]", "Opera Mini\/[VER]", "Version\/[VER]"], 
      "Opera Mini": "Opera Mini\/[VER]", 
      "Opera Mobi": "Version\/[VER]", 
      "UCBrowser": ["UCWEB[VER]", "UC.*Browser\/[VER]"], 
      "MQQBrowser": "MQQBrowser\/[VER]", 
      "MicroMessenger": "MicroMessenger\/[VER]", 
      "baiduboxapp": "baiduboxapp\/[VER]", 
      "baidubrowser": "baidubrowser\/[VER]", 
      "SamsungBrowser": "SamsungBrowser\/[VER]", 
      "Iron": "Iron\/[VER]", 
      "Safari": ["Version\/[VER]", "Safari\/[VER]"], 
      "Skyfire": "Skyfire\/[VER]", 
      "Tizen": "Tizen\/[VER]", 
      "Webkit": "webkit[ \/][VER]", 
      "PaleMoon": "PaleMoon\/[VER]", 
      "Gecko": "Gecko\/[VER]", 
      "Trident": "Trident\/[VER]", 
      "Presto": "Presto\/[VER]", 
      "Goanna": "Goanna\/[VER]", 
      "iOS": " \\bi?OS\\b [VER][ ;]{1}", 
      "Android": "Android [VER]", 
      "BlackBerry": ["BlackBerry[\\w]+\/[VER]", "BlackBerry.*Version\/[VER]", "Version\/[VER]"], 
      "BREW": "BREW [VER]", 
      "Java": "Java\/[VER]", 
      "Windows Phone OS": ["Windows Phone OS [VER]", "Windows Phone [VER]"], 
      "Windows Phone": "Windows Phone [VER]", 
      "Windows CE": "Windows CE\/[VER]", 
      "Windows NT": "Windows NT [VER]", 
      "Symbian": ["SymbianOS\/[VER]", "Symbian\/[VER]"], 
      "webOS": ["webOS\/[VER]", "hpwOS\/[VER];"]}, 
     "utils": {"Bot": "Googlebot|facebookexternalhit|Google-AMPHTML|s~amp-validator|AdsBot-Google|Google Keyword Suggestion|Facebot|YandexBot|YandexMobileBot|bingbot|ia_archiver|AhrefsBot|Ezooms|GSLFbot|WBSearchBot|Twitterbot|TweetmemeBot|Twikle|PaperLiBot|Wotbox|UnwindFetchor|Exabot|MJ12bot|YandexImages|TurnitinBot|Pingdom|contentkingapp", 
      "MobileBot": "Googlebot-Mobile|AdsBot-Google-Mobile|YahooSeeker\/M1A1-R2D2", 
      "DesktopMode": "WPDesktop", 
      "TV": "SonyDTV|HbbTV", 
      "WebKit": "(webkit)[ \/]([\\w.]+)", 
      "Console": "\\b(Nintendo|Nintendo WiiU|Nintendo 3DS|Nintendo Switch|PLAYSTATION|Xbox)\\b", 
      "Watch": "SM-V700"}}
      impl.detectMobileBrowsers = {fullPattern: /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i, 
     shortPattern: /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i, 
     tabletPattern: /android|ipad|playbook|silk/i}
      var hasOwnProp=Object.prototype.hasOwnProperty, isArray;
      impl.FALLBACK_PHONE = 'UnknownPhone';
      impl.FALLBACK_TABLET = 'UnknownTablet';
      impl.FALLBACK_MOBILE = 'UnknownMobile';
      isArray = ('isArray' in Array) ? Array.isArray : function (value) {
        return Object.prototype.toString.call(value)==='[object Array]';
      }
      function equalIC(a, b) {
        return a!=null&&b!=null&&a.toLowerCase()===b.toLowerCase();
      }
      function containsIC(array, value) {
        var valueLC, i, len=array.length;
        if (!len||!value) {
            return false;
        }
        valueLC = value.toLowerCase();
        for (i = 0; i<len; ++i) {
            if (valueLC===array[i].toLowerCase()) {
                return true;
            }
        }
        return false;
      }
      function convertPropsToRegExp(object) {
        for (var key in object) {
            if (hasOwnProp.call(object, key)) {
                object[key] = new RegExp(object[key], 'i');
            }
        }
      }
      function prepareUserAgent(userAgent) {
        return (userAgent||'').substr(0, 500);
      }(function init() {
        var key, values, value, i, len, verPos, mobileDetectRules=impl.mobileDetectRules;
        for (key in mobileDetectRules.props) {
            if (hasOwnProp.call(mobileDetectRules.props, key)) {
                values = mobileDetectRules.props[key];
                if (!isArray(values)) {
                    values = [values];
                }
                len = values.length;
                for (i = 0; i<len; ++i) {
                    value = values[i];
                    verPos = value.indexOf('[VER]');
                    if (verPos>=0) {
                        value = value.substring(0, verPos)+'([\\w._\\+]+)'+value.substring(verPos+5);
                    }
                    values[i] = new RegExp(value, 'i');
                }
                mobileDetectRules.props[key] = values;
            }
        }
        convertPropsToRegExp(mobileDetectRules.oss);
        convertPropsToRegExp(mobileDetectRules.phones);
        convertPropsToRegExp(mobileDetectRules.tablets);
        convertPropsToRegExp(mobileDetectRules.uas);
        convertPropsToRegExp(mobileDetectRules.utils);
        mobileDetectRules.oss0 = {WindowsPhoneOS: mobileDetectRules.oss.WindowsPhoneOS, 
      WindowsMobileOS: mobileDetectRules.oss.WindowsMobileOS}
      }());
      impl.findMatch = function (rules, userAgent) {
        for (var key in rules) {
            if (hasOwnProp.call(rules, key)) {
                if (rules[key].test(userAgent)) {
                    return key;
                }
            }
        }
        return null;
      }
      impl.findMatches = function (rules, userAgent) {
        var result=[];
        for (var key in rules) {
            if (hasOwnProp.call(rules, key)) {
                if (rules[key].test(userAgent)) {
                    result.push(key);
                }
            }
        }
        return result;
      }
      impl.getVersionStr = function (propertyName, userAgent) {
        var props=impl.mobileDetectRules.props, patterns, i, len, match;
        if (hasOwnProp.call(props, propertyName)) {
            patterns = props[propertyName];
            len = patterns.length;
            for (i = 0; i<len; ++i) {
                match = patterns[i].exec(userAgent);
                if (match!==null) {
                    return match[1];
                }
            }
        }
        return null;
      }
      impl.getVersion = function (propertyName, userAgent) {
        var version=impl.getVersionStr(propertyName, userAgent);
        return version ? impl.prepareVersionNo(version) : NaN;
      }
      impl.prepareVersionNo = function (version) {
        var numbers;
        numbers = version.split(/[a-z._ \/\-]/i);
        if (numbers.length===1) {
            version = numbers[0];
        }
        if (numbers.length>1) {
            version = numbers[0]+'.';
            numbers.shift();
            version+=numbers.join('');
        }
        return Number(version);
      }
      impl.isMobileFallback = function (userAgent) {
        return impl.detectMobileBrowsers.fullPattern.test(userAgent)||impl.detectMobileBrowsers.shortPattern.test(userAgent.substr(0, 4));
      }
      impl.isTabletFallback = function (userAgent) {
        return impl.detectMobileBrowsers.tabletPattern.test(userAgent);
      }
      impl.prepareDetectionCache = function (cache, userAgent, maxPhoneWidth) {
        if (cache.mobile!==undefined) {
            return ;
        }
        var phone, tablet, phoneSized;
        tablet = impl.findMatch(impl.mobileDetectRules.tablets, userAgent);
        if (tablet) {
            cache.mobile = cache.tablet = tablet;
            cache.phone = null;
            return ;
        }
        phone = impl.findMatch(impl.mobileDetectRules.phones, userAgent);
        if (phone) {
            cache.mobile = cache.phone = phone;
            cache.tablet = null;
            return ;
        }
        if (impl.isMobileFallback(userAgent)) {
            phoneSized = MobileDetect.isPhoneSized(maxPhoneWidth);
            if (phoneSized===undefined) {
                cache.mobile = impl.FALLBACK_MOBILE;
                cache.tablet = cache.phone = null;
            }
            else 
              if (phoneSized) {
                cache.mobile = cache.phone = impl.FALLBACK_PHONE;
                cache.tablet = null;
            }
            else {
              cache.mobile = cache.tablet = impl.FALLBACK_TABLET;
              cache.phone = null;
            }
        }
        else 
          if (impl.isTabletFallback(userAgent)) {
            cache.mobile = cache.tablet = impl.FALLBACK_TABLET;
            cache.phone = null;
        }
        else {
          cache.mobile = cache.tablet = cache.phone = null;
        }
      }
      impl.mobileGrade = function (t) {
        var $isMobile=t.mobile()!==null;
        if (t.os('iOS')&&t.version('iPad')>=4.3||t.os('iOS')&&t.version('iPhone')>=3.1||t.os('iOS')&&t.version('iPod')>=3.1||(t.version('Android')>2.1&&t.is('Webkit'))||t.version('Windows Phone OS')>=7.0||t.is('BlackBerry')&&t.version('BlackBerry')>=6.0||t.match('Playbook.*Tablet')||(t.version('webOS')>=1.4&&t.match('Palm|Pre|Pixi'))||t.match('hp.*TouchPad')||(t.is('Firefox')&&t.version('Firefox')>=12)||(t.is('Chrome')&&t.is('AndroidOS')&&t.version('Android')>=4.0)||(t.is('Skyfire')&&t.version('Skyfire')>=4.1&&t.is('AndroidOS')&&t.version('Android')>=2.3)||(t.is('Opera')&&t.version('Opera Mobi')>11&&t.is('AndroidOS'))||t.is('MeeGoOS')||t.is('Tizen')||t.is('Dolfin')&&t.version('Bada')>=2.0||((t.is('UC Browser')||t.is('Dolfin'))&&t.version('Android')>=2.3)||(t.match('Kindle Fire')||t.is('Kindle')&&t.version('Kindle')>=3.0)||t.is('AndroidOS')&&t.is('NookTablet')||t.version('Chrome')>=11&&!$isMobile||t.version('Safari')>=5.0&&!$isMobile||t.version('Firefox')>=4.0&&!$isMobile||t.version('MSIE')>=7.0&&!$isMobile||t.version('Opera')>=10&&!$isMobile) {
            return 'A';
        }
        if (t.os('iOS')&&t.version('iPad')<4.3||t.os('iOS')&&t.version('iPhone')<3.1||t.os('iOS')&&t.version('iPod')<3.1||t.is('Blackberry')&&t.version('BlackBerry')>=5&&t.version('BlackBerry')<6||(t.version('Opera Mini')>=5.0&&t.version('Opera Mini')<=6.5&&(t.version('Android')>=2.3||t.is('iOS')))||t.match('NokiaN8|NokiaC7|N97.*Series60|Symbian/3')||t.version('Opera Mobi')>=11&&t.is('SymbianOS')) {
            return 'B';
        }
        if (t.version('BlackBerry')<5.0||t.match('MSIEMobile|Windows CE.*Mobile')||t.version('Windows Mobile')<=5.2) {
            return 'C';
        }
        return 'C';
      }
      impl.detectOS = function (ua) {
        return impl.findMatch(impl.mobileDetectRules.oss0, ua)||impl.findMatch(impl.mobileDetectRules.oss, ua);
      }
      impl.getDeviceSmallerSide = function () {
        return window.screen.width<window.screen.height ? window.screen.width : window.screen.height;
      }
      function MobileDetect(userAgent, maxPhoneWidth) {
        this.ua = prepareUserAgent(userAgent);
        this._cache = {}
        this.maxPhoneWidth = maxPhoneWidth||600;
      }
      MobileDetect.prototype = {constructor: MobileDetect, 
     mobile: function () {
          impl.prepareDetectionCache(this._cache, this.ua, this.maxPhoneWidth);
          return this._cache.mobile;
        }, 
     phone: function () {
          impl.prepareDetectionCache(this._cache, this.ua, this.maxPhoneWidth);
          return this._cache.phone;
        }, 
     tablet: function () {
          impl.prepareDetectionCache(this._cache, this.ua, this.maxPhoneWidth);
          return this._cache.tablet;
        }, 
     userAgent: function () {
          if (this._cache.userAgent===undefined) {
              this._cache.userAgent = impl.findMatch(impl.mobileDetectRules.uas, this.ua);
          }
          return this._cache.userAgent;
        }, 
     userAgents: function () {
          if (this._cache.userAgents===undefined) {
              this._cache.userAgents = impl.findMatches(impl.mobileDetectRules.uas, this.ua);
          }
          return this._cache.userAgents;
        }, 
     os: function () {
          if (this._cache.os===undefined) {
              this._cache.os = impl.detectOS(this.ua);
          }
          return this._cache.os;
        }, 
     version: function (key) {
          return impl.getVersion(key, this.ua);
        }, 
     versionStr: function (key) {
          return impl.getVersionStr(key, this.ua);
        }, 
     is: function (key) {
          return containsIC(this.userAgents(), key)||equalIC(key, this.os())||equalIC(key, this.phone())||equalIC(key, this.tablet())||containsIC(impl.findMatches(impl.mobileDetectRules.utils, this.ua), key);
        }, 
     match: function (pattern) {
          if (!(__instance_of(pattern, RegExp))) {
              pattern = new RegExp(pattern, 'i');
          }
          return pattern.test(this.ua);
        }, 
     isPhoneSized: function (maxPhoneWidth) {
          return MobileDetect.isPhoneSized(maxPhoneWidth||this.maxPhoneWidth);
        }, 
     mobileGrade: function () {
          if (this._cache.grade===undefined) {
              this._cache.grade = impl.mobileGrade(this);
          }
          return this._cache.grade;
        }}
      if (typeof window!=='undefined'&&window.screen) {
          MobileDetect.isPhoneSized = function (maxPhoneWidth) {
            return maxPhoneWidth<0 ? undefined : impl.getDeviceSmallerSide()<=maxPhoneWidth;
          };
      }
      else {
        MobileDetect.isPhoneSized = function () {
        };
      }
      MobileDetect._impl = impl;
      MobileDetect.version = '1.4.4 2019-09-21';
      return MobileDetect;
    });
  })((function (undefined) {
    if (typeof module!=='undefined'&&module.exports) {
        return function (factory) {
          module.exports = factory();
        }
    }
    else 
      if (typeof define==='function'&&define.amd) {
        return define;
    }
    else 
      if (typeof window!=='undefined') {
        return function (factory) {
          window.MobileDetect = factory();
        }
    }
    else {
      throw new Error('unknown environment');
    }
  })());
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/mobile-detect.js');


es6_module_define('nstructjs', [], function _nstructjs_module(_es6_module) {
  let nexports=(function () {
    if (typeof window==="undefined"&&typeof global!="undefined") {
        global._nGlobal = global;
    }
    else 
      if (typeof self!=="undefined") {
        self._nGlobal = self;
    }
    else {
      window._nGlobal = window;
    }
    let exports;
    let module={}
    if (typeof window==="undefined"&&typeof global!=="undefined") {
        console.log("Nodejs!");
    }
    else {
      exports = {};
      _nGlobal.module = {exports: exports};
    }
    'use strict';
    Object.defineProperty(exports, '__esModule', {value: true});
    let colormap={"black": 30, 
    "red": 31, 
    "green": 32, 
    "yellow": 33, 
    "blue": 34, 
    "magenta": 35, 
    "cyan": 36, 
    "white": 37, 
    "reset": 0, 
    "grey": 2, 
    "orange": 202, 
    "pink": 198, 
    "brown": 314, 
    "lightred": 91, 
    "peach": 210}
    let termColorMap={}
    for (let k in colormap) {
        termColorMap[k] = colormap[k];
        termColorMap[colormap[k]] = k;
    }
    function termColor(s, c) {
      if (typeof s==="symbol") {
          s = s.toString();
      }
      else {
        s = ""+s;
      }
      if (c in colormap)
        c = colormap[c];
      if (c>107) {
          let s2='\u001b[38;5;'+c+"m";
          return s2+s+'\u001b[0m';
      }
      return '\u001b['+c+'m'+s+'\u001b[0m';
    }
    function termPrint() {
      let s='';
      for (let i=0; i<arguments.length; i++) {
          if (i>0) {
              s+=' ';
          }
          s+=arguments[i];
      }
      let re1a=/\u001b\[[1-9][0-9]?m/;
      let re1b=/\u001b\[[1-9][0-9];[0-9][0-9]?;[0-9]+m/;
      let re2=/\u001b\[0m/;
      let endtag='\u001b[0m';
      function tok(s, type) {
        return {type: type, 
      value: s}
      }
      let tokdef=[[re1a, "start"], [re1b, "start"], [re2, "end"]];
      let s2=s;
      let i=0;
      let tokens=[];
      while (s2.length>0) {
        let ok=false;
        let mintk=undefined, mini=undefined;
        let minslice=undefined, mintype=undefined;
        for (let tk of tokdef) {
            let i=s2.search(tk[0]);
            if (i>=0&&(mini===undefined||i<mini)) {
                minslice = s2.slice(i, s2.length).match(tk[0])[0];
                mini = i;
                mintype = tk[1];
                mintk = tk;
                ok = true;
            }
        }
        if (!ok) {
            break;
        }
        if (mini>0) {
            let chunk=s2.slice(0, mini);
            tokens.push(tok(chunk, "chunk"));
        }
        s2 = s2.slice(mini+minslice.length, s2.length);
        let t=tok(minslice, mintype);
        tokens.push(t);
      }
      if (s2.length>0) {
          tokens.push(tok(s2, "chunk"));
      }
      let stack=[];
      let cur;
      let out='';
      for (let t of tokens) {
          if (t.type==="chunk") {
              out+=t.value;
          }
          else 
            if (t.type==="start") {
              stack.push(cur);
              cur = t.value;
              out+=t.value;
          }
          else 
            if (t.type==="end") {
              cur = stack.pop();
              if (cur) {
                  out+=cur;
              }
              else {
                out+=endtag;
              }
          }
      }
      return out;
    }
    "use strict";
    function print_lines(ld, lineno, col, printColors, token) {
      let buf='';
      let lines=ld.split("\n");
      let istart=Math.max(lineno-5, 0);
      let iend=Math.min(lineno+3, lines.length);
      let color=printColors ? (c) =>        {
        return c;
      } : termColor;
      for (let i=istart; i<iend; i++) {
          let l=""+(i+1);
          while (l.length<3) {
            l = " "+l;
          }
          l+=`: ${lines[i]}\n`;
          if (i===lineno&&token&&token.value.length===1) {
              l = l.slice(0, col+5)+color(l[col+5], "yellow")+l.slice(col+6, l.length);
          }
          buf+=l;
          if (i===lineno) {
              let colstr='     ';
              for (let i=0; i<col; i++) {
                  colstr+=' ';
              }
              colstr+=color("^", "red");
              buf+=colstr+"\n";
          }
      }
      buf = "------------------\n"+buf+"\n==================\n";
      return buf;
    }
    class token  {
       constructor(type, val, lexpos, lineno, lexer, parser, col) {
        this.type = type;
        this.value = val;
        this.lexpos = lexpos;
        this.lineno = lineno;
        this.col = col;
        this.lexer = lexer;
        this.parser = parser;
      }
       toString() {
        if (this.value!==undefined)
          return "token(type="+this.type+", value='"+this.value+"')";
        else 
          return "token(type="+this.type+")";
      }
    }
    _ESClass.register(token);
    _es6_module.add_class(token);
    class tokdef  {
       constructor(name, regexpr, func, example) {
        this.name = name;
        this.re = regexpr;
        this.func = func;
        this.example = example;
        if (example===undefined&&regexpr) {
            let s=""+regexpr;
            if (s.startsWith("/")&&s.endsWith("/")) {
                s = s.slice(1, s.length-1);
            }
            if (s.startsWith("\\")) {
                s = s.slice(1, s.length);
            }
            s = s.trim();
            if (s.length===1) {
                this.example = s;
            }
        }
      }
    }
    _ESClass.register(tokdef);
    _es6_module.add_class(tokdef);
    class PUTIL_ParseError extends Error {
       constructor(msg) {
        super();
      }
    }
    _ESClass.register(PUTIL_ParseError);
    _es6_module.add_class(PUTIL_ParseError);
    class lexer  {
       constructor(tokdef, errfunc) {
        this.tokdef = tokdef;
        this.tokens = new Array();
        this.lexpos = 0;
        this.lexdata = "";
        this.colmap = undefined;
        this.lineno = 0;
        this.printTokens = false;
        this.linestart = 0;
        this.errfunc = errfunc;
        this.linemap = undefined;
        this.tokints = {};
        for (let i=0; i<tokdef.length; i++) {
            this.tokints[tokdef[i].name] = i;
        }
        this.statestack = [["__main__", 0]];
        this.states = {"__main__": [tokdef, errfunc]};
        this.statedata = 0;
        this.logger = function () {
          console.log(...arguments);
        };
      }
       add_state(name, tokdef, errfunc) {
        if (errfunc===undefined) {
            errfunc = function (lexer) {
              return true;
            };
        }
        this.states[name] = [tokdef, errfunc];
      }
       tok_int(name) {

      }
       push_state(state, statedata) {
        this.statestack.push([state, statedata]);
        state = this.states[state];
        this.statedata = statedata;
        this.tokdef = state[0];
        this.errfunc = state[1];
      }
       pop_state() {
        let item=this.statestack[this.statestack.length-1];
        let state=this.states[item[0]];
        this.tokdef = state[0];
        this.errfunc = state[1];
        this.statedata = item[1];
      }
       input(str) {
        let linemap=this.linemap = new Array(str.length);
        let lineno=0;
        let col=0;
        let colmap=this.colmap = new Array(str.length);
        for (let i=0; i<str.length; i++, col++) {
            let c=str[i];
            linemap[i] = lineno;
            colmap[i] = col;
            if (c==="\n") {
                lineno++;
                col = 0;
            }
        }
        while (this.statestack.length>1) {
          this.pop_state();
        }
        this.lexdata = str;
        this.lexpos = 0;
        this.lineno = 0;
        this.tokens = new Array();
        this.peeked_tokens = [];
      }
       error() {
        if (this.errfunc!==undefined&&!this.errfunc(this))
          return ;
        let safepos=Math.min(this.lexpos, this.lexdata.length-1);
        let line=this.linemap[safepos];
        let col=this.colmap[safepos];
        let s=print_lines(this.lexdata, line, col, true);
        this.logger("  "+s);
        this.logger("Syntax error near line "+(this.lineno+1));
        let next=Math.min(this.lexpos+8, this.lexdata.length);
        throw new PUTIL_ParseError("Parse error");
      }
       peek() {
        let tok=this.next(true);
        if (tok===undefined)
          return undefined;
        this.peeked_tokens.push(tok);
        return tok;
      }
       peeknext() {
        if (this.peeked_tokens.length>0) {
            return this.peeked_tokens[0];
        }
        return this.peek();
      }
       at_end() {
        return this.lexpos>=this.lexdata.length&&this.peeked_tokens.length===0;
      }
       next(ignore_peek) {
        if (!ignore_peek&&this.peeked_tokens.length>0) {
            let tok=this.peeked_tokens[0];
            this.peeked_tokens.shift();
            if (!ignore_peek&&this.printTokens) {
                this.logger(""+tok);
            }
            return tok;
        }
        if (this.lexpos>=this.lexdata.length)
          return undefined;
        let ts=this.tokdef;
        let tlen=ts.length;
        let lexdata=this.lexdata.slice(this.lexpos, this.lexdata.length);
        let results=[];
        for (var i=0; i<tlen; i++) {
            let t=ts[i];
            if (t.re===undefined)
              continue;
            let res=t.re.exec(lexdata);
            if (res!==null&&res!==undefined&&res.index===0) {
                results.push([t, res]);
            }
        }
        let max_res=0;
        let theres=undefined;
        for (var i=0; i<results.length; i++) {
            let res=results[i];
            if (res[1][0].length>max_res) {
                theres = res;
                max_res = res[1][0].length;
            }
        }
        if (theres===undefined) {
            this.error();
            return ;
        }
        let def=theres[0];
        let col=this.colmap[Math.min(this.lexpos, this.lexdata.length-1)];
        if (this.lexpos<this.lexdata.length) {
            this.lineno = this.linemap[this.lexpos];
        }
        let tok=new token(def.name, theres[1][0], this.lexpos, this.lineno, this, undefined, col);
        this.lexpos+=tok.value.length;
        if (def.func) {
            tok = def.func(tok);
            if (tok===undefined) {
                return this.next();
            }
        }
        if (!ignore_peek&&this.printTokens) {
            this.logger(""+tok);
        }
        return tok;
      }
    }
    _ESClass.register(lexer);
    _es6_module.add_class(lexer);
    class parser  {
       constructor(lexer, errfunc) {
        this.lexer = lexer;
        this.errfunc = errfunc;
        this.start = undefined;
        this.logger = function () {
          console.log(...arguments);
        };
      }
       parse(data, err_on_unconsumed) {
        if (err_on_unconsumed===undefined)
          err_on_unconsumed = true;
        if (data!==undefined)
          this.lexer.input(data);
        let ret=this.start(this);
        if (err_on_unconsumed&&!this.lexer.at_end()&&this.lexer.next()!==undefined) {
            this.error(undefined, "parser did not consume entire input");
        }
        return ret;
      }
       input(data) {
        this.lexer.input(data);
      }
       error(token, msg) {
        let estr;
        if (msg===undefined)
          msg = "";
        if (token===undefined)
          estr = "Parse error at end of input: "+msg;
        else 
          estr = `Parse error at line ${token.lineno + 1}:${token.col+1}: ${msg}`;
        let buf="";
        let ld=this.lexer.lexdata;
        let lineno=token ? token.lineno : this.lexer.linemap[this.lexer.linemap.length-1];
        let col=token ? token.col : 0;
        ld = ld.replace(/\r/g, '');
        this.logger(print_lines(ld, lineno, col, true, token));
        this.logger(estr);
        if (this.errfunc&&!this.errfunc(token)) {
            return ;
        }
        throw new PUTIL_ParseError(estr);
      }
       peek() {
        let tok=this.lexer.peek();
        if (tok!==undefined)
          tok.parser = this;
        return tok;
      }
       peeknext() {
        let tok=this.lexer.peeknext();
        if (tok!==undefined)
          tok.parser = this;
        return tok;
      }
       next() {
        let tok=this.lexer.next();
        if (tok!==undefined)
          tok.parser = this;
        return tok;
      }
       optional(type) {
        let tok=this.peek();
        if (tok===undefined)
          return false;
        if (tok.type===type) {
            this.next();
            return true;
        }
        return false;
      }
       at_end() {
        return this.lexer.at_end();
      }
       expect(type, msg) {
        let tok=this.next();
        if (msg===undefined) {
            msg = type;
            for (let tk of this.lexer.tokdef) {
                if (tk.name===type&&tk.example) {
                    msg = tk.example;
                }
            }
        }
        if (tok===undefined||tok.type!==type) {
            this.error(tok, "Expected "+msg);
        }
        return tok.value;
      }
    }
    _ESClass.register(parser);
    _es6_module.add_class(parser);
    function test_parser() {
      let basic_types=new Set(["int", "float", "double", "vec2", "vec3", "vec4", "mat4", "string"]);
      let reserved_tokens=new Set(["int", "float", "double", "vec2", "vec3", "vec4", "mat4", "string", "static_string", "array"]);
      function tk(name, re, func) {
        return new tokdef(name, re, func);
      }
      let tokens=[tk("ID", /[a-zA-Z]+[a-zA-Z0-9_]*/, function (t) {
        if (reserved_tokens.has(t.value)) {
            t.type = t.value.toUpperCase();
        }
        return t;
      }), tk("OPEN", /\{/), tk("CLOSE", /}/), tk("COLON", /:/), tk("JSCRIPT", /\|/, function (t) {
        let js="";
        let lexer=t.lexer;
        while (lexer.lexpos<lexer.lexdata.length) {
          let c=lexer.lexdata[lexer.lexpos];
          if (c==="\n")
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
      }), tk("LPARAM", /\(/), tk("RPARAM", /\)/), tk("COMMA", /,/), tk("NUM", /[0-9]/), tk("SEMI", /;/), tk("NEWLINE", /\n/, function (t) {
        t.lexer.lineno+=1;
      }), tk("SPACE", / |\t/, function (t) {
      })];
      for (let rt of reserved_tokens) {
          tokens.push(tk(rt.toUpperCase()));
      }
      let a=`
  Loop {
    eid : int;
    flag : int;
    index : int;
    type : int;

    co : vec3;
    no : vec3;
    loop : int | eid(loop);
    edges : array(e, int) | e.eid;

    loops :, array(Loop);
  }
  `;
      function errfunc(lexer) {
        return true;
      }
      let lex=new lexer(tokens, errfunc);
      console.log("Testing lexical scanner...");
      lex.input(a);
      let token;
      while (token = lex.next()) {
        console.log(token.toString());
      }
      let parse=new parser(lex);
      parse.input(a);
      function p_Array(p) {
        p.expect("ARRAY");
        p.expect("LPARAM");
        let arraytype=p_Type(p);
        let itername="";
        if (p.optional("COMMA")) {
            itername = arraytype;
            arraytype = p_Type(p);
        }
        p.expect("RPARAM");
        return {type: "array", 
      data: {type: arraytype, 
       iname: itername}}
      }
      function p_Type(p) {
        let tok=p.peek();
        if (tok.type==="ID") {
            p.next();
            return {type: "struct", 
        data: "\""+tok.value+"\""}
        }
        else 
          if (basic_types.has(tok.type.toLowerCase())) {
            p.next();
            return {type: tok.type.toLowerCase()}
        }
        else 
          if (tok.type==="ARRAY") {
            return p_Array(p);
        }
        else {
          p.error(tok, "invalid type "+tok.type);
        }
      }
      function p_Field(p) {
        let field={}
        console.log("-----", p.peek().type);
        field.name = p.expect("ID", "struct field name");
        p.expect("COLON");
        field.type = p_Type(p);
        field.set = undefined;
        field.get = undefined;
        let tok=p.peek();
        if (tok.type==="JSCRIPT") {
            field.get = tok.value;
            p.next();
        }
        tok = p.peek();
        if (tok.type==="JSCRIPT") {
            field.set = tok.value;
            p.next();
        }
        p.expect("SEMI");
        return field;
      }
      function p_Struct(p) {
        let st={}
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
      let ret=p_Struct(parse);
      console.log(JSON.stringify(ret));
    }
    var struct_parseutil=Object.freeze({__proto__: null, 
    token: token, 
    tokdef: tokdef, 
    PUTIL_ParseError: PUTIL_ParseError, 
    lexer: lexer, 
    parser: parser});
    "use strict";
    class NStruct  {
       constructor(name) {
        this.fields = [];
        this.id = -1;
        this.name = name;
      }
    }
    _ESClass.register(NStruct);
    _es6_module.add_class(NStruct);
    const StructEnum={INT: 0, 
    FLOAT: 1, 
    DOUBLE: 2, 
    STRING: 7, 
    STATIC_STRING: 8, 
    STRUCT: 9, 
    TSTRUCT: 10, 
    ARRAY: 11, 
    ITER: 12, 
    SHORT: 13, 
    BYTE: 14, 
    BOOL: 15, 
    ITERKEYS: 16, 
    UINT: 17, 
    USHORT: 18, 
    STATIC_ARRAY: 19, 
    SIGNED_BYTE: 20}
    const ValueTypes=new Set([StructEnum.INT, StructEnum.FLOAT, StructEnum.DOUBLE, StructEnum.STRING, StructEnum.STATIC_STRING, StructEnum.SHORT, StructEnum.BYTE, StructEnum.BOOL, StructEnum.UINT, StructEnum.USHORT, StructEnum.SIGNED_BYTE]);
    let StructTypes={"int": StructEnum.INT, 
    "uint": StructEnum.UINT, 
    "ushort": StructEnum.USHORT, 
    "float": StructEnum.FLOAT, 
    "double": StructEnum.DOUBLE, 
    "string": StructEnum.STRING, 
    "static_string": StructEnum.STATIC_STRING, 
    "struct": StructEnum.STRUCT, 
    "abstract": StructEnum.TSTRUCT, 
    "array": StructEnum.ARRAY, 
    "iter": StructEnum.ITER, 
    "short": StructEnum.SHORT, 
    "byte": StructEnum.BYTE, 
    "bool": StructEnum.BOOL, 
    "iterkeys": StructEnum.ITERKEYS, 
    "sbyte": StructEnum.SIGNED_BYTE}
    let StructTypeMap={}
    for (let k in StructTypes) {
        StructTypeMap[StructTypes[k]] = k;
    }
    function gen_tabstr(t) {
      let s="";
      for (let i=0; i<t; i++) {
          s+="  ";
      }
      return s;
    }
    function stripComments(buf) {
      let s='';
      const MAIN=0, COMMENT=1, STR=2;
      let p, n;
      let strs=new Set(["'", '"', "`"]);
      let mode=MAIN;
      let strlit;
      let escape=false;
      for (let i=0; i<buf.length; i++) {
          let p=i>0 ? buf[i-1] : undefined;
          let c=buf[i];
          let n=i<buf.length-1 ? buf[i+1] : undefined;
          switch (mode) {
            case MAIN:
              if (c==="/"&&n==="/") {
                  mode = COMMENT;
                  continue;
              }
              if (strs.has(c)) {
                  strlit = c;
                  mode = STR;
              }
              s+=c;
              break;
            case COMMENT:
              if (n==="\n") {
                  mode = MAIN;
              }
              break;
            case STR:
              if (c===strlit&&!escape) {
                  mode = MAIN;
              }
              s+=c;
              break;
          }
          if (c==="\\") {
              escape^=true;
          }
          else {
            escape = false;
          }
      }
      return s;
    }
    function StructParser() {
      let basic_types=new Set(["int", "float", "double", "string", "short", "byte", "sbyte", "bool", "uint", "ushort"]);
      let reserved_tokens=new Set(["int", "float", "double", "string", "static_string", "array", "iter", "abstract", "short", "byte", "sbyte", "bool", "iterkeys", "uint", "ushort", "static_array"]);
      function tk(name, re, func) {
        return new tokdef(name, re, func);
      }
      let tokens=[tk("ID", /[a-zA-Z_$]+[a-zA-Z0-9_\.$]*/, function (t) {
        if (reserved_tokens.has(t.value)) {
            t.type = t.value.toUpperCase();
        }
        return t;
      }, "identifier"), tk("OPEN", /\{/), tk("EQUALS", /=/), tk("CLOSE", /}/), tk("STRLIT", /\"[^"]*\"/, (t) =>        {
        t.value = t.value.slice(1, t.value.length-1);
        return t;
      }), tk("STRLIT", /\'[^']*\'/, (t) =>        {
        t.value = t.value.slice(1, t.value.length-1);
        return t;
      }), tk("COLON", /:/), tk("SOPEN", /\[/), tk("SCLOSE", /\]/), tk("JSCRIPT", /\|/, function (t) {
        let js="";
        let lexer=t.lexer;
        while (lexer.lexpos<lexer.lexdata.length) {
          let c=lexer.lexdata[lexer.lexpos];
          if (c==="\n")
            break;
          js+=c;
          lexer.lexpos++;
        }
        while (js.trim().endsWith(";")) {
          js = js.slice(0, js.length-1);
          lexer.lexpos--;
        }
        t.value = js.trim();
        return t;
      }), tk("LPARAM", /\(/), tk("RPARAM", /\)/), tk("COMMA", /,/), tk("NUM", /[0-9]+/, undefined, "number"), tk("SEMI", /;/), tk("NEWLINE", /\n/, function (t) {
        t.lexer.lineno+=1;
      }, "newline"), tk("SPACE", / |\t/, function (t) {
      }, "whitespace")];
      reserved_tokens.forEach(function (rt) {
        tokens.push(tk(rt.toUpperCase()));
      });
      function errfunc(lexer) {
        return true;
      }
      class Lexer extends lexer {
         input(str) {
          str = stripComments(str);
          return super.input(str);
        }
      }
      _ESClass.register(Lexer);
      _es6_module.add_class(Lexer);
      let lex=new Lexer(tokens, errfunc);
      let parser$1=new parser(lex);
      function p_Static_String(p) {
        p.expect("STATIC_STRING");
        p.expect("SOPEN");
        let num=p.expect("NUM");
        p.expect("SCLOSE");
        return {type: StructEnum.STATIC_STRING, 
      data: {maxlength: num}}
      }
      function p_DataRef(p) {
        p.expect("DATAREF");
        p.expect("LPARAM");
        let tname=p.expect("ID");
        p.expect("RPARAM");
        return {type: StructEnum.DATAREF, 
      data: tname}
      }
      function p_Array(p) {
        p.expect("ARRAY");
        p.expect("LPARAM");
        let arraytype=p_Type(p);
        let itername="";
        if (p.optional("COMMA")) {
            itername = arraytype.data.replace(/"/g, "");
            arraytype = p_Type(p);
        }
        p.expect("RPARAM");
        return {type: StructEnum.ARRAY, 
      data: {type: arraytype, 
       iname: itername}}
      }
      function p_Iter(p) {
        p.expect("ITER");
        p.expect("LPARAM");
        let arraytype=p_Type(p);
        let itername="";
        if (p.optional("COMMA")) {
            itername = arraytype.data.replace(/"/g, "");
            arraytype = p_Type(p);
        }
        p.expect("RPARAM");
        return {type: StructEnum.ITER, 
      data: {type: arraytype, 
       iname: itername}}
      }
      function p_StaticArray(p) {
        p.expect("STATIC_ARRAY");
        p.expect("SOPEN");
        let arraytype=p_Type(p);
        let itername="";
        p.expect("COMMA");
        let size=p.expect("NUM");
        if (size<0||Math.abs(size-Math.floor(size))>1e-06) {
            console.log(Math.abs(size-Math.floor(size)));
            p.error("Expected an integer");
        }
        size = Math.floor(size);
        if (p.optional("COMMA")) {
            itername = p_Type(p).data;
        }
        p.expect("SCLOSE");
        return {type: StructEnum.STATIC_ARRAY, 
      data: {type: arraytype, 
       size: size, 
       iname: itername}}
      }
      function p_IterKeys(p) {
        p.expect("ITERKEYS");
        p.expect("LPARAM");
        let arraytype=p_Type(p);
        let itername="";
        if (p.optional("COMMA")) {
            itername = arraytype.data.replace(/"/g, "");
            arraytype = p_Type(p);
        }
        p.expect("RPARAM");
        return {type: StructEnum.ITERKEYS, 
      data: {type: arraytype, 
       iname: itername}}
      }
      function p_Abstract(p) {
        p.expect("ABSTRACT");
        p.expect("LPARAM");
        let type=p.expect("ID");
        let jsonKeyword="_structName";
        if (p.optional("COMMA")) {
            jsonKeyword = p.expect("STRLIT");
        }
        p.expect("RPARAM");
        return {type: StructEnum.TSTRUCT, 
      data: type, 
      jsonKeyword: jsonKeyword}
      }
      function p_Type(p) {
        let tok=p.peek();
        if (tok.type==="ID") {
            p.next();
            return {type: StructEnum.STRUCT, 
        data: tok.value}
        }
        else 
          if (basic_types.has(tok.type.toLowerCase())) {
            p.next();
            return {type: StructTypes[tok.type.toLowerCase()]}
        }
        else 
          if (tok.type==="ARRAY") {
            return p_Array(p);
        }
        else 
          if (tok.type==="ITER") {
            return p_Iter(p);
        }
        else 
          if (tok.type==="ITERKEYS") {
            return p_IterKeys(p);
        }
        else 
          if (tok.type==="STATIC_ARRAY") {
            return p_StaticArray(p);
        }
        else 
          if (tok.type==="STATIC_STRING") {
            return p_Static_String(p);
        }
        else 
          if (tok.type==="ABSTRACT") {
            return p_Abstract(p);
        }
        else 
          if (tok.type==="DATAREF") {
            return p_DataRef(p);
        }
        else {
          p.error(tok, "invalid type "+tok.type);
        }
      }
      function p_ID_or_num(p) {
        let t=p.peeknext();
        if (t.type==="NUM") {
            p.next();
            return t.value;
        }
        else {
          return p.expect("ID", "struct field name");
        }
      }
      function p_Field(p) {
        let field={}
        field.name = p_ID_or_num(p);
        p.expect("COLON");
        field.type = p_Type(p);
        field.set = undefined;
        field.get = undefined;
        let check=0;
        let tok=p.peek();
        if (tok.type==="JSCRIPT") {
            field.get = tok.value;
            check = 1;
            p.next();
        }
        tok = p.peek();
        if (tok.type==="JSCRIPT") {
            check = 1;
            field.set = tok.value;
            p.next();
        }
        p.expect("SEMI");
        return field;
      }
      function p_Struct(p) {
        let name=p.expect("ID", "struct name");
        let st=new NStruct(name);
        let tok=p.peek();
        let id=-1;
        if (tok.type==="ID"&&tok.value==="id") {
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
      parser$1.start = p_Struct;
      return parser$1;
    }
    const struct_parse=StructParser();
    var struct_parser=Object.freeze({__proto__: null, 
    NStruct: NStruct, 
    StructEnum: StructEnum, 
    ValueTypes: ValueTypes, 
    StructTypes: StructTypes, 
    StructTypeMap: StructTypeMap, 
    stripComments: stripComments, 
    struct_parse: struct_parse});
    var struct_typesystem=Object.freeze({__proto__: null});
    "use strict";
    var STRUCT_ENDIAN=true;
    function setBinaryEndian(mode) {
      STRUCT_ENDIAN = !!mode;
    }
    let temp_dataview=new DataView(new ArrayBuffer(16));
    let uint8_view=new Uint8Array(temp_dataview.buffer);
    class unpack_context  {
       constructor() {
        this.i = 0;
      }
    }
    _ESClass.register(unpack_context);
    _es6_module.add_class(unpack_context);
    function pack_byte(array, val) {
      array.push(val);
    }
    function pack_sbyte(array, val) {
      if (val<0) {
          val = 256+val;
      }
      array.push(val);
    }
    function pack_bytes(array, bytes) {
      for (let i=0; i<bytes.length; i++) {
          array.push(bytes[i]);
      }
    }
    function pack_int(array, val) {
      temp_dataview.setInt32(0, val, STRUCT_ENDIAN);
      array.push(uint8_view[0]);
      array.push(uint8_view[1]);
      array.push(uint8_view[2]);
      array.push(uint8_view[3]);
    }
    function pack_uint(array, val) {
      temp_dataview.setUint32(0, val, STRUCT_ENDIAN);
      array.push(uint8_view[0]);
      array.push(uint8_view[1]);
      array.push(uint8_view[2]);
      array.push(uint8_view[3]);
    }
    function pack_ushort(array, val) {
      temp_dataview.setUint16(0, val, STRUCT_ENDIAN);
      array.push(uint8_view[0]);
      array.push(uint8_view[1]);
    }
    function pack_float(array, val) {
      temp_dataview.setFloat32(0, val, STRUCT_ENDIAN);
      array.push(uint8_view[0]);
      array.push(uint8_view[1]);
      array.push(uint8_view[2]);
      array.push(uint8_view[3]);
    }
    function pack_double(array, val) {
      temp_dataview.setFloat64(0, val, STRUCT_ENDIAN);
      array.push(uint8_view[0]);
      array.push(uint8_view[1]);
      array.push(uint8_view[2]);
      array.push(uint8_view[3]);
      array.push(uint8_view[4]);
      array.push(uint8_view[5]);
      array.push(uint8_view[6]);
      array.push(uint8_view[7]);
    }
    function pack_short(array, val) {
      temp_dataview.setInt16(0, val, STRUCT_ENDIAN);
      array.push(uint8_view[0]);
      array.push(uint8_view[1]);
    }
    function encode_utf8(arr, str) {
      for (let i=0; i<str.length; i++) {
          let c=str.charCodeAt(i);
          while (c!==0) {
            let uc=c&127;
            c = c>>7;
            if (c!==0)
              uc|=128;
            arr.push(uc);
          }
      }
    }
    function decode_utf8(arr) {
      let str="";
      let i=0;
      while (i<arr.length) {
        let c=arr[i];
        let sum=c&127;
        let j=0;
        let lasti=i;
        while (i<arr.length&&(c&128)) {
          j+=7;
          i++;
          c = arr[i];
          c = (c&127)<<j;
          sum|=c;
        }
        if (sum===0)
          break;
        str+=String.fromCharCode(sum);
        i++;
      }
      return str;
    }
    function test_utf8() {
      let s="a"+String.fromCharCode(8800)+"b";
      let arr=[];
      encode_utf8(arr, s);
      let s2=decode_utf8(arr);
      if (s!==s2) {
          throw new Error("UTF-8 encoding/decoding test failed");
      }
      return true;
    }
    function truncate_utf8(arr, maxlen) {
      let len=Math.min(arr.length, maxlen);
      let last_codepoint=0;
      let last2=0;
      let incode=false;
      let i=0;
      let code=0;
      while (i<len) {
        incode = arr[i]&128;
        if (!incode) {
            last2 = last_codepoint+1;
            last_codepoint = i+1;
        }
        i++;
      }
      if (last_codepoint<maxlen)
        arr.length = last_codepoint;
      else 
        arr.length = last2;
      return arr;
    }
    let _static_sbuf_ss=new Array(2048);
    function pack_static_string(data, str, length) {
      if (length===undefined)
        throw new Error("'length' paremter is not optional for pack_static_string()");
      let arr=length<2048 ? _static_sbuf_ss : new Array();
      arr.length = 0;
      encode_utf8(arr, str);
      truncate_utf8(arr, length);
      for (let i=0; i<length; i++) {
          if (i>=arr.length) {
              data.push(0);
          }
          else {
            data.push(arr[i]);
          }
      }
    }
    let _static_sbuf=new Array(32);
    function pack_string(data, str) {
      _static_sbuf.length = 0;
      encode_utf8(_static_sbuf, str);
      pack_int(data, _static_sbuf.length);
      for (let i=0; i<_static_sbuf.length; i++) {
          data.push(_static_sbuf[i]);
      }
    }
    function unpack_bytes(dview, uctx, len) {
      let ret=new DataView(dview.buffer.slice(uctx.i, uctx.i+len));
      uctx.i+=len;
      return ret;
    }
    function unpack_byte(dview, uctx) {
      return dview.getUint8(uctx.i++);
    }
    function unpack_sbyte(dview, uctx) {
      return dview.getInt8(uctx.i++);
    }
    function unpack_int(dview, uctx) {
      uctx.i+=4;
      return dview.getInt32(uctx.i-4, STRUCT_ENDIAN);
    }
    function unpack_uint(dview, uctx) {
      uctx.i+=4;
      return dview.getUint32(uctx.i-4, STRUCT_ENDIAN);
    }
    function unpack_ushort(dview, uctx) {
      uctx.i+=2;
      return dview.getUint16(uctx.i-2, STRUCT_ENDIAN);
    }
    function unpack_float(dview, uctx) {
      uctx.i+=4;
      return dview.getFloat32(uctx.i-4, STRUCT_ENDIAN);
    }
    function unpack_double(dview, uctx) {
      uctx.i+=8;
      return dview.getFloat64(uctx.i-8, STRUCT_ENDIAN);
    }
    function unpack_short(dview, uctx) {
      uctx.i+=2;
      return dview.getInt16(uctx.i-2, STRUCT_ENDIAN);
    }
    let _static_arr_us=new Array(32);
    function unpack_string(data, uctx) {
      let slen=unpack_int(data, uctx);
      if (!slen) {
          return "";
      }
      let str="";
      let arr=slen<2048 ? _static_arr_us : new Array(slen);
      arr.length = slen;
      for (let i=0; i<slen; i++) {
          arr[i] = unpack_byte(data, uctx);
      }
      return decode_utf8(arr);
    }
    let _static_arr_uss=new Array(2048);
    function unpack_static_string(data, uctx, length) {
      let str="";
      if (length===undefined)
        throw new Error("'length' cannot be undefined in unpack_static_string()");
      let arr=length<2048 ? _static_arr_uss : new Array(length);
      arr.length = 0;
      let done=false;
      for (let i=0; i<length; i++) {
          let c=unpack_byte(data, uctx);
          if (c===0) {
              done = true;
          }
          if (!done&&c!==0) {
              arr.push(c);
          }
      }
      truncate_utf8(arr, length);
      return decode_utf8(arr);
    }
    var struct_binpack=Object.freeze({__proto__: null, 
    get STRUCT_ENDIAN() {
        return STRUCT_ENDIAN;
      }, 
    setBinaryEndian: setBinaryEndian, 
    temp_dataview: temp_dataview, 
    uint8_view: uint8_view, 
    unpack_context: unpack_context, 
    pack_byte: pack_byte, 
    pack_sbyte: pack_sbyte, 
    pack_bytes: pack_bytes, 
    pack_int: pack_int, 
    pack_uint: pack_uint, 
    pack_ushort: pack_ushort, 
    pack_float: pack_float, 
    pack_double: pack_double, 
    pack_short: pack_short, 
    encode_utf8: encode_utf8, 
    decode_utf8: decode_utf8, 
    test_utf8: test_utf8, 
    pack_static_string: pack_static_string, 
    pack_string: pack_string, 
    unpack_bytes: unpack_bytes, 
    unpack_byte: unpack_byte, 
    unpack_sbyte: unpack_sbyte, 
    unpack_int: unpack_int, 
    unpack_uint: unpack_uint, 
    unpack_ushort: unpack_ushort, 
    unpack_float: unpack_float, 
    unpack_double: unpack_double, 
    unpack_short: unpack_short, 
    unpack_string: unpack_string, 
    unpack_static_string: unpack_static_string});
    let warninglvl=2;
    let debug=0;
    let _static_envcode_null="";
    let packer_debug, packer_debug_start, packer_debug_end;
    let packdebug_tablevel=0;
    function _get_pack_debug() {
      return {packer_debug: packer_debug, 
     packer_debug_start: packer_debug_start, 
     packer_debug_end: packer_debug_end, 
     debug: debug, 
     warninglvl: warninglvl}
    }
    class cachering extends Array {
       constructor(cb, tot) {
        super();
        this.length = tot;
        this.cur = 0;
        for (let i=0; i<tot; i++) {
            this[i] = cb();
        }
      }
      static  fromConstructor(cls, tot) {
        return new cachering(() =>          {
          return new cls();
        }, tot);
      }
       next() {
        let ret=this[this.cur];
        this.cur = (this.cur+1)%this.length;
        return ret;
      }
    }
    _ESClass.register(cachering);
    _es6_module.add_class(cachering);
    function gen_tabstr$1(tot) {
      let ret="";
      for (let i=0; i<tot; i++) {
          ret+=" ";
      }
      return ret;
    }
    function setWarningMode2(t) {
      if (typeof t!=="number"||isNaN(t)) {
          throw new Error("Expected a single number (>= 0) argument to setWarningMode");
      }
      warninglvl = t;
    }
    function setDebugMode2(t) {
      debug = t;
      if (debug) {
          packer_debug = function () {
            let tab=gen_tabstr$1(packdebug_tablevel);
            if (arguments.length>0) {
                console.warn(tab, ...arguments);
            }
            else {
              console.warn("Warning: undefined msg");
            }
          };
          packer_debug_start = function (funcname) {
            packer_debug("Start "+funcname);
            packdebug_tablevel++;
          };
          packer_debug_end = function (funcname) {
            packdebug_tablevel--;
            if (funcname) {
                packer_debug("Leave "+funcname);
            }
          };
      }
      else {
        packer_debug = function () {
        };
        packer_debug_start = function () {
        };
        packer_debug_end = function () {
        };
      }
    }
    setDebugMode2(debug);
    const StructFieldTypes=[];
    const StructFieldTypeMap={}
    function packNull(manager, data, field, type) {
      StructFieldTypeMap[type.type].packNull(manager, data, field, type);
    }
    function toJSON(manager, val, obj, field, type) {
      return StructFieldTypeMap[type.type].toJSON(manager, val, obj, field, type);
    }
    function fromJSON(manager, val, obj, field, type, instance) {
      return StructFieldTypeMap[type.type].fromJSON(manager, val, obj, field, type, instance);
    }
    function validateJSON(manager, val, obj, field, type, instance, _abstractKey) {
      return StructFieldTypeMap[type.type].validateJSON(manager, val, obj, field, type, instance, _abstractKey);
    }
    function unpack_field(manager, data, type, uctx) {
      let name;
      if (debug) {
          name = StructFieldTypeMap[type.type].define().name;
          packer_debug_start("R "+name);
      }
      let ret=StructFieldTypeMap[type.type].unpack(manager, data, type, uctx);
      if (debug) {
          packer_debug_end();
      }
      return ret;
    }
    let fakeFields=new cachering(() =>      {
      return {type: undefined, 
     get: undefined, 
     set: undefined}
    }, 256);
    function fmt_type(type) {
      return StructFieldTypeMap[type.type].format(type);
    }
    function do_pack(manager, data, val, obj, field, type) {
      let name;
      if (debug) {
          name = StructFieldTypeMap[type.type].define().name;
          packer_debug_start("W "+name);
      }
      let typeid=type;
      if (typeof typeid!=="number") {
          typeid = typeid.type;
      }
      let ret=StructFieldTypeMap[typeid].pack(manager, data, val, obj, field, type);
      if (debug) {
          packer_debug_end();
      }
      return ret;
    }
    let _ws_env=[[undefined, undefined]];
    class StructFieldType  {
      static  pack(manager, data, val, obj, field, type) {

      }
      static  unpack(manager, data, type, uctx) {

      }
      static  packNull(manager, data, field, type) {
        this.pack(manager, data, 0, 0, field, type);
      }
      static  format(type) {
        return this.define().name;
      }
      static  toJSON(manager, val, obj, field, type) {
        return val;
      }
      static  fromJSON(manager, val, obj, field, type, instance) {
        return val;
      }
      static  validateJSON(manager, val, obj, field, type, instance, _abstractKey) {
        return true;
      }
      static  useHelperJS(field) {
        return true;
      }
      static  define() {
        return {type: -1, 
      name: "(error)"}
      }
      static  register(cls) {
        if (StructFieldTypes.indexOf(cls)>=0) {
            throw new Error("class already registered");
        }
        if (cls.define===StructFieldType.define) {
            throw new Error("you forgot to make a define() static method");
        }
        if (cls.define().type===undefined) {
            throw new Error("cls.define().type was undefined!");
        }
        if (cls.define().type in StructFieldTypeMap) {
            throw new Error("type "+cls.define().type+" is used by another StructFieldType subclass");
        }
        StructFieldTypes.push(cls);
        StructFieldTypeMap[cls.define().type] = cls;
      }
    }
    _ESClass.register(StructFieldType);
    _es6_module.add_class(StructFieldType);
    class StructIntField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        pack_int(data, val);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_int(data, uctx);
      }
      static  validateJSON(manager, val, obj, field, type, instance) {
        if (typeof val!=="number"||val!==Math.floor(val)) {
            return ""+val+" is not an integer";
        }
        return true;
      }
      static  define() {
        return {type: StructEnum.INT, 
      name: "int"}
      }
    }
    _ESClass.register(StructIntField);
    _es6_module.add_class(StructIntField);
    StructFieldType.register(StructIntField);
    class StructFloatField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        pack_float(data, val);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_float(data, uctx);
      }
      static  validateJSON(manager, val, obj, field, type, instance, _abstractKey) {
        if (typeof val!=="number") {
            return "Not a float: "+val;
        }
        return true;
      }
      static  define() {
        return {type: StructEnum.FLOAT, 
      name: "float"}
      }
    }
    _ESClass.register(StructFloatField);
    _es6_module.add_class(StructFloatField);
    StructFieldType.register(StructFloatField);
    class StructDoubleField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        pack_double(data, val);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_double(data, uctx);
      }
      static  validateJSON(manager, val, obj, field, type, instance) {
        if (typeof val!=="number") {
            return "Not a double: "+val;
        }
        return true;
      }
      static  define() {
        return {type: StructEnum.DOUBLE, 
      name: "double"}
      }
    }
    _ESClass.register(StructDoubleField);
    _es6_module.add_class(StructDoubleField);
    StructFieldType.register(StructDoubleField);
    class StructStringField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        val = !val ? "" : val;
        pack_string(data, val);
      }
      static  validateJSON(manager, val, obj, field, type, instance) {
        if (typeof val!=="string") {
            return "Not a string: "+val;
        }
        return true;
      }
      static  packNull(manager, data, field, type) {
        this.pack(manager, data, "", 0, field, type);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_string(data, uctx);
      }
      static  define() {
        return {type: StructEnum.STRING, 
      name: "string"}
      }
    }
    _ESClass.register(StructStringField);
    _es6_module.add_class(StructStringField);
    StructFieldType.register(StructStringField);
    class StructStaticStringField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        val = !val ? "" : val;
        pack_static_string(data, val, type.data.maxlength);
      }
      static  validateJSON(manager, val, obj, field, type, instance) {
        if (typeof val!=="string") {
            return "Not a string: "+val;
        }
        if (val.length>type.data.maxlength) {
            return "String is too big; limit is "+type.data.maxlength+"; string:"+val;
        }
        return true;
      }
      static  format(type) {
        return `static_string[${type.data.maxlength}]`;
      }
      static  packNull(manager, data, field, type) {
        this.pack(manager, data, "", 0, field, type);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_static_string(data, uctx, type.data.maxlength);
      }
      static  define() {
        return {type: StructEnum.STATIC_STRING, 
      name: "static_string"}
      }
    }
    _ESClass.register(StructStaticStringField);
    _es6_module.add_class(StructStaticStringField);
    StructFieldType.register(StructStaticStringField);
    class StructStructField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        let stt=manager.get_struct(type.data);
        packer_debug("struct", stt.name);
        manager.write_struct(data, val, stt);
      }
      static  validateJSON(manager, val, obj, field, type, instance, _abstractKey) {
        let stt=manager.get_struct(type.data);
        if (!val) {
            return "Expected "+stt.name+" object";
        }
        return manager.validateJSONIntern(val, stt, _abstractKey);
      }
      static  format(type) {
        return type.data;
      }
      static  fromJSON(manager, val, obj, field, type, instance) {
        let stt=manager.get_struct(type.data);
        return manager.readJSON(val, stt, instance);
      }
      static  toJSON(manager, val, obj, field, type) {
        let stt=manager.get_struct(type.data);
        return manager.writeJSON(val, stt);
      }
      static  unpackInto(manager, data, type, uctx, dest) {
        let cls2=manager.get_struct_cls(type.data);
        packer_debug("struct", cls2 ? cls2.name : "(error)");
        return manager.read_object(data, cls2, uctx, dest);
      }
      static  packNull(manager, data, field, type) {
        let stt=manager.get_struct(type.data);
        packer_debug("struct", type);
        for (let field2 of stt.fields) {
            let type2=field2.type;
            packNull(manager, data, field2, type2);
        }
      }
      static  unpack(manager, data, type, uctx) {
        let cls2=manager.get_struct_cls(type.data);
        packer_debug("struct", cls2 ? cls2.name : "(error)");
        return manager.read_object(data, cls2, uctx);
      }
      static  define() {
        return {type: StructEnum.STRUCT, 
      name: "struct"}
      }
    }
    _ESClass.register(StructStructField);
    _es6_module.add_class(StructStructField);
    StructFieldType.register(StructStructField);
    class StructTStructField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        let cls=manager.get_struct_cls(type.data);
        let stt=manager.get_struct(type.data);
        const keywords=manager.constructor.keywords;
        if (val.constructor[keywords.name]!==type.data&&(__instance_of(val, cls))) {
            stt = manager.get_struct(val.constructor[keywords.name]);
        }
        else 
          if (val.constructor[keywords.name]===type.data) {
            stt = manager.get_struct(type.data);
        }
        else {
          console.trace();
          throw new Error("Bad struct "+val.constructor[keywords.name]+" passed to write_struct");
        }
        packer_debug("int "+stt.id);
        pack_int(data, stt.id);
        manager.write_struct(data, val, stt);
      }
      static  validateJSON(manager, val, obj, field, type, instance, _abstractKey) {
        let key=type.jsonKeyword;
        if (typeof val!=="object") {
            return typeof val+" is not an object";
        }
        let stt=manager.get_struct(val[key]);
        let cls=manager.get_struct_cls(stt.name);
        let parentcls=manager.get_struct_cls(type.data);
        let ok=false;
        do {
          if (cls===parentcls) {
              ok = true;
              break;
          }
          cls = cls.prototype.__proto__.constructor;
        } while (cls&&cls!==Object);
        
        if (!ok) {
            return stt.name+" is not a child class off "+type.data;
        }
        return manager.validateJSONIntern(val, stt, type.jsonKeyword);
      }
      static  fromJSON(manager, val, obj, field, type, instance) {
        let key=type.jsonKeyword;
        let stt=manager.get_struct(val[key]);
        return manager.readJSON(val, stt, instance);
      }
      static  toJSON(manager, val, obj, field, type) {
        const keywords=manager.constructor.keywords;
        let stt=manager.get_struct(val.constructor[keywords.name]);
        let ret=manager.writeJSON(val, stt);
        ret[type.jsonKeyword] = ""+stt.name;
        return ret;
      }
      static  packNull(manager, data, field, type) {
        let stt=manager.get_struct(type.data);
        pack_int(data, stt.id);
        packNull(manager, data, field, {type: StructEnum.STRUCT, 
      data: type.data});
      }
      static  format(type) {
        return "abstract("+type.data+")";
      }
      static  unpackInto(manager, data, type, uctx, dest) {
        let id=unpack_int(data, uctx);
        packer_debug("-int "+id);
        if (!(id in manager.struct_ids)) {
            packer_debug("tstruct id: "+id);
            console.trace();
            console.log(id);
            console.log(manager.struct_ids);
            throw new Error("Unknown struct type "+id+".");
        }
        let cls2=manager.get_struct_id(id);
        packer_debug("struct name: "+cls2.name);
        cls2 = manager.struct_cls[cls2.name];
        return manager.read_object(data, cls2, uctx, dest);
      }
      static  unpack(manager, data, type, uctx) {
        let id=unpack_int(data, uctx);
        packer_debug("-int "+id);
        if (!(id in manager.struct_ids)) {
            packer_debug("tstruct id: "+id);
            console.trace();
            console.log(id);
            console.log(manager.struct_ids);
            throw new Error("Unknown struct type "+id+".");
        }
        let cls2=manager.get_struct_id(id);
        packer_debug("struct name: "+cls2.name);
        cls2 = manager.struct_cls[cls2.name];
        return manager.read_object(data, cls2, uctx);
      }
      static  define() {
        return {type: StructEnum.TSTRUCT, 
      name: "tstruct"}
      }
    }
    _ESClass.register(StructTStructField);
    _es6_module.add_class(StructTStructField);
    StructFieldType.register(StructTStructField);
    class StructArrayField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        if (val===undefined) {
            console.trace();
            console.log("Undefined array fed to struct struct packer!");
            console.log("Field: ", field);
            console.log("Type: ", type);
            console.log("");
            packer_debug("int 0");
            pack_int(data, 0);
            return ;
        }
        packer_debug("int "+val.length);
        pack_int(data, val.length);
        let d=type.data;
        let itername=d.iname;
        let type2=d.type;
        let env=_ws_env;
        for (let i=0; i<val.length; i++) {
            let val2=val[i];
            if (itername!==""&&itername!==undefined&&field.get) {
                env[0][0] = itername;
                env[0][1] = val2;
                val2 = manager._env_call(field.get, obj, env);
            }
            let fakeField=fakeFields.next();
            fakeField.type = type2;
            do_pack(manager, data, val2, obj, fakeField, type2);
        }
      }
      static  packNull(manager, data, field, type) {
        pack_int(data, 0);
      }
      static  format(type) {
        if (type.data.iname!==""&&type.data.iname!==undefined) {
            return "array("+type.data.iname+", "+fmt_type(type.data.type)+")";
        }
        else {
          return "array("+fmt_type(type.data.type)+")";
        }
      }
      static  useHelperJS(field) {
        return !field.type.data.iname;
      }
      static  validateJSON(manager, val, obj, field, type, instance, _abstractKey) {
        if (!val) {
            return "not an array: "+val;
        }
        for (let i=0; i<val.length; i++) {
            let ret=validateJSON(manager, val[i], val, field, type.data.type, undefined, _abstractKey);
            if (typeof ret==="string"||!ret) {
                return ret;
            }
        }
        return true;
      }
      static  fromJSON(manager, val, obj, field, type, instance) {
        let ret=instance||[];
        ret.length = 0;
        for (let i=0; i<val.length; i++) {
            let val2=fromJSON(manager, val[i], val, field, type.data.type, undefined);
            if (val2===undefined) {
                console.log(val2);
                console.error("eeek");
                process.exit();
            }
            ret.push(val2);
        }
        return ret;
      }
      static  toJSON(manager, val, obj, field, type) {
        val = val||[];
        let json=[];
        let itername=type.data.iname;
        for (let i=0; i<val.length; i++) {
            let val2=val[i];
            let env=_ws_env;
            if (itername!==""&&itername!==undefined&&field.get) {
                env[0][0] = itername;
                env[0][1] = val2;
                val2 = manager._env_call(field.get, obj, env);
            }
            json.push(toJSON(manager, val2, val, field, type.data.type));
        }
        return json;
      }
      static  unpackInto(manager, data, type, uctx, dest) {
        let len=unpack_int(data, uctx);
        dest.length = 0;
        for (let i=0; i<len; i++) {
            dest.push(unpack_field(manager, data, type.data.type, uctx));
        }
      }
      static  unpack(manager, data, type, uctx) {
        let len=unpack_int(data, uctx);
        packer_debug("-int "+len);
        let arr=new Array(len);
        for (let i=0; i<len; i++) {
            arr[i] = unpack_field(manager, data, type.data.type, uctx);
        }
        return arr;
      }
      static  define() {
        return {type: StructEnum.ARRAY, 
      name: "array"}
      }
    }
    _ESClass.register(StructArrayField);
    _es6_module.add_class(StructArrayField);
    StructFieldType.register(StructArrayField);
    class StructIterField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        function forEach(cb, thisvar) {
          if (val&&val[Symbol.iterator]) {
              for (let item of val) {
                  cb.call(thisvar, item);
              }
          }
          else 
            if (val&&val.forEach) {
              val.forEach(function (item) {
                cb.call(thisvar, item);
              });
          }
          else {
            console.trace();
            console.log("Undefined iterable list fed to struct struct packer!", val);
            console.log("Field: ", field);
            console.log("Type: ", type);
            console.log("");
          }
        }
        let starti=data.length;
        data.length+=4;
        let d=type.data, itername=d.iname, type2=d.type;
        let env=_ws_env;
        let i=0;
        forEach(function (val2) {
          if (itername!==""&&itername!==undefined&&field.get) {
              env[0][0] = itername;
              env[0][1] = val2;
              val2 = manager._env_call(field.get, obj, env);
          }
          let fakeField=fakeFields.next();
          fakeField.type = type2;
          do_pack(manager, data, val2, obj, fakeField, type2);
          i++;
        }, this);
        temp_dataview.setInt32(0, i, STRUCT_ENDIAN);
        data[starti++] = uint8_view[0];
        data[starti++] = uint8_view[1];
        data[starti++] = uint8_view[2];
        data[starti++] = uint8_view[3];
      }
      static  validateJSON(manager, val, obj, field, type, instance) {
        return StructArrayField.validateJSON(...arguments);
      }
      static  fromJSON() {
        return StructArrayField.fromJSON(...arguments);
      }
      static  toJSON(manager, val, obj, field, type) {
        val = val||[];
        let json=[];
        let itername=type.data.iname;
        for (let val2 of val) {
            let env=_ws_env;
            if (itername!==""&&itername!==undefined&&field.get) {
                env[0][0] = itername;
                env[0][1] = val2;
                val2 = manager._env_call(field.get, obj, env);
            }
            json.push(toJSON(manager, val2, val, field, type.data.type));
        }
        return json;
      }
      static  packNull(manager, data, field, type) {
        pack_int(data, 0);
      }
      static  useHelperJS(field) {
        return !field.type.data.iname;
      }
      static  format(type) {
        if (type.data.iname!==""&&type.data.iname!==undefined) {
            return "iter("+type.data.iname+", "+fmt_type(type.data.type)+")";
        }
        else {
          return "iter("+fmt_type(type.data.type)+")";
        }
      }
      static  unpackInto(manager, data, type, uctx, arr) {
        let len=unpack_int(data, uctx);
        packer_debug("-int "+len);
        arr.length = 0;
        for (let i=0; i<len; i++) {
            arr.push(unpack_field(manager, data, type.data.type, uctx));
        }
        return arr;
      }
      static  unpack(manager, data, type, uctx) {
        let len=unpack_int(data, uctx);
        packer_debug("-int "+len);
        let arr=new Array(len);
        for (let i=0; i<len; i++) {
            arr[i] = unpack_field(manager, data, type.data.type, uctx);
        }
        return arr;
      }
      static  define() {
        return {type: StructEnum.ITER, 
      name: "iter"}
      }
    }
    _ESClass.register(StructIterField);
    _es6_module.add_class(StructIterField);
    StructFieldType.register(StructIterField);
    class StructShortField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        pack_short(data, val);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_short(data, uctx);
      }
      static  define() {
        return {type: StructEnum.SHORT, 
      name: "short"}
      }
    }
    _ESClass.register(StructShortField);
    _es6_module.add_class(StructShortField);
    StructFieldType.register(StructShortField);
    class StructByteField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        pack_byte(data, val);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_byte(data, uctx);
      }
      static  define() {
        return {type: StructEnum.BYTE, 
      name: "byte"}
      }
    }
    _ESClass.register(StructByteField);
    _es6_module.add_class(StructByteField);
    StructFieldType.register(StructByteField);
    class StructSignedByteField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        pack_sbyte(data, val);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_sbyte(data, uctx);
      }
      static  define() {
        return {type: StructEnum.SIGNED_BYTE, 
      name: "sbyte"}
      }
    }
    _ESClass.register(StructSignedByteField);
    _es6_module.add_class(StructSignedByteField);
    StructFieldType.register(StructSignedByteField);
    class StructBoolField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        pack_byte(data, !!val);
      }
      static  unpack(manager, data, type, uctx) {
        return !!unpack_byte(data, uctx);
      }
      static  validateJSON(manager, val, obj, field, type, instance) {
        if (val===0||val===1||val===true||val===false||val==="true"||val==="false") {
            return true;
        }
        return ""+val+" is not a bool";
      }
      static  fromJSON(manager, val, obj, field, type, instance) {
        if (val==="false") {
            val = false;
        }
        return !!val;
      }
      static  toJSON(manager, val, obj, field, type) {
        return !!val;
      }
      static  define() {
        return {type: StructEnum.BOOL, 
      name: "bool"}
      }
    }
    _ESClass.register(StructBoolField);
    _es6_module.add_class(StructBoolField);
    StructFieldType.register(StructBoolField);
    class StructIterKeysField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        if ((typeof val!=="object"&&typeof val!=="function")||val===null) {
            console.warn("Bad object fed to iterkeys in struct packer!", val);
            console.log("Field: ", field);
            console.log("Type: ", type);
            console.log("");
            pack_int(data, 0);
            return ;
        }
        let len=0.0;
        for (let k in val) {
            len++;
        }
        packer_debug("int "+len);
        pack_int(data, len);
        let d=type.data, itername=d.iname, type2=d.type;
        let env=_ws_env;
        let i=0;
        for (let val2 in val) {
            if (i>=len) {
                if (warninglvl>0)
                  console.warn("Warning: object keys magically replaced on us", val, i);
                return ;
            }
            if (itername&&itername.trim().length>0&&field.get) {
                env[0][0] = itername;
                env[0][1] = val2;
                val2 = manager._env_call(field.get, obj, env);
            }
            else {
              val2 = val[val2];
            }
            let f2={type: type2, 
        get: undefined, 
        set: undefined};
            do_pack(manager, data, val2, obj, f2, type2);
            i++;
        }
      }
      static  validateJSON(manager, val, obj, field, type, instance) {
        return StructArrayField.validateJSON(...arguments);
      }
      static  fromJSON() {
        return StructArrayField.fromJSON(...arguments);
      }
      static  toJSON(manager, val, obj, field, type) {
        val = val||[];
        let json=[];
        let itername=type.data.iname;
        for (let k in val) {
            let val2=val[k];
            let env=_ws_env;
            if (itername!==""&&itername!==undefined&&field.get) {
                env[0][0] = itername;
                env[0][1] = val2;
                val2 = manager._env_call(field.get, obj, env);
            }
            json.push(toJSON(manager, val2, val, field, type.data.type));
        }
        return json;
      }
      static  packNull(manager, data, field, type) {
        pack_int(data, 0);
      }
      static  useHelperJS(field) {
        return !field.type.data.iname;
      }
      static  format(type) {
        if (type.data.iname!==""&&type.data.iname!==undefined) {
            return "iterkeys("+type.data.iname+", "+fmt_type(type.data.type)+")";
        }
        else {
          return "iterkeys("+fmt_type(type.data.type)+")";
        }
      }
      static  unpackInto(manager, data, type, uctx, arr) {
        let len=unpack_int(data, uctx);
        packer_debug("-int "+len);
        arr.length = 0;
        for (let i=0; i<len; i++) {
            arr.push(unpack_field(manager, data, type.data.type, uctx));
        }
        return arr;
      }
      static  unpack(manager, data, type, uctx) {
        let len=unpack_int(data, uctx);
        packer_debug("-int "+len);
        let arr=new Array(len);
        for (let i=0; i<len; i++) {
            arr[i] = unpack_field(manager, data, type.data.type, uctx);
        }
        return arr;
      }
      static  define() {
        return {type: StructEnum.ITERKEYS, 
      name: "iterkeys"}
      }
    }
    _ESClass.register(StructIterKeysField);
    _es6_module.add_class(StructIterKeysField);
    StructFieldType.register(StructIterKeysField);
    class StructUintField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        pack_uint(data, val);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_uint(data, uctx);
      }
      static  validateJSON(manager, val, obj, field, type, instance) {
        if (typeof val!=="number"||val!==Math.floor(val)) {
            return ""+val+" is not an integer";
        }
        return true;
      }
      static  define() {
        return {type: StructEnum.UINT, 
      name: "uint"}
      }
    }
    _ESClass.register(StructUintField);
    _es6_module.add_class(StructUintField);
    StructFieldType.register(StructUintField);
    class StructUshortField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        pack_ushort(data, val);
      }
      static  unpack(manager, data, type, uctx) {
        return unpack_ushort(data, uctx);
      }
      static  validateJSON(manager, val, obj, field, type, instance) {
        if (typeof val!=="number"||val!==Math.floor(val)) {
            return ""+val+" is not an integer";
        }
        return true;
      }
      static  define() {
        return {type: StructEnum.USHORT, 
      name: "ushort"}
      }
    }
    _ESClass.register(StructUshortField);
    _es6_module.add_class(StructUshortField);
    StructFieldType.register(StructUshortField);
    class StructStaticArrayField extends StructFieldType {
      static  pack(manager, data, val, obj, field, type) {
        if (type.data.size===undefined) {
            throw new Error("type.data.size was undefined");
        }
        let itername=type.data.iname;
        if (val===undefined||!val.length) {
            this.packNull(manager, data, field, type);
            return ;
        }
        for (let i=0; i<type.data.size; i++) {
            let i2=Math.min(i, Math.min(val.length-1, type.data.size));
            let val2=val[i2];
            if (itername!==""&&itername!==undefined&&field.get) {
                let env=_ws_env;
                env[0][0] = itername;
                env[0][1] = val2;
                val2 = manager._env_call(field.get, obj, env);
            }
            do_pack(manager, data, val2, val, field, type.data.type);
        }
      }
      static  useHelperJS(field) {
        return !field.type.data.iname;
      }
      static  validateJSON() {
        return StructArrayField.validateJSON(...arguments);
      }
      static  fromJSON() {
        return StructArrayField.fromJSON(...arguments);
      }
      static  packNull(manager, data, field, type) {
        let size=type.data.size;
        for (let i=0; i<size; i++) {
            packNull(manager, data, field, type.data.type);
        }
      }
      static  toJSON(manager, val, obj, field, type) {
        return StructArrayField.toJSON(...arguments);
      }
      static  format(type) {
        let type2=StructFieldTypeMap[type.data.type.type].format(type.data.type);
        let ret=`static_array[${type2}, ${type.data.size}`;
        if (type.data.iname) {
            ret+=`, ${type.data.iname}`;
        }
        ret+=`]`;
        return ret;
      }
      static  unpackInto(manager, data, type, uctx, ret) {
        packer_debug("-size: "+type.data.size);
        ret.length = 0;
        for (let i=0; i<type.data.size; i++) {
            ret.push(unpack_field(manager, data, type.data.type, uctx));
        }
        return ret;
      }
      static  unpack(manager, data, type, uctx) {
        packer_debug("-size: "+type.data.size);
        let ret=[];
        for (let i=0; i<type.data.size; i++) {
            ret.push(unpack_field(manager, data, type.data.type, uctx));
        }
        return ret;
      }
      static  define() {
        return {type: StructEnum.STATIC_ARRAY, 
      name: "static_array"}
      }
    }
    _ESClass.register(StructStaticArrayField);
    _es6_module.add_class(StructStaticArrayField);
    StructFieldType.register(StructStaticArrayField);
    var _sintern2=Object.freeze({__proto__: null, 
    _get_pack_debug: _get_pack_debug, 
    setWarningMode2: setWarningMode2, 
    setDebugMode2: setDebugMode2, 
    StructFieldTypes: StructFieldTypes, 
    StructFieldTypeMap: StructFieldTypeMap, 
    packNull: packNull, 
    toJSON: toJSON, 
    fromJSON: fromJSON, 
    validateJSON: validateJSON, 
    do_pack: do_pack, 
    StructFieldType: StructFieldType});
    var structEval=eval;
    function setStructEval(val) {
      structEval = val;
    }
    var _struct_eval=Object.freeze({__proto__: null, 
    get structEval() {
        return structEval;
      }, 
    setStructEval: setStructEval});
    const TokSymbol=Symbol("token-info");
    function buildJSONParser() {
      let tk=(name, re, func, example) =>        {
        return new tokdef(name, re, func, example);
      }
      let parse;
      let nint="[+-]?[0-9]+";
      let nhex="[+-]?0x[0-9a-fA-F]+";
      let nfloat1="[+-]?[0-9]+\\.[0-9]*";
      let nfloat2="[+-]?[0-9]*\\.[0-9]+";
      let nfloat3="[+-]?[0-9]+\\.[0-9]+";
      let nfloatexp="[+-]?[0-9]+\\.[0-9]+[eE][+-]?[0-9]+";
      let nfloat=`(${nfloat1})|(${nfloat2})|(${nfloatexp})`;
      let num=`(${nint})|(${nfloat})|(${nhex})`;
      let numre=new RegExp(num);
      let numreTest=new RegExp(`(${num})$`);
      nfloat3 = new RegExp(nfloat3);
      nfloatexp = new RegExp(nfloatexp);
      let tests=["1.234234", ".23432", "-234.", "1e-17", "-0x23423ff", "+23423", "-4.263256414560601e-14"];
      for (let test of tests) {
          if (!numreTest.test(test)) {
              console.error("Error! Number regexp failed:", test);
          }
      }
      let tokens=[tk("BOOL", /true|false/), tk("WS", /[ \r\t\n]/, (t) =>        {
        return undefined;
      }), tk("STRLIT", /["']/, (t) =>        {
        let lex=t.lexer;
        let char=t.value;
        let i=lex.lexpos;
        let lexdata=lex.lexdata;
        let escape=0;
        t.value = "";
        let prev;
        while (i<lexdata.length) {
          let c=lexdata[i];
          t.value+=c;
          if (c==="\\") {
              escape^=true;
          }
          else 
            if (!escape&&c===char) {
              break;
          }
          else {
            escape = false;
          }
          i++;
        }
        lex.lexpos = i+1;
        if (t.value.length>0) {
            t.value = t.value.slice(0, t.value.length-1);
        }
        return t;
      }), tk("LSBRACKET", /\[/), tk("RSBRACKET", /]/), tk("LBRACE", /{/), tk("RBRACE", /}/), tk("NULL", /null/), tk("COMMA", /,/), tk("COLON", /:/), tk("NUM", numre, (t) =>        {
        return (t.value = parseFloat(t.value), t);
      }), tk("NUM", nfloat3, (t) =>        {
        return (t.value = parseFloat(t.value), t);
      }), tk("NUM", nfloatexp, (t) =>        {
        return (t.value = parseFloat(t.value), t);
      })];
      function tokinfo(t) {
        return {lexpos: t.lexpos, 
      lineno: t.lineno, 
      col: t.col, 
      fields: {}}
      }
      function p_Array(p) {
        p.expect("LSBRACKET");
        let t=p.peeknext();
        let first=true;
        let ret=[];
        ret[TokSymbol] = tokinfo(t);
        while (t&&t.type!=="RSBRACKET") {
          if (!first) {
              p.expect("COMMA");
          }
          ret[TokSymbol].fields[ret.length] = tokinfo(t);
          ret.push(p_Start(p));
          first = false;
          t = p.peeknext();
        }
        p.expect("RSBRACKET");
        return ret;
      }
      function p_Object(p) {
        p.expect("LBRACE");
        let obj={}
        let first=true;
        let t=p.peeknext();
        obj[TokSymbol] = tokinfo(t);
        while (t&&t.type!=="RBRACE") {
          if (!first) {
              p.expect("COMMA");
          }
          let key=p.expect("STRLIT");
          p.expect("COLON");
          let val=p_Start(p, true);
          obj[key] = val;
          first = false;
          t = p.peeknext();
          obj[TokSymbol].fields[key] = tokinfo(t);
        }
        p.expect("RBRACE");
        return obj;
      }
      function p_Start(p, throwError) {
        if (throwError===undefined) {
            throwError = true;
        }
        let t=p.peeknext();
        if (t.type==="LSBRACKET") {
            return p_Array(p);
        }
        else 
          if (t.type==="LBRACE") {
            return p_Object(p);
        }
        else 
          if (t.type==="STRLIT"||t.type==="NUM"||t.type==="NULL"||t.type==="BOOL") {
            return p.next().value;
        }
        else {
          p.error(t, "Unknown token");
        }
      }
      function p_Error(token, msg) {
        throw new PUTIL_ParseError("Parse Error");
      }
      let lex=new lexer(tokens);
      lex.linestart = 0;
      parse = new parser(lex, p_Error);
      parse.start = p_Start;
      return parse;
    }
    var jsonParser=buildJSONParser();
    function printContext(buf, tokinfo, printColors) {
      if (printColors===undefined) {
          printColors = true;
      }
      let lines=buf.split("\n");
      if (!tokinfo) {
          return '';
      }
      let lineno=tokinfo.lineno;
      let col=tokinfo.col;
      let istart=Math.max(lineno-50, 0);
      let iend=Math.min(lineno+2, lines.length-1);
      let s='';
      if (printColors) {
          s+=termColor("  /* pretty-printed json */\n", "blue");
      }
      else {
        s+="/* pretty-printed json */\n";
      }
      for (let i=istart; i<iend; i++) {
          let l=lines[i];
          let idx=""+i;
          while (idx.length<3) {
            idx = " "+idx;
          }
          if (i===lineno&&printColors) {
              s+=termColor(`${idx}: ${l}\n`, "yellow");
          }
          else {
            s+=`${idx}: ${l}\n`;
          }
          if (i===lineno) {
              let l2='';
              for (let j=0; j<col+5; j++) {
                  l2+=" ";
              }
              s+=l2+"^\n";
          }
      }
      return s;
    }
    var nGlobal;
    if (typeof globalThis!=="undefined") {
        nGlobal = globalThis;
    }
    else 
      if (typeof window!=="undefined") {
        nGlobal = window;
    }
    else 
      if (typeof global!=="undefined") {
        nGlobal = global;
    }
    else 
      if (typeof globals!=="undefined") {
        nGlobal = globals;
    }
    else 
      if (typeof self!=="undefined") {
        nGlobal = self;
    }
    const DEBUG={}
    function updateDEBUG() {
      for (let k in Object.keys(DEBUG)) {
          delete DEBUG[k];
      }
      if (typeof nGlobal.DEBUG==="object") {
          for (let k in nGlobal.DEBUG) {
              DEBUG[k] = nGlobal.DEBUG[k];
          }
      }
    }
    "use strict";
    var sintern2=_sintern2;
    var struct_eval=_struct_eval;
    let warninglvl$1=2;
    var truncateDollarSign=true;
    class JSONError extends Error {
    }
    _ESClass.register(JSONError);
    _es6_module.add_class(JSONError);
    
    function setTruncateDollarSign(v) {
      truncateDollarSign = !!v;
    }
    function _truncateDollarSign(s) {
      let i=s.search("$");
      if (i>0) {
          return s.slice(0, i).trim();
      }
      return s;
    }
    function unmangle(name) {
      if (truncateDollarSign) {
          return _truncateDollarSign(name);
      }
      else {
        return name;
      }
    }
    let _static_envcode_null$1="";
    function gen_tabstr$2(tot) {
      let ret="";
      for (let i=0; i<tot; i++) {
          ret+=" ";
      }
      return ret;
    }
    let packer_debug$1, packer_debug_start$1, packer_debug_end$1;
    function update_debug_data() {
      let ret=_get_pack_debug();
      packer_debug$1 = ret.packer_debug;
      packer_debug_start$1 = ret.packer_debug_start;
      packer_debug_end$1 = ret.packer_debug_end;
      warninglvl$1 = ret.warninglvl;
    }
    update_debug_data();
    function setWarningMode(t) {
      sintern2.setWarningMode2(t);
      if (typeof t!=="number"||isNaN(t)) {
          throw new Error("Expected a single number (>= 0) argument to setWarningMode");
      }
      warninglvl$1 = t;
    }
    function setDebugMode(t) {
      sintern2.setDebugMode2(t);
      update_debug_data();
    }
    let _ws_env$1=[[undefined, undefined]];
    function define_empty_class(scls, name) {
      let cls=function () {
      }
      cls.prototype = Object.create(Object.prototype);
      cls.constructor = cls.prototype.constructor = cls;
      let keywords=scls.keywords;
      cls[keywords.script] = name+" {\n  }\n";
      cls[keywords.name] = name;
      cls.prototype[keywords.load] = function (reader) {
        reader(this);
      }
      cls[keywords.new] = function () {
        return new this();
      }
      return cls;
    }
    let haveCodeGen;
    class STRUCT  {
       constructor() {
        this.idgen = 0;
        this.allowOverriding = true;
        this.structs = {};
        this.struct_cls = {};
        this.struct_ids = {};
        this.compiled_code = {};
        this.null_natives = {};
        this.define_null_native("Object", Object);
        this.jsonUseColors = true;
        this.jsonBuf = '';
      }
      static  inherit(child, parent, structName=child.name) {
        const keywords=this.keywords;
        if (!parent[keywords.script]) {
            return structName+"{\n";
        }
        let stt=struct_parse.parse(parent[keywords.script]);
        let code=structName+"{\n";
        code+=STRUCT.fmt_struct(stt, true);
        return code;
      }
      static  Super(obj, reader) {
        if (warninglvl$1>0)
          console.warn("deprecated");
        reader(obj);
        function reader2(obj) {
        }
        let cls=obj.constructor;
        let bad=cls===undefined||cls.prototype===undefined||cls.prototype.__proto__===undefined;
        if (bad) {
            return ;
        }
        let parent=cls.prototype.__proto__.constructor;
        bad = bad||parent===undefined;
        if (!bad&&parent.prototype[keywords.load]&&parent.prototype[keywords.load]!==obj[keywords.load]) {
            parent.prototype[keywords.load].call(obj, reader2);
        }
      }
      static  chain_fromSTRUCT(cls, reader) {
        if (warninglvl$1>0)
          console.warn("Using deprecated (and evil) chain_fromSTRUCT method, eek!");
        let proto=cls.prototype;
        let parent=cls.prototype.prototype.constructor;
        let obj=parent[keywords.from](reader);
        let obj2=new cls();
        let keys=Object.keys(obj).concat(Object.getOwnPropertySymbols(obj));
        for (let i=0; i<keys.length; i++) {
            let k=keys[i];
            try {
              obj2[k] = obj[k];
            }
            catch (error) {
                if (warninglvl$1>0)
                  console.warn("  failed to set property", k);
            }
        }
        return obj2;
      }
      static  formatStruct(stt, internal_only, no_helper_js) {
        return this.fmt_struct(stt, internal_only, no_helper_js);
      }
      static  fmt_struct(stt, internal_only, no_helper_js) {
        if (internal_only===undefined)
          internal_only = false;
        if (no_helper_js===undefined)
          no_helper_js = false;
        let s="";
        if (!internal_only) {
            s+=stt.name;
            if (stt.id!==-1)
              s+=" id="+stt.id;
            s+=" {\n";
        }
        let tab="  ";
        function fmt_type(type) {
          return StructFieldTypeMap[type.type].format(type);
          if (type.type===StructEnum.ARRAY||type.type===StructEnum.ITER||type.type===StructEnum.ITERKEYS) {
              if (type.data.iname!==""&&type.data.iname!==undefined) {
                  return "array("+type.data.iname+", "+fmt_type(type.data.type)+")";
              }
              else {
                return "array("+fmt_type(type.data.type)+")";
              }
          }
          else 
            if (type.type===StructEnum.STATIC_STRING) {
              return "static_string["+type.data.maxlength+"]";
          }
          else 
            if (type.type===StructEnum.STRUCT) {
              return type.data;
          }
          else 
            if (type.type===StructEnum.TSTRUCT) {
              return "abstract("+type.data+")";
          }
          else {
            return StructTypeMap[type.type];
          }
        }
        let fields=stt.fields;
        for (let i=0; i<fields.length; i++) {
            let f=fields[i];
            s+=tab+f.name+" : "+fmt_type(f.type);
            if (!no_helper_js&&f.get!==undefined) {
                s+=" | "+f.get.trim();
            }
            s+=";\n";
        }
        if (!internal_only)
          s+="}";
        return s;
      }
      static  setClassKeyword(keyword, nameKeyword=undefined) {
        if (!nameKeyword) {
            nameKeyword = keyword.toLowerCase()+"Name";
        }
        this.keywords = {script: keyword, 
      name: nameKeyword, 
      load: "load"+keyword, 
      new: "new"+keyword, 
      after: "after"+keyword, 
      from: "from"+keyword};
      }
       define_null_native(name, cls) {
        const keywords=this.constructor.keywords;
        let obj=define_empty_class(this.constructor, name);
        let stt=struct_parse.parse(obj[keywords.script]);
        stt.id = this.idgen++;
        this.structs[name] = stt;
        this.struct_cls[name] = cls;
        this.struct_ids[stt.id] = stt;
        this.null_natives[name] = 1;
      }
       validateStructs(onerror) {
        function getType(type) {
          switch (type.type) {
            case StructEnum.ITERKEYS:
            case StructEnum.ITER:
            case StructEnum.STATIC_ARRAY:
            case StructEnum.ARRAY:
              return getType(type.data.type);
            case StructEnum.TSTRUCT:
              return type;
            case StructEnum.STRUCT:
            default:
              return type;
          }
        }
        function formatType(type) {
          let ret={}
          ret.type = type.type;
          if (typeof ret.type==="number") {
              for (let k in StructEnum) {
                  if (StructEnum[k]===ret.type) {
                      ret.type = k;
                      break;
                  }
              }
          }
          else 
            if (typeof ret.type==="object") {
              ret.type = formatType(ret.type);
          }
          if (typeof type.data==="object") {
              ret.data = formatType(type.data);
          }
          else {
            ret.data = type.data;
          }
          return ret;
        }
        function throwError(stt, field, msg) {
          let buf=STRUCT.formatStruct(stt);
          console.error(buf+"\n\n"+msg);
          if (onerror) {
              onerror(msg, stt, field);
          }
          else {
            throw new Error(msg);
          }
        }
        for (let k in this.structs) {
            let stt=this.structs[k];
            for (let field of stt.fields) {
                if (field.name==="this") {
                    let type=field.type.type;
                    if (ValueTypes.has(type)) {
                        throwError(stt, field, "'this' cannot be used with value types");
                    }
                }
                let type=getType(field.type);
                if (type.type!==StructEnum.STRUCT&&type.type!==StructEnum.TSTRUCT) {
                    continue;
                }
                if (!(type.data in this.structs)) {
                    let msg=stt.name+":"+field.name+": Unknown struct "+type.data+".";
                    throwError(stt, field, msg);
                }
            }
        }
      }
       forEach(func, thisvar) {
        for (let k in this.structs) {
            let stt=this.structs[k];
            if (thisvar!==undefined)
              func.call(thisvar, stt);
            else 
              func(stt);
        }
      }
       parse_structs(buf, defined_classes) {
        const keywords=this.constructor.keywords;
        if (defined_classes===undefined) {
            defined_classes = exports.manager;
        }
        if (__instance_of(defined_classes, STRUCT)) {
            let struct2=defined_classes;
            defined_classes = [];
            for (let k in struct2.struct_cls) {
                defined_classes.push(struct2.struct_cls[k]);
            }
        }
        if (defined_classes===undefined) {
            defined_classes = [];
            for (let k in exports.manager.struct_cls) {
                defined_classes.push(exports.manager.struct_cls[k]);
            }
        }
        let clsmap={};
        for (let i=0; i<defined_classes.length; i++) {
            let cls=defined_classes[i];
            if (!cls[keywords.name]&&cls[keywords.script]) {
                let stt=struct_parse.parse(cls[keywords.script].trim());
                cls[keywords.name] = stt.name;
            }
            else 
              if (!cls[keywords.name]&&cls.name!=="Object") {
                if (warninglvl$1>0)
                  console.log("Warning, bad class in registered class list", unmangle(cls.name), cls);
                continue;
            }
            clsmap[cls[keywords.name]] = defined_classes[i];
        }
        struct_parse.input(buf);
        while (!struct_parse.at_end()) {
          let stt=struct_parse.parse(undefined, false);
          if (!(stt.name in clsmap)) {
              if (!(stt.name in this.null_natives))
                if (warninglvl$1>0)
                console.log("WARNING: struct "+stt.name+" is missing from class list.");
              let dummy=define_empty_class(this.constructor, stt.name);
              dummy[keywords.script] = STRUCT.fmt_struct(stt);
              dummy[keywords.name] = stt.name;
              dummy.prototype[keywords.name] = dummy.name;
              this.struct_cls[dummy[keywords.name]] = dummy;
              this.structs[dummy[keywords.name]] = stt;
              if (stt.id!==-1)
                this.struct_ids[stt.id] = stt;
          }
          else {
            this.struct_cls[stt.name] = clsmap[stt.name];
            this.structs[stt.name] = stt;
            if (stt.id!==-1)
              this.struct_ids[stt.id] = stt;
          }
          let tok=struct_parse.peek();
          while (tok&&(tok.value==="\n"||tok.value==="\r"||tok.value==="\t"||tok.value===" ")) {
            tok = struct_parse.peek();
          }
        }
      }
       registerGraph(srcSTRUCT, cls) {
        if (!cls[keywords.name]) {
            console.warn("class was not in srcSTRUCT");
            return this.register(cls);
        }
        let recStruct;
        let recArray=(t) =>          {
          switch (t.type) {
            case StructEnum.ARRAY:
              return recArray(t.data.type);
            case StructEnum.ITERKEYS:
              return recArray(t.data.type);
            case StructEnum.STATIC_ARRAY:
              return recArray(t.data.type);
            case StructEnum.ITER:
              return recArray(t.data.type);
            case StructEnum.STRUCT:
            case StructEnum.TSTRUCT:
{              let st=srcSTRUCT.structs[t.data];
              let cls=srcSTRUCT.struct_cls[st.name];
              return recStruct(st, cls);
}
          }
        };
        recStruct = (st, cls) =>          {
          if (!(cls[keywords.name] in this.structs)) {
              this.add_class(cls, cls[keywords.name]);
          }
          for (let f of st.fields) {
              if (f.type.type===StructEnum.STRUCT||f.type.type===StructEnum.TSTRUCT) {
                  let st2=srcSTRUCT.structs[f.type.data];
                  let cls2=srcSTRUCT.struct_cls[st2.name];
                  recStruct(st2, cls2);
              }
              else 
                if (f.type.type===StructEnum.ARRAY) {
                  recArray(f.type);
              }
              else 
                if (f.type.type===StructEnum.ITER) {
                  recArray(f.type);
              }
              else 
                if (f.type.type===StructEnum.ITERKEYS) {
                  recArray(f.type);
              }
              else 
                if (f.type.type===StructEnum.STATIC_ARRAY) {
                  recArray(f.type);
              }
          }
        };
        let st=srcSTRUCT.structs[cls[keywords.name]];
        recStruct(st, cls);
      }
       register(cls, structName) {
        return this.add_class(cls, structName);
      }
       unregister(cls) {
        const keywords=this.constructor.keywords;
        if (!cls||!cls[keywords.name]||!(cls[keywords.name] in this.struct_cls)) {
            console.warn("Class not registered with nstructjs", cls);
            return ;
        }
        let st=this.structs[cls[keywords.name]];
        delete this.structs[cls[keywords.name]];
        delete this.struct_cls[cls[keywords.name]];
        delete this.struct_ids[st.id];
      }
       add_class(cls, structName) {
        if (cls===Object) {
            return ;
        }
        const keywords=this.constructor.keywords;
        if (cls[keywords.script]) {
            let bad=false;
            let p=cls;
            while (p) {
              p = p.__proto__;
              if (p&&p[keywords.script]&&p[keywords.script]===cls[keywords.script]) {
                  bad = true;
                  break;
              }
            }
            if (bad) {
                console.warn("Generating "+keywords.script+" script for derived class "+unmangle(cls.name));
                if (!structName) {
                    structName = unmangle(cls.name);
                }
                cls[keywords.script] = STRUCT.inherit(cls, p)+"\n}";
            }
        }
        if (!cls[keywords.script]) {
            throw new Error("class "+unmangle(cls.name)+" has no "+keywords.script+" script");
        }
        let stt=struct_parse.parse(cls[keywords.script]);
        stt.name = unmangle(stt.name);
        cls[keywords.name] = stt.name;
        if (cls[keywords.new]===undefined) {
            cls[keywords.new] = function () {
              return new this();
            };
        }
        if (structName!==undefined) {
            stt.name = cls[keywords.name] = structName;
        }
        else 
          if (cls[keywords.name]===undefined) {
            cls[keywords.name] = stt.name;
        }
        else {
          stt.name = cls[keywords.name];
        }
        if (cls[keywords.name] in this.structs) {
            console.warn("Struct "+unmangle(cls[keywords.name])+" is already registered", cls);
            if (!this.allowOverriding) {
                throw new Error("Struct "+unmangle(cls[keywords.name])+" is already registered");
            }
            return ;
        }
        if (stt.id===-1)
          stt.id = this.idgen++;
        this.structs[cls[keywords.name]] = stt;
        this.struct_cls[cls[keywords.name]] = cls;
        this.struct_ids[stt.id] = stt;
      }
       isRegistered(cls) {
        const keywords=this.constructor.keywords;
        if (!cls.hasOwnProperty("structName")) {
            return false;
        }
        return cls===this.struct_cls[cls[keywords.name]];
      }
       get_struct_id(id) {
        return this.struct_ids[id];
      }
       get_struct(name) {
        if (!(name in this.structs)) {
            console.warn("Unknown struct", name);
            throw new Error("Unknown struct "+name);
        }
        return this.structs[name];
      }
       get_struct_cls(name) {
        if (!(name in this.struct_cls)) {
            console.trace();
            throw new Error("Unknown struct "+name);
        }
        return this.struct_cls[name];
      }
       _env_call(code, obj, env) {
        let envcode=_static_envcode_null$1;
        if (env!==undefined) {
            envcode = "";
            for (let i=0; i<env.length; i++) {
                envcode = "let "+env[i][0]+" = env["+i.toString()+"][1];\n"+envcode;
            }
        }
        let fullcode="";
        if (envcode!==_static_envcode_null$1)
          fullcode = envcode+code;
        else 
          fullcode = code;
        let func;
        if (!(fullcode in this.compiled_code)) {
            let code2="func = function(obj, env) { "+envcode+"return "+code+"}";
            try {
              func = struct_eval.structEval(code2);
            }
            catch (err) {
                console.warn(err.stack);
                console.warn(code2);
                console.warn(" ");
                throw err;
            }
            this.compiled_code[fullcode] = func;
        }
        else {
          func = this.compiled_code[fullcode];
        }
        try {
          return func.call(obj, obj, env);
        }
        catch (err) {
            console.warn(err.stack);
            let code2="func = function(obj, env) { "+envcode+"return "+code+"}";
            console.warn(code2);
            console.warn(" ");
            throw err;
        }
      }
       write_struct(data, obj, stt) {
        function use_helper_js(field) {
          let type=field.type.type;
          let cls=StructFieldTypeMap[type];
          return cls.useHelperJS(field);
        }
        let fields=stt.fields;
        let thestruct=this;
        for (let i=0; i<fields.length; i++) {
            let f=fields[i];
            let t1=f.type;
            let t2=t1.type;
            if (use_helper_js(f)) {
                let val;
                let type=t2;
                if (f.get!==undefined) {
                    val = thestruct._env_call(f.get, obj);
                }
                else {
                  val = f.name==="this" ? obj : obj[f.name];
                }
                if (DEBUG.tinyeval) {
                    console.log("\n\n\n", f.get, "Helper JS Ret", val, "\n\n\n");
                }
                sintern2.do_pack(this, data, val, obj, f, t1);
            }
            else {
              let val=f.name==="this" ? obj : obj[f.name];
              sintern2.do_pack(this, data, val, obj, f, t1);
            }
        }
      }
       write_object(data, obj) {
        const keywords=this.constructor.keywords;
        let cls=obj.constructor[keywords.name];
        let stt=this.get_struct(cls);
        if (data===undefined) {
            data = [];
        }
        this.write_struct(data, obj, stt);
        return data;
      }
       readObject(data, cls_or_struct_id, uctx) {
        if (__instance_of(data, Uint8Array)||__instance_of(data, Uint8ClampedArray)) {
            data = new DataView(data.buffer);
        }
        else 
          if (__instance_of(data, Array)) {
            data = new DataView(new Uint8Array(data).buffer);
        }
        return this.read_object(data, cls_or_struct_id, uctx);
      }
       writeObject(data, obj) {
        return this.write_object(data, obj);
      }
       writeJSON(obj, stt=undefined) {
        const keywords=this.constructor.keywords;
        let cls=obj.constructor;
        stt = stt||this.get_struct(cls[keywords.name]);
        function use_helper_js(field) {
          let type=field.type.type;
          let cls=StructFieldTypeMap[type];
          return cls.useHelperJS(field);
        }
        let toJSON=sintern2.toJSON;
        let fields=stt.fields;
        let thestruct=this;
        let json={};
        for (let i=0; i<fields.length; i++) {
            let f=fields[i];
            let val;
            let t1=f.type;
            let json2;
            if (use_helper_js(f)) {
                if (f.get!==undefined) {
                    val = thestruct._env_call(f.get, obj);
                }
                else {
                  val = f.name==="this" ? obj : obj[f.name];
                }
                if (DEBUG.tinyeval) {
                    console.log("\n\n\n", f.get, "Helper JS Ret", val, "\n\n\n");
                }
                json2 = toJSON(this, val, obj, f, t1);
            }
            else {
              val = f.name==="this" ? obj : obj[f.name];
              json2 = toJSON(this, val, obj, f, t1);
            }
            if (f.name!=='this') {
                json[f.name] = json2;
            }
            else {
              let isArray=Array.isArray(json2);
              isArray = isArray||f.type.type===StructTypes.ARRAY;
              isArray = isArray||f.type.type===StructTypes.STATIC_ARRAY;
              if (isArray) {
                  json.length = json2.length;
                  for (let i=0; i<json2.length; i++) {
                      json[i] = json2[i];
                  }
              }
              else {
                Object.assign(json, json2);
              }
            }
        }
        return json;
      }
       read_object(data, cls_or_struct_id, uctx, objInstance) {
        const keywords=this.constructor.keywords;
        let cls, stt;
        if (__instance_of(data, Array)) {
            data = new DataView(new Uint8Array(data).buffer);
        }
        if (typeof cls_or_struct_id==="number") {
            cls = this.struct_cls[this.struct_ids[cls_or_struct_id].name];
        }
        else {
          cls = cls_or_struct_id;
        }
        if (cls===undefined) {
            throw new Error("bad cls_or_struct_id "+cls_or_struct_id);
        }
        stt = this.structs[cls[keywords.name]];
        if (uctx===undefined) {
            uctx = new unpack_context();
            packer_debug$1("\n\n=Begin reading "+cls[keywords.name]+"=");
        }
        let thestruct=this;
        let this2=this;
        function unpack_field(type) {
          return StructFieldTypeMap[type.type].unpack(this2, data, type, uctx);
        }
        function unpack_into(type, dest) {
          return StructFieldTypeMap[type.type].unpackInto(this2, data, type, uctx, dest);
        }
        let was_run=false;
        function makeLoader(stt) {
          return function load(obj) {
            if (was_run) {
                return ;
            }
            was_run = true;
            let fields=stt.fields;
            let flen=fields.length;
            for (let i=0; i<flen; i++) {
                let f=fields[i];
                if (f.name==='this') {
                    unpack_into(f.type, obj);
                }
                else {
                  obj[f.name] = unpack_field(f.type);
                }
            }
          }
        }
        let load=makeLoader(stt);
        if (cls.prototype[keywords.load]!==undefined) {
            let obj=objInstance;
            if (!obj&&cls[keywords.new]!==undefined) {
                obj = cls[keywords.new](load);
            }
            else 
              if (!obj) {
                obj = new cls();
            }
            obj[keywords.load](load);
            if (!was_run) {
                console.warn(""+cls[keywords.name]+".prototype[keywords.load]() did not execute its loader callback!");
                load(obj);
            }
            return obj;
        }
        else 
          if (cls[keywords.from]!==undefined) {
            if (warninglvl$1>1)
              console.warn("Warning: class "+unmangle(cls.name)+" is using deprecated fromSTRUCT interface; use newSTRUCT/loadSTRUCT instead");
            return cls[keywords.from](load);
        }
        else {
          let obj=objInstance;
          if (!obj&&cls[keywords.new]!==undefined) {
              obj = cls[keywords.new](load);
          }
          else 
            if (!obj) {
              obj = new cls();
          }
          load(obj);
          return obj;
        }
      }
       validateJSON(json, cls_or_struct_id, useInternalParser=true, useColors=true, consoleLogger=function () {
        console.log(...arguments);
      }, _abstractKey="_structName") {
        if (cls_or_struct_id===undefined) {
            throw new Error(this.constructor.name+".prototype.validateJSON: Expected at least two arguments");
        }
        try {
          json = JSON.stringify(json, undefined, 2);
          this.jsonBuf = json;
          this.jsonUseColors = useColors;
          this.jsonLogger = consoleLogger;
          jsonParser.logger = this.jsonLogger;
          if (useInternalParser) {
              json = jsonParser.parse(json);
          }
          else {
            json = JSON.parse(json);
          }
          this.validateJSONIntern(json, cls_or_struct_id, _abstractKey);
        }
        catch (error) {
            if (!(__instance_of(error, JSONError))) {
                console.error(error.stack);
            }
            this.jsonLogger(error.message);
            return false;
        }
        return true;
      }
       validateJSONIntern(json, cls_or_struct_id, _abstractKey="_structName") {
        const keywords=this.constructor.keywords;
        let cls, stt;
        if (typeof cls_or_struct_id==="number") {
            cls = this.struct_cls[this.struct_ids[cls_or_struct_id].name];
        }
        else 
          if (__instance_of(cls_or_struct_id, NStruct)) {
            cls = this.get_struct_cls(cls_or_struct_id.name);
        }
        else {
          cls = cls_or_struct_id;
        }
        if (cls===undefined) {
            throw new Error("bad cls_or_struct_id "+cls_or_struct_id);
        }
        stt = this.structs[cls[keywords.name]];
        let fields=stt.fields;
        let flen=fields.length;
        let keys=new Set();
        keys.add(_abstractKey);
        let keyTestJson=json;
        for (let i=0; i<flen; i++) {
            let f=fields[i];
            let val;
            let tokinfo;
            if (f.name==='this') {
                val = json;
                keyTestJson = {"this": json};
                keys.add("this");
                tokinfo = json[TokSymbol];
            }
            else {
              val = json[f.name];
              keys.add(f.name);
              tokinfo = json[TokSymbol] ? json[TokSymbol].fields[f.name] : undefined;
              if (!tokinfo) {
                  let f2=fields[Math.max(i-1, 0)];
                  tokinfo = TokSymbol[TokSymbol] ? json[TokSymbol].fields[f2.name] : undefined;
              }
              if (!tokinfo) {
                  tokinfo = json[TokSymbol];
              }
            }
            if (val===undefined) {
            }
            let instance=f.name==='this' ? val : json;
            let ret=sintern2.validateJSON(this, val, json, f, f.type, instance, _abstractKey);
            if (!ret||typeof ret==="string") {
                let msg=typeof ret==="string" ? ": "+ret : "";
                if (tokinfo) {
                    this.jsonLogger(printContext(this.jsonBuf, tokinfo, this.jsonUseColors));
                }
                if (val===undefined) {
                    throw new JSONError("Missing json field "+f.name+msg);
                }
                else {
                  throw new JSONError("Invalid json field "+f.name+msg);
                }
                return false;
            }
        }
        for (let k in keyTestJson) {
            if (typeof json[k]==="symbol") {
                continue;
            }
            if (!keys.has(k)) {
                this.jsonLogger(cls[keywords.script]);
                throw new JSONError("Unknown json field "+k);
                return false;
            }
        }
        return true;
      }
       readJSON(json, cls_or_struct_id, objInstance=undefined) {
        const keywords=this.constructor.keywords;
        let cls, stt;
        if (typeof cls_or_struct_id==="number") {
            cls = this.struct_cls[this.struct_ids[cls_or_struct_id].name];
        }
        else 
          if (__instance_of(cls_or_struct_id, NStruct)) {
            cls = this.get_struct_cls(cls_or_struct_id.name);
        }
        else {
          cls = cls_or_struct_id;
        }
        if (cls===undefined) {
            throw new Error("bad cls_or_struct_id "+cls_or_struct_id);
        }
        stt = this.structs[cls[keywords.name]];
        packer_debug$1("\n\n=Begin reading "+cls[keywords.name]+"=");
        let thestruct=this;
        let this2=this;
        let was_run=false;
        let fromJSON=sintern2.fromJSON;
        function makeLoader(stt) {
          return function load(obj) {
            if (was_run) {
                return ;
            }
            was_run = true;
            let fields=stt.fields;
            let flen=fields.length;
            for (let i=0; i<flen; i++) {
                let f=fields[i];
                let val;
                if (f.name==='this') {
                    val = json;
                }
                else {
                  val = json[f.name];
                }
                if (val===undefined) {
                    console.warn("nstructjs.readJSON: Missing field "+f.name+" in struct "+stt.name);
                    continue;
                }
                let instance=f.name==='this' ? obj : objInstance;
                let ret=fromJSON(this2, val, obj, f, f.type, instance);
                if (f.name!=='this') {
                    obj[f.name] = ret;
                }
            }
          }
        }
        let load=makeLoader(stt);
        if (cls.prototype[keywords.load]!==undefined) {
            let obj=objInstance;
            if (!obj&&cls[keywords.new]!==undefined) {
                obj = cls[keywords.new](load);
            }
            else 
              if (!obj) {
                obj = new cls();
            }
            obj[keywords.load](load);
            return obj;
        }
        else 
          if (cls[keywords.from]!==undefined) {
            if (warninglvl$1>1)
              console.warn("Warning: class "+unmangle(cls.name)+" is using deprecated fromSTRUCT interface; use newSTRUCT/loadSTRUCT instead");
            return cls[keywords.from](load);
        }
        else {
          let obj=objInstance;
          if (!obj&&cls[keywords.new]!==undefined) {
              obj = cls[keywords.new](load);
          }
          else 
            if (!obj) {
              obj = new cls();
          }
          load(obj);
          return obj;
        }
      }
    }
    _ESClass.register(STRUCT);
    _es6_module.add_class(STRUCT);
    
    if (haveCodeGen) {
        var StructClass;
        eval(code);
        STRUCT = StructClass;
    }
    STRUCT.setClassKeyword("STRUCT");
    function deriveStructManager(keywords) {
      if (keywords===undefined) {
          keywords = {script: "STRUCT", 
       name: undefined, 
       load: undefined, 
       new: undefined, 
       from: undefined};
      }
      if (!keywords.name) {
          keywords.name = keywords.script.toLowerCase()+"Name";
      }
      if (!keywords.load) {
          keywords.load = "load"+keywords.script;
      }
      if (!keywords.new) {
          keywords.new = "new"+keywords.script;
      }
      if (!keywords.from) {
          keywords.from = "from"+keywords.script;
      }
      if (!haveCodeGen) {
          class NewSTRUCT extends STRUCT {
          }
          _ESClass.register(NewSTRUCT);
          _es6_module.add_class(NewSTRUCT);
          NewSTRUCT.keywords = keywords;
          return NewSTRUCT;
      }
      else {
        var StructClass;
        let code2=code;
        code2 = code2.replace(/\[keywords.script\]/g, keywords.script);
        eval(code2);
        return StructClass;
      }
    }
    exports.manager = new STRUCT();
    function write_scripts(nManager, include_code) {
      if (nManager===undefined) {
          nManager = exports.manager;
      }
      if (include_code===undefined) {
          include_code = false;
      }
      let buf="";
      let nl=String.fromCharCode(10);
      let tab=String.fromCharCode(9);
      nManager.forEach(function (stt) {
        buf+=STRUCT.fmt_struct(stt, false, !include_code)+nl;
      });
      let buf2=buf;
      buf = "";
      for (let i=0; i<buf2.length; i++) {
          let c=buf2[i];
          if (c===nl) {
              buf+=nl;
              let i2=i;
              while (i<buf2.length&&(buf2[i]===" "||buf2[i]===tab||buf2[i]===nl)) {
                i++;
              }
              if (i!==i2)
                i--;
          }
          else {
            buf+=c;
          }
      }
      return buf;
    }
    "use strict";
    let nbtoa, natob;
    if (typeof btoa==="undefined") {
        nbtoa = function btoa(str) {
          let buffer=new Buffer(""+str, 'binary');
          return buffer.toString('base64');
        };
        natob = function atob(str) {
          return new Buffer(str, 'base64').toString('binary');
        };
    }
    else {
      natob = atob;
      nbtoa = btoa;
    }
    function versionToInt(v) {
      v = versionCoerce(v);
      let mul=64;
      return ~~(v.major*mul*mul*mul+v.minor*mul*mul+v.micro*mul);
    }
    let ver_pat=/[0-9]+\.[0-9]+\.[0-9]+$/;
    function versionCoerce(v) {
      if (!v) {
          throw new Error("empty version: "+v);
      }
      if (typeof v==="string") {
          if (!ver_pat.exec(v)) {
              throw new Error("invalid version string "+v);
          }
          let ver=v.split(".");
          return {major: parseInt(ver[0]), 
       minor: parseInt(ver[1]), 
       micro: parseInt(ver[2])}
      }
      else 
        if (Array.isArray(v)) {
          return {major: v[0], 
       minor: v[1], 
       micro: v[2]}
      }
      else 
        if (typeof v==="object") {
          let test=(k) =>            {
            return k in v&&typeof v[k]==="number";
          };
          if (!test("major")||!test("minor")||!test("micro")) {
              throw new Error("invalid version object: "+v);
          }
          return v;
      }
      else {
        throw new Error("invalid version "+v);
      }
    }
    function versionLessThan(a, b) {
      return versionToInt(a)<versionToInt(b);
    }
    class FileParams  {
       constructor() {
        this.magic = "STRT";
        this.ext = ".bin";
        this.blocktypes = ["DATA"];
        this.version = {major: 0, 
      minor: 0, 
      micro: 1};
      }
    }
    _ESClass.register(FileParams);
    _es6_module.add_class(FileParams);
    class Block  {
       constructor(type_magic, data) {
        this.type = type_magic;
        this.data = data;
      }
    }
    _ESClass.register(Block);
    _es6_module.add_class(Block);
    class FileeError extends Error {
    }
    _ESClass.register(FileeError);
    _es6_module.add_class(FileeError);
    class FileHelper  {
       constructor(params) {
        if (params===undefined) {
            params = new FileParams();
        }
        else {
          let fp=new FileParams();
          for (let k in params) {
              fp[k] = params[k];
          }
          params = fp;
        }
        this.version = params.version;
        this.blocktypes = params.blocktypes;
        this.magic = params.magic;
        this.ext = params.ext;
        this.struct = undefined;
        this.unpack_ctx = undefined;
      }
       read(dataview) {
        this.unpack_ctx = new unpack_context();
        let magic=unpack_static_string(dataview, this.unpack_ctx, 4);
        if (magic!==this.magic) {
            throw new FileError("corrupted file");
        }
        this.version = {};
        this.version.major = unpack_short(dataview, this.unpack_ctx);
        this.version.minor = unpack_byte(dataview, this.unpack_ctx);
        this.version.micro = unpack_byte(dataview, this.unpack_ctx);
        let struct=this.struct = new STRUCT();
        let scripts=unpack_string(dataview, this.unpack_ctx);
        this.struct.parse_structs(scripts, exports.manager);
        let blocks=[];
        let dviewlen=dataview.buffer.byteLength;
        while (this.unpack_ctx.i<dviewlen) {
          let type=unpack_static_string(dataview, this.unpack_ctx, 4);
          let datalen=unpack_int(dataview, this.unpack_ctx);
          let bstruct=unpack_int(dataview, this.unpack_ctx);
          let bdata;
          if (bstruct===-2) {
              bdata = unpack_static_string(dataview, this.unpack_ctx, datalen);
          }
          else {
            bdata = unpack_bytes(dataview, this.unpack_ctx, datalen);
            bdata = struct.read_object(bdata, bstruct, new unpack_context());
          }
          let block=new Block();
          block.type = type;
          block.data = bdata;
          blocks.push(block);
        }
        this.blocks = blocks;
        return blocks;
      }
       doVersions(old) {
        let blocks=this.blocks;
        if (versionLessThan(old, "0.0.1")) {
        }
      }
       write(blocks) {
        this.struct = exports.manager;
        this.blocks = blocks;
        let data=[];
        pack_static_string(data, this.magic, 4);
        pack_short(data, this.version.major);
        pack_byte(data, this.version.minor&255);
        pack_byte(data, this.version.micro&255);
        let scripts=write_scripts();
        pack_string(data, scripts);
        let struct=this.struct;
        for (let block of blocks) {
            if (typeof block.data==="string") {
                pack_static_string(data, block.type, 4);
                pack_int(data, block.data.length);
                pack_int(data, -2);
                pack_static_string(data, block.data, block.data.length);
                continue;
            }
            let structName=block.data.constructor.structName;
            if (structName===undefined||!(structName in struct.structs)) {
                throw new Error("Non-STRUCTable object "+block.data);
            }
            let data2=[];
            let stt=struct.structs[structName];
            struct.write_object(data2, block.data);
            pack_static_string(data, block.type, 4);
            pack_int(data, data2.length);
            pack_int(data, stt.id);
            pack_bytes(data, data2);
        }
        return new DataView(new Uint8Array(data).buffer);
      }
       writeBase64(blocks) {
        let dataview=this.write(blocks);
        let str="";
        let bytes=new Uint8Array(dataview.buffer);
        for (let i=0; i<bytes.length; i++) {
            str+=String.fromCharCode(bytes[i]);
        }
        return nbtoa(str);
      }
       makeBlock(type, data) {
        return new Block(type, data);
      }
       readBase64(base64) {
        let data=natob(base64);
        let data2=new Uint8Array(data.length);
        for (let i=0; i<data.length; i++) {
            data2[i] = data.charCodeAt(i);
        }
        return this.read(new DataView(data2.buffer));
      }
    }
    _ESClass.register(FileHelper);
    _es6_module.add_class(FileHelper);
    var struct_filehelper=Object.freeze({__proto__: null, 
    versionToInt: versionToInt, 
    versionCoerce: versionCoerce, 
    versionLessThan: versionLessThan, 
    FileParams: FileParams, 
    Block: Block, 
    FileeError: FileeError, 
    FileHelper: FileHelper});
    function truncateDollarSign$1(value) {
      if (value===undefined) {
          value = true;
      }
      setTruncateDollarSign(value);
    }
    function validateStructs(onerror) {
      return exports.manager.validateStructs(onerror);
    }
    function setEndian(mode) {
      let ret=STRUCT_ENDIAN;
      setBinaryEndian(mode);
      return ret;
    }
    function consoleLogger() {
      console.log(...arguments);
    }
    function validateJSON$1(json, cls, useInternalParser, printColors, logger) {
      if (printColors===undefined) {
          printColors = true;
      }
      if (logger===undefined) {
          logger = consoleLogger;
      }
      return exports.manager.validateJSON(json, cls, useInternalParser, printColors, logger);
    }
    function getEndian() {
      return STRUCT_ENDIAN;
    }
    function setAllowOverriding(t) {
      return exports.manager.allowOverriding = !!t;
    }
    function isRegistered(cls) {
      return exports.manager.isRegistered(cls);
    }
    function register(cls, structName) {
      return exports.manager.register(cls, structName);
    }
    function unregister(cls) {
      exports.manager.unregister(cls);
    }
    function inherit(child, parent, structName) {
      if (structName===undefined) {
          structName = child.name;
      }
      return STRUCT.inherit(...arguments);
    }
    function readObject(data, cls, __uctx) {
      if (__uctx===undefined) {
          __uctx = undefined;
      }
      return exports.manager.readObject(data, cls, __uctx);
    }
    function writeObject(data, obj) {
      return exports.manager.writeObject(data, obj);
    }
    function writeJSON(obj) {
      return exports.manager.writeJSON(obj);
    }
    function readJSON(json, class_or_struct_id) {
      return exports.manager.readJSON(json, class_or_struct_id);
    }
    exports.useTinyEval = () =>      {    }
    exports.JSONError = JSONError;
    exports.STRUCT = STRUCT;
    exports._truncateDollarSign = _truncateDollarSign;
    exports.binpack = struct_binpack;
    exports.consoleLogger = consoleLogger;
    exports.deriveStructManager = deriveStructManager;
    exports.filehelper = struct_filehelper;
    exports.getEndian = getEndian;
    exports.inherit = inherit;
    exports.isRegistered = isRegistered;
    exports.parser = struct_parser;
    exports.parseutil = struct_parseutil;
    exports.readJSON = readJSON;
    exports.readObject = readObject;
    exports.register = register;
    exports.setAllowOverriding = setAllowOverriding;
    exports.setDebugMode = setDebugMode;
    exports.setEndian = setEndian;
    exports.setTruncateDollarSign = setTruncateDollarSign;
    exports.setWarningMode = setWarningMode;
    exports.truncateDollarSign = truncateDollarSign$1;
    exports.typesystem = struct_typesystem;
    exports.unpack_context = unpack_context;
    exports.unregister = unregister;
    exports.validateJSON = validateJSON$1;
    exports.validateStructs = validateStructs;
    exports.writeJSON = writeJSON;
    exports.writeObject = writeObject;
    exports.write_scripts = write_scripts;
{    let glob=!((typeof window==="undefined"&&typeof self==="undefined")&&typeof global!=="undefined");
    glob = glob||(typeof global!=="undefined"&&typeof global.require==="undefined");
    if (glob) {
        _nGlobal.nstructjs = module.exports;
        _nGlobal.module = undefined;
    }
}
    return module.exports;
  })();
  if (typeof window==="undefined"&&typeof global!=="undefined"&&typeof module!=="undefined") {
      console.log("Nodejs!", nexports);
      module.exports = exports = nexports;
  }
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/nstructjs.js');

