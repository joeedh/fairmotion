"not_a_module";

/*check for various api calls that aren't implemented by all browsers*/
if (String.startsWith == undefined) {
    String.prototype.startsWith = function (str) {
        if (str.length > this.length)
            return false;

        for (var i = 0; i < str.length; i++) {
            if (this[i] != str[i])
                return false;
        }

        return true;
    }
}

if (String.endsWith == undefined) {
    String.prototype.endsWith = function (str) {
        if (str.length > this.length)
            return false;

        for (var i = 0; i < str.length; i++) {
            if (this[this.length - str.length + i] != str[i])
                return false;
        }

        return true;
    }
}

//this needs to be converted to use regexpr's
if (String.contains == undefined) {
    String.prototype.contains = function (str) {
        if (str.length > this.length)
            return false;

        for (var i = 0; i < this.length - str.length + 1; i++) {
            var found = true;
            for (var j = 0; j < str.length; j++) {
                if (this[i + j] != str[j]) {
                    found = false;
                    break;
                }
            }

            if (found)
                return true;
        }

        return false;
    }
}

window._my_object_keys = function(obj) {
  var arr = [];
  for (var k in obj) {
    arr.push(k);
  }
  
  return arr;
}

//more consistent is_str function
function is_str(str) {
    return typeof str == "string" || typeof str == "String";
}

//get type name, even for mangled objects
function get_type_name(obj) {
    if (obj == undefined) return "undefined"
    if (obj.constructor != undefined && obj.constructor.name != undefined && obj.constructor.name != "")
        return obj.constructor.name;

    var c;

    try {
        var c = obj.toSource()
    } catch (Error) {
        c = ""
    }

    if (obj.toString().startsWith("[object ")) {
        var c2 = obj.toString().replace("[object ", "").replace("]", "")
        if (c2 != "Object" && c2 != "Array") {
            return c2;
        }
    }

    if (c.contains(">") && c.contains("<") && !c.contains(" ") && !c.contains(",") && !c.contains(".")) {
        c = c.replace(">", "").replace("<", "")

        if (c != "Object" && c != "Array") {
            return c
        }
    }

    if (obj.constructor == MouseEvent)
        return "MouseEvent"

    if (obj.constructor == KeyEvent)
        return "KeyEvent"

    if (obj.constructor == KeyboardEvent)
        return "KeyboardEvent"

    return "(unknown)";
}

function obj_get_keys(obj) {
    var ret = [];

    for (var k in obj) {
        if (obj.hasOwnProperty(k))
            ret.push(k);
    }

    return ret;
}

_do_frame_debug = false;
_do_iter_err_stacktrace = true;

//special values for compiled generator code
FrameContinue = {"FC": 1}
FrameBreak = {"FB": 1}

/*not sure if I need these...*/
function getattr(obj, attr) {
    return obj[attr];
}
function setattr(obj, attr, val) {
    obj[attr] = val;
}
function delattr(obj, attr) {
    delete obj[attr];
}

/*the grand __get_iter function.
 extjs_cc does not use c.__it erator__ when
 compiling code like "for (var a in c)" to
 ECMAScript5.1; rather, it calls __get_iter(c).
 */
/*
 function __get_iter(obj)
 {
 if (obj == undefined) {
 console.trace();
 print_stack();
 throw new Error("Invalid iteration over undefined value")
 }

 if (obj.__proto__.hasOwnProperty([Symbol.iterator]) || obj.hasOwnProperty([Symbol.iterator])) {
 return obj[Symbol.iterator]();
 } else {
 keys = []
 for (var k in obj) {
 keys.push(k)
 }
 return new arr_iter(keys);
 }
 }
 */

function _KeyValIterator(obj) {
    if (obj[Symbol.iterator] != undefined) {
        return obj[Symbol.iterator]();
    } else {
        var keys = []
        for (var k in obj) {
            keys.push([k, obj[k]])
        }
        return new arr_iter(keys);
    }
}

Iterator = _KeyValIterator;
