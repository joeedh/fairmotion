/* stroker_eval.ts is the stroker's geometry rewritten over a StrokeScene, and
   its header claims the scene-side twins are bit-identical to the
   SplineSegment methods they replace -- not close, identical.  This is the spec
   that holds it to that, over every segment of the sample files.

   It compares two independently written implementations: the reference methods
   walk the spline graph (width chains are inactive out here, so width() falls
   through to widthWalk()), while the twins read flat arrays the extract filled.
   See src/core/debug_api.ts strokerEvalParity() for why the call order matters,
   and docs/plans/draw-refactor.md stage 4. */

import { expect, test } from "@playwright/test";

import { openApp, sampleBytes, SAMPLE_FILES } from "./fixtures.js";

test.describe("stroker eval parity", () => {
  for (const file of SAMPLE_FILES) {
    test(`scene twins match the segment methods: ${file}`, async ({ page }) => {
      await openApp(page);
      await page.evaluate((bytes) => window.__fm.loadFile(bytes), sampleBytes(file));

      const r = await page.evaluate(() => window.__fm.strokerEvalParity(9));

      if (r.skipped) {
        test.skip(true, "no spline");
        return;
      }

      console.log("parity", file, r.segs, "segs", r.total, "comparisons", r.noNet, "no net");

      /* A run that compared nothing would report no failures. */
      expect(r.segs).toBeGreaterThan(0);
      expect(r.total).toBeGreaterThan(0);

      /* Every segment the drawer strokes must have a slot. */
      expect(r.noSlot).toBe(0);

      expect({ bad: r.bad, diag: r.diag }).toEqual({ bad: [], diag: undefined });
    });
  }
});
