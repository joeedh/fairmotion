import {Image} from 'imageblock';
import {DataTypes} from 'lib_api';
import {STRUCT} from 'struct';
import {IntProperty, FloatProperty, CollectionProperty,
        BoolProperty, StringProperty, TPropFlags, 
        DataRefProperty, ArrayBufferProperty} from 'toolprops';

import {ToolOp, UndoFlags, ToolFlags, ModalStates} from 'toolops_api';
import {RestrictFlags, Spline} from 'spline';
import {VDAnimFlags} from 'frameset';
import {TPropFlags} from 'toolprops';
import {istruct} from 'struct';
import {redo_draw_sort} from 'spline_draw';

import {FileDialog, FileDialogModes, file_dialog, download_file} from 'dialogs';


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
    
    file_dialog(FileDialogModes.OPEN, ctx, function(dialog, path) {
      console.log("path!:", path);
      
      download_file(path, function(dataview) {
        var buffer = dataview.buffer;
        
        console.log("loaded image!", buffer, buffer.byteLength);
        
        this2.inputs.imagedata.set_data(buffer);
        this2.inputs.imagepath.set_data(path);
        this2.exec(ctx);
      }, undefined, true);
    }, undefined, /\.(png|jpg|gif|bmp|tif|exr|jpeg|ico)/);
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
      ctx.api.set_prop(ctx, outpath, image);
    }
  }
}