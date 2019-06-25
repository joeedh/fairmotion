import {Area} from 'ScreenArea';
import {STRUCT} from 'struct';

export class Editor extends Area {
  init() {
    super.init();

    this.container = document.createElement("container-x");
    this.container.ctx = this.ctx;

    this.container.style["width"] = "100%";
    this.shadow.appendChild(this.container);

    this.makeHeader(this.container);
    this.setCSS();
  }

  on_destroy() {

  }

  data_link(block : DataBlock, getblock : Function, getblock_us : Function) {

  }

  static register(cls) {
    return Area.register(cls);
  }
}

Editor.STRUCT = STRUCT.inherit(Editor, Area) + `
}
`;
