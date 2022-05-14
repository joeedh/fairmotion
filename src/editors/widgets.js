import {UIBase, Icons, PackFlags} from '../path.ux/scripts/core/ui_base.js';
import * as nstructjs from '../path.ux/scripts/util/struct.js';
import * as util from '../path.ux/scripts/util/util.js';
import {Container} from '../path.ux/scripts/core/ui.js';
import {LoadImageOp} from "../image/image_ops.js";

export class IDBrowser extends Container {
  constructor() {
    super();

    this.idlist = {};
  }

  init() {
    super.init();

    let name = undefined;
    try {
      let block = this.getPathValue(this.ctx, this.getAttribute("datapath"));
      if (block) {
        name = block.name;
      }
    } catch (error) {
      util.print_stack(error);
    }

    this.buildEnum();
    this.listbox = this.listenum(undefined, {
      enumDef : this.idlist,
      callback : this._on_select.bind(this),
      defaultval : name
    });
  }

  _on_select(lib_id) {
    let block = this.ctx.datalib.idmap[lib_id];
    if (block) {
      console.log("block:", block);
      let path = this.getAttribute("datapath");
      this.setPathValue(this.ctx, path, block);
    } else {
      console.warn("unknown block with id '" + lib_id + "'");
    }
  }

  buildEnum() {
    let path = this.getAttribute("datapath");
    let rdef = path ? this.ctx.api.resolvePath(this.ctx, path) : undefined;

    if (!path || !rdef || !rdef.prop) {
      console.error("Datapath error");
      return;
    }

    let prop = rdef.prop;

    let datalib = this.ctx.datalib;
    let lst = [];

    for (let block of datalib.allBlocks) {
      if (prop.types.has(block.lib_type)) {
        lst.push(block);
      }
    }

    lst.sort((a, b) => {
      return (a.name.toLowerCase() < b.name.toLowerCase())*2 - 1;
    });

    let def = {};
    this.idlist = def;

    for (let block of lst) {
      def[block.name] = block.lib_id;
    }

    return def;
  }

  updateDataPath() {
    let path = this.getAttribute("datapath");
    if (!path) return;

    let value = this.getPathValue(this.ctx, path);
    let name = "";

    if (value === undefined) {
      name = ""
    } else {
      name = value.name;
    }

    if (name !== this.listbox.value) {
      this.listbox.setAttribute("name", name);
    }
  }
  update() {
    super.update();

    this.updateDataPath();
  }

  setCSS() {
    super.setCSS();
  }

  static define() {return {
    tagname : "id-browser-x"
  }}
}

UIBase.register(IDBrowser);

export class ImageUserPanel extends Container {
  constructor() {
    super();

    //panel.prop(path + ".off");
    //panel.prop(path + ".scale");
  }

  init() {
    super.init();

    let path = this.getAttribute("datapath");

    let row = this.row();

    let idbrowser = document.createElement("id-browser-x");
    idbrowser.setAttribute("datapath", path + ".image");
    row.add(idbrowser);
    row.button("Open", () => {
      let toolop = new LoadImageOp(this.getAttribute("datapath"));
      this.ctx.api.execTool(this.ctx, toolop);
    });

    this.prop(path + ".off"); //, PackFlags.NO_NUMSLIDER_TEXTBOX);
    this.prop(path + ".scale"); //, PackFlags.NO_NUMSLIDER_TEXTBOX);

    this.setCSS();
  }

  update() {
    super.update();
  }

  setCSS() {
    super.setCSS();

    let w = 150;
    this.style["width"] = w + "px";
  }

  static define() {return {
    tagname : "image-user-panel-x"
  }}
}
UIBase.register(ImageUserPanel);
