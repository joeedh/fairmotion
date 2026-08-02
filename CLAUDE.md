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

Targets: an **html5 app** and an **electron app**.

The legacy Python build system (`js_build.py`, `js_sources.py`, `make_tsrc.py`, `configure.py`,
`tools/extjs_cc/`) is being removed. Do not add to it, and do not resurrect the `tsrc/` copy
scheme from the old `tsconfig.json` — sources are renamed in place so git history survives.

Format with the fork's binary, not bare `prettier`:

```
node node_modules/@pathtx/prettier/bin/prettier.cjs --log-level warn --cache --write "src/**/*.ts"
```

Only run the formatter over files that already parse as TypeScript.

## Documentation layout

All docs live under `docs/`. Nothing goes in a top-level `doc/`.

| Path | Contents |
|---|---|
| `docs/plans/` | Implementation plans |
| `docs/research/` | Research reports, investigations, findings |
| `docs/archive/` | Pre-existing legacy notes; historical, do not edit |
| `docs/` (root) | Living guides, e.g. `docs/debugging.md` |

## Source comments

- **4 lines maximum** per comment.
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

The old `extjs_cc` transpiler accepted non-standard syntax. In live sources this is down to
C-style typed parameters (`foo(Number t)`), `static` locals inside method bodies, and bare
`global x;` declarations. All are being removed. Never write new code using them.

`#ifdef`/`#define` appearing inside template literals in `src/webgl/` is **GLSL preprocessor
source**, not transpiler syntax. Leave it alone.
