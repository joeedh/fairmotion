/*JS duplication of pyserver/util.js keyrot-keyunrot stuff*/

/*an important note: the keyrot/unrot functions are not
 for security purposes, they are only for obfuscation.*/

export var limit_code = {"0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, 
                         "6": 6, "7": 7, "8": 8, "9": 9};
export var limit_code_rev = {};

var c = 10;
for (var i=65; i<91; i++) {
  limit_code[String.fromCharCode(i)] = c++;
}

limit_code["."] = c++;
//limit_code["?"] = c++;
window.max_limit_code = c;

for (var k in limit_code) {
  limit_code_rev[limit_code[k]] = k;
}

_rnd_table = [
  2396599, 1798863, 2424653, 864425, 3411264, 
  3454329, 2740820, 672041, 2183812, 1374757, 1048546, 
  3996342, 4179799, 186880, 3607721, 2529926, 1600547, 
  1189562, 2830964, 1916059, 2876667, 2775942, 557742, 
  3220496, 4120476, 4065846, 2572439, 185639, 17008, 
  561912, 3946789, 1270269, 1535702, 3767250, 1318517, 
  2302563, 1828818, 272601, 2451727, 3540223, 656058, 
  940763, 1731676, 154871, 2082874, 3430816, 2759352, 
  2237558, 3586602, 627827, 2379121, 1569378, 2522015, 
  473595, 3252686, 405188, 697769, 3386638, 3974855, 
  1817076, 1736754, 1029609, 1152171, 2588906
];
_max_rnd = 4194240.0;

class StupidRandom {
  constructor(seed) {
    this.i = 0;
    this.j = 0;
    this._seed = 0;
    this.max = _max_rnd;
    
    if (seed != undefined)
      this.seed(seed);
  }
  
  seed(seed) {
    this._seed = Math.floor(seed)
    this.i = this.j = 0 
  }
  
  random() {
    i = this.i + this._seed*this.j;
    
    r1 = _rnd_table[(this.i+this._seed)%_rnd_table.length]
    r2 = _rnd_table[i%_rnd_table.length]
    
    this.i += 1;
    this.j += 3;
    
    return (r1+r2) % this.max;
  }
  
  frandom() {
    return this.next() / this.max;
  }
}

export var _keyrot_rnd_1 = new StupidRandom(0);

function fileid_to_publicid(fileid, userid) {
  if (userid == undefined) {
    throw new Error("userid cannot be undefined here!!");
  }
  
  function gen_id(cols, id) {
    h = id.toString(16).replace("0x", "");
    slen = cols-h.length;
    
    for (var i=0; i<slen; i++) {
      h = "0" + h
    }
    
    return h;
  }
  
  if (typeof fileid == "string") {
    fileid = parseInt(fileid);
  }
  
  if (typeof userid == "string") {
    userid = parseInt(userid);
  }
  
  return key_rotate(gen_id(8, userid) + "." + gen_id(8, fileid));
}

export function key_rotate(Object key) {
  key = key.toString().toUpperCase();
  s2 = ""
  
  if (key.length > 0) {
    var c = key[key.length-1]
    
    if (!(c in limit_code)) {
      warn("WARNING: unknown limit code", c);
      c = ".";
    }
    
    _keyrot_rnd_1.seed(limit_code[c]);
  }
  
  for (var i=0; i<key.length-1; i++) {
    var c = key[i]
    
    if (!(c in limit_code)) {
      c = ".";
    }
    
    var limitcode = limit_code[c];
    var r = Math.floor(_keyrot_rnd_1.random()%24.0);
    limitcode = (limitcode + r) % window.max_limit_code;
    
    c = limit_code_rev[limitcode];
    s2 += c
  }
  
  if (key.length > 0) {
    s2 += key[key.length-1]
  }
  
  return s2;
}

export function key_unrotate(Object key) {
  key = key.toString().toUpperCase();
  s2 = ""
  
  if (key.length > 0) {
    var c = key[key.length-1]
    
    if (!(c in limit_code)) {
      console.log("Invalid character! '" + str(c) + "'");
      c = ".";
      //throw "Invalid string for key_rotate!"; //XXX disable this for production runs
    }
    
    _keyrot_rnd_1.seed(limit_code[c]);
  }
  
  for (var i=0; i<key.length-1; i++) {
    var c = key[i]
    
    if (!(c in limit_code)) {
      throw "Invalid string for key_rotate!"; //XXX disable this for production runs
    }
    
    var limitcode = limit_code[c];
    
    var r = Math.floor(_keyrot_rnd_1.random()%24.0);
    
    if (window._td == undefined)
      window._td = 0;
      
    limitcode = (limitcode + window.max_limit_code - r) % window.max_limit_code;
    
    c = limit_code_rev[limitcode];
    s2 += c
  }
  
  if (key.length > 0) {
    s2 += key[key.length-1]
  }
  
  return s2;
}

export function get_root_folderid() {
  if (g_app_state.session.userid == undefined) 
    return undefined;
  
  var userid = key_unrotate(g_app_state.session.userid);
  return fileid_to_publicid(1, userid);
}

export function get_current_dir() {
  if (g_app_state.session.userid == undefined) 
    return undefined;
  
  recent_files = g_app_state.session.settings.recent_files;
  
  if (recent_files.length > 0) {
    var path = recent_files[recent_files.length-1].trim().replace(/\\/g, "/");
    while (path.length > 0 && path[path.length-1] != "/") {
      path = path.slice(0, path.length-1);
    }
    
    if (path.length > 0 && path[path.length-1] != "/")
      path = path.slice(0, path.length-1);
    
    return path == "" ? undefined : path;
  }
  
  return undefined;
}

import {encode_utf8, decode_utf8, truncate_utf8, 
        urlencode, b64decode, b64encode} from 'strutils';

export function path_to_id(path) {
  if (path.trim() == "/") {
    return new Promise(function(accept, reject) {
      accept({
        value : get_root_folderid()
      });
    });
  }
  
  //if not logged in, return. . . ah a promise in error state?
  if (g_app_state.session.userid == undefined) { 
    return new Promise(function(accept, reject) {
      reject();
    });
  }
  
  function joblet(job, args) {
    if (g_app_state.session.tokens == undefined) {
      job.error(job, job.owner);
      return;
    }
    
    var token = g_app_state.session.tokens.access;
    var path2 = urlencode(path);
    
    api_exec("/api/files/get/meta?accessToken="+token+"&path="+path2, job);
    yield;
    
    job.value = job.value.id;
  }
  
  return call_api(joblet);
}

window.test_get_file_id = function() {
  path_to_id("/C/dev").then(function(job) {
    console.log("==>", arguments, job.value);
  });
}

window.key_rot = key_rotate;
window.key_unrot = key_unrotate;