import {EnumKeyPair, Matrix4, Vector2, Vector3, Vector4, util, nstructjs} from '../path.ux/scripts/pathux.js';
import type {Container, DataAPI, DataStruct} from '../path.ux/scripts/pathux.js';
import {NodeSocketType, NodeFlags, SocketFlags} from './graph.js';
import type {SocketDef} from './graph.js';

export class Matrix4Socket extends NodeSocketType {
  static STRUCT: string;

  value: Matrix4;

  constructor(uiname?: string, flag = 0, default_value?: Matrix4) {
    super(uiname, flag);

    this.value = new Matrix4(default_value);

    if (default_value === undefined) {
      this.value.makeIdentity();
    }
  }

  addToUpdateHash(digest: util.HashDigest) {
    digest.add(this.value);
  }

  static apiDefine(api: DataAPI, sockstruct: DataStruct) {
    let def = sockstruct.struct("value", "value", "Value", api.mapStruct(Matrix4));
    //def.on('change', function() { this.dataref.graphUpdate(true)});
  }

  static nodedef(): SocketDef {return {
    name : "mat4",
    uiname : "Matrix",
    color : [1,0.5,0.25,1]
  }}

  copy() {
    let ret = new Matrix4Socket(this.uiname, this.flag);
    this.copyTo(ret);
    return ret;
  }

  copyTo(b: Matrix4Socket) {
    super.copyTo(b);

    b.value.load(this.value);
  }

  cmpValue(b: Matrix4) {
    return -1;
  }

  copyValue() {
    return new Matrix4(this.value);
  }

  diffValue(b: Matrix4) {
    let m1 = this.value.$matrix;
    let m2 = b.$matrix;

    let diff = 0.0, tot=0.0;

    for (let k in m1) {
      let a = m1[k], b = m2[k];

      diff += Math.abs(a-b);
      tot += 1.0;
    }

    return tot != 0.0 ? diff / tot : 0.0;
  }

  getValue() {
    return this.value;
  }

  setValue(val: Matrix4) {
    this.value.load(val);
  }
};
Matrix4Socket.STRUCT = nstructjs.inherit(Matrix4Socket, NodeSocketType, "graph.Matrix4Socket") + `
  value : mat4;
}
`;
nstructjs.register(Matrix4Socket);
NodeSocketType.register(Matrix4Socket);

export class DependSocket extends NodeSocketType {
  static STRUCT: string;

  /* Serialized as an int, coerced back to a boolean in loadSTRUCT. */
  value: boolean;

  constructor(uiname?: string, flag = 0) {
    super(uiname, flag);

    this.value = false;
  }

  addToUpdateHash(digest: util.HashDigest) {
    //digest.add(0);
  }

  static nodedef(): SocketDef {return {
    name : "dep",
    uiname : "Dependency",
    color : [0.0,0.75,0.25,1]
  }}

  diffValue(b: boolean) {
    return (!!this.value != !!b)*0.001;
  }

  copyValue() {
    return this.value;
  }

  getValue() {
    return this.value;
  }

  setValue(b: boolean) {
    this.value = !!b;
  }

  cmpValue(b: boolean) {
    return !!this.value == !!b;
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
    super.loadSTRUCT(reader);

    this.value = !!this.value;
  }
};
DependSocket.STRUCT = nstructjs.inherit(DependSocket, NodeSocketType, "graph.DependSocket") + `
  value : int;
}
`;
nstructjs.register(DependSocket);
NodeSocketType.register(DependSocket);


export class IntSocket extends NodeSocketType {
  static STRUCT: string;

  value: number;

  constructor(uiname?: string, flag = 0) {
    super(uiname, flag);

    this.value = 0;
  }

  static apiDefine(api: DataAPI, sockstruct: DataStruct) {
    let def = sockstruct.int("value", "value", "value").noUnits();

    def.on('change', function() { this.dataref.graphUpdate(true)});

    if (this.graph_flag & SocketFlags.NO_UNITS) {
      def.noUnits();
    }
  }

  static nodedef(): SocketDef {return {
    name : "int",
    uiname : "Integer",
    color : [0.0,0.75,0.25,1]
  }}

  diffValue(b: number) {
    return (this.value - b);
  }

  copyValue() {
    return ~~this.value;
  }

  getValue() {
    return ~~this.value;
  }

  setValue(b: number) {
    this.value = ~~b;
  }

  cmpValue(b: number) {
    return ~~this.value !== ~~b;
  }

  addToUpdateHash(digest: util.HashDigest) {
    digest.add(this.value);
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
    super.loadSTRUCT(reader);

    this.value = ~~this.value;
  }
};
IntSocket.STRUCT = nstructjs.inherit(IntSocket, NodeSocketType, "graph.IntSocket") + `
  value : int;
}
`;
nstructjs.register(IntSocket);
NodeSocketType.register(IntSocket);

export class Vec2Socket extends NodeSocketType {
  static STRUCT: string;

  value: Vector2;

  constructor(uiname?: string, flag = 0, default_value?: Vector2) {
    super(uiname, flag);

    this.value = new Vector2(default_value);
  }

  static apiDefine(api: DataAPI, sockstruct: DataStruct) {
    let def = sockstruct.vec2('value', 'value', 'value').noUnits();

    def.on('change', function() { this.dataref.graphUpdate(true)});

    if (this.graph_flag & SocketFlags.NO_UNITS) {
      def.noUnits();
    }
  }

  static nodedef(): SocketDef {return {
    name : "Vec2",
    uiname : "Vector",
    color : [0.25, 0.45, 1.0, 1]
  }}

  addToUpdateHash(digest: util.HashDigest) {
    digest.add(this.value[0]);
    digest.add(this.value[1]);
  }

  copyTo(b: Vec2Socket) {
    super.copyTo(b);
    b.value.load(this.value);
  }

  diffValue(b: Vector2) {
    return this.value.vectorDistance(b);
  }

  copyValue() {
    return new Vector2(this.value);
  }

  getValue() {
    return this.value;
  }

  setValue(b: Vector2) {
    this.value.load(b);
  }

  //eh. . .dot product?
  cmpValue(b: Vector2) {
    return this.value.dot(b);
  }
};
Vec2Socket.STRUCT = nstructjs.inherit(Vec2Socket, NodeSocketType, "graph.Vec2Socket") + `
  value : vec2;
}
`;
nstructjs.register(Vec2Socket);
NodeSocketType.register(Vec2Socket);

//abstract base class
export class VecSocket extends NodeSocketType {
  buildUI(container: Container, onchange: () => void) {
    if (this.edges.length === 0) {
      container.vecpopup("value");
    } else {
      container.label(this.uiname);
    }
  }

}

export class Vec3Socket extends VecSocket {
  static STRUCT: string;

  value: Vector3;

  constructor(uiname?: string, flag = 0, default_value?: Vector3 | number[]) {
    super(uiname, flag);

    this.value = new Vector3(default_value);
  }

  static apiDefine(api: DataAPI, sockstruct: DataStruct) {
    let cb = NodeSocketType._api_uiname;
    let def = sockstruct.vec3('value', 'value', 'value').uiNameGetter(cb).noUnits();

    def.on('change', function() { this.dataref.graphUpdate(true)});

    //if (this.graph_flag & SocketFlags.NO_UNITS) {
      def.noUnits();
    //}
  }

  static nodedef(): SocketDef {return {
    name : "vec3",
    uiname : "Vector",
    color : [0.25, 0.45, 1.0, 1]
  }}

  addToUpdateHash(digest: util.HashDigest) {
    digest.add(this.value[0]);
    digest.add(this.value[1]);
    digest.add(this.value[2]);
  }

  copyTo(b: Vec3Socket) {
    super.copyTo(b);

    b.value.load(this.value);
  }

  diffValue(b: Vector3) {
    return this.value.vectorDistance(b);
  }

  copyValue() {
    return new Vector3(this.value);
  }

  getValue() {
    return this.value;
  }

  setValue(b: Vector3) {
    this.value.load(b);
  }

  //eh. . .dot product?
  cmpValue(b: Vector3) {
    return this.value.dot(b);
  }
};
Vec3Socket.STRUCT = nstructjs.inherit(Vec3Socket, NodeSocketType, "graph.Vec3Socket") + `
  value : vec3;
}
`;
nstructjs.register(Vec3Socket);
NodeSocketType.register(Vec3Socket);

export class Vec4Socket extends NodeSocketType {
  static STRUCT: string;

  value: Vector4;

  constructor(uiname?: string, flag = 0, default_value?: Vector4 | number[]) {
    super(uiname, flag);

    this.value = new Vector4(default_value);
  }

  static nodedef(): SocketDef {return {
    name : "vec4",
    uiname : "Vector4",
    color : [0.25, 0.45, 1.0, 1]
  }}

  static apiDefine(api: DataAPI, sockstruct: DataStruct) {
    let def = sockstruct.vec4('value', 'value', 'value').noUnits();

    def.on('change', function() { this.dataref.graphUpdate(true)});

    if (this.graph_flag & SocketFlags.NO_UNITS) {
      def.noUnits();
    }
  }

  addToUpdateHash(digest: util.HashDigest) {
    digest.add(this.value[0]);
    digest.add(this.value[1]);
    digest.add(this.value[2]);
    digest.add(this.value[3]);
  }


  diffValue(b: Vector4) {
    return this.value.vectorDistance(b);
  }

  copyValue() {
    return new Vector4(this.value);
  }

  getValue() {
    return this.value;
  }

  copyTo(b: Vec4Socket) {
    super.copyTo(b);

    b.value.load(this.value);
  }

  setValue(b: Vector4) {
    if (isNaN(this.value.dot(b))) {
      console.warn(this, b);
      throw new Error("NaN!");
    }
    this.value.load(b);
  }

  //eh. . .dot product?
  cmpValue(b: Vector4) {
    return this.value.dot(b);
  }
};
Vec4Socket.STRUCT = nstructjs.inherit(Vec4Socket, NodeSocketType, "graph.Vec4Socket") + `
  value : vec4;
}
`;
nstructjs.register(Vec4Socket);
NodeSocketType.register(Vec4Socket);


export class RGBSocket extends Vec3Socket {
  static STRUCT: string;

  constructor(uiname?: string, flag = 0, default_value: Vector3 | number[] = [0.5, 0.5, 0.5]) {
    super(uiname, flag, default_value);
  }

  static nodedef(): SocketDef {return {
    name : "rgb",
    uiname : "Color",
    color : [1.0, 0.7, 0.7, 1]
  }}

  static apiDefine(api: DataAPI, sockstruct: DataStruct) {
    let def = sockstruct.color3('value', 'value', 'value').uiNameGetter(NodeSocketType._api_uiname).noUnits();

    def.on('change', function() { this.dataref.graphUpdate(true)});
  }

  buildUI(container: Container, onchange: () => void) {
    if (this.edges.length === 0) {
      container.colorbutton("value");
      /*
      container.button(this.uiname, () => {
        console.log("edit color, yay");

        let colorpicker = container.ctx.screen.popup(container);
        let widget = colorpicker.colorPicker("value");

        widget.onchange = onchange;
      });//*/
    } else {
      container.label(this.uiname);
    }
  }
}
RGBSocket.STRUCT = nstructjs.inherit(RGBSocket, Vec3Socket, 'graph.RGBSocket') + `
}
`;
nstructjs.register(RGBSocket);
NodeSocketType.register(RGBSocket);

export class RGBASocket extends Vec4Socket {
  static STRUCT: string;

  constructor(uiname?: string, flag = 0, default_value: Vector4 | number[] = [0.5, 0.5, 0.5, 1.0]) {
    super(uiname, flag, default_value);
  }

  static nodedef(): SocketDef {return {
    name : "rgba",
    uiname : "Color",
    color : [1.0, 0.7, 0.4, 1]
  }}

  static apiDefine(api: DataAPI, sockstruct: DataStruct) {
    let def = sockstruct.color4('value', 'value', 'value').uiNameGetter(NodeSocketType._api_uiname).noUnits();

    def.on('change', function() { this.dataref.graphUpdate(true)});
  }

  buildUI(container: Container, onchange: () => void) {
    if (this.edges.length === 0) {
      container.colorbutton("value");
      /*
      container.button(this.uiname, () => {
        console.log("edit color, yay");

        let colorpicker = container.ctx.screen.popup(container);
        let widget = colorpicker.colorPicker("value");

        widget.onchange = onchange;
      });//*/
    } else {
      container.label(this.uiname);
    }
  }
}
RGBASocket.STRUCT = nstructjs.inherit(RGBASocket, Vec4Socket, 'graph.RGBASocket') + `
}
`;
nstructjs.register(RGBASocket);
NodeSocketType.register(RGBASocket);

export class FloatSocket extends NodeSocketType {
  static STRUCT: string;

  value: number;

  constructor(uiname?: string, flag = 0, default_value = 0.0) {
    super(uiname, flag);

    this.value = default_value;
  }

  addToUpdateHash(digest: util.HashDigest) {
    digest.add(this.value);
  }

  static apiDefine(api: DataAPI, sockstruct: DataStruct) {
    let def = sockstruct.float('value', 'value', 'value').noUnits();

    if (this.graph_flag & SocketFlags.NO_UNITS) {
      def.noUnits();
    }

    def.on('change', function() { this.dataref.graphUpdate(true)});
  }

  static nodedef(): SocketDef {return {
    name : "float",
    uiname : "Value",
    color : [1.25, 0.45, 1.0, 1]
  }}

  buildUI(container: Container, onchange: () => void) {
    if (this.edges.length === 0) {
      let ret = container.prop("value");
      ret.setAttribute("name", this.uiname);

      ret.onchange = onchange;
    } else {
      container.label(this.uiname);
    }
  }

  diffValue(b: number) {
    return Math.abs(this.value - b);
  }

  copyValue() {
    return this.value;
  }

  getValue() {
    return this.value;
  }

  copyTo(b: FloatSocket) {
    super.copyTo(b);

    b.value = this.value;
  }

  setValue(b: number) {
    if (isNaN(b)) {
      console.warn(this, b);
      throw new Error("NaN!");
    }

    this.value = b;
  }

  //eh. . .dot product?
  cmpValue(b: number) {
    return this.value - b;
  }
};
FloatSocket.STRUCT = nstructjs.inherit(FloatSocket, NodeSocketType, "graph.FloatSocket") + `
  value : float;
}
`;
nstructjs.register(FloatSocket);
NodeSocketType.register(FloatSocket);

/* Enum item name -> integer value, and item name -> display name. */
export type EnumItems = {[name: string]: number};
export type EnumUINames = {[name: string]: string};

export class EnumSocket extends IntSocket {
  static STRUCT: string;

  items: EnumItems;
  uimap: EnumUINames;

  constructor(uiname?: string, items: EnumItems = {}, flag = 0, default_value?: number) {
    super(uiname, flag);

    this.graph_flag |= SocketFlags.INSTANCE_API_DEFINE;

    this.items = {};
    this.value = 0;

    if (items !== undefined) {
      for (let k in items) {
        this.items[k] = items[k];
      }
    }

    if (default_value !== undefined) {
      this.value = default_value;
    }

    this.uimap = {};
    for (let k in this.items) {
      let k2 = k.split("-_ ");
      let uiname = "";

      for (let item of k2) {
        uiname += k[0].toUpperCase() + k.slice(1, k.length).toLowerCase() + " ";
      }

      let v = this.items[k];
      this.uimap[k] = uiname.trim();
    }
  }


  addToUpdateHash(digest: util.HashDigest) {
    digest.add(this.value);
  }

  apiDefine(api: DataAPI, sockstruct: DataStruct) {
    let def;

    def = sockstruct.enum('value', 'value', this.items, this.uiname).uiNames(this.uimap);
    def.on('change', function() {
      this.dataref.graphUpdate(true);
    });
  }

  addUiItems(items: EnumUINames) {
    for (let k in items) {
      this.uimap[k] = items[k];
    }
  }
  static nodedef(): SocketDef {return {
    name : "enum",
    uiname : "Enumeration",
    graph_flag : SocketFlags.INSTANCE_API_DEFINE,
    color : [0.0,0.75,0.25,1]
  }}

  diffValue(b: number) {
    return (this.value - b);
  }

  copyValue() {
    return ~~this.value;
  }

  copyTo(b: EnumSocket) {
    super.copyTo(b);

    b.items = Object.assign({}, this.items);
    b.uimap = Object.assign({}, this.uimap);

    return this;
  }

  getValue() {
    return ~~this.value;
  }

  setValue(b: number | string) {
    if (b === undefined || b === "") {
      return;
    }

    if (typeof b === "string") {
      if (b in this.items) {
        b = this.items[b];
      } else {
        throw new Error("bad enum item" + b);
      }
    }

    this.value = ~~b;
  }

  _saveMap(obj: EnumItems | EnumUINames | undefined) {
    obj = obj === undefined ? {} : obj;
    let ret: EnumKeyPair[] = [];

    for (let k in obj) {
      ret.push(new EnumKeyPair(k, obj[k]));
    }

    return ret;
  }

  onFileLoad(socketTemplate: EnumSocket) {
    this.items = Object.assign({}, socketTemplate.items);
    this.uimap = Object.assign({}, socketTemplate.uimap);
    //console.log("Enumeration type load!", this.graph_id, this.items);
  }

  /* Reverses _saveMap(); on a fresh file `obj` is already a map, in which case
     there is nothing to rebuild and an empty one is returned. */
  _loadMap(obj: EnumKeyPair[] | EnumItems) {
    if (!obj || !Array.isArray(obj)) {
      return {};
    }

    let ret: EnumItems = {};
    for (let k of obj) {
      ret[k.key] = k.val;
    }

    return ret;
  }

  /*
  get items() {
    return this._items;
  }
  set items(v) {
    console.error(this.graph_id, "items set", v);
    this._items = v;
  }//*/

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
    super.loadSTRUCT(reader);

    //note that onFileLoad overwrites this in
    //most cases
    this.items = this._loadMap(this.items);
    this.uimap = this._loadMap(this.uimap);

    //force this flag
    this.graph_flag |= SocketFlags.INSTANCE_API_DEFINE;
  }

  cmpValue(b: number) {
    return ~~this.value !== ~~b;
  }
};
EnumSocket.STRUCT = nstructjs.inherit(EnumSocket, IntSocket, "graph.EnumSocket") + `
  items : array(EnumKeyPair) | this._saveMap(this.items);
  uimap : array(EnumKeyPair) | this._saveMap(this.uimap);
}
`;
nstructjs.register(EnumSocket);
NodeSocketType.register(EnumSocket);


export class BoolSocket extends NodeSocketType {
  static STRUCT: string;

  /* Every writer past the constructor stores a boolean, and STRUCT declares it
     `bool`; the constructor's 0 is the odd one out. */
  value: boolean;

  constructor(uiname?: string, flag = 0) {
    super(uiname, flag);

    this.value = 0;
  }

  static apiDefine(api: DataAPI, sockstruct: DataStruct) {
    sockstruct.bool("value", "value", "value");
  }

  static nodedef(): SocketDef {return {
    name : "bool",
    uiname : "Boolean",
    color : [0.0,0.75,0.25,1]
  }}

  addToUpdateHash(digest: util.HashDigest) {
    digest.add(this.value);
  }

  diffValue(b: boolean) {
    return (this.value - b);
  }

  copyValue() {
    return ~~this.value;
  }

  getValue() {
    return !!this.value;
  }

  setValue(b: boolean) {
    this.value = !!b;
  }

  cmpValue(b: boolean) {
    return !!this.value !== !!b;
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
    super.loadSTRUCT(reader);

    this.value = !!this.value;
  }
};
BoolSocket.STRUCT = nstructjs.inherit(BoolSocket, NodeSocketType, "graph.BoolSocket") + `
  value : bool;
}
`;
nstructjs.register(BoolSocket);
NodeSocketType.register(BoolSocket);
