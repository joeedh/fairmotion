import { STRUCT } from "../core/struct.js";
import { structInherit } from "../core/struct_facade.js";
import { DataTypes, DataBlock, DataRef } from "../core/lib_api.js";
import type { GetBlockFunc, GetBlockUserFunc } from "../core/lib_api.js";
import { SplineFrameSet } from "../core/frameset.js";
import type { Scene } from "./scene.js";
import type { DataAPI } from "../path.ux/scripts/pathux.js";
import type { FullContext } from "../core/context.js";

export let UpdateFlags = {
  REDRAW   : 1,
  TRANSFORM: 1, //same as redraw?
};

export let ObjectFlags = {
  SELECT: 1,
  HIDE  : 2,
};

export class SceneObject extends DataBlock {
  static STRUCT: string;

  matrix: Matrix4;
  loc: Vector2;
  scale: Vector2;
  rot: number;

  /* Scene-local id from Scene.object_idgen, distinct from lib_id. */
  id: number;
  /* Always a frameset in practice; see BaseContextOverlay.frameset. */
  data: SplineFrameSet;
  /* [min, max], never filled in -- recalcAABB() throws. */
  aabb: [Vector2, Vector2];

  constructor(data: SplineFrameSet) {
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

  static blockDefine() {
    return {
      typeName   : "object",
      defaultName: "Object",
      uiName     : "Object",
      typeIndex  : 9,
      linkOrder  : 6,
    };
  }

  recalcAABB() {
    throw new Error("implement me!");
  }

  recalcMatrix() {
    this.matrix.makeIdentity();

    this.matrix.scale(this.scale[0], this.scale[1], 1.0);
    this.matrix.translate(this.loc[0], this.loc[1], 1.0);
    this.matrix.rotate(0.0, 0.0, this.rot);

    return this.matrix;
  }

  /* NOTE: dead -- the viewport draws framesets directly, never through the
     SceneObject.  `uniforms` was meant to carry per-draw shader parameters. */
  draw(scene: Scene, drawer: unknown, uniforms: unknown) {}

  /* NOTE: getblock_us was called with only the dataref; it also wants the
     owning block and the field name, without which it built its rem_func from
     a pair of undefineds. */
  data_link(block: DataBlock, getblock: GetBlockFunc, getblock_us: GetBlockUserFunc) {
    let data = getblock_us(new DataRef(this.data), this, "data");

    if (data instanceof SplineFrameSet) {
      this.data = data;
    }
  }

  update(flag = UpdateFlags.REDRAW) {}

  static defineAPI(api: DataAPI<FullContext>, struct = api.mapStruct(this, true)) {
    super.defineAPI(api, struct);

    /* NOTE: SceneObject has no `ctx_bb`, so this path never resolves and the
     change callback that used to hang off it could never have fired.  It read
     ctx.mesh and ctx.object, neither of which exists on fairmotion's context,
     and has been dropped. */
    struct
      .vec3("ctx_bb", "ctx_bb", "Dimensions")
      .range(-100000000000000000, 100000000000000000)
      .step(0.1)
      .expRate(1.33)
      .decimalPlaces(4);
    return struct;
  }
}

SceneObject.STRUCT =
  structInherit(SceneObject, DataBlock) +
  `
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
