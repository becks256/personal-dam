// dam/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dam', {
  getAssets:   (query)         => ipcRenderer.invoke('assets:get', query),
  getAssetById:(id)            => ipcRenderer.invoke('assets:getById', id),
  updateAsset: (id, update)    => ipcRenderer.invoke('assets:update', { id, update }),
  addTag:      (assetId, tag)  => ipcRenderer.invoke('tags:add', { assetId, tag }),
  removeTag:   (assetId, tag)  => ipcRenderer.invoke('tags:remove', { assetId, tag }),
  getAllTags:   ()              => ipcRenderer.invoke('tags:getAll'),
  startCrawl:  (paths)         => ipcRenderer.invoke('crawler:start', paths),
  stopCrawl:   ()              => ipcRenderer.invoke('crawler:stop'),
  getSettings: ()              => ipcRenderer.invoke('settings:get'),
  saveSettings:(settings)      => ipcRenderer.invoke('settings:save', settings),
  selectDirectory: ()          => ipcRenderer.invoke('dialog:selectDir'),
  onCrawlerProgress: (cb) => {
    const handler = (_event, progress) => cb(progress);
    ipcRenderer.on('crawler:progress', handler);
    return () => ipcRenderer.removeListener('crawler:progress', handler);
  },
});
