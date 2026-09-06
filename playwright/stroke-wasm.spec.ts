/* Stage 6f's gate: the C++ stroker, in the app's own wasm module, against the
   JS stroker it is a port of.

   Everything below it already has a harness -- src/wasm/tests/ builds the same
   headers natively and through emscripten and checks them against recordings.
   What none of those can reach is the boundary this stage adds: the scene
   described to C++ by pointer instead of by dump, the trims written in place on
   both sides of it, and the outlines handed back as views onto the heap the
   stroker appended into.  That is what runs here, and only here.

   Equality and not tolerance.  6e measured the port's geometry against the
   recording at 0.000e+00 over 40,504 doubles through emscripten, because the
   recording's own coordinates came out of a wasm evaluator -- so there is one
   libm in play and the answer is exact.  A coordinate that differs at all is
   therefore a real disagreement, and ptMax is reported so a near-miss reads
   differently from a structural break.

   See docs/plans/draw-refactor.md stage 6f. */

import { expect, test } from "@playwright/test";

import { openApp, sampleBytes, SAMPLE_FILES } from "./fixtures.js";

test.describe("stroke wasm", () => {
  for (const file of SAMPLE_FILES) {
    test(`the wasm stroker agrees with the JS one: ${file}`, async ({ page }) => {
      await openApp(page);
      await page.evaluate((bytes) => window.__fm.loadFile(bytes), sampleBytes(file));

      const r = await page.evaluate(() => window.__fm.strokeWasmParity());

      if (r.skipped) {
        test.skip(true, r.reason);
        return;
      }

      console.log(
        "wasm parity",
        file,
        `${r.calls} calls, ${r.outlines} outlines,`,
        `trims ${r.trimMax}, points ${r.ptMax}`
      );

      /* Without the native evaluator both sides would be the JS one. */
      expect(r.native).toBe(true);

      /* A fallback is not a failure in itself -- it is what the gate is for --
         but if every call took it this test compared nothing. */
      expect(r.fellBack).toBe(0);
      expect(r.calls).toBeGreaterThan(0);
      expect(r.outlines).toBeGreaterThan(0);

      expect(r.trimMax).toBe(0);
      expect(r.trimsEqual).toBe(true);

      expect(r.firstBad).toBe(null);
      expect(r.rowsEqual).toBe(true);
      expect(r.ptMax).toBe(0);
    });
  }
});
