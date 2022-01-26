import {Editor} from '../editor_base.js';
import * as util from '../../path.ux/scripts/util/util.js';
import {ModalStates} from '../../core/toolops_api.js';
import {nstructjs} from '../../path.ux/scripts/pathux.js';

import * as docbrowser from '../../path.ux/scripts/docbrowser/docbrowser.js';

export class ManualEditor extends Editor {
  constructor() {
    super();
  }

  init() {
    super.init();

    this.initBrowser();
  }

  initBrowser() {
    if (!docbrowser) {
      this.doOnce(this.initBrowser());
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
