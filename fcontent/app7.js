
es6_module_define('spline', ["./spline_strokegroup.js", "../path.ux/scripts/pathux.js", "../core/lib_api.js", "../core/struct.js", "./spline_query.js", "./spline_draw.js", "../core/toolops_api.js", "../wasm/native_api.js", "./spline_element_array.js", "./spline_math.js", "./spline_multires.js", "../core/eventdag.js", "../editors/viewport/view2d_editor.js", "../editors/viewport/selectmode.js", "./solver.js", "../config/config.js", "./spline_types.js", "../path.ux/scripts/config/const.js", "./solver_new.js"], function _spline_module(_es6_module) {
  "use strict";
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
  const MMLEN=8;
  const UARR=Uint16Array;
  const UMAX=((1<<16)-1);
  const UMUL=2;
  const PI=Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos, asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;
  var spline_multires=es6_import(_es6_module, './spline_multires.js');
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  var DataBlock=es6_import_item(_es6_module, '../core/lib_api.js', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, '../core/lib_api.js', 'DataTypes');
  var SessionFlags=es6_import_item(_es6_module, '../editors/viewport/view2d_editor.js', 'SessionFlags');
  var SelMask=es6_import_item(_es6_module, '../editors/viewport/selectmode.js', 'SelMask');
  var SplineQuery=es6_import_item(_es6_module, './spline_query.js', 'SplineQuery');
  var draw_spline=es6_import_item(_es6_module, './spline_draw.js', 'draw_spline');
  var solve=es6_import_item(_es6_module, './solver_new.js', 'solve');
  var ModalStates=es6_import_item(_es6_module, '../core/toolops_api.js', 'ModalStates');
  var DataPathNode=es6_import_item(_es6_module, '../core/eventdag.js', 'DataPathNode');
  var config=es6_import(_es6_module, '../config/config.js');
  const FEPS=1e-18;
  const SPI2=Math.sqrt(PI/2);
  var _SOLVING=false;
  _SOLVING = _es6_module.add_export('_SOLVING', _SOLVING);
  var INCREMENTAL=1;
  INCREMENTAL = _es6_module.add_export('INCREMENTAL', INCREMENTAL);
  var ORDER=es6_import_item(_es6_module, './spline_math.js', 'ORDER');
  var KSCALE=es6_import_item(_es6_module, './spline_math.js', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, './spline_math.js', 'KANGLE');
  var KSTARTX=es6_import_item(_es6_module, './spline_math.js', 'KSTARTX');
  var KSTARTY=es6_import_item(_es6_module, './spline_math.js', 'KSTARTY');
  var KSTARTZ=es6_import_item(_es6_module, './spline_math.js', 'KSTARTZ');
  var KTOTKS=es6_import_item(_es6_module, './spline_math.js', 'KTOTKS');
  var INT_STEPS=es6_import_item(_es6_module, './spline_math.js', 'INT_STEPS');
  var solver=es6_import_item(_es6_module, './solver.js', 'solver');
  var constraint=es6_import_item(_es6_module, './solver.js', 'constraint');
  es6_import(_es6_module, '../path.ux/scripts/config/const.js');
  var native_api=es6_import(_es6_module, '../wasm/native_api.js');
  var SplineFlags=es6_import_item(_es6_module, './spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, './spline_types.js', 'SplineTypes');
  var SplineElement=es6_import_item(_es6_module, './spline_types.js', 'SplineElement');
  var SplineVertex=es6_import_item(_es6_module, './spline_types.js', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, './spline_types.js', 'SplineSegment');
  var SplineLoop=es6_import_item(_es6_module, './spline_types.js', 'SplineLoop');
  var SplineLoopPath=es6_import_item(_es6_module, './spline_types.js', 'SplineLoopPath');
  var SplineFace=es6_import_item(_es6_module, './spline_types.js', 'SplineFace');
  var ElementArraySet=es6_import_item(_es6_module, './spline_element_array.js', 'ElementArraySet');
  var ElementArray=es6_import_item(_es6_module, './spline_element_array.js', 'ElementArray');
  var SplineLayer=es6_import_item(_es6_module, './spline_element_array.js', 'SplineLayer');
  var SplineLayerSet=es6_import_item(_es6_module, './spline_element_array.js', 'SplineLayerSet');
  let _internal_idgen=0;
  var rect_tmp=[new Vector2(), new Vector2()];
  var eval_curve=es6_import_item(_es6_module, './spline_math.js', 'eval_curve');
  var do_solve=es6_import_item(_es6_module, './spline_math.js', 'do_solve');
  var RestrictFlags={NO_EXTRUDE: 1, 
   NO_DELETE: 2, 
   NO_CONNECT: 4, 
   NO_DISSOLVE: 8, 
   NO_SPLIT_EDGE: 16, 
   VALENCE2: 32, 
   NO_CREATE: 64|1|4|16}
  RestrictFlags = _es6_module.add_export('RestrictFlags', RestrictFlags);
  function dom_bind(obj, name, dom_id) {
    Object.defineProperty(obj, name, {get: function () {
        var check=document.getElementById(dom_id);
        return check.checked;
      }, 
    set: function (val) {
        var check=document.getElementById(dom_id);
        check.checked = !!val;
      }});
  }
  var split_edge_rets=new cachering(function () {
    return [0, 0, 0];
  }, 64);
  var _elist_map={"verts": SplineTypes.VERTEX, 
   "handles": SplineTypes.HANDLE, 
   "segments": SplineTypes.SEGMENT, 
   "faces": SplineTypes.FACE}
  class AllPointsIter  {
    
    
     constructor(spline) {
      this.spline = spline;
      this.stage = 0;
      this.iter = spline.verts[Symbol.iterator]();
      this.ret = {done: false, 
     value: undefined};
    }
     [Symbol.iterator]() {
      return this;
    }
     next() {
      var ret=this.iter.next();
      this.ret.done = ret.done;
      this.ret.value = ret.value;
      if (ret.done&&this.stage==0) {
          this.stage = 1;
          this.iter = this.spline.handles[Symbol.iterator]();
          return this.next();
      }
      return this.ret;
    }
  }
  _ESClass.register(AllPointsIter);
  _es6_module.add_class(AllPointsIter);
  AllPointsIter = _es6_module.add_export('AllPointsIter', AllPointsIter);
  var RecalcFlags=es6_import_item(_es6_module, './spline_types.js', 'RecalcFlags');
  let debug_id_gen=0;
  let _se_ws=[0.5, 0.5];
  let _se_srcs=[0, 0];
  let _trace_face_lastco=new Vector3();
  class Spline extends DataBlock {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
     constructor(name=undefined) {
      super(DataTypes.SPLINE, name);
      this.updateGen = 0;
      this.draw_layerlist = [];
      this.solvePromise = undefined;
      this.solveTimeout = undefined;
      this.strokeGroups = [];
      this._strokeGroupMap = new Map();
      this.drawStrokeGroups = [];
      this._drawStrokeGroupMap = new Map();
      this._vert_add_set = new set();
      this._vert_rem_set = new set();
      this._vert_time_set = new set();
      this._debug_id = debug_id_gen++;
      this._pending_solve = undefined;
      this._resolve_after = undefined;
      this.solving = undefined;
      this.actlevel = 0;
      var mformat=spline_multires._format;
      this.mres_format = new Array(mformat.length);
      for (var i=0; i<mformat.length; i++) {
          this.mres_format[i] = mformat[i];
      }
      this._internal_id = _internal_idgen++;
      this.drawlist = [];
      this.recalc = RecalcFlags.DRAWSORT;
      this.size = [0, 0];
      this.restrict = 0;
      this.canvas = undefined;
      this.query = this.q = new SplineQuery(this);
      this.frame = 0;
      this.rendermat = new Matrix4();
      this.last_sim_ms = time_ms();
      this.segments = [];
      this.handles = [];
      this._idgen = new SDIDGen();
      this.last_save_time = time_ms();
      this.proportional = false;
      this.prop_radius = 100;
      this.eidmap = {};
      this.elist_map = {};
      this.elists = [];
      this.selectmode = 1;
      this.layerset = new SplineLayerSet();
      this.layerset.new_layer();
      this.selected = new ElementArraySet();
      this.selected.layerset = this.layerset;
      this.draw_verts = true;
      this.draw_normals = true;
      this.init_elists();
    }
    static  blockDefine() {
      return {typeName: "spline", 
     defaultName: "Spline", 
     uiName: "Spline", 
     typeIndex: 6, 
     linkOrder: 3}
    }
     dag_get_datapath() {
      if (this.is_anim_path||(this.verts.cdata.layers.length>0&&this.verts.cdata.layers[0].name==="TimeDataLayer"))
        return "frameset.pathspline";
      else 
        return "frameset.drawspline";
    }
     force_full_resolve() {
      this.resolve = 1;
      for (var seg of this.segments) {
          seg.flag|=SplineFlags.UPDATE;
      }
      for (var v of this.verts) {
          v.flag|=SplineFlags.UPDATE;
      }
      for (var h of this.handles) {
          h.flag|=SplineFlags.UPDATE;
      }
    }
     regen_sort() {
      this.updateGen++;
      this.recalc|=RecalcFlags.DRAWSORT;
    }
     regen_solve() {
      this.resolve = 1;
      this.updateGen++;
      this.recalc|=RecalcFlags.SOLVE;
    }
     regen_render() {
      this.resolve = 1;
      this.updateGen++;
      this.recalc|=RecalcFlags.ALL;
    }
     init_elists() {
      for (let list of this.elists) {
          list.onDestroy();
      }
      this.elist_map = {};
      this.elists = [];
      for (var k in _elist_map) {
          var type=_elist_map[k];
          var list=new ElementArray(type, this.idgen, this.eidmap, this.selected, this.layerset, this);
          this[k] = list;
          this.elist_map[type] = list;
          this.elists.push(list);
      }
      this.init_sel_handlers();
    }
     init_sel_handlers() {
      var this2=this;
      this.verts.on_select = function (v, state) {
        for (var i=0; i<v.segments.length; i++) {
            var seg=v.segments[i];
            this2.handles.setselect(seg.handle(v), state);
        }
      };
    }
    get  idgen() {
      return this._idgen;
    }
    set  idgen(idgen) {
      this._idgen = idgen;
      if (this.elists==undefined) {
          return ;
      }
      for (var i=0; i<this.elists.length; i++) {
          this.elists[i].idgen = idgen;
      }
    }
     copy() {
      var ret=new Spline();
      ret.idgen = this.idgen.copy();
      ret.layerset = this.layerset.copyStructure();
      for (var i=0; i<ret.elists.length; i++) {
          ret.elists[i].idgen = ret.idgen;
          ret.elists[i].cdata.load_layout(this.elists[i].cdata);
      }
      var eidmap=ret.eidmap;
      for (let si=0; si<2; si++) {
          var list1=si ? this.handles : this.verts;
          var list2=si ? ret.handles : ret.verts;
          for (let i=0; i<list1.length; i++) {
              var v=list1[i];
              var v2=new SplineVertex(v);
              if (si===1) {
                  v2.type = SplineTypes.HANDLE;
              }
              v2.load(v);
              v2.flag = v.flag;
              v2.eid = v.eid;
              list2.push(v2, v2.eid, false);
              for (let layeri in v.layers) {
                  ret.layerset.idmap[layeri].add(v2);
              }
              if (si===1) {
                  ret.copy_handle_data(v2, v);
              }
              else {
                ret.copy_vert_data(v2, v);
              }
              eidmap[v.eid] = v2;
              if (v===list1.active)
                list2.active = v2;
          }
      }
      for (let i=0; i<this.segments.length; i++) {
          var s=this.segments[i];
          var s2=new SplineSegment();
          s2.eid = s.eid;
          s2.flag = s.flag;
          ret.segments.push(s2);
          eidmap[s2.eid] = s2;
          if (s===this.segments.active)
            ret.segments.active = s;
          s2.h1 = eidmap[s.h1.eid];
          s2.h2 = eidmap[s.h2.eid];
          s2.h1.segments.push(s2);
          s2.h2.segments.push(s2);
          s2.v1 = eidmap[s.v1.eid];
          s2.v2 = eidmap[s.v2.eid];
          s2.v1.segments.push(s2);
          s2.v2.segments.push(s2);
          for (var j=0; j<s.ks.length; j++) {
              s2.ks[j] = s.ks[j];
          }
          if (s.h1.hpair!==undefined)
            s2.h1.hpair = eidmap[s.h1.hpair.eid];
          if (s.h2.hpair!==undefined)
            s2.h2.hpair = eidmap[s.h2.hpair.eid];
          ret.copy_segment_data(s2, s);
          for (let layeri in s.layers) {
              ret.layerset.idmap[layeri].add(s2);
          }
      }
      for (var i=0; i<this.faces.length; i++) {
          var f=this.faces[i];
          var vlists=[];
          for (var list of f.paths) {
              var verts=[];
              vlists.push(verts);
              var l=list.l;
              do {
                verts.push(eidmap[l.v.eid]);
                l = l.next;
              } while (l!=list.l);
              
          }
          var f2=ret.make_face(vlists, f.eid);
          ret.copy_face_data(f2, f);
          eidmap[f2.eid] = f2;
          if (f==this.faces.active)
            ret.faces.active = f2;
          for (let layeri in f.layers) {
              ret.layerset.idmap[layeri].add(f2);
          }
      }
      return ret;
    }
     copy_element_data(dst, src) {
      if (dst.flag&SplineFlags.SELECT) {
          this.setselect(dst, false);
      }
      dst.cdata.copy(src.cdata);
      dst.flag = src.flag;
      if (dst.flag&SplineFlags.SELECT) {
          dst.flag&=~SplineFlags.SELECT;
          this.setselect(dst, true);
      }
    }
     copy_vert_data(dst, src) {
      this.copy_element_data(dst, src);
    }
     copy_handle_data(dst, src) {
      this.copy_element_data(dst, src);
    }
     copy_segment_data(dst, src) {
      this.copy_element_data(dst, src);
      dst.z = src.z;
      dst.w1 = src.w1;
      dst.w2 = src.w2;
      dst.shift1 = src.shift1;
      dst.shift2 = src.shift2;
      dst.mat.load(src.mat);
    }
     copy_face_data(dst, src) {
      this.copy_element_data(dst, src);
      dst.z = src.z;
      dst.mat.load(src.mat);
    }
    get  points() {
      return new AllPointsIter(this);
    }
     make_vertex(co, eid=undefined) {
      var v=new SplineVertex(co);
      v.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      this.verts.push(v, eid);
      this._vert_add_set.add(v.eid);
      this.dag_update("on_vert_add", this._vert_add_set);
      this.dag_update("on_vert_change");
      return v;
    }
     get_elist(type) {
      return this.elist_map[type];
    }
     make_handle(co, __eid=undefined) {
      var h=new SplineVertex();
      h.flag|=SplineFlags.BREAK_TANGENTS;
      h.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      h.type = SplineTypes.HANDLE;
      this.handles.push(h, __eid);
      return h;
    }
     split_edge(seg, s=0.5) {
      var co=seg.evaluate(s);
      let ws=_se_ws;
      let srcs=_se_srcs;
      var hpair=seg.h2.hpair;
      if (hpair!==undefined) {
          this.disconnect_handle(seg.h2);
      }
      var nv=this.make_vertex(co);
      nv.flag|=seg.v1.flag&seg.v2.flag;
      if (nv.flag&SplineFlags.SELECT) {
          nv.flag&=~SplineFlags.SELECT;
          this.verts.setselect(nv, true);
      }
      var v1=seg.v1, v2=seg.v2;
      var nseg=this.make_segment(nv, seg.v2);
      let w1=seg.w1+(seg.w2-seg.w1)*s;
      let w2=seg.w2;
      let shift1=seg.shift1+(seg.shift2-seg.shift1)*s;
      let shift2=seg.shift2;
      seg.w2 = w1;
      seg.shift2 = shift1;
      seg.v2.segments.remove(seg);
      nv.segments.push(seg);
      seg.v2 = nv;
      if (seg.l!==undefined) {
          var start=seg.l;
          var l=seg.l;
          var i=0;
          var lst=[];
          do {
            lst.push(l);
            if (i++>100) {
                console.trace("Infinite loop error");
                break;
            }
            l = l.radial_next;
          } while (l!==seg.l);
          
          for (var j=0; j<lst.length; j++) {
              var l=lst[j];
              var newl=this.make_loop();
              newl.f = l.f, newl.p = l.p;
              if (l.v===v1) {
                  newl.s = nseg;
                  newl.v = nv;
                  l.next.prev = newl;
                  newl.next = l.next;
                  l.next = newl;
                  newl.prev = l;
              }
              else 
                if (1) {
                  this._radial_loop_remove(l);
                  newl.s = seg;
                  newl.v = nv;
                  l.s = nseg;
                  l.next.prev = newl;
                  newl.next = l.next;
                  l.next = newl;
                  newl.prev = l;
                  this._radial_loop_insert(l);
              }
              this._radial_loop_insert(newl);
              l.p.totvert++;
          }
      }
      nv.flag|=SplineFlags.UPDATE;
      seg.v1.flag|=SplineFlags.UPDATE;
      nseg.v2.flag|=SplineFlags.UPDATE;
      var ret=split_edge_rets.next();
      ret[0] = nseg;
      ret[1] = nv;
      if (hpair!==undefined) {
          this.connect_handles(nseg.h2, hpair);
      }
      this.copy_segment_data(nseg, seg);
      nseg.w1 = w1;
      nseg.w2 = w2;
      nseg.shift1 = shift1;
      nseg.shift2 = shift2;
      srcs[0] = v1.cdata, srcs[1] = v2.cdata;
      this.copy_vert_data(nv, v1);
      nv.cdata.interp(srcs, ws);
      this.resolve = 1;
      return ret;
    }
     find_segment(v1, v2) {
      for (var i=0; i<v1.segments.length; i++) {
          if (v1.segments[i].other_vert(v1)===v2)
            return v1.segments[i];
      }
      return undefined;
    }
     disconnect_handle(h1) {
      h1.hpair.hpair = undefined;
      h1.hpair = undefined;
    }
     connect_handles(h1, h2) {
      var s1=h1.segments[0], s2=h2.segments[0];
      if (s1.handle_vertex(h1)!=s2.handle_vertex(h2)) {
          console.trace("Invalid call to connect_handles");
          return ;
      }
      if (h1.hpair!=undefined)
        this.disconnect_handle(h1);
      if (h2.hpair!=undefined)
        this.disconnect_handle(h2);
      h1.hpair = h2;
      h2.hpair = h1;
    }
     export_ks() {
      var mmlen=MMLEN;
      var size=4/UMUL+8/UMUL+this.segments.length*ORDER;
      size+=this.segments.length*(4/UMUL);
      size+=(8*Math.floor(this.segments.length/mmlen))/UMUL;
      var ret=new UARR(size);
      var view=new DataView(ret.buffer);
      var c=0, d=0;
      view.setInt32(c*UMUL, UMUL);
      c+=4/UMUL;
      var mink, maxk;
      for (var i=0; i<this.segments.length; i++) {
          var s=this.segments[i];
          if (d==0) {
              mink = 10000, maxk = -10000;
              for (var si=i; si<i+mmlen+1; si++) {
                  if (si>=this.segments.length)
                    break;
                  var s2=this.segments[si];
                  for (var j=0; j<ORDER; j++) {
                      mink = Math.min(mink, s2.ks[j]);
                      maxk = Math.max(maxk, s2.ks[j]);
                  }
              }
              view.setFloat32(c*UMUL, mink);
              view.setFloat32(c*UMUL+4, maxk);
              c+=8/UMUL;
          }
          view.setInt32(c*UMUL, s.eid);
          c+=4/UMUL;
          for (var j=0; j<ORDER; j++) {
              var k=s.ks[j];
              k = (k-mink)/(maxk-mink);
              if (k<0.0) {
                  console.log("EVIL!", k, mink, maxk);
              }
              k = Math.abs(Math.floor(k*UMAX));
              ret[c++] = k;
          }
          d = (d+1)%mmlen;
      }
      var ret2=ret;
      return ret2;
    }
     import_ks(data) {
      data = new UARR(data.buffer);
      var view=new DataView(data.buffer);
      var mmlen=MMLEN;
      var d=0, i=0;
      var datasize=view.getInt32(0);
      if (datasize!=UMUL) {
          return undefined;
      }
      i+=4/UMUL;
      while (i<data.length) {
        if (d==0) {
            var mink=view.getFloat32(i*UMUL);
            var maxk=view.getFloat32(i*UMUL+4);
            i+=8/UMUL;
        }
        d = (d+1)%mmlen;
        if (i>=data.length) {
            console.log("SPLINE CACHE ERROR", i, data.length);
            break;
        }
        var eid=view.getInt32(i*UMUL);
        i+=4/UMUL;
        var s=this.eidmap[eid];
        if (s==undefined||!(__instance_of(s, SplineSegment))) {
            console.log("Could not find segment", data[i-1]);
            i+=ORDER;
            continue;
        }
        for (var j=0; j<ORDER; j++) {
            var k=data[i++]/UMAX;
            k = k*(maxk-mink)+mink;
            s.ks[j] = k;
        }
      }
      return data;
    }
     fix_spline() {
      this.verts.remove_undefineds();
      this.handles.remove_undefineds();
      this.segments.remove_undefineds();
      this.faces.remove_undefineds();
      for (var i=0; i<2; i++) {
          var list=i ? this.handles : this.verts;
          for (var v of list) {
              for (var j=0; j<v.segments.length; j++) {
                  if (v.segments[j]==undefined) {
                      console.warn("Corruption detected for element", v.eid);
                      v.segments.pop_i(j);
                      j--;
                  }
              }
          }
      }
      var hset=new set();
      for (var s of this.segments) {
          hset.add(s.h1);
          hset.add(s.h2);
          for (let si=0; si<2; si++) {
              let h=si ? s.h2 : s.h1;
              if (h.segments.indexOf(s)<0) {
                  console.warn("fixing segment reference for handle", h.eid);
                  h.segments.length = 0;
                  h.segments.push(s);
              }
          }
      }
      let delset=new set();
      for (var h of this.handles) {
          if (!hset.has(h)) {
              delset.add(h);
          }
      }
      for (let h of delset) {
          console.log("Removing orphaned handle", h.eid, h);
          this.handles.remove(h);
      }
      var delsegments=new set();
      for (var v of this.verts) {
          for (var i=0; i<v.segments.length; i++) {
              var s=v.segments[i];
              if (s.v1!==v&&s.v2!==v) {
                  console.log("Corrupted segment! Deleting!");
                  v.segments.remove(s, true);
                  i--;
                  delsegments.add(s);
              }
          }
      }
      for (var s of delsegments) {
          this.kill_segment(s, true, true);
          continue;
          this.segments.remove(s, true);
          delete this.eidmap[s.eid];
          if (s.v1.indexOf(s)>=0)
            s.v1.segments.remove(s, true);
          if (s.v2.indexOf(s)>=0)
            s.v2.segments.remove(s, true);
          if (s.h1!==undefined&&s.h1.type===SplineTypes.HANDLE) {
              this.handles.remove(s.h1, true);
              delete this.eidmap[s.h1.eid];
          }
          if (s.h2!==undefined&&s.h2.type===SplineTypes.HANDLE) {
              this.handles.remove(s.h2, true);
              delete this.eidmap[s.h2.eid];
          }
          if (s.l!=undefined) {
              var l=s.l, c;
              var radial_next=l.radial_next;
              do {
                if (c++>100) {
                    console.log("Infinite loop (in fix_splines)!");
                    break;
                }
                this.kill_face(l.f);
                l = l.radial_next;
                if (l==undefined)
                  break;
              } while (l!=s.l);
              
          }
      }
      for (var s of this.segments) {
          if (s.v1.segments===undefined||s.v2.segments===undefined) {
              if (__instance_of(s.h1, SplineVertex))
                this.handles.remove(s.h1);
              if (__instance_of(s.h2, SplineVertex))
                this.handles.remove(s.h2);
              this.segments.remove(s);
              continue;
          }
          if (s.v1.segments.indexOf(s)<0) {
              s.v1.segments.push(s);
          }
          if (s.v2.segments.indexOf(s)<0) {
              s.v2.segments.push(s);
          }
          if (s.h1===undefined||s.h1.type!==SplineTypes.HANDLE) {
              console.log("Missing handle 1; adding. . .", s.eid, s);
              s.h1 = this.make_handle();
              s.h1.load(s.v1).interp(s.v2, 1.0/3.0);
          }
          if (s.h2===undefined||s.h2.type!==SplineTypes.HANDLE) {
              console.log("Missing handle 2; adding. . .", s.eid, s);
              s.h2 = this.make_handle();
              s.h2.load(s.v2).interp(s.v2, 2.0/3.0);
          }
          if (s.h1.segments[0]!==s)
            s.h1.segments = [s];
          if (s.h2.segments[0]!==s)
            s.h2.segments = [s];
      }
      var max_eid=0;
      for (var i=0; i<this.elists.length; i++) {
          var elist=this.elists[i];
          for (var e of elist) {
              max_eid = Math.max(e.eid, max_eid);
          }
      }
      var curid=!("cur_id" in this.idgen) ? "cur_eid" : "cur_id";
      if (max_eid>=this.idgen[curid]) {
          console.trace("IDGEN ERROR! DOOM! DOOM!");
          this.idgen[curid] = max_eid+1;
      }
    }
     select_none(ctx, datamode) {
      if (ctx===undefined) {
          throw new Error("ctx cannot be undefined");
      }
      if (datamode===undefined) {
          throw new Error("datamode cannot be undefined");
      }
      for (let elist of this.elists) {
          if (!(datamode&elist.type)) {
              continue;
          }
          for (let e of elist.selected.editable(ctx)) {
              this.setselect(e, false);
          }
      }
    }
     select_flush(datamode) {
      if (datamode&(SplineTypes.VERTEX|SplineTypes.HANDLE)) {
          var fset=new set();
          var sset=new set();
          var fact=this.faces.active, sact=this.segments.active;
          for (var v of this.verts.selected) {
              for (var s of v.segments) {
                  if (sset.has(s))
                    continue;
                  if (s.other_vert(v).flag&SplineFlags.SELECT) {
                      sset.add(s);
                  }
                  var l=s.l;
                  if (l===undefined)
                    continue;
                  var c=0;
                  do {
                    if (c++>1000) {
                        console.warn("Infinite loop detected!");
                        break;
                    }
                    var f=l.f;
                    if (f.flag&SplineFlags.SELECT) {
                        l = l.next;
                        continue;
                    }
                    var good=true;
                    for (var path of f.paths) {
                        for (var l2 of path) {
                            if (!(l2.v.flag&SplineFlags.SELECT)) {
                                good = false;
                                break;
                            }
                        }
                        if (!good)
                          break;
                    }
                    if (good) {
                        fset.add(f);
                    }
                    l = l.next;
                  } while (l!=s.l);
                  
              }
          }
          this.segments.clear_selection();
          this.faces.clear_selection();
          if (sact===undefined||!sset.has(sact)) {
              for (var s of sset) {
                  sact = s;
                  break;
              }
          }
          if (fact===undefined||!fset.has(fact)) {
              for (var f of fset) {
                  fact = f;
                  break;
              }
          }
          this.segments.active = sact;
          this.faces.active = fact;
          for (var s of sset) {
              this.segments.setselect(s, true);
          }
          for (var f of fset) {
              this.faces.setselect(f, true);
          }
      }
      else 
        if (datamode===SplineTypes.SEGMENT) {
          this.verts.clear_selection();
          this.faces.clear_selection();
          for (var s of this.segments.selected) {
              this.verts.setselect(s.v1, true);
              this.verts.setselect(s.v2, true);
              var l=s.l;
              if (l===undefined)
                continue;
              var c=0;
              do {
                if (c++>1000) {
                    console.warn("Infinite loop detected!");
                    break;
                }
                var f=l.f;
                if (f.flag&SplineFlags.SELECT) {
                    l = l.next;
                    continue;
                }
                var good=true;
                for (var path of f.paths) {
                    for (var l2 of path) {
                        if (!(l2.s.flag&SplineFlags.SELECT)) {
                            good = false;
                            break;
                        }
                    }
                    if (!good)
                      break;
                }
                if (good) {
                    console.log("selecting face");
                    this.faces.setselect(f, true);
                }
                l = l.next;
              } while (l!==s.l);
              
          }
      }
      else 
        if (datamode===SplineTypes.FACE) {
          this.verts.clear_selection();
          this.segments.clear_selection();
          for (var f of this.faces.selected) {
              for (var path of f.paths) {
                  for (var l of path) {
                      this.verts.setselect(l.v, true);
                      this.segments.setselect(l.s, true);
                  }
              }
          }
      }
    }
     make_segment(v1, v2, __eid, check_existing=true) {
      if (__eid===undefined)
        __eid = this.idgen.gen_id();
      if (check_existing) {
          var seg=this.find_segment(v1, v2);
          if (seg!==undefined)
            return seg;
      }
      var seg=new SplineSegment(v1, v2);
      seg.h1 = this.make_handle();
      seg.h2 = this.make_handle();
      seg.h1.load(v1).interp(v2, 1.0/3.0);
      seg.h2.load(v1).interp(v2, 2.0/3.0);
      seg.h1.segments.push(seg);
      seg.h2.segments.push(seg);
      seg.v1.segments.push(seg);
      seg.v2.segments.push(seg);
      seg.v1.flag|=SplineFlags.UPDATE;
      seg.v2.flag|=SplineFlags.UPDATE;
      seg.h1.flag|=SplineFlags.UPDATE;
      seg.h2.flag|=SplineFlags.UPDATE;
      seg.flag|=SplineFlags.UPDATE;
      this.segments.push(seg, __eid);
      return seg;
    }
     flip_segment(seg) {
      let v=seg.v1;
      let t=seg.v1;
      seg.v1 = seg.v2;
      seg.v2 = t;
      t = seg.h1;
      seg.h1 = seg.h2;
      seg.h2 = t;
      t = seg.w1;
      seg.w1 = seg.w2;
      seg.w2 = t;
      t = seg.shift1;
      seg.shift1 = seg.shift2;
      seg.shift2 = t;
      return this;
    }
     _radial_loop_insert(l) {
      if (l.s.l===undefined) {
          l.radial_next = l.radial_prev = l;
          l.s.l = l;
          return ;
      }
      l.radial_next = l.s.l;
      l.radial_prev = l.s.l.radial_prev;
      l.s.l.radial_prev.radial_next = l.s.l.radial_prev = l;
      l.s.l = l;
    }
     _radial_loop_remove(l) {
      l.radial_next.radial_prev = l.radial_prev;
      l.radial_prev.radial_next = l.radial_next;
      if (l===l.radial_next) {
          l.s.l = undefined;
      }
      else 
        if (l===l.s.l) {
          l.s.l = l.radial_next;
      }
    }
     make_face(vlists, custom_eid=undefined) {
      var f=new SplineFace();
      if (custom_eid==-1)
        custom_eid = undefined;
      this.faces.push(f);
      for (var i=0; i<vlists.length; i++) {
          var verts=vlists[i];
          if (verts.length<3) {
              throw new Error("Must have at least three vertices for face");
          }
          var vset={};
          for (var j=0; j<verts.length; j++) {
              if (verts[j].eid in vset) {
                  console.log(vlists);
                  throw new Error("Duplicate verts in make_face");
              }
              vset[verts[j].eid] = 1;
          }
      }
      for (var i=0; i<vlists.length; i++) {
          var verts=vlists[i];
          var list=new SplineLoopPath();
          list.f = f;
          list.totvert = verts.length;
          f.paths.push(list);
          var l=undefined, prevl=undefined;
          for (var j=0; j<verts.length; j++) {
              var v1=verts[j], v2=verts[(j+1)%verts.length];
              var s=this.make_segment(v1, v2, undefined, true);
              var l=this.make_loop();
              l.v = v1;
              l.s = s;
              l.f = f;
              l.p = list;
              if (prevl==undefined) {
                  list.l = l;
              }
              else {
                l.prev = prevl;
                prevl.next = l;
              }
              prevl = l;
          }
          list.l.prev = prevl;
          prevl.next = list.l;
          var l=list.l;
          do {
            this._radial_loop_insert(l);
            l = l.next;
          } while (l!=list.l);
          
      }
      return f;
    }
     make_loop() {
      var l=new SplineLoop();
      l.eid = this.idgen.gen_id();
      this.eidmap[l.eid] = l;
      return l;
    }
     kill_loop(l) {
      delete this.eidmap[l.eid];
    }
     _element_kill(e) {

    }
     kill_face(f) {
      for (var i=0; i<f.paths.length; i++) {
          var path=f.paths[i];
          for (var l of path) {
              this._radial_loop_remove(l);
              this.kill_loop(l);
          }
      }
      this._element_kill(f);
      this.faces.remove(f);
    }
     kill_segment(seg, kill_faces=true, soft_error=false) {
      var i=0;
      while (kill_faces&&seg.l!=undefined) {
        this.kill_face(seg.l.f);
        if (i++>1000) {
            console.trace("Infinite loop in kill_segment!!", seg);
            break;
        }
      }
      if (seg.v1.segments!=undefined)
        seg.v1.segments.remove(seg, soft_error);
      if (seg.v2.segments!=undefined)
        seg.v2.segments.remove(seg, soft_error);
      this.handles.remove(seg.h1, soft_error);
      this.handles.remove(seg.h2, soft_error);
      this._element_kill(seg);
      this.segments.remove(seg, soft_error);
    }
     do_save() {
      var obj=this.toJSON();
      var buf=JSON.stringify(obj);
      var blob=new Blob([buf], {type: "application/json"});
      var obj_url=window.URL.createObjectURL(blob);
      window.open(obj_url);
    }
     dissolve_vertex(v) {
      if (!(v.eid in this.eidmap)) {
          throw new Error("spline.dissolve_vertex called in error");
      }
      var ls2=[];
      if (v.segments.length!==2)
        return ;
      for (var i=0; i<v.segments.length; i++) {
          var s=v.segments[i];
          if (s.l===undefined)
            continue;
          var lst=[];
          var l=s.l;
          let _i=0;
          do {
            lst.push(l);
            l = l.radial_next;
            if (_i++>10000) {
                console.warn("infinite loop detected in dissolve_vertex");
                break;
            }
          } while (l!==s.l);
          
          for (var j=0; j<lst.length; j++) {
              var l=lst[j];
              if (l.v!==v&&l.next.v!==v)
                continue;
              if (l.v!==v) {
                  l = l.next;
              }
              if (l===l.p.l)
                l.p.l = l.next;
              if (l.p.totvert<=3||l.p.l===l) {
                  console.log("DESTROYING FACE!!", l.f.eid);
                  this.kill_face(l.f);
                  continue;
              }
              this._radial_loop_remove(l);
              ls2.push(l.prev);
              l.prev.next = l.next;
              l.next.prev = l.prev;
              this.kill_loop(l);
              l.p.totvert--;
          }
      }
      if (v.segments.length===2) {
          var s1=v.segments[0], s2=v.segments[1];
          var v1=s1.other_vert(v), v2=s2.other_vert(v);
          var existing=this.find_segment(v1, v2);
          let w1=v===s1.v1 ? s1.w2 : s1.w1;
          let w2=v===s2.v1 ? s2.w2 : s2.w1;
          let shift1=v===s1.v1 ? s1.shift2 : s1.shift1;
          let shift2=v===s2.v1 ? s2.shift2 : s2.shift1;
          if (s1.v1===v)
            s1.v1 = v2;
          else 
            s1.v2 = v2;
          var ci=0;
          while (s2.l!==undefined) {
            this._radial_loop_remove(s2.l);
            if (ci++>100) {
                console.warn("Infinite loop error!");
                break;
            }
          }
          while (s1.l!==undefined) {
            this._radial_loop_remove(s1.l);
            if (ci++>100) {
                console.warn("Infinite loop error!");
                break;
            }
          }
          this.kill_segment(s2);
          v2.segments.push(s1);
          v.segments.length = 0;
          let flip=false;
          if (existing) {
              flip = existing.v1!==s1.v1;
              this.kill_segment(s1);
              s1 = existing;
          }
          if (!flip) {
              s1.w1 = w1;
              s1.w2 = w2;
              s1.shift1 = shift1;
              s1.shift2 = shift2;
          }
          else {
            s1.w1 = w2;
            s1.w2 = w1;
            s1.shift1 = shift2;
            s1.shift2 = shift1;
          }
          if (s1.l===undefined) {
              for (var i=0; i<ls2.length; i++) {
                  var l=ls2[i];
                  l.s = s1;
                  this._radial_loop_insert(l);
                  console.log(s1.v1.eid, s1.v2.eid, "|", l.prev.v.eid, l.v.eid, l.next.v.eid);
              }
          }
          v.flag|=SplineFlags.UPDATE;
          v2.flag|=SplineFlags.UPDATE;
      }
      this.kill_vertex(v);
      this.resolve = 1;
    }
     buildSelCtxKey() {
      let key="";
      key+=this.layerset.active.id;
      return key;
    }
     kill_vertex(v) {
      if (!(v.eid in this.eidmap)) {
          throw new Error("spline.kill_vertex called in error");
      }
      this._vert_rem_set.add(v.eid);
      this.dag_update("on_vert_add", this._vert_rem_set);
      this.dag_update("on_vert_change");
      if (v.flag&SplineFlags.SELECT) {
          this.verts.setselect(v, false);
      }
      if (this.hpair!==undefined)
        this.disconnect_handle(this);
      while (v.segments.length>0) {
        var last=v.segments.length;
        this.kill_segment(v.segments[0]);
        if (last===v.segments.length) {
            console.log("EEK!");
            break;
        }
      }
      if (this.verts.active===v)
        this.verts.active = undefined;
      if (this.verts.highlight===v)
        this.verts.highlight = undefined;
      delete this.eidmap[v.eid];
      this._element_kill(v);
      this.verts.remove(v);
    }
     _vert_flag_update(v, depth, limit) {
      if (depth>=limit)
        return ;
      v.flag|=SplineFlags.TEMP_TAG;
      for (var i=0; i<v.segments.length; i++) {
          var s=v.segments[i], v2=s.other_vert(v);
          if (v2==undefined||v2.segments==undefined) {
              console.trace("ERROR 1: v, s, v2:", v, s, v2);
              continue;
          }
          var has_tan=v2.segments.length<=2;
          for (var j=0; j<v2.segments.length; j++) {
              var h=v2.segments[j].handle(v2);
              if (h.hpair!=undefined) {
                  has_tan = true;
              }
          }
          if (!has_tan) {
          }
          if (!(v2.flag&SplineFlags.TEMP_TAG)) {
              this._vert_flag_update(v2, depth+1, limit);
          }
      }
      for (var j=0; j<v.segments.length; j++) {
          var s=v.segments[j], v2=s.other_vert(v);
          if (v2.segments.length>2||(v2.flag&SplineFlags.BREAK_TANGENTS))
            v2.flag|=SplineFlags.TEMP_TAG;
      }
    }
     propagate_draw_flags(repeat=2) {
      for (var seg of this.segments) {
          seg.flag&=~SplineFlags.TEMP_TAG;
      }
      for (var seg of this.segments) {
          if (!(seg.flag&SplineFlags.REDRAW_PRE))
            continue;
          for (var i=0; i<2; i++) {
              var v=i ? seg.v2 : seg.v1;
              for (var j=0; j<v.segments.length; j++) {
                  var seg2=v.segments[j];
                  seg2.flag|=SplineFlags.TEMP_TAG;
                  var l=seg2.l;
                  if (l==undefined)
                    continue;
                  var _i=0;
                  do {
                    if (_i++>1000) {
                        console.warn("infinite loop!");
                        break;
                    }
                    l.f.flag|=SplineFlags.REDRAW_PRE;
                    l = l.radial_next;
                  } while (l!=seg2.l);
                  
              }
          }
      }
      for (var seg of this.segments) {
          if (seg.flag&SplineFlags.TEMP_TAG) {
              seg.flag|=SplineFlags.REDRAW_PRE;
          }
      }
      if (repeat!=undefined&&repeat>0) {
          this.propagate_draw_flags(repeat-1);
      }
    }
     propagate_update_flags() {
      for (let seg of this.segments) {
          if ((seg.v1.flag&SplineFlags.UPDATE)&&(seg.v1.flag&SplineFlags.BREAK_TANGENTS)) {
              seg.v2.flag|=SplineFlags.UPDATE;
          }
          if ((seg.v2.flag&SplineFlags.UPDATE)&&(seg.v2.flag&SplineFlags.BREAK_TANGENTS)) {
              seg.v1.flag|=SplineFlags.UPDATE;
          }
      }
      var verts=this.verts;
      for (var i=0; i<verts.length; i++) {
          var v=verts[i];
          v.flag&=~SplineFlags.TEMP_TAG;
      }
      var limit=5;
      for (var i=0; i<verts.length; i++) {
          var v=verts[i];
          if (v.flag&SplineFlags.UPDATE) {
              this._vert_flag_update(v, 0, limit);
          }
      }
      for (var i=0; i<verts.length; i++) {
          var v=verts[i];
          if (v.flag&SplineFlags.TEMP_TAG) {
              v.flag|=SplineFlags.UPDATE;
          }
      }
    }
     solve(steps, gk, force_queue=false) {
      var this2=this;
      var dag_trigger=function () {
        this2.dag_update("on_solve", true);
      };
      if (this._pending_solve!==undefined&&force_queue) {
          var this2=this;
          this._pending_solve = this._pending_solve.then(function () {
            this2.solve();
          });
          this.solving = true;
          return this._pending_solve;
      }
      else 
        if (this._pending_solve!==undefined) {
          var do_accept;
          var promise=new Promise(function (accept, reject) {
            do_accept = function () {
              accept();
            }
          });
          this._resolve_after = function () {
            do_accept();
          };
          return promise;
      }
      else {
        this._pending_solve = this.solve_intern(steps, gk);
        this.solving = true;
        return this._pending_solve;
      }
    }
     on_destroy() {
      for (let elist of this.elists) {
          elist.onDestroy();
      }
    }
     solve_intern(steps, gk) {
      var this2=this;
      var dag_trigger=function () {
        this2.dag_update("on_solve", true);
        the_global_dag.exec(g_app_state.screen.ctx);
      };
      for (var v of this.verts) {
          if (v.flag&SplineFlags.UPDATE) {
              for (var i=0; i<v.segments.length; i++) {
                  var seg=v.segments[i];
                  seg.flag|=SplineFlags.REDRAW_PRE;
                  var l=seg.l;
                  if (!l)
                    continue;
                  var _i=0;
                  do {
                    if (_i++>5000) {
                        console.warn("infinite loop!");
                        break;
                    }
                    l.f.flag|=SplineFlags.REDRAW_PRE;
                    l = l.radial_next;
                  } while (l!=seg.l);
                  
              }
          }
      }
      this.propagate_draw_flags();
      if (window.DISABLE_SOLVE||config.DISABLE_SOLVE) {
          return new Promise((accept, reject) =>            {
            accept();
          });
      }
      var this2=this;
      if (!DEBUG.no_native&&config.USE_WASM&&native_api.isReady()) {
          var ret=native_api.do_solve(SplineFlags, this, steps, gk, true);
          ret.then(function () {
            this2._pending_solve = undefined;
            this2.solving = false;
            this2._do_post_solve();
            dag_trigger();
            if (this2._resolve_after) {
                var cb=this2._resolve_after;
                this2._resolve_after = undefined;
                this2._pending_solve = this2.solve_intern().then(function () {
                  cb.call(this2);
                });
                this2.solving = true;
            }
          });
          return ret;
      }
      else 
        if (!DEBUG.no_native&&config.USE_NACL&&window.common!=undefined&&window.common.naclModule!=undefined) {
          var ret=do_solve(SplineFlags, this, steps, gk, true);
          ret.then(function () {
            this2._pending_solve = undefined;
            this2.solving = false;
            this2._do_post_solve();
            dag_trigger();
            if (this2._resolve_after) {
                var cb=this2._resolve_after;
                this2._resolve_after = undefined;
                this2._pending_solve = this2.solve_intern().then(function () {
                  cb.call(this2);
                });
                this2.solving = true;
            }
          });
          return ret;
      }
      else {
        var do_accept;
        var promise=new Promise(function (accept, reject) {
          do_accept = function () {
            accept();
          }
        });
        var this2=this;
        var timer=window.setInterval(function () {
          window.clearInterval(timer);
          do_solve(SplineFlags, this2, steps, gk);
          this2._pending_solve = undefined;
          this2.solving = false;
          do_accept();
          this2._do_post_solve();
          dag_trigger();
          if (this2._resolve_after) {
              var cb=this2._resolve_after;
              this2._resolve_after = undefined;
              this2._pending_solve = this2.solve_intern().then(function () {
                cb.call(this2);
              });
              this2.solving = true;
          }
        }, 10);
        return promise;
      }
    }
     _do_post_solve() {
      for (var seg of this.segments) {
          if (seg.flag&SplineFlags.REDRAW_PRE) {
              seg.flag&=~SplineFlags.REDRAW_PRE;
              seg.flag|=SplineFlags.REDRAW;
          }
      }
      for (var f of this.faces) {
          if (f.flag&SplineFlags.REDRAW_PRE) {
              f.flag&=~SplineFlags.REDRAW_PRE;
              f.flag|=SplineFlags.REDRAW;
          }
      }
      for (var seg of this.segments) {
          seg.post_solve();
      }
    }
     solve_p(steps, gk) {
      console.trace("solve_p: DEPRECATED");
      return this.solve(steps, gk);
    }
     trace_face(g, f) {
      g.beginPath();
      let lastco=_trace_face_lastco;
      lastco.zero();
      for (var path of f.paths) {
          var first=true;
          for (var l of path) {
              var seg=l.s;
              var flip=seg.v1!==l.v;
              var s=flip ? seg.ks[KSCALE] : 0, ds=flip ? -2 : 2;
              while ((!flip&&s<seg.ks[KSCALE])||(flip&&s>=0)) {
                var co=seg.evaluate(s/seg.length);
                if (first) {
                    first = false;
                    g.moveTo(co[0], co[1]);
                }
                else {
                  g.lineTo(co[0], co[1]);
                }
                s+=ds;
              }
          }
      }
      g.closePath();
    }
     forEachPoint(cb, thisvar) {
      for (var si=0; si<2; si++) {
          var list=si ? this.handles : this.verts;
          var last_len=list.length;
          for (var i=0; i<list.length; i++) {
              if (thisvar!=undefined)
                cb.call(thisvar, list[i]);
              else 
                cb(list[i]);
              last_len = list.length;
          }
      }
    }
     build_shash() {
      var sh={};
      var cellsize=150;
      sh.cellsize = cellsize;
      function hash(x, y, cellsize) {
        return Math.floor(x/cellsize)+","+Math.floor(y/cellsize);
      }
      for (var si=0; si<2; si++) {
          var list=si ? this.handles : this.verts;
          for (var v of list) {
              var h=hash(v[0], v[1], cellsize);
              if (!(h in sh)) {
                  sh[h] = [];
              }
              sh[h].push(v);
          }
      }
      var sqrt2=sqrt(2);
      sh.forEachPoint = function sh_lookupPoints(co, radius, callback, thisvar) {
        var cellsize=this.cellsize;
        var cellradius=Math.ceil(sqrt2*radius/cellsize);
        var sx=Math.floor(co[0]/cellsize)-cellradius;
        var sy=Math.floor(co[1]/cellsize)-cellradius;
        var ex=Math.ceil(co[0]/cellsize)+cellradius;
        var ey=Math.ceil(co[1]/cellsize)+cellradius;
        for (var x=sx; x<=ex; x++) {
            for (var y=sy; y<=ey; y++) {
                var h=hash(x*cellsize, y*cellsize, cellsize);
                if (!(h in this))
                  continue;
                var list=this[h];
                for (var i=0; i<list.length; i++) {
                    var e=list[i];
                    var dis=e.vectorDistance(co);
                    if (dis<radius&&co!==e) {
                        callback.call(thisvar, e, dis);
                    }
                }
            }
        }
      };
      return sh;
    }
     unhide_all() {
      for (var i=0; i<this.verts.length; i++) {
          var v=this.verts[i];
          if (v.flag&SplineFlags.HIDE) {
              v.flag&=~SplineFlags.HIDE;
              v.flag|=SplineFlags.SELECT;
          }
      }
    }
     duplicate_verts() {
      var newvs=[];
      var idmap={};
      for (var i=0; i<this.verts.length; i++) {
          var v=this.verts[i];
          if (!(v.flag&SplineFlags.SELECT))
            continue;
          if (v.hidden)
            continue;
          var nv=this.make_vertex(v);
          idmap[v.eid] = nv;
          idmap[nv.eid] = v;
          nv.flag = v.flag&~SplineFlags.SELECT;
          newvs.push(nv);
      }
      for (var i=0; i<this.segments.length; i++) {
          var seg=this.segments[i];
          if ((seg.v1.flag&SplineFlags.SELECT)&&(seg.v2.flag&SplineFlags.SELECT)) {
              var v1=idmap[seg.v1.eid], v2=idmap[seg.v2.eid];
              if (v1==undefined||v2==undefined||v1==v2)
                continue;
              this.make_segment(v1, v2);
          }
      }
      for (var i=0; i<this.verts.length; i++) {
          var v=this.verts[i];
          this.verts.setselect(v, false);
      }
      for (var i=0; i<newvs.length; i++) {
          this.verts.setselect(newvs[i], true);
      }
      this.start_mpos[0] = this.mpos[0];
      this.start_mpos[1] = this.mpos[1];
      this.start_transform();
      this.resolve = 1;
    }
     has_highlight(selmask=255) {
      for (let list of this.elists) {
          if ((list.type&selmask)&&list.highlight)
            return true;
      }
      return false;
    }
     clear_highlight() {
      for (var i=0; i<this.elists.length; i++) {
          this.elists[i].highlight = undefined;
      }
    }
     validate_active() {
      for (var i=0; i<this.elists.length; i++) {
          var elist=this.elists[i];
          if (elist.active!=undefined&&elist.active.hidden)
            elist.active = undefined;
      }
    }
     clear_active(e) {
      this.set_active(undefined);
    }
     set_active(e) {
      if (e===undefined) {
          for (var i=0; i<this.elists.length; i++) {
              this.elists[i].active = undefined;
          }
          return ;
      }
      var elist=this.get_elist(e.type);
      elist.active = e;
    }
     setselect(e, state) {
      var elist=this.get_elist(e.type);
      elist.setselect(e, state);
    }
     clear_selection(e) {
      for (var i=0; i<this.elists.length; i++) {
          this.elists[i].clear_selection();
      }
    }
     do_mirror() {
      this.start_transform('s');
      for (var i=0; i<this.transdata.length; i++) {
          var start=this.transdata[i][0], v=this.transdata[i][1];
          if (v.flag&SplineFlags.HIDE)
            continue;
          v.sub(this.trans_cent);
          v[0] = -v[0];
          v.add(this.trans_cent);
      }
      this.end_transform();
      this.resolve = 1;
    }
     toJSON(self) {
      var ret={};
      ret.frame = this.frame;
      ret.verts = {length: this.verts.length};
      ret.segments = [];
      ret.handles = [];
      ret.draw_verts = this.draw_verts;
      ret.draw_normals = this.draw_normals;
      ret._cur_id = this.idgen.cur_id;
      for (var i=0; i<this.verts.length; i++) {
          ret.verts[i] = this.verts[i].toJSON();
      }
      if (this.verts.active!=undefined)
        ret.verts.active = this.verts.active.eid;
      else 
        ret.verts.active = undefined;
      if (this.handles.active!=undefined)
        ret.handles.active = this.handles.active.eid;
      if (this.segments.active!=undefined)
        ret.segments.active = this.segments.active.eid;
      for (var i=0; i<this.segments.length; i++) {
          ret.segments.push(this.segments[i].toJSON());
      }
      for (var i=0; i<this.handles.length; i++) {
          ret.handles.push(this.handles[i].toJSON());
      }
      return ret;
    }
     reset() {
      this.idgen = new SDIDGen();
      this.strokeGroups = [];
      this._strokeGroupMap = new Map();
      this.init_elists();
      this.updateGen++;
    }
     import_json(obj) {
      var spline2=Spline.fromJSON(obj);
      var miny=1e+18, maxy=1e-18;
      var newmap={};
      for (var i=0; i<spline2.verts.length; i++) {
          var v=spline2.verts[i];
          var nv=this.make_vertex(v, v.eid);
          nv.flag = v.flag;
          nv.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
          miny = Math.min(miny, nv[1]);
          maxy = Math.max(maxy, nv[1]);
          newmap[v.eid] = nv;
      }
      for (var i=0; i<spline2.verts.length; i++) {
          var v=spline2.verts[i], nv=newmap[v.eid];
          nv[1] = ((maxy-miny)-(nv[1]-miny))+miny;
      }
      for (var i=0; i<spline2.segments.length; i++) {
          var seg=spline2.segments[i];
          var v1=newmap[seg.v1.eid], v2=newmap[seg.v2.eid];
          var nseg=this.make_segment(v1, v2);
          nseg.flag = seg.flag|SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
          newmap[seg.eid] = nseg;
      }
      this.resolve = 1;
    }
     redoSegGroups() {
      buildSegmentGroups(this);
      splitSegmentGroups(this);
    }
    static  fromJSON(obj) {
      var spline=new Spline();
      spline.idgen.cur_id = obj._cur_id;
      spline.draw_verts = obj.draw_verts;
      spline.draw_normals = obj.draw_normals;
      var eidmap={};
      for (var i=0; i<obj.verts.length; i++) {
          var cv=obj.verts[i];
          var v=spline.make_vertex(cv);
          v.flag|=SplineFlags.FRAME_DIRTY;
          v.flag = cv.flag;
          v.eid = cv.eid;
          v.segments = cv.segments;
          eidmap[v.eid] = v;
      }
      for (var i=0; i<obj.handles.length; i++) {
          var cv=obj.handles[i];
          var v=spline.make_handle(cv);
          v.flag = cv.flag;
          v.eid = cv.eid;
          v.segments = cv.segments;
          eidmap[v.eid] = v;
      }
      for (var i=0; i<obj.segments.length; i++) {
          var s=obj.segments[i];
          var segments=obj.segments;
          var v1=eidmap[s.v1], v2=eidmap[s.v2];
          var h1=eidmap[s.h1], h2=eidmap[s.h2];
          var seg=new SplineSegment();
          seg.eid = s.eid;
          seg.flag = s.flag;
          if (seg.ks.length===s.ks.length) {
              seg.ks = s.ks;
          }
          else {
            spline.resolve = true;
            for (var j=0; j<spline.verts.length; j++) {
                spline.verts[j].flag|=SplineFlags.UPDATE;
            }
          }
          for (var j=0; j<seg.ks.length; j++) {
              if (isNaN(seg.ks[j])) {
                  seg.ks[j] = 0.0;
              }
          }
          seg.v1 = v1, seg.v2 = v2, seg.h1 = h1, seg.h2 = h2;
          spline.segments.push(seg);
          eidmap[seg.eid] = seg;
      }
      for (var i=0; i<obj.verts.length; i++) {
          var v=obj.verts[i];
          for (var j=0; j<v.segments.length; j++) {
              v.segments[j] = eidmap[v.segments[j]];
          }
      }
      for (var i=0; i<obj.handles.length; i++) {
          var v=obj.handles[i];
          for (var j=0; j<v.segments.length; j++) {
              v.segments[j] = eidmap[v.segments[j]];
          }
      }
      if (obj.verts.active!==undefined)
        spline.verts.active = eidmap[obj.verts.active];
      if (obj.handles.active!==undefined)
        spline.handles.active = eidmap[obj.handles.active];
      if (obj.segments.active!==undefined)
        spline.segments.active = eidmap[obj.segments.active];
      spline.eidmap = eidmap;
      return spline;
    }
     prune_singles() {
      var del=[];
      for (var i=0; i<this.verts.length; i++) {
          var v=this.verts[i];
          if (v.segments.length===0) {
              del.push(v);
          }
      }
      for (var i=0; i<del.length; i++) {
          this.kill_vertex(del[i]);
      }
    }
     checkSolve() {
      if (this.resolve) {
          if (this.solvePromise&&util.time_ms()-this.solveTimeout<1000) {
              return ;
          }
          else {
            this.solvePromise = this.solve().then(() =>              {
              this.solvePromise = undefined;
              window.redraw_viewport();
            });
            this.solveTimeout = util.time_ms();
          }
      }
    }
     draw(redraw_rects, g, editor, matrix, selectmode, only_render, draw_normals, alpha, draw_time_helpers, curtime, ignore_layers) {
      this.canvas = g;
      this.selectmode = selectmode;
      g.lineWidth = 1;
      this.checkSolve();
      return draw_spline(this, redraw_rects, g, editor, matrix, selectmode, only_render, draw_normals, alpha, draw_time_helpers, curtime, ignore_layers);
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.afterSTRUCT();
      this.query = this.q = new SplineQuery(this);
      var eidmap={};
      this.elists = [];
      this.elist_map = {};
      for (var k in _elist_map) {
          var type=_elist_map[k];
          var v=this[k];
          if (v==undefined)
            continue;
          this.elists.push(v);
          this.elist_map[type] = v;
      }
      this.init_sel_handlers();
      for (var si=0; si<2; si++) {
          var list=si ? this.handles : this.verts;
          for (var i=0; i<list.length; i++) {
              var v=list[i];
              eidmap[v.eid] = v;
              if (v.type==SplineTypes.VERTEX)
                v.hpair = undefined;
          }
      }
      for (var h of this.handles) {
          h.hpair = eidmap[h.hpair];
      }
      for (var i=0; i<this.segments.length; i++) {
          var s=this.segments[i];
          s.v1 = eidmap[s.v1];
          s.v2 = eidmap[s.v2];
          s.h1 = eidmap[s.h1];
          s.h2 = eidmap[s.h2];
          eidmap[s.eid] = s;
      }
      for (var si=0; si<2; si++) {
          var list=si ? this.handles : this.verts;
          for (var i=0; i<list.length; i++) {
              var v=list[i];
              for (var j=0; j<v.segments.length; j++) {
                  v.segments[j] = eidmap[v.segments[j]];
              }
          }
      }
      for (var i=0; i<this.faces.length; i++) {
          var f=this.faces[i];
          f.flag|=SplineFlags.UPDATE_AABB;
          eidmap[f.eid] = f;
          for (var path of f.paths) {
              path.f = f;
              var l=path.l;
              do {
                eidmap[l.eid] = l;
                l.f = f;
                l.s = eidmap[l.s];
                l.v = eidmap[l.v];
                l = l.next;
              } while (l!=path.l);
              
          }
      }
      for (var i=0; i<this.faces.length; i++) {
          var f=this.faces[i];
          for (var path of f.paths) {
              var l=path.l;
              do {
                l.radial_next = eidmap[l.radial_next];
                l.radial_prev = eidmap[l.radial_prev];
                l = l.next;
              } while (l!=path.l);
              
          }
      }
      for (var i=0; i<this.segments.length; i++) {
          var s=this.segments[i];
          s.l = eidmap[s.l];
      }
      this.eidmap = eidmap;
      var selected=new ElementArraySet();
      selected.layerset = this.layerset;
      for (var i=0; i<this.selected.length; i++) {
          var eid=this.selected[i];
          if (!(eid in eidmap)) {
              console.log("WARNING! eid", eid, "not in eidmap!", Object.keys(eidmap));
              continue;
          }
          selected.add(eidmap[this.selected[i]]);
      }
      this.selected = selected;
      this.verts.afterSTRUCT(SplineTypes.VERTEX, this.idgen, this.eidmap, this.selected, this.layerset, this);
      this.handles.afterSTRUCT(SplineTypes.HANDLE, this.idgen, this.eidmap, this.selected, this.layerset, this);
      this.segments.afterSTRUCT(SplineTypes.SEGMENT, this.idgen, this.eidmap, this.selected, this.layerset, this);
      this.faces.afterSTRUCT(SplineTypes.FACE, this.idgen, this.eidmap, this.selected, this.layerset, this);
      if (this.layerset===undefined) {
          this.layerset = new SplineLayerSet();
          this.layerset.new_layer();
      }
      else {
        this.layerset.afterSTRUCT(this);
      }
      this._strokeGroupMap = new Map();
      for (let group of this.strokeGroups) {
          this._strokeGroupMap.set(group.hash, group);
          group.afterSTRUCT(this);
      }
      this.regen_sort();
      if (spline_multires.has_multires(this)&&this.mres_format!=undefined) {
          console.log("Converting old multires layout. . .");
          for (var seg of this.segments) {
              var mr=seg.cdata.get_layer(spline_multires.MultiResLayer);
              mr._convert(this.mres_format, spline_multires._format);
          }
      }
      var arr=[];
      for (var i=0; i<spline_multires._format.length; i++) {
          arr.push(spline_multires._format[i]);
      }
      this.mres_format = arr;
      for (let seg of this.segments) {
          seg.updateCoincident();
      }
      return this;
    }
     flagUpdateVertTime(v) {
      if (v) {
          this._vert_time_set.add(v.eid);
      }
      this.dag_update("on_vert_time_change", this._vert_time_set);
    }
     flagUpdateKeyframes(v) {
      this.dag_update("on_keyframe_insert", 1);
    }
     dag_exec(ctx, inputs, outputs, graph) {
      outputs.on_vert_add.loadData(this._vert_add_set);
      this._vert_add_set = new set();
      this._vert_rem_set = new set();
      this._vert_time_set = new set();
    }
    static  nodedef() {
      return {name: "Spline", 
     uiName: "Spline", 
     outputs: {on_keyframe_insert: null, 
      on_solve: null, 
      on_vert_time_change: new set(), 
      on_vert_add: new set(), 
      on_vert_remove: new set(), 
      on_vert_change: null}, 
     inputs: {}}
    }
  }
  _ESClass.register(Spline);
  _es6_module.add_class(Spline);
  Spline = _es6_module.add_export('Spline', Spline);
  
  mixin(Spline, DataPathNode);
  Spline.STRUCT = STRUCT.inherit(Spline, DataBlock)+`
    idgen    : SDIDGen;
    
    selected : iter(e, int) | e.eid;
    
    verts    : ElementArray;
    handles  : ElementArray;
    segments : ElementArray;
    faces    : ElementArray;
    layerset : SplineLayerSet;
    
    restrict : int;
    actlevel : int;
    
    mres_format : array(string);
    strokeGroups : array(SplineStrokeGroup);
}
`;
  DataBlock.register(Spline);
  var SplineStrokeGroup=es6_import_item(_es6_module, './spline_strokegroup.js', 'SplineStrokeGroup');
  var buildSegmentGroups=es6_import_item(_es6_module, './spline_strokegroup.js', 'buildSegmentGroups');
  var splitSegmentGroups=es6_import_item(_es6_module, './spline_strokegroup.js', 'splitSegmentGroups');
}, '/dev/fairmotion/src/curve/spline.js');


es6_module_define('solver', [], function _solver_module(_es6_module) {
  var SQRT2=Math.sqrt(2.0);
  var FEPS=1e-17;
  var PI=Math.PI;
  var sin=Math.sin, cos=Math.cos, atan2=Math.atan2;
  var sqrt=Math.sqrt, pow=Math.pow, log=Math.log, abs=Math.abs;
  var SPI2=Math.sqrt(PI/2);
  class constraint  {
     constructor(typename, k, klst, klen, ceval, params, limit) {
      if (limit==undefined)
        limit = 1e-05;
      this.limit = limit;
      this.type = typename;
      this.klst = klst;
      this.ceval = ceval;
      this.params = params;
      this.klen = [];
      if (!(__instance_of(klen, Array))) {
          for (var i=0; i<klst.length; i++) {
              this.klen.push(klen);
          }
      }
      else {
        this.klen = klen;
      }
      this.glst = [];
      for (var i=0; i<klst.length; i++) {
          var gs=[];
          this.glst.push(gs);
          for (var j=0; j<klen; j++) {
              gs.push(0);
          }
      }
      this.k = k;
    }
     exec(do_gs) {
      if (do_gs==undefined)
        do_gs = true;
      var r1=this.ceval(this.params);
      if (abs(r1)<=this.limit)
        return 0.0;
      if (!do_gs)
        return r1;
      var df=3e-06;
      for (var ki=0; ki<this.klst.length; ki++) {
          var ks=this.klst[ki];
          var gs=this.glst[ki];
          for (var i=0; i<this.klen[ki]; i++) {
              var orig=ks[i];
              ks[i]+=df;
              var r2=this.ceval(this.params);
              gs[i] = (r2-r1)/df;
              ks[i] = orig;
              if (ks.length>5) {
              }
          }
      }
      return r1;
    }
  }
  _ESClass.register(constraint);
  _es6_module.add_class(constraint);
  constraint = _es6_module.add_export('constraint', constraint);
  class solver  {
    
     constructor() {
      this.cs = [];
      this.threshold = 0.001;
      this.edge_segs = [];
    }
     add(c) {
      this.cs.push(c);
    }
     solve(steps, gk, final_solve, edge_segs) {
      if (gk==undefined)
        gk = 1.0;
      var err=0.0;
      var clen=this.cs.length;
      for (var i=0; i<steps; i++) {
          for (var j=0; j<edge_segs.length; j++) {
              var seg=edge_segs[j];
              var ks=seg.ks;
              for (var k=0; k<ks.length; k++) {
                  ks[k] = seg._last_ks[k];
              }
          }
          err/=this.cs.length;
          if (i>0&&err<this.threshold)
            break;
          if (isNaN(err))
            break;
          err = 0.0;
          var cs=this.cs;
          var visit={};
          for (var j=0; j<cs.length; j++) {
              var j2=i%2 ? clen-j-1 : j;
              var c=cs[j2];
              var r=c.exec(true);
              err+=abs(r);
              if (r==0.0)
                continue;
              var klst=c.klst, glst=c.glst;
              var totgs=0.0;
              for (var ki=0; ki<klst.length; ki++) {
                  var klen=c.klen[ki];
                  var gs=glst[ki];
                  totgs = 0.0;
                  for (var k=0; k<klen; k++) {
                      totgs+=gs[k]*gs[k];
                  }
                  if (totgs==0.0)
                    continue;
                  var rmul=r/totgs;
                  ks = klst[ki];
                  gs = glst[ki];
                  var ck=i>8&&c.k2!==undefined ? c.k2 : c.k;
                  let mul=1.0/Math.pow(1.0+ks[KSCALE], 0.25);
                  for (var k=0; k<klen; k++) {
                      ks[k]+=-rmul*gs[k]*ck*gk*mul;
                  }
              }
          }
      }
      for (var j=0; j<edge_segs.length; j++) {
          var seg=edge_segs[j];
          var ks=seg.ks;
          for (var k=0; k<ks.length; k++) {
              seg.ks[k] = seg._last_ks[k];
          }
      }
      if (final_solve||isNaN(err)) {
          console.log("err", err, "steps", i, "\n");
      }
      return i;
    }
  }
  _ESClass.register(solver);
  _es6_module.add_class(solver);
  solver = _es6_module.add_export('solver', solver);
}, '/dev/fairmotion/src/curve/solver.js');


es6_module_define('spline_multires', ["./spline_base.js", "../util/binomial_table.js", "../core/struct.js"], function _spline_multires_module(_es6_module) {
  "use strict";
  var acos=Math.acos, asin=Math.asin, abs=Math.abs, log=Math.log, sqrt=Math.sqrt, pow=Math.pow, PI=Math.PI, floor=Math.floor, min=Math.min, max=Math.max, sin=Math.sin, cos=Math.cos, tan=Math.tan, atan=Math.atan, atan2=Math.atan2, exp=Math.exp, ceil=Math.ceil;
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  var CustomDataLayer=es6_import_item(_es6_module, './spline_base.js', 'CustomDataLayer');
  var SplineTypes=es6_import_item(_es6_module, './spline_base.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, './spline_base.js', 'SplineFlags');
  var CurveEffect=es6_import_item(_es6_module, './spline_base.js', 'CurveEffect');
  var MResFlags={SELECT: 1, 
   ACTIVE: 2, 
   REBASE: 4, 
   UPDATE: 8, 
   HIGHLIGHT: 16, 
   HIDE: 64, 
   FRAME_DIRTY: 128}
  MResFlags = _es6_module.add_export('MResFlags', MResFlags);
  var _a=0;
  var TX=0;
  TX = _es6_module.add_export('TX', TX);
  var TY=1;
  TY = _es6_module.add_export('TY', TY);
  var TVX=2;
  TVX = _es6_module.add_export('TVX', TVX);
  var TVY=3;
  TVY = _es6_module.add_export('TVY', TVY);
  var TSEG=4;
  TSEG = _es6_module.add_export('TSEG', TSEG);
  var TS=5;
  TS = _es6_module.add_export('TS', TS);
  var TT=6;
  TT = _es6_module.add_export('TT', TT);
  var TA=7;
  TA = _es6_module.add_export('TA', TA);
  var TFLAG=8;
  TFLAG = _es6_module.add_export('TFLAG', TFLAG);
  var TID=9;
  TID = _es6_module.add_export('TID', TID);
  var TLEVEL=10;
  TLEVEL = _es6_module.add_export('TLEVEL', TLEVEL);
  var TSUPPORT=11;
  TSUPPORT = _es6_module.add_export('TSUPPORT', TSUPPORT);
  var TBASIS=12;
  TBASIS = _es6_module.add_export('TBASIS', TBASIS);
  var TDEGREE=13;
  TDEGREE = _es6_module.add_export('TDEGREE', TDEGREE);
  var TNEXT=14;
  TNEXT = _es6_module.add_export('TNEXT', TNEXT);
  var TTOT=15;
  TTOT = _es6_module.add_export('TTOT', TTOT);
  var _format=["TX", "TY", "TVX", "TVY", "TSEG", "TS", "TT", "TA", "TFLAG", "TID", "TLEVEL", "TSUPPORT", "TBASIS", "TDEGREE", "TNEXT"];
  _format = _es6_module.add_export('_format', _format);
  var IHEAD=0, ITAIL=1, IFREEHEAD=2, ITOTPOINT=3, ITOT=4;
  var $p_n9ko_recalc_offset;
  class BoundPoint  {
    
     constructor() {
      this.mr = undefined;
      this.i = undefined;
      this.data = undefined;
      this.composed_id = -1;
      this.offset = {};
      var this2=this;
      Object.defineProperty(this.offset, "0", {get: function () {
          return this2.data[this2.i+TVX];
        }, 
     set: function (val) {
          this2.data[this2.i+TVX] = val;
        }});
      Object.defineProperty(this.offset, "1", {get: function () {
          return this2.data[this2.i+TVY];
        }, 
     set: function (val) {
          this2.data[this2.i+TVY] = val;
        }});
    }
     recalc_offset(spline) {
      var seg=spline.eidmap[this.seg];
      var co=seg._evalwrap.evaluate(this.s);
      this.offset[0] = this[0]-co[0];
      this.offset[1] = this[1]-co[1];
      $p_n9ko_recalc_offset[0] = this[0];
      $p_n9ko_recalc_offset[1] = this[1];
      var sta=seg._evalwrap.global_to_local($p_n9ko_recalc_offset, undefined, this.s);
      this.t = sta[1];
      this.a = sta[2];
    }
     toString() {
      var next=this.data!=undefined ? this.data[this.i+TNEXT] : "(error)";
      return "{\n"+"\"0\"   : "+this[0]+",\n"+"\"1\"   : "+this[1]+",\n"+".offset : ["+this.offset[0]+", "+this.offset[1]+"],\n"+"id      : "+this.id+",\n"+"seg     : "+this.seg+",\n"+"t       : "+this.t+",\n"+"s       : "+this.s+",\n"+"flag    : "+this.flag+",\n"+"next    : "+next+"\n"+"}\n";
    }
     bind(mr, i) {
      this.mr = mr;
      this.i = i;
      this.data = mr.data;
      this.composed_id = compose_id(this.seg, this.id);
      return this;
    }
    get  0() {
      return this.data[this.i+TX];
    }
    set  0(val) {
      this.data[this.i+TX] = val;
    }
    get  1() {
      return this.data[this.i+TY];
    }
    set  1(val) {
      this.data[this.i+TY] = val;
    }
    get  support() {
      return this.data[this.i+TSUPPORT];
    }
    set  support(val) {
      this.data[this.i+TSUPPORT] = val;
    }
    get  degree() {
      return this.data[this.i+TDEGREE];
    }
    set  degree(val) {
      this.data[this.i+TDEGREE] = val;
    }
    get  basis() {
      return this.data[this.i+TBASIS];
    }
    set  basis(val) {
      this.data[this.i+TBASIS] = val;
    }
    get  seg() {
      return this.data[this.i+TSEG];
    }
    set  seg(val) {
      this.data[this.i+TSEG] = val;
    }
    get  level() {
      return this.data[this.i+TLEVEL];
    }
    set  level(val) {
      this.data[this.i+TLEVEL] = val;
    }
    get  s() {
      return this.data[this.i+TS];
    }
    set  s(val) {
      this.data[this.i+TS] = val;
    }
    get  t() {
      return this.data[this.i+TT];
    }
    set  t(val) {
      this.data[this.i+TT] = val;
    }
    get  a() {
      return this.data[this.i+TA];
    }
    set  a(val) {
      this.data[this.i+TA] = val;
    }
    get  flag() {
      return this.data[this.i+TFLAG];
    }
    set  flag(val) {
      this.data[this.i+TFLAG] = val;
    }
    get  id() {
      return this.data[this.i+TID];
    }
    set  id(val) {
      this.data[this.i+TID] = val;
    }
    get  next() {
      return this.data[this.i+TNEXT];
    }
  }
  var $p_n9ko_recalc_offset=new Vector3([0, 0, 0]);
  _ESClass.register(BoundPoint);
  _es6_module.add_class(BoundPoint);
  BoundPoint = _es6_module.add_export('BoundPoint', BoundPoint);
  var pointiter_ret_cache=cachering.fromConstructor(BoundPoint, 12);
  var add_point_cache=cachering.fromConstructor(BoundPoint, 12);
  var get_point_cache=cachering.fromConstructor(BoundPoint, 12);
  class point_iter  {
    
     constructor() {
      this.ret = {done: true, 
     value: undefined};
    }
     [Symbol.iterator]() {
      return this;
    }
     cache_init(mr, level) {
      this.mr = mr;
      this.level = level;
      this.data = mr.data;
      this.cur = mr.index[level*ITOT+IHEAD];
      this.ret.done = false;
      this.ret.value = undefined;
      return this;
    }
     next() {
      if (this.cur==-1) {
          this.ret.done = true;
          this.ret.value = undefined;
          this.mr = undefined;
          return this.ret;
      }
      var d=this.data;
      var cur=this.cur;
      var p=pointiter_ret_cache.next();
      p.bind(this.mr, this.cur);
      this.cur = d[cur+TNEXT];
      if (this.cur==cur) {
          console.log("EEK! bad data in mres iterator!", this, this.mr, this.cur, cur, "level:", this.level);
          this.cur = -1;
      }
      this.ret.value = p;
      return this.ret;
    }
  }
  _ESClass.register(point_iter);
  _es6_module.add_class(point_iter);
  var binomial_table=es6_import_item(_es6_module, '../util/binomial_table.js', 'binomial_table');
  var bernstein_offsets=es6_import_item(_es6_module, '../util/binomial_table.js', 'bernstein_offsets');
  function binomial(n, k) {
    if (binomial_table.length>n) {
        return binomial_table[n][k];
    }
    if (k==0.0||k==n) {
        return 1;
    }
    return binomial(n-1, k-1)+binomial(n-1, k);
  }
  function bernstein(degree, s) {
    degree = Math.max(Math.floor(degree), 0.0);
    var half=Math.floor(degree/2);
    return binomial(degree, half)*pow(s, half)*pow(1.0-s, degree-half);
  }
  function bernstein2(degree, s) {
    var a=floor(degree+1);
    var b=ceil(degree+1);
    if (isNaN(a)||a<=0) {
        return 0.0;
    }
    var start=0.0, mid=0.5, end=1.0;
    if (a>=0&&a<bernstein_offsets.length) {
        start = bernstein_offsets[a][0];
        mid = bernstein_offsets[a][1];
        end = bernstein_offsets[a][2];
    }
    var off=0.5-mid;
    if (1||a<4) {
        var t=1.0-abs(s-0.5)*2.0;
        s-=off*t;
    }
    else {
      s*=2.0;
      s = start*(1.0-s)+mid*s;
    }
    var height=bernstein(a, mid, 0, a, Math.floor(a/2));
    return bernstein(a, s)/height;
  }
  function crappybasis(s, k, support, degree) {
    if (s<k-support||s>=k+support)
      return 0.0;
    var start=k-support, end=k+support;
    var t=(s-start)/(end-start);
    var degree2=degree-2.0;
    var sign=degree2<0.0 ? -1.0 : 1.0;
    degree2 = pow(degree2, 0.25)*sign+2.0;
    t = bernstein2(degree, t);
    if (isNaN(t))
      t = 0.0;
    return t;
  }
  var $sum_5hyE_evaluate;
  var $ks_TCI9_evaluate;
  class MultiResEffector extends CurveEffect {
     constructor(owner) {
      super();
      this.mr = owner;
    }
     evaluate(s) {
      var n=this.prior.derivative(s);
      var t=n[0];
      n[0] = n[1];
      n[1] = t;
      n.normalize();
      n.mulScalar(10.0);
      var co=this.prior.evaluate(s);
      $sum_5hyE_evaluate.zero();
      var i=0;
      for (var p in this.mr.points(0)) {
          $ks_TCI9_evaluate[i] = p.s;
          i++;
      }
      for (var p in this.mr.points(0)) {
          var w=crappybasis(s, p.s, p.support, p.degree);
          if (isNaN(w))
            continue;
          $sum_5hyE_evaluate[0]+=p.offset[0]*w;
          $sum_5hyE_evaluate[1]+=p.offset[1]*w;
      }
      for (var i=0; i<2; i++) {
          var next=i ? this.next : this.prev;
          var soff=i ? -1.0 : 1.0;
          var sign=i ? -1.0 : 1.0;
          if (next!=undefined) {
              var mr=!(__instance_of(next, MultiResEffector)) ? next.eff.mr : next.mr;
              for (var p in mr.points(0)) {
                  if ((!i&&p.s-support>=0)||(i&&p.s+support<=1.0))
                    continue;
                  var support=p.support;
                  var ps=p.s;
                  var s2;
                  if (!i) {
                      s2 = next.rescale(this, s)+1.0;
                  }
                  else {
                    s2 = -next.rescale(this, 1.0-s);
                  }
                  var w=crappybasis(s2, ps, support, p.degree);
                  $sum_5hyE_evaluate[0]+=p.offset[0]*w;
                  $sum_5hyE_evaluate[1]+=p.offset[1]*w;
              }
          }
      }
      co.add($sum_5hyE_evaluate);
      return co;
    }
  }
  var $sum_5hyE_evaluate=new Vector3();
  var $ks_TCI9_evaluate=new Array(2000);
  _ESClass.register(MultiResEffector);
  _es6_module.add_class(MultiResEffector);
  MultiResEffector = _es6_module.add_export('MultiResEffector', MultiResEffector);
  class MultiResGlobal  {
     constructor() {
      this.active = undefined;
    }
    static  fromSTRUCT(reader) {
      var ret=new MultiResGlobal();
      reader(ret);
      return ret;
    }
  }
  _ESClass.register(MultiResGlobal);
  _es6_module.add_class(MultiResGlobal);
  MultiResGlobal = _es6_module.add_export('MultiResGlobal', MultiResGlobal);
  MultiResGlobal.STRUCT = `
  MultiResGlobal {
    active : double | obj.active == undefined ? -1 : obj.active;
  }
`;
  var $_co_ko5f_add_point;
  var $sta_hQq3_recalc_worldcos_level;
  class MultiResLayer extends CustomDataLayer {
     constructor(size=16) {
      super(this);
      this._effector = new MultiResEffector(this);
      this.max_layers = 8;
      this.data = new Float64Array(size*TTOT);
      this.index = new Array(this.max_layers*ITOT);
      this.totpoint = 0;
      this._size = size;
      this._freecur = 0;
      for (var i=0; i<this.max_layers; i++) {
          this.index[i*ITOT+IHEAD] = -1;
          this.index[i*ITOT+ITAIL] = -1;
          this.index[i*ITOT+IFREEHEAD] = 0;
      }
      this.points_iter_cache = cachering.fromConstructor(point_iter, 8);
    }
     _convert(formata, formatb) {
      var totp=this.data.length/formata.length;
      var data=new Float64Array(totp*formatb.length);
      var odata=this.data;
      var ttota=formata.length, ttotb=formatb.length;
      console.log("FORMATA", formata, "\n");
      console.log("FORMATB", formatb, "\n");
      var fa=[], fb=[];
      var fmap={};
      for (var i=0; i<formata.length; i++) {
          for (var j=0; j<formatb.length; j++) {
              if (formata[i]==formatb[j]) {
                  fmap[i] = j;
              }
          }
      }
      console.log("FMAP", fmap, "\n");
      for (var i=0; i<totp; i++) {
          for (var j=0; j<formata.length; j++) {
              var src=odata[i*ttota+j];
              if ((formata[j]=="TNEXT"||formata[j]=="TID")&&src!=-1) {
                  src = Math.floor((src/ttota)*ttotb);
              }
              data[i*ttotb+fmap[j]] = src;
          }
      }
      for (var i=0; i<this.max_layers; i++) {
          if (this.index[i*ITOT+IHEAD]!=-1)
            this.index[i*ITOT+IHEAD] = Math.floor((this.index[i*ITOT+IHEAD]/ttota)*ttotb);
          if (this.index[i*ITOT+ITAIL]!=-1)
            this.index[i*ITOT+ITAIL] = Math.floor((this.index[i*ITOT+ITAIL]/ttota)*ttotb);
          if (this.index[i*ITOT+IFREEHEAD]!=-1)
            this.index[i*ITOT+IFREEHEAD] = Math.floor((this.index[i*ITOT+IFREEHEAD]/ttota)*ttotb);
      }
      this.data = data;
    }
     fix_points(seg=undefined) {
      var index=this.index;
      for (var i=0; i<this.index.length; i+=ITOT) {
          index[i] = index[i+1] = -1;
          index[i+2] = index[i+3] = 0;
      }
      var data=this.data;
      for (var i=0; i<data.length; i+=TTOT) {
          if (data[i]==0&&data[i+1]==0&&data[i+2]==0&&data[TNEXT]==0)
            continue;
          this._freecur = i+TTOT;
          var lvl=data[i+TLEVEL];
          if (index[lvl*ITOT+IHEAD]==-1) {
              index[lvl*ITOT+IHEAD] = index[lvl*ITOT+ITAIL] = i;
              data[i+TNEXT] = -1;
          }
          else {
            var i2=index[lvl*ITOT+ITAIL];
            data[i2+TNEXT] = i;
            data[i+TNEXT] = -1;
            index[lvl*ITOT+ITAIL] = i;
          }
          index[lvl*ITOT+ITOTPOINT]++;
      }
      if (seg==undefined)
        return ;
      for (var i=0; i<this.max_layers; i++) {
          for (var p in this.points(i)) {
              p.seg = seg.eid;
          }
      }
    }
     points(level) {
      return this.points_iter_cache.next().cache_init(this, level);
    }
     add_point(level, co=$_co_ko5f_add_point) {
      this._freecur+=TTOT-(this._freecur%TTOT);
      var i=this._freecur;
      if (this._freecur+TTOT>=this._size) {
          this.resize(this._freecur+3);
      }
      var j=0;
      this.data[i+TX] = co[0];
      this.data[i+TY] = co[1];
      this.data[i+TLEVEL] = level;
      this.data[i+TID] = i;
      this.data[i+TNEXT] = -1;
      this.data[i+TSUPPORT] = 0.3;
      this.data[i+TDEGREE] = 2.0;
      this._freecur = i+TTOT;
      var head=this.index[level*ITOT+IHEAD];
      var tail=this.index[level*ITOT+ITAIL];
      if (head==-1||tail==-1) {
          this.index[level*ITOT+IHEAD] = i;
          this.index[level*ITOT+ITAIL] = i;
      }
      else {
        this.data[tail+TNEXT] = i;
        this.index[level*ITOT+ITAIL] = i;
      }
      this.index[level*ITOT+ITOTPOINT]++;
      this.totpoint++;
      return add_point_cache.next().bind(this, i);
    }
     get(id, allocate_object=false) {
      if (allocate_object)
        return new BoundPoint().bind(this, id);
      else 
        return get_point_cache.next().bind(this, id);
    }
     curve_effect() {
      return this._effector;
    }
     resize(newsize) {
      if (newsize<this._size)
        return ;
      newsize*=2.0;
      var array=new Float64Array(newsize);
      var oldsize=this.data.length;
      for (var i=0; i<oldsize; i++) {
          array[i] = this.data[i];
      }
      this._size = newsize;
      this.data = array;
    }
     segment_split(old_segment, old_v1, old_v2, new_segments) {

    }
     recalc_worldcos_level(seg, level) {
      for (var p in this.points(level)) {
          $sta_hQq3_recalc_worldcos_level[0] = p.s;
          $sta_hQq3_recalc_worldcos_level[1] = p.t;
          $sta_hQq3_recalc_worldcos_level[2] = p.a;
          var co=seg._evalwrap.local_to_global($sta_hQq3_recalc_worldcos_level);
          var co2=seg._evalwrap.evaluate($sta_hQq3_recalc_worldcos_level[0]);
          p[0] = co[0];
          p[1] = co[1];
          p.offset[0] = co[0]-co2[0];
          p.offset[1] = co[1]-co2[1];
      }
    }
     recalc_wordscos(seg) {
      for (var i=0; i<this.max_layers; i++) {
          this.recalc_worldcos_level(seg, i);
      }
    }
     post_solve(owner_segment) {
      this.recalc_wordscos(owner_segment);
    }
     interp(srcs, ws) {
      this.time = 0.0;
      for (var i=0; i<srcs.length; i++) {

      }
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(this);
      ret.max_layers = 8;
    }
    static  define() {
      return {typeName: "MultiResLayer", 
     hasCurveEffect: true, 
     sharedClass: MultiResGlobal}
    }
  }
  var $_co_ko5f_add_point=[0, 0];
  var $sta_hQq3_recalc_worldcos_level=[0, 0, 0];
  _ESClass.register(MultiResLayer);
  _es6_module.add_class(MultiResLayer);
  MultiResLayer = _es6_module.add_export('MultiResLayer', MultiResLayer);
  MultiResLayer.STRUCT = STRUCT.inherit(MultiResLayer, CustomDataLayer)+`
    data            : array(double);
    index           : array(double);
    max_layers      : int;
    totpoint        : int;
    _freecur        : int;
    _size           : int;
  }
`;
  function test_fix_points() {
    var spline=new Context().spline;
    for (var seg in spline.segments) {
        var mr=seg.cdata.get_layer(MultiResLayer);
        mr.fix_points(seg);
    }
  }
  test_fix_points = _es6_module.add_export('test_fix_points', test_fix_points);
  function test_multires(n) {
    var mr=new MultiResLayer();
    var adds=[0.5, -0.25, -1, 1, 1, -2, 4, 9, 11.3, 3, 4, 0.245345, 1.0234, 8, 7, 4, 6];
    var iadd=0.0;
    for (var i=0; i<5; i++, iadd+=0.2*(i+1)) {
        var add=iadd;
        var p=mr.add_point(0, [-4, -3]);
        var c=0;
        p.id = adds[c++]+add++;
        p.offset[0] = adds[c++]+add++;
        p.offset[1] = adds[c++]+add++;
        p.flag = adds[c++]+add++;
        p.seg = adds[c++]+add++;
        p.t = adds[c++]+add++;
        p.s = adds[c++]+add++;
        p[0] = adds[c++]+add++;
        p[1] = adds[c++]+add++;
        add = iadd;
        c = 0;
        console.log(p.id==adds[c++]+add++, adds[c-1]+add-1, p.id, "id");
        console.log(p.offset[0]==adds[c++]+add++, adds[c-1]+add-1, p.offset[0], "offset[0]");
        console.log(p.offset[1]==adds[c++]+add++, adds[c-1]+add-1, p.offset[1], "offset[1]");
        console.log(p.flag==adds[c++]+add++, adds[c-1]+add-1, p.flag, "flag");
        console.log(p.seg==adds[c++]+add++, adds[c-1]+add-1, p.seg, "seg");
        console.log(p.t==adds[c++]+add++, adds[c-1]+add-1, p.t, "t");
        console.log(p.s==adds[c++]+add++, adds[c-1]+add-1, p.s, "s");
        console.log(p[0]==adds[c++]+add++, adds[c-1]+add-1, p[0], "[0]");
        console.log(p[1]==adds[c++]+add++, adds[c-1]+add-1, p[1], "[1]");
    }
    var _c=0;
    for (var p of mr.points(0)) {
        console.log(""+p);
        if (_c++>1000) {
            console.trace("Infinite loop!");
            break;
        }
    }
    return mr;
  }
  test_multires = _es6_module.add_export('test_multires', test_multires);
  function compose_id(eid, index) {
    var mul=(1<<24);
    return index+eid*mul;
  }
  compose_id = _es6_module.add_export('compose_id', compose_id);
  var $ret_293G_decompose_id=[0, 0];
  function decompose_id(id) {
    var mul=(1<<24);
    var eid=Math.floor(id/mul);
    id-=eid*mul;
    $ret_293G_decompose_id[0] = eid;
    $ret_293G_decompose_id[1] = id;
    return $ret_293G_decompose_id;
  }
  decompose_id = _es6_module.add_export('decompose_id', decompose_id);
  var _test_id_start=0;
  function test_ids(steps, start) {
    if (steps===undefined) {
        steps = 1;
    }
    if (start===undefined) {
        start = _test_id_start;
    }
    var max_mres=5000000;
    var max_seg=500000;
    console.log("starting at", start);
    for (var i=start; i<start+steps; i++) {
        for (var j=0; j<max_seg; j++) {
            var id=compose_id(i, j);
            var ret=decompose_id(id);
            if (i!=ret[0]||j!=ret[1]) {
                console.log("Found bad combination!!", ret[0], ret[1], "||", i, j);
            }
        }
    }
    console.log("finished");
    _test_id_start = i;
  }
  test_ids = _es6_module.add_export('test_ids', test_ids);
  function has_multires(spline) {
    return spline.segments.cdata.num_layers("MultiResLayer")>0;
  }
  has_multires = _es6_module.add_export('has_multires', has_multires);
  function ensure_multires(spline) {
    if (spline.segments.cdata.num_layers("MultiResLayer")==0) {
        spline.segments.cdata.add_layer(MultiResLayer);
    }
  }
  ensure_multires = _es6_module.add_export('ensure_multires', ensure_multires);
  var empty_iter={_ret: {done: true, 
    value: undefined}, 
   next: function () {
      this._ret.done = true;
      this._ret.value = undefined;
      return this._ret;
    }}
  empty_iter[Symbol.iterator] = function () {
    return this;
  }
  class GlobalIter  {
    
     constructor(spline, level, return_keys=false) {
      this.spline = spline;
      this.level = level;
      this.return_keys = return_keys;
      this.seg = undefined;
      this.segiter = spline.segments[Symbol.iterator]();
      this.pointiter = undefined;
      this.ret = {done: false, 
     value: undefined};
    }
     next() {
      if (this.pointiter==undefined) {
          this.seg = this.segiter.next();
          if (this.seg.done==true) {
              this.ret.done = true;
              this.ret.value = undefined;
              return this.ret;
          }
          this.seg = this.seg.value;
          var mr=this.seg.cdata.get_layer(MultiResLayer);
          this.pointiter = mr.points(this.level);
      }
      var p=this.pointiter.next();
      if (p.done) {
          this.pointiter = undefined;
          return this.next();
      }
      p = p.value;
      this.ret.value = this.return_keys ? compose_id(p.seg, p.id) : p;
      return this.ret;
    }
     [Symbol.iterator]() {
      return this;
    }
  }
  _ESClass.register(GlobalIter);
  _es6_module.add_class(GlobalIter);
  function iterpoints(spline, level, return_keys) {
    if (return_keys===undefined) {
        return_keys = false;
    }
    if (spline.segments.cdata.num_layers("MultiResLayer")==0)
      return empty_iter;
    return new GlobalIter(spline, level, return_keys);
  }
  iterpoints = _es6_module.add_export('iterpoints', iterpoints);
  iterpoints.selected = function (spline, level) {
  }
}, '/dev/fairmotion/src/curve/spline_multires.js');


es6_module_define('spline_strokegroup', ["../path.ux/scripts/pathux.js", "./spline_element_array.js", "./spline_types.js"], function _spline_strokegroup_module(_es6_module) {
  "use strict";
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  var cconst=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'cconst');
  var Vector3=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector4');
  var Vector2=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector2');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Matrix4');
  var Quat=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Quat');
  var SplineSegment=es6_import_item(_es6_module, './spline_types.js', 'SplineSegment');
  var SplineVertex=es6_import_item(_es6_module, './spline_types.js', 'SplineVertex');
  var SplineTypes=es6_import_item(_es6_module, './spline_types.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, './spline_types.js', 'SplineFlags');
  var SplineFace=es6_import_item(_es6_module, './spline_types.js', 'SplineFace');
  var SplineElement=es6_import_item(_es6_module, './spline_types.js', 'SplineElement');
  var SplineLayerFlags=es6_import_item(_es6_module, './spline_element_array.js', 'SplineLayerFlags');
  let hashcache=util.cachering.fromConstructor(util.HashDigest, 8);
  class SplineStrokeGroup  {
    
    
     constructor(segs) {
      this.hash = -1;
      this.segments = [];
      this.eids = [];
      this.id = -1;
      if (segs) {
          for (let seg of segs) {
              this.add(seg);
          }
          this.calcHash();
      }
    }
     add(seg) {
      this.segments.push(seg);
      this.eids.push(seg.eid);
    }
     calcHash() {
      this.hash = SplineStrokeGroup.calcHash(this.segments);
    }
    static  calcHash(segments) {
      let hash=hashcache.next().reset();
      for (let s of segments) {
          hash.add(s.eid);
      }
      return hash.get();
    }
     loadSTRUCT(reader) {
      reader(this);
    }
     afterSTRUCT(spline) {
      let eids=this.eids;
      this.segments.length = 0;
      this.eids = [];
      for (let eid of eids) {
          let seg=spline.eidmap[eid];
          if (!seg) {
              console.warn("Missing SplineSegment in SplineGroup!");
              continue;
          }
          this.segments.push(seg);
          this.eids.push(eid);
      }
      this.calcHash();
      return this;
    }
  }
  _ESClass.register(SplineStrokeGroup);
  _es6_module.add_class(SplineStrokeGroup);
  SplineStrokeGroup = _es6_module.add_export('SplineStrokeGroup', SplineStrokeGroup);
  SplineStrokeGroup.STRUCT = `
SplineStrokeGroup {
  id       : int;
  hash     : uint;
  eids     : array(int);
}
`;
  function splitSegmentGroups(spline) {
    let oldstrokes=spline._drawStrokeGroupMap;
    spline._drawStrokeGroupMap = new Map();
    spline.drawStrokeGroups.length = 0;
    let c1=new Vector4();
    let c2=new Vector4();
    function visible(seg) {
      let hide=seg.flag&SplineFlags.HIDE;
      hide = hide||(seg.flag&SplineFlags.NO_RENDER);
      if (hide)
        return false;
      for (let k in seg.layers) {
          if (spline.layerset.get(k).flag&SplineLayerFlags.HIDE) {
              return false;
          }
      }
      return true;
    }
    for (let group of spline.strokeGroups) {
        if (group.segments.length===0) {
            continue;
        }
        let seg=group.segments[0];
        let i=0;
        while (i<group.segments.length&&!visible(group.segments[i])) {
          i++;
        }
        if (i===group.segments.length) {
            continue;
        }
        seg = group.segments[i];
        let segs=[];
        for (let s of group.segments) {
            let mat1=seg.mat;
            let mat2=s.mat;
            c1.load(mat1.strokecolor);
            c2.load(mat2.strokecolor);
            let bad=Math.abs(mat1.blur-mat2.blur)>0.01;
            bad = bad||c1.vectorDistance(c2)>0.01;
            bad = bad||!visible(s);
            let layerbad=true;
            for (let k in s.layers) {
                if (k in seg.layers) {
                    layerbad = false;
                }
            }
            bad = bad||layerbad;
            if (bad&&segs.length>0) {
                let hash=SplineStrokeGroup.calcHash(segs);
                let group;
                if (oldstrokes.has(hash)) {
                    group = oldstrokes.get(hash);
                    for (let i=0; i<group.segments.length; i++) {
                        group.segments[i] = spline.eidmap[group.eids[i]];
                    }
                }
                else {
                  group = new SplineStrokeGroup(segs);
                  group.id = spline.idgen.gen_id();
                }
                spline._drawStrokeGroupMap.set(hash, group);
                spline.drawStrokeGroups.push(group);
                segs = [];
            }
            segs.push(s);
        }
        if (segs.length>0) {
            let hash=SplineStrokeGroup.calcHash(segs);
            let group2;
            if (oldstrokes.has(hash)) {
                group2 = oldstrokes.get(hash);
                for (let i=0; i<group2.segments.length; i++) {
                    group2.segments[i] = spline.eidmap[group2.eids[i]];
                }
            }
            else {
              group2 = new SplineStrokeGroup(segs);
              group2.id = spline.idgen.gen_id();
            }
            spline._drawStrokeGroupMap.set(hash, group2);
            spline.drawStrokeGroups.push(group2);
        }
    }
  }
  splitSegmentGroups = _es6_module.add_export('splitSegmentGroups', splitSegmentGroups);
  function buildSegmentGroups(spline) {
    let roots=new Set();
    let visit=new Set();
    let oldstrokes=spline._strokeGroupMap;
    spline._strokeGroupMap = new Map();
    spline.strokeGroups.length = 0;
    let groups=spline.strokeGroups;
    for (let v of spline.verts) {
        let val=v.segments.length;
        if (val===0||val===2) {
            continue;
        }
        roots.add(v);
    }
    let vvisit=new Set();
    let doseg=(v) =>      {
      let startv=v;
      for (let seg of v.segments) {
          if (visit.has(seg))
            continue;
          let _i=0;
          let segs=[seg];
          v = startv;
          visit.add(seg);
          vvisit.add(startv);
          do {
            if (v!==seg.v1&&v!==seg.v2) {
                console.error("EEK!!");
                break;
            }
            v = seg.other_vert(v);
            vvisit.add(v);
            if (v.segments.length!==2) {
                break;
            }
            seg = v.other_segment(seg);
            segs.push(seg);
            visit.add(seg);
            if (_i++>1000) {
                console.warn("infinite loop detected");
                break;
            }
          } while (v!==startv);
          
          if (segs.length===0) {
              continue;
          }
          let group=new SplineStrokeGroup(segs);
          group.calcHash();
          if (oldstrokes.has(group.hash)) {
              group = oldstrokes.get(group.hash);
              for (let i=0; i<group.segments.length; i++) {
                  group.segments[i] = spline.eidmap[group.eids[i]];
              }
          }
          else {
            group.id = spline.idgen.gen_id();
          }
          if (!spline._strokeGroupMap.has(group.hash)) {
              spline._strokeGroupMap.set(group.hash, group);
              groups.push(group);
          }
      }
    }
    for (let v of roots) {
        doseg(v);
    }
    for (let v of spline.verts) {
        if (!(vvisit.has(v))) {
            doseg(v);
        }
    }
    for (let i=0; i<groups.length; i++) {
        let g=groups[i];
        for (let j=0; j<g.segments.length; j++) {
            if (g.segments[j]===undefined) {
                console.warn("Corrupted group!", g);
                g.segments.remove(undefined);
                j--;
            }
        }
        if (g.length===0) {
            groups[i] = groups[groups.length-1];
            groups.length--;
            i--;
        }
    }
  }
  buildSegmentGroups = _es6_module.add_export('buildSegmentGroups', buildSegmentGroups);
}, '/dev/fairmotion/src/curve/spline_strokegroup.js');


es6_module_define('solver_new', ["./spline_math.js", "./spline_base.js"], function _solver_new_module(_es6_module) {
  "USE_PREPROCESSOR";
  var KSCALE=es6_import_item(_es6_module, './spline_math.js', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, './spline_math.js', 'KANGLE');
  var SplineTypes=es6_import_item(_es6_module, './spline_base.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, './spline_base.js', 'SplineFlags');
  var acos=Math.acos, asin=Math.asin, cos=Math.cos, sin=Math.sin, PI=Math.PI, pow=Math.pow, sqrt=Math.sqrt, log=Math.log, abs=Math.abs;
  var $tan_eM8h_solve=new Vector3();
  function solve(spline, order, steps, gk, do_inc, edge_segs) {
    var pairs=[];
    var CBREAK=SplineFlags.BREAK_CURVATURES;
    var TBREAK=SplineFlags.BREAK_TANGENTS;
    function reset_edge_segs() {
      for (var j=0; do_inc&&j<edge_segs.length; j++) {
          var seg=edge_segs[j];
          var ks=seg.ks;
          for (var k=0; k<ks.length; k++) {
              ks[k] = seg._last_ks[k];
          }
      }
    }
    var eps=0.0001;
    for (var i=0; i<spline.handles.length; i++) {
        var h=spline.handles[i], seg1=h.owning_segment, v=h.owning_vertex;
        if (do_inc&&!((v.flag)&SplineFlags.UPDATE))
          continue;
        if (!(h.flag&SplineFlags.USE_HANDLES)&&v.segments.length<=2)
          continue;
        if (h.hpair!=undefined&&(h.flag&SplineFlags.AUTO_PAIRED_HANDLE)) {
            var seg2=h.hpair.owning_segment;
            var s1=v===seg1.v1 ? eps : 1.0-eps, s2=v==seg2.v1 ? eps : 1.0-eps;
            var thresh=5;
            if (seg1.v1.vectorDistance(seg1.v2)<thresh||seg2.v1.vectorDistance(seg2.v2)<thresh)
              continue;
            var d1=seg1.v1.vectorDistance(seg1.v2);
            var d2=seg2.v1.vectorDistance(seg2.v2);
            var ratio=Math.min(d1/d2, d2/d1);
            if (isNaN(ratio))
              ratio = 0.0;
            pairs.push(v);
            pairs.push(seg1);
            pairs.push(seg2);
            pairs.push(s1);
            pairs.push(s2);
            pairs.push((s1<0.5)==(s2<0.5) ? -1 : 1);
            pairs.push(ratio);
        }
        else 
          if (!(h.flag&SplineFlags.AUTO_PAIRED_HANDLE)) {
            var s1=v==seg1.v1 ? 0 : 1;
            pairs.push(v);
            pairs.push(seg1);
            pairs.push(undefined);
            pairs.push(s1);
            pairs.push(0.0);
            pairs.push(1);
            pairs.push(1);
        }
    }
    var PSLEN=7;
    for (var i=0; i<spline.verts.length; i++) {
        var v=spline.verts[i];
        if (do_inc&&!((v.flag)&SplineFlags.UPDATE))
          continue;
        if (v.segments.length!=2)
          continue;
        if (v.flag&TBREAK)
          continue;
        var seg1=v.segments[0], seg2=v.segments[1];
        var s1=v===seg1.v1 ? 0 : 1, s2=v==seg2.v1 ? 0 : 1;
        seg1.evaluate(0.5, order);
        seg2.evaluate(0.5, order);
        var thresh=5;
        if (seg1.v1.vectorDistance(seg1.v2)<thresh||seg2.v1.vectorDistance(seg2.v2)<thresh)
          continue;
        var d1=seg1.v1.vectorDistance(seg1.v2);
        var d2=seg2.v1.vectorDistance(seg2.v2);
        var ratio=Math.min(d1/d2, d2/d1);
        if (isNaN(ratio))
          ratio = 0.0;
        pairs.push(v);
        pairs.push(seg1);
        pairs.push(seg2);
        pairs.push(s1);
        pairs.push(s2);
        pairs.push((s1==0.0)==(s2==0.0) ? -1 : 1);
        pairs.push(ratio);
    }
    var glist=[];
    for (var i=0; i<pairs.length/PSLEN; i++) {
        glist.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }
    var klist1=[];
    for (var i=0; i<pairs.length/PSLEN; i++) {
        klist1.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }
    var klist2=[];
    for (var i=0; i<pairs.length/PSLEN; i++) {
        klist2.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }
    var gs=new Array(order);
    var df=3e-05;
    var err=0.0;
    if (pairs.length==0)
      return ;
    for (var si=0; si<steps; si++) {
        var i=0;
        var plen=pairs.length;
        if (isNaN(err)||isNaN(plen))
          break;
        if (si>0&&err/plen<0.1)
          break;
        var di=0;
        if (si%2) {
            di = -PSLEN*2;
            i = plen-PSLEN;
        }
        reset_edge_segs();
        err = 0.0;
        while (i<plen&&i>=0) {
          var cnum=Math.floor(i/PSLEN);
          var v=pairs[i++], seg1=pairs[i++], seg2=pairs[i++];
          var s1=pairs[i++], s2=pairs[i++], doflip=pairs[i++];
          var ratio=pairs[i++];
          i+=di;
          for (var ci=0; ci<2; ci++) {
              if (0&&seg2!=undefined&&ratio>0.1&&!(v.flag&CBREAK)) {
                  var sz1=seg1.ks[KSCALE], sz2=seg2.ks[KSCALE];
                  var i1=s1*(order-1), i2=s2*(order-1);
                  var k1=seg1.ks[i1], k2=seg2.ks[i2];
                  var k=((k1/sz1)+(k2/sz2*doflip))/2.0;
                  seg1.ks[i1] = seg1.ks[i1]+(k*sz1-seg1.ks[i1])*1;
                  seg2.ks[i2] = seg2.ks[i2]+(k*doflip*sz2-seg2.ks[i2])*1;
              }
              if (seg2!=undefined) {
                  var ta=seg1.derivative(s1, order), tb=seg2.derivative(s2, order);
                  if (doflip<0.0)
                    tb.negate();
                  ta.normalize();
                  tb.normalize();
                  var _d=Math.min(Math.max(ta.dot(tb), -1.0), 1.0);
                  var r=acos(_d);
                  
              }
              else {
                var h=seg1.handle(v);
                $tan_eM8h_solve.load(h).sub(v).normalize();
                if (v==seg1.v2)
                  $tan_eM8h_solve.negate();
                var ta=seg1.derivative(s1, order).normalize();
                var _d=Math.min(Math.max(ta.dot($tan_eM8h_solve), -1.0), 1.0);
                var r=acos(_d);
                
              }
              if (r<0.0001)
                continue;
              err+=r;
              var totgs=0.0;
              var gs=glist[cnum];
              var seglen=(seg2==undefined) ? 1 : 2;
              for (var sj=0; sj<seglen; sj++) {
                  var seg=sj ? seg2 : seg1;
                  for (var j=0; j<order; j++) {
                      var orig=seg.ks[j];
                      seg.ks[j]+=df;
                      if (seg2!=undefined) {
                          var ta=seg1.derivative(s1, order), tb=seg2.derivative(s2, order);
                          if (doflip<0.0)
                            tb.negate();
                          ta.normalize();
                          tb.normalize();
                          var _d=Math.min(Math.max(ta.dot(tb), -1.0), 1.0);
                          var r2=acos(_d);
                          
                      }
                      else {
                        var ta=seg1.derivative(s1, order).normalize();
                        var _d=Math.min(Math.max(ta.dot($tan_eM8h_solve), -1.0), 1.0);
                        var r2=acos(_d);
                        
                      }
                      var g=(r2-r)/df;
                      gs[sj*order+j] = g;
                      totgs+=g*g;
                      seg.ks[j] = orig;
                  }
              }
              if (totgs==0.0)
                continue;
              r/=totgs;
              var unstable=ratio<0.1;
              for (var sj=0; sj<seglen; sj++) {
                  var seg=sj ? seg2 : seg1;
                  for (var j=0; j<order; j++) {
                      var g=gs[sj*order+j];
                      if (order>2&&unstable&&(j==0||j==order-1)) {
                      }
                      seg.ks[j]+=-r*g*gk;
                  }
              }
              if (seg2!=undefined&&ratio>0.1&&!(v.flag&CBREAK)) {
                  var sz1=seg1.ks[KSCALE], sz2=seg2.ks[KSCALE];
                  var i1=s1*(order-1), i2=s2*(order-1);
                  var k1=seg1.ks[i1], k2=seg2.ks[i2];
                  var k=((k1/sz1)+(k2/sz2*doflip))/2.0;
                  seg1.ks[i1] = seg1.ks[i1]+(k*sz1-seg1.ks[i1])*1;
                  seg2.ks[i2] = seg2.ks[i2]+(k*doflip*sz2-seg2.ks[i2])*1;
              }
          }
        }
        for (var j=0; j<edge_segs.length; j++) {
            var seg=edge_segs[j];
            var ks=seg.ks;
            for (var k=0; k<ks.length; k++) {
                seg.ks[k] = seg._last_ks[k];
            }
        }
    }
  }
  solve = _es6_module.add_export('solve', solve);
}, '/dev/fairmotion/src/curve/solver_new.js');


es6_module_define('vectordraw_base', [], function _vectordraw_base_module(_es6_module) {
  "use strict";
  var VectorFlags={UPDATE: 2, 
   TAG: 4}
  VectorFlags = _es6_module.add_export('VectorFlags', VectorFlags);
  class VectorVertex extends Vector2 {
     constructor(co) {
      super(co);
    }
     loadSTRUCT(reader) {
      reader(this);
      this.load(this._vec);
      delete this._vec;
    }
  }
  _ESClass.register(VectorVertex);
  _es6_module.add_class(VectorVertex);
  VectorVertex = _es6_module.add_export('VectorVertex', VectorVertex);
  VectorVertex.STRUCT = `
VectorVertex {
  _vec : vec2;
}
`;
  class QuadBezPath  {
    
    
    
    
    
     constructor() {
      this.off = new Vector2();
      this.id = -1;
      this.z = undefined;
      this.blur = 0;
      this.size = [-1, -1];
      this.index = -1;
      this.matrix = new Matrix4();
      this.color = new Vector4();
      this.aabb = [new Vector2(), new Vector2()];
      this.clip_paths = new set();
      this.clip_users = new set();
    }
     add_clip_path(path) {
      if (!this.clip_paths.has(path)) {
          this.update();
      }
      path.clip_users.add(this);
      this.clip_paths.add(path);
    }
     reset_clip_paths() {
      if (this.clip_paths.length>0) {
      }
      for (var path of this.clip_paths) {
          path.clip_users.remove(this);
      }
      this.clip_paths.reset();
    }
     update_aabb(draw, fast_mode=false) {
      throw new Error("implement me!");
    }
     beginPath() {
      throw new Error("implement me");
    }
     undo() {
      throw new Error("implement me");
    }
     moveTo(x, y) {
      this.lastx = x;
      this.lasty = y;
      throw new Error("implement me");
    }
     makeLine(x1, y1, x2, y2, w=2.0) {
      let dx=y1-y2, dy=x2-x1;
      let l=Math.sqrt(dx*dx+dy*dy);
      if (l===0.0) {
          return ;
      }
      l = 0.5*w/l;
      dx*=l;
      dy*=l;
      this.moveTo(x1-dx, y1-dy);
      this.lineTo(x2-dx, y2-dy);
      this.lineTo(x2+dx, y2+dy);
      this.lineTo(x1+dx, y1+dy);
      this.lineTo(x1-dx, y1-dy);
    }
     bezierTo(x2, y2, x3, y3) {
      this.lastx = x3;
      this.lasty = y3;
      throw new Error("implement me");
    }
     cubicTo(x2, y2, x3, y3, x4, y4, subdiv=1) {
      var x1=this.lastx, y1=this.lasty;
      if (subdiv>0) {
          var dx1=(x2-x1)*0.5, dy1=(y2-y1)*0.5;
          var dx2=(x4-x3)*0.5, dy2=(y4-y3)*0.5;
          var dxmid=(x3+x4-x2-x1)*0.25;
          var dymid=(y3+y4-y2-y1)*0.25;
          var midx=(3*x3+x4+3*x2+x1)/8.0;
          var midy=(3*y3+y4+3*y2+y1)/8.0;
          this.cubicTo(x2+dx1, y2+dy1, midx-dxmid, midy-dymid, midx, midy, subdiv-1);
          this.cubicTo(midx+dxmid, midy+dymid, x4-dx2, y4-dy2, x4, y4, subdiv-1);
          return ;
      }
      var dx1=(x2-x1)*3.0, dy1=(y2-y1)*3.0;
      var dx2=(x4-x3)*3.0, dy2=(y4-y3)*3.0;
      var tdiv=(dx1*dy2-dx2*dy1);
      var t=(-(x1-x4)*dy2+(y1-y4)*dx2);
      var midx, midy;
      if (tdiv!==0.0) {
          t/=tdiv;
          midx = x1+dx1*t;
          midy = y1+dy1*t;
      }
      else {
        midx = (x2+x3)*0.5;
        midy = (y2+y3)*0.5;
      }
      this.bezierTo(midx, midy, x4, y4);
      this.lastx = x4;
      this.lasty = y4;
    }
     lineTo(x2, y2) {
      throw new Error("implement me");
      this.lastx = x2;
      this.lasty = y2;
    }
     destroy(draw) {

    }
     reset(draw) {
      this.pan.zero();
    }
     draw(draw, offx=0, offy=0) {

    }
     pushStroke(color, linewidth) {

    }
     pushFill() {

    }
     noAutoFill() {

    }
     update() {
      throw new Error("implement me!");
    }
     [Symbol.keystr]() {
      return this.id;
    }
  }
  _ESClass.register(QuadBezPath);
  _es6_module.add_class(QuadBezPath);
  QuadBezPath = _es6_module.add_export('QuadBezPath', QuadBezPath);
  var pop_transform_rets=new cachering(function () {
    return new Matrix4();
  }, 32);
  class VectorDraw  {
    
    
    
    
     constructor() {
      this.pan = new Vector2();
      this.do_blur = true;
      this.matstack = new Array(256);
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
      this.matrix = new Matrix4();
    }
     recalcAll() {
      this.regen = true;
    }
     clear() {

    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      throw new Error("implement me");
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      throw new Error("implement me");
    }
     remove(path) {
      for (var path2 of path.clip_users) {
          path2.clip_paths.remove(path);
          path2.update();
      }
      delete this.path_idmap[path.id];
      this.paths.remove(path);
      path.destroy(this);
    }
     update() {
      throw new Error("implement me");
    }
     destroy() {
      throw new Error("implement me");
    }
     draw() {
      throw new Error("implement me");
    }
     push_transform(mat, multiply_instead_of_load=true) {
      this.matstack[this.matstack.cur++].load(this.matrix);
      if (mat!=undefined&&multiply_instead_of_load) {
          this.matrix.multiply(mat);
      }
      else 
        if (mat!=undefined) {
          this.matrix.load(mat);
      }
    }
     pop_transform() {
      var ret=pop_transform_rets.next();
      ret.load(this.matrix);
      this.matrix.load(this.matstack[--this.matstack.cur]);
      return ret;
    }
     translate(x, y) {
      this.matrix.translate(x, y);
    }
     scale(x, y) {
      this.matrix.scale(x, y, 1.0);
    }
     rotate(th) {
      this.matrix.euler_rotate(0, 0, th);
    }
     set_matrix(matrix) {
      this.matrix.load(matrix);
    }
     get_matrix() {
      return this.matrix;
    }
  }
  _ESClass.register(VectorDraw);
  _es6_module.add_class(VectorDraw);
  VectorDraw = _es6_module.add_export('VectorDraw', VectorDraw);
}, '/dev/fairmotion/src/vectordraw/vectordraw_base.js');


es6_module_define('vectordraw_canvas2d', ["./vectordraw_base.js", "./vectordraw_jobs.js", "../config/config.js", "../util/mathlib.js", "../path.ux/scripts/util/math.js", "./vectordraw_jobs_base.js", "../path.ux/scripts/util/util.js"], function _vectordraw_canvas2d_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  var util=es6_import(_es6_module, '../path.ux/scripts/util/util.js');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var math=es6_import(_es6_module, '../path.ux/scripts/util/math.js');
  var VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorVertex');
  var QuadBezPath=es6_import_item(_es6_module, './vectordraw_base.js', 'QuadBezPath');
  var VectorDraw=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorDraw');
  var OPCODES=es6_import_item(_es6_module, './vectordraw_jobs_base.js', 'OPCODES');
  var vectordraw_jobs=es6_import(_es6_module, './vectordraw_jobs.js');
  let debug=0;
  var canvaspath_draw_mat_tmps=new cachering(function () {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(16);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function () {
    return new Vector2();
  }, 32);
  let MOVETO=OPCODES.MOVETO, BEZIERTO=OPCODES.QUADRATIC, LINETO=OPCODES.LINETO, BEGINPATH=OPCODES.BEGINPATH, CUBICTO=OPCODES.CUBIC, CLOSEPATH=OPCODES.CLOSEPATH, LINEWIDTH=OPCODES.LINEWIDTH, LINESTYLE=OPCODES.LINESTYLE, STROKE=OPCODES.STROKE, FILL=OPCODES.FILL;
  let arglens={}
  arglens[FILL] = 0;
  arglens[STROKE] = 0;
  arglens[LINEWIDTH] = 1;
  arglens[LINESTYLE] = 4;
  arglens[BEGINPATH] = 0;
  arglens[CLOSEPATH] = 0;
  arglens[MOVETO] = 2;
  arglens[LINETO] = 2;
  arglens[BEZIERTO] = 4;
  arglens[CUBICTO] = 6;
  let render_idgen=1;
  let batch_iden=1;
  class Batch  {
    
    
    
    
    
    
    
    
    
    
     constructor() {
      this._batch_id = batch_iden++;
      this.generation = 0;
      this.isBlurBatch = false;
      this.dpi_scale = 1.0;
      this.paths = [];
      this.path_idmap = {};
      this.regen = 1;
      this.gen_req = 0;
      this._last_pan = new Vector2();
      this.viewport = {pos: [0, 0], 
     size: [1, 1]};
      this.realViewport = {pos: [0, 0], 
     size: [1, 1]};
      this.patharea = 0;
    }
    set  regen(v) {
      this._regen = v;
      if (debug&&v) {
          console.warn("Regen called");
      }
    }
    get  regen() {
      return this._regen;
    }
     add(p) {
      if (this.has(p)) {
          return ;
      }
      this.generation = 0;
      let draw={matrix: new Matrix4()};
      p.update_aabb(draw);
      let min=p.aabb[0], max=p.aabb[1];
      if (p.blur>0) {
          min.addScalar(-p.blur*0.5);
          max.addScalar(p.blur*0.5);
      }
      let w=max[0]-min[0];
      let h=max[1]-min[1];
      this.patharea+=w*h;
      p._batch = this;
      this.regen = 1;
      if (!p._batch_id) {
          p._batch_id = batch_iden++;
      }
      this.path_idmap[p._batch_id] = p;
      this.paths.push(p);
    }
     remove(p) {
      p._batch = undefined;
      if (!this.has(p)) {
          return ;
      }
      this.regen = 1;
      p._batch = undefined;
      this.paths.remove(p);
      delete this.path_idmap[p._batch_id];
      return this;
    }
     destroy() {
      this.patharea = 0;
      if (window._DEBUG.drawbatches) {
          console.warn("destroying batch", this.length);
      }
      for (let p of this.paths) {
          p._batch = undefined;
      }
      this.paths.length = 0;
      this.path_idmap = {};
      this.regen = 1;
      this.gen_req = 0;
    }
     has(p) {
      if (!p._batch_id)
        return false;
      return p._batch_id in this.path_idmap;
    }
     checkViewport(draw) {
      let canvas=draw.canvas;
      let p=new Vector2(draw.pan);
      p[1] = draw.canvas.height-p[1];
      p.sub(this._last_pan);
      let cv={pos: new Vector2(), 
     size: new Vector2([canvas.width, canvas.height])};
      cv.pos[0]-=p[0];
      cv.pos[1]-=p[1];
      let clip1=math.aabb_intersect_2d(this.viewport.pos, this.viewport.size, cv.pos, cv.size);
      let clip2=math.aabb_intersect_2d(this.realViewport.pos, this.realViewport.size, cv.pos, cv.size);
      const debug=0;
      if (debug) {
          console.log("\n===\n");
          console.log("dpan:", p);
          console.log(cv.pos, cv.size);
          if (clip1)
            console.log("clip1", clip1.pos, clip1.size);
          if (clip2)
            console.log("clip2", clip2.pos, clip2.size);
      }
      if (!clip1||!clip2) {
          if (debug) {
              console.log("clip is bad 1:", clip1, clip2, !!clip1!==!!clip2);
          }
          return !!clip1!==!!clip2;
      }
      clip1.pos.floor();
      clip1.size.floor();
      clip2.pos.floor();
      clip2.size.floor();
      let bad=clip1.pos.vectorDistance(clip2.pos)>2;
      bad = bad||clip1.size.vectorDistance(clip2.size)>2;
      if (debug) {
          console.log("clip is bad 2:", bad);
      }
      return bad;
    }
     _getPaddedViewport(canvas, cpad=512) {
      let dpi_scale=canvas.dpi_scale*this.dpi_scale;
      cpad/=dpi_scale;
      return {pos: new Vector2([-cpad, -cpad]), 
     size: new Vector2([canvas.width*canvas.dpi_scale+cpad*2, canvas.height*canvas.dpi_scale+cpad*2])}
    }
     gen(draw) {
      if (this.gen_req-->0) {
          return ;
      }
      this.gen_req = 10;
      this.regen = false;
      if (this.isBlurBatch) {
          let matrix=new Matrix4(draw.matrix);
          matrix.scale(this.dpi_scale, this.dpi_scale);
          draw.push_transform(matrix, false);
      }
      let canvas=draw.canvas, g=draw.g;
      if (debug)
        console.warn("generating batch of size "+this.paths.length);
      let ok=false;
      let min=new Vector2([1e+17, 1e+17]);
      let max=new Vector2([-1e+17, -1e+17]);
      let startmat=new Matrix4(draw.matrix);
      let zoom=draw.matrix.$matrix.m11;
      function setMat(p, set_off) {
        if (set_off===undefined) {
            set_off = false;
        }
        let mat=new Matrix4();
        if (set_off) {
            mat.translate(-min[0], -min[1], 0.0);
        }
        let m=new Matrix4(draw.matrix);
        mat.multiply(m);
        draw.push_transform(mat, false);
        return mat;
      }
      for (let p of this.paths) {
          let mat=setMat(p);
          p.update_aabb(draw);
          draw.pop_transform();
          min.min(p.aabb[0]);
          max.max(p.aabb[1]);
      }
      this.realViewport = {pos: new Vector2(min), 
     size: new Vector2(max).sub(min)};
      let min2=new Vector2(min);
      let size2=new Vector2(max);
      size2.sub(min2);
      let cpad=512;
      let cv=this._getPaddedViewport(canvas, cpad);
      let box=math.aabb_intersect_2d(min2, size2, cv.pos, cv.size);
      min2 = min2.floor();
      size2 = size2.floor();
      if (!box) {
          if (this.isBlurBatch) {
              draw.pop_transform();
          }
          return ;
      }
      min.load(box.pos);
      max.load(min).add(box.size);
      this.viewport = {pos: new Vector2(box.pos), 
     size: new Vector2(box.size)};
      let width=~~(max[0]-min[0]);
      let height=~~(max[1]-min[1]);
      let commands=[width, height];
      for (let p of this.paths) {
          setMat(p, true);
          p.gen(draw);
          let c2=p._commands;
          draw.pop_transform();
          for (let i=0; i<c2.length; i++) {
              commands.push(c2[i]);
          }
      }
      if (this.isBlurBatch) {
          draw.pop_transform();
      }
      let renderid=render_idgen++;
      if (commands.length===0) {
          this.gen_req = 0;
          return ;
      }
      commands = new Float64Array(commands);
      min = new Vector2(min);
      let last_pan=new Vector2(draw.pan);
      last_pan[1] = draw.canvas.height-last_pan[1];
      this.pending = true;
      vectordraw_jobs.manager.postRenderJob(renderid, commands).then((data) =>        {
        this.pending = false;
        if (this.onRenderDone) {
            this.onRenderDone(this);
        }
        if (debug)
          console.warn("Got render result!");
        this.gen_req = 0;
        this._last_pan.load(last_pan);
        this._image = data;
        this._image_off = min;
        this._draw_zoom = zoom;
        window.redraw_viewport();
      });
    }
     draw(draw) {
      if (this.paths.length===0) {
          return ;
      }
      if (!this.regen&&this.checkViewport(draw)&&!this.gen_req) {
          this.regen = 1;
          console.log("bad viewport");
      }
      let canvas=draw.canvas, g=draw.g;
      var zoom=draw.matrix.$matrix.m11;
      let offx=0, offy=0;
      let scale=zoom/this._draw_zoom;
      offx = draw.pan[0]-this._last_pan[0]*scale;
      offy = (draw.canvas.height-draw.pan[1])-this._last_pan[1]*scale;
      offx/=scale;
      offy/=scale;
      if (this.regen) {
          this.pending = true;
          this.gen(draw);
      }
      if (this._image===undefined) {
          return ;
      }
      g.imageSmoothingEnabled = !!this.isBlurBatch;
      if (this.paths.length===0&&this.generation>2) {
          this._image = undefined;
          return ;
      }
      if (this.generation>0) {
          this.generation++;
      }
      g.save();
      g.scale(scale, scale);
      g.translate(offx, offy);
      g.translate(this._image_off[0], this._image_off[1]);
      g.drawImage(this._image, 0, 0);
      g.restore();
    }
  }
  _ESClass.register(Batch);
  _es6_module.add_class(Batch);
  Batch = _es6_module.add_export('Batch', Batch);
  let canvaspath_temp_vs=util.cachering.fromConstructor(Vector2, 512);
  let canvaspath_temp_mats=util.cachering.fromConstructor(Matrix4, 128);
  class CanvasPath extends QuadBezPath {
    
    
    
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.z = 0;
      this.nofill = false;
      this.dead = false;
      this.commands = [];
      this.recalc = 1;
      this.stroke_extra = 0;
      this._render_id = render_idgen++;
      this._image = undefined;
      this._image_off = [0, 0];
      this.lastx = 0;
      this.lasty = 0;
      this._aabb2 = [new Vector2(), new Vector2()];
      this._size2 = new Vector2();
      this.canvas = undefined;
      this.g = undefined;
      this.path_start_i = 2;
      this.first = true;
      this._mm = new MinMax(2);
    }
     pushFill() {
      this._pushCmd(FILL);
    }
     pushStroke(color, width) {
      if (color) {
          let a=color.length>3 ? color[3] : 1.0;
          this._pushCmd(LINESTYLE, ~~(color[0]*255), ~~(color[1]*255), ~~(color[2]*255), a);
      }
      if (width!==undefined) {
          this.stroke_extra = Math.max(this.stroke_extra, width);
          this._pushCmd(LINEWIDTH, width);
      }
      this._pushCmd(STROKE);
    }
     noAutoFill() {
      this.nofill = true;
    }
     update_aabb(draw, fast_mode=false) {
      var tmp=canvaspath_temp_vs.next().zero();
      var mm=this._mm;
      var pad=this.pad = this.blur>0 ? this.blur+15 : 0;
      pad+=this.stroke_extra*3;
      mm.reset();
      if (fast_mode) {
          console.trace("FAST MODE!");
      }
      var prev=-1;
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=arglens[cmd];
        if (fast_mode&&prev!==BEGINPATH) {
            prev = cmd;
            i+=arglen;
            continue;
        }
        for (var j=0; j<arglen; j+=2) {
            tmp[0] = cs[i++];
            tmp[1] = cs[i++];
            if (isNaN(tmp.dot(tmp))) {
                console.warn("NaN!");
                continue;
            }
            tmp.multVecMatrix(draw.matrix);
            mm.minmax(tmp);
        }
        prev = cmd;
      }
      this.aabb[0].load(mm.min).subScalar(pad);
      this.aabb[1].load(mm.max).addScalar(pad);
      this.aabb[0].floor();
      this.aabb[1].ceil();
    }
     beginPath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(BEGINPATH);
    }
     closePath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(CLOSEPATH);
    }
     undo() {
      this.commands.length = this.path_start_i;
    }
     _pushCmd() {
      let arglen=arguments.length;
      for (let i=0; i<arglen; i++) {
          if (isNaN(arguments[i])) {
              console.warn("NaN!");
          }
          let arg=arguments[i];
          this.commands.push(arg);
      }
      this.recalc = 1;
      this.first = false;
    }
     moveTo(x, y) {
      this._pushCmd(MOVETO, x, y);
      this.lastx = x;
      this.lasty = y;
    }
     cubicTo(x2, y2, x3, y3, x4, y4) {
      this._pushCmd(CUBICTO, x2, y2, x3, y3, x4, y4);
      this.lastx = x4;
      this.lasty = y4;
    }
     bezierTo(x2, y2, x3, y3) {
      this._pushCmd(BEZIERTO, x2, y2, x3, y3);
      this.lastx = x3;
      this.lasty = y3;
    }
     lineTo(x2, y2) {
      if (this.first) {
          this.moveTo(x2, y2);
          return ;
      }
      this._pushCmd(LINETO, x2, y2);
      this.lastx = x2;
      this.lasty = y2;
    }
     destroy(draw) {
      if (this._batch) {
          this._batch.remove(this);
      }
      this.canvas = this.g = undefined;
      this._image = this.commands = undefined;
    }
     genInto(draw, path, commands, clip_mode=false) {
      let oldc=this.canvas, oldg=this.g, oldaabb=this.aabb, oldsize=this.size;
      this.aabb = this._aabb2;
      this.aabb[0].load(path.aabb[0]);
      this.aabb[1].load(path.aabb[1]);
      this.size = this._size2;
      this.size.load(path.size);
      this.gen_commands(draw, commands, undefined, true);
      this.canvas = oldc;
      this.g = oldg;
      this.aabb = oldaabb;
      this.size = oldsize;
    }
     gen_commands(draw, commands, _check_tag=0, clip_mode=false) {
      let m=this.matrix.$matrix;
      let r=~~(this.color[0]*255), g=~~(this.color[1]*255), b=~~(this.color[2]*255), a=this.color[3];
      let commands2=[];
      if (!clip_mode) {
          commands2 = commands2.concat([OPCODES.FILLSTYLE, r, g, b, a]);
          commands2 = commands2.concat([OPCODES.SETBLUR, this.blur]);
      }
      commands2.push(OPCODES.BEGINPATH);
      commands2 = commands2.concat(this.commands);
      if (clip_mode) {
          commands2.push(OPCODES.CLIP);
      }
      else 
        if (!this.nofill) {
          commands2.push(OPCODES.FILL);
      }
      for (let c of commands2) {
          commands.push(c);
      }
      return commands;
    }
     round(matrix) {
      let co=new Vector2();
      let imat=new Matrix4(matrix);
      imat.invert();
      let cs=this.commands;
      for (let i=0; i<cs.length; i+=cs[i+1]) {
          let cmd=cs[i];
          if (cmd!==LINETO&&cmd!==MOVETO&&cmd!==CUBICTO&&cmd!==BEZIERTO) {
              continue;
          }
          let arglen=arglens[cmd];
          for (let j=0; j<arglen; j+=2) {
              let j2=i+1+j;
              let d=1.0;
              if (j2>=cs.length-1||j+1>=arglen) {
                  break;
              }
              co[0] = cs[j2];
              co[1] = cs[j2+1];
              co.multVecMatrix(matrix);
              co.mulScalar(d);
              co.addScalar(0.5);
              co.floor();
              co.mulScalar(1.0/d);
              co.multVecMatrix(imat);
              cs[j2] = co[0];
              cs[j2+1] = co[1];
          }
      }
    }
     gen(draw, _check_tag=0, clip_mode=false, independent=false) {
      if (_check_tag&&!this.recalc) {
          console.log("infinite loop in clip stack");
          return ;
      }
      this.recalc = 0;
      var do_clip=this.clip_paths.length>0;
      var do_blur=this.blur>0.0;
      var zoom=draw.matrix.$matrix.m11;
      this.update_aabb(draw);
      var w=this.size[0] = Math.ceil(this.aabb[1][0]-this.aabb[0][0]);
      var h=this.size[1] = Math.ceil(this.aabb[1][1]-this.aabb[0][1]);
      if (w>config.MAX_CANVAS2D_VECTOR_CACHE_SIZE||h>config.MAX_CANVAS2D_VECTOR_CACHE_SIZE) {
          var w2=Math.min(w, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
          var h2=Math.min(h, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
          var dw=w-w2, dh=h-h2;
          this.aabb[0][0]+=dw*0.5;
          this.aabb[0][1]+=dh*0.5;
          this.aabb[1][0]-=dw*0.5;
          this.aabb[1][1]-=dh*0.5;
          this.size[0] = w2;
          this.size[1] = h2;
          w = w2, h = h2;
      }
      if (1) {
          var mat=canvaspath_draw_mat_tmps.next();
          mat.load(draw.matrix);
          this.matrix = mat;
      }
      if (isNaN(w)||isNaN(h)) {
          console.log("NaN path size", w, h, this);
          if (isNaN(w))
            w = 4.0;
          if (isNaN(h))
            h = 4.0;
      }
      let commands2=independent ? [w, h] : [];
      let m=this.matrix.$matrix;
      commands2 = commands2.concat([OPCODES.SETTRANSFORM, m.m11, m.m12, m.m21, m.m22, m.m41, m.m42]);
      commands2.push(OPCODES.SAVE);
      for (var path of this.clip_paths) {
          if (path.recalc) {
              if (debug)
                console.log("   clipping subgen!");
              path.gen(draw, 1);
          }
          let oldc=path.canvas, oldg=path.g, oldaabb=path.aabb, oldsize=path.size;
          path.genInto(draw, this, commands2, true);
      }
      this.gen_commands(draw, commands2, _check_tag, clip_mode);
      commands2.push(OPCODES.RESTORE);
      this._commands = commands2;
    }
     reset(draw) {
      this.stroke_extra = 0;
      this.commands.length = 0;
      this.path_start_i = 0;
      this.off.zero();
      this.first = true;
    }
     draw(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g) {
      offx+=this.off[0], offy+=this.off[1];
      if (this.recalc) {
          this.recalc = 0;
          this.gen(draw);
      }
      if (this._image===undefined) {
          return ;
      }
      g.imageSmoothingEnabled = false;
      g.drawImage(this._image, this._image_off[0]+offx, this._image_off[1]+offy);
      g.beginPath();
      g.rect(this._image_off[0]+offx, this._image_off[1]+offy, this._image.width, this._image.height);
      g.rect(this._image_off[0]+offx, this._image_off[1]+offy, this._image.width, this._image.height);
      g.fillStyle = "rgba(0,255,0,0.4)";
      g.fill();
    }
     update() {
      this.recalc = 1;
    }
  }
  _ESClass.register(CanvasPath);
  _es6_module.add_class(CanvasPath);
  CanvasPath = _es6_module.add_export('CanvasPath', CanvasPath);
  class Batches extends Array {
    
     constructor() {
      super();
      this.cur = 0;
      this.drawlist = [];
    }
     getHead(onBatchDone) {
      if (this.drawlist.length>0) {
          return this.drawlist[this.drawlist.length-1];
      }
      return this.requestBatch(onBatchDone);
    }
     requestBatch(onrenderdone) {
      let ret;
      if (this.cur<this.length) {
          this.drawlist.push(this[this.cur]);
          ret = this[this.cur++];
      }
      else {
        let b=new Batch();
        b.onRenderDone = onrenderdone;
        this.cur++;
        this.push(b);
        this.drawlist.push(this[this.length-1]);
        ret = this[this.length-1];
      }
      ret.isBlurBatch = false;
      return ret;
    }
     remove(batch) {
      let i=this.indexOf(batch);
      this.drawlist.remove(batch);
      if (this.cur>0&&this.cur<this.length-1) {
          let j=this.cur-1;
          this[i] = this[j];
          this.cur--;
      }
    }
     destroy() {
      this.drawlist.length = 0;
      this.cur = 0;
      if (debug)
        console.log("destroy batches");
      for (let b of list(this)) {
          if (b.generation>1) {
              super.remove(b);
          }
          b.generation++;
          b.destroy();
      }
    }
  }
  _ESClass.register(Batches);
  _es6_module.add_class(Batches);
  Batches = _es6_module.add_export('Batches', Batches);
  class CanvasDraw2D extends VectorDraw {
    
    
    
    
    
    
     constructor() {
      super();
      this.promise = undefined;
      this.on_batches_finish = undefined;
      this.paths = [];
      this.path_idmap = {};
      this.dosort = true;
      this.matstack = new Array(256);
      this.matrix = new Matrix4();
      this._last_pan = new Vector2();
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
      this.canvas = undefined;
      this.g = undefined;
      this.batches = new Batches();
      this.onBatchDone = this.onBatchDone.bind(this);
    }
     onBatchDone(batch) {
      let ok=true;
      for (let b of this.batches.drawlist) {
          if (b.pending) {
              ok = false;
          }
      }
      if (ok&&this.promise) {
          this.promise = undefined;
          this.on_batches_finish();
      }
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          return false;
      }
      var path=this.path_idmap[id];
      return check_z ? path.z===z : true;
    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          this.path_idmap[id] = new CanvasPath();
          this.path_idmap[id].index = this.paths.length;
          this.path_idmap[id].id = id;
          this.paths.push(this.path_idmap[id]);
      }
      var ret=this.path_idmap[id];
      if (check_z&&ret.z!==z) {
          this.dosort = 1;
          ret.z = z;
      }
      return ret;
    }
     update() {
      for (var path of this.paths) {
          path.update(this);
      }
    }
     destroy() {
      this.batches.destroy();
      for (var path of this.paths) {
          path.destroy(this);
      }
    }
    set  regen(v) {
      this.__regen = v;
    }
    get  regen() {
      return this.__regen;
    }
     clear() {
      this.recalcAll();
    }
     draw(g) {
      if (!!this.do_blur!==!!this._last_do_blur) {
          this._last_do_blur = !!this.do_blur;
          this.regen = 1;
          window.setTimeout(() =>            {
            window.redraw_viewport();
          }, 200);
      }
      if (this.regen) {
          if (window._DEBUG.trace_recalc_all) {
              console.log("RECALC ALL");
          }
          this.__regen = 0;
          this.batches.destroy();
          this.update();
      }
      let batch;
      let blimit=this.paths.length<15 ? 15 : Math.ceil(this.paths.length/vectordraw_jobs.manager.max_threads);
      batch = this.batches.getHead(this.onBatchDone);
      var canvas=g.canvas;
      var off=canvaspath_draw_vs.next();
      let zoom=this.matrix.$matrix.m11;
      off.zero();
      this._last_pan.load(this.pan);
      if (this._last_zoom!==zoom) {
          this._last_zoom = zoom;
          for (let p of this.paths) {
              p.recalc = 1;
          }
      }
      for (var path of this.paths) {
          if (!path.recalc) {
              continue;
          }
          for (var path2 of path.clip_users) {
              path2.recalc = 1;
          }
      }
      for (var path of this.paths) {
          if (!path.recalc) {
              path.off.add(off);
          }
      }
      this.canvas = canvas;
      this.g = g;
      if (this.dosort) {
          if (debug)
            console.log("SORT");
          this.batches.destroy();
          this.dosort = 0;
          for (let p of this.paths) {
              p._batch = undefined;
          }
          this.paths.sort(function (a, b) {
            return a.z-b.z;
          });
          batch = this.batches.getHead(this.onBatchDone);
      }
      for (var path of this.paths) {
          if (path.hidden) {
              if (path._batch) {
                  path._batch.remove(path);
              }
              continue;
          }
          let blurlimit=25;
          let needsblur=this.do_blur&&(path.blur*zoom>=blurlimit);
          needsblur = needsblur&&path.clip_paths.length===0;
          if (needsblur&&path._batch&&!path._batch.isBlurBatch) {
              this.regen = 1;
          }
          if (!needsblur&&path._batch&&path._batch.isBlurBatch) {
              this.regen = 1;
          }
          if (!path._batch) {
              let w1=batch.patharea/(canvas.width*canvas.height);
              let w2=this.batches.length>10 ? 1.0/(this.batches.length-9) : 0.0;
              if (needsblur) {
                  if (!batch.isBlurBatch) {
                      batch = this.batches.requestBatch(this.onBatchDone);
                      batch.isBlurBatch = true;
                      batch.dpi_scale = path.blur*zoom>50 ? 0.1 : 0.25;
                  }
                  else {
                    let scale=path.blur*zoom>50 ? 0.1 : 0.25;
                    batch.dpi_scale = Math.min(batch.dpi_scale, scale);
                  }
              }
              else 
                if (batch.isBlurBatch||(batch.paths.length*(1.0+w1*4.0)>blimit)) {
                  batch = this.batches.requestBatch(this.onBatchDone);
              }
              batch.add(path);
          }
          if (path.recalc&&path._batch) {
              path._batch.regen = 1;
              path.recalc = 0;
          }
          window.path1 = path;
      }
      window.batch = batch;
      window.batches = this.batches;
      for (let batch of this.batches.drawlist) {
          batch.draw(this);
      }
      if (!this.promise) {
          this.promise = new Promise((accept, reject) =>            {
            this.on_batches_finish = accept;
          });
      }
      let ok=true;
      for (let b of this.batches) {
          if (b.pending) {
              ok = false;
          }
      }
      if (ok) {
          window.setTimeout(() =>            {
            this.onBatchDone();
          });
      }
      return this.promise;
    }
     set_matrix(matrix) {
      super.set_matrix(matrix);
    }
  }
  _ESClass.register(CanvasDraw2D);
  _es6_module.add_class(CanvasDraw2D);
  CanvasDraw2D = _es6_module.add_export('CanvasDraw2D', CanvasDraw2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_canvas2d.js');


es6_module_define('vectordraw_stub', ["../config/config.js", "./vectordraw_base.js", "../util/mathlib.js"], function _vectordraw_stub_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorVertex');
  var QuadBezPath=es6_import_item(_es6_module, './vectordraw_base.js', 'QuadBezPath');
  var VectorDraw=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorDraw');
  var canvaspath_draw_mat_tmps=new cachering((_) =>    {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(8);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function () {
    return new Vector2();
  }, 32);
  var CCMD=0, CARGLEN=1;
  var MOVETO=0, BEZIERTO=1, LINETO=2, BEGINPATH=3;
  var NS="http://www.w3.org/2000/svg";
  var XLS="http://www.w3.org/1999/xlink";
  function makeElement(type, attrs) {
    if (attrs===undefined) {
        attrs = {};
    }
    var ret=document.createElementNS(NS, type);
    for (var k in attrs) {
        ret.setAttributeNS(null, k, attrs[k]);
    }
    return ret;
  }
  makeElement = _es6_module.add_export('makeElement', makeElement);
  class StubCanvasPath extends QuadBezPath {
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.commands = [];
      this.recalc = 1;
      this.lastx = 0;
      this.lasty = 0;
      this._last_z = undefined;
      this._last_off = new Vector2();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.domnode = undefined;
      this.filternode = undefined;
      this.clip_users = new set();
      this.path_start_i = 0;
      this.first = true;
      this._mm = new MinMax(2);
    }
     update_aabb(draw, fast_mode=false) {
      var tmp=new Vector2();
      var mm=this._mm;
      var pad=this.pad = this.blur>0 ? this.blur*draw.zoom+15 : 0;
      mm.reset();
      if (fast_mode) {
          console.trace("FAST MODE!");
      }
      var prev=-1;
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=cs[i++];
        if (fast_mode&&prev!=BEGINPATH) {
            prev = cmd;
            i+=arglen;
            continue;
        }
        for (var j=0; j<arglen; j+=2) {
            tmp[0] = cs[i++], tmp[1] = cs[i++];
            tmp.multVecMatrix(draw.matrix);
            mm.minmax(tmp);
        }
        prev = cmd;
      }
      this.aabb[0].load(mm.min).subScalar(pad);
      this.aabb[1].load(mm.max).addScalar(pad);
    }
     beginPath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(BEGINPATH);
    }
     undo() {
      this.commands.length = this.path_start_i;
    }
     _pushCmd() {
      var arglen=arguments.length-1;
      this.commands.push(arguments[0]);
      this.commands.push(arglen);
      for (var i=0; i<arglen; i++) {
          this.commands.push(arguments[i+1]);
      }
      this.recalc = 1;
      this.first = false;
    }
     moveTo(x, y) {
      this._pushCmd(MOVETO, x, y);
      this.lastx = x;
      this.lasty = y;
    }
     bezierTo(x2, y2, x3, y3) {
      this._pushCmd(BEZIERTO, x2, y2, x3, y3);
      this.lastx = x3;
      this.lasty = y3;
    }
     lineTo(x2, y2) {
      if (this.first) {
          this.moveTo(x2, y2);
          return ;
      }
      this._pushCmd(LINETO, x2, y2);
      this.lastx = x2;
      this.lasty = y2;
    }
     destroy(draw) {

    }
     gen(draw, _check_tag=0) {

    }
     reset(draw) {
      this.commands.length = 0;
      this.path_start_i = 0;
      this.off.zero();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.first = true;
    }
     draw(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g) {

    }
     update() {
      this.recalc = 1;
    }
  }
  _ESClass.register(StubCanvasPath);
  _es6_module.add_class(StubCanvasPath);
  StubCanvasPath = _es6_module.add_export('StubCanvasPath', StubCanvasPath);
  class StubCanvasDraw2D extends VectorDraw {
    
    
    
    
     constructor() {
      super();
      this.paths = [];
      this.path_idmap = {};
      this.dosort = true;
      this.matstack = new Array(256);
      this.matrix = new Matrix4();
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
    }
    static  get_canvas(id, width, height, zindex) {
      var ret=document.getElementById(id);
      if (ret==undefined) {
          ret = document.createElement("canvas");
          ret.id = id;
      }
      ret.width = width;
      ret.height = height;
      if (ret.style!=undefined) {
          ret.style["z-index"] = zindex;
      }
      return ret;
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          return false;
      }
      var path=this.path_idmap[id];
      return check_z ? path.z==z : true;
    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          this.path_idmap[id] = new StubCanvasPath();
          this.path_idmap[id].index = this.paths.length;
          this.path_idmap[id].id = id;
          this.dosort = 1;
          this.paths.push(this.path_idmap[id]);
      }
      var ret=this.path_idmap[id];
      if (check_z&&ret.z!=z) {
          this.dosort = 1;
          ret.z = z;
      }
      return ret;
    }
     update() {

    }
    static  kill_canvas(svg) {

    }
     destroy() {

    }
     draw(g) {
      var canvas=g.canvas;
      canvas.style["background"] = "rgba(0,0,0,0)";
      this.canvas = canvas;
      this.g = g;
    }
     set_matrix(matrix) {
      super.set_matrix(matrix);
      this.zoom = matrix.$matrix.m11;
    }
  }
  _ESClass.register(StubCanvasDraw2D);
  _es6_module.add_class(StubCanvasDraw2D);
  StubCanvasDraw2D = _es6_module.add_export('StubCanvasDraw2D', StubCanvasDraw2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_stub.js');


es6_module_define('vectordraw_canvas2d_simple', ["../config/config.js", "./vectordraw_base.js", "../util/mathlib.js"], function _vectordraw_canvas2d_simple_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorVertex');
  var QuadBezPath=es6_import_item(_es6_module, './vectordraw_base.js', 'QuadBezPath');
  var VectorDraw=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorDraw');
  var debug=0;
  window._setDebug = (d) =>    {
    debug = d;
  }
  var canvaspath_draw_mat_tmps=new cachering((_) =>    {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(8);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function () {
    return new Vector2();
  }, 32);
  var CCMD=0, CARGLEN=1;
  var MOVETO=0, BEZIERTO=1, LINETO=2, BEGINPATH=3, CUBICTO=4, STROKE=5, STROKECOLOR=6, STROKEWIDTH=7, NOFILL=8, FILL=9;
  var NS="http://www.w3.org/2000/svg";
  var XLS="http://www.w3.org/1999/xlink";
  function makeElement(type, attrs) {
    if (attrs===undefined) {
        attrs = {};
    }
    var ret=document.createElementNS(NS, type);
    for (var k in attrs) {
        ret.setAttributeNS(null, k, attrs[k]);
    }
    return ret;
  }
  makeElement = _es6_module.add_export('makeElement', makeElement);
  let lasttime=performance.now();
  class SimpleCanvasPath extends QuadBezPath {
    
    
    
    
    
    
    
    
     constructor(matrix) {
      super();
      this.commands = [];
      this.recalc = 1;
      this.matrix = matrix;
      this.lastx = 0;
      this.lasty = 0;
      this._last_z = undefined;
      this._last_off = new Vector2();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.domnode = undefined;
      this.filternode = undefined;
      this.clip_users = new set();
      this.path_start_i = 0;
      this.first = true;
      this._mm = new MinMax(2);
    }
     update_aabb(draw, fast_mode=false) {
      var tmp=new Vector2();
      var mm=this._mm;
      var pad=this.pad = this.blur>0 ? this.blur*draw.zoom+15 : 0;
      mm.reset();
      if (fast_mode) {
          console.trace("FAST MODE!");
      }
      var prev=-1;
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=cs[i++];
        if (fast_mode&&prev!==BEGINPATH) {
            prev = cmd;
            i+=arglen;
            continue;
        }
        if (cmd!==LINETO&&cmd!==MOVETO&&cmd!==CUBICTO&&cmd!==BEZIERTO) {
            prev = cmd;
            continue;
        }
        for (var j=0; j<arglen; j+=2) {
            tmp[0] = cs[i++], tmp[1] = cs[i++];
            tmp.multVecMatrix(draw.matrix);
            mm.minmax(tmp);
        }
        prev = cmd;
      }
      this.aabb[0].load(mm.min).subScalar(pad);
      this.aabb[1].load(mm.max).addScalar(pad);
    }
     beginPath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(BEGINPATH);
    }
     undo() {
      this.commands.length = this.path_start_i;
    }
     _pushCmd() {
      var arglen=arguments.length-1;
      this.commands.push(arguments[0]);
      this.commands.push(arglen);
      for (var i=0; i<arglen; i++) {
          this.commands.push(arguments[i+1]);
      }
      this.recalc = 1;
      this.first = false;
    }
     moveTo(x, y) {
      this._pushCmd(MOVETO, x, y);
      this.lastx = x;
      this.lasty = y;
    }
     cubicTo(x2, y2, x3, y3, x4, y4) {
      this._pushCmd(CUBICTO, x2, y2, x3, y3, x4, y4);
      this.lastx = x4;
      this.lasty = y4;
    }
     bezierTo(x2, y2, x3, y3) {
      this._pushCmd(BEZIERTO, x2, y2, x3, y3);
      this.lastx = x3;
      this.lasty = y3;
    }
     lineTo(x2, y2) {
      if (this.first) {
          this.moveTo(x2, y2);
          return ;
      }
      this._pushCmd(LINETO, x2, y2);
      this.lastx = x2;
      this.lasty = y2;
    }
     pushFill() {
      this._pushCmd(FILL);
    }
     pushStroke(color, width) {
      if (color) {
          let a=color[3]||1.0;
          this._pushCmd(STROKECOLOR, color[0], color[1], color[2], a, 0.5);
      }
      if (width) {
          this._pushCmd(STROKEWIDTH, width);
      }
      this._pushCmd(STROKE);
    }
     noAutoFill() {
      this._pushCmd(NOFILL);
    }
     destroy(draw) {

    }
     gen(draw, _check_tag=0) {

    }
     reset(draw) {
      this.commands.length = 0;
      this.path_start_i = 0;
      this.off.zero();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.first = true;
    }
     draw(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g, clipMode=false) {
      var zoom=draw.matrix.$matrix.m11;
      offx+=this.off[0], offy+=this.off[1];
      if (isNaN(offx)||isNaN(offy)) {
          throw new Error("nan!");
      }
      this._last_z = this.z;
      var g=draw.g;
      var tmp=new Vector3();
      let debuglog=function () {
        if (debug>1) {
            let time=performance.now();
            if (time-lasttime>5) {
                console.log(...arguments);
                lasttime = time;
            }
        }
      };
      let debuglog2=function () {
        if (debug>0) {
            let time=performance.now();
            if (time-lasttime>5) {
                console.log(...arguments);
                lasttime = time;
            }
        }
      };
      debuglog2("start "+this.id);
      let matrix=draw.matrix;
      g.beginPath();
      g.lineCap = "butt";
      g.miterLimit = 2.5;
      let cmds=this.commands;
      let i;
      let mat2=new Matrix4(draw.matrix);
      mat2.invert();
      function loadtemp(off) {
        tmp[0] = cmds[i+2+off*2];
        tmp[1] = cmds[i+3+off*2];
        tmp[2] = 0.0;
        tmp.multVecMatrix(draw.matrix);
        if (isNaN(tmp.dot(tmp))) {
            throw new Error("NaN");
        }
      }
      if (!clipMode&&this.clip_paths.length>0) {
          g.beginPath();
          g.save();
          for (let path of this.clip_paths) {
              path.draw(draw, offx, offy, canvas, g, true);
          }
          g.clip();
      }
      var doff=2500;
      var do_blur=this.blur>1&&!clipMode;
      if (do_blur) {
          g.filter = "blur("+(this.blur*0.25*zoom)+"px)";
      }
      else {
        g.filter = "none";
      }
      let no_fill=false;
      for (i = 0; i<cmds.length; i+=cmds[i+1]+2) {
          var cmd=cmds[i];
          switch (cmd) {
            case BEGINPATH:
              debuglog("BEGINPATH");
              g.beginPath();
              break;
            case LINETO:
              debuglog("LINETO");
              loadtemp(0);
              g.lineTo(tmp[0], tmp[1]);
              break;
            case BEZIERTO:
              debuglog("BEZIERTO");
              loadtemp(0);
              var x1=tmp[0], y1=tmp[1];
              loadtemp(1);
              g.quadraticCurveTo(x1, y1, tmp[0], tmp[1]);
              break;
            case CUBICTO:
              debuglog("CUBICTO");
              loadtemp(0);
              var x1=tmp[0], y1=tmp[1];
              loadtemp(1);
              var x2=tmp[0], y2=tmp[1];
              loadtemp(2);
              g.bezierCurveTo(x1, y1, x2, y2, tmp[0], tmp[1]);
              break;
            case MOVETO:
              debuglog("MOVETO");
              loadtemp(0);
              g.moveTo(tmp[0], tmp[1]);
              break;
            case STROKECOLOR:
              let r=cmds[i+2], g1=cmds[i+3], b=cmds[i+4], a=cmd[i+5];
              r = ~~(r*255);
              g1 = ~~(g1*255);
              b = ~~(b*255);
              a = a||1.0;
              g.strokeStyle = `rgba(${r},${g1},${b},${a})`;
              break;
            case STROKEWIDTH:
              let zoom=draw.matrix.$matrix.m11;
              g.lineWidth = cmds[i+2]*zoom;
              break;
            case STROKE:
              g.stroke();
              break;
            case FILL:
              g.fill();
              break;
            case NOFILL:
              no_fill = true;
              break;
          }
      }
      if (clipMode) {
          return ;
      }
      if (no_fill&&this.clip_paths.length>0) {
          g.restore();
          return ;
      }
      var r=~~(this.color[0]*255), g1=~~(this.color[1]*255), b=~~(this.color[2]*255), a=this.color[3];
      let fstyle="rgba("+r+","+g1+","+b+","+a+")";
      g.fillStyle = fstyle;
      debuglog2("g.fillStyle", g.fillStyle);
      debuglog2("fill");
      g.fill();
      if (this.clip_paths.length>0) {
          g.restore();
      }
    }
     update() {
      this.recalc = 1;
    }
  }
  _ESClass.register(SimpleCanvasPath);
  _es6_module.add_class(SimpleCanvasPath);
  SimpleCanvasPath = _es6_module.add_export('SimpleCanvasPath', SimpleCanvasPath);
  class SimpleCanvasDraw2D extends VectorDraw {
    
    
    
    
     constructor() {
      super();
      this.paths = [];
      this.path_idmap = {};
      this.dosort = true;
      this.matstack = new Array(256);
      this.matrix = new Matrix4();
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
    }
    static  get_canvas(id, width, height, zindex) {
      var ret=document.getElementById(id);
      if (ret===undefined) {
          ret = document.createElement("canvas");
          ret.id = id;
      }
      ret.width = width;
      ret.height = height;
      if (ret.style!==undefined) {
          ret.style["z-index"] = zindex;
      }
      return ret;
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          return false;
      }
      var path=this.path_idmap[id];
      return check_z ? path.z===z : true;
    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          this.path_idmap[id] = new SimpleCanvasPath(this.matrix);
          this.path_idmap[id].index = this.paths.length;
          this.path_idmap[id].id = id;
          this.dosort = 1;
          this.paths.push(this.path_idmap[id]);
      }
      var ret=this.path_idmap[id];
      ret.matrix.load(this.matrix);
      if (check_z&&ret.z!==z) {
          this.dosort = 1;
          ret.z = z;
      }
      return ret;
    }
     update() {
      console.warn("update called");
      for (let p of this.paths) {
          p.update();
      }
    }
    static  kill_canvas(svg) {

    }
     destroy() {

    }
     draw(g) {
      var canvas=g.canvas;
      this.canvas = canvas;
      this.g = g;
      g.save();
      g.resetTransform();
      for (var p of this.paths) {
          p.draw(this);
      }
      g.restore();
      return new Promise((accept, reject) =>        {
        accept();
      });
    }
     set_matrix(matrix) {
      super.set_matrix(matrix);
      this.zoom = matrix.$matrix.m11;
    }
  }
  _ESClass.register(SimpleCanvasDraw2D);
  _es6_module.add_class(SimpleCanvasDraw2D);
  SimpleCanvasDraw2D = _es6_module.add_export('SimpleCanvasDraw2D', SimpleCanvasDraw2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_canvas2d_simple.js');


es6_module_define('vectordraw_skia_simple', ["../util/mathlib.js", "../config/config.js", "./vectordraw_base.js"], function _vectordraw_skia_simple_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorVertex');
  var QuadBezPath=es6_import_item(_es6_module, './vectordraw_base.js', 'QuadBezPath');
  var VectorDraw=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorDraw');
  function loadCanvasKit() {
    let script=document.createElement("script");
    script.setAttribute("type", "application/javascript");
    script.setAttribute("src", "node_modules/canvaskit-wasm/bin/canvaskit.js");
    script.addEventListener("load", () =>      {
      console.log("%cInitializing Skia. . .", "color: blue;");
      CanvasKitInit({locateFile: (file) =>          {
          return 'node_modules/canvaskit-wasm/bin/'+file;
        }}).ready().then((CanvasKit) =>        {
        console.log("%c CanvasKit initialized", "color: blue");
        window.CanvasKit = CanvasKit;
      });
    });
    document.body.appendChild(script);
  }
  loadCanvasKit = _es6_module.add_export('loadCanvasKit', loadCanvasKit);
  window.loadCanvasKit = loadCanvasKit;
  var debug=0;
  window._setDebug = (d) =>    {
    debug = d;
  }
  var canvaspath_draw_mat_tmps=new cachering((_) =>    {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(8);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function () {
    return new Vector2();
  }, 32);
  var CCMD=0, CARGLEN=1;
  var MOVETO=0, BEZIERTO=1, LINETO=2, BEGINPATH=3, CUBICTO=4, LINEWIDTH=5, LINESTYLE=6, STROKE=7;
  var NS="http://www.w3.org/2000/svg";
  var XLS="http://www.w3.org/1999/xlink";
  function makeElement(type, attrs) {
    if (attrs===undefined) {
        attrs = {};
    }
    var ret=document.createElementNS(NS, type);
    for (var k in attrs) {
        ret.setAttributeNS(null, k, attrs[k]);
    }
    return ret;
  }
  makeElement = _es6_module.add_export('makeElement', makeElement);
  let lasttime=performance.now();
  class SimpleSkiaPath extends QuadBezPath {
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.commands = [];
      this.recalc = 1;
      this.lastx = 0;
      this.lasty = 0;
      this._last_z = undefined;
      this._last_off = new Vector2();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.domnode = undefined;
      this.filternode = undefined;
      this.clip_users = new set();
      this.path_start_i = 0;
      this.first = true;
      this._mm = new MinMax(2);
    }
     update_aabb(draw, fast_mode=false) {
      var tmp=new Vector2();
      var mm=this._mm;
      var pad=this.pad = this.blur>0 ? this.blur*draw.zoom+15 : 0;
      mm.reset();
      if (fast_mode) {
          console.trace("FAST MODE!");
      }
      var prev=-1;
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=cs[i++];
        if (fast_mode&&prev!=BEGINPATH) {
            prev = cmd;
            i+=arglen;
            continue;
        }
        for (var j=0; j<arglen; j+=2) {
            tmp[0] = cs[i++], tmp[1] = cs[i++];
            tmp.multVecMatrix(draw.matrix);
            mm.minmax(tmp);
        }
        prev = cmd;
      }
      this.aabb[0].load(mm.min).subScalar(pad);
      this.aabb[1].load(mm.max).addScalar(pad);
    }
     beginPath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(BEGINPATH);
    }
     pushStroke(color, width) {
      if (color) {
          let a=color.length>3 ? color[3] : 1.0;
          this._pushCmd(LINESTYLE, ~~(color[0]*255), ~~(color[1]*255), ~~(color[2]*255), a);
      }
      if (width!==undefined) {
          this._pushCmd(LINEWIDTH, width);
      }
      this._pushCmd(STROKE);
    }
     undo() {
      this.commands.length = this.path_start_i;
    }
     _pushCmd() {
      var arglen=arguments.length-1;
      this.commands.push(arguments[0]);
      this.commands.push(arglen);
      for (var i=0; i<arglen; i++) {
          this.commands.push(arguments[i+1]);
      }
      this.recalc = 1;
      this.first = false;
    }
     moveTo(x, y) {
      this._pushCmd(MOVETO, x, y);
      this.lastx = x;
      this.lasty = y;
    }
     cubicTo(x2, y2, x3, y3, x4, y4) {
      this._pushCmd(CUBICTO, x2, y2, x3, y3, x4, y4);
      this.lastx = x4;
      this.lasty = y4;
    }
     bezierTo(x2, y2, x3, y3) {
      this._pushCmd(BEZIERTO, x2, y2, x3, y3);
      this.lastx = x3;
      this.lasty = y3;
    }
     lineTo(x2, y2) {
      if (this.first) {
          this.moveTo(x2, y2);
          return ;
      }
      this._pushCmd(LINETO, x2, y2);
      this.lastx = x2;
      this.lasty = y2;
    }
     destroy(draw) {

    }
     gen(draw, _check_tag=0) {

    }
     reset(draw) {
      this.commands.length = 0;
      this.path_start_i = 0;
      this.off.zero();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.first = true;
    }
     draw(draw, offx, offy, canvas=draw.canvsa, g=draw.g, clipMode=false) {
      return this.drawCanvas(...arguments);
    }
     drawCanvas(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g, clipMode=false) {
      var zoom=draw.matrix.$matrix.m11;
      offx+=this.off[0], offy+=this.off[1];
      if (isNaN(offx)||isNaN(offy)) {
          throw new Error("nan!");
      }
      this._last_z = this.z;
      var g=draw.g;
      var tmp=new Vector3();
      let debuglog=function () {
        if (debug>1) {
            let time=performance.now();
            if (time-lasttime>5) {
                console.log(...arguments);
                lasttime = time;
            }
        }
      };
      let debuglog2=function () {
        if (debug>0) {
            let time=performance.now();
            if (time-lasttime>5) {
                console.log(...arguments);
                lasttime = time;
            }
        }
      };
      debuglog2("start "+this.id);
      let matrix=draw.matrix;
      g.beginPath();
      let cmds=this.commands;
      let i;
      let mat2=new Matrix4(draw.matrix);
      mat2.invert();
      function loadtemp(off) {
        tmp[0] = cmds[i+2+off*2];
        tmp[1] = cmds[i+3+off*2];
        tmp[2] = 0.0;
        tmp.multVecMatrix(draw.matrix);
        if (isNaN(tmp.dot(tmp))) {
            throw new Error("NaN");
        }
      }
      if (!clipMode&&this.clip_paths.length>0) {
          g.beginPath();
          g.save();
          for (let path of this.clip_paths) {
              path.draw(draw, offx, offy, canvas, g, true);
          }
          g.clip();
      }
      for (i = 0; i<cmds.length; i+=cmds[i+1]+2) {
          var cmd=cmds[i];
          switch (cmd) {
            case BEGINPATH:
              debuglog("BEGINPATH");
              g.beginPath();
              break;
            case LINEWIDTH:
              let mat=g.getTransform();
              g.lineWidth = cmd[i+2]*mat.m11;
              break;
            case LINESTYLE:
              let r=cmd[i+2], g1=cmd[i+3], b=cmd[i+4], a=cmd[i+5];
              let style="rgba("+r+","+g1+","+b+","+a+")";
              if (cmd===LINESTYLE) {
                  g.strokeStyle = style;
              }
              break;
            case STROKE:
              g.stroke();
              break;
            case LINETO:
              debuglog("LINETO");
              loadtemp(0);
              g.lineTo(tmp[0], tmp[1]);
              break;
            case BEZIERTO:
              debuglog("BEZIERTO");
              loadtemp(0);
              var x1=tmp[0], y1=tmp[1];
              loadtemp(1);
              g.quadraticCurveTo(x1, y1, tmp[0], tmp[1]);
              break;
            case CUBICTO:
              debuglog("CUBICTO");
              loadtemp(0);
              var x1=tmp[0], y1=tmp[1];
              loadtemp(1);
              var x2=tmp[0], y2=tmp[1];
              loadtemp(2);
              g.bezierCurveTo(x1, y1, x2, y2, tmp[0], tmp[1]);
              break;
            case MOVETO:
              debuglog("MOVETO");
              loadtemp(0);
              g.moveTo(tmp[0], tmp[1]);
              break;
          }
      }
      if (clipMode) {
          return ;
      }
      var r=~~(this.color[0]*255), g1=~~(this.color[1]*255), b=~~(this.color[2]*255), a=this.color[3];
      let fstyle="rgba("+r+","+g1+","+b+","+a+")";
      g.fillStyle = fstyle;
      debuglog2("g.fillStyle", g.fillStyle);
      var doff=2500;
      var do_blur=this.blur>1&&!clipMode;
      if (do_blur) {
          g.filter = "blur("+(this.blur*0.25*zoom)+"px)";
      }
      else {
        g.filter = "none";
      }
      debuglog2("fill");
      g.fill();
      if (this.clip_paths.length>0) {
          g.restore();
      }
    }
     update() {
      this.recalc = 1;
    }
  }
  _ESClass.register(SimpleSkiaPath);
  _es6_module.add_class(SimpleSkiaPath);
  SimpleSkiaPath = _es6_module.add_export('SimpleSkiaPath', SimpleSkiaPath);
  class SimpleSkiaDraw2D extends VectorDraw {
    
    
    
    
     constructor() {
      super();
      this.paths = [];
      this.path_idmap = {};
      this.dosort = true;
      this.matstack = new Array(256);
      this.matrix = new Matrix4();
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
    }
    static  get_canvas(id, width, height, zindex) {
      var ret=document.getElementById(id);
      if (ret===undefined) {
          ret = document.createElement("canvas");
          ret.id = id;
      }
      ret.width = width;
      ret.height = height;
      if (ret.style!=undefined) {
          ret.style["z-index"] = zindex;
      }
      return ret;
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          return false;
      }
      var path=this.path_idmap[id];
      return check_z ? path.z==z : true;
    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          this.path_idmap[id] = new SimpleSkiaPath();
          this.path_idmap[id].index = this.paths.length;
          this.path_idmap[id].id = id;
          this.dosort = 1;
          this.paths.push(this.path_idmap[id]);
      }
      var ret=this.path_idmap[id];
      if (check_z&&ret.z!=z) {
          this.dosort = 1;
          ret.z = z;
      }
      return ret;
    }
     update() {
      console.warn("update called");
      for (let p of this.paths) {
          p.update();
      }
    }
    static  kill_canvas(svg) {

    }
     destroy() {

    }
     draw(g) {
      var canvas=g.canvas;
      this.canvas = canvas;
      this.g = g;
      let canvas0, g0;
      if (0) {
          this.canvas = canvas = window.skcanvas;
          this.g = g = window.skg;
      }
      else 
        if (window.CanvasKit!==undefined) {
          canvas0 = canvas;
          g0 = g;
          canvas = CanvasKit.MakeCanvas(canvas.width, canvas.height);
          canvas.width = canvas0.width;
          canvas.height = canvas0.height;
          let mat=g0.getTransform();
          let g2=canvas.getContext("2d");
          g2.globalAlpha = 1.0;
          g2.globalCompositeOperation = "source-over";
          this.canvas = canvas;
          this.g = g2;
          g = g2;
      }
      g.save();
      g.resetTransform();
      for (var p of this.paths) {
          p.draw(this, undefined, undefined, this.canvas, this.g);
      }
      g.restore();
      if (canvas0) {
          this.g.beginPath();
          this.g.rect(0, 0, 500, 500);
          this.g.fillStyle = "rgb(255, 200, 200)";
          this.g.fill();
          this.canvas.Il.flush();
          let image=this.g.getImageData(0, 0, canvas0.width, canvas0.height);
          let image2=new ImageData(canvas0.width, canvas0.height);
          image2.data.set(image.data);
          console.log(image2);
          for (let i=0; i<image2.data.length; i+=4) {
              image2.data[i] = image.data[i];
              image2.data[i+1] = image.data[i+1];
              image2.data[i+2] = image.data[i+2];
              image2.data[i+3] = 255;
          }
          g0.putImageData(image2, 0, 0);
          window.skcanvas = this.canvas;
          window.skg = this.g;
          canvas.dispose();
      }
      return new Promise((accept, reject) =>        {
        accept();
      });
    }
     set_matrix(matrix) {
      super.set_matrix(matrix);
      this.zoom = matrix.$matrix.m11;
    }
  }
  _ESClass.register(SimpleSkiaDraw2D);
  _es6_module.add_class(SimpleSkiaDraw2D);
  SimpleSkiaDraw2D = _es6_module.add_export('SimpleSkiaDraw2D', SimpleSkiaDraw2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_skia_simple.js');


es6_module_define('vectordraw_svg', ["./vectordraw_base.js", "../util/mathlib.js", "../config/config.js"], function _vectordraw_svg_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorVertex');
  var QuadBezPath=es6_import_item(_es6_module, './vectordraw_base.js', 'QuadBezPath');
  var VectorDraw=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorDraw');
  var canvaspath_draw_mat_tmps=new cachering((_) =>    {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(32);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function () {
    return new Vector2();
  }, 32);
  var CCMD=0, CARGLEN=1;
  var MOVETO=0, BEZIERTO=1, LINETO=2, BEGINPATH=3, CUBICTO=4, STROKE=5, STROKECOLOR=6, STROKEWIDTH=7, NOAUTOFILL=8, FILL=9;
  var NS="http://www.w3.org/2000/svg";
  var XLS="http://www.w3.org/1999/xlink";
  function makeElement(type, attrs) {
    if (attrs===undefined) {
        attrs = {};
    }
    var ret=document.createElementNS(NS, type);
    for (var k in attrs) {
        ret.setAttributeNS(null, k, attrs[k]);
    }
    return ret;
  }
  makeElement = _es6_module.add_export('makeElement', makeElement);
  class SVGPath extends QuadBezPath {
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.commands = [];
      this.recalc = 1;
      this.lastx = 0;
      this.lasty = 0;
      this._last_z = undefined;
      this._last_off = new Vector2();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.domnode = undefined;
      this.filternode = undefined;
      this.clip_users = new set();
      this.path_start_i = 0;
      this.first = true;
      this._mm = new MinMax(2);
    }
     update_aabb(draw, fast_mode=false) {
      var tmp=new Vector2();
      var mm=this._mm;
      var pad=this.pad = this.blur>0 ? this.blur*draw.zoom+15 : 0;
      mm.reset();
      if (fast_mode) {
          console.trace("FAST MODE!");
      }
      var prev=-1;
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=cs[i++];
        if (fast_mode&&prev!==BEGINPATH) {
            prev = cmd;
            i+=arglen;
            continue;
        }
        if (cmd!==LINETO&&cmd!==CUBICTO&&cmd!==BEZIERTO&&cmd!==MOVETO) {
            continue;
        }
        for (var j=0; j<arglen; j+=2) {
            tmp[0] = cs[i++], tmp[1] = cs[i++];
            tmp.multVecMatrix(draw.matrix);
            mm.minmax(tmp);
        }
        prev = cmd;
      }
      this.aabb[0].load(mm.min).subScalar(pad);
      this.aabb[1].load(mm.max).addScalar(pad);
    }
     beginPath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(BEGINPATH);
    }
     undo() {
      this.commands.length = this.path_start_i;
    }
     pushFill() {
      this._pushCmd(FILL);
    }
     pushStroke(color, width) {
      if (color) {
          let a=color[3]||1.0;
          this._pushCmd(STROKECOLOR, color[0], color[1], color[2], a, 0.5);
      }
      if (width) {
          this._pushCmd(STROKEWIDTH, width);
      }
      this._pushCmd(STROKE);
    }
     noAutoFill() {
      this._pushCmd(NOAUTOFILL);
    }
     _pushCmd() {
      var arglen=arguments.length-1;
      this.commands.push(arguments[0]);
      this.commands.push(arglen);
      for (var i=0; i<arglen; i++) {
          this.commands.push(arguments[i+1]);
      }
      this.recalc = 1;
      this.first = false;
    }
     moveTo(x, y) {
      this._pushCmd(MOVETO, x, y);
      this.lastx = x;
      this.lasty = y;
    }
     bezierTo(x2, y2, x3, y3) {
      this._pushCmd(BEZIERTO, x2, y2, x3, y3);
      this.lastx = x3;
      this.lasty = y3;
    }
     cubicTo(x2, y2, x3, y3, x4, y4) {
      this._pushCmd(CUBICTO, x2, y2, x3, y3, x4, y4);
      this.lastx = x4;
      this.lasty = y4;
    }
     lineTo(x2, y2) {
      if (this.first) {
          this.moveTo(x2, y2);
          return ;
      }
      this._pushCmd(LINETO, x2, y2);
      this.lastx = x2;
      this.lasty = y2;
    }
     destroy(draw) {
      if (this.domnode) {
          this.domnode.remove();
          this.domnode = undefined;
      }
      if (this.filternode) {
          this.filternode.remove();
          this.filternode = undefined;
      }
      if (this.usenode) {
          this.usenode.remove();
          this.usenode = undefined;
      }
    }
     get_dom_id(draw, id2=0) {
      return draw.svg.id+"_path_"+this.id+"_"+id2;
    }
     gen(draw, _check_tag=0) {
      if (_check_tag&&!this.recalc) {
          console.log("infinite loop in clip stack");
          return ;
      }
      this.recalc = 0;
      var do_clip=this.clip_paths.length>0;
      var do_blur=this.blur>0.0;
      this.update_aabb(draw);
      var w=this.size[0] = Math.ceil(this.aabb[1][0]-this.aabb[0][0]);
      var h=this.size[1] = Math.ceil(this.aabb[1][1]-this.aabb[0][1]);
      if (w>config.MAX_CANVAS2D_VECTOR_CACHE_SIZE||h>config.MAX_CANVAS2D_VECTOR_CACHE_SIZE) {
          var w2=Math.min(w, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
          var h2=Math.min(h, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
          var dw=w-w2, dh=h-h2;
          this.aabb[0][0]+=dw*0.5;
          this.aabb[0][1]+=dh*0.5;
          this.aabb[1][0]-=dw*0.5;
          this.aabb[1][1]-=dh*0.5;
          this.size[0] = w2;
          this.size[1] = h2;
          w = w2, h = h2;
      }
      var domid=this.get_dom_id(draw);
      var node=this.domnode;
      if (!node) {
          node = this.domnode = document.getElementById(domid);
          if (!node) {
              node = this.domnode = makeElement("path");
              node.id = domid;
              node.setAttributeNS(null, "id", domid);
              draw.defs.appendChild(node);
              var useid=domid+"_use";
              var usenode=document.getElementById(useid);
              if (usenode) {
                  usenode.remove();
              }
              usenode = makeElement("use", {"id": useid});
              usenode.setAttributeNS(XLS, "xlink:href", "#"+domid);
              draw.group.appendChild(usenode);
              this.usenode = usenode;
          }
      }
      if (!this.usenode) {
          this.usenode = document.getElementById(domid+"_use");
      }
      for (var i=0; i<draw.group.childNodes.length; i++) {
          if (draw.group.childNodes[i]===this.usenode) {
              this._last_z = i;
              break;
          }
      }
      var fid=draw.svg.id+"_"+this.id+"_blur";
      var blur, filter;
      if (this.blur*draw.zoom>1) {
          if (!this.filternode) {
              filter = this.filternode = document.getElementById(fid);
          }
          else {
            filter = this.filternode;
          }
          var w2=w-this.pad*2, h2=h-this.pad*2;
          var wratio=2.0*(w/w2)*100.0, hratio=2.0*(h/h2)*100.0;
          var fx=""+(-wratio/4)+"%", fy=""+(-hratio/4)+"%", fwidth=""+wratio+"%", fheight=""+hratio+"%";
          if (!filter) {
              var defs=draw.defs;
              var filter=this.filternode = makeElement("filter", {id: fid, 
         x: fx, 
         y: fy, 
         width: fwidth, 
         height: fheight});
              var blur=makeElement("feGaussianBlur", {stdDeviation: ~~(this.blur*draw.zoom*0.25), 
         "in": "SourceGraphic"});
              filter.appendChild(blur);
              defs.appendChild(filter);
              node.setAttributeNS(null, "filter", "url(#"+fid+")");
          }
          else {
            if (filter.getAttributeNS(null, "x")!==fx)
              filter.setAttributeNS(null, "x", fx);
            if (filter.getAttributeNS(null, "y")!==fy)
              filter.setAttributeNS(null, "y", fy);
            if (filter.getAttributeNS(null, "width")!==fwidth)
              filter.setAttributeNS(null, "width", fwidth);
            if (filter.getAttributeNS(null, "height")!==fheight)
              filter.setAttributeNS(null, "hratio", fheight);
            blur = filter.childNodes[0];
            if (!blur.hasAttributeNS(null, "stdDeviation")||parseFloat(blur.getAttributeNS(null, "stdDeviation"))!==~~(this.blur*draw.zoom*0.5)) {
                blur.setAttributeNS(null, "stdDeviation", ~~(this.blur*draw.zoom*0.5));
            }
          }
      }
      else 
        if (this.filternode) {
          node.removeAttributeNS(null, "filter");
          this.filternode.remove();
          this.filternode = undefined;
      }
      var clipid=draw.svg.id+"_"+this.id+"_clip";
      if (this.clip_paths.length>0) {
          var clip=this.clipnode;
          if (!clip) {
              clip = this.clipnode = document.getElementById(clipid);
          }
          if (!clip) {
              clip = this.clipnode = makeElement("clipPath", {id: clipid});
              draw.defs.appendChild(clip);
              for (var path of this.clip_paths) {
                  if (path.recalc) {
                      console.log("  clipping subgen!");
                      path.gen(draw, 1);
                  }
                  var usenode=makeElement("use");
                  usenode.setAttributeNS(XLS, "xlink:href", "#"+path.domnode.getAttributeNS(null, "id"));
                  clip.appendChild(usenode);
              }
          }
          node.setAttributeNS(null, "clip-path", "url(#"+clipid+")");
      }
      else 
        if (this.clipnode) {
          node.removeAttributeNS(null, "clip-path");
          this.clipnode.remove();
          this.clipnode = undefined;
      }
      var mat=canvaspath_draw_mat_tmps.next();
      mat.load(draw.matrix);
      var co=canvaspath_draw_vs.next().zero();
      if (!node) {
          node = document.getElementById(domid);
          console.log("undefined node!", this.domnode, document.getElementById(domid), domid);
          return ;
      }
      var r=~~(this.color[0]*255), g=~~(this.color[1]*255), b=~~(this.color[2]*255), a=this.color[3];
      node.setAttributeNS(null, "fill", "rgba("+r+","+g+","+b+","+a+")");
      var d="";
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=cs[i++];
        var tmp=canvaspath_draw_args_tmps[arglen];
        var h=parseFloat(draw.svg.getAttributeNS(null, "height"));
        switch (cmd) {
          case STROKE:
            break;
          case STROKECOLOR:
            let r=cs[i++], g2=cs[i++], b=cs[i++], a=cs[i++];
            r = ~~(r*255);
            g2 = ~~(g2*255);
            b = ~~(b*255);
            a = a||1.0;
            node.setAttributeNS(null, "fill", "rgba("+r+","+g2+","+b+","+a+")");
            break;
          case STROKEWIDTH:
            let w=cs[i++];
            break;
          case MOVETO:
          case LINETO:
          case CUBICTO:
          case BEZIERTO:
          case BEGINPATH:
            for (var j=0; j<arglen; j+=2) {
                co[0] = cs[i++], co[1] = cs[i++];
                co.multVecMatrix(mat);
                if (isNaN(co[0])) {
                    co[0] = 0;
                }
                if (isNaN(co[1])) {
                    co[1] = 0;
                }
                tmp[j] = co[0], tmp[j+1] = co[1];
            }
            switch (cmd) {
              case MOVETO:
                d+="M"+tmp[0]+" "+tmp[1];
                break;
              case LINETO:
                d+="L"+tmp[0]+" "+tmp[1];
                break;
              case BEZIERTO:
                d+="Q"+tmp[0]+" "+tmp[1]+" "+tmp[2]+" "+tmp[3];
                break;
              case CUBICTO:
                d+="C"+tmp[0]+" "+tmp[1]+" "+tmp[2]+" "+tmp[3]+" "+tmp[4]+" "+tmp[5];
                break;
              case BEGINPATH:
                break;
            }
            break;
          default:
            i+=arglen;
            break;
        }
      }
      node.setAttributeNS(null, "d", d);
    }
     reset(draw) {
      this.commands.length = 0;
      this.path_start_i = 0;
      this.off.zero();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.first = true;
    }
     draw(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g) {
      offx+=this.off[0], offy+=this.off[1];
      this._last_z = this.z;
      if (this.recalc) {
          this.recalc = 0;
          this.gen(draw);
      }
      if (this._last_off[0]!==offx||this._last_off[1]!==offy) {
          this._last_off[0] = offx;
          this._last_off[1] = offy;
          var transform="translate("+offx+","+offy+")";
          this.usenode.setAttributeNS(null, "transform", transform);
      }
    }
     update() {
      this.recalc = 1;
    }
  }
  _ESClass.register(SVGPath);
  _es6_module.add_class(SVGPath);
  SVGPath = _es6_module.add_export('SVGPath', SVGPath);
  class SVGDraw2D extends VectorDraw {
    
    
    
    
     constructor() {
      super();
      this.paths = [];
      this.path_idmap = {};
      this.dosort = true;
      this.matstack = new Array(256);
      this.matrix = new Matrix4();
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
    }
    static  get_canvas(id, width, height, zindex) {
      var ret=document.getElementById(id);
      if (!ret) {
          ret = makeElement("svg", {width: width, 
       height: height});
          ret.id = id;
          ret.setAttributeNS(null, "id", id);
          ret.style["position"] = "absolute";
          ret.style["z-index"] = zindex;
          console.trace("\tZINDEX: ", zindex);
          document.body.appendChild(ret);
      }
      if (ret.width!==width) {
          ret.setAttributeNS(null, "width", width);
      }
      if (ret.height!==height) {
          ret.setAttributeNS(null, "height", height);
      }
      return ret;
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          return false;
      }
      var path=this.path_idmap[id];
      return check_z ? path.z===z : true;
    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          this.path_idmap[id] = new SVGPath();
          this.path_idmap[id].index = this.paths.length;
          this.path_idmap[id].id = id;
          this.paths.push(this.path_idmap[id]);
      }
      var ret=this.path_idmap[id];
      if (check_z&&ret.z!==z) {
          this.dosort = 1;
          ret.z = z;
      }
      return ret;
    }
     update() {
      for (var path of this.paths) {

      }
    }
    static  kill_canvas(svg) {
      if (svg) {
          svg.remove();
      }
    }
     destroy() {
      console.log("DESTROY!");
      for (var path of this.paths) {
          path.destroy(this);
      }
      this.paths.length = 0;
      this.path_idmap = {};
      if (this.svg) {
          this.svg.remove();
          this.svg = this.defs = undefined;
      }
    }
     draw(g) {
      var canvas=g.canvas;
      let updateKey=""+this.matrix.$matrix.m11.toFixed(4)+":"+this.matrix.$matrix.m41.toFixed(2)+":"+this.matrix.$matrix.m42.toFixed(2);
      let recalc_all=false;
      if (updateKey!==this._last_update_key) {
          recalc_all = true;
          this._last_update_key = updateKey;
      }
      if (canvas.style["background"]!=="rgba(0,0,0,0)") {
          canvas.style["background"] = "rgba(0,0,0,0)";
      }
      let dpi=devicePixelRatio;
      this.svg = SVGDraw2D.get_canvas(canvas.id+"_svg", canvas.width, canvas.height, 1);
      this.svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      this.svg.setAttribute(`xmlns:xlink`, "http://www.w3.org/1999/xlink");
      this.svg.style["pointer-events"] = "none";
      var this2=this;
      function onkillscreen() {
        window.removeEventListener(onkillscreen);
        SVGDraw2D.kill_canvas(this2.svg);
        this2.svg = undefined;
      }
      window.addEventListener("killscreen", onkillscreen);
      var defsid=this.svg.id+"_defs";
      var defs=document.getElementById(defsid);
      if (!defs) {
          defs = makeElement("defs", {id: defsid});
          defs.id = defsid;
          this.svg.appendChild(defs);
      }
      this.defs = defs;
      var groupid=this.svg.id+"_maingroup";
      var group=document.getElementById(groupid);
      if (!group) {
          group = makeElement("g", {id: groupid});
          this.svg.appendChild(group);
      }
      this.group = group;
      if (this.svg.style["width"]!==canvas.style["width"])
        this.svg.style["width"] = canvas.style["width"];
      if (this.svg.style["height"]!==canvas.style["height"])
        this.svg.style["height"] = canvas.style["height"];
      if (this.svg.style["left"]!==canvas.style["left"])
        this.svg.style["left"] = canvas.style["left"];
      if (this.svg.style["top"]!==canvas.style["top"])
        this.svg.style["top"] = canvas.style["top"];
      for (let path of this.paths) {
          if (path.z!==path._last_z) {
              this.dosort = 1;
              path.recalc = 1;
              path._last_z = path.z;
          }
      }
      for (let path of this.paths) {
          if (path.recalc||recalc_all) {
              path.gen(this);
          }
      }
      if (this.dosort) {
          console.log("SVG sort!");
          this.dosort = 0;
          this.paths.sort(function (a, b) {
            return a.z-b.z;
          });
          var cs=this.group.childNodes;
          for (var i=0; i<cs.length; i++) {
              var n=cs[i];
              if (n.tagName.toUpperCase()==="USE") {
                  n.remove();
                  i--;
              }
          }
          for (var path of this.paths) {
              if (path.hidden) {
                  path.usenode = undefined;
                  continue;
              }
              var useid=path.get_dom_id(this)+"_use";
              var usenode=path.usenode = makeElement("use", {"id": useid});
              usenode.setAttributeNS(XLS, "xlink:href", "#"+path.get_dom_id(this));
              path._last_off[0] = path._last_off[1] = 1e+17;
              this.group.appendChild(usenode);
          }
      }
      for (let path of this.paths) {
          if (!path.hidden)
            path.draw(this);
      }
    }
     set_matrix(matrix) {
      super.set_matrix(matrix);
      this.zoom = matrix.$matrix.m11;
    }
  }
  _ESClass.register(SVGDraw2D);
  _es6_module.add_class(SVGDraw2D);
  SVGDraw2D = _es6_module.add_export('SVGDraw2D', SVGDraw2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_svg.js');


es6_module_define('vectordraw_canvas2d_jobs', [], function _vectordraw_canvas2d_jobs_module(_es6_module) {
}, '/dev/fairmotion/src/vectordraw/vectordraw_canvas2d_jobs.js');


es6_module_define('vectordraw_jobs', ["../config/config.js", "../path.ux/scripts/util/simple_events.js", "../core/eventmanager.js", "../../platforms/platform.js", "./vectordraw_jobs_base.js"], function _vectordraw_jobs_module(_es6_module) {
  "use strict";
  var eventmanager=es6_import(_es6_module, '../core/eventmanager.js');
  var MESSAGES=es6_import_item(_es6_module, './vectordraw_jobs_base.js', 'MESSAGES');
  let MS=MESSAGES;
  let Debug=0;
  let freeze_while_drawing=false;
  var platform=es6_import(_es6_module, '../../platforms/platform.js');
  var config=es6_import(_es6_module, '../config/config.js');
  var pushModalLight=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'popModalLight');
  var keymap=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'keymap');
  let MAX_THREADS=platform.app.numberOfCPUs()+1;
  MAX_THREADS = Math.max(MAX_THREADS, 2);
  if (config.HTML5_APP_MODE||config.NO_RENDER_WORKERS) {
      MAX_THREADS = 1;
  }
  window.MAX_THREADS = MAX_THREADS;
  class Thread  {
    
    
    
    
    
    
    
    
     constructor(worker, id, manager) {
      this.id = id;
      this.manager = manager;
      this.worker = worker;
      this.dead = false;
      this.queue = [];
      this.ready = false;
      this.lock = 0;
      this.owner = undefined;
      this.msgstate = undefined;
      worker.onmessage = this.onmessage.bind(this);
      this.ondone = null;
      this.callbacks = {};
      this.ownerid_msgid_map = {};
      this.msgid_ownerid_map = {};
      this.cancelset = new Set();
      this.freezelvl = 0;
    }
     cancelRenderJob(ownerid) {
      if (this.cancelset.has(ownerid)) {
          return ;
      }
      if (ownerid in this.ownerid_msgid_map) {
          if (Debug)
            console.log("cancelling job ", ownerid, "in thread", this.manager.threads.indexOf(this), "freezelvl:", this.freezelvl);
          this.freezelvl--;
          let oldid=this.msgid_ownerid_map[ownerid];
          this.postMessage(MS.CANCEL_JOB, oldid);
          delete this.ownerid_msgid_map[ownerid];
          delete this.msgid_ownerid_map[oldid];
      }
      else {
        if (Debug)
          console.log("Bad owner id", ownerid);
      }
    }
     postRenderJob(ownerid, commands, datablocks) {
      let id=this.manager._rthread_idgen++;
      if (Debug)
        console.log("thread", this.manager.threads.indexOf(this), "freezelvl:", this.freezelvl);
      this.freezelvl++;
      this.ownerid_msgid_map[ownerid] = id;
      this.msgid_ownerid_map[id] = ownerid;
      this.postMessage(MS.NEW_JOB, id, undefined);
      this.postMessage(MS.SET_COMMANDS, id, [commands.buffer]);
      if (datablocks!==undefined) {
          for (let block of datablocks) {
              this.postMessage(MS.ADD_DATABLOCK, id, [block]);
          }
      }
      return new Promise((accept, reject) =>        {
        let callback=(data) =>          {
          accept(data);
        }
        this.callbacks[id] = callback;
        this.postMessage(MS.RUN, id);
      });
    }
     clearOutstandingJobs() {
      this.freezelvl = 0;
      this.postMessage(MS.CLEAR_QUEUE, 0);
      this.callback = {};
      this.msgid_ownerid_map = {};
      this.ownerid_msgid_map = {};
    }
     onmessage(e) {
      switch (e.data.type) {
        case MS.WORKER_READY:
          console.log("%c Vectordraw worker ready", "color: blue");
          this.ready = true;
          this.manager.has_ready_thread = true;
          break;
        case MS.RESULT:
          let id=e.data.msgid;
          if (!(id in this.callbacks)) {
              if (Debug)
                console.warn("Renderthread callback not found for: ", id);
              return ;
          }
          let ownerid=this.msgid_ownerid_map[id];
          if (ownerid===undefined) {
              if (Debug)
                console.log("failed to find owner for", id, this);
              return ;
          }
          delete this.ownerid_msgid_map[ownerid];
          delete this.msgid_ownerid_map[id];
          let cb=this.callbacks[id];
          delete this.callbacks[id];
          this.freezelvl--;
          if (Debug)
            console.log("thread", this.manager.threads.indexOf(this), "freezelvl:", this.freezelvl);
          if (Debug)
            console.log(cb, e.data.data[0]);
          cb(e.data.data[0]);
          if (this.freezelvl<=0) {
              this.manager.on_thread_done(this);
              this.freezelvl = 0;
          }
          break;
      }
      if (Debug)
        console.log("event message in main thread", e);
    }
     tryLock(owner) {
      if (this.lock===0||this.owner===owner) {
          return true;
      }
      return false;
    }
     tryUnlock(owner) {
      if (this.lock===0||this.owner!==owner) {
          return false;
      }
      this.owner = undefined;
      this.lock = 0;
      return true;
    }
     postMessage(type, msgid, transfers) {
      this.worker.postMessage({type: type, 
     msgid: msgid, 
     data: transfers}, transfers);
    }
     close() {
      if (this.worker!==undefined) {
          this.worker.terminate();
          this.worker = undefined;
      }
      else {
        console.warn("Worker already killed once", this.id);
      }
    }
  }
  _ESClass.register(Thread);
  _es6_module.add_class(Thread);
  Thread = _es6_module.add_export('Thread', Thread);
  class ThreadManager  {
    
    
    
    
     constructor() {
      this.threads = [];
      this.drawing = false;
      this.thread_idmap = {};
      this._idgen = 0;
      this._rthread_idgen = 0;
      this.max_threads = MAX_THREADS;
      this.start_time = undefined;
      window.setInterval(() =>        {
        if (this.drawing&&time_ms()-this.start_time>750) {
            console.log("Draw timed out; aborting draw freeze");
            this.endDrawing();
        }
        return ;
      }, 750);
    }
     setMaxThreads(n) {
      if (n===undefined||typeof n!="number"||n<0) {
          throw new Error("n must be a number");
      }
      this.max_threads = n;
      while (this.threads.length>n) {
        let thread=this.threads.pop();
        thread.worker.terminate();
      }
      while (this.threads.length<n) {
        if (config.HAVE_SKIA) {
            this.spawnThread("vectordraw_skia_worker.js");
        }
        else {
          this.spawnThread("vectordraw_canvas2d_worker.js");
        }
      }
    }
     startDrawing() {
      this.drawing = true;
      this.start_time = time_ms();
      if (freeze_while_drawing) {
          console.log("%cFreeze Drawing", "color : orange;");
          window._block_drawing = true;
      }
    }
     endDrawing() {
      this.drawing = false;
      if (freeze_while_drawing) {
          console.log("%cUnfreeze Drawing", "color : orange;");
          window._block_drawing = false;
      }
    }
     spawnThread(source) {
      let worker=new Worker(source);
      let thread=new Thread(worker, this._idgen++, this);
      this.thread_idmap[thread.id] = thread;
      this.threads.push(thread);
      return thread;
    }
     endThread(thread) {
      if (thread.worker===undefined) {
          console.warn("Double call to ThreadManager.endThread()");
          return ;
      }
      this.threads.remove(thread);
      delete this.thread_idmap[thread.id];
      thread.close();
    }
     getRandomThread() {
      while (1) {
        let ri=~~(Math.random()*this.threads.length*0.99999);
        if (this.threads[ri].ready)
          return this.threads[ri];
      }
    }
     postRenderJob(ownerid, commands, datablocks) {
      if (!this.drawing&&freeze_while_drawing) {
          this.startDrawing();
      }
      let thread;
      if (this.threads.length===0) {
          thread = this.spawnThread("vectordraw_canvas2d_worker.js");
          thread.ready = true;
          for (let i=0; i<this.max_threads-1; i++) {
              if (config.HAVE_SKIA) {
                  this.spawnThread("vectordraw_skia_worker.js");
              }
              else {
                this.spawnThread("vectordraw_canvas2d_worker.js");
              }
          }
      }
      else {
        thread = this.getRandomThread();
      }
      let ret=thread.postRenderJob(ownerid, commands, datablocks);
      return ret;
    }
     on_thread_done(thread) {
      let ok=true;
      for (let thread2 of this.threads) {
          if (thread2.freezelvl>0) {
              ok = false;
              break;
          }
      }
      if (ok) {
          if (Debug)
            console.warn("thread done");
          window._all_draw_jobs_done();
          if (this.drawing&&freeze_while_drawing) {
              this.endDrawing();
          }
          this.checkMemory();
      }
    }
     checkMemory() {
      let promise=platform.app.getProcessMemoryPromise();
      if (!promise)
        return ;
      promise.then((memory) =>        {      });
    }
     cancelAllJobs() {
      for (let thread of this.threads) {
          thread.clearOutstandingJobs();
          this.on_thread_done(thread);
      }
    }
     cancelRenderJob(ownerid) {
      for (let thread of this.threads) {
          if (ownerid in thread.ownerid_msgid_map) {
              thread.cancelRenderJob(ownerid);
          }
      }
    }
  }
  _ESClass.register(ThreadManager);
  _es6_module.add_class(ThreadManager);
  ThreadManager = _es6_module.add_export('ThreadManager', ThreadManager);
  var manager=new ThreadManager();
  manager = _es6_module.add_export('manager', manager);
  function test() {
    let thread=manager.spawnThread("vectordraw_canvas2d_worker.js");
    thread.postMessage("yay", [new ArrayBuffer(512)]);
    return thread;
  }
  test = _es6_module.add_export('test', test);
}, '/dev/fairmotion/src/vectordraw/vectordraw_jobs.js');


es6_module_define('vectordraw_jobs_base', [], function _vectordraw_jobs_base_module(_es6_module) {
  var OPCODES={LINESTYLE: 0, 
   LINEWIDTH: 1, 
   FILLSTYLE: 2, 
   BEGINPATH: 3, 
   CLOSEPATH: 4, 
   MOVETO: 5, 
   LINETO: 6, 
   RECT: 7, 
   ARC: 8, 
   CUBIC: 9, 
   QUADRATIC: 10, 
   STROKE: 11, 
   FILL: 12, 
   SAVE: 13, 
   RESTORE: 14, 
   TRANSLATE: 15, 
   ROTATE: 16, 
   SCALE: 17, 
   SETBLUR: 18, 
   SETCOMPOSITE: 19, 
   CLIP: 20, 
   DRAWIMAGE: 21, 
   PUTIMAGE: 22, 
   SETTRANSFORM: 23}
  OPCODES = _es6_module.add_export('OPCODES', OPCODES);
  var MESSAGES={NEW_JOB: 0, 
   ADD_DATABLOCK: 1, 
   SET_COMMANDS: 2, 
   RUN: 3, 
   ERROR: 10, 
   RESULT: 11, 
   ACK: 12, 
   CLEAR_QUEUE: 13, 
   CANCEL_JOB: 14, 
   WORKER_READY: 15}
  MESSAGES = _es6_module.add_export('MESSAGES', MESSAGES);
  var CompositeModes={"source-over": 0, 
   "source-atop": 1}
  CompositeModes = _es6_module.add_export('CompositeModes', CompositeModes);
}, '/dev/fairmotion/src/vectordraw/vectordraw_jobs_base.js');


es6_module_define('vectordraw', ["./vectordraw_svg.js", "./vectordraw_skia_simple.js", "./vectordraw_stub.js", "./vectordraw_base.js", "./vectordraw_canvas2d.js", "./vectordraw_canvas2d_simple.js"], function _vectordraw_module(_es6_module) {
  "use strict";
  var CanvasDraw2D=es6_import_item(_es6_module, './vectordraw_canvas2d.js', 'CanvasDraw2D');
  var CanvasPath=es6_import_item(_es6_module, './vectordraw_canvas2d.js', 'CanvasPath');
  var StubCanvasDraw2D=es6_import_item(_es6_module, './vectordraw_stub.js', 'StubCanvasDraw2D');
  var StubCanvasPath=es6_import_item(_es6_module, './vectordraw_stub.js', 'StubCanvasPath');
  var SVGDraw2D=es6_import_item(_es6_module, './vectordraw_svg.js', 'SVGDraw2D');
  var SVGPath=es6_import_item(_es6_module, './vectordraw_svg.js', 'SVGPath');
  let _ex_VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  _es6_module.add_export('VectorFlags', _ex_VectorFlags, true);
  var SimpleCanvasPath=es6_import_item(_es6_module, './vectordraw_canvas2d_simple.js', 'SimpleCanvasPath');
  var SimpleCanvasDraw2D=es6_import_item(_es6_module, './vectordraw_canvas2d_simple.js', 'SimpleCanvasDraw2D');
  var SimpleSkiaDraw2D=es6_import_item(_es6_module, './vectordraw_skia_simple.js', 'SimpleSkiaDraw2D');
  var SimpleSkiaPath=es6_import_item(_es6_module, './vectordraw_skia_simple.js', 'SimpleSkiaPath');
  var loadCanvasKit=es6_import_item(_es6_module, './vectordraw_skia_simple.js', 'loadCanvasKit');
  let Canvas=CanvasDraw2D;
  Canvas = _es6_module.add_export('Canvas', Canvas);
  let Path=CanvasPath;
  Path = _es6_module.add_export('Path', Path);
}, '/dev/fairmotion/src/vectordraw/vectordraw.js');


es6_module_define('strokedraw', [], function _strokedraw_module(_es6_module) {
  "use strict";
}, '/dev/fairmotion/src/vectordraw/strokedraw.js');


es6_module_define('webgl', ["../path.ux/scripts/pathux.js"], function _webgl_module(_es6_module) {
  "use strict";
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  var Vector3=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector3');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Matrix4');
  var Vector4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Quat');
  var Vector2=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector2');
  let STRUCT=nstructjs.STRUCT;
  const constmap={}
  _es6_module.add_export('constmap', constmap);
  let TEXTURE_2D=3553;
  class IntUniform  {
     constructor(val) {
      this.val = val;
    }
  }
  _ESClass.register(IntUniform);
  _es6_module.add_class(IntUniform);
  IntUniform = _es6_module.add_export('IntUniform', IntUniform);
  function initDebugGL(gl) {
    let addfuncs={}
    let makeDebugFunc=(k, k2) =>      {
      return function () {
        let ret=this[k2].apply(this, arguments);
        let err=this.getError();
        if (err!==0) {
            console.warn("gl."+k+":", constmap[err]);
        }
        return ret;
      }
    }
    for (let k in gl) {
        let v=gl[k];
        if (k!=="getError"&&typeof v==="function") {
            let k2="_"+k;
            addfuncs[k2] = v;
            gl[k] = makeDebugFunc(k, k2);
        }
    }
    for (let k in addfuncs) {
        gl[k] = addfuncs[k];
    }
    return gl;
  }
  initDebugGL = _es6_module.add_export('initDebugGL', initDebugGL);
  let _gl=undefined;
  function addFastParameterGet(gl) {
    let map={}
    gl._getParameter = gl.getParameter;
    gl._enable = gl.enable;
    gl._disable = gl.disable;
    gl._viewport = gl.viewport;
    gl._scissor = gl.scissor;
    gl._depthMask = gl.depthMask;
    let validkeys=new Set([gl.DEPTH_TEST, gl.MAX_VERTEX_ATTRIBS, gl.DEPTH_WRITEMASK, gl.SCISSOR_BOX, gl.VIEWPORT]);
    gl.depthMask = function (mask) {
      mask = !!mask;
      if (mask!==map[gl.DEPTH_WRITEMASK]) {
          map[gl.DEPTH_WRITEMASK] = mask;
          gl._depthMask(mask);
      }
    }
    gl.viewport = function (x, y, w, h) {
      if (map[gl.VIEWPORT]===undefined) {
          map[gl.VIEWPORT] = [x, y, w, h];
      }
      else {
        let box=map[gl.VIEWPORT];
        box[0] = x;
        box[1] = y;
        box[2] = w;
        box[3] = h;
      }
      return gl._viewport(x, y, w, h);
    }
    gl.scissor = function (x, y, w, h) {
      if (map[gl.SCISSOR_BOX]===undefined) {
          map[gl.SCISSOR_BOX] = [x, y, w, h];
      }
      else {
        let box=map[gl.SCISSOR_BOX];
        box[0] = x;
        box[1] = y;
        box[2] = w;
        box[3] = h;
      }
      return gl._scissor(x, y, w, h);
    }
    gl.enable = function (p) {
      if (p in map&&map[p]) {
          return ;
      }
      map[p] = true;
      return gl._enable(p);
    }
    gl.disable = function (p) {
      if (p in map&&!map[p]) {
          return ;
      }
      map[p] = false;
      gl._disable(p);
    }
    gl.getParameter = function (p) {
      if (p!==undefined&&!validkeys.has(p)) {
          return gl._getParameter(p);
      }
      if (p in map) {
          return map[p];
      }
      map[p] = this._getParameter(p);
      if (map[p]&&Array.isArray(map[p])) {
          let cpy=[];
          for (let item of map[p]) {
              cpy.push(item);
          }
          map[p] = cpy;
      }
      return map[p];
    }
  }
  addFastParameterGet = _es6_module.add_export('addFastParameterGet', addFastParameterGet);
  function onContextLost(e) {
    for (let k in shapes) {
        shapes[k].onContextLost(e);
    }
  }
  onContextLost = _es6_module.add_export('onContextLost', onContextLost);
  function init_webgl(canvas, params) {
    if (params===undefined) {
        params = {};
    }
    if (_gl!==undefined) {
        return _gl;
    }
    let webgl2=params.webgl2!==undefined ? params.webgl2 : true;
    let gl;
    if (webgl2) {
        gl = canvas.getContext("webgl2", params);
        gl.color_buffer_float = gl.getExtension("EXT_color_buffer_float");
    }
    else {
      gl = canvas.getContext("webgl", params);
      if (!gl.RGBA32F) {
          gl.RGBA32F = gl.RGBA;
          gl.RGBA8UI = gl.RGBA;
      }
      gl.getExtension("EXT_frag_depth");
      gl.color_buffer_float = gl.getExtension("WEBGL_color_buffer_float");
      gl.texture_float = gl.getExtension("OES_texture_float");
    }
    canvas.addEventListener("webglcontextlost", function (event) {
      event.preventDefault();
    }, false);
    canvas.addEventListener("webglcontextrestored", onContextLost, false);
    addFastParameterGet(gl);
    _gl = gl;
    gl.haveWebGL2 = webgl2;
    for (let k in gl) {
        let v=gl[k];
        if (typeof v=="number"||typeof v=="string") {
            constmap[v] = k;
        }
    }
    window._constmap = constmap;
    gl.texture_float = gl.getExtension("OES_texture_float_linear");
    gl.float_blend = gl.getExtension("EXT_float_blend");
    gl.getExtension("OES_standard_derivatives");
    gl.getExtension("ANGLE_instanced_arrays");
    gl.getExtension("WEBGL_lose_context");
    gl.draw_buffers = gl.getExtension("WEBGL_draw_buffers");
    gl.depth_texture = gl.getExtension("WEBGL_depth_texture");
    gl.shadercache = {}
    if (DEBUG.gl) {
        initDebugGL(gl);
    }
    return gl;
  }
  init_webgl = _es6_module.add_export('init_webgl', init_webgl);
  function format_lines(script) {
    var i=1;
    var lines=script.split("\n");
    var maxcol=Math.ceil(Math.log(lines.length)/Math.log(10))+1;
    var s="";
    for (var line of lines) {
        s+=""+i+":";
        while (s.length<maxcol) {
          s+=" ";
        }
        s+=line+"\n";
        i++;
    }
    return s;
  }
  function hashShader(sdef) {
    let hash;
    let clean={vertex: sdef.vertex, 
    fragment: sdef.fragment, 
    uniforms: sdef.uniforms, 
    attributes: sdef.attributes}
    let ret=JSON.stringify(clean);
    sdef.__hash = ret;
    return ret;
  }
  hashShader = _es6_module.add_export('hashShader', hashShader);
  function getShader(gl, shaderdef) {
    if (gl.shadercache===undefined) {
        gl.shadercache = {};
    }
    let hash=shaderdef.__hash!==undefined ? shaderdef.__hash : hashShader(shaderdef);
    if (hash in gl.shadercache) {
        return gl.shadercache[hash];
    }
    let shader=new ShaderProgram(gl, shaderdef.vertex, shaderdef.fragment, shaderdef.attributes);
    if (shaderdef.uniforms)
      shader.uniforms = shaderdef.uniforms;
    gl.shadercache[hash] = shader;
    return shader;
  }
  getShader = _es6_module.add_export('getShader', getShader);
  function loadShader(ctx, shaderId) {
    var shaderScript=document.getElementById(shaderId);
    if (!shaderScript) {
        shaderScript = {text: shaderId, 
      type: undefined};
        if (shaderId.trim().toLowerCase().startsWith("//vertex")) {
            shaderScript.type = "x-shader/x-vertex";
        }
        else 
          if (shaderId.trim().toLowerCase().startsWith("//fragment")) {
            shaderScript.type = "x-shader/x-fragment";
        }
        else {
          console.trace();
          console.log("Invalid shader type");
          console.log("================");
          console.log(format_lines(shaderScript));
          console.log("================");
          throw new Error("Invalid shader type for shader script;\n script must start with //vertex or //fragment");
        }
    }
    if (shaderScript.type=="x-shader/x-vertex")
      var shaderType=ctx.VERTEX_SHADER;
    else 
      if (shaderScript.type=="x-shader/x-fragment")
      var shaderType=ctx.FRAGMENT_SHADER;
    else {
      log("*** Error: shader script '"+shaderId+"' of undefined type '"+shaderScript.type+"'");
      return null;
    }
    if (ctx==undefined||ctx==null||ctx.createShader==undefined)
      console.trace();
    var shader=ctx.createShader(shaderType);
    ctx.shaderSource(shader, shaderScript.text);
    ctx.compileShader(shader);
    var compiled=ctx.getShaderParameter(shader, ctx.COMPILE_STATUS);
    if (!compiled&&!ctx.isContextLost()) {
        var error=ctx.getShaderInfoLog(shader);
        console.log(format_lines(shaderScript.text));
        console.log("\nError compiling shader: ", error);
        ctx.deleteShader(shader);
        return null;
    }
    return shader;
  }
  var _safe_arrays=[0, 0, new Float32Array(2), new Float32Array(3), new Float32Array(4)];
  let use_ml_array=false;
  use_ml_array = _es6_module.add_export('use_ml_array', use_ml_array);
  class ShaderProgram  {
     constructor(gl, vertex, fragment, attributes) {
      this.vertexSource = vertex;
      this.fragmentSource = fragment;
      this.attrs = [];
      this.multilayer_programs = {};
      for (var a of attributes) {
          this.attrs.push(a);
      }
      this.defines = {};
      this._use_def_shaders = true;
      this._def_shaders = {};
      this.multilayer_attrs = {};
      this.rebuild = 1;
      this.uniformlocs = {};
      this.attrlocs = {};
      this.uniform_defaults = {};
      this.uniforms = {};
      this.gl = gl;
    }
    static  insertDefine(define, code) {
      code = code.trim().split("\n");
      if (code.length>3) {
          code = code.slice(0, 3).concat([define]).concat(code.slice(3, code.length));
      }
      else {
        code = code.concat([define]);
      }
      return code.join("\n")+"\n";
    }
    static  _use_ml_array() {
      return use_ml_array;
    }
    static  multilayerAttrSize(attr) {
      return attr.toUpperCase()+"_SIZE";
    }
    static  multilayerGet(attr, i) {
      if (this._use_ml_array()) {
          return `${attr}_layers[${i}]`;
      }
      else {
        return `get_${attr}_layer(i)`;
      }
    }
    static  maxMultilayer() {
      return 8;
    }
    static  multilayerAttrDeclare(attr, type, is_fragment, is_glsl_300) {
      let keyword, keyword2;
      if (is_fragment) {
          keyword = is_glsl_300 ? 'in' : "attribute";
          keyword2 = is_glsl_300 ? 'in' : "varying";
      }
      else {
        keyword = is_glsl_300 ? 'in' : "attribute";
        keyword2 = is_glsl_300 ? 'out' : "varying";
      }
      let size=this.multilayerAttrSize(attr);
      if (this._use_ml_array()) {
          let ret=`
#ifndef ${size}_DECLARE
#define ${size} 1
#endif

//${size}_DECLARE
#define ${attr} ${attr}_layers[0]\n`;
          if (!is_fragment) {
              ret+=`${keyword} ${type} ${attr}_layers[${size}];\n`;
          }
          ret+=`${keyword2} ${type} v${attr}_layers[${size}];\n`;
          return ret;
      }
      let ret=`
#ifndef ${size}_DECLARE
#define ${size} 1
#endif
//${size}_DECLARE\n`;
      if (!is_fragment) {
          ret+=`${keyword} ${type} ${attr};\n`;
      }
      ret+=`    
${keyword2} ${type} v${attr};
    `;
      let func=`
${type} get_${attr}_layer(int i) {
  switch (i) {
    case 0:
      return ${attr}

    `;
      for (let i=0; i<this.maxMultilayer(); i++) {
          ret+=`
      #if ${size} > ${i+1}\n`;
          if (!is_fragment) {
              ret+=`${keyword} ${type} ${attr}_${i+2};\n`;
          }
          ret+=`${keyword2} ${type} v${attr}_${i+2};
      #endif
      `;
          if (i===0) {
              continue;
          }
          func+=`
    case ${i}:
#if ${size} > ${i+1} 
      return ${attr}_${i+2};
      break;
#endif
      `;
      }
      func+='  }\n}\n';
      return ret;
    }
    static  multiLayerAttrKey(attr, i, use_glsl300) {
      if (!this._use_ml_array()) {
          return i ? `${attr}_${i}` : attr;
      }
      else {
        return `${attr}_layers[${i}]`;
      }
    }
    static  multilayerVertexCode(attr) {
      let size=this.multilayerAttrSize(attr);
      let ret=`

v${attr} = ${attr};
#if ${size} > 1

    `;
      for (let i=1; i<this.maxMultilayer; i++) {
          if (this._use_ml_array()) {
              ret+=`
#if ${size} >= ${i}
  v${attr}_layers[{i}] = ${attr}_layers[${i}];
#endif
      `;
          }
          else {
            ret+=`
#if ${size} >= ${i}
  v${attr}_${i+2} = ${attr}_${i+2};
#endif
      `;
          }
      }
      ret+='#endif\n';
      return ret;
    }
     setAttributeLayerCount(attr, n) {
      if (n<=1&&attr in this.multilayer_attrs) {
          delete this.multilayer_attrs[attr];
      }
      else {
        this.multilayer_attrs[attr] = n;
      }
      return this;
    }
     init(gl) {
      this.gl = gl;
      this.rebuild = false;
      let vshader=this.vertexSource, fshader=this.fragmentSource;
      if (!this._use_def_shaders) {
          let defs='';
          for (let k in this.defines) {
              let v=this.defines[k];
              if (v===undefined||v===null||v==="") {
                  defs+=`#define ${k}\n`;
              }
              else {
                defs+=`#define ${k} ${v}\n`;
              }
          }
          if (defs!=='') {
              vshader = this.constructor.insertDefine(defs, vshader);
              fshader = this.constructor.insertDefine(defs, fshader);
              this._vertexSource = vshader;
              this._fragmentSource = fshader;
          }
      }
      function loadShader(shaderType, code) {
        var shader=gl.createShader(shaderType);
        gl.shaderSource(shader, code);
        gl.compileShader(shader);
        let compiled=gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled&&!gl.isContextLost()) {
            var error=gl.getShaderInfoLog(shader);
            console.log(format_lines(code));
            console.log("\nError compiling shader: ", error);
            gl.deleteShader(shader);
            return null;
        }
        return shader;
      }
      let vertexShader=loadShader(gl.VERTEX_SHADER, vshader);
      let fragmentShader=loadShader(gl.FRAGMENT_SHADER, fshader);
      let program=gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      let attribs=this.attrs;
      let li=0;
      for (let i=0; i<attribs.length; ++i) {
          let attr=attribs[i];
          if (attr in this.multilayer_attrs) {
              let count=this.multilayer_attrs[attr];
              for (let j=0; j<count; j++) {
                  let key=this.constructor.multiLayerAttrKey(attr, j, gl.haveWebGL2);
                  gl.bindAttribLocation(program, li++, key);
              }
          }
          else {
            gl.bindAttribLocation(program, li++, attribs[i]);
          }
      }
      gl.linkProgram(program);
      let linked=gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!linked&&!gl.isContextLost()) {
          let error=gl.getProgramInfoLog(program);
          console.log("\nVERTEX:\n"+format_lines(vshader));
          console.log("\nFRAGMENT\n:"+format_lines(fshader));
          console.log("Error in program linking:"+error);
          gl.deleteProgram(program);
          return null;
      }
      this.program = program;
      this.gl = gl;
      this.vertexShader = vertexShader;
      this.fragmentShader = fragmentShader;
      this.attrlocs = {};
      this.uniformlocs = {};
      this.uniforms = {};
      for (var i=0; i<attribs.length; i++) {
          this.attrlocs[attribs[i]] = i;
      }
    }
    static  load_shader(scriptid, attrs) {
      var script=document.getElementById(scriptid);
      var text=script.text;
      var ret=new ShaderProgram(undefined, undefined, undefined, ["position", "normal", "uv", "color", "id"]);
      var lowertext=text.toLowerCase();
      var vshader=text.slice(0, lowertext.search("//fragment"));
      var fshader=text.slice(lowertext.search("//fragment"), text.length);
      ret.vertexSource = vshader;
      ret.fragmentSource = fshader;
      ret.ready = true;
      ret.promise = new Promise(function (accept, reject) {
        accept(ret);
      });
      ret.then = function () {
        return this.promise.then.apply(this.promise, arguments);
      };
      return ret;
    }
     on_gl_lost(newgl) {
      this.rebuild = 1;
      this.gl = newgl;
      this.program = undefined;
      this.uniformlocs = {};
    }
     destroy(gl) {
      if (gl&&this.program) {
          gl.deleteProgram(this.program);
          this.uniforms = {};
          this.program = undefined;
      }
    }
     uniformloc(name) {
      if (this.uniformlocs[name]==undefined) {
          this.uniformlocs[name] = this.gl.getUniformLocation(this.program, name);
      }
      return this.uniformlocs[name];
    }
     attrloc(name) {
      return this.attrLocation(name);
    }
     attrLoc(name) {
      if (!(name in this.attrlocs)) {
          this.attrlocs[name] = this.gl.getAttribLocation(this.program, name);
      }
      return this.attrlocs[name];
    }
     calcDefKey(extraDefines) {
      let key="";
      for (let i=0; i<2; i++) {
          let defs=i ? extraDefines : this.defines;
          if (!defs) {
              continue;
          }
          for (let k in defs) {
              let v=defs[k];
              key+=k;
              if (v!==null&&v!==undefined&&v!=="") {
                  key+=":"+v;
              }
          }
      }
      return key;
    }
     bindMultiLayer(gl, uniforms, attrsizes, attributes) {
      let key="";
      for (let k in attrsizes) {
          key+=k+":"+attrsizes[k]+":";
      }
      if (key in this.multilayer_programs) {
          let shader=this.multilayer_programs[key];
          shader.defines = this.defines;
          return shader.bind(gl, uniforms, attributes);
      }
      let shader=this.copy();
      for (let k in attrsizes) {
          let i=attrsizes[k];
          if (i>1) {
              shader.multilayer_attrs[k] = i;
          }
          let size=this.constructor.multilayerAttrSize(k);
          let define=`#define ${size} ${i}`;
          shader.vertexSource = shader.vertexSource.replace("//"+size+"_DECLARE", define);
          shader.fragmentSource = shader.fragmentSource.replace("//"+size+"_DECLARE", define);
      }
      this.multilayer_programs[key] = shader;
      return shader.bind(gl, uniforms, attributes);
    }
     copy() {
      let ret=new ShaderProgram(this.gl, this.vertexSource, this.fragmentSource, this.attrs);
      ret.uniforms = this.uniforms;
      ret.defines = Object.assign({}, this.defines);
      return ret;
    }
     bind(gl, uniforms, attributes) {
      this.gl = gl;
      let defines=undefined;
      if (attributes&&this._use_def_shaders) {
          for (let k in attributes) {
              let key="HAVE_"+k.toUpperCase();
              if (!defines) {
                  defines = {};
              }
              defines[key] = null;
          }
      }
      if (this._use_def_shaders) {
          let key=this.calcDefKey(defines);
          if (key!=="") {
              if (!(key in this._def_shaders)) {
                  let shader=this.copy();
                  if (defines) {
                      for (let k in defines) {
                          shader.defines[k] = defines[k];
                      }
                  }
                  shader._use_def_shaders = false;
                  this._def_shaders[key] = shader;
              }
              return this._def_shaders[key].bind(gl, uniforms);
          }
      }
      if (this.rebuild) {
          this.init(gl);
          if (this.rebuild)
            return false;
      }
      if (!this.program) {
          return false;
      }
      function setv(dst, src, n) {
        for (var i=0; i<n; i++) {
            dst[i] = src[i];
        }
      }
      let slot_i=0;
      gl.useProgram(this.program);
      this.gl = gl;
      for (var i=0; i<2; i++) {
          var us=i ? uniforms : this.uniforms;
          if (uniforms===undefined) {
              continue;
          }
          for (var k in us) {
              var v=us[k];
              var loc=this.uniformloc(k);
              if (loc===undefined) {
                  continue;
              }
              if (__instance_of(v, IntUniform)) {
                  gl.uniform1i(loc, v.val);
              }
              else 
                if (__instance_of(v, Texture)) {
                  let slot=v.texture_slot;
                  if (slot===undefined) {
                      slot = slot_i++;
                  }
                  v.bind(gl, this.uniformloc(k), slot);
              }
              else 
                if (__instance_of(v, Array)||__instance_of(v, Float32Array)||__instance_of(v, Float64Array)) {
                  switch (v.length) {
                    case 2:
                      var arr=_safe_arrays[2];
                      setv(arr, v, 2);
                      gl.uniform2fv(loc, arr);
                      break;
                    case 3:
                      var arr=_safe_arrays[3];
                      setv(arr, v, 3);
                      gl.uniform3fv(loc, arr);
                      break;
                    case 4:
                      var arr=_safe_arrays[4];
                      setv(arr, v, 4);
                      gl.uniform4fv(loc, arr);
                      break;
                    default:
                      console.log(v);
                      throw new Error("invalid array");
                      break;
                  }
              }
              else 
                if (__instance_of(v, Matrix4)) {
                  v.setUniform(gl, loc);
              }
              else 
                if (typeof v=="number") {
                  gl.uniform1f(loc, v);
              }
              else 
                if (v!==undefined&&v!==null) {
                  console.warn("Invalid uniform", k, v);
                  throw new Error("Invalid uniform");
              }
          }
      }
      return this;
    }
  }
  _ESClass.register(ShaderProgram);
  _es6_module.add_class(ShaderProgram);
  ShaderProgram = _es6_module.add_export('ShaderProgram', ShaderProgram);
  window._ShaderProgram = ShaderProgram;
  const GL_ARRAY_BUFFER=34962;
  const GL_ELEMENT_ARRAY_BUFFER=34963;
  class VBO  {
     constructor(gl, vbo, size=-1, bufferType=GL_ARRAY_BUFFER) {
      this.gl = gl;
      this.vbo = vbo;
      this.size = size;
      this.bufferType = bufferType;
      this.ready = false;
      this.lastData = undefined;
      this.dead = false;
      this.drawhint = undefined;
      this.lastData = undefined;
    }
     get(gl) {
      if (this.dead) {
          throw new Error("vbo is dead");
      }
      if (gl!==undefined&&gl!==this.gl) {
          this.ready = false;
          this.gl = gl;
          this.vbo = gl.createBuffer();
          console.warn("context loss detected");
      }
      if (!this.ready) {
          console.warn("buffer was not ready; forgot to call .uploadData?");
      }
      if (!this.vbo) {
          throw new Error("webgl error");
      }
      return this.vbo;
    }
     checkContextLoss(gl) {
      if (gl!==undefined&&gl!==this.gl) {
          this.ready = false;
          this.gl = gl;
          this.vbo = gl.createBuffer();
          console.warn("context loss detected");
          if (this.lastData!==undefined) {
              this.uploadData(gl, this.lastData, this.bufferType, this.drawhint);
          }
      }
    }
     reset(gl) {
      if (this.dead) {
          this.dead = false;
          this.gl = gl;
          this.vbo = gl.createBuffer();
          console.log("vbo creation");
      }
      this.ready = false;
      this.lastData = undefined;
      return this;
    }
     destroy(gl) {
      if (this.dead) {
          console.warn("tried to kill vbo twice");
          return ;
      }
      this.ready = false;
      gl.deleteBuffer(this.vbo);
      this.vbo = undefined;
      this.lastData = undefined;
      this.gl = undefined;
      this.dead = true;
    }
     uploadData(gl, dataF32, target=this.bufferType, drawhint=gl.STATIC_DRAW) {
      if (gl!==this.gl) {
          this.gl = gl;
          this.vbo = gl.createBuffer();
          this.size = -1;
          console.warn("Restoring VBO after context loss");
      }
      let useSub=this.size===dataF32.length&&this.vbo;
      this.lastData = dataF32;
      this.size = dataF32.length;
      this.drawhint = drawhint;
      gl.bindBuffer(target, this.vbo);
      if (useSub) {
          gl.bufferSubData(target, 0, dataF32);
      }
      else {
        if (DEBUG.simplemesh) {
            console.warn("bufferData");
        }
        gl.bufferData(target, dataF32, drawhint);
      }
      this.ready = true;
    }
  }
  _ESClass.register(VBO);
  _es6_module.add_class(VBO);
  VBO = _es6_module.add_export('VBO', VBO);
  class RenderBuffer  {
     constructor() {
      this._layers = {};
    }
     get(gl, name, bufferType=gl.ARRAY_BUFFER) {
      if (this[name]!==undefined) {
          return this[name];
      }
      let buf=gl.createBuffer();
      let vbo=new VBO(gl, buf, undefined, bufferType);
      this._layers[name] = vbo;
      this[name] = vbo;
      return vbo;
    }
    get  buffers() {
      let this2=this;
      return (function* () {
        for (let k in this2._layers) {
            yield this2._layers[k];
        }
      })();
    }
     reset(gl) {
      for (let vbo of this.buffers) {
          vbo.reset(gl);
      }
    }
     destroy(gl, name) {
      if (name===undefined) {
          for (let k in this._layers) {
              this._layers[k].destroy(gl);
              delete this._layers[name];
              delete this[name];
          }
      }
      else {
        if (this._layers[name]===undefined) {
            console.trace("WARNING: gl buffer not in RenderBuffer!", name, gl);
            return ;
        }
        this._layers[name].destroy(gl);
        delete this._layers[name];
        delete this[name];
      }
    }
  }
  _ESClass.register(RenderBuffer);
  _es6_module.add_class(RenderBuffer);
  RenderBuffer = _es6_module.add_export('RenderBuffer', RenderBuffer);
  class Texture  {
     constructor(texture_slot, texture, target=3553) {
      this.texture = texture;
      this.texture_slot = texture_slot;
      this.target = target;
      this.createParams = {target: TEXTURE_2D};
      this.createParamsList = [TEXTURE_2D];
      this._params = {};
    }
    static  unbindAllTextures(gl) {
      for (let i=gl.TEXTURE0; i<gl.TEXTURE0+31; i++) {
          gl.activeTexture(i);
          gl.bindTexture(gl.TEXTURE_2D, null);
      }
    }
     texParameteri(gl, target, param, value) {
      this._params[param] = value;
      gl.texParameteri(target, param, value);
      return this;
    }
     getParameter(gl, param) {
      return this._params[param];
    }
     _texImage2D1(gl, target, level, internalformat, format, type, source) {
      gl.bindTexture(target, this.texture);
      gl.texImage2D(target, level, internalformat, format, type, source);
      gl.getError();
      this.createParams = {target: target, 
     level: level, 
     internalformat: internalformat, 
     format: format, 
     type: type, 
     source: source};
      this.createParamsList = [target, level, internalformat, format, type, source];
      if (__instance_of(source, Image)||__instance_of(source, ImageData)) {
          this.createParams.width = source.width;
          this.createParams.height = source.height;
      }
      return this;
    }
     _texImage2D2(gl, target, level, internalformat, width, height, border, format, type, source) {
      gl.bindTexture(target, this.texture);
      gl.getError();
      gl.texImage2D(target, level, internalformat, width, height, border, format, type, source);
      this.createParams = {target: target, 
     level: level, 
     internalformat: internalformat, 
     format: format, 
     type: type, 
     source: source, 
     width: width, 
     height: height, 
     border: border};
      this.createParamsList = [target, level, internalformat, format, type, source, width, height, border];
      gl.getError();
      return this;
    }
     texImage2D() {
      if (arguments.length===7) {
          return this._texImage2D1(...arguments);
      }
      else {
        return this._texImage2D2(...arguments);
      }
    }
     copy(gl, copy_data=false) {
      let tex=new Texture();
      tex.texture = gl.createTexture();
      tex.createParams = Object.assign({}, this.createParams);
      tex.createParamsList = this.createParamsList.concat([]);
      tex.texture_slot = this.texture_slot;
      gl.bindTexture(this.createParams.target, tex.texture);
      if (!copy_data) {
          let p=this.createParams;
          tex.texImage2D(p.target, p.level, p.internalformat, p.format, p.type, null);
          gl.getError();
      }
      else {
        this.copyTexTo(gl, tex);
      }
      for (let k in this._params) {
          let key=parseInt(k);
          let val=this._params[key];
          gl.texParameteri(this.createParams.target, key, val);
          gl.getError();
      }
      return tex;
    }
     copyTexTo(gl, b) {
      if (this.texture===undefined) {
          return ;
      }
      let p=this.createParams;
      gl.bindTexture(p.target, b.texture);
      b.texImage2D(gl, p.target, p.level, p.internalformat, p.width, p.height, p.border, p.format, p.type, this.texture);
      gl.getError();
      return this;
    }
     destroy(gl) {
      gl.deleteTexture(this.texture);
    }
     load(gl, width, height, data, target=gl.TEXTURE_2D) {
      if (!this.texture) {
          this.texture = gl.createTexture();
      }
      gl.bindTexture(target, this.texture);
      if (__instance_of(data, Float32Array)) {
          gl.texImage2D(target, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, data);
      }
      else {
        gl.texImage2D(target, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      }
      gl.getError();
      Texture.defaultParams(gl, this, target);
      gl.getError();
      return this;
    }
     initEmpty(gl, target, width, height, format=gl.RGBA, type=gl.FLOAT) {
      this.target = target;
      if (!this.texture) {
          this.texture = gl.createTexture();
          Texture.defaultParams(gl, this.texture, target);
      }
      gl.bindTexture(this.texture);
      gl.texImage2D(this.target, 0, format, width, height, 0, format, type, null);
      return this;
    }
    static  load(gl, width, height, data, target=gl.TEXTURE_2D) {
      return new Texture(0).load(...arguments);
    }
    static  defaultParams(gl, tex, target=gl.TEXTURE_2D) {
      if (!(__instance_of(tex, Texture))) {
          console.warn("Depracated call to Texture.defaultParams with 'tex' a raw WebGLTexture instance instance of wrapper webgl.Texture object");
          tex = new Texture(undefined, tex);
      }
      gl.bindTexture(target, tex.texture);
      tex.texParameteri(gl, target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      tex.texParameteri(gl, target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      tex.texParameteri(gl, target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      tex.texParameteri(gl, target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
     bind(gl, uniformloc, slot=this.texture_slot) {
      gl.activeTexture(gl.TEXTURE0+slot);
      gl.bindTexture(this.target, this.texture);
      gl.uniform1i(uniformloc, slot);
    }
  }
  _ESClass.register(Texture);
  _es6_module.add_class(Texture);
  Texture = _es6_module.add_export('Texture', Texture);
  class CubeTexture extends Texture {
     constructor(texture_slot, texture) {
      super();
      this.texture = texture;
      this.texture_slot = texture_slot;
    }
     bind(gl, uniformloc, slot=this.texture_slot) {
      gl.activeTexture(gl.TEXTURE0+slot);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
      gl.uniform1i(uniformloc, slot);
    }
  }
  _ESClass.register(CubeTexture);
  _es6_module.add_class(CubeTexture);
  CubeTexture = _es6_module.add_export('CubeTexture', CubeTexture);
  class DrawMats  {
     constructor() {
      this.isPerspective = true;
      this.cameramat = new Matrix4();
      this.persmat = new Matrix4();
      this.rendermat = new Matrix4();
      this.normalmat = new Matrix4();
      this.icameramat = new Matrix4();
      this.ipersmat = new Matrix4();
      this.irendermat = new Matrix4();
      this.inormalmat = new Matrix4();
    }
     regen_mats(aspect=this.aspect) {
      this.aspect = aspect;
      this.rendermat.load(this.persmat).multiply(this.cameramat);
      this.normalmat.load(this.cameramat).makeRotationOnly();
      this.icameramat.load(this.cameramat).invert();
      this.ipersmat.load(this.persmat).invert();
      this.irendermat.load(this.rendermat).invert();
      this.inormalmat.load(this.normalmat).invert();
      return this;
    }
     toJSON() {
      return {cameramat: this.cameramat.getAsArray(), 
     persmat: this.persmat.getAsArray(), 
     rendermat: this.rendermat.getAsArray(), 
     normalmat: this.normalmat.getAsArray(), 
     isPerspective: this.isPerspective, 
     icameramat: this.icameramat.getAsArray(), 
     ipersmat: this.ipersmat.getAsArray(), 
     irendermat: this.irendermat.getAsArray(), 
     inormalmat: this.inormalmat.getAsArray()}
    }
     loadJSON(obj) {
      this.cameramat.load(obj.cameramat);
      this.persmat.load(obj.persmat);
      this.rendermat.load(obj.rendermat);
      this.normalmat.load(obj.normalmat);
      this.isPerspective = obj.isPerspective;
      this.icameramat.load(obj.icameramat);
      this.ipersmat.load(obj.ipersmat);
      this.irendermat.load(obj.irendermat);
      this.inormalmat.load(obj.inormalmat);
      return this;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(DrawMats);
  _es6_module.add_class(DrawMats);
  DrawMats = _es6_module.add_export('DrawMats', DrawMats);
  DrawMats.STRUCT = `
DrawMats {
  cameramat     : mat4;
  persmat       : mat4;
  rendermat     : mat4;
  normalmat     : mat4;
  icameramat    : mat4;
  ipersmat      : mat4;
  irendermat    : mat4;
  inormalmat    : mat4;
  isPerspective : int;
}
`;
  nstructjs.manager.add_class(DrawMats);
  class Camera extends DrawMats {
     constructor() {
      super();
      this.isPerspective = true;
      this.fovy = 35;
      this.aspect = 1.0;
      this.pos = new Vector3([0, 0, 5]);
      this.target = new Vector3();
      this.orbitTarget = new Vector3();
      this.up = new Vector3([1, 3, 0]);
      this.up.normalize();
      this.near = 0.25;
      this.far = 10000.0;
    }
     generateUpdateHash(objectMatrix=undefined) {
      let mul=1<<18;
      let ret=0;
      function add(val) {
        val = (val*mul)&((1<<31)-1);
        ret = (ret^val)&((1<<31)-1);
      }
      add(this.near);
      add(this.far);
      add(this.fovy);
      add(this.aspect);
      add(this.isPerspective);
      add(this.pos[0]);
      add(this.pos[1]);
      add(this.pos[2]);
      add(this.target[0]);
      add(this.target[1]);
      add(this.target[2]);
      add(this.up[0]);
      add(this.up[1]);
      add(this.up[2]);
      if (objectMatrix!==undefined) {
          let m=objectMatrix.$matrix;
          add(m.m11);
          add(m.m12);
          add(m.m13);
          add(m.m21);
          add(m.m22);
          add(m.m23);
          add(m.m31);
          add(m.m32);
          add(m.m33);
      }
      return ret;
    }
     load(b) {
      this.isPerspective = b.isPerspective;
      this.fovy = b.fovy;
      this.aspect = b.aspect;
      this.pos.load(b.pos);
      this.orbitTarget.load(b.orbitTarget);
      this.target.load(b.target);
      this.up.load(b.up);
      this.near = b.near;
      this.far = b.far;
      this.regen_mats(this.aspect);
      return this;
    }
     copy() {
      let ret=new Camera();
      ret.isPerspective = this.isPerspective;
      ret.fovy = this.fovy;
      ret.aspect = this.aspect;
      ret.pos.load(this.pos);
      ret.target.load(this.target);
      ret.orbitTarget.load(this.orbitTarget);
      ret.up.load(this.up);
      ret.near = this.near;
      ret.far = this.far;
      ret.regen_mats(ret.aspect);
      return ret;
    }
     reset() {
      this.pos = new Vector3([0, 0, 5]);
      this.target = new Vector3();
      this.up = new Vector3([1, 3, 0]);
      this.up.normalize();
      this.regen_mats(this.aspect);
      window.redraw_all();
      return this;
    }
     toJSON() {
      var ret=super.toJSON();
      ret.fovy = this.fovy;
      ret.near = this.near;
      ret.far = this.far;
      ret.aspect = this.aspect;
      ret.target = this.target.slice(0);
      ret.pos = this.pos.slice(0);
      ret.up = this.up.slice(0);
      return ret;
    }
     loadJSON(obj) {
      super.loadJSON(obj);
      this.fovy = obj.fovy;
      this.near = obj.near;
      this.far = obj.far;
      this.aspect = obj.aspect;
      this.target.load(obj.target);
      this.pos.load(obj.pos);
      this.up.load(obj.up);
      return this;
    }
     regen_mats(aspect=this.aspect) {
      this.aspect = aspect;
      this.persmat.makeIdentity();
      if (this.isPerspective) {
          this.persmat.perspective(this.fovy, aspect, this.near, this.far);
      }
      else {
        this.persmat.isPersp = true;
        let scale=1.0/this.pos.vectorDistance(this.target);
        this.persmat.makeIdentity();
        this.persmat.orthographic(scale, aspect, this.near, this.far);
      }
      this.cameramat.makeIdentity();
      this.cameramat.lookat(this.pos, this.target, this.up);
      this.cameramat.invert();
      this.rendermat.load(this.persmat).multiply(this.cameramat);
      super.regen_mats(aspect);
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(Camera);
  _es6_module.add_class(Camera);
  Camera = _es6_module.add_export('Camera', Camera);
  Camera.STRUCT = STRUCT.inherit(Camera, DrawMats)+`
  fovy          : float;
  aspect        : float;
  target        : vec3;
  orbitTarget   : vec3;
  pos           : vec3;
  up            : vec3;
  near          : float;
  far           : float;
  isPerspective : bool;
}
`;
  nstructjs.manager.add_class(Camera);
}, '/dev/fairmotion/src/webgl/webgl.js');


es6_module_define('fbo', ["./simplemesh.js", "../path.ux/scripts/pathux.js", "./webgl.js"], function _fbo_module(_es6_module) {
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  var Vector3=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector3');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Matrix4');
  var Vector4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Quat');
  var Vector2=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector2');
  var simplemesh=es6_import(_es6_module, './simplemesh.js');
  var webgl=es6_import(_es6_module, './webgl.js');
  var Texture=es6_import_item(_es6_module, './webgl.js', 'Texture');
  let DEPTH24_STENCIL8=35056;
  let RGBA32F=34836;
  let FLOAT=5126;
  let fbo_idgen=1;
  class FBO  {
     constructor(gl, width=512, height=512) {
      this.target = gl!==undefined ? gl.TEXTURE_2D : 3553;
      this.type = FLOAT;
      this.gl = gl;
      this.fbo = undefined;
      this.regen = true;
      this.id = "fbo"+(fbo_idgen++);
      this.deleteColor = false;
      this.deleteDepth = false;
      this.width = ~~width;
      this.height = ~~height;
      this.texColor = undefined;
      this.texDepth = undefined;
      this._last_viewport = undefined;
      this._last_scissor = undefined;
    }
     bind(gl) {
      this._last_viewport = gl.getParameter(gl.VIEWPORT);
      this._last_scissor = gl.getParameter(gl.SCISSOR_BOX);
      gl = this.gl = gl===undefined ? this.gl : gl;
      if (this.regen) {
          this.create(gl);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.viewport(0, 0, this.size[0], this.size[1]);
      gl.scissor(0, 0, this.size[0], this.size[1]);
    }
     drawQuadScaled(gl, width=this.width, height=this.height, tex=this.texColor, value_scale=1.0, depth=this.texDepth) {
      let quad=this._getQuad(gl, width, height);
      quad.program = this.blitshader;
      quad.uniforms.rgba = tex;
      quad.uniforms.depth = depth;
      quad.uniforms.valueScale = value_scale;
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      this.smesh.draw(gl);
    }
     drawQuad(gl, width=this.width, height=this.height, tex=this.texColor, depth=this.texDepth, program=undefined, uniforms=undefined) {
      let quad=this._getQuad(gl, width, height, program);
      if (program) {
          quad.program = program;
      }
      else {
        quad.program = this.blitshader;
      }
      quad.uniforms.rgba = tex;
      quad.uniforms.depth = depth;
      quad.uniforms.valueScale = 1.0;
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      this.smesh.draw(gl, uniforms);
    }
     _getQuad(gl, width, height, program) {
      width = ~~width;
      height = ~~height;
      if (this.smesh===undefined||this.size[0]!==width||this.size[1]!==height) {
          let lf=simplemesh.LayerTypes;
          this.smesh = new simplemesh.SimpleMesh(lf.LOC|lf.UV);
          let quad=this.smesh.quad([-1, -1, 0], [-1, 1, 0], [1, 1, 0], [1, -1, 0]);
          quad.uvs([0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]);
      }
      if (program) {
          this.smesh.program = program;
      }
      else {
        this.smesh.program = this.blitshader = webgl.getShader(gl, getBlitShaderCode(gl));
      }
      return this.smesh;
    }
     update(gl, width, height) {
      width = ~~width;
      height = ~~height;
      if (width!==this.width||height!==this.height) {
          this.width = width;
          this.height = height;
          this.regen = true;
      }
      if (this.regen) {
          this.create(gl);
      }
    }
     create(gl) {
      console.warn("Creating new fbo", this.width, this.height, this.id);
      this.regen = false;
      if (!this.texColor) {
          this.deleteColor = true;
          this.texColor = new Texture();
          this.texColor.initEmpty(gl, gl.TEXTURE_2D, this.width, this.height, gl.RGBA, this.type);
      }
      if (!this.texDepth) {
          this.deleteDepth = true;
          this.texDepth = new Texture();
          this.texDepth.initEmpty(gl, gl.TEXTURE_2D, this.width, this.height, gl.DEPTH_STENCIL, gl.UNSIGNED_INT_24_8);
      }
      let fbo=gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texColor.texture, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, this.texDepth.texture, 0);
    }
     unbind(gl) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      let sb=this._last_scissor;
      let vb=this._last_viewport;
      if (!vb) {
          return ;
      }
      gl.scissor(sb[0], sb[1], sb[2], sb[3]);
      gl.viewport(vb[0], vb[1], vb[2], vb[3]);
    }
     destroy() {
      if (this.fbo!==undefined) {
          this.gl.deleteFramebuffer(this.fbo);
          if (this.deleteColor&&this.texColor) {
              this.gl.deleteTexture(this.texColor.texture);
              this.texColor = undefined;
          }
          if (this.deleteDepth&&this.texDepth) {
              this.gl.deleteTexture(this.texDepth.texture);
              this.texDepth = undefined;
          }
          this.regen = true;
          this.fbo = undefined;
      }
    }
  }
  _ESClass.register(FBO);
  _es6_module.add_class(FBO);
  FBO = _es6_module.add_export('FBO', FBO);
  class oldFBO  {
     constructor(gl, width=512, height=512) {
      this.target = gl!==undefined ? gl.TEXTURE_2D : 3553;
      this.layer = undefined;
      this.ctype = RGBA32F;
      this.dtype = DEPTH24_STENCIL8;
      this.etype = FLOAT;
      this.gl = gl;
      this.fbo = undefined;
      this.regen = true;
      this.size = new Vector2([width, height]);
      this.texDepth = undefined;
      this.texColor = undefined;
    }
     getBlitShader(gl) {
      return webgl.getShader(gl, getBlitShaderCode(gl));
    }
     copy(copy_buffers=false) {
      let ret=new FBO();
      ret.size = new Vector2(this.size);
      ret.gl = this.gl;
      if (!copy_buffers||!this.gl||!this.fbo) {
          return ret;
      }
      ret.create(this.gl);
      let gl=this.gl;
      return ret;
    }
     create(gl, texColor=undefined, texDepth=undefined) {
      console.warn("fbo create");
      if (this.fbo&&this.gl) {
          this.destroy();
      }
      this.regen = 0;
      gl = this.gl = gl===undefined ? this.gl : gl;
      this.size[0] = ~~this.size[0];
      this.size[1] = ~~this.size[1];
      this.fbo = gl.createFramebuffer();
      this.texColor = texColor;
      this.texDepth = texDepth;
      let haveColor=!!this.texColor;
      let haveDepth=!!this.texDepth;
      if (!this.texDepth)
        this.texDepth = new webgl.Texture(undefined, gl.createTexture());
      if (!this.texColor)
        this.texColor = new webgl.Texture(undefined, gl.createTexture());
      let target=this.target;
      let layer=this.layer;
      function texParams(target, tex) {
        gl.bindTexture(target, tex.texture);
        tex.texParameteri(gl, target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        tex.texParameteri(gl, target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        tex.texParameteri(gl, target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        tex.texParameteri(gl, target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (target!==gl.TEXTURE_2D) {
            tex.texParameteri(gl, target, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        }
      }
      if (!haveDepth) {
          texParams(this.target, this.texDepth);
          if (gl.haveWebGL2) {
              this.texDepth.texParameteri(gl, this.target, gl.TEXTURE_COMPARE_MODE, gl.NONE);
          }
      }
      if (!haveColor) {
          texParams(this.target, this.texColor);
      }
      let initTex=(tex, dtype, dtype2, dtype3) =>        {
        if (this.target!==gl.TEXTURE_2D)
          return ;
        if (gl.haveWebGL2) {
            tex.texImage2D(gl, this.target, 0, dtype, this.size[0], this.size[1], 0, dtype2, dtype3, null);
        }
        else {
          tex.texImage2D(gl, this.target, 0, dtype, this.size[0], this.size[1], 0, dtype2, dtype3, null);
        }
      };
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      let dtype=this.dtype;
      let dtype2=gl.DEPTH_STENCIL;
      let dtype3=gl.UNSIGNED_INT_24_8;
      gl.bindTexture(this.target, this.texDepth.texture);
      if (!haveDepth) {
          initTex(this.texDepth, dtype, dtype2, dtype3);
      }
      let ctype=this.ctype;
      let ctype2=gl.RGBA, ctype3=this.etype;
      gl.bindTexture(target, this.texColor.texture);
      if (!haveColor) {
          initTex(this.texColor, ctype, ctype2, ctype3);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      if (this.target===gl.TEXTURE_2D) {
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texColor.texture, 0);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, this.texDepth.texture, 0);
      }
      else {
        let target2=target;
        if (target===gl.TEXTURE_CUBE_MAP) {
            target2 = layer;
        }
        if (DEBUG.fbo) {
            console.log("TARGET2", target2);
        }
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, target2, this.texColor.texture, 0);
        if (target===gl.TEXTURE_2D) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, target2, this.texDepth.texture, 0);
        }
        else {
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, target2, this.texDepth.texture, 0);
        }
      }
      let errret=gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (DEBUG.fbo) {
          console.log("FBO STATUS:", errret, webgl.constmap[errret]);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
     setTexColor(gl, tex) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      this.texColor = tex;
      if (this.target===gl.TEXTURE_2D) {
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texColor.texture, 0);
      }
      let errret=gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (DEBUG.fbo) {
          console.log("FBO STATUS:", errret, webgl.constmap[errret]);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
     bind(gl) {
      this._last_viewport = gl.getParameter(gl.VIEWPORT);
      gl = this.gl = gl===undefined ? this.gl : gl;
      if (this.regen) {
          this.create(gl);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.viewport(0, 0, this.size[0], this.size[1]);
    }
     _getQuad(gl, width, height, program) {
      width = ~~width;
      height = ~~height;
      if (this.smesh===undefined||this.size[0]!=width||this.size[1]!=height) {
          let lf=simplemesh.LayerTypes;
          this.smesh = new simplemesh.SimpleMesh(lf.LOC|lf.UV);
          let quad=this.smesh.quad([-1, -1, 0], [-1, 1, 0], [1, 1, 0], [1, -1, 0]);
          quad.uvs([0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]);
      }
      if (program) {
          this.smesh.program = program;
      }
      else {
        this.smesh.program = this.blitshader = webgl.getShader(gl, getBlitShaderCode(gl));
      }
      return this.smesh;
    }
     drawDepth(gl, width, height, tex) {
      let quad=this._getQuad(gl, width, height);
      quad.program = this.blitshader;
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      let dither=gl.getParameter(gl.DITHER);
      gl.disable(gl.DITHER);
      quad.draw(gl, {rgba: tex, 
     depth: tex, 
     size: [width, height], 
     valueScale: 1.0});
      if (dither) {
          gl.enable(gl.DITHER);
      }
    }
     drawQuadScaled(gl, width, height, tex=this.texColor, value_scale=1.0, depth=this.texDepth) {
      let quad=this._getQuad(gl, width, height);
      quad.program = this.blitshader;
      quad.uniforms.rgba = tex;
      quad.uniforms.depth = depth;
      quad.uniforms.valueScale = value_scale;
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      this.smesh.draw(gl);
    }
     drawQuad(gl, width, height, tex=this.texColor, depth=this.texDepth, program=undefined, uniforms=undefined) {
      let quad=this._getQuad(gl, width, height, program);
      if (program) {
          quad.program = program;
      }
      else {
        quad.program = this.blitshader;
      }
      quad.uniforms.rgba = tex;
      quad.uniforms.depth = depth;
      quad.uniforms.valueScale = 1.0;
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      this.smesh.draw(gl, uniforms);
    }
     unbind(gl) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      let vb=this._last_viewport;
      if (!vb) {
          return ;
      }
      gl.viewport(vb[0], vb[1], vb[2], vb[3]);
    }
     destroy() {
      if (this.fbo!==undefined) {
          this.gl.deleteFramebuffer(this.fbo);
          if (this.target===this.gl.TEXTURE_2D) {
              this.gl.deleteTexture(this.texDepth.texture);
              this.gl.deleteTexture(this.texColor.texture);
          }
          this.texDepth.texture = this.texColor.texture = undefined;
          this.fbo = undefined;
      }
    }
     update(gl, width, height) {
      width = ~~width;
      height = ~~height;
      gl = this.gl = gl===undefined ? this.gl : gl;
      if (width!==this.size[0]||height!==this.size[1]||gl!==this.gl) {
          console.log("fbo update", width, height);
          this.size[0] = width;
          this.size[1] = height;
          if (this.gl===undefined||gl===this.gl) {
              this.destroy(gl);
          }
          this.texDepth = this.texColor = undefined;
          this.create(gl);
      }
    }
  }
  _ESClass.register(oldFBO);
  _es6_module.add_class(oldFBO);
  oldFBO = _es6_module.add_export('oldFBO', oldFBO);
  class FrameStage extends FBO {
     constructor(shader, width=512, height=512) {
      super(undefined, width, height);
      this.shader = shader;
    }
     update(gl, width, height) {
      if (gl===undefined||width===undefined||height===undefined) {
          console.log("bad arguments to fbo.FrameStage.update()", arguments);
          throw new Error("bad arguments to fbo.FrameStage.update()");
      }
      super.update(gl, width, height);
    }
  }
  _ESClass.register(FrameStage);
  _es6_module.add_class(FrameStage);
  FrameStage = _es6_module.add_export('FrameStage', FrameStage);
  let BlitShaderGLSL200={vertex: `
precision mediump float;

uniform sampler2D rgba;
uniform sampler2D depth;

attribute vec3 position;
attribute vec2 uv;

varying vec2 v_Uv;

void main(void) {
  gl_Position = vec4(position, 1.0);
  v_Uv = uv;
}
    
  `, 
   fragment: `
#extension GL_EXT_frag_depth : require

precision mediump float;


uniform sampler2D rgba;
uniform sampler2D depth;
uniform float valueScale;

varying vec2 v_Uv;

void main(void) {
  vec4 color = texture2D(rgba, v_Uv);
  gl_FragColor = vec4(color.rgb*valueScale, color.a);
  gl_FragDepthEXT = texture2D(depth, v_Uv)[0];
}

  `, 
   uniforms: {}, 
   attributes: ["position", "uv"]}
  BlitShaderGLSL200 = _es6_module.add_export('BlitShaderGLSL200', BlitShaderGLSL200);
  let BlitShaderGLSL300={vertex: `#version 300 es
precision mediump float;

uniform sampler2D rgba;
uniform sampler2D depth;

in vec3 position;
in vec2 uv;

out vec2 v_Uv;

void main(void) {
  gl_Position = vec4(position, 1.0);
  v_Uv = uv;
}
    
  `, 
   fragment: `#version 300 es

precision mediump float;


uniform sampler2D rgba;
uniform sampler2D depth;
uniform float valueScale;

in vec2 v_Uv;
out vec4 fragColor;

void main(void) {
  vec4 color = texture(rgba, v_Uv);
  float d = texture(depth, v_Uv)[0];
  
  //color[0] = color[1] = color[2] = d*0.9;
  
  fragColor = vec4(color.rgb*valueScale, color.a);
  
  gl_FragDepth = texture(depth, v_Uv)[0];
}

  `, 
   uniforms: {}, 
   attributes: ["position", "uv"]}
  BlitShaderGLSL300 = _es6_module.add_export('BlitShaderGLSL300', BlitShaderGLSL300);
  class FramePipeline  {
     constructor(width=512, height=512) {
      this.stages = [new FrameStage()];
      this.size = new Vector2([width, height]);
      this.smesh = undefined;
      this._texs = [new webgl.Texture(0), new webgl.Texture(1), new webgl.Texture(2), new webgl.Texture(3), new webgl.Texture(4), new webgl.Texture(5)];
    }
     destroy(gl) {
      for (let stage of this.stages) {
          stage.destroy(gl);
      }
      if (this.smesh!==undefined) {
          this.smesh.destroy(gl);
          this.smesh = undefined;
      }
      this.stages = undefined;
    }
     addStage(gl, shaderdef) {
      let shader=webgl.getShader(gl, shaderdef);
      let stage=new FrameStage(shader, this.size[0], this.size[1]);
      this.stages.push(stage);
      return stage;
    }
     getBlitShader(gl) {
      return webgl.getShader(gl, getBlitShaderCode(gl));
    }
     draw(gl, drawfunc, width, height, drawmats) {
      if (this.smesh===undefined||this.size[0]!=width||this.size[1]!=height) {
          this.size[0] = width;
          this.size[1] = height;
          console.log("updateing framebuffer pipeline for new width/height");
          let lf=simplemesh.LayerTypes;
          this.smesh = new simplemesh.SimpleMesh(lf.LOC|lf.UV);
          this.smesh.program = this.blitshader = webgl.getShader(gl, getBlitShaderCode(gl));
          this.smesh.uniforms.iprojectionMatrix = drawmats.irendermat;
          this.smesh.uniforms.projectionMatrix = drawmats.rendermat;
          let quad=this.smesh.quad([-1, -1, 0], [-1, 1, 0], [1, 1, 0], [1, -1, 0]);
          quad.uvs([0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]);
      }
      let stage=this.stages[0];
      stage.update(gl, width, height);
      stage.bind(gl);
      gl.viewport(0, 0, this.size[0], this.size[1]);
      gl.enable(gl.DEPTH_TEST);
      gl.clearDepth(1000000.0);
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      drawfunc(gl);
      let laststage=stage;
      gl.depthMask(true);
      gl.disable(gl.DEPTH_TEST);
      for (let i=1; i<this.stages.length; i++) {
          let stage=this.stages[i];
          stage.update(gl, width, height);
          this._texs[0].texture = laststage.texColor.texture;
          stage.shader.uniforms.rgba = this._texs[0];
          this._texs[1].texture = laststage.texDepth.texture;
          stage.shader.uniforms.depth = this._texs[1];
          stage.shader.uniforms.size = this.size;
          this.smesh.program = stage.shader;
          stage.bind(gl);
          this.smesh.draw(gl);
          laststage = stage;
      }
    }
     drawFinal(gl, stage=undefined) {
      if (stage===undefined) {
          stage = this.stages[this.stages.length-1];
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(1);
      this.smesh.program = this.blitshader;
      this.blitshader.uniforms.rgba = this._texs[0];
      this.blitshader.uniforms.depth = this._texs[1];
      this.blitshader.uniforms.size = this.size;
      this._texs[0].texture = stage.texColor.texture;
      this._texs[1].texture = stage.texDepth.texture;
      this.smesh.draw(gl);
    }
  }
  _ESClass.register(FramePipeline);
  _es6_module.add_class(FramePipeline);
  FramePipeline = _es6_module.add_export('FramePipeline', FramePipeline);
  function getBlitShaderCode(gl) {
    if (gl.haveWebGL2) {
        return BlitShaderGLSL300;
    }
    else {
      return BlitShaderGLSL200;
    }
  }
  getBlitShaderCode = _es6_module.add_export('getBlitShaderCode', getBlitShaderCode);
}, '/dev/fairmotion/src/webgl/fbo.js');


es6_module_define('shaders', ["../path.ux/scripts/pathux.js", "./webgl.js"], function _shaders_module(_es6_module) {
  var ShaderProgram=es6_import_item(_es6_module, './webgl.js', 'ShaderProgram');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Matrix4');
  const RectShader={vertex: `precision mediump float;
uniform mat4 viewMatrix;

attribute vec2 position;
attribute vec2 uv;

varying vec2 vUv;

void main() {
  vec4 p = viewMatrix * vec4(position, 0.0, 1.0);
  gl_Position = p;
  
  vUv = uv; 
}
`, 
   fragment: `precision mediump float;

uniform mat4 viewMatrix;
varying vec2 vUv;

uniform sampler2D rgba;

void main() {
  vec4 color = texture2D(rgba, vUv); 
  gl_FragColor = color;
}
`, 
   attributes: ["position", "uv"], 
   uniforms: {viewMatrix: new Matrix4()}}
  _es6_module.add_export('RectShader', RectShader);
  const ShaderDef=window._ShaderDef = {RectShader: RectShader}
  _es6_module.add_export('ShaderDef', ShaderDef);
  const Shaders=window._Shaders = {}
  _es6_module.add_export('Shaders', Shaders);
  function loadShader(gl, sdef) {
    let sp=new ShaderProgram(gl, sdef.vertex, sdef.fragment, sdef.attributes);
    sp.uniforms = sdef.uniforms||{}
    sp.init(gl);
    return sp;
  }
  loadShader = _es6_module.add_export('loadShader', loadShader);
  function loadShaders(gl) {
    for (let k in ShaderDef) {
        let sdef=ShaderDef[k];
        Shaders[k] = loadShader(gl, sdef);
    }
  }
  loadShaders = _es6_module.add_export('loadShaders', loadShaders);
}, '/dev/fairmotion/src/webgl/shaders.js');


es6_module_define('simplemesh', ["./shaders.js", "./webgl.js", "../path.ux/scripts/pathux.js"], function _simplemesh_module(_es6_module) {
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
  var math=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'math');
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  var Vector3=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector3');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Matrix4');
  var Vector4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Quat');
  var Vector2=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector2');
  var webgl=es6_import(_es6_module, './webgl.js');
  var ShaderProgram=es6_import_item(_es6_module, './webgl.js', 'ShaderProgram');
  var Shaders=es6_import_item(_es6_module, './shaders.js', 'Shaders');
  var loadShader=es6_import_item(_es6_module, './shaders.js', 'loadShader');
  var RenderBuffer=webgl.RenderBuffer;
  const PrimitiveTypes={POINTS: 1, 
   LINES: 2, 
   TRIS: 4, 
   ADVANCED_LINES: 8, 
   ALL: 1|2|4|8}
  _es6_module.add_export('PrimitiveTypes', PrimitiveTypes);
  const LayerTypes={LOC: 1, 
   UV: 2, 
   COLOR: 4, 
   NORMAL: 8, 
   ID: 16, 
   CUSTOM: 32, 
   INDEX: 64}
  _es6_module.add_export('LayerTypes', LayerTypes);
  const LayerTypeNames={[LayerTypes.LOC]: "position", 
   [LayerTypes.UV]: "uv", 
   [LayerTypes.COLOR]: "color", 
   [LayerTypes.ID]: "id", 
   [LayerTypes.NORMAL]: "normal", 
   [LayerTypes.CUSTOM]: "custom"}
  _es6_module.add_export('LayerTypeNames', LayerTypeNames);
  let _TypeSizes={LOC: 3, 
   UV: 2, 
   COLOR: 4, 
   NORMAL: 3, 
   ID: 1, 
   CUSTOM: 4, 
   INDEX: 1}
  const TypeSizes={}
  _es6_module.add_export('TypeSizes', TypeSizes);
  for (var k in LayerTypes) {
      TypeSizes[LayerTypes[k]] = TypeSizes[k] = _TypeSizes[k];
  }
  let line2_temp4s=util.cachering.fromConstructor(Vector4, 64);
  let line2_stripuvs=[[1, 0], [-1, 0], [-1, 1], [1, 0], [-1, 1], [1, 1]];
  function appendvec(a, b, n, defaultval) {
    if (defaultval===undefined)
      defaultval = 0.0;
    for (var i=0; i<n; i++) {
        let val=b[i];
        a.push(val===undefined ? defaultval : val);
    }
  }
  var _ids_arrs=[[0], [0], [0], [0]];
  let zero=new Vector3();
  function copyvec(a, b, starti, n, defaultval) {
    if (defaultval===undefined)
      defaultval = 0.0;
    for (var i=starti; i<starti+n; i++) {
        let val=b[i];
        a[i] = val===undefined ? defaultval : val;
    }
  }
  class TriEditor  {
     constructor() {
      this.mesh = undefined;
      this.i = 0;
    }
     bind(mesh, i) {
      this.mesh = mesh;
      this.i = i;
      return this;
    }
     colors(c1, c2, c3) {
      let data=this.mesh.tri_colors;
      let i=this.i*3;
      data.copy(i, c1);
      data.copy(i+1, c2);
      data.copy(i+2, c3);
      return this;
    }
     normals(n1, n2, n3) {
      let data=this.mesh.tri_normals;
      let i=this.i*3;
      data.copy(i, n1);
      data.copy(i+1, n2);
      data.copy(i+2, n3);
      return this;
    }
     custom(layeri, v1, v2, v3) {
      let layer=this.mesh.layers.layers[layeri];
      let i=this.i*3;
      layer.copy(i, v1);
      layer.copy(i+1, v2);
      layer.copy(i+2, v3);
      return this;
    }
     uvs(u1, u2, u3) {
      let data=this.mesh.tri_uvs;
      let i=this.i*3;
      data.copy(i, u1);
      data.copy(i+1, u2);
      data.copy(i+2, u3);
      return this;
    }
     ids(i1, i2, i3) {
      if (i1===undefined||i2===undefined||i3===undefined) {
          throw new Error("i1/i2/i3 cannot be undefined");
      }
      let data=this.mesh.tri_ids;
      let i=this.i*3;
      _ids_arrs[0][0] = i1;
      i1 = _ids_arrs[0];
      _ids_arrs[1][0] = i2;
      i2 = _ids_arrs[1];
      _ids_arrs[2][0] = i3;
      i3 = _ids_arrs[2];
      data.copy(i, i1);
      data.copy(i+1, i2);
      data.copy(i+2, i3);
      return this;
    }
  }
  _ESClass.register(TriEditor);
  _es6_module.add_class(TriEditor);
  TriEditor = _es6_module.add_export('TriEditor', TriEditor);
  class QuadEditor  {
     constructor() {
      this.t1 = new TriEditor();
      this.t2 = new TriEditor();
    }
     bind(mesh, i, i2) {
      this.t1.bind(mesh, i);
      this.t2.bind(mesh, i2);
      return this;
    }
     custom(layeri, v1, v2, v3, v4) {
      this.t1.custom(layeri, v1, v2, v3);
      this.t2.custom(layeri, v1, v3, v4);
      return this;
    }
     uvs(u1, u2, u3, u4) {
      this.t1.uvs(u1, u2, u3);
      this.t2.uvs(u1, u3, u4);
      return this;
    }
     colors(u1, u2, u3, u4) {
      this.t1.colors(u1, u2, u3);
      this.t2.colors(u1, u3, u4);
      return this;
    }
     normals(u1, u2, u3, u4) {
      this.t1.normals(u1, u2, u3);
      this.t2.normals(u1, u3, u4);
      return this;
    }
     ids(u1, u2, u3, u4) {
      this.t1.ids(u1, u2, u3);
      this.t2.ids(u1, u3, u4);
      return this;
    }
  }
  _ESClass.register(QuadEditor);
  _es6_module.add_class(QuadEditor);
  QuadEditor = _es6_module.add_export('QuadEditor', QuadEditor);
  class LineEditor  {
     constructor() {
      this.mesh = undefined;
      this.i = 0;
    }
     bind(mesh, i) {
      this.mesh = mesh;
      this.i = i;
      return this;
    }
     colors(c1, c2) {
      let data=this.mesh.line_colors;
      let i=this.i*2;
      data.copy(i, c1);
      data.copy(i+1, c2);
      return this;
    }
     normals(c1, c2) {
      let data=this.mesh.line_normals;
      let i=this.i*2;
      data.copy(i, c1);
      data.copy(i+1, c2);
      return this;
    }
     uvs(c1, c2) {
      let data=this.mesh.line_uvs;
      let i=this.i*2;
      data.copy(i, c1);
      data.copy(i+1, c2);
      return this;
    }
     ids(i1, i2) {
      if (i1===undefined||i2===undefined) {
          throw new Error("i1 i2 cannot be undefined");
      }
      let data=this.mesh.line_ids;
      let i=this.i*2;
      _ids_arrs[0][0] = i1;
      _ids_arrs[1][0] = i2;
      data.copy(i, _ids_arrs[0]);
      data.copy(i+1, _ids_arrs[1]);
      return this;
    }
  }
  _ESClass.register(LineEditor);
  _es6_module.add_class(LineEditor);
  LineEditor = _es6_module.add_export('LineEditor', LineEditor);
  class DummyEditor  {
     colors() {
      return this;
    }
     ids() {
      return this;
    }
     normals() {
      return this;
    }
     custom() {
      return this;
    }
     tangent() {
      return this;
    }
     uvs() {
      return this;
    }
  }
  _ESClass.register(DummyEditor);
  _es6_module.add_class(DummyEditor);
  let dummyeditor=new DummyEditor();
  class LineEditor2  {
     constructor() {
      this.mesh = undefined;
      this.i = 0;
    }
     bind(mesh, i) {
      this.mesh = mesh;
      this.i = i;
      return this;
    }
     custom(layeri, c1, c2) {
      let data=this.mesh.layers.layers[layeri];
      let i=this.i*6;
      data.copy(i+0, c1);
      data.copy(i+1, c1);
      data.copy(i+2, c2);
      data.copy(i+3, c1);
      data.copy(i+4, c2);
      data.copy(i+5, c2);
      return this;
    }
     colors(c1, c2) {
      let data=this.mesh.line_colors2;
      let i=this.i*6;
      data.copy(i+0, c1);
      data.copy(i+1, c1);
      data.copy(i+2, c2);
      data.copy(i+3, c1);
      data.copy(i+4, c2);
      data.copy(i+5, c2);
      return this;
    }
     normals(c1, c2) {
      let data=this.mesh.line_normals2;
      let i=this.i*6;
      data.copy(i+0, c1);
      data.copy(i+1, c1);
      data.copy(i+2, c2);
      data.copy(i+3, c1);
      data.copy(i+4, c2);
      data.copy(i+5, c2);
      return this;
    }
     uvs(c1, c2) {
      let data=this.mesh.line_uvs2;
      let i=this.i*6;
      data.copy(i+0, c1);
      data.copy(i+1, c1);
      data.copy(i+2, c2);
      data.copy(i+3, c1);
      data.copy(i+4, c2);
      data.copy(i+5, c2);
      return this;
    }
     ids(i1, i2) {
      if (i1===undefined||i2===undefined) {
          throw new Error("i1 i2 cannot be undefined");
      }
      let data=this.mesh.line_ids2;
      let i=this.i*6;
      let c1=_ids_arrs[0];
      let c2=_ids_arrs[1];
      c1[0] = i1;
      c2[0] = i2;
      data.copy(i+0, c1);
      data.copy(i+1, c1);
      data.copy(i+2, c2);
      data.copy(i+3, c1);
      data.copy(i+4, c2);
      data.copy(i+5, c2);
      return this;
    }
  }
  _ESClass.register(LineEditor2);
  _es6_module.add_class(LineEditor2);
  LineEditor2 = _es6_module.add_export('LineEditor2', LineEditor2);
  class PointEditor  {
     constructor() {
      this.mesh = undefined;
      this.i = 0;
    }
     bind(mesh, i) {
      this.mesh = mesh;
      this.i = i;
      return this;
    }
     colors(c1) {
      let data=this.mesh.point_colors;
      let i=this.i;
      data.copy(i, c1);
      return this;
    }
     normals(c1) {
      let data=this.mesh.point_normals;
      let i=this.i;
      data.copy(i, c1);
      return this;
    }
     uvs(c1) {
      let data=this.mesh.point_uvs;
      let i=this.i;
      data.copy(i, c1);
      return this;
    }
     ids(i1) {
      if (i1===undefined) {
          throw new Error("i1 cannot be undefined");
      }
      let data=this.mesh.point_ids;
      let i=this.i;
      _ids_arrs[0][0] = i1;
      i1 = _ids_arrs[0];
      data.copy(i, _ids_arrs[0]);
      return this;
    }
  }
  _ESClass.register(PointEditor);
  _es6_module.add_class(PointEditor);
  PointEditor = _es6_module.add_export('PointEditor', PointEditor);
  const glTypeSizes={5126: 4, 
   5120: 1, 
   5121: 1, 
   5123: 2, 
   5122: 2, 
   5124: 4, 
   5125: 4}
  _es6_module.add_export('glTypeSizes', glTypeSizes);
  const glTypeArrays={5126: Float32Array, 
   5120: Int8Array, 
   5121: Uint8Array, 
   5122: Int16Array, 
   5123: Uint16Array, 
   5124: Int32Array, 
   5125: Uint32Array}
  _es6_module.add_export('glTypeArrays', glTypeArrays);
  const glTypeArrayMuls={5126: 1, 
   5120: 127, 
   5121: 255, 
   5123: 65535, 
   5122: 32767, 
   5124: 1, 
   5125: 1}
  _es6_module.add_export('glTypeArrayMuls', glTypeArrayMuls);
  const glSizes={FLOAT: 5126, 
   BYTE: 5120, 
   UNSIGNED_BYTE: 5121, 
   SHORT: 5122, 
   UNSIGNED_SHORT: 5123, 
   INT: 5124, 
   UNSIGNED_INT: 5125}
  const glRanges={[glSizes.FLOAT]: [-1e+17, 1e+17], 
   [glSizes.UNSIGNED_SHORT]: [0, 65535], 
   [glSizes.SHORT]: [-32767, 32767], 
   [glSizes.BYTE]: [-127, 127], 
   [glSizes.UNSIGNED_BYTE]: [0, 255], 
   [glSizes.UNSIGNED_INT]: [0, (1<<32)-1], 
   [glSizes.INT]: [-((1<<31)-1), (1<<31)-1]}
  window.glRanges = glRanges;
  let dmap=new WeakSet();
  function debugproxy(data, min, max, isint) {
    if (min===undefined) {
        min = -1e+17;
    }
    if (max===undefined) {
        max = 1e+17;
    }
    if (dmap.has(data)) {
        data.debug.min = min;
        data.isint = isint;
        data.debug.max = max;
        return data.debug.proxy;
    }
    dmap.add(data);
    function validate(target, prop) {
      if (typeof prop==="string") {
          prop = parseFloat(prop);
      }
      let bad=prop!==~~prop;
      bad = bad||isNaN(prop)||!isFinite(prop);
      bad = bad||prop<0||prop>=data.length;
      if (bad) {
          console.log(target, prop);
          throw new Error("bad prop "+prop);
      }
      return prop;
    }
    let debug={min: min, 
    max: max, 
    isint: isint}
    let proxy=new Proxy(data, {get: function get(target, prop, rc) {
        prop = validate(target, prop);
        return target[prop];
      }, 
    set: function set(target, prop, val) {
        prop = validate(target, prop);
        let bad=typeof val!=="number";
        bad = bad||val<debug.min||val>debug.max;
        bad = bad||isNaN(val)||!isFinite(val);
        bad = bad||(1&&val!==~~val);
        if (bad) {
            console.log(val, target, prop, debug.min, debug.max);
            throw new Error("bad value "+val);
        }
        target[prop] = val;
        return true;
      }});
    data.debug = debug;
    data.debug.proxy = proxy;
    return proxy;
  }
  window.debugproxy = debugproxy;
  const GL_ARRAY_BUFFER=34962;
  const GL_ELEMENT_ARRAY_BUFFER=34963;
  const GL_STATIC_DRAW=35044;
  class GeoLayer extends Array {
     constructor(size, name, primflag, type, idx) {
      super();
      this.index = undefined;
      this.glSize = 5126;
      this.glSizeMul = 1.0;
      this.glReady = false;
      this.type = type;
      this.data = [];
      this._useTypedData = false;
      this.dataUsed = 0;
      this.data_f32 = [];
      this.f32Ready = false;
      this.normalized = false;
      this.bufferType = GL_ARRAY_BUFFER;
      this.bufferHint = GL_STATIC_DRAW;
      this.size = size;
      this.name = name;
      this.primflag = primflag;
      this.bufferKey = undefined;
      this.idx = idx;
      this.id = undefined;
    }
     _getWriteData() {
      return this._useTypedData ? this.data_f32 : this.data;
    }
     setGLSize(size) {
      this.glSize = size;
      this.glSizeMul = glTypeArrayMuls[size];
      return this;
    }
     setNormalized(state) {
      this.normalized = !!state;
      return this;
    }
     reset() {
      this.glReady = false;
      this.dataUsed = 0;
      return this;
    }
     extend(data) {
      if (this._useTypedData&&this.dataUsed>=this.data_f32.length) {
          if (DEBUG.simplemesh) {
              console.warn("Resizing simplemesh attribute after conversion to a typed array");
          }
          this._useTypedData = false;
          this.data = new Array(this.data_f32.length);
          let a=this.data;
          let b=this.data_f32;
          for (let i=0; i<a.length; i++) {
              a[i] = b[i];
          }
          this.data_f32 = [];
      }
      let bad=isNaN(this.dataUsed)||this.dataUsed!==~~this.dataUsed||this.dataUsed<0;
      bad = bad||isNaN(this.size)||isNaN(this.data.length)||this.size<=0||this.data.length<0;
      if (bad) {
          throw new Error("dataUsed NaN error "+this.dataUsed);
      }
      let size=this.size;
      let starti=this.dataUsed;
      this.f32Ready = this._useTypedData;
      this.dataUsed+=size;
      if (!this._useTypedData&&this.dataUsed>this.data.length) {
          this.data.length = ~~(this.dataUsed*1.5);
      }
      if (data!==undefined) {
          this.copy(~~(starti/this.size), data, 1);
      }
      return this;
    }
     setCount(count, dirty=false) {
      if (isNaN(count)) {
          throw new Error("count was NaN");
      }
      count*=this.size;
      if (dirty) {
          this.glReady = false;
      }
      this.dataUsed = count;
      let data=this._useTypedData ? this.data_f32 : this.data;
      if (this.dataUsed!==data.length) {
          if (!this._useTypedData) {
              if (this.data.length<this.dataUsed) {
                  this.data.length = this.dataUsed;
                  this.glReady = false;
              }
              this.f32Ready = false;
          }
          else {
            if (window.DEBUG&&window.DEBUG.simplemesh) {
                console.log("simpleisland is converting back to simple array", count, this.data_f32.length, this.dataUsed);
            }
            let len=this.dataUsed;
            this.data = new Array(len);
            let a=this.data;
            let b=this.data_f32;
            for (let i=0; i<b.length; i++) {
                a[i] = b[i];
            }
            this.data.length = this.dataUsed;
            this.glReady = false;
            this._useTypedData = false;
            this.f32Ready = false;
          }
      }
    }
     _copy2Typed(data1, data2, n, mul, start) {
      for (let i=0; i<n; i++) {
          data1[start++] = ~~(data2[i]*mul);
      }
    }
     _copy2(data1, data2, n, mul, start) {
      for (let i=0; i<n; i++) {
          data1[start++] = ~~(data2[i]*mul);
      }
    }
     _copy_int(i, data, n=1) {
      let tot=n*this.size;
      this.f32Ready = false;
      i*=this.size;
      let thisdata;
      let mul=this.glSizeMul;
      if (this._useTypedData) {
          thisdata = this.data_f32;
      }
      else {
        thisdata = this.data;
      }
      if (DEBUG.simplemesh) {
          let range=glRanges[this.glSize];
          thisdata = debugproxy(thisdata, range[0], range[1], this.glSize!==glSizes.FLOAT);
      }
      if (this._useTypedData) {
          this._copy2Typed(thisdata, data, tot, mul, i);
      }
      else {
        this._copy2(thisdata, data, tot, mul, i);
      }
      return this;
    }
     copy(i, data, n=1) {
      if (this.glSizeMul!==1) {
          return this._copy_int(i, data, n);
      }
      let tot=n*this.size;
      this.f32Ready = this._useTypedData;
      i*=this.size;
      let thisdata;
      if (this._useTypedData) {
          thisdata = this.data_f32;
      }
      else {
        thisdata = this.data;
      }
      if (i>=this.dataUsed) {
          throw new Error("eek!");
          return ;
      }
      if (isNaN(i)) {
          throw new Error("NaN!");
      }
      let di=0;
      let end=i+tot;
      while (i<end) {
        thisdata[i] = data[di];
        di++;
        i++;
      }
      return this;
    }
     [Symbol.keystr]() {
      return ""+this.id;
    }
  }
  _ESClass.register(GeoLayer);
  _es6_module.add_class(GeoLayer);
  GeoLayer = _es6_module.add_export('GeoLayer', GeoLayer);
  class GeoLayerMeta  {
     constructor(primflag, type, attrsizes) {
      this.type = type;
      this.primflag = primflag;
      this.layers = [];
      this.normalized = false;
      this.attrsizes = attrsizes;
    }
     add(layer) {
      this.layers.push(layer);
      if (this.attrsizes[LayerTypeNames[layer.type]]===undefined) {
          this.attrsizes[LayerTypeNames[layer.type]] = 0;
      }
      else {
        this.attrsizes[LayerTypeNames[layer.type]]++;
      }
    }
  }
  _ESClass.register(GeoLayerMeta);
  _es6_module.add_class(GeoLayerMeta);
  GeoLayerMeta = _es6_module.add_export('GeoLayerMeta', GeoLayerMeta);
  function get_meta_mask(primflag, type) {
    return type|(primflag<<16);
  }
  let _debug_idgen=0;
  class GeoLayerManager  {
     constructor() {
      this.layers = [];
      this.has_multilayers = false;
      this._debug_id = _debug_idgen++;
      this.layer_meta = new Map();
      this.layer_idgen = new util.IDGen();
      this.attrsizes = new Map();
    }
     reset() {
      for (let /*unprocessed ExpandNode*/[key, meta] of this.layer_meta) {
          for (let l of meta.layers) {
              l.reset();
          }
      }
      return this;
    }
     copy() {
      let ret=new GeoLayerManager();
      ret.layer_idgen = this.layer_idgen.copy();
      ret.has_multilayers = this.has_multilayers;
      for (let key of this.layer_meta.keys()) {
          let meta=this.layer_meta.get(key);
          let meta2=ret.get_meta(meta.primflag, meta.type);
          for (let layer of meta.layers) {
              let layer2=new GeoLayer(layer.size, layer.name, layer.primflag, layer.type, layer.idx);
              layer2.data.length = layer.data.length;
              layer2.dataUsed = layer.dataUsed;
              layer2._useTypedData = layer._useTypedData;
              layer2.glSize = layer.glSize;
              layer2.glSizeMul = layer.glSizeMul;
              layer2.id = layer.id;
              layer2.index = layer.index;
              layer2.bufferKey = layer.bufferKey;
              layer2.normalized = layer.normalized;
              let a=layer.data;
              let b=layer2.data;
              let len=layer.dataUsed;
              if (layer._useTypedData) {
                  layer2.data_f32 = layer.data_f32.slice(0, layer.data_f32.length);
              }
              else {
                layer2.data = layer.data.slice(0, layer.data.length);
              }
              meta2.layers.push(layer2);
              ret.layers.push(layer2);
          }
      }
      return ret;
    }
     get_meta(primflag, type) {
      let mask=get_meta_mask(primflag, type);
      if (!this.layer_meta.has(mask)) {
          let attrsizes={};
          this.attrsizes.set(primflag, attrsizes);
          this.layer_meta.set(mask, new GeoLayerMeta(primflag, type, attrsizes));
      }
      return this.layer_meta.get(mask);
    }
     [Symbol.iterator]() {
      return this.layers[Symbol.iterator]();
    }
     extend(primflag, type, data, count) {
      let meta=this.get_meta(primflag, type);
      for (let i=0; i<meta.layers.length; i++) {
          meta.layers[i].extend(data, count);
      }
      return this;
    }
     layerCount(primflag, type) {
      return this.get_meta(primflag, type).layers.length;
    }
     pushLayer(name, primflag, type, size) {
      let meta=this.get_meta(primflag, type);
      let idx=meta.layers.length;
      let layer=new GeoLayer(size, name, primflag, type, idx);
      layer.id = this.layer_idgen.next();
      layer.index = this.layers.length;
      layer.primflag = primflag;
      layer.bufferKey = layer.name+":"+layer.id;
      this.layers.push(layer);
      meta.add(layer);
      layer.normalized = meta.normalized;
      return layer;
    }
     get(name, primflag, type, size, idx=undefined) {
      if (size===undefined) {
          size = TypeSizes[type];
      }
      if (idx>0) {
          this.has_multilayers = true;
      }
      let meta=this.get_meta(primflag, type);
      if (type===LayerTypes.CUSTOM) {
          for (let layer of meta.layers) {
              if (layer.name===name) {
                  return layer;
              }
          }
      }
      else {
        idx = idx===undefined ? 0 : idx;
        if (idx<meta.layers.length) {
            return meta.layers[idx];
        }
      }
      return this.pushLayer(name, primflag, type, size, idx);
    }
  }
  _ESClass.register(GeoLayerManager);
  _es6_module.add_class(GeoLayerManager);
  GeoLayerManager = _es6_module.add_export('GeoLayerManager', GeoLayerManager);
  var _default_uv=[0, 0];
  var _default_color=[0, 0, 0, 1];
  var _default_normal=[0, 0, 1];
  var _default_id=[-1];
  class SimpleIsland  {
     constructor(mesh) {
      let lay=this.layers = new GeoLayerManager();
      this._glAttrs = {};
      this.primflag = undefined;
      this.mesh = mesh;
      this.makeBufferAliases();
      this.totpoint = 0;
      this.totline = 0;
      this.tottri = 0;
      this.totline_tristrip = 0;
      this.indexedMode = undefined;
      this.layerflag = undefined;
      this.regen = 1;
      this._regen_all = 0;
      this.tri_editors = util.cachering.fromConstructor(TriEditor, 32, true);
      this.quad_editors = util.cachering.fromConstructor(QuadEditor, 32, true);
      this.line_editors = util.cachering.fromConstructor(LineEditor, 32, true);
      this.point_editors = util.cachering.fromConstructor(PointEditor, 32, true);
      this.tristrip_line_editors = util.cachering.fromConstructor(LineEditor2, 32, true);
      this.buffer = new RenderBuffer();
      this.program = undefined;
      this.textures = [];
      this.uniforms = {};
      this._uniforms_temp = {};
    }
     reset(gl) {
      this.layers.reset();
      this.buffer.reset(gl);
      this.tottri = this.totline = this.totpoint = this.totline_tristrip = 0;
      this.regen = 1;
    }
     getIndexedMode() {
      if (this.indexedMode!==undefined) {
          return this.indexedMode;
      }
      else {
        return this.mesh.indexedMode;
      }
    }
     setPrimitiveCount(primtype, tot) {
      switch (primtype) {
        case PrimitiveTypes.TRIS:
          this.tottri = tot;
          tot*=3;
          break;
        case PrimitiveTypes.LINES:
          this.totline = tot;
          tot*=2;
          break;
        case PrimitiveTypes.ADVANCED_LINES:
          this.totline_tristrip = tot;
          tot*=6;
          break;
        case PrimitiveTypes.POINTS:
          this.totpoint = tot;
          break;
      }
      let lf=this.layerflag ? this.layerflag : this.mesh.layerflag;
      for (let layer of this.layers.layers) {
          if (layer.primflag!==primtype||!(layer.type&lf)) {
              continue;
          }
          layer.setCount(tot);
      }
      return this;
    }
     makeBufferAliases() {
      let lay=this.layers;
      let pflag=PrimitiveTypes.TRIS;
      this.tri_cos = lay.get("tri_cos", pflag, LayerTypes.LOC);
      this.tri_normals = lay.get("tri_normals", pflag, LayerTypes.NORMAL).setGLSize(glSizes.SHORT).setNormalized(true);
      this.tri_uvs = lay.get("tri_uvs", pflag, LayerTypes.UV).setGLSize(glSizes.SHORT).setNormalized(true);
      this.tri_colors = lay.get("tri_colors", pflag, LayerTypes.COLOR).setGLSize(glSizes.UNSIGNED_BYTE).setNormalized(true);
      this.tri_ids = lay.get("tri_ids", pflag, LayerTypes.ID);
      pflag = PrimitiveTypes.LINES;
      this.line_cos = lay.get("line_cos", pflag, LayerTypes.LOC);
      this.line_normals = lay.get("line_normals", pflag, LayerTypes.NORMAL).setGLSize(glSizes.SHORT).setNormalized(true);
      this.line_uvs = lay.get("line_uvs", pflag, LayerTypes.UV).setGLSize(glSizes.SHORT).setNormalized(true);
      this.line_colors = lay.get("line_colors", pflag, LayerTypes.COLOR).setGLSize(glSizes.UNSIGNED_BYTE).setNormalized(true);
      this.line_ids = lay.get("line_ids", pflag, LayerTypes.ID);
      pflag = PrimitiveTypes.POINTS;
      this.point_cos = lay.get("point_cos", pflag, LayerTypes.LOC);
      this.point_normals = lay.get("point_normals", pflag, LayerTypes.NORMAL).setGLSize(glSizes.SHORT).setNormalized(true);
      this.point_uvs = lay.get("point_uvs", pflag, LayerTypes.UV).setGLSize(glSizes.SHORT).setNormalized(true);
      this.point_colors = lay.get("point_colors", pflag, LayerTypes.COLOR).setGLSize(glSizes.UNSIGNED_BYTE).setNormalized(true);
      this.point_ids = lay.get("point_ids", pflag, LayerTypes.ID);
      if (this.primflag&PrimitiveTypes.ADVANCED_LINES) {
          pflag = PrimitiveTypes.ADVANCED_LINES;
          this.line_cos2 = lay.get("line_cos2", pflag, LayerTypes.LOC);
          this.line_normals2 = lay.get("line_normals2", pflag, LayerTypes.NORMAL).setGLSize(glSizes.SHORT).setNormalized(true);
          this.line_uvs2 = lay.get("line_uvs2", pflag, LayerTypes.UV).setGLSize(glSizes.SHORT).setNormalized(true);
          this.line_colors2 = lay.get("line_colors2", pflag, LayerTypes.COLOR).setGLSize(glSizes.UNSIGNED_BYTE).setNormalized(true);
          this.line_ids2 = lay.get("line_ids2", pflag, LayerTypes.ID);
          this.line_stripuvs = this.getDataLayer(PrimitiveTypes.ADVANCED_LINES, LayerTypes.CUSTOM, 2, "_strip_uv");
          this.line_stripdirs = this.getDataLayer(PrimitiveTypes.ADVANCED_LINES, LayerTypes.CUSTOM, 4, "_strip_dir");
          this.line_stripdirs.normalized = false;
      }
    }
     copy() {
      let ret=new SimpleIsland();
      ret.primflag = this.primflag;
      ret.layerflag = this.layerflag;
      ret.totline = this.totline;
      ret.tottri = this.tottri;
      ret.totpoint = this.totpoint;
      for (let k in this.uniforms) {
          ret.uniforms[k] = this.uniforms[k];
      }
      for (let tex of this.textures) {
          ret.textures.push(tex);
      }
      ret.program = this.program;
      ret.layers = this.layers.copy();
      ret.regen = 1;
      ret.makeBufferAliases();
      return ret;
    }
     glFlagUploadAll(primflag=PrimitiveTypes.ALL) {
      this._regen_all|=primflag;
    }
     point(v1) {
      this.point_cos.extend(v1);
      this._newElem(PrimitiveTypes.POINTS, 1);
      this.totpoint++;
      return this.point_editors.next().bind(this, this.totpoint-1);
    }
     smoothline(v1, v2, w1=2, w2=2) {
      let dv=0.0;
      for (let i=0; i<3; i++) {
          dv+=(v1[i]-v2[i])*(v1[i]-v2[i]);
      }
      if (!this.line_cos2) {
          this.regen = true;
          this.primflag|=PrimitiveTypes.ADVANCED_LINES;
          if (this.layerflag!==undefined) {
              this.layerflag|=LayerTypes.CUSTOM;
          }
          else {
            this.mesh.layerflag|=LayerTypes.CUSTOM;
          }
          this.makeBufferAliases();
      }
      let li=this.line_cos2.dataUsed;
      this.line_cos2.extend(v1);
      this.line_cos2.extend(v1);
      this.line_cos2.extend(v2);
      this.line_cos2.extend(v1);
      this.line_cos2.extend(v2);
      this.line_cos2.extend(v2);
      let data=this.line_cos2._getWriteData();
      if (dv===0.0) {
          while (li<this.line_cos2.dataUsed) {
            data[li++]+=Math.random()*0.001;
          }
      }
      this._newElem(PrimitiveTypes.ADVANCED_LINES, 6);
      let i=this.totline_tristrip*6;
      this.line_stripuvs.copy(i, line2_stripuvs[0]);
      this.line_stripuvs.copy(i+1, line2_stripuvs[1]);
      this.line_stripuvs.copy(i+2, line2_stripuvs[2]);
      this.line_stripuvs.copy(i+3, line2_stripuvs[3]);
      this.line_stripuvs.copy(i+4, line2_stripuvs[4]);
      this.line_stripuvs.copy(i+5, line2_stripuvs[5]);
      let d=line2_temp4s.next().load(v2).sub(v1);
      d[3] = 0.0;
      d.normalize();
      d[3] = w1;
      this.line_stripdirs.copy(i, d);
      this.line_stripdirs.copy(i+1, d);
      d[3] = w2;
      this.line_stripdirs.copy(i+2, d);
      d[3] = w1;
      this.line_stripdirs.copy(i+3, d);
      d[3] = w2;
      this.line_stripdirs.copy(i+4, d);
      this.line_stripdirs.copy(i+5, d);
      this.totline_tristrip++;
      return this.tristrip_line_editors.next().bind(this, this.totline_tristrip-1);
    }
     line(v1, v2) {
      this.line_cos.extend(v1);
      this.line_cos.extend(v2);
      this._newElem(PrimitiveTypes.LINES, 2);
      this.totline++;
      return this.line_editors.next().bind(this, this.totline-1);
    }
     _newElem(primtype, primcount) {
      let layerflag=this.layerflag===undefined ? this.mesh.layerflag : this.layerflag;
      let meta=this.layers.get_meta(primtype, LayerTypes.LOC);
      let start=meta.layers[0].dataUsed/meta.layers[0].size;
      for (let j=0; j<primcount; j++) {
          if (layerflag&LayerTypes.UV) {
              this.layers.extend(primtype, LayerTypes.UV, _default_uv);
          }
          if (layerflag&LayerTypes.CUSTOM) {
              this.layers.extend(primtype, LayerTypes.CUSTOM, _default_uv);
          }
          if (layerflag&LayerTypes.COLOR) {
              this.layers.extend(primtype, LayerTypes.COLOR, _default_color);
          }
          if (layerflag&LayerTypes.NORMAL) {
              this.layers.extend(primtype, LayerTypes.NORMAL, _default_normal);
          }
          if (layerflag&LayerTypes.ID) {
              this.layers.extend(primtype, LayerTypes.ID, _default_id);
          }
      }
      return start;
    }
     tri(v1, v2, v3) {
      this.tri_cos.extend(v1);
      this.tri_cos.extend(v2);
      this.tri_cos.extend(v3);
      this._newElem(PrimitiveTypes.TRIS, 3);
      this.tottri++;
      return this.tri_editors.next().bind(this, this.tottri-1);
    }
     quad(v1, v2, v3, v4) {
      let i=this.tottri;
      this.tri(v1, v2, v3);
      this.tri(v1, v3, v4);
      return this.quad_editors.next().bind(this, i, i+1);
    }
     destroy(gl) {
      this.buffer.destroy(gl);
      this.regen = true;
    }
     gen_buffers(gl) {
      let layerflag=this.layerflag===undefined ? this.mesh.layerflag : this.layerflag;
      let allflag=this._regen_all;
      this._regen_all = 0;
      for (let layer of this.layers) {
          if (layer.dataUsed===0) {
              continue;
          }
          if (layer._useTypedData&&!layer.f32Ready) {
              layer.f32Ready = true;
          }
          if (!layer.f32Ready) {
              layer.f32Ready = true;
              let typedarray=glTypeArrays[layer.glSize];
              if (!layer.data_f32||layer.data_f32.length!==layer.dataUsed) {
                  if (DEBUG.simplemesh) {
                      console.warn("new layer data", layer.data_f32, layer);
                  }
                  layer.data_f32 = new typedarray(layer.dataUsed);
              }
              let a=layer.data;
              let b=layer.data_f32;
              let count=layer.dataUsed;
              layer.data.length = layer.dataUsed;
              layer.data_f32.set(layer.data);
              layer._useTypedData = true;
              layer.data = [];
              layer.glReady = false;
          }
          if (layer.glReady&&layer.dataUsed!==layer.data_f32.length) {
              throw new Error("simplemesh error");
          }
      }
      for (let layer of this.layers) {
          if (layer.glReady&&!(allflag&layer.primflag)) {
              continue;
          }
          if (layer.dataUsed===0||!(layer.type&layerflag)) {
              continue;
          }
          if (layer.type!==LayerTypes.CUSTOM) {
              this._glAttrs[LayerTypeNames[layer.type]] = 1;
          }
          let vbo=this.buffer.get(gl, layer.bufferKey, layer.bufferType);
          vbo.uploadData(gl, layer.data_f32, layer.bufferType, layer.bufferHint);
          layer.glReady = true;
      }
    }
     getIndexBuffer(ptype) {
      let key="";
      switch (ptype) {
        case PrimitiveTypes.TRIS:
          key = "tri";
          break;
        case PrimitiveTypes.LINES:
          key = "line";
          break;
        case PrimitiveTypes.POINTS:
          key = "point";
          break;
      }
      key+="_indices";
      if (!this[key]) {
          let layer=this[key] = this.layers.get(key, ptype, LayerTypes.INDEX);
          layer.size = 1;
          layer.glSizeMul = 1;
          layer.glSize = glSizes.UNSIGNED_SHORT;
          layer.normalized = false;
          layer.bufferType = GL_ELEMENT_ARRAY_BUFFER;
      }
      return this[key];
    }
     _draw_tris(gl, uniforms, params, program) {
      if (this.tottri) {
          this.bindArrays(gl, uniforms, program, "tri", PrimitiveTypes.TRIS);
          if (this.getIndexedMode()) {
              let idx=this.getIndexBuffer(PrimitiveTypes.TRIS);
              if (!idx) {
                  console.warn("Missing index layer", this);
                  return ;
              }
              let vbo=this.buffer.get(gl, idx.bufferKey, idx.bufferType);
              let buf=vbo.get(gl);
              gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
              gl.drawElements(gl.TRIANGLES, this.tottri*3, gl.UNSIGNED_SHORT, 0);
              gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
          }
          else {
            gl.drawArrays(gl.TRIANGLES, 0, this.tottri*3);
          }
      }
    }
     _draw_line_tristrips(gl, uniforms, params, program) {
      let attrs=this._glAttrs;
      if (this.totline_tristrip) {
          if (!program._smoothline) {
              let uniforms2=Object.assign({}, uniforms);
              let attributes=new Set(program.attrs);
              attributes.add("_strip_dir");
              attributes.add("_strip_uv");
              let vertex=program.vertexSource;
              let fragment=program.fragmentSource;
              vertex = ShaderProgram.insertDefine(`
#ifndef SMOOTH_LINE
#define SMOOTH_LINE
#endif
        `, vertex);
              fragment = ShaderProgram.insertDefine(`
#ifndef SMOOTH_LINE
#define SMOOTH_LINE
#endif
        `, fragment);
              let sdef={vertex: vertex, 
         fragment: fragment, 
         uniforms: uniforms2, 
         attributes: attributes};
              program._smoothline = loadShader(gl, sdef);
          }
          program = program._smoothline;
          program.bind(gl, uniforms, attrs);
          this.bindArrays(gl, uniforms, program, "line2", PrimitiveTypes.ADVANCED_LINES);
          gl.drawArrays(gl.TRIANGLES, 0, this.totline_tristrip*6);
      }
    }
     flagRecalc() {
      for (let layer of this.layers) {
          layer.f32Ready = false;
      }
      this.regen = true;
      return this;
    }
     bindArrays(gl, uniforms, program, key, primflag) {
      program = program===undefined ? this.program : program;
      program = program===undefined ? this.mesh.program : program;
      let layerflag=this.layerflag===undefined ? this.mesh.layerflag : this.layerflag;
      if (!program||!program.program) {
          return ;
      }
      let maxattrib=gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
      for (let i=0; i<maxattrib; i++) {
          gl.disableVertexAttribArray(i);
      }
      let li=0;
      let layer=this.layers.get_meta(primflag, LayerTypes.LOC).layers[0];
      if (layer.dataUsed===0) {
          return ;
      }
      let buf=this.buffer.get(gl, layer.bufferKey, layer.bufferType).get(gl);
      let btype=gl.ARRAY_BUFFER;
      if (this.getIndexedMode()) {
      }
      gl.bindBuffer(btype, buf);
      gl.vertexAttribPointer(0, layer.size, layer.glSize, false, 0, 0);
      gl.enableVertexAttribArray(0);
      let bindArray=(name, type) =>        {
        if (!(layerflag&type)||(type&LayerTypes.INDEX)) {
            return ;
        }
        let meta=this.layers.get_meta(primflag, type);
        if (!meta.layers.length) {
            li++;
            return ;
        }
        else {
          for (let i=0; i<meta.layers.length; i++) {
              let layer=meta.layers[i];
              let count;
              let mli=i;
              if (layer.dataUsed===0) {
                  continue;
              }
              if (type===LayerTypes.CUSTOM) {
                  name = layer.name;
                  count = 0;
                  for (let j=0; j<meta.layers.length; j++) {
                      if (j===i) {
                          break;
                      }
                      if (meta.layers[j].type===LayerTypes.CUSTOM&&meta.layers[j].name===name) {
                          count++;
                      }
                  }
                  mli = count;
              }
              let key=ShaderProgram.multiLayerAttrKey(name, mli, gl.haveWebGL2);
              let vbo=this.buffer.get(gl, layer.bufferKey, layer.bufferType);
              let buf=vbo.get(gl);
              li = program.attrLoc(key);
              if (li<0) {
                  continue;
              }
              gl.enableVertexAttribArray(li);
              gl.bindBuffer(btype, buf);
              gl.vertexAttribPointer(li, layer.size, layer.glSize, layer.normalized, 0, 0);
          }
        }
      };
      bindArray("normal", LayerTypes.NORMAL);
      bindArray("uv", LayerTypes.UV);
      bindArray("color", LayerTypes.COLOR);
      bindArray("id", LayerTypes.ID);
      bindArray("custom", LayerTypes.CUSTOM);
    }
     addDataLayer(primflag, type, size=TypeSizes[type], name=LayerTypeNames[type]) {
      this._glAttrs[name] = 1;
      return this.layers.pushLayer(name, primflag, type, size);
    }
     getDataLayer(primflag, type, size=TypeSizes[type], name=LayerTypeNames[type]) {
      this._glAttrs[name] = 1;
      return this.layers.get(name, primflag, type, size);
    }
     _draw_points(gl, uniforms, params, program) {
      if (this.totpoint>0) {
          this.bindArrays(gl, uniforms, program, "point", PrimitiveTypes.POINTS);
          gl.drawArrays(gl.POINTS, 0, this.totpoint);
      }
      else {
        console.log("no geometry");
      }
    }
     _draw_lines(gl, uniforms, params, program) {
      if (this.totline===0) {
          return ;
      }
      if (this.getIndexedMode()) {
          let idx=this.getIndexBuffer(PrimitiveTypes.LINES);
          this.bindArrays(gl, uniforms, program, "tris", PrimitiveTypes.TRIS);
          if (!idx) {
              console.warn("Missing index layer", this);
              return ;
          }
          let vbo=this.buffer.get(gl, idx.bufferKey, idx.bufferType);
          let buf=vbo.get(gl);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
          gl.drawElements(gl.LINES, this.totline*2, gl.UNSIGNED_SHORT, 0);
      }
      else {
        this.bindArrays(gl, uniforms, program, "line", PrimitiveTypes.LINES);
        gl.drawArrays(gl.LINES, 0, this.totline*2);
      }
    }
     onContextLost(e) {
      this.regen = 1;
    }
     draw(gl, uniforms, params, program_override=undefined) {
      this.gl = gl;
      let program=this.program===undefined ? this.mesh.program : this.program;
      let primflag=this.primflag===undefined ? this.mesh.primflag : this.primflag;
      if (program_override!==undefined) {
          program = program_override;
      }
      if (this.regen) {
          this.regen = 0;
          this.gen_buffers(gl);
      }
      if (uniforms===undefined) {
          for (let k in this._uniforms_temp) {
              delete this._uniforms_temp[k];
          }
          uniforms = this._uniforms_temp;
      }
      for (let k in this.uniforms) {
          if (!(k in uniforms)) {
              uniforms[k] = this.uniforms[k];
          }
      }
      for (let k in this.mesh.uniforms) {
          if (!(k in uniforms)) {
              uniforms[k] = this.mesh.uniforms[k];
          }
      }
      if (program===undefined)
        program = gl.simple_shader;
      let attrs=this._glAttrs;
      if (!this.layers.has_multilayers) {
          program.bind(gl, uniforms, attrs);
      }
      if (this.tottri&&(primflag&PrimitiveTypes.TRIS)) {
          if (this.layers.has_multilayers) {
              program.bindMultiLayer(gl, uniforms, this.layers.attrsizes.get(PrimitiveTypes.TRIS), attrs);
          }
          this._draw_tris(gl, uniforms, params, program);
      }
      if (this.totline&&(primflag&PrimitiveTypes.LINES)) {
          if (this.layers.has_multilayers) {
              program.bindMultiLayer(gl, uniforms, this.layers.attrsizes.get(PrimitiveTypes.LINES), attrs);
          }
          this._draw_lines(gl, uniforms, params, program);
      }
      if (this.totpoint&&(primflag&PrimitiveTypes.POINTS)) {
          if (this.layers.has_multilayers) {
              program.bindMultiLayer(gl, uniforms, this.layers.attrsizes.get(PrimitiveTypes.POINTS), attrs);
          }
          this._draw_points(gl, uniforms, params, program);
      }
      if (this.totline_tristrip&&(primflag&PrimitiveTypes.ADVANCED_LINES)) {
          if (this.layers.has_multilayers) {
              program.bindMultiLayer(gl, uniforms, this.layers.attrsizes.get(PrimitiveTypes.ADVANCED_LINES), attrs);
          }
          this._draw_line_tristrips(gl, uniforms, params, program);
      }
    }
  }
  _ESClass.register(SimpleIsland);
  _es6_module.add_class(SimpleIsland);
  SimpleIsland = _es6_module.add_export('SimpleIsland', SimpleIsland);
  class SimpleMesh  {
     constructor(layerflag=LayerTypes.LOC|LayerTypes.NORMAL|LayerTypes.UV) {
      this.layerflag = layerflag;
      this.primflag = PrimitiveTypes.ALL;
      this.indexedMode = false;
      this.gl = undefined;
      this.islands = [];
      this.uniforms = {};
      this.add_island();
      this.island = this.islands[0];
    }
     reset(gl) {
      for (let island of this.islands) {
          island.reset(gl);
      }
    }
     flagRecalc() {
      for (let island of this.islands) {
          island.flagRecalc();
      }
    }
     getDataLayer(primflag, type, size=TypeSizes[type], name=LayerTypeNames[type]) {
      let ret;
      for (let island of this.islands) {
          let ret2=island.getDataLayer(primflag, type, size, name);
          if (island===this.island) {
              ret = ret2;
          }
      }
      return ret;
    }
     addDataLayer(primflag, type, size=TypeSizes[type], name=LayerTypeNames[type]) {
      let ret;
      for (let island of this.islands) {
          let ret2=island.addDataLayer(primflag, type, size, name);
          if (island===this.island) {
              ret = ret2;
          }
      }
      return ret;
    }
     copy() {
      let ret=new SimpleMesh();
      ret.primflag = this.primflag;
      ret.layerflag = this.layerflag;
      for (let k in this.uniforms) {
          ret.uniforms[k] = this.uniforms[k];
      }
      for (let island of this.islands) {
          let island2=island.copy();
          island2.mesh = ret;
          ret.islands.push(island2);
          if (island===this.island) {
              ret.island = island2;
          }
      }
      return ret;
    }
     add_island() {
      let island=new SimpleIsland(this);
      this.island = island;
      this.islands.push(island);
      return island;
    }
     destroy(gl=this.gl) {
      if (!gl) {
          console.warn("failed to destroy a mesh");
          return ;
      }
      for (var island of this.islands) {
          island.destroy(gl);
      }
    }
     tri(v1, v2, v3) {
      return this.island.tri(v1, v2, v3);
    }
     quad(v1, v2, v3, v4) {
      return this.island.quad(v1, v2, v3, v4);
    }
     line(v1, v2) {
      return this.island.line(v1, v2);
    }
     point(v1) {
      return this.island.point(v1);
    }
     smoothline(v1, v2) {
      return this.island.smoothline(v1, v2);
    }
     drawLines(gl, uniforms, program_override=undefined) {
      for (let island of this.islands) {
          let primflag=island.primflag;
          island.primflag = PrimitiveTypes.LINES|PrimitiveTypes.ADVANCED_LINES;
          island.draw(gl, uniforms, undefined, program_override);
          island.primflag = primflag;
      }
    }
     draw(gl, uniforms, program_override=undefined) {
      this.gl = gl;
      for (var island of this.islands) {
          island.draw(gl, uniforms, undefined, program_override);
      }
    }
  }
  _ESClass.register(SimpleMesh);
  _es6_module.add_class(SimpleMesh);
  SimpleMesh = _es6_module.add_export('SimpleMesh', SimpleMesh);
  let IDMap=util.IDMap;
  class ChunkedSimpleMesh extends SimpleMesh {
     constructor(layerflag=LayerTypes.LOC|LayerTypes.NORMAL|LayerTypes.UV, chunksize=2048) {
      super(layerflag);
      this.chunksize = chunksize;
      this.islands = [];
      this.uniforms = {};
      this.primflag = PrimitiveTypes.TRIS;
      this.island = undefined;
      this.quad_editors = util.cachering.fromConstructor(QuadEditor, 32, true);
      this.freelist = [];
      this.freeset = new Set();
      this.delset = undefined;
      this.chunkmap = new IDMap();
      this.idmap = new IDMap();
      this.idgen = 0;
    }
     reset(gl) {
      this.chunkmap = new IDMap();
      this.idmap = new IDMap();
      this.freelist.length = 0;
      this.freeset = new Set();
      this.delset = undefined;
      for (let island of this.islands) {
          island.reset(gl);
      }
    }
     free(id) {
      let chunk=this.chunkmap.get(id);
      if (chunk===undefined||this.freeset.has(id)) {
          return ;
      }
      this.freelist.push(chunk);
      this.freelist.push(id);
      this.freeset.add(id);
      let island=this.islands[chunk];
      let i=this.idmap.get(id);
      island.point_cos.copy(i, zero);
      island.line_cos.copy(i*2, zero);
      island.line_cos.copy(i*2+1, zero);
      island.tri_cos.copy(i*3, zero);
      island.tri_cos.copy(i*3+1, zero);
      island.tri_cos.copy(i*3+2, zero);
      island.flagRecalc();
    }
     get_chunk(id) {
      if (id>1<<18&&__instance_of(this.idmap, IDMap)) {
          let idmap=new Map();
          for (let /*unprocessed ExpandNode*/[k, v] of this.idmap) {
              idmap.set(k, v);
          }
          this.idmap = idmap;
          let chunkmap=new Map();
          for (let /*unprocessed ExpandNode*/[k, v] of this.chunkmap) {
              chunkmap.set(k, v);
          }
          this.chunkmap = chunkmap;
      }
      if (this.chunkmap.has(id)) {
          return this.islands[this.chunkmap.get(id)];
      }
      if (this.freelist.length>0) {
          let id2=this.freelist.pop();
          let chunk=this.freelist.pop();
          this.chunkmap.set(id, chunk);
          this.idmap.set(id, id2);
          return this.islands[chunk];
      }
      let chunki=this.islands.length;
      let chunk=this.add_island();
      chunk.primflag = this.primflag;
      for (let i=0; i<this.chunksize; i++) {
          this.freelist.push(chunki);
          this.freelist.push(this.chunksize-i-1);
          chunk.tri(zero, zero, zero);
      }
      return this.get_chunk(id);
    }
     onContextLost(e) {
      for (var island of this.islands) {
          island.onContextLost(e);
      }
    }
     destroy(gl) {
      for (var island of this.islands) {
          island.destroy(gl);
      }
      this.regen = 1;
      this.chunkmap = new IDMap();
      this.idmap = new IDMap();
      this.freelist.length = 0;
      this.islands.length = 0;
      this.add_island();
    }
     tri(id, v1, v2, v3) {
      if (0) {
          function isvec(v) {
            if (!v) {
                return false;
            }
            let ret=typeof v.length==="number";
            ret = ret&&v.length>=3;
            ret = ret&&typeof v[0]==="number";
            ret = ret&&typeof v[1]==="number";
            ret = ret&&typeof v[2]==="number";
            return ret;
          }
          let bad=typeof id!=="number";
          bad = bad||Math.floor(id)!==id;
          bad = bad||!isvec(v1);
          bad = bad||!isvec(v2);
          bad = bad||!isvec(v3);
          if (bad) {
              throw new Error("bad parameters");
          }
      }
      let chunk=this.get_chunk(id);
      let itri=this.idmap.get(id);
      chunk.flagRecalc();
      chunk.glFlagUploadAll(PrimitiveTypes.TRIS);
      let tri_cos=chunk.tri_cos;
      let i=itri*9;
      if (tri_cos.dataUsed<i+9) {
          chunk.regen = 1;
          return chunk.tri(v1, v2, v3);
      }
      else {
        tri_cos.glReady = false;
        tri_cos = tri_cos._getWriteData();
        tri_cos[i++] = v1[0];
        tri_cos[i++] = v1[1];
        tri_cos[i++] = v1[2];
        tri_cos[i++] = v2[0];
        tri_cos[i++] = v2[1];
        tri_cos[i++] = v2[2];
        tri_cos[i++] = v3[0];
        tri_cos[i++] = v3[1];
        tri_cos[i++] = v3[2];
        if (i>tri_cos.length) {
            console.log(i, tri_cos.length, tri_cos);
            throw new Error("range error");
        }
      }
      chunk.regen = 1;
      return chunk.tri_editors.next().bind(chunk, itri);
    }
     quad(id, v1, v2, v3, v4) {
      throw new Error("unsupported for chunked meshes");
    }
     smoothline(id, v1, v2) {
      let chunk=this.get_chunk(id);
      let iline=this.idmap.get(id);
      chunk.flagRecalc();
      chunk.glFlagUploadAll(PrimitiveTypes.ADVANCED_LINES);
      if (!chunk.line_cos2) {
          chunk.primflag|=PrimitiveTypes.ADVANCED_LINES;
          this.layerflag|=LayerTypes.CUSTOM;
          chunk.makeBufferAliases();
      }
      let line_cos=chunk.line_cos2;
      let i=iline*18;
      if (line_cos.dataUsed<i+18) {
          let ret=chunk.smoothline(v1, v2);
          iline = ret.i;
          this.idmap.set(id, iline);
          return ret;
      }
      else {
        line_cos = line_cos._getWriteData();
        line_cos[i++] = v1[0];
        line_cos[i++] = v1[1];
        line_cos[i++] = v1[2];
        line_cos[i++] = v1[0];
        line_cos[i++] = v1[1];
        line_cos[i++] = v1[2];
        line_cos[i++] = v2[0];
        line_cos[i++] = v2[1];
        line_cos[i++] = v2[2];
        line_cos[i++] = v1[0];
        line_cos[i++] = v1[1];
        line_cos[i++] = v1[2];
        line_cos[i++] = v2[0];
        line_cos[i++] = v2[1];
        line_cos[i++] = v2[2];
        line_cos[i++] = v2[0];
        line_cos[i++] = v2[1];
        line_cos[i++] = v2[2];
        if (i>line_cos.length) {
            console.log(i, line_cos.length, line_cos);
            throw new Error("range error");
        }
      }
      chunk.regen = 1;
      return chunk.tristrip_line_editors.next().bind(chunk, iline);
    }
     line(id, v1, v2) {
      let chunk=this.get_chunk(id);
      let iline=this.idmap.get(id);
      chunk.flagRecalc();
      chunk.glFlagUploadAll(PrimitiveTypes.LINES);
      let line_cos=chunk.line_cos;
      let i=iline*6;
      if (line_cos.dataUsed<i+6) {
          chunk.line(v1, v2);
      }
      else {
        line_cos = line_cos._getWriteData();
        line_cos[i++] = v1[0];
        line_cos[i++] = v1[1];
        line_cos[i++] = v1[2];
        line_cos[i++] = v2[0];
        line_cos[i++] = v2[1];
        line_cos[i++] = v2[2];
        if (i>line_cos.length) {
            console.log(i, line_cos.length, line_cos);
            throw new Error("range error");
        }
      }
      chunk.regen = 1;
      return chunk.line_editors.next().bind(chunk, iline);
    }
     point(id, v1) {
      let chunk=this.get_chunk(id);
      let ipoint=this.idmap.get(id);
      chunk.flagRecalc();
      chunk.glFlagUploadAll(PrimitiveTypes.POINTS);
      let point_cos=chunk.point_cos;
      let i=ipoint*3;
      if (point_cos.dataUsed<i+3) {
          chunk.point(v1);
      }
      else {
        point_cos = point_cos._getWriteData();
        point_cos[i++] = v1[0];
        point_cos[i++] = v1[1];
        point_cos[i++] = v1[2];
        if (i>point_cos.length) {
            console.log(i, point_cos.length, point_cos);
            throw new Error("range error");
        }
      }
      chunk.regen = 1;
      return chunk.point_editors.next().bind(chunk, ipoint);
    }
     draw(gl, uniforms, program_override=undefined) {
      this.gl = gl;
      for (var island of this.islands) {
          island.draw(gl, uniforms, undefined, program_override);
      }
    }
  }
  _ESClass.register(ChunkedSimpleMesh);
  _es6_module.add_class(ChunkedSimpleMesh);
  ChunkedSimpleMesh = _es6_module.add_export('ChunkedSimpleMesh', ChunkedSimpleMesh);
}, '/dev/fairmotion/src/webgl/simplemesh.js');

