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

export function open_file(callback: OpenFileCallback, thisvar: Object | undefined,
                          set_current_file: boolean, extslabel: string, exts: string[],
                          error_cb: FileErrorCallback) {
  /* NOTE: a `thisvar = this` fallback stood here, commented "should point to
     global object".  The module is strict-mode ESM, so `this` is undefined. */

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

  /* The dialog result arrives over electron's IPC untyped.  NOTE: electron
     spells the cancel flag `canceled`, with one L, so the test below has never
     matched; a cancel falls out at the `typeof path` check instead. */
  let onthen = (result: unknown) => {
    if (typeof result !== "object" || result === null) {
      return;
    }

    if ("cancelled" in result && result.cancelled) {
      return;
    }

    let path: unknown = "filePaths" in result ? result.filePaths : undefined;

    if (path instanceof Array) {
      path = path[0];
    }

    if (typeof path !== "string") {
      return;
    }

    let fname = path;

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

      /* NOTE: there was no return here, so a failed read reported the error and
         then threw a TypeError on buf.byteLength immediately below. */
      return;
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
    let data = buf2.buffer;

    if (thisvar !== undefined)
      callback.call(thisvar, data, fname, path);
    else
      callback(data, fname, path);
  };

  let oncatch = (error: unknown) => {
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
  /* NOTE: a Blob reached `new Uint8Array(data)` below and threw; nothing
     in-tree hands this backend one. */
  if (data instanceof Blob) {
    throw new Error("save_file: a Blob cannot be written synchronously");
  }

  console.log("Data", data, path);

  let bytes = new Uint8Array(data instanceof ArrayBuffer ? data : data.buffer);

  try {
    fs.writeFileSync(path, bytes);
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

  let onthen = (result: unknown) => {
    if (typeof result !== "object" || result === null) {
      return;
    }

    if ("canceled" in result && result.canceled) {
      return;
    }

    let path = "filePath" in result ? result.filePath : undefined;

    if (typeof path !== "string") {
      return;
    }

    console.log("SAVING:", path);

    save_file(data, path, error_cb, success_cb);
  };

  let oncatch = (error: unknown) => {
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
  /* NOTE: a chrome_app_save() call guarded by config.CHROME_APP_MODE stood
     here.  No such function exists anywhere in the tree. */

  if (!(data instanceof Blob))
    data = new Blob([data], {type: "application/octet-binary"});

  var url = URL.createObjectURL(data);

  var link = document.createElement("a");
  link.href = url;

  //XXX evil usage of global
  var name = g_app_state.filepath.trim();
  name = name == "" ? "untitled.fmo" : name;

  link.download = name;
  console.log(link, Object.getPrototypeOf(link));
  window._link = link;

  link.click();
  return;

  window.open(url);
  console.log("url:", url);
}
