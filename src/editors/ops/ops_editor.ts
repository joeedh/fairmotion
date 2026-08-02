import {Area} from '../../path.ux/scripts/screen/ScreenArea.js';
import {STRUCT} from '../../core/struct.js';
import {UIBase} from '../../path.ux/scripts/core/ui_base.js';
import {Editor} from '../editor_base.js';

export class OpStackEditor extends Editor {
  constructor() {
    super();

    this._last_toolstack_hash = "";
  }

  rebuild() {
    let ctx = this.ctx;

    this.frame.clear();

    let stack = ctx.toolstack;
    let frame = this.frame;

    for (let i=0; i<stack.undostack.length; i++) {
      let tool = stack.undostack[i];

      let cls = tool.constructor;
      let name;

      if (cls.tooldef) {
        name = cls.tooldef().uiname;
      }
      if (!name) {
        name = tool.uiname || tool.name || cls.name || "(error)";
      }

      let panel = frame.panel(name);
      for (let k in tool.inputs) {
        let path = `operator_stack[${i}].${k}`
        try {
          panel.prop(path);
        } catch (error) {
          print_stack(error);
          continue;
        }
      }

      panel.closed = true;
    }
  }

  update() {
    let ctx = this.ctx;

    if (!ctx || !ctx.toolstack) {
      return;
    }

    let stack = ctx.toolstack;
    let key = "" + stack.undostack.length + ":" + stack.cur;

    if (key !== this._last_toolstack_hash) {
      this._last_toolstack_hash = key;
      this.rebuild();
    }
  }

  init() {
    super.init();

    this.frame = this.container.col();
  }

  static define() { return {
    tagname : "opstack-editor-x",
    areaname : "opstack_editor",
    uiname : "Operator Stack",
    hidden : true
  }}

  copy() {
    return document.createElement("opstack-editor-x");
  }
}
OpStackEditor.STRUCT = STRUCT.inherit(OpStackEditor, Area) + `
}
`;
Editor.register(OpStackEditor);
