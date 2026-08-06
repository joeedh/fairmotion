import { STRUCT } from "../core/struct.js";
import { DataBlock, DataRef, DataTypes } from "../core/lib_api.js";
import { SplineFrameSet } from "../core/frameset.js";
import { SceneObject, ObjectFlags } from "./sceneobject.js";
import { DataPathNode } from "../core/eventdag.js";
import { SplineElement } from "../curve/spline_base.js";
import { ToolModes, asNamedList, makeNamedList } from "../editors/viewport/toolmodes/toolmode.js";
import { SelMask } from "../editors/viewport/selectmode.js";
import { Collection } from "./collection.js";

import type { ToolMode, NamedList } from "../editors/viewport/toolmodes/toolmode.js";
import type { DataLib, GetBlockFunc, GetBlockUserFunc } from "../core/lib_api.js";
import type { FullContext } from "../core/context.js";
import type { DagCallback, SocketValue } from "../core/eventdag.js";

/* A dag callback as linkDag() registers them; link() stamps NodeBase's
   prototype onto the function object itself. */
export type SceneDagNode = DagCallback;

export class ObjectList extends Array<SceneObject> {
  /* Keyed on SceneObject.id, not lib_id. */
  idmap: { [id: number]: SceneObject };
  namemap: { [name: string]: SceneObject };
  scene: Scene;
  active: SceneObject | undefined;

  constructor(scene: Scene) {
    super();

    this.idmap = {};
    this.namemap = {};
    this.scene = scene;
    this.active = undefined;
  }

  get(id_or_string: number | string) {
    if (typeof id_or_string == "string") {
      return this.namemap[id_or_string];
    } else {
      return this.idmap[id_or_string];
    }
  }

  has(ob: SceneObject) {
    return ob.id in this.idmap;
    //return super.indexOf(ob) >= 0;
  }

  push(ob: SceneObject) {
    this.add(ob);

    return this.length;
  }

  add(ob: SceneObject) {
    this.idmap[ob.id] = ob;
    this.namemap[ob.name] = ob;

    super.push(ob);
  }

  remove(ob: SceneObject) {
    delete this.idmap[ob.id];
    delete this.namemap[ob.name];
    super.remove(ob);
  }

  validateName(name: string) {
    let i = 2;
    let name2 = name;

    while (name2 in this.namemap) {
      name2 = name + i;
      i++;
    }

    return name2;
  }

  /* NOTE: all three of these hand back the generator *function*, not a
     generator, and its body walked `this.objects` -- a field ObjectList does
     not have, on a `this` that is undefined inside a non-arrow function, so
     iterating either one threw.  The only consumer, transform_object.ts,
     iterates the result with `for..in`, which walks a function's own
     enumerable keys and so finds nothing.  Object transform has been dead the
     whole time; the loops walk the list itself now, but nothing reaches them. */
  get editable(): () => Generator<SceneObject> {
    let this2 = this;

    return function* () {
      for (let ob of this2) {
        if (ob.flag & ObjectFlags.HIDE) continue;

        yield ob;
      }
    };
  }

  //for now, there is no difference between editable list of objects and visible
  get visible() {
    return this.editable;
  }

  /* NOTE: `bad` was computed and then never tested, so this yielded hidden and
     unselected objects too. */
  get selected_editable(): () => Generator<SceneObject> {
    let this2 = this;

    return function* () {
      for (let ob of this2) {
        if (ob.flag & ObjectFlags.HIDE) continue;

        if (!(ob.flag & ObjectFlags.SELECT)) continue;

        yield ob;
      }
    };
  }
}

/*
 * BAD!
 * idea for how layers will work between objects:
 * to start with, have all objects share a common mapping
 * from ids to layer names
 * */

/*
class LayerIDItem {
  constructor(name, id) {
    this.name = name;
    this.id = id;
  }

  static fromSTRUCT(reader) {
    let ret = new LayerIDItem();
    reader(ret);
    return ret;
  }
}

LayerIDItem.STRUCT = `
LayerIDItem {
  name : string;
  id   : int;
}
`;
class LayerIDSet {
  constructor() {
    this.idgen = new EIDGen();
    this.namemap = {};
    this.layers = [];
  }

  get(name) {
    if (!(name in this.namemap)) {
      let id = this.idgen.gen_id();
      let item = new LayerItem(name, id);

      this.layers.push(item);
      this.namemap[name] = item;
      return id;
    }

    return this.namemap[name].id;
  }

  has(name) {
    return name in this.namemap;
  }

  rename(ctx, oldname, newname) {
    let scene = ctx.scene;

    if (!this.has(oldname)) {
      console.warn("Layer '" + oldname + "' not in layerset");
      return;
    }

    for (let ob of scene.objects) {
      if (ob.data.lib_type !== DataTypes.FRAMESET) {
        continue;
      }

      for (let spline of ob.data._allsplines) {
        if (!(oldname in spline.layerset.namemap)) {

        }
      }
    }
  }

  _remove(name) {
    this.layers.remove(this.namemap[name]);
    delete this.namemap[name];
  }

  static fromSTRUCT(reader) {
    let ret = new LayerIDSet();

    reader(ret);

    for (let layer of ret.layers) {
      ret.namemap[layer.name] = layer;
    }

    return ret;
  }
}
LayerIDSet.STRUCT = `
LayerIDSet {
  layers : array(LayerIDItem);
  idgen  : EIDGen;
}
`;
*/

export class ToolModeSwitchError extends Error {}

/* mixin(Scene, DataPathNode) at the bottom of this file copies the whole
   DataPathNode prototype across; this is the part of it Scene uses. */
export interface Scene {
  dag_update(output_socket_name: string, data?: SocketValue): void;
}

export class Scene extends DataBlock {
  static STRUCT: string;

  edit_all_layers: boolean;
  objects: ObjectList;
  object_idgen: EIDGen;
  toolmode_i: number;
  active_splinepath: string;
  time: number;
  fps: number;

  /* One entry per linkDag() call; only used as an "already linked" flag. */
  dagnodes: SceneDagNode[];
  /* Instances, one per registered ToolModeClass, with the same by-name index
     the ToolModes registry carries. */
  toolmodes: NamedList<ToolMode>;
  selectmode: number;
  collection: Collection | undefined;
  /* Written by nstructjs, consumed and deleted by loadSTRUCT. */
  active_object?: number;
  /* NOTE: only ever written (lib_utils.ts, AppState.ts) -- every reader goes
     through objects.active instead. */
  active: SceneObject | undefined;

  static blockDefine() {
    return {
      typeName    : "scene",
      defaultName : "Scene",
      uiName      : "Scene",
      typeIndex   : 5,
      linkOrder   : 1,
      accessorName: "scenes",
    };
  }

  constructor() {
    super(DataTypes.SCENE);

    this.fps = 24.0;

    this.edit_all_layers = false;

    this.objects = new ObjectList(this);
    this.objects.active = undefined;
    this.object_idgen = new EIDGen();

    this.dagnodes = [];

    //this.layer_idset = new LayerIDSet();

    this.toolmodes = makeNamedList<ToolMode>();
    this.toolmode_i = 0;

    this.selectmode = SelMask.VERTEX;

    this.collection = undefined;

    for (let cls of ToolModes) {
      let mode = new cls();
      this.toolmodes.push(mode);
      this.toolmodes.map[cls.toolDefine().name] = mode;
    }

    this.active_splinepath = "frameset.drawspline";
    this.time = 1;
  }

  _initCollection(datalib: DataLib) {
    let collection = new Collection();

    this.collection = collection;
    datalib.add(collection);

    /* NOTE: the reference name was omitted; nothing reads UserRef.name back
       (lib_remuser matches on srcname), so this only fills in the blank. */
    collection.lib_adduser(this, "collection");
  }

  switchToolMode(tname: string) {
    let tool = this.toolmodes.map[tname];

    if (!tool) {
      throw new ToolModeSwitchError("unknown tool mode " + tname);
    }

    try {
      if (this.toolmode) {
        this.toolmode.onInactive();
      }
    } catch (error) {
      print_stack(error);

      throw new ToolModeSwitchError("error switchign tool mode");
    }

    this.toolmode_i = this.toolmodes.indexOf(tool);

    try {
      if (this.toolmode) {
        this.toolmode.onActive();
      }
    } catch (error) {
      print_stack(error);

      throw new ToolModeSwitchError("error switchign tool mode");
    }

    this.toolmode.ctx = g_app_state.ctx;
  }

  get toolmode(): ToolMode {
    return this.toolmodes[this.toolmode_i];
  }

  setActiveObject(ob: SceneObject) {
    this.objects.active = ob;

    this.dag_update("on_active_set", true);
  }

  //returns sceneobject
  addFrameset(datalib: DataLib, fs: SplineFrameSet) {
    let ob = new SceneObject(fs);
    datalib.add(ob);

    ob.name = this.objects.validateName(fs.name);
    ob.id = this.object_idgen.gen_id();

    fs.lib_adduser(this, this.name);
    this.objects.add(ob);

    return ob;
  }

  change_time(ctx: FullContext, time: number, _update_animation = true) {
    if (_DEBUG.timeChange) console.warn("Time change!", time, this.time);

    if (isNaN(this.time)) {
      console.warn("EEK corruption!");
      this.time = ctx.frameset.time;

      if (isNaN(this.time)) this.time = 1;

      if (isNaN(time)) time = 1;
    }

    if (time === this.time) return;

    if (isNaN(time)) return;

    if (time < 1) {
      time = 1;
    }

    //draw one double buffered frame
    window._wait_for_draw = true;
    window.redraw_viewport();

    //console.log("Time change! Old time: ", this.time, ", new time: ", time);
    this.time = time;

    ctx.frameset.change_time(time, _update_animation);

    //handle datapath keyframes
    ctx.state.onFrameChange(ctx, time);

    this.dag_update("on_time_change", true);
  }

  copy(): Scene {
    var ret = new Scene();

    ret.time = this.time;

    return ret;
  }

  add(ob: SceneObject) {
    this.objects.add(ob);
    if (this.collection) {
      this.collection.add(ob);
    }

    return this;
  }

  remove(ob: SceneObject) {
    return this.objects.remove(ob);
  }

  dag_exec() {}

  dag_get_datapath() {
    return "datalib.items[" + this.lib_id + "]";
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
    super.loadSTRUCT(reader);

    let objs = new ObjectList(this);
    for (let i = 0; i < this.objects.length; i++) {
      objs.add(this.objects[i]);
    }
    this.objects = objs;

    if (this.active_object !== undefined && this.active_object >= 0) {
      this.objects.active = this.objects.idmap[this.active_object];
    }

    delete this.active_object;

    this.afterSTRUCT();

    if (this.active_splinepath === "frameset.active_spline")
      this.active_splinepath = "frameset.drawspline";

    return this;
  }

  data_link(block: DataBlock, getblock: GetBlockFunc, getblock_us: GetBlockUserFunc) {
    super.data_link(block, getblock, getblock_us);

    if (this.collection !== undefined) {
      /* NOTE: getblock_us also wants the owning block and the field name; with
         both dropped it built its rem_func out of a pair of undefineds.  The
         field holds the on-disk DataRef at this point, not a Collection. */
      let block = getblock_us(new DataRef(this.collection), this, "collection");

      this.collection = block instanceof Collection ? block : undefined;
    }

    for (let i = 0; i < this.objects.length; i++) {
      this.objects[i].data_link(block, getblock, getblock_us);
    }

    this.toolmodes = asNamedList(this.toolmodes);

    for (let tool of this.toolmodes) {
      tool.dataLink(this, getblock, getblock_us);
      let def = tool.constructor.toolDefine();
      this.toolmodes.map[def.name] = tool;
    }

    for (let cls of ToolModes) {
      let def = cls.toolDefine();

      /* NOTE: this tested the array rather than its by-name index, so it never
         matched and every load appended a second instance of every mode. */
      if (!(def.name in this.toolmodes.map)) {
        let tool = new cls();
        this.toolmodes.push(tool);
        this.toolmodes.map[def.name] = tool;
      }

      //if (!(def.name in this.tool
    }
    //for (let i=0; i<this.framesets.length; i++) {
    //  this.framesets[i] = getblock_us(this.framesets[i]);
    //}

    //if (this.active_splinepath != undefined)
    //  g_app_state.switch_active_spline(this.active_splinepath);
  }

  linkDag(ctx: FullContext) {
    let on_sel: SceneDagNode = function (ctx, inputs, outputs, graph) {
      console.warn("on select called through eventdag!");
      ctx.frameset.sync_vdata_selstate(ctx);
    };

    the_global_dag.link(ctx.frameset.spline.verts, ["on_select_add"], on_sel, ["eid"]);
    the_global_dag.link(ctx.frameset.spline.verts, ["on_select_sub"], on_sel, ["eid"]);
    the_global_dag.link(ctx.frameset.spline.handles, ["on_select_add"], on_sel, ["eid"]);
    the_global_dag.link(ctx.frameset.spline.handles, ["on_select_sub"], on_sel, ["eid"]);

    this.dagnodes.push(on_sel);
  }

  on_tick(ctx: FullContext) {
    if (this.dagnodes.length === 0) {
      this.linkDag(ctx);
    }
  }

  static nodedef() {
    return {
      name   : "scene",
      uiname : "scene",
      outputs: {
        on_active_set : null,
        on_time_change: null,
      },
      inputs : {},
    };
  }
}

Scene.STRUCT =
  STRUCT.inherit(Scene, DataBlock) +
  `
    time              : float;
    active_splinepath : string;
    collection        : DataRef | DataRef.fromBlock(this.collection);
    objects           : array(SceneObject);
    active_object     : int | obj.objects.active !== undefined ? obj.objects.active.id : -1;
    object_idgen      : EIDGen;
    toolmodes         : array(abstract(ToolMode));
    active_toolmode   : string | this.toolmode !== undefined ? this.toolmode.constructor.toolDefine().name : "";
    edit_all_layers   : int;
    selectmode        : int;
    fps               : float;
  }
`;

mixin(Scene, DataPathNode);

DataBlock.register(Scene);
