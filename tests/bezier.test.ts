import {describe, expect, it} from "vitest";
import {bez3, bez4, dbez4, ibez4, lenbez4} from "../src/util/bezier.js";

/* Pure math, no app state — this is the part of the port a typechecker
   cannot vouch for, so pin the numbers. */
describe("bezier basis", () => {
  it("interpolates endpoints exactly", () => {
    expect(bez3(0, 1, 2, 0)).toBeCloseTo(0, 12);
    expect(bez3(0, 1, 2, 1)).toBeCloseTo(2, 12);
    expect(bez4(0, 1, 2, 3, 0)).toBeCloseTo(0, 12);
    expect(bez4(0, 1, 2, 3, 1)).toBeCloseTo(3, 12);
  });

  it("reduces to a line for evenly spaced control points", () => {
    for (const s of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      expect(bez4(0, 1, 2, 3, s)).toBeCloseTo(3*s, 12);
      expect(bez3(0, 1, 2, s)).toBeCloseTo(2*s, 12);
    }
  });

  it("has a derivative matching a finite difference", () => {
    const eps = 1e-6;

    for (const s of [0.2, 0.5, 0.8]) {
      const fd = (bez4(0, 3, -1, 4, s + eps) - bez4(0, 3, -1, 4, s - eps))/(2*eps);
      expect(dbez4(0, 3, -1, 4, s)).toBeCloseTo(fd, 4);
    }
  });

  it("integrates back to the curve", () => {
    const eps = 1e-6;
    const fd = (ibez4(0, 3, -1, 4, 0.5 + eps) - ibez4(0, 3, -1, 4, 0.5 - eps))/(2*eps);

    expect(fd).toBeCloseTo(bez4(0, 3, -1, 4, 0.5), 4);
  });

  it("measures arc length of a straight cubic", () => {
    /* Control points evenly spaced along x: length to s is 3*s. */
    expect(lenbez4(0, 0, 1, 0, 2, 0, 3, 0, 1)).toBeCloseTo(3, 3);
    expect(lenbez4(0, 0, 1, 0, 2, 0, 3, 0, 0.5)).toBeCloseTo(1.5, 3);
  });
});
