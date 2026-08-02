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
