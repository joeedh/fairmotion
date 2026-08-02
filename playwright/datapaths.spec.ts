import {expect, test} from "@playwright/test";
import {expectBaseline, openApp, readBaseline, type PathEntry, type Sweep} from "./fixtures";

/*
 * The backbone of the baseline. Enumerating the registered datapath tree and
 * reading every path catches exactly what a large path.ux bump breaks, with no
 * screenshots and no flake. A path that vanishes is a real regression.
 */
test("the datapath tree matches the recorded baseline", async ({page}) => {
  await openApp(page);

  const paths: PathEntry[] = await page.evaluate(() => window.__fm.walkPaths());

  expect(paths.length).toBeGreaterThan(50);

  const names = paths.map((p) => `${p.kind} ${p.path}`).sort();
  expectBaseline("datapaths", names);
});

test("every datapath still resolves and reads", async ({page}) => {
  await openApp(page);

  const sweep: Sweep = await page.evaluate(() => window.__fm.sweepPaths());
  const prior = readBaseline<Sweep>("datapath-sweep");

  /* Record the pass/fail split rather than demanding zero failures: many
     paths legitimately need an active object or a non-empty list. */
  expectBaseline("datapath-sweep", {
    total : sweep.total,
    ok    : sweep.ok,
    failed: sweep.failed.map((f) => f.path).sort(),
  });

  if (prior) {
    expect(sweep.ok.length, "fewer datapaths read than the baseline recorded").toBeGreaterThanOrEqual(
      prior.ok.length
    );
  }
});

test("the registered tool list matches the recorded baseline", async ({page}) => {
  await openApp(page);

  const tools: string[] = await page.evaluate(() => window.__fm.listTools());

  expect(tools.length).toBeGreaterThan(20);
  expectBaseline("toolpaths", tools);
});
