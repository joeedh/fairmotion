import { Image } from "../core/imageblock.js";
import { DataTypes } from "../core/lib_api.js";
import { STRUCT } from "../core/struct.js";
import {
  IntProperty,
  FloatProperty,
  CollectionProperty,
  BoolProperty,
  StringProperty,
  TPropFlags,
  DataRefProperty,
  ArrayBufferProperty,
} from "../core/toolprops.js";

import { ToolOp, UndoFlags, ToolFlags, ModalStates } from "../core/toolops_api.js";
import { RestrictFlags, Spline } from "../curve/spline.js";
import { VDAnimFlags } from "../core/frameset.js";
import "../path.ux/scripts/util/struct.js"; //get istruct
import { redo_draw_sort } from "../curve/spline_draw.js";
import type { FullContext } from "../core/context.js";

//$XXX import {FileDialog, FileDialogModes, file_dialog, download_file} from 'dialogs';
import { platform, Vector2 } from "../path.ux/scripts/pathux.js";

import * as config from "../config/config.js";
import * as html5_fileapi from "../core/fileapi/fileapi.js";

export class LoadImageOp extends ToolOp<
  {
    name: StringProperty;
    dest_datapath: StringProperty;
    imagedata: ArrayBufferProperty;
    imagepath: StringProperty;
  },
  {
    block: DataRefProperty;
  }
> {
  static tooldef() {
    return {
      toolpath: "image.load_image",
      uiname  : "Load Image",

      inputs: {
        name         : new StringProperty("Image"),
        dest_datapath: new StringProperty(""),
        imagedata    : new ArrayBufferProperty(),
        imagepath    : new StringProperty(""),
      },

      outputs: {
        block: new DataRefProperty(undefined, [DataTypes.IMAGE]),
      },

      icon    : -1,
      is_modal: true,
    };
  }

  constructor(datapath = "", name = "") {
    super();

    datapath = "" + datapath;
    name = "" + name;

    this.inputs.dest_datapath.setValue(datapath);
    this.inputs.name.setValue(name);
  }

  async modalStart(ctx: FullContext) {
    super.modalStart(ctx);
    super.modalEnd(false);

    let this2 = this;

    console.log("PLATFORM!", platform.platform);

    platform.platform
      .showOpenDialog("Open Image", {
        multi          : false,
        addToRecentList: false,
        filters: [
          {
            name      : "Images",
            mime      : "image",
            extensions: ["png", "jpg", "bmp", "tif", "tga", "svg", "webp"],
          },
        ],
      })
      .then((files) => {
        console.log("Files", files);

        let file = files[0];
        this.inputs.imagepath.setValue("" + file.filename);

        let name = "" + file.filename;
        if (name.search("/") >= 0) {
          let i = name.length - 1;
          while (i >= 0 && name[i] !== "/" && name[i] !== "\\") {
            i--;
          }

          if (name[i] === "/" || name[i] === "\\") {
            i++;
          }

          name = name.slice(i, name.length).trim();
        }

        if (name.length === 0) {
          name = "unnamed";
        }

        /* NOTE: this discards the basename computed just above and stores the
         whole path again. */
        this.inputs.name.setValue("" + file.filename);

        platform.platform.readFile(file, "application/x-octet-stream").then((buf) => {
          /* readFile() decodes to a string for text mimes; this one is binary. */
          if (typeof buf === "string") {
            ctx.error("failed to read " + file.filename);
            return;
          }

          this.inputs.imagedata.setValue(buf);
          this.exec(ctx);
        });
      })
      .catch((error) => {
        ctx.error(error.message);
      });
  }

  exec(ctx: FullContext) {
    //XXX eek! inputs.dest_datapath could refer to a UI structure!
    /* NOTE: `Context` is not imported in this module, so this throws
       ReferenceError. */
    ctx = new Context();

    let namestr = this.inputs.name.data.trim();
    let name = namestr === "" ? undefined : namestr;

    let image = new Image(name);
    ctx.datalib.add(image);

    image.path = this.inputs.imagepath.data;
    /* loadSTRUCT() leaves an ArrayBuffer behind where setValue() leaves a
       Uint8Array; _getDataU8() is the property's own normalizer for that. */
    image.data = this.inputs.imagedata._getDataU8();

    this.outputs.block.setValue(image);
    let outpath = this.inputs.dest_datapath.data.trim();

    if (outpath !== "") {
      ctx.api.setValue(ctx, outpath + ".image", image);

      let scale = new Vector2(ctx.api.getValue(ctx, outpath + ".scale"));
      let avg = scale[0] * 0.5 + scale[1] * 0.5;
      scale[0] = scale[1] = avg;

      ctx.api.setValue(ctx, outpath + ".scale", scale);
    }
  }
}
