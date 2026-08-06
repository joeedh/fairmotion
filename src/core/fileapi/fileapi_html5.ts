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

export function open_file(callback: OpenFileCallback, thisvar: Object | undefined,
                          set_current_file: boolean, extslabel: string, exts: string[]) {
    /* NOTE: a `thisvar = this` fallback stood here, commented "should point to
       global object".  The module is strict-mode ESM, so `this` is undefined. */

    var form = document.createElement("form")
    document.body.appendChild(form);
    
    var input = document.createElement("input");
    input.type = "file"
    input.id = "file"
    input.style.position = "absolute"
    input.style.zIndex = "10";
    /* NOTE: an `input.style.visible = "hidden"` sat here; there is no such CSS
       property, and the visibility line below is the one that works. */
    input.style.visibility = "hidden";
    
    var finished = false;
    var onabort = function() {
        console.log("aborted");
        if (!finished) {
            document.body.removeChild(form);
            finished = true;
        }
    }

    /* NOTE: `close` is not a property of HTMLInputElement, so the third
       assignment in the chain only ever added an expando. */
    Reflect.set(input, "close", onabort);
    input.oncancel = input.onabort = onabort;

    input.onchange = function(e: Event) {
        var files = input.files;

        if (!finished) {
            document.body.removeChild(form);
            finished = true;
        }

        if (files === null || files.length == 0) return;
        var file = files[0];
        var reader = new FileReader();
        reader.onload = function(e: ProgressEvent<FileReader>) {
            var result = e.target === null ? undefined : e.target.result;

            console.log(result);

            if (!(result instanceof ArrayBuffer)) {
                throw new Error("readAsArrayBuffer() did not produce an ArrayBuffer");
            }

            callback.call(thisvar, result, file.name, file.name);
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
    /* NOTE: a chrome_app_save() call guarded by config.CHROME_APP_MODE stood
       here.  No such function exists anywhere in the tree, and fileapi.ts
       dispatches chrome-app mode to fileapi_chrome, so it was unreachable. */

    if (!(data instanceof Blob))
      data = new Blob([data], {type : "application/octet-binary"});
    
    var url = URL.createObjectURL(data);
    
    var link = document.createElement("a");
    link.href = url;
    
    //XXX evil usage of global
    var name = g_app_state.filepath;
    
    name = name === undefined || name.trim() == "" ? "untitled.fmo" : name;
    
    link.download = name;
    console.log(link, Object.getPrototypeOf(link));
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
