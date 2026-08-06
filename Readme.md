# Demo
[Demo](https://joeedh.github.io/fairmotion/index.html)

# Building and running

## Requirements

  1. [Node.js](https://nodejs.org) 22+ (developed against 24)
  2. [pnpm](https://pnpm.io) — `npm i -g pnpm`. Do not use `npm` or `yarn`.

Python is no longer required; the old Python build system has been removed.

## Setup

```sh
git clone --recurse-submodules https://github.com/joeedh/fairmotion.git
cd fairmotion
pnpm install
```

The UI toolkit ([path.ux](https://github.com/joeedh/path.ux)) is a git submodule at
`src/path.ux`. If you cloned without `--recurse-submodules`:

```sh
git submodule update --init --recursive
```

## Build

```sh
pnpm build             # html5 app   -> dist/html5app
pnpm build:electron    # electron app -> dist/electron
pnpm watch             # rebuild on change (implies --dev: sourcemaps, no minify)
```

Extra flags go straight to the build script: `node buildtools/esbuild.mjs --electron --watch`,
`--dev` for sourcemaps, `--minify` for a minified bundle. Each build wipes its output
directory first.

## Run — browser

```sh
pnpm build
pnpm serv              # http://localhost:5050
```

`pnpm serv [port] [--root=dist/html5app]` is a small static server rather than esbuild's
built-in one because the app needs COOP/COEP headers to keep `SharedArrayBuffer` available
to the wasm paths.

For an edit/reload loop, run `pnpm watch` and `pnpm serv` in two terminals.

## Run — Electron

```sh
pnpm electron
```

This builds `dist/electron` first if it isn't there, then launches Electron with the Chrome
DevTools Protocol on port 9222 (`--port=<n>` to change it, `--no-wait` to skip waiting for
the endpoint).

With the app running, drive it from another terminal:

```sh
pnpm cdp pages                        # list debuggable pages
pnpm cdp eval "<js expression>"       # evaluate in the app page
pnpm cdp screenshot [file.png]        # capture the app page
pnpm cdp click <x> <y>                # click at viewport coordinates
pnpm cdp key <key>                    # press a key (Playwright key names)
```

`pnpm cdp eval "__fm.datapathCount()"` reaches the same debug bridge the Playwright specs
use, so an Electron-only bug can be interrogated with the same oracles as the browser build.
For richer scripting, import `connectApp` from `buildtools/cdp.mjs` directly.

## Checks

```sh
pnpm typecheck         # tsgo --noEmit
pnpm test              # vitest (pnpm test:watch to watch)
pnpm playwright        # end-to-end; needs `pnpm build` first, starts pnpm serv itself
pnpm format            # @pathtx/prettier over src/**/*.ts
pnpm format:check      # same, non-mutating
```

Formatting uses joeedh's prettier fork (`@pathtx/prettier`), not stock prettier.

## Documentation

`docs/index.md` indexes everything: subsystem guides (rendering, stroking, animation,
dopesheet), a symptom-indexed debugging log, plans, and research notes.

#Intro

Fairmotion is an advanced vector graphics/animation editor based on
polynomial clothoids (similar to Spiros).


<div style="float: right">
<img align="right" src="https://github.com/joeedh/fairmotion/blob/master/examples/example2.png"></img>
</div>

Instead of hard to use polynomial curves, Fairmotion simulates real-world  
wooden drafting splines mathematically.  The result is much easier to use.

## Math

For a deep dive into polynomial clothoids and elastica, see Raph Levien's 
PhD thesis:

http://www.levien.com/phd/phd.html

Intead of interpolating x and y separately with two polynomials, 
*one* polynomial (a cubic bezier) is used to define a plane
curve's *curvature function.*  This is then reverse integrated
to get a much nicer looking curve than you would get from stuff like
Bezier curves or B-Splines.

Fairmotion is very much a work in progress, and should be considered pre-alpha.

![Another Example](https://github.com/joeedh/fairmotion/blob/master/examples/example1.png)

  
