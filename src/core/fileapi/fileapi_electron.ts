"use strict";

import * as config from '../../config/config.js';
import * as fileapi_html5 from './fileapi_html5.js';
import {wrapRemoteCallback} from '../../path.ux/scripts/platforms/electron/electron_api.js';
import type {
  FileData, FileErrorCallback, FileSuccessCallback, OpenFileCallback
} from './fileapi.js';

let fs: typeof import("fs");

if (config.IS_NODEJS) {
  fs = require("fs");
}

/* What electron's show-open-dialog resolves to. Note that electron itself
   spells the cancel flag `canceled`, with one L -- see docs/debugging.md. */
interface OpenDialogResult {
  cancelled?: boolean;
  filePaths: string[];
}

interface SaveDialogResult {
  canceled: boolean;
  filePath: string;
}

export function reset() {
  //do nothing
}

export function is_dir(path: string) {
  try {
    let st = fs.statSync(path);
    return st.isDirectory();
  } catch (error) {
    print_stack(error);
    return false;
  }
}

export function get_base_dir(path: string) {
  if (path === undefined)
    return undefined;

  while (path.length > 0 && !is_dir(path)) {
    while (path.length > 0 && path[path.length - 1] != "/" && path[path.length - 1] != "\\") {
      path = path.slice(0, path.length - 1);
    }
    //_fileapi_electron.get_base_dir("C:\\Users\\joeed\\Documents\\test12345.fmo")
    if (path.length > 0) {
      path = path.slice(0, path.length - 1);
    }
  }

  return path == "" ? undefined : path;
}

export function open_file(callback: OpenFileCallback, thisvar: Object,
                          set_current_file: boolean, extslabel: string, exts: string[],
                          error_cb: FileErrorCallback) {
  if (thisvar == undefined)
    thisvar = this; //should point to global object

  let default_path = get_base_dir(g_app_state.filepath);
  //if (default_path === undefined) {
  //let list = getRecentList();
  //console.log(list);
  //}

  let {ipcRenderer} = require('electron');

  //let dialog = require('electron').dialog;
  //if (dialog === undefined) {
  //  dialog = require('electron').remote.dialog;
  //}

  let onthen = (e: OpenDialogResult) => {
    if (e.cancelled) {
      return;
    }

    let path: string | string[] | undefined = e.filePaths;

    if (path instanceof Array) {
      path = path[0];
    }

    let fname = path;

    if (path === undefined) {
      return;
    }

    let idx1 = path.lastIndexOf("/");
    let idx2 = path.lastIndexOf("\\");

    let idx = Math.max(idx1, idx2);
    if (idx >= 0) {
      fname = fname.slice(idx + 1, fname.length);
    }

    console.warn(set_current_file, "set_current_file");

    console.log("path:", path, "name", fname);
    let buf;

    try {
      buf = fs.readFileSync(path);
    } catch (error) {
      print_stack(error);
      console.warn("Failed to load file at path ", path);

      if (error_cb !== undefined)
        error_cb();
    }

    //ensure we have a "clean" ArrayBuffer
    //node's Buffer crap is a bit annoying
    //the documentation seems to imply that odd things can happen
    //when converting between ArrayBuffers and Buffers
    let buf2 = new Uint8Array(buf.byteLength);

    let i = 0;
    for (let b of buf) {
      buf2[i++] = b;
    }

    //now get an ArrayBuffer
    buf = buf2.buffer;

    if (thisvar !== undefined)
      callback.call(thisvar, buf, fname, path);
    else
      callback(buf, fname, path);
  };

  let oncatch = (error: Error) => {
    if (error_cb) {
      error_cb(error);
    }
  }

  ipcRenderer.invoke('show-open-dialog', {
    title                  : "Open",
    defaultPath            : default_path,
    filters                : [{
      name      : extslabel,
      extensions: exts
    }],
    securityScopedBookmarks: true //apparently needed for macOS
  }, wrapRemoteCallback("dialog", onthen), wrapRemoteCallback('dialog', oncatch));
}


export function can_access_path(path: string) {
  try {
    fs.accessSync(path, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch (error) {
    return false;
  }
}

export function save_file(data: FileData, path: string,
                          error_cb: FileErrorCallback, success_cb: FileSuccessCallback) {
  if (data instanceof DataView) {
    data = data.buffer;
  } else if (!(data instanceof ArrayBuffer) && data.buffer) {
    data = data.buffer;
  }

  console.log("Data", data, path);

  data = new Uint8Array(data);

  try {
    fs.writeFileSync(path, data);
  } catch (error) {
    console.warn("Failed to write to path " + path);

    if (error_cb !== undefined)
      error_cb(error);

    print_stack(error);
    return;
  }

  if (success_cb !== undefined) {
    success_cb(path);
  }
}

export function save_with_dialog(data: FileData, default_path: string | undefined,
                                 extslabel: string, exts: string[],
                                 error_cb: FileErrorCallback, success_cb: FileSuccessCallback) {
  let dialog = require('electron').dialog;
  if (dialog === undefined) {
    dialog = require('electron').remote.dialog;
  }

  let {ipcRenderer} = require('electron');

  let onthen = (dialog_data: SaveDialogResult) => {
    let canceled = dialog_data.canceled;
    let path = dialog_data.filePath;

    if (canceled)
      return;

    console.log("SAVING:", path);

    save_file(data, path, error_cb, success_cb);
  };

  let oncatch = (error: Error) => {
    if (error_cb) {
      error_cb(error);
    }
  }

  ipcRenderer.invoke('show-save-dialog', {
    title                  : "Save",
    defaultPath            : default_path,
    filters                : [{
      name      : extslabel,
      extensions: exts
    }],
    securityScopedBookmarks: true //apparently needed for macOS
  }, wrapRemoteCallback("dialog", onthen), wrapRemoteCallback("dialog", oncatch));
}


//XXX refactor me!
export function save_file_old(data: FileData, save_as_mode: boolean, set_current_file: boolean,
                              extslabel: string, exts: string[], error_cb: FileErrorCallback) {
  if (config.CHROME_APP_MODE) {
    return chrome_app_save(data, save_as_mode, set_current_file, extslabel, exts, error_cb);
  }

  if (!(data instanceof Blob))
    data = new Blob([data], {type: "application/octet-binary"});

  var url = URL.createObjectURL(data);

  var link = document.createElement("a");
  link.href = url;

  //XXX evil usage of global
  var name = g_app_state.filepath.trim();
  name = name == "" ? "untitled.fmo" : name;

  link.download = name;
  console.log(link, link.__proto__);
  window._link = link;

  link.click();
  return;

  window.open(url);
  console.log("url:", url);
}
