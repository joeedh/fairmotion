/*
XXXX remove this file
* */
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

/* A structural clone of a DOM event: every plain-valued property copied across,
   plus the two methods rebound to the original. `stopped` is this system's own
   flag, set by the stopPropagation replacement bindDom() installs. */
export interface CopiedEvent {
  stopped: boolean;
  stopPropagation: () => void;
  preventDefault: () => void;
  /* Stamped on while an event sits in the freeze queue. */
  _event_type?: string;
  [key: string]: unknown;
}

/* Listeners carry the type they were registered under, so
   removeEventListener() can find their stack without being told. */
export type EventCallback = ((e: CopiedEvent) => unknown) & {_event_type?: string};

/* One entry of the modal stack: which listener types it pushed, and the
   handler they dispatch to. */
interface ModalData {
  keys: string[];
  owner?: EventHandler;
}

export class EventHandler {
  pushModal(manager: EventManager) {

  }

  popModal(manager: EventManager) {

  }
  
  _on_mousedown() {
  
  }
  
  _on_mouseup() {
  
  }
}

/* Also called on an already-copied event, from bindDom()'s listener.  The two
   methods are bound up front rather than after the loop; the loop only copies
   numbers, booleans and objects, so it could never have overwritten them. */
export function copyEvent(event: Event | CopiedEvent) {
  let ret: CopiedEvent = {
    stopped         : false,
    stopPropagation : event.stopPropagation.bind(event),
    preventDefault  : event.preventDefault.bind(event),
  };

  for (let k in event) {
    let v = Reflect.get(event, k);
    let ok = typeof v == "number" || typeof v == "boolean" || typeof v == "object";
    ok = ok || k.search("touch") >= 0;

    if (ok) {
      ret[k] = v;
    }
  }

  //ret = JSON.parse(JSON.stringify(ret));

  return ret;
}

export class EventManager {
  ready : boolean
  _freeze : number
  /* Listener stacks, one per entry of `types`; the last one registered wins. */
  stacks : {[type: string]: EventCallback[]}
  _callbacks : {[type: string]: EventCallback}
  /* The modal handler stack; the top entry owns the listeners it pushed. */
  modal_stack : ModalData[];
  /* Events parked while _freeze is non-zero, replayed by _handleQueue(). */
  queue : CopiedEvent[];
  dom : HTMLElement | undefined;

  constructor() {
    this.ready = false;
    this.queue = [];
    this._freeze = 0;
    this.stacks = {}; //listener stacks
    this._callbacks = {};
    this.queue = [];
    /* NOTE: this was `{}`, which has no push(), so pushModal() threw a
       TypeError the first time anything went modal. */
    this.modal_stack = [];
    this.dom = undefined;
  }
  
  pushModal(handler: EventHandler) {
    let modal_data: ModalData = {
      keys : []
    };

    let makecb = (type: string) => {
      let key = "_on_" + type;

      return (e: CopiedEvent) => {
        /* Dispatch is by name -- "_on_" + type -- and subclasses supply most of
           the handlers, so the lookup has to stay dynamic. */
        Reflect.get(handler, key).call(handler, e);
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

    if (modal_data === undefined) {
      return;
    }

    for (let k of modal_data.keys) {
      this.popEventListener(k);
    }
  }
  
  freeze() {
    this._freeze++;
  }
  
  fireEvent(type: string, data?: CopiedEvent) {
    /* The two `=== undefined` defaults that stood here are folded into the
       literal below; a CopiedEvent always carries both methods. */
    if (data === undefined) {
      data = {
        stopped         : false,
        stopPropagation : () => {},
        preventDefault  : () => {},
      };
    }

    data.type = type;

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

      if (type === undefined) {
        continue;
      }

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
    let rootDom = this.dom;

    if (rootDom === undefined) {
      throw new Error("EventManager.bindDom() called before init()");
    }

    let makecb = (type: string) => {
      let stop = false;

      function mystop(this: CopiedEvent) {
        stop = true;
        this.stopped = true;
      }

      return (event: Event | CopiedEvent) => {
        let e = copyEvent(event);

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
        
        let stack = this.stacks[type];
        let ret : unknown = 0;
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
      let dom : EventTarget;

      if (window_events.has(type)) {
        dom = window;
      } else if (document_events.has(type)) {
        dom = document;
      } else {
        dom = rootDom;
      }

      let cb = this._callbacks[type] = makecb(type);
      
      if (!custom_events.has(type)) {
        dom.addEventListener(type, makecb(type));
      }
    }
  }
  
  popEventListener(type: string) {
    return this.stacks[type].pop();
  }

  removeEventListener(handler: EventCallback) {
    if (handler === undefined || handler._event_type === undefined) {
      throw new Error("invalid handler " + handler);
    }
    
    let type = handler._event_type;
    this.stacks[type].remove(handler, false); //false is to not throw error if handler not in stack
  }
  
  addEventListener(type: string, handler: EventCallback) {
    handler._event_type = type;
    
    if (!(type in this.stacks)) {
      console.warn("Invalid type", type, handler);
      throw new Error("invalid type " + type);
    }
    
    this.stacks[type].push(handler);
  }
  
  init(dom: HTMLElement) {
    this.dom = dom;
    
    for (let k of types) {
      this.stacks[k] = [];
    }
    
    this.bindDom();
    this.ready = true;
  }
}

//export var manager = new EventManager();
