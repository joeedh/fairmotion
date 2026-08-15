/* Path keys -- what the drawer calls a retained path in the vectordraw backend.

   A path's key used to be its owner's id with tag bits ORed on top: `1 << 17`
   and `1 << 18` for the two vertex-join wedges, `1 << 19` for a wedge's double
   stroke, `1 << 20` for a stroke group's, `8192`/`16384` for stroke debug.
   Owner ids come from `spline.idgen`, the same counter that hands out element
   eids, so the tags only stayed clear of them while the counter was under
   131 072 -- and it counts edit history, not elements, because a stroke group
   burns an id for every chain shape ever seen (`spline_strokegroup.ts:327`).
   See docs/plans/draw-refactor.md P5.

   So the key is composed rather than overlaid: `owner * ROLE_COUNT + role`, an
   injective map for any owner id at all. Owner ids are unique across a document
   -- elements and stroke groups draw from one generator -- so a role means the
   same thing wherever it is used, and two sites can no longer land on one path
   by accident. */

export enum PathRole {
  /* The element's own path: a face's fill, a stroke group's outline. */
  ELEMENT = 0,
  /* The outline-of-the-outline drawn at z+1 when `linewidth2 > 0`. */
  DOUBLE_STROKE = 1,

  /* The wedge that fills the gap between a segment's two stroke sides at a
     join, and its own double stroke. */
  JOIN_V1 = 2,
  JOIN_V2 = 3,
  JOIN_V1_DOUBLE = 4,
  JOIN_V2_DOUBLE = 5,

  /* Stroke debug overlays; the owner says which pass drew them. */
  DEBUG_1 = 6,
  DEBUG_2 = 7,
  DEBUG_3 = 8,
}

/* Roles per owner. Larger than PathRole so adding one does not renumber every
   key in a running document. */
const ROLE_COUNT = 16;

/* A key that no owner and role can produce, for a lookup meant to miss. */
export const NO_PATH = -1;

export function pathKey(owner: number, role: PathRole): number {
  return owner * ROLE_COUNT + role;
}
