export var DataPathTypes = {PROP: 0, STRUCT: 1, STRUCT_ARRAY : 2};
export var DataFlags = {NO_CACHE : 1, RECALC_CACHE : 2};

//XXX re-use of pathux's exception class
import {DataPathError} from 'controller';
export let DataAPIError = DataPathError;

window.DataAPIError = DataAPIError;

