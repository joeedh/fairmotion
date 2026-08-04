import {NodeBase} from "../../../core/eventdag.js";
import {KeyMap} from '../../../core/keymap.js';
import {nstructjs} from "../../../path.ux/scripts/pathux.js";
import type {FullContext} from '../../../core/context.js';
import type {View2DHandler} from '../view2d.js';
import type {Container} from '../../../path.ux/scripts/core/ui.js';
import type {DataAPI} from '../../../path.ux/scripts/path-controller/controller/controller.js';
import type {Scene} from '../../../scene/scene.js';
import type {DataBlock} from '../../../core/lib_api.js';

export const ToolModeFlags = {

};

/* Every registered ToolMode subclass, plus a by-name index keyed on
   toolDefine().name.  Scene keeps a parallel list of *instances* with the
   same array-plus-map shape. */
export type ToolModeClass = typeof ToolMode;

export const ToolModes : ToolModeClass[] & {map : {[name : string] : ToolModeClass}} = [];
ToolModes.map = {};

export class ToolMode extends NodeBase {
  static STRUCT : string;

  keymap : KeyMap;
  /* Set by the owning View2DHandler once the mode goes active. */
  ctx : FullContext | undefined;

  constructor() {
    super();

    this.ctx = undefined;
    this.keymap = new KeyMap("view2d:" + this.constructor.name);
  }

  rightClickMenu(e : MouseEvent, localX : number, localY : number,
                 view2d : View2DHandler) {

  }

  /** returns true on consuming the event */
  on_mousedown(e : PointerEvent, localX : number, localY : number) {

  }

  /** returns true on consuming the event */
  on_mousemove(e : PointerEvent, localX : number, localY : number) {

  }

  /** returns true on consuming the event */
  on_mouseup(e : PointerEvent, localX : number, localY : number) {

  }

  do_select(event : MouseEvent, mpos : Vector3, view2d : View2DHandler,
            do_multiple : boolean) {

  }

  do_alt_select(event : MouseEvent, mpos : Vector3, view2d : View2DHandler) {

  }

  draw(view2d : View2DHandler) {

  }

  onActive() {


  }

  onInactive() {

  }

  duplicate() {
    return new this.constructor();
  }

  static contextOverride() {

  }

  static buildEditMenu(container : Container) {

  }

  static buildSideBar(container : Container) {

  }

  static buildHeader(container : Container) {

  }

  static buildProperties(container : Container) {

  }

  static defineAPI(api : DataAPI) {
    let st = api.mapStruct(this, true);

    st.string("name", "constructor.name", "Name", "Name");

    return st;
  }

  on_tick() {
    if (!this.ctx) {
      return;
    }
  }

  static register(cls : ToolModeClass) {
    if (cls.toolDefine === this.toolDefine) {
      throw new Error("you forgot to implement toolDefine()");
    }

    ToolModes.push(cls);
    ToolModes.map[cls.toolDefine().name] = cls;

    if (!cls.STRUCT) {
      console.warn("auto-generating STRUCT data for " + cls.name);
      cls.STRUCT = nstructjs.inherit(cls, ToolMode) + `\n}`;
      cls.prototype.loadSTRUCT = function(reader) { reader(this); };
    }

    nstructjs.register(cls);
  }

  //children need not override this,
  //its fields are built from toolDefine()
  static nodedef() {
    let def = this.toolDefine();
    return {
      name      : def.name,
      uiName    : def.uiName,
      flag      : def.nodeFlag,
      icon      : def.icon,
      inputs    : def.nodeInputs,
      outputs   : def.nodeOutputs
    }
  }

  static toolDefine() {return {
    name        : "",
    uiName      : "",
    flag        : 0,
    icon        : -1,
    nodeInputs  : {},
    nodeOutputs : {},
    nodeFlag    : 0
  }}

  getKeyMaps() {
    return [this.keymap]
  }

  dataLink(scene : Scene, getblock : (ref) => DataBlock,
           getblock_us : (ref) => DataBlock) {


  }

  loadSTRUCT(reader : StructReader<this>) {
    reader(this);
  }
}
ToolMode.STRUCT = `
ToolMode {

}`;

export function initToolModeAPI(api : DataAPI) {
  for (let tool of ToolModes) {
    tool.defineAPI(api);
  }
}
