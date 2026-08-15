# Draw pipeline refactor

Analysis of the spline → stroke → batch → pixels path, aimed at two goals:

1. **Fewer, clearer layers** between a `Spline` and a rasterized batch.
2. **A stroker that can be lifted into a standalone C++/wasm library** — which means it has
   to become a pure function over flat buffers, with no `Spline`, no `VectorDraw`, and no
   DOM anywhere in it.

Read [rendering.md](../rendering.md) and [stroking.md](../stroking.md) first; this document
assumes both and does not repeat them.

Status: **stages 0 and 1 done; stages 2–6 not started.** Claims have been checked against the
source once; where a claim is a guess rather than a reading, it says so.

What stage 0 measured, and what each gate decided, is written up in
[../research/draw-refactor-stage0-measurements.md](../research/draw-refactor-stage0-measurements.md).
All three §7 gates came out as deletions:

- **§7.1** the retained `Float64Array` in `CachedF64Array` hit 0 times in 1051 calls, because
  its buffer is transferred to the worker. Replaced by `CommandBuffer`.
- **§7.2** blur costs nothing measurable on a real GPU, at any blur radius tried. The 7×
  penalty is a swiftshader artifact. `isBlurBatch`, `Batch.dpi_scale` and the dead
  `needsblur` branch are gone.
- **§7.3** cancelling in-flight jobs orphaned their promises and wedged the drawer. Fixed in
  `Thread.clearOutstandingJobs()` and `cancelRenderJob()`, with the repro kept as
  `playwright/renderjobs.spec.ts`.

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
| 8 | Editing overlay | `draw_spline_overlay()` in `spline_overlay.ts` | 414 |
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

**Done** (stage 4a). `src/curve/path_key.ts` replaces the tag bits with a composed key,
`pathKey(owner, role) = owner * 16 + role`, injective for every owner id rather than only for
ids under 131,072. `PathRole` names the nine roles the drawer actually uses; `NO_PATH` names
the one lookup that is meant to miss (`fastDraw` probes a key no owner can produce, and always
has). 22 call sites in `spline_draw_new.ts`; no tag bit survives.

The change is inert by construction, not just by test: path keys are only ever map keys into
`path_idmap`, and the backend sorts paths by `a.z - b.z` alone (`vectordraw_canvas2d.ts:1296`,
a stable sort), so renaming a path cannot move it in draw order. Confirmed empirically too —
a mechanically reverted build produces byte-identical `pathDump()` output.

**The oracle this needed.** Every later stage renames path keys, so the regression gate had to
be key-independent: `window.__fm.pathDump()` (`debug_api.ts`) forces a full recalc and returns
one row per retained path — `z`, command-count, an FNV hash of the command stream, colour,
blur, hidden, clip count — sorted by `z` then content, never by key. `playwright/path-dump.spec.ts`
holds it against recorded baselines. It has teeth: moving one vertex by (3, −2) changes the
document hash. This is what stage 5's harness grows out of.

### P6 — the editing overlay lives inside the render path

*Fixed in stage 1.* `draw_spline()` was ~40 lines of pipeline plumbing followed by ~250 lines of
handle, vertex and selection drawing straight onto the 2D context. The overlay has no
relationship to the retained pipeline; it was in the same function because that is where `g`
happened to be in scope. It is also where the documented `zoom = 1.0` quirk lives.

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

**Done.** `spline_draw.ts` is gone; its render half became `Spline.draw()` and its overlay half
became `draw_spline_overlay()` in `spline_overlay.ts`. The colour tables, `get_element_color()`,
`redraw_element()` and `draw_curve_normals()` moved with the overlay, and the
`export * from "./spline_draw_sort"` re-export hop was dropped — the five files that used it now
import `redo_draw_sort` from `spline_draw_sort.js` directly.

`Spline.draw()` lost four parameters that only ever fed the overlay (`draw_normals`,
`draw_time_helpers`, `curtime`) or nothing at all (`alpha`). The `zoom` argument it still passes
to `SplineDrawer.update()` is documented as ignored: `update()` overwrites it on its first line
from `matrix.$matrix.m11`. That is what let the `zoom = 1.0` quirk be confined to
`spline_overlay.ts`, where the doc comment now explains that it was `matrix.m11` reading
`undefined` through an `isNaN()` reset, and that correcting it resizes every overlay element at
every zoom level — a change to make on its own.

Two deliberate deviations from the text above:

- **The overlay is called from `FrameSet.draw()`, not from `view2d`.** `view2d` calls
  `frameset.draw()` nine times in its tiled branch, once per tile with a translated matrix;
  hoisting the overlay up a level would have turned nine overlay draws into one. `view2d` does
  call it directly for the pathspline, which has no tiled path.
- **`ExportCanvasImage` had a double `drawer.update()`** — its own, then `draw_spline()`'s.
  Collapsed to one. The second ran with `recalc_all` already cleared by the first, so only the
  first was ever doing the full update the op asks for.

Dead code deleted in passing: the two loops clearing `SplineFlags.DRAW_TEMP` (nothing in `src/`
ever sets that flag), an unused `let r`, a dozen commented-out matrix lines, four unused imports
and two cacherings, and `svg_export.ts`'s import of `draw_spline`, which it never called.

Two pre-existing bugs were preserved with `NOTE:` comments rather than silently fixed: the
`zoom = 1.0` above, and `ExportCanvasImage` handing `drawer.draw()` the *viewport's* context, so
the strokes land in the viewport and the exported PNG gets only the overlay.

Verified: `tsgo --noEmit` clean, `pnpm build` clean, Playwright 18/18. A throwaway spec confirmed
the overlay still paints after the split — 870 px of `element_colormap[UNSELECT]` on Panda.fmo.
No handle pixels, which is correct and not a regression: all 120 of that file's handles have
`use === false`, and the `if (!v.use) continue;` gate is byte-identical to the old code's.

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

**Pre-check done — the stage stands, at this priority.** Full numbers in
`docs/research/draw-refactor-stage2-precheck.md`. On a 60-frame vertex drag over `Panda.fmo` and
`love and thunder.fmo`, on real hardware: `SplineDrawer.update()` is 15–16 ms/frame against a
1.3–1.9 ms worker round-trip at ~2 jobs/frame, so the frame is stroke-bound, not worker-bound.
A prototype per-frame net cache cut update time 3.7–4.9× and roughly halved wall-clock, with
`width()` and `deBoor()` counts unchanged and walks down ~500× (60 504 → 93.9/frame) — the walk
is the redundancy, the evaluation is not, exactly as P2 says. Parity held bit-exact: 7 392
`width()`/`shift` samples per pass across three files, fresh and dragged nets, zero mismatches
under `Object.is`.

Two caveats the pre-check turned up. `cthulu.fmo` (10 segments, ~119 `width()` calls/frame) has
nothing to save and is dominated by `SplineDrawer.draw()` and the worker instead — a document can
be draw-bound rather than stroke-bound, and this stage does nothing for that. And one of the eight
`walk()` calls in `width()` is already dead: the fourth backward walk's `w0b`/`s0b`/`l0b` are
never read and its `seg`/`v` mutation is overwritten two lines later. Free 1/8, fold it in.

**Done**, in `src/curve/width_chain.ts` — but not as written above. **Cache the walk, not the
net.** The prototype the pre-check measured stored knots and control values, and that is not
bit-exact: a segment's arc length is `ks[KSCALE]`, which `eval_curve()` recomputes from the
vertex coordinates *as the drawer evaluates each segment*. At the top of a pass those lengths
are a step behind — freshly deserialized (the file stores float32) or mid-drag, where
`TransSplineVert.apply()` moves vertices and calls `SplineSegment.update()`, which does not
re-solve them. Measured mid-drag on `Panda.fmo`, a knot-caching build was off by ~20 % on
individual knots and ~1.4 % on width, on 3 088 of 46 156 samples. The premise in the file header
— "nothing inside a draw pass mutates a segment length" — was simply false.

So the pass stores only what is genuinely constant for the pass: the topology. Per segment, the
seven walk steps whose value or length the net needs, as a segment slot plus a flag for which end
of it the walk arrived at. `loadWidthNet()` then reads `w1`/`w2`/`shift1`/`shift2`/`linewidth`
and `length` live and assembles the knot vector at call time, in `width()`'s own expression order.
That is bit-identical to the walk by construction, whatever the drawer has done to the geometry so
far — verified at 249 936 samples across three documents in three states (post-load, settled
redraw, mid-drag) with zero mismatches under `Object.is`, and now guarded permanently by
`playwright/width-chain.spec.ts` against `SplineSegment.widthWalk()`, the reference implementation
split out of `width()` for exactly that purpose.

Cheaper than the knot cache predicted, still most of the win. Full-recalc
`SplineDrawer.update()`, cache toggled at runtime in one build: `Panda.fmo` 79.99 → 23.13 ms,
`love and thunder.fmo` 77.24 → 31.41 ms, `cthulu.fmo` 0.59 → 0.47 ms (draw-bound, as predicted).
The dead fourth backward `walk()` is gone. `beginWidthChains()`/`endWidthChains()` bracket
`update()` through a thin wrapper over `updateIntern()` so the pair survives an exception, and
`loadWidthNet()` returns `-1` outside a pass, so picking and tools still walk.

Verified: `tsgo --noEmit` clean, `pnpm build` clean, Playwright 20/20 including the new spec.

### Stage 3 — transient trim state

Replace the `SplineDrawData` cdata layer with per-frame arrays indexed by segment (P4). Keep
the loader so old files still open; stop writing it.

*Buys:* smaller files, no further migration debt, and the trim scratch ends up on the correct
side of the future wasm boundary.

**Done**, in `src/curve/trim_state.ts` — but the arrays are not per-frame, and cannot be.
`updateIntern()` only recomputes the vertices it sees flagged, so a stroke group whose vertices
did not move is drawn from *last* frame's trims; and `spline_createops.ts` reads them outside any
draw pass at all, to build an outline. Only the *serialization* goes away. So `begin()` renumbers
the whole spline at the top of a pass and carries each live segment's twelve doubles and mask
byte across by identity, into a double-buffered pair of flat arrays — which also renumbers around
added and removed segments and hands a brand-new one exactly the untrimmed defaults
(`0, 1, 0, 1`, mask 0) a fresh `CustomDataLayer` had. Cost is one O(segments × 12) copy per pass.
`slotOf()` returns `-1` for a segment made since the last pass, and reads fall back to those same
defaults rather than throwing, so an outline of a stroke that has never been drawn is an outline
of its centre line — which is what the old code did too, by way of a freshly constructed layer.

State is per `Spline`, in a `WeakMap`, not in module globals like `width_chain.ts`: a frameset
draws a drawspline and a pathspline through the same drawer and the two must not share slots.

Keeping the loader is not enough on its own — a file that parses the layer and then re-saves it
carries it forever. `CustomData.remove_layer()` is new, and `Spline.afterSTRUCT()` calls it once
the layer has been read, so `SplineDrawData` survives only as a registered `STRUCT` that old
files parse into and nothing reads. Both sample files do carry it: with the drop disabled, a
re-save of `Panda.fmo` is 88 985 bytes against 83 613 with it (−6.0 %), and `love and thunder.fmo`
2 431 743 against 2 427 955 (−0.16 % — 42 segments in a 2.4 MB document).

Verified the same way stage 2 was, with a temporary parity shadow: an identity-keyed record per
segment, i.e. exactly the storage `SplineDrawData` was, so any disagreement is a slot-arithmetic
bug in `begin()`/`slotOf()`. Zero mismatches under `Object.is` across both files, on a full
recalc and on a partial redraw where one segment is flagged and every other group is read from
what `begin()` carried forward. The shadow is gone; `playwright/trim-state.spec.ts` keeps the
part of it that does not need instrumentation — a partial redraw must report the same trimmed and
mitred counts as a full one, and a loaded pre-stage-3 file must come out with no `drawdata` layer.

`tsgo --noEmit` clean, `pnpm build` clean, Playwright 22/22.

### Stage 4 — `StrokeScene` / `OutlineBuffer` — **done**

Rewrite the stroker as `stroke(scene) -> outlines`: pure, no `VectorDraw`, no `Spline`.
`SplineDrawer` becomes an assembler — extract scene, call stroker, map outlines onto retained
paths, GC, clip wiring, colours, dirty tracking. Replace the tagged-id namespace with an
explicit `(ownerId, role)` key (P5).

*Buys:* the wasm boundary now exists. The stroker becomes unit-testable. The drawer should
land somewhere near 700 lines.

**4a done.** Both prerequisites landed first: §5.2 (heap growth detaching `ks` views) and
§5.9 (faces stay in JS, decided). Then P5, with `pathDump()` as the gate it needed. What is
left is the body: `StrokeScene`, `OutlineBuffer`, the pure stroker, and the drawer's reduction
to an assembler.

**4b done — the scene and the evaluator boundary.**

`src/curve/stroke_scene.ts` is the extract: flat arrays, stable slots, a free list, `eid ->
slot` maps, stamp-based sweep, and the width *walk* (not its knots) rebuilt only when topology
moves. Two things are deliberately never cached — arc length and the net's knot vector — because
`ks[KSCALE]` is rewritten by `eval_curve()` *during* a pass; the scene reads length live through
the `ks` view, which is what preserves width_chain's bit-parity argument by construction.
`playwright/stroke-scene.spec.ts` runs `checkScene()` over the samples, once after a full pass
and again after deleting a segment; disabling `sweepSegs()` makes it fail, so it has teeth.

The evaluator was made pure by refactoring rather than duplicating: `eval_curve_flat(ksPtr, ks,
s, v1x…v2z)` is now the single implementation and `eval_curve(seg, …)` delegates to it, so the
scene path and the `Spline` path cannot drift. `native_api.evalCurvePtr()` is the same call with
coefficients named by address. `src/curve/stroker_eval.ts` holds the scene-side twins of the
`SplineSegment` methods; the methods stay as the reference implementation.

**What the parity spec caught.** `playwright/stroker-eval.spec.ts` compares every twin against
its method over every segment of the samples, bit-for-bit, and it failed on Panda immediately:
`sameKs: false`, `scenePtr: 0`, `segPtr: 5261312`. That is §5.1 exactly — the scene extracted
`ks` before anything had evaluated the segment natively, the first evaluation of the pass then
*replaced* `seg.ks` with a heap view, and the scene spent the rest of the pass reading a plain
array the drawer had already abandoned. Rendering from it was close enough to look right:
endpoints were off by 2e-6 and the middle of the curve by 2.7 units, because the spiral is
normalised through `v1` and `v2`.

The fix is the explicit migration pass the constraint asks for — `patchSeg()` calls
`native_api.checkSegment()` before it captures the view. Heap growth is handled beside it:
addresses survive a move but views do not, so `native_api.onHeapMove()` takes a weakly-held
`HeapViewHolder` and the scene rebuilds its `ksv` from `KSPTR`. `checkScene()` now compares
pointers rather than object identity, and says so when a segment was never migrated.

Two notes from the same investigation. `checkScene()` no longer compares flags: the scene
copies them at extract and the drawer clears them as it consumes them, so agreement is a matter
of how many passes have run — a snapshot, not an invariant. And the parity comparison is
stronger than it first appears, because width chains are inactive outside a pass: the reference
`width()` falls through to `widthWalk()`, so the spec is holding the recorded walk against an
independently written one. Both sample files now match on every quantity — 9,828 comparisons
for the smaller — and widening `sceneDwidth`'s finite-difference step by 1e-4 fails both.

**4c done — the stroker and the outline buffer.** `src/curve/stroker.ts` strokes a group out of
the scene and writes `src/curve/outline_buffer.ts`; `SplineDrawer.update_stroke_group()` is now
assembly — find the group, call `strokeGroup()`, replay the outlines onto retained paths, hang
the colours, the double stroke's `pushStroke` and the clip wiring off them. No `Spline`, no
`VectorDraw` and no `Vector2` cross into the stroker; what comes back is a command stream,
because that is what the paths take and what the trimming produces.

Two outlines share one traversal. The stroke path and the double stroke walk identical geometry
but break it differently — where a tangent break makes the stroke draw a line across, the double
stroke lifts the pen — so each point is recorded once with the opcode each path wants, and the
two streams are flushed from the records afterwards. That is not just tidiness: evaluating a
segment rewrites its arc length and its neighbours' width nets read that, so the traversal has to
evaluate exactly once, in the old order. The same records carry the stroke-debug overlays, which
are emitted as ordinary outlines under `DEBUG_1` and `DEBUG_3` rather than dropped.

`path-dump.spec.ts` is byte-identical on both samples, and perturbing `dfac` by 1e-7 fails both,
so the gate has teeth here too. The overlays got their own baseline (`pathDump(true)` turns the
viewport toggle on for the pass) — recorded after the move, so it locks them going forward
rather than proving this move left them alone. The drawer is at 1,862 lines, down from 2,030;
the junction trimming is what is left between it and the ~700 stage 4 asks for.

**4d done — the trimmer.** `src/curve/trimmer.ts` is `update_vertex_strokes()` and
`update_stroke_points()` over the scene: `trimVertex(scene, trims, v)` bisects the trim distance
until the strokes meeting at a vertex stop crossing, nudges it out by their widths, and sets the
mitre points at a two-valence break. What is left in the drawer is the `FANCY_JOINS` switch, the
three empty debug paths — the trimmer cannot create paths — and the slot lookup. The trim
accessors both sides needed moved to `src/curve/trim_view.ts` (a `{data, mask}` pair and flat
`trimGets`/`trimSetp`/… over it), so `TrimState` is now only what the graph side calls.

The port carries path.ux's arithmetic quirks by hand, because they change results:
`Vector2.dot()` snaps to ±1 within 1e-11, and `normalize()` multiplies by `1.0/l` and gives up
below 1e-8. `line_isect()` and `line_line_cross4()` stayed in `util/mathlib.ts` with their
signatures widened to accept flat coordinates; on the 2D path neither touches anything but slots
0 and 1, so a C++ port takes them along unchanged. Dead locals went (the outer `t0/t1/t2` and the
`Math.random()` NaN log), but every evaluation stayed, including `seg.evaluate(s1a)` whose result
is unused — it refreshes the arc length the next segment's width is read against.

`path-dump.spec.ts` is byte-identical on both samples again, and both halves have teeth: shifting
the mitre point by one unit fails all four baselines, and so does moving the bisection bracket
from 0.65 by 1e-7. The drawer is at 1,544 lines.

**4e done — the join.** `strokeJoin(scene, trims, seg, v, out)` in `stroker.ts` is
`update_vertex_join()`: it walks to the previous segment in the angular order around the vertex,
reads both trimmed boundary points, and emits the wedge between them — a cubic from one to the
other closed back through the vertex, plus the double-stroke cap. `update_vertex_join()` in the
drawer is now assembly only: the retained-path pair, their colours, the dirty check that skips
both, and a loop that plays each outline onto the path its role names.

Joins forced one addition to `OutlineBuffer`. A stroke group's outlines all finish the same way
and the drawer has always known which, but a join chooses between filling the wedge and stroking
it from geometry only the producer can see, so an outline now carries a seventh int, `OutFinish`
(`NONE`/`FILL`/`STROKE`), written by `out.fill()` / `out.stroke()`. The C++ boundary needs that
field regardless; nothing else about the record changed. Two helpers the trimmer and the join
both wanted — `sortSegments()` (the atan2 order around a vertex) and `otherVert()` — moved into
`stroke_scene.ts`, and the Vector2 quirks moved into `src/curve/flat_vec.ts` rather than being
copied a third time.

All four `path-dump` baselines are byte-identical, and the join is load-bearing in two places:
perturbing the tangent scale `0.7` by 1e-7 fails both *love and thunder* baselines, and shifting
the double-stroke cap's first control point by one unit fails them too. Neither touches Panda,
which has no fancy joins. The tight-corner branch — where the cap collapses to a quad across the
corner — is **not** covered by either sample; widening its threshold from `0.2π` to `0.9π`
changes nothing, so it needs a sample of its own before the C++ port relies on it. Full
Playwright 31/31, vitest 6/6. The drawer is at 1,425 lines.

**4f done — P8, the pass prologue.** With the geometry gone the drawer's remaining bulk was
argument plumbing, so P8 got cleared out:

- The y-flip / pan-extraction matrix dance is now `beginPass(matrix, master_g, editor,
  recalc_all)`, called by both `updateIntern()` and `fastDraw()` instead of appearing verbatim in
  each. What the two decide differently — `recalc_all` — comes in as an argument. Both copies also
  carried `m1`/`m2` for an `if` whose body is entirely commented out; that went.
- `zoom` is no longer a parameter of `update()` / `updateIntern()` / `fastDraw()`. All three
  overwrote it from `matrix.$matrix.m11` on the first line, so all three call sites
  (`spline.draw()`, `view2d_ops.ts`, `svg_export.ts`) were passing a value nothing read.
- `update_polygon()` and `update_polygon_color()` take `(f, drawparams)` instead of the ten
  unpacked arguments `DrawParams` was introduced to replace. `DrawParams` gained `ignore_layers`,
  the one field the face colouring needed and did not have.
- `_sortSegments()` is gone — `sortSegments()` in the scene replaced its last caller in 4e.

The six write-only `last_*` fields P8 also listed were already removed in stage 0; the four that
remain (`last_totvert`/`last_totseg`/`last_totface`/`last_selectmode`) are all read, by the
`recalc_all` test. What is left of P8 is the parameter list of `update()` itself, still nine
positional arguments wide because its three callers are outside this file.

`update_normals()` is the last geometry in the drawer that evaluates the spline directly. It is
the `draw_normals` debug overlay, off by default, and the only thing in the tree that wants
`curvatureSide()`, so it stayed on the graph side rather than dragging curvature across the
boundary for a view the renderer never uses.

Playwright 31/31 and vitest 6/6 with all four `path-dump` baselines byte-identical. `fastDraw()`
is the one path none of that covers — it runs only under `window.DEBUG.fastDrawMode` — so its
share of this change was made by matching text, not by test.

**The drawer is at 1,304 lines**, from 2,351 at the start of stage 4. The stage's ~700 was
written before it was clear how much of the file is face handling (§5.9 keeps faces in JS) and
`updateIntern()`'s drawlist walk, neither of which the stroker extraction touches; 1,304 with all
stroke geometry behind a pure boundary is what the stage actually buys.

### Stage 5 — golden-output harness — **done**

Serialize a `StrokeScene` from a handful of `.fmo` files, run the stroker, hash the
`OutlineBuffer`. **This is the parity gate for the port** — a C++ rewrite without it is
unverifiable.

**Done.** `src/curve/stroke_dump.ts` is the format and the hash; `strokeAll()` in `stroker.ts` is
the whole-document entry point; `playwright/stroke-golden.spec.ts` runs both over the samples.

The dump is a header of int32s followed by the scene's own arrays at capacity, slot indices
preserved, so a loader is `slice()` and not a rebuild. Two things are deliberately absent.
`KSPTR` is zeroed, because a live heap address would make two dumps of the same document differ.
Trim state is left out entirely and regenerated: `trimVertex()` writes both endpoints of every
incident segment, `strokeAll()` visits every vertex, so `newTrims()` — untrimmed, unmitred, the
same values `TrimState.begin()` gives a segment it has not seen — is a complete starting state.
That is what makes a run reproducible from the blob alone. The hash is FNV-1a over
little-endian bytes with the constants written out in the file header, so C++ reproduces it
without a shared library, and it is taken over IEEE754 bytes rather than formatted decimals for
the same reason.

A loaded scene gets *real* heap blocks for its coefficients — `native_api.allocKs()` was added
for it, since `heapAlloc` is private and a dump has no `SplineSegment` to migrate — because
§5.6 pins the evaluator: a scene with `KSPTR` zero silently falls through to the JS evaluator
and the comparison would stop being about the stroker.

`strokeAll(scene, trims, debug, out)` is the deterministic whole-document order — trim every
vertex in ascending slot order, stroke every group, then fill the wedge at each segment of a
many-valence vertex. It is **not** what the drawer calls: a frame trims only the vertices an
edit touched and strokes in drawlist order interleaved with the faces, which is what
incrementality costs (§5.8). So the harness compares JS-over-live-scene against
JS-over-loaded-scene, both through `strokeAll()`, and records `strokeAll()`'s own digest as the
baseline. The dump is taken before either run, because evaluating a segment rewrites
`ks[KSCALE]` and a dump of a stroked scene is a dump of different numbers.

Panda strokes 60 segments in 16 groups to 32 outlines and 9,284 points; *love and thunder*, 42
segments in 11 groups to 46 outlines and 7,470 points. The role mix is the useful part: Panda is
`ELEMENT`/`DOUBLE_STROKE` only, while *love and thunder* covers all four join roles and all
three `OutFinish` modes, so the two samples together exercise every emission path except the
tight-corner fallback stage 4e already flagged as uncovered. Scene size (19,040 and 18,648
bytes) is logged but kept out of the baseline — it follows array *capacity*, so it would report
a diff for a growth that changed no geometry.

Three assertions, and a negative control apiece proving they are independent:

| Control | Caught by |
|---|---|
| one loaded coefficient off by 1e-9 | the byte-exact round trip, before anything strokes |
| `netV1` dropped from the dump | the row comparison — the round trip still passes, since both dumps agree |
| `strokeAll()` one group short | the recorded baselines — both digests still agree with each other |

Full Playwright 33/33 and vitest 6/6. What stage 6 gets from this is a self-contained test case:
hand a rewrite the blob and the number, with no `Spline`, no `VectorDraw` and no DOM in the way.

### Stage 6 — the C++ port — *in progress*

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

#### 6a — the geometry layer, and a harness that can build without emscripten — **done**

The port is being built bottom-up, in the order stage 4 was: geometry first, then the outline
builder, then the trimmer, then the join. 6a is the geometry — `src/curve/stroker_eval.ts`
as `src/wasm/stroker_eval.h`, over `src/wasm/stroke_scene.h`, which reads stage 5's blob.

**There is no emscripten SDK on this machine** (`emcc` is absent and `$WASM_EMSDK` is empty),
so `src/wasm/build.sh` cannot run here and the port cannot yet be wired into the app. That
does not block writing it, because what the port needs to be held to is arithmetic, and a host
compiler can check arithmetic. `src/wasm/tests/build.sh` builds `src/wasm/tests/eval_ref.cc`
with a plain `g++` and runs it over recorded artifacts. Getting emscripten installed is what
stands between 6a and shipping this code; everything below is true without it.

The comparison, and why it needs a second dump format. Stage 5's digest is a hash, which is
the right gate at the end of the pipeline and useless in the middle of one: it cannot say
*where*, and §5.6 forbids comparing two libms bit for bit anyway. So `stroke_eval_ref.ts`
records every quantity the geometry layer produces — evaluate, derivative, curvature, length,
width, shift, the two finite differences, and both sides of `evaluateSide` with all four of its
out-params — at eleven parameter values on every live segment, and `eval_ref.cc` recomputes
them and subtracts. `playwright/stroke-artifacts.spec.ts` writes the pair
(`<name>.scene`, `<name>.evalref`) under `playwright/artifacts/`; both are committed, so the
C++ side builds and runs in a plain checkout with no browser in the loop.

Three things make that comparable rather than merely dumped. **Call order is part of the
answer** — every evaluation rewrites `ks[KSCALE]`, which is the arc length the width nets read,
so both sides walk live slots ascending, samples in order, fields in call order, and make the
same redundant calls. **Segments with no width net are marked, not skipped**: the reference
records the evaluator fields for them and leaves the rest zero, because the width walk would
run off the end of the arrays. And **tolerance is per field group**: 1e-9 for everything except
the quantities carrying a centred difference over 2e-4 — `dwidth`, `dshift`, and the
`evaluateSide` outputs built from them — which get 1e-6.

What it actually measures: 60 segments × 11 samples for Panda, 42 × 11 for love and thunder,
and the worst disagreement anywhere is **3.5e-14** (`derivative.y`), with coordinates at 2e-16
and the finite differences at 4e-12. That is libm noise — five orders below the tolerance —
which is what "the port is correct" looks like when the same `eval_curve` is on both sides of
it but not the same build of it. Compile with `-ffp-contract=off`: an fma the recording's
compiler did not emit is a difference in arithmetic, not in libm, and gcc contracts by default.

Two quirks are carried deliberately, both from §5.7. `wasm_main.cc:evalCurve()` copies the
endpoints into `float` and zeroes z, so the port does too — the recorded numbers were produced
from those coordinates and no others. And `native_api.evalCurvePtr()` passes six arguments to a
seven-argument function, so the flag JS calls `angle_only` lands in C++'s `angle_only` and
C++'s `no_update` is always zero; the port hardcodes `false` there rather than plumbing a flag
that cannot be set.

Negative controls, each caught by the field it should be:

| Control | Caught by |
|---|---|
| one width-net control point scaled by 1 + 1e-9 | `width`, `side*.lw`, and both normals — on love and thunder; on Panda it lands exactly *at* the 1e-9 threshold, which is where the tolerance was aimed |
| `evaluate()`'s endpoint nudge dropped | `evaluate.*` and both sides' `co`, at 5e-9 to 8e-7 |
| endpoints perturbed by 1e-7 — the scale the float downcast itself operates at | everything, up to 7e-5 on `derivative.*` |

Coverage gap worth recording: **`shift` is zero everywhere in both sample files**, so
`sceneShift`/`sceneDshift` are exercised but never with a value. The shift terms in
`evaluateSide` (`dlw * shift`, `lw + lw * shift`) are therefore only checked in their
`shift == 0` form. A sample document with a shifted stroke would close it — the same kind of
gap as the tight-corner join left by stage 5.

#### 6b — the outline buffer — **done**

`src/curve/outline_buffer.ts` as `src/wasm/outline_buffer.h`, plus `src/wasm/outline_hash.h`,
the C++ twin of `hashOutlines`. No curve arithmetic in either, so this one is pinned **exactly**
rather than by tolerance — which is the whole reason it is a separate step. It is the only
piece of stage 6 where a byte-for-byte comparison is legitimate, and a byte-for-byte comparison
of a command stream catches things a geometry tolerance never would: an off-by-one in a point
count, a `finish` written to the wrong outline, a growth policy that reallocs at a different
size and reorders nothing but happens to hide an overrun.

The growth policy is copied deliberately (256, then doubling) even though nothing external can
observe it, so that a length mismatch between the two sides is a real disagreement about
content and not a difference between two allocators.

The pin is a scripted workload rather than a recorded artifact: an LCG
(`state = state * 1103515245 + 12345`, masked to 31 bits) drives 200 outlines through
`begin`/`moveTo`/`lineTo`/`cubicTo`/`fill`/`stroke`, and both sides must reach the same digest.
`tests/outline_buffer.test.ts` is the JS half, `src/wasm/tests/outline_buffer.cc` the C++ half,
and the constant they meet at is **`count 200, cmds 422, pts 1436, hash 828189321`**. They
agreed on the first run. Two details make that meaningful: 200 outlines rather than 100,
because at 100 the `cmds` array never outgrows its initial 256 and the growth path goes
untested; and every coordinate is drawn into a local before the call in the C++, because
argument evaluation order is unspecified there and left to right in JS.

`hashOutlines` had to move out of `stroke_dump.ts` into `src/curve/outline_hash.ts` to make the
JS half runnable at all — importing it dragged in `native_api` → `load_wasm` → the electron
platform shim, which is fine in a browser and fatal under vitest.

Negative controls, each a one-line mutation compiled as a throwaway copy:

| Control | Digest |
|---|---|
| (reference) | 828189321 |
| `role = i % 9` → `i % 8` | 1638732656 |
| coordinate divisor `8.0` → `8.0000000001` | 1400234420 |
| `outline_stroke` → `outline_fill` | 2375237509 |

#### 6c — the trimmer — **done**

`src/curve/trimmer.ts` as `src/wasm/trimmer.h`, over two new headers it needs —
`src/wasm/trim_view.h` (the twelve-doubles-and-a-mask-byte layout) and `src/wasm/flat_vec.h`
(path.ux's `Vector2` quirks: `dot()` snapping within 1e-11 of ±1, `normalize()` multiplying by
a reciprocal and giving up below 1e-8). `scene_sort_segments()` and `scene_other_vert()` join
`stroke_scene.h`; the sort is `std::stable_sort`, because the JS is `Array#sort` and V8's is
TimSort, and two segments leaving a vertex at the same angle decide which one is `prev` in the
mitre solve.

The third dump format, `src/curve/trim_ref.ts` (`<name>.trimref`), and the same shape as the
second: run the pass over a scene loaded from the blob, in an order written down rather than
inherited — live vertex slots ascending, one `trimVertex()` each — and write out the arrays.
That order is not what a frame does, and that is the point; a frame trims only the vertices an
edit touched. It matters twice here, because trimming evaluates segments and evaluating a
segment rewrites the arc length its neighbours' widths are read against. Note that
`strokeArtifacts()` now calls `loadScene(dump)` separately for each reference for the same
reason.

Two comparisons, because there are two kinds of output. **The mask is exact** — it is a set of
decisions, whether a join got a mitre at all, and a port that mitres a corner the JS left plain
has a bug rather than a rounding difference. **The doubles get a tolerance**, 1e-9, the same
libm gap 6a explains arriving through `sceneEvalSide`.

Both amplify, which is why the reader reports a count of differing slots and not only a
worst case. The bisection is a discontinuity: `a` and `b` are exact binary fractions of 0.65
and stay bit-identical as long as every crossing test answers the same way, so a trim value off
by 0.0025 is one flipped decision eight halvings up, not accumulated rounding. And the mitre
points are floored, so a crossing landing within an ulp of a whole number can differ by a full
1.0.

Result: **masks exact on every slot of both samples** (60 for Panda, 42 for love and thunder,
over 61 and 44 trimmed vertices), mitre points bit-identical, and the largest disagreement
anywhere is **4.3e-19** in one trim value.

Negative controls:

| Control | Caught by |
|---|---|
| bisection bracket `0.65` → `0.6499999` | all four trim values, 18 slots over at 6.9e-8 |
| mitre point not floored | all eight point coordinates, 11 slots over at up to 1.5e-3 |
| shallow-join threshold `π*0.3` → `π*0.6` | the mask (11 and 20 slots), and every double row |
| shallow-join threshold `π*0.3` → `π*0.05` | the mask (6 and 2 slots), and every double row |

Two things the controls taught. `π*0.3` → `π*0.29` passes on both samples: no join in either
document has outer edges diverging into that narrow band, so the threshold is pinned by where
the decisions actually sit rather than by an arbitrary nudge. And `side2 = k / 2` →
`(k / 2) % 2` also passes — not a weak test but a genuine no-op, since `side` is used as
`side ? 1 : -1` and the eight `(side1, side2)` pairs cover the same four combinations either
way. The JS `~~(k / 2)` really does run to 3.

#### 6d — the stroker — **done**

`src/curve/stroker.ts` as `src/wasm/stroker.h`. A header rather than the `.cc` the stage names
because the harness compiles one translation unit per test; `src/wasm/stroker.cc` stays the
emscripten entry point that includes this. It brings over the record buffer (ten doubles and
four bytes per record, growing 256-then-doubling as the JS does), the two-pass group walk, the
break and far-side-break paths, the cubic sampler, and the join solve.

Two ports where the transcription had to be careful. `record()` returns a `double *` and not an
index, so the out-of-memory path can hand back a scratch row without advancing the count — the
JS gets this for free by writing into an array that simply grew. And `bez4`/`dbez4` keep the
JS's operator grouping verbatim: `3.0 * (s - 1.0) ** 2 * k2` is `(3 * (s-1)^2) * k2`, not
`((3 * (s-1)) * (s-1)) * k2`, and although the two agree for every `s` this code passes — 0,
0.5 and 1, where both forms are exact — writing the second would be a difference waiting for
the first sampler that isn't on those points.

The fourth and last dump format, `src/curve/outline_ref.ts` (`<name>.outref`): run `strokeAll()`
over a scene loaded from the blob and write the `OutlineBuffer` out whole. Recorded with the
debug overlays **on** — they only append outlines, so they are a strict superset of the plain
output, and they reach `dline()`, whose unguarded division nothing else in the harness runs.

Stage 5 already hashes outlines, and that hash is the wrong gate here: it is exact, and §5.6
forbids comparing two libms bit for bit, so folding coordinates into a digest can only ever say
"different". This splits the two. **The table and the command stream are structure** — which
outline, in which role, how many commands, which opcodes, what finish — and are compared
exactly, because a port emitting a lineTo where the JS emitted a cubic has a bug. **The points
are measurements** and get 1e-9. The reader stops at the first structural disagreement: once
two command streams are out of step, every later index is noise.

Result, first run, both samples:

| Sample | Outlines | Commands | Points | Worst point |
|---|---|---|---|---|
| Panda | 80 | 17284 | 40504 | 4.4e-16 |
| love and thunder | 79 | 13597 | 31890 | 3.4e-16 |

Table and command stream exact on both.

Negative controls, and the three of seven that did **not** fire, each for a reason worth
writing down:

| Control | Caught by |
|---|---|
| `dfac = ds / 3.0` → `3.0000001` | 1.5e-7 over 671 points (l&t), 1.0e-9 over 27 (Panda) |
| join `scl = 0.7` → `0.70001` | 1.3e-6 over 72 points — **love and thunder only** |
| debug marker size `4` → `5` | 2.6e-1 over 6260 points (l&t), 1.1e-3 over 8020 (Panda) |
| `steps` clamp `16` → `15` | nothing |
| tight-corner threshold `π*0.2` → `π*0.4` | nothing |
| tight-corner threshold `π*0.2` → `π*0.02` | nothing |
| dropping `lastdvsx = lastdvsy = 0.0` in the break branch | nothing |

Instrumenting the same build with counters turns those inferences into measurements:

| | `steps` max | joins | tight corners | breaks | far-side breaks |
|---|---|---|---|---|---|
| Panda | 7 | 0 | 0 | 32 | 2 |
| love and thunder | 13 | 12 | 0 | 28 | 6 |

So: the `steps` clamp at 16 is unreachable in both documents — a segment would need to be
roughly 850 units long to ask for it, and the longest here asks for 13, with Panda never leaving
the floor of 7. `stroke_join()` never runs on Panda at all, which is why the `scl` control is a
one-sample control: Panda has no vertex of valence greater than two. And the tight-corner
quadratic fallback is dead in **both** samples in either direction, because `len1 * 0.25 > lw2`
short-circuits true every time and the angle is never consulted — the same gap stage 5 recorded,
now confirmed at the C++ level rather than inferred.

The seventh is not a coverage gap but dead code, in the JS as much as the port:
`lastdvsx`/`lastdvsy` are reassigned at the top of every iteration of the inner loop before
anything reads them, so zeroing them in the break branch cannot be observed. It is transcribed
anyway, under §5.7.

#### 6e — the same harness, through emscripten — **done**

`src/wasm/tests/build.sh` now builds all four programs twice: once with the host compiler and
once with `emcc`, run under node. The wasm pass is skipped with a note, not a failure, when
`emcc` is neither on PATH nor under `$WASM_EMSDK`, because the point of the native pass is that
a plain checkout can still run it.

This is worth doing before any app wiring, and it is not the same test. A host compiler proves
the transcription; only `emcc` proves the thing that will actually run, on the toolchain and
target that ship. Two practical traps on the way in, both of which make the harness pass in
silence rather than fail: `-o foo.mjs` makes emscripten emit a module *factory*, so `main()`
never runs, and the repo's `"type": "module"` makes node read the CommonJS glue as ESM — so the
output is `.js` into a directory carrying its own `{"type": "commonjs"}`.

**The result is stronger than the native pass, and this is the headline: through emscripten the
trimmer and the stroker match the recording bit for bit.** Not within tolerance — zero, over
40,504 and 31,890 doubles, and over every trim value that was 4.3e-19 under mingw. It holds at
`-O3 -flto` as well as at `-O0`, and without `-ffp-contract=off`, which is what you would expect
on a target with no scalar fma to contract into.

The reason is that §5.6's tolerance exists to compare two libms, and through emscripten there is
only one. The recording's geometry did not come from V8 — §5.6 pins the evaluator, so it came
out of `_built_wasm.wasm`. Compiling the same source with the same toolchain reproduces it
exactly.

What survives is a residue in the geometry probe alone, and it localises cleanly. Under `emcc`
`evaluate`, `co`, `curvature`, `length`, `dwidth` and `dlw` are all exact; what still differs —
by about one ulp, an order of magnitude tighter than the host pass — is `derivative`, and `n`
and `dv`, which are computed from it. The one operation under all three that nothing else
touches is `sceneDerivative`'s `Math.sin`/`Math.cos` pair: `sceneEvaluate` goes through the wasm
evaluator, and `sceneCurvature` is a JS polynomial with no transcendental in it, and both come
out exact. So `eval_ref` keeps its tolerance.

That the stroker is nonetheless exact while consuming those same normals is consistent with
where they land: `sceneEvalSide` adds the normal to the centre-line point as a small correction
to a much larger coordinate, and a one-ulp difference in `dv` is absorbed in the add. Stated as
the likely reading rather than a measured one — it is not load-bearing, since the stroker's
exactness is measured directly.

**What this changes downstream.** §5.6 says the port can only be compared to a tolerance, and
for a host-compiled harness that stays true. For the shipped path it is now too weak: the wasm
stroker should reproduce the JS stroker exactly, which means **stage 5's golden digest — the
exact one — can gate `config.USE_WASM`** rather than needing a tolerant twin. That is the gate
6f should use, and any drift from it is a bug and not a rounding difference.

Negative control on the harness itself, since a two-pass runner that reports nothing is
indistinguishable from one that passes: perturbing a single recorded point by 1e-3 is caught by
both passes (`1 of 31890 over`) and `build.sh` exits 1.

**And the recordings are now reproducible, which they were not.** Re-recording produced a
`.scene` that differed from the committed one while `.evalref` was byte-identical — geometry
stable, blob not. It was one bit, `REDRAW` (1 << 23), on 111 of Panda's vertices and 86 of love
and thunder's, and it moved in both directions between runs. That is 4b's note about flags being
a snapshot rather than an invariant, showing up in a recording: the drawer clears them as it
consumes them, so what a dump captures is how far the pass had got. Nothing downstream reads
them — the stroker's flags are `BREAK_TANGENTS` and `COINCIDENT` — so `dumpScene()` now scrubs
`REDRAW` and `REDRAW_PRE` on the way out, beside the loop that already zeroes `KSPTR` for the
same kind of reason. Two consecutive recordings are now byte-identical across all eight files.

Worth being blunt about why that mattered rather than being tidiness: every gate in stage 6 is a
comparison against a recording, and a recording that changes on its own has no teeth. It also
puts a permanent diff in front of anyone who runs the spec, which is how a real change gets
waved through.

#### 6f — the entry point and the wiring — *next*

`src/wasm/stroker.cc` as the emscripten entry point, into the module `../build.sh` already
builds, and the JS side behind `config.USE_WASM` at the three call sites the drawer uses —
`trimVertex()`, `strokeGroup()` and `strokeJoin()`, not `strokeAll()`, which only the harnesses
call.

Two things this needs that are not yet in place. `../build.sh` still writes `built_wasm.js`,
which the TypeScript port renamed to `built_wasm.ts` (generated glue, `@ts-nocheck`, with a
hand-written header); it has not been run since. And the scene is only *partly* heap-resident
today — §5.1 relocates `ks` and nothing else, so `StrokeScene`'s flat arrays, the `TrimView` and
the `OutlineBuffer` all still have to move behind the boundary before C++ can read them at the
addresses it expects. Gate it on the stage-5 digest, per 6e.

## 5. Constraints the port has to respect

1. **`checkSegment()` coverage is conditional.** `ks` is only relocated into the heap by
   `evalCurve()` — gated on `native_api.isReady() && !(DEBUG.no_native || DEBUG.no_nativeEval)`
   (`spline_math.ts:99`) — and by the solve writer (`native_api.ts:703`). A segment that has
   never been natively evaluated or solved still holds a plain JS array, and a stroker that
   assumes `seg.ks.ptr` exists will read address `undefined`. Extract needs an explicit
   migration pass over the scene's segments, not an assumption.

   **Done** (stage 4b), in `stroke_scene.patchSeg()`. Worth recording that this was not a
   theoretical risk: the first run of `playwright/stroker-eval.spec.ts` failed on it, with the
   scene holding a pre-migration `ks` and `KSPTR` of 0. See the stage 4 notes.
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

   **Done**, in `native_api.ts`. `checkHeap()` compares the buffer's identity, and every route
   that can grow the heap ends in it: `heapAlloc()` (all three `_malloc` sites) and every call
   into wasm, since C++ allocates on its own during `_gotMessage` and `_evalCurve`. Re-viewing
   is eager, not lazy, because `seg.ks[KSCALE]` is read all over the drawer without anything
   calling in here first. Live segments are tracked in a `Set<WeakRef<SplineSegment>>` — weak
   so a spline dropped without `on_destroy()` is not held alive by the registry, and pruned on
   the next growth. `playwright/wasm-heap.spec.ts` allocates 64 MB past the 32 MB initial heap
   and checks every segment's `ks` afterwards; with the re-view line commented out it reports
   60 of 60 detached, so the check has teeth.
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
   scene and every zoom change dirties every face.

   **Decided: faces stay in JS**, on the assembler side, and `StrokeScene` keeps no faces and
   no zoom. The alternative buys nothing — faces are 120 lines of polygon emission with no
   offset-curve geometry in them, so porting them later would not reuse a line of the stroker
   — and it would cost the stroker its zoom-free signature, which is what makes its output
   cacheable and its golden harness (stage 5) meaningful.
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
