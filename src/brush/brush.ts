import {DataBlock} from '../core/lib_api.js';
import type {GetBlockFunc, GetBlockUserFunc} from '../core/lib_api.js';
import {nstructjs, util} from '../path.ux/scripts/pathux.js';
import type {DataAPI} from '../path.ux/scripts/pathux.js';
import {BrushTool, BrushToolClasses} from './brush_types.js';
import {BrushFlags} from './brush_base.js';

export class Brush extends DataBlock {
  static STRUCT : string;

  flag : number;
  tool : BrushTool;

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

  load(b : Brush) {
    b.copyTo(this);
    return this;
  }

  data_link(block : DataBlock, getblock : GetBlockFunc,
            getblock_us : GetBlockUserFunc) {
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

export function buildBrushAPI(api : DataAPI) {
  let st = api.mapStruct(Brush, true);

  for (let cls of BrushToolClasses) {
    cls.defineAPI(api);
  }
}
