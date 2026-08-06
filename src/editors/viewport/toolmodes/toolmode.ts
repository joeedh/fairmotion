import { NodeBase } from "../../../core/eventdag.js";
import { KeyMap } from "../../../core/keymap.js";
import { nstructjs } from "../../../path.ux/scripts/pathux.js";
import type { FullContext } from "../../../core/context.js";
import type { View2DHandler } from "../view2d.js";
import type { Container } from "../../../path.ux/scripts/core/ui.js";
import type { MenuTemplate } from "../../../path.ux/scripts/widgets/ui_menu.js";
import type { DataAPI } from "../../../path.ux/scripts/path-controller/controller/controller.js";
import type { Scene } from "../../../scene/scene.js";
import type { DataBlock, GetBlockFunc, GetBlockUserFunc } from "../../../core/lib_api.js";
import type { Spline } from "../../../curve/spline.js";
import type { SplineElement } from "../../../curve/spline_base.js";

/* What findnearest() hands back: the spline owning the hit, the element that
   was hit, and its screen-space distance. */
export type ToolModeHit = [Spline, SplineElement, number];

export const ToolModeFlags = {};

/* Every registered ToolMode subclass, plus a by-name index keyed on
   toolDefine().name.  Scene keeps a parallel list of *instances* with the
   same array-plus-map shape. */
export type ToolModeClass = typeof ToolMode;

/* An array carrying a by-name index on itself.  The index lives under `map`,
   shadowing Array.prototype.map, so neither registry can be .map()ed. */
export type NamedList<T> = T[] & { map: { [name: string]: T } };

/* Object.assign is what builds the intersection type without a cast. */
export function asNamedList<T>(list: T[]): NamedList<T> {
  let map: { [name: string]: T } = {};

  return Object.assign(list, { map });
}

export function makeNamedList<T>(): NamedList<T> {
  return asNamedList<T>([]);
}

export const ToolModes = makeNamedList<ToolModeClass>();

export class ToolMode extends NodeBase {
  declare ["constructor"]: ToolModeClass;

  static STRUCT: string;

  keymap: KeyMap;
  /* Set by the owning View2DHandler once the mode goes active. */
  ctx: FullContext | undefined;

  /* Both are stamped on by View2DHandler.on_mousedown before it dispatches;
     no ToolMode ever assigns them itself. */
  declare view2d: View2DHandler;
  declare selectmode: number;

  constructor() {
    super();

    this.ctx = undefined;
    this.keymap = new KeyMap("view2d:" + this.constructor.name);
  }

  rightClickMenu(e: MouseEvent, localX: number, localY: number, view2d: View2DHandler) {}

  /* View2DHandler dispatches these with the event alone -- it has already
     localized the coordinates on it -- so the two extras are optional, and no
     implementation reads them. */

  /** returns true on consuming the event */
  on_mousedown(e: PointerEvent, localX?: number, localY?: number): boolean | undefined {
    return undefined;
  }

  /** returns true on consuming the event */
  on_mousemove(e: PointerEvent, localX?: number, localY?: number): boolean | undefined {
    return undefined;
  }

  /** returns true on consuming the event */
  on_mouseup(e: PointerEvent, localX?: number, localY?: number): boolean | undefined {
    return undefined;
  }

  /* The concrete editors take a plain coordinate pair; the toolmodes take a
     Vector3.  Both only ever index it. */
  do_select(
    event: MouseEvent,
    mpos: Vector3 | number[],
    view2d: View2DHandler,
    do_multiple: boolean
  ) {}

  do_alt_select(event: MouseEvent, mpos: Vector3 | number[], view2d: View2DHandler) {}

  draw(view2d: View2DHandler) {}

  findnearest(
    mpos: number[],
    selectmask: number,
    limit: number,
    ignore_layers: boolean
  ): ToolModeHit | undefined {
    return undefined;
  }

  tools_menu(ctx: FullContext, mpos: number[], view2d: View2DHandler) {}

  onActive() {}

  onInactive() {}

  /* `this.constructor` types as Function, so the statics cannot be reached
     through it; this keeps the dynamic dispatch a plain `ToolMode.` prefix
     would throw away. */
  get cls(): typeof ToolMode {
    return this.constructor as typeof ToolMode;
  }

  duplicate() {
    return new this.cls();
  }

  static contextOverride() {}

  /* NOTE: this took a container and returned nothing, but its only caller
     (MenuBar.buildEditMenu) passes no argument and iterates the result, which
     is what both overrides do. */
  static buildEditMenu(): MenuTemplate {
    return [];
  }

  static buildSideBar(container: Container<FullContext>) {}

  static buildHeader(container: Container<FullContext>) {}

  static buildProperties(container: Container<FullContext>) {}

  static defineAPI(api: DataAPI) {
    let st = api.mapStruct(this, true);

    st.string("name", "constructor.name", "Name", "Name");

    return st;
  }

  /* view2d passes its context; no implementation reads it -- they all use
     this.ctx -- so it is optional. */
  on_tick(ctx?: FullContext) {
    if (!this.ctx) {
      return;
    }
  }

  static register(cls: ToolModeClass) {
    if (cls.toolDefine === this.toolDefine) {
      throw new Error("you forgot to implement toolDefine()");
    }

    ToolModes.push(cls);
    ToolModes.map[cls.toolDefine().name] = cls;

    if (!cls.STRUCT) {
      console.warn("auto-generating STRUCT data for " + cls.name);
      cls.STRUCT = nstructjs.inherit(cls, ToolMode) + `\n}`;
      cls.prototype.loadSTRUCT = function (reader) {
        reader(this);
      };
    }

    nstructjs.register(cls);
  }

  //children need not override this,
  //its fields are built from toolDefine()
  static nodedef() {
    let def = this.toolDefine();
    return {
      name   : def.name,
      uiName : def.uiName,
      flag   : def.nodeFlag,
      icon   : def.icon,
      inputs : def.nodeInputs,
      outputs: def.nodeOutputs,
    };
  }

  static toolDefine() {
    return {
      name       : "",
      uiName     : "",
      flag       : 0,
      icon       : -1,
      nodeInputs : {},
      nodeOutputs: {},
      nodeFlag   : 0,
    };
  }

  getKeyMaps() {
    return [this.keymap];
  }

  dataLink(scene: Scene, getblock: GetBlockFunc, getblock_us: GetBlockUserFunc) {}

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
  }
}
ToolMode.STRUCT = `
ToolMode {

}`;

export function initToolModeAPI(api: DataAPI) {
  for (let tool of ToolModes) {
    tool.defineAPI(api);
  }
}
