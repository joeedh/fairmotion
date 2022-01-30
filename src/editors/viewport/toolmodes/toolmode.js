import {NodeBase} from "../../../core/eventdag.js";
import {KeyMap} from "../../events.js";
import {nstructjs} from "../../../path.ux/scripts/pathux.js";

export const ToolModeFlags = {

};

export const ToolModes = [];
ToolModes.map = {};

export class ToolMode extends NodeBase {
  keymap : KeyMap;

  constructor() {
    super();

    this.ctx = undefined;
    this.keymap = new KeyMap("view2d:" + this.constructor.name);
  }

  rightClickMenu(e, localX, localY, view2d) {

  }

  /** returns true on consuming the event */
  on_mousedown(e, localX, localY) {

  }

  /** returns true on consuming the event */
  on_mousemove(e, localX, localY) {

  }

  /** returns true on consuming the event */
  on_mouseup(e, localX, localY) {

  }

  do_select(event : Object, mpos : Vector3, view2d : View2DHandler, do_multiple : number) {

  }

  do_alt_select(event, mpos, view2d) {

  }

  draw(view2d) {

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

  static buildEditMenu(container) {

  }

  static buildSideBar(container) {

  }

  static buildHeader(container) {

  }

  static buildProperties(container) {

  }

  static defineAPI(api) {
    let st = api.mapStruct(this, true);

    st.string("name", "constructor.name", "Name", "Name");

    return st;
  }

  on_tick() {
    if (!this.ctx) {
      return;
    }
  }

  static register(cls) {
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

  dataLink(scene, getblock, getblock_us) {


  }

  loadSTRUCT(reader) {
    reader(this);
  }
}
ToolMode.STRUCT = `
ToolMode {
  
}`;

export function initToolModeAPI(api) {
  for (let tool of ToolModes) {
    tool.defineAPI(api);
  }
}
