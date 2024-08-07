import os, os.path, glob

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

pathux = []
for path in glob.glob("src/path.ux/scripts/**", recursive=True):
    if not path.lower().endswith(".js") and not path.lower().endswith(".cjs") and not path.lower().endswith(".mjs"):
        continue
    if "_old" in os.path.split(path)[1].lower():
        continue
    if "tinymce" in path: continue

    if path.endswith("jobs.js") or path.endswith("isect.js") or "kdtree" in path:
      continue

    pathux.append(path)

tools = list(glob.glob("src/editors/viewport/toolmodes/*.js"))

dynamic_modules = {
  "electron/electron_api.js" : "src/path.ux/scripts/platforms/electron/electron_api.js",
  "docbrowser/docbrowser.js" : "src/path.ux/scripts/docbrowser/docbrowser.js"
}

sources = [
  "src/html/unit_test.html",
  "src/html/main.html",
  "src/html/module_test.html",
  "src/core/startup/coverage.js",
  "src/core/evillog.js",
  "src/util/polyfill_fairmotion.js",
  "src/core/startup/module.js",
  "src/core/startup/typelogger.js",
  "src/core/startup/typesystem.js",
  "src/config/config.js",
  "src/config/config_local.js",
  "src/core/const.js",
  "src/util/object_cache.js",
  "src/util/bezier.js",
  "tools/utils/crypto/sha1.js",
  "tools/utils/libs/lz-string/libs/base64-string-v1.1.0.js",
  "tools/utils/libs/lz-string/libs/lz-string-1.3.3.js",
  #"src/util/jslzjb.js",
  "src/core/startup/startup_file_example.js",
  "src/core/startup/startup_file.js",
  "src/core/startup/redraw_globals.js",
  "src/core/startup/startup.js",
  "src/core/safe_eval.js",
  "tools/utils/libs/node_modules/esprima/esprima.js",
  
  "src/core/eventmanager.js",
  #"src/util/base_vector.js",
  "src/datafiles/icon_enum.js",
  #"src/util/vector.js",
#	"src/core/J3DIMath.js",
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
    "src/core/context.js",
    "src/core/toolstack.js",
	"src/core/AppState.js",
	"src/core/units.js",
  "src/core/video.js",
	"src/core/fileapi/fileapi.js",
	"src/core/fileapi/fileapi_html5.js",
	"src/core/fileapi/fileapi_chrome.js",
	"src/core/fileapi/fileapi_electron.js",
  "src/core/animdata.js",
  "src/core/animutil.js",
  "src/config/config_defines.js",
  "src/util/svg_export.js",
  "src/util/vectormath.js"] + pathux + [

  ] + tools + [

  "src/core/struct.js",

  "src/curve/curve.js",
  "src/curve/curvebase.js",
  "src/curve/bspline.js",
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
  "src/curve/spline_strokegroup.js",
  "src/curve/solver_new.js",
  "src/vectordraw/vectordraw_base.js",
  "src/vectordraw/vectordraw_canvas2d.js",
  "src/vectordraw/vectordraw_canvas2d_path2d.js",
  "src/vectordraw/vectordraw_stub.js",
  "src/vectordraw/vectordraw_canvas2d_simple.js",
  "src/vectordraw/vectordraw_skia_simple.js",
  "src/vectordraw/vectordraw_svg.js",
  "src/vectordraw/vectordraw_canvas2d_jobs.js",
  "src/vectordraw/vectordraw_jobs.js",
  "src/vectordraw/vectordraw_jobs_base.js",
  "src/vectordraw/vectordraw.js",
  "src/vectordraw/strokedraw.js",

  "src/webgl/webgl.js",
  "src/webgl/fbo.js",
  "src/webgl/shaders.js",
  "src/webgl/simplemesh.js",
  "src/webgl/simplemesh_shapes.js",
  "src/curve/spline_draw_new.js",
  "src/license/license_api.js",
  "src/license/license_electron.js",
  "platforms/Electron/theplatform.js",
  "platforms/html5/platform_html5.js",
  "platforms/PhoneGap/platform_phonegap.js",
  "platforms/chromeapp/platform_chromeapp.js",
  "src/wasm/load_wasm.js",
  "src/wasm/built_wasm.js",
  "src/wasm/native_api.js",
  "src/addon_api/addon_api_intern.js",
  "src/addon_api/addon_api.js",
  "src/scene/scene.js",
  "src/scene/sceneobject.js",
  "src/scene/sceneobject_data.js",
  "src/scene/collection.js",

  "src/editors/velpan.js",
  "src/editors/manual/manual.js",
  "src/editors/nodegraph/nodegraph.js",
  "src/editors/nodegraph/nodegraph_base.js",
  "src/editors/nodegraph/nodegraph_ops.js",
  "src/editors/widgets.js",
  "src/editors/all.js",
  "src/editors/console/console.js",
  "src/editors/theme.js",
  "src/editors/menubar/MenuBar.js",
  "src/editors/events.js",
  "src/util/touchevents.js",

  "src/core/toolprops.js",
  "src/core/toolprops_iter.js",
	"src/core/toolops_api.js",
  "src/core/eventdag.js",
  
	"src/core/lib_utils.js",

  "src/editors/viewport/transdata.js",
  "src/editors/viewport/transform.js",
  "src/editors/viewport/transform_ops.js",
  "src/editors/viewport/transform_query.js",
  "src/editors/viewport/transform_object.js",
  "src/editors/viewport/transform_spline.js",
  "src/editors/viewport/spline_selectops.js",
  "src/editors/viewport/spline_createops.js",
  "src/editors/viewport/spline_editops.js",
  "src/editors/viewport/spline_layerops.js",
  "src/editors/viewport/spline_animops.js",
  "src/editors/viewport/multires/multires_ops.js",
  "src/editors/viewport/multires/multires_selectops.js",
  "src/editors/viewport/multires/multires_transdata.js",
  
  "src/datafiles/theme.js",
  "src/datafiles/theme_def.js",


  ##"src/ui/UIElement.js",
  ##"src/ui/UIFileData.js",
  ##"src/ui/UICanvas.js",
  #"src/ui/UICanvas2D.js",
  ##"src/ui/UIFrame.js",
  ##"src/ui/UIPack.js",
  ##"src/ui/UISplitFrame.js",
  "src/core/icon.js",
  ##"src/ui/UIWidgets.js",
  "src/editors/viewport/selectmode.js",
  ##"src/ui/UITextBox.js",
  ##"src/ui/UIHTMLTextBox.js",
  ##"src/ui/ScreenKeyboard.js",
  "platforms/common/platform_api.js",
  "platforms/common/platform_capabilies.js",
  "platforms/common/platform_utils.js",
  "platforms/platform.js",
  ##"src/ui/UIMenu.js",
  ##"src/ui/RadialMenu.js",
  ##"src/ui/UIWidgets_special.js",
  ##"src/ui/UIWidgets_special2.js",
  ##"src/ui/UITabPanel.js",
  ##"src/core/utildefine.js",
  ##"src/ui/dialog.js",
  ##"src/ui/dialogs.js",
  ##"src/windowmanager/FrameManager.js",
  ##"src/windowmanager/FrameManager_ops.js",
  ##"src/windowmanager/ScreenArea.js",
  ##"src/windowmanager/ScreenBorder.js",
  
  "src/editors/viewport/view2d_editor.js",
  "src/editors/viewport/view2d_object.js",
  "src/editors/material/MaterialEditor.js",
  "src/editors/dopesheet/DopeSheetEditor.js",
  "src/editors/dopesheet/dopesheet_phantom.js",
  "src/editors/dopesheet/dopesheet_transdata.js",
  "src/editors/dopesheet/dopesheet_ops.js",
  "src/editors/dopesheet/dopesheet_ops_new.js",

  "src/editors/curve/editcurve_ops.js",
  "src/editors/curve/editcurve_util.js",
  "src/editors/curve/CurveEditor.js",

  "src/core/notifications.js",

  "src/editors/app_ops.js",
  "src/editors/editor_base.js",
	"src/editors/viewport/manipulator.js",
	"src/editors/viewport/view2d.js",
	"src/editors/viewport/view2d_ops.js",
	"src/editors/viewport/view2d_spline_ops.js",
	"src/editors/viewport/view2d_object_ops.js",
	"src/editors/viewport/sceneobject_ops.js",
	"src/editors/viewport/view2d_base.js",
  "src/core/animspline.js",
  "src/core/frameset.js",
  "src/editors/ops/ops_editor.js",
  "src/editors/settings/SettingsEditor.js",
  "src/core/data_api/data_api_define.js",
  "src/core/data_api/data_api.js",
  "src/core/keymap.js",

  "src/graph/graph.js",
#  "src/graph/graph_class.js",
#  "src/graph/graph_datapath.js",
#  "src/graph/graph_spatial.js",
  "src/graph/graphsockets.js",

  "src/brush/brush_base.js",
  "src/brush/brush_types.js",
  "src/brush/brush.js",

  "src/paint/imagecanvas.js",
  "src/paint/imagecanvas_draw.js",
  "src/paint/imagecanvas_webgl.js",
  "src/paint/imagecanvas_base.js",
  "src/paint/paint_base.js",
  "src/paint/paint_op_base.js",
]

watch_targets = [
]

for path in glob.glob("addons/*", recursive=True):
    watch_targets.append(path)

copy_targets = {
  "iconsheet.svg" :   "src/datafiles/iconsheet.svg",
   "vectordraw_canvas2d_worker.js" : "src/vectordraw/vectordraw_canvas2d_worker.js",
   "vectordraw_skia_worker.js" : "src/vectordraw/vectordraw_skia_worker.js",
   "jasmine.js"      : "tools/utils/libs/jasmine/lib/jasmine.js",
   "jasmine-html.js" : "tools/utils/libs/jasmine/lib/jasmine-html.js",
   "jasmine-console.js"      : "tools/utils/libs/jasmine/lib/console.js",
   "jasmine_boot.js"         : "src/unit_tests/jasmine_boot.js",
   "tinymce.js"              : "src/path.ux/scripts/lib/tinymce/tinymce.js",
}

optional_copy_targets = {
   "built_wasm.wasm"  : "src/wasm/_built_wasm.wasm"
}

js_targets = {"app.js"        : sources,
              "chromeapp.js"  : sources + ["platforms/chromeapp/app/start_startup.js"],
             }

