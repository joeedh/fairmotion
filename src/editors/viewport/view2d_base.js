//try to keep in sync with SplineTypes
export var EditModes = {
  VERT     : 1,
  EDGE     : 2,
  HANDLE   : 4,
  FACE     : 16,
  OBJECT   : 32,
  GEOMETRY : 1|2|4|16
};

export var EditorTypes = {
  SPLINE : 1,
  OBJECT : 32
};

export var SessionFlags = {
  PROP_TRANSFORM : 1
};
