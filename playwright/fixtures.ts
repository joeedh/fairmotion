import {expect, type Page} from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export const REPO_ROOT = path.resolve(import.meta.dirname, "..");
export const SCREENSHOT_DIR = path.join(REPO_ROOT, "playwright", "screenshots");
export const BASELINE_DIR = path.join(REPO_ROOT, "playwright", "baseline");

/* Committed .fmo fixtures, read off disk by sampleBytes(). Both must be tracked —
   an untracked working-tree file would make the suite unreproducible. */
export const SAMPLE_FILES = ["examples/Panda.fmo", "love and thunder.fmo"];

/* The editors the smoke spec walks, keyed by `define().areaname`. */
export const EDITORS = [
  "view2d_editor",
  "curve_editor",
  "dopesheet_editor",
  "console_editor",
  "material_editor",
  "opstack_editor",
  "settings_editor",
  "menubar_editor",
];

export interface Snapshot {
  editors: string[];
  counts: Record<string, number | string>;
  toolpath?: string;
}

export interface PathEntry {
  path: string;
  kind: string;
  propType?: string;
  structName?: string;
}

export interface Sweep {
  total: number;
  ok: string[];
  failed: {path: string; error: string}[];
}

declare global {
  interface Window {
    __fm: {
      ready(timeout?: number): Promise<boolean>;
      waitIdle(timeout?: number): Promise<boolean>;
      getPath(path: string): unknown;
      setPath(path: string, value: unknown): boolean;
      execTool(toolpath: string, args?: Record<string, unknown>): unknown;
      listTools(): string[];
      listEditors(): string[];
      switchEditor(name: string): Promise<boolean>;
      walkPaths(maxDepth?: number): PathEntry[];
      sweepPaths(maxDepth?: number): Sweep;
      snapshot(): Snapshot;
      canvasReport(): {id?: string; width: number; height: number; distinct?: number}[];
      loadFile(bytes: number[]): Promise<Snapshot>;
      saveFile(): number[];
    };
  }
}

/*
 * Open the app and wait for it to be interactive.
 *
 * localStorage is cleared first: a stale autosave blob from a previous
 * path.ux is deserialization-incompatible and crashes startup.
 */
export async function openApp(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on("pageerror", (err) => errors.push(String(err.message ?? err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      /* storage disabled */
    }
  });

  await page.goto("/");
  await page.waitForFunction(() => typeof window.__fm !== "undefined", undefined, {timeout: 60000});
  await page.evaluate(() => window.__fm.ready());
  await page.evaluate(() => window.__fm.waitIdle());

  return errors;
}

export async function shot(page: Page, name: string): Promise<void> {
  fs.mkdirSync(SCREENSHOT_DIR, {recursive: true});
  await page.screenshot({path: path.join(SCREENSHOT_DIR, `${name}.png`)});
}

export function readBaseline<T>(name: string): T | undefined {
  const file = path.join(BASELINE_DIR, `${name}.json`);
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as T) : undefined;
}

export function writeBaseline(name: string, value: unknown): void {
  fs.mkdirSync(BASELINE_DIR, {recursive: true});
  fs.writeFileSync(path.join(BASELINE_DIR, `${name}.json`), JSON.stringify(value, null, 2) + "\n");
}

/*
 * Compare against a committed baseline, or record one when it is missing.
 * Set FM_UPDATE_BASELINE=1 to re-record after an intentional change.
 */
export function expectBaseline(name: string, value: unknown): void {
  const existing = readBaseline<unknown>(name);

  if (existing === undefined || process.env.FM_UPDATE_BASELINE) {
    writeBaseline(name, value);
    return;
  }

  expect(value).toEqual(existing);
}

/*
 * Console errors are compared against a recorded baseline rather than
 * required to be empty: today's app emits a few during startup file
 * conversion, and pretending otherwise would make the suite useless as a
 * before/after comparison.
 */
export function expectNoNewErrors(name: string, errors: string[]): void {
  const normalized = [...new Set(errors.map((e) => e.split("\n")[0].trim()))].sort();
  expectBaseline(`errors-${name}`, normalized);
}

export function sampleBytes(name: string): number[] {
  return Array.from(fs.readFileSync(path.join(REPO_ROOT, name)));
}
