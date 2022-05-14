
es6_module_define('transform_spline', ["../../curve/spline_types.js", "../../wasm/native_api.js", "../../core/toolops_api.js", "../../util/mathlib.js", "./transdata.js", "./selectmode.js"], function _transform_spline_module(_es6_module) {
  var MinMax=es6_import_item(_es6_module, '../../util/mathlib.js', 'MinMax');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var ModalStates=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ModalStates');
  var TransDataItem=es6_import_item(_es6_module, './transdata.js', 'TransDataItem');
  var TransDataType=es6_import_item(_es6_module, './transdata.js', 'TransDataType');
  var clear_jobs=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs');
  var clear_jobs_except_latest=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs_except_latest');
  var clear_jobs_except_first=es6_import_item(_es6_module, '../../wasm/native_api.js', 'clear_jobs_except_first');
  var JobTypes=es6_import_item(_es6_module, '../../wasm/native_api.js', 'JobTypes');
  var TransData=es6_import_item(_es6_module, './transdata.js', 'TransData');
  var TransDataType=es6_import_item(_es6_module, './transdata.js', 'TransDataType');
  var _tsv_apply_tmp1=new Vector2();
  var _tsv_apply_tmp2=new Vector2();
  var post_mousemove_cachering=cachering.fromConstructor(Vector2, 64);
  var mousemove_cachering=cachering.fromConstructor(Vector2, 64);
  class TransSplineVert extends TransDataType {
    static  apply(ctx, td, item, mat, w, scaleWidths=false) {
      var co=_tsv_apply_tmp1;
      var v=item.data;
      let lscale=1.0;
      if (scaleWidths) {
          let xscale=Math.sqrt(mat.$matrix.m11*mat.$matrix.m11+mat.$matrix.m12*mat.$matrix.m12);
          let yscale=Math.sqrt(mat.$matrix.m21*mat.$matrix.m21+mat.$matrix.m22*mat.$matrix.m22);
          lscale = (xscale+yscale)*0.5;
      }
      if (w===0.0)
        return ;
      co.load(item.start_data.co);
      co.multVecMatrix(mat);
      v.load(co).sub(item.start_data.co).mulScalar(w).add(item.start_data.co);
      v.flag|=SplineFlags.UPDATE|SplineFlags.REDRAW|SplineFlags.FRAME_DIRTY;
      if (v.type===SplineTypes.HANDLE) {
          var seg=v.owning_segment;
          seg.update();
          seg.flag|=SplineFlags.FRAME_DIRTY;
          seg.v1.flag|=SplineFlags.UPDATE;
          seg.v2.flag|=SplineFlags.UPDATE;
          var hpair=seg.update_handle(v);
          if (hpair!==undefined) {
              hpair.flag|=SplineFlags.FRAME_DIRTY;
          }
      }
      else {
        if (scaleWidths) {
            v.width = item.start_data.width;
            v.width*=lscale;
            console.log("LSCALE", lscale);
        }
        for (let s of v.segments) {
            s.flag|=SplineFlags.FRAME_DIRTY;
            s.h1.flag|=SplineFlags.FRAME_DIRTY;
            s.h2.flag|=SplineFlags.FRAME_DIRTY;
            s.update();
            let hpair=s.update_handle(s.handle(v));
            if (hpair!==undefined) {
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
      let segundo=[];
      function push_vert(v) {
        if (doneset.has(v))
          return ;
        doneset.add(v);
        undo.push(v.eid);
        undo.push(v[0]);
        undo.push(v[1]);
      }
      function push_seg(s) {
        if (doneset.has(s)) {
            return ;
        }
        doneset.add(s);
        segundo.push(s.eid);
        segundo.push(s.w1);
        segundo.push(s.w2);
      }
      for (var i=0; i<td.data.length; i++) {
          var d=td.data[i];
          if (d.type!==TransSplineVert)
            continue;
          var v=d.data;
          if (v.type===SplineTypes.HANDLE) {
              if (v.hpair!==undefined) {
                  push_vert(v.hpair);
              }
              if (v.owning_vertex!==undefined&&v.owning_vertex.segments.length===2) {
                  let ov=v.owning_vertex;
                  for (let s of ov.segments) {
                      push_vert(s.h1);
                      push_vert(s.h2);
                      push_seg(s);
                  }
              }
              else 
                if (v.owning_vertex===undefined) {
                  console.warn("Orphaned handle!", v.eid, v);
              }
          }
          else {
            for (let s of v.segments) {
                push_seg(s);
            }
          }
          push_vert(v);
      }
      undo_obj['sseg'] = segundo;
      undo_obj['svert'] = undo;
    }
    static  undo(ctx, undo_obj) {
      var spline=ctx.spline;
      let segundo=undo_obj['sseg'];
      for (let i=0; i<segundo.length; ) {
          let eid=segundo[i++], w1=segundo[i++], w2=segundo[i++];
          let seg=spline.eidmap[eid];
          if (!seg) {
              console.warn("Data corruption in transform undo! Missing segment "+eid);
              continue;
          }
          let update=seg.w1!==w1||seg.w2!==w2;
          if (update) {
              seg.w1 = w1;
              seg.w2 = w2;
              seg.update();
          }
      }
      let undo=undo_obj['svert'];
      let edit_all_layers=undo.edit_all_layers;
      for (let i=0; i<undo.length; ) {
          var eid=undo[i++];
          var v=spline.eidmap[eid];
          if (v===undefined) {
              console.log("Transform undo error!", eid);
              i+=4;
              continue;
          }
          v[0] = undo[i++];
          v[1] = undo[i++];
          if (v.type===SplineTypes.HANDLE&&!v.use) {
              var seg=v.segments[0];
              seg.update();
              seg.flag|=SplineFlags.FRAME_DIRTY;
              seg.v1.flag|=SplineFlags.UPDATE;
              seg.v2.flag|=SplineFlags.UPDATE;
          }
          else 
            if (v.type===SplineTypes.VERTEX) {
              v.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
              for (let s of v.segments) {
                  s.update();
                  s.flag|=SplineFlags.FRAME_DIRTY|SplineFlags.UPDATE;
                  s.h1.flag|=SplineFlags.FRAME_DIRTY|SplineFlags.UPDATE;
                  s.h2.flag|=SplineFlags.FRAME_DIRTY|SplineFlags.UPDATE;
              }
          }
      }
      spline.resolve = 1;
      window.redraw_viewport();
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
              var co=new Vector2(v);
              if (i) {
                  var ov=v.owning_segment.handle_vertex(v);
                  if (ov!==undefined&&v.hidden&&ov.hidden)
                    continue;
              }
              else 
                if (v.hidden) {
                  continue;
              }
              selmap[v.eid] = 1;
              let width=i ? 0.0 : v.width;
              var td=new TransDataItem(v, TransSplineVert, {co: co, 
         width: width});
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
                  if (ov!==undefined&&v.hidden&&ov.hidden)
                    continue;
              }
              else 
                if (v.hidden) {
                  continue;
              }
              if (v.eid in selmap)
                continue;
              var co=new Vector2(v);
              let width=si ? 0.0 : v.width;
              var td=new TransDataItem(v, TransSplineVert, {co: co, 
         width: width});
              data.push(td);
              td.dis = 10000;
              tdmap[v.eid] = td;
          }
      }
      for (var v of spline.verts.selected.editable(ctx)) {
          shash.forEachPoint(v, proprad, function (v2, dis) {
            if (v2.flag&SplineFlags.SELECT)
              return ;
            if (!edit_all_layers&&!v2.in_layer(layer))
              return ;
            if (v2.type===SplineTypes.HANDLE&&v2.hidden&&(v2.owning_vertex===undefined||v2.owning_vertex.hidden))
              return ;
            if (v2.type===SplineTypes.VERTEX&&v2.hidden)
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


es6_module_define('spline_selectops', ["../../core/animdata.js", "../../core/toolops_api.js", "../../curve/spline_draw.js", "../../curve/spline_types.js", "../../core/toolprops.js"], function _spline_selectops_module(_es6_module) {
  "use strict";
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
      let ret=super.invoke(ctx, args);
      if ("selectmode" in args) {
          datamode = args["selectmode"];
      }
      else {
        datamode = ctx.selectmode;
      }
      ret.inputs.datamode.setValue(datamode);
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
      return {toolpath: "spline.select_one", 
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
     toolpath: "spline.toggle_select_all", 
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
      if (mode!==undefined)
        this.inputs.mode.setValue(mode);
    }
    static  tooldef() {
      return {uiname: "Select Linked", 
     toolpath: "spline.select_linked", 
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
      let state=this.inputs.mode.getValue()===SelOpModes.SELECT;
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
  class PickSelectLinkedOp extends SelectLinkedOp {
    static  tooldef() {
      return {uiname: "Select Linked", 
     toolpath: "spline.select_linked_pick", 
     inputs: ToolOp.inherit(), 
     is_modal: true}
    }
     modalStart(ctx) {
      console.log("Select linked pick", ctx);
      this.modalEnd();
      if (!ctx.view2d||!ctx.spline) {
          ctx.toolstack.toolop_cancel(this, false);
          return ;
      }
      let mpos=ctx.screen.mpos;
      mpos = ctx.view2d.getLocalMouse(mpos[0], mpos[1]);
      console.log("mpos", mpos);
      let ret=ctx.spline.q.findnearest_vert(ctx.view2d, mpos, 55, undefined, ctx.view2d.edit_all_layers);
      console.log("[de]select linked", ret);
      if (ret!==undefined) {
          this.inputs.vertex_eid.setValue(ret[0].eid);
          this.exec(ctx);
      }
      else {
        ctx.toolstack.toolop_cancel(this, false);
      }
    }
  }
  _ESClass.register(PickSelectLinkedOp);
  _es6_module.add_class(PickSelectLinkedOp);
  PickSelectLinkedOp = _es6_module.add_export('PickSelectLinkedOp', PickSelectLinkedOp);
  class HideOp extends SelectOpBase {
     constructor(mode, ghost) {
      super(undefined, undefined, "Hide");
      if (mode!=undefined)
        this.inputs.selmode.setValue(mode);
      if (ghost!=undefined)
        this.inputs.ghost.setValue(ghost);
    }
    static  tooldef() {
      return {toolpath: "spline.hide", 
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
      return {toolpath: "spline.unhide", 
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
      return {toolpath: "view2d.circle_select", 
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


es6_module_define('spline_createops', ["../../curve/spline.js", "./spline_editops.js", "../../curve/spline_draw_new.js", "../../curve/spline_types.js", "../../core/toolprops.js", "../../path.ux/scripts/pathux.js", "../../core/toolops_api.js"], function _spline_createops_module(_es6_module) {
  var util=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'util');
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
  var SplineDrawData=es6_import_item(_es6_module, '../../curve/spline_draw_new.js', 'SplineDrawData');
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
     toolpath: "spline.extrude_verts", 
     inputs: {location: new Vec3Property(undefined, "location", "location"), 
      linewidth: new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500]), 
      mode: new EnumProperty(ExtrudeModes.SMOOTH, ExtrudeModes, "extrude_mode", "Smooth Mode"), 
      stroke: new Vec4Property([0, 0, 0, 1])}, 
     outputs: {vertex: new IntProperty(-1, "vertex", "vertex", "new vertex")}, 
     icon: -1, 
     is_modal: false, 
     description: "Add points to path"}
    }
    static  canRun(ctx) {
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
      if (actvert!==v&&actvert!==undefined&&!actvert.hidden&&!((spline.restrict&RestrictFlags.VALENCE2)&&actvert.segments.length>=2)) {
          if (actvert.segments.length===2) {
              var v2=actvert;
              var h1=v2.segments[0].handle(v2), h2=v2.segments[1].handle(v2);
              spline.connect_handles(h1, h2);
              h1.flag|=SplineFlags.AUTO_PAIRED_HANDLE;
              h2.flag|=SplineFlags.AUTO_PAIRED_HANDLE;
              h1.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
              h2.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
          }
          let width=actvert.segments.length>0 ? actvert.width : 1.0;
          var seg=spline.make_segment(actvert, v);
          seg.z = max_z_seg;
          seg.w1 = width;
          seg.w2 = width;
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
     toolpath: "spline.make_edge", 
     inputs: {linewidth: new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500])}, 
     outputs: {}, 
     icon: Icons.MAKE_SEGMENT, 
     is_modal: false, 
     description: "Create segment between two selected points"}
    }
    static  canRun(ctx) {
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
     toolpath: "spline.make_edge_face", 
     inputs: {linewidth: new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500])}, 
     outputs: {}, 
     icon: Icons.MAKE_POLYGON, 
     is_modal: false, 
     description: "Create polygon from selected points"}
    }
    static  canRun(ctx) {
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
     toolpath: "editor.import_old_json", 
     inputs: {strdata: new StringProperty("", "JSON", "JSON", "JSON string data")}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     description: "Import old json files"}
    }
    static  canRun(ctx) {
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
  function strokeSegments(spline, segments, width, color) {
    if (width===undefined) {
        width = 2.0;
    }
    if (color===undefined) {
        color = [0, 0, 0, 1];
    }
    segments = new util.set(segments);
    let verts=new util.set();
    for (let seg of segments) {
        verts.add(seg.v1);
        verts.add(seg.v2);
    }
    let doneset=new util.set();
    function angle(v, seg) {
      let v2=seg.other_vert(v);
      let dx=v2[0]-v[0];
      let dy=v2[1]-v[1];
      return Math.atan2(dy, dx);
    }
    for (let v of verts) {
        v.segments.sort((a, b) =>          {
          return angle(v, a)-angle(v, b);
        });
    }
    let ekey=function (e, side) {
      return ""+e.eid+":"+side;
    }
    let doneset2=new util.set();
    for (let v of verts) {
        let side=0;
        let startside=side;
        if (doneset.has(ekey(v, side))) {
            continue;
        }
        let startv=v;
        let seg;
        let found=0;
        for (seg of v.segments) {
            let realside=side^(seg.v1===v ? 0 : 1);
            if (segments.has(seg)&&!doneset.has(ekey(seg, realside))) {
                found = 1;
                break;
            }
        }
        if (!found) {
            continue;
        }
        let vcurs={};
        let vstarts={};
        let lastco=undefined;
        let firstp=undefined;
        let lastp=undefined;
        let lastv=v;
        let lastseg=undefined;
        let widthscale=1.0;
        let _i=0;
        do {
          let realside=side^(seg.v1===v ? 0 : 1);
          if (doneset.has(ekey(seg, realside))) {
              break;
          }
          doneset.add(ekey(seg, realside));
          let data=seg.cdata.get_layer(SplineDrawData);
          if (!data) {
              throw new Error("data was not defined");
          }
          let s=data.gets(seg, v);
          let p=seg.evaluateSide(s, realside);
          p = spline.make_vertex(p);
          if ((v.flag&SplineFlags.BREAK_TANGENTS)||v.segments.length!==2) {
              p.flag|=SplineFlags.BREAK_TANGENTS;
              if (v.segments.length===2) {
                  p.load(data.getp(seg, v, side^1));
                  p[2] = 0.0;
              }
          }
          if (v.flag&SplineFlags.BREAK_CURVATURES) {
              p.flag|=SplineFlags.BREAK_CURVATURES;
          }
          if (lastco===undefined) {
              lastco = new Vector2(p);
              lastp = p;
              firstp = p;
          }
          else {
            let seg2=spline.make_segment(lastp, p);
            lastp.width = widthscale;
            widthscale+=0.025;
            seg2.mat.strokecolor.load(color);
            seg2.mat.linewidth = width;
            seg2.mat.update();
            lastco.load(p);
            let nev=spline.split_edge(seg2, 0.5);
            let pn=seg.evaluateSide(0.5, realside);
            pn[2] = 0.0;
            nev[1].load(pn);
          }
          lastp = p;
          if (v.segments.length===2) {
              seg = v.other_segment(seg);
              v = seg.other_vert(v);
          }
          else 
            if (v.segments.length>2) {
              if (!vcurs[v.eid]) {
                  vcurs[v.eid] = vstarts[v.eid] = v.segments.indexOf(v.seg);
              }
              let side2=seg.v1===v ? 1 : 0;
              side2 = side2^side;
              let dir=realside ? -1 : 1;
              vcurs[v.eid] = (vcurs[v.eid]+dir+v.segments.length)%v.segments.length;
              if (vcurs[v.eid]===vstarts[v.eid]) {
                  break;
              }
              seg = v.segments[vcurs[v.eid]];
              v = seg.other_vert(v);
          }
          else {
            v = seg.other_vert(v);
            let co=seg.evaluateSide(s, realside^1);
            let v2=spline.make_vertex(co);
            let seg2=spline.make_segment(lastp, v2);
            seg2.mat.strokecolor.load(color);
            seg2.mat.linewidth = width;
            seg2.mat.update();
            v2.flag|=SplineFlags.BREAK_TANGENTS;
            lastp.flag|=SplineFlags.BREAK_TANGENTS;
            lastp = v2;
          }
          lastv = v;
          lastseg = seg;
          if (_i++>1000) {
              console.warn("Infinite loop detected!");
              break;
          }
        } while (ekey(v, side)!==ekey(startv, startside));
        
        if (v===startv) {
            let seg2=spline.make_segment(lastp, firstp);
            lastp.width = widthscale;
            seg2.mat.strokecolor.load(color);
            seg2.mat.linewidth = width;
            seg2.mat.update();
        }
    }
  }
  strokeSegments = _es6_module.add_export('strokeSegments', strokeSegments);
  class StrokePathOp extends SplineLocalToolOp {
     constructor() {
      super();
    }
    static  invoke(ctx, args) {
      let tool=new StrokePathOp();
      if ("color" in args) {
          tool.inputs.color.setValue(args.color);
      }
      else 
        if (ctx.view2d) {
          tool.inputs.color.setValue(ctx.view2d.default_stroke);
      }
      if ("width" in args) {
          tool.inputs.width.setValue(args.width);
      }
      else 
        if (ctx.view2d) {
          tool.inputs.width.setValue(ctx.view2d.default_linewidth);
      }
      return tool;
    }
    static  tooldef() {
      return {name: "Stroke Path", 
     description: "Stroke Path", 
     toolpath: "spline.stroke", 
     inputs: {color: new Vec4Property([0, 0, 0, 1]), 
      width: new FloatProperty(1.0)}, 
     outputs: {}, 
     icon: Icons.STROKE_TOOL}
    }
     exec(ctx) {
      let spline=ctx.frameset.spline;
      let width=this.inputs.width.getValue();
      let color=this.inputs.color.getValue();
      strokeSegments(spline, spline.segments.selected.editable(ctx), width, color);
      spline.regen_render();
      spline.regen_solve();
      spline.regen_sort();
      window.redraw_viewport();
    }
  }
  _ESClass.register(StrokePathOp);
  _es6_module.add_class(StrokePathOp);
  StrokePathOp = _es6_module.add_export('StrokePathOp', StrokePathOp);
}, '/dev/fairmotion/src/editors/viewport/spline_createops.js');


es6_module_define('spline_editops', ["../../core/animdata.js", "../../curve/spline_draw.js", "../../curve/spline_base.js", "../../path.ux/scripts/util/struct.js", "../../core/toolprops.js", "../../core/toolops_api.js", "../../curve/spline.js", "../../core/context.js", "../../curve/spline_types.js", "./transform.js", "../../core/frameset.js"], function _spline_editops_module(_es6_module) {
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
  var ToolMacro=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolMacro');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var RecalcFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'RecalcFlags');
  var RestrictFlags=es6_import_item(_es6_module, '../../curve/spline.js', 'RestrictFlags');
  var Spline=es6_import_item(_es6_module, '../../curve/spline.js', 'Spline');
  var VDAnimFlags=es6_import_item(_es6_module, '../../core/frameset.js', 'VDAnimFlags');
  var TPropFlags=es6_import_item(_es6_module, '../../core/toolprops.js', 'TPropFlags');
  es6_import(_es6_module, '../../path.ux/scripts/util/struct.js');
  var redo_draw_sort=es6_import_item(_es6_module, '../../curve/spline_draw.js', 'redo_draw_sort');
  var FullContext=es6_import_item(_es6_module, '../../core/context.js', 'FullContext');
  var TranslateOp=es6_import_item(_es6_module, './transform.js', 'TranslateOp');
  class KeyCurrentFrame extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {toolpath: "spline.key_current_frame", 
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
     toolpath: "spline.shift_layer_order", 
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
      super();
    }
  }
  _ESClass.register(SplineGlobalToolOp);
  _es6_module.add_class(SplineGlobalToolOp);
  SplineGlobalToolOp = _es6_module.add_export('SplineGlobalToolOp', SplineGlobalToolOp);
  class SplineLocalToolOp extends ToolOp {
     constructor(apiname, uiname, description, icon) {
      super();
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
      spline.on_destroy();
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
      window.redraw_viewport();
    }
     execPost(ctx) {
      window.redraw_viewport();
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
     toolpath: "spline.key_edges", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false}
    }
    static  canRun(ctx) {
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
      this.undoflag|=UndoFlags.NO_UNDO;
    }
    static  tooldef() {
      return {uiname: "Copy Pose", 
     toolpath: "editor.copy_pose", 
     undoflag: UndoFlags.NO_UNDO, 
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
     toolpath: "editor.paste_pose", 
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
      if (this.modalRunning) {
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
     toolpath: "spline.toggle_step_mode", 
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
    static  canRun(ctx) {
      return !(ctx.spline.restrict&RestrictFlags.NO_DELETE);
    }
    static  tooldef() {
      return {uiname: "Delete Points/Segments", 
     toolpath: "spline.delete_verts", 
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
     toolpath: "spline.delete_segments", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     description: "Remove segments"}
    }
    static  canRun(ctx) {
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
     toolpath: "spline.delete_faces", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     description: "Remove faces"}
    }
    static  canRun(ctx) {
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
      if (offset!==undefined)
        this.inputs.offset.setValue(offset);
      if (selmode!==undefined)
        this.inputs.selmode.setValue(selmode);
    }
    static  tooldef() {
      return {uiname: "Set Order", 
     toolpath: "spline.change_face_z", 
     inputs: {offset: new IntProperty(1), 
      selmode: new IntProperty(SplineTypes.FACE)}, 
     outputs: {}, 
     icon: Icons.Z_UP, 
     is_modal: false, 
     description: "Change draw order of selected faces"}
    }
    static  canRun(ctx) {
      return 1;
    }
     exec(ctx) {
      var spline=ctx.spline;
      var off=this.inputs.offset.getValue();
      var selmode=this.inputs.selmode.getValue();
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
     toolpath: "spline.dissolve_verts", 
     inputs: {verts: new CollectionProperty([], undefined, "verts", "verts"), 
      use_verts: new BoolProperty(false, "use_verts")}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     description: "Change draw order of selected faces"}
    }
    static  canRun(ctx) {
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
     toolpath: "spline.split_edges", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     description: "Split selected segments"}
    }
    static  canRun(ctx) {
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
  class SplitPickEdgeTransformOp extends ToolMacro {
    static  tooldef() {
      return {uiname: "Split Segment", 
     toolpath: "spline.split_pick_edge_transform"}
    }
     constructor() {
      super();
      let tool=new SplitEdgePickOp();
      let tool2=new TranslateOp(undefined, 1|2);
      ret.description = tool.description;
      ret.icon = tool.icon;
      this.add(tool);
      this.add(tool2);
      let modalEnd=tool.modalEnd;
      tool.modalEnd = function () {
        let ctx=tool.modal_ctx;
        tool2.user_start_mpos = tool.mpos;
        console.log("                 on_modal_end successfully called", tool2.user_start_mpos);
        modalEnd.apply(tool, arguments);
      };
    }
  }
  _ESClass.register(SplitPickEdgeTransformOp);
  _es6_module.add_class(SplitPickEdgeTransformOp);
  SplitPickEdgeTransformOp = _es6_module.add_export('SplitPickEdgeTransformOp', SplitPickEdgeTransformOp);
  class SplitEdgePickOp extends SplineGlobalToolOp {
    
     constructor() {
      super();
      this.mpos = new Vector2();
    }
    static  tooldef() {
      return {uiname: "Split Segment", 
     toolpath: "spline.split_pick_edge", 
     inputs: {segment_eid: new IntProperty(-1, "segment_eid", "segment_eid", "segment_eid"), 
      segment_t: new FloatProperty(0, "segment_t", "segment_t", "segment_t"), 
      spline_path: new StringProperty("drawspline", "spline_path", "splien_path", "spline_path"), 
      deselect: new BoolProperty(true, "deselect", "deselect", "deselect")}, 
     outputs: {}, 
     icon: Icons.SPLIT_EDGE, 
     is_modal: true, 
     description: "Split picked segment"}
    }
    static  canRun(ctx) {
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
      mpos = ctx.view2d.getLocalMouse(mpos[0], mpos[1]);
      this.mpos.load(mpos);
      let ret=ctx.view2d.editor.findnearest(mpos, SplineTypes.SEGMENT, 105, ctx.view2d.edit_all_layers);
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
      let steps=Math.min(Math.max(seg.length/20, 3, 18));
      let ds=1.0/(steps-1), s=0;
      let lastco;
      let view2d=ctx.view2d;
      let canvas=view2d.get_bg_canvas();
      for (let i=0; i<steps; i++, s+=ds) {
          let co=seg.evaluate(s);
          view2d.project(co);
          if (i>0) {
              this.new_drawline(lastco, co, [1, 0.3, 0.0, 1.0], 2);
          }
          lastco = co;
      }
      this.inputs.segment_eid.setValue(seg.eid);
      this.inputs.segment_t.setValue(0.5);
      ctx.view2d.unproject(mpos);
      let p=seg.closest_point(mpos, ClosestModes.CLOSEST);
      if (p!==undefined) {
          this.inputs.segment_t.setValue(p.s);
          p = new Vector2(p.co);
          view2d.project(p);
          let y=p[1];
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
     toolpath: "spline.toggle_break_tangents", 
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
     toolpath: "spline.toggle_break_curvature", 
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
     toolpath: "spline.connect_handles", 
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
     toolpath: "spline.disconnect_handles", 
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
     toolpath: "spline._test_closest_points", 
     inputs: {}, 
     outputs: {}, 
     undoflag: UndoFlags.NO_UNDO, 
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
          if (ret===undefined)
            continue;
          var dl=this.new_drawline(ret.co, mpos);
          dl.clr[3] = 0.1;
          continue;
          var ret=seg.closest_point(mpos, 3);
          for (var p of ret) {
              this.new_drawline(p.co, mpos);
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
  class ToggleManualHandlesOp extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {uiname: "Toggle Manual Handles", 
     toolpath: "spline.toggle_manual_handles", 
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
     toolpath: "spline.shift_time", 
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
     toolpath: "spline.duplicate", 
     inputs: {}, 
     outputs: {}, 
     icon: Icons.DUPLICATE, 
     is_modal: false, 
     description: "Make a duplicate of selected geometry."}
    }
    static  canRun(ctx) {
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
      spline.regen_sort();
      spline.regen_solve();
    }
  }
  _ESClass.register(DuplicateOp);
  _es6_module.add_class(DuplicateOp);
  DuplicateOp = _es6_module.add_export('DuplicateOp', DuplicateOp);
  class SplineFlipSegments extends SplineLocalToolOp {
    static  tooldef() {
      return {uiname: "Flip Segments", 
     toolpath: "spline.flip_segments", 
     description: "Flip vertex order"}
    }
     exec(ctx) {
      let spline=ctx.spline;
      for (let s of spline.segments.selected.editable(ctx)) {
          spline.flip_segment(s);
      }
      spline.regen_sort();
      spline.regen_render();
      spline.regen_solve();
      spline.force_full_resolve();
      window.redraw_viewport();
    }
  }
  _ESClass.register(SplineFlipSegments);
  _es6_module.add_class(SplineFlipSegments);
  SplineFlipSegments = _es6_module.add_export('SplineFlipSegments', SplineFlipSegments);
  class SplineMirrorOp extends SplineLocalToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {uiname: "Flip Horizontally", 
     toolpath: "spline.mirror_verts", 
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
              if (i===1&&v.owning_vertex!=undefined&&v.owning_vertex.hidden)
                continue;
              if (i===0&&v.hidden)
                continue;
              points.add(v);
              cent.add(v);
          }
      }
      if (points.length===0)
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
  class VertexSmoothOp extends SplineLocalToolOp {
    static  tooldef() {
      return {uiname: "Smooth Control Points", 
     toolpath: "spline.vertex_smooth", 
     inputs: ToolOp.inherit({repeat: new IntProperty(1).saveLastValue().setRange(1, 1024).saveLastValue(), 
      factor: new FloatProperty(0.5).noUnits().setRange(0.0, 1.0).saveLastValue(), 
      projection: new FloatProperty(0.0).noUnits().setRange(0.0, 1.0).saveLastValue()}), 
     outputs: ToolOp.inherit({})}
    }
     exec(ctx) {
      let spline=ctx.spline;
      let vs=new Set(spline.verts.selected.editable(ctx));
      let co=new Vector2();
      let fac=this.inputs.factor.getValue();
      let proj=this.inputs.projection.getValue();
      let t=new Vector2();
      console.log("proj", proj);
      proj = 1.0-proj;
      function vsmooth(v) {
        co.zero();
        let tot=0.0;
        for (let e of v.segments) {
            let v2=e.other_vert(v);
            let w=e.length;
            let s=v2===e.v1 ? 0.0 : 1.0;
            let n=e.normal(s);
            t.load(v2).sub(v);
            let d=t.dot(n);
            t.addFac(n, d).add(v);
            t.interp(v2, proj);
            co.addFac(t, w);
            tot+=w;
        }
        if (!tot) {
            return ;
        }
        co.mulScalar(1.0/tot);
        v.interp(co, fac);
        v.flag|=SplineFlags.UPDATE;
      }
      let repeat=this.inputs.repeat.getValue();
      for (let i=0; i<repeat; i++) {
          for (let v of vs) {
              if (v.valence>1) {
                  vsmooth(v);
              }
          }
      }
      spline.regen_render();
      spline.checkSolve();
      window.redraw_viewport();
    }
  }
  _ESClass.register(VertexSmoothOp);
  _es6_module.add_class(VertexSmoothOp);
  VertexSmoothOp = _es6_module.add_export('VertexSmoothOp', VertexSmoothOp);
}, '/dev/fairmotion/src/editors/viewport/spline_editops.js');


es6_module_define('spline_layerops', ["./spline_editops.js", "../../curve/spline.js", "../../core/toolops_api.js", "../../curve/spline_types.js", "../../core/toolprops.js"], function _spline_layerops_module(_es6_module) {
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
      return ctx.api.getValue(ctx, this.inputs.spline_path.data);
    }
  }
  _ESClass.register(SplineLayerOp);
  _es6_module.add_class(SplineLayerOp);
  SplineLayerOp = _es6_module.add_export('SplineLayerOp', SplineLayerOp);
  class AddLayerOp extends SplineLayerOp {
     constructor(name) {
      super(undefined, "Add Layer");
      if (name!==undefined)
        this.inputs.name.set_data(name);
    }
    static  tooldef() {
      return {uiname: "Add Layer", 
     toolpath: "spline.layers.add", 
     inputs: ToolOp.inherit({name: new StringProperty("Layer", "name", "Name", "Layer Name"), 
      make_active: new BoolProperty(true, "Make Active")}), 
     outputs: ToolOp.inherit({layerid: new IntProperty(0, "layerid", "layerid", "New Layer ID")}), 
     is_modal: false}
    }
    static  canRun(ctx) {
      return this;
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
     toolpath: "spline.layers.set", 
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
          actives.push(list.active!==undefined ? list.active.eid : -1);
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
      return {toolpath: "spline.move_to_layer", 
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
     toolpath: "spline.layers.remove", 
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


es6_module_define('multires_ops', ["../../../curve/spline.js", "../../../core/toolprops.js", "../../../curve/spline_draw.js", "../../../path.ux/scripts/util/vectormath.js", "../../../curve/spline_multires.js", "../spline_editops.js", "../../../core/toolops_api.js", "../../../curve/spline_types.js"], function _multires_ops_module(_es6_module) {
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
  var $vec_oeQE_exec;
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
      if (cp!==undefined) {
          s = cp.s;
          t = cp.co.vectorDistance(co);
          $vec_oeQE_exec.zero().load(co).sub(cp.co);
          var n=seg.normal(s);
          t*=Math.sign(n.dot($vec_oeQE_exec));
          p.offset[0] = $vec_oeQE_exec[0];
          p.offset[1] = $vec_oeQE_exec[1];
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
  var $vec_oeQE_exec=new Vector3();
  _ESClass.register(CreateMResPoint);
  _es6_module.add_class(CreateMResPoint);
  CreateMResPoint = _es6_module.add_export('CreateMResPoint', CreateMResPoint);
  CreateMResPoint.inputs = {segment: new IntProperty(0), 
   co: new Vec3Property(), 
   level: new IntProperty(0)}
}, '/dev/fairmotion/src/editors/viewport/multires/multires_ops.js');


es6_module_define('multires_selectops', ["../../../curve/spline_types.js", "../../../curve/spline_multires.js", "../spline_editops.js", "../../../core/toolops_api.js", "../../../curve/spline_draw.js", "../../../path.ux/scripts/util/vectormath.js", "../../../core/toolprops.js", "../../../curve/spline.js"], function _multires_selectops_module(_es6_module) {
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
    static  canRun(ctx) {
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


es6_module_define('multires_transdata', ["../../../curve/spline_multires.js", "../selectmode.js", "../../../util/mathlib.js", "../transdata.js"], function _multires_transdata_module(_es6_module) {
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
  var $co_7muK_apply;
  var $co_DN05_calc_draw_aabb;
  var $co2_ffz5_calc_draw_aabb;
  var $co_zh3e_aabb;
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
      $co_7muK_apply.load(item.start_data);
      $co_7muK_apply[2] = 0.0;
      $co_7muK_apply.multVecMatrix(mat);
      $co_7muK_apply.sub(item.start_data).mulScalar(w).add(item.start_data);
      p[0] = $co_7muK_apply[0];
      p[1] = $co_7muK_apply[1];
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
      $co_DN05_calc_draw_aabb.zero();
      var pad=15;
      function do_minmax(co) {
        $co2_ffz5_calc_draw_aabb[0] = co[0]-pad;
        $co2_ffz5_calc_draw_aabb[1] = co[1]-pad;
        minmax.minmax($co2_ffz5_calc_draw_aabb);
        $co2_ffz5_calc_draw_aabb[0]+=pad*2.0;
        $co2_ffz5_calc_draw_aabb[1]+=pad*2.0;
        minmax.minmax($co2_ffz5_calc_draw_aabb);
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
          $co_DN05_calc_draw_aabb[0] = t.data[0];
          $co_DN05_calc_draw_aabb[1] = t.data[1];
          do_minmax($co_DN05_calc_draw_aabb);
          $co_DN05_calc_draw_aabb[0]-=t.data.offset[0];
          $co_DN05_calc_draw_aabb[1]-=t.data.offset[1];
          do_minmax($co_DN05_calc_draw_aabb);
      }
    }
    static  aabb(ctx, td, item, minmax, selected_only) {
      $co_zh3e_aabb.zero();
      for (var i=0; i<td.data.length; i++) {
          var t=td.data[i];
          if (t.type!==MResTransData)
            continue;
          $co_zh3e_aabb[0] = t.data[0];
          $co_zh3e_aabb[1] = t.data[1];
          minmax.minmax($co_zh3e_aabb);
      }
    }
  }
  var $co_7muK_apply=new Vector3();
  var $co_DN05_calc_draw_aabb=new Vector3();
  var $co2_ffz5_calc_draw_aabb=[0, 0, 0];
  var $co_zh3e_aabb=new Vector3();
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
  var $ret_6Ine_enum_to_xy;
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
      $ret_6Ine_enum_to_xy[0] = x;
      $ret_6Ine_enum_to_xy[1] = y;
      return $ret_6Ine_enum_to_xy;
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
  var $ret_6Ine_enum_to_xy=[0, 0];
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
   ROTATE: 4, 
   PEN: 5}
  ToolModes = _es6_module.add_export('ToolModes', ToolModes);
}, '/dev/fairmotion/src/editors/viewport/selectmode.js');


es6_module_define('platform_api', ["../../src/path.ux/scripts/config/const.js"], function _platform_api_module(_es6_module) {
  var pathux_const=es6_import(_es6_module, '../../src/path.ux/scripts/config/const.js');
  let default_clipfuncs={setClipboardData: pathux_const.setClipboardData, 
   getClipboardData: pathux_const.getClipboardData}
  class PlatformAPIBase  {
     constructor() {

    }
     init() {

    }
     setClipboardData(name, mime, data) {
      default_clipfuncs.setClipboardData(name, mime, data);
    }
     getClipboardData(desiredMimes="text/plain") {
      return default_clipfuncs.getClipboardData(name, mime, data);
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


es6_module_define('platform', ["./html5/platform_html5.js", "./Electron/theplatform.js", "./chromeapp/platform_chromeapp.js", "./PhoneGap/platform_phonegap.js", "../src/config/config.js"], function _platform_module(_es6_module) {
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


es6_module_define('view2d_editor', ["./selectmode.js", "./view2d_base.js", "../../core/keymap.js", "../../core/struct.js"], function _view2d_editor_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var KeyMap=es6_import_item(_es6_module, '../../core/keymap.js', 'KeyMap');
  var HotKey=es6_import_item(_es6_module, '../../core/keymap.js', 'HotKey');
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
      this.keymap = new KeyMap("view2d:"+this.constructor.name);
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


es6_module_define('view2d_object', ["../../core/struct.js", "./selectmode.js", "../../curve/spline_base.js"], function _view2d_object_module(_es6_module) {
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


es6_module_define('MaterialEditor', ["../../path.ux/scripts/widgets/ui_menu.js", "../viewport/spline_editops.js", "../../path.ux/scripts/core/ui_base.js", "../../core/toolprops.js", "../../path.ux/scripts/widgets/ui_table.js", "../../path.ux/scripts/widgets/ui_lasttool.js", "../editor_base.js", "../../core/struct.js", "../viewport/spline_layerops.js", "../../path.ux/scripts/core/ui.js", "../../path.ux/scripts/widgets/ui_listbox.js", "../../path.ux/scripts/screen/ScreenArea.js"], function _MaterialEditor_module(_es6_module) {
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var Container=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui.js', 'Container');
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  var PackFlags=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'PackFlags');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var saveUIData=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'saveUIData');
  var loadUIData=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'loadUIData');
  var ShiftLayerOrderOp=es6_import_item(_es6_module, '../viewport/spline_editops.js', 'ShiftLayerOrderOp');
  var AddLayerOp=es6_import_item(_es6_module, '../viewport/spline_layerops.js', 'AddLayerOp');
  var DeleteLayerOp=es6_import_item(_es6_module, '../viewport/spline_layerops.js', 'DeleteLayerOp');
  var ChangeLayerOp=es6_import_item(_es6_module, '../viewport/spline_layerops.js', 'ChangeLayerOp');
  var ChangeElementLayerOp=es6_import_item(_es6_module, '../viewport/spline_layerops.js', 'ChangeElementLayerOp');
  es6_import(_es6_module, '../../path.ux/scripts/widgets/ui_table.js');
  es6_import(_es6_module, '../../path.ux/scripts/widgets/ui_menu.js');
  es6_import(_es6_module, '../../path.ux/scripts/widgets/ui_listbox.js');
  var LastToolPanel=es6_import_item(_es6_module, '../../path.ux/scripts/widgets/ui_lasttool.js', 'LastToolPanel');
  var TPropFlags=es6_import_item(_es6_module, '../../core/toolprops.js', 'TPropFlags');
  class MyLastToolPanel extends LastToolPanel {
     getToolStackHead(ctx) {
      return ctx.toolstack.head;
    }
     buildTool(ctx, tool, container) {
      for (let k in tool.inputs) {
          let prop=tool.inputs[k];
          if (prop.flag&TPropFlags.PRIVATE) {
              continue;
          }
          let apiname=prop.apiname||k;
          let path="last_tool."+apiname;
          container.prop(path);
      }
    }
    static  define() {
      return {tagname: 'last-tool-panel-fairmotion-x'}
    }
  }
  _ESClass.register(MyLastToolPanel);
  _es6_module.add_class(MyLastToolPanel);
  MyLastToolPanel = _es6_module.add_export('MyLastToolPanel', MyLastToolPanel);
  UIBase.register(MyLastToolPanel);
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
      this._last_toolmode = undefined;
      this.define_keymap();
    }
     init() {
      if (this.ctx===undefined) {
          this.ctx = new Context();
      }
      super.init();
      this.useDataPathUndo = true;
      this.inner = this.container.col();
      this.makeToolbars();
      this.setCSS();
    }
     setCSS() {
      super.setCSS();
      this.style["background-color"] = this.getDefault("DefaultPanelBG");
    }
     update() {
      super.update();
      if (!this.ctx||!this.ctx.toolmode) {
          return ;
      }
      let name=this.ctx.toolmode.constructor.name;
      if (name!==this._last_toolmode) {
          this._last_toolmode = name;
          console.warn("Rebuilding properties editor");
          this.rebuild();
      }
    }
     rebuild() {
      let data=saveUIData(this.container, "properties");
      this.makeToolbars();
      loadUIData(this, data);
      this.flushUpdate();
      this.flushUpdate();
    }
     makeToolbars() {
      let row=this.inner;
      row.clear();
      let tabs=row.tabs("right");
      tabs.float(1, 35*UIBase.getDPI(), 7);
      let tab=tabs.tab("Workspace");
      let toolmode=this.ctx.toolmode;
      if (toolmode) {
          toolmode.constructor.buildProperties(tab);
      }
      this.strokePanel(tabs);
      this.fillPanel(tabs);
      this.layersPanel(tabs);
      this.vertexPanel(tabs);
      this.lastToolPanel(tabs);
      this.update();
    }
     lastToolPanel(tabs) {
      let tab=tabs.tab("Most Recent Command");
      let panel=document.createElement("last-tool-panel-fairmotion-x");
      tab.add(panel);
    }
     fillPanel(tabs) {
      var ctx=this.ctx;
      let panel=tabs.tab("Fill");
      let panel2=panel.panel("Fill Color");
      let set_path="spline.editable_faces[{$.flag & 1}]";
      panel2.prop("spline.active_face.mat.fillcolor", undefined, set_path+".mat.fillcolor");
      panel.prop("spline.active_face.mat.blur", undefined, set_path+".mat.blur");
      return panel;
    }
     strokePanel(tabs) {
      let panel=tabs.tab("Stroke");
      var ctx=this.ctx;
      let set_prefix=`spline.editable_segments[{$.flag & 1}]`;
      let panel2=panel.panel("Stroke Color");
      panel2.prop("spline.active_segment.mat.strokecolor", undefined, set_prefix+".mat.strokecolor");
      panel.prop("spline.active_segment.mat.linewidth", undefined, set_prefix+".mat.linewidth");
      panel.prop("spline.active_segment.mat.blur", undefined, set_prefix+".mat.blur");
      panel.prop("spline.active_segment.renderable", undefined, set_prefix+".mat.renderable");
      panel.prop("spline.active_segment.mat.flag[MASK_TO_FACE]", undefined, set_prefix+".mat.flag[MASK_TO_FACE]");
      panel2 = panel2.panel("Double Stroking");
      panel2.prop("spline.active_segment.mat.strokecolor2", undefined, set_prefix+".mat.strokecolor2");
      panel2.prop("spline.active_segment.mat.linewidth2", undefined, set_prefix+".mat.linewidth2");
      panel2 = panel.panel("Vertex Width");
      panel2.prop("spline.active_vertex.width", undefined, set_prefix+".width");
      panel2.prop("spline.active_vertex.shift", undefined, set_prefix+".shift");
      panel2 = panel.panel("Segment Width");
      panel2.prop("spline.active_segment.w1", undefined, set_prefix+".w1");
      panel2.prop("spline.active_segment.w2", undefined, set_prefix+".w2");
      panel2.prop("spline.active_segment.shift1", undefined, set_prefix+".shift1");
      panel2.prop("spline.active_segment.shift2", undefined, set_prefix+".shift2");
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
      let set_prefix="spline.editable_verts[{$.flag & 1}]";
      let panel=tab.panel("Vertex");
      panel.prop("spline.active_vertex.flag[BREAK_TANGENTS]", undefined, set_prefix+".flag[BREAK_TANGENTS]");
      panel.prop("spline.active_vertex.flag[BREAK_CURVATURES]", undefined, set_prefix+".flag[BREAK_CURVATURES]");
      panel.prop("spline.active_vertex.flag[USE_HANDLES]", undefined, set_prefix+".flag[USE_HANDLES]");
      panel.prop("spline.active_vertex.flag[GHOST]", undefined, set_prefix+".flag[GHOST]");
      panel.prop("spline.active_vertex.width", undefined, set_prefix+".width");
      panel.prop("spline.active_vertex.shift", undefined, set_prefix+".shift");
      panel = tab.panel("Animation Settings");
      set_prefix = "frameset.keypaths[{$.animflag & 8}]";
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


es6_module_define('DopeSheetEditor', ["../../path.ux/scripts/util/util.js", "./dopesheet_ops.js", "./dopesheet_ops_new.js", "../../path.ux/scripts/pathux.js", "../../core/keymap.js", "../editor_base.js", "../../core/animdata.js", "../../path.ux/scripts/screen/ScreenArea.js", "../../path.ux/scripts/util/simple_events.js", "../../core/toolops_api.js", "../../path.ux/scripts/core/ui_base.js", "../../core/struct.js", "../../curve/spline.js", "../../curve/spline_types.js", "../../util/mathlib.js", "../../path.ux/scripts/core/ui.js"], function _DopeSheetEditor_module(_es6_module) {
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var css2color=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'css2color');
  var color2css=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'color2css');
  var Icons=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'Icons');
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  var ToggleSelectAll=es6_import_item(_es6_module, './dopesheet_ops_new.js', 'ToggleSelectAll');
  var MoveKeyFramesOp=es6_import_item(_es6_module, './dopesheet_ops_new.js', 'MoveKeyFramesOp');
  var SelectKeysOp=es6_import_item(_es6_module, './dopesheet_ops_new.js', 'SelectKeysOp');
  var SelModes2=es6_import_item(_es6_module, './dopesheet_ops_new.js', 'SelModes2');
  var DeleteKeysOp=es6_import_item(_es6_module, './dopesheet_ops_new.js', 'DeleteKeysOp');
  var util=es6_import(_es6_module, '../../path.ux/scripts/util/util.js');
  var eventWasTouch=es6_import_item(_es6_module, '../../path.ux/scripts/util/simple_events.js', 'eventWasTouch');
  "use strict";
  var aabb_isect_2d=es6_import_item(_es6_module, '../../util/mathlib.js', 'aabb_isect_2d');
  var nstructjs=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'nstructjs');
  var KeyMap=es6_import_item(_es6_module, '../../core/keymap.js', 'KeyMap');
  var HotKey=es6_import_item(_es6_module, '../../core/keymap.js', 'HotKey');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var PackFlags=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'PackFlags');
  var UIFlags=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIFlags');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var color2css=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'color2css');
  var _getFont_new=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', '_getFont_new');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ModalStates');
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
  let tree_packflag=0;
  let CHGT=25;
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
          this.icon.hidden = i===0;
      }
    }
     build_path() {
      let path=this.path;
      let p=this;
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
      let paths=path.split(".");
      let tree=this.tree;
      let lasttree=undefined;
      let idgen=~~(id*32);
      if (paths[0].trim()==="root")
        paths = paths.slice(1, paths.length);
      let path2="";
      for (let i=0; i<paths.length; i++) {
          let key=paths[i].trim();
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
    
    
    
    
    
    
     constructor(dopesheet) {
      super();
      this.ds = dopesheet;
      this._last_dpi = undefined;
      this.is_modal = true;
      this.undoflag|=UndoFlags.NO_UNDO;
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
     undoflag: UndoFlags.NO_UNDO, 
     inputs: {}, 
     outputs: {}, 
     icon: -1}
    }
     modalStart(ctx) {
      this.start_cameramat = new Matrix4(ctx.view2d.cameramat);
    }
     on_mousemove(event) {
      let mpos=new Vector3([event.x, event.y, 0]);
      console.log(event.x, event.y);
      if (this.first) {
          this.first = false;
          this.start_mpos.load(mpos);
          return ;
      }
      let ctx=this.modal_ctx;
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
      this.keymap = new KeyMap("dopesheet");
      let k=this.keymap;
      k.add(new HotKey("A", [], function (ctx) {
        console.log("Dopesheet toggle select all!");
        let tool=new ToggleSelectAll();
        ctx.api.execTool(ctx, tool);
        window.force_viewport_redraw();
        window.redraw_viewport();
      }, "Toggle Select All"));
      k.add(new HotKey("X", [], "anim.delete_keys()"));
      k.add(new HotKey("Delete", [], "anim.delete_keys()"));
      k.add(new HotKey("G", [], function (ctx) {
        console.log("Dopesheet toggle select all!");
        let tool=new MoveKeyFramesOp();
        ctx.api.execTool(ctx, tool);
        window.force_viewport_redraw();
        window.redraw_viewport();
      }, "Move Keyframes"));
      k.add(new HotKey("Z", ["CTRL"], function (ctx) {
        g_app_state.toolstack.undo();
      }, "Undo"));
      k.add(new HotKey("Z", ["CTRL", "SHIFT"], function (ctx) {
        g_app_state.toolstack.redo();
      }, "Redo"));
      k.add(new HotKey("Up", [], function (ctx) {
        ctx.scene.change_time(ctx, ctx.scene.time+10);
        window.force_viewport_redraw();
        window.redraw_viewport();
      }, "Frame Ahead 10"));
      k.add(new HotKey("Down", [], function (ctx) {
        ctx.scene.change_time(ctx, ctx.scene.time-10);
        window.force_viewport_redraw();
        window.redraw_viewport();
      }, "Frame Back 10"));
      k.add(new HotKey("Right", [], function (ctx) {
        console.log("Frame Change!", ctx.scene.time+1);
        ctx.scene.change_time(ctx, ctx.scene.time+1);
        window.redraw_viewport();
      }, "Next Frame"));
      k.add(new HotKey("Left", [], function (ctx) {
        console.log("Frame Change!", ctx.scene.time-1);
        ctx.scene.change_time(ctx, ctx.scene.time-1);
        window.redraw_viewport();
      }, "Previous Frame"));
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
      this.startbutton = this.header.iconbutton(Icons.ANIM_START, "Animation Playback", () =>        {
        console.log("playback");
      });
      this.startbutton.iconsheet = 0;
      let prev=this.header.tool("anim.nextprev(dir=-1)", PackFlags.USE_ICONS);
      prev.icon = Icons.ANIM_PREV;
      prev.iconsheet = 0;
      this.playbutton = this.header.iconbutton(Icons.ANIM_PLAY, "Animation Playback", () =>        {
        console.log("playback");
        this.ctx.screen.togglePlayback();
      });
      this.playbutton.iconsheet = 0;
      let next=this.header.tool("anim.nextprev(dir=1)", PackFlags.USE_ICONS);
      next.icon = Icons.ANIM_NEXT;
      next.iconsheet = 0;
      this.endbutton = this.header.iconbutton(Icons.ANIM_END, "Animation Playback", () =>        {
        console.log("playback");
      });
      this.endbutton.iconsheet = 0;
      this.header.prop("scene.frame");
      this.header.prop("dopesheet.timescale");
      this._queueDagLink = true;
      this.rebuild();
      this.redraw();
      this.define_keymap();
    }
     dag_unlink_all() {
      for (let node of this.nodes) {
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
      if (!window.g_app_state)
        return ;
      super.update();
      if (g_app_state.modalstate&ModalStates.PLAYING) {
          this.playbutton.icon = Icons.ANIM_PAUSE;
      }
      else {
        this.playbutton.icon = Icons.ANIM_PLAY;
      }
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
      p[0] = (p[0]/this.zoom)-this.pan[0];
      p[1] = (p[1]/this.zoom)-this.pan[1];
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
      else 
        if (e.button===0&&!e.altKey&&!e.shiftKey&&!e.ctrlKey&&!e.commandKey) {
          let p1=new Vector2(this.getLocalMouse(e.x, e.y));
          this.unproject(p1);
          let time1=~~(p1[0]/this.timescale/this.boxSize+0.5);
          this.ctx.scene.change_time(this.ctx, time1);
          console.log("time", time1);
      }
      if (e.button>0||e.altKey) {
          this.ctx.toolstack.execTool(this.ctx, new PanOp(this));
      }
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
      else 
        if (this.activeBoxes.highlight) {
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
      else {
        let p1=new Vector2(this.getLocalMouse(e.x, e.y));
        this.unproject(p1);
        let time1=~~(p1[0]/this.timescale/this.boxSize+0.5);
        if (time1!==this.ctx.scene.time) {
            this.ctx.scene.change_time(this.ctx, time1);
            console.log("time", time1);
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
                console.warn("missing vertex", k);
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
            timescale = this.timescale;
            boxsize = this.boxSize;
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
      if (_DEBUG.timeChange)
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
      if (_DEBUG.timeChange)
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
          if (spacing&&((~~t)%spacing)!==0) {
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
      let ctx=this.ctx;
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
        if (_DEBUG.timeChange)
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
      the_global_dag.link(ctx.frameset.spline, ["on_keyframe_insert"], on_vert_change, ["verts"]);
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
    pinned_ids      : array(int) | this.pinned_ids !== undefined ? this.pinned_ids : [];
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


es6_module_define('dopesheet_transdata', ["../../core/animdata.js", "../viewport/transdata.js", "../../util/mathlib.js"], function _dopesheet_transdata_module(_es6_module) {
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


es6_module_define('dopesheet_ops', ["../../core/toolops_api.js", "../../core/toolprops.js", "../../core/animdata.js", "./dopesheet_phantom.js"], function _dopesheet_ops_module(_es6_module) {
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
      return {toolpath: "spline.shift_time2", 
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
      if (!this.modalRunning) {
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
      return {toolpath: "spline.shift_time3", 
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
      if (!this.modalRunning) {
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
      return {toolpath: "spline.select_keyframe", 
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
      return {toolpath: "spline.select_keyframe_column", 
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
      return {toolpath: "spline.select_keys_to_side", 
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
      return {toolpath: "spline.toggle_select_keys", 
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
      return {toolpath: "spline.delete_key", 
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


es6_module_define('dopesheet_ops_new', ["../../core/toolprops.js", "../../path.ux/scripts/util/vectormath.js", "../../path.ux/scripts/util/util.js", "../../datafiles/icon_enum.js", "../../core/animdata.js", "../../core/toolops_api.js", "../../curve/spline_base.js"], function _dopesheet_ops_new_module(_es6_module) {
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
  var Icons=es6_import_item(_es6_module, '../../datafiles/icon_enum.js', 'Icons');
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
     kill() {
      throw new Error("implement me");
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
      this.channel = undefined;
      this.frameset = undefined;
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
     kill() {
      this.frameset.vertex_animdata[this.channel].remove(this.v);
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
     init(spline, v, vd_eid, frameset) {
      this.spline = spline;
      this.v = v;
      this.channel = vd_eid;
      this.frameset = frameset;
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
      super();
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
          let channelmap={};
          let frameset=ctx.frameset;
          for (let k in frameset.vertex_animdata) {
              let vd=frameset.vertex_animdata[k];
              for (let v of vd.verts) {
                  channelmap[v.eid] = parseInt(k);
              }
          }
          for (let i=0; i<list.length; i+=2) {
              let type=list[i], id=list[i+1];
              if (type===AnimKeyTypes.SPLINE) {
                  let v=pathspline.eidmap[id];
                  if (!v) {
                      console.warn("Error iterating spline animation keys; key could not be found", id, pathspline);
                      continue;
                  }
                  if (!(v.eid in channelmap)) {
                      console.error("CORRUPTION ERROR!", v.eid, channelmap);
                      continue;
                  }
                  yield vkey_cache.next().init(pathspline, v, channelmap[v.eid], frameset);
              }
              else {
                throw new Error("implement me!");
              }
          }
      }
      else {
        let frameset=ctx.frameset;
        let spline=frameset.spline;
        let pathspline=frameset.pathspline;
        let templist=[];
        for (var i2=0; i2<2; i2++) {
            let list=i2 ? spline.handles : spline.verts;
            for (let v of list.selected.editable(ctx)) {
                if (!(v.eid in frameset.vertex_animdata)) {
                    continue;
                }
                let vd=frameset.vertex_animdata[v.eid];
                templist.length = 0;
                for (let v2 of vd.verts) {
                    templist.push(v2);
                }
                for (let v2 of templist) {
                    yield vkey_cache.next().init(pathspline, v2, v.eid, frameset);
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
  class NextPrevKeyFrameOp extends AnimKeyTool {
     constructor() {
      super();
    }
    static  tooldef() {
      return {uiname: "Next/Prev Keyframe", 
     toolpath: "anim.nextprev", 
     icon: Icons.ANIM_NEXT, 
     inputs: ToolOp.inherit({dir: new IntProperty(1)}), 
     outputs: ToolOp.inherit({frame: new IntProperty(0)})}
    }
     exec(ctx) {
      let dir=this.inputs.dir.getValue();
      let scene=ctx.scene;
      let time=scene.time;
      let mint, minf;
      console.log("Next Keyframe", time);
      for (let key of this.iterKeys(ctx)) {
          let t=key.getTime();
          console.log("  ", t);
          if (dir>0&&t>time&&(mint===undefined||t-time<mint)) {
              mint = t-time;
              minf = t;
          }
          else 
            if (dir<0&&t<time&&(mint===undefined||time-t<mint)) {
              mint = time-t;
              minf = t;
          }
      }
      console.log(minf, mint, time);
      if (minf!==undefined) {
          scene.change_time(ctx, minf);
          window.redraw_viewport();
      }
    }
     undoPre(ctx) {
      this.undo_pre(ctx);
    }
    static  canRun(ctx) {
      return ctx.scene;
    }
     undo_pre(ctx) {
      this._undo_time = ctx.scene.time;
    }
     undo(ctx) {
      if (ctx.scene.time===this._undo_time) {
          return ;
      }
      ctx.scene.change_time(this._undo_time);
      window.redraw_viewport();
    }
  }
  _ESClass.register(NextPrevKeyFrameOp);
  _es6_module.add_class(NextPrevKeyFrameOp);
  NextPrevKeyFrameOp = _es6_module.add_export('NextPrevKeyFrameOp', NextPrevKeyFrameOp);
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
  class DeleteKeysOp extends AnimKeyTool {
     constructor() {
      super();
    }
    static  tooldef() {
      return {name: "Delete Keyframes", 
     toolpath: "anim.delete_keys", 
     inputs: ToolOp.inherit({})}
    }
     exec(ctx) {
      console.warn("Deleting keyframes!");
      for (let key of this.iterKeys(ctx)) {
          if (key.getFlag()&AnimKeyFlags.SELECT) {
              key.kill();
          }
      }
      ctx.frameset.rationalize_vdata_layers();
      ctx.frameset.spline.flagUpdateKeyframes();
      ctx.frameset.pathspline.flagUpdateVertTime();
    }
     undo_pre(ctx) {
      ToolOp.prototype.undo_pre.call(this, ctx);
    }
     undoPre(ctx) {
      ToolOp.prototype.undo_pre.call(this, ctx);
    }
     undo(ctx) {
      ToolOp.prototype.undo.call(this, ctx);
      ctx.frameset.pathspline.flagUpdateVertTime();
      ctx.frameset.spline.flagUpdateKeyframes();
      if (ctx.dopesheet) {
          ctx.dopesheet.updateKeyPositions();
          ctx.dopesheet.redraw();
      }
    }
  }
  _ESClass.register(DeleteKeysOp);
  _es6_module.add_class(DeleteKeysOp);
  DeleteKeysOp = _es6_module.add_export('DeleteKeysOp', DeleteKeysOp);
}, '/dev/fairmotion/src/editors/dopesheet/dopesheet_ops_new.js');


es6_module_define('editcurve_ops', [], function _editcurve_ops_module(_es6_module) {
}, '/dev/fairmotion/src/editors/curve/editcurve_ops.js');


es6_module_define('editcurve_util', [], function _editcurve_util_module(_es6_module) {
}, '/dev/fairmotion/src/editors/curve/editcurve_util.js');


es6_module_define('CurveEditor', ["../../path.ux/scripts/util/vectormath.js", "../editor_base.js", "../../path.ux/scripts/pathux.js", "../../path.ux/scripts/core/ui_base.js", "../../path.ux/scripts/screen/ScreenArea.js", "../../path.ux/scripts/util/simple_events.js", "../../core/struct.js"], function _CurveEditor_module(_es6_module) {
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
      g.fillStyle = "rgb(75, 75, 75)";
      g.rect(0, 0, canvas.width, canvas.height);
      g.fill();
      let fsize=10;
      g.font = ""+fsize+"px sans-serif";
      let pad=fsize*3.0;
      let csize=32;
      g.fillStyle = "grey";
      g.beginPath();
      g.rect(0, 0, pad, this.size[1]);
      g.rect(0, this.size[1]-pad, this.size[0], pad);
      g.rect(0, 0, this.size[0], pad);
      g.rect(this.size[0]-pad, 0, pad, this.size[1]);
      g.fill();
      g.fillStyle = "orange";
      for (let step=0; step<2; step++) {
          let steps=Math.floor(this.size[step]/csize+1.0);
          let off=this.pan[step]%csize;
          let x=off-csize;
          for (let i=0; i<steps; i++) {
              let val=i-Math.floor(this.pan[step]/csize);
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
                  let a=1.0;
                  let ix=Math.floor(i-this.pan[step]/csize);
                  if (ix%4===0) {
                      a = 0.95;
                  }
                  else 
                    if (ix%2===0) {
                      a = 0.678;
                  }
                  else {
                    a = 0.42;
                  }
                  a = ~~(a*255);
                  g.strokeStyle = `rgb(${a},${a},${a})`;
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
  class NotificationManager  {
     label(label, description) {
      console.warn(label);
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


es6_module_define('app_ops', ["../util/svg_export.js", "../core/fileapi/fileapi.js", "./viewport/spline_createops.js", "../util/strutils.js", "../config/config.js", "../core/toolprops.js", "../../platforms/platform.js", "../core/toolops_api.js"], function _app_ops_module(_es6_module) {
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
  class AppQuitOp extends ToolOp {
     constructor() {
      super();
      this.undoflag = UndoFlags.NO_UNDO;
      this.flag = ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS;
    }
    static  tooldef() {
      return {toolpath: "appstate.quit", 
     uiname: "Exit", 
     is_modal: false, 
     undoflag: UndoFlags.NO_UNDO}
    }
     exec(ctx) {
      let $_t0tqqm=require('electron'), ipcRenderer=$_t0tqqm.ipcRenderer;
      ipcRenderer.invoke('quit-fairmotion');
    }
  }
  _ESClass.register(AppQuitOp);
  _es6_module.add_class(AppQuitOp);
  AppQuitOp = _es6_module.add_export('AppQuitOp', AppQuitOp);
  class FileOpenOp extends ToolOp {
     constructor() {
      super();
      this.undoflag = UndoFlags.NO_UNDO;
      this.flag = ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS;
    }
    static  tooldef() {
      return {toolpath: "appstate.open", 
     uiname: "Open", 
     inputs: {path: new StringProperty("", "path", "File Path", "File Path")}, 
     outputs: {}, 
     icon: Icons.RESIZE, 
     is_modal: false, 
     undoflag: UndoFlags.NO_UNDO, 
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
  class OpenRecentOp extends ToolOp {
     constructor(do_progress=true) {
      super();
    }
    static  tooldef() {
      return {toolpath: "appstate.open_recent", 
     uiname: "Open Recent", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     undoflag: UndoFlags.NO_UNDO, 
     flag: ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS}
    }
     exec(ctx) {
      console.error("Implement me!");
      ctx.error("Implement me!");
    }
  }
  _ESClass.register(OpenRecentOp);
  _es6_module.add_class(OpenRecentOp);
  OpenRecentOp = _es6_module.add_export('OpenRecentOp', OpenRecentOp);
  class FileSaveAsOp extends ToolOp {
    
     constructor(do_progress=true) {
      super();
      this.do_progress = true;
    }
    static  tooldef() {
      return {toolpath: "appstate.save_as", 
     uiname: "Save As", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     undoflag: UndoFlags.NO_UNDO, 
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
      return {toolpath: "appstate.save", 
     uiname: "Save", 
     inputs: {}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     undoflag: UndoFlags.NO_UNDO, 
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
      return {toolpath: "appstate.export_svg", 
     uiname: "Export SVG", 
     inputs: {path: new StringProperty("", "path", "File Path", "File Path")}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     undoflag: UndoFlags.NO_UNDO, 
     flag: ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS}
    }
     exec(ctx) {
      console.log("Export SVG");
      ctx = new Context();
      var buf=export_svg(ctx.spline);
      if (g_app_state.filepath!=="") {
          var name=g_app_state.filepath;
          if (name===undefined||name==="") {
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
      return {toolpath: "appstate.export_al3_b64", 
     uiname: "Export Base64", 
     description: "Export a base64-encoded .fmo file", 
     inputs: {path: new StringProperty("", "path", "File Path", "File Path")}, 
     outputs: {}, 
     icon: -1, 
     is_modal: false, 
     undoflag: UndoFlags.NO_UNDO, 
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


es6_module_define('editor_base', ["../core/struct.js", "../core/keymap.js", "../path.ux/scripts/pathux.js", "../path.ux/scripts/screen/ScreenArea.js", "../path.ux/scripts/util/util.js", "../path.ux/scripts/screen/FrameManager.js", "../core/toolops_api.js", "../path.ux/scripts/core/ui_base.js"], function _editor_base_module(_es6_module) {
  var Area=es6_import_item(_es6_module, '../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var areaclasses=es6_import_item(_es6_module, '../path.ux/scripts/screen/ScreenArea.js', 'areaclasses');
  var contextWrangler=es6_import_item(_es6_module, '../path.ux/scripts/screen/ScreenArea.js', 'contextWrangler');
  var ScreenArea=es6_import_item(_es6_module, '../path.ux/scripts/screen/ScreenArea.js', 'ScreenArea');
  var Screen=es6_import_item(_es6_module, '../path.ux/scripts/screen/FrameManager.js', 'Screen');
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  var ui_base=es6_import(_es6_module, '../path.ux/scripts/core/ui_base.js');
  var util=es6_import(_es6_module, '../path.ux/scripts/util/util.js');
  var ModalStates=es6_import_item(_es6_module, '../core/toolops_api.js', 'ModalStates');
  var HotKey=es6_import_item(_es6_module, '../core/keymap.js', 'HotKey');
  var KeyMap=es6_import_item(_es6_module, '../core/keymap.js', 'KeyMap');
  var haveModal=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'haveModal');
  function resetAreaStacks() {
    contextWrangler.reset();
  }
  resetAreaStacks = _es6_module.add_export('resetAreaStacks', resetAreaStacks);
  class FairmotionScreen extends Screen {
    
     constructor() {
      super();
      this._last_keymap_gen = -1;
      this.startFrame = 1;
      this._lastFrameTime = util.time_ms();
      this.define_keymap();
    }
     init() {
      this.define_keymap();
    }
     define_keymap() {
      let k=this.keymap = new KeyMap("screen");
      k.add(new HotKey("O", ["CTRL"], "appstate.open()"));
      k.add(new HotKey("O", ["CTRL", "SHIFT"], "appstate.open_recent()"));
      k.add(new HotKey("S", ["CTRL", "ALT"], "appstate.save_as()"));
      k.add(new HotKey("S", ["CTRL"], "appstate.save()"));
      k.add(new HotKey("U", ["CTRL", "SHIFT"], function () {
        g_app_state.set_startup_file();
      }, "Save Startup File"));
      k.add(new HotKey("Left", ["CTRL"], "anim.nextprev(dir=-1)|Previous Keyframe"));
      k.add(new HotKey("Right", ["CTRL"], "anim.nextprev(dir=1)|Next Keyframe"));
      k.add(new HotKey("Space", [], () =>        {
        this.ctx.screen.togglePlayback();
      }, "Animation Playback"));
      k.add(new HotKey("Escape", [], () =>        {
        this.ctx.screen.stopPlayback();
      }, "Animation Playback"));
      k.add(new HotKey("Z", ["CTRL", "SHIFT"], function (ctx) {
        console.log("Redo");
        ctx.toolstack.redo();
      }, "Redo"));
      k.add(new HotKey("Y", ["CTRL"], function (ctx) {
        console.log("Redo");
        ctx.toolstack.redo();
      }, "Redo"));
      k.add(new HotKey("Z", ["CTRL"], function (ctx) {
        console.log("Undo");
        ctx.toolstack.undo();
      }, "Undo"));
      k.loadDeltaSet();
    }
    * getKeySets() {
      let this2=this;
      yield new KeymapSet("General", "screen", [this2.keymap]);
      for (let key in areaclasses) {
          let cls=areaclasses[key];
          if (cls.name==="SettingsEditor") {
              continue;
          }
          let area=new cls();
          area.ctx = this.ctx;
          area.size = [512, 512];
          area.pos = [0, 0];
          area.updateSize = function () {
          };
          try {
            area._init();
          }
          catch (error) {
              console.error(error.stack);
              console.error(error.message);
          }
          let uiname=area.constructor.define().uiname||area.constructor.name;
          let path=area.constructor.name;
          let km=area.getKeyMaps();
          if (!(__instance_of(km, KeymapSet))) {
              km = new KeymapSet(uiname, path, km);
          }
          for (let keymap of km) {

          }
          yield km;
      }
      return ;
      for (let sarea of this2.sareas) {
          if (!sarea.area)
            continue;
          let area=sarea.area;
          let uiname=area.constructor.define().uiname||area.constructor.name;
          let path=area.constructor.name;
          let km=sarea.area.getKeyMaps();
          if (!(__instance_of(km, KeymapSet))) {
              km = new KeymapSet(uiname, path, km);
          }
          for (let keymap of km) {
              keymap.loadDeltaSet();
          }
          yield km;
      }
    }
     stopPlayback() {
      if (g_app_state.modalstate===ModalStates.PLAYING) {
          console.log("Playback end");
          g_app_state.popModalState(ModalStates.PLAYING);
          this._lastFrameTime = util.time_ms();
          window.redraw_viewport();
      }
    }
     togglePlayback() {
      if (g_app_state.modalstate===ModalStates.PLAYING) {
          console.log("Playback end");
          g_app_state.popModalState(ModalStates.PLAYING);
          this._lastFrameTime = util.time_ms();
          window.redraw_viewport();
      }
      else {
        this.startFrame = this.ctx.scene.time;
        console.log("Playback start");
        g_app_state.pushModalState(ModalStates.PLAYING);
      }
    }
     update() {
      super.update();
      if (this.ctx&&this._last_keymap_gen!==this.ctx.state.settings.keyDeltaGen) {
          this._last_keymap_gen = this.ctx.state.settings.keyDeltaGen;
          this.keymap.loadDeltaSet();
      }
      if (g_app_state.modalstate===ModalStates.PLAYING) {
          let scene=this.ctx.scene;
          let dt=util.time_ms()-this._lastFrameTime;
          let fps=scene.fps;
          if (dt>1000.0/fps) {
              scene.change_time(this.ctx, scene.time+1);
              this._lastFrameTime = util.time_ms();
          }
      }
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
  class KeymapSet extends Array {
     constructor(name, path, keymaps) {
      super();
      this.name = name;
      this.path = path;
      if (keymaps) {
          for (let keymap of keymaps) {
              this.push(keymap);
          }
      }
    }
  }
  _ESClass.register(KeymapSet);
  _es6_module.add_class(KeymapSet);
  KeymapSet = _es6_module.add_export('KeymapSet', KeymapSet);
  class Editor extends Area {
    
     constructor() {
      super();
      this._last_keymap_delta_gen = 0;
      this.canvases = {};
    }
     makeHeader(container) {
      return super.makeHeader(container);
    }
     getKeyMaps() {
      if (this.keymap) {
          return [this.keymap];
      }
      return [];
    }
     update() {
      super.update();
      if (!this.ctx||!this.ctx.state) {
          return ;
      }
      if (this._last_keymap_delta_gen!==this.ctx.state.keyDeltaGen) {
          this._last_keymap_delta_gen = this.ctx.state.keyDeltaGen;
          for (let k of this.getKeyMaps()) {
              k.loadDeltaSet();
          }
      }
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
      this.keymap = new KeyMap(this.constructor.define().uiname||this.constructor.name);
      if (this.helppicker) {
          this.helppicker.iconsheet = 0;
      }
      this.style["overflow"] = "hidden";
      this.setCSS();
      this.doOnce(() =>        {
        this.keymap.loadDeltaSet();
        for (let keymap of this.getKeyMaps()) {
            keymap.loadDeltaSet();
        }
      });
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
          let sw=(w/dpi/dpi_scale)+"px";
          let sh=(h/dpi/dpi_scale)+"px";
          if (canvas.style["left"]!=="0px") {
              canvas.style["left"] = "0px";
              canvas.style["top"] = "0px";
          }
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
    static  getActiveArea() {
      return this.active_area();
    }
    static  active_area() {
      return contextWrangler.getLastArea(this);
    }
    static  context_area(cls) {
      return contextWrangler.getLastArea(cls);
    }
    static  wrapContextEvent(f) {
      return function (e) {
        if (haveModal()) {
            return ;
        }
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
     push_ctx_active(dontSetLastRef=false) {
      super.push_ctx_active(dontSetLastRef);
    }
     pop_ctx_active(dontSetLastRef=false) {
      super.pop_ctx_active(dontSetLastRef);
    }
  }
  _ESClass.register(Editor);
  _es6_module.add_class(Editor);
  Editor = _es6_module.add_export('Editor', Editor);
  Editor.STRUCT = STRUCT.inherit(Editor, Area)+`
}
`;
}, '/dev/fairmotion/src/editors/editor_base.js');


es6_module_define('manipulator', ["../../config/config.js", "../../util/mathlib.js"], function _manipulator_module(_es6_module) {
  "use strict";
  var dist_to_line_v2=es6_import_item(_es6_module, '../../util/mathlib.js', 'dist_to_line_v2');
  var config=es6_import(_es6_module, '../../config/config.js');
  let ManipFlags={}
  ManipFlags = _es6_module.add_export('ManipFlags', ManipFlags);
  let HandleShapes={ARROW: 0, 
   HAMMER: 1, 
   ROTCIRCLE: 2, 
   SIMPLE_CIRCLE: 3, 
   OUTLINE: 4}
  HandleShapes = _es6_module.add_export('HandleShapes', HandleShapes);
  let HandleColors={DEFAULT: [0, 0, 0, 1], 
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
  var $min_ftoO_update;
  var $max_T3MT_update;
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
      if (this.color.length===3)
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
      let minx=Math.min(this._min[0], this._max[0]);
      let miny=Math.min(this._min[1], this._max[1]);
      let maxx=Math.max(this._min[0], this._max[0]);
      let maxy=Math.max(this._min[1], this._max[1]);
      this._min[0] = minx;
      this._min[1] = miny;
      this._max[0] = maxx;
      this._max[1] = maxy;
    }
     update() {
      let p=this._redraw_pad;
      $min_ftoO_update[0] = this._min[0]-p;
      $min_ftoO_update[1] = this._min[1]-p;
      $max_T3MT_update[0] = this._max[0]+p;
      $max_T3MT_update[1] = this._max[1]+p;
      window.redraw_viewport($min_ftoO_update, $max_T3MT_update);
      this.update_aabb();
      $min_ftoO_update[0] = this._min[0]-p;
      $min_ftoO_update[1] = this._min[1]-p;
      $max_T3MT_update[0] = this._max[0]+p;
      $max_T3MT_update[1] = this._max[1]+p;
      window.redraw_viewport($min_ftoO_update, $max_T3MT_update);
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
      if (this.shape===HandleShapes.ARROW) {
          g.beginPath();
          let dx=this.v2[0]-this.v1[0], dy=this.v2[1]-this.v1[1];
          let dx2=this.v1[1]-this.v2[1], dy2=this.v2[0]-this.v1[0];
          let l=Math.sqrt(dx2*dx2+dy2*dy2);
          if (l===0.0) {
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
        if (this.shape===HandleShapes.OUTLINE) {
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
  var $min_ftoO_update=new Vector2();
  var $max_T3MT_update=new Vector2();
  _ESClass.register(ManipHandle);
  _es6_module.add_class(ManipHandle);
  ManipHandle = _es6_module.add_export('ManipHandle', ManipHandle);
  var $min_kcvR_update;
  var $max_mVC9_update;
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
      if (this.color.length===3)
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
      dis = dis!==0.0 ? Math.sqrt(dis) : 0.0;
      return Math.abs(dis-this.r);
    }
     update_aabb() {
      this._min[0] = this.parent.co[0]+this.p[0]-Math.sqrt(2)*this.r;
      this._min[1] = this.parent.co[1]+this.p[1]-Math.sqrt(2)*this.r;
      this._max[0] = this.parent.co[0]+this.p[0]+Math.sqrt(2)*this.r;
      this._max[1] = this.parent.co[1]+this.p[1]+Math.sqrt(2)*this.r;
    }
     update() {
      let p=this._redraw_pad;
      $min_kcvR_update[0] = this._min[0]-p;
      $min_kcvR_update[1] = this._min[1]-p;
      $max_mVC9_update[0] = this._max[0]+p;
      $max_mVC9_update[1] = this._max[1]+p;
      window.redraw_viewport($min_kcvR_update, $max_mVC9_update);
      this.update_aabb();
      $min_kcvR_update[0] = this._min[0]-p;
      $min_kcvR_update[1] = this._min[1]-p;
      $max_mVC9_update[0] = this._max[0]+p;
      $max_mVC9_update[1] = this._max[1]+p;
      window.redraw_viewport($min_kcvR_update, $max_mVC9_update);
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
  var $min_kcvR_update=new Vector2();
  var $max_mVC9_update=new Vector2();
  _ESClass.register(ManipCircle);
  _es6_module.add_class(ManipCircle);
  ManipCircle = _es6_module.add_export('ManipCircle', ManipCircle);
  var _mh_idgen_2=1;
  var _mp_first=true;
  class Manipulator  {
    
    
    
    
    
     constructor(handles, ctx) {
      this._hid = _mh_idgen_2++;
      this.handles = handles.slice(0, handles.length);
      this.recalc = 1;
      this.parent = undefined;
      this.user_data = undefined;
      this.dead = false;
      this.ctx = ctx;
      for (let h of this.handles) {
          h.parent = this;
      }
      this.handle_size = 65;
      this.co = new Vector3();
      this.hidden = false;
    }
    static  nodedef() {
      return {name: "manipulator", 
     uiName: "Manipulator", 
     inputs: {depend: undefined}, 
     outputs: {depend: undefined}}
    }
     dag_exec(ctx, inputs, outputs, graph) {
      if (this.dead||this.hidden) {
          the_global_dag.remove(this);
          window.redraw_viewport();
          return ;
      }
      this.on_tick(ctx);
    }
     checkDagLink(ctx) {
      if (!window.the_global_dag.has(this)) {
          console.warn("MAKING DAG CONNECTION", this);
          this._node = window.the_global_dag.direct_node(ctx, this, true);
          window.the_global_dag.link(ctx.view2d, "onDrawPre", this, "depend");
          window.redraw_viewport();
      }
    }
     hide() {
      if (!this.hidden) {
          window.redraw_viewport();
      }
      console.warn("hide!");
      the_global_dag.remove(this);
      if (!this.hidden) {
          this.update();
      }
      this.hidden = true;
    }
     unhide() {
      if (this.hidden) {
          window.redraw_viewport();
      }
      this.checkDagLink(this.ctx);
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
      for (let h of this.handles) {
          h.update();
      }
    }
     on_tick(ctx) {
      this.checkDagLink(ctx);
    }
     [Symbol.keystr]() {
      return "MP"+this._hid.toString;
    }
     end() {
      this.dead = true;
      this.parent.remove(this);
    }
     get_render_rects(ctx, canvas, g) {
      let rects=[];
      if (this.hidden) {
          return rects;
      }
      for (let h of this.handles) {
          let rs=h.get_render_rects(ctx, canvas, g);
          for (let i=0; i<rs.length; i++) {
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
      for (let h of this.handles) {
          let x=this.co[0], y=this.co[1];
          g.translate(x, y);
          h.render(canvas, g);
          g.translate(-x, -y);
      }
    }
     outline(min, max, id, clr=[0, 0, 0, 1.0]) {
      min = new Vector2(min);
      max = new Vector2(max);
      let h=new ManipHandle(min, max, id, HandleShapes.OUTLINE, this.view3d, clr);
      h.transparent = true;
      h.parent = this;
      this.handles.push(h);
      return h;
    }
     arrow(v1, v2, id, clr=[0, 0, 0, 1.0]) {
      v1 = new Vector2(v1);
      v2 = new Vector2(v2);
      let h=new ManipHandle(v1, v2, id, HandleShapes.ARROW, this.view3d, clr);
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
      return this.active!==undefined ? this.active.on_click(event, view2d, this.active.id) : undefined;
    }
  }
  _ESClass.register(Manipulator);
  _es6_module.add_class(Manipulator);
  Manipulator = _es6_module.add_export('Manipulator', Manipulator);
  var $nil_iPWB_get_render_rects;
  class ManipulatorManager  {
    
    
    
     constructor(view2d, ctx) {
      this.view2d = view2d;
      this.ctx = ctx;
      this.stack = [];
      this.active = undefined;
    }
     render(canvas, g) {
      if (this.active!==undefined) {
          this.active.render(canvas, g);
      }
    }
     get_render_rects(ctx, canvas, g) {
      if (this.active!==undefined) {
          return this.active.get_render_rects(ctx, canvas, g);
      }
      else {
        return $nil_iPWB_get_render_rects;
      }
    }
     remove(mn) {
      mn.dead = true;
      if (mn===this.active) {
          this.pop();
      }
      else {
        this.stack.remove(mn);
      }
      window.redraw_viewport();
    }
     push(mn) {
      mn.dead = false;
      mn.parent = this;
      mn.ctx = this.ctx;
      this.stack.push(this.active);
      this.active = mn;
    }
     ensure_not_toolop(ctx, cls) {
      if (this.active!==undefined&&this.active.toolop_class===cls) {
          this.remove(this.active);
      }
    }
     ensure_toolop(ctx, cls) {
      if (this.active!==undefined&&this.active.toolop_class===cls) {
          return this.active;
      }
      if (this.active!==undefined) {
          this.remove(this.active);
      }
      this.active = cls.create_widgets(this, ctx);
      if (this.active!==undefined) {
          this.active.toolop_class = cls;
      }
    }
     pop() {
      let ret=this.active;
      this.active = this.stack.pop(-1);
    }
     on_mousemove(event, view2d) {
      return this.active!==undefined ? this.active.on_mousemove(event, view2d) : undefined;
    }
     on_click(event, view2d) {
      if (event.button===1||event.button===2) {
          return ;
      }
      return this.active!==undefined ? this.active.on_click(event, view2d) : undefined;
    }
     active_toolop() {
      if (this.active===undefined)
        return undefined;
      return this.active.toolop_class;
    }
     create(cls, do_push=true, ctx=this.ctx) {
      let mn=new Manipulator([], ctx);
      mn.parent = this;
      mn.toolop_class = cls;
      if (do_push)
        this.push(mn);
      return mn;
    }
     on_tick(ctx) {
      if (this.active!==undefined&&this.active.on_tick!==undefined)
        this.active.on_tick(ctx);
    }
     circle(p, r, clr, do_push=true, ctx=this.ctx) {
      let h=new ManipCircle(p, r, id, this.view3d, clr);
      let mn=new Manipulator([h], ctx);
      mn.parent = this;
      if (do_push) {
          this.push(mn);
      }
      return mn;
    }
     arrow(v1, v2, id, clr, do_push=true, ctx=this.ctx) {
      v1 = new Vector2(v1);
      v2 = new Vector2(v2);
      let h=new ManipHandle(v1, v2, id, HandleShapes.ARROW, this.view3d, clr);
      let mn=new Manipulator([h], ctx);
      mn.parent = this;
      if (do_push)
        this.push(mn);
      return mn;
    }
  }
  var $nil_iPWB_get_render_rects=[];
  _ESClass.register(ManipulatorManager);
  _es6_module.add_class(ManipulatorManager);
  ManipulatorManager = _es6_module.add_export('ManipulatorManager', ManipulatorManager);
}, '/dev/fairmotion/src/editors/viewport/manipulator.js');


es6_module_define('view2d', ["./view2d_ops.js", "../../path.ux/scripts/widgets/ui_menu.js", "../editor_base.js", "../../core/eventdag.js", "./view2d_editor.js", "./view2d_spline_ops.js", "./selectmode.js", "../../core/keymap.js", "./manipulator.js", "../../path.ux/scripts/core/ui.js", "./toolmodes/all.js", "../../path.ux/scripts/screen/ScreenArea.js", "../../core/imageblock.js", "../../core/struct.js", "../../core/toolops_api.js", "./toolmodes/pentool.js", "../../core/context.js", "../../path.ux/scripts/util/util.js", "../../path.ux/scripts/core/ui_base.js"], function _view2d_module(_es6_module) {
  var FullContext=es6_import_item(_es6_module, '../../core/context.js', 'FullContext');
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  var SessionFlags=es6_import_item(_es6_module, './view2d_editor.js', 'SessionFlags');
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var patchMouseEvent=es6_import_item(_es6_module, '../../core/toolops_api.js', 'patchMouseEvent');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var createMenu=es6_import_item(_es6_module, '../../path.ux/scripts/widgets/ui_menu.js', 'createMenu');
  var startMenu=es6_import_item(_es6_module, '../../path.ux/scripts/widgets/ui_menu.js', 'startMenu');
  var util=es6_import(_es6_module, '../../path.ux/scripts/util/util.js');
  var PenToolMode=es6_import_item(_es6_module, './toolmodes/pentool.js', 'PenToolMode');
  var ImageUser=es6_import_item(_es6_module, '../../core/imageblock.js', 'ImageUser');
  var SplineEditor=es6_import_item(_es6_module, './view2d_spline_ops.js', 'SplineEditor');
  var Container=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui.js', 'Container');
  var PackFlags=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'PackFlags');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var ToolModes=es6_import_item(_es6_module, './selectmode.js', 'ToolModes');
  var ManipulatorManager=es6_import_item(_es6_module, './manipulator.js', 'ManipulatorManager');
  var Manipulator=es6_import_item(_es6_module, './manipulator.js', 'Manipulator');
  var HandleShapes=es6_import_item(_es6_module, './manipulator.js', 'HandleShapes');
  var ManipFlags=es6_import_item(_es6_module, './manipulator.js', 'ManipFlags');
  var ManipHandle=es6_import_item(_es6_module, './manipulator.js', 'ManipHandle');
  var KeyMap=es6_import_item(_es6_module, '../../core/keymap.js', 'KeyMap');
  var HotKey=es6_import_item(_es6_module, '../../core/keymap.js', 'HotKey');
  var EditModes=es6_import_item(_es6_module, './view2d_editor.js', 'EditModes');
  let _ex_EditModes=es6_import_item(_es6_module, './view2d_editor.js', 'EditModes');
  _es6_module.add_export('EditModes', _ex_EditModes, true);
  es6_import(_es6_module, './toolmodes/all.js');
  let projrets=cachering.fromConstructor(Vector2, 128);
  let _v3d_unstatic_temps=cachering.fromConstructor(Vector3, 512);
  let _v2d_unstatic_temps=cachering.fromConstructor(Vector2, 32);
  function delay_redraw(ms) {
    var start_time=time_ms();
    var timer=window.setInterval(function () {
      if (time_ms()-start_time<ms)
        return ;
      window.clearInterval(timer);
      window.redraw_viewport();
    }, 20);
  }
  var PanOp=es6_import_item(_es6_module, './view2d_ops.js', 'PanOp');
  var UIOnlyNode=es6_import_item(_es6_module, '../../core/eventdag.js', 'UIOnlyNode');
  class drawline  {
    
    
    
     constructor(co1, co2, group, color, width) {
      this.v1 = new Vector2(co1);
      this.v2 = new Vector2(co2);
      this.group = group;
      this.width = width;
      this.onremove = null;
      if (color!==undefined) {
          this.clr = [color[0], color[1], color[2], color[3]!==undefined ? color[3] : 1.0];
      }
      else {
        this.clr = [0.4, 0.4, 0.4, 1.0];
      }
    }
     remove() {
      if (this.onremove) {
          this.onremove(this);
      }
    }
     set_clr(clr) {
      this.clr = clr;
    }
  }
  _ESClass.register(drawline);
  _es6_module.add_class(drawline);
  class View2DHandler extends Editor {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.draw_tiled = false;
      this.glPos = new Vector2();
      this.glSize = new Vector2([512, 512]);
      this._graphNode = undefined;
      this.propradius = 35;
      this._last_toolmode = undefined;
      this.draw_stroke_debug = false;
      this._last_mpos = new Vector2();
      this.dpi_scale = 1.0;
      this._last_rendermat = new Matrix4();
      this._last_dv = new Vector2();
      this._last_rendermat_time = util.time_ms();
      this._vel = new Vector2();
      this._flip = 0;
      this.enable_blur = true;
      this.draw_small_verts = false;
      this.half_pix_size = false;
      this.toolmode = ToolModes.SELECT;
      this._last_dpi = undefined;
      this.widgets = undefined;
      this.draw_faces = true;
      this.need_data_link = false;
      this._can_select = 1;
      this._only_render = 0;
      this._selectmode = 1;
      this._draw_normals = 0;
      this.rendermat = new Matrix4();
      this.irendermat = new Matrix4();
      this.cameramat = new Matrix4();
      this.editors = [];
      this.background_image = new ImageUser();
      this.pinned_paths = [];
      this.zoom = 1.0;
      this.background_color = new Vector3([1, 1, 1]);
      this.default_stroke = new Vector4([0, 0, 0, 1]);
      this.default_fill = new Vector4([0, 0, 0, 1]);
      this.default_linewidth = 2;
      this.drawlines = new GArray();
      this.drawline_groups = {};
      this.doOnce(this.regen_keymap);
    }
    get  do_blur() {
      console.warn("evil do_blur");
      return this.enable_blur;
    }
     regen_keymap() {
      if (!this.ctx||!this.ctx.toolmode) {
          return ;
      }
      this.keymap = new KeyMap("view2d");
      this.define_keymap();
      for (let map of this.ctx.toolmode.getKeyMaps()) {
          for (let item of map) {
              this.keymap.add(item);
          }
      }
    }
    static  nodedef() {
      return {name: "view2d", 
     uiName: "view2d", 
     inputs: {}, 
     outputs: {onDrawPre: undefined}}
    }
     dag_exec(ctx, inputs, outputs, graph) {
      if (!this.isConnected) {
          window.the_global_dag.remove(this);
          return ;
      }
    }
     getKeyMaps() {
      let ret=super.getKeyMaps();
      if (this.ctx.toolmode) {
          ret = ret.concat(this.ctx.toolmode.getKeyMaps());
      }
      return ret;
    }
     tools_menu(ctx, mpos) {
      let tool=ctx.toolmode;
      if (tool) {
          tool.tools_menu(ctx, mpos, this);
      }
    }
     toolop_menu(ctx, name, ops) {
      return createMenu(ctx, name, ops);
    }
     call_menu(menu, view2d, mpos) {
      let screen=this.ctx.screen;
      startMenu(menu, screen.mpos[0], screen.mpos[1]);
    }
     define_keymap() {
      var k=this.keymap;
      var this2=this;
      k.add(new HotKey("T", [], function (ctx) {
        var s=ctx.view2d.selectmode, s2;
        let hf=s&SelMask.HANDLE;
        s2&=~SelMask.HANDLE;
        if (s===SelMask.VERTEX)
          s2 = SelMask.SEGMENT;
        else 
          if (s===SelMask.SEGMENT)
          s2 = SelMask.FACE;
        else 
          if (s===SelMask.FACE)
          s2 = SelMask.OBJECT;
        else 
          s2 = SelMask.VERTEX;
        s2|=hf;
        console.log("toggle select mode", s, s2, SelMask.SEGMENT, SelMask.FACE);
        console.log(s===SelMask.VERTEX, s===(SelMask.VERTEX|SelMask.HANDLE), (s===SelMask.SEGMENT));
        ctx.view2d.set_selectmode(s2);
      }, "Cycle Select Mode"));
      k.add(new HotKey("O", [], function (ctx) {
        console.log("toggling proportional transform");
        ctx.view2d.session_flag^=SessionFlags.PROP_TRANSFORM;
      }, "Toggle Proportional Transform"));
      k.add(new HotKey("K", [], function (ctx) {
        g_app_state.toolstack.exec_tool(new CurveRootFinderTest());
      }));
      k.add(new HotKey("Right", [], function (ctx) {
        console.log("Frame Change!", ctx.scene.time+1);
        ctx.scene.change_time(ctx, ctx.scene.time+1);
        window.redraw_viewport();
      }, "Next Frame"));
      k.add(new HotKey("Left", [], function (ctx) {
        console.log("Frame Change!", ctx.scene.time-1);
        ctx.scene.change_time(ctx, ctx.scene.time-1);
        window.redraw_viewport();
      }, "Previous Frame"));
      k.add(new HotKey("Up", [], function (ctx) {
        window.debug_int_1++;
        ctx.scene.change_time(ctx, ctx.scene.time+10);
        window.force_viewport_redraw();
        window.redraw_viewport();
        console.log("debug_int_1: ", debug_int_1);
      }, "Frame Ahead 10"));
      k.add(new HotKey("Down", [], function (ctx) {
        window.debug_int_1--;
        window.debug_int_1 = Math.max(0, debug_int_1);
        ctx.scene.change_time(ctx, ctx.scene.time-10);
        window.force_viewport_redraw();
        window.redraw_viewport();
        console.log("debug_int_1: ", debug_int_1);
      }, "Frame Back 10"));
    }
     init() {
      super.init();
      this.widgets = new ManipulatorManager(this, this.ctx);
      this.makeToolbars();
      this.setCSS();
      this.on_mousedown = Editor.wrapContextEvent(this.on_mousedown.bind(this));
      this.on_mousemove = Editor.wrapContextEvent(this.on_mousemove.bind(this));
      this.on_mouseup = Editor.wrapContextEvent(this.on_mouseup.bind(this));
      this.addEventListener("pointerdown", this.on_mousedown.bind(this));
      this.addEventListener("pointermove", this.on_mousemove.bind(this));
      this.addEventListener("pointerup", this.on_mouseup.bind(this));
      this.addEventListener("mousewheel", this.on_mousewheel.bind(this));
      this._i = 0;
      this.regen_keymap();
    }
     on_mousewheel(e) {
      let dt=-e.deltaY;
      let eps=0.05;
      dt = Math.min(Math.max(dt*0.05, -eps), eps);
      let scale=1.0+dt;
      this.set_zoom(this.zoom*scale);
      window.redraw_viewport();
      console.log(scale, this.zoom);
    }
     _mouse(e) {
      let e2=patchMouseEvent(e, this);
      let mpos=this.getLocalMouse(e.x, e.y);
      e2.x = e2.clientX = mpos[0];
      e2.y = e2.clientY = mpos[1];
      return e2;
    }
     data_link(block, getblock, getblock_us) {
      this.ctx = new Context();
      this.need_data_link = false;
      this.background_image.data_link(block, getblock, getblock_us);
    }
     set_cameramat(mat=undefined) {
      var cam=this.cameramat, render=this.rendermat, zoom=new Matrix4();
      if (mat!==undefined)
        cam.load(mat);
      zoom.translate(this.size[0]/2, this.size[1]/2, 0);
      zoom.scale(this.zoom, this.zoom, this.zoom);
      zoom.translate(-this.size[0]/2, -this.size[1]/2, 0);
      render.makeIdentity();
      render.multiply(zoom);
      render.multiply(cam);
      this.irendermat.load(this.rendermat).invert();
    }
     _getCanvasOff() {
      let off=_v3d_unstatic_temps.next().zero();
      let r1=this.get_bg_canvas().getClientRects()[0];
      let r2=this.getClientRects()[0];
      off[0] = r1.x-r2.x;
      off[1] = r1.y-r2.y;
      return off;
    }
     project(co) {
      let _co=_v3d_unstatic_temps.next().zero();
      _co.load(co);
      _co[2] = 0.0;
      _co.multVecMatrix(this.rendermat);
      co[0] = _co[0], co[1] = _co[1];
      return co;
    }
     unproject(co) {
      let _co=_v3d_unstatic_temps.next().zero();
      _co.load(co);
      _co[2] = 0.0;
      _co.multVecMatrix(this.irendermat);
      co[0] = _co[0], co[1] = _co[1];
      return co;
    }
     getLocalMouse(x, y) {
      let ret=projrets.next();
      let canvas=this.get_bg_canvas();
      let rect=canvas.getClientRects()[0];
      let dpi=UIBase.getDPI();
      if (rect===undefined) {
          console.warn("error in getLocalMouse");
          ret[0] = x*dpi;
          ret[1] = y*dpi;
          return ret;
      }
      ret[0] = (x-rect.left)*dpi;
      ret[1] = (rect.height-(y-rect.top))*dpi;
      return ret;
    }
     on_resize(newsize, oldsize) {
      super.on_resize(newsize, oldsize);
      if (this.size!==undefined) {
          this.set_cameramat();
          if (!this.need_data_link) {
              this.do_draw_viewport([]);
          }
      }
      if (!this.need_data_link) {
          this.get_fg_canvas();
          this.get_bg_canvas();
          this.do_draw_viewport([]);
      }
    }
     genMatrix() {
      let g=this.drawg;
      let dpi_scale=this.dpi_scale;
      let matrix=new Matrix4();
      let m2=new Matrix4();
      m2.scale(dpi_scale, dpi_scale, 1.0);
      matrix.multiply(m2);
      matrix.multiply(this.rendermat);
      matrix = new Matrix4(matrix);
      let matrix2=new Matrix4();
      matrix2.translate(0.0, g.canvas.height, 0.0);
      let mm=new Matrix4();
      mm.scale(1.0, -1.0, 1.0);
      matrix2.multiply(mm);
      matrix.preMultiply(matrix2);
      return matrix;
    }
     drawWebgl(gl, canvas) {
      let dpi=window.devicePixelRatio;
      this.glPos.load(this.pos).mulScalar(dpi).floor();
      this.glSize.load(this.size).mulScalar(dpi).floor();
      let y=this.glPos[1];
      this.glPos[1] = (canvas.height-(y+this.glSize[1]));
      gl.enable(gl.SCISSOR_TEST);
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
      gl.disable(gl.DITHER);
      gl.disable(gl.CULL_FACE);
      gl.scissor(this.glPos[0], this.glPos[1], this.glSize[0], this.glSize[1]);
      gl.viewport(this.glPos[0], this.glPos[1], this.glSize[0], this.glSize[1]);
      gl.clearColor(0.2, 0.5, 1.0, 0.0);
      gl.clearDepth(1.0);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    }
     do_draw_viewport(redraw_rects=[]) {
      if (this._draw_promise) {
          return ;
      }
      this.checkInit();
      this._graphNode = the_global_dag.get_node(this, true);
      this._graphNode.dag_update("onDrawPre");
      window.updateEventDag(true);
      let buffer=window._wait_for_draw;
      var canvas=this.get_fg_canvas();
      var bgcanvas=this.get_bg_canvas();
      if (buffer) {
          canvas = this.get_fg_canvas(this._flip^1);
          bgcanvas = this.get_bg_canvas(this._flip^1);
      }
      var g=this.drawg = canvas.g;
      var bg_g=bgcanvas.g;
      if (bgcanvas!==undefined) {
          bgcanvas.style["backgroundColor"] = this.background_color.toCSS();
      }
      var w=this.size[0];
      var h=this.size[1];
      g._irender_mat = this.irendermat;
      bg_g._irender_mat = this.irendermat;
      bg_g.width = bgcanvas.width;
      g.width = canvas.width;
      bg_g.height = bgcanvas.height;
      g.height = canvas.height;
      g.save();
      bg_g.save();
      let matrix=this.genMatrix();
      g.dpi_scale = this.dpi_scale;
      var p1=new Vector2([0, 0]);
      var p2=new Vector2([this.size[0], this.size[1]]);
      this.unproject(p1), this.unproject(p2);
      var r=redraw_rects;
      g.beginPath();
      for (var i=0; i<r.length; i+=4) {
          g.moveTo(r[i], r[i+1]);
          g.lineTo(r[i], r[i+3]);
          g.lineTo(r[i+2], r[i+3]);
          g.lineTo(r[i+2], r[i+1]);
          g.closePath();
      }
      g.beginPath();
      bg_g.beginPath();
      g.clearRect(0, 0, g.canvas.width, g.canvas.height);
      bg_g.clearRect(0, 0, bg_g.canvas.width, bg_g.canvas.height);
      this.ctx = new Context();
      if (this.ctx.frameset===undefined) {
          console.warn("EEK!");
          g.restore();
          bg_g.restore();
          return ;
      }
      if (this.draw_video&&this.video!==undefined) {
          var frame=Math.floor(this.video_time);
          var image=this.video.get(frame);
          if (image!==undefined) {
              bg_g.drawImage(image, 0, 0);
          }
      }
      if (this.draw_bg_image&&this.background_image.image!==undefined) {
          var img=this.background_image.image.get_dom_image();
          var iuser=this.background_image;
          let off=new Vector2(iuser.off);
          let scale=new Vector2(iuser.scale);
          let m=matrix.$matrix;
          off.multVecMatrix(matrix);
          scale[0]*=m.m11;
          scale[1]*=m.m22;
          g.drawImage(img, off[0], off[1], img.width*scale[0], img.height*scale[1]);
      }
      let promise;
      if (this.draw_tiled) {
          promise = new Promise((accept, reject) =>            {
            let tot=0;
            let tileoff=500.0;
            let queue=[];
            let n=1;
            for (let ix=-n; ix<=n; ix++) {
                for (let iy=-n; iy<=n; iy++) {
                    let matrix2=new Matrix4(matrix);
                    tot++;
                    matrix2.translate(tileoff*ix, tileoff*iy, 0.0);
                    queue.push(matrix2);
                }
            }
            let next=() =>              {
              this.flip_canvases();
              if (queue.length===0) {
                  accept();
              }
              else {
                let matrix2=queue.pop();
                this.ctx.frameset.draw(this.ctx, g, this, matrix2, redraw_rects, this.edit_all_layers).then(next);
              }
            }
            next();
          });
      }
      else {
        promise = this.ctx.frameset.draw(this.ctx, g, this, matrix, redraw_rects, this.edit_all_layers);
      }
      if (buffer) {
          promise.then(() =>            {
            this._draw_promise = undefined;
            this.flip_canvases();
          });
          this._draw_promise = promise;
      }
      var frameset=this.ctx.frameset;
      var spline=frameset.spline;
      var actspline=this.ctx.spline;
      var pathspline=this.ctx.frameset.pathspline;
      if (this.draw_anim_paths) {
          if (this.only_render&&pathspline.resolve) {
              pathspline.solve();
          }
          else 
            if (!this.only_render) {
              for (var v of spline.verts.selected) {
                  if (!(v.eid in frameset.vertex_animdata))
                    continue;
                  var vdata=frameset.vertex_animdata[v.eid];
                  var alpha=vdata.spline===actspline ? 1.0 : 0.2;
                  vdata.draw(g, matrix, alpha, this.ctx.frameset.time, redraw_rects);
              }
              pathspline.layerset.active = pathspline.layerset.idmap[this.ctx.frameset.templayerid];
              pathspline.draw(redraw_rects, g, this, matrix, this.selectmode, this.only_render, this.draw_normals, alpha, true, this.ctx.frameset.time, false);
          }
      }
      else {
        if (pathspline.resolve) {
            pathspline.solve();
            console.log("solved pathspline", pathspline.resolve);
            pathspline.resolve = 0;
        }
      }
      this.editor.ctx = this.ctx;
      var fl=Math.floor;
      for (var k in this.drawline_groups) {
          for (var dl of this.drawline_groups[k]) {
              var a=dl.clr[3]!==undefined ? dl.clr[3] : 1.0;
              g.strokeStyle = "rgba("+fl(dl.clr[0]*255)+","+fl(dl.clr[1]*255)+","+fl(dl.clr[2]*255)+","+a+")";
              g.lineWidth = dl.width;
              g.beginPath();
              g.moveTo(dl.v1[0], canvas.height-dl.v1[1]);
              g.lineTo(dl.v2[0], canvas.height-dl.v2[1]);
              g.stroke();
          }
      }
      let m=matrix.$matrix;
      g.setTransform(m.m11, m.m12, m.m21, m.m22, m.m41, m.m42);
      this.widgets.render(canvas, g, matrix);
      bg_g.restore();
      g.restore();
    }
     flip_canvases() {
      let fg=this.get_fg_canvas();
      let bg=this.get_bg_canvas();
      fg.hidden = true;
      bg.hidden = true;
      this._flip^=1;
      fg = this.get_fg_canvas();
      bg = this.get_bg_canvas();
      fg.hidden = false;
      bg.hidden = false;
    }
     get_fg_canvas(flip=this._flip) {
      if (flip) {
          this.drawcanvas = this.getCanvas("fg2", -2, undefined, this.dpi_scale);
      }
      else {
        this.drawcanvas = this.getCanvas("fg", -2, undefined, this.dpi_scale);
      }
      if (flip!==this._flip) {
          this.drawcanvas.hidden = true;
      }
      return this.drawcanvas;
    }
     get_bg_canvas(flip=this._flip) {
      let ret;
      if (flip) {
          ret = this.getCanvas("bg2", -3, undefined, this.dpi_scale);
      }
      else {
        ret = this.getCanvas("bg", -3, undefined, this.dpi_scale);
      }
      if (flip!==this._flip) {
          ret.hidden = true;
      }
      return ret;
    }
     copy() {
      let ret=document.createElement("view2d-editor-x");
      return ret;
    }
     makeToolbars() {
      if (!this.container) {
          this.doOnce(this.makeToolbars);
          return ;
      }
      if (this._makingToolBars) {
          return ;
      }
      this._makingToolBars = true;
      let row=this.container;
      if (this.sidebar) {
          this.sidebar.remove();
      }
      let tabs=this.sidebar = row.tabs("right");
      tabs.style["height"] = "400px";
      tabs.float(1, 3*25*UIBase.getDPI(), 7);
      var tools=tabs.tab("Tools", "Tools");
      tools.prop("view2d.toolmode", PackFlags.USE_ICONS|PackFlags.VERTICAL|PackFlags.LARGE_ICON);
      tools.iconbutton(Icons.UNDO, "  Hotkey : CTRL-Z", () =>        {
        g_app_state.toolstack.undo();
        delay_redraw(50);
      });
      tools.iconbutton(Icons.REDO, "  Hotkey : CTRL-SHIFT-Z", () =>        {
        g_app_state.toolstack.redo();
        delay_redraw(50);
      });
      let tool=tools.tool("view2d.circle_select(mode='SELECT' selectmode='selectmode')", PackFlags.LARGE_ICON|PackFlags.USE_ICONS);
      tool.icon = Icons.CIRCLE_SEL_ADD;
      tool.description = "Select control points in a circle";
      tool = tools.tool("view2d.circle_select(mode='DESELECT' selectmode='selectmode')", PackFlags.LARGE_ICON|PackFlags.USE_ICONS);
      tool.icon = Icons.CIRCLE_SEL_SUB;
      tool.description = "Deselect control points in a circle";
      tools.tool("spline.toggle_select_all()", PackFlags.LARGE_ICON|PackFlags.USE_ICONS);
      this.flushUpdate();
      if (this.ctx&&this.ctx.toolmode) {
          let tooltab=tabs.tab("Tool Settings");
          this.doOnce(() =>            {
            this.ctx.toolmode.constructor.buildSideBar(tooltab);
          });
      }
      let tab=tabs.tab("Background");
      let panel=tab.panel("Image");
      panel.prop("view2d.draw_bg_image");
      let iuser=document.createElement("image-user-panel-x");
      iuser.setAttribute("datapath", "view2d.background_image");
      panel.add(iuser);
      panel = tab.panel("Background Color");
      panel.prop("view2d.background_color");
      tabs.setActive("Tools");
      this._makingToolBars = false;
    }
     makeHeader(container) {
      let row=super.makeHeader(container);
      row.noMargins();
      console.log("VIEW2D ctx:", this.ctx);
      row.prop("view2d.zoom");
      row.prop("view2d.edit_all_layers");
      row.prop("view2d.default_linewidth");
      row.prop("view2d.default_stroke");
      row.prop("view2d.propradius");
      row = container.row();
      row.noMargins();
      container.noMargins();
      row.useIcons();
      row.prop("view2d.selectmask[HANDLE]");
      row.prop("view2d.selectmode");
      row.prop("view2d.only_render");
      row.prop("view2d.draw_small_verts");
      row.prop("view2d.session_flag[PROP_TRANSFORM]");
      row.prop("view2d.draw_normals");
      row.prop("view2d.draw_anim_paths");
      row.prop("view2d.enable_blur");
      row.prop("view2d.draw_faces");
      let strip=row.strip();
      strip.useDataPathUndo = true;
      let mass_set_path="spline.selected_verts[{$.flag & 1}]";
      strip.prop("spline.verts.active.flag[BREAK_TANGENTS]", undefined, mass_set_path+".flag[BREAK_TANGENTS]");
      strip.prop("spline.verts.active.flag[BREAK_CURVATURES]", undefined, mass_set_path+".flag[BREAK_CURVATURES]");
      strip.prop("view2d.half_pix_size");
      strip.prop("view2d.draw_stroke_debug");
      strip.prop("view2d.draw_tiled");
      strip = row.strip();
      strip.tool("spline.split_pick_edge()");
      strip.tool("spline.stroke()");
    }
    static  define() {
      return {tagname: "view2d-editor-x", 
     areaname: "view2d_editor", 
     uiname: "Work Canvas", 
     icon: Icons.VIEW2D_EDITOR, 
     hasWebgl: true}
    }
    static  newSTRUCT() {
      return document.createElement("view2d-editor-x");
    }
     loadSTRUCT(reader) {
      this._in_from_struct = true;
      reader(this);
      super.loadSTRUCT(reader);
      this._last_rendermat.load(this.cameramat);
      this._in_from_struct = true;
      this.need_data_link = true;
      if (this.pinned_paths!=undefined&&this.pinned_paths.length==0)
        this.pinned_paths = undefined;
      this._in_from_struct = false;
    }
    get  selectmode() {
      return this.ctx&&this.ctx.scene ? this.ctx.scene.selectmode : 0;
    }
    set  selectmode(val) {
      if (this.ctx&&this.ctx.scene) {
          this.ctx.scene.selectmode = val;
          window.redraw_viewport();
      }
    }
     set_selectmode(mode) {
      console.warn("Call to view2d.set_selectmode");
      this.ctx.scene.selectmode = mode;
      redraw_viewport();
    }
    get  pin_paths() {
      return this.pinned_paths!=undefined;
    }
    set  pin_paths(state) {
      if (!state) {
          this.pinned_paths = undefined;
          if (this.ctx!=undefined&&this.ctx.frameset!=undefined) {
              this.ctx.frameset.switch_on_select = true;
              this.ctx.frameset.update_visibility();
          }
      }
      else {
        var spline=this.ctx.frameset.spline;
        var eids=[];
        for (var v of spline.verts.selected.editable(this.ctx)) {
            eids.push(v.eid);
        }
        this.pinned_paths = eids;
        this.ctx.frameset.switch_on_select = false;
      }
    }
    get  draw_normals() {
      return this._draw_normals;
    }
    set  draw_normals(val) {
      if (val!=this._draw_normals) {
          this.draw_viewport = 1;
      }
      this._draw_normals = val;
    }
    get  draw_anim_paths() {
      return this._draw_anim_paths;
    }
    set  draw_anim_paths(val) {
      if (val!=this._draw_anim_paths) {
          this.draw_viewport = 1;
      }
      this._draw_anim_paths = val;
    }
    get  only_render() {
      return this._only_render;
    }
    set  only_render(val) {
      if (val!=this._only_render) {
          this.draw_viewport = 1;
      }
      this._only_render = val;
    }
     _get_dl_group(group) {
      if (group==undefined)
        group = "main";
      if (!(group in this.drawline_groups)) {
          this.drawline_groups[group] = new GArray();
      }
      return this.drawline_groups[group];
    }
     make_drawline(v1, v2, group="main", color=undefined, width=2) {
      var drawlines=this._get_dl_group(group);
      var dl=new drawline(v1, v2, group, color, width);
      drawlines.push(dl);
      dl.onremove = this.kill_drawline.bind(this);
      let min=_v2d_unstatic_temps.next(), max=_v2d_unstatic_temps.next();
      var pad=5;
      min[0] = Math.min(v1[0], v2[0])-pad;
      min[1] = Math.min(v1[1], v2[1])-pad;
      max[0] = Math.max(v1[0], v2[0])+pad;
      max[1] = Math.max(v1[1], v2[1])+pad;
      redraw_viewport(min, max);
      return dl;
    }
     kill_drawline(dl) {
      let min=_v2d_unstatic_temps.next(), max=_v2d_unstatic_temps.next();
      var drawlines=this._get_dl_group(dl.group);
      var pad=5;
      var v1=dl.v1, v2=dl.v2;
      min[0] = Math.min(v1[0], v2[0])-pad;
      min[1] = Math.min(v1[1], v2[1])-pad;
      max[0] = Math.max(v1[0], v2[0])+pad;
      max[1] = Math.max(v1[1], v2[1])+pad;
      redraw_viewport(min, max);
      drawlines.remove(dl);
    }
     reset_drawlines(group="main") {
      var drawlines=this._get_dl_group(group);
      drawlines.reset();
    }
    get  editor() {
      return this.ctx.toolmode;
    }
    set  editor(v) {
      console.warn("Attempt to set view2d.editor");
    }
     get_keymaps() {
      var ret=[this.keymap];
      var maps=this.editor.get_keymaps();
      for (var i=0; i<maps.length; i++) {
          ret.push(maps[i]);
      }
      return ret;
    }
    get  can_select() {
      return this._can_select;
    }
    set  can_select(val) {
      this._can_select = !!val;
    }
     do_select(event, mpos, view2d, do_multiple=false) {
      return this.editor.do_select(event, mpos, view2d, do_multiple);
    }
     do_alt_select(event, mpos, view2d) {
      return this.editor.do_alt_select(event, mpos, view2d);
    }
     _widget_mouseevent(event) {
      let co=[event.x, event.y];
      this.unproject(co);
      let event2={type: event.type, 
     x: co[0], 
     y: co[1], 
     origX: event.x, 
     origY: event.y, 
     shiftKey: event.shiftKey, 
     ctrlKey: event.ctrlKey, 
     altKey: event.altKey, 
     commandKey: event.commandKey};
      return event2;
    }
     on_mousedown(event) {
      this.checkInit();
      this.editor.view2d = this;
      if (this.ctx.screen.pickElement(event.x, event.y)!==this) {
          return ;
      }
      event = this._mouse(event);
      if (event.altKey&&!event.shiftKey&&!event.ctrlKey&&event.button===0) {
          event.button = 2;
      }
      if (event.button!==1&&event.button!==2&&this.widgets.on_click(this._widget_mouseevent(event), this)) {
          return ;
      }
      console.log(event.touches);
      if (event.button===0) {
          this.editor.selectmode = this.selectmode;
          this.editor.view2d = this;
          if (this.editor.on_mousedown(event))
            return ;
          var selfound=false;
          var is_middle=event.button===1||(event.button===2&&g_app_state.screen.ctrl);
          var tottouch=event.touches ? event.touches.length : 0;
          if (tottouch>=2) {
              var tool=new PanOp();
              this.ctx.api.execTool(this.ctx, tool);
          }
          else 
            if (is_middle&&this.shift) {
              console.log("Panning");
          }
          else 
            if (event.button===0) {
              this._mstart = new Vector2(this.mpos);
          }
      }
      if (event.button===2&&!g_app_state.screen.shift&&!g_app_state.screen.ctrl&&!g_app_state.screen.alt) {
          var tool=new PanOp();
          this.ctx.api.execTool(this.ctx, tool);
      }
    }
     on_mouseup(event) {
      event = this._mouse(event);
      this._mstart = null;
      if (this.editor.on_mouseup(event))
        return ;
    }
     on_mousemove(event) {
      this.checkInit();
      this._last_mpos[0] = event.x;
      this._last_mpos[1] = event.y;
      if (!event.touches) {
          this.resetVelPan();
      }
      if (this.ctx.screen.pickElement(event.x, event.y)!==this) {
          return ;
      }
      event = this._mouse(event);
      var mpos=new Vector3([event.x, event.y, 0]);
      this.mpos = mpos;
      var this2=this;
      function switch_on_multitouch(op, event, cancel_func) {
        if (g_app_state.screen.tottouch>1) {
            this2._mstart = null;
            cancel_func();
        }
        if (this._mstart!=null) {
            var vec=new Vector2(this.mpos);
            vec.sub(this._mstart);
            if (vec.vectorLength()>10) {
                this._mstart = null;
                return ;
                var top=new TranslateOp(EditModes.GEOMETRY);
            }
            top.cancel_callback = switch_on_multitouch;
            g_app_state.toolstack.exec_tool(top);
            this._mstart = null;
            return ;
        }
      }
      if (this.widgets.on_mousemove(this._widget_mouseevent(event), this)) {
          return ;
      }
      this.editor.on_mousemove(event);
    }
     set_zoom(zoom) {
      "zoom set!";
      this.zoom = zoom;
      this.set_cameramat();
      window.redraw_viewport();
    }
     change_zoom(delta) {

    }
     updateDPI() {
      if (this._last_dpi!=UIBase.getDPI()) {
          window.redraw_viewport();
          this.setCSS();
      }
      this._last_dpi = UIBase.getDPI();
    }
    get  edit_all_layers() {
      if (this.ctx&&this.ctx.scene)
        return this.ctx.scene.edit_all_layers;
    }
    set  edit_all_layers(v) {
      if (this.ctx&&this.ctx.scene)
        this.ctx.scene.edit_all_layers = v;
    }
     updateVelPan() {
      let m1=this._last_rendermat.$matrix;
      let m2=this.cameramat.$matrix;
      let pos1=new Vector2();
      let scale1=1.0;
      let pos2=new Vector2();
      let scale2=1.0;
      pos1[0] = m1.m41;
      pos1[1] = m1.m42;
      pos2[0] = m2.m41;
      pos2[1] = m2.m42;
      let dv=new Vector2(pos2).sub(pos1);
      let time=util.time_ms-this._last_rendermat_time;
      this._last_rendermat.load(this.cameramat);
      this._last_rendermat_time = util.time_ms();
      let acc=new Vector2(dv).sub(this._last_dv);
      this._vel.interp(dv, 0.25);
      this._vel.mulScalar(0.9);
      this._last_dv.load(dv);
      if (this._vel.dot(this._vel)>0.01) {
          if (Math.random()>0.95) {
              console.log(this._vel);
          }
          this.cameramat.translate(this._vel[0], this._vel[1]);
          this.set_cameramat(this.cameramat);
          window.redraw_viewport();
      }
    }
     resetVelPan() {
      this._last_rendermat.load(this.cameramat);
      this._vel.zero();
    }
     updateToolMode() {
      if (!this.ctx||!this.ctx.scene) {
          return ;
      }
      let scene=this.ctx.scene;
      if (this.toolmode===ToolModes.PEN&&!(__instance_of(scene.toolmode, PenToolMode))) {
          console.log("switching toolmode to pen");
          scene.switchToolMode("pen");
          this.regen_keymap();
      }
      else 
        if (this.toolmode!==ToolModes.PEN&&__instance_of(scene.toolmode, PenToolMode)) {
          console.log("switching toolmode to spline");
          scene.switchToolMode("spline");
          this.regen_keymap();
      }
      if (this._last_toolmode!==scene.toolmode) {
          this.makeToolbars();
      }
      this._last_toolmode = scene.toolmode;
    }
     update() {
      if (!this.ctx||!this.ctx.screen) {
          return ;
      }
      this._graphNode = the_global_dag.get_node(this, true);
      this.updateToolMode();
      this.updateVelPan();
      let key=""+this.half_pix_size+":"+this.enable_blur+":"+this.only_render+":"+this.draw_faces+":"+this.edit_all_layers+":"+this.draw_normals+":"+this.draw_small_verts;
      if (key!==this._last_key_1) {
          this._last_key_1 = key;
          this.dpi_scale = this.half_pix_size ? 0.5 : 1.0;
          window.redraw_viewport();
      }
      this.push_ctx_active();
      super.update();
      this.updateDPI();
      this.widgets.on_tick(this.ctx);
      this.editor.on_tick(this.ctx);
      this.pop_ctx_active();
      if (this.draw_video&&(time_ms()-this.startup_time)>300) {
          this.video = video.manager.get("/video.mp4");
          if (this.video_time!=this.ctx.scene.time) {
              this.video_time = this.ctx.scene.time;
              window.force_viewport_redraw();
          }
      }
    }
     on_view_change() {

    }
  }
  _ESClass.register(View2DHandler);
  _es6_module.add_class(View2DHandler);
  View2DHandler = _es6_module.add_export('View2DHandler', View2DHandler);
  View2DHandler.STRUCT = STRUCT.inherit(View2DHandler, Area)+`
  _id               : int;
  _selectmode       : int;
  propradius        : float;
  session_flag      : int;
  rendermat         : mat4;
  irendermat        : mat4;
  half_pix_size     : bool;
  cameramat         : mat4;
  only_render       : bool;
  draw_anim_paths   : bool;
  draw_normals      : bool;
  editors           : array(abstract(View2DEditor));
  editor            : int | obj.editors.indexOf(obj.editor);
  zoom              : float;
  tweak_mode        : int;
  default_linewidth : float;
  default_stroke    : vec4;
  default_fill      : vec4;
  extrude_mode      : int;
  enable_blur       : bool;
  draw_faces        : bool;
  draw_video        : bool;
  pinned_paths      : array(int) | obj.pinned_paths != undefined ? obj.pinned_paths : [];
  background_image  : ImageUser;
  background_color  : vec3;
  draw_bg_image     : int;
  toolmode          : int;
  draw_small_verts  : bool;
  draw_stroke_debug : bool;
  draw_tiled        : bool;
}
`;
  Editor.register(View2DHandler);
}, '/dev/fairmotion/src/editors/viewport/view2d.js');


es6_module_define('view2d_ops', ["../../curve/spline.js", "../../curve/spline_draw.js", "../../curve/spline_draw_new.js", "../../vectordraw/vectordraw_canvas2d_simple.js", "../../scene/scene.js", "../../core/frameset.js", "../../core/toolprops.js", "../../path.ux/scripts/pathux.js", "../../core/toolops_api.js", "../../core/fileapi/fileapi.js"], function _view2d_ops_module(_es6_module) {
  "use strict";
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolFlags');
  var Vec2Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec2Property');
  var Vec3Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec3Property');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var StringProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'StringProperty');
  var TPropFlags=es6_import_item(_es6_module, '../../core/toolprops.js', 'TPropFlags');
  var Vector2=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'Vector3');
  var Matrix4=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'Matrix4');
  var Vector4=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'Quat');
  class View2dOp extends ToolOp {
     constructor() {
      super();
      this.tempLines = [];
    }
     makeTempLine(v1, v2, color) {
      return this.new_drawline(v1, v2, color);
    }
     resetTempGeom() {
      return super.reset_drawlines();
    }
  }
  _ESClass.register(View2dOp);
  _es6_module.add_class(View2dOp);
  View2dOp = _es6_module.add_export('View2dOp', View2dOp);
  class PanOp extends ToolOp {
    
    
    
    
    
     constructor(start_mpos) {
      super();
      this.is_modal = true;
      this.undoflag|=UndoFlags.NO_UNDO;
      if (start_mpos!==undefined) {
          this.start_mpos = new Vector2(start_mpos);
          this.start_mpos[2] = 0.0;
          this.first = false;
      }
      else {
        this.start_mpos = new Vector2();
        this.first = true;
      }
      this.start_cameramat = new Matrix4();
      this.cameramat = new Matrix4();
    }
    static  tooldef() {
      return {uiname: "Pan", 
     toolpath: "view2d.pan", 
     undoflag: UndoFlags.NO_UNDO, 
     inputs: {}, 
     outputs: {}, 
     is_modal: true}
    }
     on_mousemove(event) {
      var mpos=new Vector2([event.x, event.y, 0]);
      var ctx=this.modal_ctx;
      mpos = new Vector2(ctx.view2d.getLocalMouse(event.x, event.y));
      if (this.first) {
          this.first = false;
          this.start_cameramat.load(ctx.view2d.cameramat);
          this.start_mpos.load(mpos);
          return ;
      }
      mpos.sub(this.start_mpos).mulScalar(1.0/ctx.view2d.zoom);
      mpos[1] = -mpos[1];
      console.log("mpos", mpos[0], mpos[1]);
      this.cameramat.load(this.start_cameramat).translate(mpos[0], -mpos[1], 0.0);
      ctx.view2d.set_cameramat(this.cameramat);
      if (!event.touches) {
          ctx.view2d.resetVelPan();
      }
      window.force_viewport_redraw();
      window.redraw_viewport();
    }
     on_mouseup(event) {
      this.end_modal();
    }
  }
  _ESClass.register(PanOp);
  _es6_module.add_class(PanOp);
  PanOp = _es6_module.add_export('PanOp', PanOp);
  var $v1_QHS9_exec_pan;
  var $v2_f0qr_exec_pan;
  class ViewRotateZoomPanOp extends ToolOp {
    
    
    
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.undoflag = UndoFlags.NO_UNDO;
      this.transdata = null;
      this.is_modal = true;
      this.inputs = {};
      this.outputs = {};
      this.first_call = false;
      this.start_mat = undefined;
      this.startcos = [undefined, undefined, undefined];
      this.startids = [undefined, undefined, undefined];
      this.start_zoom = 0;
      this.mv1 = new Vector3();
      this.mv2 = new Vector3();
      this.mv3 = new Vector3();
      this.mv4 = new Vector3();
      this.mv5 = new Vector3();
      this.mv6 = new Vector3();
    }
    static  tooldef() {
      return {toolpath: "view2d.viewrotatezoom", 
     uiname: "View Rotate Zoom", 
     is_modal: true, 
     undoflag: UndoFlags.NO_UNDO, 
     inputs: {}, 
     outputs: {}}
    }
     can_call(ctx) {
      return true;
    }
     start_modal(ctx) {
      this.start_mat = new Matrix4(ctx.view2d.drawmats.cameramat);
      this.first_call = true;
      this.start_zoom = ctx.view2d.zoomwheel;
    }
     proj(out, mpos) {
      var size=this.modal_ctx.view2d.size;
      out.loadxy(mpos);
      out[0] = out[0]/(size[0]*0.5)-1.0;
      out[1] = out[1]/(size[1]*0.5)-1.0;
    }
     on_mousemove(event) {
      var ctx=this.modal_ctx;
      var view2d=ctx.view2d;
      var screen=g_app_state.screen;
      if (screen.tottouch===0) {
          this.end_modal();
      }
      if (this.first_call===true) {
          var touches=[];
          for (let k in screen.touchstate) {
              touches.push(k);
          }
          this.first_call = false;
          var v1=new Vector3();
          var v2=new Vector3();
          this.proj(v1, screen.touchstate[touches[0]]);
          this.proj(v2, screen.touchstate[touches[1]]);
          this.startids = [touches[0], touches[1], undefined];
          this.startcos = [v1, v2, undefined];
          this.mv1.load(v1);
          this.mv2.load(v1);
          this.mv3.load(v2);
          this.mv4.load(v2);
          this.exec(this.modal_tctx);
      }
      if (screen.tottouch===2&&this.startids[2]!==undefined)
        this.transition("rotate");
      if (this.startids[2]===undefined) {
          for (let k in screen.touchstate) {
              if (k!==this.startids[0]&&k!==this.startids[1]) {
                  this.startids[2] = k;
                  this.startcos[2] = new Vector3();
                  this.proj(this.startcos[2], screen.touchstate[k]);
                  this.mv5.load(this.startcos[2]);
                  this.transition("pan");
                  break;
              }
          }
      }
      if (this.startids[0] in screen.touchstate) {
          this.proj(this.mv2, screen.touchstate[this.startids[0]]);
      }
      if (this.startids[1] in screen.touchstate) {
          this.proj(this.mv4, screen.touchstate[this.startids[1]]);
      }
      if (this.startids[2]!==undefined&&this.startids[2] in screen.touchstate) {
          this.proj(this.mv6, screen.touchstate[this.startids[2]]);
      }
      this.exec(this.modal_tctx);
    }
     exec(ctx) {
      ctx = this.modal_ctx;
      var v1=new Vector3(this.mv1);
      var v2=new Vector3(this.mv2);
      var newmat;
      if (this.startids[2]===undefined) {
          if (v1.vectorDistance(v2)<0.01)
            return ;
          var vec=new Vector3(v2);
          vec.sub(v1);
          var perp=new Vector3([-vec[1], vec[0], 0.0]);
          var q=new Quat();
          q.axisAngleToQuat(perp, vec.vectorLength()*2);
          var mat=q.toMatrix();
          newmat = new Matrix4(mat);
          newmat.multiply(this.start_mat);
      }
      else {
        newmat = ctx.view2d.drawmats.cameramat;
      }
      var v3=this.mv3, v4=this.mv4;
      var startdis=v3.vectorDistance(v1);
      var zoom;
      if (startdis>0.01) {
          zoom = v4.vectorDistance(v2)/startdis;
      }
      else {
        zoom = v4.vectorDistance(v2);
      }
      var view2d=ctx.view2d;
      var range=(view2d.zoom_wheelrange[1]-view2d.zoom_wheelrange[0]);
      var zoom2=(this.start_zoom-view2d.zoom_wheelrange[0])/range;
      zoom2+=0.025*(zoom-1.0);
      zoom2 = zoom2*range+view2d.zoom_wheelrange[0];
      view2d.drawmats.cameramat = newmat;
      if (this.startids[2]!==undefined)
        this.exec_pan(ctx);
    }
     exec_pan(ctx) {
      var view2d=ctx.view2d;
      $v1_QHS9_exec_pan.load(this.mv5);
      $v2_f0qr_exec_pan.load(this.mv6);
      $v1_QHS9_exec_pan[2] = 0.9;
      $v2_f0qr_exec_pan[2] = 0.9;
      var iprojmat=new Matrix4(ctx.view2d.drawmats.rendermat);
      iprojmat.invert();
      var scenter=new Vector3(this.center);
      scenter.multVecMatrix(ctx.view2d.drawmats.rendermat);
      if (isNaN(scenter[2]))
        scenter[2] = 0.0;
      $v1_QHS9_exec_pan[2] = scenter[2];
      $v2_f0qr_exec_pan[2] = scenter[2];
      $v1_QHS9_exec_pan.multVecMatrix(iprojmat);
      $v2_f0qr_exec_pan.multVecMatrix(iprojmat);
      var vec=new Vector3($v2_f0qr_exec_pan);
      vec.sub($v1_QHS9_exec_pan);
      var newmat=new Matrix4(this.start_mat);
      if (isNaN(vec[0])||isNaN(vec[1])||isNaN(vec[2]))
        return ;
      newmat.translate(vec);
      view2d.drawmats.cameramat = newmat;
    }
     transition(mode) {
      this.start_mat = new Matrix4(this.modal_ctx.view2d.drawmats.cameramat);
      if (mode==="rotate") {
          this.startids[2] = undefined;
          this.startcos[0].load(this.mv2);
          this.mv1.load(this.mv2);
      }
    }
     on_mouseup(event) {
      if (DEBUG.modal)
        console.log("modal end");
      for (let k in event.touches) {
          if (this.startids[2]===k) {
              this.transition("rotate");
          }
      }
      if (g_app_state.screen.tottouch===0)
        this.end_modal();
    }
  }
  var $v1_QHS9_exec_pan=new Vector3();
  var $v2_f0qr_exec_pan=new Vector3();
  _ESClass.register(ViewRotateZoomPanOp);
  _es6_module.add_class(ViewRotateZoomPanOp);
  class ViewRotateOp extends ToolOp {
     constructor() {
      super();
      this.transdata = null;
    }
    static  tooldef() {
      return {toolpath: "view2d.orbit", 
     uiname: "Orbit", 
     is_modal: true, 
     undoflag: UndoFlags.NO_UNDO, 
     inputs: {MV1: new Vec3Property(new Vector3(), "mvector1", "mvector1", "mvector1"), 
      MV2: new Vec3Property(new Vector3(), "mvector2", "mvector2", "mvector2")}, 
     outputs: {}}
    }
     can_call(ctx) {
      return true;
    }
     start_modal(ctx) {
      this.start_mat = new Matrix4(ctx.view2d.drawmats.cameramat);
      this.first_call = true;
    }
     on_mousemove(event) {
      if (this.first_call===true) {
          this.first_call = false;
          this.start_mpos = new Vector3([event.x, event.y, 0]);
          this.start_mpos[0] = this.start_mpos[0]/(this.modal_ctx.view2d.size[0]/2)-1.0;
          this.start_mpos[1] = this.start_mpos[1]/(this.modal_ctx.view2d.size[1]/2)-1.0;
      }
      var mstart=new Vector3(this.start_mpos);
      var mend=new Vector3([event.x, event.y, 0.0]);
      mend[0] = mend[0]/(this.modal_ctx.view2d.size[0]/2)-1.0;
      mend[1] = mend[1]/(this.modal_ctx.view2d.size[1]/2)-1.0;
      var vec=new Vector3(mend);
      vec.sub(mstart);
      this.inputs.MV1.data = mstart;
      this.inputs.MV2.data = mend;
      this.exec(this.modal_ctx);
    }
     exec(ctx) {
      ctx = this.modal_ctx;
      var v1=new Vector3(this.inputs.MV1.data);
      var v2=new Vector3(this.inputs.MV2.data);
      if (v1.vectorDistance(v2)<0.01)
        return ;
      var vec=new Vector3(v2);
      vec.sub(v1);
      var perp=new Vector3([-vec[1], vec[0], 0.0]);
      var q=new Quat();
      q.axisAngleToQuat(perp, vec.vectorLength()*2);
      var mat=q.toMatrix();
      var newmat=new Matrix4(mat);
      newmat.multiply(this.start_mat);
      ctx.view2d.drawmats.cameramat = newmat;
      ctx.view2d.on_view_change();
    }
     on_mouseup(event) {
      if (DEBUG.modal)
        console.log("modal end");
      this.end_modal();
    }
  }
  _ESClass.register(ViewRotateOp);
  _es6_module.add_class(ViewRotateOp);
  class ViewPanOp extends ToolOp {
    
    
    
    static  tooldef() {
      return {toolpath: "view2d.pan", 
     inputs: {MV1: new Vec3Property(new Vector3(), "mvector1", "mvector1", "mvector1"), 
      MV2: new Vec3Property(new Vector3(), "mvector2", "mvector2", "mvector2")}, 
     outputs: {}, 
     is_modal: true, 
     undoflag: UndoFlags.NO_UNDO}
    }
     constructor() {
      super("view2d_pan", "Pan");
      this.transdata = null;
      this.outputs = {};
    }
     can_call(ctx) {
      return true;
    }
     start_modal(ctx) {
      this.start_mat = new Matrix4(ctx.view2d.drawmats.cameramat);
      this.first_call = true;
      this.center = new Vector3();
      var i=0;
      for (let v of ctx.mesh.verts) {
          if (isNaN(v.co[0])||isNaN(v.co[1])||isNaN(v.co[2]))
            continue;
          this.center.add(v.co);
          i+=1;
          if (i>200)
            break;
      }
      if (i>0)
        this.center.mulScalar(1.0/i);
    }
     on_mousemove(event) {
      if (this.first_call===true) {
          this.first_call = false;
          this.start_mpos = new Vector3([event.x, event.y, 0]);
          this.start_mpos[0] = this.start_mpos[0]/(this.modal_ctx.view2d.size[0]/2)-1.0;
          this.start_mpos[1] = this.start_mpos[1]/(this.modal_ctx.view2d.size[1]/2)-1.0;
      }
      var mstart=new Vector3(this.start_mpos);
      var mend=new Vector3([event.x, event.y, 0.0]);
      mend[0] = mend[0]/(this.modal_ctx.view2d.size[0]/2)-1.0;
      mend[1] = mend[1]/(this.modal_ctx.view2d.size[1]/2)-1.0;
      this.inputs.MV1.data = mstart;
      this.inputs.MV2.data = mend;
      this.exec(this.modal_ctx);
    }
     exec(ctx) {
      ctx = this.modal_ctx;
      var v1=new Vector3(this.inputs.MV1.data);
      var v2=new Vector3(this.inputs.MV2.data);
      if (v1.vectorDistance(v2)<0.01)
        return ;
      v1[2] = 0.9;
      v2[2] = 0.9;
      var iprojmat=new Matrix4(ctx.view2d.drawmats.rendermat);
      iprojmat.invert();
      var scenter=new Vector3(this.center);
      scenter.multVecMatrix(ctx.view2d.drawmats.rendermat);
      if (isNaN(scenter[2]))
        scenter[2] = 0.0;
      v1[2] = scenter[2];
      v2[2] = scenter[2];
      v1.multVecMatrix(iprojmat);
      v2.multVecMatrix(iprojmat);
      var vec=new Vector3(v2);
      vec.sub(v1);
      var newmat=new Matrix4(this.start_mat);
      if (isNaN(vec[0])||isNaN(vec[1])||isNaN(vec[2]))
        return ;
      newmat.translate(vec);
      ctx.view2d.drawmats.cameramat = newmat;
      ctx.view2d.on_view_change();
    }
     on_mouseup(event) {
      if (DEBUG.modal)
        console.log("modal end");
      this.end_modal();
    }
  }
  _ESClass.register(ViewPanOp);
  _es6_module.add_class(ViewPanOp);
  var StringProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'StringProperty');
  class BasicFileDataOp extends ToolOp {
    
    
     constructor(data) {
      super();
      this.is_modal = false;
      this.undoflag = UndoFlags.NO_UNDO|UndoFlags.IS_UNDO_ROOT|UndoFlags.UNDO_BARRIER;
      if (data)
        this.inputs.data.setValue(data);
      this.saved_context = new SavedContext();
    }
    static  tooldef() {
      return {uiname: "internal file load op", 
     toolpath: "app.basic_file_with_data", 
     undoflag: UndoFlags.NO_UNDO|UndoFlags.IS_UNDO_ROOT|UndoFlags.UNDO_BARRIER, 
     inputs: {data: new StringProperty("", "filedata", "file data in base64", TPropFlags.PRIVATE)}}
    }
     exec(ctx) {
      var data=new DataView(b64decode(this.inputs.data.data).buffer);
      console.log(this.inputs.data.data.length, data.byteLength);
      g_app_state.load_scene_file(data);
    }
  }
  _ESClass.register(BasicFileDataOp);
  _es6_module.add_class(BasicFileDataOp);
  BasicFileDataOp = _es6_module.add_export('BasicFileDataOp', BasicFileDataOp);
  var Spline=es6_import_item(_es6_module, '../../curve/spline.js', 'Spline');
  var SplineFrameSet=es6_import_item(_es6_module, '../../core/frameset.js', 'SplineFrameSet');
  var Scene=es6_import_item(_es6_module, '../../scene/scene.js', 'Scene');
  class BasicFileOp extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {toolpath: "app.basic_file", 
     uiname: "Make Basic File (internal)", 
     undoflag: UndoFlags.IS_UNDO_ROOT|UndoFlags.UNDO_BARRIER, 
     description: "Internal tool op; makes basic file"}
    }
     exec(ctx) {
      var datalib=ctx.datalib;
      var splineset=new SplineFrameSet();
      splineset.set_fake_user();
      datalib.add(splineset);
      var scene=new Scene();
      datalib.add(scene);
      scene._initCollection(datalib);
      scene.set_fake_user();
      var ob=scene.addFrameset(datalib, splineset);
      scene.setActiveObject(ob);
    }
  }
  _ESClass.register(BasicFileOp);
  _es6_module.add_class(BasicFileOp);
  BasicFileOp = _es6_module.add_export('BasicFileOp', BasicFileOp);
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  class FrameChangeOp extends ToolOp {
     constructor(frame) {
      super();
      this._undo = undefined;
      if (frame!==undefined)
        this.inputs.frame.setValue(frame);
    }
    static  tooldef() {
      return {toolpath: "scene.change_frame", 
     uiname: "Change Frame", 
     inputs: {frame: new FloatProperty(0, "frame", "frame", "frame")}}
    }
     undo_pre(ctx) {
      this._undo = ctx.scene.time;
    }
     undo(ctx) {
      ctx.scene.change_time(ctx, this._undo);
    }
     exec(ctx) {
      ctx.scene.change_time(ctx, this.inputs.frame.data);
    }
  }
  _ESClass.register(FrameChangeOp);
  _es6_module.add_class(FrameChangeOp);
  FrameChangeOp = _es6_module.add_export('FrameChangeOp', FrameChangeOp);
  var SimpleCanvasDraw2D=es6_import_item(_es6_module, '../../vectordraw/vectordraw_canvas2d_simple.js', 'SimpleCanvasDraw2D');
  var draw_spline=es6_import_item(_es6_module, '../../curve/spline_draw.js', 'draw_spline');
  var save_file=es6_import_item(_es6_module, '../../core/fileapi/fileapi.js', 'save_file');
  var SplineDrawer=es6_import_item(_es6_module, '../../curve/spline_draw_new.js', 'SplineDrawer');
  class ExportCanvasImage extends ToolOp {
    static  tooldef() {
      return {toolpath: "view2d.export_image", 
     uiname: "Save Canvas Image", 
     description: "Export visible canvas", 
     undoflag: UndoFlags.NO_UNDO}
    }
     exec(ctx) {
      var view2d=g_app_state.active_view2d;
      var spline=ctx.frameset.spline;
      var canvas=document.createElement("canvas");
      canvas.width = view2d.size[0];
      canvas.height = view2d.size[1];
      var g=canvas.getContext("2d");
      var vecdrawer=new SimpleCanvasDraw2D();
      vecdrawer.canvas = canvas;
      vecdrawer.g = g;
      var drawer=new SplineDrawer(spline, vecdrawer);
      var old=spline.drawer;
      spline.drawer = drawer;
      console.log("saving image. . .");
      drawer.recalc_all = true;
      drawer.update(spline, spline.drawlist, spline.draw_layerlist, view2d.genMatrix(), [], view2d.only_render, view2d.selectmode, g, view2d.zoom, view2d);
      try {
        draw_spline(spline, [], g, view2d, view2d.genMatrix(), view2d.selectmode, view2d.only_render, view2d.draw_normals, 1.0, true, ctx.frameset.time);
      }
      catch (error) {
          print_stack(error);
          console.trace("Draw error");
          g_app_state.notes.label("Error drawing canvas");
          return ;
      }
      spline.drawer = old;
      var url=canvas.toDataURL();
      url = atob(url.slice(url.search("base64,")+7, url.length));
      var data=new Uint8Array(url.length);
      for (let i=0; i<data.length; i++) {
          data[i] = url.charCodeAt(i);
      }
      save_file(data, true, false, "PNG", ["png"], function () {
        console.trace("ERROR ERROR!!\n");
        g_app_state.notes.label("Error drawing canvas");
        return ;
      });
    }
  }
  _ESClass.register(ExportCanvasImage);
  _es6_module.add_class(ExportCanvasImage);
  ExportCanvasImage = _es6_module.add_export('ExportCanvasImage', ExportCanvasImage);
  
}, '/dev/fairmotion/src/editors/viewport/view2d_ops.js');

