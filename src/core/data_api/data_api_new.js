"use strict";
import {DataAPI, buildToolSysAPI} from '../../path.ux/scripts/pathux.js';
import {DataTypes} from '../lib_api.js';
import {EditModes, View2DHandler} from '../../editors/viewport/view2d.js';
import {ImageFlags, Image, ImageUser} from '../imageblock.js';
import {AppSettings} from '../UserSettings.js';
import {FullContext} from "../context.js";
import {SplineToolMode} from '../../editors/viewport/toolmodes/splinetool.js';
import {SessionFlags} from '../../editors/viewport/view2d_base.js';

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
import {initToolModeAPI} from '../../editors/viewport/toolmodes/toolmode.js';

export function makeAPI(api = new DataAPI()) {
  var FullContextStruct = api.mapStruct(FullContext, true);

  function api_define_FullContext(api) {
    FullContextStruct.struct("view2d", "view2d", "undefined", api.mapStruct(View2DHandler, true));
    FullContextStruct.struct("dopesheet", "dopesheet", "undefined", api.mapStruct(DopeSheetEditor, true));
    FullContextStruct.struct("editcurve", "editcurve", "undefined", api.mapStruct(CurveEditor, true));
    FullContextStruct.struct("frameset", "frameset", "undefined", api.mapStruct(SplineFrameSet, true));
    FullContextStruct.struct("settings_editor", "settings_editor", "undefined", api.mapStruct(SettingsEditor, true));
    FullContextStruct.struct("appstate.session.settings", "settings", "undefined", api.mapStruct(AppSettings, true));
    FullContextStruct.struct("object", "object", "undefined", api.mapStruct(SceneObject, true));
    FullContextStruct.struct("scene", "scene", "undefined", api.mapStruct(Scene, true));
    /*WARNING: failed to resolve a class:  last_tool  */
    FullContextStruct.struct("", "last_tool", "undefined", undefined);
    FullContextStruct.struct("appstate", "appstate", "undefined", api.mapStruct(AppState, true));
    FullContextStruct.list("appstate.toolstack.undostack", "operator_stack", [
      function getIter(api, list) {
        return g_app_state.toolstack.undostack[Symbol.iterator]();
      },
      function get(api, list, key) {
        return g_app_state.toolstack.undostack[key];
      },
      function getStruct(api, list, key) {
        OpStackArray.flag |= DataFlags.RECALC_CACHE;
        if (tool.apistruct != undefined) {
          tool.apistruct.flag |= DataFlags.RECALC_CACHE;
          return tool.apistruct;
        }
        tool.apistruct = g_app_state.toolstack.gen_tool_datastruct(tool);
        tool.apistruct.flag |= DataFlags.RECALC_CACHE;
        return tool.apistruct;
      },
      function getLength(api, list) {
        return g_app_state.toolstack.undostack.length;
      },
      /*function getkeyiter() {
          function* range(len) {
            for (var i=0; i<len; i++) {
                yield i;
            }
          }
          return range(g_app_state.toolstack.undostack.length)[Symbol.iterator]();
        }*/
      /*function getitempath(key) {
          return "["+key+"]";
        }*/
    ]);
    FullContextStruct.struct("spline", "spline", "undefined", api.mapStruct(Spline, true));
    FullContextStruct.struct("datalib", "datalib", "undefined", api.mapStruct(DataLib, true));
    FullContextStruct.struct("opseditor", "opseditor", "undefined", api.mapStruct(OpStackEditor, true));
    FullContextStruct.dynamicStruct("toolmode", "active_tool", "undefined", api.mapStruct(SplineToolMode, true));
  }

  var View2DHandlerStruct = api.mapStruct(View2DHandler, true);

  function api_define_View2DHandler(api) {
    View2DHandlerStruct.float("propradius", "propradius", "Magnet Radius").range(0.1, 1024).step(0.5).expRate(1.75).decimalPlaces(2);
    View2DHandlerStruct.bool("edit_all_layers", "edit_all_layers", "Edit All Layers").on("change", function (old) {
      return (function () {
        redraw_viewport();
      }).call(this.dataref, old)
    });
    View2DHandlerStruct.bool("half_pix_size", "half_pix_size", "half_pix_size")
      .icon(Icons.HALF_PIXEL_SIZE);
    View2DHandlerStruct.color4("background_color", "background_color", "Background").on("change", function (old) {
      return (function () {
        window.redraw_viewport();
      }).call(this.dataref, old)
    });
    View2DHandlerStruct.color4("default_stroke", "default_stroke", "Stroke");
    View2DHandlerStruct.color4("default_fill", "default_fill", "Fill");
    View2DHandlerStruct.enum("toolmode", "toolmode", ToolModes, "Active Tool").uiNames({
      SELECT: "Select",
      APPEND: "Append",
      RESIZE: "Resize",
      ROTATE: "Rotate",
      PEN   : "Pen"
    }).descriptions({
      SELECT: "Select",
      APPEND: "Append",
      RESIZE: "Resize",
      ROTATE: "Rotate",
      PEN   : "Pen"
    }).icons({
      SELECT: Icons.CURSOR_ARROW,
      APPEND: Icons.APPEND_VERTEX,
      RESIZE: Icons.RESIZE,
      ROTATE: Icons.ROTATE,
      PEN   : Icons.PEN_TOOL
    });
    View2DHandlerStruct.bool("draw_small_verts", "draw_small_verts", "Small Points")
      .icon(Icons.DRAW_SMALL_VERTS);
    View2DHandlerStruct.enum("selectmode", "selectmode", {
      VERTEX : SelMask.VERTEX,
      SEGMENT: SelMask.SEGMENT,
      FACE   : SelMask.FACE,
      OBJECT : SelMask.OBJECT
    }, "Selection Mode")
      .uiNames({
        VERTEX : "Vertex",
        SEGMENT: "Segment",
        FACE   : "Face",
        OBJECT : "Object"
      })
      .descriptions({
        VERTEX : "Vertex",
        SEGMENT: "Segment",
        FACE   : "Face",
        OBJECT : "Object"
      })
      .icons({
        VERTEX : Icons.VERT_MODE,
        SEGMENT: Icons.EDGE_MODE,
        FACE   : Icons.FACE_MODE,
        OBJECT : Icons.OBJECT_MODE,
        HANDLE : Icons.SHOW_HANDLES,
      })
      .customGetSet(function () {
        return this.ctx.scene.selectmode;
      }, function (val) {
        let scene = this.ctx.scene;

        console.log("selmask_enum.userSetData", scene, val);
        scene.selectmode = val | (scene.selectmode & SelMask.HANDLE);
      });

    View2DHandlerStruct.bool("draw_stroke_debug", "draw_stroke_debug", "Stroke Debug")
      .on('change', function () {
        this.ctx.spline.regen_sort();
        this.ctx.spline.regen_render();

        window.redraw_viewport();
      });

    View2DHandlerStruct.flags("selectmode", "selectmask", SelMask, "[object Object]").uiNames({
      VERTEX  : "Vertex",
      HANDLE  : "Handle",
      SEGMENT : "Segment",
      FACE    : "Face",
      TOPOLOGY: "Topology",
      OBJECT  : "Object"
    }).descriptions({
      VERTEX  : "Vertex",
      HANDLE  : "Handle",
      SEGMENT : "Segment",
      FACE    : "Face",
      TOPOLOGY: "Topology",
      OBJECT  : "Object"
    }).icons({
      1      : Icons.VERT_MODE,
      2      : Icons.SHOW_HANDLES,
      4      : Icons.EDGE_MODE,
      16     : Icons.FACE_MODE,
      32     : Icons.OBJECT_MODE,
      VERTEX : Icons.VERT_MODE,
      HANDLE : Icons.SHOW_HANDLES,
      SEGMENT: Icons.EDGE_MODE,
      FACE   : Icons.FACE_MODE,
      OBJECT : Icons.OBJECT_MODE
    }).on("change", function (old) {
      return (function () {
        window.redraw_viewport();
      }).call(this.dataref, old)
    });
    View2DHandlerStruct.bool("only_render", "only_render", "Hide Controls")
      .icon(Icons.ONLY_RENDER);
    View2DHandlerStruct.bool("draw_bg_image", "draw_bg_image", "Draw Image").on("change", function (old) {
      return (function () {
        window.redraw_viewport();
      }).call(this.dataref, old)
    });
    View2DHandlerStruct.flags("session_flag", "session_flag", SessionFlags, "Session Flags").uiNames({
      PROP_TRANSFORM: "Prop Transform"
    }).descriptions({
      PROP_TRANSFORM: "Prop Transform"
    }).icons({
      1             : Icons.PROP_TRANSFORM,
      PROP_TRANSFORM: Icons.PROP_TRANSFORM
    });
    View2DHandlerStruct.bool("tweak_mode", "tweak_mode", "Tweak Mode")
      .icon(Icons.CURSOR_ARROW);
    View2DHandlerStruct.bool("enable_blur", "enable_blur", "Blur").on("change", function (old) {
      return (function () {
        this.ctx.spline.regen_sort();
        redraw_viewport();
      }).call(this.dataref, old)
    })
      .icon(Icons.ENABLE_BLUR);
    View2DHandlerStruct.bool("draw_faces", "draw_faces", "Show Faces").on("change", function (old) {
      return (function () {
        this.ctx.spline.regen_sort();
        redraw_viewport();
      }).call(this.dataref, old)
    })
      .icon(Icons.MAKE_POLYGON);
    View2DHandlerStruct.bool("draw_video", "draw_video", "Draw Video").on("change", function (old) {
      return (function () {
        window.redraw_viewport();
      }).call(this.dataref, old)
    });
    View2DHandlerStruct.bool("draw_normals", "draw_normals", "Show Normals").on("change", function (old) {
      return (function () {
        redraw_viewport();
      }).call(this.dataref, old)
    })
      .icon(Icons.DRAW_NORMALS);
    View2DHandlerStruct.bool("draw_anim_paths", "draw_anim_paths", "Show Animation Paths")
      .icon(Icons.SHOW_ANIMPATHS);
    View2DHandlerStruct.float("zoom", "zoom", "Zoom").range(0.1, 100).uiRange(0.1, 100).step(0.1).expRate(1.2).decimalPlaces(3)
      .customGetSet(function () {
        if (!this.dataref) {
          return 0;
        }
        return this.dataref.zoom;
      }, function (val) {
        if (this.dataref) {
          this.dataref.set_zoom(val);
        }
      });

    View2DHandlerStruct.struct("active_material", "active_material", "undefined", api.mapStruct(Material, true));
    View2DHandlerStruct.float("default_linewidth", "default_linewidth", "Line Wid").range(0.01, 100).step(0.1).expRate(1.33).decimalPlaces(4);
    View2DHandlerStruct.enum("extrude_mode", "extrude_mode", ExtrudeModes, "New Line Mode").uiNames({
      SMOOTH     : "Smooth",
      LESS_SMOOTH: "Less Smooth",
      BROKEN     : "Broken"
    }).descriptions({
      SMOOTH     : "New Line Mode",
      LESS_SMOOTH: "New Line Mode",
      BROKEN     : "New Line Mode"
    }).icons({
      SMOOTH     : Icons.EXTRUDE_MODE_G2,
      LESS_SMOOTH: Icons.EXTRUDE_MODE_G1,
      BROKEN     : Icons.EXTRUDE_MODE_G0
    });
    View2DHandlerStruct.bool("pin_paths", "pin_paths", "Pin Paths");
    View2DHandlerStruct.struct("background_image", "background_image", "undefined", api.mapStruct(ImageUser, true));
  }

  var MaterialStruct = api.mapStruct(Material, true);

  function api_define_Material(api) {
    MaterialStruct.color4("fillcolor", "fillcolor", "fill")
      .on("change", function (old) {
        this.dataref.update();
        window.redraw_viewport();
      });
    MaterialStruct.float("linewidth", "linewidth", "linewidth").range(0.1, 2500).step(0.25).expRate(1.75).decimalPlaces(4)
      .on("change", function (old) {
        this.dataref.update();
        window.redraw_viewport();
      });
    MaterialStruct.float("linewidth2", "linewidth2", "linewidth2").step(0.25).expRate(1.75).decimalPlaces(4)
      .on("change", function (old) {
        this.dataref.update();
        window.redraw_viewport();
      });
    MaterialStruct.flags("flag", "flag", MaterialFlags, "material flags").uiNames({
      SELECT      : "Select",
      MASK_TO_FACE: "Mask To Face"
    }).descriptions({
      SELECT      : "Select",
      MASK_TO_FACE: "Mask To Face"
    }).icons(DataTypes)
      .on("change", function (old) {
        this.dataref.update();
        window.redraw_viewport();
      });
    MaterialStruct.color4("strokecolor", "strokecolor", "Stroke").on("change", function (old) {
      this.dataref.update();
      window.redraw_viewport();
    });
    MaterialStruct.float("blur", "blur", "Blur").step(0.5).expRate(1.33).decimalPlaces(4)
      .on("change", function (old) {
        this.dataref.update();
        window.redraw_viewport();
      });
    MaterialStruct.color4("strokecolor2", "strokecolor2", "Double Stroke")
      .on("change", function (old) {
        this.dataref.update();
        window.redraw_viewport();
      });
  }

  var ImageUserStruct = api.mapStruct(ImageUser, true);

  function api_define_ImageUser(api) {
    ;
    ImageUserStruct.vec2("off", "off", "Offset").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4);
    ImageUserStruct.vec2("scale", "scale", "Scale").range(0.0001, 90).step(0.1).expRate(1.33).decimalPlaces(4);
  }

  var DopeSheetEditorStruct = api.mapStruct(DopeSheetEditor, true);

  function api_define_DopeSheetEditor(api) {
    DopeSheetEditorStruct.bool("selected_only", "selected_only", "Selected Only").on("change", function (old) {
      return (function (owner) {
        owner.rebuild();
      }).call(this.dataref, old)
    });
    DopeSheetEditorStruct.bool("pinned", "pinned", "Pin");
    DopeSheetEditorStruct.float("timescale", "timescale", "timescale").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4).on("change", function (old) {
      return (function (owner) {
        owner.updateKeyPositions();
      }).call(this.dataref, old)
    });
  }

  var CurveEditorStruct = api.mapStruct(CurveEditor, true);

  function api_define_CurveEditor(api) {
    CurveEditorStruct.bool("selected_only", "selected_only", "Selected Only").on("change", function (old) {
      return (function () {
        if (this.ctx != undefined && this.ctx.editcurve != undefined)
          this.ctx.editcurve.do_full_recalc();
      }).call(this.dataref, old)
    });
    CurveEditorStruct.bool("pinned", "pinned", "Pin");
  }

  var SplineFrameSetStruct = api.mapStruct(SplineFrameSet, true);

  function api_define_SplineFrameSet(api) {
    SplineFrameSetStruct.list("lib_anim_idmap", "animkeys", [
      function getIter(api, list) {
        return new obj_value_iter(list);
      },
      function get(api, list, key) {
        console.log("get key", key, list);
        return list[key];
      },
      function getStruct(api, list, key) {
        return AnimKeyStruct2;
      },
      function getLength(api, list) {
        var tot = 0.0;
        for (var k in list) {
          tot++;
        }
        return tot;
      },
      /*function getkeyiter() {
            return new obj_key_iter(this);
          }*/
      /*function itempath(key) {
            return "["+key+"]";
          }*/
    ]);
    SplineFrameSetStruct.struct("spline", "drawspline", "undefined", api.mapStruct(Spline, true));
    SplineFrameSetStruct.struct("pathspline", "pathspline", "undefined", api.mapStruct(Spline, true));
    SplineFrameSetStruct.list("vertex_animdata", "keypaths", [
      function getIter(api, list) {
        let list2 = list;
        return (function* () {
          for (let k in list2) {
            yield list2[k];
          }
        })();
      },
      function get(api, list, key) {
        return list[key];
      },
      function getStruct(api, list, key) {
        return animdata_struct;
      },
      function getLength(api, list) {
        let i = 0;
        for (let k in list) {
          i++;
        }
        return i;
      },
      /*function getkeyiter() {
              var keys=Object.keys(this);
              var ret=new GArray();
              for (var i=0; i<keys.length; i++) {
                  ret.push(keys[i]);
              }
              return ret;
            }*/
      /*function itempath(key) {
              return "["+key+"]";
            }*/
    ]);
    SplineFrameSetStruct.struct("active_animdata", "active_keypath", "undefined", api.mapStruct(VertexAnimData, true));
  }

  var SplineStruct = api.mapStruct(Spline, true);

  function api_define_Spline(api) {
    SplineStruct.list("lib_anim_idmap", "animkeys", [
      function getIter(api, list) {
        return new obj_value_iter(list);
      },
      function get(api, list, key) {
        console.log("get key", key, list);
        return list[key];
      },
      function getStruct(api, list, key) {
        return AnimKeyStruct2;
      },
      function getLength(api, list) {
        var tot = 0.0;
        for (var k in list) {
          tot++;
        }
        return tot;
      },
      /*function getkeyiter() {
            return new obj_key_iter(this);
          }*/
      /*function itempath(key) {
            return "["+key+"]";
          }*/
    ]);
    SplineStruct.struct("faces.active", "active_face", "undefined", api.mapStruct(SplineFace, true));
    SplineStruct.struct("segments.active", "active_segment", "undefined", api.mapStruct(SplineSegment, true));
    SplineStruct.struct("verts.active", "active_vertex", "undefined", api.mapStruct(SplineVertex, true));
    SplineStruct.list("faces", "faces", [
      function getIter(api, list) {
        return list[Symbol.iterator]();
      },
      function get(api, list, key) {
        return list.local_idmap[key];
      },
      function getActive(api, list) {
        return list.active;
      },
      function getStruct(api, list, key) {
        return SplineFaceStruct;
      },
      function getLength(api, list) {
        return list.length;
      },
      /*function getkeyiter() {
              var keys=Object.keys(this.local_idmap);
              var ret=new GArray();
              for (var i=0; i<keys.length; i++) {
                  ret.push(keys[i]);
              }
              return ret;
            }*/
      /*function itempath(key) {
              return ".local_idmap["+key+"]";
            }*/
    ]);
    SplineStruct.list("segments", "segments", [
      function getIter(api, list) {
        return list[Symbol.iterator]();
      },
      function get(api, list, key) {
        return list.local_idmap[key];
      },
      function getStruct(api, list, key) {
        return SplineSegmentStruct;
      },
      function getActive(api, list) {
        return list.active;
      },
      function getLength(api, list) {
        return list.length;
      },
      function getKey(api, list, obj) {
        return obj.eid;
      },
      /*function getkeyiter() {
              var keys=Object.keys(this.local_idmap);
              var ret=new GArray();
              for (var i=0; i<keys.length; i++) {
                  ret.push(keys[i]);
              }
              return ret;
            }*/
      /*function itempath(key) {
              return ".local_idmap["+key+"]";
            }*/
    ]);
    SplineStruct.list("verts", "verts", [
      function getIter(api, list) {
        return list[Symbol.iterator]();
      },
      function get(api, list, key) {
        return list.local_idmap[key];
      },
      function getStruct(api, list, key) {
        return SplineVertexStruct;
      },
      function getActive(api, list) {
        return list.active;
      },
      function getKey(api, list, obj) {
        return obj.eid;
      },
      function getLength(api, list) {
        return list.length;
      },
      /*function getkeyiter() {
              var keys=Object.keys(this.local_idmap);
              var ret=new GArray();
              for (var i=0; i<keys.length; i++) {
                  ret.push(keys[i]);
              }
              return ret;
            }*/
      /*function itempath(key) {
              return ".local_idmap["+key+"]";
            }*/
    ]);
    SplineStruct.list("handles", "handles", [
      function getIter(api, list) {
        return list[Symbol.iterator]();
      },
      function get(api, list, key) {
        return list.local_idmap[key];
      },
      function getActive(api, list) {
        return list.active;
      },
      function getStruct(api, list, key) {
        return SplineVertexStruct;
      },
      function getKey(api, list, obj) {
        return obj.eid;
      },
      function getLength(api, list) {
        return list.length;
      },
      /*function getkeyiter() {
              var keys=Object.keys(this.local_idmap);
              var ret=new GArray();
              for (var i=0; i<keys.length; i++) {
                  ret.push(keys[i]);
              }
              return ret;
            }*/
      /*function itempath(key) {
              return ".local_idmap["+key+"]";
            }*/
    ]);
    SplineStruct.list("faces", "editable_faces", [
      function getIter(api, list) {
        return list.editable(g_app_state.ctx)[Symbol.iterator]();
      },
      function get(api, list, key) {
        return list.local_idmap[key];
      },
      function getActive(api, list) {
        return list.active;
      },
      function getStruct(api, list, key) {
        return SplineFaceStruct;
      },
      function getKey(api, list, obj) {
        return obj.eid;
      },
      function getLength(api, list) {
        let len = 0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
          len++;
        }
        return len;
      },
      /*function getkeyiter(ctx) {
              var keys=new GArray();
              for (let e of this.editable(ctx)) {
                  keys.push(e.eid);
              }
              return keys;
            }*/
      /*function itempath(key) {
              return ".local_idmap["+key+"]";
            }*/
    ]);
    SplineStruct.list("segments", "editable_segments", [
      function getIter(api, list) {
        return list.editable(g_app_state.ctx)[Symbol.iterator]();
      },
      function get(api, list, key) {
        return list.local_idmap[key];
      },
      function getStruct(api, list, key) {
        return SplineSegmentStruct;
      },
      function getKey(api, list, obj) {
        return obj.eid;
      },
      function getLength(api, list) {
        let len = 0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
          len++;
        }
        return len;
      },
      /*function getkeyiter(ctx) {
              var keys=new GArray();
              for (let e of this.editable(ctx)) {
                  keys.push(e.eid);
              }
              return keys;
            }*/
      /*function itempath(key) {
              return ".local_idmap["+key+"]";
            }*/
    ]);
    SplineStruct.list("verts", "editable_verts", [
      function getIter(api, list) {
        return list.editable(g_app_state.ctx)[Symbol.iterator]();
      },
      function get(api, list, key) {
        return list.local_idmap[key];
      },
      function getStruct(api, list, key) {
        return SplineVertexStruct;
      },
      function getKey(api, list, obj) {
        return obj.eid;
      },
      function getLength(api, list) {
        let len = 0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
          len++;
        }
        return len;
      },
      /*function getkeyiter(ctx) {
              var keys=new GArray();
              for (let e of this.editable(ctx)) {
                  keys.push(e.eid);
              }
              return keys;
            }*/
      /*function itempath(key) {
              return ".local_idmap["+key+"]";
            }*/
    ]);
    SplineStruct.list("handles", "editable_handles", [
      function getIter(api, list) {
        return list.editable(g_app_state.ctx)[Symbol.iterator]();
      },
      function get(api, list, key) {
        return list.local_idmap[key];
      },
      function getStruct(api, list, key) {
        return SplineVertexStruct;
      },
      function getKey(api, list, obj) {
        return obj.eid;
      },
      function getLength(api, list) {
        let len = 0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
          len++;
        }
        return len;
      },
      /*function getkeyiter(ctx) {
              var keys=new GArray();
              for (let e of this.editable(ctx)) {
                  keys.push(e.eid);
              }
              return keys;
            }*/
      /*function itempath(key) {
              return ".local_idmap["+key+"]";
            }*/
    ]);
    SplineStruct.list("faces", "selected_facese", [
      function getIter(api, list) {
        return list.selected.editable(g_app_state.ctx)[Symbol.iterator]();
      },
      function get(api, list, key) {
        return list.local_idmap[key];
      },
      function getStruct(api, list, key) {
        return SplineFaceStruct;
      },
      function getKey(api, list, obj) {
        return obj.eid;
      },
      function getLength(api, list) {
        let len = 0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
          len++;
        }
        return len;
      },
      /*function getkeyiter(ctx) {
              var keys=new GArray();
              for (let e of this.editable(ctx)) {
                  keys.push(e.eid);
              }
              return keys;
            }*/
      /*function itempath(key) {
              return ".local_idmap["+key+"]";
            }*/
    ]);
    SplineStruct.list("segments", "selected_segments", [
      function getIter(api, list) {
        return list.selected.editable(g_app_state.ctx)[Symbol.iterator]();
      },
      function get(api, list, key) {
        return list.local_idmap[key];
      },
      function getStruct(api, list, key) {
        return SplineSegmentStruct;
      },
      function getKey(api, list, obj) {
        return obj.eid;
      },
      function getLength(api, list) {
        let len = 0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
          len++;
        }
        return len;
      },
      /*function getkeyiter(ctx) {
              var keys=new GArray();
              for (let e of this.editable(ctx)) {
                  keys.push(e.eid);
              }
              return keys;
            }*/
      /*function itempath(key) {
              return ".local_idmap["+key+"]";
            }*/
    ]);
    SplineStruct.list("verts", "selected_verts", [
      function getIter(api, list) {
        return list.selected.editable(g_app_state.ctx)[Symbol.iterator]();
      },
      function get(api, list, key) {
        return list.local_idmap[key];
      },
      function getStruct(api, list, key) {
        return SplineVertexStruct;
      },
      function getKey(api, list, obj) {
        return obj.eid;
      },
      function getLength(api, list) {
        let len = 0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
          len++;
        }
        return len;
      },
      /*function getkeyiter(ctx) {
              var keys=new GArray();
              for (let e of this.editable(ctx)) {
                  keys.push(e.eid);
              }
              return keys;
            }*/
      /*function itempath(key) {
              return ".local_idmap["+key+"]";
            }*/
    ]);
    SplineStruct.list("handles", "selected_handles", [
      function getIter(api, list) {
        return list.selected.editable(g_app_state.ctx)[Symbol.iterator]();
      },
      function get(api, list, key) {
        return list.local_idmap[key];
      },
      function getStruct(api, list, key) {
        return SplineVertexStruct;
      },
      function getKey(api, list, obj) {
        return obj.eid;
      },
      function getLength(api, list) {
        let len = 0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
          len++;
        }
        return len;
      },
      /*function getkeyiter(ctx) {
              var keys=new GArray();
              for (let e of this.editable(ctx)) {
                  keys.push(e.eid);
              }
              return keys;
            }*/
      /*function itempath(key) {
              return ".local_idmap["+key+"]";
            }*/
    ]);
    SplineStruct.list("layerset", "layerset", [
      function getIter(api, list) {
        return list[Symbol.iterator]();
      },
      function get(api, list, key) {
        return list.idmap[key];
      },
      function getStruct(api, list, key) {
        return SplineLayerStruct;
      },
      function getKey(api, list, obj) {
        return obj.id;
      },
      function getLength(api, list) {
        return list.length;
      },
      /*function getkeyiter() {
            var keys=Object.keys(this.idmap);
            var ret=new GArray();
            for (var i=0; i<keys.length; i++) {
                ret.push(keys[i]);
            }
            return ret;
          }*/
      /*function itempath(key) {
            return ".idmap["+key+"]";
          }*/
    ]);
    SplineStruct.struct("layerset.active", "active_layer", "undefined", api.mapStruct(SplineLayer, true));
  }

  var SplineFaceStruct = api.mapStruct(SplineFace, true);

  function api_define_SplineFace(api) {
    SplineFaceStruct.int("eid", "eid", "eid").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33);
    SplineFaceStruct.struct("mat", "mat", "undefined", api.mapStruct(Material, true));
    SplineFaceStruct.flags("flag", "flag", SplineFlags, "Flags").uiNames({
      SELECT            : "Select",
      BREAK_TANGENTS    : "Break Tangents",
      USE_HANDLES       : "Use Handles",
      UPDATE            : "Update",
      TEMP_TAG          : "Temp Tag",
      BREAK_CURVATURES  : "Break Curvatures",
      HIDE              : "Hide",
      FRAME_DIRTY       : "Frame Dirty",
      PINNED            : "Pinned",
      NO_RENDER         : "No Render",
      AUTO_PAIRED_HANDLE: "Auto Paired Handle",
      UPDATE_AABB       : "Update Aabb",
      DRAW_TEMP         : "Draw Temp",
      GHOST             : "Ghost",
      UI_SELECT         : "Ui Select",
      FIXED_KS          : "Fixed Ks",
      REDRAW_PRE        : "Redraw Pre",
      REDRAW            : "Redraw",
      COINCIDENT        : "Coincident"
    }).descriptions({
      SELECT            : "Select",
      BREAK_TANGENTS    : "Break Tangents",
      USE_HANDLES       : "Use Handles",
      UPDATE            : "Update",
      TEMP_TAG          : "Temp Tag",
      BREAK_CURVATURES  : "Allows curve to more tightly bend at this point",
      HIDE              : "Hide",
      FRAME_DIRTY       : "Frame Dirty",
      PINNED            : "Pinned",
      NO_RENDER         : "No Render",
      AUTO_PAIRED_HANDLE: "Auto Paired Handle",
      UPDATE_AABB       : "Update Aabb",
      DRAW_TEMP         : "Draw Temp",
      GHOST             : "Ghost",
      UI_SELECT         : "Ui Select",
      FIXED_KS          : "Fixed Ks",
      REDRAW_PRE        : "Redraw Pre",
      REDRAW            : "Redraw",
      COINCIDENT        : "Coincident"
    }).icons({
      2               : Icons.EXTRUDE_MODE_G0,
      32              : Icons.EXTRUDE_MODE_G1,
      BREAK_TANGENTS  : Icons.EXTRUDE_MODE_G0,
      BREAK_CURVATURES: Icons.EXTRUDE_MODE_G1
    });
  }

  var SplineSegmentStruct = api.mapStruct(SplineSegment, true);

  function api_define_SplineSegment(api) {
    SplineSegmentStruct.bool("editable", "editable", "Element is visible and can be edited").customGet(function () {
      let seg = this.dataref;
      //XXX mass set path code will sometimes set
      //this.ctx to seg.

      //let ctx = this.ctx;
      let ctx = window.g_app_state.ctx;

      let ok = seg.flag & SplineFlags.SELECT;
      ok = ok && !(seg.flag & SplineFlags.HIDE);

      if (!ok) {
        return false;
      }

      if (!ctx.edit_all_layers) {
        let spline = ctx.spline;
        ok = ok && spline.layerset.active.id in seg.layers;
      }

      return ok;
    });

    let segment_update = function () {
      let segment = this.dataref;
      segment.mat.update();

      segment.flag |= SplineFlags.REDRAW;
      segment.v1.flag |= SplineFlags.REDRAW;
      segment.v2.flag |= SplineFlags.REDRAW;

      g_app_state.ctx.spline.regen_sort();
      window.redraw_viewport();
    }

    SplineSegmentStruct.float("w1", "w1", "w1").range(0.001, 10000).noUnits().step(0.1).expRate(1.33).decimalPlaces(4)
      .on("change", segment_update);
    SplineSegmentStruct.float("w2", "w2", "w2").range(0.001, 10000).noUnits().step(0.1).expRate(1.33).decimalPlaces(4)
      .on("change", segment_update);
    SplineSegmentStruct.float("shift1", "shift1", "shift1").range(-100, 100).noUnits().step(0.1).expRate(1.33).decimalPlaces(4)
      .on("change", segment_update);
    SplineSegmentStruct.float("shift2", "shift2", "shift2").range(-100, 100).noUnits().step(0.1).expRate(1.33).decimalPlaces(4)
      .on("change", segment_update);
    SplineSegmentStruct.int("eid", "eid", "eid").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33);
    SplineSegmentStruct.flags("flag", "flag", SplineFlags, "Flags").uiNames({
      SELECT            : "Select",
      BREAK_TANGENTS    : "Break Tangents",
      USE_HANDLES       : "Use Handles",
      UPDATE            : "Update",
      TEMP_TAG          : "Temp Tag",
      BREAK_CURVATURES  : "Break Curvatures",
      HIDE              : "Hide",
      FRAME_DIRTY       : "Frame Dirty",
      PINNED            : "Pinned",
      NO_RENDER         : "No Render",
      AUTO_PAIRED_HANDLE: "Auto Paired Handle",
      UPDATE_AABB       : "Update Aabb",
      DRAW_TEMP         : "Draw Temp",
      GHOST             : "Ghost",
      UI_SELECT         : "Ui Select",
      FIXED_KS          : "Fixed Ks",
      REDRAW_PRE        : "Redraw Pre",
      REDRAW            : "Redraw",
      COINCIDENT        : "Coincident"
    }).descriptions({
      SELECT            : "Select",
      BREAK_TANGENTS    : "Break Tangents",
      USE_HANDLES       : "Use Handles",
      UPDATE            : "Update",
      TEMP_TAG          : "Temp Tag",
      BREAK_CURVATURES  : "Allows curve to more tightly bend at this point",
      HIDE              : "Hide",
      FRAME_DIRTY       : "Frame Dirty",
      PINNED            : "Pinned",
      NO_RENDER         : "No Render",
      AUTO_PAIRED_HANDLE: "Auto Paired Handle",
      UPDATE_AABB       : "Update Aabb",
      DRAW_TEMP         : "Draw Temp",
      GHOST             : "Ghost",
      UI_SELECT         : "Ui Select",
      FIXED_KS          : "Fixed Ks",
      REDRAW_PRE        : "Redraw Pre",
      REDRAW            : "Redraw",
      COINCIDENT        : "Coincident"
    }).icons({
      2               : Icons.EXTRUDE_MODE_G0,
      32              : Icons.EXTRUDE_MODE_G1,
      BREAK_TANGENTS  : Icons.EXTRUDE_MODE_G0,
      BREAK_CURVATURES: Icons.EXTRUDE_MODE_G1
    }).on("change", function (old) {
      let segment = this.dataref;

      segment.flag |= SplineFlags.REDRAW;

      this.ctx.spline.regen_sort();
      window.redraw_viewport();
    });
    SplineSegmentStruct.bool("renderable", "renderable", "renderable");
    SplineSegmentStruct.struct("mat", "mat", "undefined", api.mapStruct(Material, true));
    SplineSegmentStruct.float("z", "z", "z").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4);
  }

  var SplineVertexStruct = api.mapStruct(SplineVertex, true);

  function api_define_SplineVertex(api) {
    SplineVertexStruct.int("eid", "eid", "eid").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33);
    SplineVertexStruct.flags("flag", "flag", SplineFlags, "Flags").uiNames({
      SELECT            : "Select",
      BREAK_TANGENTS    : "Break Tangents",
      USE_HANDLES       : "Use Handles",
      UPDATE            : "Update",
      TEMP_TAG          : "Temp Tag",
      BREAK_CURVATURES  : "Break Curvatures",
      HIDE              : "Hide",
      FRAME_DIRTY       : "Frame Dirty",
      PINNED            : "Pinned",
      NO_RENDER         : "No Render",
      AUTO_PAIRED_HANDLE: "Auto Paired Handle",
      UPDATE_AABB       : "Update Aabb",
      DRAW_TEMP         : "Draw Temp",
      GHOST             : "Ghost",
      UI_SELECT         : "Ui Select",
      FIXED_KS          : "Fixed Ks",
      REDRAW_PRE        : "Redraw Pre",
      REDRAW            : "Redraw",
      COINCIDENT        : "Coincident"
    }).descriptions({
      SELECT            : "Select",
      BREAK_TANGENTS    : "Break Tangents",
      USE_HANDLES       : "Use Handles",
      UPDATE            : "Update",
      TEMP_TAG          : "Temp Tag",
      BREAK_CURVATURES  : "Allows curve to more tightly bend at this point",
      HIDE              : "Hide",
      FRAME_DIRTY       : "Frame Dirty",
      PINNED            : "Pinned",
      NO_RENDER         : "No Render",
      AUTO_PAIRED_HANDLE: "Auto Paired Handle",
      UPDATE_AABB       : "Update Aabb",
      DRAW_TEMP         : "Draw Temp",
      GHOST             : "Ghost",
      UI_SELECT         : "Ui Select",
      FIXED_KS          : "Fixed Ks",
      REDRAW_PRE        : "Redraw Pre",
      REDRAW            : "Redraw",
      COINCIDENT        : "Coincident"
    }).icons({
      2               : Icons.EXTRUDE_MODE_G0,
      32              : Icons.EXTRUDE_MODE_G1,
      BREAK_TANGENTS  : Icons.EXTRUDE_MODE_G0,
      BREAK_CURVATURES: Icons.EXTRUDE_MODE_G1
    }).on("change", function (old) {
      this.ctx.spline.regen_sort();

      if (this.dataref !== undefined) {
        this.dataref.flag |= SplineFlags.UPDATE;
      }

      //this.ctx.spline.propagate_update_flags();
      this.ctx.spline.resolve = 1;
      window.redraw_viewport();
    });
    SplineVertexStruct.vec3("", "co", "Co").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4);
    SplineVertexStruct.float("width", "width", "width").range(-50, 200).step(0.1).expRate(1.33).decimalPlaces(4).on("change", function (old) {
      this.dataref.flag |= SplineFlags.REDRAW;
      window.redraw_viewport();
    });
    SplineVertexStruct.float("shift", "shift", "shift").range(-5, 5).noUnits().step(0.1).expRate(1.33).decimalPlaces(4)
      .on("change", function (old) {
        this.dataref.flag |= SplineFlags.REDRAW;
        window.redraw_viewport();
      });
  }

  var SplineLayerStruct = api.mapStruct(SplineLayer, true);

  function api_define_SplineLayer(api) {
    SplineLayerStruct.int("id", "id", "id").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33);
    ;
    SplineLayerStruct.flags("flag", "flag", SplineLayerFlags, "flag").uiNames({
      8         : "Mask To Prev",
      HIDE      : "Hide",
      CAN_SELECT: "Can Select",
      MASK      : "Mask"
    }).descriptions({
      MASK: "Use previous layer as a mask"
    }).icons(DataTypes).on("change", function (old) {
      return (function () {
        window.redraw_viewport();
      }).call(this.dataref, old)
    });
  }

  var VertexAnimDataStruct = api.mapStruct(VertexAnimData, true);

  function api_define_VertexAnimData(api) {
    VertexAnimDataStruct.flags("animflag", "animflag", VDAnimFlags, "animflag").uiNames({
      SELECT           : "Select",
      STEP_FUNC        : "Step Func",
      HIDE             : "Hide",
      OWNER_IS_EDITABLE: "Owner Is Editable"
    }).descriptions({
      SELECT           : "Select",
      STEP_FUNC        : "Step Func",
      HIDE             : "Hide",
      OWNER_IS_EDITABLE: "Owner Is Editable"
    }).icons(DataTypes);
    VertexAnimDataStruct.int("eid", "owning_vertex", "Owning Vertex").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33);
  }

  var SettingsEditorStruct = api.mapStruct(SettingsEditor, true);

  function api_define_SettingsEditor(api) {
  }

  var AppSettingsStruct = api.mapStruct(AppSettings, true);

  function api_define_AppSettings(api) {
    AppSettingsStruct.enum("unit_scheme", "unit_system", {
      imperial: "imperial",
      metric  : "metric"
    }, "System").uiNames({
      imperial: "Imperial",
      metric  : "Metric"
    }).descriptions({
      imperial: "Imperial",
      metric  : "Metric"
    }).icons(DataTypes).on("change", function (old) {
      return (function () {
        g_app_state.session.settings.save();
      }).call(this.dataref, old)
    });
    AppSettingsStruct.enum("unit", "default_unit", {
      cm  : "cm",
      "in": "in",
      ft  : "ft",
      m   : "m",
      mm  : "mm",
      km  : "km",
      mile: "mile"
    }, "Default Unit").descriptions({
      cm  : "Cm",
      "in": "In",
      ft  : "Ft",
      m   : "M",
      mm  : "Mm",
      km  : "Km",
      mile: "Mile"
    }).icons(DataTypes).on("change", function (old) {
      return (function () {
        g_app_state.session.settings.save();
      }).call(this.dataref, old)
    });
  }

  var SceneObjectStruct = api.mapStruct(SceneObject, true);

  function api_define_SceneObject(api) {
    ;
    SceneObjectStruct.vec3("ctx_bb", "ctx_bb", "Dimensions").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4)
      .on("change", function (old) {
        if (this.ctx.mesh !== undefined)
          this.ctx.mesh.regen_render();
        if (this.ctx.view2d !== undefined && this.ctx.view2d.selectmode & EditModes.GEOMETRY) {
          this.ctx.object.dag_update();
        }
      });
  }

  var SceneStruct = api.mapStruct(Scene, true);

  function api_define_Scene(api) {
    SceneStruct.list("lib_anim_idmap", "animkeys", [
      function getIter(api, list) {
        return new obj_value_iter(list);
      },
      function get(api, list, key) {
        console.log("get key", key, list);
        return list[key];
      },
      function getStruct(api, list, key) {
        return AnimKeyStruct2;
      },
      function getLength(api, list) {
        var tot = 0.0;
        for (var k in list) {
          tot++;
        }
        return tot;
      },
      /*function getkeyiter() {
            return new obj_key_iter(this);
          }*/
      /*function itempath(key) {
            return "["+key+"]";
          }*/
    ]);
    ;
    SceneStruct.int("time", "frame", "Frame").range(1, 10000).step(1).expRate(1.5)
      .on("change", function (old) {
        let time = this.dataref.time;
        this.dataref.time = old;
        this.dataref.change_time(g_app_state.ctx, time);
        window.redraw_viewport();
      });
    SceneStruct.list("objects", "objects", [
      function getIter(api, list) {
        return new obj_value_iter(list.object_idmap);
      },
      function get(api, list, key) {
        console.log("get key", key, list);
        return list.object_idmap[key];
      },
      function getStruct(api, list, key) {
        return SceneObjectStruct;
      },
      function getLength(api, list) {
        return list.objects.length;
      },
      /*function getkeyiter() {
            return new obj_key_iter(this.object_idmap);
          }*/
      /*function itempath(key) {
            return ".object_idmap["+key+"]";
          }*/
    ]);
    SceneStruct.struct("objects.active", "active_object", "undefined", api.mapStruct(SceneObject, true));
  }

  var AppStateStruct = api.mapStruct(AppState, true);

  function api_define_AppState(api) {
    AppStateStruct.bool("select_multiple", "select_multiple", "Multiple");
    AppStateStruct.bool("select_inverse", "select_inverse", "Deselect");
  }

  var DataLibStruct = api.mapStruct(DataLib, true);

  function api_define_DataLib(api) {
    /*WARNING: failed to resolve a class: ctx.datalib.datalists.items[6] spline datalists.items[6] */
    DataLibStruct.struct("datalists.items[6]", "spline", "undefined", undefined);
    DataLibStruct.struct("datalists.items[7]", "frameset", "undefined", api.mapStruct(DataList, true));
    DataLibStruct.struct("datalists.items[9]", "object", "undefined", api.mapStruct(DataList, true));
    DataLibStruct.struct("datalists.items[13]", "collection", "undefined", api.mapStruct(DataList, true));
    DataLibStruct.struct("datalists.items[5]", "scene", "undefined", api.mapStruct(DataList, true));
    /*WARNING: failed to resolve a class: ctx.datalib.datalists.items[8] image datalists.items[8] */
    DataLibStruct.struct("datalists.items[8]", "image", "undefined", undefined);
  }

  var DataListStruct = api.mapStruct(DataList, true);

  function api_define_DataList(api) {
    ;
    DataListStruct.int("typeid", "typeid", "typeid").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33);
    DataListStruct.list("idmap", "items", [
      function getIter(api, list) {
        let ret = [];
        for (var k in list) {
          ret.push(list[k]);
        }
        return ret[Symbol.iterator]();
      },
      function get(api, list, key) {
        return list[key];
      },
      function getStruct(api, list, key) {
        return datablock_structs[item.lib_type];
      },
      function getLength(api, list) {
        let count = 0;
        for (let k in list) {
          count++;
        }
        return count;
      },
      /*function getkeyiter() {
            let ret=[];
            for (var k in this) {
                ret.push(k);
            }
            return ret[Symbol.iterator]();
          }*/
      /*function itempath(key) {
            return "["+key+"]";
          }*/
    ]);
  }

  var OpStackEditorStruct = api.mapStruct(OpStackEditor, true);

  function api_define_OpStackEditor(api) {
    OpStackEditorStruct.bool("filter_sel", "filter_sel", "Filter Sel")
      .icon(Icons.FILTER_SEL_OPS);
  }

  var SplineToolModeStruct = api.mapStruct(SplineToolMode, true);

  function api_define_SplineToolMode(api) {
    ;
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
  api_define_SplineToolMode(api);


  initToolModeAPI(api);

  api.rootContextStruct = FullContextStruct;

  FullContextStruct.struct("last_tool", "last_tool");
  buildToolSysAPI(api, true, FullContextStruct);

  return api;
}
