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

if (config.CHROME_APP_MODE) {
  export * from './fileapi_chrome';
} else if (config.ELECTRON_APP_MODE) {
  export * from './fileapi_electron';
} else {
  export * from './fileapi_html5';
}
