import type {FullContext} from "../core/context.js";
import {UIBase, Icons, PackFlags} from '../path.ux/scripts/core/ui_base.js';
import * as nstructjs from '../path.ux/scripts/util/struct.js';
import * as util from '../path.ux/scripts/util/util.js';
import {Container} from '../path.ux/scripts/core/ui.js';
import {LoadImageOp} from "../image/image_ops.js";
import type {DropBox} from '../path.ux/scripts/widgets/ui_menu.js';
import type {DataBlock} from '../core/lib_api.js';
import {DataRefProperty, RefListProperty} from '../core/toolprops.js';

/* Datablock name -> lib_id, the enum definition the listbox is built from. */
export type IDList = {[name : string] : number};

export class IDBrowser extends Container<FullContext> {
  idlist : IDList;
  /* NOTE: this was named `listbox`, which is also a Container method, so the
     field shadowed it on every instance.  listenum() returns a DropBox. */
  dropbox! : DropBox<FullContext>;

  constructor() {
    super();

    this.idlist = {};
  }

  init() {
    super.init();

    let name : string | undefined = undefined;
    try {
      let path = this.getAttribute("datapath");
      let block = path ? this.getPathValue<DataBlock>(this.ctx, path) : undefined;

      if (block) {
        name = block.name;
      }
    } catch (error) {
      util.print_stack(error);
    }

    this.buildEnum();
    this.dropbox = this.listenum(undefined, {
      enumDef : this.idlist,
      callback : this._on_select.bind(this),
      defaultval : name
    });
  }

  _on_select(lib_id : number) {
    let block = this.ctx.datalib.idmap[lib_id];
    if (block) {
      console.log("block:", block);
      let path = this.getAttribute("datapath");

      if (path) {
        this.setPathValue(this.ctx, path, block);
      }
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

    /* Only the two datablock-reference properties carry an allowed-type set;
       the browser is meaningless pointed at anything else. */
    let prop = rdef.prop;
    if (!(prop instanceof DataRefProperty || prop instanceof RefListProperty)) {
      console.error("Datapath is not a datablock reference", path);
      return;
    }

    let datalib = this.ctx.datalib;
    let lst = [];

    for (let block of datalib.allBlocks) {
      if (prop.types.has(block.lib_type)) {
        lst.push(block);
      }
    }

    /* NOTE: this was `(a.name < b.name)*2 - 1`, which yields +1 when a sorts
       first, so the browser has always listed names in reverse.  Kept. */
    lst.sort((a, b) => {
      return a.name.toLowerCase() < b.name.toLowerCase() ? 1 : -1;
    });

    let def : IDList = {};
    this.idlist = def;

    for (let block of lst) {
      def[block.name] = block.lib_id;
    }

    return def;
  }

  updateDataPath() {
    let path = this.getAttribute("datapath");
    if (!path) return;

    let value = this.getPathValue<DataBlock>(this.ctx, path);
    let name = "";

    if (value === undefined) {
      name = ""
    } else {
      name = value.name;
    }

    if (name !== this.dropbox.value) {
      this.dropbox.setAttribute("name", name);
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

export class ImageUserPanel extends Container<FullContext> {
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
      let toolop = new LoadImageOp(this.getAttribute("datapath") ?? "");
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
