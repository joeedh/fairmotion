import {ToolOp} from '../../core/toolops_api.js';
import {AnimKeyFlags, AnimKeyTypes, get_vtime, set_vtime} from "../../core/animdata.js";
import {ListProperty, EnumProperty, FloatProperty,
        IntProperty, BoolProperty, IntArrayProperty} from "../../core/toolprops.js";
import * as util from '../../path.ux/scripts/util/util.js';
import {SplineFlags} from "../../curve/spline_base.js";

export class KeyIterItem {
  type : AnimKeyType;

  getFlag() {

  }

  setFlag() {
  }

  getTime() {

  }

  setTime() {

  }

  getValue() {

  }

  setValue() {

  }
}

export class VertKeyIterItem extends KeyIterItem {
  constructor() {
    super();
    this.v = undefined;
    this.spline = undefined;
    this.type = AnimKeyTypes.SPLINE;
  }

  getFlag() {
    let flag = 0;

    if (this.v.flag & SplineFlags.UI_SELECT) {
      flag |= AnimKeyFlags.SELECT;
    }

    return flag;
  }

  setFlag(flag : number) : this {
    if (flag & AnimKeyFlags.SELECT) {
      this.v.flag |= SplineFlags.UI_SELECT;
    } else {
      this.v.flag &= ~SplineFlags.UI_SELECT;
    }

    return this;
  }

  getTime() {
    return get_vtime(this.v);
  }

  setTime(time) {
    if (isNaN(time)) {
      throw new Error("Time was NaN!");
    }

    set_vtime(this.spline, this.v, time);
  }

  init(spline, v) : this {
    this.spline = spline;
    this.v = v;
    return this;
  }

  destroy() {
    this.spline = undefined;
    this.v = undefined;
  }
}

export class DataPathKeyItem extends VertKeyIterItem {
  constructor(datapath) {
    this.path = datapath;
    throw new Error("implement me");
  }
}

let vkey_cache = util.cachering.fromConstructor(VertKeyIterItem, 32);
//let dpkey_cache = util.cachering.fromConstructor(DataPathKeyItem, 512)

let UEID=0, UTIME=1, UFLAG=2, UX=3, UY=4, UTOT=5;

export class AnimKeyTool extends ToolOp {
  constructor() {
    super();
  }

  static tooldef() {return {
    inputs : {
      useKeyList : new BoolProperty(),
      keyList : new IntArrayProperty() //should be (AnimKeyType, keyId) pairs
    }
  }}

  * iterKeys(ctx) {
    if (this.keyList) {
      let list = this.inputs.keyList.getValue();

      for (let i=0; i<list.length; i += 2) {
        let type = list[i], id = list[i+1];
        if (type === AnimKeyTypes.SPLINE) {
          let spline = ctx.frameset.pathspline;

          let v = spline.eidmap[id];
          if (!v) {
            console.warn("Error iterating spline animation keys; key could not be found", id, ctx.frameset.pathspline);
            continue;
          }

          yield vkey_cache.next().init(spline, v);
        } else {
          throw new Error("implement me!");
        }
      }
    } else {
      console.warn("basic iter");

      let frameset = ctx.frameset;
      let spline = frameset.spline; //not path spline
      let pathspline = frameset.pathspline;

      for (var i2=0; i2<2; i2++) {
        let list = i2 ? spline.handles : spline.verts;

        for (let v of list.selected.editable(ctx)) {

          if (!(v.eid in frameset.vertex_animdata)) {
            continue;
          }

          //console.log(v, v.eid);
          let vd = frameset.vertex_animdata[v.eid];

          for (let v2 of vd.verts) {
            yield vkey_cache.next().init(pathspline, v2);
          }
        }
      }
    }
  }

  undoPre(ctx) {
    this.undo_pre(ctx);
  }

  undo_pre(ctx) {
    let spline = [];

    let _undo = this._undo = {
      spline : spline
    };

    for (let key of this.iterKeys(ctx)) {
      if (key.type === AnimKeyTypes.SPLINE) {
        spline.push(key.v.eid);
        spline.push(get_vtime(key.v));
        spline.push(key.v.flag);

        spline.push(key.v[0]);
        spline.push(key.v[1]);
      } else {
        throw new Error("implement me!");
      }
    }
  }


  undo(ctx) {
    let list = this._undo.spline;
    let spline = ctx.frameset.pathspline;

    for (let i=0; i<list.length; i += UTOT) {
      let eid = list[i], time = list[i+1], flag = list[i+2];
      let x = list[i+3], y = list[i+4];

      let v = spline.eidmap[eid];
      if (!v) {
        console.warn("EEK! Misssing vertex/handle in AnimKeyTool.undo!");
        continue;
      }

      let do_update = Math.abs(x-v[0]) > 0.001 || Math.abs(y-v[1]) > 0.001;

      v.flag = flag;
      set_vtime(spline, v, time);
      v[0] = x;
      v[1] = y;

      if (do_update) {
        v.flag |= SplineFlags.UPDATE;
      }
    }

    //pathspline.regen_render();
    ctx.frameset.spline.updateGen++; //signal dopesheet to draw
    window.redraw_viewport();
  }

  exec(ctx) {
    //ctx.frameset.pathspline.regen_render();
    //ctx.frameset.spline.regen_render();
    ctx.frameset.spline.updateGen++; //signal dopesheet to draw
    window.redraw_viewport();
  }
}

export const SelModes = {
  AUTO : 0,
  ADD  : 1,
  SUB  : 2,
}

export class ToggleSelectAll extends AnimKeyTool {
  constructor() {
    super();
  }

  static tooldef () {return {
    uiname     : "Toggle Select All (Keys)",
    toolpath   : "animkeys.toggle_select_all()",
    inputs     : ToolOp.inherit({
      mode     : new EnumProperty("AUTO", SelModes)
    })
  }}

  exec(ctx) {
    console.log("Anim Key Toggle Select Tool!");

    let mode = this.inputs.mode.getValue();
    let count = 0;

    if (mode === SelModes.AUTO) {
      mode = SelModes.ADD;

      for (let key of this.iterKeys(ctx)) {
//        console.log(key);

        let flag = key.getFlag();
        console.log(flag, AnimKeyFlags.SELECT);
        if (flag & AnimKeyFlags.SELECT) {
          mode = SelModes.SUB;
          break;
        }
        //count += (flag & AnimKeyTypes.SELECT) ? 1 : -1
      }

      //mode = count > 0 ? SelModes.SUB : SelModes.ADD;
    }

    console.log(mode, count);

    for (let key of this.iterKeys(ctx)) {
      if (mode === SelModes.ADD) {
        key.setFlag(key.getFlag() | AnimKeyFlags.SELECT);
      } else {
        key.setFlag(key.getFlag() & ~AnimKeyFlags.SELECT);
      }
    }

    super.exec(ctx);
  }
}

