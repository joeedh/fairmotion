/* config_local.js is a per-developer override file and is gitignored, so this
   declares the shape config.ts reads out of it.  Everything is optional: the
   file may define only some of these, or be a bare `export {}`. */

export declare const DEBUG: {[flag: string]: boolean | number} | undefined;
