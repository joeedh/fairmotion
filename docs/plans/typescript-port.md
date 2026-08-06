# Plan: port Fairmotion to TypeScript

## Scope

186 live source files, ~88k lines (`src/`, excluding the `src/path.ux` submodule). path.ux
itself is already TypeScript upstream and arrives via a submodule bump, not a port.

Alongside the port, the Python build system is deleted and replaced with esbuild producing two
targets: an html5 app and an electron app.

### What this plan is not

Not a rewrite. Behavior is held constant throughout and checked against a baseline captured
before anything changes. Refactors that are not required by the port are out of scope.

## Established facts

Measured against `js_sources.py`'s live file list, not the whole tree.

**The vectormath migration is already done.** `src/util/vectormath.js` is
`export * from '../path.ux/scripts/util/vectormath.js'` plus five `window.*` assignments.
`src/util/vector.js` and `src/util/base_vector.js` — the `#define VECTORNAME` / `#include` /
`#unroll` template machinery — are dead and unreferenced. nstructjs likewise already comes from
the `pathux.js` barrel.

**Non-standard extjs_cc syntax in live code:**

| Feature | Files | Sites |
|---|---|---|
| C-style typed params (`Number t`, `Array<float> vec`) | 10 | 52 |
| `static` locals in method bodies | 13 | 29 |
| `global x;` declarations | 5 | 5 |
| C preprocessor | 0 | 0 |
| Multiple inheritance | 0 | 0 |

The 22 `#ifdef`/`#define` hits in live code are all GLSL inside template literals
(`webgl.js` shader generation, `simplemesh.js` `insertDefine`). extjs_cc's preprocessor has
zero live uses.

**Confirmed dead** (in-tree, not built, safe to delete): `src/util/vector.js`,
`src/util/base_vector.js`, `src/core/utildefine.js`, `src/core/J3DIMath.js`,
`src/core/tarray_alloc.js`, `src/util/quadtree.js`, `src/util/octree.js`, `src/util/isect.js`,
and the `*_old.js` files excluded by `js_sources.py`.

**path.ux** is 205 commits behind on the submodule; upstream `scripts/` is TypeScript. Its
`package.json` is the toolchain template to copy (tsgo, `@pathtx/prettier` 3.3.0-dev,
esbuild 0.28, vitest 4, Playwright, electron 43, `packageManager: pnpm@10.30.3`).

## Risk

Phase 1 carries most of the risk in this project. A 205-commit jump lands upstream's own JS→TS
rewrite across every foundation Fairmotion sits on — vectormath, nstructjs, toolsys, the data
API, the screen/area system. The actual TypeScript port (phases 4–6) is mechanical by
comparison.

Two specific hazards to watch in phase 1:

- `src/util/vectormath.js` publishes `Vector2/3/4/Quat/Matrix4` onto `window`. Several live
  files `import` it for side effects only and then use those names bare. If the globals stop
  being set, those become `ReferenceError` at runtime — invisible to any typechecker.
- `src/core/struct.js:170` special-cases path.ux's vectormath during serialization. A large
  nstructjs jump is exactly what breaks that, and it surfaces as failure to load saved `.fmo`
  files rather than as a build error.

---

## Testing strategy

Adopt path.ux `origin/master`'s setup wholesale rather than inventing one.

### Unit — vitest

`tests/**/*.test.ts`, `environment: "happy-dom"` (widget tests need custom elements and shadow
DOM). Copy path.ux's `vitest.config.ts`, **including its `lowerAutoAccessors` esbuild
pre-transform plugin** — path.ux source uses TC39 `accessor` fields and Vite's oxc transform
does not lower them. Fairmotion imports that source directly, so it hits the same failure.

`src/unit_tests/tests.js` (jasmine, 350 lines) gets ported to vitest here.

### Integration — Playwright, both modes

The "Playwright vs. Electron + CDP" question is already answered upstream:
`buildtools/cdp.mjs` drives a running NW.js/Electron app through
`chromium.connectOverCDP(...)`. Playwright **is** the CDP client. Taking Playwright gets both
modes from one dependency, with one API.

| Mode | What it drives | Purpose |
|---|---|---|
| `playwright/*.spec.ts` | html5 target via `webServer: pnpm serv 5050` | The CI regression suite |
| `buildtools/cdp.mjs` (ported) | a running `pnpm electron`, over CDP port 9222 | Interactive debugging, electron-only bugs |

Copy path.ux's `playwright.config.ts` (testDir `./playwright`, `fullyParallel`, retries on CI,
`trace: 'on-first-retry'`, html reporter, `webServer`) and its `playwright/location.ts`
constants convention. Follow its `getByTestId(...)` + `screenshot({path: ...})` idiom;
screenshots are committed artifacts for human diffing, not assertion targets.

Chromium needs `--use-angle=swiftshader --enable-unsafe-swiftshader` headless, since the
viewport is WebGL.

path.ux also ships `.claude/agents/playwright-test-{generator,healer,planner}.md` — available
for writing and repairing specs.

### The debugging API

Clicking DOM elements is a weak oracle for a canvas app. Build a test/debug bridge on path.ux's
datapath controller, exposed as `window.__fm` in dev and test builds only:

- `getPath(path)` / `setPath(path, value)` — read and write through the `DataAPI`
- `execTool(toolPath, args)` — run a `ToolOp` by registered name
- `waitIdle()` — flush the dependency graph and pending redraws, so specs await state rather
  than sleeping
- `snapshot()` — structural state dump for semantic assertions

Playwright reaches it with `page.evaluate`; `cdp.mjs eval` reaches the same bridge in Electron.
One API, both modes.

**The highest-value oracle here is nearly free.** path.ux has `buildtools/datapath-walker.mjs`
(plus `gen-datapaths.mjs` and an eslint rule `valid-datapath.mjs`), which enumerates the entire
registered datapath tree. A test that walks every path and asserts each one resolves and reads
without throwing catches precisely the breakage a 205-commit path.ux bump causes — with no
screenshots, no flake, and coverage no click-driven spec will match. Build this first.

## Phase 0 — Baseline harness

Build the regression oracle **before** changing anything, running against the current
(pre-bump, plain-JS, Python-built) app.

1. `pnpm init` groundwork: `packageManager: pnpm@10.30.3`, devDeps mirroring path.ux's
   (`@typescript/native-preview`, `@pathtx/prettier`, `esbuild`, `vitest`, `happy-dom`,
   `@playwright/test`, `electron`). Copy path.ux's `.prettierrc` verbatim.
2. Install path.ux's own dependencies too, so its bare imports resolve.
3. Stand up vitest per above; port the jasmine tests.
4. Stand up Playwright per above. Smoke spec: launch, wait for the main screen, visit each
   editor (viewport, curve, dopesheet, console), load `horn.fmo` and `love and thunder.fmo`,
   screenshot each.
5. Land the `window.__fm` debugging API and the datapath-walker sweep test. This is the
   baseline's backbone — the screenshots are secondary.
6. Use a **content-based oracle**, not exact pixels: assert the canvas rendered non-blank
   content, that expected structure exists, and that every datapath resolves.
7. Clear localStorage in test setup; stale autosave blobs will crash startup after the bump.

**Exit:** baseline suite green against today's app; screenshots committed as reference
artifacts; datapath sweep passing and its path count recorded as a regression number.

## Phase 1 — path.ux submodule bump

Done alone, on plain JS, with the old Python build still running. Do not mix any other change
into this phase.

1. Bump the submodule to `origin/master`.
2. Fix import breakage. Upstream is `.ts` now; the old build resolves `.js` specifiers, so this
   phase likely needs the esbuild switch pulled forward — if so, do phase 3 first and return.
3. Work through runtime breakage against the phase-0 baseline, screen by screen.
4. Rewire `window.*` global publishing: add explicit imports at every site that relies on the
   bare names, and keep the `window` assignments until those are all found.
5. Verify `.fmo` load/save round-trips under the new nstructjs. Re-check the
   `src/core/struct.js` vectormath special case.
6. Audit for `.update.after` / `.setCSS.after` aspect calls; these still work in JS but mark
   every site that phase 5 must convert to `updateAfter` / `setCSSAfter`.

**Exit:** app runs, all baseline screens match, the datapath sweep passes at no fewer paths than
phase 0 recorded, and both `.fmo` files load and re-save.

## Phase 2 — Delete dead code

1. Delete the confirmed-dead files listed above.
2. Sweep for further orphans: any `src/**/*.js` not reachable from `src/entry_point.js`.
   Confirm each is genuinely unreferenced before deleting.
3. Re-run baseline.

**Exit:** baseline green; live file count re-measured.

## Phase 3 — Build system replacement

Delete `js_build.py`, `js_sources.py`, `make_tsrc.py`, `configure.py`, `js_build.bat`,
`js_cc.sh`, `tools/extjs_cc/`, and the old `tsconfig.json`. Nothing in the live tree needs the
transpiler after phase 4, and nothing needs its preprocessor now.

New `buildtools/esbuild.mjs`, modeled on path.ux's:

- **html5 target** — bundle `src/entry_point.js`, emit to `dist/html5app/`, copy static assets,
  sourcemaps in dev.
- **electron target** — same bundle plus main/preload processes, packaged into `dist/electron/`.
- **dev server** — esbuild serve. Note: esbuild's serve **cannot set custom response headers**.
  If the app needs COOP/COEP (it uses wasm and may want `SharedArrayBuffer`), run esbuild serve
  on an internal port behind a thin Node proxy that injects them.
- pnpm scripts: `build`, `build:electron`, `watch`, `serv`, `electron`, `cdp`, `typecheck`,
  `format`, `format:check`, `test`, `playwright`.

Port path.ux's `buildtools/electron.mjs` and `buildtools/cdp.mjs` alongside `esbuild.mjs`;
`cdp.mjs` is the interactive debugging tool referenced in the testing strategy, and the
electron target must launch with a CDP port open for it.

Import path.ux's TypeScript **source barrel** (`scripts/pathux.ts`), never a prebuilt `dist/`
bundle. Pulling in both yields two copies of every module — duplicate `customElements.define`
errors and split class identities.

**Exit:** both targets build, dev server runs, baseline green.

## Phase 4 — De-transpile and rename

Still plain JS for step 1, so breakage is attributable.

1. Fix the 86 non-standard sites by hand:
   - 29 `static` locals → hoist to module scope (a module-scoped `let` initialized once, or a
     closure). This is a **semantic** change, not a typing one — verify each.
   - 5 `global x;` declarations → real imports.
   - 52 C-style typed params → strip the type, but **record it**; each one is the annotation
     that pass 1 will write back in TS syntax. Do not machine-strip these; read them.
2. Run baseline. The source is now standard ES modules.
3. `git mv **/*.js **/*.ts` for the 186 live files. **Keep `.js` import specifiers** — esbuild
   and tsgo both resolve `./foo.js` → `./foo.ts`. Do not "fix" imports to `.ts`.
4. New `tsconfig.json`: `strict: true`, `strictNullChecks: true`, `moduleResolution: "bundler"`,
   `allowImportingTsExtensions: true`, `noEmit: true`, `skipLibCheck: true`,
   `lib: ["DOM", "ES2022", "WebWorker"]`, `types: []` (browser code — keep Node globals out).
5. Confirm the app still bundles and runs. Renaming is behavior-neutral; esbuild just strips
   types.

**Exit:** everything is `.ts`, app runs, baseline green, typechecker not yet consulted.

## Phase 5 — Pass 1: annotate blind

**Do not run the typechecker in this phase.** Errors are expected and ignored. The goal is
getting reasonable types down fast; fighting the checker now produces defensive `any`s.

Rules:

- **No `any`, no `unknown`, no `as` casts.** If a type is genuinely undeterminable, leave it
  **unannotated** and let inference handle it.
- Annotate function **parameters**, **class fields**, and **non-obvious returns**. Omit what
  TypeScript infers (locals, obvious returns).
- Declare class fields that the JS only ever assigned in the constructor.
- Convert every `.update.after(cb)` → `.updateAfter(cb)`, `.setCSS.after(cb)` →
  `.setCSSAfter(cb)`, `.setCSS.once(cb, a)` → `.setCSSOnce(cb, a)`. If an aspect call has no TS
  equivalent, add one to path.ux following the `//TS patch into this.update.after` pattern in
  `scripts/core/ui_base.ts` — do not cast through `any` at the call site.
- Feed the 52 recorded C-style annotations back in as real TS types.

**Foundation first.** These define the exported types everything else imports, so they must
settle before the rest starts:

1. `src/core/` — struct/serialization, `toolops_api`, the data API, `eventdag`
2. `src/graph/` — the dependency graph
3. `src/util/` — remaining helpers
4. `src/webgl/` + `src/wasm/` — rendering and native bindings
5. `src/curve/` — spline core (math-heavy; comment limit does not apply)

Then the consumers: `src/editors/`, `src/vectordraw/`, `src/windowmanager/`, `src/scene/`,
`src/brush/`, `src/paint/`, `src/datafiles/`, `src/addon_api/`.

Model the dynamic systems deliberately, once, in the foundation wave: the class/`STRUCT`
registry, `ToolOp` registration side effects, stringly-typed nstructjs schemas, data-API path
builders, and a `globals.d.ts` for the `window.*` surface.

Note for WebGL: if a context is really "WebGL2 plus custom fields", model it as an
**intersection** (`WebGL2RenderingContext & { ... }`), not a union — a union exposes only common
members and every WebGL2-only call errors.

**Exit:** all live files annotated. Typechecker still not run.

## Phase 6 — Pass 1.5: coherence review

Still no typechecker. Read the annotated files and check that shared types cohere and match
runtime usage. Strip redundant annotations. Fix obviously-wrong guesses. This catches divergent
shared-type definitions before the typechecker amplifies each one into a cascade of hundreds.

## Phase 7 — Pass 2: drive tsgo to zero

`npx tsgo --noEmit`, work the error list to 0.

- **Fix root causes first.** A handful of shared-type fixes kill hundreds of cascading errors
  — a registry's element type, an over-narrow `[number, number]` that should be `number[]`, a
  helper type that was never exported. Re-baseline the error count after each large fix.
- **`any` budget: 10 total across the codebase**, each individually justified. `unknown` only
  with real narrowing (`typeof`/`instanceof`/`in`/type guards). Use `Reflect.get`/`Reflect.set`
  for dynamic property access rather than `(x as any)[k]`.
- A single narrow `as Foo` at a genuine boundary (a `JSON.parse` result, an opaque library
  return) is fine. `as any` and `as unknown as` are not.
- For possibly-null: add a real guard or `?.`/`??`. Use `!` only when provably safe.
- **If a type is genuinely unknowable, ask** rather than guessing with `any`.
- Keep the bundle building throughout; do not let the build rot while chasing type errors.

**Exit:** 0 errors. Report the final `any` count and every `unknown`/cast site.

## Phase 8 — Format, verify, close out

1. Now that everything parses as TypeScript, run `@pathtx/prettier` over `src/**/*.ts` and
   commit the formatting pass separately from any semantic change.
2. Full verification:
   - tsgo: 0 errors
   - html5 build succeeds; electron build succeeds; dev server runs
   - **Run the actual app** and step through every screen, mode, and feature against the
     phase-0 baseline. A green typecheck is not evidence the app works.
   - vitest green; Playwright green
   - `.fmo` load/save round-trip
3. Grep for stray `CLAUDENOTE:` comments and remove every one.
4. Final pass on comment length: 4 lines max outside math-heavy files.

### Status

Done: (1) the formatting pass, plus a `.prettierignore` — the `src/**/*.ts` glob had been
reaching into the path.ux submodule and reformatting 29 files in a separate repo. (3) zero
`CLAUDENOTE:` hits.

Done in (2): tsgo 0 errors; both builds; dev server serves 200; vitest 6/6; Playwright 17/17;
`.fmo` round-trip — which was **broken** and is fixed (see `docs/debugging.md`, phase 8). The
three datapath baselines were re-recorded after confirming every delta traces to a phase 2/5
deletion or a rename that fixed an unaddressable path.

Outstanding:

- **The manual walkthrough in (2).** Playwright mounts and draws all eight editors, but no
  human has stepped through every mode and feature against the phase-0 baseline. That check
  is the one the rest of the phase cannot substitute for.
- **(4), the comment-length pass.** 147 prose comment blocks over 4 lines remain outside the
  math-heavy files (plus 182 blocks of commented-out code, which are a separate question).
  Many are file-header docblocks and port-era `NOTE:` explanations that are worth more than
  the rule costs; this wants a judgment call per comment, not a bulk truncation.

---

## Debugging guide

Create `docs/debugging.md` at the start of phase 0. Leave it empty until something is actually
run — it records observed behavior, not anticipated behavior.

**At the end of every phase, append what was learned debugging that phase**: the symptom, the
real cause, and how it was found. Phase 1 in particular will generate most of the entries, and
they are what makes phases 5–7 fast.

Structure it by symptom, since that is how it gets read:

```
## Symptom: <what you saw>
Cause: <what it actually was>
Found by: <the diagnostic that worked>
Fix: <what changed>
```

Seed categories, to be filled in as they occur: startup crashes, blank/black canvas, `.fmo`
deserialization failures, `ReferenceError` on former globals, duplicate
`customElements.define`, path.ux data-API path resolution failures, esbuild resolution
problems, electron-only failures.

## Known gotchas

- **TC39 auto-accessors break under vitest.** path.ux source uses `accessor foo`; Vite's oxc
  transform does not lower it and Node throws "Unexpected identifier". path.ux's
  `vitest.config.ts` works around this with an esbuild pre-transform plugin — copy it, don't
  rediscover it.
- **A green typecheck is not a working app.** Nothing in tsgo catches a removed library global,
  a changed upstream API, a shader that fails to compile, or a "behavior-preserving" refactor
  that wasn't. Run it and compare to baseline.
- **Import the source barrel, not `dist/`.** Both at once = two module copies = duplicate
  `customElements.define` and split class identity.
- **Implicit globals become `ReferenceError`, not type errors.** A symbol used but never
  imported may typecheck fine and die at runtime.
- **Stale serialized state.** localStorage autosave and on-disk `.fmo` from before the path.ux
  bump can be deserialization-incompatible. Clear on load; clear in test setup.
- **Module-scoped singletons are per-bundle.** nstructjs's struct manager lives in module scope
  — a second bundle gets its own copy and re-emits "already registered" warnings.
- **Double registration.** Watch for a class registered both by a static initializer and by an
  explicit `register()` call. One canonical path.
- **Prototype monkey-patches.** Don't globally augment a path.ux class's interface to add
  patched fields; if path.ux has its own subclass with the same field name it clashes. Type
  `this` locally in the patch function instead.
- **"Behavior-preserving" refactors aren't always.** Hoisting a static local, guarding an
  assignment with `?.`, or coercing a value can change runtime behavior. Trust the baseline run
  over the claim.
