import os, os.path

if not os.path.exists("src/config/config_defines.js"):
  print("Auto-generating src/config/config_defines.js. . .")
  
  f = open("src/config/config_defines.js", "w")
  f.close()

if not os.path.exists("src/config/config_local.js"):
  print("Auto-generating src/config/config_local.js. . .")
  
  f = open("src/config/config_local.js", "w")
  f.write("'use strict';\n");
  f.close()

try:
  import build_local
except:
  build_local = {}
  
sources = [
	"src/html/unit_test.html",
	"src/html/main.html",
  "src/html/module_test.html",
  "src/core/module.js",
  "src/core/typesystem.js",
  "src/config/config.js",
  "src/config/config_local.js",
  "src/core/const.js",
  "src/util/object_cache.js",
 	"tools/utils/crypto/sha1.js",
  "tools/utils/libs/lz-string/libs/base64-string-v1.1.0.js",
  "tools/utils/libs/lz-string/libs/lz-string-1.3.3.js",
	"src/util/jslzjb.js",
  "src/core/startup_file.js",
  "src/util/base_vector.js",
  "src/datafiles/icon_enum.js",
  "src/util/vector.js",
	"src/core/J3DIMath.js",
	"src/util/utils.js",
  "src/util/strutils.js",
  "src/util/save_as.js",
	"src/core/lib_api.js",
	"src/core/lib_api_typedefine.js",
	"src/util/mathlib.js",
  "src/util/colorutils.js",
	"src/util/parseutil.js",
	"src/core/jobs.js",
	"src/core/ajax.js",
  "src/core/raster.js",
  "src/core/UserSettings.js",
	"src/core/AppState.js",
	"src/core/units.js",
	"src/core/data_api.js",
  "src/core/data_api_parser.js",
	"src/core/struct.js",
  "src/core/video.js",
	"src/core/fileapi.js",
  "src/core/animdata.js",
  "src/config/config_defines.js",

  "src/curve/curve.js",
  "src/curve/curvebase.js",
  "src/curve/spline_math.js",
  "src/curve/spline_math_safe.js",
  "src/curve/spline_element_array.js",
  "src/curve/spline_types.js",
  "src/curve/spline_query.js",
  "src/curve/spline_draw.js",
  "src/curve/spline.js",
  "src/curve/solver.js",
  "src/curve/solver_new.js",
  
  "src/scene/scene.js",
  
  "src/editors/viewport/events.js",
  "src/ui/touchevents.js",
  
  "src/core/toolprops.js",
  "src/core/toolprops_iter.js",
	"src/core/toolops_api.js",
  "src/core/eventdag.js",
  
	"src/core/lib_utils.js",
  "src/nacl/nacl_api.js",
  "src/nacl/nacl_common.js",

  "src/editors/viewport/transdata.js",
  "src/editors/viewport/transform.js",
  "src/editors/viewport/spline_selectops.js",
  "src/editors/viewport/spline_createops.js",
  "src/editors/viewport/spline_editops.js",
  "src/editors/viewport/spline_layerops.js",
  "src/editors/viewport/spline_animops.js",
  "src/ui/theme.js",
  "src/ui/theme_def.js",
	"src/ui/UIElement.js",
  "src/ui/UIFileData.js",
  "src/ui/UICanvas.js",
  "src/ui/UICanvas2D.js",
  "src/ui/UIFrame.js",
  "src/ui/UIPack.js",
  "src/ui/icon.js",
	"src/ui/UIWidgets.js",
  "src/editors/viewport/selectmode.js",
  "src/ui/UITextBox.js",
  "src/ui/ScreenKeyboard.js",
	"src/ui/UIMenu.js",
	"src/ui/RadialMenu.js",
  "src/ui/UIWidgets_special.js",
  "src/ui/UITabPanel.js",
  "src/core/utildefine.js",
	"src/ui/dialog.js",
	"src/ui/dialogs.js",
	"src/windowmanager/FrameManager.js",
	"src/windowmanager/FrameManager_ops.js",
	"src/windowmanager/ScreenArea.js",
  "src/windowmanager/ScreenBorder.js",
  
  "src/editors/viewport/view2d_editor.js",
  "src/editors/material/MaterialEditor.js",
  "src/editors/dopesheet/DopeSheetEditor.js",
  "src/editors/dopesheet/dopesheet_phantom.js",
  "src/editors/dopesheet/dopesheet_transdata.js",
  "src/editors/dopesheet/dopesheet_ops.js",
  
  "src/ui/notifications.js",

	"src/editors/viewport/view2d.js",
	"src/editors/viewport/view2d_ops.js",
	"src/editors/viewport/view2d_spline_ops.js",
  "src/core/frameset.js",
  "src/editors/ops/ops_editor.js",
  "src/editors/settings/SettingsEditor.js",
	"src/core/data_api_define.js",
  "src/core/data_api_opdefine.js",
  
  "src/datafiles/iconsheet.svg",
  "src/datafiles/iconsheet.png",
  "src/datafiles/iconsheet16.png",
]

if hasattr(build_local, "USE_BETTER_CURVE") and build_local.USE_BETTER_CURVE:
  sources.append("src/curve/spline_math_patpend.js")

copy_targets = {
   "jasmine.js"      : "tools/utils/libs/jasmine/lib/jasmine.js",
   "jasmine-html.js" : "tools/utils/libs/jasmine/lib/jasmine-html.js",
   "jasmine-console.js"      : "tools/utils/libs/jasmine/lib/console.js",
   "jasmine_boot.js"         : "src/unit_tests/jasmine_boot.js",
}

optional_copy_targets = {
   "graphics_3d.nmf" : "src/nacl/pnacl/Release/graphics_3d.nmf",
   "graphics_3d.pexe" : "src/nacl/pnacl/Release/graphics_3d.pexe"
}

js_targets = {"app.js"        : sources,
              "unit_tests.js" : [
               ] + sources + [
                 "src/unit_tests/tests.js"
               ],
               "test_module.js" : [
                "src/core/module.js",
                "src/core/typesystem.js",
                "src/core/module_test.js"
               ],
               "alloc_test.js" : [
                "src/core/typesystem.js",
                "src/util/utils.js",
                "src/core/tarray_alloc.js"
               ]
             }

