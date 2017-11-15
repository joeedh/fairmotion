import * as config from 'config';
import * as ajax from 'ajax';

window.init_google_apis = function() {
  if (!config.USE_GOOGLE_OAUTH)
    return;
  
  startup_report("Setting up Google APIs");
  gapi.client.setApiKey(config.GOOGLE_API_KEY);
}

export function auth_session(user, password, finish, error, status) {
  var oauthconfig = {
    client_id : config.GOOGLE_CLIENT_KEY,
    scopes    : "https://www.googleapis.com/auth/drive",
    immediate : true
  };
  
  function finish() {
    console.log("finish", arguments);
  }
  function error() {
    console.log("error", arguments);
  }
  function* joblet(job) {
    var clientid = config.GOOGLE_CLIENT_KEY;
    var scope = "https://www.googleapis.com/auth/drive";
    var url = "https://accounts.google.com/o/oauth2/v2/auth?";
    
    url += "scope=" + scope;
    url += "&response_type=token"
    url += "&client_id=" + clientid;
    url += "&redirect_uri=http://localhost"; //localhost";
    
    api_exec(url, job, "GET", undefined, "application/x-javascript");
    yield;
    
    console.log("result:", job.val, job);
  }
  
  call_api(joblet, {}, finish, error);
  
  /*
  gapi.auth.authorize(oauthconfig, function(result) {
    if (result && result.error) {
      console.log("error!");
    } else {
      throw result;
      console.log(typeof result, result.__proto__);
      console.log("login completed:", result, gapi.auth.getToken(), Object.keys(gapi.auth.getToken()));
    }
  });*/
}
