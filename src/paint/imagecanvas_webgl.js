import {nstructjs, util, Vector2, Vector3, Vector4, Matrix4, Quat} from '../path.ux/scripts/pathux.js';
import {addFastParameterGet, ShaderProgram, Texture, VBO} from '../webgl/webgl.js';

export var gl = undefined;
export var canvas = undefined;

import {ImageDataType, TiledImage} from './imagecanvas.js';
import {FBO} from '../webgl/fbo.js';

export const DataTypes = {
  HALF_FLOAT    : 36193,
  FLOAT         : 5126,
  UNSIGNED_BYTE : 5121,
  UNSIGNED_SHORT: 5123,
  UNSIGNED_INT  : 5125
};

export const TypeArrays = {
  [DataTypes.HALF_FLOAT]    : Uint16Array,
  [DataTypes.FLOAT]         : Float32Array,
  [DataTypes.UNSIGNED_BYTE] : Uint8Array,
  [DataTypes.UNSIGNED_SHORT]: Uint16Array,
  [DataTypes.UNSIGNED_INT]  : Uint32Array
};

export const TypeMuls = {
  [DataTypes.HALF_FLOAT] : 1,
  [DataTypes.FLOAT] : 1,
  [DataTypes.UNSIGNED_BYTE] : 255,
  [DataTypes.UNSIGNED_SHORT] : 65535,
  [DataTypes.UNSIGNED_INT] : (1<<32)-1
};

export const GPURecalcFlags = {
  PULL_FROM_GPU: 1
};

export class ImageMapping {
  constructor(min, max, bits) {
    let mul = (1<<bits) - 1;

    this.min = min;
    this.max = max;
    this.mul = (max - min)/mul;
  }

  map(f) {
    return ~~((f - this.min) * this.mul);
  }

  unmap(f) {
    return f/this.mul + this.min;
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
  constructor() {
    this.cache = new Map();
  }

  get(gl, width, height, type) {
    let key = "" + width + ":" + height + ":" + type;

    let ring = this.cache.get(key);
    if (ring) {
      return ring.next();
    }

    ring = new util.cachering(() => {
      return new FBO(gl, width, height);
    }, 4);
  }

  purge(gl = window._gl) {
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

import {TILESIZE} from './imagecanvas_base.js';
import {SimpleMesh, LayerTypes, PrimitiveTypes} from '../webgl/simplemesh.js';

export class GPUImageTile extends ImageDataType {
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

    let sm = this.smesh = new SimpleMesh(layerflag);

    this.sm_screenCo = sm.addDataLayer(PrimitiveTypes.TRIS, LayerTypes.CUSTOM, 2, "sm_screenCo");
    this.sm_params = sm.addDataLayer(PrimitiveTypes.TRIS, LayerTypes.CUSTOM, 4, "sm_params");

    let quad = sm.quad(
      [-1, -1, 0],
      [-1, 1, 0],
      [1, 1, 0],
      [1, -1, 0]);

    quad.uvs([0, 0], [0, 1], [1, 1], [1, 0]);
    quad.custom(this.sm_screenCo, [0, 0], [0, this.height], [this.width, this.height], [this.width, 0]);
  }

  _makeTex(gl) {
    let tex = gl.createTexture();
    tex = new Texture(undefined, tex);

    gl.bindTexture(tex.texture);
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
    }

    gl.texStorage2D(tex.target, 0, format, this.width, this.height);

    tex.texParameteri(gl, tex.target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    tex.texParameteri(gl, tex.target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    tex.texParameteri(gl, tex.target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    tex.texParameteri(gl, tex.target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(null);

    return tex;
  }

  destroy(gl = window._gl) {
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

  init(gl) {
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
    this.data = new cls(this.width*this.height*4);

    return this.data;
  }

  flagUpdate() {
    this.recalcFlag |= GPURecalcFlags.PULL_FROM_GPU;
  }

  downloadFromGPU(gl = window._gl) {
    if (this.data && !(this.recalcFlag & GPURecalcFlags.PULL_FROM_GPU)) {
      return;
    }

    let fbo = fboCache.get(gl, this.width, this.height, this.type);
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

      this.data = new cls(this.width*this.height*4);
    }

    gl.readPixels(0, 0, this.width, this.height, gl.RGBA, this.glType, this.data);

    this.flag &= ~GPURecalcFlags.PULL_FROM_GPU;

    fbo.unbind(gl);
  }

  uploadToGPU(gl = window._gl) {
    let data = this.data;
    if (!data) {
      throw new Error("missing image data");
    }

    gl.bindTexture(this.glTex.texture);
    gl.texImage2D(this.glTex.texture, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, this.glType, this.data);
    gl.bindTexture(null);
  }

  compress() {
    this.downloadFromGPU();

    let data = new Uint8Array(this.data.buffer);
    data = data.slice(0, data.length); //make copy;
    this.compressedData = data;

    return data;
  }

  decompress(data) {
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
      typeName: "gpu"
    }
  }
}

GPUImageTile.STRUCT = nstructjs.inherit(GPUImageTile, ImageDataType, 'imagecanvas.GPUImageTile') + `
  mapping : ImageMapping;
  glType  : int;
}
`;
nstructjs.register(GPUImageTile);
ImageDataType.register(GPUImageTile);


export class GPUTiledImage extends TiledImage {
  constructor(width, height) {
    super(width, height);
  }

  checkTiles(gl, tiles) {
    let newtiles = [];

    for (let t of tiles) {
      if (!(t instanceof GPUImageTile)) {
        let t2 = new GPUImageTile(t.width, t.height);

        let data = t2.data;
        let color = t.color;

        let r = t2.mapping.map(color[0]);
        let g = t2.mapping.map(color[1]);
        let b = t2.mapping.map(color[2]);
        let a = t2.mapping.map(color[3]);

        for (let i=0; i<data.length; i += 4) {
          data[i] = r;
          data[i+1] = g;
          data[i+2] = b;
          data[i+3] = a;
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

  gatherGPUTiles(x, y, r) {
    return this.checkTiles(this.gatherTiles(x, y, r));
  }

  gatherTiles(x, y, r) {
    let rsqr = r*r;
    let ret = [];

    for (let t of this.tiles) {
      let dx = Math.abs(x - t.x);
      dx = Math.min(dx, Math.abs(x - t.x - t.width*0.5));

      let dy = Math.abs(y - t.y);
      dy = Math.min(dy, Math.abs(y - t.y - t.height*0.5));

      let dis = dx*dx + dy*dy;

      if (dis <= rsqr) {
        ret.push(t);
      }
    }

    return ret;
  }
}

import {loadShaders} from '../webgl/shaders.js';

export function initWebGL() {
  canvas = document.createElement("canvas");
  document.body.appendChild(canvas);

  canvas.style["position"] = "fixed";
  canvas.style["z-index"] = "100";

  canvas.style["pointer-events"] = "none";

  gl = window._gl = canvas.getContext("webgl", {
    alpha                : true,
    desynchronized       : true,
    antialias            : false,
    premultipliedAlpha   : false,
    powerPreference      : "high-performance",
    preserveDrawingBuffer: true,
    stencil              : true,
    depth                : true
  });

  if (!gl) {
    console.error('Failed to initialized webgl')
    canvas.remove()
    canvas = undefined
    return
  }

  gl.canvas = canvas;

  let ext = gl.getExtension("OES_texture_half_float");
  gl.getExtension("OES_texture_half_float_linear");
  if (ext) {
    gl.HALF_FLOAT = ext.HALF_FLOAT_OES;
  }

  ext = gl.getExtension("EXT_blend_minmax");
  if (ext) {
    gl.MIN = ext.MIN_EXT;
    gl.MAX = ext.MAX_EXT;
  }

  gl.getExtension("OES_standard_derivatives");
  /*
  #extension GL_EXT_shader_texture_lod : enable
  #extension GL_OES_standard_derivatives : enable
  */

  gl.getExtension('EXT_shader_texture_lod');
  gl.getExtension("OES_texture_float");
  gl.getExtension("OES_texture_float_linear");
  gl.getExtension("EXT_frag_depth"); //gl_FragDepthEXT

  ext = gl.getExtension("WEBGL_depth_texture");
  if (ext) {
    gl.UNSIGNED_INT_24_8 = ext.UNSIGNED_INT_24_8_WEBGL
  }

  ext = gl.getExtension("WEBGL_draw_buffers");
  if (ext) {
    for (let k in ext) {
      let v = ext[k];

      if (k.endsWith("_WEBGL")) {
        k = k.slice(0, k.length - 6);
        gl[k] = v;
      }
    }

    gl._drawbuf = ext;

    gl.drawBuffers = function (buffers) {
      return gl._drawbuf.drawBuffersWEBGL(buffers);
    }
  }

  //ext = gl.getExtension("WEBGL_debug_renderer_info");
  ext = gl.getExtension("OES_vertex_array_object");
  if (ext) {
    gl._vbo = ext;

    gl.createVertexArray = function () {
      return gl._vbo.createVertexArrayOES(...arguments);
    }
    gl.deleteVertexArray = function () {
      return gl._vbo.deleteVertexArrayOES(...arguments);
    }
    gl.isVertexArray = function () {
      return gl._vbo.isVertexArrayOES(...arguments);
    }
    gl.bindVertexArray = function () {
      return gl._vbo.bindVertexArrayOES(...arguments);
    }
  }

  gl.ctxloss = gl.getExtension("WEBGL_lose_context");
  //gl.getExtension("OES_element_index_uint");

  ext = gl.getExtension("EXT_texture_filter_anisotropic");
  if (ext) {
    gl.MAX_TEXTURE_MAX_ANISOTROPY = ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT;
    gl.TEXTURE_MAX_ANISOTROPY = ext.TEXTURE_MAX_ANISOTROPY_EXT;
  }

  gl.srgb = gl.getExtension("EXT_sRGB"); //gl.srgb.SRGB_EXT

  addFastParameterGet(gl);
  loadShaders(gl);
}

let size_update_key = "";

export function updateSize() {
  if (!canvas) {
    return
  }

  let dpi = devicePixelRatio;

  let w = ~~(window.innerWidth*dpi);
  let h = ~~(window.innerHeight*dpi);

  let key = w + ":" + h + ":" + dpi;
  if (size_update_key === key) {
    return;
  }

  console.log("Updating size", key);

  size_update_key = key;
  canvas.width = w;
  canvas.height = h;

  canvas.style["width"] = (w/dpi) + "px";
  canvas.style["height"] = (h/dpi) + "px";
}

let animreq = undefined;

function draw() {
  animreq = undefined;

  if (!window.g_app_state || !window.g_app_state.screen) {
    return;
  }

  updateSize();
  console.log("webgl draw!");

  let screen = g_app_state.screen;
  for (let sarea of screen.sareas) {
    let area = sarea.area;

    if (area.constructor.define().hasWebgl) {
      area.drawWebgl(gl, canvas);
    }
  }
}

window.redraw_webgl = function () {
  if (animreq !== undefined) {
    return;
  }

  animreq = requestAnimationFrame(draw);
}