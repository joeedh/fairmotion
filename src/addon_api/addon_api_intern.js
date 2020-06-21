import {nstructjs, util, cconst} from '../path.ux/scripts/pathux.js';
import {Spline} from '../curve/spline.js';
import {SplineFrameSet} from '../core/frameset.js';

export function bindAddonAPI(addon) {
  return {
    registerCustomBlockData(datablock_cls, cls) {
      //console.log("Registering custom datablock for addon", addon);
      throw new Error("implement me!");
    },
    nstructjs : {
      register(cls) {
        let s = new nstructjs.STRUCT();
        s.add_class(cls);

        if (cls.structName.search(/\./) < 0) {
          throw new Error("Must add namespace prefix (e.g. addon.SomeClass) to STRUCT scripts in addons");
        }

        nstructjs.register(cls);
      },

      inherit(cls, parent, structName) {
        if (structName === undefined) {
          throw new Error("structName cannot be undefined, and don't forget to add a module prefix, e.g. addon.SomeClass");
        } else if (structName.search(/\./) < 0) {
          throw new Error("You must add a module prefix to addon STRUCT scripts, e.g. addon.SomeClass");
        }

        return nstructjs.inherit(cls, parent, structName);
      },
      STRUCT : nstructjs.STRUCT
    },
    Spline : Spline,
    SplineFrameSet : SplineFrameSet
  }
}
