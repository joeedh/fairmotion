/* Both workers now import these rather than re-declaring them; they used to
   carry hand-copied duplicates, which is how NOFILL came to exist in
   vectordraw_canvas2d_worker but not here. */

export const OPCODES = {
  LINESTYLE   : 0,
  LINEWIDTH   : 1,
  FILLSTYLE   : 2,
  BEGINPATH   : 3,
  CLOSEPATH   : 4,
  MOVETO      : 5,
  LINETO      : 6,
  RECT        : 7,
  ARC         : 8,
  CUBIC       : 9,
  QUADRATIC   : 10,
  STROKE      : 11,
  FILL        : 12,
  SAVE        : 13,
  RESTORE     : 14,
  TRANSLATE   : 15,
  ROTATE      : 16,
  SCALE       : 17,
  SETBLUR     : 18,
  SETCOMPOSITE: 19,
  CLIP        : 20,
  DRAWIMAGE   : 21,
  PUTIMAGE    : 22,
  SETTRANSFORM: 23,
  NOFILL      : 24,
};

export const MESSAGES = {
  NEW_JOB      : 0,
  ADD_DATABLOCK: 1,
  SET_COMMANDS : 2,
  RUN          : 3,

  ERROR       : 10,
  RESULT      : 11,
  ACK         : 12,
  CLEAR_QUEUE : 13,
  CANCEL_JOB  : 14,
  WORKER_READY: 15,
};

export let CompositeModes = {
  "source-over": 0,
  "source-atop": 1,
};
