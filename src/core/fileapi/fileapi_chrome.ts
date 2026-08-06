"use strict";

import type {
  FileData, FileErrorCallback, OpenFileCallback
} from './fileapi.js';

/* The entry chrome hands back for the file currently being edited; kept so a
   plain save can rewrite it without a dialog. */
var current_chromeapp_file: ChromeFileEntry | undefined = undefined;

export function chrome_get_current_file() {
  return current_chromeapp_file;
}

export function reset() {
    current_chromeapp_file = undefined;
}

export function open_file(callback: OpenFileCallback, thisvar: Object,
                          set_current_file: boolean, extslabel: string, exts: string[]) {
  console.log("Chrome open");

  function errorHandler() {
    console.log("Error reading file!", arguments);
  }

  var params: ChooseEntryParams = {type: 'openFile'};
  params.accepts = [{
    description : extslabel,
    extensions  : exts
  }];

  chrome.fileSystem.chooseEntry(params, function(readOnlyEntry: ChromeFileEntry) {
    if (readOnlyEntry == undefined) //canceled?
      return;

    if (set_current_file)
      current_chromeapp_file = readOnlyEntry;

    readOnlyEntry.file(function(file) {
      var reader = new FileReader();

      console.log("got file", arguments, reader);

      reader.onerror = errorHandler;
      reader.onload = function(e: ProgressEvent<FileReader>) {
        var id = chrome.fileSystem.retainEntry(readOnlyEntry);
        var result = e.target === null ? undefined : e.target.result;

        console.log("\n\n           ->", result, readOnlyEntry, id, "<-\n\n");

        if (!(result instanceof ArrayBuffer)) {
          throw new Error("readAsArrayBuffer() did not produce an ArrayBuffer");
        }

        callback.call(thisvar, result, file.name, id);
      };

      reader.readAsArrayBuffer(file);
    });
  });
}

export function save_file(data: FileData, save_as_mode: boolean, set_current_file: boolean,
                          extslabel: string, exts: string[], error_cb: FileErrorCallback) {
  function errorHandler() {
    console.log("Error writing file!", arguments);
  }

  function chooseFile() {
    var params: ChooseEntryParams = {type: 'saveFile'};

    if (g_app_state.filepath != "" && g_app_state.filepath != undefined) {
      params.suggestedName = g_app_state.filepath;
    }
    params.accepts = [{
      description : extslabel,
      extensions  : exts
    }];

    chrome.fileSystem.chooseEntry(params, function(writableFileEntry) {
      if (writableFileEntry == undefined) {
        console.log("user cancel?");
        return;
      }

      if (set_current_file)
        current_chromeapp_file = writableFileEntry;

      writableFileEntry.createWriter(function(writer) {
        writer.onerror = errorHandler;
        writer.onwriteend = function(e) {
          console.log('write complete');
          g_app_state.notes.label("File saved");
        };

        if (!(data instanceof Blob))
          data = new Blob([data], {type : "application/octet-binary"});

        writer.write(data);
      }, errorHandler);
    });
  }

  function error(...args: unknown[]) {
    console.log("Error writing file", args);
    current_chromeapp_file = undefined;

    /* NOTE: this was `error_cb.apply(this, arguments)`; `this` is undefined in
       a strict-mode function, and every error callback in-tree takes none. */
    if (error_cb != undefined)
      error_cb(args[0]);
  }

  if (save_as_mode || current_chromeapp_file == undefined) {
    chooseFile();
  } else if (current_chromeapp_file != undefined) {
    current_chromeapp_file.createWriter(function(writer) {
      writer.onerror = error;
      writer.onwriteend = function() {
        console.log('write complete');
        g_app_state.notes.label("File saved");
      }

      data = new Blob([data], {type : "application/octet-binary"});
      writer.write(data);
    }, errorHandler);
  }
}

