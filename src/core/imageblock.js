import {DataBlock, DataTypes, BlockFlags} from './lib_api.js';
import {STRUCT} from './struct.js';
import {ModalStates} from './toolops_api.js';
import {SelMask} from '../editors/viewport/selectmode.js';
import {SessionFlags} from '../editors/viewport/view2d_editor.js';
import * as strutils from '../util/strutils.js';

import '../path.ux/scripts/util/vectormath.js';

export var ImageFlags = {
  SELECT : 1,
  VALID  : 2
};

export class Image extends DataBlock {
  path : string;

  constructor(name="Image") {
    super(DataTypes.IMAGE, name);
    
    this.path = "";
    this.data = undefined;
    this.size = [-1, -1];
    
    this._dom = undefined;
  }
  
  get_dom_image() {
    if (this._dom == undefined) {
      var img = document.createElement("img");
      var mimetype = "image/png";
      
      if (this.path != undefined) {
        var p = this.path.toLowerCase();
        if (p.endsWith(".jpg"))
          mimetype = "image/jpeg";
        else if (p.endsWith(".bmp"))
          mimetype = "image/bitmap";
        else if (p.endsWith(".gif"))
          mimetype = "image/gif";
        else if (p.endsWith(".tif"))
          mimetype = "image/tiff";
      }
      
      if (this.data != undefined) {
        img.src = strutils.encode_dataurl(mimetype, this.data);
      }
      
      this._dom = img;
    }
    
    return this._dom;
  }


  loadSTRUCT(reader) {
    reader(this);
    super.loadSTRUCT(reader);

    if (this.data.length === 0) {
      this.data = undefined;
    }

    this.afterSTRUCT();
  }
}

Image.STRUCT = STRUCT.inherit(Image, DataBlock) + `
  path  : string;
  width : array(int);
  data  : arraybuffer;
}
`;

export class ImageUser {
  off : Vector2
  scale : Vector2
  flag : number;

  constructor() {
    this.off = new Vector2([0, 0]);
    this.scale = new Vector2([1, 1]);
    this.image = undefined;
    this.flag = 0;
  }
  
  data_link(DataBlock block, Function getblock, Function getblock_us) {
    this.image = getblock(this.image); //XXX should use getblock_us?
  }
  
  static fromSTRUCT(reader) {
    var ret = new ImageUser();
    
    reader(ret);
    
    return ret;
  }
}

ImageUser.STRUCT = `
ImageUser {
  off   : vec2;
  scale : vec2;
  image : dataref(Image);
  flag  : int;
}
`;
