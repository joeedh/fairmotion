import {ToolOpAbstract, ToolOp, ToolMacro} from '../toolops_api.js';

export var toolmap = {};
export var toollist = [];

export function register_toolops() {
  function isTool(t : function) {
    if (t.tooldef === undefined || !t.hasOwnProperty("tooldef") || t.tooldef === ToolOp.tooldef)
      return false;

    if (!t.tooldef().toolpath) {
      //likely a base class
      return false;
    }

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
    ToolOp.register(cls);
  }
}
