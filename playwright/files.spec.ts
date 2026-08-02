import {expect, test} from "@playwright/test";
import {SAMPLE_FILES, expectBaseline, expectNoNewErrors, openApp, sampleBytes, shot} from "./fixtures";

/*
 * A .fmo that stops loading is the failure mode a large nstructjs jump
 * produces, and it shows up as a load error rather than a build error.
 */
for (const name of SAMPLE_FILES) {
  const slug = name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  test(`loads ${name}`, async ({page}) => {
    const errors = await openApp(page);
    const bytes = sampleBytes(name);

    const snap = await page.evaluate((data) => window.__fm.loadFile(data), bytes);

    expect(typeof snap.counts.verts).toBe("number");
    expect(snap.counts.verts as number).toBeGreaterThan(0);

    expectBaseline(`file-${slug}`, snap.counts);
    await shot(page, `file-${slug}`);

    expectNoNewErrors(`load-${slug}`, errors);
  });

  test(`round-trips ${name}`, async ({page}) => {
    await openApp(page);
    const bytes = sampleBytes(name);

    const before = await page.evaluate((data) => window.__fm.loadFile(data), bytes);
    const saved = await page.evaluate(() => window.__fm.saveFile());

    expect(saved.length).toBeGreaterThan(0);

    const after = await page.evaluate((data) => window.__fm.loadFile(data), saved);

    expect(after.counts).toEqual(before.counts);
  });
}
