import {BaseContext, FullContext} from "./context.js";
import {ToolFlags, ToolMacro, ToolOp, UndoFlags} from "./toolops_api.js";
import {DataFlags, DataPath, DataStruct, DataStructArray} from "./data_api/data_api.js";
import {CollectionProperty, StringProperty, TPropFlags} from "./toolprops.js";
import * as pathux from '../path.ux/scripts/pathux.js';

import {USE_PATHUX_API} from './const.js';

export class ToolStack extends pathux.ToolStack {
  undocur: number
  undostack: Array
  valcache: any
  appstate: AppState
  do_truncate: boolean;

  constructor(appstate: AppState) {
    super();

    this.appstate = appstate;
    this.valcache = appstate.toolop_input_cache;

    this.do_truncate = true;
  }

  get undostack() {
    return this;
  }

  get undocur() {
    return this.cur;
  }

  set undocur(v) {
    this.cur = v;
  }

  reexec_stack2(validate = false) {
    let stack = this.undostack;

    g_app_state.datalib.clear();

    let mctx = new FullContext().toLocked();
    let first = true;

    let last_time = 0;

    function do_next(i) {
      let tool = stack[i];

      let ctx = tool.saved_context;
      if ((1 || ctx.time !== last_time) && mctx.frameset !== undefined) {
        mctx.frameset.update_frame();
      }

      ctx.set_context(mctx);
      last_time = ctx.time;

      //console.log("- " + i + ": executing " + tool.constructor.name + ". . .");

      tool.is_modal = false;
      tool.exec_pre(ctx);

      if (!(tool.undoflag & UndoFlags.NO_UNDO)) {
        //console.log(" - undo pre");
        tool.undoPre(ctx);
        tool.undoflag |= UndoFlags.HAS_UNDO_DATA;
      }

      tool.exec(ctx);

      //*
      if (mctx.frameset !== undefined)// && mctx.frameset.spline.resolve)
        mctx.frameset.spline.solve();
      if (mctx.frameset !== undefined)// && mctx.frameset.pathspline.resolve)
        mctx.frameset.pathspline.solve();
      //*/

      if ((1 || ctx.time !== last_time) && mctx.frameset !== undefined) {
        mctx.frameset.update_frame();
      }
    }

    let ival;

    let thei;
    let this2 = this;

    function cbfunc() {
      do_next(thei);
      thei += 1;

      let cctx = new FullContextt().toLocked();
      if (cctx.frameset !== undefined) {
        cctx.frameset.spline.solve();
        cctx.frameset.pathspline.solve();
      }

      window.redraw_viewport();

      clearInterval(ival);
      if (thei < this2.undostack.length)
        ival = window.setInterval(cbfunc, 500);
    }

    do_next(0);
    thei = 1;
    ival = window.setInterval(cbfunc, 500);

    console.log("reexecuting tool stack from scratch. . .");
    for (let i = 0; i < this.undocur; i++) {
      //  do_next(i);
    }
  }

  reexec_stack(validate = false) {
    let stack = this.undostack;

    g_app_state.datalib.clear();

    let mctx = new FullContext();
    let first = true;

    console.log("reexecuting tool stack from scratch. . .");
    for (let i = 0; i < this.undocur; i++) {
      let tool = stack[i];

      let ctx = tool.saved_context;
      ctx.set_context(mctx);

      //console.log("- " + i + ": executing " + tool.uiname + ". . .");

      tool.is_modal = false;
      tool.exec_pre(ctx);

      if (!(tool.undoflag & UndoFlags.NO_UNDO)) {
        //console.log(" - undo pre");
        tool.undoPre(ctx);
        tool.undoflag |= UndoFlags.HAS_UNDO_DATA;
      }

      tool.exec(ctx);

      /*
      if (mctx.frameset !== undefined && mctx.frameset.spline.resolve)
        mctx.frameset.spline.solve();
      if (mctx.frameset !== undefined && mctx.frameset.pathspline.resolve)
        mctx.frameset.pathspline.solve();
      */
    }
  }

  truncate_stack() {
    if (this.cur !== this.length) {
      if (this.cur === 0) {
        this.length = 0;
      } else {
        this.length = this.cur;
      }
    }
  }

  //removes undo entry for "canceled" tools, that didn't affect state AT ALL
  //op is the toolop requesting the cancelation, which allows us to validate
  //the call.
  toolop_cancel(op: ToolOp, executeUndo: boolean) {
    if (executeUndo === undefined) {
      console.warn("Warning, executeUndo in toolop_cancel() was undefined");
    }

    if (executeUndo) {
      this.undo();
    } else {
      if (this.undostack.indexOf(op) >= 0) {
        this.undostack.remove(op);
        this.undocur--;
      }
    }
  }

  reexec_tool(tool: ToolOp) {
    console.error("reexec_tool called");

    if (!(tool.undoflag & UndoFlags.HAS_UNDO_DATA)) {
      this.reexec_stack();
    }

    if (tool.stack_index === -1) {
      for (let i = 0; i < this.undostack.length; i++) {
        this.undostack[i].stack_index = i;
      }
    }

    if (tool === this.undostack[this.undocur - 1]) {
      this.undo();
      this.redo();
    } else if (this.undocur > tool.stack_index) {
      let i = 0;
      while (this.undocur !== tool.stack_index) {
        this.undo();
        i++;
      }

      while (i >= 0) {
        this.redo();
        i--;
      }
    } else {
      console.log("reexec_tool: can't reexec tool in inactive portion of stack");
    }

    tool.saved_context = new SavedContext(new FullContext());
  }

  kill_opstack() {
    this.reset();
  }

  gen_tool_datastruct(tool: ToolOp) {
    return;
    let datastruct = new DataStruct([]);
    let this2 = this;

    /*find outermost parent macro for reexecution
      callback*/
    let stacktool = tool;
    while (stacktool.parent !== undefined) {
      stacktool = stacktool.parent;
    }

    function makeUpdate(tool, prop, k) {
      return function update_dataprop(d) {
        if (prop.flag & TPropFlags.SAVE_LAST_VALUE) {
          console.log(tool, prop, k, prop.getValue(), "<-----");
          this.ctx.settings.setToolOpSetting(tool.constructor, k, prop.getValue())
        }
        this2.reexec_tool(stacktool);
      }
    }


    function gen_subtool_struct(tool) {
      if (tool.apistruct === undefined)
        tool.apistruct = this2.gen_tool_datastruct(tool);
      return tool.apistruct;
    }

    let prop = new StringProperty(tool.uiname, tool.uiname, tool.uiname, "Tool Name");
    let dataprop = new DataPath(prop, "tool", "tool_name", true, false);
    dataprop.update = function () {
    }

    prop.flag = TPropFlags.LABEL;

    if (!(tool.flag & ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS)) {
      datastruct.add(dataprop);
    }

    for (let k in tool.inputs) {
      prop = tool.inputs[k];

      if (prop.flag & TPropFlags.PRIVATE) continue;

      let name = prop.uiname || prop.apiname || k;
      prop.uiname = name;

      let apiname = prop.apiname || k;

      dataprop = new DataPath(prop, apiname, "", true, false);
      dataprop.update = makeUpdate(tool, prop, k);

      datastruct.add(dataprop);
    }

    if (tool instanceof ToolMacro) {
      let tarr = new DataStructArray(gen_subtool_struct);
      let toolsprop = new DataPath(tarr, "tools", "tools", false);
      datastruct.add(toolsprop);
    }

    return datastruct;
  }

  rebuild_last_tool(tool) {
    return;
    if (USE_PATHUX_API) {
      return;
    }

    let s

    if (tool !== undefined)
      s = this.gen_tool_datastruct(tool);
    else
      s = new DataStruct([]);

    s.flag |= DataFlags.RECALC_CACHE;
    s.name = "last_tool"

    s = new DataPath(s, "last_tool", "", false, false)
    s.flag |= DataFlags.RECALC_CACHE;

    ContextStruct.addOrReplace(s, s);
  }

  set_tool_coll_flag(tool: ToolOp) {
    //find any collectionproperties, and ensure
    //they validate their data strictly, so it
    //can be serialized

    for (let k in tool.inputs) {
      let p = tool.inputs[k];
      if (p instanceof CollectionProperty)
        p.flag &= ~TPropFlags.COLL_LOOSE_TYPE;
    }
    for (let k in tool.outputs) {
      let p = tool.inputs[k];
      if (p instanceof CollectionProperty)
        p.flag &= ~TPropFlags.COLL_LOOSE_TYPE;
    }

    if (tool instanceof ToolMacro) {
      for (let t2 of tool.tools) {
        this.set_tool_coll_flag(t2);
      }
    }
  }

  exec_tool(tool: ToolOp) {
    console.warn("exec_tool deprecated in favor of execTool");
    return this.execTool(g_app_state.ctx, tool);
  }

  error(msg) {
    console.error(msg);
    g_app_state.ctx.error(msg);
  }

  execTool(ctx, tool) {
    //flush event graph
    the_global_dag.exec(this.ctx);
    this.set_tool_coll_flag(tool);

    let ret = super.execTool(ctx, tool);

    if (typeof tool === "object") {
      tool.stack_index = this.indexOf(tool);
    }

    return ret;
  }

  _execTool(ctx: FullContext, tool: ToolOp) {
    if (ctx instanceof ToolOp) {
      console.warn("Bad arguments to g_app_state.toolstack.execTool()");
      tool = ctx;
      ctx = g_app_state.ctx;
    }

    //flush event graph
    the_global_dag.exec(this.ctx);

    this.set_tool_coll_flag(tool);

    /*if (this.appstate.screen &&
        this.appstate.screen.active instanceof ScreenArea
        && this.appstate.screen.active.area instanceof View2DHandler)
    {
      this.appstate.active_view2d = this.appstate.screen.active.area;
    }

    if (this.appstate.screen && this.appstate.active_view2d === undefined) {
      for (let s of this.appstate.screen.children) {
        if (s instanceof ScreenArea && s.area instanceof View2DHandler) {
          this.appstate.active_view2d = s.area;
          break;
        }
      }
    }*/

    ctx = new FullContext();
    tool.ctx = ctx;

    if (tool.constructor.canRun(ctx) === false) {
      if (DEBUG.toolstack) {
        console.trace()
        console.log(tool);
      }

      this.error("Can not call tool '" + tool.constructor.name + "'");
      return;
    }

    if (!(tool.undoflag & UndoFlags.NO_UNDO))
      this.undo_push(tool);

    for (let k in tool.inputs) {
      let p = tool.inputs[k];

      p.ctx = ctx;

      if (p.userSetData !== undefined)
        p.userSetData.call(p, p.data);
    }

    if (tool.is_modal) {
      let modal_ctx = ctx.toLocked();

      tool.modal_ctx = modal_ctx;
      tool.modal_tctx = new BaseContext().toLocked();
      tool.saved_context = new SavedContext(tool.modal_tctx);

      tool.exec_pre(tool.modal_tctx);

      if (!(tool.undoflag & UndoFlags.NO_UNDO)) {
        //some tools expect modalRunning is set even for undo_pre callback
        //even though it's only valid in that case some of the time
        if (tool.is_modal)
          tool.modalRunning = true;

        tool.undoPre(modal_ctx);
        tool.undoflag |= UndoFlags.HAS_UNDO_DATA;

        //will be set again by modal_init, line after next
        if (tool.is_modal)
          tool.modalRunning = false;
      }

      if (tool._start_modal) {
        tool._start_modal(modal_ctx);
      }

      tool.modalStart(modal_ctx);
    } else {
      let tctx = (tool.flag & ToolFlags.USE_TOOL_CONTEXT) ? new BaseContext().toLocked() : ctx.toLocked();
      tool.saved_context = new SavedContext(tctx);

      if (!(tool.undoflag & UndoFlags.NO_UNDO)) {
        //undo callbacks, unlike .exec, get full context structure
        tool.undoPre((tool.flag & ToolFlags.USE_TOOL_CONTEXT) ? tool.ctx : ctx);
        tool.undoflag |= UndoFlags.HAS_UNDO_DATA;
      }

      tool.exec_pre(tctx);
      tool.exec(tctx);
    }

    if (!(tool.undoflag & UndoFlags.NO_UNDO)) {
      this.rebuild_last_tool(tool);
    }
  }

  loadSTRUCT(reader) {
    reader(this);

    this.cur = this.undocur;
    for (let item of this.undostack) {
      this.push(item);
    }

    for (let i = 0; i < this.length; i++) {
      this[i].stack_index = i;
      this.set_tool_coll_flag(this[i]);
    }
  }
}

ToolStack.STRUCT = `
  ToolStack {
    undocur   : int;
    undostack : array(abstract(ToolOp)) | obj.undostack.slice(0, obj.undocur);
  }
`

import {AppState} from "./AppState.js";
