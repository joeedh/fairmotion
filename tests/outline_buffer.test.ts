import { describe, expect, it } from "vitest";
import { OUTLINE_I, OutFinish, OutlineBuffer, OutlineI } from "../src/curve/draw/outline_buffer.js";
import { hashOutlines } from "../src/curve/draw/outline_hash.js";
import type { PathRole } from "../src/curve/draw/path_key.js";

/* The reference half of a cross-language pin.  src/wasm/tests/outline_buffer.cc
   drives the C++ OutlineBuffer with the same script and asserts the same four
   numbers; whichever implementation drifts, one of the two fails.

   Everything the script feeds the buffer is exact in binary — coordinates are
   eighths — so the digest is byte equality, not a tolerance.  That is the right
   gate here: this layer only copies numbers, and the arithmetic that produces
   them is checked elsewhere (src/curve/stroke_eval_ref.ts). */

/* A 31-bit LCG, chosen because Math.imul and a uint32_t multiply agree on it
   exactly.  Keep in step with the C++ twin. */
class Lcg {
  state = 12345;

  next(): number {
    this.state = (Math.imul(this.state, 1103515245) + 12345) & 0x7fffffff;
    return this.state;
  }

  /* Multiples of an eighth in [-1250, 1250]. */
  coord(): number {
    return ((this.next() % 20001) - 10000) / 8;
  }
}

/* Enough that all three arrays outgrow their first allocation: at these odds
   the script emits ~400 commands, ~1500 doubles and 1400 outline ints. */
const SCRIPT_OUTLINES = 200;

function runScript(out: OutlineBuffer): OutlineBuffer {
  const rng = new Lcg();

  for (let i = 0; i < SCRIPT_OUTLINES; i++) {
    out.begin(i * 7 + 3, (i % 9) as PathRole);

    const n = rng.next() % 6;

    for (let j = 0; j < n; j++) {
      switch (rng.next() % 3) {
        case 0:
          out.moveTo(rng.coord(), rng.coord());
          break;
        case 1:
          out.lineTo(rng.coord(), rng.coord());
          break;
        default:
          out.cubicTo(rng.coord(), rng.coord(), rng.coord(), rng.coord(), rng.coord(), rng.coord());
          break;
      }
    }

    switch (rng.next() % 3) {
      case 1:
        out.fill();
        break;
      case 2:
        out.stroke();
        break;
    }
  }

  return out.finish();
}

/* Recorded from this implementation, and duplicated in the C++ test. */
const EXPECT = { count: 200, cmds: 422, pts: 1436, hash: 828189321 };

describe("outline buffer", () => {
  it("digests the script to the number the C++ port has to reproduce", () => {
    const d = hashOutlines(runScript(new OutlineBuffer()));

    expect({ count: d.count, cmds: d.cmds, pts: d.pts, hash: d.hash }).toEqual(EXPECT);
  });

  it("is unchanged by reusing a buffer", () => {
    const out = runScript(new OutlineBuffer());
    const first = hashOutlines(out);
    const second = hashOutlines(runScript(out.reset()));

    expect(second).toEqual(first);
  });

  it("closes each outline where the next one starts", () => {
    const out = runScript(new OutlineBuffer());

    for (let i = 0; i < out.count; i++) {
      const o = i * OUTLINE_I;

      expect(out.outlines[o + OutlineI.CMD1]).toBeGreaterThanOrEqual(
        out.outlines[o + OutlineI.CMD0]
      );
      expect(out.empty(i)).toBe(
        out.outlines[o + OutlineI.CMD1] === out.outlines[o + OutlineI.CMD0]
      );

      if (i + 1 < out.count) {
        expect(out.outlines[(i + 1) * OUTLINE_I + OutlineI.CMD0]).toBe(
          out.outlines[o + OutlineI.CMD1]
        );
        expect(out.outlines[(i + 1) * OUTLINE_I + OutlineI.PT0]).toBe(
          out.outlines[o + OutlineI.PT1]
        );
      }
    }

    expect(out.outlines[(out.count - 1) * OUTLINE_I + OutlineI.CMD1]).toBe(out.cmdCount);
    expect(out.outlines[(out.count - 1) * OUTLINE_I + OutlineI.PT1]).toBe(out.ptCount);
  });

  it("keeps owner, role and finish where the accessors look for them", () => {
    const out = runScript(new OutlineBuffer());

    for (let i = 0; i < out.count; i++) {
      expect(out.owner(i)).toBe(i * 7 + 3);
      expect(out.role(i)).toBe(i % 9);
      expect(out.finishOf(i)).toBeGreaterThanOrEqual(OutFinish.NONE);
      expect(out.finishOf(i)).toBeLessThanOrEqual(OutFinish.STROKE);
    }
  });
});
