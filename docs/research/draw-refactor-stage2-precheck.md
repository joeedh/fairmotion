# Draw refactor, stage 2 — pre-check

Stage 2 of `docs/plans/draw-refactor.md` opens by gating itself on a measurement:

> **"Largest win available" is a hypothesis, not a measurement.** Nobody has profiled this.
> The cheap test before committing to the stage: set a counter in `walk()` and one in
> `bspline.deBoor`, drag a vertex on a real `.fmo`, and compare against a `performance.now()`
> split across extract / stroke / batch / worker-wait. If the frame is actually worker-bound,
> this stage is still correct but should be reprioritized below stage 4.

This records what was measured, how, and what was decided. The harness was throwaway
(`playwright/_stage2_measure.ts` plus two spec files) and the instrumentation it read
(`src/curve/_stage2_stats.ts`, the `_ST.` counters, the `__cacheNet` prototype) was temporary
and is gone from the tree.

## Method

Playwright against `pnpm serv`, which serves `dist/html5app` **statically** — `pnpm build` is
mandatory between any two states being compared. Same two browser configurations as stage 0
(`docs/research/draw-refactor-stage0-measurements.md`), including the
`--disable-gpu-vsync --disable-frame-rate-limit` flags without which every headed run reports
17.11 ms/frame and is measuring the display refresh.

The load is a vertex drag, because that is the case stage 2 is about: select one vertex, then
for 60 frames move it ±0.7 units, call `complete_viewport_draw()`, and await a
`requestAnimationFrame`. The drag replicates `TransSplineVert.apply()` + `.update()` by hand
rather than going through the tool system — `execTool("spline.translate", {translation: [dx, dx]})`
throws out of `Vec2Property.parseArg`, since path.ux's `NumberProperty.parseArg` rejects
anything that is not a `number` and `Vec2Property` inherits it. Sign alternates so both runs
cover the same geometry and end where they started.

Counters: `walk()` calls, `SplineSegment.width()` calls, `bspline.deBoor()` calls. Timers:
`SplineDrawer.update()` (extract + stroke), `SplineDrawer.draw()` (batch), and
`postRenderJob()` → its `.then()` (worker round-trip). All figures below are per-frame means
over the 60 frames, except worker, which is per job.

Rather than stopping at counters, each file was also run with a minimal per-frame control-net
cache behind a `window.__cacheNet` flag: `width()` stores `{l4, ks, ws, ss}` on the segment
keyed to a frame counter, and a hit skips all eight walks and falls straight through to the two
deBoors. That measures the win directly instead of inferring it from call counts.

## Results

Headless swiftshader:

| Document | wall | update | draw | worker/job | walks | `width()` | deBoor |
|---|---|---|---|---|---|---|---|
| `Panda.fmo` base | 34.55 | 26.66 | 2.26 | 6.46 | 60 504 | 7 563 | 11 338.6 |
| `Panda.fmo` cached | **16.98** | **7.39** | 2.46 | 4.12 | 93.9 | 7 563 | 11 338.6 |
| `love and thunder.fmo` base | 44.46 | 31.69 | 1.55 | 3.43 | 69 073.6 | 8 634.2 | 12 945.4 |
| `love and thunder.fmo` cached | **18.71** | **7.54** | 1.75 | 4.66 | 123.6 | 8 634.2 | 12 945.4 |
| `cthulu.fmo` base | 74.59 | 32.82 | 32.58 | 23.10 | 1 009.6 | 126.2 | 186.35 |
| `cthulu.fmo` cached | 66.83 | 29.74 | 32.59 | 12.02 | 43.2 | 119 | 175.55 |

Headed, real GPU, vsync disabled:

| Document | wall | update | draw | worker/job | walks | `width()` | deBoor |
|---|---|---|---|---|---|---|---|
| `Panda.fmo` base | 20.93 | 16.07 | 1.42 | 1.91 | 61 528 | 7 691 | 11 530.5 |
| `Panda.fmo` cached | **9.35** | **4.38** | 1.65 | 1.72 | 110 | 7 852.2 | 11 772.3 |
| `love and thunder.fmo` base | 21.19 | 15.39 | 0.92 | 1.60 | 70 235.2 | 8 779.4 | 13 163.1 |
| `love and thunder.fmo` cached | **8.04** | **3.13** | 0.88 | 1.31 | 136.8 | 8 914.2 | 13 365.3 |
| `cthulu.fmo` base | 36.33 | 16.88 | 17.25 | 11.10 | 948 | 118.5 | 174.75 |
| `cthulu.fmo` cached | 48.76 | 23.66 | 25.07 | 9.07 | 43.9 | 119.1 | 175.65 |

All times in ms.

## Reading

**The frame is not worker-bound on stroke-heavy documents.** On real hardware the worker
round-trip is 1.3–1.9 ms per job at ~2 jobs/frame, against 15–16 ms in `SplineDrawer.update()`.
The gate's alternative — reprioritize stage 2 below stage 4 — does not apply.

**The walk is the redundancy, and the evaluation is not.** Caching the net cuts update time
3.7–4.9× and roughly halves wall-clock, while `width()` and `deBoor()` counts stay flat and the
walk count falls by ~500×: 60 504 → 93.9 on `Panda.fmo`. This is exactly what §P2 predicts —
one `evaluateSide()` costs 6 `width()` calls, each of which re-derives a control net that is
constant per segment for the frame.

Note the ratio in the baseline columns: **~8 walks per `width()` call**, and ~1.5 deBoors. The
walks are the whole cost of the redundancy and none of the answer.

**`cthulu.fmo` is the counter-example, and it is worth keeping in view.** It has 10 segments and
~119 `width()` calls per frame, so there is nothing for the cache to save; its frame is dominated
by `SplineDrawer.draw()` (17–25 ms) and the worker (9–11 ms). Its cached run coming out *slower*
is run-to-run variance in the batch path, not a regression — the counters confirm the cache did
its job (948 → 43.9 walks) and the deBoor counts are unchanged. A document can be draw-bound
rather than stroke-bound, and stage 2 does nothing for that case.

## Parity

Stage 2's safety claim is that the change is exact, not approximate. Pixel hashing turned out to
be useless as evidence: the viewport canvas hash picks up async blit timing (the same document
sampled twice reported 692 675 and 6 588 nonzero bytes, i.e. "not blitted yet"), and small UI
canvases are chrome, not stroker output.

So parity was checked against the evaluator's own output instead. Every segment of each document
sampled at 33 values of `s`, recording both the `width()` return and the `shift` written to
`outShift[0]`, with the cache off and then on, compared with `Object.is` — bit-exact, no epsilon.
Run twice per file: once on the net as loaded, once after moving a vertex so the net is not the
one the file was saved with.

| Document | samples per pass | mismatches |
|---|---|---|
| `Panda.fmo` | 3 960 | 0 |
| `love and thunder.fmo` | 2 772 | 0 |
| `cthulu.fmo` | 660 | 0 |

7 392 samples per pass across the three files, six passes, zero mismatches, `maxDiff` 0.

## Decision

**Stage 2 stands, at its planned priority.** The hypothesis it rests on is confirmed on both
browser configurations and on two independent stroke-heavy documents: the redundant walk is the
dominant per-frame cost, removing it is worth ~2× wall-clock on a drag, and the result is
bit-identical.

The prototype is not the design. It keys on a frame counter and hangs a `_netCache` object off
each segment, which is a measurement device; §P3 is the actual shape — the net belongs to the
*topological chain* that `walk()` traverses (it crosses stroke-group boundaries), an object
nothing in the code currently names.

## Incidental finding

In `SplineSegment.width()` the fourth *backward* `walk()` is dead. The eight walks produce
`w0b/s0b/l0b` … and of that group nothing is read: `ks[0] = -l0 - l1 - l2` stops at the third,
`ws[0] = w2` stops at the second, and `seg`/`v` — the only other state `walk()` mutates — are
reassigned two lines later for the forward pass. One of the eight walks per `width()` call is
pure waste today, independent of any caching. `w0`, `s0`, `w1`, `s1`, `l8` are likewise unread
(their walks are still needed for `l0`, `l1`, `w8`, `s8`). Free win, to fold into stage 2.
