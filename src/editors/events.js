"use strict";

import {Vector2, Vector3, Matrix4} from '../path.ux/scripts/util/vectormath.js';
import {keymap, reverse_keymap} from "../path.ux/scripts/util/events.js";


export let charmap = keymap;
export let charmap_rev = reverse_keymap;

window.charmap = charmap;
window.charmap_rev = charmap_rev;

/*
this entire module needs to be rewritten.
*/


export class MyKeyboardEvent {
  constructor(code : int, shift : boolean = false, ctrl : boolean = false, alt : boolean = false) {
    this.keyCode = code;
    this.shiftKey = shift;
    this.ctrlKey = ctrl;
    this.altKey = alt;
  }
}

window.MyKeyboardEvent = MyKeyboardEvent;

export class MyMouseEvent {
  touches : Object;

  constructor(x : number, y : number, button : int, type : int) {
    this.x = x; this.y = y;
    this.button = button;
    this.type = type;
    
    this.touches = {};
  }
  
  copy(sub_offset : Array<number> = undefined) : MyMouseEvent {
    var ret = new MyMouseEvent(this.x, this.y, this.button, this.type);
    
    for (var k in this.touches) {
      var t = this.touches[k];
      var x = t[0], y = t[1];
      
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
MyMouseEvent.MOUSEMOVE = 0
MyMouseEvent.MOUSEDOWN = 1
MyMouseEvent.MOUSEUP   = 2
MyMouseEvent.LEFT  = 0
MyMouseEvent.RIGHT = 1

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

//used to keep right click menus from cancelling certain tools
var _swap_next_mouseup = false;
var _swap_next_mouseup_button = 2;
export function swap_next_mouseup_event(button) {
  _swap_next_mouseup = true;
  _swap_next_mouseup_button = button;
}

var _ignore_next_mouseup = false;
var _ignore_next_mouseup_button = 2;
export function ignore_next_mouseup_event(button) {
  _ignore_next_mouseup = true;
  _ignore_next_mouseup_button = button;
}

export class EventHandler {
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
  
  push_touch_delay(delay_ms : number) {
    this.touch_delay_stack.push(this.touch_delay);
    this.touch_delay = delay_ms;
  }
  
  pop_touch_delay() {
    if (this.touch_delay_stack.length === 0) {
      console.log("Invalid call to EventHandler.pop_touch_delay!");
      return;
    }
    
    this.touch_delay = this.touch_delay_stack.pop();
  }
  
  set touch_delay(delay_ms : number) {
    if (delay_ms === 0) {
      this.touch_manager = undefined;
    } else {
      if (this.touch_manager === undefined)
        this.touch_manager = new TouchEventManager(this, delay_ms);
      else
        this.touch_manager.delay = delay_ms;
    }
  }
  
  get touch_delay() : int {
    if (this.touch_manager == undefined)
      return 0;
    
    return this.touch_manager.delay;
  }
  
  on_tick() {
    if (this.touch_manager != undefined)
      this.touch_manager.process();
  }
  
  bad_event(event : Event) {
    var tm = this.touch_manager;
    
    if (tm === undefined)
      return false;
    
    if (this.touch_manager !== undefined)
      this.touch_manager.process();
    //if (this instanceof View2DHandler)
    //  console.log(event._good, "in bad_event", this.touch_manager, event);
    
    if (tm !== undefined && event instanceof MyMouseEvent) {
      //count touch events
      var i=0;
      for (var k in event.touches) {
        i++;
      }
      //only consider touch events
      if (i===0) return false;
      if ("_good" in event) return false;
      
      //console.log("bad event!");
      this.touch_manager.queue_event(event);
      
      return true;
    }
    
    return false;
  }
  
  on_textinput(event : Object) { }
  on_keydown(event : KeyboardEvent) { }
  on_charcode(event : KeyboardEvent) { }
  on_keyinput(event : KeyboardEvent) { }
  on_keyup(event : KeyboardEvent) { }
  on_mousemove(event : MouseEvent) { }
  on_mousedown(event : MouseEvent) { }
  on_doubleclick(event : MouseEvent) { }
  on_pan(pan : Array<number>, last_pan : Array<number>) {}
  
  on_gl_lost(new_gl : WebGLRenderingContext) { }
  
  //touch events
  on_mouseup2(event : MouseEvent) { }
  on_mouseup3(event : MouseEvent) { }
  
  on_mousedown2(event : MouseEvent) { }
  on_mousedown3(event : MouseEvent) { }
  
  on_mousemove2(event : MouseEvent) { }
  on_mousemove3(event : MouseEvent) { }
  
  on_mousewheel(event : MouseEvent) { }
  on_mouseup(event : MouseEvent) { }
  on_resize(newsize : Array<number>) { }
  on_contextchange(event : Object) { }
  on_draw(gl : WebGLRenderingContext) { }

  has_modal() {
      return this.modalhandler != null;
  }

  push_modal(handler : EventHandler)
  {
    if (this.modalhandler != null) {
      this.modalstack.push(this.modalhandler);
    }
    this.modalhandler = handler;
  }

  pop_modal() 
  {
    if (this.modalhandler != null) {
      //console.log("Popping modal handler", this.modalhandler.constructor.name, this.modalstack.length);
    }
    
    if (this.modalstack.length > 0) {
      this.modalhandler = this.modalstack.pop();
    } else {
      this.modalhandler = null;
    }
  }

  //resize events aren't modal
  _on_resize(newsize : Array<number>)
  { 
    this.on_resize(event);
  }
  
  _on_pan(pan : Array<number>, last_pan : Array<number>)
  {
    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_pan(event);
    else
      this.on_pan(event);
  }
  
  _on_textinput(event : ObjectMap)
  {
    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_textinput(event);
    else
      this.on_textinput(event);
  }
  
  _on_keydown(event : KeyboardEvent)
  { 
    if (this.bad_event(event)) return;
    
    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_keydown(event);
    else
      this.on_keydown(event);
  }

  _on_charcode(event : KeyboardEvent)
  { 
    if (this.bad_event(event)) return;
    
    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_charcode(event);
    else
      this.on_charcode(event);
  }

  _on_keyinput(event : InputEvent)
  { 
    if (this.bad_event(event)) return;
    
    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_keyinput(event);
    else
      this.on_keyinput(event);
  }

  _on_keyup(event : KeyboardEvent)
  { 
    if (this.bad_event(event)) return;
    
    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_keyup(event);
    else
      this.on_keyup(event);
  }

  _on_mousemove(event : MouseEvent)
  { 
    if (this.bad_event(event)) return;
    
    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_mousemove(event);
    else
      this.on_mousemove(event);
  }

  _on_doubleclick(event : MouseEvent)
  {
    if (this.bad_event(event)) return;
    
    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_doubleclick(event);
    else
      this.on_doubleclick(event);
  }
  
  _on_mousedown(event : MouseEvent)
  { 
    if (this.bad_event(event)) return;
    
    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_mousedown(event);
    else
      this.on_mousedown(event);
  }
    
  _on_mouseup(event : MouseEvent)
  { 
    if (this.bad_event(event)) return;
    
    if (_swap_next_mouseup && event.button == _swap_next_mouseup_button) {
      event.button = _swap_next_mouseup_button==2 ? 0 : 2;
      _swap_next_mouseup = false;
    }
    
    if (_ignore_next_mouseup && event.button == _ignore_next_mouseup_button) {
      _ignore_next_mouseup = false;
      return;
    }
    
    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_mouseup(event);
    else
      this.on_mouseup(event);
  }

  //# $(DomMouseEvent, Number).void
  _on_mousewheel(event : MouseEvent, delta : number)
  { 
    if (this.bad_event(event)) return;
    
    if (this.modalhandler != null && this.modalhandler !== this)
      this.modalhandler._on_mousewheel(event, delta);
    else
      this.on_mousewheel(event, delta);
  }
}

var valid_modifiers = {"SHIFT": 1, "CTRL": 2, "ALT": 4}

window.charmap = charmap;
window.charmap_rev = charmap_rev;

export class HotKey {
  key : number
  keyAscii : string
  ctrl : boolean
  shift : boolean
  alt : boolean
  uiName : string;

  constructor(key, modifiers, uiName, menunum, ignore_charmap_error) { //menunum is optional, defaults to undefined
    this.uiName = uiName;

    if (!charmap.hasOwnProperty(key)) {
      if (ignore_charmap_error !== undefined && ignore_charmap_error !== true) {
        console.trace();
        console.log("Invalid hotkey " + key + "!");
      }

      this._key = 0;
      this.keyAscii = "[corrupted hotkey]"
      this.shift = this.alt = this.ctrl = false;

      return this;
    }
    
    if (typeof(key) === "string") {
      if (key.length === 1)
        key = key.toUpperCase()
    
      this.keyAscii = key
      this._key = charmap[key];
    } else {
      this._key = key;
      this.keyAscii = charmap[key]
    }
    
    this.shift = this.alt = this.ctrl = false;
    this.menunum = menunum
    
    for (var i=0; i<modifiers.length; i++) {
      if (modifiers[i] === "SHIFT") {
        this.shift = true;
      } else if (modifiers[i] === "ALT") {
        this.alt = true;
      } else if (modifiers[i] === "CTRL") {
        this.ctrl = true;
      } else {
        console.trace()
        console.log("Warning: invalid modifier " + modifiers[i] + " in KeyHandler")
      }
    }
  }

  copy() {
    let modifiers = [];

    if (this.ctrl)
      modifiers.push("CTRL")
    if (this.shift)
      modifiers.push("SHIFT");
    if (this.alt)
      modifiers.push("ALT");

    return new HotKey(this.key, modifiers, this.uiName, this.menunum);
  }

  set key(v) {
    this._key = v;
    this.keyAscii = charmap[v];
  }

  get key() {
    return this._key;
  }

  build_str(add_menu_num) : String {
    let s = ""

    if (this.ctrl) s += "CTRL-"
    if (this.alt) s += "ALT-"
    if (this.shift) s += "SHIFT-"
    
    s += this.keyAscii
    
    return s;
  }
  
  [Symbol.keystr]() : String {
    return this.build_str(false)
  }

  loadSTRUCT(reader) {
    reader(this);
  }
}

HotKey.STRUCT = `
HotKey {
  key      : number;
  keyAscii : string;
  ctrl     : bool;
  shift    : bool;
  alt      : bool;
  uiName   : string;
}
`;

export class HotKeyPatch {
  constructor(keymapPathId : string, src_hk : HotKey, new_hk : HotKey, toolstr : string = undefined) {
    this.src = src_hk;
    this.dst = new_hk;
    this.pathid = keymapPathId;
    this.toolstr = toolstr;
  }

  [Symbol.keystr]() {
    let ret = this.src[Symbol.keystr]() + ":" + this.pathid;

    if (this.toolstr) {
      ret += ":" + this.toolstr;
    }

    return ret;
  }

  loadSTRUCT(reader : Function) {
    reader(this);

    if (this.toolstr === "") {
      this.toolstr = undefined;
    }
  }
}

HotKeyPatch.STRUCT = `
HotKeyPatch {
  src      : HotKey;
  dst      : HotKey;
  pathid   : string;
  toolstr  : string | this.toolstr === undefined ? "" : this.toolstr;
}
`

export class HotKeyPatchSet extends Array {
  constructor() {
    super();

    this.map = new hashtable();
  }

  add(patch) {
    this.map.set(patch, patch);
  }

  has(key) {
    return this.map.has(key);
  }

  get(key) {
    return this.map.get(key);
  }

  set(patch) {
    if (this.indexOf(patch) < 0) {
      this.add(patch);
    } else {
      this.map.set(patch, patch);
    }
  }

  remove(patch) {
    if (this.indexOf(patch) < 0) {
      return;
    }

    super.remove(patch);
    this.map.remove(patch);
  }

  loadSTRUCT(reader) {
    reader(this);

    for (let p of this.patches) {
      this.add(p);
    }

    delete this.patches;
  }
}

HotKeyPatchSet.STRUCT = `
HotKeyPatchSet {
  patches : array(HotKeyPatch) | this; 
}
`;

export class KeyMap extends hashtable {
  op_map : hashtable;

  constructor(pathid : string) {
    super();

    this.pathid = "" + pathid;
    this.op_map = new hashtable();
  }

  concat(keymap) {
    for (let key of keymap) {
      this.add(key, keymap.get(key));
    }

    return this;
  }

  get_tool_handler(toolstr) {
    if (this.op_map.has(toolstr))
      return this.op_map.get(toolstr);
  }

  add_tool(keyhandler, toolstr) {
    this.add(keyhandler, new ToolKeyHandler(toolstr));
    this.op_map.add(toolstr, keyhandler);
  }

  add_func(keyhandler, func) {
    this.add(keyhandler, new FuncKeyHandler(func));
  }

  add(keyhandler, value) {
    if (this.has(keyhandler)) {
      console.trace()
      console.log("Duplicate hotkey definition!")
    }
    
    if (value instanceof ToolKeyHandler && !(typeof value.tool == "string" || value.tool instanceof String)) {
      value.tool.keyhandler = keyhandler;
    }
    
    super.set(keyhandler, value);
  }

  process_event(ctx : Context, event : KeyboardEvent, patchset : HotKeyPatchSet) : Object {
    var modlist = []

    if (event.ctrlKey) modlist.push("CTRL")
    if (event.shiftKey) modlist.push("SHIFT")
    if (event.altKey) modlist.push("ALT")
    
    var key = new HotKey(event.keyCode, modlist, 0, 0, true);

    if (this.has(key)) {
      //patchset
      let hk;

      ctx.keymap_mpos[0] = ctx.screen.mpos[0];
      ctx.keymap_mpos[1] = ctx.screen.mpos[1];


      if (patchset && patchset.has(key2)) {
        let hk1 = this.get(key)
        let hk2 = patchset.get(key2);
      } else {
        hk = this.get(key)
      }

      hk.handle(ctx);
      return true;
    }

    return undefined;
  }
}

export class KeyHandlerCls {
  handle(ctx : FullContext) {
  }
}

export class ToolKeyHandler extends KeyHandlerCls {
  constructor(tool : String) {
    super();
    this.tool = tool;
  }
  
  handle(ctx : FullContext) {
    ctx.api.execTool(ctx, this.tool);
  }
}

export class FuncKeyHandler extends KeyHandlerCls {
  constructor(func) {
    super();
    this.handle = func;
  }
}

let _was_clamped_cp = [0, 0];

//helper class for implementing velocity pan
export class VelocityPan extends EventHandler {
  start_mpos : Vector2
  last_mpos : Vector2
  mpos : Vector2
  start_time : number
  coasting : boolean
  panning : boolean
  was_touch : boolean
  enabled : boolean
  vel : Vector2
  pan : Vector2
  damp : number
  can_coast : boolean
  start_pan : Vector2
  first : boolean
  last_ms : number;

  constructor() {
    super();

    this.start_mpos = new Vector2();
    this.last_mpos = new Vector2();
    
    this.mpos = new Vector2();

    this.start_time = 0;
    this.owner = undefined : EventHandler;
    
    this.coasting = false;
    this.panning = false;
    this.was_touch = false;
    
    this.enabled = true;
    
    this.vel = new Vector2();
    this.pan = new Vector2();
    this.damp = 0.99;
    
    this.can_coast = true;
    
    this.start_pan = new Vector2();
    
    this.first = false;
    this.last_ms = 0;
    this.vel = new Vector2();
  }
  
  on_tick() {
    if (!this.panning && this.coasting) {
      let vel = new Vector2();
      var damp = 0.99;
      
      vel.load(this.vel);
      vel.mulScalar(time_ms() - this.last_ms);
      this.vel.mulScalar(damp);
      
      this.last_ms = time_ms();
      
      this.pan.sub(vel);
      var was_clamped = this.clamp_pan();
      this.owner.on_pan(this.pan, this.start_pan);
      
      var stop = was_clamped !== undefined && (was_clamped[0] && was_clamped[1])
      stop = stop || this.vel.vectorLength < 1;
      
      if (stop)
        this.coasting = false;
    }
  }
  
  calc_vel() {
    let vel = new Vector2();
    
    if (!this.can_coast) {
      this.vel.zero();
      this.coasting = false;
      this.last_ms = time_ms();
      return;
    }
    
    var t = time_ms() - this.start_time;
    if (t < 10) {
      console.log("small t!!!", t);
      return;
    }
    
    vel.load(this.last_mpos).sub(this.mpos).divideScalar(t);
    
    //blend with last value, if it exists
    this.vel.add(vel);
    /*if (this.vel.vectorLength() > 0.0) {
      this.vel.load(vel);
      this.vel.add(vel);
      this.vel.mulScalar(0.5);
    } else {
      this.vel.load(vel);
    }*/
    
    this.coasting = (this.vel.vectorLength() > 0.25);
    this.last_ms = time_ms();
  }
  
  start(start_mpos : Array<number>, last_mpos : Array<number>, owner : Object,
        push_modal_func : Function, pop_modal_func : Function) {
    
    if (this.panning) {
      console.trace("warning, duplicate call to VelocityPan.start()");
      //this.end();
      return;
    }
    
    this.vel.zero();
    
    this.pop_modal_func = pop_modal_func;
    this.coasting = false;
    this.first = false; //true;
    this.owner = owner;
    
    this.panning = true;
    push_modal_func(this);
    
    this.start_pan.load(this.pan);
    
    this.last_ms = time_ms();
    this.start_time = time_ms();
    this.was_touch = g_app_state.was_touch;
    
    this.start_mpos.load(start_mpos);
    this.last_mpos.load(start_mpos);
    this.mpos.load(start_mpos);
    
    this.do_mousemove(last_mpos);
  }
  
  end() {
    console.log("in end");
    
    if (this.panning) {
      console.log("  pop modal");
      this.pop_modal_func();
    }
    
    this.panning = false;
  }
  
  do_mousemove(mpos : Array<float>) {
    //console.log("mpos", mpos);
    
    //its hard to get on_mousedown to always
    //give coordinates in same space as on_mousemove,
    //which is why init of these vars is down here,
    //not in .start().
    if (DEBUG.touch) {
      console.log("py", mpos[1]);
    }
    /*if (this.first) {
      this.mpos.load(mpos);
      this.last_mpos.load(mpos);
      this.start_mpos.load(mpos);
      this.first = false;
      return;
    }*/
    
    this.last_mpos.load(this.mpos);
    this.mpos.load(mpos);
    
    this.pan[0] = this.start_pan[0] + mpos[0] - this.start_mpos[0];
    this.pan[1] = this.start_pan[1] + mpos[1] - this.start_mpos[1];
    
    this.vel.zero();
    this.calc_vel();
    
    this.clamp_pan();
    this.owner.on_pan(this.pan, this.start_pan);
  }
  
  clamp_pan() {
    var bs = this.owner.pan_bounds;
    if (this.owner.state & 8192*4) return;
    //console.log("clamping", this.owner);
    
    var p = this.pan;
    let was_clamped = _was_clamped_cp;

    was_clamped[0] = false;
    was_clamped[1] = false;
    
    for (var i=0; i<2; i++) {
      var l = p[i];
      p[i] = Math.min(Math.max(bs[0][i], p[i]), bs[0][i]+bs[1][i]);
      
      if (p[i] !== l)
        was_clamped[i] = true;
    }
    
    return was_clamped;
  }
  
  on_mouseup(event : MouseEvent) {
    console.log("pan mouse up!", this.panning, this.owner);
    
    if (this.panning) {
      this.mpos.load([event.y, event.y]);
      this.calc_vel();
      this.end();
    }
  }
  
  on_mousemove(event : MouseEvent) {
    this.do_mousemove([event.x, event.y]);
  }
  
  set_pan(pan : Array<number>) {
    if (this.panning)
      this.end();
      
    this.pan.load(pan);
    this.coasting = false;
    this.vel.zero();
  }
}

export class TouchEventManager {
  constructor(owner : EventHandler, delay : number = 100) {
    this.init(owner, delay);
  }

  init(owner : EventHandler, delay : number = 100) {
    this.queue = new GArray();
    this.queue_ms = new GArray();
    this.delay = delay;
    this.owner = owner;
  }
  
  get_last(type : int) {
    var i = this.queue.length;
    if (i == 0) return undefined;
    i--;
    
    var q = this.queue;
    
    while (i >= 0) {
      var e = q[i];
      if (e.type === type || e.type !== MyMouseEvent.MOUSEMOVE)
        break;
      i--;
    }
    
    if (i < 0) i = 0;
    
    return q[i].type === type ? q[i] : undefined;
  }
  
  queue_event(event : MouseEvent) {
    var last = this.get_last(event.type);

    if (DEBUG.touch && this === touch_manager)
      console.log("touch event", event.type);
    
    //merge repeated events, which may
    //contain different touch states
    if (last !== undefined && last.type !== MyMouseEvent.MOUSEMOVE) {
      var dis, same=true;
      
      for (var k in event.touches) {
        if (!(k in last.touches)) { 
          //same = false;
        }
      }
      
      //only compare same ids
      dis = new Vector2([event.x, event.y]).vectorDistance(new Vector2([last.x, last.y]));
      
      if (DEBUG.touch && this === touch_manager)
        console.log(dis);
      
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
  
  cancel(event : MouseEvent) {
    var ts = event.touches;
    var dl = new GArray;
    
    if (DEBUG.touch && this === touch_manager)
      console.log("touch cancel", event);
      
    for (var e in this.queue) {
      for (var k in ts) {
        if (k in e.touches) {
          delete e.touches;
        }
      }
      
      if (list(e.touches).length === 0) {
        dl.push(e);
      }
    }
    
    for (var e in dl) {
      var i = this.queue.indexOf(e);
      this.queue.remove(e);
      this.queue_ms.pop_i(i);
    }
  }
  
  process() {
    var owner = this.owner;
    
    var dl = new GArray();
    var q = this.queue;
    var qm = this.queue_ms;
    var delay = this.delay;
    
    for (var i=0; i<q.length; i++) {
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
          if (DEBUG.touch)
            console.log("td1", e.x, e.y);
          owner._on_mousedown(e);
          if (DEBUG.touch)
            console.log("td2", e.x, e.y);
        } else if (e.type === MyMouseEvent.MOUSEMOVE) {
          owner._on_mousemove(e);
        } else if (e.type === MyMouseEvent.MOUSEUP) {
          owner._on_mouseup(e);
        }
      } catch (_err) {
        print_stack(_err)
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
var touch_manager = window.touch_manager = new TouchEventManager(undefined, 20);
