/* StrokeScene is the flat, persistent view of the spline the stroker reads --
   slots that stay put across passes, an eid -> slot map beside them, and a free
   list.  The plan calls the map "the part most likely to develop bugs" and asks
   for an invariant check; this is that check, run over the sample files.

   It runs twice: once after a full pass, and once after deleting a segment,
   because the second is what exercises the sweep, the free list, and the width
   walk rebuild.  See docs/plans/draw-refactor.md stage 4 and
   src/curve/stroke_scene.ts. */

import { expect, test } from "@playwright/test";

import { openApp, sampleBytes, SAMPLE_FILES } from "./fixtures.js";

test.describe("stroke scene", () => {
  for (const file of SAMPLE_FILES) {
    test(`extract matches the spline: ${file}`, async ({ page }) => {
      await openApp(page);
      await page.evaluate((bytes) => window.__fm.loadFile(bytes), sampleBytes(file));

      const r = await page.evaluate(() => window.__fm.sceneCheck());

      if (r.skipped) {
        test.skip(true, "no spline");
        return;
      }

      console.log("scene", file, r.verts, "verts", r.segs, "segs");

      /* A scene that extracted nothing would satisfy every invariant below. */
      expect(r.segs).toBeGreaterThan(0);
      expect(r.verts).toBeGreaterThan(0);

      expect(r.bad).toEqual([]);
      expect(r.badAfterEdit).toEqual([]);
    });
  }
});
