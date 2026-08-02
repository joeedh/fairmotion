"use strict";

/*for logging assertions that are particularly sensitive
should maybe send to a server somewhere?*/

export function evillog() {
  let s = "";

  for (let arg of arguments) {
    s += "" + arg + " ";
  }

  console.error("EVIL:", s);
}
