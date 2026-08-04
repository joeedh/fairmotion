import * as config from '../config/config.js';

import {reload_default_theme} from '../datafiles/theme.js';
import {b64encode, b64decode} from '../util/strutils.js';
//#XXX import {download_file} from 'dialogs';
import {exportTheme, CSSFont} from '../path.ux/scripts/core/ui_theme.js';
import {setTheme} from '../path.ux/scripts/core/ui_base.js';
import * as ui_base from '../path.ux/scripts/core/ui_base.js';
import {theme} from '../editors/theme.js';
import * as util from '../path.ux/scripts/util/util.js';
import {KeyMapDeltaSet, KeyMapDelta, KeyMap} from './keymap.js';
import type * as pathux from '../path.ux/scripts/pathux.js';

let defaultTheme = exportTheme(theme);

export function loadTheme(str : string) {
  var theme;
  eval(str);

  setTheme(theme);
}

loadTheme(defaultTheme);

export class RecentPath {
  static STRUCT: string;

  path: string;
  displayname: string;

  constructor(path : string, displayname : string) {
    this.path = path;
    this.displayname = displayname;
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
  }
}
RecentPath.STRUCT = `
  RecentPath {
    path        : string;
    displayname : string;
  }
`;

export class ToolOpSettings {
  static STRUCT: string;

  /* The tool's apiname, or its toolpath if it has no apiname. */
  name: string;
  /* Per-tool saved property values. They are whatever a ToolProperty's
     getValue() returned, round-tripped through JSON. */
  entries: {[key: string]: unknown};

  constructor(toolcls?: pathux.IToolOpConstructor) {
    if (toolcls === undefined) { //called from nstructjs
      this.name = "";
      this.entries = {};
    } else {
      this.name = toolcls.tooldef().apiname || toolcls.tooldef().toolpath;
      this.entries = {};
    }
  }

  isFor(toolcls: pathux.IToolOpConstructor) {
    return this.name === (toolcls.tooldef().apiname || toolcls.tooldef().toolpath);
  }

  _save() {
    let ret: [string, string][] = [];
    for (let k in this.entries) {
      let v = this.entries[k];

      ret.push([k, JSON.stringify(v)]);
    }

    return ret;
  }

  set(k: string, v: unknown) {
    this.entries[k] = v;
  }

  has(k: string) {
    return k in this.entries;
  }

  get(k: string) {
    return this.entries[k];
  }

  /* nstructjs fills `entries` with the [key, json] pair array _save() wrote,
     and this turns it back into the map the rest of the class expects. */
  loadSTRUCT(reader: StructReader<this>) {
    reader(this);

    let entries = this.entries;
    this.entries = {};

    for (let item of entries) {
      let k = item[0], v = item[1];

      try {
        v = JSON.parse(v);
      } catch (error) {
        util.print_stack(error);
        console.error("JSON error when loading " + this.name + "." + k + ":", v);
        continue;
      }

      this.entries[k] = v;
    }
  }
}

ToolOpSettings.STRUCT = `
ToolOpSettings {
  name    : string;
  entries : array(array(string)) | this._save(); 
}
`;

export const SETTINGS_VERSION = 1;

export class AppSettings {
  static STRUCT: string;

  unit_scheme: string;
  unit: string;
  /* The theme as an exportTheme() script, not a live theme object. */
  theme: string;
  recent_paths: RecentPath[];
  tool_settings: ToolOpSettings[];
  keyMaps: KeyMapDeltaSet[];
  version: number;
  keyDeltaGen: number;
  /* Set once load() has pulled settings out of local storage. */
  loaded_settings?: boolean;

  constructor() {
    this.reload_defaults(false);
    this.recent_paths = [];
    this.tool_settings = [];
    this.keyMaps = [];

    this.version = SETTINGS_VERSION;
    this.keyDeltaGen = 0; //used to signal that key mappings have changed
  }

  updateKeyDeltas(typeName : string, keymap : KeyMap) {
    for (let kd of this.keyMaps) {
      if (kd.typeName === typeName) {
        this.keyMaps.remove(kd);
      }
    }

    this.keyMaps.push(keymap.asDeltaSet());
    this.keyDeltaGen++;
  }

  getKeyMapDeltaSet(typeName : string) {
    for (let kd of this.keyMaps) {
      if (kd.typeName === typeName) {
        return kd;
      }
    }

    let kd = new KeyMapDeltaSet(typeName);
    this.keyMaps.push(kd);
    return kd;
  }

  _getToolOpS(toolcls: pathux.IToolOpConstructor) {
    for (let settings of this.tool_settings) {
      if (settings.isFor(toolcls)) {
        return settings;
      }
    }

    let ret = new ToolOpSettings(toolcls);
    this.tool_settings.push(ret);

    return ret;
  }

  setToolOpSetting(toolcls: pathux.IToolOpConstructor, k: string, v: unknown) {
    this._getToolOpS(toolcls).set(k, v);

    this.save();
  }

  hasToolOpSetting(toolcls: pathux.IToolOpConstructor, k: string) {
    return this._getToolOpS(toolcls).has(k);
  }

  getToolOpSetting(toolcls: pathux.IToolOpConstructor, k: string, defaultval: unknown) {
    if (!this._getToolOpS(toolcls).has(k)) {
      return defaultval;
    }

    return this._getToolOpS(toolcls).get(k);
  }

  reload_defaults(load_theme=false) {
    this.unit_scheme = "imperial";
    this.unit = "in";
    this.theme = defaultTheme;
    
    if (load_theme) {
      loadTheme(this.theme);
    }
  }
  
  reloadDefaultTheme() {
    this.theme = defaultTheme;
    loadTheme(this.theme);
  }

  setTheme(th = ui_base.theme) {
    this.theme = exportTheme(th);
    return this;
  }

  loadFrom(b: AppSettings, load_theme=true) {
    this.unit = b.unit;
    this.unit_scheme = b.unit_scheme;
    this.theme = b.theme;

    if (load_theme) {
      loadTheme(this.theme);
    }

    this.recent_paths = b.recent_paths;

    if (b.version < 1) {
      console.error("Resetting theme");
      this.reloadDefaultTheme();
    }

    return this;
  }

  download(callback?: () => void) {
    console.warn("Deprecated function AppSettings.prototype.download() called");

    this.load().then(() => {
      if (callback) {
        callback();
      }
    });
  }

  load() {
    return new Promise<AppSettings>((accept, reject) => {
      myLocalStorage.getAsync("_fairmotion_settings").then((data) => {
        console.warn("%cLoading saved settings. . . ", "color : green;");

        let view = new DataView(b64decode(data).buffer);

        let fdata = g_app_state.load_blocks(view);
        let blocks = fdata.blocks;
        let fstruct = fdata.fstructs;
        let version = fdata.version;

        var settings = undefined;

        for (var i=0; i<blocks.length; i++) {
          if (blocks[i].type === "USET") {
            settings = fstruct.read_object(blocks[i].data, AppSettings);
            console.log("  found settings.");
          }
        }
        
        if (settings === undefined) {
          console.trace("  could not find settings block");
          reject("could not find settings block, but did get a file");
          return;
        }

        this.loadFrom(settings);
        this.loaded_settings = true;
        accept(this);
      });
    });
  }

  save() {
    var data = this.gen_file().buffer;
    var b64 = b64encode(new Uint8Array(data));

    myLocalStorage.set("_fairmotion_settings", b64);
  }

  gen_file() {
    let blocks = {USET : this};
    
    var args = {blocks : blocks};
    return g_app_state.write_blocks(args);
  }

  find_recent_path(path: string) {
    for (var i=0; i<this.recent_paths.length; i++) {
      if (this.recent_paths[i].path === path) {
        return i;
      }
    }

    return -1;
  }

  add_recent_file(path: string, displayname=path) {
    let rpath = new RecentPath(path, displayname);

    var rp = this.find_recent_path(path);

    if (rp >= 0) {
      try {
        this.recent_paths.remove(this.recent_paths[path]);
      } catch (error) {
        util.print_stack(error);
      }
      this.recent_paths.push(rpath);
    } else if (this.recent_paths.length >= config.MAX_RECENT_FILES) {
      this.recent_paths.shift();
      this.recent_paths.push(rpath);
    } else {
      this.recent_paths.push(rpath);
    }

    this.save();
  }

  loadSTRUCT(reader: StructReader<this>) {
    //make sure we detect old settings without version fields
    this.version = 0;

    reader(this);

    if (typeof this.theme !== "string") {
      this.theme = defaultTheme;
    }
  }
}
AppSettings.STRUCT = `
AppSettings {
  unit_scheme   : string;
  unit          : string;
  tool_settings : array(ToolOpSettings);
  theme         : string;
  recent_paths  : array(RecentPath);
  version       : int;
  keyMaps       : array(KeyMapDeltaSet);
}
`;


/* Dead: nothing constructs this any more, and the download()/server_update()
   paths below still reference globals that no longer exist. */
export class OldAppSettings {
  static STRUCT: string;

  unit_scheme : string
  unit : string
  last_server_update : number
  update_waiting : boolean;
  recent_paths : RecentPath[];
  /* The STRUCT script reads a live Theme into this; download() then moves it
     onto window.g_theme and deletes it again. */
  theme? : Theme;

  constructor() {
    this.unit_scheme = "imperial";
    this.unit = "in";
    this.last_server_update = 0;
    this.update_waiting = false;
    this.recent_paths = [];
  }
  
  reload_defaults() {
    this.unit_scheme = "imperial";
    this.unit = "in";
    
    this.recent_paths.length = 0;
  
    reload_default_theme();
    this.server_update(true);
  }
  
  find_recent_path(path: string) {
    for (var i=0; i<this.recent_paths.length; i++) {
      if (this.recent_paths[i].path === path) {
        return i;
      }
    }

    return -1;
  }

  add_recent_file(path: string, displayname=path) {
    var rp = this.find_recent_path(path);
    var rpath = new RecentPath(path, displayname);

    if (rp >= 0) {
      try {
        this.recent_paths.remove(this.recent_paths[path]);
      } catch (error) {
        util.print_stack(error);
      }
      this.recent_paths.push(rpath);
    } else if (this.recent_paths.length >= config.MAX_RECENT_FILES) {
      this.recent_paths.shift();
      this.recent_paths.push(rpath);
    } else {
      this.recent_paths.push(rpath);
    }
  }

  toJSON() {
    return this;
  }

  static fromJSON(obj: OldAppSettings) {
    var as = new AppSettings();
    
    as.unit_scheme = obj.unit_scheme;
    as.unit = obj.unit;
    
    return as;
  }
  
  static fromSTRUCT(reader: StructReader<AppSettings>) {
    var ret = new AppSettings();
    reader(ret);
    
    return ret;
  }
  
  on_tick() {
    if (this.update_waiting) {
      this.server_update();
    }
  }
  
  server_update(force=false) {
    //console.trace("server settings push");
    
    force = force || config.NO_SERVER || time_ms() - this.last_server_update > 3000;
    force = force && window.g_app_state !== undefined;
    
    if (force) {
      //console.log("pushing settings to server. . .");
      _settings_manager.server_push(this);
      
      this.last_server_update = time_ms();
      this.update_waiting = false;
    } else {
      this.update_waiting = true;
    }
  }
  
  gen_file() {
    var blocks = {USET : this};
    
    var args = {blocks : blocks};
    return g_app_state.write_blocks(args);
  }
  
  download(on_finish?: (settings: OldAppSettings) => void) {
    function finish(data: DataView) {
      function finish2(data: DataView) {
        console.log("loading settings data...");
        
        var ret = g_app_state.load_blocks(data);
        
        if (ret == undefined) {
          console.trace("could not load settings : load_blocks returned undefined");
          return;
        }
        
        var fstructs = ret.fstructs;
        var blocks = ret.blocks;
        var version = ret.version;
        
        //console.log(blocks);
        
        var settings = undefined;
        for (var i=0; i<blocks.length; i++) {
          if (blocks[i].type == "USET") {
            settings = fstructs.read_object(blocks[i].data, AppSettings);
          }
        }
        
        if (settings == undefined) {
          console.trace("could not find settings block");
          return;
        }
        
        if (settings.theme != undefined) {
          console.log("loading theme");
          
          //add any new colors
          window.g_theme.patch(settings.theme);
          window.g_theme = settings.theme;
          delete settings.theme;
          window.g_theme.gen_globals();
        }
        
        g_app_state.session.settings = settings;
        if (g_app_state.screen != undefined) {
          redraw_viewport();
        }
        
        if (on_finish != undefined) {
          on_finish(settings);
        }
      }
      
      try {
        finish2(data);
      } catch (_err) {
        print_stack(_err);
        console.log("exception occured while loading settings!");
      }
    }
    
    if (config.NO_SERVER) {
        startup_report("getting settings from myLocalStorage. . .");
        
        myLocalStorage.getAsync("_settings").then(function(settings) {
          var bytes = b64decode(settings);

          finish(new DataView(bytes.buffer));
        });
    } else {
        download_file("/" + fairmotion_settings_filename, finish, "Settings", true);
    }
  }
}

OldAppSettings.STRUCT = `
  OldAppSettings {
    unit_scheme  : string;
    unit         : string;
    theme        : Theme | g_theme;
    recent_paths : array(RecentPath);
  }
`;


export class SettUploadManager {
  /* Queued behind `active`; only ever one deep. */
  next: UploadJob | undefined;
  active: UploadJob | undefined;

  constructor() {
    this.next = undefined;
    this.active = undefined;
  }

  server_push(settings: OldAppSettings) {
    startup_report("writing settings");
    
    if (config.NO_SERVER) { //save to myLocalStorage
        var data = settings.gen_file().buffer;
        data = b64encode(new Uint8Array(data));
        
        myLocalStorage.set("_settings", data);
        return;
    }
    
    var job = new UploadJob(undefined, settings);
    
    if (this.active != undefined && !this.active.done) {
      this.next = job;
    } else {
      this.active = upload_settings(settings, this);
    }
  }
  
  finish(job: UploadJob) {
    job.done = true;
    this.active = undefined;
    
    if (this.next != undefined) {
      this.server_push(this.next.settings);
      this.next = undefined;
    }
  }
}

window._settings_manager = new SettUploadManager();

export class UploadJob {
  cancel : boolean
  done : boolean;
  /* The serialized settings file being uploaded. */
  data : ArrayBuffer | undefined;
  /* Only set on the queued copy server_push() parks in `next`. */
  settings : OldAppSettings | undefined;

  constructor(data?: ArrayBuffer, settings: OldAppSettings | undefined = undefined) {
    this.cancel = false;
    this.data = data;
    this.done = false;
    this.settings = settings;
  }
}

function upload_settings(settings: OldAppSettings, uman: SettUploadManager) {
  var path = "/"+fairmotion_settings_filename;
  
  var data = settings.gen_file().buffer;
  var pnote = g_app_state.notes.progbar("upload settings", 0.0, "uset");
  var ctx = new Context();
  
  var ujob = new UploadJob(data);
  var did_error = false;
  function error(job: NetJob, owner: object, msg: string) {
    if (!did_error) {
      uman.finish(ujob);
      pnote.end();
      
      g_app_state.notes.label("Network Error");
      did_error = true;
    }
  }
  
  function status(job: NetJob, owner: object, status: NetStatus) {
    pnote.set_value(status.progress);
    //console.log("status: ", status.progress, 1.0);
  }
  
  var this2 = this;
  function finish(job: NetJob, owner: object) {
    //console.log("settings upload finished! yay!");
    uman.finish(ujob);
  }

  var token = g_app_state.session.tokens.access;
  var url = "/api/files/upload/start?accessToken="+token+"&path="+path
  var url2 = "/api/files/upload?accessToken="+token;
  
  call_api(upload_file, {data:data, url:url, chunk_url:url2}, finish, error, status);
  
  return ujob;
}

