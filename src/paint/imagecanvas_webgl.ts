import {
  nstructjs,
  util,
  Vector2,
  Vector3,
  Vector4,
  Matrix4,
  Quat,
} from "../path.ux/scripts/pathux.js";
import { addFastParameterGet, ShaderProgram, Texture, VBO } from "../webgl/webgl.js";
import type { WebGLContext } from "../webgl/webgl.js";

/* This module keeps its own overlay context, separate from the viewport's. */
export var gl: WebGLContext | undefined = undefined;
export var canvas: HTMLCanvasElement | undefined = undefined;

import { FillColorImage, ImageDataType, TiledImage } from "./imagecanvas.js";
import { FBO } from "../webgl/fbo.js";

export const DataTypes = {
  HALF_FLOAT    : 36193,
  FLOAT         : 5126,
  UNSIGNED_BYTE : 5121,
  UNSIGNED_SHORT: 5123,
  UNSIGNED_INT  : 5125,
};

/* The two call shapes below: an intersection rather than a union so both a
   length and a buffer resolve. */
type TypedArray = Uint8Array | Uint16Array | Uint32Array | Float32Array;
type TypedArrayCtor = (new (length: number) => TypedArray) &
  (new (buffer: ArrayBufferLike) => TypedArray);

export const TypeArrays: { [type: number]: TypedArrayCtor } = {
  [DataTypes.HALF_FLOAT]    : Uint16Array,
  [DataTypes.FLOAT]         : Float32Array,
  [DataTypes.UNSIGNED_BYTE] : Uint8Array,
  [DataTypes.UNSIGNED_SHORT]: Uint16Array,
  [DataTypes.UNSIGNED_INT]  : Uint32Array,
};

export const TypeMuls = {
  [DataTypes.HALF_FLOAT]    : 1,
  [DataTypes.FLOAT]         : 1,
  [DataTypes.UNSIGNED_BYTE] : 255,
  [DataTypes.UNSIGNED_SHORT]: 65535,
  [DataTypes.UNSIGNED_INT]  : (1 << 32) - 1,
};

export const GPURecalcFlags = {
  PULL_FROM_GPU: 1,
};

/* Maps a float range onto the integer range of a `bits`-wide texture. */
export class ImageMapping {
  static STRUCT: string;

  min: number;
  max: number;
  mul: number;

  constructor(min: number, max: number, bits: number) {
    let mul = (1 << bits) - 1;

    this.min = min;
    this.max = max;
    this.mul = (max - min) / mul;
  }

  map(f: number) {
    return ~~((f - this.min) * this.mul);
  }

  unmap(f: number) {
    return f / this.mul + this.min;
  }
}

ImageMapping.STRUCT = `
ImageMapping {
  min : float;
  max : float;
  mul : float;
}
`;

export class FBOCache {
  /* A cachering per width:height:type key; only next() and iteration are
     used, so the ring type is spelled structurally. */
  cache: Map<string, { next(): FBO } & Iterable<FBO>>;

  constructor() {
    this.cache = new Map();
  }

  /* NOTE: on a miss this builds the ring but neither stores it in the cache
     nor returns it, so every first call for a size hands back undefined. */
  get(gl: WebGLContext, width: number, height: number, type: number) {
    let key = "" + width + ":" + height + ":" + type;

    let ring = this.cache.get(key);
    if (ring) {
      return ring.next();
    }

    ring = new util.cachering(() => {
      return new FBO(gl, width, height);
    }, 4);
  }

  purge(gl: WebGLContext = window._gl) {
    for (let ring of this.cache.values()) {
      for (let fbo of ring) {
        fbo.destroy(gl);
      }
    }

    this.cache = new Map();

    return this;
  }
}

export const fboCache = new FBOCache();

import { TILESIZE } from "./imagecanvas_base.js";
import { SimpleMesh, LayerTypes, PrimitiveTypes } from "../webgl/simplemesh.js";
import type { GeoLayer } from "../webgl/simplemesh.js";

export class GPUImageTile extends ImageDataType {
  static STRUCT: string;

  /* One of the DataTypes above; picks both the texture format and the typed
     array backing `data`. */
  glType: number;
  glTex: Texture | undefined;
  /* The back buffer of the ping-pong pair; see swapBuffers(). */
  glTex2: Texture | undefined;
  ready: boolean;
  mapping: ImageMapping;
  recalcFlag: number;
  data: Uint8Array | Uint16Array | Uint32Array | Float32Array | undefined;

  smesh: SimpleMesh | undefined;
  sm_screenCo: GeoLayer | undefined;
  sm_params: GeoLayer | undefined;

  /* NOTE: neither of these is ever assigned.  downloadFromGPU() builds an fbo
     cache key containing "undefined" from `type`, and masks `flag` with a
     clear that always stores 0 -- the flag it means to clear is recalcFlag. */
  type!: number;
  flag!: number;

  constructor(width = TILESIZE, height = TILESIZE) {
    super(width, height);

    this.glType = DataTypes.UNSIGNED_SHORT;
    this.glTex = undefined;
    this.ready = false;

    this.mapping = new ImageMapping(0.0, 4.0, 16);

    this.recalcFlag = 0;

    this.data = undefined; //typed array buffer of glType

    this.glTex2 = undefined; //to avoid circular fbo references
    this.smesh = undefined;
    this.sm_screenCo = undefined;
    this.sm_params = undefined;
  }

  getQuad() {
    if (this.smesh) {
      return this.smesh;
    }

    let lf = LayerTypes;
    let layerflag = lf.LOC | lf.UV | lf.CUSTOM;

    let sm = (this.smesh = new SimpleMesh(layerflag));

    let screenCo = (this.sm_screenCo = sm.addDataLayer(
      PrimitiveTypes.TRIS,
      LayerTypes.CUSTOM,
      2,
      "sm_screenCo"
    ));
    this.sm_params = sm.addDataLayer(PrimitiveTypes.TRIS, LayerTypes.CUSTOM, 4, "sm_params");

    let quad = sm.quad([-1, -1, 0], [-1, 1, 0], [1, 1, 0], [1, -1, 0]);

    quad.uvs([0, 0], [0, 1], [1, 1], [1, 0]);
    /* NOTE: custom() indexes the island's layer list, so it wants the layer's
       index; passing the layer itself indexed to undefined and threw. */
    quad.custom(
      screenCo.index,
      [0, 0],
      [0, this.height],
      [this.width, this.height],
      [this.width, 0]
    );
  }

  _makeTex(gl: WebGLContext) {
    let tex = new Texture(undefined, gl.createTexture() ?? undefined);

    /* NOTE: bindTexture takes (target, texture); the one-argument calls here
       and at the end of this method threw.  Nothing constructs a GPUImageTile,
       so this whole class has never run. */
    gl.bindTexture(tex.target, tex.texture ?? null);
    let format;

    switch (this.glType) {
      case DataTypes.HALF_FLOAT:
        format = gl.RGBA16F;
        break;
      case DataTypes.FLOAT:
        format = gl.RGBA32F;
        break;
      case DataTypes.UNSIGNED_BYTE:
        format = gl.RGBA8UI;
        break;
      case DataTypes.UNSIGNED_SHORT:
        format = gl.RGBA16UI;
        break;
      case DataTypes.UNSIGNED_INT:
        format = gl.RGBA32I;
        break;
      default:
        throw new Error("unknown glType " + this.glType);
    }

    gl.texStorage2D(tex.target, 0, format, this.width, this.height);

    tex.texParameteri(gl, tex.target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    tex.texParameteri(gl, tex.target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    tex.texParameteri(gl, tex.target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    tex.texParameteri(gl, tex.target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(tex.target, null);

    return tex;
  }

  destroy(gl: WebGLContext = window._gl) {
    if (this.glTex) {
      this.glTex.destroy(gl);
      this.glTex = undefined;
    }

    if (this.glTex2) {
      this.glTex2.destroy(gl);
      this.glTex2 = undefined;
    }

    this.ready = false;
  }

  init(gl: WebGLContext) {
    if (this.ready) {
      return;
    }

    this.glTex = this._makeTex(gl);
    this.glTex2 = this._makeTex(gl);

    this.ready = true;
  }

  getData() {
    if (this.data) {
      return this.data;
    }

    let cls = TypeArrays[this.glType];
    this.data = new cls(this.width * this.height * 4);

    return this.data;
  }

  flagUpdate() {
    this.recalcFlag |= GPURecalcFlags.PULL_FROM_GPU;
  }

  downloadFromGPU(gl: WebGLContext = window._gl) {
    if (this.data && !(this.recalcFlag & GPURecalcFlags.PULL_FROM_GPU)) {
      return;
    }

    /* FBOCache.get() returns undefined on every first call for a key (see the
       NOTE on it), so this throws on the next line. */
    let fbo = fboCache.get(gl, this.width, this.height, this.type)!;
    fbo.bind(gl);
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1.0);

    gl.disable(gl.BLEND);
    gl.disable(gl.DITHER);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.SCISSOR_TEST);
    gl.depthMask(false);

    fbo.drawQuad(gl, undefined, undefined, this.glTex);
    gl.finish();

    if (this.data === undefined) {
      let cls = TypeArrays[this.glType];

      this.data = new cls(this.width * this.height * 4);
    }

    gl.readPixels(0, 0, this.width, this.height, gl.RGBA, this.glType, this.data);

    this.flag &= ~GPURecalcFlags.PULL_FROM_GPU;

    fbo.unbind(gl);
  }

  uploadToGPU(gl: WebGLContext = window._gl) {
    let data = this.data;
    if (!data) {
      throw new Error("missing image data");
    }

    let tex = this.glTex!;

    /* NOTE: as with _makeTex(), bindTexture wants (target, texture) and
       texImage2D a target enum rather than a texture. */
    gl.bindTexture(tex.target, tex.texture ?? null);
    gl.texImage2D(tex.target, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, this.glType, data);
    gl.bindTexture(tex.target, null);
  }

  compress() {
    this.downloadFromGPU();

    let data = new Uint8Array(this.data!.buffer);
    data = data.slice(0, data.length); //make copy;
    this.compressedData = data;

    return data;
  }

  decompress(data?: Uint8Array) {
    return new Promise((accept, reject) => {
      if (!(this.compressedData instanceof Uint8Array)) {
        this.data = new Uint8Array(this.compressedData);
      } else {
        this.data = this.compressedData.slice(0, this.compressedData.length); //copy
      }

      let cls = TypeArrays[this.glType];
      this.data = new cls(this.data.buffer);

      this.uploadToGPU();

      accept(this);
    });
  }

  swapBuffers() {
    let t = this.glTex;
    this.glTex = this.glTex2;
    this.glTex2 = t;

    return this;
  }

  static imageDataDefine() {
    return {
      typeName: "gpu",
    };
  }
}

GPUImageTile.STRUCT =
  nstructjs.inherit(GPUImageTile, ImageDataType, "imagecanvas.GPUImageTile") +
  `
  mapping : ImageMapping;
  glType  : int;
}
`;
nstructjs.register(GPUImageTile);
ImageDataType.register(GPUImageTile);

export class GPUTiledImage extends TiledImage {
  constructor(width?: number, height?: number) {
    super(width, height);
  }

  /* Swaps any non-GPU tile in `tiles` for a freshly uploaded GPUImageTile,
     in place, and returns the resulting list. */
  checkTiles(tiles: ImageDataType[]) {
    let newtiles: ImageDataType[] = [];

    for (let t of tiles) {
      if (!(t instanceof GPUImageTile)) {
        let t2 = new GPUImageTile(t.width, t.height);

        /* Every tile TiledImage builds is a FillColorImage; anything else
           threw on the color read below. */
        if (!(t instanceof FillColorImage)) {
          throw new TypeError("expected a fill-color tile");
        }

        /* NOTE: a fresh GPUImageTile has no data buffer, so the loop below
           throws; getData() is what allocates one. */
        let data = t2.data!;
        let color = t.color;

        let r = t2.mapping.map(color[0]);
        let g = t2.mapping.map(color[1]);
        let b = t2.mapping.map(color[2]);
        let a = t2.mapping.map(color[3]);

        for (let i = 0; i < data.length; i += 4) {
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = a;
        }

        t2.flagUpdate();

        this.tiles.replace(t, t2);
        newtiles.push(t2);
      } else {
        newtiles.push(t);
      }
    }

    return newtiles;
  }

  /* NOTE: checkTiles() used to take a leading gl argument it never touched,
     and this passed the tile list in its place -- so every call iterated
     undefined.  The unused parameter is gone. */
  gatherGPUTiles(x: number, y: number, r: number) {
    return this.checkTiles(this.gatherTiles(x, y, r));
  }

  /* Every tile whose nearest corner falls within `r` of x,y. */
  gatherTiles(x: number, y: number, r: number) {
    let rsqr = r * r;
    let ret: ImageDataType[] = [];

    for (let t of this.tiles) {
      let dx = Math.abs(x - t.x);
      dx = Math.min(dx, Math.abs(x - t.x - t.width * 0.5));

      let dy = Math.abs(y - t.y);
      dy = Math.min(dy, Math.abs(y - t.y - t.height * 0.5));

      let dis = dx * dx + dy * dy;

      if (dis <= rsqr) {
        ret.push(t);
      }
    }

    return ret;
  }
}

import { loadShaders } from "../webgl/shaders.js";

export function initWebGL() {
  canvas = document.createElement("canvas");
  document.body.appendChild(canvas);

  canvas.style["position"] = "fixed";
  canvas.style.zIndex = "100";

  canvas.style.pointerEvents = "none";

  /* getContext() hands back the WebGL1 interface; the extension patching below
     back-fills the WebGL2 names the rest of the app calls, exactly as
     init_webgl() does for its own context. */
  /* No `desynchronized`: this canvas is a transparent full-window overlay at
     z-index 100, and the low-latency hint makes Chromium promote it to an
     overlay plane that composites opaquely -- under Electron 43 on Windows
     that paints the entire app black.  The hint only ever bought latency; this
     context is cleared to alpha 0 and nothing else draws to it. */
  gl = window._gl = canvas.getContext("webgl", {
    alpha                : true,
    antialias            : false,
    premultipliedAlpha   : false,
    powerPreference      : "high-performance",
    preserveDrawingBuffer: true,
    stencil              : true,
    depth                : true,
  }) as WebGLContext;

  if (!gl) {
    console.error("Failed to initialized webgl");
    canvas.remove();
    canvas = undefined;
    return;
  }

  /* gl.canvas is a readonly accessor that already returns this canvas; the
     assignment was a silent no-op in sloppy mode and throws in strict. */

  /* HALF_FLOAT, MIN, MAX and UNSIGNED_INT_24_8 are readonly constants on a
     WebGL2 context but simply absent on this WebGL1 one, which is why they can
     be written at all; Reflect.set is how webgl.ts back-fills the same way. */
  let halfFloat = gl.getExtension("OES_texture_half_float");
  gl.getExtension("OES_texture_half_float_linear");
  if (halfFloat) {
    Reflect.set(gl, "HALF_FLOAT", halfFloat.HALF_FLOAT_OES);
  }

  let blendMinmax = gl.getExtension("EXT_blend_minmax");
  if (blendMinmax) {
    Reflect.set(gl, "MIN", blendMinmax.MIN_EXT);
    Reflect.set(gl, "MAX", blendMinmax.MAX_EXT);
  }

  gl.getExtension("OES_standard_derivatives");
  /*
  #extension GL_EXT_shader_texture_lod : enable
  #extension GL_OES_standard_derivatives : enable
  */

  gl.getExtension("EXT_shader_texture_lod");
  gl.getExtension("OES_texture_float");
  gl.getExtension("OES_texture_float_linear");
  gl.getExtension("EXT_frag_depth"); //gl_FragDepthEXT

  let depthTexture = gl.getExtension("WEBGL_depth_texture");
  if (depthTexture) {
    Reflect.set(gl, "UNSIGNED_INT_24_8", depthTexture.UNSIGNED_INT_24_8_WEBGL);
  }

  let drawBuffers = gl.getExtension("WEBGL_draw_buffers");
  if (drawBuffers) {
    for (let k in drawBuffers) {
      let v = Reflect.get(drawBuffers, k);

      if (k.endsWith("_WEBGL")) {
        k = k.slice(0, k.length - 6);
        /* WebGL1 already defines COLOR_ATTACHMENT0 as a read-only constant of
           the same value; assigning it was a no-op in sloppy mode and throws
           in strict. */
        if (!(k in gl)) {
          Reflect.set(gl, k, v);
        }
      }
    }

    gl._drawbuf = drawBuffers;

    gl.drawBuffers = function (buffers) {
      return gl!._drawbuf!.drawBuffersWEBGL(buffers);
    };
  }

  //ext = gl.getExtension("WEBGL_debug_renderer_info");
  let vertexArrays = gl.getExtension("OES_vertex_array_object");
  if (vertexArrays) {
    gl._vbo = vertexArrays;

    /* Each of these forwards the arguments its WebGL2 counterpart declares;
       the `...arguments` spreads they replace passed the same ones. */
    gl.createVertexArray = function () {
      return gl!._vbo!.createVertexArrayOES();
    };
    gl.deleteVertexArray = function (vao) {
      return gl!._vbo!.deleteVertexArrayOES(vao);
    };
    gl.isVertexArray = function (vao) {
      return gl!._vbo!.isVertexArrayOES(vao);
    };
    gl.bindVertexArray = function (vao) {
      return gl!._vbo!.bindVertexArrayOES(vao);
    };
  }

  gl.ctxloss = gl.getExtension("WEBGL_lose_context");
  //gl.getExtension("OES_element_index_uint");

  let anisotropic = gl.getExtension("EXT_texture_filter_anisotropic");
  if (anisotropic) {
    gl.MAX_TEXTURE_MAX_ANISOTROPY = anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT;
    gl.TEXTURE_MAX_ANISOTROPY = anisotropic.TEXTURE_MAX_ANISOTROPY_EXT;
  }

  gl.srgb = gl.getExtension("EXT_sRGB"); //gl.srgb.SRGB_EXT

  addFastParameterGet(gl);
  loadShaders(gl);
}

let size_update_key = "";

export function updateSize() {
  if (!canvas) {
    return;
  }

  let dpi = devicePixelRatio;

  let w = ~~(window.innerWidth * dpi);
  let h = ~~(window.innerHeight * dpi);

  let key = w + ":" + h + ":" + dpi;
  if (size_update_key === key) {
    return;
  }

  console.log("Updating size", key);

  size_update_key = key;
  canvas.width = w;
  canvas.height = h;

  canvas.style["width"] = w / dpi + "px";
  canvas.style["height"] = h / dpi + "px";
}

/* view2d.ts is the only area that draws into this module's context; it opts
   in with `hasWebgl: true` in its define(). */
function drawsWebgl(area: object): area is {
  drawWebgl(gl: WebGLContext, canvas: HTMLCanvasElement): void;
} {
  return typeof Reflect.get(area, "drawWebgl") === "function";
}

let animreq: number | undefined = undefined;

function draw() {
  animreq = undefined;

  if (!window.g_app_state || !window.g_app_state.screen) {
    return;
  }

  updateSize();
  console.log("webgl draw!");

  let screen = g_app_state.screen;
  for (let sarea of screen.sareas) {
    let area = sarea.area!;

    if (Reflect.get(area.constructor.define(), "hasWebgl")) {
      if (!drawsWebgl(area)) {
        throw new TypeError("area declares hasWebgl but has no drawWebgl()");
      }

      area.drawWebgl(gl!, canvas!);
    }
  }
}

window.redraw_webgl = function () {
  if (animreq !== undefined) {
    return;
  }

  animreq = requestAnimationFrame(draw);
};
