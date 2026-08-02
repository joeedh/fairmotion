/*
 * Static dev server for the html5 target.
 *
 *   pnpm serv [port] [--root=dist/html5app]
 *
 * Sets COOP/COEP so SharedArrayBuffer stays available to the wasm paths.
 * esbuild's own serve cannot set custom response headers, which is why this
 * exists as a plain Node server rather than an esbuild flag.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let port = 5050;
let root = path.join(repoRoot, "dist", "html5app");

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--root=")) {
    root = path.resolve(repoRoot, arg.slice("--root=".length));
  } else if (/^\d+$/.test(arg)) {
    port = parseInt(arg);
  }
}

const MIME = {
  ".css": "text/css",
  ".fmo": "application/octet-stream",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "application/javascript",
  ".json": "application/json",
  ".map": "application/json",
  ".mjs": "application/javascript",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain",
  ".wasm": "application/wasm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

/* Test fixtures live at the repo root, not under the build output. */
const extraRoots = [root, repoRoot];

function resolveFile(urlPath) {
  const rel = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
  const candidates = rel === "" ? ["index.html"] : [rel, path.join(rel, "index.html")];

  for (const base of extraRoots) {
    for (const candidate of candidates) {
      const full = path.resolve(base, candidate);

      /* Never serve outside the roots. */
      if (!full.startsWith(base)) {
        continue;
      }
      if (fs.existsSync(full) && fs.statSync(full).isFile()) {
        return full;
      }
    }
  }

  return undefined;
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url ?? "/");

  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  res.setHeader("Cache-Control", "no-store");

  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 " + req.url);
    return;
  }

  res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

server.listen(port, () => {
  console.log(`serving ${root} on http://localhost:${port}`);
});
