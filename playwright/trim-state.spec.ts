/* Trim state -- the stroke trims and mitre points that used to be serialized
   into every .fmo as a `drawdata` cdata layer and now live only in memory, in
   src/curve/trim_state.ts.  See docs/plans/draw-refactor-plan-final-notes.md stage 3.

   Two things are worth a standing check.  Old files must still open and must
   come out of afterSTRUCT() with the dead layer dropped, so a re-save stops
   carrying it.  And a partial redraw -- the normal case, since a frame only
   recomputes the vertices it sees flagged -- must agree with a full one, which
   is what says TrimState.begin() carried the untouched slots forward correctly
   as it renumbered them. */

import { expect, test } from "@playwright/test";

import { openApp, sampleBytes, SAMPLE_FILES } from "./fixtures.js";

test.describe("trim state", () => {
  for (const file of SAMPLE_FILES) {
    test(`trims survive a partial redraw: ${file}`, async ({ page }) => {
      await openApp(page);
      await page.evaluate((bytes) => window.__fm.loadFile(bytes), sampleBytes(file));

      const r = await page.evaluate(() => window.__fm.trimReport());
      console.log(file, JSON.stringify(r));

      /* These strokes do meet at joins, so something must have been trimmed;
         a report of zero would mean the trim pass never ran. */
      expect(r.segments).toBeGreaterThan(0);
      expect(r.trimmed).toBeGreaterThan(0);

      /* Loaded from a file written before stage 3, which does carry it. */
      expect(r.layer).toBe(false);

      const r2 = await page.evaluate(() => window.__fm.trimReport(false));
      console.log(file, "partial", JSON.stringify(r2));

      expect(r2.trimmed).toBe(r.trimmed);
      expect(r2.mitred).toBe(r.mitred);
    });
  }
});
