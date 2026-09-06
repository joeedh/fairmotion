/* OutlineBuffer -- what the stroker returns.

   The other half of the boundary StrokeScene opens: the stroker reads flat
   arrays describing a document and writes flat arrays describing outlines, so
   the whole of it can move behind a wasm call with only two buffers crossing.
   See docs/plans/draw-refactor-plan-final-notes.md stage 4.

   An *outline* is one owner's worth of geometry in one role -- the pair that
   names a retained path (`path_key.ts`), and the pair the assembler maps back
   onto one.  It holds a command stream rather than a point list because that is
   what the backend paths take and what the trimming produces: a stroke group's
   outline is a moveTo, a run of cubics, and a lineTo or two where a break in
   the tangents interrupts them.  Storing points and re-deriving the commands
   would be lossy in exactly the places the stroker works hardest.

   Layout.  Three parallel arrays, appended to and never rewritten:

     cmds      one byte per command (OutCmd)
     pts       2 doubles for MOVE and LINE, 6 for CUBIC, in command order
     outlines  seven ints: owner, role, the two half-open ranges, and a finish

   The ranges are what makes playback a loop over a slice instead of a search,
   and what a C++ implementation would hand back as offsets into the same
   memory.  Nothing here knows what a colour or a material is: styles belong to
   the assembler until the scene carries them. */

import type { PathRole } from "./path_key.js";

export const enum OutCmd {
  MOVE = 0,
  LINE = 1,
  CUBIC = 2,
}

/* Doubles each command consumes, indexed by OutCmd. */
const CMD_PTS = [2, 2, 6];

/* How the assembler is to realize a finished outline.  A stroke group's
   outlines carry NONE -- what to do with them follows from the role, and the
   drawer has known it all along -- but a join chooses between a fill and a
   stroke from geometry only the producer has, so it has to say. */
export const enum OutFinish {
  NONE = 0,
  FILL = 1,
  STROKE = 2,
}

export const OUTLINE_I = 7;

export const enum OutlineI {
  OWNER = 0,
  ROLE = 1,
  CMD0 = 2,
  CMD1 = 3,
  PT0 = 4,
  PT1 = 5,
  FINISH = 6,
}

export class OutlineBuffer {
  cmds: Uint8Array = new Uint8Array(0);
  pts: Float64Array = new Float64Array(0);
  outlines: Int32Array = new Int32Array(0);

  cmdCount = 0;
  ptCount = 0;
  count = 0;

  /* The outline begin() opened, or -1.  end() is implicit: opening the next one
     closes it, and so does reading the buffer. */
  private open = -1;

  reset(): OutlineBuffer {
    this.cmdCount = 0;
    this.ptCount = 0;
    this.count = 0;
    this.open = -1;

    return this;
  }

  begin(owner: number, role: PathRole): OutlineBuffer {
    this.closeOpen();

    if ((this.count + 1) * OUTLINE_I > this.outlines.length) {
      this.outlines = grow32(this.outlines, (this.count + 1) * OUTLINE_I);
    }

    const o = this.count * OUTLINE_I;

    this.outlines[o + OutlineI.OWNER] = owner;
    this.outlines[o + OutlineI.ROLE] = role;
    this.outlines[o + OutlineI.CMD0] = this.cmdCount;
    this.outlines[o + OutlineI.PT0] = this.ptCount;
    this.outlines[o + OutlineI.FINISH] = OutFinish.NONE;

    this.open = this.count;
    this.count++;

    return this;
  }

  moveTo(x: number, y: number) {
    const p = this.cmd(OutCmd.MOVE);

    this.pts[p] = x;
    this.pts[p + 1] = y;
  }

  lineTo(x: number, y: number) {
    const p = this.cmd(OutCmd.LINE);

    this.pts[p] = x;
    this.pts[p + 1] = y;
  }

  cubicTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
    const p = this.cmd(OutCmd.CUBIC);

    this.pts[p] = x1;
    this.pts[p + 1] = y1;
    this.pts[p + 2] = x2;
    this.pts[p + 3] = y2;
    this.pts[p + 4] = x3;
    this.pts[p + 5] = y3;
  }

  /* How the open outline is to be finished; the default is NONE. */
  fill() {
    this.outlines[this.open * OUTLINE_I + OutlineI.FINISH] = OutFinish.FILL;
  }

  stroke() {
    this.outlines[this.open * OUTLINE_I + OutlineI.FINISH] = OutFinish.STROKE;
  }

  /* Appends the opcode and reserves its points, returning where they go. */
  private cmd(op: OutCmd): number {
    if (this.cmdCount + 1 > this.cmds.length) {
      this.cmds = grow8(this.cmds, this.cmdCount + 1);
    }

    const need = CMD_PTS[op];

    if (this.ptCount + need > this.pts.length) {
      this.pts = grow64(this.pts, this.ptCount + need);
    }

    this.cmds[this.cmdCount++] = op;

    const p = this.ptCount;
    this.ptCount += need;

    return p;
  }

  private closeOpen() {
    if (this.open < 0) {
      return;
    }

    const o = this.open * OUTLINE_I;

    this.outlines[o + OutlineI.CMD1] = this.cmdCount;
    this.outlines[o + OutlineI.PT1] = this.ptCount;
    this.open = -1;
  }

  /* Closes whatever is open and returns the buffer ready to read. */
  finish(): OutlineBuffer {
    this.closeOpen();
    return this;
  }

  /* Points this buffer at storage the wasm stroker filled and owns.

     Nothing is copied: the three arrays are views onto the heap the C++ side
     appended into, and everything below here reads rather than writes, so the
     assembler walks them exactly as it walks the ones the JS stroker built.
     Nothing is open -- C++ closed its last outline before publishing -- so a
     finish() from the caller is a no-op rather than a corruption. */
  adoptHeap(
    cmds: Uint8Array,
    pts: Float64Array,
    outlines: Int32Array,
    cmdCount: number,
    ptCount: number,
    count: number
  ): OutlineBuffer {
    this.cmds = cmds;
    this.pts = pts;
    this.outlines = outlines;

    this.cmdCount = cmdCount;
    this.ptCount = ptCount;
    this.count = count;
    this.open = -1;

    return this;
  }

  /* The four fields of outline `i`; call finish() first. */
  owner(i: number): number {
    return this.outlines[i * OUTLINE_I + OutlineI.OWNER];
  }

  role(i: number): PathRole {
    return this.outlines[i * OUTLINE_I + OutlineI.ROLE] as PathRole;
  }

  finishOf(i: number): OutFinish {
    return this.outlines[i * OUTLINE_I + OutlineI.FINISH] as OutFinish;
  }

  /* Whether outline `i` emitted anything.  An empty one is not a path the
     assembler should build. */
  empty(i: number): boolean {
    const o = i * OUTLINE_I;
    return this.outlines[o + OutlineI.CMD1] === this.outlines[o + OutlineI.CMD0];
  }
}

function grow8(src: Uint8Array, need: number): Uint8Array {
  const dst = new Uint8Array(capacity(src.length, need));
  dst.set(src);
  return dst;
}

function grow32(src: Int32Array, need: number): Int32Array {
  const dst = new Int32Array(capacity(src.length, need));
  dst.set(src);
  return dst;
}

function grow64(src: Float64Array, need: number): Float64Array {
  const dst = new Float64Array(capacity(src.length, need));
  dst.set(src);
  return dst;
}

function capacity(have: number, need: number): number {
  let cap = have > 0 ? have : 256;

  while (cap < need) {
    cap *= 2;
  }

  return cap;
}
