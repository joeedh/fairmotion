import {DataBlock, DataTypes, BlockFlags} from 'lib_api';
import {STRUCT} from 'struct';
import {ModalStates} from 'toolops_api';
import {USE_NACL} from 'config';
import {SelMask} from 'selectmode';
import {SessionFlags} from 'view2d_editor';
import * as strutils from 'strutils';

import 'J3DIMath';

export var ImageFlags = {
  SELECT : 1,
  VALID  : 2
};

export class Image extends DataBlock {
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
  
  static fromSTRUCT(reader) {
    var ret = STRUCT.chain_fromSTRUCT(Image, reader);
    
    if (ret.data.length == 0) {
      ret.data = undefined;
    }
    
    return ret;
  }
}

Image.STRUCT = STRUCT.inherit(Image, DataBlock) + """
  path  : string;
  width : array(int);
  data  : arraybuffer;
}
""";

export class ImageUser {
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

ImageUser.STRUCT = """
ImageUser {
  off   : vec2;
  scale : vec2;
  image : dataref(Image);
  flag  : int;
}
""";
