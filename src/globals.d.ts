/*
 * The ambient surface the bundle relies on.
 *
 * Fairmotion predates ES modules. A handful of files still run as classic
 * scripts before the bundle (see GLOBAL_SCRIPTS in buildtools/esbuild.mjs) and
 * everything they declare at top level -- cachering, GArray, set, list, mixin,
 * defined_classes -- is genuinely global. TypeScript already sees those,
 * because those files have no import/export and so are global scripts to it
 * too. This file covers the rest: symbols that reach the global scope by
 * assignment to `window` at module-evaluation time, which TypeScript cannot
 * infer.
 *
 * Two declarations per symbol are needed. `interface Window` types the
 * `window.foo` form; the `declare const`/`declare function` types the bare
 * `foo` form. Both spellings appear throughout the sources and they are the
 * same binding at runtime.
 *
 * Only symbols that are actually read somewhere are listed. Anything assigned
 * purely for the debug console (window._iconmanager, window._menuWrangler and
 * friends) is deliberately absent -- adding it would claim a contract the code
 * does not have.
 */

import type * as vectormath from "./path.ux/scripts/util/vectormath.js";
import type {AppState} from "./core/AppState.js";
import type {FullContext} from "./core/context.js";
import type {EventDag} from "./core/eventdag.js";
import type {DataRef} from "./core/lib_api.js";
import type {Spline} from "./curve/spline.js";
import type {Theme, ColorTheme} from "./datafiles/theme.js";
import type {ModuleCallback as AddonModuleCallback} from "./addon_api/addon_api.js";

declare global {
  /*
   * vectormath. src/util/vectormath.ts re-exports path.ux's classes and also
   * publishes them on window, because the STRUCT scripts name them and because
   * a lot of older code never imported them. The value and the type share a
   * name here exactly as they do in path.ux.
   */
  const Vector2: typeof vectormath.Vector2;
  const Vector3: typeof vectormath.Vector3;
  const Vector4: typeof vectormath.Vector4;
  const Matrix4: typeof vectormath.Matrix4;
  const Quat: typeof vectormath.Quat;

  type Vector2 = vectormath.Vector2;
  type Vector3 = vectormath.Vector3;
  type Vector4 = vectormath.Vector4;
  type Matrix4 = vectormath.Matrix4;
  type Quat = vectormath.Quat;

  /*
   * The legacy C-style annotations named `int`, `float`, `double`, `byte` and
   * `short`. They were hints to a transpiler that did not enforce them and
   * every one of them is a JS number. Aliasing rather than rewriting keeps the
   * original author's intent legible at the call site.
   */
  type int = number;
  type float = number;
  type double = number;
  type byte = number;
  type short = number;

  /* A member of the nstructjs `reader` protocol: loadSTRUCT(reader) fills the
     instance in place. Declared globally because nearly every data class in
     src/ implements it and none of them import a type today. */
  type StructReader<T> = (obj: T) => void;

  /* The 2D contexts this app draws through are plain canvas contexts plus a few
     fields view2d.ts stamps on: the device pixel ratio the canvas was sized at
     and its cached dimensions. An intersection, not a union -- every ordinary
     canvas call has to keep working. */
  type Canvas2D = CanvasRenderingContext2D & {
    dpi_scale: number;
    width: number;
    height: number;
    canvas: HTMLCanvasElement & {dpi_scale: number};
  };

  /* The iterator convention fairmotion's element lists follow: an iterator that
     also carries `.editable`, the sub-iterator of items on unhidden/unlocked
     layers. Where nothing can be hidden it is just a self reference. */
  type EditableIter<T> = Generator<T, void, unknown> & {editable?: EditableIter<T>};

  /* What esbuild's classRegistryPlugin appends to every module: the list
     init_struct_packer() and init_toolop_structs() walk. Entries carry an
     optional STRUCT script and the struct name nstructjs registered them
     under. */
  interface ESClassRegistryEntry {
    new (...args: never[]): object;
    name: string;
    STRUCT?: string;
    structName?: string;
    /* Present on the ToolOp subclasses in the list. init_toolop_structs()
       filters on it, so it is optional here rather than in a separate type. */
    tooldef?: () => {toolpath?: string; apiname?: string};
  }

  const _ESClass: {
    register(cls: ESClassRegistryEntry): void;
  };

  /* `defined_classes` is not declared here: typesystem.ts is a classic script,
     so its own `var defined_classes: ESClassRegistryEntry[]` is already the
     global. utils.ts later swaps in a GArray of the same contents. */

  /* One source line the coverage instrumentation has seen, and how many times
     it ran. Built by src/core/startup/coverage.ts. */
  interface CoverageLine {
    file: string;
    line: number;
    count: number;
  }

  interface CoverageModule {
    /* Keyed by file name concatenated with line number. */
    lines: {[hash: string]: CoverageLine};
    Line: new (file: string, line: number) => CoverageLine;
    getLine(file: string, line: number): CoverageLine;
    /* Per-file hit ratios, worst first, one "file,ratio" per line. */
    report(): string;
  }

  const coverage: CoverageModule;

  const g_app_state: AppState;
  const _appstate: AppState;
  /* The class itself, parked on window by AppState.ts; data_api_define.ts uses
     the bare name rather than importing it. */
  const AppState: typeof import("./core/AppState.js").AppState;
  const the_global_dag: EventDag | undefined;

  const RELEASE: boolean;
  const DEBUG: {[k: string]: boolean};
  /* Fairmotion's own debug flags (config.ts); DEBUG above is path.ux's.
     A couple of the flags are numbers rather than booleans. */
  const _DEBUG: {[k: string]: boolean | number};
  const IsMobile: boolean;
  const CHROME_APP_MODE: boolean;
  const UNIT_TESTER: boolean;

  const g_app_version: number;
  const fairmotion_file_ext: string;
  const fairmotion_settings_filename: string;

  const FEATURES: {save_toolstack: boolean};
  const use_octree_select: boolean;
  const fuzzy_ui_press_hotspot: number;
  const new_api_parser: boolean;
  const NO_CACHE: boolean;
  const FANCY_JOINS: boolean;
  const MAX_THREADS: number;

  const default_ui_font_size: number;
  const menu_text_size: number;
  const ui_hover_time: number;

  /* Set while nstructjs is reading a file. Data classes check it to skip
     side effects that only make sense for live edits. */
  const inFromStruct: boolean;

  const redraw_viewport_lock: number;
  const _block_drawing: number;
  const _wait_for_draw: boolean;
  const _fps: number;
  const _stime: number;

  const _SOLVING: boolean;
  const _solve_idgen: number;

  function redraw_viewport(): Promise<void> | undefined;
  function redraw_all(): void;
  function redraw_all_full(): void;
  function force_viewport_redraw(): void;
  function complete_viewport_draw(tries?: number): void;

  const _SplineDrawer: typeof import("./curve/spline_draw_new.js").SplineDrawer;

  /* The only event the killscreen channel carries. Its listeners are held in
     window._killscreen_handlers, not by the DOM. */
  interface KillscreenEvent {
    type: "killscreen";
  }

  /* window.addEventListener() is replaced by redraw_globals.ts and stamps
     _is_killscreen on every callback it is handed -- see docs/debugging.md. */
  type KillscreenCallback = ((e: KillscreenEvent) => void) & {_is_killscreen?: number};

  function init_struct_packer(): void;
  function init_toolop_structs(): void;
  function init_event_graph(ctx: FullContext): void;
  function init_redraw_globals(): void;
  function init_redraw_globals_2(): void;
  function init_theme(): void;

  function push_solve(spline: Spline): number;
  function pop_solve(id: number): void;
  function _handle_key_exclude(e: KeyboardEvent): void;

  function parseToolPath(path: string): {name: string; args: {[k: string]: string}};

  /* A snapshot of `window` taken once init_struct_packer() finishes, used as
     the evaluation environment for STRUCT helper expressions. */
  const safe_global: {[k: string]: unknown};

  /* nstructjs's struct manager, and the concatenated STRUCT scripts that were
     fed to it. Both are read back when writing a file. */
  const istruct: import("nstructjs").STRUCT;
  const _struct_scripts: string;
  const _fstructs: string;
  const STRUCT_ENDIAN: boolean;

  /*
   * Written by the localstorage shim in src/core/startup/localstorage.ts. Two
   * implementations back it -- window.localStorage in the browser and
   * chrome.storage in the packaged app -- and only the chrome one is really
   * asynchronous, hence the getCached/getAsync split.
   */
  interface MyLocalStorage {
    set(key: string, val: string): void;
    getCached(key: string): string;
    getAsync(key: string): Promise<string>;
    hasCached(key: string): boolean;

    /* Two keys are also read as plain properties. On the localStorage backend
       that reaches window.localStorage; on the chrome one it reads undefined,
       which both call sites already treat as "not set". */
    startup_file?: string;
    use_canvas?: string;
  }

  const myLocalStorage: MyLocalStorage;
  function save_local_storage(): void;

  /* A for-in over own and inherited keys, from polyfill_fairmotion.ts.
     typesystem.ts's __get_in_iter() is the only caller left. */
  function _my_object_keys(obj: object): string[];

  /* The legacy settings-upload queue in core/UserSettings.ts. Only the dead
     OldAppSettings path still reaches it. */
  const _settings_manager: import("./core/UserSettings.js").SettUploadManager;

  /*
   * The live theme. init_theme() builds it from the two ColorThemes that
   * theme.ts publishes on window; loading a THME block or a settings file
   * replaces the whole object, which is why this is a binding and not a
   * property of some manager.
   */
  const g_theme: Theme;

  /*
   * curve/bspline.ts generates its basis functions symbolically and eval()s
   * them, and parks the whole toolchain on window so the generator can be
   * driven from the console. Everything here is read back by bare name from
   * inside bspline.ts itself.
   */
  type symcls = import("./curve/bspline.js").symcls;

  /* Node counter, bumped by every symcls constructor and reset by optimize(). */
  const tot_symcls: number;
  /* Knobs the symbolic generator reads while building an expression tree. */
  const _sym_eps1: number;
  const _sym_eps2: number;
  const _sym_do_clamping: boolean;
  const _sym_more_symbolic: boolean;
  /* optimize()'s return value, stashed by the test_sym() console helper. */
  const tree_func: [Function, Function | undefined, string, string, symcls];

  /* Never assigned anywhere: load_seven() reads a prebuilt table of generated
     basis functions that no longer ships, so calling it throws. */
  const basis_json: {[key: string]: string};

  /* Not defined anywhere either -- optimize()'s cycle check throws a
     ReferenceError before it can throw this. */
  function RuntimeError(msg: string): Error;

  /*
   * Three vendored libraries loaded as classic scripts ahead of the bundle
   * (GLOBAL_SCRIPTS in buildtools/esbuild.mjs). Only the members fairmotion
   * actually calls are listed.
   */

  /* lz-string 1.3.3. compress() is fed a Uint8Array here rather than a string;
     it indexes with charCodeAt-equivalent semantics, so the numbers survive. */
  const LZString: {
    compress(uncompressed: string | Uint8Array): string;
    decompress(compressed: string): string;
  };

  /* crypto-js, used only to SHA1 a password for the old AllShape login. */
  const CryptoJS: {
    SHA1(message: string): object;
    enc: {Base64: {stringify(words: object): string}};
  };

  /* What chrome.fileSystem.chooseEntry() yields. Only the members
     core/fileapi/fileapi_chrome.ts actually touches are modelled. */
  interface ChromeFileEntry {
    file(cb: (file: File) => void): void;
    createWriter(cb: (writer: ChromeFileWriter) => void, onerror: () => void): void;
  }

  interface ChromeFileWriter {
    onerror: () => void;
    onwriteend: (e?: ProgressEvent) => void;
    write(data: Blob): void;
  }

  /* The parameter bag chooseEntry() takes. `accepts` is attached after the
     object literal is built, hence the optional. */
  interface ChooseEntryParams {
    type: string;
    suggestedName?: string;
    accepts?: {description: string; extensions: string[]}[];
  }

  /* The slice of the extension API the chrome-app backends use. */
  const chrome: {
    storage: {
      local: {
        set(items: {[k: string]: string}): void;
        get(key: string, cb: (value: {[k: string]: string}) => void): void;
      };
    };
    fileSystem: {
      chooseEntry(params: ChooseEntryParams, cb: (entry: ChromeFileEntry) => void): void;
      retainEntry(entry: ChromeFileEntry): string;
    };
    runtime: {lastError?: {string: string}};
  };

  interface Window {
    _ESClass: typeof _ESClass;
    defined_classes: ESClassRegistryEntry[];

    Vector2: typeof vectormath.Vector2;
    Vector3: typeof vectormath.Vector3;
    Vector4: typeof vectormath.Vector4;
    Matrix4: typeof vectormath.Matrix4;
    Quat: typeof vectormath.Quat;

    coverage: CoverageModule;
    /* The two hooks the coverage-instrumented build calls on every line. */
    $cov_prof(file: string, line: number): void;
    $cov_reg(file: string, line: number): void;

    g_app_state: AppState;
    _appstate: AppState;
    the_global_dag: EventDag | undefined;
    theEventGraph: EventDag | undefined;

    AppState: typeof AppState;
    Context: typeof FullContext;
    DataRef: typeof DataRef;
    __dataref: typeof DataRef;
    SavedContext: typeof SavedContext;
    Icons: typeof Icons;
    charmap: typeof charmap;
    charmap_rev: typeof charmap_rev;
    error_dialog: PlatformErrorDialog;
    TouchEventManager: typeof TouchEventManager;
    touch_manager: typeof touch_manager;

    _NodeBase: typeof import("./core/eventdag.js").NodeBase;
    _SplineDrawer: typeof import("./curve/spline_draw_new.js").SplineDrawer;
    MyKeyboardEvent: typeof import("./editors/events.js").MyKeyboardEvent;
    MyMouseEvent: typeof import("./editors/events.js").MyMouseEvent;
    imagecanvas_webgl: typeof import("./paint/imagecanvas_webgl.js");

    /* The per-platform config.js overrides; only ORIGIN is ever honoured. */
    _platform_config?: {[k: string]: string};

    /* Set by the electron platform layer for manual zoom testing. */
    setZoom(z: number): void;

    /*
     * NOTE: _ensure_thedimens()'s body is entirely commented out, so theWidth
     * and theHeight are never assigned and the on_resize() call in startup.ts
     * that reads them passes undefined. That path is CHROME_APP_MODE-only.
     */
    _ensure_thedimens(): void;
    theWidth: number;
    theHeight: number;

    /* Flat color maps the theme publishes for the data api. */
    uicolors: {[key: string]: number[]};
    colors3d: {[key: string]: number[]};

    anim_to_playback: AnimPlaybackBuffer;

    import_json(): void;
    _dom_input_node: HTMLElement | null;
    _testParseFile(): void;
    loadCanvasKit(): Promise<unknown>;

    /* Per-render-start timestamps, keyed by the redraw source's name. */
    redraw_start_times: {[k: string]: number};

    /*
     * Debug-console scratch. Every one of these is both written and read by
     * live code, which is why they are here rather than left off as the
     * header describes.
     */
    _d?: number;
    d: number;
    th: HTMLElementTagNameMap["theme-editor-x"];
    tb: HTMLInputElement;
    CC: import("./vectordraw/vectordraw_base.js").DrawCanvas | undefined;
    GG: Canvas2D | undefined;
    skcanvas: import("./vectordraw/vectordraw_base.js").DrawCanvas | undefined;
    skg: Canvas2D | undefined;

    /* The one shared WebGL context, created by imagecanvas_webgl.ts and used
       as the default argument of its own resource-lifecycle methods. */
    _gl: import("./webgl/webgl.js").WebGLContext;
    KSCALE: number;
    /* Rate-limiter timestamp for a warning in spline_types.ts. */
    __adssad: number;
    _setDebug(d: number): void;
    _do_frame_debug: boolean;
    _do_iter_err_stacktrace: boolean;
    FrameContinue: {FC: number};
    FrameBreak: {FB: number};

    /* core/ajax.ts's net API; see the bare-name declarations further down. */
    NetStatus: {new (): NetStatus};
    NetJob: typeof NetJob;
    api_exec: typeof api_exec;
    call_api: typeof call_api;
    create_folder: NetApiGen;
    get_user_info: NetApiGen;
    get_dir_files: NetApiGen;
    upload_file: NetApiGen;
    get_file_data: NetApiGen;
    AuthSessionGen: (job: NetJob, user: string, password: string,
                     refresh_token?: string) => Generator;
    auth_session: (user: string, password: string, finish?: Function,
                   error?: Function, status?: Function) => object;

    RELEASE: boolean;
    DEBUG: {[k: string]: boolean};
    _DEBUG: {[k: string]: boolean | number};
    IsMobile: boolean;

    /* Only ever called from inside nstructjs schema strings, which the struct
       evaluator resolves against the global scope. */
    obj_values_to_array<T>(obj: {[k: string]: T}): T[];
    CHROME_APP_MODE: boolean;
    UNIT_TESTER: boolean;
    /* Set by src/core/startup/typelogger.ts. utils.ts leaves Array's iterator
       alone when it is on, so the logger can see every iteration. */
    TYPE_LOGGING_ENABLED: boolean;

    g_app_version: number;
    fairmotion_file_ext: string;
    fairmotion_settings_filename: string;

    FEATURES: {save_toolstack: boolean};
    use_octree_select: boolean;
    fuzzy_ui_press_hotspot: number;
    new_api_parser: boolean;
    NO_CACHE: boolean;
    FANCY_JOINS: boolean;
    MAX_THREADS: number;

    default_ui_font_size: number;
    menu_text_size: number;
    ui_hover_time: number;

    inFromStruct: boolean;

    redraw_viewport_lock: number;
    _block_drawing: number;
    _wait_for_draw: boolean;
    _fps: number;
    _stime: number;

    _SOLVING: boolean;
    _solve_idgen: number;
    _cacherings: unknown[];
    _killscreen_handlers: KillscreenCallback[];

    /* Debugging leftovers: the last file <input> and the last download <a>
       the fileapi backends built. Nothing reads them back. */
    finput: HTMLInputElement;
    _link: HTMLAnchorElement;
    _send_killscreen(): void;

    /* The addon loader's module wrapper. Only ever called from the source
       parseFile() generates and loadModule() eval()s. */
    _addon_define(fileid: number, path: string, deps: string[],
                  func: AddonModuleCallback): void;

    /* The unpatched DOM methods, saved before redraw_globals.ts replaces them. */
    _addEventListener: typeof window.addEventListener;
    _removeEventListener: typeof window.removeEventListener;

    redraw_viewport(): Promise<void> | undefined;
    redraw_all(): void;
    redraw_all_full(): void;
    redraw_webgl(): void;
    force_viewport_redraw(): void;
    complete_viewport_draw(tries?: number): void;
    _all_draw_jobs_done(): void;
    reshape(gl: WebGLRenderingContext): void;

    init_struct_packer(): void;
    init_toolop_structs(): void;
    init_event_graph(ctx: FullContext): void;
    init_redraw_globals(): void;
    init_redraw_globals_2(): void;
    init_theme(): void;
    updateDataGraph(force?: boolean): void;
    updateEventDag(force?: boolean): void;

    push_solve(spline: Spline): number;
    pop_solve(id: number): void;

    /* Swallows the browser's own shortcut for keys the app binds itself.
       Installed by core/startup/startup.ts, called bare from its own listener. */
    _handle_key_exclude(e: KeyboardEvent): void;

    parseToolPath(path: string): {name: string; args: {[k: string]: string}};

    safe_global: {[k: string]: unknown};
    istruct: import("nstructjs").STRUCT;
    _struct_scripts: string;
    _fstructs: string;
    STRUCT_ENDIAN: boolean;

    myLocalStorage: MyLocalStorage;
    MyLocalStorage_LS: new () => MyLocalStorage;
    MyLocalStorage_ChromeApp: new () => MyLocalStorage;
    save_local_storage(): void;

    _my_object_keys(obj: object): string[];
    _settings_manager: import("./core/UserSettings.js").SettUploadManager;

    /* The live theme, plus the two ColorThemes init_theme() builds it from.
       theme.ts keeps a .original copy of each so the defaults can be restored. */
    g_theme: Theme;
    UITheme: ColorTheme;
    View2DTheme: ColorTheme;

    /* esprima is a UMD bundle loaded as a plain script; safe_eval.ts parses
       STRUCT helper expressions with it. */
    esprima: {parse(code: string): {body: object[]}};

    /* One inputs/outputs entry of a serialized ToolOp. Published on window
       because the generated STRUCT scripts name it by bare identifier. */
    PropPair: typeof import("./core/toolops_api.js").PropPair;

    /* Same reason: CollectionProperty's STRUCT script names BlankArray directly. */
    BlankArray: typeof import("./core/toolprops.js").BlankArray;

    /* The two tool-property container base classes. Published so multiple-
       inheritance mixins elsewhere can name them without an import. */
    TPropIterable: typeof import("./core/toolprops_iter.js").TPropIterable;
    TCanSafeIter: typeof import("./core/toolprops_iter.js").TCanSafeIter;

    startup(): void;
    startup_intern(): void;
    startup_file_example: string;
    gen_default_file(size?: number[], force_new?: boolean): void;

    /* Loads the embedded startup file; console helper, no callers in-tree. */
    test_load_file(): void;

    /*
     * Registry of live 2D canvases, keyed by canvas name. Each entry pairs the
     * canvas with the owner that can tear it down. Nothing writes it any more --
     * AppState.reset_state() only drains it -- so it is always empty in practice.
     */
    active_canvases: {[name: string]: [unknown, {kill_canvas(name: string): void}]};

    /* Debug entry points. window.__fm is the handle the Playwright specs
       drive the app through; the _test* ones are console helpers. */
    __fm: typeof import("./core/debug_api.js").debug_api;
    _testLoadFile(exts?: string[]): void;
    _testSaveFile(): void;
    _testAddons(): void;

    /* Console handles for the WebGL layer. Written once at module scope and
       never read back in-tree, but the writes still need a declared member. */
    _ShaderDef: {[name: string]: import("./webgl/webgl.js").ShaderDef};
    _Shaders: {[name: string]: import("./webgl/webgl.js").ShaderProgram};
    _ShaderProgram: typeof import("./webgl/webgl.js").ShaderProgram;
    /* GL enum value -> its name, built by init_webgl() off the live context. */
    _constmap: {[value: number]: string};
    /* _Shapes and _ShapeOBJs are deliberately absent: simplemesh_shapes.ts is
       one unassigned template literal, so nothing in it runs. */
    glRanges: {[gltype: number]: number[]};
    debugproxy(data: number[], min?: number, max?: number, isint?: boolean): number[];

    /* Assigned by the wasm and CanvasKit loaders once their modules resolve. */
    CanvasKit: unknown;
    wasmBinaryFile: string | undefined;
    /* Set under node only; the browser hands emscripten a path instead. */
    solverwasm_binary: ArrayBufferView | undefined;
    wasm_do_solve: typeof import("./wasm/native_api.js").do_solve;
    /* Console kill switch for the solver, checked alongside config.DISABLE_SOLVE.
       Never assigned in-tree, so it is undefined until someone sets it. */
    DISABLE_SOLVE: boolean | undefined;

    /* Called from inside the wasm module to hand a reply back to JS. `ptr` and
       `len` address the message in the wasm heap. */
    _wasm_post_message(type: number, ptr: number, len: number): void;

    /* curve/bspline.ts's symbolic basis-function generator. All of it is
       console-facing; the app itself only calls basis() and deBoor(). */
    tot_symcls: number;
    _sym_eps1: number;
    _sym_eps2: number;
    _sym_do_clamping: boolean;
    _sym_more_symbolic: boolean;
    sym: typeof import("./curve/bspline.js").sym;
    get_cache: typeof import("./curve/bspline.js").get_cache;
    store_cache: typeof import("./curve/bspline.js").store_cache;
    get_basis_dv_func: typeof import("./curve/bspline.js").get_basis_dv_func;
    splitline(dv_test: string): string;
    pack_float(f: number): string;
    precheck(key: string): string;
    test_sym(): void;
    load_seven(): void;
    tree_func: [Function, Function | undefined, string, string, symcls];
    test(s: number, j?: number): void;

    /* bspline's string pool, both directions. */
    _str_idhash: {[hash: string]: number};
    _str_idhash_rev: {[id: number]: string};
    /* Two debugging handles optimize() leaves behind per run. */
    haskeys: hashtable<number, hashtable<number, number>>;
    dag: symcls[];

    /* A fixed table of pseudo-random numbers, and a cursor into it. Neither is
       read anywhere. */
    _jit: number[];
    _jit_cur: number;
  }

  /* Legacy datablock lookup used inside STRUCT helper expressions, where the
     only thing in scope is `safe_global`. */
  const __dataref: typeof DataRef;

  /* lib_api.ts publishes DataRef on window; ajax.ts and the STRUCT scripts
     construct it by the bare name. */
  const DataRef: typeof import("./core/lib_api.js").DataRef;
  type DataRef = import("./core/lib_api.js").DataRef;

  /* toolprops_iter.ts publishes this on window; lib_utils.ts names it bare in
     its mixin() call rather than importing it. */
  const TPropIterable: typeof import("./core/toolprops_iter.js").TPropIterable;
  type TPropIterable = import("./core/toolprops_iter.js").TPropIterable;

  /*
   * The net API in core/ajax.ts. Everything there is assigned onto window and
   * called bare -- from inside ajax.ts itself, and from UserSettings.ts and
   * editors/app_ops.ts, which still POST files through it.
   */
  class NetStatus {
    progress: number;
    status_msg: string;
    cancel: boolean;
    /* Set when the api generator, not XMLHttpRequest, is driving `progress`. */
    _client_control: boolean;
  }

  type NetJob = import("./core/ajax.js").NetJob;
  const NetJob: typeof import("./core/ajax.js").NetJob;

  /* Every api endpoint is a generator: it fires api_exec() and yields until the
     XMLHttpRequest callback pumps it. */
  type NetApiGen = (job: NetJob, args?: {[k: string]: unknown}) => Generator;

  function api_exec(
    path: string,
    netjob: NetJob,
    mode?: string,
    data?: Document | XMLHttpRequestBodyInit,
    mime?: string,
    extra_headers?: {[k: string]: string},
    responseType?: XMLHttpRequestResponseType
  ): void;

  function call_api(
    iternew: NetApiGen,
    args: {[k: string]: unknown},
    finishcb?: Function,
    errorcb?: Function,
    status?: Function
  ): Promise<unknown>;

  const create_folder: NetApiGen;
  const get_user_info: NetApiGen;
  const get_dir_files: NetApiGen;
  const upload_file: NetApiGen;
  const get_file_data: NetApiGen;

  /*
   * Classes and enums parked on window by the module that defines them, then
   * named bare elsewhere. Same two-declaration rule as above: the Window member
   * types `window.Foo`, the const types `Foo`.
   */
  const Context: typeof FullContext;
  const SavedContext: typeof import("./core/AppState.js").SavedContext;
  const Icons: typeof import("./datafiles/icon_enum.js").Icons;
  const charmap: {[k: string]: number};
  const charmap_rev: {[k: number]: string};
  const error_dialog: PlatformErrorDialog;
  const TouchEventManager: typeof import("./editors/events.js").TouchEventManager;
  const touch_manager: import("./editors/events.js").TouchEventManager;

  /*
   * error_dialog is app.errorDialog, which takes (title, msg). Every caller in
   * editors/app_ops.ts passes (ctx, title, undefined, true) instead, so the
   * context object is printed as the title. See docs/debugging.md.
   */
  type PlatformErrorDialog = (title: unknown, msg?: unknown, ...rest: unknown[]) => void;

  /* The captured-frame buffer view2d_spline_ops.ts fills during an anim
     render. The two extra fields are stamped onto the array itself. */
  interface AnimPlaybackBuffer
    extends Array<import("./editors/viewport/view2d_spline_ops.js").PlaybackFrame> {
    filesize: number;
    viewport?: import("./editors/viewport/view2d_spline_ops.js").PlaybackViewport;
  }

  /*
   * Every editor and widget is a custom element, and the code reaches for them
   * with document.createElement("...-x") rather than `new`. Without this map
   * that expression is typed HTMLElement and every subsequent property access
   * is an error. Only the tags fairmotion itself constructs are listed; path.ux
   * builds its own through UIBase.
   */
  interface HTMLElementTagNameMap {
    "fairmotion-screen-x": import("./editors/editor_base.js").FairmotionScreen;
    "screenarea-x": import("./path.ux/scripts/screen/ScreenArea.js").ScreenArea;
    "container-x": import("./path.ux/scripts/core/ui.js").Container;
    "menu-x": import("./path.ux/scripts/widgets/ui_menu.js").Menu;
    "noteframe-x": import("./path.ux/scripts/widgets/ui_noteframe.js").NoteFrame;
    "theme-editor-x": import("./path.ux/scripts/widgets/theme_editor.js").ThemeEditor;

    "view2d-editor-x": import("./editors/viewport/view2d.js").View2DHandler;
    "console-editor-x": import("./editors/console/console.js").ConsoleEditor;
    "curve-editor-x": import("./editors/curve/CurveEditor.js").CurveEditor;
    "curve-edit-x": import("./editors/curve/CurveEditor.js").CurveEdit;
    "docs-browser-x": import("./editors/manual/manual.js").ManualEditor;
    "dopesheet-editor-x": import("./editors/dopesheet/DopeSheetEditor.js").DopeSheetEditor;
    "dopesheet-treeitem-x": import("./editors/dopesheet/DopeSheetEditor.js").TreeItem;
    "dopesheet-treepanel-x": import("./editors/dopesheet/DopeSheetEditor.js").TreePanel;
    "material-editor-x": import("./editors/material/MaterialEditor.js").MaterialEditor;
    "last-tool-panel-fairmotion-x": import("./editors/material/MaterialEditor.js").MyLastToolPanel;
    "menubar-editor-x": import("./editors/menubar/MenuBar.js").MenuBar;
    "opstack-editor-x": import("./editors/ops/ops_editor.js").OpStackEditor;
    "settings-editor-x": import("./editors/settings/SettingsEditor.js").SettingsEditor;
    "id-browser-x": import("./editors/widgets.js").IDBrowser;
    "image-user-panel-x": import("./editors/widgets.js").ImageUserPanel;
  }

  interface SymbolConstructor {
    /* Installed by src/util/polyfill_fairmotion.ts. */
    readonly keystr: unique symbol;
  }

  /* Anything that can go into a `set` or a `hashtable` (src/util/utils.ts):
     it hashes to whatever [Symbol.keystr]() returns. Base implementations for
     Number/String/Array live in src/util/utils.ts; classes that go into a set
     supply their own. A few return a number rather than a string, so the
     contract is only "usable as an object key". */
  interface Keyable {
    [Symbol.keystr](): string | number;
  }

  /* Repeated onto the primitive wrappers so they stay assignable to Object --
     merging the member into Object alone would make `string` and `number` no
     longer satisfy it. Spelled out rather than `extends Keyable`, which drags
     the lib interfaces out of their special-cased assignability rules. */
  interface Object {
    [Symbol.keystr](): string | number;
  }
  interface Number {
    [Symbol.keystr](): string | number;
  }
  interface String {
    [Symbol.keystr](): string | number;
  }
  interface Boolean {
    [Symbol.keystr](): string | number;
  }

  interface Array<T> {
    /* Added by src/util/polyfill_fairmotion.ts and typesystem.ts. */
    remove(item: T, throw_error?: boolean): this;
    pop_i(idx: number): T;
    /* src/util/utils.ts installs this on Array.prototype and then copies it
       over every TypedArray.prototype, so it shadows the native
       `set(src, offset)` -- the second argument here is a *source* offset. */
    set(array: ArrayLike<T>, src?: number, dst?: number, count?: number): this;
    insert(before: number, item: T): this;
    reject(func: (item: T) => boolean): T[];
    /* Added by core/ajax.ts, along with the Number and String versions below.
       Appends this value to a byte array in the legacy network encoding. */
    pack(data: number[]): void;
  }

  interface Number {
    pack(data: number[]): void;
  }

  interface String {
    pack(data: number[]): void;
    toUTF8(): number[];
    /* Added by src/util/polyfill_fairmotion.ts, which predates String.includes.
       Only get_type_name() in that same file still calls it. */
    contains(str: string): boolean;
  }

  interface Math {
    /* Added by src/util/utils.ts. */
    fract(f: number): number;
  }
}

export {};
