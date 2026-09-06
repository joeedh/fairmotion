/* The spline's element types, and the barrel the rest of the app imports them
   through.

   One class per file under types/: vertices and their width/shift accessors,
   segments and their evaluators, the loop ring that bounds a face, the face,
   the material both share, and the eid-keyed selection set tool operators are
   handed.  spline_base.ts is re-exported too, because that is where the flags,
   the type tags and CustomDataLayer live and almost nothing wants one without
   the other.

   Nothing but re-exports belongs here.  Import a specific module when only one
   type is wanted; import this when several are. */

export * from "./spline_base.js";

export { Material } from "./types/material.js";
export { SplineVertex } from "./types/vertex.js";
export type { SplineVertexJSON, StrokeSide } from "./types/vertex.js";
export { ClosestPointRecord, EffectWrapper, SplineSegment } from "./types/segment.js";
export type { SplineSegmentJSON } from "./types/segment.js";
export { SplineLoop, SplineLoopPath } from "./types/loop.js";
export { SplineFace } from "./types/face.js";
export { ElementRefIter, ElementRefSet } from "./types/element_ref.js";
export { lookupEid, refLoop, refSeg, refVert } from "./types/eid_ref.js";
export type { EidMap } from "./types/eid_ref.js";

import type { SplineFace } from "./types/face.js";
import type { SplineLoop } from "./types/loop.js";
import type { SplineSegment } from "./types/segment.js";
import type { SplineVertex } from "./types/vertex.js";

/* Every concrete SplineElement.  The base class tags itself with a plain
   `number`, but each subclass narrows `type` to a literal, so this union
   discriminates on `.type` where the base class cannot. */
export type AnySplineElement = SplineVertex | SplineSegment | SplineLoop | SplineFace;
