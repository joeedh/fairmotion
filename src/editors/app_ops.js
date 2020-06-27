import * as config from '../config/config.js';

import {urlencode, b64decode, b64encode} from '../util/strutils.js';

import {ToolFlags, UndoFlags} from '../core/toolops_api.js';
import {StringProperty} from '../core/toolprops.js';

import {export_svg} from '../util/svg_export.js';

import {ToolOp, UndoFlags, ToolFlags} from '../core/toolops_api.js';
import {get_root_folderid, get_current_dir, path_to_id} from '../core/fileapi/fileapi.js';
import * as platform from '../../platforms/platform.js';

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

export class FileOpenOp extends ToolOp {
  constructor() {
    super();

    this.undoflag = UndoFlags.IGNORE_UNDO;
    this.flag = ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS;

  }

  static tooldef() { return {
    apiname  : "appstate.open",
    uiname   : "Open",
    inputs   : {
      path : new StringProperty("", "path", "File Path", "File Path")
    },
    outputs  : {},
    icon     : Icons.RESIZE,
    is_modal : false,
    undoflag : UndoFlags.IGNORE_UNDO,
    flag : ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS
  }}

  exec(ctx : LockedContext) {
    console.log("File open");

//    if (config.USE_HTML5_FILEAPI) {

    open_file(function(buf : ArrayBuffer, fname : string, filepath : string) {
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

export class FileSaveAsOp extends ToolOp {
  do_progress : boolean;

  constructor(do_progress=true) {
    super();

    this.do_progress = true;
  }

  static tooldef() { return {
    apiname  : "appstate.save_as",
    uiname   : "Save As",
    inputs   : {},
    outputs  : {},
    icon     : -1,
    is_modal : false,
    undoflag : UndoFlags.IGNORE_UNDO,
    flag : ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS
  }}

  exec(ctx) {
    console.log("File save As");

    var mesh_data = g_app_state.create_user_file_new().buffer;

    save_with_dialog(mesh_data, undefined, "Fairmotion Files", ["fmo"], function () {
      error_dialog(ctx, "Could not write file", undefined, true);
    }, (path) => {
      g_app_state.filepath = path;
      g_app_state.notes.label("File saved");
    });
  }
}


export class FileSaveOp extends ToolOp {
  do_progress : boolean;

  constructor(do_progress=true) {
    super();

    this.do_progress = true;
  }

  static tooldef() { return {
    apiname  : "appstate.save",
    uiname   : "Save",
    inputs   : {},
    outputs  : {},
    icon     : -1,
    is_modal : false,
    undoflag : UndoFlags.IGNORE_UNDO,
    flag : ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS
  }}

  exec(ctx) {
    console.log("File save");

    var mesh_data = g_app_state.create_user_file_new().buffer;

    let path = g_app_state.filepath;

    let ok = path != "" && path !== undefined;
    ok = ok && can_access_path(path);

    if (!ok) {
      save_with_dialog(mesh_data, undefined, "Fairmotion Files", ["fmo"], function () {
        error_dialog(ctx, "Could not write file", undefined, true);
      }, (path) => {
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

  static tooldef() { return {
    apiname  : "appstate.export_svg",
    uiname   : "Export SVG",
    inputs   : {
      path : new StringProperty("", "path", "File Path", "File Path")
    },
    outputs  : {},
    icon     : -1,
    is_modal : false,
    undoflag : UndoFlags.IGNORE_UNDO,
    flag : ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS
  }}

  exec(ctx) {
    console.log("Export SVG");

    /*I should really make these file operations modal, since
        they create ui elements
     */
    ctx = new Context();

    var buf = export_svg(ctx.spline);

    if (g_app_state.filepath !== "") {
      var name = g_app_state.filepath;

      if (name === undefined || name === "") {
        name = "untitled";
      }

      if (name.endsWith(".fmo"))
        name = name.slice(0, name.length-4);
    } else {
      name = "document";
    }

    var blob = new Blob([buf], {type : "text/svg+xml"});

    if (config.CHROME_APP_MODE) {
      save_with_dialog(buf, undefined, "SVG", ["svg"], function() {
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

export class FileSaveB64Op extends ToolOp {
  constructor() {
    super();
  }

  static tooldef() { return {
    apiname  : "appstate.export_al3_b64",
    uiname   : "Export Base64",
    description : "Export a base64-encoded .fmo file",
    inputs   : {
      path : new StringProperty("", "path", "File Path", "File Path")
    },
    outputs  : {},

    icon     : -1,
    is_modal : false,
    undoflag : UndoFlags.IGNORE_UNDO,
    flag : ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS
  }}

  exec(ctx) {
    console.log("Export AL3-B64");

    //compression is off, for now
    var buf = g_app_state.create_user_file_new({
      compress : true
    });
    buf = b64encode(new Uint8Array(buf.buffer));

    //line wrap
    var buf2 = ""
    for (var i=0; i<buf.length; i++) {
      buf2 += buf[i];
      if (((i+1)%79) == 0) {
        buf2 += "\n";
      }
    }
    buf = buf2;

    var byte_data = [];
    ajax.pack_static_string(byte_data, buf, buf.length);
    byte_data = new Uint8Array(byte_data).buffer;

    /*I should really make these file operations modal, since
        they create ui elements
     */
    ctx = new Context();
    var pd = new ProgressDialog(ctx, "Uploading");

    function error(job, owner, msg) {
      pd.end()
      error_dialog(ctx, "Network Error", undefined, true);
    }

    function status(job, owner, status) {
      pd.value = status.progress;
      pd.bar.do_recalc();
      if (DEBUG.netio)
        console.log("status: ", status.progress);
    }

    var this2 = this;
    function finish(job, owner) {
      if (DEBUG.netio)
        console.log("finished uploading");
      var url = "/api/files/get?path=/"+this2._path + "&";
      url += "accessToken="+g_app_state.session.tokens.access;

      if (DEBUG.netio)
        console.log(url)
      window.open(url);

      pd.end();
    }

    function save_callback(dialog, path) {
      pd.call(ctx.screen.mpos);

      if (DEBUG.netio)
        console.log("saving...", path);

      if (!path.endsWith(".al3.b64")) {
        path = path + ".al3.b64";
      }
      this2._path = path;

      var token = g_app_state.session.tokens.access;
      var url = "/api/files/upload/start?accessToken="+token+"&path="+path
      var url2 = "/api/files/upload?accessToken="+token;

      call_api(upload_file, {data:byte_data, url:url, chunk_url:url2}, finish, error, status);
    }

    file_dialog("SAVE", new Context(), save_callback, true);
  }
}

import {ImportJSONOp} from './viewport/spline_createops.js';

var _dom_input_node = undefined;
export var import_json = window.import_json = function import_json() {
  global _dom_input_node;
  console.log("import json!");

  if (_dom_input_node == undefined) {
    window._dom_input_node = _dom_input_node = document.getElementById("fileinput");
  }

  _dom_input_node.style.visibility = "visible";
  var node = _dom_input_node;
  node.value = "";

  node.onchange = function() {
    console.log("file select!", node.files);
    if (node.files.length == 0) return;

    var f = node.files[0];

    console.log("file", f);

    var reader = new FileReader();
    reader.onload = function(data) {
      var obj = JSON.parse(reader.result);

      var tool = new ImportJSONOp(reader.result);
      g_app_state.toolstack.exec_tool(tool);
    }

    reader.readAsText(f);
  }
}