/* Reaching the running app, and waiting for it.

   Everything else in the debug bridge starts here: the three accessors that
   find the AppState a spec is talking to, and the two promises that say when it
   is worth talking to.

   Written without async/await: the legacy extjs_cc transpiler could parse
   neither, and the bridge had to build under it. */

export function getApp() {
  return window.g_app_state;
}

export function getCtx() {
  let app = getApp();
  return app ? app.ctx : undefined;
}

export function getApi() {
  let app = getApp();
  return app ? app.api : undefined;
}

/* `.message || the value itself`, the way the catch blocks in here want it. */
export function errorText(error: unknown) {
  let msg = error instanceof Error ? error.message : undefined;
  return "" + (msg || error);
}

export function frame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function appStarted() {
  let app = getApp();
  return !!(app && app.ctx && app.screen && app.api && app.api.rootContextStruct);
}

/* Resolves once the app has a screen and a context, so specs can await startup
   instead of sleeping on it. */
export function ready(timeout = 30000) {
  let start = performance.now();

  function poll(resolve: (started: boolean) => void, reject: (error: Error) => void) {
    if (appStarted()) {
      frame().then(() => resolve(true));
      return;
    }

    if (performance.now() - start >= timeout) {
      reject(new Error("__fm.ready(): app did not start within " + timeout + "ms"));
      return;
    }

    sleep(50).then(() => poll(resolve, reject));
  }

  return new Promise(poll);
}

/* Flush pending redraws and let the event dag settle. */
export function waitIdle(timeout = 15000) {
  let start = performance.now();

  function drain(resolve: (idle: boolean) => void) {
    let times = window.redraw_start_times;
    let pending = times ? Object.keys(times).length : 0;

    if (pending === 0 || performance.now() - start >= timeout) {
      frame()
        .then(frame)
        .then(() => resolve(true));
      return;
    }

    sleep(16).then(() => drain(resolve));
  }

  return ready(timeout).then(() => {
    if (window.the_global_dag && window.the_global_dag.exec) {
      window.the_global_dag.exec();
    }

    if (window.redraw_viewport) {
      window.redraw_viewport();
    }

    return new Promise(drain);
  });
}

/* Every stroke harness in stroke_parity.ts starts by forcing a full pass, and
   this is what "force" means: UPDATE | FRAME_DIRTY | REDRAW on every element,
   plus the drawer's own recalc flag. */
export const DIRTY = 8 | 128 | (1 << 23);
