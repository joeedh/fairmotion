/* Golden output for the draw pipeline, one row per retained path: draw order,
   command-stream hash, colour, blur, clip count.  Deliberately key-independent
   -- rows are sorted by z and content, never by path key -- because stage 4 of
   the draw refactor renames every key it touches (see src/curve/draw/path_key.ts)
   and an oracle keyed on those would report a diff for every rename.

   This is what says a refactor of the drawer changed nothing that reaches the
   rasterizer.  It has teeth: moving one vertex by three units changes the hash.
   Re-record deliberately, with FM_UPDATE_BASELINE=1, and only when the diff is
   an intended change in output. */

import { test } from "@playwright/test";

import { expectBaseline, openApp, sampleBytes, SAMPLE_FILES } from "./fixtures.js";

test.describe("path dump", () => {
  for (const file of SAMPLE_FILES) {
    test(`matches the recorded baseline: ${file}`, async ({ page }) => {
      await openApp(page);
      await page.evaluate((bytes) => window.__fm.loadFile(bytes), sampleBytes(file));

      const r = await page.evaluate(() => window.__fm.pathDump());
      const name = file.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

      console.log("paths", file, r.paths.length, r.hash);

      expectBaseline(`paths-${name}`, r);
    });
  }

  /* The stroke-debug overlays are drawn by the stroker like everything else and
     are as easy to break, but nothing else looks at them: the toggle is off in
     every other test.  This baseline was recorded after the stroker moved out
     of the drawer, so it locks the overlays going forward rather than proving
     that move left them alone. */
  for (const file of SAMPLE_FILES) {
    test(`matches the recorded baseline with stroke debug on: ${file}`, async ({ page }) => {
      await openApp(page);
      await page.evaluate((bytes) => window.__fm.loadFile(bytes), sampleBytes(file));

      const r = await page.evaluate(() => window.__fm.pathDump(true));
      const name = file.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

      console.log("debug paths", file, r.paths.length, r.hash);

      expectBaseline(`paths-debug-${name}`, r);
    });
  }
});
