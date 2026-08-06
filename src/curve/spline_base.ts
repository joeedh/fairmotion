import {
  TPropFlags, PropTypes
} from '../core/toolprops.js';

let acos                                                                    = Math.acos, asin = Math.asin, abs                                 = Math.abs, log = Math.log,
    sqrt = Math.sqrt, pow = Math.pow, PI = Math.PI, floor = Math.floor, min = Math.min,
    max                                                                     = Math.max, sin                                                     = Math.sin, cos = Math.cos, tan = Math.tan, atan    = Math.atan,
    atan2                                                                   = Math.atan2, exp = Math.exp;

import {STRUCT} from '../core/struct.js';
import '../util/mathlib.js';
import {DataPathNode} from '../core/eventdag.js';
import type {NodeDef} from '../core/eventdag.js';
import {util} from '../path.ux/scripts/pathux.js';

import type {SplineSegment, SplineVertex} from './spline_types.js';
import type {ElementArray, SplineLayer} from './spline_element_array.js';

export const MaterialFlags = {
  SELECT      : 1,
  MASK_TO_FACE: 2
};

export const RecalcFlags = {
  DRAWSORT: 1,
  SOLVE   : 2,
  ALL     : 1 | 2
}

export const SplineFlags = {
  SELECT          : 1,
  BREAK_TANGENTS  : 2,
  USE_HANDLES     : 4,
  UPDATE          : 8,
  TEMP_TAG        : 16,
  BREAK_CURVATURES: 32,
  HIDE            : 64,
  FRAME_DIRTY     : 128,
  PINNED          : 256,

  NO_RENDER         : 512, //used by segments
  AUTO_PAIRED_HANDLE: 1<<10,
  UPDATE_AABB       : 1<<11,
  DRAW_TEMP         : 1<<12,
  GHOST             : 1<<13,
  UI_SELECT         : 1<<14,
  FIXED_KS          : 1<<21, //internal to solver code
  REDRAW_PRE        : 1<<22,
  REDRAW            : 1<<23,
  COINCIDENT        : 1<<24
};

/* `as const` so element.type is a discriminant: SplineVertex/Segment/Loop/Face
   each narrow their inherited `type` to the literal(s) they can hold, which is
   what lets `e.type === SplineTypes.FACE` narrow a drawlist entry. */
export const SplineTypes = {
  VERTEX : 1,
  HANDLE : 2,
  SEGMENT: 4,
  LOOP   : 8,
  FACE   : 16,
  ALL    : 31
} as const;

export const ClosestModes = {
  CLOSEST: 0,
  START  : 1,
  END    : 2,
  ALL    : 3
};

export const IsectModes = {
  CLOSEST : 0,
  START   : 1,
  END     : 2,
  ENDSTART: 3
};

/* Placeholder for a layer type that declares no shared data. */
export class empty_class {
  static STRUCT: string;

  static fromSTRUCT(reader: StructReader<empty_class>) {
    let ret = new empty_class();
    reader(ret);
    return ret;
  }
}

empty_class.STRUCT = `
  empty_class {
  }
`

/* NOTE: both were Vector2, so the normalize() and vectorLength() calls in
   global_to_local() ran over two components while everything they were loaded
   from is a Vector3.  Both spots zero z either side of the call. */
let _gtl_co = new Vector3();
let _gtl_vec = new Vector3();

/* What a CustomDataLayer subclass's define() returns.  Everything but the
   type name is optional -- _getDef() fills in the sharedClass default and
   nothing reads hasCurveEffect except as a flag. */
export interface CustomDataLayerDef {
  typeName: string;
  hasCurveEffect?: boolean;
  /* Instantiated once per layer, not once per element. */
  sharedClass?: new () => object;
  /* Stamped on by _getDef() so an inherited define() is not mistaken for the
     subclass's own. */
  clsname?: string;
}

/* A layer type as it is stored: CustomData keeps the constructors, not
   instances, and news one per element. */
export interface LayerTypeClass {
  new (): CustomDataLayer;

  _getDef(): CustomDataLayerDef;
}

/* `.constructor` types as Function, which loses the static side; layer classes
   are fetched back through here rather than casting at each use. */
export function layerClass(layer: CustomDataLayer): LayerTypeClass {
  return layer.constructor as LayerTypeClass;
}

export class CustomDataLayer {
  static STRUCT: string;
  /* Cached define(), keyed by class name; see _getDef(). */
  static __define: CustomDataLayerDef;

  /* The per-layer instance of the type's sharedClass. */
  shared: object | undefined;

  constructor() {
    this.shared = undefined;
  }

  segment_split(old_segment: SplineSegment, old_v1: SplineVertex, old_v2: SplineVertex,
                new_segments: SplineSegment[]) {
  }

  update(owner: SplineElement) {
  }

  post_solve(owner: SplineElement) {
  }

  /* Weighted blend of the same layer on `srcs` into this one. */
  interp(srcs: CustomDataLayer[], ws: number[]) {
  }

  copy(src: CustomDataLayer) {
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
  }

  curve_effect(owner: SplineElement) : CurveEffect {
    throw new Error(this.constructor.name + ".curve_effect: implement me");
  }

  /* Subclasses must override this; the base version is the "not implemented"
     marker _getDef() checks for.  NOTE: typeName was undefined here; no layer
     type reaches this body, since they all override define(). */
  static define() : CustomDataLayerDef {
    return {
      typeName      : "",
      hasCurveEffect: false,
      sharedClass   : empty_class
    }
  }

  static _getDef(): CustomDataLayerDef {
    if (this.__define && this.__define.clsname === this.name) {
      return this.__define;
    }

    /* NOTE: this was `this.define === super.define`.  In a static method of a
       base class `super` is Function.prototype, which has no `define`, so the
       comparison was against undefined and the guard never fired.  Left as it
       was rather than changing which layer types are accepted. */
    if (this.define === Reflect.get(Function.prototype, "define")) {
      throw new Error("define() for customdatalayer doesn't exist!!!");
    }

    let def = this.define();
    def.clsname = this.name;

    if (!def.sharedClass)
      def.sharedClass = empty_class;

    this.__define = def;
    return def;
  }
}

CustomDataLayer.STRUCT = `
  CustomDataLayer {
  }
`;

export class CustomData {
  static STRUCT: string;

  /* The ElementArray whose elements carry these layers.  Typed as the bare
     iterable it is used as: an ElementArray<T> is not an
     ElementArray<SplineElement>, because on_select's parameter is. */
  owner: Iterable<SplineElement>;

  callbacks: {
    on_add?: (cls: LayerTypeClass, i: number, shared: object) => void;
    on_del?: (cls: LayerTypeClass, i: number) => void;
  };

  /* Layer type name -> index of the first layer of that type. */
  startmap: {[typeName: string]: number};

  layers: LayerTypeClass[];
  /* One shared-data instance per entry of `layers`, same index. */
  shared_data: object[];

  /* Both callbacks are optional -- ElementArray builds its CustomData without
     them (see the commented-out arguments at that call site). */
  constructor(owner: Iterable<SplineElement>,
              layer_add_callback?: (cls: LayerTypeClass, i: number, shared: object) => void,
              layer_del_callback?: (cls: LayerTypeClass, i: number) => void) {
    this.owner = owner; //owning ElementArray

    this.callbacks = {
      on_add: layer_add_callback,
      on_del: layer_del_callback
    }

    this.layers = [];
    this.shared_data = [];
    this.startmap = {};
  }

  load_layout(src: CustomData) {
    for (let i = 0; i < src.layers.length; i++) {
      this.layers.push(src.layers[i]);
    }

    for (let k in src.startmap) {
      this.startmap[k] = src.startmap[k];
    }
  }

  /* `name` is accepted and never read -- the layer is keyed by its typeName. */
  add_layer(cls: LayerTypeClass, name: string = cls._getDef().typeName) {
    let templ = cls

    /* NOTE: was get_layer(), which returns the layer class rather than its
       index, so `i += n` concatenated a function onto a number and the insert
       below got a garbage index.  Only a second layer of the same type reaches
       that branch, and nothing adds one. */
    let i = this.get_layer_i(templ._getDef().typeName);
    if (i !== -1) {
      let n = this.num_layers(templ._getDef().typeName);
      i += n;

      this.layers.insert(i, templ);
    } else {
      i = this.layers.length;

      this.startmap[templ._getDef().typeName] = i;
      this.layers.push(templ);
    }

    let scls = templ._getDef().sharedClass;
    scls = scls === undefined ? empty_class : scls;
    let shared = new scls;

    this.shared_data.push(shared);

    for (let e of this.owner) {
      e.cdata.on_add(templ, i, shared);
    }

    if (this.callbacks.on_add !== undefined)
      this.callbacks.on_add(templ, i, shared);
  }

  gen_edata() {
    let ret = new CustomDataSet();

    for (let i = 0; i < this.layers.length; i++) {
      let layer = new this.layers[i]();
      layer.shared = this.shared_data[i];

      ret.push(layer);
    }

    return ret;
  }

  get_shared(type: string) {
    return this.shared_data[this.get_layer_i(type, 0)];
  }

  get_layer_i(type: string, i = 0) {
    if (!(type in this.startmap))
      return -1;

    return this.startmap[type] + i;
  }

  has_layer(type: string) {
    return type in this.startmap;
  }

  get_layer(type: string, i: number = 0) {

    return this.layers[this.startmap[type] + i];
  }

  /* NOTE: the loop below compares `this.layers[i].type`, which no layer class
     has -- it is a class, and the type name lives on _getDef().typeName. So
     the loop always stops at the first layer and this returns the first index
     plus one. */
  num_layers(type: string) {
    let i = this.get_layer_i(type, 0);
    if (i === undefined || i === -1) return 0;

    while (i < this.layers.length && Reflect.get(this.layers[i++], "type") === type) {
      ;
    }

    return i;
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);

    //we saved instances; turn back to class constructors
    for (let i = 0; i < this.layers.length; i++) {
      /* Deserialization boundary: the reader filled `layers` with instances. */
      this.layers[i] = this.layers[i].constructor as LayerTypeClass;
      let l = this.layers[i];

      let typename = l._getDef().typeName;
      if (!(typename in this.startmap)) {
        this.startmap[typename] = i;
      }
    }

    if (this.shared_data.length !== this.layers.length) {
      for (let i = 0; i < this.layers.length; i++) {
        let layer = this.layers[i];

        let scls = layer._getDef().sharedClass;
        scls = scls === undefined ? empty_class : scls;
        let shared = new scls;

        if (this.shared_data.length > i)
          this.shared_data[i] = shared;
        else
          this.shared_data.push(shared);
      }
    }
  }

  afterSTRUCT<T extends SplineElement>(element_array: ElementArray<T>, cdata: CustomData) {
    for (let e of element_array) {
      let i = 0;

      for (let layer of e.cdata) {
        layer.shared = cdata.shared_data[i];
        i++;
      }
    }
  }
}

CustomData.STRUCT = `
  CustomData {
    layers      : array(e, abstract(CustomDataLayer)) | new e();
    shared_data : array(abstract(Object));
  }
`

/* Was `static` inside CustomDataSet.interp(). */
const _CustomDataSet_interp_srcs2 : CustomDataLayer[] = [];

export class CustomDataSet extends Array<CustomDataLayer> {
  static STRUCT: string;

  /* Only exists between loadSTRUCT()'s reader() call and the delete at the
     end of it. */
  arr?: CustomDataLayer[];

  constructor() {
    super();
  }

  on_add(cls: LayerTypeClass, i: number, shared: object) {
    let layer = new cls();
    layer.shared = shared;

    this.insert(i, layer);
  }

  get_layer<T extends CustomDataLayer>(cls: LayerTypeClass & (new () => T)) : T | undefined {
    for (let i = 0; i < this.length; i++) {
      /* Exact class match, not instanceof -- layers are keyed by their type. */
      if (this[i].constructor === cls) //._getDef().typeName === type_name)
        return this[i] as T;
    }
  }

  on_del(cls: LayerTypeClass, i: number) {
    /* NOTE: was pop_u(), which no array has; deleting a custom data layer
       threw. The helper is pop_i(). */
    this.pop_i(i);
  }

  /* Dead stub; nothing calls it and it returns nothing. */
  get_data(layout: object, layer_name: string) {
  }

  //note that old_segment will not be valid, so you can only 
  //access things like flags.  ditto for new_segments.
  on_segment_split(old_segment: SplineSegment, old_v1: SplineVertex,
                   old_v2: SplineVertex, new_segments: SplineSegment[]) {
  }

  interp(srcs: CustomDataSet[], ws: number[]) {
    /* NOTE: dropped a loop that padded this out with zeros; the length
       assignment below grows it anyway and the j-loop fills every slot. */
    const srcs2 = _CustomDataSet_interp_srcs2;

    srcs2.length = srcs.length;

    for (let i = 0; i < this.length; i++) {
      for (let j = 0; j < srcs.length; j++) {
        srcs2[j] = srcs[j][i];
      }

      this[i].interp(srcs2, ws);
    }
  }

  copy(src: CustomDataSet) {
    for (let i = 0; i < this.length; i++) {
      /* NOTE: was copy(src) -- the whole set rather than the matching layer.
         No layer type's copy() reads its argument, so nothing changes yet. */
      this[i].copy(src[i]);
    }
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);

    /* `arr` is a STRUCT field, so the reader above always sets it. */
    const arr = this.arr!;

    for (let i = 0; i < arr.length; i++) {
      this.push(arr[i]);
    }
    delete this.arr;
  }
}

CustomDataSet.STRUCT = `
  CustomDataSet {
    arr : iter(abstract(CustomDataLayer)) | obj;
  }
`;


/* Last time each warning id was printed, so flagwarn() can rate-limit. */
let times: {[id: number]: number} = {};

function flagwarn(msg: string, id: number) {
  if (!(id in times)) {
    times[id] = util.time_ms();
  }

  if (util.time_ms() - times[id] > 150) {
    console.warn(msg);
    times[id] = util.time_ms();
  }
}

export class SplineElement extends DataPathNode {
  static STRUCT: string;

  cdata: CustomDataSet
  masklayer: number
  /* Set of SplineLayer ids this element belongs to; the value is always 1. */
  layers: {[layerId: number]: number}
  flag!: number
  eid!: number
  type: number;

  constructor(type: number) {
    super();

    this.type = type;
    this.cdata = new CustomDataSet();

    //eek.  this .masklayer shouldn't be here.
    this.masklayer = 1; //blender-style bitmask layers <- XXX todo: is this actually used for anything?
    this.layers = {}; //stack layers this element belongs to
  }

  /*
  set flag(v) {
    if (v & SplineFlags.REDRAW && !(this.__flag & SplineFlags.REDRAW)) {
      flagwarn(this.constructor.name + ": set redraw", 0 | (this.type<<4));
    }

    if (!(v & SplineFlags.REDRAW) && (this.__flag & SplineFlags.REDRAW)) {
      flagwarn(this.constructor.name + ": clear redraw", 1 | (this.type<<4));
    }

    this.__flag = v;
  }

  get flag() {
    return this.__flag;
  }
  //*/

  onDestroy() {

  }

  has_layer() {
    for (let k in this.layers) {
      return true;
    }

    return false;
  }

  dag_get_datapath() {
    let suffix;

    //wells, it should end in. . .
    switch (this.type) {
      case SplineTypes.VERTEX:
        suffix = ".verts";
        break;
      case SplineTypes.HANDLE:
        suffix = ".handles";
        break;
      case SplineTypes.SEGMENT:
        suffix = ".segments";
        break;
      case SplineTypes.LOOP:
        suffix = ".loops";
        break;
      case SplineTypes.FACE:
        suffix = ".faces";
        break;
    }

    suffix += "[" + this.eid + "]";

    //hrm, prefix should be either spline.ctx.frameset.drawspline, 
    //or spline.ctx.frameset.pathspline

    //test for presence of customdata time layer, I guess;

    let name = "drawspline";

    for (let i = 0; i < this.cdata.length; i++) {
      if (this.cdata[i].constructor.name === "TimeDataLayer")
        name = "pathspline";
    }

    return "frameset." + name + suffix;
  }

  in_layer(layer: SplineLayer | undefined): boolean {
    return layer !== undefined && layer.id in this.layers;
  }

  /* Overridden by every concrete element type; the base exists only to catch a
     subclass that forgot one. */
  get aabb() : Vector3[] {
    console.trace("Implement Me!");
    return [];
  }

  sethide(state: boolean) {
    if (state)
      this.flag |= SplineFlags.HIDE;
    else
      this.flag &= ~SplineFlags.HIDE;
  }

  set hidden(state: boolean) {
    if (state)
      this.flag |= SplineFlags.HIDE;
    else
      this.flag &= ~SplineFlags.HIDE;
  }

  get hidden(): boolean {
    return !!(this.flag & SplineFlags.HIDE);
  }

  valueOf(): number {
    return this.eid;
  }

  [Symbol.keystr](): string {
    return "" + this.eid;
  }

  post_solve() {
    for (let i = 0; i < this.cdata.length; i++) {
      this.cdata[i].post_solve(this);
    }
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
  }

  static nodedef() : NodeDef {
    return {
      name   : "SplineElement",
      uiName : "SplineElement",
      outputs: {
        depend   : undefined,
        on_select: 0.0,
        eid      : 0.0
      }
    }
  }
}

SplineElement.STRUCT = `
SplineElement {
  eid        : int;
  flag       : int;
  type       : int;
  cdata      : CustomDataSet;
}
`;

let derivative_cache_vs = cachering.fromConstructor(Vector3, 64);
let closest_point_ret_cache_vs = cachering.fromConstructor(Vector3, 256);
/* What CurveEffect.closest_point() hands back: slot 0 the point, slot 1 the
   parameter.  Under ClosestModes.ALL the same array is used as a list of
   those pairs instead. */
type ClosestSlot = Array<Vector3 | number | ClosestSlot | undefined>;

let closest_point_ret_cache = new cachering(function () : ClosestSlot {
  return [0, 0];
}, 256);

let closest_point_cache_vs = cachering.fromConstructor(Vector3, 64);
let _gtl_ret_cache = cachering.fromConstructor(Vector3, 64);
/* [co, s] scratch for global_to_local()'s fixed_s path. */
let _gtl_arr : ClosestSlot = [0, 0];

//forward declaration
let flip_wrapper_cache : cachering<FlipWrapper>;

/* Scratch out-param for _get_nextprev().  The root override in EffectWrapper
   stores a boolean in slot 0 while this initializer is a number, so both are
   allowed. */
let _flip_out_tmp : (number | boolean)[] = [0];

/* Something with numeric slots 0 and 1.  Vector2/Vector3 deliberately have no
   plain index signature -- theirs yields `number | undefined` above LEN -- so
   they are not ArrayLike<number>, and neither is SplineVertex, which borrows
   Vector2's prototype. */
export type Co2 = {
  [i : number] : number | undefined;

  length : number;
};

/* Vector2 and Vector3 both extend Array, so a Vector2 that something wrote a
   third slot onto really has one.  The curve evaluators hand back Vector2s
   that the 3D code loads into Vector3s and back; these two copy exactly what
   Vector3.load()/Vector2.load() copied when the sizes still lined up. */
export function loadVec2Into3(dst : Vector3, src : Vector2) : Vector3 {
  dst[0] = src[0];
  dst[1] = src[1];
  Reflect.set(dst, 2, Reflect.get(src, 2));

  return dst;
}

export function loadVec3Into2(dst : Vector2, src : Vector3) : Vector2 {
  dst[0] = src[0];
  dst[1] = src[1];

  return dst;
}

//prior is a CurveEffect instance
export class CurveEffect {
  /* Effects form a chain: `prior` is the one this one wraps, `child` the one
     wrapping it. Both ends are undefined. */
  child: CurveEffect | undefined;
  prior: CurveEffect | undefined;

  constructor() {
    this.child = undefined;
    this.prior = undefined;
  }

  //rescale parameter-space interval 'width' from ceff to have same roughly the same size
  rescale(ceff: CurveEffect, width: number) : number {
    if (this.prior !== undefined)
      return this.prior.rescale(ceff, width);

    return width;
  }

  get reversed() : CurveEffect {
    return flip_wrapper_cache.next().bind(this);
  }

  set_parent(p: CurveEffect) {
    this.prior = p;
    p.child = this;
  }

  //previous segment's effect renderer, if one exists
  //flip_out is private parameter

  /* `_flip_out` is documented as private but is also never read -- the local
     `flip_out` shadows it with a module-level scratch array. */
  _get_nextprev(donext: number, _flip_out?: (number | boolean)[]) : CurveEffect | undefined {
    //find how deep we are in chain
    let i = 0;
    let root : CurveEffect = this;
    let flip_out = _flip_out_tmp;

    while (root.prior !== undefined) {
      root = root.prior;
      i++;
    }

    //get next segment from root parent
    //console.log("p", p);

    let p = root._get_nextprev(donext, flip_out);
    let flip = flip_out[0];

    //console.log("p", p, i);

    if (p === undefined) {
      return undefined;
    }

    /* NOTE: the descent used to read `.child` off an undefined `p` and throw
       once the chain ran short; the "EVIL!" check below is what it was meant
       to land on. */
    //descend to same level in other segment
    while (i > 0) {
      p = p?.child;
      i--;
    }

    if (p === undefined) {
      console.log("EVIL! no MultiResEffector!", this);
      return undefined;
    }

    if (flip)
      p = p.reversed;

    return p;
  }

  /*
    Get next or previous segment.  Returned CurveEffect will
    be at the same depth in the chain (hopefully two segments
    will never have chains of different depth).
    
    Note that the returned CurveEffect is guaranted to have 
    s behave as if the segments go seg1.v1->seg1.v2->seg2.v1->seg2.v2.
    
    in other words, the parameterization always runs in the same direction.
    we do this with a special spline_types.EffectWrapper.
    
    WARNING: try to avoid overriding these in child classes.
  */
  get next() : CurveEffect | undefined {
    return this._get_nextprev(1);
  }

  get prev() : CurveEffect | undefined {
    return this._get_nextprev(0);
  }

  /* Concrete effects override this; the base only forwards down the chain.
     NOTE: it used to fall off the end when there was no prior, and every
     caller dereferenced the undefined that came back. */
  evaluate(s: number) : Vector3 {
    if (this.prior !== undefined) {
      return this.prior.evaluate(s);
    }

    throw new Error("CurveEffect.evaluate: nothing to evaluate");
  }

  derivative(s: number) : Vector3 {
    let df = 0.001;
    let a, b;

    if (s < 0.5) {
      a = this.evaluate(s);
      b = this.evaluate(s + df);
    } else {
      a = this.evaluate(s - df);
      b = this.evaluate(s);
    }

    b.sub(a).mulScalar(1.0/df);
    return b;
  }

  /* `funcs` is accepted and never read. */
  derivative2(s: number, funcs?: object) {
    let df = 0.001;
    let a, b;

    if (s < 0.5) {
      a = this.derivative(s);
      b = this.derivative(s + df);
    } else {
      a = this.derivative(s - df);
      b = this.derivative(s);
    }

    b.sub(a).mulScalar(1.0/df);
    return b;
  }

  /* `prior` is accepted and never read. */
  curvature(s: number, prior?: CurveEffect) {
    let dv1 = this.derivative(s);
    let dv2 = this.derivative(s);

    return (dv2[0]*dv1[1] - dv2[1]*dv1[0])/Math.pow(dv1[0]*dv1[0] + dv1[1]*dv1[1], 3.0/2.0);
  }

  /* NOTE: the two fallbacks at the bottom read this.v1/this.v2, which
     CurveEffect does not have -- only the SplineSegment-backed subclasses do.
     Returns [co, s], or an array of those when mode is ClosestModes.ALL. */
  closest_point(p: Vector2 | Vector3, mode?: number, fast = false) {
    /* Reflect.get() off a `this`-typed receiver stays a deferred conditional
       type, so the two endpoint reads below go through this instead. */
    const self : CurveEffect = this;
    let minret : ClosestSlot | undefined = undefined, mindis = 1e18, maxdis = 0;

    let p2 = closest_point_cache_vs.next().zero();
    for (let i = 0; i < p.length; i++) {
      p2[i] = p[i];
    }
    p = p2;

    if (mode === undefined) mode = 0;
    let steps = 5, s = 0, ds = 1.0/(steps);

    let n = closest_point_cache_vs.next();
    let n1 = closest_point_cache_vs.next(), n2 = closest_point_cache_vs.next();
    let n3 = closest_point_cache_vs.next(), n4 = closest_point_cache_vs.next();

    if (mode === ClosestModes.ALL)
      minret = [];

    for (let i = 0; i < steps; i++, s += ds) {
      let start = s - 0.00001, end = s + ds + 0.00001;

      start = Math.min(Math.max(start, 0.0), 1.0);
      end = Math.min(Math.max(end, 0.0), 1.0);

      let mid = (start + end)*0.5;
      let bad = false;

      let angle_limit = fast ? 0.65 : 0.2;

      let steps = fast ? 5 : 20;
      for (let j = 0; j < steps; j++) {
        mid = (start + end)*0.5;

        let co = this.evaluate(mid);
        let sco = this.evaluate(start);
        let eco = this.evaluate(end);

        let d1 = this.normal(start).normalize();
        let d2 = this.normal(end).normalize();
        let dm = this.normal(mid).normalize();

        n1.load(sco).sub(p).normalize();
        n2.load(eco).sub(p).normalize();
        n.load(co).sub(p).normalize();

        if (n1.dot(d1) < 0.0) d1.negate();
        if (n2.dot(d2) < 0.0) d2.negate();
        if (n.dot(dm) < 0) dm.negate();

        let mang = acos(n.normalizedDot(dm));
        if (mang < 0.001)
          break;

        let ang1 = acos(n1.normalizedDot(d1));
        let ang2 = acos(n2.normalizedDot(d2));

        let w1 = n1.cross(d1)[2] < 0.0;
        let w2 = n2.cross(d2)[2] < 0.0;
        let wm = n.cross(dm)[2] < 0.0;

        if (isNaN(mang)) {
          console.log(p, co, mid, dm);
        }

        if (j === 0 && w1 === w2) {
          bad = true;
          break
        } else if (w1 === w2) {
          //break;
        }

        if (w1 === w2) {
          //let dis1 = sco.vectorDistance(p), dis2 = eco.vectorDistance(p), dism = co.vectorDistance(p);
          let dis1, dis2;

          dis1 = ang1, dis2 = ang2;
          //console.log("w1==w2", w1, w2, dis1.toFixed(4), dis2.toFixed(4), dism.toFixed(4));

          if (dis2 < dis1) {
            start = mid;
          } else if (dis1 < dis2) {
            end = mid;
          } else {
            break;
          }
        } else if (wm === w1) {
          start = mid;
        } else {
          end = mid;
        }
      }

      if (bad)
        continue;

      //make sure angle is close enough to 90 degrees for our purposes. . .
      let co = this.evaluate(mid);
      n1.load(this.normal(mid)).normalize();
      n2.load(co).sub(p).normalize();

      if (n2.dot(n1) < 0) {
        n2.negate();
      }

      let angle = acos(Math.min(Math.max(n1.dot(n2), -1), 1));
      if (angle > angle_limit)
        continue;

      /* NOTE: this block declared its own `minret` with `let`, so the outer
         one stayed undefined and every assignment below it threw. */
      if (mode !== ClosestModes.ALL && minret === undefined) {
        minret = closest_point_ret_cache.next();
        minret[0] = minret[1] = undefined;
      }

      /* Either the ClosestModes.ALL branch above the loop or the guard just
         above has filled this in. */
      const cur = minret!;

      //did we come up empty?
      let dis = co.vectorDistance(p);
      if (mode === ClosestModes.CLOSEST) {
        if (dis < mindis) {
          cur[0] = closest_point_cache_vs.next().load(co);
          cur[1] = mid;
          mindis = dis;
        }
      } else if (mode === ClosestModes.START) {
        if (mid < mindis) {
          cur[0] = closest_point_cache_vs.next().load(co);
          cur[1] = mid;
          mindis = mid;
        }
      } else if (mode === ClosestModes.END) {
        if (mid > maxdis) {
          cur[0] = closest_point_cache_vs.next().load(co);
          cur[1] = mid;
          maxdis = mid;
        }
      } else if (mode === ClosestModes.ALL) {
        let ret = closest_point_ret_cache.next();
        ret[0] = closest_point_cache_vs.next().load(co);
        ret[1] = mid;

        cur.push(ret);
      }
    }

    if (minret === undefined && mode === ClosestModes.CLOSEST) {
      let v1 = this.evaluate(0), v2 = this.evaluate(1);

      let dis1 = v1.vectorDistance(p), dis2 = v2.vectorDistance(p);

      minret = closest_point_ret_cache.next();
      minret[0] = closest_point_cache_vs.next().load(dis1 < dis2 ? v1 : v2);
      minret[1] = dis1 < dis2 ? 0.0 : 1.0;
    } else if (minret === undefined && mode === ClosestModes.START) {
      minret = closest_point_ret_cache.next();
      minret[0] = closest_point_cache_vs.next().load(Reflect.get(self, "v1"));
      minret[1] = 0.0;
    }
    if (minret === undefined && mode === ClosestModes.END) {
      minret = closest_point_ret_cache.next();
      minret[0] = closest_point_cache_vs.next().load(Reflect.get(self, "v2"));
      minret[1] = 1.0;
    }

    return minret;
  }

  normal(s: number) : Vector3 {
    let ret = this.derivative(s);
    let t = ret[0];
    ret[0] = -ret[1];
    ret[1] = t;

    ret.normalize();
    return ret;
  }

  /* `no_effects` is accepted and never read. */
  global_to_local(p: Vector3, no_effects : boolean | number = false, fixed_s?: number) {
    let ret_cache = _gtl_ret_cache;

    let arr = _gtl_arr;
    let slot : ClosestSlot | undefined;

    if (fixed_s !== undefined) {
      arr[0] = this.evaluate(fixed_s);
      arr[1] = fixed_s;

      slot = arr;
    } else {
      slot = this.closest_point(p);
    }

    let _co = _gtl_co;
    let _vec = _gtl_vec;

    let s : number, t : number, a = 0.0;
    let co : Vector3;

    if (slot === undefined) {
      co = _co;

      /* NOTE: CurveEffect has no v1/v2 -- only the SplineSegment-backed
         subclasses do -- so both reads below come out undefined. */
      const self : CurveEffect = this;
      let v1 = Reflect.get(self, "v1");
      let v2 = Reflect.get(self, "v2");

      if (p.vectorDistance(v1) < p.vectorDistance(v2)) {
        co.load(v1);
        s = 0;
        t = p.vectorDistance(v1);
      } else {
        co.load(v2);
        s = 1.0;
        t = p.vectorDistance(v2);
      }
    } else {
      /* NOTE: closest_point() hands back a [co, s] array, which has neither an
         `s` nor a `co` property, so both of these read undefined. */
      s = Reflect.get(slot, "s");
      co = Reflect.get(slot, "co");

      t = p.vectorDistance(co)*0.15;
    }

    let n1 = this.normal(s).normalize();
    let n2 = _vec.zero().load(p).sub(co).normalize();
    n1[2] = n2[2] = 0.0;

    a = asin(n1[0]*n2[1] - n1[1]*n2[0]);
    let dot = n1.dot(n2);

    //console.log("dot", dot, "a", a, cos(a));

    co.sub(p);
    co[2] = 0.0;
    t = co.vectorLength();

    if (dot < 0.0) {
      t = -t;
      a = 2.0*Math.PI - a;
    }

    let ret = ret_cache.next();

    ret[0] = s;
    ret[1] = t;
    ret[2] = a;

    return ret;
  }

  local_to_global(p: Vector3) {
    let s = p[0], t = p[1], a = p[2];

    let co = this.evaluate(s);
    let no = this.normal(s).normalize();

    no.mulScalar(t);
    no.rot2d(a);

    co.add(no);
    return co;
  }
}

/* Runs another effect backwards: s becomes 1-s for the outermost call only,
   which is what `depth` counts. */
export class FlipWrapper extends CurveEffect {
  depth: number;
  /* Set by bind(), which is the only way anything gets a FlipWrapper.  NOTE:
     the constructor used to assign undefined here, which reads the same. */
  eff! : CurveEffect;

  constructor() {
    super();
    this.depth = 0;
  }

  rescale(eff: CurveEffect, width: number) {
    return this.eff.rescale(eff, width);
  }

  get reversed() {
    return this.eff;
  }

  bind(eff: CurveEffect): FlipWrapper {
    this.eff = eff;

    return this;
  }

  get next(): CurveEffect | undefined {
    return this.eff.next;
  }

  get prev(): CurveEffect | undefined {
    return this.eff.prev;
  }

  push(s: number): number {
    if (this.depth === 0) {
      s = 1.0 - s;
    }

    this.depth++;

    return s;
  }

  pop<T>(value: T): T {
    this.depth--;

    return value;
  }

  evaluate(s: number) {
    s = this.push(s);
    return this.pop(this.eff.evaluate(s));
  }

  derivative(s: number) {
    s = this.push(s);
    return this.pop(this.eff.derivative(s));
  }

  normal(s: number) {
    s = this.push(s);
    return this.pop(this.eff.normal(s));
  }

  curvature(s: number) {
    s = this.push(s);
    return this.pop(this.eff.curvature(s));
  }
}

flip_wrapper_cache = cachering.fromConstructor(FlipWrapper, 32);
