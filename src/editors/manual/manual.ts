import type {FullContext} from "../../core/context.js";
import {Editor} from '../editor_base.js';
import * as util from '../../path.ux/scripts/util/util.js';
import {ModalStates} from '../../core/toolops_api.js';
import {nstructjs} from '../../path.ux/scripts/pathux.js';

import * as docbrowser from '../../path.ux/scripts/docbrowser/docbrowser.js';
import type {UIBase} from '../../path.ux/scripts/core/ui_base.js';

export class ManualEditor extends Editor {
  static STRUCT : string;

  browser! : UIBase<FullContext>;

  constructor() {
    super();
  }

  init() {
    super.init();

    this.initBrowser();
  }

  initBrowser() {
    /* NOTE: this passed doOnce() the *result* of calling initBrowser again,
       so the guard below recursed until the stack blew. */
    if (!docbrowser) {
      this.doOnce(this.initBrowser);
      return;
    }

    this.browser = document.createElement("docs-browser-x");
    this.container.add(this.browser);

    this.container.style["overflow"] = "scroll";
  }

  update() {
    super.update();
  }

  static define() {
    return {
      tagname: "manual-editor-x",
      areaname : "manual",
      uiname : "Manual"
    }
  }
}

ManualEditor.STRUCT = nstructjs.inherit(ManualEditor, Editor) + `
}
`;

Editor.register(ManualEditor);
