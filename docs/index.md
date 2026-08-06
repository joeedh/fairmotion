# Fairmotion documentation

Everything under `docs/`. Start here.

| Directory | Contents |
|---|---|
| `docs/` (root) | Living guides — how the app actually works today |
| `docs/plans/` | Implementation plans |
| `docs/research/` | Research reports, investigations, findings |
| `docs/archive/` | Pre-existing legacy notes; historical, do not edit |

## Guides

The subsystem walkthroughs. Each opens with a "short version" paragraph and a table mapping
topics to the code that implements them.

| Doc | What it covers |
|---|---|
| [animation.md](animation.md) | How a drawing moves over time: the drawspline/pathspline pair, per-vertex motion paths, keyframe time in a customdata layer, `Scene.change_time()`, keying, playback. Topology is never animated. |
| [rendering.md](rendering.md) | Control points → screen: repaint scheduling, `SplineDrawer`'s retained path list, batching and serialization to flat number streams, worker rasterization to `ImageBitmap`, and the canvas-2D overlay path for handles and selection. |
| [stroking.md](stroking.md) | The geometry layer below rendering: where width comes from, analytic offset-curve evaluation, stroke groups, the second (outline) stroke, and junction trimming/joins. |
| [dopesheet.md](dopesheet.md) | The timeline editor — DOM channel tree on the left, hand-drawn canvas key area with a bucketed pick grid on the right, plus which of its op files are live and which are dead. |
| [debugging.md](debugging.md) | Symptom → cause → diagnostic → fix log of things that actually broke during the TypeScript port. Read by symptom. Appended to, not rewritten. |

Reading order for a new subsystem: [rendering.md](rendering.md) then [stroking.md](stroking.md);
[animation.md](animation.md) then [dopesheet.md](dopesheet.md).

## Plans

| Doc | Status | What it covers |
|---|---|---|
| [plans/typescript-port.md](plans/typescript-port.md) | Phases 0–7 done; phase 8 done but for the manual app walkthrough and a deferred comment-length pass | The 88k-line JS → TS port and the replacement of the Python build system with esbuild. Its **Known gotchas** section is still worth reading — auto-accessors under vitest, barrel-vs-`dist` imports, module-scoped singletons, stale serialized state. |
| [plans/remove-webgl.md](plans/remove-webgl.md) | Not started | Deleting the dormant `src/webgl/` stack and the stub `src/paint/` module it serves (~6,600 lines), including the `image_canvas` file-format entanglement and the doc edits that follow. |

## Research

Point-in-time investigations. Not maintained as the code changes.

| Doc | What it covers |
|---|---|
| [research/report_stroking.md](research/report_stroking.md) | The investigation behind [stroking.md](stroking.md): stroking a half-edge *mesh* rather than a path, filled outlines instead of renderer stroke ops, junction trimming, and width as a cubic B-spline over a 9-vertex neighbourhood. File paths are pre-port `.js`. |
| [research/report_polynomial_clothoids.md](research/report_polynomial_clothoids.md) | The curve primitive itself: segments stored as a curvature polynomial `k(s)` integrated by stepped Taylor quadrature, and the constraint solver that drives `ks[]` for G2 continuity. File paths are pre-port `.js`. |
| [research/stripped-type-annotations.md](research/stripped-type-annotations.md) | The 266 C-style parameter annotations (`Array<float> vec`, `int i`) removed in phase 4 of the port, recorded so they can be reapplied as real TS types. Hints, not a specification — some are wrong. |

## Archive

Legacy notes kept for history. Do not edit.

| File | What it is |
|---|---|
| [archive/draw_refactor.txt](archive/draw_refactor.txt) | Original requirements sketch for the rendering system (layers, nice strokes, blur, masking, incremental update). |
| [archive/todo.txt](archive/todo.txt) | Old TODO list — edit-all-layers, gfx refactor, viewport abstraction. |
| [archive/mathstuff.reduce](archive/mathstuff.reduce) | REDUCE symbolic algebra: point-in-triangle test, sign-function integration. |
| [archive/sign_int_numeric_tests.html](archive/sign_int_numeric_tests.html) | Standalone numeric harness checking the sign-integration identities above. |
