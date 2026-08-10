# Draw pipeline refactor

Analysis of the spline → stroke → batch → pixels path, aimed at two goals:

1. **Fewer, clearer layers** between a `Spline` and a rasterized batch.
2. **A stroker that can be lifted into a standalone C++/wasm library** — which means it has
   to become a pure function over flat buffers, with no `Spline`, no `VectorDraw`, and no
   DOM anywhere in it.

Read [rendering.md](../rendering.md) and [stroking.md](../stroking.md) first; this document
assumes both and does not repeat them.

Status: **not started.** Nothing below has been implemented. Claims have been checked against
the source once; where a claim is a guess rather than a reading, it says so.

## 1. Layer census

| # | Stage | Code | Lines |
|---|---|---|---|
| 1 | Repaint scheduling | `core/startup/redraw_globals.ts` | — |
| 2 | Viewport frame, matrix, double buffer | `View2DHandler.do_draw_viewport` | — |
| 3 | Backend selection | `FrameSet.draw` | ~20 |
| 4 | Solve gate + delegate | `Spline.draw` | ~30 |
| 5 | Draw sort → `drawlist` | `spline_draw_sort.ts` | 417 |
| 6 | Stroke grouping | `spline_strokegroup.ts` | 556 |
| 7 | **Everything else** | `SplineDrawer` in `spline_draw_new.ts` | 2,350 |
| 8 | Editing overlay | `draw_spline()` in `spline_draw.ts` | 492 |
| 9 | Retained path model | `vectordraw_base.ts` | 417 |
| 10 | Command stream + batching | `vectordraw_canvas2d.ts` | 1,411 |
| 11 | Worker pool | `vectordraw_jobs.ts` | 459 |
| 12 | Opcode interpreter | `vectordraw_canvas2d_worker.ts` | 447 |

Stages 10–12 are a real rasterizer with a clean plain-data interface already
(`Float64Array` of opcodes in, `ImageBitmap` out). **They are not the problem.**

The problem is stage 7, which spans what should be four separate concerns, and stages 3/4/8,
which are hops that exist for historical reasons.

## 2. The actual problems

### P1 — there is no data boundary between the spline and the rasterizer

`SplineDrawer` writes *directly* into retained backend paths. A single method body does all
of: geometry sampling, path-id allocation, z assignment, colour lookup from materials, clip
wiring, incremental-redraw bookkeeping, and debug overlay emission.

`update_stroke_group()` is the clearest case — 320 lines that allocate five path ids, pull
colour and blur off `seg.mat`, build the fill outline, build the double-stroke outline,
interleave three debug paths, and call `addClipPathsToStrokeGroup()`.

**Consequence for the wasm goal:** there is no value in the system you could hand to a
foreign module. There is nothing you could unit-test without constructing a `VectorDraw`.
Everything below follows from fixing this one thing.

### P2 — the stroker pulls on the whole spline graph, lazily, per sample

One `evaluateSide(s, side, dv, no, lw_dlw)` call costs:

| Sub-call | Count | Each |
|---|---|---|
| `eval_curve` (via `evaluate`, `derivative`, `curvature`) | 2–3 | full spiral quadrature |
| `width()` (via `shift`, `dshift`×2, `width`, `dwidth`×2) | 6 | 8 `walk()` steps + 1–2 `deBoor` |

`curvature()` is only reached when `dv_out` is requested (`spline_types.ts:1680`), hence 2–3.
The six `width()` calls give **48 pointer-chasing steps through the segment graph and 9 deBoor
evaluations per boundary sample**. Each `walk()` result is array-destructured
(`let [w2, s2] = walk()`), which goes through the iterator protocol on a plain `Array`.

What is redundant here is the **walk**, not the evaluation. The B-spline control net — nine
width values, nine shift values, the knots derived from neighbour arc lengths — is constant
per segment for the whole frame; the deBoor at parameter `s` genuinely is not. Caching the
net removes 48 graph steps per sample and leaves all 9 deBoors. That is the honest size of
the win.

A second, larger win sits behind it but changes output: four of the six `width()` calls exist
only to central-difference `dwidth` and `dshift` at `df = 1e-4`. With the control net in hand
those are analytic B-spline derivatives, taking 9 deBoors to about 3. This **cannot** be done
before parity is established (see constraint 7) — but it should be done immediately after,
and constraint 6 gives a second reason to want it.

Junction trimming is the expensive tail rather than the common case: 8 bisection iterations ×
O(V²) segment pairs × 8 side combinations × 2 `evaluateSide` calls, all at the cost above —
but only for vertices with `BREAK_TANGENTS` or valence > 2. Ordinary two-valence joins take
the four-assignment path at `spline_draw_new.ts:1792`.

**Consequence for the wasm goal:** you cannot call into wasm per sample. A wasm boundary has
to be per-frame (or per-dirty-batch), which means the inputs must be flattened first.

**The flattening is not wasm overhead — it is the optimization.** Doing it makes the JS
version substantially faster on its own, and *then* the C++ port is a mechanical translation
of a function that already takes flat arrays.

### P3 — width belongs to a chain, but no such object exists

`width()`'s `walk()` steps outward through 2-valence vertices, four segments each way. A
`SplineStrokeGroup` can *end* at a 2-valence vertex (material change, `linewidth2` change,
etc. — reasons 2–8 in `vertexIsSplit`), and the walk crosses that boundary regardless.

So the width B-spline's control net is a property of the **topological chain**, which is a
strictly coarser object than the stroke group. Nothing in the code names it. Until it is
named and computed once, the stroker cannot be given a self-contained input.

### P4 — derived render state is serialized into the document

`SplineDrawData` — trims and mitre points — is a `CustomDataLayer` on segment `cdata`, with a
`STRUCT` and a back-compat `loadSTRUCT`. It is recomputed from scratch whenever its vertex is
flagged, so persisting it buys nothing, while it does:

- grow every `.fmo` file,
- carry a permanent file-format migration path (`start`/`end` number → method collision),
- put the trim scratch on the wrong side of any future wasm boundary.

### P5 — path ids are a hand-rolled tagged namespace over `spline.idgen`

| Tag | Meaning |
|---|---|
| `eid` | element's own path |
| `eid \| 1<<17` / `1<<18` | vertex-join wedge at v1 / v2 |
| `\| 1<<19` | that wedge's double stroke |
| `g.id \| 1<<20` | stroke group's double stroke |
| `(eid<<1) \| 8192`, `\| 16384` | stroke debug paths |
| `z + 10000…60002` | debug z offsets |

`SplineStrokeGroup.id` is allocated from `spline.idgen.gen_id()` (`spline_strokegroup.ts:336`,
`:422`, `:515`) — the *same* generator as element eids. The tag bits start at `1<<17`, so once
a document has allocated 131,072 ids, path ids start colliding.

The reason this is nearer than "documents with 131k elements" suggests: group ids are reused
only when the group's eid-set hash matches (`:327`), so every *new chain shape ever seen*
burns an id. The counter tracks edit history, not element count.

### P6 — the editing overlay lives inside the render path

`draw_spline()` is ~40 lines of pipeline plumbing followed by ~250 lines of handle, vertex and
selection drawing straight onto the 2D context. The overlay has no relationship to the
retained pipeline; it is in the same function because that is where `g` happened to be in
scope. It is also where the documented `zoom = 1.0` quirk lives.

### P7 — dead backends keep `VectorDraw`/`PathBase` abstract for nobody

| File | Lines | Referenced by |
|---|---|---|
| `vectordraw_stub.ts` | 278 | barrel import + commented-out export |
| `vectordraw_canvas2d_path2d.ts` | 487 | same |
| `vectordraw_skia_simple.ts` | 678 | same |
| `vectordraw_skia_worker.ts` | 778 | `vectordraw_jobs.ts`, behind `config.HAVE_SKIA` |
| `strokedraw.ts` | 1 | `entry_point.ts` |
| `vectordraw_canvas2d_jobs.ts` | 0 | `entry_point.ts` |

~2,220 dead lines (line counts verified). The skia worker is the one that is not simply
unreferenced: `setMaxThreads()` and `postRenderJob()` spawn it when `config.HAVE_SKIA`, which
is `false` (`config/config.ts:36`). Removing it means removing the flag and both branches, not
just the file. The other imports in `vectordraw.ts` exist only to feed commented-out
`export let Canvas = …` blocks.

Live backends are `CanvasDraw2D` (default), `SimpleCanvasDraw2D` (tiled
mode and SVG-export scaffolding), and `SVGDraw2D` (export). With the dead three gone,
`PathBase` can stop being a twelve-method abstract class of `throw new Error("implement me")`,
and `PathBase.cubicTo`'s recursive subdivide-and-solve (needed only by backends without native
cubics — `CanvasPath` overrides it) can move down into the backends that use it.

### P8 — `update()` is a 332-line function of 12 positional parameters

Plus six more via `DrawParams`. Also in that method:

- `zoom` is a parameter, overwritten on the first line from `matrix.$matrix.m11`.
- Six `last_*` fields the source already marks write-only.
- The y-flip / pan-extraction matrix dance is duplicated verbatim in `fastDraw()`.
- `update_polygon` / `update_polygon_color` still take the ten unpacked arguments that
  `DrawParams` was introduced to replace.

## 3. Target shape

Four stages, plain data at every boundary:

```
Spline (topology, ks, materials, layers)
   │
   ▼  EXTRACT  — JS, reads the Spline, patches only what is dirty
StrokeScene   — flat typed arrays, persistent across frames, stable indices.
   │
   ▼  STROKE   — pure. JS today, C++/wasm later. Same input, same output.
OutlineBuffer — flat contours in the existing opcode encoding.
   │
   ▼  ASSEMBLE — JS. path ids, z, colour, clip, GC, dirty tracking.
CanvasPath list
   │
   ▼  RASTER   — unchanged: batches → workers → ImageBitmap → blit
```

### StrokeScene (extract output)

| Array | Per element |
|---|---|
| `segs` | `ksPtr` (heap address, see below), `v1.xy`, `v2.xy`, `length`, `flags` |
| `chains` | segment index range, closed flag |
| `widthCps` | per chain: knot vector + width control values + shift control values |
| `junctions` | vertex xy, incident `(segIndex, end)` pairs in angular order, flags |
| `groups` | chain range + style index |
| `styles` | strokecolor, blur, linewidth, linewidth2, strokecolor2, flags — deduped |
| `dirty` | chain and junction indices to restroke |

### OutlineBuffer (stroke output)

| Array | Per element |
|---|---|
| `contours` | `ownerId`, `role` (fill / double-stroke / wedge), `styleIdx`, vert range, flags |
| `verts` | flat coordinates tagged with the existing `OPCODES` subset (MOVETO/LINETO/CUBIC) |

Using the existing opcode encoding is worth doing, but **not** because it makes anything
zero-copy. Trace what actually happens to a command today:

1. `CanvasPath.commands` is a plain `number[]`, appended one element at a time by
   `_pushCmd(...arguments)` — which runs an `isNaN` check per number.
2. `genSmart()` builds a second `number[]` (`_commands`) with the transform/style prologue,
   cached on `this.recalc`.
3. `Batch.gen()` (`vectordraw_canvas2d.ts:407`) **concatenates every path's `_commands` into
   one array**, element by element.
4. `CachedF64Array.finish()` copies that into a `Float64Array`.
5. `postRenderJob` → `postMessage(MS.SET_COMMANDS, id, [commands.buffer])` — the buffer is
   **transferred**.

Two consequences, and the second is a hard constraint on the whole heap-resident idea:

- **A per-path buffer can never be the thing sent.** The batch is a concatenation across
  paths, decided at batch time from z order, per-path matrices and clip state. Some copy at
  that boundary is structural.
- **A wasm-heap view must never reach that transfer.** Transferring a view's `.buffer`
  detaches it — and for a heap view that buffer is the entire `WebAssembly.Memory`. That
  would take out `seg.ks` and every other view in one call. Stroker output has to be copied
  *out* of the heap on its way to a path, deliberately, with a comment saying why.

So the realistic gain from emitting opcodes directly is replacing per-number `push` +
`isNaN` with a bulk `set()`/`subarray` copy, and dropping step 1 or 2 — three copies down to
two, not down to zero. That is still worth having; it is not the headline it was written as.

#### `CachedF64Array` caches nothing — and is hiding a bug while it fails

Found while tracing the above. `CachedF64Array` exists to hold one `Float64Array` across
frames and grow it on demand; there is exactly one instance (`Batch._commands`) and one
`finish()` call. `Batch.gen()` then hands the result to `postRenderJob`, which puts
`commands.buffer` in `postMessage`'s **transfer list**. That detaches it, so next frame
`this.f64array.length` reads 0, `0 < array.length` is always true, and it reallocates. The
cache has never hit once. It self-heals, so this is waste and misdirection, not a defect:
one allocation the size of the whole command stream per batch per frame, plus a field and two
branches that read as if they save you something.

The reason it cannot simply be repaired in place: because reallocation always produces an
array of exactly `array.length`, `finish()` always returns the whole array and the `subarray`
return at line 90 never fires. That is load-bearing, because the worker wraps the raw buffer
with no length —

```ts
state.msg_data!.commands = new Float64Array(e.data.data[0]);   // whole buffer
while (_i < commands.length) { ... }                           // reads to buffer end
```

— so an oversized recycled buffer would have the interpreter run past the real commands into
trailing zeros, where opcode 0 is `LINESTYLE` and it would consume four of them as a style and
carry on. **The broken cache is the only thing keeping that path unreachable.**

**Decision: delete the caching, gated on a profile.** In order:

1. Measure first. Instrument `finish()` for allocation count and bytes per frame, on a real
   `.fmo` during a drag. This is cheap and settles it either way.
2. If the allocation does not show up — the expected outcome, since it is one allocation per
   batch against a per-element copy loop feeding it — **delete `f64array` and both branches**
   and return `new Float64Array(this.array)`. Same behaviour, ~10 fewer lines, and the class
   stops claiming something it does not do. The latent worker bug goes with it, because the
   returned array is always exactly the command count.
3. If it *does* show up, do the real fix rather than reviving the current shape: have the
   worker transfer the buffer back alongside the `ImageBitmap` in its `RESULT` message, pool
   it in `ThreadManager`, and pass an explicit command count through `SET_COMMANDS` so the
   worker wraps `new Float64Array(buf, 0, len)`. The length parameter is not optional here —
   it is what makes recycling safe, and closes the bug in the same change.

Do not take the middle road of keeping the cache and not transferring: that trades one
allocation for a structured-clone copy of the same bytes.

That is four stages with inspectable data between each, replacing one 1,950-line class that
currently spans three of them and reaches into the fourth.

### The scene should live *in* the wasm heap, not be copied into it

`ks` never has to cross the boundary, because it is already on the far side of it.
`native_api.checkSegment()` (`src/wasm/native_api.ts:227`) does not copy `ks` per call — the
first time a segment is evaluated or solved natively it **permanently relocates** `seg.ks`
into the wasm heap:

```ts
let ptr2 = wasm._malloc(8 * 16);
let ks2: KsArray = new Float64Array(wasm.HEAPU8.buffer, ptr2, ks.length);
...
ks2.ptr = ptr2;
seg.ks = ks2;                       // JS keeps a view; C++ keeps the address
```

`evalCurve()` then passes `seg.ks.ptr` and nothing else; `onSegmentDestroy()` frees it. JS
writes to `seg.ks[i]` are writes into wasm memory. Since `ks` is 16 doubles — 128 bytes, the
clear majority of a segment's payload — this removes most of the per-frame marshalling cost
before the design even starts.

The generalization is the actual design principle: **`StrokeScene` should not be a buffer
that gets passed, it should be heap-resident storage that JS fills through typed-array
views.** Every array in the table above is allocated once from the wasm heap and handed back
to JS as a `Float64Array`/`Int32Array` view; extract writes vertex coordinates and widths
straight into it; "calling the stroker" is passing a struct pointer and a few counts. `ks` is
already an instance of this pattern and is the proof it works.

Behind a small allocator shim this costs the JS fallback nothing: when wasm is unavailable
the same shim returns plain typed arrays and the JS stroker runs over identical code. That is
also the honest reason to keep the JS stroker — it is the reference implementation, not a
second implementation.

Three things about the existing mechanism have to be dealt with first; see §5. And the rule
above is absolute: heap views are for *input* and for the stroker's working output. Nothing
that a heap view backs may be handed to `postMessage`'s transfer list.

### The scene is persistent, not rebuilt per frame

The diagram says "per frame", which is wrong as written and would be a regression. What
`update()` does today (`spline_draw_new.ts:1056`) is walk the whole drawlist every frame but
**early-out per group**: `update_stroke_group()` returns at line 1263 if the paths already
exist and nothing in the group is flagged `REDRAW | UPDATE`. Geometry regeneration is already
dirty-gated; only the walk is O(drawlist). Junction trimming is gated harder still —
`update_vertex_strokes()` returns immediately at line 1792 unless the vertex has
`BREAK_TANGENTS` or valence > 2.

An extract pass that repopulates flat arrays for every segment each frame does strictly more
work than the loop it replaces. So `StrokeScene` has to be a **persistent structure that is
incrementally patched**, which brings requirements the flat-array framing hides:

- **Stable indices across frames.** A segment's slot must not move, or the `dirty` array
  means nothing and every downstream index (chains, junctions, groups) has to be rewritten.
- **Therefore a free list**, and compaction that is either never done or done as an explicit
  rebuild with full re-stroke.
- **Therefore an `eid → index` map maintained incrementally** — a JS `Map` sitting beside the
  "no object references" arrays. That is fine, but it is state, and it is the part most
  likely to develop bugs. It wants its own invariant check under `DEBUG`.

The stroker stays pure — dirty scene in, outlines out. The *scene* does not.

## 4. Staged plan

Each stage is independently landable and independently useful. Nothing here requires
committing to the wasm port.

### Stage 0 — delete dead weight

Dead backends (P7, ~2,220 lines) plus dead code inside the stroker: the `break`-first loop in
`testIsect()`, the `if (0)` block in `update_vertex_strokes()`, `bad_corner`, the six
write-only `last_*` fields, the dead higher-valence branches in `update_stroke_points()`, the
dead code below `return` in `shift()`.

Also here, as three self-contained changes independent of everything below: **the batch-layer
bugs in §7** — `CachedF64Array`, blur batching, and `clearOutstandingJobs()`. Each is gated on
a measurement or a repro first, and in each case the expected outcome is deletion rather than
repair.

*Buys:* a smaller surface for everything below, one obvious answer when someone asks which
backend is live, and one less cache that isn't.

### Stage 1 — split the overlay out of the render path

`spline_draw.ts` → `spline_overlay.ts`. `view2d` calls the drawer and the overlay directly;
`draw_spline()` disappears, and with it one hop of stage 4→8.

*Buys:* the overlay's `zoom = 1.0` quirk is isolated where it can be fixed or documented
deliberately rather than by accident.

### Stage 2 — the WidthChain pass

Name the chain (P3). Compute knots and width/shift control values once per frame per chain;
`SplineSegment.width()` reads the cache instead of walking.

*Buys:* a large performance win, testable in isolation, and the first flat array in the new
design.

Two things to be precise about. **The no-behaviour-change claim is exact, not approximate**,
and that is what makes this stage safe: the cache is keyed per segment, `width(s ± df)` walks
from the same segment as `width(s)`, so a cached net feeds bit-identical inputs to the same
deBoor. Do not fold the analytic-derivative change (P2) in here — that one *does* change
output and belongs after stage 5.

**"Largest win available" is a hypothesis, not a measurement.** Nobody has profiled this. The
cheap test before committing to the stage: set a counter in `walk()` and one in
`bspline.deBoor`, drag a vertex on a real `.fmo`, and compare against a `performance.now()`
split across extract / stroke / batch / worker-wait. If the frame is actually worker-bound,
this stage is still correct but should be reprioritized below stage 4.

### Stage 3 — transient trim state

Replace the `SplineDrawData` cdata layer with per-frame arrays indexed by segment (P4). Keep
the loader so old files still open; stop writing it.

*Buys:* smaller files, no further migration debt, and the trim scratch ends up on the correct
side of the future wasm boundary.

### Stage 4 — `StrokeScene` / `OutlineBuffer`

Rewrite the stroker as `stroke(scene) -> outlines`: pure, no `VectorDraw`, no `Spline`.
`SplineDrawer` becomes an assembler — extract scene, call stroker, map outlines onto retained
paths, GC, clip wiring, colours, dirty tracking. Replace the tagged-id namespace with an
explicit `(ownerId, role)` key (P5).

*Buys:* the wasm boundary now exists. The stroker becomes unit-testable. The drawer should
land somewhere near 700 lines.

### Stage 5 — golden-output harness

Serialize a `StrokeScene` from a handful of `.fmo` files, run the stroker, hash the
`OutlineBuffer`. **This is the parity gate for the port** — a C++ rewrite without it is
unverifiable.

### Stage 6 — the C++ port

`src/wasm/stroker.cc`, reusing `eval_curve` / `spiraltheta` / `spiralcurvature`, which are
already in `src/wasm/spline.h`. Keep the JS stroker as the reference implementation behind
`config.USE_WASM`, exactly as `do_solve` does today.

Note what stage 4 has already done by this point: if `StrokeScene` is heap-resident, the
curve data the C++ stroker needs is *already at the address it expects* — `ks` has been there
since the first native evaluation, and the rest arrived there when extract wrote it. The port
is a rewrite of the geometry, not the introduction of a boundary. The boundary is the thing
stage 4 builds.

There is a dormant precedent already in the tree: `GEN_DRAW_BEZIERS` / `SplineDrawSegment` /
`SplineBezSegments` / `do_segment_split()` in `solver.cc` and `wasm_main.cc` implement
"flatten segments to beziers in wasm" and **nothing calls them**. Wrong granularity —
per-segment centre line, no width, no joins — but it is proof the ABI style works, and a
reasonable starting point for the buffer layout.

## 5. Constraints the port has to respect

1. **`checkSegment()` coverage is conditional.** `ks` is only relocated into the heap by
   `evalCurve()` — gated on `native_api.isReady() && !(DEBUG.no_native || DEBUG.no_nativeEval)`
   (`spline_math.ts:99`) — and by the solve writer (`native_api.ts:703`). A segment that has
   never been natively evaluated or solved still holds a plain JS array, and a stroker that
   assumes `seg.ks.ptr` exists will read address `undefined`. Extract needs an explicit
   migration pass over the scene's segments, not an assumption.
2. **Heap growth detaches every view — and there is no handler.** `src/wasm/build.sh` passes
   `-s ALLOW_MEMORY_GROWTH=1` with a 32 MB initial heap. Growing a `WebAssembly.Memory`
   detaches the old `ArrayBuffer`, which silently zero-lengths *every* outstanding view onto
   it: all `seg.ks`, and `init_eval_mem()`'s `wv1`/`wv2`/`wks`/`wco`. `native_api.ts` has no
   re-viewing logic, and both guards are written so a detached view is never rebuilt —
   `checkSegment()` skips on `_has_wasm`, `init_eval_mem()` skips on `if (!wv1)`. This is a
   latent bug today because the solver allocates little; it becomes a **blocker** the moment
   scene arrays live in the heap, since that is exactly what will force growth. The fix is
   cheap and should land before stage 4: cache `wasm.HEAPU8.buffer`, and after any allocation
   that could grow it, compare and rebuild every view.
3. **Scattered per-segment allocation.** Each segment gets its own `_malloc(8 * 16)`. Correct,
   but strokers walk a chain linearly, so the 128-byte blocks want to be contiguous. An arena
   per `StrokeScene` (with `ks` slots as indices into it) is the natural fit — an
   optimization, not a prerequisite, but it is easier to adopt at stage 4 than to retrofit.
4. **Curve effects.** `SplineSegment.evaluate()` has a branch that runs `cdata` curve effects
   (multires). It is gated off (`ENABLE_MULTIRES = false`). Carrying `ks` rather than a
   sampled centre line settles this by construction: `ks` cannot express an effect, so the
   wasm path is a no-effects path. If multires is ever revived it needs its own answer —
   most likely extract bakes effects into the sampled boundary and the affected chains fall
   back to JS.
5. **Cacherings.** `evaluateSide` returns from a 512-deep cachering and several call sites
   depend on "copy before the next call". Flat arrays make the hazard vanish, but any
   half-ported state has both conventions live at once.
6. **Float determinism, and what the harness is actually allowed to compare.** JS
   `Math.sin/cos/acos/atan2` are not bit-identical to libm, so comparison is by tolerance —
   but the naive setup measures the wrong thing. `eval_curve` *already* has two
   implementations (`spline_math.ts:99` picks the wasm one when available), so a JS-stroker
   golden captured with `DEBUG.no_native` compared against a C++-stroker result is diffing
   the evaluator and the stroker at once. **Pin the evaluator:** compare JS-stroker-over-wasm-
   eval against C++-stroker-over-wasm-eval. Then any diff is the stroker.

   Note also that `dwidth`/`dshift` divide by `2 × 1e-4`, amplifying any evaluator
   discrepancy by 5,000× before it reaches `dv_out` and the emitted control points. At 1 ulp
   that is harmless; it does mean tolerances must be per-quantity rather than one global
   epsilon, and it is a second argument for replacing the finite differences with analytic
   derivatives once parity is signed off. Worth also diffing rasterized output, since the
   Playwright path already blocks on `complete_viewport_draw()`.
7. **Port the quirks as-is.** 8 fixed bisection iterations over `[0, 0.65]`, the cheap
   cap-crossing overlap test, `r.floor()` on mitre points, the four-side-combinations-tested-
   twice loop. Every "fix" during the port becomes a diff you cannot attribute. Fix them
   after parity, one at a time.
8. **Incrementality stays in JS.** Dirty tracking, path GC and batch membership are stateful
   and adjacent to the DOM. The wasm function stays pure: dirty scene in, outlines out. The
   scene itself is stateful — see §3.
9. **Faces are unresolved scope.** `StrokeScene` above has no faces in it, yet
   `update_polygon` / `update_polygon_color` are ~120 lines of the drawer and share its path,
   z, colour and clip machinery. Faces are also the one place geometry depends on zoom:
   `update_polygon` picks line-vs-cubic on `abs(k) < 0.00001 / zoom`
   (`spline_draw_new.ts:2279`), and clamps segment length to `MAXCURVELEN`. By contrast the
   stroke path samples on arc length alone — `~~(seglen / 55 + 0.5)` clamped to `[7, 16]` at
   line 1328 — so **stroke output is zoom-independent and faces are not.** Either faces stay
   in JS (simplest, and the stroker keeps a clean zoom-free signature), or `zoom` enters the
   scene and every zoom change dirties every face. Decide before stage 4; the plan currently
   assumes the former without saying so.
10. **wasm is main-thread.** The module is instantiated on the main thread, so a wasm stroker
    runs where the JS stroker runs today — no regression, but no free parallelism either. The
    worker pool rasterizes; it does not stroke. Nothing in this plan changes that.

## 6. What to leave alone

- **The batch/worker/opcode layer** (stages 10–12). It already has the plain-data interface
  everything above is trying to acquire. It has three known bugs; all three are fixes, not
  architecture changes, and all three are scheduled in §7.
- **The spiral-curve primitive and the solver.** Already wasm-accelerated with a JS fallback,
  and that pattern is the template stage 6 should copy.

## 7. Batch-layer bugs, scheduled

Three bugs in the layer §6 says to leave alone. None of them require the refactor, none of
them block it, and all three land in stage 0. Each is written as a decision with an order of
operations, because in every case the obvious one-line fix is the wrong move.

### 7.1 `CachedF64Array` caches nothing

Full analysis in §3. Short form: measure `finish()` first; delete `f64array` and both
branches if the allocation does not register; only if it does, do the recycle-plus-explicit-
length fix. Both outcomes close the latent oversized-buffer read in the worker.

### 7.2 Blur batching never fires — and the typo is not why

The `//XXX This is not working` at `vectordraw_canvas2d.ts:1340` sits above a hardcoded
`let needsblur = false;`, with the real test commented out directly above it (1331–1338).
So `isBlurBatch = true` at line 1350 is unreachable, `isBlurBatch` is never true anywhere,
and with it dies: four `if (this.isBlurBatch)` branches in `Batch` (the extra transform push
at 315, its two matching pops at 386 and 422, and `imageSmoothingEnabled` at 502), the
`batch.isBlurBatch ||` term in the split test at 1356, and `dpi_scale`, which never leaves
`1.0`.

What is lost is a real optimization: a heavily blurred path was meant to go into its own
batch rendered at `dpi_scale` 0.1 or 0.25, on the reasoning that a 50px blur does not need
full-resolution input. Instead blurred paths render at full resolution into tiles that
`update_aabb` pads by `blur + 15` (line 627) — so the cost scales with blur radius squared,
in exactly the case the feature existed to make cheap.

Why it "was not working" is legible from the commented-out code: it set `path.redraw = true`
when a path's blur-ness disagreed with its batch, but line 1343 only assigns a batch
`if (!path._batch)`. There is no mechanism to *move* an already-batched path, so a path that
becomes blurred stays where it is. Reviving the feature means adding batch migration; that
is the actual work, and it is why the flag was stubbed rather than fixed.

**Decision, gated on a profile:**

1. Measure. Author a document with a few large-blur materials — `blur > 25`, the old
   `blurlimit` — and compare frame cost against the same document with blur off. `Batch.gen`
   already knows `patharea`; log it per batch alongside the worker round-trip.
2. If large blurs are not measurably expensive, **delete the machinery**: `needsblur`, the
   commented block, `isBlurBatch`, `dpi_scale`, and the four dead branches. Blur itself is
   untouched — it lives in the `SETBLUR` opcode (line 791) and the aabb padding, neither of
   which is involved here.
3. If they are expensive, **implement batch migration first**, as its own change with its own
   test, and only then re-enable `needsblur`. Do not restore the commented-out block as-is;
   it is the version that did not work.

Deletion is the expected outcome, and the honest reason is that nobody has been able to tell
the feature is off.

### 7.3 `clearOutstandingJobs()` — the typo is real and fixing it changes nothing

```ts
clearOutstandingJobs() {
  this.freezelvl = 0;
  this.postMessage(MS.CLEAR_QUEUE, 0);
  this.callback = {};          // meant this.callbacks
  this.msgid_ownerid_map = {};
  this.ownerid_msgid_map = {};
}
```

`callback` is a field that exists only to make this line typecheck — it was added during the
port with a NOTE saying so, and nothing reads it. So `this.callbacks` is never cleared and
grows for the life of the thread. That is the whole effect of the typo: a leak.

It is **not** the reason cancelled render jobs hang, which is the thing worth caring about.
`postRenderJob` returns a promise whose resolver lives in `callbacks[id]`; `onmessage`
(`vectordraw_jobs.ts:171`) returns early without calling it when `msgid_ownerid_map[ownerid]`
is missing — and `clearOutstandingJobs` clears *that* map correctly. So a cancelled job's
promise never settles whether or not the typo is fixed. Dropping a resolver does not reject a
promise; neither does the corrected line.

Downstream, `Batch.gen()` sets `this.pending = true` and clears it in `.then()`, with no
`.catch`. A never-settling promise leaves `pending` stuck true, and `pending` is what the
all-batches-done poll at lines 1142 and 1393 reads — the same signal
`complete_viewport_draw()` blocks on, which is what the Playwright suite waits for. It
self-heals if that batch is later regenerated (line 493 re-posts and gets a fresh promise),
so a cancelled-and-never-regenerated batch is the case that wedges.

**Decision, gated on a repro rather than a profile** — this is a correctness bug, and
measurement is the wrong instrument:

1. Reproduce. Call `cancelAllJobs()` mid-draw and assert that `complete_viewport_draw()`
   still resolves. If it does not, the wedge is real and observable; if it always self-heals
   in practice, the fix is still correct but drops in priority.
2. Fix the settling, not the spelling. `clearOutstandingJobs()` should walk `callbacks` and
   settle each one before clearing the map.
3. Choose resolve-with-sentinel over reject. `Batch.gen()`'s `.then()` has no `.catch`, so
   rejecting turns every cancel into an unhandled rejection; every call site would need a
   handler. Resolving with `undefined` and having `Batch.gen()` skip the blit when there is
   no `ImageBitmap` is the smaller, safer change — at the cost of a nullable in
   `RenderJobCallback`, which is worth it.
4. Then delete the `callback` field. It has no purpose once the line spelling it is gone, and
   leaving it invites the same typo back.

Fixing step 2 without step 1 is acceptable. Fixing only the spelling is not — it silences the
NOTE that is currently the only thing pointing at a live bug.
