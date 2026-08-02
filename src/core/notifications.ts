import {sendNote} from '../path.ux/scripts/widgets/ui_noteframe.js';

export class NotificationManager {
  label(label : string, description : string) {
    console.warn(label);
    sendNote(g_app_state.ctx.screen, label);
  }

  progbar(label : string, progress : number, description : string) {
    let f = progress.toFixed(1);
    sendNote(g_app_state.ctx.screen, label + " " + f + "%");
  }

  on_tick() {

  }
}
