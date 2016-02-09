import {Dialog, PackedDialog, DialogFlags, OkayDialog, ErrorDialog} 
       from 'dialog';
import * as config from 'config';

import {urlencode, b64decode, b64encode} from 'strutils';

import {ToolFlags, UndoFlags} from 'toolops_api';
import {StringProperty} from 'toolprops';

import {UIElement, PackFlags, UIFlags, CanvasFlags} from 'UIElement';
import {UIFrame} from 'UIFrame';

import {export_svg} from 'svg_export';

import {
  UIButtonAbstract, UIButton, UIButtonIcon,
  UIMenuButton, UICheckBox, UINumBox, UILabel,
  UIMenuLabel, ScrollButton, UIVScroll, UIIconCheck
} from 'UIWidgets';

import {RowFrame, ColumnFrame, UIPackFrame} from 'UIPack';
import {UITextBox} from 'UITextBox';
import {ToolOp, UndoFlags, ToolFlags} from 'toolops_api';
import {UICollapseIcon, UIPanel, UIColorField, UIColorBox,
        UIColorPicker, UIProgressBar, UIListBox, UIListEntry
       } from 'UIWidgets_special';
import {get_root_folderid, get_current_dir, path_to_id} from 'fileapi';

import * as ajax from 'ajax';

export var FileDialogModes = {OPEN: "Open", SAVE: "Save"}
var fdialog_exclude_chars = new set([
  "*",
  "\\",
  ";",
  ":",
  "&",
  "^"
]);

export class FileDialog extends PackedDialog {
  constructor(mode, ctx, callback, check_overwrite=false, pattern=undefined) {
    super(FileDialogModes[mode], ctx, ctx.screen);
    
    if (pattern == undefined) {
      pattern = new RegExp(/.+\.fmo/);
    }
    
    this.pattern = pattern;
    
    this.check_overwrite = check_overwrite;
    this.subframe.default_packflag |= PackFlags.INHERIT_WIDTH;
    this.parent_stack = [];

    this.pos = [0,0];
    this.files = [];
    
    this.flag = DialogFlags.MODAL;
    this.callback = callback;
    
    var cwd = get_current_dir();
    
    if (cwd != undefined) {
      this.rebuild_parent_stack(cwd);
      window._pstack = this.parent_stack;
      
      var this2 = this;
      path_to_id(cwd).then(function(job) {
        console.log("==>", arguments, job.value);
        
        this2.dirpath = cwd;
        this2.folderid = job.value;
        this2.populate();
      });
    } else {//use root folder id
      this.folderid = get_root_folderid(); //root folder id
      this.dirpath = "/";
      
      if (this.folderid == undefined) { //can happen if userid isn't available yet
        //*sigh* make a timer to regularly check if user validation has happened
        var this2 = this;
        var start_time = time_ms();
        
        g_app_state.session.validate_session();
        
        var timer = window.setInterval(function() {
          var root_id = get_root_folderid();
          
          console.log("waiting for root folder id. . .");
          
          if (root_id != undefined && this2.folderid == undefined) {
            this2.folderid = root_id;
          }
          
          if (this2.closed || root_id != undefined || time_ms() - start_time > 90000) {
            console.log("clearing file dialog interval");
            window.clearInterval(timer);
          }
        }, 500);
      }
    }
    
    var col = this.subframe.col();
    col.default_packflag &= ~PackFlags.INHERIT_WIDTH;
    col.add(Dialog.okay_button(ctx));
    col.add(Dialog.cancel_button(ctx));

    this.textbox = new UITextBox(ctx, "", [0,0], [0,0])
    this.subframe.add(this.textbox, PackFlags.INHERIT_WIDTH);

    this.listbox = new UIListBox(ctx, [0,0], [400, 300])
    var this2 = this;
    
    //this is what I get for chaining event functions in a stupid way
    this.listbox._on_doubleclick = function(e) {
      this.prototype._on_doubleclick.apply(this, arguments);

      console.log("this.listbox.on_doubleclick called");
      
      if (e.button != 0 || this.active_entry == undefined) 
        return;
      
      var text = this.active_entry.text, id = this.active_entry.id;
      this2.entry_double_clicked(text, id);
    }
    
    this.listbox.callback = function(listbox, text, id) {
      console.trace("this.listbox.callback called");
      
      this2.entry_clicked(text, id);
    }
    
    this.listbox.go_callback = function(listbox, text, id) {
      this2.end(false);
    }

    this.subframe.add(this.listbox, PackFlags.INHERIT_WIDTH);
    
    var col = this.subframe.col();
    var newf = new UIButton(ctx, "New Folder");
    
    col.add(newf);
    //col.add(new UIButton(ctx, "Delete"));
    
    var this2 = this;
    newf.callback = function() {
      var entry = this2.listbox.add_item("New Folder", {is_dir : true, is_temp : true});
      
      this2.listbox._set_active(entry, true);
      this2.listbox.jump(-1, true); //scroll to last item
      
      entry.begin_text_edit();
      entry.textbox.select_all();
      entry.icon = Icons.FOLDER;
      
      entry.on_end_edit = function(textbox, cancel) {
        if (textbox.text.trim() == "") return;
        
        var name = textbox.text.trim();
        
        entry.text = name
        entry.do_recalc();
        entry.id.name = name;
        
        call_api(create_folder, {folderid : this2.folderid, name : name},
                function finish() {
                  console.log("finish!", arguments);
                  this2.populate(); //rebuild listbox
                }, function error() {
                  if (entry.parent.children.indexOf(entry) >= 0) {
                    entry.parent.do_recalc();
                    entry.parent.remove(entry);
                    
                    error_dialog(ctx, "Network Error", undefined, true);
                  }

                  console.log("error!", arguments);
                });
      }
    }
    
    if (this.folderid != undefined) {
      this.populate();
    }
  }

  rebuild_parent_stack(cwd) {
    cwd = cwd == undefined ? this.dirpath : cwd;
    
    this.parent_stack = [];
    var path = "";
    var dirs = cwd.trim().replace(/\/+/g, "/").split("/");
    
    if (dirs[dirs.length-1].trim() == "") {
      dirs = dirs.slice(0, dirs.length-1);
    }

    console.log("dirs: ", dirs);
    
    for (var i=0; i<dirs.length-1; i++) {
      path += dirs[i];
      path += "/";
      
      this.parent_stack.push(path);
    }
  }
  
  populate() {
    var this2 = this;
    
    function finish(job, owner, msg) {
      this2.listbox.reset();
      
      if (this2.folderid != get_root_folderid())
        this2.listbox.add_item("..", {is_dir : true});
      
      var files = job.value.items;
      this2.files = files;
      
      if (files == undefined)
        return;
        
      files.sort(function(a, b) {
        if (!!a.is_dir == !!b.is_dir)
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        else if (a.is_dir)
          return 1;
        else
          return -1;
      });
      
      if (DEBUG.netio)
        console.log(files);
        
      for (var i=0; i<files.length; i++) {
        var fname = files[i].name;
        var ftype;
        
        if (files[i].is_dir) {
          ftype = "folder";
          fname = fname
        } else {
          ftype = "file";
          
          //console.log("MATCH", fname.match(this2.pattern), this2.pattern, fname);
          
          if (!fname.match(this2.pattern))
            continue;
        }
        
        var entry = this2.listbox.add_item(fname, files[i]);
        entry.icon = ftype == "file" ? Icons.FILE : Icons.FOLDER;
      }
      
      this2.do_full_recalc();
    }
    
    var was_closed = false;
    function error(job, owner, msg) {
      if (!was_closed) {
        error_dialog(this2.ctx, "Network Error", function() {
          this2.end(true);
        }, true);
      }
      was_closed = true;
    }
    
    var args;
    if (this.folderid == undefined) {
      args = {path : this.dirpath};
    } else {
      args = {id : this.folderid};
    }
    call_api(get_dir_files, args, finish, error);
  }

  entry_double_clicked(text, id) {
    if (id.is_temp) return;
    
    this.entry_clicked(text, id);
    
    if (!id.is_dir) {
      this.end(false);
    } else if (text == "..") {
      var path = this.parent_stack.pop();
      if (path == undefined) {
        console.log("WARNING: tried to go to parent of root directory");
        return;
      }
      
      var this2 = this;
      path_to_id(path).then(function(job) {
        console.log("Navigated to parent", path);
        console.log("==>", arguments, job.value);
        
        this2.dirpath = path;
        this2.folderid = job.value;
        this2.listbox.reset();
        this2.populate();
      });
    } else {
      this.parent_stack.push(this.dirpath);
      
      this.folderid = id.id;
      this.dirpath += id.name + "/";
      
      this.populate();
    }
  }
  
  entry_clicked(text, id) {
    if (id.is_temp) return;
    
    if (!id.is_dir) {
      this.textbox.set_text(text);
    }
  }

  end(do_cancel, overwrite_check=false) {
    console.trace("end called");
    
    if (!do_cancel && this.textbox.text.trim() == "") {
      console.log("no char in path")
      return;
    }
    
    var this2 = this;
    function check_overwrite_cb(dialog, cancel) {
      if (!cancel)
        this2.end(false, true);
    }
    
    for (var i=0; !do_cancel && i<this.files.length; i++) {
      if (this.files[i].is_dir && this.files[i].name.trim() == this.textbox.text.trim()) {
        console.log("Can't overwrite folders!");
        error_dialog(this.ctx, "Can't overwrite folders");
        return;
      }
    }
    
    if (!do_cancel && !overwrite_check && this.check_overwrite) {
      var found = false;
      for (var i=0; i<this.files.length; i++) {
        if (this.files[i].name.trim() == this.textbox.text.trim()) {
          found = true;
          break;
        }
      }
      
      if (found && !overwrite_check) {
        var d = new OkayDialog("Overwrite file?", check_overwrite_cb);
        d.call(g_app_state.screen.mpos);
        
        return;
      }
    }
    
    var text = this.dirpath + this.textbox.text.trim()
    var eset = fdialog_exclude_chars;
    
    for (var i=0; i<text.length; i++) {
      if (eset.has(text[i])) {
        console.log("bad char in path")
        return;
      }
    }
    
    super.end(do_cancel);
    
    if (this.callback != undefined && !do_cancel) {
       this.callback(this, text);
    }
  }
}

export function file_dialog(mode, ctx, callback, check_overwrite, pattern)
{
  var fd = new FileDialog(mode, ctx, callback, check_overwrite, pattern);
  fd.call(ctx.screen.mpos);  
}

export function download_file(path, on_finish, path_label=path, use_note=false, 
                       suppress_errors=false, on_error=undefined) 
{
  var ctx = new Context();
    
  var pd;

  if (use_note)
    pd = g_app_state.notes.progbar("Get " + path_label, 0);
  else
    pd = new ProgressDialog(ctx, "Downloading " + path_label);
    
  if (on_error == undefined)
    on_error = function() { };
    
  var did_error = false;
  function error(job, owner, msg) {
    if (!did_error) {
      did_error = true;
      pd.end()
      
      on_error(job, owner, msg);
      
      if (!suppress_errors)
        g_app_state.notes.label("Network Error");
    }
  }
  
  function status(job, owner, status) {
    pd.value = status.progress;
    if (DEBUG.netio)
      console.log("status: ", status.progress);
  }
      
  function finish(job, owner) {
    pd.end();
    on_finish(new DataView(job.value));
    
    if (DEBUG.netio)
      console.log("finished downloading");
  }
  
  var s = g_app_state.screen.size;
  if (!use_note)
    pd.call([s[0]*0.5, s[1]*0.5]);
  
  call_api(get_file_data, {path:path}, finish, error, status);
}

import {open_file, save_file} from 'html5_fileapi';

export class FileOpenRecentOp extends ToolOp {
  static tooldef() { return {
    apiname  : "open_recent",
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
    
    var paths = g_app_state.session.settings.recent_files;
    for (var i=paths.length-1; i>=0; i--) {
      listbox.add_item(paths[i], paths[i]);
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
    super("open_file", "Open");
    
    this.is_modal = false;
    
    this.undoflag = UndoFlags.IGNORE_UNDO;
    this.flag = ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS;
    
    this.inputs = {path : new StringProperty("", "path", "File Path", "File Path")};
  }

  exec(ctx) {
    console.log("File open");
    
    if (config.USE_HTML5_FILEAPI) {
        console.log("html5 file api!");
        
        open_file(function(buf) {
            console.log("got file!", buf);
            
            g_app_state.load_user_file_new(new DataView(buf));
        }, this, true, "Fairmotion Files", ["fmo"]);
        
        return;
    }
    
    /*I should really make these file operations modal, since
        they create ui elements
     */
    ctx = new Context();
    var pd = new ProgressDialog(ctx, "Downloading");
    
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
        
    function open_callback(dialog, path) {
      if (DEBUG.netio)
        console.log("loading...", path);
      pd.call(ctx.screen.mpos);
      
      function finish(job, owner) {
        pd.end();
        g_app_state.load_user_file_new(new DataView(job.value));
        console.log("setting g_app_state.filepath", path);
        
        g_app_state.filepath = path;
        if (DEBUG.netio)
          console.log("finished downloading");
        
        g_app_state.session.settings.download(function() {
          g_app_state.session.settings.add_recent_file(path);
          g_app_state.session.settings.server_update(true);
        });
      }
      
      call_api(get_file_data, {path:path}, finish, error, status);
    }
    
    console.log("File open");
    if (this.inputs.path.data != "") {
      open_callback(undefined, this.inputs.path.data);
      return;
    }
    
    file_dialog("OPEN", new Context(), open_callback);
  }
}

export function html5_save(data, save_as_mode, set_current_file, exts) {
    console.log("html5 file api!");
    
    save_file(data, save_as_mode, set_current_file, exts);
}

export class FileSaveAsOp extends ToolOp {
  constructor() {
    super("save_file_as", "Save As");
    
    this.is_modal = false;
    
    this.undoflag = UndoFlags.IGNORE_UNDO;
    this.flag = ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS;
    
    this.inputs = {path : new StringProperty("", "path", "File Path", "File Path")};
  }

  exec(ctx) {
    console.log("File save");
    
    //I should really make these file operations modal, since
    //they create ui elements
    ctx = new Context();
    var pd = new ProgressDialog(ctx, "Uploading");
    var thepath = undefined;
    
    var mesh_data = g_app_state.create_user_file_new().buffer;
    
    if (config.USE_HTML5_FILEAPI) {
        html5_save(mesh_data, true, true, ["fmo"]);
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
      global allshape_file_ext;
      
      if (!path.endsWith(allshape_file_ext)) {
        path = path + allshape_file_ext;
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
    super("new_file", "New");

    this.is_modal = false;
    
    this.undoflag = UndoFlags.IGNORE_UNDO;
    this.flag = ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS;
    
    this.inputs = {};
  }

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
  constructor(Boolean do_progress=true) {
    super("save_file", "Save");

    this.do_progress = true;
    this.is_modal = false;
    
    this.undoflag = UndoFlags.IGNORE_UNDO;
    this.flag = ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS;
    
    this.inputs = {};
  }

  exec(ctx) {
    console.log("File save");
    
    var mesh_data = g_app_state.create_user_file_new().buffer;

    if (config.USE_HTML5_FILEAPI) {
        html5_save(mesh_data, false, true, ["fmo"]);
        return;
    }
    
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
    
    function finish(job, owner) {
      pd.end();
      if (DEBUG.netio)
        console.log("finished uploading");
    }
    
    function save_callback(dialog, path) {
      console.log("setting g_app_state.filepath", path);
      g_app_state.filepath = path;

      g_app_state.session.settings.add_recent_file(path);
      g_app_state.session.settings.server_update(true);
      
      pd.call(ctx.screen.mpos);
      
      if (DEBUG.netio)
        console.log("saving...", path);
      global allshape_file_ext;
      
      if (!path.endsWith(allshape_file_ext)) {
        path = path + allshape_file_ext;
      }
      
      var token = g_app_state.session.tokens.access;
      var url = "/api/files/upload/start?accessToken="+token+"&path="+path
      var url2 = "/api/files/upload?accessToken="+token;
      
      call_api(upload_file, {data:mesh_data, url:url, chunk_url:url2}, finish, error, status);
    }
      
    if (g_app_state.filepath != "") {
      save_callback(undefined, g_app_state.filepath);
    } else {
      file_dialog("SAVE", new Context(), save_callback, true);
    }
  }
}

var test_pd = undefined;
function test_progress_dialog() {
  global test_pd;
  
  var ctx = new Context();
  var pd = new ProgressDialog(ctx, "test", 0.2);
  
  pd.call(ctx.screen.mpos);
  
  test_pd = pd;
}

export class ProgressDialog extends PackedDialog {
  constructor(Context ctx, String label, float val=0.0, float min=0.0, float max=1.0) {
    super(label, ctx, ctx.screen);
    
    this.pos = [0,0];
    this.closed = false;
    
    this.flag = DialogFlags.MODAL;
    
    var col = this.subframe.col();   
    
    this.bar = new UIProgressBar(ctx, val, min, max);
    col.add(this.bar);
    
    //ensure the user sees the full progress bar,
    //even for quick actions
    this._full_ms = 0;
    this._do_end = false;
    this._end_flash = 150;
  }
  
  on_tick() {
    if (this._do_end && time_ms() - this._full_ms > this._end_flash) {
      super.end(false);
    }
  }
  
  end(Boolean do_cancel) {
    if (this.bar.value >= this.bar.max) {
      this._full_ms = time_ms();
      this._do_end = true;
      this.bar.value = this.bar.max;
      this.bar.do_recalc();
    } else {
      super.end(false);
    }
  }
  
  set value(float val) {
    if (val != this.bar.value)
      this.do_recalc();
    this.bar.set_value(val);
  }
  
  get value() {
    return this.bar.value;
  }
}

export class LoginDialog extends PackedDialog {
  constructor(ctx) {
    super("User Login", ctx, ctx.screen);
    
    this.pos = [0,0];
    this.closed = false;
    
    this.flag = DialogFlags.MODAL;
    
    var col = this.subframe.col();
    col.add(Dialog.okay_button(ctx));
    col.add(Dialog.cancel_button(ctx));
    
    var session = g_app_state.session;
    
    this.userbox = new UITextBox(ctx, session.username, [0,0], [0,0]);
    this.passbox = new UITextBox(ctx, session.password, [0,0], [0,0]);
    this.errlabel = undefined;
    
    var col = this.subframe.col(undefined, PackFlags.INHERIT_WIDTH);
    var row = col.row();
    row.label("User:").color = uicolors["DialogText"];
    row.label("Password:").color = uicolors["DialogText"];
    
    row = col.row();
    row.add(this.userbox, PackFlags.INHERIT_WIDTH);
    row.add(this.passbox, PackFlags.INHERIT_WIDTH);
  }

  end(do_cancel) {
    var dialog = this;
    
    var session = g_app_state.session
    if (DEBUG.netio)
      console.log(session.tokens);
    
    if (do_cancel) {
      super.end(do_cancel);
      return;
    }
    
    function finish(job, owner) {
      if (dialog.closed)
        return;
      
      var session = g_app_state.session;
      
      if (DEBUG.netio)
        console.log(job.value, "1");
      
      session.tokens = job.value;
      session.is_logged_in = true;
      session.store();
      
      if (DEBUG.netio)
        console.log(job.value, "2");
        
      dialog.closed = true;
      prior(LoginDialog, dialog).end.call(dialog, false);
      
      g_app_state.session.validate_session();
    }
    
    function error(job, owner, msg) {
      if (dialog.errlabel == undefined) {
        dialog.errlabel = dialog.subframe.label("", undefined, PackFlags.INHERIT_WIDTH);
        dialog.errlabel.color = uicolors["DialogText"];
      }
      
      dialog.errlabel.set_text("Error");
      console.log(msg);
    }
    
    var user = this.userbox.text;
    var password = this.passbox.text;
    
    if (DEBUG.netio)
      console.log(user, password);
    
    var session = g_app_state.session;
    
    session.username = user;
    session.password = password;
    session.store();
    
    auth_session(user, password, finish, error);

    //prior(LoginDialog, this).end.call(this, do_cancel);
  }
}

export function error_dialog(Context ctx, String msg, Function callback=undefined, Boolean center=false) {
  var pd = new ErrorDialog(msg, callback);
  
  var s = ctx.screen.size;
  var mpos = center ? [Math.floor(s[0]/2.0), Math.floor(s[1]/2.0)] : ctx.screen.mpos;
  
  pd.call(mpos);
  
  return pd;
}

export function login_dialog(ctx)
{
  var ld = new LoginDialog(ctx);
  
  ld.call(new Vector2(ctx.screen.size).mulScalar(0.5).floor());  
}

export class FileSaveSVGOp extends ToolOp {
  constructor() {
    ToolOp.call(this, "export_svg", "Export SVG");
    
    this.is_modal = false;
    
    this.undoflag = UndoFlags.IGNORE_UNDO;
    this.flag = ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS;
    
    this.inputs = {path : new StringProperty("", "path", "File Path", "File Path")};
  }
    
  exec(ctx) {
    console.log("Export SVG");
    
    /*I should really make these file operations modal, since
        they create ui elements
     */
    ctx = new Context();
    
    var buf = export_svg(ctx.spline);
    var a = document.createElement("a");
    
    if (g_app_state.filepath != "") {
      var name = g_app_state.filepath;
      if (name.endsWith(".fmo"))
        name = name.slice(0, name.length-4);
    } else {
      name = "document";
    }
    
    var blob = new Blob([buf], {type : "text/svg+xml"});
    var url = URL.createObjectURL(blob);
    
    a.download = name + ".svg";
    a.href = url;
    a.click();
  }
}

export class FileSaveB64Op extends ToolOp {
  constructor() {
    ToolOp.call(this, "export_al3_b64", "Export AL3-B64");
    
    this.is_modal = false;
    
    this.undoflag = UndoFlags.IGNORE_UNDO;
    this.flag = ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS;
    
    this.inputs = {path : new StringProperty("", "path", "File Path", "File Path")};
  }
    
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