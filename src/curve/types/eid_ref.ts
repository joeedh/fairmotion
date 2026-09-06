/* Reading a cross-reference field back as the element it names.

   eidmap holds every element kind at once, and after a load or a JSON read the
   cross-reference fields still hold the eids they were written as.  These
   recover the kind the field itself implies.  A missing eid -- the -1 the STRUCT
   schemas write for an absent handle, face or radial link -- comes back
   undefined here exactly as the raw eidmap lookup did, so the fields keep the
   declared type the rest of the code already assumes of them. */

import { SplineLoop } from "./loop.js";
import { SplineSegment } from "./segment.js";
import { SplineVertex } from "./vertex.js";

import type { SplineElement } from "../spline_base.js";

export type EidMap = { [eid: number]: SplineElement };

export function lookupEid(eidmap: EidMap, ref: unknown): SplineElement | undefined {
  return typeof ref === "number" ? eidmap[ref] : undefined;
}

export function refVert(eidmap: EidMap, ref: unknown): SplineVertex {
  let e = lookupEid(eidmap, ref);
  return (e instanceof SplineVertex ? e : undefined)!;
}

export function refSeg(eidmap: EidMap, ref: unknown): SplineSegment {
  let e = lookupEid(eidmap, ref);
  return (e instanceof SplineSegment ? e : undefined)!;
}

export function refLoop(eidmap: EidMap, ref: unknown): SplineLoop {
  let e = lookupEid(eidmap, ref);
  return (e instanceof SplineLoop ? e : undefined)!;
}
