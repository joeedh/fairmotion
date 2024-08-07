import {STRUCT} from '../core/struct.js';
import {DataTypes, DataBlock} from "../core/lib_api.js";

export let UpdateFlags = {
  REDRAW    : 1,
  TRANSFORM : 1 //same as redraw?
};

export let ObjectFlags = {
  SELECT : 1,
  HIDE   : 2
};

export class SceneObject extends DataBlock {
  matrix : Matrix4
  loc : Vector2
  scale : Vector2
  rot : number
  flag : number;

  constructor(data : DataBlock) {
    super(DataTypes.OBJECT);

    this.id = -1;
    this.data = data;
    this.matrix = new Matrix4();

    this.loc = new Vector2();
    this.scale = new Vector2();
    this.rot = 0.0;

    this.flag = 0;
    this.aabb = [new Vector2(), new Vector2()];
  }

  static blockDefine() {return {
    typeName : "object",
    defaultName : "Object",
    uiName : "Object",
    typeIndex : 9,
    linkOrder : 6
  }}

  recalcAABB() {
    throw new Error("implement me!");
  }

  recalcMatrix() {
    this.matrix.makeIdentity();

    this.matrix.scale(this.scale[0], this.scale[1], 1.0)
    this.matrix.translate(this.loc[0], this.loc[1], 1.0);
    this.matrix.rotate(0.0, 0.0, this.rot);

    return this.matrix;
  }

  //uniforms are webgl-style uniforms
  //even if we're not necassarily drawn with webgl
  draw(scene, drawer, uniforms) {

  }

  data_link(block : Scene, getblock : function, getblock_us : function) {
    this.data = getblock_us(this.data);
  }

  update(flag=UpdateFlags.REDRAW) {

  }
}

SceneObject.STRUCT = STRUCT.inherit(SceneObject, DataBlock) + `
  data     : dataref(DataBlock);
  matrix   : mat4;
  loc      : vec2;
  scale    : vec2;
  rot      : float;
  flag     : int;
  id       : int;
}
`;

DataBlock.register(SceneObject);
