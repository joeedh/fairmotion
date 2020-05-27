function makeAPI(api) {
  function api_define_Context(api) {
    let _Context = api.mapStruct(Context, true);
    _Context.struct("view2d", "view2d", "undefined", api.mapStruct(View2DHandler, true));
    _Context.struct("dopesheet", "dopesheet", "undefined", api.mapStruct(DopeSheetEditor, true));
    /*WARNING: failed to resolve a class*/
    _Context.struct("editcurve", "editcurve", "undefined", undefined);
    _Context.struct("frameset", "frameset", "undefined", api.mapStruct(SplineFrameSet, true));
    /*WARNING: failed to resolve a class*/
    _Context.struct("settings_editor", "settings_editor", "undefined", undefined);
    _Context.struct("appstate.session.settings", "settings", "undefined", api.mapStruct(AppSettings, true));
    /*WARNING: failed to resolve a class*/
    _Context.struct("object", "object", "undefined", undefined);
    _Context.struct("scene", "scene", "undefined", api.mapStruct(Scene, true));
    /*WARNING: failed to resolve a class*/
    _Context.struct("", "last_tool", "undefined", undefined);
    _Context.struct("appstate", "appstate", "undefined", api.mapStruct(AppState, true));


    /* WARNING: data struct array detected operator_stack{appstate.toolstack.undostack} */

    _Context.struct("g_theme", "theme", "undefined", api.mapStruct(Theme, true));
    _Context.struct("spline", "spline", "undefined", api.mapStruct(Spline, true));
    _Context.struct("datalib", "datalib", "undefined", api.mapStruct(DataLib, true));
    /*WARNING: failed to resolve a class*/
    _Context.struct("opseditor", "opseditor", "undefined", undefined);
  }

  function api_define_View2DHandler(api) {
    let _View2DHandler = api.mapStruct(View2DHandler, true);
    _View2DHandler.bool("edit_all_layers", "edit_all_layers", "Edit All Layers").on("change", function () {
      redraw_viewport();
    });
  .on("change", function () {
      window.redraw_viewport();
    });
    ;
    ;
    _View2DHandler.enum("toolmode", {
      SELECT : 1,
      APPEND : 2,
      RESIZE : 3,
      ROTATE : 4
    }, "toolmode", "Active Tool").icons({
      SELECT : Icons.CURSOR_ARROW,
      APPEND : Icons.APPEND_VERTEX,
      RESIZE : Icons.RESIZE,
      ROTATE : Icons.ROTATE
    });
    _View2DHandler.bool("draw_small_verts", "draw_small_verts", "Small Points");
    _View2DHandler.enum("selectmode", {
    }, "selectmode", "Selection Mode").uiNames({
      VERTEX : "Vertex",
      SEGMENT : "Segment",
      FACE : "Face",
      OBJECT : "Object"
    }).descriptions({
      dummy : "Dummy"
    }).icons({
      VERTEX : Icons.VERT_MODE,
      SEGMENT : Icons.EDGE_MODE,
      FACE : Icons.FACE_MODE,
      OBJECT : Icons.OBJECT_MODE
    }).customSet(function (prop, val) {
      console.log("selmask_enum.userSetData", this, prop, val);
      this.selectmode = val|(this.selectmode&SelMask.HANDLE);
      return this.selectmode;
    });
    _View2DHandler.flags("selectmode", {
      VERTEX : 1,
      HANDLE : 2,
      SEGMENT : 4,
      FACE : 16,
      TOPOLOGY : 23,
      OBJECT : 32
    }, "selectmask", "Sel Mask").uiNames({
      VERTEX : "Show Vertexs",
      HANDLE : "Show Handles",
      SEGMENT : "Show Segments",
      FACE : "Show Faces",
      TOPOLOGY : "Show Topologys",
      OBJECT : "Show Objects"
    }).descriptions({
    }).icons({
      VERTEX : Icons.VERT_MODE,
      HANDLE : Icons.SHOW_HANDLES,
      SEGMENT : Icons.EDGE_MODE,
      FACE : Icons.FACE_MODE,
      OBJECT : Icons.OBJECT_MODE
    });
    _View2DHandler.bool("only_render", "only_render", "Hide Controls");
    _View2DHandler.bool("draw_bg_image", "draw_bg_image", "Draw Image").on("change", function () {
      window.redraw_viewport();
    });
    _View2DHandler.bool("tweak_mode", "tweak_mode", "Tweak Mode");
    _View2DHandler.bool("enable_blur", "enable_blur", "Blur").on("change", function () {
      this.ctx.spline.regen_sort();
      redraw_viewport();
    });
    _View2DHandler.bool("draw_faces", "draw_faces", "Show Faces").on("change", function () {
      this.ctx.spline.regen_sort();
      redraw_viewport();
    });
    _View2DHandler.bool("draw_video", "draw_video", "Draw Video").on("change", function () {
      window.redraw_viewport();
    });
    _View2DHandler.bool("draw_normals", "draw_normals", "Show Normals").on("change", function () {
      redraw_viewport();
    });
    _View2DHandler.bool("draw_anim_paths", "draw_anim_paths", "Show Animation Paths");
    _View2DHandler.float("zoom", "zoom", "Zoom").range(0.1, 100).uiRange(0.1, 100).on("change", function (ctx, path) {
      this.ctx.view2d.set_zoom(this.data);
    });
    /*WARNING: failed to resolve a class*/
    _View2DHandler.struct("active_material", "active_material", "undefined", undefined);
    _View2DHandler.float("default_linewidth", "default_linewidth", "Line Wid").range(0.01, 100);
    _View2DHandler.enum("extrude_mode", {
      SMOOTH : 0,
      LESS_SMOOTH : 1,
      BROKEN : 2
    }, "extrude_mode", "New Line Mode").uiNames({
      SMOOTH : "SMOOTH",
      LESS_SMOOTH : "LESS SMOOTH",
      BROKEN : "BROKEN"
    }).descriptions({
      SMOOTH : "New Line Mode",
      LESS_SMOOTH : "New Line Mode",
      BROKEN : "New Line Mode"
    }).icons({
      SMOOTH : Icons.EXTRUDE_MODE_G2,
      LESS_SMOOTH : Icons.EXTRUDE_MODE_G1,
      BROKEN : Icons.EXTRUDE_MODE_G0
    });
    _View2DHandler.bool("pin_paths", "pin_paths", "Pin Paths");
    _View2DHandler.struct("background_image", "background_image", "undefined", api.mapStruct(ImageUser, true));
  }

  function api_define_ImageUser(api) {
    let _ImageUser = api.mapStruct(ImageUser, true);
    ;
    _ImageUser.vec2("off", "off", "Offset");
    _ImageUser.vec2("scale", "scale", "Scale").range(0.0001, 90);
  }

  function api_define_DopeSheetEditor(api) {
    let _DopeSheetEditor = api.mapStruct(DopeSheetEditor, true);
    _DopeSheetEditor.bool("selected_only", "selected_only", "Selected Only").on("change", function () {
      if (this.ctx!=undefined&&this.ctx.dopesheet!=undefined)
        this.ctx.dopesheet.do_full_recalc();
    });
    _DopeSheetEditor.bool("pinned", "pinned", "Pin");
  }

  function api_define_SplineFrameSet(api) {
    let _SplineFrameSet = api.mapStruct(SplineFrameSet, true);


    /* WARNING: data struct array detected animkeys{lib_anim_idmap} */

    _SplineFrameSet.struct("spline", "drawspline", "undefined", api.mapStruct(Spline, true));
    _SplineFrameSet.struct("pathspline", "pathspline", "undefined", api.mapStruct(Spline, true));


    /* WARNING: data struct array detected keypaths{vertex_animdata} */

    _SplineFrameSet.struct("active_animdata", "active_keypath", "undefined", api.mapStruct(VertexAnimData, true));
  }

  function api_define_Spline(api) {
    let _Spline = api.mapStruct(Spline, true);


    /* WARNING: data struct array detected animkeys{lib_anim_idmap} */

    /*WARNING: failed to resolve a class*/
    _Spline.struct("faces.active", "active_face", "undefined", undefined);
    _Spline.struct("segments.active", "active_segment", "undefined", api.mapStruct(SplineSegment, true));
    _Spline.struct("verts.active", "active_vertex", "undefined", api.mapStruct(SplineVertex, true));


    /* WARNING: data struct array detected faces{faces} */



    /* WARNING: data struct array detected segments{segments} */



    /* WARNING: data struct array detected verts{verts} */



    /* WARNING: data struct array detected editable_faces{faces} */



    /* WARNING: data struct array detected editable_segments{segments} */



    /* WARNING: data struct array detected editable_verts{verts} */



    /* WARNING: data struct array detected layerset{layerset} */

    _Spline.struct("layerset.active", "active_layer", "undefined", api.mapStruct(SplineLayer, true));
  }

  function api_define_SplineSegment(api) {
    let _SplineSegment = api.mapStruct(SplineSegment, true);
    _SplineSegment.int("eid", "eid", "eid");
    _SplineSegment.flags("flag", {
      SELECT : 1,
      BREAK_TANGENTS : 2,
      USE_HANDLES : 4,
      UPDATE : 8,
      TEMP_TAG : 16,
      BREAK_CURVATURES : 32,
      HIDE : 64,
      FRAME_DIRTY : 128,
      PINNED : 256,
      NO_RENDER : 512,
      AUTO_PAIRED_HANDLE : 1024,
      UPDATE_AABB : 2048,
      DRAW_TEMP : 4096,
      GHOST : 8192,
      UI_SELECT : 16384,
      FIXED_KS : 2097152,
      REDRAW_PRE : 4194304,
      REDRAW : 8388608
    }, "flag", "Flags").uiNames({
      SELECT : "Select",
      BREAK_TANGENTS : "Break tangents",
      USE_HANDLES : "Use handles",
      UPDATE : "Update",
      TEMP_TAG : "Temp tag",
      BREAK_CURVATURES : "Break curvatures",
      HIDE : "Hide",
      FRAME_DIRTY : "Frame dirty",
      PINNED : "Pinned",
      NO_RENDER : "No render",
      AUTO_PAIRED_HANDLE : "Auto paired handle",
      UPDATE_AABB : "Update aabb",
      DRAW_TEMP : "Draw temp",
      GHOST : "Ghost",
      UI_SELECT : "Ui select",
      FIXED_KS : "Fixed ks",
      REDRAW_PRE : "Redraw pre",
      REDRAW : "Redraw"
    }).descriptions({
    }).icons({
    }).on("change", function (segment) {
      new Context().spline.regen_sort();
      segment.flag|=SplineFlags.REDRAW;
      console.log(segment);
      window.redraw_viewport();
    });
    _SplineSegment.bool("renderable", "renderable", "renderable");
    _SplineSegment.struct("mat", "mat", "undefined", api.mapStruct(Material, true));
    _SplineSegment.float("z", "z", "z");
  }

  function api_define_Material(api) {
    let _Material = api.mapStruct(Material, true);
  .on("change", function (material) {
      material.update();
      window.redraw_viewport();
    });
    _Material.float("linewidth", "linewidth", "linewidth").range(0.1, 200).on("change", function (material) {
      material.update();
      window.redraw_viewport();
    });
    _Material.flags("flag", {
      SELECT : 1,
      MASK_TO_FACE : 2
    }, "flag", "material flags").uiNames({
      SELECT : "Select",
      MASK_TO_FACE : "Mask to face"
    }).descriptions({
    }).icons({
    }).on("change", function (material) {
      material.update();
      window.redraw_viewport();
    });
  .on("change", function (material) {
      material.update();
      window.redraw_viewport();
    });
    _Material.float("blur", "blur", "Blur").on("change", function (material) {
      material.update();
      window.redraw_viewport();
    });
  }

  function api_define_SplineVertex(api) {
    let _SplineVertex = api.mapStruct(SplineVertex, true);
    _SplineVertex.int("eid", "eid", "eid");
    _SplineVertex.flags("flag", {
      SELECT : 1,
      BREAK_TANGENTS : 2,
      USE_HANDLES : 4,
      UPDATE : 8,
      TEMP_TAG : 16,
      BREAK_CURVATURES : 32,
      HIDE : 64,
      FRAME_DIRTY : 128,
      PINNED : 256,
      NO_RENDER : 512,
      AUTO_PAIRED_HANDLE : 1024,
      UPDATE_AABB : 2048,
      DRAW_TEMP : 4096,
      GHOST : 8192,
      UI_SELECT : 16384,
      FIXED_KS : 2097152,
      REDRAW_PRE : 4194304,
      REDRAW : 8388608
    }, "flag", "Flags").uiNames({
      SELECT : "Select",
      BREAK_TANGENTS : "Sharp Corner",
      USE_HANDLES : "Use handles",
      UPDATE : "Update",
      TEMP_TAG : "Temp tag",
      BREAK_CURVATURES : "Less Smooth",
      HIDE : "Hide",
      FRAME_DIRTY : "Frame dirty",
      PINNED : "Pinned",
      NO_RENDER : "No render",
      AUTO_PAIRED_HANDLE : "Auto paired handle",
      UPDATE_AABB : "Update aabb",
      DRAW_TEMP : "Draw temp",
      GHOST : "Ghost",
      UI_SELECT : "Ui select",
      FIXED_KS : "Fixed ks",
      REDRAW_PRE : "Redraw pre",
      REDRAW : "Redraw"
    }).descriptions({
      BREAK_CURVATURES : "Allows curve to more tightly bend at this point"
    }).icons({
    }).on("change", function (owner) {
      this.ctx.spline.regen_sort();
      console.log("vertex update", owner);
      if (owner!=undefined) {
        owner.flag|=SplineFlags.UPDATE;
      }
      this.ctx.spline.propagate_update_flags();
      this.ctx.spline.resolve = 1;
      window.redraw_viewport();
    });
    ;
  }

  function api_define_SplineLayer(api) {
    let _SplineLayer = api.mapStruct(SplineLayer, true);
    _SplineLayer.int("id", "id", "id");
    ;
    _SplineLayer.flags("flag", {
      HIDE : 2,
      CAN_SELECT : 4,
      MASK : 8
    }, "flag", "flag").uiNames({
      HIDE : "Hide",
      CAN_SELECT : "Can select",
      MASK : "Mask To Prev"
    }).descriptions({
      MASK : "Use previous layer as a mask"
    }).icons({
    }).on("change", function () {
      window.redraw_viewport();
    });
  }

  function api_define_VertexAnimData(api) {
    let _VertexAnimData = api.mapStruct(VertexAnimData, true);
    _VertexAnimData.flags("animflag", {
      STEP_FUNC : 2
    }, "animflag", "Animation Flags").uiNames({
      STEP_FUNC : "Step func"
    }).descriptions({
    }).icons({
    });
    _VertexAnimData.int("eid", "owning_vertex", "Owning Vertex");
  }

  function api_define_AppSettings(api) {
    let _AppSettings = api.mapStruct(AppSettings, true);
    _AppSettings.enum("unit_scheme", {
      imperial : "imperial",
      metric : "metric"
    }, "unit_system", "System").uiNames({
      imperial : "Imperial",
      metric : "Metric"
    }).descriptions({
      imperial : "Imperial",
      metric : "Metric"
    }).icons({
    }).on("change", function () {
      //g_app_state.session.settings.server_update();
      g_app_state.screen.do_full_recalc();
    });
    _AppSettings.enum("unit", {
    }, "default_unit", "Default Unit").uiNames({
      cm : "CM",
      in : "IN",
      ft : "FT",
      m : "M",
      mm : "MM",
      km : "KM",
      mile : "MILE"
    }).descriptions({
      dummy : "Dummy"
    }).icons({
    }).on("change", function () {
      g_app_state.session.settings.save();
      g_app_state.screen.do_full_recalc();
    });
  }

  function api_define_Scene(api) {
    let _Scene = api.mapStruct(Scene, true);


    /* WARNING: data struct array detected animkeys{lib_anim_idmap} */

    ;
    _Scene.int("time", "frame", "Frame").range(1, 10000);


    /* WARNING: data struct array detected objects{objects} */

    _Scene.struct("objects.active", "active_object", "undefined", api.mapStruct(SceneObject, true));
  }

  function api_define_SceneObject(api) {
    let _SceneObject = api.mapStruct(SceneObject, true);
    _SceneObject.vec2("loc", "loc", "Position");
    _SceneObject.vec2("scale", "scale", "Scale");
    _SceneObject.float("rot", "rot", "Rotation");
    _SceneObject.struct("data", "frameset", "undefined", api.mapStruct(SplineFrameSet, true));
  }

  function api_define_AppState(api) {
    let _AppState = api.mapStruct(AppState, true);
    _AppState.bool("select_multiple", "select_multiple", "Multiple");
    _AppState.bool("select_inverse", "select_inverse", "Deselect");
  }

  function api_define_Theme(api) {
    let _Theme = api.mapStruct(Theme, true);
    _Theme.struct("ui", "ui", "undefined", api.mapStruct(ColorTheme, true));
    _Theme.struct("view2d", "view2d", "undefined", api.mapStruct(ColorTheme, true));
  }

  function api_define_ColorTheme(api) {
    let _ColorTheme = api.mapStruct(ColorTheme, true);


    /* WARNING: data struct array detected colors{flat_colors} */

  }

  function api_define_DataLib(api) {
    let _DataLib = api.mapStruct(DataLib, true);
    /*WARNING: failed to resolve a class*/
    _DataLib.struct("datalists.items[8]", "image", "undefined", undefined);
    _DataLib.struct("datalists.items[5]", "scene", "undefined", api.mapStruct(DataList, true));
    /*WARNING: failed to resolve a class*/
    _DataLib.struct("datalists.items[4]", "script", "undefined", undefined);
    /*WARNING: failed to resolve a class*/
    _DataLib.struct("datalists.items[6]", "spline", "undefined", undefined);
    _DataLib.struct("datalists.items[7]", "frameset", "undefined", api.mapStruct(DataList, true));
    /*WARNING: failed to resolve a class*/
    _DataLib.struct("datalists.items[8]", "addon", "undefined", undefined);
  }

  function api_define_DataList(api) {
    let _DataList = api.mapStruct(DataList, true);
    ;
    _DataList.int("typeid", "typeid", "typeid");


    /* WARNING: data struct array detected items{idmap} */

  }

  api_define_Context(api);
  api_define_View2DHandler(api);
  api_define_ImageUser(api);
  api_define_DopeSheetEditor(api);
  api_define_SplineFrameSet(api);
  api_define_Spline(api);
  api_define_SplineSegment(api);
  api_define_Material(api);
  api_define_SplineVertex(api);
  api_define_SplineLayer(api);
  api_define_VertexAnimData(api);
  api_define_AppSettings(api);
  api_define_Scene(api);
  api_define_SceneObject(api);
  api_define_AppState(api);
  api_define_Theme(api);
  api_define_ColorTheme(api);
  api_define_DataLib(api);
  api_define_DataList(api);

}
