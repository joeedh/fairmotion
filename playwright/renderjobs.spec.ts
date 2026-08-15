import {expect, test} from "@playwright/test";
import {expectNoNewErrors, openApp, sampleBytes} from "./fixtures";

/*
 * Cancelling in-flight render jobs must settle them, not orphan them.
 *
 * A cancelled job's RESULT is dropped by Thread.onmessage() -- the msgid ->
 * ownerid map it looks the job up in is gone -- so anything still holding the
 * promise from postRenderJob() waits forever. Batch.gen() is exactly that
 * holder: its .then() clears `pending`, and a batch that never clears `pending`
 * keeps CanvasDraw2D.draw()'s promise from ever resolving.
 *
 * See docs/plans/draw-refactor.md 7.3.
 */
test("cancelling render jobs mid-draw settles them", async ({page}) => {
  const errors = await openApp(page);

  await page.evaluate((bytes) => window.__fm.loadFile(bytes), sampleBytes("examples/Panda.fmo"));

  const rounds = await page.evaluate(async () => {
    const frame = () => new Promise((r) => requestAnimationFrame(() => r(undefined)));
    const out: {before: number; after: number}[] = [];

    /* Cancel is racing the worker, which turns a tile around in a couple of
       milliseconds. Try repeatedly and let the assertions below require that
       at least one round actually caught a job in flight. */
    for (let i = 0; i < 20; i++) {
      window.complete_viewport_draw();
      await frame();

      const before = window.__fm.renderJobs().outstanding;
      const after = window.__fm.cancelRenderJobs().outstanding;

      out.push({before, after});
    }

    return out;
  });

  const caught = rounds.filter((r) => r.before > 0);
  expect(caught.length, "no render job was ever in flight to cancel").toBeGreaterThan(0);

  for (const round of rounds) {
    expect(round.after, "cancelling left unsettled job promises behind").toBe(0);
  }

  /* And the app is still drawing, rather than wedged on a batch that never
     stopped being `pending`. */
  await page.evaluate(() => window.__fm.waitIdle());

  const canvases = await page.evaluate(() => window.__fm.canvasReport());
  expect(
    canvases.some((c) => (c.distinct ?? 0) > 1),
    "nothing drew after the cancel"
  ).toBe(true);

  expectNoNewErrors("cancel-render-jobs", errors);
});
