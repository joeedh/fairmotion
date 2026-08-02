//try to keep in sync with SplineTypes
export let EditModes = {
  VERT     : 1,
  EDGE     : 2,
  HANDLE   : 4,
  FACE     : 16,
  OBJECT   : 32,
  GEOMETRY : 1|2|4|16
};

//XXX no longer used?
export let EditorTypes = {
  SPLINE : 1,
  OBJECT : 32
};

export let SessionFlags = {
  PROP_TRANSFORM : 1
};
