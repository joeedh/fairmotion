/* Forward-porting files written by older builds.

   do_versions() runs before block linking, so it may only touch what a block
   already carries: spline geometry, layer membership, curvature caches.
   do_versions_post() runs after linking, once cross-block references resolve,
   which is where scenes acquire objects and collections.

   Every patch is guarded by the file version it was introduced at, and the
   guards stay forever -- a file written by 0.046 still has to load. */

import { Scene } from "../../scene/scene.js";
import { SplineFlags } from "../../curve/spline_base.js";
import { DataLib } from "../lib_api.js";

import type { FileBlock } from "./file_format.js";
import type { AppState } from "./appstate.js";

//version patching happens *before* block linking
export function do_versions(self: AppState, datalib: DataLib, blocks: FileBlock[], version: float) {
  if (version < 0.053) {
    for (let scene of datalib.scenes) {
      if (!scene.collection) {
        scene._initCollection(datalib);
      }
    }
  }

  if (version < 0.046) {
    for (let frameset of datalib.framesets) {
      for (let spline of frameset._allsplines) {
        for (let h of spline.handles) {
          console.log("  -", h.segments[0], h.segments);
          console.log("  -", h.owning_segment);

          let s = h.owning_segment;
          let v1 = s.handle_vertex(h);

          /* handle_vertex() hands back undefined for a handle that is not the
             segment's own; h came from that same segment's spline. */
          if (v1 === undefined) {
            continue;
          }

          let v2 = s.other_vert(v1);

          console.log("patching handle!", h.eid);
          h.load(v2)
            .sub(v1)
            .mulScalar(1.0 / 3.0)
            .add(v1);
        }
      }
    }
  }

  if (version < 0.047) {
    //create a scene
    let scene = new Scene();
    scene.set_fake_user();

    self.datalib.add(scene);
  }

  if (version < 0.048) {
    for (let frameset of datalib.framesets) {
      for (let spline of frameset._allsplines) {
        for (let eid in spline.eidmap) {
          let e = spline.eidmap[eid];
          let layer = spline.layerset.active; //should exist by this point

          layer.add(e);
        }
      }
    }
  }

  if (version < 0.049) {
    for (let frameset of datalib.framesets) {
      if (frameset.kcache !== undefined) {
        frameset.kcache.cache = {};
      }

      for (let s of frameset.spline.segments) {
        s.v1.flag |= SplineFlags.UPDATE;
        s.v2.flag |= SplineFlags.UPDATE;
        s.h1.flag |= SplineFlags.UPDATE;
        s.h2.flag |= SplineFlags.UPDATE;
        s.flag |= SplineFlags.UPDATE;
      }

      frameset.spline.resolve = 1;
    }
  }

  //spline equation changed, force resolves
  if (version < 0.05) {
    for (let frameset of datalib.framesets) {
      startup_warning("Spline equation changed; forcing resolve. . .", version);

      frameset.spline.force_full_resolve();
      frameset.pathspline.force_full_resolve();
    }
  }
}

export function do_versions_post(self: AppState, version: float) {
  let datalib = self.datalib;

  if (version < 0.052) {
    for (let scene of datalib.scenes) {
      for (let frameset of datalib.framesets) {
        let ob = scene.addFrameset(datalib, frameset);
        scene.setActiveObject(ob);
      }
    }
    console.log("objectification");
  } else if (version < 0.053) {
    for (let scene of datalib.scenes) {
      if (!scene.collection) {
        scene._initCollection(datalib);
      }

      let collection = scene.collection;

      if (collection === undefined) {
        throw new Error("no collection for scene " + scene.lib_id);
      }

      for (let ob of scene.objects) {
        if (ob.lib_id < 0) {
          console.error("Had to add object to datalib during file conversion", ob);
          datalib.add(ob);
        }

        collection.add(ob);
      }
    }
  }

  if (version < 0.053) {
    let map: { [lib_id: number]: number } = {};
    let max_id = -1;

    for (let block of self.datalib.allBlocks) {
      max_id = Math.max(max_id, block.lib_id + 1);
    }

    self.datalib.idgen.set_cur(max_id);
    self.datalib.idmap = {};

    /* Iterating a hashtable yields its keystrs, so the loop variable was
       being overwritten with the list it had just looked up. */
    for (let key of self.datalib.datalists) {
      let list = self.datalib.datalists.get(key);

      list.idmap = {};

      for (let block of list) {
        if (block.lib_id in map) {
          console.warn("%cConverting old file with overlapping DataBlock IDs", "color : red");
          block.lib_id = self.datalib.idgen.gen_id();
        }

        list.idmap[block.lib_id] = block;
        self.datalib.idmap[block.lib_id] = block;
        map[block.lib_id] = 1;
      }
    }
  }
}
