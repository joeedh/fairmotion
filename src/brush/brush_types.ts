import {nstructjs, Curve1D, util, FloatProperty} from '../path.ux/scripts/pathux.js';
import type {DataAPI, ToolProperty} from '../path.ux/scripts/pathux.js';
import {DataBlock} from '../core/lib_api.js';
import type {GetBlockFunc, GetBlockUserFunc} from '../core/lib_api.js';
import {DynamicFlags, DynamicInputs} from './brush_base.js';

/* A brush tool's parameter slots, keyed by the apiname stamped onto each
   property in the BrushTool constructor. */
export type BrushSlots = {[apiname : string] : ToolProperty};
export type BrushToolClass = typeof BrushTool;

/* typeName (upper-cased) -> index into BrushToolClasses. */
export const BrushTypes : {[typeName : string] : number} = {};

class NoInheritFlag {
  def : BrushSlots;

  constructor(def : BrushSlots) {
    this.def = def;
  }
}

/* What a brush class's static brushDefine() hands back. */
export interface BrushDefine {
  typeName : string;
  uiName? : string;
  defaultName? : string;
  inputs? : BrushSlots | NoInheritFlag;
  flag? : number;
}

/* Walks the class chain merging brushDefine().inputs, nearest class winning.

   NOTE: two defects here.  The walk stopped at Object, but a class chain runs
   out into Function.prototype, so the pass after BrushTool called a
   brushDefine() that does not exist.  And noInherit() wraps the slots in a
   NoInheritFlag, which the copy loop treated as the slot map itself, picking up
   its "def" key as though it were a tool property. */
export function buildSlots(cls : BrushToolClass) {
  let ins : BrushSlots = {};

  let p : BrushToolClass | null = cls;
  while (p !== null && typeof p.brushDefine === "function") {
    let def = p.brushDefine();

    let ins2 = def.inputs ?? {};
    let slots = ins2 instanceof NoInheritFlag ? ins2.def : ins2;

    for (let k in slots) {
      if (!(k in ins)) {
        ins[k] = slots[k];
      }
    }

    if (ins2 instanceof NoInheritFlag) {
      return ins;
    }

    p = Object.getPrototypeOf(p);
  }

  return ins;
}

export const BrushToolClasses : BrushToolClass[] = [];


export class DynamicsCurve {
  static STRUCT : string;

  inputType : number;
  curve : Curve1D;
  enabled : boolean;

  constructor() {
    this.inputType = DynamicInputs.PRESSURE;
    this.curve = new Curve1D();
    this.enabled = false;
  }

  load(b : DynamicsCurve) {
    b.copyTo(this);
    return this;
  }

  copy() {
    return new DynamicsCurve().load(this);
  }

  /* NOTE: the curve line was `this.curve.copyTo(b.curve)`; Curve1D has no
     copyTo, so copying a dynamics curve threw. */
  copyTo(b : DynamicsCurve) {
    b.enabled = this.enabled;
    b.inputType = this.inputType;
    b.curve.load(this.curve);
  }
}
DynamicsCurve.STRUCT = `
brush.DynamicsCurve {
  inputType : int;
  curve     : Curve1D;
  enabled   : bool;
}
`;
nstructjs.register(DynamicsCurve);

export class DynamicsChannel {
  static STRUCT : string;

  /* Keyed on DynamicInputs.  Flattened to _inputs for serialization and
     rebuilt by loadSTRUCT. */
  inputs : Map<number, DynamicsCurve>;
  _inputs : DynamicsCurve[] | undefined;
  name : string;
  min : number;
  max : number;
  flag : number;

  constructor(name? : string) {
    this.inputs = new Map();
    this._inputs = undefined; //used by nstructjs

    this.name = "" + name;
    this.min = 0;
    this.max = 1.0;
    this.flag = 0;
  }

  get(type : number) {
    let ch = this.inputs.get(type);
    if (ch) {
      return ch;
    }

    ch = new DynamicsCurve();
    ch.inputType = type;
    this.inputs.set(type, ch);

    return ch;
  }

  _saveInputs() {
    let ret : DynamicsCurve[] = [];

    for (let val of this.inputs.values()) {
      ret.push(val);
    }

    return ret;
  }

  copyTo(b : DynamicsChannel) {
    b.min = this.min;
    b.max = this.max;
    b.flag = this.flag;

    /* NOTE: this passed ch.name, which DynamicsCurve does not have; b.get() is
       keyed on the numeric input type, so every lookup missed and minted a
       fresh curve under the key `undefined`. */
    for (let ch of this.inputs.values()) {
      ch.copyTo(b.get(ch.inputType));
    }
  }

  load(b : DynamicsChannel) {
    b.copyTo(this);
    return this;
  }

  copy() {
    return new DynamicsChannel().load(this);
  }

  loadSTRUCT(reader : StructReader<this>) {
    reader(this);

    this.inputs = new Map();

    for (let ch of this._inputs ?? []) {
      this.inputs.set(ch.inputType, ch);
    }

    this._inputs = undefined;
  }
}
DynamicsChannel.STRUCT = `
brush.DynamicsChannel {
  name    : string;
  min     : float;
  max     : float;
  flag    : int;
  _inputs : array(brush.DynamicsCurve) | this._saveInputs();
}
`;
nstructjs.register(DynamicsChannel);

export class BrushDynamics {
  static STRUCT : string;

  channels : Map<string, DynamicsChannel>;
  _channels : DynamicsChannel[] | undefined;

  constructor() {
    this.channels = new Map();
    this._channels = undefined;
  }

  /* NOTE: on a miss this built the channel but neither stored nor returned it,
     so every caller downstream got undefined. */
  get(name : string) {
    let ch = this.channels.get(name);

    if (ch) {
      return ch;
    }

    ch = new DynamicsChannel(name);
    this.channels.set(name, ch);

    return ch;
  }

  _saveChannels() {
    return util.list(this.channels.values());
  }

  dataLink(block : DataBlock, getblock : GetBlockFunc,
           getblock_adduser : GetBlockUserFunc) {

  }

  copyTo(b : BrushDynamics) {
    for (let ch of this.channels.values()) {
      ch.copyTo(b.get(ch.name));
    }
  }

  load(b : BrushDynamics) {
    b.copyTo(this);
    return this;
  }

  copy() {
    return new BrushDynamics().load(this);
  }

  loadSTRUCT(reader : StructReader<this>) {
    reader(this);

    this.channels = new Map();

    for (let ch of this._channels ?? []) {
      this.channels.set(ch.name, ch);
    }

    this._channels = undefined;
  }
}
BrushDynamics.STRUCT = `
brush.BrushDynamics {
  _channels : iter(brush.DynamicsChannel) | this._saveChannels();
}
`;

nstructjs.register(BrushDynamics);

export class BrushTool {
  declare ["constructor"] : BrushToolClass;

  static STRUCT : string;

  /* Instances, cloned from the class's brushDefine().inputs. */
  inputs : BrushSlots;
  _inputs : ToolProperty[] | undefined;
  name : string;
  flag : number;
  dynamics : BrushDynamics;

  constructor() {
    this.inputs = buildSlots(this.constructor);

    //instantiate properties
    for (let k in this.inputs) {
      let prop = this.inputs[k];

      prop = prop.copy();
      prop.apiname = k;

      this.inputs[k] = prop;
    }

    this._inputs = undefined;

    let def = this.constructor.brushDefine();
    this.name = def.defaultName || def.uiName || def.typeName;
    this.flag = 0;

    this.dynamics = new BrushDynamics();

    console.log("brush inputs", this.inputs);
  }

  static noInherit(def : BrushSlots) {
    return new NoInheritFlag(def);
  }

  static register(cls : BrushToolClass) {
    let def = cls.brushDefine();

    if (cls.brushDefine === BrushTool.brushDefine) {
      throw new Error("missing brushDefine");
    }

    if (BrushTool.getBrushTool(def.typeName)) {
      throw new Error("brush name " + def.typeName + " is already registered");
    }

    if (!def.typeName) {
      throw new Error("missing typeName in brushDefine");
    }

    BrushTypes[def.typeName.toUpperCase()] = BrushToolClasses.length;
    BrushToolClasses.push(cls);
  }

  static getBrushTool(name : string) {
    for (let cls of BrushToolClasses) {
      if (cls.brushDefine().typeName === name) {
        return cls;
      }
    }
  }

  static brushDefine() : BrushDefine {
    return {
      typeName : "brush",
      uiName : "Brush",
      defaultName : "Brush",
      inputs : {
        radius : new FloatProperty(15.0).setRange(0.0, 1024).noUnits(),
        strength : new FloatProperty(1.0).setRange(0.0, 1.0)
      },
      flag : 0
    }
  }

  static defineAPI(api : DataAPI) {
    let st = api.mapStruct(this, true);
    return st;
  }

  copyTo(b : BrushTool) {
    b.flag = this.flag;
    b.name = this.name;

    /* NOTE: this passed `b`, the BrushTool, where copyTo wants the other
       BrushDynamics. */
    this.dynamics.copyTo(b.dynamics);

    for (let k in this.inputs) {
      let prop1 = this.inputs[k];
      let prop2 =  b.inputs[k];

      if (!prop2) {
        console.error("b lacks tool property " + k, prop1, this);
        continue;
      }

      prop2.setValue(prop1.getValue());
    }
  }

  load(b : BrushTool) {
    b.copyTo(this);
    return this;
  }

  copy() {
    return new this.constructor().load(this);
  }

  dataLink(block : DataBlock, getblock : GetBlockFunc,
           getblock_adduser : GetBlockUserFunc) {
    this.dynamics.dataLink(block, getblock, getblock_adduser);
  }

  /* NOTE: reader() was called with no argument, and there was a
     super.loadSTRUCT(reader) below it even though BrushTool has no base class;
     both threw the moment a brush was read back from a file. */
  loadSTRUCT(reader : StructReader<this>) {
    reader(this);

    let ins = this._inputs ?? [];

    for (let prop of ins) {
      let apiname = prop.apiname;
      if (apiname === undefined) {
        continue;
      }

      let prop2 = this.inputs[apiname];

      if (prop2) {
        try {
          prop2.setValue(prop.getValue());
        } catch (error) {
          util.print_stack(error);

          console.error("Error loading tool property; copying instance instead. . .");
          /* NOTE: the fallback stamps the property onto the _inputs array under
             a string key rather than onto this.inputs, and _inputs is dropped
             two lines down -- so it has never actually copied anything. */
          Reflect.set(ins, apiname, prop);
        }
      } else {
        this.inputs[apiname] = prop;
      }
    }

    this._inputs = undefined;
  }
}
/* NOTE: _inputs names this._save_inputs, which does not exist (and is missing
   its call parens), so serializing a brush would throw. */
BrushTool.STRUCT = `
brush.BrushTool {
  flag       : int;
  dynamics   : brush.BrushDynamics;
  _inputs     : array(abstract(ToolProperty)) | this._save_inputs;
}
`;
nstructjs.register(BrushTool);

