import {NodeBase} from "../../../core/eventdag.js";
import {KeyMap} from "../../../path.ux/scripts/util/simple_events.js";
import {ToolMode} from "./toolmode.js";
import {nstructjs} from "../../../path.ux/scripts/pathux.js";

export class SplineToolMode extends ToolMode {
  constructor() {
    super();

    this.ctx = undefined;
    this.keymap = new KeyMap([

    ])
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

  on_tick() {
    if (!this.ctx) {
      return;
    }
  }

  static toolDefine() {return {
    name        : "spline",
    uiName      : "Spline",
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
SplineToolMode.STRUCT = nstructjs.inherit(SplineToolMode, ToolMode) + `
}`;

ToolMode.register(SplineToolMode);
