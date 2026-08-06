import type { FullContext } from "../../core/context.js";
import { Area, AreaFlags } from "../../path.ux/scripts/screen/ScreenArea.js";
import { STRUCT } from "../../core/struct.js";
import { UIBase, iconmanager } from "../../path.ux/scripts/core/ui_base.js";
import { Editor } from "../editor_base.js";
import * as ui_widgets from "../../path.ux/scripts/widgets/ui_widgets.js";
import * as platform from "../../../platforms/platform.js";
import { Menu } from "../../path.ux/scripts/widgets/ui_menu.js";
import type { MenuTemplate } from "../../path.ux/scripts/widgets/ui_menu.js";
import type { CSSFont } from "../../path.ux/scripts/core/cssfont.js";
import { startup_file } from "../../core/startup/startup_file.js";

import * as electron_api from "../../path.ux/scripts/platforms/electron/electron_api.js";
import type { Container, RowFrame } from "../../path.ux/scripts/core/ui.js";

/*
  gen_file_menu(ctx, uimenulabel)
  {
    return toolop_menu(ctx, "",
      [
        "appstate.quit()",
        "view2d.export_image()",
        "appstate.export_svg()",
        "sep",
        "appstate.save_as()",
        "appstate.save()",
        "appstate.open_recent()",
        "appstate.open()",
        "sep",
        "appstate.new()"
      ]);
  }

  gen_session_menu(ctx, uimenulabel)
  {
    function callback(entry) {
      console.log(entry);
      if (entry.i == 0) {
        //note: this is an html5 function
        if (confirm("Settings will be cleared", "Clear Settings?")) {
          console.log("clearing settings");

          ctx.appstate.session.settings.reload_defaults();
        }
      } else if (entry.i == 2) {
        g_app_state.set_startup_file();
      } else if (entry.i == 1) {
        myLocalStorage.set("startup_file", startup_file);
      }
    }

    var menu = new UIMenu("", callback);
    menu.add_item("Clear Settings", "");
    menu.add_item("Clear Default File");
    menu.add_item("Save Default File", "CTRL-ALT-U");

    return menu;
  }

  gen_tools_menu(ctx, uimenulabel)
  {
    return toolop_menu(ctx, "", []);
  }
 */
export class MenuBar extends Editor {
  static STRUCT: string;

  /* Rebuilt from the active toolmode; handed to row.dynamicMenu(). */
  editMenuDef: MenuTemplate;
  /* Scene.toolmode_i the edit menu was last built for. */
  _last_toolmode: number | undefined;

  constructor() {
    super();

    let dpi = UIBase.getDPI();

    let tilesize = iconmanager.getTileSize(0) + 7;

    let h = Math.max(this.getDefault<CSSFont>("TitleText").size, tilesize);

    this.editMenuDef = [];
    this._last_toolmode = undefined;

    this.maxSize = [undefined, h];
    this.minSize = [undefined, h];
  }

  buildRecentMenu() {
    let menu = document.createElement("menu-x");
    menu.setAttribute("title", "Recent Files");

    let paths = g_app_state.settings.recent_paths;

    paths = list(paths);
    paths.reverse();

    for (let p of paths) {
      let name = p.displayname;
      let id = p.path;
      let i = name.length - 1;

      while (i >= 0 && name[i] !== "/" && name[i] !== "\\") {
        i--;
      }

      if (i >= 0) {
        i++;
      }

      name = name.slice(i, name.length).trim();

      menu.addItem(name, id);
    }

    /* NOTE: this assigned onselect, the DOM select-event handler.  The menu's
       own callback is _onselect, so picking a recent file has never done
       anything. */
    menu._onselect = (id: string | number) => {
      console.warn("recent files callback!", id);
      g_app_state.load_path("" + id);
    };

    return menu;
  }

  init() {
    super.init();

    let row = this.header;
    if (row === undefined) {
      throw new Error("menubar has no header");
    }

    let SEP = Menu.SEP;

    let menudef: MenuTemplate = [
      "appstate.quit()",
      "view2d.export_image()",
      "appstate.export_svg()",
      SEP,
      "appstate.save_as()",
      "appstate.save()",
      this.buildRecentMenu.bind(this),
      "appstate.open()",
      SEP,
      [
        "New File",
        function () {
          platform.app
            .questionDialog("Create blank scene?\nAny unsaved changes\nwill be lost")
            .then((val) => {
              if (val) {
                gen_default_file(g_app_state.screen.size);
              }
            });
        },
      ],
    ];

    menudef.reverse();

    row.menu("&File", menudef);

    this.finishMenu(row);

    let notef = document.createElement("noteframe-x");
    notef.ctx = this.ctx;
    row._add(notef);

    if (window.haveElectron) {
      electron_api.initMenuBar(this);
      this.minSize[1] = this.maxSize[1] = 1;
    }
  }

  buildEditMenu(flush = true): void {
    this.editMenuDef.length = 0;

    this.editMenuDef.push([
      "Undo",
      function () {
        g_app_state.toolstack.undo();
      },
      "Ctrl + Z",
      Icons.UNDO,
    ]);
    /* NOTE: the Redo entry calls undo(), a copy-paste of the entry above. */
    this.editMenuDef.push([
      "Redo",
      function () {
        g_app_state.toolstack.undo();
      },
      "Ctrl + Shift + Z",
      Icons.REDO,
    ]);

    if (!this.ctx || !this.ctx.toolmode) {
      return;
    }

    let toolmode = g_app_state.ctx.toolmode;
    if (toolmode === undefined) {
      return;
    }

    let ret = toolmode.constructor.buildEditMenu();
    if (!ret) return;

    for (let item of ret) {
      this.editMenuDef.push(item);
    }

    if (flush && window.haveElectron) {
      electron_api.initMenuBar(this, true);
    }
  }

  finishMenu(row: Container<FullContext>) {
    /* NOTE: a `callback` function sat here, never referenced by anything.  It
       called confirm() with two arguments and read a bare `ctx` that this
       module never declares, so it would have thrown had anything used it. */

    try {
      row.dynamicMenu("&Edit", this.editMenuDef);
      this.buildEditMenu(false);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.stack);
      }
      console.error("Error building menu");
    }

    row.menu("&Session", [
      [
        "Save Default File",
        function () {
          platform.app.questionDialog("Erase default startup file?").then((val) => {
            if (val) {
              g_app_state.set_startup_file();
              console.log("save default file", val);
            }
          });
        },
      ],

      [
        "Clear Default File",
        function () {
          platform.app.questionDialog("Erase default startup file?").then((val) => {
            if (val) {
              myLocalStorage.set("startup_file", startup_file);
              console.log("clear default file", val);
            }
          });
        },
        "ctrl-alt-u",
      ],
      /* NOTE: this read a bare `ctx` -- a ReferenceError, so confirming this
         dialog has always thrown instead of resetting anything.  questionDialog
         also takes only the message; the second argument was ignored. */
      [
        "Reset Settings",
        function () {
          platform.app.questionDialog("Settings will be cleared").then((val) => {
            if (val) {
              console.log("clearing settings");

              g_app_state.settings.reload_defaults();
            }
          });
        },
      ],
    ]);

    if (window.haveElectron) {
      electron_api.initMenuBar(this, true);
    }
  }

  update() {
    super.update();

    if (!this.ctx || !this.ctx.scene) {
      return;
    }

    if (this._last_toolmode !== this.ctx.scene.toolmode_i) {
      this._last_toolmode = this.ctx.scene.toolmode_i;

      this.buildEditMenu();
    }
  }

  /* NOTE: this began with `if (ctx && ctx.menubar) return ctx.menubar.minSize[1];`.
     Nothing anywhere puts a `menubar` on the context, so the branch was dead and
     the constant below is the only height this has ever returned. */
  static getHeight() {
    return 28;
  }

  makeHeader(container: Container<FullContext>) {
    //this.header = this.container.row();
    return super.makeHeader(container, false);
  }

  static define() {
    return {
      tagname : "menubar-editor-x",
      areaname: "menubar_editor",
      uiname  : "menu",
      icon    : Icons.MENU_EDITOR,
      flag    : AreaFlags.HIDDEN | AreaFlags.NO_SWITCHER,
    };
  }

  copy() {
    return document.createElement("menubar-editor-x");
  }
}

MenuBar.STRUCT =
  STRUCT.inherit(MenuBar, Editor) +
  `
}
`;
Editor.register(MenuBar);
