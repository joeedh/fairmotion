/* The shape of a .fmo file, shared by the reader and the writer.

   A file is a "FAIR" magic, a flags int and a two-int version, then a run of
   blocks.  Each block is a 4-char type, a 4-char subtype saying how the payload
   is encoded, and a length.  Types: BLCK for one datablock, DLIB for the
   library that indexes them, SCRN for the screen layout, TSTK for the
   toolstack, THME for the theme, and SDEF for the nstructjs schema the rest of
   the file was written against.  Subtypes: STRT for nstructjs bytes, JSON for
   text, SDEF for the schema script.

   When the whole body is LZString-compressed the header stays plain, so the
   flags can be read before anything is decompressed. */

export let FileFlags = { COMPRESSED_LZSTRING: 1 };

/*
 * One block as read off disk. `type` is the 4-char block id (BLCK, SCRN, DLIB,
 * TSTK, THME, SDEF) and `subtype` says how the payload is encoded (STRT, JSON,
 * SDEF). BLCK payloads arrive as [lib_type, bytes]. The link pass overwrites
 * `data` in place with whatever it deserialized to.
 */
export interface FileBlock {
  type: string;
  subtype: string;
  len: int;
  /* What load_blocks() unpacked: a JSON/SDEF string, a STRT payload, or a
     [datablock type, payload] pair.  link_blocks() then overwrites it with the
     deserialized object. */
  data: string | DataView<ArrayBuffer> | [int, DataView<ArrayBuffer>] | byte[] | object;
}

/* A .fmo file after the header has been read: the datablock payloads, the
   STRUCT scripts they were written against, and the app version that wrote
   them. */
export class FileData {
  blocks: FileBlock[];
  fstructs: import("nstructjs").STRUCT;
  version: number;

  constructor(blocks: FileBlock[], fstructs: import("nstructjs").STRUCT, version: number) {
    this.blocks = blocks;
    this.fstructs = fstructs;
    this.version = version;
  }
}

/*
 * Which parts of the app state a .fmo write includes, and in what form. The
 * defaults live in create_user_file_new()/write_blocks() rather than here,
 * because the two disagree about save_toolstack.
 */
export interface FileWriteArgs {
  /* Return a DataView instead of the raw byte array. */
  gen_dataview?: boolean;
  compress?: boolean;
  save_screen?: boolean;
  save_toolstack?: boolean;
  save_theme?: boolean;
  save_datalib?: boolean;
}

/* write_blocks() takes an explicit map of 4-char block IDs to objects instead
   of pulling them off the app state. */
export interface BlockWriteArgs extends FileWriteArgs {
  blocks: { [fourCharId: string]: object };
}

/* Block types that link_blocks() and load_user_file_new() must not hand to
   DataBlock.data_link(); they are not datablocks. */
export const NON_BLOCKS = Object.freeze(new set(["SCRN", "TSTK", "THME", "DLIB"]));
