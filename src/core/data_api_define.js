import {DataTypes} from 'lib_api';
import {EditModes} from 'view2d';
import {ENABLE_MULTIRES} from 'config';
import {ImageFlags, Image} from 'imageblock';

import {BoxColor4, BoxWColor, ColorTheme, 
        ThemePair, BoxColor, 
        darken} from 'theme';

import {EnumProperty, FlagProperty, 
        FloatProperty, StringProperty,
        BoolProperty, Vec2Property,
        DataRefProperty,
        Vec3Property, Vec4Property, IntProperty,
        TPropFlags, PropTypes} from 'toolprops';

import {ModalStates} from 'toolops_api';

import {SplineFlags, MaterialFlags, SplineTypes} from 'spline_base';
import {SelMask, ToolModes} from 'selectmode';
import {Unit} from 'units';

import {ExtrudeModes} from 'spline_createops';
import {DataFlags, DataPathTypes} from 'data_api';
import {OpStackEditor} from 'ops_editor';

import {MultiResLayer, MultiResEffector, MResFlags, has_multires, 
        ensure_multires, iterpoints, compose_id, decompose_id
       } from 'spline_multires';

var SelModes = {
  VERTEX  : SelMask.VERTEX,
  SEGMENT : SelMask.SEGMENT,
  FACE    : SelMask.FACE
};

export var selmask_enum = new EnumProperty(undefined, SelModes, "selmask_enum", "Selection Mode");
var selmask_ui_vals = {};

for (var k in SelModes) {
  var s = k[0].toUpperCase() + k.slice(1, k.length).toLowerCase();
  var slst = s.split("_");
  var s2 = ""
  
  for (var i=0; i<slst.length; i++) {
    s2 += slst[i][0].toUpperCase() + slst[i].slice(1, slst[i].length).toLowerCase() + " ";
  }
  s = s2.trim();
  
  selmask_ui_vals[k] = s;
}
selmask_enum.ui_value_names = selmask_ui_vals;
selmask_enum.add_icons({
  VERTEX  : Icons.VERT_MODE,
  SEGMENT : Icons.EDGE_MODE,
  FACE    : Icons.FACE_MODE
});

import * as data_api from 'data_api';

var DataPath = data_api.DataPath;
var DataStruct = data_api.DataStruct;
var DataStructArray = data_api.DataStructArray;

//create unit enum static property
var units = Unit.units;
var unit_enum = {}
var unit_ui_vals = {};

for (var i=0; i<units.length; i++) {
  var s = units[i].suffix_list[0];
  unit_enum[s] = s
  unit_ui_vals[s] = s.toUpperCase();
}
Unit.units_enum = new EnumProperty("in", unit_enum, "unit_enum", "Units");
Unit.units_enum.ui_value_names = unit_ui_vals;

var SettingsUpdate = function() {
  g_app_state.session.settings.server_update();
}

var SettingsUpdateRecalc = function() {
  g_app_state.session.settings.server_update();
  g_app_state.screen.do_full_recalc();
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
  ]);
  
  return SettingsStruct;
}

var SettingsEditorStruct = undefined;
function api_define_seditor() {
  SettingsEditorStruct = new DataStruct([
  ]);
  
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
  ]);
  
  return OpsEditorStruct;
}

//*/

import {ExtrudeModes} from 'spline_createops';

var AnimKeyStruct = undefined;
function api_define_animkey() {
  if (AnimKeyStruct != undefined)
    return AnimKeyStruct;
    
  AnimKeyStruct = new DataStruct([
    new DataPath(new IntProperty(-1, "id", "id"), "id", "id", true)
  ]);
  
  return AnimKeyStruct;
}
api_define_animkey();
window.AnimKeyStruct = AnimKeyStruct;
window.AnimKeyStruct2 = AnimKeyStruct;

var datablock_structs = {
};

//returns list of paths to concat to DataBlock subclass struct
function api_define_DataBlock() {
  api_define_animkey();
  
  var array = new DataStructArray(
    function getstruct(item) {
      return AnimKeyStruct2;
    },
    function itempath(key) {
      return "["+key+"]";
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
  ]);
  
  return ImageUserStruct;
}

function api_define_view2d() {
  var only_render = new BoolProperty(0, "only_render", "Only Render");
  
  only_render.api_update = function(ctx, path) {
    window.redraw_viewport();
  }
  
  var draw_small_verts = new BoolProperty(0, "draw_small_verts", "Small Points", "Draw Pointers Smaller");
  draw_small_verts.api_update = function(ctx, path) {
    window.redraw_viewport();
  }
  
  var extrude_mode = new EnumProperty(0, ExtrudeModes, "extrude_mode", "Extrude Mode");
  
  var linewidth = new FloatProperty(2.0, "default_linewidth", "Line Wid");
  linewidth.range = [0.01, 100];
  
  var zoomprop = new FloatProperty(1, "zoom", "Zoom");

  zoomprop.update = function(ctx, path) {
    this.ctx.view2d.set_zoom(this.data); 
  }
  zoomprop.range = zoomprop.real_range = zoomprop.ui_range = [0.1, 100];
  
  var draw_bg_image = new BoolProperty(0, "draw_bg_image", "Draw Image");
  
  var draw_video = new BoolProperty(0, "draw_video", "Draw Video");
  draw_video.update = draw_bg_image.update = function() {
    window.redraw_viewport();
  }
  
  var tool_mode = new EnumProperty("SELECT", ToolModes, "select", "Active Tool", "Active Tool");
  
  tool_mode.add_icons({
    SELECT : Icons.CURSOR_ARROW,
    APPEND : Icons.MAKE_SEGMENT,
    RESIZE : Icons.RESIZE
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
  selmask_mask.ui_key_names = uinames;
  
  selmask_mask.update = function() {
    window.redraw_viewport();
  }
  
  var background_color = new Vec3Property(undefined, "background_color", "Background");
  background_color.subtype = PropTypes.COLOR3;

  var default_stroke = new Vec4Property(undefined, "default_stroke", "Stroke");
  var default_fill = new Vec4Property(undefined, "default_fill", "Fill");
  default_stroke.subtype = default_fill.subtype = PropTypes.COLOR4;
  
  background_color.update = function() {
    window.redraw_viewport();
  }
  
  View2DStruct = new DataStruct([
    new DataPath(background_color, "background_color", "background_color", true),
    new DataPath(default_stroke, "default_stroke", "default_stroke", true),
    new DataPath(default_fill, "default_fill", "default_fill", true),
    new DataPath(tool_mode, "toolmode", "toolmode", true),
    new DataPath(draw_small_verts, "draw_small_verts", "draw_small_verts", true),
    new DataPath(selmask_enum.copy(), "selectmode", "selectmode",  true),
    new DataPath(selmask_mask.copy(), "selectmask", "selectmode", true),
    new DataPath(only_render, "only_render", "only_render", true),
    new DataPath(draw_bg_image, "draw_bg_image", "draw_bg_image", true),
    new DataPath(tweak_mode, "tweak_mode", "tweak_mode", true),
    new DataPath(new BoolProperty(0, "enable_blur", "Blur"), "enable_blur", "enable_blur", true),
    new DataPath(new BoolProperty(0, "draw_faces", "Show Faces"), "draw_faces", "draw_faces", true),
    new DataPath(draw_video, "draw_video", "draw_video", true),
    new DataPath(new BoolProperty(0, "draw_normals", "Show Normals", "Show Normal Comb"), "draw_normals", "draw_normals", true),
    new DataPath(new BoolProperty(0, "draw_anim_paths", "Show Animation Paths"), "draw_anim_paths", "draw_anim_paths", true),
    new DataPath(zoomprop, "zoom", "zoom", true),
    new DataPath(api_define_material(), "active_material", "active_material", true),
    new DataPath(linewidth, "default_linewidth", "default_linewidth", true),
    new DataPath(extrude_mode, "extrude_mode", "extrude_mode", true),
    new DataPath(new BoolProperty(0, "pin_paths", "Pin Paths", "Remember visible animation paths"), "pin_paths", "pin_paths", true),
    new DataPath(api_define_imageuser(), "background_image", "background_image", true)
  ])
  
  return View2DStruct;
}

var MaterialStruct;
function api_define_material() {
  var fillclr = new Vec4Property(new Vector4(), "fill", "fill", "Fill Color");
  var strokeclr = new Vec4Property(new Vector4(), "stroke", "stroke", "Stroke Color");
  
  var update_base = function(material) {
    material.update();
    window.redraw_viewport();
  }
  
  var flag = new FlagProperty(1, MaterialFlags, undefined, "material flags", "material flags");
  flag.update = update_base;
  
  var fillpath = new DataPath(new BoolProperty(false, "fill_over_stroke", "fill_over_stroke", 
                             "fill_over_stroke"), "fill_over_stroke", "fill_over_stroke", true);
  fillclr.subtype = strokeclr.subtype = PropTypes.COLOR4;
  
  var linewidth = new FloatProperty(1, "linewidth", "linewidth", "Line Width");
  linewidth.range = [0.1, 200];

  var blur = new FloatProperty(1, "blur", "blur", "Blur");
  blur.range = [0.0, 800];
  
  fillclr.update = strokeclr.update = linewidth.update = blur.update = update_base;
  
  //fillclr.flag |= TPropFlags.USE_UNDO;
  //strokeclr.flag |= TPropFlags.USE_UNDO;
  //linewidth.flag |= TPropFlags.USE_UNDO;
  
  MaterialStruct = new DataStruct([
    new DataPath(strokeclr, "strokecolor", "strokecolor", true),
    new DataPath(fillclr, "fillcolor", "fillcolor", true),
    new DataPath(linewidth, "linewidth", "linewidth", true),
    new DataPath(blur, "blur", "blur", true),
    new DataPath(flag, "flag", "flag", true)
  ]);
  
  return MaterialStruct;
}

var SplineFaceStruct;
function api_define_spline_face() {
  var flagprop = new FlagProperty(2, SplineFlags, undefined, "Flags", "Flags");
  
  SplineFaceStruct = new DataStruct([
    new DataPath(new IntProperty(0, "eid", "eid", "eid"), "eid", "eid", true),
    new DataPath(api_define_material(), "mat", "mat", true),
    new DataPath(flagprop, "flag", "flag", true)
  ]);
  
  return SplineFaceStruct;
}

var SplineVertexStruct;
function api_define_spline_vertex() {
  var flagprop = new FlagProperty(2, SplineFlags, undefined, "Flags", "Flags");
  
  flagprop.ui_key_names["BREAK_CURVATURES"] = "Less Smooth";
  flagprop.ui_key_names["BREAK_TANGENTS"] = "Sharp Corner";
  
  var coprop = new Vec3Property(undefined, "co", "Co", "Coordinates");
  
  flagprop.update = function(owner) {
    this.ctx.spline.regen_sort();
    console.log("vertex update", owner);
    
    if (owner != undefined) {
      owner.flag |= SplineFlags.UPDATE;
    }
    this.ctx.spline.propagate_update_flags();
    this.ctx.spline.resolve = 1;
    
    window.redraw_viewport();
  }
  
  SplineVertexStruct = new DataStruct([
    new DataPath(new IntProperty(0, "eid", "eid", "eid"), "eid", "eid", true),
    new DataPath(flagprop, "flag", "flag", true),
    new DataPath(coprop, "co", "", true)
  ]);
  
  return SplineVertexStruct;
}

var SplineSegmentStruct;
function api_define_spline_segment() {
  var flagprop = new FlagProperty(2, SplineFlags, undefined, "Flags", "Flags");
  
  flagprop.update = function(segment) {
    new Context().spline.regen_sort();
    segment.flag |= SplineFlags.REDRAW;
    console.log(segment);
    
    window.redraw_viewport();
  }
  
  var zprop = new FloatProperty(0, "z", "z", "z");

  zpath = new DataPath(zprop, "z", "z", true);
  zpath.update = function(segment, old_value, changed) {
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
    var spline = g_app_state.api.get_object(path);
    
    if (spline == undefined) {
      warn("Warning, could not get spline to call regen_sort() on!", path, s);
      return;
    }
    
    spline.regen_sort();
    */
  }
  
  SplineSegmentStruct = new DataStruct([
    new DataPath(new IntProperty(0, "eid", "eid", "eid"), "eid", "eid", true),
    new DataPath(flagprop, "flag", "flag", true),
    new DataPath(new BoolProperty(0, "renderable", "renderable"), "renderable", "renderable", true),
    new DataPath(api_define_material(), "mat", "mat", true),
    zpath
  ]);
  
  return SplineSegmentStruct;
}

import {SplineLayerFlags} from 'spline_element_array';

var SplineLayerStruct;
function api_define_spline_layer_struct() {
  var flag = new FlagProperty(2, SplineLayerFlags);
  
  flag.flag_descriptions = {
    MASK : "Use previous layer as a mask"
  };
  
  flag.ui_key_names.MASK = flag.ui_value_names[SplineLayerFlags.MASK] = "Mask To Prev";
  
  flag.update = function() {
    window.redraw_viewport();
  }
  
  SplineLayerStruct = new DataStruct([
    new DataPath(new IntProperty(0, "id", "id", "id"), "id", "id", true),
    new DataPath(new StringProperty("", "name", "name", "name"), "name", "name", true),
    new DataPath(flag, "flag", "flag", true)
  ]);
  
  window.SplineLayerStruct = SplineLayerStruct;
}

function api_define_multires_struct() {
  //mres points is a customdata layer stored within segments
  
  var co = new Vec2Property(undefined, "co", "co");
  var flag = new FlagProperty(1, MResFlags, undefined, "multires flags", "multires flags");
  flag.update = function() {
    window.redraw_viewport();
  }
  
  var support = new FloatProperty(0, "support", "support");
  
  support.range = [0.0001, 2.0];
  support.update = function() {
    window.redraw_viewport();
  }

  var degree = new FloatProperty(0, "degree", "degree");
  
  degree.range = [0.1, 65.0];
  degree.update = function() {
    window.redraw_viewport();
  }
  
  var MResPointStruct = new DataStruct([
    new DataPath(co, "co", "", true),
    new DataPath(flag, "flag", "flag", true),
    new DataPath(support, "support", "support", true),
    new DataPath(degree, "degree", "degree", true)
  ]);
 
  return MResPointStruct;
}

function api_define_multires_array() {
  //array is bound to spline.segments
  //mres points is a customdata layer stored within segments
  
  var MResPointStruct = api_define_multires_struct();
  
  var mpoints = new DataStructArray(
    function getstruct(item) {
      return MResPointStruct;
    },
    function itempath(key) {
      return ".idmap[decompose_id("+key+")[0]].cdata.get_layer(MultiResLayer).get(decompose_id("+key+")[1])"
    },
    function getitem(key) {
      var seg = decompose_id(key)[0];
      seg = this.local_idmap[seg];
      var mr = seg.cdata.get_layer(MultiResLayer);
      
      var p = decompose_id(key)[1];
      return mr.get(p);
    }, 
    function getiter() {
      return iterpoints(this.spline, this.spline.actlevel);
    }, 
    function getkeyiter() {
      return iterpoints(this.spline, this.spline.actlevel, true);
    }, 
    function getlength() {
      //return bogus value for now
      return 1;
  });
  
  return mpoints;
}

function api_define_spline() {
  api_define_spline_layer_struct();
  
  var layerset = new DataStructArray(
    function getstruct(item) {
      return SplineLayerStruct;
    },
    function itempath(key) {
      return ".idmap["+key+"]";
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
      
      for (var i=0; i<keys.length; i++) {
        ret.push(keys[i]);
      }
      
      return ret;
    }, 
    function getlength() {
      return this.length;
  });
  
  function define_element_array(the_struct) {
    return new DataStructArray(
      function getstruct(item) {
        return the_struct;
      },
      function itempath(key) {
        return ".local_idmap["+key+"]";
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
        
        for (var i=0; i<keys.length; i++) {
          ret.push(keys[i]);
        }
        
        return ret;
      }, 
      function getlength() {
        return this.length;
    });
  }
  
  var mres_points = api_define_multires_array();
  var mres_act_id = "ctx.spline.segments.cdata.get_shared('MultiResLayer').active";
  
  var mres_act_path = "eidmap[decompose_id(ID)[0]].cdata"
  mres_act_path += ".get_layer(MultiResLayer).get(decompose_id(ID)[1])"
  mres_act_path = mres_act_path.replace(/ID/g, mres_act_id);
  
  var SplineStruct = new DataStruct(api_define_DataBlock().concat([
    new DataPath(api_define_spline_face(), "active_face", "faces.active", true),
    new DataPath(api_define_spline_segment(), "active_segment", "segments.active", true),
    new DataPath(api_define_spline_vertex(), "active_vertex", "verts.active", true),
    new DataPath(define_element_array(SplineFaceStruct), "faces", "faces", true),
    new DataPath(define_element_array(SplineSegmentStruct), "segments", "segments", true),
    new DataPath(define_element_array(SplineVertexStruct), "verts", "verts", true),
    new DataPath(layerset, "layerset", "layerset", true),
    new DataPath(mres_points, "mres_points", "segments", true),
    new DataPath(api_define_multires_struct(), "active_mres_point", mres_act_path, true),
    new DataPath(SplineLayerStruct, "active_layer", "layerset.active", true)
  ]));
  
  datablock_structs[DataTypes.SPLINE] = SplineStruct;
  
  return SplineStruct;
}

function api_define_animpaths() {
  var AnimPathStruct = new DataStruct([
    new DataPath(api_define_spline(), "spline", "spline", true)
  ]);
  
  AnimPathStruct.Int("eid", "eid", "ID", "Vertex ID"); 
  
  function getiter(list) {
    return new obj_value_iter(arr);
  }
  
  function getlength(list) {
    var tot=0;
    
    for (var k in list) {
      tot++;
    }
    
    return tot;
  }
  
  function get_struct(list) {
    return AnimPathStruct;
    console.log(arguments);
  }
  
  return new DataStructArray(get_struct, getiter, getlength);
}

function api_define_frameset() {
  var FrameSetStruct = new DataStruct(api_define_DataBlock().concat([
    new DataPath(api_define_spline(), "drawspline", "spline", true),
    new DataPath(api_define_spline(), "pathspline", "pathspline", true)
  ]));
  
  datablock_structs[DataTypes.FRAMESET] = FrameSetStruct;
  
  return FrameSetStruct;
}


var SceneStruct = undefined;
function api_define_scene() {
  var name = new StringProperty("", "name", "name", "Name", TPropFlags.LABEL);
  var frame = new IntProperty(0, "frame", "Frame", "Frame", TPropFlags.LABEL);
  
  frame.range = [1, 10000];
  
  var SceneStruct = new DataStruct(api_define_DataBlock().concat([
    new DataPath(name, "name", "name", true),
    new DataPath(frame, "frame", "time", true)
  ]));
  
  datablock_structs[DataTypes.SCENE] = SceneStruct;
  
  return SceneStruct;
}

function get_theme_color(color) {
  var st;
  
  var name = new StringProperty("", "name", "name", "name");
  name = new DataPath(name, "name", "[0]", true);
  
  if (color[1] instanceof BoxColor4) {
    var type = new StringProperty("Corners", "type", "type");
    var c1 = new Vec4Property(new Vector4(), "c1", "c1", "Color 1");
    var c2 = new Vec4Property(new Vector4(), "c2", "c2", "Color 2");
    var c3 = new Vec4Property(new Vector4(), "c3", "c3", "Color 3");
    var c4 = new Vec4Property(new Vector4(), "c4", "c4", "Color 4");
    
    c1.subtype = c2.subtype = c3.subtype = c4.subtype = PropTypes.COLOR4;
    function gen_func(i) {
      function update() {
        //color[1].colors[i] = this.data;
        g_theme.gen_globals();
        SettingsUpdate();
      }
    }
    c1.update = gen_func(0); c2.update = gen_func(1); 
    c3.update = gen_func(2); c4.update = gen_func(3);
    
    st = new DataStruct([
      new DataPath(type, "type", "type", true, false),
      name,
      new DataPath(c1, "c1", "[1].colors[0]", true),
      new DataPath(c2, "c2", "[1].colors[1]", true),
      new DataPath(c3, "c3", "[1].colors[2]", true),
      new DataPath(c4, "c4", "[1].colors[3]", true)
    ]);
  } else if (color[1] instanceof BoxWColor) {
    var type = new StringProperty("Weighted", "type", "type");
    var clr = new Vec4Property(new Vector4(), "color", "color", "color");
    var weights = new Vec4Property(new Vector4(), "weight", "weight", "weight");
    
    clr.subtype = PropTypes.COLOR4;
    clr.update = function() {
      //color.color = this.data;
      g_theme.gen_globals();
      SettingsUpdate();
    }
    
    weights.update = function() {
      //color.weights = this.data;
      g_theme.gen_globals();
      SettingsUpdate();
    }
    weights.range = weights.real_range = weights.ui_range = [0, 1];
    
    st = new DataStruct([
      new DataPath(type, "type", "type", true, false),
      name,
      new DataPath(clr, "color", "[1].color", true),
      new DataPath(weights, "weights", "[1].weights", true)
    ]);
  } else {
    var clr = new Vec4Property(new Vector4(), "color", "color", "color");
    clr.subtype = PropTypes.COLOR4;
    clr.update = function(color) {
      /*for (var i=0; i<4; i++) {
        color[1][i] = this.data[i];
      }*/
      g_theme.gen_globals();
      SettingsUpdate();
    }
    
    var type = new StringProperty("Simple", "type", "type");
    st = new DataStruct([
      new DataPath(type, "type", "type", true, false),
      name,
      new DataPath(clr, "color", "[1]", true)
    ]);
  }
  
  return st;
}

var ColorThemeStruct = undefined;

function api_define_colortheme() {
  var colors = new DataStructArray(
    get_theme_color,
    
    function getpath(key) {
      return "["+key+"]";
    }, 
    
    function getitem(key) {
      return this[key];
    }, 
    
    function getiter() {
      return this[Symbol.iterator]();
    }, 
    
    function getkeyiter() {
      arr = [];
      for (var i=0; i<this.length; i++) {
        arr.push(i);
      }
      
      return arr[Symbol.iterator]();
    }, 
    
    function getlength () {
      return this.length;
    }
  );
  
  ColorThemeStruct = new DataStruct([
    new DataPath(colors, "colors", "flat_colors", false)
  ]);
  
  return ColorThemeStruct;
}

var ThemeStruct = undefined;
function api_define_theme() {
  api_define_colortheme();
  
  ThemeStruct = new DataStruct([
    new DataPath(ColorThemeStruct, "ui", "ui", false),
    new DataPath(ColorThemeStruct, "view2d", "view2d", false)
  ]);
  
  return ThemeStruct;
}

var DopeSheetStruct = undefined;
function api_define_dopesheet() {
  var selected_only = new BoolProperty(false, "selected_only", "Selected Only", "Show only keys of selected vertices");
  
  //this one is a dynamic "smart" property, implemented with get/setters in the DopeSheetEditor class itself
  var pinned = new BoolProperty(false, "pinned", "Pin", "Pin view");
  
  selected_only.update = function() {
    if (this.ctx != undefined && this.ctx.dopesheet != undefined)
      this.ctx.dopesheet.do_full_recalc();
  }
  
  DopeSheetStruct = new DataStruct([
    new DataPath(selected_only, "selected_only", "selected_only", true),
    new DataPath(pinned, "pinned", "pinned", true)
  ]);
  
  return DopeSheetStruct;
}

var ObjectStruct = undefined;
function api_define_object() {
  
  var name = new StringProperty("", "name", "name", "Name", TPropFlags.LABEL);
  var ctx_bb = new Vec3Property(new Vector3(), "dimensions", "Dimensions", "Editable dimensions");
  
  ctx_bb.flag |= TPropFlags.USE_UNDO;
  
  //contextual, editable bounding box
  //(well, dimensions).
  ctx_bb.update = function() {
    if (this.ctx.mesh != undefined)
      this.ctx.mesh.regen_render();
    if (this.ctx.view2d != undefined && this.ctx.view2d.selectmode & EditModes.GEOMETRY) {
      this.ctx.object.dag_update();
    }
  }
  
  ObjectStruct = new DataStruct([
    new DataPath(name, "name", "name", true),
    new DataPath(ctx_bb, "ctx_bb", "ctx_bb", true)
  ]);
  
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
  ]);

  datablock_structs[DataTypes.IMAGE] = ImageStruct;
  
  return ImageStruct;
}

function api_define_datalist(name, typeid) {
  var items = new DataStructArray(
    function getstruct(item) {
      return datablock_structs[item.lib_type];
    },
    function itempath(key) {
      return "["+key+"]";
    },
    function getitem(key) {
      return this[key];
    }, 
    function getiter() {
      var ret = [];
      for (var k in this) {
        ret.push(this[k]);
      }
      return ret[Symbol.iterator]();
    }, 
    function getkeyiter() {
      return list(this)[Symbol.iterator]();
    }, 
    function getlength() {
      return list(this).length;
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
    paths.push(new DataPath(api_define_datalist(name, v), name, "datalists.items["+v+"]", false))
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
    return "["+key+"]";
  },
  function getitem(key) {
    return g_app_state.toolstack.undostack[key];
  },
  function getiter() {
    return g_app_state.toolstack.undostack[Symbol.iterator]();
  },
  function getkeyiter() {
    function* range(len) {
      for (var i=0; i<len; i++) {
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
  for (var i=0; i<len; i++) {
    yield i;
  }
}

window.api_define_context = function() {
  ContextStruct = new DataStruct([
    new DataPath(api_define_view2d(), "view2d", "ctx.view2d", true),
    new DataPath(api_define_dopesheet(), "dopesheet", "ctx.dopesheet", true),
    new DataPath(api_define_frameset(), "frameset", "ctx.frameset", true),
    new DataPath(api_define_seditor(), "settings_editor", "ctx.settings_editor", false),
    new DataPath(api_define_settings(), "settings", "ctx.appstate.session.settings", false),
    new DataPath(api_define_object(), "object", "ctx.object", false),
    new DataPath(api_define_scene(), "scene", "ctx.scene", false),
    new DataPath(new DataStruct([]), "last_tool", "", false, false, DataFlags.RECALC_CACHE),
    new DataPath(api_define_appstate(), "appstate", "ctx.appstate", false),
    new DataPath(OpStackArray, "operator_stack", 
                 "ctx.appstate.toolstack.undostack", false, true, DataFlags.RECALC_CACHE),
    new DataPath(api_define_theme(), "theme", "g_theme", false),
    new DataPath(api_define_spline(), "spline", "ctx.spline", false),
    new DataPath(api_define_datalib(), "datalib", "ctx.datalib", false),
    new DataPath(api_define_opseditor(), "opseditor", "ctx.opseditor", false)
  ]);
}

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
        obj[path1+"."+p.path] = "r = " + path2+"."+p.path+"; obj["+path1+"].pathmap["+p.path+"]"
      } else {
        obj[path1+"."+p.path] = "r = undefined; obj["+path1+"].pathmap["+p.path+"]"
      }
    } else {
      gen_path_maps(p, obj, path1+p.name, path2+p.path);
    }
  }
}
