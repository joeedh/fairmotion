# Report: Polynomial Clothoid Implementations

Scope: every place in the tree that implements or consumes the "polynomial clothoid"
(polynomial-curvature spiral) curve primitive that Fairmotion's spline segments are built on.

## 1. The concept as implemented here

A segment is not stored as a Bezier. It is stored as a **curvature function** `k(s)` over the
unit interval `s ∈ [0,1]`, plus a normalizing scale/rotation/offset. The geometry is recovered by
integrating

```
theta(s) = ∫ k(s) ds
x(s)     = ∫ sin(theta(s)) ds
y(s)     = ∫ cos(theta(s)) ds
```

A true clothoid has `k` linear in arclength. Here `k` is a **polynomial** of order `ORDER` (a
generalized/polynomial clothoid, sometimes called a polynomial spiral). The curvature polynomial
coefficients are the per-segment `ks[]` array; the endpoints of `ks[]` are the free variables the
constraint solver drives to make adjacent segments G2-continuous.

Because the integral has no closed form, `x`/`y` are obtained by a **stepped Taylor-expansion
quadrature** (`approx()`), not by Fresnel integrals.

## 2. Files

| File | Role |
|---|---|
| `src/curve/spline_math_hermite.js` | **The real implementation.** Curvature/theta polynomials, `approx()` integrator, constraint construction, solve driver. |
| `src/curve/spline_math.js` | Thin façade: re-exports `spiraltheta`/`spiralcurvature`/`approx`, defines the `ks[]` index layout, implements `eval_curve()` (normalization), and dispatches `do_solve` to WASM or JS. |
| `src/wasm/spline.h` | C++ mirror of the order-4 polynomial + `approx()` + `eval_curve()`/`eval_curve_dv()`. |
| `src/wasm/solver.cc` | C++ mirror of the constraint solver (tangent/curvature continuity). |
| `src/curve/solver.js` | Generic JS numeric constraint solver (finite-difference Jacobian + projection). |
| `src/curve/solver_new.js` | Alternate/unused solver variant. |
| `src/curve/spline_types.js` | `SplineSegment.evaluate/derivative/curvature/theta` — the public API on top of the clothoid. |
| `src/curve/curve.js`, `src/curve/curvebase.js` | **Dead stub API.** An abstract `CurveInterface`/`ClothoidInterface` with an unimplemented `evaluate()`. Not wired into anything. |
| `src/curve/spower curvature function.reduce`, `bernstein_generator.reduce`, `reduce thing 2.reduce`, `arc curve power series*.txt`, `curve series tests.reduce` | REDUCE CAS derivations that generated the closed-form polynomials pasted into the JS/C++. |

## 3. The curvature representations

`spline_math_hermite.js` contains **three** parameterizations of `k(s)`, of which only one is live.

### 3a. Bernstein / Bezier form (`*_BEZ`, dead)
`POLYTHETA_BEZ`, `POLYCURVATURE_BEZ`, `POLYCURVATURE_BEZ_DV` (lines 42–47). Four control
curvatures `k1..k4` as a cubic Bezier in curvature space. Retained but unused in JS; the
equivalent `#ifndef SPOWER_K` branch in `src/wasm/spline.h:24` is compiled out.

### 3b. S-power / Hermite form (`*_SBEZ`, **live**)
Lines 48–54. Parameters are `k1, k2` (endpoint curvatures) and `dv1_k1, dv1_k2` (endpoint
curvature derivatives) — i.e. a **cubic Hermite in curvature space**. This is the "hermite
clothoid" the file header names. `theta` is the exact analytic integral of that cubic (a quartic).
These are the macros used inside `approx()`.

### 3c. `polytheta_spower` / `polycurvature_spower` / `polycurvature_dv_spower` (live)
Lines 56–134. Same S-power family, but switched on `order` ∈ {2, 4, 6}, so the code can in
principle run degree-2 (linear curvature = classic clothoid), degree-4 (cubic curvature, the
default), or degree-6 (quintic curvature). Exported as `spiraltheta`, `spiralcurvature`,
`spiralcurvature_dv` and consumed by `SplineSegment`.

`ORDER = 4` (`spline_math_hermite.js:19`) with the comment *"keep in sync with WASM!
wasm/spline.h"* — `#define ORDER 4` at `src/wasm/spline.h:8`. The `ks[]` slot meaning at order 4
is `[k1, dv1_k1, dv1_k2, k2]`.

Note `polycurvature_spower` destructures `ks` for the order-6 layout at the top of the function
before the `switch` re-destructures per order; the order-6 case relies on that outer binding. It
works but is fragile.

### `ks[]` layout
Two slightly different layouts exist:

* `spline_math_hermite.js`: `KSCALE=5, KANGLE=6, KSTARTX=7, KSTARTY=8, KSTARTZ=9, KTOTKS=10`.
* `spline_math.js`: same first five, then adds `KV1X..KV2Y` (10–13) for the WASM solver, `KTOTKS=14`.
* `src/wasm/spline.h`: `KTOTKS = ORDER+6 = 10` — matches the hermite file, **not** `spline_math.js`.

`spline_math_hermite.js:28` assigns `window.KSCALE = KSCALE` with the comment *"XXX circular
dependency between solver.js and here"*; `solver.js` reads the global `KSCALE` at line 246. This
is a genuine load-order hazard.

## 4. The integrator: `approx()`

`spline_math_hermite.js:185`. Integrates `(sin θ, cos θ)` over `[0, s1]`:

* Splits into `INT_STEPS` (default 4, settable via `set_int_steps`) uniform sub-intervals.
* At each sub-interval midpoint it evaluates `θ`, `k`, `dk/ds`, and `d²k/ds²` (the second
  derivative by finite difference with `df = 1e-4` — the analytic
  `polycurvature_dv2_spower` was written but is commented out at lines 137–160).
* It then advances `x`, `y` by a **5th-order Taylor polynomial** in the step size `ds`, using
  the Frenet relations `x'' = -y'·k`, `y'' = x'·k` to express higher derivatives in terms of
  `k, dk, d²k`. Those long expressions at lines 216–224 are machine-generated by REDUCE.

So accuracy is O(ds⁵) per step with only 4 steps — cheap and smooth, which is what an
interactive solver needs, but it is an approximation, and it is the reason nearly every
downstream call multiplies `s` by `1 - 1e-7` (line 186) to stay off the endpoint.

The C++ `approx()` (`spline.h:57`) is **not** the same order: it uses `INT_STEPS 6` and only a
**2nd-order** Taylor step (lines 77–78), and it uses the `_BEZ` macro names bound to the S-power
formulas. JS and WASM therefore produce slightly different geometry for the same `ks[]`. There
is also a dead `FAST_INT_STEPS`/`ONE_INT_STEPS` pair in the JS (lines 171–172).

## 5. Normalization: `eval_curve()`

`spline_math.js:56` (C++ twin at `spline.h:90`). The integral above yields a curve in its own
canonical frame. To pin it to the segment's two endpoints:

1. `approx()` at `s = -0.5+ε` and `s = 0.5-ε` gives the canonical start and end.
2. `ang = atan2(v2-v1) - atan2(end-start)` → stored in `ks[KANGLE]`.
3. `scale = |v2-v1| / |end-start|` → stored in `ks[KSCALE]` (this is also `segment.length`).
4. Canonical start → `ks[KSTARTX/Y]`.
5. Evaluation is then `approx(s) - start`, rotated by `-ang`, scaled, translated to `v1`.

Consequences worth knowing:

* `SplineSegment.length` is this scale factor, i.e. a *chord-normalized* arclength, not a true
  arclength.
* `eval_curve` **mutates `ks[]`** as a side effect. Callers that only want `KSCALE`/`KANGLE`
  refreshed call it with `angle_only = 1` (see `spline_types.js:1308, 1323, 1357`).
* The `no_update` branch in the JS version reads `start[0]` before `start` is assigned —
  `start` is `undefined` there, so that path throws. Only the `!no_update` path is exercised.
  The C++ version initializes `start` as a local array so it does not have the bug (but its
  `eval_curve_dv` forces `if (1 || !no_update)`, i.e. always recomputes).
* `eval_curve` dispatches to `native_api.evalCurve` when WASM is ready, unless
  `DEBUG.no_native` / `DEBUG.no_nativeEval`. Note the JS call site passes 8 arguments
  (`seg, s, v1, v2, ks, angle_only, no_update` after dropping `order`) while
  `native_api.evalCurve` is declared `(seg, s, v1, v2, ks, no_update=false)` — the
  `angle_only` argument lands in the `no_update` slot.

## 6. Segment-level API (`spline_types.js`)

* `evaluate(s)` — remaps `s∈[0,1]` to `[-0.5, 0.5]`, calls `eval_curve`. With multires enabled it
  instead walks the `_evalwrap` / curve-effect chain.
* `derivative(s)` — analytic: `(sin(θ+ang), cos(θ+ang)) * KSCALE`. No finite differencing.
* `curvature(s)` / `curvature_dv(s)` — `spiralcurvature(s)/KSCALE`, i.e. de-normalized back to
  world units.
* `theta(s)` — `spiraltheta(s) * KSCALE` (the `*KSCALE` here is dimensionally odd, since θ is an
  angle; suspect but harmless for its only uses).
* `normal`, `offset_eval`, `evaluateSide`, `curvatureSide` build on those. `curvatureSide` falls
  back to triple finite differencing because the offset curve has no closed form.
* `update_aabb()` samples 8 points — an approximation, since a clothoid can bulge past its samples.

## 7. Solving (fitting `ks[]` to the mesh)

`build_solver()` in `spline_math_hermite.js:244` builds a constraint system over all segments
flagged `UPDATE`:

* `hard_tan_c` — segment tangent must match a manual handle direction.
* `tan_c` — tangent continuity between two segments at a shared vertex (`acos` of dot product).
* `curv_c_spower` / `curv_c_spower_basic` — G2: pushes endpoint curvatures of the two segments
  toward their average, weighted by `ratio² * gk * 0.7` where `ratio` is the shorter/longer
  `KSCALE`. Note this is a *relaxation applied inside the residual function*, not a pure
  residual — the constraint mutates `ks[]` and also returns an error. Both loops are written
  `for (i = 0; i < 1; i++)`, so only the 0th derivative is constrained; the higher-derivative
  branches (`i === 1`, `else`) in `curv_c_spower_basic` are unreachable.
* `handle_curv_c` — a hard curvature clamp; registered nowhere (commented out at lines 561–568)
  and still contains a `console.log(k1, k2)`.

`solver.js` then runs Gauss-Seidel-ish projection: for each constraint, finite-difference the
gradient w.r.t. each `ks[i]` (`df = 3e-6`), then step `ks[k] -= r/|g|² * g[k] * ck * gk * mul`,
where `mul = 1/(1+ks[KSCALE])^0.25` is described in-source as a *"stupid hack to suppress
numerical instability"*. Segments at the boundary of the updated region (`edge_segs`) are
restored from `_last_ks` each iteration so they act as fixed boundary conditions.

`solve_intern` runs 65 steps; `solve_pre` zeroes `ks[]` for fully-updated segments first (a cold
restart), which is why dragging a vertex can visibly re-fit its neighbourhood.

The WASM path (`src/wasm/solver.cc`, driven by `native_api.do_solve`) is a straight port of the
same constraints and the same `mul` hack (`solver.cc:460`), and is preferred when
`config.USE_WASM` and the module is ready.

## 8. Where clothoid evaluation is approximated downstream

* `spline_query.js:124` — face hit-testing subdivides each segment into 4 line samples
  ("subdivide clothoids 4 times").
* `spline_draw_new.js` — stroking samples 7–16 points per segment and fits cubic Beziers
  through them (see the stroking report).
* `SplineSegment.intersect()` — 5-step polyline approximation.

## 9. Summary of issues found

1. **Dead code**: `curve.js` / `curvebase.js` define an unimplemented `ClothoidInterface`
   registered into `CurveInterfaces` that nothing consumes. `curvebase.js` also still uses the
   old pre-TS annotation syntax (`Array<double> p1`) that the current preprocessor path may not
   accept. Both files are candidates for deletion.
2. **JS/WASM divergence**: different `INT_STEPS` (4 vs 6) and different Taylor order (5th vs 2nd)
   in `approx()`, plus a `KTOTKS` mismatch between `spline_math.js` (14) and `spline.h` (10).
   Geometry will differ subtly depending on whether WASM is active.
3. **`eval_curve` `no_update` branch is broken** in JS (`start` used before assignment).
4. **Argument mismatch** between `eval_curve` and `native_api.evalCurve` (`angle_only` vs
   `no_update`).
5. **Global leak** `window.KSCALE` to work around a circular import between `solver.js` and
   `spline_math_hermite.js`.
6. **Order 2 / 6 are unreachable in practice** — `ORDER` is a module constant and the WASM side
   is `#define`d to 4, so the order-6 polynomials are carried but never exercised.
7. `polycurvature_dv2_spower` is commented out; `approx()` finite-differences the 2nd curvature
   derivative instead, which is the weakest link in an otherwise analytic integrand.
8. `console.log` left in `curv_c_spower`'s dead sibling `handle_curv_c`.
