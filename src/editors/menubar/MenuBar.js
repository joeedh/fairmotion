import {Area} from 'ScreenArea';
import {STRUCT} from 'struct';
import {UIBase} from 'ui_base';
import {Editor} from 'editor_base';
import * as ui_widgets from 'ui_widgets';
import * as platform from 'platform';
import {Menu} from 'ui_menu';
import {startup_file} from 'startup_file';

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
      "appstate.new()"
    ];

    menudef.reverse();

    row.menu("File", menudef);

    this.genSessionMenu(row);

    let notef = document.createElement("noteframe-x");
    notef.ctx = this.ctx;
    row._add(notef);
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
    icon : Icons.MENU_EDITOR
  }}

  static getHeight() {
    return ~~(UIBase.getDPI()*19);
  }

  copy() {
    return document.createElement("menubar-editor-x");
  }

  static fromSTRUCT(reader) {
    let ret = document.createElement("menubar-editor-x");
    reader(ret);
    return ret;
  }
}
MenuBar.STRUCT = STRUCT.inherit(MenuBar, Editor) + `
}
`;
Editor.register(MenuBar);
