/* Getting a document in front of the user at launch.

   A new tab has no file open, so gen_default_file() first tries the user's own
   saved startup file out of localStorage, then the one compiled into the build,
   and only builds an empty document if neither loads.  Both are base64 .fmo
   payloads, which is why they can sit in a string at all.

   window.gen_default_file and window.test_load_file are published as globals
   because the menubar and the console both reach them by name. */

import { b64decode } from "../../util/strutils.js";
import { unpack_ctx } from "../ajax.js";
import * as html5_fileapi from "../fileapi/fileapi.js";
import { BasicFileOp } from "../../editors/viewport/view2d_ops.js";
import { startup_file } from "../startup/startup_file.js";

import { gen_screen } from "./screen_setup.js";

import type { AppState } from "./appstate.js";

window.test_load_file = function (): void {
  let buf = new DataView(b64decode(startup_file).buffer);

  g_app_state.load_user_file_new(buf, undefined, new unpack_ctx());
};

/* Tries the user's saved startup file first, then the one built into the app.
   False means neither loaded and the caller has to build a document. */
function load_default_file(g: AppState, size: int[] = [512, 512]): boolean {
  if (!myLocalStorage.hasCached("startup_file")) {
    myLocalStorage.startup_file = startup_file;
  }

  //try loading twice, load embedded startup_file on second attempt
  for (let i = 0; i < 2; i++) {
    let file = i == 0 ? myLocalStorage.getCached("startup_file") : startup_file;

    if (file) file = file.trim().replace(/[\n\r]/g, "");

    if (file) {
      let buf = new DataView(b64decode(file).buffer);

      try {
        g.load_user_file_new(buf, undefined, new unpack_ctx());
      } catch (error) {
        print_stack(error);
        return false;
      }

      return true;
    }
  }

  return false;
}

//size is screen size
window.gen_default_file = function gen_default_file(size = [512, 512], force_new = false) {
  //needed for chrome app file system api
  html5_fileapi.reset();

  let g = g_app_state;

  if (!force_new && load_default_file(g)) {
    return;
  }

  //reset app state, calling without args
  //will leave .screen undefined
  g.reset_state();

  let op = new BasicFileOp();
  g.toolstack.execTool(g.ctx, op);

  //now create screen
  gen_screen(undefined, size[0], size[1]);
};

/* NOTE: no callers. Reflows the stored startup file into 77-column lines, which
   is the shape startup_file.ts wants a new one pasted in as. */
function output_startup_file(): string {
  /* NOTE: a failed chrome.storage read caches null here, which used to make
     the loop below throw on str.length. */
  let str = myLocalStorage.getCached("startup_file") ?? "";
  let out = "";

  for (let i = 0; i < str.length; i++) {
    out += str[i];
    if ((i + 1) % 77 === 0) {
      out += "\n";
    }
  }

  return out;
}
