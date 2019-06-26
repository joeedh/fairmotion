import * as config from 'config';

import {urlencode, b64decode, b64encode} from 'strutils';

import {ToolFlags, UndoFlags} from 'toolops_api';
import {StringProperty} from 'toolprops';

import {export_svg} from 'svg_export';

import {ToolOp, UndoFlags, ToolFlags} from 'toolops_api';
import {get_root_folderid, get_current_dir, path_to_id} from 'fileapi';

export var FileDialogModes = {OPEN: "Open", SAVE: "Save"}
var fdialog_exclude_chars = new set([
  "*",
  "\\",
  ";",
  ":",
  "&",
  "^"
]);

import {open_file, save_file, save_with_dialog, can_access_path} from 'fileapi';

export class FileOpenRecentOp extends ToolOp {
  static tooldef() { return {
    apiname  : "appstate.open_recent",
    uiname   : "Open Recent",
    inputs   : {},
    outputs  : {},
    icon     : -1,
    is_modal : false,
    undoflag : UndoFlags.IGNORE_UNDO
  }}

  constructor() {
    super();
    this.path = undefined;
  }

  exec(ctx) {
    var dialog = new PackedDialog("Open recent...", ctx, g_app_state.screen);
    var row = dialog.subframe;

    var listbox = new UIListBox();
    row.add(listbox);

    var paths = g_app_state.session.settings.recent_paths;
    for (var i=paths.length-1; i>=0; i--) {
      listbox.add_item(paths[i].displayname, paths[i].path);
    }

    listbox.go_callback = function(text, id) {
      console.log("go calllback!", id);

      var loadop = new FileOpenOp()
      loadop.inputs.path.set_data(id);

      dialog.end();
      g_app_state.toolstack.exec_tool(loadop);
    }

    dialog.call(g_app_state.screen.mpos);
  }
}

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
    icon     : -1,
    is_modal : false,
    undoflag : UndoFlags.IGNORE_UNDO,
    flag : ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS
  }}

  exec(ctx) {
    console.log("File open");

//    if (config.USE_HTML5_FILEAPI) {

    open_file(function(buf, fname, filepath) {
      console.log("\n\ngot file!", buf, fname, filepath, "\n\n");

      g_app_state.load_user_file_new(new DataView(buf), filepath);

      if (filepath != undefined) {
        g_app_state.session.settings.add_recent_file(filepath);
        g_app_state.session.settings.server_update(true);
      }
    }, this, true, "Fairmotion Files", ["fmo"]);

    return;
  }
//  }
}

export class FileSaveAsOp extends ToolOp {
  constructor() {
    super();
  }

  static tooldef() { return {
    apiname  : "appstate.save_as",
    uiname   : "Save As",
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
    console.log("File save");

    //I should really make these file operations modal, since
    //they create ui elements
    ctx = new Context();
    var pd = new ProgressDialog(ctx, "Uploading");
    var thepath = undefined;

    var mesh_data = g_app_state.create_user_file_new().buffer;

    if (config.USE_HTML5_FILEAPI) {
      save_with_dialog(mesh_data, g_app_state.filepath, "Fairmotion Files", ["fmo"], function() {
        error_dialog(ctx, "Could not write file", undefined, true);
      }, (path) => {
        g_app_state.filepath = path;
        g_app_state.notes.label("File saved");
      });
      return;
    }

    function error(job, owner, msg) {
      pd.end()
      error_dialog(ctx, "Network Error", undefined, true);
    }

    function finish(job, owner) {
      if (DEBUG.netio)
        console.log("finished uploading");
      pd.end()

      G.filepath = thepath;
    }

    function status(job, owner, status) {
      pd.value = status.progress;
      if (DEBUG.netio)
        console.log("status: ", status.progress, status);
    }

    function save_callback(dialog, path) {
      pd.call(ctx.screen.mpos);

      g_app_state.session.settings.add_recent_file(path);
      g_app_state.session.settings.server_update(true);
      g_app_state.filepath = path;

      if (DEBUG.netio)
        console.log("saving...", path);
      global fairmotion_file_ext;

      if (!path.endsWith(fairmotion_file_ext)) {
        path = path + fairmotion_file_ext;
      }

      thepath = path;

      var token = g_app_state.session.tokens.access;
      var url = "/api/files/upload/start?accessToken="+token+"&path="+path
      var url2 = "/api/files/upload?accessToken="+token;

      call_api(upload_file, {data:mesh_data, url:url, chunk_url:url2}, finish, error, status);
    }

    file_dialog("SAVE", new Context(), save_callback, true);
  }
}

export class FileNewOp extends ToolOp {
  constructor() {
    super();
  }

  static tooldef() { return {
    apiname  : "appstate.new",
    uiname   : "New",
    inputs   : {},
    outputs  : {},
    icon     : -1,
    is_modal : false,
    undoflag : UndoFlags.IGNORE_UNDO,
    flag : ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS
  }}

  exec(ctx) {
    function new_callback(dialog, do_cancel) {
      if (!do_cancel) {
        gen_default_file(g_app_state.screen.size);
      }
    }

    var okay = new OkayDialog("Create blank scene?\nAny unsaved changes\nwill be lost", new_callback)
    okay.call();

    console.log("File new");
  }
}

export class FileSaveOp extends ToolOp {
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

    if (g_app_state.filepath != "") {
      var name = g_app_state.filepath;

      if (name === undefined || name == "") {
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

import {ImportJSONOp} from 'spline_createops';

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