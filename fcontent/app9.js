var ContextStruct;
es6_module_define('data_api_define', ["../lib_api.js", "../units.js", "../imageblock.js", "../../curve/spline_element_array.js", "../toolprops.js", "../../curve/spline_base.js", "../../editors/dopesheet/DopeSheetEditor.js", "../UserSettings.js", "../../editors/curve/CurveEditor.js", "../../editors/viewport/toolmodes/toolmode.js", "../../editors/viewport/selectmode.js", "../../scene/sceneobject.js", "./data_api.js", "../../editors/viewport/view2d.js", "../toolops_api.js", "../../editors/ops/ops_editor.js", "../../curve/spline_types.js", "../context.js", "../../editors/viewport/view2d_base.js", "../animdata.js", "../../editors/settings/SettingsEditor.js", "../../editors/viewport/spline_createops.js", "../../path.ux/scripts/pathux.js", "../frameset.js"], function _data_api_define_module(_es6_module) {
  var DataTypes=es6_import_item(_es6_module, '../lib_api.js', 'DataTypes');
  var View2DHandler=es6_import_item(_es6_module, '../../editors/viewport/view2d.js', 'View2DHandler');
  var EditModes=es6_import_item(_es6_module, '../../editors/viewport/view2d_base.js', 'EditModes');
  var SessionFlags=es6_import_item(_es6_module, '../../editors/viewport/view2d_base.js', 'SessionFlags');
  var ImageFlags=es6_import_item(_es6_module, '../imageblock.js', 'ImageFlags');
  var Image=es6_import_item(_es6_module, '../imageblock.js', 'Image');
  var ImageUser=es6_import_item(_es6_module, '../imageblock.js', 'ImageUser');
  var AppSettings=es6_import_item(_es6_module, '../UserSettings.js', 'AppSettings');
  var FullContext=es6_import_item(_es6_module, '../context.js', 'FullContext');
  var toolmode=es6_import(_es6_module, '../../editors/viewport/toolmodes/toolmode.js');
  var EnumProperty=es6_import_item(_es6_module, '../toolprops.js', 'EnumProperty');
  var FlagProperty=es6_import_item(_es6_module, '../toolprops.js', 'FlagProperty');
  var FloatProperty=es6_import_item(_es6_module, '../toolprops.js', 'FloatProperty');
  var StringProperty=es6_import_item(_es6_module, '../toolprops.js', 'StringProperty');
  var BoolProperty=es6_import_item(_es6_module, '../toolprops.js', 'BoolProperty');
  var Vec2Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec2Property');
  var DataRefProperty=es6_import_item(_es6_module, '../toolprops.js', 'DataRefProperty');
  var Vec3Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec4Property');
  var IntProperty=es6_import_item(_es6_module, '../toolprops.js', 'IntProperty');
  var TPropFlags=es6_import_item(_es6_module, '../toolprops.js', 'TPropFlags');
  var PropTypes=es6_import_item(_es6_module, '../toolprops.js', 'PropTypes');
  var PropSubTypes=es6_import_item(_es6_module, '../toolprops.js', 'PropSubTypes');
  var ModalStates=es6_import_item(_es6_module, '../toolops_api.js', 'ModalStates');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_base.js', 'SplineFlags');
  var MaterialFlags=es6_import_item(_es6_module, '../../curve/spline_base.js', 'MaterialFlags');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_base.js', 'SplineTypes');
  var SelMask=es6_import_item(_es6_module, '../../editors/viewport/selectmode.js', 'SelMask');
  var ToolModes=es6_import_item(_es6_module, '../../editors/viewport/selectmode.js', 'ToolModes');
  var Unit=es6_import_item(_es6_module, '../units.js', 'Unit');
  var ExtrudeModes=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'ExtrudeModes');
  var DataFlags=es6_import_item(_es6_module, './data_api.js', 'DataFlags');
  var DataPathTypes=es6_import_item(_es6_module, './data_api.js', 'DataPathTypes');
  var OpStackEditor=es6_import_item(_es6_module, '../../editors/ops/ops_editor.js', 'OpStackEditor');
  var AnimKeyFlags=es6_import_item(_es6_module, '../animdata.js', 'AnimKeyFlags');
  var AnimInterpModes=es6_import_item(_es6_module, '../animdata.js', 'AnimInterpModes');
  var AnimKey=es6_import_item(_es6_module, '../animdata.js', 'AnimKey');
  var VDAnimFlags=es6_import_item(_es6_module, '../frameset.js', 'VDAnimFlags');
  var ExtrudeModes=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'ExtrudeModes');
  var SplineLayerFlags=es6_import_item(_es6_module, '../../curve/spline_element_array.js', 'SplineLayerFlags');
  var Material=es6_import_item(_es6_module, '../../curve/spline_types.js', 'Material');
  var SplineFace=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFace');
  var SplineSegment=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineSegment');
  var SplineVertex=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineVertex');
  var CurveEditor=es6_import_item(_es6_module, '../../editors/curve/CurveEditor.js', 'CurveEditor');
  var SceneObject=es6_import_item(_es6_module, '../../scene/sceneobject.js', 'SceneObject');
  var DopeSheetEditor=es6_import_item(_es6_module, '../../editors/dopesheet/DopeSheetEditor.js', 'DopeSheetEditor');
  var SettingsEditor=es6_import_item(_es6_module, '../../editors/settings/SettingsEditor.js', 'SettingsEditor');
  var SelModes={VERTEX: SelMask.VERTEX, 
   SEGMENT: SelMask.SEGMENT, 
   FACE: SelMask.FACE, 
   OBJECT: SelMask.OBJECT}
  var selmask_enum=new EnumProperty(undefined, SelModes, "selmask_enum", "Selection Mode");
  selmask_enum = _es6_module.add_export('selmask_enum', selmask_enum);
  var selmask_ui_vals={}
  for (var k in SelModes) {
      var s=k[0].toUpperCase()+k.slice(1, k.length).toLowerCase();
      var slst=s.split("_");
      var s2="";
      for (var i=0; i<slst.length; i++) {
          s2+=slst[i][0].toUpperCase()+slst[i].slice(1, slst[i].length).toLowerCase()+" ";
      }
      s = s2.trim();
      selmask_ui_vals[k] = s;
  }
  selmask_enum.flag|=TPropFlags.USE_CUSTOM_GETSET|TPropFlags.NEEDS_OWNING_OBJECT;
  selmask_enum.ui_value_names = selmask_ui_vals;
  selmask_enum.add_icons({VERTEX: Icons.VERT_MODE, 
   SEGMENT: Icons.EDGE_MODE, 
   FACE: Icons.FACE_MODE, 
   OBJECT: Icons.OBJECT_MODE});
  selmask_enum.userGetData = function (prop, val, val2) {
    return this.selectmode&(~SelMask.HANDLE);
  }
  selmask_enum.userSetData = function (prop, val) {
    console.log("selmask_enum.userSetData", this, prop, val);
    this.selectmode = val|(this.selectmode&SelMask.HANDLE);
    return this.selectmode;
  }
  var data_api=es6_import(_es6_module, './data_api.js');
  var PropFlags=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'PropFlags');
  var DataPath=data_api.DataPath;
  var DataStruct=data_api.DataStruct;
  var DataStructArray=data_api.DataStructArray;
  var units=Unit.units;
  var unit_enum={}
  var unit_ui_vals={}
  for (var i=0; i<units.length; i++) {
      var s=units[i].suffix_list[0];
      unit_enum[s] = s;
      unit_ui_vals[s] = s;
  }
  Unit.units_enum = new EnumProperty("in", unit_enum, "unit_enum", "Units");
  Unit.units_enum.ui_value_names = unit_ui_vals;
  var SettingsUpdate=function () {
    g_app_state.session.settings.save();
  }
  var SettingsUpdateRecalc=function () {
    g_app_state.session.settings.save();
  }
  var SettingsStruct=undefined;
  function api_define_settings() {
    unitsys_enum = new EnumProperty("imperial", ["imperial", "metric"], "system", "System", "Metric or Imperial");
    var units_enum=Unit.units_enum.copy();
    units_enum.apiname = "default_unit";
    units_enum.uiname = "Default Unit";
    units_enum.update = unitsys_enum.update = SettingsUpdateRecalc;
    SettingsStruct = new DataStruct([new DataPath(unitsys_enum, "unit_system", "unit_scheme", true), new DataPath(units_enum, "default_unit", "unit", true)], AppSettings);
    return SettingsStruct;
  }
  var SettingsEditorStruct=undefined;
  function api_define_seditor() {
    SettingsEditorStruct = new DataStruct([], SettingsEditor);
    return SettingsEditorStruct;
  }
  var OpsEditorStruct=undefined;
  function api_define_opseditor() {
    var filter_sel=new BoolProperty(0, "filter_sel", "Filter Sel", "Exclude selection ops");
    filter_sel.icon = Icons.FILTER_SEL_OPS;
    OpsEditorStruct = new DataStruct([new DataPath(filter_sel, "filter_sel", "filter_sel", true)], OpStackEditor);
    return OpsEditorStruct;
  }
  var AnimKeyStruct=undefined;
  function api_define_animkey() {
    if (AnimKeyStruct!=undefined)
      return AnimKeyStruct;
    AnimKeyStruct = new DataStruct([new DataPath(new IntProperty(-1, "id", "id"), "id", "id", true)], AnimKey);
    return AnimKeyStruct;
  }
  api_define_animkey();
  window.AnimKeyStruct = AnimKeyStruct;
  window.AnimKeyStruct2 = AnimKeyStruct;
  var datablock_structs={}
  var spline_flagprop=new FlagProperty(2, SplineFlags, undefined, "Flags", "Flags");
  spline_flagprop["BREAK_CURVATURES"] = "Less Smooth";
  spline_flagprop.descriptions["BREAK_CURVATURES"] = "Allows curve to more tightly bend at this point";
  spline_flagprop.ui_key_names["BREAK_TANGENTS"] = "Sharp Corner";
  spline_flagprop.addIcons({BREAK_TANGENTS: Icons.EXTRUDE_MODE_G0, 
   BREAK_CURVATURES: Icons.EXTRUDE_MODE_G1});
  function api_define_DataBlock() {
    api_define_animkey();
    var array=new DataStructArray(function getstruct(item) {
      return AnimKeyStruct2;
    }, function itempath(key) {
      return "["+key+"]";
    }, function getitem(key) {
      console.log("get key", key, this);
      return this[key];
    }, function getiter() {
      return new obj_value_iter(this);
    }, function getkeyiter() {
      return new obj_key_iter(this);
    }, function getlength() {
      var tot=0.0;
      for (var k in this) {
          tot++;
      }
      return tot;
    });
    return [new DataPath(array, "animkeys", "lib_anim_idmap", true)];
  }
  var ImageUserStruct=undefined;
  function api_define_imageuser() {
    var image=new DataRefProperty(undefined, [DataTypes.IMAGE], "image", "Image");
    var off=new Vec2Property(undefined, "offset", "Offset");
    var scale=new Vec2Property(undefined, "scale", "Scale");
    scale.range = [0.0001, 90.0];
    off.api_update = scale.api_update = function api_update(ctx, path) {
      window.redraw_viewport();
    }
    ImageUserStruct = new DataStruct([new DataPath(image, "image", "image", true), new DataPath(off, "off", "off", true), new DataPath(scale, "scale", "scale", true)], ImageUser);
    return ImageUserStruct;
  }
  function api_define_view2d() {
    var half_pix_size=new BoolProperty(0, "half_pix_size", "half_pix_size", "Half Resolution (faster)");
    half_pix_size.icon = Icons.HALF_PIXEL_SIZE;
    var only_render=new BoolProperty(0, "only_render", "Hide Controls", "Hide Controls");
    only_render.api_update = function (ctx, path) {
      window.redraw_viewport();
    }
    only_render.icon = Icons.ONLY_RENDER;
    var draw_small_verts=new BoolProperty(0, "draw_small_verts", "Small Points", "Small Control Points");
    draw_small_verts.api_update = function (ctx, path) {
      window.redraw_viewport();
    }
    draw_small_verts.icon = Icons.DRAW_SMALL_VERTS;
    var extrude_mode=new EnumProperty(0, ExtrudeModes, "extrude_mode", "New Line Mode", "New Line Mode");
    extrude_mode.add_icons({SMOOTH: Icons.EXTRUDE_MODE_G2, 
    LESS_SMOOTH: Icons.EXTRUDE_MODE_G1, 
    BROKEN: Icons.EXTRUDE_MODE_G0});
    for (let k in ExtrudeModes) {
        extrude_mode.descriptions[k] = extrude_mode.description;
    }
    var linewidth=new FloatProperty(2.0, "default_linewidth", "Line Wid");
    linewidth.range = [0.01, 100];
    var zoomprop=new FloatProperty(1, "zoom", "Zoom");
    zoomprop.update = function (ctx, path) {
      this.ctx.view2d.set_zoom(this.data);
    }
    zoomprop.range = zoomprop.real_range = zoomprop.ui_range = [0.1, 100];
    zoomprop.expRate = 1.2;
    zoomprop.step = 0.1;
    zoomprop.decimalPlaces = 3;
    var draw_bg_image=new BoolProperty(0, "draw_bg_image", "Draw Image");
    var draw_video=new BoolProperty(0, "draw_video", "Draw Video");
    draw_video.update = draw_bg_image.update = function () {
      window.redraw_viewport();
    }
    var tool_mode=new EnumProperty("SELECT", ToolModes, "select", "Active Tool", "Active Tool");
    tool_mode.add_icons({SELECT: Icons.CURSOR_ARROW, 
    APPEND: Icons.APPEND_VERTEX, 
    RESIZE: Icons.RESIZE, 
    ROTATE: Icons.ROTATE, 
    PEN: Icons.PEN_TOOL});
    var tweak_mode=new BoolProperty(0, "tweak_mode", "Tweak Mode");
    tweak_mode.icon = Icons.CURSOR_ARROW;
    var uinames={}
    for (var key in SelMask) {
        var k2=key[0].toUpperCase()+key.slice(1, key.length).toLowerCase();
        k2 = k2.replace(/\_/g, " ");
        uinames[key] = "Show "+k2+"s";
    }
    var selmask_mask=new FlagProperty(1, SelMask, uinames, undefined, "Sel Mask");
    selmask_mask.addIcons({VERTEX: Icons.VERT_MODE, 
    HANDLE: Icons.SHOW_HANDLES, 
    SEGMENT: Icons.EDGE_MODE, 
    FACE: Icons.FACE_MODE, 
    OBJECT: Icons.OBJECT_MODE});
    selmask_mask.ui_key_names = uinames;
    selmask_mask.update = function () {
      window.redraw_viewport();
    }
    var background_color=new Vec3Property(undefined, "background_color", "Background");
    background_color.subtype = PropSubTypes.COLOR;
    var default_stroke=new Vec4Property(undefined, "default_stroke", "Stroke");
    var default_fill=new Vec4Property(undefined, "default_fill", "Fill");
    default_stroke.subtype = default_fill.subtype = PropSubTypes.COLOR;
    background_color.update = function () {
      window.redraw_viewport();
    }
    let draw_faces=new BoolProperty(0, "draw_faces", "Show Faces");
    draw_faces.icon = Icons.MAKE_POLYGON;
    let enable_blur=new BoolProperty(0, "enable_blur", "Blur");
    enable_blur.icon = Icons.ENABLE_BLUR;
    draw_faces.update = enable_blur.update = function () {
      this.ctx.spline.regen_sort();
      redraw_viewport();
    }
    let edit_all_layers=new BoolProperty(0, "edit_all_layers", "Edit All Layers");
    let show_animpath_prop=new BoolProperty(0, "draw_anim_paths", "Show Animation Paths", "Edit Animation Keyframe Paths");
    show_animpath_prop.icon = Icons.SHOW_ANIMPATHS;
    let draw_normals=new BoolProperty(0, "draw_normals", "Show Normals", "Show Normal Comb");
    draw_normals.icon = Icons.DRAW_NORMALS;
    draw_normals.update = edit_all_layers.update = function () {
      redraw_viewport();
    }
    let sessionflags=new FlagProperty(undefined, SessionFlags, "session_flag", "Session Flags");
    sessionflags.addIcons({PROP_TRANSFORM: Icons.PROP_TRANSFORM});
    let proprad=new FloatProperty(0, "propradius", "Magnet Radius", "Magnet Radius");
    proprad.baseUnit = proprad.displayUnit = "none";
    proprad.range = [0.1, 1024];
    proprad.expRate = 1.75;
    proprad.step = 0.5;
    proprad.decimalPlaces = 2;
    proprad.flag&=~PropFlags.SIMPLE_SLIDER;
    proprad.flag|=PropFlags.FORCE_ROLLER_SLIDER;
    window.View2DStruct = new DataStruct([new DataPath(proprad, "propradius", "propradius", true), new DataPath(edit_all_layers, "edit_all_layers", "edit_all_layers", true), new DataPath(half_pix_size, "half_pix_size", "half_pix_size", true), new DataPath(background_color, "background_color", "background_color", true), new DataPath(default_stroke, "default_stroke", "default_stroke", true), new DataPath(default_fill, "default_fill", "default_fill", true), new DataPath(tool_mode, "toolmode", "toolmode", true), new DataPath(draw_small_verts, "draw_small_verts", "draw_small_verts", true), new DataPath(selmask_enum.copy(), "selectmode", "selectmode", true), new DataPath(selmask_mask.copy(), "selectmask", "selectmode", true), new DataPath(only_render, "only_render", "only_render", true), new DataPath(draw_bg_image, "draw_bg_image", "draw_bg_image", true), new DataPath(sessionflags, "session_flag", "session_flag", true), new DataPath(tweak_mode, "tweak_mode", "tweak_mode", true), new DataPath(enable_blur, "enable_blur", "enable_blur", true), new DataPath(draw_faces, "draw_faces", "draw_faces", true), new DataPath(draw_video, "draw_video", "draw_video", true), new DataPath(draw_normals, "draw_normals", "draw_normals", true), new DataPath(show_animpath_prop, "draw_anim_paths", "draw_anim_paths", true), new DataPath(zoomprop, "zoom", "zoom", true), new DataPath(api_define_material(), "active_material", "active_material", true), new DataPath(linewidth, "default_linewidth", "default_linewidth", true), new DataPath(extrude_mode, "extrude_mode", "extrude_mode", true), new DataPath(new BoolProperty(0, "pin_paths", "Pin Paths", "Remember visible animation paths"), "pin_paths", "pin_paths", true), new DataPath(api_define_imageuser(), "background_image", "background_image", true)], View2DHandler);
    return View2DStruct;
  }
  var MaterialStruct;
  function api_define_material() {
    var fillclr=new Vec4Property(new Vector4(), "fill", "fill", "Fill Color");
    var strokeclr=new Vec4Property(new Vector4(), "stroke", "stroke", "Stroke Color");
    var update_base=function (material) {
      material.update();
      window.redraw_viewport();
    }
    var flag=new FlagProperty(1, MaterialFlags, undefined, "material flags", "material flags");
    flag.update = update_base;
    var fillpath=new DataPath(new BoolProperty(false, "fill_over_stroke", "fill_over_stroke", "fill_over_stroke"), "fill_over_stroke", "fill_over_stroke", true);
    fillclr.subtype = strokeclr.subtype = PropSubTypes.COLOR;
    var linewidth=new FloatProperty(1, "linewidth", "linewidth", "Line Width");
    linewidth.range = [0.1, 200];
    linewidth.expRate = 1.75;
    linewidth.step = 0.25;
    var linewidth2=new FloatProperty(1, "linewidth2", "linewidth2", "Double Stroke Width");
    linewidth2.range = [0.0, 200];
    linewidth2.expRate = 1.75;
    linewidth2.step = 0.25;
    fillclr.update = strokeclr.update = linewidth.update = linewidth2.update = blur.update = update_base;
    MaterialStruct = new DataStruct([new DataPath(fillclr, "fillcolor", "fillcolor", true), new DataPath(linewidth, "linewidth", "linewidth", true), new DataPath(linewidth2, "linewidth2", "linewidth2", true), new DataPath(flag, "flag", "flag", true)], Material);
    MaterialStruct.Color4("strokecolor", "strokecolor", "Stroke", "Stroke color").OnUpdate(update_base);
    MaterialStruct.Float("blur", "blur", "Blur", "Amount of blur").Range(0, 800).Step(0.5).OnUpdate(update_base);
    MaterialStruct.Color4("strokecolor2", "strokecolor2", "Double Stroke", "Stroke color").OnUpdate(update_base);
    return MaterialStruct;
  }
  var SplineFaceStruct;
  function api_define_spline_face() {
    let flagprop=spline_flagprop.copy();
    SplineFaceStruct = new DataStruct([new DataPath(new IntProperty(0, "eid", "eid", "eid"), "eid", "eid", true), new DataPath(api_define_material(), "mat", "mat", true), new DataPath(flagprop, "flag", "flag", true)], SplineFace);
    return SplineFaceStruct;
  }
  var SplineVertexStruct;
  function api_define_spline_vertex() {
    var coprop=new Vec3Property(undefined, "co", "Co", "Coordinates");
    let flagprop=spline_flagprop.copy();
    flagprop.update = function (owner) {
      this.ctx.spline.regen_sort();
      if (owner!==undefined) {
          owner.flag|=SplineFlags.UPDATE;
      }
      this.ctx.spline.propagate_update_flags();
      this.ctx.spline.resolve = 1;
      window.redraw_viewport();
    }
    let width=new FloatProperty(0, "width", "width", "Width");
    width.baseUnit = width.displayUnit = "none";
    let shift=new FloatProperty(0, "shift", "shift", "Shift");
    shift.baseUnit = shift.displayUnit = "none";
    width.setRange(-50, 200.0);
    width.update = function (vert) {
      vert.flag|=SplineFlags.REDRAW;
      window.redraw_viewport();
    }
    shift.setRange(-2.0, 2.0);
    shift.update = function (vert) {
      vert.flag|=SplineFlags.REDRAW;
      window.redraw_viewport();
    }
    SplineVertexStruct = new DataStruct([new DataPath(new IntProperty(0, "eid", "eid", "eid"), "eid", "eid", true), new DataPath(flagprop, "flag", "flag", true), new DataPath(coprop, "co", "", true), new DataPath(width, "width", "width", true), new DataPath(shift, "shift", "shift", true)], SplineVertex);
    return SplineVertexStruct;
  }
  var SplineSegmentStruct;
  function api_define_spline_segment() {
    let flagprop=spline_flagprop.copy();
    flagprop.update = function (segment) {
      new Context().spline.regen_sort();
      segment.flag|=SplineFlags.REDRAW;
      console.log(segment);
      window.redraw_viewport();
    }
    var zprop=new FloatProperty(0, "z", "z", "z");
    let zpath=new DataPath(zprop, "z", "z", true);
    zpath.update = function (segment, old_value, changed) {
      if (segment!=undefined&&old_value!=undefined) {
          changed = segment.z!=old_value;
      }
      if (!changed) {
          return ;
      }
      if (!(g_app_state.modalstate&ModalStates.PLAYING)) {
          this.ctx.frameset.spline.regen_sort();
          this.ctx.frameset.pathspline.regen_sort();
      }
      segment.flag|=SplineFlags.REDRAW;
    }
    let w1=new FloatProperty(0, "w1", "w1", "Width 1");
    let shift1=new FloatProperty(0, "w1", "w1", "Width 1");
    let w2=new FloatProperty(0, "w2", "w2", "Width 2");
    let shift2=new FloatProperty(0, "w2", "w2", "Width 2");
    w1.baseUnit = w2.baseUnit = shift1.baseUnit = shift2.baseUnit = "none";
    w1.displayUnit = w2.displayUnit = shift1.displayUnit = shift2.displayUnit = "none";
    w1.update = shift1.update = w2.update = shift2.update = function (segment) {
      g_app_state.ctx.spline.regen_sort();
      segment.mat.update();
      segment.flag|=SplineFlags.REDRAW;
      window.redraw_viewport();
    }
    SplineSegmentStruct = new DataStruct([new DataPath(w1, "w1", "w1", true), new DataPath(w2, "w2", "w2", true), new DataPath(shift1, "shift1", "shift1", true), new DataPath(shift2, "shift2", "shift2", true), new DataPath(new IntProperty(0, "eid", "eid", "eid"), "eid", "eid", true), new DataPath(flagprop, "flag", "flag", true), new DataPath(new BoolProperty(0, "renderable", "renderable"), "renderable", "renderable", true), new DataPath(api_define_material(), "mat", "mat", true), zpath], SplineSegment);
    return SplineSegmentStruct;
  }
  var SplineLayerStruct;
  function api_define_spline_layer_struct() {
    var flag=new FlagProperty(2, SplineLayerFlags);
    flag.descriptions = {MASK: "Use previous layer as a mask"}
    flag.ui_key_names.MASK = flag.ui_value_names[SplineLayerFlags.MASK] = "Mask To Prev";
    flag.update = function () {
      window.redraw_viewport();
    }
    SplineLayerStruct = new DataStruct([new DataPath(new IntProperty(0, "id", "id", "id"), "id", "id", true), new DataPath(new StringProperty("", "name", "name", "name"), "name", "name", true), new DataPath(flag, "flag", "flag", true)]);
    window.SplineLayerStruct = SplineLayerStruct;
  }
  function api_define_spline() {
    api_define_spline_layer_struct();
    var layerset=new DataStructArray(function getstruct(item) {
      return SplineLayerStruct;
    }, function itempath(key) {
      return ".idmap["+key+"]";
    }, function getitem(key) {
      return this.idmap[key];
    }, function getiter() {
      return this[Symbol.iterator]();
    }, function getkeyiter() {
      var keys=Object.keys(this.idmap);
      var ret=new GArray();
      for (var i=0; i<keys.length; i++) {
          ret.push(keys[i]);
      }
      return ret;
    }, function getlength() {
      return this.length;
    });
    function define_editable_element_array(the_struct, name) {
      window.getstruct1 = undefined;
      eval(`
    window.getstruct1 = function getstruct(item) {
    
      return ${name};
      
    } 
    `);
      return new DataStructArray(getstruct1, function itempath(key) {
        return ".local_idmap["+key+"]";
      }, function getitem(key) {
        return this.local_idmap[key];
      }, function getiter() {
        return this.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function getkeyiter(ctx) {
        var keys=new GArray();
        for (let e of this.editable(ctx)) {
            keys.push(e.eid);
        }
        return keys;
      }, function getlength() {
        let len=0;
        for (let e of this.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      });
    }
    function define_selected_element_array(the_struct, name) {
      window.getstruct1 = undefined;
      eval(`
    window.getstruct1 = function getstruct(item) {
    
      return ${name};
      
    } 
    `);
      return new DataStructArray(getstruct1, function itempath(key) {
        return ".local_idmap["+key+"]";
      }, function getitem(key) {
        return this.local_idmap[key];
      }, function getiter() {
        return this.selected.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function getkeyiter(ctx) {
        var keys=new GArray();
        for (let e of this.editable(ctx)) {
            keys.push(e.eid);
        }
        return keys;
      }, function getlength() {
        let len=0;
        for (let e of this.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      });
    }
    function define_element_array(the_struct, name) {
      window.getstruct1 = undefined;
      eval(`
    window.getstruct1 = function getstruct(item) {
    
      return ${name};
      
    } 
    `);
      return new DataStructArray(getstruct1, function itempath(key) {
        return ".local_idmap["+key+"]";
      }, function getitem(key) {
        return this.local_idmap[key];
      }, function getiter() {
        return this[Symbol.iterator]();
      }, function getkeyiter() {
        var keys=Object.keys(this.local_idmap);
        var ret=new GArray();
        for (var i=0; i<keys.length; i++) {
            ret.push(keys[i]);
        }
        return ret;
      }, function getlength() {
        return this.length;
      });
    }
    var SplineStruct=new DataStruct(api_define_DataBlock().concat([new DataPath(api_define_spline_face(), "active_face", "faces.active", true), new DataPath(api_define_spline_segment(), "active_segment", "segments.active", true), new DataPath(api_define_spline_vertex(), "active_vertex", "verts.active", true), new DataPath(define_element_array(SplineFaceStruct, "SplineFaceStruct"), "faces", "faces", true), new DataPath(define_element_array(SplineSegmentStruct, "SplineSegmentStruct"), "segments", "segments", true), new DataPath(define_element_array(SplineVertexStruct, "SplineVertexStruct"), "verts", "verts", true), new DataPath(define_element_array(SplineVertexStruct, "SplineVertexStruct"), "handles", "handles", true), new DataPath(define_editable_element_array(SplineFaceStruct, "SplineFaceStruct"), "editable_faces", "faces", true), new DataPath(define_editable_element_array(SplineSegmentStruct, "SplineSegmentStruct"), "editable_segments", "segments", true), new DataPath(define_editable_element_array(SplineVertexStruct, "SplineVertexStruct"), "editable_verts", "verts", true), new DataPath(define_editable_element_array(SplineVertexStruct, "SplineVertexStruct"), "editable_handles", "handles", true), new DataPath(define_selected_element_array(SplineFaceStruct, "SplineFaceStruct"), "selected_facese", "faces", true), new DataPath(define_selected_element_array(SplineSegmentStruct, "SplineSegmentStruct"), "selected_segments", "segments", true), new DataPath(define_selected_element_array(SplineVertexStruct, "SplineVertexStruct"), "selected_verts", "verts", true), new DataPath(define_selected_element_array(SplineVertexStruct, "SplineVertexStruct"), "selected_handles", "handles", true), new DataPath(layerset, "layerset", "layerset", true), new DataPath(SplineLayerStruct, "active_layer", "layerset.active", true)]));
    datablock_structs[DataTypes.SPLINE] = SplineStruct;
    return SplineStruct;
  }
  function api_define_vertex_animdata() {
    var VertexAnimData=new DataStruct([]);
    VertexAnimData.Flags(VDAnimFlags, "animflag", "animflag", "Animation Flags", "Keyframe Settings");
    VertexAnimData.Int("owning_vertex", "eid", "Owning Vertex", "Vertex in drawspline that owns this animation path");
    return VertexAnimData;
  }
  function api_define_frameset() {
    let animdata_struct=api_define_vertex_animdata();
    function define_animdata_array() {
      return new DataStructArray(function getstruct(item) {
        return animdata_struct;
      }, function itempath(key) {
        return "["+key+"]";
      }, function getitem(key) {
        return this[key];
      }, function getiter() {
        let this2=this;
        return (function* () {
          for (let k in this2) {
              yield this2[k];
          }
        })();
      }, function getkeyiter() {
        var keys=Object.keys(this);
        var ret=new GArray();
        for (var i=0; i<keys.length; i++) {
            ret.push(keys[i]);
        }
        return ret;
      }, function getlength() {
        let i=0;
        for (let k in this) {
            i++;
        }
        return i;
      });
    }
    var FrameSetStruct=new DataStruct(api_define_DataBlock().concat([new DataPath(api_define_spline(), "drawspline", "spline", true), new DataPath(api_define_spline(), "pathspline", "pathspline", true), new DataPath(define_animdata_array(), "keypaths", "vertex_animdata", true), new DataPath(animdata_struct, "active_keypath", "active_animdata", true)]));
    datablock_structs[DataTypes.FRAMESET] = FrameSetStruct;
    return FrameSetStruct;
  }
  var SceneStruct=undefined;
  function api_define_sceneobject() {
    var SceneObjectStruct=new DataStruct();
    SceneObjectStruct.Vector2("loc", "loc", "Position", "Position");
    SceneObjectStruct.Vector2("scale", "scale", "Scale", "Scale");
    SceneObjectStruct.Float("rot", "rot", "Rotation", "Rotation");
    SceneObjectStruct.add(new DataPath(api_define_frameset(), "frameset", "data", true));
    SceneObjectStruct.Bool("edit_all_layers", "edit_all_layers", "Edit All Layers", "Edit All Layers");
    return SceneObjectStruct;
  }
  function api_define_sceneobjects() {
    let SceneObjectStruct=api_define_sceneobject();
    let objectarray=new DataStructArray(function getstruct(item) {
      return SceneObjectStruct;
    }, function itempath(key) {
      return ".object_idmap["+key+"]";
    }, function getitem(key) {
      console.log("get key", key, this);
      return this.object_idmap[key];
    }, function getiter() {
      return new obj_value_iter(this.object_idmap);
    }, function getkeyiter() {
      return new obj_key_iter(this.object_idmap);
    }, function getlength() {
      return this.objects.length;
    });
    return objectarray;
  }
  function api_define_scene() {
    var name=new StringProperty("", "name", "name", "Name", TPropFlags.LABEL);
    var frame=new IntProperty(0, "frame", "Frame", "Frame", TPropFlags.LABEL);
    frame.range = [1, 10000];
    frame.step = 1;
    frame.expRate = 1.5;
    frame.update = (owner, old) =>      {
      let time=owner.time;
      owner.time = old;
      owner.change_time(g_app_state.ctx, time);
      window.redraw_viewport();
    }
    var SceneStruct=new DataStruct(api_define_DataBlock().concat([new DataPath(name, "name", "name", true), new DataPath(frame, "frame", "time", true), new DataPath(api_define_sceneobjects(), "objects", "objects", true), new DataPath(api_define_sceneobject(), "active_object", "objects.active", true)]));
    datablock_structs[DataTypes.SCENE] = SceneStruct;
    return SceneStruct;
  }
  var DopeSheetStruct=undefined;
  function api_define_dopesheet() {
    var selected_only=new BoolProperty(false, "selected_only", "Selected Only", "Show only keys of selected vertices");
    var pinned=new BoolProperty(false, "pinned", "Pin", "Pin view");
    selected_only.update = function (owner) {
      owner.rebuild();
    }
    let timescale=new FloatProperty(1.0, "timescale", "timescale", "timescale");
    timescale.update = function (owner) {
      owner.updateKeyPositions();
    }
    DopeSheetStruct = new DataStruct([new DataPath(selected_only, "selected_only", "selected_only", true), new DataPath(pinned, "pinned", "pinned", true), new DataPath(timescale, "timescale", "timescale")], DopeSheetEditor);
    return DopeSheetStruct;
  }
  var CurveEditStruct=undefined;
  function api_define_editcurve() {
    var selected_only=new BoolProperty(false, "selected_only", "Selected Only", "Show only keys of selected vertices");
    var pinned=new BoolProperty(false, "pinned", "Pin", "Pin view");
    selected_only.update = function () {
      if (this.ctx!=undefined&&this.ctx.editcurve!=undefined)
        this.ctx.editcurve.do_full_recalc();
    }
    CurveEditStruct = new DataStruct([new DataPath(selected_only, "selected_only", "selected_only", true), new DataPath(pinned, "pinned", "pinned", true)], CurveEditor);
    return CurveEditStruct;
  }
  var ObjectStruct=undefined;
  function api_define_object() {
    var name=new StringProperty("", "name", "name", "Name", TPropFlags.LABEL);
    var ctx_bb=new Vec3Property(new Vector3(), "dimensions", "Dimensions", "Editable dimensions");
    ctx_bb.flag|=TPropFlags.USE_UNDO;
    ctx_bb.update = function () {
      if (this.ctx.mesh!==undefined)
        this.ctx.mesh.regen_render();
      if (this.ctx.view2d!==undefined&&this.ctx.view2d.selectmode&EditModes.GEOMETRY) {
          this.ctx.object.dag_update();
      }
    }
    ObjectStruct = new DataStruct([new DataPath(name, "name", "name", true), new DataPath(ctx_bb, "ctx_bb", "ctx_bb", true)], SceneObject);
    return ObjectStruct;
  }
  var ImageStruct=undefined;
  function api_define_image() {
    var name=new StringProperty("");
    var lib_id=new IntProperty(0);
    var path=new StringProperty("");
    var flag=new FlagProperty(1, ImageFlags, undefined, "image flags", "image flags");
    ImageStruct = new DataStruct([new DataPath(name, "name", "name", true), new DataPath(lib_id, "lib_id", "lib_id", true), new DataPath(path, 'path', 'path', true), new DataPath(flag, 'flag', 'flag', true)], Image);
    datablock_structs[DataTypes.IMAGE] = ImageStruct;
    return ImageStruct;
  }
  function toArray(list) {
    let ret=[];
    for (let item of list) {
        ret.push(item);
    }
    return ret;
  }
  function api_define_datalist(name, typeid) {
    var items=new DataStructArray(function getstruct(item) {
      return datablock_structs[item.lib_type];
    }, function itempath(key) {
      return "["+key+"]";
    }, function getitem(key) {
      return this[key];
    }, function getiter() {
      let ret=[];
      for (var k in this) {
          ret.push(this[k]);
      }
      return ret[Symbol.iterator]();
    }, function getkeyiter() {
      let ret=[];
      for (var k in this) {
          ret.push(k);
      }
      return ret[Symbol.iterator]();
    }, function getlength() {
      let count=0;
      for (let k in this) {
          count++;
      }
      return count;
    });
    return new DataStruct([new DataPath(new StringProperty(name, "name"), "name", "name", false), new DataPath(new IntProperty(typeid, "typeid"), "typeid", "typeid", false), new DataPath(items, "items", "idmap", true)]);
  }
  var DataLibStruct=undefined;
  function api_define_datalib() {
    var paths=[];
    if (DataLibStruct!=undefined)
      return DataLibStruct;
    for (var k in DataTypes) {
        var v=DataTypes[k];
        var name=k.toLowerCase();
        paths.push(new DataPath(api_define_datalist(name, v), name, "datalists.items["+v+"]", false));
    }
    DataLibStruct = new DataStruct(paths);
    return DataLibStruct;
  }
  api_define_datalib();
  window.DataLibStruct2 = DataLibStruct;
  var AppStateStruct=undefined;
  function api_define_appstate() {
    var sel_multiple_mode=new BoolProperty(false, "select_multiple", "Multiple", "Select multiple elements");
    var sel_inverse_mode=new BoolProperty(false, "select_inverse", "Deselect", "Deselect Elements");
    AppStateStruct = new DataStruct([new DataPath(sel_multiple_mode, "select_multiple", "select_multiple", true), new DataPath(sel_inverse_mode, "select_inverse", "select_inverse", true)]);
    return AppStateStruct;
  }
  function get_tool_struct(tool) {
    OpStackArray.flag|=DataFlags.RECALC_CACHE;
    if (tool.apistruct!=undefined) {
        tool.apistruct.flag|=DataFlags.RECALC_CACHE;
        return tool.apistruct;
    }
    tool.apistruct = g_app_state.toolstack.gen_tool_datastruct(tool);
    tool.apistruct.flag|=DataFlags.RECALC_CACHE;
    return tool.apistruct;
  }
  get_tool_struct = _es6_module.add_export('get_tool_struct', get_tool_struct);
  var OpStackArray=new DataStructArray(get_tool_struct, function getitempath(key) {
    return "["+key+"]";
  }, function getitem(key) {
    return g_app_state.toolstack.undostack[key];
  }, function getiter() {
    return g_app_state.toolstack.undostack[Symbol.iterator]();
  }, function getkeyiter() {
    function* range(len) {
      for (var i=0; i<len; i++) {
          yield i;
      }
    }
    return range(g_app_state.toolstack.undostack.length)[Symbol.iterator]();
  }, function getlength() {
    return g_app_state.toolstack.undostack.length;
  });
  ContextStruct = undefined;
  window.test_range = function* range(len) {
    for (var i=0; i<len; i++) {
        yield i;
    }
  }
  function updateActiveToolApi(ctx) {
    let p=ContextStruct.pathmap.active_tool;
    let update=false;
    let toolcls=ctx.toolmode.constructor;
    if (!toolcls) {
        return ;
    }
    if (p&&p.data!==toolcls._apiStruct) {
        update = true;
        ContextStruct.remove(p);
    }
    else 
      if (!p) {
        update = true;
    }
    if (update) {
        console.log("Updating data API for toolmode "+toolcls.name);
        ContextStruct.add(new DataPath(toolcls._apiStruct, "active_tool", "ctx.toolmode", true));
    }
  }
  updateActiveToolApi = _es6_module.add_export('updateActiveToolApi', updateActiveToolApi);
  window.updateActiveToolApi = updateActiveToolApi;
  window.api_define_context = function () {
    ContextStruct = new DataStruct([new DataPath(api_define_view2d(), "view2d", "ctx.view2d", true), new DataPath(api_define_dopesheet(), "dopesheet", "ctx.dopesheet", true), new DataPath(api_define_editcurve(), "editcurve", "ctx.editcurve", true), new DataPath(api_define_frameset(), "frameset", "ctx.frameset", true), new DataPath(api_define_seditor(), "settings_editor", "ctx.settings_editor", false), new DataPath(api_define_settings(), "settings", "ctx.appstate.session.settings", false), new DataPath(api_define_object(), "object", "ctx.object", false), new DataPath(api_define_scene(), "scene", "ctx.scene", false), new DataPath(new DataStruct([]), "last_tool", "", false, false, DataFlags.RECALC_CACHE), new DataPath(api_define_appstate(), "appstate", "ctx.appstate", false), new DataPath(OpStackArray, "operator_stack", "ctx.appstate.toolstack.undostack", false, true, DataFlags.RECALC_CACHE), new DataPath(api_define_spline(), "spline", "ctx.spline", false), new DataPath(api_define_datalib(), "datalib", "ctx.datalib", false), new DataPath(api_define_opseditor(), "opseditor", "ctx.opseditor", false), new DataPath(new DataStruct([]), "active_tool", "ctx.toolmode", false, false, DataFlags.RECALC_CACHE)], Context);
    toolmode.defineAPI();
  }
  window.init_data_api = function () {
    api_define_ops();
    api_define_context();
  }
  function gen_path_maps(strct, obj, path1, path2) {
    if (obj==undefined)
      obj = {}
    if (path1==undefined) {
        path1 = "";
        path2 = "";
    }
    if (path1!="")
      obj[path1] = strct;
    for (var p in strct.paths) {
        if (!(__instance_of(p.data, DataStruct))) {
            if (p.use_path) {
                obj[path1+"."+p.path] = "r = "+path2+"."+p.path+"; obj["+path1+"].pathmap["+p.path+"]";
            }
            else {
              obj[path1+"."+p.path] = "r = undefined; obj["+path1+"].pathmap["+p.path+"]";
            }
        }
        else {
          gen_path_maps(p, obj, path1+p.name, path2+p.path);
        }
    }
  }
  gen_path_maps = _es6_module.add_export('gen_path_maps', gen_path_maps);
  let _prefix=`"use strict";
import {DataTypes} from '../lib_api.js';
import {EditModes, View2DHandler} from '../../editors/viewport/view2d.js';
import {ImageFlags, Image, ImageUser} from '../imageblock.js';
import {AppSettings} from '../UserSettings.js';
import {FullContext} from "../context.js";

import {VertexAnimData} from "../frameset.js";
import {SplineLayer} from "../../curve/spline_element_array.js";

import {
  EnumProperty, FlagProperty,
  FloatProperty, StringProperty,
  BoolProperty, Vec2Property,
  DataRefProperty,
  Vec3Property, Vec4Property, IntProperty,
  TPropFlags, PropTypes, PropSubTypes
} from '../toolprops.js';

import {ModalStates} from '../toolops_api.js';

import {SplineFlags, MaterialFlags, SplineTypes} from '../../curve/spline_base.js';
import {SelMask, ToolModes} from '../../editors/viewport/selectmode.js';
import {Unit} from '../units.js';

import {ExtrudeModes} from '../../editors/viewport/spline_createops.js';
import {DataFlags, DataPathTypes} from './data_api.js';
import {OpStackEditor} from '../../editors/ops/ops_editor.js';

import {AnimKeyFlags, AnimInterpModes, AnimKey} from '../animdata.js';
import {VDAnimFlags, SplineFrameSet} from '../frameset.js';

import {ExtrudeModes} from '../../editors/viewport/spline_createops.js';
import {SplineLayerFlags} from '../../curve/spline_element_array.js';
import {Material, SplineFace, SplineSegment, SplineVertex} from "../../curve/spline_types.js";
import {CurveEditor} from "../../editors/curve/CurveEditor.js";
import {SceneObject} from "../../scene/sceneobject.js";
import {DopeSheetEditor} from "../../editors/dopesheet/DopeSheetEditor.js";
import {SettingsEditor} from "../../editors/settings/SettingsEditor.js";
import {Scene} from "../../scene/scene.js";
import {Spline} from "../../curve/spline.js";
import {DataLib, DataBlock, DataList} from "../lib_api.js";

`;
  window.genNewDataAPI = () =>    {
    let out="";
    let ctx=g_app_state.ctx;
    let getClass=(dstruct, path) =>      {
      if (dstruct.dataClass)
        return dstruct.dataClass;
      console.log(path);
      window.ctx = CTX;
      let val;
      try {
        val = eval(path);
      }
      catch (error) {
          print_stack(error);
          console.warn("failed");
      }
      if (!val||!(typeof val==="object")) {
          console.warn("Failed to resovle a class", dstruct, "at", path);
          return undefined;
      }
      return val.constructor;
    }
    let structs={}
    let genStruct=(cls, dstruct, path) =>      {
      if (!cls) {
          console.warn("Failed to resolve a class", dstruct, path);
          return ;
      }
      let name=cls.name;
      out+=`var ${name}Struct = api.mapStruct(${cls.name}, true);\n\n`;
      out+="function api_define_"+name+"(api) {\n";
      name = name+"Struct";
      for (let dpath of dstruct.paths) {
          let name2=dpath.name;
          let path2=path.trim();
          if (path2.length>0) {
              path2+=".";
          }
          path2+=dpath.path;
          let checkenum=(a, def) =>            {
            if (!a)
              return false;
            let ok=false;
            for (let k in def) {
                if (a[k]!==k) {
                    ok = true;
                }
            }
            return ok;
          };
          let format_obj=(obj) =>            {
            for (let k in _es6_module.imports) {
                let v=_es6_module.imports[k].value;
                if (typeof v!=="object"||v===null)
                  continue;
                let ok=true;
                for (let k2 in obj) {
                    if (v[k2]===undefined) {
                        ok = false;
                    }
                }
                if (ok) {
                    return k;
                }
            }
            let def="{\n";
            let keys=Object.keys(obj);
            let maxwid=0;
            for (let i=0; i<keys.length; i++) {
                maxwid = Math.max(maxwid, keys[i].length);
            }
            for (let i=0; i<keys.length; i++) {
                let k=""+keys[i];
                let v=obj[keys[i]];
                if (k.search(" ")>=0||k==="in"||k==="of"||k==="if")
                  k = `"${k}"`;
                if (typeof v!=="number"&&!(typeof v==="string"&&v.startsWith("Icons.")))
                  v = `"${v}"`;
                def+="      "+k;
                let wid=k.length;
                for (let j=0; j<maxwid-wid; j++) {
                    def+=" ";
                }
                def+=" : "+v;
                if (i<keys.length-1) {
                    def+=",";
                }
                def+="\n";
            }
            def+="    }";
            return def;
          };
          let path3=dpath.path;
          if (path3.startsWith("ctx.")) {
              path3 = path3.slice(4, path3.length);
          }
          if (dpath.type===DataPathTypes.STRUCT) {
              let stt="undefined";
              let cls2=getClass(dpath.data, path2);
              if (cls2!==undefined) {
                  stt = `api.mapStruct(${cls2.name}, true)`;
              }
              else {
                out+="  /*WARNING: failed to resolve a class*/\n";
              }
              out+=`  ${name}.struct("${path3}", "${dpath.name}", "${dpath.uiname}", ${stt});\n`;
          }
          else 
            if (dpath.type===DataPathTypes.STRUCT_ARRAY) {
              function process(func) {
                let s=(""+func).trim();
                s = s.slice(0, s.length-1);
                s = s.split("\n");
                s = s.slice(1, s.length);
                s = s.join("\n").trim();
                s = s.replace(/this/g, "list");
                return s;
              }
              let list=dpath.data;
              out+=`  ${name}.list("${path3}", "${dpath.name}", [\n`;
              if (list.getiter) {
                  out+=`    function getIter(api, list) {\n      ${process(list.getiter)}\n    },\n`;
              }
              if (list.getitem) {
                  out+=`    function get(api, list, key) {\n      ${process(list.getitem)}\n    },\n`;
              }
              if (list.getter) {
                  out+=`    function getStruct(api, list, key) {\n      ${process(list.getter)}\n    },\n`;
              }
              if (list.getlength) {
                  out+=`    function getLength(api, list) {\n      ${process(list.getlength)}\n    },\n`;
              }
              if (list.getkeyiter) {
                  out+="/*"+list.getkeyiter+"*/\n";
              }
              if (list.getitempath) {
                  out+="/*"+list.getitempath+"*/\n";
              }
              out+="  ]);\n";
          }
          else {
            let prop=dpath.data;
            let name2=dpath.name;
            out+=`  `;
            let uiname=dpath.uiname||prop.uiname||dpath.name;
            let numprop=(prop, isint) =>              {
              s = "";
              if (prop.range&&prop.range[0]&&prop.range[1]) {
                  s+=`.range(${prop.range[0]}, ${prop.range[1]})`;
              }
              if (prop.ui_range&&prop.ui_range[0]&&prop.ui_range[1]) {
                  s+=`.uiRange(${prop.ui_range[0]}, ${prop.ui_range[1]})`;
              }
              if (prop.step!==undefined) {
                  s+=`.step(${prop.step})`;
              }
              if (prop.expRate!==undefined) {
                  s+=`.expRate(${prop.expRate})`;
              }
              if (!isint&&prop.decimalPlaces!==undefined) {
                  s+=`.decimalPlaces(${prop.decimalPlaces})`;
              }
              return s;
            };
            let path3=dpath.path;
            if (path3.startsWith("ctx.")) {
                path3 = path3.slice(4, path3.length);
            }
            switch (prop.type) {
              case PropTypes.BOOL:
                out+=`${name}.bool("${path3}", "${dpath.name}", "${uiname}")`;
                break;
              case PropTypes.INT:
                out+=`${name}.int("${path3}", "${dpath.name}", "${uiname}")`;
                out+=numprop(prop, true);
                break;
              case PropTypes.FLOAT:
                out+=`${name}.float("${path3}", "${dpath.name}", "${uiname}")`;
                out+=numprop(prop);
                break;
              case PropTypes.VEC2:
                out+=`${name}.vec2("${path3}", "${dpath.name}", "${uiname}")`;
                out+=numprop(prop);
                break;
              case PropTypes.VEC3:
                out+=`${name}.vec3("${path3}", "${dpath.name}", "${uiname}")`;
                out+=numprop(prop);
                break;
              case PropTypes.VEC4:
                out+=`${name}.vec2("${path3}", "${dpath.name}", "${uiname}")`;
                out+=numprop(prop);
                break;
              case PropTypes.ENUM:
              case PropTypes.FLAG:
                let key=prop.type===PropTypes.ENUM ? "enum" : "flags";
                let def=format_obj(prop.type===PropTypes.FLAG ? prop.values : prop.values);
                out+=`${name}.${key}("${path3}", "${dpath.name}", ${def}, "${uiname}")`;
                if (prop.type===PropTypes.ENUM) {
                    if (checkenum(prop.ui_value_names, prop.values)) {
                        out+=`.uiNames(${format_obj(prop.ui_value_names)})`;
                    }
                }
                else {
                  if (checkenum(prop.ui_value_names, prop.values)) {
                      out+=`.uiNames(${format_obj(prop.ui_value_names)})`;
                  }
                }
                if (checkenum(prop.descriptions, prop.values)) {
                    out+=`.descriptions(${format_obj(prop.descriptions)})`;
                }
                if (checkenum(prop.iconmap, prop.values)) {
                    let iconmap2={};
                    for (let k in prop.iconmap) {
                        let v=prop.iconmap[k];
                        for (let k2 in Icons) {
                            if (Icons[k2]===v) {
                                iconmap2[k] = "Icons."+k2;
                            }
                        }
                    }
                    out+=`.icons(${format_obj(iconmap2)})`;
                }
                break;
            }
            if (prop.userSetData&&prop.userSetData!==prop.prototype.userSetData) {
                out+=".customSet("+prop.userSetData+")";
            }
            if (prop.update&&prop.update!==prop.prototype.update) {
                out+=`.on("change", function(old) {return (${""+prop.update}).call(this.dataref, old)})`;
            }
            out+=";\n";
          }
      }
      out+="}\n\n";
    }
    let recurse=(dstruct, path) =>      {
      let cls=getClass(dstruct, path);
      if (cls===undefined) {
          console.warn("failed to resolve class for path", path, dstruct);
          return ;
      }
      if (!(cls.name in structs)) {
          genStruct(cls, dstruct, path);
          structs[cls.name] = cls;
      }
      if (path.length>0) {
          path+=".";
      }
      for (let dpath of dstruct.paths) {
          if (dpath.type===DataPathTypes.STRUCT) {
              recurse(dpath.data, path+dpath.path);
          }
      }
    }
    recurse(ContextStruct, "");
    console.log(structs);
    console.log(out);
    for (let k in structs) {
        out+=`  api_define_${k}(api);\n`;
    }
    let lines=out.split("\n");
    out = "export function makeAPI(api) {\n";
    for (let l of lines) {
        out+="  "+l+"\n";
    }
    out+="  api.rootContextStruct = api.mapStruct(FullContext, false);\n\n";
    out+="  return api;\n";
    out+="}\n";
    return _prefix+out;
  }
}, '/dev/fairmotion/src/core/data_api/data_api_define.js');
es6_module_define('data_api_new', ["../lib_api.js", "../../editors/viewport/spline_createops.js", "../../editors/viewport/view2d.js", "../UserSettings.js", "../frameset.js", "../../curve/spline_base.js", "./data_api.js", "../../scene/scene.js", "../toolprops.js", "../../editors/ops/ops_editor.js", "../animdata.js", "../../editors/settings/SettingsEditor.js", "../../scene/sceneobject.js", "../../editors/viewport/selectmode.js", "../../curve/spline_types.js", "../context.js", "../../curve/spline_element_array.js", "../../curve/spline.js", "../units.js", "../imageblock.js", "../../editors/curve/CurveEditor.js", "../toolops_api.js", "../../editors/dopesheet/DopeSheetEditor.js"], function _data_api_new_module(_es6_module) {
  "use strict";
  var DataTypes=es6_import_item(_es6_module, '../lib_api.js', 'DataTypes');
  var EditModes=es6_import_item(_es6_module, '../../editors/viewport/view2d.js', 'EditModes');
  var View2DHandler=es6_import_item(_es6_module, '../../editors/viewport/view2d.js', 'View2DHandler');
  var ImageFlags=es6_import_item(_es6_module, '../imageblock.js', 'ImageFlags');
  var Image=es6_import_item(_es6_module, '../imageblock.js', 'Image');
  var ImageUser=es6_import_item(_es6_module, '../imageblock.js', 'ImageUser');
  var AppSettings=es6_import_item(_es6_module, '../UserSettings.js', 'AppSettings');
  var FullContext=es6_import_item(_es6_module, '../context.js', 'FullContext');
  var VertexAnimData=es6_import_item(_es6_module, '../frameset.js', 'VertexAnimData');
  var SplineLayer=es6_import_item(_es6_module, '../../curve/spline_element_array.js', 'SplineLayer');
  var EnumProperty=es6_import_item(_es6_module, '../toolprops.js', 'EnumProperty');
  var FlagProperty=es6_import_item(_es6_module, '../toolprops.js', 'FlagProperty');
  var FloatProperty=es6_import_item(_es6_module, '../toolprops.js', 'FloatProperty');
  var StringProperty=es6_import_item(_es6_module, '../toolprops.js', 'StringProperty');
  var BoolProperty=es6_import_item(_es6_module, '../toolprops.js', 'BoolProperty');
  var Vec2Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec2Property');
  var DataRefProperty=es6_import_item(_es6_module, '../toolprops.js', 'DataRefProperty');
  var Vec3Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec4Property');
  var IntProperty=es6_import_item(_es6_module, '../toolprops.js', 'IntProperty');
  var TPropFlags=es6_import_item(_es6_module, '../toolprops.js', 'TPropFlags');
  var PropTypes=es6_import_item(_es6_module, '../toolprops.js', 'PropTypes');
  var PropSubTypes=es6_import_item(_es6_module, '../toolprops.js', 'PropSubTypes');
  var ModalStates=es6_import_item(_es6_module, '../toolops_api.js', 'ModalStates');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_base.js', 'SplineFlags');
  var MaterialFlags=es6_import_item(_es6_module, '../../curve/spline_base.js', 'MaterialFlags');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_base.js', 'SplineTypes');
  var SelMask=es6_import_item(_es6_module, '../../editors/viewport/selectmode.js', 'SelMask');
  var ToolModes=es6_import_item(_es6_module, '../../editors/viewport/selectmode.js', 'ToolModes');
  var Unit=es6_import_item(_es6_module, '../units.js', 'Unit');
  var ExtrudeModes=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'ExtrudeModes');
  var DataFlags=es6_import_item(_es6_module, './data_api.js', 'DataFlags');
  var DataPathTypes=es6_import_item(_es6_module, './data_api.js', 'DataPathTypes');
  var OpStackEditor=es6_import_item(_es6_module, '../../editors/ops/ops_editor.js', 'OpStackEditor');
  var AnimKeyFlags=es6_import_item(_es6_module, '../animdata.js', 'AnimKeyFlags');
  var AnimInterpModes=es6_import_item(_es6_module, '../animdata.js', 'AnimInterpModes');
  var AnimKey=es6_import_item(_es6_module, '../animdata.js', 'AnimKey');
  var VDAnimFlags=es6_import_item(_es6_module, '../frameset.js', 'VDAnimFlags');
  var SplineFrameSet=es6_import_item(_es6_module, '../frameset.js', 'SplineFrameSet');
  var ExtrudeModes=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'ExtrudeModes');
  var SplineLayerFlags=es6_import_item(_es6_module, '../../curve/spline_element_array.js', 'SplineLayerFlags');
  var Material=es6_import_item(_es6_module, '../../curve/spline_types.js', 'Material');
  var SplineFace=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFace');
  var SplineSegment=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineSegment');
  var SplineVertex=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineVertex');
  var CurveEditor=es6_import_item(_es6_module, '../../editors/curve/CurveEditor.js', 'CurveEditor');
  var SceneObject=es6_import_item(_es6_module, '../../scene/sceneobject.js', 'SceneObject');
  var DopeSheetEditor=es6_import_item(_es6_module, '../../editors/dopesheet/DopeSheetEditor.js', 'DopeSheetEditor');
  var SettingsEditor=es6_import_item(_es6_module, '../../editors/settings/SettingsEditor.js', 'SettingsEditor');
  var Scene=es6_import_item(_es6_module, '../../scene/scene.js', 'Scene');
  var Spline=es6_import_item(_es6_module, '../../curve/spline.js', 'Spline');
  var DataLib=es6_import_item(_es6_module, '../lib_api.js', 'DataLib');
  var DataBlock=es6_import_item(_es6_module, '../lib_api.js', 'DataBlock');
  var DataList=es6_import_item(_es6_module, '../lib_api.js', 'DataList');
  function makeAPI(api) {
    var FullContextStruct=api.mapStruct(FullContext, true);
    function api_define_FullContext(api) {
      FullContextStruct.struct("view2d", "view2d", "undefined", api.mapStruct(View2DHandler, true));
      FullContextStruct.struct("dopesheet", "dopesheet", "undefined", api.mapStruct(DopeSheetEditor, true));
      FullContextStruct.struct("editcurve", "editcurve", "undefined", api.mapStruct(CurveEditor, true));
      FullContextStruct.struct("frameset", "frameset", "undefined", api.mapStruct(SplineFrameSet, true));
      FullContextStruct.struct("settings_editor", "settings_editor", "undefined", api.mapStruct(SettingsEditor, true));
      FullContextStruct.struct("appstate.session.settings", "settings", "undefined", api.mapStruct(AppSettings, true));
      FullContextStruct.struct("object", "object", "undefined", api.mapStruct(SceneObject, true));
      FullContextStruct.struct("scene", "scene", "undefined", api.mapStruct(Scene, true));
      FullContextStruct.struct("", "last_tool", "undefined", undefined);
      FullContextStruct.struct("appstate", "appstate", "undefined", api.mapStruct(AppState, true));
      FullContextStruct.list("appstate.toolstack.undostack", "operator_stack", [function getIter(api, list) {
        return g_app_state.toolstack.undostack[Symbol.iterator]();
      }, function get(api, list, key) {
        return g_app_state.toolstack.undostack[key];
      }, function getStruct(api, list, key) {
        OpStackArray.flag|=DataFlags.RECALC_CACHE;
        if (tool.apistruct!=undefined) {
            tool.apistruct.flag|=DataFlags.RECALC_CACHE;
            return tool.apistruct;
        }
        tool.apistruct = g_app_state.toolstack.gen_tool_datastruct(tool);
        tool.apistruct.flag|=DataFlags.RECALC_CACHE;
        return tool.apistruct;
      }, function getLength(api, list) {
        return g_app_state.toolstack.undostack.length;
      }]);
      FullContextStruct.struct("spline", "spline", "undefined", api.mapStruct(Spline, true));
      FullContextStruct.struct("datalib", "datalib", "undefined", api.mapStruct(DataLib, true));
      FullContextStruct.struct("opseditor", "opseditor", "undefined", api.mapStruct(OpStackEditor, true));
    }
    var View2DHandlerStruct=api.mapStruct(View2DHandler, true);
    function api_define_View2DHandler(api) {
      View2DHandlerStruct.bool("edit_all_layers", "edit_all_layers", "Edit All Layers").on("change", function (old) {
        return (function () {
          redraw_viewport();
        }).call(this.dataref, old);
      });
      View2DHandlerStruct.bool("half_pix_size", "half_pix_size", "half_pix_size");
      View2DHandlerStruct.vec3("background_color", "background_color", "Background").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4).on("change", function (old) {
        return (function () {
          window.redraw_viewport();
        }).call(this.dataref, old);
      });
      View2DHandlerStruct.vec2("default_stroke", "default_stroke", "Stroke").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4);
      View2DHandlerStruct.vec2("default_fill", "default_fill", "Fill").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4);
      View2DHandlerStruct.enum("toolmode", "toolmode", ToolModes, "Active Tool").uiNames(ToolModes).descriptions(ToolModes).icons(ToolModes);
      View2DHandlerStruct.bool("draw_small_verts", "draw_small_verts", "Small Points");
      View2DHandlerStruct.enum("selectmode", "selectmode", SelMask, "Selection Mode").uiNames(SelMask).descriptions(SelMask).icons(SelMask).customSet(function (prop, val) {
        console.log("selmask_enum.userSetData", this, prop, val);
        this.selectmode = val|(this.selectmode&SelMask.HANDLE);
        return this.selectmode;
      });
      View2DHandlerStruct.flags("selectmode", "selectmask", SelMask, "[object Object]").uiNames(SelMask).descriptions(SelMask).icons({1: Icons.VERT_MODE, 
     2: Icons.SHOW_HANDLES, 
     4: Icons.EDGE_MODE, 
     16: Icons.FACE_MODE, 
     32: Icons.OBJECT_MODE, 
     VERTEX: Icons.VERT_MODE, 
     HANDLE: Icons.SHOW_HANDLES, 
     SEGMENT: Icons.EDGE_MODE, 
     FACE: Icons.FACE_MODE, 
     OBJECT: Icons.OBJECT_MODE}).on("change", function (old) {
        return (function () {
          window.redraw_viewport();
        }).call(this.dataref, old);
      });
      View2DHandlerStruct.bool("only_render", "only_render", "Hide Controls");
      View2DHandlerStruct.bool("draw_bg_image", "draw_bg_image", "Draw Image").on("change", function (old) {
        return (function () {
          window.redraw_viewport();
        }).call(this.dataref, old);
      });
      View2DHandlerStruct.bool("tweak_mode", "tweak_mode", "Tweak Mode");
      View2DHandlerStruct.bool("enable_blur", "enable_blur", "Blur").on("change", function (old) {
        return (function () {
          this.ctx.spline.regen_sort();
          redraw_viewport();
        }).call(this.dataref, old);
      });
      View2DHandlerStruct.bool("draw_faces", "draw_faces", "Show Faces").on("change", function (old) {
        return (function () {
          this.ctx.spline.regen_sort();
          redraw_viewport();
        }).call(this.dataref, old);
      });
      View2DHandlerStruct.bool("draw_video", "draw_video", "Draw Video").on("change", function (old) {
        return (function () {
          window.redraw_viewport();
        }).call(this.dataref, old);
      });
      View2DHandlerStruct.bool("draw_normals", "draw_normals", "Show Normals").on("change", function (old) {
        return (function () {
          redraw_viewport();
        }).call(this.dataref, old);
      });
      View2DHandlerStruct.bool("draw_anim_paths", "draw_anim_paths", "Show Animation Paths");
      View2DHandlerStruct.float("zoom", "zoom", "Zoom").range(0.1, 100).uiRange(0.1, 100).step(0.1).expRate(1.2).decimalPlaces(3).on("change", function (old) {
        return (function (ctx, path) {
          this.ctx.view2d.set_zoom(this.data);
        }).call(this.dataref, old);
      });
      View2DHandlerStruct.struct("active_material", "active_material", "undefined", api.mapStruct(Material, true));
      View2DHandlerStruct.float("default_linewidth", "default_linewidth", "Line Wid").range(0.01, 100).step(0.1).expRate(1.33).decimalPlaces(4);
      View2DHandlerStruct.enum("extrude_mode", "extrude_mode", ExtrudeModes, "New Line Mode").uiNames(ExtrudeModes).descriptions(ExtrudeModes).icons(ExtrudeModes);
      View2DHandlerStruct.bool("pin_paths", "pin_paths", "Pin Paths");
      View2DHandlerStruct.struct("background_image", "background_image", "undefined", api.mapStruct(ImageUser, true));
    }
    var MaterialStruct=api.mapStruct(Material, true);
    function api_define_Material(api) {
      MaterialStruct.vec2("fillcolor", "fillcolor", "fill").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4).on("change", function (old) {
        return (function (material) {
          material.update();
          window.redraw_viewport();
        }).call(this.dataref, old);
      });
      MaterialStruct.float("linewidth", "linewidth", "linewidth").range(0.1, 200).step(0.1).expRate(1.33).decimalPlaces(4).on("change", function (old) {
        return (function (material) {
          material.update();
          window.redraw_viewport();
        }).call(this.dataref, old);
      });
      MaterialStruct.flags("flag", "flag", MaterialFlags, "material flags").uiNames(MaterialFlags).descriptions(MaterialFlags).icons(DataTypes).on("change", function (old) {
        return (function (material) {
          material.update();
          window.redraw_viewport();
        }).call(this.dataref, old);
      });
      MaterialStruct.vec2("strokecolor", "strokecolor", "Stroke").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4).on("change", function (old) {
        return (function (material) {
          material.update();
          window.redraw_viewport();
        }).call(this.dataref, old);
      });
      MaterialStruct.float("blur", "blur", "Blur").step(0.5).expRate(1.33).decimalPlaces(4).on("change", function (old) {
        return (function (material) {
          material.update();
          window.redraw_viewport();
        }).call(this.dataref, old);
      });
    }
    var ImageUserStruct=api.mapStruct(ImageUser, true);
    function api_define_ImageUser(api) {
      
      ImageUserStruct.vec2("off", "off", "Offset").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4);
      ImageUserStruct.vec2("scale", "scale", "Scale").range(0.0001, 90).step(0.1).expRate(1.33).decimalPlaces(4);
    }
    var DopeSheetEditorStruct=api.mapStruct(DopeSheetEditor, true);
    function api_define_DopeSheetEditor(api) {
      DopeSheetEditorStruct.bool("selected_only", "selected_only", "Selected Only").on("change", function (old) {
        return (function (owner) {
          owner.rebuild();
        }).call(this.dataref, old);
      });
      DopeSheetEditorStruct.bool("pinned", "pinned", "Pin");
      DopeSheetEditorStruct.float("timescale", "timescale", "timescale").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4).on("change", function (old) {
        return (function (owner) {
          owner.updateKeyPositions();
        }).call(this.dataref, old);
      });
    }
    var CurveEditorStruct=api.mapStruct(CurveEditor, true);
    function api_define_CurveEditor(api) {
      CurveEditorStruct.bool("selected_only", "selected_only", "Selected Only").on("change", function (old) {
        return (function () {
          if (this.ctx!=undefined&&this.ctx.editcurve!=undefined)
            this.ctx.editcurve.do_full_recalc();
        }).call(this.dataref, old);
      });
      CurveEditorStruct.bool("pinned", "pinned", "Pin");
    }
    var SplineFrameSetStruct=api.mapStruct(SplineFrameSet, true);
    function api_define_SplineFrameSet(api) {
      SplineFrameSetStruct.list("lib_anim_idmap", "animkeys", [function getIter(api, list) {
        return new obj_value_iter(list);
      }, function get(api, list, key) {
        console.log("get key", key, list);
        return list[key];
      }, function getStruct(api, list, key) {
        return AnimKeyStruct2;
      }, function getLength(api, list) {
        var tot=0.0;
        for (var k in list) {
            tot++;
        }
        return tot;
      }]);
      SplineFrameSetStruct.struct("spline", "drawspline", "undefined", api.mapStruct(Spline, true));
      SplineFrameSetStruct.struct("pathspline", "pathspline", "undefined", api.mapStruct(Spline, true));
      SplineFrameSetStruct.list("vertex_animdata", "keypaths", [function getIter(api, list) {
        let list2=list;
        return (function* () {
          for (let k in list2) {
              yield list2[k];
          }
        })();
      }, function get(api, list, key) {
        return list[key];
      }, function getStruct(api, list, key) {
        return animdata_struct;
      }, function getLength(api, list) {
        let i=0;
        for (let k in list) {
            i++;
        }
        return i;
      }]);
      SplineFrameSetStruct.struct("active_animdata", "active_keypath", "undefined", api.mapStruct(VertexAnimData, true));
    }
    var SplineStruct=api.mapStruct(Spline, true);
    function api_define_Spline(api) {
      SplineStruct.list("lib_anim_idmap", "animkeys", [function getIter(api, list) {
        return new obj_value_iter(list);
      }, function get(api, list, key) {
        console.log("get key", key, list);
        return list[key];
      }, function getStruct(api, list, key) {
        return AnimKeyStruct2;
      }, function getLength(api, list) {
        var tot=0.0;
        for (var k in list) {
            tot++;
        }
        return tot;
      }]);
      SplineStruct.struct("faces.active", "active_face", "undefined", api.mapStruct(SplineFace, true));
      SplineStruct.struct("segments.active", "active_segment", "undefined", api.mapStruct(SplineSegment, true));
      SplineStruct.struct("verts.active", "active_vertex", "undefined", api.mapStruct(SplineVertex, true));
      SplineStruct.list("faces", "faces", [function getIter(api, list) {
        return list[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineFaceStruct;
      }, function getLength(api, list) {
        return list.length;
      }]);
      SplineStruct.list("segments", "segments", [function getIter(api, list) {
        return list[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineSegmentStruct;
      }, function getLength(api, list) {
        return list.length;
      }]);
      SplineStruct.list("verts", "verts", [function getIter(api, list) {
        return list[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineVertexStruct;
      }, function getLength(api, list) {
        return list.length;
      }]);
      SplineStruct.list("handles", "handles", [function getIter(api, list) {
        return list[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineVertexStruct;
      }, function getLength(api, list) {
        return list.length;
      }]);
      SplineStruct.list("faces", "editable_faces", [function getIter(api, list) {
        return list.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineFaceStruct;
      }, function getLength(api, list) {
        let len=0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      }]);
      SplineStruct.list("segments", "editable_segments", [function getIter(api, list) {
        return list.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineSegmentStruct;
      }, function getLength(api, list) {
        let len=0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      }]);
      SplineStruct.list("verts", "editable_verts", [function getIter(api, list) {
        return list.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineVertexStruct;
      }, function getLength(api, list) {
        let len=0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      }]);
      SplineStruct.list("handles", "editable_handles", [function getIter(api, list) {
        return list.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineVertexStruct;
      }, function getLength(api, list) {
        let len=0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      }]);
      SplineStruct.list("faces", "selected_facese", [function getIter(api, list) {
        return list.selected.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineFaceStruct;
      }, function getLength(api, list) {
        let len=0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      }]);
      SplineStruct.list("segments", "selected_segments", [function getIter(api, list) {
        return list.selected.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineSegmentStruct;
      }, function getLength(api, list) {
        let len=0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      }]);
      SplineStruct.list("verts", "selected_verts", [function getIter(api, list) {
        return list.selected.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineVertexStruct;
      }, function getLength(api, list) {
        let len=0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      }]);
      SplineStruct.list("handles", "selected_handles", [function getIter(api, list) {
        return list.selected.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineVertexStruct;
      }, function getLength(api, list) {
        let len=0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      }]);
      SplineStruct.list("layerset", "layerset", [function getIter(api, list) {
        return list[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.idmap[key];
      }, function getStruct(api, list, key) {
        return SplineLayerStruct;
      }, function getLength(api, list) {
        return list.length;
      }]);
      SplineStruct.struct("layerset.active", "active_layer", "undefined", api.mapStruct(SplineLayer, true));
    }
    var SplineFaceStruct=api.mapStruct(SplineFace, true);
    function api_define_SplineFace(api) {
      SplineFaceStruct.int("eid", "eid", "eid").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33);
      SplineFaceStruct.struct("mat", "mat", "undefined", api.mapStruct(Material, true));
      SplineFaceStruct.flags("flag", "flag", SplineFlags, "Flags").uiNames(SplineFlags).descriptions(SplineFlags).icons({2: Icons.EXTRUDE_MODE_G0, 
     32: Icons.EXTRUDE_MODE_G1, 
     BREAK_TANGENTS: Icons.EXTRUDE_MODE_G0, 
     BREAK_CURVATURES: Icons.EXTRUDE_MODE_G1});
    }
    var SplineSegmentStruct=api.mapStruct(SplineSegment, true);
    function api_define_SplineSegment(api) {
      SplineSegmentStruct.int("eid", "eid", "eid").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33);
      SplineSegmentStruct.flags("flag", "flag", SplineFlags, "Flags").uiNames(SplineFlags).descriptions(SplineFlags).icons({2: Icons.EXTRUDE_MODE_G0, 
     32: Icons.EXTRUDE_MODE_G1, 
     BREAK_TANGENTS: Icons.EXTRUDE_MODE_G0, 
     BREAK_CURVATURES: Icons.EXTRUDE_MODE_G1}).on("change", function (old) {
        return (function (segment) {
          new Context().spline.regen_sort();
          segment.flag|=SplineFlags.REDRAW;
          console.log(segment);
          window.redraw_viewport();
        }).call(this.dataref, old);
      });
      SplineSegmentStruct.bool("renderable", "renderable", "renderable");
      SplineSegmentStruct.struct("mat", "mat", "undefined", api.mapStruct(Material, true));
      SplineSegmentStruct.float("z", "z", "z").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4);
    }
    var SplineVertexStruct=api.mapStruct(SplineVertex, true);
    function api_define_SplineVertex(api) {
      SplineVertexStruct.int("eid", "eid", "eid").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33);
      SplineVertexStruct.flags("flag", "flag", SplineFlags, "Flags").uiNames(SplineFlags).descriptions(SplineFlags).icons({2: Icons.EXTRUDE_MODE_G0, 
     32: Icons.EXTRUDE_MODE_G1, 
     BREAK_TANGENTS: Icons.EXTRUDE_MODE_G0, 
     BREAK_CURVATURES: Icons.EXTRUDE_MODE_G1}).on("change", function (old) {
        return (function (owner) {
          this.ctx.spline.regen_sort();
          console.log("vertex update", owner);
          if (owner!==undefined) {
              owner.flag|=SplineFlags.UPDATE;
          }
          this.ctx.spline.propagate_update_flags();
          this.ctx.spline.resolve = 1;
          window.redraw_viewport();
        }).call(this.dataref, old);
      });
      SplineVertexStruct.vec3("", "co", "Co").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4);
    }
    var SplineLayerStruct=api.mapStruct(SplineLayer, true);
    function api_define_SplineLayer(api) {
      SplineLayerStruct.int("id", "id", "id").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33);
      
      SplineLayerStruct.flags("flag", "flag", SplineLayerFlags, "flag").uiNames({8: "Mask To Prev", 
     HIDE: "Hide", 
     CAN_SELECT: "Can Select", 
     MASK: "Mask"}).descriptions(SplineLayerFlags).icons(DataTypes).on("change", function (old) {
        return (function () {
          window.redraw_viewport();
        }).call(this.dataref, old);
      });
    }
    var VertexAnimDataStruct=api.mapStruct(VertexAnimData, true);
    function api_define_VertexAnimData(api) {
      VertexAnimDataStruct.flags("animflag", "animflag", VDAnimFlags, "animflag").uiNames(VDAnimFlags).descriptions(VDAnimFlags).icons(DataTypes);
      VertexAnimDataStruct.int("eid", "owning_vertex", "Owning Vertex").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33);
    }
    var SettingsEditorStruct=api.mapStruct(SettingsEditor, true);
    function api_define_SettingsEditor(api) {
    }
    var AppSettingsStruct=api.mapStruct(AppSettings, true);
    function api_define_AppSettings(api) {
      AppSettingsStruct.enum("unit_scheme", "unit_system", {imperial: "imperial", 
     metric: "metric"}, "System").uiNames({imperial: "Imperial", 
     metric: "Metric"}).descriptions({imperial: "Imperial", 
     metric: "Metric"}).icons(DataTypes).on("change", function (old) {
        return (function () {
          g_app_state.session.settings.save();
        }).call(this.dataref, old);
      });
      AppSettingsStruct.enum("unit", "default_unit", {cm: "cm", 
     "in": "in", 
     ft: "ft", 
     m: "m", 
     mm: "mm", 
     km: "km", 
     mile: "mile"}, "Default Unit").descriptions({cm: "Cm", 
     "in": "In", 
     ft: "Ft", 
     m: "M", 
     mm: "Mm", 
     km: "Km", 
     mile: "Mile"}).icons(DataTypes).on("change", function (old) {
        return (function () {
          g_app_state.session.settings.save();
        }).call(this.dataref, old);
      });
    }
    var SceneObjectStruct=api.mapStruct(SceneObject, true);
    function api_define_SceneObject(api) {
      
      SceneObjectStruct.vec3("ctx_bb", "ctx_bb", "Dimensions").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4).on("change", function (old) {
        return (function () {
          if (this.ctx.mesh!==undefined)
            this.ctx.mesh.regen_render();
          if (this.ctx.view2d!==undefined&&this.ctx.view2d.selectmode&EditModes.GEOMETRY) {
              this.ctx.object.dag_update();
          }
        }).call(this.dataref, old);
      });
    }
    var SceneStruct=api.mapStruct(Scene, true);
    function api_define_Scene(api) {
      SceneStruct.list("lib_anim_idmap", "animkeys", [function getIter(api, list) {
        return new obj_value_iter(list);
      }, function get(api, list, key) {
        console.log("get key", key, list);
        return list[key];
      }, function getStruct(api, list, key) {
        return AnimKeyStruct2;
      }, function getLength(api, list) {
        var tot=0.0;
        for (var k in list) {
            tot++;
        }
        return tot;
      }]);
      
      SceneStruct.int("time", "frame", "Frame").range(1, 10000).step(1).expRate(1.5).on("change", function (old) {
        return ((owner, old) =>          {
          let time=owner.time;
          owner.time = old;
          owner.change_time(g_app_state.ctx, time);
          window.redraw_viewport();
        }).call(this.dataref, old);
      });
      SceneStruct.list("objects", "objects", [function getIter(api, list) {
        return new obj_value_iter(list.object_idmap);
      }, function get(api, list, key) {
        console.log("get key", key, list);
        return list.object_idmap[key];
      }, function getStruct(api, list, key) {
        return SceneObjectStruct;
      }, function getLength(api, list) {
        return list.objects.length;
      }]);
      SceneStruct.struct("objects.active", "active_object", "undefined", api.mapStruct(SceneObject, true));
    }
    var AppStateStruct=api.mapStruct(AppState, true);
    function api_define_AppState(api) {
      AppStateStruct.bool("select_multiple", "select_multiple", "Multiple");
      AppStateStruct.bool("select_inverse", "select_inverse", "Deselect");
    }
    var DataLibStruct=api.mapStruct(DataLib, true);
    function api_define_DataLib(api) {
      DataLibStruct.struct("datalists.items[8]", "image", "undefined", undefined);
      DataLibStruct.struct("datalists.items[5]", "scene", "undefined", api.mapStruct(DataList, true));
      DataLibStruct.struct("datalists.items[4]", "script", "undefined", undefined);
      DataLibStruct.struct("datalists.items[6]", "spline", "undefined", undefined);
      DataLibStruct.struct("datalists.items[7]", "frameset", "undefined", api.mapStruct(DataList, true));
      DataLibStruct.struct("datalists.items[8]", "addon", "undefined", undefined);
      DataLibStruct.struct("datalists.items[9]", "object", "undefined", undefined);
    }
    var DataListStruct=api.mapStruct(DataList, true);
    function api_define_DataList(api) {
      
      DataListStruct.int("typeid", "typeid", "typeid").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33);
      DataListStruct.list("idmap", "items", [function getIter(api, list) {
        let ret=[];
        for (var k in list) {
            ret.push(list[k]);
        }
        return ret[Symbol.iterator]();
      }, function get(api, list, key) {
        return list[key];
      }, function getStruct(api, list, key) {
        return datablock_structs[item.lib_type];
      }, function getLength(api, list) {
        let count=0;
        for (let k in list) {
            count++;
        }
        return count;
      }]);
    }
    var OpStackEditorStruct=api.mapStruct(OpStackEditor, true);
    function api_define_OpStackEditor(api) {
      OpStackEditorStruct.bool("filter_sel", "filter_sel", "Filter Sel");
    }
    api_define_FullContext(api);
    api_define_View2DHandler(api);
    api_define_Material(api);
    api_define_ImageUser(api);
    api_define_DopeSheetEditor(api);
    api_define_CurveEditor(api);
    api_define_SplineFrameSet(api);
    api_define_Spline(api);
    api_define_SplineFace(api);
    api_define_SplineSegment(api);
    api_define_SplineVertex(api);
    api_define_SplineLayer(api);
    api_define_VertexAnimData(api);
    api_define_SettingsEditor(api);
    api_define_AppSettings(api);
    api_define_SceneObject(api);
    api_define_Scene(api);
    api_define_AppState(api);
    api_define_DataLib(api);
    api_define_DataList(api);
    api_define_OpStackEditor(api);
    api.rootContextStruct = api.mapStruct(FullContext, false);
    return api;
  }
  makeAPI = _es6_module.add_export('makeAPI', makeAPI);
}, '/dev/fairmotion/src/core/data_api/data_api_new.js');
es6_module_define('data_api_base', ["../../path.ux/scripts/controller/controller.js"], function _data_api_base_module(_es6_module) {
  var DataPathTypes={PROP: 0, 
   STRUCT: 1, 
   STRUCT_ARRAY: 2}
  DataPathTypes = _es6_module.add_export('DataPathTypes', DataPathTypes);
  var DataFlags={NO_CACHE: 1, 
   RECALC_CACHE: 2}
  DataFlags = _es6_module.add_export('DataFlags', DataFlags);
  var DataPathError=es6_import_item(_es6_module, '../../path.ux/scripts/controller/controller.js', 'DataPathError');
  let DataAPIError=DataPathError;
  DataAPIError = _es6_module.add_export('DataAPIError', DataAPIError);
  window.DataAPIError = DataAPIError;
}, '/dev/fairmotion/src/core/data_api/data_api_base.js');
es6_module_define('data_api_pathux', ["../../path.ux/scripts/util/simple_events.js", "./data_api_base.js", "../../path.ux/scripts/core/ui_base.js", "../../editors/editor_base.js", "../../path.ux/scripts/controller/controller.js", "../../editors/events.js", "../toolops_api.js", "../toolprops.js"], function _data_api_pathux_module(_es6_module) {
  var ModelInterface=es6_import_item(_es6_module, '../../path.ux/scripts/controller/controller.js', 'ModelInterface');
  var DataPathError=es6_import_item(_es6_module, '../../path.ux/scripts/controller/controller.js', 'DataPathError');
  var ToolOpAbstract=es6_import_item(_es6_module, '../toolops_api.js', 'ToolOpAbstract');
  var ToolOp=es6_import_item(_es6_module, '../toolops_api.js', 'ToolOp');
  var ToolMacro=es6_import_item(_es6_module, '../toolops_api.js', 'ToolMacro');
  var ToolProperty=es6_import_item(_es6_module, '../toolprops.js', 'ToolProperty');
  var PropTypes=es6_import_item(_es6_module, '../toolprops.js', 'PropTypes');
  var toolmap={}
  toolmap = _es6_module.add_export('toolmap', toolmap);
  var toollist=[];
  toollist = _es6_module.add_export('toollist', toollist);
  var DataPathTypes=es6_import_item(_es6_module, './data_api_base.js', 'DataPathTypes');
  var DataAPIError=es6_import_item(_es6_module, './data_api_base.js', 'DataAPIError');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var Editor=es6_import_item(_es6_module, '../../editors/editor_base.js', 'Editor');
  var ToolKeyHandler=es6_import_item(_es6_module, '../../editors/events.js', 'ToolKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../../path.ux/scripts/util/simple_events.js', 'HotKey');
  let resolvepath_rets=new cachering(() =>    {
    return {parent: undefined, 
    obj: undefined, 
    key: undefined, 
    subkey: undefined, 
    value: undefined, 
    prop: undefined, 
    struct: undefined, 
    mass_set: undefined}
  }, 32);
  function register_toolops() {
    function isTool(t) {
      if (t.tooldef===undefined)
        return false;
      if (t===ToolOpAbstract||t===ToolOp||t===ToolMacro)
        return false;
      let p=t, lastp;
      while (p&&p.prototype&&p.prototype.__proto__&&p!==lastp) {
        lastp = p;
        p = p.prototype.__proto__.constructor;
        if (p!==undefined&&p===ToolOpAbstract)
          return true;
      }
      return false;
    }
    for (let cls of defined_classes) {
        if (!isTool(cls))
          continue;
        let def=cls.tooldef();
        if (def.apiname===undefined) {
        }
        if (def.apiname)
          toolmap[def.apiname] = cls;
        if (def.toolpath)
          toolmap[def.toolpath] = cls;
        toollist.push(cls);
    }
  }
  register_toolops = _es6_module.add_export('register_toolops', register_toolops);
  class PathUXInterface extends ModelInterface {
    
     constructor(api, ctx=undefined) {
      super();
      this.prefix = "";
      this.api = api;
      this.ctx = ctx;
    }
     _getToolHotkey(screen, toolstring) {
      if (!screen) {
          return "";
      }
      let ctx=this.ctx;
      let ret;
      function processKeymap(keymap) {
        for (let k of keymap) {
            let v=keymap.get(k);
            if (__instance_of(v, ToolKeyHandler)&&v.tool===toolstring) {
                let ws=k.split("-");
                let s="";
                let i=0;
                for (let w of ws) {
                    w = w[0].toUpperCase()+w.slice(1, w.length).toLowerCase();
                    if (i>0) {
                        s+=" + ";
                    }
                    s+=w;
                    i++;
                }
                return s;
            }
            else 
              if (__instance_of(v, HotKey)&&v.action===toolstring) {
                return v.buildString();
            }
            else 
              if (__instance_of(k, HotKey)&&k.action===toolstring) {
                return k.buildString();
            }
        }
      }
      for (let sarea of screen.sareas) {
          for (let keymap of sarea.area.getKeyMaps()) {
              ret = processKeymap(keymap);
              if (ret) {
                  return ret;
              }
          }
      }
      if (ret===undefined&&screen.keymap!==undefined) {
          ret = processKeymap(screen.keymap);
      }
      return ret;
    }
     setContext(ctx) {
      this.ctx = ctx;
    }
     getObject(ctx, path) {
      return this.api.get_object(ctx, path);
    }
     getToolDef(path) {
      let ret=this.api.get_opclass(this.ctx, path);
      if (ret===undefined) {
          throw new DataAPIError("bad toolop path", path);
      }
      ret = ret.tooldef();
      ret = Object.assign({}, ret);
      ret.hotkey = this._getToolHotkey(this.ctx.screen, path);
      return ret;
    }
     getToolPathHotkey(ctx, path) {
      return this._getToolHotkey(this.ctx.screen, path);
    }
     buildMassSetPaths(ctx, listpath, subpath, value, filterstr) {
      return this.api.build_mass_set_paths(ctx, listpath, subpath, value, filterstr);
    }
     resolveMassSetPaths(ctx, mass_set_path) {
      if (!ctx||!mass_set_path||typeof mass_set_path!=="string") {
          throw new Error("invalid call to resolveMassSetPaths");
      }
      let path=mass_set_path.trim();
      let filter, listpath, subpath;
      let start=path.search("{");
      if (start<0) {
          throw new Error("invalid mass set path in resolveMassSetPaths "+path);
      }
      let end=path.slice(start, path.end).search("}")+start;
      if (end<0) {
          throw new Error("invalid mass set path in resolveMassSetPaths "+path);
      }
      filter = path.slice(start+1, end).trim();
      listpath = path.slice(0, start).trim();
      subpath = path.slice(end+2, path.length).trim();
      return this.api.build_mass_set_paths(ctx, listpath, subpath, undefined, filter);
    }
     massSetProp(ctx, mass_set_path, value) {
      let path=mass_set_path;
      let i1=path.search(/\{/);
      let i2=path.search(/\}/);
      let filterpath=path.slice(i1+1, i2);
      let listpath=path.slice(0, i1);
      let subpath=path.slice(i2+2, path.length);
      return this.api.mass_set_prop(ctx, listpath, subpath, value, filterpath);
    }
     on_frame_change(ctx, newtime) {
      return this.api.on_frame_change(ctx, newtime);
    }
     onFrameChange(ctx, newtime) {
      return this.api.on_frame_change(ctx, newtime);
    }
     createTool(ctx, path, inputs={}, constructor_argument=undefined) {
      let tool=this.api.get_op(this.ctx, path);
      for (let k in inputs) {
          if (!(k in tool.inputs)) {
              console.warn("Unknown input", k, "for tool", tool);
              continue;
          }
          let v=inputs[k];
          if (__instance_of(v, ToolProperty)) {
              v = v.data;
          }
          tool.inputs[k].setValue(v);
      }
      return tool;
    }
     setAnimPathKey(ctx, owner, path, time) {
      return this.api.key_animpath(ctx, owner, path, time);
    }
     getObject(ctx, path) {
      return this.api.get_object(ctx, path);
    }
     parseToolPath(path) {
      return this.api.get_opclass(this.ctx, path);
    }
     execTool(ctx, path_or_toolop, inputs={}, constructor_argument=undefined) {
      return new Promise((accept, reject) =>        {
        let tool;
        if (typeof path_or_toolop=="object") {
            tool = path_or_toolop;
        }
        else {
          try {
            tool = this.createTool(ctx, path_or_toolop, inputs, constructor_argument);
          }
          catch (error) {
              print_stack(error);
              reject(error);
              return ;
          }
        }
        accept(tool);
        try {
          g_app_state.toolstack.execTool(ctx, tool);
        }
        catch (error) {
            console.warn("Error executing tool");
            print_stack(error);
        }
      });
    }
    static  toolRegistered(cls) {
      return cls.tooldef().apiname in toolmap;
    }
    static  registerTool(cls) {
      let tdef=cls.tooldef();
      if (tdef.apiname in toolmap) {
          console.log(cls);
          console.warn(tdef+" is already registered");
          return ;
      }
      toolmap[tdef.apiname] = cls;
      toollist.push(cls);
    }
     resolvePath(ctx, path) {
      let rp=this.api.resolve_path_intern(ctx, path);
      if (rp===undefined||rp[0]===undefined) {
          return undefined;
      }
      let ret=resolvepath_rets.next();
      try {
        ret.value = this.api.get_prop(ctx, path);
      }
      catch (error) {
          if (__instance_of(error, DataAPIError)) {
              ret.value = undefined;
          }
          else {
            throw error;
          }
      }
      ret.mass_set = rp[3];
      ret.key = rp[0].path;
      ret.subkey = undefined;
      ret.parent = undefined;
      ret.obj = undefined;
      ret.prop = undefined;
      ret.struct = undefined;
      if (rp[4]) {
          try {
            ret.obj = this.api.evaluate(this.ctx, rp[4]);
          }
          catch (error) {
              if (__instance_of(error, DataAPIError)) {
                  ret.obj = undefined;
              }
              else {
                throw error;
              }
          }
      }
      if (rp[0].type===DataPathTypes.PROP) {
          ret.prop = rp[0].data;
      }
      else 
        if (rp[0].type===DataPathTypes.STRUCT) {
          ret.struct = rp[0].data;
      }
      let found=0;
      if (ret.prop!==undefined&&ret.prop.type&(PropTypes.FLAG|PropTypes.ENUM)) {
          let prop=ret.prop;
          let p=path.trim();
          if (p.match(/\]$/)&&p.search(/\[/)>=0) {
              let i=p.length-1;
              while (p[i]!=="[") {
                i--;
              }
              let key=p.slice(i+1, p.length-1);
              if (key in prop.values) {
                  key = prop.values[key];
                  found = 1;
              }
              else {
                for (let k in prop.values) {
                    if (prop.values[k]===key) {
                        found = 1;
                    }
                    else 
                      if (prop.values[k]===parseInt(key)) {
                        key = parseInt(key);
                        found = 1;
                    }
                }
              }
              if (!found) {
                  throw new DataPathError(path+": Unknown enum/flag key: "+key);
              }
              else {
                ret.subkey = key;
              }
          }
      }
      if (!found&&ret.prop!==undefined&&ret.prop.type===PropTypes.FLAG) {
          let s=""+rp[1];
          if (s.search(/\&/)>=0) {
              let i=s.search(/\&/);
              s = parseInt(s.slice(i+1, s.length).trim());
          }
          ret.subkey = parseInt(s);
          for (let k in ret.prop.keys) {
              if (ret.prop.keys[k]==ret.subkey) {
                  ret.subkey = k;
                  break;
              }
          }
      }
      return ret;
    }
     setValue(ctx, path, val) {
      return this.api.set_prop(ctx, path, val);
    }
     getValue(ctx, path) {
      return this.api.get_prop(ctx, path);
    }
  }
  _ESClass.register(PathUXInterface);
  _es6_module.add_class(PathUXInterface);
  PathUXInterface = _es6_module.add_export('PathUXInterface', PathUXInterface);
}, '/dev/fairmotion/src/core/data_api/data_api_pathux.js');
var data_ops_list;
es6_module_define('data_api_opdefine', ["../../editors/viewport/view2d_ops.js", "../../path.ux/scripts/screen/FrameManager_ops.js", "../../editors/viewport/view2d_editor.js", "../../path.ux/scripts/screen/FrameManager.js", "../../editors/viewport/spline_layerops.js", "../../editors/viewport/transdata.js", "../../../platforms/Electron/theplatform.js", "../../editors/viewport/spline_selectops.js", "../../editors/viewport/spline_animops.js", "../../editors/dopesheet/dopesheet_ops_new.js", "./data_api_pathux.js", "../safe_eval.js", "../../editors/viewport/transform_spline.js", "../../editors/viewport/view2d_spline_ops.js", "../../editors/viewport/spline_editops.js", "../../image/image_ops.js", "../toolops_api.js", "../../editors/viewport/spline_createops.js", "../../editors/viewport/view2d.js", "../../editors/viewport/transform.js"], function _data_api_opdefine_module(_es6_module) {
  var LoadImageOp=es6_import_item(_es6_module, '../../image/image_ops.js', 'LoadImageOp');
  var DeleteVertOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DeleteSegmentOp');
  var DeleteFaceOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DeleteFaceOp');
  var ChangeFaceZ=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ChangeFaceZ');
  var SplitEdgeOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplitEdgeOp');
  var DuplicateOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DuplicateOp');
  var DisconnectHandlesOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DisconnectHandlesOp');
  var SplitEdgePickOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplitEdgePickOp');
  var DeleteKeysOp=es6_import_item(_es6_module, '../../editors/dopesheet/dopesheet_ops_new.js', 'DeleteKeysOp');
  var ToolOp=es6_import_item(_es6_module, '../toolops_api.js', 'ToolOp');
  var ToolMacro=es6_import_item(_es6_module, '../toolops_api.js', 'ToolMacro');
  var ToolFlags=es6_import_item(_es6_module, '../toolops_api.js', 'ToolFlags');
  var UndoFlags=es6_import_item(_es6_module, '../toolops_api.js', 'UndoFlags');
  var EditModes=es6_import_item(_es6_module, '../../editors/viewport/view2d.js', 'EditModes');
  var transform=es6_import(_es6_module, '../../editors/viewport/transform.js');
  var spline_selectops=es6_import(_es6_module, '../../editors/viewport/spline_selectops.js');
  var spline_createops=es6_import(_es6_module, '../../editors/viewport/spline_createops.js');
  var spline_editops=es6_import(_es6_module, '../../editors/viewport/spline_editops.js');
  var spline_animops=es6_import(_es6_module, '../../editors/viewport/spline_animops.js');
  var spline_layerops=es6_import(_es6_module, '../../editors/viewport/spline_layerops.js');
  var FrameManager=es6_import(_es6_module, '../../path.ux/scripts/screen/FrameManager.js');
  var FrameManager_ops=es6_import(_es6_module, '../../path.ux/scripts/screen/FrameManager_ops.js');
  var safe_eval=es6_import(_es6_module, '../safe_eval.js');
  var TransformOp=es6_import_item(_es6_module, '../../editors/viewport/transform.js', 'TransformOp');
  var TranslateOp=es6_import_item(_es6_module, '../../editors/viewport/transform.js', 'TranslateOp');
  var ScaleOp=es6_import_item(_es6_module, '../../editors/viewport/transform.js', 'ScaleOp');
  var RotateOp=es6_import_item(_es6_module, '../../editors/viewport/transform.js', 'RotateOp');
  var TransSplineVert=es6_import_item(_es6_module, '../../editors/viewport/transform_spline.js', 'TransSplineVert');
  var TransData=es6_import_item(_es6_module, '../../editors/viewport/transdata.js', 'TransData');
  var SelectOpBase=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'SelectOpBase');
  var SelectOneOp=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'SelectOneOp');
  var ToggleSelectAllOp=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'ToggleSelectAllOp');
  var SelectLinkedOp=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'SelectLinkedOp');
  var HideOp=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'HideOp');
  var UnhideOp=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'UnhideOp');
  var CircleSelectOp=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'CircleSelectOp');
  var ExtrudeModes=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'ExtrudeModes');
  var ExtrudeVertOp=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'ExtrudeVertOp');
  var CreateEdgeOp=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'CreateEdgeOp');
  var CreateEdgeFaceOp=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'CreateEdgeFaceOp');
  var ImportJSONOp=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'ImportJSONOp');
  var KeyCurrentFrame=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'KeyCurrentFrame');
  var ShiftLayerOrderOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ShiftLayerOrderOp');
  var SplineGlobalToolOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplineGlobalToolOp');
  var SplineLocalToolOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplineLocalToolOp');
  var KeyEdgesOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'KeyEdgesOp');
  var CopyPoseOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'CopyPoseOp');
  var PastePoseOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'PastePoseOp');
  var InterpStepModeOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'InterpStepModeOp');
  var DeleteVertOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DeleteSegmentOp');
  var DeleteFaceOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DeleteFaceOp');
  var ChangeFaceZ=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ChangeFaceZ');
  var DissolveVertOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DissolveVertOp');
  var SplitEdgeOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplitEdgeOp');
  var VertPropertyBaseOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'VertPropertyBaseOp');
  var ToggleBreakTanOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ToggleBreakTanOp');
  var ToggleBreakCurvOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ToggleBreakCurvOp');
  var ConnectHandlesOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ConnectHandlesOp');
  var DisconnectHandlesOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DisconnectHandlesOp');
  var ToggleManualHandlesOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ToggleManualHandlesOp');
  var ShiftTimeOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ShiftTimeOp');
  var DuplicateOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DuplicateOp');
  var SplineMirrorOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplineMirrorOp');
  var AddLayerOp=es6_import_item(_es6_module, '../../editors/viewport/spline_layerops.js', 'AddLayerOp');
  var ChangeLayerOp=es6_import_item(_es6_module, '../../editors/viewport/spline_layerops.js', 'ChangeLayerOp');
  var ChangeElementLayerOp=es6_import_item(_es6_module, '../../editors/viewport/spline_layerops.js', 'ChangeElementLayerOp');
  var RenderAnimOp=es6_import_item(_es6_module, '../../editors/viewport/view2d_spline_ops.js', 'RenderAnimOp');
  var PlayAnimOp=es6_import_item(_es6_module, '../../editors/viewport/view2d_spline_ops.js', 'PlayAnimOp');
  var SessionFlags=es6_import_item(_es6_module, '../../editors/viewport/view2d_editor.js', 'SessionFlags');
  var ExportCanvasImage=es6_import_item(_es6_module, '../../editors/viewport/view2d_ops.js', 'ExportCanvasImage');
  var theplatform=es6_import(_es6_module, '../../../platforms/Electron/theplatform.js');
  var SplitEdgePickOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplitEdgePickOp');
  class QuitFileOp extends ToolOp {
    static  tooldef() {
      return {uiname: "Quit", 
     apiname: "appstate.quit", 
     is_modal: true, 
     inputs: {}, 
     outputs: {}, 
     undoflag: UndoFlags.IGNORE_UNDO}
    }
     start_modal(ctx) {
      super.start_modal(ctx);
      this.end_modal(ctx);
      theplatform.app.quitApp();
    }
  }
  _ESClass.register(QuitFileOp);
  _es6_module.add_class(QuitFileOp);
  data_ops_list = undefined;
  var register_toolops=es6_import_item(_es6_module, './data_api_pathux.js', 'register_toolops');
  window.api_define_ops = function () {
    register_toolops();
    data_ops_list = {"spline.add_layer": function (ctx, args) {
        return new AddLayerOp(args.name);
      }, 
    "spline.change_face_z": function (ctx, args) {
        if (!("offset" in args))
          throw new TinyParserError();
        return new ChangeFaceZ(parseInt(args["offset"]), parseInt(args["selmode"]));
      }, 
    "spline.toggle_break_curvature": function (ctx, args) {
        return new ToggleBreakCurvOp();
      }, 
    "spline.toggle_break_tangents": function (ctx, args) {
        return new ToggleBreakTanOp();
      }, 
    "spline.translate": function (ctx, args) {
        var op=new TranslateOp(EditModes.GEOMETRY, ctx.object);
        if ("datamode" in args) {
            op.inputs.datamode.setValue(args["datamode"]);
        }
        op.inputs.edit_all_layers.setValue(ctx.view2d.edit_all_layers);
        console.log("=====", args, ctx.view2d.session_flag, ctx.view2d.propradius);
        if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
            op.inputs.proportional.setValue(true);
            op.inputs.propradius.setValue(ctx.view2d.propradius);
        }
        return op;
      }, 
    "spline.rotate": function (ctx, args) {
        var op=new RotateOp(EditModes.GEOMETRY, ctx.object);
        if ("datamode" in args) {
            op.inputs.datamode.setValue(args["datamode"]);
        }
        op.inputs.edit_all_layers.setValue(ctx.view2d.edit_all_layers);
        if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
            op.inputs.proportional.setValue(true);
            op.inputs.propradius.setValue(ctx.view2d.propradius);
        }
        return op;
      }, 
    "spline.scale": function (ctx, args) {
        var op=new ScaleOp(EditModes.GEOMETRY, ctx.object);
        if ("datamode" in args) {
            op.inputs.datamode.setValue(args["datamode"]);
        }
        op.inputs.edit_all_layers.setValue(ctx.view2d.edit_all_layers);
        if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
            op.inputs.proportional.setValue(true);
            op.inputs.propradius.setValue(ctx.view2d.propradius);
        }
        return op;
      }, 
    "spline.key_edges": function (ctx, args) {
        return new KeyEdgesOp();
      }, 
    "view2d.export_image": function (ctx, args) {
        return new ExportCanvasImage();
      }, 
    "editor.copy_pose": function (ctx, args) {
        return new CopyPoseOp();
      }, 
    "editor.paste_pose": function (ctx, args) {
        return new PastePoseOp();
      }, 
    "spline.key_current_frame": function (ctx, args) {
        return new KeyCurrentFrame();
      }, 
    "spline.shift_time": function (ctx, args) {
        return new ShiftTimeOp();
      }, 
    "spline.delete_faces": function (ctx, args) {
        return new DeleteFaceOp();
      }, 
    "spline.toggle_manual_handles": function (ctx, args) {
        return new ToggleManualHandlesOp();
      }, 
    "spline.delete_segments": function (ctx, args) {
        return new DeleteSegmentOp();
      }, 
    "spline.delete_verts": function (ctx, args) {
        return new DeleteVertOp();
      }, 
    "spline.dissolve_verts": function (ctx, args) {
        return new DissolveVertOp();
      }, 
    "spline.make_edge": function (ctx, args) {
        return new CreateEdgeOp(ctx.view2d.default_linewidth);
      }, 
    "spline.make_edge_face": function (ctx, args) {
        return new CreateEdgeFaceOp(ctx.view2d.default_linewidth);
      }, 
    "spline.split_edges": function (ctx, args) {
        return new SplitEdgeOp();
      }, 
    "spline.split_pick_edge": function (ctx, args) {
        return new SplitEdgePickOp();
      }, 
    "spline.split_pick_edge_transform": function (ctx, args) {
        let ret=new ToolMacro("spline.split_pick_edge_transform", "Split Segment");
        let tool=new SplitEdgePickOp();
        let tool2=new TranslateOp(undefined, 1|2);
        ret.description = tool.description;
        ret.icon = tool.icon;
        ret.add_tool(tool);
        ret.add_tool(tool2);
        tool.on_modal_end = () =>          {
          let ctx=tool.modal_ctx;
          tool2.user_start_mpos = tool.mpos;
          console.log("                 on_modal_end successfully called", tool2.user_start_mpos);
        }
        return ret;
      }, 
    "spline.toggle_step_mode": function (ctx, args) {
        return new InterpStepModeOp();
      }, 
    "spline.mirror_verts": function (ctx, args) {
        return new SplineMirrorOp();
      }, 
    "spline.duplicate_transform": function (ctx, args) {
        var tool=new DuplicateOp();
        var macro=new ToolMacro("duplicate_transform", "Duplicate");
        macro.description = tool.description;
        macro.add_tool(tool);
        macro.icon = tool.icon;
        var transop=new TranslateOp(ctx.view2d.mpos, 1|2);
        macro.add_tool(transop);
        return macro;
      }, 
    "spline.toggle_select_all": function (ctx, args) {
        var op=new ToggleSelectAllOp();
        return op;
      }, 
    "spline.connect_handles": function (ctx, args) {
        return new ConnectHandlesOp();
      }, 
    "spline.disconnect_handles": function (ctx, args) {
        return new DisconnectHandlesOp();
      }, 
    "spline.hide": function (ctx, args) {
        return new HideOp(args.selmode, args.ghost);
      }, 
    "spline.unhide": function (ctx, args) {
        return new UnhideOp(args.selmode, args.ghost);
      }, 
    "image.load_image": function (ctx, args) {
        return new LoadImageOp(args.datapath, args.name);
      }, 
    "spline.select_linked": function (ctx, args) {
        if (!("vertex_eid" in args)) {
            throw new Error("need a vertex_eid argument");
        }
        var op=new SelectLinkedOp();
        op.inputs.vertex_eid.setValue(args.vertex_eid);
        return op;
      }, 
    "anim.delete_keys": function (ctx, args) {
        return new DeleteKeysOp();
      }, 
    "view2d.circle_select": function (ctx, args) {
        return new CircleSelectOp(ctx.view2d.selectmode);
      }, 
    "view2d.render_anim": function (Ctx, args) {
        return new RenderAnimOp();
      }, 
    "view2d.play_anim": function (Ctx, args) {
        return new PlayAnimOp();
      }, 
    "appstate.open": function (ctx, args) {
        return new FileOpenOp();
      }, 
    "appstate.open_recent": function (ctx, args) {
        return new FileOpenRecentOp();
      }, 
    "appstate.export_svg": function (ctx, args) {
        return new FileSaveSVGOp();
      }, 
    "appstate.export_al3_b64": function (ctx, args) {
        return new FileSaveB64Op();
      }, 
    "appstate.save": function (ctx, args) {
        return new FileSaveOp();
      }, 
    "appstate.save_as": function (ctx, args) {
        return new FileSaveAsOp();
      }, 
    "appstate.quit": function (ctx, args) {
        return new QuitFileOp();
      }, 
    "screen.area_split_tool": function (ctx, args) {
        return new SplitAreasTool(g_app_state.screen);
      }, 
    "screen.hint_picker": function (ctx, args) {
        return new HintPickerOp();
      }, 
    "object.toggle_select_all": function (ctx, args) {
        return new ToggleSelectObjOp("auto");
      }, 
    "object.translate": function (ctx, args) {
        return new TranslateOp(EditModes.OBJECT, ctx.object);
      }, 
    "object.rotate": function (ctx, args) {
        return new RotateOp(EditModes.OBJECT);
      }, 
    "object.scale": function (ctx, args) {
        return new ScaleOp(EditModes.OBJECT);
      }, 
    "object.duplicate": function (ctx, args) {
        return new ObjectDuplicateOp(ctx.scene.objects.selected);
      }, 
    "object.set_parent": function (ctx, args) {
        var op=new ObjectParentOp();
        op.flag|=ToolFlags.USE_DEFAULT_INPUT;
        return op;
      }, 
    "object.delete_selected": function (ctx, args) {
        var op=new ObjectDeleteOp();
        op.flag|=ToolFlags.USE_DEFAULT_INPUT;
        return op;
      }}
  }
}, '/dev/fairmotion/src/core/data_api/data_api_opdefine.js');
