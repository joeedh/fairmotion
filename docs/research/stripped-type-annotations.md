# Stripped C-style type annotations

The legacy `extjs_cc` transpiler accepted C-style typed parameters —
`pack_int(Array<byte> data, int i)`. That syntax is not valid TypeScript, so
phase 4 of the TypeScript port removed it. This file records what was removed,
so the annotations can be reapplied as real TS types later instead of being
rediscovered from scratch.

Nothing here is authoritative: these were hand-written hints the transpiler
mostly did not enforce, and some are wrong. Treat them as the original author's
intent, not as a specification.

**266 parameters across 21 files.**

Return annotations (`function f(x) : Vector2`) were *not* stripped — that form
is already valid TypeScript syntax. Note though that several name types which do
not exist in TS (`int`, `float`, `double`, `byte`, `short`); those still need
mapping to `number` before the typechecker is turned on.

## Type frequency

| Type | Count | Likely TS equivalent |
|---|---|---|
| `Array<float>` | 41 | `number[]` |
| `int` | 26 | `number` |
| `double` | 23 | `number` |
| `Array<byte>` | 18 | `number[]` |
| `unpack_ctx` | 17 | — |
| `DataView` | 15 | — |
| `TransData` | 15 | — |
| `ToolContext` | 14 | — |
| `Array<double>` | 8 | `number[]` |
| `CurveData` | 8 | — |
| `float` | 7 | `number` |
| `Matrix4` | 7 | — |
| `T` | 6 | — |
| `String` | 5 | `string` |
| `Boolean` | 5 | `boolean` |
| `MinMax` | 5 | — |
| `TransDataItem` | 4 | — |
| `ObjLit` | 4 | — |
| `Array<TransDataItem>` | 4 | — |
| `WebGLRenderingContext` | 3 | — |
| `AppSettings` | 3 | — |
| `Context` | 3 | — |
| `MyMouseEvent` | 3 | — |
| `Vector3` | 2 | — |
| `Function` | 2 | `(...args: any[]) => any` |
| `Object` | 2 | `object` |
| `Iterator<T>` | 2 | — |
| `short` | 1 | `number` |
| `byte` | 1 | `number` |
| `Vector2` | 1 | — |
| `Vector4` | 1 | — |
| `Quat` | 1 | — |
| `DataBlock` | 1 | — |
| `Array<String>` | 1 | `string[]` |
| `ObjectMap` | 1 | — |
| `UploadJob` | 1 | — |
| `SettUploadManager` | 1 | — |
| `MultiResLayer` | 1 | — |
| `GArray` | 1 | — |
| `ColorTheme` | 1 | — |
| `MouseEvent` | 1 | — |

## By file

### src/core/ajax.js

- L93: `String str`
- L110: `Array<byte> data`, `int i`
- L130: `Array<byte> data`, `short i`
- L148: `Array<byte> data`, `byte i`
- L153: `Array<byte> data`, `float f`, `Boolean lendian`
- L170: `Array<byte> data`, `float f`, `Boolean lendian`
- L189: `Array<byte> data`, `Vector2 vec`, `Boolean lendian`
- L200: `Array<byte> data`, `Vector3 vec`
- L212: `Array<byte> data`, `Vector4 vec`
- L223: `Array<byte> data`, `Quat vec`
- L233: `Array<byte> data`, `Matrix4 mat`
- L245: `Array<byte> data`, `DataBlock b`
- L263: `Array<byte> data`, `String str`, `int length`
- L326: `Array<byte> data`, `String str`
- L343: `DataView data`, `unpack_ctx uctx`, `int len`
- L351: `DataView data`, `unpack_ctx uctx`, `Function unpacker`
- L363: `DataView data`, `unpack_ctx uctx`, `Function unpacker`
- L375: `DataView data`, `unpack_ctx uctx`
- L383: `DataView data`, `unpack_ctx uctx`
- L391: `DataView data`, `unpack_ctx uctx`
- L399: `DataView data`, `unpack_ctx uctx`
- L407: `DataView data`, `unpack_ctx uctx`
- L415: `DataView data`, `unpack_ctx uctx`
- L423: `Array<byte> data`, `unpack_ctx uctx`
- L431: `DataView data`, `unpack_ctx uctx`
- L445: `Array<byte> data`, `unpack_ctx uctx`
- L456: `Array<byte> data`, `unpack_ctx uctx`
- L466: `Array<byte> data`, `unpack_ctx uctx`
- L478: `DataView data`, `unpack_ctx uctx`, `int length`
- L501: `DataView data`, `unpack_ctx uctx`, `int length`
- L530: `DataView data`, `unpack_ctx uctx`

### src/core/icon.js

- L8: `WebGLRenderingContext gl`, `String sheet_path`, `Array<float> imgsize`, `Array<float> iconsize`
- L20: `WebGLRenderingContext gl`
- L43: `int tile`
- L50: `int tile`
- L69: `int tile`, `Array<float> texcos`

### src/core/raster.js

- L66: `WebGLRenderingContext gl`

### src/core/units.js

- L61: `Array<String> suffices`, `float cfactor`, `int grid_subd_1`, `int grid_subd_2`, `ObjectMap attrs`

### src/core/UserSettings.js

- L432: `DataView data`
- L433: `DataView data`
- L522: `AppSettings settings`
- L542: `UploadJob job`
- L559: `AppSettings settings`
- L567: `AppSettings settings`, `SettUploadManager uman`

### src/curve/curvebase.js

- L42: `Array<double> p1`, `Array<float> p2`, `Array<float> t1`, `Array<float> t2`, `double k1`, `double k2`, `double s`, `CurveData cdata`
- L48: `Array<double> p1`, `Array<float> p2`, `Array<float> t1`, `Array<float> t2`, `double k1`, `double k2`, `double s`, `CurveData cdata`
- L64: `Array<double> p1`, `Array<float> p2`, `Array<float> t1`, `Array<float> t2`, `double k1`, `double k2`, `double s`, `CurveData cdata`
- L80: `Array<double> p1`, `Array<float> p2`, `Array<float> t1`, `Array<float> t2`, `double k1`, `double k2`, `double s`, `CurveData cdata`
- L90: `Array<double> p1`, `Array<float> p2`, `Array<float> t1`, `Array<float> t2`, `double k1`, `double k2`, `double s`, `CurveData cdata`
- L102: `Array<double> p1`, `Array<float> p2`, `Array<float> t1`, `Array<float> t2`, `double k1`, `double k2`, `double s`, `CurveData cdata`
- L114: `Array<double> p1`, `Array<float> p2`, `Array<float> t1`, `Array<float> t2`, `double k1`, `double k2`, `Array<float> p`, `CurveData cdata`
- L121: `Array<double> p1`, `Array<float> p2`, `Array<float> t1`, `Array<float> t2`, `double k1`, `double k2`, `double s`, `CurveData cdata`

### src/curve/spline_multires.js

- L411: `MultiResLayer owner`
- L613: `int level`
- L617: `int level`, `Array<float> co`
- L657: `int id`
- L668: `int newsize`

### src/datafiles/theme.js

- L68: `Array<float> color`, `Array<float> weights`
- L128: `String key`, `GArray value`
- L187: `ColorTheme newtheme`

### src/editors/dopesheet/dopesheet_transdata.js

- L19: `ToolContext ctx`, `TransData td`, `TransDataItem item`, `Matrix4 mat`, `float w`
- L22: `ToolContext ctx`, `TransData td`, `ObjLit undo_obj`
- L25: `ToolContext ctx`, `ObjLit undo_obj`
- L28: `ToolContext ctx`, `TransData td`
- L34: `ToolContext ctx`, `TransData td`, `Array<TransDataItem> data`
- L37: `ToolContext ctx`, `TransData td`, `Array<TransDataItem> data`
- L74: `TransData td`, `MinMax minmax`
- L97: `ToolContext ctx`, `TransData td`, `TransDataItem item`, `MinMax minmax`

### src/editors/menubar/MenuBar.js

- L13: `Context ctx`
- L56: `Context ctx`

### src/editors/viewport/multires/multires_selectops.js

- L162: `int pid`, `int level`

### src/editors/viewport/multires/multires_transdata.js

- L16: `ToolContext ctx`, `TransData td`, `Array<TransDataItem> data`
- L50: `ToolContext ctx`, `TransData td`, `TransDataItem item`, `Matrix4 mat`, `float w`
- L72: `ToolContext ctx`, `TransData td`, `ObjLit undo_obj`
- L98: `ToolContext ctx`, `ObjLit undo_obj`
- L120: `ToolContext ctx`, `TransData td`
- L123: `ToolContext ctx`, `TransData td`, `Array<TransDataItem> data`
- L127: `Context ctx`, `TransData td`, `MinMax minmax`
- L183: `ToolContext ctx`, `TransData td`, `TransDataItem item`, `MinMax minmax`

### src/editors/viewport/transform.js

- L254: `TransData td`, `MinMax minmax`

### src/editors/viewport/view2d_spline_ops.js

- L856: `Boolean add_title`

### src/editors/viewport/view2d.js

- L1339: `MouseEvent e`

### src/util/colorutils.js

- L11: `Array<float> clr`, `float last_hue`
- L55: `Array<float> hsva`, `Array<float> ret`, `float last_hue`

### src/util/mathlib.js

- L393: `Array<float> pos`, `Array<float> size`, `Array<float> margin`
- L1087: `Array<float> v1`, `Array<float> v2`, `Array<float> v3`, `Array<float> v4`
- L1249: `Matrix4 mat`
- L1254: `Matrix4 mat`
- L1262: `Matrix4 mat`
- L1268: `Matrix4 mat`

### src/util/strutils.js

- L62: `int maxlen`

### src/util/touchevents.js

- L8: `MyMouseEvent event`
- L24: `MyMouseEvent event`
- L39: `int i`
- L43: `int i`
- L47: `MyMouseEvent event`

### src/util/utils.js

- L91: `int count`
- L114: `int count`
- L137: `Object input`
- L147: `int a`, `int b`
- L155: `Array<byte> data`
- L163: `T item`
- L191: `int index`, `T item`
- L200: `T item`
- L204: `int idx`
- L219: `T item`, `Boolean ignore_existence`
- L244: `T olditem`, `T newitem`
- L306: `Object obj`
- L328: `Iterator<T> iter`
- L357: `Iterator<T> iter`
- L1197: `Vector3 no`

### src/webgl/webgl.js

- L459: `int i`

## C-style typed *variable* declarations

Separate from parameters, the transpiler also accepted `var <Type> <name> = ...;`
at statement level. All seven live sites were in one file. Type stripped, name and
initializer untouched.

### src/util/utils.js

| Line | Was | Now |
|---|---|---|
| 86 | `var int debug_int_1 = 0;` | `var debug_int_1 = 0;` |
| 223 | `var int idx = this.indexOf(item);` | `var idx = ...` |
| 248 | `var int idx = this.indexOf(olditem);` | `var idx = ...` |
| 381 | `var Function g_list = list;` | `var g_list = list;` |
| 1202 | `var StupidRandom2 seedrand = new StupidRandom2();` | `var seedrand = ...` |
| 1385 | `var Array<float> __v3d_g_s = [];` | `var __v3d_g_s = [];` |
| 1455 | `var ObjMap<String> _bt_h = {` | `var _bt_h = {` |

(Line numbers are pre-edit; the `static`-local hoisting in the same file shifts them.)

## Second sweep (found during phase 3)

The phase 4.1 greps were line-oriented, and prettier had already reformatted a
number of these declarations across two lines (`static\n  x = ...;`,
`global\n  name;`). Those sites survived the first pass and only surfaced when
esbuild refused to parse them. Anchor future sweeps on `^\s*static\s*$` and
`^\s*global\s+\w` as well as the single-line forms.

### `static` locals missed by the first pass

Same alias treatment as phase 4.1: a module-scope `const _<Class>_<func>_<var>`
holding the original initializer, plus `const <var> = _<Class>_<func>_<var>;` as
the first line of the function body. No references renamed.

| File | Function | Variable |
|---|---|---|
| `src/editors/viewport/manipulator.js` | `ManipHandle.update()` | `min`, `max` |
| `src/editors/viewport/manipulator.js` | `ManipCircle.update()` | `min`, `max` |
| `src/editors/viewport/manipulator.js` | `ManipulatorManager.get_render_rects()` | `nil` |
| `src/curve/spline_base.js` | `CustomDataSet.interp()` | `srcs2` |
| `src/curve/spline_types.js` | `SplineLoopPath.update_winding()` | `cent` |
| `src/curve/spline_types.js` | `SplineLoopPath.update_aabb()` | `minmax` |

### `global x;` declarations missed by the first pass

As in phase 4.1 these emit nothing; deleting them is behavior-preserving.

| File | Identifier | Resolution |
|---|---|---|
| `src/core/toolops_api.js` | `defined_classes` | both references qualified to `window.defined_classes` |
| `src/core/AppState.js` | `startup_file` | already a real import at L142; line deleted |
| `src/editors/app_ops.js` | `_dom_input_node` | module-scope `var` in the same file; line deleted |

### Annotations in expression position

The transpiler accepted a type after an assignment's right-hand side. That is not
valid TypeScript in any form, so the annotation was dropped outright.

| File | Was | Now |
|---|---|---|
| `src/core/AppState.js` | `this.tokens = {} : ObjectMap;` | `this.tokens = {};` |
| `src/core/lib_api.js` | `this.ret = undefined : IterRet<T>;` | `this.ret = undefined;` |
| `src/core/ajax.js` | `this.progress = 0 : float;` | `this.progress = 0;` |
| `src/editors/events.js` | `this.owner = undefined : EventHandler;` | `this.owner = undefined;` |

### `: function` → `: Function`

The lowercase `function` is a keyword, not a type name, and TypeScript rejects it
in type position. Rewritten to the `Function` type. 28 sites across 12 files:
`console.js` (2), `solver.js`, `data_api.js`, `struct.js`, `lib_utils.js` (2),
`sceneobject.js` (2), `lib_api.js` (4), `splinetool.js` (3), `pentool.js` (3),
`mathlib.js`, `spline.js` (2), `spline_base.js` (6).

### Two more C-style typed parameters

| File | Was | Now |
|---|---|---|
| `src/util/strutils.js` | `truncate_utf8(Array<byte>arr, maxlen)` | `truncate_utf8(arr, maxlen)` |
| `src/util/colorutils.js` | `rgba_to_hsva(clr, Array<float>ret=undefined, last_hue=0)` | `rgba_to_hsva(clr, ret=undefined, last_hue=0)` |

Both were written without a space between type and name, which is why the
266-parameter sweep's pattern missed them.
