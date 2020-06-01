import {STRUCT} from '../core/struct.js';
import {DataBlock, DataTypes} from '../core/lib_api.js';
import {SplineFrameSet} from "../core/frameset.js";
import {SceneObject, ObjectFlags} from './sceneobject.js';
import {DataPathNode} from '../core/eventdag.js';
import {SplineElement} from "../curve/spline_base.js";
import {ToolModes} from "../editors/viewport/toolmodes/toolmode.js";
import {SelMask} from "../editors/viewport/selectmode.js";

export class ObjectList extends Array {
  idmap : Object
  namemap : Object;

  constructor(scene : Scene) {
    super();

    this.idmap = {};
    this.namemap = {};
    this.scene = scene;
    this.active = undefined;
  }

  get(id_or_string) {
    if (typeof id_or_string == "string") {
      return this.namemap[id_or_string];
    } else {
      return this.idmap[id_or_string];
    }
  }

  has(ob) {
    return ob.id in this.idmap;
    //return super.indexOf(ob) >= 0;
  }

  push(ob : SceneObject) {
    this.add(ob);
  }

  add(ob : SceneObject) {
    this.idmap[ob.id] = ob;
    this.namemap[ob.name] = ob;

    super.push(ob);
  }

  remove(ob) {
    delete this.idmap[ob.id];
    delete this.namemap[ob.name];
    super.remove(ob);
  }

  validateName(name : string) {
    let i = 2;
    let name2 = name;

    while (name2 in this.namemap) {
      name2 = name + i;
      i++;
    }

    return name2;
  }

  get editable() {
    let this2 = this;

    return (function*() {
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

  get selected_editable() {
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
  edit_all_layers : boolean
  objects : ObjectList
  object_idgen : EIDGen
  toolmode_i : number
  active_splinepath : string
  time : number;

  constructor() {
    super(DataTypes.SCENE);

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

    for (let cls of ToolModes) {
      let mode = new cls();
      this.toolmodes.push(mode);
      this.toolmodes.map[cls.toolDefine().name] = mode;
    }

    this.active_splinepath = "frameset.drawspline";
    this.time = 1;
  }

  switchToolMode(tname) {
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
  }

  get toolmode() {
    return this.toolmodes[this.toolmode_i];
  }

  setActiveObject(ob) {
    this.objects.active = ob;

    this.dag_update("on_active", true);
  }

  //returns sceneobject
  addFrameset(fs : SplineFrameSet) {
    let ob = new SceneObject(fs);

    ob.name = this.objects.validateName(fs.name);

    ob.id = this.object_idgen.gen_id();

    fs.lib_adduser(this, this.name);
    this.objects.push(ob);

    return ob;
  }

  change_time(ctx, time, _update_animation=true) {
    console.log("Time change!", time, this.time);

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
    
    //console.log("Time change! Old time: ", this.time, ", new time: ", time);
    this.time = time;
    
    ctx.frameset.change_time(time, _update_animation);
    
    //handle datapath keyframes
    ctx.api.onFrameChange(ctx, time);

    this.dag_update("on_time_change", true);

    window.redraw_viewport();
  }
  
  copy() : Scene {
    var ret = new Scene();
    
    ret.time = this.time;
    
    return ret;
  }

  dag_exec() {

  }

  dag_get_datapath() {
    return "datalib.scene.items[" + this.lib_id + "]";
  }

  loadSTRUCT(reader) {
    reader(this);
    super.loadSTRUCT(reader);

    let objs = new ObjectList(this);
    for (let i=0; i<this.objects.length; i++) {
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
  
  data_link(block, getblock, getblock_us) {
    super.data_link(block, getblock, getblock_us);

    for (let i=0; i<this.objects.length; i++) {
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

  linkDag(ctx) {
    let on_sel = function(ctx, inputs, outputs, graph) {
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

  on_tick(ctx) {
    if (this.dagnodes.length === 0) {
      this.linkDag(ctx);
    }

  }

  static nodedef() {return {
    name      : "scene",
    uiname    : "scene",
    outputs   : {
      on_active_set  : null,
      on_time_change : null
    },
    inputs    : {

    }
  }}
}

Scene.STRUCT = STRUCT.inherit(Scene, DataBlock) + `
    time              : float;
    active_splinepath : string;
    objects           : array(SceneObject);
    active_object     : int | obj.objects.active !== undefined ? obj.objects.active.id : -1;
    object_idgen      : EIDGen;
    toolmodes         : array(abstract(ToolMode));
    active_toolmode   : string | this.toolmode !== undefined ? this.toolmode.constructor.toolDefine().name : "";
    edit_all_layers   : int;
    selectmode        : int;
  }
`;

mixin(Scene, DataPathNode);
