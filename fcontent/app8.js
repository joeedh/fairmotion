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
   ROTATE: 4, 
   PEN: 5}
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
es6_module_define('MaterialEditor', ["../viewport/spline_editops.js", "../../core/struct.js", "../editor_base.js", "../../path.ux/scripts/widgets/ui_menu.js", "../../path.ux/scripts/screen/ScreenArea.js", "../../path.ux/scripts/core/ui_base.js", "../../path.ux/scripts/widgets/ui_listbox.js", "../viewport/spline_layerops.js", "../../path.ux/scripts/core/ui.js", "../../path.ux/scripts/widgets/ui_table.js"], function _MaterialEditor_module(_es6_module) {
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
      let ctxcode="(ctx.edit_all_layers || ctx.spline.layerset.active.id in $.layers)";
      var set_prefix=`spline.segments{${ctxcode} && ($.flag & 1) && !$.hidden}`;
      let panel2=panel.panel("Stroke Color");
      panel2.prop("spline.active_segment.mat.strokecolor", undefined, set_prefix+".mat.strokecolor");
      panel.prop("spline.active_segment.mat.linewidth", undefined, set_prefix+".mat.linewidth");
      panel.prop("spline.active_segment.mat.blur", undefined, set_prefix+".mat.blur");
      panel.prop("spline.active_segment.renderable", undefined, set_prefix+".mat.renderable");
      panel.prop("spline.active_segment.mat.flag[MASK_TO_FACE]", undefined, set_prefix+".mat.flag[MASK_TO_FACE]");
      panel2 = panel2.panel("Double Stroking");
      panel2.prop("spline.active_segment.mat.strokecolor2", undefined, set_prefix+".mat.strokecolor2");
      panel2.prop("spline.active_segment.mat.linewidth2", undefined, set_prefix+".mat.linewidth2");
      panel.prop("spline.active_segment.w1", undefined, set_prefix+".w1");
      panel.prop("spline.active_segment.w2", undefined, set_prefix+".w2");
      panel.prop("spline.active_segment.shift1", undefined, set_prefix+".shift1");
      panel.prop("spline.active_segment.shift2", undefined, set_prefix+".shift2");
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
      panel.prop("spline.active_vertex.width", undefined, set_prefix+".width");
      panel.prop("spline.active_vertex.shift", undefined, set_prefix+".shift");
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
es6_module_define('DopeSheetEditor', ["../../path.ux/scripts/core/ui_base.js", "../../path.ux/scripts/screen/ScreenArea.js", "../../core/animdata.js", "../events.js", "../../path.ux/scripts/util/simple_events.js", "../../core/toolops_api.js", "../../path.ux/scripts/core/ui.js", "./dopesheet_ops_new.js", "../../path.ux/scripts/util/util.js", "./dopesheet_ops.js", "../../core/struct.js", "../editor_base.js", "../../util/mathlib.js", "../../curve/spline.js", "../../curve/spline_types.js"], function _DopeSheetEditor_module(_es6_module) {
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
  var DeleteKeysOp=es6_import_item(_es6_module, './dopesheet_ops_new.js', 'DeleteKeysOp');
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
      k.add_tool(new HotKey("X", [], "Delete"), "anim.delete_keys()");
      k.add_tool(new HotKey("Delete", [], "Delete"), "anim.delete_keys()");
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
es6_module_define('dopesheet_transdata', ["../../util/mathlib.js", "../../core/animdata.js", "../viewport/transdata.js"], function _dopesheet_transdata_module(_es6_module) {
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
es6_module_define('dopesheet_ops_new', ["../../curve/spline_base.js", "../../core/toolprops.js", "../../path.ux/scripts/util/vectormath.js", "../../core/toolops_api.js", "../../core/animdata.js", "../../path.ux/scripts/util/util.js"], function _dopesheet_ops_new_module(_es6_module) {
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
es6_module_define('CurveEditor', ["../../path.ux/scripts/core/ui_base.js", "../../core/struct.js", "../editor_base.js", "../../path.ux/scripts/util/simple_events.js", "../../path.ux/scripts/screen/ScreenArea.js", "../../path.ux/scripts/pathux.js", "../../path.ux/scripts/util/vectormath.js"], function _CurveEditor_module(_es6_module) {
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
es6_module_define('editor_base', ["../path.ux/scripts/core/ui_base.js", "../path.ux/scripts/screen/FrameManager.js", "../core/context.js", "../core/struct.js", "./events.js", "../core/toolops_api.js", "../path.ux/scripts/screen/ScreenArea.js", "../path.ux/scripts/util/util.js"], function _editor_base_module(_es6_module) {
  var Area=es6_import_item(_es6_module, '../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var ScreenArea=es6_import_item(_es6_module, '../path.ux/scripts/screen/ScreenArea.js', 'ScreenArea');
  var Screen=es6_import_item(_es6_module, '../path.ux/scripts/screen/FrameManager.js', 'Screen');
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  var ui_base=es6_import(_es6_module, '../path.ux/scripts/core/ui_base.js');
  var util=es6_import(_es6_module, '../path.ux/scripts/util/util.js');
  var KeyMap=es6_import_item(_es6_module, './events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, './events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, './events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, './events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, './events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, './events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, './events.js', 'EventHandler');
  var ModalStates=es6_import_item(_es6_module, '../core/toolops_api.js', 'ModalStates');
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
      this.startFrame = 1;
      this._lastFrameTime = util.time_ms();
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
      k.add(new HotKey("Space", [], "Animation Playback"), new FuncKeyHandler(() =>        {
        this.ctx.screen.togglePlayback();
      }));
      k.add(new HotKey("Escape", [], "Animation Playback"), new FuncKeyHandler(() =>        {
        this.ctx.screen.stopPlayback();
      }));
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
      if (stack.length===0||stack[stack.length-1]!==this) {
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
  var FullContext=es6_import_item(_es6_module, '../core/context.js', 'FullContext');
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
es6_module_define('view2d', ["./selectmode.js", "./view2d_ops.js", "./view2d_editor.js", "../events.js", "./view2d_spline_ops.js", "../../path.ux/scripts/util/util.js", "../editor_base.js", "../../path.ux/scripts/core/ui_base.js", "../../path.ux/scripts/widgets/ui_menu.js", "../../core/toolops_api.js", "../../core/struct.js", "./toolmodes/pentool.js", "./toolmodes/all.js", "../../core/imageblock.js", "./manipulator.js", "../../path.ux/scripts/screen/ScreenArea.js", "../../core/context.js", "../../path.ux/scripts/core/ui.js"], function _view2d_module(_es6_module) {
  var FullContext=es6_import_item(_es6_module, '../../core/context.js', 'FullContext');
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  var SessionFlags=es6_import_item(_es6_module, './view2d_editor.js', 'SessionFlags');
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var patchMouseEvent=es6_import_item(_es6_module, '../../core/toolops_api.js', 'patchMouseEvent');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var KeyMap=es6_import_item(_es6_module, '../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../events.js', 'EventHandler');
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
  var EditModes=es6_import_item(_es6_module, './view2d_editor.js', 'EditModes');
  let _ex_EditModes=es6_import_item(_es6_module, './view2d_editor.js', 'EditModes');
  _es6_module.add_export('EditModes', _ex_EditModes, true);
  es6_import(_es6_module, './toolmodes/all.js');
  let projrets=cachering.fromConstructor(Vector3, 128);
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
  class drawline  {
    
    
    
     constructor(co1, co2, group, color, width) {
      this.v1 = new Vector3(co1);
      this.v2 = new Vector3(co2);
      this.group = group;
      this.width = width;
      if (color!==undefined) {
          this.clr = [color[0], color[1], color[2], color[3]!==undefined ? color[3] : 1.0];
      }
      else {
        this.clr = [0.4, 0.4, 0.4, 1.0];
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
      this.propradius = 35;
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
      this.widgets = new ManipulatorManager(this);
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
      this.keymap = new KeyMap();
      this.define_keymap();
      for (let map of this.ctx.toolmode.getKeyMaps()) {
          this.keymap.concat(map);
      }
    }
     getKeyMaps() {
      let ret=super.getKeyMaps()||[];
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
      k.add(new HotKey("T", [], "Cycle Select Mode"), new FuncKeyHandler(function (ctx) {
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
        console.log(s==SelMask.VERTEX, s==(SelMask.VERTEX|SelMask.HANDLE), (s==SelMask.SEGMENT));
        ctx.view2d.set_selectmode(s2);
      }));
      k.add(new HotKey("Z", ["CTRL", "SHIFT"], "Redo"), new FuncKeyHandler(function (ctx) {
        console.log("Redo");
        ctx.toolstack.redo();
      }));
      k.add(new HotKey("Y", ["CTRL"], "Redo"), new FuncKeyHandler(function (ctx) {
        console.log("Redo");
        ctx.toolstack.redo();
      }));
      k.add(new HotKey("Z", ["CTRL"], "Undo"), new FuncKeyHandler(function (ctx) {
        console.log("Undo");
        ctx.toolstack.undo();
      }));
      k.add(new HotKey("O", [], "Toggle Proportional Transform"), new FuncKeyHandler(function (ctx) {
        console.log("toggling proportional transform");
        ctx.view2d.session_flag^=SessionFlags.PROP_TRANSFORM;
      }));
      k.add(new HotKey("K", [], ""), new FuncKeyHandler(function (ctx) {
        g_app_state.toolstack.exec_tool(new CurveRootFinderTest());
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
      k.add(new HotKey("Up", [], "Frame Ahead 10"), new FuncKeyHandler(function (ctx) {
        window.debug_int_1++;
        ctx.scene.change_time(ctx, ctx.scene.time+10);
        window.force_viewport_redraw();
        window.redraw_viewport();
        console.log("debug_int_1: ", debug_int_1);
      }));
      k.add(new HotKey("Down", [], "Frame Back 10"), new FuncKeyHandler(function (ctx) {
        
        debug_int_1--;
        debug_int_1 = Math.max(0, debug_int_1);
        ctx.scene.change_time(ctx, ctx.scene.time-10);
        window.force_viewport_redraw();
        window.redraw_viewport();
        console.log("debug_int_1: ", debug_int_1);
      }));
    }
     init() {
      super.init();
      this.makeToolbars();
      this.setCSS();
      this.on_mousedown = Editor.wrapContextEvent(this.on_mousedown.bind(this));
      this.on_mousemove = Editor.wrapContextEvent(this.on_mousemove.bind(this));
      this.on_mouseup = Editor.wrapContextEvent(this.on_mouseup.bind(this));
      this.addEventListener("mousedown", this.on_mousedown.bind(this));
      this.addEventListener("mousemove", this.on_mousemove.bind(this));
      this.addEventListener("mouseup", this.on_mouseup.bind(this));
      this._i = 0;
      this.regen_keymap();
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
      ret[2] = 0.0;
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
     do_draw_viewport(redraw_rects=[]) {
      if (this._draw_promise) {
          return ;
      }
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
      let promise=this.ctx.frameset.draw(this.ctx, g, this, matrix, redraw_rects, this.edit_all_layers);
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
      let row=this.container;
      let tabs=row.tabs("right");
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
      let tool=tools.tool("view2d.circle_select(mode=select selectmode=selectmode)", PackFlags.LARGE_ICON|PackFlags.USE_ICONS);
      tool.icon = Icons.CIRCLE_SEL_ADD;
      tool.description = "Select control points in a circle";
      tool = tools.tool("view2d.circle_select(mode=deselect selectmode=selectmode)", PackFlags.LARGE_ICON|PackFlags.USE_ICONS);
      tool.icon = Icons.CIRCLE_SEL_SUB;
      tool.description = "Deselect control points in a circle";
      tools.tool("spline.toggle_select_all()", PackFlags.LARGE_ICON|PackFlags.USE_ICONS);
      this.update();
      let tab=tabs.tab("Background");
      let panel=tab.panel("Image");
      panel.prop("view2d.draw_bg_image");
      let iuser=document.createElement("image-user-panel-x");
      iuser.setAttribute("datapath", "view2d.background_image");
      panel.add(iuser);
      panel = tab.panel("Background Color");
      panel.prop("view2d.background_color");
      tabs.setActive("Tools");
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
      let mass_set_path="spline.selected_verts{$.flag & 1}";
      row.prop("spline.active_vertex.flag[BREAK_TANGENTS]", undefined, mass_set_path+".flag[BREAK_TANGENTS]");
      row.prop("spline.active_vertex.flag[BREAK_CURVATURES]", undefined, mass_set_path+".flag[BREAK_CURVATURES]");
      row.prop("view2d.half_pix_size");
      let strip=row.strip();
      strip.tool("spline.split_pick_edge()");
      strip.tool("spline.stroke()");
    }
     set_zoom(zoom) {
      this.zoom = zoom;
      window.redraw_viewport();
    }
    static  define() {
      return {tagname: "view2d-editor-x", 
     areaname: "view2d_editor", 
     uiname: "Work Canvas", 
     icon: Icons.VIEW2D_EDITOR}
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
      this.editor.view2d = this;
      if (this.ctx.screen.pickElement(event.x, event.y)!==this) {
          return ;
      }
      event = this._mouse(event);
      if (this.widgets.on_click(this._widget_mouseevent(event), this)) {
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
              g_app_state.toolstack.exec_tool(tool);
          }
          else 
            if (is_middle&&this.shift) {
              console.log("Panning");
          }
          else 
            if (event.button==0) {
              this._mstart = new Vector2(this.mpos);
          }
      }
      if (event.button===2&&!g_app_state.screen.shift&&!g_app_state.screen.ctrl&&!g_app_state.screen.alt) {
          var tool=new PanOp();
          g_app_state.toolstack.exec_tool(tool);
      }
    }
     on_mouseup(event) {
      event = this._mouse(event);
      this._mstart = null;
      if (this.editor.on_mouseup(event))
        return ;
    }
     on_mousemove(event) {
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
     on_mousewheel(event, delta) {
      this.change_zoom(delta);
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
    }
     update() {
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
  _id             : int;
  _selectmode     : int;
  propradius      : float;
  session_flag    : int;
  rendermat       : mat4;
  irendermat      : mat4;
  half_pix_size   : bool;
  cameramat       : mat4;
  only_render     : int;
  draw_anim_paths : int;
  draw_normals    : int;
  editors         : array(abstract(View2DEditor));
  editor          : int | obj.editors.indexOf(obj.editor);
  zoom            : float;
  tweak_mode        : int;
  default_linewidth : float;
  default_stroke    : vec4;
  default_fill      : vec4;
  extrude_mode      : int;
  enable_blur       : int;
  draw_faces        : int;
  draw_video        : int;
  pinned_paths      : array(int) | obj.pinned_paths != undefined ? obj.pinned_paths : [];
  background_image  : ImageUser;
  background_color  : vec3;
  draw_bg_image     : int;
  toolmode          : int;
  draw_small_verts  : int;
}
`;
  Editor.register(View2DHandler);
}, '/dev/fairmotion/src/editors/viewport/view2d.js');
es6_module_define('view2d_ops', ["../../vectordraw/vectordraw_canvas2d_simple.js", "../../core/toolops_api.js", "../../core/struct.js", "../../core/ajax.js", "../../scene/scene.js", "../../core/fileapi/fileapi.js", "../../core/toolprops.js", "../../curve/spline_draw_new.js", "../../scene/sceneobject.js", "../../curve/spline_draw.js", "../../core/frameset.js", "../../curve/spline.js", "../events.js"], function _view2d_ops_module(_es6_module) {
  "use strict";
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolFlags');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var unpack_ctx=es6_import_item(_es6_module, '../../core/ajax.js', 'unpack_ctx');
  var KeyMap=es6_import_item(_es6_module, '../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../events.js', 'EventHandler');
  var Vec2Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec2Property');
  var Vec3Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec3Property');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var StringProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'StringProperty');
  var TPropFlags=es6_import_item(_es6_module, '../../core/toolprops.js', 'TPropFlags');
  var SceneObject=es6_import_item(_es6_module, '../../scene/sceneobject.js', 'SceneObject');
  var ObjectFlags=es6_import_item(_es6_module, '../../scene/sceneobject.js', 'ObjectFlags');
  class PanOp extends ToolOp {
    
    
    
    
    
     constructor(start_mpos) {
      super();
      this.is_modal = true;
      this.undoflag|=UndoFlags.IGNORE_UNDO;
      if (start_mpos!==undefined) {
          this.start_mpos = new Vector3(start_mpos);
          this.start_mpos[2] = 0.0;
          this.first = false;
      }
      else {
        this.start_mpos = new Vector3();
        this.first = true;
      }
      this.start_cameramat = undefined;
      this.cameramat = new Matrix4();
    }
    static  tooldef() {
      return {uiname: "Pan", 
     apiname: "view2d.pan", 
     undoflag: UndoFlags.IGNORE_UNDO, 
     inputs: {}, 
     outputs: {}, 
     is_modal: true}
    }
     start_modal(ctx) {
      this.start_cameramat = new Matrix4(ctx.view2d.cameramat);
    }
     on_mousemove(event) {
      var mpos=new Vector3([event.x, event.y, 0]);
      if (this.first) {
          this.first = false;
          this.start_mpos.load(mpos);
          return ;
      }
      var ctx=this.modal_ctx;
      mpos.sub(this.start_mpos).mulScalar(1.0/ctx.view2d.zoom);
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
  var $v1_G0Mx_exec_pan;
  var $v2_wtrd_exec_pan;
  class ViewRotateZoomPanOp extends ToolOp {
    
    
    
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.undoflag = UndoFlags.IGNORE_UNDO;
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
      return {apiname: "view2d.viewrotatezoom", 
     uiname: "View Rotate Zoom", 
     is_modal: true, 
     undoflag: UndoFlags.IGNORE_UNDO, 
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
      if (screen.tottouch==0) {
          this.end_modal();
      }
      if (this.first_call==true) {
          var touches=[];
          for (var k in screen.touchstate) {
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
      if (screen.tottouch==2&&this.startids[2]!=undefined)
        this.transition("rotate");
      if (this.startids[2]==undefined) {
          for (var k in screen.touchstate) {
              if (k!=this.startids[0]&&k!=this.startids[1]) {
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
      if (this.startids[2]!=undefined&&this.startids[2] in screen.touchstate) {
          this.proj(this.mv6, screen.touchstate[this.startids[2]]);
      }
      this.exec(this.modal_tctx);
    }
     exec(ctx) {
      ctx = this.modal_ctx;
      var v1=new Vector3(this.mv1);
      var v2=new Vector3(this.mv2);
      var newmat;
      if (this.startids[2]==undefined) {
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
      if (this.startids[2]!=undefined)
        this.exec_pan(ctx);
    }
     exec_pan(ctx) {
      var view2d=ctx.view2d;
      $v1_G0Mx_exec_pan.load(this.mv5);
      $v2_wtrd_exec_pan.load(this.mv6);
      $v1_G0Mx_exec_pan[2] = 0.9;
      $v2_wtrd_exec_pan[2] = 0.9;
      var iprojmat=new Matrix4(ctx.view2d.drawmats.rendermat);
      iprojmat.invert();
      var scenter=new Vector3(this.center);
      scenter.multVecMatrix(ctx.view2d.drawmats.rendermat);
      if (isNaN(scenter[2]))
        scenter[2] = 0.0;
      $v1_G0Mx_exec_pan[2] = scenter[2];
      $v2_wtrd_exec_pan[2] = scenter[2];
      $v1_G0Mx_exec_pan.multVecMatrix(iprojmat);
      $v2_wtrd_exec_pan.multVecMatrix(iprojmat);
      var vec=new Vector3($v2_wtrd_exec_pan);
      vec.sub($v1_G0Mx_exec_pan);
      let newmat=new Matrix4(this.start_mat);
      if (isNaN(vec[0])||isNaN(vec[1])||isNaN(vec[2]))
        return ;
      newmat.translate(vec);
      view2d.drawmats.cameramat = newmat;
    }
     transition(mode) {
      this.start_mat = new Matrix4(this.modal_ctx.view2d.drawmats.cameramat);
      if (mode=="rotate") {
          this.startids[2] = undefined;
          this.startcos[0].load(this.mv2);
          this.mv1.load(this.mv2);
      }
    }
     on_mouseup(event) {
      if (DEBUG.modal)
        console.log("modal end");
      for (var k in event.touches) {
          if (this.startids[2]==k) {
              this.transition("rotate");
          }
      }
      if (g_app_state.screen.tottouch==0)
        this.end_modal();
    }
  }
  var $v1_G0Mx_exec_pan=new Vector3();
  var $v2_wtrd_exec_pan=new Vector3();
  _ESClass.register(ViewRotateZoomPanOp);
  _es6_module.add_class(ViewRotateZoomPanOp);
  class ViewRotateOp extends ToolOp {
     constructor() {
      super();
      this.transdata = null;
    }
    static  tooldef() {
      return {apiname: "view2d.orbit", 
     uiname: "Orbit", 
     is_modal: true, 
     undoflag: UndoFlags.IGNORE_UNDO, 
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
      if (this.first_call==true) {
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
      let perp=new Vector3([-vec[1], vec[0], 0.0]);
      var q=new Quat();
      q.axisAngleToQuat(perp, vec.vectorLength()*2);
      let mat=q.toMatrix();
      let newmat=new Matrix4(mat);
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
    
    
    
     constructor() {
      super("view2d_pan", "Pan");
      this.undoflag = UndoFlags.IGNORE_UNDO;
      this.transdata = null;
      this.is_modal = true;
      this.inputs = {MV1: new Vec3Property(new Vector3(), "mvector1", "mvector1", "mvector1"), 
     MV2: new Vec3Property(new Vector3(), "mvector2", "mvector2", "mvector2")};
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
      for (var v of ctx.mesh.verts) {
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
      if (this.first_call==true) {
          this.first_call = false;
          this.start_mpos = new Vector3([event.x, event.y, 0]);
          this.start_mpos[0] = this.start_mpos[0]/(this.modal_ctx.view2d.size[0]/2)-1.0;
          this.start_mpos[1] = this.start_mpos[1]/(this.modal_ctx.view2d.size[1]/2)-1.0;
      }
      let mstart=new Vector3(this.start_mpos);
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
      let newmat=new Matrix4(this.start_mat);
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
      this.undoflag = UndoFlags.IGNORE_UNDO|UndoFlags.IS_ROOT_OPERATOR|UndoFlags.UNDO_BARRIER;
      if (data)
        this.inputs.data.setValue(data);
      this.saved_context = new SavedContext();
    }
    static  tooldef() {
      return {uiname: "internal file load op", 
     apiname: "app.basic_file_with_data", 
     undoflag: UndoFlags.IGNORE_UNDO|UndoFlags.IS_ROOT_OPERATOR|UndoFlags.UNDO_BARRIER, 
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
      return {apiname: "app.basic_file", 
     uiname: "Make Basic File (internal)", 
     undoflag: UndoFlags.IS_ROOT_OPERATOR|UndoFlags.UNDO_BARRIER, 
     description: "Internal tool op; makes basic file"}
    }
     exec(ctx) {
      var datalib=ctx.datalib;
      var splineset=new SplineFrameSet();
      splineset.set_fake_user();
      datalib.add(splineset);
      var scene=new Scene();
      scene.set_fake_user();
      let ob=scene.addFrameset(splineset);
      scene.setActiveObject(ob);
      datalib.add(scene);
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
      if (frame!=undefined)
        this.inputs.frame.setValue(frame);
    }
    static  tooldef() {
      return {apiname: "scene.change_frame", 
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
      return {apiname: "view2d.export_image", 
     uiname: "Save Canvas Image", 
     description: "Export visible canvas", 
     undoflag: UndoFlags.IGNORE_UNDO}
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
      for (var i=0; i<data.length; i++) {
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
es6_module_define('view2d_spline_ops', ["../../core/animdata.js", "../../curve/spline_draw.js", "./transform.js", "../../curve/spline.js", "./view2d_editor.js", "./view2d_base.js", "../../curve/spline_types.js", "../../core/struct.js", "./spline_selectops.js", "./spline_editops.js", "../../path.ux/scripts/screen/ScreenArea.js", "./selectmode.js", "./transform_ops.js", "../events.js", "../../core/lib_api.js", "./spline_createops.js", "../../core/toolops_api.js"], function _view2d_spline_ops_module(_es6_module) {
  "use strict";
  var ExtrudeVertOp=es6_import_item(_es6_module, './spline_createops.js', 'ExtrudeVertOp');
  var DeleteVertOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteSegmentOp');
  var spline_selectops=es6_import(_es6_module, './spline_selectops.js');
  var WidgetResizeOp=es6_import_item(_es6_module, './transform_ops.js', 'WidgetResizeOp');
  var WidgetRotateOp=es6_import_item(_es6_module, './transform_ops.js', 'WidgetRotateOp');
  var ScreenArea, Area;
  var DataTypes=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataTypes');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var EditModes=es6_import_item(_es6_module, './view2d_editor.js', 'EditModes');
  let EditModes2=EditModes;
  var KeyMap=es6_import_item(_es6_module, '../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../events.js', 'EventHandler');
  var SelectLinkedOp=es6_import_item(_es6_module, './spline_selectops.js', 'SelectLinkedOp');
  var SelectOneOp=es6_import_item(_es6_module, './spline_selectops.js', 'SelectOneOp');
  var TranslateOp=es6_import_item(_es6_module, './transform.js', 'TranslateOp');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var ToolModes=es6_import_item(_es6_module, './selectmode.js', 'ToolModes');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var SplineVertex=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineSegment');
  var SplineFace=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFace');
  var Spline=es6_import_item(_es6_module, '../../curve/spline.js', 'Spline');
  var View2DEditor=es6_import_item(_es6_module, './view2d_editor.js', 'View2DEditor');
  var SessionFlags=es6_import_item(_es6_module, './view2d_editor.js', 'SessionFlags');
  var DataBlock=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataTypes');
  var redraw_element=es6_import_item(_es6_module, '../../curve/spline_draw.js', 'redraw_element');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ModalStates');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var ToolMacro=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolMacro');
  var get_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'get_vtime');
  var DeleteVertOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteSegmentOp');
  var DeleteFaceOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteFaceOp');
  var ChangeFaceZ=es6_import_item(_es6_module, './spline_editops.js', 'ChangeFaceZ');
  var SplitEdgeOp=es6_import_item(_es6_module, './spline_editops.js', 'SplitEdgeOp');
  var DuplicateOp=es6_import_item(_es6_module, './spline_editops.js', 'DuplicateOp');
  var DisconnectHandlesOp=es6_import_item(_es6_module, './spline_editops.js', 'DisconnectHandlesOp');
  var SplitEdgePickOp=es6_import_item(_es6_module, './spline_editops.js', 'SplitEdgePickOp');
  window.anim_to_playback = [];
  class DuplicateTransformMacro extends ToolMacro {
     constructor() {
      super("duplicate_transform", "Duplicate");
    }
    static  invoke(ctx, args) {
      var tool=new DuplicateOp();
      let macro=new DuplicateTransformMacro();
      macro.add_tool(tool);
      var transop=new TranslateOp(ctx.view2d.mpos, 1|2);
      macro.add_tool(transop);
      return macro;
    }
    static  tooldef() {
      return {uiname: "Duplicate", 
     apiname: "spline.duplicate_transform", 
     is_modal: true, 
     icon: Icons.DUPLICATE, 
     description: "Duplicate geometry"}
    }
  }
  _ESClass.register(DuplicateTransformMacro);
  _es6_module.add_class(DuplicateTransformMacro);
  DuplicateTransformMacro = _es6_module.add_export('DuplicateTransformMacro', DuplicateTransformMacro);
  
  class RenderAnimOp extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {uiname: "Render", 
     apiname: "view2d.render_anim", 
     is_modal: true, 
     inputs: {}, 
     outputs: {}, 
     undoflag: UndoFlags.IGNORE_UNDO}
    }
     start_modal(ctx) {
      super.start_modal(ctx);
      console.log("Anim render start!");
      window.anim_to_playback = [];
      window.anim_to_playback.filesize = 0;
      this.viewport = {pos: [ctx.view2d.pos[0], window.innerHeight-(ctx.view2d.pos[1]+ctx.view2d.size[1])], 
     size: [ctx.view2d.size[0], ctx.view2d.size[1]]};
      window.anim_to_playback.viewport = this.viewport;
      var this2=this;
      var pathspline=ctx.frameset.pathspline;
      var min_time=1e+17, max_time=0;
      for (var v of pathspline.verts) {
          var time=get_vtime(v);
          min_time = Math.min(min_time, time);
          max_time = Math.max(max_time, time);
      }
      if (min_time<0) {
          this.end(ctx);
          return ;
      }
      ctx.scene.change_time(ctx, min_time);
      this.min_time = min_time;
      this.max_time = max_time;
      this.timer = window.setInterval(function () {
        this2.render_frame();
      }, 10);
    }
     render_frame() {
      var ctx=this.modal_ctx;
      if (ctx==undefined||!this.modal_running) {
          console.log("Timer end");
          window.clearInterval(this.timer);
          this.end();
          return ;
      }
      var scene=ctx.scene;
      if (scene.time>=this.max_time+25) {
          this.end(ctx);
          return ;
      }
      console.log("rendering frame", scene.time);
      var vd=this.viewport;
      var canvas=document.createElement("canvas");
      canvas.width = vd.size[0], canvas.height = vd.size[1];
      var g1=ctx.view2d.draw_canvas_ctx;
      var idata=g1.getImageData(vd.pos[0], vd.pos[1], vd.size[0], vd.size[1]);
      var g2=canvas.getContext("2d");
      g2.putImageData(idata, 0, 0);
      var image=canvas.toDataURL();
      var frame={time: scene.time, 
     data: idata};
      window.anim_to_playback.push(frame);
      window.anim_to_playback.filesize+=image.length;
      scene.change_time(ctx, scene.time+1);
      window.redraw_viewport();
    }
     end(ctx) {
      if (this.timer!=undefined)
        window.clearInterval(this.timer);
      this.end_modal();
    }
     on_keydown(event) {
      switch (event.keyCode) {
        case charmap["Escape"]:
          this.end(this.modal_ctx);
      }
    }
  }
  _ESClass.register(RenderAnimOp);
  _es6_module.add_class(RenderAnimOp);
  RenderAnimOp = _es6_module.add_export('RenderAnimOp', RenderAnimOp);
  class PlayAnimOp extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {uiname: "Play", 
     apiname: "view2d.play_anim", 
     is_modal: true, 
     inputs: {}, 
     outputs: {}, 
     undoflag: UndoFlags.IGNORE_UNDO}
    }
     start_modal(ctx) {
      super.start_modal(ctx);
      console.log("Anim render start!");
      this.viewport = {pos: [ctx.view2d.pos[0], window.innerHeight-(ctx.view2d.pos[1]+ctx.view2d.size[1])], 
     size: [ctx.view2d.size[0], ctx.view2d.size[1]]};
      var this2=this;
      var pathspline=ctx.frameset.pathspline;
      this.start_time = time_ms();
      this.timer = window.setInterval(function () {
        if (this2.doing_draw)
          return ;
        this2.render_frame();
      }, 10);
    }
     render_frame() {
      var ctx=this.modal_ctx;
      if (ctx==undefined||!this.modal_running) {
          console.log("Timer end");
          window.clearInterval(this.timer);
          this.end();
          return ;
      }
      var vd=window.anim_to_playback.viewport;
      var g1=ctx.view2d.draw_canvas_ctx;
      var time=time_ms()-this.start_time;
      time = (time/1000.0)*24.0;
      var fi=Math.floor(time);
      var vd=window.anim_to_playback.viewport;
      var pos=ctx.view2d.pos;
      var this2=this;
      if (fi>=window.anim_to_playback.length) {
          console.log("end");
          this.end();
          window.redraw_viewport();
          return ;
      }
      var frame=window.anim_to_playback[fi];
      this.doing_draw = true;
      var draw=function draw() {
        this2.doing_draw = false;
        if (frame!=undefined) {
            if (g1._putImageData!=undefined)
              g1._putImageData(frame.data, pos[0], window.innerHeight-(pos[1]+vd.size[1]));
            else 
              g1.putImageData(frame.data, pos[0], window.innerHeight-(pos[1]+vd.size[1]));
        }
      };
      requestAnimationFrame(draw);
    }
     end(ctx) {
      if (this.timer!=undefined)
        window.clearInterval(this.timer);
      this.end_modal();
    }
     on_keydown(event) {
      switch (event.keyCode) {
        case charmap["Escape"]:
          this.end(this.modal_ctx);
      }
    }
  }
  _ESClass.register(PlayAnimOp);
  _es6_module.add_class(PlayAnimOp);
  PlayAnimOp = _es6_module.add_export('PlayAnimOp', PlayAnimOp);
  var EditorTypes=es6_import_item(_es6_module, './view2d_base.js', 'EditorTypes');
  var $ops_9LNZ_tools_menu;
  class SplineEditor extends View2DEditor {
    
    
     constructor(view2d) {
      var keymap=new KeyMap();
      super("Geometry", EditorTypes.SPLINE, EditModes2.GEOMETRY, DataTypes.FRAMESET, keymap);
      this.mpos = new Vector3();
      this.start_mpos = new Vector3();
      this.define_keymap();
      this.vieiw3d = view2d;
      this.highlight_spline = undefined;
    }
     on_area_inactive(view2d) {

    }
     editor_duplicate(view2d) {
      var m=new SplineEditor(view2d);
      m.selectmode = this.selectmode;
      m.keymap = this.keymap;
      return m;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
    static  fromSTRUCT(reader) {
      var m=new SplineEditor(undefined);
      reader(m);
      return m;
    }
     data_link(block, getblock, getblock_us) {
      this.ctx = new Context();
    }
     add_menu(view2d, mpos, add_title=true) {
      this.ctx = new Context();
      console.log("Add menu");
      var oplist=[];
      var menu=toolop_menu(view2d.ctx, add_title ? "Add" : "", oplist);
      return menu;
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
     build_sidebar1(view2d, col) {
      console.trace("build_sidebar1");
      var ctx=new Context();
      col.packflag|=PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING|PackFlags.IGNORE_LIMIT|PackFlags.INHERIT_WIDTH;
      col.default_packflag = PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING;
      col.draw_background = true;
      col.rcorner = 100.0;
      col.default_packflag|=PackFlags.USE_LARGE_ICON;
      col.default_packflag&=~PackFlags.USE_SMALL_ICON;
      let blank=new UIFrame(this.ctx);
      blank.size[0] = 70;
      blank.size[1] = 1;
      blank.get_min_size = function () {
        return this.size;
      };
      col.add(blank);
      col.toolop("spline.make_edge()");
      col.toolop("spline.make_edge_face()");
      col.toolop("spline.split_pick_edge_transform()");
      col.toolop("spline.change_face_z(offset=1, selmode=selectmode)", PackFlags.USE_LARGE_ICON, "Move Up", Icons.Z_UP);
      col.toolop("spline.change_face_z(offset=-1, selmode=selectmode)", PackFlags.USE_LARGE_ICON, "Move Down", Icons.Z_DOWN);
      col.prop("view2d.draw_anim_paths");
    }
     build_bottombar(view2d, col) {
      var ctx=new Context();
      col.packflag|=PackFlags.ALIGN_LEFT|PackFlags.INHERIT_WIDTH|PackFlags.INHERIT_HEIGHT;
      col.packflag|=PackFlags.NO_AUTO_SPACING|PackFlags.IGNORE_LIMIT;
      col.default_packflag = PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING;
      col.rcorner = 100.0;
      col.add(gen_editor_switcher(this.ctx, view2d));
      var prop=col.prop("view2d.selectmode", PackFlags.USE_SMALL_ICON|PackFlags.ENUM_STRIP);
      prop.packflag|=PackFlags.USE_ICON|PackFlags.ENUM_STRIP;
      col.prop('view2d.default_stroke', PackFlags.COLOR_BUTTON_ONLY);
      col.prop('view2d.edit_all_layers');
    }
     define_keymap() {
      var k=this.keymap;
      k.add_tool(new HotKey("PageUp", [], "Send Face Up"), "spline.change_face_z(offset=1, selmode=selectmode)");
      k.add_tool(new HotKey("PageDown", [], "Send Face Down"), "spline.change_face_z(offset=-1, selmode=selectmode)");
      k.add_tool(new HotKey("G", [], "Translate"), "spline.translate(datamode=selectmode)");
      k.add_tool(new HotKey("S", [], "Scale"), "spline.scale(datamode=selectmode)");
      k.add_tool(new HotKey("S", ["SHIFT"], "Scale Time"), "spline.shift_time()");
      k.add_tool(new HotKey("R", [], "Rotate"), "spline.rotate(datamode=selectmode)");
      k.add_tool(new HotKey("A", [], "Select Linked"), "spline.toggle_select_all()");
      k.add_tool(new HotKey("A", ["ALT"], "Animation Playback"), "editor.playback()");
      k.add_tool(new HotKey("H", [], "Hide Selection"), "spline.hide(selmode=selectmode)");
      k.add_tool(new HotKey("H", ["ALT"], "Reveal Selection"), "spline.unhide(selmode=selectmode)");
      k.add_tool(new HotKey("G", ["CTRL"], "Ghost Selection"), "spline.hide(selmode=selectmode, ghost=1)");
      k.add_tool(new HotKey("G", ["ALT"], "Unghost Selection"), "spline.unhide(selmode=selectmode, ghost=1)");
      k.add(new HotKey("L", [], "Select Linked"), new FuncKeyHandler(function (ctx) {
        var mpos=ctx.keymap_mpos;
        var ret=ctx.spline.q.findnearest_vert(ctx.view2d, mpos, 55, undefined, ctx.view2d.edit_all_layers);
        console.log("select linked", ret);
        if (ret!=undefined) {
            var tool=new SelectLinkedOp(true, ctx.view2d.selectmode);
            tool.inputs.vertex_eid.setValue(ret[0].eid);
            tool.inputs.mode.setValue("SELECT");
            ctx.appstate.toolstack.exec_tool(tool);
        }
      }));
      k.add(new HotKey("L", ["SHIFT"], "Select Linked"), new FuncKeyHandler(function (ctx) {
        var mpos=ctx.keymap_mpos;
        var ret=ctx.spline.q.findnearest_vert(ctx.view2d, mpos, 55, undefined, ctx.view2d.edit_all_layers);
        if (ret!=undefined) {
            var tool=new SelectLinkedOp(true);
            tool.inputs.vertex_eid.setValue(ret[0].eid);
            tool.inputs.mode.setValue("deselect");
            ctx.appstate.toolstack.exec_tool(tool);
        }
      }));
      k.add_tool(new HotKey("B", [], "Toggle Break-Tangents"), "spline.toggle_break_tangents()");
      k.add_tool(new HotKey("B", ["SHIFT"], "Toggle Break-Curvature"), "spline.toggle_break_curvature()");
      var this2=this;
      function del_tool(ctx) {
        console.log("delete");
        if (this2.selectmode&SelMask.SEGMENT) {
            console.log("kill segments");
            var op=new DeleteSegmentOp();
            g_app_state.toolstack.exec_tool(op);
        }
        else 
          if (this2.selectmode&SelMask.FACE) {
            console.log("kill faces");
            var op=new DeleteFaceOp();
            g_app_state.toolstack.exec_tool(op);
        }
        else {
          console.log("kill verts");
          var op=new DeleteVertOp();
          g_app_state.toolstack.exec_tool(op);
        }
      }
      k.add(new HotKey("X", [], "Delete"), new FuncKeyHandler(del_tool));
      k.add(new HotKey("Delete", [], "Delete"), new FuncKeyHandler(del_tool));
      k.add(new HotKey("Backspace", [], "Delete"), new FuncKeyHandler(del_tool));
      k.add_tool(new HotKey("D", [], "Dissolve Vertices"), "spline.dissolve_verts()");
      k.add_tool(new HotKey("D", ["SHIFT"], "Duplicate"), "spline.duplicate_transform()");
      k.add_tool(new HotKey("F", [], "Create Face/Edge"), "spline.make_edge_face()");
      k.add_tool(new HotKey("E", [], "Split Segments"), "spline.split_edges()");
      k.add_tool(new HotKey("M", [], "Mirror Verts"), "spline.mirror_verts()");
      k.add_tool(new HotKey("C", [], "Circle Select"), "view2d.circle_select()");
      k.add(new HotKey("Z", [], "Toggle Only Render"), new FuncKeyHandler(function (ctx) {
        ctx.view2d.only_render^=1;
        window.redraw_viewport();
      }));
      k.add(new HotKey("W", [], "Tools Menu"), new FuncKeyHandler(function (ctx) {
        var mpos=ctx.keymap_mpos;
        ctx.view2d.tools_menu(ctx, mpos);
      }));
    }
     set_selectmode(mode) {
      this.selectmode = mode;
    }
     do_select(event, mpos, view2d, do_multiple=false) {
      return false;
    }
     tools_menu(ctx, mpos, view2d) {
      var menu=view2d.toolop_menu(ctx, "Tools", $ops_9LNZ_tools_menu);
      view2d.call_menu(menu, view2d, mpos);
    }
     on_inactive(view2d) {

    }
     on_active(view2d) {

    }
     rightclick_menu(event, view2d) {

    }
     _get_spline() {
      return this.ctx.spline;
    }
     on_mousedown(event) {
      var spline=this.ctx.spline;
      var toolmode=this.ctx.view2d.toolmode;
      if (this.highlight_spline!==undefined) {
      }
      if (this.highlight_spline!==undefined&&this.highlight_spline!==spline) {
          var newpath;
          console.log("spline switch!");
          if (this.highlight_spline.is_anim_path) {
              newpath = "frameset.pathspline";
          }
          else {
            newpath = "frameset.drawspline";
          }
          console.log(spline._debug_id, this.highlight_spline._debug_id);
          console.log("new path!", G.active_splinepath, newpath);
          this.ctx.switch_active_spline(newpath);
          spline = this._get_spline();
          redraw_viewport();
      }
      if ("size" in spline&&spline[0]!=window.innerWidth&&spline[1]!=window.innerHeight) {
          spline.size[0] = window.innerWidth;
          spline.size[1] = window.innerHeight;
      }
      if (event.button==0) {
          var can_append=toolmode==ToolModes.APPEND;
          can_append = can_append&&(this.selectmode&(SelMask.VERTEX|SelMask.HANDLE));
          can_append = can_append&&spline.verts.highlight===undefined&&spline.handles.highlight===undefined;
          if (can_append) {
              var co=new Vector3([event.x, event.y, 0]);
              this.view2d.unproject(co);
              console.log(co);
              var op=new ExtrudeVertOp(co, this.ctx.view2d.extrude_mode);
              op.inputs.location.setValue(co);
              op.inputs.linewidth.setValue(this.ctx.view2d.default_linewidth);
              op.inputs.stroke.setValue(this.ctx.view2d.default_stroke);
              g_app_state.toolstack.exec_tool(op);
              redraw_viewport();
          }
          else {
            for (var i=0; i<spline.elists.length; i++) {
                var list=spline.elists[i];
                if (!(this.selectmode&list.type))
                  continue;
                
                if (list.highlight==undefined)
                  continue;
                var op=new SelectOneOp(list.highlight, !event.shiftKey, !(list.highlight.flag&SplineFlags.SELECT), this.selectmode, true);
                g_app_state.toolstack.exec_tool(op);
            }
          }
          this.start_mpos[0] = event.x;
          this.start_mpos[1] = event.y;
          this.start_mpos[2] = 0.0;
          this.mdown = true;
      }
    }
     ensure_paths_off() {
      if (g_app_state.active_splinepath!="frameset.drawspline") {
          this.highlight_spline = undefined;
          var spline=this.ctx.spline;
          g_app_state.switch_active_spline("frameset.drawspline");
          spline.clear_highlight();
          spline.solve();
          redraw_viewport();
      }
    }
    get  draw_anim_paths() {
      return this.ctx.view2d.draw_anim_paths;
    }
     findnearest(mpos, selectmask, limit, ignore_layers) {
      var frameset=this.ctx.frameset;
      var editor=this.ctx.view2d;
      var closest=[0, 0, 0];
      var mindis=1e+17;
      var found=false;
      if (!this.draw_anim_paths) {
          this.ensure_paths_off();
          var ret=this.ctx.spline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, ignore_layers);
          if (ret!=undefined) {
              return [this.ctx.spline, ret[0], ret[1]];
          }
          else {
            return undefined;
          }
      }
      var actspline=this.ctx.spline;
      var pathspline=this.ctx.frameset.pathspline;
      var drawspline=this.ctx.frameset.spline;
      var ret=drawspline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, ignore_layers);
      if (ret!=undefined&&ret[1]<limit) {
          mindis = ret[1]-(drawspline===actspline ? 3 : 0);
          found = true;
          closest[0] = drawspline;
          closest[1] = ret[0];
          closest[2] = mindis;
      }
      var ret=frameset.pathspline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, false);
      if (ret!=undefined) {
          ret[1]-=pathspline===actspline ? 2 : 0;
          if (ret[1]<limit&&ret[1]<mindis) {
              closest[0] = pathspline;
              closest[1] = ret[0];
              closest[2] = ret[1]-(pathspline===actspline ? 3 : 0);
              mindis = ret[1];
              found = true;
          }
      }
      if (!found)
        return undefined;
      return closest;
    }
     on_mousemove(event) {
      if (this.ctx==undefined)
        return ;
      var toolmode=this.ctx.view2d.toolmode;
      var selectmode=this.selectmode;
      var limit=selectmode&SelMask.SEGMENT ? 55 : 12;
      if (toolmode==ToolModes.SELECT)
        limit*=3;
      var spline=this.ctx.spline;
      spline.size = [window.innerWidth, window.innerHeight];
      this.mpos[0] = event.x, this.mpos[1] = event.y, this.mpos[2] = 0.0;
      var selectmode=this.selectmode;
      if (this.mdown) {
          this.mdown = false;
          let mpos=new Vector2();
          mpos.load(this.start_mpos);
          var op=new TranslateOp(mpos);
          console.log("start_mpos:", mpos);
          op.inputs.datamode.setValue(this.ctx.view2d.selectmode);
          op.inputs.edit_all_layers.setValue(this.ctx.view2d.edit_all_layers);
          var ctx=new Context();
          if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
              op.inputs.proportional.setValue(true);
              op.inputs.propradius.setValue(ctx.view2d.propradius);
          }
          g_app_state.toolstack.exec_tool(op);
          return ;
      }
      if (this.mdown)
        return ;
      var ret=this.findnearest([event.x, event.y], this.ctx.view2d.selectmode, limit, this.ctx.view2d.edit_all_layers);
      if (ret!=undefined&&typeof (ret[1])!="number"&&ret[2]!=SelMask.MULTIRES) {
          if (this.highlight_spline!=undefined) {
              for (var list of this.highlight_spline.elists) {
                  if (list.highlight!=undefined) {
                      redraw_element(list.highlight, this.view2d);
                  }
              }
          }
          if (ret[0]!==this.highlight_spline&&this.highlight_spline!=undefined) {
              this.highlight_spline.clear_highlight();
          }
          this.highlight_spline = ret[0];
          this.highlight_spline.clear_highlight();
          var list=this.highlight_spline.get_elist(ret[1].type);
          list.highlight = ret[1];
          redraw_element(list.highlight, this.view2d);
      }
      else {
        if (this.highlight_spline!=undefined) {
            for (var i=0; i<this.highlight_spline.elists.length; i++) {
                var list=this.highlight_spline.elists[i];
                if (list.highlight!=undefined) {
                    redraw_element(list.highlight, this.view2d);
                }
            }
            this.highlight_spline.clear_highlight();
        }
      }
    }
     on_mouseup(event) {
      var spline=this._get_spline();
      spline.size = [window.innerWidth, window.innerHeight];
      this.mdown = false;
    }
     do_alt_select(event, mpos, view2d) {

    }
     gen_edit_menu(add_title=false) {
      var view2d=this.view2d;
      var ctx=new Context();
      var ops=["spline.select_linked(vertex_eid=active_vertex())", "view2d.circle_select()", "spline.toggle_select_all()", "spline.hide()", "spline.unhide()", "spline.connect_handles()", "spline.disconnect_handles()", "spline.duplicate_transform()", "spline.mirror_verts()", "spline.split_edges()", "spline.make_edge_face()", "spline.dissolve_verts()", "spline.delete_verts()", "spline.delete_segments()", "spline.delete_faces()", "spline.split_edges()", "spline.toggle_manual_handles()"];
      ops.reverse();
      var menu=view2d.toolop_menu(ctx, add_title ? "Edit" : "", ops);
      return menu;
    }
     delete_menu(event) {
      var view2d=this.view2d;
      var ctx=new Context();
      var menu=this.gen_delete_menu(true);
      menu.close_on_right = true;
      menu.swap_mouse_button = 2;
      view2d.call_menu(menu, view2d, [event.x, event.y]);
    }
  }
  var $ops_9LNZ_tools_menu=["spline.key_edges()", "spline.key_current_frame()", "spline.connect_handles()", "spline.disconnect_handles()", "spline.toggle_step_mode()", "spline.toggle_manual_handles()", "editor.paste_pose()", "editor.copy_pose()"];
  _ESClass.register(SplineEditor);
  _es6_module.add_class(SplineEditor);
  SplineEditor = _es6_module.add_export('SplineEditor', SplineEditor);
  SplineEditor.STRUCT = `
  SplineEditor {
    selectmode : int;
  }
`;
  var ScreenArea=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'ScreenArea');
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
}, '/dev/fairmotion/src/editors/viewport/view2d_spline_ops.js');
es6_module_define('view2d_object_ops', ["../../core/struct.js", "../../path.ux/scripts/screen/ScreenArea.js", "../../curve/spline_multires.js", "./view2d_base.js", "../../curve/spline_types.js", "./view2d_editor.js", "../../curve/spline_draw.js", "./spline_createops.js", "./transform_ops.js", "../../core/animdata.js", "./spline_editops.js", "./selectmode.js", "./multires/multires_ops.js", "./transform.js", "../../core/toolops_api.js", "./multires/multires_selectops.js", "../../core/lib_api.js", "./spline_selectops.js", "../events.js", "../../curve/spline.js"], function _view2d_object_ops_module(_es6_module) {
  "use strict";
  var ExtrudeVertOp=es6_import_item(_es6_module, './spline_createops.js', 'ExtrudeVertOp');
  var DeleteVertOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteSegmentOp');
  var CreateMResPoint=es6_import_item(_es6_module, './multires/multires_ops.js', 'CreateMResPoint');
  var mr_selectops=es6_import(_es6_module, './multires/multires_selectops.js');
  var spline_selectops=es6_import(_es6_module, './spline_selectops.js');
  var WidgetResizeOp=es6_import_item(_es6_module, './transform_ops.js', 'WidgetResizeOp');
  var WidgetRotateOp=es6_import_item(_es6_module, './transform_ops.js', 'WidgetRotateOp');
  var compose_id=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'decompose_id');
  var MResFlags=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'MResFlags');
  var MultiResLayer=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'MultiResLayer');
  var ScreenArea, Area;
  var DataTypes=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataTypes');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var EditModes=es6_import_item(_es6_module, './view2d_editor.js', 'EditModes');
  var KeyMap=es6_import_item(_es6_module, '../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../events.js', 'EventHandler');
  var SelectLinkedOp=es6_import_item(_es6_module, './spline_selectops.js', 'SelectLinkedOp');
  var SelectOneOp=es6_import_item(_es6_module, './spline_selectops.js', 'SelectOneOp');
  var TranslateOp=es6_import_item(_es6_module, './transform.js', 'TranslateOp');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var ToolModes=es6_import_item(_es6_module, './selectmode.js', 'ToolModes');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var SplineVertex=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineSegment');
  var SplineFace=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFace');
  var Spline=es6_import_item(_es6_module, '../../curve/spline.js', 'Spline');
  var View2DEditor=es6_import_item(_es6_module, './view2d_editor.js', 'View2DEditor');
  var SessionFlags=es6_import_item(_es6_module, './view2d_editor.js', 'SessionFlags');
  var DataBlock=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataTypes');
  var redraw_element=es6_import_item(_es6_module, '../../curve/spline_draw.js', 'redraw_element');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ModalStates');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var get_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'get_vtime');
  var EditorTypes=es6_import_item(_es6_module, './view2d_base.js', 'EditorTypes');
  class SceneObjectEditor extends View2DEditor {
    
    
     constructor(view2d) {
      super("Object", EditorTypes.OBJECT, EditModes.OBJECT, DataTypes.FRAMESET, keymap);
      this.mpos = new Vector3();
      this.start_mpos = new Vector3();
      this.define_keymap();
      this.view2d = view2d;
      this.highlight_spline = undefined;
    }
     on_area_inactive(view2d) {

    }
     editor_duplicate(view2d) {
      var m=new SceneObjectEditor(view2d);
      m.selectmode = this.selectmode;
      m.keymap = this.keymap;
      return m;
    }
    static  fromSTRUCT(reader) {
      var m=new SceneObjectEditor(undefined);
      reader(m);
      return m;
    }
     data_link(block, getblock, getblock_us) {
      this.ctx = new Context();
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
     build_sidebar1(view2d, col) {

    }
     build_bottombar(view2d, col) {

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
      let ops=[];
      var menu=view2d.toolop_menu(ctx, "Tools", ops);
      view2d.call_menu(menu, view2d, mpos);
    }
     on_inactive(view2d) {

    }
     on_active(view2d) {

    }
     rightclick_menu(event, view2d) {

    }
     on_mousedown(event) {

    }
     ensure_paths_off() {
      if (g_app_state.active_splinepath!="frameset.drawspline") {
          this.highlight_spline = undefined;
          var spline=this.ctx.spline;
          g_app_state.switch_active_spline("frameset.drawspline");
          spline.clear_highlight();
          spline.solve();
          redraw_viewport();
      }
    }
    get  draw_anim_paths() {
      return this.ctx.view2d.draw_anim_paths;
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
  _ESClass.register(SceneObjectEditor);
  _es6_module.add_class(SceneObjectEditor);
  SceneObjectEditor = _es6_module.add_export('SceneObjectEditor', SceneObjectEditor);
  SceneObjectEditor.STRUCT = `
SceneObjectEditor {
  selectmode : int;
}
`;
  var ScreenArea=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'ScreenArea');
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
}, '/dev/fairmotion/src/editors/viewport/view2d_object_ops.js');
es6_module_define('sceneobject_ops', ["../../core/toolops_api.js", "../../core/struct.js", "../../core/toolprops.js"], function _sceneobject_ops_module(_es6_module) {
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var Vec2Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec2Property');
  var Vec3Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec3Property');
  var EnumProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'EnumProperty');
  var FlagProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FlagProperty');
  var StringProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'StringProperty');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  var TPropFlags=es6_import_item(_es6_module, '../../core/toolprops.js', 'TPropFlags');
  var PropTypes=es6_import_item(_es6_module, '../../core/toolprops.js', 'PropTypes');
  var PropSubTypes=es6_import_item(_es6_module, '../../core/toolprops.js', 'PropSubTypes');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolFlags');
  var ToolMacro=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolMacro');
}, '/dev/fairmotion/src/editors/viewport/sceneobject_ops.js');
es6_module_define('view2d_base', [], function _view2d_base_module(_es6_module) {
  var EditModes={VERT: 1, 
   EDGE: 2, 
   HANDLE: 4, 
   FACE: 16, 
   OBJECT: 32, 
   GEOMETRY: 1|2|4|16}
  EditModes = _es6_module.add_export('EditModes', EditModes);
  var EditorTypes={SPLINE: 1, 
   OBJECT: 32}
  EditorTypes = _es6_module.add_export('EditorTypes', EditorTypes);
  var SessionFlags={PROP_TRANSFORM: 1}
  SessionFlags = _es6_module.add_export('SessionFlags', SessionFlags);
}, '/dev/fairmotion/src/editors/viewport/view2d_base.js');
es6_module_define('animspline', ["../curve/spline_types.js", "./animdata.js", "../path.ux/scripts/util/struct.js", "./struct.js", "../curve/spline.js", "./lib_api.js", "./toolprops.js", "../curve/spline_element_array.js"], function _animspline_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
  var DataBlock=es6_import_item(_es6_module, './lib_api.js', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, './lib_api.js', 'DataTypes');
  var Spline=es6_import_item(_es6_module, '../curve/spline.js', 'Spline');
  var RestrictFlags=es6_import_item(_es6_module, '../curve/spline.js', 'RestrictFlags');
  var CustomDataLayer=es6_import_item(_es6_module, '../curve/spline_types.js', 'CustomDataLayer');
  var SplineTypes=es6_import_item(_es6_module, '../curve/spline_types.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../curve/spline_types.js', 'SplineFlags');
  var SplineSegment=es6_import_item(_es6_module, '../curve/spline_types.js', 'SplineSegment');
  var TimeDataLayer=es6_import_item(_es6_module, './animdata.js', 'TimeDataLayer');
  var get_vtime=es6_import_item(_es6_module, './animdata.js', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, './animdata.js', 'set_vtime');
  var AnimChannel=es6_import_item(_es6_module, './animdata.js', 'AnimChannel');
  var AnimKey=es6_import_item(_es6_module, './animdata.js', 'AnimKey');
  var AnimInterpModes=es6_import_item(_es6_module, './animdata.js', 'AnimInterpModes');
  var AnimKeyFlags=es6_import_item(_es6_module, './animdata.js', 'AnimKeyFlags');
  var SplineLayerFlags=es6_import_item(_es6_module, '../curve/spline_element_array.js', 'SplineLayerFlags');
  var SplineLayerSet=es6_import_item(_es6_module, '../curve/spline_element_array.js', 'SplineLayerSet');
  es6_import(_es6_module, '../path.ux/scripts/util/struct.js');
  var restrictflags=RestrictFlags.NO_DELETE|RestrictFlags.NO_EXTRUDE|RestrictFlags.NO_CONNECT;
  var vertanimdata_eval_cache=cachering.fromConstructor(Vector3, 512);
  var AnimChannel=es6_import_item(_es6_module, './animdata.js', 'AnimChannel');
  var AnimKey=es6_import_item(_es6_module, './animdata.js', 'AnimKey');
  var PropTypes=es6_import_item(_es6_module, './toolprops.js', 'PropTypes');
  class VertexAnimIter  {
    
    
     constructor(vd) {
      this.ret = {done: false, 
     value: undefined};
      this.stop = false;
      if (vd!=undefined)
        VertexAnimIter.init(this, vd);
    }
     init(vd) {
      this.vd = vd;
      this.v = vd.startv;
      this.stop = false;
      if (this.v!=undefined&&this.v.segments.length!=0)
        this.s = this.v.segments[0];
      else 
        this.s = undefined;
      this.ret.done = false;
      this.ret.value = undefined;
      return this;
    }
     [Symbol.iterator](self) {
      return this;
    }
     next() {
      var ret=this.ret;
      if (this.vd.startv==undefined) {
          ret.done = true;
          ret.value = undefined;
          return ret;
      }
      if (this.stop&&this.v==undefined) {
          ret.done = true;
          ret.value = undefined;
          return ret;
      }
      ret.value = this.v;
      if (this.stop||this.s==undefined) {
          this.v = undefined;
          if (ret.value==undefined)
            ret.done = true;
          return ret;
      }
      this.v = this.s.other_vert(this.v);
      if (this.v.segments.length<2) {
          this.stop = true;
          return ret;
      }
      this.s = this.v.other_segment(this.s);
      return ret;
    }
  }
  _ESClass.register(VertexAnimIter);
  _es6_module.add_class(VertexAnimIter);
  VertexAnimIter = _es6_module.add_export('VertexAnimIter', VertexAnimIter);
  class SegmentAnimIter  {
    
    
     constructor(vd) {
      this.ret = {done: false, 
     value: undefined};
      this.stop = false;
      if (this.v!=undefined&&this.v.segments.length!=0)
        if (vd!=undefined)
        SegmentAnimIter.init(this, vd);
    }
     init(vd) {
      this.vd = vd;
      this.v = vd.startv;
      this.stop = false;
      if (this.v!==undefined)
        this.s = this.v.segments[0];
      else 
        this.s = undefined;
      this.ret.done = false;
      this.ret.value = undefined;
      return this;
    }
     [Symbol.iterator](self) {
      return this;
    }
     next() {
      var ret=this.ret;
      if (this.stop||this.s==undefined) {
          ret.done = true;
          ret.value = undefined;
          return ret;
      }
      ret.value = this.s;
      this.v = this.s.other_vert(this.v);
      if (this.v.segments.length<2) {
          this.stop = true;
          return ret;
      }
      this.s = this.v.other_segment(this.s);
      return ret;
    }
  }
  _ESClass.register(SegmentAnimIter);
  _es6_module.add_class(SegmentAnimIter);
  SegmentAnimIter = _es6_module.add_export('SegmentAnimIter', SegmentAnimIter);
  var VDAnimFlags={SELECT: 1, 
   STEP_FUNC: 2, 
   HIDE: 4, 
   OWNER_IS_EDITABLE: 8}
  VDAnimFlags = _es6_module.add_export('VDAnimFlags', VDAnimFlags);
  let dvcache=cachering.fromConstructor(Vector3, 256);
  class VertexAnimData  {
    
    
    
    
    
     constructor(eid, pathspline) {
      this.eid = eid;
      this.dead = false;
      this.vitercache = cachering.fromConstructor(VertexAnimIter, 4);
      this.sitercache = cachering.fromConstructor(SegmentAnimIter, 4);
      this.spline = pathspline;
      this.animflag = 0;
      this.flag = 0;
      this.visible = false;
      this.path_times = {};
      this.startv_eid = -1;
      if (pathspline!==undefined) {
          var layer=pathspline.layerset.new_layer();
          layer.flag|=SplineLayerFlags.HIDE;
          this.layerid = layer.id;
      }
      this._start_layer_id = undefined;
      this.cur_time = 0;
    }
    get  startv() {
      if (this.startv_eid===-1)
        return undefined;
      return this.spline.eidmap[this.startv_eid];
    }
    set  startv(v) {
      if (typeof v=="number") {
          this.startv_eid = v;
          return ;
      }
      if (v!==undefined) {
          this.startv_eid = v.eid;
      }
      else {
        this.startv_eid = -1;
      }
    }
     _set_layer() {
      if (this.spline.layerset.active.id!==this.layerid)
        this._start_layer_id = this.spline.layerset.active.id;
      if (this.layerid===undefined) {
          console.log("Error in _set_layer in VertexAnimData!!!");
          return ;
      }
      this.spline.layerset.active = this.spline.layerset.idmap[this.layerid];
    }
     [Symbol.keystr]() {
      return this.eid;
    }
     _unset_layer() {
      if (this._start_layer_id!==undefined) {
          var layer=this.spline.layerset.idmap[this._start_layer_id];
          if (layer!==undefined)
            this.spline.layerset.active = layer;
      }
      this._start_layer_id = undefined;
    }
     remove(v) {
      if (v===this.startv) {
          let startv=undefined;
          for (let v2 of this.verts) {
              if (v2!==v) {
                  startv = v2;
                  break;
              }
          }
          if (startv) {
              this.startv_eid = startv.eid;
              this.spline.remove(v);
          }
          else {
            this.dead = true;
            this.spline.remove(v);
          }
      }
      else {
        let ok=false;
        for (let v2 of this.verts) {
            if (v===v2) {
                ok = true;
                break;
            }
        }
        if (!ok) {
            console.error("Key not in this anim spline", v);
            return ;
        }
        if (v.segments.length===2) {
            this.spline.dissolve_vertex(v);
        }
        else {
          this.spline.kill_vertex(v);
        }
      }
    }
    get  verts() {
      return this.vitercache.next().init(this);
    }
    get  segments() {
      return this.sitercache.next().init(this);
    }
     find_seg(time) {
      var v=this.startv;
      if (v===undefined)
        return undefined;
      if (v.segments.length===0)
        return undefined;
      var s=v.segments[0];
      var lastv=v;
      while (1) {
        lastv = v;
        v = s.other_vert(v);
        if (get_vtime(v)>time) {
            return s;
        }
        if (v.segments.length<2) {
            lastv = v;
            break;
        }
        s = v.other_segment(s);
      }
      return undefined;
    }
     _get_animdata(v) {
      let ret=v.cdata.get_layer(TimeDataLayer);
      ret.owning_veid = this.eid;
      return ret;
    }
     update(co, time) {
      this._set_layer();
      let update=false;
      if (time<0) {
          console.trace("ERROR! negative times not supported!");
          this._unset_layer();
          return false;
      }
      if (this.startv===undefined) {
          this.startv = this.spline.make_vertex(co);
          this._get_animdata(this.startv).time = 1;
          update = true;
          this.spline.regen_sort();
          this.spline.resolve = 1;
      }
      var spline=this.spline;
      var seg=this.find_seg(time);
      if (seg===undefined) {
          var e=this.endv;
          if (this._get_animdata(e).time===time) {
              update = update||e.vectorDistance(co)>0.01;
              e.load(co);
              e.flag|=SplineFlags.UPDATE;
          }
          else {
            var nv=spline.make_vertex(co);
            this._get_animdata(nv).time = time;
            spline.make_segment(e, nv);
            spline.regen_sort();
            update = true;
          }
      }
      else {
        if (get_vtime(seg.v1)===time) {
            update = update||seg.v1.vectorDistance(co)>0.01;
            seg.v1.load(co);
            seg.v1.flag|=SplineFlags.UPDATE;
        }
        else 
          if (get_vtime(seg.v2)===time) {
            update = update||seg.v2.vectorDistance(co)>0.01;
            seg.v2.load(co);
            seg.v2.flag|=SplineFlags.UPDATE;
        }
        else {
          var ret=spline.split_edge(seg);
          var nv=ret[1];
          spline.regen_sort();
          this._get_animdata(nv).time = time;
          update = true;
          nv.load(co);
        }
      }
      spline.resolve = 1;
      this._unset_layer();
      return update;
    }
    get  start_time() {
      var v=this.startv;
      if (v===undefined)
        return 0;
      return get_vtime(v);
    }
    get  end_time() {
      var v=this.endv;
      if (v===undefined)
        return 0;
      return get_vtime(v);
    }
     draw(g, matrix, alpha, time) {
      if (!(this.visible))
        return ;
      var step_func=this.animflag&VDAnimFlags.STEP_FUNC;
      var start=this.start_time, end=this.end_time;
      g.lineWidth = 2.0;
      g.strokeStyle = "rgba(100,100,100,"+alpha+")";
      var dt=1.0;
      var lastco=undefined;
      let dv=new Vector4();
      for (var t=start; t<end; t+=dt) {
          var co=this.evaluate(t);
          dv.load(this.derivative(t));
          co.multVecMatrix(matrix);
          dv[2] = 0.0;
          dv[3] = 0.0;
          dv.multVecMatrix(matrix);
          dv[2] = 0.0;
          dv[3] = 0.0;
          dv.normalize().mulScalar(5);
          let tmp=dv[0];
          dv[0] = -dv[1];
          dv[1] = tmp;
          g.beginPath();
          let green=Math.floor(((t-start)/(end-start))*255);
          g.strokeStyle = "rgba(10, "+green+",10,"+alpha+")";
          g.moveTo(co[0]-dv[0], co[1]-dv[1]);
          g.lineTo(co[0]+dv[0], co[1]+dv[1]);
          g.stroke();
          if (lastco!==undefined) {
              g.moveTo(lastco[0], lastco[1]);
              g.lineTo(co[0], co[1]);
              g.stroke();
          }
          lastco = co;
      }
    }
     derivative(time) {
      var df=0.001;
      var a=this.evaluate(time);
      var b=this.evaluate(time+df);
      b.sub(a).mulScalar(1.0/df);
      return dvcache.next().load(b);
    }
     evaluate(time) {
      if (this.dead) {
          console.error("dead vertex anim key");
          return ;
      }
      var v=this.startv;
      var step_func=this.animflag&VDAnimFlags.STEP_FUNC;
      if (v===undefined)
        return vertanimdata_eval_cache.next().zero();
      var co=vertanimdata_eval_cache.next();
      if (time<=get_vtime(v)) {
          co.load(v);
          return co;
      }
      if (v.segments.length===0) {
          co.load(v);
          return co;
      }
      var s=v.segments[0];
      var lastv=v;
      var lasts=s;
      var lastv2=v;
      while (1) {
        lastv2 = lastv;
        lastv = v;
        v = s.other_vert(v);
        if (get_vtime(v)>=time)
          break;
        if (v.segments.length<2) {
            lastv2 = lastv;
            lastv = v;
            break;
        }
        lasts = s;
        s = v.other_segment(s);
      }
      var nextv=v, nextv2=v;
      var alen1=s!==undefined ? s.length : 1, alen2=alen1;
      var alen0=lasts!==undefined ? lasts.length : alen1, alen3=alen1;
      if (v.segments.length===2) {
          var nexts=v.other_segment(s);
          nextv = nexts.other_vert(v);
          alen2 = nexts.length;
          alen3 = alen2;
      }
      nextv2 = nextv;
      if (nextv2.segments.length===2) {
          var nexts2=nextv2.other_segment(nexts);
          nextv2 = nexts2.other_vert(nextv2);
          alen3 = nexts2.length;
      }
      if (lastv===v||get_vtime(lastv)===time) {
          co.load(v);
      }
      else {
        var pt2=get_vtime(lastv2), pt=get_vtime(lastv), vt=get_vtime(v);
        var nt=get_vtime(nextv), nt2=get_vtime(nextv2);
        var t=(time-pt)/(vt-pt);
        var a=pt, b, c, d=vt;
        var arclength1=alen0;
        var arclength2=alen1;
        var arclength3=alen2;
        var t0=pt2, t3=pt, t6=vt, t9=nt;
        var t1=pt2+(pt-pt2)*(1.0/3.0);
        var t8=vt+(nt-vt)*(2.0/3.0);
        var b=(-(t0-t1)*(t3-t6)*arclength1+(t0-t3)*arclength2*t3)/((t0-t3)*arclength2);
        var c=((t3-t6)*(t8-t9)*arclength3+(t6-t9)*arclength2*t6)/((t6-t9)*arclength2);
        var r1=alen0/alen1;
        var r2=alen1/alen2;
        b = pt+r1*(vt-pt2)/3.0;
        c = vt-r2*(nt-pt)/3.0;
        var t0=a, t1=b, t2=c, t3=d;
        var tt=-(3*(t0-t1)*t-t0+3*(2*t1-t2-t0)*t*t+(3*t2-t3-3*t1+t0)*t*t*t);
        tt = Math.abs(tt);
        if (step_func) {
            t = time<vt ? 0.0 : 1.0;
        }
        co.load(s.evaluate(lastv===s.v1 ? t : 1-t));
      }
      return co;
    }
    get  endv() {
      var v=this.startv;
      if (v===undefined)
        return undefined;
      if (v.segments.length===0)
        return v;
      var s=v.segments[0];
      while (1) {
        v = s.other_vert(v);
        if (v.segments.length<2)
          break;
        s = v.other_segment(s);
      }
      return v;
    }
     check_time_integrity() {
      var lasttime=-100000;
      for (var v of this.verts) {
          var t=get_vtime(v);
          if (t<lasttime) {
              console.log("Found timing integrity error for vertex", this.eid, "path vertex:", v.eid);
              this.regen_topology();
              return true;
          }
          lasttime = t;
      }
      return false;
    }
     regen_topology() {
      var spline=this.spline;
      var verts=[];
      var segs=new set();
      var visit=new set();
      var handles=[];
      var lastv=undefined;
      var hi=0;
      for (var v of this.verts) {
          if (visit.has(v)) {
              continue;
          }
          visit.add(v);
          verts.push(v);
          handles.push(undefined);
          handles.push(undefined);
          hi+=2;
          v.flag|=SplineFlags.UPDATE;
          for (var s of v.segments) {
              segs.add(s);
              var v2=s.other_vert(v);
              var h2=s.other_handle(s.handle(v));
              if (v2===lastv) {
                  handles[hi-2] = h2;
              }
              else {
                handles[hi-1] = h2;
              }
          }
          lastv = v;
      }
      if (verts.length==0) {
          return ;
      }
      verts.sort(function (a, b) {
        return get_vtime(a)-get_vtime(b);
      });
      for (var s of segs) {
          spline.kill_segment(s);
      }
      this.startv_eid = verts[0].eid;
      for (var i=1; i<verts.length; i++) {
          var s=spline.make_segment(verts[i-1], verts[i]);
          s.flag|=SplineFlags.UPDATE;
          s.h1.flag|=SplineFlags.UPDATE;
          s.h2.flag|=SplineFlags.UPDATE;
          for (var k in s.v1.layers) {
              spline.layerset.idmap[k].add(s);
          }
      }
      var hi=0;
      var lastv=undefined;
      for (var v of verts) {
          for (var s of v.segments) {
              var v2=s.other_vert(v);
              var h2=s.other_handle(s.handle(v));
              if (v2===lastv&&handles[hi]!==undefined) {
                  h2.load(handles[hi]);
              }
              else 
                if (v2!==lastv&&handles[hi+1]!==undefined) {
                  h2.load(handles[hi+1]);
              }
          }
          lastv = v;
          hi+=2;
      }
    }
    static  fromSTRUCT(reader) {
      var ret=new VertexAnimData();
      reader(ret);
      return ret;
    }
  }
  _ESClass.register(VertexAnimData);
  _es6_module.add_class(VertexAnimData);
  VertexAnimData = _es6_module.add_export('VertexAnimData', VertexAnimData);
  VertexAnimData.STRUCT = `
VertexAnimData {
  eid         : int;
  flag        : int;
  animflag    : int;
  cur_time    : int;
  layerid     : int;
  startv_eid  : int;
  dead        : bool;
}
`;
}, '/dev/fairmotion/src/core/animspline.js');
es6_module_define('frameset', ["../curve/spline_types.js", "../curve/spline_element_array.js", "./animspline", "./animdata.js", "./struct.js", "./lib_api.js", "./animspline.js", "../curve/spline.js"], function _frameset_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
  var DataBlock=es6_import_item(_es6_module, './lib_api.js', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, './lib_api.js', 'DataTypes');
  var Spline=es6_import_item(_es6_module, '../curve/spline.js', 'Spline');
  var RestrictFlags=es6_import_item(_es6_module, '../curve/spline.js', 'RestrictFlags');
  var CustomDataLayer=es6_import_item(_es6_module, '../curve/spline_types.js', 'CustomDataLayer');
  var SplineTypes=es6_import_item(_es6_module, '../curve/spline_types.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../curve/spline_types.js', 'SplineFlags');
  var SplineSegment=es6_import_item(_es6_module, '../curve/spline_types.js', 'SplineSegment');
  var TimeDataLayer=es6_import_item(_es6_module, './animdata.js', 'TimeDataLayer');
  var get_vtime=es6_import_item(_es6_module, './animdata.js', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, './animdata.js', 'set_vtime');
  var AnimChannel=es6_import_item(_es6_module, './animdata.js', 'AnimChannel');
  var AnimKey=es6_import_item(_es6_module, './animdata.js', 'AnimKey');
  var AnimInterpModes=es6_import_item(_es6_module, './animdata.js', 'AnimInterpModes');
  var AnimKeyFlags=es6_import_item(_es6_module, './animdata.js', 'AnimKeyFlags');
  var SplineLayerFlags=es6_import_item(_es6_module, '../curve/spline_element_array.js', 'SplineLayerFlags');
  var SplineLayerSet=es6_import_item(_es6_module, '../curve/spline_element_array.js', 'SplineLayerSet');
  var animspline=es6_import(_es6_module, './animspline.js');
  var ___animspline=es6_import(_es6_module, './animspline');
  for (let k in ___animspline) {
      _es6_module.add_export(k, ___animspline[k], true);
  }
  var restrictflags=animspline.restrictflags;
  var VertexAnimIter=animspline.VertexAnimIter;
  var SegmentAnimIter=animspline.SegmentAnimIter;
  var VDAnimFlags=animspline.VDAnimFlags;
  var VertexAnimData=animspline.VertexAnimData;
  class SplineFrame  {
    
    
    
     constructor(time, idgen) {
      this.time = time;
      this.flag = 0;
      this.spline = undefined;
    }
    static  fromSTRUCT(reader) {
      var ret=new SplineFrame();
      reader(ret);
      return ret;
    }
  }
  _ESClass.register(SplineFrame);
  _es6_module.add_class(SplineFrame);
  SplineFrame = _es6_module.add_export('SplineFrame', SplineFrame);
  SplineFrame.STRUCT = `
  SplineFrame {
    time    : float;
    spline  : Spline;
    flag    : int;
  }
`;
  window.obj_values_to_array = function obj_values_to_array(obj) {
    var ret=[];
    for (var k in obj) {
        ret.push(obj[k]);
    }
    return ret;
  }
  class AllSplineIter  {
    
    
    
    
    
     constructor(f, sel_only) {
      this.f = f;
      this.iter = undefined;
      this.ret = {done: false, 
     value: undefined};
      this.stage = 0;
      this.sel_only = sel_only;
      this.load_iter();
    }
     load_iter() {
      this.iter = undefined;
      var f=this.f;
      if (this.stage===0) {
          var arr=new GArray();
          for (var k in f.frames) {
              var fr=f.frames[k];
              arr.push(fr.spline);
          }
          this.iter = arr[Symbol.iterator]();
      }
      else 
        if (this.stage===1) {
          var arr=[];
          for (var k in this.f.vertex_animdata) {
              if (this.sel_only) {
                  var vdata=this.f.vertex_animdata[k];
                  var v=this.f.spline.eidmap[k];
                  if (v===undefined||!(v.flag&SplineFlags.SELECT)||v.hidden) {
                      continue;
                  }
              }
              arr.push(this.f.vertex_animdata[k].spline);
          }
          this.iter = arr[Symbol.iterator]();
      }
    }
     reset() {
      this.ret = {done: false, 
     value: undefined};
      this.stage = 0;
      this.iter = undefined;
    }
     [Symbol.iterator]() {
      return this;
    }
     next() {
      if (this.iter===undefined) {
          this.ret.done = true;
          this.ret.value = undefined;
          var ret=this.ret;
          this.reset();
          return ret;
      }
      var next=this.iter.next();
      var ret=this.ret;
      ret.value = next.value;
      ret.done = next.done;
      if (next.done) {
          this.stage++;
          this.load_iter();
          if (this.iter!==undefined) {
              ret.done = false;
          }
      }
      if (ret.done) {
          this.reset();
      }
      return ret;
    }
  }
  _ESClass.register(AllSplineIter);
  _es6_module.add_class(AllSplineIter);
  class EidTimePair  {
     constructor(eid, time) {
      this.eid = eid;
      this.time = time;
    }
     load(eid, time) {
      this.eid = eid;
      this.time = time;
    }
    static  fromSTRUCT(reader) {
      var ret=new EidTimePair();
      reader(ret);
      return ret;
    }
     [Symbol.keystr]() {
      return ""+this.eid+"_"+this.time;
    }
  }
  _ESClass.register(EidTimePair);
  _es6_module.add_class(EidTimePair);
  EidTimePair.STRUCT = `
  EidTimePair {
    eid  : int;
    time : int;
  }
`;
  function combine_eid_time(eid, time) {
    return new EidTimePair(eid, time);
  }
  var split_eid_time_rets=new cachering(function () {
    return [0, 0];
  }, 64);
  function split_eid_time(t) {
    var ret=split_eid_time_rets.next();
    ret[0] = t.eid;
    ret[1] = t.time;
    return ret;
  }
  class SplineKCacheItem  {
     constructor(data, time, hash) {
      this.data = data;
      this.time = time;
      this.hash = hash;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(SplineKCacheItem);
  _es6_module.add_class(SplineKCacheItem);
  SplineKCacheItem = _es6_module.add_export('SplineKCacheItem', SplineKCacheItem);
  SplineKCacheItem.STRUCT = `
SplineKCacheItem {
  data : array(byte);
  time : float;
  hash : int;
}
`;
  class SplineKCache  {
    
    
    
     constructor() {
      this.cache = {};
      this.invalid_eids = new set();
      this.hash = 0;
    }
     has(frame, spline) {
      if (!this.cache[frame]) {
          return false;
      }
      let hash=this.calchash(spline);
      if (_DEBUG.timeChange)
        console.log("hash", hash, "should be", this.cache[frame].hash);
      return this.cache[frame].hash===hash;
    }
     set(frame, spline) {
      for (var eid in spline.eidmap) {
          this.revalidate(eid, frame);
      }
      let hash=this.calchash(spline);
      this.cache[frame] = new SplineKCacheItem(spline.export_ks(), frame, hash);
    }
     invalidate(eid, time) {
      this.invalid_eids.add(combine_eid_time(eid, time));
    }
     revalidate(eid, time) {
      var t=combine_eid_time(time);
      this.invalid_eids.remove(t);
    }
     calchash(spline) {
      let hash=0;
      let mul1=Math.sqrt(3.0), mul2=Math.sqrt(17.0);
      for (let v of spline.points) {
          hash = Math.fract(hash*mul1+v[0]*mul2);
          hash = Math.fract(hash*mul1+v[1]*mul2);
      }
      return ~~(hash*1024*1024);
    }
     load(frame, spline) {
      if (typeof frame==="string") {
          throw new Error("Got bad frame! "+frame);
      }
      if (!(frame in this.cache)) {
          warn("Warning, bad call to SplineKCache");
          return ;
      }
      var ret=spline.import_ks(this.cache[frame].data);
      if (ret===undefined) {
          delete this.cache[frame];
          console.log("bad kcache data for frame", frame);
          for (var s of spline.segments) {
              s.v1.flag|=SplineFlags.UPDATE;
              s.v2.flag|=SplineFlags.UPDATE;
              s.h1.flag|=SplineFlags.UPDATE;
              s.h2.flag|=SplineFlags.UPDATE;
              s.flag|=SplineFlags.UPDATE;
          }
          spline.resolve = 1;
          return ;
      }
      for (var eid in spline.eidmap) {
          var t=combine_eid_time(eid, frame);
          if (!this.invalid_eids.has(t))
            continue;
          this.invalid_eids.remove(t);
          var e=spline.eidmap[eid];
          e.flag|=SplineFlags.UPDATE;
          spline.resolve = 1;
      }
    }
     _as_array() {
      var ret=[];
      for (var k in this.cache) {
          ret.push(this.cache[k].data);
      }
      return ret;
    }
    static  fromSTRUCT(reader) {
      var ret=new SplineKCache();
      reader(ret);
      var cache={};
      var inv=new set();
      if (ret.invalid_eids!=undefined&&__instance_of(ret.invalid_eids, Array)) {
          for (var i=0; i<ret.invalid_eids.length; i++) {
              inv.add(ret.invalid_eids[i]);
          }
      }
      if (ret.times) {
          ret.invalid_eids = inv;
          for (var i=0; i<ret.cache.length; i++) {
              cache[ret.times[i]] = new Uint8Array(ret.cache[i]);
          }
          delete ret.times;
          ret.cache = cache;
      }
      else {
        for (let item of ret.cache) {
            cache[item.time] = item;
        }
        ret.cache = cache;
      }
      return ret;
    }
  }
  _ESClass.register(SplineKCache);
  _es6_module.add_class(SplineKCache);
  SplineKCache = _es6_module.add_export('SplineKCache', SplineKCache);
  SplineKCache.STRUCT = `
  SplineKCache {
    cache : array(SplineKCacheItem) | obj._as_array();
    invalid_eids : iter(EidTimePair);
  }
`;
  class SplineFrameSet extends DataBlock {
    
    
    
    
    
    
    
    
    
    
    
     constructor() {
      super(DataTypes.FRAMESET);
      this.editmode = "MAIN";
      this.editveid = -1;
      this.spline = undefined;
      this.kcache = new SplineKCache();
      this.idgen = new SDIDGen();
      this.frames = {};
      this.framelist = [];
      this.vertex_animdata = {};
      this.pathspline = this.make_pathspline();
      this.templayerid = this.pathspline.layerset.active.id;
      this.selectmode = 0;
      this.draw_anim_paths = 0;
      this.time = 1;
      this.insert_frame(0);
      this.switch_on_select = true;
    }
     fix_anim_paths() {
      this.find_orphan_pathverts();
    }
    get  active_animdata() {
      if (this.spline.verts.active===undefined) {
          return undefined;
      }
      return this.get_vdata(this.spline.verts.active.eid, true);
    }
     find_orphan_pathverts() {
      var vset=new set();
      var vset2=new set();
      for (var v of this.spline.verts) {
          vset2.add(v.eid);
      }
      for (var k in this.vertex_animdata) {
          var vd=this.vertex_animdata[k];
          if (!vset2.has(k)) {
              delete this.vertex_animdata[k];
              continue;
          }
          for (var v of vd.verts) {
              vset.add(v.eid);
          }
      }
      var totorphaned=0;
      for (var v of this.pathspline.verts) {
          if (!vset.has(v.eid)) {
              this.pathspline.kill_vertex(v);
              totorphaned++;
          }
      }
      console.log("totorphaned: ", totorphaned);
    }
     has_coincident_verts(threshold, time_threshold) {
      threshold = threshold===undefined ? 2 : threshold;
      time_threshold = time_threshold===undefined ? 0 : time_threshold;
      var ret=new set();
      for (var k in this.vertex_animdata) {
          var vd=this.vertex_animdata[k];
          var lastv=undefined;
          var lasttime=undefined;
          for (var v of vd.verts) {
              var time=get_vtime(v);
              if (lastv!==undefined&&lastv.vectorDistance(v)<threshold&&Math.abs(time-lasttime)<=time_threshold) {
                  console.log("Coincident vert!", k, v.eid, lastv.vectorDistance(v));
                  if (v.segments.length===2)
                    ret.add(v);
                  else 
                    if (lastv.segments.length===2)
                    ret.add(lastv);
              }
              lastv = v;
              lasttime = time;
          }
      }
      return ret;
    }
     create_path_from_adjacent(v, s) {
      if (v.segments.length<2) {
          console.log("Invalid input to create_path_from_adjacent");
          return ;
      }
      var v1=s.other_vert(v), v2=v.other_segment(s).other_vert(v);
      var av1=this.get_vdata(v1.eid, false), av2=this.get_vdata(v2.eid, false);
      if (av1===undefined&&av2===undefined) {
          console.log("no animation data to interpolate");
          return ;
      }
      else 
        if (av1===undefined) {
          av1 = av2;
      }
      else 
        if (av2===undefined) {
          av2 = av1;
      }
      var av3=this.get_vdata(v.eid, true);
      var keyframes=new set();
      for (var v of av1.verts) {
          keyframes.add(get_vtime(v));
      }
      for (var v of av2.verts) {
          keyframes.add(get_vtime(v));
      }
      var co=new Vector3();
      var oflag1=av1.animflag, oflag2=av2.animflag;
      av1.animflag&=VDAnimFlags.STEP_FUNC;
      av2.animflag&=VDAnimFlags.STEP_FUNC;
      for (var time of keyframes) {
          var co1=av1.evaluate(time), co2=av2.evaluate(time);
          co.load(co1).add(co2).mulScalar(0.5);
          av3.update(co, time);
      }
      av3.animflag = oflag1|oflag2;
      av1.animflag = oflag1;
      av2.animflag = oflag2;
    }
     set_visibility(vd_eid, state) {
      console.log("set called", vd_eid, state);
      var vd=this.vertex_animdata[vd_eid];
      if (vd===undefined)
        return ;
      var layer=this.pathspline.layerset.idmap[vd.layerid];
      var drawlayer=this.pathspline.layerset.idmap[this.templayerid];
      vd.visible = !!state;
      for (var v of vd.verts) {
          if (state) {
              layer.remove(v);
              drawlayer.add(v);
              v.flag&=~(SplineFlags.GHOST|SplineFlags.HIDE);
              for (var i=0; i<v.segments.length; i++) {
                  layer.remove(v.segments[i]);
                  drawlayer.add(v.segments[i]);
                  v.segments[i].flag&=~(SplineFlags.GHOST|SplineFlags.HIDE);
              }
          }
          else {
            drawlayer.remove(v);
            layer.add(v);
            v.flag|=SplineFlags.GHOST|SplineFlags.HIDE;
            for (var i=0; i<v.segments.length; i++) {
                drawlayer.remove(v.segments[i]);
                layer.add(v.segments[i]);
                v.segments[i].flag|=SplineFlags.GHOST|SplineFlags.HIDE;
            }
          }
      }
      this.pathspline.regen_sort();
    }
     on_destroy() {
      this.spline.on_destroy();
      this.pathspline.on_destroy();
    }
     on_spline_select(element, state) {
      if (!this.switch_on_select)
        return ;
      var vd=this.get_vdata(element.eid, false);
      if (vd===undefined)
        return ;
      var hide=!(this.selectmode&element.type);
      hide = hide||!(element.flag&SplineFlags.SELECT);
      if (element.type===SplineTypes.HANDLE) {
          hide = hide||!element.use;
      }
      var layer=this.pathspline.layerset.idmap[vd.layerid];
      var drawlayer=this.pathspline.layerset.idmap[this.templayerid];
      vd.visible = !hide;
      for (var v of vd.verts) {
          v.sethide(hide);
          for (var i=0; i<v.segments.length; i++) {
              var s=v.segments[i];
              s.sethide(hide);
              s.flag&=~(SplineFlags.GHOST|SplineFlags.HIDE);
              if (!hide&&!(drawlayer.id in s.layers)) {
                  layer.remove(s);
                  drawlayer.add(s);
              }
              else 
                if (hide&&(drawlayer.id in s.layers)) {
                  drawlayer.remove(s);
                  layer.add(s);
              }
          }
          v.flag&=~SplineFlags.GHOST;
          if (hide) {
              drawlayer.remove(v);
              layer.add(v);
          }
          else {
            layer.remove(v);
            drawlayer.add(v);
          }
      }
      if (state)
        vd.flag|=SplineFlags.SELECT;
      else 
        vd.flag&=~SplineFlags.SELECT;
      this.pathspline.regen_sort();
    }
    get  _allsplines() {
      return new AllSplineIter(this);
    }
    get  _selected_splines() {
      return new AllSplineIter(this, true);
    }
     sync_vdata_selstate(ctx) {
      for (let k in this.vertex_animdata) {
          let vd=this.vertex_animdata[k];
          if (!vd) {
              continue;
          }
          vd.animflag&=~VDAnimFlags.OWNER_IS_EDITABLE;
      }
      for (let i=0; i<2; i++) {
          let list=i ? this.spline.handles : this.spline.verts;
          for (let v of list.selected.editable(ctx)) {
              let vd=this.vertex_animdata[v.eid];
              if (!vd) {
                  continue;
              }
              vd.animflag|=VDAnimFlags.OWNER_IS_EDITABLE;
          }
      }
    }
     update_visibility() {
      if (_DEBUG.timeChange)
        console.log("update_visibility called");
      if (!this.switch_on_select)
        return ;
      var selectmode=this.selectmode, show_paths=this.draw_anim_paths;
      var drawlayer=this.pathspline.layerset.idmap[this.templayerid];
      if (drawlayer===undefined) {
          console.log("this.templayerid corruption", this.templayerid);
          this.templayerid = this.pathspline.layerset.new_layer().id;
          drawlayer = this.pathspline.layerset.idmap[this.templayerid];
      }
      for (var v of this.pathspline.verts) {
          if (!v.has_layer()) {
              drawlayer.add(v);
          }
          v.sethide(true);
      }
      for (var h of this.pathspline.handles) {
          if (!h.has_layer()) {
              drawlayer.add(h);
          }
          h.sethide(true);
      }
      for (var k in this.vertex_animdata) {
          var vd=this.vertex_animdata[k];
          var v=this.spline.eidmap[k];
          if (vd.dead) {
              delete this.vertex_animdata[k];
              continue;
          }
          if (v===undefined) {
              continue;
          }
          var hide=!(vd.eid in this.spline.eidmap)||!(v.flag&SplineFlags.SELECT);
          hide = hide||!(v.type&selectmode)||!show_paths;
          vd.visible = !hide;
          if (!hide) {
          }
          for (var v2 of vd.verts) {
              if (!hide) {
                  v2.flag&=~(SplineFlags.GHOST|SplineFlags.HIDE);
              }
              else {
                v2.flag|=SplineFlags.GHOST|SplineFlags.HIDE;
              }
              v2.sethide(hide);
              if (!hide) {
                  drawlayer.add(v2);
              }
              else {
                drawlayer.remove(v2);
              }
              for (var s of v2.segments) {
                  s.sethide(hide);
                  if (!hide) {
                      s.flag&=~(SplineFlags.GHOST|SplineFlags.HIDE);
                      drawlayer.add(s);
                  }
                  else {
                    s.flag|=SplineFlags.GHOST|SplineFlags.HIDE;
                    drawlayer.remove(s);
                  }
              }
          }
      }
      this.pathspline.regen_sort();
    }
     on_ctx_update(ctx) {
      console.trace("on_ctx_update");
      if (ctx.spline===this.spline) {
      }
      else 
        if (ctx.spline===this.pathspline) {
          var resolve=0;
          for (var v of this.spline.points) {
              if (v.eid in this.vertex_animdata) {
                  var vdata=this.get_vdata(v.eid, false);
                  v.load(vdata.evaluate(this.time));
                  v.flag&=~SplineFlags.FRAME_DIRTY;
                  v.flag|=SplineFlags.UPDATE;
                  resolve = 1;
              }
          }
          this.spline.resolve = resolve;
      }
    }
     download() {
      console.trace("downloading. . .");
      var resolve=0;
      for (var v of this.spline.points) {
          if (v.eid in this.vertex_animdata) {
              var vdata=this.get_vdata(v.eid, false);
              v.load(vdata.evaluate(this.time));
              v.flag&=~SplineFlags.FRAME_DIRTY;
              v.flag|=SplineFlags.UPDATE;
              resolve = 1;
          }
      }
      this.spline.resolve = resolve;
    }
     update_frame(force_update) {
      this.check_vdata_integrity();
      var time=this.time;
      var spline=this.spline;
      if (spline===undefined)
        return ;
      if (spline.resolve)
        spline.solve();
      this.kcache.set(time, spline);
      var is_first=time<=1;
      var found=false;
      for (var v of spline.points) {
          if (!(v.eid in spline.eidmap)) {
              found = true;
          }
          var dofirst=is_first&&!(v.eid in this.vertex_animdata);
          if (!(force_update||dofirst||(v.flag&SplineFlags.FRAME_DIRTY)))
            continue;
          var vdata=this.get_vdata(v.eid);
          let update=vdata.update(v, time);
          v.flag&=~SplineFlags.FRAME_DIRTY;
          if (update) {
              spline.flagUpdateKeyframes(v);
          }
      }
      if (!found)
        return ;
      this.insert_frame(this.time);
      this.update_visibility();
    }
     insert_frame(time) {
      this.check_vdata_integrity();
      if (this.frame!=undefined)
        return this.frame;
      var frame=this.frame = new SplineFrame();
      var spline=this.spline===undefined ? new Spline() : this.spline.copy();
      spline.verts.select_listeners.addListener(this.on_spline_select, this);
      spline.handles.select_listeners.addListener(this.on_spline_select, this);
      spline.idgen = this.idgen;
      frame.spline = spline;
      frame.time = time;
      this.frames[time] = frame;
      if (this.spline===undefined) {
          this.spline = frame.spline;
          this.frame = frame;
      }
      return frame;
    }
     find_frame(time, off) {
      off = off===undefined ? 0 : off;
      var flist=this.framelist;
      for (var i=0; i<flist.length-1; i++) {
          if (flist[i]<=time&&flist[i+1]>time) {
              break;
          }
      }
      if (i===flist.length)
        return frames[i-1];
      return frames[i];
    }
     change_time(time, _update_animation=true) {
      if (!window.inFromStruct&&_update_animation) {
          this.update_frame();
      }
      var f=this.frames[0];
      for (var v of this.spline.points) {
          var vd=this.get_vdata(v.eid, false);
          if (vd===undefined)
            continue;
          if (v.flag&SplineFlags.SELECT)
            vd.flag|=SplineFlags.SELECT;
          else 
            vd.flag&=~SplineFlags.SELECT;
          if (v.flag&SplineFlags.HIDE)
            vd.flag|=SplineFlags.HIDE;
          else 
            vd.flag&=~SplineFlags.HIDE;
      }
      if (f===undefined) {
          f = this.insert_frame(time);
      }
      var spline=f.spline;
      if (!window.inFromStruct&&_update_animation) {
          for (var v of spline.points) {
              var set_flag=v.eid in this.vertex_animdata;
              var vdata=this.get_vdata(v.eid, false);
              if (vdata===undefined)
                continue;
              if (set_flag) {
                  spline.setselect(v, vdata.flag&SplineFlags.SELECT);
                  if (vdata.flag&SplineFlags.HIDE)
                    v.flag|=SplineFlags.HIDE;
                  else 
                    v.flag&=~SplineFlags.HIDE;
              }
              v.load(vdata.evaluate(time));
              if (0&&set_update) {
                  v.flag|=SplineFlags.UPDATE;
              }
              else {
              }
          }
          var set_update=true;
          if (this.kcache.has(time, spline)) {
              if (_DEBUG.timeChange)
                console.log("found cached k data!");
              this.kcache.load(time, spline);
              set_update = false;
          }
          if (!set_update) {
              for (var seg of spline.segments) {
                  if (seg.hidden)
                    continue;
                  seg.flag|=SplineFlags.REDRAW;
              }
              for (var face of spline.faces) {
                  if (face.hidden)
                    continue;
                  face.flag|=SplineFlags.REDRAW;
              }
          }
          else {
            for (let v of spline.points) {
                v.flag|=SplineFlags.UPDATE;
            }
          }
          spline.resolve = 1;
          if (!window.inFromStruct)
            spline.solve();
      }
      for (var s of spline.segments) {
          if (s.hidden)
            continue;
          s.flag|=SplineFlags.UPDATE_AABB;
      }
      for (var f of spline.segments) {
          if (f.hidden)
            continue;
          f.flag|=SplineFlags.UPDATE_AABB;
      }
      this.spline = spline;
      this.time = time;
      this.frame = f;
      this.update_visibility();
    }
     delete_vdata() {
      this.vertex_animdata = {};
    }
     get_vdata(eid, auto_create=true) {
      if (typeof eid!="number") {
          throw new Error("Expected a number for eid");
      }
      if (auto_create&&!(eid in this.vertex_animdata)) {
          this.vertex_animdata[eid] = new VertexAnimData(eid, this.pathspline);
      }
      return this.vertex_animdata[eid];
    }
     check_vdata_integrity(veid) {
      var spline=this.pathspline;
      var found=false;
      if (veid===undefined) {
          this.check_paths();
          for (var k in this.vertex_animdata) {
              var vd=this.vertex_animdata[k];
              found|=vd.check_time_integrity();
          }
      }
      else {
        var vd=this.vertex_animdata[veid];
        if (vd===undefined) {
            console.log("Error: vertex ", veid, "not in frameset");
            return false;
        }
        found = vd.check_time_integrity();
      }
      if (found) {
          this.rationalize_vdata_layers();
          this.update_visibility();
          this.pathspline.regen_solve();
          window.redraw_viewport();
      }
      return found;
    }
     check_paths() {
      let update=false;
      for (var k in this.vertex_animdata) {
          var vd=this.vertex_animdata[k];
          if (vd.dead||!vd.startv) {
              delete this.vertex_animdata[k];
              update = true;
          }
      }
      if (update) {
          console.warn("pathspline update");
          this.rationalize_vdata_layers();
          this.update_visibility();
          this.pathspline.regen_render();
          this.pathspline.regen_sort();
          this.pathspline.regen_solve();
          window.redraw_viewport();
      }
      return update;
    }
     rationalize_vdata_layers() {
      this.fix_anim_paths();
      var spline=this.pathspline;
      spline.layerset = new SplineLayerSet();
      var templayer=spline.layerset.new_layer();
      this.templayerid = templayer.id;
      spline.layerset.active = templayer;
      for (var i=0; i<spline.elists.length; i++) {
          var list=spline.elists[i];
          list.layerset = spline.layerset;
          for (var e of list) {
              e.layers = {};
          }
      }
      for (var k in this.vertex_animdata) {
          var vd=this.vertex_animdata[k];
          var vlayer=spline.layerset.new_layer();
          vlayer.flag|=SplineLayerFlags.HIDE;
          vd.layerid = vlayer.id;
          for (var v of vd.verts) {
              for (var i=0; i<v.segments.length; i++) {
                  vlayer.add(v.segments[i]);
              }
              vlayer.add(v);
          }
      }
    }
     draw(ctx, g, editor, matrix, redraw_rects, ignore_layers) {
      var size=editor.size, pos=editor.pos;
      this.draw_anim_paths = editor.draw_anim_paths;
      this.selectmode = editor.selectmode;
      g.save();
      let dpi=window.devicePixelRatio;
      let promise=this.spline.draw(redraw_rects, g, editor, matrix, editor.selectmode, editor.only_render, editor.draw_normals, this.spline===ctx.spline ? 1.0 : 0.3, undefined, undefined, ignore_layers);
      g.restore();
      return promise;
    }
     loadSTRUCT(reader) {
      window.inFromStruct = true;
      reader(this);
      super.loadSTRUCT(reader);
      this.kcache = new SplineKCache();
      if (this.kcache===undefined) {
          this.kcache = new SplineKCache();
      }
      this.afterSTRUCT();
      if (this.pathspline===undefined) {
          this.pathspline = this.make_pathspline();
      }
      for (v of this.pathspline.verts) {

      }
      for (var h of this.pathspline.handles) {

      }
      for (var vd of this.vertex_animdata) {
          vd.spline = this.pathspline;
          if (vd.layerid===undefined) {
              var layer=this.pathspline.layerset.new_layer();
              layer.flag|=SplineLayerFlags.HIDE;
              vd.layerid = layer.id;
              if (vd.startv_eid!=undefined) {
                  var v=this.pathspline.eidmap[vd.startv_eid];
                  var s=v.segments[0];
                  v.layers = {};
                  v.layers[vd.layerid] = 1;
                  var _c1=0;
                  while (v.segments.length>0) {
                    v.layers = {};
                    v.layers[vd.layerid] = 1;
                    s.layers = {};
                    s.layers[vd.layerid] = 1;
                    v = s.other_vert(v);
                    if (v.segments.length<2) {
                        v.layers = {};
                        v.layers[vd.layerid] = 1;
                        break;
                    }
                    if (_c1++>100000) {
                        console.log("Infinite loop detected!");
                        break;
                    }
                    s = v.other_segment(s);
                    s.layers = {};
                    s.layers[vd.layerid] = 1;
                    if (v===vd.startv)
                      break;
                  }
              }
          }
      }
      this.pathspline.is_anim_path = true;
      if (this.templayerid===undefined)
        this.templayerid = this.pathspline.layerset.new_layer().id;
      var frames={};
      var vert_animdata={};
      var max_cur=this.idgen.cur_id;
      var firstframe=undefined;
      for (var i=0; i<this.frames.length; i++) {
          max_cur = Math.max(this.frames[i].spline.idgen.cur_id, max_cur);
          if (i===0)
            firstframe = this.frames[i];
          this.frames[i].spline.idgen = this.idgen;
          frames[this.frames[i].time] = this.frames[i];
      }
      this.idgen.max_cur(max_cur);
      for (var i=0; i<this.vertex_animdata.length; i++) {
          vert_animdata[this.vertex_animdata[i].eid] = this.vertex_animdata[i];
      }
      for (let k in vert_animdata) {
          let vd=vert_animdata[k];
          for (let v of vd.verts) {
              vd._get_animdata(v).owning_veid = vd.eid;
          }
      }
      this.frames = frames;
      this.pathspline.regen_sort();
      var fk=this.cur_frame||0;
      delete this.cur_frame;
      if (fk===undefined) {
          this.frame = firstframe;
          this.spline = firstframe.spline;
      }
      else {
        this.frame = this.frames[fk];
        this.spline = this.frames[fk].spline;
      }
      this.vertex_animdata = vert_animdata;
      if (this.framelist.length===0) {
          for (var k in this.frames) {
              this.framelist.push(parseFloat(k));
          }
      }
      for (k in this.frames) {
          this.frames[k].spline.verts.select_listeners.addListener(this.on_spline_select, this);
          this.frames[k].spline.handles.select_listeners.addListener(this.on_spline_select, this);
      }
      this.spline.fix_spline();
      this.rationalize_vdata_layers();
      this.update_visibility();
      window.inFromStruct = false;
    }
     make_pathspline() {
      var spline=new Spline();
      spline.is_anim_path = true;
      spline.restrict = restrictflags;
      spline.verts.cdata.add_layer(TimeDataLayer, "time data");
      return spline;
    }
  }
  _ESClass.register(SplineFrameSet);
  _es6_module.add_class(SplineFrameSet);
  SplineFrameSet = _es6_module.add_export('SplineFrameSet', SplineFrameSet);
  
  SplineFrameSet.STRUCT = STRUCT.inherit(SplineFrameSet, DataBlock)+`
    idgen             : SDIDGen;
    frames            : array(SplineFrame) | obj_values_to_array(obj.frames);
    vertex_animdata   : array(VertexAnimData) | obj_values_to_array(obj.vertex_animdata);
    
    cur_frame         : float | obj.frame.time;
    editmode          : string;
    editveid          : int;
    
    time              : float;
    framelist         : array(float);
    pathspline        : Spline;
    
    selectmode        : int;
    draw_anim_paths   : int;
    templayerid       : int;
}
`;
}, '/dev/fairmotion/src/core/frameset.js');
es6_module_define('ops_editor', ["../../path.ux/scripts/core/ui_base.js", "../editor_base.js", "../../path.ux/scripts/screen/ScreenArea.js", "../../core/struct.js"], function _ops_editor_module(_es6_module) {
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  class OpStackEditor extends Editor {
     constructor() {
      super();
      this._last_toolstack_hash = "";
    }
     rebuild() {
      let ctx=this.ctx;
      this.frame.clear();
      let stack=ctx.toolstack;
      let frame=this.frame;
      for (let i=0; i<stack.undostack.length; i++) {
          let tool=stack.undostack[i];
          let cls=tool.constructor;
          let name;
          if (cls.tooldef) {
              name = cls.tooldef().uiname;
          }
          if (!name) {
              name = tool.uiname||tool.name||cls.name||"(error)";
          }
          let panel=frame.panel(name);
          for (let k in tool.inputs) {
              let path=`operator_stack[${i}].${k}`;
              try {
                panel.prop(path);
              }
              catch (error) {
                  print_stack(error);
                  continue;
              }
          }
          panel.closed = true;
      }
    }
     update() {
      let ctx=this.ctx;
      if (!ctx||!ctx.toolstack) {
          return ;
      }
      let stack=ctx.toolstack;
      let key=""+stack.undostack.length+":"+stack.cur;
      if (key!==this._last_toolstack_hash) {
          this._last_toolstack_hash = key;
          this.rebuild();
      }
    }
     init() {
      super.init();
      this.frame = this.container.col();
    }
    static  define() {
      return {tagname: "opstack-editor-x", 
     areaname: "opstack_editor", 
     uiname: "Operator Stack", 
     hidden: true}
    }
     copy() {
      return document.createElement("opstack-editor-x");
    }
  }
  _ESClass.register(OpStackEditor);
  _es6_module.add_class(OpStackEditor);
  OpStackEditor = _es6_module.add_export('OpStackEditor', OpStackEditor);
  OpStackEditor.STRUCT = STRUCT.inherit(OpStackEditor, Area)+`
}
`;
  Editor.register(OpStackEditor);
}, '/dev/fairmotion/src/editors/ops/ops_editor.js');
es6_module_define('SettingsEditor', ["../../path.ux/scripts/core/ui_theme.js", "../../path.ux/scripts/screen/ScreenArea.js", "../../path.ux/scripts/core/ui.js", "../editor_base.js", "../../core/struct.js", "../../path.ux/scripts/core/ui_base.js"], function _SettingsEditor_module(_es6_module) {
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var theme=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'theme');
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  var Container=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui.js', 'Container');
  var color2css=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_theme.js', 'color2css');
  var css2color=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_theme.js', 'css2color');
  var CSSFont=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_theme.js', 'CSSFont');
  let basic_colors={'white': [1, 1, 1], 
   'grey': [0.5, 0.5, 0.5], 
   'gray': [0.5, 0.5, 0.5], 
   'black': [0, 0, 0], 
   'red': [1, 0, 0], 
   'yellow': [1, 1, 0], 
   'green': [0, 1, 0], 
   'teal': [0, 1, 1], 
   'cyan': [0, 1, 1], 
   'blue': [0, 0, 1], 
   'orange': [1, 0.5, 0.25], 
   'brown': [0.5, 0.4, 0.3], 
   'purple': [1, 0, 1], 
   'pink': [1, 0.5, 0.5]}
  class ThemeEditor extends Container {
     constructor() {
      super();
    }
     init() {
      super.init();
      this.build();
    }
     doFolder(key, obj) {
      let panel=this.panel(key);
      panel.closed = true;
      panel.style["margin-left"] = "15px";
      let row=panel.row();
      let col1=row.col();
      let col2=row.col();
      let do_onchange=(key, k) =>        {
        if (this.onchange) {
            this.onchange(key, k);
        }
      };
      let ok=false;
      let _i=0;
      let dokey=(k, v) =>        {
        let col=_i%2==0 ? col1 : col2;
        if (k.toLowerCase().search("flag")>=0) {
            return ;
        }
        if (typeof v==="string") {
            let v2=v.toLowerCase().trim();
            let iscolor=v2 in basic_colors;
            iscolor = iscolor||v2.search("rgb")>=0;
            iscolor = iscolor||v2[0]==="#";
            if (iscolor) {
                let cw=col.colorbutton();
                ok = true;
                _i++;
                try {
                  cw.setRGBA(css2color(v2));
                }
                catch (error) {
                    console.warn("Failed to set color "+k, v2);
                }
                cw.onchange = () =>                  {
                  console.log("setting '"+k+"' to "+color2css(cw.rgba), key);
                  theme[key][k] = color2css(cw.rgba);
                  do_onchange(key, k);
                };
                cw.label = k;
            }
        }
        else 
          if (typeof v==="number") {
            let slider=col.slider(undefined, k, v, 0, 256, 0.01, false);
            ok = true;
            _i++;
            slider.onchange = () =>              {
              theme[key][k] = slider.value;
              do_onchange(key, k);
            };
        }
        else 
          if (typeof v==="object"&&__instance_of(v, CSSFont)) {
            let panel2=col.panel(k);
            ok = true;
            _i++;
            let textbox=(key) =>              {
              panel2.label(key);
              panel2.textbox(undefined, v[key]).onchange = function () {
                v[key] = this.text;
                do_onchange(key, k);
              }
            };
            textbox("font");
            textbox("variant");
            textbox("weight");
            textbox("style");
            let cw=panel2.colorbutton();
            cw.label = "color";
            cw.setRGBA(css2color(v));
            cw.onchange = () =>              {
              v.color = color2css(v.color);
            };
            let slider=panel2.slider(undefined, "size", v.size);
            slider.onchange = () =>              {
              v.size = slider.value;
              do_onchange(key, k);
            };
        }
      };
      for (let k in obj) {
          let v=obj[k];
          dokey(k, v);
      }
      if (!ok) {
          panel.remove();
      }
    }
     build() {
      let keys=Object.keys(theme);
      keys.sort();
      for (let k of keys) {
          let v=theme[k];
          if (typeof v==="object") {
              this.doFolder(k, v);
          }
      }
    }
    static  define() {
      return {tagname: "theme-editor-2-x", 
     style: "theme-editor"}
    }
  }
  _ESClass.register(ThemeEditor);
  _es6_module.add_class(ThemeEditor);
  ThemeEditor = _es6_module.add_export('ThemeEditor', ThemeEditor);
  UIBase.register(ThemeEditor);
  class SettingsEditor extends Editor {
     constructor() {
      super();
    }
     init() {
      super.init();
      let col=this.container.col();
      let tabs=col.tabs("left");
      let tab;
      tab = tabs.tab("General");
      let panel=tab.panel("Units");
      panel.prop("settings.unit_scheme");
      panel.prop("settings.default_unit");
      tab = tabs.tab("Theme");
      this.style["overflow-y"] = "scroll";
      let th=document.createElement("theme-editor-x");
      th.onchange = () =>        {
        console.log("settings change");
        g_app_state.settings.save();
      };
      let row=tab.row();
      row.button("Reload Defaults", () =>        {
        g_app_state.settings.reloadDefaultTheme();
        g_app_state.settings.save();
        th.remove();
        th = document.createElement("theme-editor-x");
        tab.add(th);
      });
      tab.add(th);
      window.th = th;
    }
    static  define() {
      return {tagname: "settings-editor-x", 
     areaname: "settings_editor", 
     uiname: "Settings", 
     icon: Icons.SETTINGS_EDITOR}
    }
     copy() {
      return document.createElement("settings-editor-x");
    }
  }
  _ESClass.register(SettingsEditor);
  _es6_module.add_class(SettingsEditor);
  SettingsEditor = _es6_module.add_export('SettingsEditor', SettingsEditor);
  SettingsEditor.STRUCT = STRUCT.inherit(SettingsEditor, Area)+`
}
`;
  Editor.register(SettingsEditor);
}, '/dev/fairmotion/src/editors/settings/SettingsEditor.js');
