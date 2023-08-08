const {app, BrowserWindow, ipcMain} = require('electron');
const Store = require('electron-store');
const store = new Store();

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


app.whenReady().then(()=>{
    createWindow()

  // Listen for the remove-api-key event
    ipcMain.on('remove-api-key', () => {
    store.delete('apiKey'); // Remove the API key from the Electron Store
  });
    // Update API key
    let newApiKey = 'sk-aJHMApVMVROaWgqcU7w7FpusOWI49ugz2re4Rw1BycRdAd';

    ipcMain.on('update-api-key', (event, newApiKey) => {
        store.set('apiKey', newApiKey); // Save the new API key to the Electron Store
        event.reply('update-api-key-reply', 'API key updated successfully');
    });

    // Retrieve API key
    ipcMain.on('get-api-key', (event) => {
        const apiKey = store.get('apiKey'); // Retrieve the API key from the Electron Store
        event.reply('get-api-key-reply', apiKey);
    });
});