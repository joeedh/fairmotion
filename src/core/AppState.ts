"use strict";

/* The application state, split across src/core/appstate/.

   appstate.ts holds the AppState class itself.  Around it: screen_setup.ts
   builds and repairs the screen layout, session.ts wraps the user's stored
   settings, startup_files.ts gets a document open at launch, file_format.ts
   describes a .fmo, file_write.ts and file_read.ts move one in each direction,
   versions.ts forward-ports old files, and saved_context.ts holds the contexts
   the undo stack serializes.

   This file stays as the import path everything else already uses.  The import
   order below is load-bearing: the editors have to register their area types
   before screen_setup.ts asks for them, and the electron check has to run
   before anything reaches for a platform API. */

/* path.ux's platform.js assigns its own exported `platform` binding once the
   dynamic import resolves. The old module emulation had no live bindings, so
   this file used to re-assign it from outside; ESM namespaces are sealed, so
   that is now both unnecessary and a strict-mode TypeError. */

import "../editors/all.js";

import * as electron_api from "../path.ux/scripts/platforms/electron/electron_api.js";

if (window.haveElectron) {
  electron_api.checkInit();
}

import "./startup/startup_file_example.js";

/* Publishes window.__fm for playwright and cdp.mjs. */
import "./debug_api.js";

export { FullContext, BaseContext, BaseContextOverlay } from "./context.js";

export { AreaTypes, gen_screen, get_app_div } from "./appstate/screen_setup.js";
export { UserSession } from "./appstate/session.js";
export { FileData, FileFlags } from "./appstate/file_format.js";
export type { BlockWriteArgs, FileBlock, FileWriteArgs } from "./appstate/file_format.js";
export { SavedContext, _ToolContext } from "./appstate/saved_context.js";
export { AppState } from "./appstate/appstate.js";

import "./appstate/startup_files.js";
