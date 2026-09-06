"use strict";

/* Assembling the data API.

   Each class defines its own paths in a `static defineAPI(api, struct)`, next
   to the fields those paths name, so a property and its slider live in one
   file.  The struct is a parameter with a default of `api.mapStruct(this,
   true)`, which is what makes the methods chain: a subclass takes its own
   struct, hands it to `super.defineAPI(api, struct)` for the inherited paths,
   and then adds its own on top.

   What is left here is the assembly: calling each class's defineAPI once, in an
   order that has the structs a path points at already mapped, and naming
   FullContext's struct as the API root. */

import { DataAPI, buildToolSysAPI } from "../../path.ux/scripts/pathux.js";
import { FullContext } from "../context.js";

import { AppState } from "../appstate/appstate.js";
import { AppSettings } from "../UserSettings.js";
import { DataLib, DataList } from "../lib_api.js";
import { Image, ImageUser } from "../imageblock.js";
import { SplineFrameSet, VertexAnimData } from "../frameset.js";
import { Spline } from "../../curve/spline.js";
import { SplineLayer } from "../../curve/spline_element_array.js";
import { Material, SplineFace, SplineSegment, SplineVertex } from "../../curve/spline_types.js";
import { Scene } from "../../scene/scene.js";
import { SceneObject } from "../../scene/sceneobject.js";
import { CurveEditor } from "../../editors/curve/CurveEditor.js";
import { DopeSheetEditor } from "../../editors/dopesheet/DopeSheetEditor.js";
import { OpStackEditor } from "../../editors/ops/ops_editor.js";
import { SettingsEditor } from "../../editors/settings/SettingsEditor.js";
import { View2DHandler } from "../../editors/viewport/view2d.js";
import { initToolModeAPI } from "../../editors/viewport/toolmodes/toolmode.js";

export function makeAPI(api = new DataAPI<FullContext>()) {
  let FullContextStruct = FullContext.defineAPI(api);

  View2DHandler.defineAPI(api);
  Material.defineAPI(api);
  ImageUser.defineAPI(api);
  Image.defineAPI(api);
  DopeSheetEditor.defineAPI(api);
  CurveEditor.defineAPI(api);
  SplineFrameSet.defineAPI(api);
  Spline.defineAPI(api);
  SplineFace.defineAPI(api);
  SplineSegment.defineAPI(api);
  SplineVertex.defineAPI(api);
  SplineLayer.defineAPI(api);
  VertexAnimData.defineAPI(api);
  SettingsEditor.defineAPI(api);
  AppSettings.defineAPI(api);
  SceneObject.defineAPI(api);
  Scene.defineAPI(api);
  AppState.defineAPI(api);
  DataLib.defineAPI(api);
  DataList.defineAPI(api);
  OpStackEditor.defineAPI(api);

  /* SplineToolMode is a registered toolmode, so its struct comes from here
     along with every other toolmode's. */
  initToolModeAPI(api);

  api.rootContextStruct = FullContextStruct;

  /* struct() discards its uiname; the spelling matches the definition of the
     same path in FullContext.defineAPI. */
  FullContextStruct.struct("last_tool", "last_tool", "undefined", undefined);
  buildToolSysAPI(api, true, FullContextStruct);

  return api;
}
