"use strict";
"not_a_module";
"not_covered_prof";

/*
this module is used by code coverage profiling
*/

window.coverage = (function coverage_module() {
  var exports = {};
  
  exports.lines = {};
  
  var Line = exports.Line = function Line(file, line) {
    this.file = file;
    this.line = line;
    this.count = 0;
  }
  
  exports.getLine = function(file, line) {
    var hash = "" + file + line;
    if (!(hash in exports.lines)) {
      exports.lines[hash] = new Line(file, line);
    }
    
    return exports.lines[hash];
  }
  
  window.$cov_prof = function(file, line) {
    exports.getLine(file, line).count++;
  }

  window.$cov_reg = function(file, line) {
    exports.getLine(file, line);
  }
  
  exports.report = function() {
    var lines = []
    var files = {}
    var ftots = {}
    
    for (var k in exports.lines) {
      var l = exports.lines[k];
      if (!(l.file in files)) {
        files[l.file] = [];
        ftots[l.file] = 0;
      }
      
      lines.push(l);
      files[l.file].push(l)
    }
    
    for (var i=0; i<lines.length; i++) {
      var l = lines[i];
      var tot = files[l.file].length;
      
      if (l.count > 0) {
        ftots[l.file] += 1.0 / tot;
      }
    }
    
    var flat = [];
    for (var k in ftots) {
      flat.push([k, ftots[k]]);
    }
    
    flat.sort(function(a, b) {
      return a[1] - b[1];
    });
    
    var out = ""
    for (var i=0; i<flat.length; i++) {
      out += ""+flat[i]+"\n";
    }
    
    return out;
  }

  return exports;
})();
