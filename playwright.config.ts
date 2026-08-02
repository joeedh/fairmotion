import {defineConfig, devices} from "@playwright/test";

/* The viewport is WebGL, so headless chromium needs a software rasterizer.
   Without these the context creation fails and every spec sees a blank canvas. */
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
  workers      : process.env.CI ? 1 : undefined,
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
