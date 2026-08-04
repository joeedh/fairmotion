/*
file api implementation

 okay, the general principle of the file api is that, if access to the file system
 is possible, file paths are assumed to be opaque (even if they aren't).  So
 a file's path could be random nonsense or a generated ID for all we know.
 This is how Chrome's app api did it.

 export function reset();
 export function open_file(callback, thisvar, set_current_file, extslabel, exts);
 export function save_file(data, save_as_mode, set_current_file, extslabel, exts, error_cb);

 //returns {name: id} pairs
 export function getRecentList();
 export function clearRecentList();

 export function setRecent(name, id);
 export function openRecent(thisvar, id);
*/

import * as config from '../../config/config.js';
import * as fileapi_chrome from './fileapi_chrome.js';
import * as fileapi_electron from './fileapi_electron.js';
import * as fileapi_html5 from './fileapi_html5.js';

/* Handed the file's contents, its display name, and an id the backend can
   re-open it by later -- a path on electron, a retained entry key on chrome. */
export type OpenFileCallback = (data: ArrayBuffer, fname: string, id: string) => void;
export type FileErrorCallback = (error?: Error) => void;
export type FileSuccessCallback = (path: string) => void;

/* Anything the backends know how to turn into bytes before writing. */
export type FileData = ArrayBuffer | ArrayBufferView | Blob;

/* The old transpiler allowed `export * from` inside an if/else, which real ESM
   does not. All three backends were concatenated into the bundle regardless,
   so importing them all and dispatching per call is the same behavior. */
function backend() {
  if (config.CHROME_APP_MODE) {
    return fileapi_chrome;
  } else if (config.ELECTRON_APP_MODE) {
    return fileapi_electron;
  } else {
    return fileapi_html5;
  }
}

//XXX analyze how this works, probably allshape code
export function get_root_folderid() {
  return '/';
}

//XXX analyze how this works, probably allshape code
export function get_current_dir() {
  return '';
}

//XXX analyze how this works, probably allshape code
export function path_to_id() {
  return '';
}

//XXX analyze how this works, probably allshape code
export function id_to_path() {
  return '';
}

/* The three backends disagree on the argument lists for open_file and
   save_file -- see docs/debugging.md -- so this dispatcher has no one honest
   signature. Its arguments stay unannotated until they are reconciled. */
function forward(name: string) {
  return function (...args) {
    let mod = backend();

    if (typeof mod[name] !== "function") {
      throw new Error("fileapi: " + name + " is not implemented on this platform");
    }

    return mod[name](...args);
  };
}

export const reset = forward("reset");
export const open_file = forward("open_file");
export const save_file = forward("save_file");
export const save_with_dialog = forward("save_with_dialog");
export const can_access_path = forward("can_access_path");
export const is_dir = forward("is_dir");
export const get_base_dir = forward("get_base_dir");
export const clearRecentList = forward("clearRecentList");
export const getRecentList = forward("getRecentList");
export const setRecent = forward("setRecent");
export const openRecent = forward("openRecent");
