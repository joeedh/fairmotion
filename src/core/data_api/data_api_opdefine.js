/*
Refactor TODO:

- Auto-register toolops in data_api_pathux.js
- Move invokation snippets from this file into the relevant toolops
*/

/* $XXX
import {
  FileDialog, FileOpenOp, FileSaveAsOp,
  FileSaveOp, ProgressDialog, LoginDialog, FileSaveSVGOp,
  FileSaveB64Op, FileDialog, error_dialog, import_json,
  download_file, FileOpenRecentOp
} from 'dialogs';
*/

import {LoadImageOp} from '../../image/image_ops.js';

import {DeleteVertOp, DeleteSegmentOp, DeleteFaceOp,
       ChangeFaceZ, SplitEdgeOp, DuplicateOp,
       DisconnectHandlesOp, SplitEdgePickOp} from '../../editors/viewport/spline_editops.js';

import {DeleteKeysOp} from "../../editors/dopesheet/dopesheet_ops_new.js";
import {ToolOp, ToolMacro, ToolFlags, UndoFlags} from '../toolops_api.js';
import {EditModes} from '../../editors/viewport/view2d.js';

import * as transform from '../../editors/viewport/transform.js';
import * as spline_selectops from '../../editors/viewport/spline_selectops.js';
import * as spline_createops from '../../editors/viewport/spline_createops.js';
import * as spline_editops  from '../../editors/viewport/spline_editops.js';
import * as spline_animops from '../../editors/viewport/spline_animops.js';
import * as spline_layerops from '../../editors/viewport/spline_layerops.js';
import * as FrameManager from '../../path.ux/scripts/screen/FrameManager.js';
import * as FrameManager_ops from '../../path.ux/scripts/screen/FrameManager_ops.js';
import * as safe_eval from '../safe_eval.js';

import {TransformOp, TranslateOp, ScaleOp, RotateOp} from '../../editors/viewport/transform.js';
import {TransSplineVert} from '../../editors/viewport/transform_spline.js';
import {TransData} from '../../editors/viewport/transdata.js';

import {SelectOpBase, SelectOneOp, ToggleSelectAllOp, SelectLinkedOp, HideOp, UnhideOp, CircleSelectOp} from '../../editors/viewport/spline_selectops.js';
import {ExtrudeModes, ExtrudeVertOp, CreateEdgeOp, CreateEdgeFaceOp, ImportJSONOp} from '../../editors/viewport/spline_createops.js';
import {KeyCurrentFrame, ShiftLayerOrderOp, SplineGlobalToolOp, SplineLocalToolOp, KeyEdgesOp, CopyPoseOp, PastePoseOp, InterpStepModeOp, DeleteVertOp, DeleteSegmentOp, DeleteFaceOp, ChangeFaceZ, DissolveVertOp, SplitEdgeOp, VertPropertyBaseOp, ToggleBreakTanOp, ToggleBreakCurvOp, ConnectHandlesOp, DisconnectHandlesOp, ToggleManualHandlesOp, ShiftTimeOp, DuplicateOp, SplineMirrorOp} from '../../editors/viewport/spline_editops.js';
import {AddLayerOp, ChangeLayerOp, ChangeElementLayerOp} from '../../editors/viewport/spline_layerops.js';
//import {SplitAreasTool, CollapseAreasTool, HintPickerOpElement, HintPickerOp} from 'FrameManager_ops';

import {RenderAnimOp, PlayAnimOp} from '../../editors/viewport/view2d_spline_ops.js';
import {SessionFlags} from "../../editors/viewport/view2d_editor.js";
import {ExportCanvasImage} from '../../editors/viewport/view2d_ops.js';

import * as theplatform from '../../../platforms/Electron/theplatform.js';
import {SplitEdgePickOp} from "../../editors/viewport/spline_editops.js";

class QuitFileOp extends ToolOp {
  static tooldef() {return {
    uiname   : "Quit",
    apiname  : "appstate.quit",
    is_modal : true,
    inputs   : {},
    outputs  : {},
    undoflag : UndoFlags.NO_UNDO
  }}
  
  
  start_modal(ctx) {
    super.start_modal(ctx);
    this.end_modal(ctx);
  
    theplatform.app.quitApp();
  }
}

//import {TranslateOp} from 'transform';

global data_ops_list = undefined;
import {register_toolops} from "./data_api_pathux.js";

window.api_define_ops = function() {
  register_toolops();

  data_ops_list = {
    "spline.add_layer" : function(ctx, args) {
      return new AddLayerOp(args.name);
    },
    
    "spline.change_face_z" : function(ctx, args) {
      if (!("offset" in args))
        throw new TinyParserError();
      
      return new ChangeFaceZ(parseInt(args["offset"]), parseInt(args["selmode"]));
    },
    
    "spline.toggle_break_curvature" : function(ctx, args) {
      return new ToggleBreakCurvOp();
    },
    
    "spline.toggle_break_tangents" : function(ctx, args) {
      return new ToggleBreakTanOp();
    },
    
    "spline.translate": function(ctx, args) {
      var op = new TranslateOp(EditModes.GEOMETRY, ctx.object);

      if ("datamode" in args) {
        op.inputs.datamode.setValue(args["datamode"]);
      }

      op.inputs.edit_all_layers.setValue(ctx.view2d.edit_all_layers);

      console.log("=====", args, ctx.view2d.session_flag, ctx.view2d.propradius);
      //op.inputs.datamode.setValue(ctx.view2d.selectmode);
      
      if (ctx.view2d.session_flag & SessionFlags.PROP_TRANSFORM) {
        op.inputs.proportional.setValue(true);
        op.inputs.propradius.setValue(ctx.view2d.propradius);
      }
        
      return op;
    },
    
    "spline.rotate": function(ctx, args) {
      var op = new RotateOp(EditModes.GEOMETRY, ctx.object);

      if ("datamode" in args) {
        op.inputs.datamode.setValue(args["datamode"]);
      }

      op.inputs.edit_all_layers.setValue(ctx.view2d.edit_all_layers);

      //op.inputs.datamode.setValue(ctx.view2d.selectmode);
      
      if (ctx.view2d.session_flag & SessionFlags.PROP_TRANSFORM) {
        op.inputs.proportional.setValue(true);
        op.inputs.propradius.setValue(ctx.view2d.propradius);
      }
        
      return op;
    },
    
    "spline.scale": function(ctx, args) {
      var op = new ScaleOp(EditModes.GEOMETRY, ctx.object);

      if ("datamode" in args) {
        op.inputs.datamode.setValue(args["datamode"]);
      }

      op.inputs.edit_all_layers.setValue(ctx.view2d.edit_all_layers);

      //op.inputs.datamode.setValue(ctx.view2d.selectmode);
      
      if (ctx.view2d.session_flag & SessionFlags.PROP_TRANSFORM) {
        op.inputs.proportional.setValue(true);
        op.inputs.propradius.setValue(ctx.view2d.propradius);
      }
        
      return op;
    },
    
    /*"editor.import_json": function(ctx, args) {
      return new ImportJSONOp();
    },*/
    
    "spline.key_edges": function(ctx, args) {
      return new KeyEdgesOp();
    },
    
    "view2d.export_image" : function(ctx, args) {
      return new ExportCanvasImage();
    }, 
    
    "editor.copy_pose": function(ctx, args) {
      return new CopyPoseOp();
    },
    
    "editor.paste_pose": function(ctx, args) {
      return new PastePoseOp();
    },
    
    "spline.key_current_frame" : function(ctx, args) {
      return new KeyCurrentFrame();
    },
    
    "spline.shift_time": function(ctx, args) {
      return new ShiftTimeOp();
    },
    
    "spline.delete_faces": function(ctx, args) {
      return new DeleteFaceOp();
    },
    
    "spline.toggle_manual_handles" : function(ctx, args) {
      return new ToggleManualHandlesOp();
    },
    
    "spline.delete_segments": function(ctx, args) {
      return new DeleteSegmentOp();
    },
    
    "spline.delete_verts": function(ctx, args) {
      return new DeleteVertOp();
    },
    
    "spline.dissolve_verts": function(ctx, args) {
      return new DissolveVertOp();
    },
    
    "spline.make_edge": function(ctx, args) {
      return new CreateEdgeOp(ctx.view2d.default_linewidth);
    },
    "spline.make_edge_face": function(ctx, args) {
      return new CreateEdgeFaceOp(ctx.view2d.default_linewidth);
    },
    
    "spline.split_edges": function(ctx, args) {
      return new SplitEdgeOp();
    },
    
    "spline.split_pick_edge": function(ctx, args) {
      return new SplitEdgePickOp();
    },
    
    "spline.split_pick_edge_transform": function(ctx, args) {
      let ret = new ToolMacro("spline.split_pick_edge_transform", "Split Segment");
      
      let tool = new SplitEdgePickOp();
      let tool2 = new TranslateOp(undefined, 1|2); //XXX import SplineTypes and use instead of this dumb magic number
      
      ret.description = tool.description;
      ret.icon = tool.icon;
      
      ret.add_tool(tool);
      ret.add_tool(tool2);
      
      //XXX stupidly hackish way of passing last mouse position between tools
      tool.on_modal_end = () => {
        let ctx = tool.modal_ctx;
        
        tool2.user_start_mpos = tool.mpos;
        console.log("                 on_modal_end successfully called", tool2.user_start_mpos);
      };
      
      return ret;
    },
    
    "spline.toggle_step_mode": function(ctx, args) {
      return new InterpStepModeOp();
    },
    
    "spline.mirror_verts" : function(ctx, args) {
      return new SplineMirrorOp();
    },
    "spline.duplicate_transform" : function(ctx, args) {
      var tool = new DuplicateOp();
      var macro = new ToolMacro("duplicate_transform", "Duplicate");
      
      macro.description = tool.description;
      
      macro.add_tool(tool);
      macro.icon = tool.icon;
      
      var transop = new TranslateOp(ctx.view2d.mpos, 1|2);
      macro.add_tool(transop);
      
      return macro;
    },
    
    "spline.toggle_select_all" : function(ctx, args) {
      var op = new ToggleSelectAllOp();
      //op.inputs.selmode.setValue(ctx.view2d.selectmode)
      
      return op;
    },
    
    "spline.connect_handles" : function(ctx, args) {
      return new ConnectHandlesOp();
    },
    
    "spline.disconnect_handles" : function(ctx, args) {
      return new DisconnectHandlesOp();
    },
    
    "spline.hide" : function(ctx, args) {
      return new HideOp(args.selmode, args.ghost);
    },
    
    "spline.unhide" : function(ctx, args) {
      return new UnhideOp(args.selmode, args.ghost);
    },
    
    "image.load_image" : function(ctx, args) {
      return new LoadImageOp(args.datapath, args.name);
    },
    
    "spline.select_linked" : function(ctx, args) {
      if (!("vertex_eid" in args)) {
        throw new Error("need a vertex_eid argument");
      }
      
      var op = new SelectLinkedOp();
      op.inputs.vertex_eid.setValue(args.vertex_eid);
      
      return op;
    },

    "anim.delete_keys" : function(ctx, args) {
      return new DeleteKeysOp();
    },

    "view2d.circle_select" : function(ctx, args) {
      return new CircleSelectOp(ctx.view2d.selectmode);
    },
    
    "view2d.render_anim" : function(Ctx, args) {
      return new RenderAnimOp();
    },

    "view2d.play_anim" : function(Ctx, args) {
      return new PlayAnimOp();
    },
    
    "appstate.open" : function(ctx, args) {
      return new FileOpenOp();
    },
    "appstate.open_recent" : function(ctx, args) {
      return new FileOpenRecentOp();
    },
    
    "appstate.export_svg" : function(ctx, args) {
      return new FileSaveSVGOp();
    },
    "appstate.export_al3_b64" : function(ctx, args) {
      return new FileSaveB64Op();
    },
    "appstate.save" : function(ctx, args) {
      return new FileSaveOp();
    },
    "appstate.save_as" : function(ctx, args) {
      return new FileSaveAsOp();
    },
    //"appstate.new" : function(ctx, args) {
      //return new FileNewOp();
    //},
    
    "appstate.quit" : function(ctx, args) {
      return new QuitFileOp();
    },
    
    "screen.area_split_tool" : function(ctx, args) {
      return new SplitAreasTool(g_app_state.screen);
    },
    
    "screen.hint_picker" : function(ctx, args) {
      return new HintPickerOp();
    },
    
    "object.toggle_select_all" : function(ctx, args) {
      return new ToggleSelectObjOp("auto");
    },
    
    "object.translate": function(ctx, args) {
      return new TranslateOp(EditModes.OBJECT, ctx.object);
    },
    
    "object.rotate": function(ctx, args) {
      return new RotateOp(EditModes.OBJECT);
    },  
    
    "object.scale": function(ctx, args) {
      return new ScaleOp(EditModes.OBJECT);
    },
    
    "object.duplicate": function(ctx, args) {
      //XXX someday, will need to support passing in a list of objects
      //through the data api, too
      return new ObjectDuplicateOp(ctx.scene.objects.selected);
    },
    
    "object.set_parent": function(ctx, args) {
      //XXX someday, will need to support passing in a list of objects too
      var op = new ObjectParentOp();
      op.flag |= ToolFlags.USE_DEFAULT_INPUT;
      
      return op;
    },
    
    //XXX someday, will need to support passing in a list of objects too
    "object.delete_selected" : function(ctx, args) {
      var op = new ObjectDeleteOp();
      op.flag |= ToolFlags.USE_DEFAULT_INPUT;
      
      return op;
    }
  }
}