# Stroking

How a spline segment becomes a filled outline: where width comes from, how the two stroke
boundaries are evaluated, how runs of segments are stroked as one shape, how the second
(outline) stroke works, and what happens where strokes meet.

This is the layer below [rendering.md](rendering.md) — that document covers scheduling,
batching and rasterization; this one covers the geometry.

| Topic | Code |
|---|---|
| Width and shift storage | `SplineSegment.w1/w2/shift1/shift2` — `src/curve/spline_types.ts` |
| Width evaluation | `SplineSegment.width()` — `src/curve/spline_types.ts` |
| Boundary evaluation | `SplineSegment.evaluateSide()` — `src/curve/spline_types.ts` |
| Stroke groups | `src/curve/spline_strokegroup.ts` |
| Outline construction | `SplineDrawer.update_stroke_group()` — `src/curve/spline_draw_new.ts` |
| Junctions | `update_vertex_strokes` / `update_stroke_points` / `update_vertex_join` |
| Per-segment trim data | `SplineDrawData` — `src/curve/spline_draw_new.ts` |

## The model

A stroke is **not** a centre line handed to `ctx.stroke()`. Fairmotion builds the stroke's
silhouette analytically — the two offset curves either side of the centre line — joins them
into one closed path, and fills it. Everything about variable width, shift, double stroking
and joints follows from that decision.

The consequences worth internalising:

- Width can vary continuously along a stroke, because the offset is evaluated per sample.
- Two strokes meeting at a vertex produce **overlapping silhouettes**, which a fill would
  render as a lump. Trimming and join geometry exist to fix that.
- The "second stroke" is a pen run around the silhouette, not a second centre line.

## 1. Where width comes from

Three things multiply together:

| Source | Field | Meaning |
|---|---|---|
| Material | `mat.linewidth` | Base width for the whole segment (default 2.0) |
| Segment endpoints | `seg.w1`, `seg.w2` | Per-endpoint multipliers (default 1.0) |
| Material | `mat.linewidth2` | The *second* stroke's pen width; 0 disables it |

So the width at `seg.v1` is `seg.w1 * mat.linewidth`. Tapering a stroke means varying `w1`
and `w2` across a run of segments.

`w1`/`w2` are written by:

- **`pentool.ts`** — from stylus pressure. The third component of each input point carries
  pressure, and `s.w1 = lastv[2] || 1.0` assigns it, orientation-corrected so `w1` always
  belongs to `v1`.
- **`spline_createops.ts`** — a flat width for programmatically created segments.
- **`transform_spline.ts`** — the interactive width tool.

### The vertex-level view

`SplineVertex.width` is a derived accessor, not storage: the getter averages
`w1`/`w2` over the vertex's segments, and the setter scales every incident endpoint by
`new/old` so relative taper is preserved. It refuses zero and repairs NaN/zero data in
place.

Two-valence vertices get a special case in the setter: after scaling, both segments'
endpoint widths are forced to their mean, so a smooth interior joint cannot develop a
width discontinuity that the user did not ask for.

Handle vertices have no width — the accessor warns and returns 0.

## 2. Width evaluation: `width(s, outShift?)`

Naively you would interpolate `w1 → w2` linearly along the segment. That gives a visible
crease at every join, because the width derivative jumps. Instead `width()` evaluates a
**cubic B-spline in arc length** whose control values are the widths of this segment *and
its neighbours*:

```ts
function walk() {                       // step one segment outward through a 2-valence vertex
  if (v.segments.length === 2) {
    seg = v.other_segment(seg);
    v   = seg.other_vert(v);
  }
  len = Math.max(seg.length, 0.0001);
  bstmpb[0] = (v === seg.v1 ? seg.w1 : seg.w2)*seg.mat.linewidth;
  bstmpb[1] =  v === seg.v1 ? seg.shift1 : seg.shift2;
  return bstmpb;
}
```

It walks four steps back from `v1` and four steps forward from `v2`, collecting a
(width, shift) sample at each vertex and the segment length between them. Those become the
control values `ws[0..6]`, with the knot vector built from cumulative arc length, zeroed at
`v1`:

```
ks = [-l0-l1-l2, -l1-l2, -l2, 0, l4, l4+l5, l4+l5+l6, ...]
```

Then `s` is rescaled from `[0,1]` to arc length (`s *= l4`) and evaluated with
`bspline.deBoor(3, s, ks, ws, 3)` — degree 3, knot interval 3 (the interval `[0, l4]`, i.e.
this segment).

Two things fall out of this:

- **Width is C² across two-valence joins**, because neighbouring segments share control
  points. A taper drawn across ten segments reads as one smooth taper.
- **`walk()` stops at non-two-valence vertices** — it simply does not move, duplicating the
  control value. That is a clamped end condition: width flattens out at the ends of a run
  and at branch points.

`shift(s)` is the same evaluation with the shift control values, returned through the
`outShift` out-param (the code below the `return` in `shift()` is dead). `dwidth(s)` and
`dshift(s)` are central finite differences with `df = 1e-4`. `widthFunction(s)` is currently
the identity — the smoothstep remappings are commented out.

## 3. Shift: lateral offset

`shift1`/`shift2` offset the stroke sideways from its centre line, as a **fraction of the
local width**. `SplineVertex.shift` is again derived, and only defined for two-valence
vertices; its sign convention depends on whether the vertex is `v1` or `v2` of each
segment, which is why the getter and setter both branch on `(this === s1.v1) === (this ===
s2.v1)`.

The effect in `evaluateSide` is:

```
side 0 boundary at  -lw*(1 - shift)/2
side 1 boundary at  +lw*(1 + shift)/2
```

Total width stays `lw`; the stroke's centre moves by `lw*shift/2`. So shift slides the
stroke off its curve without thinning it — the tool for offsetting a stroke from a
construction curve.

## 4. The stroke boundary: `evaluateSide`

```ts
evaluateSide(s, side = 0, dv_out?, normal_out?, lw_dlw_out?)
```

Returns the point on one of the two boundaries. `side` picks which; the three optional out
params receive the boundary's derivative, its normal, and `[width, dwidth]`.

```ts
let sidesign = side ? 1.0 : -1.0;
let co = evaluateSide_rets.next().load(this.evaluate(s));
let dv = this.derivative(s);
let shift = this.shift(s)*sidesign, dshift = this.dshift(s)*sidesign;
let lw    = this.width(s)*sidesign, dlw    = this.dwidth(s)*sidesign;

dlw = dlw*shift + dlw + dshift*lw;   // product rule for lw*(1 + shift)
lw  = lw + lw*shift;

let dx = -dv[1]*lw*0.5/this.length;  // rotate the tangent 90 degrees, scale by half width
let dy =  dv[0]*lw*0.5/this.length;
co[0] += dx; co[1] += dy;
```

The interesting part is `dv_out`. Sampling the boundary is easy; sampling its *derivative*
is what lets the outline be emitted as cubics rather than as a dense polyline. The offset
curve's derivative is not the centre line's derivative — it picks up a curvature term. The
REDUCE derivation sits directly above the method:

```
forall s let df(x(s), s, 2) = -df(y(s), s)*k(s);
forall s let df(y(s), s, 2) =  df(x(s), s)*k(s);

offx := x(s) - df(y(s), s)*lw(s)*0.5/seglen;
offy := y(s) + df(x(s), s)*lw(s)*0.5/seglen;

df(offx, s);
df(offy, s);
```

which lands as, with `k = -seglen*curvature(s)`:

```ts
dx2 = (-0.5*(dlw*dv[1] + dv[0]*k*lw - 2*dv[0]*seglen))/seglen;
dy2 = ( 0.5*(dlw*dv[0] - dv[1]*k*lw + 2*dv[1]*seglen))/seglen;
```

Both the width gradient (`dlw`) and the curvature (`k`) bend the boundary relative to the
centre line, and both terms are there.

Segments flagged `SplineFlags.COINCIDENT` collapse: the method returns `v1` and zeroes every
out param. Return values come from a 512-deep cachering, so **copy them before the next
call**.

## 5. Stroke groups

A `SplineStrokeGroup` is a run of segments joined end-to-end through two-valence vertices
that can be stroked as a single silhouette. This is what makes a long pen stroke look like
one brush mark rather than a chain of overlapping capsules.

Construction is two passes, both run from `Spline.redoSegGroups()`:

1. **`buildSegmentGroups(spline)`** — pure topology. Every vertex of valence ≠ 2 is a root;
   from each root it walks outward until it hits another non-two-valence vertex. Closed
   loops that no root reached are picked up in a second sweep over unvisited vertices.
2. **`splitSegmentGroups(spline)`** — splits those topological runs wherever the segments
   cannot actually share one fill, using `vertexIsSplit()`.

`vertexIsSplit()` returns a **reason code** rather than a bare boolean, which is what to
reach for when a stroke splits and you cannot see why:

| Code | Cause |
|---|---|
| 1 | Visibility differs (hidden, no-render, or hidden layer) |
| 2 | `strokecolor` differs |
| 3 | `MASK_TO_FACE` differs |
| 4 | `blur` differs |
| 5 | `fill_over_stroke` differs |
| 6 | One has `linewidth2 > 0` and the other does not |
| 7 | `strokecolor2` differs (when double stroking is on) |
| 8 | `opacity` differs |
| 9 | No layer in common |

It also splits unconditionally at any vertex of valence > 3.

Groups are keyed by a hash of their member eids, so a rebuild that produces the same
membership **reuses the previous group object** — and therefore its retained path and its
`id`. `spline._drawStrokeVertSplits` records which vertices ended up at a group boundary.

## 6. Building the outline

`update_stroke_group(g, drawparams, redraw)` walks the run twice:

```
step 0:  segments in order,      side = (dsign < 0)
step 1:  segments in reverse,    side flips, because v is now the far endpoint
```

`v` carries over between passes, so the second pass naturally returns along the opposite
boundary. The result is one closed loop: down one side, back up the other.

Per segment:

```ts
let steps = seglen > 0.0 ? ~~(seglen/55.0 + 0.5) : 0;
steps = Math.min(Math.max(steps, 7), 16);           // 7..16 samples

let start = ddata.start(side), end = ddata.end(side);   // the trims, see below
let ds = dsign*((end - start)/steps);
let s  = dsign < 0.0 ? end : start;
```

and each sample becomes a cubic in Hermite-to-Bézier form, with the tangent scaled by the
parameter step over three:

```ts
let p = seg.evaluateSide(s, side, dv, no, lw_dlw);
let dfac = ds/3.0;
if (side) dfac *= -1;
dvs.load(dv).mulScalar(dfac);
lastdvs.load(lastdv).mulScalar(dfac);

path.cubicTo(lastp[0] + lastdvs[0], lastp[1] + lastdvs[1],
             p[0] - dvs[0],         p[1] - dvs[1],
             p[0],                  p[1]);
```

The last segment gets `steps++` and snaps `s` exactly to `start`/`end` at the first and last
iteration, so the two passes meet precisely.

The path is never explicitly closed — the backend's implicit `FILL` closes it (see
`gen_commands`, which appends `OPCODES.FILL` unless `noAutoFill()` was called).

`path.color = seg.mat.strokecolor` and `path.blur = seg.mat.blur` come from the group's
first segment, which is safe precisely because `vertexIsSplit` guarantees uniformity across
a group.

### Corners inside a run

A vertex flagged `SplineFlags.BREAK_TANGENTS` with valence ≤ 2 takes the `usepoint` branch:
the explicit mitre point is emitted with `lineTo` instead of a cubic, and `dobreak` forces
the *next* sample to be a `lineTo` too. That produces a hard corner in the middle of an
otherwise smooth run.

## 7. Double stroking

`mat.linewidth2 > 0` adds a second stroke: a pen of width `linewidth2` in `strokecolor2`
run **around the silhouette** of the first stroke. It is not a second centre line, so it
tracks the variable width automatically.

Implementation is a parallel path built from the same samples:

```ts
let path2 = this.get_path(g.id | (1<<20), z + 1);
path2.reset();
path2.noAutoFill();
// ... same moveTo/lineTo/cubicTo calls as `path` ...
if (mat.linewidth2 > 0) path2.pushStroke(mat.strokecolor2, mat.linewidth2);
```

Three details:

- **`noAutoFill()`** suppresses the implicit `FILL`, so `path2` only ever strokes.
- **It sits at `z + 1`**, one above the fill, so the outline draws over its own stroke.
- **It breaks its subpath at the turnaround.** Where `path` does `lineTo` at the start of
  the reverse pass, `path2` does `moveTo`. So the fill is one closed loop while the outline
  is two open strokes — one per side — which is what keeps the pen from drawing a cap line
  across the stroke's ends.

`pushStroke` records `stroke_extra = max(stroke_extra, width)`, which the backend uses to
pad the path's aabb by `stroke_extra*3` so the pen does not get clipped at the batch edge.

Because `linewidth2` and `strokecolor2` are both stroke-group split conditions (reasons 6
and 7), a group's double stroke is always uniform.

## 8. Junctions

Three distinct cases, handled by three different mechanisms.

### Case A — smooth two-valence interior

Nothing to do. `update_vertex_strokes` short-circuits:

```ts
if (!((v.flag & SplineFlags.BREAK_TANGENTS) || v.segments.length > 2)) {
  for (let seg of v.segments) {
    data.sets(seg, v, 0, v === seg.v1 ? 0.0 : 1.0);
    data.sets(seg, v, 1, v === seg.v1 ? 0.0 : 1.0);
  }
  return;
}
```

Both segments are left untrimmed and the shared width B-spline makes the boundaries line up.

### Case B — trimming

Where strokes genuinely overlap, each is pulled back from the vertex until they no longer
do. The trim distance is found by **bisection**:

```ts
let a = 0.0, b = 0.65;
for (let i = 0; i < 8; i++) {
  let s = (a + b)*0.5;
  setSegments(s);
  if (testIsect()) { a = (a + b)*0.5; } else { b = (a + b)*0.5; }
}
```

`setSegments(s)` converts a single trim value into per-segment parameters using the *mean*
segment length at the vertex, so every stroke is trimmed by the same **arc length** rather
than the same parameter fraction:

```ts
let s2 = s*seglen/seg.length;     // seglen = mean length of segments at v
s2 = Math.min(Math.max(s2, 0.0), 1.0);
data.sets(seg, v, 0, v === seg.v1 ? s2 : 1.0 - s2);
```

`testIsect()` is deliberately cheap. For each ordered pair of distinct segments and each
combination of sides, it takes the *end-cap radius* — the line from the trimmed centre point
`evaluate(s)` to the trimmed boundary point `evaluateSide(s, side)` — and tests whether the
two cross:

```ts
let p1a = seg1.evaluate(s1),     p1b = seg1.evaluateSide(s1, side1);
let p2a = seg2.evaluate(s2),     p2b = seg2.evaluateSide(s2, side2);
if (line_line_cross4(p1a, p1b, p2a, p2b)) return true;
```

Crossing caps is a proxy for overlapping silhouettes — much cheaper than intersecting the
outlines themselves, and good enough because the trim only needs to be approximately
minimal.

After bisection converges, a margin is added so the join wedge has room to sit in:

```ts
w += w2*0.1 + seg.mat.linewidth2*1.0;   // per segment, then averaged
s += w/seglen;
s = Math.min(Math.max(s, 0.0), 0.5);
```

Note the `linewidth2` term — a double stroke needs the strokes pulled further apart, or the
outline pen overlaps the neighbouring stroke.

### Case C — mitres and wedges

Trimming leaves a gap. Two things fill it, depending on valence.

**Two segments with `BREAK_TANGENTS` — an explicit mitre.** `update_stroke_points(v)`
intersects the two strokes' outer boundary tangent lines:

```ts
let th1 = Math.acos(d0b.dot(d1b));
let doIsect1 = Math.abs(th1) > Math.PI*0.3;      // ~54 degrees
// ...
let isect = line_isect(pb, d0b, sb, d1b);
let r = isect[1] === COLINEAR ? v : new Vector2(isect[0]);
r.floor();
data.setp(seg, v, 1, r);
```

Both sides must exceed the angle threshold (`doIsect1 = doIsect1 && doIsect2`) — a shallow
bend does not need a mitre and gets its trim reset to untrimmed instead. Colinear boundaries
fall back to the vertex position. The `r.floor()` snaps the mitre to integer coordinates.

**Valence > 2 — a filled wedge.** `update_vertex_join(seg, v, drawparams)` runs once per
incident segment and fills the pie slice between that segment's two trimmed boundary points
and the vertex:

```ts
path.moveTo(p0[0], p0[1]);
path.cubicTo(p0 + dv0, p1a - dv1a, p1a);    // arc from the previous segment's boundary
path.lineTo(p1b[0], p1b[1]);                // across to this segment's other side
path.lineTo(v[0], v[1]);                    // back to the vertex
path.noAutoFill();
path.pushFill();
```

Which segment is "previous" comes from `_sortSegments(v)`, which orders the incident
segments by `atan2` of their direction away from `v`. The cubic's tangent handles are scaled
by how far the trim pulled each stroke back (`v.vectorDistance(p0)/prev.length`, over 1.5),
so a heavily trimmed junction gets a correspondingly rounder fill.

The wedge's own double stroke is at `id | (1<<19)`, `z + 1`, and picks one of two
constructions:

```ts
if (len1*0.25 > lw2 || th > Math.PI*0.2) {
  path2.cubicTo(...);                       // normal case: stroke the arc
  path2.pushStroke(mat.strokecolor2, mat.linewidth2);
} else {
  // degenerate case: build an explicit quad between the offset endpoints and fill it
}
```

The fallback exists because stroking a near-degenerate bezier — a wedge so small or so
shallow that it is shorter than the pen is wide — produces artefacts.

### Where the trims live

All of the above is stored in `SplineDrawData`, a `CustomDataLayer` registered as
`"drawdata"` on every segment:

```
start1, end1     trims for side 0, at v1 and v2
start2, end2     trims for side 1
sp1, sp2         explicit mitre points at v1, per side
ep1, ep2         explicit mitre points at v2, per side
mask             which of the four points are valid
```

The accessors take `(seg, v, side)` and resolve to the right slot. `getp()` returns the
explicit point when its mask bit is set, and otherwise falls back to
`evaluateSide(gets(...), side)` — so the outline builder does not need to know which kind of
join it is looking at.

`loadSTRUCT` carries a back-compat fixup: old files stored `start`/`end` as plain numbers
where the class now has methods of those names, so it reads them through an untyped view,
splits them across both sides, and restores the methods.

## 9. Masking strokes to faces

A material flagged `MaterialFlags.MASK_TO_FACE` gets its stroke clipped to the faces it
borders. `addClipPathsToStrokeGroup()` collects every face the group's segments touch and
adds each as a clip path on the stroke path. That is what keeps a stroke from bleeding
outside the fill it belongs to.

## 10. Debugging

| Switch | Effect |
|---|---|
| `window.FANCY_JOINS = false` | Disable all trimming and mitres; strokes just overlap |
| `editor.draw_stroke_debug` | Emit the debug overlays described below |
| `editor.draw_normals` | `update_normals()` — boundary polylines with curvature spikes |
| `window.DEBUG.fastDrawMode` | Centre lines only: 5-sample polylines, no joins, no faces |

With `draw_stroke_debug` on, `update_stroke_group` emits three paths at `z + 50000`,
`z + 50001` and `z + 60002`, and `update_vertex_strokes` emits three more at `z + 10000`,
`z + 10001` and `z + 10002`:

| Colour | Shows |
|---|---|
| Red / orange | Sample points and their forward tangent handles |
| Blue | Secondary markers |
| Green | Bézier control polygon between consecutive samples, and the far-side mitre points |

Bigger boxes (`dpoint(p, 15)`) mark points that came from explicit mitre data
(`hasp === true`); small ones (`8`) mark points evaluated on the fly.

The usual bisection when a stroke looks wrong:

1. `FANCY_JOINS = false` — if the artefact survives, it is in the outline, not the join.
2. `fastDrawMode` — if the centre line is wrong, it is upstream of stroking entirely.
3. `draw_stroke_debug` — look at whether the trims moved and whether the tangent handles
   have sensible magnitudes.
4. `vertexIsSplit(spline, v)` from the console — returns the reason code for an unexpected
   split.

## Known quirks

- **`testIsect()`'s first test loop is dead.** It begins with a bare `break`, so the
  closest-point-based overlap test never runs; only the cap-crossing test is live.
- **The side loop tests four combinations twice.** `side2 = ~~(i/2)` for `i` in `0..7` yields
  `0,0,1,1,2,2,3,3`; values above 1 are truthy and behave as side 1.
- **Bisection is fixed at 8 iterations over `[0, 0.65]`.** A junction needing more than 65%
  of the mean segment length trimmed will still overlap.
- **`bad_corner` is computed but unused.** `_sortSegments` measures whether the incident
  segments wrap a full turn, but the only consumer is an `else if (0)` branch.
- **Mitres are two-segment only.** `update_stroke_points` has branches for higher valences,
  but they are dead; valence > 2 clears the explicit points and relies on the wedge fill.
- **`r.floor()` on mitre points** quantises them to integer coordinates.
- **`path.color = seg.mat.strokecolor` aliases**, where `update_vertex_join` uses
  `path.color.load(mat.strokecolor)` to copy. The stroke path and the material end up
  sharing one `Vector4`.
- **`bstmp1.length = 5` / `bstmp2.length = 5`** in `width()` reset scratch arrays that are
  then grown back to 8 and 7 entries by the assignments below; `bstmp3` is not reset.
