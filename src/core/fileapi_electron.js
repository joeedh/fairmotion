"use strict";

import * as config from '../config/config.js';
import * as fileapi_html5 from './fileapi_html5.js';

let fs;

if (config.IS_NODEJS) {
  fs = require("fs");
}

export function reset() {
  //do nothing
}

//returns {name: id} pairs
export function getRecentList() {
  if (!myLocalStorage.hasCached("recent_files")) {
    var list = [];

    myLocalStorage.set("recent_files", list);
    return list;
  }

  return myLocalStorage.getCached("recent_files");
}

export function setRecent(name, id) {
  var list = myLocalStorage.getCached("recent_files");
  var item;

  //make queue logic by reversing list
  list.reverse();

  for (item of list) {
    if (item.id === id) {
      break;
    }
  }

  if (item === undefined) {
    item = {name: name, id: id};

    //pop the oldest entry off the list
    list.shift();
  } else {
    item.name = name;
    item.id = id;
    list.remove(item);
  }

  //push item onto list
  list.push(item);

  //unreverse
  list.reverse();

  myLocalStorage.set("recent_files", list);

  electron_app.addRecentDocument(id);
}


export function clearRecentList() {
  myLocalStorage.set("recent_files", {});
}

export function is_dir(path) {
  try {
    let st = fs.statSync(path);
    return st.isDirectory();
  } catch (error) {
    print_stack(error);
    return false;
  }
}

export function get_base_dir(path) {
  if (path === undefined)
    return undefined;
  
  while (path.length > 0 && !is_dir(path)) {
    while (path.length > 0 && path[path.length-1] != "/" && path[path.length-1] != "\\") {
      path = path.slice(0, path.length-1);
    }
    //_fileapi_electron.get_base_dir("C:\\Users\\joeed\\Documents\\test12345.fmo")
    if (path.length > 0) {
      path = path.slice(0, path.length-1);
    }
  }
  
  return path == "" ? undefined : path;
}

export function open_file(callback, thisvar, set_current_file, extslabel, exts, error_cb) {
  if (thisvar == undefined)
    thisvar = this; //should point to global object
  
  let default_path = get_base_dir(g_app_state.filepath);
  //if (default_path === undefined) {
    //let list = getRecentList();
    //console.log(list);
  //}
  
  let dialog = require('electron').dialog;
  if (dialog === undefined) {
    dialog = require('electron').remote.dialog;
  }
  
  dialog.showOpenDialog(undefined, {
    title        : "Open",
    defaultPath  : default_path,
    filters      : [{
      name       : extslabel,
      extensions : exts
    }],
    securityScopedBookmarks : true //apparently needed for macOS
  }, (path) => {
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
      fname = fname.slice(idx+1, fname.length);
    }
    
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
  });
  
  return; //XXX
  
  console.trace("open_file called");
  
  var form = document.createElement("form")
  document.body.appendChild(form);

  var input = document.createElement("input");
  input.type = "file"
  input.id = "file"
  input.style.position = "absolute"
  input.style["z-index"] = 10;
  input.style.visible = "hidden";
  input.style.visibility = "hidden";

  var finished = false;
  input.oncancel = input.onabort = input.close = function() {
    console.log("aborted");
    if (!finished) {
      document.body.removeChild(form);
      finished = true;
    }
  }

  input.onchange = function(e) {
    var files = this.files;

    if (!finished) {
      document.body.removeChild(form);
      finished = true;
    }

    if (files.length == 0) return;
    
    var file = files[0];
    var reader = new FileReader();
    
    reader.onload = function(e) {
      console.log(e.target.result);
      callback.call(thisvar, e.target.result, file.name, file.path);
    }
    reader.readAsArrayBuffer(file);
  }

  input.focus();
  input.select();
  input.click();

  window.finput = input;
  form.appendChild(input);
}

export function can_access_path(path) {
  try {
    fs.accessSync(path, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch (error) {
    return false;
  }
}

export function save_file(data, path, error_cb, success_cb) {
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

export function save_with_dialog(data, default_path, extslabel, exts, error_cb, success_cb) {
  let dialog = require('electron').dialog;
  if (dialog === undefined) {
    dialog = require('electron').remote.dialog;
  }
  
  dialog.showSaveDialog(undefined, {
    title        : "Save",
    defaultPath  : default_path,
    filters      : [{
      name       : extslabel,
      extensions : exts
    }],
    securityScopedBookmarks : true //apparently needed for macOS
  }, (path) => {
    console.log("path:", path);
    save_file(data, path, error_cb, success_cb);
  });
  
  return;
  if (!(data instanceof Blob))
    data = new Blob([data], {type : "application/octet-binary"});
  
  var url = URL.createObjectURL(data);
  
  var link = document.createElement("a");
  link.href = url;
  
  //XXX evil usage of global
  var name = g_app_state.filepath;
  name = name == "" || name === undefined ? "untitled.fmo" : name.trim();
  
  link.download = name;
  console.log(link, link.__proto__);
  window._link = link;
  
  link.click();
}

//XXX refactor me!
export function save_file_old(data, save_as_mode, set_current_file, extslabel, exts, error_cb) {
  if (config.CHROME_APP_MODE) {
    return chrome_app_save(data, save_as_mode, set_current_file, extslabel, exts, error_cb);
  }

  if (!(data instanceof Blob))
    data = new Blob([data], {type : "application/octet-binary"});

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
