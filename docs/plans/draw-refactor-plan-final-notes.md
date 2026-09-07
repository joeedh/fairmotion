# Draw pipeline refactor — final notes

The refactor is finished and its plan is gone. This is what survives it: the invariants the
new code depends on, the reasoning behind the parts that look wrong and are not, and what the
test apparatus does and does not cover.

Read [rendering.md](../rendering.md) and [stroking.md](../stroking.md) first — they describe
the pipeline as it now is. This document explains *why* it is shaped that way, and is the
target of the `see docs/plans/draw-refactor-plan-final-notes.md …` references in the source.
Section numbers below (§3, §5.n, §7.n) and the P- and stage- labels are the plan's, kept so
those references still resolve.

Two items outlived the refactor and were tracked in [`todos.md`](../../todos.md) rather than
here: the per-segment `ks` arena (§5.3) and the tail of P8, `update()`'s nine-argument
signature. Both have since landed, and the sections below describe what shipped rather than
what was proposed. The arena did not collapse `scene_ks()`'s two layouts, which the plan had
expected it to — that part is still open.

## The goal, and whether it was met

1. Fewer, clearer layers between a `Spline` and a rasterized batch.
2. A stroker liftable into a standalone C++/wasm library — a pure function over flat buffers,
   with no `Spline`, no `VectorDraw` and no DOM in it.

Both met. The stroker is `src/wasm/stroker.h` plus its neighbours, it runs in the app behind
`config.USE_WASM`, and it reproduces the JS stroker exactly. `SplineDrawer` went from 2,351
lines to 1,304 with all stroke geometry behind a pure boundary. Those 1,304 were later split
across `src/curve/draw/`, leaving the drawer itself at about 500 lines: `draw_strokes.ts` has
the per-segment and per-vertex assembly, `draw_faces.ts` the fills, `draw_params.ts` the two
argument bundles, and `outline_play.ts` the replay of an `OutlineBuffer` onto a path.

## §3 — the four-stage shape

```
Spline (topology, ks, materials, layers)
   │
   ▼  EXTRACT  — JS, reads the Spline, patches only what is dirty
StrokeScene   — flat typed arrays, persistent across frames, stable indices
   │
   ▼  STROKE   — pure. JS reference implementation, C++/wasm in the app
OutlineBuffer — flat command stream (MOVE / LINE / CUBIC)
   │
   ▼  ASSEMBLE — JS. path ids, z, colour, clip, GC, dirty tracking
CanvasPath list
   │
   ▼  RASTER   — unchanged: batches → workers → ImageBitmap → blit
```

The rasterizer (`vectordraw_canvas2d.ts`, `vectordraw_jobs.ts`,
`vectordraw_canvas2d_worker.ts`) already had a plain-data interface and was never the problem.
It was deliberately left alone apart from the three bugs in §7.

## Where each problem went

| | Problem | Outcome |
|---|---|---|
| P1 | No data boundary between spline and rasterizer | `StrokeScene` / `OutlineBuffer` (stage 4) |
| P2 | Stroker pulls the whole graph, lazily, per sample | Width *walk* cached (stage 2); flat scene (stage 4) |
| P3 | Width belongs to a chain, but no such object exists | `src/curve/draw/width_chain.ts` |
| P4 | Derived render state serialized into the document | `src/curve/draw/trim_state.ts`; `SplineDrawData` reads but never writes |
| P5 | Path ids are tag bits over `spline.idgen` | `src/curve/draw/path_key.ts` — `pathKey(owner, role) = owner * 16 + role` |
| P6 | Editing overlay inside the render path | `src/curve/draw/spline_overlay.ts` (stage 1) |
| P7 | Dead backends keep `PathBase` abstract for nobody | ~2,220 lines deleted (stage 0) |
| P8 | `update()` is 332 lines of 12 positional parameters | Cleared: stage 4f took the body, and the signature became one `DrawPass` |

Two of these are worth more than a table row.

**P5 was a live bug, not tidiness.** The tag bits started at `1<<17`, and
`SplineStrokeGroup.id` came from the *same* generator as element eids. Group ids are reused
only when the group's eid-set hash matches, so every new chain shape ever seen burns an id —
the counter tracks edit history, not element count. Path ids would have started colliding well
before a document reached 131,072 elements.

**P4's migration is one-way and finished.** `CustomData.remove_layer()` plus
`Spline.afterSTRUCT()` drops the layer once it has been read, so `SplineDrawData` survives only
as a registered `STRUCT` that old files parse into and nothing reads. Re-saving `Panda.fmo`
went from 88,985 to 83,613 bytes.

## Invariants

These are the things a later change is most likely to break, in rough order of how quietly
they break.

- **Evaluation order is part of the answer.** `eval_curve()` rewrites `ks[KSCALE]` — the
  segment's arc length — and its neighbours' width nets read that value. So the *order* of
  evaluation is load-bearing, including calls whose return value goes nowhere:
  `trimVertex()`'s `seg.evaluate(s1a)` exists to refresh a length the next segment's width is
  read against. Both the JS and the C++ walk live slots ascending, samples in order, fields in
  call order, and make the same redundant calls. Deleting a call that "does nothing" changes
  output.
- **Arc length and the width net's knots are never cached.** Stage 2's first prototype cached
  the knots and was not bit-exact: mid-drag on `Panda.fmo` it was off by ~20 % on individual
  knots and ~1.4 % on width, on 3,088 of 46,156 samples, because `TransSplineVert.apply()`
  moves vertices and `SplineSegment.update()` does not re-solve them. What is cached is the
  *topology* — which seven segments the walk lands on and which end of each — because that is
  what is genuinely constant for a pass. `loadWidthNet()` reads the values and lengths live and
  assembles the knot vector at call time, in `width()`'s own expression order.
- **Heap growth detaches every view; addresses survive.** Growing a `WebAssembly.Memory` swaps
  in a fresh `ArrayBuffer` and silently zero-lengths every view onto the old one. `native_api`
  registers holders through `onHeapMove()` and rebuilds from the pointer. In
  `src/wasm/heap_arrays.ts` a heap array carries both `ptr` and `cap`, because a detached view
  reports `length` 0 and `cap` is then the only record of how long it is meant to be.
- **A heap view's buffer must never reach `postMessage`'s transfer list.** For a heap view that
  buffer is the entire `WebAssembly.Memory`; transferring it would detach `seg.ks` and every
  other view in one call. Stroker output is copied *out* of the heap on its way to a path,
  deliberately.
- **A per-path buffer can never be the thing sent.** `Batch.gen()` concatenates every path's
  commands into one array, decided at batch time from z order, per-path matrices and clip
  state. Some copy at that boundary is structural; there is no zero-copy path to the worker.
- **`std::stable_sort`, not `std::sort`.** The JS is `Array#sort`, which V8 implements with
  TimSort. Two segments leaving a vertex at the same angle — a coincident pair — decide which
  is `prev` in the mitre solve, so the order is not cosmetic.
- **Heap allocations are zeroed.** `_malloc` does not and `new Float64Array(n)` does; every
  caller was written against the latter. See `docs/debugging.md`, "two loads of one document
  disagree by a subnormal".
- **`ks` blocks are not in slot order.** `checkSegment()` relocates each segment's coefficients
  the first time that segment is evaluated, so storage order follows edit order rather than
  scene slot. `scene_ks()` therefore dispatches: a dump packs every slot's block into one array
  and indexes it, while the app reads the address recorded in `SEGI_KSPTR`. The blocks are now
  arena cells rather than separate mallocs (§5.3), which makes a chain usually walk consecutive
  cells, but it does not make slot order match storage order — the two layouts remain.

## §5 — constraints the port respects

1. **`checkSegment()` coverage is conditional.** A segment that has never been natively
   evaluated or solved still holds a plain JS array, so extract migrates explicitly rather than
   assuming — `stroke_scene.patchSeg()`. Not theoretical: the first run of
   `stroker-eval.spec.ts` failed on it, with the scene holding a pre-migration `ks` and `KSPTR`
   of 0. It rendered *nearly* right, because the spiral is normalised through `v1` and `v2` —
   endpoints off by 2e-6 and the middle of the curve by 2.7 units.
2. **Heap growth detaches every view.** Handled in `native_api.checkHeap()`, eagerly rather
   than lazily because `seg.ks[KSCALE]` is read all over the drawer without anything calling in
   first. Guarded by `playwright/wasm-heap.spec.ts`, which allocates 64 MB past the 32 MB
   initial heap; with the re-view line commented out it reports 60 of 60 detached.
3. **Scattered per-segment allocation.** Each segment used to get its own `_malloc(8 * 16)`,
   which the allocator was free to scatter. **Done** — `src/wasm/ks_arena.ts` hands out cells
   instead: a cell is one segment's sixteen doubles and a chunk is 256 cells taken in a single
   `_malloc`, so segments created in sequence land in consecutive cells. The arena is global
   rather than per-`StrokeScene`, which the plan had assumed, because a cell's lifetime is the
   segment's and outlives any one scene. Chunks are never moved or released — a cell's address
   is its identity, held by both `seg.ks` and `SEGI_KSPTR` — and freed cells go on a free list,
   so a reused cell is cleared rather than inherited. What this does *not* do is collapse
   `scene_ks()`'s two layouts; see the §3 bullet above.
4. **Curve effects.** Carrying `ks` rather than a sampled centre line settles this by
   construction: `ks` cannot express a curve effect, so the wasm path is a no-effects path. If
   multires is ever revived it needs its own answer.
5. **Cacherings.** `evaluateSide` returns from a 512-deep cachering and several call sites
   depend on "copy before the next call". Flat arrays make the hazard vanish on the scene side.
6. **Float determinism.** A host-compiled harness can only match the recording to a tolerance,
   because it is comparing two libms. Through emscripten there is only one, and the match is
   exact — see the 6e entry below. For the shipped path the exact digest is the right gate.
7. **Port the quirks as-is.** Notably: `wasm_main.cc:evalCurve()` downcasts the endpoints to
   `float` and zeroes z; `native_api.evalCurvePtr()` passes six arguments to a seven-argument
   function, so JS's `angle_only` lands in C++'s `angle_only` and C++'s `no_update` is always
   zero; `lastdvsx`/`lastdvsy` are dead in the JS break branch and transcribed anyway.
8. **Incrementality stays in JS.** Dirty tracking, path GC and batch membership are stateful
   and belong with the assembler.
9. **Faces stay in JS** — decided. `StrokeScene` carries no faces and no zoom. Faces are the
   one place geometry depends on zoom (`update_polygon` picks line-vs-cubic on
   `abs(k) < 0.00001 / zoom`), whereas the stroke path samples on arc length alone. Keeping
   faces out is what makes **stroke output zoom-independent**, which is what makes it cacheable
   and the golden harness meaningful.
10. **wasm is main-thread.** The module is instantiated on the main thread, so the wasm stroker
    runs where the JS stroker ran. The worker pool rasterizes; it does not stroke.

## What each stage left behind

| Stage | Result |
|---|---|
| 0 | Dead backends and dead stroker code deleted; the three §7 bugs closed |
| 1 | `spline_draw.ts` split into `Spline.draw()` and `spline_overlay.ts` |
| 2 | `width_chain.ts` — full-recalc `update()` 79.99 → 23.13 ms (Panda), 77.24 → 31.41 ms (l&t) |
| 3 | `trim_state.ts` — trims out of the file format, onto the right side of the boundary |
| 4 | `stroke_scene.ts`, `outline_buffer.ts`, `stroker.ts`, `trimmer.ts`; drawer 2,351 → 1,304 |
| 5 | `stroke_dump.ts` + `stroke-golden.spec.ts` — the parity gate the port needed |
| 6 | The C++ port, bottom-up: geometry → outline buffer → trimmer → stroker → emscripten → wiring |

Details worth keeping:

- **Stage 2's win is the walk, not the evaluation.** A prototype cut `width()` and `deBoor()`
  counts not at all and walk counts ~500× (60,504 → 93.9/frame). A document can also be
  draw-bound rather than stroke-bound — `cthulu.fmo`, 10 segments, went 0.59 → 0.47 ms — and
  this stage does nothing for that.
- **Stage 3's arrays are not per-frame and cannot be.** `updateIntern()` only recomputes the
  vertices it sees flagged, so a stroke group whose vertices did not move is drawn from *last*
  frame's trims; and `spline_createops.ts` reads them outside any draw pass. Only the
  serialization went away. State is per `Spline` in a `WeakMap`, not module globals, because a
  frameset draws a drawspline and a pathspline through the same drawer.
- **Two outlines share one traversal** (4c). The stroke and the double stroke walk identical
  geometry but break it differently, so each point is recorded once with the opcode each path
  wants and the two streams are flushed afterwards — forced by the evaluation-order invariant,
  not chosen for tidiness.
- **`OutFinish` exists because a join chooses.** A stroke group's outlines all finish the same
  way and the drawer has always known which; a join picks fill-vs-stroke from geometry only the
  producer can see, so the outline carries the decision.
- **6b is the one exact comparison in the port.** No curve arithmetic in the outline buffer, so
  it is pinned byte-for-byte by a scripted LCG workload meeting at
  `count 200, cmds 422, pts 1436, hash 828189321`. 200 outlines and not 100, because at 100 the
  `cmds` array never outgrows its initial 256 and the growth path goes untested.
- **6e is the result that changed the plan.** Through emscripten the trimmer and stroker match
  the recording *bit for bit* — zero over 40,504 and 31,890 doubles, at `-O3 -flto` as well as
  `-O0`, and without `-ffp-contract=off`. §5.6's tolerance exists to compare two libms and
  through emcc there is only one, since the recording's geometry came out of
  `_built_wasm.wasm`. The residue is confined to `sceneDerivative`'s `Math.sin`/`Math.cos`.
- **6f binds by pointer, not by dump.** `src/wasm/stroker.cc` exports `fmStrokerAbi`,
  `fmStrokerBind`, `fmTrimVertex`, `fmStrokeGroup`, `fmStrokeJoin`. The scene does not cross
  the boundary; eighteen ints naming pointers and counts do, re-read per call. The outline
  buffer is owned by C++ and adopted by JS as views. Result: 77 and 67 calls, 32 and 46
  outlines, zero difference in trims and in every coordinate, zero fallbacks.

## §7 — the batch-layer bugs

All three landed in stage 0, and all three came out as deletions. Measurements in
[`../research/draw-refactor-stage0-measurements.md`](../research/draw-refactor-stage0-measurements.md).

- **§7.1 `CachedF64Array` cached nothing.** Its buffer is transferred to the worker, which
  detaches it, so `f64array.length` read 0 every frame and it reallocated every time — 0 hits
  in 1,051 calls. It could not be repaired in place, and that is the interesting part: because
  reallocation always produced an array of exactly the right length, `finish()`'s `subarray`
  return never fired — and the worker wraps the raw buffer with **no length**, so an oversized
  recycled buffer would have run the interpreter past the real commands into trailing zeros,
  where opcode 0 is `LINESTYLE`. *The broken cache was the only thing keeping that
  unreachable.* Replaced by `CommandBuffer`.
- **§7.2 Blur batching never fired.** `isBlurBatch` was unreachable behind a hardcoded
  `needsblur = false`. Measurement said blur costs nothing on a real GPU at any radius tried —
  the 7× penalty is a swiftshader artifact — so `isBlurBatch`, `Batch.dpi_scale` and the dead
  branches are gone. Reviving it would have meant implementing batch migration first, which is
  why it was stubbed rather than fixed: line 1343 only assigned a batch `if (!path._batch)`, so
  a path that became blurred stayed where it was.
- **§7.3 `clearOutstandingJobs()` orphaned promises.** The `this.callback` typo was real but
  was only a leak; the bug worth caring about is that a cancelled job's promise never settled,
  leaving `Batch.pending` stuck true — and `pending` is what `complete_viewport_draw()` blocks
  on. Fixed by settling each callback with `undefined` rather than rejecting (`Batch.gen()`'s
  `.then()` has no `.catch`, so rejecting would turn every cancel into an unhandled rejection).
  Repro kept as `playwright/renderjobs.spec.ts`.

## How to verify a change

Seven gates, roughly bottom-up. All are in `playwright/` except the first two.

| Gate | Holds |
|---|---|
| `tests/outline_buffer.test.ts` | The outline buffer against its C++ twin, exactly (vitest) |
| `src/wasm/tests/build.sh` | The four C++ programs against recorded artifacts, natively **and** through emcc |
| `width-chain.spec.ts` | The cached walk against `SplineSegment.widthWalk()` |
| `stroker-eval.spec.ts` | Every scene-side twin against its `SplineSegment` method, bit for bit |
| `stroke-scene.spec.ts` | `checkScene()` after a full pass and after deleting a segment |
| `path-dump.spec.ts` | Every retained path's command stream, keyed by z and content, never by key |
| `stroke-golden.spec.ts` | The whole-document outline digest against a recorded baseline |
| `stroke-wasm.spec.ts` | The wasm stroker against the JS stroker, exactly |

`src/wasm/tests/build.sh` runs without an emscripten SDK — the native pass needs only a host
compiler, and the wasm pass is skipped with a note. Set `WASM_EMSDK` to get both.

Two things about the recordings. They are committed so the C++ side builds and runs in a plain
checkout with no browser in the loop; and they are **reproducible**, which took work —
`dumpScene()` scrubs `REDRAW`/`REDRAW_PRE` because the drawer clears them as it consumes them,
so a dump captured how far the pass had got rather than a property of the document. A recording
that changes on its own has no teeth and puts a permanent diff in front of anyone who runs the
spec, which is how a real change gets waved through.

Re-record deliberately, with `FM_UPDATE_BASELINE=1`, and only for an intended change in output.

## Coverage gaps

Each is a real hole, recorded rather than closed. The first is the one that matters, because it
is arithmetic that runs constantly and is pinned to a value that hides bugs.

- **`shift` is zero in every sample.** Verified: 204 shift values across both files, all
  exactly 0 — while width tapering *is* exercised (6 segments on Panda, 10 on l&t have
  `w1`/`w2 != 1`). So `sceneShift`/`sceneDshift` run but never with a value, and three terms in
  `sceneEvalSide` are identically zero: `dlw * shift`, `dshift * lw`, `lw * shift`. A wrong
  sign on `sidesign`, a swap of the two sides, or a dropped term would reproduce every
  recording and pass every gate above. Closing it needs a sample with a shifted stroke. (A
  related data-API defect is in `todos.md`.)
- **The tight-corner join fallback is dead in both samples**, in both directions:
  `len1 * 0.25 > lw2` short-circuits true every time and the angle is never consulted.
  Confirmed by instrumentation, not inferred — 0 tight corners in either document.
- **`stroke_join()` never runs on Panda** — it has no vertex of valence > 2 — so every join
  control is a one-sample control.
- **The `steps` clamp at 16 is unreachable.** The longest segment in either document asks for
  13; Panda never leaves the floor of 7. A segment would need to be roughly 850 units long.
- **`fastDraw()` has no coverage.** It runs only under `window.DEBUG.fastDrawMode` (centre
  lines only — no joins, no trims, no faces), which nothing in the suite sets. Its share of
  stage 4f's prologue refactor, and its later conversion to a `DrawPass` argument, were both
  made by matching text rather than by test.

## Things that look wrong and are not

- **`update_normals()` still evaluates the spline directly.** It is the `draw_normals` debug
  overlay, off by default, and the only thing in the tree that wants `curvatureSide()` — so it
  stayed on the graph side rather than dragging curvature across the boundary for a view the
  renderer never uses.
- **`strokeAll()` is not what the drawer calls.** It is the harnesses' deterministic
  whole-document order. A frame trims only the vertices an edit touched and strokes in drawlist
  order interleaved with faces, which is what incrementality costs (§5.8).
- **The C++ outline buffer copies the JS growth policy** (256, then doubling) even though
  nothing external can observe it, so that a length mismatch is a real disagreement about
  content rather than a difference between two allocators.
- **`bez4`/`dbez4` keep the JS's operator grouping verbatim.** `3.0 * (s - 1.0) ** 2 * k2` is
  `(3 * (s-1)^2) * k2`. The forms agree at every `s` this code passes — 0, 0.5, 1, where both
  are exact — but writing the other would be a difference waiting for the first sampler that
  is not on those points.
- **`side2 = ~~(k / 2)` really does run to 3.** Values above 1 are truthy and behave as side 1,
  so the eight `(side1, side2)` pairs cover four combinations twice.
- **The overlay's `zoom = 1.0`** is a preserved pre-existing quirk, confined to
  `spline_overlay.ts` by stage 1. It was `matrix.m11` reading `undefined` through an `isNaN()`
  reset; correcting it resizes every overlay element at every zoom level, so it is a change to
  make on its own.
- **`ExportCanvasImage` hands `drawer.draw()` the viewport's context**, so the strokes land in
  the viewport and the exported PNG gets only the overlay. Preserved with a `NOTE:` rather than
  silently fixed.
