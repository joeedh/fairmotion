require("v8").setFlagsFromString('--expose-gc');
require("v8").setFlagsFromString('--expose-gc-as gc');
require("v8").setFlagsFromString('--expose_gc');
require("v8").setFlagsFromString('--expose_gc-as gc');

const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')

app.commandLine.appendSwitch("no-sandbox");
app.commandLine.appendSwitch("enable-unsafe-webgpu");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences : {
      nodeIntegration: true,
      preload : "preload.js",
      experimentalFeatures : true,
      experimentalCanvasFeatures : true,
      enableRemoteModule : true,
      contextIsolation : false,
      nodeIntegrationInSubFrames : true,
      additionalArguments : ["--no-sandbox", "--enable-unsafe-webgpu"],
      sandbox : false
    },
    darkTheme : true,
    backgroundColor : "#555555",
    //titleBarStyle : "hidden-inset",
    //frame : false
});

  win.setMenu(null);
  
  // Open the DevTools.
  win.webContents.openDevTools()

  //set window global
  global.window = global;
  
  global.quit_app = function() {
    app.quit();
  }
  
  //we're not on mobile
  window.mobilecheck = function() {
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
    slashes: true
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