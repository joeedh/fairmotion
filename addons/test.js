export const details = {
  author             : "",
  email              : "",
  version            : "",
  tooltip            : "",
  description        : "",
  apiVersion         : 0
};

import * as util from 'util';
import {test} from './test/test2.js';

export function register() {
  console.log("Addon init! 2");
  test();
}

export function unregister() {

}

export function defineDataAPI() {

}

export function handleFileVersioning(datalib, old_version, new_version) {

}
