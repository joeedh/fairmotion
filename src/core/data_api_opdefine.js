import {
  FileDialog, FileOpenOp, FileSaveAsOp, FileNewOp,
  FileSaveOp, ProgressDialog, LoginDialog, FileSaveSVGOp,
  FileSaveB64Op, FileDialog, error_dialog, import_json,
  download_file, FileOpenRecentOp
} from 'dialogs';

import {LoadImageOp} from 'image_ops';

import {DeleteVertOp, DeleteSegmentOp, DeleteFaceOp,
       ChangeFaceZ, SplitEdgeOp, DuplicateOp,
       DisconnectHandlesOp, SplitEdgePickOp} from 'spline_editops';

import {ToolOp, ToolMacro, ToolFlags, UndoFlags} from 'toolops_api';
import {EditModes} from 'view2d';

import * as transform from 'transform';
import * as spline_selectops from 'spline_selectops';
import * as spline_createops from 'spline_createops';
import * as spline_editops  from 'spline_editops';
import * as spline_animops from 'spline_animops';
import * as spline_layerops from 'spline_layerops';
import * as FrameManager from 'FrameManager';
import * as FrameManager_ops from 'FrameManager_ops';
import * as safe_eval from 'safe_eval';

import {TransSplineVert, TransData, TransformOp, TranslateOp, ScaleOp, RotateOp} from 'transform';

import {SelectOpBase, SelectOneOp, ToggleSelectAllOp, SelectLinkedOp, HideOp, UnhideOp, CircleSelectOp} from 'spline_selectops';
import {ExtrudeModes, ExtrudeVertOp, CreateEdgeOp, CreateEdgeFaceOp, ImportJSONOp} from 'spline_createops';
import {KeyCurrentFrame, ShiftLayerOrderOp, SplineGlobalToolOp, SplineLocalToolOp, KeyEdgesOp, CopyPoseOp, PastePoseOp, InterpStepModeOp, DeleteVertOp, DeleteSegmentOp, DeleteFaceOp, ChangeFaceZ, DissolveVertOp, SplitEdgeOp, VertPropertyBaseOp, ToggleBreakTanOp, ToggleBreakCurvOp, ConnectHandlesOp, DisconnectHandlesOp, AnimPlaybackOp, ToggleManualHandlesOp, ShiftTimeOp, DuplicateOp, SplineMirrorOp} from 'spline_editops';
import {AddLayerOp, ChangeLayerOp, ChangeElementLayerOp} from 'spline_layerops';
import {SplitAreasTool, CollapseAreasTool, HintPickerOpElement, HintPickerOp} from 'FrameManager_ops';

import {RenderAnimOp, PlayAnimOp} from 'view2d_spline_ops';
import {SessionFlags} from "view2d_editor";
import {ExportCanvasImage} from 'view2d_ops';

import * as theplatform from 'theplatform';
import {SplitEdgePickOp} from "../editors/viewport/spline_editops";

class QuitFileOp extends ToolOp {
  static tooldef() {return {
    uiname   : "Quit",
    apiname  : "appstate.quit",
    is_modal : true,
    inputs   : {},
    outputs  : {},
    undoflag : UndoFlags.IGNORE_UNDO
  }}
  
  start_modal(ctx) {
    super.start_modal(ctx);
    this.end_modal(ctx);
  
    theplatform.app.quitApp();
  }
}

//import {TranslateOp} from 'transform';

global data_ops_list = undefined;

window.api_define_ops = function() {
  data_ops_list = {
    "mesh.subdivide": function(ctx, args) {
      if (!("faces" in args))
        throw TinyParserError;
        
      return new MeshToolOp(new QuadSubdOp(args["faces"], 1))
    },
    
    "mesh.inset": function(ctx, args) {
      if (!("faces" in args))
        throw TinyParserError;
      
      return new MeshToolOp(new InsetRegionsOp(args["faces"]))
    },
    
    "mesh.vertsmooth": function(ctx, args) {
      if (!("verts" in args))
        throw TinyParserError;
      
      return new MeshToolOp(new VertSmoothOp(args["verts"]));
    },

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
        op.inputs.datamode.set_data(args["datamode"]);
      }

      op.inputs.edit_all_layers.set_data(ctx.view2d.edit_all_layers);

      console.log("=====", args, ctx.view2d.session_flag, ctx.view2d.propradius);
      //op.inputs.datamode.set_data(ctx.view2d.selectmode);
      
      if (ctx.view2d.session_flag & SessionFlags.PROP_TRANSFORM) {
        op.inputs.proportional.set_data(true);
        op.inputs.propradius.set_data(ctx.view2d.propradius);
      }
        
      return op;
    },
    
    "spline.rotate": function(ctx, args) {
      var op = new RotateOp(EditModes.GEOMETRY, ctx.object);

      if ("datamode" in args) {
        op.inputs.datamode.set_data(args["datamode"]);
      }

      op.inputs.edit_all_layers.set_data(ctx.view2d.edit_all_layers);

      //op.inputs.datamode.set_data(ctx.view2d.selectmode);
      
      if (ctx.view2d.session_flag & SessionFlags.PROP_TRANSFORM) {
        op.inputs.proportional.set_data(true);
        op.inputs.propradius.set_data(ctx.view2d.propradius);
      }
        
      return op;
    },
    
    "spline.scale": function(ctx, args) {
      var op = new ScaleOp(EditModes.GEOMETRY, ctx.object);

      if ("datamode" in args) {
        op.inputs.datamode.set_data(args["datamode"]);
      }

      op.inputs.edit_all_layers.set_data(ctx.view2d.edit_all_layers);

      //op.inputs.datamode.set_data(ctx.view2d.selectmode);
      
      if (ctx.view2d.session_flag & SessionFlags.PROP_TRANSFORM) {
        op.inputs.proportional.set_data(true);
        op.inputs.propradius.set_data(ctx.view2d.propradius);
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
    
    "editor.playback": function(ctx, args) {
      return new AnimPlaybackOp();
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
      //op.inputs.selmode.set_data(ctx.view2d.selectmode)
      
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
      op.inputs.vertex_eid.set_data(args.vertex_eid);
      
      return op;
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
    "appstate.new" : function(ctx, args) {
      return new FileNewOp();
    },
    
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