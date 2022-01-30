import {Area} from '../../path.ux/scripts/screen/ScreenArea.js';
import {STRUCT} from '../../core/struct.js';
import {Editor} from '../editor_base.js';
import {
  keymap, reverse_keymap, saveUIData, loadUIData, pushModalLight, popModalLight, exportTheme
} from '../../path.ux/scripts/pathux.js';

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

    panel.prop("settings.unit_system");
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

    console.error("KEYMAP EDITOR REBUILD");

    let uidata = saveUIData(tab, "hotkeys");

    tab.clear();

    let row = tab.row();
    row.button("Reload", () => {
      this.buildHotKeys(tab);
    });

    let build = (tab, label, keymaps) => {
      let panel = tab.panel(label);

      let changePre = (hk, handler, keymap) => {
        keymap.ensureWrite();
      }

      let changePost = (hk, handler, keymap) => {
        this.ctx.state.settings.updateKeyDeltas(keymap.typeName, keymap);
      }

      let getHotKeyLabel = (hk) => {
        let key = hk.buildString(); //hk[Symbol.keystr]();
        let name = hk.uiname ?? hk.action;

        if (!hk.uiname && typeof hk.action === "string") {
          let cls = this.ctx.api.parseToolPath(hk.action);

          if (cls) {
            name = cls.tooldef().uiname;
          }
        } else {
          name = "(error)";
        }

        return name + ": " + key;
      }

      let makeKeyPanel = (panel2, hk, handler, keymap) => {
        let row = panel2.row();

        panel2.title = getHotKeyLabel(hk);
        panel2.headerLabel = getHotKeyLabel(hk);

        function setPanel2Title() {
          console.warn("LABEL UPDATE", getHotKeyLabel(hk));

          panel2.title = getHotKeyLabel(hk);
          panel2.headerLabel = getHotKeyLabel(hk);
        }

        function makeModifier(mod) {
          row.button(mod, () => {
            keymap.ensureWrite();

            changePre(hk, handler, keymap);

            mod = mod.toUpperCase();

            if (hk.mods.indexOf(mod) >= 0) {
              hk.mods.remove(mod);
            } else {
              hk.mods.push(mod);
            }

            console.warn(hk.buildString());

            changePost(hk, handler, keymap);

            setPanel2Title();
          });
        }

        makeModifier("ctrl");
        makeModifier("shift");
        makeModifier("alt");

        let keyButton = row.button(hk.key, () => {
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
              keyButton.setAttribute("name", "" + reverse_keymap[hk.key]);
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
        for (let key of keymap) {
          let panel2 = panel.panel(getHotKeyLabel(key));
          let handler = key.action;

          makeKeyPanel(panel2, key, handler, keymap);
          panel2.closed = true;
        }
      }

      panel.closed = true;
    }


    for (let kmset of this.ctx.screen.getKeySets()) {
      build(tab, kmset.name, kmset);
    }

    loadUIData(tab, uidata);

    for (let i = 0; i < 3; i++) {
      tab.flushUpdate();
      tab.flushSetCSS();
    }
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
