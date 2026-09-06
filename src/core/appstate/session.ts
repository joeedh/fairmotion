/* The logged-in user, as far as fairmotion still has one.

   This came from AllShape, which had accounts and a server.  Nothing signs in
   any more, so what survives is a wrapper that keeps AppSettings in
   localStorage under the key "session" and answers yes to every question about
   whether the user is logged in. */

import { AppSettings } from "../UserSettings.js";

/* A UserSession as it round-trips through localStorage: fields only, and
   .settings is discarded on read in favour of a fresh AppSettings.load(). */
interface UserSessionJSON {
  tokens: { [name: string]: string };
  username: string;
  password: string;
  is_logged_in: boolean;
  userid?: string;
}

//truly ancient class, from AllShape.
export class UserSession {
  tokens: { [name: string]: string };
  username: string;
  password: string;
  is_logged_in: boolean;
  loaded_settings: boolean;
  settings: AppSettings;
  /* AllShape's server-side account id. Nothing sets it any more. */
  userid?: string;

  constructor() {
    this.tokens = {};
    this.username = "user";
    this.password = "";
    this.is_logged_in = true; //false;
    this.loaded_settings = false;
    this.userid = undefined;

    this.settings = new AppSettings();
    this.settings.load();
  }

  copy(): UserSession {
    let c = new UserSession();

    for (let k in this.tokens) {
      c.tokens[k] = this.tokens[k];
    }
    c.username = this.username;
    c.password = this.password;
    c.is_logged_in = this.is_logged_in;
    c.loaded_settings = false;
    c.settings = this.settings;
    c.userid = this.userid;

    return c;
  }

  store(override_settings = false) {
    let saveobj = this.copy();

    if (!override_settings && myLocalStorage.hasCached("session")) {
      try {
        let old = JSON.parse(myLocalStorage.getCached("session") ?? "null");
        saveobj.settings = old;
      } catch (error) {
        print_stack(error);
        console.log("error loading session json object");
      }
    }

    myLocalStorage.set("session", JSON.stringify(saveobj));
  }

  logout_simple() {
    //this.is_logged_in = false;
    //this.tokens = {};
    //this.loaded_settings = false;
  }

  validate_session() {
    return true;
  }

  static fromJSON(obj: UserSessionJSON) {
    let us = new UserSession();

    us.tokens = obj.tokens;
    us.username = obj.username;
    us.password = obj.password;
    us.is_logged_in = obj.is_logged_in;
    us.userid = obj.userid;

    us.settings = new AppSettings();
    us.settings.load();

    return us;
  }
}
