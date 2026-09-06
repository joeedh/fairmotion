/* Reading a .fmo file back in.

   Two entry points, because loading a file and loading an undo step want
   different amounts of the app rebuilt.  load_user_file_new() replaces
   everything, screen and toolstack included, and is what the open-file paths
   call.  load_blocks() plus link_blocks() is the same read split in two, which
   is what the undo system uses to swap a datalib in under the live screen.

   Both go through the same three stages: unpack the block stream, deserialize
   each block against the schema the file carries, then link the cross-block
   references now that every block exists. */

import { unpack_bytes, unpack_ctx, unpack_int, unpack_static_string } from "../ajax.js";
import { STRUCT } from "../struct.js";
import { structReadObject } from "../struct_facade.js";
import { BlockTypeMap, DataBlock, DataLib } from "../lib_api.js";
import { wrap_getblock, wrap_getblock_us } from "../lib_utils.js";
import { FullContext } from "../context.js";
import { Theme } from "../../datafiles/theme.js";
import { ToolMacro, ToolOp } from "../toolops_api.js";
import { ToolStack } from "../toolstack.js";
import { Editor, FairmotionScreen, resetAreaStacks } from "../../editors/editor_base.js";
import { View2DHandler } from "../../editors/viewport/view2d.js";
import { Screen } from "../../path.ux/scripts/screen/FrameManager.js";

import { FileBlock, FileData, FileFlags, NON_BLOCKS } from "./file_format.js";
import { gen_screen, get_app_div, patchScreen } from "./screen_setup.js";
import { do_versions, do_versions_post } from "./versions.js";

import type { GetBlockFunc, GetBlockUserFunc } from "../lib_api.js";
import type { SavedContext } from "./saved_context.js";
import type { AppState } from "./appstate.js";

/* Reads the plain header and, when the body is compressed, hands back a
   DataView over the decompressed remainder with the cursor reset to 0.  The
   returned `data` is what every later read should use. */
function readHeader(data: DataView, uctx: unpack_ctx) {
  let s = unpack_static_string(data, uctx, 4);
  if (s !== "FAIR") {
    console.log("header", s, s.length);
    console.log("data", new Uint8Array(data.buffer));
    throw new Error("Could not load file.");
  }

  let file_flag = unpack_int(data, uctx);

  let version_major = unpack_int(data, uctx);
  let version_minor = unpack_int(data, uctx) / 1000.0;

  let version = version_major + version_minor;

  if (file_flag & FileFlags.COMPRESSED_LZSTRING) {
    if (DEBUG.compression) console.log("decompressing. . .");

    let d16 = new Uint16Array(data.buffer.slice(uctx.i, data.byteLength));
    let s = "";
    for (let i = 0; i < d16.length; i++) {
      s += String.fromCharCode(d16[i]);
    }
    let raw = LZString.decompress(s);

    let data2 = new Uint8Array(raw.length);
    if (DEBUG.compression) console.log("uncompressed length: ", raw.length);

    for (let i = 0; i < raw.length; i++) {
      data2[i] = raw.charCodeAt(i);
    }

    data = new DataView(data2.buffer);
    uctx.i = 0;
  }

  return { data, version };
}

/*
 * True when a saved screen carries no usable geometry. Every file written by
 * version 0.052 stores a 0x0 screen with 0x0 areas -- a save-side bug in that
 * release. There is nothing to scale such a layout from, so the caller drops
 * the screen and lets the default one be built instead.
 */
export function screenIsDegenerate(screen: FairmotionScreen) {
  let bad = (v: number) => !isFinite(v) || v <= 0;

  if (bad(screen.size[0]) || bad(screen.size[1])) {
    return true;
  }

  for (let sarea of screen.sareas) {
    if (!sarea.hidden && !bad(sarea.size[0]) && !bad(sarea.size[1])) {
      return false;
    }
  }

  return true;
}

export function readScreen(fstructs: import("nstructjs").STRUCT, data: DataView) {
  let screen: FairmotionScreen;

  if (!(Screen.structName in fstructs.structs)) {
    screen = patchScreen(fstructs, data);
  } else {
    screen = structReadObject<FairmotionScreen>(fstructs, data, FairmotionScreen);
  }

  if (screenIsDegenerate(screen)) {
    console.warn("File has no usable screen layout; falling back to the default one");

    screen.remove();
    return undefined;
  }

  screen.style["position"] = "absolute";

  screen.setAttribute("id", "screenmain");
  screen.id = "screenmain";

  screen.ctx = new FullContext();

  screen.setCSS();
  screen.makeBorders();

  return screen;
}

export function dataLinkScreen(
  screen: FairmotionScreen,
  getblock: GetBlockFunc,
  getblock_us: GetBlockUserFunc
) {
  for (let sarea of screen.sareas) {
    for (let area of sarea.editors) {
      if (area instanceof Editor) {
        area.data_link(area, getblock, getblock_us);
      }
    }
  }
}

/* Flattens a macro's members into the two parallel patch lists, so the caller
   can hand each member the macro's saved context. */
function add_macro(p1: ToolOp[], p2: SavedContext[], tool: ToolOp & ToolMacro<FullContext>) {
  p1.push(tool);
  p2.push(tool.saved_context!);

  /* path.ux types a macro's members with its own ToolOp; everything
     fairmotion puts in a macro is a fairmotion one. */
  for (let t of tool.tools as ToolOp[]) {
    if (t instanceof ToolMacro) add_macro(p1, p2, t);

    t.parent = tool;

    p1.push(t);
    p2.push(tool.saved_context!);
  }
}

/* Rebuilds the toolstack read out of a TSTK block, then walks every tool it
   holds -- macro members included -- handing each property the context the tool
   ran under. */
function restoreToolstack(
  self: AppState,
  fstructs: import("nstructjs").STRUCT,
  toolstack: number[]
) {
  self.toolstack = structReadObject<ToolStack>(fstructs, toolstack, ToolStack);
  self.toolstack.undocur = self.toolstack.undostack.length;

  let patch_tools1 = new Array();
  let patch_tools2 = new Array();

  //set tool property contexts
  for (let i = 0; i < self.toolstack.undostack.length; i++) {
    let tool = self.toolstack.undostack[i];

    //handle mangled names
    if (tool.uiname === "(undefined)" || tool.uiname === undefined || tool.uiname === "") {
      tool.uiname = tool.name;

      if (tool.uiname === "(undefined)" || tool.uiname === undefined || tool.uiname === "") {
        tool.uiname = "Macro";
      }
    }

    //add undo barrier flag, since we don't serialize undo
    //data.
    //UPDATE: no longer necassary, due to new HAS_UNDO_DATA flag
    //tool.undoflag |= UndoFlags.UNDO_BARRIER;

    //tools in the undostack
    patch_tools1.push(tool);
    patch_tools2.push(tool.saved_context!);

    //tools within macros
    if (tool instanceof ToolMacro) {
      add_macro(patch_tools1, patch_tools2, tool);
    }
  }

  for (let i = 0; i < self.toolstack.undostack.length; i++) {
    let tool = self.toolstack.undostack[i];
    tool.stack_index = i;
  }

  //set toolproperty contexts
  for (let i = 0; i < patch_tools1.length; i++) {
    let tool = patch_tools1[i];
    let saved_context = patch_tools2[i];

    for (let k in tool.inputs) {
      tool.inputs[k].ctx = saved_context;
    }

    for (let k in tool.outputs) {
      tool.outputs[k].ctx = saved_context;
    }
  }
}

export function load_user_file_new(
  self: AppState,
  data: DataView,
  path?: string,
  uctx?: unpack_ctx,
  use_existing_screen = false
) {
  //fixes a bug where some files loaded with squished
  //size.  probably need to track down actual cause, though.
  if (self.screen !== undefined) self.size = new Vector2(self.screen.size);

  if (uctx === undefined) {
    uctx = new unpack_ctx();
  }

  let version: number;
  ({ data, version } = readHeader(data, uctx));

  let blocks: FileBlock[] = [];
  let fstructs = new STRUCT();
  let datalib: DataLib | undefined = undefined;

  let tmap = BlockTypeMap;

  window._send_killscreen();

  while (uctx.i < data.byteLength) {
    let type = unpack_static_string(data, uctx, 4);
    let subtype = unpack_static_string(data, uctx, 4);
    let len = unpack_int(data, uctx);
    let bdata;

    if (subtype === "JSON") {
      bdata = unpack_static_string(data, uctx, len);
    } else if (subtype === "STRT") {
      if (type === "BLCK") {
        let dtype = unpack_int(data, uctx);
        bdata = unpack_bytes(data, uctx, len - 4);
        bdata = [dtype, bdata];
      } else {
        bdata = unpack_bytes(data, uctx, len);
        if (type === "DLIB") {
          datalib = fstructs.read_object(bdata, DataLib);
        }
      }
    } else if (subtype === "SDEF") {
      bdata = unpack_static_string(data, uctx, len).trim();
      fstructs.parse_structs(bdata);
    } else {
      console.log(subtype, type, uctx.i, data.byteLength);
      console.trace();
      //throw new Error("Unknown block type '" + subtype + "', " + JSON.stringify({subtype: subtype, type : type}));
      break;
    }

    blocks.push({ type: type, subtype: subtype, len: len, data: bdata });
  }

  if (datalib === undefined) {
    console.warn("%c Creating new DataLib; probably an old file...", "color : red;");
    datalib = new DataLib();
  }

  /* Settled from here on; load_state() below is a nested function, so it
     cannot see the narrowing the check above performs. */
  const lib: DataLib = datalib;

  for (let i = 0; i < blocks.length; i++) {
    let b = blocks[i];

    if (b.subtype === "JSON") {
      if (typeof b.data === "string") {
        b.data = JSON.parse(b.data);
      }
    } else if (b.subtype === "STRT") {
      //struct data should only be lib blocks
      if (b.type === "BLCK") {
        //a BLCK payload is packed as [datablock type id, struct bytes]
        let [dtype, bytes] = b.data as [number, number[]];

        let block = structReadObject<DataBlock>(fstructs, bytes, tmap[dtype]);
        block.lib_refs = 0; //reading code will re-calculate ref count

        b.data = block;
        lib.add(block, false);
      } else {
        if (b.type === "SCRN" && b.data instanceof DataView) {
          /* A dropped screen leaves the raw payload in place, so the
             `instanceof FairmotionScreen` check below simply misses it and
             load_state() builds the default layout. */
          let scr = readScreen(fstructs, b.data);

          if (scr !== undefined) {
            b.data = scr;
          }
        } else if (b.type === "THME") {
          b.data = structReadObject<Theme>(fstructs, b.data as number[], Theme);
        }
      }
    }
  }

  //load theme, if it exists
  for (let i = 0; i < blocks.length; i++) {
    let block = blocks[i];

    if (block.type === "THME" && block.data instanceof Theme) {
      let old = window.g_theme;

      window.g_theme = block.data;
      window.g_theme.gen_globals();

      old.patch(window.g_theme);
    }
  }

  if (self.datalib !== undefined) {
    self.datalib.on_destroy();
  }

  self.datalib = lib;

  //ensure we get an error if the unpacking code/
  //tries to access g_app_state.active_view2d.
  self.active_view2d = undefined;

  let getblock = wrap_getblock(lib);
  let getblock_us = wrap_getblock_us(lib);
  let screen: FairmotionScreen | undefined = undefined;

  let toolstack: number[] | undefined = undefined;

  function load_state() {
    //handle version changes
    do_versions(self, lib, blocks, version);

    for (let i = 0; i < blocks.length; i++) {
      let block = blocks[i];

      if (
        block.subtype === "STRT" &&
        !NON_BLOCKS.has(block.type) &&
        block.data instanceof DataBlock
      ) {
        block.data.data_link(block.data, getblock, getblock_us);
      }
    }

    for (let i = 0; i < blocks.length; i++) {
      let block = blocks[i];

      if (block.type === "SCRN" && block.data instanceof FairmotionScreen) {
        screen = block.data;
      }
    }

    self.destroyScreen();

    let size = new Vector2(self.size);
    if (screen === undefined) {
      /* Default UI layout, built straight over the datalib just loaded.
         gen_default_file() would go through the startup file, whose own
         screen is degenerate -- so it lands back here and recurses. */
      gen_screen(undefined, self.size[0], self.size[1]);
      screen = self.screen;
    } else {
      //argh, have to set a dummy DataLib here prior to reset_state,
      //because of stupid active_splinepath accessors

      self.datalib = new DataLib();

      if (self.datalib !== undefined) {
        self.datalib.on_destroy();
      }
      self.reset_state(screen);
      self.datalib = lib;

      get_app_div().appendChild(screen);
    }

    self.screen = screen!;
    resetAreaStacks();

    if (!screen!.listening) {
      screen!.listen();
      screen!.completeSetCSS();
    }

    self.size = size;

    //stupid. . .
    for (let sa of screen!.sareas) {
      //TODO: need to get rid of appstate.active_view2d
      if (sa.area instanceof View2DHandler) {
        self.active_view2d = sa.area;
        break;
      }
    }

    if (screen !== undefined) {
      screen.view2d = self.active_view2d;
      dataLinkScreen(screen, getblock, getblock_us);
    }

    //load data into appstate
    if (self.datalib !== undefined) {
      self.datalib.on_destroy();
    }
    self.datalib = lib;

    self.eventhandler = self.screen;

    //find toolstack block, if it exists
    for (let i = 0; i < blocks.length; i++) {
      let block = blocks[i];

      if (block.type === "TSTK" && Array.isArray(block.data)) {
        console.warn("%cFound a tool stack block", "color : blue;", block);
        toolstack = block.data as number[];
      }
    }
  }

  load_state();
  self.filepath = path!;

  if (toolstack !== undefined) {
    restoreToolstack(self, fstructs, toolstack);
  }

  do_versions_post(self, version);

  window.redraw_viewport();
}

export function load_blocks(self: AppState, data: DataView, uctx?: unpack_ctx) {
  if (uctx === undefined) {
    uctx = new unpack_ctx();
  }

  let version: number;
  ({ data, version } = readHeader(data, uctx));

  let blocks: FileBlock[] = [];
  let fstructs = new STRUCT();

  while (uctx.i < data.byteLength) {
    let type = unpack_static_string(data, uctx, 4);
    let subtype = unpack_static_string(data, uctx, 4);
    let len = unpack_int(data, uctx);
    let bdata;

    if (subtype === "JSON") {
      bdata = unpack_static_string(data, uctx, len);
    } else if (subtype === "STRT") {
      if (type === "BLCK") {
        let dtype = unpack_int(data, uctx);
        bdata = unpack_bytes(data, uctx, len - 4);
        bdata = [dtype, bdata];
      } else {
        bdata = unpack_bytes(data, uctx, len);
      }
    } else if (subtype === "SDEF") {
      bdata = unpack_static_string(data, uctx, len).trim();
      fstructs.parse_structs(bdata);
    } else {
      console.log(subtype, type, uctx.i, data.byteLength);
      console.trace();
      throw new Error(
        "Unknown block type '" + subtype + "', " + JSON.stringify({ subtype: subtype, type: type })
      );
    }

    blocks.push({ type: type, subtype: subtype, len: len, data: bdata });
  }

  return new FileData(blocks, fstructs, version);
}

export function link_blocks(self: AppState, datalib: DataLib, filedata: FileData) {
  let blocks = filedata.blocks;
  let fstructs = filedata.fstructs;
  let version = filedata.version;

  let tmap = BlockTypeMap;
  let screen: FairmotionScreen | undefined = undefined;

  for (let i = 0; i < blocks.length; i++) {
    let b = blocks[i];

    if (b.subtype === "JSON") {
      if (typeof b.data === "string") {
        b.data = JSON.parse(b.data);
      }
    } else if (b.subtype === "STRT") {
      //struct data should only be lib blocks
      if (b.type === "BLCK") {
        //a BLCK payload is packed as [datablock type id, struct bytes]
        let [dtype, bytes] = b.data as [number, number[]];

        let block = structReadObject<DataBlock>(fstructs, bytes, tmap[dtype]);

        b.data = block;
        datalib.add(block, false);
      } else {
        if (b.type === "SCRN" && b.data instanceof DataView) {
          let scr = readScreen(fstructs, b.data);

          if (scr !== undefined) {
            b.data = screen = scr;
          }
        }
      }
    }
  }

  //ensure we get an error if the unpacking code/
  //tries to access g_app_state.active_view2d.
  self.active_view2d = undefined;

  let getblock = wrap_getblock(datalib);
  let getblock_us = wrap_getblock_us(datalib);

  self.scene = undefined;

  //handle version changes
  do_versions(self, datalib, blocks, version);

  for (let i = 0; i < blocks.length; i++) {
    let block = blocks[i];

    if (block !== undefined && (typeof block.data === "string" || block.data instanceof String))
      continue;

    if (
      block.data instanceof DataBlock &&
      block.subtype === "STRT" &&
      block.type !== "SCRN" &&
      block.type !== "THME"
    ) {
      block.data.data_link(block.data, getblock, getblock_us);
    }
  }

  for (let block of blocks) {
    if (block.type === "SCRN" && block.data instanceof FairmotionScreen) {
      screen = block.data;
    }
  }

  if (screen !== undefined) {
    self.active_view2d = undefined;

    for (let sa of screen.sareas) {
      //need to get rid of appstate.active_view2d
      if (sa.area instanceof View2DHandler) {
        self.active_view2d = sa.area;
        break;
      }
    }
  }

  if (screen !== undefined) {
    screen.view2d = self.active_view2d;
    dataLinkScreen(screen, getblock, getblock_us);
  }

  if (screen !== undefined) {
    screen.on_resize(self.size);
    screen.size = self.size;
  }
}
