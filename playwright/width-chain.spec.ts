/*
 * SplineSegment.width() reads a control net that width_chain.ts resolves once
 * per draw pass; widthWalk() is the reference implementation it replaces. The
 * two must agree bit for bit -- that exactness is what makes the cache safe to
 * sit under the whole stroker. See docs/plans/draw-refactor.md stage 2.
 */
import {expect, test} from "@playwright/test";

import {openApp, sampleBytes, SAMPLE_FILES} from "./fixtures.js";

test.describe("width chains", () => {
  for (const file of SAMPLE_FILES) {
    test(`match the reference walk: ${file}`, async ({page}) => {
      await openApp(page);
      await page.evaluate((bytes) => window.__fm.loadFile(bytes), sampleBytes(file));

      const settled = await page.evaluate(() => window.__fm.widthNetParity(21));

      expect(settled.bad).toBe(0);
      expect(settled.total).toBeGreaterThan(100);

      /* And again with the geometry a step ahead of the solved arc lengths. */
      const moved = await page.evaluate(() => window.__fm.widthNetParity(21, 25.0));

      expect(moved.bad).toBe(0);
      expect(moved.total).toBe(settled.total);
    });
  }
});
