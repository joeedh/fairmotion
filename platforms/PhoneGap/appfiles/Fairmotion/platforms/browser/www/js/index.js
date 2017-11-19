/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

function barebone_polyfill() {
  if (window.performance) {
    window.time_ms = function () {
      return performance.now();
    }
  } else {
    window.time_ms = function() {
      return Date.now();
    }
  }


  window.mobilecheck = function mobilecheck() {
    return true;
  }

  window.get_callstack = function get_callstack(err) {
    var callstack = [];
    var isCallstackPopulated = false;

    var err_was_undefined = err == undefined;

    if (err == undefined) {
      try {
        _idontexist.idontexist+=0; //doesn't exist- that's the point
      } catch(err1) {
        err = err1;
      }
    }

    if (err != undefined) {
      if (err.stack) { //Firefox
        var lines = err.stack.split('\n');
        var len=lines.length;
        for (var i=0; i<len; i++) {
          if (1) {
            lines[i] = lines[i].replace(/@http\:\/\/.*\//, "|")
            var l = lines[i].split("|")
            lines[i] = l[1] + ": " + l[0]
            lines[i] = lines[i].trim()
            callstack.push(lines[i]);
          }
        }

        //Remove call to printStackTrace()
        if (err_was_undefined) {
          //callstack.shift();
        }
        isCallstackPopulated = true;
      }
    else if (window.opera && e.message) { //Opera
        var lines = err.message.split('\n');
        var len=lines.length;
        for (var i=0; i<len; i++) {
          if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {
            var entry = lines[i];
            //Append next line also since it has the file info
            if (lines[i+1]) {
              entry += ' at ' + lines[i+1];
              i++;
            }
            callstack.push(entry);
          }
        }
        //Remove call to printStackTrace()
        if (err_was_undefined) {
          callstack.shift();
        }
        isCallstackPopulated = true;
      }
    }

    var limit = 24;
    if (!isCallstackPopulated) { //IE and Safari
      var currentFunction = arguments.callee.caller;
      var i = 0;
      while (currentFunction && i < 24) {
        var fn = currentFunction.toString();
        var fname = fn.substring(fn.indexOf("function") + 8, fn.indexOf('')) || 'anonymous';
        callstack.push(fname);
        currentFunction = currentFunction.caller;

        i++;
      }
    }

    return callstack;
  }

  window.print_stack = function print_stack(err) {
    try {
      var cs = get_callstack(err);
    } catch (err2) {
      console.log("Could not fetch call stack.");
      return;
    }

    console.log("Callstack:");
    for (var i=0; i<cs.length; i++) {
      console.log(cs[i]);
    }
  }

  window.myLocalStorage = new MyLocalStorage();
}

//localstorage variant
class MyLocalStorage {
  static set(key, val) {
    localStorage[key] = val;
  }

  static getCached(key) {
    return localStorage[key];
  }

  static getAsync(key) {
    return new Promise(function(accept, reject) {
      accept(localStorage[key]);
    });
  }

  static hasCached(key) {
    return key in localStorage;
  }
}

var app = {
  // Application Constructor
  initialize: function () {
    barebone_polyfill();
    this.bindEvents();
  },
  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: function () {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },

  // deviceready Event Handler
  //
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicitly call 'app.receivedEvent(...);'
  onDeviceReady: function () {
    //see src/core/startup.js
    startup();;

    app.receivedEvent('deviceready');
  },

  // Update DOM on a Received Event
  receivedEvent: function (id) {
    console.log('Received Event: ' + id);
  }
};
