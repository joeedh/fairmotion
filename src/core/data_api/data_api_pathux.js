import {ModelInterface, DataPathError} from '../../path.ux/scripts/path-controller/controller.js';

import {ToolOpAbstract, ToolOp, ToolMacro} from '../toolops_api.js';
import {ToolProperty, PropTypes} from '../toolprops.js';

export var toolmap = {};
export var toollist = [];

import {DataPathTypes, DataAPIError} from "./data_api_base.js";
import {UIBase} from '../../path.ux/scripts/core/ui_base.js';
import {Editor} from '../../editors/editor_base.js';

import {ToolKeyHandler} from "../../editors/events.js";
import {HotKey} from '../../path.ux/scripts/util/simple_events.js';

let resolvepath_rets = new cachering(() => {return {
  parent : undefined,
  obj : undefined,
  key : undefined,
  subkey : undefined,
  value : undefined,
  prop : undefined,
  struct : undefined,
  mass_set : undefined,
}}, 32);

export function register_toolops() {
  function isTool(t : function) {
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
      //console.warn(cls.name + ": tooldef is missing apiname member (abstract class?)");
      //continue;
    }

    if (def.apiname)
      toolmap[def.apiname] = cls;
    if (def.toolpath)
      toolmap[def.toolpath] = cls

    toollist.push(cls);
  }
}

export class PathUXInterface extends ModelInterface {
  prefix : string;

  constructor(api : DataAPI, ctx=undefined) {
    super();

    this.prefix = "";
    this.api = api;
    this.ctx = ctx;
  }

  _getToolHotkey(screen : FairmotionScreen, toolstring : string) {
    if (!screen) {
      return "";
    }

    let ctx = this.ctx;
    let ret;

    function processKeymap(keymap : KeyMap) {
      for (let k of keymap) {
        let v = keymap.get(k);

        if (v instanceof ToolKeyHandler && v.tool === toolstring) {
          //console.log("found tool!", v);
          let ws = k.split("-")
          let s = "";
          let i = 0;

          for (let w of ws) {
            w = w[0].toUpperCase() + w.slice(1, w.length).toLowerCase();
            if (i > 0) {
              s += " + ";
            }

            s += w;
            i++;
          }

          return s;
        } else if (v instanceof HotKey && v.action === toolstring) {
          return v.buildString();
        } else if (k instanceof HotKey && k.action === toolstring) {
          return k.buildString();
        }
      }
    }

    for (let sarea of screen.sareas) {
      for (let keymap of sarea.area.getKeyMaps()) {
        ret = processKeymap(keymap);

        if (ret) {
          return ret;
        }
      }
    }

    if (ret === undefined && screen.keymap !== undefined) {
      ret = processKeymap(screen.keymap);
    }

    return ret;
  }

  setContext(ctx : FullContext) {
    this.ctx = ctx;
  }

  getObject(ctx, path : string) {
    return this.api.get_object(ctx, path);
  }

  getToolDef(path : string) {
    let uiname = undefined;
    let hotkey = undefined;

    if (path.search(/\)\|/) > 0) {
      path = path.split("|");

      uiname = path[1].trim();

      if (path.length > 1) {
        hotkey = path[2].trim();
      }

      path = path[0].trim();
    }

    let ret = this.api.get_opclass(this.ctx, path);
    if (ret === undefined) {
      throw new DataAPIError("bad toolop path", path);
    }

    ret = ret.tooldef();
    ret = Object.assign({}, ret);

    ret.hotkey = hotkey ? hotkey : this._getToolHotkey(this.ctx.screen, path);
    ret.uiname = uiname ? uiname : ret.uiname;

    return ret;
  }

  getToolPathHotkey(ctx : FullContext, path : string) {
    return this.getToolDef(path).hotkey;
    //return this._getToolHotkey(this.ctx.screen, path);
  }

  //TODO: work out and document mass set interface for path.ux

  buildMassSetPaths(ctx, listpath, subpath, value, filterstr) {
    return this.api.build_mass_set_paths(ctx, listpath, subpath, value, filterstr);
  }

  /** takes a mass_set_path and returns an array of individual paths */
  resolveMassSetPaths(ctx, mass_set_path) {
    if (!ctx || !mass_set_path || typeof mass_set_path !== "string") {
      throw new Error("invalid call to resolveMassSetPaths");
    }

    let path = mass_set_path.trim();
    let filter, listpath, subpath;

    let start = path.search("{");

    if (start < 0) {
      throw new Error("invalid mass set path in resolveMassSetPaths " + path);
    }

    let end = path.slice(start, path.end).search("}") + start;

    if (end < 0) {
      throw new Error("invalid mass set path in resolveMassSetPaths " + path);
    }

    filter = path.slice(start + 1, end).trim();
    listpath = path.slice(0, start).trim();
    subpath = path.slice(end + 2, path.length).trim();

    return this.api.build_mass_set_paths(ctx, listpath, subpath, undefined, filter);
  }

  massSetProp(ctx : FullContext, mass_set_path : string, value : boolean) {
    //let rdef = this.resolvePath(ctx, path);
    let path = mass_set_path;

    let i1 = path.search(/\{/);
    let i2 = path.search(/\}/);
    let filterpath = path.slice(i1+1, i2);

    let listpath = path.slice(0, i1);
    let subpath = path.slice(i2+2, path.length);

    //console.log("i1", i1, "i2", i2);
    //console.log("listpath", listpath);
    //console.log("filter", filterpath);
    //console.log("subpath", subpath);

    return this.api.mass_set_prop(ctx, listpath, subpath, value, filterpath);
  }

  on_frame_change(ctx, newtime) {
    return this.api.on_frame_change(ctx, newtime);
  }

  onFrameChange(ctx : FullContext, newtime : number) {
    return this.api.on_frame_change(ctx, newtime);
  }

  createTool(ctx : FullContext, path : string, inputs={}, constructor_argument=undefined) {
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

      tool.inputs[k].setValue(v);
    }

    return tool;
  }


  setAnimPathKey(ctx, owner, path, time) {
    return this.api.key_animpath(ctx, owner, path, time);
  }

  getObject(ctx, path : string) {
    return this.api.get_object(ctx, path);
  }

  //returns tool class, or undefined if one cannot be found for path
  parseToolPath(path : string) {
    return this.api.get_opclass(this.ctx, path);
  }

  execTool(ctx : FullContext, path_or_toolop, inputs={}, constructor_argument=undefined) {
    return new Promise((accept : function, reject : function) => {
      let tool;

      if (typeof path_or_toolop == "object") {
        tool = path_or_toolop;
      } else {
        try {
          tool = this.createTool(ctx, path_or_toolop, inputs, constructor_argument);
        } catch (error) {
          print_stack(error);
          reject(error);
          return;
        }
      }

      //give client a chance to change tool instance directly
      accept(tool);

      //execute
      try {
        g_app_state.toolstack.execTool(ctx, tool);
      } catch (error) {
        console.warn("Error executing tool");
        print_stack(error);
      }
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


  /**
   * @example
   *
   * return {
   *   obj      : [object owning property key]
   *   parent   : [parent of obj]
   *   key      : [property key]
   *   subkey   : used by flag properties, represents a key within the property
   *   value    : [value of property]
   *   prop     : [optional toolprop.ToolProperty representing the property definition]
   *   struct   : [optional datastruct representing the type, if value is an object]
   *   mass_set : mass setter string, if controller implementation supports it
   * }
   */
  resolvePath(ctx : FullContext, path : string) {
    let rp = this.api.resolve_path_intern(ctx, path);

    if (rp === undefined || rp[0] === undefined) {
      return undefined;
    }

    let ret = resolvepath_rets.next();

    try {
      ret.value = this.api.get_prop(ctx, path);
    } catch (error) {
      if (error instanceof DataAPIError) {
        ret.value = undefined;
      } else {
        throw error;
      }
    }

    ret.mass_set = rp[3];
    ret.key = rp[0].path;
    ret.subkey = undefined;

    /*XXX data_api doesnt support returning parents of owning objects?*/
    ret.parent = undefined;

    ret.obj = undefined;
    ret.prop = undefined;
    ret.struct = undefined;

    if (rp[4]) {
      try {
        ret.obj = this.api.evaluate(this.ctx, rp[4]);
      } catch (error) {
        if (error instanceof DataAPIError) {
          ret.obj = undefined;
        } else {
          throw error;
        }
      }
    }

    if (rp[0].type === DataPathTypes.PROP) {
      ret.prop = rp[0].data;
    } else if (rp[0].type === DataPathTypes.STRUCT) {
      ret.struct = rp[0].data;
    }

    let found = 0;
    if (ret.prop !== undefined && ret.prop.type & (PropTypes.FLAG|PropTypes.ENUM)) {
      let prop = ret.prop;
      let p = path.trim();

      if (p.match(/\]$/) && p.search(/\[/) >= 0) {
        let i = p.length-1;
        while (p[i] !== "[") {
          i--;
        }

        let key = p.slice(i+1, p.length-1);

        if (key in prop.values) {
          key = prop.values[key];
          found = 1;
        } else {
          for (let k in prop.values) {
            if (prop.values[k] === key) {
              found = 1;
            } else if (prop.values[k] === parseInt(key)) {
              key = parseInt(key);
              found = 1;
            }
          }
        }

        if (!found) {
          throw new DataPathError(path + ": Unknown enum/flag key: " + key);
        } else {
          ret.subkey = key;
        }
      }
    }

    if (!found && ret.prop !== undefined && ret.prop.type === PropTypes.FLAG) {
      let s = "" + rp[1];
      if (s.search(/\&/) >= 0) {
        let i = s.search(/\&/);
        s = parseInt(s.slice(i + 1, s.length).trim());
      }

      ret.subkey = parseInt(s);

      for (let k in ret.prop.keys) {
        if (ret.prop.keys[k] == ret.subkey) {
          ret.subkey = k;
          break;
        }
      }
    }

    return ret;
  }

  setValue(ctx : FullContext, path : string, val : number) {
    return this.api.set_prop(ctx, path, val);  }

  getValue(ctx : FullContext, path : string) {
    return this.api.get_prop(ctx, path);
  }
}

