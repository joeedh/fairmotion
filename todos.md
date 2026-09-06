## ToDos 

Checkbox markdown list

[ ]: split 'src/curve/spline_draw_new.ts' into smaller files in a new 'src/curve/draw' folder
[ ]: split 'src/curve/spline_types' into smaller files
[ ]: move other draw and stroke-related files in src/curve into src/curve/draw 
[ ]: review src/core/debug_api.ts now that the refactor plan is done, if it's still 
     a large file afterwards split it into smaller ones.
[ ]: split src/core/frameset.ts into a new src/core/frameset directory
[ ]: split src/core/AppState.ts into smaller files in a new src/core/appstate folder
[ ]: refactor src/core/data_api/data_api_define.ts to move data api definitions for classes 
     into `static defineAPI(api: DataAPI, struct?:DataStruct)` methods.  these methods 
     will be designed to chain, e.g. `static defineAPO(api: DataAPI, struct=api.mapStruct(this, true)) { super.defineAPI(api, struct); ...etc}`.  rename existing class static methods that use a similar `apiDefine` name to use `defineAPI`.
[ ] **Scattered per-segment allocation.** Each segment gets its own `_malloc(8 * 16)`. Correct,
	   but strokers walk a chain linearly, so the 128-byte blocks want to be contiguous. An arena
	   per `StrokeScene` (with `ks` slots as indices into it) is the natural fit — an
	   optimization, not a prerequisite, but it is easier to adopt at stage 4 than to retrofit.

[ ] **P8's remaining `update()` refactor.** `SplineDrawer.update()` is still nine positional
	   arguments wide (`spline, drawlist, drawlist_layerids, matrix, redraw_rects,
	   only_render_flag, selectmode, master_g, editor`, plus optional `ignore_layers` and
	   `draw_stroke_debug`), and `updateIntern()` and `fastDraw()` repeat most of the list.
	   Stage 4f of the draw refactor cleared the rest of P8 -- the matrix dance became
	   `beginPass()`, the dead `zoom` parameter went, `update_polygon*` take `(f, drawparams)` --
	   but the signature itself was left because its three callers are outside the file:
	   `spline.ts:2631`, `view2d_ops.ts:299` and `svg_export.ts:84`. Fold the list into a params
	   object the way `DrawParams` already did one level down, and update those three.

[ ] **`SplineVertex.shift`'s datapath binding does not fire.** Reported from testing: shift
	   itself works, but driving it through the data API (for vertex shift-set) does not reach the segments. The
	   binding is `SplineVertexStruct.float("shift", ...)` at `data_api_define.ts:1376`,
	   forwarding to `set shift` at `spline_types.ts:332`, which writes `shift1`/`shift2` on the
	   two segments either side.
	   Not yet diagnosed, but one difference from the `width` binding directly above it is
	   verifiable and would look exactly like this: `set shift` opens with
	   `if (!this.segments || this.segments.length !== 2) return;` and `get shift` likewise
	   answers 0.0 for anything but valence 2 -- so on an endpoint or a junction the slider reads
	   zero and writes nothing, silently. `set width` has no such guard; it loops every segment
	   and only *then* special-cases valence 2. Check which vertex was under test before
	   assuming the callback is the problem.
	   Note also `set __shift` (`spline_types.ts:377`), a second setter with the opposite sign
	   convention on `s.shift1`; work out which one is meant to be live.
[ ]: use an agent to execute the docs/plans/remove-webgl.md plan

