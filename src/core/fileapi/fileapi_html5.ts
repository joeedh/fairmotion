"use strict";

//XXX refactor me!

import * as config from '../../config/config.js';
import type {
  FileData, FileErrorCallback, FileSuccessCallback, OpenFileCallback
} from './fileapi.js';

export function clearRecentList() {
  //nothing
}

export function getRecentList(): string[] {
  return [];
}

export function setRecent(name: string, id: string) {
  //do nothing
}

export function openRecent(thisvar: Object, id: string) {
  throw new Error("not supported for html5");
}

export function reset() {
  //nothing
}

export function open_file(callback: OpenFileCallback, thisvar: Object,
                          set_current_file: boolean, extslabel: string, exts: string[]) {
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
    
    input.onchange = function(this: HTMLInputElement, e: Event) {
        var files = this.files;

        if (!finished) {
            document.body.removeChild(form);
            finished = true;
        }
        
        if (files.length == 0) return;
        var file = files[0];
        var reader = new FileReader();
        reader.onload = function(e: ProgressEvent<FileReader>) {
            console.log(e.target.result);
            callback.call(thisvar, e.target.result, file.name, file.name);
        }
        reader.readAsArrayBuffer(file);
    }
    
    input.focus();
    input.select();
    input.click();
    
    window.finput = input;
    form.appendChild(input);
}

export function can_access_path(path: string) {
    return false;
}

//XXX refactor me!
export function save_file(data: FileData, save_as_mode: boolean, set_current_file: boolean,
                          extslabel: string, exts: string[], error_cb: FileErrorCallback) {
    if (config.CHROME_APP_MODE) {
      return chrome_app_save(data, save_as_mode, set_current_file, extslabel, exts, error_cb);
    }
    
    if (!(data instanceof Blob))
      data = new Blob([data], {type : "application/octet-binary"});
    
    var url = URL.createObjectURL(data);
    
    var link = document.createElement("a");
    link.href = url;
    
    //XXX evil usage of global
    var name = g_app_state.filepath;
    
    name = name === undefined || name.trim() == "" ? "untitled.fmo" : name;
    
    link.download = name; 
    console.log(link, link.__proto__);
    window._link = link;
    
    link.click();
    return;
    
    window.open(url);
    console.log("url:", url);
}

export function save_with_dialog(data: FileData, default_path: string | undefined,
                                 extslabel: string, exts: string[],
                                 error_cb: FileErrorCallback, success_cb: FileSuccessCallback) {
    return save_file(data, true, false, extslabel, exts, error_cb);
}
