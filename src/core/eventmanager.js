/*
 *
 * new event system:
 *
 * need to support "blocking" promise chains
 * (e.g. in draw), where events are queued
* */


export var types = [
  "draw",
  "keydown",
  "keyup",
  "keypress",
  "input",
  "textinput",
  "resize",
  "context",
  "mousedown",
  "mouseup",
  "mousemove",
  "DOMMouseScroll",
  "mousewheel",
  "touchstart",
  "touchcancel",
  "touchdrag",
  "touchend",
  "touchmove"
//  "contextmenu",
//  "selectstart"
];

let window_events = new Set(["keydown", "keyup", "keypress", "resize", "DOMMouseScroll", "mousewheel"]);
let document_events = new Set(["contextmenu", "selectstart", "input", "textinput"]);
let custom_events = new Set(["draw"]);

export class EventHandler {
  pushModal(manager) {
  
  }
  
  popModal(manager) {
  
  }
  
  _on_mousedown() {
  
  }
  
  _on_mouseup() {
  
  }
}

export function copyEvent(event) {
  let ret = {stopped : false};
  
  for (let k in event) {
    let v = event[k];
    let ok = typeof v == "number" || typeof v == "boolean" || typeof v == "object";
    ok = ok || k.search("touch") >= 0;
    
    if (ok) {
      ret[k] = v;
    }
  }
  
  //ret = JSON.parse(JSON.stringify(ret));
  
  ret.stopPropagation = event.stopPropagation.bind(event);
  ret.preventDefault = event.preventDefault.bind(event);
  
  return ret;
}

export class EventManager {
  constructor() {
    this.ready = false;
    this.queue = [];
    this._freeze = 0;
    this.stacks = {}; //listener stacks
    this._callbacks = {};
    this.queue = [];
    this.modal_stack = {};
    this.dom = undefined;
  }
  
  pushModal(handler) {
    let modal_data = {
      keys : []
    };
    
    let makecb = (type) => {
      let key = "_on_" + type;
      
      return (e) => {
        handler[key](e);
        e.stopPropagation();
        
        return true;
      }
    };
    
    for (let k in this.stacks) {
      let key = "_on_" + k;
      
      if (!(key in handler)) {
        continue;
      }
      
      modal_data.keys.push(k);
      this.addEventListener(k, makecb(k));
    }
    
    modal_data.owner = handler;
    this.modal_stack.push(modal_data);
  }
  
  popModal() {
    if (this.modal_stack.length === 0) {
      console.warn("WARNING: double call to core/events.js:EventManager.prototype.popModal()");
      return;
    }
    
    let modal_data = this.modal_stack.pop();
    
    for (let k of modal_data.keys) {
      this.popEventListener(k);
    }
  }
  
  freeze() {
    this._freeze++;
  }
  
  fireEvent(type, data) {
    if (data === undefined) {
      data = {};
    }
    
    data.type = type;
    if (data.stopPropagation === undefined) {
      data.stopPropagation = () => {};
    }
    
    if (data.preventDefault === undefined) {
      data.preventDefault = () => {};
    }
    
    return this._callbacks[type](data);
  }
  
  unfreeze() {
    this._freeze = Math.max(this._freeze-1, 0);
    
    if (!this._freeze) {
      this._handleQueue();
    }
  }
  
  _handleQueue() {
    let queue = this.queue;
    this.queue = [];
    
    for (let i=0; i<queue.length; i++) {
      let e = queue[i];
      let type = e._event_type;
      
      let stack = this.stacks[type];
      
      for (let i=stack.length-1; i>=0; i--) {
        let ret;
        
        try {
          ret = stack[i](e);
        } catch (error) {
          print_stack(error);
          console.log("Error while processing an event in events.manager._handleQueue");
          continue;
        }
        
        if (e.stopped) {
          break;
        }
      }
    }
  }
  
  bindDom() {
    let makecb = (type) => {
      let stop = false;
      
      function mystop() {
        stop = true;
        this.stopped = true;
      }
      
      return (e) => {
        e = copyEvent(e);
        
        if (this._freeze) {
          e._event_type = type;
          this.queue.push(e);
          
          e.stopPropagation();
          e.stopPropagation = () => {e.stopped = true};
          
          return true;
        } else {
          this._handleQueue();
        }
        
        let sp = e.stopPropagation;
        e.stopPropagation = mystop;
        
        stop = false;
        
        let stack = this.stacks[type], ret = 0;
        for (let i=stack.length-1; !stop && i>= 0; i--) {
          ret = stack[i](e);
        }
        
        if (stop) {
          sp();
        }
        
        return ret;
      }
    }
    
    for (let type of types) {
      let dom = undefined;
      
      if (window_events.has(type)) {
        dom = window;
      } else if (document_events.has(type)) {
        dom = document;
      } else {
        dom = this.dom;
      }

      let cb = this._callbacks[type] = makecb(type);
      
      if (!custom_events.has(type)) {
        dom.addEventListener(type, makecb(type));
      }
    }
  }
  
  popEventListener(type) {
    return this.stacks[type].pop();
  }
  
  removeEventListener(handler) {
    if (handler === undefined || handler._event_type === undefined) {
      throw new Error("invalid handler " + handler);
    }
    
    let type = handler._event_type;
    this.stacks[type].remove(handler, false); //false is to not throw error if handler not in stack
  }
  
  addEventListener(type, handler) {
    handler._event_type = type;
    
    if (!(type in this.stacks)) {
      console.warn("Invalid type", type, handler);
      throw new Error("invalid type " + type);
    }
    
    this.stacks[type].push(handler);
  }
  
  init(dom) {
    this.dom = dom;
    
    for (let k of types) {
      this.stacks[k] = [];
    }
    
    this.bindDom();
    this.ready = true;
  }
}

export var manager = new EventManager();
