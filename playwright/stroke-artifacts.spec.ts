/* Writes the inputs the C++ port is tested against, under playwright/artifacts.

   The port has no browser, no wasm loader and no .fmo reader, so everything it
   needs has to arrive as bytes: `<name>.scene` is stroke_dump's blob,
   `<name>.evalref` is what stroker_eval.ts computes from that blob
   (stroke_eval_ref.ts), `<name>.trimref` is what trimmer.ts does to it
   (trim_ref.ts), and `<name>.outref` is the outlines stroker.ts builds from it
   (outline_ref.ts).  src/wasm/tests/ reads them and checks its own arithmetic
   against them.

   They are committed, so the C++ side can be built and run without a browser in
   the loop.  All three are deterministic given the sample file and the wasm
   build, which is why a re-run leaves the tree clean; a diff here means the
   evaluator or the extract changed, and that is worth noticing.

   See docs/plans/draw-refactor.md stage 6. */

import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { openApp, REPO_ROOT, sampleBytes, SAMPLE_FILES } from "./fixtures.js";

const ARTIFACT_DIR = path.join(REPO_ROOT, "playwright", "artifacts");

test.describe("stroke artifacts", () => {
  for (const file of SAMPLE_FILES) {
    test(`records a scene and its references: ${file}`, async ({ page }) => {
      await openApp(page);
      await page.evaluate((bytes) => window.__fm.loadFile(bytes), sampleBytes(file));

      const r = await page.evaluate(() => window.__fm.strokeArtifacts());

      if (r.skipped) {
        test.skip(true, "no spline");
        return;
      }

      /* §5.6 pins the evaluator: a reference recorded without wasm is a
         reference to the wrong function. */
      expect(r.native).toBe(true);

      const name = file.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      const scene = Buffer.from(r.scene, "base64");
      const evalRef = Buffer.from(r.evalRef, "base64");
      const trimRef = Buffer.from(r.trimRef, "base64");
      const outRef = Buffer.from(r.outRef, "base64");

      expect(scene.byteLength).toBeGreaterThan(64);
      expect(evalRef.byteLength).toBeGreaterThan(64);
      expect(trimRef.byteLength).toBeGreaterThan(64);
      expect(outRef.byteLength).toBeGreaterThan(64);

      fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
      fs.writeFileSync(path.join(ARTIFACT_DIR, `${name}.scene`), scene);
      fs.writeFileSync(path.join(ARTIFACT_DIR, `${name}.evalref`), evalRef);
      fs.writeFileSync(path.join(ARTIFACT_DIR, `${name}.trimref`), trimRef);
      fs.writeFileSync(path.join(ARTIFACT_DIR, `${name}.outref`), outRef);

      const sizes = [scene, evalRef, trimRef, outRef].map((b) => b.byteLength).join(" + ");

      console.log("artifacts", file, `${sizes} bytes`);
    });
  }
});
