# Debugging log

Observed behavior only. Each entry is something that actually broke during the
TypeScript port, what it really was, and the diagnostic that found it. Appended
to at the end of every phase of `docs/plans/typescript-port.md`.

Format:

```
## Symptom: <what you saw>
Cause: <what it actually was>
Found by: <the diagnostic that worked>
Fix: <what changed>
```

---

# Phase 0 — baseline harness

## Symptom: `python js_build.py` dies immediately with `ModuleNotFoundError: No module named 'ply'`
Cause: `tools/extjs_cc/` is a PLY-based parser generator; the dependency was never
vendored or recorded anywhere, so a clean Python install cannot run the legacy build.
Found by: Running the build at all. Nothing in the repo documents this dependency.
Fix: `python -m pip install ply` (3.11). Nothing in-repo changed — the legacy build
is being deleted in phase 3, so this is a note for anyone who needs to rebuild the
pre-port baseline from an old checkout.

## Symptom: `js_cc.py: error: unrecognized arguments: -o`
Cause: `js_cc.py` takes positional `infile outfile`, not `-o`. Compiling a single
file by hand to test it needs the same flags the build passes.
Found by: Reading `jcc_handler` at `js_build.py:532` and `JFLAGS` at `js_build.py:498`.
Fix: The working invocation is
`python tools/extjs_cc/js_cc.py <in> <out> -dpr -npc -np`.

## Symptom: Build fails on a brand-new file with `syntax error ... async function ready(timeout = 30000)`
Cause: extjs_cc has no `async`/`await` support at all. Confirmed by grepping the
live sources: zero uses of either keyword anywhere in `src/`. The whole codebase is
Promise-chain style because the transpiler forced it to be.
Found by: The transpiler's own parse error, then a grep that showed the absence was
codebase-wide rather than local.
Fix: `src/core/debug_api.js` was rewritten with explicit `Promise` constructors and
recursive `poll`/`drain` helpers instead of `async`. This constraint dies with the
Python build in phase 3 — new `.ts` code may use `async` freely.

## Symptom: `expect(canvas.found).toBe(true)` — the smoke spec could not find any canvas
Cause: Two separate things. `#canvas2d` only exists in `src/html/main.html`, not in
the built `dist/html5app/index.html`; and the app's real canvases are created inside
path.ux shadow roots, where a top-level `document.querySelectorAll` cannot see them.
Found by: `page.content()` on the built page showed no `#canvas2d`, and a manual
`document.querySelectorAll("canvas")` in the browser returned an empty list while the
app was visibly drawing.
Fix: `deepQuery(tag)` in `debug_api.js` recurses through `node.shadowRoot`.
`canvasReport()` returns every canvas found that way with a `distinct` colour count,
and the spec asserts on content rather than on a hardcoded element id.

## Symptom: `__fm.switchEditor(): no editor named View2DHandler` — 8 editor specs failed
Cause: `areaclasses` is keyed by `define().areaname` (`view2d_editor`), not by class
name (`View2DHandler`).
Found by: `Object.keys(areaclasses)` in the page, which listed snake_case names.
Fix: `EDITORS` in `playwright/fixtures.ts` uses areanames, and `snapshot()` reports
`constructor.define().areaname` with the class name only as a fallback.

## Symptom: `expect(errors).toEqual([])` fails with `Had to add object to datalib during file conversion SceneObject`
Cause: Not a regression — today's unmodified app emits this on startup during file
conversion. A suite that demands zero console errors is red before the port begins
and therefore useless as a before/after comparator.
Found by: Running the assertion against the pre-port build.
Fix: `expectNoNewErrors(name, errors)` normalizes (first line, dedupe, sort) and
diffs against a recorded `playwright/baseline/errors-<name>.json`. New errors fail;
pre-existing ones do not. `FM_UPDATE_BASELINE=1` re-records after an intentional change.

## Symptom: `git show origin/master:.prettierrc` → `ambiguous argument 'origin\master;.prettierrc'`
Cause: MSYS path conversion mangles a `rev:path` spec on Windows — the colon becomes
a semicolon and the slash a backslash.
Found by: The error message quoting back a spec nobody typed.
Fix: Prefix the command with `MSYS_NO_PATHCONV=1` and quote the argument.

## Symptom: The file specs passed locally but the fixture was not in the repository
Cause: `horn.fmo` sits at the repo root as an untracked working-tree file. A suite
whose oracle is an uncommitted file is not reproducible on any other checkout.
Found by: `git status --short` listing it as `??` while the specs depended on it.
Fix: `SAMPLE_FILES` now names `examples/Panda.fmo` (tracked, and a richer model at
61 verts / 7 faces / 2 layers) alongside the already-tracked `love and thunder.fmo`.

## Baseline recorded

Against the unmodified pre-port app (legacy Python build), `npx playwright test`:
17 passed; `npx vitest run`: 2 files, 6 tests passed.

| Oracle | Value | File |
|---|---|---|
| Datapaths enumerated | 927 | `playwright/baseline/datapaths.json` |
| Datapath sweep (concrete paths) | 411 resolve, 125 fail | `playwright/baseline/datapath-sweep.json` |
| Registered toolpaths | 96 | `playwright/baseline/toolpaths.json` |
| `examples/Panda.fmo` | 61 verts / 120 handles / 60 segments / 7 faces / 2 layers | `playwright/baseline/file-examples-panda-fmo.json` |
| `love and thunder.fmo` | 44 / 84 / 42 / 1 / 1 | `playwright/baseline/file-love-and-thunder-fmo.json` |
| Reference screenshots | 11 | `playwright/screenshots/` |

The 125 sweep failures are expected: paths under an inactive object or an empty list
cannot resolve with no file open. What matters for later phases is that the
411/125 split does not move.

---

# Phase 2 — dead code

## Symptom: An import-reachability sweep from `startup.js` called 102 of 214 files orphans
Cause: Reachability is the wrong model for this codebase. The legacy build loads an
explicit list from `js_sources.py`, and many files are on it purely for side effects
(registering tool and editor classes) with nothing importing them. Half the "orphans"
were live.
Found by: Spot-checking the list — `src/editors/all.js` and the `*_ops.js` files are
obviously live, yet appeared as orphans.
Fix: Take `js_sources.py`'s list as the root set and compute import-reachability from
*that*. 172 live, 42 genuine orphans. Only the second number is actionable.

## Symptom: The cross-reference reported 171 of 172 listed files "missing from disk"
Cause: The intermediate list was written by Python on Windows in text mode, so
`"\n".join(...)` became CRLF. Splitting on `"\n"` in Node left a trailing `\r` on
every entry but the last, so no path ever compared equal.
Found by: The off-by-one — exactly one entry matched, and it was the last line.
Fix: `.map(s => s.trim())` on the split. Worth remembering for any Python→Node
handoff through a text file in this repo.

## Symptom: `grep -rl vector src/` implied `src/util/vector.js` had ~50 importers
Cause: Bare basename grep matches substrings — `vectormath`, `vectordraw`,
`base_vector` all contain `vector`. Same trap for `isect` (`aabb_isect_minmax2d`),
`spatialhash` (a local function in `mathlib.js`), `courier` (a CSS font name), and
`save_as` (a tool path string, not a module).
Found by: Grepping for the import specifier (`from '...(/|^)vector.js'`) instead of the
bare name. Every one of those files turned out to have zero real importers.
Fix: Never confirm deadness by basename. Match the specifier.

## Symptom: `src/windowmanager/` looked live — `AppState.js` and `editor_base.js` both name `FrameManager` and `ScreenArea`
Cause: They import path.ux's `scripts/screen/FrameManager.js` and
`scripts/screen/ScreenArea.js`. The local `src/windowmanager/` copies were superseded
long ago and are commented out (`##`) in `js_sources.py`.
Found by: Reading the actual import lines — every one resolved into `path.ux`. The
directory also contained a file literally named `this_folder_is_unused.txt`.
Fix: Deleted the whole directory.

## Files deleted (39)

The 11 the plan names — `util/vector.js`, `util/base_vector.js`, `core/utildefine.js`,
`core/J3DIMath.js`, `core/tarray_alloc.js`, `util/quadtree.js`, `util/octree.js`,
`util/isect.js`, and the three `*_old.js` — plus 28 orphans the sweep confirmed:
`core/auth_oauth.js`, `core/config_defines.js` (a stale duplicate of
`config/config_defines.js`), `core/context_interface.js`, `core/fileapi/fileapi_drive.js`,
`core/multispline.js`, `core/startup/module_test.js`, `datafiles/courier.js`,
`editors/viewport/toolops_unit_test.js`, `editors/viewport/tutorial_mode.js`,
`graph/graph_{class,datapath,spatial}.js`, `node_utils/`, `unit_tests/`,
`util/{jslzjb,pathutils,save_as,spatialhash,workerutils}.js`, `wasm/_built_wasm.js`,
`wasm/gen_dv_code.js`, `windowmanager/`, and `html/module_test.html`.

Kept despite showing as unreferenced:

- `vectordraw/vectordraw_canvas2d_worker.js`, `vectordraw/vectordraw_skia_worker.js` —
  `copy_targets` in `js_sources.py`, spawned by filename via `spawnThread(...)`. No
  import graph will ever find these.
- `src/entry_point.js` — empty today, becomes the esbuild entry in phase 3.

175 `.js` files remain under `src/` (excluding `path.ux`). Baseline re-run after the
deletions: playwright 17 passed, vitest 6 passed, every recorded baseline byte-identical.

# Phase 4 — de-transpile

## Symptom: `add_point(level, co)` silently got `undefined` for `co` when the `static` was moved into the function body

Cause: `spline_multires.js`'s `MultiResLayer.add_point` was written
`add_point(level, co=co)` where the inner `co` was a `static` local. That only ever
worked because the transpiler hoists `static` locals to *module* scope — a default
parameter expression cannot reference a variable declared later in its own body.
Found by: reading `process_static_vars` in `tools/extjs_cc/js_process_ast.py:2549`
after noticing the odd self-referential default.
Fix: hoisted to `const _add_point_co = [0, 0];` at module scope and changed the
signature to `add_point(level, co=_add_point_co)`. This is the proof that the
hoisting is load-bearing, not cosmetic — a naive in-body `const` would have broken it.

## Symptom: three `static x = ...` grep hits could not be de-transpiled — the surrounding code made no sense

Cause: they were inside `/* */` comment blocks
(`dopesheet_transdata.js:76,99` and `view2d.js:1342`).
Found by: opening each site rather than trusting the grep line.
Fix: left untouched. Any future sweep for transpiler syntax has to read context;
a line-oriented match over this codebase has a real comment false-positive rate.

## Symptom: `): Type` return annotations looked like more transpiler syntax to strip

Cause: they are not. `function f(a, b) : Vector2 {` is valid TypeScript. Only the
C-style *parameter* form `f(Vector2 a)` is invalid.
Found by: pasting both forms into a `.ts` file and reading the diagnostics — the
parameter form raises TS1005, the return form is accepted.
Fix: stripped parameters only (266 of them), left every return annotation in place.
The `int`/`float`/`double`/`byte`/`short` names in those returns still have to be
mapped to `number` before the typechecker is turned on in phase 5; see
`docs/research/stripped-type-annotations.md`.

## Symptom: `global x;` looked like it needed a real import, but the identifiers had no module that owned them

Cause: `global x;` emits **nothing**. `VarDeclNode` in the transpiler's codegen
(`js_process_ast.py:1322`) returns immediately when `"global" in node.modifiers`.
The statement exists only to silence `kill_bad_globals`' "Undeclared global" check.
Found by: reading the codegen instead of guessing from the name.
Fix: deleted all 7 declarations. Where the identifier was genuinely a `window.*`
global (`defined_classes`, `istruct`, `g_theme`, `uicolors`) the bare references
were qualified with `window.`; where it was already a module-scope `var` in the
same file (`_b64str`, `_sran_tab`) deleting the line was sufficient.

## Symptom: `python js_build.py` failed on `src/core/units.js` once, then succeeded unchanged on the next run

Cause: not diagnosed. `js_cc.py` on that file alone compiles clean, and two
subsequent full builds both finish. The legacy build compiles in parallel worker
processes and the failure carried no message.
Found by: re-running.
Fix: none — the build system is deleted in phase 3. Recorded so a one-off failure
here isn't mistaken for a real regression.

**Phase 4.1 exit check:** `python js_build.py` finishes, vitest 6/6, playwright
17/17, all baselines unchanged. The de-transpile is behavior-preserving.

# Phase 3 — esbuild

Almost every failure in this phase has the same root cause, so it is worth stating
once: **the legacy loader evaluated module bodies lazily, esbuild evaluates them
eagerly.** `_es6_module.add_module()` only *registered* a body; it ran the first
time something called `_es6_get_module()`, which in practice was long after the
document had parsed and after `startup()` had installed its globals. An esbuild
IIFE runs every module body the instant the `<script>` executes. Anything that
used to be true "by the time my module body runs" is no longer true.

## Symptom: `document.body` is null in `startup.js` at module scope

Cause: eager evaluation. The bundle's `<script>` tags are in `<head>`.
Found by: playwright `openApp()` timing out, then a raw `page.on("pageerror")` probe.
Fix: `writeHtml()` emits every tag with `defer`. `defer` preserves document order
and moves execution to after parsing, which is exactly the old timing.

## Symptom: `ReferenceError: myLocalStorage is not defined`

Cause: `config.js` and `const.js` read `myLocalStorage.use_canvas2d` at *module*
scope, and `startup()` used to install it before any module body ran.
Found by: the stack pointed into config.js's top level, not into a function.
Fix: new `src/core/startup/localstorage.js`, a pre-bundle classic script that
installs `window.myLocalStorage` (both the LS and ChromeApp backends moved out of
`startup.js` verbatim). It is the last entry in `GLOBAL_SCRIPTS`.

## Symptom: wasm 404 at `fcontent/http://localhost:5050//fcontent/built_wasm.wasm`

Cause: `built_wasm.js` passes `wasmBinaryPath` through emscripten's `locateFile()`,
which prepends `scriptDirectory`. `scriptDirectory` is derived from
`document.currentScript` — which the legacy build left null, because module bodies
ran from a callback rather than during script execution. It is non-null now, so the
absolute URL got a `fcontent/` prefix bolted onto its front.
Found by: reading the failing URL literally; the doubled prefix names the cause.
Fix: `src/wasm/load_wasm.js` sets `wasmBinaryPath = "built_wasm.wasm"`, relative.
`locateFile()` then resolves it correctly in both targets.

## Symptom: `_DataRefProperty:data: Unknown struct DataRef` from `init_struct_packer`

Cause: `window.defined_classes` was empty of app classes. Nothing in the *source*
ever fills that list — the transpiler's `create_class_list` pass emitted
`_ESClass.register(Foo)` after every class it saw (`js_process_ast.py:720`, gated on
`glob.g_register_classes`). `init_struct_packer()` and `init_toolop_structs()` both
walk that list, so with no registrations nstructjs knows no app structs at all.
Found by: `window.defined_classes` in a probe held only the two dozen classes from
the pre-bundle global scripts, then grepping the transpiler for who ever pushed to it.
Fix: `classRegistryPlugin` in `buildtools/esbuild.mjs`. It parses each file with the
TypeScript parser (already a devDependency), collects top-level class declarations,
and appends `_ESClass.register(Name);` to the end of the module. End-of-module is
safe — every top-level class is initialized by then and nothing reads the list
during evaluation.

## Symptom: `SplineLoopPath:loops: Unknown struct SplineLoop` — but SplineLoop *was* registered

Cause: esbuild renames colliding top-level symbols when it merges 400 modules into
one scope, and it lowers `class Foo` to `var Foo = class _Foo`. That makes
`Foo.name === "_Foo"`, and `STRUCT.inherit(cls, parent)` writes `cls.name` straight
into the STRUCT script. The struct was registered — under the name `_SplineLoop`.
Found by: `Object.keys(window.istruct.structs).filter(k => k.startsWith("SplineLoop"))`
returned `["SplineLoopPath"]` while `defined_classes` contained no `SplineLoop`
either. Both symptoms are the same renamed `.name`.
Fix: `keepNames: true`. This is not cosmetic — `cls.name` is part of the on-disk
file format here, so a bundler rename would silently change what files are written.

## Symptom: `screen.area.split` and seven other tools vanished from the registered tool list

Cause: those are path.ux ToolOps whose own `registerTool()` calls are commented out
upstream (`FrameManager_ops.js:309,540,1101`). They only ever got registered because
`js_sources.py:21` globbed **every** `.js` under `src/path.ux/scripts` into the
transpiler, so they landed in `defined_classes` too and fairmotion's
`register_toolops()` picked them up.
Found by: the datapath baseline diff — it named the exact eight missing toolpaths.
Fix: `classRegistryPlugin` covers path.ux as well; only `node_modules` and the
vendored tinymce are skipped.

## Symptom: `Cannot read properties of undefined (reading 'calledRun')` when loading a .fmo

Cause: `native_api.js` did `import * as wasm_mod; let wasm = wasm_mod.Module;`, but
`built_wasm.js`'s only export is `export default Module = {}`. esbuild says so
outright — `Import "Module" will always be undefined` — the old loader was laxer.
Found by: reading the build warnings that were already scrolling past.
Fix: `wasm_mod.default`. It is the same live object emscripten mutates in place.

## Symptom: `export * from './fileapi_chrome.js'` inside an if/else

Cause: the transpiler allowed it; real ESM does not — `export` is only legal at
module top level.
Found by: esbuild parse error.
Fix: `fileapi.js` imports all three backends unconditionally (the old build
concatenated all three into the bundle anyway) and dispatches per call through a
`forward(name)` helper. Same behavior, legal syntax.

## Symptom: `ReferenceError: ES6Module is not defined` in the addon loader

Cause: `addon_api.js` borrowed `ES6Module` from `src/core/startup/module.js`, part of
the legacy loader being deleted.
Found by: the stack.
Fix: a local `AddonModule` class in `addon_api.js`. The loader only ever used it as a
plain record — `name/path/callback/exports/deps/loaded/addon`.

## Symptom: `ReferenceError: node is not defined` in `new EventSocket`

Cause: a plain typo in `eventdag.js:504` — `this.node = node` in a constructor whose
parameter is named `owner`. Present since d17adf7, and it would have thrown under the
old build too; `kill_bad_globals` only ever checked *assignments* to undeclared
globals, never reads.
Found by: the port surfaced it because the dag path now runs to completion.
Fix: `this.node = owner`.

## Symptom: deleting the old `tsconfig.json` broke startup, with no error in the build

Cause: esbuild reads `tsconfig.json` too. The old one said `target: es6`, which made
esbuild pick `useDefineForClassFields: false`. With the file gone and `target: es2022`,
it defaults to **true** — and then every bare `foo: Type;` field declaration (this
codebase is full of them, purely as annotation) becomes a real `[[Define]]` that
overwrites whatever the constructor or `super()` already stored.
Found by: the app stopped starting immediately after `git rm tsconfig.json`, with a
clean build log.
Fix: the new `tsconfig.json` sets `useDefineForClassFields: false` explicitly. Treat
that file as build configuration, not just typechecker configuration.

## Symptom: `Cannot set property canvas of #<WebGLRenderingContext> which has only a getter`

Cause: `"strict": true` in the new tsconfig implies `alwaysStrict`, and esbuild then
emits `"use strict"` for the bundle. The transpiler produced sloppy-mode output, and
the app relies on it — it monkey-patches read-only WebGL constants
(`gl.COLOR_ATTACHMENT0`, `gl.HALF_FLOAT`, `gl.MIN`/`MAX`) onto live contexts, where
sloppy mode silently drops the write.
Found by: three different "which has only a getter" TypeErrors appearing one after
another as each was fixed — a sign the class of problem was wider than the sites.
Fix: `"alwaysStrict": false`, so runtime semantics match the old build. Strict *type*
checking stays on for phase 5. Two of the sites were genuinely dead and were removed
anyway: `gl.canvas = canvas` (readonly accessor that already returns it) and
`AppState.js`'s manual re-binding of path.ux's `platform` export, which ESM's live
bindings now do by themselves.

## Symptom: `EEXIST: symlink` then `ERR_FS_CP_NON_DIR_TO_DIR` copying `canvaskit-wasm`

Cause: pnpm's `node_modules/canvaskit-wasm` is a symlink into `.pnpm/`, and
`fs.cpSync` runs its src/dest kind check *before* it dereferences.
Found by: the second error naming "non dir to dir" for what looked like two dirs.
Fix: `copyDir()` does `rmSync(dst)` then `cpSync(fs.realpathSync(src), dst,
{recursive: true, dereference: true, force: true})`.

## Symptom: stale `app0.js` … `app11.js` served alongside the new bundle

Cause: leftovers from the old build's split output, still in `dist/html5app`.
Found by: listing the output directory.
Fix: `esbuild.mjs` `rmSync`s the whole target directory before building. The tree is
entirely generated; nothing in it is worth preserving.

## Known, not fixed: `preload script must have absolute path`

`platforms/Electron/main.js:123` passes `preload: "preload.js"`. Electron requires an
absolute path. This is unchanged from before the port and the app runs regardless;
recorded so it is not mistaken for build fallout.

**Phase 3 exit check:** `pnpm build` and `pnpm build:electron` both succeed, `pnpm serv`
serves a working app, `pnpm electron` launches and answers over CDP, vitest 6/6,
playwright 17/17 with every recorded baseline unchanged.

# Phase 4 — de-transpile and rename to .ts

182 files renamed with `git mv`: every `.js` under `src/` except the `src/path.ux`
submodule (174), plus the 8 `platforms/` modules the bundle actually imports.
Import specifiers were left as `.js` throughout — esbuild rewrites `./foo.js` to
`./foo.ts` when resolving from a TypeScript file, and so does `moduleResolution:
"bundler"`, so both the bundler and the typechecker follow them unchanged.

Everything else keeping its `.js` extension is deliberate, and each for the same
reason — it is named by *path* rather than by import specifier, so a rename would
have to be matched by an edit somewhere else:

- `platforms/Electron/{config,main,preload}.js` and `platforms/html5/{config,nodeserver}.js`
  are copied verbatim into `dist/` and loaded by Electron/Node directly.
- `tools/utils/**` vendored libraries (sha1, lz-string, esprima) appear in
  `GLOBAL_SCRIPTS` as literal paths.
- `platforms/PhoneGap/appfiles/**` is a checked-in Cordova app, not our source.
- `addons/` is copied to the output tree and loaded at runtime by filename.

## Symptom: `_ESClass is not defined`, only while loading a .fmo

Cause: the two `src/vectordraw/*_worker.ts` files used to be `copyFile`d into the
output verbatim. Once renamed they had to be transpiled instead, and the build
handed them the same options as everything else — including `classRegistryPlugin`,
which appends `_ESClass.register(Foo)` for every top-level class. Those files run
in a worker global that has never loaded `typesystem.ts`, so `_ESClass` is not
there.
Found by: the `files.spec.ts` error baseline; only the two .fmo-loading specs
failed, which pointed at the vectordraw job workers rather than the page.
Fix: `buildWorkers()` builds them without the plugin. Their classes were never in
`defined_classes` under the old build either — it copied both files through
untouched.

## Note: workers are built now, not copied

`new Worker("vectordraw_canvas2d_worker.js")` in `vectordraw_jobs.ts` names the
output file, so `buildWorkers()` writes `path.basename(f).replace(/\.ts$/, ".js")`
into the target root. `bundle: false` keeps them classic scripts; their
`"not_a_module"` / `"use strict"` prologue survives as a directive prologue.

**Phase 4 exit check:** no `.js` remains under `src/` outside the submodule;
`pnpm build` and `pnpm build:electron` both succeed with the same 35 pre-existing
warnings; the electron app answers over CDP with `tools=96 editors=10 errors=[]`;
vitest 6/6; playwright 17/17 with every recorded baseline unchanged. The
typechecker has deliberately not been consulted — `npx tsgo --noEmit` is phase 5.
