import * as config from '../config/config.js';

import {urlencode, b64decode, b64encode} from '../util/strutils.js';

import {ToolFlags, UndoFlags} from '../core/toolops_api.js';
import {StringProperty} from '../core/toolprops.js';

import {export_svg} from '../util/svg_export.js';

import {ToolOp} from '../core/toolops_api.js';
import {get_root_folderid, get_current_dir, path_to_id} from '../core/fileapi/fileapi.js';
import * as platform from '../../platforms/platform.js';
import type {FullContext} from '../core/context.js';

export var FileDialogModes = {OPEN: "Open", SAVE: "Save"}
var fdialog_exclude_chars = new set([
  "*",
  "\\",
  ";",
  ":",
  "&",
  "^"
]);

import {open_file, save_file, save_with_dialog, can_access_path} from '../core/fileapi/fileapi.js';

//import {Icons} from 'icon_enum';

export class AppQuitOp extends ToolOp {
  constructor() {
    super();

    this.undoflag = UndoFlags.NO_UNDO;
    this.flag = ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS;

  }

  static tooldef() {
    return {
      toolpath: "appstate.quit",
      uiname  : "Exit",
      is_modal: false,
      undoflag: UndoFlags.NO_UNDO,
    }
  }

  exec(ctx : FullContext) {
    let {ipcRenderer} = require('electron');
    ipcRenderer.invoke('quit-fairmotion');
  }
}

export class FileOpenOp extends ToolOp {
  constructor() {
    super();

    this.undoflag = UndoFlags.NO_UNDO;
    this.flag = ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS;

  }

  static tooldef() {
    return {
      toolpath: "appstate.open",
      uiname  : "Open",
      inputs  : {
        path: new StringProperty("", "path", "File Path", "File Path")
      },
      outputs : {},
      icon    : Icons.RESIZE,
      is_modal: false,
      undoflag: UndoFlags.NO_UNDO,
      flag    : ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS
    }
  }

  exec(ctx : FullContext) {
    console.log("File open");

//    if (config.USE_HTML5_FILEAPI) {

    open_file(function (buf: ArrayBuffer, fname: string, filepath: string) {
      console.log("\n\ngot file!", buf, fname, filepath, "\n\n");

      if (filepath !== undefined) {
        g_app_state.session.settings.add_recent_file(filepath);
        //g_app_state.session.settings.server_update(true);
      }

      g_app_state.load_user_file_new(new DataView(buf), filepath);
    }, this, true, "Fairmotion Files", ["fmo"]);

    return;
  }

//  }
}


export class OpenRecentOp extends ToolOp {
  constructor(do_progress = true) {
    super();
  }

  static tooldef() {
    return {
      toolpath: "appstate.open_recent",
      uiname  : "Open Recent",
      inputs  : {},
      outputs : {},
      icon    : -1,
      is_modal: false,
      undoflag: UndoFlags.NO_UNDO,
      flag    : ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS
    }
  }

  exec(ctx : FullContext) {
    console.error("Implement me!");
    ctx.error("Implement me!");
  }
}


export class FileSaveAsOp extends ToolOp {
  do_progress: boolean;

  constructor(do_progress = true) {
    super();

    this.do_progress = true;
  }

  static tooldef() {
    return {
      toolpath: "appstate.save_as",
      uiname  : "Save As",
      inputs  : {},
      outputs : {},
      icon    : -1,
      is_modal: false,
      undoflag: UndoFlags.NO_UNDO,
      flag    : ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS
    }
  }

  exec(ctx : FullContext) {
    console.log("File save As");

    var mesh_data = g_app_state.create_user_file_new().buffer;

    save_with_dialog(mesh_data, undefined, "Fairmotion Files", ["fmo"], function () {
      error_dialog(ctx, "Could not write file", undefined, true);
    }, (path : string) => {
      g_app_state.filepath = path;
      g_app_state.notes.label("File saved");
    });
  }
}


export class FileSaveOp extends ToolOp {
  do_progress: boolean;

  constructor(do_progress = true) {
    super();

    this.do_progress = true;
  }

  static tooldef() {
    return {
      toolpath: "appstate.save",
      uiname  : "Save",
      inputs  : {},
      outputs : {},
      icon    : -1,
      is_modal: false,
      undoflag: UndoFlags.NO_UNDO,
      flag    : ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS
    }
  }

  exec(ctx : FullContext) {
    console.log("File save");

    var mesh_data = g_app_state.create_user_file_new().buffer;

    let path = g_app_state.filepath;

    let ok = path != "" && path !== undefined;
    ok = ok && can_access_path(path);

    if (!ok) {
      save_with_dialog(mesh_data, undefined, "Fairmotion Files", ["fmo"], function () {
        error_dialog(ctx, "Could not write file", undefined, true);
      }, (path : string) => {
        g_app_state.filepath = path;
        g_app_state.notes.label("File saved");
      });
    } else {
      save_file(mesh_data, path, () => {
        error_dialog(ctx, "Could not write file", undefined, true);
      }, () => {
        g_app_state.notes.label("File saved");
      });
    }
  }
}


export class FileSaveSVGOp extends ToolOp {
  constructor() {
    super();
  }

  static tooldef() {
    return {
      toolpath: "appstate.export_svg",
      uiname  : "Export SVG",
      inputs  : {
        path: new StringProperty("", "path", "File Path", "File Path")
      },
      outputs : {},
      icon    : -1,
      is_modal: false,
      undoflag: UndoFlags.NO_UNDO,
      flag    : ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS
    }
  }

  exec(ctx : FullContext) {
    console.log("Export SVG");

    /* NOTE: `Context` is not imported in this module (nor exported anywhere
       under that name), so this line throws a ReferenceError. */
    ctx = new Context();

    var buf = export_svg(ctx.spline);

    if (g_app_state.filepath !== "") {
      var name = g_app_state.filepath;

      if (name === undefined || name === "") {
        name = "untitled";
      }

      if (name.endsWith(".fmo"))
        name = name.slice(0, name.length - 4);
    } else {
      name = "document";
    }

    var blob = new Blob([buf], {type: "text/svg+xml"});

    if (config.CHROME_APP_MODE) {
      save_with_dialog(buf, undefined, "SVG", ["svg"], function () {
        error_dialog(ctx, "Could not write file", undefined, true);
      });
    } else {
      var a = document.createElement("a");

      a.download = name + ".svg";
      a.href = URL.createObjectURL(blob);
      a.click();
    }
  }
}

/* NOTE: a FileSaveB64Op ToolOp ("appstate.export_al3_b64", "Export Base64")
   sat here.  Nothing imported or registered it, and its exec() called
   ProgressDialog, file_dialog and a bare `ajax` -- none of which exist anywhere
   in the tree -- so running it would have thrown a ReferenceError. */

import {ImportJSONOp} from './viewport/spline_createops.js';

var _dom_input_node : HTMLInputElement = undefined!;
export var import_json = window.import_json = function import_json() {
  console.log("import json!");

  if (_dom_input_node == undefined) {
    let elem = document.getElementById("fileinput");
    window._dom_input_node = _dom_input_node = (elem instanceof HTMLInputElement ? elem : undefined)!;
  }

  _dom_input_node.style.visibility = "visible";
  var node = _dom_input_node;
  node.value = "";

  node.onchange = function () {
    console.log("file select!", node.files);
    if (node.files!.length == 0) return;

    var f = node.files![0];

    console.log("file", f);

    var reader = new FileReader();
    reader.onload = function (data : ProgressEvent) {
      /* readAsText below, so result is always a string. */
      let text = typeof reader.result === "string" ? reader.result : undefined!;
      var obj = JSON.parse(text);

      var tool = new ImportJSONOp(text);
      g_app_state.toolstack.execTool(g_app_state.ctx, tool);
    }

    reader.readAsText(f);
  }
}