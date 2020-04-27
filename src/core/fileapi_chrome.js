"use strict";

var current_chromeapp_file = undefined;

export function chrome_get_current_file() {
  return current_chromeapp_file;
}

export function reset() {
    current_chromeapp_file = undefined;
}

export function open_file(callback, thisvar, set_current_file, extslabel, exts) {
  console.log("Chrome open");

  function errorHandler() {
    console.log("Error reading file!", arguments);
  }

  var params = {type: 'openFile'};
  params.accepts = [{
    description : extslabel,
    extensions  : exts
  }];

  chrome.fileSystem.chooseEntry(params, function(readOnlyEntry) {
    if (readOnlyEntry == undefined) //canceled?
      return;

    if (set_current_file)
      current_chromeapp_file = readOnlyEntry;

    readOnlyEntry.file(function(file) {
      var reader = new FileReader();

      console.log("got file", arguments, reader);

      reader.onerror = errorHandler;
      reader.onload = function(e) {
        var id = chrome.fileSystem.retainEntry(readOnlyEntry);
        console.log("\n\n           ->", e.target.result, readOnlyEntry, id, "<-\n\n");

        callback.call(thisvar, e.target.result, file.name, id);
      };

      reader.readAsArrayBuffer(file);
    });
  });
}

export function save_file(data, save_as_mode, set_current_file, extslabel, exts, error_cb) {
  function errorHandler() {
    console.log("Error writing file!", arguments);
  }

  function chooseFile() {
    var params = {type: 'saveFile'};

    if (g_app_state.filepath != "" & g_app_state.filepath != undefined) {
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

  function error() {
    console.log("Error writing file", arguments);
    current_chromeapp_file = undefined;

    if (error_cb != undefined)
      error_cb.apply(this, arguments); //pass on any arguments
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

