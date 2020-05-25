"use strict";
"NOT_A_MODULE";

function _normpath1(path) {
  path = path.replace(/\\/g, "/").trim();
  
  while (path.startsWith("/")) {
    path = path.slice(1, path.length);
  }
  
  while (path.endsWith("/")) {
    path = path.slice(0, path.length-1);
  }
  
  return path;
}

function normpath(path, basepath) {
  path = _normpath1(path);
  basepath = _normpath1(basepath);
  
  if (path[0] == "." && path[1] == "/") {
    path = basepath + "/" + path.slice(2, path.length);
  }
  
  let ps = path.split("/");
  let bs = basepath.split("basepath");
  
  let stack = [];
  
  for (let i=0; i<ps.length; i++) {
    if (ps[i] == "..") {
      stack.pop();
    } else {
      stack.push(ps[i]);
    }
  }
  
  path = ""
  
  for (let c of stack) {
    path = path + "/" + c
  }
  
  return path;
}

function test_pathutils() {
  console.log("test");
  
  console.log(normpath("./bleh", "/dev/fairmotion"));
  console.log(normpath("./bleh/../../bluenoise9", "/dev/fairmotion"));
  console.log(normpath("./bleh/../../bluenoise9", ""));
}

test_pathutils();
