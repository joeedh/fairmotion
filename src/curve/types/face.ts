/* SplineFace: a filled region, bounded by one or more closed loop paths.

   `paths[0]` is the outline and the rest are holes.  The geometry lives on the
   loops -- a face itself holds only its material, its z order and its cached
   bounding box. */

import { Vector3 } from "../../path.ux/scripts/pathux.js";

import { MinMax } from "../../util/mathlib.js";
import { SplineElement, SplineFlags, SplineTypes } from "../spline_base.js";
import { structInherit } from "../../core/struct_facade.js";
import { Material } from "./material.js";

import type { SplineLoopPath } from "./loop.js";
import type { DataAPI } from "../../path.ux/scripts/pathux.js";
import type { FullContext } from "../../core/context.js";

/* Was `static` inside SplineFace.update_aabb(). */
const _SplineFace_update_aabb_minmax = new MinMax(3);

export class SplineFace extends SplineElement {
  static STRUCT: string;

  declare type: typeof SplineTypes.FACE;

  finalz: number;
  mat: Material;
  /* One entry per closed boundary; the first is the outline, the rest holes. */
  paths: GArray<SplineLoopPath>;
  z: number;
  _aabb: Vector3[];

  constructor() {
    super(SplineTypes.FACE);

    this.z = this.finalz = 0;
    this.mat = new Material();
    this.paths = new GArray();
    this.flag |= SplineFlags.UPDATE_AABB;

    this._aabb = [new Vector3(), new Vector3()];

    this.mat.update = this._mat_update.bind(this);
  }

  _mat_update() {
    this.flag |= SplineFlags.REDRAW;
  }

  update() {
    this.flag |= SplineFlags.UPDATE_AABB | SplineFlags.REDRAW;
  }

  update_aabb() {
    this.flag &= ~SplineFlags.UPDATE_AABB;

    const minmax = _SplineFace_update_aabb_minmax;

    minmax.reset();
    for (var path of this.paths) {
      for (var l of path) {
        minmax.minmax(l.v.aabb[0]);
        minmax.minmax(l.v.aabb[1]);
        minmax.minmax(l.s.aabb[0]);
        minmax.minmax(l.s.aabb[1]);
      }
    }

    this._aabb[0].load(minmax.min);
    this._aabb[1].load(minmax.max);
  }

  get aabb() {
    if (this.flag & SplineFlags.UPDATE_AABB) this.update_aabb();

    return this._aabb;
  }

  set aabb(val: Vector3[]) {
    this._aabb = val;
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);

    super.loadSTRUCT(reader);
    this.flag |= SplineFlags.UPDATE_AABB;
    this.mat.update = this._mat_update.bind(this);
  }

  static defineAPI(api: DataAPI<FullContext>, struct = api.mapStruct(this, true)) {
    super.defineAPI(api, struct);

    struct.struct("mat", "mat", "undefined", api.mapStruct(Material, true));

    return struct;
  }
}

SplineFace.STRUCT =
  structInherit(SplineFace, SplineElement) +
  `
    paths  : array(SplineLoopPath);
    mat    : Material;
    aabb   : array(vec3);
    z      : float;
    finalz : float;
  }
`;
