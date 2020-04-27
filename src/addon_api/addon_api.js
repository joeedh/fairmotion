"use strict";

/*
Addon api.
*/

var modules = {
}

/*
import * as data_api from 'data_api';
import * as animdata from 'animdata';
import * as frameset from 'frameset';
import * as eventdag from 'eventdag';
import * as STRUCT from 'struct';

import * as toolops_api from 'toolops_api';
import * as toolprops_iter from 'toolprops_iter';
import * as toolsystem from 'toolsystem';
import * as utildefine from 'utildefine';
import * as redraw_globals from 'redraw_globals';
import * as lib_api from 'lib_api';
import * as lib_utils from 'lib_utils';
import * as spline from 'spline';
import * as spline_base from 'spline_base'
import * as spline_query from 'spline_query';
import * as spline_types from 'spline_types';

var modules = {
  data_api       : data_api,
  animdata       : animdata,
  frameset       : frameset,
  eventdag       : eventdag,
  STRUCT         : STRUCT,
  toolops_api    : toolops_api,
  toolprops_iter : toolprops_iter,
  toolsystem     : toolsystem,
  utildefine     : utildefine,
  redraw_globals : redraw_globals,
  lib_api        : lib_api,
  lib_utils      : lib_utils,
  spline         : spline,
  spline_base    : spline_base,
  spline_query   : spline_query,
  spline_types   : spline_types
};
*/

export class Addon {
  static define() { return {
    author             : "",
    email              : "",
    version            : "",
    tooltip            : "",
    description        : "",
    struct_classes     : []
  }}

  constructor(manager) {
    this.manager = manager;
  }

  define_data_api(api) {

  }

  //returns a promise
  init_addon() {

  }

  //should return a promise?
  destroy_addon() {

  }

  handle_versioning(file, oldversion) {

  }
}

export class AddonManager {
  constructor() {
    this.addons = [];
    this.datablock_types = [];
  }

  register_datablock_type(cls) {
    this.datablock_types.push(cls);
  }

  unregister_datablock_type(cls) {
    this.datablock_types.remove(cls, false);
  }

  getmodule(name) {
    return modules[name];
  }

  getmodules() {
    return Object.getOwnPropertyNames(modules);
  }
}

