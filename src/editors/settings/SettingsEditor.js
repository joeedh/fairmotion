import {Area} from '../../path.ux/scripts/screen/ScreenArea.js';
import {STRUCT} from '../../core/struct.js';
import {UIBase, theme} from '../../path.ux/scripts/core/ui_base.js';
import {Editor} from '../editor_base.js';
import {Container} from '../../path.ux/scripts/core/ui.js';
import {color2css, css2color, CSSFont} from '../../path.ux/scripts/core/ui_theme.js';
import {ToolKeyHandler, FuncKeyHandler} from '../events.js';
import {pushModalLight, popModalLight} from '../../path.ux/scripts/pathux.js';

let basic_colors = {
  'white' : [1,1,1],
  'grey' : [0.5, 0.5, 0.5],
  'gray' : [0.5, 0.5, 0.5],
  'black' : [0, 0, 0],
  'red' : [1, 0, 0],
  'yellow' : [1, 1, 0],
  'green' : [0, 1, 0],
  'teal' : [0, 1, 1],
  'cyan' : [0, 1, 1],
  'blue' : [0, 0, 1],
  'orange' : [1, 0.5, 0.25],
  'brown' : [0.5, 0.4, 0.3],
  'purple' : [1, 0, 1],
  'pink' : [1, 0.5, 0.5]
};

export class ThemeEditor extends Container {
  constructor() {
    super();
  }

  init() {
    super.init();

    this.build();
  }

  doFolder(key, obj) {
    let panel = this.panel(key);
    panel.closed = true;
    panel.style["margin-left"] = "15px";

    let row = panel.row();
    let col1 = row.col();
    let col2 = row.col();


    let do_onchange = (key, k) => {
      if (this.onchange) {
        this.onchange(key, k);
      }
    };

    let ok = false;
    let _i = 0;

    let dokey = (k, v) => {
      let col = _i % 2 == 0 ? col1 : col2;

      if (k.toLowerCase().search("flag") >= 0) {
        return; //don't do flags
      }

      if (typeof v === "string") {
        let v2 = v.toLowerCase().trim();

        let iscolor = v2 in basic_colors;
        iscolor = iscolor || v2.search("rgb") >= 0;
        iscolor = iscolor || v2[0] === "#";

        if (iscolor) {
          let cw = col.colorbutton();
          ok = true;
          _i++;

          try {
            cw.setRGBA(css2color(v2));
          } catch (error) {
            console.warn("Failed to set color " + k, v2);
          }

          cw.onchange = () => {
            console.log("setting '" + k + "' to " + color2css(cw.rgba), key);
            theme[key][k] = color2css(cw.rgba);

            do_onchange(key, k);
          }
          cw.label = k;
        }
      } else if (typeof v === "number") {
        let slider = col.slider(undefined, k, v, 0, 256, 0.01, false);

        ok = true;
        _i++;

        slider.onchange = () => {
          theme[key][k] = slider.value;

          do_onchange(key, k);
        }
      } else if (typeof v === "object" && v instanceof CSSFont) {
        let panel2 = col.panel(k);
        ok = true;
        _i++;

        let textbox = (key) => {
          panel2.label(key);
          panel2.textbox(undefined, v[key]).onchange = function() {
            v[key] = this.text;
            do_onchange(key, k);
          }
        }

        textbox("font");
        textbox("variant"); 
        textbox("weight");
        textbox("style");

        let cw = panel2.colorbutton();
        cw.label = "color";
        cw.setRGBA(css2color(v));
        cw.onchange = () => {
          v.color = color2css(v.color);
        }

        let slider = panel2.slider(undefined, "size", v.size);
        slider.onchange = () => {
          v.size = slider.value;
          do_onchange(key, k);
        }
      }
    };

    for (let k in obj) {
      let v = obj[k];

      dokey(k, v);
    }

    if (!ok) {
      panel.remove();
    }
  }

  build() {
    let keys = Object.keys(theme);
    keys.sort();

    for (let k of keys) {
      let v = theme[k];
      if (typeof v === "object") {
        this.doFolder(k, v);
      }
    }
  }

  static define() { return {
    tagname : "theme-editor-2-x",
    style   : "theme-editor"
  }}
}
UIBase.register(ThemeEditor);

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
    this.style["overflow-y"] = "scroll";

    let th = document.createElement("theme-editor-x");
    th.onchange = () => {
      console.log("settings change");
      g_app_state.settings.save();
    }

    let row =  tab.row();
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
          name = ""+handler.tool;
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

  static define() { return {
    tagname : "settings-editor-x",
    areaname : "settings_editor",
    uiname : "Settings",
    icon : Icons.SETTINGS_EDITOR
  }}

  copy() {
    return document.createElement("settings-editor-x");
  }
}
SettingsEditor.STRUCT = STRUCT.inherit(SettingsEditor, Area) + `
}
`;
Editor.register(SettingsEditor);
