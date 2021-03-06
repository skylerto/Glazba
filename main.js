// 'use strict';

const Video = require('./app/lib/Video.js');
const fs = require('fs');
const electron = require('electron');
const path = require('path');
const Menu = require('menu');
const app = electron.app; // Module to control application life.
const BrowserWindow = electron.BrowserWindow; // Module to create native browser window.
const ipc = electron.ipcMain;

app.commandLine.appendSwitch('remote-debugging-port', '8315');
app.commandLine.appendSwitch('host-rules', 'MAP * 127.0.0.1');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', () => {
  const downloadPath = `${app.getPath('userData')}/talks`;
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath);
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({
    frame: false,
    height: 600,
    resizable: false,
    width: 800,
  });

  // and load the index.html of the app.
  mainWindow.loadURL(path.join('file://', __dirname, '/app/index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create the Application's main menu
  const template = [{
    label: 'Application',
    submenu: [{
      label: 'About Application',
      selector: 'orderFrontStandardAboutPanel:',
    }, {
      type: 'separator',
    }, {
      label: 'Quit',
      accelerator: 'Command+Q',
      click: () => {
        app.quit();
      },
    }],
  }, {
    label: 'Edit',
    submenu: [{
      label: 'Undo',
      accelerator: 'CmdOrCtrl+Z',
      selector: 'undo:',
    }, {
      label: 'Redo',
      accelerator: 'Shift+CmdOrCtrl+Z',
      selector: 'redo:',
    }, {
      type: 'separator',
    }, {
      label: 'Cut',
      accelerator: 'CmdOrCtrl+X',
      selector: 'cut:',
    }, {
      label: 'Copy',
      accelerator: 'CmdOrCtrl+C',
      selector: 'copy:',
    }, {
      label: 'Paste',
      accelerator: 'CmdOrCtrl+V',
      selector: 'paste:',
    }, {
      label: 'Select All',
      accelerator: 'CmdOrCtrl+A',
      selector: 'selectAll:',
    }],
  }];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));


  ipc.on('download', (event, url) => {
    const dl = new Video(url, downloadPath);
    dl.download(() => {
      event.sender.send('download-reply', `${dl.title}`);
      console.log(`downloading: ${dl.title}`);
    });
  });

  ipc.on('load-track', (event, track) => {
    const filepath = `${downloadPath}/${track}.m4a`;
    event.sender.send('load-track-reply', filepath);
  });

  ipc.on('get-files', (event) => {
    const files = fs.readdirSync(downloadPath);
    event.sender.send('get-files-reply', files);
  });
});
