import {Image} from '../core/imageblock.js';
import {DataTypes} from '../core/lib_api.js';
import {STRUCT} from '../core/struct.js';
import {IntProperty, FloatProperty, CollectionProperty,
        BoolProperty, StringProperty, TPropFlags, 
        DataRefProperty, ArrayBufferProperty} from '../core/toolprops.js';

import {ToolOp, UndoFlags, ToolFlags, ModalStates} from '../core/toolops_api.js';
import {RestrictFlags, Spline} from '../curve/spline.js';
import {VDAnimFlags} from '../core/frameset.js';
import {TPropFlags} from '../core/toolprops.js';
import '../path.ux/scripts/struct.js'; //get istruct
import {redo_draw_sort} from '../curve/spline_draw.js';

//$XXX import {FileDialog, FileDialogModes, file_dialog, download_file} from 'dialogs';

import * as config from '../config/config.js';
import * as html5_fileapi from '../core/fileapi.js';

export class LoadImageOp extends ToolOp {
  static tooldef() { return {
    apiname  : "image.load_image",
    uiname   : "Load Image",
    
    inputs   : {
      name          : new StringProperty("Image"),
      dest_datapath : new StringProperty(""),
      imagedata     : new ArrayBufferProperty(),
      imagepath     : new StringProperty("")
    },
    
    outputs  : {
      block : new DataRefProperty(undefined, [DataTypes.IMAGE])
    },
    
    icon     : -1,
    is_modal : true
  }}
  
  constructor(datapath="", name="") {
    super();
    
    datapath = ""+datapath;
    name = ""+name;
    
    this.inputs.dest_datapath.set_data(datapath);
    this.inputs.name.set_data(name)
  }
  
  start_modal(ctx) {
    super.start_modal(ctx);
    
    console.log("modal start!", ctx);
    this.end_modal();
    
    var this2 = this;
    
    if (config.USE_HTML5_FILEAPI) {
      html5_fileapi.open_file(function(buffer, name) {
        console.log("loaded image!", buffer, buffer.byteLength);
        
        this2.inputs.imagedata.set_data(buffer);
        this2.inputs.imagepath.set_data(name);
        this2.exec(ctx);
      }, this, false, "Images", ["png", "jpg", "bmp", "tiff", "gif", "tga", "targa", "ico", "exr"]);
      
      return;
    }
  }
  
  exec(ctx) {
    //XXX eek! inputs.dest_datapath could refer to a UI structure!
    ctx = new Context();
    
    var name = this.inputs.name.data.trim();
    name = name == "" ? undefined : name;
    
    var image = new Image(name);
    ctx.datalib.add(image);
    
    image.path = this.inputs.imagepath.data;
    image.data = this.inputs.imagedata.data;
    
    this.outputs.block.set_data(image);
    var outpath = this.inputs.dest_datapath.data.trim();
    
    if (outpath != "") {
      ctx.api.setValue(ctx, outpath, image);
    }
  }
}
