/* A stroke and fill style, shared by segments and faces.

   `update` is not a method the base class implements: SplineSegment and
   SplineFace each bind their own in their constructor, so that writing to a
   material can flag the element that owns it.  The base only exists to catch a
   binding that was missed. */

import { Vector4 } from "../../path.ux/scripts/pathux.js";

import type { Spline } from "../spline.js";
import { MaterialFlags } from "../spline_base.js";
import { DataTypes } from "../../core/lib_api.js";
import type { CallbackThis, DataAPI } from "../../path.ux/scripts/pathux.js";
import type { FullContext } from "../../core/context.js";

export class Material {
  static STRUCT: string;

  fillcolor: Vector4;
  strokecolor: Vector4;
  strokecolor2: Vector4;
  linewidth: number;
  /* The optional second (outline) stroke; 0 disables it. */
  linewidth2: number;
  flag: number;
  opacity: number;
  /* NOTE: the nstructjs schema stores this as an int, so it comes back off
     disk as 0 or 1 rather than as a boolean. */
  fill_over_stroke: boolean;
  blur: number;

  constructor() {
    this.fillcolor = new Vector4([0, 0, 0, 1]);
    this.strokecolor = new Vector4([0, 0, 0, 1]);
    this.strokecolor2 = new Vector4([0, 0, 0, 1]);
    this.linewidth = 2.0;
    this.linewidth2 = 0.0;

    this.flag = 0;

    this.opacity = 1.0; //multiplied with both fillcolor and strokecolor's alpha
    this.fill_over_stroke = false;

    this.blur = 0.0;
  }

  /* Replaced per instance by SplineSegment/SplineFace, which bind their own
     _material_update. The base only exists to catch a missed binding. */
  update(optional_spline?: Spline) {
    throw new Error(
      "override me! should have happened in splinesegment or splineface constructors!"
    );
  }

  equals(is_stroke: boolean, mat: Material) {
    let color1 = is_stroke ? this.strokecolor : this.fillcolor;
    let color2 = is_stroke ? mat.strokecolor : mat.fillcolor;

    for (var i = 0; i < 4; i++) {
      if (color1[i] !== color2[i]) return false;
    }

    if (this.flag !== mat.flag) return false;

    if (this.opacity !== mat.opacity) return false;

    if (this.blur !== mat.blur) return false;

    if (is_stroke && this.linewidth !== mat.linewidth) return false;

    return true;
  }

  load(mat: Material) {
    for (var i = 0; i < 4; i++) {
      this.fillcolor[i] = mat.fillcolor[i];
      this.strokecolor[i] = mat.strokecolor[i];
      this.strokecolor2[i] = mat.strokecolor2[i];
    }

    this.opacity = mat.opacity;
    this.linewidth = mat.linewidth;
    this.fill_over_stroke = mat.fill_over_stroke;
    this.blur = mat.blur;
    this.linewidth2 = mat.linewidth2;

    this.flag = mat.flag;

    return this;
  }

  get css_fillcolor() {
    var r = Math.floor(this.fillcolor[0] * 255);
    var g = Math.floor(this.fillcolor[1] * 255);
    var b = Math.floor(this.fillcolor[2] * 255);

    return "rgba(" + r + "," + g + "," + b + "," + this.fillcolor[3] + ")";
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);

    this.fillcolor = new Vector4(this.fillcolor);

    if (isNaN(this.fillcolor[3])) {
      this.fillcolor[3] = 1.0;
    }

    this.strokecolor = new Vector4(this.strokecolor);

    if (isNaN(this.strokecolor[3])) {
      this.strokecolor[3] = 1.0;
    }
  }

  static defineAPI(api: DataAPI<FullContext>, struct = api.mapStruct(this, true)) {
    function prop_update(this: CallbackThis<Material, FullContext>) {
      this.dataref.update(this.ctx.spline);

      window.redraw_viewport();
    }

    struct.color4("fillcolor", "fillcolor", "fill").on("change", prop_update);
    struct
      .float("linewidth", "linewidth", "linewidth")
      .noUnits()
      .range(0.1, 2500)
      .step(0.25)
      .expRate(1.75)
      .decimalPlaces(4)
      .range(0, 10000)
      .on("change", prop_update);
    struct
      .float("linewidth2", "linewidth2", "linewidth2")
      .noUnits()
      .step(0.25)
      .expRate(1.75)
      .decimalPlaces(4)
      .range(0.0, 10000.0)
      .on("change", prop_update);
    struct
      .flags("flag", "flag", MaterialFlags, "material flags")
      .uiNames({
        SELECT      : "Select",
        MASK_TO_FACE: "Mask To Face",
      })
      .descriptions({
        SELECT      : "Select",
        MASK_TO_FACE: "Mask To Face",
      })
      .icons(DataTypes)
      .on("change", function (newval, oldval) {
        //console.log(newval, oldval, this, this.dataref);

        this.dataref.update();
        g_app_state.ctx.spline.regen_sort();
        window.redraw_viewport();
      });
    struct.color4("strokecolor", "strokecolor", "Stroke").on("change", prop_update);
    struct
      .float("blur", "blur", "Blur")
      .noUnits()
      .step(0.5)
      .expRate(1.33)
      .decimalPlaces(4)
      .range(0, 10000)
      .on("change", prop_update);
    struct.color4("strokecolor2", "strokecolor2", "Double Stroke").on("change", prop_update);
    return struct;
  }
}

Material.STRUCT = `
  Material {
    fillcolor        : vec4;
    strokecolor      : vec4;
    strokecolor2     : vec4;
    opacity          : float;
    fill_over_stroke : int;
    linewidth        : float;
    linewidth2       : float;
    blur             : float;
    flag             : int;
  }
`;
