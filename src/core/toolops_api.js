import {util, nstructjs, ToolProperty, PropFlags, PropTypes, ToolMacro, UndoFlags} from '../path.ux/scripts/pathux.js';
import * as pathux from '../path.ux/scripts/pathux.js';

export {
  ToolProperty, PropFlags, PropTypes, ToolMacro,
  UndoFlags, color2css, css2color
} from '../path.ux/scripts/pathux.js';

export class ToolDef {
  inputs: Object
  outputs: Object
  flag: number
  name: string
  uiname: string
  icon: number
  toolpath: number
  is_modal: boolean
  undoflag: number;
}


export class ToolOp extends pathux.ToolOp {
  constructor() {
    super();
  }

  undoPre(ctx) {
    if (this.undo_pre) {
      return this.undo_pre(ctx);
    } else {
      this._undo = ctx.state.create_undo_file();
    }
  }

  undo(ctx) {
    if (this._undo) {
      ctx.state.load_undo_file(this._undo);
      window.redraw_viewport();
    }
  }

  start_modal(ctx) {
    return this.modalStart(ctx);
  }

  end_modal(cancelled) {
    return this.modalEnd(cancelled);
  }

  _start_modal(ctx) {
    //do nothing
  }

  reset_drawlines() {
    this.resetTempGeom();
  }

  new_drawline(a, b, clr) {
    if (clr instanceof Array || clr instanceof Float32Array) {
      clr = color2css(clr);
    }

    this.makeTempLine(a, b, clr);

    return {
      v1  : new Vector2(a),
      v2  : new Vector2(b),
      clr : css2color(clr)
    };
  }

  exec_pre(ctx) {
    return this.execPre(ctx);
  }

  exec_post(ctx) {
    return this.execPost(ctx);
  }

  touchCancelable(callback) {
    this._touch_cancelable = true;
    this._touch_cancel_callback = callback;
  }

  static invoke(ctx, args) {
    function geteid(v) {
      return !v ? -1 : v.eid;
    }

    for (let k in args) {
      let v = args[k];

      if (k === 'selectmode') {
        args[k] = ctx.selectmode;
      }

      if (v === 'active_vertex' && ctx.spline) {
        args[k] = geteid(ctx.spline.verts.active);
      }

      if (v === 'active_handle' && ctx.spline) {
        args[k] = geteid(ctx.spline.handles.active);
      }

      if (v === 'active_edge' && ctx.spline) {
        args[k] = geteid(ctx.spline.edges.active);
      }

      if (v === 'active_face' && ctx.spline) {
        args[k] = geteid(ctx.spline.faces.active);
      }
    }

    return super.invoke(ctx, args);
  }

  static inherit_inputs(arg) {
    return ToolOp.inherit(arg);
  }

  static inherit_outputs(arg) {
    return ToolOp.inherit(arg);
  }

  static _getFinalToolDef() {
    let tdef = super._getFinalToolDef();

    tdef.toolpath = tdef.toolpath || tdef.apiname;

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
window.init_toolop_structs = function () {
  global
  defined_classes;

  for (let i = 0; i < defined_classes.length; i++) {
    //only consider classes that inherit from ToolOpAbstract
    let cls = defined_classes[i];
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

    if (!ok) continue;

    //console.log("-->", cls.name);

    if (!Object.hasOwnProperty(cls, "STRUCT")) {
      cls.STRUCT = cls.name + " {" + `
        flag    : int;
        inputs  : iterkeys(k, PropPair) | new PropPair(k, obj.inputs[k]);
        outputs : iterkeys(k, PropPair) | new PropPair(k, obj.outputs[k]);
      `
      if (is_toolop)
        cls.STRUCT += "    saved_context  : SavedContext | obj.get_saved_context();\n";

      cls.STRUCT += "  }";

      nstructjs.register(cls);
    }

    ToolOp.register(cls);
  }
};

//old compatibility function

//makes e.x/e.y relative to dom,
//and also flips to origin at bottom left instead of top left
export function patchMouseEvent(e: MouseEvent, dom: HTMLElement) {
  dom = g_app_state.screen; //dom === undefined ? g_app_state.screen : dom;

  let e2 = {
    prototype: e
  };

  let keys = Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e));
  for (let k in e) {
    keys.push(k);
  }

  for (let k of keys) {
    try {
      e2[k] = e[k];
    } catch (error) {
      console.log("failed to set property", k);
      continue;
    }

    if (typeof e2[k] == "function") {
      e2[k] = e2[k].bind(e);
    }
  }

  e2.original = e;

  return e2;
}

export class PropPair {
  constructor(key, value) {
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
