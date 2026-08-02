# Report: The Stroking System

Scope: how Fairmotion converts an arbitrary vector *mesh* of spline segments (with per-vertex
variable width) into filled outline paths for rendering.

## 1. What makes this stroker unusual

Most 2D strokers take a single open/closed path and offset it. This one strokes a **half-edge
mesh**: vertices can have valence 1, 2, 3, or more; segments carry materials, layers, z-order and
faces; and width varies continuously along and across the mesh. The design consequences:

* Strokes are emitted as **filled outlines**, not as renderer stroke ops. The outline is produced
  by walking a chain of segments up one side and back down the other and closing the loop.
* Chains of segments are grouped into **stroke groups** so that one filled path covers many
  segments — a group breaks only where a rendering property actually changes.
* Junctions (valence ≥ 3 and sharp valence-2 corners) are handled by **trimming each incident
  segment back** until its offset outlines no longer overlap, then filling the leftover gap with
  a separate join path.
* Width is not a per-segment linear ramp: it is a **cubic B-spline over a 9-vertex neighbourhood**
  walked through the mesh, so width is C² across vertices without any extra data.

## 2. Files

| File | Role |
|---|---|
| `src/curve/spline_strokegroup.js` | `SplineStrokeGroup`, topological grouping (`buildSegmentGroups`) and render-property splitting (`splitSegmentGroups`, `vertexIsSplit`). |
| `src/curve/spline_draw_new.js` | **The stroker.** `SplineDrawer`: `update()`, `update_vertex_strokes()`, `update_stroke_points()`, `update_stroke_group()`, `update_vertex_join()`, `addClipPathsToStrokeGroup()`, plus face filling. |
| `src/curve/spline_types.js` | `SplineSegment.width()/shift()/dwidth()/dshift()`, `evaluateSide()`, `curvatureSide()`; `SplineVertex.width`/`.shift` accessors. |
| `src/curve/bspline.js` | `deBoor()` — the width/shift B-spline evaluator. |
| `src/vectordraw/*` | Path/Canvas abstraction and its backends (canvas2d, canvas2d-path2d, skia, svg, plus worker/job variants). |
| `src/curve/spline_draw.js` | Legacy drawer; now mostly colour tables and re-exports `SplineDrawer` from `spline_draw_new.js`. |
| `src/vectordraw/strokedraw.js` | Empty (2 lines). Stale. |

## 3. Grouping

Two passes, both hash-keyed so groups survive across frames:

**`buildSegmentGroups(spline)`** — pure topology. Seeds from every vertex whose valence is not 2
(i.e. endpoints and junctions), then walks through valence-2 vertices collecting a chain. A second
sweep picks up closed loops that were never visited. Each chain becomes a `SplineStrokeGroup`
keyed by a hash of its segment eids; an existing group with the same hash is reused (only its
segment references are refreshed from `spline.eidmap`), which keeps downstream path ids stable.

**`splitSegmentGroups(spline)`** — render properties. Walks each topological group and splits it
wherever `vertexIsSplit()` says two adjacent segments cannot share one filled outline. The split
criteria, in order, returning a nonzero reason code:

1. visibility (hidden flag, `NO_RENDER`, or hidden layer)
2. `mat.strokecolor` differs
3. `MASK_TO_FACE` flag differs
4. `mat.blur` differs
5. `mat.fill_over_stroke` differs
6. `mat.linewidth2` presence differs (double-stroke on/off)
7. `mat.strokecolor2` differs (when double-stroke is on)
8. `mat.opacity` differs
9. no shared layer between the segments

Also, any vertex with valence > 3 forces a split. The result lands in
`spline.drawStrokeGroups` / `_drawStrokeGroupMap`, and the boundary vertices are recorded in
`spline._drawStrokeVertSplits`.

## 4. Variable width

### 4a. Storage
Per segment: `w1`, `w2` (width multipliers at `v1`/`v2`) and `shift1`, `shift2` (lateral offset,
i.e. the stroke's centreline can be pushed off the curve). Absolute width is
`w * mat.linewidth`. `SplineVertex.width` is a derived accessor: reading it averages the incident
segment endpoints; writing it scales them by a ratio and, for valence-2 vertices, forces both
sides equal so a mid-chain vertex cannot have two different widths.

`SplineVertex.shift` is sign-aware: the sign of a segment's `shift1/shift2` depends on whether the
vertex is that segment's `v1` or `v2`, so the getter/setter flip signs based on orientation. Only
valence-2 vertices support shift.

Subdivision (`spline.js:602`) linearly interpolates `w`/`shift` at the split parameter and hands
the halves to the two new segments, so splitting a stroke is width-preserving.

### 4b. Evaluation — `SplineSegment.width(s, outShift)`
`spline_types.js:700`. This is the interesting part. Rather than interpolating `w1→w2`, it
**walks the mesh** four segments backwards from `v1` and four forwards from `v2` (stopping at any
non-valence-2 vertex, where `walk()` simply re-reads the same segment), collecting nine
`(width, shift)` samples and the arclengths (`seg.length`, i.e. the clothoid `KSCALE`) between
them. Those become the knot vector and control values of a **cubic B-spline** evaluated by
`bspline.deBoor(3, s*len, ks, ws, 3)`. `outShift` is filled from a parallel de Boor call on the
shift controls.

Effects:
* Width is C² across vertices, and the ramp is arclength-parameterized, so a short segment next to
  a long one does not get a width kink.
* Cost: every width query walks 8 segments and runs two de Boor evaluations. `dwidth()` and
  `dshift()` are central finite differences (`df = 1e-4`), so each derivative query costs two more
  full walks. This is the hottest path in stroking.
* The knot/control arrays are module-level scratch (`bstmp1/2/3`, `bstmpb`) — not reentrant.
* `shift(s)` is now just `width(s, shiftout)` returning the out-param; the older linear
  `shift1 + (shift2-shift1)*s` body below it is dead code after an unconditional `return`.
* `widthFunction(s)` is an identity stub; the smoothstep variants are commented out.

### 4c. Offset curve — `SplineSegment.evaluateSide(s, side, dv_out, normal_out, lw_dlw_out)`
`spline_types.js:1437`. Produces a point on one side of the stroke:

```
lw  = width(s) * side           dlw = dwidth(s) * side
lw  = lw + lw*shift             dlw = dlw*shift + dlw + dshift*lw
dx  = -dv[1] * lw*0.5 / length  dy  =  dv[0] * lw*0.5 / length
p   = evaluate(s) + (dx, dy)
```

`side` is mapped to ±1, so `side=0` is the left/negative offset. The tangent of the *offset*
curve is not the tangent of the centreline (width is changing), so `dv_out` uses the analytic
derivative of the offset expression, derived by the REDUCE block in the comment at
`spline_types.js:1420-1436`:

```
k    = -length * curvature(s)
dx2  = (-0.5*(dlw*dv[1] + dv[0]*k*lw - 2*dv[0]*length)) / length
dy2  = ( 0.5*(dlw*dv[0] - dv[1]*k*lw + 2*dv[1]*length)) / length
```

This is what makes the Bezier fitting in the stroker C1-correct under varying width.
`curvatureSide()` in contrast is pure triple finite differencing.

## 5. Junction handling

Run per vertex, before any group is emitted, from `SplineDrawer.update()` → `update_vertex_strokes(v)`.

### 5a. Trim search (`update_vertex_strokes`)
For vertices that are plain valence-2 with continuous tangents, nothing happens: the trim
parameters are just set to 0 or 1.

Otherwise (`BREAK_TANGENTS` or valence > 2):

1. Sort the incident segments by angle around the vertex (`_sortSegments`); the sort also sums the
   angles between consecutive segments and tags `segments.bad_corner` if the total is under 2π
   (a degenerate fan).
2. **Binary search, 8 iterations, over `s ∈ [0, 0.65]`** of a common trim distance. Each candidate
   is converted per-segment into a parameter via `s * avg_seglen / seg.length`, so all segments
   are trimmed by the same *arclength*, not the same parameter.
3. The predicate `testIsect()` tests every ordered pair of incident segments: it builds the
   centreline point and each side point at the current trim parameter and calls
   `line_line_cross4` on all 8 combinations. If any cross, the trim is too small.
4. After converging, an extra margin of `avg(width*0.1 + linewidth2)` / `avg_seglen` is added and
   clamped to 0.5, then applied.

Results are stored per segment in the `SplineDrawData` custom-data layer as `start1/start2`
(at `v1`) and `end1/end2` (at `v2`) — one trim parameter **per side**, so the two sides of a
segment can be trimmed asymmetrically.

Note the first block of `testIsect` (the `closest_point` based width test) begins with an
unconditional `break`, so only the line-crossing test is live. Two of the three branches in
`update_stroke_points`'s final `if/else` chain are `if (0)`.

### 5b. Corner points (`update_stroke_points`)
For valence-2 corners it computes the **miter point**: it takes the offset points and offset
tangents of the previous and current segment on each side, and if the angle between the offset
tangents exceeds 0.3π it intersects the two tangent lines (`line_isect`) and stores that
intersection as an explicit override point via `SplineDrawData.setp()` (bit-masked per
segment/vertex/side). If the angle is shallow, or the lines are colinear, the override is cleared
and the trim parameter is reset to the untrimmed endpoint. Intersections are `floor()`ed to
integers — pixel snapping, presumably to keep adjacent groups landing on identical coordinates.

For valence ≥ 3 the current code clears both overrides (the two averaging strategies are behind
`if (0)`), so the trim from 5a plus the join fan in 5c does the work.

### 5c. Join fans (`update_vertex_join`)
Called for every segment at a vertex with valence > 2. It creates a filled wedge at
`id = seg.eid | (1<<17 or 1<<18)`, z = the segment's z:

* Takes the trimmed outline point of the *previous* segment in angular order (`p0`) and both
  outline points of the current segment (`p1a`, `p1b`).
* Draws `p0 → cubic → p1a → line → p1b → line → vertex`, closing the fan. The cubic's control
  handles come from the offset-curve derivatives scaled by
  `0.7 * dist(v, p) / seg.length / 1.5`, so the join fairs into the stroke's curvature instead of
  being a flat miter.
* `noAutoFill()` + `pushFill()`.
* A second path at `z+1` (`id | (1<<19)`) draws the **double-stroke** (`mat.linewidth2` /
  `strokecolor2`) across the join: if the join is large or turns more than 0.2π it strokes the
  cubic; otherwise it degenerates to a small filled quad between the two endpoint normals, which
  avoids a visible bulge on tight joins.

## 6. Outline generation (`update_stroke_group`)

The core loop, `spline_draw_new.js:949`.

1. Early-out: if both the fill path (`g.id`, z) and the double-stroke path (`g.id | 1<<20`, z+1)
   exist and no member segment is flagged `REDRAW`/`UPDATE`, return.
2. Pick a start vertex: the end of the first segment not shared with the second (i.e. the free
   end of the chain).
3. `path.color = seg.mat.strokecolor`, `path.blur = seg.mat.blur`.
4. **Two passes** (`step = 0` then `1`): forward through `g.segments` on one side, then backward
   through the reversed list on the other side. Because it never closes explicitly, the fill
   closes the outline.
5. Per segment:
   * `steps = clamp(round(seg.length/55), 7, 16)` — sample density scales with arclength.
   * `dsign = +1` if traversing from `v1`, else `-1`; `side = (dsign < 0)`. The trim range comes
     from `ddata.start(side)` / `ddata.end(side)`.
   * If the vertex is a valence ≤ 2 `BREAK_TANGENTS` point, the explicit override point (if any)
     is emitted with straight `lineTo`s — this is the cap/miter corner.
   * Otherwise it walks `steps` samples, calling `evaluateSide(s, side, dv, no, lw_dlw)` and
     connecting consecutive samples with `cubicTo` whose handles are `±dv * ds/3` (negated on the
     mirrored side). Endpoints are forced exactly onto `start`/`end` for the last segment.
   * The same commands go to a second path (`path2`) which is later `pushStroke`d with
     `strokecolor2 / linewidth2` when double-stroke is enabled.

So the emitted geometry is a **G1 cubic-Bezier approximation of the variable-width offset curve**,
using the analytic offset tangent from `evaluateSide`, at 7–16 samples per segment.

### Debug mode
`strokeDebug` (threaded in from the editor as `draw_stroke_debug`) emits three extra paths at
z+50000..60002 drawing the sample points, the Bezier handles, and the handle polygon. Same
mechanism exists in `update_vertex_strokes` at z+10000..10002, and `update_normals` draws
curvature combs scaled by `17000*k`.

## 7. Masking, z-order and caching

* **`addClipPathsToStrokeGroup`** — if a segment's material has `MASK_TO_FACE`, the stroke path
  gets the faces around that segment (via the radial loop cycle) added as clip paths, so the
  stroke is stencilled to its face. Otherwise `reset_clip_paths()`. Note the `fz > z` early-continue
  inside the radial walk skips the `_i` overflow guard increment for those iterations, and `fs` is
  not cleared between segments in the group, so faces accumulate across the loop.
* **Path identity** — everything is keyed by an integer id with high bits tagging the role:
  `1<<17`/`1<<18` join fans, `1<<19` join double-stroke, `1<<20` group double-stroke,
  `8192`/`16384` debug. Ids are stable across frames because group hashes are stable, which is what
  lets the drawer skip untouched geometry.
* **`used_paths`** — any path in `drawer.path_idmap` not touched this frame is removed at the end
  of `update()`.
* **`recalc_all`** is forced on element-count change, blur/face-draw toggles, or selectmode change
  involving faces; it triggers `drawer.recalcAll()` and a full re-tessellation.
* **`fastDraw()`** (`DEBUG.fastDrawMode`) bypasses stroking entirely: 5-point polyline per segment
  with a plain `pushStroke`, no width, no joins.

## 8. Backends

`SplineDrawer` is constructed with a `Canvas` from `src/vectordraw/`. The `PathBase` API is
`moveTo/lineTo/cubicTo/bezierTo/makeLine/pushFill/pushStroke/noAutoFill/add_clip_path`.
Notably `PathBase.cubicTo` recursively subdivides once by default and then converts each half to a
**quadratic** (`bezierTo`) by intersecting the end tangents — so backends only need quadratics.
Backends: `vectordraw_canvas2d*.js` (command-buffer replay, plus a Path2D variant and a
worker/job variant), `vectordraw_skia_simple.js` / `_worker.js` (CanvasKit), `vectordraw_svg.js`
(SVG export, used by `util/svg_export.js`), `vectordraw_stub.js`.

Because the outline is a single self-overlapping filled path, the fill rule matters: the backends
call plain `g.fill()` (nonzero), which is what makes the doubled-back outline and the join fans
merge cleanly instead of punching holes.

## 9. Issues and observations

1. **Dead/disabled code is pervasive** in the stroker: `if (0)` blocks in
   `update_stroke_points` (two of three join strategies) and `update_vertex_strokes`, an
   unconditional `break` at the top of `testIsect`'s width test, dead `lastsign`/`flip`/`lastno`
   locals, and a stale `shift()` body after a `return`. It is hard to tell intended behaviour from
   abandoned experiments.
2. **`FANCY_JOINS` is a `window` global** set to `true` at module scope; setting it false disables
   all join handling.
3. **Performance**: `width()` walks 8 segments per call and `evaluateSide` calls
   `width`, `dwidth`, `shift`, `dshift`, `evaluate`, `derivative` and (for `dv_out`) `curvature` —
   `dwidth`/`dshift` each being two more full walks. At 16 samples × 2 sides × N segments this
   dominates. Caching the B-spline knot/control setup per segment per frame is the obvious win.
4. **Shared scratch arrays** (`bstmp1/2/3`, `bstmpb`, `shiftout`) make `width()` non-reentrant;
   `shift()` calls `width()` which overwrites them.
5. `addClipPathsToStrokeGroup` accumulates `fs` across segments and applies it inside the segment
   loop, so a group whose first segment is masked will apply that face's clip to paths built for
   later segments too. Likely a bug.
6. **`update_vertex_join` returns early when `mat.linewidth2 === 0`** — after the main fill path
   has already been pushed, so this is correct but easy to misread.
7. `_sortSegments` allocates four `Vector2`s and a fresh array on every call, and it is called
   from three places per vertex per frame.
8. The trim binary search runs a full O(n²) pairwise intersection test 8 times per junction
   vertex, plus a 9th evaluation for the margin — at high-valence vertices this is the second
   hotspot.
9. `src/vectordraw/strokedraw.js` is empty and `src/curve/spline_draw.js` is largely superseded;
   both are cleanup candidates.
10. `update_stroke_group` logs `console.warn("g.segments.length was zero!")` — reachable if
    `splitSegmentGroups` emits an empty group; `buildSegmentGroups` has a matching cleanup pass
    that checks `g.length` (undefined on a plain object) rather than `g.segments.length`, so that
    pass never actually removes anything.
