"use strict";

/* The animated document, split across src/core/frameset/.

   frame.ts holds SplineFrame, one whole spline stamped with a time.  kcache.ts
   holds the solved-curvature cache that makes timeline scrubbing cheap.
   all_splines.ts iterates every spline a frameset owns.  frameset.ts holds
   SplineFrameSet itself, which ties those to the per-vertex motion paths that
   animspline.ts defines.

   This file stays as the import path everything else already uses. */

export * from "./animspline";

export { SplineFrame } from "./frameset/frame.js";
export { EidTimePair, SplineKCache, SplineKCacheItem } from "./frameset/kcache.js";
export { AllSplineIter } from "./frameset/all_splines.js";
export { SplineFrameSet } from "./frameset/frameset.js";
