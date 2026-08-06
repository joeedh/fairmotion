"use strict";

import { Vector2, Vector3, Matrix4 } from "../path.ux/scripts/util/vectormath.js";
import { keymap, reverse_keymap } from "../path.ux/scripts/util/events.js";
import type { KeyMap } from "../core/keymap.js";

/* A finger currently down, as [x, y] in the same space as event.x/event.y. */
export type TouchMap = { [id: string]: number[] };

export let charmap = keymap;
export let charmap_rev = reverse_keymap;

window.charmap = charmap;
window.charmap_rev = charmap_rev;

/*
this entire module needs to be rewritten.
*/

export class MyKeyboardEvent {
  keyCode: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;

  constructor(code: number, shift: boolean = false, ctrl: boolean = false, alt: boolean = false) {
    this.keyCode = code;
    this.shiftKey = shift;
    this.ctrlKey = ctrl;
    this.altKey = alt;
  }
}

window.MyKeyboardEvent = MyKeyboardEvent;

/* The delayed-touch queue re-dispatches synthesized MyMouseEvents through the
   same handler entry points the DOM uses, so those take either. */
export type AnyMouseEvent = MouseEvent | MyMouseEvent;

export class MyMouseEvent {
  touches: TouchMap;

  /* Enumeration values for MyMouseEvent.type/button, assigned below the
     class body. */
  static MOUSEMOVE: number;
  static MOUSEDOWN: number;
  static MOUSEUP: number;
  static LEFT: number;
  static RIGHT: number;

  x: number;
  y: number;
  button: number;
  type: number;
  /* Set by TouchEventManager.process() once the event has cleared the delay
     queue, so bad_event() lets it through the second time around. */
  _good: boolean | undefined;

  constructor(x: number, y: number, button: number, type: number) {
    this.x = x;
    this.y = y;
    this.button = button;
    this.type = type;

    this.touches = {};
  }

  copy(sub_offset?: number[]): MyMouseEvent {
    var ret = new MyMouseEvent(this.x, this.y, this.button, this.type);

    for (var k in this.touches) {
      var t = this.touches[k];
      var x = t[0],
        y = t[1];

      if (sub_offset) {
        x -= sub_offset[0];
        y -= sub_offset[1];
      }

      ret.touches[k] = [x, y];
    }

    return ret;
  }
}

window.MyMouseEvent = MyMouseEvent;

/*enumeration values for MyMouseEvent.type*/
MyMouseEvent.MOUSEMOVE = 0;
MyMouseEvent.MOUSEDOWN = 1;
MyMouseEvent.MOUSEUP = 2;
MyMouseEvent.LEFT = 0;
MyMouseEvent.RIGHT = 1;

/*going to use DOM event structure for this one*/
/*class KeyEvent {
  constructor(key, keyascii, type) {
    this.key = key;
    this.keyascii = keyascii;
    this.type = type;

    //enumeration values for this.type
    this.KEYDOWN = 0;
    this.KEYUP = 1;
    this.KEYREPEAT = 2;
  }
}*/

/* NOTE: swap_next_mouseup_event()/ignore_next_mouseup_event() sat here with
   their two flag pairs.  Nothing has ever called either, and the swap branch
   in _on_mouseup() assigned to event.button -- a getter-only DOM property, so
   it would have thrown in strict mode had the flag ever been set. */

export class EventHandler {
  modalstack!: EventHandler[];
  modalhandler!: EventHandler | null;
  keymap!: KeyMap | null;
  /* Non-undefined only while touch events are being delayed. */
  touch_manager: TouchEventManager | undefined;
  touch_delay_stack!: number[];

  constructor() {
    this.EventHandler_init();
  }

  EventHandler_init() {
    this.modalstack = new Array<EventHandler>();
    this.modalhandler = null;
    this.keymap = null;
    this.touch_manager = undefined;
    this.touch_delay_stack = [];
  }

  push_touch_delay(delay_ms: number) {
    this.touch_delay_stack.push(this.touch_delay);
    this.touch_delay = delay_ms;
  }

  pop_touch_delay() {
    if (this.touch_delay_stack.length === 0) {
      console.log("Invalid call to EventHandler.pop_touch_delay!");
      return;
    }

    this.touch_delay = this.touch_delay_stack.pop()!;
  }

  set touch_delay(delay_ms: number) {
    if (delay_ms === 0) {
      this.touch_manager = undefined;
    } else {
      if (this.touch_manager === undefined)
        this.touch_manager = new TouchEventManager(this, delay_ms);
      else this.touch_manager.delay = delay_ms;
    }
  }

  get touch_delay(): int {
    if (this.touch_manager == undefined) return 0;

    return this.touch_manager.delay;
  }

  on_tick() {
    if (this.touch_manager != undefined) this.touch_manager.process();
  }

  bad_event(event: Event | MyMouseEvent) {
    var tm = this.touch_manager;

    if (tm === undefined) return false;

    if (this.touch_manager !== undefined) this.touch_manager.process();
    //if (this instanceof View2DHandler)
    //  console.log(event._good, "in bad_event", this.touch_manager, event);

    if (tm !== undefined && event instanceof MyMouseEvent) {
      //count touch events
      var i = 0;
      for (var k in event.touches) {
        i++;
      }
      //only consider touch events
      if (i === 0) return false;
      if ("_good" in event) return false;

      //console.log("bad event!");
      tm.queue_event(event);

      return true;
    }

    return false;
  }

  on_textinput(event: InputEvent) {}
  on_keydown(event: KeyboardEvent) {}
  on_charcode(event: KeyboardEvent) {}
  on_keyinput(event: KeyboardEvent) {}
  on_keyup(event: KeyboardEvent) {}
  on_mousemove(event: AnyMouseEvent) {}
  on_mousedown(event: AnyMouseEvent) {}
  on_doubleclick(event: MouseEvent) {}
  on_pan(pan: number[], last_pan: number[]) {}

  on_gl_lost(new_gl: WebGLRenderingContext) {}

  //touch events
  on_mouseup2(event: MouseEvent) {}
  on_mouseup3(event: MouseEvent) {}

  on_mousedown2(event: MouseEvent) {}
  on_mousedown3(event: MouseEvent) {}

  on_mousemove2(event: MouseEvent) {}
  on_mousemove3(event: MouseEvent) {}

  on_mousewheel(event: MouseEvent, delta?: number) {}
  on_mouseup(event: AnyMouseEvent) {}
  on_resize(newsize: number[]) {}
  on_contextchange(event: Event) {}
  on_draw(gl: WebGLRenderingContext) {}

  has_modal() {
    return this.modalhandler != null;
  }

  push_modal(handler: EventHandler) {
    if (this.modalhandler != null) {
      this.modalstack.push(this.modalhandler);
    }
    this.modalhandler = handler;
  }

  pop_modal() {
    if (this.modalhandler != null) {
      //console.log("Popping modal handler", this.modalhandler.constructor.name, this.modalstack.length);
    }

    if (this.modalstack.length > 0) {
      this.modalhandler = this.modalstack.pop()!;
    } else {
      this.modalhandler = null;
    }
  }

  /* NOTE: _on_resize() and _on_pan() sat here.  Both dropped their arguments
     and forwarded a bare `event`, i.e. window.event, and neither had a single
     caller -- _on_pan()'s only reference was its own recursive call. */

  _on_textinput(event: InputEvent) {
    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_textinput(event);
    else this.on_textinput(event);
  }

  _on_keydown(event: KeyboardEvent) {
    if (this.bad_event(event)) return;

    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_keydown(event);
    else this.on_keydown(event);
  }

  _on_charcode(event: KeyboardEvent) {
    if (this.bad_event(event)) return;

    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_charcode(event);
    else this.on_charcode(event);
  }

  _on_keyinput(event: KeyboardEvent) {
    if (this.bad_event(event)) return;

    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_keyinput(event);
    else this.on_keyinput(event);
  }

  _on_keyup(event: KeyboardEvent) {
    if (this.bad_event(event)) return;

    if (this.modalhandler != null && this.modalhandler !== this) this.modalhandler._on_keyup(event);
    else this.on_keyup(event);
  }

  _on_mousemove(event: AnyMouseEvent) {
    if (this.bad_event(event)) return;

    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_mousemove(event);
    else this.on_mousemove(event);
  }

  _on_doubleclick(event: MouseEvent) {
    if (this.bad_event(event)) return;

    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_doubleclick(event);
    else this.on_doubleclick(event);
  }

  _on_mousedown(event: AnyMouseEvent) {
    if (this.bad_event(event)) return;

    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_mousedown(event);
    else this.on_mousedown(event);
  }

  _on_mouseup(event: AnyMouseEvent) {
    if (this.bad_event(event)) return;

    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_mouseup(event);
    else this.on_mouseup(event);
  }

  //# $(DomMouseEvent, Number).void
  _on_mousewheel(event: MouseEvent, delta: number) {
    if (this.bad_event(event)) return;

    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_mousewheel(event, delta);
    else this.on_mousewheel(event, delta);
  }
}

var valid_modifiers = { "SHIFT": 1, "CTRL": 2, "ALT": 4 };

window.charmap = charmap;
window.charmap_rev = charmap_rev;

/* NOTE: a ~225-line VelocityPan class sat here, plus its _was_clamped_cp
   scratch array.  Nothing in the app ever constructed or imported it; the
   live velocity pan is VelPan in editors/velpan.ts. */

export class TouchEventManager {
  /* Events waiting out the delay, and the time_ms() each was queued at. */
  queue!: GArray<MyMouseEvent>;
  queue_ms!: GArray<number>;
  delay!: number;
  owner: EventHandler | undefined;

  constructor(owner?: EventHandler, delay: number = 100) {
    this.init(owner, delay);
  }

  init(owner?: EventHandler, delay: number = 100) {
    this.queue = new GArray();
    this.queue_ms = new GArray();
    this.delay = delay;
    this.owner = owner;
  }

  get_last(type: number) {
    var i = this.queue.length;
    if (i == 0) return undefined;
    i--;

    var q = this.queue;

    while (i >= 0) {
      var e = q[i];
      if (e.type === type || e.type !== MyMouseEvent.MOUSEMOVE) break;
      i--;
    }

    if (i < 0) i = 0;

    return q[i].type === type ? q[i] : undefined;
  }

  queue_event(event: MyMouseEvent) {
    var last = this.get_last(event.type);

    if (DEBUG.touch && this === touch_manager) console.log("touch event", event.type);

    //merge repeated events, which may
    //contain different touch states
    if (last !== undefined && last.type !== MyMouseEvent.MOUSEMOVE) {
      var dis,
        same = true;

      for (var k in event.touches) {
        if (!(k in last.touches)) {
          //same = false;
        }
      }

      //only compare same ids
      dis = new Vector2([event.x, event.y]).vectorDistance(new Vector2([last.x, last.y]));

      if (DEBUG.touch && this === touch_manager) console.log(dis);

      if (same && dis < 50) {
        if (DEBUG.touch && this === touch_manager)
          console.log("destroying duplicate event", last.type, event.x, event.y, event.touches);

        for (var k in event.touches) {
          last.touches[k] = event.touches[k];
        }

        return;
      }
    }

    this.queue.push(event);
    this.queue_ms.push(time_ms());
  }

  /* NOTE: a cancel() method sat here with no callers.  Both of its loops were
     `for (var e in <array>)`, so `e` was an index string: `k in e.touches`
     would have thrown a TypeError the first time the queue was non-empty. */

  process() {
    var owner = this.owner;

    var dl = new GArray<MyMouseEvent>();
    var q = this.queue;
    var qm = this.queue_ms;
    var delay = this.delay;

    for (var i = 0; i < q.length; i++) {
      if (time_ms() - qm[i] > delay) {
        dl.push(q[i]);
      }
    }

    //pop events from queue before firing them
    for (var e of dl) {
      var i = q.indexOf(e);

      q.remove(e);
      qm.pop_i(i);
    }

    //now, fire events
    for (var e of dl) {
      e._good = true;
      g_app_state.was_touch = true;

      try {
        if (e.type === MyMouseEvent.MOUSEDOWN) {
          if (DEBUG.touch) console.log("td1", e.x, e.y);
          owner!._on_mousedown(e);
          if (DEBUG.touch) console.log("td2", e.x, e.y);
        } else if (e.type === MyMouseEvent.MOUSEMOVE) {
          owner!._on_mousemove(e);
        } else if (e.type === MyMouseEvent.MOUSEUP) {
          owner!._on_mouseup(e);
        }
      } catch (_err) {
        print_stack(_err);
        console.log("Error executing delayed touch event");
      }
    }
  }

  reset() {
    this.queue = new GArray();
    this.queue_ms = new GArray();
  }
}

window.TouchEventManager = TouchEventManager;
var touch_manager = (window.touch_manager = new TouchEventManager(undefined, 20));
