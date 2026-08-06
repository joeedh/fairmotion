# Fairmotion

2D vector animation app. `src/` is the application; `src/path.ux` is a git submodule
(joeedh/path.ux) providing the UI toolkit, data API, tool system, `nstructjs` serialization,
and vectormath (`Vector2/3/4`, `Matrix4`, `Quat`).

## Toolchain

| Job | Tool |
|---|---|
| Package management | **pnpm** (never `npm` or `yarn`) |
| Typecheck | **tsgo** — `npx tsgo --noEmit` (`@typescript/native-preview`) |
| Format / lint | **`@pathtx/prettier`** — joeedh's prettier fork |
| Build | **esbuild** |
| Unit tests | vitest |
| E2E | Playwright |

Targets: an **html5 app** and an **electron app**. Both are built by `buildtools/esbuild.mjs`
(`pnpm build`, `pnpm build:electron`, `pnpm watch`); `buildtools/serv.mjs` serves the html5 app
and `buildtools/electron.mjs` launches the electron one.

`src/` is TypeScript — every live source is `.ts`, typechecked from the root `tsconfig.json`
with `strict` and `useDefineForClassFields` on. The latter is load-bearing at runtime, not just
for the typechecker: esbuild reads it too, and the codebase depends on define semantics for
bare field declarations. Do not turn it off.

Format with the fork's binary, not bare `prettier`:

```
node node_modules/@pathtx/prettier/bin/prettier.cjs --log-level warn --cache --write "src/**/*.ts"
```

Only run the formatter over files that already parse as TypeScript.

## Documentation layout

All docs live under `docs/`. Nothing goes in a top-level `doc/`.

| Path | Contents |
|---|---|
| `docs/index.md` | Index of everything below — **add new docs here** |
| `docs/plans/` | Implementation plans |
| `docs/research/` | Research reports, investigations, findings |
| `docs/archive/` | Pre-existing legacy notes; historical, do not edit |
| `docs/` (root) | Living guides (see below) |

Subsystem guides — read the relevant one before changing that subsystem:

| Doc | Covers |
|---|---|
| `docs/rendering.md` | Repaint scheduling, `SplineDrawer`, batching, worker rasterization, overlays |
| `docs/stroking.md` | Offset-curve geometry, width/shift, stroke groups, junctions |
| `docs/animation.md` | Drawspline/pathspline, per-vertex motion paths, keyframes, playback |
| `docs/dopesheet.md` | Timeline editor: DOM channel tree + canvas key area |
| `docs/debugging.md` | Symptom → cause → fix log; **append to it** when something non-obvious breaks |

Active plans: `docs/plans/typescript-port.md` (phase 8 outstanding; its *Known gotchas*
section still applies), `docs/plans/remove-webgl.md` (not started).

## Source comments

- **4 lines maximum** per comment.
- **Exception — file headers:** no limit. The leading comment block at the top of a file,
  before the first import or statement, is where a module explains what it is and how it fits
  together. That is worth the space; the 4-line limit is aimed at inline noise.
- **Exception — math-heavy files:** no limit. Derivations, coordinate conventions, and
  references are worth the space.
- **Exception everywhere — embedded symbolic algebra** (REDUCE scripts and similar): no limit,
  in any file. These are source material; keep them verbatim.
- **Temporary comments** are exempt from the limit but must be prefixed `CLAUDENOTE:` and
  deleted before the work is considered done. Never leave a `CLAUDENOTE:` in a finished branch.

## path.ux callback system

path.ux has a method-aspect system — `widget.update.after(cb)`, `widget.setCSS.after(cb)` —
which attaches properties to a method object. TypeScript cannot express this, so path.ux
provides plain-method equivalents. **Always use the TS form:**

| Aspect form (do not use in TS) | Use instead |
|---|---|
| `widget.update.after(cb)` | `widget.updateAfter(cb)` |
| `widget.setCSS.after(cb)` | `widget.setCSSAfter(cb)` |
| `widget.setCSS.once(cb, arg)` | `widget.setCSSOnce(cb, arg)` |

If you hit an aspect call with no TS equivalent, add one to path.ux following the same pattern
(see `scripts/core/ui_base.ts`, marked `//TS patch into this.update.after`) rather than casting
through `any` at the call site.

## Legacy transpiler

The old `extjs_cc` transpiler and its non-standard syntax — C-style typed parameters
(`foo(Number t)`), `static` locals inside method bodies, bare `global x;` declarations — are
gone from the tree. Never reintroduce them. Old docs and research reports still show pre-port
`.js` paths and stripped C-style annotations; treat those as history, not as the current code.

`#ifdef`/`#define` appearing inside template literals in `src/webgl/` is **GLSL preprocessor
source**, not transpiler syntax. Leave it alone.
