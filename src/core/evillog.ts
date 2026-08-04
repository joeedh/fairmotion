"use strict";

/*for logging assertions that are particularly sensitive
should maybe send to a server somewhere?*/

export function evillog(...args: unknown[]) {
  let s = "";

  for (let arg of args) {
    s += "" + arg + " ";
  }

  console.error("EVIL:", s);
}
