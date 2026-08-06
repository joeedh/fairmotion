# Animation

How a drawing moves over time.

The short version: Fairmotion animates **vertex positions only**. Every animated vertex of the
artwork owns its own little spline — a *motion path* — living in a second, hidden `Spline`
called the **pathspline**. Each vertex of that motion path is a keyframe, and its frame number
is stored in a custom data layer on the vertex. Changing the current time evaluates every
motion path at that time and writes the results back into the artwork's vertices. Topology is
not animated: there is exactly one set of vertices, edges and faces for the whole shot.

## The pieces

| Topic | Code |
|---|---|
| Keyframe time on a path vertex | `TimeDataLayer`, `get_vtime`, `set_vtime` — `src/core/animdata.ts` |
| One motion path | `VertexAnimData` — `src/core/animspline.ts` |
| Owns the two splines and the clock | `SplineFrameSet` — `src/core/frameset.ts` |
| Scene clock | `Scene.change_time()` — `src/scene/scene.ts` |
| Keying the current frame | `KeyCurrentFrame` (`spline.key_current_frame`) — `src/editors/viewport/spline_editops.ts` |
| Playback loop | `FairmotionScreen.update()` / `togglePlayback()` — `src/editors/editor_base.ts` |
| Path drawing in the viewport | `View2DHandler.do_draw_viewport()` — `src/editors/viewport/view2d.ts` |
| Timeline UI | see [dopesheet.md](dopesheet.md) |

## 1. Two splines

A `SplineFrameSet` (the object data for an animatable drawing) holds two `Spline`s:

- **`frameset.spline`**, the *drawspline* — the artwork. This is what you draw, select and
  render. Data path `frameset.drawspline`.
- **`frameset.pathspline`** — a spline whose geometry is not artwork at all. Every connected
  run of vertices in it is one vertex's trajectory through time. Data path
  `frameset.pathspline`.

`ctx.spline` resolves whichever of the two `g_app_state.active_splinepath` currently points at
(`src/core/context.ts`), defaulting to `frameset.drawspline`. Toolmodes flip it: the pen and
spline tools call `ensure_paths_off()` to force it back to the drawspline when path editing is
not wanted. `Spline.dag_get_datapath()` returns the matching path so the eventdag can address
either spline.

`make_pathspline()` marks the new spline `is_anim_path = true` and adds a `TimeDataLayer` to its
vertex customdata. It also assigns `spline.restrict = restrictflags`, but the local
`restrictflags` is `0` — the original code never exported its own flag set, so path splines have
never actually been restricted from any editing operation.

## 2. The data model

```
SplineFrameSet
├── spline           the drawspline (artwork)
├── pathspline       all motion paths, in one spline
├── vertex_animdata  { drawspline vert eid -> VertexAnimData }
├── frames           { time -> SplineFrame }   (only ever holds time 0)
├── kcache           SplineKCache
└── time             current frame
```

### VertexAnimData

One per animated drawspline vertex, keyed by that vertex's `eid`. It does not store the
keyframes itself — it stores `startv_eid`, the first vertex of its run inside the pathspline,
and walks the path from there via `VertexAnimIter` / `SegmentAnimIter` (both cached, in
`vitercache` / `sitercache`). Useful members:

- `eid` — the drawspline vertex this path drives.
- `layerid` — the pathspline layer this path lives on (see §6).
- `animflag` — `VDAnimFlags`: `SELECT`, `STEP_FUNC`, `HIDE`, `OWNER_IS_EDITABLE`.
- `start_time` / `end_time` — the times of the first and last keyframe.
- `dead` — set when the last keyframe is removed.

### TimeDataLayer

A `CustomDataLayer` on pathspline vertices holding `time` (the frame number) and `owning_veid`
(the drawspline vertex this keyframe belongs to). `get_vtime(v)` returns `-1` when the layer is
missing; `set_vtime(spline, v, time)` writes it *and* calls `spline.flagUpdateVertTime(v)` so
the dopesheet gets told. `interp()` blends times when a path segment is subdivided, which is how
splitting an edge between two keys lands on a sensible intermediate frame.

### SplineFrame — the vestigial part

`SplineFrame {time, spline, flag}` and the `frames` dict are the remains of a design where each
frame could have its own topology. `insert_frame(time)` opens with

```js
if (this.frame !== undefined) return this.frame;  // for now, let's not allow multiple topologies
```

so exactly one frame (time 0) is ever created, and `change_time()` reads `this.frames[0]`
directly. `framelist`, `editveid` and `editmode` are leftovers from the same design and do not
control anything today.

## 3. How time flows

`Scene.change_time(ctx, time, _update_animation = true)`:

1. Ignores no-ops and `NaN`; clamps to `time >= 1`.
2. Sets `window._wait_for_draw` and requests a viewport redraw.
3. `ctx.frameset.change_time(time, _update_animation)`.
4. `ctx.state.onFrameChange(ctx, time)`.
5. `this.dag_update("on_time_change", true)`.

The `frame` property in the data API (`SceneStruct.int("time", "frame", "Frame")`, range
1..10000) has a change callback that *restores the old value* and then routes through
`change_time`, so every UI edit of the frame number goes down the same path.

`SplineFrameSet.change_time(time, _update_animation = true)` is where the work happens:

1. `update_frame()` first — flush any pending keys for the frame you are *leaving* (§4).
2. Mirror per-path select/hide state into the animdata.
3. For each drawspline vertex with a `VertexAnimData`, `v.load(vdata.evaluate(time)!)`.
4. Ask `kcache` whether this frame's solved output is cached; load it if so (§7), otherwise flag
   `UPDATE` and `spline.solve()`.
5. Store `this.spline`, `this.time`, `this.frame`, then `update_visibility()`.

Frame 1 is the first frame; a time of 0 is never a real frame.

## 4. Keying

There are no explicit "insert key" markers in the artwork. Instead, editing a vertex sets
`SplineFlags.FRAME_DIRTY` on it, and `update_frame()` turns dirty vertices into keyframes on the
current frame:

```js
let is_first = time <= 1;
let dofirst  = is_first && !(v.eid in this.vertex_animdata);

if (!(force_update || dofirst || (v.flag & SplineFlags.FRAME_DIRTY))) continue;

let vdata  = this.get_vdata(v.eid);
let update = vdata.update(v, time);

v.flag &= ~SplineFlags.FRAME_DIRTY;
if (update) spline.flagUpdateKeyframes(v);
```

Two consequences: on frame 1 every vertex gets a path whether you touched it or not, and
elsewhere only dirty vertices are keyed. `get_vdata(eid, auto_create = true)` creates the
`VertexAnimData` on demand.

`VertexAnimData.update(co, time)` decides what to do with the new position:

- refuses negative times;
- creates `startv` at time 1 if the path is empty;
- `find_seg(time)` locates the bracketing segment;
- past the end (or before the start) it appends with `make_vertex` / `make_segment`;
- if an endpoint already sits on exactly this time it just moves it;
- otherwise `spline.split_edge(seg)` and the new vertex gets this time.

It returns whether the geometry actually moved (threshold 0.01), which is what gates
`flagUpdateKeyframes`.

`KeyCurrentFrame` (toolpath `spline.key_current_frame`) is the manual version: flag every
selected vertex `FRAME_DIRTY`, run `update_frame()`, then `regen_sort()` and `solve()` the
pathspline.

### Editing the paths directly

When the active spline is the pathspline, you are dragging keyframes in space. `download()` and
`on_ctx_update(ctx)` push the other direction: evaluate every path at `this.time` and write the
result into the drawspline vertices. `on_ctx_update` runs this whenever `ctx.spline ===
this.pathspline`, so moving a path vertex updates the artwork live.

## 5. Evaluation

`VertexAnimData.evaluate(time)` returns a cached `Vector2`:

1. Walk the path to find the segment bracketing `time` (clamping at both ends).
2. `t = (time - pt) / (vt - pt)` where `pt`/`vt` are the two keyframe times.
3. If `STEP_FUNC` is set, snap `t` to 0 or 1 — constant interpolation.
4. `co.load(s.evaluate(lastv === s.v1 ? t : 1 - t))`, i.e. sample the cubic segment, reversing
   the parameter when the walk traverses the segment backwards.

Step 2 is linear *in time along the segment's parameter*, which is not the same as linear in
arc length — a curved motion path with widely-spaced keys will ease unevenly. The file contains
a full REDUCE derivation of an arc-length cubic reparameterization and computes `tt` from it,
but the line that would use it,

```js
//t = (tt - pt) / (vt-pt);
```

is commented out, so `tt` is discarded. Keep the derivation: it is the reference for finishing
that work.

`derivative(time)` is a finite difference with `df = 0.001`; it is what velocity-sensitive code
(tangent display, future easing) asks for.

## 6. Path bookkeeping

Motion paths accumulate in a single spline, so `SplineFrameSet` carries a small maintenance
suite:

| Method | Job |
|---|---|
| `check_vdata_integrity(veid?)` | Verify animdata still points at live pathspline vertices |
| `check_paths()` | Whole-frameset sweep of the above |
| `find_orphan_pathverts()` | Path vertices no longer owned by any animdata |
| `fix_anim_paths()` | Repair what the two above find |
| `has_coincident_verts()` | Detect duplicate keys at the same time |
| `create_path_from_adjacent(v, s)` | Seed a new path from a neighbour's motion |
| `rationalize_vdata_layers()` | Re-assign paths to their own layers |

On the `VertexAnimData` side, `check_time_integrity()` calls `regen_topology()`, which sorts the
path's vertices by time, kills the old segments, rebuilds them in order and migrates the handle
positions — the fix for a path whose keys got out of chronological order. `remove(v)` dissolves
interior keys, kills endpoints, re-seats `startv`, and marks the animdata `dead` when nothing is
left.

### Visibility

Each path gets its own spline **layer** so it can be hidden independently, plus one shared temp
layer (`templayerid`) used for drawing. `update_visibility()` and `set_visibility(vd_eid, state)`
drive the layer set; `on_spline_select(element, state)` and `sync_vdata_selstate(ctx)` keep
`VDAnimFlags.SELECT` in step with the drawspline selection, so selecting a vertex reveals its
path when `switch_on_select` is on.

## 7. The keyframe cache

`SplineKCache` memoizes solved output per frame: `SplineKCacheItem {data, time, hash}` where
`data` is `spline.export_ks()` bytes and `hash` is computed from the vertex positions
(`calchash`). `change_time()` calls `has(time, spline)` and, on a hit, `load()`s the bytes
instead of re-solving.

Two caveats:

- `revalidate()` passes `time` where an `eid` is expected, so it has never actually removed an
  entry — invalidation relies on the hash mismatching.
- `loadSTRUCT` does `this.kcache = new SplineKCache()` with the note *"XXX kcache is being buggy,
  for now don't load from disk"*. The cache is therefore always cold after a file load.

## 8. Playback

`FairmotionScreen` (`src/editors/editor_base.ts`) owns playback:

- `togglePlayback()` pushes/pops `ModalStates.PLAYING`.
- `update()` advances one frame when `dt > 1000.0 / scene.fps` (default 24), tracking
  `_lastFrameTime`, then runs `the_global_dag.exec()`.
- Hotkeys: **Space** toggles playback, **Escape** stops it, **Ctrl-Left/Right** step frames via
  `anim.nextprev`.

Playback is just repeated `change_time`, so everything in §3 runs per frame; the kcache is what
keeps that affordable.

## 9. The eventdag

Animation changes are broadcast through `the_global_dag` sockets rather than direct calls:

| Socket | Fired by |
|---|---|
| `on_time_change` | `Scene.change_time` |
| `on_vert_change`, `on_vert_add`, `on_vert_remove` | `Spline` topology/geometry edits |
| `on_keyframe_insert` | `Spline.flagUpdateKeyframes(v)` |
| `on_vert_time_change` | `Spline.flagUpdateVertTime(v)`, i.e. `set_vtime` |
| `on_select_add` / `on_select_sub` | selection ops |
| `on_solve` | after a spline solve |

The dopesheet subscribes to all of these; see [dopesheet.md](dopesheet.md).

## 10. Drawing motion paths

`View2DHandler.do_draw_viewport()` draws paths when `frameset.draw_anim_paths` is set (exposed
as `View2DHandlerStruct.bool("draw_anim_paths", ...)`): for each selected drawspline vertex it
calls `vdata.draw(g, matrix, alpha, frameset.time)`, then activates the temp layer and draws the
pathspline itself. With the option off it still solves the pathspline, silently.

`VertexAnimData.draw()` steps `dt = 1` from `start_time` to `end_time`, emitting a polyline plus
a tangent tick per frame. The tick code sets `dv[2] = dv[3] = NaN` — a faithful reproduction of
an original bug — so `normalize()` yields `NaN` and the ticks never appear. The polyline does
render.

## 11. Serialization

`SplineFrameSet` STRUCT fields: `idgen, frames, vertex_animdata, cur_frame, editmode, editveid,
time, framelist, pathspline, selectmode, draw_anim_paths, templayerid`. Note the drawspline is
not in that list — it rides along inside `frames`.

`VertexAnimData` STRUCT fields: `eid, flag, animflag, cur_time, layerid, startv_eid, dead`. The
keyframes themselves are pathspline geometry, so they are saved with the pathspline; only the
`time` customdata layer makes them keyframes.

Undo for animation edits snapshots *both* splines — see the helpers in
`src/editors/viewport/spline_editops.ts`.

## 12. The generic channel system (unused)

`src/core/animdata.ts` also defines a datapath-driven animation system that nothing currently
builds:

- `AnimKey extends DataPathWrapperNode` — `id, flag, time, handles, mode, data (a ToolProperty),
  owner_eid, channel`; `dag_get_datapath()` yields `datalib.items[<lib_id>].animkeys[<id>]`.
- `AnimChannel` — a sorted `keys[]` plus `proptype` and a data API `path`, with
  `add/remove/update(time, val)/evaluate(time)`.
- `DataBlock.lib_anim_channels` / `lib_anim_idgen` / `lib_anim_idmap` in `src/core/lib_api.ts`
  hold them per block.
- `AppState.onFrameChange(ctx, time)` walks every block's channels and calls
  `ctx.api.setValue(ctx, ch.path, ch.evaluate(time))`.

Since nothing constructs an `AnimChannel`, `onFrameChange` is a no-op. `AnimKeyTypes.DATAPATH`,
the dopesheet's `DataPathKeyItem` (which throws) and `src/core/animutil.ts`'s empty
`iterAnimCurves()` stub are all part of the same unfinished feature. Vertex animation
(`AnimKeyTypes.SPLINE`) is the only thing that works.

## 13. Known gaps

- One topology for the whole shot; `frames`/`framelist`/`editmode`/`editveid` are vestigial.
- Interpolation is linear in segment parameter; the arc-length reparameterization is derived but
  disabled (§5). `STEP_FUNC` is the only interpolation option exposed
  (`InterpStepModeOp`, toolpath `spline.toggle_step_mode`); `AnimInterpModes`
  (`STEP`/`CATMULL`/`LINEAR`) is otherwise unused.
- `SplineKCache.revalidate()` never removes entries, and the cache is dropped on load (§7).
- Motion-path tangent ticks draw as `NaN` (§10).
- `spline.restrict` is never populated for path splines (§1).
- The datapath channel system is scaffolding only (§12).
