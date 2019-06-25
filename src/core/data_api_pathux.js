import {ModelInterface} from '../path.ux/scripts/controller.js';

import {ToolOpAbstract, ToolOp, ToolMacro} from 'toolops_api';
import {ToolProperty, PropTypes} from 'toolprops';

export var toolmap = {};
export var toollist = [];

import {DataPathTypes} from "./data_api_base";

let resolvepath_rets = new cachering(() => {return {
  parent : undefined,
  obj : undefined,
  key : undefined,
  value : undefined,
  prop : undefined,
  struct : undefined,
  mass_set : undefined,
}}, 32);

export function register_toolops() {
  function isTool(t) {
    if (t.tooldef === undefined)
      return false;
    if (t === ToolOpAbstract || t === ToolOp || t === ToolMacro)
      return false;

    let p = t, lastp;

    while (p && p.prototype && p.prototype.__proto__ && p !== lastp) {
      lastp = p;
      p = p.prototype.__proto__.constructor;

      if (p !== undefined && p === ToolOpAbstract)
        return true;
    }

    return false;
  }

  for (let cls of defined_classes) {
    if (!isTool(cls))
      continue;

    let def = cls.tooldef();

    if (def.apiname === undefined) {
      console.warn(cls.name + ": tooldef is missing apiname member (abstract class?)");
      continue;
    }

    toolmap[def.apiname] = cls;
    toollist.push(cls);
  }
}

export class PathUXInterface extends ModelInterface {
  constructor(api, ctx=undefined) {
    super();

    this.prefix = "";
    this.api = api;
    this.ctx = ctx;
  }

  setContext(ctx) {
    this.ctx = ctx;
  }

  getObject(ctx, path) {
    return this.api.get_object(ctx, path);
  }

  getToolDef(path) {
    return this.api.get_opclass(this.ctx, path).tooldef();
  }

  //TODO: work out and document mass set interface for path.ux
  buildMassSetPaths(ctx, listpath, subpath, value, filterstr) {
    return this.api.build_mass_set_paths(ctx, listpath, subpath, value, filterstr);
  }

  massSetProp(ctx, listpath, subpath, value, filterstr) {
    return this.api.mass_set_prop(ctx, listpath, subpath, value, filterstr);
  }

  onFrameChange(ctx, newtime) {
    return this.api.on_frame_change(ctx, newtime);
  }

  createTool(ctx, path, inputs={}, constructor_argument=undefined) {
    let tool = this.api.get_op(this.ctx, path);

    for (let k in inputs) {
      if (!(k in tool.inputs)) {
        console.warn("Unknown input", k, "for tool", tool);
        continue;
      }

      let v = inputs[k];
      if (v instanceof ToolProperty) {
        v = v.data;
      }

      tool.inputs[k].set_data(v);
    }

    return tool;
  }


  setAnimPathKey(ctx, owner, path, time) {
    return this.api.key_animpath(ctx, owner, path, time);
  }

  getObject(ctx, path) {
    return this.api.get_object(ctx, path);
  }

  //returns tool class, or undefined if one cannot be found for path
  parseToolPath(path) {
    return this.api.get_opclass(this.ctx, path);
  }

  execTool(ctx, path_or_toolop, inputs={}, constructor_argument=undefined) {
    return new Promise((accept, reject) => {
      let tool;

      if (typeof path_or_toolop == "object") {
        tool = path_or_toolop;
      } else {
        try {
          tool = this.createTool(ctx, path_or_toolop, inputs, constructor_argument);
        } catch (error) {
          reject(error);
          return;
        }
      }

      //give client a chance to change tool instance directly
      accept(tool);

      //execute
      g_app_state.toolstack.execTool(tool);
    });
  }

  static toolRegistered(cls) {
    return cls.tooldef().apiname in toolmap;
  }

  static registerTool(cls) {
    let tdef = cls.tooldef();

    if (tdef.apiname in toolmap) {
      console.log(cls);
      console.warn(tdef + " is already registered");
      return;
    }

    toolmap[tdef.apiname] = cls;
    toollist.push(cls);
  }


  /*returns {
    parent : [parent object of property path]
    obj : [object owning property key]
    key : [property key]
    value : [value of property]
    prop : [optional toolprop.ToolProperty representing the property definition]
    struct : [optional datastruct representing the type, if value is an object]
    mass_set : mass setter string, if controller implementation supports it
  }
  */
  resolvePath(ctx, path) {
    let rp = this.api.resolve_path_intern(ctx, path);

    if (rp === undefined || rp[0] === undefined) {
      return undefined;
    }

    let ret = resolvepath_rets.next();

    ret.value = this.api.get_prop(ctx, path);
    ret.mass_set = rp[3];
    ret.key = rp[0].path;

    //XXX data_api doesn't support returning parents of owning objects
    ret.parent = undefined;

    ret.obj = undefined;
    ret.prop = undefined;
    ret.struct = undefined;

    if (rp[4]) {
      ret.obj = this.api.evaluate(this.ctx, rp[4]);
    }

    if (rp[0].type == DataPathTypes.PROP) {
      ret.prop = rp[0].data;
    } else if (rp[0].type == DataPathTypes.STRUCT) {
      ret.struct = rp[0].data;
    }

    return ret;
  }

  setValue(ctx, path, val) {
    return this.api.set_prop(ctx, path, val);  }

  getValue(ctx, path) {
    return this.api.get_prop(ctx, path);
  }
}

