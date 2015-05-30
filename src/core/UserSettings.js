import * as config from 'config';

import {b64encode, b64decode} from 'strutils';
import {download_file} from 'dialogs';
import {STRUCT} from 'struct';

export class AppSettings {
  constructor() {
    this.unit_scheme = "imperial";
    this.unit = "in";
    this.last_server_update = 0;
    this.update_waiting = false;
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
  
  server_update() {
    //console.trace("server settings push");
    
    if (time_ms() - this.last_server_update > 3000) {
      //console.log("pushing settings to server. . .");
      _settings_manager.server_push(this);
      
      this.last_server_update = time_ms();
      this.update_waiting = false;
    } else {
      this.update_waiting = true;
    }
  }
  
  gen_file() : {
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
        if (g_app_state.screen != undefined)
          g_app_state.screen.do_full_recalc();
        
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
        console.log("getting settings from localStorage. . .");
        
        if (localStorage._settings != undefined) {
            var settings = b64decode(localStorage._settings);
            settings = new DataView(settings.buffer);
            
            finish(settings);
        }
    } else {
        download_file("/" + allshape_settings_filename, finish, "Settings", true);
    }
  }
}

AppSettings.STRUCT = """
  AppSettings {
    unit_scheme : string;
    unit        : string;
    theme       : Theme | g_theme;
  }
""";

export class SettUploadManager {
  constructor() {
    this.next = undefined;
    this.active = undefined;
  }
  
  server_push(AppSettings settings) {
    console.log("write settings");
    if (config.NO_SERVER) { //save to localStorage
        console.log("write settings2");
        var data = settings.gen_file().buffer;
        data = b64encode(new Uint8Array(data));
        
        localStorage._settings = data;
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
  var path = "/"+allshape_settings_filename;
  
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

