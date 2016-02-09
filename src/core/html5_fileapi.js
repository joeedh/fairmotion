"use strict";

import * as config from 'config';

var current_chromeapp_file = undefined;

export function chrome_get_current_file() {
  return current_chromeapp_file;
} 

export function reset() {
  if (config.CHROME_APP_MODE) {
    current_chromeapp_file = undefined;
  }
}

export function chrome_app_open(callback, thisvar, set_current_file, exts) {
  console.log("Chrome open");

  function errorHandler() {
    console.log("Error reading file!", arguments);
  }
  
  var params = {type: 'openFile'};
  params.accepts = [{
      description : "Fairmotion Files",
      extensions  : exts
  }];
  
  chrome.fileSystem.chooseEntry(params, function(readOnlyEntry) {
    if (set_current_file)
      current_chromeapp_file = readOnlyEntry;
    
    readOnlyEntry.file(function(file) {
      var reader = new FileReader();

      console.log("got file", arguments, reader);
      
      reader.onerror = errorHandler;
      reader.onload = function(e) {
        console.log(e.target.result);
        callback.call(thisvar, e.target.result);
      };

      reader.readAsArrayBuffer(file);
    });
  });
}

export function open_file(callback, thisvar, set_current_file, exts) {
    if (config.CHROME_APP_MODE) {
      return chrome_app_open(callback, thisvar, set_current_file, exts);
    }
    
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
            callback.call(thisvar, e.target.result);
        }
        reader.readAsArrayBuffer(file);
    }
    
    input.focus();
    input.select();
    input.click();
    
    window.finput = input;
    form.appendChild(input);
}

export function chrome_app_save(data, save_as_mode, set_current_file, exts) {
  function errorHandler() {
    console.log("Error writing file!", arguments);
  }
  
  function chooseFile() {
    var params = {type: 'saveFile'};
    
    if (g_app_state.filepath != "" & g_app_state.filepath != undefined) {
      params.suggestedName = g_app_state.filepath;
    }
    params.accepts = [{
      description : "Fairmotion Files",
      extensions  : exts
    }];
    
    chrome.fileSystem.chooseEntry(params, function(writableFileEntry) {
        if (writableFileEntry == undefined) {
          console.log("user cancel?");
          return;
        }
        
        current_chromeapp_file = writableFileEntry;
        
        writableFileEntry.createWriter(function(writer) {
          writer.onerror = errorHandler;
          writer.onwriteend = function(e) {
            console.log('write complete');
          };
          
          data = new Blob([data], {type : "application/octet-binary"});
          writer.write(data);
        }, errorHandler);
    });
  }
  
  function error() {
    console.log("Error writing file", arguments);
    current_chromeapp_file = undefined;
  }
  
  if (save_as_mode || current_chromeapp_file == undefined) {
    chooseFile();
  } else if (current_chromeapp_file != undefined) {
    current_chromeapp_file.createWriter(function(writer) {
      writer.onerror = error;
      //writer.onwriteend = callback;
      data = new Blob([data], {type : "application/octet-binary"});
      writer.write(data);
    }, errorHandler);
  }
}

export function save_file(data, save_as_mode, set_current_file, exts) {
    if (config.CHROME_APP_MODE) {
      return chrome_app_save(data, save_as_mode, set_current_file, exts);
    }
    
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
