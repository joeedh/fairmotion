import {
  FileDialog, FileOpenOp, FileSaveAsOp, FileNewOp,
  FileSaveOp, ProgressDialog, LoginDialog, FileSaveSTLOp,
  FileSaveB64Op, FileDialog, error_dialog, import_json,
  download_file
} from 'dialogs';

import {DeleteVertOp, DeleteSegmentOp, DeleteFaceOp,
       ChangeFaceZ, SplitEdgeOp, DuplicateOp,
       DisconnectHandlesOp} from 'spline_editops';

import {ToolOp, ToolMacro, ToolFlags, UndoFlags} from 'toolops_api';
import {EditModes} from 'view2d';

import 'transform';
import 'spline_selectops';
import 'spline_createops';
import 'spline_editops';
import 'spline_animops';
import 'spline_layerops';
import 'FrameManager';
import 'FrameManager_ops';

eval(es6_import_all(_es6_module, 'transform') + "\n");
eval(es6_import_all(_es6_module, 'spline_selectops'));
eval(es6_import_all(_es6_module, 'spline_createops'));
eval(es6_import_all(_es6_module, 'spline_editops'));
eval(es6_import_all(_es6_module, 'spline_animops'));
eval(es6_import_all(_es6_module, 'spline_layerops'));
eval(es6_import_all(_es6_module, 'FrameManager_ops'));

import {RenderAnimOp, PlayAnimOp} from 'view2d_spline_ops';
import {SessionFlags} from "view2d_editor";

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
      
      console.log("=====", ctx.view2d.session_flag, ctx.view2d.propradius);
      
      if (ctx.view2d.session_flag & SessionFlags.PROP_TRANSFORM) {
        op.inputs.proportional.set_data(true);
        op.inputs.propradius.set_data(ctx.view2d.propradius);
      }
        
      return op;
    },
    
    "spline.rotate": function(ctx, args) {
      var op = new RotateOp(EditModes.GEOMETRY, ctx.object);
      
      if (ctx.view2d.session_flag & SessionFlags.PROP_TRANSFORM) {
        op.inputs.proportional.set_data(true);
        op.inputs.propradius.set_data(ctx.view2d.propradius);
      }
        
      return op;
    },
    
    "spline.scale": function(ctx, args) {
      var op = new ScaleOp(EditModes.GEOMETRY, ctx.object);
      
      if (ctx.view2d.session_flag & SessionFlags.PROP_TRANSFORM) {
        op.inputs.proportional.set_data(true);
        op.inputs.propradius.set_data(ctx.view2d.propradius);
      }
        
      return op;
    },
    
    "mesh.inset_loops": function(ctx, args) {
      return new InsetOp();
    },
    
    "mesh.flip_normals": function(ctx, args) {
      if (!("faces" in args))
        throw TinyParserError;
      
      return new MeshToolOp(new FlipNormalsOp(args["faces"]));      
    },
    
    /*"editor.import_json": function(ctx, args) {
      return new ImportJSONOp();
    },*/
    
    "spline.key_edges": function(ctx, args) {
      return new KeyEdgesOp();
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
    
    "spline.select_linked" : function(ctx, args) {
      var op = new SelectLinkedOp();
      return op;
    },
    
    "mesh.triangulate" : function(ctx, args) {
      if (!("faces" in args))
        throw TinyParserError;
        
      return new MeshToolOp(new TriangulateOp(args["faces"]));
    },
    "mesh.tri2quad" : function(ctx, args) {
      if (!("faces" in args))
        throw TinyParserError;
        
      return new MeshToolOp(new Tri2QuadOp(args["faces"]));
    }, 
    "mesh.add_cube" : function(ctx, args) {
      return new MeshToolOp(new AddCubeOp());
    }, 
    "mesh.add_circle" : function(ctx, args) {
      return new MeshToolOp(new AddCircleOp());
    },
    "mesh.dissolve_faces" : function(ctx, args) {
      if (!("faces" in args))
          throw TinyParserError;
          
      return new MeshToolOp(new DissolveFacesOp(args["faces"]));
    },
    "mesh.edgeloop_select" : function(ctx, args) {
      return new EdgeLoopOp();
    },
    "mesh.edgeloop_select_modal" : function(ctx, args) {
      return new EdgeLoopOpModal();
    },
    "mesh.faceloop_select" : function(ctx, args) {
      return new FaceLoopOp();
    },
    "mesh.faceloop_select_modal" : function(ctx, args) {
      return new FaceLoopOpModal();
    },    
    "mesh.loopcut" : function(ctx, args) {
      return new LoopCutOp();
    },
    "mesh.context_create" : function(ctx, args) {
      if (!("verts" in args))
        throw TinyParserError;
        
      return new MeshToolOp(new ContextCreateOp(args["verts"]));
    },
    "mesh.toggle_subsurf" : function(ctx, args) {
      return new ToggleSubSurfOp();
    },
    "mesh.bridge_edges" : function(ctx, args) {
      if (!("edges" in args))
        throw TinyParserError;
      
      return new MeshToolOp(new BridgeOp(args["edges"], args["faces"]));
    },
    "mesh.normals_outside" : function(ctx, args) {
      if (!("faces" in args))
        throw TinyParserError;
      
      return new MeshToolOp(new OutsideNormalsOp(args["faces"]));
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
    "appstate.export_stl" : function(ctx, args) {
      return new FileSaveSTLOp();
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