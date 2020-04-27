import {STRUCT} from '../core/struct.js';
import {DataBlock, DataTypes} from '../core/lib_api.js';
import {SplineFrameSet} from "../core/frameset.js";
import {SceneObject, ObjectFlags} from './sceneobject.js';
import {DataPathNode} from '../core/eventdag.js';
import {SplineElement} from "../curve/spline_base.js";

export class ObjectList extends Array {
  constructor(scene) {
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

  push(ob) {
    this.add(ob);
  }

  add(ob) {
    this.idmap[ob.id] = ob;
    this.namemap[ob.name] = ob;

    super.push(ob);
  }

  remove(ob) {
    delete this.idmap[ob.id];
    delete this.namemap[ob.name];
    super.remove(ob);
  }

  validateName(name) {
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

export class Scene extends DataBlock {
  constructor() {
    super(DataTypes.SCENE);

    this.objects = new ObjectList(this);
    this.objects.active = undefined;
    this.object_idgen = new EIDGen();

    //this.layer_idset = new LayerIDSet();

    this.active_splinepath = "frameset.drawspline";
    this.time = 1;
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
    if (isNaN(this.time)) {
      console.log("EEK corruption!");
      this.time = ctx.frameset.time;
      
      if (isNaN(this.time))
        this.time = 0;
        
      if (isNaN(time))
        time = 0;
    }
    
    if (isNaN(time)) return;
    
    if (time == this.time)
      return;
      
    if (time < 1) {
       time = 1;
    }
    
    //console.log("Time change! Old time: ", this.time, ", new time: ", time);
    this.time = time;
    
    ctx.frameset.change_time(time, _update_animation);
    
    //handle datapath keyframes
    ctx.api.onFrameChange(ctx, time);
  }
  
  copy() : Scene {
    var ret = new Scene();
    
    ret.time = this.time;
    
    return ret;
  }

  dag_get_datapath() {
    return "scenes[" + this.lib_id + "]";
  }

  static fromSTRUCT(reader) {
    var ret = STRUCT.chain_fromSTRUCT(Scene, reader);

    let objs = new ObjectList(this);
    for (let i=0; i<ret.objects.length; i++) {
      objs.add(ret.objects[i]);
    }
    ret.objects = objs;

    if (this.active_object >= 0) {
      this.objects.active = this.objects.idmap[this.active_object];
    }

    delete this.active_object;

    ret.afterSTRUCT();
    
    if (ret.active_splinepath == "frameset.active_spline")
      ret.active_splinepath = "frameset.drawspline";
      
    return ret;
  }
  
  data_link(block, getblock, getblock_us) {
    super.data_link(block, getblock, getblock_us);

    for (let i=0; i<this.objects.length; i++) {
      this.objects[i].data_link(block, getblock, getblock_us);
    }

    //for (let i=0; i<this.framesets.length; i++) {
    //  this.framesets[i] = getblock_us(this.framesets[i]);
    //}

    //if (this.active_splinepath != undefined)
    //  g_app_state.switch_active_spline(this.active_splinepath);
  }


}

Scene.STRUCT = STRUCT.inherit(Scene, DataBlock) + `
    time              : float;
    active_splinepath : string;
    objects           : array(SceneObject);
    active_object     : int | obj.objects.active !== undefined ? obj.objects.active.id : -1;
    object_idgen      : EIDGen;
  }
`;

mixin(Scene, DataPathNode);

define_static(Scene, "dag_outputs", {
  on_active_set    : undefined
});
