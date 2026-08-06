# Rendering

How a spline gets from its control points onto the screen.

The short version: the viewport asks a `Spline` to draw itself; the spline turns its
elements into a list of retained **paths** (`SplineDrawer`); the paths are grouped into
batches, serialized to flat number streams, and rasterized by **web workers** into
`ImageBitmap`s; the bitmaps are blitted back onto the viewport canvas. Editing overlays
(handles, vertices, selection outlines) skip all of that and are drawn straight to the
canvas 2D context every frame.

## Pipeline at a glance

| Stage | Code |
|---|---|
| Schedule a repaint | `window.redraw_viewport()` — `src/core/startup/redraw_globals.ts` |
| Viewport frame | `View2DHandler.do_draw_viewport()` — `src/editors/viewport/view2d.ts` |
| Pick a backend, draw the frameset | `FrameSet.draw()` — `src/core/frameset.ts` |
| Solve, then draw the spline | `Spline.draw()` — `src/curve/spline.ts` |
| Draw sort + drawer update + overlay | `draw_spline()` — `src/curve/spline_draw.ts` |
| Build the retained path list | `SplineDrawer.update()` — `src/curve/spline_draw_new.ts` |
| Batch, serialize, dispatch | `CanvasDraw2D` — `src/vectordraw/vectordraw_canvas2d.ts` |
| Rasterize off-thread | `src/vectordraw/vectordraw_canvas2d_worker.ts` |

## 1. Scheduling

`src/core/startup/redraw_globals.ts` owns repaint scheduling. `window.redraw_viewport()`
coalesces any number of calls in a frame into a single `requestAnimationFrame`, and returns
a shared promise that resolves when that frame has been drawn. While `window._block_drawing
> 0` it reschedules itself instead of drawing — that is how modal tools and file loads
suppress intermediate frames.

When the frame fires it walks every screen area and calls `do_draw_viewport` on any area
that has one, so multiple viewports repaint together.

Related helpers in the same file:

- `force_viewport_redraw()` — bypasses coalescing.
- `push_solve()` / `pop_solve()` — bracket code that must not trigger a dependency solve.
- `complete_viewport_draw()` — a debug/test entry point that replaces both drawers with
  fresh `_SplineDrawer`s and spins (up to 100 tries) until all draw jobs are done. This is
  what Playwright screenshots wait on.

## 2. The viewport frame

`View2DHandler.do_draw_viewport(redraw_rects = [])` in `src/editors/viewport/view2d.ts`:

1. Bails immediately if a previous frame's promise (`this._draw_promise`) is outstanding.
2. Runs the eventdag `onDrawPre` step.
3. Picks canvases. The viewport is **double buffered**: there are two foreground canvases
   (`fg`, `fg2`, z-index −2) and two background canvases (`bg`, `bg2`, z-index −3), and
   `_flip` alternates between them. Canvases are created by
   `Editor.getCanvas(id, zindex, patch_canvas2d_matrix, dpi_scale)` in
   `src/editors/editor_base.ts`, which prepends them into the editor's shadow root and
   sizes them to `size * dpi * dpi_scale`.
4. Composes the draw matrix in `genMatrix()`: the dpi scale, then `this.rendermat`, then a
   premultiplied y-flip about `g.canvas.height` — canvas 2D is y-down, the spline is y-up.
5. Clears both canvases, draws the background image or video frame into the bg context.
6. Calls `this.ctx.frameset.draw(ctx, g, this, matrix, redraw_rects, this.edit_all_layers)`
   and stores the returned promise.
7. Afterwards draws animation paths (`vdata.draw`, `pathspline.draw`), drawline groups,
   restores the 2D transform via `g.setTransform(...)`, and renders widgets/manipulators
   with `this.widgets.render(canvas, g)`.

`drawWebgl()` exists but only scissors and clears — the vector viewport does not use WebGL
(see [Not part of this path](#not-part-of-this-path)).

### Tiled mode

`editor.draw_tiled` queues a 3×3 grid of matrices offset by `tileoff = 500` and draws the
spline once per tile, so a repeating pattern can be previewed. Tiled mode forces the
synchronous backend (below) because nine worker round-trips per frame is not worth it.

## 3. Backend selection

`FrameSet.draw()` in `src/core/frameset.ts` decides which vectordraw backend the spline's
`SplineDrawer` wraps:

```ts
let cls = editor.draw_tiled ? SimpleCanvasDraw2D : Canvas;
if (this.spline.drawer === undefined) {
  this.spline.drawer = new SplineDrawer(this.spline, new cls());
} else if (this.spline.drawer.drawer.constructor !== cls) {
  this.spline.drawer.setDrawer(new cls());
}
```

`setDrawer()` drops every retained path and forces a full rebuild, so switching backends is
not free but is correct.

Then `Spline.draw()` (`src/curve/spline.ts`) sets `this.canvas = g`, calls `checkSolve()`
— which kicks off the async constraint solve, guarded by a 1000 ms timeout, and queues
another redraw when it finishes — and delegates to `draw_spline()`.

## 4. Draw sort

`redo_draw_sort(spline)` in `src/curve/spline_draw_sort.ts` runs whenever
`RecalcFlags.DRAWSORT` is set. It produces `spline.drawlist` (what to draw, in order) and
`spline.draw_layerlist` (the owning layer id of each entry).

The sort key is `layer.order * (max_z - min_z) + (z - min_z)` — layer order dominates,
element z breaks ties within a layer. Two special cases:

- A segment that borders a face is pushed to `max(face z) + 1` over every face it touches,
  so **strokes always draw above their own fills**.
- Segments of a stroke group all sort by the group's highest z, so a group never splits
  across another element.

Within a layer, `sort_layer_segments()` walks chains through 2-valence vertices depth-first
so connected runs come out contiguous, stamping `seg.topoid` as it goes.

Finally the list is rewritten: each run of segments is replaced by its `SplineStrokeGroup`,
and any vertex of valence > 2 touched by those segments is inserted as its own entry (it
needs a join wedge drawn). So the draw list is a union:

```ts
export type DrawListItem = SplineVertex | SplineSegment | SplineFace | SplineStrokeGroup;
```

Each item gets `finalz = i`, its index in the final list.

Animation-path splines (`spline.is_anim_path`) skip the z sort entirely — they have no
faces.

### Stroke groups

A `SplineStrokeGroup` (`src/curve/spline_strokegroup.ts`) is a run of segments chained
through 2-valence vertices that share a material and a layer, stroked as **one closed
outline** rather than one outline per segment. That is what makes a long stroke look like a
single brush mark instead of a chain of overlapping capsules.

`vertexIsSplit(spline, v, segments)` decides where a group has to break, and returns a
reason code (1–9) rather than a bare boolean, which is useful when debugging why a stroke
split: visibility, stroke color, mask-to-face, blur, fill-over-stroke, `linewidth2`,
`strokecolor2`, opacity, or no common layer.

Groups are hashed from their member eids, so a rebuild that produces the same membership
reuses the same object (and therefore its cached paths).

## 5. Building the paths — `SplineDrawer`

`src/curve/spline_draw_new.ts` is the heart of the system. `SplineDrawer.update()` walks
the draw list and emits retained paths into the backend, reusing paths whose input has not
changed.

### Stroke outlines

Stroke geometry comes from `SplineSegment.evaluateSide(s, side)` in
`src/curve/spline_types.ts`, which offsets the centre line by half the local width along
the normal:

```ts
let sidesign = side ? 1.0 : -1.0;
let shift = this.shift(s)*sidesign, dshift = this.dshift(s)*sidesign;
let lw = this.width(s)*sidesign,    dlw   = this.dwidth(s)*sidesign;
dlw = dlw*shift + dlw + dshift*lw;  lw = lw + lw*shift;
let dx = -dv[1]*lw*0.5/this.length, dy = dv[0]*lw*0.5/this.length;
```

The derivative output is curvature-corrected (`k = -seglen * curvature(s)`), which is what
lets the outline be emitted as cubics instead of dense polylines.

`update_stroke_group()` samples both sides — a forward pass down side 0 and a reverse pass
back up side 1 — into a single closed path. Sample count is
`clamp(~~(seglen/55 + 0.5), 7, 16)` per segment, and consecutive samples are joined with
`path.cubicTo(lastp + lastdvs, p - dvs, p)` where `dfac = ds/3`.

Each group emits up to two paths: the fill at the group's z (`id = g.id`), and, when
`mat.linewidth2 > 0`, an outline-of-the-outline at z+1 (`id = g.id | (1<<20)`, marked
`noAutoFill()`) pushed with `pushStroke(mat.strokecolor2, mat.linewidth2)`.

### Joints

Where strokes meet, their outlines overlap. `update_vertex_strokes(v)` trims every stroke
meeting at `v` back far enough that none of them overlaps another, by **bisecting on the
trim distance** until the outlines stop intersecting.

Trim parameters live in a per-segment custom data layer, `SplineDrawData` (a
`CustomDataLayer` registered as `"drawdata"`): `start1/end1/start2/end2` per side, plus
explicit mitre points `sp1/sp2/ep1/ep2` and a `mask` of which of those are valid.

`update_stroke_points(v)` computes the mitre endpoints for vertices flagged
`BREAK_TANGENTS` or of valence > 2. `update_vertex_join(seg, v)` then fills the remaining
wedge between the segment's two stroke sides.

Set `window.FANCY_JOINS = false` to disable all of this and get plain untrimmed overlaps —
a useful bisection when a joint looks wrong.

### Faces

`update_polygon()` builds a face outline at 6 samples per segment, emitting `lineTo` when
the segment is effectively straight (`abs(k) < 0.00001/zoom`) and `cubicTo` otherwise.
`update_polygon_color()` picks the fill: the active face tints toward `(200, 80, 50)`,
selected faces toward `(250, 140, 50)`, otherwise `f.mat.fillcolor`. Faces are hidden
wholesale via `path.hidden = !this.draw_faces` rather than being rebuilt.

Materials flagged `MaterialFlags.MASK_TO_FACE` get their strokes clipped to the face by
`addClipPathsToStrokeGroup()`.

### Incremental update and path GC

`update()` recomputes only what changed:

- `zoom` comes from `matrix.$matrix.m11`; pan is extracted out of the matrix into
  `drawer.pan` (and zeroed in the matrix) so a pure pan does not invalidate geometry.
- A full rebuild (`recalc_all`) is triggered by a change to `draw_faces`, `do_blur`,
  `only_render`, or `selectmode`, or by any change in vertex/segment/face counts.
- Otherwise it collects the vertices of every segment flagged `REDRAW` or `UPDATE` into a
  set, re-runs joint trimming for those vertices only, and rebuilds just the affected
  draw-list items.
- Paths that were not touched this pass are garbage collected:

```ts
for (let k in this.drawer.path_idmap) {
  if (!(k in this.used_paths)) { this.drawer.remove(this.drawer.path_idmap[k]); }
}
```

Because path ids are derived from element ids plus bit tags (`1<<17`…`1<<20` for joins and
secondary strokes, `+50000`/`+60002` for debug paths), the same element maps to the same
path across frames and gets updated in place.

`DrawParams` bundles the per-frame arguments (redraw rects, active layer, `only_render`,
selectmode, zoom, …) and is recycled through a 16-deep cachering.

### Fast draw

`window.DEBUG.fastDrawMode` switches `update()` to `fastDraw()`: 5-sample polylines, no
joins, no faces. Useful for isolating whether a performance problem is geometry generation
or rasterization.

## 6. Editing overlay

Everything above produces *rendered* output. The editing overlay is separate: after
`SplineDrawer.draw()`, and only when `!only_render`, `draw_spline()` in
`src/curve/spline_draw.ts` draws directly onto the 2D context each frame:

- Segment outlines when `selectmode & SelMask.SEGMENT` — both sides sampled with
  `evaluateSide`.
- Handles when `selectmode & SelMask.HANDLE` — size `vert_size * dpi_scale / zoom`, plus a
  line back to `owning_segment.handle_vertex(v)`.
- Vertices when `selectmode & SelMask.VERTEX`, with a `#33ffaa` box marking time helpers.
- The proportional-edit falloff circle.

Colors come from a flattened lookup table built at module load: `ColorFlags`
(`SELECT 1`, `ACTIVE 2`, `HIGHLIGHT 4`) index the 8 `ColorStates`, flattened into
`element_colormap` and `handle_colormap`. `VERT_SIZE = 3.0`, `SMALL_VERT_SIZE = 1.0`.

This pass is why the overlay is always crisp and never lags the cursor — it never goes near
a worker.

## 7. The vectordraw layer

`src/vectordraw/` is a retained-mode drawing abstraction, deliberately independent of the
spline code. `vectordraw_base.ts` defines `PathBase` and `VectorDraw<PathType>`: a path list
with z ordering, a 256-deep preallocated `Matrix4` stack, and `moveTo`/`lineTo`/`cubicTo`
etc. `cubicTo` subdivides recursively and then solves a quadratic for the intersection —
the REDUCE derivation for that solve is kept verbatim in the file header.

`src/vectordraw/vectordraw.ts` is the barrel that selects the live backend:

```ts
export let Canvas = CanvasDraw2D;
export let Path   = CanvasPath;
```

| Backend | File | Status |
|---|---|---|
| Batched canvas2d + workers | `vectordraw_canvas2d.ts` | **live** — the default |
| Synchronous canvas2d | `vectordraw_canvas2d_simple.ts` | **live** — tiled mode only |
| SVG | `vectordraw_svg.ts` | **live** — export only |
| Skia / CanvasKit | — | commented out (`config.HAVE_SKIA = false`) |
| `Path2D` | — | commented out |
| Stub | — | commented out |

Note that `recalc` and `regen` are declared on merged `interface` declarations rather than
in the class bodies, because the canvas2d backend replaces them with accessor pairs (the
`recalc` setter invalidates the cached command stream).

## 8. Batching and the command stream

`CanvasDraw2D` (`src/vectordraw/vectordraw_canvas2d.ts`) does not rasterize. It groups
paths into `Batch`es and hands each batch to a worker.

`CanvasPath.gen()` compiles a path into a flat `number[]` of opcodes — SETTRANSFORM, SAVE,
clip CLIPs, FILLSTYLE, SETBLUR, BEGINPATH, the geometry, FILL, RESTORE — using the opcode
table in `vectordraw_jobs_base.ts` (`LINESTYLE 0` … `NOFILL 24`), with a per-opcode
argument-length table for the decoder. `genSmart()` is the fast path for a pure transform
change: it patches the six SETTRANSFORM numbers in place instead of regenerating.

Each path caches an aabb, padded by `blur + 15` and `stroke_extra * 3`, clamped to
`config.MAX_CANVAS2D_VECTOR_CACHE_SIZE` (1700).

`updateBatches(g)` decides batch membership:

- Batch size limit `blimit = paths.length < 15 ? 15 : ceil(paths.length / manager.max_threads)`
  — with few paths, one batch; with many, roughly one batch per worker.
- A path with a wide stroke counts for more: a new batch opens when
  `batch.paths.length * (1 + w1*4.0) > blimit`.
- A zoom change marks every path `redraw`; recalc/redraw propagate to `clip_users`.

`Batch.gen(draw)` unions its paths' aabbs, clips that against the viewport padded by 128 px,
prefixes the stream with `[width, height]`, packs it into a `Float64Array`, and posts it:

```ts
vectordraw_jobs.manager.postRenderJob(renderid, f64commands, undefined, !blocking)
  .then((data: ImageBitmap) => {
    this.pending = false; this._image = data; this._image_off = min;
    this._draw_zoom = zoom; window.redraw_viewport();
  });
```

Note the last line: a finished batch schedules another repaint, which is when its bitmap
actually reaches the screen.

`Batch.draw()` blits `_image` with `scale = zoom / this._draw_zoom` plus a pan-delta offset.
That correction is what makes pans and zooms feel instant — the stale bitmap is
transformed to approximately the right place while the re-render is in flight.

## 9. The worker pool

`src/vectordraw/vectordraw_jobs.ts` defines `Thread` and `ThreadManager`, with a single
module-level `export var manager = new ThreadManager()`.

- `MAX_THREADS = platform.app.numberOfCPUs() + 1`, floor 2.
- Forced to 1 when `config.HTML5_APP_MODE` or `config.NO_RENDER_WORKERS`.
- `postRenderJob()` posts NEW_JOB → SET_COMMANDS (transferring `commands.buffer`, so the
  array is neutered on the main thread) → optional ADD_DATABLOCK → RUN, and resolves with
  an `ImageBitmap`.
- A 750 ms watchdog interval aborts a job that never reports back.

The worker (`vectordraw_canvas2d_worker.ts`) is a classic script. `doDrawList()` reads the
width and height from the first two doubles, rejects malformed dimensions (NaN, ≤ 0,
> 10000), allocates an `OffscreenCanvas`, sets `miterLimit = 2.5` and `lineCap = "butt"`,
switches on each opcode, maps SETBLUR to `g.filter = "blur(" + (blur*0.25) + "px)"` scaled
by the transform, and finishes with `canvas.transferToImageBitmap()` posted back as
MSG_RESULT in the transfer list.

## 10. SVG export

`export_svg(spline, visible_only)` in `src/util/svg_export.ts` reuses the entire pipeline
with a different backend. It constructs an `SVGDraw2D` and a fresh `SplineDrawer`, forces
`regen_render()` and `regen_sort()`, builds a matrix from `view2d.rendermat` scaled
`(1, -1, 1)` and translated `(0, -height, 0)`, patches `dpi_scale`/`width`/`height` onto a
dummy 1024×768 context, runs `drawer.update(...)` and `drawer.draw(g)`, and returns
`vecdrawer.svg.outerHTML`. `SVGDraw2D` builds real DOM nodes — `<path>`, `<use>`,
`<clipPath>`, `<filter><feGaussianBlur>`, `<defs>`, `<g>` — through `createElementNS`.

The operator is `appstate.export_svg` in `src/editors/app_ops.ts`.

## Invalidation model

Three levels, easy to confuse:

| Call | Meaning |
|---|---|
| `spline.regen_render()` | Set `RecalcFlags.ALL` — rebuild everything |
| `spline.regen_sort()` | Set `RecalcFlags.DRAWSORT` — the draw list is stale |
| `spline.regen_solve()` | Set `RecalcFlags.SOLVE` — constraints need re-solving |
| `redraw_element(e)` | Flag one element `SplineFlags.REDRAW` |

At the element level, `SplineFlags.REDRAW` means "this element's paths must be
regenerated"; `SplineFlags.UPDATE` means its geometry moved. `SplineDrawer.update()` reads
both. At the path level, `path.recalc` means the command stream is stale (geometry
changed); `path.redraw` means only the raster is stale (transform changed).

Other `SplineFlags` that affect drawing: `HIDE`, `NO_RENDER`, `DRAW_TEMP`, `GHOST` (drawn
even when hidden), `COINCIDENT` (segment collapses to `v1` in `evaluateSide`).

## Debug switches

| Switch | Effect |
|---|---|
| `window.FANCY_JOINS = false` | Disable joint trimming and mitres |
| `window.DEBUG.fastDrawMode` | Coarse polyline drawing, no joins or faces |
| `window._DEBUG.trace_recalc_all` | Log every full path-list rebuild |
| `window._DEBUG.drawsort` | Log draw-sort timing |
| `editor.draw_stroke_debug` | Emit debug paths at z + 50000/50001/60002 |
| `window._block_drawing` | Suppress frames while > 0 |
| `complete_viewport_draw()` | Rebuild drawers and block until all jobs finish |
| `config.NO_RENDER_WORKERS` | Force single-threaded rendering |

## Not part of this path

- **`src/webgl/`** is used by the raster paint system only. The vector viewport never
  touches it; `View2DHandler.drawWebgl()` just scissors and clears.
- **Multires** (`spline_multires.ts`) is gated behind `config.ENABLE_MULTIRES = false`.

## Known quirks

These are real, load-bearing oddities that will confuse anyone reading the source:

- **`zoom` is hardcoded to 1.0 in `draw_spline()`.** It was written as `matrix.m11`, but the
  components live on `matrix.$matrix`, so it was always `undefined` and fell back to 1.0.
  The overlay's handle and vertex sizes therefore do not scale with zoom. Preserved
  deliberately — "fixing" it changes how the editor looks.
- **Stroke groups always redraw in fast-draw mode.** `fastDraw()`'s early-out looks the
  group's path up by `Reflect.get(e, "eid")`, but a `SplineStrokeGroup` keys on `id`, not
  `eid`, so the lookup always misses. The normal `update()` path does not have this bug.
- **`calc_string_ids()` produces NaN.** It reads `seg.id`, but `id` belongs to
  `SplineStrokeGroup`, not `SplineSegment`.
- **Blur batching is disabled** — `let needsblur = false;` in `updateBatches`, with an
  "XXX This is not working" note. Blur still works per-path via the worker's `g.filter`.
- **`clearOutstandingJobs()` does nothing.** It assigns `this.callback = {}`, a typo for
  `this.callbacks`, so pending resolvers are never actually dropped.
