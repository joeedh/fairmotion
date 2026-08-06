import type { FullContext } from "../../core/context.js";
import { Editor } from "../editor_base.js";
import { readSerialized } from "../../core/struct.js";
import {
  color2css,
  css2color,
  CSSFont,
  UIBase,
  keymap,
  util,
  cconst,
  nstructjs,
  Vector2,
  Vector3,
  Matrix4,
} from "../../path.ux/scripts/pathux.js";
import { termColorMap } from "../../path.ux/scripts/util/util.js";
import { loadFile } from "../../path.ux/scripts/util/html5_fileapi.js";

import type { Screen } from "../../path.ux/scripts/screen/FrameManager.js";

/* The lines buffer, with the hovered entry hung off the array itself. */
export type ConsoleLines = ConsoleLineEntry[] & {
  active: ConsoleLineEntry | undefined;
};

/* The command history, with the browse cursor hung off the array itself. */
export type ConsoleHistory = ConsoleCommand[] & { cur: number };

/*
 * The per-character ANSI state machine drawText() builds. Only start() sets
 * the fields up, so they are all late-assigned; `state` is whichever of
 * base()/escape() is live, and both return false for a character that draws
 * nothing.
 */
type ConsoleStateMachine = {
  /* Never pushed to; start() only clears it. */
  stack: never[];
  x: number;
  y: number;
  /* How far into an escape sequence escape() has got. */
  d: number;
  /* The two digits of an SGR parameter, accumulated a character at a time.
     start() seeds them as numbers and base() resets them to "". */
  param1: string | number;
  param2: string | number;
  color: string;
  bgcolor: string | undefined;
  /* A CSS font string, as assigned to g.font. */
  font: string;
  state: (c: string) => string | false;

  start(x: number, y: number, color: string): void;
  escape(c: string): string | false;
  base(c: string): string | false;
};

/* The subset of a MouseEvent that _mouse() rebuilds in canvas pixel space. */
export type ConsoleMouseEvent = {
  preventDefault: () => void;
  stopPropagation: () => void;
  buttons: number;
  button: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  commandKey: boolean | undefined;
  x: number;
  y: number;
  pageX: number;
  pageY: number;
  touches: TouchList | undefined;
};

let g_screen: Screen<FullContext> | undefined = undefined;
let _silence = () => {};
let _unsilence = () => {};

let _patched = false;

function patch_console() {
  if (_patched) {
    return;
  }

  _patched = true;

  let methods: { [k: string]: (...args: unknown[]) => void } = {};
  let ignore = 0;

  _silence = () => (ignore = 1);
  _unsilence = () => (ignore = 0);

  let handlers: { [k: string]: (...args: unknown[]) => void } = {};

  function patch(key: string) {
    handlers[key] = function (...args: unknown[]) {
      setTimeout(() => {
        if (ignore || !g_screen) {
          return;
        }

        for (let sarea of g_screen.sareas) {
          if (sarea.area instanceof ConsoleEditor) {
            Reflect.get(sarea.area, key).apply(sarea.area, args);
          }
        }
      }, 0);
    };

    methods[key] = Reflect.get(console, key).bind(console);
    Reflect.set(console, key, function (...args: unknown[]) {
      methods[key](...args);
      handlers[key](...args);
    });
  }

  patch("log");
  patch("warn");
  patch("error");
  patch("trace");
}

const NO_CHILDREN = 0x7ffff;
const LineFlags = {
  ACTIVE  : 1,
  TWO_LINE: 2,
};

export class ConsoleLineEntry {
  static STRUCT: string;

  line: string;
  loc: string;
  bg: string;
  fg: string;
  closed: boolean;
  /* Offset back to the line this one is nested under, as a negative index
       delta; 0 for a top-level line. */
  parent: number;
  /* Offset forward to this line's first child, or NO_CHILDREN. */
  children: number;
  flag: number;

  constructor(line: string, loc = "", fg = "", bg = "") {
    this.line = "" + line;
    this.loc = "" + loc;
    this.bg = "" + bg;
    this.fg = "" + fg;
    this.closed = false;
    this.parent = 0;
    this.children = NO_CHILDREN;
    this.flag = 0;
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
  }
}

ConsoleLineEntry.STRUCT = `
ConsoleLineEntry {
    line     : string;
    loc      : string;
    bg       : string;
    fg       : string;
    closed   : bool;
    parent   : int;
    children : int;
    flag     : int | this.flag & ~1;
}
`;
nstructjs.register(ConsoleLineEntry);

export class ConsoleCommand {
  static STRUCT: string;

  command: string;

  constructor(cmd: string) {
    this.command = cmd;
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
  }
}
ConsoleCommand.STRUCT = `
ConsoleCommand {
    command : string;
}
`;
nstructjs.register(ConsoleCommand);

export const HitBoxTypes = {
  TOGGLE_CHILDREN: 0,
  CUSTOM         : 1,
};

export class HitBox {
  pos: Vector2;
  size: Vector2;
  /* A HitBoxTypes value. */
  type: number;
  /* For CUSTOM boxes; nothing in this file ever sets or calls it. */
  onhit: ((e: ConsoleMouseEvent, box: HitBox) => void) | null;
  /* The lines this box toggles -- always exactly one, pushed by redraw(). */
  lines: ConsoleLineEntry[];

  constructor(x: number, y: number, w: number, h: number) {
    this.pos = new Vector2([x, y]);
    this.size = new Vector2([w, h]);
    this.type = HitBoxTypes.TOGGLE_CHILDREN;
    this.onhit = null;

    this.lines = [];
  }

  toggle(e: ConsoleMouseEvent, editor: ConsoleEditor) {
    _silence();

    //console.log(this.lines);

    for (let l of this.lines) {
      let i = editor.lines.indexOf(l);
      let starti = i;

      //console.log(l.children);

      if (l.children === NO_CHILDREN) {
        continue;
      }

      i += l.children;
      let j = 0;

      while (j++ < editor.lines.length) {
        let l2 = editor.lines[i];

        //console.log(i+l2.parent, starti);
        if (editor.lines[i + l2.parent] !== l) {
          break;
        }

        /* was `^= 1` on a boolean, which JS coerced to 0/1. */
        l2.closed = !l2.closed;

        i++;
      }
    }

    editor.queueRedraw();

    _unsilence();
  }

  click(e: ConsoleMouseEvent, editor: ConsoleEditor) {
    if (this.type === HitBoxTypes.TOGGLE_CHILDREN) {
      this.toggle(e, editor);
      console.log("click!");
    }
  }
}

export class ConsoleEditor extends Editor {
  static STRUCT: string;

  _animreq: number;
  fontsize: number;
  /* Ring-buffer write cursor into `lines`, once it reaches bufferSize. */
  head: number;
  bufferSize: number;
  /* Named scrollPos rather than scroll because HTMLElement already has a
       scroll() method; the on-disk field is still called `scroll`. */
  scrollPos: Vector2;
  /* Role name -> css color. */
  colors: { [role: string]: string };
  /* Terminal color name -> the css color actually drawn. */
  colormap: { [name: string]: string };
  lines: ConsoleLines;
  hitboxes: HitBox[];
  history: ConsoleHistory;

  canvas!: HTMLCanvasElement;
  /* A plain 2d context: nothing stamps the Canvas2D extras onto it. */
  g!: CanvasRenderingContext2D;
  textbox!: HTMLInputElement;

  constructor() {
    super();

    this._animreq = 0;

    this.redraw = this.redraw.bind(this);

    this.hitboxes = [];

    this.fontsize = 12;

    let lines: ConsoleLineEntry[] = [];
    this.lines = Object.assign(lines, { active: undefined });

    let history: ConsoleCommand[] = [];
    this.history = Object.assign(history, { cur: 0 });
    this.head = 0;
    this.bufferSize = 512;

    this.scrollPos = new Vector2();

    this.colors = {
      error     : "red",
      error_bg  : "rgb(55,55,55,1.0)",
      warning   : "yellow",
      object    : "blue",
      loc       : "blue",
      source    : "white",
      warning_bg: "rgb(50, 50, 0)",
    };

    this.colormap = {
      "red" : "rgb(255, 100, 100)",
      "blue": "rgb(125, 125, 255)",
    };
  }

  on_area_active() {
    patch_console();
  }

  formatMessage(...args: unknown[]) {
    let s = "";
    let prev = "";

    function safestr(obj: unknown): string {
      if (typeof obj === "object" && Array.isArray(obj)) {
        let s = "[\n";
        let i = 0;

        for (let item of obj) {
          if (i > 0) {
            s += ",\n";
          }

          s += "  " + safestr(item);
          i++;
        }

        s += "]\n";
        return s;
      }
      return typeof obj === "symbol" ? obj.toString() : "" + obj;
    }

    for (let i = 0; i < args.length; i++) {
      let arg = safestr(args[i]);

      //Reflect.ownKeys(window)
      let s2 = "" + arg;
      let next = i < args.length - 1 ? safestr(args[i + 1]).trim() : "";

      if (s2.startsWith("%c")) {
        s2 = s2.slice(2, s2.length);

        let style = next.replace(/\n/g, "").split(";");

        for (let line of style) {
          let fields = ("" + line).trim().split(":");

          if (fields.length === 2 && ("" + fields[0]).trim() === "color") {
            let color = ("" + fields[1]).trim().toLowerCase();

            if (color in util.termColorMap) {
              /* NOTE: this called a bare `termColor`, which is a
                               ReferenceError -- path.ux's TS sources never put
                               it on globalThis, only the old dist bundle did. */
              s2 = util.termColor(s2, color);
            }
          }
        }

        i++;
      }

      s += s2 + " ";
      prev = s2;
    }

    return ("" + s).trim();
  }

  formatStackLine(stack: string): string;
  formatStackLine(stack: string, parts: false): string;
  formatStackLine(stack: string, parts: true): [string, string];

  formatStackLine(stack: string, parts: boolean = false): string | [string, string] {
    if (stack.search("at") < 0) {
      /* NOTE: this returned a bare "" even for parts=true, and
               printStack's `l[0] = ...` on that string threw in strict mode. */
      return parts ? ["", ""] : "";
    }

    stack = "" + stack;
    stack = stack.replace("at ", "").trim();
    let i = stack.length - 1;

    while (i > 0 && stack[i] !== "/" && stack[i] !== "\\") {
      i--;
    }

    let i2 = stack.search("\\(");
    let prefix = i2 >= 0 ? ("" + stack.slice(0, i2)).trim() : "";

    if (prefix.length > 0) {
      prefix += ":";
    }

    stack = stack.slice(i + 1, stack.length - 1);
    if (parts) {
      return [prefix, stack] as [string, string];
    }

    return (
      util.termColor(prefix, this.colors["object"]) + util.termColor(stack, this.colors["source"])
    );
  }

  push(msg: string, linefg: string = "", linebg: string = "", childafter: boolean = false) {
    let stack = "" + new Error().stack;

    stack = ("" + stack.split("\n")[5]).trim();
    stack = this.formatStackLine(stack);

    let ls = msg.split("\n");

    for (let i = 0; i < ls.length; i++) {
      let loc = "";

      if (i === ls.length - 1) {
        loc = stack;
      }

      let entry = new ConsoleLineEntry(ls[i], loc, linefg, linebg);

      if (childafter) {
        entry.children = ls.length - i;
      }

      this.pushLine(entry);
    }
  }

  pushLine(line: ConsoleLineEntry | string) {
    if (line === undefined) {
      line = "";
    }

    if (typeof line === "string") {
      line = new ConsoleLineEntry(line, "");
    }

    if (this.lines.length >= this.bufferSize) {
      this.lines[this.head] = line;
      this.head = (this.head + 1) % this.lines.length;
    } else {
      this.lines.push(line);
      this.head = this.lines.length;
    }

    _silence();
    this.queueRedraw();
    _unsilence();

    if (Math.abs(this.scrollPos[1]) > 10) {
      //this.scrollPos[1] -= this.lineHeight;
    }
  }

  get lineHeight() {
    return this.fontsize * 1.3 * UIBase.getDPI();
  }

  printStack(start: number = 0, fg: string = "", bg: string = "", closed: boolean = true) {
    let stack = ("" + new Error().stack).split("\n");

    let off = -1;
    for (let i = start; i < stack.length; i++) {
      let s = stack[i];
      let pair = this.formatStackLine(s, true);

      let entry = new ConsoleLineEntry("  " + ("" + pair[0]).trim(), pair[1], fg, bg);
      entry.closed = closed;
      entry.parent = off--;

      this.pushLine(entry);
    }
  }

  warn(...args: unknown[]) {
    let msg = this.formatMessage(...args);

    msg = util.termColor(msg, 1);

    this.push(msg, this.colors["warning"], this.colors["warning_bg"], true);

    this.printStack(5, undefined, this.colors["warning_bg"], true);
  }

  error(...args: unknown[]) {
    let msg = this.formatMessage(...args);

    msg = util.termColor(msg, 1);
    this.push(msg, this.colors["error"], this.colors["error_bg"], true);

    this.printStack(5, undefined, this.colors["error_bg"], true);
  }

  trace(...args: unknown[]) {
    let msg = this.formatMessage(...args);
    this.push(msg);
    this.printStack(5, undefined, undefined, false);
  }

  log(...args: unknown[]) {
    let msg = this.formatMessage(...args);

    this.push(msg);
  }

  /* Rebuilds the event in canvas pixel space.  NOTE: `commandKey` and
       `touches` are not MouseEvent properties, so both copy as undefined. */
  _mouse(e: MouseEvent): ConsoleMouseEvent {
    let x = e.x,
      y = e.y;

    let rect = this.canvas.getClientRects()[0];
    let dpi = UIBase.getDPI();
    if (rect) {
      x -= rect.x;
      y -= rect.y;

      x *= dpi;
      y *= dpi;
    }

    let e2 = {
      preventDefault : e.preventDefault.bind(e),
      stopPropagation: e.stopPropagation.bind(e),
      buttons        : e.buttons,
      button         : e.button,
      shiftKey       : e.shiftKey,
      ctrlKey        : e.ctrlKey,
      altKey         : e.altKey,
      commandKey     : e.commandKey,
      x              : x,
      y              : y,
      pageX          : x,
      pageY          : y,
      touches        : e.touches,
    };

    return e2;
  }

  on_mousedown(e: MouseEvent) {
    let e2 = this._mouse(e);

    let hb = this.updateActive(e2.x, e2.y);

    if (hb) {
      hb.click(e2, this);
    }

    _silence();
    console.log(e2.x, e2.y);
    _unsilence();
  }

  on_mousemove(e: MouseEvent) {
    _silence();
    let e2 = this._mouse(e);

    this.updateActive(e2.x, e2.y);
    _unsilence();
  }

  updateActive(x: number, y: number) {
    let found = 0;

    for (let hb of this.hitboxes) {
      let ok = x > hb.pos[0] && x <= hb.pos[0] + hb.size[0];
      ok = ok && y > hb.pos[1] && y <= hb.pos[1] + hb.size[1];

      if (ok) {
        found = 1;

        if (this.lines.active !== undefined) {
          this.lines.active.flag &= ~LineFlags.ACTIVE;
        }

        if (hb.lines.length > 0) {
          if (this.lines.active !== hb.lines[0]) {
            hb.lines[0].flag |= LineFlags.ACTIVE;

            this.lines.active = hb.lines[0];
            this.queueRedraw();
          }

          return hb;
        }
      }
    }

    if (!found && this.lines.active) {
      this.lines.active.flag &= ~LineFlags.ACTIVE;
      this.queueRedraw();
    }
  }

  on_mouseup(e: MouseEvent) {
    let e2 = this._mouse(e);
    _silence();
    console.log(e2.x, e2.y);
    _unsilence();
  }

  init() {
    super.init();

    /* "mousewheel" is the legacy name, so it is not in HTMLElementEventMap
           and the listener is typed against plain Event. */
    this.addEventListener("mousewheel", (e: Event) => {
      if (!(e instanceof WheelEvent)) {
        return;
      }

      this.scrollPos[1] += -e.deltaY;
      this.queueRedraw();
    });

    let header = this.header;
    let container = this.container;

    let col = container.col();

    //let canvas = this.getCanvas("console", undefined, false);
    //let g = this.g = canvas.g;
    let canvas = (this.canvas = document.createElement("canvas"));
    let g = (this.g = canvas.getContext("2d")!);

    canvas.addEventListener("mousemove", this.on_mousemove.bind(this));
    canvas.addEventListener("mousedown", this.on_mousedown.bind(this));
    canvas.addEventListener("mouseup", this.on_mouseup.bind(this));

    col.shadow.appendChild(canvas);

    let textbox = (this.textbox = document.createElement("input"));
    textbox.type = "text";
    col.shadow.appendChild(textbox);

    textbox.style["width"] = "100%";
    textbox.style["height"] = "25px";
    textbox.style.paddingLeft = "5px";
    textbox.style.paddingTop = "1px";
    textbox.style.paddingBottom = "1px";

    textbox.oninput = this._on_change.bind(this);
    textbox.onkeydown = this._on_keydown.bind(this);

    this.setCSS();
    this.update();
    this.queueRedraw();
  }

  _on_change(e: Event) {
    _silence();
    console.log("yay", e);
    _unsilence();
  }

  pushHistory(cmd: string) {
    let lasti = this.history.cur - 1; //(this.history.cur + this.history.length - 1) % this.history.length;
    let last =
      this.history.length > 0 && this.history.cur > 0 ? this.history[lasti].command : undefined;

    if (cmd === last) {
      return;
    }

    _silence();
    console.log("history insert");
    _unsilence();

    let command = new ConsoleCommand(cmd);

    this.history.push(command);
    this.history.cur = this.history.length;
  }

  doCommand(cmd: string) {
    this.scrollPos[1] = 0.0;

    this.pushHistory(cmd);
    let v = undefined;

    try {
      v = eval(cmd);
    } catch (error) {
      console.error(error);
      return;
    }

    console.log(v);
  }

  doTab(cmd: string = "") {
    let i = cmd.length - 1;
    while (i >= 0) {
      if (cmd[i] === "." || cmd[i] === "]" || cmd[i] === ")") {
        break;
      }

      i--;
    }

    let prefix;
    let suffix;
    let join = "";

    if (i <= 0) {
      prefix = "";
      suffix = ("" + cmd).trim();
    } else {
      prefix = cmd.slice(0, i).trim();
      suffix = cmd.slice(i + 1, cmd.length).trim();
      join = cmd[i];
    }

    _silence();
    console.log("p:", prefix);
    console.log("s:", suffix);
    _unsilence();

    let obj;

    try {
      obj = prefix === "" ? window : eval(prefix);
    } catch (error) {
      obj = undefined;
    }

    _silence();
    console.log(obj);
    _unsilence();

    if (typeof obj !== "object" && typeof obj !== "function") {
      return;
    }

    let keys = Reflect.ownKeys(obj);
    keys = keys.concat(Object.keys(Object.getOwnPropertyDescriptors(obj)));
    keys = keys.concat(Object.keys(Object.getOwnPropertyDescriptors(obj.__proto__)));
    /* NOTE: the symbol keys Reflect.ownKeys returns were sorted below with
           a NaN comparison and then skipped by a typeof test; they are dropped
           up front now, which also makes the sort consistent. */
    let keys2: string[] = [];
    for (let k of new Set(keys)) {
      if (typeof k === "string") {
        keys2.push(k);
      }
    }

    let list: string[] = [];
    let lsuffix = suffix.toLowerCase();
    let hit = suffix;
    let hit2 = undefined;

    keys2.sort((a, b) => a.length - b.length);

    for (let k of keys2) {
      if (suffix.length === 0) {
        list.push(k);
        continue;
      }

      if (k.startsWith(suffix) && (hit2 === undefined || k.length < hit2.length)) {
        hit = k;
        hit2 = k;
      }
      if (k.toLowerCase().startsWith(lsuffix)) {
        list.push(k);
      }
    }

    _silence();
    console.log(hit);
    console.log(list);
    _unsilence();
    let printall = 0;

    if (hit) {
      let s = (prefix + join + hit).trim();

      if (s === this.textbox.value) {
        printall = 1;
      }

      this.textbox.value = s;
      this.textbox.setSelectionRange(s.length, s.length);

      window.tb = this.textbox;
    } else {
      printall = 1;
    }

    if (printall) {
      this.scrollPos[1] = 0.0;

      this.pushLine(new ConsoleLineEntry(""));
      for (let k of list) {
        let l = new ConsoleLineEntry("  " + k);
        this.pushLine(l);
      }
    }
  }

  goHistory(di: number) {
    if (this.history.length === 0) {
      return;
    }

    let i = this.history.cur;

    let push = this.textbox.value.trim().length > 0;
    if (push) {
      this.pushHistory(this.textbox.value.trim());
    }

    i = Math.min(Math.max(i + di, 0), this.history.length - 1);
    this.history.cur = i;

    let s = this.history[i].command.trim();

    this.textbox.value = s;
    this.textbox.setSelectionRange(s.length, s.length);
  }

  popup(x: number, y: number) {}

  _on_keydown(e: KeyboardEvent) {
    _silence();
    console.log(e.keyCode);
    _unsilence();

    e.stopPropagation();

    switch (e.keyCode) {
      case keymap["R"]:
        /* NOTE: `commandKey` is not a KeyboardEvent property; the
                   DOM spells it `metaKey`. */
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
          location.reload();
        }
        break;
      case keymap["Tab"]:
        this.doTab(this.textbox.value);
        e.preventDefault();
        e.stopPropagation();
        break;
      case keymap["Enter"]:
        this.doCommand(this.textbox.value);
        this.textbox.value = "";
        break;
      case keymap["Up"]:
        this.goHistory(-1);
        break;
      case keymap["Down"]:
        this.goHistory(1);
        break;
    }
  }

  redraw() {
    this._animreq = 0;

    this.hitboxes = [];

    if (!this.canvas || !this.g) {
      return;
    }

    let ts = this.fontsize * UIBase.getDPI();

    let canvas = this.canvas;
    let g = this.g;

    let font = this.getDefault<CSSFont>("DefaultText");

    let c = css2color(font.color);

    for (const i of [0, 1, 2] as const) {
      let f = 1.0 - c[i];
      c[i] += (f - c[i]) * 0.75;
    }

    let bg = color2css(c);

    g.resetTransform();
    g.fillStyle = bg;
    g.rect(0, 0, canvas.width, canvas.height);
    g.fill();

    g.font = font.genCSS(ts);
    g.fillStyle = font.color;

    let width = canvas.width,
      height = canvas.height;
    let lh = this.lineHeight;
    let pad1 = 10 * UIBase.getDPI();

    let scroll = this.scrollPos;
    let x = scroll[0];
    let y = scroll[1] + 5 + canvas.height - lh;

    let this2 = this;
    /* NOTE: this read `g.font.color`. g.font is the CSS string assigned
           just above, so the value was undefined and every fillStyle written
           from it was ignored -- which is why the text still came out in
           font.color, the fillStyle already in effect. */
    let color = font.color;

    let fontcpy = font.copy();

    /* Draws one character at a time so ANSI escape codes can retint and
           re-font mid-string; `state` is whichever of base/escape is live.
           Every other field is created by start(). */
    let stateMachine: ConsoleStateMachine = {
      stack  : [],
      x      : 0,
      y      : 0,
      d      : 0,
      param1 : 0,
      param2 : 0,
      color  : color,
      bgcolor: undefined,
      font   : g.font,

      /* start() replaces this before a single character is drawn. */
      state(c: string) {
        return this.base(c);
      },

      start(x: number, y: number, color: string) {
        this.stack.length = 0;
        this.x = x;
        this.y = y;
        this.state = this.base;
        this.d = 0;
        this.param1 = 0;
        this.param2 = 0;
        this.bgcolor = undefined;

        this.color = color;
        this.font = g.font;
      },

      escape(c: string) {
        let ci = c.charCodeAt(0);

        if (this.d === 0 && c === "[") {
          this.d++;
        } else if (this.d === 1 && ci >= 48 && ci <= 57) {
          this.param1 = c;
          this.d++;
        } else if (this.d === 2 && ci >= 48 && ci <= 57) {
          this.param2 = c;
          this.d++;
        } else if (c === "m" && this.d >= 2) {
          let digits = "" + this.param1;
          if (this.d > 2) {
            digits += this.param2;
          }

          let tcolor = parseInt(digits);
          if (tcolor === 0) {
            font.copyTo(fontcpy);
            fontcpy.color = color;
            this.bgcolor = undefined;
            this.color = fontcpy.color;
            this.font = fontcpy.genCSS(ts);
          } else if (tcolor === 1) {
            fontcpy.weight = "bold";
            this.font = fontcpy.genCSS(ts);
          } else if (tcolor === 4) {
            //underline?
            //ignore
            //this.font = font.genCSS(ts);
          } else if (tcolor >= 40) {
            /* termColorMap is bidirectional: a numeric key gives the
                           color name back, anything else is a missing code. */
            let name = termColorMap[tcolor - 10];

            this.bgcolor = typeof name === "string" ? name : undefined;
            if (this.bgcolor && this.bgcolor in this2.colormap) {
              this.bgcolor = this2.colormap[this.bgcolor];
            }
          } else {
            let name = termColorMap[tcolor];

            this.color = typeof name === "string" ? name : "";
            if (this.color && this.color in this2.colormap) {
              this.color = this2.colormap[this.color];
            }
          }

          this.state = this.base;
        } else {
          this.state = this.base;
          return "?";
        }

        return false; //ci > 27 ? c : "?";
      },

      base(c: string) {
        let ci = c.charCodeAt(0);

        if (ci === 27) {
          this.state = this.escape;
          this.d = 0;
          this.param1 = "";
          this.param2 = "";
          return false;
        }

        if (c === " ") {
          this.x += ts;
          return false;
        } else if (c == "\t") {
          this.x += ts * 2.0;
          return false;
        }

        if (ci < 30) {
          return "?";
        }
        return c;
      },
    };

    let fillText = (s: string, x: number, y: number) => {
      stateMachine.start(x, y, color);

      for (let i = 0; i < s.length; i++) {
        let c = stateMachine.state(s[i]);
        if (c === false) {
          continue;
        }

        if (stateMachine.font !== g.font) {
          g.font = stateMachine.font;
        }

        let w = g.measureText(c).width;
        stateMachine.x += w;

        if (stateMachine.bgcolor !== undefined) {
          g.beginPath();
          g.rect(stateMachine.x, stateMachine.y + 2, w, ts);
          let old = g.fillStyle;
          g.fillStyle = stateMachine.bgcolor;
          g.fill();
          g.fillStyle = old;
        }

        g.fillStyle = stateMachine.color;
        g.fillText(c, stateMachine.x, stateMachine.y);
      }
    };

    let measureText = (s: string) => {
      stateMachine.start(0, 0, color);

      for (let i = 0; i < s.length; i++) {
        let c = stateMachine.state(s[i]);
        if (c === false) {
          continue;
        }
        if (stateMachine.font !== g.font) {
          g.font = stateMachine.font;
        }

        let w = g.measureText(c).width;
        stateMachine.x += w;

        g.fillStyle = stateMachine.color;
        g.fillText(c, stateMachine.x, stateMachine.y);
      }

      return { width: stateMachine.x };
    };

    let lines = this.lines;
    for (let li2 = lines.length - 1; li2 >= 0; li2--) {
      let li = (li2 + this.head) % this.lines.length;
      //for (let li=0; li<lines.length; li++) {
      let l = lines[li];
      let s = l.line;

      if (l.closed || y < -lh * 4 || y >= canvas.height + lh * 3) {
        if (!l.closed) {
          y -= lh;
          if (l.flag & LineFlags.TWO_LINE) {
            y -= lh;
          }
        }
        continue;
      }

      //HitBox
      if (l.bg) {
        g.beginPath();
        g.fillStyle = l.bg;
        g.rect(x, y - ts + 2, canvas.width, ts + 3);
        g.fill();
      }

      if (l.flag & LineFlags.ACTIVE) {
        g.beginPath();
        g.fillStyle = "rgb(255,255,255,0.2)";
        g.rect(x, y - ts + 2, canvas.width, ts + 3);
        g.fill();
      }

      color = l.fg ? l.fg : font.color;

      g.fillStyle = font.color;

      let w1 = measureText(s).width;

      if (l.loc.length > 0) {
        let w2 = measureText(l.loc).width;
        if (w1 + w2 + pad1 * 2 < canvas.width) {
          l.flag &= ~LineFlags.TWO_LINE;

          g.fillStyle = this.colors["loc"];
          fillText(l.loc, canvas.width - pad1 - w2, y);
        } else {
          l.flag |= LineFlags.TWO_LINE;

          g.fillStyle = this.colors["loc"];
          fillText(l.loc, canvas.width - pad1 - w2, y);
          y -= lh;
        }
      }

      if (l.children !== NO_CHILDREN) {
        let hb = new HitBox(x, y - ts + 2, canvas.width, ts + 3);
        hb.lines.push(l);
        this.hitboxes.push(hb);
      }

      fillText(s, x, y);
      y -= lh;
    }
  }

  updateSize() {
    if (!this.canvas) return;

    let dpi = UIBase.getDPI();
    let w1 = this.size[0];
    let h1 = this.size[1] - 100 / dpi;

    let w2 = ~~(w1 * dpi);
    let h2 = ~~(h1 * dpi);

    let canvas = this.canvas;

    if (w2 !== canvas.width || h2 !== canvas.height) {
      console.log("resizing console canvas");
      this.canvas.style["width"] = w2 / dpi + "px";
      this.canvas.style["height"] = h2 / dpi + "px";
      this.canvas.width = w2;
      this.canvas.height = h2;
      this.queueRedraw();
    }
  }

  queueRedraw() {
    if (this._animreq) {
      return;
    }

    this._animreq = 1;
    requestAnimationFrame(this.redraw);
  }

  setCSS() {
    this.updateSize();
  }

  update() {
    if (!this.ctx) {
      return;
    }

    g_screen = this.ctx.screen;

    super.update();
    this.updateSize();
  }

  static define() {
    return {
      tagname : "console-editor-x",
      areaname: "console_editor",
      uiname  : "Console",
      icon    : Icons.CONSOLE_EDITOR,
      flag    : 0,
      style   : "console",
    };
  }

  copy(): ConsoleEditor {
    return document.createElement("console-editor-x");
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
    super.loadSTRUCT(reader);

    /* The on-disk field is `scroll`; reader() stamps it straight onto the
           instance, shadowing HTMLElement.scroll until this moves it. */
    this.scrollPos = readSerialized<Vector2>(this, "scroll");
    Reflect.deleteProperty(this, "scroll");

    this.history.cur = this.history.length;

    for (let i = 0; i < this.lines.length; i++) {
      let l: unknown = this.lines[i];

      if (typeof l === "string") {
        this.lines[i] = new ConsoleLineEntry(l, "");
      }
    }
  }
}
ConsoleEditor.STRUCT =
  nstructjs.inherit(ConsoleEditor, Editor) +
  `
    fontsize    :  float;
    bufferSize  :  int;
    lines       :  array(ConsoleLineEntry);
    history     :  array(ConsoleCommand);
    head        :  int;
    scroll      :  vec2 | obj.scrollPos;
}`;
Editor.register(ConsoleEditor);
