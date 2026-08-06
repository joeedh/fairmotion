/*

Great Paint Refactor

TODO:

1. Finish Scene/SceneObject refactor
2. Code simple canvas-like API for ImageCanvas (imagecanvas_draw.js)
3. Figure out file saving (support incremental updates?).
4. Replace event dag with src/graph/graph.js api (and write an adaptor class).
5. Replace ancient datapath controller with new path.ux datapath controller.

*/

import { nstructjs, Curve1D, Vector4, util, FloatProperty } from "../path.ux/scripts/pathux.js";
import { DataBlock } from "../core/lib_api.js";
import { NodeBase } from "../core/eventdag.js";
import { Graph, GraphNode, NodeSocketType } from "../graph/graph.js";
import { IndexRange } from "../path.ux/scripts/path-controller/util/indexRange.js";
import type { Texture } from "../webgl/webgl.js";
import { TILESIZE } from "./imagecanvas_base.js";

export type ImageDataClass = typeof ImageDataType;

/* Every implementation hands back the bytes of an ImageData, so the buffer is
   always a plain ArrayBuffer -- which is what the ImageData constructor
   requires in turn. */
export type RGBABytes = Uint8ClampedArray<ArrayBuffer>;

export const ImageDataClasses: ImageDataClass[] = [];

export class ImageDataType {
  static STRUCT: string;

  declare ["constructor"]: ImageDataClass;

  width: number;
  height: number;
  /* Offset of this tile within the image it belongs to; 0 for whole
     images. */
  x: number;
  y: number;
  /* A PNG data-url payload, length-prefixed with its own mime header; see
     SimpleImageData.compress(). */
  compressedData: Uint8Array | number[];

  constructor(width = 1, height = 1) {
    this.width = width;
    this.height = height;
    this.x = 0;
    this.y = 0;
    this.compressedData = [];
  }

  static imageDataDefine() {
    return {
      typeName: "",
    };
  }

  static register(cls: ImageDataClass) {
    ImageDataClasses.push(cls);
  }

  static getClass(name: string) {
    for (let cls of ImageDataClasses) {
      if (cls.imageDataDefine().typeName === name) {
        return cls;
      }
    }
  }

  /* The rect is optional -- the leaf implementations ignore it and dirty the
     whole tile. */
  flagUpdate(x?: number, y?: number, w?: number, h?: number) {}

  toUint8(): Promise<RGBABytes> {
    throw new Error("implement me");
  }

  fromUint8(data: Uint8Array | Uint8ClampedArray): Promise<unknown> {
    throw new Error("implement me");
  }

  toFloat32(): Promise<Float32Array> {
    //returns a promise
    throw new Error("implement me");
  }

  copyTo(b: ImageDataType) {
    //copies settings, not data!
    b.width = this.width;
    b.height = this.height;
  }

  fromFloat32(data: Float32Array): Promise<unknown> {
    //returns promise
    throw new Error("implement me");
  }

  /* NOTE: the executor never calls accept, so this promise never settles and
     the then() below has never run.  Nothing in-tree calls copy(). */
  copy() {
    //returns promise
    return new Promise<Float32Array>((accept, reject) => {
      return this.toFloat32();
    }).then((f32) => {
      let ret = new this.constructor();

      this.copyTo(ret);
      return ret.fromFloat32(f32);
    });
  }

  compress() {}

  decompress(data?: Uint8Array): Promise<unknown> {
    //returns a Promise
    return new Promise((accept, reject) => {});
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);

    if (this.compressedData.length > 0) {
      //  this.decompress(data);
    }
  }
}

ImageDataType.STRUCT = `
imagecanvas.ImageDataType {
  compressedData : array(byte) | this.compress();
  width          : int;
  height         : int;
  x              : int;
  y              : int;
}
`;
nstructjs.register(ImageDataType);

export const IRecalcFlags = {
  UPDATE       : 1,
  COMPRESS_DATA: 2,
};

export class SimpleImageData extends ImageDataType {
  static STRUCT: string;

  /* NOTE: never assigned -- this class is the canvas2d fallback and never
     reaches the GPU. */
  glTex: Texture | undefined;
  data: ImageData | undefined;
  ready: boolean;
  recalcFlag: number;

  constructor() {
    super();

    this.glTex = undefined;

    this.data = undefined;
    this.ready = false;
    this.recalcFlag = IRecalcFlags.UPDATE;
  }

  getData() {
    if (!this.data) {
      this.data = new ImageData(this.width, this.height);
    }

    return this.data;
  }

  toUint8() {
    return new Promise<RGBABytes>((accept, reject) => {
      if (this.data) {
        accept(this.data.data);
      }
    });
  }

  fromUint8(data: Uint8Array | Uint8ClampedArray) {
    return new Promise((accept, reject) => {
      let data2 = this.getData();

      data2.data.set(data);
      accept(this);
    });
  }

  toFloat32() {
    return new Promise<Float32Array>((accept, reject) => {
      if (!this.data) {
        return;
      }

      let data = this.data.data;
      let fdata = new Float32Array(data.length);

      let mul = 1.0 / 255.0;

      for (let i = 0; i < data.length; i++) {
        fdata[i] = data[i] * mul;
      }

      accept(fdata);
    });
  }

  fromFloat32(fdata: Float32Array) {
    return new Promise((accept, reject) => {
      let data = this.getData().data;

      for (let i = 0; i < fdata.length; i++) {
        data[i] = ~~(fdata[i] * 255);
      }

      accept(this);
    });
  }

  flagUpdate() {
    this.recalcFlag |= IRecalcFlags.UPDATE | IRecalcFlags.COMPRESS_DATA;
  }

  compress() {
    if (
      !(this.recalcFlag & IRecalcFlags.COMPRESS_DATA) &&
      this.compressedData &&
      this.compressedData.length > 0
    ) {
      return this.compressedData;
    }

    let canvas = document.createElement("canvas");
    let g = canvas.getContext("2d")!;
    canvas.width = this.width;
    canvas.height = this.height;
    /* NOTE: the destination x,y were missing, so this threw. */
    g.putImageData(this.getData(), 0, 0);

    let data = canvas.toDataURL("image/png");
    let i = data.search("base64,");
    let header = data.slice(0, i);

    data = data.slice(7, data.length).trim();
    data = atob(data);

    let bytes = new Uint8Array(data.length + header.length + 1);

    let bi = 0;
    bytes[bi++] = header.length;
    for (let i = 0; i < header.length; i++) {
      bytes[bi++] = header.charCodeAt(i);
    }

    for (let i = 0; i < data.length; i++) {
      bytes[bi++] = data.charCodeAt(i);
    }

    this.recalcFlag &= ~IRecalcFlags.COMPRESS_DATA;
    this.compressedData = bytes;
  }

  decompress() {
    this.ready = false;

    let data = this.compressedData;
    let s = "";

    let bi = 0;

    let header = "";
    let tot = data[bi++];

    for (let i = 0; i < tot; i++) {
      header += String.fromCharCode(data[bi++]);
    }
    header += "base64,";

    for (let i = 0; i < data.length; i++) {
      s += String.fromCharCode(data[bi++]);
    }

    let url = header + btoa(s);

    return new Promise((accept, reject) => {
      let img = document.createElement("img");

      img.src = url;
      img.onload = () => {
        if (this.ready) {
          return;
        }

        let canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        let g = canvas.getContext("2d")!;

        g.drawImage(img, 0, 0);
        let data = g.getImageData(0, 0, canvas.width, canvas.height);

        this.data = data;
        this.ready = true;

        accept(this);
      };
    });
  }

  static imageDataDefine() {
    return {
      typeName: "simple",
    };
  }
}

SimpleImageData.STRUCT =
  nstructjs.inherit(SimpleImageData, ImageDataType, "imagecanvas.SimpleImageData") +
  `
}`;
nstructjs.register(SimpleImageData);

ImageDataType.register(SimpleImageData);

let fillcache = new Map<string, RGBABytes>();

export class FillColorImage extends ImageDataType {
  static STRUCT: string;

  color: Vector4;

  constructor(width?: number, height?: number) {
    super(width, height);
    this.color = new Vector4([1.0, 1.0, 1.0, 1.0]);
  }

  /* NOTE: the key loop called toFixed() on the whole Vector4, which threw a
     TypeError, so this method has never returned anything.  Two further bugs
     are left as they stand: a cache hit accepts and then keeps going to build
     a second buffer, and the alpha channel is filled from `b`. */
  toUint8() {
    return new Promise<RGBABytes>((accept, reject) => {
      let key = this.width + ":" + this.height + ":";
      for (const i of IndexRange(4)) {
        let f = this.color[i].toFixed(4);
        key += f + ":";
      }

      let ret = fillcache.get(key);

      if (ret) {
        accept(ret);
      }

      ret = new Uint8ClampedArray(this.width * this.height * 4);
      fillcache.set(key, ret);

      let r = ~~(this.color[0] * 255);
      let g = ~~(this.color[1] * 255);
      let b = ~~(this.color[2] * 255);
      let a = ~~(this.color[3] * 255);

      for (let i = 0; i < ret.length; i += 4) {
        ret[i] = r;
        ret[i + 1] = g;
        ret[i + 2] = b;
        ret[i + 3] = b;
      }

      accept(ret);
    });
  }

  fromUint8(u8: Uint8Array | Uint8ClampedArray) {
    this.color[0] = u8[0] / 255;
    this.color[1] = u8[1] / 255;
    this.color[2] = u8[2] / 255;
    this.color[3] = u8[3] / 255;

    return new Promise((accept, reject) => {
      accept(this);
    });
  }
}

FillColorImage.STRUCT =
  nstructjs.inherit(FillColorImage, ImageDataType, "imagecanvas.FillColorImage") +
  `
  color : vec4;
}
`;

export const DataTypes = {
  UINT8  : 0,
  UINT16 : 1,
  UINT32 : 2,
  FLOAT16: 3,
  FLOAT32: 4,
};

export class TiledImage extends ImageDataType {
  static STRUCT: string;

  tiles: ImageDataType[];
  tilesize: number;
  /* Fill color every tile starts out at. */
  bgcolor: Vector4;

  /* NOTE: super() was called bare and width/height assigned after it, so a
     no-argument TiledImage -- which is how ImageDataSocket builds one -- got
     undefined for both and NaN tile counts out of initTiles(). */
  constructor(width = 1, height = 1, tilesize = TILESIZE) {
    super(width, height);

    this.tiles = [];
    this.tilesize = tilesize;

    this.bgcolor = new Vector4([1, 1, 1, 0]);
  }

  static imageDataDefine() {
    return {
      typeName: "tiled_image",
    };
  }

  initTiles() {
    let tilex = Math.ceil(this.width / this.tilesize);
    let tiley = Math.ceil(this.height / this.tilesize);

    let size = this.tilesize;

    for (let y = 0; y < tiley; y++) {
      for (let x = 0; x < tilex; x++) {
        let x2 = x * size;
        let y2 = y * size;

        let tile = new FillColorImage(size, size);

        tile.color.load(this.bgcolor);
        tile.x = x2;
        tile.y = y2;

        this.tiles.push(tile);
      }
    }
  }

  toUint8() {
    let canvas = document.createElement("canvas");
    let g = canvas.getContext("2d")!;
    canvas.width = this.width;
    canvas.height = this.height;

    let count = 0;
    let tot = this.tiles.length;

    return new Promise<RGBABytes>((accept, reject) => {
      let doTile = (tile: ImageDataType) => {
        tile.toUint8().then((u8) => {
          let im = new ImageData(u8, tile.width, tile.height);

          g.putImageData(im, tile.x, tile.y);

          if (count++ === tot) {
            accept(g.getImageData(0, 0, canvas.width, canvas.height).data);
          }
        });
      };

      for (let tile of this.tiles) {
        doTile(tile);
      }
    });
  }

  fromUint8(u8: Uint8Array | Uint8ClampedArray) {
    let canvas = document.createElement("canvas");
    let g = canvas.getContext("2d")!;
    canvas.width = this.width;
    canvas.height = this.height;

    let im = new ImageData(new Uint8ClampedArray(u8), this.width, this.height);
    g.putImageData(im, 0, 0);

    if (this.tiles.length === 0) {
      return new Promise((accept, reject) => accept(this));
    }

    let count = 0;
    let tot = this.tiles.length;

    return new Promise((accept, reject) => {
      for (let tile of this.tiles) {
        let data = g.getImageData(tile.x, tile.y, tile.width, tile.height);

        /* NOTE: this handed the tile the whole ImageData rather than its
           bytes, which neither leaf implementation can consume. */
        tile.fromUint8(data.data).then(() => {
          tot++;

          //done loading?
          if (tot === count) {
            accept(this);
          }
        });
      }
    });
  }

  flagUpdate(x: number, y: number, w: number, h: number) {
    for (let tile of this.tiles) {
      tile.flagUpdate(x, y, w, h);
    }
  }

  compress() {
    for (let tile of this.tiles) {
      tile.compress();
    }
  }

  decompress() {
    let tot = 0;

    return new Promise((accept, reject) => {
      let finish = () => {
        tot++;

        if (tot === this.tiles.length) {
          accept(this);
        }
      };

      for (let tile of this.tiles) {
        tile.decompress().then(finish);
      }
    });
  }
}

TiledImage.STRUCT =
  nstructjs.inherit(TiledImage, ImageDataType) +
  `
  tiles    : abstract(imagecanvas.ImageDataType);
  tilesize : int;
  bgcolor  : vec4;
}
`;
ImageDataType.register(TiledImage);

export class ImageDataSocket extends NodeSocketType {
  image: TiledImage;

  constructor() {
    super();

    this.image = new TiledImage();
  }

  static nodedef() {
    return {
      name  : "image",
      uiname: "Image",
    };
  }

  setValue(image: TiledImage) {
    this.image = image;
  }

  getValue() {
    return this.image;
  }

  copyTo(b: ImageDataSocket) {
    b.image = this.image;
  }
}

/* NOTE: this registered ImageDataType, which is not a socket class, so
   ImageDataSocket has never been registered. */
NodeSocketType.register(ImageDataSocket);

export class ImageNode extends GraphNode {
  static nodedef() {
    return {
      name   : "",
      uiName : "",
      inputs : {},
      outputs: {},
      flag   : 0,
      icon   : -1,
    };
  }
}

export class ImageGraph {
  graph: Graph;

  constructor() {
    this.graph = new Graph();
  }
}

export class ImageCanvas extends DataBlock {
  static STRUCT: string;

  width: number;
  height: number;
  /* One of the DataTypes above. */
  dataType: number;
  /* undefined means "inherit the screen dpi"; serialized as -1. */
  dpi: number | undefined;
  x: number;
  y: number;
  layers: ImageDataType[];

  constructor() {
    super();

    this.width = 512;
    this.height = 512;
    this.dataType = DataTypes.UINT16;
    this.dpi = undefined;
    this.x = 0;
    this.y = 0;

    this.layers = [];
  }

  static blockDefine() {
    return {
      typeName   : "image_canvas",
      uiName     : "Image Canvas",
      defaultName: "Image Canvas",
      typeIndex  : 11,
    };
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
    super.loadSTRUCT(reader);

    if (this.dpi === -1) {
      this.dpi = undefined;
    }
  }
}

ImageCanvas.STRUCT =
  nstructjs.inherit(ImageCanvas, DataBlock) +
  `
  width    : int;
  height   : int;
  x        : float;
  y        : float;
  dataType : int;
  dpi      : float | this.dpi === undefined ? -1 : this.dpi;
}
`;

nstructjs.register(ImageCanvas);
DataBlock.register(ImageCanvas);
