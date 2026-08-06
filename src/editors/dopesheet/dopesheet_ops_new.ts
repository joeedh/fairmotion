import { ToolOp } from "../../core/toolops_api.js";
import type { ToolDef } from "../../core/toolops_api.js";
import type { PropertySlots } from "../../path.ux/scripts/pathux.js";
import { AnimKeyFlags, AnimKeyTypes, get_vtime, set_vtime } from "../../core/animdata.js";
import {
  ListProperty,
  EnumProperty,
  FloatProperty,
  Vec2Property,
  IntProperty,
  BoolProperty,
  IntArrayProperty,
} from "../../core/toolprops.js";
import * as util from "../../path.ux/scripts/util/util.js";
import { SplineFlags } from "../../curve/spline_base.js";
import { Vector2 } from "../../path.ux/scripts/util/vectormath.js";
import { Icons } from "../../datafiles/icon_enum.js";
import type { FullContext } from "../../core/context.js";
import type { Spline } from "../../curve/spline.js";
import { SplineVertex } from "../../curve/spline_types.js";
import type { SplineFrameSet } from "../../core/frameset.js";

/* One editable key in the dopesheet, behind a uniform get/set surface so
   spline-vertex keys and data-path keys can be iterated together. */
export class KeyIterItem {
  /* An AnimKeyTypes value. */
  type!: number;

  /* Abstract in spirit: every concrete item overrides these three. */
  getFlag(): number {
    throw new Error("implement me");
  }

  setFlag(flag: number): this {
    throw new Error("implement me");
  }

  getTime(): number {
    throw new Error("implement me");
  }

  setTime(time: number) {}

  setSelect(state: boolean) {
    if (state) {
      this.setFlag(this.getFlag() | AnimKeyFlags.SELECT);
    } else {
      this.setFlag(this.getFlag() & ~AnimKeyFlags.SELECT);
    }
  }

  kill() {
    throw new Error("implement me");
  }
  getValue() {
    throw new Error("implement me");
  }

  setValue() {
    throw new Error("implement me");
  }

  getId() {
    throw new Error("implement me");
  }
}

export class VertKeyIterItem extends KeyIterItem {
  /* All four are filled by init(), which the cachering owner always calls
     before handing the item out. */
  v!: SplineVertex;
  spline!: Spline;
  /* Key into frameset.vertex_animdata -- the eid of the draw-spline vertex
     this path vertex animates. */
  channel!: number; //vertex_animdata key
  frameset!: SplineFrameSet;

  constructor() {
    super();
    this.type = AnimKeyTypes.SPLINE;
  }

  getId() {
    return this.v.eid;
  }

  getFlag() {
    let flag = 0;

    if (this.v.flag & SplineFlags.UI_SELECT) {
      flag |= AnimKeyFlags.SELECT;
    }

    return flag;
  }

  setFlag(flag: number): this {
    if (flag & AnimKeyFlags.SELECT) {
      this.v.flag |= SplineFlags.UI_SELECT;
    } else {
      this.v.flag &= ~SplineFlags.UI_SELECT;
    }

    return this;
  }

  kill() {
    this.frameset.vertex_animdata[this.channel].remove(this.v);
  }

  getTime() {
    return get_vtime(this.v);
  }

  setTime(time: number) {
    if (isNaN(time)) {
      throw new Error("Time was NaN!");
    }

    set_vtime(this.spline, this.v, time);
  }

  init(spline: Spline, v: SplineVertex, vd_eid: number, frameset: SplineFrameSet): this {
    this.spline = spline;
    this.v = v;
    this.channel = vd_eid;
    this.frameset = frameset;
    return this;
  }

  /* NOTE: a destroy() that cleared spline/v used to sit here; nothing ever
     called it -- the cachering recycles items through init() instead. */
}

export class DataPathKeyItem extends VertKeyIterItem {
  path: string;

  constructor(datapath: string) {
    super();

    this.path = datapath;
    throw new Error("implement me");
  }
}

let vkey_cache = util.cachering.fromConstructor(VertKeyIterItem, 32);
//let dpkey_cache = util.cachering.fromConstructor(DataPathKeyItem, 512)

let UEID = 0,
  UTIME = 1,
  UFLAG = 2,
  UX = 3,
  UY = 4,
  UTOT = 5;

export class AnimKeyTool<
  InputSlots extends PropertySlots = PropertySlots,
  OutputSlots extends PropertySlots = PropertySlots,
> extends ToolOp<
  InputSlots & {
    useKeyList: BoolProperty;
    keyList: IntArrayProperty;
  },
  OutputSlots
> {
  /* Flat [eid, time, flag, x, y] records, UTOT wide -- see the U* indices.
     DeleteKeysOp opts out and stores the base class's whole-file snapshot
     here instead. */
  declare _undo: { spline: number[] } | ArrayBuffer | ArrayBufferView | number[];

  constructor() {
    super();
  }

  static tooldef(): ToolDef {
    return {
      inputs: {
        useKeyList: new BoolProperty(),
        keyList   : new IntArrayProperty(), //should be (AnimKeyType, keyId) pairs
      },
    };
  }

  /* Only spline keys exist so far; the other branch below throws. */
  *iterKeys(
    ctx: FullContext,
    useKeyList = this.inputs.useKeyList.getValue()
  ): Generator<VertKeyIterItem> {
    if (useKeyList) {
      let list = this.inputs.keyList.getValue();
      let pathspline = ctx.frameset.pathspline;

      let channelmap: { [eid: number]: number } = {};
      let frameset = ctx.frameset;

      for (let k in frameset.vertex_animdata) {
        let vd = frameset.vertex_animdata[k];

        for (let v of vd.verts) {
          channelmap[v.eid] = parseInt(k);
        }
      }

      for (let i = 0; i < list.length; i += 2) {
        let type = list[i],
          id = list[i + 1];
        if (type === AnimKeyTypes.SPLINE) {
          /* eidmap holds every element kind; a SPLINE key is always a vertex. */
          let elem = pathspline.eidmap[id];
          let v = elem instanceof SplineVertex ? elem : undefined;

          if (!v) {
            console.warn(
              "Error iterating spline animation keys; key could not be found",
              id,
              pathspline
            );
            continue;
          }

          if (!(v.eid in channelmap)) {
            console.error("CORRUPTION ERROR!", v.eid, channelmap);
            continue;
          }

          yield vkey_cache.next().init(pathspline, v, channelmap[v.eid], frameset);
        } else {
          throw new Error("implement me!");
        }
      }
    } else {
      let frameset = ctx.frameset;
      let spline = frameset.spline; //not path spline
      let pathspline = frameset.pathspline;
      let templist = [];

      for (var i2 = 0; i2 < 2; i2++) {
        let list = i2 ? spline.handles : spline.verts;

        for (let v of list.selected.editable(ctx)) {
          if (!(v.eid in frameset.vertex_animdata)) {
            continue;
          }

          //console.log(v, v.eid);
          let vd = frameset.vertex_animdata[v.eid];

          templist.length = 0;
          for (let v2 of vd.verts) {
            templist.push(v2);
          }

          for (let v2 of templist) {
            yield vkey_cache.next().init(pathspline, v2, v.eid, frameset);
          }
        }
      }
    }
  }

  undoPre(ctx: FullContext) {
    this.undo_pre(ctx);
  }

  undo_pre(ctx: FullContext) {
    let spline: number[] = [];

    let _undo = (this._undo = {
      spline: spline,
    });

    let vset = new Set<number>();

    for (let i = 0; i < 2; i++) {
      for (let key of this.iterKeys(ctx, !!i)) {
        if (key.type === AnimKeyTypes.SPLINE) {
          if (vset.has(key.v.eid)) {
            continue;
          }

          vset.add(key.v.eid);

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
  }

  undo(ctx: FullContext) {
    if (!("spline" in this._undo)) {
      /* DeleteKeysOp's snapshot; it overrides undo() and never lands here. */
      return;
    }

    let list = this._undo.spline;
    let spline = ctx.frameset.pathspline;

    for (let i = 0; i < list.length; i += UTOT) {
      let eid = list[i],
        time = list[i + 1],
        flag = list[i + 2];
      let x = list[i + 3],
        y = list[i + 4];

      let elem = spline.eidmap[eid];
      let v = elem instanceof SplineVertex ? elem : undefined;

      if (!v) {
        console.warn("EEK! Misssing vertex/handle in AnimKeyTool.undo!");
        continue;
      }

      let do_update = Math.abs(x - v[0]) > 0.001 || Math.abs(y - v[1]) > 0.001;

      v.flag = flag;
      set_vtime(spline, v, time);
      v[0] = x;
      v[1] = y;

      if (do_update) {
        v.flag |= SplineFlags.UPDATE;
      }
    }
  }

  exec(ctx: FullContext) {
    //ctx.frameset.pathspline.regen_render();
    //ctx.frameset.spline.regen_render();
    ctx.frameset.spline.updateGen++; //signal dopesheet to draw
    window.redraw_viewport();
  }
}

export const SelModes = {
  AUTO: 0,
  ADD : 1,
  SUB : 2,
};

export class ToggleSelectAll extends AnimKeyTool<{ mode: EnumProperty }> {
  constructor() {
    super();
  }

  static tooldef() {
    return {
      uiname  : "Toggle Select All (Keys)",
      toolpath: "animkeys.toggle_select_all()",
      inputs: ToolOp.inherit({
        mode: new EnumProperty("AUTO", SelModes),
      }),
    };
  }

  exec(ctx: FullContext) {
    console.log("Anim Key Toggle Select Tool!");

    let mode = this.inputs.mode.getValue();
    let count = 0;

    if (mode === SelModes.AUTO) {
      mode = SelModes.ADD;

      for (let key of this.iterKeys(ctx)) {
        //        console.log(key);

        let flag = key.getFlag();
        if (flag & AnimKeyFlags.SELECT) {
          mode = SelModes.SUB;
          break;
        }
        //count += (flag & AnimKeyTypes.SELECT) ? 1 : -1
      }

      //mode = count > 0 ? SelModes.SUB : SelModes.ADD;
    }

    console.log("mode, count", mode, count);

    for (let key of this.iterKeys(ctx)) {
      if (mode === SelModes.ADD) {
        key.setFlag(key.getFlag() | AnimKeyFlags.SELECT);
      } else {
        key.setFlag(key.getFlag() & ~AnimKeyFlags.SELECT);
      }
    }

    super.exec(ctx);
  }

  undo(ctx: FullContext) {
    super.undo(ctx);

    if (ctx.dopesheet) {
      ctx.dopesheet.updateKeyPositions();
    }
  }
}

export class NextPrevKeyFrameOp extends AnimKeyTool<{ dir: IntProperty }, { frame: IntProperty }> {
  /* scene.time before the jump; this op only moves the playhead. */
  _undo_time!: number;

  constructor() {
    super();
  }

  static tooldef() {
    return {
      uiname  : "Next/Prev Keyframe",
      toolpath: "anim.nextprev",
      icon    : Icons.ANIM_NEXT,
      inputs: ToolOp.inherit({
        dir: new IntProperty(1),
      }),
      outputs: ToolOp.inherit({
        frame: new IntProperty(0),
      }),
    };
  }

  exec(ctx: FullContext) {
    let dir = this.inputs.dir.getValue();
    let scene = ctx.scene;
    let time = scene.time;

    let mint: number | undefined, minf: number | undefined;

    console.log("Next Keyframe", time);

    for (let key of this.iterKeys(ctx)) {
      let t = key.getTime();

      console.log("  ", t);

      if (dir > 0 && t > time && (mint === undefined || t - time < mint)) {
        mint = t - time;
        minf = t;
      } else if (dir < 0 && t < time && (mint === undefined || time - t < mint)) {
        mint = time - t;
        minf = t;
      }
    }

    console.log(minf, mint, time);

    if (minf !== undefined) {
      scene.change_time(ctx, minf);
      window.redraw_viewport();
    }
  }

  undoPre(ctx: FullContext) {
    this.undo_pre(ctx);
  }

  static canRun(ctx: FullContext): boolean {
    return !!ctx.scene;
  }

  /*we don't need to use parent classes's undo implementation
    as we're only changing time*/
  undo_pre(ctx: FullContext) {
    this._undo_time = ctx.scene.time;

    //super.undo_pre(ctx);
    //this._undo_time = ctx.scene.time;
  }

  undo(ctx: FullContext) {
    if (ctx.scene.time === this._undo_time) {
      return;
    }

    /* NOTE: this called change_time(this._undo_time) -- change_time takes
       (ctx, time), so the time arrived as the context and `time` came through
       undefined, which change_time's isNaN(time) guard returns on.  Undoing
       this op has therefore never restored the time; the call is spelled out
       here so it keeps doing nothing. */
    ctx.scene.change_time(ctx, NaN);
    window.redraw_viewport();
  }
}

export class MoveKeyFramesOp extends AnimKeyTool<{ delta: FloatProperty }> {
  /* True until the first modal mousemove seeds start_mpos/transdata. */
  first: boolean;
  last_mpos: Vector2;
  start_mpos: Vector2;
  sum: number;
  /* Each selected key's time as of the drag start, in iterKeys() order. */
  transdata: number[];

  constructor() {
    super();

    this.first = true;
    this.last_mpos = new Vector2();
    this.start_mpos = new Vector2();
    this.sum = 0.0;
    this.transdata = [];
  }

  on_mousemove(e: MouseEvent) {
    let ctx = this.modal_ctx;

    if (this.first) {
      this.last_mpos[0] = e.x;
      this.last_mpos[1] = e.y;

      this.start_mpos[0] = e.x;
      this.start_mpos[1] = e.y;

      this.first = false;
      this.sum = 0.0;

      this.transdata.length = 0;

      for (let key of this.iterKeys(ctx)) {
        if (!(key.getFlag() & AnimKeyFlags.SELECT)) {
          continue;
        }

        this.transdata.push(key.getTime());
      }

      return;
    }

    let dx = e.x - this.last_mpos[0],
      dy = e.y - this.last_mpos[1];
    let dopesheet = ctx.dopesheet;

    dx = e.x - this.start_mpos[0];

    if (dopesheet) {
      let boxsize = dopesheet.boxSize;

      dx /= dopesheet.zoom * dopesheet.timescale * boxsize;
    } else {
      dx *= 0.1;
      console.error("MISSING DOPESHEET");
    }

    if (dx === undefined) {
      throw new Error("eek!");
    }

    this.inputs.delta.setValue(dx);

    let i = 0;
    let td = this.transdata;

    for (let key of this.iterKeys(ctx)) {
      if (!(key.getFlag() & AnimKeyFlags.SELECT)) {
        continue;
      }

      key.setTime(td[i]);
      i++;
    }

    this.exec(ctx);

    if (dopesheet) {
      dopesheet.updateKeyPositions();
    }

    console.log(dx, dy, dopesheet !== undefined);

    this.last_mpos[0] = e.x;
    this.last_mpos[1] = e.y;
  }

  exec(ctx: FullContext, dx_override?: number) {
    let dx = this.inputs.delta.getValue();

    if (dx_override) {
      dx = dx_override;
    }

    for (let key of this.iterKeys(ctx)) {
      if (!(key.getFlag() & AnimKeyFlags.SELECT)) {
        continue;
      }

      let time = key.getTime();
      key.setTime(Math.floor(time + dx + 0.5));
    }

    ctx.frameset.pathspline.flagUpdateVertTime();
  }

  undo(ctx: FullContext) {
    super.undo(ctx);

    if (ctx.dopesheet) {
      ctx.dopesheet.updateKeyPositions();
    }
  }

  on_keydown(e: KeyboardEvent) {
    if (e.keyCode === 27) {
      this.end_modal();
    }
  }

  on_mousedown(e: MouseEvent) {
    this.end_modal();
  }

  on_mouseup(e: MouseEvent) {
    this.end_modal();
  }

  static tooldef() {
    return {
      name    : "Move Keyframes",
      toolpath: "anim.movekeys",
      is_modal: true,
      inputs: ToolOp.inherit({
        delta: new FloatProperty(),
      }),
    };
  }
}

export const SelModes2 = {
  UNIQUE: 0,
  ADD   : 1,
  SUB   : 2,
};

export class SelectKeysOp extends AnimKeyTool<{ mode: EnumProperty }> {
  constructor() {
    super();

    this.inputs.useKeyList.setValue(true);
  }

  static tooldef() {
    return {
      name    : "Select Keyframes",
      toolpath: "anim.select",
      inputs: ToolOp.inherit({
        mode: new EnumProperty("UNIQUE", SelModes2),
      }),
    };
  }

  exec(ctx: FullContext) {
    let mode = this.inputs.mode.getValue();

    console.log("select mode:", mode);

    if (mode === SelModes2.UNIQUE) {
      for (let key of this.iterKeys(ctx, false)) {
        key.setSelect(false);
      }
    }

    let state = mode === SelModes2.UNIQUE || mode === SelModes2.ADD;

    for (let key of this.iterKeys(ctx)) {
      key.setSelect(state);
    }

    ctx.frameset.pathspline.flagUpdateVertTime();
  }

  undo(ctx: FullContext) {
    super.undo(ctx);

    ctx.frameset.pathspline.flagUpdateVertTime();

    if (ctx.dopesheet) {
      ctx.dopesheet.updateKeyPositions();
      ctx.dopesheet.redraw();
    }
  }
}

export class DeleteKeysOp extends AnimKeyTool {
  constructor() {
    super();
  }

  static tooldef() {
    return {
      name    : "Delete Keyframes",
      toolpath: "anim.delete_keys",
      inputs  : ToolOp.inherit({}),
    };
  }

  exec(ctx: FullContext) {
    console.warn("Deleting keyframes!");

    for (let key of this.iterKeys(ctx)) {
      if (key.getFlag() & AnimKeyFlags.SELECT) {
        key.kill();
      }
    }

    ctx.frameset.rationalize_vdata_layers();

    ctx.frameset.spline.flagUpdateKeyframes();
    ctx.frameset.pathspline.flagUpdateVertTime();
  }

  /* NOTE: both of these called ToolOp.prototype.undo_pre, which is only an
     optional declaration on the base -- no such function exists, so every run
     of this tool threw a TypeError before exec().  They do what the base
     class's undoPre() does, per the comment in undo() below. */
  undo_pre(ctx: FullContext) {
    this._undo = ctx.state.create_undo_file();
  }

  undoPre(ctx: FullContext) {
    this.undo_pre(ctx);
  }

  undo(ctx: FullContext) {
    ToolOp.prototype.undo.call(this, ctx);
    //super.undo(ctx); //use the "save everything" undo implementation

    ctx.frameset.pathspline.flagUpdateVertTime();
    ctx.frameset.spline.flagUpdateKeyframes();

    if (ctx.dopesheet) {
      ctx.dopesheet.updateKeyPositions();
      ctx.dopesheet.redraw();
    }
  }
}
