import {Area, AreaFlags} from '../../path.ux/scripts/screen/ScreenArea.js';
import {STRUCT} from '../../core/struct.js';
import {UIBase, iconmanager} from '../../path.ux/scripts/core/ui_base.js';
import {Editor} from '../editor_base.js';
import * as ui_widgets from '../../path.ux/scripts/widgets/ui_widgets.js';
import * as platform from '../../../platforms/platform.js';
import {Menu} from '../../path.ux/scripts/widgets/ui_menu.js';
import {startup_file} from '../../core/startup_file.js';

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

    this.maxSize = [undefined, h];
    this.minSize = [undefined, h];
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
      "appstate.open_recent()",
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

    row.menu("File", menudef);

    this.genSessionMenu(row);

    let notef = document.createElement("noteframe-x");
    notef.ctx = this.ctx;
    row._add(notef);

    if (window.haveElectron) {
      electron_api.initMenuBar(this);
      this.minSize[1] = this.maxSize[1] = 1;
    }
  }

  genSessionMenu(row)
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

    row.menu("Session", [
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

  makeHeader(container) {
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
