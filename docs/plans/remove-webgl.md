# Plan: Remove the WebGL code

**Goal:** delete the dormant WebGL stack and the raster-paint module it exists to serve,
plus the docs that describe them. Nothing user-visible changes — the vector renderer
(canvas2d / SVG / Skia) never touches WebGL. This is a clean amputation, not a migration;
a GPU backend gets re-implemented from scratch if and when it's needed.

## Why this is safe

- `src/vectordraw/` and `src/editors/` contain **zero** imports of `src/webgl/`.
- The sole consumer of `src/webgl/` is `src/paint/imagecanvas_webgl.ts`.
- `src/paint/` is stub-ware: `imagecanvas_draw.ts` is 65 lines of empty method bodies,
  `paint_base.ts` and `paint_op_base.ts` are **0 bytes**. No editor, tool, or menu ever
  constructs an `ImageCanvas`.
- `View2DHandler.drawWebgl()` (`src/editors/viewport/view2d.ts:596`) only sets scissor/viewport
  and clears to a debug blue. It draws nothing.

~6,600 lines go away.

## Entanglement inventory

| Site | What it is | Action |
|---|---|---|
| `src/webgl/*.ts` (5 files, 5,273 lines) | GL wrapper, `SimpleMesh`, `FBO`, `RectShader` | delete dir |
| `src/paint/*.ts` (6 files, 1,365 lines) | `ImageCanvas` raster tiles + GL backend | delete dir |
| `src/entry_point.ts:86-90, 179-184` | side-effect imports | delete lines |
| `src/core/startup/startup.ts:4, 92-96` | `initWebGL()`, `window.redraw_webgl()` | delete |
| `src/core/lib_api.ts:10, 288` | `image_canvas` DataList on `Library` | see **File format** |
| `src/globals.d.ts:477, 522-524, 609, 613, 690-698` | `_gl`, `_Shaders`, `redraw_webgl`, `reshape`, `debugproxy` | delete declarations |
| `src/editors/viewport/view2d.ts:596-620, 1071` | `drawWebgl()` + `hasWebgl: true` | delete both |
| `src/editors/events.ts:214, 230` | `on_gl_lost()`, `on_draw(gl)` no-op hooks | delete |
| `src/core/startup/redraw_globals.ts:213` | `window.reshape(gl)` | delete |
| `src/core/raster.ts:65-92` | `Raster` class holding a `gl` it never uses | see **Deferred** |
| `src/core/icon.ts:20-49, 122-126` | `WebGLTexture` field, commented-out GL, unused `icon_vshader`/`icon_fshader` | strip GL remnants |
| `src/scene/sceneobject.ts:71`, `sceneobject_data.ts:30` | comments saying "webgl-style uniforms" | reword |

## Ordering

Work bottom-up so the tree typechecks at each step.

**1. Cut the entry points.** Remove the `src/webgl/` and `src/paint/` imports from
`entry_point.ts` and the `imagecanvas_webgl` wiring in `startup.ts`. Nothing else runs GL,
so after this the app boots with no GL context at all — a good early smoke test.

**2. Cut the viewport/editor hooks.** `view2d.ts` `drawWebgl()` + `hasWebgl`, `events.ts`
`on_gl_lost`/`on_draw`, `redraw_globals.ts` `reshape`. These are the only places an
`Area` subclass could be asked for a GL draw; removing `hasWebgl` first means the
`imagecanvas_webgl.ts` dispatcher has nothing left to find.

**3. Decide the `Library.image_canvas` question** (below), then apply it to `lib_api.ts`.

**4. Delete `src/paint/` and `src/webgl/`** wholesale.

**5. Clean `globals.d.ts`.** Every `import("./webgl/...")` and `import("./paint/...")` type
reference must go or the file won't resolve.

**6. Cosmetic remnants.** `icon.ts` GL fields and dead shader strings, the two
"webgl-style uniforms" comments, `raster.ts`.

**7. `npx tsgo --noEmit`** → expect zero new errors. Then build both targets and run vitest +
Playwright.

## File format

`Library` declares `image_canvas: DataList<ImageCanvas>`, and `ImageCanvas` is an
nstructjs-registered `DataBlock` (`imagecanvas.ts:602-657`), as are `ImageDataType`,
`SimpleImageData`, and `TiledImage`. Removing them changes what nstructjs can deserialize.

In practice no `.fmo` in existence contains one — nothing ever created an `ImageCanvas`.
**Recommendation: remove the DataList and the registrations outright.** If a stray file does
trip nstructjs on load, that is a loud, diagnosable error on a block nobody has data in.

The conservative alternative — keep an empty `image_canvas` list and a bare stub `ImageCanvas`
`DataBlock` purely as a format placeholder — is not worth carrying dead code for. Skip it
unless loading a real file actually breaks.

## Deferred (call separately)

- **`src/core/raster.ts`** — a `Raster` class whose only WebGL tie is holding a `gl` handle it
  never uses. Strip the `gl` field and the `on_gl_lost` method; whether the class itself
  survives is a separate question about the raster path, not about WebGL.
- **Electron `--use-angle=swiftshader` flags** (if the Playwright/CI config still passes them
  per `docs/plans/typescript-port.md:97`) can drop once nothing requests a GL context.

## Documentation

| File | Edit |
|---|---|
| `docs/rendering.md:65, 385-386` | delete the `drawWebgl()` note and the "`src/webgl/` is used by the raster paint system only" bullet |
| `docs/debugging.md:342-348, 583-604, 645-650` | delete four WebGL symptom entries — they describe code that no longer exists |
| `CLAUDE.md:75` | delete the GLSL-preprocessor-in-`src/webgl/` carve-out |
| `docs/plans/typescript-port.md:37, 97-98, 245, 255-257, 331` | **do not edit** — historical record of a completed port |
| `docs/research/stripped-type-annotations.md` | **do not edit** — research snapshot |
| `Readme.md:63-70` | leave; refers to the upstream *webgl-app-framework* project, not this code |

Note in `docs/rendering.md` that GPU rendering is deliberately absent and would be
reintroduced fresh — otherwise the next reader assumes it was an oversight.

## Verification

1. `npx tsgo --noEmit` — zero errors.
2. esbuild html5 + electron builds succeed.
3. `vitest` green.
4. Playwright: app boots, viewport draws, a spline can be created and edited.
5. `grep -rin "webgl\|simplemesh\|imagecanvas\|ShaderProgram" src --exclude-dir=path.ux` returns
   only intentional survivors (ideally nothing).
6. Load and re-save an existing `.fmo` (`horn.fmo` is in the tree) to confirm the format path.

## Commit shape

One commit per numbered step keeps bisect useful, or squash to two: `remove webgl and paint
modules` + `docs: drop webgl references`.
