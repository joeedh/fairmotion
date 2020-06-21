export const details = {
  apiname            : "test",
  author             : "",
  email              : "",
  version            : "",
  tooltip            : "",
  description        : "",
  apiVersion         : 0
};

import * as util from 'util';
import {test} from './test/test2.js';

import * as api from 'api';

class SplineData {

}
SplineData.STRUCT = `
test.SplineData {

}
`;
api.nstructjs.register(SplineData);

export function register() {
  console.log("Addon init! 2");
  test();

//  api.registerCustomBlockData(details, details);
}

export function unregister() {

}

export function defineDataAPI() {

}

export function handleFileVersioning(datalib, old_version, new_version) {

}
