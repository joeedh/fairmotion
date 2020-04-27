export var SelMask = {
  VERTEX   : 1,
  HANDLE   : 2,
  SEGMENT  : 4,
  FACE     : 16,
  //MULTIRES : 32, //not used anymore, slot now used by sceneobject
  TOPOLOGY : 1|2|4|16,
  OBJECT   : 32
};

export var ToolModes = {
  SELECT : 1,
  APPEND : 2,
  RESIZE : 3,
  ROTATE : 4
};
