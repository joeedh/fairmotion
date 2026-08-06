# The Dopesheet Editor

The timeline: one row per animated thing, one box per keyframe.

The short version: `DopeSheetEditor` is a hybrid. The **channel list** on the left is real DOM —
a `TreePanel` of collapsible `TreeItem` rows built from path.ux widgets — while the **key area**
on the right is hand-drawn to a canvas from a flat `Float64Array`-adjacent array of key boxes,
with a bucketed pick grid for hit testing. Keys are not objects; a key *is* a vertex of the
pathspline plus its `time` customdata (see [animation.md](animation.md)).

## The pieces

| Topic | Code |
|---|---|
| The editor | `DopeSheetEditor` — `src/editors/dopesheet/DopeSheetEditor.ts` |
| Channel rows | `TreeItem`, `TreePanel`, `ChannelState` — same file |
| Current ops | `src/editors/dopesheet/dopesheet_ops_new.ts` |
| Legacy ops (dead) | `src/editors/dopesheet/dopesheet_ops.ts` |
| Legacy phantom ids (dead) | `src/editors/dopesheet/dopesheet_phantom.ts` |
| Transform data (never registered) | `src/editors/dopesheet/dopesheet_transdata.ts` |
| Tool registration | imported for side effects in `src/entry_point.ts` |
| Context lookup | `ctx.dopesheet` — `src/core/context.ts` |

## 1. Layout

Two halves, in one editor:

- **Left — the channel tree.** `TreePanel` holds `TreeItem`s keyed by data path, added with
  `add_path()`. Items collapse (`is_collapsed`), and their vertical positions come from the DOM:
  `channels.get_y(path)` reads the laid-out row offset. Tree open/closed state persists via
  `saveTreeData()` / `loadTreeData()`. The CSS ids are `dopesheet-treeitem-x` and
  `dopesheet-treepanel-x`.
- **Right — the key canvas.** Everything else — the frame ruler, the playhead, the key diamonds,
  the highlight — is drawn by `draw()` directly.

The two halves must agree on row Y, which is why the build is two-stage (§3).

## 2. Keys as a flat array

There is no `Key` class in the hot path. `keyboxes` is a flat numeric array, `KTOT` entries per
key:

```js
const KX = 0, KY = 1, KW = 2, KH = 3,
      KEID = 5, KTYPE = 6, KFLAG = 7,
      KTIME = 9, KEID2 = 10, KTOT = 11;
```

`KEID` is the drawspline vertex (the channel the key belongs to) and `KEID2` is the pathspline
vertex (the key itself) — ops address keys by the `(type, eid2)` pair. `KTYPE` is meant to hold
an `AnimKeyTypes` value but is never actually written; it reads as 0, which happens to equal
`AnimKeyTypes.SPLINE`, so today it is right by accident.

Hit testing uses `KeyGrid`, a `Float64Array` tagged with `width`, `height`, `ratio` and a `gen`
counter. It is a uniform bucket grid over the key area: each cell holds key indices, so a mouse
position maps to a handful of candidates instead of a linear scan. `ActiveBoxes` is a
`number[]` carrying a `highlight` field — the currently hovered set.

## 3. Building

`build()` sets `regen = 2` and schedules `stage2` through `window.setTimeout(stage2, 155)`.

The delay is not cosmetic. `stage2` needs `channels.get_y(path)` for every row, and those Y
offsets only exist once the browser has laid out the DOM rows that `build()` just created. 155 ms
is a guess that has held; it is the most fragile thing in the file.

`update()` avoids rebuilding by comparing `calcUpdateHash()` — a hash over selection counts,
`spline.updateGen` and the canvas size — and separately watches for pan changes and style-key
changes.

## 4. Projection

```js
project(p)   { return (p + pan) * zoom; }
unproject(p) { return p / zoom - pan; }
```

`draw()`, however, computes `x * zoom + pan[0]` — pan applied *after* the scale, the opposite
order. The two only agree because `zoom` never leaves 1.0 in practice. Fix both together if zoom
is ever wired up.

`timescale` (`DopeSheetEditorStruct.float("timescale", ...)`) is the horizontal frames-to-pixels
factor and is the control that actually varies.

## 5. Mouse and keys

Mouse down, in order:

1. If something is highlighted → `SelectKeysOp` with `(AnimKeyTypes.SPLINE, eid2)` pairs.
   Candidates must be within 1 frame horizontally and 1 pixel vertically. Shift switches the mode
   to ADD/SUB instead of replace.
2. Otherwise → scrub: `scene.change_time(...)` follows the mouse.
3. A drag past 10 px starts `MoveKeyFramesOp`.
4. Middle button, or Alt held → `PanOp`.

`PanOp` is broken: its `modalStart` never chains to `super`, so the modal never actually starts
and panning does nothing.

`define_keymap()`:

| Key | Action |
|---|---|
| A | toggle select all |
| X / Delete | `anim.delete_keys()` |
| G | grab (move keys) |
| Ctrl-Z / Ctrl-Shift-Z | undo / redo |
| Left / Right | ±1 frame |
| Up / Down | ±10 frames |

## 6. Header

`init()` builds the header strip: start/end-of-range icon buttons (which currently only
`console.log`), previous/next keyframe buttons bound to `anim.nextprev` with `dir = ±1`, a play
button that calls `ctx.screen.togglePlayback()`, and two data-API widgets for `scene.frame` and
`dopesheet.timescale`.

## 7. Staying in sync

`linkEventDag()` subscribes the editor to:

- `scene.on_time_change` — move the playhead.
- spline verts `on_select_add` / `on_select_sub` — channel list follows the selection.
- spline `on_vert_change`, `on_keyframe_insert` — a key may have appeared or moved.
- pathspline `on_vert_time_change` — a key changed frame (this is what `set_vtime` fires).

`selected_only` (a bool property on the editor) filters the channel list to selected vertices.

## 8. Ops

`src/editors/dopesheet/dopesheet_ops_new.ts` is the live set. It is built on `AnimKeyTool`, a
base class that:

- iterates keys with an `iterKeys()` generator yielding `KeyIterItem`s (`VertKeyIterItem` for
  vertex animation; `DataPathKeyItem` exists but throws — see
  [animation.md §12](animation.md#12-the-generic-channel-system-unused));
- takes an explicit `keyList` input plus a `useKeyList` bool, so a tool can either operate on the
  current selection or on a caller-supplied list — that is what makes the ops replayable from the
  undo stack;
- records undo as `[eid, time, flag, x, y]` tuples per key, restoring both the frame number and
  the path vertex position.

| Op | Purpose |
|---|---|
| `ToggleSelectAll` | select/deselect all keys (`SelModes`) |
| `SelectKeysOp` | click/box selection (`SelModes2`: replace / add / sub) |
| `MoveKeyFramesOp` | drag keys in time |
| `NextPrevKeyFrameOp` | jump the playhead to the neighbouring key |
| `DeleteKeysOp` | `anim.delete_keys()` |

Everything the editor UI invokes lives here.

## 9. The dead legacy layer

Three files remain from the previous dopesheet and are **not reachable from the UI**:

- **`dopesheet_ops.ts`** — `ShiftTimeOp2`, `ShiftTimeOp3`, `SelectOpBase`, `SelectOp`,
  `ColumnSelect`, `SelectKeysToSide`, `ToggleSelectOp`, `DeleteKeyOp`. These address keys by
  *phantom id* rather than by `(type, eid2)`.
- **`dopesheet_phantom.ts`** — the phantom-id scheme itself:
  `KeyTypes = {PATHSPLINE: 1<<29, DATAPATH: 1<<30, CLEARMASK: ~(...)}` packs a key type into the
  high bits of an id, with `get_time` / `set_time` / `get_select` / `set_select` / `delete_key`
  as the accessors. `FilterModes` lives here too.
- **`dopesheet_transdata.ts`** — `TransDopeSheetType`, a transform-system data adapter that is
  never listed in any `TransformOp`'s `types`, so it has never run. Key moves go through
  `MoveKeyFramesOp` instead.

`src/entry_point.ts` imports all three modules for their side effects, so the legacy tools are
still *registered* (path.ux registers `ToolOp` subclasses that supply a `tooldef().toolpath`) and
their toolpaths still resolve — they are simply never invoked. Deleting them means dropping the
imports too.

## 10. Serialization

`DopeSheetEditor` STRUCT fields: `pan, zoom, timescale, selected_only, pinned_ids, treeData`.
`treeData` is the saved collapse state from `saveTreeData()`; `pinned_ids` keeps channels visible
regardless of `selected_only`.

## 11. Known gaps

- `PanOp` never starts (§5) — the key area cannot be panned.
- `project()` and `draw()` disagree about pan/zoom order; masked by `zoom === 1` (§4).
- `KTYPE` is never written; correct only because `AnimKeyTypes.SPLINE === 0` (§2).
- `build()` depends on a 155 ms `setTimeout` to read DOM row offsets (§3).
- The start/end header buttons only `console.log` (§6).
- The whole phantom-id op family and `TransDopeSheetType` are dead code (§9).
- Only vertex animation is shown; datapath channels would need `DataPathKeyItem` implemented.
