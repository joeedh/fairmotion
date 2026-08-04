"use strict";

import {safe_eval} from './safe_eval.js';

/*
--Unit system design--

The internal unit format is centimeters.
The UI exposes "unit strings," which allows
the user to input other units based on a
specific format.

Unit format form:

(numerical expression) (unit suffix)

E.g. "1/2in", "10cm", "2ft", "1/2''", "1/2'"

Unit suffixes:
in,'',`` : inches
ft,',`   : feet
m        : meters
mm       : milimeters
cm       : centimeters
km       : kilograms
ml       : mile
*/

var number_regexpr = /(0x[0-9a-fA-F]+)|((\d|(\d\.\d+))+(e|e\-|e\+)\d+)|(\d*\.\d+)|(\d+)/;

/*
  we store grid subdivision levels for units.
  
  since some units have multiple subdivision steps
  (i.e. feet are divided into 12 inches, which are
   further divided into eights), we store two levels.
*/

/* The grid/geometry settings a Unit carries. Unit's constructor fills
   grid_steps and grid_substeps in before handing this to UnitAttr, so both are
   optional here and required by the time they are read back. */
export interface UnitAttrs {
  grid_steps?: number;
  grid_substeps?: number;
  geounit?: number;
}

export class UnitAttr {
  /* How many divisions of this unit the grid draws, and how many of those each
     division is further split into (feet -> 12 inches -> eighths). */
  grid_steps: number;
  grid_substeps: number;
  /* Default size of a new object, in this unit's own scale. */
  geounit: number;

  constructor(attrs: UnitAttrs) {
    function getval(defval: number | undefined, key: keyof UnitAttrs, required = false) {
      if (key in attrs) return attrs[key];
      
      if (required)
        throw new Error("Missing required unit parameter");
      return defval;
    }
    
    this.grid_steps = getval(undefined, "grid_steps", true);
    this.grid_substeps = getval(undefined, "grid_substeps", true);
    
    //unit size in unit space, in centimeters
    //basically, default size of new objects
    this.geounit = getval(1.0, "geounit", false);
  }
}

export class Unit {
  attrs : UnitAttr;
  /* Centimeters per one of this unit; the internal format is centimeters. */
  cfactor : number;
  /* Every spelling that parses to this unit; [0] is the one gen_string emits. */
  suffix_list : string[];

  static units : Unit[];
  static metric_units : string[];
  static imperial_units : string[];
  static internal_unit : string;

  constructor(suffices: string[], cfactor: number,
              grid_subd_1: number, grid_subd_2 = grid_subd_1, attrs: UnitAttrs = {})
  {
    this.cfactor = cfactor;
    this.suffix_list = suffices;
    
    attrs.grid_steps = grid_subd_1;
    attrs.grid_substeps = grid_subd_2;
    
    if (!("geounit" in attrs)) {
      attrs.geounit = cfactor;
    }
    
    //validate
    this.attrs = new UnitAttr(attrs);
  }
  
  //expects normalized (centimeters) values
  from_normalized(v: number) {
    return v/this.cfactor;
  }

  to_normalized(v: number) {
    return v*this.cfactor;
  }

  /* Strips the longest matching suffix off `string` and returns
     [the unit it named, whatever is left]. */
  static get_unit(string: string): [Unit | undefined, string] {
    var lower = string.toLowerCase();
    var units = Unit.units;
    var unit = undefined;
    
    if (string == "default") {
      string = lower = g_app_state.session.settings.unit;
    }
    
    for (var i=0; i<units.length; i++) {
      var u = units[i];
      
      for (var j=0; j<u.suffix_list.length; j++) {
        if (lower.trim().endsWith(u.suffix_list[j])) {
          unit = u;
          
          string = string.slice(0, string.length-u.suffix_list[j].length);
          break;
        }
      }
      
      if (unit != undefined)
        break;
    }
    
    return [unit, string];
  }

  static parse(string: string, oldval?: number, errfunc?: (funcparam?: Object) => void,
               funcparam?: Object, defaultunit?: string) {
    //oldval, errfunc, funcparam are optional
    var units = Unit.units;
    var lower = string.toLowerCase();
    var unit = undefined;
    
    if (defaultunit == undefined)
      defaultunit = "cm";
      
    if (oldval == undefined)
      oldval = 0.0;
    
    var ret = Unit.get_unit(string);    
    unit = ret[0];
    string = ret[1];
    
    //do no unit processing if there is no unit
    if (unit == undefined) {
      unit = Unit.get_unit(defaultunit)[0];
    }
    
    var val = -1;
    try {
      val = safe_eval(string);
    } catch (err) {
      if (errfunc != undefined) {
        errfunc(funcparam);
      }
      
      return oldval;
    }
    
    if (val == undefined || typeof(val) != "number" || isNaN(val)) {
      console.log(["haha ", val, string]);
      errfunc(funcparam);
      return oldval;
    }
    
    if (unit != undefined) {
      val = unit.to_normalized(val);
    }
    
    return val;
  }

  static gen_string(val: number, suffix?: string, max_decimal = 3) {
    //max_decimal is optional
    //if suffix is undefined, no processing is done
    //if suffix is "default", g_app_state.session.settings.unit will be used
    
    if (!(typeof val == "number") || val == undefined)
      return "?";
    
    if (suffix == undefined)
      return val.toFixed(max_decimal);
      
    if (suffix == "default")
      suffix = g_app_state.session.settings.unit;
    
    suffix = suffix.toLowerCase().trim();
    
    var unit = undefined;
    var units = Unit.units;
    
    for (var i=0; i<units.length; i++) {
      var u = units[i];
      var sl = u.suffix_list;
      
      for (var j=0; j<sl.length; j++) {
        var s = sl[j];
        
        if (s == suffix) {
          unit = u;
          break;
        }
      }
      
      if (unit != undefined)
        break;
    }
    
    var out;
    /* The original reassigned `val` from number to string here; split into a
       second local so the type stays honest. Behavior is unchanged. */
    var text: string;

    if (unit != undefined) {
      val = unit.from_normalized(val);
      if (val != undefined) text = val.toFixed(max_decimal);
      else text = "0";

      out = text.toString() + unit.suffix_list[0];
    } else {
      text = val.toFixed(max_decimal);
      out = text.toString() + Unit.internal_unit;
    }
    
    return out;
  }
}
  
Unit.units = [
  new Unit(["cm"], 1.0, 10),
  new Unit(["in", "''", "``", '"'], 2.54, 8),
  new Unit(["ft", "'", "`"], 30.48, 12, 8),
  new Unit(["m"], 100, 10),
  new Unit(["mm"], 0.1, 10),
  new Unit(["km"], 100000, 10),
  new Unit(["mile"], 160934.4, 10)
];

Unit.metric_units = ["cm", "m", "mm", "km"];
Unit.imperial_units = ["in", "ft", "mile"];

Unit.internal_unit = "cm"

