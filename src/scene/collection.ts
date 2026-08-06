import { DataBlock, DataRef, NodeDataBlock } from "../core/lib_api.js";
import type { GetBlockFunc, GetBlockUserFunc } from "../core/lib_api.js";
import { SceneObject } from "./sceneobject.js";
import { nstructjs, util } from "../path.ux/scripts/pathux.js";

const COLLECTION = 1 << 28;
const OBJECT = 1 << 27;

/* Between loadSTRUCT() and data_link() both fields hold what nstructjs read --
   an array of DataRef -- rather than the Set of blocks their types describe. */
function loadedRefs(loaded: Iterable<unknown>): DataRef[] {
  let ret: DataRef[] = [];

  for (let item of loaded) {
    if (item instanceof DataRef) {
      ret.push(item);
    }
  }

  return ret;
}

export class Collection extends DataBlock {
  static STRUCT: string;

  /* Both sets hold DataRefs between load and data_link(); data_link rebuilds
     them with the resolved blocks. */
  objects: Set<SceneObject>;
  collections: Set<Collection>;
  /* lib_id -> OBJECT or COLLECTION, so has() can answer without knowing
     which set to look in. */
  idMap: Map<number, number>;

  constructor() {
    super();

    this.objects = new Set();
    this.collections = new Set();

    this.idMap = new Map();
  }

  /* Also takes a bare lib_id. */
  has(ob_or_coll: SceneObject | Collection | number | undefined) {
    if (ob_or_coll === undefined || ob_or_coll === null) {
      return false;
    }

    let id = ob_or_coll;

    if (typeof id === "object") {
      id = id.lib_id;
    }

    return this.idMap.has(id);
  }

  add(ob_or_coll: SceneObject | Collection) {
    if (this.has(ob_or_coll)) {
      return;
    }

    if (ob_or_coll.lib_id < 0) {
      throw new Error("Object/collection must be added to datalib first");
    }

    let i = 0;

    ob_or_coll.lib_adduser(this, "Collection", () => {
      if (this.has(ob_or_coll)) {
        this.remove(ob_or_coll);
      }
    });

    if (ob_or_coll instanceof Collection) {
      i = COLLECTION;
      this.collections.add(ob_or_coll);
    } else {
      i = OBJECT;
      this.objects.add(ob_or_coll);
    }

    this.idMap.set(ob_or_coll.lib_id, i);
  }

  remove(ob_or_coll: SceneObject | Collection) {
    let type = this.idMap.get(ob_or_coll.lib_id);

    if (type === undefined) {
      //throw new Error(
      console.warn(ob_or_coll, "is not in collection", this);
      return;
    }

    /* Same test add() used to decide which set the block went into, so this
       picks the same one `type` records. */
    if (ob_or_coll instanceof Collection) {
      this.collections.delete(ob_or_coll);
    } else {
      this.objects.delete(ob_or_coll);
    }

    this.idMap.delete(ob_or_coll.lib_id);
  }

  /* NOTE: getblock_adduser was called with only the dataref; it also wants the
     owning block and the field name, without which it built its rem_func out
     of a pair of undefineds. */
  data_link(block: DataBlock, getblock: GetBlockFunc, getblock_adduser: GetBlockUserFunc) {
    let obs = loadedRefs(this.objects),
      colls = loadedRefs(this.collections);

    this.objects = new Set();
    this.collections = new Set();
    this.idMap = new Map();

    for (let dref of obs) {
      let ob = getblock_adduser(dref, this, "objects");

      /* NOTE: an unresolved reference used to be added to the set anyway,
         leaving an undefined among the objects. */
      if (ob instanceof SceneObject) {
        this.idMap.set(ob.lib_id, OBJECT);
        this.objects.add(ob);
      }
    }

    for (let dref of colls) {
      let c = getblock_adduser(dref, this, "collections");

      if (c instanceof Collection) {
        this.idMap.set(c.lib_id, COLLECTION);
        this.collections.add(c);
      }
    }
  }

  static blockDefine() {
    return {
      typeName    : "collection",
      uiName      : "collection",
      defaultName : "collection",
      typeIndex   : 13,
      accessorName: "collections",
    };
  }
}

Collection.STRUCT =
  nstructjs.inherit(Collection, DataBlock) +
  `
  objects     : iter(e, DataRef) | DataRef.fromBlock(e);
  collections : iter(e, DataRef) | DataRef.fromBlock(e);
}`;

nstructjs.register(Collection);
DataBlock.register(Collection);
