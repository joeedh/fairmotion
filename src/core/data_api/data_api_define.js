import {DataTypes} from '../lib_api.js';
import {EditModes, View2DHandler} from '../../editors/viewport/view2d.js';
import {ImageFlags, Image, ImageUser} from '../imageblock.js';
import {AppSettings} from '../UserSettings.js';
import {FullContext} from "../context.js";

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
import {VDAnimFlags} from '../frameset.js';

import {ExtrudeModes} from '../../editors/viewport/spline_createops.js';
import {SplineLayerFlags} from '../../curve/spline_element_array.js';
import {Material, SplineFace, SplineSegment, SplineVertex} from "../../curve/spline_types.js";
import {CurveEditor} from "../../editors/curve/CurveEditor.js";
import {SceneObject} from "../../scene/sceneobject.js";
import {DopeSheetEditor} from "../../editors/dopesheet/DopeSheetEditor.js";
import {SettingsEditor} from "../../editors/settings/SettingsEditor.js";

var SelModes = {
  VERTEX: SelMask.VERTEX,
  SEGMENT: SelMask.SEGMENT,
  FACE: SelMask.FACE,
  OBJECT: SelMask.OBJECT
};

export var selmask_enum = new EnumProperty(undefined, SelModes, "selmask_enum", "Selection Mode");
var selmask_ui_vals = {};

for (var k in SelModes) {
  var s = k[0].toUpperCase() + k.slice(1, k.length).toLowerCase();
  var slst = s.split("_");
  var s2 = ""
  
  for (var i = 0; i < slst.length; i++) {
    s2 += slst[i][0].toUpperCase() + slst[i].slice(1, slst[i].length).toLowerCase() + " ";
  }
  s = s2.trim();
  
  selmask_ui_vals[k] = s;
}

//selmask_enum.
selmask_enum.flag |= TPropFlags.USE_CUSTOM_GETSET | TPropFlags.NEEDS_OWNING_OBJECT;
selmask_enum.ui_value_names = selmask_ui_vals;
selmask_enum.add_icons({
  VERTEX: Icons.VERT_MODE,
  SEGMENT: Icons.EDGE_MODE,
  FACE: Icons.FACE_MODE,
  OBJECT: Icons.OBJECT_MODE
});
selmask_enum.userGetData = function(prop, val, val2) {
  //console.log("selmask_enum.userGetData", this, val);
  //console.log(this.constructor.name, this.selectmode & (~SelMask.HANDLE), val, val2, "||");
  return this.selectmode & (~SelMask.HANDLE);
};
selmask_enum.userSetData = function(prop, val) {
  console.log("selmask_enum.userSetData", this, prop, val);
  this.selectmode = val | (this.selectmode & SelMask.HANDLE);

  return this.selectmode;
};

import * as data_api from './data_api.js';

var DataPath = data_api.DataPath;
var DataStruct = data_api.DataStruct;
var DataStructArray = data_api.DataStructArray;

//create unit enum static property
var units = Unit.units;
var unit_enum = {}
var unit_ui_vals = {};

for (var i = 0; i < units.length; i++) {
  var s = units[i].suffix_list[0];
  unit_enum[s] = s
  unit_ui_vals[s] = s;
}

Unit.units_enum = new EnumProperty("in", unit_enum, "unit_enum", "Units");
Unit.units_enum.ui_value_names = unit_ui_vals;

var SettingsUpdate = function () {
  g_app_state.session.settings.save();
}

var SettingsUpdateRecalc = function () {
  g_app_state.session.settings.save();
}

var SettingsStruct = undefined;

function api_define_settings() {
  unitsys_enum = new EnumProperty("imperial", ["imperial", "metric"],
    "system", "System",
    "Metric or Imperial");
  
  var units_enum = Unit.units_enum.copy();
  units_enum.apiname = "default_unit";
  units_enum.uiname = "Default Unit";
  
  units_enum.update = unitsys_enum.update = SettingsUpdateRecalc;
  
  SettingsStruct = new DataStruct([
    new DataPath(unitsys_enum, "unit_system", "unit_scheme", true),
    new DataPath(units_enum, "default_unit", "unit", true)
  ], AppSettings);
  
  return SettingsStruct;
}

var SettingsEditorStruct = undefined;

function api_define_seditor() {
  SettingsEditorStruct = new DataStruct([], SettingsEditor);
  
  return SettingsEditorStruct;
}

/*this system needs a minor amount of refactoring, e.g.
 get rid the is_prop parameter to DataPath*/
/*
 var selectmode_enum = new EnumProperty("FACE",
 {
 VERT : EditModes.VERT,
 EDGE : EditModes.EDGE,
 FACE : EditModes.FACE,
 OBJECT : EditModes.OBJECT
 },
 "selmode", "Select Mode", "Selection mode");

 selectmode_enum.add_icons({
 VERT : Icons.VERT_SEL,
 EDGE : Icons.EDGE_SEL,
 FACE : Icons.FACE_SEL,
 OBJECT : Icons.OBJECT_SEL
 });

 selectmode_enum.ui_value_names = {
 VERT: "Vertices",
 EDGE: "Edges",
 FACE: "Faces",
 OBJECT : "Object"
 };

 import {CsgModes} from 'object';

 var csg_mode_enum = new EnumProperty("SUBTRACT",
 {
 SUBTRACT : CsgModes.SUBTRACT,
 INTERSECT : CsgModes.INTERSECT,
 UNION : CsgModes.UNION
 },
 "csg_mode", "CSG Mode", "CSG Mode");

 csg_mode_enum.ui_value_names = {
 SUBTRACT : "Subtract",
 INTERSECT : "Intersect",
 UNION : "Union"
 }
 */

var OpsEditorStruct = undefined;

function api_define_opseditor() {
  var filter_sel = new BoolProperty(0, "filter_sel", "Filter Sel", "Exclude selection ops");
  filter_sel.icon = Icons.FILTER_SEL_OPS;
  
  OpsEditorStruct = new DataStruct([
    new DataPath(filter_sel, "filter_sel", "filter_sel", true)
  ], OpStackEditor);
  
  return OpsEditorStruct;
}

//*/


var AnimKeyStruct = undefined;

function api_define_animkey() {
  if (AnimKeyStruct != undefined)
    return AnimKeyStruct;
  
  AnimKeyStruct = new DataStruct([
    new DataPath(new IntProperty(-1, "id", "id"), "id", "id", true)
  ], AnimKey);
  
  return AnimKeyStruct;
}

api_define_animkey();
window.AnimKeyStruct = AnimKeyStruct;
window.AnimKeyStruct2 = AnimKeyStruct;

var datablock_structs = {};

var spline_flagprop = new FlagProperty(2, SplineFlags, undefined, "Flags", "Flags");
spline_flagprop["BREAK_CURVATURES"] = "Less Smooth";
spline_flagprop.descriptions["BREAK_CURVATURES"] = "Allows curve to more tightly bend at this point";
spline_flagprop.ui_key_names["BREAK_TANGENTS"] = "Sharp Corner";

spline_flagprop.addIcons({
  BREAK_TANGENTS : Icons.EXTRUDE_MODE_G0,
  BREAK_CURVATURES : Icons.EXTRUDE_MODE_G1,
});

//returns list of paths to concat to DataBlock subclass struct
function api_define_DataBlock() {
  api_define_animkey();
  
  var array = new DataStructArray(
    function getstruct(item) {
      return AnimKeyStruct2;
    },
    function itempath(key) {
      return "[" + key + "]";
    },
    function getitem(key) {
      console.log("get key", key, this);
      return this[key];
    },
    function getiter() {
      return new obj_value_iter(this);
    },
    function getkeyiter() {
      return new obj_key_iter(this);
    },
    function getlength() {
      var tot = 0.0;
      for (var k in this) {
        tot++;
      }
      
      return tot;
    }
  );
  
  return [
    new DataPath(array, "animkeys", "lib_anim_idmap", true)
  ];
}

var ImageUserStruct = undefined;

function api_define_imageuser() {
  var image = new DataRefProperty(undefined, [DataTypes.IMAGE], "image", "Image");
  
  var off = new Vec2Property(undefined, "offset", "Offset");
  var scale = new Vec2Property(undefined, "scale", "Scale");
  
  scale.range = [0.0001, 90.0];
  
  off.api_update = scale.api_update = function api_update(ctx, path) {
    window.redraw_viewport();
  }
  
  ImageUserStruct = new DataStruct([
    new DataPath(image, "image", "image", true),
    new DataPath(off, "off", "off", true),
    new DataPath(scale, "scale", "scale", true)
  ], ImageUser);
  
  return ImageUserStruct;
}

function api_define_view2d() {
  var half_pix_size = new BoolProperty(0, "half_pix_size", "half_pix_size", "Half Resolution (faster)");
  half_pix_size.icon = Icons.HALF_PIXEL_SIZE;

  var only_render = new BoolProperty(0, "only_render", "Hide Controls", "Hide Controls");
  only_render.api_update = function (ctx, path) {
    window.redraw_viewport();
  }
  only_render.icon = Icons.ONLY_RENDER;
  
  var draw_small_verts = new BoolProperty(0, "draw_small_verts", "Small Points", "Small Control Points");
  draw_small_verts.api_update = function (ctx, path) {
    window.redraw_viewport();
  };
  draw_small_verts.icon = Icons.DRAW_SMALL_VERTS;
  
  var extrude_mode = new EnumProperty(0, ExtrudeModes, "extrude_mode", "New Line Mode", "New Line Mode");
  extrude_mode.add_icons({
    SMOOTH : Icons.EXTRUDE_MODE_G2,
    LESS_SMOOTH : Icons.EXTRUDE_MODE_G1,
    BROKEN : Icons.EXTRUDE_MODE_G0
  });

  //use same tooltip for all items, their icons are explanatory enough hopefully
  for (let k in ExtrudeModes) {
    extrude_mode.descriptions[k] = extrude_mode.description;
  }

  var linewidth = new FloatProperty(2.0, "default_linewidth", "Line Wid");
  linewidth.range = [0.01, 100];
  
  var zoomprop = new FloatProperty(1, "zoom", "Zoom");
  
  zoomprop.update = function (ctx, path) {
    this.ctx.view2d.set_zoom(this.data);
  }
  zoomprop.range = zoomprop.real_range = zoomprop.ui_range = [0.1, 100];
  zoomprop.expRate = 1.2;
  zoomprop.step = 0.1;
  zoomprop.decimalPlaces = 3;

  var draw_bg_image = new BoolProperty(0, "draw_bg_image", "Draw Image");
  
  var draw_video = new BoolProperty(0, "draw_video", "Draw Video");
  draw_video.update = draw_bg_image.update = function () {
    window.redraw_viewport();
  }
  
  var tool_mode = new EnumProperty("SELECT", ToolModes, "select", "Active Tool", "Active Tool");
  
  tool_mode.add_icons({
    SELECT: Icons.CURSOR_ARROW,
    APPEND: Icons.APPEND_VERTEX,
    RESIZE: Icons.RESIZE,
    ROTATE: Icons.ROTATE,
    PEN   : Icons.PEN_TOOL
  });
  
  var tweak_mode = new BoolProperty(0, "tweak_mode", "Tweak Mode");
  tweak_mode.icon = Icons.CURSOR_ARROW;
  
  var uinames = {};
  for (var key in SelMask) {
    var k2 = key[0].toUpperCase() + key.slice(1, key.length).toLowerCase();
    k2 = k2.replace(/\_/g, " ");
    
    uinames[key] = "Show " + k2 + "s";
  }
  
  var selmask_mask = new FlagProperty(1, SelMask, uinames, undefined, "Sel Mask");
  selmask_mask.addIcons({
    VERTEX: Icons.VERT_MODE,
    HANDLE : Icons.SHOW_HANDLES,
    SEGMENT: Icons.EDGE_MODE,
    FACE: Icons.FACE_MODE,
    OBJECT: Icons.OBJECT_MODE
  });

  selmask_mask.ui_key_names = uinames;
  
  selmask_mask.update = function () {
    window.redraw_viewport();
  }
  
  var background_color = new Vec3Property(undefined, "background_color", "Background");
  background_color.subtype = PropSubTypes.COLOR;
  
  var default_stroke = new Vec4Property(undefined, "default_stroke", "Stroke");
  var default_fill = new Vec4Property(undefined, "default_fill", "Fill");
  default_stroke.subtype = default_fill.subtype = PropSubTypes.COLOR;
  
  background_color.update = function () {
    window.redraw_viewport();
  };
  
  let draw_faces = new BoolProperty(0, "draw_faces", "Show Faces");
  draw_faces.icon = Icons.MAKE_POLYGON;

  let enable_blur = new BoolProperty(0, "enable_blur", "Blur");
  enable_blur.icon = Icons.ENABLE_BLUR;

  draw_faces.update = enable_blur.update = function() {
    this.ctx.spline.regen_sort();
    redraw_viewport();
  };

  let edit_all_layers = new BoolProperty(0, "edit_all_layers", "Edit All Layers");

  let show_animpath_prop = new BoolProperty(0, "draw_anim_paths", "Show Animation Paths", "Edit Animation Keyframe Paths");
  show_animpath_prop.icon = Icons.SHOW_ANIMPATHS;

  let draw_normals = new BoolProperty(0, "draw_normals", "Show Normals", "Show Normal Comb");
  draw_normals.icon = Icons.DRAW_NORMALS;


  draw_normals.update = edit_all_layers.update = function() {
    redraw_viewport();
  };

  window.View2DStruct = new DataStruct([
    new DataPath(edit_all_layers, "edit_all_layers", "edit_all_layers", true),
    new DataPath(half_pix_size, "half_pix_size", "half_pix_size", true),
    new DataPath(background_color, "background_color", "background_color", true),
    new DataPath(default_stroke, "default_stroke", "default_stroke", true),
    new DataPath(default_fill, "default_fill", "default_fill", true),
    new DataPath(tool_mode, "toolmode", "toolmode", true),
    new DataPath(draw_small_verts, "draw_small_verts", "draw_small_verts", true),
    new DataPath(selmask_enum.copy(), "selectmode", "selectmode", true),
    new DataPath(selmask_mask.copy(), "selectmask", "selectmode", true),
    new DataPath(only_render, "only_render", "only_render", true),
    new DataPath(draw_bg_image, "draw_bg_image", "draw_bg_image", true),
    new DataPath(tweak_mode, "tweak_mode", "tweak_mode", true),
    new DataPath(enable_blur, "enable_blur", "enable_blur", true),
    new DataPath(draw_faces, "draw_faces", "draw_faces", true),
    new DataPath(draw_video, "draw_video", "draw_video", true),
    new DataPath(draw_normals,"draw_normals", "draw_normals", true),
    new DataPath(show_animpath_prop,  "draw_anim_paths", "draw_anim_paths", true),
    new DataPath(zoomprop, "zoom", "zoom", true),
    new DataPath(api_define_material(), "active_material", "active_material", true),
    new DataPath(linewidth, "default_linewidth", "default_linewidth", true),
    new DataPath(extrude_mode, "extrude_mode", "extrude_mode", true),
    new DataPath(new BoolProperty(0, "pin_paths", "Pin Paths", "Remember visible animation paths"), "pin_paths", "pin_paths", true),
    new DataPath(api_define_imageuser(), "background_image", "background_image", true)
  ], View2DHandler)
  
  return View2DStruct;
}

var MaterialStruct;

function api_define_material() {
  var fillclr = new Vec4Property(new Vector4(), "fill", "fill", "Fill Color");
  var strokeclr = new Vec4Property(new Vector4(), "stroke", "stroke", "Stroke Color");
  
  var update_base = function (material : Material) {
    //console.warn("material.update called", material);
    material.update();
    window.redraw_viewport();
  }
  
  var flag = new FlagProperty(1, MaterialFlags, undefined, "material flags", "material flags");
  flag.update = update_base;

  var fillpath = new DataPath(new BoolProperty(false, "fill_over_stroke", "fill_over_stroke",
    "fill_over_stroke"), "fill_over_stroke", "fill_over_stroke", true);
  fillclr.subtype = strokeclr.subtype = PropSubTypes.COLOR;
  
  var linewidth = new FloatProperty(1, "linewidth", "linewidth", "Line Width");
  linewidth.range = [0.1, 200];
  linewidth.expRate = 1.75;
  //linewidth.baseUnit = linewidth.displayUnit = "none";
  linewidth.step = 0.25;
  
  fillclr.update = strokeclr.update = linewidth.update = blur.update = update_base;
  
  //fillclr.flag |= TPropFlags.USE_UNDO;
  //strokeclr.flag |= TPropFlags.USE_UNDO;
  //linewidth.flag |= TPropFlags.USE_UNDO;
  
  MaterialStruct = new DataStruct([
    new DataPath(fillclr, "fillcolor", "fillcolor", true),
    new DataPath(linewidth, "linewidth", "linewidth", true),
    new DataPath(flag, "flag", "flag", true)
  ], Material);
  
  MaterialStruct.Color4("strokecolor", "strokecolor", "Stroke", "Stroke color").OnUpdate(update_base);
  MaterialStruct.Float("blur", "blur", "Blur", "Amount of blur").Range(0, 800).Step(0.5).OnUpdate(update_base);
  
  return MaterialStruct;
}

var SplineFaceStruct;

function api_define_spline_face() {
  let flagprop = spline_flagprop.copy();

  SplineFaceStruct = new DataStruct([
    new DataPath(new IntProperty(0, "eid", "eid", "eid"), "eid", "eid", true),
    new DataPath(api_define_material(), "mat", "mat", true),
    new DataPath(flagprop, "flag", "flag", true)
  ], SplineFace);
  
  return SplineFaceStruct;
}

var SplineVertexStruct;

function api_define_spline_vertex() {
  var coprop = new Vec3Property(undefined, "co", "Co", "Coordinates");
  let flagprop = spline_flagprop.copy();

  flagprop.update = function (owner) {
    this.ctx.spline.regen_sort();

    console.log("vertex update", owner);
    
    if (owner !== undefined) {
      owner.flag |= SplineFlags.UPDATE;
    }
    this.ctx.spline.propagate_update_flags();
    this.ctx.spline.resolve = 1;
    
    window.redraw_viewport();
  }

  let width = new FloatProperty(0,"width", "width", "Width");
  width.baseUnit = width.displayUnit = "none";
  let shift = new FloatProperty(0,"shift", "shift", "Shift");
  shift.baseUnit = shift.displayUnit = "none";

  width.setRange(-50, 200.0);
  width.update = function(vert) {
    vert.flag |= SplineFlags.REDRAW;

    window.redraw_viewport();
  }

  shift.setRange(-2.0, 2.0);
  shift.update = function(vert) {
    vert.flag |= SplineFlags.REDRAW;

    window.redraw_viewport();
  }


  SplineVertexStruct = new DataStruct([
    new DataPath(new IntProperty(0, "eid", "eid", "eid"), "eid", "eid", true),
    new DataPath(flagprop, "flag", "flag", true),
    new DataPath(coprop, "co", "", true),
    new DataPath(width, "width", "width", true),
    new DataPath(shift, "shift", "shift", true)
  ], SplineVertex);
  
  return SplineVertexStruct;
}

var SplineSegmentStruct;

function api_define_spline_segment() {
  let flagprop = spline_flagprop.copy();
  
  flagprop.update = function (segment) {
    new Context().spline.regen_sort();
    segment.flag |= SplineFlags.REDRAW;
    console.log(segment);
    
    window.redraw_viewport();
  }
  
  var zprop = new FloatProperty(0, "z", "z", "z");
  
  let zpath = new DataPath(zprop, "z", "z", true);
  zpath.update = function (segment, old_value, changed) {
    //XXX
    if (segment != undefined && old_value != undefined) {
      changed = segment.z != old_value;
    }
    
    if (!changed) {
      return;
    }
    
    //in theory, draw system shouldn't need explicit sort here.
    //still, let's only disable it during animation playback
    if (!(g_app_state.modalstate & ModalStates.PLAYING)) {
      this.ctx.frameset.spline.regen_sort();
      this.ctx.frameset.pathspline.regen_sort();
    }
    
    segment.flag |= SplineFlags.REDRAW;
    //console.log(segment);
    
    /*
     var s = this.boundobj;
     var path = s.dag_get_path();

     path = path.slice(0, path.search(/\.segments/)).trim();
     var spline = g_app_state.pathcontroller.getObject(new Context(), path);

     if (spline == undefined) {
     warn("Warning, could not get spline to call regen_sort() on!", path, s);
     return;
     }

     spline.regen_sort();
     */
  }

  let w1 = new FloatProperty(0,"w1", "w1", "Width 1");
  let shift1 = new FloatProperty(0,"w1", "w1", "Width 1");
  let w2 = new FloatProperty(0,"w2", "w2", "Width 2");
  let shift2 = new FloatProperty(0,"w2", "w2", "Width 2");

  w1.baseUnit = w2.baseUnit = shift1.baseUnit = shift2.baseUnit = "none";
  w1.displayUnit = w2.displayUnit = shift1.displayUnit = shift2.displayUnit = "none";

  w1.update = shift1.update = w2.update = shift2.update = function(segment) {
    g_app_state.ctx.spline.regen_sort();
    segment.mat.update();
    segment.flag |= SplineFlags.REDRAW;

    window.redraw_viewport();
  }

  SplineSegmentStruct = new DataStruct([
    new DataPath(w1, "w1", "w1", true),
    new DataPath(w2, "w2", "w2", true),
    new DataPath(shift1, "shift1", "shift1", true),
    new DataPath(shift2, "shift2", "shift2", true),
    new DataPath(new IntProperty(0, "eid", "eid", "eid"), "eid", "eid", true),
    new DataPath(flagprop, "flag", "flag", true),
    new DataPath(new BoolProperty(0, "renderable", "renderable"), "renderable", "renderable", true),
    new DataPath(api_define_material(), "mat", "mat", true),
    zpath
  ], SplineSegment);
  
  return SplineSegmentStruct;
}

var SplineLayerStruct;

function api_define_spline_layer_struct() {
  var flag = new FlagProperty(2, SplineLayerFlags);
  
  flag.descriptions = {
    MASK: "Use previous layer as a mask"
  };
  
  flag.ui_key_names.MASK = flag.ui_value_names[SplineLayerFlags.MASK] = "Mask To Prev";
  
  flag.update = function () {
    window.redraw_viewport();
  }
  
  SplineLayerStruct = new DataStruct([
    new DataPath(new IntProperty(0, "id", "id", "id"), "id", "id", true),
    new DataPath(new StringProperty("", "name", "name", "name"), "name", "name", true),
    new DataPath(flag, "flag", "flag", true)
  ]);
  
  window.SplineLayerStruct = SplineLayerStruct;
}

function api_define_spline() {
  api_define_spline_layer_struct();
  
  var layerset = new DataStructArray(
    function getstruct(item) {
      return SplineLayerStruct;
    },
    function itempath(key) {
      return ".idmap[" + key + "]";
    },
    function getitem(key) {
      return this.idmap[key];
    },
    function getiter() {
      return this[Symbol.iterator]()
    },
    function getkeyiter() {
      var keys = Object.keys(this.idmap);
      var ret = new GArray();
      
      for (var i = 0; i < keys.length; i++) {
        ret.push(keys[i]);
      }
      
      return ret;
    },
    function getlength() {
      return this.length;
    });
  
  function define_editable_element_array(the_struct, name) {
    window.getstruct1 = undefined;
    eval(`
    window.getstruct1 = function getstruct(item) {
    
      return ${name};
      
    } 
    `);

    return new DataStructArray(
      getstruct1,
      function itempath(key) {
        return ".local_idmap[" + key + "]";
      },
      function getitem(key) {
        return this.local_idmap[key];
      },
      function getiter() {
        return this.editable(g_app_state.ctx)[Symbol.iterator]()
      },
      function getkeyiter(ctx) {
        var keys = new GArray();
        
        for (let e of this.editable(ctx)) {
          keys.push(e.eid);
        }
        
        return keys;
      },
      
      function getlength() {
        let len = 0;
        
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

    return new DataStructArray(
      getstruct1,
      function itempath(key) {
        return ".local_idmap[" + key + "]";
      },
      function getitem(key) {
        return this.local_idmap[key];
      },
      function getiter() {
        return this.selected.editable(g_app_state.ctx)[Symbol.iterator]()
      },
      function getkeyiter(ctx) {
        var keys = new GArray();

        for (let e of this.editable(ctx)) {
          keys.push(e.eid);
        }

        return keys;
      },

      function getlength() {
        let len = 0;

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

    return new DataStructArray(
      getstruct1,
      function itempath(key) {
        return ".local_idmap[" + key + "]";
      },
      function getitem(key) {
        return this.local_idmap[key];
      },
      function getiter() {
        return this[Symbol.iterator]()
      },
      function getkeyiter() {
        var keys = Object.keys(this.local_idmap);
        var ret = new GArray();
        
        for (var i = 0; i < keys.length; i++) {
          ret.push(keys[i]);
        }
        
        return ret;
      },
      function getlength() {
        return this.length;
      });
  }
  
  var SplineStruct = new DataStruct(api_define_DataBlock().concat([
    new DataPath(api_define_spline_face(), "active_face", "faces.active", true),
    new DataPath(api_define_spline_segment(), "active_segment", "segments.active", true),
    new DataPath(api_define_spline_vertex(), "active_vertex", "verts.active", true),
    new DataPath(define_element_array(SplineFaceStruct, "SplineFaceStruct"), "faces", "faces", true),
    new DataPath(define_element_array(SplineSegmentStruct, "SplineSegmentStruct"), "segments", "segments", true),
    new DataPath(define_element_array(SplineVertexStruct, "SplineVertexStruct"), "verts", "verts", true),
    new DataPath(define_element_array(SplineVertexStruct, "SplineVertexStruct"), "handles", "handles", true),

    new DataPath(define_editable_element_array(SplineFaceStruct, "SplineFaceStruct"), "editable_faces", "faces", true),
    new DataPath(define_editable_element_array(SplineSegmentStruct, "SplineSegmentStruct"), "editable_segments", "segments", true),
    new DataPath(define_editable_element_array(SplineVertexStruct, "SplineVertexStruct"), "editable_verts", "verts", true),
    new DataPath(define_editable_element_array(SplineVertexStruct, "SplineVertexStruct"), "editable_handles", "handles", true),

    new DataPath(define_selected_element_array(SplineFaceStruct, "SplineFaceStruct"), "selected_facese", "faces", true),
    new DataPath(define_selected_element_array(SplineSegmentStruct, "SplineSegmentStruct"), "selected_segments", "segments", true),
    new DataPath(define_selected_element_array(SplineVertexStruct, "SplineVertexStruct"), "selected_verts", "verts", true),
    new DataPath(define_selected_element_array(SplineVertexStruct, "SplineVertexStruct"), "selected_handles", "handles", true),

    new DataPath(layerset, "layerset", "layerset", true),
    new DataPath(SplineLayerStruct, "active_layer", "layerset.active", true)
  ]));
  
  datablock_structs[DataTypes.SPLINE] = SplineStruct;
  
  return SplineStruct;
}

function api_define_vertex_animdata() {
  var VertexAnimData = new DataStruct([]);

  VertexAnimData.Flags(VDAnimFlags, "animflag", "animflag", "Animation Flags", "Keyframe Settings");
  VertexAnimData.Int("owning_vertex", "eid", "Owning Vertex", "Vertex in drawspline that owns this animation path");
  
  return VertexAnimData;
}

function api_define_frameset() {
  let animdata_struct = api_define_vertex_animdata();
  
  function define_animdata_array() {
    return new DataStructArray(
      function getstruct(item) {
        return animdata_struct;
      },
      function itempath(key) {
        return "[" + key + "]";
      },
      function getitem(key) {
        return this[key];
      },
      function getiter() {
        let this2 = this;

        return (function*() {
          for (let k in this2) {
            yield this2[k];
          }
        })();
      },
      
      function getkeyiter() {
        var keys = Object.keys(this);
        var ret = new GArray();
        
        for (var i = 0; i < keys.length; i++) {
          ret.push(keys[i]);
        }
        
        return ret;
      },
      
      function getlength() {
        let i = 0;
        
        for (let k in this) {
          i++;
        }
        
        return i;
      });
  }
  
  var FrameSetStruct = new DataStruct(api_define_DataBlock().concat([
    new DataPath(api_define_spline(), "drawspline", "spline", true),
    new DataPath(api_define_spline(), "pathspline", "pathspline", true),
    new DataPath(define_animdata_array(), "keypaths", "vertex_animdata", true),
    new DataPath(animdata_struct, "active_keypath", "active_animdata", true)
  ]));
  
  datablock_structs[DataTypes.FRAMESET] = FrameSetStruct;
  
  return FrameSetStruct;
}


var SceneStruct = undefined;

function api_define_sceneobject() {
  var SceneObjectStruct = new DataStruct();

  SceneObjectStruct.Vector2("loc", "loc", "Position", "Position");
  SceneObjectStruct.Vector2("scale", "scale", "Scale", "Scale");
  SceneObjectStruct.Float("rot", "rot", "Rotation", "Rotation");
  SceneObjectStruct.add(new DataPath(api_define_frameset(), "frameset", "data", true));
  SceneObjectStruct.Bool("edit_all_layers", "edit_all_layers", "Edit All Layers", "Edit All Layers");
  
  return SceneObjectStruct;
}

function api_define_sceneobjects() {
  let SceneObjectStruct = api_define_sceneobject();

  let objectarray = new DataStructArray(
    function getstruct(item) {
      return SceneObjectStruct;
    },
    function itempath(key) {
      return ".object_idmap[" + key + "]";
    },
    function getitem(key) {
      console.log("get key", key, this);
      return this.object_idmap[key];
    },
    function getiter() {
      return new obj_value_iter(this.object_idmap);
    },
    function getkeyiter() {
      return new obj_key_iter(this.object_idmap);
    },
    function getlength() {
      return this.objects.length;
    });

  return objectarray;
}

function api_define_scene() {
  var name = new StringProperty("", "name", "name", "Name", TPropFlags.LABEL);
  var frame = new IntProperty(0, "frame", "Frame", "Frame", TPropFlags.LABEL);
  
  frame.range = [1, 10000];
  frame.step = 1;
  frame.expRate = 1.5;

  frame.update = (owner, old) => {
    let time = owner.time;
    owner.time = old;
    owner.change_time(g_app_state.ctx, time);
    window.redraw_viewport();
  }

  var SceneStruct = new DataStruct(api_define_DataBlock().concat([
    new DataPath(name, "name", "name", true),
    new DataPath(frame, "frame", "time", true),
    new DataPath(api_define_sceneobjects(), "objects", "objects", true),
    new DataPath(api_define_sceneobject(), "active_object", "objects.active", true)
  ]));
  
  datablock_structs[DataTypes.SCENE] = SceneStruct;
  
  return SceneStruct;
}

var DopeSheetStruct = undefined;

function api_define_dopesheet() {
  var selected_only = new BoolProperty(false, "selected_only", "Selected Only", "Show only keys of selected vertices");
  
  //this one is a dynamic "smart" property, implemented with get/setters in the DopeSheetEditor class itself
  var pinned = new BoolProperty(false, "pinned", "Pin", "Pin view");
  
  selected_only.update = function (owner) {
    owner.rebuild();
  }

  let timescale = new FloatProperty(1.0, "timescale", "timescale", "timescale");
  timescale.update = function(owner) {
    owner.updateKeyPositions();
  }
  
  DopeSheetStruct = new DataStruct([
    new DataPath(selected_only, "selected_only", "selected_only", true),
    new DataPath(pinned, "pinned", "pinned", true),
    new DataPath(timescale, "timescale", "timescale")
  ], DopeSheetEditor);
  
  return DopeSheetStruct;
}

var CurveEditStruct = undefined;

function api_define_editcurve() {
  var selected_only = new BoolProperty(false, "selected_only", "Selected Only", "Show only keys of selected vertices");
  
  //this one is a dynamic "smart" property, implemented with get/setters in the DopeSheetEditor class itself
  var pinned = new BoolProperty(false, "pinned", "Pin", "Pin view");
  
  selected_only.update = function () {
    if (this.ctx != undefined && this.ctx.editcurve != undefined)
      this.ctx.editcurve.do_full_recalc();
  }
  
  CurveEditStruct = new DataStruct([
    new DataPath(selected_only, "selected_only", "selected_only", true),
    new DataPath(pinned, "pinned", "pinned", true)
  ], CurveEditor);
  
  return CurveEditStruct;
}

var ObjectStruct = undefined;

function api_define_object() {
  
  var name = new StringProperty("", "name", "name", "Name", TPropFlags.LABEL);
  var ctx_bb = new Vec3Property(new Vector3(), "dimensions", "Dimensions", "Editable dimensions");
  
  ctx_bb.flag |= TPropFlags.USE_UNDO;
  
  //contextual, editable bounding box
  //(well, dimensions).
  ctx_bb.update = function () {
    if (this.ctx.mesh !== undefined)
      this.ctx.mesh.regen_render();
    if (this.ctx.view2d !== undefined && this.ctx.view2d.selectmode & EditModes.GEOMETRY) {
      this.ctx.object.dag_update();
    }
  }
  
  ObjectStruct = new DataStruct([
    new DataPath(name, "name", "name", true),
    new DataPath(ctx_bb, "ctx_bb", "ctx_bb", true)
  ], SceneObject);
  
  return ObjectStruct;
}

var ImageStruct = undefined;

function api_define_image() {
  var name = new StringProperty("");
  var lib_id = new IntProperty(0)
  var path = new StringProperty("")
  var flag = new FlagProperty(1, ImageFlags, undefined, "image flags", "image flags");
  
  ImageStruct = new DataStruct([
    new DataPath(name, "name", "name", true),
    new DataPath(lib_id, "lib_id", "lib_id", true),
    new DataPath(path, 'path', 'path', true),
    new DataPath(flag, 'flag', 'flag', true)
  ], Image);
  
  datablock_structs[DataTypes.IMAGE] = ImageStruct;
  
  return ImageStruct;
}

function toArray(list) {
  let ret = [];

  for (let item of list) {
    ret.push(item);
  }

  return ret;
}

function api_define_datalist(name, typeid) {
  var items = new DataStructArray(
    function getstruct(item) {
      return datablock_structs[item.lib_type];
    },
    function itempath(key) {
      return "[" + key + "]";
    },
    function getitem(key) {
      return this[key];
    },
    function getiter() {
      let ret = [];

      for (var k in this) {
        ret.push(this[k]);
      }
      return ret[Symbol.iterator]();
    },

    function getkeyiter() {
      let ret = [];

      for (var k in this) {
        ret.push(k);
      }

      return ret[Symbol.iterator]();
    },

    function getlength() {
      let count = 0;
      for (let k in this) {
        count++;
      }

      return count;
    }
  );
  
  return new DataStruct([
    new DataPath(new StringProperty(name, "name"), "name", "name", false),
    new DataPath(new IntProperty(typeid, "typeid"), "typeid", "typeid", false),
    new DataPath(items, "items", "idmap", true)
  ])
}

var DataLibStruct = undefined;

function api_define_datalib() {
  var paths = [];
  
  if (DataLibStruct != undefined)
    return DataLibStruct;
  
  for (var k in DataTypes) {
    var v = DataTypes[k];
    
    var name = k.toLowerCase();
    paths.push(new DataPath(api_define_datalist(name, v), name, "datalists.items[" + v + "]", false))
  }
  
  DataLibStruct = new DataStruct(paths);
  
  return DataLibStruct;
}

api_define_datalib();
window.DataLibStruct2 = DataLibStruct;

var AppStateStruct = undefined;

function api_define_appstate() {
  var sel_multiple_mode = new BoolProperty(false, "select_multiple", "Multiple", "Select multiple elements");
  var sel_inverse_mode = new BoolProperty(false, "select_inverse", "Deselect", "Deselect Elements");
  
  AppStateStruct = new DataStruct([
    new DataPath(sel_multiple_mode, "select_multiple", "select_multiple", true),
    new DataPath(sel_inverse_mode, "select_inverse", "select_inverse", true)
  ]);
  
  return AppStateStruct;
}

export function get_tool_struct(tool) {
  OpStackArray.flag |= DataFlags.RECALC_CACHE;
  
  if (tool.apistruct != undefined) {
    tool.apistruct.flag |= DataFlags.RECALC_CACHE;
    return tool.apistruct;
  }
  
  tool.apistruct = g_app_state.toolstack.gen_tool_datastruct(tool);
  tool.apistruct.flag |= DataFlags.RECALC_CACHE;
  
  return tool.apistruct;
}

//ctx.appstate.toolstack.undostack
var OpStackArray = new DataStructArray(
  get_tool_struct,
  function getitempath(key) {
    return "[" + key + "]";
  },
  function getitem(key) {
    return g_app_state.toolstack.undostack[key];
  },
  function getiter() {
    return g_app_state.toolstack.undostack[Symbol.iterator]();
  },
  function getkeyiter() {
    function* range(len) {
      for (var i = 0; i < len; i++) {
        yield i;
      }
    }
    
    return range(g_app_state.toolstack.undostack.length)[Symbol.iterator]();
  },
  function getlength() {
    return g_app_state.toolstack.undostack.length;
  }
);

global ContextStruct = undefined;

window.test_range = function* range(len) {
  for (var i = 0; i < len; i++) {
    yield i;
  }
}

window.api_define_context = function () {
  ContextStruct = new DataStruct([
    new DataPath(api_define_view2d(), "view2d", "ctx.view2d", true),
    new DataPath(api_define_dopesheet(), "dopesheet", "ctx.dopesheet", true),
    new DataPath(api_define_editcurve(), "editcurve", "ctx.editcurve", true),
    new DataPath(api_define_frameset(), "frameset", "ctx.frameset", true),
    new DataPath(api_define_seditor(), "settings_editor", "ctx.settings_editor", false),
    new DataPath(api_define_settings(), "settings", "ctx.appstate.session.settings", false),
    new DataPath(api_define_object(), "object", "ctx.object", false),
    new DataPath(api_define_scene(), "scene", "ctx.scene", false),
    new DataPath(new DataStruct([]), "last_tool", "", false, false, DataFlags.RECALC_CACHE),
    new DataPath(api_define_appstate(), "appstate", "ctx.appstate", false),
    new DataPath(OpStackArray, "operator_stack",
      "ctx.appstate.toolstack.undostack", false, true, DataFlags.RECALC_CACHE),
    new DataPath(api_define_spline(), "spline", "ctx.spline", false),
    new DataPath(api_define_datalib(), "datalib", "ctx.datalib", false),
    new DataPath(api_define_opseditor(), "opseditor", "ctx.opseditor", false)
  ], Context);
}

window.init_data_api = function() {
  api_define_ops();
  api_define_context();
};

export function gen_path_maps(strct, obj, path1, path2) {//path is private, optional
  if (obj == undefined)
    obj = {}
  if (path1 == undefined) {
    path1 = "";
    path2 = "";
  }
  
  if (path1 != "")
    obj[path1] = strct;
  
  for (var p in strct.paths) {
    if (!(p.data instanceof DataStruct)) {
      if (p.use_path) {
        obj[path1 + "." + p.path] = "r = " + path2 + "." + p.path + "; obj[" + path1 + "].pathmap[" + p.path + "]"
      } else {
        obj[path1 + "." + p.path] = "r = undefined; obj[" + path1 + "].pathmap[" + p.path + "]"
      }
    } else {
      gen_path_maps(p, obj, path1 + p.name, path2 + p.path);
    }
  }
}

let _prefix = `"use strict";
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

window.genNewDataAPI = () => {
  let out = "";
  let ctx = g_app_state.ctx;

  let getClass = (dstruct, path) => {
    if (dstruct.dataClass)
      return dstruct.dataClass;

    console.log(path);
    window.ctx = CTX;

    let val;
    try {
      val = eval(path);
    } catch (error) {
      print_stack(error);
      console.warn("failed");
    }

    if (!val || !(typeof val === "object")) {
      console.warn("Failed to resovle a class", dstruct, "at", path);
      return undefined;
    }

    return val.constructor;
  };

  let structs = {};

  let genStruct = (cls, dstruct, path) => {
    if (!cls) {
      console.warn("Failed to resolve a class", dstruct, path);
      return;
    }

    let name = cls.name;

    out += `var ${name}Struct = api.mapStruct(${cls.name}, true);\n\n`;
    out += "function api_define_" + name + "(api) {\n";

    name = name + "Struct";

    for (let dpath of dstruct.paths) {
      let name2 = dpath.name;

      let path2 = path.trim();
      if (path2.length > 0) {
        path2 += "."
      }
      path2 += dpath.path;

      let checkenum = (a, def) => {
        if (!a)
          return false;

        let ok = false;

        for (let k in def) {
          if (a[k] !== k) {
            ok = true;
          }
        }

        return ok;
      }

      let format_obj = (obj) => {
        for (let k in _es6_module.imports) {
          let v = _es6_module.imports[k].value;
          if (typeof v !== "object" || v === null)
            continue;

          let ok = true;

          for (let k2 in obj) {
            if (v[k2] === undefined) {
              ok = false;
            }
          }

          if (ok) {
            return k;
          }
        }

        let def = "{\n";
        let keys = Object.keys(obj);
        let maxwid = 0;

        for (let i=0; i<keys.length; i++) {
          maxwid = Math.max(maxwid, keys[i].length);
        }

        for (let i=0; i<keys.length; i++) {
          let k = ""+keys[i];
          let v = obj[keys[i]];

          if (k.search(" ") >= 0 || k === "in" || k === "of" || k === "if")
            k = `"${k}"`;
          if (typeof v !== "number" && !(typeof v === "string" && v.startsWith("Icons.")))
            v = `"${v}"`;

          def +=  "      " + k;

          let wid = k.length;
          for (let j=0; j<maxwid-wid; j++) {
            def += " ";
          }

          def += " : " + v;

          if (i < keys.length-1) {
            def += ",";
          }
          def += "\n";
        }
        def += "    }"

        return def;
      };

      let path3 = dpath.path;
      if (path3.startsWith("ctx.")) {
        path3 = path3.slice(4, path3.length);
      }

      if (dpath.type === DataPathTypes.STRUCT) {
        let stt = "undefined";
        let cls2 = getClass(dpath.data, path2);

        if (cls2 !== undefined) {
          stt = `api.mapStruct(${cls2.name}, true)`;
        } else {
          out += "  /*WARNING: failed to resolve a class*/\n";
        }
        out += `  ${name}.struct("${path3}", "${dpath.name}", "${dpath.uiname}", ${stt});\n`;

      } else if (dpath.type === DataPathTypes.STRUCT_ARRAY) {
        //out += `\n\n  /* WARNING: data struct array detected ${dpath.name}{${path3}} */\n\n`;
        /*
        this.getter = array_item_struct_getter;
        this.getitempath = getitempath;
        this.getitem = getitem;
        this.getiter = getiter;
        this.getkeyiter = getkeyiter;
        this.getlength = getlength;
        */

        function process(func) {
          let s = ("" + func).trim();
          s = s.slice(0, s.length-1);
          s = s.split("\n");
          s = s.slice(1, s.length);
          s = s.join("\n").trim();
          s = s.replace(/this/g, "list");

          return s;
        }

        let list = dpath.data;
        out += `  ${name}.list("${path3}", "${dpath.name}", [\n`;

        if (list.getiter) {
          out += `    function getIter(api, list) {\n      ${process(list.getiter)}\n    },\n`;
        }
        if (list.getitem) {
          out += `    function get(api, list, key) {\n      ${process(list.getitem)}\n    },\n`;
        }
        if (list.getter) {
          out += `    function getStruct(api, list, key) {\n      ${process(list.getter)}\n    },\n`;
        }
        if (list.getlength) {
          out += `    function getLength(api, list) {\n      ${process(list.getlength)}\n    },\n`;
        }

        if (list.getkeyiter) {
          out += "/*" + list.getkeyiter + "*/\n";
        }
        if (list.getitempath) {
          out += "/*" + list.getitempath + "*/\n";
        }

        out += "  ]);\n";
      } else {
        let prop = dpath.data;

        let name2 = dpath.name;

        //out += `  let ${name2} `;
        out += `  `;

        let uiname = dpath.uiname || prop.uiname || dpath.name;

        let numprop = (prop, isint) => {
          s = "";

          if (prop.range && prop.range[0] && prop.range[1]) {
            s += `.range(${prop.range[0]}, ${prop.range[1]})`;
          }
          if (prop.ui_range && prop.ui_range[0] && prop.ui_range[1]) {
            s += `.uiRange(${prop.ui_range[0]}, ${prop.ui_range[1]})`;
          }

          if (prop.step !== undefined) {
            s += `.step(${prop.step})`;
          }

          if (prop.expRate !== undefined) {
            s += `.expRate(${prop.expRate})`;
          }

          if (!isint && prop.decimalPlaces !== undefined) {
            s += `.decimalPlaces(${prop.decimalPlaces})`;
          }

          return s;
        };

        let path3 = dpath.path;
        if (path3.startsWith("ctx.")) {
          path3 = path3.slice(4, path3.length);
        }

        switch (prop.type) {
          case PropTypes.BOOL:
            out += `${name}.bool("${path3}", "${dpath.name}", "${uiname}")`;
            break;
          case PropTypes.INT:
            out += `${name}.int("${path3}", "${dpath.name}", "${uiname}")`;
            out += numprop(prop, true);
            break;
          case PropTypes.FLOAT:
            out += `${name}.float("${path3}", "${dpath.name}", "${uiname}")`;
            out += numprop(prop);
            break;
          case PropTypes.VEC2:
            out += `${name}.vec2("${path3}", "${dpath.name}", "${uiname}")`;
            out += numprop(prop);
            break;
          case PropTypes.VEC3:
            out += `${name}.vec3("${path3}", "${dpath.name}", "${uiname}")`;
            out += numprop(prop);
            break;
          case PropTypes.VEC4:
            out += `${name}.vec2("${path3}", "${dpath.name}", "${uiname}")`;
            out += numprop(prop);
            break;
          case PropTypes.ENUM:
          case PropTypes.FLAG:
            let key = prop.type === PropTypes.ENUM ? "enum" : "flags";

            let def = format_obj(prop.type === PropTypes.FLAG ? prop.values : prop.values);
            out += `${name}.${key}("${path3}", "${dpath.name}", ${def}, "${uiname}")`;

            if (prop.type === PropTypes.ENUM) {
              if (checkenum(prop.ui_value_names, prop.values)) {
                out += `.uiNames(${format_obj(prop.ui_value_names)})`;
              }
            } else {
              if (checkenum(prop.ui_value_names, prop.values)) {
                out += `.uiNames(${format_obj(prop.ui_value_names)})`;
              }
            }

            if (checkenum(prop.descriptions, prop.values)) {
              out += `.descriptions(${format_obj(prop.descriptions)})`;
            }

            if (checkenum(prop.iconmap, prop.values)) {
              let iconmap2 = {}
              for (let k in prop.iconmap) {
                let v = prop.iconmap[k];

                for (let k2 in Icons) {
                  if (Icons[k2] === v) {
                    iconmap2[k] = "Icons." + k2;
                  }
                }
              }

              out += `.icons(${format_obj(iconmap2)})`;
            }
            break;
        }

        if (prop.userSetData && prop.userSetData !== prop.prototype.userSetData) {
          out += ".customSet(" + prop.userSetData + ")"
        }
        if (prop.update && prop.update !== prop.prototype.update) {
          out += `.on("change", function(old) {return (${""+prop.update}).call(this.dataref, old)})`
        }
        out += ";\n";
      }
    }

    out += "}\n\n";
  };

  let recurse = (dstruct, path) => {
    let cls = getClass(dstruct, path);

    if (cls === undefined) {
      console.warn("failed to resolve class for path", path, dstruct);
      return;
    }

    if (!(cls.name in structs)) {
      genStruct(cls, dstruct, path);
      structs[cls.name] = cls;
    }

    if (path.length > 0) {
      path += "."
    }

    for (let dpath of dstruct.paths) {
      if (dpath.type === DataPathTypes.STRUCT) {
        recurse(dpath.data, path + dpath.path);
      }
    }
  };

  recurse(ContextStruct, "");
  console.log(structs);
  console.log(out);

  for (let k in structs) {
    out += `  api_define_${k}(api);\n`;
  }

  let lines = out.split("\n");

  out = "export function makeAPI(api) {\n";

  for (let l of lines) {
    out += "  " + l + "\n";
  }

  out += "  api.rootContextStruct = api.mapStruct(FullContext, false);\n\n";
  out += "  return api;\n";
  out += "}\n";

  return _prefix + out;
};

