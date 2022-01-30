import {DataBlock} from '../core/lib_api.js';
import {nstructjs, util} from '../path.ux/scripts/pathux.js';
import {BrushTool, BrushToolClasses} from './brush_types.js';

export class Brush extends DataBlock {
  constructor() {
    super();

    this.flag = BrushFlags.USE_UNIFIED_SETTINGS;
    this.tool = new BrushTool();

  }

  static blockDefine() {
    return {
      typeName    : "brush",
      uiName      : "Brush",
      defaultName : "Brush",
      typeIndex   : 10,
      accessorName: "brushes",
    }
  }

  copyTo(b: Brush): void {
    b.flag = this.flag;
    b.tool = this.tool.copy();
  }

  load(b) {
    b.copyTo(this);
    return this;
  }

  data_link(block, getblock, getblock_us) {
    block = block || this;

    this.tool.dataLink(this, getblock, getblock_us);
  }

  copy() {
    return new this.constructor().load(this);
  }
}

Brush.STRUCT = nstructjs.inherit(Brush, DataBlock) + `
  flag : int;
  tool : abstract(brush.BrushTool);
}
`;

DataBlock.register(Brush);

export function buildBrushAPI(api) {
  let st = api.mapStruct(Brush, true);

  for (let cls of BrushToolClasses) {
    cls.defineAPI(api);
  }
}
