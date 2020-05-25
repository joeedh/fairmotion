import * as config from '../config/config.js';

import {reload_default_theme} from '../datafiles/theme.js';
import {b64encode, b64decode} from '../util/strutils.js';
//#XXX import {download_file} from 'dialogs';
import {STRUCT} from './struct.js';
import {exportTheme, CSSFont} from '../path.ux/scripts/core/ui_theme.js';
import {setTheme} from '../path.ux/scripts/core/ui_base.js';
import * as ui_base from '../path.ux/scripts/core/ui_base.js';
import {theme} from '../editors/theme.js';

let defaultTheme = exportTheme(theme);

export function loadTheme(str) {
  var theme;
  eval(str);

  setTheme(theme);
}

export class RecentPath {
  constructor(path, displayname) {
    this.path = path;
    this.displayname = displayname;
  }
  
  loadSTRUCT(reader) {
    reader(this);
  }
}
RecentPath.STRUCT = `
  RecentPath {
    path        : string;
    displayname : string;
  }
`;

export class AppSettings {
  constructor() {
    this.reload_defaults(false);
    this.recent_paths = [];
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

  loadFrom(b, load_theme=true) {
    this.unit = b.unit;
    this.unit_scheme = b.unit_scheme;
    this.theme = b.theme;

    if (load_theme) {
      loadTheme(this.theme);
    }

    return this;
  }

  download(callback) {
    console.warn("Deprecated function AppSettings.prototype.download() called");
    
    this.load().then(() => {
      if (callback) {
        callback();
      }
    });
  }

  load() {
    return new Promise((accept, reject) => {
      myLocalStorage.getAsync("_fairmotion_settings").then((data) => {
        console.log("Loading saved settings. . . ");

        data = new DataView(b64decode(data).buffer);

        let fdata = g_app_state.load_blocks(data);
        let blocks = fdata.blocks;
        let fstruct = fdata.fstructs;
        let version = fdata.version;

        var settings = undefined;
        console.log(blocks);

        for (var i=0; i<blocks.length; i++) {
          if (blocks[i].type === "USET") {
            settings = fstruct.read_object(blocks[i].data, AppSettings);
            console.log("found settings:", settings);
          }
        }
        
        if (settings == undefined) {
          console.trace("could not find settings block");
          reject("could not find settings block, but did get a file");
          return;
        }

        this.loadFrom(settings);
        accept(this);
      });
    });
  }

  save() {
    var data = this.gen_file().buffer;
    data = b64encode(new Uint8Array(data));
    
    myLocalStorage.set("_fairmotion_settings", data);
  }

  gen_file() {
    let blocks = {USET : this};
    
    var args = {blocks : blocks};
    return g_app_state.write_blocks(args);
  }

  find_recent_path(path) {
    for (var i=0; i<this.recent_paths.length; i++) {
      if (this.recent_paths[i].path == path) {
        return i;
      }
    }
    
    return -1;
  }
  
  add_recent_file(path, displayname=path) {
    var rp = this.find_recent_path(path);
    path = new RecentPath(path, displayname);
    
    if (rp >= 0) {
      this.recent_paths.remove(this.recent_paths[path]);
      this.recent_paths.push(path);
    } else if (this.recent_paths.length >= config.MAX_RECENT_FILES) {
      this.recent_paths.shift();
      this.recent_paths.push(path);
    } else {
      this.recent_paths.push(path);
    }
  }

  loadSTRUCT(reader) {
    reader(this);

    if (typeof this.theme !== "string") {
      this.theme = defaultTheme;
    }
  }
}
AppSettings.STRUCT = `
AppSettings {
  unit_scheme  : string;
  unit         : string;
  theme        : string;
  recent_paths : array(RecentPath);
}
`;


export class OldAppSettings {
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
  
  find_recent_path(path) {
    for (var i=0; i<this.recent_paths.length; i++) {
      if (this.recent_paths[i].path == path) {
        return i;
      }
    }
    
    return -1;
  }
  
  add_recent_file(path, displayname=path) {
    var rp = this.find_recent_path(path);
    path = new RecentPath(path, displayname);
    
    if (rp >= 0) {
      this.recent_paths.remove(this.recent_paths[path]);
      this.recent_paths.push(path);
    } else if (this.recent_paths.length >= config.MAX_RECENT_FILES) {
      this.recent_paths.shift();
      this.recent_paths.push(path);
    } else {
      this.recent_paths.push(path);
    }
  }

  toJSON() {
    return this;
  }

  static fromJSON(obj) {
    var as = new AppSettings();
    
    as.unit_scheme = obj.unit_scheme;
    as.unit = obj.unit;
    
    return as;
  }
  
  static fromSTRUCT(reader) {
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
  
  download(on_finish=undefined) {
    function finish(DataView data) {
      function finish2(DataView data) {  
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
          global g_theme;
          
          console.log("loading theme");
          
          //add any new colors
          g_theme.patch(settings.theme);
          g_theme = settings.theme;
          delete settings.theme;
          g_theme.gen_globals();
        }
        
        g_app_state.session.settings = settings;
        if (g_app_state.screen != undefined) {
          redraw_viewport();
          redraw_ui();
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
          var settings = b64decode(settings);
          settings = new DataView(settings.buffer);
        
          finish(settings);
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
  constructor() {
    this.next = undefined;
    this.active = undefined;
  }
  
  server_push(AppSettings settings) {
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
  
  finish(UploadJob job) {
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
  constructor(data, AppSettings settings=undefined) {
    this.cancel = false;
    this.data = data;
    this.done = false;
    this.settings = settings;
  }
}

function upload_settings(AppSettings settings, SettUploadManager uman) {
  var path = "/"+fairmotion_settings_filename;
  
  var data = settings.gen_file().buffer;
  var pnote = g_app_state.notes.progbar("upload settings", 0.0, "uset");
  var ctx = new Context();
  
  var ujob = new UploadJob(data);
  var did_error = false;
  function error(job, owner, msg) {
    if (!did_error) {
      uman.finish(ujob);
      pnote.end();
      
      g_app_state.notes.label("Network Error");
      did_error = true;
    }
  }
  
  function status(job, owner, status) {
    pnote.set_value(status.progress);
    //console.log("status: ", status.progress, 1.0);
  }
  
  var this2 = this;
  function finish(job, owner) {
    //console.log("settings upload finished! yay!");
    uman.finish(ujob);
  }

  var token = g_app_state.session.tokens.access;
  var url = "/api/files/upload/start?accessToken="+token+"&path="+path
  var url2 = "/api/files/upload?accessToken="+token;
  
  call_api(upload_file, {data:data, url:url, chunk_url:url2}, finish, error, status);
  
  return ujob;
}

