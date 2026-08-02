# Demo
[Demo](http://joeedh.github.io/fairmotion/index.html)

# Installing and running the alpha package
## Requirements:
  1. Python [www.python.org](www.python.org)

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

### Extjs

Fairmotion was originally coded in my own type-annotated language based on ES6,
and is currently being converted to typescript.  The old transpiler is gone;
sources are now built with esbuild.

### Build
To build, open a command prompt where you downloaded fairmotion
and execute these commands:

    pnpm install
    pnpm build            # html5 app  -> dist/html5app
    pnpm build:electron   # electron   -> dist/electron

`pnpm watch` rebuilds on change, and `pnpm serv` serves `dist/html5app`
on http://localhost:5050.

### Running The Electron App
    pnpm electron

That builds `dist/electron` if it is missing, launches Electron against it,
and exposes a CDP endpoint on port 9222.  `pnpm cdp eval "<js>"` talks to it.

## Refactoring

Fairmotion was forked from an ancient 3D modeler of mine, which I later rewrote from scratch to create [webgl-app-framework](https://www.khronos.org/registry/webgl/specs/latest/1.0/).

I've backported a lot of architectural changes from webgl-app-framework, but more remain.  

Refactor todos (list may not be up to date):

* Finish porting extjs code to typescript.
* Replace event dag with webgl-app-framework's graph solver.
* Finish scene graph refactor.
* Review OffscreenCanvas and ImageBitmap usage in workers and make sure they do
  what you'd expect (and don't copy excessively between GPU and CPU).
  