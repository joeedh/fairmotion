import {defineConfig, devices} from "@playwright/test";

/* Force headless chromium onto a software rasterizer so canvas output is the
   same on every machine. The app itself never asks for a GL context. */
const GL_ARGS = [
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--disable-lcd-text",
];

export default defineConfig({
  testDir      : "./playwright",
  fullyParallel: true,
  forbidOnly   : !!process.env.CI,
  retries      : process.env.CI ? 2 : 0,
  /* Four test/build jobs at a time, project-wide -- see vitest.config.ts.
     Undefined here would mean half the CPU count. */
  workers      : process.env.CI ? 1 : 4,
  reporter     : process.env.CI ? "html" : [["list"], ["html", {open: "never"}]],
  timeout      : 120000,
  expect       : {timeout: 30000},
  use          : {
    baseURL  : "http://localhost:5050",
    trace    : "on-first-retry",
    viewport : {width: 1280, height: 800},
    launchOptions: {args: GL_ARGS},
  },
  projects: [
    {
      name: "chromium",
      use : {...devices["Desktop Chrome"], launchOptions: {args: GL_ARGS}},
    },
  ],
  webServer: {
    command            : "pnpm serv 5050",
    url                : "http://localhost:5050",
    reuseExistingServer: !process.env.CI,
    timeout            : 60000,
  },
});
