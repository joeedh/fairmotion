"not_a_module";
"use strict";
"not_covered_prof";

/*
this module is used by code coverage profiling
*/

window.coverage = (function coverage_module() {
  class Line {
    file: string;
    line: number;
    count: number;

    constructor(file: string, line: number) {
      this.file = file;
      this.line = line;
      this.count = 0;
    }
  }

  /* Keyed by file name concatenated with line number. Was exports.lines, which
     was only ever mutated, never reassigned. */
  const lines: {[hash: string]: Line} = {};

  function getLine(file: string, line: number) {
    var hash = "" + file + line;
    if (!(hash in lines)) {
      lines[hash] = new Line(file, line);
    }

    return lines[hash];
  }

  window.$cov_prof = function(file: string, line: number) {
    getLine(file, line).count++;
  }

  window.$cov_reg = function(file: string, line: number) {
    getLine(file, line);
  }

  function report() {
    var all: Line[] = []
    /* Every recorded line grouped by file, and the fraction of each file's
       lines that were hit at least once. */
    var files: {[file: string]: Line[]} = {}
    var ftots: {[file: string]: number} = {}

    for (var k in lines) {
      var l = lines[k];
      if (!(l.file in files)) {
        files[l.file] = [];
        ftots[l.file] = 0;
      }

      all.push(l);
      files[l.file].push(l)
    }

    for (var i=0; i<all.length; i++) {
      var l = all[i];
      var tot = files[l.file].length;

      if (l.count > 0) {
        ftots[l.file] += 1.0 / tot;
      }
    }

    var flat: [string, number][] = [];
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

  return {lines, Line, getLine, report};
})();
