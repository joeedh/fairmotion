import {Area} from '../../path.ux/scripts/screen/ScreenArea.js';
import {STRUCT} from '../../core/struct.js';
import {UIBase, theme} from '../../path.ux/scripts/core/ui_base.js';
import {Editor} from '../editor_base.js';
import {Container} from '../../path.ux/scripts/core/ui.js';
import {color2css, css2color, CSSFont} from '../../path.ux/scripts/core/ui_theme.js';
import {ToolKeyHandler, FuncKeyHandler} from '../events.js';
import {pushModalLight, popModalLight, exportTheme} from '../../path.ux/scripts/pathux.js';

let basic_colors = {
  'white' : [1, 1, 1],
  'grey'  : [0.5, 0.5, 0.5],
  'gray'  : [0.5, 0.5, 0.5],
  'black' : [0, 0, 0],
  'red'   : [1, 0, 0],
  'yellow': [1, 1, 0],
  'green' : [0, 1, 0],
  'teal'  : [0, 1, 1],
  'cyan'  : [0, 1, 1],
  'blue'  : [0, 0, 1],
  'orange': [1, 0.5, 0.25],
  'brown' : [0.5, 0.4, 0.3],
  'purple': [1, 0, 1],
  'pink'  : [1, 0.5, 0.5]
};

export class SettingsEditor extends Editor {
  constructor() {
    super();
  }

  init() {
    super.init();

    let col = this.container.col();
    let tabs = col.tabs("left");

    let tab;

    tab = tabs.tab("General");
    let panel = tab.panel("Units");

    panel.prop("settings.unit_scheme");
    panel.prop("settings.default_unit");

    tab = tabs.tab("Theme");
    tab.button("Export Theme", () => {
      let theme = exportTheme();

      theme = theme.replace(/var theme/, "export const theme");

      theme = `import {CSSFont} from '../path.ux/scripts/pathux.js';\n\n` + theme;
      theme = `
/*
 * WARNING: AUTO-GENERATED FILE
 * 
 * Copy to scripts/editors/theme.js
 */
      `.trim() + "\n\n" + theme + "\n";

      console.log(theme);

      let blob = new Blob([theme], {mime: "application/javascript"});
      let url = URL.createObjectURL(blob);

      console.log("url", url);
      window.open(url);
    });


    this.style["overflow-y"] = "scroll";

    let th = document.createElement("theme-editor-x");
    th.onchange = () => {
      console.log("settings change");
      g_app_state.settings.save();
    }

    let row = tab.row();
    row.button("Reload Defaults", () => {
      g_app_state.settings.reloadDefaultTheme();
      g_app_state.settings.save();

      th.remove();
      th = document.createElement("theme-editor-x");
      tab.add(th);
    });

    tab.add(th);

    window.th = th;

    tab = this.hotkeyTab = tabs.tab("Hotkeys");
    this.buildHotKeys(tab);
  }

  buildHotKeys(tab = this.hotkeyTab) {
    if (!this.ctx || !this.ctx.screen) {
      this.doOnce(this.buildHotKeys);
      return;
    }

    tab.clear();

    let row = tab.row();
    row.button("Reload", () => {
      this.buildHotKeys(tab);
    });

    let build = (tab, label, keymaps) => {
      let panel = tab.panel(label);

      function changePre(hk, handler, keymap) {
        keymap.remove(hk);
      }

      function changePost(hk, handler, keymap) {
        keymap.set(hk, handler);
      }

      function makeKeyPanel(panel2, hk, handler, keymap) {
        panel2.clear();
        let row = panel2.row();

        let key = hk[Symbol.keystr]();

        let name = hk.uiName;

        if (!name && handler instanceof ToolKeyHandler) {
          name = "" + handler.tool;
        } else if (!name) {
          name = "(error)";
        }

        panel2.title = key + " " + name;

        function setPanel2Title() {
          key = hk[Symbol.keystr]();
          panel2.title = key + " " + name;
        }

        function makeModifier(mod) {
          row.button(mod, () => {
            changePre(hk, handler, keymap);

            hk[mod] ^= true;
            console.log(mod, "change", hk, hk[Symbol.keystr]());

            changePost(hk, handler, keymap);

            setPanel2Title();

            console.log("PANEL LABEL:", panel2.label);
          });
        }

        makeModifier("ctrl");
        makeModifier("shift");
        makeModifier("alt");

        let keyButton = row.button(hk.keyAscii, () => {
          let modaldata;
          let start_time;

          let checkEnd = () => {
            if (!modaldata || time_ms() - start_time < 500) {
              return;
            }

            popModalLight(modaldata);
            modaldata = undefined;
          }

          start_time = time_ms();

          modaldata = pushModalLight({
            on_keydown(e) {
              console.log("Got hotkey!", e.keyCode);

              if (modaldata) {
                popModalLight(modaldata);
                modaldata = undefined;
              }

              changePre(hk, handler, keymap);
              hk.key = e.keyCode;
              keyButton.setAttribute("name", hk.keyAscii);
              changePost(hk, handler, keymap);

              setPanel2Title();
            },

            on_mousedown(e) {
              checkEnd();
            },

            on_mouseup(e) {
              checkEnd();
            },
          });
        });
      }

      for (let keymap of keymaps) {
        //console.log("KEYMAP", keymap);
        //continue;

        for (let key of keymap) {
          let panel2 = panel.panel(key);
          let handler = keymap.get(key);
          let hk = keymap.getKey(key);

          makeKeyPanel(panel2, hk, handler, keymap);
          panel2.closed = true;
        }
      }

      panel.closed = true;
    }


    for (let kmset of this.ctx.screen.getKeySets()) {
      build(tab, kmset.name, kmset);
    }
    //build(tab, "General", [this.ctx.screen.keymap]);
  }

  static define() {
    return {
      tagname : "settings-editor-x",
      areaname: "settings_editor",
      uiname  : "Settings",
      icon    : Icons.SETTINGS_EDITOR
    }
  }

  copy() {
    return document.createElement("settings-editor-x");
  }
}

SettingsEditor.STRUCT = STRUCT.inherit(SettingsEditor, Area) + `
}
`;
Editor.register(SettingsEditor);
