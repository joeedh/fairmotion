// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

require("v8").setFlagsFromString('--expose-gc');
require("v8").setFlagsFromString('--expose-gc-as gc');
require("v8").setFlagsFromString('--expose_gc');
require("v8").setFlagsFromString('--expose_gc-as gc');

const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')

const {ipcMain, Menu, MenuItem} = require('electron')

function makeInvoker(event, callbackKey, getargs = (args) => {
  args
}) {
  return function () {
    let args = getargs(arguments);
    console.log("ARGS", args);

    win.webContents.send('invoke-menu-callback', callbackKey, args);
  }
}

function loadMenu(event, menudef) {
  console.log("MENU", menudef);

  let menu = new Menu();

  for (let item of menudef) {
    if (item.submenu) {
      item.submenu = loadMenu(event, item.submenu);
    }

    if (item.click) {
      item.click = makeInvoker(event, item.click, (args) => [args[0].id]);
    }

    item = new MenuItem(item);

    menu.append(item);
  }

  return menu;
}

let menus = {};
let menuBarId = undefined;

// Main
ipcMain.handle('popup-menu', async (event, menu, x, y, callback) => {
  let id = menu._ipcId;

  callback = makeInvoker(event, callback);
  menu = loadMenu(event, menu);

  menus[id] = menu;
  menu.popup({x, y, callback});
});

ipcMain.handle('close-menu', async (event, menuid) => {
  menus[menuid].closePopup(win);
});

ipcMain.handle('set-menu-bar', async (event, menu) => {
  let id = menu._ipcId;

  menu = loadMenu(event, menu);

  if (menuBarId !== undefined) {
    delete menus[menuBarId];
  }

  menus[id] = menu;
  menuBarId = id;

  Menu.setApplicationMenu(menu);
});

ipcMain.handle('show-open-dialog', async (event, args, then, catchf) => {
  let dialog = require('electron').dialog;

  dialog.showOpenDialog(args).then(makeInvoker(event, then, (args) => {
    let e = {
      filePaths: args[0].filePaths,
      cancelled: args[0].cancelled,
      canceled : args[0].canceled
    };

    return [e];
  })).catch(makeInvoker(event, catchf));
});

ipcMain.handle('show-save-dialog', async (event, args, then, catchf) => {
  let dialog = require('electron').dialog;

  dialog.showSaveDialog(args).then(makeInvoker(event, then, (args) => {
    let e = {
      filePath: args[0].filePath,
      cancelled: args[0].cancelled,
      canceled : args[0].canceled
    };

    return [e];
  })).catch(makeInvoker(event, catchf));
});

ipcMain.handle('quit-fairmotion', async(event) => {
  app.quit();
});

app.commandLine.appendSwitch("no-sandbox");
app.commandLine.appendSwitch("enable-unsafe-webgpu");

/*
 * A file to open on startup, from the command line:
 *
 *   fairmotion "path/to/scene.fmo"
 *   fairmotion --file="path/to/scene.fmo"
 *
 * `electron .` puts the app directory in argv, so skip it in dev mode. The
 * resolved path is handed to the renderer as --fm-open-file=<abs path>; see
 * ElectronPlatformAPI.getStartupFilePath().
 */
function parseFileArg(argv) {
  /* process.defaultApp is set when run as `electron <appdir>`; that appdir is
     argv[1] and is not a file to open. */
  let args = process.defaultApp ? argv.slice(2) : argv.slice(1);

  for (let arg of args) {
    if (arg.startsWith("--file=")) {
      return arg.slice("--file=".length);
    }

    /* Chromium's own switches all start with '-'. */
    if (!arg.startsWith("-")) {
      return arg;
    }
  }

  return undefined;
}

let startupFile = parseFileArg(process.argv);

if (startupFile !== undefined) {
  startupFile = path.resolve(startupFile);

  if (!require("fs").existsSync(startupFile)) {
    console.error(`fairmotion: no such file: ${startupFile}`);
    startupFile = undefined;
  }
}

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width          : 1024,
    height         : 768,
    webPreferences : {
      preload                   : "preload.js",
      nodeIntegration           : true,
      experimentalFeatures      : true,
      experimentalCanvasFeatures: true,
      enableRemoteModule        : true,
      contextIsolation          : false,
      nodeIntegrationInSubFrames: true,
      additionalArguments       : [
        "--no-sandbox",
        "--enable-unsafe-webgpu",
        ...(startupFile !== undefined ? [`--fm-open-file=${startupFile}`] : []),
      ],
      sandbox                   : false
    },
    darkTheme      : true,
    backgroundColor: "#555555"
    //titleBarStyle : "hidden-inset",
    //frame : false
  });

  win.setMenu(null);

  // Open the DevTools.
  win.webContents.openDevTools()

  //set window global
  global.window = global;

  global.quit_app = function () {
    app.quit();
  }

  //we're not on mobile
  window.mobilecheck = function () {
    return false;
  }
  window.IsMobile = false;
  window.electron_app = app;

  //do main startup
  window.ELECTRON_APP = true;

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  // and load the index.html of the app.

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes : true
  }));

  win.maximize();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.