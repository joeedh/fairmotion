/* Building and repairing the screen layout.

   gen_screen() lays out the default UI from nothing: a menubar across the top,
   a 2D viewport under it, and a material editor down the right.  patchScreen()
   is the other direction, rebuilding a layout by hand out of a file whose saved
   Screen no longer matches this build's class.

   The area-type registration and the two path.ux hooks live here as well,
   because they are what makes a bare `document.createElement("screenarea-x")`
   able to find an editor class at all. */

import { View2DHandler } from "../../editors/viewport/view2d.js";
import { MaterialEditor } from "../../editors/material/MaterialEditor.js";
import { DopeSheetEditor } from "../../editors/dopesheet/DopeSheetEditor.js";
import { SettingsEditor } from "../../editors/settings/SettingsEditor.js";
import { OpStackEditor } from "../../editors/ops/ops_editor.js";
import { CurveEditor } from "../../editors/curve/CurveEditor.js";
import { MenuBar } from "../../editors/menubar/MenuBar.js";
import { Editor, FairmotionScreen, resetAreaStacks } from "../../editors/editor_base.js";

import { Area, setAreaTypes } from "../../path.ux/scripts/screen/ScreenArea.js";
import { registerToolStackGetter } from "../../path.ux/scripts/screen/FrameManager_ops.js";
import { getAreaConstructor } from "../../path.ux/scripts/screen/area_base.js";

import { FullContext } from "../context.js";
import { structReadObject } from "../struct_facade.js";

Area.prototype.getScreen = () => {
  return g_app_state.screen;
};

registerToolStackGetter(() => {
  return g_app_state.toolstack;
});

//can't I have the screen area registration code generate this for me?
export let AreaTypes = {
  VIEW2D   : View2DHandler,
  SETTINGS : SettingsEditor,
  OPSTACK  : OpStackEditor,
  MATERIAL : MaterialEditor,
  DOPESHEET: DopeSheetEditor,
  CURVE    : CurveEditor,
  MENUBAR  : MenuBar,
};

setAreaTypes(AreaTypes);

export function get_app_div() {
  let app = document.getElementById("app");

  if (!app) {
    app = document.body;
  }

  return app;
}

/* `unused` is a leftover from when this took the old screen to replace; every
   caller passes undefined. w/h are likewise ignored -- the screen sizes itself
   off the window. */
export function gen_screen(unused: undefined, w: int, h: int): void {
  let app = get_app_div();

  //document.getElementById() knows nothing of the custom-element tag map
  let existing = document.getElementById("screenmain");
  let screen: FairmotionScreen;

  if (existing instanceof FairmotionScreen) {
    screen = existing;
    screen.clear();
  } else {
    screen = document.createElement("fairmotion-screen-x");
    resetAreaStacks();
    app.appendChild(screen);
  }

  screen.style["position"] = "absolute";

  screen.setAttribute("id", "screenmain");
  screen.id = "screenmain";

  screen.size = new Vector2([window.innerWidth, window.innerHeight]);
  screen.ctx = new FullContext();

  let sarea = document.createElement("screenarea-x");
  sarea.size[0] = window.innerWidth;
  sarea.size[1] = window.innerHeight;

  screen.appendChild(sarea);

  sarea.setCSS();
  screen.setCSS();
  screen.makeBorders();

  sarea.switch_editor(View2DHandler);
  sarea.area!.setCSS();

  let t = MenuBar.getHeight() / sarea.size[1];

  let view2d = screen.splitArea(sarea, t);
  sarea.switch_editor(MenuBar);

  let mated = screen.splitArea(view2d, 0.7, false);
  mated.switch_editor(MaterialEditor);

  g_app_state.screen = screen;
  g_app_state.eventhandler = screen;

  //make material editor

  app.appendChild(screen);
  screen.listen();
}

function ensureMenuBar(screen: FairmotionScreen) {
  for (let sarea of screen.sareas) {
    if (!sarea.area || !(sarea.area instanceof MenuBar)) {
      continue;
    }

    return;
  }

  screen.regenScreenMesh();

  console.log("Adding menu bar", screen.size);

  let scale = (screen.size[1] - MenuBar.getHeight()) / screen.size[1];

  for (let sv of screen.screenverts) {
    sv[1] = sv[1] * scale + MenuBar.getHeight();
  }

  screen.loadFromVerts();

  let sarea2 = document.createElement("screenarea-x");

  sarea2.pos[0] = 0;
  sarea2.pos[1] = 0;
  sarea2.size[0] = screen.size[0];
  sarea2.size[1] = MenuBar.getHeight();
  screen.appendChild(sarea2);

  sarea2.switch_editor(MenuBar);

  screen.regenScreenMesh();
  screen.snapScreenVerts();
}

/* The members of an old on-disk Screen that the rebuild below reads back. */
interface PatchedScreen {
  size: number[];
  areas: {
    size: number[];
    pos: number[];
    /* class name of the visible editor */
    area: string;
    editors: Editor[];
  }[];
}

/*
 * Reads a screen layout out of a file that was saved by a build whose Screen
 * class no longer matches, and rebuilds the DOM for it by hand. The read goes
 * through a stand-in class so nstructjs fills a plain object instead of
 * constructing a real Screen.
 */
export function patchScreen(fstructs: import("nstructjs").STRUCT, data: DataView) {
  let fakeclass = {
    fromSTRUCT: (reader: StructReader<object>) => {
      let ret = {};
      reader(ret);
      return ret;
    },

    structName: "Screen",
    name      : "Screen",
    prototype : Object.create(Object.prototype),
  };

  let sdata = structReadObject<PatchedScreen>(fstructs, data, fakeclass);
  let screen = document.createElement("fairmotion-screen-x");
  resetAreaStacks();

  screen.size = new Vector2(sdata.size);
  console.log(sdata);
  console.log("SCREEN SIZE", screen.size);

  for (let sarea of sdata.areas) {
    console.log("AREA!");

    let sarea2 = document.createElement("screenarea-x");

    sarea2.size = new Vector2(sarea.size);
    sarea2.pos = new Vector2(sarea.pos);

    for (let editor of sarea.editors) {
      let areaname = getAreaConstructor(editor).define().areaname!;

      sarea2.editors.push(editor);
      sarea2.editormap[areaname] = editor;

      if (editor.constructor.name === sarea.area) {
        sarea2.area = editor;
        sarea2.shadow.appendChild(editor);
      }
    }

    screen.appendChild(sarea2);
  }

  ensureMenuBar(screen);

  return screen;
}
