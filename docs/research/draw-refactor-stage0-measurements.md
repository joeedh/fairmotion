# Draw refactor, stage 0 — measurements

Stage 0 of the draw refactor (`docs/plans/draw-refactor-plan-final-notes.md`) gates three batch-layer decisions (§7.1, §7.2,
§7.3) on evidence rather than inspection. This records what was measured, how, and what
was decided. The harnesses were throwaway scripts at the repo root, deleted afterwards;
the instrumentation they read was temporary and is gone from the tree.

## Method

Both timing harnesses drove the app through Playwright against `pnpm serv`, which serves
`dist/html5app` **statically** — so `pnpm build` is mandatory between any two states being
compared.

The load pattern in each is the same, and stands in for a drag: load a `.fmo`, warm up
with one full draw, reset the counters, then for 120 frames set `regen = 1` on every live
`Batch` and `await` a `requestAnimationFrame`. Dirtying every batch each frame is exactly
what a drag does to the batch layer, and it is the only reliable way to get the batch code
to run at volume — mutating verts and calling `regen_*` produced almost no `Batch.gen()`
calls, and driving `spline.translate` through `execTool` produced three.

Two browser configurations:

| Name | Launch | Notes |
|---|---|---|
| headless swiftshader | `--use-angle=swiftshader --enable-unsafe-swiftshader` | what the Playwright suite uses |
| headed real GPU | `headless: false`, `--disable-gpu-vsync --disable-frame-rate-limit` | the vsync flags matter, see below |

Without the vsync flags every headed run reports the same 17.11 ms/frame regardless of
what it is drawing: the loop is pinned to the display refresh and the measurement is of
vsync, not of raster. Any headed number at exactly 16.7–17.2 ms/frame should be read as
"at or below the floor", not as a result.

## §7.1 — the `Float64Array` cache in `CachedF64Array.finish()`

`CachedF64Array` kept a `Float64Array` across frames, grew it on demand, and returned a
`subarray` when the retained buffer was longer than the command count.

Counters on calls / allocations / cache hits / subarray returns / bytes / time in the
allocation and in the copy loop, headless swiftshader, 120 forced-regen frames:

| Document | `finish()` calls | allocations | cache hits | subarray returns | KB/frame | alloc % of wall |
|---|---|---|---|---|---|---|
| `Panda.fmo` | 360 | 360 | 0 | 0 | 106 | 0.264% |
| `love and thunder.fmo` | 360 | 360 | 0 | 0 | 80 | 0.166% |
| `horn.fmo` | 331 | 331 | 0 | 0 | 22 | 0.085% |

**0 cache hits in 1051 calls.** The cause is structural, not tuning: `Batch.gen()` hands
the result straight to `postRenderJob()`, which puts `commands.buffer` in `postMessage`'s
transfer list. The retained array is detached before the next frame can ever reuse it. The
subarray path never fired either, for the same reason.

Cost of what the cache was avoiding: 0.085–0.264% of frame time, against a per-element
copy loop that costs as much or more than the allocation it precedes.

**Decision: deleted.** Replaced by `CommandBuffer`, a plain `number[]` plus one
`new Float64Array(array)` at the end. The exact-length array is load-bearing rather than
incidental — the worker wraps the transferred buffer with `new Float64Array(buf)` and
interprets to its end, so any trailing slack would be read as opcode 0 (`LINESTYLE`) and
four arguments.

## §7.2 — blur batching

The batch layer carried a scheme for routing high-blur paths into their own batch rendered
at a reduced `dpi_scale` (0.1 or 0.25). It had been switched off by a hardcoded
`let needsblur = false;` under an `//XXX This is not working` comment, leaving the
`blurlimit = 25` test commented out above it and four `isBlurBatch` branches unreachable.

The harness set `blur` on every distinct `Material` reachable from the loaded spline and
called `mat.update(spline)` on each, mirroring what `prop_update` in
`src/core/data_api/data_api_define.ts` does when the material editor changes a field. A
bare field assignment is not enough — the owners never re-stroke, and the aabb padding
(`blur + 15`) never reaches the tile size. Correctness of the setup was checked with a
counter over paths per `Batch.gen()`: blur 0 must report 0 blurred paths, blur 40 must
report most of them.

### Headless swiftshader — `Panda.fmo`

| | blur 0 | blur 40 |
|---|---|---|
| ms/frame | 22.36 | **154.73** |
| mean tile | 265 625 px² | 390 400 px² |
| blurred paths per gen | 0 of 13 | 7.66 of 13 |
| `updateBatches` total | 314 ms | 300 ms |
| blit total | 19 ms | 10 ms |
| jobs resolved | 360 of 360 | 358 of 358 |
| worker round-trip | 2.80 ms mean | 2.63 ms mean |

A 6.9× frame-time penalty — and none of it visible to any JS timer. Main-thread work is
flat, and the worker round-trip, measured from `postRenderJob()` to its `.then()`, is flat
or slightly *lower*. Every posted job resolves, so the flat round-trip is not an artifact
of dropped jobs. The cost lands in the raster/GPU pipeline, where it shows up only as rAF
cadence.

### Headed, real GPU, vsync disabled

| Document | blur 0 | blur 40 | blur 200 |
|---|---|---|---|
| `love and thunder.fmo` | 4.91 ms/frame | 4.17 | 4.66 |
| `Panda.fmo` | 5.19 ms/frame | 4.96 | 5.33 |
| `cthulu.fmo` | 13.15 ms/frame | 11.88 | 13.11 |

Flat, within run-to-run noise, in every case — including `cthulu.fmo` at blur 200, where
the padding grows the tile 13× (8 836 → 117 649 px²) and `Panda.fmo` at blur 200, where it
grows 2.7×. The worker round-trip falls slightly as blur rises rather than climbing.

**Decision: deleted.** On real hardware a large `g.filter = blur()` in the worker costs
nothing measurable, so the machinery exists to work around a cost that is not there. The
7× figure is a software-rasterization artifact of swiftshader and does not describe either
shipping target. Removed: `isBlurBatch` and its four dead branches, `Batch.dpi_scale`
(only ever 1.0 outside the dead branch, which also let `_getPaddedViewport()` and the
`gen()` transform push/pop simplify), the hardcoded `needsblur` and the commented-out
`blurlimit` block, and the now-unused `w2` weight. `g.imageSmoothingEnabled` becomes a
constant `false`, which is what it already evaluated to.

The commented-out block was not restored: it is the version that did not work.

## §7.3 — cancelled render jobs never settle

This one is gated on a repro rather than a profile, and the repro lives in the suite:
`playwright/renderjobs.spec.ts`. It drives 20 rounds of "force a full redraw, wait a
frame, cancel everything in flight", and asserts that at least one round caught a job
mid-flight and that no round leaves an unsettled job behind.

To make that observable the debug bridge gained `__fm.renderJobs()` and
`__fm.cancelRenderJobs()`. `outstanding` is the number of posted jobs whose promise has
not settled, counted straight off `Thread.callbacks`.

Against the unfixed code the spec fails on the first round that catches anything:

```
Error: cancelling left unsettled job promises behind
Expected: 0
Received: 3
```

Three orphaned promises per cancel. The chain: `clearOutstandingJobs()` cleared
`msgid_ownerid_map`, so when the worker's `RESULT` for a cancelled job arrived,
`Thread.onmessage()` could not find an owner and returned without calling the resolver.
`Batch.gen()` is the holder of that promise; its `.then()` is the only thing that clears
`pending`; and `CanvasDraw2D.draw()` resolves its own promise only once no batch is
`pending`. One cancel wedges the drawer permanently.

The `this.callback = {}` typo (for `callbacks`) is real but incidental — spelling it
correctly would have dropped the resolvers rather than settled them, producing the same
hang with no record of it.

**Fix:** `clearOutstandingJobs()` takes the callback map, replaces it with a fresh one,
and calls every resolver with `undefined`. Resolve rather than reject: `Batch.gen()`'s
`.then()` has no `.catch`, so a rejection would surface as an unhandled promise. `Batch`
treats `undefined` as "no tile came back" — keep blitting the previous one, clear
`gen_req` and set `regen` so the next draw re-posts the job.

Two adjacent defects in the single-job cancel path, which is the same bug one call down:

- `Thread.cancelRenderJob()` left `callbacks[oldid]` in place, so it orphaned a promise
  exactly as `clearOutstandingJobs()` did. It now settles the one job it cancels.
- It read the msgid out of `msgid_ownerid_map[ownerid]` — the wrong direction, and the
  guard immediately above it reads `ownerid_msgid_map`. `oldid` was therefore `undefined`,
  and the `CANCEL_JOB` message it posted named no job. Corrected to `ownerid_msgid_map`.

`ThreadManager.cancelAllJobs()` and `cancelRenderJob()` have no live callers today — both
call sites in `spline_draw_new.ts` are commented out — so this is correctness under
cancellation, not a hot path. The spec is what keeps it that way.
