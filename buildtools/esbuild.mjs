/*
 * Fairmotion build.
 *
 *   node buildtools/esbuild.mjs              html5   -> dist/html5app
 *   node buildtools/esbuild.mjs --electron   electron -> dist/electron
 *   node buildtools/esbuild.mjs --watch      rebuild on change
 *   node buildtools/esbuild.mjs --dev        sourcemaps, no minify
 *
 * Replaces js_build.py + tools/extjs_cc. The app is one IIFE bundle built from
 * src/entry_point.ts; a handful of files that predate ES modules are emitted
 * as separate classic scripts because the bundle reads their globals.
 */
import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import {fileURLToPath} from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const argv = process.argv.slice(2);
const opts = {
  electron: argv.includes("--electron"),
  watch   : argv.includes("--watch"),
  dev     : argv.includes("--dev") || argv.includes("--watch"),
  minify  : argv.includes("--minify"),
};

/*
 * Files that were never ES modules. They declare their globals at script top
 * level (cachering, GArray, defined_classes, startup_report, pop_solve,
 * CryptoJS, LZString, esprima) and module-scope code in the bundle reads them
 * while it evaluates, so they must run first and must not be wrapped. esbuild
 * transpiles each one individually with bundle:false, which leaves top-level
 * scope alone. Order is js_sources.py's order and is load-bearing:
 * typesystem.js declares `defined_classes`, utils.js replaces it with a GArray.
 */
const GLOBAL_SCRIPTS = [
  "src/core/startup/coverage.ts",
  "src/util/polyfill_fairmotion.ts",
  "src/core/startup/typelogger.ts",
  "src/core/startup/typesystem.ts",
  "tools/utils/crypto/sha1.js",
  "tools/utils/libs/lz-string/libs/base64-string-v1.1.0.js",
  "tools/utils/libs/lz-string/libs/lz-string-1.3.3.js",
  "tools/utils/libs/node_modules/esprima/esprima.js",
  "src/core/startup/redraw_globals.ts",
  "src/util/utils.ts",
  "src/core/startup/localstorage.ts",
];

/*
 * Loaded by filename from a Worker constructor, so they can't be bundled.
 * `new Worker("vectordraw_canvas2d_worker.js")` in vectordraw_jobs.ts names the
 * output, so these are transpiled to the target root under their old extension.
 */
const WORKERS = [
  "src/vectordraw/vectordraw_canvas2d_worker.ts",
  "src/vectordraw/vectordraw_skia_worker.ts",
];

/* Node builtins reachable only from the electron code paths. In the html5
   bundle these become throwing stubs, which is what they were before. */
const NODE_EXTERNALS = [
  "fs", "os", "OS", "path", "process", "electron", "v8", "child_process", "http", "https",
];

const target = opts.electron
  ? {
      name    : "electron",
      outDir  : path.join(repoRoot, "dist/electron"),
      html    : "platforms/Electron/index.html",
      htmlName: "index.html",
    }
  : {
      name    : "html5",
      outDir  : path.join(repoRoot, "dist/html5app"),
      html    : "platforms/html5/main.html",
      htmlName: "index.html",
    };

const fcontent = path.join(target.outDir, "fcontent");
const globalsDir = path.join(fcontent, "globals");

function abs(p) {
  return path.join(repoRoot, p);
}

function mkdirp(p) {
  fs.mkdirSync(p, {recursive: true});
}

function copyFile(src, dst) {
  if (!fs.existsSync(abs(src))) {
    return false;
  }
  mkdirp(path.dirname(dst));
  fs.copyFileSync(abs(src), dst);
  return true;
}

function copyDir(src, dst) {
  if (!fs.existsSync(abs(src))) {
    return false;
  }
  /* realpath + dereference: pnpm's node_modules entries are symlinks into
     .pnpm/, and cpSync's src/dest kind check runs before it dereferences. */
  fs.rmSync(dst, {recursive: true, force: true});
  fs.cpSync(fs.realpathSync(abs(src)), dst, {recursive: true, dereference: true, force: true});
  return true;
}

/*
 * Rewrites the single app.js <script> in the source html into the real load
 * order: globals first, then the bundle.
 *
 * `defer` is required, not cosmetic. The legacy module emulation registered
 * module bodies and only evaluated them once something asked for them, so
 * top-level code like startup.js's `document.body.style` ran well after parse.
 * An esbuild bundle evaluates every module body the moment the tag executes,
 * and these tags live in <head>. defer keeps document order and moves all of
 * it to after the document is parsed.
 */
function writeHtml() {
  let html = fs.readFileSync(abs(target.html), "utf8");

  const tags = GLOBAL_SCRIPTS.map(
    (f) => `<script defer type="text/javascript" src="./fcontent/globals/${path.basename(f)}"></script>`
  ).concat([`<script defer type="text/javascript" src="./fcontent/app.js"></script>`]);

  const re = /[ \t]*<script[^>]*src=["'][^"']*fcontent\/app\.js["'][^>]*>\s*<\/script>/;
  if (!re.test(html)) {
    throw new Error(`no fcontent/app.js script tag in ${target.html}`);
  }

  html = html.replace(re, tags.map((t) => "    " + t).join("\n"));
  fs.writeFileSync(path.join(target.outDir, target.htmlName), html);
}

function copyAssets() {
  mkdirp(fcontent);
  mkdirp(globalsDir);

  copyFile("src/datafiles/iconsheet.svg", path.join(fcontent, "iconsheet.svg"));
  copyFile("src/wasm/_built_wasm.wasm", path.join(fcontent, "built_wasm.wasm"));

  copyDir("addons", path.join(target.outDir, "addons"));

  if (opts.electron) {
    for (const f of ["config.js", "main.js", "preload.js", "package.json"]) {
      copyFile("platforms/Electron/" + f, path.join(target.outDir, f));
    }
    copyDir("node_modules/canvaskit-wasm", path.join(target.outDir, "node_modules/canvaskit-wasm"));
  } else {
    for (const f of ["config.js", "nodeserver.js", "package.json"]) {
      copyFile("platforms/html5/" + f, path.join(target.outDir, f));
    }
    copyDir("node_modules/canvaskit-wasm", path.join(target.outDir, "canvaskit-wasm"));
  }

  writeHtml();
}

/*
 * Re-creates extjs_cc's g_register_classes pass.
 *
 * The transpiler emitted `_ESClass.register(Foo)` after every class it saw,
 * which is the only thing that ever filled `defined_classes` -- the list
 * init_struct_packer() and init_toolop_structs() walk to find every class with
 * a STRUCT script and every ToolOp subclass. Without it nstructjs sees no app
 * structs at all and validateStructs() fails on the first cross-reference.
 *
 * Appending at the end of the module instead of after each class is safe: all
 * top-level classes are initialized by then, and nothing reads the list during
 * module evaluation.
 *
 * path.ux is included, not excluded: js_sources.py globbed every file under
 * src/path.ux/scripts into the transpiler too, and that is the only reason
 * tools like screen.area.split -- whose registerTool() calls are commented out
 * upstream -- ever reach register_toolops().
 */
const classRegistryPlugin = {
  name: "es-class-registry",
  setup(build) {
    build.onLoad({filter: /\.[jt]sx?$/}, (args) => {
      const rel = path.relative(repoRoot, args.path).replace(/\\/g, "/");
      if (rel.startsWith("..") || rel.includes("node_modules/") || rel.includes("/lib/tinymce/")) {
        return null;
      }

      const contents = fs.readFileSync(args.path, "utf8");
      const sourceFile = ts.createSourceFile(args.path, contents, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

      const names = [];
      for (const stmt of sourceFile.statements) {
        if (!ts.isClassDeclaration(stmt) || !stmt.name) {
          continue;
        }
        /* `declare class` is an ambient type declaration. It is erased, so
           there is no binding left to register. */
        if (stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.DeclareKeyword)) {
          continue;
        }
        names.push(stmt.name.text);
      }

      if (names.length === 0) {
        return null;
      }

      const tail = names.map((n) => `_ESClass.register(${n});`).join("\n");
      return {contents: contents + "\n" + tail + "\n", loader: "ts"};
    });
  },
};

const shared = {
  bundle     : false,
  platform   : "browser",
  target     : "es2022",
  /* Sources still carry TypeScript annotations under .js extensions until the
     phase-4 rename; the ts loader reads both, so this stays correct after. */
  loader     : {".js": "ts", ".wasm": "file", ".svg": "dataurl"},
  /* Struct names come from cls.name -- STRUCT.inherit(cls, parent) writes it
     into the STRUCT script, and nstructjs registers under it. Bundling puts
     every module in one scope, so esbuild renames colliding symbols and would
     silently rename the on-disk file format with them. */
  keepNames  : true,
  sourcemap  : opts.dev ? "linked" : false,
  minify     : opts.minify,
  logLevel   : "info",
  absWorkingDir: repoRoot,
};

async function buildGlobals() {
  mkdirp(globalsDir);

  /* One context per file: bundle:false with a single outfile is the only way
     to get type-stripping without an ESM/IIFE wrapper around the globals. */
  return Promise.all(
    GLOBAL_SCRIPTS.map((f) =>
      esbuild.context({
        ...shared,
        entryPoints: [f],
        outfile    : path.join(globalsDir, path.basename(f)),
        plugins    : [classRegistryPlugin],
      })
    )
  );
}

/*
 * Classic scripts (`"not_a_module"`), so bundle:false -- same treatment as the
 * globals, only the output lands at the target root under the name the Worker
 * constructor asks for.
 *
 * No classRegistryPlugin: these run in their own worker global, where nothing
 * has loaded typesystem.js, so `_ESClass` does not exist. Their classes were
 * never in `defined_classes` either -- the old build copied these two files
 * through untouched.
 */
async function buildWorkers() {
  return Promise.all(
    WORKERS.map((f) =>
      esbuild.context({
        ...shared,
        entryPoints: [f],
        outfile    : path.join(target.outDir, path.basename(f).replace(/\.ts$/, ".js")),
      })
    )
  );
}

async function buildApp() {
  return esbuild.context({
    ...shared,
    entryPoints: ["src/entry_point.ts"],
    outfile    : path.join(fcontent, "app.js"),
    bundle     : true,
    format     : "iife",
    external   : NODE_EXTERNALS,
    plugins    : [classRegistryPlugin],
  });
}

/* Full clean: the tree is entirely generated, and leftovers from the old
   Python build (app0.js .. app11.js) would otherwise linger forever. */
fs.rmSync(target.outDir, {recursive: true, force: true});

const contexts = [...(await buildGlobals()), ...(await buildWorkers()), await buildApp()];

copyAssets();

if (opts.watch) {
  await Promise.all(contexts.map((c) => c.watch()));
  console.log(`watching (${target.name})...`);
} else {
  await Promise.all(contexts.map((c) => c.rebuild()));
  await Promise.all(contexts.map((c) => c.dispose()));
  console.log(`built ${target.name} -> ${path.relative(repoRoot, target.outDir)}`);
}
