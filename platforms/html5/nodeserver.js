INDEX = "index.html"
let PORT = 5000;

let list = function(l) {
  let ret = [];
  for (let i of l) {
    ret.push(i);
  }
  
  return ret;
};

let http = require('http');
let fs = require('fs');
let pathm = require('path');
let os = require('os');

IS_WIN32 = os.platform() === "win32";

let mimemap = {
  ".js" : "application/javascript",
  ".png" : "image/png",
  ".jpg" : "image/jpg",
  ".tiff" : "image/tiff",
  ".wasm" : "application/wasm",
  ".svg" : "image/svg+xml",
  ".html" : "text/html",
  ".txt"  : "text/plain"
};

let getMime = function(path) {
  path = path.trim();
  
  for (let k in mimemap) {
    if (path.endsWith(k)) {
      return mimemap[k];
    }
  }
  
  return "text/plain";
};

let getFile = function(path) {
  return fs.readFileSync(path);
};

let error_message = (code) => {
  switch (code) {
    case 404:
      return "path does not exist";
    case 500:
      return "internal server error";
    default:
      return "unknown error";
  }
};

let format_error = (code, message = undefined) => {
  if (message === undefined) {
    message = error_message(code);
  }
  
  return `<!doctype html>
<html>
<head><title>${code}</title></head>
<body>Error: ${message}</body>
</html>
  `;
}

let send_error = (code, res, message=undefined) => {
  let buf = format_error(code, message);
  
  res.writeHead(code, {
    "Content-Type" : 'text/html',
    "Content-len" : buf.length
  });
  
  res.write(buf);
  res.end();
};

let server = new http.Server((req, res) => {
  let path = req.url.trim();
  path = pathm.normalize(path);
  if (IS_WIN32) {
    path = path.replace(/\\/g, '/');
  }
  
  if (path == "/")
    path = INDEX;
  
  while (path.startsWith("/") || path.startsWith("\\")) {
    path = path.slice(1, path.length).trim();
  }
  
  if (!fs.existsSync(path)) {
    console.log("ERROR: ", path, "does not exist");
    return send_error(404, res);
  }
  
  let file = getFile(path);
  
  res.setHeader("Content-Type", getMime(path));
  res.setHeader("Content-len", file.length);
  res.writeHead(200);
  
  console.log(req.method, req.url, getMime(path));
  res.write(file);

  res.end();
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log('Address in use, retrying...');
    setTimeout(() => {
      server.close();
      server.listen(PORT, HOST);
    }, 1000);
  }
});

console.log("listening on port", PORT);
server.listen(PORT);
