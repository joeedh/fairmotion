/* The wasm heap is built with ALLOW_MEMORY_GROWTH=1, and growing a
   WebAssembly.Memory detaches every typed-array view onto the old buffer --
   including the `ks` views native_api.checkSegment() hands each segment, which
   the drawer reads on every frame.  Nothing forces growth today, so this spec
   forces it: allocate past the 32 MB initial heap, then check that every
   segment's coefficients are still readable and unchanged.

   See docs/plans/draw-refactor-plan-final-notes.md §5.2.  This stops being a latent bug the
   moment scene arrays live in the heap, which is what stage 4 builds toward. */

import { expect, test } from "@playwright/test";

import { openApp, sampleBytes, SAMPLE_FILES } from "./fixtures.js";

test.describe("wasm heap", () => {
  test(`ks views survive heap growth: ${SAMPLE_FILES[0]}`, async ({ page }) => {
    await openApp(page);
    await page.evaluate((bytes) => window.__fm.loadFile(bytes), sampleBytes(SAMPLE_FILES[0]));

    const r = await page.evaluate(() => window.__fm.heapGrowthCheck());
    console.log("heap", JSON.stringify(r));

    if (r.skipped) {
      test.skip(true, "wasm not available");
      return;
    }

    /* If this stops growing the allocation is no longer past the heap size
       and the check below proves nothing. */
    expect(r.grew).toBe(true);
    expect(r.segments).toBeGreaterThan(0);
    expect(r.reviewed).toBeGreaterThan(0);

    /* A detached view reads as length 0; a moved one reads different bytes. */
    expect(r.detached).toBe(0);
    expect(r.changed).toBe(0);
  });
});
