/*
Okay, I should have something simiilar in the codebase somewhere (I think it was a tutorial mode
 or something), but it's way too outdated for me to use at this point.
*/

/*
  Events to record:

  - Input device events
  - UI events
  - Datapath API events
  - Tool api invokation
  - Undo events (part of tool api?)
 */

export var RecTypes = {
  IO       : 1,
  UI       : 2,
  DATAPATH : 4,
  TOOL     : 8,
  UNDO     : 16
};

export var RecFlags = {
};

export var RecStates = {
  NONE      : 0,
  RECORDING : 1,
  PLAYING   : 2
};

export class RecEvent {
  constructor(type) {
    this.type = type;
    this.time = undefined;
  }
}

export class Recorder {
  constructor(type) {
    this.type = type;
    this.flag = 0;
    this.manager = undefined;
  }

  start(manager) {
    this.manager = manager;
  }

  stop() {

  }
}

export class IOEvent extends RecEvent {
  constructor(eventkey, data) {
    super(RecTypes.IO);

    this.eventkey = eventkey;
    this.data = data;
  }
}

export class IORecorder extends Recorder{
  constructor() {
    super(RecTypes.IO);
    this.bindings = [];
  }

  bind(eventkey, func) {
    func = func.bind(this);
    var scr = g_app_state.screen;

    this.bindings.push([eventkey, func, scr["_" + eventkey]]);
    scr["_" + eventkey] = func;
  }

  unbind_all() {
    var scr = g_app_state.screen;

    for (var bind of this.bindings) {
      scr[bind[0]] = bind[2];
    }

    this.bindings = [];
  }

  start(manager) {
    super.start(manager);

    function copymouse(e) {
      return JSON.parse(JSON.stringify(e));
    };

    function copytouch(e) {
      return JSON.parse(JSON.stringify(e));
    };

    var mice = ["on_mousedown", "on_mouseup", ,"on_mousemove"];
    var touch = ["on_touchdown", "on_touchcancel", "on_touchup", "on_touchmove"];

    for (var m of mice) {
      this.bind(m, function(e) {
        var e2 = new IOEvent(m, e.button);

        this.manager.pushEvent(copymouse(e2));
      });
    }

    for (var m of touch) {
      this.bind(m, function(e) {
        var e2 = new IOEvent(m, e.button);

        this.manager.pushEvent(copytouch(e2));
      });
    }

    function copykey(e) {
      return {
        keyCode : e.keyCode,
        shiftKey : e.shiftKey,
        altKey : e.altKey,
        controlKey : e.controlKey
      };
    };

    this.bind("on_keydown", function(e) {
      this.manager.pushEvent(new IOEvent("on_keydown", {keyCode : e.keyCode}));
    })
  }

  stop() {
    this.unbind_all();
  }
}

export class RecManager {
  constructor() {
    this.recorders = [];
    this.events = [];
    this.start_time = this.end_time = 0;
    this.state = RecStates.NONE;
  }

  pushEvent(event) {
    event.time = time_ms();
    this.events.push(event);
  }

  reset() {
    if (this.state == RecStates.RECORDING) {
      this.stop();
    }

    this.events = [];
  }

  stop() {
    this.end_time = time_ms();
    this.state = RecStates.NONE;

    for (var r of this.recorders) {
      r.stop();
    }
  }

  start() {
    if (this.state == RecStates.PLAYING) {
      this.stop();
    }

    this.start_time = time_ms();

    for (var r of this.recorders) {
      r.start();
    }
  }
}
