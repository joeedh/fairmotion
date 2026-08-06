import {util, nstructjs, ToolProperty, PropFlags, PropTypes, ToolMacro, UndoFlags} from '../path.ux/scripts/pathux.js';
import * as pathux from '../path.ux/scripts/pathux.js';
import type {FullContext} from './context.js';
import type {SavedContext} from './AppState.js';
import type {drawline} from '../editors/viewport/view2d.js';

export {
  ToolProperty, PropFlags, PropTypes, ToolMacro,
  UndoFlags, color2css, css2color
} from '../path.ux/scripts/pathux.js';

/*
 * What a ToolOp subclass's static tooldef() returns. `toolpath` is what the
 * hotkey and menu strings are parsed against; without one the tool is
 * unreachable and init_toolop_structs() skips it.
 */
export interface ToolDef extends pathux.ToolDef {
  /* Fairmotion's ToolDef carries a `name` that path.ux's does not.  Like
     everything path.ux declares, it is optional: abstract base tools define
     only inputs, and init_toolop_structs() skips any class whose tooldef()
     lacks a toolpath. */
  name?: string;
  /* Legacy spelling of toolpath. _getFinalToolDef() folds it into toolpath,
     and UserSettings keys tool settings off whichever one is present. */
  apiname?: string;
}


/*
 * What a tool stores in `_undo`. The default undoPre() below takes a whole-file
 * snapshot (a DataView); a tool that supplies its own undo_pre() stores
 * whatever it needs instead -- an eid->value map, a saved time, a list of ids.
 * Subclasses re-declare `_undo` with their own precise type; this union is only
 * what the base class is willing to hold.
 */
export type UndoData = ArrayBuffer | object | number | number[];

/*
 * Every tool in fairmotion runs against the app's own context, never a bare
 * ContextLike, so the context type arguments are pinned here once instead of
 * at each of the ~200 subclasses. Subclasses that declare inputs/outputs thread
 * the slot parameters through, per path.ux's inheritance idiom:
 *   class Foo<I extends PropertySlots, O extends PropertySlots>
 *     extends ToolOp<I & {x: FloatProperty}, O> {}
 */
export class ToolOp<
  InputSlots extends pathux.PropertySlots = pathux.PropertySlots,
  OutputSlots extends pathux.PropertySlots = pathux.PropertySlots,
> extends pathux.ToolOp<InputSlots, OutputSlots, FullContext, FullContext> {
  static STRUCT: string;

  drawlines: drawline[];

  /* Like uiname/toolpath/icon on path.ux's ToolOp, this is stamped onto the
     instance from tooldef() by the base constructor; fairmotion's ToolDef
     carries a `name` where path.ux's does not. */
  name?: string;

  /* The whole-file undo snapshot, taken by the default undoPre(). Absent for
     tools that supply their own undo_pre(), which store their own payload
     here and override undo() to read it back. */
  _undo?: UndoData;
  _touch_cancelable = false;
  _touch_cancel_callback?: () => void;

  /* Position in ToolStack, or -1 before the tool has been pushed. Written by
     ToolStack.execTool() and read back by reexec_tool(). */
  stack_index: int = -1;

  /* The context this tool ran under, frozen at execution time so redo can put
     it back. Written by ToolStack; the STRUCT script saves it. */
  saved_context?: SavedContext;

  /* Set by subclasses that replace the whole-file undo with their own.
     Declared method-style because every override is a method. */
  undo_pre?(ctx: FullContext): void;

  /* Tools flagged USE_TOOL_CONTEXT carry their own context rather than taking
     the one execTool() was handed. */
  ctx?: FullContext;

  /* A modal tool gets two locked contexts: modal_ctx drives drawing and
     modal_tctx is what gets saved for undo. path.ux declares modal_ctx
     optional -- it clears it in modalEnd() -- but it is only ever read from
     inside a modal run, where pushModal() has already set it. */
  declare modal_ctx: FullContext;
  modal_tctx?: FullContext;

  /* Cached data API struct built by ToolStack.gen_tool_datastruct(). */
  apistruct?: pathux.DataStruct;

  /* Set on macro members so reexec_tool() can walk up to the outermost tool. */
  parent?: ToolOp;

  constructor() {
    super();

    this.drawlines = [];
  }

  undoPre(ctx: FullContext): void {
    if (this.undo_pre) {
      return this.undo_pre(ctx);
    } else {
      this._undo = ctx.state.create_undo_file();
    }
  }

  undo(ctx: FullContext): void {
    /* Only tools using the default undoPre() above reach this, and that
       stores the whole-file DataView; the rest override undo(). */
    if (this._undo instanceof DataView) {
      ctx.state.load_undo_file(this._undo);
      window.redraw_viewport();
    }
  }

  start_modal(ctx: FullContext): void | Promise<unknown> {
    return this.modalStart(ctx);
  }

  end_modal(cancelled = false) {
    return this.modalEnd(cancelled);
  }

  _start_modal(ctx: FullContext): void {
    //do nothing
  }

  new_drawline(v1: Vector2 | number[], v2: Vector2 | number[], color?: number[],
               line_width = 2) {
    var dl = this.modal_ctx.view2d.make_drawline(v1, v2, undefined, color, line_width);

    this.drawlines.push(dl);

    return dl;
  }

  reset_drawlines(ctx: FullContext = this.modal_ctx): void {
    var view2d = ctx.view2d;

    for (var dl of this.drawlines) {
      view2d.kill_drawline(dl);
    }

    this.drawlines.length = 0;
  }

  exec_pre(ctx: FullContext) {
    return this.execPre(ctx);
  }

  exec_post(ctx: FullContext) {
    return this.execPost(ctx);
  }

  touchCancelable(callback: () => void): void {
    this._touch_cancelable = true;
    this._touch_cancel_callback = callback;
  }

  /*
   * The toolpath parser hands every argument through as a string. A few
   * sentinel strings mean "read this from the context at invoke time"; they
   * are resolved here, before the properties get to see them.
   */
  static invoke(ctx: FullContext, args: {[k: string]: unknown}): ToolOp {
    function geteid(v: {eid: number} | undefined): number {
      return !v ? -1 : v.eid;
    }

    for (let k in args) {
      let v = args[k];

      if (v === 'selectmode') {
        args[k] = ctx.selectmode;
      }

      if (v === 'active_vertex' && ctx.spline) {
        args[k] = geteid(ctx.spline.verts.active);
      }

      if (v === 'active_handle' && ctx.spline) {
        args[k] = geteid(ctx.spline.handles.active);
      }

      /* NOTE: this read ctx.spline.edges, which does not exist -- a TypeError
         on any toolpath spelling an argument 'active_edge'. */
      if (v === 'active_edge' && ctx.spline) {
        args[k] = geteid(ctx.spline.segments.active);
      }

      if (v === 'active_face' && ctx.spline) {
        args[k] = geteid(ctx.spline.faces.active);
      }
    }

    console.error("INVOKE", args);

    /* path.ux types its invoke() as returning the abstract ToolOpAny. */
    return super.invoke(ctx, args) as ToolOp;
  }

  static inherit_inputs(arg: {[k: string]: ToolProperty}) {
    return ToolOp.inherit(arg);
  }

  static inherit_outputs(arg: {[k: string]: ToolProperty}) {
    return ToolOp.inherit(arg);
  }

  static _getFinalToolDef() {
    let tdef = super._getFinalToolDef();

    /* path.ux's resolved def types every extra key as unknown; `apiname` is
       always the string a fairmotion tooldef() put there. */
    tdef.toolpath = tdef.toolpath || (tdef.apiname as string | undefined);

    return tdef;
  }
}

export const ToolOpAbstract = pathux.ToolOp;

//this is a bitmask!!
export const ModalStates = {
  TRANSFORMING: 1,
  PLAYING     : 2
};

export const ToolFlags = {
  PRIVATE                   : 1,
  HIDE_TITLE_IN_LAST_BUTTONS: 1,
  USE_PARTIAL_UNDO          : 2,
  USE_DEFAULT_INPUT         : 4,
  USE_REPEAT_FUNCTION       : 8,
  USE_TOOL_CONTEXT          : 16 //will use context in tool.ctx instead of providing one
};

//generates default toolop STRUCTs/fromSTRUCTS, as needed
//genereated STRUCT/fromSTRUCT should be identical with
//ToolOp.STRUCT/fromSTRUCT, except for the change in class name.
window.init_toolop_structs = function (): void {
  for (let i = 0; i < window.defined_classes.length; i++) {
    //only consider classes that inherit from ToolOpAbstract
    let cls = window.defined_classes[i];
    let ok = false;
    let is_toolop = false;

    let parent = cls.prototype.__proto__.constructor;

    while (parent) {
      if (parent === ToolOpAbstract) {
        ok = true;
      } else if (parent === ToolOp) {
        ok = true;
        is_toolop = true;
        break;
      }

      parent = parent.prototype.__proto__;

      if (!parent)
        break;

      parent = parent.constructor;

      if (!parent || parent === Object)
        break;
    }

    //ignore base classes whose tooldefs() lack .toolpath
    ok = ok && cls.tooldef !== ToolOp.tooldef;
    ok = !!(ok && cls.tooldef && cls.tooldef().toolpath);
    ok = ok || cls === ToolOp;

    if (!ok) continue;

    //console.log("-->", cls.name);

    /* NOTE: an `if (!Object.hasOwnProperty(cls, "STRUCT"))` wrapped this block.
       hasOwnProperty takes one argument and was asked of Object rather than of
       cls, so it was always false and the body always ran.  Kept. */
    {
      cls.STRUCT = cls.name + " {" + `
        flag    : int;
        inputs  : iterkeys(k, PropPair) | new PropPair(k, obj.inputs[k]);
        outputs : iterkeys(k, PropPair) | new PropPair(k, obj.outputs[k]);
      `
      if (is_toolop)
        cls.STRUCT += "    saved_context  : SavedContext | obj.get_saved_context();\n";

      cls.STRUCT += "  }";

      if (cls === ToolOp) {
        nstructjs.register(cls);
      }
    }

    //if (!cls.tooldef().toolpath) {
    //  console.error("Missing toolpath", cls);
    //}

    //pathux does this for us now
    //ToolOp.register(cls);
  }
};

//old compatibility function

/* A shallow, writable copy of a DOM event: the same members, minus their
   readonly-ness, so callers can rewrite x/y/button. `prototype` and `original`
   both point back at the event it was copied from. */
export type PatchedEvent<T extends Event> = {
  -readonly [K in keyof T]: T[K];
} & {prototype: T; original: T};

//makes e.x/e.y relative to dom,
//and also flips to origin at bottom left instead of top left
export function patchMouseEvent<T extends MouseEvent>(e: T, dom: HTMLElement): PatchedEvent<T> {
  dom = g_app_state.screen; //dom === undefined ? g_app_state.screen : dom;

  /* Every other member arrives through the copy loop below, which is dynamic
     by nature -- hence the one cast. */
  let e2 = {prototype: e, original: e} as PatchedEvent<T>;

  let keys: (string | symbol)[] = Object.getOwnPropertyNames(e);
  keys = keys.concat(Object.getOwnPropertySymbols(e));

  for (let k in e) {
    keys.push(k);
  }

  for (let k of keys) {
    try {
      let v = Reflect.get(e, k);

      if (typeof v === "function") {
        v = v.bind(e);
      }

      Reflect.set(e2, k, v);
    } catch (error) {
      console.log("failed to set property", k);
      continue;
    }
  }

  return e2;
}

/* One entry of a ToolOp's inputs/outputs as it appears on disk. The STRUCT
   script below writes the key alongside an abstract(ToolProperty). */
export class PropPair {
  static STRUCT: string;

  key: string;
  value: ToolProperty;

  constructor(key: string, value: ToolProperty) {
    this.key = key;
    this.value = value;
  }
}

window.PropPair = PropPair;

PropPair.STRUCT = `
  PropPair {
    key   : string;
    value : abstract(ToolProperty);
  }
`;
nstructjs.register(PropPair);
