const {app, BrowserWindow} = require('electron');
console.warn("Main Process");
app.disableHardwareAcceleration();
const createWindow = ()=>{
    const win = new BrowserWindow({
        maxwidth : 800,
        maxheight : 600,
    //     movable: true,
    // resizable: false,
    // maximizable: true,
    // minimizable: false,
        title : "AI Art Generator",
        webPreferences : {
            nodeIntegration : true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    })
    win.loadFile('index.html');

    win.webContents.on('did-finish-load', () => {
        win.webContents.send('enable-node-integration');
      });
}


app.whenReady().then(createWindow);