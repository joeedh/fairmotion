"use strict";

import * as config from 'config';
import * as fileapi_html5 from 'fileapi_html5';



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

export function open_file(callback, thisvar, set_current_file, extslabel, exts) {
  if (thisvar == undefined)
    thisvar = this; //should point to global object

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

//XXX refactor me!
export function save_file(data, save_as_mode, set_current_file, extslabel, exts, error_cb) {
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
