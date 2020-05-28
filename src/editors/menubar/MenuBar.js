import {Area, AreaFlags} from '../../path.ux/scripts/screen/ScreenArea.js';
import {STRUCT} from '../../core/struct.js';
import {UIBase, iconmanager} from '../../path.ux/scripts/core/ui_base.js';
import {Editor} from '../editor_base.js';
import * as ui_widgets from '../../path.ux/scripts/widgets/ui_widgets.js';
import * as platform from '../../../platforms/platform.js';
import {Menu} from '../../path.ux/scripts/widgets/ui_menu.js';
import {startup_file} from '../../core/startup/startup_file.js';

import * as electron_api from '../../path.ux/scripts/platforms/electron/electron_api.js';

/*
  gen_file_menu(Context ctx, uimenulabel)
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

  gen_session_menu(ctx : Context, uimenulabel)
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

  gen_tools_menu(Context ctx, uimenulabel)
  {
    return toolop_menu(ctx, "", []);
  }
 */
export class MenuBar extends Editor {
  constructor() {
    super();

    let dpi = UIBase.getDPI();

    let tilesize = iconmanager.getTileSize(1);

    let h = Math.max(this.getDefault("TitleText").size, tilesize) + 5;

    this.editMenuDef = [];
    this._last_toolmode = undefined;

    this.maxSize = [undefined, h];
    this.minSize = [undefined, h];
  }

  buildRecentMenu() {
    let menu = document.createElement("menu-x");
    menu.setAttribute("title", "Recent Files");

    let paths = g_app_state.settings.recent_paths;

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

    menu.onselect = (id) => {
      console.warn("recent files callback!", id);
      g_app_state.load_path(id);
    }

    return menu;
  }

  init() {
    super.init();

    let row = this.header;
    let SEP = Menu.SEP;


    let menudef = [
      "appstate.quit()",
      "view2d.export_image()",
      "appstate.export_svg()",
      SEP,
      "appstate.save_as()",
      "appstate.save()",
      this.buildRecentMenu.bind(this),
      "appstate.open()",
      SEP,
      ["New File", function () {
        platform.app.questionDialog("Create blank scene?\nAny unsaved changes\nwill be lost").then((val) => {
           if (val) {
             gen_default_file(g_app_state.screen.size);
           }
         });
      }]
    ];

    menudef.reverse();

    row.menu("&File", menudef);

    this.genSessionMenu(row);

    let notef = document.createElement("noteframe-x");
    notef.ctx = this.ctx;
    row._add(notef);

    if (window.haveElectron) {
      electron_api.initMenuBar(this);
      this.minSize[1] = this.maxSize[1] = 1;
    }
  }

  buildEditMenu() {
    console.log("rebuilding edit menu");

    this.editMenuDef.length = 0;

    this.editMenuDef.push(["Undo", function () {
      this.ctx.toolstack.undo();
    }, "Ctrl + Z", Icons.UNDO]);
    this.editMenuDef.push(["Redo", function () {
      this.ctx.toolstack.undo();
    }, "Ctrl + Shift + Z", Icons.REDO]);

    if (!this.ctx || !this.ctx.toolmode) {
      return;
    }

    let ret = this.ctx.toolmode.constructor.buildEditMenu();
    if (!ret) return;

    for (let item of ret) {
      this.editMenuDef.push(item);
    }
  }

  genSessionMenu(row : RowFrame)
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

    row.dynamicMenu("&Edit", this.editMenuDef);
    this.buildEditMenu();

    row.menu("&Session", [
      ["Save Default File", function () {
        platform.app.questionDialog("Erase default startup file?").then((val) => {
          if (val) {
            g_app_state.set_startup_file();
            console.log("save default file", val);
          }
        });
      }],

      ["Clear Default File", function() {
        platform.app.questionDialog("Erase default startup file?").then((val) => {
          if (val) {
            myLocalStorage.set("startup_file", startup_file);
            console.log("clear default file", val);
          }
        });
      }, "ctrl-alt-u"
      ],
      ["Reset Settings", function() {
        platform.app.questionDialog("Settings will be cleared", "Clear Settings?").then((val) => {
          if (val) {
            console.log("clearing settings");

            ctx.appstate.session.settings.reload_defaults();
          }
        });
      }]
    ]);
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

  makeHeader(container : Container) {
    //this.header = this.container.row();
    super.makeHeader(container, false);
  }

  static define() { return {
    tagname : "menubar-editor-x",
    areaname : "menubar_editor",
    uiname : "menu",
    icon : Icons.MENU_EDITOR,
    flag : AreaFlags.HIDDEN|AreaFlags.NO_SWITCHER
  }}

  static getHeight() {
    return ~~(UIBase.getDPI()*19);
  }

  copy() {
    return document.createElement("menubar-editor-x");
  }
}
MenuBar.STRUCT = STRUCT.inherit(MenuBar, Editor) + `
}
`;
Editor.register(MenuBar);
