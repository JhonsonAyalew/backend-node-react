const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow(x, y) {
  return new BrowserWindow({
    width: 500,
    height: 700,
    x,    // window horizontal position
    y,    // window vertical position
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
}

app.whenReady().then(() => {
  // Create first window at top-left corner
  const win1 = createWindow(0, 0);
  win1.loadFile('dist/index.html');

  // Create second window next to the first window
  const win2 = createWindow(510, 0);
  win2.loadFile('dist/index.html');

  // Optional: open DevTools for debugging
  // win1.webContents.openDevTools();
  // win2.webContents.openDevTools();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
