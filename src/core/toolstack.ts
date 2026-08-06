import {BaseContext, FullContext} from "./context.js";
import {ToolFlags, ToolMacro, ToolOp, UndoFlags} from "./toolops_api.js";
import {CollectionProperty, StringProperty, TPropFlags} from "./toolprops.js";
import {ToolProperty} from "./toolops_api.js";
import * as pathux from '../path.ux/scripts/pathux.js';

import {globalDag} from './eventdag.js';
import {USE_PATHUX_API} from './const.js';
import type {AppState} from './AppState.js';

export class ToolStack extends pathux.ToolStack<FullContext, FullContext, ToolOp> {
  static STRUCT: string;

  /* undocur and undostack are accessors, not fields: the stack *is* this array
     and `cur` is where undo/redo sits in it. The names are what the STRUCT
     script at the bottom of this file writes. */
  valcache: {[toolClassName: string]: unknown};
  appstate: AppState;
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

  /* NOTE: reexec_stack2() and reexec_stack() lived here.  Neither was
     reachable -- the only caller was reexec_tool(), itself only called from
     the unreachable tail of gen_tool_datastruct() -- and neither could have
     run: reexec_stack2 named FullContextt, and both handed a SavedContext to
     ToolOp.exec_pre()/undoPre()/exec(), which take a FullContext. */

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

  /* NOTE: unreachable -- the only caller was the removed tail of
     gen_tool_datastruct().  It opened by calling reexec_stack(), which is gone
     with it. */
  reexec_tool(tool: ToolOp) {
    console.error("reexec_tool called");

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

  /* NOTE: everything past the `return` was unreachable and named DataStruct,
     DataStructArray and DataPath, none of which exist any more; it has been
     removed.  data_api_define already copes with the undefined result. */
  gen_tool_datastruct(tool: ToolOp): pathux.DataStruct | undefined {
    return undefined;
  }

  rebuild_last_tool(tool: ToolOp) {
   console.warn("toolstack.rebuild_last_tool called!");
  }

  //macro members come back out of ToolMacro.tools as path.ux ToolOps
  set_tool_coll_flag(tool: pathux.ToolOp<any, any, any, any>) {
    //find any collectionproperties, and ensure
    //they validate their data strictly, so it
    //can be serialized

    for (let k in tool.inputs) {
      let p = tool.inputs[k];
      if (p instanceof CollectionProperty)
        p.flag &= ~TPropFlags.COLL_LOOSE_TYPE;
    }
    for (let k in tool.outputs) {
      /* NOTE: keyed off outputs but read from inputs, so output collections
         never get their loose-type flag cleared.  Left as-is. */
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

  error(msg: string) {
    console.error(msg);
    g_app_state.ctx.error(msg);
  }

  execTool(ctx: FullContext, tool: ToolOp) {
    //flush event graph
    globalDag().exec(this.ctx);
    this.set_tool_coll_flag(tool);

    let ret = super.execTool(ctx, tool);

    if (typeof tool === "object") {
      tool.stack_index = this.indexOf(tool);
    }

    return ret;
  }

  /* NOTE: a _execTool() override lived here.  Nothing called it -- execTool()
     above defers to path.ux's, which has no _execTool hook -- and it still
     called undo_push(), a method path.ux's ToolStack dropped. */

  loadSTRUCT(reader: StructReader<this>) {
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
