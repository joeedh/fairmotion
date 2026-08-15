/* The parity gate for the C++ port: a whole document run through the stroker,
   reduced to a digest of the outlines it produced.

   Two separate claims, and the second is the one the port needs.  The digest
   matches a recorded baseline, so a change in geometry is reported.  And a
   scene serialized to stroke_dump's binary format, reloaded, and stroked again
   produces the identical digest -- which is what makes a dumped scene a
   self-contained test case.  Hand that blob and that number to a rewrite and it
   has something to be equal to, with no Spline, no VectorDraw and no DOM in
   the way.

   The round trip also has to be byte-exact in both directions: dump, load, dump
   again, compare.  A field the loader drops would otherwise survive as long as
   the stroker happened not to read it.

   Re-record deliberately, with FM_UPDATE_BASELINE=1, and only when the diff is
   an intended change in output.  See docs/plans/draw-refactor.md stage 5. */

import { expect, test } from "@playwright/test";

import { expectBaseline, openApp, sampleBytes, SAMPLE_FILES } from "./fixtures.js";

test.describe("stroke golden", () => {
  for (const file of SAMPLE_FILES) {
    test(`survives a dump/load round trip and matches the baseline: ${file}`, async ({ page }) => {
      await openApp(page);
      await page.evaluate((bytes) => window.__fm.loadFile(bytes), sampleBytes(file));

      const r = await page.evaluate(() => window.__fm.strokeGolden());

      if (r.skipped) {
        test.skip(true, "no spline");
        return;
      }

      const name = file.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

      console.log(
        "golden",
        file,
        `${r.segs} segs, ${r.groups} groups ->`,
        `${r.live.count} outlines, ${r.live.pts} points,`,
        `hash ${r.live.hash}, ${r.bytes} bytes of scene`
      );

      /* A document that stroked nothing would pass every comparison below. */
      expect(r.segs).toBeGreaterThan(0);
      expect(r.live.count).toBeGreaterThan(0);

      expect(r.roundTrip).toBe(true);

      /* Row by row, not just the total: a digest tells you something broke, the
         rows tell you which outline. */
      expect(r.loaded.rows).toEqual(r.live.rows);
      expect(r.loaded.hash).toBe(r.live.hash);

      /* The evaluator is pinned (§5.6).  Both sides above ran the same one, so
         a run with wasm missing compares JS against JS and proves less than it
         looks like it does -- record which it was. */
      expect(r.native).toBe(true);

      expectBaseline(`stroke-${name}`, {
        native: r.native,
        verts : r.verts,
        segs  : r.segs,
        groups: r.groups,
        live  : r.live,
      });
    });
  }
});
