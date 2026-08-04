import {STRUCT} from '../core/struct.js';
import {DataBlock, DataTypes} from '../core/lib_api.js';
import {SplineFrameSet} from "../core/frameset.js";
import {SceneObject, ObjectFlags} from './sceneobject.js';
import {DataPathNode} from '../core/eventdag.js';
import {SplineElement} from "../curve/spline_base.js";
import {ToolModes} from "../editors/viewport/toolmodes/toolmode.js";
import {SelMask} from "../editors/viewport/selectmode.js";
import {Collection} from './collection.js';

import type {ToolMode} from "../editors/viewport/toolmodes/toolmode.js";
import type {DataLib, GetBlockFunc, GetBlockUserFunc} from '../core/lib_api.js';
import type {FullContext} from '../core/context.js';
import type {SocketMap, EventDag} from '../core/eventdag.js';

/* A dag callback as linkDag() registers them. */
export type SceneDagNode = (ctx : FullContext, inputs : SocketMap,
                            outputs : SocketMap, graph : EventDag) => void;

export class ObjectList extends Array<SceneObject> {
  /* Keyed on SceneObject.id, not lib_id. */
  idmap: {[id : number] : SceneObject}
  namemap: {[name : string] : SceneObject};
  scene: Scene;
  active: SceneObject | undefined;

  constructor(scene: Scene) {
    super();

    this.idmap = {};
    this.namemap = {};
    this.scene = scene;
    this.active = undefined;
  }

  get(id_or_string : number | string) {
    if (typeof id_or_string == "string") {
      return this.namemap[id_or_string];
    } else {
      return this.idmap[id_or_string];
    }
  }

  has(ob : SceneObject) {
    return ob.id in this.idmap;
    //return super.indexOf(ob) >= 0;
  }

  push(ob: SceneObject) {
    this.add(ob);
  }

  add(ob: SceneObject) {
    this.idmap[ob.id] = ob;
    this.namemap[ob.name] = ob;

    super.push(ob);
  }

  remove(ob : SceneObject) {
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
     generator, and its body reads `this.objects` -- a field ObjectList does
     not have, on a `this` that is undefined inside a non-arrow function*.
     The only consumer, transform_object.ts, iterates the result with
     `for..in`, which walks a function's own enumerable keys and so finds
     nothing.  Object transform has been dead the whole time; annotating it
     honestly rather than reviving it. */
  get editable() : () => Generator<SceneObject> {
    let this2 = this;

    return (function* () {
      for (let ob of this.objects) {
        if (ob.flag & ObjectFlags.HIDE)
          continue;

        yield ob;
      }
    });
  }

  //for now, there is no difference between editable list of objects and visible
  get visible() {
    return this.editable;
  }

  get selected_editable() : () => Generator<SceneObject> {
    return (function* () {
      for (let ob of this.objects) {
        let bad = (ob.flag & ObjectFlags.HIDE);
        bad = bad | !(ob.flag & ObjectFlags.SELECT);

        yield ob;
      }
    });
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

export class Scene extends DataBlock {
  static STRUCT : string;

  edit_all_layers: boolean
  objects: ObjectList
  object_idgen: EIDGen
  toolmode_i: number
  active_splinepath: string
  time: number
  fps: number;

  /* One entry per linkDag() call; only used as an "already linked" flag. */
  dagnodes: SceneDagNode[];
  /* Instances, one per registered ToolModeClass, with the same by-name index
     the ToolModes registry carries. */
  toolmodes: ToolMode[] & {map : {[name : string] : ToolMode}};
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
    }
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

    this.toolmodes = [];
    this.toolmodes.map = {};
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

  _initCollection(datalib : DataLib) {
    this.collection = new Collection();
    datalib.add(this.collection);

    this.collection.lib_adduser(this);
  }

  switchToolMode(tname : string) {
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

  get toolmode() : ToolMode {
    return this.toolmodes[this.toolmode_i];
  }

  setActiveObject(ob : SceneObject) {
    this.objects.active = ob;

    this.dag_update("on_active_set", true);
  }

  //returns sceneobject
  addFrameset(datalib : DataLib, fs: SplineFrameSet) {
    let ob = new SceneObject(fs);
    datalib.add(ob);

    ob.name = this.objects.validateName(fs.name);
    ob.id = this.object_idgen.gen_id();

    fs.lib_adduser(this, this.name);
    this.objects.add(ob);

    return ob;
  }

  change_time(ctx : FullContext, time : number, _update_animation = true) {
    if (_DEBUG.timeChange)
      console.warn("Time change!", time, this.time);

    if (isNaN(this.time)) {
      console.warn("EEK corruption!");
      this.time = ctx.frameset.time;

      if (isNaN(this.time))
        this.time = 1;

      if (isNaN(time))
        time = 1;
    }

    if (time === this.time)
      return;

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

  add(ob : SceneObject) {
    this.objects.add(ob);
    if (this.collection) {
      this.collection.add(ob);
    }

    return this;
  }

  remove(ob : SceneObject) {
    return this.objects.remove(ob);
  }

  dag_exec() {

  }

  dag_get_datapath() {
    return "datalib.items[" + this.lib_id + "]";
  }

  loadSTRUCT(reader : StructReader<this>) {
    reader(this);
    super.loadSTRUCT(reader);

    let objs = new ObjectList(this);
    for (let i = 0; i < this.objects.length; i++) {
      objs.add(this.objects[i]);
    }
    this.objects = objs;

    if (this.active_object >= 0) {
      this.objects.active = this.objects.idmap[this.active_object];
    }

    delete this.active_object;

    this.afterSTRUCT();

    if (this.active_splinepath === "frameset.active_spline")
      this.active_splinepath = "frameset.drawspline";

    return this;
  }

  data_link(block : DataBlock, getblock : GetBlockFunc,
            getblock_us : GetBlockUserFunc) {
    super.data_link(block, getblock, getblock_us);

    if (this.collection !== undefined) {
      this.collection = getblock_us(this.collection);
    }

    for (let i = 0; i < this.objects.length; i++) {
      this.objects[i].data_link(block, getblock, getblock_us);
    }

    this.toolmodes.map = {};

    for (let tool of this.toolmodes) {
      tool.dataLink(this, getblock, getblock_us);
      let def = tool.constructor.toolDefine();
      this.toolmodes.map[def.name] = tool;
    }

    for (let cls of ToolModes) {
      let def = cls.toolDefine();

      if (!(def.name in this.toolmodes)) {
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

  linkDag(ctx : FullContext) {
    let on_sel : SceneDagNode = function (ctx, inputs, outputs, graph) {
      console.warn("on select called through eventdag!");
      ctx.frameset.sync_vdata_selstate(ctx);
    }

    the_global_dag.link(ctx.frameset.spline.verts, ["on_select_add"],
      on_sel, ["eid"]);
    the_global_dag.link(ctx.frameset.spline.verts, ["on_select_sub"],
      on_sel, ["eid"]);
    the_global_dag.link(ctx.frameset.spline.handles, ["on_select_add"],
      on_sel, ["eid"]);
    the_global_dag.link(ctx.frameset.spline.handles, ["on_select_sub"],
      on_sel, ["eid"]);

    this.dagnodes.push(on_sel);
  }

  on_tick(ctx : FullContext) {
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
        on_time_change: null
      },
      inputs : {}
    }
  }
}

Scene.STRUCT = STRUCT.inherit(Scene, DataBlock) + `
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
