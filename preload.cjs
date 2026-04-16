// dam/preload.cjs
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('dam', { ping: () => 'pong' });
