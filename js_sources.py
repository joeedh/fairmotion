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
  "src/core/coverage.js",
  "src/util/polyfill.js",
  "src/core/module.js",
  "src/core/typesystem.js",
  "src/config/config.js",
  "src/config/config_local.js",
  "src/core/const.js",
  "src/util/object_cache.js",
  "tools/utils/crypto/sha1.js",
  "tools/utils/libs/lz-string/libs/base64-string-v1.1.0.js",
  "tools/utils/libs/lz-string/libs/lz-string-1.3.3.js",
  #"src/util/jslzjb.js",
  "src/core/startup_file.js",
  "src/core/redraw_globals.js",
  "src/core/startup.js",
  "src/core/safe_eval.js",
  "tools/utils/libs/node_modules/esprima/esprima.js",
  
  "src/core/events.js",
  #"src/util/base_vector.js",
  "src/datafiles/icon_enum.js",
  #"src/util/vector.js",
	"src/core/J3DIMath.js",
	"src/util/utils.js",
  "src/util/binomial_table.js",
  "src/util/strutils.js",
  #"src/util/save_as.js",
	"src/core/lib_api.js",
	"src/core/lib_api_typedefine.js",
	"src/util/mathlib.js",
  "src/util/colorutils.js",
	"src/util/parseutil.js",
	"src/util/typedwriter.js",
	"src/core/jobs.js",
	"src/core/ajax.js",
  "src/core/raster.js",
  "src/core/imageblock.js",
  "src/image/image_ops.js",
  "src/core/UserSettings.js",
	"src/core/AppState.js",
	"src/core/units.js",
	"src/core/data_api.js",
  "src/core/data_api_parser.js",
	"src/core/struct.js",
  "src/core/video.js",
	"src/core/fileapi.js",
	"src/core/fileapi_html5.js",
	"src/core/fileapi_chrome.js",
	"src/core/fileapi_electron.js",
	"src/core/stupidsecurity.js",
  "src/core/animdata.js",
  "src/core/animutil.js",
  "src/config/config_defines.js",
  "src/core/svg_export.js",

  "src/curve/curve.js",
  "src/curve/curvebase.js",
  #"src/curve/bspline.js",
  "src/curve/spline_math.js",
  "src/curve/spline_math_hermite.js",
  "src/curve/spline_element_array.js",
  "src/curve/spline_base.js",
  "src/curve/spline_types.js",
  "src/curve/spline_query.js",
  "src/curve/spline_draw.js",
  "src/curve/spline_draw_sort.js",
  "src/curve/spline.js",
  "src/curve/solver.js",
  "src/curve/spline_multires.js",
  "src/curve/solver_new.js",
  "src/vectordraw/vectordraw_base.js",
  "src/vectordraw/vectordraw_canvas2d.js",
  "src/vectordraw/vectordraw_stub.js",
  "src/vectordraw/vectordraw_canvas2d_simple.js",
  "src/vectordraw/vectordraw_svg.js",
  "src/vectordraw/vectordraw_canvas2d_jobs.js",
  "src/vectordraw/vectordraw_jobs.js",
  "src/vectordraw/vectordraw_jobs_base.js",
  "src/vectordraw/vectordraw.js",
  "src/vectordraw/strokedraw.js",
  "src/curve/spline_draw_new.js",
  "src/license/license_api.js",
  "src/license/license_electron.js",
  "platforms/Electron/theplatform.js",
  "src/wasm/load_wasm.js",
  "src/wasm/built_wasm.js",
  "src/wasm/native_api.js",
  "src/addon_api/addon_api.js",
  "src/scene/scene.js",
  
  "src/editors/viewport/events.js",
  "src/ui/touchevents.js",

  "src/core/toolprops.js",
  "src/core/toolprops_iter.js",
	"src/core/toolops_api.js",
  "src/core/eventdag.js",
  
	"src/core/lib_utils.js",

  "src/editors/viewport/transdata.js",
  "src/editors/viewport/transform.js",
  "src/editors/viewport/transform_ops.js",
  "src/editors/viewport/spline_selectops.js",
  "src/editors/viewport/spline_createops.js",
  "src/editors/viewport/spline_editops.js",
  "src/editors/viewport/spline_layerops.js",
  "src/editors/viewport/spline_animops.js",
  "src/editors/viewport/multires/multires_ops.js",
  "src/editors/viewport/multires/multires_selectops.js",
  "src/editors/viewport/multires/multires_transdata.js",
  
  "src/ui/theme.js",
  "src/ui/theme_def.js",
	"src/ui/UIElement.js",
  "src/ui/UIFileData.js",
  "src/ui/UICanvas.js",
  #"src/ui/UICanvas2D.js",
  "src/ui/UIFrame.js",
  "src/ui/UIPack.js",
  "src/ui/UISplitFrame.js",
  "src/ui/icon.js",
	"src/ui/UIWidgets.js",
  "src/editors/viewport/selectmode.js",
  "src/ui/UITextBox.js",
  "src/ui/UIHTMLTextBox.js",
  "src/ui/ScreenKeyboard.js",
  "platforms/common/platform_api.js",
  "platforms/common/platform_capabilies.js",
  "platforms/common/platform_utils.js",
	"src/ui/UIMenu.js",
	"src/ui/RadialMenu.js",
  "src/ui/UIWidgets_special.js",
  "src/ui/UIWidgets_special2.js",
  "src/ui/UITabPanel.js",
  "src/core/utildefine.js",
	"src/ui/dialog.js",
	"src/ui/dialogs.js",
	"src/windowmanager/FrameManager.js",
	"src/windowmanager/FrameManager_ops.js",
	"src/windowmanager/ScreenArea.js",
  "src/windowmanager/ScreenBorder.js",
  
  "src/editors/viewport/view2d_editor.js",
  "src/editors/viewport/view2d_object.js",
  "src/editors/material/MaterialEditor.js",
  "src/editors/dopesheet/DopeSheetEditor.js",
  "src/editors/dopesheet/dopesheet_phantom.js",
  "src/editors/dopesheet/dopesheet_transdata.js",
  "src/editors/dopesheet/dopesheet_ops.js",

  "src/editors/curve/editcurve_ops.js",
  "src/editors/curve/editcurve_util.js",
  "src/editors/curve/CurveEditor.js",

  "src/ui/notifications.js",

	"src/editors/viewport/manipulator.js",
	"src/editors/viewport/view2d.js",
	"src/editors/viewport/view2d_ops.js",
	"src/editors/viewport/view2d_spline_ops.js",
  "src/core/animspline.js",
  "src/core/frameset.js",
  "src/editors/ops/ops_editor.js",
  "src/editors/settings/SettingsEditor.js",
	"src/core/data_api_define.js",
  "src/core/data_api_opdefine.js",
  
  "src/datafiles/iconsheet.svg",
  "src/datafiles/iconsheet.png",
  "src/datafiles/iconsheet16.png",
]

copy_targets = {
   "vectordraw_canvas2d_worker.js" : "src/vectordraw/vectordraw_canvas2d_worker.js",
   "vectordraw_skia_worker.js" : "src/vectordraw/vectordraw_skia_worker.js",
   "jasmine.js"      : "tools/utils/libs/jasmine/lib/jasmine.js",
   "jasmine-html.js" : "tools/utils/libs/jasmine/lib/jasmine-html.js",
   "jasmine-console.js"      : "tools/utils/libs/jasmine/lib/console.js",
   "jasmine_boot.js"         : "src/unit_tests/jasmine_boot.js"
}

optional_copy_targets = {
   "built_wasm.wasm"  : "src/wasm/_built_wasm.wasm"
}

js_targets = {"app.js"        : sources,
              "chromeapp.js"  : sources + ["chromeapp/start_startup.js"],
             }

