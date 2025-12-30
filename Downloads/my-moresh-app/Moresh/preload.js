const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendPeerData: (data) => ipcRenderer.send('peer-data', data),
  receivePeerData: (callback) => {
    ipcRenderer.on('peer-data', (event, data) => callback(data));
  },
  getWindowId: () => window.windowId
});
