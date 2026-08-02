import {expect, test} from "@playwright/test";
import {EDITORS, expectNoNewErrors, openApp, shot} from "./fixtures";

/*
 * Content-based oracle, not exact pixels: the app starts, every editor mounts,
 * and the viewport draws something other than a flat fill.
 */
test("app starts and the viewport draws content", async ({page}) => {
  const errors = await openApp(page);

  const snap = await page.evaluate(() => window.__fm.snapshot());
  expect(snap.editors.length).toBeGreaterThan(0);
  expect(typeof snap.counts.verts).toBe("number");

  await shot(page, "start");

  const canvases = await page.evaluate(() => window.__fm.canvasReport());
  expect(canvases.length, "no canvas mounted").toBeGreaterThan(0);
  expect(canvases.some((c) => c.width > 0 && c.height > 0), "every canvas is zero-sized").toBe(true);

  /* At least one 2D surface must hold more than a flat fill. */
  const drawn = canvases.filter((c) => c.distinct !== undefined);
  if (drawn.length > 0) {
    expect(drawn.some((c) => (c.distinct ?? 0) > 1), "every 2D canvas is a flat fill").toBe(true);
  }

  expectNoNewErrors("startup", errors);
});

test("every registered editor is present", async ({page}) => {
  await openApp(page);

  const registered = await page.evaluate(() => window.__fm.listEditors());

  for (const name of EDITORS) {
    expect(registered, `${name} missing from areaclasses`).toContain(name);
  }
});

for (const name of EDITORS) {
  test(`editor ${name} mounts and draws`, async ({page}) => {
    const errors = await openApp(page);

    await page.evaluate((editor) => window.__fm.switchEditor(editor), name);
    await page.evaluate(() => window.__fm.waitIdle());
    await shot(page, `editor-${name}`);

    const snap = await page.evaluate(() => window.__fm.snapshot());
    expect(snap.editors).toContain(name);

    expectNoNewErrors(`editor-${name}`, errors);
  });
}
