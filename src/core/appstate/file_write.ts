/* Writing a .fmo file.

   Both functions here build the same block stream (see file_format.ts); they
   differ only in where the blocks come from.  create_user_file_new() pulls them
   off the app state, so which ones appear is a matter of flags.  write_blocks()
   is handed an explicit map, which is how the undo system saves a subset.

   Compression is applied to everything after the header, so the flags int stays
   readable without decompressing first. */

import { pack_int, pack_static_string, pack_string } from "../ajax.js";
import { gen_struct_str, profile_report, profile_reset } from "../struct.js";

import { BlockWriteArgs, FileFlags, FileWriteArgs } from "./file_format.js";

import type { AppState } from "./appstate.js";

function bheader(data: byte[], type: string, subtype: string) {
  pack_static_string(data, type, 4);
  pack_static_string(data, subtype, 4);
}

/* Magic, flags and version, in the plain. Returns the header on its own when
   the body is to be compressed, so the caller can keep the two apart. */
function packHeader(compress: boolean) {
  let data: byte[] = [];

  //header "magic"
  pack_static_string(data, "FAIR", 4);

  //general file flags, e.g. compression
  let flag = compress ? FileFlags.COMPRESSED_LZSTRING : 0;
  pack_int(data, flag);

  //version
  let major = Math.floor(g_app_version);
  let minor = Math.floor((g_app_version - Math.floor(g_app_version)) * 1000);

  pack_int(data, major);
  pack_int(data, minor);

  return data;
}

/* LZString hands back a string of 16-bit code units; the file wants those as
   bytes, with the plain header back in front. */
function compressBody(headerdata: byte[], data: byte[]) {
  let cdata = LZString.compress(new Uint8Array(data));

  let d16 = new Uint16Array(cdata.length);
  for (let i = 0; i < cdata.length; i++) {
    d16[i] = cdata.charCodeAt(i);
  }

  let d = new Uint8Array(d16.buffer);
  console.log("  file size", d.length);

  let out = new Uint8Array(d.length + headerdata.length);
  for (let i = 0; i < headerdata.length; i++) {
    out[i] = headerdata[i];
  }
  for (let i = 0; i < d.length; i++) {
    out[i + headerdata.length] = d[i];
  }

  return out;
}

/*
  new file format:
  FAIR          | 4 chars
  file flags    | int (e.g. whether compression was used)
  version major | int
  version minor | int

  block {
    type    | 4 chars
    subtype | 4 chars [STRT (Struct), JSON, SDEF (struct definition[s])]
    datalen | int
  }

  BLCK blocks correspond to DataBlocks, and are defined like so:

  BLCK         | 4 chars
  STRT         | 4 chars
  data_length  | int
  blocktype    | int
  data (of length data_length-4)
*/
export function create_user_file_new(self: AppState, args: FileWriteArgs = {}) {
  let gen_dataview = true,
    compress = false;
  let save_screen = true,
    save_toolstack = false;
  let save_theme = false,
    save_datalib = true;

  if (args.save_datalib !== undefined) save_datalib = args.save_datalib;

  if (args.gen_dataview !== undefined) gen_dataview = args.gen_dataview;

  if (args.compress !== undefined) compress = args.compress;

  if (args.save_screen !== undefined) save_screen = args.save_screen;

  if (args.save_toolstack !== undefined) save_toolstack = args.save_toolstack;

  if (args.save_theme !== undefined) save_theme = args.save_theme;

  let headerdata = packHeader(compress);
  let data: byte[] = compress ? [] : headerdata;

  //the schema struct definitions used to save
  //the non-JSON parts of this file.
  let buf = gen_struct_str();

  bheader(data, "SDEF", "SDEF");
  pack_string(data, buf);

  //reset struct profiler, if its enabled
  //#ifdef PACK_PROFILE
  profile_reset();
  //#endif

  //save datalib data, note that data blocks are saved independently
  if (save_datalib) {
    let data2: byte[] = [];

    istruct.write_object(data2, self.datalib);
    bheader(data, "DLIB", "STRT");
    pack_int(data, data2.length);
    data = data.concat(data2);
  }

  if (save_screen) {
    //write screen block
    let data2: byte[] = [];
    istruct.write_object(data2, self.screen);

    bheader(data, "SCRN", "STRT");
    pack_int(data, data2.length);
    data = data.concat(data2);
  }

  let data2: byte[] = [];
  for (let lib of self.datalib.datalists.values()) {
    for (let block of lib) {
      data2 = [];

      let t1 = time_ms();

      istruct.write_object(data2, block);

      t1 = time_ms() - t1;

      if (t1 > 50) {
        console.log(t1.toFixed(1) + "ms", block);
      }

      bheader(data, "BLCK", "STRT");
      pack_int(data, data2.length + 4);
      pack_int(data, block.lib_type);

      data = data.concat(data2);
    }
  }

  //#ifdef PACK_PROFILE
  profile_report();
  //#endif

  if (save_toolstack) {
    console.log("writing toolstack");

    let data2: byte[] = [];
    istruct.write_object(data2, self.toolstack);

    bheader(data, "TSTK", "STRT");
    pack_int(data, data2.length);
    data = data.concat(data2);
  }

  if (save_theme) {
    console.log("writing theme");
    let data2: byte[] = [];
    istruct.write_object(data2, g_theme);

    bheader(data, "THME", "STRT");
    pack_int(data, data2.length);
    data = data.concat(data2);
  }

  if (compress) {
    console.log("using compression");
    let out = compressBody(headerdata, data);

    if (gen_dataview) return new DataView(out.buffer);
    else return out;
  } else {
    console.log("  file size", data.length);

    if (gen_dataview) return new DataView(new Uint8Array(data).buffer);
    else return data;
  }
}

//blocks is a map from 4-byte ID strings to
//STRUCT-compatible objects.
export function write_blocks(self: AppState, args: BlockWriteArgs) {
  let gen_dataview = true,
    compress = false;
  let blocks = args["blocks"];

  if (args.gen_dataview !== undefined) gen_dataview = args.gen_dataview;
  if (args.compress !== undefined) compress = args.compress;

  let headerdata = packHeader(compress);
  let data: byte[] = compress ? [] : headerdata;

  //the schema struct definitions used to save
  //the non-JSON parts of this file.
  let buf = gen_struct_str();

  bheader(data, "SDEF", "SDEF");
  pack_string(data, buf);

  for (let k in blocks) {
    let data2: byte[] = [];
    istruct.write_object(data2, blocks[k]);

    bheader(data, k, "STRT");
    pack_int(data, data2.length);
    data = data.concat(data2);
  }

  if (compress) {
    console.log("1 using compression");
    let out = compressBody(headerdata, data);

    if (gen_dataview) return new DataView(out.buffer);
    else return out;
  } else {
    console.log("  file size:", data.length);

    if (gen_dataview) return new DataView(new Uint8Array(data).buffer);
    else return data;
  }
}
